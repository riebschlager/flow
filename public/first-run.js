import {createPresentationControls} from './presentation-controls.js?rev=zen-controls-88';
const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
export const intents={play:{energy:70,soundscape:null,idleSeconds:2,noteSeconds:2,density:1,rain:0,timer:0,volume:70},focus:{energy:45,soundscape:'softhorizon',idleSeconds:3,noteSeconds:4,density:.5,rain:0,timer:0,volume:65},unwind:{energy:35,soundscape:'nightgarden',idleSeconds:3,noteSeconds:6,density:.65,rain:0,timer:0,volume:65},sleep:{energy:10,soundscape:'submergedcinema',idleSeconds:4,noteSeconds:9,density:.2,rain:0,timer:45,volume:48}};
export function normalizeIntent(raw){return {selected:Object.hasOwn(intents,raw?.selected)?raw.selected:'play',voiceOverlay:typeof raw?.voiceOverlay==='string'&&['softhorizon','nightgarden','submergedcinema'].includes(raw.voiceOverlay)?raw.voiceOverlay:null};}
export function normalizeLayout(raw,returning=false){return {panelHidden:typeof raw?.panelHidden==='boolean'?raw.panelHidden:!returning,mobileOpen:raw?.mobileOpen===true};}
export function intentDefaults(key,{voices,customized=false,soundscapes}){const preset=intents[key]||intents.play,scape=soundscapes[preset.soundscape];return {...preset,voices:[...(customized||!scape?voices:scape.voices)],reverb:scape?.reverb,delay:scape?.delay};}
export class IntentRamp{
 constructor(){this.pending=new Map();}
 set(key,from,to,now,duration=4){this.pending.set(key,{from,to,now,duration});}
 value(key,fallback,now){const p=this.pending.get(key);if(!p)return fallback;const t=clamp((now-p.now)/p.duration),smooth=t*t*(3-2*t);if(t===1)this.pending.delete(key);return p.from+(p.to-p.from)*smooth;}
 cancel(key){this.pending.delete(key);}
 clear(){this.pending.clear();}
}
export class PerformerTrail{
 constructor({reducedMotion=false}={}){this.points=[];this.reducedMotion=reducedMotion;this.lastMove=0;}
 move(x,y,now){this.lastMove=now;if(this.reducedMotion)return;this.points.push({x,y,now});if(this.points.length>48)this.points.shift();}
 draw(ctx,w,h,now,energy){this.points=this.points.filter(p=>now-p.now<.85);if(!energy||this.reducedMotion||this.points.length<2)return;ctx.save();ctx.lineCap='round';for(let i=1;i<this.points.length;i++){const a=this.points[i-1],b=this.points[i];ctx.globalAlpha=clamp(1-(now-b.now)/.85)*energy*.5;ctx.strokeStyle='#d8eee5';ctx.lineWidth=1+energy*3;ctx.beginPath();ctx.moveTo(a.x*w,a.y*h);ctx.lineTo(b.x*w,b.y*h);ctx.stroke();}ctx.restore();}
}
export function createPresentControls({doc=globalThis.document,strip,trigger,hint,clock=()=>performance.now()/1000,active,exit,trail,nav=globalThis.navigator}){
 let touched=clock(),lock=null,pending=false,generation=0;
 async function syncWake(){const wanted=active()&&!doc.hidden;if(!wanted){generation++;const old=lock;lock=null;try{await old?.release();}catch{}return;}if(lock||pending||!nav?.wakeLock?.request)return;pending=true;const ticket=generation;try{const next=await nav.wakeLock.request('screen');if(ticket!==generation||!active()||doc.hidden){await next.release();return;}lock=next;next.addEventListener?.('release',()=>{if(lock===next)lock=null;});}catch{}finally{pending=false;if(ticket!==generation&&active()&&!doc.hidden)void syncWake();}}
 doc.addEventListener('visibilitychange',()=>{trail.points=[];void syncWake();});
 const chrome=createPresentationControls({doc,shell:doc.body,panel:strip,trigger,hint,label:'Zen',storageKey:'flow:zen-controls-seen'});
 function activity(){touched=clock();doc.body.classList.remove('present-idle');}
 for(const type of ['pointermove','pointerdown','keydown'])doc.addEventListener(type,activity);
 doc.addEventListener('fullscreenchange',()=>{if(active()&&!doc.fullscreenElement)exit();});
 return {start(){activity();chrome.start();},stop(){chrome.stop();doc.body.classList.remove('present-idle');},close(){chrome.close({restoreFocus:true});},get open(){return !strip.hidden;},syncWake,frame(){doc.body.classList.toggle('present-idle',active()&&strip.hidden&&clock()-touched>=3);},move(x,y){if(active())trail.move(x,y,clock());}};
}
