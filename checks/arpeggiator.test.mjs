import assert from 'node:assert/strict';
import {normalizeArp,arpNotes,patternOrder,ArpPattern,ArpEngine} from '../dist/arpeggiator.js';
import {parseChord} from '../dist/music.js';
const invalid=normalizeArp({voice:'__proto__',pattern:'__proto__',count:200,beats:9,volume:-3});assert.equal(invalid.voice,'vibes');assert.equal(invalid.pattern,'up');assert.equal(invalid.count,16);assert.equal(invalid.beats,.5);assert.equal(invalid.volume,0);assert.equal(normalizeArp(null).enabled,false);
for(const chord of ['C','B','Cmaj7','Am7','Badd9','F#sus2'])for(let count=1;count<=16;count++){
 const pool=arpNotes(chord,count),classes=new Set(parseChord(chord).map(p=>p%12));assert.equal(pool.length,count);assert.equal(new Set(pool).size,count);assert(pool.every((p,i)=>p>=0&&p<=127&&classes.has(p%12)&&(i===0||p>pool[i-1])));
}
assert.deepEqual(patternOrder(4,'bounce'),[0,1,2,3,2,1]);assert.deepEqual(patternOrder(4,'reverse'),[3,2,1,0,1,2]);assert.deepEqual(patternOrder(5,'outside'),[0,4,1,3,2]);
for(const random of [()=>0,()=>.99999,Math.random])for(let count=1;count<=16;count++){
 const pattern=new ArpPattern(random),result=Array.from({length:count*20},()=>pattern.next(count,'random'));
 for(let i=0;i<result.length;i+=count)assert.equal(new Set(result.slice(i,i+count)).size,count);
 if(count>1)for(let i=1;i<result.length;i++)assert.notEqual(result[i],result[i-1]);
}
let callback,clears=0;const scheduled=[],events=[],gainEvents=[];const audio={playing:true,ctx:{currentTime:0,createGain(){return {gain:{value:0,setTargetAtTime(value,time){gainEvents.push({value,time});}},connect(){}};}},bus:{},note:async(voice,pitch,expression,options)=>{const note={voice,pitch,...options};scheduled.push(note);return {cancel(){note.stopped=true;},audioBufferSourceNode:{stop(){note.stopped=true;}}};}};
const cfg=normalizeArp({enabled:true,count:4,beats:.5}),clock={origin:.04,chordOrigin:0,bpm:60,rate:1,chordBeats:2,chords:['Cmaj7','Am7','Fmaj7','G']};
const engine=new ArpEngine(audio,()=>cfg,()=>clock,event=>events.push(event),{setTimer(fn,ms){assert.equal(ms,25);callback=fn;return 73;},clearTimer(id){assert.equal(id,73);clears++;}});
engine.start();for(let i=1;i<=170;i++){audio.ctx.currentTime=i*.025;callback();await Promise.resolve();}
const noteEvents=events.filter(event=>event.type==='note');assert(noteEvents.length>=8);for(const event of noteEvents){const step=(event.time-clock.origin)/.5;assert(Math.abs(step-Math.round(step))<1e-8);const chord=clock.chords[Math.floor(event.time/2)%4];assert.equal(event.chord,chord);assert(parseChord(chord).includes(event.pitch));}
assert.deepEqual(noteEvents.filter(event=>event.chord==='Cmaj7').slice(0,4).map(event=>event.pitch),[48,52,55,59]);assert.equal(noteEvents.find(event=>event.chord==='Am7').pitch,57);
// Changing rate/pattern cancels future notes and uses the same shared origin.
const pending=scheduled.filter(note=>note.when>audio.ctx.currentTime);clock.rate=2;cfg.pattern='down';engine.tick();assert(pending.every(note=>note.signal.aborted));for(let i=0;i<30;i++){audio.ctx.currentTime+=.025;callback();await Promise.resolve();}const last=scheduled.at(-1);assert(Math.abs((last.when-clock.origin)/.25-Math.round((last.when-clock.origin)/.25))<1e-8);assert(last.noteLength<=.25);assert.equal(last.target,engine.bus);
cfg.volume=0;engine.tick();assert.equal(gainEvents.at(-1).value,0);
const countBefore=scheduled.length;audio.ctx.currentTime=100;engine.tick();assert(scheduled.length-countBefore<=1);assert(scheduled.slice(countBefore).every(note=>note.when>100));
engine.stop();assert.equal(engine.timer,null);assert(clears>0);assert.equal(gainEvents.at(-1).value,0);assert(scheduled.filter(note=>note.when>100).every(note=>note.signal.aborted));
console.log('PASS: 96 chord/count pools, all ordered patterns, random bags without adjacent repeats, future-chord pitch selection, exact clock alignment, rate/pattern edits, own mix bus, bounded note length, stall recovery, and clean stop.');
// Audio failures stop the scheduler and surface one recoverable error.
let failure=null;const badAudio={...audio,ctx:{...audio.ctx,currentTime:0},note:async()=>{throw new Error('Sample unavailable');}};cfg.enabled=true;const broken=new ArpEngine(badAudio,()=>cfg,()=>({...clock,origin:0,chordOrigin:0}),()=>{},{setTimer:()=>9,clearTimer:()=>{},onError:error=>failure=error});broken.start();badAudio.ctx.currentTime=.2;broken.tick();for(let i=0;i<6;i++)await Promise.resolve();assert.equal(broken.timer,null);assert.match(failure.message,/Sample unavailable/);
console.log('PASS: an asynchronous voice failure stops arpeggio scheduling and reports an actionable error.');
