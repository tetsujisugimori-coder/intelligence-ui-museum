'use strict';
const fourth=require('./fourth-trace-audit.cjs');
function causalAudit(t){const r=[];
 const es=t?.events||[],stack=[];let last=-Infinity,triggerCalls=0,listCalls=0;
 for(const e of es){
  if(!Number.isFinite(e.ms)||e.ms<last)r.push('EVENT_CLOCK_ORDER');last=e.ms;
  if(e.type==='focus-call-before'){
   if(typeof e.stack!=='string'||!e.stack.length||!Number.isSafeInteger(e.target?.identity))r.push('FOCUS_CALL_MALFORMED');
   stack.push(e);if(e.target?.id?.startsWith('select-trigger-'))triggerCalls++;if(e.target?.id?.startsWith('select-list-'))listCalls++;
  }
  if(e.type==='focus-call-after'){const before=stack.pop();if(!before||JSON.stringify(before.target)!==JSON.stringify(e.target))r.push('FOCUS_CALL_PAIR');}
 }
 if(stack.length)r.push('FOCUS_CALL_PAIR');
 if(triggerCalls<1||listCalls<1)r.push('SELECT_FOCUS_CALLS_MISSING');
 for(const key of [' ','ArrowUp','Enter','Escape']){
  const ds=es.filter(e=>e.type==='keydown'&&e.key===key&&e.trusted===true),us=es.filter(e=>e.type==='keyup'&&e.key===key&&e.trusted===true);if(!ds.length||ds.length!==us.length||ds.some((d,i)=>!us[i]||d.ms>us[i].ms||(ds[i+1]&&us[i].ms>ds[i+1].ms)))r.push('TRUSTED_KEY_PAIR_MISSING:'+key);
 }
 let prev=-Infinity;for(const f of t?.frames||[]){if(!Number.isFinite(f.ms)||f.ms<prev)r.push('FRAME_CLOCK_ORDER');prev=f.ms;}if(!Number.isFinite(t?.final?.ms)||t.final.ms<Math.max(last,prev))r.push('FINAL_CLOCK_ORDER');
 return [...new Set(r)];}
function traceAudit(t,level){return [...new Set([...fourth.traceAudit(t,level),...(level==='full'?causalAudit(t):[])])];}
module.exports={traceAudit,causalAudit};
