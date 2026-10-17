import assert from 'node:assert/strict';
import {createFluidColorizer,renderFluidPixels} from '../public/fluid-renderer.js';
import {colorPalettes,canonicalDyes,hexRGB} from '../public/palettes.js';
import {Fluid} from '../public/fluid.js';
const saturation=rgb=>1-Math.min(...rgb)/Math.max(...rgb);
const out=[0,0,0],samples=[...canonicalDyes,[1,1,1],[.8,1,.9],[2,1,3],canonicalDyes.reduce((sum,c)=>sum.map((v,j)=>v+c[j]),[0,0,0])];
for(const [id,palette] of Object.entries(colorPalettes)){
 const colorize=createFluidColorizer(id),swatches=palette.colors.map(c=>hexRGB(c.hex).map(v=>v*255));
 colorize(0,0,0,1,0,out);assert.deepEqual(out,[7,10,17]);
 // The actual 32 swatches, including muted/pastel ones, are the reference.
 for(let i=0;i<4;i++){
  colorize(...canonicalDyes[i].map(v=>v*100),1,0,out);
  out.forEach((v,j)=>assert(Math.abs(v-swatches[i][j])<1e-5,`${id}/${i} matches its original swatch`));
  assert(Math.abs(saturation(out)-saturation(swatches[i]))<1e-5,'no saturation floor');
 }
 const maxSaturation=Math.max(...swatches.map(saturation));
 for(const dye of samples)for(const density of [.001,.02,.1,.5,1,5,50,10000])for(const lighting of [.3,1,1.6])for(const gradient of [-1e4,0,1e4]){
  colorize(...dye.map(v=>v*density),lighting,gradient,out);
  out.forEach((v,j)=>assert(Number.isFinite(v)&&v>=0&&v<=Math.max(...swatches.map(c=>c[j]))+1e-5,`${id}: palette channel bounds`));
  if(density>=50){assert(saturation(out)<=maxSaturation+1e-5,`${id}: mixtures never exceed the palette's saturation`);}
 }
 for(const dye of samples){const a=[],b=[];colorize(...dye,1,0,a);colorize(dye[0]+1e-7,dye[1]-1e-7,dye[2],1,0,b);a.forEach((v,j)=>assert(Math.abs(v-b[j])<.001));}
 for(const dye of canonicalDyes){const a=[],b=[];colorize(...dye.map(v=>v*10),1,0,a);colorize(...dye.map(v=>v*1000),1,0,b);a.forEach((v,j)=>assert(Math.abs(v/Math.max(...a)-b[j]/Math.max(...b))<1e-5));}
}
// Repeated locked-color drops must keep their hue even at the solver's dye cap.
for(const dye of canonicalDyes){const sim=new Fluid(32,24),i=16+12*sim.w;for(let n=0;n<80;n++)sim.splat(.5,.5,dye,.06);const peak=Math.max(sim.r[i],sim.g[i],sim.b[i]);assert(peak<=5);[sim.r[i],sim.g[i],sim.b[i]].forEach((v,j)=>assert(Math.abs(v/peak-dye[j]/Math.max(...dye))<1e-6));}
// A hard two-color solver edge gets a gradual reconstruction, without changing
// either uniform region or exposing an isolated one-cell color spike.
const edge=new Fluid(16,12);for(let y=0;y<edge.h;y++)for(let x=0;x<edge.w;x++){const dye=canonicalDyes[x<8?0:2];['r','g','b'].forEach((k,j)=>edge[k][x+y*edge.w]=dye[j]);}
const capture=[];renderFluidPixels(edge,new Uint8ClampedArray(edge.n*4),0,(r,g,b)=>capture.push([r,g,b]));
const row=capture.slice(6*edge.w,7*edge.w);row[3].forEach((v,j)=>assert(Math.abs(v-canonicalDyes[0][j])<1e-6));row[12].forEach((v,j)=>assert(Math.abs(v-canonicalDyes[2][j])<1e-6));assert(row[7][0]>canonicalDyes[0][0]&&row[7][0]<row[8][0]&&row[8][0]<canonicalDyes[2][0]);
const sim=new Fluid(64,48);for(let i=0;i<36;i++)sim.splat(.2+(i%6)*.12,.2+Math.floor(i/6)*.12,canonicalDyes[i%4],.07,3,-2);for(let i=0;i<20;i++)sim.step(1/30);
const before=Object.fromEntries(['r','g','b','u','v'].map(k=>[k,sim[k].slice()]));const pixels=new Uint8ClampedArray(sim.n*4);
for(const id of Object.keys(colorPalettes)){renderFluidPixels(sim,pixels,3,createFluidColorizer(id),{luminance:1.25});assert(pixels.some((v,i)=>i%4!==3&&v>40));for(let i=3;i<pixels.length;i+=4)assert.equal(pixels[i],255);}
for(const k of Object.keys(before))assert.deepEqual(sim[k],before[k],'rendering must not change simulation/session data');
console.log('PASS: all 32 palette swatches retain their RGB/saturation, dense mixtures remain within palette bounds, neutral noise is stable, shared dye caps preserve locked hues, grid reconstruction smooths edges and preserves uniform colors, and rendering leaves fluid fields unchanged.');
