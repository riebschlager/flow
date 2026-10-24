import {createPresentationControls} from './presentation-controls.js?rev=zen-controls-88';
const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
// Convert retired listening presets once; working sessions already contain concrete settings.
export function migrateListeningPreferences(storage,soundscapes){
 try{
  const raw=storage.getItem('chromaflow-intent-v1');if(!raw)return;
  const legacy=JSON.parse(raw),saved=JSON.parse(storage.getItem('chromaflow-v1')||'null');
  const overlay=['softhorizon','nightgarden','submergedcinema'].includes(legacy?.voiceOverlay)?soundscapes[legacy.voiceOverlay]:null;
  if(saved&&overlay){saved.voices=[...overlay.voices];saved.settings={...saved.settings,soundscape:legacy.voiceOverlay};storage.setItem('chromaflow-v1',JSON.stringify(saved));}
  const timing={play:[2,2,1],focus:[3,4,.5],unwind:[3,6,.65],sleep:[4,9,.2]}[legacy?.selected];
  if(timing){const drift=JSON.parse(storage.getItem('chromaflow-drift-v1')||'{}');const [idleSeconds,noteSeconds,density]=timing;storage.setItem('chromaflow-drift-v1',JSON.stringify({...drift,idleSeconds,noteSeconds,density}));}
  storage.removeItem('chromaflow-intent-v1');
 }catch{} // Keep the old preference available if browser storage is unavailable.
}
export function normalizeLayout(raw,returning=false){return {panelHidden:typeof raw?.panelHidden==='boolean'?raw.panelHidden:false,mobileOpen:raw?.mobileOpen===true};}
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
