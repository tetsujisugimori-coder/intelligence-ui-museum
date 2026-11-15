'use strict';
// Evidence-copy controls. Original evidence is never modified by a mutation.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),crypto=require('node:crypto');
const {audit}=require('./wave7-audit.cjs');
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function inventory(root){const rows={};function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile())rows[path.relative(root,p)]=digest(p);else throw Error('non-regular evidence');}}walk(root);return rows;}
function link(from,to){for(const x of fs.readdirSync(from,{withFileTypes:true})){const f=path.join(from,x.name),t=path.join(to,x.name);if(x.isDirectory()){fs.mkdirSync(t);link(f,t);}else if(x.isFile())fs.linkSync(f,t);else throw Error('non-regular evidence');}}
function run(source){source=path.resolve(source);a.ok(process.env.TMPDIR&&!path.resolve(process.env.TMPDIR).startsWith('/tmp'),'dedicated TMPDIR required');const before=inventory(source),base=JSON.parse(fs.readFileSync(path.join(source,'results.json'))),normal=audit(source),results=[];const temp=fs.mkdtempSync(path.join(process.env.TMPDIR,'wave7-audit-controls-'));
const cases=[
 ['wrong-condition-viewport',(d,r)=>{const dst=path.join(d,r.results[0].id+'.png');fs.unlinkSync(dst);const other=r.results.find(x=>x.engine===r.results[0].engine&&x.width===r.results[0].width&&x.zoom===r.results[0].zoom&&x.theme!==r.results[0].theme);a.ok(other,'same-size other-theme control');fs.copyFileSync(path.join(d,other.id+'.png'),dst);},/viewport (size|hash)/],
 ['missing-report',d=>fs.unlinkSync(path.join(d,'results.json')),/ENOENT.*results\.json/s],
 ['missing-image',(d,r)=>fs.unlinkSync(path.join(d,r.results[0].id+'.png')),/ENOENT.*\.png/s],
 ['missing-trace',(d,r)=>fs.unlinkSync(path.join(d,r.results[0].id+'.zip')),/No such file.*\.zip/s],
 ['missing-HAR',(d,r)=>fs.unlinkSync(path.join(d,r.results[0].id+'.har')),/No such file.*\.har/s],
 ['wrong-condition-trace',(d,r)=>{const dst=path.join(d,r.results[0].id+'.zip');fs.unlinkSync(dst);fs.copyFileSync(path.join(d,r.results[1].id+'.zip'),dst);},/AssertionError/],
 ['wrong-ID',(d,r)=>{r.results[0].steps[0].values[142].selected='unknown-node';},/fixed state.*142/],
 ['wrong-state',(d,r)=>{r.results[0].steps[0].values[143].comparison.b.total=999;},/fixed state.*143/],
 ['failed-result',(d,r)=>{r.results[0].status='FAIL';},/PASS/],
 ['forged-success',(d,r)=>{r.results[0].status='PASS';r.results[0].steps[0].values[144].cursor=99;},/fixed state.*144/],
 ['partial-text2x',(d,r)=>{r.results.find(x=>x.zoom===2).steps[0].fonts.find(f=>f.kind==='graph').size=16;},/measured2x/],
 ['wrong-row-head',(d,r)=>{r.results[0].head='0'.repeat(40);},/row HEAD mismatch/],
 ['wrong-row-tree',(d,r)=>{r.results[0].tree='0'.repeat(40);},/row tree mismatch/],
 ['missing-row-identity',(d,r)=>{delete r.results[0].head;delete r.results[0].tree;},/row HEAD mismatch/],
 ['missing-execution-source',d=>fs.unlinkSync(path.join(d,'execution','wave7-browser.cjs')),/ENOENT.*wave7-browser\.cjs/s]
];
for(const [id,mutate,expected] of cases){const d=path.join(temp,id);fs.mkdirSync(d);link(source,d);const r=structuredClone(base);fs.unlinkSync(path.join(d,'results.json'));fs.writeFileSync(path.join(d,'results.json'),JSON.stringify(r));mutate(d,r);if(id!=='missing-report')fs.writeFileSync(path.join(d,'results.json'),JSON.stringify(r));let error;try{audit(d);}catch(e){error=e;}a.ok(error,'false acceptance '+id);a.match(String(error),expected,'unrelated failure '+id);a.doesNotMatch(String(error),/E2BIG|ETIMEDOUT|spawnSync.*ENOENT/,'infrastructure failure is not detection');results.push({id,normal:'ACCEPT',fault:'REJECT',reason:String(error)});}
a.deepEqual(inventory(source),before,'original evidence mutated');const afterNormal=audit(source);a.equal(afterNormal.status,'PASS');const report={sourceHead:base.head,sourceTree:base.tree,normal,results,originalUnchanged:true,originalFileCount:Object.keys(before).length,auditorSHA256:digest(path.join(__dirname,'wave7-audit.cjs')),negativeRunnerSHA256:digest(__filename)};fs.writeFileSync(path.join(source,'audit-negative.json'),JSON.stringify(report,null,2),{flag:'wx'});return report;}
module.exports={run,inventory};if(require.main===module)console.log(JSON.stringify(run(process.argv[2]),null,2));
