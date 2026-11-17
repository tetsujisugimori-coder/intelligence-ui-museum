'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync,execFileSync}=require('node:child_process');
const phases=['runner','auditor','privacy','contracts','final-privacy'];
const allowed=exits=>phases.every(p=>exits[p]===0);
function run(){
 const base='.work/round14',status=base+'-status';fs.mkdirSync(status,{recursive:true});
 for(const stage of ['pilot','formal'])for(const p of phases)fs.writeFileSync(path.join(status,stage+'-'+p+'-exit.txt'),'NOT_RUN\n');
 let success=true;
 for(const phase of ['pilot','formal']){
  if(!success)break;
  const root=base+'-'+phase,env={...process.env,ROUND14_PHASE:phase,ROUND14_OUT:root,ROUND14_EXPECT_HEAD:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),ROUND14_EXPECT_PLATFORM:process.platform,ROUND14_EVIDENCE:root},exits={};
  const cmds={runner:['tests/select-round14/run.cjs'],auditor:['tests/select-round14/audit.cjs',root],privacy:['tests/select-round14/privacy-check.cjs',root],contracts:['--test','tests/select-round14/evidence.test.cjs'],'final-privacy':['tests/select-round14/privacy-check.cjs',root]};
  for(const p of phases){
   const log=fs.openSync(base+'-'+phase+'-'+p+'.log','wx');const result=spawnSync(process.execPath,cmds[p],{env,stdio:['ignore',log,log]});fs.closeSync(log);
   exits[p]=result.status===null?'ABNORMAL':result.status;fs.writeFileSync(path.join(status,phase+'-'+p+'-exit.txt'),String(exits[p])+'\n');
   if(p==='runner')env.ROUND14_RUNNER_EXIT=String(exits[p]);
   // Only fixed statuses, no raw error text or unknown output enters public logs.
   console.log(JSON.stringify({phase,step:p,exit:exits[p]}));
  }
  success=allowed(exits);
 }
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,'raw_upload='+String(success)+'\n');
 return success?0:1;
}
module.exports={allowed,phases};if(require.main===module)process.exitCode=run();
