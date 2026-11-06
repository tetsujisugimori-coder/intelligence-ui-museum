// Read-only evidence gate. Trust anchor is supplied by the caller, never the report.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function audit(root,head,tree){
 const bad=[];const need=(ok,reason)=>{if(!ok)bad.push(reason);};
 const read=f=>{try{return JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));}catch{bad.push('missing/invalid JSON: '+f);return null;}};
 const manifest=read('manifest.json');
 if(manifest){need(manifest.head===head,'HEAD mismatch');need(manifest.tree===tree,'tree mismatch');need(manifest.complete===true,'incomplete manifest');need(manifest.files&&Object.keys(manifest.files).length>100,'incomplete file manifest');
  for(const [f,h]of Object.entries(manifest.files||{})){try{const target=fs.realpathSync(path.join(root,f));need(target.startsWith(fs.realpathSync(root)+path.sep),'unsafe evidence path');need(hash(fs.readFileSync(target))===h,'hash mismatch: '+f);}catch{bad.push('missing artifact: '+f);}}
 }
 const steps=read('steps.json');const required=['preservation','unit','install1','install2','build1','build2','authenticity','baseline','reproduce','sdk','matrix','focus','faults'];
 const bound=f=>need(typeof manifest?.files?.[f]==='string','required manifest entry missing: '+f);
 for(const f of ['identity.json','steps.json','sdk.json','matrix/results.json','focus/results.json','faults/results.json'])bound(f);
 for(const name of required)for(const stream of ['stdout','stderr'])bound(name+'.'+stream+'.log');
 need(Array.isArray(steps)&&steps.length===required.length,'incomplete stages');
 for(const name of required){const matches=steps?.filter?.(s=>s.name===name)||[];need(matches.length===1&&matches[0].exit===0&&!matches[0].signal&&!matches[0].error&&!!matches[0].started&&!!matches[0].finished&&!!matches[0].command,'stage failed/missing: '+name);}
 const m=read('matrix/results.json'),f=read('focus/results.json'),faults=read('faults/results.json'),identity=read('identity.json');
 const sdk=read('sdk.json');
 const lock=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../apps/v10/package-lock.json')));
 const locked=lock.packages['node_modules/@openai/apps-sdk-ui'];
 if(sdk)need(sdk.status==='PASS'&&sdk.version==='0.2.2'&&sdk.integrity===locked.integrity&&sdk.resolved===locked.resolved&&Object.keys(sdk.files||{}).length===2645&&Object.values(sdk.files||{}).every(h=>/^[a-f0-9]{64}$/.test(h)),'SDK evidence contradicts fixed package');
 if(identity){need(identity.head===head&&identity.tree===tree,'identity mismatch');need(identity.source&&identity.build&&identity.runners,'missing source/build/runner identity');
  try{
   const repo=path.resolve(__dirname,'../..'),git=(...args)=>execFileSync('git',args,{cwd:repo});
   need(git('rev-parse',head+'^{tree}').toString().trim()===tree,'claimed HEAD/tree mismatch');
   const sourceFiles=['src/main.tsx','src/main.css','src/select-focus-return.ts','package.json','package-lock.json'];
   const expected=Object.fromEntries(sourceFiles.map(f=>[f,hash(git('show',`${head}:apps/v10/${f}`))]));
   need(JSON.stringify(identity.source)===JSON.stringify(expected),'source differs from trusted Git HEAD');
   const runnerFiles=git('ls-tree','-r','--name-only',head,'scripts/s3-reaccept').toString().trim().split('\n').filter(Boolean);
   const runners=Object.fromEntries(runnerFiles.map(f=>[f,hash(git('show',`${head}:${f}`))]));
   need(JSON.stringify(Object.entries(identity.runners||{}).sort())===JSON.stringify(Object.entries(runners).sort()),'runner differs from trusted Git HEAD');
  }catch{bad.push('unresolvable trusted Git HEAD');}
 }
 if(m){need(m.head===head&&m.tree===tree,'matrix identity mismatch');need(JSON.stringify(m.source)===JSON.stringify(identity?.source),'source mismatch');need(JSON.stringify(m.build)===JSON.stringify(identity?.build),'build mismatch');need(m.status==='PASS'&&m.failures?.length===0&&!m.fault,'matrix failure');need(m.rows?.length===32,'expected 32 conditions');
  const seen=new Set();for(const r of m.rows||[]){const k=[r.engine,r.width,r.theme,r.text].join('-');need(!seen.has(k),'duplicate matrix condition');seen.add(k);need(r.height===1000,'wrong height');need(r.status==='PASS'&&!r.error,'failed matrix condition');
   const names=['environment','layout','Button','Badge','Alert','Switch','Select','Tooltip','errors'];need(r.checks?.length===names.length&&names.every(n=>r.checks.filter(c=>c.name===n&&c.pass===true).length===1),'missing/failed assertion');
   const expectedImages=[...['Button','Select'].flatMap(c=>['on','off','off2','on2'].map(x=>`${k}-${c}-${x}.png`)),...['Badge','Alert','Tooltip'].map(c=>`${k}-${c}.png`)];
   need(r.images?.length===11&&new Set(r.images).size===11&&expectedImages.every(p=>r.images.includes(p)&&manifest?.files?.['matrix/'+p]),'missing required image');
   need(r.errors?.length===0&&r.console?.every(e=>e.classification==='known-font-CSP'),'unexpected browser error');
  }
  for(const engine of ['chromium','webkit'])for(const width of [320,375,390,1280])for(const theme of ['light','dark'])for(const text of [100,200])need(seen.has([engine,width,theme,text].join('-')),'missing condition');
 }
 if(f){need(f.status==='PASS'&&f.failures?.length===0&&f.rows?.length===44&&f.faults?.length===14&&f.regressions?.length===4,'focus incomplete/failure');need(JSON.stringify(f.identity)===JSON.stringify(identity?.source),'focus source mismatch');
  for(const r of f.rows||[])need(r.verdict?.pass===true&&!r.error&&r.expectationMatched===true&&r.errors?.length===0&&r.after?.sameOpener===true&&r.after?.body===false,'contradictory focus row');
  for(const r of f.faults||[])need(r.expectationMatched===true&&!r.error,'contradictory focus fault');
  const faultNames=['disabled-return','wrong-target','removed-opener','body-after-close','duplicate','recreated-opener','disabled-opener'];
  const regressionChecks=['value-and-return','tab-leaves','shift-tab-returns','escape-retains-value','rapid-repeat','outside-dismiss-no-steal','tab-from-menu-no-steal','button-inputs','button-disabled','button-loading','select-disabled','select-enabled-value','no-pageerror'];
  for(const engine of ['chromium','webkit']){
   for(const name of faultNames)need(f.faults?.filter(r=>r.engine===engine&&r.fault===name).length===1,'missing/duplicate focus fault coverage');
   for(const id of ['A','B'])need(f.regressions?.filter(r=>r.engine===engine&&r.condition?.id===id).length===1,'missing/duplicate regression coverage');
   for(const width of [320,375,390,1280])for(const theme of ['light','dark'])for(const text of [100,200])need(f.rows?.filter(r=>r.engine===engine&&r.condition?.id===`${width}-${theme}-${text}`&&r.condition.width===width&&r.condition.theme===theme&&r.condition.text===text&&r.way==='keyboard').length===1,'missing/duplicate additional focus coverage');
  }
  for(const r of f.regressions||[])need(!r.error&&r.errors?.length===0&&r.checks&&Object.keys(r.checks).length===13&&regressionChecks.every(n=>r.checks[n]===true),'contradictory focus regression');
  for(const engine of ['chromium','webkit'])for(const id of ['A','B'])for(const way of ['mouse','keyboard','escape']){const cases=f.rows?.filter(r=>r.engine===engine&&r.condition.id===id&&r.way===way)||[];need(cases.length===1&&cases[0].verdict?.pass&&cases[0].after?.sameOpener&&cases[0].after?.hasFocus&&cases[0].after?.visibility==='visible','focus case failed/missing');need(!!manifest?.files?.[`focus/${engine}-${id}-${way}.png`],'focus image missing');} }
 if(faults){need(faults.status==='PASS'&&faults.rows?.length===6,'fault suite incomplete');for(const name of ['alert-reopen','pageerror','focus-missing','focus-clipped','body-focus','wrong-trigger']){const matches=faults.rows?.filter(x=>x.fault===name)||[],r=matches[0];need(matches.length===1&&r?.exit===1&&!r?.signal&&!r?.error&&r?.reasonMatched===true&&r?.engines?.length===2&&new Set(r.engines).size===2&&r.engines.includes('chromium')&&r.engines.includes('webkit'),'fault not rejected for expected reason: '+name);}}
 return [...new Set(bad)];
}
module.exports={audit};
if(require.main===module){const [root,head,tree]=process.argv.slice(2);const bad=audit(path.resolve(root),head,tree);console.log(JSON.stringify({status:bad.length?'FAIL':'PASS',failures:bad},null,2));process.exitCode=bad.length?1:0;}
