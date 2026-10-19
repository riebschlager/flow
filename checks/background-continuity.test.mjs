import assert from 'node:assert/strict';
import {RainClock,schedulingLookahead,createBackgroundContinuity} from '../public/background-continuity.js';
const events={};let playing=false,zen=false,requests=0,releases=0,actions={},fail=false,resolve;
const doc={hidden:false,baseURI:'https://flow.example/',addEventListener:(type,fn)=>events[type]=fn};
const nav={wakeLock:{request:async kind=>{assert.equal(kind,'screen');requests++;if(fail)throw Error('denied');return {release:async()=>{releases++;},addEventListener(){}};}},mediaSession:{setActionHandler:(kind,fn)=>actions[kind]=fn}};
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
const background=createBackgroundContinuity({playing:()=>playing,zen:()=>zen,title:()=>'Still water',togglePlay:()=>{playing=!playing;background.sync();},doc,nav,Metadata:class{constructor(data){Object.assign(this,data);}}});
background.sync();assert.equal(requests,0);assert.equal(nav.mediaSession.playbackState,'paused');assert.equal(nav.mediaSession.metadata.title,'Still water');assert.equal(nav.mediaSession.metadata.artist,'Flow');assert.equal(nav.mediaSession.metadata.artwork[0].src,'https://flow.example/icon.svg');
actions.play();await flush();assert(playing);actions.play();assert(playing);assert.equal(nav.mediaSession.playbackState,'playing');
zen=true;background.sync();await flush();assert.equal(requests,1);background.sync();await flush();assert.equal(requests,1);
doc.hidden=true;events.visibilitychange();await flush();assert.equal(releases,1);doc.hidden=false;events.visibilitychange();await flush();assert.equal(requests,2);
zen=false;background.sync();await flush();assert.equal(releases,2);zen=true;background.sync();await flush();actions.pause();await flush();assert(!playing);assert.equal(releases,3);
playing=true;fail=true;background.sync();await flush();assert.equal(requests,4);background.sync();await flush();assert.equal(requests,5);
// A lock granted after hiding must immediately release, including a visible-again race.
fail=false;nav.wakeLock.request=()=>{requests++;return new Promise(r=>resolve=r);};background.sync();doc.hidden=true;events.visibilitychange();doc.hidden=false;events.visibilitychange();resolve({release:async()=>{releases++;}});await flush();assert.equal(releases,4);assert.equal(requests,7);
resolve({release:async()=>{releases++;}});await flush();playing=false;background.sync();await flush();assert.equal(releases,5);
createBackgroundContinuity({playing:()=>false,zen:()=>false,title:()=>'',togglePlay(){},doc,nav:{}}).sync();
const old=globalThis.document;globalThis.document=doc;assert.equal(schedulingLookahead(),.12);doc.hidden=true;assert.equal(schedulingLookahead(),1.25);
const rain=new RainClock(),times=[];for(let now=0;now<600;now++)rain.service(now,{enabled:true,interval:.6,key:1,emit:t=>times.push(t)});
assert(times.length>=999);for(let i=1;i<times.length;i++)assert(Math.abs(times[i]-times[i-1]-.6)<1e-7);
const before=times.length;rain.service(900,{enabled:true,interval:.6,key:1,emit:t=>times.push(t)});assert(times.length-before<=2);assert(times.slice(before).every(t=>t>=900));
rain.service(901,{enabled:false,interval:.6,key:1,emit:()=>assert.fail()});assert.equal(rain.next,null);globalThis.document=old;
console.log('PASS: audio-clock rain, bounded stall recovery, visibility lookahead, Wake Lock lifecycle/races/denial/absence, Media Session metadata and idempotent transport.');
// Compare dense/swinging hidden schedules against the same engines serviced every 25ms.
const {RhythmEngine,defaultRhythm}=await import('../public/rhythm.js?rev=fluid-feedback-82');
const {ArpEngine,normalizeArp}=await import('../public/arpeggiator.js?rev=fluid-feedback-82');
function scheduled(hidden,delta){
 globalThis.document={hidden};const hits=[],notes=[],ctx={currentTime:0,createGain:()=>({gain:{setTargetAtTime(){}},connect(){}})},audio={ctx,bpm:100,playing:true,bus:{},note:async()=>null};
 const cfg=defaultRhythm();cfg.enabled=true;cfg.rate=2;cfg.swing=65;cfg.humanize=0;cfg.lanes.forEach(l=>{l.steps=Array(16).fill(1);});
 const rhythm=new RhythmEngine(audio,()=>cfg,e=>{if(e.type==='step')hits.push(e.time);},{setTimer:()=>1,clearTimer(){}});rhythm.synth={connect(){},setLevel(){},setEffects(){},stop(){},hit(){}};
 const arp=new ArpEngine(audio,()=>normalizeArp({enabled:true,beats:.125}),()=>({origin:.04,chordOrigin:0,bpm:100,rate:2,chordBeats:4,chords:['Cmaj7','Am7']}),e=>{if(e.type==='note')notes.push({time:e.time,pitch:e.pitch});},{setTimer:()=>1,clearTimer(){}});
 rhythm.start(0,.04);arp.start();for(let i=1;i<=Math.round(60/delta);i++){ctx.currentTime=i*delta;rhythm.tick();arp.tick();}rhythm.stop();arp.stop();
 return {hits:hits.filter(t=>t<60),notes:notes.filter(n=>n.time<60)};
}
assert.deepEqual(scheduled(true,1),scheduled(false,.025));globalThis.document=old;
console.log('PASS: densest arpeggio and swinging double-speed percussion retain every onset and chord pitch with 1s hidden callbacks.');
