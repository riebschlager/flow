import {encodePerformance,decodePerformance,isSession,takeDuration} from './recorder-core.js?rev=gestures-32';
const $=id=>document.getElementById(id),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const duration=ms=>`${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`,mb=n=>(n/1048576).toFixed(1)+' MB';
export function createCommunityController(recorder,{request=fetch,upload=uploadFile,presentation=null}={}){
 let workspace=null,previewTake=null,previewBusy=false;
 let authState='unknown',signedIn=false,window='today',sort='popular',page=0,tracks=[],hasMore=false,loading=false,uploading=false,sharedTake=null,revision=0,actionBusy=false;
 const status=text=>$('communityStatus').textContent=text;
 async function api(path='',options={}){const response=await request('/api/community/'+path,{credentials:'same-origin',signal:AbortSignal.timeout(15000),...options});let data;try{data=await response.json();}catch{throw new Error('The shared library is unavailable. Please try again.');}if(!response.ok)throw new Error(data.error||'The request could not be completed.');return data;}
 async function identity(){
  authState='checking';signedIn=false;syncShare();
  try{const me=await api('me');signedIn=!!me.signedIn;authState=signedIn?'signed-in':'signed-out';}
  catch(e){authState='error';throw e;}
  finally{syncShare();}
 }
 function syncShare(){
  $('communitySignIn').hidden=signedIn;$('communitySignOut').hidden=!signedIn;$('communityAuthStatus').textContent=signedIn?'Signed in · your email stays private.':'Listening is free, no account needed. Sign in to share music or vote with a like.';
  const ready=!!sharedTake&&signedIn&&!uploading&&recorder.phase==='idle';$('sharePublish').disabled=!ready;
  for(const id of ['shareArtist','shareTrackTitle','shareConsent'])$(id).disabled=!signedIn||uploading;
  $('shareForm').hidden=!sharedTake||!signedIn;$('shareSignInGate').hidden=!sharedTake||signedIn;
  $('shareSignIn').hidden=authState==='checking';$('shareAuthRetry').hidden=authState!=='error';
  $('shareSignInMessage').textContent=authState==='checking'?'Checking your account…':authState==='error'?'We couldn’t check your account. Retry, or sign in with ChatGPT to continue. Your saved take is safe in this browser.':'Sharing publicly requires a ChatGPT account. Your saved take stays in this browser. After signing in, review its details and confirm sharing.';
  if(sharedTake)$('shareTakeInfo').textContent=`Selected: ${sharedTake.name} · ${duration(takeDuration(sharedTake)*1000)}. ${signedIn?'Review the details below, then confirm sharing.':'Sign in to share this session publicly.'}`;
 }
 function tabs(){for(const [id,w,s] of [['chartToday','today','popular'],['chartWeek','week','popular'],['chartAll','all','popular'],['chartNewest','all','newest'],['chartMine','all','mine']])$(id).setAttribute('aria-pressed',String(window===w&&sort===s));$('chartDescription').textContent=sort==='newest'?'Freshly shared music, newest first.':sort==='mine'?'The music you’ve shared. Remove a track to take it out of the community library.':window==='today'?'Ranked by likes received since midnight UTC.':window==='week'?'Ranked by likes received over the last seven days.':'Ranked by total likes, from the beginning.';}
 function render(){
  $('communityTracks').innerHTML=tracks.length?tracks.map((t,i)=>`<article class="community-track" data-track="${escape(t.id)}"><span class="track-rank">${sort==='popular'?String(i+1).padStart(2,'0'):'✧'}</span><div><h3 class="track-title">${escape(t.title)}</h3><span class="track-artist">by ${escape(t.artist)}</span><span class="track-meta">${duration(t.duration)} · ${mb(t.bytes)} · ${new Date(t.created).toLocaleDateString()}${sort==='popular'?' · '+Number(t.score)+' '+(window==='all'?'total':window==='today'?'today':'this week')+' likes':''}</span></div><div class="track-actions"><button class="track-play" data-action="play" data-id="${escape(t.id)}" aria-label="Play ${escape(t.title)}">↻ Listen</button><button data-action="like" data-id="${escape(t.id)}" aria-pressed="${!!t.liked}" aria-label="${t.liked?'Unlike':'Like'} ${escape(t.title)}">${t.liked?'♥':'♡'} ${Number(t.likes)}</button><button data-action="fork" data-id="${escape(t.id)}" title="Copy the opening setup and patterns without the recorded performance">Use this setup</button><button data-action="save" data-id="${escape(t.id)}">Save a copy</button><button data-action="present" data-id="${escape(t.id)}">Present ↗</button><button data-action="link" data-id="${escape(t.id)}">Copy link</button>${t.mine?`<button data-action="remove" data-id="${escape(t.id)}">Remove</button>`:''}</div></article>`).join(''):`<div class="community-empty"><strong>${sort==='mine'?'Something to share when you’re ready.':'It’s quiet here for now.'}</strong><p>${sort==='mine'?'Share a take from your browser library to see it here.':'No music has been shared yet. If you find a moment you love, you can record it and share it here.'}</p></div>`;
  $('communityMore').hidden=!hasMore;$('communityMore').disabled=loading;
 }
 async function load(more=false){const own=++revision;loading=true;$('communityTracks').setAttribute('aria-busy','true');$('communityRefresh').disabled=true;status('Finding shared moments…');if(!more){page=0;tracks=[];$('communityTracks').innerHTML='';}tabs();try{await identity();const result=await api(`tracks?window=${window}&sort=${sort}&page=${more?page+1:0}`);if(own!==revision)return;page=result.page;tracks=more?[...tracks,...result.tracks.filter(t=>!tracks.some(old=>old.id===t.id))]:result.tracks;hasMore=result.hasMore;render();status(tracks.length?'Choose Listen to settle into a shared recording.':'');}catch(e){if(own===revision){status(e.message);hasMore=false;$('communityMore').hidden=true;if(tracks.length)render();else $('communityTracks').innerHTML='';}}finally{if(own===revision){loading=false;$('communityTracks').setAttribute('aria-busy','false');$('communityRefresh').disabled=false;$('communityMore').disabled=false;}}}
 async function open(navigate=true){if(navigate&&workspace){await workspace.save();history.pushState({},'','/community');}if(!$('communityDialog').open)$('communityDialog').showModal();await load();}
 async function share(){if(recorder.phase!=='idle')return;sharedTake=recorder.selectedTake;if(sharedTake&&!isSession(sharedTake)){status('This is an earlier audio take. Record a new session loop to share performance data.');return;}if(!sharedTake){status('Choose a saved take in Library first.');return;}$('shareTrackTitle').value=sharedTake.name;$('shareConsent').checked=false;$('shareStatus').textContent='';try{$('shareArtist').value=localStorage.getItem('chromaflow-artist')||'';}catch{}$('recordDialog').close();syncShare();await open();(signedIn?$('shareArtist'):authState==='error'?$('shareAuthRetry'):$('shareSignIn')).focus();}
 async function getTake(track){const response=await request('/api/community/tracks/'+encodeURIComponent(track.id)+'/performance',{credentials:'same-origin'});if(!response.ok){let data;try{data=await response.json();}catch{}throw new Error(data?.error||'This performance could not be downloaded.');}const file=await response.blob();if(file.size>8*1048576)throw new Error('This shared file is too large.');const take=await decodePerformance(file);take.name=track.title;take.artist=track.artist;take.communityId=track.id;return take;}
 async function action(kind,id,button){if(actionBusy||uploading)return;const track=tracks.find(t=>t.id===id);if(!track)return;
  if(kind==='present'){if(!['idle','playing'].includes(recorder.phase)){status('Finish your recording before presenting a track.');return;}presentation?.choose(track,async({ratio,unlock})=>{await unlock;await workspace?.save();const take=await getTake(track);previewTake=take;workspace?.preview(take,{navigate:false});$('communityDialog').close();presentation.enter(take,ratio,{navigate:true});await presentation.play(take);});return;}
  if(kind==='like'&&!signedIn){status('Sign in with ChatGPT above to vote with a like. Listening needs no account.');$('communitySignIn').focus();return;}
  if(kind==='remove'&&button.dataset.confirm!=='yes'){button.dataset.confirm='yes';button.textContent='Confirm remove';setTimeout(()=>{if(button.isConnected){button.dataset.confirm='';button.textContent='Remove';}},5000);return;}
  actionBusy=true;button.disabled=true;
  try{
   if(kind==='play'||kind==='save'||kind==='fork'){
    if(!['idle','playing'].includes(recorder.phase))throw new Error('Finish your recording before opening another performance.');
    if(kind==='save'&&recorder.phase!=='idle')throw new Error('Stop playback before saving a browser copy.');
    if(kind==='play')await recorder.prepareExternal();status('Opening '+track.title+'…');const take=await getTake(track);
    if(kind==='play'){await recorder.playExternal(take);previewTake=take;workspace?.preview(take);$('previewStatus').textContent='';$('communityDialog').close();}else if(kind==='fork'){await recorder.forkExternal(take);$('communityDialog').close();}else{await recorder.saveExternal(take);status('Saved a separate copy in your browser library.');}
   }else if(kind==='like'){await api(`tracks/${id}/like`,{method:track.liked?'DELETE':'PUT'});await load();}
   else if(kind==='remove'){await api('tracks/'+id,{method:'DELETE'});await load();status('Performance removed from the public library. Your browser copy is unchanged.');}
   else if(kind==='link'){const link=new URL('/recordings/'+id,globalThis.location.href).href;try{await navigator.clipboard.writeText(link);status('Track link copied.');}catch{status('Track link: '+link);}}
  }catch(e){status(e.message);}finally{actionBusy=false;button.disabled=false;}
 }
 async function publish(event){event.preventDefault();if(uploading||!sharedTake)return;if(!signedIn){syncShare();$('shareStatus').textContent='Sign in with ChatGPT to share this session.';$('shareSignIn').focus();return;}if(recorder.phase!=='idle'){$('shareStatus').textContent='Stop playback or finish recording before sharing.';return;}if(!$('shareConsent').checked){$('shareStatus').textContent='Confirm that you want this performance to be public.';return;}
  uploading=true;syncShare();$('shareProgress').hidden=false;$('shareProgress').value=0;$('shareStatus').textContent='Preparing your performance…';
  try{const file=encodePerformance(sharedTake);if(file.size>8*1048576)throw new Error('This take is larger than 8 MB. Record a shorter take for sharing; your original is still safe.');const title=$('shareTrackTitle').value.trim(),artist=$('shareArtist').value.trim();const result=await upload('/api/community/tracks',file,{title,artist,onProgress:p=>{$('shareProgress').value=p;$('shareStatus').textContent=p<1?'Uploading · '+Math.round(p*100)+'%':'Checking the performance and publishing…';}});try{localStorage.setItem('chromaflow-artist',artist);}catch{}sharedTake=null;$('shareStatus').textContent='';$('shareTakeInfo').textContent='Your performance is shared. Find it in My shared tracks.';sort='mine';window='all';await load();status('Published “'+result.track.title+'”. Everyone can listen, and signed-in listeners can leave a like.');}
  catch(e){if(e.status===401){signedIn=false;authState='signed-out';$('shareConsent').checked=false;} $('shareStatus').textContent=e.message;}finally{uploading=false;$('shareProgress').hidden=true;syncShare();}
 }
 $('communityLauncher').onclick=open;$('closeCommunity').onclick=()=>{$('communityDialog').close();if(workspace)history.pushState({},'',workspace.path());};$('communityDialog').addEventListener('cancel',()=>{if(workspace)history.pushState({},'',workspace.path());});$('takeShare').onclick=share;$('shareForm').addEventListener('submit',publish);
 $('communitySignIn').onclick=$('shareSignIn').onclick=()=>{try{if(sharedTake?.id)sessionStorage.setItem('flow-pending-share',sharedTake.id);}catch{}};
 $('shareAuthRetry').onclick=()=>load();
 $('communityRecordings').onclick=()=>{$('communityDialog').close();$('recordLauncher').onclick();};$('communityRefresh').onclick=()=>load();$('communityMore').onclick=()=>load(true);
 for(const [id,w,s] of [['chartToday','today','popular'],['chartWeek','week','popular'],['chartAll','all','popular'],['chartNewest','all','newest'],['chartMine','all','mine']])$(id).onclick=()=>{window=w;sort=s;return load();};
 $('communityTracks').addEventListener('click',e=>{const button=e.target.closest?.('button[data-action]');if(button)action(button.dataset.action,button.dataset.id,button);});
 async function playPreview({autoplay=false}={}){
  if(!previewTake||previewBusy||recorder.phase!=='idle')return;
  previewBusy=true;$('quickPlay').disabled=true;$('previewStatus').textContent='Preparing playback…';
  try{await recorder.prepareExternal({autoplay});await recorder.playExternal(previewTake);$('previewStatus').textContent='';}
  catch(e){$('previewStatus').textContent=e.name==='NotAllowedError'?'Press Play to listen.':e.message;}
  finally{previewBusy=false;$('quickPlay').disabled=recorder.phase!=='idle';}
 }
 async function openRoute(){
  const id=globalThis.location.pathname?.match(/^\/recordings\/([a-f0-9-]{36})\/?$/)?.[1]||globalThis.location.hash.match(/^#track=([a-f0-9-]{36})$/)?.[1];
  if(id){
   $('communityDialog').close();$('sessionNotice').hidden=true;
   const ratio=new URLSearchParams(globalThis.location.search||'').get('present');
   const presenting=presentation&&['portrait','landscape'].includes(ratio);
   if(presenting)presentation.enter(null,ratio);
   try{const {track}=await api('tracks/'+id);previewTake=await getTake(track);workspace?.preview(previewTake,{navigate:!presenting});if(presenting){presentation.enter(previewTake,ratio);await presentation.play(previewTake,{autoplay:true});}else await playPreview({autoplay:true});}
   catch(e){previewTake=null;if(presenting)presentation.fail(e);else{$('sessionNotice').textContent=e.message;$('sessionNotice').hidden=false;}}

   return;
  }
  let pending;try{pending=sessionStorage.getItem('flow-pending-share');sessionStorage.removeItem('flow-pending-share');}catch{}
  if(pending){try{const take=await recorder.getTake(pending);if(take&&isSession(take)){await recorder.selectTake(take.id);await share();return;}}catch{status('Reopen your saved take from the browser library to share it.');}}
  await open(false);
 }

 return {open,openRoute,leavePresentation(){if(presentation?.active){if(recorder.replaying)recorder.stopPlayback();presentation.exit();}},playPreview,setWorkspace(value){workspace=value;},share,load,publish,action,get tracks(){return tracks;}};
}
function uploadFile(url,file,{title,artist,onProgress}){return new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST',url);xhr.timeout=300000;xhr.setRequestHeader('Content-Type','application/json');xhr.setRequestHeader('X-Track-Title',encodeURIComponent(title));xhr.setRequestHeader('X-Artist-Name',encodeURIComponent(artist));xhr.setRequestHeader('X-File-Size',String(file.size));xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(e.loaded/e.total);};xhr.onerror=()=>reject(new Error('The upload was interrupted. Your browser copy is safe; try again.'));xhr.ontimeout=()=>reject(new Error('The upload took too long. Try a shorter take or a faster connection.'));xhr.onload=()=>{let data;try{data=JSON.parse(xhr.responseText);}catch{return reject(new Error('The shared library is unavailable. Please try again.'));}xhr.status>=200&&xhr.status<300?resolve(data):reject(Object.assign(new Error(data.error||'The upload failed.'),{status:xhr.status}));};xhr.send(file);});}
