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
 focus(){if(this.disabled||!('tabindex' in this.attrs)&&!['INPUT','SELECT','BUTTON'].includes(this.tagName))return;const prev=doc.activeElement;if(prev===this)return;doc.activeElement=this;prev?.dispatchEvent?.(new Event('focusout',{bubbles:true}));this.dispatchEvent(new Event('focusin',{bubbles:true}));}
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
 dispatchEvent(e){for(const fn of this.listeners[e.type]||[])fn(e);}};
doc.body.querySelectorAll=function(sel){const m=sel.match(/^\[id="([^"]+)"\]$/);if(m){const out=[];const walk=n=>{for(const c of n.children){if(c.id===m[1])out.push(c);walk(c);}};walk(this);return out;}return Node.prototype.querySelectorAll.call(this,sel);};
globalThis.document=doc;globalThis.HTMLInputElement=Input;
const flush=()=>new Promise(r=>setTimeout(r,0));
const key=(el,k,extra={})=>{const e=new Event('keydown',{bubbles:true,cancelable:true});Object.assign(e,{key:k,...extra});el.dispatchEvent(e);return e;};
const pointer=(el,type,extra)=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.assign(e,{button:0,pointerId:1,shiftKey:false,...extra});el.dispatchEvent(e);};
function log(el){const seen=[];el.addEventListener('input',()=>seen.push('input:'+el.value));el.addEventListener('change',()=>seen.push('change:'+el.value));return seen;}
function select(id,values,label){const wrap=new Node('div');doc.body.append(wrap);if(label){const l=new Node('label');l.attrs.for=id;l.textContent=label;wrap.append(l);}const s=new Select();s.id=id;for(const [v,t] of values)s.append(new Option(v,t));wrap.append(s);return s;}

const {KNOBS,SEGMENTED,SWATCH_GRIDS,LAYERS,SWITCH_STATUS,toNorm,fromNorm,enhanceSegmented,enhanceSwatchGrid,enhanceStepper,enhanceLayer,enhanceEnvelopeGraph,envelopePoints,enhanceKnobs,enhanceHelpTips,enhanceRail}=await import('../public/controls-ui.js');
const html=fs.readFileSync(new URL('../app/instrument.html',import.meta.url),'utf8');
for(const id of Object.keys(KNOBS)){assert.match(html,new RegExp(`<input id="${id}" type="range"`),`${id} is a range input`);assert.match(html,new RegExp(`<label class="slider-label" for="${id}">`),`${id} has a slider label`);}
for(const level of ['volume','dropletsVolume','arpVolume','rhythmVolume','environmentVolume','rain','energy'])assert.ok(!(level in KNOBS),`${level} stays a slider`);
const ms={min:'0',max:'2000',step:'5'},pct={min:'0',max:'100',step:''};
assert.equal(fromNorm(pct,toNorm(pct,65)),65);
for(const x of [0,20,120,180,2000])assert.equal(fromNorm(ms,toNorm(ms,x,3),3),x);
assert.ok(toNorm(ms,200,3)>.45,'skewed taper gives the musical range most of the travel');
assert.equal(fromNorm(ms,.5,3)%5,0,'values snap to the input step');
assert.equal(fromNorm(pct,1.4),100);assert.equal(fromNorm(pct,-1),0);

// Primitives are applied at startup by enhanceRail(), never written into the markup.
for(const marker of ['class="segmented','class="swatch-grid','class="stepper','class="layer-body','envelope-graph','data-orientation="vertical"'])assert.ok(!html.includes(marker),`${marker} is built at runtime, not in the markup`);

// Phase 2: the Sound and Scene tabs match their target tables.
{
 const panel=id=>html.match(new RegExp(`<div id="${id}"[^>]*>([\\s\\S]*?)\\n</div>`))[1];
 const sound=panel('soundPanel'),scene=panel('fluidPanel');
 for(const [name,markup] of [['Sound',sound],['Scene',scene]])assert.ok(!markup.includes('<details'),`${name} has no folds`);
 const order=(markup,titles)=>titles.map(t=>{const i=markup.indexOf(t);assert.ok(i>=0,`${t} is present`);return i;}).forEach((i,k,all)=>assert.ok(!k||i>all[k-1],`${titles[k]} follows ${titles[k-1]}`));
 order(sound,['for="soundscape">Vibe<','for="progression">Chord progression<','<label for="chordLength">Chord length</label>','<div class="section-label">Color voices</div><div id="voices"></div>']);
 order(scene,['for="energy">Energy<','for="colorPalette">Color palette<','<div class="section-label">The fluid</div>','<span>Living water<','<div class="section-label">Percussion response</div>']);
 for(const id of ['scapeDescription','progressionDescription'])assert.match(sound,new RegExp(`id="${id}"[^>]*data-help-tip`),`${id} moves into its section's HelpTip`);
 const paletteSection=scene.match(/<section class="control-section"><label class="section-label" for="colorPalette">[\s\S]*?<\/section>/)[0];
 assert.ok(paletteSection.includes('<p class="helper color-guide">Choose a swatch on the canvas to use only that color and voice. Turn on <strong>Cycle colors</strong> beside the palette to randomly use each color once before repeating, for painting, rain, and blooms.</p>'),'Color behavior copy moves verbatim into the palette section');
 assert.ok(!/COLOR BEHAVIOR/i.test(html),'the Color behavior section is gone');
 const fluid=scene.match(/<div class="section-label">The fluid<\/div>[\s\S]*?<\/section>/)[0];
 for(const id of ['swirl','persistence','dropSize','chordAtmosphere'])assert.ok(fluid.includes(`<input id="${id}" type="range"`),`${id} sits in The fluid`);
 assert.ok(!scene.includes('fluidListens'),'fluidListens waits for Phase 4');
 for(const id of ['soundscape','progression','chordInput','applyChords','chordLength','voices','voiceControls','energy','energyValue','colorPalette','palettePreview','paletteDescription','swirl','persistence','dropSize','chordAtmosphere','waterEnabled','waterPreset','waterSwell','waterSpeed','waterRefraction','waterCaustics','waterReflection','rhythmVisualControls','rhythmVisualMode','rhythmVisual'])assert.equal(html.match(new RegExp(`id="${id}"`,'g'))?.length,1,`${id} keeps exactly one home`);
 assert.deepEqual(Object.keys(SEGMENTED).slice(0,3),['chordLength','waterPreset','rhythmVisualMode']);assert.deepEqual(SWATCH_GRIDS,['colorPalette']);
 for(const id of ['waterSwell','waterSpeed','waterRefraction','waterCaustics','waterReflection'])assert.equal(KNOBS[id].sm,true,`${id} is a small knob`);
}
assert.match(html,/<input id="bpm" type="number" min="30" max="100" step="2" value="56" aria-label="Tempo" hidden>/,'tempo state has a hidden number input for the Stepper');
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
assert.match(app,/function showBpm\(\)\{\$\('bpmLabel'\)\.textContent=state\.bpm;\$\('bpm'\)\.value=state\.bpm;\}/,'every tempo change writes the hidden input');
assert.ok(!/\$\('bpmLabel'\)\.textContent=state\.bpm;(?!\$\('bpm'\))/.test(app.replace(/function showBpm[^\n]*/,'')),'no tempo write bypasses showBpm');
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
 const ids={chordLength:[['4','4 beats'],['8','8 beats'],['16','16 beats']],waterPreset:[['sea','Gentle sea'],['glass','Glassy water'],['lagoon','Sunlit lagoon'],['custom','Your own water']],colorPalette:[['classic','Original glow'],['ember','Ember']]};
 const selects=Object.fromEntries(Object.entries(ids).map(([id,values])=>[id,select(id,values)]));
 const section=new Node('section');section.id='rhythmVisualControls';section.className='control-section';doc.body.append(section);
 const title=new Node('div');title.className='section-label';section.append(title);
 const mode=new Select();mode.id='rhythmVisualMode';for(const [v,t] of [['both','Ripples + stir the fluid'],['ripples','Ripples only'],['fluid','Stir the fluid only']])mode.append(new Option(v,t));section.append(mode);
 const toggle=new Input();toggle.id='rhythmEnabled';toggle.type='checkbox';doc.body.append(toggle);
 enhanceRail(doc);
 for(const id of ['chordLength','waterPreset','rhythmVisualMode'])assert.equal(doc.getElementById(id).dataset.enhanced,'segmented',`${id} is Segmented`);
 assert.ok(selects.chordLength.nextElementSibling.classList.contains('segmented-full'));
 assert.ok(selects.waterPreset.nextElementSibling.classList.contains('segmented-sm'),'water character uses the small size');
 assert.equal(selects.colorPalette.dataset.enhanced,'swatch-grid');
 const seen=log(selects.waterPreset);selects.waterPreset.nextElementSibling.children[2].click();
 assert.equal(selects.waterPreset.value,'lagoon');assert.deepEqual(seen,['input:lagoon','change:lagoon'],'segments drive the native select');
 selects.waterPreset.value='custom';assert.equal(selects.waterPreset.nextElementSibling.children[3].getAttribute('aria-checked'),'true','app writes (preset → custom) show in the segments');
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
 assert.deepEqual(Object.keys(LAYERS),['arpEnabled','rhythmEnabled','environmentEnabled']);assert.deepEqual(SWITCH_STATUS,{arpGlideEnabled:'arpGlideSummary'});
 assert.match(html,/<script type="module" src="controls-ui\.js\?rev=controls-3"><\/script>/);assert.match(html,/flow-ds\.css\?rev=controls-3/);

 // The real markup, enhanced the way startup does it.
 doc.body.replaceChildren();
 const content=new Node('div');content.className='panel-content';doc.body.append(content);
 content.innerHTML=html.match(/<div id="rhythmPanel"[^>]*>[\s\S]*?\n<\/div>/)[0];
 const $=id=>doc.getElementById(id);
 enhanceHelpTips(doc);enhanceKnobs(doc);enhanceRail(doc);
 const panel=$('rhythmPanel');
 for(const [toggleId,{body,status}] of Object.entries(LAYERS)){
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
 const shapeTip=$('arpShape').querySelector('summary').querySelector('.help-tip');
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
console.log('PASS: knob ids match the markup, levels stay sliders, tapers round-trip, snap to step and clamp; Segmented, swatch grid, Stepper, Layer and EnvelopeGraph keep .value, events and disabled in sync both ways; tempo has a hidden input; Sound and Scene match their target tables with no folds, and enhanceRail applies Segmented, the swatch grid and the percussion dim at startup; Layers has three switch-disclosed layers with live descriptions, one Note shape fold with the EnvelopeGraph and glide, and no visible status lines.');
