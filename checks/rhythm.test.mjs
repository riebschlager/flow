import assert from 'node:assert/strict';
import {euclidean,rotatePattern,groovePattern,grooves,varyPattern,normalizeRhythm,defaultRhythm,stepTime,RhythmEngine,PercussionSynth,drumVoices} from '../dist/rhythm.js';
import {Fluid} from '../dist/fluid.js';
for(let hits=0;hits<=16;hits++)for(let rotation=0;rotation<16;rotation++){
 const pattern=euclidean(hits,rotation);assert.equal(pattern.length,16);assert.equal(pattern.filter(Boolean).length,hits);assert(pattern.every(v=>v>=0&&v<=1));assert.deepEqual(rotatePattern(pattern,16),pattern);
}
for(const key of Object.keys(grooves)){const p=groovePattern(key);assert.equal(p.length,4);assert(p.every(row=>row.length===16&&row.some(Boolean)));}
assert(varyPattern(Array(16).fill(0),()=>.5).some(Boolean));
const corrupt=normalizeRhythm({enabled:1,rate:20,visual:-4,swing:99,preset:'__proto__',lanes:[{voice:'__proto__',level:-9,rotation:80,steps:Array(16).fill('bad')}]});
assert.equal(corrupt.enabled,false);assert.equal(corrupt.rate,1);assert.equal(corrupt.swing,60);assert.equal(corrupt.visual,0);assert.equal(corrupt.preset,'ocean');assert.equal(corrupt.lanes.length,4);assert.equal(corrupt.lanes[0].voice,'kick');assert(corrupt.lanes[0].steps.every(v=>v===0));
const cfg=defaultRhythm();cfg.enabled=true;cfg.swing=0;cfg.humanize=0;cfg.lanes.forEach(l=>{l.steps=Array(16).fill(1);l.level=100;});
const audio={ctx:{currentTime:0},bpm:120,playing:true};let events=[],hits=[],timerFn,cleared=0;
const engine=new RhythmEngine(audio,()=>cfg,e=>events.push(e),{setTimer:fn=>{timerFn=fn;return 1;},clearTimer:()=>cleared++,random:()=>.5});
engine.synth={connect(){},setLevel(){},stop(){},hit:(voice,time,velocity)=>hits.push({voice,time,velocity})};engine.start();
for(let i=1;i<80;i++){audio.ctx.currentTime=i*.025;timerFn();}
const firstBar=events.filter(e=>e.type==='step'&&e.time<2.04-1e-5);assert.equal(firstBar.length,16);assert.deepEqual(firstBar.map(e=>e.step),Array.from({length:16},(_,i)=>i));assert.equal(hits.filter(e=>e.time<2.04-1e-5).length,64);
for(let i=1;i<firstBar.length;i++)assert(Math.abs(firstBar[i].time-firstBar[i-1].time-.125)<1e-9);
assert.equal(stepTime(16,120,1,60),2);assert(stepTime(1,120,1,60)>.125);assert.equal(stepTime(2,120,1,60),.25);
// Missing long stretches of time skips stale hits instead of playing a burst.
events=[];hits=[];audio.ctx.currentTime=40;timerFn();assert(events.filter(e=>e.type==='step').length<=2);assert(hits.every(e=>e.time>=40));
// Empty slots, muted voices, and zero lane levels are silent.
cfg.lanes[0].muted=true;cfg.lanes[1].voice='off';cfg.lanes[2].level=0;hits=[];audio.ctx.currentTime=42;engine.start(84);assert(hits.length>0);assert(hits.every(h=>h.voice==='shaker'));
// Disabled percussion and a paused scene both stop the clock and future audio.
cfg.enabled=false;const hitCount=hits.length;timerFn();assert.equal(hits.length,hitCount);assert.equal(engine.timer,null);cfg.enabled=true;audio.playing=false;engine.start();assert.equal(engine.timer,null);assert(cleared>0);
// Exercise all synthesis branches with real scheduling arguments and mock AudioNodes.
const params=[],sources=[];function param(){const events=[];const p={value:0,events,setValueAtTime(v,t){assert(Number.isFinite(v)&&Number.isFinite(t));events.push([v,t]);},linearRampToValueAtTime(v,t){assert(Number.isFinite(v)&&Number.isFinite(t));events.push([v,t]);},exponentialRampToValueAtTime(v,t){assert(v>0&&Number.isFinite(t));events.push([v,t]);},setTargetAtTime(v,t,c){assert(Number.isFinite(v)&&Number.isFinite(t)&&c>0);events.push([v,t]);}};params.push(p);return p;}
function node(){return {gain:param(),frequency:param(),Q:{value:0},connect(){},disconnect(){}};}
function source(){const n={...node(),start(t){assert(t>=0);},stop(t){if(t!==undefined)assert(Number.isFinite(t)&&t>=0);}};sources.push(n);return n;}
const synthAudio={ctx:{currentTime:0,sampleRate:1000,createGain:node,createBiquadFilter:node,createOscillator:source,createBufferSource:source,createBuffer:()=>({getChannelData:()=>new Float32Array(1000)})},limiter:node(),verb:node()};
const synth=new PercussionSynth(synthAudio);synth.connect();synth.setLevel(55);for(const key of Object.keys(drumVoices))synth.hit(key,.2,.7);assert(sources.length>=10);for(const p of params)for(let i=1;i<p.events.length;i++)assert(p.events[i][1]>=p.events[i-1][1]);synth.stop();assert.equal(synth.sources.size,0);
// Percussion moves existing dye; it must not inject colors or trigger melodic notes.
const f=new Fluid(72,48);f.splat(.5,.5,[.3,.4,.6],.05,0,0);const dye=[f.r.slice(),f.g.slice(),f.b.slice()];f.pulse(.45,.55,.8,.1,-1);assert.deepEqual(f.r,dye[0]);assert.deepEqual(f.g,dye[1]);assert.deepEqual(f.b,dye[2]);assert(f.u.some(v=>Math.abs(v)>1));
for(let i=0;i<180;i++){if(i%5===0)f.pulse(.25+(i%4)*.15,.5,.6,.07,i%2?-1:1);f.step(1/30);}assert([...f.u,...f.v,...f.r,...f.g,...f.b].every(Number.isFinite));
console.log('PASS: 272 Euclidean patterns, five grooves, restore validation, audio-clock scheduling, swing, stall recovery, silent/muted lanes, stop, all ten synth voices, and fluid stability without dye injection.');
// Browser host timers require Window as their receiver. Test the default path,
// not just the dependency-injected scheduler used by the timing tests above.
const nativeSet=globalThis.setInterval,nativeClear=globalThis.clearInterval;
let browserCallback,timerStarts=0,timerClears=0;
try{
 globalThis.setInterval=function(callback,delay){assert.equal(this,globalThis,'setInterval must be called on the global host');assert.equal(delay,25);browserCallback=callback;timerStarts++;return 73;};
 globalThis.clearInterval=function(id){assert.equal(this,globalThis,'clearInterval must be called on the global host');assert.equal(id,73);timerClears++;};
 const browserConfig=defaultRhythm();browserConfig.enabled=true;const browserAudio={ctx:{currentTime:0},bpm:56,playing:true};const actual=[];const browserEngine=new RhythmEngine(browserAudio,()=>browserConfig,event=>actual.push(event));
 browserEngine.synth={connect(){},setLevel(){},stop(){},hit(){}};
 browserEngine.start();assert.equal(timerStarts,1);for(let i=1;i<=200;i++){browserAudio.ctx.currentTime=i*.025;browserCallback();}assert(actual.filter(e=>e.type==='hit').length>10);browserEngine.stop();assert.equal(timerClears,1);assert.equal(browserEngine.timer,null);
 console.log('PASS: default browser-host timer binding, continuous drum scheduling, and clean stop.');
}finally{globalThis.setInterval=nativeSet;globalThis.clearInterval=nativeClear;}
