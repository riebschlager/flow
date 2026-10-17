import assert from 'node:assert/strict';
import {AmbientAudio} from '../public/music.js';
import {PercussionSynth,stepTime} from '../public/rhythm.js';
import {delaySeconds,delayGlide} from '../public/timing.js';
function parameter(){return {events:[],setTargetAtTime(value,time,glide){this.events.push({value,time,glide});}};}
const audio=new AmbientAudio();audio.ctx={currentTime:12};audio.echo={delayTime:parameter()};const synth=new PercussionSynth(audio);synth.bus={};synth.room={gain:parameter()};synth.echoWet={gain:parameter()};synth.echo={delayTime:parameter()};
for(const bpm of [30,56,100])for(const rate of [.5,1,2])for(const delayBeats of [.5,.75,1]){
 audio.bpm=bpm;audio.setRhythmTiming({rate,delayBeats});synth.setEffects({delayBeats,rate,reverb:10,delay:50},bpm);const voice=audio.echo.delayTime.events.at(-1),drum=synth.echo.delayTime.events.at(-1);assert.equal(voice.value,drum.value);assert.equal(voice.value,delaySeconds(bpm,rate,delayBeats));assert.equal(voice.glide,delayGlide);assert.equal(drum.glide,delayGlide);const expected=stepTime(delayBeats*4,bpm,rate,0);assert(Math.abs(voice.value-expected)<1e-10);assert(voice.value<=4);
}
const previous=audio.echo.delayTime.events.length;audio.syncDelayTime();assert.equal(audio.echo.delayTime.events.length,previous);assert.equal(audio.delay,.35);assert.equal(synth.echoWet.gain.events.at(-1).value,.35);
assert.equal(delaySeconds(30,.5,1),4);assert.equal(delaySeconds(100,2,.5),.15);console.log('PASS: all 27 tempo/rhythm-speed/division combinations share identical melodic and drum delay times and glide, with no repeated automation or linked amount controls.');
