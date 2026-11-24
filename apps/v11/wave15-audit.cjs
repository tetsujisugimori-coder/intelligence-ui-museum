'use strict';
const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const C=require('./wave15-browser-contract.cjs');
const {matrix,assets,execution,workflow,keyOf}=require('./wave15-browser.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const expectMap=(map,keys,label)=>a.deepEqual(Object.keys(map).sort(),keys.slice().sort(),label);
function checkMatrix(rows){
 a.equal(rows.length,matrix.length,'condition count');
 a.deepEqual(rows.map(r=>r.key),matrix.map(keyOf),'exact ordered unique condition keys');
}
function inspect(dir){
 const read=f=>fs.readFileSync(path.join(dir,f));
 const r=JSON.parse(read('results.json'));
 const git=(...args)=>cp.execFileSync('git',args);
 const oid=/^[0-9a-f]{40}$/;
 a.match(r.head,oid);a.match(r.tree,oid);
 a.equal(r.tree,git('rev-parse',r.head+'^{tree}').toString().trim());
 a.equal(r.head,git('rev-parse','HEAD').toString().trim(),'auditor checkout head');
 a.equal(r.playwright,'1.56.1');
 a.equal(r.prHead,r.head,'recorded PR head');
 if(process.env.GITHUB_ACTIONS){
  a.match(process.env.EXPECTED_HEAD,oid);a.equal(r.head,process.env.EXPECTED_HEAD);a.equal(r.prHead,process.env.EXPECTED_HEAD);
  for(const [field,key] of [['run','GITHUB_RUN_ID'],['attempt','GITHUB_RUN_ATTEMPT'],['event','GITHUB_EVENT_NAME'],['job','GITHUB_JOB']]){
   a.ok(process.env[key]);a.equal(r[field],process.env[key]);
  }
  a.equal(r.event,'pull_request');a.equal(r.job,'wave15');
 }
 expectMap(r.execution,[...execution,workflow],'execution source set');
 expectMap(r.source,assets,'served asset set');
 for(const f of assets)a.equal(hash(git('show',r.head+':apps/v11/'+f)),r.source[f],'Git tracked served bytes '+f);
 for(const [f,v] of Object.entries(r.execution)){
  a.equal(hash(read('execution/'+f)),v,'copied execution hash '+f);
  a.equal(hash(git('show',r.head+':'+(f===workflow?'.github/workflows/':'apps/v11/')+f)),v,'fixed execution source '+f);
 }
 checkMatrix(r.results);
 for(const [i,row] of r.results.entries()){
  const c=matrix[i];a.equal(row.status,'PASS');C.checkCondition(row,c);
  const entries=JSON.parse(read(row.key+'.har')).log.entries;
  a.deepEqual(entries.map(e=>new URL(e.request.url).pathname.slice(1)||'index.html').sort(),assets.slice().sort(),'HAR exact request set');
  const origins=new Set();
  for(const e of entries){
   const u=new URL(e.request.url),f=u.pathname.slice(1)||'index.html';
   a.equal(u.protocol,'http:');a.equal(u.hostname,'127.0.0.1');a.equal(u.search,'');origins.add(u.origin);
   a.equal(e.request.method,'GET');a.equal(e.response.status,200);
   const body=e.response.content;
   a.equal(typeof body.text,'string');a.ok(body.encoding===undefined||body.encoding==='base64');
   const b=Buffer.from(body.text,body.encoding==='base64'?'base64':'utf8');
   a.equal(hash(b),r.source[f],'HAR response bytes '+f);
  }
  a.equal(origins.size,1,'one isolated HTTP origin');
  a.deepEqual(row.cleanupErrors,[],'browser closed without cleanup error');
  // An apparently valid ZIP prefix is not sufficient; read every trace entry.
  cp.execFileSync('python3',['-c',`import sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
  names = z.namelist()
  if not names or len(set(names)) != len(names) or not any(n.endswith('.trace') for n in names) or z.testzip() is not None:
    raise ValueError('invalid trace ZIP entries/CRC')
`,path.join(dir,row.key+'.trace.zip')]);
  a.deepEqual(row.screenshots.map(x=>x.id),c.zoom===2?C.ids:[]);
  for(const x of row.screenshots){
   a.equal(x.file,row.key+'-'+x.id+'.png','screenshot exact filename');
   const b=read(x.file);a.equal(b.length,x.size);a.equal(hash(b),x.sha256);
   a.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');a.equal(b.subarray(12,16).toString(),'IHDR');
   a.ok(b.readUInt32BE(16)>0&&b.readUInt32BE(20)>0,'screenshot dimensions');
  }
 }
 const c=matrix[0],original=r.results[0];
 const negative=(mutate,reason)=>{
  const row=structuredClone(original);mutate(row);
  a.throws(()=>C.checkCondition(row,c),reason);
 };
 negative(row=>{row.steps[166].splice(1,1);},/operation count/);
 negative(row=>{row.steps[166][0].operation.expect.state='filtered';},/operation\/expected mismatch/);
 negative(row=>{row.steps[166][0].state='filtered';},/observed state mismatch/);
 negative(row=>{row.steps[167].find(x=>x.operation.expect.state==='exhausted').timeline[2][1]='400';},/observed timeline mismatch/);
 negative(row=>{row.steps[168].find(x=>x.operation.expect.state==='blocked-unknown').effects='2';},/observed effects mismatch/);
 negative(row=>{row.steps[168].find(x=>x.operation.key==='control').controlOutput.fault='1';},/observed controlOutput mismatch/);
 const rerun=structuredClone(r.results);rerun[1].key=rerun[0].key;
 a.throws(()=>checkMatrix(rerun),/unique condition keys/);
 const incomplete={...r.execution};delete incomplete['wave15-browser.cjs'];
 a.throws(()=>expectMap(incomplete,[...execution,workflow],'execution source set'),/execution source set/);
 const count=r.results.reduce((n,row)=>n+Object.values(row.steps).reduce((k,x)=>k+x.length,0),0);
 console.log('PASS '+r.results.length+' conditions / '+count+' operation records / 8 auditor negatives; HAR and Git source bytes agree; trace ZIP CRC checked');
}
if(require.main===module)inspect(process.argv[2]);
module.exports={inspect,checkMatrix,expectMap};
