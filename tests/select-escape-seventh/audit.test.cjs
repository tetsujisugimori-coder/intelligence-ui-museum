'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{auditRow}=require('./audit.cjs');
const fixture=require('./audit-fixture.json'),copy=()=>structuredClone(fixture);
test('positive complete diagnostic preserves known outline FAIL',()=>{const a=auditRow(copy());assert.equal(a.diagnosticOK,true,JSON.stringify(a));assert.equal(a.productOK,false);});
const cases={
 'forged cancel stack':r=>{r.trace.events.filter(e=>e.kind==='preventDefault-before').forEach(e=>e.stack='forged.js');},
 'cancel after wrong event':r=>{r.trace.events.filter(e=>e.kind==='preventDefault-after').forEach(e=>e.eventId=-1);},
 'wrong focus call target':r=>{r.trace.events.filter(e=>e.kind==='focus-call').forEach(e=>e.target={id:'wrong'});},
 'missing event':r=>{r.trace.events=r.trace.events.filter(e=>e.kind!=='keyup');},
 'cancel contradiction':r=>{r.trace.events.find(e=>e.kind==='escape-settled').defaultPrevented=false;},
 'focus return missing':r=>{r.trace.events=r.trace.events.filter(e=>e.kind!=='focus-return');},
 'popup not closed':r=>{r.afterEscape.expanded='true';},
 'value changed':r=>{r.afterEscape.value='b';},
 'time reversed':r=>{r.trace.events[2].ms=-1;},
 'image missing':r=>{r.paint.images.pop();},
 'false product pass':r=>{r.productOutline='PASS';},
 'failed prerequisite':r=>{r.checks[2].pass=false;},
 'duplicate prerequisite':r=>{r.checks.push(r.checks[2]);},
 'pageerror':r=>{r.errors.push('injected');},
 'wrong condition':r=>{r.condition='C';},
 'empty trace':r=>{r.trace.events=[];},
 'event identity mismatch':r=>{r.trace.events.find(e=>e.kind==='preventDefault-before').eventId=-1;},
 'missing close callback':r=>{r.trace.events.find(e=>e.name==='select-hook-close').name='removed';},
 'timer wrong parent':r=>{r.trace.events.filter(e=>e.name==='select-focus-timer-fired').at(-1).closeId=-1;},
 'unexpected fallback':r=>{r.trace.events.find(e=>e.name==='select-hook-close').name='radix-onDismiss-before';},
 'mode missing':r=>{delete r.mode;},
 'focus wrong target':r=>{r.afterEscape.triggerId='wrong';},
 'trial status false':r=>{r.status='FAIL';},
};
for(const [name,mutate]of Object.entries(cases))test('reject '+name,()=>{const r=copy();mutate(r);assert.equal(auditRow(r).diagnosticOK,false);});
