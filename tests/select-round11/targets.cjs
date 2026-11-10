'use strict';
const plan=require('./plan.json');
const selectors=plan.domTargets;
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
function styleState(e){return !has(e?.attrs,'style')?'ABSENT':e.attrs.style===''?'EMPTY':'NONEMPTY'}
// Serialized into the page: all DOM queries, including the intervention, use the
// preregistered selectors. The SDK value input is visually hidden, type=text.
function capture(trigger,sel){
 const roots=[...document.querySelectorAll(sel.root)],root=roots[0];
 const boxes=[...document.querySelectorAll(sel.checkbox)],hidden=[...document.querySelectorAll(sel.valueInput)];
 const triggers=[...document.querySelectorAll(sel.trigger)];
 const desc=e=>e?{tag:e.tagName,type:e.type??null,checked:e.checked??null,disabled:e.disabled??null,html:e.outerHTML,attrs:Object.fromEntries([...e.attributes].map(a=>[a.name,a.value])),rect:e.getBoundingClientRect().toJSON(),computed:{display:getComputedStyle(e).display,outline:getComputedStyle(e).outline,visibility:getComputedStyle(e).visibility,position:getComputedStyle(e).position,opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform},focused:e===document.activeElement,focusVisible:e.matches(':focus-visible')}:null;
 const normalize=html=>html?.replaceAll(/(?:«|&laquo;|:)?r[a-z0-9]+(?:»|&raquo;|:)/g,'GENERATED_ID');
 const clone=root?.cloneNode(true);
 if(clone)for(const e of clone.querySelectorAll('.controls input[type="checkbox"],#official-select'))if(e.getAttribute('style')==='')e.removeAttribute('style');
 return {hasFocus:document.hasFocus(),visibility:document.visibilityState,time:performance.now(),html:normalize(root?.outerHTML),htmlNoEmptyStyle:normalize(clone?.outerHTML),rootCount:roots.length,styleNodeCount:boxes.length,hiddenCount:hidden.length,triggerCount:triggers.length,distinct:boxes[0]!==hidden[0],contained:!!root&&[boxes[0],hidden[0],trigger].every(e=>e&&root.contains(e)),disabled:boxes.map(desc),hidden:desc(hidden[0]),trigger:desc(trigger),active:desc(document.activeElement),focused:trigger===document.activeElement,focusVisible:trigger.matches(':focus-visible'),expanded:trigger.getAttribute('aria-expanded'),value:hidden[0]?.value,scroll:{x:scrollX,y:scrollY},viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,scale:visualViewport?.scale??null},font:getComputedStyle(document.documentElement).fontSize,theme:document.documentElement.dataset.theme};
}
function snapshotErrors(s){
 const e=[],check=(ok,n)=>{if(!ok)e.push(n)};
 if(!s||typeof s!=='object')return ['missing'];
 check(s.hasFocus===true&&s.visibility==='visible','document-focus-visibility');
 check(typeof s.html==='string'&&s.html.length>0&&typeof s.htmlNoEmptyStyle==='string'&&Number.isFinite(s.time),'content');
 check(s.rootCount===1&&s.styleNodeCount===1&&s.hiddenCount===1&&s.triggerCount===1&&s.distinct===true&&s.contained===true,'marker-identity');
 check(Array.isArray(s.disabled)&&s.disabled.length===1,'checkbox-count');
 const c=s.disabled?.[0],h=s.hidden,t=s.trigger;
 check(c?.tag==='INPUT'&&c.type==='checkbox'&&c.attrs?.type==='checkbox'&&c.checked===false&&c.disabled===false,'checkbox-type-state');
 check(h?.tag==='INPUT'&&h.type==='text'&&!has(h.attrs,'type')&&h.attrs?.id==='official-select'&&h.attrs?.['aria-hidden']==='true'&&h.attrs?.tabindex==='-1'&&h.attrs?.value==='a'&&h.disabled===false,'value-input-type-state');
 check(c&&Object.keys(c.attrs||{}).every(k=>['type','style'].includes(k)),'checkbox-attributes');
 check(h&&Object.keys(h.attrs||{}).sort().join(',')===(has(h.attrs,'style')?'aria-hidden,class,id,style,tabindex,value':'aria-hidden,class,id,tabindex,value')&&h.attrs.class==='sr-only w-full h-0 left-0 bottom-0 pointer-events-none','value-input-attributes');
 check(styleState(c)!=='NONEMPTY'&&styleState(h)!=='NONEMPTY','nonempty-marker-style');
 check(t?.attrs?.role==='button'&&t.attrs['aria-disabled']==='false'&&typeof t.attrs.id==='string','trigger-identity');
 check(typeof s.focused==='boolean'&&typeof s.focusVisible==='boolean'&&(!s.focusVisible||s.focused)&&t?.focused===s.focused&&t?.focusVisible===s.focusVisible,'focus-state');
 check(s.focused===(s.active?.attrs?.id===t?.attrs?.id)&&s.expanded===t?.attrs?.['aria-expanded']&&['true','false'].includes(s.expanded),'active-expanded');
 for(const el of [c,h,t])check(el&&typeof el.html==='string'&&el.rect&&['x','y','width','height'].every(k=>Number.isFinite(el.rect[k]))&&el.computed&&['display','outline','visibility','position','opacity','transform'].every(k=>typeof el.computed[k]==='string'),'element-evidence');
 check(s.value==='a'&&s.viewport?.width===375&&s.viewport?.height===1000&&s.viewport?.dpr===1&&s.font==='16px'&&s.theme==='light'&&Number.isFinite(s.scroll?.x)&&Number.isFinite(s.scroll?.y),'environment');
 return e;
}
function requireSnapshot(s){const e=snapshotErrors(s);if(e.length)throw Error('snapshot: '+e.join(','));return s}
module.exports={selectors,capture,snapshotErrors,requireSnapshot,styleState};
