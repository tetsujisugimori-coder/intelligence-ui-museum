'use strict';
// Independent adversarial review: mutate evidence, renew its manifest, then require
// the auditor to reject the semantic fault. No browser/product PASS is implied.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {fixture,save}=require('./audit-fixture.cjs');
const plan=require('./plan.json');

function withEvidence(fn){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'round11-independent-negative-'));
 try{
  const valid=fixture(dir);
  const env={...process.env,ROUND11_EXPECT_HEAD:valid.head,ROUND11_EXPECT_PLATFORM:process.platform,ROUND11_RUNNER_EXIT:'0'};
  const audit=()=>{
   const p=cp.spawnSync(process.execPath,[path.join(__dirname,'audit.cjs'),dir],{env,encoding:'utf8'});
   assert.equal(p.signal,null,'auditor must finish, not die by signal');
   assert.ok(p.stdout.trim(),'auditor must emit a structured verdict: '+p.stderr);
   return {status:p.status,report:JSON.parse(p.stdout)};
  };
  const initial=audit();
  assert.equal(initial.status,0,'positive control must pass before negative results count: '+JSON.stringify(initial.report));
  assert.equal(initial.report.diagnostic,'PASS');
  fn({dir,valid,audit});
  save(dir,valid);
  const restored=audit();
  assert.equal(restored.status,0,'original fixture must pass after restoration: '+JSON.stringify(restored.report));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}

// Hard-coded expectations intentionally do not derive the expected operation
// sequence from runner/plan helpers. They independently check the registered plan.
test('independent preregistration expectation: five groups, full positive control, 36 slots',()=>{
 assert.deepEqual(plan.factors,['layout','Button','Badge','Alert','Switch','full']);
 assert.equal(plan.repeats,3);
 assert.equal(plan.expectedSlotsPerEnvironment,36);
 for(const name of ['layout','Button','Badge','Alert','Switch']){
  assert.deepEqual(plan.arms[name][0].groups,['environment']);
  assert.deepEqual(plan.arms[name][1].groups,['environment',name]);
 }
 assert.deepEqual(plan.arms.full[1].groups,['environment','layout','Button','Badge','Alert','Switch']);
 assert.deepEqual(plan.arms.full[0].groups,['environment']);
 for(const pair of Object.values(plan.arms))for(const a of pair){
  assert.equal(a.clearEmptyStyle,true);assert.equal(a.fullProbe,true);
  assert.equal(a.emptyStyle,false);assert.equal(a.preScreenshot,false);
 }
});

test('independent semantic fault controls reject missing, reordered, substituted, or unobserved groups',()=>{
 withEvidence(({dir,valid,audit})=>{
  const full=d=>d.rows.find(r=>r.factor==='full'&&r.arm===1);
  assert.equal(full(valid).checks.length,6,'fixture must actually contain full group evidence');
  const faults={
   'missing operation group':d=>{full(d).checks.splice(2,1)},
   'reordered operation groups':d=>{const a=full(d).checks;[a[2],a[3]]=[a[3],a[2]]},
   'substituted operation group':d=>{full(d).checks[2].name='Switch'},
   'duplicated operation group':d=>{full(d).checks.push(structuredClone(full(d).checks[1]))},
   'unexecuted group marked false':d=>{full(d).checks[2].pass=false},
   'missing before-group evidence':d=>{delete full(d).checks[2].before},
   'missing after-group evidence':d=>{delete full(d).checks[2].after},
   'before-group focus unavailable':d=>{full(d).checks[2].before.hasFocus=false},
   'after-group document hidden':d=>{full(d).checks[2].after.visibility='hidden'},
   'reverse group observation time':d=>{const c=full(d).checks[2];c.before.time=c.after.time+1},
   'missing prelude-start observation':d=>{delete full(d).checks[0].before},
   'pre-focus document loses focus':d=>{full(d).samples.beforeFocus.hasFocus=false},
   'post-acquisition document loses focus':d=>{full(d).acquisition.hasFocus=false},
   'paint capture document loses focus':d=>{full(d).paint.captureSnapshot.hasFocus=false},
   'final snapshot hidden':d=>{full(d).final.visibility='hidden'},
   'trial target plan substituted':d=>{full(d).groups=['environment','Button']},
  };
  for(const [name,mutate] of Object.entries(faults)){
   const bad=structuredClone(valid);mutate(bad);save(dir,bad);
   const result=audit();
   assert.notEqual(result.status,0,name+' was incorrectly accepted');
   assert.equal(result.report.diagnostic,'FAIL',name);
   assert.ok(result.report.errors.length>0,name+' lacks diagnostic');
   assert.ok(!result.report.errors.some(e=>/audit-exception|row-file|manifest|source-byte-mismatch/.test(e)),name+' must fail semantic validation, not fixture corruption: '+JSON.stringify(result.report.errors));
  }
 });
});
