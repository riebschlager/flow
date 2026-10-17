import assert from 'node:assert/strict';
import {Fluid} from '../public/fluid.js';
import {fluidGridSize,resampleFluidState} from '../public/fluid-viewport.js';

function moments(sim,width,height){let mass=0,x=0,y=0;for(let j=0;j<sim.h;j++)for(let i=0;i<sim.w;i++){const d=sim.r[i+j*sim.w];mass+=d;x+=(i+.5)/sim.w*width*d;y+=(j+.5)/sim.h*height*d;}x/=mass;y/=mass;let xx=0,yy=0;for(let j=0;j<sim.h;j++)for(let i=0;i<sim.w;i++){const d=sim.r[i+j*sim.w];xx+=((i+.5)/sim.w*width-x)**2*d;yy+=((j+.5)/sim.h*height-y)**2*d;}return {mass:mass/sim.n,x:x/width,y:y/height,aspect:Math.sqrt(xx/yy)};}
for(const [width,height,mobile] of [[338,488,true],[366,456,true],[406,508,true],[744,360,true],[844,390,true],[390,844,true],[1000,600,false],[900,1200,false],[1920,1080,false],[3200,600,false],[720,720,true],[319.75,411.25,true]]){
 const grid=fluidGridSize(width,height,{mobile}),sim=new Fluid(grid.w,grid.h);
 assert(grid.w*grid.h<=(mobile?16128:35000));assert(Math.max(grid.w,grid.h)<=(mobile?224:384));
 const cellAspect=width*grid.h/(height*grid.w);assert(Math.abs(cellAspect-1)<.02,`${width}×${height} must have approximately square cells`);
 sim.splat(.5,.5,[1,.3,.1],.065);assert(Math.abs(moments(sim,width,height).aspect-1)<.02,'circular dye footprint remains circular in CSS pixels');
}
assert.equal(fluidGridSize(0,600),null);assert.equal(fluidGridSize(300,NaN),null);
// Demonstrate the previous portrait distortion with the old landscape-only grid.
const stretched=new Fluid(144,112);stretched.splat(.5,.5,[1,0,0],.065);assert(Math.abs(moments(stretched,338,488).aspect-1)>.4);

const sim=new Fluid(108,150);sim.swirl=.73;sim.persistence=.91;sim.splat(.28,.59,[.5,.2,1],.07);sim.u.fill(12);sim.v.fill(-9);const oldU=sim.u[0]/sim.w,oldV=sim.v[0]/sim.h,before=moments(sim,1,1);
assert.equal(sim.resize(108,150),false);assert.equal(sim.resize(210,76),true);assert.equal(sim.swirl,.73);assert.equal(sim.persistence,.91);let after=moments(sim,1,1);assert(Math.abs(before.mass/after.mass-1)<.01);assert(Math.abs(before.x-after.x)<.002);assert(Math.abs(before.y-after.y)<.002);assert(Math.abs(sim.u[0]/sim.w-oldU)<1e-8);assert(Math.abs(sim.v[0]/sim.h-oldV)<1e-8);
for(const key of ['u0','v0','tmp','p','p0','div','curl'])assert(sim[key].every(v=>v===0),'pressure/advection scratch must not contain the old grid');
for(let i=0;i<sim.n;i++)if(sim.b[i]>.001){assert(Math.abs(sim.r[i]/sim.b[i]-.5)<1e-6);assert(Math.abs(sim.g[i]/sim.b[i]-.2)<1e-6);}
sim.resize(108,150);after=moments(sim,1,1);assert(Math.abs(before.mass/after.mass-1)<.01);assert(Math.abs(before.x-after.x)<.002);assert(Math.abs(before.y-after.y)<.002);assert(sim.r.some(v=>v>.1));for(let i=0;i<3;i++)sim.step(1/60);for(const key of ['u','v','r','g','b'])assert(sim[key].every(Number.isFinite));assert.throws(()=>sim.resize(4,4));
// Legacy session grids use the same mapping, including normalized velocity units.
const source={w:16,h:12,u:Array(192).fill(8),v:Array(192).fill(-3),r:Array(192).fill(.4),g:Array(192).fill(.2),b:Array(192).fill(.7)},target=new Fluid(100,140);resampleFluidState(source,target);assert(Math.abs(target.u[0]/target.w-8/16)<1e-8);assert(Math.abs(target.v[0]/target.h+3/12)<1e-8);assert(target.r.every(v=>Math.abs(v-.4)<1e-7));assert(target.g.every(v=>Math.abs(v-.2)<1e-7));assert(target.b.every(v=>Math.abs(v-.7)<1e-7));
console.log('PASS: mobile portrait/landscape, desktop/Zen and fractional sizes; square CSS cells and circular splats; bounded workload; hue/dye preservation; normalized velocity on resize/session restore; same-size no-op and stable post-resize simulation.');
