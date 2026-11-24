'use strict';
const test = require('node:test');
const a = require('node:assert/strict');
const W = require('./wave15.js');

const event = { type:'submitted', eventId:'E-APP-01', amount:0, urgent:false, note:'' };
for (const [field, literal, expected] of [
  ['type','"submitted"','candidate'], ['amount','0','candidate'], ['urgent','false','candidate'], ['note','""','candidate'],
  ['amount','1','filtered'], ['amount','"0"','invalid-filter'], ['urgent','0','invalid-filter'],
  ['type','"forwarded"','invalid-filter'], ['note','null','invalid-filter'],
  ['amount','0; 1','invalid-filter'], ['invalid','0','invalid-filter'], ['__proto__','0','invalid-filter'],
]) test(`166 equal filter ${field}=${literal}`, () => {
  const ledger = W.newTrigger(), actual = W.trigger(ledger,event,field,literal);
  a.equal(actual.state, expected); a.equal(!!actual.action, expected==='candidate');
  a.equal(actual.repeat,false); a.equal(ledger.history.length,1);
});
for (const patch of [{ type:'invalid' },{ type:'toString' },{ eventId:'' },{ amount:null },{ amount:2**53 },{ urgent:0 },{ note:undefined }]) {
  test(`166 malformed event: ${Object.keys(patch)[0]} ${Object.values(patch)[0]}`, () => a.equal(W.trigger(W.newTrigger(),{...event,...patch},'amount','0').state,'invalid-event'));
}
test('166 missing required property, including inherited value, is invalid', () => {
  const {note,...partial}=event;
  a.equal(W.trigger(W.newTrigger(),partial,'note','""').state,'invalid-event');
  a.equal(W.trigger(W.newTrigger(),Object.assign(Object.create({note}),partial),'note','""').state,'invalid-event');
});
test('166 repeat is reception, even when prior valid event had invalid filter; history/reset are distinct', () => {
  const x=W.newTrigger();
  a.equal(W.trigger(x,event,'amount','x').repeat,false);
  a.equal(W.trigger(x,event,'amount','0').repeat,true);
  a.equal(W.trigger(x,{...event,type:'updated'},'amount','0').repeat,false);
  for(let i=0;i<13;i++) W.trigger(x,{...event,eventId:'T'+i},'amount','0');
  a.equal(x.history.length,12);
  a.equal(W.trigger(x,event,'amount','0').repeat,true);
  a.equal(W.trigger(W.newTrigger(),event,'amount','0').repeat,false);
});

const opts={ policy:'exponential',scenario:'recover',tries:4,base:100,cap:250,timeout:50 };
for (const [policy, starts] of [['immediate',[0,20,40]],['fixed',[0,120,240]],['exponential',[0,120,340]]]) {
  test(`167 ${policy} deterministic timestamps`, () => {
    const result=W.retry({...opts,policy});
    a.equal(result.state,'success');
    a.deepEqual(result.history.map(r=>r.start),starts);
    a.deepEqual(result.history.map(r=>r.result),['transient','transient','success']);
  });
}
for (const [patch,expected,starts,delays] of [
  [{scenario:'first'},'success',[0],[null]],
  [{scenario:'exhaust'},'exhausted',[0,120,340,610],[100,200,250,null]],
  [{scenario:'permanent'},'permanent',[0],[null]],
  [{scenario:'timeout',tries:1},'unknown',[0],[null]],
  [{scenario:'timeout',tries:2},'unknown',[0,150],[100,null]],
  [{scenario:'first',timeout:10},'success',[0],[null]],
  [{scenario:'first',timeout:9,tries:1},'unknown',[0],[null]],
  [{timeout:15},'success',[0,115,330],[100,200,null]],
  [{cap:0},'success',[0,20,40],[0,0,null]],
  [{tries:1},'exhausted',[0],[null]],
  [{scenario:'exhaust',tries:8,base:0},'exhausted',[0,20,40,60,80,100,120,140],[0,0,0,0,0,0,0,null]],
  [{base:2**53-1,cap:2**53-1,policy:'fixed'},'overflow',[],[]],
  [{base:2**53-1,cap:1},'success',[0,21,42],[1,1,null]],
  [{timeout:2**53-1,scenario:'timeout',tries:1},'unknown',[0],[null]],
  [{timeout:2**53-1,scenario:'timeout',tries:2},'overflow',[],[]],
  [{tries:0},'invalid',[],[]], [{tries:9},'invalid',[],[]], [{tries:1.5},'invalid',[],[]],
  [{base:-1},'invalid',[],[]], [{base:2**53},'invalid',[],[]], [{base:NaN},'invalid',[],[]], [{base:'100'},'invalid',[],[]],
  [{cap:Infinity},'invalid',[],[]], [{timeout:0},'invalid',[],[]], [{policy:'unknown'},'invalid',[],[]],
]) test(`167 ${JSON.stringify(patch)} -> ${expected}`, () => {
  const result=W.retry({...opts,...patch});
  a.equal(result.state,expected); a.deepEqual(result.history.map(r=>r.start),starts); a.deepEqual(result.history.map(r=>r.delay),delays);
});

const original={ eventId:'E-APP-01',key:'notify-01', payload:'standard' };
const redelivery={...original,eventId:'E-APP-02'};
test('168 side-effect candidate -> running duplicate -> completion -> cached duplicate / collision', () => {
  const l=W.newLedger();
  const operations=[
   [original,'request','new',0],[redelivery,'request','in-flight',0],
   [original,'complete','completed',1],[redelivery,'request','duplicate',1],
   [{...redelivery,payload:'alternate'},'request','conflict',1],[original,'complete','invalid',1],
   [{...original,key:'different'},'request','new',1],
  ];
  for (const [r,op,status,count] of operations) {
    const row=W.idempotency(l,r,op);a.equal(row.state,status);a.equal(row.effects,count);
  }
});
test('168 original succeeded after deadline; redelivery and reconciliation never repeat side effect', () => {
  const l=W.newLedger();
  const operations=[
   [original,'request','new',0],[original,'lost','unknown',1],
   [redelivery,'request','blocked-unknown',1],[redelivery,'lost','invalid',1],
   [{...redelivery,payload:'alternate'},'request','conflict',1],
   [redelivery,'reconcile','completed',1],[redelivery,'request','duplicate',1],
  ];
  a.deepEqual(operations.map(([r,op])=>{const n=W.idempotency(l,r,op);return [n.state,n.effects]}), operations.map(([, ,s,e])=>[s,e]));
  a.deepEqual([W.newLedger().effects,W.newLedger().records.size,W.newLedger().history.length],[0,0,0]);
});
test('168 invalid identities, unknown payload and wrong transition cannot perform effects', () => {
  const l=W.newLedger();
  for (const patch of [{key:''},{key:'   '},{key:'x'.repeat(41)},{eventId:''},{payload:'constructor'}])
    a.equal(W.idempotency(l,{...original,...patch}).state,'invalid');
  for (const op of ['complete','lost','reconcile']) a.equal(W.idempotency(l,original,op).state,'invalid');
  a.deepEqual([l.effects,l.records.size],[0,0]);
});
test('167 + 168 isolated fault control reproduces actual two effects, not just a different verdict', () => {
  const retry=W.retry({...opts,scenario:'timeout',tries:1});
  a.equal(retry.state,'unknown');
  const result=W.pairedControl();
  a.deepEqual(result.normal.history.map(x=>x.state),['new','unknown','blocked-unknown']);
  a.deepEqual(result.fault.history.map(x=>x.state),['new','unknown','new','completed']);
  a.deepEqual([result.normal.effects,result.fault.effects],[1,2]);
  a.deepEqual(result,W.pairedControl());
});
