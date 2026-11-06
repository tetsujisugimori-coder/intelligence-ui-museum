'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{audit}=require('./third-audit.cjs');
const expected={head:'h',tree:'t',runner:'r',source:{file:'hash'},ids:['a']};
const good={head:'h',tree:'t',runner:'r',source:{file:'hash'},failures:[],rows:[{id:'a',errors:[],checks:['environment','layout','Button','Badge','Alert','Switch','Select'].map(name=>({name}))}]};
test('complete source-bound record and known suite exit1',()=>assert.deepEqual(audit(good,expected,{status:1}),[]));
for(const [name,mutate,reason] of [
 ['empty',x=>x.rows=[],'CONDITION_IDS_MISMATCH'],['missing condition',x=>x.rows[0].id='old','CONDITION_IDS_MISMATCH'],
 ['stale HEAD',x=>x.head='old','HEAD_MISMATCH'],['wrong tree',x=>x.tree='old','TREE_MISMATCH'],['wrong runner',x=>x.runner='old','RUNNER_MISMATCH'],
 ['wrong source',x=>x.source.file='old','SOURCE_MISMATCH'],['pageerror',x=>x.rows[0].errors=['boom'],'PAGEERROR_OR_MISSING'],
 ['missing Select',x=>x.rows[0].checks.pop(),'CHECKS_INCOMPLETE'],['runner failure',x=>x.failures=['oops'],'RUN_FAILURE']
])test(name,()=>{const x=structuredClone(good);mutate(x);assert(audit(x,expected,{status:1}).includes(reason));});
for(const p of [{status:2},{status:null,signal:'SIGTERM'},{status:1,error:'timeout'}])test('abnormal process '+JSON.stringify(p),()=>assert(audit(good,expected,p).includes('PROCESS_ABNORMAL')));
test('missing JSON',()=>assert(audit(null,expected,{status:0}).includes('RESULT_MISSING')));
const {traceAudit}=require('./third-audit.cjs');
const trace={level:'full',events:[{type:'focusin'},{type:'keydown',key:' ',option:{},popup:{},trigger:{},expanded:'true'}],frames:[{trigger:{},ms:1,scrollY:1}],final:{triggerId:{identity:1},hasFocus:true}};
test('full trace normal',()=>assert.deepEqual(traceAudit(trace,'full'),[]));
for(const [name,mutate,reason] of [['empty frames',x=>x.frames=[],'TRACE_RAF_MISSING'],['missing final',x=>delete x.final,'TRACE_FINAL_MISSING'],['no popup',x=>delete x.events[1].popup,'TRACE_POPUP_GEOMETRY_MISSING'],['truncated events',x=>x.events=[{type:'installed'}],'TRACE_EVENTS_INCOMPLETE'],['wrong lane',x=>x.level='none','TRACE_LEVEL_MISMATCH'],['overflow',x=>x.overflow=true,'TRACE_OVERFLOW']])test(name,()=>{const x=structuredClone(trace);mutate(x);assert(traceAudit(x,'full').includes(reason));});
