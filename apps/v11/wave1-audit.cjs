'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const zlib=require('node:zlib');
const {sourceContract,measureContract}=require('./wave1-contract.cjs');
const fail=m=>{throw Error(m)};
const required=['query','permission','pivot','keyboard-focus','keyboard-main','overflow','runtime','screenshot'];
const matrix=()=>['chromium','webkit'].flatMap(engine=>[...[375,390,1280].flatMap(width=>['light','dark'].map(theme=>({engine,width,theme,zoom:1}))),{engine,width:375,theme:'dark',zoom:2}]);
const key=x=>`${x.engine}-${x.width}-${x.theme}-${x.zoom}`;
// PNG decoder/CRC validation reused from existing v11 result-contract.
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
 sourceContract(report,expected);
 if(expected.head)assert.equal(report.head,expected.head,'HEAD mismatch');if(expected.tree)assert.equal(report.tree,expected.tree,'tree mismatch');
 assert.equal(report.schema,1);assert.match(report.head,/^[a-f0-9]{40}$/);assert.match(report.tree,/^[a-f0-9]{40}$/);
 assert.equal(report.exitCode,0,'execution did not succeed');assert.equal(report.controls.length,10,'fault controls incomplete');for(const engine of ['chromium','webkit'])for(const fault of ['reset','undo','permission-display','pivot-display','query-display']){const c=report.controls.filter(x=>x.engine===engine&&x.fault===fault);assert.equal(c.length,1);assert.equal(c[0].detected,true);assert.equal(c[0].green,true);}assert.equal(report.results.length,14,'matrix incomplete');
 assert.deepEqual(report.results.map(key).sort(),matrix().map(key).sort(),'matrix mismatch');
 for(const r of report.results){assert.equal(r.status,'PASS',key(r));measureContract(r);assert.ok(r.version);assert.deepEqual(r.errors,[]);for(const c of required)assert.ok(r.checks.includes(c),`missing ${c}`);
 assert.ok(/^[a-z0-9-]+\.png$/.test(r.screenshot),'unsafe screenshot name');validatePng(path.join(dir,r.screenshot),r.width,1000);const b=fs.readFileSync(path.join(dir,r.screenshot));assert.ok(b.length>100);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(crypto.createHash('sha256').update(b).digest('hex'),r.sha256,'screenshot changed');}
 return {status:'PASS',conditions:14};
}
module.exports={audit,matrix,key,required};
if(require.main===module){try{const file=process.argv[2];assert.ok(file,'report path required');console.log(JSON.stringify(audit(JSON.parse(fs.readFileSync(file)),path.dirname(file),{head:process.argv[3],tree:process.argv[4],submittedHead:process.argv[5]})));}catch(e){console.error(e.message);process.exitCode=1;}}
