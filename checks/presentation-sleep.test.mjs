import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PresentationSleep} from '../public/presentation-sleep.js';
let now=0,callback=null,finished=0,values=[],cleared=0;
const sleeper=new PresentationSleep({now:()=>now,change:v=>values.push(v),finish:()=>finished++,setTimer:(fn,ms)=>{assert.equal(ms,100);callback=fn;return 7;},clearTimer:id=>{assert.equal(id,7);callback=null;cleared++;}});
sleeper.set(15);assert(callback);now=659;callback();assert.equal(values.at(-1).gain,1);assert(!sleeper.input());now=780;callback();assert(Math.abs(values.at(-1).gain-.01)<1e-8);assert(sleeper.input());assert.equal(callback,null);assert.equal(values.at(-1).gain,1);
sleeper.set(15);now+=900;const late=callback;late();late();assert.equal(finished,1);assert.equal(callback,null);assert(values.at(-1).gain<.00011);sleeper.reset();assert.equal(values.at(-1).dim,0);assert(cleared>=2);
// Real Present controls use the audio clock even with no animation frames, and never restart the deadline on a track transition.
const elements=new Map(),classList={add(){},remove(){}};
for(const match of fs.readFileSync(new URL('../app/instrument.html',import.meta.url),'utf8').matchAll(/\bid="([^"]+)"/g))elements.set(match[1],{id:match[1],value:'0',hidden:false,disabled:false,checked:false,dataset:{},style:{setProperty(k,v){this[k]=v;}},parentNode:{style:{},insertBefore(){}},listeners:{},append(){},prepend(){},contains(){return false;},getAttribute(){return null;},setAttribute(){},removeAttribute(){},addEventListener(type,fn){this.listeners[type]=fn;}});
const $=id=>elements.get(id);globalThis.document={body:{classList},documentElement:{classList},activeElement:null,getElementById:$,addEventListener(){}};globalThis.location={pathname:'/recordings/first',search:''};globalThis.history={replaceState(){},pushState(){}};
const saved={setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout},timers=new Map();let serial=0,clock=0,stops=0,gains=[],nextResolve;
try{
 globalThis.setInterval=(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id;};globalThis.clearInterval=id=>timers.delete(id);globalThis.setTimeout=()=>1;globalThis.clearTimeout=()=>{};
 const recorder={phase:'playing',get presentationTime(){return clock;},setPresentationSleepGain:value=>gains.push(value),async prepareExternal(){},async playExternal(){this.phase='playing';},stopPlayback(){this.phase='idle';stops++;nextResolve?.(false);},async transitionExternal(){return new Promise(resolve=>nextResolve=resolve);}};
 const {createPresentationController}=await import('../public/presentation.js');const presentation=createPresentationController(recorder),first={name:'First',communityId:'first'},second={name:'Second',communityId:'second'};
 presentation.enter(first,'portrait');await presentation.play(first);assert.equal($('presentationSleepTimer').value,'0');assert.equal(timers.size,0);
 presentation.setQueue({warm:async()=>second,next:async()=>second,close(){}});await Promise.resolve();
 $('presentationAutoAdvance').checked=true;$('presentationAutoAdvance').listeners.change();$('presentationSleepTimer').value='15';$('presentationSleepTimer').listeners.change();
 const tick=()=>[...timers.values()].find(t=>t.ms===100)?.fn();clock=780;tick();assert(Math.abs(gains.at(-1)-.01)<1e-8);assert.equal($('presentationShell').style['--presentation-sleep-dim'],'0.4925');
 $('presentationShell').listeners.pointerdown({target:{closest:()=>null}});assert.equal($('presentationSleepTimer').value,'0');assert.equal(gains.at(-1),1);assert.match($('presentationNextStatus').textContent,/cancelled/);assert(![...timers.values()].some(t=>t.ms===100));
 $('presentationSleepTimer').value='15';$('presentationSleepTimer').listeners.change();clock+=780;tick();const advancing=$('presentationNext').onclick();await Promise.resolve();await Promise.resolve();clock+=120;tick();await advancing;
 assert.equal(stops,1);assert.equal(timers.size,0);assert.equal($('presentationAutoAdvance').checked,false);assert.equal($('presentationGate').hidden,false);assert.equal($('presentationBegin').hidden,false);assert.match($('presentationStatus').textContent,/finished/);assert.equal($('presentationSleepTimer').value,'0');
 await $('presentationBegin').onclick();assert.equal(recorder.phase,'playing');assert.equal(gains.at(-1),1);assert.equal($('presentationShell').style['--presentation-sleep-dim'],'0');
 $('presentationSleepTimer').value='30';$('presentationSleepTimer').listeners.change();presentation.exit();assert.equal(timers.size,0);assert.equal(gains.at(-1),1);presentation.enter(first,'landscape');assert.equal($('presentationSleepTimer').value,'0');presentation.exit();
}finally{Object.assign(globalThis,saved);}
console.log('PASS: Present sleep fades on its own audio-clock timer, cancels on canvas touch, survives track transitions, stops decks and auto-advance once, supports Listen again, and clears on exit/re-entry.');
