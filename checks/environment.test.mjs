import assert from 'node:assert/strict';
import {environmentDefaults,environmentPresets,normalizeEnvironment,synthesizeEnvironment,EnvironmentSynth,ENVIRONMENT_SECONDS} from '../public/environment.js';
import {createEnvironmentController} from '../public/environment-ui.js';
import {sessionFixture} from './session-fixture.mjs';
import {sanitizeTake,sanitizeSnapshot} from '../public/recording-state.js';
import {encodePerformance,decodePerformance,forkSession} from '../public/recorder-core.js';

assert.deepEqual(normalizeEnvironment(),environmentDefaults);assert.deepEqual(normalizeEnvironment(null),environmentDefaults);
assert.deepEqual(normalizeEnvironment({enabled:'true',preset:'__proto__',volume:900,activity:-1,tone:'bad',audio:'discard'}),{enabled:false,preset:'rain',volume:100,activity:0,tone:50});
const rms=a=>Math.sqrt(a.reduce((n,v)=>n+v*v,0)/a.length),fingerprints=new Set();
for(const preset of Object.keys(environmentPresets)){
 const a=synthesizeEnvironment(preset),b=synthesizeEnvironment(preset);assert.equal(a.seconds,12);
 for(const key of ['base','detail'])for(let ch=0;ch<2;ch++){
  const samples=a[key][ch];assert.deepEqual(samples,b[key][ch]);assert.equal(samples.length,12*16000);
  assert(samples.every(Number.isFinite));assert(samples.every(v=>Math.abs(v)<=1));assert(rms(samples)>.05&&rms(samples)<.2);assert.equal(samples[0],samples.at(-1));
 }
 const left=a.base[0],right=a.base[1];let cross=0;for(let i=0;i<left.length;i++)cross+=left[i]*right[i];assert(Math.abs(cross/left.length/(rms(left)*rms(right)))<.15,'stereo beds are decorrelated');
 fingerprints.add(left.slice(100,110).join(','));
}
assert.equal(fingerprints.size,5);

function fixture(){
 const nodes=[],sources=[];let now=0;
 const parameter=()=>({value:0,events:[],setTargetAtTime(value,at,smooth){this.events.push({kind:'target',value,at,smooth});},setValueAtTime(value,at){this.events.push({kind:'set',value,at});},linearRampToValueAtTime(value,at){this.events.push({kind:'ramp',value,at});},cancelScheduledValues(at){this.events.push({kind:'cancel',at});}});
 const node=()=>{const n={gain:parameter(),frequency:parameter(),Q:parameter(),targets:[],connect(target){this.targets.push(target);},disconnect(){this.disconnected=true;}};nodes.push(n);return n;};
 const audio={ctx:{sampleRate:48000,get currentTime(){return now;},createGain:node,createBiquadFilter:node,createBuffer:(channels,length,sampleRate)=>({channels,length,sampleRate,copyToChannel(){}}),createBufferSource(){const n={...node(),start(at,offset){this.started={at,offset};},stop(at){(this.stops??=[]).push(at);}};sources.push(n);return n;}},sceneInput:{},playing:false};
 return {audio,nodes,sources,setTime:t=>now=t};
}
const f=fixture(),synth=new EnvironmentSynth(f.audio),config={...environmentDefaults,enabled:true};
synth.apply(environmentDefaults);assert.equal(f.nodes.length,0,'disabled legacy sessions allocate no audio nodes');
synth.prepare(config);assert.equal(f.nodes.length,0);assert.equal(synth.cache.size,1);
synth.apply(config,1,{origin:1,restart:true});assert.equal(f.sources.length,2);assert(f.sources.every(s=>s.loop&&s.started.at===1&&s.started.offset===0));assert(synth.output.targets.includes(f.audio.sceneInput));
const initial=synth.current;synth.apply({...config,volume:70,activity:100,tone:100},1.05,{origin:1});assert.equal(f.sources.length,2);assert.equal(synth.details.gain.events.at(-1).value,1);assert.equal(synth.filter.frequency.events.at(-1).value,10000);assert(Math.abs(synth.output.gain.events.at(-1).value-.196)<1e-10);
synth.apply({...config,preset:'night'},1.1,{origin:1});assert.equal(f.sources.length,4);assert(Math.abs(f.sources.at(-1).started.offset-.1)<1e-9);assert(initial.retired);assert(initial.gains[0].gain.events.some(e=>e.kind==='set'&&e.at===1.1&&e.value>0&&e.value<1),'rapid edits fade from the actual partial envelope');
synth.apply({...config,preset:'night'},5,{origin:5,restart:true});assert.equal(f.sources.length,6);assert.equal(f.sources.at(-1).started.offset,0);
synth.apply({...config,volume:0},6);assert.equal(synth.current,null);assert.equal(synth.output.gain.events.at(-1).value,0);
for(let i=0;i<10;i++)synth.apply({...config,preset:i%2?'wind':'rain'},7+i*.01,{origin:1,restart:true});assert(synth.voices.size<=4);assert.equal(synth.cache.size,3);
f.setTime(8);synth.stop();assert.equal(synth.current,null);assert(f.sources.every(s=>s.stops?.length));
synth.apply(config,10,{origin:1});assert.equal(f.sources.at(-1).started.offset,9%ENVIRONMENT_SECONDS);synth.dispose();assert.equal(synth.cache.size,0);for(const s of f.sources)s.onended();assert.equal(synth.output,null);

const ids=['environmentEnabled','environmentPreset','environmentDescription','environmentVolume','environmentVolumeValue','environmentActivity','environmentActivityValue','environmentTone','environmentToneValue','environmentStatus'];
const elements=new Map(ids.map(id=>[id,{value:'',checked:false,style:{setProperty(){}},listeners:{},addEventListener(kind,fn){this.listeners[kind]=fn;}}]));
globalThis.document={getElementById:id=>elements.get(id)};const stored=new Map();globalThis.localStorage={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)};
const uiAudio=fixture().audio;let changes=0,blocked=false;const ui=createEnvironmentController({audio:uiAudio,onChange:()=>changes++,readOnly:()=>blocked});const $=id=>elements.get(id);
assert.equal($('environmentEnabled').checked,false);$('environmentEnabled').checked=true;$('environmentEnabled').listeners.change();assert.match($('environmentStatus').textContent,/Ready/);assert.equal(ui.getState().enabled,true);assert.equal(changes,1);
uiAudio.playing=true;ui.prepare();ui.start(1);assert.match($('environmentStatus').textContent,/Playing/);$('environmentPreset').value='shore';$('environmentPreset').listeners.change();$('environmentActivity').value='83';$('environmentActivity').listeners.input();assert.equal(JSON.parse(stored.get('chromaflow-environment-v1')).activity,83);
blocked=true;uiAudio.replaying=true;ui.restore({...config,preset:'hearth'});assert.match($('environmentStatus').textContent,/Recorded/);assert.equal(ui.getState().preset,'hearth');ui.stop();uiAudio.playing=false;uiAudio.replaying=false;ui.transportChanged();assert.match($('environmentStatus').textContent,/Ready/);

const take=sessionFixture();take.snapshot.environment={...config,preset:'shore',activity:83};const changed=structuredClone(take.snapshot);changed.environment={...config,preset:'night',volume:47};take.events.push({kind:'settings',t:1,data:changed});
const clean=sanitizeTake(take),roundtrip=sanitizeTake(await decodePerformance(encodePerformance(clean)));assert.deepEqual(roundtrip,clean);assert.deepEqual(sanitizeTake(forkSession(clean)).snapshot.environment,clean.snapshot.environment);
const old=structuredClone(take.snapshot);delete old.environment;assert.deepEqual(sanitizeSnapshot(old).environment,environmentDefaults);const dirty=structuredClone(take);dirty.snapshot.environment.audio=[1,2];dirty.events.at(-1).data.environment.source='https://example.invalid/audio';const canonical=sanitizeTake(dirty);assert(!JSON.stringify(canonical).includes('example.invalid'));assert(!('audio' in canonical.snapshot.environment));
console.log('PASS: five deterministic bounded stereo textures, periodic joins, lazy synthesis, scene routing, audio-clock phases, rapid crossfades, detail/tone/mix, bounded sources, cleanup, UI transport/persistence, data-only sessions, forks and legacy defaults.');
