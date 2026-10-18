// Analytic crossing wave normals: no extra solver and no changes to recorded dye.
// Spatial phases are cached; only ten trig calls are needed per frame.
const waves=[[.058,.024,.32,.60],[.027,-.067,.24,.47],[.115,.072,.12,.83],[-.17,.105,.075,.98],[.25,.19,.035,1.24]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class WaterSurface {
 prepare(w,h){
  if(this.w===w&&this.h===h)return;
  this.w=w;this.h=h;this.source=new Uint8ClampedArray(w*h*4);
  this.phases=waves.map(([kx,ky])=>{const sin=new Float32Array(w*h),cos=new Float32Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=(x-w*.5)*kx+(y-h*.5)*ky;sin[x+y*w]=Math.sin(p);cos[x+y*w]=Math.cos(p);}return {sin,cos};});
 }
 render(pixels,w,h,time,{enabled=true,swell=45,speed=30,refraction=40,caustics=35,reflection=40,flow=null}={}){
  if(!enabled)return pixels;
  this.prepare(w,h);this.source.set(pixels);const src=this.source;
  const amplitude=clamp(swell,0,100)/100,drift=clamp(speed,0,100)/100;
  const bend=clamp(refraction,0,100)/100*Math.min(w,h)*.085;
  const light=clamp(caustics,0,100)/100,shine=clamp(reflection,0,100)/100;
  const phases=waves.map((wave,k)=>{const t=time*drift*wave[3];return {...this.phases[k],s:Math.sin(t),c:Math.cos(t),a:wave[2]};});
  for(let i=0;i<w*h;i++){
   let nx=0,ny=0,curve=0;
   for(let k=0;k<waves.length;k++){const p=phases[k],s=p.sin[i]*p.c+p.cos[i]*p.s,c=p.cos[i]*p.c-p.sin[i]*p.s;nx+=c*p.a*waves[k][0]*12;ny+=c*p.a*waves[k][1]*12;curve+=s*p.a;}
   // The existing velocity field locally tilts the surface under your gestures.
   if(flow){nx+=clamp(flow.u[i]*.008,-.16,.16);ny+=clamp(flow.v[i]*.008,-.16,.16);}
   nx*=amplitude;ny*=amplitude;
   const x=i%w,y=(i/w)|0,sx=clamp(x+nx*bend,0,w-1),sy=clamp(y+ny*bend,0,h-1),x0=sx|0,y0=sy|0,fx=sx-x0,fy=sy-y0;
   const a=(x0+y0*w)*4,b=(Math.min(w-1,x0+1)+y0*w)*4,c=(x0+Math.min(h-1,y0+1)*w)*4,d=(Math.min(w-1,x0+1)+Math.min(h-1,y0+1)*w)*4;
   // Narrow, irregular light folds; broad reflection follows the same normals.
   const fold=Math.max(0,1-Math.abs(curve+nx*.36-ny*.28)*13);
   const caustic=fold*fold*light*amplitude*65;
   const facing=Math.max(0,1-((nx-.18)**2+(ny+.16)**2)*9);
   const glint=facing**10*shine*amplitude*110;
   const shade=1+ny*.12+nx*.07;
   for(let j=0;j<3;j++){
    const pigment=(src[a+j]*(1-fx)+src[b+j]*fx)*(1-fy)+(src[c+j]*(1-fx)+src[d+j]*fx)*fy;
    // A little cool skylight makes clear water visible between the color.
    pixels[i*4+j]=pigment*shade+caustic*[.52,.85,1][j]+glint*[.78,.92,1][j]+amplitude*[1,5,9][j];
   }
   pixels[i*4+3]=255;
  }
  return pixels;
 }
}
