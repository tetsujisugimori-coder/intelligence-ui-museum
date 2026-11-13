'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),zlib=require('node:zlib');
const {sourceContract,measureContract}=require('./wave2-contract.cjs');
const fail=m=>{throw Error(m)};
const required=['tree','rule','graph','reset','keyboard','touch-emulation','overflow','runtime','screenshot'];
const faults=['tree-parent','tree-total','tree-expanded','rule-result','rule-priority','rule-conflict','graph-cycle','graph-order','graph-impact','reset','focus'];
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

function audit(report,dir,expected={}){
 sourceContract(report,expected);assert.equal(report.schema,2);assert.equal(report.exitCode,0,'execution failure');
 assert.deepEqual(report.results.map(key),matrix().map(key),'planned matrix/order mismatch');
 assert.equal(report.controls.length,faults.length*2,'fault coverage');
 for(const engine of ['chromium','webkit'])for(const fault of faults){const entries=report.controls.filter(c=>c.engine===engine&&c.fault===fault);assert.equal(entries.length,1,'control identity');assert.equal(entries[0].detected,true,'fault escaped');assert.equal(entries[0].green,true,'normal control failed');assert.equal(entries[0].errorCode,'ERR_ASSERTION','timeout is not detection');}
 for(const r of report.results){assert.equal(r.status,'PASS',key(r));measureContract(r);assert.ok(r.version);assert.deepEqual(r.errors,[]);assert.deepEqual(r.checks,required,'check coverage');
 for(const [file,h] of [[r.screenshot,r.sha256],[r.trace,r.traceSha256]]){assert.match(file,/^[a-z0-9-]+\.(png|zip)$/);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex'),h,'evidence hash mismatch');}
 validatePng(path.join(dir,r.screenshot),r.width,1000);require('node:child_process').execFileSync(process.env.PYTHON||'python3',['-c',"import sys,zipfile,json; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; names=[n for n in z.namelist() if n.endswith('.trace')]; assert names, 'trace records missing'; events=[json.loads(line) for n in names for line in z.read(n).decode('utf8').splitlines() if line.strip()]; kinds={e.get('type') for e in events}; assert {'context-options','before','after'} <= kinds, 'trace event sequence missing'",path.join(dir,r.trace)]);
 }
 return {status:'PASS',conditions:14,controls:22};
}
module.exports={audit,matrix,key,required,faults};
if(require.main===module){try{const file=process.argv[2];console.log(JSON.stringify(audit(JSON.parse(fs.readFileSync(file)),path.dirname(file),{head:process.argv[3],tree:process.argv[4],submittedHead:process.argv[5]})));}catch(e){console.error(e.message);process.exitCode=1;}}
