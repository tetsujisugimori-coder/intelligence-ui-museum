'use strict';
const fourth=require('./fourth-trace-audit.cjs');
function traceAudit(t,level){const r=fourth.traceAudit(t,level);if(level==='full'){
 const es=t?.events||[],stack=[];let last=-Infinity,triggerCalls=0,listCalls=0;
 for(const e of es){
  if(!Number.isFinite(e.ms)||e.ms<last)r.push('EVENT_CLOCK_ORDER');last=e.ms;
  if(e.type==='focus-call-before'){
   if(typeof e.stack!=='string'||!e.stack.length||!Number.isSafeInteger(e.target?.identity))r.push('FOCUS_CALL_MALFORMED');
   stack.push(e);if(e.target?.id?.startsWith('select-trigger-'))triggerCalls++;if(e.target?.id?.startsWith('select-list-'))listCalls++;
  }
  if(e.type==='focus-call-after'){const before=stack.pop();if(!before||before.target?.identity!==e.target?.identity)r.push('FOCUS_CALL_PAIR');}
 }
 if(stack.length)r.push('FOCUS_CALL_PAIR');
 if(triggerCalls<1||listCalls<1)r.push('SELECT_FOCUS_CALLS_MISSING');
 for(const key of [' ','ArrowUp','Enter','Escape']){
  if(!es.some(e=>e.type==='keydown'&&e.key===key&&e.trusted===true)||!es.some(e=>e.type==='keyup'&&e.key===key&&e.trusted===true))r.push('TRUSTED_KEY_PAIR_MISSING:'+key);
 }
 }return [...new Set(r)];}
module.exports={traceAudit};
