import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BreathEngine,breathPhase,SleepTimer} from '../public/listening.js';
let now=0,events=[];const breath=new BreathEngine({clock:()=>now,emit:e=>events.push(e)});
for(let i=0;i<36000;i++){now=i/10;breath.service();}assert.equal(events.length,0,'idle playback never starts an automatic performer');
for(const style of ['calm','478','box']){now=0;events=[];breath.configure(style);for(let i=0;i<6000;i++){now=i/10;breath.service();}const blooms=events.filter(e=>e.kind==='bloom');assert(blooms.length>0);assert(blooms.every(e=>breathPhase(style,e.time-2).kind==='exhale'));assert(!events.some(e=>['tap','silk','orbit','conduct'].includes(e.kind)));breath.input();const count=events.length;now+=1;breath.service();assert.equal(events.length,count);breath.service({blocked:true});assert.equal(breath.started,null);}
breath.configure('drift');assert.equal(breath.style,'off');
let values=[],finished=0;const sleep=new SleepTimer({clock:()=>now,change:v=>values.push(v),finish:()=>finished++});sleep.set(15);now+=780;sleep.service();assert(sleep.fading);assert(Math.abs(values.at(-1).gain-.01)<1e-8);assert(sleep.input());assert.equal(values.at(-1).gain,1);sleep.set(15);now+=900;sleep.service();assert.equal(finished,1);
const html=readFileSync(new URL('../app/instrument.html',import.meta.url),'utf8');assert(!/id="(?:driftEnabled|driftWander|driftStyle|driftPace|renderSource)"/.test(html));
console.log('PASS: idle playback stays manual, all explicit breathing patterns yield and block, sleep fade/cancel/finish, and retired controls are absent.');
