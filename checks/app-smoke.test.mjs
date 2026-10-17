import fs from 'node:fs';import assert from 'node:assert/strict';
const ids=new Map(),all=[];let frame,clock=0;
const drawing=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createRadialGradient:()=>({addColorStop(){}})}, {get:(obj,key)=>obj[key]??(()=>{})});
function make(tag='div',a={}){const classes=new Set((a.class||'').split(/\s+/));const e={tagName:tag.toUpperCase(),id:a.id||'',dataset:{},style:{setProperty(k,v){this[k]=v;}},value:a.value||'',min:a.min||'0',max:a.max||'100',type:a.type||'',checked:!!a.checked,hidden:!!a.hidden,listeners:{},textContent:'',options:[],classList:{add(...v){v.forEach(s=>classes.add(s));},remove(...v){v.forEach(s=>classes.delete(s));},contains:s=>classes.has(s),toggle(s,on){const value=on??!classes.has(s);value?classes.add(s):classes.delete(s);}},setAttribute(k,v){this[k]=String(v);},addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);},focus(){document.activeElement=this;},showModal(){this.open=true;},close(){this.open=false;},querySelector(){return make();},getBoundingClientRect:()=>({left:0,top:0,right:1000,bottom:600,width:1000,height:600}),getContext:()=>drawing,setPointerCapture(){}};for(const [k,v] of Object.entries(a))if(k.startsWith('data-'))e.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;Object.defineProperty(e,'innerHTML',{set(value){this.html=value;parse(value);},get(){return this.html||'';}});Object.defineProperty(e,'selectedOptions',{get(){return [this.options.find(o=>o.value===this.value)||{textContent:'Still water'}];}});all.push(e);if(e.id)ids.set(e.id,e);return e;}
function attrs(raw){const a=Object.fromEntries([...raw.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));a.checked=/\bchecked\b/.test(raw);a.hidden=/\bhidden\b/.test(raw);return a;}
function parse(html){for(const t of html.matchAll(/<([\w-]+)(\s[^>]*?)?>/g))make(t[1],attrs(t[2]||''));for(const s of html.matchAll(/<select([^>]*)>([\s\S]*?)<\/select>/g)){const a=attrs(s[1]);if(!a.id)continue;const node=ids.get(a.id);node.options=[...s[2].matchAll(/<option([^>]*)>([\s\S]*?)<\/option>/g)].map(o=>({value:attrs(o[1]).value,textContent:o[2],selected:/\bselected\b/.test(o[1])}));node.value=(node.options.find(o=>o.selected)||node.options[0])?.value||'';}}
const body=make('body',{id:'body'});globalThis.document={body,activeElement:body,events:{},getElementById:id=>{assert(ids.has(id),'Missing ID: '+id);return ids.get(id);},querySelectorAll:selector=>all.filter(e=>selector.split('.').filter(Boolean).every(c=>e.classList.contains(c))),querySelector(selector){return this.querySelectorAll(selector)[0];},addEventListener(k,fn){(this.events[k]??=[]).push(fn);},createElement:tag=>make(tag)};globalThis.window={innerWidth:1200,devicePixelRatio:1};globalThis.ResizeObserver=class{observe(){}};globalThis.requestAnimationFrame=fn=>{frame=fn;return 1;};Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};parse(fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'));
const {ChordAtmosphere}=await import('../dist/chord-atmosphere.js?rev=arp-envelope-15');let atmosphereFrame;const atmosphereStep=ChordAtmosphere.prototype.frame;ChordAtmosphere.prototype.frame=function(dt,options){atmosphereStep.call(this,dt,options);atmosphereFrame={...options,light:this.light,pulse:this.pulse};};
await import('../dist/app.js');assert.equal(typeof frame,'function');const $=document.getElementById;function tick(){clock+=16;frame(clock);}for(let i=0;i<3;i++)tick();$('performTab').onclick();assert.equal($('performPanel').hidden,false);assert.equal($('rhythmPanel').hidden,true);
const canvas=$('fluid'),event={pointerId:1,button:0,pointerType:'mouse',clientX:500,clientY:350};for(const fn of canvas.listeners.pointerdown)fn(event);for(let i=0;i<60;i++)tick();for(const fn of canvas.listeners.pointerup)fn(event);for(let i=0;i<45;i++)tick();assert.equal($('gestureName').textContent,'Bloom');const coral=all.find(e=>e.dataset.color==='2');for(const fn of coral.listeners.click)fn();assert.equal($('cycleColors').checked,false);assert.equal($('paletteHint').textContent,'CORAL ONLY');assert.equal($('pitchRangeValue').textContent,'Coral: C2 → B3 · 8 notes');$('clear').onclick();tick();
console.log('PASS: complete app initializes, draws frames, opens Perform, processes a held bloom and impacts, preserves color lock, and resets without runtime errors.');
// Exercise the live app's quantized launch, scheduler, splash, and transport controls.
const {AmbientAudio}=await import('../dist/music.js?rev=arp-envelope-15');
const notes=[],timers=new Map();let timerID=0;
const originalSet=globalThis.setInterval,originalClear=globalThis.clearInterval;
try{
 globalThis.setInterval=function(fn,ms){assert.equal(this,globalThis);assert.equal(ms,25);timers.set(++timerID,fn);return timerID;};
 globalThis.clearInterval=function(id){assert.equal(this,globalThis);timers.delete(id);};
 AmbientAudio.prototype.initialize=async function(){this.ctx={get currentTime(){return clock/1000;},createGain(){return {gain:{value:0,events:[],setTargetAtTime(value,time){this.events.push({value,time});}},connect(){}};}};};
 AmbientAudio.prototype.load=async()=>({});
 AmbientAudio.prototype.note=async function(key,pitch,expression,options={}){notes.push({key,pitch,expression,...options,observedAt:clock/1000});};
 const fire=id=>{for(const fn of $(id).listeners.change||[])fn();};
 $('autoPour').checked=false;fire('autoPour');$('clear').onclick();$('quantizeBeats').value='1';$('quantizeEnabled').checked=true;fire('quantizeEnabled');assert.equal($('quantizeBeats').disabled,false);
 const origin=clock/1000;await $('start').listeners.click[0]();assert.equal(timers.size,1);$('clear').onclick();
 const tap=()=>{for(const fn of canvas.listeners.pointerdown)fn(event);for(const fn of canvas.listeners.pointerup)fn(event);};tap();
 for(let i=0;i<85;i++){tick();for(const fn of timers.values())fn();}
 assert.equal(notes.length,1,'one scheduled note and no duplicate at impact');const hit=notes[0],step=60/56;assert(Math.abs((hit.when-origin)/step-Math.round((hit.when-origin)/step))<1e-8);assert(hit.when>hit.observedAt);assert(hit.when-hit.observedAt<=.12);assert($('noteToast').textContent.includes('·'));
 tap();const prior=notes.length;for(let i=0;i<150&&notes.length===prior;i++){tick();for(const fn of timers.values())fn();}assert.equal(notes.length,prior+1);const waiting=notes.at(-1);assert(clock/1000<waiting.when);$('clear').onclick();assert.equal(waiting.signal.aborted,true);
 // A grid edit replaces pending audio instead of leaving a ghost note behind.
 tap();const count=notes.length;for(let i=0;i<150&&notes.length===count;i++)tick();const old=notes.at(-1);$('quantizeBeats').value='.125';fire('quantizeBeats');assert.equal(old.signal.aborted,true);
 $('quantizeEnabled').checked=false;fire('quantizeEnabled');assert.equal(timers.size,0);assert.equal($('quantizeBeats').disabled,true);for(let i=0;i<60;i++)tick();assert.equal(notes.at(-1).when,null);
 // Run the real percussion scheduler with its synth stubbed, then change tempo.
 const {PercussionSynth}=await import('../dist/rhythm.js?rev=shared-delay-4');
 for(const method of ['connect','setLevel','setEffects','stop','hit'])PercussionSynth.prototype[method]=function(){};
 $('clear').onclick();$('quantizeBeats').value='1';$('quantizeEnabled').checked=true;fire('quantizeEnabled');$('rhythmEnabled').checked=true;fire('rhythmEnabled');$('rhythmRate').value='2';fire('rhythmRate');assert.equal(timers.size,2);
 const advanceToNote=(count=notes.length)=>{for(let i=0;i<160&&notes.length===count;i++){tick();for(const fn of timers.values())fn();}assert.equal(notes.length,count+1);return notes.at(-1);};
 tap();const doubleHit=advanceToNote();const doubleStep=60/56/2;assert(Math.abs((doubleHit.when-origin-.04)/doubleStep-Math.round((doubleHit.when-origin-.04)/doubleStep))<1e-8);
 const noteCountBeforeEdit=notes.length,editTime=clock/1000,newOrigin=editTime-(editTime-origin)*56/58;$('faster').onclick();tick();assert.equal(doubleHit.signal.aborted,true);const changed=advanceToNote(noteCountBeforeEdit),newStep=60/58/2;assert(Math.abs((changed.when-newOrigin-.04)/newStep-Math.round((changed.when-newOrigin-.04)/newStep))<1e-8);
 await $('start').listeners.click[0]();tick();assert.equal(changed.signal.aborted,true);assert.equal(timers.size,0);$('clear').onclick();await $('start').listeners.click[0]();assert.equal(timers.size,2);$('clear').onclick();
 await $('start').listeners.click[0]();assert.equal(timers.size,0);$('clear').onclick();$('quantizeEnabled').checked=false;fire('quantizeEnabled');$('quantizeBeats').value='.125';fire('quantizeBeats');
 const settings=JSON.parse(store.get('chromaflow-v1')).settings;assert.equal(settings.quantizeEnabled,false);assert.equal(Number(settings.quantizeBeats),.125);
 // The actual edge clicks must reach the complete expanded range, despite visual margins.
 $('rhythmEnabled').checked=false;fire('rhythmEnabled');$('progression').value='daydream';fire('progression');
 for(const fn of all.find(e=>e.dataset.color==='0').listeners.click)fn();
 $('octavesDown').value='3';$('octavesUp').value='3';fire('octavesDown');fire('octavesUp');
 assert.equal($('pitchRangeValue').textContent,'Lilac: C0 → B6 · 28 notes');
 await $('start').listeners.click[0]();$('clear').onclick();
 const tapAt=x=>{const e={...event,clientX:x};for(const fn of canvas.listeners.pointerdown)fn(e);for(const fn of canvas.listeners.pointerup)fn(e);};
 tapAt(0);for(let i=0;i<60;i++)tick();assert.equal(notes.at(-1).pitch,12);
 tapAt(1000);for(let i=0;i<60;i++)tick();assert.equal(notes.at(-1).pitch,95);
 $('quantizeEnabled').checked=true;fire('quantizeEnabled');tapAt(1000);const future=advanceToNote();const beforeRangeEdit=notes.length;
 $('octavesUp').value='0';fire('octavesUp');assert.equal(future.signal.aborted,true);const retuned=advanceToNote(beforeRangeEdit);assert.equal(retuned.pitch,59);
 assert.equal($('pitchRangeValue').textContent,'Lilac: C0 → B3 · 16 notes');
 $('clear').onclick();await $('start').listeners.click[0]();
 const savedRange=JSON.parse(store.get('chromaflow-v1')).settings;assert.equal(Number(savedRange.octavesDown),3);assert.equal(Number(savedRange.octavesUp),0);
 console.log('PASS: live octave controls and preview, true canvas-edge pitches, retuning pending quantized notes, preserved color voicing, and saved range settings.');
 // The independent arpeggio must use one chosen voice and its own ordered pool.
 $('arpVoice').value='celesta';fire('arpVoice');$('arpPattern').value='bounce';fire('arpPattern');$('arpRate').value='0.25';fire('arpRate');$('arpCount').value='7';for(const fn of $('arpCount').listeners.input)fn();$('arpEnabled').checked=true;fire('arpEnabled');
 assert.match($('arpStatus').textContent,/Ready/);const arpStart=notes.length;await $('start').listeners.click[0]();await Promise.resolve();$('clear').onclick();
 for(let i=0;i<140;i++){tick();for(const fn of timers.values())fn();await Promise.resolve();}
 const arpeggio=notes.slice(arpStart).filter(note=>note.target);assert(arpeggio.length>=12);assert(arpeggio.every(note=>note.key==='celesta'));assert.deepEqual(arpeggio.slice(0,12).map(note=>note.pitch),[48,52,55,59,60,64,67,64,60,59,55,52]);assert.match($('arpPoolLabel').textContent,/7 chord tones/);assert.notEqual($('arpCurrent').textContent,'—');
 const originalEnvelopeLine=$('arpEnvelopeLine').points;
 for(const [id,value] of [['arpLength','200'],['arpAttack','500'],['arpDecay','250'],['arpSustain','30']]){$(id).value=value;for(const fn of $(id).listeners.input)fn();}
 assert.equal($('arpLengthValue').textContent,'200%');assert.equal($('arpAttackValue').textContent,'500 ms');assert.equal($('arpSustainValue').textContent,'30%');assert.notEqual($('arpEnvelopeLine').points,originalEnvelopeLine);assert($('arpEnvelopeSummary').textContent.includes('S 30%'));
 const shapedBefore=notes.filter(note=>note.target).length;for(let i=0;i<30;i++){tick();for(const fn of timers.values())fn();await Promise.resolve();}const shaped=notes.filter(note=>note.target).slice(shapedBefore);assert(shaped.length>0);assert(shaped.every(note=>note.noteEnvelope[3].volume===.3));
 const savedShape=JSON.parse(store.get('chromaflow-arp-v1'));assert.equal(savedShape.length,200);assert.equal(savedShape.attack,500);assert.equal(savedShape.decay,250);assert.equal(savedShape.sustain,30);
 const previewBeforeTempo=$('arpEnvelopeSummary').textContent;$('faster').onclick();tick();assert.notEqual($('arpEnvelopeSummary').textContent,previewBeforeTempo);$('slower').onclick();tick();
 const queued=notes.filter(note=>note.target&&note.when>clock/1000);$('arpVoice').value='vibes';fire('arpVoice');await Promise.resolve();await Promise.resolve();assert(queued.every(note=>note.signal.aborted));
 $('arpVolume').value='0';for(const fn of $('arpVolume').listeners.input)fn();tick();for(const fn of timers.values())fn();await Promise.resolve();const arpBus=notes.filter(note=>note.target).at(-1).target;assert.equal(arpBus.gain.events.at(-1).value,0);
 $('arpEnabled').checked=false;fire('arpEnabled');const stoppedCount=notes.filter(note=>note.target).length;for(let i=0;i<30;i++){tick();for(const fn of timers.values())fn();await Promise.resolve();}assert.equal(notes.filter(note=>note.target).length,stoppedCount);assert.match($('arpStatus').textContent,/Off/);await $('start').listeners.click[0]();assert.equal(timers.size,0);
 const arpSettings=JSON.parse(store.get('chromaflow-arp-v1'));assert.equal(arpSettings.count,7);assert.equal(arpSettings.pattern,'bounce');assert.equal(arpSettings.voice,'vibes');assert.equal(arpSettings.enabled,false);
 console.log('PASS: app arpeggiator enable, chosen voice, bounce pattern, seven-note pool, timed preview, voice-change cancellation, independent mute, disable, pause, and persistence.');
 // The canvas atmosphere follows real transport boundaries and manual jumps.
 $('progression').value='daydream';fire('progression');await $('start').listeners.click[0]();$('clear').onclick();
 clock+=8*60/58*1000+25;tick();assert.equal(atmosphereFrame.chord,'Am7');assert.equal(atmosphereFrame.index,1);assert(atmosphereFrame.pulse>0&&atmosphereFrame.pulse<.01);
 await $('start').listeners.click[0]();$('clear').onclick();
 const jump={dataset:{chord:'2'}};for(const fn of $('chords').listeners.click)fn({target:{closest:()=>jump}});tick();assert.equal(atmosphereFrame.chord,'Fmaj7');assert.equal(atmosphereFrame.playing,false);
 const soundCount=notes.length;$('chordAtmosphere').value='0';for(const fn of $('chordAtmosphere').listeners.input)fn();tick();assert.deepEqual(atmosphereFrame.light,{brightness:1,tint:[1,1,1]});assert.equal(notes.length,soundCount);assert.equal(JSON.parse(store.get('chromaflow-v1')).settings.chordAtmosphere,'0');
 console.log('PASS: canvas atmosphere tracks automatic chord boundaries and paused manual jumps, with a persisted zero setting and no extra audio events.');
 // Selecting new soundscapes applies all four voices/effects without changing timing.
 const {soundscapes,instruments}=await import('../dist/music.js?rev=arp-envelope-15');
 const beforeScapes={bpm:$('bpmLabel').textContent,rate:$('rhythmRate').value,spacing:$('voiceDelayBeats').value,notes:notes.length};
 for(const key of ['glassorganisms','submergedcinema','strangeattractor','orbitalrelay']){
  $('soundscape').value=key;for(const fn of $('soundscape').listeners.change)await fn();const scape=soundscapes[key];
  for(let i=0;i<4;i++)assert.equal($('voice'+i).value,scape.voices[i]);assert.equal(Number($('reverb').value),scape.reverb);assert.equal(Number($('delay').value),scape.delay);assert.equal($('scapeDescription').textContent,scape.text);assert.equal(JSON.parse(store.get('chromaflow-v1')).settings.soundscape,key);
 }
 for(const key of Object.keys(instruments).filter(key=>instruments[key].group==='Experimental textures')){assert($('voices').html.includes('value="'+key+'"'));assert($('arpVoice').html.includes('value="'+key+'"'));}
 assert.equal($('bpmLabel').textContent,beforeScapes.bpm);assert.equal($('rhythmRate').value,beforeScapes.rate);assert.equal($('voiceDelayBeats').value,beforeScapes.spacing);assert.equal(notes.length,beforeScapes.notes);
 console.log('PASS: all experimental preset selections update four voices, effects, description, and saved settings; new voices appear in color and arpeggio menus without changing timing or triggering extra notes.');
 console.log('PASS: app quantize controls, ahead-of-time scheduling, beat alignment, single visual/audio impact, clear cancellation, live grid/tempo changes, double-speed percussion phase, free mode, pause/resume, and persistence.');
}finally{globalThis.setInterval=originalSet;globalThis.clearInterval=originalClear;}
