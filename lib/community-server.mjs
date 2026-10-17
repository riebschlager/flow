import {PublicError,MAX_SHARED_FILE,MAX_HEADER,publicLabel,canonicalMetadata,windowStart,parseList,sampleScan} from './community-validation.mjs';
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
   if(request.headers.get('content-type')!=='application/octet-stream')throw new PublicError('Share a Chromaflow performance file.');
   const size=Number(request.headers.get('x-file-size'));
   if(!Number.isInteger(size)||size<14||size>MAX_SHARED_FILE)throw new PublicError('Shared performances can be up to 90 MB. Use a shorter take; your original stays in your browser.',413);
   const count=await db.prepare('SELECT COUNT(*) AS count FROM tracks WHERE owner=?').bind(user).first();
   if(count.count>=50)throw new PublicError('You have 50 shared tracks. Remove an older one before sharing another.',409);
   if(!request.body)throw new PublicError('The performance is missing.');
   reader=request.body.getReader();let pending=new Uint8Array(0),received=0;
   async function read(n){const out=new Uint8Array(n);let off=0;while(off<n){if(!pending.length){const {value,done}=await reader.read();if(done)throw new PublicError('The performance upload was interrupted.');received+=value.byteLength;if(received>size)throw new PublicError('The performance file size does not match.');pending=value;}const k=Math.min(n-off,pending.length);out.set(pending.subarray(0,k),off);pending=pending.subarray(k);off+=k;}return out;}
   const prefix=await read(12),headLength=new DataView(prefix.buffer).getUint32(8,true);
   if(new TextDecoder().decode(prefix.subarray(0,8))!=='CFLOOP01'||headLength<2||headLength>MAX_HEADER)throw new PublicError('The recording header is invalid or exceeds the 8 MB sharing limit.');
   let raw;try{raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await read(headLength)));}catch{throw new PublicError('The recording header could not be read.');}
   const id=crypto.randomUUID(),meta=canonicalMetadata(raw,title,id,now),audioBytes=(meta.frames+meta.tailFrames)*8;
   if(12+headLength+audioBytes!==size)throw new PublicError('The recording’s audio length does not match the file.');
   const header=new TextEncoder().encode(JSON.stringify(meta));if(header.length>MAX_HEADER)throw new PublicError('The recording’s timeline is too large to share.');
   const canonicalPrefix=prefix.slice();new DataView(canonicalPrefix.buffer).setUint32(8,header.length,true);
   const key='performances/'+id+'.chromaflow',upload=await bucket.createMultipartUpload(key,{httpMetadata:{contentType:'application/octet-stream'}});
   let finished=false;
   try{
    const partSize=5*1024*1024,partsUploaded=[];let buffer=new Uint8Array(partSize),used=0,number=1;
    async function append(chunk){let at=0;while(at<chunk.length){const n=Math.min(partSize-used,chunk.length-at);buffer.set(chunk.subarray(at,at+n),used);used+=n;at+=n;if(used===partSize){partsUploaded.push(await upload.uploadPart(number++,buffer));buffer=new Uint8Array(partSize);used=0;}}}
    await append(canonicalPrefix);await append(header);
    let left=audioBytes,carry=new Uint8Array(0);
    while(left){const bytes=await read(Math.min(left,256*1024));carry=sampleScan(bytes,carry);await append(bytes);left-=bytes.length;}
    const extra=await reader.read();if(pending.length||!extra.done||carry.length||received!==size)throw new PublicError('The performance file size does not match.');
    if(used)partsUploaded.push(await upload.uploadPart(number,buffer.slice(0,used)));
    await upload.complete(partsUploaded);finished=true;
    const bytes=12+header.length+audioBytes;
    try{await db.prepare('INSERT INTO tracks(id,owner,title,artist,object_key,created,duration,bytes) VALUES(?,?,?,?,?,?,?,?)').bind(id,user,title,artist,key,now,Math.round(meta.frames/meta.sampleRate*1000),bytes).run();}catch(e){await bucket.delete(key);throw e;}
    return json({track:{id,title,artist,created:now,duration:Math.round(meta.frames/meta.sampleRate*1000),bytes,likes:0,score:0,liked:false,mine:true}},201);
   }finally{if(!finished)await upload.abort().catch(()=>{});}
  }
  const id=parts[1];if(!uuid.test(id||''))throw new PublicError('Track not found.',404);
  if(parts.length===2&&method==='GET'){
   const track=await db.prepare(select+' WHERE t.id=?').bind(0,user||'',user||'',id).first();if(!track)throw new PublicError('This track is no longer shared.',404);return json({track:trackRow(track)});
  }
  if(parts.length===3&&parts[2]==='performance'&&method==='GET'){
   const row=await db.prepare('SELECT object_key FROM tracks WHERE id=?').bind(id).first();if(!row)throw new PublicError('This track is no longer shared.',404);
   const object=await bucket.get(row.object_key);if(!object)throw new PublicError('This recording is temporarily unavailable.',503);
   return new Response(object.body,{headers:{'Content-Type':'application/octet-stream','Content-Length':String(object.size),'Content-Disposition':`attachment; filename="${id}.chromaflow"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
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
