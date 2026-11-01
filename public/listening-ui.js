import {SleepTimer} from './listening.js?rev=remove-breathing-99';
const $=id=>document.getElementById(id);
export function createListeningController({audio,playing,blocked,pause}){
 let offset=null;const clock=()=>{if(!audio.ctx)return performance.now()/1000;if(offset===null)offset=performance.now()/1000-audio.ctx.currentTime;return audio.ctx.currentTime+offset;};let monitor=null,lastGain=1,dim=0;
 function gain(value){if(!audio.ctx||!audio.master||value===1&&!monitor)return;if(!monitor){monitor=audio.ctx.createGain();monitor.gain.value=1;audio.master.disconnect(audio.ctx.destination);audio.master.connect(monitor);monitor.connect(audio.ctx.destination);}if(value!==lastGain){monitor.gain.setTargetAtTime(Math.max(.0001,value),audio.ctx.currentTime,value>lastGain?.35:.05);lastGain=value;}}
 const sleep=new SleepTimer({clock,change:value=>{dim=value.dim;document.body.style.setProperty('--sleep-dim',String(dim));gain(value.gain);if(value.gain===1)audio.update();if(audio.wet&&sleep.fading)audio.wet.gain.setTargetAtTime(Math.min(1,audio.reverb*.9+value.dim*.08),audio.ctx.currentTime,1);},finish:()=>{if(playing())pause();$('sleepTimer').value=$('zenSleepTimer').value='0';$('sleepStatus').textContent='Sleep timer finished';}});
 for(const id of ['sleepTimer','zenSleepTimer'])$(id).addEventListener('change',()=>{const value=$(id).value;$('sleepTimer').value=$('zenSleepTimer').value=value;sleep.set(Number(value));$('sleepStatus').textContent=Number(value)?`Fading to sleep in ${value} minutes`:'Sleep timer off';});
 function input(){if(sleep.input()){$('sleepTimer').value=$('zenSleepTimer').value='0';$('sleepStatus').textContent='Sleep timer cancelled · welcome back';$('sleepNotice').textContent='Sleep timer cancelled';globalThis.setTimeout(()=>{$('sleepNotice').textContent='';},3500);audio.update();}}
 const canvas=$('fluid');for(const event of ['pointerdown','keydown'])canvas.addEventListener(event,input,true);
 canvas.addEventListener('pointermove',event=>{if(event.buttons)input();},true);
 return {input,service(){if(blocked()){if(sleep.end!==null)sleep.cancel();return;}sleep.service();},suspend(){if(sleep.end!==null)sleep.cancel();},resume(){if(sleep.end===null)sleep.cancel();}};
}
