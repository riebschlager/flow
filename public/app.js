import {FluidListen,shimmerNote} from './fluid-listen.js?rev=fluid-feedback-82';
import {writeInDye,normalizeDyeTitle} from './dye-text.js?rev=clip-framing-89';
import {migrateListeningPreferences,normalizeLayout,PerformerTrail,createPresentControls} from './first-run.js?rev=session-entry-90';
import {VisibleSound,normalizeEnergy} from './visible-sound.js?rev=fluid-feedback-82';
import {delaySeconds} from './timing.js?rev=gestures-32-echo52';
import {createDriftController} from './drift-ui.js?rev=session-entry-90';
import {RainClock,schedulingLookahead,createBackgroundContinuity} from './background-continuity.js?rev=continuity-76';
import {createSessionWorkspace} from './session-workspace.js?rev=session-entry-90';
import {WaterSurface} from './water-surface.js?rev=water-49';
import {fluidGridSize,resampleFluidState} from './fluid-viewport.js?rev=aspect-36';
import {createWorkspaceController} from './workspace-ui.js?rev=follow-root-75-workspace-35';
import {createEnvironmentController} from './environment-ui.js?rev=session-entry-90';
import {GPUFluidRenderer} from './gpu-fluid-renderer.js?rev=gpu-84';
import {createFluidColorizer,renderFluidPixels} from './fluid-renderer.js?rev=performance-39';
import {getPalette,normalizePalette} from './palettes.js?rev=gestures-32';
import {createCommunityController} from './community-ui.js?rev=titles-81';
import {createPresentationController} from './presentation.js?rev=zen-controls-88';
import {createRecorderController} from './recorder-ui.js?rev=clip-framing-89';
import {sanitizeSnapshot,sanitizeTake} from './recording-state.js?rev=chaos-86';
import {ChordAtmosphere} from './chord-atmosphere.js?rev=fluid-feedback-82';
import {createArpeggiatorController} from './arpeggiator-ui.js?rev=session-entry-90';
import {stirPercussion} from './percussion-visuals.js?rev=gestures-32';
import {landingTime,quantizeDivisions} from './quantize.js?rev=gestures-32';
import {Fluid} from './fluid.js?rev=performance-39';
import {createPerformanceController} from './performance.js?rev=listening-85';
import {createRhythmController} from './rhythm-ui.js?rev=session-entry-90';
import {AmbientAudio,isColorVoice,resolveColorVoice,instruments,instrumentGroups,soundscapes,progressions,progressionDetails,parseChord,pitchForPosition,pitchesForRange,normalizeOctaveRange,noteName} from './music.js?rev=chaos-86';
import {createNoteReadout} from './note-readout.js?rev=crossfade-41';
const $=id=>document.getElementById(id);
const showNote=createNoteReadout($('noteToast'),[$('notePitchA'),$('notePitchB')],[$('noteVoiceA'),$('noteVoiceB')]);
let paletteKey=null,colors=getPalette('classic').colors,colorizeFluid=createFluidColorizer('classic');
const state={selected:0,voices:[...soundscapes.stillwater.voices],progression:'daydream',custom:['Cmaj7','Am7','Fmaj7','G'],bpm:56,playing:false,elapsed:0,chordIndex:0};
let recorder=null,sessionWorkspace=null,driftUI=null;
const audio=new AmbientAudio();let busy=false,clockOrigin=0,dropTimer=null,continuity=null;const rainClock=new RainClock();
let returning=false,layout;
migrateListeningPreferences(globalThis.localStorage,soundscapes);
try{returning=!!localStorage.getItem('chromaflow-v1');layout=normalizeLayout(JSON.parse(localStorage.getItem('chromaflow-layout-v1')),returning);}catch{layout=normalizeLayout(null,returning);}
let pendingTouches=[],startingFromCanvas=false;
const effectiveVoices=()=>state.voices;
function saveLayout(){layout={panelHidden:document.body.classList.contains('panel-hidden'),mobileOpen:document.body.classList.contains('mobile-controls-open')};try{localStorage.setItem('chromaflow-layout-v1',JSON.stringify(layout));}catch{}}
document.body.classList.toggle('panel-hidden',layout.panelHidden);document.body.classList.toggle('canvas-first',layout.panelHidden);
$('voices').innerHTML=colors.map((c,i)=>`<div id="voiceRow${i}" class="voice-row" style="--color:${c.hex}"><span class="voice-dot"></span><label id="voiceLabel${i}" for="voice${i}">${c.name}</label><select id="voice${i}" aria-label="${c.name} instrument"><option value="chaos" ${state.voices[i]==='chaos'?'selected':''}>Chaos · random instrument per droplet</option>${instrumentGroups.map(group=>`<optgroup label="${group}">${Object.entries(instruments).filter(([,v])=>v.group===group).map(([k,v])=>`<option value="${k}" ${state.voices[i]===k?'selected':''}>${v.name}</option>`).join('')}</optgroup>`).join('')}</select></div>`).join('');
const persisted=['fluidListens','energy','colorPalette','soundscape','progression','chordLength','reverb','delay','volume','dropletsVolume','swirl','persistence','dropSize','rain','cycleColors','autoPour','quantizeEnabled','quantizeBeats','octavesDown','octavesUp','chordAtmosphere','waterEnabled','waterSwell','waterSpeed','waterRefraction','waterCaustics','waterReflection'];
function save(){try{localStorage.setItem('chromaflow-v1',JSON.stringify({settings:Object.fromEntries(persisted.map(id=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value])),voices:state.voices,custom:state.custom,bpm:state.bpm,selected:state.selected}));}catch{}recorder?.stateChanged();}
function restore(){try{const s=JSON.parse(localStorage.getItem('chromaflow-v1'));if(!s)return;for(const [id,value] of Object.entries(s.settings||{})){if(!persisted.includes(id))continue;const el=$(id);if(el.type==='checkbox')el.checked=id==='fluidListens'?value===true:!!value;else el.value=id==='energy'?normalizeEnergy(value):value;}if(s.voices?.length===4&&s.voices.every(isColorVoice))state.voices=s.voices;if(s.custom?.length===4){s.custom.forEach(parseChord);state.custom=s.custom;$('chordInput').value=s.custom.join(', ');}if(Number.isInteger(s.selected)&&s.selected>=0&&s.selected<4)state.selected=s.selected;state.bpm=Math.max(30,Math.min(100,Number(s.bpm)||56));if(!$('progression').value)$('progression').value='daydream';if(!$('soundscape').value)$('soundscape').value='stillwater';state.progression=$('progression').value;state.voices.forEach((v,i)=>$('voice'+i).value=v);}catch{}}
restore();
if(!returning){$('energy').value='70';$('autoPour').checked=false;}
effectiveVoices().forEach((v,i)=>$('voice'+i).value=v);
if(!quantizeDivisions.includes(Number($('quantizeBeats').value)))$('quantizeBeats').value='.5';
function syncQuantize(){const on=$('quantizeEnabled').checked;$('quantizeBeats').disabled=!on;$('quantizeStatus').textContent=on?'Land on the next grid line · follows tempo & rhythm speed':'Off · droplets land freely';}
for(const id of ['quantizeEnabled','quantizeBeats'])$(id).addEventListener('change',()=>{syncQuantize();syncDropScheduler();save();});
syncQuantize();
function activeChords(){const key=state.driftProgression||state.progression;return key==='custom'?state.custom:progressions[key];}
function octaveRange(){return normalizeOctaveRange({down:$('octavesDown').value,up:$('octavesUp').value});}
function syncPitchRange(){
 const range=octaveRange();$('octavesDown').value=String(range.down);$('octavesUp').value=String(range.up);
 const cycling=$('cycleColors').checked,voice=cycling?0:state.selected,notes=pitchesForRange(activeChords()[state.chordIndex],voice,range);
 $('pitchRangeValue').textContent=`${cycling?'Base range':colors[voice].name}: ${noteName(notes[0])} → ${noteName(notes.at(-1))} · ${notes.length} notes`;
}
for(const id of ['octavesDown','octavesUp'])$(id).addEventListener('change',()=>{syncPitchRange();syncDropScheduler();save();});
function renderChords(){recorder?.stateChanged();const list=activeChords(),detail=progressionDetails[state.progression],descriptions={daydream:'Familiar major-seventh warmth with a gentle lift at the end.',weightless:'A clear major-key circle, balanced between lift and repose.',afterhours:'Soft minor colors, without a strong dominant resolution.',openwater:'An unhurried major-to-minor drift with shared chord tones.',custom:'Your own four-chord loop. Diminished, sus2 and sus4 chords are welcome, along with sixths, sevenths and ninths.'};$('progressionDescription').textContent=detail?`${detail.text} Try ${detail.pair} · ${detail.length} beats per chord.`:descriptions[state.progression];$('chords').innerHTML=list.map((c,i)=>`${i?'<span class="chord-arrow" aria-hidden="true">→</span>':''}<button class="chord-chip ${i===state.chordIndex?'active':''}" data-chord="${i}" aria-label="Jump to ${c}" ${i===state.chordIndex?'aria-current="true"':''}>${c}<span class="progress"></span></button>`).join('');syncPitchRange();}
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
async function togglePlay({canvasStart=false}={}){if(recorder?.phase!=='idle'&&recorder){if(recorder.recording)recorder.finish();else if(recorder.replaying)recorder.stopPlayback();return;}if(busy)return;if(sessionWorkspace?.previewing){await community.playPreview();return;}if(document.body.classList.contains('session-home'))return;if(state.playing){state.elapsed=Math.max(0,audio.ctx.currentTime-clockOrigin);state.playing=false;rhythmUI.stop();arpUI.stop();environmentUI.stop();audio.setPlaying(false);syncDropScheduler();updateTransport();return;}busy=true;startingFromCanvas=canvasStart;hideListeningHint();$('start').disabled=true;$('audioState').style.color='';$('audioState').textContent='Getting your scene ready…';try{await audio.initialize();driftUI?.resume();await Promise.all([...effectiveVoices(),...(arpUI.requiredVoice?[arpUI.requiredVoice]:[])].map(v=>audio.load(v)));environmentUI.prepare();clockOrigin=audio.ctx.currentTime-state.elapsed;state.playing=true;audio.setPlaying(true);rhythmUI.start();arpUI.start();environmentUI.start();rainTimer=0;rainClock.reset();syncDropScheduler();updateTransport();$('intro').classList.add('faded');const touches=pendingTouches;pendingTouches=[];for(const args of touches)drop(...args);if(!canvasStart&&!touches.length)drop(.4+Math.random()*.2,.5+Math.random()*.12,0);}catch(e){pendingTouches=[];loadFail(e);}finally{busy=false;startingFromCanvas=false;$('start').disabled=false;syncMobilePlay();}}
function updateTransport(){$('presentPlay').textContent=recorder?.replaying?'Stop':state.playing?'Pause':'Play';$('presentPlay').setAttribute('aria-label',$('presentPlay').textContent);continuity?.sync();syncListeningHint();const replay=!!recorder?.replaying;$('start').querySelector('use').setAttribute('href',state.playing?'#pause':'#play');$('start').setAttribute('aria-label',state.playing?'Pause':'Play');$('playLabel').textContent=replay?'Recorded moment':state.playing?'In the flow':'Play';$('audioState').textContent=replay?'A favorite moment, on repeat':state.playing?`${activeChords()[state.chordIndex]} · ${$('soundscape').selectedOptions[0].textContent}`:'Play your session when you’re ready';$('sessionState').textContent=replay?'A FAVORITE MOMENT, RETURNING':state.playing?'LET THE MUSIC KEEP YOU COMPANY':'TAKE YOUR TIME';document.querySelector('.transport').classList.toggle('paused',!state.playing&&!replay);rhythmUI.transportChanged();arpUI.transportChanged();environmentUI.transportChanged();workspaceUI.sync();syncMobilePlay();}
// Offer one quiet invitation after a visitor starts painting in silence.
let listeningHintShown=false,listeningHintUntil=0,listeningDiscovered=false;
try{listeningDiscovered=localStorage.getItem('flow-listening-discovered')==='1';}catch{}
function hideListeningHint(){document.body.classList.remove('listening-invitation');for(const id of ['listeningHint','mobileListeningHint'])$(id).textContent='';}
function inviteListening(){
 if(listeningDiscovered||listeningHintShown||busy||state.playing||recorder?.blocked)return;
 listeningHintShown=true;listeningHintUntil=performance.now()+10000;
 $('listeningHint').textContent='Your flow has a soundtrack. Press Play to hear it.';
 $('mobileListeningHint').textContent='Your flow has a soundtrack. Tap Play to hear it.';
 document.body.classList.add('listening-invitation');
}
function syncListeningHint(){
 if(state.playing||recorder?.replaying){if(!listeningDiscovered){listeningDiscovered=true;try{localStorage.setItem('flow-listening-discovered','1');}catch{}}hideListeningHint();}
}
$('start').addEventListener('click',togglePlay);
function syncAudio(){document.dispatchEvent?.(new Event("flow:selects"));audio.dropletsVolume=Number($('dropletsVolume').value)/100;audio.volume=Number($('volume').value)/100;audio.reverb=Number($('reverb').value)/100;audio.delay=Number($('delay').value)/100;audio.bpm=state.bpm;audio.update();}
function sliders(){for(const id of ['energy','reverb','delay','volume','dropletsVolume','swirl','persistence','dropSize','rain','chordAtmosphere','waterSwell','waterSpeed','waterRefraction','waterCaustics','waterReflection']){const el=$(id);el.style.setProperty('--pct',((el.value-el.min)/(el.max-el.min)*100)+'%');if($(id+'Value'))$(id+'Value').textContent=id==='rain'?(el.value<28?'Occasional':el.value<60?'Unhurried':'Abundant'):el.value+'%';}}
$('soundscape').addEventListener('change',async()=>{const scape=soundscapes[$('soundscape').value];if(scape){state.voices=[...scape.voices];state.voices.forEach((v,i)=>$('voice'+i).value=v);$('reverb').value=scape.reverb;$('delay').value=scape.delay;$('scapeDescription').textContent=scape.text;sliders();syncAudio();if(audio.ctx){try{await Promise.all(state.voices.map(v=>audio.load(v)));}catch(e){loadFail(e);}}}else $('scapeDescription').textContent='Four colors. Four voices. Entirely your own.';save();updateTransport();});
for(let i=0;i<4;i++)$('voice'+i).addEventListener('change',async()=>{const chosen=$('voice'+i).value;state.voices[i]=chosen;$('soundscape').value='custom';$('scapeDescription').textContent='Four colors. Four voices. Entirely your own.';save();if(audio.ctx)try{await audio.load(state.voices[i]);}catch(e){loadFail(e);}updateTransport();});
$('progression').addEventListener('change',()=>{driftUI?.harmonyInput();state.progression=$('progression').value;state.elapsed=0;state.chordIndex=0;if(state.playing)clockOrigin=audio.ctx.currentTime;rhythmUI.resync();$('customChords').hidden=state.progression!=='custom';renderChords();updateTransport();save();});
$('applyChords').addEventListener('click',()=>{try{const c=$('chordInput').value.split(',').map(x=>x.trim());if(c.length!==4)throw new Error('Enter exactly four chords, separated by commas.');c.forEach(parseChord);state.custom=c;state.elapsed=0;state.chordIndex=0;if(state.playing)clockOrigin=audio.ctx.currentTime;rhythmUI.resync();$('chordError').textContent='Your progression is ready.';$('chordError').style.color='#b6e1c9';renderChords();updateTransport();save();}catch(e){$('chordError').textContent=e.message;$('chordError').style.color='#ffa6ab';}});
$('chords').addEventListener('click',e=>{const el=e.target.closest('[data-chord]');if(!el)return;state.chordIndex=Number(el.dataset.chord);state.elapsed=state.chordIndex*Number($('chordLength').value)*60/state.bpm;if(state.playing)clockOrigin=audio.ctx.currentTime-state.elapsed;rhythmUI.resync();renderChords();updateTransport();if(state.playing)drop(.48,.55,state.selected);});
$('chordLength').addEventListener('change',()=>{state.elapsed=state.chordIndex*Number($('chordLength').value)*60/state.bpm;if(state.playing)clockOrigin=audio.ctx.currentTime-state.elapsed;rhythmUI.resync();save();});
function setBpm(value){if(state.playing)state.elapsed=Math.max(0,audio.ctx.currentTime-clockOrigin);const previous=state.bpm;state.bpm=Math.max(30,Math.min(100,value));state.elapsed*=previous/state.bpm;$('bpmLabel').textContent=state.bpm;syncAudio();if(state.playing)clockOrigin=audio.ctx.currentTime-state.elapsed;rhythmUI.resync();save();}
$('slower').onclick=()=>setBpm(state.bpm-2);$('faster').onclick=()=>setBpm(state.bpm+2);
for(const id of ['reverb','delay','volume','dropletsVolume','swirl','persistence','dropSize','rain'])$(id).addEventListener('input',()=>{sliders();syncAudio();sim.swirl=Number($('swirl').value)/100;sim.persistence=Number($('persistence').value)/100;save();});
const waterSurface=new WaterSurface(),waterKeys=['waterSwell','waterSpeed','waterRefraction','waterCaustics','waterReflection'];
const waterPresets={sea:[45,30,40,35,40],glass:[15,12,15,10,30],lagoon:[55,38,55,75,55]};
function syncWater(){const values=waterKeys.map(id=>Number($(id).value));$('waterPreset').value=Object.keys(waterPresets).find(k=>waterPresets[k].every((v,i)=>v===values[i]))||'custom';for(const id of waterKeys)$(id).disabled=!$('waterEnabled').checked;document.dispatchEvent?.(new Event('flow:selects'));}
for(const id of waterKeys)$(id).addEventListener('input',()=>{syncWater();sliders();save();});
$('waterEnabled').addEventListener('change',()=>{syncWater();save();});
$('waterPreset').addEventListener('change',()=>{const values=waterPresets[$('waterPreset').value];if(!values)return;waterKeys.forEach((id,i)=>$(id).value=values[i]);$('waterEnabled').checked=true;syncWater();sliders();save();});
syncWater();
$('chordAtmosphere').addEventListener('input',()=>{sliders();save();});
$('cycleColors').addEventListener('change',()=>{colorBag=[];syncColorMode();save();});$('autoPour').addEventListener('change',()=>{document.querySelector('.autopour').classList.toggle('off',!$('autoPour').checked);save();});
const tabs=['sound','rhythm','perform','fluid','mix'],tabDescriptions={sound:'Choose your sounds. Give the music a direction.',rhythm:'Add a little movement, a gentle pulse or a world of rain.',perform:'Let Automatic droplets play your setup, or add notes yourself.',fluid:'Find colors and a pace that feel good to be around.',mix:'Keep things soft, spacious and comfortable for you.'};
let currentTab='sound';const tabScroll=new Map();
function switchTab(name){if(!tabs.includes(name))return;tabScroll.set(currentTab,$('panelScroll').scrollTop||0);for(const tab of tabs){$(tab+'Panel').hidden=tab!==name;$(tab+'Tab').setAttribute('aria-selected',tab===name);$(tab+'Tab').tabIndex=tab===name?0:-1;}$('panelDescription').textContent=tabDescriptions[name];currentTab=name;$('panelScroll').scrollTop=tabScroll.get(name)||0;}
for(const tab of tabs){$(tab+'Tab').onclick=()=>switchTab(tab);$(tab+'Tab').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const other=e.key==='Home'?tabs[0]:e.key==='End'?tabs.at(-1):tabs[(tabs.indexOf(tab)+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];switchTab(other);$(other+'Tab').focus();});}

// Phone controls are a modal sheet; the canvas stays one tap away.
const mobileLayout=window.matchMedia('(max-width: 720px), (max-width: 1000px) and (max-height: 500px) and (pointer: coarse)');
let mobileReturnFocus=null;
function syncMobilePlay(){
 $('mobilePlay').disabled=busy;
 $('mobilePlayLabel').textContent=busy?'Preparing…':recorder?.replaying?'Stop':state.playing?'Pause':'Play';
 $('mobilePlay').setAttribute('aria-label',$('mobilePlayLabel').textContent);
 $('mobilePlay').querySelector('use').setAttribute('href',state.playing?'#pause':'#play');
}
function setMobileControls(open,restore=true){
 open=!!open&&mobileLayout.matches;
 const panel=$('panel');
 if(open)mobileReturnFocus=document.activeElement;
 document.body.classList.toggle('mobile-controls-open',open);document.body.classList.toggle('canvas-first',!open&&layout.panelHidden);
 $('mobileBackdrop').hidden=!open;
 for(const selector of ['.topbar','.artwork','.mobile-dock'])document.querySelector(selector).inert=open;
 $('mobileControls').setAttribute('aria-expanded',String(open));
 $('togglePanel').setAttribute('aria-expanded',String(mobileLayout.matches?open:!document.body.classList.contains('panel-hidden')));
 if(open){panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');$('closeMobileControls').focus();}
 else{panel.removeAttribute('role');panel.removeAttribute('aria-modal');if(restore&&mobileReturnFocus){mobileReturnFocus.focus();mobileReturnFocus=null;}}if(restore)saveLayout();
}
$('mobilePlay').onclick=async()=>{const pending=togglePlay();syncMobilePlay();try{await pending;}finally{syncMobilePlay();}};
$('mobileControls').onclick=()=>setMobileControls(true);
$('closeMobileControls').onclick=() =>setMobileControls(false);
$('mobileBackdrop').onclick=()=>setMobileControls(false);
mobileLayout.addEventListener('change',()=>setMobileControls(false));
document.addEventListener('keydown',e=>{
 if(!document.body.classList.contains('mobile-controls-open')||document.querySelector('dialog[open]'))return;
 if(e.key==='Escape'){e.preventDefault();setMobileControls(false);}
 if(e.key==='Tab'){
  const items=[...$('panel').querySelectorAll('button,select,input,summary,a,[tabindex="0"]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length);
  const first=items[0],last=items.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
setMobileControls(mobileLayout.matches&&layout.mobileOpen,false);
// Move the same transport node: playback state and listeners survive layout changes.
function syncTransportLayout(){
 const inRail=!mobileLayout.matches&&!document.body.classList.contains('zen')&&!document.body.classList.contains('panel-hidden');
 const parent=inRail?$('controlRail'):document.querySelector('.artwork');
 parent.prepend($('zenTransportRow'));
}
mobileLayout.addEventListener('change',syncTransportLayout);
syncTransportLayout();
function togglePanel(){if(mobileLayout.matches){setMobileControls(!document.body.classList.contains('mobile-controls-open'));return;}document.body.classList.toggle('panel-hidden');document.body.classList.toggle('canvas-first',document.body.classList.contains('panel-hidden'));saveLayout();syncTransportLayout();$('togglePanel').setAttribute('aria-expanded',!document.body.classList.contains('panel-hidden'));} $('togglePanel').onclick=togglePanel;
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toggleZen();}catch{toggleZen();}};
function toggleZen(force){if(typeof force==='boolean')document.body.classList.toggle('zen',force);else document.body.classList.toggle('zen');syncTransportLayout();continuity?.sync();const entered=document.body.classList.contains('zen');if(entered){driftUI?.zen();presentControls.start();presentControls.syncWake();try{Promise.resolve(document.documentElement?.requestFullscreen?.()).catch(()=>{});}catch{}}else{presentControls.stop();presentControls.syncWake();try{if(document.fullscreenElement)Promise.resolve(document.exitFullscreen()).catch(()=>{});}catch{}}$('zen').setAttribute('aria-pressed',String(document.body.classList.contains('zen')));$('zen').innerHTML=document.body.classList.contains('zen')?'Exit Zen <span>↙</span>':'Zen view <span>↗</span>';}
$('zen').onclick=()=>toggleZen();
// Each zen edge folds independently; the handles stay on the growing canvas.
for(const [id,collapsedClass,label,collapseArrow,expandArrow] of [
 ['zenTransportToggle','zen-transport-collapsed','transport','⌃','⌄'],
 ['zenHarmonyToggle','zen-harmony-collapsed','chords & notes','⌄','⌃']
]){
 const button=$(id);
 button.onclick=()=>{
  const collapsed=!document.body.classList.contains(collapsedClass);
  document.body.classList.toggle(collapsedClass,collapsed);
  button.setAttribute('aria-expanded',String(!collapsed));
  button.innerHTML=`${collapsed?'Show':'Hide'} ${label} <span aria-hidden="true">${collapsed?expandArrow:collapseArrow}</span>`;
 };
}

document.addEventListener('keydown',e=>{if(document.body.classList.contains('presentation-mode'))return;if(e.key==='Escape'&&document.body.classList.contains('zen')){if(presentControls.open){e.preventDefault();presentControls.close();}else toggleZen(false);return;}if(recorder?.blocked||$('recordDialog').open||$('communityDialog').open)return;if(/^(INPUT|SELECT|TEXTAREA|BUTTON|SUMMARY|A)$/.test(document.activeElement.tagName)||$('beatDialog').open)return;if(performanceUI.key(e))return;if(e.code==='Space'&&!e.repeat){e.preventDefault();togglePlay();}if(/^[1-4]$/.test(e.key))selectColor(Number(e.key)-1);if(e.key==='Escape')toggleZen(false);});
// Fluid rendering and the droplet/impact lifecycle.
const canvas=$('fluid'),ctx=canvas.getContext('2d',{alpha:false});const overlay=$('particles'),fx=overlay.getContext('2d');const stage=$('stage');
const atmosphere=new ChordAtmosphere({reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false});
let width=1,height=1,dpr=1,vignette=null;const sim=new Fluid(window.innerWidth>720?224:144,window.innerWidth>720?156:112);const ink=document.createElement('canvas');ink.width=sim.w;ink.height=sim.h;const inkCtx=ink.getContext('2d');const gpuRenderer=new GPUFluidRenderer();let pixels=inkCtx.createImageData(sim.w,sim.h);let outgoingVisual=null;let drops=[],ripples=[],glows=[],lastFrame=0,rainTimer=0,frameCount=0;let colorBag=[],lastDropColor=-1,dropSerial=0;
const visibleSound=new VisibleSound({energy:$('energy').value,mobile:window.innerWidth<=720,reducedMotion:atmosphere.reducedMotion});
const fluidListen=new FluidListen();
$('fluidListens').addEventListener('change',()=>{fluidListen.reset(audio.ctx?.currentTime??0);save();});
audio.onVisualNote=note=>{if(!document.hidden&&note.curve){visibleSound.note(note);if(note.levelScale===.1&&note.noteEnvelope?.[1]?.duration===.6&&note.noteEnvelope[1].volume===.22)visibleSound.shimmer({x:(note.expression.pan/.8+1)/2,y:.5,at:note.at,signal:note.signal});}};
function visualImpact(d,bus='voices'){visibleSound.impact({x:d.x,y:d.y,color:colors[d.color||0].hex,voice:d.voice||(bus==='voices'?state.voices[d.color]:null),at:d.audioTime??d.landing??d.time,bus},{delay:audio.delay,echo:audio.performance.echo,spacing:delaySeconds(audio.bpm,audio.rhythmRate,audio.delayBeats),feedback:audio.feedback?.gain.value,gestureFeedback:audio.gestureFeedback?.gain.value});}
function syncEnergy(){const value=normalizeEnergy($('energy').value);$('energy').value=String(value);$('zenEnergy').value=String(value);$('zenEnergyValue').textContent=value+'%';visibleSound.setEnergy(value);sliders();}
$('energy').addEventListener('input',()=>{syncEnergy();save();});$('zenEnergy').addEventListener('input',()=>{$('energy').value=$('zenEnergy').value;syncEnergy();save();});syncEnergy();
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
 d.landing=landingTime(clock.now,(1-d.startProgress)*d.duration,clock);d.timingKey=clock.key;recorder?.capture('drop',{id:d.id,x:d.x,y:d.y,color:d.color,flight:d.landing-d.start,progress:d.startProgress},d.start);
}
function playDrop(d,when=null,signal=null){
 if(!state.playing)return;
 const chordIndex=chordAt(when??audio.ctx.currentTime);
 d.pitch=pitchForPosition(activeChords()[chordIndex],(d.x-.04)/.92,d.color,octaveRange());d.voice=resolveColorVoice(effectiveVoices()[d.color]);
 if(Number.isInteger(d.expression?.chordTone)){const chord=parseChord(activeChords()[chordIndex]),i=d.expression.chordTone,shift=Math.floor((d.pitch-chord[0])/12)*12;d.pitch=Math.max(0,Math.min(127,chord[i%chord.length]+Math.floor(i/chord.length)*12+shift));}
 audio.note(d.voice,d.pitch,d.expression,{when,signal}).catch(loadFail);
}
function chordAt(when){return Math.floor(Math.max(0,when-clockOrigin)/(Number($('chordLength').value)*60/state.bpm))%activeChords().length;}
function serviceMusic(){
 if(!state.playing)return;
 driftUI?.service();if(!state.playing)return;const now=audio.ctx.currentTime;state.elapsed=Math.max(0,now-clockOrigin);state.chordIndex=chordAt(now);
 const interval=4.5-Number($('rain').value)/100*3.9;
 rainClock.service(now,{enabled:!recorder?.blocked&&$('autoPour').checked,interval,key:[clockOrigin,interval,$('autoPour').checked].join('|'),emit:time=>drop(.16+Math.random()*.71,.25+Math.random()*.53,state.selected,null,null,time)});
 if(!recorder?.blocked||recorder?.renderingDrift)serviceDrops();
}
function serviceDrops(){
 if(!drops.length)return;
 const clock=dropClock();
 for(const d of drops){
  prepareDrop(d,clock);
  if(!state.playing||d.replay||d.audioScheduled)continue;
  // Recover a suspended tab on a fresh grid line instead of bursting late notes.
  if(d.landing<clock.now+.003){d.startProgress=d.progress||0;d.start=clock.now;d.landing=landingTime(clock.now,.025,clock);}
  if(d.landing<=clock.now+schedulingLookahead()){d.cancel=new AbortController();d.audioScheduled=true;d.audioTime=d.landing;playDrop(d,d.landing,d.cancel.signal);}
 }
 drops=drops.filter(d=>d.replay||!d.audioScheduled||d.landing>clock.now||(!document.hidden&&clock.now-d.landing<.16));
}
function syncDropScheduler(){
 if(dropTimer!==null)globalThis.clearInterval(dropTimer);dropTimer=null;
 if(!state.playing)driftUI?.stop();if(!state.playing)for(const d of drops)d.cancel?.abort();
 serviceMusic();if(state.playing)dropTimer=globalThis.setInterval(serviceMusic,25);
}
function drop(x,y,color=state.selected,impulse=null,expression=null,when=null,fixedColor=false){
 if(recorder?.blocked&&!recorder?.renderingDrift)return;if(busy&&!state.playing&&startingFromCanvas){if(pendingTouches.length<45)pendingTouches.push([x,y,color,impulse,expression,when,fixedColor]);return;}color=fixedColor?color:nextDropColor();const d={id:++dropSerial,x:Math.max(.04,Math.min(.96,x)),y:Math.max(.08,Math.min(.92,y)),color,expression,progress:0,duration:expression?.kind==='flick'?.23:.45+Math.random()*.15,impulse:impulse||[Math.random()*14-7,13+Math.random()*12]};
 const clock=dropClock();if(when!==null)clock.now=when;prepareDrop(d,clock);drops.push(d);if(drops.length>45)drops.shift().cancel?.abort();
}
function impact(d){visualImpact(d);const c=colors[d.color];if(d.replay){ripples.push({x:d.x,y:d.y,color:c.hex,t:0});return;}const size=(.018+Number($('dropSize').value)/100*.06)*(d.expression?.ink||1),force=d.expression?.force||1;sim.splat(d.x,d.y,c.rgb,size,d.impulse[0]*force,d.impulse[1]*force);ripples.push({x:d.x,y:d.y,color:c.hex,t:0});if(!d.audioScheduled)glows.push({x:d.x,y:d.y,color:c.hex,t:0});if(ripples.length>30)ripples.shift();if(glows.length>20)glows.shift();if(state.playing&&d.audioScheduled){showNote(noteName(d.pitch),instruments[d.voice].name);}}
$('clear').onclick=()=>{fluidListen.reset(audio.ctx?.currentTime??0);visibleSound.clear();sim.clear();for(const d of drops)d.cancel?.abort();drops=[];ripples=[];glows=[];performanceUI.reset();arpUI.clearVisuals();};
$('bloom').onclick=()=>{for(let i=0;i<8;i++){const a=i/8*Math.PI*2;drop(.5+Math.cos(a)*.17,.5+Math.sin(a)*.17);}$('intro').classList.add('faded');};
function endPresentationTransition(){outgoingVisual?.canvas.remove();outgoingVisual=null;}
function beginPresentationTransition(start,duration){
 endPresentationTransition();
 const old=new Fluid(sim.w,sim.h);resampleFluidState(sim,old);old.swirl=sim.swirl;old.persistence=sim.persistence;
 const surface=document.createElement('canvas');surface.className='presentation-outgoing';surface.setAttribute('aria-hidden','true');stage.append(surface);
 const raster=document.createElement('canvas');raster.width=old.w;raster.height=old.h;const context=raster.getContext('2d');
 const particles=document.createElement('canvas');particles.width=overlay.width;particles.height=overlay.height;particles.getContext('2d').drawImage(overlay,0,0);
 const mood=Object.assign(new ChordAtmosphere(),structuredClone({...atmosphere}));
 outgoingVisual={canvas:surface,ctx:surface.getContext('2d'),sim:old,raster,context,pixels:context.createImageData(old.w,old.h),particles,mood,start,duration,
  colorize:colorizeFluid,luminance:performanceUI.luminance,water:new WaterSurface(),reduced:!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  settings:{enabled:$('waterEnabled').checked,swell:Number($('waterSwell').value),speed:Number($('waterSpeed').value),refraction:Number($('waterRefraction').value),caustics:Number($('waterCaustics').value),reflection:Number($('waterReflection').value)}};
}
function drawPresentationTransition(dt,t){
 const old=outgoingVisual;if(!old)return;const progress=Math.max(0,Math.min(1,(audio.ctx.currentTime-old.start)/old.duration));
 if(progress>=1){endPresentationTransition();return;}
 if(old.canvas.width!==canvas.width||old.canvas.height!==canvas.height){old.canvas.width=canvas.width;old.canvas.height=canvas.height;}
 if(old.sim.w!==sim.w||old.sim.h!==sim.h){old.sim.resize(sim.w,sim.h);old.raster.width=sim.w;old.raster.height=sim.h;old.pixels=old.context.createImageData(sim.w,sim.h);}
 if(!old.reduced){old.sim.step(dt);old.mood.time+=dt;}
 renderFluidPixels(old.sim,old.pixels.data,t,old.colorize,{luminance:old.luminance*old.mood.light.brightness});
 old.water.render(old.pixels.data,old.sim.w,old.sim.h,t,{...old.settings,flow:old.sim});old.context.putImageData(old.pixels,0,0);
 const c=old.ctx;c.setTransform(old.canvas.width/width,0,0,old.canvas.height/height,0,0);c.globalAlpha=1;c.drawImage(old.raster,0,0,width,height);old.mood.draw(c,width,height);c.fillStyle=vignette;c.fillRect(0,0,width,height);
 c.globalAlpha=1-progress;c.drawImage(old.particles,0,0,width,height);c.globalAlpha=1;old.canvas.style.opacity=String(1-progress*progress*(3-2*progress));
}
function drawFluid(t){
 const light=atmosphere.light,water={enabled:$('waterEnabled').checked,swell:Number($('waterSwell').value),speed:atmosphere.reducedMotion?0:Number($('waterSpeed').value),refraction:Number($('waterRefraction').value),caustics:Number($('waterCaustics').value),reflection:Number($('waterReflection').value)};
 const gpu=gpuRenderer.render(sim,t,{palette:paletteKey,luminance:performanceUI.luminance*light.brightness,energy:visibleSound.energy,reverb:audio.reverb,lightPosition:atmosphere.current?[atmosphere.center.x,atmosphere.center.y]:[.5,.48],water});
 if(!gpu){renderFluidPixels(sim,pixels.data,t,colorizeFluid,{luminance:performanceUI.luminance*light.brightness});waterSurface.render(pixels.data,sim.w,sim.h,t,{...water,enabled:water.enabled&&visibleSound.energy>0,swell:water.swell*visibleSound.energy,refraction:water.refraction*visibleSound.energy,caustics:water.caustics*visibleSound.energy,reflection:water.reflection*visibleSound.energy,flow:sim});inkCtx.putImageData(pixels,0,0);}
 ctx.fillStyle='#070b11';ctx.fillRect(0,0,width,height);ctx.drawImage(gpu?gpuRenderer.canvas:ink,0,0,width,height);ctx.save();ctx.globalAlpha=visibleSound.energyScale('opacity');atmosphere.draw(ctx,width,height);ctx.restore();ctx.fillStyle=`rgba(0,0,0,${(1-visibleSound.energy)*.72})`;ctx.fillRect(0,0,width,height);ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);
}
function drawOverlay(dt,t){const clock=drops.length?dropClock():null;fx.clearRect(0,0,width,height);overlay.style.opacity=String(visibleSound.energy);fx.globalAlpha=visibleSound.energyScale('opacity');for(let i=drops.length-1;i>=0;i--){const d=drops[i];if(d.landing<=clock.now&&(document.hidden||clock.now-d.landing>.16)){drops.splice(i,1);continue;}if(clock.now<d.start)continue;prepareDrop(d,clock);const progress=d.progress=d.progress>=1?1:Math.max(d.progress,d.startProgress+(1-d.startProgress)*Math.max(0,Math.min(1,(clock.now-d.start)/(d.landing-d.start)))),x=d.x*width,y=d.y*height-(1-progress*progress)*105,c=colors[d.color].hex;const halo=fx.createRadialGradient(x,y,0,x,y,19);halo.addColorStop(0,c+'85');halo.addColorStop(.2,c+'40');halo.addColorStop(1,c+'00');fx.fillStyle=halo;fx.beginPath();fx.arc(x,y,19,0,Math.PI*2);fx.fill();fx.strokeStyle=c+'50';fx.lineWidth=1.2;fx.beginPath();fx.moveTo(x,y-12);fx.lineTo(x,y-2);fx.stroke();fx.fillStyle=c;fx.beginPath();fx.ellipse(x,y,2.3,3.5,0,0,Math.PI*2);fx.fill();fx.fillStyle='#fff9';fx.beginPath();fx.arc(x-.5,y-1,1,0,Math.PI*2);fx.fill();if(progress>=1){impact(d);drops.splice(i,1);}}
 fx.globalCompositeOperation='screen';for(let i=glows.length-1;i>=0;i--){const g=glows[i];g.t+=dt;const r=18+g.t*36,alpha=Math.max(0,1-g.t/1.7)*.15;fx.globalAlpha=alpha*visibleSound.energyScale('opacity');const halo=fx.createRadialGradient(g.x*width,g.y*height,0,g.x*width,g.y*height,r);halo.addColorStop(0,g.color);halo.addColorStop(1,g.color+'00');fx.fillStyle=halo;fx.fillRect(g.x*width-r,g.y*height-r,r*2,r*2);if(g.t>1.7)glows.splice(i,1);}fx.globalAlpha=1;fx.globalCompositeOperation='source-over';for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.t+=dt;const opacity=Math.max(0,1-r.t/2.1)*.30;fx.strokeStyle=r.color;fx.globalAlpha=opacity*visibleSound.energyScale('opacity');fx.lineWidth=.65;fx.beginPath();fx.ellipse(r.x*width,r.y*height,5+r.t*39,2+r.t*15,0,0,Math.PI*2);fx.stroke();if(r.t>2.1)ripples.splice(i,1);}fx.globalAlpha=1;}
let displayedChord=-1;
function serviceFluidFeedback(){const now=audio.ctx?.currentTime??0,region=fluidListen.update(now,sim,{enabled:$('fluidListens').checked&&state.playing,hidden:document.hidden,replaying:!!recorder?.replaying,painting:performanceUI.painting,count:arpUI.count});if(!region)return;const note=shimmerNote(parseChord(activeChords()[chordAt(now)]),region);audio.note(effectiveVoices()[0],note.pitch,note.expression,{...note.options,when:now+.025}).catch(loadFail);}
function tick(now){if(document.hidden){lastFrame=now;requestAnimationFrame(tick);return;}presentControls.frame();if(listeningHintUntil&&now>=listeningHintUntil){listeningHintUntil=0;hideListeningHint();}const dt=Math.min(.033,(now-lastFrame)/1000||.016);lastFrame=now;recorder?.frame();const t=now/1000;if(displayedChord!==state.chordIndex){displayedChord=state.chordIndex;renderChords();updateTransport();}if(state.playing){const length=Number($('chordLength').value)*60/state.bpm,line=$('chords').querySelector('.active .progress');if(line)line.style.width=(state.elapsed%length/length*100)+'%';}else{rainTimer+=dt;if(!audio.ctx&&!recorder?.blocked&&rainTimer>5){rainTimer=0;const a=t*.08;sim.splat(.5+Math.sin(a)*.18,.5+Math.cos(a)*.12,colors[0].rgb,.022,Math.cos(a)*3,Math.sin(a)*3);}const interval=(4.5-Number($('rain').value)/100*3.9)*1.8;if(!recorder?.blocked&&$('autoPour').checked&&rainTimer>interval){rainTimer=0;drop(.16+Math.random()*.71,.25+Math.random()*.53);}}atmosphere.frame(dt,{chord:activeChords()[state.chordIndex],index:state.chordIndex,playing:state.playing||!!recorder?.replaying,amount:Number($('chordAtmosphere').value),palette:paletteKey});if(!recorder?.blocked||recorder?.renderingDrift)atmosphere.stir(sim,dt);performanceUI.frame(dt,now);rhythmUI.frame();arpUI.frame();if(!recorder?.arming){sim.step(dt);serviceFluidFeedback();}visibleSound.mobile=width<=720;visibleSound.update(dt,audio.ctx?.currentTime??t,sim,colorizeFluid,Math.min(1,audio.reverb*.9+audio.performance.space));drawFluid(t);drawOverlay(dt,t);fx.save();fx.globalAlpha=visibleSound.energyScale('opacity');rhythmUI.draw(fx,width,height);arpUI.draw(fx,width,height);performanceUI.draw(fx,width,height,now);fx.restore();visibleSound.draw(fx,width,height,audio.ctx?.currentTime??t,atmosphere.current?.color||[.5,.5,.7]);if(document.body.classList.contains('zen'))performerTrail.draw(fx,width,height,t,visibleSound.energy);drawPresentationTransition(dt,t);frameCount++;requestAnimationFrame(tick);}
const performerTrail=new PerformerTrail({reducedMotion:atmosphere.reducedMotion});
const presentControls=createPresentControls({strip:$('presentStrip'),trigger:$('zenControlsToggle'),hint:$('zenControlsHint'),active:()=>document.body.classList.contains('zen'),exit:()=>toggleZen(false),trail:performerTrail});
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();presentControls.move((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);});
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||state.playing||busy||recorder?.blocked)return;togglePlay({canvasStart:true});},true);
$('presentPlay').onclick=()=>togglePlay();$('presentExit').onclick=()=>toggleZen(false);
const performanceUI=createPerformanceController({canvas,stage,audio,sim,drop,nextColor:()=>state.selected,touchColor:nextDropColor,getColor:(color)=>colors[color??state.selected],readOnly:()=>!!recorder?.blocked&&!recorder?.renderingDrift,onChange:()=>recorder?.stateChanged(),onGesture:m=>recorder?.capture('gesture',{...m,performance:{...audio.performance}}),onFirstTouch:()=>{$('intro').classList.add('faded');},openGuide:()=>{if(mobileLayout.matches)setMobileControls(true);else if(document.body.classList.contains('panel-hidden'))togglePanel();switchTab('perform');$('gestureGuide').open=true;$('gestureGuide').querySelector('summary').focus();$('gestureGuide').scrollIntoView?.({block:'nearest'});}});
const rhythmUI=createRhythmController({audio,togglePlay,onFlare:hit=>visibleSound.flare(hit),onChange:()=>recorder?.stateChanged(),getChordAt:when=>activeChords()[Math.floor(Math.max(0,when-clockOrigin)/(Number($('chordLength').value)*60/state.bpm))%4],getPosition:()=>Math.max(0,state.playing?audio.ctx.currentTime-clockOrigin:state.elapsed)*state.bpm/60,onHit:hit=>{recorder?.capture('percussion',hit,hit.time);stirPercussion(sim,hit);}});
const arpUI=createArpeggiatorController({audio,getFluid:index=>$('fluidListens').checked&&!recorder?.replaying?fluidListen.arp(index,$('quantizeEnabled').checked):null,onImpact:event=>visualImpact({...event,color:(event.index||0)%4},'arp'),getColors:()=>colors.map(c=>c.hex),onNote:event=>{recorder?.capture('arpeggio',event,event.time);},onChange:()=>recorder?.stateChanged(),getClock:()=>({origin:rhythmUI.timingOrigin??clockOrigin,chordOrigin:clockOrigin,bpm:state.bpm,rate:audio.rhythmRate,chordBeats:Number($('chordLength').value),chords:activeChords()}),getChord:()=>activeChords()[state.playing?chordAt(audio.ctx.currentTime):state.chordIndex]});
const environmentUI=createEnvironmentController({audio,getOrigin:()=>clockOrigin,onChange:()=>recorder?.stateChanged(),readOnly:()=>!!recorder?.blocked});
const workspaceUI=createWorkspaceController({switchTab});
driftUI=createDriftController({audio,performanceUI,energy:()=>visibleSound.energy,automaticDrops:()=>$('autoPour').checked,playing:()=>state.playing,blocked:()=>!!recorder?.blocked&&!recorder?.renderingDrift||!!recorder?.arming,pause:togglePlay,getProgression:()=>state.driftProgression||state.progression,progressions,parseChord,setHarmony:key=>{if(state.driftProgression===key)return;state.driftProgression=key;renderChords();},phrase:()=>Math.floor(Math.max(0,audio.ctx.currentTime-clockOrigin)/(Number($('chordLength').value)*60/state.bpm*4))});
continuity=createBackgroundContinuity({playing:()=>state.playing||!!recorder?.replaying,zen:()=>document.body.classList.contains('zen'),title:()=>$('soundscape').selectedOptions[0].textContent,togglePlay,visibility:()=>{lastFrame=performance.now();if(document.hidden){visibleSound.clear();ripples=[];glows=[];}serviceMusic();rhythmUI.backgroundChanged();arpUI.backgroundChanged();}});
sliders();syncAudio();$('bpmLabel').textContent=state.bpm;$('customChords').hidden=state.progression!=='custom';$('scapeDescription').textContent=soundscapes[$('soundscape').value]?.text||'Four colors. Four voices. Entirely your own.';document.querySelector('.autopour').classList.toggle('off',!$('autoPour').checked);sim.swirl=Number($('swirl').value)/100;sim.persistence=Number($('persistence').value)/100;renderChords();updateTransport();applyPalette();syncColorMode();resize();seed();requestAnimationFrame(tick);

function snapshotPerformance(){return {main:{settings:Object.fromEntries(persisted.map(id=>[id,id==='progression'?(state.driftProgression||state.progression):$(id).type==='checkbox'?$(id).checked:$(id).value])),voices:[...effectiveVoices()],custom:[...state.custom],bpm:state.bpm,selected:state.selected},rhythm:rhythmUI.getState(),arp:arpUI.getState(),environment:environmentUI.getState(),expression:performanceUI.getState(),position:state.playing?Math.max(0,audio.ctx.currentTime-clockOrigin):state.elapsed,chordIndex:state.chordIndex,performance:{...audio.performance}};}
function snapshotScene(){return {w:sim.w,h:sim.h,...Object.fromEntries(['u','v','r','g','b'].map(key=>[key,Array.from(sim[key])]))};}
function restoreScene(scene){fluidListen.reset(audio.ctx?.currentTime??0);visibleSound.clear(audio.ctx?.currentTime??Infinity);sim.clear();resampleFluidState(scene,sim);drops=[];ripples=[];glows=[];if(!audio.ctx&&!scene.r.some(v=>v>0))seed();}
function stopLive(){driftUI?.suspend();state.playing=false;rhythmUI.stop();arpUI.stop();environmentUI.stop();audio.setPlaying(false);if(dropTimer!==null)globalThis.clearInterval(dropTimer);dropTimer=null;for(const d of drops)d.cancel?.abort();drops=[];performanceUI.reset();updateTransport();}
function applySnapshot(raw,persistSettings=false){state.driftProgression=null;const s=sanitizeSnapshot(raw);Object.assign(state,{voices:s.main.voices,custom:s.main.custom,bpm:s.main.bpm,selected:s.main.selected,progression:s.main.settings.progression,elapsed:s.position,chordIndex:s.chordIndex});for(const [id,value] of Object.entries(s.main.settings)){$(id).type==='checkbox'?$(id).checked=value:$(id).value=String(value);}if(persistSettings||JSON.stringify(s.rhythm)!==JSON.stringify(rhythmUI.getState()))rhythmUI.restore(s.rhythm,persistSettings);if(persistSettings||JSON.stringify(s.arp)!==JSON.stringify(arpUI.getState()))arpUI.restore(s.arp,persistSettings);if(persistSettings||JSON.stringify(s.expression)!==JSON.stringify(performanceUI.getState()))performanceUI.restore(s.expression,persistSettings);$('chordInput').value=state.custom.join(', ');$('customChords').hidden=state.progression!=='custom';$('bpmLabel').textContent=state.bpm;$('scapeDescription').textContent=soundscapes[$('soundscape').value]?.text||'Four colors. Four voices. Entirely your own.';state.voices.forEach((v,i)=>$('voice'+i).value=v);clockOrigin=(audio.ctx?.currentTime||0)-s.position;if(persistSettings||JSON.stringify(s.environment)!==JSON.stringify(environmentUI.getState()))environmentUI.restore(s.environment,persistSettings);audio.setPerformance(s.performance);applyPalette();syncEnergy();sliders();syncWater();syncAudio();syncQuantize();syncColorMode();sim.swirl=Number($('swirl').value)/100;sim.persistence=Number($('persistence').value)/100;document.querySelector('.autopour').classList.toggle('off',!$('autoPour').checked);renderChords();updateTransport();if(persistSettings)save();}
function titleCard(title,subtitle,{frame}={}){writeInDye(sim,title,{color:state.selected,y:subtitle?.length ? .42 : .48,frame});if(subtitle)writeInDye(sim,subtitle,{color:state.selected,y:.67,size:.085,frame});$('intro').classList.add('faded');}
$('writeTitle').onclick=()=>{try{if(recorder?.blocked)return;const data=normalizeDyeTitle({text:$('presentTitle').value,color:state.selected});writeInDye(sim,data.text,{color:data.color});recorder?.capture('title',data);$('titleStatus').textContent='Title written in dye.';}catch(e){$('titleStatus').textContent=e.message;}};
recorder=createRecorderController({titleCard,exportLayers:()=>[canvas,overlay],get workspace(){return sessionWorkspace;},audio,snapshot:snapshotPerformance,scene:snapshotScene,validate:sanitizeTake,applySnapshot,restoreScene,stopLive,
 async prepareLive(){if(state.playing)stopLive();await audio.initialize();await Promise.all([...effectiveVoices(),...(arpUI.requiredVoice?[arpUI.requiredVoice]:[])].map(key=>audio.load(key)));environmentUI.prepare();},
 beginLive(start){state.elapsed=0;state.chordIndex=0;clockOrigin=start;performanceUI.reset();state.playing=true;audio.setPlaying(true);audio.recordingEnd=null;rhythmUI.start(start);arpUI.start();environmentUI.start(start);rainTimer=0;rainClock.reset();syncDropScheduler();renderChords();updateTransport();$('intro').classList.add('faded');},
 trimFuture(end){arpUI.trim(end);rhythmUI.trim(end);for(const d of drops)if(d.audioScheduled&&d.audioTime>=end)d.cancel?.abort();},
 freezeLive(end){rhythmUI.freeze(end);arpUI.freeze(end);environmentUI.stop();if(dropTimer!==null)globalThis.clearInterval(dropTimer);dropTimer=null;for(const d of drops)d.cancel?.abort();drops=[];},
 beginDriftRender(start,end){this.beginLive(start);audio.recordingEnd=end;driftUI.render(true);},endDriftRender(){driftUI.render(false);if(state.playing)stopLive();},
 beginTransition:beginPresentationTransition,endTransition:endPresentationTransition,
 exitPlayback(){endPresentationTransition();audio.replaying=false;performanceUI.reset();updateTransport();},playbackStarted(){audio.replaying=true;updateTransport();},
 applyEvent(event,at){const d=event.data;if(event.kind==='settings')applySnapshot(d);if(event.kind==='title')writeInDye(sim,d.text,{color:d.color});if(event.kind==='fluid')sim[d.op](...d.args);if(event.kind==='drop'){let drop=drops.find(p=>p.replay&&p.id===d.id);if(!drop){drop={id:d.id,x:d.x,y:d.y,color:d.color,replay:true};drops.push(drop);}Object.assign(drop,{start:at,startProgress:d.progress,progress:d.progress,landing:at+d.flight});}if(event.kind==='gesture')performanceUI.replayGesture(d);if(event.kind==='arpeggio')arpUI.replayNote({...d,time:at});if(event.kind==='percussion'){visibleSound.flare(d);stirPercussion(sim,d);rhythmUI.replayHit({...d,time:at});}}
});
for(const op of ['splat','force','pulse','clear']){const original=sim[op].bind(sim);sim[op]=(...args)=>{recorder.capture('fluid',{op,args});return original(...args);};}

for(const type of ['input','change'])document.addEventListener(type,e=>{if(e.target.closest?.('#recordDialog')||e.target.closest?.('#communityDialog'))return;recorder.stateChanged();});

audio.onSessionEvent=(...args)=>recorder.captureSound(...args);
const presentation=createPresentationController(recorder);
const community=createCommunityController(recorder,{presentation});
sessionWorkspace=createSessionWorkspace({recorder,community,bridge:{snapshot:snapshotPerformance,scene:snapshotScene,applySnapshot,restoreScene,stopLive,togglePlay,validateTake:sanitizeTake,validateScene(scene){if(!scene||!Number.isInteger(scene.w)||!Number.isInteger(scene.h)||scene.w<1||scene.h<1||scene.w*scene.h>1000000||['u','v','r','g','b'].some(k=>!Array.isArray(scene[k])||scene[k].length!==scene.w*scene.h||scene[k].some(v=>!Number.isFinite(v))))throw new Error('Invalid session canvas.');}}});
community.setWorkspace(sessionWorkspace);
sessionWorkspace.init();
