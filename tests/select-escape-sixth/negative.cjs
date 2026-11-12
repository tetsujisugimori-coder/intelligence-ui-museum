'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process'),assert=require('node:assert/strict'),{auditDirectory,auditRow}=require('./audit.cjs');
const root=process.env.SIXTH_NEGATIVE_OUT||'.work/sixth-negative';if(fs.existsSync(root))throw Error('Fresh negatives required');fs.mkdirSync(root,{recursive:true});
const results=[];
for(const fault of ['focus-body','outline-missing','outline-clip','pageerror']){
 const out=path.resolve(root,fault),p=spawnSync(process.execPath,[path.join(__dirname,'run.cjs')],{encoding:'utf8',env:{...process.env,SIXTH_OUT:out,SIXTH_ENGINES:process.env.SIXTH_ENGINES||'chromium',SIXTH_ROUTES:'tab',SIXTH_REPEATS:'1',SIXTH_FAULT:fault}});fs.writeFileSync(path.join(root,fault+'.log'),p.stdout+p.stderr);
 const data=JSON.parse(fs.readFileSync(path.join(out,'results.json')));assert.equal(data.rows.length,2);assert(data.rows.every(r=>!auditRow(r).productOK));assert(data.rows.every(r=>r.paint),'Fault must reach actual PNG capture');if(fault==='pageerror')assert(data.rows.every(r=>r.errors.length>0));results.push({fault,rows:2,rejected:2,exit:p.status});
}
fs.writeFileSync(path.join(root,'negative-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
