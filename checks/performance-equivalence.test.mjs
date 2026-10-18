import assert from 'node:assert/strict';
import {Fluid} from '../public/fluid.js';import {Fluid as ReferenceFluid} from './reference/fluid.mjs';
import {createFluidColorizer,renderFluidPixels} from '../public/fluid-renderer.js';import {createFluidColorizer as referenceColorizer,renderFluidPixels as referenceRender} from './reference/fluid-renderer.mjs';
import {colorPalettes,canonicalDyes} from '../public/palettes.js';
const fields=['u','v','r','g','b','p','div','curl'];let frames=0,images=0;
for(const [w,h] of [[8,8],[61,43],[111,145],[241,144]]){
 const actual=new Fluid(w,h),reference=new ReferenceFluid(w,h);
 for(let frame=0;frame<44;frame++){
  for(const sim of [actual,reference]){
   sim.swirl=frame%9/8;sim.persistence=frame%7/6;
   if(frame%3===0)sim.splat(.14+(frame%7)*.1,.18+(frame%5)*.13,canonicalDyes[frame%4],.06,Math.sin(frame)*45,Math.cos(frame)*32);
   if(frame%4===0)sim.pulse(.3,.7,.8,.2,frame%8?-1:1);
   if(frame%5===0)sim.force(.75,.3,100,-60,.12);
   if(frame===22)sim.resize(h,w);
   if(frame===33)sim.clear();
   sim.step([0,1/120,1/60,.033,.05][frame%5]);
  }
  for(const key of fields)assert.deepEqual(actual[key],reference[key],`${w}x${h} frame ${frame}: ${key} is bit-identical`);frames++;
  if([0,21,22,33].includes(frame)){const pixels=new Uint8ClampedArray(actual.n*4),expected=new Uint8ClampedArray(actual.n*4);renderFluidPixels(actual,pixels,frame/60,createFluidColorizer('classic'));referenceRender(reference,expected,frame/60,referenceColorizer('classic'));assert.deepEqual(pixels,expected,'geometry cache remains exact through resize/clear');images++;}
 }
 for(const palette of Object.keys(colorPalettes))for(const time of [0,12.345]){
  const pixels=new Uint8ClampedArray(actual.n*4),expected=new Uint8ClampedArray(actual.n*4);
  renderFluidPixels(actual,pixels,time,createFluidColorizer(palette),{luminance:1.25});referenceRender(reference,expected,time,referenceColorizer(palette),{luminance:1.25});assert.deepEqual(pixels,expected,`${palette}: exact output pixels`);images++;
 }
}
console.log(`PASS: ${frames} bit-identical fluid frames, ${images} exact palette renders, pressure iterations/boundaries, turbulent gestures, dye decay, resize and clear agree with version 38.`);
