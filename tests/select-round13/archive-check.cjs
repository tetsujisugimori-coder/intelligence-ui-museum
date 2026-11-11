'use strict';
// Preservation check, NOT a retrospective independent CSS observation. The
// trusted digest is GitHub's original final Windows WebKit artifact metadata.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {zipEntries}=require('../select-round11/privacy-check.cjs');
const original={head:'b349eb0add15b5886dfa7ae4bfc4b9c2e66124bb',run:42889345387,artifact:13797368396,sha256:'d88e272f5f145c6ad420e79024d73225cddc8777c696de5d6c71e78c834b25b4'};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function checkArchive(root,zip){
 const errors=[];
 if(hash(fs.readFileSync(zip))!==original.sha256)throw Error('original GitHub ZIP digest mismatch');
 const entries=zipEntries(zip),names=entries.map(([n])=>n).sort();
 if(JSON.stringify(fs.readdirSync(root).sort())!==JSON.stringify(names))errors.push('original archive inventory');
 for(const [n,b]of entries){if(path.basename(n)!==n)throw Error('archive entry path');if(!fs.existsSync(path.join(root,n))||hash(fs.readFileSync(path.join(root,n)))!==hash(b))errors.push('original archive bytes:'+n);}
 return {preservation:errors.length?'FAIL':'PASS',errors,original,pseudoAdjacentCoverage:'NOT_TESTED: schema 1 did not independently sample pseudo CSS; no values are backfilled',releaseAuthorized:false};
}
module.exports={checkArchive,original};
if(require.main===module){try{const r=checkArchive(process.argv[2],process.argv[3]);console.log(JSON.stringify(r,null,2));process.exitCode=r.preservation==='PASS'?0:1}catch(e){console.log(JSON.stringify({preservation:'FAIL',errors:[String(e)]}));process.exitCode=1}}
