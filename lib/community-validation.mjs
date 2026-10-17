import {validateTakeMetadata,isSession} from '../public/recorder-core.js';
import {sanitizeTake} from '../public/recording-state.js';
export const MAX_SHARED_FILE=8*1024*1024, MAX_HEADER=8*1024*1024;
export class PublicError extends Error {constructor(message,status=400){super(message);this.status=status;}}
const blocked = /\b(?:f+[u*]+c+k+(?:ing|er|ers|ed|s)?|s+h+[i*]+t+(?:ty|ting|head|s)?|c+[u*]+n+t+s?|motherfucker\w*|fuck\w*|bullshit|bitch(?:es)?|asshole\w*|dickhead\w*|cock(?:sucker)?s?|pussy|wank\w*|twat\w*|nigg(?:er|a)s?|fag(?:got)?s?|kike\w*|spic|chink\w*|retard(?:ed|s)?|heil\s*hitler|kill\s+(?:yourself|all\s+\w+)|white\s*(?:power|supremacy)|gas\s+the\s+jews)\b/i;
const confusables={'а':'a','ɑ':'a','Α':'a','А':'a','е':'e','Ε':'e','Е':'e','і':'i','Ι':'i','І':'i','о':'o','Ο':'o','О':'o','р':'p','Ρ':'p','Р':'p','с':'c','С':'c','ϲ':'c','х':'x','Χ':'x','Х':'x','у':'y','Υ':'y','У':'y','ѕ':'s','Ѕ':'s','ј':'j','Ј':'j','к':'k','К':'k','т':'t','Т':'t','м':'m','М':'m','в':'b','В':'b','н':'h','Н':'h'};
export function publicLabel(value,field,max){
 if(typeof value!=='string')throw new PublicError(`Enter a ${field}.`);
 const label=value.normalize('NFKC').trim().replace(/\s+/gu,' ');
 if(label.length<2||label.length>max)throw new PublicError(`${field==='track title'?'Track titles':'Artist names'} need 2–${max} characters.`);
 if(/[<>🖕\p{C}]/u.test(value)||/(?:https?:|www\.|@\w|\.com\b)/i.test(label)||!/[\p{L}\p{N}]/u.test(label))throw new PublicError(`Use a simple ${field} without links, markup or hidden characters.`);
 let folded=label.normalize('NFKD').replace(/\p{M}/gu,'').replace(/[аɑΑАеΕЕіΙІоΟОрΡРсСϲхΧХуΥУѕЅјЈкКтТмМвВнН]/g,c=>confusables[c]).toLowerCase().replace(/[01345789@$!]/g,c=>({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','9':'g','@':'a','$':'s','!':'i'}[c]));
 const punct=folded.replace(/[^a-z\s]/g,'');
 // Catch punctuation/letter-spaced evasions without rejecting substrings in ordinary words.
 const spaced=folded.replace(/\b(?:[a-z][\s._*-]+){2,}[a-z]\b/g,s=>s.replace(/[^a-z]/g,''));
 if([folded,punct,spaced].some(s=>blocked.test(s)))throw new PublicError(`Please choose another ${field}. Public names and titles must be respectful.`);
 return label;
}
export function canonicalMetadata(raw,title,id,created){
 if(!isSession(raw))throw new PublicError('Only playable session files (version 2) can be shared. Earlier audio recordings stay in your browser; record a new session to share.');
 try{validateTakeMetadata(raw);sanitizeTake(raw);}catch{throw new PublicError('This session has invalid notes, settings or visual actions, or contains embedded media.');}
 const {format,version,duration,beats,cycleBeats,snapshot,scene,events}=raw;
 return {format,version,id,name:title,created:new Date(created).toISOString(),duration,beats,cycleBeats,snapshot,scene:{w:scene.w,h:scene.h,...Object.fromEntries(['u','v','r','g','b'].map(k=>[k,scene[k]]))},events:events.map(e=>({t:e.t,kind:e.kind,data:e.data}))};
}
export function windowStart(window,now){if(window==='today'){const d=new Date(now);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());}if(window==='week')return now-7*86400000;return 0;}
export function parseList(url){const window=url.searchParams.get('window')||'today',sort=url.searchParams.get('sort')||'popular',page=Number(url.searchParams.get('page')||0);if(!['today','week','all'].includes(window)||!['popular','newest','mine'].includes(sort)||!Number.isInteger(page)||page<0||page>10000)throw new PublicError('Invalid library query.');return {window,sort,page};}
