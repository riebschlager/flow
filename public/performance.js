import {OrbitRings} from './orbit-rings.js?rev=orbit-40';
import {GestureTracker,noteExpression,normalizeGestureSettings,normalizePerformance} from './gestures.js?rev=gestures-32';
const $=id=>document.getElementById(id),clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
const names={touch:'Touch',ribbon:'Silk',rush:'Rush',orbit:'Orbit',hold:'Gathering',bloom:'Bloom',flick:'Spark',conduct:'Conduct',space:'Space'};
const hz=value=>value>=1000?(value/1000).toFixed(1)+' kHz':Math.round(value)+' Hz';
export function createPerformanceController({canvas,stage,audio,sim,drop,nextColor,getColor,touchColor=nextColor,onFirstTouch,openGuide,onChange=()=>{},onGesture=()=>{},readOnly=()=>false}){
 let settings;try{settings=normalizeGestureSettings(JSON.parse(localStorage.getItem('chromaflow-expression-v1')));}catch{settings=normalizeGestureSettings();}
 let tracker=new GestureTracker();const orbitRings=new OrbitRings(),pointers=new Map(),replayPointers=new Map();let stroke=null,pinch=null;let synthetic=null,syntheticAt=0;let pointer=null,tool='paint',paintAt=-Infinity,forceAt=0,trail=[],releaseRings=[],lastActivity=0,latchCutoff=18000,current=normalizePerformance(),keyboard={x:.5,y:.5},replaySample=null,lastReported=null;
 const persist=()=>{try{localStorage.setItem('chromaflow-expression-v1',JSON.stringify(settings));}catch{}onChange();};
 const strength=()=>settings.enabled?settings.amount/100:0;
 function sync(){
  $('expressionEnabled').checked=settings.enabled;$('conductScene').checked=settings.conduct;$('gestureTool').value=settings.tool;$('gestureTool').disabled=!settings.enabled||settings.amount===0;
  $('gestureAmount').value=settings.amount;$('gestureAmountValue').textContent=settings.amount+'%';$('gestureAmount').style.setProperty('--pct',settings.amount+'%');$('performanceHint').textContent=settings.enabled?'Ways to play ↗':'Expression off · Guide ↗';
 }
 function point(e){const r=canvas.getBoundingClientRect();return {x:clamp((e.clientX-r.left)/r.width),y:clamp((e.clientY-r.top)/r.height),aspect:r.width/r.height};}
 function use(p){if(stroke===p)return;if(stroke){Object.assign(stroke,{tracker,tool,paintAt,forceAt,latchCutoff});}stroke=p;if(p)({tracker,tool,paintAt,forceAt,latchCutoff}=p);else{tracker=new GestureTracker();tool='paint';paintAt=-Infinity;forceAt=0;latchCutoff=18000;}}
 function tag(m){return stroke?{...m,pointer:stroke.slot,...(stroke.color===null?{}:{color:stroke.color})}:m;}
 function pinchSample(){return {active:true,x:pinch.x,y:pinch.y,kind:'hold',held:pinch.charge,energy:0,speed:0,orbit:0,heading:0,dx:0,dy:0,pointer:5,color:pinch.color};}
 function pair(){const all=[...pointers.values()];if(all.length!==2||all.some(p=>p.type!=='touch'||p.tool!=='paint'||p.consumed)||!strength())return;
  const [a,b]=all,ax=a.tracker.last.x*a.aspect,ay=a.tracker.last.y,bx=b.tracker.last.x*b.aspect,by=b.tracker.last.y,d=Math.hypot(ax-bx,ay-by),x=(a.tracker.last.x+b.tracker.last.x)/2,y=(ay+by)/2;
  if(!pinch)pinch={ids:all.map(p=>p.id),distance:d,min:d,x,y,startX:x,startY:y,charge:0,active:false,color:a.color,starts:all.map(p=>({...p.tracker.last}))};
  if(pinch.active){pinch.x=x;pinch.y=y;pinch.min=Math.min(pinch.min,d);pinch.charge=clamp((pinch.distance-pinch.min)/Math.max(.12,pinch.distance*.65));if(d-pinch.min>Math.max(.06,pinch.distance*.16)){finishPinch(true);return;}hud(pinchSample());return true;}
  const contraction=pinch.distance-d,travel=Math.hypot((x-pinch.startX)*a.aspect,y-pinch.startY),moved=all.every((p,i)=>Math.hypot((p.tracker.last.x-pinch.starts[i].x)*p.aspect,p.tracker.last.y-pinch.starts[i].y)>.012);
  if(moved&&contraction>Math.max(.055,pinch.distance*.14)&&travel<contraction*.7){pinch.active=true;pinch.min=d;pinch.x=x;pinch.y=y;pinch.charge=clamp(contraction/Math.max(.12,pinch.distance*.65));for(const p of all){onGesture({...p.tracker.sample(performance.now()),pointer:p.slot,color:p.color,active:false,ended:true});}hud(pinchSample());return true;}
  pinch.pending=contraction>.012&&travel<contraction;return pinch.pending;
 }
 function finishPinch(play=false){if(!pinch)return;const m=pinchSample();for(const id of pinch.ids){const p=pointers.get(id);if(p)p.consumed=true;}pinch=null;if(play)bloom(m);onGesture({...m,active:false,ended:true,kind:play?'bloom':'cancel'});}
 function sample(p,now){const m=p.tracker.sample(now);if(p.tool==='conduct'||p.tool==='space')m.kind=p.tool;if(p.tool==='orbit'){m.kind='orbit';m.orbit=.5+.5*m.energy;const angle=(m.x-.5)*Math.PI*2+(m.speed>.05?m.heading:0);m.heading=Math.atan2(Math.sin(angle),Math.cos(angle));}return {...m,pointer:p.slot,...(p.color===null?{}:{color:p.color})};}
 function metrics(now){if(pinch?.active)return pinchSample();if(synthetic)return synthetic;const m=tracker.sample(now);if(tool==='conduct'||tool==='space')m.kind=tool;if(tool==='orbit'){m.kind='orbit';m.orbit=.5+.5*m.energy;const angle=(m.x-.5)*Math.PI*2+(m.speed>.05?m.heading:0);m.heading=Math.atan2(Math.sin(angle),Math.cos(angle));}return tag(m);}
 function launch(p,m,force=false,when=null){
  if(!force&&pinch?.pending&&stroke&&pinch.ids.includes(stroke.id))return;
  const now=performance.now(),interval=stroke?.type==='touch'?Math.max(750,strength()>0?300-m.energy*230:160):strength()>0?300-m.energy*230:160;if(!force&&now-paintAt<interval)return;
  const expression=strength()>0?noteExpression(p.x,p.y,m,settings.amount):null,speed=m.speed||0,angle=m.heading||0;
  const impulse=speed>.06?[Math.cos(angle)*Math.min(110,15+speed*55),Math.sin(angle)*Math.min(110,15+speed*55)]:null;
  if(expression&&m.gentle)expression.velocity*=m.kind==='bloom'?.6:.8;drop(p.x,p.y,m.color??(stroke?.type==='touch'?stroke.color:nextColor()),impulse,expression,when,stroke?.type==='touch'||m.pointer===5);paintAt=now;lastActivity=now;
 }
 function hud(m,kind=m.kind,report=true){
  if(report)onGesture({...m,kind});$('gestureName').textContent=names[kind]||'Touch';
  $('gestureDetails').textContent=kind==='conduct'?'Down closes the filter · left / right pans':kind==='space'?'Up adds reverb · right adds rhythmic echoes':kind==='hold'?'Building a room · release four chord tones':kind==='bloom'?'Long chord tones · outward wave':kind==='orbit'?'Stereo rotation · echoes · deep whirlpool':kind==='flick'?'Short, bright accent · outward jet':kind==='ribbon'?'Soft attack · long tail · flowing ribbon':kind==='rush'?'Fast attack · short notes · forceful jets':m.y>.65?'Warm, full and long':m.y<.35?'Light, bright and short':'Position sets the note’s tone and weight';
  $('gestureReadout').textContent=`Filter ${hz(current.cutoff)} · Room ${Math.round(current.space*100)}% · Echo ${Math.round(current.echo*100)}%`;
  const level=kind==='space'?Math.max(current.space,current.echo):kind==='conduct'?clamp(1-Math.log(current.cutoff/350)/Math.log(18000/350))*strength():Math.max(m.energy||0,m.held||0,m.orbit||0)*strength();$('gestureEnergy').style.setProperty('--level',clamp(level)*100+'%');$('expressionDot').style.left=(m.x*100)+'%';$('expressionDot').style.top=(m.y*100)+'%';
 }
 function bloom(m){
  const t=strength();if(!t)return;
  for(let i=0;i<4;i++){const angle=i/4*Math.PI*2,radius=.04+.04*m.held,p={x:clamp(m.x+(i-1.5)*(.1+.06*m.held),.03,.97),y:clamp(m.y+Math.sin(angle)*radius,.08,.92)};launch(p,{...m,kind:'bloom',energy:.12,chordTone:i},true);}
  if(!globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches){sim.pulse(m.x,m.y,.9*t,.18,1);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;sim.force(clamp(m.x+Math.cos(a)*.08),clamp(m.y+Math.sin(a)*.08),Math.cos(a)*65*t,Math.sin(a)*65*t,.07);}
  }releaseRings.push({x:m.x,y:m.y,time:performance.now(),color:getColor(m?.color).hex,kind:'bloom'});hud(m,'bloom',false);
 }
 function release(id){try{canvas.releasePointerCapture?.(id);}catch{}}
 canvas.addEventListener('contextmenu',e=>{if(settings.enabled&&settings.amount>0&&!readOnly())e.preventDefault();});
 canvas.addEventListener('pointerdown',e=>{
  if(readOnly()||pointers.has(e.pointerId)||pointers.size>=5||![0,2].includes(e.button)||e.button===2&&strength()===0)return;
  if(pointers.size&&(e.pointerType!=='touch'||[...pointers.values()].some(p=>p.type!=='touch')))return;
  if(pinch?.active)finishPinch();else pinch=null;
  synthetic=null;e.preventDefault?.();const p=point(e),now=performance.now(),slot=[0,1,2,3,4].find(i=>![...pointers.values()].some(p=>p.slot===i));
  const next={id:e.pointerId,slot,type:e.pointerType,aspect:p.aspect,color:e.pointerType==='touch'?touchColor():null,tracker:new GestureTracker(),tool:strength()===0?'paint':e.button===2||e.shiftKey?'conduct':e.altKey?'space':settings.tool,paintAt:-Infinity,forceAt:0,latchCutoff:18000};
  trail=trail.filter(p=>p.pointer!==slot);pointers.set(e.pointerId,next);use(next);pointer=e.pointerId;canvas.setPointerCapture(e.pointerId);onFirstTouch();keyboard={x:p.x,y:p.y};tracker.begin(p.x,p.y,now,e.pointerType==='pen'?e.pressure:.5,p.aspect);
  const m=metrics(now);if(tool==='paint')launch(p,m,true);hud(m);lastActivity=now;pair();
 });
 canvas.addEventListener('pointermove',e=>{
  if(readOnly())return;const p=point(e),r=canvas.getBoundingClientRect();$('cursor').style.left=(e.clientX-r.left)+'px';$('cursor').style.top=(e.clientY-r.top)+'px';if(e.pointerType!=='touch')$('cursor').style.display='block';const own=pointers.get(e.pointerId);if(!own||own.consumed)return;
  e.preventDefault?.();use(own);const now=performance.now();tracker.move(p.x,p.y,now,e.pointerType==='pen'?e.pressure:.5);if(pair())return;if(own.consumed)return;const m=metrics(now);keyboard={x:p.x,y:p.y};
  if(strength()>0){trail.push({...tag(p),time:now,color:getColor(m.color).hex,energy:m.energy,kind:m.kind});if(trail.length>500)trail.shift();}
  if(tool==='paint'&&m.speed>.025)launch(p,m);hud(m);lastActivity=now;
 });
 function end(e,cancel=false){
  const own=pointers.get(e.pointerId);if(!own)return;use(own);const now=performance.now();
  if(pinch?.active&&pinch.ids.includes(e.pointerId)){if(cancel)finishPinch();else{own.consumed=true;if(pinch.ids.every(id=>id===e.pointerId||!pointers.has(id)))finishPinch(true);}}
  else if(pinch)pinch=null;
  const m=tag(tracker.end(now,cancel||own.consumed));pointers.delete(e.pointerId);
  if(!cancel&&!own.consumed&&strength()>0&&tool==='paint'){
   if(m.kind==='bloom')bloom(m);
   else if(m.kind==='flick'){const x=clamp(m.x+Math.cos(m.heading)*.07,.03,.97),y=clamp(m.y+Math.sin(m.heading)*.07,.08,.92);launch({x,y},{...m,kind:'flick',energy:1},true);sim.force(m.x,m.y,Math.cos(m.heading)*100*strength(),Math.sin(m.heading)*100*strength(),.08);releaseRings.push({x:m.x,y:m.y,time:now,color:getColor(m.color).hex,kind:'flick'});hud(m,'flick',false);}
  }
  onGesture({...m,kind:cancel||own.consumed?'cancel':tool==='paint'?m.kind:tool,active:false,ended:true});use(null);pointer=pointers.size?[...pointers.keys()][0]:null;release(e.pointerId);lastActivity=now;
 }
 globalThis.window?.addEventListener?.('blur',()=>{for(const id of [...pointers.keys()])end({pointerId:id},true);});
 canvas.addEventListener('pointerup',e=>end(e));canvas.addEventListener('pointercancel',e=>end(e,true));canvas.addEventListener('lostpointercapture',e=>end(e,true));canvas.addEventListener('pointerleave',()=>$('cursor').style.display='none');
 function reset(){synthetic=null;finishPinch();for(const id of [...pointers.keys()])end({pointerId:id},true);use(null);pointer=null;replaySample=null;replayPointers.clear();tracker.reset();tool='paint';trail=[];releaseRings=[];lastActivity=0;latchCutoff=18000;current=normalizePerformance();audio.setPerformance(current);lastReported=null;$('gestureHud').classList.remove('active');}
 $('expressionEnabled').addEventListener('change',()=>{settings.enabled=$('expressionEnabled').checked;if(!settings.enabled)reset();sync();persist();});
 $('conductScene').addEventListener('change',()=>{settings.conduct=$('conductScene').checked;if(!settings.conduct){current=normalizePerformance();audio.setPerformance(current);}persist();});
 $('gestureTool').addEventListener('change',()=>{reset();settings.tool=normalizeGestureSettings({tool:$('gestureTool').value}).tool;sync();persist();});
 $('gestureAmount').addEventListener('input',()=>{settings.amount=Number($('gestureAmount').value);if(!settings.amount)reset();sync();persist();});$('resetPerformance').onclick=reset;$('performanceHint').onclick=openGuide;
 function frame(dt,now,clock=false){
  if(!pointers.size)return frameOne(dt,now,clock);
  if(pinch?.active){use(null);return frameOne(dt,now,clock);}
  const live=[...pointers.values()].filter(p=>!p.consumed);if(!live.length){use(null);return frameOne(dt,now,clock);}
  for(let i=0;i<live.length;i++){use(live[i]);frameOne(dt,now,clock,i<live.length-1);}use(null);
 }
 function frameOne(dt,now,clock=false,motionOnly=false){
  if(readOnly()||synthetic&&!clock)return;const m=metrics(now),t=strength(),active=m.active&&t>0;
  if(active){
   lastActivity=now;
   if(!synthetic&&!pinch?.active&&tool==='paint'&&m.speed>.025)launch(m,m);
   if(now-forceAt>50&&!document.hidden&&!((synthetic||pinch?.active||stroke?.type==='touch')&&globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches)){forceAt=now;
    if(m.kind==='conduct'){sim.force(m.x,m.y,clamp(m.dx*1800,-120,120)*t*m.energy,clamp(m.dy*1800,-120,120)*t*m.energy,.17);}
    else if(m.kind==='space'){sim.pulse(m.x,m.y,(.3+.5*(1-m.y))*t,.22,m.x<.5?-1:1);}
    else if(m.orbit>.15){sim.pulse(m.x,m.y,m.orbit*t*1.15,.15,m.spin);sim.pulse(clamp(m.x+.12),m.y,m.orbit*t*.5,.12,-m.spin);}
    else if(m.speed>.05)sim.force(m.x,m.y,Math.cos(m.heading)*m.energy*t*65,Math.sin(m.heading)*m.energy*t*65,.07);
    if(tool==='paint'&&m.held>.15){sim.pulse(m.x,m.y,m.held*t*.35,.12,1);for(let i=0;i<4;i++){const a=i/4*Math.PI*2;sim.force(clamp(m.x+Math.cos(a)*.08),clamp(m.y+Math.sin(a)*.08),-Math.cos(a)*m.held*t*30,-Math.sin(a)*m.held*t*30,.06);}}
   }
   if(m.vertical&&tool==='paint')latchCutoff=650*Math.pow(24,1-m.y);
  }
  if(motionOnly)return;
  const target=normalizePerformance();
  if(active&&settings.conduct){
   if(tool==='conduct'){target.cutoff=Math.exp(Math.log(18000)*(1-t)+Math.log(350*Math.pow(18000/350,1-m.y))*t);target.pan=(m.x*2-1)*.5*t;}
   else if(tool==='space'){target.space=t*(1-m.y);target.echo=t*m.x*.9;}
   else if(m.orbit>.15){target.pan=Math.sin(m.heading)*.5*Math.min(1,t*1.5)*m.orbit;target.space=.3*m.orbit*t;target.echo=.8*m.orbit*t;target.resonance=.4+.6*m.orbit*t;}
   else{target.cutoff=Math.exp(Math.log(18000)*(1-t)+Math.log(latchCutoff)*t);target.space=m.held*.9*t;target.gain=1-m.held*.2*t;}
  }
  const blend=1-Math.exp(-dt/(active?.12:.85));for(const k of Object.keys(current))current[k]+=(target[k]-current[k])*blend;audio.setPerformance(current);
  const report=Object.values(current).map((v,i)=>Math.round(v*(i===0?1:1000))).join('|');if(report!==lastReported){lastReported=report;onGesture({...m,performance:{...current}});}
  if(active)hud(m,m.kind,false);$('gestureHud').classList.toggle('active',settings.enabled&&now-lastActivity<1900&&lastActivity>0);
  const size=active?28+(tool==='paint'?m.held*65:0)+m.energy*18+(m.kind==='space'?45:0):25;$('cursor').style.width=$('cursor').style.height=size+'px';trail=trail.filter(p=>now-p.time<900);releaseRings=releaseRings.filter(p=>now-p.time<1800);
 }
 function draw(ctx,w,h,now){
  const live=[...pointers.values()].filter(p=>!p.consumed),m=replaySample||(pinch?.active?pinchSample():live.length?sample(live.at(-1),now):metrics(now)),t=strength();orbitRings.update(m,now,t,getColor(m?.color).hex);if(!settings.enabled){orbitRings.draw(ctx,w,h);return;}trail=trail.filter(p=>now-p.time<900);releaseRings=releaseRings.filter(p=>now-p.time<1800);ctx.save();ctx.globalCompositeOperation='source-over';
  const previous=new Map();for(const p of trail){const a=previous.get(p.pointer),age=(now-p.time)/900;previous.set(p.pointer,p);if(!a)continue;ctx.globalAlpha=(1-age)*.55*t;ctx.strokeStyle=p.color;ctx.lineWidth=2+p.energy*7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x*w,a.y*h);ctx.lineTo(p.x*w,p.y*h);ctx.stroke();}
  ctx.strokeStyle=getColor(m?.color).hex;
  if(m.active&&['conduct','space'].includes(m.kind)){
   const radius=40+(m.kind==='space'?current.space*130:(m.orbit||0)*100);ctx.globalAlpha=.55*t;ctx.lineWidth=1.4;
   for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(m.x*w,m.y*h,radius+i*16,(radius+i*16)*.48,(m.heading||0)*.2,0,Math.PI*2);ctx.stroke();}
   if(m.kind==='conduct'){ctx.globalAlpha=.22*t;ctx.beginPath();ctx.moveTo(0,m.y*h);ctx.lineTo(w,m.y*h);ctx.stroke();}
  }
  orbitRings.draw(ctx,w,h);
  for(const m of replaySample?[...replayPointers.values()]:pinch?.active?[pinchSample()]:live.length?live.map(p=>sample(p,now)):[metrics(now)])if(m.active&&['touch','hold'].includes(m.kind)&&m.held>.1){ctx.strokeStyle=getColor(m.color).hex;ctx.globalAlpha=m.held*.7*t;ctx.lineWidth=2;ctx.beginPath();ctx.arc(m.x*w,m.y*h,18+(globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches?32:m.held*65),0,Math.PI*2*m.held);ctx.stroke();}
  for(const p of releaseRings){const age=(now-p.time)/1800;ctx.globalAlpha=(1-age)*.65*t;ctx.strokeStyle=p.color;ctx.lineWidth=1.2;for(let i=0;i<(p.kind==='bloom'?3:1);i++){ctx.beginPath();ctx.arc(p.x*w,p.y*h,10+(globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:age*(p.kind==='bloom'?180:100))+i*14,0,Math.PI*2);ctx.stroke();}}
  ctx.restore();
 }
 function key(e){
  if(readOnly()||document.activeElement!==canvas)return false;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();keyboard.x=clamp(keyboard.x+(e.key==='ArrowRight'?.05:e.key==='ArrowLeft'?-.05:0),.03,.97);keyboard.y=clamp(keyboard.y+(e.key==='ArrowDown'?.05:e.key==='ArrowUp'?-.05:0),.08,.92);$('cursor').style.left=keyboard.x*canvas.getBoundingClientRect().width+'px';$('cursor').style.top=keyboard.y*canvas.getBoundingClientRect().height+'px';$('cursor').style.display='block';return true;}
  if(e.key==='Enter'){e.preventDefault();onFirstTouch();const m={...keyboard,energy:.1,held:1,kind:'touch'};if(e.shiftKey&&strength()>0)bloom(m);else{launch(keyboard,m,true);hud(m);}return true;}return false;
 }
 function perform(action){

  if(readOnly()||pointer!==null)return;const now=performance.now(),kind=action.kind;
  if(kind==='settle'){synthetic=null;tool='paint';current=normalizePerformance();audio.setPerformance(current);onGesture({active:false,ended:true,kind:'touch',performance:{...current}});return;}
  const m={active:action.active!==false,x:clamp(action.x,.04,.96),y:clamp(action.y,.08,.92),kind:kind==='gather'?'hold':['tap','silk','bloom'].includes(kind)?kind==='silk'?'ribbon':kind==='tap'?'touch':'bloom':kind==='release'?'touch':kind==='hold'?'touch':kind,gentle:true,energy:.03+.3*clamp(action.amount??.1),speed:0,held:(action.held||0)*(action.amount??1),orbit:kind==='orbit'?.25*(action.amount??1):0,heading:Math.sin((action.progress||0)*Math.PI*2),spin:1,dx:0,dy:0};
  if(['tap','silk','bloom'].includes(kind)){m.active=false;m.ended=true;launch(m,{...m,chordTone:action.chordTone},true,action.time);if(kind==='bloom'&&action.visual&&!globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches){if(!document.hidden)sim.pulse(m.x,m.y,.35,.18,1);releaseRings.push({x:m.x,y:m.y,time:now,color:getColor(m?.color).hex,kind:'bloom'});}hud(m,m.kind);return;}
  if(now-syntheticAt<45)return;syntheticAt=now;synthetic=m;tool=kind==='conduct'?'conduct':kind==='orbit'?'orbit':'paint';if(kind==='conduct')synthetic.y=.7*Math.sin(Math.PI*(action.progress||0))**2;
  frame(.05,now,true);onGesture({...m,performance:{...current}});if(kind==='ribbon'){trail.push({pointer:m.pointer,x:m.x,y:m.y,time:now,color:getColor(m?.color).hex,energy:m.energy,kind:'ribbon'});if(trail.length>100)trail.shift();}if(action.active===false){current=normalizePerformance();audio.setPerformance(current);onGesture({...m,active:false,ended:true,performance:{...current}});synthetic=null;tool='paint';}
 }
 sync();return {perform,getState:()=>JSON.parse(JSON.stringify(settings)),restore(raw,persistSettings=false){reset();settings=normalizeGestureSettings(raw);sync();if(persistSettings)persist();},replayGesture(m){const key=m.pointer??0;replaySample=m;if(m.active)replayPointers.set(key,m);else replayPointers.delete(key);if((m.ended||m.active!==true)&&['bloom','flick'].includes(m.kind))releaseRings.push({x:m.x,y:m.y,time:performance.now(),color:getColor(m?.color).hex,kind:m.kind});$('gestureHud').classList.toggle('active',!!m.active);if(m.performance)current=normalizePerformance(m.performance);hud(m,m.kind,false);if(m.active){trail.push({pointer:m.pointer,x:m.x,y:m.y,time:performance.now(),color:getColor(m?.color).hex,energy:m.energy||0,kind:m.kind});if(trail.length>100)trail.shift();}},frame,draw,key,reset,get painting(){return pointer!==null;},get luminance(){return .82+.18*clamp(Math.log(current.cutoff/650)/Math.log(18000/650));}};
}
