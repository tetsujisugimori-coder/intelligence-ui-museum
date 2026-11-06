// Read-only evidence gate. Trust anchor is supplied by the caller, never the report.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function audit(root,head,tree){
 const bad=[];const need=(ok,reason)=>{if(!ok)bad.push(reason);};
 const read=f=>{try{return JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));}catch{bad.push('missing/invalid JSON: '+f);return null;}};
 const manifest=read('manifest.json');
 if(manifest){need(manifest.head===head,'HEAD mismatch');need(manifest.tree===tree,'tree mismatch');need(manifest.complete===true,'incomplete manifest');need(manifest.files&&Object.keys(manifest.files).length>100,'incomplete file manifest');
  for(const [f,h]of Object.entries(manifest.files||{})){try{const target=fs.realpathSync(path.join(root,f));need(target.startsWith(fs.realpathSync(root)+path.sep),'unsafe evidence path');need(hash(fs.readFileSync(target))===h,'hash mismatch: '+f);}catch{bad.push('missing artifact: '+f);}}
 }
 const steps=read('steps.json');const required=['preservation','unit','install1','install2','build1','build2','authenticity','baseline','reproduce','sdk','matrix','focus','faults'];
 need(Array.isArray(steps)&&steps.length===required.length,'incomplete stages');
 for(const name of required){const matches=steps?.filter?.(s=>s.name===name)||[];need(matches.length===1&&matches[0].exit===0&&!matches[0].signal&&!!matches[0].started&&!!matches[0].finished&&!!matches[0].command,'stage failed/missing: '+name);}
 const m=read('matrix/results.json'),f=read('focus/results.json'),faults=read('faults/results.json'),identity=read('identity.json');
 if(identity){need(identity.head===head&&identity.tree===tree,'identity mismatch');need(identity.source&&identity.build&&identity.runners,'missing source/build/runner identity');}
 if(m){need(m.head===head&&m.tree===tree,'matrix identity mismatch');need(JSON.stringify(m.source)===JSON.stringify(identity?.source),'source mismatch');need(JSON.stringify(m.build)===JSON.stringify(identity?.build),'build mismatch');need(m.status==='PASS'&&m.failures?.length===0&&!m.fault,'matrix failure');need(m.rows?.length===32,'expected 32 conditions');
  const seen=new Set();for(const r of m.rows||[]){const k=[r.engine,r.width,r.theme,r.text].join('-');need(!seen.has(k),'duplicate matrix condition');seen.add(k);need(r.height===1000,'wrong height');need(r.status==='PASS'&&!r.error,'failed matrix condition');
   const names=['environment','layout','Button','Badge','Alert','Switch','Select','Tooltip','errors'];need(r.checks?.length===names.length&&names.every(n=>r.checks.filter(c=>c.name===n&&c.pass===true).length===1),'missing/failed assertion');
   need(r.images?.length===11&&r.images.every(p=>manifest?.files?.['matrix/'+p]&&p.endsWith('.png')),'missing required image');
   need(r.errors?.length===0&&r.console?.every(e=>e.classification==='known-font-CSP'),'unexpected browser error');
  }
  for(const engine of ['chromium','webkit'])for(const width of [320,375,390,1280])for(const theme of ['light','dark'])for(const text of [100,200])need(seen.has([engine,width,theme,text].join('-')),'missing condition');
 }
 if(f){need(f.status==='PASS'&&f.failures?.length===0&&f.rows?.length===44&&f.faults?.length===14&&f.regressions?.length===4,'focus incomplete/failure');need(JSON.stringify(f.identity)===JSON.stringify(identity?.source),'focus source mismatch');for(const engine of ['chromium','webkit'])for(const id of ['A','B'])for(const way of ['mouse','keyboard','escape']){const cases=f.rows?.filter(r=>r.engine===engine&&r.condition.id===id&&r.way===way)||[];need(cases.length===1&&cases[0].verdict?.pass&&cases[0].after?.sameOpener&&cases[0].after?.hasFocus&&cases[0].after?.visibility==='visible','focus case failed/missing');need(!!manifest?.files?.[`focus/${engine}-${id}-${way}.png`],'focus image missing');} }
 if(faults){need(faults.status==='PASS'&&faults.rows?.length===6,'fault suite incomplete');for(const name of ['alert-reopen','pageerror','focus-missing','focus-clipped','body-focus','wrong-trigger']){const r=faults.rows?.find(x=>x.fault===name);need(r?.exit===1&&r?.reasonMatched===true&&r?.engines?.length===2,'fault not rejected for expected reason: '+name);}}
 return [...new Set(bad)];
}
module.exports={audit};
if(require.main===module){const [root,head,tree]=process.argv.slice(2);const bad=audit(path.resolve(root),head,tree);console.log(JSON.stringify({status:bad.length?'FAIL':'PASS',failures:bad},null,2));process.exitCode=bad.length?1:0;}
