'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {localURL,scanText,inspectObject,inspectTrace,safeName,gate}=require('./privacy-check.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('strict loopback URLs and fixed public query values',()=>{
 for(const host of ['127.0.0.1','localhost','[::1]'])assert.ok(localURL(`http://${host}:3210/?theme=light&text=100`));
 for(const u of ['http://localhost.evil.test:3210/','http://127.0.0.1.evil.test:3210/','http://localhost@evil.test:3210/','http://x@localhost:3210/','http://127.1:3210/','http://2130706433:3210/','https://localhost:3210/','file:///private','http://localhost:3210/?token=synthetic','http://localhost:3210/?theme=light&theme=light','http://localhost:3210/#synthetic','http://localhost:3210/%2e%2e/private'])assert.throws(()=>localURL(u));
});
test('no secrets, authentication, bodies or persisted browser state',()=>{
 for(const key of ['privateKey','private_key','sessionToken','recoveryCode','token','api_key','api-key','apiKey','client_secret','clientSecret','access_token','refresh-token','password','authorization','storageState','httpCredentials','postData','sessionStorage','localStorage'])assert.throws(()=>inspectObject({[key]:'synthetic-negative-control'}),undefined,key);
 for(const name of ['Authorization','Cookie','Set-Cookie','X-Api-Key'])assert.throws(()=>inspectObject({headers:[{name,value:'synthetic-negative-control'}]}));
 assert.throws(()=>scanText('private@example.test'));
 assert.throws(()=>scanText('password="synthetic-negative-control"'));
 assert.doesNotThrow(()=>inspectObject({cookies:[],origins:[],text:'public Museum fixture'}));
});
test('unsafe names and local/physical runs fail closed',()=>{
 for(const n of ['../private','/private','C:/private','x\\private','a/../b','a//b'])assert.equal(safeName(n),false);
 assert.throws(()=>gate('/unused',{}),/ci-only/);
 assert.throws(()=>gate('/unused',{GITHUB_ACTIONS:'true',GITHUB_RUN_ID:'1',GITHUB_RUN_ATTEMPT:'1',RUNNER_ENVIRONMENT:'self-hosted'}),/ci-only/);
});
function fixture(){
 const source=Buffer.from('/* synthetic public runner */'),body=Buffer.from('<html>Public Museum fixture</html>');
 const network={type:'resource-snapshot',snapshot:{serverIPAddress:'127.0.0.1',request:{method:'GET',url:'http://127.0.0.1:3210/',headers:[],cookies:[],queryString:[],bodySize:0},response:{headers:[],cookies:[],content:{_sha1:'fixture.html'}}}};
 return {source,build:new Map([['index.html',hash(body)]]),network,entries:[['trace.trace',Buffer.from(JSON.stringify({type:'context-options',browserName:'webkit',origin:'library',options:{}})+'\n')],['trace.network',Buffer.from(JSON.stringify(network)+'\n')],['trace.stacks',Buffer.from(JSON.stringify({files:['<anonymous>'],stacks:[]}))],['resources/fixture.html',body],['resources/src@abc.txt',source]]};
}
test('positive trace and negative raw ZIP member controls',()=>{
 const f=fixture();assert.doesNotThrow(()=>inspectTrace(f.entries,f.build,f.source));
 for(const name of ['../private.txt','resources/unmanifested.txt','unknown.txt']){const g=fixture();g.entries.push([name,Buffer.from('synthetic')]);assert.throws(()=>inspectTrace(g.entries,g.build,g.source))}
 const g=fixture();g.entries[4][1]=Buffer.from('/* changed source */');assert.throws(()=>inspectTrace(g.entries,g.build,g.source),/source-attachment/);
 const h=fixture();h.entries[3][1]=Buffer.from('changed response');assert.throws(()=>inspectTrace(h.entries,h.build,h.source),/response-source/);
});
test('negative network controls without logging candidate values',()=>{
 for(const mutate of [n=>n.snapshot.request.url='http://external.example:3210/',n=>n.snapshot.request.headers.push({name:'X-Secret',value:'synthetic'}),n=>n.snapshot.request.cookies.push({name:'session',value:'synthetic'}),n=>n.snapshot.request.postData={text:'synthetic'},n=>n.snapshot.request.method='POST']){const f=fixture();mutate(f.network);f.entries[1][1]=Buffer.from(JSON.stringify(f.network)+'\n');assert.throws(()=>inspectTrace(f.entries,f.build,f.source))}
});
test('image metadata and appended data block release',()=>{
 const {inspectPNG,inspectJPEG}=require('./privacy-check.cjs');
 const chunk=(name,data)=>{const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(name,4);data.copy(b,8);return b};
 const png=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IEND',Buffer.alloc(0))]);
 assert.throws(()=>inspectPNG(Buffer.concat([png,Buffer.from('synthetic')])));
 assert.throws(()=>inspectPNG(Buffer.concat([png.subarray(0,8),chunk('tEXt',Buffer.from('synthetic')),png.subarray(8)])));
 assert.throws(()=>inspectJPEG(Buffer.from('ffd8fffe000b73796e746865746963ffd9','hex')));
});
test('ZIP loader rejects duplicate and symlink members',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process'),{zipEntries}=require('./privacy-check.cjs');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'round10-private-test-'));
 try{for(const kind of ['duplicate','symlink']){
  const file=path.join(tmp,kind+'.zip');execFileSync(process.env.PYTHON||'python',['-c',`import zipfile,sys,warnings\nwarnings.filterwarnings('ignore')\nwith zipfile.ZipFile(sys.argv[1],'w') as z:\n i=zipfile.ZipInfo('fixture.txt')\n if sys.argv[2]=='symlink': i.create_system=3; i.external_attr=0o120777<<16\n z.writestr(i,'synthetic')\n if sys.argv[2]=='duplicate': z.writestr('fixture.txt','synthetic')`,file,kind],{stdio:'pipe'});
  assert.throws(()=>zipEntries(file));
 }}finally{fs.rmSync(tmp,{recursive:true,force:true})}
});
