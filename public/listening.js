const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
export class SleepTimer{
 constructor({clock=()=>performance.now()/1000,change=()=>{},finish=()=>{}}={}){Object.assign(this,{clock,change,finish});this.end=null;this.fading=false;}
 set(minutes){const now=this.clock();this.cancel();if([15,30,45,60,90].includes(Number(minutes)))this.end=now+Number(minutes)*60;}
 cancel(){const had=this.end!==null;this.end=null;this.fading=false;this.change({gain:1,dim:0,thin:1,seconds:0});return had;}
 input(){if(!this.fading)return false;return this.cancel();}
 service(now=this.clock()){if(this.end===null)return {thin:1};const seconds=Math.max(0,this.end-now),progress=clamp(1-seconds/240);this.fading=progress>0;const value={gain:Math.exp(Math.log(.0001)*progress),dim:progress*.985,thin:1-progress,seconds};this.change(value);if(seconds===0){this.end=null;this.fading=false;this.finish();}return value;}
}
