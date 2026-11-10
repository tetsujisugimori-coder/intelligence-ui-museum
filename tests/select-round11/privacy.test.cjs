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
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'round11-private-test-'));
 try{for(const kind of ['duplicate','symlink']){
  const file=path.join(tmp,kind+'.zip');execFileSync(process.env.PYTHON||'python',['-c',`import zipfile,sys,warnings\nwarnings.filterwarnings('ignore')\nwith zipfile.ZipFile(sys.argv[1],'w') as z:\n i=zipfile.ZipInfo('fixture.txt')\n if sys.argv[2]=='symlink': i.create_system=3; i.external_attr=0o120777<<16\n z.writestr(i,'synthetic')\n if sys.argv[2]=='duplicate': z.writestr('fixture.txt','synthetic')`,file,kind],{stdio:'pipe'});
  assert.throws(()=>zipEntries(file));
 }}finally{fs.rmSync(tmp,{recursive:true,force:true})}
});
// Synthetic one-pixel PNGs, not extracts from Windows-PC evidence.
// ICC construction follows public Skia ICC layout and fixed sRGB constants:
// https://github.com/google/skia/blob/main/src/encode/SkICC.cpp
// https://github.com/google/skia/blob/main/include/core/SkColorSpace.h
function syntheticSRGBProfile(){
 const u=(...ns)=>{const b=Buffer.alloc(ns.length*4);ns.forEach((n,i)=>b.writeUInt32BE(n,i*4));return b};
 const txt=s=>{const text=Buffer.from(s,'utf16le');text.swap16();return Buffer.concat([Buffer.from('mluc'),u(0,1,12),Buffer.from('enUS'),u(text.length,28),text,Buffer.alloc((-text.length)&3)])};
 const xyz=(...v)=>Buffer.concat([Buffer.from('XYZ '),u(0,...v)]);
 const trc=Buffer.concat([Buffer.from('para'),u(0,0x40000,...[2.4,1/1.055,.055/1.055,1/12.92,.04045,0,0].map(x=>Math.round(x*65536)))]);
 const tags=[['desc',txt('sRGB')],['rXYZ',xyz(0x6fa2,0x38f5,0x390)],['gXYZ',xyz(0x6299,0xb785,0x18da)],['bXYZ',xyz(0x24a0,0xf84,0xb6cf)],['wtpt',xyz(0xf6d6,0x10000,0xd32d)],['rTRC',trc],['gTRC',trc],['bTRC',trc],['cprt',txt('Google Inc. 2016')]];
 const h=Buffer.alloc(128);h.writeUInt32BE(456);h.writeUInt32BE(0x04300000,8);h.write('mntrRGB XYZ ',12);h.writeUInt16BE(2016,24);h.writeUInt16BE(1,26);h.writeUInt16BE(1,28);h.write('acsp',36);u(1,0xf6d6,0x10000,0xd32d).copy(h,64);
 let offset=240;const seen=new Map(),table=[],data=[];for(const [name,b]of tags){const k=b.toString('hex');if(!seen.has(k)){seen.set(k,offset);data.push(b);offset+=b.length}table.push(Buffer.from(name),u(seen.get(k),b.length))}
 return Buffer.concat([h,u(9),...table,...data]);
}
function pngChunk(name,payload){
 const b=Buffer.alloc(payload.length+12);b.writeUInt32BE(payload.length);b.write(name,4);payload.copy(b,8);
 let c=0xffffffff;for(const v of b.subarray(4,-4)){c^=v;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}b.writeUInt32BE((c^0xffffffff)>>>0,b.length-4);return b;
}
function syntheticPNG(extra=[]){
 const h=Buffer.alloc(13);h.writeUInt32BE(1,0);h.writeUInt32BE(1,4);h[8]=8;h[9]=6;
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),pngChunk('IHDR',h),...extra,pngChunk('IDAT',require('node:zlib').deflateSync(Buffer.from([0,255,255,255,255]))),pngChunk('IEND',Buffer.alloc(0))]);
}
test('same-byte public sRGB ICC synthesized independently; known encoder PNG accepted',()=>{
 const {inspectPNG}=require('./privacy-check.cjs'),z=require('node:zlib'),icc=syntheticSRGBProfile();
 assert.equal(icc.length,456);assert.equal(hash(icc),'12afb4d9953adee0607d347daee5b78b18d6b3cab2d572b88970703f5edb37bc');
 const payload=Buffer.concat([Buffer.from('Skia\0\0'),z.deflateSync(icc)]);
 const png=syntheticPNG([pngChunk('sBIT',Buffer.from([8,8,8,8])),pngChunk('iCCP',payload)]),before=hash(png);
 assert.doesNotThrow(()=>inspectPNG(png));assert.equal(hash(png),before,'inspection must not rewrite original bytes');
 const linux=syntheticPNG([pngChunk('sBIT',Buffer.from([8,8,8,8])),pngChunk('sRGB',Buffer.from([0]))]);assert.doesNotThrow(()=>inspectPNG(linux));
 for(const bad of [Buffer.concat([payload,Buffer.from('synthetic-private')]),Buffer.concat([Buffer.from('User\0\0'),z.deflateSync(icc)]),Buffer.concat([Buffer.from('Skia\0\0'),z.deflateSync(Buffer.concat([icc,Buffer.from('synthetic-private')]))])])assert.throws(()=>inspectPNG(syntheticPNG([pngChunk('iCCP',bad)])));
 const changed=Buffer.from(icc);changed[changed.length-1]^=1;assert.throws(()=>inspectPNG(syntheticPNG([pngChunk('iCCP',Buffer.concat([Buffer.from('Skia\0\0'),z.deflateSync(changed)]))])));
 assert.throws(()=>inspectPNG(syntheticPNG([pngChunk('iCCP',payload),pngChunk('iCCP',payload)])));
 assert.throws(()=>inspectPNG(syntheticPNG([pngChunk('iCCP',payload),pngChunk('sRGB',Buffer.from([0]))])));
});
test('allowed PNG ancillary names cannot carry oversized or malformed private metadata',()=>{
 const {inspectPNG}=require('./privacy-check.cjs');
 for(const name of ['sBIT','gAMA','cHRM','pHYs','sRGB'])assert.throws(()=>inspectPNG(syntheticPNG([pngChunk(name,Buffer.from('synthetic-private-data'))])),undefined,name);
 for(const [name,p]of [['sBIT',Buffer.from([8,8,8,9])],['sRGB',Buffer.from([4])],['gAMA',Buffer.alloc(4)],['cHRM',Buffer.alloc(32,255)],['pHYs',Buffer.alloc(9,255)]])assert.throws(()=>inspectPNG(syntheticPNG([pngChunk(name,p)])));
 for(const name of ['tEXt','zTXt','iTXt','eXIf'])assert.throws(()=>inspectPNG(syntheticPNG([pngChunk(name,Buffer.from('synthetic-private-data'))])));
 const p=syntheticPNG();assert.throws(()=>inspectPNG(Buffer.concat([p,pngChunk('sBIT',Buffer.from([8,8,8,8]))])));
 const duplicate=Buffer.concat([p.subarray(0,33),p.subarray(8)]);assert.throws(()=>inspectPNG(duplicate));
 const crc=Buffer.from(p);crc[crc.length-1]^=1;assert.throws(()=>inspectPNG(crc));
 assert.throws(()=>inspectPNG(Buffer.concat([p.subarray(0,-12),pngChunk('sBIT',Buffer.from([8,8,8,8])),p.subarray(-12)])));
});
