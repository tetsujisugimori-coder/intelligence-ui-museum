'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os');
const {spawnSync,execFileSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const source=fs.readFileSync(path.join(__dirname,'original-browser.cjs'),'utf8');
const SOURCE_HASH='a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1';
if(sha(source)!==SOURCE_HASH)throw Error('Original runner hash mismatch');
const lane=process.env.THIRD_LANE||'original',engine=process.env.THIRD_ENGINE||'webkit',focus=process.env.THIRD_FOCUS||'legacy';
const n=Number(process.env.THIRD_REPEATS||'1');
if(!['original','events','exact','minimal','historical'].includes(lane)||!['webkit','chromium'].includes(engine)||!['legacy','direct','tab'].includes(focus)||!Number.isSafeInteger(n)||n<1||n>20)throw Error('Invalid condition');
const out=path.resolve(process.env.THIRD_OUT||path.join(repo,'.work/third-'+lane+'-'+engine+'-'+focus));if(fs.existsSync(out))throw Error('Fresh output required');fs.mkdirSync(out,{recursive:true});
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:repo,encoding:'utf8'}).trim();
let code=source,interventions=[];
if(lane==='historical'){code=fs.readFileSync(path.join(__dirname,'historical-integrated-browser.cjs'),'utf8');if(sha(code)!=='94d6111fb59f4c7b192dc20759d1dbad63913efc084f4f8678236f229adb1ee1')throw Error('Historical runner hash mismatch');interventions.push('saved original Windows20 diagnostic, including historical rAF/event instrumentation');}
if(lane==='exact'||lane==='minimal'){
 // Byte-preserved prefix and Select operations; narrow only the matrix to observed condition.
 code=code.replace("(fault?[1280]:[320,375,390,1280])","[375]").replace("(fault?['light']:['light','dark'])","['light']").replace("(fault?[100]:[100,200])","[100]").replace("*(fault?1:16)","*1");interventions.push('matrix narrowed to 375 light 100; prefix/ring/screenshot operations retained');
 if(focus!=='legacy'){
  const from="await t.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');assert(await t.evaluate(e=>document.activeElement===e),'Tab/ShiftTab');";
  const to=focus==='direct'?"await t.focus();assert(await t.evaluate(e=>document.activeElement===e),'direct focus');":"await p.locator('#Select input[type=checkbox]').focus();await p.keyboard.press('Tab');assert(await t.evaluate(e=>document.activeElement===e),'native Tab from explicit anchor');";
  if(!code.includes(from))throw Error('Focus source anchor missing');code=code.replace(from,to);interventions.push(focus==='direct'?'direct locator.focus route':'explicit preceding anchor focus then native Tab; not pure keyboard navigation from document start');
 }
 if(lane==='minimal'){
  const from="window.s3events=[];for(const type of ['focusin','focusout','keydown','pointerdown'])document.addEventListener(type,x=>window.s3events.push({time:performance.now(),type,key:x.key,target:{tag:x.target.tagName,id:x.target.id,role:x.target.getAttribute('role')}}),true);";
  if(!code.includes(from))throw Error('Event source anchor missing');code=code.replace(from,'window.s3events=[];');interventions.push('original Select event listeners omitted; opener assignment and all action awaits retained');
 }
}
const dirtyAtStart=execFileSync('git',['status','--porcelain'],{cwd:repo,encoding:'utf8'}).trim();
const generated=path.join(__dirname,'.third-generated-'+process.pid+'.cjs');fs.writeFileSync(generated,code);
const runs=[];
const app=path.resolve(process.env.APP_ROOT||path.join(repo,'.work/v10'));
const productSource=Object.fromEntries(['src/main.tsx','src/main.css','src/select-focus-return.ts','package.json','package-lock.json'].map(f=>{const expected=sha(execFileSync('git',['show',`HEAD:apps/v10/${f}`],{cwd:repo}));if(sha(fs.readFileSync(path.join(app,f)))!==expected)throw Error('Isolated source does not match HEAD: '+f);return [f,expected];}));
try{for(let i=0;i<n;i++){
 const dest=path.join(out,'run-'+String(i+1).padStart(2,'0'));const script=['original','events'].includes(lane)?path.join(__dirname,'original-browser.cjs'):generated;
 const env={...process.env,CODEX_PRIMARY_RUNTIME_NODE_MODULES:path.join(repo,'tools/stage-a-browser/node_modules'),S3_ENGINES:engine,EVIDENCE_DIR:dest,THIRD_PROBE:lane==='events'?'events':lane==='exact'?'full':'none'};
 const p=spawnSync(process.execPath,['--require',path.join(__dirname,'third-preload.cjs'),script],{cwd:repo,env,encoding:'utf8',timeout:420000,maxBuffer:8*1024*1024});
 fs.writeFileSync(path.join(out,`run-${i+1}.stdout.txt`),p.stdout||'');fs.writeFileSync(path.join(out,`run-${i+1}.stderr.txt`),p.stderr||'');
 let result=null;try{result=JSON.parse(fs.readFileSync(path.join(dest,'results.json')));}catch{}
 const expected=lane==='historical'?20:['original','events'].includes(lane)?16:1;
 const select=result?.rows.map(row=>({id:row.id,status:row.status,select:row.checks.find(c=>c.name==='Select'),prefix:row.checks.filter(c=>['environment','layout','Button','Badge','Alert','Switch'].includes(c.name)),errors:row.errors,final:row.final}))||[];
 const ids=lane==='historical'?Array.from({length:20},(_,i)=>`webkit-375-light-100-fresh${i+1}`):['original','events'].includes(lane)?[320,375,390,1280].flatMap(w=>['light','dark'].flatMap(t=>[100,200].map(z=>`${engine}-${w}-${t}-${z}`))):[`${engine}-375-light-100`];
 const auditReasons=require('./third-audit.cjs').audit(result,{head,tree,runner:sha(code),source:productSource,ids},p);
 const complete=auditReasons.length===0;
 const traceFiles=fs.existsSync(dest)?fs.readdirSync(dest).filter(f=>/^third-trace-/.test(f)):[];
 const traceReasons=traceFiles.length===expected?[]:['TRACE_COUNT_MISMATCH'];
 for(let j=1;j<=expected;j++){const name=`third-trace-${j}.json`;try{const t=JSON.parse(fs.readFileSync(path.join(dest,name)));traceReasons.push(...require('./third-audit.cjs').traceAudit(t,env.THIRD_PROBE));}catch{traceReasons.push('TRACE_FILE_MISSING_OR_INVALID');}}
 const traceValid=traceReasons.length===0;
 const unexpectedSelect=select.filter(r=>!r.select?.pass&&!String(r.select?.error).includes('THIRD_POLICY_FORCED_CLICK_NOT_TESTED'));
 runs.push({traceReasons,auditReasons,unexpectedSelect:unexpectedSelect.map(r=>({id:r.id,error:r.select?.error})),run:i+1,exit:p.status,signal:p.signal,error:p.error?String(p.error):null,complete,traceValid,originalSuiteStatus:result?.status||'NOT_TESTED',select});
 console.log(JSON.stringify({lane,engine,focus,run:i+1,exit:p.status,complete,traceValid}));
}}finally{fs.unlinkSync(generated);}
const result={schema:1,head,tree,dirtyAtStart,sourceRunnerCommit:'ea6f19acfd60b37e9b147daa92e79838fd2f3070',sourceRunnerHash:SOURCE_HASH,executedHash:sha(code),lane,engine,focus,repeats:n,platform:os.platform(),release:os.release(),node:process.version,diagnosticHashes:Object.fromEntries(['third-run.cjs','third-preload.cjs','third-probe.cjs','third-audit.cjs'].map(f=>[f,sha(fs.readFileSync(path.join(__dirname,f)))])),interventions,limits:['Original later disabled force-click rejected as NOT_TESTED, not silently executed','Original suite FAIL is not diagnostic proof of Select failure; inspect per-check errors','No product/SDK changes; old evidence not overwritten'],runs};
result.status=runs.length===n&&runs.every(r=>r.complete&&r.traceValid)?'COMPLETE':'INCOMPLETE';
fs.writeFileSync(path.join(out,'third-results.json'),JSON.stringify(result,null,2));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
result.diagnosticFailures=runs.flatMap(r=>r.unexpectedSelect);
fs.writeFileSync(path.join(out,'third-results.json'),JSON.stringify(result,null,2));
fs.writeFileSync(path.join(out,'THIRD-SHA256SUMS.json'),JSON.stringify(Object.fromEntries(walk(out).map(f=>[path.relative(out,f).split(path.sep).join('/'),sha(fs.readFileSync(f))])),null,2));
process.exitCode=result.status==='COMPLETE'&&!result.diagnosticFailures.length?0:1;
