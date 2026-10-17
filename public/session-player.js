import {isSession,takeDuration,wavFile} from './recorder-core.js?rev=gestures-32';
import {PercussionSynth} from './rhythm.js?rev=gestures-32';
import {PerformanceAudio} from './recorder-audio.js?rev=gestures-32';
import {normalizePerformance} from './gestures.js?rev=gestures-32';
import {delaySeconds} from './timing.js?rev=gestures-32';
const soundKinds=new Set(['settings','gesture','note','drum','noteOff','drumOff']);
const parameter=(p,value,at,smooth=.02)=>p?.setTargetAtTime(value,at,smooth);
export class SessionPlayer{
 constructor(audio,{setTimer=(fn,ms)=>globalThis.setInterval(fn,ms),clearTimer=id=>globalThis.clearInterval(id),onError=()=>{}}={}){Object.assign(this,{audio,setTimer,clearTimer,onError});this.timer=null;this.generation=0;this.sounds=new Map();}
 async prepare(take){await this.audio.initialize();await Promise.all([...new Set(take.events.filter(e=>e.kind==='note').map(e=>e.data.voice))].map(key=>this.audio.load(key)));}
 async play(take,{loop=true,tail=0,onEnded=()=>{}}={}){this.stop();const generation=++this.generation;await this.prepare(take);if(generation!==this.generation)return null;const c=this.audio.ctx;this.take=take;this.duration=takeDuration(take);this.loop=loop;this.tail=tail;this.onEnded=onEnded;this.events=[{t:0,kind:'settings',data:take.snapshot},...take.events.filter(e=>soundKinds.has(e.kind))];this.cycle=0;this.index=0;this.start=c.currentTime+.16;this.abort=new AbortController();this.audio.recordingEnd=null;this.audio.setPlaying(true);this.drums=new PercussionSynth(this.audio);this.drums.connect();this.arp=c.createGain();this.arp.gain.value=0;this.arp.connect(this.audio.bus);this.tick();this.timer=this.setTimer(()=>{try{this.tick();}catch(e){this.fail(e);}},25);return this.start;}
 settings(s,at){const a=this.audio,c=a.ctx,m=s.main.settings,r=s.rhythm;a.bpm=s.main.bpm;a.rhythmRate=r.rate;a.delayBeats=r.delayBeats;parameter(a.master?.gain,Number(m.volume)/100*.65,at,.08);parameter(a.wet?.gain,Number(m.reverb)/100*.9,at,.12);parameter(a.echoWet?.gain,Number(m.delay)/100*.7,at,.1);parameter(a.echo?.delayTime,delaySeconds(a.bpm,r.rate,r.delayBeats),at,.12);parameter(a.gestureEcho?.delayTime,delaySeconds(a.bpm,r.rate,r.delayBeats),at,.12);parameter(this.arp?.gain,s.arp.volume/100,at,.025);parameter(this.drums?.output?.gain,r.volume/100*.7,at);parameter(this.drums?.room?.gain,r.reverb/100*.9,at,.08);parameter(this.drums?.echoWet?.gain,r.delay/100*.7,at,.08);parameter(this.drums?.echo?.delayTime,delaySeconds(a.bpm,r.rate,r.delayBeats),at,.12);this.expression(s.performance,at);}
 expression(p,at){if(!p)return;p=normalizePerformance(p);const a=this.audio;parameter(a.sceneFilter?.frequency,Math.min(p.cutoff,a.ctx.sampleRate*.45),at,.08);parameter(a.sceneFilter?.Q,p.resonance,at,.08);parameter(a.scenePan?.pan,p.pan,at,.08);parameter(a.sceneGain?.gain,p.gain,at,.08);parameter(a.gestureRoom?.gain,p.space,at,.15);parameter(a.gestureEchoWet?.gain,p.echo,at,.15);}
 schedule(event,at,cycle){const d=event.data,a=this.audio,key=cycle+':'+d.id;
  if(event.kind==='settings')this.settings(d,at);
  else if(event.kind==='gesture')this.expression(d.performance,at);
  else if(event.kind==='note'){const entry={until:at+12,envelope:null};this.sounds.set(key,entry);Promise.resolve(a.note(d.voice,d.pitch,d.expression,{when:at,signal:this.abort?.signal,target:d.bus==='arp'?this.arp:null,noteLength:d.noteLength,noteEnvelope:d.noteEnvelope,pitchGlide:d.pitchGlide,levelScale:d.levelScale})).then(envelope=>{entry.envelope=envelope;if(entry.off!==undefined)this.release(entry,entry.off);}).catch(e=>this.fail(e));}
  else if(event.kind==='drum')this.sounds.set(key,{until:at+3,sources:this.drums.hit(d.voice,at,d.velocity,{pitch:d.pitch})||[]});
  else if(event.kind==='noteOff'||event.kind==='drumOff'){const entry=this.sounds.get(key);if(entry){entry.off=at;this.release(entry,at);}}
 }
 release(entry,at){const e=entry.envelope;if(e){e.performanceReleasing=true;e.gain?.setTargetAtTime(.00001,at,.01);try{e.audioBufferSourceNode?.stop(at+.05);}catch{}}for(const source of entry.sources||[]){try{source.stop(at+.01);}catch{}}}
 tick(){if(!this.take)return;const now=this.audio.ctx.currentTime;if(!this.loop&&now>=this.start+this.duration+this.tail){const ended=this.onEnded;this.stop();ended();return;}
  const next=()=>this.start+this.cycle*this.duration+(this.events[this.index]?.t??this.duration);
  // After a throttled tab, restore the current state and resume from the clock; never burst stale notes.
  if(now>next()+.25){const elapsed=Math.max(0,now-this.start);this.cycle=this.loop?Math.floor(elapsed/this.duration):0;const position=this.loop?elapsed%this.duration:Math.min(elapsed,this.duration);let state=this.take.snapshot,expression=state.performance;for(const event of this.events){if(event.t>position)break;if(event.kind==='settings'){state=event.data;expression=state.performance;}if(event.kind==='gesture'&&event.data.performance)expression=event.data.performance;}this.settings(state,now+.003);this.expression(expression,now+.003);this.index=this.events.findIndex(e=>e.t>=position+.005);if(this.index<0)this.index=this.events.length;}
  for(let guard=0;guard<10000;guard++){if(this.index>=this.events.length){if(!this.loop)break;this.cycle++;this.index=0;}const event=this.events[this.index],at=this.start+this.cycle*this.duration+event.t;if(at>now+.12)break;this.index++;if(at>=now-.003)this.schedule(event,Math.max(at,now+.002),this.cycle);}
  for(const [key,value] of this.sounds)if(value.until<now)this.sounds.delete(key);
 }
 fail(error){this.stop();this.onError(error);}
 stop(){this.generation++;this.abort?.abort();if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;const a=this.audio,now=a.ctx?.currentTime||0;for(const entry of this.sounds.values())this.release(entry,now);this.sounds.clear();this.drums?.stop();for(const key of ['bus','output','room','verb','echo','echoWet','echoTone','feedback'])this.drums?.[key]?.disconnect?.();this.drums=null;this.arp?.disconnect();this.arp=null;this.take=null;
  for(const param of [a.master?.gain,a.wet?.gain,a.echoWet?.gain,a.echo?.delayTime,a.sceneFilter?.frequency,a.sceneFilter?.Q,a.scenePan?.pan,a.sceneGain?.gain,a.gestureRoom?.gain,a.gestureEchoWet?.gain,a.gestureEcho?.delayTime])param?.cancelScheduledValues(now);
  a.performanceApplied={};a.echoTimeValue=null;if(a.playing)a.setPlaying(false);
 }
}
// Normal recording stores event data. PCM capture is created only for an explicit WAV export.
export class SessionBackend{
 constructor(audio,{onCut=()=>{},onDone=()=>{},onError=()=>{}}={}){Object.assign(this,{audio,onCut,onDone,onError});this.player=new SessionPlayer(audio,{onError:e=>{this.cancel();onError(e);}});this.timer=null;this.operation=0;this.exportReject=null;this.legacy=new PerformanceAudio(audio);}
 async prepare(){await this.audio.initialize();}
 begin(start,end){this.cancelRecording();this.recordEnd=end;this.timer=globalThis.setInterval(()=>{if(this.audio.ctx.currentTime>=this.recordEnd){const end=this.recordEnd;this.cancelRecording();this.onCut(end);this.onDone({end});}},15);}
 end(at){this.recordEnd=at;}
 cancelRecording(){if(this.timer!==null)globalThis.clearInterval(this.timer);this.timer=null;}
 cancel(){this.operation++;this.cancelRecording();this.capture?.cancel();this.exportResolve=null;if(this.exportReject){const reject=this.exportReject;this.exportReject=null;reject(new Error('Audio export cancelled.'));}}
 play(take,options){return isSession(take)?this.player.play(take,options):this.legacy.play(take,options);}
 stop(){this.player.stop();this.legacy.stop();}
 async export(take,onStart=()=>{}){if(!isSession(take))return wavFile(take);const operation=++this.operation;await this.prepare();if(operation!==this.operation)throw new Error('Audio export cancelled.');if(!this.capture)this.capture=new PerformanceAudio(this.audio,{onDone:result=>{const pending=this.exportResolve;this.exportResolve=null;this.exportReject=null;this.player.stop();if(pending){const frames=Math.round(takeDuration(this.exportTake)*this.audio.ctx.sampleRate);pending(wavFile({frames,sampleRate:this.audio.ctx.sampleRate,tailFrames:result.channels[0].length-frames,channels:result.channels,seamMs:80}));}}});await this.capture.prepare();if(operation!==this.operation)throw new Error('Audio export cancelled.');this.exportTake=take;return new Promise((resolve,reject)=>{this.exportResolve=resolve;this.exportReject=reject;this.player.play(take,{loop:false,tail:.75}).then(start=>{if(!this.exportReject||start===null)return;this.capture.begin(start,start+takeDuration(take));onStart(start);}).catch(e=>{this.exportResolve=null;this.exportReject=null;reject(e);});});}
}
