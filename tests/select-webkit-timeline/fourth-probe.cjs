'use strict';
// Optional instrumentation. No SDK/product mutation. All hooks are recorded as interventions.
function installProbe(level) {
  const events=[], frames=[]; let overflow=false, opener=null, seq=0;
  const ids=new WeakMap(); const id=e=>{if(!e)return null;if(!ids.has(e))ids.set(e,++seq);return {identity:ids.get(e),tag:e.tagName,id:e.id,role:e.getAttribute?.('role')};};
  const geometry=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e),x=r.left+r.width/2,y=r.top+r.height/2,hit=document.elementFromPoint(x,y);return {rect:r.toJSON(),position:s.position,transform:s.transform,overflow:s.overflow,visibility:s.visibility,inViewport:r.width>0&&r.height>0&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,hit:id(hit),clickable:!!hit&&(hit===e||e.contains(hit))};};
  const take=type=>{const t=document.querySelector('#Select .stage [role=button]'),o=[...document.querySelectorAll('[role=option]')].find(e=>e.textContent.trim()==='カード');if(t&&!opener)opener=t;let popup=o?.parentElement;while(popup&&popup!==document.body&&!['fixed','absolute'].includes(getComputedStyle(popup).position))popup=popup.parentElement;
    return {type,ms:performance.now(),scrollX,scrollY,hasFocus:document.hasFocus(),visibility:document.visibilityState,viewport:{width:innerWidth,height:innerHeight,offsetTop:visualViewport?.offsetTop,pageTop:visualViewport?.pageTop,scale:visualViewport?.scale},active:id(document.activeElement),triggerId:id(t),sameOpener:t===opener,focusOnTrigger:t===document.activeElement,focusVisible:t?.matches(':focus-visible'),expanded:t?.getAttribute('aria-expanded'),value:document.querySelector('#official-select')?.value,trigger:geometry(t),option:geometry(o),popup:geometry(popup===document.body?null:popup)};};
  const record=(type,extra={})=>{if(events.length>=10000){overflow=true;return;}events.push(level==='events'?{type,ms:performance.now(),scrollX,scrollY,active:id(document.activeElement),hasFocus:document.hasFocus(),...extra}:{...take(type),...extra});};
  for(const name of ['focusin','focusout','keydown','keyup','pointerdown','pointerup','click','scroll'])document.addEventListener(name,e=>record(name,{key:e.key,code:e.code,target:id(e.target),optionTarget:id(e.target.closest?.('[role=option]')),trusted:e.isTrusted,clientX:e.clientX,clientY:e.clientY,button:e.button,pointerType:e.pointerType,hitAtInput:Number.isFinite(e.clientX)?id(document.elementFromPoint(e.clientX,e.clientY)):null,hitOptionAtInput:Number.isFinite(e.clientX)?id(document.elementFromPoint(e.clientX,e.clientY)?.closest?.('[role=option]')):null}),true);
  const observer=new MutationObserver(ms=>{if(ms.some(m=>m.target.closest?.('#Select')||[...m.addedNodes,...m.removedNodes].some(n=>n.querySelector?.('[role=option]')||n.getAttribute?.('role')==='option')))record('select-mutation',{added:ms.flatMap(m=>[...m.addedNodes].filter(n=>n.nodeType===1).map(id)),removed:ms.flatMap(m=>[...m.removedNodes].filter(n=>n.nodeType===1).map(id))});});
  if(level==='full')observer.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-expanded','style','data-state']});
  if(level==='full'){
    const original=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(...args){record('scrollIntoView',{target:id(this),arguments:args});return original.apply(this,args);};
    const tick=()=>{if(frames.length<6000)frames.push(take('raf'));else overflow=true;requestAnimationFrame(tick);};requestAnimationFrame(tick);
  }
  window.__thirdProbe={take,collect:()=>({level,events,frames,overflow,final:take('final')})};
}
module.exports={installProbe};
