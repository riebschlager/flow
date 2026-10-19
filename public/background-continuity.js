export const schedulingLookahead=()=>globalThis.document?.hidden?1.25:.12;
export class RainClock{
 constructor(){this.reset();}
 reset(){this.next=null;this.key=null;}
 service(now,{enabled,interval,key,horizon=schedulingLookahead(),emit}){
  if(!enabled){this.reset();return;}
  if(this.key!==key){this.key=key;this.next=now+interval;}
  // A suspended audio clock or a longer OS stall must never create a catch-up burst.
  if(this.next<now)this.next=now+interval;
  for(let guard=0;guard<8&&this.next<=now+horizon;guard++){const time=this.next;this.next+=interval;emit(time);}
 }
}
export function createBackgroundContinuity({playing,zen,title,togglePlay,visibility=()=>{},doc=globalThis.document,nav=globalThis.navigator,Metadata=globalThis.MediaMetadata}){
 let lock=null,pending=false,generation=0;
 const wanted=()=>playing()&&zen()&&!doc.hidden;
 function release(){generation++;const old=lock;lock=null;try{Promise.resolve(old?.release()).catch(()=>{});}catch{}}
 async function wake(){if(!wanted()){release();return;}if(lock||pending||!nav?.wakeLock?.request)return;pending=true;const ticket=generation;try{const next=await nav.wakeLock.request('screen');if(ticket!==generation||!wanted()){await next.release();return;}lock=next;next.addEventListener?.('release',()=>{if(lock===next)lock=null;});}catch{}finally{pending=false;if(ticket!==generation&&wanted())wake();}}
 function sync(){wake();try{if(nav?.mediaSession){if(Metadata)nav.mediaSession.metadata=new Metadata({title:title(),artist:'Flow',artwork:[{src:new URL('/icon.svg',doc.baseURI||globalThis.location?.href).href,type:'image/svg+xml'}]});nav.mediaSession.playbackState=playing()?'playing':'paused';}}catch{}}
 try{for(const action of ['play','pause'])nav?.mediaSession?.setActionHandler(action,()=>{if(playing()!==(action==='play'))Promise.resolve(togglePlay()).catch(()=>{});});}catch{}
 doc.addEventListener('visibilitychange',()=>{visibility();sync();});
 return {sync,release};
}
