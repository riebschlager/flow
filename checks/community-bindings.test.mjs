import {sessionFixture} from './session-fixture.mjs';
// Requires a current build; uses ephemeral local D1/R2 bindings, with no preview server or remote data.
import assert from 'node:assert/strict';import fs from 'node:fs';import {getPlatformProxy} from 'wrangler';
import {communityRequest} from '../lib/community-server.mjs';import {encodePerformance,decodePerformance} from '../public/recorder-core.js';import {mainDefaults} from '../public/recording-state.js';import {defaultRhythm} from '../public/rhythm.js';import {normalizeArp} from '../public/arpeggiator.js';
process.env.CLOUDFLARE_CF_FETCH_ENABLED='false';process.env.WRANGLER_SEND_METRICS='false';
const proxy=await getPlatformProxy({configPath:'dist/server/wrangler.json',persist:false,remoteBindings:false,envFiles:[]});
try{
 for(const statement of fs.readFileSync(new URL('../drizzle/0000_dapper_namorita.sql',import.meta.url),'utf8').split('--> statement-breakpoint').filter(s=>s.trim()))await proxy.env.DB.prepare(statement).run();
 const take=sessionFixture();take.events.push({t:1,kind:'title',data:{text:'Evening tide',color:1}});const file=encodePerformance(take),base='https://chromaflow.test/api/community/';
 const request=new Request(base+'tracks',{method:'POST',body:file,headers:{origin:'https://chromaflow.test','content-type':'application/json','x-file-size':String(file.size),'x-track-title':'Binding%20current','x-artist-name':'River'}});
 const response=await communityRequest(request,proxy.env,'binding-user');const result=await response.json();assert.equal(response.status,201,JSON.stringify(result));
 const id=result.track.id,download=await communityRequest(new Request(base+'tracks/'+id+'/performance'),proxy.env);assert.equal(download.status,200);const decoded=await decodePerformance(await download.blob());assert.equal(decoded.name,'Binding current');assert.deepEqual(decoded.events,take.events);assert.equal(decoded.channels,undefined);assert.equal(decoded.duration,take.duration);
 const vote=await communityRequest(new Request(base+'tracks/'+id+'/like',{method:'PUT',headers:{origin:'https://chromaflow.test'}}),proxy.env,'listener');assert.equal(vote.status,200);const chart=await(await communityRequest(new Request(base+'tracks?window=today'),proxy.env)).json();assert.equal(chart.tracks[0].score,1);
 const removed=await communityRequest(new Request(base+'tracks/'+id,{method:'DELETE',headers:{origin:'https://chromaflow.test'}}),proxy.env,'binding-user');assert.equal(removed.status,200);assert.equal((await proxy.env.BUCKET.list()).objects.length,0);
 console.log('PASS: native local D1 and R2 bindings accept the migration, session-only JSON upload/download without audio, likes/charts and owner cleanup.');
}finally{await proxy.dispose();}
