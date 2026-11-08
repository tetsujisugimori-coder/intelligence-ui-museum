'use strict';
const assert=require('node:assert/strict');
const invariantKeys=['engine','route','iteration','measurement','phase','buildHash','sourceHash'];
function validate(row){const e=[];const r=row?.result;
 if(row?.status!=='COMPLETE'||!Array.isArray(row.errors)||row.errors.length||row.error||(row.exitCode!=null&&row.exitCode!==0))e.push('execution');
 if(!['chromium','webkit'].includes(row?.engine)||!['direct','tab'].includes(row?.route)||!['none','minimal','detail'].includes(row?.measurement)||!['pilot','formal'].includes(row?.phase)||!Number.isInteger(row?.iteration)||row.iteration<1)e.push('identity');
 for(const k of ['buildHash','sourceHash'])if(!/^[a-f0-9]{64}$/.test(row?.[k]||''))e.push('hash:'+k);
 if(!['native','paired-cancel','paired-plain'].includes(row?.condition))e.push('condition');
 if(r?.runtimeCondition!==row.condition||r?.runtimeMeasurement!==row.measurement)e.push('runtime-config');
 if(!r||r.expanded!=='false'||r.popupPresent!==false||r.focused!==true||r.value!=='a'||r.pageErrors!==0)e.push('closed-value-focus');
 if(typeof row?.before?.triggerOuterHTML!=='string'||!row.before.triggerOuterHTML.length||!/^[a-f0-9]{64}$/.test(row?.before?.cssHash||''))e.push('DOM-CSS-evidence');
 if(!Array.isArray(r?.events))e.push('event-evidence');
 if(!row?.before?.popupPresent||row.before.expanded!=='true')e.push('popup-not-opened');
 if(row?.measurement==='none'&&r?.events?.length)e.push('unexpected-measurement');
 if(row?.measurement!=='none'){const ev=r?.events||[],one=k=>ev.filter(x=>x.kind===k),ix=k=>ev.findIndex(x=>x.kind===k);if(one('keydown').length!==1||one('keyup').length!==1||one('keydown-final').length!==1||!(ix('keydown')<ix('keydown-final')&&ix('keydown-final')<ix('keyup'))||one('keydown')[0]?.trusted!==true||one('keyup')[0]?.trusted!==true||one('keydown-final')[0]?.cancelled!==(row.condition!=='paired-plain'))e.push('key-evidence');}
 if(row?.measurement==='detail'){
 const es=r?.events||[],get=k=>es.filter(x=>x.kind===k),ix=k=>es.findIndex(x=>x.kind===k);
 for(const k of ['keydown','keyup','keydown-final','radix-escape','select-escape-before','select-escape-after','radix-fallback-gate','stack-before','stack-after','esc-stack-close','museum-focus-return'])if(get(k).length!==1)e.push('event-count:'+k);
 if(get('radix-fallback').length)e.push('fallback');
 const close=get('react-close-request').filter(x=>x.nextState===false);
 if(close.length!==1)e.push('close-count');
 const ci=es.findIndex(e=>e.kind==='react-close-request'&&e.nextState===false),mo=es.findIndex((e,i)=>i>ci&&e.kind==='museum-observer'),dom=es.findIndex((e,i)=>i>ci&&e.kind==='observer-dom'&&e.popup===false);
 if(!(ix('esc-stack-close')<ci&&ci<mo&&mo<ix('museum-focus-return')&&ci<dom&&dom<ix('keyup')))e.push('close-observer-order');
 if(get('select-escape-before')[0]?.cancelled!==false||get('radix-escape')[0]?.cancelled!==false||get('stack-before')[0]?.cancelled!==(row.condition!=='paired-plain'))e.push('cancel-before-contradiction');
 if(!(ix('keydown')<ix('radix-escape')&&ix('radix-escape')<ix('select-escape-before')&&ix('select-escape-before')<ix('stack-before')&&ix('stack-before')<ix('esc-stack-close')&&ix('esc-stack-close')<ix('museum-focus-return')&&ix('museum-focus-return')<ix('keyup')&&ix('keydown-final')<ix('keyup')))e.push('event-order');
 const chain=['keydown','radix-escape','select-escape-before','select-escape-after','radix-fallback-gate','stack-before','stack-after','esc-stack-close'];
 if(chain.some((k,i)=>i>0&&ix(chain[i-1])>=ix(k)))e.push('callsite-order');
 const li=es.findIndex((x,i)=>i>ci&&x.kind==='react-layout-after-commit'&&x.open===false);
 if(!(ci<li&&li<mo&&li<dom))e.push('react-layout-order');
 for(const call of get('cancel-call')){const i=es.indexOf(call),before=call.owner==='select'?'select-escape-before':'stack-before',after=call.owner==='select'?'select-escape-after':'stack-after';if(!(ix(before)<i&&i<ix(after)))e.push('cancel-call-order');}
 const selectSource='@openai/apps-sdk-ui/dist/es/components/Select/Select.js',stackSource='@openai/apps-sdk-ui/dist/es/hooks/useEscCloseStack.js',radixSource='@openai/apps-sdk-ui/node_modules/radix-ui/node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs';
 const sourceFor=k=>['select-escape-before','select-escape-after','react-close-request','react-layout-after-commit','esc-stack-close','radix-on-open-change'].includes(k)?selectSource:['stack-before','stack-after'].includes(k)?stackSource:['radix-escape','radix-fallback-gate','radix-fallback'].includes(k)?radixSource:['museum-observer','museum-focus-return'].includes(k)?'select-focus-return.ts':null;
 for(const x of es){const source=x.kind==='cancel-call'?(x.owner==='select'?selectSource:stackSource):sourceFor(x.kind);if(source&&x.source!==source)e.push('callsite-source');}
 if(es.some((x,i)=>!Number.isInteger(x.seq)||!Number.isFinite(x.time)||(i>0&&(x.seq<=es[i-1].seq||x.time<es[i-1].time))))e.push('time-sequence');
 const yes=row.condition!=='paired-plain',calls=get('cancel-call');
 if(get('keydown-final')[0]?.cancelled!==yes||get('select-escape-after')[0]?.cancelled!==yes||get('stack-after')[0]?.cancelled!==yes||calls.length!==(row.condition==='native'?2:yes?1:0))e.push('cancellation');
 if(calls.filter(x=>x.owner==='select').length!==(yes?1:0)||calls.filter(x=>x.owner==='esc-stack').length!==(row.condition==='native'?1:0)||calls.some(x=>!['select','esc-stack'].includes(x.owner)))e.push('cancel-owner-count');
 if(get('radix-fallback-gate')[0]?.cancelled!==yes||get('radix-fallback-gate')[0]?.hasDismiss!==true)e.push('fallback-state');
 if(row.condition!=='native'&&calls.some(x=>x.owner!=='select'))e.push('cancel-origin');
 if(get('keydown')[0]?.trusted!==true||get('keyup')[0]?.trusted!==true)e.push('untrusted');
 if(row.condition!=='native'&&get('radix-fallback-gate')[0]?.suppressed!==true)e.push('fallback-gate');
 }
 return e;
}
function compare(a,b){const errors=[...validate(a).map(x=>'A:'+x),...validate(b).map(x=>'B:'+x)];
 if(a?.condition!=='paired-cancel'||b?.condition!=='paired-plain')errors.push('pair');
 for(const k of invariantKeys)if(a?.[k]!==b?.[k]||a?.[k]==null)errors.push('provenance:'+k);
 for(const k of ['triggerOuterHTML','cssHash'])if(a?.before?.[k]!==b?.before?.[k])errors.push('DOM-CSS:'+k);
 if(a?.measurement!=='detail'||b?.measurement!=='detail')errors.push('callsite-not-observed');
 const skeleton=r=>(r?.result?.events||[]).filter(e=>!['cancel-call','observer-dom','focusin','museum-observer'].includes(e.kind)).map(e=>[e.kind,e.nextState??null]);
 if(JSON.stringify(skeleton(a))!==JSON.stringify(skeleton(b)))errors.push('closure-path');
 return {scope:'COMMON_INTERVENTION_SDK_ONLY',classification:errors.length?'NOT_COMPARABLE':'COMPARABLE_WITH_COMMON_INTERVENTIONS',unalteredSdkCausality:'UNKNOWN',errors,outcomes:{focusVisible:[a?.result?.focusVisible,b?.result?.focusVisible],pngHashEqual:a?.pngSha256===b?.pngSha256}};
}
module.exports={validate,compare};
