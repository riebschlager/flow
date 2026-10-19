const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
export const driftLimits={notesPerSecond:4,bloomSeconds:75,densityPerMinute:.045};
export function normalizeDrift(raw){return {enabled:raw?.enabled!==false,wander:raw?.wander!==false,idleSeconds:clamp(Number(raw?.idleSeconds)||20,4,120),density:Number.isFinite(Number(raw?.density))?clamp(Number(raw.density),.1,1):1,style:['drift','calm','478','box'].includes(raw?.style)?raw.style:'drift'};}
export const breathPatterns={calm:[4,4],478:[4,7,8],box:[4,4,4,4]};
export function breathPhase(style,elapsed){const pattern=breathPatterns[style]||breathPatterns.calm,total=pattern.reduce((a,b)=>a+b,0),cycle=Math.floor(elapsed/total);let offset=elapsed-cycle*total,index=0;while(index<pattern.length-1&&offset>=pattern[index])offset-=pattern[index++];const kinds=style==='box'?['inhale','hold','exhale','hold']:style==='478'?['inhale','hold','exhale']:['inhale','exhale'];return {kind:kinds[index],progress:offset/pattern[index],cycle,index};}
export function relatedProgressions(current,progressions,parse){const tones=key=>new Set(progressions[key].flatMap(c=>parse(c).map(n=>n%12))),own=progressions[current]?tones(current):null;if(!own)return [];return Object.keys(progressions).filter(k=>k!==current).map(key=>({key,overlap:[...tones(key)].filter(n=>own.has(n)).length/Math.max(own.size,tones(key).size)})).filter(p=>p.overlap>=.7).map(p=>p.key);}
export class DriftEngine{
 constructor({random=Math.random,clock=()=>performance.now()/1000,emit=()=>{},active=()=>{},wander=()=>{}}={}){Object.assign(this,{random,clock,emit,onActive:active,onWander:wander});this.settings=normalizeDrift();this.lastInput=clock();this.lastTime=null;this.started=null;this.next=0;this.path=null;this.density=.5;this.target=.5;this.arc=0;this.register=.5;this.registerTarget=.5;this.lastBloom=-Infinity;this.lastOrbit=-Infinity;this.notes=[];this.recent=Array(8).fill(-Infinity);this.harmonyAt=0;this.phrase=null;this.breathKey=null;}
 configure(raw){this.settings=normalizeDrift(raw);}
 input(now=this.clock()){this.lastInput=now;this.idle=null;this.stop();}
 zen(now=this.clock()){if(now-this.lastInput>=4)this.idle=4;}
 stop(){if(this.started!==null)this.onActive(false);this.started=null;this.path=null;this.breathKey=null;}
 note(kind,x,y,time,extra={}){this.notes=this.notes.filter(t=>time-t<1);if(this.notes.length>=driftLimits.notesPerSecond)return;this.notes.push(time);this.emit({kind,x,y,time,...extra});}
 position(now){const weights=this.recent.map((t,i)=>Math.max(.1,Math.min(4,(now-t)/15))*(1.2-Math.abs(i/7-this.register))),total=weights.reduce((a,b)=>a+b,0);let pick=this.random()*total,index=0;while(index<7&&(pick-=weights[index])>0)index++;this.recent[index]=now;return {x:.04+.92*(index+.5)/8,y:.32+this.random()*.42};}
 service({now=this.clock(),playing=true,blocked=false,phrase=0,thin=1,energy=1}={}){
  const dt=this.lastTime===null?0:clamp(now-this.lastTime,0,.1);this.lastTime=now;
  if(!playing||blocked||!this.settings.enabled){this.stop();this.lastInput=now;return;}
  if(now-this.lastInput<(this.idle??this.settings.idleSeconds))return;
  if(this.started===null){this.started=now;this.next=now+1;this.arc=now;this.harmonyAt=now+480+this.random()*420;this.breathKey=null;this.onActive(true);}
  if(now>=this.arc){this.target=.2+this.random()*.65;this.registerTarget=.18+this.random()*.64;this.arc=now+1200+this.random()*2400;}
  this.density+=clamp(this.target-this.density,-dt*driftLimits.densityPerMinute/60,dt*driftLimits.densityPerMinute/60);this.register+=clamp(this.registerTarget-this.register,-dt/600,dt/600);
  const fade=clamp((now-this.started)/8),amount=clamp(energy)*clamp(thin)*fade;
  if(this.settings.wander&&now>=this.harmonyAt&&this.phrase!==null&&phrase!==this.phrase){this.onWander();this.harmonyAt=now+480+this.random()*420;}this.phrase=phrase;
  if(this.settings.style!=='drift'){
   const phase=breathPhase(this.settings.style,now-this.started),key=phase.cycle+':'+phase.index;
   if(key!==this.breathKey){this.breathKey=key;if(phase.kind==='exhale'&&amount>.1)this.release(now,.5,.55,amount,true);}
   this.emit({kind:phase.kind==='inhale'?'gather':phase.kind==='exhale'?'release':'hold',x:.5,y:.55,held:phase.kind==='inhale'?phase.progress:0,time:now,amount});return;
  }
  if(this.path){const p=this.path,t=clamp((now-p.start)/p.duration),x=p.x+Math.sin(t*Math.PI)*p.dx,y=p.y+Math.sin(t*Math.PI*2)*.04;this.emit({kind:p.kind==='silk'?'ribbon':p.kind,x,y,time:now,progress:t,active:t<1,amount});if(p.kind==='silk'&&now>=p.noteAt&&t<1){this.note('silk',x,y,now);p.noteAt=now+1.35;}if(t===1)this.path=null;return;}
  if(now<this.next)return;
  this.next=now+2.5+this.random()*5/(.2+this.density*Math.max(.05,amount));
  if(this.random()>amount)return;
  const p=this.position(now),roll=this.random();
  if(roll<.035&&now-this.lastBloom>=driftLimits.bloomSeconds)this.release(now,p.x,p.y,amount);
  else if(roll<.05&&now-this.lastOrbit>=180){this.lastOrbit=now;this.path={...p,kind:'orbit',start:now,duration:12,dx:.08};}
  else if(roll<.15)this.path={...p,kind:'conduct',start:now,duration:20,dx:.12};
  else if(roll<.4)this.path={...p,kind:'silk',start:now,duration:6+this.random()*6,dx:(this.random()-.5)*.16,noteAt:now};
  else this.note('tap',p.x,p.y,now);
 }
 release(now,x,y,amount,breath=false){if(!breath&&now-this.lastBloom<driftLimits.bloomSeconds)return;this.lastBloom=now;this.notes=this.notes.filter(t=>now-t<1);if(this.notes.length)return;for(let i=0;i<4;i++)this.note('bloom',x+(i-1.5)*.12,y,now,{chordTone:i,amount,visual:i===0});}
}
export class SleepTimer{
 constructor({clock=()=>performance.now()/1000,change=()=>{},finish=()=>{}}={}){Object.assign(this,{clock,change,finish});this.end=null;this.fading=false;}
 set(minutes){const now=this.clock();this.cancel();if([15,30,45,60,90].includes(Number(minutes)))this.end=now+Number(minutes)*60;}
 cancel(){const had=this.end!==null;this.end=null;this.fading=false;this.change({gain:1,dim:0,thin:1,seconds:0});return had;}
 input(){if(!this.fading)return false;return this.cancel();}
 service(now=this.clock()){if(this.end===null)return {thin:1};const seconds=Math.max(0,this.end-now),progress=clamp(1-seconds/240);this.fading=progress>0;const value={gain:Math.exp(Math.log(.0001)*progress),dim:progress*.985,thin:1-progress,seconds};this.change(value);if(seconds===0){this.end=null;this.fading=false;this.finish();}return value;}
}
