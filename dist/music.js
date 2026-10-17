import {shapeExpression} from './gestures.js';
import {delaySeconds,delayGlide} from './timing.js';
export const instrumentGroups=['Experimental textures','Pads & atmosphere','Strings & choir','Air & woodwind','Keys & bells'];
export const instruments={
 piano:{name:'Grand piano',file:'0000',gain:.30,group:'Keys & bells'},
 rhodes:{name:'Electric piano',file:'0040',gain:.34,group:'Keys & bells'},
 celesta:{name:'Celesta',file:'0080',gain:.28,group:'Keys & bells'},
 musicbox:{name:'Music box',file:'0100',gain:.22,group:'Keys & bells'},
 vibes:{name:'Vibraphone',file:'0110',gain:.32,group:'Keys & bells'},
 bells:{name:'Tubular bells',file:'0140',gain:.20,group:'Keys & bells'},
 strings:{name:'Warm strings',file:'0480',gain:.13,group:'Strings & choir'},
 pad:{name:'Warm pad',file:'0890',gain:.26,group:'Pads & atmosphere'},
 slowstrings:{name:'Slow strings',file:'0490',gain:.18,group:'Strings & choir',attack:.55,duration:5,release:1.5},
 synthstrings:{name:'Synth strings',file:'0500',gain:.20,group:'Strings & choir',attack:.45,duration:4.8,release:1.4},
 choir:{name:'Choir aahs',file:'0520',gain:.17,group:'Strings & choir',attack:.45,duration:4.8,release:1.4},
 oohs:{name:'Voice oohs',file:'0530',gain:.19,group:'Strings & choir',attack:.4,duration:4.6,release:1.3},
 flute:{name:'Flute',file:'0730',gain:.25,group:'Air & woodwind',attack:.18,duration:3.8,release:1},
 panflute:{name:'Pan flute',file:'0750',gain:.23,group:'Air & woodwind',attack:.22,duration:3.8,release:1},
 ocarina:{name:'Ocarina',file:'0790',gain:.22,group:'Air & woodwind',attack:.25,duration:4,release:1.1},
 newage:{name:'New age pad',file:'0880',gain:.075,group:'Pads & atmosphere',attack:.75,duration:3.8,release:1.15,tone:{type:'lowpass',from:2800,to:1700,time:1.8,q:.45}},
 choirpad:{name:'Choir pad',file:'0910',gain:.19,group:'Pads & atmosphere',attack:.65,duration:5.2,release:1.6},
 bowedpad:{name:'Bowed pad',file:'0920',gain:.20,group:'Pads & atmosphere',attack:.6,duration:5.2,release:1.6},
 halo:{name:'Halo pad',file:'0940',gain:.21,group:'Pads & atmosphere',attack:.7,duration:5.4,release:1.7},
 sweeppad:{name:'Sweep pad',file:'0950',gain:.20,group:'Pads & atmosphere',attack:.75,duration:5.4,release:1.7},
 prismrain:{name:'Prism rain',file:'0960',gain:.20,group:'Experimental textures',attack:.28,duration:4.6,release:1.4,tone:{type:'lowpass',from:1100,to:6200,time:2.2,q:.7}},
 soundtrack:{name:'Distant soundtrack',file:'0970',gain:.16,group:'Experimental textures',attack:.8,duration:6,release:1.8,tone:{type:'lowpass',from:4300,to:850,time:3.5,q:.65}},
 crystal:{name:'Crystal bloom',file:'0980',gain:.23,group:'Experimental textures',attack:.18,duration:3.8,release:1.2,tone:{type:'lowpass',from:7200,to:1900,time:2,q:.65}},
 deepatmosphere:{name:'Deep atmosphere',file:'0990',gain:.26,group:'Experimental textures',attack:.4,duration:6.2,release:1.8,tone:{type:'lowpass',from:950,to:4800,time:3.3,q:.75}},
 prismaticair:{name:'Prismatic air',file:'1000',gain:.16,group:'Experimental textures',attack:.32,duration:4.5,release:1.4,tone:{type:'lowpass',from:1500,to:7500,time:2.4,q:.65}},
 alienchorus:{name:'Alien chorus',file:'1010',gain:.16,group:'Experimental textures',attack:.65,duration:5.2,release:1.6,tone:{type:'bandpass',from:450,to:2300,time:2.9,q:.65}},
 echofragments:{name:'Echo fragments',file:'1020',gain:.19,group:'Experimental textures',attack:.25,duration:4.2,release:1.4,tone:{type:'lowpass',from:5800,to:1500,time:2.3,q:.7}},
 orbitalsignal:{name:'Orbital signal',file:'1030',gain:.20,group:'Experimental textures',attack:.28,duration:5,release:1.5,tone:{type:'bandpass',from:1400,to:420,time:3,q:.45}}

};
// A gradual swell and long release keep the new sustained voices gentle.
export function softEnvelope(voice){return [{duration:0,volume:0},{duration:voice.attack,volume:1},{duration:.65,volume:.82},{duration:voice.duration-voice.attack-.65-voice.release,volume:.68},{duration:voice.release,volume:0}];}
export const progressions={daydream:['Cmaj7','Am7','Fmaj7','G'],weightless:['Dmaj7','A','Bm7','Gmaj7'],afterhours:['Am7','Fmaj7','Cmaj7','Em7'],openwater:['Fmaj7','Cmaj7','Em7','Am7'],
 stilllight:["Dbmaj9","Fm7","Bbm9","Gbmaj9"],
 tidalglass:["Dsus2","Aadd9","Gmaj7","Esus4"],
 bluehour:["Dm9","G9","Cmaj9","Am9"],
 dorianbloom:["Dm9","G6","Em7","G6"],
 velvetundertow:["Am9","Fmaj9","Dm9","Em7"],
 borrowedlight:["Cmaj9","Em7","Fmaj9","Fm6"],
 chromaticorbit:["Cmaj9","Abmaj9","Emaj9","Abmaj9"],
 slowdescent:["Fmaj9","Em7","Dm9","C6"]
};
export const progressionDetails={
 "stilllight": {
  "name": "Still light",
  "text": "Warm ninths and shared tones, with a soft return to the beginning.",
  "pair": "Night garden",
  "length": 8
 },
 "tidalglass": {
  "name": "Tidal glass",
  "text": "Open, suspended harmony; the last chord leaves a little air in the loop.",
  "pair": "Glass organisms",
  "length": 16
 },
 "bluehour": {
  "name": "Blue hour",
  "text": "A jazz-rooted ii–V–I–vi turnaround, softened with ninths.",
  "pair": "Night garden",
  "length": 8
 },
 "dorianbloom": {
  "name": "Dorian bloom",
  "text": "Minor warmth with a bright Dorian sixth, circling without a strong cadence.",
  "pair": "Breathing room",
  "length": 16
 },
 "velvetundertow": {
  "name": "Velvet undertow",
  "text": "A darker minor loop with warm extensions and a gentle pull back home.",
  "pair": "Submerged cinema",
  "length": 16
 },
 "borrowedlight": {
  "name": "Borrowed light",
  "text": "A borrowed minor-IV chord brings a wistful turn before the loop opens again.",
  "pair": "Soft horizon",
  "length": 8
 },
 "chromaticorbit": {
  "name": "Chromatic orbit",
  "text": "Parallel major ninths travel through distant keys. Expect deliberate tension in long echoes.",
  "pair": "Strange attractor",
  "length": 16
 },
 "slowdescent": {
  "name": "Slow descent",
  "text": "A falling IV–iii–ii–I bass outline, settling into an open major-sixth color.",
  "pair": "Still water",
  "length": 8
 }
};
export const soundscapes={
 stillwater:{voices:['piano','vibes','strings','celesta'],reverb:65,delay:35,text:'Soft keys, warm strings, and a little shimmer.'},
 glasshouse:{voices:['celesta','musicbox','vibes','bells'],reverb:78,delay:45,text:'Delicate glass tones in a wide, luminous space.'},
 nightgarden:{voices:['rhodes','pad','strings','vibes'],reverb:82,delay:28,text:'Velvety keys and slow, moonlit textures.'},
 softhorizon:{voices:['pad','halo','slowstrings','choir'],reverb:74,delay:35,text:'Slow strings, distant voices, and softly rising pads.'},
 breathingroom:{voices:['flute','panflute','oohs','sweeppad'],reverb:76,delay:27,text:'Breathy winds and voices drifting through a slow swell.'},
 glassorganisms:{voices:['crystal','prismrain','bowedpad','halo'],reverb:86,delay:63,text:'Crystals and prismatic rain open into bowed, living glass.'},
 submergedcinema:{voices:['soundtrack','deepatmosphere','choirpad','slowstrings'],reverb:91,delay:32,text:'Distant film-score fragments and slow, submerged spectral swells.'},
 strangeattractor:{voices:['alienchorus','orbitalsignal','sweeppad','synthstrings'],reverb:75,delay:57,text:'Alien choruses and descending radio-like signals orbit a restless synth haze.'},
 orbitalrelay:{voices:['echofragments','prismaticair','newage','oohs'],reverb:72,delay:84,text:'Echo fragments, opening spectral air, and voices relayed through space.'}
};
const roots={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
export function parseChord(symbol){const m=/^([A-G])([#b]?)(maj9|maj7|m9|m7|m6|m|9|7|6|sus2|sus4|add9)?$/.exec(symbol.trim());if(!m)throw new Error('Use chords such as Cmaj9, Dm9, G9, Fm6, C6, or Dsus2.');let root=roots[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);root=(root+12)%12;const shape={maj9:[0,4,7,11,14],m9:[0,3,7,10,14],9:[0,4,7,10,14],6:[0,4,7,9],m6:[0,3,7,9],maj7:[0,4,7,11],m7:[0,3,7,10],m:[0,3,7],7:[0,4,7,10],sus2:[0,2,7],sus4:[0,5,7],add9:[0,4,7,14]}[m[3]]||[0,4,7];return shape.map(n=>48+root+n);}
export function normalizeOctaveRange({down=0,up=1}={}){
 const octave=(value,fallback)=>Number.isFinite(Number(value))?Math.max(0,Math.min(3,Math.round(Number(value)))):fallback;
 return {down:octave(down,0),up:octave(up,1)};
}
export function pitchesForRange(chord,voice=0,range={}){
 const {down,up}=normalizeOctaveRange(range),base=parseChord(chord),notes=[];
 for(let octave=-down;octave<=up;octave++)for(const note of base)notes.push(note+octave*12-(voice===2?12:0));
 // Extended chords can overlap registers; always move upward from left to right.
 return [...new Set(notes)].filter(note=>note>=0&&note<=127).sort((a,b)=>a-b);
}
export function pitchForPosition(chord,x,voice=0,range={}){
 const notes=pitchesForRange(chord,voice,range),position=Number.isFinite(x)?Math.max(0,Math.min(1,x)):0;
 return notes[Math.min(notes.length-1,Math.floor(position*notes.length))];
}
export function noteName(pitch){return ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][pitch%12]+(Math.floor(pitch/12)-1);}
export class AmbientAudio{
 constructor(){this.ctx=null;this.player=null;this.loaded=new Map();this.playing=false;this.volume=.55;this.reverb=.65;this.delay=.35;this.bpm=56;this.rhythmRate=1;this.delayBeats=.75;this.echoTimeValue=null;this.performance={cutoff:18000,resonance:.4,pan:0,gain:1};this.performanceApplied={};}
 async initialize(){if(this.ctx){await this.ctx.resume();return;}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('This browser does not support Web Audio.');if(!window.WebAudioFontPlayer)throw new Error('The instrument engine could not load. Reload to retry.');this.ctx=new AC();await this.ctx.resume();const c=this.ctx;this.player=new window.WebAudioFontPlayer();this.bus=c.createGain();this.filter=c.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=6700;this.filter.Q.value=.3;this.bus.connect(this.filter);this.master=c.createGain();this.master.gain.value=0;this.limiter=c.createDynamicsCompressor();this.limiter.threshold.value=-16;this.limiter.knee.value=18;this.limiter.ratio.value=5;this.limiter.attack.value=.005;this.limiter.release.value=.8;this.sceneFilter=c.createBiquadFilter();this.sceneFilter.type='lowpass';this.sceneFilter.frequency.value=Math.min(18000,c.sampleRate*.45);this.sceneFilter.Q.value=.4;this.sceneGain=c.createGain();this.limiter.connect(this.sceneFilter);this.scenePan=c.createStereoPanner?c.createStereoPanner():null;if(this.scenePan){this.sceneFilter.connect(this.scenePan);this.scenePan.connect(this.sceneGain);}else this.sceneFilter.connect(this.sceneGain);this.sceneGain.connect(this.master);this.master.connect(c.destination);this.applyPerformance();this.dry=c.createGain();this.dry.gain.value=.7;this.filter.connect(this.dry);this.dry.connect(this.limiter);this.verb=c.createConvolver();const length=c.sampleRate*5,ir=c.createBuffer(2,length,c.sampleRate);for(let ch=0;ch<2;ch++){const data=ir.getChannelData(ch);let prev=0;for(let i=0;i<length;i++){prev=prev*.6+(Math.random()*2-1)*.4;data[i]=prev*Math.pow(1-i/length,2.8)*(Math.min(1,i/900));}}this.verb.buffer=ir;this.wet=c.createGain();this.filter.connect(this.verb);this.verb.connect(this.wet);this.wet.connect(this.limiter);this.echo=c.createDelay(8);this.echo.delayTime.value=delaySeconds(this.bpm,this.rhythmRate,this.delayBeats);this.feedback=c.createGain();this.feedback.gain.value=.36;this.echoTone=c.createBiquadFilter();this.echoTone.frequency.value=3100;this.echo.connect(this.echoTone);this.echoTone.connect(this.feedback);this.feedback.connect(this.echo);this.echoWet=c.createGain();this.filter.connect(this.echo);this.echo.connect(this.echoWet);this.echoWet.connect(this.limiter);this.echoWet.connect(this.verb);this.update();}
 async load(key){if(this.loaded.has(key))return this.loaded.get(key);const promise=(async()=>{const name=instruments[key];if(!name)throw new Error('Unknown instrument');const variable='_tone_'+name.file+'_FluidR3_GM_sf2_file';if(!window[variable])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='vendor/'+name.file+'_FluidR3_GM_sf2_file.js';const timeout=setTimeout(()=>{script.remove();reject(new Error('Instrument loading timed out. Try again.'));},20000);script.onload=()=>{clearTimeout(timeout);resolve();};script.onerror=()=>{clearTimeout(timeout);script.remove();reject(new Error('Could not load '+name.name+'. Try again.'));};document.head.append(script);});const preset=window[variable];await Promise.all(preset.zones.map(async zone=>{if(!zone.buffer&&zone.file){const data=Uint8Array.from(atob(zone.file),s=>s.charCodeAt(0));zone.buffer=await this.ctx.decodeAudioData(data.buffer);}}));this.player.adjustPreset(this.ctx,preset);if(name.attack)preset.zones.forEach(zone=>{zone.ahdsr=softEnvelope(name);});return preset;})();this.loaded.set(key,promise);try{return await promise;}catch(e){this.loaded.delete(key);throw e;}}
 update(){if(!this.ctx||!this.master)return;const now=this.ctx.currentTime;this.master.gain.setTargetAtTime(this.playing?this.volume*.65:0,now,.08);this.wet.gain.setTargetAtTime(this.reverb*.9,now,.12);this.echoWet.gain.setTargetAtTime(this.delay*.7,now,.1);this.syncDelayTime();}
 setRhythmTiming({rate=1,delayBeats=.75}={}){this.rhythmRate=rate;this.delayBeats=delayBeats;this.syncDelayTime();}
 syncDelayTime(){if(!this.echo)return;const time=delaySeconds(this.bpm,this.rhythmRate,this.delayBeats);if(time!==this.echoTimeValue){this.echo.delayTime.setTargetAtTime(time,this.ctx.currentTime,delayGlide);this.echoTimeValue=time;}}
 setPerformance(settings={}){const safe=(v,lo,hi,fallback)=>Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):fallback;this.performance={cutoff:safe(settings.cutoff,350,18000,18000),resonance:safe(settings.resonance,.3,1.1,.4),pan:safe(settings.pan,-.5,.5,0),gain:safe(settings.gain,.72,1,1)};this.applyPerformance();}
 applyPerformance(){if(!this.ctx||!this.sceneFilter)return;const p={...this.performance,cutoff:Math.min(this.performance.cutoff,this.ctx.sampleRate*.45)},last=this.performanceApplied,now=this.ctx.currentTime;for(const [key,param,epsilon] of [['cutoff',this.sceneFilter.frequency,8],['resonance',this.sceneFilter.Q,.005],['pan',this.scenePan?.pan,.002],['gain',this.sceneGain.gain,.001]]){if(param&&(last[key]===undefined||Math.abs(last[key]-p[key])>epsilon)){param.setTargetAtTime(p[key],now,.08);last[key]=p[key];}}}
 setPlaying(on){this.playing=on;if(!on&&this.player)this.player.cancelQueue(this.ctx);this.update();}
 async note(key,pitch,expression=null,{when=null,signal=null,target=null,noteLength=null,noteEnvelope=null,pitchGlide=null}={}){if(!this.playing||!this.ctx)return;const preset=await this.load(key);if(!this.playing||signal?.aborted||(when!==null&&this.ctx.currentTime>when))return;const instrument=instruments[key],shape=expression||noteLength!==null||noteEnvelope?shapeExpression({...instrument,key},expression||{}):null;if(shape&&noteLength!==null){const length=Math.max(.08,Math.min(9,Number(noteLength)||.4)),scale=length/shape.duration;shape.envelope=shape.envelope.map(stage=>({...stage,duration:stage.duration*scale}));shape.duration=length;}if(shape&&Array.isArray(noteEnvelope)&&noteEnvelope.length){const stages=noteEnvelope.map(stage=>({duration:Math.max(0,Number(stage.duration)||0),volume:Math.max(0,Math.min(1,Number(stage.volume)||0))})),total=stages.reduce((sum,stage)=>sum+stage.duration,0);if(total>=.001&&total<=9){shape.envelope=stages;shape.duration=total;}}const level=instrument.gain*(.85+Math.random()*.15)*(shape?.velocity||1),duration=shape?.duration||(instrument.duration||(['strings','pad'].includes(key)?3.8:2.7));const active=(this.player.envelopes||[]).filter(e=>!e.performanceReleasing&&e.when+e.duration>this.ctx.currentTime);if(active.length>=64){active.sort((a,b)=>a.when-b.when);const oldest=active[0],now=this.ctx.currentTime;oldest.performanceReleasing=true;oldest.gain.cancelScheduledValues(now);oldest.gain.setTargetAtTime(.00001,now,.01);oldest.audioBufferSourceNode.stop(now+.05);oldest.when=now;oldest.duration=.05;}const voicePreset=shape?{...preset,zones:preset.zones.map(zone=>({...zone,ahdsr:shape.envelope}))}:preset;const envelope=this.player.queueWaveTable(this.ctx,target||this.bus,voicePreset,when===null?this.ctx.currentTime+.008:Math.max(this.ctx.currentTime+.002,when),pitch,duration,level);if(envelope){
 // Bend the target sample in semitone space; keep its sample zone and amplitude envelope.
 const rate=envelope.audioBufferSourceNode?.playbackRate;
 if(rate&&pitchGlide&&Number.isFinite(pitchGlide.from)&&Number.isFinite(pitchGlide.time)&&Number.isFinite(pitchGlide.amount)){
  const seconds=Math.max(0,Math.min(duration,pitchGlide.time)),amount=Math.max(0,Math.min(1,pitchGlide.amount)),targetRate=rate.value;
  if(seconds>0&&amount>0&&pitchGlide.from!==pitch&&targetRate>0){
   const semitones=Math.max(-127,Math.min(127,pitchGlide.from-pitch))*amount,at=envelope.when;
   rate.setValueAtTime(targetRate*Math.pow(2,semitones/12),at);rate.exponentialRampToValueAtTime(targetRate,at+seconds);
  }
 }
 envelope.performanceReleasing=false;if(signal)signal.addEventListener('abort',()=>{if(this.ctx.currentTime<when){try{envelope.audioBufferSourceNode.stop();}catch{}envelope.cancel();}},{once:true});}if((shape||instrument.tone)&&envelope?.audioBufferSourceNode){const source=envelope.audioBufferSourceNode,tone=instrument.tone,filter=this.ctx.createBiquadFilter(),pan=this.ctx.createStereoPanner?this.ctx.createStereoPanner():null;filter.type=tone?.type||'lowpass';if(tone){const scale=shape?Math.max(.25,shape.cutoff/14000):1,limit=this.ctx.sampleRate*.45,frequency=value=>Math.max(80,Math.min(limit,value*scale)),at=Math.max(this.ctx.currentTime,envelope.when??when??this.ctx.currentTime);filter.frequency.setValueAtTime(frequency(tone.from),at);filter.frequency.exponentialRampToValueAtTime(frequency(tone.to),at+Math.min(tone.time,duration*.8));}else filter.frequency.value=Math.min(shape.cutoff,this.ctx.sampleRate*.45);filter.Q.value=tone?.q??.55;if(pan)pan.pan.value=shape?.pan||0;source.disconnect();source.connect(filter);if(pan){filter.connect(pan);pan.connect(envelope);}else filter.connect(envelope);source.onended=()=>{source.disconnect();filter.disconnect();if(pan)pan.disconnect();};}return envelope;}

}
