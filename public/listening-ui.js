import {BreathEngine,SleepTimer} from './listening.js?rev=feature-prune-98';
const $=id=>document.getElementById(id);
export function createListeningController({audio,performanceUI,playing,blocked,pause,energy=()=>1}){
 let offset=null;const clock=()=>{if(!audio.ctx)return performance.now()/1000;if(offset===null)offset=performance.now()/1000-audio.ctx.currentTime;return audio.ctx.currentTime+offset;};let monitor=null,thin=1,lastGain=1,dim=0;
 const breath=new BreathEngine({clock,emit:action=>performanceUI.perform({...action,time:action.time-(offset||0)}),active:active=>{if(!active)performanceUI.perform({kind:'settle'});}});
 try{const saved=JSON.parse(localStorage.getItem('chromaflow-breath-v1'));$('breathStyle').value=['calm','478','box'].includes(saved?.style)?saved.style:'off';}catch{}
 breath.configure($('breathStyle').value);
 $('breathStyle').addEventListener('change',()=>{breath.configure($('breathStyle').value);try{localStorage.setItem('chromaflow-breath-v1',JSON.stringify({style:breath.style}));}catch{}});
 function gain(value){if(!audio.ctx||!audio.master||value===1&&!monitor)return;if(!monitor){monitor=audio.ctx.createGain();monitor.gain.value=1;audio.master.disconnect(audio.ctx.destination);audio.master.connect(monitor);monitor.connect(audio.ctx.destination);}if(value!==lastGain){monitor.gain.setTargetAtTime(Math.max(.0001,value),audio.ctx.currentTime,value>lastGain?.35:.05);lastGain=value;}}
 const sleep=new SleepTimer({clock,change:value=>{thin=value.thin;dim=value.dim;document.body.style.setProperty('--sleep-dim',String(dim));gain(value.gain);if(value.gain===1)audio.update();if(audio.wet&&sleep.fading)audio.wet.gain.setTargetAtTime(Math.min(1,audio.reverb*.9+value.dim*.08),audio.ctx.currentTime,1);},finish:()=>{if(playing())pause();$('sleepTimer').value=$('zenSleepTimer').value='0';$('sleepStatus').textContent='Sleep timer finished';}});
 for(const id of ['sleepTimer','zenSleepTimer'])$(id).addEventListener('change',()=>{const value=$(id).value;$('sleepTimer').value=$('zenSleepTimer').value=value;sleep.set(Number(value));$('sleepStatus').textContent=Number(value)?`Fading to sleep in ${value} minutes`:'Sleep timer off';});
 function input(){breath.input();if(sleep.input()){$('sleepTimer').value=$('zenSleepTimer').value='0';$('sleepStatus').textContent='Sleep timer cancelled · welcome back';$('sleepNotice').textContent='Sleep timer cancelled';globalThis.setTimeout(()=>{$('sleepNotice').textContent='';},3500);audio.update();}}
 const canvas=$('fluid');for(const event of ['pointerdown','keydown'])canvas.addEventListener(event,input,true);
 canvas.addEventListener('pointermove',event=>{if(event.buttons)input();},true);
 return {input,service(){if(blocked()){breath.stop();if(sleep.end!==null)sleep.cancel();return;}const value=sleep.service();breath.service({playing:playing(),blocked:blocked(),thin:value.thin??thin,energy:energy()});},stop(){breath.input();},suspend(){breath.input();if(sleep.end!==null)sleep.cancel();},resume(){if(sleep.end===null)sleep.cancel();breath.input();}};
}
