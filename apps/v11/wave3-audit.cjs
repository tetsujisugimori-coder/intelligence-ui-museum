'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),zlib=require('node:zlib');
const {sourceContract,measureContract,observationContract,mutationSource}=require('./wave3-contract.cjs');
const fail=m=>{throw Error(m)};
const required=['descriptions','grid','form','gantt','reset','keyboard','touch-emulation','overflow','runtime','screenshot'];
const faults=['grid-total','grid-invalid','form-visibility','gantt-position','gantt-duration','reset','focus','description'];
const matrix=()=>['chromium','webkit'].flatMap(engine=>[...[375,390,1280].flatMap(width=>['light','dark'].map(theme=>({engine,width,theme,zoom:1}))),{engine,width:375,theme:'dark',zoom:2}]);
const key=x=>`${x.engine}-${x.width}-${x.theme}-${x.zoom}`;
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);return c>>>0});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function validatePng(file,width,height){
 const data=fs.readFileSync(file),signature=Buffer.from([137,80,78,71,13,10,26,10]);if(data.length<8||!data.subarray(0,8).equals(signature))fail(`invalid PNG signature: ${path.basename(file)}`);
 let pos=8,header=false,ended=false,idat=[],channels=0;
 while(pos+12<=data.length){const len=data.readUInt32BE(pos),end=pos+12+len;if(end>data.length)fail('truncated PNG chunk');const type=data.toString('ascii',pos+4,pos+8),body=data.subarray(pos+8,pos+8+len),actual=data.readUInt32BE(pos+8+len);if(crc32(data.subarray(pos+4,pos+8+len))!==actual)fail('PNG CRC mismatch');if(!header&&type!=='IHDR')fail('PNG IHDR missing');
  if(type==='IHDR'){if(header||len!==13||body.readUInt32BE(0)!==width||body.readUInt32BE(4)!==height||body[8]!==8||![2,6].includes(body[9])||body[10]!==0||body[11]!==0||body[12]!==0)fail('PNG dimensions or encoding invalid');channels=body[9]===2?3:4;header=true}
  else if(type==='IDAT'){if(ended)fail('PNG data after end');idat.push(body)}
  else if(type==='IEND'){if(len!==0||!idat.length||end!==data.length)fail('PNG end invalid');ended=true;pos=end;break}
  pos=end;
 }
 if(!header||!ended||pos!==data.length)fail('PNG incomplete');const row=width*channels+1,expected=row*height;let pixels;try{pixels=zlib.inflateSync(Buffer.concat(idat),{maxOutputLength:expected})}catch{fail('PNG image data invalid')}if(pixels.length!==expected)fail('PNG image data length invalid');for(let y=0;y<height;y++)if(pixels[y*row]>4)fail('PNG row filter invalid');
}

const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function verifyTrace(dir,file,sha,expected,harFile,harSha){
 assert.equal(typeof harFile,'string','HAR missing');assert.match(harFile,/^[a-z0-9-]+-har\.zip$/);const har=path.join(dir,harFile);assert.equal(hash(fs.readFileSync(har)),harSha,'HAR hash mismatch');
 assert.equal(typeof file,'string');assert.match(file,/^[a-z0-9-]+\.zip$/);const trace=path.join(dir,file);assert.equal(hash(fs.readFileSync(trace)),sha,'trace hash mismatch');
 const script=`import sys,zipfile,json,hashlib,urllib.parse
z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None
expected=json.loads(sys.argv[2])
events=[json.loads(line) for n in z.namelist() if n.endswith('.trace') for line in z.read(n).decode().splitlines() if line.strip()]
assert {'context-options','before','after'} <= {e.get('type') for e in events}, 'trace events missing'
contexts=[e for e in events if e.get('type')=='context-options']; assert len(contexts)==1
c=contexts[0]; assert c.get('browserName')==expected['engine'], 'trace engine mismatch'
if 'width' in expected:
 assert c['options']['viewport']=={'width':expected['width'],'height':1000}, 'trace viewport mismatch'
 assert c['options'].get('hasTouch') is True, 'trace touch missing'
 assert c['options'].get('reducedMotion')==('reduce' if expected['zoom']==2 else 'no-preference'), 'trace motion mismatch'
goto_events=[e for e in events if e.get('type')=='before' and e.get('method')=='goto']
gotos=[e.get('params',{}).get('url','') for e in goto_events]
assert len(gotos)==1 and urllib.parse.urlsplit(gotos[0]).query==expected['query'], 'trace condition identity mismatch'
assert urllib.parse.urlsplit(gotos[0]).path==expected['prefix'], 'trace mode path mismatch'
network=[json.loads(line)['snapshot'] for n in z.namelist() if n.endswith('.network') for line in z.read(n).decode().splitlines() if line.strip()]
found={}
# Ordinary Playwright traces intentionally omit script bodies; HAR must supply ALL bytes.
for item in network:
 p=urllib.parse.urlsplit(item['request']['url']).path
 if not p.startswith(expected['prefix']): continue
 name=p[len(expected['prefix']):] or 'index.html'
 if name not in expected['hashes']: continue
 assert item['response']['status']==200
 content=item['response']['content']
 if name.endswith('.js') and '_sha1' not in content: continue
 assert '_sha1' in content, 'trace non-script body missing'
 body=z.read('resources/'+content['_sha1'])
 value=hashlib.sha256(body).hexdigest()
 assert name not in found or found[name]==value, 'inconsistent resource bytes'
 found[name]=value
assert {k:v for k,v in found.items() if not k.endswith('.js')}=={k:v for k,v in expected['hashes'].items() if not k.endswith('.js')}, 'trace non-script resource mismatch'
assert all(expected['hashes'][k]==v for k,v in found.items()), 'trace resource mismatch'
hz=zipfile.ZipFile(sys.argv[3]); assert hz.testzip() is None
logs=[n for n in hz.namelist() if n.endswith('.har')]; assert len(logs)==1, 'HAR log missing'
log=json.loads(hz.read(logs[0]))['log']; page=goto_events[0].get('pageId'); assert page, 'trace page identity missing'
assert len(log['pages'])==1 and log['pages'][0]['id']==page, 'HAR page identity mismatch'
entries=log['entries']; docs=[e for e in entries if e['request']['url']==gotos[0]]
assert len(docs)==1 and docs[0]['pageref']==page, 'HAR condition identity mismatch'
found={}
for item in entries:
 assert item.get('pageref')==page, 'HAR entry page mismatch'
 u=urllib.parse.urlsplit(item['request']['url']); p=u.path
 assert (u.scheme,u.netloc)==(urllib.parse.urlsplit(gotos[0]).scheme,urllib.parse.urlsplit(gotos[0]).netloc), 'HAR origin mismatch'
 if not p.startswith(expected['prefix']): continue
 name=p[len(expected['prefix']):] or 'index.html'
 if name not in expected['hashes']: continue
 assert item['request']['method']=='GET' and item['response']['status']==200, 'HAR response invalid'
 content=item['response']['content']; assert '_file' in content, 'HAR body missing'
 body=hz.read(content['_file']); value=hashlib.sha256(body).hexdigest()
 assert name not in found, 'HAR duplicate resource'
 found[name]=value
assert found==expected['hashes'], 'HAR served resource mismatch'
`;
 require('node:child_process').execFileSync(process.env.PYTHON||'python3',['-c',script,trace,JSON.stringify(expected),har]);
}

function audit(report,dir,expected={}){
 sourceContract(report,expected);assert.equal(report.schema,3);assert.equal(report.exitCode,0,'execution failure');
 assert.deepEqual(report.results.map(key),matrix().map(key),'planned matrix/order mismatch');
 assert.equal(report.controls.length,faults.length*2,'fault coverage');
 for(const engine of ['chromium','webkit'])for(const fault of faults){const entries=report.controls.filter(c=>c.engine===engine&&c.fault===fault);assert.equal(entries.length,1,'control identity');assert.equal(entries[0].detected,true,'fault escaped');assert.equal(entries[0].green,true,'normal control failed');assert.equal(entries[0].errorCode,'ERR_ASSERTION','timeout is not detection');
 const c=entries[0];for(const mode of ['normal','fault']){assert.deepEqual(c[mode+'Errors'],[],'control runtime errors');verifyTrace(dir,c[mode+'Trace'],c[mode+'TraceSha256'],{engine,query:'wave3-control='+engine+'-'+fault+'-'+mode,prefix:mode==='fault'?'/fault/'+fault+'/':'/',hashes:{...report.sourceHashes,'wave3.js':mode==='fault'?c.faultSourceHash:report.sourceHashes['wave3.js']}},c[mode+'Har'],c[mode+'HarSha256']);}
 assert.equal(c.originalSourceHash,report.sourceHashes['wave3.js'],'fault source mismatch');
 assert.match(c.mutationFile,/^fault-[a-z-]+\.js$/);const mutation=fs.readFileSync(path.join(dir,c.mutationFile));assert.equal(hash(mutation),c.mutationSha256,'mutation bytes mismatch');assert.equal(mutation.toString(),mutationSource(fault),'wrong injected defect');const original=require('node:child_process').execFileSync('git',['show',`${report.head}:apps/v11/wave3.js`]);assert.equal(hash(Buffer.concat([original,mutation])),c.faultSourceHash,'fault copy hash mismatch');}
 for(const r of report.results){assert.equal(r.status,'PASS',key(r));measureContract(r);observationContract(r);assert.deepEqual(r.servedHashes,report.sourceHashes,'served hash set mismatch');assert.ok(r.version);assert.deepEqual(r.errors,[]);assert.deepEqual(r.checks,required,'check coverage');
 for(const [file,h] of [[r.screenshot,r.sha256],[r.trace,r.traceSha256]]){assert.match(file,/^[a-z0-9-]+\.(png|zip)$/);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex'),h,'evidence hash mismatch');}
 validatePng(path.join(dir,r.screenshot),r.width,1000);verifyTrace(dir,r.trace,r.traceSha256,{engine:r.engine,width:r.width,zoom:r.zoom,query:'wave3-condition='+key(r),prefix:'/',hashes:report.sourceHashes},r.har,r.harSha256);
 assert.deepEqual(r.exhibitScreenshots.map(x=>x.id),[130,131,132],'exhibit screenshot coverage');
 for(const shot of r.exhibitScreenshots){assert.match(shot.file,/^[a-z0-9-]+\.png$/);assert.ok(Number.isInteger(shot.width)&&shot.width>0&&shot.width<=r.width,'exhibit width');assert.ok(Number.isInteger(shot.height)&&shot.height>0,'exhibit height');assert.equal(hash(fs.readFileSync(path.join(dir,shot.file))),shot.sha256,'exhibit screenshot hash');validatePng(path.join(dir,shot.file),shot.width,shot.height);}

 }
 return {status:'PASS',conditions:14,controls:faults.length*2};
}
module.exports={audit,matrix,key,required,faults,validatePng};
if(require.main===module){try{const file=process.argv[2];console.log(JSON.stringify(audit(JSON.parse(fs.readFileSync(file)),path.dirname(file),{head:process.argv[3],tree:process.argv[4],submittedHead:process.argv[5]})));}catch(e){console.error(e.message);process.exitCode=1;}}
