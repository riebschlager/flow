const $=id=>document.getElementById(id);
export const presentationUrl=(id,ratio)=>'/recordings/'+encodeURIComponent(id)+'?present='+(ratio==='portrait'?'portrait':'landscape');
export function createPresentationController(recorder){
 const shell=$('presentationShell'),stage=$('stage'),overlay=$('presentationOverlay'),gate=$('presentationGate'),controls=$('presentationControls');
 let active=false,take=null,home=null,next=null,busy=false,hideTimer=null,canvasTab=null;
 function reveal(){if(!active)return;controls.hidden=false;clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(!controls.contains(document.activeElement))controls.hidden=true;},2200);}
 function fail(error){gate.hidden=false;$('presentationStatus').textContent=error?.name==='NotAllowedError'?'Tap to begin listening.':error?.message||'This track could not be opened.';$('presentationBegin').hidden=!take;$('presentationBegin').textContent=error?.name==='NotAllowedError'?'Tap to begin':'Try again';reveal();}
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else throw new Error('Fullscreen is unavailable in this browser.');}catch(e){if(active){reveal();$('presentationFullscreen').textContent='Fullscreen unavailable';}else $('presentationLaunchStatus').textContent='Fullscreen is unavailable here. Opening the presentation in this window.';}}
 function enter(value,ratio,{navigate=false}={}){
  if(!active){home={parent:stage.parentNode,next:stage.nextSibling};shell.prepend(stage);active=true;canvasTab=$('fluid').getAttribute('tabindex');$('fluid').setAttribute('tabindex','-1');$('fluid').setAttribute('aria-label','Animated visuals for the selected community track');}
  if(value)take=value;
  document.body.classList.add('presentation-mode');document.documentElement.classList.remove('presentation-pending');shell.hidden=false;overlay.hidden=false;
  shell.dataset.ratio=ratio==='portrait'?'portrait':'landscape';stage.append(overlay);stage.append(controls);stage.append(gate);
  $('presentationTitle').textContent=take?.name||'';$('presentationArtist').textContent=take?'by '+(take.artist||'Community'):'';
  $('presentationExit').href=take?'/recordings/'+take.communityId:'/community';
  if(take){const url=presentationUrl(take.communityId,ratio);if(location.pathname+location.search!==url)history[navigate?'pushState':'replaceState']({},'',url);document.title=take.name+' · Flow presentation';}
  gate.hidden=false;$('presentationStatus').textContent='Preparing your moment…';$('presentationBegin').hidden=true;controls.hidden=true;
 }
 async function play(value,{autoplay=false}={}){
  if(busy)return;take=value;busy=true;gate.hidden=false;$('presentationBegin').hidden=true;$('presentationStatus').textContent='Preparing your moment…';
  try{await recorder.prepareExternal({autoplay});await recorder.playExternal(take);gate.hidden=true;controls.hidden=true;}
  catch(e){fail(e);}finally{busy=false;}
 }
 function exit(){if(!active)return;active=false;take=null;clearTimeout(hideTimer);shell.append(overlay,controls,gate);home.parent.insertBefore(stage,home.next);shell.hidden=true;document.body.classList.remove('presentation-mode');if(canvasTab===null)$('fluid').removeAttribute('tabindex');else $('fluid').setAttribute('tabindex',canvasTab);$('fluid').setAttribute('aria-label','Fluid canvas');if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
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
 shell.addEventListener('pointermove',reveal);shell.addEventListener('pointerdown',e=>{if(!e.target.closest('button,a'))reveal();});shell.addEventListener('focusin',reveal);
 document.addEventListener('keydown',e=>{if(!active)return;if(e.key==='Tab')reveal();if(e.key==='Escape'&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});});
 return {choose,enter,play,fail,exit,get active(){return active;}};
}
