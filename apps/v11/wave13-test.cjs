const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./wave13-contract.cjs'),P=require('./wave13.js');
for(const [v,e] of Object.entries(C.date)) test('160 '+v,()=>a.deepEqual(C.project(160,P.freshness(v)),e));
for(const v of ['2026-02-29','2026-04-31','0000-01-01','2026-4-01','2026-04-01\n'])test('160 invalid '+JSON.stringify(v),()=>a.equal(C.project(160,P.freshness(v)),'invalid'));
test('160 reverse interval',()=>a.equal(C.project(160,P.freshness('2026-04-01',[{name:'受付',start:'2026-05-01',end:'2026-04-30'}])),'invalid'));
test('Gregorian leap boundaries',()=>a.deepEqual([P.validDate('1900-02-29'),P.validDate('2000-02-29')],[false,true]));
for(const [v,e] of Object.entries(C.comparisons))test('161 '+v,()=>a.deepEqual(C.project(161,P.compare(['R1',v])),e));
test('161 agreement among three outputs',()=>a.deepEqual(C.project(161,P.compare(['R1','R2','R3'])),['format','exact']));
for(const ids of [['R1','R1'],['R1','R0'],Array(2)])test('161 invalid '+JSON.stringify(ids),()=>a.equal(C.project(161,P.compare(ids)),'invalid'));
for(const [v,e] of Object.entries(C.slices))test('162 '+v,()=>a.deepEqual(C.project(162,P.inspect(v)),e));
test('162 invalid slice',()=>a.equal(C.project(162,P.inspect('bogus')),'invalid'));
for(const id of [160,161,162]) test(id+' contract sequence and Reset',()=>{
 let state=P.initial(id);
 for(const {action,key,value,expect} of C.plan(id)){
  state=P.reduce(state,{type:action,key,value});
  a.deepEqual(C.project(id,state.result),expect);
 }
 a.deepEqual(state,P.initial(id));
});
const source=fs.readFileSync(require.resolve('./wave13.js'),'utf8');
for(const [id,from,to,exercise,expected] of [
 [160,'date<p.start','date<=p.start',p=>p.freshness('2026-04-01'),C.date['2026-04-01']],
 [161,":x=>x;",":x=>'00:00';",p=>p.compare(['R1','R4']),C.comparisons.R4],
 [162,'total=rows.length','total=cases.length',p=>p.inspect('closed'),C.slices.closed],
])test(id+' normal and semantic mutant',()=>{
 a.deepEqual(C.project(id,exercise(P)),expected);
 a.equal(source.split(from).length,2,'mutation must hit only target');
 const mod={exports:{}};vm.runInNewContext(source.replace(from,to),{module:mod});
 const actual=JSON.parse(JSON.stringify(C.project(id,exercise(mod.exports))));
 a.throws(()=>a.deepEqual(actual,expected),{name:'AssertionError'});
});
test('formal operation records survive JSON serialization without losing keys',()=>{
 for(const id of [160,161,162]){
  const plan=C.plan(id);
  a.deepEqual(JSON.parse(JSON.stringify(plan)),plan);
 }
});
