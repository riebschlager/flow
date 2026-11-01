import assert from 'node:assert/strict';import fs from 'node:fs';
// A small DOM: a tree with attributes, bubbling events, focus and an async
// MutationObserver. Enough to drive the enhancers the way a browser would.
const observers=new Set();
function notify(target,record){for(const o of observers)for(const {node,opts} of o.targets){const inside=node===target||(opts.subtree&&node.contains(target));if(!inside)continue;if(record.type==='attributes'&&(!opts.attributes||opts.attributeFilter&&!opts.attributeFilter.includes(record.attributeName)))continue;if(record.type==='childList'&&!opts.childList)continue;if(record.type==='characterData'&&!opts.characterData)continue;o.queue.push({...record,target});if(!o.pending){o.pending=true;queueMicrotask(()=>{o.pending=false;const q=o.queue.splice(0);if(q.length)o.fn(q,o);});}}}
// Selectors: compound tag.class.class[attr=value], descendant and child combinators, and :scope.
const simple=(n,s)=>{const m=s.match(/^([a-z]+)?((?:\.[\w-]+)*)(?:\[([\w-]+)(?:="?([^"\]]*)"?)?\])?$/i);if(!m)return false;const [,tag,cls,attr,val]=m;return (!tag||n.tagName===tag.toUpperCase())&&cls.split('.').filter(Boolean).every(c=>n.classList.contains(c))&&(!attr||(val===undefined?attr in n.attrs:n.getAttribute(attr)===val));};
function matchTokens(n,tokens,scope){
 const last=tokens.at(-1);if(!(last===':scope'?n===scope:simple(n,last)))return false;
 if(tokens.length===1)return true;
 if(tokens.at(-2)==='>')return !!n.parentElement&&matchTokens(n.parentElement,tokens.slice(0,-2),scope);
 for(let p=n.parentElement;p;p=p.parentElement)if(matchTokens(p,tokens.slice(0,-1),scope))return true;
 return false;
}
globalThis.MutationObserver=class{constructor(fn){this.fn=fn;this.targets=[];this.queue=[];}observe(node,opts){this.targets.push({node,opts});observers.add(this);}disconnect(){observers.delete(this);}};
class Node{
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.parentElement=null;this.attrs={};this.listeners={};this.dataset={};this.style={props:{},setProperty(k,v){this.props[k]=v;}};this.text='';const cls=new Set(),sync=()=>{this.attrs.class=[...cls].join(' ');};this.classList={add:(...c)=>{c.forEach(x=>cls.add(x));sync();},remove:(...c)=>{c.forEach(x=>cls.delete(x));sync();},contains:c=>cls.has(c),toggle:(c,on)=>{if(on??!cls.has(c))cls.add(c);else cls.delete(c);sync();return cls.has(c);}};}
 get className(){return this.attrs.class||'';}set className(v){String(v).split(/\s+/).filter(Boolean).forEach(c=>this.classList.add(c));}
 get id(){return this.attrs.id||'';}set id(v){this.attrs.id=String(v);}
 get tabIndex(){return this.attrs.tabindex===undefined?-1:+this.attrs.tabindex;}set tabIndex(v){this.setAttribute('tabindex',v);}
 get disabled(){return 'disabled' in this.attrs;}set disabled(v){v?this.setAttribute('disabled',''):this.removeAttribute('disabled');}
 get hidden(){return 'hidden' in this.attrs;}set hidden(v){v?this.setAttribute('hidden',''):this.removeAttribute('hidden');}
 setAttribute(k,v){const old=this.attrs[k];this.attrs[k]=String(v);if(k==='class'){this.classList.remove(...(old||'').split(' ').filter(Boolean));this.className=v;}notify(this,{type:'attributes',attributeName:k});}
 getAttribute(k){return this.attrs[k]??null;}hasAttribute(k){return k in this.attrs;}
 removeAttribute(k){if(!(k in this.attrs))return;delete this.attrs[k];notify(this,{type:'attributes',attributeName:k});}
 get textContent(){return this.text+this.children.map(c=>c.textContent).join('');}set textContent(v){for(const c of this.children)c.parentElement=null;this.children=[];this.text=String(v);notify(this,{type:'characterData'});notify(this,{type:'childList'});}
 append(...nodes){for(const n of nodes){n.remove();n.parentElement=this;this.children.push(n);}notify(this,{type:'childList'});}
 replaceChildren(...nodes){for(const c of this.children)c.parentElement=null;this.children=[];this.text='';this.append(...nodes);}
 remove(){const p=this.parentElement;if(!p)return;p.children.splice(p.children.indexOf(this),1);this.parentElement=null;notify(p,{type:'childList'});}
 before(...nodes){const p=this.parentElement;for(const n of nodes){n.remove();n.parentElement=p;p.children.splice(p.children.indexOf(this),0,n);}notify(p,{type:'childList'});}
 after(...nodes){const p=this.parentElement;let at=p.children.indexOf(this)+1;for(const n of nodes){n.remove();n.parentElement=p;p.children.splice(at++,0,n);}notify(p,{type:'childList'});}
 get childNodes(){return [...(this.text?[{nodeType:3,textContent:this.text}]:[]),...this.children];}
 get nextElementSibling(){const p=this.parentElement;return p?p.children[p.children.indexOf(this)+1]||null:null;}
 contains(n){for(;n;n=n.parentElement)if(n===this)return true;return false;}
 matches(sel,scope){return sel.split(',').some(s=>matchTokens(this,s.trim().replace(/\s*>\s*/g,' > ').split(/\s+/),scope));}
 closest(sel){if(this.matches(sel))return this;return this.parentElement?.closest(sel)||null;}
 querySelectorAll(sel){const out=[];const walk=n=>{for(const c of n.children){if(c.matches(sel,this))out.push(c);walk(c);}};walk(this);return out;}
 get firstChild(){return this.children[0]||null;}get lastChild(){return this.children.at(-1)||null;}
 querySelector(sel){return this.querySelectorAll(sel)[0]||null;}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
 dispatchEvent(e){Object.defineProperty(e,'target',{value:this,configurable:true});const path=[];for(let n=this.parentElement;n;n=n.parentElement)path.push(n);for(const n of [this,...path]){for(const fn of n.listeners[e.type]||[])fn(e);if(!e.bubbles)return !e.defaultPrevented;}if(this===doc.body||doc.body.contains(this))doc.dispatchEvent(e);return !e.defaultPrevented;}
 focus(){if(this.disabled||!('tabindex' in this.attrs)&&!['INPUT','SELECT','BUTTON'].includes(this.tagName))return;const prev=doc.activeElement;if(prev===this)return;doc.activeElement=this;prev?.dispatchEvent?.(new Event('focusout',{bubbles:true}));this.dispatchEvent(Object.assign(new Event('focusin',{bubbles:true}),{relatedTarget:prev||null}));}
 setPointerCapture(){}
 // Enough HTML for the rail's markup: text, bare attributes, void elements, data-* and selected options.
 set innerHTML(html){const stack=[this];this.replaceChildren();for(const [,close,tag,raw,self,text] of html.matchAll(/<(\/)?([\w-]+)([^>]*?)(\/)?>|([^<]+)/g)){if(text!==undefined){stack.at(-1).text+=text.replace(/&amp;/g,'&');continue;}if(close){stack.pop();continue;}const n=doc.createElement(tag);for(const [,k,v=''] of raw.matchAll(/([\w-]+)(?:="([^"]*)")?/g)){k==='class'?n.className=v:n.attrs[k]=v;if(k.startsWith('data-'))n.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;}if(n instanceof Input)n.raw=n.attrs.value||'';const parent=stack.at(-1);parent.append(n);if(n instanceof Option&&'selected' in n.attrs&&parent instanceof Select)parent.index=parent.options.length-1;if(!self&&!VOID.has(n.tagName))stack.push(n);}}
 click(){if(!this.disabled)this.dispatchEvent(new Event('click',{bubbles:true}));}
}
const VOID=new Set(['INPUT','BR','IMG','HR','META','LINK','SOURCE']);
class Input extends Node{
 constructor(){super('input');this.raw='';}
 get type(){return this.attrs.type||'text';}set type(v){this.attrs.type=v;}
 get value(){return this.raw;}set value(v){this.raw=String(v);}
 get defaultValue(){return this.attrs.value||'';}
 get min(){return this.attrs.min||'';}get max(){return this.attrs.max||'';}get step(){return this.attrs.step||'';}
 get valueAsNumber(){return parseFloat(this.raw);}
 get checked(){return !!this.on;}set checked(v){this.on=!!v;}
}
class Option extends Node{constructor(value,text){super('option');this.attrs.value=value;this.text=text;}get value(){return this.attrs.value;}get label(){return this.attrs.label||this.textContent;}}
class Select extends Node{
 constructor(){super('select');this.index=0;}
 get options(){return this.children.filter(c=>c instanceof Option);}
 get selectedIndex(){return this.options.length?Math.min(this.index,this.options.length-1):-1;}set selectedIndex(i){this.index=i;}
 get value(){return this.options[this.selectedIndex]?.value??'';}set value(v){const i=this.options.findIndex(o=>o.value===String(v));this.index=i;}
}
const doc={activeElement:null,listeners:{},body:new Node('body'),
 createElement:tag=>tag==='input'?new Input():tag==='select'?new Select():tag==='option'?new Option('',''):new Node(tag),
 createElementNS:(_,tag)=>new Node(tag),
 getElementById(id){return this.body.querySelectorAll(`[id="${id}"]`)[0]||null;},
 querySelectorAll(sel){return this.body.querySelectorAll(sel);},
 querySelector(sel){const m=sel.match(/^label\[for="([^"]+)"\]$/);return m?this.body.querySelectorAll('label').find(l=>l.attrs.for===m[1])||null:this.body.querySelector(sel);},
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);},
 removeEventListener(k,fn){this.listeners[k]=(this.listeners[k]||[]).filter(f=>f!==fn);},
 dispatchEvent(e){for(const fn of this.listeners[e.type]||[])fn(e);}};
doc.body.querySelectorAll=function(sel){const m=sel.match(/^\[id="([^"]+)"\]$/);if(m){const out=[];const walk=n=>{for(const c of n.children){if(c.id===m[1])out.push(c);walk(c);}};walk(this);return out;}return Node.prototype.querySelectorAll.call(this,sel);};
globalThis.document=doc;globalThis.HTMLInputElement=Input;
const flush=()=>new Promise(r=>setTimeout(r,0));
const key=(el,k,extra={})=>{const e=new Event('keydown',{bubbles:true,cancelable:true});Object.assign(e,{key:k,...extra});el.dispatchEvent(e);return e;};
const pointer=(el,type,extra)=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.assign(e,{button:0,pointerId:1,shiftKey:false,...extra});el.dispatchEvent(e);};
function log(el){const seen=[];el.addEventListener('input',()=>seen.push('input:'+el.value));el.addEventListener('change',()=>seen.push('change:'+el.value));return seen;}
function select(id,values,label){const wrap=new Node('div');doc.body.append(wrap);if(label){const l=new Node('label');l.attrs.for=id;l.textContent=label;wrap.append(l);}const s=new Select();s.id=id;for(const [v,t] of values)s.append(new Option(v,t));wrap.append(s);return s;}

const {KNOBS,SEGMENTED,SWATCH_GRIDS,LAYERS,SWITCH_STATUS,DIM_WHEN_OFF,POPOVERS,STEPPERS,CAPTURE_SEGMENTED,CHORD_STRIPS,TOASTS,TRACK_LISTS,DIALOG_SEGMENTED,STEP_GRIDS,enhanceChrome,enhanceChordStrip,enhanceToast,toNorm,fromNorm,enhanceSegmented,enhanceSwatchGrid,enhanceStepper,enhanceLayer,enhanceEnvelopeGraph,envelopePoints,enhanceKnobs,enhanceHelpTips,enhanceRail}=await import('../public/controls-ui.js');
const html=fs.readFileSync(new URL('../app/instrument.html',import.meta.url),'utf8');
for(const id of Object.keys(KNOBS)){assert.match(html,new RegExp(`<input id="${id}" type="range"`),`${id} is a range input`);assert.match(html,new RegExp(`<label class="slider-label" for="${id}"[^>]*>`),`${id} has a slider label`);}
for(const level of ['volume','dropletsVolume','arpVolume','rhythmVolume','environmentVolume','rain','energy'])assert.ok(!(level in KNOBS),`${level} stays a slider`);
const ms={min:'0',max:'2000',step:'5'},pct={min:'0',max:'100',step:''};
assert.equal(fromNorm(pct,toNorm(pct,65)),65);
for(const x of [0,20,120,180,2000])assert.equal(fromNorm(ms,toNorm(ms,x,3),3),x);
assert.ok(toNorm(ms,200,3)>.45,'skewed taper gives the musical range most of the travel');
assert.equal(fromNorm(ms,.5,3)%5,0,'values snap to the input step');
assert.equal(fromNorm(pct,1.4),100);assert.equal(fromNorm(pct,-1),0);

// Primitives are applied at startup by enhanceRail(), never written into the markup.
for(const marker of ['class="segmented','class="swatch-grid','class="stepper','class="layer-body','envelope-graph'])assert.ok(!html.includes(marker),`${marker} is built at runtime, not in the markup`);
// A vertical fader is a native range with an attribute; only the four Mix layer levels use it.
assert.deepEqual([...html.matchAll(/<input id="(\w+)"[^>]*data-orientation="vertical"/g)].map(m=>m[1]),['dropletsVolume','arpVolume','rhythmVolume','environmentVolume']);

// Phase 2: the Sound and Scene tabs match their target tables.
{
 const panel=id=>html.match(new RegExp(`<div id="${id}"[^>]*>([\\s\\S]*?)\\n</div>`))[1];
 const sound=panel('soundPanel'),scene=panel('fluidPanel');
 for(const [name,markup] of [['Sound',sound],['Scene',scene]])assert.ok(!markup.includes('<details'),`${name} has no folds`);
 const order=(markup,titles)=>titles.map(t=>{const i=markup.indexOf(t);assert.ok(i>=0,`${t} is present`);return i;}).forEach((i,k,all)=>assert.ok(!k||i>all[k-1],`${titles[k]} follows ${titles[k-1]}`));
 order(sound,['for="soundscape">Vibe<','for="progression">Chord progression<','<label for="chordLength">Chord length</label>','<div class="section-label">Color voices</div><div id="voices"></div>']);
 order(scene,['for="energy">Energy<','for="colorPalette">Color palette<','<div class="section-label">The fluid</div>','<div class="section-label">Percussion response</div>']);
 for(const id of ['scapeDescription','progressionDescription'])assert.match(sound,new RegExp(`id="${id}"[^>]*data-help-tip`),`${id} moves into its section's HelpTip`);
 const paletteSection=scene.match(/<section class="control-section"><label class="section-label" for="colorPalette">[\s\S]*?<\/section>/)[0];
 assert.ok(paletteSection.includes('<p class="helper color-guide">Choose a swatch on the canvas to use only that color and voice. Turn on <strong>Cycle colors</strong> beside the palette to randomly use each color once before repeating, for painting, rain, and blooms.</p>'),'Color behavior copy moves verbatim into the palette section');
 assert.ok(!/COLOR BEHAVIOR/i.test(html),'the Color behavior section is gone');
 const fluid=scene.match(/<div class="section-label">The fluid<\/div>[\s\S]*?<\/section>/)[0];
 for(const id of ['swirl','persistence','dropSize','chordAtmosphere'])assert.ok(fluid.includes(`<input id="${id}" type="range"`),`${id} sits in The fluid`);
 assert.ok(fluid.includes('<input id="fluidListens" type="checkbox" role="switch"'),'fluidListens is a switch in The fluid (decision 3)');assert.match(fluid,/id="fluidListensHelp"[^>]*data-help-tip/,'its helper moves into the HelpTip');
 for(const id of ['fluidListens','fluidListensHelp','soundscape','progression','chordInput','applyChords','chordLength','voices','voiceControls','energy','energyValue','colorPalette','palettePreview','paletteDescription','swirl','persistence','dropSize','chordAtmosphere','rhythmVisualControls','rhythmVisualMode','rhythmVisual'])assert.equal(html.match(new RegExp(`id="${id}"`,'g'))?.length,1,`${id} keeps exactly one home`);
 assert.deepEqual(Object.keys(SEGMENTED).slice(0,2),['chordLength','rhythmVisualMode']);assert.deepEqual(SWATCH_GRIDS,['colorPalette']);
}
assert.match(html,/<input id="bpm" type="number" min="30" max="100" step="2" value="56" aria-label="Tempo" hidden>/,'tempo state has a hidden number input for the Stepper');
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
assert.match(app,/function showBpm\(\)\{\$\('bpm'\)\.value=state\.bpm;\}/,'every tempo change writes the hidden input');
assert.ok(!/\$\('bpm'\)\.value=state\.bpm/.test(app.replace(/function showBpm[^\n]*/,'')),'no tempo write bypasses showBpm');
assert.ok(!/bpmLabel|'slower'|'faster'/.test(app+html),'the Stepper replaces the −/+ buttons and label');
assert.match(app,/\$\('bpm'\)\.addEventListener\('input',\(\)=>\{const value=Number\(\$\('bpm'\)\.value\);if\(Number\.isFinite\(value\)&&value!==state\.bpm\)setBpm\(value\);\}\);/,'the hidden input drives tempo');

// Segmented: a radio group over the native select.
{
 const s=select('chordLength',[['4','4 beats'],['8','8 beats'],['16','16 beats']],'Chord length');s.value='8';
 const seen=log(s),group=enhanceSegmented(s,{size:'sm'});
 assert.equal(enhanceSegmented(s),null,'enhancing twice is a no-op');
 assert.equal(s.nextElementSibling,group,'the group follows its select');
 assert.equal(s.dataset.enhanced,'segmented');assert.equal(s.getAttribute('aria-hidden'),'true');
 assert.equal(group.getAttribute('role'),'radiogroup');assert.equal(group.getAttribute('aria-labelledby'),'chordLengthLabel');
 assert.ok(group.classList.contains('segmented-sm'));
 const b=()=>group.children;
 assert.deepEqual(b().map(x=>x.textContent),['4 beats','8 beats','16 beats']);
 assert.deepEqual(b().map(x=>x.getAttribute('aria-checked')),['false','true','false']);
 assert.deepEqual(b().map(x=>x.tabIndex),[-1,0,-1],'roving tab stop sits on the checked option');
 b()[2].click();
 assert.equal(s.value,'16');assert.deepEqual(seen,['input:16','change:16'],'a click writes .value and dispatches input then change');
 b()[2].click();assert.equal(seen.length,2,'re-choosing the current value is silent');
 s.value='4';assert.equal(b()[0].getAttribute('aria-checked'),'true','programmatic .value updates the group');
 s.selectedIndex=1;assert.equal(b()[1].getAttribute('aria-checked'),'true','programmatic selectedIndex updates the group');
 seen.length=0;
 const e=key(b()[1],'ArrowRight');assert.ok(e.defaultPrevented);
 assert.equal(s.value,'16');assert.equal(doc.activeElement,b()[2],'arrow keys move focus and selection');
 key(b()[2],'ArrowRight');assert.equal(s.value,'4','arrows wrap');
 key(b()[0],'ArrowLeft');assert.equal(s.value,'16');
 key(b()[2],'Home');assert.equal(s.value,'4');key(b()[0],'End');assert.equal(s.value,'16');
 assert.deepEqual(seen,['input:16','change:16','input:4','change:4','input:16','change:16','input:4','change:4','input:16','change:16']);
 assert.equal(key(b()[2],'a').defaultPrevented,false,'other keys pass through');
 s.options[0].disabled=true;await flush();
 assert.equal(b()[0].disabled,true,'a disabled option disables its segment');
 key(b()[2],'ArrowRight');assert.equal(s.value,'8','arrows skip disabled options');
 s.options[0].disabled=false;
 s.disabled=true;await flush();
 assert.ok(group.classList.contains('is-disabled'));assert.equal(group.getAttribute('aria-disabled'),'true');
 assert.ok(b().every(x=>x.disabled),'disabling the select disables every segment');
 seen.length=0;b()[0].click();key(b()[1],'ArrowRight');assert.equal(s.value,'8');assert.equal(seen.length,0,'a disabled group writes nothing');
 s.disabled=false;await flush();
 assert.ok(!group.classList.contains('is-disabled'));assert.equal(b()[0].disabled,false,'re-enabling restores the segments');
 s.append(new Option('32','32 beats'));await flush();
 assert.equal(b().length,4,'added options rebuild the group');assert.equal(b()[1].getAttribute('aria-checked'),'true','and keep the selection');
 const label=doc.querySelector('label[for="chordLength"]');label.dispatchEvent(new Event('click',{bubbles:true,cancelable:true}));
 assert.equal(doc.activeElement,b()[1],'the label focuses the checked segment');
 const mode=select('beatMotion',[['both','Ripples + stir the fluid'],['ripples','Ripples only']]);mode.options[0].dataset.label='Ripples + stir';
 const modes=enhanceSegmented(mode).children;
 assert.deepEqual(modes.map(x=>x.textContent),['Ripples + stir','Ripples only'],'data-label gives a shorter segment');
 assert.equal(modes[0].title,'Ripples + stir the fluid','and the full option text stays as its title');assert.equal(modes[1].title,undefined);
}

// Swatch grid: palette buttons over the colorPalette select.
{
 const {colorPalettes}=await import('../public/palettes.js?rev=gestures-32');
 const s=select('colorPalette',Object.values(colorPalettes).map(p=>[p.id,p.name]),'Color palette');s.value='tide';
 const seen=log(s),grid=enhanceSwatchGrid(s);
 assert.ok(grid.classList.contains('swatch-grid'));assert.equal(grid.children.length,8,'eight palettes');
 const tide=grid.children.find(x=>x.dataset.value==='tide');
 assert.equal(tide.getAttribute('aria-checked'),'true');assert.equal(tide.title,colorPalettes.tide.description);
 assert.equal(tide.querySelector('.swatch-name').textContent,'Tidal blue');
 assert.deepEqual(tide.querySelector('.swatch-dots').children.map(i=>i.style.props['--swatch']),colorPalettes.tide.colors.map(c=>c.hex),'each palette shows its four colors');
 grid.children.find(x=>x.dataset.value==='ember').click();
 assert.equal(s.value,'ember');assert.deepEqual(seen,['input:ember','change:ember']);
 s.value='classic';assert.equal(grid.children[0].getAttribute('aria-checked'),'true');
 s.disabled=true;await flush();assert.ok(grid.children.every(x=>x.disabled));s.disabled=false;await flush();
}

// Stepper: tempo with the shared gesture model.
{
 const wrap=new Node('div');doc.body.append(wrap);
 const input=new Input();input.id='bpm';Object.assign(input.attrs,{type:'number',min:'30',max:'100',step:'2',value:'56','aria-label':'Tempo'});input.value='56';wrap.append(input);
 const seen=log(input),root=enhanceStepper(input,{label:'Tempo',unit:'BPM'});
 assert.equal(enhanceStepper(input),null);assert.equal(input.dataset.enhanced,'stepper');assert.equal(input.nextElementSibling,root);
 const [minus,value,plus]=root.querySelector('.stepper-row').children;
 assert.equal(value.getAttribute('role'),'spinbutton');assert.equal(value.textContent,'56');
 assert.equal(value.getAttribute('aria-valuetext'),'56 BPM');assert.equal(minus.getAttribute('aria-label'),'Decrease tempo');
 plus.click();assert.equal(input.value,'58');assert.deepEqual(seen,['input:58','change:58']);
 minus.click();assert.equal(input.value,'56');
 seen.length=0;
 key(value,'ArrowUp');assert.equal(input.value,'58');key(value,'ArrowDown');assert.equal(input.value,'56');
 key(value,'PageUp');assert.equal(input.value,'64','PgUp moves a tenth of the range, snapped to the step');
 key(value,'End');assert.equal(input.value,'100');assert.equal(plus.disabled,true,'+ disables at the maximum');
 key(value,'Home');assert.equal(input.value,'30');assert.equal(minus.disabled,true,'− disables at the minimum');
 assert.deepEqual(seen.filter(x=>x.startsWith('change')).length,5,'every key commit ends with change');
 input.value='60';assert.equal(value.textContent,'60','programmatic .value updates the view');assert.equal(value.getAttribute('aria-valuenow'),'60');
 seen.length=0;
 pointer(value,'pointerdown',{clientY:300});assert.ok(root.classList.contains('is-live'));
 pointer(value,'pointermove',{clientY:280});assert.equal(input.value,'68','20px of 200px is a tenth of the range');
 pointer(value,'pointermove',{clientY:260,shiftKey:true});assert.equal(input.value,'68','Shift is fine adjust, without a jump');
 pointer(value,'pointermove',{clientY:200,shiftKey:true});assert.equal(input.value,'70','fine travel accumulates below one step');
 assert.ok(seen.every(x=>x.startsWith('input')),'dragging dispatches input only');
 pointer(value,'pointerup');assert.equal(seen.at(-1),'change:70','release commits change');assert.ok(!root.classList.contains('is-live'));
 value.dispatchEvent(new Event('dblclick',{bubbles:true}));assert.equal(input.value,'56','double-click resets to the default');
 const wheel=new Event('wheel',{cancelable:true});wheel.deltaY=-1;value.dispatchEvent(wheel);assert.equal(input.value,'58','wheel steps');
 input.disabled=true;await flush();
 assert.ok(root.classList.contains('is-disabled'));assert.equal(minus.disabled&&plus.disabled,true);assert.equal(value.tabIndex,-1);
 seen.length=0;key(value,'ArrowUp');plus.click();pointer(value,'pointerdown',{clientY:0});pointer(value,'pointermove',{clientY:-100});
 assert.equal(input.value,'58');assert.equal(seen.length,0,'a disabled stepper writes nothing');
 input.disabled=false;await flush();assert.ok(!root.classList.contains('is-disabled'));assert.equal(value.tabIndex,0);
}

// Layer: the switch is the disclosure; its description mirrors live status.
{
 const section=new Node('section');section.className='layer-card';doc.body.append(section);
 const label=new Node('label');label.attrs.for='arpEnabled';const span=new Node('span');span.text='Arpeggiator';const small=new Node('small');small.textContent='One voice, unfolding';span.append(small);
 const toggle=new Input();toggle.id='arpEnabled';toggle.type='checkbox';label.append(span,toggle);
 const status=new Node('p');status.id='arpStatus';status.textContent='Off · a single voice, a winding path';
 const body=new Node('div');body.id='arpControls';section.append(label,status,body);
 const seen=[];toggle.addEventListener('change',()=>seen.push(toggle.checked));
 const wrap=enhanceLayer(toggle,body,{status});
 assert.equal(enhanceLayer(toggle,body),null);
 assert.equal(body.parentElement.parentElement,wrap,'the body moves inside the animated wrapper');
 assert.equal(toggle.getAttribute('aria-controls'),wrap.id);
 assert.equal(small.textContent,'Off · a single voice, a winding path','the description mirrors the status');
 assert.ok(status.classList.contains('sr-only'),'the status stays as a visually hidden live region');
 assert.ok(!wrap.classList.contains('is-open'));assert.equal(wrap.inert,true,'a closed body is inert');
 toggle.checked=true;assert.ok(wrap.classList.contains('is-open'),'programmatic checked opens the body');assert.equal(wrap.inert,false);assert.ok(section.classList.contains('is-on'));
 toggle.checked=false;toggle.dispatchEvent(new Event('change',{bubbles:true}));assert.ok(!wrap.classList.contains('is-open'),'change closes it');assert.deepEqual(seen,[false],'the layer adds no events of its own');
 status.textContent='On · rising through the chord';await flush();assert.equal(small.textContent,'On · rising through the chord','live status updates the description');
}

// EnvelopeGraph: reads the four arp ranges and highlights the one being adjusted.
{
 const pts=envelopePoints({attack:20,decay:120,sustain:.65,length:.85});
 assert.equal(pts.length,5);assert.equal(pts[1][1],6,'attack peaks at the top');assert.ok(Math.abs(pts[2][1]-(66-60*.65))<1e-9,'sustain sets the plateau');
 assert.ok(envelopePoints({attack:2000}).at(1)[0]>pts[1][0],'longer attack moves the peak right');
 assert.ok(envelopePoints({length:4}).at(-1)[0]<=274,'the tail stays inside the frame');
 const host=new Node('div'),cells=new Node('div');doc.body.append(cells,host);
 const ranges={arpLength:['10','400','5','85','Note length'],arpAttack:['0','2000','5','20','Attack'],arpDecay:['0','2000','5','120','Decay'],arpSustain:['0','100','','65','Sustain level']};
 const inputs={};
 for(const [id,[min,max,step,v,name]] of Object.entries(ranges)){const l=new Node('label');l.className='slider-label';l.attrs.for=id;l.text=name;const i=new Input();i.id=id;Object.assign(i.attrs,{type:'range',min,max,step,value:v});i.value=v;cells.append(l,i);inputs[id]=i;}
 const graph=enhanceEnvelopeGraph(host);
 assert.equal(graph.parentElement,host);assert.equal(graph.getAttribute('role'),'img');
 const line=graph.querySelector('polyline.envelope-line'),active=graph.querySelector('polyline.envelope-active');
 const before=line.getAttribute('points');
 inputs.arpSustain.value='20';assert.notEqual(line.getAttribute('points'),before,'programmatic values redraw the curve');
 inputs.arpAttack.value='400';inputs.arpAttack.dispatchEvent(new Event('input',{bubbles:true}));
 assert.equal(graph.dataset.active,'a','moving attack highlights the attack segment');assert.notEqual(active.getAttribute('points'),'');
 await new Promise(r=>setTimeout(r,750));assert.equal(graph.dataset.active,'','the highlight fades after the move');assert.equal(active.getAttribute('points'),'');
 enhanceKnobs(doc);
 const decayKnob=inputs.arpDecay.closest('.knob-cell').querySelector('.knob');
 decayKnob.focus();assert.equal(graph.dataset.active,'d','focusing a knob highlights its segment');
 key(decayKnob,'ArrowUp');assert.equal(graph.dataset.active,'d');assert.notEqual(inputs.arpDecay.value,'120','the knob still drives its range');
 inputs.arpDecay.value='600';assert.equal(decayKnob.getAttribute('aria-valuenow'),'600','knob and graph both watch the same range');
 assert.match(line.getAttribute('points'),/./);
 inputs.arpLength.closest('.knob-cell').querySelector('.knob').focus();assert.equal(graph.dataset.active,'r','focus moves the highlight');
 for(const i of Object.values(inputs))i.disabled=true;await flush();assert.ok(graph.classList.contains('is-disabled'));
}

// Vertical slider: CSS plus aria-orientation, and the native input stays the state.
{
 const css=fs.readFileSync(new URL('../public/flow-ds.css',import.meta.url),'utf8');
 assert.match(css,/input\[type=range\]\[data-orientation=vertical\][^{]*\{[^}]*writing-mode:vertical-lr;direction:rtl/,'vertical faders use native vertical ranges');
 assert.match(css,/linear-gradient\(to top,var\(--control-fill\) var\(--pct,50%\)/,'the fill grows from the bottom');
 const src=fs.readFileSync(new URL('../public/controls-ui.js',import.meta.url),'utf8');
 assert.match(src,/if\(input\.dataset\.orientation==='vertical'\)input\.setAttribute\('aria-orientation','vertical'\)/);
}
// HelpTips: static helpers move into a "?" tip; a live description opts in with data-help-tip.
{
 const content=new Node('div');content.className='panel-content';doc.body.append(content);
 const section=new Node('section');section.className='control-section';content.append(section);
 const label=new Node('label');label.className='section-label';label.attrs.for='soundscapeTip';label.text='Vibe';
 const s=new Select();s.id='soundscapeTip';s.append(new Option('stillwater','Still water'));
 const live=new Node('p');live.className='helper';live.id='scapeDescriptionTip';live.setAttribute('data-help-tip','');live.text='Soft keys, warm strings, and a little shimmer.';
 const status=new Node('p');status.className='helper';status.id='scapeStatusTip';status.text='Loading…';
 const plain=new Node('p');plain.className='helper';plain.text='Static copy';
 section.append(label,s,live,status,plain);
 enhanceHelpTips(doc);
 const tip=label.querySelector('.help-tip'),pop=tip?.querySelector('span[role="tooltip"]');
 assert.ok(tip&&label.classList.contains('has-help'),'the section title gets a tip');
 assert.deepEqual(pop.children,[live,plain],'the opted-in description and static copy move into the tip, in order');
 assert.equal(doc.getElementById('scapeDescriptionTip'),live,'the moved description keeps its id for live writes');
 assert.equal(status.parentElement,section,'other helpers with an id stay in place');
}

// enhanceRail applies Phase 2's components by id and dims Percussion response with its layer.
{
 doc.body.replaceChildren();
 const ids={chordLength:[['4','4 beats'],['8','8 beats'],['16','16 beats']],colorPalette:[['classic','Original glow'],['ember','Ember']]};
 const selects=Object.fromEntries(Object.entries(ids).map(([id,values])=>[id,select(id,values)]));
 const section=new Node('section');section.id='rhythmVisualControls';section.className='control-section';doc.body.append(section);
 const title=new Node('div');title.className='section-label';section.append(title);
 const mode=new Select();mode.id='rhythmVisualMode';for(const [v,t] of [['both','Ripples + stir the fluid'],['ripples','Ripples only'],['fluid','Stir the fluid only']])mode.append(new Option(v,t));section.append(mode);
 const toggle=new Input();toggle.id='rhythmEnabled';toggle.type='checkbox';doc.body.append(toggle);
 enhanceRail(doc);
 for(const id of ['chordLength','rhythmVisualMode'])assert.equal(doc.getElementById(id).dataset.enhanced,'segmented',`${id} is Segmented`);
 assert.ok(selects.chordLength.nextElementSibling.classList.contains('segmented-full'));
 assert.equal(selects.colorPalette.dataset.enhanced,'swatch-grid');
 assert.ok(section.classList.contains('is-dimmed'),'Percussion response dims while percussion is off');
 toggle.checked=true;assert.ok(!section.classList.contains('is-dimmed'),'programmatic checked lifts the dim');
 toggle.checked=false;toggle.dispatchEvent(new Event('change',{bubbles:true}));assert.ok(section.classList.contains('is-dimmed'));
 assert.equal(mode.disabled,false,'dimming never disables');
 const before=doc.body.children.length;enhanceRail(doc);assert.equal(doc.body.children.length,before,'enhanceRail is idempotent');
 assert.equal(selects.chordLength.parentElement.querySelectorAll('div.segmented').length,1);
 const src=fs.readFileSync(new URL('../public/controls-ui.js',import.meta.url),'utf8');
 assert.match(src,/enhanceHelpTips\(\);enhanceKnobs\(\);enhanceSliders\(\);enhanceRail\(\);/,'the rail is enhanced at startup from controls-ui.js');
 assert.ok(!fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8').includes('enhanceRail'),'app.js does not apply components');
}
// Phase 3: Layers is three Layer blocks with at most one fold level and no visible status lines.
{
 const layers=html.match(/<div id="rhythmPanel"[^>]*>([\s\S]*?)\n<\/div>/)[1];
 assert.equal(layers.match(/<details/g)?.length,1,'Note shape is the only fold');
 const fold=layers.slice(layers.indexOf('<details'),layers.indexOf('</details>'));
 assert.ok(fold.includes('id="arpShape"')&&!fold.slice(1).includes('<details'),'the fold holds no fold');
 for(const gone of ['layer-card','layer-editor','nested-fold','Edit arpeggiator','Edit percussion','Edit atmospherics','Portamento','Groove feel','mixFromLayers','rhythmKit','rhythmVoices','arpOverview','rhythmOverview','environmentOverview','arpEnvelopeFill','arpEnvelopeLine','<svg id="arpEnvelope"'])assert.ok(!html.includes(gone),`${gone} is gone`);
 assert.ok(html.includes('id="studioKit"'),'the kit lives on in beat studio');
 for(const id of ['arpEnabled','arpStatus','arpControls','arpVoice','arpSource','arpRootMode','arpRoot','arpScale','arpPattern','arpRestart','arpRate','arpProbability','arpCount','arpEnvelope','arpEnvelopeSummary','arpLength','arpAttack','arpDecay','arpSustain','arpGlideEnabled','arpGlideSummary','arpGlideTime','arpGlideAmount','rhythmEnabled','rhythmStatus','rhythmControls','groove','varyGroove','rhythmRate','rhythmRateLabel','rhythmSwing','rhythmHumanize','openBeats','environmentEnabled','environmentStatus','environmentControls','environmentPreset','environmentActivity','environmentTone'])assert.equal(html.match(new RegExp(`id="${id}"`,'g'))?.length,1,`${id} keeps exactly one home`);
 const glide=fold.slice(fold.indexOf('class="glide-row"'));
 for(const id of ['arpGlideEnabled','arpGlideTime','arpGlideAmount'])assert.ok(glide.includes(`id="${id}"`),`${id} sits in the Glide row inside Note shape`);
 assert.deepEqual([...layers.matchAll(/<option value="[^"]*" data-label="([^"]*)"/g)].map(m=>m[1]).slice(0,7),['1','½','¼','1/8','1/16','1/32','⅛T'],'note rate has the kit\'s short segments');
 for(const id of ['arpRate','rhythmRate'])assert.ok(id in SEGMENTED,`${id} is Segmented`);
 for(const id of ['arpProbability','arpCount','environmentActivity','rhythmSwing','rhythmHumanize'])assert.ok(KNOBS[id]&&!KNOBS[id].sm,`${id} is a knob`);
 for(const id of ['arpLength','arpAttack','arpDecay','arpSustain','arpGlideTime','arpGlideAmount'])assert.equal(KNOBS[id].sm,true,`${id} is a small knob`);
 assert.equal(KNOBS.environmentTone.bipolar,true);
 assert.deepEqual(Object.keys(LAYERS).slice(0,3),['arpEnabled','rhythmEnabled','environmentEnabled']);assert.equal(SWITCH_STATUS.arpGlideEnabled,'arpGlideSummary');
 assert.match(html,/<script type="module" src="controls-ui\.js\?rev=remove-water-93"><\/script>/);assert.match(html,/flow-ds\.css\?rev=controls-8b/);assert.match(html,/style\.css\?rev=controls-8b/);assert.match(html,/presentation\.css\?rev=controls-8a/);

 // The real markup, enhanced the way startup does it.
 doc.body.replaceChildren();
 const content=new Node('div');content.className='panel-content';doc.body.append(content);
 content.innerHTML=html.match(/<div id="rhythmPanel"[^>]*>[\s\S]*?\n<\/div>/)[0];
 const $=id=>doc.getElementById(id);
 enhanceHelpTips(doc);enhanceKnobs(doc);enhanceRail(doc);
 const panel=$('rhythmPanel');
 for(const [toggleId,{body,status}] of Object.entries(LAYERS).filter(([id])=>$(id))){
  const toggle=$(toggleId),wrap=$(body).parentElement.parentElement,section=toggle.closest('section'),small=toggle.closest('label').querySelector('small');
  assert.ok(wrap.classList.contains('layer-body'),`${body} opens with its switch`);assert.equal(toggle.getAttribute('aria-controls'),wrap.id);
  assert.equal(wrap.inert,true,`${toggleId} starts closed`);
  toggle.checked=true;assert.ok(wrap.classList.contains('is-open')&&section.classList.contains('is-on'),'programmatic checked (session restore) opens the layer');
  toggle.checked=false;toggle.dispatchEvent(new Event('change',{bubbles:true}));assert.ok(!wrap.classList.contains('is-open'),'switching off hides the controls');
  assert.ok($(status).classList.contains('sr-only'),`${status} stays as a hidden live region`);assert.equal(small.textContent,$(status).textContent,`the ${toggleId} description shows ${status}`);
  $(status).textContent='Ready · press Play';await flush();assert.equal(small.textContent,'Ready · press Play','live status follows into the description');
 }
 const glideSmall=$('arpGlideEnabled').closest('label').querySelector('small');
 assert.equal(glideSmall.textContent,'Off · notes begin at their own pitch');assert.ok($('arpGlideSummary').classList.contains('sr-only'));
 $('arpGlideSummary').textContent='180 ms glide · 100% of the interval';await flush();assert.equal(glideSmall.textContent,'180 ms glide · 100% of the interval');
 const visible=n=>{for(;n&&n!==doc.body;n=n.parentElement)if(n.hidden||n.classList.contains('sr-only')||n.classList.contains('help-tip'))return false;return true;};
 assert.deepEqual(panel.querySelectorAll('p.helper').filter(visible).map(p=>p.id||p.textContent),[],'no helper or status paragraph stays visible');
 assert.equal(panel.querySelectorAll('details').length,1);
 assert.equal($('arpShape').querySelector('.help-tip'),null,'no HelpTip inside the fold\'s summary');
 assert.ok($('arpShape').parentElement.classList.contains('fold-help'),'the fold sits in a HelpTip wrapper');
 const shapeTip=$('arpShape').parentElement.children[0];assert.ok(shapeTip.classList.contains('help-tip'),'the tip comes before the fold');
 assert.ok(shapeTip.textContent.includes('Length follows the note rate')&&shapeTip.textContent.includes('Slides from the previous note'),'the Note shape fold carries the envelope and glide help');
 for(const id of ['arpSourceHelp','arpProbabilityHelp','grooveDescription','environmentDescription','environmentActivityHelp'])assert.ok($(id).closest('.help-tip'),`${id} moves into its layer's HelpTip`);
 const rate=$('arpRate'),rateGroup=rate.nextElementSibling;
 assert.deepEqual(rateGroup.children.map(b=>b.textContent),['1','½','¼','1/8','1/16','1/32','⅛T']);assert.equal(rateGroup.children[6].title,'⅛ triplet');
 assert.ok(rateGroup.classList.contains('segmented-sm'));assert.equal(rateGroup.children[3].getAttribute('aria-checked'),'true','⅛ is the default');
 const seen=log(rate);rateGroup.children[4].click();assert.equal(rate.value,'0.25');assert.deepEqual(seen,['input:0.25','change:0.25'],'segments drive arpRate');
 assert.deepEqual($('rhythmRate').nextElementSibling.children.map(b=>b.textContent),['½×','1×','2×']);
 assert.equal($('rhythmRateLabel').tagName,'OUTPUT','the beats-per-loop readout keeps its id');assert.ok(doc.querySelector('label[for="rhythmRate"]').textContent.startsWith('Rhythm speed'),'the Segmented label id never collides with an app id');
 const knobOf=id=>$(id).closest('.knob-cell')?.querySelector('.knob');
 for(const id of ['arpProbability','arpCount','rhythmSwing','rhythmHumanize','environmentActivity','environmentTone'])assert.ok(knobOf(id)&&!knobOf(id).classList.contains('knob-sm'),`${id} is a knob`);
 for(const id of ['arpLength','arpAttack','arpDecay','arpSustain','arpGlideTime','arpGlideAmount'])assert.ok(knobOf(id).classList.contains('knob-sm'),`${id} is a small knob`);
 assert.equal($('arpLength').closest('.knob-row'),$('arpSustain').closest('.knob-row'),'the four shape knobs share a row');
 assert.ok($('arpGlideTime').closest('.glide-row')&&$('arpGlideTime').closest('.knob-row')===$('arpGlideAmount').closest('.knob-row'),'the glide knobs share the Glide row');
 const graph=$('arpEnvelope').querySelector('svg.envelope-graph'),line=()=>graph.querySelector('polyline.envelope-line').getAttribute('points');
 assert.ok(graph,'the EnvelopeGraph replaces the static SVG');const before=line();
 $('arpAttack').value='800';assert.notEqual(line(),before,'the graph tracks the attack range');
 knobOf('arpSustain').focus();assert.equal(graph.dataset.active,'s');key(knobOf('arpSustain'),'ArrowDown');assert.notEqual($('arpSustain').value,'65','the sustain knob drives its range');
 const count=panel.querySelectorAll('svg.envelope-graph').length;enhanceRail(doc);assert.equal(panel.querySelectorAll('svg.envelope-graph').length,count,'enhanceRail stays idempotent');
}

// Phase 4: Play is six sections with no folds and no visible status lines.
{
 const play=html.match(/<div id="performPanel"[^>]*>([\s\S]*?)\n<\/div>/)[1];
 assert.ok(!play.includes('<details'),'Play has no folds');
 for(const gone of ['pitchControls','expressionControls','fluidListens','performance-enable','Gesture guide<'])assert.ok(!play.includes(gone),`${gone} is gone from Play`);
 const order=['for="gestureTool">Canvas tool<','<div class="section-label">Automatic droplets</div>','<div class="section-label">Quantize</div>','<div class="section-label">Pitch range</div>','<div class="section-label">Drift</div>','<h2 class="section-label">Gestures</h2>'].map(t=>{const i=play.indexOf(t);assert.ok(i>=0,`${t} is present`);return i;});
 assert.deepEqual([...order].sort((a,b)=>a-b),order,'the six sections follow the target order');
 const section=title=>{const i=play.indexOf(title);return play.slice(play.lastIndexOf('<section',i),play.indexOf('</section>',i));};
 const has=(markup,ids,where)=>{for(const id of ids)assert.ok(markup.includes(`id="${id}"`),`${id} sits in ${where}`);};
 has(section('Canvas tool<'),['expressionEnabled','gestureTool','gestureToolHelp','gestureAmount'],'Canvas tool');
 assert.match(section('Canvas tool<'),/<div class="section-head"><label class="section-label" for="gestureTool">Canvas tool<\/label><input id="expressionEnabled"/,'the expression switch is the section action');
 has(section('Automatic droplets'),['autoPour','rain','rainValue'],'Automatic droplets');assert.ok(section('Automatic droplets').startsWith('<section class="control-section autopour"'),'app.js still finds .autopour');
 has(section('>Quantize<'),['quantizeEnabled','quantizeStatus','quantizeControls','quantizeBeats'],'Quantize');
 has(section('Pitch range'),['octavesDown','octavesUp','pitchRangeValue','expressionDot'],'Pitch range');
 assert.match(section('Pitch range'),/<output id="pitchRangeValue" class="range-readout"/,'the pitch range is a mono readout, not a status paragraph');
 has(section('>Drift<'),['driftEnabled','driftWander','driftStyle','sleepTimer','driftPace','driftStatus'],'Drift');
 has(section('>Gestures<'),['gestureGuide','bloom','conductScene','resetPerformance'],'Gestures');
 assert.match(section('>Gestures<'),/<div class="section-head"><h2 class="section-label">Gestures<\/h2><button id="bloom" class="ghost-button">/,'Release a bloom is the section action');
 assert.match(section('>Gestures<'),/<button id="resetPerformance" class="ghost-button">Let the scene settle<\/button>$/,'Let the scene settle closes the section as a ghost button');
 assert.equal(section('>Gestures<').match(/<article>/g).length,6,'all six gestures stay, unfolded');
 for(const id of ['expressionEnabled','gestureTool','gestureToolHelp','gestureAmount','gestureAmountValue','autoPour','rain','rainValue','quantizeEnabled','quantizeStatus','quantizeBeats','octavesDown','octavesUp','pitchRangeValue','expressionDot','driftEnabled','driftWander','driftStyle','driftPace','driftPaceValue','sleepTimer','driftStatus','bloom','gestureGuide','conductScene','resetPerformance'])assert.equal(html.match(new RegExp(`id="${id}"`,'g'))?.length,1,`${id} keeps exactly one home`);
 assert.ok(html.includes('id="zenSleepTimer"'),'Zen keeps its sleep mirror');
 assert.deepEqual([...section('>Quantize<').matchAll(/<option value="([^"]*)"/g)].map(m=>Number(m[1])),[1,.5,.25,.125,1/3]);
 for(const [,value] of section('>Quantize<').matchAll(/<option value="([^"]*)"/g))assert.equal(value,String(Number(value)),'grid values round-trip through a saved number');
 for(const id of ['gestureTool','quantizeBeats','octavesDown','octavesUp'])assert.ok(id in SEGMENTED,`${id} is Segmented`);
 assert.ok(KNOBS.driftPace&&!KNOBS.driftPace.sm&&KNOBS.gestureAmount,'driftPace and gestureAmount are knobs');
 assert.deepEqual(LAYERS.quantizeEnabled,{body:'quantizeControls',status:'quantizeStatus'});assert.equal(SWITCH_STATUS.driftEnabled,'driftStatus');

 // The real Play and Scene markup, enhanced the way startup does it.
 doc.body.replaceChildren();
 const content=new Node('div');content.className='panel-content';doc.body.append(content);
 content.innerHTML=html.match(/<div id="performPanel"[^>]*>[\s\S]*?\n<\/div>/)[0]+html.match(/<div id="fluidPanel"[^>]*>[\s\S]*?\n<\/div>/)[0];
 const $=id=>doc.getElementById(id);
 enhanceHelpTips(doc);enhanceKnobs(doc);enhanceRail(doc);
 const panel=$('performPanel');
 const tool=$('gestureTool').nextElementSibling;
 assert.deepEqual(tool.children.map(b=>b.textContent),['Paint','Conduct','Space','Orbit']);assert.equal(tool.children[0].title,'Paint · notes & gestures','the full tool name stays as a title');
 assert.ok(tool.classList.contains('segmented-full'));
 const seen=log($('gestureTool'));tool.children[3].click();assert.equal($('gestureTool').value,'orbit');assert.deepEqual(seen,['input:orbit','change:orbit'],'segments drive gestureTool');
 $('gestureTool').disabled=true;await flush();assert.ok(tool.classList.contains('is-disabled'),'expression off disables the tool segments');$('gestureTool').disabled=false;await flush();
 assert.ok($('gestureToolHelp').closest('.help-tip'),'the tool help moves into the Canvas tool HelpTip');
 assert.ok($('gestureToolHelp').closest('.section-label'),'anchored on the section title beside the switch');
 const quantize=$('quantizeEnabled'),wrap=$('quantizeControls').parentElement.parentElement,qSmall=quantize.closest('label').querySelector('small');
 assert.ok(wrap.classList.contains('layer-body')&&wrap.inert,'the landing grid is hidden while quantize is off');
 assert.ok($('quantizeStatus').classList.contains('sr-only'));assert.equal(qSmall.textContent,'Off · droplets land freely');
 quantize.checked=true;$('quantizeStatus').textContent='Land on the next grid line · follows tempo & rhythm speed';await flush();
 assert.ok(wrap.classList.contains('is-open'),'quantize on shows the grid');assert.equal(qSmall.textContent,'Land on the next grid line · follows tempo & rhythm speed','the description follows quantizeStatus');
 const grid=$('quantizeBeats').nextElementSibling;assert.deepEqual(grid.children.map(b=>b.textContent),['¼','1/8','1/16','1/32','⅛T']);assert.equal(grid.children[1].getAttribute('aria-checked'),'true');
 for(const id of ['octavesDown','octavesUp'])assert.deepEqual($(id).nextElementSibling.children.map(b=>b.textContent),['0','1','2','3'],`${id} has four segments`);
 const octaves=log($('octavesUp'));$('octavesUp').nextElementSibling.children[3].click();assert.equal($('octavesUp').value,'3');assert.deepEqual(octaves,['input:3','change:3']);
 assert.equal($('octavesUpLabel').tagName,'LABEL');
 const knobOf=id=>$(id).closest('.knob-cell')?.querySelector('.knob');
 assert.ok(knobOf('gestureAmount')&&knobOf('driftPace'),'gestureAmount and driftPace are knobs');
 assert.ok($('driftPace').closest('.drift-grid'),'the interval knob sits beside the drift selects');
 const paces=log($('driftPace'));key(knobOf('driftPace'),'ArrowUp');assert.equal($('driftPace').value,'4');assert.deepEqual(paces,['input:4','change:4'],'the knob drives driftPace');
 $('driftPace').disabled=true;await flush();assert.ok(knobOf('driftPace').classList.contains('is-disabled'),'drift off disables the knob');
 const dSmall=$('driftEnabled').closest('label').querySelector('small');assert.equal(dSmall.textContent,'Drift gently plays when you leave the canvas alone.');
 $('driftStatus').textContent='Fading to sleep in 30 minutes';await flush();assert.equal(dSmall.textContent,'Fading to sleep in 30 minutes','the drift description shows the sleep status');
 const visible=n=>{for(;n&&n!==doc.body;n=n.parentElement)if(n.hidden||n.classList.contains('sr-only')||n.classList.contains('help-tip'))return false;return true;};
 assert.deepEqual(panel.querySelectorAll('p.helper').filter(visible).map(p=>p.id||p.textContent),[],'no helper or status paragraph stays visible in Play');
 assert.equal(panel.querySelectorAll('details').length,0);
 const gestureTip=$('gestureGuide').querySelector('.section-label').querySelector('.help-tip');
 assert.ok(gestureTip.textContent.includes('Temporary reverb')&&gestureTip.textContent.includes('Keyboard: focus the canvas'),'the gesture help moves into the Gestures HelpTip');
 assert.ok($('fluidListensHelp').closest('.help-tip'),'fluidListens help is a HelpTip in Scene');assert.ok($('fluidListens').closest('div[id=fluidPanel]'));
}
// Phase 5: Mix is five unfolded sections; layer levels are vertical faders that dim with their layer.
{
 const mix=html.match(/<div id="mixPanel"[^>]*>([\s\S]*?)\n<\/div>/)[1];
 assert.ok(!mix.includes('<details'),'Mix has no folds');
 for(const gone of ['layersFromMix','studioDelayBeats','MixStatus','mix-state','studio-echo-spacing'])assert.ok(!html.includes(gone),`${gone} is gone`);
 const titles=['>MASTER<','>LAYER LEVELS<','>MELODIC SPACE<','>PERCUSSION SPACE<','>ECHO SPACING<'].map(t=>{const i=mix.indexOf(t);assert.ok(i>=0,`${t} is present`);return i;});
 assert.deepEqual([...titles].sort((a,b)=>a-b),titles,'the five sections follow the target order');
 const section=title=>{const i=mix.indexOf(title);return mix.slice(mix.lastIndexOf('<section',i),mix.indexOf('</section>',i));};
 assert.deepEqual([...section('LAYER LEVELS').matchAll(/<span>([^<]+)<\/span>/g)].map(m=>m[1]),['Droplets','Arpeggio','Percussion','Atmos']);
 assert.match(section('ECHO SPACING'),/<select id="voiceDelayBeats">[\s\S]*<\/select><output id="echoSyncLabel" class="range-readout"/,'the echo readout sits under the spacing menu');
 for(const id of ['volume','volumeValue','dropletsVolume','dropletsVolumeValue','dropletsMixHelp','arpVolume','arpVolumeValue','rhythmVolume','rhythmVolumeValue','environmentVolume','environmentVolumeValue','voiceEffects','reverb','reverbValue','delay','delayValue','drumEffects','rhythmReverb','rhythmReverbValue','rhythmDelay','rhythmDelayValue','voiceDelayBeats','echoSyncLabel'])assert.equal(html.match(new RegExp(`id="${id}"`,'g'))?.length,1,`${id} keeps exactly one home`);
 for(const id of ['studioReverb','studioDelay'])assert.ok(html.includes(`id="${id}"`),`${id} stays as beat studio's mirror`);
 assert.equal(KNOBS.reverb.lg,true);assert.equal(KNOBS.delay.lg,true);assert.ok(!KNOBS.rhythmReverb.lg&&!KNOBS.rhythmReverb.sm&&!KNOBS.rhythmDelay.lg,'drum space uses regular knobs');
 assert.ok(!('dropletsVolume' in DIM_WHEN_OFF),'droplets has no layer switch to follow');
 const css=fs.readFileSync(new URL('../public/flow-ds.css',import.meta.url),'utf8');assert.match(css,/\.knob-lg\{--size:64px\}/);

 // The real Mix markup with the Layers switches, enhanced the way startup does it.
 doc.body.replaceChildren();
 const content=new Node('div');content.className='panel-content';doc.body.append(content);
 content.innerHTML=html.match(/<div id="rhythmPanel"[^>]*>[\s\S]*?\n<\/div>/)[0]+html.match(/<div id="mixPanel"[^>]*>[\s\S]*?\n<\/div>/)[0];
 const $=id=>doc.getElementById(id);
 enhanceHelpTips(doc);enhanceKnobs(doc);enhanceRail(doc);
 const panel=$('mixPanel'),knobOf=id=>$(id).closest('.knob-cell')?.querySelector('.knob');
 for(const id of ['reverb','delay'])assert.ok(knobOf(id).classList.contains('knob-lg'),`${id} is a large knob`);
 for(const id of ['rhythmReverb','rhythmDelay'])assert.ok(knobOf(id)&&!knobOf(id).classList.contains('knob-lg')&&!knobOf(id).classList.contains('knob-sm'),`${id} is a regular knob`);
 assert.equal(knobOf('reverb').querySelector('svg').getAttribute('viewBox'),'0 0 78 78','the large knob draws at its own size');
 const reverbs=log($('reverb'));key(knobOf('reverb'),'ArrowUp');assert.equal($('reverb').value,'66');assert.deepEqual(reverbs,['input:66','change:66'],'the large knob drives reverb');
 for(const id of ['dropletsVolume','arpVolume','rhythmVolume','environmentVolume'])assert.ok(!$(id).dataset.knob&&$(id).closest('.fader-row'),`${id} is a fader in the Layer levels row`);
 const fader=id=>$(id).closest('.fader');
 for(const [id,toggleId] of Object.entries(DIM_WHEN_OFF).filter(([id])=>$(id)&&$(id).closest('div[id=mixPanel]'))){
  const toggle=$(toggleId);
  assert.ok(fader(id).classList.contains('is-dimmed'),`${id} starts dimmed with ${toggleId} off`);
  toggle.checked=true;assert.ok(!fader(id).classList.contains('is-dimmed'),`${id} lifts when ${toggleId} is set (session restore)`);
  toggle.checked=false;toggle.dispatchEvent(new Event('change',{bubbles:true}));assert.ok(fader(id).classList.contains('is-dimmed'),`${id} dims when ${toggleId} switches off`);
  assert.equal($(id).disabled,false,'dimming never disables a fader');
 }
 assert.deepEqual(Object.keys(DIM_WHEN_OFF).filter(id=>$(id)&&fader(id)),['arpVolume','rhythmVolume','environmentVolume']);
 assert.ok(!fader('dropletsVolume').classList.contains('is-dimmed'),'the droplets fader never dims');
 assert.ok($('dropletsMixHelp').closest('.help-tip'),'the droplets helper moves into the Layer levels HelpTip');assert.equal($('dropletsVolume').getAttribute('aria-describedby'),'dropletsMixHelp');
 const visible=n=>{for(;n&&n!==doc.body;n=n.parentElement)if(n.hidden||n.classList.contains('sr-only')||n.classList.contains('help-tip'))return false;return true;};
 assert.deepEqual(panel.querySelectorAll('p.helper').filter(visible).map(p=>p.id||p.textContent),[],'no helper or status paragraph stays visible in Mix');
 assert.equal(panel.querySelectorAll('details').length,0);
 for(const [title,text] of [['voiceEffects','Reverb & delay for color voices'],['drumEffects','Independent drum reverb'],['volume','A balanced output']]){const tip=($(title).closest('section')).querySelector('.help-tip');assert.ok(tip?.textContent.includes(text),`${title}'s section carries its help`);}
 assert.equal($('echoSyncLabel').tagName,'OUTPUT');assert.ok($('echoSyncLabel').closest('section').querySelector('.help-tip').textContent.includes('Shared by voices, drums'));
}
// Phase 6a: the top bar holds the session title, saved state and session menu; the canvas edge keeps the palette pill and Clear.
{
 const top=html.match(/<header class="topbar">[\s\S]*?<\/header>/)[0];
 assert.ok(!html.includes('class="session-header"'),'the session header above the transport is gone');
 const at=id=>top.indexOf(`id="${id}"`);
 for(const id of ['sessionHeader','sessionTitle','sessionSave','sessionOrigin','sessionMenuButton','sessionMenu','allSessions','backupSession','newSession','sharedPreview','previewBack','previewTitle','previewStatus','communityLauncher','recordLauncher','help','zen','togglePanel'])assert.ok(at(id)>0,`${id} lives in the top bar`);
 assert.ok(top.indexOf('class="brand"')<at('sessionHeader')&&at('sessionHeader')<at('sharedPreview')&&at('sharedPreview')<top.indexOf('class="header-actions"'),'brand · session · launchers');
 const order=['communityLauncher','recordLauncher','help','zen','togglePanel'].map(at);
 assert.deepEqual(order,[...order].sort((a,b)=>a-b),'Community · Library · ? · Zen · rail toggle');
 const menu=top.slice(at('sessionMenu'),top.indexOf('</div>',at('sessionMenu')));
 assert.deepEqual([...menu.matchAll(/<button id="(\w+)"[^>]*role="menuitem"/g)].map(m=>m[1]),['allSessions','backupSession','newSession'],'the session menu holds the way back, download and new');
 assert.match(html.slice(html.indexOf('<div id="presentStrip"'),html.indexOf('<div class="sleep-veil"')),/<button id="fullscreen"[^>]*>[^<]*<\/button><button id="presentExit"[^>]*>Exit Zen<\/button><\/div>$/,'fullscreen sits in the Zen strip before Exit Zen');
 assert.ok(at('fullscreen')<0);
 const bottom=html.slice(html.indexOf('<div class="canvas-bottom">'),html.indexOf('<button id="performanceHint"'));
 assert.ok(bottom.includes('class="palette-controls"')&&bottom.includes('id="cycleColors"'),'the palette pill stays on the canvas');
 assert.match(bottom,/<button id="clear" class="icon-button canvas-clear"[^>]*aria-label="Clear canvas"/,'Clear is an icon button');
 assert.ok(!bottom.includes('id="zen"'),'Zen leaves the canvas');
 assert.match(bottom,/class="palette-hint sr-only" id="paletteHint" role="status"/,'the palette hint stays as a live region');
 assert.deepEqual(POPOVERS.sessionMenuButton,{panel:'sessionMenu',menu:true});
 assert.ok(!/enhanceChrome|enhancePopover/.test(fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8')),'app.js does not apply components');
 assert.match(fs.readFileSync(new URL('../public/controls-ui.js',import.meta.url),'utf8'),/enhanceRail\(\);enhanceChrome\(\);/,'the top bar is enhanced at startup');

 // The real top bar, enhanced the way startup does it.
 doc.body.replaceChildren();
 const wrap=new Node('div');doc.body.append(wrap);wrap.innerHTML=top;
 const $=id=>doc.getElementById(id);
 enhanceChrome(doc);
 const button=$('sessionMenuButton'),panel=$('sessionMenu');
 assert.equal(panel.hidden,true);assert.equal(button.getAttribute('aria-expanded'),'false');assert.equal(button.getAttribute('aria-haspopup'),'menu');assert.equal(button.getAttribute('aria-controls'),'sessionMenu');
 button.click();assert.equal(panel.hidden,false);assert.equal(button.getAttribute('aria-expanded'),'true');assert.equal(doc.activeElement,$('allSessions'),'opening focuses the first item');
 key(doc.activeElement,'ArrowDown');assert.equal(doc.activeElement,$('backupSession'));
 key(doc.activeElement,'ArrowUp');key(doc.activeElement,'ArrowUp');assert.equal(doc.activeElement,$('newSession'),'arrows wrap');
 key(doc.activeElement,'Home');assert.equal(doc.activeElement,$('allSessions'));key(doc.activeElement,'End');assert.equal(doc.activeElement,$('newSession'));
 key(doc.activeElement,'Escape');assert.equal(panel.hidden,true,'Escape closes');assert.equal(doc.activeElement,button,'and returns focus to the trigger');
 let made=0;$('newSession').addEventListener('click',()=>{made++;assert.equal(panel.hidden,false,'the item acts before the menu closes');});
 button.click();$('newSession').click();assert.equal(made,1);assert.equal(panel.hidden,true,'choosing an item closes the menu');
 $('allSessions').disabled=true;key(button,'ArrowDown');assert.equal(panel.hidden,false,'ArrowDown on the trigger opens the menu');assert.equal(doc.activeElement,$('backupSession'),'disabled items are skipped');
 key(doc.activeElement,'ArrowUp');assert.equal(doc.activeElement,$('newSession'));
 pointer($('backupSession'),'pointerdown');assert.equal(panel.hidden,false,'a press inside keeps it open');
 pointer($('help'),'pointerdown');assert.equal(panel.hidden,true,'a press outside closes it');
 button.click();button.click();assert.equal(panel.hidden,true,'the trigger toggles');
 $('allSessions').disabled=false;
}
// Phase 6b: one-row transport with one Play, the ChordStrip and take chip, the tempo Stepper, and one Record with a capture popover.
{
 const row=html.match(/<div id="zenHarmonyRow" class="transport"[\s\S]*?id="recordBarStatus"[^\n]*\n<\/div>\n/)[0];
 const at=id=>row.indexOf(`id="${id}"`);
 for(const id of ['start','playLabel','audioState','listeningHint','chords','takeChip','takeChipName','takeChipClear','recordBarFork','noteToast','bpm','recordGroup','recordStart','retryTakeSave','captureMenuButton','capturePanel','recordName','recordMode','recordCycles','recordAutoLoop','recordBarTime','recordCancel','quickLoop','recordProgress','recordBarStatus'])assert.ok(at(id)>0,`${id} lives in the transport`);
 const order=['start','chords','takeChip','noteToast','bpm','recordStart','captureMenuButton','recordBarTime','quickLoop'].map(at);
 assert.deepEqual(order,[...order].sort((a,b)=>a-b),'Play · ChordStrip · take chip · note · tempo · Record · capture · timer · Loop');
 const panel=row.slice(at('capturePanel'),row.indexOf('</div></div>',at('capturePanel')));
 for(const id of ['recordName','recordMode','recordCycles','recordAutoLoop'])assert.ok(panel.includes(`id="${id}"`),`${id} is in the capture popover`);
 for(const id of ['quickPlay','quickLive','quickStop','quickRecord','quickUseSetup','quickExport','quickShare','quickLibrary','sessionTakes','quickStatus','quickTime','quickProgress','captureLengthLabel','recordFinish','recordBarStop','recordBar','zenTransportRow','slower','faster','bpmLabel'])assert.ok(!html.includes(`id="${id}"`),`${id} is gone`);
 for(const marker of ['class="take-tray','class="session-capture','class="record-bar'])assert.ok(!html.includes(marker),`${marker} is gone`);
 assert.equal(html.match(/class="play-button"/g).length,1,'one transport Play button');
 assert.match(html,/<div id="toast" class="toast" role="status" aria-live="polite" hidden>/);
 assert.deepEqual(POPOVERS.captureMenuButton,{panel:'capturePanel'});assert.deepEqual(STEPPERS.bpm,{unit:'BPM'});assert.deepEqual(STEPPERS.recordCycles,{unit:'cycles'});assert.deepEqual(CAPTURE_SEGMENTED,{recordMode:{size:'sm',full:true}});assert.deepEqual(CHORD_STRIPS,['chords']);assert.deepEqual(TOASTS,['toast']);
 assert.ok(!/enhanceStepper|enhanceChordStrip|enhanceToast/.test(app),'app.js does not apply components');

 doc.body.replaceChildren();
 const wrap=new Node('div');doc.body.append(wrap);wrap.innerHTML=row+html.match(/<div id="toast"[^\n]*?<\/div>/)[0];
 const $=id=>doc.getElementById(id);
 enhanceChrome(doc);await flush();
 // Tempo: the Stepper mirrors the hidden #bpm both ways.
 const bpm=$('bpm'),tempo=bpm.nextElementSibling,seen=log(bpm);
 assert.ok(tempo.classList.contains('stepper'));assert.equal(tempo.querySelector('.stepper-unit').textContent,'BPM');
 tempo.querySelectorAll('button')[1].click();assert.equal(bpm.value,'58');assert.deepEqual(seen,['input:58','change:58']);
 bpm.value='30';assert.equal(tempo.querySelector('.stepper-value').textContent,'30','a tempo write reaches the Stepper');assert.equal(tempo.querySelectorAll('button')[0].disabled,true);
 // ChordStrip over the chips app.js renders.
 const chords=$('chords');
 const render=current=>{chords.innerHTML=['Cmaj7','Am7','Fmaj7','G'].map((c,i)=>`${i?'<span class="chord-arrow" aria-hidden="true">→</span>':''}<button class="chord-chip ${i===current?'active':''}" data-chord="${i}">${c}<span class="progress"></span></button>`).join('');};
 render(2);await flush();
 const chips=()=>chords.querySelectorAll('button');
 assert.ok(chords.classList.contains('chord-strip'));assert.equal(chords.style.props['--chords'],'4');
 assert.deepEqual(chips().map(b=>b.dataset.state),['past','past','current','next']);assert.deepEqual(chips().map(b=>b.tabIndex),[-1,-1,0,-1],'one tab stop, on the current chord');
 chips()[2].focus();key(doc.activeElement,'ArrowRight');assert.equal(doc.activeElement,chips()[3]);key(doc.activeElement,'ArrowRight');assert.equal(doc.activeElement,chips()[0],'arrows wrap');key(doc.activeElement,'End');assert.equal(doc.activeElement,chips()[3]);
 render(0);await flush();assert.deepEqual(chips().map(b=>b.dataset.state),['current','next','next','next'],'a re-render is decorated again');
 // Capture popover: a dialog, not a menu; its settings keep their ids and enhancements.
 const trigger=$('captureMenuButton'),capture=$('capturePanel');
 assert.equal(capture.hidden,true);assert.equal(trigger.getAttribute('aria-haspopup'),'dialog');
 trigger.click();assert.equal(capture.hidden,false);assert.equal(doc.activeElement,$('recordName'),'opening focuses the name');
 const mode=$('recordMode').nextElementSibling;assert.ok(mode.classList.contains('segmented'));assert.deepEqual(mode.querySelectorAll('button').map(b=>b.textContent),['Cycles','Manual']);
 mode.querySelectorAll('button')[1].click();assert.equal($('recordMode').value,'manual');
 const cycles=$('recordCycles').nextElementSibling;assert.ok(cycles.classList.contains('stepper'));cycles.querySelectorAll('button')[1].click();assert.equal($('recordCycles').value,'3');
 $('recordCycles').disabled=true;await flush();assert.equal(cycles.querySelectorAll('button')[1].disabled,true,'manual mode disables the cycles Stepper');
 assert.equal(capture.hidden,false,'choosing inside keeps it open');
 key($('recordName'),'Escape');assert.equal(capture.hidden,true);assert.equal(doc.activeElement,trigger);
 // Toast: `hidden` is the state; it dismisses itself, from its action, or from ×.
 const toast=$('toast');assert.ok(toast.querySelector('.toast-close'));
 let acted=0;$('toastAction').hidden=false;$('toastAction').addEventListener('click',()=>{acted++;assert.equal(toast.hidden,false,'the action runs before the toast closes');});
 toast.dataset.timeout='20';toast.hidden=false;await flush();assert.ok(toast.classList.contains('is-visible'));
 $('toastAction').click();assert.equal(acted,1);assert.equal(toast.hidden,true);
 toast.hidden=false;await flush();await new Promise(r=>setTimeout(r,40));assert.equal(toast.hidden,true,'it hides after data-timeout');
 toast.dataset.timeout='0';toast.hidden=false;await flush();await new Promise(r=>setTimeout(r,40));assert.equal(toast.hidden,false,'0 keeps it');
 toast.querySelector('.toast-close').click();assert.equal(toast.hidden,true);
 // Focus that came from elsewhere goes back there when the toast hides under it.
 const origin=doc.createElement('button');doc.body.append(origin);origin.focus();toast.hidden=false;await flush();
 toast.querySelector('.toast-close').focus();const esc=new Event('keydown',{bubbles:true});esc.key='Escape';toast.querySelector('.toast-close').dispatchEvent(esc);
 assert.equal(toast.hidden,true);assert.equal(doc.activeElement,origin,'Escape returns focus to where it came from');
 origin.focus();toast.hidden=false;await flush();$('toastAction').focus();$('toastAction').click();assert.equal(doc.activeElement,origin,'the action returns focus too');
 toast.dataset.timeout='20';toast.hidden=false;await flush();toast.dispatchEvent(new Event('pointerenter'));await new Promise(r=>setTimeout(r,40));assert.equal(toast.hidden,false,'hover pauses it');
 toast.dispatchEvent(new Event('pointerleave'));await new Promise(r=>setTimeout(r,40));assert.equal(toast.hidden,true);
}
// Phase 7a: the Library is a TrackRow list beside a detail card; rare actions live in an overflow menu.
{
 const dialog=html.match(/<dialog id="recordDialog"[\s\S]*?<\/dialog>/)[0];
 for(const id of ['closeRecorder','recorderStatus','takeSelect','takeInfo','takePlay','takeOnce','takeStop','takeFork','takeSeam','takeSeamValue','takeSeamLabel','legacySeamInfo','sessionLoopInfo','takeName','takeRename','takeLoad','takeDownload','takeWav','clipExportOptions','clipLength','clipAspect','clipFraming','clipPreview','clipFrameInfo','takeClip','renderMinutes','renderSource','takeRender','takeImport','takeDelete','takeShare','takeFile'])assert.ok(dialog.includes(`id="${id}"`),`${id} keeps its id`);
 assert.match(dialog,/<button id="takeRename"[^>]*hidden>/,'Save name stays in the markup, hidden: the title renames inline');
 const menuStart=dialog.indexOf('<div id="takeMenu"'),menuHtml=dialog.slice(menuStart,dialog.indexOf('</div>',menuStart));
 assert.deepEqual([...menuHtml.matchAll(/<button id="(\w+)"[^>]*role="menuitem"/g)].map(m=>m[1]),['takeLoad','takeFork','takeDownload','takeImport','takeDelete'],'load setup, fork, save file, import and delete are in the overflow menu');
 const shown=dialog.replace(/<details[\s\S]*?<\/details>/g,'').replace(menuHtml,'');
 const visible=[...shown.matchAll(/<button id="(\w+)"([^>]*)>/g)].filter(m=>!/\bhidden\b/.test(m[2])&&m[1]!=='closeRecorder').map(m=>m[1]);
 assert.deepEqual(visible,['takeMenuButton','takePlay','takeOnce','takeShare'],'no more than 4 visible buttons, counting the overflow menu');
 const fold=id=>dialog.slice(dialog.indexOf(`<details id="${id}"`),dialog.indexOf('</details>',dialog.indexOf(`<details id="${id}"`)));
 for(const id of ['clipLength','clipAspect','clipFraming','clipPreview','takeClip','takeWav'])assert.ok(fold('clipExportOptions').includes(`id="${id}"`),`${id} is in the Export fold`);
 for(const id of ['renderMinutes','renderSource','takeRender'])assert.ok(fold('longRenders').includes(`id="${id}"`),`${id} is in the Long renders fold`);
 assert.ok(!/<details[^>]*>(?:(?!<\/details>)[\s\S])*<details/.test(dialog),'the folds are siblings, never nested');
 assert.deepEqual(POPOVERS.takeMenuButton,{panel:'takeMenu',menu:true});assert.deepEqual(TRACK_LISTS,['takeSelect']);assert.deepEqual(Object.keys(DIALOG_SEGMENTED),['clipLength','clipAspect','clipFraming']);assert.deepEqual(KNOBS.takeSeam,{sm:true});
 assert.ok(!/enhanceTrackList/.test(fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8')),'app.js does not apply components');

 // The real Library markup, enhanced the way startup does it.
 doc.body.replaceChildren();
 const wrap=new Node('div');doc.body.append(wrap);wrap.innerHTML=dialog;
 const $=id=>doc.getElementById(id);
 enhanceHelpTips(doc);enhanceKnobs(doc);enhanceChrome(doc);await flush();
 const s=$('takeSelect'),list=s.nextElementSibling;
 assert.ok(list.classList.contains('track-list'));assert.equal(list.getAttribute('role'),'radiogroup');assert.equal(s.getAttribute('aria-hidden'),'true');
 assert.equal(list.querySelector('.track-empty').textContent,'No recorded moments yet','the empty state is a row');assert.equal(list.querySelector('.track-play'),null);
 s.innerHTML='<option value="a" data-title="Low tide" data-meta="10/31/2026" data-duration="0:12" data-palette="tide" data-playable="true">Low tide · 0:12</option><option value="b" data-title="Low tide — fork" data-meta="Setup draft" data-duration="0:04" data-palette="" data-playable="false">Low tide — fork · 0:04</option>';
 s.selectedIndex=-1;await flush();
 const rows=()=>list.querySelectorAll('.track-row'),radio=i=>rows()[i].querySelector('.track-select'),play=i=>rows()[i].querySelector('.track-play');
 assert.equal(rows().length,2);
 assert.equal(rows()[0].querySelector('.track-title').textContent,'Low tide');assert.equal(rows()[0].querySelector('.track-meta').textContent,'10/31/2026');assert.equal(rows()[0].querySelector('.track-duration').textContent,'0:12');
 assert.ok(rows()[0].querySelectorAll('.track-dots i').length>0,'the take’s palette shows as dots');assert.equal(rows()[1].querySelectorAll('.track-dots i').length,0);
 assert.deepEqual([0,1].map(i=>radio(i).getAttribute('aria-checked')),['false','false'],'nothing is checked until a take is chosen');
 assert.deepEqual([0,1].map(i=>radio(i).tabIndex),[0,-1],'one tab stop');assert.equal(play(0).tabIndex,-1,'row play buttons are not tab stops');
 assert.equal(play(0).getAttribute('aria-label'),'Play Low tide');assert.equal(play(1).disabled,true,'a setup draft cannot play');
 const seen=log(s);radio(1).click();assert.equal(s.value,'b');assert.deepEqual(seen,['input:b','change:b']);
 radio(1).focus();key(radio(1),'ArrowUp');assert.equal(s.value,'a','arrows choose');assert.equal(doc.activeElement,radio(0));
 const plays=[];s.addEventListener('flow:trackplay',e=>plays.push(e.detail.value));play(0).click();assert.deepEqual(plays,['a'],'play reports the row’s take');
 const o=s.options[0];o.dataset.playing='true';o.setAttribute('data-playing','true');s.disabled=true;await flush();
 assert.ok(rows()[0].classList.contains('is-playing'));assert.equal(play(0).getAttribute('aria-label'),'Stop Low tide');
 assert.equal(play(0).disabled,false,'the playing row can stop while the list is busy');assert.equal(radio(0).disabled,true);
 s.disabled=false;await flush();
 // Overflow menu: arrows skip disabled items, Escape returns to the trigger.
 const button=$('takeMenuButton'),menu=$('takeMenu');
 assert.equal(menu.hidden,true);assert.equal(button.getAttribute('aria-haspopup'),'menu');
 for(const id of ['takeLoad','takeFork','takeDownload','takeDelete'])$(id).disabled=true;
 key(button,'ArrowDown');assert.equal(menu.hidden,false);assert.equal(doc.activeElement,$('takeImport'),'with no take, Import is the one enabled item');
 key(doc.activeElement,'Escape');assert.equal(menu.hidden,true);assert.equal(doc.activeElement,button);
 for(const id of ['takeLoad','takeFork','takeDownload','takeDelete'])$(id).disabled=false;
 let deleted=0;$('takeDelete').addEventListener('click',()=>deleted++);button.click();key(doc.activeElement,'End');assert.equal(doc.activeElement,$('takeDelete'));$('takeDelete').click();assert.equal(deleted,1);assert.equal(menu.hidden,true);
 // Clip export is Segmented; the seam blend is an sm knob whose row details() hides.
 const segments=id=>$(id).nextElementSibling.querySelectorAll('button').map(b=>b.textContent);
 assert.deepEqual(segments('clipLength'),['15 s','30 s','60 s']);assert.deepEqual(segments('clipAspect'),['9:16','1:1','16:9']);assert.deepEqual(segments('clipFraming'),['Fill','Fit']);
 assert.equal($('clipFraming').nextElementSibling.querySelectorAll('button')[1].title,'Fit entire canvas · allow borders');
 assert.ok($('takeSeamRow').classList.contains('knob-cell')&&$('takeSeamRow').querySelector('.knob.knob-sm'),'takeSeam is an sm knob in its own row');
 // Static helper copy moves into HelpTips; live lines stay.
 for(const id of ['clipExportOptions','longRenders'])assert.equal($(id).querySelector('.help-tip'),null,`${id}'s summary holds no button`);
 assert.equal($('clipExportOptions').parentElement.children[0].querySelector('[role="tooltip"]').children.length,2);
 assert.equal($('longRenders').parentElement.children[0].querySelector('[role="tooltip"]').children.length,1);
 assert.ok(list.parentElement.querySelector('label').querySelector('.help-tip'),'the session file note is a tip on Saved recordings');
 assert.ok(!$('seamHelp').parentElement.closest('.help-tip')&&!$('clipFrameInfo').closest('.help-tip'),'the seam note and frame info stay visible');
}
// Phase 7b: beat studio is a header, a StepGrid and a footer with the kit and four knobs.
{
 const dialog=html.match(/<dialog id="beatDialog"[\s\S]*?<\/dialog>/)[0];
 for(const id of ['closeBeats','studioBpm','studioPlay','studioEnabled','studioGroove','studioVary','studioClear','studioGrooveDescription','beatLanes','studioKit','studioKitDescription','studioSwing','studioHumanize','studioReverb','studioDelay','doneBeats'])assert.ok(dialog.includes(`id="${id}"`),`${id} keeps its id`);
 assert.match(dialog,/<button id="doneBeats"[^>]*hidden>/,'Back to your scene stays in the markup, hidden: × and Escape close');
 const visible=[...dialog.matchAll(/<button id="(\w+)"([^>]*)>/g)].filter(m=>!/\bhidden\b/.test(m[2])&&m[1]!=='closeBeats').map(m=>m[1]);
 assert.deepEqual(visible,['studioPlay','studioVary','studioClear'],'no more than 4 visible buttons; each voice’s tools sit behind its ⋯');
 assert.match(dialog,/<div class="studio-actions">[^]*?<input id="studioEnabled" type="checkbox" role="switch">/,'Percussion is a Switch in the header actions');
 assert.ok(!dialog.includes('studio-tip')&&!dialog.includes('studio-effects'),'the old tip lines and effects box are gone');
 assert.deepEqual(STEP_GRIDS,['beatLanes']);assert.deepEqual(KNOBS.studioSwing,{});assert.deepEqual(KNOBS.studioHumanize,{});
 for(const i of [0,1,2,3]){assert.deepEqual(POPOVERS['laneMenuButton'+i],{panel:'laneMenu'+i});assert.deepEqual(STEPPERS['laneHits'+i],{});}
 for(const id of ['studioSwing','studioHumanize'])assert.equal(html.match(new RegExp(`id="${id}"`,'g')).length,1,`${id} is beat studio’s mirror of the rail`);

 // The real dialog, with lanes shaped the way rhythm-ui.js renders them.
 doc.body.replaceChildren();
 const wrap=new Node('div');doc.body.append(wrap);wrap.innerHTML=dialog;
 const $=id=>doc.getElementById(id);
 $('beatLanes').innerHTML=[0,1,2,3].map(i=>`<section id="beatLane${i}" class="step-lane"><div class="step-lane-head"><button id="laneMute${i}" class="step-mute" type="button" data-mute="${i}" aria-pressed="false"></button><select id="drumVoice${i}" data-voice="${i}"><option value="off">No voice</option></select><div class="lane-menu"><button id="laneMenuButton${i}" class="icon-button" type="button"></button><div id="laneMenu${i}" class="popover lane-tools" role="dialog" hidden><label class="slider-label" for="laneLevel${i}">Level</label><input id="laneLevel${i}" type="range" min="0" max="100" value="80"><label for="laneHits${i}">Evenly spread hits</label><input id="laneHits${i}" type="number" min="0" max="16" step="1" value="3" aria-label="Evenly spaced hits for voice ${i+1}"><div class="lane-tool-actions"><button id="laneRotate${i}" type="button">Rotate ↻</button><button id="laneVary${i}" type="button">Vary ↗</button><button id="laneClear${i}" type="button">Clear</button></div></div></div></div><div class="step-cells" role="group">${Array.from({length:16},(_,j)=>`<button id="beatStep${i}_${j}" class="step-cell" type="button" data-lane="${i}" data-step="${j}"></button>`).join('')}</div></section>`).join('');
 enhanceHelpTips(doc);enhanceKnobs(doc);enhanceChrome(doc);await flush();
 const cell=(i,j)=>$(`beatStep${i}_${j}`);
 // StepGrid: steps in fours, one tab stop, arrows across lanes, playhead column.
 const quarters=$('beatLane0').querySelector('.step-cells').children;
 assert.equal(quarters.length,4);assert.ok(quarters.every(q=>q.classList.contains('step-quarter')&&q.children.length===4),'each lane groups its steps in fours');
 assert.equal(cell(0,4).parentElement,quarters[1]);
 assert.equal($('beatLanes').querySelectorAll('[data-step]').filter(c=>c.tabIndex===0).length,1,'one tab stop for the grid');assert.equal(cell(0,0).tabIndex,0);
 cell(0,0).focus();key(cell(0,0),'ArrowRight');assert.equal(doc.activeElement,cell(0,1));key(cell(0,1),'ArrowDown');assert.equal(doc.activeElement,cell(1,1));
 key(cell(1,1),'ArrowUp');key(cell(0,1),'ArrowUp');assert.equal(doc.activeElement,cell(3,1),'up from the first lane wraps');
 key(cell(3,1),'End');assert.equal(doc.activeElement,cell(3,15));key(cell(3,15),'ArrowRight');assert.equal(doc.activeElement,cell(3,0),'right from the last step wraps');key(cell(3,0),'Home');assert.equal(doc.activeElement,cell(3,0));
 assert.equal(cell(3,0).tabIndex,0);assert.equal(cell(0,0).tabIndex,-1,'the tab stop follows focus');
 $('beatLanes').dataset.playhead='5';$('beatLanes').setAttribute('data-playhead','5');await flush();
 assert.deepEqual([0,1,2,3].map(i=>cell(i,5).classList.contains('is-playhead')),[true,true,true,true]);assert.ok(!cell(0,4).classList.contains('is-playhead'));
 $('beatLanes').dataset.playhead='';$('beatLanes').setAttribute('data-playhead','');await flush();assert.ok(!cell(0,5).classList.contains('is-playhead'),'stopping clears the playhead');
 // Each voice's ⋯ opens its tools; Escape returns to it. Hits is a Stepper.
 const button=$('laneMenuButton2'),menu=$('laneMenu2');
 assert.equal(menu.hidden,true);assert.equal(button.getAttribute('aria-haspopup'),'dialog');
 button.click();assert.equal(menu.hidden,false);assert.equal(doc.activeElement,$('laneLevel2'),'the level is first');
 assert.ok(menu.querySelector('.stepper'),'the hit count is a Stepper');assert.equal($('laneHits2').dataset.enhanced,'stepper');
 const seen=log($('laneHits2'));const plus=menu.querySelectorAll('.stepper-button')[1];assert.equal(plus.getAttribute('aria-label'),'Increase evenly spaced hits for voice 3');plus.click();assert.equal($('laneHits2').value,'4');assert.deepEqual(seen,['input:4','change:4']);
 key($('laneRotate2'),'Escape');assert.equal(menu.hidden,true);assert.equal(doc.activeElement,button);
 // Footer: four knobs in one row; the kit and pattern notes are HelpTips.
 const row=$('studioSwing').closest('.knob-row');assert.ok(row?.parentElement.classList.contains('studio-knobs'));
 assert.deepEqual(row.children.map(c=>c.querySelector('input').id),['studioSwing','studioHumanize','studioReverb','studioDelay']);
 const tools=$('studioGroove').parentElement.querySelector('[role="tooltip"]');assert.equal(tools.children.length,3);assert.ok(tools.contains($('studioGrooveDescription')),'the live groove description is in the tools HelpTip');
 // Escape closes an open tip without closing the dialog; a second Escape reaches the dialog.
 const tipButton=$('studioGroove').parentElement.querySelector('.help-tip').querySelector('button');tipButton.click();assert.equal(tipButton.getAttribute('aria-expanded'),'true');
 assert.equal(key(tipButton,'Escape').defaultPrevented,true,'the dialog stays open');assert.equal(tipButton.getAttribute('aria-expanded'),'false');assert.equal(key(tipButton,'Escape').defaultPrevented,false,'a closed tip lets Escape close the dialog');
 const kit=$('studioKit').parentElement.querySelector('[role="tooltip"]');assert.equal(kit.children.length,3);assert.ok(kit.contains($('studioKitDescription')));assert.equal($('studioKit').getAttribute('aria-describedby'),'studioKitDescription');
}
// Phase 7c: Community's charts are Tabs, its tracks are TrackRows with a like and a ⋯ menu.
{
 const {TABS,ROW_MENUS}=await import('../public/controls-ui.js');
 const {communityRow}=await import('../public/community-ui.js');
 const dialog=html.match(/<dialog id="communityDialog"[\s\S]*?<\/dialog>/)[0];
 for(const id of ['closeCommunity','communitySignIn','communitySignOut','chartToday','chartWeek','chartAll','chartNewest','chartMine','chartDescription','communityRefresh','communityMore','communityRecordings','communityTracks','shareForm','sharePublish','shareSignIn','shareAuthRetry'])assert.ok(dialog.includes(`id="${id}"`),`${id} keeps its id`);
 assert.deepEqual(TABS,{communityTabs:{panel:'communityTracks'}});assert.deepEqual(ROW_MENUS,['communityTracks']);assert.deepEqual(POPOVERS.communityMenuButton,{panel:'communityMenu',menu:true});
 // Every button or link outside the tablist and the ⋯ menu is one of these. community-ui.test checks that at most 4 show in any state.
 const tablist=dialog.match(/<div id="communityTabs"[\s\S]*?<\/div>/)[0],menuHtml=dialog.match(/<div id="communityMenu"[\s\S]*?<\/div>/)[0];
 assert.ok(['communityRefresh','communityRecordings'].every(id=>menuHtml.includes(`id="${id}" type="button" role="menuitem"`)),'Refresh and Open browser library are in the ⋯ menu');
 const chrome=[...dialog.replace(tablist,'').replace(menuHtml,'').matchAll(/<(?:button|a) id="(\w+)"/g)].map(m=>m[1]).filter(id=>id!=='closeCommunity');
 assert.deepEqual(chrome,['communitySignIn','communitySignOut','communityMenuButton','communityMore','shareSignIn','shareAuthRetry','sharePublish']);

 doc.body.replaceChildren();
 const wrap=new Node('div');doc.body.append(wrap);wrap.innerHTML=dialog;
 const $=id=>doc.getElementById(id);
 enhanceHelpTips(doc);enhanceKnobs(doc);enhanceChrome(doc);await flush();
 // Tabs: roles, one tab stop, activation follows focus, the panel is labelled by the selected tab.
 const list=$('communityTabs'),tabs=['chartToday','chartWeek','chartAll','chartNewest','chartMine'].map($),panel=$('communityTracks');
 assert.equal(list.getAttribute('role'),'tablist');assert.ok(list.classList.contains('tabs'));assert.ok(tabs.every(t=>t.getAttribute('role')==='tab'&&t.getAttribute('aria-controls')==='communityTracks'));
 assert.equal(panel.getAttribute('role'),'tabpanel');assert.equal(panel.getAttribute('aria-labelledby'),'chartToday');
 assert.deepEqual(tabs.map(t=>t.tabIndex),[0,-1,-1,-1,-1],'one tab stop');assert.ok(list.querySelector('.tabs-bar'),'the underline bar');
 // The app owns aria-selected through its click handler, as community-ui.js does.
 const clicked=[];tabs.forEach(t=>t.addEventListener('click',()=>{clicked.push(t.id);tabs.forEach(o=>o.setAttribute('aria-selected',String(o===t)));}));
 tabs[0].focus();key(tabs[0],'ArrowRight');assert.equal(doc.activeElement,tabs[1]);assert.deepEqual(clicked,['chartWeek'],'arrows select');await flush();
 assert.deepEqual(tabs.map(t=>t.tabIndex),[-1,0,-1,-1,-1],'the tab stop follows the selection');assert.equal(panel.getAttribute('aria-labelledby'),'chartWeek');
 key(tabs[1],'End');assert.equal(doc.activeElement,tabs[4]);key(tabs[4],'ArrowRight');assert.equal(doc.activeElement,tabs[0],'right from the last tab wraps');
 key(tabs[0],'ArrowLeft');key(tabs[4],'Home');assert.deepEqual(clicked,['chartWeek','chartMine','chartToday','chartMine','chartToday']);
 tabs[3].setAttribute('aria-selected','true');tabs[0].setAttribute('aria-selected','false');await flush();assert.equal(tabs[3].tabIndex,0,'a selection the app makes itself moves the tab stop');
 // The chart's ⋯ menu.
 const more=$('communityMenuButton');assert.equal($('communityMenu').hidden,true);assert.equal(more.getAttribute('aria-haspopup'),'menu');
 let refreshed=0;$('communityRefresh').addEventListener('click',()=>refreshed++);key(more,'ArrowDown');assert.equal(doc.activeElement,$('communityRefresh'));$('communityRefresh').click();assert.equal(refreshed,1);assert.equal($('communityMenu').hidden,true);assert.equal(doc.activeElement,more);
 // Rows exactly as community-ui.js renders them.
 const track=(id,extra)=>({id,title:'Low tide',artist:'mara',created:Date.UTC(2026,9,30),duration:192000,bytes:1,likes:4,score:2,liked:false,mine:false,...extra});
 panel.innerHTML=[track('a'),track('b',{mine:true,liked:true})].map((t,i)=>communityRow(t,i,{sort:'popular',window:'today'})).join('');await flush();
 const rows=panel.querySelectorAll('.community-row');assert.equal(rows.length,2);
 assert.equal(rows[0].querySelector('.community-rank').textContent,'01');assert.equal(rows[0].querySelector('.track-play').getAttribute('aria-label'),'Play Low tide');
 assert.equal(rows[0].querySelector('.track-meta').textContent.split(' · ').at(-1),'2 today likes');assert.equal(rows[0].querySelector('.track-duration').textContent,'3:12');
 assert.equal(rows[1].querySelector('.track-like').getAttribute('aria-pressed'),'true');assert.equal(rows[1].querySelector('.track-like').textContent,'4');
 const items=r=>rows[r].querySelectorAll('[role="menuitem"]').map(b=>b.dataset.action||b.getAttribute('data-action'));
 assert.deepEqual(items(0),['fork','save','present','link']);assert.deepEqual(items(1),['fork','save','present','link','remove'],'Remove only on your own tracks');
 const rowMenu=rows[1].querySelector('[data-menu]'),rowPanel=rowMenu.nextElementSibling;assert.equal(rowPanel.hidden,true);assert.equal(rowMenu.getAttribute('aria-haspopup'),'menu');
 rowMenu.click();assert.equal(rowPanel.hidden,false);assert.equal(doc.activeElement,rowPanel.querySelector('[role="menuitem"]'));
 const remove=rowPanel.querySelectorAll('[role="menuitem"]')[4];remove.click();assert.equal(rowPanel.hidden,false,'Remove keeps the menu open for its confirm');
 rowPanel.querySelectorAll('[role="menuitem"]')[3].click();assert.equal(rowPanel.hidden,true,'other items close it');assert.equal(doc.activeElement,rowMenu);
 // A new render (another tab, a load) is decorated again.
 panel.innerHTML=communityRow(track('c'),0,{sort:'newest',window:'all'});await flush();
 const fresh=panel.querySelector('.community-row');assert.equal(fresh.querySelector('.community-rank'),null,'no rank outside the popular charts');
 assert.equal(fresh.querySelector('[data-menu]').getAttribute('aria-haspopup'),'menu','re-rendered rows get their menu');
}
// Phase 7d: Zen and presentation are one glass strip component; the Zen row toggles are gone.
{
 const {GLASS_STRIPS}=await import('../public/controls-ui.js');
 const zen=html.slice(html.indexOf('<div id="presentStrip"'),html.indexOf('<div class="sleep-veil"'));
 const pres=html.slice(html.indexOf('<div id="presentationControls"'),html.indexOf('<p id="presentationNextStatus"'));
 for(const id of ['zenTransportToggle','zenHarmonyToggle'])assert.ok(!html.includes(`id="${id}"`),`${id} is gone`);
 for(const marker of ['zen-row-toggle','zen-harmony-collapsed','zen-transport-collapsed','class="present-strip'])assert.ok(!html.includes(marker),`${marker} is gone`);
 assert.ok(!/zenTransportToggle|zenHarmonyToggle|zen-(harmony|transport)-collapsed/.test(fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8')+fs.readFileSync(new URL('../public/session-workspace.js',import.meta.url),'utf8')),'no JS reads the row toggles');
 const order=(markup,ids)=>{const at=ids.map(id=>markup.indexOf(`id="${id}"`));at.forEach((i,k)=>assert.ok(i>0&&(!k||i>at[k-1]),`${ids[k]} in order`));};
 order(zen,['presentPlay','zenEnergy','zenEnergyValue','zenSleepTimer','presentTitle','writeTitle','titleStatus','fullscreen','presentExit']);
 order(pres,['presentationNext','presentationAutoAdvance','presentationAutoDurationLabel','presentationAutoDuration','presentationSleepTimer','presentationFullscreen','presentationExit']);
 assert.match(zen,/^<div id="presentStrip" class="glass-strip" role="group" aria-label="Zen controls" data-shown="false" hidden>/);
 assert.match(pres,/^<div id="presentationControls" class="glass-strip glass-strip-presentation" role="group" aria-label="Presentation controls" data-shown="false" hidden>/);
 assert.match(zen,/<button id="presentPlay" class="strip-play"[^>]*><svg aria-hidden="true"><use href="#play"\/><\/svg><\/button>/,'Zen Play is a round icon button');
 assert.match(pres,/<input id="presentationAutoAdvance" type="checkbox" role="switch">/,'Auto-advance is a Switch');
 // Visible buttons: Zen 4, presentation 3 (the chevrons and the Stepper's −/+ are not counted).
 const buttons=m=>[...m.matchAll(/<(?:button|a) id="(\w+)"/g)].map(x=>x[1]);
 assert.deepEqual(buttons(zen),['presentPlay','writeTitle','fullscreen','presentExit']);
 assert.deepEqual(buttons(pres),['presentationNext','presentationFullscreen','presentationExit']);
 for(const id of ['zenSleepTimer','presentationSleepTimer'])assert.match(html,new RegExp(`<select id="${id}"[^>]*>(<option value="(0|15|30|45|60|90)">[^<]+</option>){6}</select>`),`${id} keeps its six values`);
 assert.deepEqual(GLASS_STRIPS,['presentStrip','presentationControls']);assert.deepEqual(STEPPERS.presentationAutoDuration,{unit:'min'});
 assert.ok(!/enhanceGlassStrip/.test(fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8')),'app.js does not apply components');

 doc.body.replaceChildren();
 const wrap=new Node('div');doc.body.append(wrap);wrap.innerHTML=zen+pres;
 const $=id=>doc.getElementById(id);
 enhanceChrome(doc);await flush();
 for(const id of GLASS_STRIPS){const strip=$(id);assert.ok(strip.classList.contains('glass-strip'));assert.equal(strip.dataset.enhanced,'glass-strip');assert.equal(strip.getAttribute('role'),'group');}
 // Enter in the title field writes the title through the same button; other keys and a disabled button do nothing.
 let writes=0;$('writeTitle').addEventListener('click',()=>writes++);
 const enter=key($('presentTitle'),'Enter');assert.equal(writes,1,'Enter writes the title');assert.ok(enter.defaultPrevented);
 key($('presentTitle'),'a');key($('presentTitle'),'Enter',{isComposing:true});assert.equal(writes,1);
 $('writeTitle').disabled=true;key($('presentTitle'),'Enter');assert.equal(writes,1);$('writeTitle').disabled=false;
 key($('zenEnergy'),'Enter');assert.equal(writes,1,'only a field that names its button submits');
 // Minutes per track is a Stepper that follows the auto-advance switch's disabling.
 const minutes=$('presentationAutoDuration'),stepper=minutes.nextElementSibling,seen=log(minutes);
 assert.ok(stepper.classList.contains('stepper'));assert.equal(stepper.parentElement,$('presentationAutoDurationLabel'));assert.equal(stepper.querySelector('.stepper-unit').textContent,'min');
 assert.ok(stepper.classList.contains('is-disabled'),'disabled while auto-advance is off');
 minutes.disabled=false;await flush();assert.ok(!stepper.classList.contains('is-disabled'));
 stepper.querySelectorAll('button')[1].click();assert.equal(minutes.value,'3.25');assert.deepEqual(seen,['input:3.25','change:3.25']);
 minutes.value='0.25';stepper.querySelectorAll('button')[0].click();assert.equal(minutes.value,'0.25','clamped at 15 s');
}
console.log('PASS: Zen and presentation are one glass strip: the row toggles are gone, Zen Play is a round icon, Enter writes the title, auto-advance is a Switch with a minutes Stepper, and the strips hold 4 and 3 buttons.');
console.log('PASS: Community has chart Tabs with roving focus and a sliding bar, a ⋯ menu for Refresh and the browser library, and TrackRows with a like and a per-row menu whose Remove keeps it open to confirm.');
console.log('PASS: beat studio is a StepGrid with per-voice tools, mirrored knobs and HelpTips; the Library is a TrackRow list with a detail card, an overflow menu, Segmented clip export, a seam knob and dialog HelpTips; knob ids match the markup, levels stay sliders, tapers round-trip, snap to step and clamp; Segmented, swatch grid, Stepper, Layer and EnvelopeGraph keep .value, events and disabled in sync both ways; tempo has a hidden input; Sound and Scene match their target tables with no folds, and enhanceRail applies Segmented, the swatch grid and the percussion dim at startup; Layers has three switch-disclosed layers with live descriptions, one Note shape fold with the EnvelopeGraph and glide, and no visible status lines; Play has six unfolded sections with Segmented tool, grid and octaves, the quantize layer and drift status in switch descriptions, knobs for intensity and interval, and fluidListens lives in Scene; Mix has five unfolded sections, vertical layer faders that dim with their layer, large melodic-space knobs, and one echo spacing menu with a tempo-aware readout.; the top bar holds the session title, saved state and a keyboard-navigable session menu Popover, fullscreen sits in the Zen strip, and the canvas edge keeps the palette pill and a Clear icon; the transport is one row with one Play, a ChordStrip with roving focus, the take chip, a tempo Stepper and one Record with a capture popover, and a toast that hides itself');
