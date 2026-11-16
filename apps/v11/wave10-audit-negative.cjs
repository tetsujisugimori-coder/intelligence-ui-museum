'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),crypto=require('node:crypto'),{audit}=require('./wave10-audit.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function inventory(root){const out={};function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile())out[path.relative(root,p)]={size:fs.statSync(p).size,sha256:hash(fs.readFileSync(p))};else throw Error('nonregular evidence');}}walk(root);return out;}
// Copy mutable JSON, share immutable binaries via hardlinks to bound temporary capacity.
// Mutators below touch ONLY copied results.json/faults.json, never source files or links.
function copy(from,to){for(const e of fs.readdirSync(from,{withFileTypes:true})){const f=path.join(from,e.name),t=path.join(to,e.name);if(e.isDirectory()){fs.mkdirSync(t);copy(f,t);}else if(e.isFile()){if(e.name==='results.json'||e.name==='faults.json')fs.copyFileSync(f,t);else fs.linkSync(f,t);}else throw Error('nonregular evidence');}}
function run(source){source=path.resolve(source);a.ok(process.env.TMPDIR&&!path.resolve(process.env.TMPDIR).startsWith('/tmp'),'dedicated TMPDIR');const before=inventory(source),original=JSON.parse(fs.readFileSync(path.join(source,'results.json'))),normal=audit(source),temp=fs.mkdtempSync(path.join(process.env.TMPDIR,'wave10-neg-')),results=[];
 const row=r=>r.results[0],step=(r,n)=>row(r).steps.find(x=>x.name===n);
 const cases=[
 ['condition-missing',r=>r.results.pop(),/condition set/],['condition-duplicate',r=>r.results[1]=r.results[0],/condition set/],['condition-ID',r=>row(r).id='wrong',/condition set/],
 ['row-HEAD',r=>row(r).head='0'.repeat(40),/row HEAD/],['row-tree',r=>row(r).tree='0'.repeat(40),/row tree/],['checkout',r=>r.ci.checkout='0'.repeat(40),/checkout attribution/],
 ['source',r=>r.source['wave10.js']='0'.repeat(64),/Git\/source/],['execution',r=>r.execution['wave10-browser.cjs']='0'.repeat(64),/execution source/],
 ['status',r=>row(r).status='SKIP',/formal condition/],['pageerror',r=>row(r).errors.push('injected'),/browser errors/],['step-missing',r=>row(r).steps.pop(),/fixed step set/],
 ['overflow',r=>row(r).steps[0].documentFits=false,/document overflow/],['keyboard',r=>row(r).accessibility[151].back=false,/native keyboard/],['focus',r=>step(r,'151-reset').rendered[151].activeKey='run',/reset focus/],
 ['fonts',r=>row(r).steps[0].fonts[0].size=0,/measured text size/],['asset-missing',r=>row(r).responses.pop(),/response asset set/],
 ['budget-number',r=>step(r,'151-normal').states[151].result.used=99,/independent/],['budget-render',r=>step(r,'151-normal').rendered[151].capacity='使用 99 / 残容量 0',/render capacity/],
 ['budget-fixed-input',r=>row(r).steps[0].states[151].items[0].size=99,/initial fixed items|fixed|independent/],
 ['tool-payload',r=>step(r,'152-normal').states[152].result.payload.value='wrong',/independent/],['tool-ID-render',r=>step(r,'152-normal').rendered[152].ids='wrong',/render tool IDs/],
 ['tool-history',r=>step(r,'152-normal').rendered[152].history.pop(),/render tool history/],
 ['regression-verdict',r=>step(r,'153-normal').states[153].result.rows[0].change='REGRESSED',/independent/],['regression-render',r=>step(r,'153-normal').rendered[153].rows[0].heading='r1：REGRESSED',/render row change/],
 ['regression-condition',r=>step(r,'153-normal').rendered[153].rows[0].checks[0]='required：PASS',/render row conditions/],
 ['stale-result',r=>{step(r,'151-budget-edited').states[151].result=step(r,'151-normal').states[151].result;},/independent|input invalidation/],
 ['same-input',r=>step(r,'151-same').states[151].revision++,/same input consistency/],
 ['reset-budget',r=>step(r,'151-final-reset').states[151].budget=0,/fixed full state/],
 ['reset-priority',r=>step(r,'151-final-reset').states[151].items[2].priority=9,/fixed full state/],
 ['reset-tool',r=>step(r,'152-final-reset').states[152].tool='delete',/fixed full state/],
 ['reset-args',r=>step(r,'152-final-reset').states[152].args='{"key":"beta"}',/fixed full state/],
 ['reset-epoch',r=>step(r,'152-final-reset').states[152].epoch=0,/fixed full state/],
 ['initial-counter',r=>row(r).steps[0].states[152].counter=99,/fixed full state/],
 ['priority-edit-ignored',r=>{step(r,'151-priority-input').states[151]=structuredClone(step(r,'151-restored').states[151]);},/fixed full state/],
 ['priority-stale-result',r=>{step(r,'151-priority-input-edited').states[151].result=structuredClone(step(r,'151-restored').states[151].result);},/fixed full state/],
 ['priority-same-value-invalidates',r=>{step(r,'151-priority-input-same').states[151].result=null;},/fixed full state/],
 ['condition-reason',r=>{step(r,'153-normal').rendered[153].rows[0].checks[0]='required:title：FAIL / present';},/render row conditions and reasons/],
 ['details-not-opened',r=>{step(r,'153-details-open').rendered[153].details.open=false;},/fixed visible input details/],
 ['details-old-output',r=>{step(r,'153-details-open').rendered[153].details.texts[1]='wrong';},/fixed visible input details/],
 ['details-expectation',r=>{step(r,'153-details-open').rendered[153].details.texts[0]='{}';},/fixed visible input details/]
 ];
 for(const[id,mutate,pattern]of cases){const d=path.join(temp,id);fs.mkdirSync(d);copy(source,d);const r=JSON.parse(fs.readFileSync(path.join(d,'results.json')));mutate(r);fs.writeFileSync(path.join(d,'results.json'),JSON.stringify(r));let error;try{audit(d);}catch(e){error=e;}a.ok(error,'false acceptance '+id);a.match(String(error),new RegExp(pattern.source+'|fixed full state'),'unrelated failure '+id);a.doesNotMatch(String(error),/E2BIG|ETIMEDOUT|spawnSync.*ENOENT/,'infrastructure failure');results.push({id,normal:'ACCEPT',fault:'REJECT',reason:String(error)});}
 a.deepEqual(inventory(source),before,'original unchanged');a.equal(audit(source).status,'PASS');const result={head:original.head,tree:original.tree,normal,results,originalUnchanged:true,originalFiles:Object.keys(before).length,auditorSHA256:hash(fs.readFileSync(path.join(__dirname,'wave10-audit.cjs'))),runnerSHA256:hash(fs.readFileSync(__filename)),capacity:'Immutable evidence hardlinked for synthetic mutants; only independent JSON copies are changed. Not an evidence preservation readback.'};fs.writeFileSync(path.join(source,'audit-negative.json'),JSON.stringify(result,null,2),{flag:'wx'});return result;
}
module.exports={run,inventory};if(require.main===module)console.log(JSON.stringify(run(process.argv[2]),null,2));
