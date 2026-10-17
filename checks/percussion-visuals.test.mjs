import assert from 'node:assert/strict';
import {Fluid} from '../dist/fluid.js';
import {stirPercussion} from '../dist/percussion-visuals.js';
import {drumVoices} from '../dist/rhythm.js';
const sims=Array.from({length:3},()=>new Fluid(112,78));
for(const sim of sims)for(let i=0;i<8;i++){const a=i/8*Math.PI*2;sim.splat(.5+Math.cos(a)*.14,.5+Math.sin(a)*.14,[.6,.3,.8],.06,0,0);}
const [quiet,old,current]=sims;
old.pulse(.5,.5,.85*.45,.11,1);
stirPercussion(current,{x:.5,y:.5,strength:.85*.45*(.65+.75*.45),voice:'kick',weight:1,lane:0,step:0});
for(let i=0;i<16;i++)for(const sim of sims)sim.step(1/30);
const dyeDisplacement=sim=>sim.r.reduce((sum,v,i)=>sum+Math.abs(v-quiet.r[i]),0);
const ratio=dyeDisplacement(current)/dyeDisplacement(old);
assert(ratio>4,'default bass hits must move substantially more dye after pressure projection and advection');
for(const [voice,{weight}] of Object.entries(drumVoices)){
 const sim=new Fluid(96,64);sim.splat(.5,.5,[.4,.2,.7],.06,0,0);
 const dye=[sim.r.slice(),sim.g.slice(),sim.b.slice()];
 stirPercussion(sim,{x:.5,y:.5,strength:.5,voice,weight,lane:1,step:7});
 assert.deepEqual(sim.r,dye[0]);assert.deepEqual(sim.g,dye[1]);assert.deepEqual(sim.b,dye[2]);
 assert(sim.u.some(v=>Math.abs(v)>1));assert(sim.v.some(v=>Math.abs(v)>1));
 const capped=new Fluid(96,64);stirPercussion(capped,{x:.5,y:.5,strength:1.4,voice,weight,lane:0,step:0});for(let i=0;i<capped.n;i++)assert(Math.hypot(capped.u[i],capped.v[i])<=180.001);
 const u=sim.u.slice(),v=sim.v.slice();stirPercussion(sim,{x:.5,y:.5,strength:0,voice,weight});assert.deepEqual(sim.u,u);assert.deepEqual(sim.v,v);
}
// Twice the maximum supported hit density: four full-strength hits every frame.
const stress=new Fluid(96,64);stress.swirl=1;stress.persistence=1;stress.splat(.5,.5,[1,.5,.2],.15);
const voices=Object.entries(drumVoices);let peak=0;
for(let frame=0;frame<360;frame++){
 for(let lane=0;lane<4;lane++){
  const [voice,{weight}]=voices[(frame+lane)%voices.length];
  stirPercussion(stress,{x:[.25,.48,.72,.77][lane],y:[.68,.42,.66,.31][lane],strength:1.4,voice,weight,lane,step:frame%16});
 }
 stress.step(1/30);
 for(let i=0;i<stress.n;i++){assert(Number.isFinite(stress.u[i])&&Number.isFinite(stress.v[i]));peak=Math.max(peak,Math.hypot(stress.u[i],stress.v[i]));}
}
assert([...stress.r,...stress.g,...stress.b].every(Number.isFinite));assert(peak<500);
console.log(`PASS: default bass moves ${ratio.toFixed(1)}× as much dye as before; all ten voices stir existing color, zero strength is inert, and 1,440 dense full-strength hits remain bounded and finite.`);
