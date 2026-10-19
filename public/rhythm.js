import {schedulingLookahead} from './background-continuity.js?rev=continuity-76';
import {parseChord} from './music.js?rev=visible-sound-79';
import {delaySeconds,delayGlide,maxDelaySeconds,normalizeEchoBeats} from './timing.js?rev=gestures-32-echo52';
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
 wood:{name:'Wood block',type:'wood',gain:.55,weight:.4},
 feltmallet:{name:'Felt mallet',type:'feltmallet',gain:.42,weight:.55,group:'Tuned objects',degree:0,octave:1,motion:'sweep'},
 glass:{name:'Glass tap',type:'glass',gain:.28,weight:.3,group:'Tuned objects',degree:2,octave:1,motion:'light'},
 droplet:{name:'Water plip',type:'droplet',gain:.38,weight:.4,group:'Tuned objects',degree:1,octave:1,motion:'light'},
 kalimba:{name:'Thumb pluck',type:'kalimba',gain:.38,weight:.5,group:'Tuned objects',degree:2,octave:1,motion:'sweep'},
 bottle:{name:'Bottle ping',type:'bottle',gain:.35,weight:.35,group:'Tuned objects',degree:0,octave:2,motion:'light'},
 pulse:{name:'Muted synth pulse',type:'pulse',gain:.4,weight:.75,group:'Tuned objects',degree:0,octave:0,motion:'bass'},
 paper:{name:'Paper brush',type:'paper',gain:.34,weight:.3,group:'Objects & air',motion:'light'},
 pebble:{name:'Pebble tick',type:'pebble',gain:.3,weight:.4,group:'Objects & air',motion:'sweep'},
 metal:{name:'Metal seed',type:'metal',gain:.25,weight:.35,group:'Objects & air',motion:'light'},
 breath:{name:'Breath puff',type:'breath',gain:.35,weight:.5,group:'Objects & air',motion:'sweep'}
};
export const grooves={ocean:'Ocean pulse',halftime:'Half-time dust',broken:'Broken current',woven:'Handwoven',euclid:'Euclidean drift',stillpoint:'Still point',pocket:'Velvet pocket',twostep:'Skipping stones',tresillo:'Threefold tide',offbeat:'Lantern steps',interlock:'Interlocking reeds',sloworbit:'Slow orbit',fracture:'Fractured rain'};
export const grooveDetails={
 "stillpoint": "Sparse anchors and isolated replies. Leave room for long echoes. Try Soft ceremony.",
 "pocket": "A backbeat with quiet ghost notes and uneven hat accents. Try Velvet room; add a little swing.",
 "twostep": "A skipping, two-step-inspired foundation with offbeat replies. Try Orbital clock.",
 "tresillo": "A 3–3–2 eighth-note accent cycle inside the four-beat loop. Try Woodland.",
 "offbeat": "A gentle four-on-the-floor pulse with offbeat texture. Try Shoreline or Paper machine.",
 "interlock": "Four short parts answer each other, leaving gaps between the hits. Try Rain objects.",
 "sloworbit": "An open half-time backbeat with a late, soft pickup. Try Soft ceremony at half speed.",
 "fracture": "Small clusters and ghost hits interrupt a steady low anchor. Try Glass garden."
};
export const drumKits={
 "shoreline": {
  "name": "Shoreline",
  "voices": [
   "kick",
   "rim",
   "hat",
   "shaker"
  ],
  "levels": [
   85,
   65,
   50,
   50
  ],
  "text": "Warm kick, rim, hat and shaker: a familiar foundation.",
  "groove": "ocean"
 },
 "velvetroom": {
  "name": "Velvet room",
  "voices": [
   "softkick",
   "snare",
   "shaker",
   "feltmallet"
  ],
  "levels": [
   82,
   60,
   44,
   55
  ],
  "text": "Sub, soft snare and shaker, with a felt-mallet reply.",
  "groove": "pocket"
 },
 "glassgarden": {
  "name": "Glass garden",
  "voices": [
   "softkick",
   "glass",
   "pebble",
   "bottle"
  ],
  "levels": [
   76,
   60,
   48,
   45
  ],
  "text": "Soft sub beneath glass taps, pebble ticks and bottle pings.",
  "groove": "fracture"
 },
 "papermachine": {
  "name": "Paper machine",
  "voices": [
   "pulse",
   "paper",
   "metal",
   "breath"
  ],
  "levels": [
   78,
   70,
   44,
   58
  ],
  "text": "A muted low pulse, papery brush, metal flecks and air.",
  "groove": "offbeat"
 },
 "woodland": {
  "name": "Woodland",
  "voices": [
   "tom",
   "conga",
   "wood",
   "kalimba"
  ],
  "levels": [
   76,
   65,
   50,
   56
  ],
  "text": "Low tom and muted conga with wood and thumb-plucked tones.",
  "groove": "tresillo"
 },
 "rainobjects": {
  "name": "Rain objects",
  "voices": [
   "droplet",
   "pebble",
   "paper",
   "glass"
  ],
  "levels": [
   78,
   60,
   55,
   44
  ],
  "text": "Water plips, tiny stone clicks, brushed paper and glass.",
  "groove": "interlock"
 },
 "orbitalclock": {
  "name": "Orbital clock",
  "voices": [
   "pulse",
   "metal",
   "hat",
   "bottle"
  ],
  "levels": [
   78,
   56,
   38,
   50
  ],
  "text": "A low electronic pulse with metallic ticks and hollow pings.",
  "groove": "twostep"
 },
 "softceremony": {
  "name": "Soft ceremony",
  "voices": [
   "softkick",
   "rim",
   "breath",
   "feltmallet"
  ],
  "levels": [
   78,
   52,
   65,
   52
  ],
  "text": "A restrained sub, rim, breath and soft mallet ritual.",
  "groove": "stillpoint"
 }
};
const clamp=(v,lo,hi,fallback)=>Number.isFinite(Number(v))?Math.max(lo,Math.min(hi,Number(v))):fallback;
export function rotatePattern(steps,offset=1){const n=steps.length,k=((Math.round(offset)%n)+n)%n;return steps.map((_,i)=>steps[(i-k+n)%n]);}
export function euclidean(hits=4,rotation=0){hits=Math.round(clamp(hits,0,16,4));const p=Array.from({length:16},(_,i)=>(i*hits)%16<hits?(i%4===0?1:.65):0);return rotatePattern(p,rotation);}
const grid=entries=>{const s=Array(16).fill(0);for(const e of entries){const [i,v]=Array.isArray(e)?e:[e,.65];s[i]=v;}return s;};
export function groovePattern(name){switch(name){
 case 'stillpoint':return [grid([[0,1],[10,.45]]),grid([[8,.65]]),grid([[2,.45],[6,.3],[14,.4]]),grid([[5,.55],[13,.35]])];
 case 'pocket':return [grid([[0,1],[6,.55],[8,.8],[15,.35]]),grid([[3,.25],[4,.9],[10,.3],[12,1],[14,.25]]),grid([[0,.7],[2,.4],[4,.65],[6,.45],[8,.75],[10,.35],[12,.6],[14,.45],[15,.25]]),grid([[1,.3],[7,.5],[11,.3],[13,.5]])];
 case 'twostep':return [grid([[0,1],[6,.75],[10,.85]]),grid([[4,.9],[11,.25],[12,1]]),grid([[0,.5],[2,.7],[5,.35],[6,.65],[8,.45],[10,.7],[13,.35],[14,.7]]),grid([[3,.55],[7,.35],[9,.6],[15,.45]])];
 case 'tresillo':return [grid([[0,1],[6,.85],[12,.9]]),grid([[4,.65],[10,.45],[14,.65]]),grid([[2,.4],[5,.3],[8,.55],[11,.3],[15,.45]]),grid([[3,.45],[9,.6],[13,.35]])];
 case 'offbeat':return [grid([[0,.9],[4,.7],[8,.85],[12,.7]]),grid([[4,.7],[12,.85]]),grid([[2,.75],[6,.6],[10,.75],[14,.6]]),grid([[3,.25],[7,.4],[11,.25],[15,.5]])];
 case 'interlock':return [grid([[0,1],[7,.65],[10,.8]]),grid([[3,.75],[8,.55],[14,.65]]),grid([[2,.5],[6,.65],[11,.4],[15,.55]]),grid([[1,.4],[5,.65],[9,.5],[13,.7]])];
 case 'sloworbit':return [grid([[0,1],[11,.55]]),grid([[8,.85],[14,.25]]),grid([[0,.5],[4,.35],[6,.25],[10,.45],[12,.35],[15,.25]]),grid([[3,.4],[7,.25],[13,.5]])];
 case 'fracture':return [grid([[0,1],[8,.8],[14,.4]]),grid([[4,.7],[7,.25],[12,.85]]),grid([[1,.3],[2,.55],[6,.4],[9,.3],[10,.65],[15,.35]]),grid([[3,.55],[5,.3],[11,.6],[13,.3],[14,.45]])];
 case 'halftime':return [grid([[0,1],[7,.55],[10,.8]]),grid([[8,1],[15,.4]]),grid([0,2,4,6,8,10,12,14]),grid([[3,.4],5,[11,.4],13,15])];
 case 'broken':return [grid([[0,1],3,[6,.85],[10,1],14]),grid([[4,.9],[12,1],[15,.4]]),grid([0,2,5,6,8,10,13,14]),grid([1,7,9,11,15])];
 case 'woven':return [euclidean(3,0),euclidean(5,2),euclidean(7,1),euclidean(4,3)];
 case 'euclid':return [euclidean(5,0),euclidean(3,4),euclidean(9,1),euclidean(7,3)];
 default:return [grid([[0,1],[6,.55],[8,.85]]),grid([[4,.8],[12,1]]),grid([0,2,4,6,8,10,12,14]),grid([3,7,11,[14,.35],15])];
}}
export function varyPattern(steps,random=Math.random){const next=steps.map((v,i)=>{const r=random();if(v)return r<(i%4===0?.06:.17)?0:(r>.82?(v>=.85?.65:1):v);return r<(i%2===0?.10:.16)?(i%4===0?.85:.55):0;});if(next.every(v=>!v))next[Math.floor(random()*16)]=.65;return next;}
export function defaultRhythm(){const patterns=groovePattern('ocean');return {enabled:false,preset:'ocean',kit:'shoreline',volume:55,reverb:10,delay:0,delayBeats:.75,swing:12,humanize:15,rate:1,visual:45,visualMode:'both',lanes:['kick','rim','hat','shaker'].map((voice,i)=>({voice,level:i===0?85:i===1?65:50,muted:false,rotation:0,steps:patterns[i]}))};}
export function normalizeRhythm(raw){const d=defaultRhythm();if(!raw||typeof raw!=='object')return d;d.enabled=raw.enabled===true;d.kit=Object.hasOwn(drumKits,raw.kit)?raw.kit:'custom';d.preset=Object.hasOwn(grooves,raw.preset)||raw.preset==='custom'?raw.preset:'ocean';for(const key of ['volume','reverb','delay','swing','humanize','visual'])d[key]=clamp(raw[key],0,key==='swing'?60:100,d[key]);d.delayBeats=normalizeEchoBeats(raw.delayBeats);d.rate=[.5,1,2].includes(Number(raw.rate))?Number(raw.rate):1;d.visualMode=['both','ripples','fluid'].includes(raw.visualMode)?raw.visualMode:'both';d.lanes=d.lanes.map((lane,i)=>{const r=raw.lanes?.[i];if(!r||typeof r!=='object')return lane;return {voice:r.voice==='off'||Object.hasOwn(drumVoices,r.voice)?r.voice:lane.voice,level:clamp(r.level,0,100,lane.level),muted:r.muted===true,rotation:Math.round(clamp(r.rotation,0,15,0)),steps:Array.isArray(r.steps)&&r.steps.length===16?r.steps.map(v=>clamp(v,0,1,0)):lane.steps};});if(d.kit!=='custom'&&!kitMatches(d,d.kit))d.kit='custom';return d;}
export function stepTime(index,bpm,rate=1,swing=0){const duration=60/bpm/4/rate;return index*duration+(index%2?duration*swing/100:0);}

export function kitMatches(config,key){const kit=drumKits[key];return !!kit&&config.lanes.every((lane,i)=>lane.voice===kit.voices[i]&&lane.level===kit.levels[i]);}
export function applyDrumKit(config,key){const kit=drumKits[key];if(!kit)return config;const next=normalizeRhythm(config);next.kit=key;next.lanes=next.lanes.map((lane,i)=>({...lane,voice:kit.voices[i],level:kit.levels[i]}));return next;}
export function percussionPitch(key,chord='Cmaj7'){const voice=drumVoices[key];if(voice?.degree===undefined)return null;const pool=parseChord(chord);return Math.max(12,Math.min(108,pool[voice.degree%pool.length]+voice.octave*12));}

// Synthesized drums, object-like textures and chord-aware mallets; no sample downloads.
export class PercussionSynth{
 constructor(audio){this.audio=audio;this.bus=null;this.output=null;this.room=null;this.verb=null;this.echo=null;this.echoWet=null;this.noise=null;this.sources=new Set();this.level=null;this.fxValues=null;}
 connect(){if(this.bus)return;const c=this.audio.ctx;this.bus=c.createGain();this.bus.gain.value=1;this.output=c.createGain();this.output.gain.value=0;this.bus.connect(this.output);this.output.connect(this.audio.sceneInput||this.audio.limiter);this.verb=c.createConvolver();this.verb.buffer=this.audio.verb.buffer;this.room=c.createGain();this.room.gain.value=0;this.bus.connect(this.verb);this.verb.connect(this.room);this.room.connect(this.output);this.echo=c.createDelay(maxDelaySeconds);this.echo.delayTime.value=delaySeconds(this.audio.bpm,this.audio.rhythmRate,this.audio.delayBeats);this.echoTone=c.createBiquadFilter();this.echoTone.type='lowpass';this.echoTone.frequency.value=3100;this.feedback=c.createGain();this.feedback.gain.value=.36;this.echoWet=c.createGain();this.echoWet.gain.value=0;this.bus.connect(this.echo);this.echo.connect(this.echoTone);this.echoTone.connect(this.feedback);this.feedback.connect(this.echo);this.echo.connect(this.echoWet);this.echoWet.connect(this.output);this.echoWet.connect(this.verb);this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;this.setEffects();}
 setLevel(value){if(this.output&&this.level!==value){this.output.gain.setTargetAtTime(value/100*.7,this.audio.ctx.currentTime,.02);this.level=value;}}
 setEffects({reverb=10,delay=0,delayBeats=this.audio.delayBeats??.75,rate=this.audio.rhythmRate??1}={},bpm=this.audio.bpm){if(!this.bus)return;const next={reverb:clamp(reverb,0,100,10),delay:clamp(delay,0,100,0),time:delaySeconds(bpm,rate,delayBeats)},previous=this.fxValues||{},now=this.audio.ctx.currentTime;if(next.reverb!==previous.reverb)this.room.gain.setTargetAtTime(next.reverb/100*.9,now,.08);if(next.delay!==previous.delay)this.echoWet.gain.setTargetAtTime(next.delay/100*.7,now,.08);if(next.time!==previous.time)this.echo.delayTime.setTargetAtTime(next.time,now,delayGlide);this.fxValues=next;}
 stop(){if(this.output)this.output.gain.setTargetAtTime(0,this.audio.ctx.currentTime,.01);this.level=null;for(const source of this.sources){source.chromaflowCancelSession?.(this.audio.ctx.currentTime);try{source.stop();}catch{}}this.sources.clear();}
 hit(key,when,velocity=1,{pitch=null}={}){const voice=drumVoices[key];if(!voice||velocity<=0||(this.audio.recordingEnd!=null&&when>=this.audio.recordingEnd))return;this.connect();const c=this.audio.ctx,t=Math.max(c.currentTime+.002,when),level=voice.gain*velocity;
 const hitSources=[];
 const frequency=440*Math.pow(2,((Number.isFinite(pitch)?pitch:60)-69)/12);
 const track=(source,end,nodes=[])=>{source.chromaflowStart=t;hitSources.push(source);this.sources.add(source);source.onended=()=>{this.sources.delete(source);try{source.disconnect();nodes.forEach(node=>node.disconnect());}catch{}};source.start(t);source.stop(t+end+.02);};
 const tone=(frequency,decay,amount=1,type='sine',endFrequency=frequency)=>{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),t+Math.min(decay,.14));g.gain.setValueAtTime(.00001,t);g.gain.linearRampToValueAtTime(level*amount,t+.004);g.gain.exponentialRampToValueAtTime(.00001,t+decay);o.connect(g);g.connect(this.bus);track(o,decay,[g]);};
 const noise=(frequency,decay,amount,type='highpass',q=.7,clap=false)=>{const src=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();src.buffer=this.noise;filter.type=type;filter.frequency.value=frequency;filter.Q.value=q;g.gain.setValueAtTime(.00001,t);if(clap){for(let i=0;i<3;i++){g.gain.linearRampToValueAtTime(level*amount,t+i*.012+.002);g.gain.exponentialRampToValueAtTime(.0001,t+i*.012+.01);}g.gain.linearRampToValueAtTime(level*amount*.7,t+.038);}else g.gain.linearRampToValueAtTime(level*amount,t+.003);g.gain.exponentialRampToValueAtTime(.00001,t+decay);src.connect(filter);filter.connect(g);g.connect(this.bus);track(src,decay,[g,filter]);};
 switch(voice.type){
 case 'feltmallet':tone(frequency,.55,.7);tone(frequency*3.97,.18,.15);tone(frequency*9.9,.06,.035);break;
 case 'glass':tone(frequency,.38,.55);tone(frequency*2.76,.22,.2);tone(frequency*5.4,.12,.06);break;
 case 'droplet':tone(frequency*1.8,.16,.65,'sine',frequency);tone(frequency*3,.07,.08,'sine',frequency*2);break;
 case 'kalimba':tone(frequency,.42,.65);tone(frequency*2,.12,.12);tone(frequency*5.9,.045,.06);break;
 case 'bottle':tone(frequency,.3,.65);noise(2100,.065,.16,'bandpass',2);break;
 case 'pulse':tone(frequency,.16,.5,'triangle',frequency);tone(frequency*.5,.2,.3);break;
 case 'paper':noise(1400,.15,.75,'bandpass',.65);noise(5500,.045,.15);break;
 case 'pebble':tone(1450,.035,.4);tone(2370,.024,.2);noise(2600,.028,.12,'bandpass',1.4);break;
 case 'metal':tone(1320,.12,.33);tone(1837,.095,.2);tone(2915,.06,.13);break;
 case 'breath':noise(850,.26,.6,'bandpass',.6);noise(2900,.12,.12,'bandpass',.5);break;
 case 'kick':tone(145,.48,1,'sine',43);break;case 'softkick':tone(90,.68,1,'sine',34);break;case 'snare':tone(180,.15,.35,'triangle',125);noise(1800,.20,.5,'bandpass',.7);break;case 'rim':tone(650,.07,.42,'triangle',410);tone(1850,.04,.17);break;case 'clap':noise(1550,.23,.55,'bandpass',.7,true);break;case 'hat':noise(6800,.055,.7);break;case 'shaker':noise(4800,.13,.65,'bandpass',1.2);break;case 'tom':tone(190,.42,.9,'sine',80);break;case 'conga':tone(360,.20,.7,'sine',210);tone(620,.08,.15,'triangle');break;case 'wood':tone(800,.085,.55,'sine',660);tone(1180,.06,.3);break;}
 const cancel=this.audio.onSessionEvent?.('drum',{voice:key,velocity,pitch},t);let cancelled=false;for(const source of hitSources)source.chromaflowCancelSession=at=>{if(!cancelled){cancelled=true;cancel?.(at);}};return hitSources;
 }
}
export class RhythmEngine{
 constructor(audio,getConfig,onEvent,{setTimer=(callback,delay)=>globalThis.setInterval(callback,delay),clearTimer=id=>globalThis.clearInterval(id),random=Math.random,getChordAt=()=>'Cmaj7'}={}){this.getChordAt=getChordAt;this.audio=audio;this.getConfig=getConfig;this.onEvent=onEvent;this.synth=new PercussionSynth(audio);this.timer=null;this.nextStep=0;this.origin=0;this.setTimer=setTimer;this.clearTimer=clearTimer;this.random=random;}
 start(positionBeats=0,origin=null){this.stop();if(!this.audio.ctx||!this.audio.playing||!this.getConfig().enabled)return;this.synth.connect();const cfg=this.getConfig();this.synth.setLevel(cfg.volume);this.synth.setEffects(cfg,this.audio.bpm);this.origin=origin??(this.audio.ctx.currentTime+.04-positionBeats*60/this.audio.bpm);this.nextStep=Math.max(0,Math.ceil(positionBeats*4*cfg.rate-1e-5));try{this.tick();this.timer=this.setTimer(()=>this.tick(),25);}catch(error){this.stop();throw error;}}
 trim(at){for(const source of this.synth.sources||[])if(source.chromaflowStart>=at){try{source.stop();}catch{}}}
 freeze(at){if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;for(const source of this.synth.sources||[])if(source.chromaflowStart>=at){try{source.stop();}catch{}}}
 updateEffects(){if(this.synth.bus)this.synth.setEffects(this.getConfig(),this.audio.bpm);}
 stop(){if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;this.synth.stop();}
 tick(){if(!this.audio.playing||!this.getConfig().enabled){this.stop();return;}const cfg=this.getConfig(),now=this.audio.ctx.currentTime,bpm=this.audio.bpm;this.synth.setLevel(cfg.volume);this.synth.setEffects(cfg,bpm);const size=60/bpm/4/cfg.rate;if(this.origin+stepTime(this.nextStep,bpm,cfg.rate,cfg.swing)<now-.1)this.nextStep=Math.max(this.nextStep,Math.ceil((now-this.origin)/size));let guard=0;
 while(guard++<32){const index=this.nextStep,time=this.origin+stepTime(index,bpm,cfg.rate,cfg.swing);if(time>now+schedulingLookahead())break;this.nextStep++;if(time<now-.02)continue;const step=index%16;this.onEvent({type:'step',step,time});cfg.lanes.forEach((lane,i)=>{const amount=lane.steps[step];if(lane.muted||lane.voice==='off'||!drumVoices[lane.voice]||lane.level<=0||!amount)return;const human=cfg.humanize/100,hitTime=Math.max(now+.003,time+(this.random()*2-1)*.014*human),velocity=amount*lane.level/100*(1-human*.2*this.random());const pitch=drumVoices[lane.voice].degree===undefined?null:percussionPitch(lane.voice,this.getChordAt(hitTime));this.synth.hit(lane.voice,hitTime,velocity,{pitch});this.onEvent({type:'hit',step,lane:i,voice:lane.voice,time:hitTime,velocity,pitch,motion:drumVoices[lane.voice].motion});});}
 }
}
