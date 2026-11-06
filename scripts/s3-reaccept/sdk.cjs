// Compare registry tarball integrity and every installed SDK file in both fresh installs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const [a,b,out]=process.argv.slice(2),sdk='node_modules/@openai/apps-sdk-ui';
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.join(d,e.name)]);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const lock=JSON.parse(fs.readFileSync(path.join(a,'package-lock.json'))),entry=lock.packages[sdk];
if(entry.version!=='0.2.2'||JSON.parse(fs.readFileSync(path.join(a,'package.json'))).dependencies['@openai/apps-sdk-ui']!=='0.2.2')throw Error('SDK version not fixed');
const tar=execFileSync('curl',['--fail','--silent','--show-error',entry.resolved],{maxBuffer:64e6});
const integrity='sha512-'+crypto.createHash('sha512').update(tar).digest('base64');if(integrity!==entry.integrity)throw Error('SDK tarball integrity mismatch');
const temp=path.join(out,'sdk-registry');fs.mkdirSync(temp);execFileSync('tar',['xz','-C',temp],{input:tar});
const expected=files(path.join(temp,'package')).map(f=>path.relative(path.join(temp,'package'),f)).sort();
for(const root of [a,b]){const actual=files(path.join(root,sdk)).map(f=>path.relative(path.join(root,sdk),f)).sort();if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('SDK file list mismatch');for(const f of expected)if(!fs.readFileSync(path.join(temp,'package',f)).equals(fs.readFileSync(path.join(root,sdk,f))))throw Error('SDK content mismatch: '+f);}
fs.writeFileSync(path.join(out,'sdk.json'),JSON.stringify({status:'PASS',version:entry.version,resolved:entry.resolved,integrity,files:Object.fromEntries(expected.map(f=>[f,sha(fs.readFileSync(path.join(temp,'package',f)))]))},null,2));fs.rmSync(temp,{recursive:true});console.log('SDK fresh tarball and both installs identical:',expected.length);
