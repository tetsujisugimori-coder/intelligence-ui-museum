const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const out=path.resolve(process.env.EVIDENCE_DIR),repo=path.resolve(__dirname,'../..');
if(fs.existsSync(out))throw Error('fresh output required');fs.mkdirSync(out,{recursive:true});const rows=[];
for(const [fault,reason]of [['alert-reopen','Alert'],['pageerror','errors'],['focus-missing','Select'],['focus-clipped','Select'],['body-focus','Select'],['wrong-trigger','Select']]){
 const dir=path.join(out,fault),p=spawnSync(process.execPath,[path.join(__dirname,'browser.cjs')],{env:{...process.env,S3_ENGINES:'chromium,webkit',S3_FAULT:fault,EVIDENCE_DIR:dir},encoding:'utf8',timeout:180000,maxBuffer:16e6});
 fs.writeFileSync(path.join(out,fault+'.stdout.log'),p.stdout||'');fs.writeFileSync(path.join(out,fault+'.stderr.log'),p.stderr||'');
 const row={fault,reason,exit:p.status,signal:p.signal,error:p.error?.message,reasonMatched:false,engines:[]};
 try{const r=JSON.parse(fs.readFileSync(path.join(dir,'results.json')));row.engines=r.rows.map(r=>r.engine);row.reasonMatched=p.status===1&&!p.signal&&!p.error&&r.rows.length===2&&r.failures.length===0&&r.rows.every(x=>x.checks.some(c=>c.name===reason&&!c.pass)&&x.checks.filter(c=>c.name!==reason).every(c=>c.pass));}catch(e){row.error=String(e);}
 rows.push(row);console.log(row);
}
const status=rows.every(r=>r.reasonMatched)?'PASS':'FAIL';fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({status,rows,finished:new Date().toISOString()},null,2));process.exitCode=status==='PASS'?0:1;
