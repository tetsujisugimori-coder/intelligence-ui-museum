'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),crypto=require('node:crypto'),{audit}=require('./wave11-audit.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function inventory(root){const out={};function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile())out[path.relative(root,p)]={size:fs.statSync(p).size,sha256:hash(fs.readFileSync(p))};else throw Error('nonregular evidence');}}walk(root);return out;}
// Copy mutable JSON, share immutable binaries via hardlinks to bound temporary capacity.
// Mutators below touch ONLY copied results.json/faults.json, never source files or links.
function copy(from,to){for(const e of fs.readdirSync(from,{withFileTypes:true})){const f=path.join(from,e.name),t=path.join(to,e.name);if(e.isDirectory()){fs.mkdirSync(t);copy(f,t);}else if(e.isFile()){if(e.name==='results.json'||e.name==='faults.json')fs.copyFileSync(f,t);else fs.linkSync(f,t);}else throw Error('nonregular evidence');}}
function run(source){source=path.resolve(source);a.ok(process.env.TMPDIR&&!path.resolve(process.env.TMPDIR).startsWith('/tmp'),'dedicated TMPDIR');const before=inventory(source),original=JSON.parse(fs.readFileSync(path.join(source,'results.json'))),normal=audit(source),temp=fs.mkdtempSync(path.join(process.env.TMPDIR,'wave11-neg-')),results=[];
 const row=r=>r.results[0],step=(r,n)=>row(r).steps.find(x=>x.name===n);
 const cases=[
 ['condition-missing',r=>r.results.pop(),/condition set/],['condition-duplicate',r=>r.results[1]=r.results[0],/condition set/],['condition-ID',r=>row(r).id='wrong',/condition set/],
 ['row-HEAD',r=>row(r).head='0'.repeat(40),/row HEAD/],['row-tree',r=>row(r).tree='0'.repeat(40),/row tree/],['checkout',r=>r.ci.checkout='0'.repeat(40),/checkout attribution/],
 ['source',r=>r.source['wave11.js']='0'.repeat(64),/Git\/source/],['execution',r=>r.execution['wave11-browser.cjs']='0'.repeat(64),/execution source/],
 ['status',r=>row(r).status='SKIP',/formal condition/],['pageerror',r=>row(r).errors.push('injected'),/browser errors/],['step-missing',r=>row(r).steps.pop(),/fixed step set/],
 ['overflow',r=>row(r).steps[0].documentFits=false,/document overflow/],['keyboard',r=>row(r).accessibility[154].back=false,/native keyboard/],['focus',r=>step(r,'154-reset').rendered[154].activeKey='run',/reset focus/],
 ['fonts',r=>row(r).steps[0].fonts[0].size=0,/measured text size/],['asset-missing',r=>row(r).responses.pop(),/response asset set/],
 ['ranking-score',r=>step(r,'154-normal').states[154].result.rows[0].score=99,/fixed full state/],
 ['ranking-order',r=>step(r,'154-normal').states[154].result.included.reverse(),/fixed full state/],
 ['memory-conflict',r=>step(r,'155-conflict').states[155].result.status='VALID',/fixed full state/],
 ['memory-expiry',r=>step(r,'155-normal').states[155].result.rows[3].eligible=true,/memory eligibility/],
 ['handoff-accepts-missing',r=>step(r,'156-missing-unresolved').states[156].result.status='ACCEPTED',/fixed full state/],
 ['handoff-reference',r=>{const x=step(r,'156-normal');x.states[156].result.rows[0].id='FAKE';x.rendered[156].rows[0].id='FAKE';},/independent handoff reference rows/],
 ['handoff-included',r=>{const x=step(r,'156-normal');x.states[156].result.included=['FAKE'];x.rendered[156].included='採用：FAKE';},/independent handoff included/],
 ['handoff-truth',r=>step(r,'156-normal').states[156].result.truth='VERIFIED',/truth boundary/],
 ['reason',r=>step(r,'154-negative-weight').states[154].result.reasons=['valid'],/independent reason/],
 ['render-reason',r=>step(r,'154-normal').rendered[154].reasons=['fabricated'],/render reasons/],
 ['render-row',r=>step(r,'155-normal').rendered[155].rows[0].paragraphs[0]='wrong',/render rows and reasons/],
 ['stale-visible-status',r=>{const x=step(r,'154-query-edited');x.rendered[154].status='VALID（入力版0）';x.rendered[154].verdict='VALID';},/unexecuted status/],
 ['stale-visible-verdict',r=>step(r,'154-query-edited').rendered[154].verdict='VALID',/unexecuted verdict/],
 ['stale-result',r=>step(r,'154-query-edited').states[154].result=step(r,'154-normal').states[154].result,/fixed full state/],
 ['same-value',r=>step(r,'154-query-same').states[154].revision++,/fixed full state/],
 ['reset-value',r=>step(r,'155-final-reset').states[155].now=999,/fixed full state/],
 ['reset-previous',r=>step(r,'156-final-reset').states[156].previous='{}',/fixed full state/],
 ['displayed-input',r=>step(r,'154-normal').inputs[154].query='海',/displayed input binding/],
 ['scope-ignored',r=>step(r,'155-scope-project').states[155].m1Scope='global',/fixed full state/],
 ['scope-same-invalidated',r=>step(r,'155-scope-project-same').states[155].result=null,/fixed full state/],
 ['scope-reset-wrong',r=>step(r,'155-scope-reset').states[155].m1Scope='project',/fixed full state/],
 ['operation-substitute',r=>step(r,'154-query-edited').operation.type='scenario',/fixed operation/],
 ['screenshot-missing',r=>r.results.find(x=>x.zoom===2).screenshots.pop(),/representative screenshot set/],
 ['screenshot-hash',r=>r.results.find(x=>x.zoom===2).screenshots[0].sha256='0'.repeat(64),/screenshot hash/]
 ];
 for(const[id,mutate,pattern]of cases){const d=path.join(temp,id);fs.mkdirSync(d);copy(source,d);const r=JSON.parse(fs.readFileSync(path.join(d,'results.json')));mutate(r);fs.writeFileSync(path.join(d,'results.json'),JSON.stringify(r));let error;try{audit(d);}catch(e){error=e;}a.ok(error,'false acceptance '+id);a.match(String(error),new RegExp(pattern.source+'|fixed full state'),'unrelated failure '+id);a.doesNotMatch(String(error),/E2BIG|ETIMEDOUT|spawnSync.*ENOENT/,'infrastructure failure');results.push({id,normal:'ACCEPT',fault:'REJECT',reason:String(error)});}
 a.deepEqual(inventory(source),before,'original unchanged');a.equal(audit(source).status,'PASS');const result={head:original.head,tree:original.tree,normal,results,originalUnchanged:true,originalFiles:Object.keys(before).length,auditorSHA256:hash(fs.readFileSync(path.join(__dirname,'wave11-audit.cjs'))),runnerSHA256:hash(fs.readFileSync(__filename)),capacity:'Immutable evidence hardlinked for synthetic mutants; only independent JSON copies are changed. Not an evidence preservation readback.'};fs.writeFileSync(path.join(source,'audit-negative.json'),JSON.stringify(result,null,2),{flag:'wx'});return result;
}
module.exports={run,inventory};if(require.main===module)console.log(JSON.stringify(run(process.argv[2]),null,2));
