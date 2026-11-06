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
module.exports={audit};
