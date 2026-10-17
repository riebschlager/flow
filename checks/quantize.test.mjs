import assert from 'node:assert/strict';
import {landingTime,quantizeDivisions} from '../public/quantize.js';
import {AmbientAudio} from '../public/music.js';
let combinations=0;
for(const bpm of [30,56,100])for(const rate of [.5,1,2])for(const beats of quantizeDivisions)for(const origin of [0,10.04])for(const now of [0,10.1,40.235])for(const duration of [.23,.45,.6]){
 const time=landingTime(now,duration,{origin,bpm,rate,beats});const step=60/bpm/rate*beats,position=(time-origin)/step;
 assert(Math.abs(position-Math.round(position))<1e-8);assert(time>=now+duration-1e-8);assert(time<now+duration+step+1e-8);combinations++;
}
assert.equal(landingTime(10,.5,{origin:0,bpm:60,beats:.5}),10.5);
assert.equal(landingTime(10,.501,{origin:0,bpm:60,beats:.5}),11);
assert.equal(landingTime(10,.501,{enabled:false}),10.501);
// Schedule the production WebAudioFont wrapper at the supplied audio-clock time.
const audio=new AmbientAudio(),events=[];let stopped=0,cancelled=0;
audio.ctx={currentTime:10};audio.playing=true;audio.bus={};audio.loaded.set('piano',Promise.resolve({zones:[]}));
audio.player={envelopes:[],queueWaveTable(ctx,bus,preset,when){events.push(when);return {audioBufferSourceNode:{stop(){stopped++;}},cancel(){cancelled++;}};}};
await audio.note('piano',60,null,{when:10.5});assert.equal(events.at(-1),10.5);
await audio.note('piano',60);assert.equal(events.at(-1),10.008);
const pending=new AbortController();await audio.note('piano',60,null,{when:11,signal:pending.signal});pending.abort();assert.equal(stopped,1);assert.equal(cancelled,1);
const before=new AbortController();before.abort();const count=events.length;await audio.note('piano',60,null,{when:11,signal:before.signal});assert.equal(events.length,count);
let release;audio.loaded.set('piano',new Promise(resolve=>release=resolve));const loading=new AbortController();const promise=audio.note('piano',60,null,{when:11,signal:loading.signal});loading.abort();release({zones:[]});await promise;assert.equal(events.length,count);
audio.loaded.set('piano',Promise.resolve({zones:[]}));const sounding=new AbortController();await audio.note('piano',60,null,{when:10.5,signal:sounding.signal});audio.ctx.currentTime=10.6;sounding.abort();assert.equal(stopped,1);
const scheduled=events.length;await audio.note('piano',60,null,{when:10.5});assert.equal(events.length,scheduled,'missed scheduled notes must not play off-grid');
console.log(`PASS: ${combinations} landing-grid cases, exact boundaries, free timing, precise audio timestamps, cancellation before/after sample loading, and preserving notes that already sounded.`);
