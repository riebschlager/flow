import {SleepTimer} from './drift.js?rev=drift-77';
export class PresentationSleep{
 constructor({now,change,finish,setTimer=(fn,ms)=>globalThis.setInterval(fn,ms),clearTimer=id=>globalThis.clearInterval(id)}){
  Object.assign(this,{setTimer,clearTimer});this.timer=null;
  this.sleep=new SleepTimer({clock:now,change,finish:()=>{this.clear();finish();}});
 }
 clear(){if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;}
 set(minutes){this.clear();this.sleep.set(minutes);if(this.sleep.end!==null)this.timer=this.setTimer(()=>this.tick(),100);}
 tick(){return this.sleep.service();}
 input(){if(!this.sleep.input())return false;this.clear();return true;}
 reset(){this.clear();this.sleep.cancel();}
}
