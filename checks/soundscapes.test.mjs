import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import {instruments,instrumentGroups,soundscapes,softEnvelope} from '../dist/music.js';
assert.equal(Object.keys(soundscapes).length,9);assert.equal(Object.keys(instruments).length,28);
const original={stillwater:['piano','vibes','strings','celesta'],glasshouse:['celesta','musicbox','vibes','bells'],nightgarden:['rhodes','pad','strings','vibes'],softhorizon:['pad','halo','slowstrings','choir'],breathingroom:['flute','panflute','oohs','sweeppad']};
for(const [key,voices] of Object.entries(original))assert.deepEqual(soundscapes[key].voices,voices);
const experimental=['glassorganisms','submergedcinema','strangeattractor','orbitalrelay'];const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
for(const key of experimental){const scape=soundscapes[key];assert.equal(scape.voices.length,4);assert(scape.voices.every(voice=>instruments[voice]));assert(scape.voices.some(voice=>instruments[voice].group==='Experimental textures'));assert(scape.reverb>=0&&scape.reverb<=100&&scape.delay>=0&&scape.delay<=100);assert(html.includes('value="'+key+'"'));}
const newVoices=Object.entries(instruments).filter(([,voice])=>voice.group==='Experimental textures');assert.equal(newVoices.length,8);assert(instrumentGroups.includes('Experimental textures'));
for(const [key,voice] of newVoices){
 const file=voice.file+'_FluidR3_GM_sf2_file',source=fs.readFileSync(new URL('../dist/vendor/'+file+'.js',import.meta.url),'utf8'),sandbox=vm.createContext({console:{log(){}}});vm.runInContext(source,sandbox);const preset=sandbox['_tone_'+file];assert(preset.zones.length>0,key);assert(preset.zones.every(zone=>typeof zone.file==='string'&&zone.file.length>100));
 const envelope=softEnvelope(voice);assert(envelope.every(stage=>stage.duration>=0&&stage.volume>=0&&stage.volume<=1));assert(Math.abs(envelope.reduce((sum,stage)=>sum+stage.duration,0)-voice.duration)<1e-8);assert(voice.attack>=.18);assert(['lowpass','bandpass'].includes(voice.tone.type));assert(voice.tone.from>=80&&voice.tone.to>=80&&voice.tone.time>0&&voice.tone.q<=1);
}
console.log('PASS: four new presets, eight valid bundled sample sets and envelopes, 28 selectable voices, nine soundscapes, valid sweep settings, and original voice assignments preserved.');
