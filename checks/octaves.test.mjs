import assert from 'node:assert/strict';
import {normalizeOctaveRange,pitchesForRange,pitchForPosition,parseChord,progressions} from '../public/music.js';
assert.deepEqual(normalizeOctaveRange(),{down:0,up:1});
assert.deepEqual(normalizeOctaveRange({down:-9,up:99}),{down:0,up:3});
assert.deepEqual(normalizeOctaveRange({down:'bad',up:NaN}),{down:0,up:1});
assert.deepEqual(pitchesForRange('Cmaj7'),[48,52,55,59,60,64,67,71]);
assert.deepEqual(pitchesForRange('C',0,{down:0,up:0}),parseChord('C'));
assert.equal(pitchForPosition('C',0,0,{down:2,up:3}),24);
assert.equal(pitchForPosition('C',1,0,{down:2,up:3}),91);
assert.equal(pitchForPosition('C',0,2,{down:3,up:3}),0);
assert.equal(pitchForPosition('C',-2),48);assert.equal(pitchForPosition('C',2),67);
const chords=[...new Set([...Object.values(progressions).flat(),'Cadd9','Badd9','F#sus2','Bbsus4','Cb7'])];let cases=0;
for(const chord of chords)for(let down=0;down<=3;down++)for(let up=0;up<=3;up++)for(let voice=0;voice<4;voice++){
 const notes=pitchesForRange(chord,voice,{down,up}),pitchClasses=new Set(parseChord(chord).map(n=>n%12));
 assert(notes.length>=3);assert.equal(new Set(notes).size,notes.length);assert(notes.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=127&&pitchClasses.has(n%12)&&(i===0||n>notes[i-1])));
 let previous=-1;for(let i=0;i<=100;i++){const n=pitchForPosition(chord,i/100,voice,{down,up});assert(n>=previous);assert(notes.includes(n));previous=n;}
 assert.equal(pitchForPosition(chord,0,voice,{down,up}),notes[0]);assert.equal(pitchForPosition(chord,1,voice,{down,up}),notes.at(-1));cases++;
}
console.log(`PASS: ${cases} chord/voice/octave combinations retain chord tones, valid MIDI pitches, monotonic left-to-right mapping, exact endpoints, base-only mode, default voicing, and bounded settings.`);
