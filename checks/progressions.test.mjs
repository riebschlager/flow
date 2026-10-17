import assert from 'node:assert/strict';
import fs from 'node:fs';
import {progressions,progressionDetails,parseChord,pitchesForRange} from '../dist/music.js';
import {arpNotes,ArpEngine,normalizeArp} from '../dist/arpeggiator.js';
import {chordMood} from '../dist/chord-atmosphere.js';
assert.deepEqual(parseChord('Cmaj9'),[48,52,55,59,62]);assert.deepEqual(parseChord('Dm9'),[50,53,57,60,64]);assert.deepEqual(parseChord('G9'),[55,59,62,65,69]);assert.deepEqual(parseChord('Fm6'),[53,56,60,62]);assert.deepEqual(parseChord('C6'),[48,52,55,57]);assert.deepEqual(parseChord('Bbmaj9'),parseChord('A#maj9'));
for(const bad of ['Cmaj99','Cm69','Cdim9','G9junk','H9','F6/9'])assert.throws(()=>parseChord(bad));
assert.deepEqual(progressions.daydream,['Cmaj7','Am7','Fmaj7','G']);assert.equal(Object.keys(progressionDetails).length,8);assert.equal(Object.keys(progressions).length,12);
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
for(const [key,detail] of Object.entries(progressionDetails)){
 const chords=progressions[key];assert.equal(chords.length,4);assert(html.includes('value="'+key+'"'));assert(detail.text.length>20);assert([8,16].includes(detail.length));
 for(const chord of chords){const parsed=parseChord(chord),pool=arpNotes(chord,16),classes=new Set(parsed.map(n=>n%12)),range=pitchesForRange(chord,0,{down:3,up:3});assert.equal(pool.length,16);assert(pool.every((pitch,i)=>classes.has(pitch%12)&&(!i||pitch>pool[i-1])));assert(range.every(pitch=>pitch>=0&&pitch<=127));const mood=chordMood(chord);assert(Object.values(mood).flat().every(Number.isFinite));}
 // Run the actual scheduling path through two complete loops, with extended chord pools and portamento.
 const cfg=normalizeArp({enabled:true,glideEnabled:true,count:16,beats:.5}),calls=[],events=[];
 const clock={origin:.04,chordOrigin:0,bpm:60,rate:1,chordBeats:2,chords};
 const audio={playing:true,ctx:{currentTime:0,createGain:()=>({gain:{setTargetAtTime(){}},connect(){}})},bus:{},note:async(voice,pitch,expression,options)=>{calls.push({pitch,...options});}};
 const engine=new ArpEngine(audio,()=>cfg,()=>clock,event=>{if(event.type==='note')events.push(event);},{setTimer:()=>1,clearTimer(){}});engine.start();for(let i=1;i<=640;i++){audio.ctx.currentTime=i*.025;engine.tick();}
 assert(events.length>=32);for(const event of events){const expected=chords[Math.floor(event.time/2)%4];assert.equal(event.chord,expected);assert(arpNotes(expected,16).includes(event.pitch));}assert(calls.slice(1).every(note=>Number.isFinite(note.pitchGlide.from)));engine.stop();
}
console.log('PASS: all eight new loops, twelve retained presets, exact extended-chord pitches, enharmonics, rejection of malformed chords, UI options, full canvas ranges, sixteen-note arps, scene moods and two complete scheduled cycles per loop.');
