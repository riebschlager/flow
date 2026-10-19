const moteColors=Array.from({length:4096},(_,i)=>`rgb(${(i>>8)*17},${((i>>4)&15)*17},${(i&15)*17})`);
const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
export function normalizeEnergy(value){return value!==null&&value!==''&&Number.isFinite(Number(value))?clamp(Number(value),0,100):60;}
// Mirror WebAudioFont's scheduled ramps, including sample truncation and its final release.
export function envelopeCurve(zone,duration,sampleDuration,after=.05){
 duration=Math.max(0,Math.min(duration,sampleDuration-after));
 const stages=zone.ahdsr?(zone.ahdsr.length?zone.ahdsr:[{duration:0,volume:1},{duration:.5,volume:1},{duration:1.5,volume:.5},{duration:3,volume:0}]):[{duration:0,volume:1},{duration,volume:1}];
 const points=[{time:0,volume:stages[0].volume}];let time=0,volume=0;
 for(const stage of stages)if(stage.duration>0){if(time+stage.duration>duration){const r=(duration-time)/stage.duration;points.push({time:duration,volume:volume+r*(stage.volume-volume)});break;}time+=stage.duration;volume=stage.volume;points.push({time,volume});}
 points.push({time:duration+after,volume:0});return points;
}
export function envelopeLevel(points,age){if(age<0||age>=points.at(-1).time)return 0;let previous=points[0];for(let i=1;i<points.length;i++){const next=points[i];if(age<=next.time)return previous.volume+(next.volume-previous.volume)*clamp((age-previous.time)/(next.time-previous.time||1));previous=next;}return 0;}
// One set of bilinear weights for velocity and pigment; caller owns the scratch buffer.
export function sampleFlow(sim,x,y,out){const px=clamp(x*sim.w,.5,sim.w-1.5),py=clamp(y*sim.h,.5,sim.h-1.5),ix=px|0,iy=py|0,a=px-ix,b=py-iy,k=ix+iy*sim.w,w=sim.w;for(let c=0;c<5;c++){const f=c===0?sim.u:c===1?sim.v:c===2?sim.r:c===3?sim.g:sim.b;out[c]=(f[k]*(1-a)+f[k+1]*a)*(1-b)+(f[k+w]*(1-a)+f[k+w+1]*a)*b;}return out;}
export class VisibleSound{
 constructor({energy=60,mobile=false,reducedMotion=false,random=Math.random}={}){this.energy=this.target=normalizeEnergy(energy)/100;this.mobile=mobile;this.reducedMotion=reducedMotion;this.random=random;this.sample=new Float64Array(5);this.rgb=new Float64Array(3);this.motes=Array.from({length:600},()=>({x:random(),y:random(),px:0,py:0,age:random()*25,alpha:0,flare:0,color:'#b7a0ff',speed:0}));this.shimmers=[];this.halos=[];this.echoes=[];this.notes=[];this.haze=0;}
 setEnergy(value){this.target=normalizeEnergy(value)/100;}
 energyScale(kind){const e=this.energy;if(kind==='count')return e*(this.mobile?220:600);if(kind==='motion')return this.reducedMotion?0:e;return e;}
 shimmer(ring){this.shimmers.push(ring);if(this.shimmers.length>4)this.shimmers.shift();}
 clear(after=Infinity){this.shimmers.length=0;this.halos.length=0;this.echoes.length=0;this.notes=this.notes.filter(note=>note.at>=after);this.haze=0;}
 note(note){this.notes.push(note);if(this.notes.length>128)this.notes.shift();}
 impact({x,y,color,at,voice,bus='voices'},audio){
  let best=-1,distance=.18;for(let i=0;i<this.notes.length;i++){const n=this.notes[i],delta=Math.abs(n.at-at);if(n.bus===bus&&(!voice||!n.voice||voice===n.voice)&&delta<distance&&!n.signal?.aborted){best=i;distance=delta;}}
  const note=best<0?null:this.notes.splice(best,1)[0];if(!note)return;
  this.halos.push({x,y,color,at:note.at,curve:note.curve,signal:note.signal,level:note.level});if(this.halos.length>48)this.halos.shift();
  const spacing=audio.spacing,base=audio.delay*.7,gesture=audio.echo||0;
  for(const [amount,feedback] of [[base,audio.feedback??.36],[gesture,audio.gestureFeedback??.42]])for(let k=1;k<=16&&amount*feedback**k>.012;k++){this.echoes.push({x,y,color,at:note.at+k*spacing,gain:amount*feedback**k,signal:note.signal});}
  if(this.echoes.length>384)this.echoes.splice(0,this.echoes.length-384);
 }
 flare(hit){for(const p of this.motes){const d=(p.x-hit.x)**2+(p.y-hit.y)**2;if(d<.035)p.flare=Math.min(.6,(hit.velocity||hit.strength||.5)*(1-d/.035));}}
 update(dt,now,sim,colorize,wet=0){
  for(let i=this.shimmers.length-1;i>=0;i--)if(now-this.shimmers[i].at>3.6||this.shimmers[i].signal?.aborted)this.shimmers.splice(i,1);
  const step=dt/.3;this.energy+=clamp(this.target-this.energy,-step,step);if(Math.abs(this.energy-this.target)<1e-8)this.energy=this.target;
  let source=0;for(let i=this.halos.length-1;i>=0;i--){const h=this.halos[i],age=now-h.at;if(h.signal?.aborted||age>h.curve.at(-1).time){this.halos.splice(i,1);continue;}const level=envelopeLevel(h.curve,age)*h.level;source=Math.max(source,level*wet);if(age>=0&&!this.reducedMotion){sampleFlow(sim,h.x,h.y,this.sample);h.x=clamp(h.x+this.sample[0]*dt/sim.w*.65);h.y=clamp(h.y+this.sample[1]*dt/sim.h*.65);}}
  this.haze=Math.max(this.haze*Math.exp(-dt/1.7),source*(1-Math.exp(-dt/.5))+this.haze*Math.exp(-dt/.5));
  for(let i=this.echoes.length-1;i>=0;i--)if(now-this.echoes[i].at>2.1||this.echoes[i].signal?.aborted)this.echoes.splice(i,1);
  for(let i=this.notes.length-1;i>=0;i--)if(now-this.notes[i].at>1)this.notes.splice(i,1);
  const count=Math.ceil(this.energyScale('count'));
  for(let i=0;i<this.motes.length;i++){const p=this.motes[i];p.alpha+=clamp((i<count?1:0)-p.alpha,-dt/.3,dt/.3);if(!p.alpha||this.reducedMotion)continue;
   p.age+=dt;p.flare*=Math.exp(-dt/ .28);p.px=p.x;p.py=p.y;sampleFlow(sim,p.x,p.y,this.sample);p.speed=Math.hypot(this.sample[0],this.sample[1]);p.x+=this.sample[0]*dt/sim.w*this.energyScale('motion');p.y+=this.sample[1]*dt/sim.h*this.energyScale('motion');
   if(p.x<0||p.x>1||p.y<0||p.y>1||p.age>30){p.x=this.random();p.y=this.random();p.px=p.x;p.py=p.y;p.age=0;p.alpha=0;}
   if(Math.max(this.sample[2],this.sample[3],this.sample[4])>.025){colorize(this.sample[2],this.sample[3],this.sample[4],1,0,this.rgb);p.color=moteColors[((this.rgb[0]/17|0)<<8)|((this.rgb[1]/17|0)<<4)|(this.rgb[2]/17|0)];}else p.color='#b7c4d9';
  }
 }
 draw(ctx,w,h,now,tint){
  const opacity=this.energyScale('opacity');if(!opacity)return;ctx.save();ctx.globalCompositeOperation='screen';
  for(const ring of this.shimmers){const age=now-ring.at;if(age<0)continue;ctx.globalAlpha=Math.sin(Math.PI*age/3.6)**2*.09*opacity;ctx.lineWidth=.7;const radius=12+(this.reducedMotion?8:age*9)*this.energyScale('motion');for(let i=0;i<3;i++){ctx.strokeStyle=['#b7a0ff','#73e2d0','#edca82'][i];ctx.beginPath();ctx.ellipse(ring.x*w,ring.y*h,radius+i*1.4,(radius+i*1.4)*.45,0,0,Math.PI*2);ctx.stroke();}}
  if(this.haze>.001){ctx.globalAlpha=Math.min(.065,this.haze*.065)*opacity;ctx.fillStyle=`rgb(${tint[0]*255|0},${tint[1]*255|0},${tint[2]*255|0})`;ctx.fillRect(0,0,w,h);}
  for(const halo of this.halos){const level=envelopeLevel(halo.curve,now-halo.at)*halo.level;if(!level)continue;const x=halo.x*w,y=halo.y*h,r=Math.min(w,h)*.095,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,halo.color);g.addColorStop(1,halo.color+'00');ctx.globalAlpha=level*.24*opacity;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  for(const echo of this.echoes){const age=now-echo.at;if(age<0)continue;ctx.globalAlpha=echo.gain*(1-age/2.1)*.65*opacity;ctx.strokeStyle=echo.color;ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(echo.x*w,echo.y*h,5+(this.reducedMotion?12:age*39),2+(this.reducedMotion?5:age*15),0,0,Math.PI*2);ctx.stroke();}
  if(!this.reducedMotion)for(const p of this.motes){if(!p.alpha)continue;ctx.globalAlpha=p.alpha*opacity*Math.min(.48,.1+p.speed*.004+p.flare)*Math.min(1,p.age/1.2);ctx.fillStyle=ctx.strokeStyle=p.color;if(this.energy>.75){ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(p.px*w,p.py*h);ctx.lineTo(p.x*w,p.y*h);ctx.stroke();}ctx.beginPath();ctx.arc(p.x*w,p.y*h,.65+p.flare,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }
}
