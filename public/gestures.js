const clamp=(value,lo=0,hi=1)=>Math.max(lo,Math.min(hi,Number.isFinite(value)?value:lo));
const mix=(a,b,t)=>a+(b-a)*t;
export const gestureTools=['paint','conduct','space','orbit'];
export const gestureDefaults={enabled:true,amount:65,conduct:true,tool:'paint'};
export function normalizeGestureSettings(raw){return {enabled:raw?.enabled!==false,amount:clamp(Number(raw?.amount??65),0,100),conduct:raw?.conduct!==false,tool:gestureTools.includes(raw?.tool)?raw.tool:'paint'};}
export const performanceDefaults={cutoff:18000,resonance:.4,pan:0,gain:1,space:0,echo:0};
export function normalizePerformance(raw={}){const safe=(key,lo,hi,fallback)=>raw?.[key]!==null&&Number.isFinite(Number(raw?.[key]))?clamp(Number(raw[key]),lo,hi):fallback;return {cutoff:safe('cutoff',350,18000,18000),resonance:safe('resonance',.3,1.1,.4),pan:safe('pan',-.5,.5,0),gain:safe('gain',.72,1,1),space:safe('space',0,1,0),echo:safe('echo',0,1,0)};}
export function noteExpression(x=.5,y=.5,gesture={},amount=65){
 const depth=clamp(y),energy=clamp(gesture.energy||0),t=clamp(amount/100),kind=gesture.kind||'touch',bloom=kind==='bloom',silk=kind==='ribbon',spark=kind==='flick',pressure=clamp(gesture.pressure??.5);
 const sustain=bloom?2.7:spark?.35:silk?2.2+depth*.5:clamp(.55+depth*1.5+(1-energy)*.9-energy*1.5,.35,2.7);
 const tone=spark?14000:silk?900+(1-depth)*3800:clamp(700*Math.pow(20,1-depth)+energy*7500,650,14000);
 const expression={velocity:mix(1,clamp((silk?.3:.34)+depth*.38+energy*.65+(pressure-.5)*.18,.25,1.2),t),sustain:mix(1,sustain,t),cutoff:Math.exp(mix(Math.log(14000),Math.log(tone),t)),pan:clamp((x*2-1)*.9*t,-.9,.9)||0,ink:mix(1,bloom?2.4:silk?1.15+depth*.55:.55+depth*.9+energy*1.3,t),force:mix(1,.5+energy*3.8+(gesture.orbit||0)*1.3,t),energy:energy*t,kind};
 if(t>0&&(silk||spark||kind==='rush'||bloom)){expression.attack=bloom?.22:silk?.28:.008;expression.attackAmount=Math.min(1,t*1.65);}
 if(Number.isInteger(gesture.chordTone))expression.chordTone=gesture.chordTone;
 return expression;
}
export function shapeExpression(instrument,expression={}){
 const base=instrument.duration||(['strings','pad'].includes(instrument.key)?3.8:2.7),scale=clamp(expression.sustain??1,.35,2.7),duration=clamp(base*scale,.4,9),energy=clamp(expression.energy||0),attack=Math.min(duration*.24,Number.isFinite(expression.attack)?mix((instrument.attack||.015)*(1.2-energy*.75),clamp(expression.attack,0,2),clamp(expression.attackAmount??1)):(instrument.attack||.015)*(1.2-energy*.75)),release=Math.min(duration*.45,.4+scale*.35),middle=Math.max(0,duration-attack-release);
 return {duration,velocity:clamp(expression.velocity??1,.15,1.25),cutoff:clamp(expression.cutoff??14000,350,18000),pan:clamp(expression.pan||0,-.9,.9),envelope:[{duration:0,volume:0},{duration:attack,volume:1},{duration:middle*.4,volume:.82},{duration:middle*.6,volume:.65},{duration:release,volume:0}]};
}
export class GestureTracker{
 constructor(){this.reset();}
 reset(){this.active=false;this.points=[];this.segments=[];this.speed=0;this.path=0;this.heading=0;this.lastVector=null;this.last={x:.5,y:.5,time:0};this.startPoint=this.last;this.pressure=.5;this.aspect=1;}
 begin(x,y,time,pressure=.5,aspect=1){this.reset();this.active=true;this.aspect=aspect;this.pressure=pressure;this.last=this.startPoint={x:clamp(x),y:clamp(y),time};this.points=[this.last];return this.sample(time);}
 move(x,y,time,pressure=.5){if(!this.active)return this.sample(time);x=clamp(x);y=clamp(y);const dx=(x-this.last.x)*this.aspect,dy=y-this.last.y,length=Math.hypot(dx,dy),dt=clamp((time-this.last.time)/1000,.008,.12);this.pressure=pressure;if(length>.0008){const speed=clamp(length/dt,0,4);this.speed=mix(this.speed,speed,.4);let turn=0;if(this.lastVector){turn=Math.atan2(this.lastVector.dx*dy-this.lastVector.dy*dx,this.lastVector.dx*dx+this.lastVector.dy*dy);}this.heading=Math.atan2(dy,dx);this.lastVector={dx,dy};this.path+=length;this.segments.push({time,turn,length,dx,dy});this.last={x,y,time};this.points.push(this.last);if(this.points.length>160)this.points.shift();}return this.sample(time);}
 sample(time){const recent=this.segments.filter(s=>time-s.time<2200);this.segments=recent;const length=recent.reduce((n,s)=>n+s.length,0),turn=recent.reduce((n,s)=>n+s.turn,0),turnTotal=recent.reduce((n,s)=>n+Math.abs(s.turn),0),dx=recent.reduce((n,s)=>n+s.dx,0),dy=recent.reduce((n,s)=>n+s.dy,0);const liveSpeed=this.speed*Math.exp(-Math.max(0,time-this.last.time-35)/170),energy=clamp(liveSpeed/1.5),coherence=Math.abs(turn)/(turnTotal+.001);const orbit=length>.2&&coherence>.65&&Math.hypot(dx,dy)<length*.75?clamp((Math.abs(turn)-2.5)/2.5)*Math.min(1,liveSpeed/.3):0;const still=this.path<.07&&Math.hypot((this.last.x-this.startPoint.x)*this.aspect,this.last.y-this.startPoint.y)<.025,held=this.active&&still?clamp((time-this.startPoint.time-250)/1100):0;const vertical=recent.length>0&&Math.abs(recent.at(-1).dy)>Math.abs(recent.at(-1).dx)*1.35&&liveSpeed>.12;return {active:this.active,x:this.last.x,y:this.last.y,energy,speed:liveSpeed,orbit,spin:turn>=0?1:-1,heading:this.heading,held,still,vertical,pressure:this.pressure,kind:held>.35?'hold':orbit>.15?'orbit':energy>.58?'rush':this.path>.012?'ribbon':'touch',dx:this.lastVector?.dx||0,dy:this.lastVector?.dy||0};}
 end(time,cancel=false){const metrics=this.sample(time);this.active=false;if(cancel)return {...metrics,kind:'cancel'};return {...metrics,kind:metrics.held>.4?'bloom':metrics.speed>.9&&time-this.last.time<140?'flick':metrics.kind};}
}
