const tau=Math.PI*2;
// Presentation state only: gesture metrics still drive sound and fluid directly.
export class OrbitRings{
 constructor(){this.opacity=0;this.time=null;this.heading=0;this.targetHeading=0;this.lastHeading=0;this.strength=0;}
 update(sample,now,strength,color){
  const dt=this.time===null?0:Math.max(0,(now-this.time)/1000);this.time=now;
  const active=sample.active&&sample.kind==='orbit'&&strength>0;
  if(!active&&this.opacity===0)return;
  if(active){
   const heading=Number.isFinite(sample.heading)?sample.heading:0;
   if(this.opacity===0){this.heading=this.targetHeading=heading;}
   else this.targetHeading+=Math.atan2(Math.sin(heading-this.lastHeading),Math.cos(heading-this.lastHeading));
   this.lastHeading=heading;this.x=sample.x;this.y=sample.y;this.radius=40+(sample.orbit||0)*100;this.strength=strength;this.color=color;
  }
  this.opacity+=((active?1:0)-this.opacity)*(-Math.expm1(-dt/(active?.1:.18)));
  // Unwrap the gesture heading before easing: crossing ±π must not flip the rings.
  this.heading+=(this.targetHeading-this.heading)*(-Math.expm1(-Math.min(dt,.1)/.18));
  if(!active&&this.opacity<.001)this.opacity=0;
  // Keep long performances numerically close to zero without changing orientation.
  if(Math.abs(this.heading)>tau*100){const turns=Math.trunc(this.heading/(tau*5))*tau*5;this.heading-=turns;this.targetHeading-=turns;}
 }
 draw(ctx,w,h){
  if(this.opacity===0)return;
  ctx.save();ctx.strokeStyle=this.color;ctx.globalAlpha=.55*this.strength*this.opacity;ctx.lineWidth=1.4;
  for(let i=0;i<3;i++){const radius=this.radius+i*16;ctx.beginPath();ctx.ellipse(this.x*w,this.y*h,radius,radius*.48,this.heading*.2,0,tau);ctx.stroke();}
  ctx.restore();
 }
}
