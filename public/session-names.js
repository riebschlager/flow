// A little cozy, a little cosmic, and occasionally suspicious.
const adjectives = ['Velvet','Restless','Cosmic','Suspicious','Dapper','Feral','Secret','Sleepy','Wobbly','Bashful','Disco','Midnight','Wandering','Golden','Mischievous','Dreamy','Electric','Bouncy','Gentle','Dramatic','Fuzzy','Galactic','Glittery','Hushed','Jolly','Lunar','Mellow','Mighty','Mossy','Nimble','Orbital','Peachy','Plucky','Polka','Radiant','Sneaky','Snug','Solar','Sparkly','Spirited','Starry','Toasty','Twinkly','Whimsical','Wild','Wistful','Zippy','Curious'];
const nouns = ['Turnip','Waffle','Badger','Canoe','Comet','Teacup','Penguin','Ravioli','Otter','Possum','Goose','Biscuit','Moon','Dumpling','Walrus','Ripple','Whirlpool','Marshmallow','Acorn','Alpaca','Banjo','Bumblebee','Cloud','Crumpet','Dandelion','Dragon','Fern','Firefly','Jellybean','Kettle','Lantern','Lobster','Marmalade','Meteor','Mushroom','Noodle','Pancake','Pebble','Pickle','Puffin','Raccoon','Sardine','Sloth','Snail','Sprout','Stardust','Tangerine','Yeti'];
const HISTORY_KEY = 'flow-session-names-v1', HISTORY_LIMIT = 100;
let recent = [];

export function generateSessionName(exclude = []) {
 let stored = [];
 try { const value = JSON.parse(localStorage.getItem(HISTORY_KEY)); if (Array.isArray(value)) stored = value.filter(x => typeof x === 'string').slice(-HISTORY_LIMIT); } catch {}
 const blocked = new Set([...exclude, ...stored, ...recent].map(x => x.toLowerCase()));
 const count = adjectives.length * nouns.length, start = Math.floor(Math.random() * count);
 // Walk the pool if a random pick is already in use; even a repeated RNG draw progresses.
 let name;
 for (let offset = 0; offset < count; offset++) {
  const index = (start + offset) % count;
  name = adjectives[Math.floor(index / nouns.length)] + ' ' + nouns[index % nouns.length];
  if (!blocked.has(name.toLowerCase())) break;
 }
 recent = [...new Set([...stored, ...recent, name])].slice(-HISTORY_LIMIT);
 try { localStorage.setItem(HISTORY_KEY, JSON.stringify(recent)); } catch {}
 return name;
}
