import {normalizeFluidListens} from './fluid-listen.js?rev=fluid-feedback-82';
import {DEFAULT_MASTER_VOLUME} from './output.js?rev=levels-38';
import {normalizeEnvironment} from './environment.js?rev=environment-34';
import {normalizePalette} from './palettes.js?rev=gestures-32';
import {isColorVoice,instruments,progressions,soundscapes,parseChord} from './music.js?rev=chaos-86';
import {normalizeRhythm,drumVoices} from './rhythm.js?rev=fluid-feedback-82';
import {normalizeArp} from './arpeggiator.js?rev=fluid-feedback-82';
import {normalizeGestureSettings,normalizePerformance} from './gestures.js?rev=gestures-32';
import {normalizeDyeTitle} from './dye-text.js?rev=titles-81';
const number=(n,lo,hi,fallback)=>Number.isFinite(Number(n))?Math.max(lo,Math.min(hi,Number(n))):fallback;
export const mainDefaults={fluidListens:false,energy:60,colorPalette:'classic',soundscape:'stillwater',progression:'daydream',chordLength:'8',reverb:65,delay:35,volume:DEFAULT_MASTER_VOLUME,dropletsVolume:100,swirl:60,persistence:70,dropSize:45,rain:35,cycleColors:true,autoPour:true,quantizeEnabled:false,quantizeBeats:.5,octavesDown:0,octavesUp:1,chordAtmosphere:65,waterEnabled:true,waterSwell:45,waterSpeed:30,waterRefraction:40,waterCaustics:35,waterReflection:40};
export function sanitizeSnapshot(raw){
 if(!raw?.main||!Array.isArray(raw.main.voices)||raw.main.voices.length!==4||raw.main.voices.some(v=>!isColorVoice(v)))throw new Error('A performance references an unknown melodic voice.');
 const main=raw.main,settings={...mainDefaults,...Object.fromEntries(Object.entries(main.settings||{}).filter(([k])=>Object.hasOwn(mainDefaults,k)))};
 if(!Object.hasOwn(main.settings||{},'waterEnabled'))settings.waterEnabled=false;
 settings.fluidListens=normalizeFluidListens(settings.fluidListens);
 settings.colorPalette=normalizePalette(settings.colorPalette);
 if(settings.soundscape!=='custom'&&!Object.hasOwn(soundscapes,settings.soundscape))throw new Error('Unknown soundscape in performance.');if(settings.progression!=='custom'&&!Object.hasOwn(progressions,settings.progression))throw new Error('Unknown progression in performance.');
 if(!Array.isArray(main.custom)||main.custom.length!==4)throw new Error('The custom chord setup is incomplete.');main.custom.forEach(parseChord);
 for(const key of ['cycleColors','autoPour','quantizeEnabled','waterEnabled'])settings[key]=settings[key]===true;
 for(const key of ['energy','reverb','delay','volume','dropletsVolume','swirl','persistence','rain','chordAtmosphere','waterSwell','waterSpeed','waterRefraction','waterCaustics','waterReflection'])settings[key]=number(settings[key],0,100,mainDefaults[key]);settings.dropSize=number(settings.dropSize,10,100,45);
 for(const key of ['octavesDown','octavesUp'])settings[key]=Math.round(number(settings[key],0,3,mainDefaults[key]));settings.chordLength=[4,8,16].includes(Number(settings.chordLength))?String(settings.chordLength):'8';settings.quantizeBeats=[1,.5,.25,.125,1/3].includes(Number(settings.quantizeBeats))?Number(settings.quantizeBeats):.5;
 return {main:{settings,voices:[...main.voices],custom:[...main.custom],bpm:number(main.bpm,30,100,56),selected:Math.round(number(main.selected,0,3,0))},rhythm:normalizeRhythm(raw.rhythm),arp:normalizeArp(raw.arp),environment:normalizeEnvironment(raw.environment),expression:normalizeGestureSettings(raw.expression),position:number(raw.position,0,100000,0),chordIndex:Math.round(number(raw.chordIndex,0,3,0)),performance:normalizePerformance(raw.performance)};
}
const requireNumber=(value,lo,hi)=>{if(typeof value!=='number'||!Number.isFinite(value)||value<lo||value>hi)throw new Error('The performance contains an invalid visual action.');return value;};
export function sanitizeTake(take){take.snapshot=sanitizeSnapshot(take.snapshot);for(const event of take.events){const d=event.data;
 if(event.kind==='settings')event.data=sanitizeSnapshot(d);
 else if(event.kind==='title')event.data=normalizeDyeTitle(d);
 else if(event.kind==='note'){
  if(!Object.hasOwn(instruments,d.voice)||!['voices','arp'].includes(d.bus))throw new Error('Invalid session voice.');requireNumber(d.id,0,1000000);requireNumber(d.pitch,0,127);requireNumber(d.levelScale,.1,1.5);
  if(d.expression!==null){if(!d.expression||typeof d.expression!=='object')throw new Error('Invalid note expression.');const ranges={velocity:[.15,1.25],sustain:[.35,2.7],cutoff:[350,18000],pan:[-.9,.9],energy:[0,1],attack:[0,2],attackAmount:[0,1]};d.expression=Object.fromEntries(Object.entries(ranges).filter(([k])=>d.expression[k]!==undefined).map(([k,r])=>[k,requireNumber(d.expression[k],...r)]));}
  if(d.noteLength!==null)requireNumber(d.noteLength,.001,9);
  if(d.noteEnvelope!==null){if(!Array.isArray(d.noteEnvelope)||d.noteEnvelope.length>16||!d.noteEnvelope.length)throw new Error('Invalid note envelope.');d.noteEnvelope=d.noteEnvelope.map(stage=>({duration:requireNumber(stage.duration,0,9),volume:requireNumber(stage.volume,0,1)}));if(d.noteEnvelope.reduce((n,s)=>n+s.duration,0)>9)throw new Error('Invalid envelope length.');}
  if(d.pitchGlide!==null)d.pitchGlide={from:requireNumber(d.pitchGlide.from,0,127),time:requireNumber(d.pitchGlide.time,0,2),amount:requireNumber(d.pitchGlide.amount,0,1)};
 }else if(event.kind==='drum'){if(!Object.hasOwn(drumVoices,d.voice))throw new Error('Invalid session drum.');requireNumber(d.id,0,1000000);requireNumber(d.velocity,0,2);if(d.pitch!==null)requireNumber(d.pitch,0,127);}
 else if(event.kind==='noteOff'||event.kind==='drumOff')requireNumber(d.id,0,1000000);

 else if(event.kind==='fluid'){
  if(!['splat','pulse','force','clear'].includes(d.op)||!Array.isArray(d.args))throw new Error('The performance contains an unknown fluid action.');const a=d.args;
  if(d.op==='clear'){if(a.length)throw new Error('Invalid clear action.');continue;}
  requireNumber(a[0],0,1);requireNumber(a[1],0,1);
  if(d.op==='splat'){if(a.length!==6||!Array.isArray(a[2])||a[2].length!==3)throw new Error('Invalid color action.');a[2].forEach(v=>requireNumber(v,0,5));requireNumber(a[3],.001,1);requireNumber(a[4],-1000,1000);requireNumber(a[5],-1000,1000);}
  if(d.op==='pulse'){if(a.length!==5)throw new Error('Invalid current action.');requireNumber(a[2],0,5);requireNumber(a[3],.001,1);requireNumber(a[4],-1,1);}
  if(d.op==='force'){if(a.length!==5)throw new Error('Invalid force action.');requireNumber(a[2],-1000,1000);requireNumber(a[3],-1000,1000);requireNumber(a[4],.001,1);}
 }else if(event.kind==='drop'){requireNumber(d.x,0,1);requireNumber(d.y,0,1);requireNumber(d.color,0,3);if(!Number.isInteger(d.color))throw new Error('Invalid droplet color.');requireNumber(d.flight,0,30);requireNumber(d.progress,0,1);if(typeof d.id!=='number')throw new Error('Invalid droplet identifier.');}
 else if(event.kind==='percussion'){if(!Object.hasOwn(drumVoices,d.voice))throw new Error('Unknown percussion voice.');for(const key of ['x','y'])requireNumber(d[key],0,1);requireNumber(d.strength,0,2);requireNumber(d.weight,0,1);requireNumber(d.lane,0,3);requireNumber(d.step,0,15);if(d.velocity!==undefined)requireNumber(d.velocity,0,2);if(d.pitch!==undefined&&d.pitch!==null)requireNumber(d.pitch,0,127);}
 else if(event.kind==='arpeggio'){if(d.rest!==undefined&&typeof d.rest!=='boolean')throw new Error('Invalid arpeggio rest.');requireNumber(d.pitch,0,127);requireNumber(d.count,1,16);requireNumber(d.index,0,d.count-1);parseChord(d.chord);if(!Object.hasOwn(instruments,d.voice))throw new Error('Unknown arpeggio voice.');}
 else if(event.kind==='gesture'){for(const [key,max] of [['pointer',5],['color',3]])if(d[key]!==undefined){requireNumber(d[key],0,max);if(!Number.isInteger(d[key]))throw new Error('Invalid gesture '+key);}if(d.spin!==undefined)requireNumber(d.spin,-1,1);if(d.heading!==undefined)requireNumber(d.heading,-Math.PI,Math.PI);d.active=d.active===true;d.ended=d.ended===true;if(d.active){requireNumber(d.x,0,1);requireNumber(d.y,0,1);}if(d.performance)d.performance=sanitizeSnapshot({...take.snapshot,performance:d.performance}).performance;for(const key of ['x','y','energy','held','orbit'])if(d[key]!==undefined)requireNumber(d[key],0,1);}
 }
 if(take.version===2){const keys={title:['text','color'],fluid:['op','args'],drop:['id','x','y','color','flight','progress'],gesture:['pointer','color','active','ended','x','y','energy','held','orbit','spin','heading','kind','performance'],percussion:['voice','x','y','strength','weight','lane','step','velocity','motion','pitch'],arpeggio:['voice','pitch','count','index','chord','rest'],note:['id','voice','pitch','expression','bus','noteLength','noteEnvelope','pitchGlide','levelScale'],drum:['id','voice','velocity','pitch'],noteOff:['id'],drumOff:['id']};for(const e of take.events){if(keys[e.kind])e.data=Object.fromEntries(keys[e.kind].filter(k=>e.data[k]!==undefined).map(k=>[k,e.data[k]]));if(e.kind==='gesture'&&!['touch','hold','orbit','rush','ribbon','bloom','flick','cancel','conduct','space'].includes(e.data.kind))delete e.data.kind;if(e.kind==='percussion'&&!['sweep','light','bass'].includes(e.data.motion))delete e.data.motion;}}
 return take;}
