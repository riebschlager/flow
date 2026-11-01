import assert from 'node:assert/strict';
import {createSessionWorkspace} from '../public/session-workspace.js';
import {sessionFixture} from './session-fixture.mjs';
import {sanitizeTake} from '../public/recording-state.js';
import {sessionRoute} from '../public/session-store.js';
const elements=new Map(),handlers={},intervals=[];
function el(id){if(!elements.has(id))elements.set(id,{value:'',textContent:'',hidden:false,checked:false,classList:{toggle(){},add(){}},innerHTML:'',listeners:{},addEventListener(k,f){this.listeners[k]=f;},close(){this.open=false;},focus(){},querySelectorAll(){return [];},click(){return this.onclick?.();}});return elements.get(id);}
globalThis.document={title:'',body:{classList:{toggle(){},remove(){}}},getElementById:el,querySelector:s=>s==='.brand'?el('brand'):null,addEventListener(){}};
globalThis.addEventListener=(k,f)=>handlers[k]=f;globalThis.setInterval=f=>{intervals.push(f);return 0;};
globalThis.location={pathname:'/',search:''};globalThis.history={pushState(a,b,url){const u=new URL(url,'https://flow.test');location.pathname=u.pathname;location.search=u.search;},replaceState(...a){this.pushState(...a);}};
let snapshot={main:{settings:{},voices:['piano','vibes','strings','celesta'],custom:['Cmaj7','Am7','Fmaj7','G'],bpm:56,selected:0}},scene={w:2,h:2,u:[0,0,0,0],v:[0,0,0,0],r:[0,0,0,0],g:[0,0,0,0],b:[0,0,0,0]},stops=0,quota=false;
const sessions=new Map(),takes=new Map();
const store={remove:async id=>{if(quota)throw Error('Storage full');sessions.delete(id);},list:async()=>[...sessions.values()].map(x=>structuredClone(x)),get:async id=>structuredClone(sessions.get(id)),put:async s=>{if(quota)throw Error('Storage full');sessions.set(s.id,structuredClone(s));}};
const recorder={phase:'idle',replaying:false,selectedTake:null,listTakes:async()=>[],getTake:async id=>takes.get(id),selectTake:async id=>recorder.selectedTake=takes.get(id)||null,record:async()=>recorder.phase='recording',stopPlayback(){this.phase='idle';this.replaying=false;},setLoop(){}};
const bridge={snapshot:()=>structuredClone(snapshot),scene:()=>structuredClone(scene),applySnapshot:s=>snapshot=structuredClone(s),restoreScene:s=>scene=structuredClone(s),stopLive:()=>stops++};
const workspace=createSessionWorkspace({bridge,recorder,store,community:{openRoute:async()=>{},open:async()=>{}}});
await workspace.init();await workspace.newSession();const first=sessionRoute(location.pathname);assert(first);assert.match(sessions.get(first).name,/^[A-Z][a-z]+ [A-Z][a-z]+$/);
const initialName=sessions.get(first).name;await el('shuffleSessionName').onclick();assert.notEqual(sessions.get(first).name,initialName);assert.equal(el('sessionTitle').value,sessions.get(first).name);assert.equal(document.title,sessions.get(first).name+' · Flow');
recorder.phase='recording';intervals.at(-1)();assert.equal(el('shuffleSessionName').disabled,true);const heldName=sessions.get(first).name;await el('shuffleSessionName').onclick();assert.equal(sessions.get(first).name,heldName);recorder.phase='idle';intervals.at(-1)();assert.equal(el('shuffleSessionName').disabled,false);
el('sessionTitle').value='First idea';el('sessionTitle').listeners.input();snapshot.main.bpm=83;await workspace.save();assert.equal(sessions.get(first).name,'First idea');assert.equal(sessions.get(first).snapshot.main.bpm,83);
await workspace.newSession();const second=sessionRoute(location.pathname);assert.notEqual(first,second);assert.notEqual(sessions.get(second).name,sessions.get(first).name);assert.equal(snapshot.main.bpm,56);assert.equal(sessions.get(first).snapshot.main.bpm,83);
location.pathname='/sessions/'+first;await workspace.route();assert.equal(snapshot.main.bpm,83);assert.equal(document.title,'First idea · Flow');
// Reuse must never persist a source's settings over the previous document.
await workspace.beforeFork();const child=structuredClone(snapshot);child.main.bpm=41;snapshot=child;
await workspace.forked({snapshot:child,scene},{id:'source',name:'Shared idea',artist:'Someone'});assert.equal(sessions.get(first).snapshot.main.bpm,83);const fork=sessionRoute(location.pathname);assert.equal(sessions.get(fork).snapshot.main.bpm,41);assert.equal(sessions.get(fork).origin.artist,'Someone');
const take={id:'take-1',name:'First take',duration:8,format:'chromaflow-session',version:2,events:[{kind:'fluid'}]};takes.set(take.id,take);recorder.selectedTake=take;await workspace.kept(take);assert.equal(location.search,'?take=take-1');assert.deepEqual(sessions.get(fork).takeIds,['take-1']);await workspace.kept(take);assert.equal(sessions.get(fork).takeIds.length,1);
const take2={...take,id:'take-2'};takes.set(take2.id,take2);await workspace.kept(take2);assert.equal(sessions.get(fork).takeIds.length,2);assert(takes.has('take-1'));
recorder.phase='recording';await assert.rejects(()=>workspace.newSession(),/finish your take/);assert.equal(sessionRoute(location.pathname),fork);recorder.phase='idle';
quota=true;await assert.rejects(()=>workspace.newSession(),/Storage full/);assert.equal(sessionRoute(location.pathname),fork);quota=false;
location.pathname='/sessions/not-on-this-device';location.search='';await workspace.route();assert.match(el('sessionNotice').textContent,/not on this device/);assert.equal(el('sessionHome').hidden,false);assert.equal(sessions.size,3);
console.log('PASS: independent sessions, fresh defaults, rename/autosave, URL recovery, isolated setup reuse, take retention, recording navigation guard, quota protection, missing local-session recovery.');

// A portable project round-trips its draft and all performance data into new identities.
await workspace.newSession();const portable=sessionFixture();takes.set(portable.id,portable);recorder.selectedTake=portable;await workspace.kept(portable);
let downloaded;const originalURL=URL.createObjectURL;URL.createObjectURL=blob=>{downloaded=blob;return 'blob:test';};document.createElement=()=>({click(){}});
await el('backupSession').onclick();URL.createObjectURL=originalURL;const project=JSON.parse(await downloaded.text());assert.equal(project.format,'flow-project');assert.equal(project.takes.length,1);
bridge.validateScene=()=>{};bridge.validateTake=sanitizeTake;recorder.saveExternal=async t=>{t.id=crypto.randomUUID();takes.set(t.id,t);recorder.selectedTake=t;await workspace.kept(t);};
const originalId=sessionRoute(location.pathname);await workspace.importProject(project);const imported=sessions.get(sessionRoute(location.pathname));assert.notEqual(imported.id,originalId);assert.equal(imported.takeIds.length,1);assert.notEqual(imported.takeIds[0],portable.id);assert.deepEqual(takes.get(imported.takeIds[0]).events,portable.events);
await assert.rejects(()=>workspace.importProject({...project,takes:['invalid']}));
console.log('PASS: portable project export/import preserves draft and recorded events, assigns independent identities, and rejects malformed takes.');

// The take chip names the selected take; × returns Play to the live scene.
const tick=intervals.at(-1),withTake=sessionRoute(location.pathname);
tick();assert.equal(el('takeChip').hidden,false);assert.equal(el('takeChipName').textContent,recorder.selectedTake.name);
await el('takeChipClear').onclick();assert.equal(recorder.selectedTake,null);assert.equal(el('takeChip').hidden,true);assert.equal(location.search,'');await workspace.save();assert.equal(sessions.get(withTake).selectedTake,null);
// Record names an unnamed take after the session; a typed name wins, and a saved take clears it for the next one.
el('recordName').value='';assert.equal(await workspace.beforeRecord(),true);assert.equal(el('recordName').value,sessions.get(withTake).name+' · Take 2');
el('recordName').value='Morning';await workspace.beforeRecord();assert.equal(el('recordName').value,'Morning');
workspace.takeFinished(take,true);assert.equal(el('toast').hidden,false);assert.equal(el('toastMessage').textContent,'Saved');assert.equal(el('toastAction').textContent,'Open in library');assert.equal(el('toastAction').hidden,false);assert.equal(el('recordName').value,'');
let library=0;el('recordLauncher').onclick=()=>library++;el('toastAction').onclick();assert.equal(library,1,'the toast opens the Library');
let retried=0;el('retryTakeSave').onclick=()=>retried++;workspace.takeFinished(take,false);assert.equal(el('toastMessage').textContent,'Take not saved');assert.equal(el('toastAction').textContent,'Retry');el('toastAction').onclick();assert.equal(retried,1);
console.log('PASS: take chip names the selected take and × returns to live, Record names unnamed takes, Saved toast opens the Library, unsaved toast retries.');

// Capture settings persist on this device.
const stored=new Map([['flow-capture-v1',JSON.stringify({mode:'manual',cycles:5,autoLoop:true})]]);globalThis.localStorage={getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)};
// The shared view: Play is app.js's dispatcher; the chip names the shared track while it plays, never a hidden local selection.
const sharedCommunity={openRoute:async()=>{},open:async()=>{},playPreview:async()=>{}};
const sharedWorkspace=createSessionWorkspace({bridge,recorder,store,community:sharedCommunity});
assert.equal(el('recordMode').value,'manual');assert.equal(el('recordCycles').value,'5');assert.equal(el('recordAutoLoop').checked,true);
el('recordCycles').value='7';el('recordCycles').listeners.change();assert.deepEqual(JSON.parse(stored.get('flow-capture-v1')),{mode:'manual',cycles:7,autoLoop:true});delete globalThis.localStorage;
recorder.selectedTake=portable;sharedWorkspace.preview({...portable,communityId:'public-track',artist:'River'});assert.equal(el('sharedPreview').hidden,false);assert.equal(document.title,portable.name+' · Flow');assert.equal(sharedWorkspace.previewing,true);
const sharedTick=intervals.at(-1);sharedTick();assert.equal(el('takeChip').hidden,true,'a local take is not offered while a shared track is open');
recorder.phase='playing';recorder.replaying=true;recorder.playingTake={id:'public-track',name:'Shared track'};sharedTick();assert.equal(el('takeChip').hidden,false);assert.equal(el('takeChipName').textContent,'Shared track');
await el('takeChipClear').onclick();assert.equal(recorder.phase,'idle');assert.equal(el('sharedPreview').hidden,false,'stopping keeps the shared track for replay');recorder.playingTake=null;sharedTick();assert.equal(el('takeChip').hidden,true);
console.log('PASS: capture settings persist; shared listening view and title; the take chip names the playing shared track and × stops it while keeping the track for replay.');

// Deletion is explicit, cancellable, persistent, and preserves shared take references.
const deleteClick=id=>el('recentSessions').onclick({target:{closest:selector=>selector==='[data-delete-session]'?{dataset:{deleteSession:id}}:null}});
let confirmation='',confirmed=false,deleteFailure=false;
globalThis.confirm=message=>{confirmation=message;return confirmed;};
recorder.removeTakes=async ids=>{if(deleteFailure)throw Error('Delete storage failed');for(const id of ids)takes.delete(id);};
await sharedWorkspace.route();
const deletedId='delete-target',keptId='keep-target';
sessions.set(deletedId,{...structuredClone(imported),id:deletedId,name:'Delete <idea>',takeIds:['unique','shared']});
sessions.set(keptId,{...structuredClone(imported),id:keptId,takeIds:['shared']});takes.set('unique',take);takes.set('shared',take2);
await sharedWorkspace.route();assert.match(el('recentSessions').innerHTML,/Delete &lt;idea&gt;/);assert.match(el('recentSessions').innerHTML,/data-delete-session/);
await deleteClick(deletedId);assert(sessions.has(deletedId));assert(takes.has('unique'));assert.match(confirmation,/cannot be undone/);
confirmed=true;recorder.phase='playing';await deleteClick(deletedId);assert(sessions.has(deletedId));recorder.phase='idle';
deleteFailure=true;await deleteClick(deletedId);assert(sessions.has(deletedId));assert.match(el('sessionNotice').textContent,/Delete storage failed/);deleteFailure=false;
await deleteClick(deletedId);assert(!sessions.has(deletedId));assert(!takes.has('unique'));assert(takes.has('shared'));assert(sessions.has(keptId));assert(!el('recentSessions').innerHTML.includes('data-session="delete-target"'));
await sharedWorkspace.route();assert(!sessions.has(deletedId));
for(const id of [...sessions.keys()])await deleteClick(id);
assert.equal(sessions.size,0);assert.match(el('recentSessions').innerHTML,/Your sessions will appear here/);
await sharedWorkspace.init();assert.equal(sessions.size,0);
console.log('PASS: cancel/confirm session deletion, playback guard, storage failure, retained shared takes, escaped names, refreshed list, empty state and reload persistence.');
// A first visit stays on home and loads community music without creating a document.
location.pathname='/';location.search='';let homeLoads=0;
const firstVisit=createSessionWorkspace({bridge,recorder,store,community:{openRoute:async()=>{},loadHome:async()=>homeLoads++}});
await firstVisit.init();assert.equal(location.pathname,'/');assert.equal(el('sessionHome').hidden,false);assert.equal(sessions.size,0);assert.equal(homeLoads,1);
await el('homeNewSession').onclick();assert(sessionRoute(location.pathname));assert.equal(el('sessionHome').hidden,true);assert.equal(sessions.size,1);
location.pathname='/';await firstVisit.init();assert.equal(el('sessionHome').hidden,false);assert.equal(sessions.size,1);assert.equal(homeLoads,2);
console.log('PASS: first visit shows community home, New session creates a document, returning to root retains saved sessions.');
