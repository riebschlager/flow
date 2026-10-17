import assert from 'node:assert/strict';
import {GestureTracker,noteExpression,shapeExpression,normalizeGestureSettings} from '../dist/gestures.js';
import {instruments} from '../dist/music.js';
import {Fluid} from '../dist/fluid.js';
const top=noteExpression(.5,.05,{energy:0},100),bottom=noteExpression(.5,.95,{energy:0},100);assert(top.cutoff>bottom.cutoff);assert(top.sustain<bottom.sustain);assert(top.velocity<bottom.velocity);assert(top.ink<bottom.ink);
const slow=noteExpression(.5,.5,{energy:0},100),fast=noteExpression(.5,.5,{energy:1},100);assert(fast.velocity>slow.velocity);assert(fast.sustain<slow.sustain);assert(fast.cutoff>slow.cutoff);assert(fast.force>slow.force);assert(fast.ink>slow.ink);assert(noteExpression(0,.5,{},100).pan<0);assert(noteExpression(1,.5,{},100).pan>0);
const neutral=noteExpression(0,1,{energy:1,orbit:1},0);for(const key of ['velocity','sustain','ink','force'])assert.equal(neutral[key],1);assert.equal(neutral.pan,0);
for(const [key,instrument] of Object.entries(instruments))for(const y of [0,.5,1])for(const energy of [0,.5,1]){const expression=noteExpression(.2,y,{energy},100),shape=shapeExpression({...instrument,key},expression);assert(shape.duration>=.4&&shape.duration<=9);assert(shape.velocity>=.15&&shape.velocity<=1.25);assert(shape.envelope.every(s=>s.duration>=0&&s.volume>=0&&s.volume<=1));assert(Math.abs(shape.envelope.reduce((sum,s)=>sum+s.duration,0)-shape.duration)<1e-9);assert.equal(shape.envelope[0].volume,0);assert.equal(shape.envelope.at(-1).volume,0);}
const tracker=new GestureTracker();tracker.begin(.5,.5,0);assert.equal(tracker.sample(1400).kind,'hold');assert.equal(tracker.end(1400).kind,'bloom');tracker.begin(.5,.5,0);assert.equal(tracker.end(1600,true).kind,'cancel');
tracker.begin(.1,.5,0);for(let i=1;i<=8;i++)tracker.move(.1+i*.08,.5,i*16);assert.equal(tracker.end(129).kind,'flick');assert.equal(tracker.sample(1000).orbit,0);
for(const spin of [-1,1]){tracker.begin(.62,.5,0);let m;for(let i=1;i<=80;i++){const a=i/80*Math.PI*2*spin;m=tracker.move(.5+Math.cos(a)*.12,.5+Math.sin(a)*.12,i*20);}assert(m.orbit>.8);assert.equal(m.kind,'orbit');assert.equal(m.spin,spin);}
tracker.begin(.4,.8,0);let m;for(let i=1;i<=10;i++)m=tracker.move(.4,.8-i*.045,i*40);assert(m.vertical);assert.equal(m.orbit,0);
assert.equal(normalizeGestureSettings({amount:999}).amount,100);assert.equal(normalizeGestureSettings({enabled:false}).enabled,false);
const fluid=new Fluid(72,48);for(let i=0;i<180;i++){fluid.force(.5,.5,18,-15);if(i%4===0)fluid.pulse(.5,.5,.4,.08);fluid.step(1/30);}assert([...fluid.u,...fluid.v].every(Number.isFinite));assert(fluid.r.every(v=>v===0));assert(fluid.u.some(v=>Math.abs(v)>.1));
console.log('PASS: depth, speed, stereo, intensity, envelopes for all 20 voices, hold/bloom, flick, both circle directions, vertical sweeps, and bounded dye-free fluid forces.');
