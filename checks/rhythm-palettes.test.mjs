import assert from 'node:assert/strict';
import {drumVoices,drumKits,grooves,grooveDetails,groovePattern,defaultRhythm,normalizeRhythm,applyDrumKit,percussionPitch,RhythmEngine} from '../public/rhythm.js';
import {parseChord,progressions} from '../public/music.js';
assert.equal(Object.keys(drumVoices).length,20);assert.equal(Object.keys(drumKits).length,8);assert.equal(Object.keys(grooves).length,13);assert.equal(Object.keys(grooveDetails).length,8);
const source=defaultRhythm();source.lanes[1].muted=true;source.lanes[2].rotation=4;source.reverb=67;source.delay=80;source.delayBeats=.5;source.rate=2;
for(const [key,kit] of Object.entries(drumKits)){
 const cfg=applyDrumKit(source,key),restored=normalizeRhythm(JSON.parse(JSON.stringify(cfg)));assert.equal(restored.kit,key);assert.deepEqual(restored,cfg);assert.equal(cfg.preset,source.preset);assert.equal(cfg.rate,2);assert.equal(cfg.reverb,67);assert.equal(cfg.delay,80);assert.equal(cfg.delayBeats,.5);assert.equal(cfg.lanes[1].muted,true);assert.equal(cfg.lanes[2].rotation,4);assert.deepEqual(cfg.lanes.map(l=>l.steps),source.lanes.map(l=>l.steps));assert(kit.voices.every(v=>drumVoices[v]));assert(grooves[kit.groove]);
 cfg.lanes[0].voice='off';assert.equal(normalizeRhythm(cfg).kit,'custom');
}
assert.equal(source.lanes[0].voice,'kick');const legacy=JSON.parse(JSON.stringify(source));delete legacy.kit;assert.deepEqual(normalizeRhythm(legacy).lanes,source.lanes);assert.equal(normalizeRhythm({...source,kit:'__proto__'}).kit,'custom');
const signatures=new Set();for(const key of Object.keys(grooves)){const p=groovePattern(key);assert(p.every(row=>row.length===16&&row.some(Boolean)&&row.every(v=>v>=0&&v<=1)));signatures.add(JSON.stringify(p));}assert.equal(signatures.size,13);assert(groovePattern('pocket').flat().some(v=>v>0&&v<.5));
for(const chord of new Set(Object.values(progressions).flat()))for(const [key,voice] of Object.entries(drumVoices)){
 const pitch=percussionPitch(key,chord);if(voice.degree===undefined)assert.equal(pitch,null);else{assert(pitch>=12&&pitch<=108);assert(parseChord(chord).some(n=>n%12===pitch%12));}
}
// Harmonic percussion uses the chord at scheduled hit time, including lookahead across a boundary.
let cfg=applyDrumKit(defaultRhythm(),'rainobjects');cfg.enabled=true;cfg.swing=0;cfg.humanize=0;cfg.lanes.forEach(l=>{l.steps=Array(16).fill(1);l.level=100;});
const audio={ctx:{currentTime:0},playing:true,bpm:60},calls=[],events=[];const engine=new RhythmEngine(audio,()=>cfg,e=>events.push(e),{setTimer:()=>1,clearTimer(){},getChordAt:time=>time<1?'Cmaj9':'Fm6'});
engine.synth={connect(){},setLevel(){},setEffects(){},stop(){},hit:(voice,time,velocity,options)=>calls.push({voice,time,velocity,...options})};engine.start();for(let i=1;i<=80;i++){audio.ctx.currentTime=i*.025;engine.tick();}
assert(calls.some(call=>call.time<1));assert(calls.some(call=>call.time>1));for(const call of calls)assert.equal(call.pitch,percussionPitch(call.voice,call.time<1?'Cmaj9':'Fm6'));assert(events.filter(e=>e.type==='hit').every(e=>e.motion===drumVoices[e.voice].motion));
const origin=engine.origin,next=engine.nextStep;cfg=applyDrumKit(cfg,'velvetroom');engine.tick();assert.equal(engine.origin,origin);assert.equal(engine.nextStep,next);engine.stop();
console.log('PASS: distinct grooves, kit migration/cloning/custom detection, independent patterns/effects/mutes, all tuned voices in all preset chords, future-chord pitch selection, visual motion metadata and unchanged rhythm phase on kit swaps.');
