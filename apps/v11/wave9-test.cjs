'use strict';
const test=require('node:test'),a=require('node:assert/strict'),w=require('./wave9.js'),clone=x=>JSON.parse(JSON.stringify(x));
test('148 syntax and schema are separate; fixed normal and 0/100 bounds',()=>{for(const score of [0,80,100])a.deepEqual(w.validateJSON(JSON.stringify({...w.VALID,score})),{status:'VALID',syntax:'PASS',schema:'PASS',errors:[]});const r=w.validateJSON(w.PRESETS.syntax);a.equal(r.syntax,'FAIL');a.equal(r.schema,'NOT_TESTED');a.equal(r.errors[0].reason,'syntax');});
test('148 type required enum range array extra null empty paths',()=>{for(const [k,path,reason]of [['type','$.score','type'],['missing','$.name','required'],['enum','$.status','enum'],['range','$.score','range'],['array','$.tags[0]','length'],['extra','$.other','additional-property'],['null','$','type'],['empty','$','syntax']]){const r=w.validateJSON(w.PRESETS[k]);a.equal(r.status,'INVALID',k);a.ok(r.errors.some(e=>e.path===path&&e.reason===reason),k);}});
test('148 non-finite, prototype property, scalar and empty-array safety',()=>{a.equal(w.validateJSON('{"name":"x","status":"draft","score":1e999,"tags":[]}').status,'INVALID');a.equal(w.validateJSON('{"name":"x","status":"draft","score":0,"tags":[],"__proto__":{"polluted":1}}').errors[0].reason,'additional-property');a.equal({}.polluted,undefined);for(const x of ['1','true','[]','"x"'])a.equal(w.validateJSON(x).status,'INVALID');a.equal(w.validateJSON(JSON.stringify({...w.VALID,tags:[]})).status,'VALID');});
test('148 exact safe limits and 32 errors maximum',()=>{a.notEqual(w.validateJSON(' '.repeat(16380)+'null').status,'LIMIT');a.equal(w.validateJSON(' '.repeat(16381)+'null').status,'LIMIT');a.notEqual(w.validateJSON('['.repeat(7)+'0'+']'.repeat(7)).status,'LIMIT');a.equal(w.validateJSON('['.repeat(8)+'0'+']'.repeat(8)).status,'LIMIT');a.equal(w.validateJSON(JSON.stringify(Array(33).fill(0))).status,'LIMIT');a.equal(w.validateJSON(JSON.stringify(Object.fromEntries(Array.from({length:128},(_,i)=>['x'+i,0])))).status,'LIMIT');a.equal(w.validateJSON(JSON.stringify(Object.fromEntries(Array.from({length:100},(_,i)=>['x'+i,0])))).errors.length,32);});
test('149 normal fixed counts and empty selection remain unresolved',()=>{const r=w.coverage();a.equal(r.status,'VALID');a.deepEqual(r.rows.map(x=>[x.support,x.contradict,x.unknown,x.status]),[[1,0,1,'SUPPORTED'],[0,1,0,'CONTRADICTED'],[1,0,0,'SUPPORTED']]);a.ok(w.coverage([]).rows.every(x=>x.status==='UNRESOLVED'));a.equal(w.coverage(['s3']).rows[0].status,'UNRESOLVED');});
test('149 conflicts do not become majority support',()=>{const rs=w.relationsFor('conflict');const r=w.coverage(undefined,rs);a.equal(r.rows[0].support,1);a.equal(r.rows[0].contradict,1);a.equal(r.rows[0].status,'CONFLICT');});
test('149 malformed evidence is never silently filtered, even when excluded',()=>{for(const scenario of ['duplicate','source','quote']){const r=w.coverage([],w.relationsFor(scenario));a.equal(r.status,'INVALID');a.deepEqual(r.rows,[]);}for(const change of [{claimId:'fake'},{type:'fake'},{quote:''},{line:0},{line:1.2}]){const rs=clone(w.RELATIONS);Object.assign(rs[0],change);a.equal(w.coverage(undefined,rs).status,'INVALID');}a.equal(w.coverage(['s1','s1']).status,'INVALID');a.equal(w.coverage(['absent']).status,'INVALID');a.equal(w.coverage(undefined,w.RELATIONS,w.SOURCES.slice(1)).status,'INVALID');});
test('150 initial arithmetic and weight-based reversal',()=>{const r=w.compareRubric(w.DEFAULTS.weights,w.DEFAULTS.A,w.DEFAULTS.B);a.equal(r.status,'VALID');a.deepEqual(r.totals,{A:38,B:24});a.equal(r.denominator,9);a.deepEqual(r.display,{A:'4.22',B:'2.67'});a.equal(r.winner,'A');const x=w.compareRubric([0,0,1,1],w.DEFAULTS.A,w.DEFAULTS.B);a.equal(x.winner,'B');a.deepEqual(x.display,{A:'3.00',B:'5.00'});a.deepEqual(x.changedAxes,['正確性','根拠']);});
test('150 missing, zero score, all zero weights and ties are distinct',()=>{const {weights,A,B}=w.DEFAULTS;a.equal(w.compareRubric(weights,[null,4,3,3],B).status,'INCOMPLETE');a.equal(w.compareRubric([0,3,1,1],[null,4,3,3],B).status,'VALID');a.equal(w.compareRubric([0,0,0,0],A,B).status,'NO_WEIGHT');const r=w.compareRubric(weights,[0,0,0,0],[0,0,0,0]);a.equal(r.winner,'TIE');a.deepEqual(r.display,{A:'0.00',B:'0.00'});a.equal(w.compareRubric(weights,A,A).winner,'TIE');});
test('150 invalid numbers rejected without masking empty weight',()=>{for(const v of [-1,6,1.5,NaN,Infinity,'',' ','bad',null,true]){const ws=[v,1,1,1];a.equal(w.compareRubric(ws,w.DEFAULTS.A,w.DEFAULTS.B).status,'INVALID',String(v));}a.equal(w.compareRubric([1,1,1,1],[6,4,3,3],w.DEFAULTS.B).status,'INVALID');});
test('all model states run edit invalidation same-value reset and inspect boundaries',()=>{for(const id of [148,149,150]){let s=w.initial(id);a.equal(s.result,null);s=w.reduce(s,{type:'run'});a.equal(s.result.status,'VALID');const same=id===148?{type:'preset',name:'valid'}:id===149?{type:'select',sourceId:'s1',checked:true}:{type:'weight',index:0,value:'4'};a.deepEqual(w.reduce(s,same),s);if(id===148)a.deepEqual(w.reduce(s,{type:'edit',text:s.input}),s);const edit=id===148?{type:'edit',text:'null'}:id===149?{type:'select',sourceId:'s1',checked:false}:{type:'score',answer:'A',index:0,value:''};const changed=w.reduce(s,edit);a.equal(changed.result,null);a.equal(changed.revision,1);a.deepEqual(w.reduce(changed,{type:'reset'}),w.initial(id));a.throws(()=>w.reduce(s,{type:'unknown'}));}let s=w.reduce(w.initial(149),{type:'run'});const t=w.reduce(s,{type:'inspect',id:'c1'});a.deepEqual(t.result,s.result);a.deepEqual(t.selected,s.selected);a.throws(()=>w.reduce(s,{type:'inspect',id:'fake'}));});
// These are semantic observation mutations with matching normal controls, not startup errors.
const probes=[
 ['148-syntax',()=>w.validateJSON(w.PRESETS.syntax),r=>a.equal(r.syntax,'FAIL'),r=>r.syntax='PASS'],
 ['148-type',()=>w.validateJSON(w.PRESETS.type),r=>a.equal(r.status,'INVALID'),r=>r.status='VALID'],
 ['148-required',()=>w.validateJSON(w.PRESETS.missing),r=>a.equal(r.errors[0].reason,'required'),r=>r.errors[0].reason='none'],
 ['148-depth',()=>w.validateJSON(w.PRESETS.deep),r=>a.equal(r.status,'LIMIT'),r=>r.status='VALID'],
 ['148-path',()=>w.validateJSON(w.PRESETS.array),r=>a.equal(r.errors[0].path,'$.tags[0]'),r=>r.errors[0].path='$.tags[1]'],
 ['148-extra',()=>w.validateJSON(w.PRESETS.extra),r=>a.equal(r.errors[0].reason,'additional-property'),r=>r.errors[0].reason='ignored'],
 ['149-missing',()=>w.coverage([],w.RELATIONS,w.SOURCES.slice(1)),r=>a.equal(r.status,'INVALID'),r=>r.status='VALID'],
 ['149-fabricated',()=>w.coverage(undefined,w.relationsFor('source')),r=>a.equal(r.status,'INVALID'),r=>r.status='VALID'],
 ['149-conflict',()=>w.coverage(undefined,w.relationsFor('conflict')),r=>a.equal(r.rows[0].status,'CONFLICT'),r=>r.rows[0].status='SUPPORTED'],
 ['149-id',()=>w.coverage(['fake']),r=>a.equal(r.status,'INVALID'),r=>r.status='VALID'],
 ['149-duplicate',()=>w.coverage(undefined,w.relationsFor('duplicate')),r=>a.equal(r.status,'INVALID'),r=>r.status='VALID'],
 ['149-quote',()=>w.coverage(undefined,w.relationsFor('quote')),r=>a.equal(r.status,'INVALID'),r=>r.status='VALID'],
 ['150-weight',()=>w.compareRubric([0,0,0,0],w.DEFAULTS.A,w.DEFAULTS.B),r=>a.equal(r.status,'NO_WEIGHT'),r=>r.status='VALID'],
 ['150-total',()=>w.compareRubric(w.DEFAULTS.weights,w.DEFAULTS.A,w.DEFAULTS.B),r=>a.equal(r.totals.A,38),r=>r.totals.A=39],
 ['150-missing',()=>w.compareRubric(w.DEFAULTS.weights,[null,4,3,3],w.DEFAULTS.B),r=>a.equal(r.status,'INCOMPLETE'),r=>r.status='VALID'],
 ['150-invalid',()=>w.compareRubric([-1,3,1,1],w.DEFAULTS.A,w.DEFAULTS.B),r=>a.equal(r.status,'INVALID'),r=>r.status='VALID'],
 ['150-tie',()=>w.compareRubric(w.DEFAULTS.weights,w.DEFAULTS.A,w.DEFAULTS.A),r=>a.equal(r.winner,'TIE'),r=>r.winner='A'],
 ['150-reversal',()=>w.compareRubric([0,0,1,1],w.DEFAULTS.A,w.DEFAULTS.B),r=>a.equal(r.winner,'B'),r=>r.winner='A']
];
for(const [id,make,check,mutate]of probes)test(id+' normal accepted; semantic mutation rejected',()=>{const r=make();check(r);const bad=clone(r);mutate(bad);a.throws(()=>check(bad),{code:'ERR_ASSERTION'});});

test('149 R1 unknown is not contradiction; fixed identity prevents semantic reassignment',()=>{
 for(const change of [{index:3,type:'contradict'},{index:0,claimId:'c3'}]){
  const rs=clone(w.RELATIONS),{index,...fields}=change;Object.assign(rs[index],fields);
  const r=w.coverage(undefined,rs);a.equal(r.status,'INVALID');a.ok(r.errors.some(e=>e.reason==='fixed relation mismatch'));
 }
 for(const extra of [{...w.RELATIONS[0],id:'e6'},{id:'e5',claimId:'c1',sourceId:'s3',line:1,quote:'開館時刻は未確認です。',type:'contradict'}]){
  a.equal(w.coverage(undefined,[...w.RELATIONS,extra]).status,'INVALID');
 }
 const rs=w.relationsFor('conflict'),e5=rs.find(r=>r.id==='e5');
 a.deepEqual(e5,{id:'e5',claimId:'c1',sourceId:'s3',line:2,quote:'開館は10時です。',type:'contradict'});
 a.equal(w.coverage(undefined,rs).rows[0].status,'CONFLICT');
 a.equal(w.coverage().status,'VALID');
});
test('149 R1 source name/body identity is immutable even with matching altered quote',()=>{
 for(const edit of [s=>s[0].name='別資料',s=>s[0].lines[0]='開館は8時です。',s=>s.push({id:'s4',name:'無断資料',lines:['追加']})]){
  const ss=clone(w.SOURCES);edit(ss);const rs=clone(w.RELATIONS);rs[0].quote=ss[0].lines[0];
  const r=w.coverage(undefined,rs,ss);a.equal(r.status,'INVALID');a.ok(r.errors.some(e=>e.reason==='fixed source mismatch'));
 }
 a.equal(w.coverage([],w.RELATIONS,w.SOURCES.slice(1)).status,'INVALID');
});
test('149 R1 inspect preserves conflict scenario and its distinct second-line reference',()=>{
 let s=w.reduce(w.initial(149),{type:'scenario',name:'conflict'});s=w.reduce(s,{type:'run'});
 const inspected=w.reduce(s,{type:'inspect',id:'s3'});a.equal(inspected.scenario,'conflict');a.deepEqual(inspected.result,s.result);
 a.deepEqual(w.relationsFor(inspected.scenario).filter(r=>r.sourceId===inspected.inspect).map(r=>[r.id,r.line,r.type]),[['e4',1,'unknown'],['e5',2,'contradict']]);
});

test('W9-P3-01 independent oracle rejects blank or invalid weight, preserves 0 and missing score',()=>{
 const C=require('./wave9-contract.cjs'),{weights,A,B}=w.DEFAULTS;
 const cases=[
  {weights:['',3,1,1],A,B,status:'INVALID'},
  {weights:[null,3,1,1],A,B,status:'INVALID'},
  {weights:[' ',3,1,1],A,B,status:'INVALID'},
  {weights:[true,3,1,1],A,B,status:'INVALID'},
  {weights:['0',3,1,1],A,B,status:'VALID'},
  {weights:[0,0,0,0],A,B,status:'NO_WEIGHT'},
  {weights,A:['',4,3,3],B,status:'INCOMPLETE'},
  {weights:[0,3,1,1],A:['',4,3,3],B,status:'VALID'},
  {weights,A:['0',4,3,3],B,status:'VALID'},
  {weights,A:[' ',4,3,3],B,status:'INVALID'},
  {weights,A:[true,4,3,3],B,status:'INVALID'}
 ];
 for(const [i,c] of cases.entries()){
  const actual=w.compareRubric(c.weights,c.A,c.B),oracle=C.rubricResult(c.weights,c.A,c.B);
  a.equal(actual.status,c.status,'product '+i);
  a.deepEqual(oracle,actual,'independent oracle '+i);
 }
 a.equal(C.rubricResult(['',3,1,1],A,B).status,'INVALID','blank weight must not silently become zero');
});
test('W9-P3-02 requires all baseline relation IDs while preserving source exclusion and optional conflict',()=>{
 const baseline=clone(w.RELATIONS),sourceIds=w.SOURCES.map(s=>s.id);
 a.equal(w.coverage(sourceIds,baseline).status,'VALID');
 a.equal(w.coverage([],baseline).status,'VALID','excluding sources does not remove fixed relations');
 a.ok(w.coverage([],baseline).rows.every(r=>r.status==='UNRESOLVED'));
 for(const id of baseline.map(r=>r.id)){
  const missing=baseline.filter(r=>r.id!==id);
  for(const selection of [sourceIds,[]]){
   const result=w.coverage(selection,missing);
   a.equal(result.status,'INVALID','missing '+id);
   a.deepEqual(result.rows,[],'no partial rows '+id);
   a.ok(result.errors.some(e=>e.path==='relations'&&e.reason==='missing fixed relation '+id),'missing diagnostic '+id);
  }
 }
 a.equal(w.coverage(sourceIds,baseline.slice().reverse()).status,'VALID','input order is not evidence identity');
 // The exported demo array is mutable; completeness must use a private canonical copy.
 const deleted=w.RELATIONS.splice(1,1);
 try{
  const tampered=w.coverage();
  a.equal(tampered.status,'INVALID','mutating exported baseline does not relax the contract');
  a.ok(tampered.errors.some(e=>e.reason==='missing fixed relation e2'));
 }finally{w.RELATIONS.splice(1,0,...deleted);}
 a.deepEqual(w.RELATIONS,baseline,'public demo data restored after probe');
 const conflicted=w.coverage(sourceIds,w.relationsFor('conflict'));
 a.equal(conflicted.status,'VALID','optional e5 is permitted');
 a.equal(conflicted.rows[0].status,'CONFLICT','valid contradiction preserved');
 const badExtra=[...baseline,{id:'e5',claimId:'c1',sourceId:'s3',line:1,quote:'開館時刻は未確認です。',type:'contradict'}];
 a.equal(w.coverage(sourceIds,badExtra).status,'INVALID','unverified optional relation rejected');
});

// P2-IR65-01: named own-axis rejection cases; holes must never become missing scores.
const oracle150=require('./wave9-contract.cjs');
const rubricImplementations={product:w.compareRubric,oracle:oracle150.rubricResult};
for(const field of ['weights','A','B'])for(let axis=0;axis<4;axis++)for(const [implementation,compare]of Object.entries(rubricImplementations)){
 test('150 P2 sparse '+field+'['+axis+'] '+implementation,()=>{
  const input={weights:[4,3,1,1],A:[5,4,3,3],B:[2,2,5,5]};
  delete input[field][axis];
  a.equal(input[field].length,4);a.equal(Object.hasOwn(input[field],axis),false);
  const result=compare(input.weights,input.A,input.B);
  a.equal(result.status,'INVALID');a.equal(result.winner,null);a.equal(result.totals,null);
 });
 test('150 P2 inherited axis '+field+'['+axis+'] '+implementation,()=>{
  const input={weights:[4,3,1,1],A:[5,4,3,3],B:[2,2,5,5]};
  const value=input[field][axis];delete input[field][axis];
  const previous=Object.getOwnPropertyDescriptor(Array.prototype,String(axis));
  try{
   Object.defineProperty(Array.prototype,String(axis),{value,writable:true,configurable:true});
   a.equal(input[field][axis],value);a.equal(Object.hasOwn(input[field],axis),false);
   const result=compare(input.weights,input.A,input.B);
   a.equal(result.status,'INVALID');a.equal(result.winner,null);a.equal(result.totals,null);
  }finally{if(previous)Object.defineProperty(Array.prototype,String(axis),previous);else delete Array.prototype[axis];}
 });
}
for(const [implementation,compare]of Object.entries(rubricImplementations))test('150 P2 dense boundary controls '+implementation,()=>{
 const weights=[4,3,1,1],A=[5,4,3,3],B=[2,2,5,5];
 a.deepEqual(compare(weights,A,B).totals,{A:38,B:24});
 a.equal(compare(weights,A,B).winner,'A');
 for(const value of [null,'']){
  a.equal(compare(weights,[value,4,3,3],B).status,'INCOMPLETE');
  a.equal(compare([0,3,1,1],[value,4,3,3],B).status,'VALID');
  a.equal(compare([value,3,1,1],A,B).status,'INVALID');
 }
 for(const field of ['weights','A','B']){
  const input={weights:weights.slice(),A:A.slice(),B:B.slice()};input[field][0]=undefined;
  const result=compare(input.weights,input.A,input.B);
  a.equal(result.status,'INVALID');a.equal(result.winner,null);a.equal(result.totals,null);
 }
 a.equal(compare(weights,[0,4,3,3],B).status,'VALID');
 a.equal(compare([0,0,0,0],A,B).status,'NO_WEIGHT');
 a.equal(compare(weights,A,A).winner,'TIE');
 a.equal(compare([0,0,1,1],A,B).winner,'B');
});
