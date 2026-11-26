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
// Wave10 integration uses the unchanged gallery but adds three registered exhibits.
// Inspect the literal closure/count in legacy runners without launching browsers.
function wave10Integration(file,before){const source=before?git('show','c26af501e70d78ea1817ed9fbe46a985db0a7890:apps/v11/'+file).toString():fs.readFileSync(path.join(__dirname,file),'utf8');const count=source.match(/locator\('#gallery article'\)\.count\(\),(\d+)/);assert.ok(count,file+' registry assertion');assert.equal(Number(count[1]),171,file+' current registered count');const lengths=[...source.matchAll(/Array\.from\(\{length:(\d+)\},\(_,i\)=>\[`wave\$\{i\+1\}\.js`,`wave\$\{i\+1\}\.css`\]\)/g)];for(const length of lengths){const additions=[...source.matchAll(/['"](wave14-[a-z]+\.js|wave14\.css|wave1[56]\.(?:js|css))['"]/g)].map(m=>m[1]);const actual=['index.html','exhibits.js','exhibits.css',...Array.from({length:Number(length[1])},(_,i)=>[`wave${i+1}.js`,`wave${i+1}.css`]).flat(),...additions].sort();const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),expected=['index.html',...[...html.matchAll(/(?:src|href)="([^"/]+\.(?:js|css))"/g)].map(x=>x[1])].sort();assert.deepEqual(actual,expected,file+' served source closure');for(const missing of ['wave10.js','wave10.css','wave14-mapping.js','wave14-join.js','wave14-scope.js','wave14.css','wave15.js','wave15.css','wave16.js','wave16.css'])assert.notDeepEqual(actual.filter(x=>x!==missing),expected,file+' missing resource refusal');}}
for(let wave=1;wave<=9;wave++)test('wave10 legacy runner '+wave+' count/closure integration',()=>wave10Integration(`wave${wave}-browser.cjs`,false));
test('wave10 same fixed regression: old runner7 rejects new registry; current accepts',()=>{assert.throws(()=>wave10Integration('wave7-browser.cjs',true),{code:'ERR_ASSERTION'});wave10Integration('wave7-browser.cjs',false);});
test('wave10 no-JS literal registry update retains static117 and rejects wrong totals',()=>{const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),count=html.match(/id="count"[^>]*>([^<]+)/)[1],source=fs.readFileSync(path.join(__dirname,'nojs-test.cjs'),'utf8');const expression=source.match(/assert\.match\(r\.count,\/(.*?)\/\)/)[1],pattern=new RegExp(expression);assert.match(source,/assert\.equal\(r\.cards,117\)/,'static117 baseline unchanged');assert.match(count,pattern,'current static count label');assert.doesNotMatch('117 / 150',pattern,'stale total is rejected');assert.doesNotMatch('116 / 171',pattern,'wrong static count rejected');const oldSource=git('show','c26af501e70d78ea1817ed9fbe46a985db0a7890:apps/v11/nojs-test.cjs').toString(),oldPattern=new RegExp(oldSource.match(/assert\.match\(r\.count,\/(.*?)\/\)/)[1]);assert.throws(()=>assert.match(count,oldPattern),{code:'ERR_ASSERTION'});});
