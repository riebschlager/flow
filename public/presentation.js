import {createPresentationControls} from './presentation-controls.js?rev=quiet-controls-87';
import {PresentationSleep} from './presentation-sleep.js?rev=listening-85';
import {PresentationAutoAdvance} from './presentation-auto.js?rev=auto-63';
const $=id=>document.getElementById(id);
export const presentationUrl=(id,ratio)=>'/recordings/'+encodeURIComponent(id)+'?present='+(ratio==='portrait'?'portrait':'landscape');
export function createPresentationController(recorder){
 const shell=$('presentationShell'),stage=$('stage'),overlay=$('presentationOverlay'),gate=$('presentationGate'),controls=$('presentationControls'),nextStatus=$('presentationNextStatus'),nextButton=$('presentationNext');
 let sleepFinished=false;let active=false,take=null,home=null,next=null,busy=false,canvasTab=null,queue=null,queueRevision=0,onTrack=()=>{};
 const chrome=createPresentationControls({shell,panel:controls,trigger:$('presentationControlsToggle'),hint:$('presentationControlsHint')});
 const autoToggle=$('presentationAutoAdvance'),autoDuration=$('presentationAutoDuration'),durationLabel=$('presentationAutoDurationLabel');
 const auto=new PresentationAutoAdvance({now:()=>recorder.presentationTime,ready:()=>active&&!busy&&!!queue&&recorder.phase==='playing'&&gate.hidden&&!nextButton.disabled,advance:()=>advance({automatic:true}),onError:()=>{setAuto(false);nextStatus.textContent='Auto-advance paused. Choose Next track to try again.';reveal();}});
 const sleepSelect=$('presentationSleepTimer'),sleep=new PresentationSleep({now:()=>recorder.presentationTime,change:value=>{shell.style.setProperty('--presentation-sleep-dim',String(value.dim));recorder.setPresentationSleepGain?.(value.gain);},finish:()=>{sleepFinished=true;setAuto(false);queueRevision++;recorder.stopPlayback();sleepSelect.value='0';nextButton.disabled=true;gate.hidden=false;$('presentationStatus').textContent='Sleep timer finished.';$('presentationBegin').textContent='Listen again';$('presentationBegin').hidden=false;reveal();}});
 function resetSleep(){sleep.reset();sleepFinished=false;sleepSelect.value='0';}
 sleepSelect.addEventListener('change',()=>{sleepFinished=false;sleep.set(Number(sleepSelect.value));nextStatus.textContent=Number(sleepSelect.value)?`Sleep timer set for ${sleepSelect.value} minutes`:'Sleep timer off';reveal();});
 function setAuto(enabled){auto.setEnabled(enabled);autoToggle.checked=auto.enabled;autoDuration.disabled=!auto.enabled;durationLabel.hidden=!auto.enabled;}
 function exhausted(){autoToggle.disabled=true;nextButton.disabled=true;nextButton.textContent='No more tracks';if(auto.enabled){setAuto(false);nextStatus.textContent='You’ve reached the end of this collection. Auto-advance is off.';}}
 autoToggle.addEventListener('change',()=>{setAuto(autoToggle.checked);reveal();});
 function updateDuration(commit=false){const minutes=Number(autoDuration.value),seconds=minutes*60;if(!Number.isFinite(minutes)||seconds<15||seconds>3600||Math.abs(minutes*4-Math.round(minutes*4))>.00001){if(commit)autoDuration.value=String(auto.seconds/60);return;}auto.setDuration(seconds);reveal();}
 autoDuration.addEventListener('input',()=>updateDuration());autoDuration.addEventListener('change',()=>updateDuration(true));
 function reveal(){if(active)chrome.open();}
 function fail(error){gate.hidden=false;$('presentationStatus').textContent=error?.name==='NotAllowedError'?'Tap to begin listening.':error?.message||'This track could not be opened.';$('presentationBegin').hidden=!take;$('presentationBegin').textContent=error?.name==='NotAllowedError'?'Tap to begin':'Try again';reveal();}
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else throw new Error('Fullscreen is unavailable in this browser.');}catch(e){if(active){reveal();$('presentationFullscreen').textContent='Fullscreen unavailable';}else $('presentationLaunchStatus').textContent='Fullscreen is unavailable here. Opening the presentation in this window.';}}
 function enter(value,ratio,{navigate=false}={}){
  if(!active){resetSleep();autoToggle.disabled=false;setAuto(false);auto.setDuration(180);autoDuration.value='3';home={parent:stage.parentNode,next:stage.nextSibling};shell.prepend(stage);active=true;canvasTab=$('fluid').getAttribute('tabindex');$('fluid').setAttribute('tabindex','-1');$('fluid').setAttribute('aria-label','Animated visuals for the selected community track');}
  if(value)take=value;
  document.body.classList.add('presentation-mode');document.documentElement.classList.remove('presentation-pending');shell.hidden=false;overlay.hidden=false;
  shell.dataset.ratio=ratio==='portrait'?'portrait':'landscape';stage.append(overlay);shell.append(controls);stage.append(gate);controls.append(nextStatus);
  $('presentationTitle').textContent=take?.name||'';$('presentationArtist').textContent=take?'by '+(take.artist||'Community'):'';
  $('presentationExit').href=take?'/recordings/'+take.communityId:'/community';
  if(take){const url=presentationUrl(take.communityId,ratio);if(location.pathname+location.search!==url)history[navigate?'pushState':'replaceState']({},'',url);document.title=take.name+' · Flow presentation';}
  gate.hidden=false;$('presentationStatus').textContent='Preparing your moment…';$('presentationBegin').hidden=true;chrome.start();
 }
 async function play(value,{autoplay=false}={}){
  if(busy)return;if(sleepFinished)resetSleep();take=value;busy=true;gate.hidden=false;$('presentationBegin').hidden=true;$('presentationStatus').textContent='Preparing your moment…';
  try{await recorder.prepareExternal({autoplay});await recorder.playExternal(take,{presentation:true});gate.hidden=true;chrome.close();if(queue)nextButton.disabled=false;sleep.tick();auto.reset();}
  catch(e){fail(e);}finally{busy=false;}
 }
 function exit(){if(!active)return;resetSleep();setAuto(false);queueRevision++;queue?.close();queue=null;nextButton.disabled=true;nextStatus.textContent='';$('presentationTitle').parentNode.style.opacity='';active=false;take=null;chrome.stop();shell.append(overlay,controls,gate,nextStatus);home.parent.insertBefore(stage,home.next);shell.hidden=true;document.body.classList.remove('presentation-mode');if(canvasTab===null)$('fluid').removeAttribute('tabindex');else $('fluid').setAttribute('tabindex',canvasTab);$('fluid').setAttribute('aria-label','Fluid canvas');if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
 function credit(value){
  take=value;onTrack(value);$('presentationTitle').textContent=value.name;$('presentationArtist').textContent='by '+(value.artist||'Community');
  $('presentationExit').href='/recordings/'+value.communityId;
  history.replaceState({},'',presentationUrl(value.communityId,shell.dataset.ratio));document.title=value.name+' · Flow presentation';
 }
 function setQueue(value,changed=()=>{}){
  queue?.close();queue=value;autoToggle.disabled=false;onTrack=changed;const own=++queueRevision;nextButton.disabled=false;
  nextButton.textContent='Next track →';nextStatus.textContent='';
  value.warm().then(next=>{if(own!==queueRevision)return;if(!next)exhausted();}).catch(()=>{});
 }
 async function advance({automatic=false}={}){
  if(!active||sleepFinished||busy||!queue||recorder.phase!=='playing')return;
  busy=true;auto.hold();nextButton.disabled=true;nextButton.textContent='Preparing…';nextStatus.textContent=automatic?'':'Preparing the next moment…';if(!automatic)reveal();const own=queueRevision;
  try{
   const value=await queue.next();if(!active||own!==queueRevision)return;
   if(!value){exhausted();nextStatus.textContent='You’ve reached the end of this collection.';return;}
   nextButton.textContent='Transitioning…';nextStatus.textContent='';
   const completed=await recorder.transitionExternal(value,{duration:5,onMidpoint:()=>{if(active&&own===queueRevision)credit(value);},onProgress:p=>{if(active&&own===queueRevision)$('presentationTitle').parentNode.style.opacity=String(Math.min(1,Math.abs(p-.5)/.14));}});
   if(!completed||!active||own!==queueRevision)return;
   nextButton.textContent='Next track →';nextButton.disabled=false;auto.reset();
   queue.warm().then(next=>{if(own===queueRevision&&!next)exhausted();}).catch(()=>{});
  }catch(error){if(active&&own===queueRevision){const wasAuto=auto.enabled;setAuto(false);nextStatus.textContent='The next track couldn’t load. Your current track is still playing. '+(wasAuto?'Auto-advance is off. Try Next track.':'Try another.');nextButton.textContent='Try next track →';nextButton.disabled=false;reveal();}}
  finally{busy=false;if(active&&own===queueRevision)$('presentationTitle').parentNode.style.opacity='';}
 }
 nextButton.onclick=()=>advance();
 function choose(track,launch){next=launch;$('presentationTrack').textContent=track.title+' · by '+track.artist;$('presentationLaunchStatus').textContent='';$('presentationDialog').showModal();}
 $('presentationClose').onclick=()=>$('presentationDialog').close();
 $('presentationLaunch').onclick=async()=>{
  if(busy||!next)return;
  const ratio=document.querySelector('input[name="presentationRatio"]:checked').value;
  // Unlock sound and request fullscreen in the launching click, before any fetch.
  const unlock=recorder.prepareExternal();unlock.catch(()=>{});
  if($('presentationWantFullscreen').checked)void fullscreen();
  $('presentationLaunch').disabled=true;$('presentationLaunchStatus').textContent='Opening your moment…';
  try{await next({ratio,unlock});$('presentationDialog').close();}
  catch(e){$('presentationLaunchStatus').textContent=e.message;}
  finally{$('presentationLaunch').disabled=false;}
 };
 $('presentationBegin').onclick=()=>play(take);
 $('presentationFullscreen').onclick=e=>{void fullscreen();if(e.detail)e.currentTarget.blur();reveal();};
 document.addEventListener('fullscreenchange',()=>{$('presentationFullscreen').textContent=document.fullscreenElement?'Exit fullscreen':'Enter fullscreen';});
 shell.addEventListener('pointerdown',e=>{if(!e.target.closest('button,a,input,select,label')&&sleep.input()){sleepSelect.value='0';nextStatus.textContent='Sleep timer cancelled · welcome back';}});
 document.addEventListener('keydown',e=>{if(!active)return;if(e.key==='Escape'&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});});
 return {choose,enter,play,fail,exit,setQueue,get active(){return active;}};
}
