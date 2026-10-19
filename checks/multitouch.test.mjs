import fs from 'node:fs';import assert from 'node:assert/strict';
import {createPerformanceController} from '../public/performance.js';
import {noteExpression,shapeExpression,normalizeGestureSettings,normalizePerformance} from '../public/gestures.js';import {instruments} from '../public/music.js';
const elements=new Map();for(const match of fs.readFileSync(new URL('../app/instrument.html',import.meta.url),'utf8').matchAll(/id="([^"]+)"/g))elements.set(match[1],{style:{setProperty(k,v){this[k]=v;}},listeners:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,f){(this.listeners[k]??=[]).push(f);},getBoundingClientRect:()=>({left:0,top:0,width:1000,height:600}),setPointerCapture(){},releasePointerCapture(){}});
globalThis.document={activeElement:null,getElementById:id=>{assert(elements.has(id),id);return elements.get(id);}};const $=document.getElementById;let time=0,blocked=false,saved,blur;
Object.defineProperty(globalThis,'performance',{value:{now:()=>time},configurable:true});globalThis.window={addEventListener:(name,fn)=>{if(name==='blur')blur=fn;}};globalThis.localStorage={getItem:()=>null,setItem:(k,v)=>saved=JSON.parse(v)};
const drops=[],tones=[],pulses=[],forces=[],gestures=[];const canvas=$('fluid');const controller=createPerformanceController({canvas,stage:$('stage'),audio:{setPerformance:p=>tones.push({...p})},sim:{force:(...a)=>forces.push(a),pulse:(...a)=>pulses.push(a)},drop:(...a)=>drops.push(a),nextColor:()=>0,getColor:()=>({hex:'#b7a0ff'}),onFirstTouch(){},openGuide(){},onGesture:m=>gestures.push(m),readOnly:()=>blocked});
function fire(type,x=500,y=300,extra={}){for(const fn of canvas.listeners[type]||[])fn({pointerId:1,button:0,pointerType:'mouse',clientX:x,clientY:y,preventDefault(){},...extra});}
function change(id,value){$(id).value=value;for(const fn of $(id).listeners.change||[])fn();}
function frames(count=90){for(let i=0;i<count;i++){time+=16;controller.frame(.016,time);}}

function touch(type,id,x,y){fire(type,x,y,{pointerId:id,pointerType:'touch'});}
touch('pointerdown',1,200,180);touch('pointerdown',2,800,420);assert.equal(drops.length,2);assert.equal(controller.painting,true);
time=800;touch('pointermove',1,100,200);touch('pointermove',2,900,400);assert.equal(drops.length,4);assert(drops.some(d=>d[0]===.1));assert(drops.some(d=>d[0]===.9));
// Cancelling one stroke preserves the other, including its timer and capture.
touch('pointercancel',1,100,200);assert(controller.painting);const before=drops.length;time+=800;touch('pointermove',2,950,450);assert.equal(drops.length,before+1);touch('lostpointercapture',2,950,450);assert(!controller.painting);
controller.reset();time+=1000;touch('pointerdown',1,200,300);touch('pointerdown',2,800,300);const onsets=drops.length;
time+=100;touch('pointermove',1,300,300);touch('pointermove',2,700,300);controller.frame(.016,time);assert.equal(drops.length,onsets,'pinch suppresses individual stroke notes');assert.equal($('gestureName').textContent,'Gathering');const gather=gestures.findLast(g=>g.pointer===5&&g.active);assert.equal(gather.x,.5);assert.equal(gather.y,.5);assert(gather.held>0);
time+=100;touch('pointermove',1,400,300);touch('pointermove',2,600,300);const charged=gestures.findLast(g=>g.pointer===5&&g.active);assert(charged.held>gather.held);
time+=100;touch('pointermove',1,200,300);assert.equal(drops.length,onsets+4);assert.deepEqual(drops.slice(-4).map(d=>d[4].chordTone),[0,1,2,3]);touch('pointerup',1,200,300);touch('pointerup',2,600,300);assert.equal(drops.length,onsets+4,'spread and lift only Bloom once');
function gatherAgain(){controller.reset();time+=1000;touch('pointerdown',1,200,300);touch('pointerdown',2,800,300);time+=100;touch('pointermove',1,300,300);touch('pointermove',2,700,300);}
gatherAgain();let n=drops.length;touch('pointerup',1,300,300);assert.equal(drops.length,n);touch('pointerup',2,700,300);assert.equal(drops.length,n+4,'both fingers lift to Bloom');
for(const mode of ['pointercancel','lostpointercapture','blur','reset']){gatherAgain();n=drops.length;if(mode==='blur')blur();else if(mode==='reset')controller.reset();else{touch(mode,1,300,300);assert(controller.painting);touch('pointerup',2,700,300);}assert.equal(drops.length,n,mode+' never produces a release accent');assert(!controller.painting);}
// Two parallel strokes and mixed pointer types cannot accidentally Gather.
controller.reset();touch('pointerdown',1,200,200);touch('pointerdown',2,700,200);time+=800;touch('pointermove',1,200,400);touch('pointermove',2,700,400);assert.notEqual($('gestureName').textContent,'Gathering');n=drops.length;fire('pointerdown',500,300,{pointerId:3,pointerType:'pen'});assert.equal(drops.length,n);controller.reset();
// Five continuously moving touches are bounded to seven notes/second in total.
n=drops.length;for(let i=1;i<=6;i++)touch('pointerdown',i,i*140,200);assert.equal(drops.length-n,5);const start=time;
for(let frame=1;frame<=600;frame++){time=start+frame*16;for(let i=1;i<=5;i++)touch('pointermove',i,i*140+Math.sin(frame*.3)*30,200+Math.cos(frame*.3)*30);controller.frame(.016,time);}
assert(drops.length-n<=5*(1+Math.floor(9600/750)));assert(drops.length-n>40,'each finger keeps producing notes');controller.reset();assert(!controller.painting);
// New fingers reserve cycle colors once; subsequent notes keep that finger's voice.
let color=0;const colored=[];const colorCanvas={...canvas,listeners:{},addEventListener(k,f){(this.listeners[k]??=[]).push(f);}};const other=createPerformanceController({canvas:colorCanvas,audio:{setPerformance(){}},sim:{force(){},pulse(){}},drop:(...d)=>colored.push(d),nextColor:()=>3,touchColor:()=>color++%4,getColor:i=>({hex:['#aaa','#bbb','#ccc','#ddd'][i??0]}),onFirstTouch(){},openGuide(){}});
for(const id of [1,2,3])for(const fn of colorCanvas.listeners.pointerdown)fn({pointerId:id,button:0,pointerType:'touch',clientX:id*200,clientY:300,preventDefault(){}});assert.deepEqual(colored.map(d=>d[2]),[0,1,2]);time+=800;for(const fn of colorCanvas.listeners.pointermove)fn({pointerId:1,pointerType:'touch',clientX:250,clientY:350,preventDefault(){}});assert.equal(colored.at(-1)[2],0);assert.equal(colored.at(-1)[6],true);assert.equal(color,3);other.reset();
console.log('PASS: independent strokes, five-pointer ceiling and note budget, pinch midpoint/charge, four-tone spread/lift Bloom, isolated cancel/capture loss, blur/reset, and no parallel-stroke Gather.');
const {sessionFixture}=await import('./session-fixture.mjs');const {sanitizeTake}=await import('../public/recording-state.js');const {canonicalMetadata}=await import('../lib/community-validation.mjs');const {forkSession,encodePerformance,decodePerformance}=await import('../public/recorder-core.js');
const take=sessionFixture();take.events.push({t:1,kind:'gesture',data:{pointer:1,color:2,active:true,kind:'ribbon',x:.2,y:.3}},{t:1.1,kind:'gesture',data:{pointer:2,color:3,active:true,kind:'rush',x:.8,y:.7}});take.events.sort((a,b)=>a.t-b.t);
const roundtrip=sanitizeTake(await decodePerformance(encodePerformance(take)));assert.deepEqual(roundtrip.events.filter(e=>e.kind==='gesture').map(e=>e.data.pointer),[1,2]);
const shared=canonicalMetadata(structuredClone(roundtrip),'Hands','test-id',new Date().toISOString());assert.deepEqual(shared.events.filter(e=>e.kind==='gesture').map(e=>e.data.color),[2,3]);
for(const data of [{pointer:6},{pointer:1.5},{color:4},{color:-1}]){const bad=structuredClone(take);bad.events=[{t:1,kind:'gesture',data}];assert.throws(()=>sanitizeTake(bad));}
console.log('PASS: pointer/color survive session export/import and Community canonicalization; invalid slots and colors are rejected.');

const fork=sanitizeTake(forkSession(roundtrip));assert.deepEqual(fork.events,[]);assert.deepEqual(fork.snapshot,roundtrip.snapshot);assert.deepEqual(fork.scene,roundtrip.scene);
controller.reset();const arcs=[],lines=[];const ctx={save(){},restore(){},beginPath(){},stroke(){},moveTo(x,y){this.from=[x,y];},lineTo(x,y){lines.push([this.from,[x,y]]);},arc(...a){arcs.push(a);},ellipse(){}};
controller.replayGesture({pointer:1,color:0,active:true,kind:'hold',held:.5,x:.2,y:.3});controller.replayGesture({pointer:2,color:1,active:true,kind:'hold',held:.7,x:.8,y:.6});controller.draw(ctx,1000,600,time);assert.equal(arcs.length,2,'both recorded fingers retain their Gather rings');assert.equal(lines.length,0,'separate finger trails never connect');
controller.replayGesture({pointer:1,active:false,ended:true,kind:'cancel'});arcs.length=0;controller.draw(ctx,1000,600,time);assert.equal(arcs.length,1,'one recorded cancellation leaves the other finger visible');controller.reset();
window.matchMedia=()=>({matches:true});gatherAgain();const currents=forces.length+pulses.length;controller.frame(.016,time+60);touch('pointerup',1,300,300);touch('pointerup',2,700,300);assert.equal(forces.length+pulses.length,currents,'reduced-motion pinch adds no currents or outward pulse');
console.log('PASS: independent replay rings, no cross-finger trail connections, isolated replay cancellation and reduced-motion Gather/Bloom.');
