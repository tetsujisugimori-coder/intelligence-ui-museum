'use strict';
// Round 13 schema 2: standalone page-serialized capture, based on the unchanged
// round 12 capture. Pseudo CSS is sampled independently of transition(), in the
// same synchronous evaluate as the adjacent snapshot state and timestamp.
function capture(trigger,sel){
 const roots=[...document.querySelectorAll(sel.root)],root=roots[0];
 const boxes=[...document.querySelectorAll(sel.checkbox)],hidden=[...document.querySelectorAll(sel.valueInput)];
 const triggers=[...document.querySelectorAll(sel.trigger)];
 const desc=e=>e?{tag:e.tagName,type:e.type??null,checked:e.checked??null,disabled:e.disabled??null,html:e.outerHTML,attrs:Object.fromEntries([...e.attributes].map(a=>[a.name,a.value])),rect:e.getBoundingClientRect().toJSON(),computed:{afterOutline:getComputedStyle(e,'::after').outline,afterShadow:getComputedStyle(e,'::after').boxShadow,display:getComputedStyle(e).display,outline:getComputedStyle(e).outline,boxShadow:getComputedStyle(e).boxShadow,visibility:getComputedStyle(e).visibility,position:getComputedStyle(e).position,opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform},focused:e===document.activeElement,focusVisible:e.matches(':focus-visible')}:null;
 const normalize=html=>html?.replaceAll(/(?:«|&laquo;|:)?r[a-z0-9]+(?:»|&raquo;|:)/g,'GENERATED_ID');
 const clone=root?.cloneNode(true);
 if(clone)for(const e of clone.querySelectorAll('.controls input[type="checkbox"],#official-select'))if(e.getAttribute('style')==='')e.removeAttribute('style');
 return {hasFocus:document.hasFocus(),visibility:document.visibilityState,time:performance.now(),html:normalize(root?.outerHTML),htmlNoEmptyStyle:normalize(clone?.outerHTML),rootCount:roots.length,styleNodeCount:boxes.length,hiddenCount:hidden.length,triggerCount:triggers.length,distinct:boxes[0]!==hidden[0],contained:!!root&&[boxes[0],hidden[0],trigger].every(e=>e&&root.contains(e)),disabled:boxes.map(desc),hidden:desc(hidden[0]),trigger:desc(trigger),active:desc(document.activeElement),focused:trigger===document.activeElement,focusVisible:trigger.matches(':focus-visible'),expanded:trigger.getAttribute('aria-expanded'),value:hidden[0]?.value,scroll:{x:scrollX,y:scrollY},viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,scale:visualViewport?.scale??null},font:getComputedStyle(document.documentElement).fontSize,theme:document.documentElement.dataset.theme};
}
module.exports={capture};
