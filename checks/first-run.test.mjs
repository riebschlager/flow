import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const markup=readFileSync(new URL('../app/instrument.html',import.meta.url),'utf8');assert(!/intentPicker|presentIntent|beginFlow|Begin listening/.test(markup));
import {execFileSync} from 'node:child_process';
import {migrateListeningPreferences,normalizeLayout,PerformerTrail,createPresentControls} from '../public/first-run.js';
import {soundscapes} from '../public/music.js?rev=chaos-86';
assert.equal(normalizeLayout(null).panelHidden,false);assert.equal(normalizeLayout(null,true).panelHidden,false);assert.equal(normalizeLayout({panelHidden:true},true).panelHidden,true);
for(const [selected,noteSeconds] of Object.entries({play:2,focus:4,unwind:6,sleep:9})){
 const data=new Map([['chromaflow-intent-v1',JSON.stringify({selected,voiceOverlay:'submergedcinema'})],['chromaflow-v1',JSON.stringify({voices:['rhodes','bells','piano','strings'],settings:{volume:48,energy:10}})],['chromaflow-drift-v1',JSON.stringify({enabled:false,style:'box'})]]);
 const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 migrateListeningPreferences(storage,soundscapes);
 const saved=JSON.parse(data.get('chromaflow-v1'));assert.deepEqual(saved.voices,soundscapes.submergedcinema.voices);assert.equal(saved.settings.volume,48);assert.equal(saved.settings.energy,10);assert.equal(saved.settings.soundscape,'submergedcinema');
 const drift=JSON.parse(data.get('chromaflow-drift-v1'));assert.equal(drift.noteSeconds,noteSeconds);assert.equal(drift.enabled,false);assert.equal(drift.style,'box');assert(!data.has('chromaflow-intent-v1'));
 storage.setItem('chromaflow-drift-v1',JSON.stringify({...drift,noteSeconds:12}));migrateListeningPreferences(storage,soundscapes);assert.equal(JSON.parse(data.get('chromaflow-drift-v1')).noteSeconds,12,'migration runs once');
}
const custom=new Map([['chromaflow-intent-v1','{"selected":"focus","voiceOverlay":null}'],['chromaflow-v1','{"voices":["rhodes","bells","piano","strings"],"settings":{"soundscape":"custom"}}']]);
migrateListeningPreferences({getItem:k=>custom.get(k),setItem:(k,v)=>custom.set(k,v),removeItem:k=>custom.delete(k)},soundscapes);assert.equal(JSON.parse(custom.get('chromaflow-v1')).voices[0],'rhodes');
const classes=new Set();let now=0,zen=true,exits=0;
function node(){return {hidden:true,attrs:{},listeners:{},addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);},fire(k,e={}){for(const fn of this.listeners[k]??[])fn(e);},contains(target){return target===this;},setAttribute(k,v){this.attrs[k]=v;},focus(){doc.activeElement=this;}};}
const body=node();body.classList={remove:k=>classes.delete(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)};
const doc={...node(),body,activeElement:body},trail=new PerformerTrail(),strip=node(),trigger=node(),hint=node();
const controls=createPresentControls({doc,strip,trigger,hint,clock:()=>now,active:()=>zen,exit:()=>exits++,trail});controls.start();assert(strip.hidden);assert(!trigger.hidden);
now=3.1;controls.frame();assert(classes.has('present-idle'));
for(const type of ['pointermove','pointerdown','keydown']){doc.fire(type,{key:'Tab'});controls.frame();assert(!classes.has('present-idle'));assert(strip.hidden,'incidental input never reveals Zen controls');}
trigger.fire('click');assert(controls.open);assert.equal(trigger.attrs['aria-label'],'Hide Zen controls');now=8;controls.frame();assert(!classes.has('present-idle'));controls.close();assert(strip.hidden);doc.fire('fullscreenchange');assert.equal(exits,1);controls.stop();assert(trigger.hidden);
controls.move(.2,.3);now+=.1;controls.move(.3,.4);let strokes=0;const ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++;}};trail.draw(ctx,100,100,now,0);assert.equal(strokes,0);trail.draw(ctx,100,100,now,.7);assert.equal(strokes,1);const reduced=new PerformerTrail({reducedMotion:true});reduced.move(.1,.2,0);assert.equal(reduced.points.length,0);
console.log(execFileSync(process.execPath,['checks/app-smoke.test.mjs'],{env:{...process.env,FLOW_FIRST_RUN:'1'},encoding:'utf8'}).trim());
console.log('PASS: legacy preference migration, protected custom voices, layout preferences, quiet Zen reveal/cursor/fullscreen exit and energy/reduced-motion trail.');
let acquired=0,released=0,wakeActive=true;const wakes=createPresentControls({doc:{...doc,hidden:false},strip,trigger,hint,clock:()=>now,active:()=>wakeActive,exit(){},trail,nav:{wakeLock:{async request(){acquired++;return {async release(){released++;},addEventListener(){}};}}}});await wakes.syncWake();await wakes.syncWake();assert.equal(acquired,1);wakeActive=false;await wakes.syncWake();assert.equal(released,1);
