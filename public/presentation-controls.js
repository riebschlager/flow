// Shared quiet chrome for presentation and Zen: the glass strip's show/hide.
// While enabled the strip stays in the tab order; data-shown fades it in or out.
// A mouse in the bottom band, focus inside, or the chevron shows it. Painting
// elsewhere on the scene and touches outside it stay quiet. It never hides while
// hovered or focused, so focus is never lost or trapped.
export const HOVER_HIDE_MS=2600,OPEN_HIDE_MS=6000,HOVER_ZONE_PX=120;
export function createPresentationControls({shell,panel,trigger,hint,doc=document,storage=()=>localStorage,setTimer=setTimeout,clearTimer=clearTimeout,label="presentation",storageKey="flow:presentation-controls-seen",zone=HOVER_ZONE_PX,viewportHeight=()=>globalThis.innerHeight||0}){
 let enabled=false,shown=false,opened=false,hovered=false,idle=null,discovery=null,delay=OPEN_HIDE_MS;
 const hasFocus=()=>panel.contains(doc.activeElement);
 function hideHint(){clearTimer(discovery);hint.hidden=true;}
 function render(){panel.dataset.shown=String(shown);trigger.setAttribute('aria-expanded',String(shown));trigger.setAttribute('aria-label',(shown?'Hide ':'Show ')+label+' controls');}
 function close({restoreFocus=false}={}){
  clearTimer(idle);const focused=hasFocus();shown=opened=false;render();
  if(restoreFocus&&focused)trigger.focus({preventScroll:true});
 }
 function schedule(ms=delay){
  clearTimer(idle);delay=ms;
  if(!enabled||!shown||hovered||hasFocus())return;
  idle=setTimer(()=>{if(!hovered&&!hasFocus())close();},ms);
 }
 // The chevron (and the app, for status messages) open it for a while; hovering opens it until the pointer leaves.
 function open({pin=false,ms=OPEN_HIDE_MS}={}){if(!enabled)return;hideHint();shown=true;if(pin)opened=true;render();schedule(ms);}
 trigger.addEventListener('click',()=>{if(shown)close({restoreFocus:true});else open({pin:true});});
 panel.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;clearTimer(idle);}});
 panel.addEventListener('pointerleave',event=>{if(event?.pointerType==='mouse'||hovered){hovered=false;schedule(HOVER_HIDE_MS);}});
 for(const type of ['pointerdown','pointerup','pointercancel','input','change','keydown'])panel.addEventListener(type,()=>schedule());
 panel.addEventListener('focusin',()=>{if(!enabled)return;clearTimer(idle);if(!shown){shown=true;render();}});
 panel.addEventListener('focusout',()=>{clearTimer(idle);idle=setTimer(()=>schedule(HOVER_HIDE_MS),0);});
 // A resting mouse near the bottom edge reveals the strip; a press or drag there is still painting.
 doc.addEventListener('pointermove',event=>{
  if(!enabled||event.pointerType!=='mouse'||event.buttons||panel.contains(event.target))return;
  const near=viewportHeight()-event.clientY<=zone;
  if(near&&!hovered){hovered=true;hideHint();if(!shown){shown=true;render();}clearTimer(idle);}
  else if(!near&&hovered){hovered=false;schedule(HOVER_HIDE_MS);}
 });
 shell.addEventListener('pointerdown',event=>{if(shown&&!panel.contains(event.target)&&!trigger.contains(event.target))close({restoreFocus:true});});
 doc.addEventListener('keydown',event=>{
  if(!enabled||event.key!=='Escape'||!shown||!(opened||hasFocus()))return;
  if(event.defaultPrevented)return;
  event.preventDefault();event.stopImmediatePropagation();close({restoreFocus:true});
 });
 return {
  open,close,
  get shown(){return shown;},
  // Opened with the chevron, or holding focus: Escape hides it before anything else.
  get pinned(){return shown&&(opened||hasFocus());},
  // Entering shows the strip briefly, as the kit does, so its place is known.
  start(){enabled=true;hovered=false;panel.hidden=false;panel.inert=false;trigger.hidden=false;shown=true;opened=false;render();schedule(HOVER_HIDE_MS);hideHint();let seen=false;try{seen=storage().getItem(storageKey)==='1';storage().setItem(storageKey,'1');}catch{}if(!seen){hint.hidden=false;discovery=setTimer(hideHint,4500);}},
  stop(){close();enabled=false;hovered=false;panel.hidden=true;hideHint();trigger.hidden=true;}
 };
}
