import assert from 'node:assert/strict';
import {createPresentationControls} from '../public/presentation-controls.js';
const node=()=>({hidden:true,attrs:{},listeners:{},children:[],setAttribute(k,v){this.attrs[k]=v;},contains(target){return target===this||this.children.includes(target);},addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);},fire(type,event={}){for(const fn of this.listeners[type]??[])fn(event);}});
const doc=node(),shell=node(),panel=node(),trigger=node(),hint=node(),button=node(),select=node(),scene=node();panel.children=[button,select];trigger.focus=()=>{doc.activeElement=trigger;};doc.activeElement=null;
let now=0,serial=0;const timers=new Map(),saved=new Map();
const chrome=createPresentationControls({shell,panel,trigger,hint,doc,storage:()=>({getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)}),setTimer:(fn,ms)=>{const id=++serial;timers.set(id,{fn,at:now+ms});return id;},clearTimer:id=>timers.delete(id)});
function tick(ms){now+=ms;for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}}
chrome.start();assert(panel.hidden);assert(!trigger.hidden);assert(!hint.hidden);tick(4500);assert(hint.hidden);
// Mouse movement, canvas touch, and keyboard navigation never invoke the panel.
for(const type of ['pointermove','pointerdown','focusin'])shell.fire(type,{target:scene});doc.fire('keydown',{key:'Tab'});assert(panel.hidden);
trigger.fire('click');assert(!panel.hidden);assert.equal(trigger.attrs['aria-expanded'],'true');tick(5999);assert(!panel.hidden);tick(1);assert(panel.hidden);
// Hover pins the panel; leaving gives the user a fresh idle period.
trigger.fire('click');panel.fire('pointerenter',{pointerType:'mouse'});tick(10000);assert(!panel.hidden);panel.fire('pointerleave');tick(6000);assert(panel.hidden);
// Touch interaction resets the deadline without creating a permanent hover state.
trigger.fire('click');tick(5000);panel.fire('pointerenter',{pointerType:'touch'});panel.fire('pointerdown');panel.fire('pointerup');tick(5000);assert(!panel.hidden);tick(1000);assert(panel.hidden);
// Focus, including an open native picker, prevents the idle timer from hiding it.
trigger.fire('click');doc.activeElement=select;panel.fire('focusin');tick(20000);assert(!panel.hidden);doc.activeElement=trigger;panel.fire('focusout');tick(0);tick(6000);assert(panel.hidden);
// Escape restores focus when closing from within the panel.
trigger.fire('click');doc.activeElement=button;let prevented=false;doc.fire('keydown',{key:'Escape',preventDefault(){prevented=true;},stopImmediatePropagation(){}});assert(panel.hidden);assert(prevented);assert.equal(doc.activeElement,trigger);
trigger.fire('click');shell.fire('pointerdown',{target:scene});assert(panel.hidden);
trigger.fire('click');trigger.fire('click');assert(panel.hidden);
chrome.stop();assert(trigger.hidden);assert(panel.hidden);assert.equal(timers.size,0);chrome.start();assert(hint.hidden,'first-visit hint stays dismissed on subsequent visits');chrome.stop();
console.log('PASS: intentional reveal, incidental input stays quiet, six-second idle, hover/focus protection, touch, Escape focus return, outside dismissal, discovery persistence, lifecycle cleanup.');
