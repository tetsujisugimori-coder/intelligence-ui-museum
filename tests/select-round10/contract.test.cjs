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
 const targets=require('./targets.cjs');
 assert.equal(targets.selectors.checkbox,'#Select .controls input[type="checkbox"]');
 assert.equal(runner.includes('input:disabled'),false);
 assert.ok(runner.includes('t.evaluate(capture,selectors)'));
 assert.equal(targets.capture.toString().includes('input:disabled'),false);
});

test('snapshot marker contract rejects structural, attribute and focus faults',()=>{
 const {snapshotErrors,styleState}=require('./targets.cjs');
 const el=(tag,attrs,type=null)=>({tag,attrs,type,checked:false,disabled:false,html:'<input>',rect:{x:1,y:2,width:10,height:10},computed:{display:'block',outline:'none',visibility:'visible',position:'static',opacity:'1',transform:'none'},focused:false,focusVisible:false});
 const checkbox=el('INPUT',{type:'checkbox'},'checkbox');
 const hidden=el('INPUT',{id:'official-select',tabindex:'-1',class:'sr-only w-full h-0 left-0 bottom-0 pointer-events-none','aria-hidden':'true',value:'a'},'text');
 const trigger=el('SPAN',{id:'trigger',role:'button','aria-disabled':'false','aria-expanded':'false'});
 const s={time:1,html:'<section></section>',htmlNoEmptyStyle:'<section></section>',rootCount:1,styleNodeCount:1,hiddenCount:1,triggerCount:1,distinct:true,contained:true,disabled:[checkbox],hidden,trigger,active:el('BODY',{}),focused:false,focusVisible:false,expanded:'false',value:'a',scroll:{x:0,y:0},viewport:{width:375,height:1000,dpr:1},font:'16px',theme:'light'};
 assert.deepEqual(snapshotErrors(s),[]);
 const faults={
  missing:s=>{s.disabled=[];s.styleNodeCount=0},duplicate:s=>{s.disabled.push(s.disabled[0]);s.styleNodeCount=2},
  swapped:s=>{[s.disabled[0],s.hidden]=[s.hidden,s.disabled[0]]},wrongHiddenType:s=>{s.hidden.type='hidden';s.hidden.attrs.type='hidden'},
  duplicateHidden:s=>{s.hiddenCount=2},missingRoot:s=>{s.rootCount=0},duplicateTrigger:s=>{s.triggerCount=2},notContained:s=>{s.contained=false},
  unexpectedAttr:s=>{s.disabled[0].attrs.title='unexpected'},nonemptyStyle:s=>{s.hidden.attrs.style='display:none'},
  nullStyle:s=>{s.disabled[0].attrs.style=null},contradictoryFocus:s=>{s.focusVisible=true},wrongActive:s=>{s.focused=true;s.trigger.focused=true},
  expandedMismatch:s=>{s.trigger.attrs['aria-expanded']='true'},missingComputed:s=>{delete s.trigger.computed},missingTime:s=>{delete s.time}
 };
 for(const [name,mutate] of Object.entries(faults)){const bad=structuredClone(s);mutate(bad);assert.ok(snapshotErrors(bad).length,name)}
 assert.ok(snapshotErrors(null).length);
 assert.equal(styleState(checkbox),'ABSENT');checkbox.attrs.style='';assert.equal(styleState(checkbox),'EMPTY');checkbox.attrs.style=' ';assert.equal(styleState(checkbox),'NONEMPTY');
});

test('full audit positive fixture and hostile evidence controls fail closed',()=>{
 const {fixture,save,manifest}=require('./audit-fixture.cjs');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'round10-faults-'));
 try{
  const valid=fixture(temp),env={...process.env,ROUND10_EXPECT_HEAD:valid.head,ROUND10_EXPECT_PLATFORM:process.platform,ROUND10_RUNNER_EXIT:'0'};
  const run=(extra={})=>{const p=cp.spawnSync(process.execPath,[path.join(__dirname,'audit.cjs'),temp],{encoding:'utf8',env:{...env,...extra}});return {status:p.status,...JSON.parse(p.stdout)}};
  const good=run();assert.equal(good.status,0,JSON.stringify(good.errors));
  const faults={
   missingTarget:d=>{d.rows[0].samples.beforeFocus.disabled=[];d.rows[0].samples.beforeFocus.styleNodeCount=0},
   duplicateTarget:d=>{d.rows[0].acquisition.hiddenCount=2},
   swappedTargets:d=>{const s=d.rows[0].final;[s.disabled[0],s.hidden]=[s.hidden,s.disabled[0]]},
   unexpectedStyle:d=>{d.rows[0].samples.afterPhoto.hidden.attrs.style='display:none'},
   emptyInsteadOfAbsent:d=>{d.rows.find(r=>r.factor==='empty-style'&&r.arm===0).samples.beforeFocus.disabled[0].attrs.style=''},
   absentInsteadOfEmpty:d=>{delete d.rows.find(r=>r.factor==='empty-style'&&r.arm===1).samples.beforeFocus.hidden.attrs.style},
   nonemptyInsteadOfEmpty:d=>{d.rows.find(r=>r.factor==='empty-style'&&r.arm===1).samples.beforeFocus.hidden.attrs.style=' '},
   missingSnapshot:d=>{delete d.rows[0].samples.beforeFocus},missingAcquisition:d=>{delete d.rows[0].acquisition},missingFinal:d=>{delete d.rows[0].final},
   focusContradiction:d=>{d.rows[0].samples.afterPhoto.focusVisible=true},openContradiction:d=>{d.rows[0].samples.open.expanded='false'},
   invertedStepTime:d=>{d.rows[0].steps[0].started=999999;d.rows[0].steps[0].finished=0},
   overlappingSteps:d=>{d.rows[0].steps[1].started=-1},
   outsideRowTime:d=>{d.rows[0].steps[0].finished=1000},
   missingPaintCapture:d=>{delete d.rows[0].paint.captureSnapshot},
   forgedPaintGeometry:d=>{const p=d.rows[0].paint;p.rect.x=1;p.rect.left=1;p.rect.right=11;p.indicators[0].x=1},
   forgedClip:d=>{d.rows[0].paint.clip.x=1},
   stalePixelCount:d=>{d.rows[0].paint.changed=999},forgedPaintPass:d=>{d.rows[0].paint.pass=true},
   unsafeTracePath:d=>{d.rows[0].traceFile='../outside.zip'},
   unsafeImagePath:d=>{d.rows[0].images[0]='../outside.png'},
   unsafeSourcePath:d=>{d.sources['../../outside.txt']='0'.repeat(64)},
   imageMapping:d=>{d.rows[0].images.reverse()},duplicatePairs:d=>{d.pairs[1]=structuredClone(d.pairs[0])},
   wrongPairArms:d=>{d.pairs[0].armA=d.pairs[0].armB},
   markerComputed:d=>{d.rows.find(r=>r.factor==='full-probe'&&r.arm===1).samples.beforeFocus.disabled[0].computed.display='none'},
   hiddenGeometry:d=>{d.rows.find(r=>r.factor==='full-probe'&&r.arm===1).samples.beforeFocus.hidden.rect.x++},
   prePhotoMarker:d=>{d.rows.find(r=>r.factor==='pre-screenshot'&&r.arm===1).samples.beforePhoto.hidden.computed.display='none'},
   prePhotoGeometry:d=>{d.rows.find(r=>r.factor==='pre-screenshot'&&r.arm===1).samples.beforePhoto.trigger.rect.x++},
   prePhotoScroll:d=>{d.rows.find(r=>r.factor==='pre-screenshot'&&r.arm===1).samples.beforePhoto.scroll.y++},
   prePhotoComputed:d=>{d.rows.find(r=>r.factor==='pre-screenshot'&&r.arm===1).samples.beforePhoto.trigger.computed.outline='red'},
   notRun:d=>{d.rows[0].status='NOT_TESTED'},interrupted:d=>{d.rows[0].cleanup=false},producerExit:d=>{d.exitCode=1},
   missingStep:d=>{d.rows[0].steps.pop()},missingSource:d=>{delete d.sources[Object.keys(d.sources)[0]]}
  };
  for(const [name,mutate] of Object.entries(faults)){
   const bad=structuredClone(valid);mutate(bad);save(temp,bad);const r=run();assert.notEqual(r.status,0,name);assert.equal(r.diagnostic,'FAIL',name);
  }
  save(temp,valid);assert.notEqual(run({ROUND10_RUNNER_EXIT:'1'}).status,0,'observed exit differs');
  assert.notEqual(run({ROUND10_RUNNER_EXIT:''}).status,0,'missing observed exit');
  const image=path.join(temp,valid.rows[0].images[0]),original=fs.readFileSync(image);
  fs.writeFileSync(image,'not PNG');manifest(temp);assert.notEqual(run().status,0,'undecodable PNG with matching hash');fs.writeFileSync(image,original);
  const trace=path.join(temp,valid.rows[0].traceFile),originalTrace=fs.readFileSync(trace);
  fs.writeFileSync(trace,'not ZIP');manifest(temp);assert.notEqual(run().status,0,'undecodable trace with matching hash');fs.writeFileSync(trace,originalTrace);
  fs.writeFileSync(trace,fs.readFileSync(path.join(temp,valid.rows[1].traceFile)));manifest(temp);assert.notEqual(run().status,0,'valid trace swapped between slots with renewed manifest');fs.writeFileSync(trace,originalTrace);
  save(temp,valid);const sums=JSON.parse(fs.readFileSync(path.join(temp,'SHA256SUMS.json')));delete sums[valid.rows[0].images[0]];fs.writeFileSync(path.join(temp,'SHA256SUMS.json'),JSON.stringify(sums));assert.notEqual(run().status,0,'omitted manifest asset');
  save(temp,valid);fs.appendFileSync(image,'tamper');assert.notEqual(run().status,0,'byte tamper');fs.writeFileSync(image,original);save(temp,valid);
  const restored=run();assert.equal(restored.status,0,'positive fixture still valid after every fixed fault: '+JSON.stringify(restored.errors));
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
});


test('capture and cleanup failures cannot produce runner COMPLETE or exit zero',()=>{
 const runner=fs.readFileSync(path.join(__dirname,'run.cjs'),'utf8');
 const classify=vm.runInNewContext(runner.slice(runner.indexOf('function resultClass'),runner.indexOf('const comparisons'))+';resultClass');
 const valid={status:'COMPLETE',cleanup:true,pageErrors:[],fullProbe:false,paint:{pass:false,changed:0,captureSnapshot:{}},final:{focused:true},acquisition:{}};
 assert.equal(classify(valid).diagnostic,'COMPLETE');
 for(const patch of [{captureError:'trace export failed'},{cleanup:false},{cleanup:undefined}]){
  const result=classify({...valid,...patch});assert.equal(result.diagnostic,'INCOMPLETE');assert.equal(result.outline,'UNKNOWN');
 }
});

test('actual ring capture hook follows scrolling and animation completion',()=>{
 const runner=fs.readFileSync(path.join(__dirname,'run.cjs'),'utf8');
 const old=fs.readFileSync(path.join(root,'tests/select-path-pilot/reference/original-browser.cjs'),'utf8');
 const helpers=old.slice(old.indexOf('function visible(e)'),old.indexOf('const server=http'));
 const constructor=runner.split('\n').find(l=>l.startsWith('const {ring,prelude}=new Function'));
 assert.ok(constructor);
 const code=vm.runInNewContext(constructor+';ring.toString()',{helpers,preludePrefix:'',env:{snapshot:()=>{}}});
 assert.ok(code.indexOf('scrollIntoViewIfNeeded')<code.indexOf('waitForFunction'));
 assert.ok(code.indexOf('waitForFunction')<code.indexOf('const captureSnapshot'));
 assert.ok(code.indexOf('const captureSnapshot')<code.indexOf('const g=await l.evaluate'));
 assert.ok(code.includes("prefix.endsWith('-Select')?await snapshot(l):null"));
 assert.ok(code.includes('return {...g,clip,captureSnapshot,'));
});
