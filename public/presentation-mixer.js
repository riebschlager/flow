import {AmbientAudio} from './music.js?rev=fluid-feedback-82';

// Each deck owns its instruments' envelopes and effects; only decoded samples
// and the AudioContext clock are shared. Scene automation cannot touch fades.
export async function createPresentationDeck(base,Player,onError){
 const c=base.ctx,gain=c.createGain(),sleepGain=c.createGain(),audio=new AmbientAudio();
 gain.gain.value=0;sleepGain.gain.value=1;gain.connect(sleepGain);sleepGain.connect(c.destination);audio.loaded=base.loaded;audio.onVisualNote=note=>base.onVisualNote?.(note);
 try{await audio.initialize({context:c,destination:gain});}
 catch(error){gain.disconnect();sleepGain.disconnect();throw error;}
 const player=new Player(audio,{onError});
 return {audio,player,gain,sleepGain,dispose(){
  player.stop();audio.player?.cancelQueue(c);
  for(const envelope of audio.player?.envelopes||[])envelope.disconnect();
  for(const node of [...Object.values(audio),...Object.values(audio.output||{})])if(node!==c&&typeof node?.disconnect==='function')node.disconnect();
  gain.disconnect();sleepGain.disconnect();
 }};
}
export class PresentationMixer{
 constructor(base,Player,{makeDeck=createPresentationDeck,onError=()=>{}}={}){Object.assign(this,{base,Player,makeDeck,onError});this.decks=new Set();this.generation=0;this.active=null;this.ending=null;this.sleepLevel=1;}
 async open(take){
  const own=this.generation,deck=await this.makeDeck(this.base,this.Player,this.onError);this.decks.add(deck);deck.sleepGain.gain.value=this.sleepLevel;if(own!==this.generation){this.remove(deck);return null;}
  try{const start=await deck.player.play(take,{loop:true});if(own!==this.generation){this.remove(deck);return null;}return {deck,start};}
  catch(error){this.remove(deck);throw error;}
 }
 async play(take){const ready=await this.open(take);if(!ready)return null;this.active=ready.deck;ready.deck.gain.gain.setValueAtTime(1,ready.start);return ready.start;}
 async transition(take,{duration=5}={}){
  this.service();if(!this.active||this.ending)throw new Error('A track is already transitioning.');
  const outgoing=this.active,ready=await this.open(take);if(!ready)return null;
  const {deck,start}=ready;duration=Math.max(1,Math.min(8,duration));
  outgoing.player.retire(start);
  // A restrained overlap avoids a loudness swell and limits harmonic overlap.
  const from=outgoing.gain.gain,to=deck.gain.gain;
  from.setValueAtTime(1,start);from.linearRampToValueAtTime(.18,start+duration*.55);from.linearRampToValueAtTime(0,start+duration);
  to.setValueAtTime(0,start);to.linearRampToValueAtTime(.72,start+duration*.55);to.linearRampToValueAtTime(1,start+duration);
  this.active=deck;this.ending={deck:outgoing,end:start+duration};
  return {start,duration};
 }
 setSleepGain(value){this.sleepLevel=Math.max(.0001,Math.min(1,Number(value)||.0001));for(const deck of this.decks)deck.sleepGain.gain.setTargetAtTime(this.sleepLevel,this.base.ctx.currentTime,.1);}
 service(){if(this.ending&&this.base.ctx.currentTime>=this.ending.end){this.remove(this.ending.deck);this.ending=null;}}
 remove(deck){if(this.decks.delete(deck))deck.dispose();}
 dispose(){this.generation++;for(const deck of [...this.decks])this.remove(deck);this.active=this.ending=null;}
}
