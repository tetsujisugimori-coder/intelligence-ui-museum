import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const pkg=JSON.parse(fs.readFileSync('node_modules/@openai/apps-sdk-ui/package.json'));
const manifest=JSON.parse(fs.readFileSync('evidence/baseline-manifest.json'));
const source=fs.readFileSync('src/main.tsx','utf8');const results=[];
for(const n of ['Button','Badge','Select','Switch','Tooltip','Alert']){assert(source.includes(`import { ${n} } from '@openai/apps-sdk-ui/components/${n}';`));const entry=`node_modules/@openai/apps-sdk-ui/dist/es/components/${n}/index.js`;assert(fs.existsSync(entry));assert(fs.readFileSync(entry,'utf8').includes(n));results.push({component:n,entry,sha256:hash(fs.readFileSync(entry)),import:true});}
assert.equal(pkg.version,'0.2.2');assert.equal(pkg.license,'MIT');assert.equal(hash(fs.readFileSync('public/v09-original.html')),manifest.sha256);
const extract=s=>JSON.parse(s.match(/<script[^>]*id="dataset"[^>]*>([\s\S]*?)<\/script>/)[1]);
const a=extract(fs.readFileSync('public/v09-original.html','utf8'));assert.deepEqual(a.map(x=>x.id),Array.from({length:117},(_,i)=>i+1));assert.equal(new Set(a.map(x=>x.name)).size,117);assert.equal(new Set(a.map(x=>x.category)).size,11);assert.deepEqual(extract(fs.readFileSync('public/v09-viewer.html','utf8')),a);
assert(fs.existsSync('public/THIRD_PARTY_NOTICES.txt'));assert(source.includes('sandbox="allow-scripts"'));
const map=fs.readdirSync('dist/assets').find(n=>n.endsWith('.js.map'));const sm=JSON.parse(fs.readFileSync('dist/assets/'+map));for(const n of ['Button','Badge','Select','Switch','Tooltip','Alert'])assert(sm.sources.some(s=>s.includes(`/components/${n}/`)));
const report={status:'PASS',scope:'imports, exports, built sourcemap, baseline byte hash, dataset identity, sandbox, notice existence',checks:results,baseline:manifest.sha256};fs.writeFileSync('evidence/authenticity-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
