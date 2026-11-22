'use strict';
const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const C=require('./wave14-browser-contract.cjs');
const {matrix,assets,execution,workflow,keyOf}=require('./wave14-browser.cjs');
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
 if(process.env.GITHUB_ACTIONS){
  a.match(process.env.EXPECTED_HEAD,oid);a.equal(r.head,process.env.EXPECTED_HEAD);a.equal(r.prHead,process.env.EXPECTED_HEAD);
  for(const [field,key] of [['run','GITHUB_RUN_ID'],['attempt','GITHUB_RUN_ATTEMPT'],['event','GITHUB_EVENT_NAME'],['job','GITHUB_JOB']]){
   a.ok(process.env[key]);a.equal(r[field],process.env[key]);
  }
  a.equal(r.event,'pull_request');a.equal(r.job,'wave14');
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
  const trace=read(row.key+'.trace.zip');a.ok(trace.length>22&&trace.subarray(0,4).compare(Buffer.from([80,75,3,4]))===0,'trace ZIP');
  a.deepEqual(row.screenshots.map(x=>x.id),c.zoom===2?C.ids:[]);
  for(const x of row.screenshots){
   a.equal(x.file,row.key+'-'+x.id+'.png','screenshot exact filename');
   const b=read(x.file);a.equal(b.length,x.size);a.equal(hash(b),x.sha256);
   a.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');a.equal(b.subarray(12,16).toString(),'IHDR');
   a.ok(b.readUInt32BE(16)>0&&b.readUInt32BE(20)>0,'screenshot dimensions');
  }
 }
 const missing=structuredClone(r.results[0]);missing.steps[163].splice(1,1);
 a.throws(()=>C.checkCondition(missing,matrix[0]),/operation count/);
 const wrong=structuredClone(r.results[0]);wrong.steps[163][0].operation.expect.deliberatelyWrong=true;
 a.throws(()=>C.checkCondition(wrong,matrix[0]),/operation\/expected mismatch/);
 const contradictory=structuredClone(r.results[0]);contradictory.steps[163][0].state.deliberatelyWrong=true;
 // An added non-contract product field is legal; corrupt a required field instead.
 contradictory.steps[163][0].state.result=null;
 a.throws(()=>C.checkCondition(contradictory,matrix[0]),/state mismatch/);
 const rerun=structuredClone(r.results);rerun[1].key=rerun[0].key;
 a.throws(()=>checkMatrix(rerun),/unique condition keys/);
 const incomplete={...r.execution};delete incomplete['wave14-browser.cjs'];
 a.throws(()=>expectMap(incomplete,[...execution,workflow],'execution source set'),/execution source set/);
 const count=r.results.reduce((n,row)=>n+Object.values(row.steps).reduce((k,x)=>k+x.length,0),0);
 console.log('PASS '+r.results.length+' conditions / '+count+' operation records / 5 auditor negatives; HAR and Git source bytes agree');
}
if(require.main===module)inspect(process.argv[2]);
module.exports={inspect,checkMatrix,expectMap};
