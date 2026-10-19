import {canonicalDyes} from './palettes.js?rev=gestures-32';
const clamp=(v,lo=0,hi=1)=>Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):lo;
export const normalizeFluidListens=value=>value===true;
export const arpPosition=(index,count)=>count===1?.5:.12+.76*index/(count-1);
// Four pigments share three channels. Choose the best nonnegative two-pigment
// fit, rather than mistaking a single pigment's RGB channels for a collision.
const pairs=[];
for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){const x=canonicalDyes[a],y=canonicalDyes[b],aa=x[0]**2+x[1]**2+x[2]**2,bb=y[0]**2+y[1]**2+y[2]**2,ab=x[0]*y[0]+x[1]*y[1]+x[2]*y[2];pairs.push({a,b,x,y,aa,bb,ab,det:aa*bb-ab*ab});}
export function fluidRegion(x=.5,y=.5,rx=.045,ry=.5){return {x,y,rx,ry,density:new Float64Array(4),speed:0,curl:0,mixing:0};}
export function analyzeFluid(sim,regions){
 for(let n=0;n<regions.length;n++){
  const region=regions[n],out=region.density;out.fill(0);let speed=0,curl=0,mixing=0,count=0;
  const x0=Math.max(0,Math.floor((region.x-region.rx)*sim.w)),x1=Math.min(sim.w,Math.ceil((region.x+region.rx)*sim.w)),y0=Math.max(0,Math.floor((region.y-region.ry)*sim.h)),y1=Math.min(sim.h,Math.ceil((region.y+region.ry)*sim.h));
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const k=x+y*sim.w,r=clamp(sim.r[k],0,5),g=clamp(sim.g[k],0,5),b=clamp(sim.b[k],0,5);let best=Infinity,first=0,second=0,ai=0,bi=1;
   for(let p=0;p<pairs.length;p++){const q=pairs[p],ar=q.x[0]*r+q.x[1]*g+q.x[2]*b,br=q.y[0]*r+q.y[1]*g+q.y[2]*b;let a=(ar*q.bb-br*q.ab)/q.det,c=(br*q.aa-ar*q.ab)/q.det;if(a<0){a=0;c=Math.max(0,br/q.bb);}if(c<0){c=0;a=Math.max(0,ar/q.aa);}const error=(r-a*q.x[0]-c*q.y[0])**2+(g-a*q.x[1]-c*q.y[1])**2+(b-a*q.x[2]-c*q.y[2])**2;if(error<best){best=error;first=a;second=c;ai=q.a;bi=q.b;}}
   out[ai]+=first;out[bi]+=second;const spin=clamp(Math.abs(sim.curl[k]),0,1000);speed+=Math.hypot(clamp(sim.u[k],-180,180),clamp(sim.v[k],-180,180));curl+=spin;mixing+=Math.min(first,second)*Math.min(10,spin);count++;
  }
  const scale=1/Math.max(1,count);for(let i=0;i<4;i++)out[i]*=scale;region.speed=speed*scale;region.curl=curl*scale;region.mixing=mixing*scale;
 }
 return regions;
}
export function fluidModulation(region,out,quantize=false){let density=0;for(let i=0;i<4;i++)density+=clamp(region.density[i],0,10);const full=clamp(density/1.5);out.velocity=clamp(.8+.4*full,.8,1.2);out.cutoff=12500-3500*full;out.push=quantize?0:(clamp(region.speed/35)*2-1)*.01;return out;}
export class FluidListen{
 constructor(){this.bands=Array.from({length:16},()=>fluidRegion());this.collisions=Array.from({length:12},(_,i)=>fluidRegion((i+.5)/12,.5,1/24,.5));this.regions=[...this.bands,...this.collisions];this.modulation={velocity:1,cutoff:11000,push:0};this.last=-Infinity;this.lastShimmer=-Infinity;this.quietUntil=0;this.active=false;this.ready=false;this.fullness=new Float64Array(16);this.speeds=new Float64Array(16);}
 reset(now=0){this.ready=false;this.active=false;this.last=-Infinity;this.quietUntil=now+4;}
 update(now,sim,{enabled=false,hidden=false,replaying=false,painting=false,count=8}={}){
  if(!enabled||replaying){this.reset(now);return null;}if(hidden)return null;
  if(!this.active){this.active=true;this.quietUntil=now+4;}if(painting)this.quietUntil=now+.8;
  if(now-this.last<.1)return null;const first=!this.ready;this.last=now;
  for(let i=0;i<16;i++)this.bands[i].x=arpPosition(Math.min(i,count-1),count);
  analyzeFluid(sim,this.regions);
  for(let i=0;i<16;i++){const m=fluidModulation(this.bands[i],this.modulation);this.fullness[i]+=(m.velocity-this.fullness[i])*(first?1:.2);this.speeds[i]+=(m.push-this.speeds[i])*(first?1:.2);}this.ready=true;
  if(painting||now<this.quietUntil||now-this.lastShimmer<4)return null;
  let region=null,score=.65;for(let i=0;i<this.collisions.length;i++){const r=this.collisions[i];if(r.curl>1.5&&r.mixing>score){region=r;score=r.mixing;}}
  if(region)this.lastShimmer=now;return region;
 }
 arp(index,quantize=false){if(!this.ready)return null;const out=this.modulation;out.velocity=clamp(this.fullness[index],.8,1.2);out.cutoff=12500-(out.velocity-.8)/.4*3500;out.push=quantize?0:clamp(this.speeds[index],-.01,.01);return out;}
}
export function shimmerNote(chordNotes,region){return {pitch:Math.min(127,chordNotes[0]+24),expression:{velocity:.15,sustain:1,cutoff:6500,pan:(region.x*2-1)*.8,energy:.03,attack:.6,attackAmount:1},options:{levelScale:.1,noteLength:3.6,noteEnvelope:[{duration:0,volume:0},{duration:.6,volume:.22},{duration:1.4,volume:.14},{duration:1.6,volume:0}]}};}
