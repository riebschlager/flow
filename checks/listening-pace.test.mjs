import assert from 'node:assert/strict';
import {DriftEngine} from '../public/drift.js';
const cadences={frequent:{idleSeconds:2,noteSeconds:2,density:1,energy:70},steady:{idleSeconds:2,noteSeconds:4,density:1,energy:70},unhurried:{idleSeconds:2,noteSeconds:6,density:1,energy:70},sparse:{idleSeconds:2,noteSeconds:9,density:1,energy:70}};
const seeded=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const isNote=e=>['tap','silk','bloom'].includes(e.kind);
const totals=[];
for(const [key,preset] of Object.entries(cadences)){
 let total=0,worst=0;
 for(let seed=1;seed<=30;seed++){
  let now=0;const notes=[];
  const engine=new DriftEngine({clock:()=>now,random:seeded(seed),emit:e=>{if(isNote(e))notes.push(e);}});
  engine.configure(preset);engine.listen();
  for(let step=0;step<=24000;step++){now=step/40;engine.service({energy:preset.energy/100});}
  assert(notes[0].time<=.525,`${key} begins promptly`);
  for(let i=1;i<notes.length;i++){
   const gap=notes[i].time-notes[i-1].time;worst=Math.max(worst,gap);
   assert(gap<=preset.noteSeconds*1.15+.051,`${key}: ${gap}s silence`);
  }
  assert(600-notes.at(-1).time<=preset.noteSeconds*1.15+.051);
  total+=notes.length;
 }
 totals.push(total);
 console.log(`${key}: ${(total/30).toFixed(1)} notes/10 min; longest gap ${worst.toFixed(2)} s`);
}
for(let i=1;i<totals.length;i++)assert(totals[i]<totals[i-1],'Longer note intervals slow the music');
let now=0;const notes=[];const engine=new DriftEngine({clock:()=>now,random:seeded(3),emit:e=>{if(isNote(e))notes.push(e);}});
engine.configure(cadences.sparse);engine.listen();
for(let i=0;i<=400;i++){now=i/40;engine.service({energy:.1});}
const began=engine.started;engine.configure(cadences.frequent);assert.equal(engine.started,began,'Pace change keeps performer running');
const count=notes.length;for(let i=1;i<=120;i++){now=10+i/40;engine.service();}assert(notes.length>count,'Faster pace takes effect within its next interval');
engine.input();const stopped=notes.length;for(let i=1;i<80;i++){now=13+i/40;engine.service();}assert.equal(notes.length,stopped,'Real input yields to the player');
engine.listen();engine.service();now+=.5;engine.service();assert(notes.length>stopped,'Explicit listening resumes immediately');
const before=notes.length;for(let i=1;i<=400;i++){now+=.025;engine.service({noteEnabled:false});}assert.equal(notes.slice(before).filter(e=>e.kind!=='bloom').length,0,'Auto-pour owns the regular notes without a duplicate scheduler');
for(const style of ['calm','478','box']){
 let now=0,notes=0;const breath=new DriftEngine({clock:()=>now,emit:e=>{if(isNote(e))notes++;}});breath.configure({...cadences.sparse,style});breath.listen();
 for(let i=0;i<2400;i++){now=i/40;breath.service({energy:.1});}
 assert(notes>0,`Sleep remains audible with ${style} breathing`);
}
console.log('PASS: prompt start, 30-seed note cadence and silence bounds, uninterrupted pace changes, deliberate yielding, auto-pour ownership and low-energy breathing.');
