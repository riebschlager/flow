// Beat patterns and audio-clock scheduling. One loop is sixteen sixteenth notes.
export const drumVoices={
 kick:{name:'Warm kick',type:'kick',gain:.85,weight:1},
 softkick:{name:'Soft sub',type:'softkick',gain:.85,weight:1},
 snare:{name:'Soft snare',type:'snare',gain:.45,weight:.7},
 rim:{name:'Rim click',type:'rim',gain:.48,weight:.5},
 clap:{name:'Dusty clap',type:'clap',gain:.4,weight:.65},
 hat:{name:'Closed hat',type:'hat',gain:.32,weight:.25},
 shaker:{name:'Shaker',type:'shaker',gain:.36,weight:.3},
 tom:{name:'Low tom',type:'tom',gain:.65,weight:.85},
 conga:{name:'Muted conga',type:'conga',gain:.6,weight:.6},
 wood:{name:'Wood block',type:'wood',gain:.55,weight:.4}
};
export const grooves={ocean:'Ocean pulse',halftime:'Half-time dust',broken:'Broken current',woven:'Handwoven',euclid:'Euclidean drift'};
const clamp=(v,lo,hi,fallback)=>Number.isFinite(Number(v))?Math.max(lo,Math.min(hi,Number(v))):fallback;
export function rotatePattern(steps,offset=1){const n=steps.length,k=((Math.round(offset)%n)+n)%n;return steps.map((_,i)=>steps[(i-k+n)%n]);}
export function euclidean(hits=4,rotation=0){hits=Math.round(clamp(hits,0,16,4));const p=Array.from({length:16},(_,i)=>(i*hits)%16<hits?(i%4===0?1:.65):0);return rotatePattern(p,rotation);}
const grid=entries=>{const s=Array(16).fill(0);for(const e of entries){const [i,v]=Array.isArray(e)?e:[e,.65];s[i]=v;}return s;};
export function groovePattern(name){switch(name){
 case 'halftime':return [grid([[0,1],[7,.55],[10,.8]]),grid([[8,1],[15,.4]]),grid([0,2,4,6,8,10,12,14]),grid([[3,.4],5,[11,.4],13,15])];
 case 'broken':return [grid([[0,1],3,[6,.85],[10,1],14]),grid([[4,.9],[12,1],[15,.4]]),grid([0,2,5,6,8,10,13,14]),grid([1,7,9,11,15])];
 case 'woven':return [euclidean(3,0),euclidean(5,2),euclidean(7,1),euclidean(4,3)];
 case 'euclid':return [euclidean(5,0),euclidean(3,4),euclidean(9,1),euclidean(7,3)];
 default:return [grid([[0,1],[6,.55],[8,.85]]),grid([[4,.8],[12,1]]),grid([0,2,4,6,8,10,12,14]),grid([3,7,11,[14,.35],15])];
}}
export function varyPattern(steps,random=Math.random){const next=steps.map((v,i)=>{const r=random();if(v)return r<(i%4===0?.06:.17)?0:(r>.82?(v>=.85?.65:1):v);return r<(i%2===0?.10:.16)?(i%4===0?.85:.55):0;});if(next.every(v=>!v))next[Math.floor(random()*16)]=.65;return next;}
export function defaultRhythm(){const patterns=groovePattern('ocean');return {enabled:false,preset:'ocean',volume:55,swing:12,humanize:15,rate:1,visual:45,visualMode:'both',lanes:['kick','rim','hat','shaker'].map((voice,i)=>({voice,level:i===0?85:i===1?65:50,muted:false,rotation:0,steps:patterns[i]}))};}
export function normalizeRhythm(raw){const d=defaultRhythm();if(!raw||typeof raw!=='object')return d;d.enabled=raw.enabled===true;d.preset=Object.hasOwn(grooves,raw.preset)||raw.preset==='custom'?raw.preset:'ocean';for(const key of ['volume','swing','humanize','visual'])d[key]=clamp(raw[key],0,key==='swing'?60:100,d[key]);d.rate=[.5,1,2].includes(Number(raw.rate))?Number(raw.rate):1;d.visualMode=['both','ripples','fluid'].includes(raw.visualMode)?raw.visualMode:'both';d.lanes=d.lanes.map((lane,i)=>{const r=raw.lanes?.[i];if(!r||typeof r!=='object')return lane;return {voice:r.voice==='off'||Object.hasOwn(drumVoices,r.voice)?r.voice:lane.voice,level:clamp(r.level,0,100,lane.level),muted:r.muted===true,rotation:Math.round(clamp(r.rotation,0,15,0)),steps:Array.isArray(r.steps)&&r.steps.length===16?r.steps.map(v=>clamp(v,0,1,0)):lane.steps};});return d;}
export function stepTime(index,bpm,rate=1,swing=0){const duration=60/bpm/4/rate;return index*duration+(index%2?duration*swing/100:0);}

// Small synthesized percussion voices: no additional downloads or tuning against chords.
export class PercussionSynth{
 constructor(audio){this.audio=audio;this.bus=null;this.room=null;this.noise=null;this.sources=new Set();}
 connect(){if(this.bus)return;const c=this.audio.ctx;this.bus=c.createGain();this.bus.gain.value=0;this.bus.connect(this.audio.limiter);this.room=c.createGain();this.room.gain.value=.08;this.bus.connect(this.room);this.room.connect(this.audio.verb);this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
 setLevel(value){if(this.bus)this.bus.gain.setTargetAtTime(value/100*.7,this.audio.ctx.currentTime,.02);}
 stop(){if(this.bus)this.bus.gain.setTargetAtTime(0,this.audio.ctx.currentTime,.01);for(const source of this.sources){try{source.stop();}catch{}}this.sources.clear();}
 hit(key,when,velocity=1){const voice=drumVoices[key];if(!voice||velocity<=0)return;this.connect();const c=this.audio.ctx,t=Math.max(c.currentTime+.002,when),level=voice.gain*velocity;
 const track=(source,end,nodes=[])=>{this.sources.add(source);source.onended=()=>{this.sources.delete(source);try{source.disconnect();nodes.forEach(node=>node.disconnect());}catch{}};source.start(t);source.stop(t+end+.02);};
 const tone=(frequency,decay,amount=1,type='sine',endFrequency=frequency)=>{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),t+Math.min(decay,.14));g.gain.setValueAtTime(.00001,t);g.gain.linearRampToValueAtTime(level*amount,t+.004);g.gain.exponentialRampToValueAtTime(.00001,t+decay);o.connect(g);g.connect(this.bus);track(o,decay,[g]);};
 const noise=(frequency,decay,amount,type='highpass',q=.7,clap=false)=>{const src=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();src.buffer=this.noise;filter.type=type;filter.frequency.value=frequency;filter.Q.value=q;g.gain.setValueAtTime(.00001,t);if(clap){for(let i=0;i<3;i++){g.gain.linearRampToValueAtTime(level*amount,t+i*.012+.002);g.gain.exponentialRampToValueAtTime(.0001,t+i*.012+.01);}g.gain.linearRampToValueAtTime(level*amount*.7,t+.038);}else g.gain.linearRampToValueAtTime(level*amount,t+.003);g.gain.exponentialRampToValueAtTime(.00001,t+decay);src.connect(filter);filter.connect(g);g.connect(this.bus);track(src,decay,[g,filter]);};
 switch(voice.type){case 'kick':tone(145,.48,1,'sine',43);break;case 'softkick':tone(90,.68,1,'sine',34);break;case 'snare':tone(180,.15,.35,'triangle',125);noise(1800,.20,.5,'bandpass',.7);break;case 'rim':tone(650,.07,.42,'triangle',410);tone(1850,.04,.17);break;case 'clap':noise(1550,.23,.55,'bandpass',.7,true);break;case 'hat':noise(6800,.055,.7);break;case 'shaker':noise(4800,.13,.65,'bandpass',1.2);break;case 'tom':tone(190,.42,.9,'sine',80);break;case 'conga':tone(360,.20,.7,'sine',210);tone(620,.08,.15,'triangle');break;case 'wood':tone(800,.085,.55,'sine',660);tone(1180,.06,.3);break;}
 }
}
export class RhythmEngine{
 constructor(audio,getConfig,onEvent,{setTimer=setInterval,clearTimer=clearInterval,random=Math.random}={}){this.audio=audio;this.getConfig=getConfig;this.onEvent=onEvent;this.synth=new PercussionSynth(audio);this.timer=null;this.nextStep=0;this.origin=0;this.setTimer=setTimer;this.clearTimer=clearTimer;this.random=random;}
 start(positionBeats=0){this.stop();if(!this.audio.ctx||!this.audio.playing||!this.getConfig().enabled)return;this.synth.connect();const cfg=this.getConfig();this.synth.setLevel(cfg.volume);this.origin=this.audio.ctx.currentTime+.04-positionBeats*60/this.audio.bpm;this.nextStep=Math.max(0,Math.ceil(positionBeats*4*cfg.rate-1e-5));this.tick();this.timer=this.setTimer(()=>this.tick(),25);}
 stop(){if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;this.synth.stop();}
 tick(){if(!this.audio.playing||!this.getConfig().enabled){this.stop();return;}const cfg=this.getConfig(),now=this.audio.ctx.currentTime,bpm=this.audio.bpm;this.synth.setLevel(cfg.volume);const size=60/bpm/4/cfg.rate;if(this.origin+stepTime(this.nextStep,bpm,cfg.rate,cfg.swing)<now-.1)this.nextStep=Math.max(this.nextStep,Math.ceil((now-this.origin)/size));let guard=0;
 while(guard++<32){const index=this.nextStep,time=this.origin+stepTime(index,bpm,cfg.rate,cfg.swing);if(time>now+.12)break;this.nextStep++;if(time<now-.02)continue;const step=index%16;this.onEvent({type:'step',step,time});cfg.lanes.forEach((lane,i)=>{const amount=lane.steps[step];if(lane.muted||lane.voice==='off'||!drumVoices[lane.voice]||lane.level<=0||!amount)return;const human=cfg.humanize/100,hitTime=Math.max(now+.003,time+(this.random()*2-1)*.014*human),velocity=amount*lane.level/100*(1-human*.2*this.random());this.synth.hit(lane.voice,hitTime,velocity);this.onEvent({type:'hit',step,lane:i,voice:lane.voice,time:hitTime,velocity});});}
 }
}
