import {SessionStore,sessionRoute} from './session-store.js?rev=delete-70';
import {mainDefaults,sanitizeSnapshot} from './recording-state.js?rev=chaos-86';
import {isSetupDraft,encodePerformance,decodePerformance} from './recorder-core.js?rev=titles-81';
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fresh=()=>sanitizeSnapshot({main:{settings:{...mainDefaults},voices:['piano','vibes','strings','celesta'],custom:['Cmaj7','Am7','Fmaj7','G'],bpm:56,selected:0}});
export function createSessionWorkspace({bridge,recorder,community,store=new SessionStore()}){
 let current=null,restoring=false,dirty=false,timer=null,queue=Promise.resolve(),generation=0;
 const notice=t=>{$('sessionSave').textContent=t;};
 const path=()=>current?'/sessions/'+current.id:'/';
 function url(value,replace=false){if(location.pathname+location.search!==value)history[replace?'replaceState':'pushState']({},'',value);}
 function mark(){if(!current||restoring||recorder.replaying)return;dirty=true;notice('Saving…');clearTimeout(timer);timer=setTimeout(()=>save().catch(report),650);}
 function report(e){notice(e.message);$('sessionNotice').textContent=e.message;$('sessionNotice').hidden=false;}
 async function save(){
  clearTimeout(timer);if(!current||restoring)return;
  if(!recorder.replaying){current.snapshot=bridge.snapshot();current.scene=bridge.scene();}
  current.updated=new Date().toISOString();const value=structuredClone(current);dirty=true;
  queue=queue.catch(()=>{}).then(()=>store.put(value));
  try{await queue;dirty=false;notice('Saved on this device');}catch(e){dirty=true;report(e);throw e;}
 }
 function shell(){$('sharedPreview').hidden=true;document.body.classList.toggle('session-home',!current);$('sessionHeader').hidden=!current;$('sessionHome').hidden=!!current;if(current){$('intro').classList.toggle('faded',!!current.takeIds.length||!!current.origin);$('sessionTitle').value=current.name;document.title=current.name+' · Flow';$('sessionOrigin').textContent=current.origin?'Based on '+current.origin.name+(current.origin.artist?' by '+current.origin.artist:''):'YOUR SESSION · PRIVATE ON THIS DEVICE';}else document.title='Flow — Infinite ambient music in your browser';}
 async function renderTakes(){const own=++generation;if(!current)return;const takes=await Promise.all(current.takeIds.map(id=>recorder.getTake(id)));if(own!==generation)return;const selected=recorder.selectedTake?.id;
  $('sessionTakes').innerHTML=takes.filter(t=>t&&!isSetupDraft(t)).map((t,i)=>`<button class="session-take ${t.id===selected?'selected':''}" data-take="${esc(t.id)}" aria-pressed="${t.id===selected}"><span>TAKE ${String(i+1).padStart(2,'0')}</span><strong>${esc(t.name)}</strong><small>${Math.floor(t.duration/60)}:${String(Math.floor(t.duration%60)).padStart(2,'0')} · ${t.id===selected?'Selected':'Select take'}</small></button>`).join('')||'<p class="take-empty">Your first take starts here. Choose a sound, press Record, and add a little color.</p>';
 }
 async function open(session,{navigate=true}={}){restoring=true;try{bridge.stopLive();current=session;bridge.applySnapshot(session.snapshot);bridge.restoreScene(session.scene);await recorder.selectTake(session.selectedTake||null);shell();if(navigate)url(path()+(session.selectedTake?'?take='+encodeURIComponent(session.selectedTake):''));notice('Saved on this device');await renderTakes();}finally{restoring=false;}}
 async function newSession({snapshot=fresh(),scene=null,name='Untitled session',origin=null,takeIds=[],saveCurrent=true}={}){
  if(recorder.unsaved&&saveCurrent)throw new Error('Save or download your unsaved take from Library before starting over.');if(recorder.phase!=='idle')throw new Error('Stop playback or finish your take before opening a session.');
  if(saveCurrent)await save();bridge.stopLive();if(!scene){const old=bridge.scene();scene={w:old.w,h:old.h,...Object.fromEntries(['u','v','r','g','b'].map(k=>[k,Array(old.w*old.h).fill(0)]))};}
  await open({id:crypto.randomUUID(),name,snapshot,scene,origin,takeIds,selectedTake:null,updated:new Date().toISOString()});await save();$('sessionNotice').hidden=true;
 }
 async function renderSessions(){const sessions=await store.list();if(current)return;$('recentSessions').innerHTML=sessions.map(s=>`<article class="recent-session"><button class="recent-session-open" data-session="${esc(s.id)}"><strong>${esc(s.name)}</strong><span>${s.takeIds.length} ${s.takeIds.length===1?'take':'takes'} · ${new Date(s.updated).toLocaleDateString()}</span><small>Open session ↗</small></button><button class="recent-session-delete" data-delete-session="${esc(s.id)}" aria-label="Delete ${esc(s.name)}" title="Delete session"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/></svg></button></article>`).join('')||'<p class="helper">Your sessions will appear here. No account needed.</p>';}
 async function home(navigate=true){if(recorder.unsaved)throw new Error('Save or download your unsaved take from Library before leaving.');if(recorder.phase!=='idle')throw new Error('Stop playback or finish your take before leaving this session.');await save();bridge.stopLive();current=null;shell();if(navigate)url('/');await renderSessions();if(location.pathname==='/'&&!location.hash)void community.loadHome?.();}
 let deleting=false;
 async function deleteSession(id){
  if(deleting||current)return;
  if(recorder.phase!=='idle'||recorder.unsaved)throw new Error('Stop playback or finish saving your take before deleting a session.');
  deleting=true;
  try{
   const sessions=await store.list(),session=sessions.find(s=>s.id===id);if(!session)return;
   if(!confirm(`Delete “${session.name}” from this device? Its local takes will also be deleted unless another session uses them. Shared community recordings will stay available. This cannot be undone.`))return;
   const retained=new Set(sessions.filter(s=>s.id!==id).flatMap(s=>s.takeIds));
   await recorder.removeTakes(session.takeIds.filter(take=>!retained.has(take)));
   await store.remove(id);await renderSessions();
   $('sessionNotice').textContent=`“${session.name}” deleted from this device.`;$('sessionNotice').hidden=false;
   const buttons=$('recentSessions').querySelectorAll('button');(buttons[0]||$('homeNewSession')).focus();
  }finally{deleting=false;}
 }
 async function route(){
  community.leavePresentation?.();$('communityDialog').close();const requested=location.pathname,query=new URLSearchParams(location.search);if(recorder.phase!=='idle'){url(path(),true);throw new Error('Stop playback or finish recording before changing sessions.');}
  const id=sessionRoute(requested);if(id){if(current?.id===id){const take=query.get('take');if(take&&current.takeIds.includes(take)){await recorder.selectTake(take);current.selectedTake=take;mark();}shell();await renderTakes();return;}
   await save();const session=await store.get(id);if(!session){await home(false);$('sessionNotice').hidden=false;$('sessionNotice').textContent='This session is not on this device. Local session links only work in the browser where they were created. Import a session file or start a new session.';return;}
   const take=query.get('take');if(take&&session.takeIds.includes(take))session.selectedTake=take;await open(session,{navigate:false});
  }else if(requested==='/community'||requested.startsWith('/recordings/')||location.hash==='#community'||/^#track=/.test(location.hash||'')){if(!current)await home(false);await community.openRoute();}else await home(false);
 }
 const run=fn=>async(...args)=>{try{await fn(...args);}catch(e){report(e);}};
 $('newSession').onclick=$('homeNewSession').onclick=run(()=>newSession());$('allSessions').onclick=run(()=>home());
 document.querySelector('.brand').onclick=run(async e=>{e.preventDefault();await home();});
 $('sessionTitle').addEventListener('input',()=>{if(current){current.name=$('sessionTitle').value.trim().slice(0,80)||'Untitled session';document.title=current.name+' · Flow';mark();}});
 $('recentSessions').onclick=run(async e=>{const deleteId=e.target.closest('[data-delete-session]')?.dataset.deleteSession;if(deleteId){await deleteSession(deleteId);return;}if(deleting)return;const id=e.target.closest('[data-session]')?.dataset.session;if(id){await save();const session=await store.get(id);if(session)await open(session);}});
 $('sessionTakes').onclick=run(async e=>{const id=e.target.closest('[data-take]')?.dataset.take;if(!id||recorder.phase!=='idle')return;await recorder.selectTake(id);current.selectedTake=id;url(path()+'?take='+encodeURIComponent(id));mark();await renderTakes();});
 $('quickRecord').onclick=run(async()=>{if(recorder.replaying)recorder.stopPlayback();if(!current)await newSession();await save();$('recordName').value=current.name+' · Take '+(current.takeIds.length+1);await recorder.record();});
 $('quickStop').onclick=()=>{if(recorder.recording)recorder.finish();else if(recorder.replaying){recorder.stopPlayback();}else if(recorder.phase!=='idle')recorder.cancel();else bridge.stopLive();};
 $('quickPlay').onclick=run(()=>!$('sharedPreview').hidden?community.playPreview():recorder.selectedTake&&!isSetupDraft(recorder.selectedTake)?recorder.play($('quickLoop').checked):bridge.togglePlay());
 $('quickLive').onclick=run(()=>bridge.togglePlay());
 $('retryTakeSave').onclick=run(async()=>{if(await recorder.retrySave())$('sessionNotice').hidden=true;});
 $('quickUseSetup').onclick=run(()=>recorder.forkCurrent());
 $('previewBack').onclick=run(async()=>{if(recorder.replaying)recorder.stopPlayback();shell();await community.open();});
 $('quickLoop').onchange=()=>recorder.setLoop($('quickLoop').checked);
 $('quickLibrary').onclick=()=>$('recordLauncher').click();$('quickExport').onclick=run(()=>recorder.exportAudio());$('quickShare').onclick=()=>community.share();
 $('homeCommunity').onclick=()=>community.open();$('homeImport').onclick=()=>$('takeImport').click();
 $('backupSession').onclick=run(async()=>{await save().catch(()=>{});if(!current)return;const raw=(await Promise.all(current.takeIds.map(id=>recorder.getTake(id)))).filter(Boolean);const takes=await Promise.all(raw.map(async t=>{const bytes=new Uint8Array(await encodePerformance(t).arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);}));const blob=new Blob([JSON.stringify({format:'flow-project',version:1,session:current,takes})],{type:'application/json'});if(blob.size>100*1048576)throw new Error('This session exceeds the 100 MB portable file limit. Export its takes individually from Library.');const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=current.name.replace(/[^\p{L}\p{N} _-]/gu,'')+'.flow';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
 document.addEventListener('keydown',e=>{if(document.body.classList.contains('presentation-mode'))return;if(e.repeat||e.metaKey||e.ctrlKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test((e.target||document.activeElement).tagName)||document.querySelector('dialog[open]'))return;if(e.key.toLowerCase()==='r'&&current){e.preventDefault();if(recorder.recording)recorder.finish();else $('quickRecord').click();}});
 addEventListener('popstate',run(route));addEventListener('beforeunload',e=>{if(dirty||recorder.unsaved||recorder.phase==='recording'||recorder.phase==='finalizing'){e.preventDefault();e.returnValue='';}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)save().catch(report);});
 // Scene snapshots are checkpointed without writing every animation frame.
 setInterval(()=>{if(current&&!restoring&&recorder.phase==='idle')save().catch(report);},10000);
 setInterval(()=>{const phase=recorder.phase,active=phase!=='idle';$('captureLengthLabel').textContent=$('recordMode').value==='manual'?'Manual':$('recordCycles').value+' cycles';$('quickLive').hidden=!current||active||!recorder.selectedTake||isSetupDraft(recorder.selectedTake);$('quickLive').textContent=$('playLabel').textContent==='In the flow'?'Pause live':'Play live';$('quickUseSetup').hidden=!recorder.replaying;$('retryTakeSave').hidden=!recorder.unsaved;$('quickRecord').disabled=recorder.unsaved||!current||!['idle','playing'].includes(phase);$('quickRecord').textContent=phase==='recording'?'● Recording':phase==='playing'?'● Record another':'● Record';$('quickPlay').disabled=active;$('quickPlay').textContent=!$('sharedPreview').hidden?'▶ Play':recorder.selectedTake?'▶ Listen':document.getElementById('playLabel').textContent==='In the flow'?'Ⅱ Pause':'▶ Play';$('quickStop').textContent=phase==='recording'?'■ Finish at bar':'■ Stop';$('quickStatus').textContent=recorder.unsaved?'Take not saved · retry, or download it from Library':active?$('recordBarStatus').textContent:recorder.selectedTake&&!isSetupDraft(recorder.selectedTake)?'Take saved · listen, or record another':'Ready · starts from the first chord';$('quickTime').textContent=active?$('recordBarTime').textContent:'00:00';$('quickExport').disabled=$('quickShare').disabled=active||!recorder.selectedTake||isSetupDraft(recorder.selectedTake);$('newSession').disabled=$('allSessions').disabled=active;$('sessionTitle').disabled=active;$('quickProgress').value=active?$('recordProgress').value:0;},250);
 return {get previewing(){return !$('sharedPreview').hidden;},error:report,mark,save,path,route,newSession,
  preview(take,{navigate=true}={}){document.body.classList.remove('session-home','zen-transport-collapsed');$('sessionHome').hidden=true;$('sessionHeader').hidden=true;$('sharedPreview').hidden=false;$('intro').classList.add('faded');document.title=take.name+' · Flow';$('previewTitle').textContent=take.name+' · by '+(take.artist||'Community');if(navigate)url('/recordings/'+take.communityId);},
  async beforeFork(){if(recorder.replaying)recorder.stopPlayback();await save();},
  async forked(child,parent){try{await newSession({snapshot:child.snapshot,scene:child.scene,name:parent.name+' — variation',origin:{name:parent.name,artist:parent.artist||'',id:parent.id},saveCurrent:false});}finally{await recorder.selectTake(child.id);}},
  async kept(take){if(isSetupDraft(take))return;if(!current){await newSession({snapshot:take.snapshot,scene:take.scene,name:take.name});await recorder.selectTake(take.id);}if(!current.takeIds.includes(take.id))current.takeIds.push(take.id);current.selectedTake=take.id;url(path()+'?take='+encodeURIComponent(take.id));await save();await renderTakes();},
  async changed(){if(current){const available=await recorder.listTakes();current.takeIds=current.takeIds.filter(id=>available.some(t=>t.id===id));if(!current.takeIds.includes(current.selectedTake))current.selectedTake=null;}await renderTakes();mark();},
  async init(){try{const sessions=await store.list();if(!sessions.length){const old=await recorder.listTakes();if(old.length){const session={id:crypto.randomUUID(),name:'Recovered session',snapshot:bridge.snapshot(),scene:bridge.scene(),takeIds:old.map(t=>t.id),selectedTake:null,updated:new Date().toISOString()};await store.put(session);}}await route();}catch(e){report(e);shell();}finally{document.body.classList.remove('session-loading');}},
  async importProject(data){if(data.format!=='flow-project'||data.version!==1||!data.session||!Array.isArray(data.takes)||data.takes.length>200)throw new Error('Invalid Flow session file.');const s=data.session;s.snapshot=sanitizeSnapshot(s.snapshot);bridge.validateScene(s.scene);const takes=await Promise.all(data.takes.map(async text=>{if(typeof text!=='string')throw new Error('Invalid take in session file.');const take=await decodePerformance(new Blob([Uint8Array.from(atob(text),c=>c.charCodeAt(0))]));bridge.validateTake(take);return take;}));await newSession({snapshot:s.snapshot,scene:s.scene,name:String(s.name||'Imported session').slice(0,80),origin:s.origin});for(const t of takes)await recorder.saveExternal(t);await save();}
 };
}
