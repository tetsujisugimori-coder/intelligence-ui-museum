'use strict';
function probe({mode}){
 const events=[];let seq=0,eventSeq=0;const eventIds=new WeakMap();const eventId=e=>{if(!eventIds.has(e))eventIds.set(e,++eventSeq);return eventIds.get(e);};window.seventh={events,overflow:false};
 const node=e=>e?{tag:e.tagName,id:e.id,role:e.getAttribute?.('role')}:null;
 const state=()=>{const t=document.querySelector('#Select .stage [role=button]');return {active:node(document.activeElement),focusVisible:t?.matches(':focus-visible'),expanded:t?.getAttribute('aria-expanded'),outline:t?getComputedStyle(t).outline:null,rect:t?.getBoundingClientRect().toJSON(),scrollX,scrollY};};
 const log=(kind,data={})=>{if(events.length>=20000){window.seventh.overflow=true;return;}events.push({seq:++seq,eventId:window.seventh.escapeDown?eventId(window.seventh.escapeDown):null,ms:performance.now(),kind,...state(),...data});return seq;};window.seventh.log=log;window.seventh.sample=kind=>log(kind,{key:window.seventh.escapeDown?.key,defaultPrevented:window.seventh.escapeDown?.defaultPrevented,trusted:window.seventh.escapeDown?.isTrusted});
 window.seventh.callsite=(name,data={})=>log("callsite",{name,...data,stack:new Error().stack});
 if(mode==='full'){
 const pd=Event.prototype.preventDefault;Event.prototype.preventDefault=function(...a){if(this.key==='Escape')log('preventDefault-before',{eventId:eventId(this),key:this.key,defaultPrevented:this.defaultPrevented,trusted:this.isTrusted,stack:new Error().stack});const v=pd.apply(this,a);if(this.key==='Escape')log('preventDefault-after',{eventId:eventId(this),key:this.key,defaultPrevented:this.defaultPrevented,trusted:this.isTrusted});return v;};
 const focus=HTMLElement.prototype.focus;HTMLElement.prototype.focus=function(...a){log('focus-call',{target:node(this),stack:new Error().stack});const v=focus.apply(this,a);log('focus-return',{target:node(this)});return v;};
 const NativeMO=MutationObserver;window.MutationObserver=class extends NativeMO{constructor(cb){const stack=new Error().stack;super((mutations,observer)=>{log('mutation-callback',{count:mutations.length,attributes:mutations.map(m=>m.attributeName),stack});cb(mutations,observer);});}};
 for(const method of ['stopPropagation','stopImmediatePropagation']){const original=Event.prototype[method];Event.prototype[method]=function(...a){if(this.key==='Escape')log(method,{key:this.key,stack:new Error().stack});return original.apply(this,a);};}
 }
 for(const kind of ['keydown','keyup','focusin','focusout','pointerdown','pointerup','scroll','scrollend'])document.addEventListener(kind,e=>{if(kind==='keydown'&&e.key==='Escape')window.seventh.escapeDown=e;log(kind,{eventId:eventId(e),key:e.key,defaultPrevented:e.defaultPrevented,trusted:e.isTrusted,target:node(e.target),clientX:e.clientX,clientY:e.clientY});if(kind==='keydown'||kind==='keyup')queueMicrotask(()=>log(kind+'-microtask',{key:e.key,defaultPrevented:e.defaultPrevented,trusted:e.isTrusted}));},true);
}
module.exports={probe};
