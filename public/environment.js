// Procedural environmental beds: no recordings, samples or remote audio assets.
export const environmentPresets={
 rain:{name:'Soft rain',description:'A soft curtain of rain with scattered, close-up patter.',seed:137},
 shore:{name:'Tidal shore',description:'Slow rolling surf, low water movement and a breath of foam.',seed:271},
 wind:{name:'Canopy wind',description:'Broad air currents with small, rustling leaves.',seed:419},
 night:{name:'Summer night',description:'A quiet air bed with irregular, overlapping insect chirps.',seed:557},
 hearth:{name:'Hearth',description:'A warm, low fire with scattered crackles and tiny pops.',seed:683}
};
export const environmentDefaults={enabled:false,preset:'rain',volume:25,activity:40,tone:50};
export function normalizeEnvironment(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 const number=(key,fallback)=>Number.isFinite(Number(raw[key]))?Math.max(0,Math.min(100,Number(raw[key]))):fallback;
 return {enabled:raw.enabled===true,preset:Object.hasOwn(environmentPresets,raw.preset)?raw.preset:'rain',volume:number('volume',25),activity:number('activity',40),tone:number('tone',50)};
}
export const ENVIRONMENT_SECONDS=12,ENVIRONMENT_SAMPLE_RATE=16000;
const tau=Math.PI*2,clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
function randomSource(seed){let state=seed;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
function level(samples,target){let mean=0;for(const value of samples)mean+=value;mean/=samples.length;let square=0;for(let i=0;i<samples.length;i++){samples[i]-=mean;square+=samples[i]**2;}const scale=target/Math.max(1e-9,Math.sqrt(square/samples.length));for(let i=0;i<samples.length;i++)samples[i]=Math.tanh(samples[i]*scale);}
// Exported as pure DSP for deterministic/spectral/seam checks. Colored noise is
// warmed for one full cycle; transients wrap around the same periodic buffers.
export function synthesizeEnvironment(preset='rain',sampleRate=ENVIRONMENT_SAMPLE_RATE){
 preset=Object.hasOwn(environmentPresets,preset)?preset:'rain';
 const n=Math.round(sampleRate*ENVIRONMENT_SECONDS),base=[],detail=[];
 for(let channel=0;channel<2;channel++){
  const random=randomSource(environmentPresets[preset].seed+channel*7919),white=Float32Array.from({length:n},()=>random()*2-1),bed=new Float32Array(n),texture=new Float32Array(n);
  let pink=0,brown=0,air=0;
  for(let i=0;i<n*2;i++){
   const j=i%n,w=white[j];pink=pink*.965+w*.035;brown=brown*.997+w*.003;air=air*.55+w*.45;if(i<n)continue;
   const t=j/sampleRate,phase=channel*.35;
   if(preset==='rain'){bed[j]=air*.55+pink*.3;texture[j]=(w-air)*.025;}
   if(preset==='shore'){const swell=.24+.76*(.5+.5*Math.sin(tau*t/6+phase))**1.7;bed[j]=brown*3*swell+pink*.18;texture[j]=air*(.5+.5*Math.sin(tau*t/6+phase-.65))**4;}
   if(preset==='wind'){const gust=.4+.6*(.5+.5*Math.sin(tau*t/12+phase))**2;bed[j]=brown*2.5*gust+pink*.25;texture[j]=(pink-brown)*(.35+.65*(.5+.5*Math.sin(tau*t/4+phase)));}
   if(preset==='night'){bed[j]=brown*1.2+pink*.15;}
   if(preset==='hearth'){bed[j]=(brown*2.6+pink*.2)*(.8+.2*Math.sin(tau*t/4+phase));}
  }
  // Short, deterministic grains supply the environmental details. Random phase
  // offsets decorrelate the stereo image without pretending to be melody notes.
  const count={rain:440,shore:0,wind:34,night:28,hearth:110}[preset];
  for(let event=0;event<count;event++){
   const start=Math.floor(random()*n),duration=preset==='rain'?.008+random()*.035:preset==='wind'?.12+random()*.55:preset==='night'?.13+random()*.35:.004+random()*.075;
   const length=Math.max(2,Math.round(duration*sampleRate)),frequency=1700+random()*1500,weight=.25+random()*.75;
   for(let k=0;k<length;k++){
    const j=(start+k)%n,t=k/sampleRate,u=k/length;
    const envelope=preset==='wind'?Math.sin(Math.PI*u)**2:preset==='night'?Math.sin(Math.PI*u)**2*(.35+.65*Math.sin(tau*t*42)**2):Math.min(1,t/.0008)*Math.exp(-u*7);
    const wave=preset==='night'?Math.sin(tau*(frequency*t+1.7*Math.sin(tau*t*28))):white[j];
    texture[j]+=wave*envelope*weight;
   }
  }
  level(bed,preset==='night'?.075:.17);level(texture,preset==='hearth'?.11:.15);
  // A tiny periodic interpolation region removes a possible low-frequency join
  // jump without a fade-to-silence once per bed cycle.
  for(const samples of [bed,texture]){const width=Math.round(sampleRate*.004),first=samples[0];for(let k=0;k<width;k++){const j=n-width+k,t=(k+1)/width;samples[j]=samples[j]*(1-t)+first*t;}}
  base.push(bed);detail.push(texture);
 }
 return {base,detail,sampleRate,seconds:ENVIRONMENT_SECONDS};
}
function envelope(param,at,fade,outgoing=false,amplitude=1){
 param.cancelScheduledValues(at);param.setValueAtTime(outgoing?amplitude:0,at);
 for(let i=1;i<=32;i++)param.linearRampToValueAtTime(amplitude*(outgoing?Math.cos(i/32*Math.PI/2):Math.sin(i/32*Math.PI/2)),at+fade*i/32);
}
function voiceLevel(voice,at){return voice.retired?voice.retireLevel*Math.cos(clamp((at-voice.retireAt)/voice.retireFade)*Math.PI/2):Math.sin(clamp((at-voice.at)/voice.fade)*Math.PI/2);}
function ramp(param,value,at,time=.12){param.setTargetAtTime(value,at,time);}
// At most five immutable stereo beds per AudioContext, shared by live and replay.
const contextBuffers=new WeakMap();
export class EnvironmentSynth{
 constructor(audio){this.audio=audio;this.cache=new Map();this.voices=new Set();this.current=null;this.output=null;this.config=null;}
 connect(){if(this.output)return;const c=this.audio.ctx;this.base=c.createGain();this.base.gain.value=.72;this.details=c.createGain();this.details.gain.value=0;this.filter=c.createBiquadFilter();this.filter.type='lowpass';this.filter.Q.value=.45;this.output=c.createGain();this.output.gain.value=0;this.base.connect(this.filter);this.details.connect(this.filter);this.filter.connect(this.output);this.output.connect(this.audio.sceneInput||this.audio.limiter);}
 buffers(preset){if(this.cache.has(preset))return this.cache.get(preset);const c=this.audio.ctx;let shared=contextBuffers.get(c);if(!shared){shared=new Map();contextBuffers.set(c,shared);}if(shared.has(preset)){const buffers=shared.get(preset);this.cache.set(preset,buffers);return buffers;}const data=synthesizeEnvironment(preset),buffers={};for(const key of ['base','detail']){const b=c.createBuffer(2,data.base[0].length,data.sampleRate);data[key].forEach((samples,ch)=>b.copyToChannel(samples,ch));buffers[key]=b;}shared.set(preset,buffers);this.cache.set(preset,buffers);return buffers;}
 prepare(raw){const config=normalizeEnvironment(raw);if(this.audio.ctx&&config.enabled&&config.volume>0)this.buffers(config.preset);}
 retire(voice,at,fade=.3){
  if(!voice||voice.retired)return;const amplitude=voiceLevel(voice,at);Object.assign(voice,{retired:true,retireAt:at,retireFade:fade,retireLevel:amplitude});
  for(const gain of voice.gains)envelope(gain.gain,at,fade,true,amplitude);
  for(const source of voice.sources)try{source.stop(at+fade+.01);}catch{}
 }
 apply(raw,at=this.audio.ctx?.currentTime||0,{origin=at,restart=false,fade=.3}={}){
  const config=normalizeEnvironment(raw);if(!this.audio.ctx)return;const c=this.audio.ctx;at=Math.max(c.currentTime,at);fade=clamp(fade,.015,.3);this.config=config;
  if(!config.enabled||config.volume===0){if(this.output)ramp(this.output.gain,0,at,.08);this.retire(this.current,at,fade);this.current=null;return;}
  const buffers=this.buffers(config.preset);at=Math.max(c.currentTime,at);this.connect();ramp(this.output.gain,config.volume/100*.28,at);ramp(this.details.gain,.05+config.activity/100*.95,at);ramp(this.filter.frequency,Math.min(c.sampleRate*.45,800*Math.pow(12.5,config.tone/100)),at,.16);
  if(this.current?.preset===config.preset&&!restart)return;
  const voice={preset:config.preset,at,fade,gains:[],sources:[],ended:0,retired:false};
  const offset=((at-origin)%ENVIRONMENT_SECONDS+ENVIRONMENT_SECONDS)%ENVIRONMENT_SECONDS;
  for(const [key,destination] of [['base',this.base],['detail',this.details]]){
   const source=c.createBufferSource(),gain=c.createGain();source.buffer=buffers[key];source.loop=true;gain.gain.value=0;envelope(gain.gain,at,fade);source.connect(gain);gain.connect(destination);voice.sources.push(source);voice.gains.push(gain);
   source.onended=()=>{source.disconnect();gain.disconnect();voice.ended++;if(voice.ended===2)this.voices.delete(voice);if(this.disposing&&!this.voices.size)this.disconnect();};source.start(at,offset);
  }
  this.retire(this.current,at,fade);this.current=voice;this.voices.add(voice);
  // Rapid preset edits cannot leave a growing collection of fading sources.
  if(this.voices.size>4)for(const old of [...this.voices].slice(0,this.voices.size-4)){for(const source of old.sources)try{source.stop(at+.01);}catch{}this.voices.delete(old);}
 }
 stop(at=this.audio.ctx?.currentTime||0){if(!this.audio.ctx)return;at=Math.max(at,this.audio.ctx.currentTime);if(this.output){this.output.gain.cancelScheduledValues(at);ramp(this.output.gain,0,at,.025);}for(const voice of this.voices){for(const gain of voice.gains){const p=gain.gain;p.cancelScheduledValues(at);p.setValueAtTime(voiceLevel(voice,at),at);ramp(p,0,at,.025);}for(const source of voice.sources)try{source.stop(at+.15);}catch{}}this.current=null;}
 disconnect(){for(const node of [this.base,this.details,this.filter,this.output])node?.disconnect();this.output=null;}
 dispose(){this.disposing=true;this.stop();this.cache.clear();if(!this.voices.size)this.disconnect();}
}
