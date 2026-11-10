'use strict';
// Replays exactly the same synthetic counterexamples against the original and
// repaired auditors. RED means the expected rejection was missing before fix.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {fixture,save,manifest}=require('./audit-fixture.cjs');
const repo=path.resolve(__dirname,'../..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'round10-red-green-'));
const before=cp.execFileSync('git',['show','f4914a5ee45bcf886600e627509ddfcc6c917228:tests/select-round10/audit.cjs'],{cwd:repo,encoding:'utf8'});
try{
 const valid=fixture(dir),env={...process.env,ROUND10_EXPECT_HEAD:valid.head,ROUND10_EXPECT_PLATFORM:process.platform,ROUND10_RUNNER_EXIT:'0'};
 const audit=(old,extra={})=>{
  const argv=old?['-e',`const Module=require('module'),path=require('path');const file=${JSON.stringify(path.join(__dirname,'audit.cjs'))};process.argv[2]=${JSON.stringify(dir)};const m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(Buffer.from(${JSON.stringify(Buffer.from(before).toString('base64'))},'base64').toString(),file);`]:[path.join(__dirname,'audit.cjs'),dir];
  const p=cp.spawnSync(process.execPath,argv,{env:{...env,...extra},encoding:'utf8'});return {exit:p.status,errors:JSON.parse(p.stdout).errors};
 };
 const positive={before:audit(true),after:audit(false)};if(positive.before.exit||positive.after.exit)throw Error('Positive fixture rejected: '+JSON.stringify(positive));
 const mutations={
  'swapped checkbox/value input':d=>{const s=d.rows[0].final;[s.disabled[0],s.hidden]=[s.hidden,s.disabled[0]]},
  'duplicate value input at acquisition':d=>{d.rows[0].acquisition.hiddenCount=2},
  'nonempty marker style':d=>{d.rows[0].samples.afterPhoto.hidden.attrs.style='display:none'},
  'focus-visible without focus':d=>{d.rows[0].samples.afterPhoto.focusVisible=true},
  'marker computed style mismatch':d=>{d.rows.find(r=>r.factor==='full-probe'&&r.arm===1).samples.beforeFocus.disabled[0].computed.display='none'},
  'pre-photo geometry mismatch':d=>{d.rows.find(r=>r.factor==='pre-screenshot'&&r.arm===1).samples.beforePhoto.trigger.rect.x++},
  'duplicate pair identities':d=>{d.pairs[1]=structuredClone(d.pairs[0])},
  'forged pixel count':d=>{d.rows[0].paint.changed=999},
  'missing source inventory item':d=>{delete d.sources[Object.keys(d.sources)[0]]}
 };
 const results=[];
 const record=(name,extra={})=>{const b=audit(true,extra),a=audit(false,extra);results.push({counterexample:name,before:b.exit===0?'RED_ACCEPTED_FAULT':'DETECTED',after:a.exit!==0?'GREEN_REJECTED_FAULT':'MISSED',beforeErrors:b.errors,afterErrors:a.errors});if(b.exit!==0||a.exit===0)throw Error('Unexpected red/green result '+name)};
 for(const [name,mutate]of Object.entries(mutations)){const d=structuredClone(valid);mutate(d);save(dir,d);record(name)}
 save(dir,valid);record('actual runner nonzero but JSON zero',{ROUND10_RUNNER_EXIT:'1'});
 const image=path.join(dir,valid.rows[0].images[0]),imageBytes=fs.readFileSync(image);
 fs.writeFileSync(image,'not PNG');manifest(dir);record('malformed PNG with renewed manifest');fs.writeFileSync(image,imageBytes);
 const trace=path.join(dir,valid.rows[0].traceFile),traceBytes=fs.readFileSync(trace);
 fs.writeFileSync(trace,fs.readFileSync(path.join(dir,valid.rows[1].traceFile)));manifest(dir);record('valid trace exchanged between slots');fs.writeFileSync(trace,traceBytes);
 save(dir,valid);const sums=JSON.parse(fs.readFileSync(path.join(dir,'SHA256SUMS.json')));delete sums[valid.rows[0].images[0]];fs.writeFileSync(path.join(dir,'SHA256SUMS.json'),JSON.stringify(sums));record('manifest omits referenced image');
 console.log(JSON.stringify({kind:'SYNTHETIC_COUNTEREXAMPLES_NOT_BROWSER_TRIALS',originalHead:'f4914a5ee45bcf886600e627509ddfcc6c917228',head:valid.head,positive,results},null,2));
}finally{fs.rmSync(dir,{recursive:true,force:true})}
