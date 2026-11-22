'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {initial,reduce} = require('./wave14-join.js');
const start = state => reduce(state,{type:'start'});
const step = state => reduce(state,{type:'step'});
const edit = (state,key,value) => reduce(state,{type:'input',key,value});
const initialExpected = {
  phase:'idle',rule:'all',quorum:2,plan:{A:'failed',B:'success',C:'success'},
  branches:{A:'pending',B:'pending',C:'pending'},history:[],decision:null,rejected:null,
};
const defaultHistory = [{branch:'B',status:'success'},{branch:'A',status:'failed'},{branch:'C',status:'success'}];

test('idle and start: explicit waiting and running, without a completed branch',()=>{
  assert.deepEqual(initial(),initialExpected);
  const s=start(initial());
  assert.equal(s.phase,'running');
  assert.deepEqual(s.branches,{A:'running',B:'running',C:'running'});
  assert.deepEqual(s.history,[]);
  assert.equal(s.decision,null);
});

test('All: three successes needed, C joins on the third record in B/A/C order',()=>{
  const s1=step(start(edit(initial(),'plan-a','success')));
  const s2=step(s1);
  assert.equal(s1.decision,null);
  assert.equal(s2.decision,null);
  const s3=step(s2);
  assert.equal(s3.phase,'complete');
  assert.deepEqual(s3.decision,{status:'joined',reason:'threshold-met',at:3,branch:'C'});
  assert.deepEqual(s3.history,[{branch:'B',status:'success'},{branch:'A',status:'success'},{branch:'C',status:'success'}]);
  assert.deepEqual(Object.keys(s3.branches),['A','B','C']);
});

test('Any: early success is latched through late failure and success',()=>{
  const s1=step(start(edit(initial(),'rule','any')));
  const expected={status:'joined',reason:'threshold-met',at:1,branch:'B'};
  assert.deepEqual(s1.decision,expected);
  assert.deepEqual(step(s1).decision,expected);
  const s3=step(step(s1));
  assert.deepEqual(s3.decision,expected);
  assert.deepEqual(s3.history,defaultHistory);
});

test('Quorum 2: one failure does not make reaching two successes impossible',()=>{
  const s1=step(start(edit(initial(),'rule','quorum')));
  const s2=step(s1);
  assert.equal(s1.decision,null);
  assert.equal(s2.decision,null);
  assert.deepEqual(step(s2).decision,{status:'joined',reason:'threshold-met',at:3,branch:'C'});
});

test('Quorum 3: one known failure makes joining impossible before the last result',()=>{
  const s1=step(start(edit(edit(initial(),'rule','quorum'),'quorum',3)));
  assert.equal(s1.decision,null);
  const s2=step(s1);
  const expected={status:'impossible',reason:'insufficient-failed',at:2,branch:'A'};
  assert.deepEqual(s2.decision,expected);
  assert.deepEqual(step(s2).decision,expected);
});

test('Quorum 1: if first result fails, the following success is still eligible',()=>{
  const configured=edit(edit(edit(edit(initial(),'rule','quorum'),'quorum',1),'plan-b','failed'),'plan-a','success');
  const s1=step(start(configured));
  assert.equal(s1.decision,null);
  assert.deepEqual(step(s1).decision,{status:'joined',reason:'threshold-met',at:2,branch:'A'});
});

test('Any/all cancelled is cancellation (not a failed task nor a successful join)',()=>{
  const s=edit(edit(edit(edit(initial(),'rule','any'),'plan-a','cancelled'),'plan-b','cancelled'),'plan-c','cancelled');
  const s1=step(start(s));
  assert.equal(s1.decision,null);
  const s2=step(s1);
  assert.equal(s2.decision,null);
  const s3=step(s2);
  assert.deepEqual(s3.decision,{status:'cancelled',reason:'all-cancelled',at:3,branch:'C'});
  assert.deepEqual(s3.branches,{A:'cancelled',B:'cancelled',C:'cancelled'});
});

test('All: first cancellation latches cancellation-derived impossibility despite later failure',()=>{
  const s1=step(start(edit(initial(),'plan-b','cancelled')));
  const expected={status:'impossible',reason:'insufficient-cancelled',at:1,branch:'B'};
  assert.deepEqual(s1.decision,expected);
  assert.deepEqual(step(s1).decision,expected);
  assert.deepEqual(step(step(s1)).decision,expected);
});

test('Reject operations without progressing state or discarding an existing decision',()=>{
  const idle=initial();
  assert.deepEqual(step(idle),{...initialExpected,rejected:'not-started'});
  for(const [key,value] of [['rule','xor'],['rule','constructor'],['quorum',0],['quorum',4],['quorum',2.5],['quorum','2'],['plan-b','pending'],['plan-d','success']]){
    assert.deepEqual(edit(idle,key,value),{...initialExpected,rejected:'invalid-input'});
  }
  assert.deepEqual(reduce(idle,{type:'stop'}),{...initialExpected,rejected:'unknown-event'});
  const active=step(start(edit(idle,'rule','any')));
  assert.deepEqual(start(active),{...active,rejected:'already-started'});
  assert.deepEqual(edit(active,'rule','all'),{...active,rejected:'inputs-locked'});
  assert.deepEqual(edit(active,'quorum',3),{...active,rejected:'inputs-locked'});
  assert.deepEqual(edit(active,'plan-b','failed'),{...active,rejected:'inputs-locked'});
  const complete=step(step(active));
  assert.deepEqual(step(complete),{...complete,rejected:'no-remaining-branch'});
});

test('Reset drops plan, history, latch, workflow phase and reject message',()=>{
  const done=step(step(step(start(edit(edit(initial(),'rule','quorum'),'quorum',3)))));
  const reset=reduce(step(done),{type:'reset'});
  assert.deepEqual(reset,initialExpected);
  assert.deepEqual(step(reset),{...initialExpected,rejected:'not-started'});
  assert.deepEqual(step(start(reset)).history,[{branch:'B',status:'success'}]);
  assert.deepEqual(done.history,defaultHistory);
  assert.deepEqual(initial(),initialExpected);
});

test('All/all cancelled: complete cancellation records do not revise the earlier impossible latch',()=>{
  const configured=edit(edit(edit(initial(),'plan-a','cancelled'),'plan-b','cancelled'),'plan-c','cancelled');
  const s1=step(start(configured));
  const expected={status:'impossible',reason:'insufficient-cancelled',at:1,branch:'B'};
  assert.deepEqual(s1.decision,expected);
  const s3=step(step(s1));
  assert.deepEqual(s3.decision,expected);
  assert.strictEqual(s3.decision,s1.decision);
  assert.deepEqual(s3.branches,{A:'cancelled',B:'cancelled',C:'cancelled'});
  assert.deepEqual(s3.history,[{branch:'B',status:'cancelled'},{branch:'A',status:'cancelled'},{branch:'C',status:'cancelled'}]);
});
