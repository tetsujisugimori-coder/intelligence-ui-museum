'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto'),vm=require('node:vm');
const plan=require('./plan.json');
const root=path.resolve(__dirname,'../..');
test('preregistered four factors plus normalized-prelude counterfactual',()=>{
 assert.equal(plan.factors.length,5);
 assert.equal(plan.expectedSlotsPerEnvironment,30);
 assert.equal(plan.repeats,3);
 assert.deepEqual([...new Set(plan.factors)],plan.factors);
 for(const factor of plan.factors){
  assert.equal(plan.arms[factor].length,2);
  for(const arm of plan.arms[factor]){
   for(const field of ['prelude','emptyStyle','preScreenshot','fullProbe','clearEmptyStyle'])assert.equal(typeof arm[field],'boolean');
  }
 }
 assert.deepEqual(plan.arms['prelude-normalized'].map(a=>a.clearEmptyStyle),[true,true]);
 assert.deepEqual(plan.arms['prelude-normalized'].map(a=>a.prelude),[false,true]);
 assert.deepEqual(plan.arms['full-probe'].map(a=>a.fullProbe),[false,true]);
 assert.deepEqual(plan.arms['pre-screenshot'].map(a=>a.preScreenshot),[false,true]);
 assert.deepEqual(plan.arms['empty-style'].map(a=>a.emptyStyle),[false,true]);
});
test('runner and independent auditor parse without importing or running side effects',()=>{
 for(const name of ['run.cjs','audit.cjs'])assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(path.join(__dirname,name),'utf8'),{filename:name}));
});
test('historical prelude and original evidence are read-only references',()=>{
 const p=path.join(root,'tests/select-path-pilot/reference/original-browser.cjs');
 const digest=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 assert.equal(digest,'a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1');
});
test('auditor refuses empty evidence rather than reporting PASS',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'round10-negative-'));
 try{
  const r=cp.spawnSync(process.execPath,[path.join(__dirname,'audit.cjs'),temp],{encoding:'utf8',env:{...process.env,ROUND10_EXPECT_HEAD:'0000000000000000000000000000000000000000',ROUND10_EXPECT_PLATFORM:process.platform}});
  assert.notEqual(r.status,0);
  assert.equal(JSON.parse(r.stdout).diagnostic,'FAIL');
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('auditor rejects counterfeit PASS with absent rows and forged producer exit 0',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'round10-negative-'));
 try{
  fs.writeFileSync(path.join(temp,'results.json'),JSON.stringify({plan,head:'0000000000000000000000000000000000000000',tree:'0000000000000000000000000000000000000000',playwright:'1.56.1',sdkVersion:'0.2.2',exitCode:0,rows:[],validation:[],stage3:'HOLD',rootCause:'UNKNOWN',oldOffscreenClick:'NOT_TESTED'}));
  const r=cp.spawnSync(process.execPath,[path.join(__dirname,'audit.cjs'),temp],{encoding:'utf8',env:{...process.env,ROUND10_EXPECT_HEAD:'0000000000000000000000000000000000000000',ROUND10_EXPECT_PLATFORM:process.platform}});
  assert.notEqual(r.status,0);
  const report=JSON.parse(r.stdout);
  assert.equal(report.diagnostic,'FAIL');
  assert.ok(report.errors.some(e=>e.includes('row-count')));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('round10 comparison identifiers bind the loop iteration; regression for CI ReferenceError',()=>{
 const runner=fs.readFileSync(path.join(__dirname,'run.cjs'),'utf8');
 const m=runner.match(/const comparisons=\(\)=> \{([\s\S]*?)\n\};\nconst serve=/);
 assert.ok(m,'comparisons must be extractable for isolated regression check');
 const sample=(marker=false)=>({
   html:'<div id="Select"></div>',htmlNoEmptyStyle:'<div id="Select"></div>',styleNodeCount:1,
   disabled:[{attrs:marker?{style:''}:{}}],hidden:{attrs:marker?{style:''}:{}},
   scroll:{x:0,y:0},viewport:{width:375,height:1000,dpr:1},font:'16px',theme:'light',
   trigger:{rect:{x:0,y:0,width:10,height:10},computed:{display:'block'}}
 });
 const rows=[];
 for(let iteration=1;iteration<=plan.repeats;iteration++)for(const factor of plan.factors)for(const arm of [0,1]){
   const s=sample(factor==='empty-style'&&arm===1);
   rows.push({id:factor+'-'+arm+'-'+iteration,factor,iteration,arm,classification:{diagnostic:'COMPLETE',outline:'VISIBLE'},
    acquisition:{focusVisible:true},samples:{beforeFocus:s,beforePhoto:{html:'<div id="Select"></div>'}}});
 }
 const sandbox={plan,data:{rows},equal:(a,b)=>JSON.stringify(a)===JSON.stringify(b)};
 const compare=vm.runInNewContext('(function(){const comparisons=()=> {'+m[1]+'\n};return comparisons;})()',sandbox);
 const result=compare();
 assert.equal(result.length,15);
 for(let i=1;i<=3;i++)assert.equal(result.filter(p=>p.iteration===i).length,plan.factors.length);
 assert.equal(result.every(p=>p.equivalence==='CONFIRMED_TARGET'),true);
});
test('DOM marker matches checkbox labeled Select disabled, not disabled state',()=>{
 const runner=fs.readFileSync(path.join(__dirname,'run.cjs'),'utf8');
 assert.ok(runner.includes('#Select .controls input[type="checkbox"]'));
 assert.equal(runner.includes('#Select input:disabled'),false);
});
