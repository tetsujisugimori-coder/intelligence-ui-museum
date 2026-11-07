'use strict';
function probe(){
 const events=[];let seq=0;window.sixth={events,overflow:false};
 const node=e=>e?{tag:e.tagName,id:e.id,role:e.getAttribute?.('role')}:null;
 const state=()=>{const t=document.querySelector('#Select .stage [role=button]');return {active:node(document.activeElement),focusVisible:t?.matches(':focus-visible'),expanded:t?.getAttribute('aria-expanded'),outline:t?getComputedStyle(t).outline:null,rect:t?.getBoundingClientRect().toJSON(),scrollX,scrollY};};
 const log=(kind,data={})=>{if(events.length>=20000){window.sixth.overflow=true;return;}events.push({seq:++seq,ms:performance.now(),kind,...state(),...data});};window.sixth.log=log;window.sixth.sample=kind=>log(kind,{key:window.sixth.lastKey?.key,defaultPrevented:window.sixth.lastKey?.defaultPrevented,trusted:window.sixth.lastKey?.isTrusted});
 const pd=Event.prototype.preventDefault;Event.prototype.preventDefault=function(...a){if(this.key==='Escape')log('preventDefault-before',{key:this.key,defaultPrevented:this.defaultPrevented,trusted:this.isTrusted,stack:new Error().stack});const v=pd.apply(this,a);if(this.key==='Escape')log('preventDefault-after',{key:this.key,defaultPrevented:this.defaultPrevented,trusted:this.isTrusted});return v;};
 const focus=HTMLElement.prototype.focus;HTMLElement.prototype.focus=function(...a){log('focus-call',{target:node(this),stack:new Error().stack});const v=focus.apply(this,a);log('focus-return',{target:node(this)});return v;};
 const NativeMO=MutationObserver;window.MutationObserver=class extends NativeMO{constructor(cb){const stack=new Error().stack;super((mutations,observer)=>{log('mutation-callback',{count:mutations.length,attributes:mutations.map(m=>m.attributeName),stack});cb(mutations,observer);});}};
 for(const kind of ['keydown','keyup','focusin','focusout','pointerdown','pointerup','scroll','scrollend'])document.addEventListener(kind,e=>{if(kind==='keydown'||kind==='keyup')window.sixth.lastKey=e;log(kind,{key:e.key,defaultPrevented:e.defaultPrevented,trusted:e.isTrusted,target:node(e.target),clientX:e.clientX,clientY:e.clientY});if(kind==='keydown'||kind==='keyup')queueMicrotask(()=>log(kind+'-microtask',{key:e.key,defaultPrevented:e.defaultPrevented,trusted:e.isTrusted}));},true);
}
module.exports={probe};
