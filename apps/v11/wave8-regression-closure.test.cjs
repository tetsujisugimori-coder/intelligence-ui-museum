'use strict';
// Browser-free contract replay. This does not claim a new browser execution.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm');
const repo=path.resolve(__dirname,'../..'),old='f81e4df16c7716480cbd4b452ecc638434805ed1';
const git=(...args)=>cp.execFileSync('git',args,{cwd:repo});
const code=(name,before)=>before?git('show',`${old}:apps/v11/${name}`).toString():fs.readFileSync(path.join(__dirname,name),'utf8');
function required(before,head){const s=code('kanban-audit-contract.cjs',before),expr=s.match(/const required = (.*);/)[1];return Array.from(vm.runInNewContext(expr,{sourceFiles:['exhibits.css','exhibits.js','index.html'],git,run:{source:{head}}}));}
test('same fixed source: old source-set contract rejects actual wave8 closure; new accepts and old-head closure stays unchanged',()=>{
 const expected=['exhibits.css','exhibits.js','index.html',...Array.from({length:8},(_,i)=>[`wave${i+1}.css`,`wave${i+1}.js`]).flat()].sort();
 assert.throws(()=>assert.deepEqual(required(true,old),expected),{code:'ERR_ASSERTION'});
 assert.deepEqual(required(false,old),expected);
 const historical='3b90ddbb77787b759c014a24d99f05ca98dda89f';assert.deepEqual(required(false,historical),required(true,historical));
 for(const missing of ['wave8.js','wave8.css'])assert.notDeepEqual(expected.filter(x=>x!==missing),required(false,old));
});
test('archived wave8 static count: old total rejects, fixed wave8 version accepts; current static117 cards retained',()=>{
 const html=git('show',`${old}:apps/v11/index.html`).toString(),count=html.match(/id="count"[^>]*>([^<]+)/)[1];
 const pattern=before=>new RegExp((before?code('nojs-test.cjs',true):git('show','787a057b6d4f22324746e1b2cada23a97dc6b226:apps/v11/nojs-test.cjs').toString()).match(/assert\.match\(r\.count,\/(.*?)\/\)/)[1]);
 assert.throws(()=>assert.match(count,pattern(true)),{code:'ERR_ASSERTION'});assert.match(count,pattern(false));
 assert.match(code('nojs-test.cjs',false),/assert\.equal\(r\.cards,117\)/);assert.doesNotMatch('117 / 144',pattern(false));
});
