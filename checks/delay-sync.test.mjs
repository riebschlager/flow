import fs from 'node:fs';
import assert from 'node:assert/strict';
import {AmbientAudio} from '../public/music.js';
import {PercussionSynth,stepTime,normalizeRhythm} from '../public/rhythm.js';
import {delaySeconds,delayGlide,echoDivisions,maxDelaySeconds,echoLabel} from '../public/timing.js';
function parameter(){return {events:[],setTargetAtTime(value,time,glide){this.events.push({value,time,glide});}};}
const audio=new AmbientAudio();audio.ctx={currentTime:12};audio.echo={delayTime:parameter()};audio.gestureEcho={delayTime:parameter()};const synth=new PercussionSynth(audio);synth.bus={};synth.room={gain:parameter()};synth.echoWet={gain:parameter()};synth.echo={delayTime:parameter()};
for(const bpm of [30,56,100])for(const rate of [.5,1,2])for(const {beats:delayBeats} of echoDivisions){
 audio.bpm=bpm;audio.setRhythmTiming({rate,delayBeats});synth.setEffects({delayBeats,rate,reverb:10,delay:50},bpm);const voice=audio.echo.delayTime.events.at(-1),drum=synth.echo.delayTime.events.at(-1);assert.equal(voice.value,drum.value);assert.equal(audio.gestureEcho.delayTime.events.at(-1).value,voice.value);assert.equal(voice.value,delaySeconds(bpm,rate,delayBeats));assert.equal(voice.glide,delayGlide);assert.equal(drum.glide,delayGlide);const expected=stepTime(delayBeats*4,bpm,rate,0);assert(Math.abs(voice.value-expected)<1e-10);assert(voice.value<=maxDelaySeconds);assert.equal(normalizeRhythm({delayBeats}).delayBeats,delayBeats);assert.equal(normalizeRhythm(JSON.parse(JSON.stringify({delayBeats}))).delayBeats,delayBeats);
}
const previous=audio.echo.delayTime.events.length;audio.syncDelayTime();assert.equal(audio.echo.delayTime.events.length,previous);assert.equal(audio.delay,.35);assert.equal(synth.echoWet.gain.events.at(-1).value,.35);
assert.equal(delaySeconds(30,.5,1),4);assert.equal(delaySeconds(100,2,.5),.15);assert.equal(delaySeconds(30,.5,8),32);assert.equal(delaySeconds(100,2,.0625),.01875);assert.match(echoLabel(30,.5,8),/32 s/);assert.match(echoLabel(100,2,.0625),/19 ms/);
for(const bad of [-1,0,Infinity,'bad',9])assert.equal(normalizeRhythm({delayBeats:bad}).delayBeats,.75);
const html=fs.readFileSync(new URL('../app/instrument.html',import.meta.url),'utf8');
for(const id of ['voiceDelayBeats','studioDelayBeats']){const select=html.match(new RegExp('<select id="'+id+'">([\\s\\S]*?)</select>'))[1];assert.deepEqual([...select.matchAll(/value="([^"]+)"/g)].map(m=>Number(m[1])),echoDivisions.map(o=>o.beats));}
console.log(`PASS: ${echoDivisions.length*9} tempo/speed/division combinations retain exact shared delay timing, valid saved settings, matching menus, and a 32-second maximum.`);
