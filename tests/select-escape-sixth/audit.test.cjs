'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{auditRow}=require('./audit.cjs');
const reference=()=>({id:'chromium-tab-1-B',engine:'chromium',route:'tab',i:1,condition:'B',images:['on.png','off.png','off2.png','on2.png'],status:'COMPLETE',checks:['environment','layout','Button','Badge','Alert','Switch'].map(name=>({name,pass:true})),errors:[],trace:{overflow:false,events:[
 {kind:'target-escape-start'}, {kind:'keydown',key:'Escape',trusted:true}, {kind:'preventDefault-before',trusted:true,stack:'capture handler'}, {kind:'preventDefault-after',trusted:true,defaultPrevented:true}, {kind:'mutation-callback',stack:'Museum observer'}, {kind:'focus-call',stack:'Museum MutationObserver'}, {kind:'focus-return',active:{role:'button'}}, {kind:'keydown-settled',key:'Escape',trusted:true,defaultPrevented:true}, {kind:'keyup',key:'Escape',trusted:true}, {kind:'keyup-settled',key:'Escape',trusted:true}, {kind:'target-escape-complete'}].map((e,i)=>({...e,seq:i+1,ms:i}))},paint:{images:['on.png','off.png','off2.png','on2.png'],changed:200,unstable:0,active:true,visible:true,clipping:[],pass:true},productOutline:'PASS'});
test('normal measured observation accepted',()=>assert.deepEqual(auditRow(reference()),{diagnosticOK:true,productOK:true,reasons:[]}));
test('known measured outline failure is diagnostic evidence, not product pass',()=>{const r=reference();Object.assign(r.paint,{changed:0,visible:false,pass:false});r.productOutline='FAIL';const a=auditRow(r);assert(a.diagnosticOK);assert(!a.productOK);});
const mutations={
 'BODY focus loss':r=>r.paint.active=false,
 'outline missing':r=>{r.paint.changed=0;r.paint.pass=false;},
 'clipped outline':r=>r.paint.clipping.push('clip'),
 'pageerror':r=>r.errors.push('injected'),
 'missing keyup':r=>r.trace.events=r.trace.events.filter(e=>e.kind!=='keyup'),
 'missing focus stack':r=>r.trace.events=r.trace.events.filter(e=>e.kind!=='focus-call'),
 'time reversal':r=>r.trace.events[4].ms=-1,
 'sequence duplication':r=>r.trace.events[4].seq=4,
 'untrusted Escape':r=>r.trace.events.find(e=>e.kind==='keydown').trusted=false,
 'missing cancellation':r=>r.trace.events=r.trace.events.filter(e=>!e.kind.startsWith('preventDefault')),
 'prelude false':r=>r.checks[2].pass=false,
 'prelude absent':r=>r.checks.splice(2,1),
 'prelude duplicate':r=>r.checks.push({...r.checks[2]}),
 'trace absent':r=>delete r.trace,
 'trace overflow':r=>r.trace.overflow=true,
 'missing focus return':r=>r.trace.events=r.trace.events.filter(e=>e.kind!=='focus-return'),
 'missing mutation callback':r=>r.trace.events=r.trace.events.filter(e=>e.kind!=='mutation-callback'),
 'settled contradiction':r=>r.trace.events.find(e=>e.kind==='keydown-settled').defaultPrevented=false,
 'paint path not registered':r=>r.images=[],
 'unknown condition':r=>r.condition='X',
 'duplicate boundary':r=>r.trace.events.push({...r.trace.events[0],seq:r.trace.events.length+1,ms:99}),
 'missing PNG':r=>r.paint.images.pop(),
 'duplicate PNG':r=>r.paint.images[3]=r.paint.images[0],
 'unstable paint':r=>r.paint.unstable=1,
 'incomplete claimed complete':r=>r.error='timeout',
 'fake product PASS':r=>{r.paint.pass=false;r.paint.visible=false;r.paint.changed=0;},
};
for(const [name,mutate]of Object.entries(mutations))test('reject '+name,()=>{const r=reference();mutate(r);assert.equal(auditRow(r).productOK,false);});
