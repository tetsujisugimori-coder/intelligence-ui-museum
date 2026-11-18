'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),crypto=require('node:crypto'),{audit}=require('./wave12-audit.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function inventory(root){const out={};function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile())out[path.relative(root,p)]={size:fs.statSync(p).size,sha256:hash(fs.readFileSync(p))};else throw Error('nonregular evidence');}}walk(root);return out;}
// Copy mutable JSON, share immutable binaries via hardlinks to bound temporary capacity.
// Mutators below touch ONLY copied results.json/faults.json, never source files or links.
function copy(from,to){for(const e of fs.readdirSync(from,{withFileTypes:true})){const f=path.join(from,e.name),t=path.join(to,e.name);if(e.isDirectory()){fs.mkdirSync(t);copy(f,t);}else if(e.isFile()){if(['results.json','faults.json','core-manifest.json'].includes(e.name))fs.copyFileSync(f,t);else fs.linkSync(f,t);}else throw Error('nonregular evidence');}}
function run(source){source=path.resolve(source);a.ok(process.env.TMPDIR&&!path.resolve(process.env.TMPDIR).startsWith('/tmp'),'dedicated TMPDIR');const before=inventory(source),original=JSON.parse(fs.readFileSync(path.join(source,'results.json'))),normal=audit(source),temp=fs.mkdtempSync(path.join(process.env.TMPDIR,'wave12-neg-')),results=[];
 const row=r=>r.results[0],step=(r,n)=>row(r).steps.find(x=>x.name===n);
 const cases=[
 ['condition-missing',r=>r.results.pop(),/condition set/],['condition-duplicate',r=>r.results[1]=r.results[0],/condition set/],
 ['row-HEAD',r=>row(r).head='0'.repeat(40),/row HEAD/],['row-tree',r=>row(r).tree='0'.repeat(40),/row tree/],['checkout',r=>r.ci.checkout='0'.repeat(40),/checkout attribution/],
 ['source',r=>r.source['wave12.js']='0'.repeat(64),/Git\/source/],['execution',r=>r.execution['wave12-browser.cjs']='0'.repeat(64),/execution source/],
 ['status',r=>row(r).status='SKIP',/formal condition/],['pageerror',r=>row(r).errors.push('injected'),/browser errors/],['step-missing',r=>row(r).steps.pop(),/fixed step set/],
 ['overflow',r=>row(r).steps[0].documentFits=false,/document overflow/],['keyboard',r=>row(r).accessibility[157].back=false,/native keyboard/],['focus',r=>step(r,'157-reset').rendered[157].activeKey='run',/reset focus/],
 ['fonts',r=>row(r).steps[0].fonts[0].size=0,/measured text size/],['asset-missing',r=>row(r).responses.pop(),/response asset set/],
 ['uncertainty-answer',r=>step(r,'157-contradiction').states[157].result.status='ANSWERABLE',/fixed full state/],
 ['coverage-row',r=>step(r,'157-normal').states[157].result.rows[0].support=99,/coverage evidence rows/],
 ['disclosure-payload',r=>step(r,'158-normal').states[158].result.payload.secret='FICTIONAL-SECRET-ONLY',/fixed full state/],
 ['disclosure-row',r=>step(r,'158-normal').states[158].result.rows[0].action='exclude',/disclosure decisions/],
 ['secret-dom',r=>step(r,'158-normal').rendered[158].secretAbsent=false,/secret raw excluded/],
 ['correction-applied',r=>step(r,'159-conflict').states[159].result.applied=['c1'],/fixed full state/],
 ['correction-diff',r=>step(r,'159-normal').states[159].result.changes[0].after=0,/correction diffs/],
 ['reason',r=>step(r,'157-nan').states[157].result.reasons=['valid'],/fixed reason/],
 ['render-reason',r=>step(r,'157-normal').rendered[157].reasons=['fabricated'],/visible reasons/],
 ['stale-visible-status',r=>step(r,'157-input-edited').rendered[157].status='ANSWERABLE',/visible status/],
 ['stale-visible-verdict',r=>step(r,'157-input-edited').rendered[157].verdict='ANSWERABLE',/stale verdict/],
 ['stale-result',r=>step(r,'157-input-edited').states[157].result=step(r,'157-normal').states[157].result,/fixed full state/],
 ['same-value',r=>step(r,'157-input-same').states[157].revision++,/fixed full state/],
 ['history-missing',r=>step(r,'159-normal').states[159].history=[],/fixed full state/],
 ['history-render',r=>step(r,'159-normal').rendered[159].historyJSON=[],/visible historical records/],
 ['operation-substitute',r=>step(r,'157-input-edited').operation.type='scenario',/fixed operation/],
 ['screenshot-missing',r=>r.results.find(x=>x.zoom===2).screenshots.pop(),/representative screenshot set/],
 ['screenshot-hash',r=>r.results.find(x=>x.zoom===2).screenshots[0].sha256='0'.repeat(64),/screenshot hash/]
 ];
 for(const[id,mutate,pattern]of cases){const d=path.join(temp,id);fs.mkdirSync(d);copy(source,d);const r=JSON.parse(fs.readFileSync(path.join(d,'results.json')));mutate(r);fs.writeFileSync(path.join(d,'results.json'),JSON.stringify(r));let error;try{audit(d);}catch(e){error=e;}a.ok(error,'false acceptance '+id);a.match(String(error),new RegExp(pattern.source+'|fixed full state'),'unrelated failure '+id);a.doesNotMatch(String(error),/E2BIG|ETIMEDOUT|spawnSync.*ENOENT/,'infrastructure failure');results.push({id,normal:'ACCEPT',fault:'REJECT',reason:String(error)});}
 for(const [id,mutate] of [['manifest-hash',m=>m.files['results.json'].sha256='0'.repeat(64)],['manifest-missing',m=>delete m.files['results.json']],['manifest-extra',m=>m.files['invented']={size:0,sha256:'0'.repeat(64)}]]){const d=path.join(temp,id);fs.mkdirSync(d);copy(source,d);const m=JSON.parse(fs.readFileSync(path.join(d,'core-manifest.json')));mutate(m);fs.writeFileSync(path.join(d,'core-manifest.json'),JSON.stringify(m));let err;try{audit(d);}catch(e){err=e;}a.ok(err,'false manifest acceptance');a.match(String(err),/manifest/);results.push({id,normal:'ACCEPT',fault:'REJECT',reason:String(err)});}
 a.deepEqual(inventory(source),before,'original unchanged');a.equal(audit(source).status,'PASS');const result={head:original.head,tree:original.tree,normal,results,originalUnchanged:true,originalFiles:Object.keys(before).length,auditorSHA256:hash(fs.readFileSync(path.join(__dirname,'wave12-audit.cjs'))),runnerSHA256:hash(fs.readFileSync(__filename)),capacity:'Immutable evidence hardlinked for synthetic mutants; only independent JSON copies are changed. Not an evidence preservation readback.'};fs.writeFileSync(path.join(source,'audit-negative.json'),JSON.stringify(result,null,2),{flag:'wx'});return result;
}
module.exports={run,inventory};if(require.main===module)console.log(JSON.stringify(run(process.argv[2]),null,2));
