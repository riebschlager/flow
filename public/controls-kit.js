// Flow design system primitives: Segmented, swatch grid, Stepper, Layer,
// EnvelopeGraph and Popover. Like the knobs, each one is a progressive enhancement: the
// native input stays the state, the component writes .value and dispatches
// input/change, and programmatic writes and `disabled` flow back into the view.
// Nothing here runs on import; a component appears only where it is applied.
import {colorPalettes} from './palettes.js?rev=gestures-32';

export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
let lastScroll=0;
export const recentlyScrolled=()=>Date.now()-lastScroll<400;
if(typeof document!=='undefined')document.addEventListener('scroll',()=>{lastScroll=Date.now();},{capture:true,passive:true});

// Wraps an instance property so programmatic writes re-render. Chains onto any
// earlier wrapper, so a knob and an envelope graph can watch the same range.
export function watchProp(el,prop,render){
 let desc=Object.getOwnPropertyDescriptor(el,prop);
 for(let proto=Object.getPrototypeOf(el);!desc&&proto;proto=Object.getPrototypeOf(proto))desc=Object.getOwnPropertyDescriptor(proto,prop);
 if(!desc?.set)return;
 Object.defineProperty(el,prop,{configurable:true,enumerable:desc.enumerable,get(){return desc.get.call(this);},set(v){desc.set.call(this,v);render();}});
}
export function watchControl(el,render,props=['value']){
 for(const prop of props)watchProp(el,prop,render);
 el.addEventListener('input',render);el.addEventListener('change',render);
 new MutationObserver(render).observe(el,{attributes:true,attributeFilter:['disabled']});
}
const fire=(el,type)=>el.dispatchEvent(new Event(type,{bubbles:true}));
const labelFor=el=>el.id?document.querySelector(`label[for="${el.id}"]`):null;
function make(tag,className,parent){const el=document.createElement(tag);if(className)el.className=className;parent?.append(el);return el;}
function svg(tag,attrs,parent){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);parent?.append(el);return el;}

// A radio group mirroring a native select. Arrow keys move and select (radio
// semantics); options added, removed or disabled later rebuild the group.
function choiceGroup(select,className,renderOption){
 const group=make('div',className);group.setAttribute('role','radiogroup');
 const label=labelFor(select);
 // A generated label id must not take an id the app already writes to (rhythmRateLabel).
 if(label){if(!label.id){let id=select.id+'Label';while(document.getElementById(id))id+='-group';label.id=id;}group.setAttribute('aria-labelledby',label.id);label.addEventListener('click',e=>{e.preventDefault();group.querySelector('[tabindex="0"]')?.focus();});}
 else if(select.getAttribute('aria-label'))group.setAttribute('aria-label',select.getAttribute('aria-label'));
 let buttons=[];
 function render(){
  const index=select.selectedIndex,off=select.disabled;
  buttons.forEach((b,i)=>{const on=i===index;b.setAttribute('aria-checked',String(on));b.tabIndex=on||(index<0&&i===0)?0:-1;b.disabled=off||!!select.options[i]?.disabled;});
  group.classList.toggle('is-disabled',off);group.setAttribute('aria-disabled',String(off));
 }
 function build(){
  buttons=[...select.options].map((option,i)=>{
   const b=make('button');b.type='button';b.setAttribute('role','radio');b.dataset.value=option.value;
   renderOption(b,option);b.addEventListener('click',()=>choose(i));return b;
  });
  group.replaceChildren(...buttons);render();
 }
 function choose(i,focus){
  const option=select.options[i];
  if(!option||option.disabled||select.disabled)return;
  if(select.selectedIndex!==i){select.value=option.value;fire(select,'input');fire(select,'change');}
  if(focus)buttons[i]?.focus();
 }
 group.addEventListener('keydown',e=>{
  const n=buttons.length,from=Math.max(0,select.selectedIndex),dir={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];
  const usable=i=>!select.options[i]?.disabled;
  let to=-1;
  if(dir)for(let k=1;k<=n;k++){const i=(from+dir*k+n*k)%n;if(usable(i)){to=i;break;}}
  else if(e.key==='Home')to=buttons.findIndex((_,i)=>usable(i));
  else if(e.key==='End')to=buttons.findLastIndex((_,i)=>usable(i));
  else return;
  e.preventDefault();if(to>=0)choose(to,true);
 });
 watchControl(select,render,['value','selectedIndex']);
 new MutationObserver(build).observe(select,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','label']});
 document.addEventListener('flow:selects',render);
 select.dataset.enhanced=className;select.tabIndex=-1;select.setAttribute('aria-hidden','true');
 select.after(group);build();
 return group;
}

export function enhanceSegmented(select,{size,full}={}){
 if(select.dataset.enhanced)return null;
 // An option's data-label gives a shorter segment; the full text becomes its title.
 const group=choiceGroup(select,'segmented',(b,option)=>{
  // select-ui.js may shorten option.label ("Paint"), so the title reads the full text.
  const text=option.textContent||option.label,short=option.dataset?.label;
  b.textContent=short||text;
  if(short&&short!==text)b.title=text;
 });
 if(size==='sm')group.classList.add('segmented-sm');
 if(full)group.classList.add('segmented-full');
 return group;
}

export function enhanceSwatchGrid(select,palettes=colorPalettes){
 if(select.dataset.enhanced)return null;
 return choiceGroup(select,'swatch-grid',(b,option)=>{
  const palette=palettes[option.value];
  const dots=make('span','swatch-dots',b);dots.setAttribute('aria-hidden','true');
  for(const color of palette?.colors||[])make('i',null,dots).style.setProperty('--swatch',color.hex);
  make('span','swatch-name',b).textContent=palette?.name||option.textContent;
  if(palette?.description)b.title=palette.description;
 });
}

// Tempo-style number: −/+ buttons around a scrubbable value. Drag vertically
// (200px = full range, Shift = fine), wheel and arrows step, double-click resets.
const DRAG_PX=200;
export function enhanceStepper(input,{label,unit}={}){
 if(input.dataset.enhanced)return null;
 const bounds=()=>({min:+input.min||0,max:input.max===''?100:+input.max,step:+input.step||1});
 const snap=x=>{const {min,max,step}=bounds();return clamp(+(min+Math.round((x-min)/step)*step).toFixed(6),min,max);};
 const current=()=>{const x=parseFloat(input.value);return Number.isFinite(x)?x:+input.defaultValue||bounds().min;};
 const name=label||input.getAttribute('aria-label')||labelFor(input)?.textContent.trim()||input.id;
 const root=make('div','stepper');
 if(label)make('span','stepper-label',root).textContent=label;
 const row=make('div','stepper-row',root);
 const button=(text,dir)=>{const b=make('button','stepper-button',row);b.type='button';b.textContent=text;b.setAttribute('aria-label',`${dir<0?'Decrease':'Increase'} ${name.toLowerCase()}`);b.addEventListener('click',()=>step(dir));return b;};
 const minus=button('−',-1);
 const value=make('span','stepper-value',row);value.setAttribute('role','spinbutton');value.setAttribute('aria-label',name);
 const plus=button('+',1);
 if(unit)make('span','stepper-unit',root).textContent=unit;
 function set(x,type='input'){
  x=snap(x);
  if(x!==current()){input.value=String(x);fire(input,'input');}
  if(type==='change')fire(input,'change');
 }
 function step(dir,size){if(input.disabled)return;set(current()+dir*(size||bounds().step),'change');}
 function render(){
  const x=current(),{min,max}=bounds(),off=input.disabled;
  value.textContent=String(x);
  value.setAttribute('aria-valuenow',String(x));value.setAttribute('aria-valuemin',String(min));value.setAttribute('aria-valuemax',String(max));
  value.setAttribute('aria-valuetext',unit?`${x} ${unit}`:String(x));value.setAttribute('aria-disabled',String(off));
  value.tabIndex=off?-1:0;minus.disabled=off||x<=min;plus.disabled=off||x>=max;root.classList.toggle('is-disabled',off);
 }
 const drag={on:false,y:0,acc:0};
 value.addEventListener('pointerdown',e=>{
  if(input.disabled||e.button>0)return;
  e.preventDefault();value.focus();value.setPointerCapture?.(e.pointerId);
  Object.assign(drag,{on:true,y:e.clientY,acc:current()});root.classList.add('is-live');
 });
 value.addEventListener('pointermove',e=>{
  if(!drag.on)return;
  const {min,max}=bounds();
  drag.acc=clamp(drag.acc+(drag.y-e.clientY)/DRAG_PX*(max-min)*(e.shiftKey?.1:1),min,max);drag.y=e.clientY;
  set(drag.acc);
 });
 const up=()=>{if(!drag.on)return;drag.on=false;root.classList.remove('is-live');fire(input,'change');};
 value.addEventListener('pointerup',up);value.addEventListener('pointercancel',up);
 value.addEventListener('keydown',e=>{
  if(input.disabled)return;
  const {min,max,step:s}=bounds(),page=Math.max(s,snap(min+(max-min)/10)-min);
  const map={ArrowUp:s,ArrowRight:s,ArrowDown:-s,ArrowLeft:-s,PageUp:page,PageDown:-page};
  if(e.key in map){e.preventDefault();set(current()+map[e.key],'change');}
  else if(e.key==='Home'||e.key==='End'){e.preventDefault();set(e.key==='Home'?min:max,'change');}
 });
 value.addEventListener('wheel',e=>{if(input.disabled||recentlyScrolled())return;e.preventDefault();step(e.deltaY<0?1:-1);},{passive:false});
 value.addEventListener('dblclick',()=>{if(!input.disabled)set(+input.defaultValue,'change');});
 watchControl(input,render);
 input.dataset.enhanced='stepper';input.tabIndex=-1;input.setAttribute('aria-hidden','true');
 input.after(root);render();
 return root;
}

// A switch's description mirrors a live status element, which stays in the
// tree as a visually hidden live region.
export function mirrorStatus(toggle,status,description){
 if(!status||toggle.dataset.status)return null;
 const label=labelFor(toggle)||toggle.closest?.('label');
 let desc=description||label?.querySelector('small');
 if(!desc&&label){desc=make('small');(label.querySelector('span')||label).append(desc);}
 if(!desc)return null;
 toggle.dataset.status=status.id||'1';
 const mirror=()=>{if(desc.textContent!==status.textContent)desc.textContent=status.textContent;};
 new MutationObserver(mirror).observe(status,{childList:true,characterData:true,subtree:true});
 status.classList.add('sr-only');mirror();
 return desc;
}

// The kit's Layer: the switch is the disclosure. Its body opens by animating
// grid-template-rows and is inert while closed. The description mirrors status.
export function enhanceLayer(toggle,body,{status,description}={}){
 if(toggle.dataset.layer)return null;
 toggle.dataset.layer='1';
 const wrap=make('div','layer-body'),inner=make('div','layer-body-inner',wrap);
 wrap.id=(toggle.id||'layer')+'Body';
 body.before(wrap);inner.append(body);
 toggle.setAttribute('aria-controls',wrap.id);
 const host=toggle.closest?.('section');
 function render(){
  const open=toggle.checked;
  wrap.classList.toggle('is-open',open);wrap.inert=!open;
  host?.classList.toggle('is-on',open);
 }
 mirrorStatus(toggle,status,description);
 watchControl(toggle,render,['checked']);
 render();
 return wrap;
}

// A trigger and the panel it opens. Escape, a click outside or focus leaving
// closes it. As a menu, arrow keys move between items and choosing one closes it.
// The panel stays in the markup; only `hidden` and aria-expanded change.
export function enhancePopover(trigger,panel,{menu=false}={}){
 if(trigger.dataset.popover)return null;
 trigger.dataset.popover=panel.id||'1';
 const host=trigger.parentElement;
 if(panel.id)trigger.setAttribute('aria-controls',panel.id);
 trigger.setAttribute('aria-haspopup',menu?'menu':'dialog');trigger.setAttribute('aria-expanded','false');
 const items=()=>[...panel.querySelectorAll(menu?'[role=menuitem]':'button,input,select,textarea,a[href],[tabindex]')].filter(el=>!el.disabled&&!el.hidden);
 const isOpen=()=>!panel.hidden;
 function outside(e){if(!host.contains(e.target))close();}
 function open({focus='first'}={}){
  if(isOpen())return;
  panel.hidden=false;trigger.setAttribute('aria-expanded','true');host.classList.add('is-open');
  document.addEventListener('pointerdown',outside,true);
  const list=items();(focus==='last'?list.at(-1):list[0])?.focus();
 }
 function close({restore=false}={}){
  if(!isOpen())return;
  panel.hidden=true;trigger.setAttribute('aria-expanded','false');host.classList.remove('is-open');
  document.removeEventListener('pointerdown',outside,true);
  if(restore)trigger.focus();
 }
 trigger.addEventListener('click',()=>isOpen()?close():open());
 trigger.addEventListener('keydown',e=>{if(menu&&(e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();open({focus:e.key==='ArrowUp'?'last':'first'});}});
 panel.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close({restore:true});return;}
  if(!menu)return;
  const list=items(),i=list.indexOf(document.activeElement),n=list.length;
  const to={ArrowDown:(i+1)%n,ArrowUp:(i-1+n)%n,Home:0,End:n-1}[e.key];
  if(to===undefined||!n)return;
  e.preventDefault();list[to].focus();
 });
 // An item's own click handler runs first; then the menu closes.
 if(menu)panel.addEventListener('click',e=>{if(e.target.closest?.('[role=menuitem]'))close({restore:true});});
 host.addEventListener('focusout',e=>{if(isOpen()&&e.relatedTarget&&!host.contains(e.relatedTarget))close();});
 panel.hidden=true;
 return {open,close,get isOpen(){return isOpen();}};
}

// ADSR preview drawn from the arpeggiator's note-shape ranges. The segment of
// whichever range is focused or was just moved is drawn in the accent.
export const ENVELOPE={a:'arpAttack',d:'arpDecay',s:'arpSustain',r:'arpLength'};
const GRAPH={W:280,H:72,pad:6};
export function envelopePoints({attack=20,decay=120,sustain=.65,length=.85}){
 const {W,H,pad}=GRAPH,base=H-pad,top=pad;
 const a=Math.min(attack/2000,1)*.3*W,d=Math.min(decay/2000,1)*.3*W;
 const end=pad+Math.min(Math.max(length,.1),4)/4*(W-pad*2)*.9+20;
 const x0=pad,x1=x0+Math.max(a,2),x2=x1+Math.max(d,2),x4=Math.min(W-pad,Math.max(end,x2+20)),x3=x4-18;
 const sy=base-(base-top)*clamp(sustain,0,1);
 return [[x0,base],[x1,top],[x2,sy],[Math.max(x3,x2),sy],[x4,base]];
}
const SEGMENTS={a:[0,1],d:[1,2],s:[2,3],r:[3,4]};
export function enhanceEnvelopeGraph(host,ids=ENVELOPE){
 if(host.dataset.enhanced)return null;
 const inputs=Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,document.getElementById(id)]));
 if(Object.values(inputs).some(input=>!input))return null;
 host.dataset.enhanced='envelope-graph';
 const {W,H,pad}=GRAPH;
 const root=svg('svg',{class:'envelope-graph',viewBox:`0 0 ${W} ${H}`,preserveAspectRatio:'none',role:'img','aria-label':'Note envelope'});
 for(const f of [.25,.5,.75])svg('line',{class:'envelope-grid',x1:W*f,x2:W*f,y1:pad,y2:H-pad},root);
 svg('line',{class:'envelope-base',x1:0,x2:W,y1:H-pad,y2:H-pad},root);
 const area=svg('polygon',{class:'envelope-area'},root),line=svg('polyline',{class:'envelope-line'},root),seg=svg('polyline',{class:'envelope-active'},root);
 let focusedKey=null,movedKey=null,timer;
 function render(){
  const pts=envelopePoints({attack:+inputs.a.value,decay:+inputs.d.value,sustain:+inputs.s.value/100,length:+inputs.r.value/100});
  const join=p=>p.map(q=>q.map(n=>+n.toFixed(2)).join(',')).join(' ');
  area.setAttribute('points',join(pts));line.setAttribute('points',join(pts));
  const active=focusedKey||movedKey;
  root.dataset.active=active||'';
  seg.setAttribute('points',active?join(SEGMENTS[active].map(i=>pts[i])):'');
  root.classList.toggle('is-disabled',Object.values(inputs).every(input=>input.disabled));
 }
 // The focused range wins; otherwise the one that just moved. Cells are looked
 // up on each event, so knobs may be built before or after the graph.
 const refocus=()=>{
  focusedKey=Object.keys(inputs).find(k=>(inputs[k].closest?.('.knob-cell')||inputs[k]).contains(document.activeElement))||null;
  render();
 };
 document.addEventListener('focusin',refocus);document.addEventListener('focusout',()=>queueMicrotask(refocus));
 for(const [k,input] of Object.entries(inputs)){
  input.addEventListener('input',()=>{clearTimeout(timer);movedKey=k;timer=setTimeout(()=>{movedKey=null;render();},700);});
  watchControl(input,render);
 }
 host.append(root);render();
 return root;
}
