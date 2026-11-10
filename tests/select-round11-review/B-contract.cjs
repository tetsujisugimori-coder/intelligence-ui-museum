process.env.ROUND11_PHASE='B';
const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process'),a=require('assert/strict');
const repo=path.resolve(__dirname,'../..'),base=path.join(repo,'tests/select-round11');
const {fixture,save}=require(base+'/audit-fixture.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'round11-B-review-'));const d=fixture(root);
const env={...process.env,ROUND11_EXPECT_HEAD:d.head,ROUND11_EXPECT_PLATFORM:process.platform,ROUND11_RUNNER_EXIT:'0'};
function audit(){const p=cp.spawnSync(process.execPath,[base+'/audit.cjs',root],{env,encoding:'utf8'});return {status:p.status,report:JSON.parse(p.stdout)}}
a.equal(d.rows.length,18);a.equal(audit().status,0);
const assets=require(base+'/privacy-check.cjs').expectedArtifacts();a.equal([...assets].filter(x=>x.endsWith('-trace.zip')).length,18);a.equal(assets.size,127);a.ok(![...assets].some(x=>x.includes('-Button-')||x.includes('-Badge.png')||x.includes('-Alert.png')));
const faults={wrongPhase:x=>{x.plan.id='select-round11-operation-groups-v2'},missingSubgroup:x=>{x.rows.find(r=>r.factor==='add-disabled'&&r.arm===1).checks.pop()},falseExecution:x=>{x.rows.find(r=>r.factor==='prefix-only'&&r.arm===0).checks[1].executed=true},wrongRecomposition:x=>{x.rows.find(r=>r.factor==='add-disabled'&&r.arm===1).groups=['environment','SwitchDisabled','SwitchPrefix']}};
const result={head:d.head,positive:'PASS',privacyInventory:'127 files, 18 traces, no unrelated group images',negative:{}};
for(const [name,mut] of Object.entries(faults)){const x=structuredClone(d);mut(x);save(root,x);const r=audit();a.notEqual(r.status,0,name);a.ok(!r.report.errors.some(e=>/source-byte-mismatch|audit-exception/.test(e)),name);result.negative[name]='REJECTED';}
save(root,d);a.equal(audit().status,0);console.log(JSON.stringify(result,null,2));fs.rmSync(root,{recursive:true,force:true});
