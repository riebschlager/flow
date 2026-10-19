import assert from 'node:assert/strict';
import {VisibleSound,normalizeEnergy,envelopeCurve,envelopeLevel,sampleFlow} from '../public/visible-sound.js';
import {sanitizeSnapshot} from '../public/recording-state.js';
const curve=envelopeCurve({ahdsr:[{duration:0,volume:0},{duration:1,volume:1},{duration:2,volume:.6},{duration:1,volume:0}]},4,4.05);
for(const [t,want] of [[-.1,0],[0,0],[.5,.5],[1,1],[2,.8],[3,.6],[3.5,.3],[4,0],[5,0]])assert(Math.abs(envelopeLevel(curve,t)-want)<1e-9);
assert.equal(envelopeLevel(envelopeCurve({},2,2.05),1),1);
assert.equal(envelopeCurve({},3,.55).at(-1).time,.55);
assert.equal(envelopeLevel(envelopeCurve({ahdsr:[]},2,2.05),.25),1);
for(const [raw,want] of [[undefined,60],[null,60],['garbage',60],[-1,0],[200,100],['0',0]])assert.equal(normalizeEnergy(raw),want);
const sim={w:20,h:10};for(const [k,value] of Object.entries({u:2,v:1,r:.5,g:.3,b:.2}))sim[k]=new Float32Array(200).fill(value);
const scratch=new Float64Array(5);sampleFlow(sim,.47,.36,scratch);assert.equal(scratch[0],2);assert.equal(scratch[1],1);
const effect=new VisibleSound({energy:100,random:()=>.4});effect.motes[0].age=2;const colorize=(r,g,b,l,gx,out)=>{out[0]=120;out[1]=60;out[2]=180;};effect.update(.1,0,sim,colorize);assert(Math.abs(effect.motes[0].x-.41)<1e-9);assert(Math.abs(effect.motes[0].y-.41)<1e-9);
assert.equal(effect.motes.length,600);effect.motes[0].x=1.1;effect.update(.01,.01,sim,colorize);assert.equal(effect.motes[0].x,.4);assert.equal(effect.motes[0].age,0);
effect.flare({x:.4,y:.4,velocity:1});assert(effect.motes[0].flare>0);
const audio={delay:1,echo:.5,spacing:.8,feedback:.36,gestureFeedback:.42};
function impact(fx,at){fx.note({at,curve,bus:'voices',level:1});fx.impact({x:.4,y:.5,color:'#abcdef',at},audio);}
impact(effect,10);const repeats=effect.echoes.map(e=>({...e}));assert.equal(repeats[0].at,10.8);assert(Math.abs(repeats[0].gain-.7*.36)<1e-9);
audio.spacing=.4;impact(effect,12);assert.equal(effect.echoes[repeats.length].at,12.4);assert.equal(effect.echoes[0].at,10.8);
const replay=new VisibleSound();audio.spacing=.8;impact(replay,10);assert.deepEqual(replay.echoes,repeats);assert.deepEqual(replay.halos[0].curve,effect.halos[0].curve);
for(let i=0;i<100;i++)impact(effect,20+i);assert.equal(effect.halos.length,48);assert(effect.echoes.length<=384);
const reduced=new VisibleSound({energy:100,reducedMotion:true,random:()=>.4});impact(reduced,0);reduced.update(.1,.1,sim,colorize);assert.equal(reduced.motes[0].x,.4);assert.equal(reduced.halos[0].x,.4);
effect.setEnergy(0);for(let i=0;i<30;i++)effect.update(.01,121+i*.01,sim,colorize);assert.equal(effect.energy,0);assert.equal(effect.energyScale('opacity'),0);assert.equal(effect.energyScale('count'),0);
let calls=0;effect.draw(new Proxy({},{get:()=>()=>calls++}),100,100,0,[1,1,1]);assert.equal(calls,0);
const raw={main:{voices:['piano','vibes','strings','celesta'],custom:['C','Am','F','G'],settings:{}}};assert.equal(sanitizeSnapshot(raw).main.settings.energy,60);raw.main.settings.energy='bad';assert.equal(sanitizeSnapshot(raw).main.settings.energy,60);raw.main.settings.energy=0;assert.equal(sanitizeSnapshot(raw).main.settings.energy,0);
console.log('PASS: scheduled envelope curves, normalized and legacy energy, bilinear advection, respawn and bounds, percussion flare, delay timing across tempo edits, live/replay derivation and reduced motion.');
// Compare the visual curve against gain automation emitted by the real vendored synth.
const {default:fs}=await import('node:fs'),{default:vm}=await import('node:vm');const sandbox={console};vm.runInNewContext(fs.readFileSync(new URL('../public/vendor/WebAudioFontPlayer.js',import.meta.url),'utf8'),sandbox);const engine=new sandbox.WebAudioFontPlayer();
for(const zone of [{},{ahdsr:[]},{ahdsr:[{duration:0,volume:0},{duration:.7,volume:1},{duration:2,volume:.6},{duration:1,volume:0}]}])for(const [duration,sample] of [[4,4.05],[2,1.05]]){
 const ramps=[],gain={setValueAtTime(volume,time){if(time>=10)ramps.push({time:time-10,volume});},cancelScheduledValues(){},linearRampToValueAtTime(volume,time){ramps.push({time:time-10,volume});}};engine.setupEnvelope({currentTime:0},{gain},zone,1,10,sample,duration);const visual=envelopeCurve(zone,duration,sample);for(let t=0;t<Math.min(duration,sample-.05);t+=.01)assert(Math.abs(envelopeLevel(visual,t)-envelopeLevel(ramps,t))<.00001);
}
console.log('PASS: visual amplitude matches actual WebAudioFont gain automation for default, sampled and custom envelopes, including sample truncation.');
const {sessionFixture}=await import('./session-fixture.mjs'),{canonicalMetadata}=await import('../lib/community-validation.mjs');const take=sessionFixture();take.snapshot.main.settings.energy=23;take.events.push({t:.1,kind:'settings',data:structuredClone(take.snapshot)});take.events.at(-1).data.main.settings.energy=0;take.events.sort((a,b)=>a.t-b.t);const shared=canonicalMetadata(take,'Visible sound','test',Date.now());assert.equal(shared.snapshot.main.settings.energy,23);assert.equal(shared.events.find(e=>e.kind==='settings'&&e.t===.1).data.main.settings.energy,0);assert(!shared.events.some(e=>['halo','echo','mote'].includes(e.kind)));
console.log('PASS: Community canonicalization retains energy snapshots and timed settings, with no derived visual events.');
