"use strict";
// Reuse the same browser script against the exact review HEAD's served files.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{execFileSync,spawn}=require('node:child_process'),assert=require('node:assert/strict');
const {validateTransfer}=require('./transfer-contract.cjs');
const old='b9d3b840162c8d03fa5d2f62c89793ea55ce7d03',repo=path.resolve(__dirname,'../..'),work=path.join(repo,'.work'),out=path.resolve(process.env.EVIDENCE_DIR);
fs.mkdirSync(out,{recursive:true});const temp=fs.mkdtempSync(path.join(work,'transfer-old-'));
const server=http.createServer((req,res)=>{if(req.url==='/favicon.ico'){res.writeHead(204).end();return}const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(temp,'.'+(rel==='/'?'/index.html':rel));if(path.relative(temp,file).startsWith('..')){res.writeHead(403).end();return}fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(data)})});
(async()=>{let summary={oldHead:old,oldTree:execFileSync('git',['rev-parse',old+'^{tree}'],{cwd:repo,encoding:'utf8'}).trim()};try{
 const files=execFileSync('git',['ls-tree','-r','--name-only',old,'apps/v11'],{cwd:repo,encoding:'utf8'}).trim().split('\n');
 for(const file of files)fs.writeFileSync(path.join(temp,path.basename(file)),execFileSync('git',['show',old+':'+file],{cwd:repo}));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const log=fs.openSync(path.join(out,'child.log'),'wx');const result=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(__dirname,'transfer-test.cjs')],{cwd:repo,env:{...process.env,EVIDENCE_DIR:out,MUSEUM_URL:`http://127.0.0.1:${server.address().port}/`},stdio:['ignore',log,log]});let timeout=false;const timer=setTimeout(()=>{timeout=true;child.kill('SIGTERM')},240000);child.on('error',reject);child.on('close',(code,signal)=>{clearTimeout(timer);resolve({code,signal,timeout})})});fs.closeSync(log);summary.child=result;
 assert.equal(result.code,1);assert.equal(result.signal,null);assert.equal(result.timeout,false);validateTransfer(JSON.parse(fs.readFileSync(path.join(out,'transfer.json'))),true);summary.expectedFailureDetected=true;console.log('PASS: old HEAD selection loss rejected with child exit 1 in all six conditions');
 }catch(e){summary.error=e.stack;process.exitCode=1;console.error(e)}finally{if(server.listening){server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}fs.rmSync(temp,{recursive:true,force:true});summary.exitCode=process.exitCode||0;fs.writeFileSync(path.join(out,'red-summary.json'),JSON.stringify(summary,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
