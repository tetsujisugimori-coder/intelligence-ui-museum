'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const W=require('./wave16.js');
const routeCases=[
 ['normal',2,'standard',true,'complete',2],['transient',2,'standard',true,'retried',4],
 ['transient',0,'standard',true,'limit',2],['transient',1,'standard',true,'limit',3],
 ['transient',3,'standard',false,'limit',5],['permanent',2,'standard',true,'fallback',3],
 ['permanent',2,'standard',false,'stopped',3],['unknown',2,'standard',true,'manual',3],
 ['transient',2,'missing',true,'undefined',2],['transient',2,'cycle',true,'cycle',2],
 ['transient',2,'multi-cycle',true,'cycle',2],['transient',4,'standard',true,'invalid',1],
 ['wrong',2,'standard',true,'invalid',1],
];
for(const [kind,cap,policy,recovery,expected,count] of routeCases) test('169: '+[kind,cap,policy,recovery,expected].join(' '),()=>{
 const r=W.route(kind,cap,policy,recovery);a.equal(r.state,expected);a.equal(r.history.length,count);a.ok(r.reason);
});
function compOracle(lib, fail=true){
 const s=lib.newCompensation();
 a.equal(lib.undo(s,0)[0],'invalid');
 a.equal(lib.begin(s,2,fail?1:-1)[0],'pending');
 a.deepEqual(Array.from(s.remaining),[0,1]);a.equal(lib.begin(s,2,-1)[0],'invalid');
 a.equal(lib.undo(s,2)[0],'invalid');a.equal(lib.undo(s,0)[0],'invalid');
 a.equal(lib.undo(s,1)[0],'pending');a.equal(lib.undo(s,1)[0],'invalid');
 a.equal(lib.undo(s,0)[0],fail?'manual':'restored');
 a.deepEqual(Array.from(s.remaining),fail?[1]:[]);
 a.deepEqual(Array.from(s.completed),[0,1]);a.equal(lib.undo(s,0)[0],'invalid');
}
test('170: residual effect and manual remediation',()=>compOracle(W));
test('170: full compensation',()=>compOracle(W,false));
test('170: all forward success and absent completed steps',()=>{
 for(const [failAt,expected,completed] of [[-1,'finished',[0,1,2]],[0,'no-effect',[]],[1,'pending',[0]]]){
  const s=W.newCompensation();a.equal(W.begin(s,failAt,-1)[0],expected);a.deepEqual(s.completed,completed);
 }
});
function queueOracle(lib){
 const s=lib.newQueue();
 const act=(id,op,value)=>a.equal(lib.queue(s,id,op)[0],value);
 act('M-042','start','quarantined');act('M-043','start','quarantined');
 act('M-041','succeed','invalid');act('M-041','start','running');
 act('M-041','start','duplicate');act('M-041','fail','quarantined');
 act('M-041','start','running');act('M-041','succeed','processed');act('M-041','start','duplicate');
 a.equal(s.items[0].tries,4);a.equal(s.items[0].effects,1);
 act('M-044','start','running');act('M-044','succeed','processed');
 a.equal(s.items[3].tries,4);a.equal(s.items[3].effects,1);
 act('','start','invalid');
}
test('171: isolate, replay, re-isolate, and suppress duplicate',()=>queueOracle(W));
test('fresh models reset all operations',()=>{
 const s=W.newQueue();W.queue(s,'M-041','start');a.equal(W.newQueue().items[0].tries,2);
 const c=W.newCompensation();W.begin(c,2,1);a.equal(W.newCompensation().phase,'idle');
});
const source=fs.readFileSync(require.resolve('./wave16.js'),'utf8');
const mutants=[
 ['unknown routes to retry',"'unknown':'manual'","'unknown':'retry'"],
 ['compensate before execution',"s.phase!=='pending' || next!==index","s.phase==='finished'"],
 ['pretend failed compensation restored',"s.remaining.length?'manual':'restored'","'restored'"],
 ['ignore quarantine',"item.kind==='malformed'||item.kind==='permanent'","false"],
 ['rerun already processed',"item.state==='processed'||item.state==='running'","item.state==='running'"],
];
for(const [name,from,to] of mutants) test('fault rejected: '+name,()=>{
 const target=name==='unknown routes to retry'?"return result('manual'":"return result('manual'";
 const actualFrom=name==='unknown routes to retry'?target:from;
 const actualTo=name==='unknown routes to retry'?"return result('retried'":to;
 a.ok(source.includes(actualFrom));
 const context={module:{exports:{}}};vm.runInNewContext(source.replace(actualFrom,actualTo),context);
 const lib=context.module.exports;
 a.throws(()=>name==='unknown routes to retry'?a.equal(lib.route('unknown',2,'standard',true).state,'manual'):
   name.startsWith('compensate')||name.startsWith('pretend')?compOracle(lib):queueOracle(lib),{code:'ERR_ASSERTION'});
});
