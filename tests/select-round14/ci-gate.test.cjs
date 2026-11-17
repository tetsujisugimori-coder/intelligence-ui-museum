'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {allowed,phases}=require('./ci-run.cjs');
const ok=Object.fromEntries(phases.map(x=>[x,0]));
test('all mandatory phases zero permits raw gate',()=>assert.equal(allowed(ok),true));
for(const p of phases)test(p+' failure/missing/unknown blocks raw',()=>{for(const v of [1,-1,null,'NOT_RUN','ABNORMAL',undefined])assert.equal(allowed({...ok,[p]:v}),false)});
