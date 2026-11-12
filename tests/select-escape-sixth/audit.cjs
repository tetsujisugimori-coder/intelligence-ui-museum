'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function auditRow(r){
 const reasons=[],fail=s=>reasons.push(s),events=r.trace?.events;
 if(!/^[a-f0-9]{40}$/.test(r.head||'')||!/^[a-f0-9]{40}$/.test(r.tree||'')||!['linux','win32'].includes(r.os)||!r.node||r.sdk!=='0.2.2'||r.playwright!=='1.56.1'||r.viewport?.width!==375||r.viewport?.height!==1000||r.theme!=='light'||r.rootPercent!==100)fail('trial-provenance');
 if(r.status!=='COMPLETE'||r.error)fail('incomplete');
 if(!['A','B'].includes(r.condition)||!['direct','tab','legacy'].includes(r.route)||!['chromium','webkit'].includes(r.engine)||!Number.isInteger(r.i)||r.i<1||r.id!==`${r.engine}-${r.route}-${r.i}-${r.condition}`)fail('condition-identity');
 if(!Array.isArray(r.checks)||JSON.stringify(r.checks.map(x=>x.name))!==JSON.stringify(['environment','layout','Button','Badge','Alert','Switch'])||r.checks.some(x=>x.pass!==true))fail('prelude');
 if(!Array.isArray(r.errors)||r.errors.length)fail('pageerror');
 if(!Array.isArray(events)||events.length<1||r.trace?.overflow)fail('trace-missing');
 else{
 if(events.some((e,i)=>!Number.isFinite(e.ms)||e.seq!==i+1||(i&&e.ms<events[i-1].ms)))fail('trace-order');
 const start=events.findIndex(e=>e.kind==='target-escape-start'),end=events.findIndex(e=>e.kind==='target-escape-complete');
 if(start<0||end<=start||events.filter(e=>e.kind==='target-escape-start').length!==1||events.filter(e=>e.kind==='target-escape-complete').length!==1)fail('target-boundary');
 const selected=events.slice(start,end+1);
 const kinds=['keydown','keydown-settled','keyup','keyup-settled'];
 for(const kind of kinds)if(selected.filter(e=>e.kind===kind&&e.key==='Escape'&&e.trusted===true).length!==1)fail('escape-event-'+kind);
 const down=selected.findIndex(e=>e.kind==='keydown'&&e.key==='Escape'),up=selected.findIndex(e=>e.kind==='keyup'&&e.key==='Escape');if(down<0||up<=down)fail('key-order');
 const before=selected.filter(e=>e.kind==='preventDefault-before'),after=selected.filter(e=>e.kind==='preventDefault-after');
 if(before.length!==after.length||!before.length||before.some(e=>!e.stack||e.trusted!==true)||after.some(e=>e.defaultPrevented!==true))fail('cancel-trace');
 const focus=selected.findIndex(e=>e.kind==='focus-call'&&e.stack);
 if(focus<0)fail('focus-call-missing');
 if(!selected.slice(focus+1).some(e=>e.kind==='focus-return'&&e.active?.role==='button'))fail('focus-return-missing');
 if(!selected.some(e=>e.kind==='mutation-callback'&&e.stack))fail('mutation-callback-missing');
 if(selected.find(e=>e.kind==='keydown-settled')?.defaultPrevented!==true)fail('settled-cancellation-contradiction');
 if(before.length!==(r.condition==='A'?2:1))fail('unexpected-cancel-count');
 const cancellation=selected.filter(e=>e.kind.startsWith('preventDefault-'));
 if(cancellation.some((e,i)=>e.kind!==(i%2?'preventDefault-after':'preventDefault-before')||e.key!=='Escape'||e.trusted!==true||e.defaultPrevented!==(i>0)))fail('cancel-order-state');
 const lastCancel=selected.map(e=>e.kind).lastIndexOf('preventDefault-after'),settled=selected.findIndex(e=>e.kind==='keydown-settled'),returned=selected.findIndex((e,i)=>i>focus&&e.kind==='focus-return');
 if(!(down<selected.findIndex(e=>e.kind==='preventDefault-before')&&lastCancel<settled&&settled<up&&focus>down&&returned>focus))fail('event-causal-order');
 }
 if(!r.paint||!Array.isArray(r.paint.images)||r.paint.images.length!==4||new Set(r.paint.images).size!==4||!Number.isFinite(r.paint.changed)||!Array.isArray(r.paint.clipping)||typeof r.paint.active!=='boolean'||typeof r.paint.visible!=='boolean'||typeof r.paint.pass!=='boolean')fail('paint-evidence');
 if(!Array.isArray(r.images)||r.paint?.images?.some(f=>!r.images.includes(f)))fail('paint-manifest-membership');
 const productOK=reasons.length===0&&r.paint.active===true&&r.paint.visible===true&&r.paint.clipping.length===0&&r.paint.pass===true&&r.paint.changed>0&&r.paint.unstable===0;
 if(r.productOutline!==(productOK?'PASS':'FAIL'))fail('product-classification');
 return {diagnosticOK:reasons.length===0,productOK:productOK&&reasons.length===0,reasons};
}
function auditDirectory(dir, expected={}){
 const reasons=[],manifest=JSON.parse(fs.readFileSync(path.join(dir,'SHA256SUMS.json'))),r=JSON.parse(fs.readFileSync(path.join(dir,'results.json')));
 const plan=r.plan;let planned=[];if(!plan||!Array.isArray(plan.engines)||!Array.isArray(plan.routes)||!Number.isInteger(plan.repeats)||plan.repeats<1||JSON.stringify(plan.conditions)!=='["A","B"]'||plan.engines.some(x=>!['webkit','chromium'].includes(x))||plan.routes.some(x=>!['direct','tab','legacy'].includes(x))||!plan.engines.length||!plan.routes.length)reasons.push('plan-missing');else planned=plan.engines.flatMap(e=>plan.routes.flatMap(t=>Array.from({length:plan.repeats},(_,i)=>plan.conditions.map(c=>`${e}-${t}-${i+1}-${c}`)).flat()));
 if(!planned.length||planned.length!==r.expected||new Set(planned).size!==planned.length||JSON.stringify([...planned].sort())!==JSON.stringify(r.rows.map(x=>x.id).sort()))reasons.push('planned-trials-mismatch');
 if(expected.plan&&JSON.stringify(expected.plan)!==JSON.stringify(plan))reasons.push('requested-plan-mismatch');
 const actual=fs.readdirSync(dir).filter(f=>f!=='SHA256SUMS.json').sort();if(JSON.stringify(actual)!==JSON.stringify(Object.keys(manifest).sort()))reasons.push('manifest-coverage');
 for(const [f,h]of Object.entries(manifest)){if(f!==path.basename(f)||!fs.existsSync(path.join(dir,f))||sha(fs.readFileSync(path.join(dir,f)))!==h)reasons.push('hash-'+f);}
 const requiredSource=['src/main.tsx','src/main.css','src/select-focus-return.ts','package.json','package-lock.json'];if(JSON.stringify(Object.keys(r.source||{}).sort())!==JSON.stringify(requiredSource.sort()))reasons.push('source-keys-mismatch');
 if(expected.repo){const {execFileSync}=require('node:child_process');if(r.originalRunnerSha256!==sha(execFileSync('git',['show',`${r.head}:tests/select-webkit-timeline/original-browser.cjs`],{cwd:expected.repo})))reasons.push('original-runner-hash-mismatch');const requiredRunner=execFileSync('git',['ls-tree','-r','--name-only',r.head,'tests/select-escape-sixth'],{cwd:expected.repo,encoding:'utf8'}).trim().split('\n').filter(f=>/\.(cjs|mjs)$/.test(f));if(!requiredRunner.length||JSON.stringify(requiredRunner.sort())!==JSON.stringify(Object.keys(r.runnerSource||{}).sort()))reasons.push('runner-keys-mismatch');for(const [f,h]of Object.entries({...Object.fromEntries(Object.entries(r.source||{}).map(([f,h])=>['apps/v10/'+f,h])),...(r.runnerSource||{})})){try{if(sha(execFileSync('git',['show',`${r.head}:${f}`],{cwd:expected.repo}))!==h)reasons.push('source-hash-'+f);}catch{reasons.push('source-unavailable-'+f);}}if(!r.runnerSource||Object.keys(r.source||{}).length!==5)reasons.push('source-manifest-missing');}
 if(expected.buildRoot){const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.relative(expected.buildRoot,path.join(d,e.name)).split(path.sep).join('/')]);if(JSON.stringify(files(expected.buildRoot).sort())!==JSON.stringify(Object.keys(r.build||{}).sort()))reasons.push('build-keys-mismatch');for(const [f,h]of Object.entries(r.build||{})){const actual=path.resolve(expected.buildRoot,f);if(!actual.startsWith(path.resolve(expected.buildRoot)+path.sep)||!fs.existsSync(actual)||sha(fs.readFileSync(actual))!==h)reasons.push('build-hash-'+f);}}
 if(expected.head&&r.head!==expected.head)reasons.push('head-mismatch');if(expected.tree&&r.tree!==expected.tree)reasons.push('tree-mismatch');
 if(!/^[a-f0-9]{40}$/.test(r.head)||!/^[a-f0-9]{40}$/.test(r.tree)||r.failures.length||r.rows.length!==r.expected)reasons.push('run-metadata');
 const ids=new Set();for(const row of r.rows){if(row.head!==r.head||row.tree!==r.tree||row.node!==r.node||row.os!==r.os)reasons.push('trial-provenance-mismatch-'+row.id);if(ids.has(row.id))reasons.push('duplicate-trial');ids.add(row.id);const a=auditRow(row);reasons.push(...a.reasons.map(x=>row.id+':'+x));if(!manifest[row.id+'.json']||JSON.stringify(JSON.parse(fs.readFileSync(path.join(dir,row.id+'.json'))))!==JSON.stringify(row))reasons.push('raw-row-'+row.id);for(const f of [...(row.images||[]),...(row.paint?.images||[])])if(!manifest[f])reasons.push('missing-image-'+f);
 if(row.paint?.images?.length===4&&row.paint.images.every(f=>f===path.basename(f)&&fs.existsSync(path.join(dir,f)))){try{const {PNG}=require('../../tools/stage-a-browser/node_modules/playwright-core/lib/utilsBundle.js'),{measure}=require('../../apps/v10/scripts/stage2r-focus-pixels.cjs');const g=row.paint.rect,decoded=row.paint.images.map(f=>PNG.sync.read(fs.readFileSync(path.join(dir,f))));const m=measure(decoded,{x:Math.max(0,Math.floor(g.x-24)),y:Math.max(0,Math.floor(g.y-24))},[{x:g.x,y:g.y,width:g.width,height:g.height}]);if(m.changed!==row.paint.changed||m.unstable!==row.paint.unstable||JSON.stringify(m.indicators)!==JSON.stringify(row.paint.indicators))reasons.push('pixel-recalculation-'+row.id);}catch{reasons.push('invalid-PNG-'+row.id);}}}
 return {diagnosticOK:!reasons.length,productPass:reasons.length?0:r.rows.filter(x=>auditRow(x).productOK).length,productFail:r.rows.filter(x=>!auditRow(x).productOK).length,unverified:reasons.length?r.rows.length:0,reasons};
}
module.exports={auditRow,auditDirectory};
if(require.main===module){const {execFileSync}=require('node:child_process'),git=x=>execFileSync('git',x,{encoding:'utf8'}).trim();const r=auditDirectory(process.argv[2],{plan:{engines:(process.env.SIXTH_ENGINES||'webkit,chromium').split(','),routes:(process.env.SIXTH_ROUTES||'direct,tab,legacy').split(','),repeats:Number(process.env.SIXTH_REPEATS||5),conditions:['A','B']},repo:process.cwd(),buildRoot:path.resolve('.work/sixth-build'),head:process.env.SIXTH_EXPECTED_HEAD||git(['rev-parse','HEAD']),tree:process.env.SIXTH_EXPECTED_TREE||git(['rev-parse','HEAD^{tree}'])});console.log(JSON.stringify(r,null,2));process.exitCode=r.diagnosticOK?0:1;}
