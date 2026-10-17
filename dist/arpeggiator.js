import {parseChord,instruments} from './music.js?rev=experimental-scapes-13';
export const arpPatterns={up:'Ascending',down:'Descending',bounce:'Up & down',reverse:'Down & up',outside:'Outside in',random:'Random · no repeats'};
export const arpRates=[1,.5,.25,.125,1/3];
export function normalizeArp(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 const number=(value,lo,hi,fallback)=>Number.isFinite(Number(value))?Math.max(lo,Math.min(hi,Number(value))):fallback;
 return {enabled:raw.enabled===true,voice:Object.hasOwn(instruments,raw.voice)?raw.voice:'vibes',pattern:Object.hasOwn(arpPatterns,raw.pattern)?raw.pattern:'up',count:Math.round(number(raw.count,1,16,8)),beats:arpRates.includes(Number(raw.beats))?Number(raw.beats):.5,volume:number(raw.volume,0,100,55)};
}
export function arpNotes(chord,count=8){
 count=normalizeArp({count}).count;const base=parseChord(chord),notes=[];
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
export class ArpEngine{
 constructor(audio,getConfig,getClock,onEvent,{setTimer=(fn,ms)=>globalThis.setInterval(fn,ms),clearTimer=id=>globalThis.clearInterval(id),random=Math.random,onError=()=>{}}={}){
  Object.assign(this,{audio,getConfig,getClock,onEvent,setTimer,clearTimer,onError});this.pattern=new ArpPattern(random);this.timer=null;this.bus=null;this.notes=[];this.key=null;this.chordKey=null;this.nextStep=0;
 }
 connect(){if(this.bus)return;this.bus=this.audio.ctx.createGain();this.bus.gain.value=0;this.bus.connect(this.audio.bus);}
 setVolume(){const volume=this.getConfig().volume;if(this.bus&&this.volume!==volume){this.bus.gain.setTargetAtTime(volume/100,this.audio.ctx.currentTime,.025);this.volume=volume;}}
 cancelFuture(now){for(const note of this.notes)if(note.time>now)note.cancel.abort();this.notes=this.notes.filter(note=>note.time<=now&&note.end>now);}
 start(){this.stop();if(!this.audio.playing||!this.audio.ctx||!this.getConfig().enabled)return;try{this.connect();this.setVolume();this.tick();this.timer=this.setTimer(()=>{try{this.tick();}catch(error){this.fail(error);}},25);}catch(error){this.fail(error);}}
 stop(){if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;const now=this.audio.ctx?.currentTime||0;
  for(const note of this.notes){note.cancel.abort();if(note.time<=now){note.envelope?.cancel();try{note.envelope?.audioBufferSourceNode?.stop(now+.1);}catch{}}}
  this.notes=[];this.volume=null;if(this.bus)this.bus.gain.setTargetAtTime(0,now,.02);this.key=null;this.chordKey=null;this.pattern.reset();this.onEvent({type:'reset'});
 }
 fail(error){this.stop();this.onError(error);}
 tick(){
  if(!this.audio.playing||!this.getConfig().enabled){this.stop();return;}
  const cfg=this.getConfig(),clock=this.getClock(),now=this.audio.ctx.currentTime;
  const step=60/clock.bpm/clock.rate*cfg.beats;
  const key=JSON.stringify([clock.origin,clock.bpm,clock.rate,clock.chordOrigin,clock.chordBeats,clock.chords,cfg.voice,cfg.count,cfg.pattern,cfg.beats]);
  this.setVolume();this.notes=this.notes.filter(note=>note.end>now);
  if(key!==this.key){this.cancelFuture(now);this.key=key;this.chordKey=null;this.pattern.reset();this.nextStep=Math.max(0,Math.ceil((now+.025-clock.origin)/step-1e-9));this.onEvent({type:'reset'});}
  if(clock.origin+this.nextStep*step<now+.003)this.nextStep=Math.max(this.nextStep,Math.ceil((now+.025-clock.origin)/step-1e-9));
  for(let guard=0;guard<32;guard++){
   const time=clock.origin+this.nextStep*step;if(time>now+.12)break;this.nextStep++;
   const chordIndex=Math.floor(Math.max(0,time-clock.chordOrigin)/(clock.chordBeats*60/clock.bpm))%clock.chords.length,chord=clock.chords[chordIndex];
   // Start each chord's pattern from its first step, even at a progression wrap.
   const chordKey=chordIndex+'|'+Math.floor(Math.max(0,time-clock.chordOrigin)/(clock.chordBeats*60/clock.bpm));
   if(this.chordKey!==chordKey){this.chordKey=chordKey;this.pattern.reset();}
   const pool=arpNotes(chord,cfg.count),index=this.pattern.next(pool.length,cfg.pattern),pitch=pool[index],length=Math.max(.12,Math.min(2.7,step*.85));
   const note={time,end:time+length+.15,cancel:new AbortController(),envelope:null};this.notes.push(note);
   const expression={velocity:.9,sustain:1,pan:pool.length===1?0:(index/(pool.length-1)*2-1)*.45,cutoff:11000,energy:.15};
   Promise.resolve(this.audio.note(cfg.voice,pitch,expression,{when:time,signal:note.cancel.signal,target:this.bus,noteLength:length})).then(envelope=>{note.envelope=envelope;if(note.cancel.signal.aborted&&envelope){envelope.cancel();try{envelope.audioBufferSourceNode?.stop();}catch{}}}).catch(error=>{if(!note.cancel.signal.aborted)this.fail(error);});
   this.onEvent({type:'note',time,pitch,index,count:pool.length,chord,voice:cfg.voice});
  }
 }
}
