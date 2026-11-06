'use strict';
function audit(result,expected,processResult){
 const reasons=[];
 if(processResult.error||processResult.signal||![0,1].includes(processResult.status))reasons.push('PROCESS_ABNORMAL');
 if(!result||!Array.isArray(result.rows)||!Array.isArray(result.failures))return [...reasons,'RESULT_MISSING'];
 for(const key of ['head','tree','runner'])if(result[key]!==expected[key])reasons.push(key.toUpperCase()+'_MISMATCH');
 if(JSON.stringify(result.source)!==JSON.stringify(expected.source))reasons.push('SOURCE_MISMATCH');
 if(result.failures.length)reasons.push('RUN_FAILURE');
 if(result.rows.length!==expected.ids.length||new Set(result.rows.map(r=>r.id)).size!==expected.ids.length||result.rows.some((r,i)=>r.id!==expected.ids[i]))reasons.push('CONDITION_IDS_MISMATCH');
 for(const row of result.rows){
  if(!Array.isArray(row.errors)||row.errors.length)reasons.push('PAGEERROR_OR_MISSING');
  if(!Array.isArray(row.checks)||!row.checks.find(c=>c.name==='Select')||!['environment','layout','Button','Badge','Alert','Switch'].every(name=>row.checks.some(c=>c.name===name)))reasons.push('CHECKS_INCOMPLETE');
 }
 return [...new Set(reasons)];
}
function traceAudit(t,level){
 const reasons=[];
 if(!t||t.collectionError||!t.final)reasons.push('TRACE_FINAL_MISSING');
 if(!t||t.level!==level)reasons.push('TRACE_LEVEL_MISMATCH');
 if(level!=='none'){
  if(!Array.isArray(t?.events)||!t.events.some(e=>e.type==='focusin')||!t.events.some(e=>e.type==='keydown'&&e.key===' '))reasons.push('TRACE_EVENTS_INCOMPLETE');
  if(t?.overflow)reasons.push('TRACE_OVERFLOW');
  if(level==='full'){
   if(!Array.isArray(t?.frames)||!t.frames.some(f=>f.trigger&&Number.isFinite(f.ms)&&Number.isFinite(f.scrollY)))reasons.push('TRACE_RAF_MISSING');
   if(!t?.events?.some(e=>e.option&&e.popup&&e.trigger&&e.expanded==='true'))reasons.push('TRACE_POPUP_GEOMETRY_MISSING');
   if(!t?.final?.triggerId||typeof t.final.hasFocus!=='boolean')reasons.push('TRACE_FINAL_IDENTITY_MISSING');
  }
 }
 return reasons;
}
module.exports={audit,traceAudit};
