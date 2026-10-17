import {PublicError,MAX_SHARED_FILE,publicLabel,canonicalMetadata,windowStart,parseList} from './community-validation.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
async function limit(db,user,action,now,seconds,max){
 const win=Math.floor(now/(seconds*1000)),key=user+':'+action;
 const row=await db.prepare('INSERT INTO write_limits(user,window,count) VALUES(?,?,1) ON CONFLICT(user) DO UPDATE SET window=excluded.window,count=CASE WHEN write_limits.window=excluded.window THEN write_limits.count+1 ELSE 1 END RETURNING count').bind(key,win).first();
 if(row.count>max)throw new PublicError('A little pause: you have made several requests. Please try again later.',429);
}
const select=`SELECT t.id,t.title,t.artist,t.created,t.duration,t.bytes,
 (SELECT COUNT(*) FROM likes l WHERE l.track=t.id AND l.active=1) AS likes,
 (SELECT COUNT(*) FROM likes l WHERE l.track=t.id AND l.active=1 AND l.created>=?) AS score,
 EXISTS(SELECT 1 FROM likes l WHERE l.track=t.id AND l.user=? AND l.active=1) AS liked,
 t.owner=? AS mine FROM tracks t`;
function trackRow(row){return {...row,liked:!!row.liked,mine:!!row.mine};}
/** @param {string|null} user */
export async function communityRequest(request,env,user=null,{now=Date.now()}={}){
 let reader;
 try{
  if(!env.DB||!env.BUCKET)throw new PublicError('The shared library is not available yet. Your browser library is still safe.',503);
  const url=new URL(request.url),parts=url.pathname.replace(/^\/api\/community\/?/,'').split('/').filter(Boolean),method=request.method,db=env.DB,bucket=env.BUCKET;
  if(!['GET','HEAD'].includes(method)){
   if(!user)throw new PublicError('Sign in with ChatGPT to share a performance or like a track.',401);
   if(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site')throw new PublicError('Please make this request from Chromaflow.',403);
  }
  if(method==='GET'&&parts[0]==='me')return json({signedIn:!!user,signIn:'/signin-with-chatgpt?return_to=%2F%23community',signOut:'/signout-with-chatgpt?return_to=%2F%23community',maxBytes:MAX_SHARED_FILE});
  if(parts[0]!=='tracks')throw new PublicError('Not found.',404);
  if(parts.length===1&&method==='GET'){
   const {window,sort,page}=parseList(url),since=windowStart(window,now);
   if(sort==='mine'&&!user)throw new PublicError('Sign in to see your shared tracks.',401);
   const rows=await db.prepare(select+(sort==='mine'?' WHERE t.owner=?':'')+(sort==='popular'?' ORDER BY score DESC,likes DESC,t.created DESC,t.id DESC':' ORDER BY t.created DESC,t.id DESC')+' LIMIT 21 OFFSET ?').bind(since,user||'',user||'',...(sort==='mine'?[user]:[]),page*20).all();
   return json({tracks:rows.results.slice(0,20).map(trackRow),hasMore:rows.results.length>20,window,sort,page});
  }
  if(parts.length===1&&method==='POST'){
   await limit(db,user,'upload',now,3600,4);
   const title=publicLabel(decodeHeader(request,'x-track-title'),'track title',80),artist=publicLabel(decodeHeader(request,'x-artist-name'),'artist name',40);
   if(request.headers.get('content-type')!=='application/json')throw new PublicError('Only Chromaflow session data can be shared. Audio uploads are not accepted.');
   const size=Number(request.headers.get('x-file-size'));
   if(!Number.isInteger(size)||size<2||size>MAX_SHARED_FILE)throw new PublicError('Session data can be up to 8 MB. Record a shorter loop; your original stays in your browser.',413);
   const count=await db.prepare('SELECT COUNT(*) AS count FROM tracks WHERE owner=?').bind(user).first();
   if(count.count>=50)throw new PublicError('You have 50 shared tracks. Remove an older one before sharing another.',409);
   if(!request.body)throw new PublicError('The session is missing.');
   reader=request.body.getReader();const chunks=[];let received=0;
   while(true){const {value,done}=await reader.read();if(done)break;received+=value.byteLength;if(received>size||received>MAX_SHARED_FILE)throw new PublicError('The session exceeds its declared size.',413);chunks.push(value);}
   if(received!==size)throw new PublicError('The session upload was interrupted.');
   const bytesIn=new Uint8Array(received);let offset=0;for(const chunk of chunks){bytesIn.set(chunk,offset);offset+=chunk.byteLength;}
   let raw;try{raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytesIn));}catch{throw new PublicError('The session file could not be read. Audio files are not accepted.');}
   const id=crypto.randomUUID(),meta=canonicalMetadata(raw,title,id,now),data=new TextEncoder().encode(JSON.stringify(meta));
   if(data.length>MAX_SHARED_FILE)throw new PublicError('The session timeline is too large to share.',413);
   const key='sessions/'+id+'.chromaflow';await bucket.put(key,data,{httpMetadata:{contentType:'application/json'}});
   try{await db.prepare('INSERT INTO tracks(id,owner,title,artist,object_key,created,duration,bytes) VALUES(?,?,?,?,?,?,?,?)').bind(id,user,title,artist,key,now,Math.round(meta.duration*1000),data.length).run();}catch(e){await bucket.delete(key);throw e;}
   return json({track:{id,title,artist,created:now,duration:Math.round(meta.duration*1000),bytes:data.length,likes:0,score:0,liked:false,mine:true}},201);
  }

  const id=parts[1];if(!uuid.test(id||''))throw new PublicError('Track not found.',404);
  if(parts.length===2&&method==='GET'){
   const track=await db.prepare(select+' WHERE t.id=?').bind(0,user||'',user||'',id).first();if(!track)throw new PublicError('This track is no longer shared.',404);return json({track:trackRow(track)});
  }
  if(parts.length===3&&parts[2]==='performance'&&method==='GET'){
   const row=await db.prepare('SELECT object_key FROM tracks WHERE id=?').bind(id).first();if(!row)throw new PublicError('This track is no longer shared.',404);
   const object=await bucket.get(row.object_key);if(!object)throw new PublicError('This recording is temporarily unavailable.',503);
   return new Response(object.body,{headers:{'Content-Type':'application/json','Content-Length':String(object.size),'Content-Disposition':`attachment; filename="${id}.chromaflow"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  if(parts.length===3&&parts[2]==='like'&&['PUT','DELETE'].includes(method)){
   await limit(db,user,'like',now,60,60);
   // Re-enabling a like keeps its original date, so toggling cannot refresh a chart vote.
   if(method==='PUT'){
    const result=await db.prepare('INSERT INTO likes(track,user,created,active) SELECT ?,?,?,1 WHERE EXISTS(SELECT 1 FROM tracks WHERE id=?) ON CONFLICT(track,user) DO UPDATE SET active=1').bind(id,user,now,id).run();
    if(!result.meta.changes)throw new PublicError('This track is no longer shared.',404);
   }else await db.prepare('UPDATE likes SET active=0 WHERE track=? AND user=?').bind(id,user).run();
   const row=await db.prepare(select+' WHERE t.id=?').bind(0,user,user,id).first();if(!row)throw new PublicError('This track is no longer shared.',404);return json({track:trackRow(row)});
  }
  if(parts.length===2&&method==='DELETE'){
   await limit(db,user,'delete',now,60,20);
   const row=await db.prepare('SELECT object_key FROM tracks WHERE id=? AND owner=?').bind(id,user).first();if(!row)throw new PublicError('Track not found or you do not own it.',404);
   await db.prepare('DELETE FROM tracks WHERE id=? AND owner=?').bind(id,user).run();await bucket.delete(row.object_key);return json({deleted:true});
  }
  throw new PublicError('Not found.',404);
 }catch(e){if(reader)await reader.cancel().catch(()=>{});if(e instanceof PublicError)return json({error:e.message},e.status);console.error('Community storage operation failed',e?.name);return json({error:'The shared library could not complete that request. Please try again.'},503);}
}
function decodeHeader(request,name){try{return decodeURIComponent(request.headers.get(name)||'');}catch{throw new PublicError('The public name or title could not be read.');}}
