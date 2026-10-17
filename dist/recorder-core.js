export const MAX_SECONDS=600,MAX_FILE=300*1024*1024,MAX_EVENTS=80000,TAIL_SECONDS=.5;
export const clone=value=>JSON.parse(JSON.stringify(value));
const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
export class CaptureTimeline{
 constructor({start,bpm,cycleBeats,cycles=1,manual=false,snapshot,scene,name='Untitled performance'}){this.start=start;this.last=start;this.bpm=bpm;this.beats=0;this.cycleBeats=cycleBeats;this.target=manual?Infinity:cycleBeats*cycles;this.manual=manual;this.events=[];this.snapshot=clone(snapshot);this.scene=clone(scene);this.name=name;this.limit=false;}
 advance(now,bpm=this.bpm){now=Math.max(this.last,now);this.beats+=(now-this.last)*this.bpm/60;this.last=now;this.bpm=bpm;return this.beats;}
 deadline(now){this.advance(now);return Math.min(this.start+MAX_SECONDS,now+(this.target-this.beats)*60/this.bpm);}
 tempo(now,bpm){this.advance(now,bpm);}
 finishOnBar(now){this.advance(now);this.target=Math.max(4,(Math.floor(this.beats/4+1e-8)+1)*4);return this.deadline(now);}
 add(kind,data,now){const t=now-this.start;if(t<0||t>MAX_SECONDS||this.limit)return;if(this.events.length>=MAX_EVENTS){this.limit=true;return;}this.events.push({t:Math.round(t*100000)/100000,kind,data:clone(data)});}
 finish(end,sampleRate,channels){const duration=end-this.start,frames=Math.round(duration*sampleRate);return validateTake({format:'chromaflow-performance',version:1,id:globalThis.crypto?.randomUUID?.()||'take-'+Date.now()+'-'+Math.random().toString(36).slice(2),name:this.name,created:new Date().toISOString(),sampleRate,frames,tailFrames:channels[0].length-frames,channels,snapshot:this.snapshot,scene:this.scene,events:this.events.filter(e=>e.t<duration).sort((a,b)=>a.t-b.t),beats:this.beats,cycleBeats:this.cycleBeats,seamMs:80});}
}
export function validateTake(take){
 if(!take||take.format!=='chromaflow-performance'||take.version!==1)throw new Error('Choose a Chromaflow performance file (version 1).');
 if(!finite(take.sampleRate,8000,192000)||!Number.isInteger(take.frames)||take.frames<Math.ceil(take.sampleRate*.2)||take.frames>take.sampleRate*MAX_SECONDS||!Number.isInteger(take.tailFrames)||take.tailFrames<0||take.tailFrames>take.sampleRate*TAIL_SECONDS+2)throw new Error('The recording has invalid audio dimensions.');
 if(!Array.isArray(take.channels)||take.channels.length!==2||take.channels.some(c=>!(c instanceof Float32Array)||c.length!==take.frames+take.tailFrames))throw new Error('The recording’s stereo audio is incomplete.');
 for(const c of take.channels)for(const sample of c)if(!finite(sample,-8,8))throw new Error('The recording contains invalid audio samples.');
 if(!take.snapshot?.main||!Array.isArray(take.snapshot.main.voices)||take.snapshot.main.voices.length!==4||!take.snapshot.rhythm||!take.snapshot.arp||!take.snapshot.expression)throw new Error('The starting setup is missing.');
 if(!Array.isArray(take.events)||take.events.length>MAX_EVENTS)throw new Error('The performance timeline is too large.');
 const kinds=new Set(['settings','fluid','drop','gesture','percussion','arpeggio']);let previous=-1,bucket=-1,density=0;
 for(const e of take.events){if(!finite(e.t,0,take.frames/take.sampleRate)||e.t<previous||!kinds.has(e.kind)||!e.data||typeof e.data!=='object')throw new Error('The performance timeline is invalid.');previous=e.t;if(Math.floor(e.t)!==bucket){bucket=Math.floor(e.t);density=0;}if(++density>500)throw new Error('The performance has too many actions in one second.');}
 if(!take.scene||!Number.isInteger(take.scene.w)||!Number.isInteger(take.scene.h)||take.scene.w<8||take.scene.h<8||take.scene.w*take.scene.h>50000||['u','v','r','g','b'].some(key=>!Array.isArray(take.scene[key])||take.scene[key].length!==take.scene.w*take.scene.h||take.scene[key].some(n=>!finite(n,-1000,1000))))throw new Error('The opening canvas is invalid.');
 take.name=String(take.name||'Untitled performance').slice(0,80);take.id=typeof take.id==='string'?take.id.slice(0,100):'take-'+Date.now();take.created=typeof take.created==='string'?take.created:new Date().toISOString();take.seamMs=finite(take.seamMs,0,500)?take.seamMs:80;
 return take;
}
export function loopChannels(take,seamMs=take.seamMs){
 const count=Math.min(take.tailFrames,Math.round(take.sampleRate*Math.max(0,Math.min(500,seamMs))/1000),Math.floor(take.frames/4));
 return take.channels.map(raw=>{const out=raw.slice(0,take.frames);for(let i=0;i<count;i++){const x=count===1?1:i/(count-1),blend=x*x*(3-2*x);out[i]=raw[take.frames+i]*(1-blend)+raw[i]*blend;}return out;});
}
export function encodePerformance(take){validateTake(take);const {channels,...meta}=take,header=new TextEncoder().encode(JSON.stringify(meta));if(header.length>24*1024*1024)throw new Error('The settings timeline is too large to export.');const prefix=new Uint8Array(12);prefix.set(new TextEncoder().encode('CFLOOP01'));new DataView(prefix.buffer).setUint32(8,header.length,true);return new Blob([prefix,header,...channels],{type:'application/octet-stream'});}
export async function decodePerformance(file){
 if(file.size>MAX_FILE)throw new Error('This performance file is larger than 300 MB.');const buffer=await file.arrayBuffer(),view=new DataView(buffer);if(buffer.byteLength<12||new TextDecoder().decode(new Uint8Array(buffer,0,8))!=='CFLOOP01')throw new Error('This is not a Chromaflow performance file.');const length=view.getUint32(8,true);if(length<2||length>24*1024*1024||12+length>buffer.byteLength)throw new Error('The performance header is incomplete.');
 let meta;try{meta=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,12,length)));}catch{throw new Error('The performance header could not be read.');}
 if(!Number.isInteger(meta.frames)||!Number.isInteger(meta.tailFrames))throw new Error('The audio length is invalid.');const size=(meta.frames+meta.tailFrames)*4,start=12+length;if(size<0||start+size*2!==buffer.byteLength)throw new Error('The audio data is incomplete.');meta.channels=[new Float32Array(buffer.slice(start,start+size)),new Float32Array(buffer.slice(start+size))];return validateTake(meta);
}
export function wavFile(take){const data=loopChannels(take),frames=take.frames,bytes=new ArrayBuffer(44+frames*4),v=new DataView(bytes),write=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};write(0,'RIFF');v.setUint32(4,36+frames*4,true);write(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,take.sampleRate,true);v.setUint32(28,take.sampleRate*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);write(36,'data');v.setUint32(40,frames*4,true);for(let i=0;i<frames;i++)for(let ch=0;ch<2;ch++)v.setInt16(44+(i*2+ch)*2,Math.round(Math.max(-1,Math.min(1,data[ch][i]))*32767),true);return new Blob([bytes],{type:'audio/wav'});}
export class VisualTimeline{
 constructor(take,apply,reset){this.take=take;this.apply=apply;this.reset=reset;this.cycle=-1;this.index=0;}
 frame(elapsed,loop=true){const duration=this.take.frames/this.take.sampleRate,cycle=loop?Math.floor(Math.max(0,elapsed)/duration):0,position=loop?elapsed%duration:Math.min(elapsed,duration);if(cycle!==this.cycle){this.cycle=cycle;this.index=0;this.reset(this.take.snapshot,cycle);}let count=0;while(this.index<this.take.events.length&&this.take.events[this.index].t<=position){const event=this.take.events[this.index++];if(event.kind==='settings'||position-event.t<.3)this.apply(event,cycle*duration+event.t);if(++count>MAX_EVENTS)break;}return {cycle,position};}
}
