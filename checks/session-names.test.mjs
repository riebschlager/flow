import assert from 'node:assert/strict';
import {generateSessionName} from '../public/session-names.js';

const originalRandom = Math.random;
Math.random = () => 0;
try {
 const saved = new Map([['flow-session-names-v1', JSON.stringify(['Velvet Waffle'])]]);
 globalThis.localStorage = {getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value)};
 const first = generateSessionName(['velvet turnip']);
 assert.equal(first, 'Velvet Badger', 'skip saved and recent names, ignoring case');
 const next = generateSessionName();
 assert.notEqual(first, next, 'a repeated random draw must still yield a new name');
 assert(JSON.parse(saved.get('flow-session-names-v1')).includes(next));
 globalThis.localStorage = {getItem(){throw Error('blocked');}, setItem(){throw Error('blocked');}};
 const names = new Set();
 for (let i = 0; i < 100; i++) {
  const name = generateSessionName();
  assert.match(name, /^[A-Z][a-z]+ [A-Z][a-z]+$/);
  assert(!names.has(name), 'avoid the last 100 suggestions even with storage blocked');
  names.add(name);
 }
 console.log('PASS: two-word names, saved-name exclusions, persistent recent history, repeated random draws, and blocked storage.');
} finally {Math.random = originalRandom;delete globalThis.localStorage;}
