// Real-browser acceptance of the unmodified runner entry points, including negative controls.
// Faults exist only in isolated browser contexts, never in product files.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const out=path.resolve(process.env.EVIDENCE_DIR||'evidence/ra-acceptance');fs.mkdirSync(out,{recursive:true});
const realModules=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
assert(realModules,'CODEX_PRIMARY_RUNTIME_NODE_MODULES is required');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'museum-real-fault-'));
const records=[];
try{
 const moduleDir=path.join(temp,'playwright');fs.mkdirSync(moduleDir);
 fs.writeFileSync(path.join(moduleDir,'index.js'),`
 const real=require(${JSON.stringify(path.join(realModules,'playwright'))});
 module.exports=Object.fromEntries(['chromium','webkit'].map(engine=>[engine,{launch:async options=>{
  const b=await real[engine].launch(options),original=b.newContext.bind(b);
  b.newContext=async opts=>{const c=await original(opts);await c.addInitScript(({fault})=>{
   if(fault==='modal-stuck')document.addEventListener('cancel',e=>{e.preventDefault();e.stopImmediatePropagation()},true);
   if(fault==='modal-delayed')document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('dialog[open]')){e.preventDefault();e.stopImmediatePropagation();const d=document.querySelector('dialog[open]');setTimeout(()=>d.dispatchEvent(new Event('cancel',{cancelable:true})),150)}},true);
   if(fault?.startsWith('focus-'))document.addEventListener('DOMContentLoaded',()=>{
    const style=document.createElement('style');style.textContent=({
     'focus-clipped':'#Select .stage [role=button] {clip-path:inset(4px round 999px)!important}',
    })[fault]||(fault==='focus-missing'?'#Select .stage [role=button],#Select .stage [role=button]::after {outline:none!important;box-shadow:none!important}':'#Select .stage [role=button]::after {visibility:hidden!important;opacity:0!important}');document.head.append(style);
   });
  },{fault:process.env.MUSEUM_FAULT});
  if(process.env.MUSEUM_FAULT==='late-pageerror'&&opts.javaScriptEnabled!==false){const close=c.close.bind(c);c.close=async()=>{for(const p of c.pages()){if(!p.isClosed()){const event=p.waitForEvent('pageerror',{timeout:3000});await p.evaluate(()=>setTimeout(()=>{throw Error('late-pageerror negative control')},0));await event;}}await close();};}
  if(process.env.MUSEUM_FAULT==='cleanup-failure'){const close=c.close.bind(c);c.close=async()=>{await close();throw Error('injected cleanup failure')}}
  return c;};return b;}}]));`);
 const cases=[['normal-smoke','smoke',null],['normal-matrix','matrix',null],['modal-delayed','smoke','modal-delayed'],['modal-stuck','smoke','modal-stuck'],['focus-missing','matrix','focus-missing'],['focus-hidden','matrix','focus-hidden'],['late-pageerror','smoke','late-pageerror'],['cleanup-failure','smoke','cleanup-failure'],['runner-timeout','smoke','runner-timeout']];
 cases.push(['focus-clipped','matrix','focus-clipped']);
 const requested=process.env.ACCEPTANCE_CASES?.split(',');
 if(requested){assert.equal(new Set(requested).size,requested.length,'duplicate acceptance cases');assert(requested.every(x=>cases.some(c=>c[0]===x)),'unknown acceptance case');}
 for(const [name,kind,fault] of cases){if(requested&&!requested.includes(name))continue;
  const dir=path.join(out,name);fs.mkdirSync(dir,{recursive:true});
  const result=spawnSync(process.execPath,[`scripts/stage2r-${kind==='smoke'?'smoke':'browser'}.cjs`],{encoding:'utf8',timeout:fault==='runner-timeout'?1:300000,detached:process.platform!=='win32',maxBuffer:16*1024*1024,env:{...process.env,EVIDENCE_DIR:dir,CODEX_PRIMARY_RUNTIME_NODE_MODULES:fault?temp:realModules,MUSEUM_REAL_BROWSER_MODULES:realModules,MUSEUM_FAULT:fault||''}});
  if(result.error&&process.platform!=='win32'&&result.pid){try{process.kill(-result.pid,'SIGKILL')}catch(e){if(e.code!=='ESRCH')throw e}}
  fs.writeFileSync(path.join(dir,'stdout.log'),result.stdout||'');fs.writeFileSync(path.join(dir,'stderr.log'),result.stderr||'');
  const rec={name,kind,exit:result.status,signal:result.signal,error:result.error?.message,pass:false};records.push(rec);
  if(fault==='runner-timeout'){assert.equal(result.error?.code,'ETIMEDOUT');assert.notEqual(result.status,0);rec.pass=true;console.log(name,'PASS (intentional 1ms process timeout, not product failure)');continue;}
  assert(!result.error&&!result.signal,`${name}: subprocess incomplete`);
  const report=JSON.parse(fs.readFileSync(path.join(dir,kind+'.json'),'utf8'));
  if(fault==='cleanup-failure'){assert.notEqual(result.status,0);assert.match(result.stderr,/injected cleanup failure/);assert(require('./stage2r-result.cjs').failures(report,kind).length>0);rec.pass=true;console.log(name,'PASS (incomplete result rejected)');continue;}
  assert(report.finished,`${name}: report unfinished`);assert.equal(report.conditions.length,kind==='smoke'?12:40,`${name}: missing conditions`);
  const engines=new Set(report.conditions.map(x=>x.engine));assert(engines.has('chromium')&&engines.has('webkit'));
  if(!fault||fault==='modal-delayed'){assert.equal(result.status,0,`${name}: normal run failed`);assert.deepEqual(require('./stage2r-result.cjs').failures(report,kind),[]);}
  else{
   assert.notEqual(result.status,0,`${name}: negative control accepted`);
   for(const engine of ['chromium','webkit']){
    const conditions=report.conditions.filter(x=>x.engine===engine);
    if(fault==='modal-stuck')assert(conditions.filter(x=>x.width).every(x=>x.status==='FAIL'&&/waitForFunction|Timeout/.test(x.error||'')),`${engine}: modal fault not detected`);
    else if(fault.startsWith('focus-'))assert(conditions.every(x=>x.checks.some(c=>c.name==='Select keyboard focus'&&!c.pass)),`${engine}: ring loss not detected`);
    else assert(conditions.filter(x=>!x.noJS).every(x=>x.errors.some(e=>e.includes('late-pageerror'))),`${engine}: late pageerror not retained`);
   }
  }
  if(fault==='focus-clipped'){
   assert.equal(result.status,1,'clip must reach the validator and exit1');
   assert.deepEqual(report.failures,[],'clip must not fail through launch/navigation');
   for(const c of report.conditions){
    assert(!c.error,'clip must complete interactions');
    const f=c.checks.find(x=>x.name==='Select keyboard focus');
    assert(f&&!f.pass&&f.detail.active&&f.detail.visible&&f.detail.painted,'clip must retain the old style-only false GREEN preconditions');
    assert.equal(f.detail.rendered.status,'FAIL');assert.equal(f.detail.rendered.changed,0,'clip must remove all measured ring paint');
    assert(c.checks.filter(x=>x.name!=='Select keyboard focus').every(x=>x.pass),'unrelated failure must not satisfy clip negative control');
   }
   assert(require('./stage2r-result.cjs').failures(report,'matrix').length>0,'validator must reject clipped output');
  }
  rec.pass=true;console.log(name,'PASS',result.status);
 }
 assert.equal(records.length,requested?requested.length:cases.length,'incomplete acceptance set');
}catch(e){console.error(e);process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'acceptance.json'),JSON.stringify({finished:new Date().toISOString(),scope:'real Chromium/WebKit; fault-injected controls separate from normal product runs',records,status:records.length&&records.every(x=>x.pass)&&!process.exitCode?'PASS':'FAIL'},null,2));fs.rmSync(temp,{recursive:true,force:true});}
