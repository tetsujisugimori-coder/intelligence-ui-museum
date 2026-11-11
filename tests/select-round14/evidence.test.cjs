'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {inspect}=require('./audit.cjs'),{comparisons}=require('./model.cjs');
const root=process.env.ROUND14_EVIDENCE;
if(!root)throw Error('ROUND14_EVIDENCE required; no skipped contract suite');
const d=JSON.parse(fs.readFileSync(path.join(root,'results.json'))),expected={head:d.head,platform:d.system.platform,engine:d.engine,exit:0};
const caller=x=>x.rows.find(r=>r.probe),measurement=x=>x.rows.find(r=>r.arm==='A2');
test('normal original evidence passes',()=>assert.deepEqual(inspect(d,expected),[]));
const faults={
 'timeline reversal':x=>caller(x).events[1].time=-1,
 'event missing':x=>{const r=caller(x);r.events=r.events.filter(e=>e.type!=='keyup').map((e,seq)=>({...e,seq}))},
 'caller misclassification':x=>{caller(x).callers[0].owner='BROWSER'},
 'measurement group swap':x=>{measurement(x).intervention.kind='A1'},
 'focus-visible single field':x=>{x.rows[0].final.focusVisible=!x.rows[0].final.focusVisible},
 'DOM discrepancy':x=>{x.rows[0].final.triggerCount=2},
 'pairs aggregate corruption':x=>{x.pairs[0].outline=['VISIBLE','VISIBLE','EXTRA']},
 'diagnostic classification corruption':x=>{x.rows[0].classification.diagnostic='FAIL'},
 'joint row and pair mutation':x=>{const r=x.rows[0];r.final.focusVisible=!r.final.focusVisible;x.pairs=comparisons(x.rows,x.phase)},
 'missing trial':x=>x.rows.pop(),
 'trial order':x=>x.rows.reverse(),
 'old head':x=>x.head='0'.repeat(40),
 'trace arm disguise':x=>{x.rows.find(r=>r.tracing).tracing=false},
 'call chronology':x=>{caller(x).calls[0].end=-1},
 'call removal':x=>{caller(x).calls.pop()},
 'unknown completion':x=>{x.rows[0].status='NOT_TESTED'},
 'focus-visible correlated alteration':x=>{const r=x.rows[0];r.final.focusVisible=r.final.trigger.focusVisible=!r.final.focusVisible;x.pairs=comparisons(x.rows,x.phase)},
 'CSS after alteration':x=>{x.rows[0].paint.afterShadow='fake'},
 'step insertion':x=>{x.rows[0].steps.push({...x.rows[0].steps[0],name:'extra-api'})},
 'no-op fake':x=>{x.rows.find(r=>r.arm==='A1').intervention.result='fake'},
};
for(const [name,mutate]of Object.entries(faults))test(name+' rejected',()=>{const x=structuredClone(d);mutate(x);assert.ok(inspect(x,expected).length,name)});
