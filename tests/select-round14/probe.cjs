'use strict';
// Diagnostic-only observation hook. Not installed in measurement arms or caller OFF.
function probe(){
 const state=window.__round14={events:[],calls:[],overflow:false};
 const desc=e=>!e?null:e.id?'#'+e.id:e.matches?.('#Select .stage [role=button]')?'SELECT_TRIGGER':e.matches?.('[role=option]')?'OPTION':e.tagName;
 const record=(type,details={})=>{if(state.events.length>=5000){state.overflow=true;return}state.events.push({seq:state.events.length,time:performance.now(),type,active:desc(document.activeElement),...details})};
 const nativeFocus=HTMLElement.prototype.focus;
 HTMLElement.prototype.focus=function(...args){
  const call={index:state.calls.length,time:performance.now(),target:desc(this),stack:new Error('round14-focus').stack||null,args:args.map(a=>a??null)};
  state.calls.push(call);record('focus-call',{index:call.index,target:call.target});
  try{return nativeFocus.apply(this,args)}finally{call.end=performance.now();call.activeAfter=desc(document.activeElement);record('focus-return',{index:call.index})}
 };
 for(const type of ['keydown','keyup','focusout','blur','focusin','focus'])document.addEventListener(type,event=>{
  record(type,{target:desc(event.target),key:event.key||null,trusted:event.isTrusted});
  if(type==='keydown'&&event.key==='Escape'){
   queueMicrotask(()=>record('microtask-after-escape'));
   setTimeout(()=>record('task-after-escape'),0);
   requestAnimationFrame(()=>record('frame-after-escape'));
  }
 },true);
 new MutationObserver(records=>{
  for(const r of records){
   if(r.type==='attributes'&&r.target.matches?.('#Select .stage [role=button]'))record('trigger-mutation',{attribute:r.attributeName,expanded:r.target.getAttribute('aria-expanded')});
   else if(r.type==='childList'&&[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.('[role=listbox],[role=option]')||n.querySelector?.('[role=listbox],[role=option]'))))record('menu-dom-change',{added:r.addedNodes.length,removed:r.removedNodes.length});
  }
 }).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-expanded','data-state']});
 record('installed');
}
module.exports={probe};
