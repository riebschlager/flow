import {instruments,instrumentGroups,noteName} from './music.js?rev=arp-envelope-15';
import {arpNotes,arpPatterns,normalizeArp,arpEnvelope,ArpEngine} from './arpeggiator.js?rev=arp-envelope-15';
const $=id=>document.getElementById(id);
export function createArpeggiatorController({audio,getClock,getChord}){
 let config;try{config=normalizeArp(JSON.parse(localStorage.getItem('chromaflow-arp-v1')));}catch{config=normalizeArp();}
 let pending=[],pulses=[],generation=0,preparing=false,error=null,poolKey='',envelopeKey='';
 const engine=new ArpEngine(audio,()=>config,getClock,event=>{if(event.type==='reset'){pending=[];return;}pending.push(event);if(pending.length>64)pending.shift();},{onError:failure=>{error=failure;preparing=false;syncStatus();}});
 const persist=()=>{try{localStorage.setItem('chromaflow-arp-v1',JSON.stringify(config));}catch{}};
 function renderPool(){const chord=getChord(),key=chord+'|'+config.count;if(key===poolKey)return;poolKey=key;const notes=arpNotes(chord,config.count);$('arpNotes').innerHTML=notes.map((pitch,i)=>`<span id="arpNote${i}" class="arp-note" data-arp-index="${i}">${noteName(pitch)}</span>`).join('');$('arpPoolLabel').textContent=`${chord} · ${notes.length} chord tones`;}
 function renderEnvelope(){
  const clock=getClock(),step=60/clock.bpm/clock.rate*config.beats,key=[step,config.length,config.attack,config.decay,config.sustain].join('|');if(key===envelopeKey)return;envelopeKey=key;
  const shape=arpEnvelope(config,step),x=time=>10+260*time/shape.duration,y=level=>72-level*56;
  const points=[[10,72],[x(shape.attack),16],[x(shape.attack+shape.decay),y(shape.sustain)],[x(shape.duration-shape.release),y(shape.sustain)],[270,72]].map(point=>point.map(value=>Math.round(value*10)/10).join(',')).join(' ');
  $('arpEnvelopeLine').setAttribute('points',points);$('arpEnvelopeFill').setAttribute('points',points);
  const ms=time=>Math.round(time*1000)+' ms',summary=`${ms(shape.duration)} total · A ${ms(shape.attack)} · D ${ms(shape.decay)} · S ${Math.round(shape.sustain*100)}%`;
  $('arpEnvelopeSummary').textContent=summary+(shape.fitted?' · times fitted to length':'');$('arpEnvelope').setAttribute('aria-label',summary);
 }
 function syncStatus(){$('arpEnabled').checked=config.enabled;$('arpStatus').textContent=error?(error.message||'Arpeggiator could not start. Toggle it off and on to retry.'):preparing?'Preparing the arpeggio voice…':!config.enabled?'Off · a single voice, a winding path':audio.playing?'Playing · follows the current chord & shared tempo':'Ready · press Begin listening to hear the arpeggio';$('arpStatus').classList.toggle('rhythm-on',config.enabled&&audio.playing&&!preparing&&!error);renderPool();renderEnvelope();}
 function sync(){$('arpVoice').value=config.voice;$('arpPattern').value=config.pattern;$('arpRate').value=String(config.beats);$('arpCount').value=config.count;$('arpCountValue').textContent=config.count+(config.count===1?' note':' notes');$('arpVolume').value=config.volume;$('arpVolumeValue').textContent=Math.round(config.volume)+'%';for(const [id,key,unit] of [['arpLength','length','%'],['arpAttack','attack',' ms'],['arpDecay','decay',' ms'],['arpSustain','sustain','%']]){$(id).value=config[key];$(id+'Value').textContent=config[key]+unit;$(id).style.setProperty('--pct',(config[key]-Number($(id).min))/(Number($(id).max)-Number($(id).min))*100+'%');}for(const id of ['arpCount','arpVolume'])$(id).style.setProperty('--pct',id==='arpCount'?(config.count-1)/15*100+'%':config.volume+'%');syncStatus();}
 function stop(){generation++;engine.stop();preparing=false;pending=[];pulses=[];document.querySelectorAll('.arp-note.active').forEach(el=>el.classList.remove('active'));$('arpCurrent').textContent='—';syncStatus();}
 async function start(){stop();if(!config.enabled||!audio.playing||!audio.ctx)return;const ticket=generation;preparing=true;error=null;syncStatus();try{await audio.load(config.voice);if(ticket!==generation||!config.enabled||!audio.playing)return;preparing=false;engine.start();syncStatus();}catch(failure){if(ticket===generation){error=failure;preparing=false;syncStatus();}}}
 function change(){config=normalizeArp(config);error=null;sync();persist();if(config.enabled&&audio.playing){if(engine.timer!==null)engine.tick();else start();}}
 $('arpVoice').innerHTML=instrumentGroups.map(group=>`<optgroup label="${group}">${Object.entries(instruments).filter(([,voice])=>voice.group===group).map(([key,voice])=>`<option value="${key}">${voice.name}</option>`).join('')}</optgroup>`).join('');
 $('arpPattern').innerHTML=Object.entries(arpPatterns).map(([key,name])=>`<option value="${key}">${name}</option>`).join('');
 $('arpEnabled').addEventListener('change',()=>{config.enabled=$('arpEnabled').checked;error=null;persist();if(config.enabled)start();else stop();sync();});
 $('arpVoice').addEventListener('change',()=>{config.voice=$('arpVoice').value;error=null;persist();sync();if(config.enabled&&audio.playing)start();});
 for(const [id,key] of [['arpPattern','pattern'],['arpRate','beats']])$(id).addEventListener('change',()=>{config[key]=key==='beats'?Number($(id).value):$(id).value;change();});
 for(const [id,key] of [['arpCount','count'],['arpVolume','volume'],['arpLength','length'],['arpAttack','attack'],['arpDecay','decay'],['arpSustain','sustain']])$(id).addEventListener('input',()=>{config[key]=Number($(id).value);change();});
 function frame(){renderPool();renderEnvelope();if(!audio.playing||!audio.ctx)return;const now=audio.ctx.currentTime;
  while(pending.length&&pending[0].time<=now){const event=pending.shift();if(now-event.time>.15)continue;document.querySelectorAll('.arp-note.active').forEach(el=>el.classList.remove('active'));$('arpNote'+event.index)?.classList.add('active');$('arpCurrent').textContent=noteName(event.pitch);pulses.push({...event,x:event.count===1?.5:.12+.76*event.index/(event.count-1),y:.54+Math.sin(event.index*1.7)*.055});if(pulses.length>48)pulses.shift();}
  pulses=pulses.filter(p=>now-p.time<.8);
 }
 function draw(ctx,w,h){if(!config.enabled||!audio.playing||!audio.ctx)return;const now=audio.ctx.currentTime;ctx.save();ctx.strokeStyle='#e7d7ff';ctx.fillStyle='#f4edff';ctx.globalCompositeOperation='screen';for(const pulse of pulses){const age=now-pulse.time,fade=Math.max(0,1-age/.8),x=pulse.x*w,y=pulse.y*h;ctx.globalAlpha=fade*.4;ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(x,y,8+age*55,3+age*17,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=fade*.6;ctx.beginPath();ctx.arc(x,y,1.5+fade*1.5,0,Math.PI*2);ctx.fill();}ctx.restore();}
 sync();return {start,stop,frame,draw,transportChanged:syncStatus,get requiredVoice(){return config.enabled?config.voice:null;},clearVisuals(){pending=[];pulses=[];}};
}
