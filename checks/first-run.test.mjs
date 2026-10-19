import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {intents,normalizeIntent,normalizeLayout,intentDefaults,IntentRamp,PerformerTrail,createPresentControls} from '../public/first-run.js';
import {soundscapes} from '../public/music.js?rev=visible-sound-79';
assert.deepEqual(normalizeIntent({selected:'bad',voiceOverlay:3}),{selected:'play',voiceOverlay:null});
assert.equal(normalizeLayout(null).panelHidden,true);assert.equal(normalizeLayout(null,true).panelHidden,false);assert.equal(normalizeLayout({panelHidden:true},true).panelHidden,true);
const voices=['rhodes','bells','piano','strings'];for(const key of Object.keys(intents)){assert.deepEqual(intentDefaults(key,{voices,customized:true,soundscapes}).voices,voices);}
assert.deepEqual(intentDefaults('sleep',{voices,soundscapes}).voices,soundscapes.submergedcinema.voices);
const ramp=new IntentRamp();ramp.set('volume',70,48,0);assert.equal(ramp.value('volume',48,0),70);assert.equal(ramp.value('volume',48,2),59);assert.equal(ramp.value('volume',48,4),48);assert.equal(ramp.pending.size,0);ramp.set('volume',48,70,4);ramp.cancel('volume');assert.equal(ramp.value('volume',61,5),61);
const classes=new Set(),events={},handlers={};let now=0,zen=true,exits=0;const doc={body:{classList:{remove:k=>classes.delete(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)}},addEventListener:(k,fn)=>events[k]=fn};
const trail=new PerformerTrail(),strip={addEventListener:(k,fn)=>handlers[k]=fn};
const controls=createPresentControls({doc,strip,clock:()=>now,active:()=>zen,exit:()=>exits++,trail});now=3.1;controls.frame();assert(classes.has('present-idle'));events.keydown();controls.frame();assert(!classes.has('present-idle'));handlers.focusin();now=8;controls.frame();assert(!classes.has('present-idle'));handlers.focusout();now=12;controls.frame();assert(classes.has('present-idle'));events.pointerdown();assert(!classes.has('present-idle'));events.fullscreenchange();assert.equal(exits,1);
controls.move(.2,.3);now+=.1;controls.move(.3,.4);let strokes=0;const ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++;}};trail.draw(ctx,100,100,now,0);assert.equal(strokes,0);trail.draw(ctx,100,100,now,.7);assert.equal(strokes,1);const reduced=new PerformerTrail({reducedMotion:true});reduced.move(.1,.2,0);assert.equal(reduced.points.length,0);
console.log(execFileSync(process.execPath,['checks/app-smoke.test.mjs'],{env:{...process.env,FLOW_FIRST_RUN:'1'},encoding:'utf8'}).trim());
console.log('PASS: intent normalization, protected voices, smooth ramps/manual overrides, layout migration, present idle/focus/fullscreen exit and energy/reduced-motion trail.');
let acquired=0,released=0,wakeActive=true;const wakes=createPresentControls({doc:{...doc,hidden:false},strip,clock:()=>now,active:()=>wakeActive,exit(){},trail,nav:{wakeLock:{async request(){acquired++;return {async release(){released++;},addEventListener(){}};}}}});await wakes.syncWake();await wakes.syncWake();assert.equal(acquired,1);wakeActive=false;await wakes.syncWake();assert.equal(released,1);
