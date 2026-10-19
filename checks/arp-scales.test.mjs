import assert from 'node:assert/strict';
import {arpNotes,arpScales,arpRoots,normalizeArp,ArpEngine} from '../public/arpeggiator.js';
import {sanitizeSnapshot,mainDefaults} from '../public/recording-state.js';
const legacy=normalizeArp({enabled:true});assert.equal(legacy.source,'chord');assert.equal(legacy.restart,true);
assert.equal(normalizeArp({source:'__proto__',scale:'__proto__',root:99}).source,'chord');
assert.equal(normalizeArp({scale:'__proto__',root:1.5}).scale,'major');assert.equal(normalizeArp({root:1.5}).root,0);
assert.deepEqual(arpNotes('Cmaj7',8,{source:'scale',root:2,scale:'dorian'}),[50,52,53,55,57,59,60,62]);
assert.deepEqual(arpNotes('G',8,{source:'scale',root:0,scale:'minorPentatonic'}),[48,51,53,55,58,60,63,65]);
for(let root=0;root<arpRoots.length;root++)for(const scale of Object.keys(arpScales))for(let count=1;count<=16;count++){
 const cfg={source:'scale',root,scale},pool=arpNotes('Cmaj7',count,cfg);
 assert.equal(pool.length,count);assert.deepEqual(pool,arpNotes('F#m7',count,cfg));
 assert(pool.every((pitch,i)=>pitch<=127&&arpScales[scale].intervals.includes((pitch-root+120)%12)&&(i===0||pitch>pool[i-1])));
}
const snapshot={main:{settings:mainDefaults,voices:['piano','vibes','strings','celesta'],custom:['Cmaj7','Am7','Fmaj7','G'],bpm:56,selected:0},arp:{enabled:true,source:'scale',root:2,scale:'dorian',restart:false}};
assert.deepEqual(sanitizeSnapshot(JSON.parse(JSON.stringify(sanitizeSnapshot(snapshot)))).arp,normalizeArp(snapshot.arp));
assert.equal(sanitizeSnapshot({...snapshot,arp:{enabled:true}}).arp.source,'chord');
function harness(restart){
 const config=normalizeArp({enabled:true,source:'scale',root:2,scale:'dorian',count:7,beats:.5,restart}),events=[],calls=[];
 const audio={playing:true,ctx:{currentTime:0,createGain:()=>({gain:{setTargetAtTime(){}},connect(){}})},bus:{},note:async(voice,pitch,expression,options)=>calls.push({pitch,...options})};
 const clock={origin:.04,chordOrigin:0,bpm:60,rate:1,chordBeats:2,chords:['Cmaj7','Abmaj9']};
 const engine=new ArpEngine(audio,()=>config,()=>clock,e=>{if(e.type==='note')events.push(e);},{setTimer:()=>1,clearTimer(){}});engine.start();
 const advance=until=>{while(audio.ctx.currentTime<until-.0001){audio.ctx.currentTime+=.025;engine.tick();}};
 return {config,events,calls,audio,engine,advance};
}
for(const restart of [true,false]){
 const h=harness(restart);h.advance(4.7);
 assert.deepEqual(h.events.slice(0,9).map(e=>e.index),restart?[0,1,2,3,0,1,2,3,0]:[0,1,2,3,4,5,6,0,1]);
 assert(h.events.every(e=>arpNotes(e.chord,7,h.config).includes(e.pitch)));
 assert(h.events.every(e=>Math.abs((e.time-.04)/.5-Math.round((e.time-.04)/.5))<1e-8));
 const pending=h.calls.filter(n=>n.when>h.audio.ctx.currentTime);h.config.root=7;h.config.scale='minorPentatonic';h.engine.tick();assert(pending.every(n=>n.signal.aborted));
 const before=h.events.length;h.advance(5.7);assert(h.events.slice(before).every(e=>arpNotes(e.chord,7,h.config).includes(e.pitch)));
 h.engine.stop();
}
console.log('PASS: all 1,344 scale/root/count pools, fixed pitch pools across harmony, D Dorian and C minor pentatonic, legacy defaults, sanitized save/restore, chord restart and continuous phase, shared clock, live root/scale edits and cancellation.');
