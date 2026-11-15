'use strict';
const a=require('node:assert/strict');
const cases=['stale-generation','duplicate','missing','cancel-update','early-complete','reset-resurrection','unapproved','rejected','stale-approval','substitution','double-execute','approval-as-success','partial-success','skip-success','not-tested-success','rerun-success','stale-attempt','tampered-count'];
// Serialized into the browser; exercises the actual shipped model. No test-only product hooks.
function probe(id){const W=window.Wave8,copy=x=>JSON.parse(JSON.stringify(x)),capture=f=>{try{return {accepted:true,value:f()};}catch(e){return {accepted:false,error:e.message};}},S=(s,type,extra={})=>W.stream(s,{type,...extra}),G=(s,type,extra={})=>W.gate(s,{type,id:'op-a',...extra}),R=(s,type,extra={})=>W.recovery(s,{type,...extra});let s;
if(['stale-generation','cancel-update','reset-resurrection'].includes(id)){s=S(W.initialStream(),'start');const old=s.generation;s=S(s,'cancel');if(id==='stale-generation')s=S(s,'retry');if(id==='reset-resurrection')s=S(s,'reset');return capture(()=>S(s,'chunk',{generation:old,chunk:W.CHUNKS[0]}));}
if(['duplicate','missing','early-complete'].includes(id)){s=S(W.initialStream(),'start');if(id==='duplicate'){s=S(s,'chunk',{generation:s.generation,chunk:W.CHUNKS[0]});return {status:S(s,'chunk',{generation:s.generation,chunk:W.CHUNKS[0]}).status};}if(id==='missing')s=S(s,'chunk',{generation:s.generation,chunk:W.CHUNKS[0]});return {status:S(s,'end',{generation:s.generation}).status};}
if(['unapproved','rejected','stale-approval','substitution','double-execute','approval-as-success'].includes(id)){s=W.initialGate();if(id==='rejected')s=G(s,'reject');if(['stale-approval','substitution','double-execute','approval-as-success'].includes(id))s=G(s,'approve');if(id==='stale-approval'){const old=copy(s.operations[0].approval);s=G(s,'revise');s.operations[0].approval=old;s.operations[0].status='APPROVED';}if(id==='substitution')s.operations[0].approval.id='op-b';if(id==='double-execute')s=G(s,'execute');if(id==='approval-as-success')return {status:s.operations[0].status,result:s.operations[0].result};return capture(()=>G(s,'execute'));}
s=R(W.initialRecovery(),'start');s=R(s,'complete',{id:'a',epoch:s.epoch,attemptId:1,ok:true});s=R(s,'complete',{id:'b',epoch:s.epoch,attemptId:1,ok:false});if(id==='rerun-success'){const before=copy(s.tasks[0]);s=R(s,'retry',{requestId:'r1'});return {before,after:s.tasks[0]};}if(id==='stale-attempt'){s=R(s,'retry',{requestId:'r1'});return capture(()=>R(s,'complete',{id:'b',epoch:s.epoch,attemptId:1,ok:true}));}if(id==='tampered-count')s.counts={PENDING:0,RUNNING:0,SUCCEEDED:4,FAILED:0,SKIPPED:0,NOT_TESTED:0};return W.aggregate(s);
}
function check(id,v){const reject=['stale-generation','cancel-update','reset-resurrection','unapproved','rejected','stale-approval','substitution','double-execute','stale-attempt'];if(reject.includes(id)){a.equal(v.accepted,false,id);a.match(v.error,new RegExp(id==='stale-generation'||id==='reset-resurrection'?'generation':id==='cancel-update'?'state':id==='stale-attempt'?'attempt':'approval'),id);return;}if(['duplicate','missing','early-complete'].includes(id)){a.equal(v.status,'FAILED',id);return;}if(id==='approval-as-success'){a.equal(v.status,'APPROVED',id);a.equal(v.result,null,id);return;}if(id==='rerun-success'){a.deepEqual(v.after,v.before,id);return;}a.equal(v.status,'PARTIAL',id);a.deepEqual(v.counts,{PENDING:0,RUNNING:0,SUCCEEDED:1,FAILED:1,SKIPPED:1,NOT_TESTED:1},id);}
function mutate(original,id){a.ok(cases.includes(id));const injections={
'stale-generation':"if(e.type==='chunk'&&e.generation!==s.generation)return {...s,partial:'STALE'};",
'duplicate':"if(e.type==='chunk'&&s.chunks.length)return {...s,status:'RUNNING'};",
'missing':"if(e.type==='end'&&s.chunks.length===1)return {...s,status:'COMPLETED',final:s.partial};",
'cancel-update':"if(e.type==='chunk'&&s.status==='CANCELED')return {...s,partial:'STALE'};",
'early-complete':"if(e.type==='end'&&s.chunks.length===0)return {...s,status:'COMPLETED',final:''};",
'reset-resurrection':"if(e.type==='chunk'&&s.status==='IDLE')return {...s,status:'RUNNING',partial:'STALE'};",
'unapproved':"if(e.type==='execute'&&s.operations[0].status==='PENDING')return {...s};",
'rejected':"if(e.type==='execute'&&s.operations[0].status==='REJECTED')return {...s};",
'stale-approval':"if(e.type==='execute'&&s.operations[0].version>1)return {...s};",
'substitution':"if(e.type==='execute'&&s.operations[0].approval?.id==='op-b')return {...s};",
'double-execute':"if(e.type==='execute'&&s.operations[0].status==='EXECUTING')return {...s};",
'approval-as-success':"if(e.type==='approve'){const n=old(s,e);n.operations[0].status='COMPLETED';n.operations[0].result='SUCCESS';return n;}",
'partial-success':"const n=old(s);n.status='SUCCESS';return n;",
'skip-success':"const n=old(s);n.counts.SUCCEEDED+=n.counts.SKIPPED;return n;",
'not-tested-success':"const n=old(s);n.counts.SUCCEEDED+=n.counts.NOT_TESTED;return n;",
'rerun-success':"if(e.type==='retry'){const n=old(s,e);n.tasks[0].status='RUNNING';return n;}",
'stale-attempt':"if(e.type==='complete'&&e.id==='b'&&e.attemptId<s.tasks[1].attemptId)return {...s};",
 'tampered-count':"if(s.counts)return {status:'SUCCESS',counts:s.counts};"};
const kind=cases.indexOf(id)<6?'stream':cases.indexOf(id)<12?'gate':['rerun-success','stale-attempt'].includes(id)?'recovery':'aggregate';return original+`\n// Synthetic fault: ${id}. Test-only served copy.\n(()=>{const old=window.Wave8.${kind};window.Wave8.${kind}=function(s,e){${injections[id]}return old(s,e);};})();\n`;}
function badObservation(id,v){v=structuredClone(v);if(Object.hasOwn(v,'accepted'))v.accepted=true;else if(id==='approval-as-success'){v.status='COMPLETED';v.result='SUCCESS';}else if(id==='rerun-success')v.after.status='RUNNING';else if(Object.hasOwn(v,'counts')){if(id==='partial-success')v.status='SUCCESS';else v.counts.SUCCEEDED=4;}else v.status='COMPLETED';return v;}
module.exports={cases,probe,check,mutate,badObservation};
