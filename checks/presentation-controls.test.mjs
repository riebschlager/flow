import assert from 'node:assert/strict';
import {createPresentationControls,HOVER_HIDE_MS,OPEN_HIDE_MS} from '../public/presentation-controls.js';
const node=()=>({hidden:true,attrs:{},dataset:{},listeners:{},children:[],setAttribute(k,v){this.attrs[k]=v;},contains(target){return target===this||this.children.includes(target);},addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);},fire(type,event={}){for(const fn of this.listeners[type]??[])fn(event);}});
const doc=node(),shell=node(),panel=node(),trigger=node(),hint=node(),button=node(),select=node(),scene=node();panel.children=[button,select];trigger.focus=()=>{doc.activeElement=trigger;};doc.activeElement=null;
let now=0,serial=0;const timers=new Map(),saved=new Map();
const chrome=createPresentationControls({shell,panel,trigger,hint,doc,viewportHeight:()=>900,storage:()=>({getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)}),setTimer:(fn,ms)=>{const id=++serial;timers.set(id,{fn,at:now+ms});return id;},clearTimer:id=>timers.delete(id)});
function tick(ms){now+=ms;for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}}
const shown=()=>panel.dataset.shown==='true';
const mouse=(y,extra={})=>doc.fire('pointermove',{pointerType:'mouse',buttons:0,clientY:y,target:scene,...extra});
// Starting shows the strip briefly, as the kit does; it stays in the tab order (not hidden, not inert) the whole time.
chrome.start();assert(!panel.hidden);assert.equal(panel.inert,false);assert(shown());assert(!trigger.hidden);assert(!hint.hidden);assert(!chrome.pinned,'a strip shown on entry is not pinned');
tick(HOVER_HIDE_MS);assert(!shown());assert(!panel.hidden,'a faded strip stays reachable by keyboard');tick(4500);assert(hint.hidden);
// Painting, touches and moves away from the bottom edge stay quiet.
mouse(400);mouse(850,{buttons:1});mouse(850,{pointerType:'touch'});shell.fire('pointerdown',{target:scene});doc.fire('keydown',{key:'Tab'});assert(!shown());
// A resting mouse in the bottom band shows it until the pointer leaves, then it hides after 2.6 s.
mouse(850);assert(shown());tick(20000);assert(shown(),'hovering the band keeps it');mouse(400);tick(HOVER_HIDE_MS-1);assert(shown());tick(1);assert(!shown());
// Hovering the strip itself pins it the same way.
mouse(850);panel.fire('pointerenter',{pointerType:'mouse'});mouse(850,{target:button});tick(20000);assert(shown());panel.fire('pointerleave',{pointerType:'mouse'});tick(HOVER_HIDE_MS);assert(!shown());
// The chevron opens it for six seconds and pins it for Escape.
trigger.fire('click');assert(shown());assert.equal(trigger.attrs['aria-expanded'],'true');assert.equal(trigger.attrs['aria-label'],'Hide presentation controls');assert(chrome.pinned);tick(OPEN_HIDE_MS-1);assert(shown());tick(1);assert(!shown());assert.equal(trigger.attrs['aria-label'],'Show presentation controls');
// Touch interaction resets the deadline without creating a hover state.
trigger.fire('click');tick(5000);panel.fire('pointerenter',{pointerType:'touch'});panel.fire('pointerdown');panel.fire('pointerup');tick(5000);assert(shown());tick(1000);assert(!shown());
// Keyboard focus inside a faded strip shows it, and it never hides while focused (an open native picker too).
doc.activeElement=select;panel.fire('focusin');assert(shown());assert(chrome.pinned,'focus inside pins it');tick(20000);assert(shown());
doc.activeElement=null;panel.fire('focusout');tick(0);tick(HOVER_HIDE_MS);assert(!shown(),'leaving it hides it again');
// Escape hides a pinned strip and returns focus to the chevron; an unpinned one is left for the app (Zen exits).
trigger.fire('click');doc.activeElement=button;let prevented=false;doc.fire('keydown',{key:'Escape',preventDefault(){prevented=true;},stopImmediatePropagation(){}});assert(!shown());assert(prevented);assert.equal(doc.activeElement,trigger);
doc.activeElement=null;mouse(850);prevented=false;doc.fire('keydown',{key:'Escape',preventDefault(){prevented=true;},stopImmediatePropagation(){}});assert(shown());assert(!prevented,'a strip shown by hover lets Escape through');mouse(400);tick(HOVER_HIDE_MS);
trigger.fire('click');shell.fire('pointerdown',{target:scene});assert(!shown(),'a press outside hides it');
trigger.fire('click');trigger.fire('click');assert(!shown(),'the chevron toggles');
// Stopping hides it from the tab order again and clears every timer; the first-visit hint stays dismissed.
chrome.stop();assert(trigger.hidden);assert(panel.hidden);assert(!shown());assert.equal(timers.size,0);mouse(850);assert(!shown(),'a stopped strip ignores the band');
chrome.start();assert(hint.hidden,'first-visit hint stays dismissed on subsequent visits');chrome.stop();assert.equal(timers.size,0);
console.log('PASS: glass strip shows on entry, faded but keyboard-reachable, bottom-band hover with 2.6 s hide, painting and touch stay quiet, chevron 6 s and pin, focus reveal and hold, Escape only for a pinned strip, outside dismissal, discovery persistence, lifecycle cleanup.');
