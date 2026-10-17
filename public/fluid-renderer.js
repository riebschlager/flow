import {canonicalDyes,getPalette,hexRGB} from './palettes.js?rev=palettes-29';
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

// Interpret the original RGB dye as a point in the four-color palette polygon.
// Capped solver channels can drift outside that polygon. Project those mixtures
// onto its nearest edge, rather than extrapolating negative colors and clipping.
const vertices=canonicalDyes.map(c=>{const sum=c[0]+c[1]+c[2];return [c[0]/sum,c[1]/sum];});
const triangles=[[0,1,3],[0,3,2]].map(indices=>{
 const [a,b,c]=indices.map(i=>vertices[i]),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
 return {indices,a,b,c,den};
});
const edges=[[0,1],[1,3],[3,2],[2,0]].map(([a,b])=>{const start=vertices[a],dx=vertices[b][0]-start[0],dy=vertices[b][1]-start[1];return {a,b,start,dx,dy,length:dx*dx+dy*dy};});
function createPigmentMapper(palette){
 const colors=getPalette(palette).colors.map(c=>hexRGB(c.hex).map(v=>v**2.2));
 return (r,g,b,out)=>{
  const sum=r+g+b,x=r/sum,y=g/sum;
  for(const {indices,a,b,c,den} of triangles){
   const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den,w=1-u-v;
   if(u>=0&&v>=0&&w>=0){for(let j=0;j<3;j++)out[j]=colors[indices[0]][j]*u+colors[indices[1]][j]*v+colors[indices[2]][j]*w;return;}
  }
  let distance=Infinity,bestEdge=edges[0],bestT=0;
  for(const edge of edges){const {start,dx,dy,length}=edge,t=clamp(((x-start[0])*dx+(y-start[1])*dy)/length,0,1),ex=x-start[0]-t*dx,ey=y-start[1]-t*dy,d=ex*ex+ey*ey;if(d<distance){distance=d;bestEdge=edge;bestT=t;}}
  for(let j=0;j<3;j++)out[j]=colors[bestEdge.a][j]*(1-bestT)+colors[bestEdge.b][j]*bestT;
 };
}

// Exposure changes value as a whole. Channel-by-channel compression would turn
// all three channels white as dye accumulates, regardless of their original hue.
export function createFluidColorizer(palette){
 const mapDye=createPigmentMapper(palette),mapped=[0,0,0];
 const primary=hexRGB(getPalette(palette).colors[0].hex),lo=Math.min(...primary),span=Math.max(...primary)-lo;
 const fallback=primary.map(v=>(v-lo)/span);
 return function colorize(r,g,b,lighting,gradient,out,offset=0,tint=[1,1,1]){
  const density=Math.max(r,g,b);
  if(density<1e-10){out[offset]=7;out[offset+1]=10;out[offset+2]=17;return;}
  mapDye(r,g,b,mapped);
  // Apply the chord's tint before saturation, so lighting cannot add gray back.
  r=mapped[0]*tint[0];g=mapped[1]*tint[1];b=mapped[2]*tint[2];
  let max=Math.max(r,g,b),min=Math.min(r,g,b),chroma=max-min;
  // Opposing colors can mix to near-neutral. Ease toward the palette's first
  // hue there, rather than amplifying tiny numeric differences into flicker.
  const neutral=clamp(1-chroma/(max*.22),0,1),bias=neutral*neutral*(3-2*neutral)*.28*max;
  r+=fallback[0]*bias;g+=fallback[1]*bias;b+=fallback[2]*bias;
  max=Math.max(r,g,b);min=Math.min(r,g,b);chroma=max-min;
  if(chroma<1e-8){r=fallback[0];g=fallback[1];b=fallback[2];min=0;max=chroma=1;}
  const saturation=clamp((1-min/max)*1.12,.86,.99);
  const coverage=-Math.expm1(-density*1.65);
  // Surface ridges lift the same hue; their intensity is bounded even after a
  // large splat. Keep headroom so no channel clips into a white highlight.
  const ridge=Math.max(0,gradient),highlight=.075*ridge/(1+ridge);
  const value=coverage*Math.min(.96,.70+.24*clamp(lighting,0,1.25)/1.25+highlight),scale=255*value;
  const base=1-saturation,boost=saturation/chroma,remaining=1-coverage;
  out[offset]=7*remaining+scale*(base+(r-min)*boost);
  out[offset+1]=10*remaining+scale*(base+(g-min)*boost);
  out[offset+2]=17*remaining+scale*(base+(b-min)*boost);
 };
}

// Pure pixel pass, also used by the renderer checks. The fluid's dye and
// velocity fields remain untouched, including during session playback.
export function renderFluidPixels(sim,pixels,time,colorize,{luminance=1,tint=[1,1,1]}={}){
 for(let i=0;i<sim.n;i++){
  const gradient=i>sim.w&&i<sim.n-sim.w?(sim.r[i+1]+sim.g[i+1]+sim.b[i+1])-(sim.r[i-1]+sim.g[i-1]+sim.b[i-1]):0;
  const lighting=(.82+.18*Math.sin(i%sim.w*.035+Math.floor(i/sim.w)*.03+time*.12))*luminance;
  colorize(sim.r[i],sim.g[i],sim.b[i],lighting,gradient,pixels,i*4,tint);pixels[i*4+3]=255;
 }
 return pixels;
}
