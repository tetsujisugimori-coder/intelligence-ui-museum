const fs=require('node:fs'),path=require('node:path');
const {failures}=require(process.env.STAGE2R_RESULT||path.resolve('apps/v10/scripts/stage2r-result.cjs'));
const fixture=JSON.parse(fs.readFileSync('evidence/issue-4-independent-20261101/independent/real-normal.json','utf8'));
let a=structuredClone(fixture);a.conditions.find(x=>x.noJS).status='SKIP';let b=structuredClone(fixture);b.conditions.find(x=>x.noJS).skipped=true;let c=structuredClone(fixture);c.conditions[0].status='SKIP';let d=structuredClone(fixture);d.conditions.pop();let e=structuredClone(fixture);delete e.finished;
const records=[['normal',fixture],['noJS-status-skip',a],['noJS-skipped-flag',b],['ordinary-status-skip',c],['missing-condition',d],['unfinished',e]].map(([name,r])=>({name,failures:failures(r,'smoke')}));console.log(JSON.stringify(records,null,2));if(records[0].failures.length||records.slice(1).some(x=>!x.failures.length))process.exitCode=1;
