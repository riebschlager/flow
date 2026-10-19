import assert from 'node:assert/strict';
import {PresentationQueue} from '../public/presentation-queue.js';
import {PresentationMixer} from '../public/presentation-mixer.js';

let loads=[],prepared=[],pages=[];
const tracks=['a','b','c'].map(id=>({id}));
const queue=new PresentationQueue({tracks,currentId:'b',page:0,hasMore:true,
 fetchPage:async page=>{pages.push(page);return {page,hasMore:false,tracks:[{id:'c'},{id:'d'}]};},
 load:async t=>{loads.push(t.id);return t;},prepare:async t=>prepared.push(t.id)});
const warmed=queue.warm();assert.equal(queue.warm(),warmed,'only one in-flight preload');
assert.equal((await queue.next()).id,'c');assert.deepEqual(loads,['c']);
assert.equal((await queue.next()).id,'a','wrap the launching chart without repeating current track');
assert.equal((await queue.next()).id,'d');assert.equal(await queue.next(),null);
assert.deepEqual(pages,[1]);assert.deepEqual(prepared,['c','a','d']);
const skip=new PresentationQueue({tracks:[{id:'removed'},{id:'good'}],hasMore:false,
 load:async t=>{if(t.id==='removed')throw Error('404');return t;},prepare:async()=>{}});
assert.equal((await skip.next()).id,'good','a removed track does not interrupt playback');
let release;
const closing=new PresentationQueue({tracks:[{id:'slow'}],hasMore:false,load:()=>new Promise(r=>release=r),prepare:async()=>assert.fail('must not prepare a closed queue')});
const pending=closing.warm();closing.close();release({id:'slow'});assert.equal(await pending,null);
let attempt=0;
const retry=new PresentationQueue({fetchPage:async()=>{if(!attempt++)throw Error('offline');return {page:0,hasMore:false,tracks:[{id:'retry'}]};},load:async t=>t,prepare:async()=>{}});
await assert.rejects(retry.next(),/offline/);assert.equal((await retry.next()).id,'retry');

const base={ctx:{currentTime:10}},decks=[];
const makeDeck=async()=>{
 const events=[],sleepEvents=[],deck={events,sleepEvents,disposed:0,sleepGain:{gain:{value:1,setTargetAtTime:(value,at,tau)=>sleepEvents.push({value,at,tau})}},gain:{gain:{setValueAtTime:(value,at)=>events.push({value,at}),linearRampToValueAtTime:(value,at)=>events.push({value,at})}},
 player:{async play(take){if(take.bad)throw Error('bad instruments');return base.ctx.currentTime+.16;},retire(at){deck.retired=at;}},dispose(){this.disposed++;}};
 decks.push(deck);return deck;
};
const mixer=new PresentationMixer(base,null,{makeDeck});
assert.equal(await mixer.play({}),10.16);const first=decks[0];mixer.setSleepGain(.2);assert.deepEqual(first.sleepEvents.at(-1),{value:.2,at:10,tau:.1});
await assert.rejects(mixer.transition({bad:true}),/bad instruments/);
assert.equal(first.disposed,0);assert.equal(first.retired,undefined,'failed incoming preparation leaves current deck untouched');assert.equal(decks[1].disposed,1);
const handoff=await mixer.transition({},{duration:5});assert.equal(handoff.start,10.16);assert.equal(first.retired,10.16);assert.equal(decks[2].sleepGain.gain.value,.2,'incoming deck inherits the sleep fade before playback');mixer.setSleepGain(.01);assert.equal(first.sleepEvents.at(-1).value,.01);assert.equal(decks[2].sleepEvents.at(-1).value,.01);
assert.deepEqual(first.events.at(-1),{value:0,at:15.16});assert.deepEqual(decks[2].events.at(-1),{value:1,at:15.16});
await assert.rejects(mixer.transition({}),/already transitioning/);
base.ctx.currentTime=15;mixer.service();assert.equal(first.disposed,0);
base.ctx.currentTime=16;mixer.service();assert.equal(first.disposed,1);assert.equal(mixer.decks.size,1);
await mixer.transition({});mixer.dispose();assert.equal(mixer.decks.size,0);assert(decks.every(d=>d.disposed===1),'exit cleans up every deck exactly once');
let finishDeck;
const late=new PresentationMixer(base,null,{makeDeck:()=>new Promise(resolve=>finishDeck=resolve)});
const latePlay=late.play({});late.dispose();const lateDeck=await makeDeck();finishDeck(lateDeck);assert.equal(await latePlay,null);assert.equal(lateDeck.disposed,1,'exit during async preparation cannot start a hidden track');
console.log('PASS: prefetch reuse, chart order/wrap/pagination, deleted tracks, network retry, queue cancellation, independent clock-scheduled deck fades, retained current track on preparation failure, bounded decks and exit cleanup.');
