'use strict';
// Mutate cloned records, never original trial evidence. These are auditor tests,
// not additional browser replications. Expected failures are enumerated by hand.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {inspect,audit}=require('./audit.cjs');
const root=path.resolve(process.env.ROUND13_EVIDENCE||'.work/select-round13');
const original=JSON.parse(fs.readFileSync(path.join(root,'results.json')));
const expected={head:original.head,platform:original.system.platform,engine:original.engine,exit:0};
test('complete actual evidence has no semantic errors',()=>assert.deepEqual(inspect(original,expected),[]));
const faults={
 'wrong focus target':d=>{d.rows[0].acquisition.focused=false},
 'missing focus-visible':d=>{delete d.rows[0].acquisition.focusVisible},
 'missing computed style':d=>{delete d.rows[0].final.trigger.computed},
 'missing snapshot':d=>{delete d.rows[0].samples.beforeFocus},
 'wrong operation order':d=>{d.rows.find(r=>r.condition==='D').operations.reverse()},
 'wrong checkbox state':d=>{d.rows.find(r=>r.condition==='B').operations[1].after.switch.disabled=false},
 'insufficient trials':d=>d.rows.pop(),
 'wrong environment':d=>{d.system.platform='unknown'},
 'wrong engine':d=>{d.engine='unknown'},
 'wrong source HEAD':d=>{d.head='0'.repeat(40)},
 'wrong dependency':d=>{d.playwright='1.56.0'},
 'error with exit zero':d=>{d.rows[0].error='injected'},
 'missing input events':d=>{d.rows.find(r=>r.condition==='B'&&r.observer==='on').events=[]},
 'target DOM mismatch':d=>{d.rows[1].samples.beforeFocus.html+='mutation'},
 'identity mismatch':d=>{d.rows[0].condition='B'},
 'unknown promoted':d=>{d.rootCause='CERTAIN'},
 'missing paint':d=>{delete d.rows[0].paint},
 'OFF observer falsely marked installed':d=>{d.rows.find(r=>r.observer==='off').observerInstalled=true},
 'ON observer missing':d=>{d.rows.find(r=>r.observer==='on').observerInstalled=false},
 'OFF invents events':d=>{d.rows.find(r=>r.observer==='off').events=[]},
 'missing transition':d=>{d.rows[0].transitions.splice(1,1)},
 'reversed transition chronology':d=>{d.rows[0].transitions.reverse()},
 'transition pseudo CSS corrupted':d=>{d.rows[0].transitions[1].style.afterOutline=null},
 'transition focus mismatch':d=>{d.rows[0].transitions[0].focusVisible=!d.rows[0].transitions[0].focusVisible},
 'arm inequivalence':d=>{d.rows.find(r=>r.id==='A-on-1').samples.beforeFocus.html+='synthetic-change'},
 'unregistered Tab route':d=>{d.rows[0].tabRoute=[{}]}
};
for(const[name,mutate]of Object.entries(faults))test('reject '+name,()=>{const d=structuredClone(original);mutate(d);assert.ok(inspect(d,expected).length>0)});
for(const suffix of ['-Select-on.png','-trace.zip'])test('reject missing original '+suffix,()=>{
 const temp=fs.mkdtempSync(path.join(path.dirname(root),'negative-'));
 try{for(const f of fs.readdirSync(root))if(f!==original.rows[0].id+suffix)fs.linkSync(path.join(root,f),path.join(temp,f));let rejected=false;try{rejected=audit(temp,expected).diagnostic==='FAIL'}catch{rejected=true}assert.ok(rejected)}finally{fs.rmSync(temp,{recursive:true,force:true})}
});
