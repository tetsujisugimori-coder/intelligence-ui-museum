'use strict';
// Test-only subprocess replay, not a browser execution. Rebase HEAD/tree metadata
// to the wrapper under test; keep source, runner, trace and PNG bytes unchanged.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../../..'),dest=process.env.EVIDENCE_DIR;
fs.cpSync(path.join(__dirname,'../fixtures/audit-policy-stop'),dest,{recursive:true});
const file=path.join(dest,'results.json'),r=JSON.parse(fs.readFileSync(file)),row=r.rows[0],find=n=>row.checks.find(c=>c.name===n);
const receiptFile=path.join(dest,'third-policy-1.json'),receipt=JSON.parse(fs.readFileSync(receiptFile));
receipt.runToken=process.env.THIRD_RUN_TOKEN;
if(process.env.THIRD_LANE==='minimal'){
 r.runner=crypto.createHash('sha256').update(fs.readFileSync(process.env.THIRD_RUNNER_PATH)).digest('hex');receipt.runnerHash=r.runner;
 const site=require('../third-audit.cjs').policyCallsite(fs.readFileSync(process.env.THIRD_RUNNER_PATH,'utf8'));receipt.callsite={line:site.line,column:site.firstColumn+6,matched:true};
 const file=path.join(dest,'third-trace-1.json'),t=JSON.parse(fs.readFileSync(file));
 fs.writeFileSync(file,JSON.stringify({level:'none',final:{scrollY:t.final.scrollY,hasFocus:t.final.hasFocus,active:t.final.active.id}}));
}
fs.writeFileSync(receiptFile,JSON.stringify(receipt,null,2));
for(const k of ['head','tree'])r[k]=execFileSync('git',['rev-parse',k==='head'?'HEAD':'HEAD^{tree}'],{cwd:repo,encoding:'utf8'}).trim();
switch(process.env.THIRD_REPLAY_CASE){
 case 'console-null':row.console=[null];break;
 case 'images-invalid':row.images={};break;
 case 'receipt-coordinate':receipt.callsite.line=1;fs.writeFileSync(receiptFile,JSON.stringify(receipt));break;
 case 'receipt-token':receipt.runToken='old-token-0000000000';fs.writeFileSync(receiptFile,JSON.stringify(receipt));break;
 case 'paint-tamper':fs.copyFileSync(path.join(dest,row.selectPaint.images[1]),path.join(dest,row.selectPaint.images[0]));break;
 case 'Button-false':find('Button').pass=false;find('Button').error='injected Button failure';break;
 case 'environment-false':find('environment').pass=false;find('environment').error='injected environment failure';break;
 case 'missing':row.checks=row.checks.filter(c=>c.name!=='Button');break;
 case 'duplicate':row.checks.push(structuredClone(find('Button')));break;
 case 'status-contradiction':row.status='PASS';break;
 case 'unexpected-select':find('Select').error='Error: unexpected select failure';break;
 case 'substring':find('Select').error='Error: unrelated failure includes THIRD_POLICY_FORCED_CLICK_NOT_TESTED suffix';break;
 case 'pageerror':row.errors.push('injected pageerror');break;
 case 'focus-lost':row.selectPaint.active=false;break;
 case 'ring-clipped':row.selectPaint.clipping.push('injected clipping');break;
 case 'stale-head':r.head='0'.repeat(40);break;
 case 'null-row':r.rows=[null];break;
 case 'null-check':row.checks[0]=null;break;
 case 'trace-incomplete':{const f=path.join(dest,'third-trace-1.json'),t=JSON.parse(fs.readFileSync(f));t.events=[];fs.writeFileSync(f,JSON.stringify(t));break;}
 case 'trace-final-type':{const f=path.join(dest,'third-trace-1.json'),t=JSON.parse(fs.readFileSync(f));t.final=true;fs.writeFileSync(f,JSON.stringify(t));break;}
 case 'receipt-missing':fs.unlinkSync(path.join(dest,'third-policy-1.json'));break;
}
fs.writeFileSync(file,JSON.stringify(r,null,2));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=fs.readdirSync(dest).filter(f=>f!=='SHA256SUMS.json');
fs.writeFileSync(path.join(dest,'SHA256SUMS.json'),JSON.stringify(Object.fromEntries(files.map(f=>[f,sha(fs.readFileSync(path.join(dest,f)))])),null,2));
if(process.env.THIRD_REPLAY_CASE==='evidence-corrupt')fs.appendFileSync(path.join(dest,row.images[0]),'tamper');
if(process.env.THIRD_REPLAY_CASE==='evidence-missing')fs.unlinkSync(path.join(dest,row.images[0]));
process.exitCode=process.env.THIRD_REPLAY_CASE==='exit-contradiction'?0:1;
