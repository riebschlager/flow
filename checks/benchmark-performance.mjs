// Optional paired CPU benchmark; no machine-specific pass/fail threshold.
import {performance} from 'node:perf_hooks';
import {Fluid as Old} from './reference/fluid.mjs';import {Fluid as New} from '../public/fluid.js';
import {createFluidColorizer as oldColor,renderFluidPixels as oldRender} from './reference/fluid-renderer.mjs';import {createFluidColorizer as newColor,renderFluidPixels as newRender} from '../public/fluid-renderer.js';
const all=[];for(const [name,w,h] of [['desktop',241,144],['portrait',111,145]]){
 const cases=[['before',Old,oldRender,oldColor],['after',New,newRender,newColor]].map(([variant,Class,render,color])=>{const sim=new Class(w,h);for(let i=0;i<28;i++)sim.splat(.18+(i%7)*.1,.22+Math.floor(i/7)*.15,[[.4,.3,1],[.2,.8,1],[1,.4,.4],[1,.8,.2]][i%4],.04,Math.sin(i)*10,Math.cos(i)*8);for(let i=0;i<30;i++)sim.step();return {variant,sim,render,color:color('aurora'),pixels:new Uint8ClampedArray(w*h*4),step:[],raster:[]};});
 for(let run=0;run<9;run++)for(const item of run%2?[...cases].reverse():cases){let start=performance.now();for(let i=0;i<24;i++)item.sim.step();item.step.push((performance.now()-start)/24);start=performance.now();for(let i=0;i<24;i++)item.render(item.sim,item.pixels,i/60,item.color);item.raster.push((performance.now()-start)/24);}
 for(const item of cases){const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];const r={name,variant:item.variant,stepMs:median(item.step),rasterMs:median(item.raster)};all.push(r);console.log(JSON.stringify(r));}
}
