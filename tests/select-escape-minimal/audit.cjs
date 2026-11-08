'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {CASES,ROUTES,validateRow,comparePair}=require('./classify.cjs');
const dir=path.resolve(process.argv[2]||'.work/escape-minimal'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'SHA256SUMS.json')));
const actual=fs.readdirSync(dir).filter(f=>f!=='SHA256SUMS.json').sort();
assert.deepEqual(Object.keys(manifest).sort(),actual,'manifest inventory');
for(const [name,h]of Object.entries(manifest)){
 assert.equal(name,path.basename(name),'unsafe file');
 assert.equal(sha(fs.readFileSync(path.join(dir,name))),h,'digest mismatch '+name);
}
const r=JSON.parse(fs.readFileSync(path.join(dir,'results.json')));
assert.equal(r.scope,'MODEL_ONLY_NOT_SDK_CAUSAL');
assert.equal(r.engine,process.env.MINIMAL_ENGINE||'chromium');
assert.equal(r.repeats,Number(process.env.MINIMAL_REPEATS||2));
assert.equal(r.expected,r.repeats*CASES.length*ROUTES.length);
assert.deepEqual(r.failures,[]);
const expected=ROUTES.flatMap(route=>Array.from({length:r.repeats},(_,j)=>CASES.map(c=>r.engine+'-'+route+'-'+(j+1)+'-'+c)).flat());
assert.deepEqual(r.rows.map(x=>x.id),expected,'externally derived plan');
const rows=r.rows.map(x=>{
 assert.equal(x.file,x.id+'.json');
 const row=JSON.parse(fs.readFileSync(path.join(dir,x.file)));
 assert.equal(row.id,x.id);
 assert.deepEqual(validateRow(row),[],'invalid row '+x.id);
 assert.equal(sha(fs.readFileSync(path.join(dir,row.pngFile))),row.pngSha256);
 return row;
});
for(const [f,h]of Object.entries(r.source)){
 assert.equal(sha(fs.readFileSync(path.join(__dirname,f))),h,'source mismatch '+f);
}
for(const route of ROUTES)for(let i=1;i<=r.repeats;i++){
 const a=rows.find(x=>x.route===route&&x.iteration===i&&x.case==='controlled-cancel'),
   b=rows.find(x=>x.route===route&&x.iteration===i&&x.case==='controlled-plain');
 const derived=comparePair(a,b),claimed=r.pairs.find(x=>x.route===route&&x.iteration===i);
 assert.deepEqual(claimed,{route,iteration:i,...derived},'false comparison report');
 assert.equal(derived.classification,'MODEL_COMPARABLE','model controlled pair not comparable');
}
assert.equal(r.pairs.length,ROUTES.length*r.repeats);
console.log('MODEL_ONLY audit PASS: '+rows.length+' rows, '+r.pairs.length+' controlled contrasts; no SDK causal claim');
