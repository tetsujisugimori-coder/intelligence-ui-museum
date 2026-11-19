'use strict';
const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const C=require('./wave13-contract.cjs');
const {matrix,assets,execution}=require('./wave13-browser.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function audit(dir){
 const read=f=>fs.readFileSync(path.join(dir,f)),r=JSON.parse(read('results.json'));
 const git=(...args)=>cp.execFileSync('git',args);
 a.equal(r.tree,git('rev-parse',r.head+'^{tree}').toString().trim());
 if(process.env.GITHUB_ACTIONS){
  a.match(process.env.EXPECTED_HEAD,/^[0-9a-f]{40}$/);
  a.equal(r.head,process.env.EXPECTED_HEAD);
  a.equal(r.prHead,process.env.EXPECTED_HEAD);
  for(const [key,env] of [['run','GITHUB_RUN_ID'],['attempt','GITHUB_RUN_ATTEMPT'],['event','GITHUB_EVENT_NAME'],['job','GITHUB_JOB']]){
   a.ok(process.env[env]);a.equal(r[key],process.env[env]);
  }
  a.equal(r.event,'pull_request');a.equal(r.job,'wave13');
 }
 function checkExecution(map){
  a.deepEqual(Object.keys(map).sort(),[...execution,'v11-wave13.yml'].sort(),'execution source set');
 }
 checkExecution(r.execution);
 a.throws(()=>checkExecution({}),/execution source set/);
 a.deepEqual(Object.keys(r.source).sort(),assets.slice().sort(),'asset set');
 for(const [f,want] of Object.entries(r.source))a.equal(hash(git('show',r.head+':apps/v11/'+f)),want,'tracked '+f);
 for(const [f,want] of Object.entries(r.execution)){
  a.equal(hash(read('execution/'+f)),want,'execution copy');
  a.equal(hash(git('show',r.head+':'+(f.endsWith('.yml')?'.github/workflows/':'apps/v11/')+f)),want,'execution Git blob');
 }
 a.equal(r.results.length,14);
 const keys=new Set();
 for(const [i,row] of r.results.entries()){
  const c=matrix[i]; for(const flag of Object.keys(c))a.equal(row[flag],c[flag]);
  a.equal(row.key,[c.engine,c.width,c.theme,c.zoom].join('-'),'canonical condition key');
  a.ok(!keys.has(row.key),'duplicate condition key');keys.add(row.key);
  a.equal(row.status,'PASS'); a.equal(row.themeObserved,c.theme);a.equal(row.reduced,c.zoom===2);
  a.deepEqual(row.errors,[]); C.auditSteps(row);
  for(const id of [160,161,162]){
   a.deepEqual(row.keyboard[id],{tab:'reset',visible:true}); a.equal(row.navigation[id],true);
   const {origin,reached}=row.scroll[id];
   a.ok(reached.bottom>0&&reached.top<reached.max);
   if(origin.top>=origin.max||origin.bottom<=0)a.notEqual(reached.y,origin.y);
   const {before,after}=row.font[id];
   a.ok(Object.keys(before).length>=5);
   for(const [tag,size] of Object.entries(before))a.ok(size>0&&Math.abs(after[tag]-size*c.zoom)<.05);
  }
  const entries=JSON.parse(read(row.key+'.har')).log.entries;
  a.deepEqual(entries.map(x=>new URL(x.request.url).pathname.slice(1)||'index.html').sort(),assets.slice().sort());
  for(const e of entries){
   const u=new URL(e.request.url),f=u.pathname.slice(1)||'index.html';
   a.equal(u.hostname,'127.0.0.1');a.equal(e.response.status,200);
   const body=e.response.content;
   a.equal(hash(Buffer.from(body.text,body.encoding==='base64'?'base64':'utf8')),r.source[f],'HAR body '+f);
  }
  a.ok(read(row.key+'.trace.zip').subarray(0,4).equals(Buffer.from([80,75,3,4])));
  a.deepEqual(row.screenshots.map(x=>x.id),c.zoom===2?[160,161,162]:[]);
  for(const x of row.screenshots){
   a.equal(x.file,row.key+'-'+x.id+'.png','representative screenshot identity');
   const b=read(x.file);a.equal(b.length,x.size);a.equal(hash(b),x.sha256);a.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  }
 }
 const missing=structuredClone(r.results[0]);missing.steps[160].splice(1,1);
 a.throws(()=>C.auditSteps(missing),/operation count/);
 const wrong=structuredClone(r.results[0]);wrong.steps[162][0].operation.expect[0]=20;
 a.throws(()=>C.auditSteps(wrong),/operation\/expected mismatch/);
 console.log('PASS 14 conditions / '+r.results.reduce((n,x)=>n+Object.values(x.steps).flat().length,0)+' records / 3 auditor negatives; HAR and Git bytes agree');
}
audit(process.argv[2]);
