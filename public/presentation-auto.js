// Audio time pauses with the sound. Late/background ticks advance once, never
// replay a backlog of missed intervals. Manual transitions reset this deadline.
export class PresentationAutoAdvance{
 constructor({now,ready,advance,onError=()=>{},setTimer=(fn,ms)=>globalThis.setInterval(fn,ms),clearTimer=id=>globalThis.clearInterval(id)}){
  Object.assign(this,{now,ready,advance,onError,setTimer,clearTimer});
  this.enabled=false;this.seconds=180;this.deadline=null;this.timer=null;
 }
 setEnabled(enabled){
  if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;
  this.enabled=!!enabled;this.reset();
  if(this.enabled)this.timer=this.setTimer(()=>this.tick(),500);
 }
 setDuration(seconds){
  if(Number.isFinite(seconds)&&seconds>=15&&seconds<=3600)this.seconds=seconds;
  this.reset();return this.seconds;
 }
 reset(){this.deadline=this.enabled?this.now()+this.seconds:null;}
 hold(){this.deadline=null;}
 tick(){
  if(!this.enabled||this.deadline===null||this.now()<this.deadline||!this.ready())return;
  this.hold();return Promise.resolve().then(()=>this.advance()).catch(error=>{this.setEnabled(false);this.onError(error);});
 }
}
