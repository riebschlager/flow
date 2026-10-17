import assert from 'node:assert/strict';
import {normalizeArp,arpEnvelope,ArpEngine} from '../public/arpeggiator.js';
const migrated=normalizeArp({voice:'newage',count:12,beats:.25});assert.equal(migrated.length,85);assert.equal(migrated.attack,20);assert.equal(migrated.decay,120);assert.equal(migrated.sustain,65);assert.equal(migrated.voice,'newage');
const invalid=normalizeArp({length:999,attack:-3,decay:'bad',sustain:200});assert.equal(invalid.length,400);assert.equal(invalid.attack,0);assert.equal(invalid.decay,120);assert.equal(invalid.sustain,100);
let cases=0;
for(const bpm of [30,56,100])for(const rate of [.5,1,2])for(const beats of [4,2,1,.5,.25,.125,1/3])for(const length of [10,85,200,400])for(const attack of [0,20,500,2000])for(const decay of [0,120,500,2000])for(const sustain of [0,65,100]){
 const shape=arpEnvelope({length,attack,decay,sustain},60/bpm/rate*beats),sum=shape.envelope.reduce((n,stage)=>n+stage.duration,0);
 assert(shape.duration>=.02&&shape.duration<=8);assert(Math.abs(sum-shape.duration)<1e-9);assert(shape.envelope.every(stage=>Number.isFinite(stage.duration)&&stage.duration>=0&&stage.volume>=0&&stage.volume<=1));assert.equal(shape.envelope[0].volume,0);assert.equal(shape.envelope.at(-1).volume,0);assert.equal(shape.envelope[2].volume,sustain/100);assert.equal(shape.envelope[3].volume,sustain/100);cases++;
}
const fitted=arpEnvelope({length:100,attack:2000,decay:2000},.2);assert(fitted.fitted);assert(Math.abs(fitted.attack-.08)<1e-9);assert(Math.abs(fitted.decay-.08)<1e-9);assert.equal(arpEnvelope({length:400},.5).duration,2);
// Shape edits alter future notes without restarting the pattern or shifting its grid.
const scheduled=[],events=[];let timer;
const cfg=normalizeArp({enabled:true,count:4,beats:.5}),clock={origin:0,chordOrigin:0,bpm:60,rate:1,chordBeats:16,chords:['Cmaj7']};
const audio={playing:true,ctx:{currentTime:0,createGain:()=>({gain:{setTargetAtTime(){}},connect(){}})},bus:{},note:async(voice,pitch,expression,options)=>{scheduled.push({pitch,...options});}};
const engine=new ArpEngine(audio,()=>cfg,()=>clock,event=>events.push(event),{setTimer:fn=>{timer=fn;return 1;},clearTimer(){}});engine.start();
for(let i=1;i<=21;i++){audio.ctx.currentTime=i*.025;timer();await Promise.resolve();}assert.equal(scheduled[0].pitch,48);
const resets=events.filter(event=>event.type==='reset').length;Object.assign(cfg,{length:200,attack:50,decay:100,sustain:20});engine.tick();
for(let i=22;i<=43;i++){audio.ctx.currentTime=i*.025;timer();await Promise.resolve();}
assert.equal(events.filter(event=>event.type==='reset').length,resets);assert.equal(scheduled[1].pitch,52);assert.equal(scheduled[1].when,1);assert.equal(scheduled[1].noteLength,1);assert.equal(scheduled[1].noteEnvelope[3].volume,.2);engine.stop();
console.log(`PASS: ${cases} envelope combinations, legacy settings migration, fitted timing, silence/peak endpoints, overlap length, and live shape edits preserving pitch order and onset timing.`);
