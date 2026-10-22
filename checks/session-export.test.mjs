import assert from 'node:assert/strict';
import {WavChunks,WAV_MEMORY_LIMIT,clipMime,clipSizes,clipFrame,compositeFrame,ClipCapture} from '../public/session-export.js';
const wav=new WavChunks(8000,12,{fades:true});for(let i=0;i<24;i++)wav.add([new Float32Array(4000).fill(.5),new Float32Array(4000).fill(-.25)]);assert.equal(wav.offset,96000);assert(wav.parts.every(p=>p instanceof Blob));const result=await wav.finish().arrayBuffer(),view=new DataView(result);assert.equal(result.byteLength,44+96000*4);assert.equal(new TextDecoder().decode(result.slice(0,4)),'RIFF');assert.equal(view.getUint32(24,true),8000);const sample=(s,c=0)=>view.getInt16(44+Math.round(s*8000)*4+c*2,true);assert.equal(sample(0),0);assert(Math.abs(sample(1.5)-8192)<=1);assert.equal(sample(4),16384);assert(Math.abs(sample(9)-8192)<=1);assert.equal(view.getInt16(result.byteLength-4,true),0);assert(sample(4,1)<0);assert.equal(wav.parts.length,0);
new WavChunks(48000,3600);assert.throws(()=>new WavChunks(96000,3600),/704 MiB/);assert.throws(()=>new WavChunks(48000,1,{limit:100}));const cancelled=new WavChunks(48000,300);cancelled.add([new Float32Array(100)]);cancelled.cancel();assert.equal(cancelled.parts.length,0);assert.throws(()=>cancelled.finish(),/interrupted/);
let connected=0,disconnected=0,stopped=0,draws=[],recordedTracks,options;
const track=kind=>({kind,stop(){stopped++;}}),video=track('video'),sound=track('audio');
class Stream{constructor(tracks){this.tracks=tracks;}getTracks(){return this.tracks;}}
class Recorder{static isTypeSupported(mime){return mime==='video/mp4';}constructor(stream,opts){recordedTracks=stream.getTracks();options=opts;this.mimeType=opts.mimeType;this.state='inactive';}start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable({data:new Blob(['video+audio'])});this.onstop();}}
const audio={master:{connect(){connected++;},disconnect(){disconnected++;}},ctx:{createMediaStreamDestination:()=>({stream:{getAudioTracks:()=>[sound]},disconnect(){}})}};
for(const aspect of Object.keys(clipSizes)){const canvas={getContext:()=>({fillRect(){},drawImage(...args){draws.push(args);}}),captureStream:fps=>{assert.equal(fps,30);return {getVideoTracks:()=>[video]};}},layers=[{width:1000,height:600},{width:1000,height:600}],clip=new ClipCapture(audio,layers,{aspect,Recorder,Stream,makeCanvas:()=>canvas});const done=clip.start();assert.deepEqual([canvas.width,canvas.height],clipSizes[aspect]);assert.deepEqual(recordedTracks,[video,sound]);assert.equal(options.mimeType,'video/mp4');assert.equal(clip.suffix,'.mp4');clip.draw();clip.stop();assert.equal((await done).type,'video/mp4');assert.equal(clip.parts.length,0);}
assert(draws.every(([,sx,sy,sw,sh,x,y,w,h])=>sw>0&&sh>0&&sx>=0&&sy>=0&&x===0&&y===0&&w>0&&h>0));assert.equal(connected,disconnected);assert.equal(stopped,6);
// Regression: landscape input used to occupy only a short strip of portrait output.
for(const [sourceW,sourceH] of [[1920,1080],[1080,1920],[1001,603],[720,1280],[1280,720],[1080,1080]])for(const [w,h] of Object.values(clipSizes))for(const framing of ['fill','fit']){
 const layers=[{width:sourceW,height:sourceH},{width:sourceW*2,height:sourceH*2}],calls=[];
 compositeFrame({fillRect(){},drawImage(...args){calls.push(args);}},{width:w,height:h},layers,{framing});
 const f=clipFrame(sourceW,sourceH,w,h,framing);
 assert.equal(calls.length,2);
 for(let i=0;i<2;i++){
  const [layer,sx,sy,sw,sh,dx,dy,dw,dh]=calls[i];
  assert(Math.abs(dw/sw-dh/sh)<1e-10,'uniform scaling; no distortion');
  assert(sx>=0&&sy>=0&&sx+sw<=layer.width+1e-8&&sy+sh<=layer.height+1e-8);
  assert(Math.abs(sx/layer.width-f.x)<1e-10&&Math.abs(sy/layer.height-f.y)<1e-10,'same normalized crop for all layers');
  if(framing==='fill')assert.deepEqual([dx,dy,dw,dh],[0,0,w,h],'fill covers every output pixel');
  else {assert.deepEqual([sx,sy,sw,sh],[0,0,layer.width,layer.height],'fit preserves whole source');assert(dx>=0&&dy>=0);}
 }
}
const portrait=clipFrame(1920,1080,720,1280);assert(portrait.w<.32&&portrait.h===1);assert.equal(portrait.dh,1280);
const landscape=clipFrame(1080,1920,1280,720);assert(landscape.h<.32&&landscape.w===1);assert.equal(landscape.dw,1280);
console.log('PASS: portrait/landscape/square fill and fit from six source shapes, exact edge coverage, centered cropping, no stretching and aligned layers at different resolutions.');
assert.equal(clipMime({isTypeSupported:m=>m==='video/webm'}),'video/webm');assert.throws(()=>clipMime({isTypeSupported:()=>false}),/cannot record/);
const c=new ClipCapture(audio,[{width:100,height:100}],{Recorder,Stream,makeCanvas:()=>({getContext:()=>({fillRect(){},drawImage(){}}),captureStream:()=>({getVideoTracks:()=>[video]})})});const pending=c.start();c.cancel();assert.equal(await pending,null);assert.equal(c.parts.length,0);
console.log('PASS: bounded chunked PCM, WAV header, stereo and sample-clock fades, preflight memory ceiling, cancellation, MP4/WebM negotiation, three full-frame aspects, composited layers, master audio/video tracks, cleanup and clip cancellation.');
// Exercise the production backend/worklet bridge with a short clock-controlled render.
const {SessionBackend}=await import('../public/session-player.js');
const {EnvironmentSynth}=await import('../public/environment.js?rev=performance-39');
const {PercussionSynth}=await import('../public/rhythm.js?rev=fluid-feedback-82');
const {sessionFixture}=await import('./session-fixture.mjs');
for(const method of ['prepare','apply','stop','dispose'])EnvironmentSynth.prototype[method]=function(){};
const param=()=>({value:0,setTargetAtTime(){},cancelScheduledValues(){}}),gain=()=>({gain:param(),connect(){},disconnect(){}});
PercussionSynth.prototype.connect=function(){this.output=gain();this.room=gain();this.echoWet=gain();this.echo={delayTime:param()};};PercussionSynth.prototype.stop=function(){};
const originalNode=globalThis.AudioWorkletNode,originalSet=globalThis.setInterval,originalClear=globalThis.clearInterval;let node,commands=[],mod;
try{
 globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
 globalThis.AudioWorkletNode=class{constructor(){node=this;this.port={postMessage:data=>commands.push(data)};}connect(){}};
 const a={ctx:{currentTime:0,sampleRate:8000,audioWorklet:{addModule:async url=>mod=String(url)},createGain:gain,destination:{}},bus:{},master:gain(),initialize:async()=>{},load:async()=>{},setPlaying(on){this.playing=on;},performanceApplied:{}};
 const backend=new SessionBackend(a),take=sessionFixture();let start;
 const pending=backend.export(take,t=>start=t,{seconds:8});for(let i=0;i<30;i++)await Promise.resolve();
 const command=commands.find(c=>c.type==='start');assert(command);assert.equal(command.tail,0);assert.equal(command.end-command.start,64000);assert.equal(backend.player.loop,true);assert.equal(start,.16);assert(mod.includes('capture-worklet'));
 for(let i=0;i<16;i++)node.port.onmessage({data:{id:command.id,type:'chunk',channels:[new Float32Array(4000).fill(.2),new Float32Array(4000).fill(.3)]}});
 assert.equal(backend.capture.chunks.length,0,'no retained floating-point capture chunks');node.port.onmessage({data:{id:command.id,type:'done',end:command.end,frames:64000}});assert.equal((await pending).size,44+64000*4);backend.stop();
 const live=backend.export(take,()=>{},{seconds:8,live:(at,end)=>{assert.equal(at,.16);assert.equal(end,8.16);}});for(let i=0;i<30;i++)await Promise.resolve();assert.equal(backend.player.take,null,'Drift mode delegates to production live synth instead of scheduling recorded notes');backend.cancel();backend.stop();await assert.rejects(live,/cancelled/);assert.equal(backend.capture.wav,null);
}finally{globalThis.AudioWorkletNode=originalNode;globalThis.setInterval=originalSet;globalThis.clearInterval=originalClear;}
console.log('PASS: production worklet tap and streaming WAV backend, repeated session scheduling, Drift live delegation and cancellation without retained float chunks.');
