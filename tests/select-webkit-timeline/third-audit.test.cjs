'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {audit,traceAudit,evidenceAudit,CHECKS,POLICY_ERROR}=require('./third-audit.cjs');
const expected={head:'h',tree:'t',runner:'r',source:{file:'hash'},ids:['a'],runToken:'test-run-token-0001',policyCallsite:{line:64,firstColumn:1,lastColumn:26}};
const images=['on','off','off2','on2'].map(s=>'a-Select-'+s+'.png');
const receipt={schema:1,kind:'disabled-select-force-click',blockedBeforeDispatch:true,page:1,runnerHash:'r',selector:'#Select .stage [role=button]',options:{force:true},runToken:'test-run-token-0001',recordedAt:'2026-11-07T09:00:01.000Z',callsite:{matched:true,line:64,column:1}};
const row={id:'a',errors:[],console:[],images,checks:CHECKS.map(name=>({name,pass:name!=='Select',...(name==='Select'?{error:POLICY_ERROR,started:'2026-11-07T09:00:00.000Z',finished:'2026-11-07T09:00:02.000Z'}:{})})),status:'FAIL',selectPaint:{pass:true,active:true,visible:true,clipping:[],images}};
const good={head:'h',tree:'t',runner:'r',source:{file:'hash'},expected:1,CHECKS,failures:[],rows:[row],status:'FAIL'};
test('known policy stop: diagnostic normal, original suite FAIL/exit1 unchanged',()=>assert.deepEqual(audit(good,expected,{status:1},[receipt]),[]));
test('complete successful runner requires exit0, no stop receipt',()=>{const x=structuredClone(good);x.rows[0].checks.find(c=>c.name==='Select').pass=true;delete x.rows[0].checks.find(c=>c.name==='Select').error;x.rows[0].status=x.status='PASS';assert.deepEqual(audit(x,expected,{status:0}),[]);assert(audit(x,expected,{status:1}).includes('PROCESS_STATUS_MISMATCH'));});
const mutations=[
 ['empty',x=>x.rows=[],'CONDITION_IDS_MISMATCH'],['missing condition',x=>x.rows[0].id='old','CONDITION_IDS_MISMATCH'],
 ['stale HEAD',x=>x.head='old','HEAD_MISMATCH'],['wrong tree',x=>x.tree='old','TREE_MISMATCH'],['wrong runner',x=>x.runner='old','RUNNER_MISMATCH'],
 ['wrong source',x=>x.source.file='old','SOURCE_MISMATCH'],['pageerror',x=>x.rows[0].errors=['boom'],'PAGEERROR_OR_MISSING'],
 ['missing Select',x=>x.rows[0].checks.splice(6,1),'CHECKS_INCOMPLETE'],['runner failure',x=>x.failures=['oops'],'RUN_FAILURE'],
 ['duplicate',x=>x.rows[0].checks.push({...x.rows[0].checks[0]}),'CHECKS_DUPLICATE'],
 ['status contradiction',x=>x.rows[0].status='PASS','ROW_STATUS_MISMATCH'],['suite contradiction',x=>x.status='PASS','SUITE_STATUS_MISMATCH'],
 ['Select unexpected',x=>x.rows[0].checks[6].error='Error: timeout','SELECT_UNEXPECTED_FAILURE'],
 ['partial sentinel',x=>x.rows[0].checks[6].error='TimeoutError: '+POLICY_ERROR+' suffix','SELECT_UNEXPECTED_FAILURE'],
 ['row error',x=>x.rows[0].error='boom','ROW_ERROR'],['missing pass',x=>delete x.rows[0].checks[0].pass,'CHECK_PASS_INVALID'],
 ['string pass',x=>x.rows[0].checks[0].pass='true','CHECK_PASS_INVALID'],['pass plus error',x=>x.rows[0].checks[0].error='boom','CHECK_STATE_CONTRADICTION'],
 ['console error',x=>x.rows[0].console=[{classification:'unexpected'}],'CONSOLE_ERROR_OR_MISSING'],
 ['missing paint',x=>delete x.rows[0].selectPaint,'SELECT_UNEXPECTED_FAILURE'],['ring missing',x=>x.rows[0].selectPaint.pass=false,'SELECT_UNEXPECTED_FAILURE'],
 ['ring clipped',x=>x.rows[0].selectPaint.clipping=['clip'],'SELECT_UNEXPECTED_FAILURE'],['focus lost',x=>x.rows[0].selectPaint.active=false,'SELECT_UNEXPECTED_FAILURE'],
 ['wrong check order',x=>x.rows[0].checks.reverse(),'CHECK_ORDER_MISMATCH'],['null row',x=>x.rows=[null],'ROW_INVALID'],['null check',x=>x.rows[0].checks[0]=null,'CHECK_PASS_INVALID'],
 ['invalid checks type',x=>x.rows[0].checks={},'CHECKS_INCOMPLETE'],['wrong expected',x=>x.expected=0,'EXPECTED_CHECKS_MISMATCH']
];
for(const name of CHECKS.filter(n=>n!=='Select'))mutations.push([name+' false',x=>x.rows[0].checks.find(c=>c.name===name).pass=false,'REQUIRED_CHECK_FAILED:'+name]);
for(const name of CHECKS)mutations.push([name+' absent',x=>x.rows[0].checks=x.rows[0].checks.filter(c=>c.name!==name),'CHECKS_INCOMPLETE']);
for(const [name,mutate,reason] of mutations)test(name,()=>{const x=structuredClone(good);mutate(x);assert(audit(x,expected,{status:1},[receipt]).includes(reason));});
for(const p of [{status:2},{status:null,signal:'SIGTERM'},{status:1,error:'timeout'}])test('abnormal process '+JSON.stringify(p),()=>assert(audit(good,expected,p,[receipt]).includes('PROCESS_ABNORMAL')));
test('child exit contradicts FAIL',()=>assert(audit(good,expected,{status:0},[receipt]).includes('PROCESS_STATUS_MISMATCH')));
test('missing JSON',()=>assert(audit(null,expected,{status:0}).includes('RESULT_MISSING')));
for(const [name,mutate] of [['absent',()=>null],['wrong runner',r=>({...r,runnerHash:'old'})],['wrong page',r=>({...r,page:2})],['wrong target',r=>({...r,selector:'#Button'})],['wrong callsite',r=>({...r,callsite:{...r.callsite,matched:false}})],['dispatch unknown',r=>({...r,blockedBeforeDispatch:false})],['extra options',r=>({...r,options:{force:true,timeout:1}})]])test('stop receipt '+name,()=>assert(audit(good,expected,{status:1},[mutate(receipt)]).includes('SELECT_UNEXPECTED_FAILURE')));
const g={rect:{x:1,y:1,width:10,height:10,top:1,left:1,right:11,bottom:11}};
const trace={level:'full',events:[{type:'focusin'},{type:'keydown',key:' ',option:g,popup:g,trigger:g,ms:1,scrollY:0,viewport:{width:375,height:1000},expanded:'true'}],frames:[{trigger:g,ms:1,scrollY:1}],final:{triggerId:{identity:1},hasFocus:true}};
test('full trace normal',()=>assert.deepEqual(traceAudit(trace,'full'),[]));
for(const [name,mutate,reason] of [['empty frames',x=>x.frames=[],'TRACE_RAF_MISSING'],['missing final',x=>delete x.final,'TRACE_FINAL_MISSING'],['no popup',x=>delete x.events[1].popup,'TRACE_POPUP_GEOMETRY_MISSING'],['truncated events',x=>x.events=[{type:'installed'}],'TRACE_EVENTS_INCOMPLETE'],['wrong lane',x=>x.level='none','TRACE_LEVEL_MISMATCH'],['overflow',x=>x.overflow=true,'TRACE_OVERFLOW']])test(name,()=>{const x=structuredClone(trace);mutate(x);assert(traceAudit(x,'full').includes(reason));});
test('empty geometry rejects incomplete measurement',()=>{const t=structuredClone(trace);t.events[1].popup={};assert(traceAudit(t,'full').includes('TRACE_POPUP_GEOMETRY_MISSING'));});
test('manifest normal, absent, corrupted and unlisted evidence',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'third-audit-'));
 try{const hash=s=>crypto.createHash('sha256').update(s).digest('hex');const bytes=fs.readFileSync(path.join(__dirname,'fixtures/audit-policy-stop/chromium-375-light-100-Select-on.png'));fs.writeFileSync(path.join(d,'on.png'),bytes);fs.writeFileSync(path.join(d,'SHA256SUMS.json'),JSON.stringify({'on.png':hash(bytes)}));const r={rows:[{images:['on.png']}]};assert.deepEqual(evidenceAudit(d,r),[]);fs.writeFileSync(path.join(d,'on.png'),'corrupt');assert(evidenceAudit(d,r).includes('EVIDENCE_HASH_MISMATCH'));fs.unlinkSync(path.join(d,'on.png'));assert(evidenceAudit(d,r).includes('EVIDENCE_FILE_MISSING'));fs.writeFileSync(path.join(d,'extra'),'extra');assert(evidenceAudit(d,r).includes('EVIDENCE_FILE_SET_MISMATCH'));fs.unlinkSync(path.join(d,'SHA256SUMS.json'));assert(evidenceAudit(d,r).includes('EVIDENCE_MANIFEST_MISSING'));}finally{fs.rmSync(d,{recursive:true});}
});

for(const [name,mutate,reason] of [['null console',x=>x.rows[0].console=[null],'CONSOLE_ERROR_OR_MISSING'],['invalid images',x=>x.rows[0].images={},'SELECT_UNEXPECTED_FAILURE'],['wrong image names',x=>x.rows[0].selectPaint.images=['a.json','b.json','c.json','d.json'],'SELECT_UNEXPECTED_FAILURE'],['fake console classification',x=>x.rows[0].console=[{classification:'known-font-CSP',message:'unexpected exception'}],'CONSOLE_ERROR_OR_MISSING']])test(name,()=>{const x=structuredClone(good);mutate(x);assert(audit(x,expected,{status:1},[receipt]).includes(reason));});
for(const [name,mutate] of [['stale token',r=>({...r,runToken:'old-run-token-0001'})],['wrong line',r=>({...r,callsite:{...r.callsite,line:1}})],['wrong column',r=>({...r,callsite:{...r.callsite,column:100}})],['missing time',r=>({...r,recordedAt:undefined})],['old time',r=>({...r,recordedAt:'1900-01-01T00:00:00Z'})]])test('receipt integrity '+name,()=>assert(audit(good,expected,{status:1},[mutate(receipt)]).includes('SELECT_UNEXPECTED_FAILURE')));
for(const [name,mutate] of [['receipt time object',(x,r)=>r.recordedAt={toString:1,valueOf:1}],['Select time object',x=>x.rows[0].checks[6].started={toString:1,valueOf:1}],['id object',x=>x.rows[0].id={toString:1,valueOf:1}],['check name object',x=>x.rows[0].checks[0]={name:{toString:1,valueOf:1},pass:false}]])test('hostile JSON type '+name,()=>{const x=structuredClone(good),r=structuredClone(receipt);mutate(x,r);assert(audit(x,expected,{status:1},[r]).length>0);});
