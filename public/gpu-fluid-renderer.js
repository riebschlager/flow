import {canonicalDyes,getPalette,hexRGB} from './palettes.js?rev=gestures-32';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const vertices=canonicalDyes.map(c=>{const s=c[0]+c[1]+c[2];return [c[0]/s,c[1]/s];});
export const vertexShader=`#version 300 es
precision highp float;
out vec2 uv;
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
const header=`#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 uv;
out vec4 result;
`;
export const colorShader=header+`
uniform sampler2D red,green,blue;
uniform vec3 fieldScale;
uniform ivec2 grid;
uniform vec3 swatches[4];
uniform float time,luminance;
const vec2 vertices[4]=vec2[4](${vertices.map(v=>'vec2('+v.join(',')+')').join(',')});
vec3 dye(ivec2 p){p=clamp(p,ivec2(0),grid-1);return vec3(texelFetch(red,p,0).r,texelFetch(green,p,0).r,texelFetch(blue,p,0).r)*fieldScale;}
vec3 pigment(vec3 rgb){
 vec2 p=rgb.xy/(rgb.r+rgb.g+rgb.b);
 for(int t=0;t<2;t++){
  ivec3 ix=t==0?ivec3(0,1,3):ivec3(0,3,2);vec2 a=vertices[ix.x],b=vertices[ix.y],c=vertices[ix.z];
  float den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
  float u=((b.y-c.y)*(p.x-c.x)+(c.x-b.x)*(p.y-c.y))/den;
  float v=((c.y-a.y)*(p.x-c.x)+(a.x-c.x)*(p.y-c.y))/den,w=1.-u-v;
  if(min(u,min(v,w))>=0.)return swatches[ix.x]*u+swatches[ix.y]*v+swatches[ix.z]*w;
 }
 float best=1e20;vec3 color=swatches[0];
 const ivec2 edges[4]=ivec2[4](ivec2(0,1),ivec2(1,3),ivec2(3,2),ivec2(2,0));
 for(int j=0;j<4;j++){ivec2 e=edges[j];vec2 a=vertices[e.x],d=vertices[e.y]-a;float t=clamp(dot(p-a,d)/dot(d,d),0.,1.);vec2 delta=p-a-t*d;float distance=dot(delta,delta);if(distance<best){best=distance;color=mix(swatches[e.x],swatches[e.y],t);}}
 return color;
}
void main(){
 ivec2 p=ivec2(gl_FragCoord.xy);
 vec3 rgb=(dye(p)*4.+(dye(p+ivec2(-1,0))+dye(p+ivec2(1,0))+dye(p+ivec2(0,-1))+dye(p+ivec2(0,1)))*2.+dye(p+ivec2(-1,-1))+dye(p+ivec2(1,-1))+dye(p+ivec2(-1,1))+dye(p+ivec2(1,1)))/16.;
 float density=max(rgb.r,max(rgb.g,rgb.b));vec3 bg=vec3(7,10,17)/255.;
 if(density<1e-10){result=vec4(bg,1);return;}
 vec3 delta=dye(p+ivec2(1,0))-dye(p+ivec2(-1,0));float ridge=max(0.,delta.r+delta.g+delta.b);
 float lighting=(.82+.18*sin(float(p.x)*.035+float(p.y)*.03+time*.12))*luminance;
 float brightness=min(1.,.84+.16*clamp(lighting,0.,1.)+.02*ridge/(1.+ridge));
 float coverage=1.-exp(-density*1.65);result=vec4(bg*(1.-coverage)+pigment(rgb)*coverage*brightness,1);
}`;
export const blurShader=header+`
uniform sampler2D image;
void main(){vec2 step=1./vec2(textureSize(image,0));vec3 sum=vec3(0);for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){vec3 c=texture(image,uv+vec2(x,y)*step*2.).rgb;float brightness=max(c.r,max(c.g,c.b));sum+=c*smoothstep(.18,.7,brightness);}result=vec4(sum/25.,1);}`;
export const surfaceShader=header+`
uniform sampler2D image,bloom,red,green,blue,velocityX,velocityY,curl;
uniform vec3 fieldScale,motionScale;
uniform float motionBias;
uniform vec4 effects;
uniform vec4 water;
uniform float waterReflection,time;
uniform vec2 lightPosition;
vec3 dye(vec2 p){return vec3(texture(red,p).r,texture(green,p).r,texture(blue,p).r)*fieldScale;}
vec3 sampleImage(vec2 p){vec2 size=vec2(textureSize(image,0));return texture(image,clamp(p,.5/size,1.-.5/size)).rgb;}
void main(){
 vec2 q=vec2(uv.x,1.-uv.y);
 vec2 size=vec2(textureSize(image,0)),cell=1./size,p=q;float curve=0.;vec2 n=vec2(0);
 if(water.x>0.){
  const vec4 waves[5]=vec4[5](vec4(.058,.024,.32,.60),vec4(.027,-.067,.24,.47),vec4(.115,.072,.12,.83),vec4(-.17,.105,.075,.98),vec4(.25,.19,.035,1.24));
  for(int k=0;k<5;k++){vec4 wave=waves[k];float phase=dot(q*size-.5-size*.5,wave.xy)+time*water.y*wave.w;n+=cos(phase)*wave.z*wave.xy*12.;curve+=sin(phase)*wave.z;}
  n+=clamp((vec2(texture(velocityX,q).r,texture(velocityY,q).r)-motionBias)*motionScale.xy* .008,vec2(-.16),vec2(.16));n*=water.x;p+=n*water.z*min(size.x,size.y)*.085*cell;
 }
 vec3 dx=dye(q+vec2(cell.x,0))-dye(q-vec2(cell.x,0)),dy=dye(q+vec2(0,cell.y))-dye(q-vec2(0,cell.y));
 vec2 gradient=vec2(dot(dx,vec3(1)),dot(dy,vec3(1)));gradient/=1.+length(gradient);
 p+=gradient*cell*effects.y;vec3 c=sampleImage(p);
 if(water.x>0.){float fold=max(0.,1.-abs(curve+n.x*.36-n.y*.28)*13.);float facing=max(0.,1.-dot(n-vec2(.18,-.16),n-vec2(.18,-.16))*9.);c=c*(1.+n.y*.12+n.x*.07)+(fold*fold*water.w*water.x*65.*vec3(.52,.85,1)+pow(facing,10.)*waterReflection*water.x*110.*vec3(.78,.92,1)+water.x*vec3(1,5,9))/255.;}
 float background=exp(-dot(p-lightPosition,p-lightPosition)*5.);c*=1.+effects.y*.012*background;
 vec3 glow=texture(bloom,q).rgb;c+=glow*(1.-c)*effects.x;
 float swirl=abs((texture(curl,q).r-motionBias)*motionScale.z),film=swirl/(1.+swirl);
 // Interference borrows neighboring pigment, keeping every hue inside the palette mixture.
 vec3 neighbor=sampleImage(p+vec2(cell.x,-cell.y));float interference=.5+.5*cos(film*18.+dot(q,size)*.07);c=mix(c,neighbor,effects.z*film*interference);
 float grain=fract(sin(dot(floor(q*size),vec2(12.9898,78.233)))*43758.5453)-.5;
 c+=grain*effects.w/255.;result=vec4(clamp(c,0.,1.),1);
}`;
export function effectStrengths({energy=0,reverb=0,bloom=true,refraction=true,shimmer=true,grain=true}={}){const e=clamp(Number(energy)||0);return [bloom?e*(.035+.025*clamp(reverb)):0,refraction?e*.65:0,shimmer?e*.12:0,grain?e*.65:0];}

// Separate offscreen GL keeps the visible/export canvas and all pointer targets intact.
// Its output is composited immediately, so no preserved drawing buffer is needed.
export class GPUFluidRenderer{
 constructor({canvas=globalThis.document?.createElement('canvas'),search=globalThis.location?.search||''}={}){
  this.canvas=canvas;this.ready=false;this.lost=false;this.resources=[];
  if(new URLSearchParams(search).get('renderer')==='cpu'||!canvas)return;
  try{this.gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false});if(!this.gl||typeof this.gl.createShader!=='function')return;this.initialize();}catch{this.release();}
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.ready=false;});
  canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;try{this.initialize();}catch{this.release();}});
 }
 initialize(){
  const gl=this.gl;this.resources=[];this.ready=false;this.w=0;this.h=0;this.palette=null;this.locations=new Map();
  if(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)<9)throw new Error('Texture units');
  gl.disable(gl.DITHER);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
  this.programs=[colorShader,blurShader,surfaceShader].map(source=>{
   const shaders=[this.shader(gl.VERTEX_SHADER,vertexShader),this.shader(gl.FRAGMENT_SHADER,source)],p=gl.createProgram();this.resources.push(['Program',p]);for(const shader of shaders)gl.attachShader(p,shader);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;
  });
  this.texture();gl.texImage2D(gl.TEXTURE_2D,0,gl.R16F,1,1,0,gl.RED,gl.FLOAT,new Float32Array([1]));this.float=gl.getError()===gl.NO_ERROR;
  this.fields=Array.from({length:6},()=>this.texture());this.targets=Array.from({length:2},()=>({texture:this.texture(gl.LINEAR),framebuffer:this.resource('Framebuffer')}));
  this.ready=true;
 }
 resource(type){const value=this.gl['create'+type]();if(!value)throw new Error('GPU allocation');this.resources.push([type,value]);return value;}
 shader(type,source){const gl=this.gl,s=gl.createShader(type);this.resources.push(['Shader',s]);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
 texture(filter){const gl=this.gl,t=this.resource('Texture');gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter||gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter||gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
 release(){if(this.gl&&!this.lost)for(const [type,value] of this.resources)this.gl['delete'+type](value);this.resources=[];this.ready=false;}
 uniform(p,name,type,...values){const key=this.programs.indexOf(p)+':'+name;if(!this.locations.has(key))this.locations.set(key,this.gl.getUniformLocation(p,name));this.gl['uniform'+type](this.locations.get(key),...values);}
 bind(p,name,texture,unit){const gl=this.gl;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);this.uniform(p,name,'1i',unit);}
 resize(w,h){
  const gl=this.gl;this.w=w;this.h=h;this.canvas.width=w;this.canvas.height=h;this.bytes=this.float?null:Array.from({length:6},()=>new Uint8Array(w*h));this.scales=new Float32Array(6);
  for(const texture of this.fields){gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,this.float?gl.R16F:gl.R8,w,h,0,gl.RED,this.float?gl.FLOAT:gl.UNSIGNED_BYTE,null);}
  for(let k=0;k<2;k++){const target=this.targets[k];target.w=k?Math.max(1,Math.ceil(w/2)):w;target.h=k?Math.max(1,Math.ceil(h/2)):h;gl.bindTexture(gl.TEXTURE_2D,target.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,target.w,target.h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,target.framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,target.texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Framebuffer');}
 }
 upload(sim){
  const gl=this.gl,keys=['r','g','b','u','v','curl'];
  for(let k=0;k<6;k++){
   const data=sim[keys[k]];gl.activeTexture(gl.TEXTURE0+k);gl.bindTexture(gl.TEXTURE_2D,this.fields[k]);
   if(this.float){this.scales[k]=1;gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,sim.w,sim.h,gl.RED,gl.FLOAT,data);}
   else{let max=1e-10;for(const v of data)max=Math.max(max,Math.abs(v));this.scales[k]=k<3?max:max*2;const bytes=this.bytes[k];for(let i=0;i<data.length;i++)bytes[i]=Math.round(clamp(data[i]/this.scales[k]+(k<3?0:.5))*255);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,sim.w,sim.h,gl.RED,gl.UNSIGNED_BYTE,bytes);}
  }
 }
 pass(p,target){const gl=this.gl;gl.useProgram(p);gl.bindFramebuffer(gl.FRAMEBUFFER,target?.framebuffer||null);gl.viewport(0,0,target?.w||this.w,target?.h||this.h);}
 render(sim,time,{palette='classic',luminance=1,energy=0,reverb=0,lightPosition=[.5,.48],water={},...switches}={}){
  if(!this.ready||this.lost)return false;
  try{
   const gl=this.gl;if(sim.w!==this.w||sim.h!==this.h)this.resize(sim.w,sim.h);this.upload(sim);
   const [color,blur,surface]=this.programs;this.pass(color,this.targets[0]);
   ['red','green','blue'].forEach((key,i)=>this.bind(color,key,this.fields[i],i));this.uniform(color,'fieldScale','3fv',this.scales.subarray(0,3));this.uniform(color,'grid','2i',sim.w,sim.h);this.uniform(color,'time','1f',time);this.uniform(color,'luminance','1f',luminance);
   if(this.palette!==palette){this.swatches=new Float32Array(getPalette(palette).colors.flatMap(c=>hexRGB(c.hex)));this.palette=palette;}this.uniform(color,'swatches[0]','3fv',this.swatches);gl.drawArrays(gl.TRIANGLES,0,3);
   const strengths=effectStrengths({energy,reverb,...switches});
   if(strengths[0]){this.pass(blur,this.targets[1]);this.bind(blur,'image',this.targets[0].texture,0);gl.drawArrays(gl.TRIANGLES,0,3);}
   this.pass(surface);this.bind(surface,'image',this.targets[0].texture,0);this.bind(surface,'bloom',this.targets[1].texture,1);
   ['red','green','blue','velocityX','velocityY','curl'].forEach((key,i)=>this.bind(surface,key,this.fields[i],i+2));this.uniform(surface,'fieldScale','3fv',this.scales.subarray(0,3));this.uniform(surface,'motionScale','3fv',this.scales.subarray(3));
   this.uniform(surface,'motionBias','1f',this.float?0:.5);this.uniform(surface,'effects','4fv',strengths);this.uniform(surface,'time','1f',time);this.uniform(surface,'lightPosition','2fv',lightPosition);
   const enabled=water.enabled&&energy>0;this.uniform(surface,'water','4f',enabled?clamp(water.swell/100)*energy:0,water.speed/100||0,clamp(water.refraction/100)*energy||0,clamp(water.caustics/100)*energy||0);this.uniform(surface,'waterReflection','1f',clamp(water.reflection/100)*energy||0);
   gl.drawArrays(gl.TRIANGLES,0,3);return true;
  }catch{this.release();return false;}
 }
}
