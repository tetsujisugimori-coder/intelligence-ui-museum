'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {CASES,ROUTES,validateRow,comparePair}=require('./classify.cjs');
const sourceDir=process.env.MINIMAL_SOURCE_DIR?path.resolve(process.env.MINIMAL_SOURCE_DIR):__dirname;
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
 assert.equal(row.id,[row.engine,row.route,row.iteration,row.case].join('-'),'row identity binding');
 assert.equal(row.engine,r.engine,'row engine');
 assert.ok(row.iteration<=r.repeats,'row iteration bound');
 assert.deepEqual(validateRow(row),[],'invalid row '+x.id);
 assert.equal(row.sourceSha256,r.source['fixture.js'],'row source mismatch');
 assert.equal(row.pngFile,row.id+'.png','PNG trial binding');
 const png=fs.readFileSync(path.join(dir,row.pngFile));
 assert.equal(sha(png),row.pngSha256);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG signature');
 assert.equal(png.toString('ascii',12,16),'IHDR');
 assert.equal(png.readUInt32BE(16),row.pngClip.width,'PNG width');
 assert.equal(png.readUInt32BE(20),row.pngClip.height,'PNG height');
 let offset=8,idat=[],ended=false;
 while(offset<png.length){
   assert.ok(offset+12<=png.length,'PNG chunk header');
   const size=png.readUInt32BE(offset),kind=png.toString('ascii',offset+4,offset+8);
   assert.ok(offset+size+12<=png.length,'PNG chunk bounds');
   if(kind==='IDAT')idat.push(png.subarray(offset+8,offset+8+size));
   if(kind==='IEND')ended=true;
   offset+=size+12;
 }
 assert.ok(ended&&idat.length,'PNG chunks missing');
 const raw=require('node:zlib').inflateSync(Buffer.concat(idat));
 const channels={2:3,6:4}[png[25]];
 assert.equal(png[24],8,'PNG bit depth');assert.ok(channels,'PNG color type');
 const stride=1+row.pngClip.width*channels;
 assert.equal(raw.length,stride*row.pngClip.height,'PNG decoded dimensions');
 for(let y=0;y<row.pngClip.height;y++)assert.ok(raw[y*stride]<=4,'PNG filter');
 return row;
});
assert.deepEqual(Object.keys(r.source).sort(),['classify.cjs','fixture.html','fixture.js','run.cjs'],'source inventory');
for(const [f,h]of Object.entries(r.source)){
 assert.equal(sha(fs.readFileSync(path.join(sourceDir,f))),h,'source mismatch '+f);
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
