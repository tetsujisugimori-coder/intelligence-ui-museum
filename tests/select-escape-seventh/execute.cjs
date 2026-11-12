'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),crypto=require('node:crypto');
const out=path.resolve(process.env.SEVENTH_OUT||'.work/seventh-results');if(fs.existsSync(out+'.exit.json'))throw Error('fresh execution record required');
const command=path.join(__dirname,'run.cjs'),started=new Date().toISOString(),p=spawnSync(process.execPath,[command],{stdio:'inherit',env:process.env});
const record={started,finished:new Date().toISOString(),command:'tests/select-escape-seventh/run.cjs',commandSha256:crypto.createHash('sha256').update(fs.readFileSync(command)).digest('hex'),exitCode:p.status,signal:p.signal,error:p.error?String(p.error):null};fs.writeFileSync(out+'.exit.json',JSON.stringify(record,null,2));process.exitCode=p.status===0?0:1;
