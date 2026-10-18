import {fluidGridSize,resampleFluidState} from './fluid-viewport.js?rev=aspect-36';
import {createWorkspaceController} from './workspace-ui.js?rev=workspace-35';
import {createEnvironmentController} from './environment-ui.js?rev=performance-39';
import {createFluidColorizer,renderFluidPixels} from './fluid-renderer.js?rev=performance-39';
import {getPalette,normalizePalette} from './palettes.js?rev=gestures-32';
import {createCommunityController} from './community-ui.js?rev=gestures-32';
import {createRecorderController} from './recorder-ui.js?rev=performance-39';
import {sanitizeSnapshot,sanitizeTake} from './recording-state.js?rev=levels-38';
import {ChordAtmosphere} from './chord-atmosphere.js?rev=gestures-32';
import {createArpeggiatorController} from './arpeggiator-ui.js?rev=probability-33';
import {stirPercussion} from './percussion-visuals.js?rev=gestures-32';
import {landingTime,quantizeDivisions} from './quantize.js?rev=gestures-32';
import {Fluid} from './fluid.js?rev=performance-39';
import {createPerformanceController} from './performance.js?rev=orbit-40';
import {createRhythmController} from './rhythm-ui.js?rev=workspace-35';
import {AmbientAudio,instruments,instrumentGroups,soundscapes,progressions,progressionDetails,parseChord,pitchForPosition,pitchesForRange,normalizeOctaveRange,noteName} from './music.js?rev=performance-39';
const $=id=>document.getElementById(id);
let paletteKey=null,colors=getPalette('classic').colors,colorizeFluid=createFluidColorizer('classic');
const state={selected:0,voices:[...soundscapes.stillwater.voices],progression:'daydream',custom:['Cmaj7','Am7','Fmaj7','G'],bpm:56,playing:false,elapsed:0,chordIndex:0};
let recorder=null;
const audio=new AmbientAudio();let busy=false,noteTimer,clockOrigin=0,dropTimer=null;
$('voices').innerHTML=colors.map((c,i)=>`<div id="voiceRow${i}" class="voice-row" style="--color:${c.hex}"><span class="voice-dot"></span><label id="voiceLabel${i}" for="voice${i}">${c.name}</label><select id="voice${i}" aria-label="${c.name} instrument">${instrumentGroups.map(group=>`<optgroup label="${group}">${Object.entries(instruments).filter(([,v])=>v.group===group).map(([k,v])=>`<option value="${k}" ${state.voices[i]===k?'selected':''}>${v.name}</option>`).join('')}</optgroup>`).join('')}</select></div>`).join('');
const persisted=['colorPalette','soundscape','progression','chordLength','reverb','delay','volume','dropletsVolume','swirl','persistence','dropSize','rain','cycleColors','autoPour','quantizeEnabled','quantizeBeats','octavesDown','octavesUp','chordAtmosphere'];
function save(){try{localStorage.setItem('chromaflow-v1',JSON.stringify({settings:Object.fromEntries(persisted.map(id=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value])),voices:state.voices,custom:state.custom,bpm:state.bpm,selected:state.selected}));}catch{}recorder?.stateChanged();}
function restore(){try{const s=JSON.parse(localStorage.getItem('chromaflow-v1'));if(!s)return;for(const [id,value] of Object.entries(s.settings||{})){if(!persisted.includes(id))continue;const el=$(id);if(el.type==='checkbox')el.checked=!!value;else el.value=value;}if(s.voices?.length===4&&s.voices.every(v=>instruments[v]))state.voices=s.voices;if(s.custom?.length===4){s.custom.forEach(parseChord);state.custom=s.custom;$('chordInput').value=s.custom.join(', ');}if(Number.isInteger(s.selected)&&s.selected>=0&&s.selected<4)state.selected=s.selected;state.bpm=Math.max(30,Math.min(100,Number(s.bpm)||56));if(!$('progression').value)$('progression').value='daydream';if(!$('soundscape').value)$('soundscape').value='stillwater';state.progression=$('progression').value;state.voices.forEach((v,i)=>$('voice'+i).value=v);}catch{}}
restore();
if(!quantizeDivisions.includes(Number($('quantizeBeats').value)))$('quantizeBeats').value='.5';
function syncQuantize(){const on=$('quantizeEnabled').checked;$('quantizeBeats').disabled=!on;$('quantizeStatus').textContent=on?'Land on the next grid line · follows tempo & rhythm speed':'Off · droplets land freely';}
for(const id of ['quantizeEnabled','quantizeBeats'])$(id).addEventListener('change',()=>{syncQuantize();syncDropScheduler();save();});
syncQuantize();
function activeChords(){return state.progression==='custom'?state.custom:progressions[state.progression];}
function octaveRange(){return normalizeOctaveRange({down:$('octavesDown').value,up:$('octavesUp').value});}
function syncPitchRange(){
 const range=octaveRange();$('octavesDown').value=String(range.down);$('octavesUp').value=String(range.up);
 const cycling=$('cycleColors').checked,voice=cycling?0:state.selected,notes=pitchesForRange(activeChords()[state.chordIndex],voice,range);
 $('pitchRangeValue').textContent=`${cycling?'Base range':colors[voice].name}: ${noteName(notes[0])} → ${noteName(notes.at(-1))} · ${notes.length} notes`;
}
for(const id of ['octavesDown','octavesUp'])$(id).addEventListener('change',()=>{syncPitchRange();syncDropScheduler();save();});
function renderChords(){recorder?.stateChanged();const list=activeChords(),detail=progressionDetails[state.progression],descriptions={daydream:'Familiar major-seventh warmth with a gentle lift at the end.',weightless:'A clear major-key circle, balanced between lift and repose.',afterhours:'Soft minor colors, without a strong dominant resolution.',openwater:'An unhurried major-to-minor drift with shared chord tones.',custom:'Your own four-chord loop. Ninths, sixths and suspended chords are welcome.'};$('progressionDescription').textContent=detail?`${detail.text} Try ${detail.pair} · ${detail.length} beats per chord.`:descriptions[state.progression];$('chords').innerHTML=list.map((c,i)=>`${i?'<span class="chord-arrow" aria-hidden="true">→</span>':''}<button class="chord-chip ${i===state.chordIndex?'active':''}" data-chord="${i}" aria-label="Jump to ${c}" ${i===state.chordIndex?'aria-current="true"':''}>${c}<span class="progress"></span></button>`).join('');syncPitchRange();}
function syncColorMode(){const cycling=$('cycleColors').checked;document.querySelectorAll('.color').forEach((el,j)=>{const selected=!cycling&&state.selected===j;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});$('paletteHint').textContent=cycling?'RANDOM COLORS':colors[state.selected].name.toUpperCase()+' ONLY';$('cursor').style.borderColor=colors[state.selected].hex+'80';syncPitchRange();}
function applyPalette(){
 const key=normalizePalette($('colorPalette').value);$('colorPalette').value=key;if(key===paletteKey)return;
 const previous=colors;paletteKey=key;const palette=getPalette(key);colors=palette.colors;colorizeFluid=createFluidColorizer(key);
 document.querySelectorAll('.color').forEach((el,i)=>{el.style.setProperty('--color',colors[i].hex);el.setAttribute('aria-label',colors[i].name+' · voice '+(i+1));el.setAttribute('title',colors[i].name+' · voice '+(i+1));});
 colors.forEach((c,i)=>{$('voiceRow'+i).style.setProperty('--color',c.hex);$('voiceLabel'+i).textContent=c.name;$('voice'+i).setAttribute('aria-label',c.name+' instrument');$('paletteColor'+i).style.setProperty('--color',c.hex);$('paletteColor'+i).setAttribute('title',c.name);});
 $('paletteDescription').textContent=palette.description;$('palettePreview').setAttribute('aria-label',palette.colors.map(c=>c.name).join(', '));
 for(const mark of [...ripples,...glows]){const i=previous.findIndex(c=>c.hex===mark.color);if(i>=0)mark.color=colors[i].hex;}
 rhythmUI.setColors(colors.map(c=>c.hex));syncColorMode();
}
$('colorPalette').addEventListener('change',()=>{applyPalette();save();});
function selectColor(i){state.selected=i;colorBag=[];$('cycleColors').checked=false;syncColorMode();save();}
document.querySelectorAll('.color').forEach(el=>el.addEventListener('click',()=>selectColor(Number(el.dataset.color))));
function loadFail(e){$('audioState').textContent=e.message||'Sound could not load. Try again.';$('audioState').style.color='#e5a0ac';}
async function togglePlay(){if(recorder?.phase!=='idle'&&recorder){if(recorder.recording)recorder.finish();else if(recorder.replaying)recorder.stopPlayback();return;}if(busy)return;if(state.playing){state.elapsed=Math.max(0,audio.ctx.currentTime-clockOrigin);state.playing=false;rhythmUI.stop();arpUI.stop();environmentUI.stop();audio.setPlaying(false);syncDropScheduler();updateTransport();return;}busy=true;$('start').disabled=true;$('audioState').style.color='';$('audioState').textContent='Preparing your instruments…';try{await audio.initialize();await Promise.all([...state.voices,...(arpUI.requiredVoice?[arpUI.requiredVoice]:[])].map(v=>audio.load(v)));environmentUI.prepare();clockOrigin=audio.ctx.currentTime-state.elapsed;state.playing=true;audio.setPlaying(true);rhythmUI.start();arpUI.start();environmentUI.start();syncDropScheduler();updateTransport();$('intro').classList.add('faded');drop(.4+Math.random()*.2,.5+Math.random()*.12,0);rainTimer=0;}catch(e){loadFail(e);}finally{busy=false;$('start').disabled=false;}}
function updateTransport(){const replay=!!recorder?.replaying;$('start').querySelector('use').setAttribute('href',state.playing?'#pause':'#play');$('start').setAttribute('aria-label',state.playing?'Pause listening':'Begin listening');$('playLabel').textContent=replay?'Recorded performance':state.playing?'In the flow':'Begin listening';$('audioState').textContent=replay?'Session loop · Flow plays the notes':state.playing?`${activeChords()[state.chordIndex]} · ${$('soundscape').selectedOptions[0].textContent}`:'Sound is waiting for you';$('sessionState').textContent=replay?'A MOMENT, RETURNING':state.playing?'LISTEN. WANDER. REPEAT.':'YOUR MOMENT OF STILLNESS';document.querySelector('.transport').classList.toggle('paused',!state.playing&&!replay);rhythmUI.transportChanged();arpUI.transportChanged();environmentUI.transportChanged();workspaceUI.sync();}
$('start').addEventListener('click',togglePlay);
function syncAudio(){audio.dropletsVolume=Number($('dropletsVolume').value)/100;audio.volume=Number($('volume').value)/100;audio.reverb=Number($('reverb').value)/100;audio.delay=Number($('delay').value)/100;audio.bpm=state.bpm;audio.update();}
function sliders(){for(const id of ['reverb','delay','volume','dropletsVolume','swirl','persistence','dropSize','rain','chordAtmosphere']){const el=$(id);el.style.setProperty('--pct',((el.value-el.min)/(el.max-el.min)*100)+'%');if($(id+'Value'))$(id+'Value').textContent=id==='rain'?(el.value<28?'Occasional':el.value<60?'Unhurried':'Abundant'):el.value+'%';}}
$('soundscape').addEventListener('change',async()=>{const scape=soundscapes[$('soundscape').value];if(scape){state.voices=[...scape.voices];state.voices.forEach((v,i)=>$('voice'+i).value=v);$('reverb').value=scape.reverb;$('delay').value=scape.delay;$('scapeDescription').textContent=scape.text;sliders();syncAudio();if(audio.ctx){try{await Promise.all(state.voices.map(v=>audio.load(v)));}catch(e){loadFail(e);}}}else $('scapeDescription').textContent='Four colors. Four voices. Entirely your own.';save();updateTransport();});
for(let i=0;i<4;i++)$('voice'+i).addEventListener('change',async()=>{state.voices[i]=$('voice'+i).value;$('soundscape').value='custom';$('scapeDescription').textContent='Four colors. Four voices. Entirely your own.';save();if(audio.ctx)try{await audio.load(state.voices[i]);}catch(e){loadFail(e);}updateTransport();});
$('progression').addEventListener('change',()=>{state.progression=$('progression').value;state.elapsed=0;state.chordIndex=0;if(state.playing)clockOrigin=audio.ctx.currentTime;rhythmUI.resync();$('customChords').hidden=state.progression!=='custom';renderChords();updateTransport();save();});
$('applyChords').addEventListener('click',()=>{try{const c=$('chordInput').value.split(',').map(x=>x.trim());if(c.length!==4)throw new Error('Enter exactly four chords, separated by commas.');c.forEach(parseChord);state.custom=c;state.elapsed=0;state.chordIndex=0;if(state.playing)clockOrigin=audio.ctx.currentTime;rhythmUI.resync();$('chordError').textContent='Your progression is ready.';$('chordError').style.color='#b6e1c9';renderChords();updateTransport();save();}catch(e){$('chordError').textContent=e.message;$('chordError').style.color='#ffa6ab';}});
$('chords').addEventListener('click',e=>{const el=e.target.closest('[data-chord]');if(!el)return;state.chordIndex=Number(el.dataset.chord);state.elapsed=state.chordIndex*Number($('chordLength').value)*60/state.bpm;if(state.playing)clockOrigin=audio.ctx.currentTime-state.elapsed;rhythmUI.resync();renderChords();updateTransport();if(state.playing)drop(.48,.55,state.selected);});
$('chordLength').addEventListener('change',()=>{state.elapsed=state.chordIndex*Number($('chordLength').value)*60/state.bpm;if(state.playing)clockOrigin=audio.ctx.currentTime-state.elapsed;rhythmUI.resync();save();});
function setBpm(value){if(state.playing)state.elapsed=Math.max(0,audio.ctx.currentTime-clockOrigin);const previous=state.bpm;state.bpm=Math.max(30,Math.min(100,value));state.elapsed*=previous/state.bpm;$('bpmLabel').textContent=state.bpm;syncAudio();if(state.playing)clockOrigin=audio.ctx.currentTime-state.elapsed;rhythmUI.resync();save();}
$('slower').onclick=()=>setBpm(state.bpm-2);$('faster').onclick=()=>setBpm(state.bpm+2);
for(const id of ['reverb','delay','volume','dropletsVolume','swirl','persistence','dropSize','rain'])$(id).addEventListener('input',()=>{sliders();syncAudio();sim.swirl=Number($('swirl').value)/100;sim.persistence=Number($('persistence').value)/100;save();});
$('chordAtmosphere').addEventListener('input',()=>{sliders();save();});
$('cycleColors').addEventListener('change',()=>{colorBag=[];syncColorMode();save();});$('autoPour').addEventListener('change',()=>{document.querySelector('.autopour').classList.toggle('off',!$('autoPour').checked);save();});
const tabs=['sound','rhythm','perform','fluid','mix'],tabDescriptions={sound:'Choose your voices and the harmony they share.',rhythm:'Add arpeggio, percussion or a world behind the music.',perform:'Shape the music with your hand, or let droplets play.',fluid:'Choose your colors and how the canvas responds.',mix:'Balance the composition and give each sound its space.'};
let currentTab='sound';const tabScroll=new Map();
function switchTab(name){if(!tabs.includes(name))return;tabScroll.set(currentTab,$('panelScroll').scrollTop||0);for(const tab of tabs){$(tab+'Panel').hidden=tab!==name;$(tab+'Tab').setAttribute('aria-selected',tab===name);$(tab+'Tab').tabIndex=tab===name?0:-1;}$('panelDescription').textContent=tabDescriptions[name];currentTab=name;$('panelScroll').scrollTop=tabScroll.get(name)||0;}
for(const tab of tabs){$(tab+'Tab').onclick=()=>switchTab(tab);$(tab+'Tab').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const other=e.key==='Home'?tabs[0]:e.key==='End'?tabs.at(-1):tabs[(tabs.indexOf(tab)+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];switchTab(other);$(other+'Tab').focus();});}

function togglePanel(){document.body.classList.toggle('panel-hidden');$('togglePanel').setAttribute('aria-expanded',!document.body.classList.contains('panel-hidden'));} $('togglePanel').onclick=togglePanel;
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else document.body.classList.toggle('zen');}catch{document.body.classList.toggle('zen');}};
function toggleZen(force){if(typeof force==='boolean')document.body.classList.toggle('zen',force);else document.body.classList.toggle('zen');$('zen').innerHTML=document.body.classList.contains('zen')?'Exit Zen <span>↙</span>':'Zen view <span>↗</span>';}
$('zen').onclick=()=>toggleZen();$('help').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=$('gotIt').onclick=()=>$('helpDialog').close();$('helpDialog').addEventListener('click',e=>{if(e.target===$('helpDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('zen')){toggleZen(false);return;}if(recorder?.blocked||$('recordDialog').open||$('communityDialog').open)return;if(/^(INPUT|SELECT|TEXTAREA|BUTTON|SUMMARY|A)$/.test(document.activeElement.tagName)||$('helpDialog').open||$('beatDialog').open)return;if(performanceUI.key(e))return;if(e.code==='Space'&&!e.repeat){e.preventDefault();togglePlay();}if(/^[1-4]$/.test(e.key))selectColor(Number(e.key)-1);if(e.key==='Escape')toggleZen(false);});
// Fluid rendering and the droplet/impact lifecycle.
const canvas=$('fluid'),ctx=canvas.getContext('2d',{alpha:false});const overlay=$('particles'),fx=overlay.getContext('2d');const stage=$('stage');
const atmosphere=new ChordAtmosphere({reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false});
let width=1,height=1,dpr=1,vignette=null;const sim=new Fluid(window.innerWidth>720?224:144,window.innerWidth>720?156:112);const ink=document.createElement('canvas');ink.width=sim.w;ink.height=sim.h;const inkCtx=ink.getContext('2d');let pixels=inkCtx.createImageData(sim.w,sim.h);let drops=[],ripples=[],glows=[],lastFrame=0,rainTimer=0,frameCount=0;let colorBag=[],lastDropColor=-1,dropSerial=0;
const dust=Array.from({length:65},()=>({x:Math.random(),y:Math.random(),r:.4+Math.random()*.9,p:Math.random()*6}));
function resize(){
 // Canvas bounds exclude the stage border and match the CSS drawing surface.
 const r=canvas.getBoundingClientRect();if(r.width<=0||r.height<=0)return;
 width=r.width;height=r.height;dpr=Math.min(window.devicePixelRatio||1,1.7);
 const backingWidth=Math.round(width*dpr),backingHeight=Math.round(height*dpr);
 if(canvas.width!==backingWidth||canvas.height!==backingHeight){canvas.width=overlay.width=backingWidth;canvas.height=overlay.height=backingHeight;}
 ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);fx.setTransform(overlay.width/width,0,0,overlay.height/height,0,0);vignette=ctx.createRadialGradient(width*.55,height*.5,height*.12,width*.5,height*.5,Math.max(width,height)*.72);vignette.addColorStop(0,'#070a1000');vignette.addColorStop(.62,'#070a1030');vignette.addColorStop(1,'#070a10d9');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 const mobile=window.innerWidth<=720||!!window.matchMedia?.('(pointer: coarse)').matches,grid=fluidGridSize(width,height,{mobile});
 // Ignore sub-cell aspect changes from mobile browser chrome to avoid repeatedly
 // filtering the same dye. Orientation/layout changes still rebuild immediately.
 const cellAspect=width*sim.h/(height*sim.w),qualityChange=sim.n>(mobile?16128:35000);
 if((sim.w!==grid.w||sim.h!==grid.h)&&(Math.abs(cellAspect-1)>.0125||qualityChange||sim.n<grid.w*grid.h*.9)){
  sim.resize(grid.w,grid.h);ink.width=sim.w;ink.height=sim.h;pixels=inkCtx.createImageData(sim.w,sim.h);
 }
}

new ResizeObserver(resize).observe(stage);
function seed(){sim.clear();for(let n=0;n<24;n++){const a=n/24*Math.PI*1.65;const x=.60+Math.cos(a)*(.13+n*.004),y=.55+Math.sin(a)*(.12+n*.005);const c=n<14?colors[0].rgb:colors[1].rgb;sim.splat(x,y,c,.035+n*.0003,Math.sin(a)*20,-Math.cos(a)*18);}for(let n=0;n<9;n++){const a=n/9*2;sim.splat(.74+Math.sin(a)*.10,.36+Math.cos(a)*.15,colors[2].rgb,.022,Math.cos(a)*8,-Math.sin(a)*8);}for(let n=0;n<24;n++)sim.step(1/30);}
// Draw every palette color once per shuffled round; avoid repeats across rounds.
function nextDropColor(){
 let color=state.selected;
 if($('cycleColors').checked){
  if(!colorBag.length)colorBag=colors.map((_,i)=>i);
  const choices=colorBag.filter(i=>i!==lastDropColor);
  color=choices[Math.floor(Math.random()*choices.length)];
  colorBag.splice(colorBag.indexOf(color),1);
 }else colorBag=[];
 lastDropColor=color;
 return color;
}
function dropClock(){
 const enabled=$('quantizeEnabled').checked,beats=Number($('quantizeBeats').value),rate=audio.rhythmRate,range=octaveRange();
 const now=(state.playing||recorder?.replaying)&&audio.ctx?audio.ctx.currentTime:performance.now()/1000;
 const origin=state.playing?(rhythmUI.timingOrigin??clockOrigin):0;
 return {now,origin,bpm:state.bpm,rate,beats,enabled,key:[state.playing,origin,state.bpm,rate,enabled,beats,range.down,range.up].join('|')};
}
function prepareDrop(d,clock){if(d.replay)return;
 if(d.timingKey===clock.key)return;
 // A note which already sounded should splash once, even across a transport edit.
 if(d.audioScheduled&&audio.ctx&&audio.ctx.currentTime>=d.audioTime){d.landing=clock.now;d.timingKey=clock.key;d.progress=1;return;}
 d.cancel?.abort();d.audioScheduled=false;
 d.startProgress=d.progress||0;d.start=clock.now;
 d.landing=landingTime(clock.now,(1-d.startProgress)*d.duration,clock);d.timingKey=clock.key;recorder?.capture('drop',{id:d.id,x:d.x,y:d.y,color:d.color,flight:d.landing-d.start,progress:d.startProgress});
}
function playDrop(d,when=null,signal=null){
 if(!state.playing)return;
 const chordIndex=when===null?state.chordIndex:Math.floor(Math.max(0,when-clockOrigin)/(Number($('chordLength').value)*60/state.bpm))%4;
 d.pitch=pitchForPosition(activeChords()[chordIndex],(d.x-.04)/.92,d.color,octaveRange());d.voice=state.voices[d.color];
 if(Number.isInteger(d.expression?.chordTone)){const chord=parseChord(activeChords()[chordIndex]),i=d.expression.chordTone,shift=Math.floor((d.pitch-chord[0])/12)*12;d.pitch=Math.max(0,Math.min(127,chord[i%chord.length]+Math.floor(i/chord.length)*12+shift));}
 audio.note(d.voice,d.pitch,d.expression,{when,signal}).catch(loadFail);
}
function serviceDrops(){
 if(!drops.length)return;
 const clock=dropClock();
 for(const d of drops){
  prepareDrop(d,clock);
  if(!clock.enabled||!state.playing||d.audioScheduled)continue;
  // Recover a suspended tab on a fresh grid line instead of bursting late notes.
  if(d.landing<clock.now+.003){d.startProgress=d.progress||0;d.start=clock.now;d.landing=landingTime(clock.now,.025,clock);}
  if(d.landing<=clock.now+.12){d.cancel=new AbortController();d.audioScheduled=true;d.audioTime=d.landing;playDrop(d,d.landing,d.cancel.signal);}
 }
}
function syncDropScheduler(){
 if(dropTimer!==null)globalThis.clearInterval(dropTimer);dropTimer=null;
 serviceDrops();if(state.playing&&$('quantizeEnabled').checked)dropTimer=globalThis.setInterval(serviceDrops,25);
}
function drop(x,y,color=state.selected,impulse=null,expression=null){
 if(recorder?.blocked)return;color=nextDropColor();const d={id:++dropSerial,x:Math.max(.04,Math.min(.96,x)),y:Math.max(.08,Math.min(.92,y)),color,expression,progress:0,duration:expression?.kind==='flick'?.23:.45+Math.random()*.15,impulse:impulse||[Math.random()*14-7,13+Math.random()*12]};
 prepareDrop(d,dropClock());drops.push(d);if(drops.length>45)drops.shift().cancel?.abort();
}
function impact(d){const c=colors[d.color];if(d.replay){ripples.push({x:d.x,y:d.y,color:c.hex,t:0});glows.push({x:d.x,y:d.y,color:c.hex,t:0});return;}const size=(.018+Number($('dropSize').value)/100*.06)*(d.expression?.ink||1),force=d.expression?.force||1;sim.splat(d.x,d.y,c.rgb,size,d.impulse[0]*force,d.impulse[1]*force);ripples.push({x:d.x,y:d.y,color:c.hex,t:0});glows.push({x:d.x,y:d.y,color:c.hex,t:0});if(ripples.length>30)ripples.shift();if(glows.length>20)glows.shift();if(state.playing){if(!d.audioScheduled)playDrop(d);$('noteToast').textContent=`${noteName(d.pitch)}  ·  ${instruments[d.voice].name.toUpperCase()}`;$('noteToast').classList.add('show');clearTimeout(noteTimer);noteTimer=setTimeout(()=>$('noteToast').classList.remove('show'),1400);}}
$('clear').onclick=()=>{sim.clear();for(const d of drops)d.cancel?.abort();drops=[];ripples=[];glows=[];performanceUI.reset();arpUI.clearVisuals();};
$('bloom').onclick=()=>{for(let i=0;i<8;i++){const a=i/8*Math.PI*2;drop(.5+Math.cos(a)*.17,.5+Math.sin(a)*.17);}$('intro').classList.add('faded');};
function drawFluid(t){const light=atmosphere.light;renderFluidPixels(sim,pixels.data,t,colorizeFluid,{luminance:performanceUI.luminance*light.brightness});inkCtx.putImageData(pixels,0,0);ctx.fillStyle='#070b11';ctx.fillRect(0,0,width,height);ctx.drawImage(ink,0,0,width,height);atmosphere.draw(ctx,width,height);ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);}
function drawOverlay(dt,t){const clock=drops.length?dropClock():null;fx.clearRect(0,0,width,height);for(const p of dust){const x=(p.x+Math.sin(t*.035+p.p)*.006)*width,y=(p.y+Math.cos(t*.024+p.p)*.01)*height;fx.globalAlpha=.12+Math.sin(t*.5+p.p)*.07;fx.fillStyle=colors[0].hex;fx.beginPath();fx.arc(x,y,p.r,0,Math.PI*2);fx.fill();}fx.globalAlpha=1;for(let i=drops.length-1;i>=0;i--){const d=drops[i];prepareDrop(d,clock);const progress=d.progress=d.progress>=1?1:Math.max(d.progress,d.startProgress+(1-d.startProgress)*Math.max(0,Math.min(1,(clock.now-d.start)/(d.landing-d.start)))),x=d.x*width,y=d.y*height-(1-progress*progress)*105,c=colors[d.color].hex;const halo=fx.createRadialGradient(x,y,0,x,y,19);halo.addColorStop(0,c+'85');halo.addColorStop(.2,c+'40');halo.addColorStop(1,c+'00');fx.fillStyle=halo;fx.beginPath();fx.arc(x,y,19,0,Math.PI*2);fx.fill();fx.strokeStyle=c+'50';fx.lineWidth=1.2;fx.beginPath();fx.moveTo(x,y-12);fx.lineTo(x,y-2);fx.stroke();fx.fillStyle=c;fx.beginPath();fx.ellipse(x,y,2.3,3.5,0,0,Math.PI*2);fx.fill();fx.fillStyle='#fff9';fx.beginPath();fx.arc(x-.5,y-1,1,0,Math.PI*2);fx.fill();if(progress>=1){impact(d);drops.splice(i,1);}}
 fx.globalCompositeOperation='screen';for(let i=glows.length-1;i>=0;i--){const g=glows[i];g.t+=dt;const r=18+g.t*36,alpha=Math.max(0,1-g.t/1.7)*.15;fx.globalAlpha=alpha;const halo=fx.createRadialGradient(g.x*width,g.y*height,0,g.x*width,g.y*height,r);halo.addColorStop(0,g.color);halo.addColorStop(1,g.color+'00');fx.fillStyle=halo;fx.fillRect(g.x*width-r,g.y*height-r,r*2,r*2);if(g.t>1.7)glows.splice(i,1);}fx.globalAlpha=1;fx.globalCompositeOperation='source-over';for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.t+=dt;const opacity=Math.max(0,1-r.t/2.1)*.30;fx.strokeStyle=r.color;fx.globalAlpha=opacity;fx.lineWidth=.65;fx.beginPath();fx.ellipse(r.x*width,r.y*height,5+r.t*39,2+r.t*15,0,0,Math.PI*2);fx.stroke();if(r.t>2.1)ripples.splice(i,1);}fx.globalAlpha=1;}
function tick(now){const dt=Math.min(.033,(now-lastFrame)/1000||.016);lastFrame=now;recorder?.frame();const t=now/1000;if(state.playing){state.elapsed=Math.max(0,audio.ctx.currentTime-clockOrigin);const length=Number($('chordLength').value)*60/state.bpm;const chord=Math.floor(state.elapsed/length)%4;if(chord!==state.chordIndex){state.chordIndex=chord;renderChords();updateTransport();}const line=$('chords').querySelector('.active .progress');if(line)line.style.width=(state.elapsed%length/length*100)+'%';}rainTimer+=dt;const interval=4.5-Number($('rain').value)/100*3.9;if(!recorder?.blocked&&$('autoPour').checked&&rainTimer>(state.playing?interval:interval*1.8)){rainTimer=0;drop(.16+Math.random()*.71,.25+Math.random()*.53);}atmosphere.frame(dt,{chord:activeChords()[state.chordIndex],index:state.chordIndex,playing:state.playing||!!recorder?.replaying,amount:Number($('chordAtmosphere').value),palette:paletteKey});if(!recorder?.blocked)atmosphere.stir(sim,dt);performanceUI.frame(dt,now);rhythmUI.frame();arpUI.frame();if(!recorder?.blocked)serviceDrops();if(!recorder?.arming)sim.step(dt);drawFluid(t);drawOverlay(dt,t);rhythmUI.draw(fx,width,height);arpUI.draw(fx,width,height);performanceUI.draw(fx,width,height,now);frameCount++;requestAnimationFrame(tick);}
const performanceUI=createPerformanceController({canvas,stage,audio,sim,drop,nextColor:()=>state.selected,getColor:()=>colors[state.selected],readOnly:()=>!!recorder?.blocked,onChange:()=>recorder?.stateChanged(),onGesture:m=>recorder?.capture('gesture',{...m,performance:{...audio.performance}}),onFirstTouch:()=>$('intro').classList.add('faded'),openGuide:()=>{if(document.body.classList.contains('panel-hidden'))togglePanel();switchTab('perform');$('gestureGuide').open=true;$('gestureGuide').querySelector('summary').focus();$('gestureGuide').scrollIntoView?.({block:'nearest'});}});
const rhythmUI=createRhythmController({audio,togglePlay,onChange:()=>recorder?.stateChanged(),getChordAt:when=>activeChords()[Math.floor(Math.max(0,when-clockOrigin)/(Number($('chordLength').value)*60/state.bpm))%4],getPosition:()=>Math.max(0,state.playing?audio.ctx.currentTime-clockOrigin:state.elapsed)*state.bpm/60,onHit:hit=>{recorder?.capture('percussion',hit,hit.time);stirPercussion(sim,hit);}});
const arpUI=createArpeggiatorController({audio,getColors:()=>colors.map(c=>c.hex),onNote:event=>recorder?.capture('arpeggio',event,event.time),onChange:()=>recorder?.stateChanged(),getClock:()=>({origin:rhythmUI.timingOrigin??clockOrigin,chordOrigin:clockOrigin,bpm:state.bpm,rate:audio.rhythmRate,chordBeats:Number($('chordLength').value),chords:activeChords()}),getChord:()=>activeChords()[state.chordIndex]});
const environmentUI=createEnvironmentController({audio,getOrigin:()=>clockOrigin,onChange:()=>recorder?.stateChanged(),readOnly:()=>!!recorder?.blocked});
const workspaceUI=createWorkspaceController({switchTab});
sliders();syncAudio();$('bpmLabel').textContent=state.bpm;$('customChords').hidden=state.progression!=='custom';$('scapeDescription').textContent=soundscapes[$('soundscape').value]?.text||'Four colors. Four voices. Entirely your own.';document.querySelector('.autopour').classList.toggle('off',!$('autoPour').checked);sim.swirl=Number($('swirl').value)/100;sim.persistence=Number($('persistence').value)/100;renderChords();updateTransport();applyPalette();syncColorMode();resize();seed();requestAnimationFrame(tick);

function snapshotPerformance(){return {main:{settings:Object.fromEntries(persisted.map(id=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value])),voices:[...state.voices],custom:[...state.custom],bpm:state.bpm,selected:state.selected},rhythm:rhythmUI.getState(),arp:arpUI.getState(),environment:environmentUI.getState(),expression:performanceUI.getState(),position:state.playing?Math.max(0,audio.ctx.currentTime-clockOrigin):state.elapsed,chordIndex:state.chordIndex,performance:{...audio.performance}};}
function snapshotScene(){return {w:sim.w,h:sim.h,...Object.fromEntries(['u','v','r','g','b'].map(key=>[key,Array.from(sim[key])]))};}
function restoreScene(scene){sim.clear();resampleFluidState(scene,sim);drops=[];ripples=[];glows=[];}
function stopLive(){state.playing=false;rhythmUI.stop();arpUI.stop();environmentUI.stop();audio.setPlaying(false);if(dropTimer!==null)globalThis.clearInterval(dropTimer);dropTimer=null;for(const d of drops)d.cancel?.abort();drops=[];performanceUI.reset();updateTransport();}
function applySnapshot(raw,persistSettings=false){const s=sanitizeSnapshot(raw);Object.assign(state,{voices:s.main.voices,custom:s.main.custom,bpm:s.main.bpm,selected:s.main.selected,progression:s.main.settings.progression,elapsed:s.position,chordIndex:s.chordIndex});for(const [id,value] of Object.entries(s.main.settings)){$(id).type==='checkbox'?$(id).checked=value:$(id).value=String(value);}if(persistSettings||JSON.stringify(s.rhythm)!==JSON.stringify(rhythmUI.getState()))rhythmUI.restore(s.rhythm,persistSettings);if(persistSettings||JSON.stringify(s.arp)!==JSON.stringify(arpUI.getState()))arpUI.restore(s.arp,persistSettings);if(persistSettings||JSON.stringify(s.expression)!==JSON.stringify(performanceUI.getState()))performanceUI.restore(s.expression,persistSettings);$('chordInput').value=state.custom.join(', ');$('customChords').hidden=state.progression!=='custom';$('bpmLabel').textContent=state.bpm;$('scapeDescription').textContent=soundscapes[$('soundscape').value]?.text||'Four colors. Four voices. Entirely your own.';state.voices.forEach((v,i)=>$('voice'+i).value=v);clockOrigin=(audio.ctx?.currentTime||0)-s.position;if(persistSettings||JSON.stringify(s.environment)!==JSON.stringify(environmentUI.getState()))environmentUI.restore(s.environment,persistSettings);audio.setPerformance(s.performance);applyPalette();sliders();syncAudio();syncQuantize();syncColorMode();sim.swirl=Number($('swirl').value)/100;sim.persistence=Number($('persistence').value)/100;document.querySelector('.autopour').classList.toggle('off',!$('autoPour').checked);renderChords();updateTransport();if(persistSettings)save();}
recorder=createRecorderController({audio,snapshot:snapshotPerformance,scene:snapshotScene,validate:sanitizeTake,applySnapshot,restoreScene,stopLive,
 async prepareLive(){if(state.playing)stopLive();await audio.initialize();await Promise.all([...state.voices,...(arpUI.requiredVoice?[arpUI.requiredVoice]:[])].map(key=>audio.load(key)));environmentUI.prepare();},
 beginLive(start){state.elapsed=0;state.chordIndex=0;clockOrigin=start;performanceUI.reset();state.playing=true;audio.setPlaying(true);audio.recordingEnd=null;rhythmUI.start(start);arpUI.start();environmentUI.start(start);syncDropScheduler();rainTimer=0;renderChords();updateTransport();$('intro').classList.add('faded');},
 trimFuture(end){arpUI.trim(end);rhythmUI.trim(end);for(const d of drops)if(d.audioScheduled&&d.audioTime>=end)d.cancel?.abort();},
 freezeLive(end){rhythmUI.freeze(end);arpUI.freeze(end);environmentUI.stop();if(dropTimer!==null)globalThis.clearInterval(dropTimer);dropTimer=null;for(const d of drops)d.cancel?.abort();drops=[];},
 exitPlayback(){audio.replaying=false;performanceUI.reset();updateTransport();},playbackStarted(){audio.replaying=true;updateTransport();},
 applyEvent(event,at){const d=event.data;if(event.kind==='settings')applySnapshot(d);if(event.kind==='fluid')sim[d.op](...d.args);if(event.kind==='drop'){let drop=drops.find(p=>p.replay&&p.id===d.id);if(!drop){drop={id:d.id,x:d.x,y:d.y,color:d.color,replay:true};drops.push(drop);}Object.assign(drop,{start:at,startProgress:d.progress,progress:d.progress,landing:at+d.flight});}if(event.kind==='gesture')performanceUI.replayGesture(d);if(event.kind==='arpeggio')arpUI.replayNote({...d,time:at});if(event.kind==='percussion'){stirPercussion(sim,d);rhythmUI.replayHit({...d,time:at});}}
});
for(const op of ['splat','force','pulse','clear']){const original=sim[op].bind(sim);sim[op]=(...args)=>{recorder.capture('fluid',{op,args});return original(...args);};}

for(const type of ['input','change'])document.addEventListener(type,e=>{if(e.target.closest?.('#recordDialog')||e.target.closest?.('#communityDialog'))return;recorder.stateChanged();});

audio.onSessionEvent=(...args)=>recorder.captureSound(...args);
createCommunityController(recorder);
