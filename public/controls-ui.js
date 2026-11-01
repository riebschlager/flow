// Flow design system controls.
// Character parameters become knobs; levels stay sliders. Every native range
// remains the source of truth, so existing listeners, storage and sessions are
// unchanged: the knob writes .value and dispatches the same input/change events.
// Static helper copy moves into a "?" tip beside its section title.
// Segmented, swatch grid, Stepper, Layer, EnvelopeGraph, Popover, ChordStrip and
// Toast live in controls-kit.js and are applied per element by enhanceRail() and enhanceChrome() below.
import {clamp,recentlyScrolled,watchControl,enhanceSegmented,enhanceSwatchGrid,enhanceStepper,enhanceLayer,mirrorStatus,enhanceEnvelopeGraph,enhancePopover,enhanceChordStrip,enhanceToast} from './controls-kit.js?rev=controls-6b';
export {enhanceSegmented,enhanceSwatchGrid,enhanceStepper,enhanceLayer,mirrorStatus,enhanceEnvelopeGraph,envelopePoints,watchProp,enhancePopover,enhanceChordStrip,enhanceToast} from './controls-kit.js?rev=controls-6b';

export const KNOBS={
 reverb:{lg:true},delay:{lg:true},rhythmReverb:{},rhythmDelay:{},studioReverb:{},studioDelay:{},
 swirl:{},persistence:{},dropSize:{},chordAtmosphere:{},
 waterSwell:{sm:true},waterSpeed:{sm:true},waterRefraction:{sm:true},waterCaustics:{sm:true},waterReflection:{sm:true},
 arpProbability:{},arpCount:{},
 arpLength:{skew:2,sm:true},arpAttack:{skew:3,sm:true},arpDecay:{skew:3,sm:true},arpSustain:{sm:true},
 arpGlideTime:{skew:3,sm:true},arpGlideAmount:{sm:true},
 environmentActivity:{},environmentTone:{bipolar:true},
 rhythmSwing:{},rhythmHumanize:{},gestureAmount:{},driftPace:{}
};
const SWEEP=270,START=-135,DRAG_PX=200,FINE=.1,SIZES={sm:32,md:44,lg:64};
const valueProp=typeof HTMLInputElement==='undefined'?null:Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');

function polar(c,r,deg){const a=(deg-90)*Math.PI/180;return [c+r*Math.cos(a),c+r*Math.sin(a)];}
function arc(c,r,a0,a1){
 if(Math.abs(a1-a0)<.01)return '';
 const [x0,y0]=polar(c,r,Math.min(a0,a1)),[x1,y1]=polar(c,r,Math.max(a0,a1));
 return `M${x0} ${y0}A${r} ${r} 0 ${Math.abs(a1-a0)>180?1:0} 1 ${x1} ${y1}`;
}
function range(input){return {min:+input.min||0,max:input.max===''?100:+input.max,step:input.step==='any'?0:(+input.step||1)};}
export function toNorm(input,x,skew=1){const {min,max}=range(input);return Math.pow(clamp((x-min)/(max-min),0,1),1/skew);}
export function fromNorm(input,n,skew=1){const {min,max,step}=range(input);let x=min+(max-min)*Math.pow(clamp(n,0,1),skew);if(step)x=min+Math.round((x-min)/step)*step;return clamp(+x.toFixed(6),min,max);}

function setPct(input){const {min,max}=range(input);input.style.setProperty('--pct',(clamp((input.valueAsNumber-min)/(max-min),0,1)*100)+'%');}
function commit(input,x,type='input'){
 if(+valueProp.get.call(input)!==x)valueProp.set.call(input,String(x));
 input.dispatchEvent(new Event(type,{bubbles:true}));
}
// Programmatic updates (settings, sessions, presets) keep visuals in step.
const watchValue=(input,render)=>watchControl(input,render);

function buildKnob(input,opts){
 const skew=opts.skew||1,label=document.querySelector(`label[for="${input.id}"]`),output=label?.querySelector('output');
 const knob=document.createElement('div');
 const sizeName=opts.lg?'lg':opts.sm?'sm':'md';
 knob.className=sizeName==='md'?'knob':'knob knob-'+sizeName;knob.tabIndex=0;knob.setAttribute('role','slider');
 const name=label?[...label.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim():input.id;
 knob.setAttribute('aria-label',input.getAttribute('aria-label')||name);
 const size=SIZES[sizeName],W=size+14,c=W/2,r=size/2+4;
 knob.innerHTML=`<svg viewBox="0 0 ${W} ${W}" aria-hidden="true"><path class="knob-track" d="${arc(c,r,START,START+SWEEP)}"/><path class="knob-fill"/><circle class="knob-default" r="1.25"/></svg><div class="knob-body"></div><div class="knob-chip" aria-hidden="true"></div>`;
 const fill=knob.querySelector('.knob-fill'),dot=knob.querySelector('.knob-default'),chip=knob.querySelector('.knob-chip');
 const [dx,dy]=polar(c,r+3.5,START+toNorm(input,+input.defaultValue,skew)*SWEEP);dot.setAttribute('cx',dx);dot.setAttribute('cy',dy);
 const state={norm:0,dragging:false,lastY:0};
 const text=()=>output?.textContent||input.value;
 function render(){
  if(!state.dragging)state.norm=toNorm(input,input.valueAsNumber,skew);
  const ang=START+toNorm(input,input.valueAsNumber,skew)*SWEEP;
  fill.setAttribute('d',arc(c,r,opts.bipolar?0:START,ang));
  knob.style.setProperty('--angle',ang+'deg');
  const {min,max}=range(input);
  knob.setAttribute('aria-valuemin',min);knob.setAttribute('aria-valuemax',max);knob.setAttribute('aria-valuenow',input.value);knob.setAttribute('aria-valuetext',text());
  chip.textContent=text();
  knob.classList.toggle('is-disabled',input.disabled);knob.tabIndex=input.disabled?-1:0;knob.setAttribute('aria-disabled',String(input.disabled));
  setPct(input);
 }
 function nudge(dn,type){
  const before=input.valueAsNumber;
  state.norm=clamp(state.norm+dn,0,1);
  let x=fromNorm(input,state.norm,skew);
  if(type==='key'&&x===before&&dn){const {step,min,max}=range(input);x=clamp(before+Math.sign(dn)*(step||(max-min)/1000),min,max);state.norm=toNorm(input,x,skew);}
  if(x!==before)commit(input,x);
 }
 const live=on=>{knob.classList.toggle('is-live',on);label?.classList.toggle('is-live',on);};
 knob.addEventListener('pointerdown',e=>{
  if(input.disabled||e.button>0)return;
  e.preventDefault();knob.focus();knob.setPointerCapture(e.pointerId);
  Object.assign(state,{dragging:true,lastY:e.clientY,norm:toNorm(input,input.valueAsNumber,skew)});
  knob.classList.add('is-dragging');live(true);
 });
 knob.addEventListener('pointermove',e=>{
  if(!state.dragging)return;
  const d=state.lastY-e.clientY;state.lastY=e.clientY;
  nudge(d/DRAG_PX*(e.shiftKey?FINE:1));
 });
 const up=()=>{if(!state.dragging)return;state.dragging=false;knob.classList.remove('is-dragging');live(false);input.dispatchEvent(new Event('change',{bubbles:true}));render();};
 knob.addEventListener('pointerup',up);knob.addEventListener('pointercancel',up);
 knob.addEventListener('dblclick',()=>{if(input.disabled)return;commit(input,+input.defaultValue);commit(input,+input.defaultValue,'change');});
 knob.addEventListener('keydown',e=>{
  if(input.disabled)return;
  const f=e.shiftKey?.001:.01,map={ArrowUp:f,ArrowRight:f,ArrowDown:-f,ArrowLeft:-f,PageUp:.1,PageDown:-.1};
  if(e.key in map){e.preventDefault();state.norm=toNorm(input,input.valueAsNumber,skew);nudge(map[e.key],'key');}
  else if(e.key==='Home'||e.key==='End'){e.preventDefault();const {min,max}=range(input);commit(input,e.key==='Home'?min:max);}
  else return;
  input.dispatchEvent(new Event('change',{bubbles:true}));
 });
 knob.addEventListener('wheel',e=>{
  if(input.disabled||recentlyScrolled())return;
  e.preventDefault();state.norm=toNorm(input,input.valueAsNumber,skew);
  nudge((e.deltaY<0?1:-1)*(e.shiftKey?.002:.01),'key');
 },{passive:false});
 knob.addEventListener('focus',()=>live(true));knob.addEventListener('blur',()=>{if(!state.dragging)live(false);});
 label?.addEventListener('click',e=>{e.preventDefault();knob.focus();});
 input.tabIndex=-1;input.setAttribute('aria-hidden','true');
 watchValue(input,render);
 render();
 return knob;
}

function knobUnit(input){
 // A unit is the label, the range and its extents. Some dialogs wrap a pair in its own div.
 const label=document.querySelector(`label[for="${input.id}"]`);
 const parent=input.parentElement;
 if(parent.tagName==='DIV'&&parent.children.length<=3&&label?.parentElement===parent&&!parent.classList.length)return {cell:parent,nodes:null};
 const nodes=[label,input];
 if(input.nextElementSibling?.classList.contains('range-extents'))nodes.push(input.nextElementSibling);
 return {cell:null,nodes:nodes.filter(Boolean)};
}

export function enhanceKnobs(root=document){
 const cells=[];
 for(const [id,opts] of Object.entries(KNOBS)){
  const input=root.getElementById?.(id)||root.querySelector(`#${id}`);
  if(!input||input.type!=='range'||input.dataset.knob)continue;
  input.dataset.knob='1';
  const unit=knobUnit(input);
  let cell=unit.cell;
  if(!cell){cell=document.createElement('div');unit.nodes[0].before(cell);cell.append(...unit.nodes);}
  cell.classList.add('knob-cell');
  input.before(buildKnob(input,opts));
  cells.push(cell);
 }
 // Adjacent knob cells share a row.
 for(const cell of cells){
  if(cell.parentElement.classList.contains('knob-row'))continue;
  const row=document.createElement('div');row.className='knob-row';cell.before(row);
  let next=cell;
  while(next&&next.classList?.contains('knob-cell')){const after=next.nextElementSibling;row.append(next);next=after;}
 }
}

export function enhanceSliders(root=document){
 for(const input of root.querySelectorAll('input[type=range]')){
  if(input.dataset.knob||input.dataset.slider)continue;
  input.dataset.slider='1';
  if(input.dataset.orientation==='vertical')input.setAttribute('aria-orientation','vertical');
  watchValue(input,()=>setPct(input));setPct(input);
 }
 if(root.flowSliderEvents)return;root.flowSliderEvents=true;
 const isSlider=t=>t?.matches?.('input[type=range]')&&!t.dataset.knob;
 const live=(input,on)=>{input.classList.toggle('is-live',on);document.querySelector(`label[for="${input.id}"]`)?.classList.toggle('is-live',on);};
 root.addEventListener('pointerdown',e=>{if(isSlider(e.target)&&!e.target.disabled){const input=e.target;live(input,true);const end=()=>{live(input,false);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);};addEventListener('pointerup',end);addEventListener('pointercancel',end);}});
 root.addEventListener('input',e=>{if(e.target.matches?.('input[type=range]')&&!e.target.dataset.slider)setPct(e.target);});
 root.addEventListener('dblclick',e=>{if(isSlider(e.target)&&!e.target.disabled){commit(e.target,+e.target.defaultValue);commit(e.target,+e.target.defaultValue,'change');}});
 root.addEventListener('wheel',e=>{
  const input=e.target;
  if(!isSlider(input)||input.disabled||recentlyScrolled())return;
  e.preventDefault();
  const {min,max,step}=range(input),delta=(e.deltaY<0?1:-1)*Math.max(step,(max-min)*(e.shiftKey?.002:.01));
  const x=clamp(+(input.valueAsNumber+delta).toFixed(6),min,max);
  if(x!==input.valueAsNumber){commit(input,fromNorm(input,(x-min)/(max-min)));commit(input,input.valueAsNumber,'change');}
 },{passive:false});
}

function helpAnchor(container){
 if(container.matches('.fold-content'))return container.parentElement.querySelector(':scope>summary>span');
 const label=container.querySelector(':scope>.section-label,:scope>.section-head>.section-label,:scope>.split-row.option-row>span,:scope>.option-row>span');
 return label;
}
let tipCount=0;
export function enhanceHelpTips(root=document){
 const groups=new Map();
 for(const helper of root.querySelectorAll('.panel-content .helper')){
  // Helpers with an id are usually live status; a live description opts in with data-help-tip.
  if((helper.id||helper.getAttribute('role'))&&!helper.hasAttribute('data-help-tip')||helper.closest('.help-tip,.select-detail'))continue;
  const container=helper.closest('.fold-content,.control-section');
  if(!container||!container.querySelector('input,select,textarea'))continue;
  const anchor=helpAnchor(container);
  if(!anchor)continue;
  if(!groups.has(anchor))groups.set(anchor,[]);
  groups.get(anchor).push(helper);
 }
 for(const [anchor,helpers] of groups){
  const tip=document.createElement('span');tip.className='help-tip';
  const id='help-tip-'+(++tipCount);
  tip.innerHTML=`<button type="button" aria-label="More about this" aria-expanded="false" aria-describedby="${id}">?</button><span role="tooltip" id="${id}"></span>`;
  const button=tip.firstChild,pop=tip.lastChild;
  pop.append(...helpers);
  let timer;
  const set=open=>{clearTimeout(timer);tip.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open));};
  tip.addEventListener('mouseenter',()=>set(true));
  tip.addEventListener('mouseleave',()=>{timer=setTimeout(()=>set(false),80);});
  button.addEventListener('focus',()=>set(true));button.addEventListener('blur',()=>set(false));
  button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();set(!tip.classList.contains('open'));});
  button.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();set(false);}});
  tip.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();});
  if(anchor.matches('.section-label')){anchor.classList.add('has-help');anchor.append(tip);}else anchor.after(tip);
 }
}

// Design-system components per rail control. The native select stays the state.
export const SEGMENTED={chordLength:{full:true},waterPreset:{size:'sm',full:true},rhythmVisualMode:{size:'sm',full:true},arpRate:{size:'sm',full:true},rhythmRate:{full:true},
 gestureTool:{full:true},quantizeBeats:{size:'sm',full:true},octavesDown:{size:'sm',full:true},octavesUp:{size:'sm',full:true}};
export const SWATCH_GRIDS=['colorPalette'];
// Sections, and Mix level faders, that dim without disabling while their layer's switch is off.
// Droplets has no switch, so its fader never dims.
export const DIM_WHEN_OFF={rhythmVisualControls:'rhythmEnabled',arpVolume:'arpEnabled',rhythmVolume:'rhythmEnabled',environmentVolume:'environmentEnabled'};
// Each layer's switch reveals its controls, and its description shows the live status.
export const LAYERS={arpEnabled:{body:'arpControls',status:'arpStatus'},rhythmEnabled:{body:'rhythmControls',status:'rhythmStatus'},environmentEnabled:{body:'environmentControls',status:'environmentStatus'},
 quantizeEnabled:{body:'quantizeControls',status:'quantizeStatus'}};
// Other switches whose description shows a live status.
export const SWITCH_STATUS={arpGlideEnabled:'arpGlideSummary',driftEnabled:'driftStatus'};
export const ENVELOPE_GRAPHS=['arpEnvelope'];
export function enhanceRail(root=document){
 const byId=id=>root.getElementById?.(id)||null;
 for(const [id,opts] of Object.entries(SEGMENTED)){const select=byId(id);if(select)enhanceSegmented(select,opts);}
 for(const id of SWATCH_GRIDS){const select=byId(id);if(select)enhanceSwatchGrid(select);}
 for(const [id,{body,status}] of Object.entries(LAYERS)){const toggle=byId(id);if(toggle&&byId(body))enhanceLayer(toggle,byId(body),{status:byId(status)});}
 for(const [id,status] of Object.entries(SWITCH_STATUS)){const toggle=byId(id);if(toggle&&byId(status))mirrorStatus(toggle,byId(status));}
 for(const id of ENVELOPE_GRAPHS){const host=byId(id);if(host)enhanceEnvelopeGraph(host);}
 for(const [id,toggleId] of Object.entries(DIM_WHEN_OFF)){
  const el=byId(id),section=el?.closest?.('.fader')||el,toggle=byId(toggleId);
  if(!section||!toggle||section.dataset.dimWhenOff)continue;
  section.dataset.dimWhenOff=toggleId;
  const render=()=>section.classList.toggle('is-dimmed',!toggle.checked);
  watchControl(toggle,render,['checked']);render();
 }
 // select-ui.js drops the detail line under a select that is now a Segmented.
 document.dispatchEvent?.(new Event('flow:selects'));
}

// Top bar and transport components outside the rail.
// The capture popover opens from the chevron beside Record; its settings keep their ids.
export const POPOVERS={sessionMenuButton:{panel:'sessionMenu',menu:true},captureMenuButton:{panel:'capturePanel'}};
export const STEPPERS={bpm:{unit:'BPM'},recordCycles:{unit:'cycles'}};
export const CAPTURE_SEGMENTED={recordMode:{size:'sm',full:true}};
export const CHORD_STRIPS=['chords'];
export const TOASTS=['toast'];
export function enhanceChrome(root=document){
 const byId=id=>root.getElementById?.(id)||null;
 for(const [id,opts] of Object.entries(STEPPERS)){const input=byId(id);if(input)enhanceStepper(input,opts);}
 for(const [id,opts] of Object.entries(CAPTURE_SEGMENTED)){const select=byId(id);if(select)enhanceSegmented(select,opts);}
 for(const id of CHORD_STRIPS){const host=byId(id);if(host)enhanceChordStrip(host);}
 for(const id of TOASTS){const host=byId(id);if(host)enhanceToast(host);}
 for(const [id,{panel,...opts}] of Object.entries(POPOVERS)){const trigger=byId(id);if(trigger&&byId(panel))enhancePopover(trigger,byId(panel),opts);}
}

if(typeof document!=='undefined'){
 enhanceHelpTips();enhanceKnobs();enhanceSliders();enhanceRail();enhanceChrome();
}
