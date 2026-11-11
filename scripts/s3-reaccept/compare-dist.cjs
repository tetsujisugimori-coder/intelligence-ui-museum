// Windows equivalent of diff -r: require identical file names and exact bytes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const [a,b]=process.argv.slice(2);
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.join(d,e.name)]);
const names=d=>files(d).map(f=>path.relative(d,f).split(path.sep).join('/')).sort();
const expected=names(a);assert.deepEqual(expected,names(b),'build file lists differ');
for(const f of expected)assert(fs.readFileSync(path.join(a,f)).equals(fs.readFileSync(path.join(b,f))),'build bytes differ: '+f);
console.log('PASS: two builds have identical files and bytes:',expected.length);
