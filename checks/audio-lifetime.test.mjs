import assert from 'node:assert/strict';import {AmbientAudio} from '../public/music.js';
const audio=new AmbientAudio();audio.ctx={currentTime:1};audio.playing=true;audio.bus={};audio.droplets={};audio.loaded.set('piano',Promise.resolve({zones:[]}));const sources=[];let cancellations=0;
const listeners=new Set(),signal={aborted:false,addEventListener(kind,fn){assert.equal(kind,'abort');listeners.add(fn);},removeEventListener(kind,fn){listeners.delete(fn);}};
audio.onSessionEvent=()=>()=>cancellations++;
audio.player={envelopes:[],queueWaveTable(ctx,target,preset,when){const source={stop(){this.stopped=true;},disconnect(){this.disconnected=true;}};sources.push(source);const envelope={target,when,duration:.1,gain:{cancelScheduledValues(){},setTargetAtTime(){}},cancel(){this.cancelled=true;},disconnect(){this.disconnected=true;},audioBufferSourceNode:source};this.envelopes.push(envelope);return envelope;}};
// Repeated source completion must not grow a session-wide AbortSignal listener list.
for(let i=0;i<500;i++){const e=await audio.note('piano',60,null,{when:audio.ctx.currentTime+1,signal,levelScale:1});assert.equal(listeners.size,1);audio.ctx.currentTime=e.when+e.duration+.01;e.audioBufferSourceNode.onended();assert.equal(listeners.size,0);}
assert.equal(cancellations,0,'natural completion is not a recorded cancellation');
const future=await audio.note('piano',64,null,{when:audio.ctx.currentTime+1,signal,levelScale:1});for(const abort of [...listeners])abort();assert(future.audioBufferSourceNode.stopped);assert(future.cancelled);assert.equal(cancellations,1);future.audioBufferSourceNode.onended();assert.equal(listeners.size,0);
// Playback's temporary arp target must not accumulate pools across track changes.
audio.player.envelopes=[audio.player.envelopes[0]];const permanent=audio.player.envelopes.slice();for(let cycle=0;cycle<100;cycle++){const target={};const envelopes=[];for(let i=0;i<4;i++)envelopes.push(await audio.note('piano',60+i,null,{target,when:audio.ctx.currentTime+1,levelScale:1}));audio.releaseTarget(target);assert.deepEqual(audio.player.envelopes,permanent);assert(envelopes.every(e=>e.disconnected&&e.audioBufferSourceNode.stopped));}
assert(permanent.every(e=>e.target===audio.droplets));assert(audio.loaded.has('piano'),'decoded instruments stay reusable');
console.log('PASS: 500 completed notes retain no abort hooks, pre-onset cancellation still works, and 100 temporary arpeggio buses leave no obsolete envelope pools.');
