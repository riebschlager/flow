import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SleepTimer} from '../public/listening.js';
let now=0;
let values=[],finished=0;const sleep=new SleepTimer({clock:()=>now,change:v=>values.push(v),finish:()=>finished++});sleep.set(15);now+=780;sleep.service();assert(sleep.fading);assert(Math.abs(values.at(-1).gain-.01)<1e-8);assert(sleep.input());assert.equal(values.at(-1).gain,1);sleep.set(15);now+=900;sleep.service();assert.equal(finished,1);
const html=readFileSync(new URL('../app/instrument.html',import.meta.url),'utf8');assert(!/id="(?:driftEnabled|driftWander|driftStyle|driftPace|renderSource|breathStyle)"/.test(html));
console.log('PASS: sleep fade/cancel/finish, and retired performer, harmony and breathing controls are absent.');
// The timer controller must initialize without reading retired preferences or producing gestures.
const nodes=new Map(['sleepTimer','zenSleepTimer','sleepStatus','sleepNotice','fluid'].map(id=>[id,{value:'0',textContent:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;}}]));
globalThis.document={getElementById:id=>{assert(nodes.has(id));return nodes.get(id);},body:{style:{setProperty(){}}}};
globalThis.localStorage={getItem(){throw new Error('Sleep timer must not read performer preferences');}};
let audioNow=0,pauses=0,playing=true;const gains=[];const audio={ctx:{get currentTime(){return audioNow;},destination:{},createGain:()=>({gain:{value:1,setTargetAtTime:v=>gains.push(v)},connect(){}})},master:{disconnect(){},connect(){}},update(){}};
const {createListeningController}=await import('../public/listening-ui.js');
const controller=createListeningController({audio,playing:()=>playing,blocked:()=>false,pause:()=>{playing=false;pauses++;}});
nodes.get('sleepTimer').value='15';nodes.get('sleepTimer').listeners.change();assert.equal(nodes.get('zenSleepTimer').value,'15');audioNow=780;controller.service();assert(Math.abs(gains.at(-1)-.01)<1e-8);nodes.get('fluid').listeners.pointerdown();assert.equal(nodes.get('sleepTimer').value,'0');assert.equal(gains.at(-1),1);
nodes.get('zenSleepTimer').value='15';nodes.get('zenSleepTimer').listeners.change();audioNow+=900;controller.service();assert.equal(pauses,1);assert.equal(nodes.get('sleepStatus').textContent,'Sleep timer finished');
console.log('PASS: sleep controls mirror, touch cancels the fade, completion pauses, and the controller needs no breathing controls or preferences.');
