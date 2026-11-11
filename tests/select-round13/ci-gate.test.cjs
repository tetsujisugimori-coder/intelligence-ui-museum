'use strict';
// Execute the actual workflow shell with command exits injected. No browser evidence
// is fabricated, and this test does not upload anything or grant privacy approval.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process'),{test}=require('node:test'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'../..');
function exercise(workflow,fault){
 const lines=workflow.split('\n'),start=lines.findIndex(l=>l==='      - name: Run paired diagnosis and original audit');
 assert.ok(start>=0,'workflow evidence step exists');
 const run=lines.findIndex((l,i)=>i>start&&l==='        run: |');let end=run+1;while(end<lines.length&&(!lines[end]||lines[end].startsWith('          ')))end++;
 const script=lines.slice(run+1,end).map(l=>l.slice(10)).join('\n');
 const dir=fs.mkdtempSync(path.join(path.join(repo,'.work'),'round13-ci-test-')),bin=path.join(dir,'bin');fs.mkdirSync(bin);
 const stub=`#!/usr/bin/env node\nconst fs=require('node:fs');const name=process.argv[2],a=process.argv.slice(3);if(name==='git'){console.log('a'.repeat(40));process.exit(0)}if(a[0]==='-p'){console.log('linux');process.exit(0)}let phase=a.includes('tests/select-round13/run.cjs')?'runner':a.includes('tests/select-round13/audit.cjs')?'auditor':a.includes('tests/select-round13/evidence.test.cjs')?'contracts':null;if(a.includes('tests/select-round13/privacy-check.cjs')){let n=fs.existsSync('privacy-count')?Number(fs.readFileSync('privacy-count')):0;fs.writeFileSync('privacy-count',String(n+1));phase=n?'final-privacy':'privacy'}if(phase){fs.appendFileSync('calls',phase+'\\n');console.log(JSON.stringify({status:'PASS',diagnostic:'PASS',errors:[]}));}process.exit(process.env.ROUND13_FAULT===phase?17:0);\n`;
 // Absolute interpreter avoids recursive PATH lookup into this node stub.
 const q=s=>"'"+s.replaceAll("'","'\"'\"'")+"'",posix=s=>s.replaceAll('\\','/');
 fs.writeFileSync(path.join(dir,'stub.cjs'),stub);
 for(const name of ['node','git'])fs.writeFileSync(path.join(bin,name),'#!/usr/bin/env bash\nexec '+q(posix(process.execPath))+' '+q(posix(path.join(dir,'stub.cjs')))+' '+name+' \"$@\"\n',{mode:0o755});
 const output=path.join(dir,'output');fs.writeFileSync(output,'');fs.writeFileSync(path.join(dir,'step.sh'),script);
 const result=spawnSync('bash',['--noprofile','--norc','-eo','pipefail','step.sh'],{cwd:dir,env:{...process.env,PATH:bin+path.delimiter+process.env.PATH,GITHUB_OUTPUT:output,ROUND13_FAULT:fault||''},encoding:'utf8'});
 const outputs=Object.fromEntries(fs.readFileSync(output,'utf8').trim().split('\n').filter(Boolean).map(l=>l.split('=')));
 const uploadStep=workflow.slice(workflow.indexOf('      - name: Upload privacy-approved raw evidence'),workflow.indexOf('      - name: Upload status only'));
 const gate=uploadStep.match(/if: (.*)/)?.[1];assert.ok(gate,'raw upload condition exists');
 let allowed;
 if(gate.includes("outputs.raw_upload == 'true'")){assert.ok(gate.includes("steps.evidence.outcome == 'success'"));allowed=result.status===0&&outputs.raw_upload==='true';}
 else {assert.ok(gate.includes("outputs.privacy == '0'"));allowed=outputs.privacy==='0';}
 const statusDir=path.join(dir,'.work/round13-status');const statuses=fs.existsSync(statusDir)?Object.fromEntries(fs.readdirSync(statusDir).filter(n=>n.endsWith('-exit.txt')).map(n=>[n,fs.readFileSync(path.join(statusDir,n),'utf8').trim()])):{};
 const report={fault:fault||'normal',exit:result.status,rawUploadAllowed:allowed,outputs,statuses,calls:fs.existsSync(path.join(dir,'calls'))?fs.readFileSync(path.join(dir,'calls'),'utf8').trim().split('\n'):[],stderr:result.stderr};
 fs.rmSync(dir,{recursive:true,force:true});return report;
}
module.exports={exercise};
if(require.main===module&&process.argv.includes('--report')){
 const file=process.argv[process.argv.indexOf('--report')+1],workflow=fs.readFileSync(file,'utf8');console.log(JSON.stringify(['', 'contracts','final-privacy'].map(f=>exercise(workflow,f)),null,2));
}else{
 const workflow=fs.readFileSync(path.join(repo,'.github/workflows/select-round13.yml'),'utf8');
 for(const fault of ['', 'runner','auditor','privacy','contracts','final-privacy'])test('actual workflow gate '+(fault||'normal'),()=>{
  const r=exercise(workflow,fault);assert.equal(r.exit,fault?1:0,JSON.stringify(r));assert.equal(r.rawUploadAllowed,!fault);assert.equal(r.outputs.raw_upload,String(!fault));
  for(const p of ['runner','auditor','privacy','contracts','final-privacy'])assert.equal(r.statuses[p+'-exit.txt'],p===fault?'17':'0');
  assert.match(workflow,/name: Upload status only\n\s+if: always\(\)/);
 });
}
