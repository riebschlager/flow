import assert from 'node:assert/strict';
import {writeInDye,normalizeDyeTitle,titleLines} from '../public/dye-text.js';
import {canonicalDyes} from '../public/palettes.js';
import {Fluid} from '../public/fluid.js';
import {sessionFixture} from './session-fixture.mjs';
import {sanitizeTake} from '../public/recording-state.js';
import {validateTakeMetadata,encodePerformance,decodePerformance,forkSession} from '../public/recorder-core.js';
import {canonicalMetadata} from '../lib/community-validation.mjs';
for(const [w,h] of [[224,144],[104,144]]){
 const sim=new Fluid(w,h),mask=new Uint8ClampedArray(w*h*4),calls=[];
 const ctx={measureText:text=>({width:text.length*parseFloat(ctx.font.split(' ')[1])*.5}),fillText(text,x,y,max){calls.push({text,x,y,max});const size=parseFloat(ctx.font.split(' ')[1]);for(let j=Math.max(1,Math.round(y-size/2));j<Math.min(h-1,y+size/2);j++)for(let i=Math.max(1,Math.round(x-Math.min(max,text.length*size*.5)/2));i<Math.min(w-1,x+Math.min(max,text.length*size*.5)/2);i++)mask[(i+j*w)*4+3]=i%2?255:90;},getImageData:()=>({data:mask})};
 const makeCanvas=()=>({getContext:()=>ctx});const result=writeInDye(sim,'A long title that will dissolve with the current',{color:1,makeCanvas});assert.equal(calls.length,2);assert(result.fontSize>=8);assert(result.coverage>100);assert.equal(ctx.filter,'blur(0.35px)');
 for(let k=0;k<w*h;k++){if(mask[k*4+3]){assert(sim.g[k]>0);assert(Math.abs(sim.r[k]/sim.g[k]-canonicalDyes[1][0]/canonicalDyes[1][1])<1e-6);}else assert.equal(sim.g[k],0);assert.equal(sim.u[k],0);assert.equal(sim.v[k],0);}
 for(let i=0;i<12;i++)writeInDye(sim,'A long title that will dissolve with the current',{color:1,makeCanvas});assert(Math.max(...sim.g)<=5);assert(Math.max(...sim.b)<=5);
}
// End cards must stay inside both tall and wide export crops.
for(const frame of [{x:.34,y:0,w:.32,h:1},{x:0,y:.34,w:1,h:.32}]){
 const calls=[],sim=new Fluid(300,180),ctx={measureText:t=>({width:t.length*8}),fillText:(text,x,y,max)=>calls.push({x,y,max}),getImageData:()=>({data:new Uint8ClampedArray(sim.w*sim.h*4)})};
 writeInDye(sim,'A very long exported end card title',{frame,y:.67,size:.085,makeCanvas:()=>({getContext:()=>ctx})});
 for(const call of calls){assert(call.x-call.max/2>=frame.x*sim.w);assert(call.x+call.max/2<=(frame.x+frame.w)*sim.w);assert(call.y>=frame.y*sim.h&&call.y<=(frame.y+frame.h)*sim.h);}
}
assert.throws(()=>normalizeDyeTitle({text:'x'.repeat(81)}));assert.throws(()=>normalizeDyeTitle({text:'a\u0000b'}));assert.throws(()=>normalizeDyeTitle({text:'Hello',color:4}));
const take=sessionFixture();take.events.push({t:1,kind:'title',data:{text:'Evening tide',color:2,unexpected:'removed'}});take.events.sort((a,b)=>a.t-b.t);sanitizeTake(validateTakeMetadata(take));assert.deepEqual(take.events.at(-1).data,{text:'Evening tide',color:2});assert.deepEqual(sanitizeTake(await decodePerformance(encodePerformance(take))),take);assert.equal(forkSession(take).events.length,0);assert.equal(canonicalMetadata(structuredClone(take),'Public tide','id',Date.now()).events.at(-1).data.text,'Evening tide');
for(const text of ['https://bad.com','fuck','a\u200bb','<title>','f.u.c.k']){const bad=structuredClone(take);bad.events.at(-1).data.text=text;assert.throws(()=>canonicalMetadata(bad,'Public tide','id',Date.now()));}
console.log('PASS: desktop/phone mask coverage, wrap and minimum font size, palette dye basis, shared density cap, untouched velocity, title validation, file roundtrip, fork timeline removal and public text gates.');
