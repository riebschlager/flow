import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PresentationAutoAdvance} from '../public/presentation-auto.js';

let now=0,ready=true,calls=0,callback,cleared=0;
const auto=new PresentationAutoAdvance({now:()=>now,ready:()=>ready,advance:()=>{calls++;},setTimer:fn=>{callback=fn;return 1;},clearTimer:()=>{cleared++;callback=null;}});
assert.equal(auto.enabled,false);assert.equal(callback,undefined);assert.equal(auto.deadline,null);
auto.setEnabled(true);assert.equal(auto.deadline,180);now=179;await callback();assert.equal(calls,0);
now=180;await callback();assert.equal(calls,1);await callback();assert.equal(calls,1,'one transition, even with late repeated ticks');
auto.reset();now=360;ready=false;await callback();assert.equal(calls,1,'loading and active transitions cannot overlap');
ready=true;now=900;await callback();assert.equal(calls,2,'background recovery advances once, without a backlog');
auto.setDuration(30);assert.equal(auto.deadline,930);now=929;await callback();assert.equal(calls,2);
auto.reset();assert.equal(auto.deadline,959,'manual skip restarts the duration');
for(const invalid of [0,-1,NaN,Infinity,3601])assert.equal(auto.setDuration(invalid),30);
auto.setEnabled(false);assert.equal(auto.deadline,null);assert.equal(callback,null);assert(cleared>0);
const failing=new PresentationAutoAdvance({now:()=>now,ready:()=>true,advance:()=>{throw Error('offline');},setTimer:()=>1,clearTimer:()=>{}});
failing.setEnabled(true);now+=180;await failing.tick();assert.equal(failing.enabled,false,'failed automatic advancement stops the timer');

// Exercise the actual controls and shared Next-track path, with an audio clock.
const elements=new Map();
const classList={add(){},remove(){}};
function element(id){return {id,hidden:false,disabled:false,checked:false,value:'3',style:{setProperty(){}},dataset:{},parentNode:{style:{},insertBefore(){}},listeners:{},classList,
 addEventListener(type,fn){this.listeners[type]=fn;},append(){},prepend(){},getAttribute(){return null;},setAttribute(){},removeAttribute(){},contains(){return false;}};}
for(const match of fs.readFileSync(new URL('../app/instrument.html',import.meta.url),'utf8').matchAll(/\bid="([^"]+)"/g))elements.set(match[1],element(match[1]));
const $=id=>elements.get(id);
globalThis.document={getElementById:$,body:{classList},documentElement:{classList},addEventListener(){},activeElement:null};
globalThis.location={pathname:'/recordings/first',search:''};globalThis.history={pushState(){},replaceState(){}};
let uiClock=0,uiTimer=null,transitions=0;
const savedTimers={setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
try{
 globalThis.setInterval=fn=>{uiTimer=fn;return 1;};globalThis.clearInterval=()=>uiTimer=null;
 globalThis.setTimeout=()=>1;globalThis.clearTimeout=()=>{};
 const {createPresentationController}=await import('../public/presentation.js');
 const recorder={phase:'playing',get presentationTime(){return uiClock;},async prepareExternal(){},async playExternal(){},async transitionExternal(take,options){transitions++;options.onProgress(.5);options.onMidpoint();options.onProgress(1);return true;}};
 const presentation=createPresentationController(recorder),first={name:'First',communityId:'first'},second={name:'Second',communityId:'second'};
 presentation.enter(first,'landscape');await presentation.play(first);
 let next=[second];presentation.setQueue({warm:async()=>next[0]||null,next:async()=>next.shift(),close(){}});await Promise.resolve();
 assert.equal($('presentationAutoAdvance').checked,false);assert.equal(uiTimer,null);assert.equal($('presentationAutoDurationLabel').hidden,true);
 $('presentationAutoAdvance').checked=true;$('presentationAutoAdvance').listeners.change();assert.equal(typeof uiTimer,'function');$('presentationAutoDuration').value='';$('presentationAutoDuration').listeners.input();$('presentationAutoDuration').listeners.change();assert.equal($('presentationAutoDuration').value,'3');assert.equal($('presentationAutoDurationLabel').hidden,false);
 $('presentationAutoDuration').value='.25';$('presentationAutoDuration').listeners.input();uiClock=14;await uiTimer();assert.equal(transitions,0);
 uiClock=15;await uiTimer();await Promise.resolve();assert.equal(transitions,1);assert.equal($('presentationTitle').textContent,'Second');
 assert.equal($('presentationAutoAdvance').checked,false,'exhaustion switches auto-advance off');assert.equal(uiTimer,null);
 next=[second];presentation.setQueue({warm:async()=>second,next:async()=>second,close(){}});
 $('presentationAutoAdvance').checked=true;$('presentationAutoAdvance').listeners.change();presentation.exit();assert.equal(uiTimer,null);
 presentation.enter(first,'portrait');assert.equal($('presentationAutoAdvance').checked,false,'each new presentation starts off');assert.equal($('presentationAutoDuration').value,'3');presentation.exit();
}finally{Object.assign(globalThis,savedTimers);}
console.log('PASS: off-by-default toggle, editable duration, audio-clock deadlines, manual reset, no overlapping/catch-up skips, failure/exhaustion shutdown, UI handoff and exit/re-entry cleanup.');
