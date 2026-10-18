// Two reusable layers per field keep fast performances bounded and interruptible.
export function createNoteReadout(root, pitchLayers, voiceLayers) {
 const reducedMotion=()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 function field(layers){
  let value='',active=0;
  const animations=new Map();
  return next=>{
   if(next===value)return;
   const first=!value;value=next;
   const incoming=first?active:1-active;
   layers.forEach((layer,index)=>{
    const opacity=Number.parseFloat(globalThis.getComputedStyle?.(layer).opacity??layer.style.opacity??0)||0;
    animations.get(layer)?.cancel();
    if(index===incoming)layer.textContent=next;
    const target=index===incoming?1:0;
    layer.style.opacity=String(target);
    if(!first&&!reducedMotion()&&layer.animate){
     const animation=layer.animate([{opacity},{opacity:target}],{duration:220,easing:'ease-out'});
     animations.set(layer,animation);
    }
   });
   active=incoming;
  };
 }
 const pitch=field(pitchLayers),voice=field(voiceLayers);
 let hideTimer;
 return (note,instrument)=>{
  pitch(note);voice(instrument);
  root.setAttribute('aria-label',`${note} · ${instrument}`);
  root.classList.add('show');
  clearTimeout(hideTimer);
  hideTimer=setTimeout(()=>root.classList.remove('show'),1800);
 };
}
