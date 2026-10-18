import {sessionFixture} from './session-fixture.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import {createCommunityController} from '../public/community-ui.js';import {encodePerformance} from '../public/recorder-core.js';import {mainDefaults} from '../public/recording-state.js';import {defaultRhythm} from '../public/rhythm.js';import {normalizeArp} from '../public/arpeggiator.js';
const els=new Map();function el(id){return {id,value:'',checked:false,hidden:false,disabled:false,open:false,innerHTML:'',textContent:'',dataset:{},listeners:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,v){this.listeners[k]=v;},showModal(){this.open=true;},close(){this.open=false;},focus(){this.focused=true;}};}
for(const match of fs.readFileSync(new URL('../app/instrument.html',import.meta.url),'utf8').matchAll(/\bid="([^"]+)"/g))els.set(match[1],el(match[1]));globalThis.document={getElementById:id=>{assert(els.has(id),id);return els.get(id);}};const $=document.getElementById;globalThis.localStorage={getItem:()=>'',setItem(){}};globalThis.location={href:'https://chromaflow.test/',hash:''};
const take=sessionFixture();take.name='Local water';

let signedIn=false,likes=0,voted=false,published=false,failUpload=false,failList=false,failIdentity=false,expired=false,played=0,saved=0,unlocked=0,forked=0,requests=[];
const id='650c01c0-abac-4f3b-956a-f4d846d1b115';function track(){return {id,title:'<Glass & light>',artist:'River <artist>',created:Date.now(),duration:1000,bytes:64000,likes,score:likes,liked:voted,mine:published};}
const recorder={phase:'idle',selectedTake:take,prepareExternal:async()=>unlocked++,playExternal:async t=>{assert.equal(t.name,'<Glass & light>');played++;recorder.phase='playing';},saveExternal:async()=>saved++,forkExternal:async t=>{assert.equal(t.name,'<Glass & light>');forked++;recorder.phase='idle';}};
const request=async(url,options={})=>{requests.push([url,options.method]);if(url.endsWith('/me')){if(failIdentity)throw new Error('Account check failed');return Response.json({signedIn});}if(!options.method&&url.endsWith('/tracks/'+id))return Response.json({track:track()});if(url.endsWith('/performance'))return new Response(encodePerformance(take));if(url.endsWith('/like')){voted=options.method==='PUT';likes=voted?1:0;return Response.json({track:track()});}if(options.method==='DELETE'){published=false;return Response.json({deleted:true});}if(failList)return Response.json({error:'Storage unavailable'},{status:503});return Response.json({tracks:[track()],page:0,hasMore:false});};
const upload=async(url,file,{title,artist,onProgress})=>{assert.equal(title,'Gentle light');assert.equal(artist,'River');assert(file.size>0);onProgress(.5);if(expired)throw Object.assign(new Error('Sign in with ChatGPT to share.'),{status:401});if(failUpload)throw new Error('Choose another track title.');published=true;return {track:track()};};
const ui=createCommunityController(recorder,{request,upload});assert.equal(requests.length,0,'does not fetch until community opens');await ui.open();assert($('communityDialog').open);assert.equal($('communitySignIn').hidden,false);assert($('communityTracks').innerHTML.includes('&lt;Glass &amp; light&gt;'));assert(!$('communityTracks').innerHTML.includes('River <artist>'));
const button=el('button');await ui.action('like',id,button);assert.equal(likes,0);assert($('communityStatus').textContent.includes('Sign in'));
assert($('communityTracks').innerHTML.includes('data-action="fork"'));recorder.phase='playing';await ui.action('fork',id,button);assert.equal(forked,1);assert.equal(recorder.phase,'idle');assert.equal($('communityDialog').open,false);assert(!requests.some(([,method])=>method==='POST'),'forking does not publish');
// Anonymous users see a sign-in step, with no active consent or upload controls.
await ui.share();assert.equal($('shareForm').hidden,true);assert.equal($('shareSignInGate').hidden,false);assert.equal($('shareConsent').disabled,true);assert.equal($('sharePublish').disabled,true);assert($('shareSignIn').focused);assert($('shareTakeInfo').textContent.includes('Sign in'));
await ui.publish({preventDefault(){}});assert.equal(published,false);assert($('shareStatus').textContent.includes('Sign in'));
const pending=new Map();globalThis.sessionStorage={setItem:(k,v)=>pending.set(k,v),getItem:k=>pending.get(k),removeItem:k=>pending.delete(k)};
$('shareSignIn').onclick();assert.equal(pending.get('flow-pending-share'),take.id);
failIdentity=true;await ui.load();assert.equal($('shareAuthRetry').hidden,false);assert.equal($('shareForm').hidden,true);assert($('shareSignInMessage').textContent.includes('couldn’t'));failIdentity=false;
// Returning from top-level sign-in restores the chosen take, but still requires consent.
recorder.getTake=async key=>{assert.equal(key,take.id);return take;};recorder.selectTake=async key=>{assert.equal(key,take.id);recorder.selectedTake=take;};signedIn=true;
await ui.openRoute();assert.equal(pending.size,0);assert.equal($('shareForm').hidden,false);assert.equal($('shareSignInGate').hidden,true);assert.equal($('shareConsent').checked,false);assert.equal($('shareConsent').disabled,false);assert.equal(published,false);
signedIn=true;await ui.load();assert($('communitySignIn').hidden);await ui.action('like',id,button);assert.equal(likes,1);await ui.action('like',id,button);assert.equal(likes,0);
await $('chartWeek').onclick();assert(requests.at(-1)[0].includes('window=week'));assert($('chartDescription').textContent.includes('seven days'));await $('chartAll').onclick();assert($('chartDescription').textContent.includes('total likes'));
await ui.action('play',id,button);assert.equal(played,1);assert.equal(unlocked,1);assert.equal($('communityDialog').open,false);await ui.action('save',id,button);assert.equal(saved,0);assert($('communityStatus').textContent.includes('Stop playback'));recorder.phase='idle';await ui.action('save',id,button);assert.equal(saved,1);
await ui.share();assert.equal($('shareForm').hidden,false);assert.equal($('shareTrackTitle').value,'Local water');assert($('shareTakeInfo').textContent.includes('Local water'));$('shareTrackTitle').value='Gentle light';$('shareArtist').value='River';await ui.publish({preventDefault(){}});assert.equal(published,false);$('shareConsent').checked=true;failUpload=true;await ui.publish({preventDefault(){}});assert.equal($('shareForm').hidden,false);assert.equal($('sharePublish').disabled,false);assert($('shareStatus').textContent.includes('another'));failUpload=false;expired=true;await ui.publish({preventDefault(){}});assert.equal(published,false);assert.equal($('shareForm').hidden,true);assert.equal($('shareSignInGate').hidden,false);assert.equal($('shareConsent').checked,false);expired=false;await ui.load();$('shareConsent').checked=true;await ui.publish({preventDefault(){}});assert(published);assert.equal($('shareForm').hidden,true);assert(requests.at(-1)[0].includes('sort=mine'));assert($('communityStatus').textContent.includes('Published'));
await ui.action('remove',id,button);assert.equal(button.textContent,'Confirm remove');assert(published);await ui.action('remove',id,button);assert(!published);
failList=true;await ui.load();assert.equal($('communityTracks').innerHTML,'');assert($('communityStatus').textContent.includes('Storage unavailable'));
console.log('PASS: deferred community loading, escaped public metadata, sign-in voting gate, likes/unlikes, chart periods, public audio/canvas playback, browser copy, explicit sharing consent, upload progress/errors/retry, owner removal and honest storage failure state.');

// Shared links bypass both the modal and the leaderboard/account requests.
failList=false;recorder.phase='idle';requests=[];let previewed=null,blocked=true;
ui.setWorkspace({preview:t=>{previewed=t;}});
recorder.prepareExternal=async({autoplay}={})=>{unlocked++;if(autoplay&&blocked)throw new DOMException('Blocked','NotAllowedError');};
location.pathname='/recordings/'+id;await ui.openRoute();assert.equal($('communityDialog').open,false);assert.equal(previewed.communityId,id);assert.equal(recorder.phase,'idle');assert.equal($('previewStatus').textContent,'Press Play to listen.');assert.equal($('quickPlay').disabled,false);assert.deepEqual(requests.map(r=>r[0]),['/api/community/tracks/'+id,'/api/community/tracks/'+id+'/performance']);
const before=played;await ui.playPreview();assert.equal(played,before+1);assert.equal($('previewStatus').textContent,'');
recorder.phase='idle';blocked=false;location.pathname='/';location.hash='#track='+id;await ui.openRoute();assert.equal(played,before+2);assert.equal($('communityDialog').open,false);
recorder.phase='idle';recorder.prepareExternal=async()=>{throw Error('Instrument unavailable');};await ui.openRoute();assert.equal($('previewStatus').textContent,'Instrument unavailable');assert.equal($('quickPlay').disabled,false);
console.log('PASS: direct and legacy shared links bypass modal/account/chart, attempt autoplay, invite Play when blocked, retry the loaded track, and report genuine playback failures.');

// Presentation links load one selected track, preserve the chosen composition,
// and never fetch a leaderboard or account just to listen.
let chosen,launched=0,entered=[],presented=0,left=0;
const presentation={active:false,choose(t,fn){chosen=t;this.launch=fn;},enter(t,ratio,opts){this.active=true;entered.push([t,ratio,opts]);},async play(t,options){assert.equal(t.communityId,id);presented++;this.options=options;},fail(e){throw e;},exit(){left++;this.active=false;}};
const presentUI=createCommunityController(recorder,{request,upload,presentation});
recorder.phase='idle';recorder.prepareExternal=async()=>launched++;
await presentUI.load();assert($('communityTracks').innerHTML.includes('data-action="present"'));
await presentUI.action('present',id,button);assert.equal(chosen.id,id);assert.equal(presented,0,'chooser does not start playback');
await presentation.launch({ratio:'portrait',unlock:recorder.prepareExternal()});assert.equal(launched,1);assert.equal(entered.at(-1)[1],'portrait');assert.equal(entered.at(-1)[2].navigate,true);assert.equal(presented,1);
presentUI.leavePresentation();assert.equal(left,1);
requests=[];entered=[];location.pathname='/recordings/'+id;location.hash='';location.search='?present=landscape';
await presentUI.openRoute();assert.equal(entered[0][0],null,'standalone shell appears while the track loads');assert.equal(entered.at(-1)[1],'landscape');assert.equal(presentation.options.autoplay,true);assert.deepEqual(requests.map(r=>r[0]),['/api/community/tracks/'+id,'/api/community/tracks/'+id+'/performance']);
assert.equal(presented,2);presentUI.leavePresentation();assert.equal(left,2);
console.log('PASS: presentation chooser defers playback, launch unlocks audio, portrait selection is retained, direct landscape loads bypass account/chart, and leaving cleans up presentation.');
