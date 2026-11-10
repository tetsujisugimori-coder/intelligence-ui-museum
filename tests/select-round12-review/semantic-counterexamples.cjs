'use strict';
// Explicit pilot-only semantic fixture: raw evidence is never rewritten.
const fs=require('fs'),assert=require('node:assert/strict');
const {inspect}=require('../select-round12/audit.cjs');
const d=JSON.parse(fs.readFileSync(process.argv[2]));d.dirty='';
const expected={head:d.head,platform:d.system.platform,engine:d.engine,exit:0};
assert.deepEqual(inspect(d,expected),[],'semantic baseline after explicit dirty-only clone adjustment');
const faults={
 untrustedInputs:x=>{for(const e of x.rows.find(r=>r.condition==='B').events)if(['input','change'].includes(e.kind))e.trusted=false},
 noncheckboxInputs:x=>{for(const e of x.rows.find(r=>r.condition==='B').events)if(['input','change'].includes(e.kind))e.target.tag='DIV'},
 paintBeforeFinal:x=>{x.rows[0].paint.captureSnapshot.time=0},
 acquisitionBeforePrelude:x=>{x.rows[0].acquisition.time=0},
 checkboxGeometryMismatch:x=>{x.rows[1].samples.beforeFocus.disabled[0].rect.x+=100},
 alreadyFocusedBeforeAcquisition:x=>{const s=x.rows[0].samples.beforeFocus;s.focused=true;s.focusVisible=false;s.trigger.focused=true;s.trigger.focusVisible=false;s.active=s.trigger;}
};
const missed=[];for(const[n,f]of Object.entries(faults)){const x=structuredClone(d);f(x);if(inspect(x,expected).length)console.log('REJECTED',n);else{console.log('ACCEPTED BAD EVIDENCE',n);missed.push(n)}}
assert.deepEqual(missed,[]);
