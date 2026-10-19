import assert from 'node:assert/strict';
import {GPUFluidRenderer,effectStrengths,colorShader,surfaceShader} from '../public/gpu-fluid-renderer.js';
import {Fluid} from '../public/fluid.js';
const sim=new Fluid(8,8),listeners={},calls=[];let float=true,compile=true;
const gl=new Proxy({MAX_TEXTURE_IMAGE_UNITS:1,NO_ERROR:0,FRAMEBUFFER_COMPLETE:99,getParameter:()=>16,getError:()=>float?0:1,getShaderParameter:()=>compile,getProgramParameter:()=>true,checkFramebufferStatus:()=>99,getUniformLocation:(p,name)=>name,texImage2D(...args){calls.push(['upload',args]);},texSubImage2D(...args){calls.push(['upload',args]);},uniform4fv:(name,value)=>calls.push([name,value]),uniform1f:(name,value)=>calls.push([name,value])},{get:(obj,key)=>obj[key]??(key.startsWith('create')?()=>({}):()=>{})});
const canvas={getContext:()=>gl,addEventListener:(name,fn)=>listeners[name]=fn};
assert.equal(new GPUFluidRenderer({canvas,search:'?renderer=cpu'}).ready,false);
assert.equal(new GPUFluidRenderer({canvas:{getContext:()=>null,addEventListener(){}},search:''}).ready,false);
let renderer=new GPUFluidRenderer({canvas,search:''});assert(renderer.ready);assert(renderer.render(sim,1,{energy:0}));assert.deepEqual(calls.findLast(c=>c[0]==='effects')[1],[0,0,0,0]);
assert(calls.filter(c=>c[0]==='upload').some(c=>c[1].at(-1)===sim.r),'upload solver arrays directly');
let prevented=false;listeners.webglcontextlost({preventDefault(){prevented=true;}});assert(prevented);assert(!renderer.render(sim,2));listeners.webglcontextrestored();assert(renderer.render(sim,3));sim.resize(13,9);assert(renderer.render(sim,4));assert.equal(canvas.width,13);assert.equal(canvas.height,9);
float=false;renderer=new GPUFluidRenderer({canvas,search:''});sim.u.fill(-15);assert(renderer.render(sim,0,{energy:1}));assert.equal(renderer.float,false);assert.equal(renderer.bytes[3][0],0);assert.equal(renderer.scales[3],30);assert(calls.some(c=>c[0]==='motionBias'&&c[1]===.5));
compile=false;renderer=new GPUFluidRenderer({canvas,search:''});assert(!renderer.ready);assert(!renderer.render(sim,0));
for(const name of ['bloom','refraction','shimmer','grain']){const effects=effectStrengths({energy:1,[name]:false}),index=['bloom','refraction','shimmer','grain'].indexOf(name);assert.equal(effects[index],0);effects.forEach((v,i)=>{if(i!==index)assert(v>0);});}
assert(effectStrengths({energy:1,reverb:1})[0]>effectStrengths({energy:1,reverb:0})[0]);assert.deepEqual(effectStrengths({energy:-1}),[0,0,0,0]);assert.match(colorShader,/exp\(-density\*1.65\)/);assert(!surfaceShader.includes('sin(time'),'grain and interference do not animate independently');
console.log('PASS: GPU capability/compile fallback, direct float uploads, signed 8-bit fallback, resize, context loss/recovery, independent effects and energy-zero bypass.');
