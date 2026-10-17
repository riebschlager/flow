import assert from 'node:assert/strict';
import {createFluidColorizer,renderFluidPixels} from '../public/fluid-renderer.js';
import {colorPalettes,canonicalDyes} from '../public/palettes.js';
import {Fluid} from '../public/fluid.js';
const saturation=rgb=>1-Math.min(...rgb)/Math.max(...rgb);
const out=[0,0,0],samples=[...canonicalDyes,[1,1,1],[.8,1,.9],[2,1,3],canonicalDyes.reduce((sum,c)=>sum.map((v,j)=>v+c[j]),[0,0,0])];
for(const id of Object.keys(colorPalettes)){
 const colorize=createFluidColorizer(id);
 colorize(0,0,0,1,0,out);assert.deepEqual(out,[7,10,17]);
 for(const dye of samples)for(const density of [.001,.02,.1,.5,1,5,50,10000])for(const lighting of [.3,1,1.6])for(const gradient of [-1e4,0,1e4]){
  colorize(...dye.map(v=>v*density),lighting,gradient,out,0,[1.1,.9,1.05]);
  assert(out.every(v=>Number.isFinite(v)&&v>=0&&v<=245),`${id}: bounded exposure`);
  if(density>=5)assert(saturation(out)>.84,`${id}: dense fluid retains saturation`);
 }
 // Scaling dye changes brightness, rather than pushing channels toward white.
 for(const dye of canonicalDyes){const a=[],b=[];colorize(...dye.map(v=>v*10),1,0,a);colorize(...dye.map(v=>v*1000),1,0,b);a.forEach((v,j)=>assert(Math.abs(v/Math.max(...a)-b[j]/Math.max(...b))<1e-5));}
 // Infinitesimal solver noise in a neutral mixture must not cause hue flicker.
 for(const dye of samples){const a=[],b=[];colorize(...dye,1,0,a);colorize(dye[0]+1e-7,dye[1]-1e-7,dye[2],1,0,b);a.forEach((v,j)=>assert(Math.abs(v-b[j])<.01));}
}
// Out-of-polygon RGB mixtures (including per-channel solver caps) must stay
// in the visual family of palettes with a restricted hue range.
const ember=createFluidColorizer('ember'),tide=createFluidColorizer('tide');
for(let i=0;i<240;i++){
 const dye=[0,1,2].map(j=>.2+Math.abs(Math.sin(i*1.618+j))*5);
 ember(...dye,1,0,out);assert(out[0]>=out[1]&&out[0]>=out[2],'Ember never extrapolates green/cyan');
 tide(...dye,1,0,out);assert(out[0]<Math.max(out[1],out[2]),'Tidal blue stays blue/green');
 for(const id of Object.keys(colorPalettes)){const colorize=createFluidColorizer(id),a=[],b=[];colorize(...dye,1,0,a);colorize(dye[0]+1e-6,dye[1],dye[2]-1e-6,1,0,b);assert(a.every((v,j)=>Math.abs(v-b[j])<.02));}
}
// Demonstrate the regression directly at an ordinary dense four-color overlap.
const mixture=samples.at(-1).map(v=>v*8),old=mixture.map(v=>255*(1-Math.exp(-v*1.7)));createFluidColorizer('classic')(...mixture,1,0,out);assert(saturation(old)<.01);assert(saturation(out)>.85);
const sim=new Fluid(64,48);for(let i=0;i<36;i++)sim.splat(.2+(i%6)*.12,.2+Math.floor(i/6)*.12,canonicalDyes[i%4],.07,3,-2);for(let i=0;i<20;i++)sim.step(1/30);
const before=Object.fromEntries(['r','g','b','u','v'].map(k=>[k,sim[k].slice()]));const pixels=new Uint8ClampedArray(sim.n*4);
for(const id of Object.keys(colorPalettes)){
 renderFluidPixels(sim,pixels,3,createFluidColorizer(id),{luminance:1.25,tint:[1.1,.95,1.08]});
 assert(pixels.some((v,i)=>i%4!==3&&v>40));assert(!pixels.some((v,i)=>i%4!==3&&v>245));for(let i=3;i<pixels.length;i+=4)assert.equal(pixels[i],255);
}
for(const k of Object.keys(before))assert.deepEqual(sim[k],before[k],'rendering must not change simulation/session data');
console.log('PASS: all eight palettes retain saturation in dense/neutral/overlapping dye, hue stays stable as density rises, highlights never clip, neutral solver noise is stable, empty canvas stays dark, and rendering leaves the fluid fields unchanged.');
