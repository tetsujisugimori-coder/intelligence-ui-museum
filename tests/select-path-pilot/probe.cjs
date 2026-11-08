'use strict';
function probe(){
 const w=window; w.__path={events:[],overflow:false,seq:0};
 const identify=e=>e?{tag:e.tagName,id:e.id||null,role:e.getAttribute?.('role'),option:e.getAttribute?.('data-option-id'),text:(e.textContent||'').slice(0,60)}:null;
 const box=e=>e?e.getBoundingClientRect().toJSON():null;
 function sample(kind,extra={}){if(w.__path.events.length>=30000){w.__path.overflow=true;return;}const t=document.querySelector('#Select .stage [role=button],[data-parity-trigger]'),o=document.querySelector('[role=option][data-option-id="b"]')||document.querySelector('[role=option]');let popup=o;while(popup&&popup!==document.body&&!['fixed','absolute'].includes(getComputedStyle(popup).position))popup=popup.parentElement;
 const r=o?.getBoundingClientRect();const point=r?{x:r.x+r.width/2,y:r.y+r.height/2}:null;
 w.__path.events.push({seq:++w.__path.seq,time:performance.now(),kind,...extra,active:identify(document.activeElement),trigger:box(t),option:box(o),popup:box(popup===document.body?null:popup),expanded:t?.getAttribute('aria-expanded')??null,focusVisible:t?t.matches(':focus-visible'):null,scroll:{x:scrollX,y:scrollY},viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,visual:visualViewport?{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale,offsetLeft:visualViewport.offsetLeft,offsetTop:visualViewport.offsetTop}:null},hit:point?identify(document.elementFromPoint(point.x,point.y)):null});}
 w.__path.sample=sample;
 for(const kind of ['focus','blur','focusin','focusout','keydown','keyup','pointerdown','pointerup','click','scroll','scrollend'])document.addEventListener(kind,e=>sample(kind,{target:identify(e.target),key:e.key??null,trusted:e.isTrusted,defaultPrevented:e.defaultPrevented,clientX:e.clientX??null,clientY:e.clientY??null}),true);
 new MutationObserver(()=>sample('mutation')).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-expanded','style','data-highlight']});
 document.addEventListener('DOMContentLoaded',()=>sample('dom-ready'));
}
module.exports={probe};
