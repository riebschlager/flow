import {schedulingLookahead} from './background-continuity.js?rev=continuity-76';
import {parseChord,instruments} from './music.js?rev=chaos-86';
export const arpPatterns={up:'Ascending',down:'Descending',bounce:'Up & down',reverse:'Down & up',outside:'Outside in',random:'Random · no repeats'};
export const arpRoots=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
export const arpScales={
 major:{name:'Major',intervals:[0,2,4,5,7,9,11]},
 minor:{name:'Natural minor',intervals:[0,2,3,5,7,8,10]},
 majorPentatonic:{name:'Major pentatonic',intervals:[0,2,4,7,9]},
 minorPentatonic:{name:'Minor pentatonic',intervals:[0,3,5,7,10]},
 dorian:{name:'Dorian',intervals:[0,2,3,5,7,9,10]},
 mixolydian:{name:'Mixolydian',intervals:[0,2,4,5,7,9,10]},
 lydian:{name:'Lydian',intervals:[0,2,4,6,7,9,11]}
};
export const arpRates=[4,2,1,.5,.25,.125,1/3];
export function normalizeArp(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 const number=(value,lo,hi,fallback)=>Number.isFinite(Number(value))?Math.max(lo,Math.min(hi,Number(value))):fallback;
 return {rootMode:raw.rootMode==='chord'?'chord':'fixed',source:raw.source==='scale'?'scale':'chord',root:Number.isInteger(raw.root)&&raw.root>=0&&raw.root<12?raw.root:0,scale:Object.hasOwn(arpScales,raw.scale)?raw.scale:'major',restart:raw.restart!==false,enabled:raw.enabled===true,voice:Object.hasOwn(instruments,raw.voice)?raw.voice:'vibes',pattern:Object.hasOwn(arpPatterns,raw.pattern)?raw.pattern:'up',count:Math.round(number(raw.count,1,16,8)),beats:arpRates.includes(Number(raw.beats))?Number(raw.beats):.5,volume:number(raw.volume,0,100,55),probability:number(raw.probability??100,0,100,100),length:number(raw.length,10,400,85),attack:number(raw.attack,0,2000,20),decay:number(raw.decay,0,2000,120),sustain:number(raw.sustain,0,100,65),glideEnabled:raw.glideEnabled===true,glideTime:number(raw.glideTime,0,2000,180),glideAmount:number(raw.glideAmount,0,100,100)};
}
export function arpEnvelope(raw={},step=.5){
 const cfg=normalizeArp(raw),duration=Math.max(.02,Math.min(8,(Number(step)||.5)*cfg.length/100));
 const release=Math.min(.25,Math.max(.012,duration*.2)),available=duration-release;
 let attack=Math.max(.002,cfg.attack/1000),decay=Math.max(.002,cfg.decay/1000);
 const fit=Math.min(1,available/(attack+decay));attack*=fit;decay*=fit;
 const hold=Math.max(0,available-attack-decay),sustain=cfg.sustain/100;
 return {duration,attack,decay,hold,release,sustain,fitted:fit<.999,envelope:[{duration:0,volume:0},{duration:attack,volume:1},{duration:decay,volume:sustain},{duration:hold,volume:sustain},{duration:release,volume:0}]};
}
export function arpGlide(raw={},step=.5){
 const cfg=normalizeArp(raw),shape=arpEnvelope(cfg,step),requested=cfg.glideTime/1000,time=Math.min(requested,shape.duration-shape.release);
 return {enabled:cfg.glideEnabled&&time>0&&cfg.glideAmount>0,time,amount:cfg.glideAmount/100,fitted:time<requested-.000001};
}
export function arpRootForChord(chord,raw={}){
 const cfg=normalizeArp(raw);return cfg.rootMode==='chord'?parseChord(chord)[0]%12:cfg.root;
}
export function arpNotes(chord,count=8,raw={}){
 const cfg=normalizeArp({...raw,count});count=cfg.count;const base=cfg.source==='scale'?arpScales[cfg.scale].intervals.map(n=>48+arpRootForChord(chord,cfg)+n):parseChord(chord),notes=[];
 for(let octave=0;octave<8;octave++)for(const note of base){const pitch=note+octave*12;if(pitch<=127)notes.push(pitch);}
 return [...new Set(notes)].sort((a,b)=>a-b).slice(0,count);
}
export function patternOrder(count,pattern='up'){
 const up=Array.from({length:Math.max(1,count)},(_,i)=>i),down=[...up].reverse();
 if(pattern==='down')return down;
 if(pattern==='bounce')return [...up,...down.slice(1,-1)];
 if(pattern==='reverse')return [...down,...up.slice(1,-1)];
 if(pattern==='outside'){const result=[];let low=0,high=count-1;while(low<=high){result.push(low++);if(low<=high)result.push(high--);}return result;}
 return up;
}
export class ArpPattern{
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(){this.step=0;this.bag=[];this.last=-1;this.key='';}
 next(count,pattern){const key=count+'|'+pattern;if(this.key!==key){this.reset();this.key=key;}
  let index;if(pattern==='random'){
   if(!this.bag.length)this.bag=Array.from({length:count},(_,i)=>i);
   const choices=this.bag.filter(i=>i!==this.last),pool=choices.length?choices:this.bag;
   index=pool[Math.floor(this.random()*pool.length)];this.bag.splice(this.bag.indexOf(index),1);
  }else{const order=patternOrder(count,pattern);index=order[this.step%order.length];}
  this.last=index;this.step++;return index;
 }
}
// Keep density rolls independent of Math.random used by pitch patterns.
function probabilitySource(){
 if(globalThis.crypto?.getRandomValues){const word=new Uint32Array(1);return ()=>globalThis.crypto.getRandomValues(word)[0]/4294967296;}
 let state=(Date.now()|0)||1;
 return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
}
export class ArpEngine{
 constructor(audio,getConfig,getClock,onEvent,{setTimer=(fn,ms)=>globalThis.setInterval(fn,ms),clearTimer=id=>globalThis.clearInterval(id),random=Math.random,probabilityRandom=probabilitySource(),onError=()=>{},getFluid=()=>null}={}){
  Object.assign(this,{audio,getConfig,getClock,onEvent,setTimer,clearTimer,onError,probabilityRandom,getFluid});this.pattern=new ArpPattern(random);this.timer=null;this.bus=null;this.notes=[];this.key=null;this.chordKey=null;this.nextStep=0;this.previousPitch=null;this.lastStartedPitch=null;this.lastStartedTime=-Infinity;
 }
 connect(){if(this.bus)return;this.bus=this.audio.ctx.createGain();this.bus.gain.value=0;this.bus.connect(this.audio.bus);}
 setVolume(){const volume=this.getConfig().volume;if(this.bus&&this.volume!==volume){this.bus.gain.setTargetAtTime(volume/100,this.audio.ctx.currentTime,.025);this.volume=volume;}}
 cancelFuture(now){this.previousPitch=this.lastStartedPitch;for(const note of this.notes)if(note.time>now)note.cancel.abort();this.notes=this.notes.filter(note=>note.time<=now&&note.end>now);}
 start(){this.stop();if(!this.audio.playing||!this.audio.ctx||!this.getConfig().enabled)return;try{this.connect();this.setVolume();this.tick();this.timer=this.setTimer(()=>{try{this.tick();}catch(error){this.fail(error);}},25);}catch(error){this.fail(error);}}
 stop(){if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;const now=this.audio.ctx?.currentTime||0;
  for(const note of this.notes){note.cancel.abort();if(note.time<=now){note.envelope?.cancel();try{note.envelope?.audioBufferSourceNode?.stop(now+.1);}catch{}}}
  this.notes=[];this.previousPitch=null;this.lastStartedPitch=null;this.lastStartedTime=-Infinity;this.volume=null;if(this.bus)this.bus.gain.setTargetAtTime(0,now,.02);this.key=null;this.chordKey=null;this.pattern.reset();this.onEvent({type:'reset'});
 }
 trim(at){for(const note of this.notes)if(note.time>=at)note.cancel.abort();this.notes=this.notes.filter(note=>note.time<at);}
 freeze(at){if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;this.cancelFuture(at-1e-7);}
 fail(error){this.stop();this.onError(error);}
 tick(){
  if(!this.audio.playing||!this.getConfig().enabled){this.stop();return;}
  const cfg=this.getConfig(),clock=this.getClock(),now=this.audio.ctx.currentTime;
  const step=60/clock.bpm/clock.rate*cfg.beats;
  const key=JSON.stringify([clock.origin,clock.bpm,clock.rate,clock.chordOrigin,clock.chordBeats,clock.chords,cfg.voice,cfg.count,cfg.pattern,cfg.beats,cfg.source,cfg.root,cfg.scale,cfg.restart,cfg.rootMode]);
  this.setVolume();for(const note of this.notes)if(note.time<=now&&note.time>this.lastStartedTime){this.lastStartedPitch=note.pitch;this.lastStartedTime=note.time;}this.notes=this.notes.filter(note=>note.end>now);
  if(key!==this.key){this.cancelFuture(now);this.key=key;this.chordKey=null;this.pattern.reset();this.nextStep=Math.max(0,Math.ceil((now+.025-clock.origin)/step-1e-9));this.onEvent({type:'reset'});}
  if(clock.origin+this.nextStep*step<now+.003)this.nextStep=Math.max(this.nextStep,Math.ceil((now+.025-clock.origin)/step-1e-9));
  for(let guard=0;guard<32;guard++){
   let time=clock.origin+this.nextStep*step;if(time>now+schedulingLookahead())break;this.nextStep++;
   const chordIndex=Math.floor(Math.max(0,time-clock.chordOrigin)/(clock.chordBeats*60/clock.bpm))%clock.chords.length,chord=clock.chords[chordIndex];
   // Restart at chord boundaries by default; continuous mode preserves the pattern phase.
   const chordKey=chordIndex+'|'+Math.floor(Math.max(0,time-clock.chordOrigin)/(clock.chordBeats*60/clock.bpm));
   if(this.chordKey!==chordKey){this.chordKey=chordKey;if(cfg.restart!==false)this.pattern.reset();}
   const pool=arpNotes(chord,cfg.count,cfg),index=this.pattern.next(pool.length,cfg.pattern),pitch=pool[index];
   // A rest still consumes its pattern step. Probability uses a separate random
   // stream, and never changes the rhythmic grid or the last sounded glide pitch.
   const probability=cfg.probability??100;
   if(probability<=0||(probability<100&&this.probabilityRandom()*100>=probability)){this.onEvent({type:'rest',rest:true,time,pitch,index,count:pool.length,chord,voice:cfg.voice});continue;}
   const shape=arpEnvelope(cfg,step),length=shape.duration;
   const glide=arpGlide(cfg,step),pitchGlide=glide.enabled&&this.previousPitch!==null?{from:this.previousPitch,time:glide.time,amount:glide.amount}:null;this.previousPitch=pitch;
   const response=this.getFluid(index,pool.length);if(response)time=Math.max(now+.002,time+response.push);
   const note={pitch,time,end:time+length+.15,cancel:new AbortController(),envelope:null};this.notes.push(note);
   const expression={velocity:.9,sustain:1,pan:pool.length===1?0:(index/(pool.length-1)*2-1)*.45,cutoff:11000,energy:.15};if(response){expression.velocity*=response.velocity;expression.cutoff=response.cutoff;}
   Promise.resolve(this.audio.note(cfg.voice,pitch,expression,{when:time,signal:note.cancel.signal,target:this.bus,noteLength:length,noteEnvelope:shape.envelope,pitchGlide})).then(envelope=>{note.envelope=envelope;if(note.cancel.signal.aborted&&envelope){envelope.cancel();try{envelope.audioBufferSourceNode?.stop();}catch{}}}).catch(error=>{if(!note.cancel.signal.aborted)this.fail(error);});
   this.onEvent({type:'note',time,pitch,index,count:pool.length,chord,voice:cfg.voice});
  }
 }
}
