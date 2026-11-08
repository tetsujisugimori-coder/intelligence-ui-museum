'use strict';
const CASES=Object.freeze(['controlled-cancel','controlled-plain','delegated-fallback','delegated-open','hook-cancel']);
const ROUTES=Object.freeze(['direct','tab']);
const skeletal=events=>(events||[]).filter(e=>e.kind!=='prevent-default').map(e=>[e.kind,e.owner,e.from,e.to,e.trusted,e.target].join('|'));
function validateRow(r){
  const errors=[];
  if(!r||!CASES.includes(r.case)||!ROUTES.includes(r.route)||!['chromium','webkit'].includes(r.engine)||!Number.isInteger(r.iteration)||r.iteration<1)errors.push('identity');
  if(r?.status!=='COMPLETE'||r?.errors?.length)errors.push('incomplete-or-pageerror');
  if(!r?.sourceSha256||!/^[a-f0-9]{64}$/.test(r.sourceSha256)||!r?.pngSha256||!/^[a-f0-9]{64}$/.test(r.pngSha256))errors.push('missing-hash');
  const s=r?.snapshot;
  if(s?.case!==r?.case||s?.keydownTrusted!==true)errors.push('untrusted-or-mismatched');
  if(!Array.isArray(s?.events)||s.events.filter(e=>e.kind==='keydown-capture').length!==1||s.events.filter(e=>e.kind==='keyup').length!==1)errors.push('event-pair');
  if(s?.value!=='a')errors.push('value');
  if(r?.case==='controlled-cancel'||r?.case==='controlled-plain'){
    if(s?.closeOwner!=='select-controlled'||s?.open!==false||s?.expanded!=='false'||s?.triggerFocused!==true||s?.focusReturns!==1||s?.closeRequests!==1)errors.push('controlled-closure-or-return');
    if(s?.keydownCancelled!==(r.case==='controlled-cancel')||s?.preventCount!==(r.case==='controlled-cancel'?1:0))errors.push('controlled-cancellation');
    if(s?.events.some(e=>e.kind==='fallback-handler'||e.kind==='hook-handler'))errors.push('unexpected-substitute');
  }else if(r?.case==='delegated-fallback'){
    if(s?.closeOwner!=='fallback-model'||s?.keydownCancelled!==true||s?.closeRequests!==1||s?.focusReturns!==1||s?.open!==false)errors.push('fallback-model-not-observed');
  }else if(r?.case==='delegated-open'){
    if(s?.closeOwner!==null||s?.keydownCancelled!==false||s?.closeRequests!==0||s?.open!==true)errors.push('unhandled-control-mismatch');
  }else if(r?.case==='hook-cancel'){
    if(s?.closeOwner!=='hook'||s?.keydownCancelled!==true||s?.preventCount!==1||s?.open!==false||s?.focusReturns!==1)errors.push('hook-model-mismatch');
  }
  return errors;
}
function comparePair(a,b){
  const errors=[...validateRow(a).map(x=>'A:'+x),...validateRow(b).map(x=>'B:'+x)];
  if(a?.case!=='controlled-cancel'||b?.case!=='controlled-plain')errors.push('wrong-pair');
  for(const k of ['engine','route','iteration','sourceSha256'])if(a?.[k]!==b?.[k])errors.push('provenance-'+k);
  if(a?.snapshot?.focusVisible!==b?.snapshot?.focusVisible)errors.push('focus-visible-diff');
  if(a?.pngSha256!==b?.pngSha256)errors.push('render-diff');
  if(JSON.stringify(skeletal(a?.snapshot?.events))!==JSON.stringify(skeletal(b?.snapshot?.events)))errors.push('event-route-diff');
  return {classification:errors.length?'NOT_COMPARABLE':'MODEL_COMPARABLE',scope:'MODEL_ONLY_NOT_SDK_CAUSAL',errors};
}
module.exports={CASES,ROUTES,validateRow,comparePair};
