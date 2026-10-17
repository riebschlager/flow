import {getPalette,hexRGB,normalizePalette} from './palettes.js?rev=palettes-29';
import {parseChord} from './music.js?rev=flow-23';
const clamp=(value,lo=0,hi=1)=>Math.max(lo,Math.min(hi,value));
const mix=(a,b,t)=>a+(b-a)*t;
function hueColor(hue){const h=((hue%360)+360)%360/60,c=.58,x=c*(1-Math.abs(h%2-1)),m=.24;const rgb=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];return rgb.map(value=>value+m);}
export function chordMood(symbol,palette='classic'){
 const notes=parseChord(symbol),root=notes[0]%12,intervals=notes.map(note=>(note-notes[0])%12),minor=intervals.includes(3),suspended=!minor&&!intervals.includes(4),seventh=intervals.includes(10)||intervals.includes(11);
 const angle=root/12*Math.PI*2,key=normalizePalette(palette),position=root/12*4,slot=Math.floor(position),fraction=position-slot;
 const colors=getPalette(key).colors,a=hexRGB(colors[slot].hex),b=hexRGB(colors[(slot+1)%4].hex);
 const color=key==='classic'?hueColor(255+root*137.508+(minor?-12:0)):a.map((v,i)=>mix(v,b[i],fraction));
 return {color,brightness:minor?.91:suspended?.98:1.055,x:.5+Math.sin(angle)*.21,y:.47+Math.cos(angle)*.12,spin:minor?-.8:suspended?.35:.8,width:seventh?1.12:1,breath:minor?.045:.07};
}
export class ChordAtmosphere{
 constructor({reducedMotion=false}={}){this.reducedMotion=reducedMotion;this.current=null;this.key=null;this.age=10;this.pulseValue=0;this.time=0;this.amount=0;this.forceTime=0;this.playing=false;}
 frame(dt,{chord='Cmaj7',index=0,playing=false,amount=65,palette='classic'}={}){
  dt=clamp(Number(dt)||0,0,.1);this.time+=dt;this.playing=playing;this.amount=clamp((Number(amount)||0)/100);
  const key=chord+'|'+index;
  if(!this.current){this.current=chordMood(chord,palette);this.target=chordMood(chord,palette);this.key=key;}
  else if(key!==this.key){this.key=key;this.target=chordMood(chord,palette);this.age=0;}
  if(this.palette!==palette){this.palette=palette;this.target=chordMood(chord,palette);}
  this.age=Math.min(10,this.age+dt);
  const pulseTarget=this.age<3.2?Math.sin(Math.PI*this.age/3.2)**2:0;this.pulseValue=mix(this.pulseValue,pulseTarget,1-Math.exp(-dt/.22));
  const blend=1-Math.exp(-dt/1.05);
  for(const field of ['brightness','x','y','spin','width','breath'])this.current[field]=mix(this.current[field],this.target[field],blend);
  this.current.color=this.current.color.map((value,i)=>mix(value,this.target.color[i],blend));
 }
 get pulse(){return this.pulseValue;}
 get light(){
  if(!this.current||!this.amount)return {brightness:1,tint:[1,1,1]};
  const breathing=this.playing&&!this.reducedMotion?Math.sin(this.time*.52)*this.current.breath:0;
  return {brightness:1+this.amount*(this.current.brightness-1+breathing+this.pulse*.18),tint:this.current.color.map(value=>1+(value-.5)*.4*this.amount)};
 }
 get center(){const motion=this.reducedMotion?0:1;return {x:motion?this.current.x+Math.sin(this.time*.075)*.025:.5,y:motion?this.current.y+Math.cos(this.time*.06)*.02:.48};}
 stir(sim,dt){
  if(!this.amount||!this.playing||this.reducedMotion||!this.current){this.forceTime=0;return;}
  this.forceTime+=dt;if(this.forceTime<.1)return;const time=Math.min(.15,this.forceTime);this.forceTime=0;
  const {x,y}=this.center,strength=(.018+this.pulse*.09)*this.amount*time/.1;
  sim.pulse(x,y,strength,.27*this.current.width,this.current.spin);
  sim.pulse(1-x,.74-y*.35,strength*.65,.23,-this.current.spin);
 }
 draw(ctx,w,h){
  if(!this.amount||!this.current)return;
  const {x,y}=this.center,px=x*w,py=y*h,size=Math.max(w,h)*.67*this.current.width;
  const rgb=this.current.color.map(value=>Math.round(value*255)),color=alpha=>`rgba(${rgb.join(',')},${alpha})`;
  ctx.save();// Soft light preserves the ink's saturation instead of laying pale fog over it.
  ctx.globalCompositeOperation='soft-light';
  const glow=ctx.createRadialGradient(px,py,0,px,py,size),alpha=this.amount*(.28+this.pulse*.10);
  glow.addColorStop(0,color(alpha));glow.addColorStop(.45,color(alpha*.48));glow.addColorStop(1,color(0));ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  // A broad, feathered breath of light marks arrival without a flash or a label.
  if(this.pulse>.001&&!this.reducedMotion){const progress=clamp(this.age/3.2),radius=Math.min(w,h)*(.18+progress*.65);ctx.translate(px,py);ctx.scale(1,.6);const wave=ctx.createRadialGradient(0,0,0,0,0,radius);wave.addColorStop(0,color(0));wave.addColorStop(.5,color(0));wave.addColorStop(.76,color(this.amount*this.pulse*.14));wave.addColorStop(1,color(0));ctx.fillStyle=wave;ctx.fillRect(-radius,-radius,radius*2,radius*2);}
  ctx.restore();
 }
}
