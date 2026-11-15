'use strict';
const test=require('node:test'),a=require('node:assert/strict');
const normal=require('./wave6-state-fixture.json');
const {validateSteps,stages}=require('./wave6-contract.cjs');
const copy=()=>structuredClone(normal);
test('fixed recorded normal 19 stages retain acceptance',()=>validateSteps(copy()));
test('R5 same reedit confirmed-loss record and matching display reject',()=>{const r=copy(),s=r.steps.find(s=>s.name==='reedit');s.values[140].confirmed.color='赤';s.rendered[140].confirmed.find(x=>x[0]==='color')[1]='color：赤';a.throws(()=>validateSteps(r),/fixed state reedit\/140/);});
test('R6 same back wrong-claim record with matching links rejects',()=>{const r=copy(),s=r.steps.find(s=>s.name==='back');s.values[141].claim='c2';s.rendered[141].links=[['s2','s2 架空記録乙 p.2']];s.rendered[141].registration='対応登録1件';a.throws(()=>validateSteps(r),/fixed state back\/141/);});
for(const stage of stages)for(const id of [139,140,141])test(`all-stage invariant corruption ${stage}/${id}`,()=>{const r=copy(),s=r.steps.find(s=>s.name===stage);if(id===139)s.values[id].selected=['r6'];if(id===140)s.values[id].confirmed.color='CORRUPT';if(id===141)s.values[id].mode='wrong';a.throws(()=>validateSteps(r),new RegExp(`fixed state ${stage}/${id}`));});

const {validatePageErrors}=require('./wave6-fault-contract.cjs');
test('resource missing-module known errors are bounded, extra error rejects',()=>{for(const e of ["ReferenceError: wave6Init is not defined","ReferenceError: Can't find variable: wave6Init"]){validatePageErrors('resource','fault',[e]);a.throws(()=>validatePageErrors('resource','fault',[e,'Error: unrelated']),/unexpected resource pageerror/);}validatePageErrors('resource','normal',[]);a.throws(()=>validatePageErrors('resource','normal',['Error: unrelated']),/unexpected product pageerror/);a.throws(()=>validatePageErrors('resource','fault',['Error: unrelated']),/unexpected resource pageerror/);});

const {verifyViewport}=require('./wave6-audit.cjs'),hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');
test('viewport identity binding rejects missing and foreign bytes (synthetic byte contract)',()=>{const bytes=Buffer.from('same-length-A'),r={id:'chromium-375-light-1',viewportScreenshot:{file:'chromium-375-light-1.png',size:bytes.length,sha256:hash(bytes)}};verifyViewport(r,bytes);a.throws(()=>verifyViewport(r,Buffer.from('same-length-B')),/viewport hash/);a.throws(()=>verifyViewport({id:r.id},bytes),/viewport binding missing/);a.throws(()=>verifyViewport({...r,id:'other'},bytes),/viewport condition/);});
