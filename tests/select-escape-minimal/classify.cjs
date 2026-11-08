'use strict';
const CASES=Object.freeze(['controlled-cancel','controlled-plain','delegated-fallback','delegated-open','hook-cancel']);
const ROUTES=Object.freeze(['direct','tab']);
const skeletal=events=>(events||[]).filter(e=>e.kind!=='prevent-default').map(e=>[e.kind,e.owner,e.from,e.to,e.trusted,e.target].join('|'));
function validateRow(r){
  const errors=[];
  if(!r||typeof r!=='object')return ['identity','incomplete-or-pageerror'];
  if(!r||!CASES.includes(r.case)||!ROUTES.includes(r.route)||!['chromium','webkit'].includes(r.engine)||!Number.isInteger(r.iteration)||r.iteration<1)errors.push('identity');
  if(r?.status!=='COMPLETE'||!Array.isArray(r?.errors)||r.errors.length||r.error!=null||(r.exitCode!=null&&r.exitCode!==0))errors.push('incomplete-or-pageerror');
  if(!r?.sourceSha256||!/^[a-f0-9]{64}$/.test(r.sourceSha256)||!r?.pngSha256||!/^[a-f0-9]{64}$/.test(r.pngSha256))errors.push('missing-hash');
  if(r?.instrumentation!=null&&r.instrumentation!=='fixture-events-v1')errors.push('instrumentation-drift');
  const s=r?.snapshot;
  // The observation must exist, but its boolean value is an outcome, not an invariant.
  if(!s||!Object.hasOwn(s,'focusVisible')||typeof s.focusVisible!=='boolean')errors.push('focus-visible-observation');
  const ev=Array.isArray(s?.events)?s.events:[];
  const all=k=>ev.filter(e=>e.kind===k),idx=k=>ev.findIndex(e=>e.kind===k);
  const keydown=all('keydown-capture'),keyup=all('keyup'),bubble=all('keydown-bubble');
  if(keydown.length!==1||keyup.length!==1||bubble.length!==1||
    keydown[0]?.trusted!==true||keyup[0]?.trusted!==true||
    !(idx('keydown-capture')<idx('keydown-bubble')&&idx('keydown-bubble')<idx('keyup')))
    errors.push('event-order-or-trust');
  if(ev.some((e,i)=>!Number.isInteger(e.seq)||(i>0&&e.seq<=ev[i-1].seq)))errors.push('sequence-order');
  if(bubble[0]?.cancelled!==s?.keydownCancelled||
    all('prevent-default').length!==s?.preventCount||
    (s?.preventCount>0)!==s?.keydownCancelled)errors.push('cancellation-trace-contradiction');
  if(all('close-request').length!==s?.closeRequests||all('focus-return').length!==s?.focusReturns)
    errors.push('trace-counter-contradiction');
  if(r?.case!=='delegated-open'){
    const owners={'controlled-cancel':'select-controlled','controlled-plain':'select-controlled','delegated-fallback':'fallback-model','hook-cancel':'hook'};
    if(all('close-request').length!==1||all('close-commit').length!==1||
      all('close-request')[0]?.owner!==owners[r?.case]||all('close-commit')[0]?.owner!==owners[r?.case]||
      all('focus-return').length!==1||all('focus-return')[0]?.owner!=='model-mutation'||
      !(idx('keydown-capture')<idx('close-request')&&idx('close-request')<idx('close-commit')&&idx('close-commit')<idx('focus-return')&&idx('focus-return')<idx('keyup'))||
      !ev.some(e=>e.kind==='mutation'&&e.from===true&&e.to===false)||
      !ev.some(e=>e.kind==='focusin'&&e.target==='trigger'))errors.push('closure-trace');
    const mi=ev.findIndex(e=>e.kind==='mutation'&&e.from===true&&e.to===false);
    const fi=ev.findIndex(e=>e.kind==='focusin'&&e.target==='trigger');
    if(!(idx('close-commit')<mi&&mi<fi&&fi<idx('focus-return')))errors.push('mutation-focus-order');
    const handler=r.case==='delegated-fallback'?'fallback-handler':r.case==='hook-cancel'?'hook-handler':'select-handler';
    if(all(handler).length!==1||!(idx('keydown-capture')<idx(handler)&&idx(handler)<idx('close-request')))errors.push('handler-order');
    if(s?.keydownCancelled){
      const owner=r.case==='delegated-fallback'?'fallback-model':r.case==='hook-cancel'?'hook':'select';
      if(all('prevent-default').length!==1||all('prevent-default')[0]?.owner!==owner||
        !(idx(handler)<idx('prevent-default')&&idx('prevent-default')<idx('close-request')))errors.push('prevent-owner-order');
    }
  }else if(all('close-request').length||all('close-commit').length||all('focus-return').length)errors.push('unexpected-open-control-close');

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
  if(a?.snapshot?.config&&b?.snapshot?.config){
    const expectedA={select:true,selectCancel:true,hook:false,fallback:false};
    const expectedB={select:true,selectCancel:false,hook:false,fallback:false};
    if(JSON.stringify(a.snapshot.config)!==JSON.stringify(expectedA)||JSON.stringify(b.snapshot.config)!==JSON.stringify(expectedB))errors.push('config-drift');
  }else errors.push('config-unverified');
  for(const k of ['engine','route','iteration','sourceSha256'])if(a?.[k]!==b?.[k])errors.push('provenance-'+k);
  if(JSON.stringify(skeletal(a?.snapshot?.events))!==JSON.stringify(skeletal(b?.snapshot?.events)))errors.push('event-route-diff');
  const outcomes={
    focusVisibleCancel:a?.snapshot?.focusVisible??null,
    focusVisiblePlain:b?.snapshot?.focusVisible??null,
    focusVisibleDiff:a?.snapshot?.focusVisible!==b?.snapshot?.focusVisible,
    renderedPngDiff:a?.pngSha256!==b?.pngSha256
  };
  return {classification:errors.length?'NOT_COMPARABLE':'MODEL_COMPARABLE',scope:'MODEL_ONLY_NOT_SDK_CAUSAL',outcomes,errors};
}
module.exports={CASES,ROUTES,validateRow,comparePair};
