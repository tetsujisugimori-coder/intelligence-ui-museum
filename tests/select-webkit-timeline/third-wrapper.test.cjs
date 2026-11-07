'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const cases={normal:null,'console-null':'CONSOLE_ERROR_OR_MISSING','images-invalid':'SELECT_UNEXPECTED_FAILURE','receipt-coordinate':'SELECT_UNEXPECTED_FAILURE','receipt-token':'SELECT_UNEXPECTED_FAILURE','paint-tamper':'EVIDENCE_PAINT_MISMATCH','Button-false':'REQUIRED_CHECK_FAILED:Button','environment-false':'REQUIRED_CHECK_FAILED:environment',missing:'CHECKS_INCOMPLETE',duplicate:'CHECKS_DUPLICATE','status-contradiction':'ROW_STATUS_MISMATCH','unexpected-select':'SELECT_UNEXPECTED_FAILURE',substring:'SELECT_UNEXPECTED_FAILURE','exit-contradiction':'PROCESS_STATUS_MISMATCH',pageerror:'PAGEERROR_OR_MISSING','focus-lost':'SELECT_UNEXPECTED_FAILURE','ring-clipped':'SELECT_UNEXPECTED_FAILURE','stale-head':'HEAD_MISMATCH','null-row':'ROW_INVALID','null-check':'CHECK_PASS_INVALID','trace-incomplete':'TRACE_EVENTS_INCOMPLETE','receipt-missing':'SELECT_UNEXPECTED_FAILURE','evidence-corrupt':'EVIDENCE_HASH_MISMATCH','evidence-missing':'EVIDENCE_FILE_MISSING'};
for(const [name,reason] of Object.entries(cases))test('actual wrapper exit: '+name,()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'third-wrapper-')),out=path.join(tmp,'out');
 try{
  const p=spawnSync(process.execPath,['--require',path.join(__dirname,'support/replay-spawn.cjs'),path.join(__dirname,'third-run.cjs')],{encoding:'utf8',env:{...process.env,NODE_OPTIONS:'',THIRD_LANE:'exact',THIRD_ENGINE:'chromium',THIRD_FOCUS:'legacy',THIRD_REPEATS:'1',THIRD_OUT:out,THIRD_REPLAY_CASE:name},timeout:30000});
  assert.equal(p.error,undefined);assert.equal(p.signal,null);
  assert.equal(p.status,reason?1:0,p.stdout+'\n'+p.stderr);
  const r=JSON.parse(fs.readFileSync(path.join(out,'third-results.json')));
  assert.equal(r.status,reason?'INCOMPLETE':'COMPLETE');
  assert.equal(r.runs[0].exit,name==='exit-contradiction'?0:1);
  assert.equal(r.runs[0].originalSuiteStatus,'FAIL');
  if(reason)assert(r.diagnosticFailures.includes(reason),JSON.stringify(r));
  else{assert.deepEqual(r.diagnosticFailures,[]);assert.equal(r.runs[0].notTested[0].status,'NOT_TESTED');}
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
