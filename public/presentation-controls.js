// Presentation chrome opens only through its button. Scene input stays quiet.
export function createPresentationControls({shell,panel,trigger,hint,doc=document,storage=()=>localStorage,setTimer=setTimeout,clearTimer=clearTimeout}){
 let enabled=false,hovered=false,idle=null,discovery=null;
 const hasFocus=()=>panel.contains(doc.activeElement);
 function hideHint(){clearTimer(discovery);hint.hidden=true;}
 function close({restoreFocus=false}={}){
  clearTimer(idle);const focused=hasFocus();panel.inert=true;panel.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label','Show presentation controls');
  if(restoreFocus&&focused)trigger.focus({preventScroll:true});
 }
 function schedule(){
  clearTimer(idle);
  if(!enabled||panel.hidden||hovered||hasFocus())return;
  idle=setTimer(()=>{if(!hovered&&!hasFocus())close();},6000);
 }
 function open(){if(!enabled)return;hideHint();panel.inert=false;panel.hidden=false;trigger.setAttribute('aria-expanded','true');trigger.setAttribute('aria-label','Hide presentation controls');schedule();}
 trigger.addEventListener('click',()=>{if(panel.hidden)open();else close({restoreFocus:true});});
 panel.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;clearTimer(idle);}});
 panel.addEventListener('pointerleave',()=>{hovered=false;schedule();});
 for(const type of ['pointerdown','pointerup','pointercancel','input','change','keydown'])panel.addEventListener(type,schedule);
 panel.addEventListener('focusin',()=>clearTimer(idle));
 panel.addEventListener('focusout',()=>{clearTimer(idle);idle=setTimer(schedule,0);});
 shell.addEventListener('pointerdown',event=>{if(!panel.hidden&&!panel.contains(event.target)&&!trigger.contains(event.target))close({restoreFocus:true});});
 doc.addEventListener('keydown',event=>{
  if(!enabled||event.key!=='Escape'||panel.hidden)return;
  if(event.defaultPrevented)return;
  event.preventDefault();event.stopImmediatePropagation();close({restoreFocus:true});
 });
 return {
  open,close,
  start(){enabled=true;hovered=false;trigger.hidden=false;close();hideHint();let seen=false;try{seen=storage().getItem('flow:presentation-controls-seen')==='1';storage().setItem('flow:presentation-controls-seen','1');}catch{}if(!seen){hint.hidden=false;discovery=setTimer(hideHint,4500);}},
  stop(){enabled=false;hovered=false;close();hideHint();trigger.hidden=true;}
 };
}
