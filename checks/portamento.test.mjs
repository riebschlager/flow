import assert from 'node:assert/strict';
import {normalizeArp,arpGlide,ArpEngine} from '../public/arpeggiator.js';
const legacy=normalizeArp({voice:'newage',length:200});assert.equal(legacy.glideEnabled,false);assert.equal(legacy.glideTime,180);assert.equal(legacy.glideAmount,100);assert.equal(legacy.voice,'newage');
const invalid=normalizeArp({glideEnabled:'true',glideTime:9000,glideAmount:-4});assert.equal(invalid.glideEnabled,false);assert.equal(invalid.glideTime,2000);assert.equal(invalid.glideAmount,0);
for(const step of [.0375,.125,.5,2])for(const length of [10,85,400])for(const glideTime of [0,180,2000])for(const glideAmount of [0,40,100]){
 const glide=arpGlide({glideEnabled:true,length,glideTime,glideAmount},step);assert(glide.time>=0&&glide.time<Math.max(.02,Math.min(8,step*length/100)));assert.equal(glide.enabled,glideTime>0&&glideAmount>0);assert.equal(glide.amount,glideAmount/100);
}
const cfg=normalizeArp({enabled:true,glideEnabled:true,glideTime:180,glideAmount:100,count:4,beats:.5,length:200});
const clock={origin:0,chordOrigin:0,bpm:60,rate:1,chordBeats:2,chords:['Cmaj7','Am7']},scheduled=[],events=[];
const audio={playing:true,ctx:{currentTime:0,createGain:()=>({gain:{setTargetAtTime(){}},connect(){}})},bus:{},note:async(voice,pitch,expression,options)=>{scheduled.push({pitch,...options});}};
const engine=new ArpEngine(audio,()=>cfg,()=>clock,event=>events.push(event),{setTimer:()=>1,clearTimer(){}});engine.start();
const advance=time=>{audio.ctx.currentTime=time;engine.tick();};
advance(.4);assert.equal(scheduled[0].pitchGlide,null);advance(.9);assert.deepEqual(scheduled[1].pitchGlide,{from:48,time:.18,amount:1});assert.equal(scheduled[1].pitch,52);assert.equal(scheduled[1].when,1);
// Change pattern while E is queued: replace it with B, gliding from the sounding C.
cfg.pattern='down';engine.tick();assert.equal(scheduled[1].signal.aborted,true);assert.equal(scheduled[2].pitch,59);assert.equal(scheduled[2].pitchGlide.from,48);assert.equal(scheduled[2].when,1);
advance(1.1);const resets=events.filter(e=>e.type==='reset').length;cfg.glideAmount=25;cfg.glideTime=100;engine.tick();advance(1.4);assert.equal(scheduled.at(-1).pitch,55);assert.deepEqual(scheduled.at(-1).pitchGlide,{from:59,time:.1,amount:.25});assert.equal(events.filter(e=>e.type==='reset').length,resets);
advance(1.9);assert.equal(scheduled.at(-1).pitch,67);assert.equal(scheduled.at(-1).pitchGlide.from,55);assert.equal(scheduled.at(-1).when,2);
cfg.glideEnabled=false;advance(2.4);assert.equal(scheduled.at(-1).pitchGlide,null);
engine.stop();cfg.glideEnabled=true;engine.start();assert.equal(scheduled.at(-1).pitchGlide,null);advance(2.9);assert.equal(scheduled.at(-1).pitchGlide.from,67);engine.stop();
// An old overlapping tail must not replace the most recent short note in pitch history.
cfg.pattern='up';cfg.length=400;audio.ctx.currentTime=4;engine.start();advance(4.4);advance(4.6);cfg.length=10;advance(4.9);advance(5.1);advance(5.4);advance(5.6);advance(5.8);cfg.pattern='down';engine.tick();advance(5.9);assert.equal(scheduled.at(-1).pitchGlide.from,55);engine.stop();
console.log('PASS: portamento defaults/migration, 108 timing combinations, first-note bypass, exact onset/pitch order, live controls, chord-boundary carry, cancelled-note exclusion, disable and restart.');
