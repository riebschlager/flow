const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
export const breathPatterns={calm:[4,4],478:[4,7,8],box:[4,4,4,4]};
export function breathPhase(style,elapsed){const pattern=breathPatterns[style]||breathPatterns.calm,total=pattern.reduce((a,b)=>a+b,0),cycle=Math.floor(elapsed/total);let offset=elapsed-cycle*total,index=0;while(index<pattern.length-1&&offset>=pattern[index])offset-=pattern[index++];const kinds=style==='box'?['inhale','hold','exhale','hold']:style==='478'?['inhale','hold','exhale']:['inhale','exhale'];return {kind:kinds[index],progress:offset/pattern[index],cycle,index};}
export class BreathEngine{
 constructor({clock=()=>performance.now()/1000,emit=()=>{},active=()=>{}}={}){Object.assign(this,{clock,emit,onActive:active});this.style='off';this.started=null;this.lastInput=clock();this.breathKey=null;}
 configure(style){this.style=Object.hasOwn(breathPatterns,style)?style:'off';this.input();}
 input(){this.lastInput=this.clock();this.stop();}
 stop(){if(this.started!==null)this.onActive(false);this.started=null;this.breathKey=null;}
 service({playing=true,blocked=false,thin=1,energy=1}={}){
  const now=this.clock();if(!playing||blocked||this.style==='off'){this.stop();return;}
  if(now-this.lastInput<2)return;
  if(this.started===null){this.started=now;this.onActive(true);}
  const phase=breathPhase(this.style,now-this.started),key=phase.cycle+':'+phase.index,amount=clamp(energy)*clamp(thin);
  if(key!==this.breathKey){this.breathKey=key;if(phase.kind==='exhale'&&thin>.01)for(let i=0;i<4;i++)this.emit({kind:'bloom',x:.5+(i-1.5)*.12,y:.55,time:now,chordTone:i,amount,visual:i===0});}
  this.emit({kind:phase.kind==='inhale'?'gather':phase.kind==='exhale'?'release':'hold',x:.5,y:.55,held:phase.kind==='inhale'?phase.progress:0,time:now,amount});
 }
}
export class SleepTimer{
 constructor({clock=()=>performance.now()/1000,change=()=>{},finish=()=>{}}={}){Object.assign(this,{clock,change,finish});this.end=null;this.fading=false;}
 set(minutes){const now=this.clock();this.cancel();if([15,30,45,60,90].includes(Number(minutes)))this.end=now+Number(minutes)*60;}
 cancel(){const had=this.end!==null;this.end=null;this.fading=false;this.change({gain:1,dim:0,thin:1,seconds:0});return had;}
 input(){if(!this.fading)return false;return this.cancel();}
 service(now=this.clock()){if(this.end===null)return {thin:1};const seconds=Math.max(0,this.end-now),progress=clamp(1-seconds/240);this.fading=progress>0;const value={gain:Math.exp(Math.log(.0001)*progress),dim:progress*.985,thin:1-progress,seconds};this.change(value);if(seconds===0){this.end=null;this.fading=false;this.finish();}return value;}
}
