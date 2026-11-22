'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const {initial,reduce,preview} = require('./wave14-mapping.js');

const normal = () => ({label:'来館予約',visitors:0,available:false,labels:[],metadata:{room:'青波'}});
const apply = (state,key,value) => reduce(state,{type:'input',key,value});
const run = state => reduce(state,{type:'preview'});
const rejection = (result,reason) => {
  assert.equal(result.status,'invalid');
  assert.equal(result.reason,reason);
  assert.equal(result.output,null);
};

test('fixed five default connectors and exact unconverted preview', () => {
  const start = initial();
  assert.deepEqual(start,{
    mappings:[
      {source:'title',target:'label'},{source:'count',target:'visitors'},
      {source:'open',target:'available'},{source:'tags',target:'labels'},{source:'info',target:'metadata'},
    ],
    result:null,
  });
  assert.deepEqual(run(start).result,{status:'valid',output:normal()});
  assert.equal(start.result,null);
});

test('editing invalidates results; same choice preserves preview and earlier snapshot', () => {
  const before = run(initial());
  assert.strictEqual(apply(before,'source-0','title'),before);
  const edited = apply(before,'source-0','blank');
  assert.equal(edited.result,null);
  assert.equal(before.mappings[0].source,'title');
  assert.deepEqual(before.result.output,normal());
  assert.deepEqual(run(edited).result,{
    status:'valid',output:{label:'',visitors:0,available:false,labels:[],metadata:{room:'青波'}},
  });
});

test('optional removal and unconnected source omit properties rather than serializing null', () => {
  const removed = reduce(run(initial()),{type:'remove',index:3});
  assert.equal(removed.result,null);
  const output = run(removed).result.output;
  assert.deepEqual(output,{label:'来館予約',visitors:0,available:false,metadata:{room:'青波'}});
  assert.equal(Object.hasOwn(output,'labels'),false);
  const blankTarget = run(apply(initial(),'source-4','')).result.output;
  assert.deepEqual(blankTarget,{label:'来館予約',visitors:0,available:false,labels:[]});
  assert.equal(Object.hasOwn(blankTarget,'metadata'),false);
});

test('new rows may be added, connected, removed, and restored without changing fixture', () => {
  const first = reduce(run(initial()),{type:'remove',index:3});
  const added = reduce(first,{type:'add'});
  assert.deepEqual(added.mappings[4],{source:'',target:''});
  assert.equal(added.result,null);
  const withSource = apply(added,'source-4','tags');
  const linked = apply(withSource,'target-4','labels');
  assert.deepEqual(run(linked).result.output,normal());
  const latest = run(linked);
  latest.result.output.metadata.room='changed';
  latest.result.output.labels.push('changed');
  assert.deepEqual(run(linked).result.output,normal());
});

for (const [description,key,value,reason] of [
  ['duplicate output','target-1','label','DUPLICATE_TARGET'],
  ['required output unconnected','source-1','','REQUIRED_UNMAPPED'],
  ['source unknown','source-0','missing','UNKNOWN_SOURCE'],
  ['source prototype key','source-0','toString','UNKNOWN_SOURCE'],
  ['target unknown','target-0','missing','UNKNOWN_TARGET'],
  ['target prototype key','target-0','__proto__','UNKNOWN_TARGET'],
  ['null is an explicit value','source-0','nil','NULL_VALUE'],
  ['missing property is undefined','source-0','absent','UNDEFINED_VALUE'],
  ['string does not become number','source-1','blank','TYPE_MISMATCH'],
  ['number does not become boolean','source-2','count','TYPE_MISMATCH'],
  ['array does not become an object','source-4','tags','TYPE_MISMATCH'],
]) {
  test(description+' is rejected without retaining stale output', () => {
    const before = run(initial());
    const changed = apply(before,key,value);
    assert.equal(changed.result,null);
    const after = run(changed);
    rejection(after.result,reason);
    assert.deepEqual(before.result.output,normal());
  });
}

test('invalid and nonfinite mapped values never become null or trigger accessors', () => {
  const input = {title:'来館予約',count:0,open:false,tags:[],info:{room:'青波'},blank:'',nil:null};
  const mappings = initial().mappings;
  rejection(preview(mappings,{...input,count:NaN}),'INVALID_VALUE');
  rejection(preview(mappings,{...input,count:Infinity}),'INVALID_VALUE');
  rejection(preview(mappings,{...input,tags:[,]}),'INVALID_VALUE');
  rejection(preview(mappings,{...input,tags:[undefined]}),'INVALID_VALUE');
  rejection(preview(mappings,{...input,info:{nested:[NaN]}}),'INVALID_VALUE');
  rejection(preview(mappings,{...input,info:new Date(0)}),'INVALID_VALUE');
  rejection(preview(mappings,{...input,info:new Map()}),'INVALID_VALUE');
  const circular={}; circular.self=circular;
  rejection(preview(mappings,{...input,info:circular}),'INVALID_VALUE');
  const getter={get count(){throw new Error('must not execute getter');}};
  const descriptorSource=Object.defineProperties({...input},Object.getOwnPropertyDescriptors(getter));
  rejection(preview(mappings,descriptorSource),'INVALID_VALUE');
  assert.ok(Object.is(preview(mappings,{...input,count:-0}).output.visitors,-0));
});

test('invalid request containers and sparse or malformed associations are rejected', () => {
  rejection(preview(initial().mappings,[]),'INVALID_SOURCE');
  rejection(preview(initial().mappings,null),'INVALID_SOURCE');
  rejection(preview(null),'INVALID_MAPPINGS');
  rejection(preview({0:{source:'title',target:'label'}}),'INVALID_MAPPINGS');
  rejection(preview([,]),'INVALID_MAPPINGS');
  rejection(preview([{source:'title',target:false}]),'INVALID_MAPPINGS');
  rejection(preview([{get source(){throw new Error('must not execute getter');},target:'label'}]),'INVALID_MAPPINGS');
  rejection(preview(Array.from({length:9},()=>({source:'',target:''}))),'INVALID_MAPPINGS');
});

test('rejection does not poison reset; restored mappings require a fresh preview', () => {
  const bad = run(apply(run(initial()),'source-0','absent'));
  const reset = reduce(bad,{type:'reset'});
  assert.deepEqual(reset,initial());
  assert.equal(reset.result,null);
  assert.deepEqual(run(reset).result,{status:'valid',output:normal()});
});
