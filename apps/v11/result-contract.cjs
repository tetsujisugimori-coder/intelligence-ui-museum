'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const engines=['chromium','webkit'],widths=[375,390,1280],themes=['dark','light'];
const browserChecks=['135 cards','theme','search category','118 invalid, format, keyboard, reset','119 select, transfer all, undo','120 keyboard move, focus, undo, drag','121 sample, selection, strength','122 alternative, registration, duplicate, clear, keyboard','123 add, announce, read, read all, delete','no document overflow or pageerror'];
const extraChecks=['old Primary, Select and Modal representative operations','invalid time range and empty transfer recovery','Tab and visible focus','reserved shortcut rejected via touch','reserved key not prevented, synthetic dispatch','reset all new demonstrations','synthetic text enlargement document overflow'];
const actualKeys=['Control','Meta'].flatMap(mod=>['A','C','V','X'].map(key=>`real ${mod}+${key} not suppressed`));
const regressionChecks=[...actualKeys,'Ctrl/Meta listed and Alt/combined modifiers not suppressed, synthetic events','Tab F5 and unmodified key not suppressed, synthetic events','modifier only, Escape, normal recording, duplicate, clear','focus transfer, native select, editable search, repeated key and modifier release','read, sequential first/middle/last/empty deletion, Tab, read all, add, reset focus'];
function fail(message){throw Error(message)}
function exactChecks(actual,expected){return Array.isArray(actual)&&actual.length===expected.length&&new Set(actual).size===expected.length&&expected.every(x=>actual.includes(x))}
function validateRecords(rows,kind,fault=false){
 const expected=kind==='browser'?engines.flatMap(e=>widths.flatMap(w=>themes.map(t=>`${e}|${w}|${t}`))):kind==='additional'?engines.flatMap(e=>[375,390].map(w=>`${e}|${w}`)):kind==='modal'?engines.flatMap(e=>[375,390].flatMap(w=>['reduce','no-preference'].map(m=>`${e}|${w}|${m}`))):engines;
 if(!Array.isArray(rows)||rows.length!==expected.length)fail(`${kind}: missing or extra records`);const seen=new Set();
 for(const r of rows){if(!r||typeof r!=='object')fail(`${kind}: invalid record`);const key=kind==='browser'?`${r.engine}|${r.width}|${r.theme}`:kind==='additional'?`${r.engine}|${r.width}`:kind==='modal'?`${r.engine}|${r.width}|${r.motion}`:r.engine;if(!expected.includes(key)||seen.has(key))fail(`${kind}: duplicate or unexpected condition`);seen.add(key);
 if(r.status!==(fault?'FAIL':'PASS')||r.skipped||r.skip)fail(`${kind}: non-passing or skipped condition`);
 if(kind==='nojs'){if(r.cards!==117||typeof r.count!=='string'||!r.count.includes('117 / 135'))fail('nojs: baseline missing');continue}
 if(!Array.isArray(r.errors)||(fault?(!r.errors.includes('v11 injected pageerror')||r.errors.some(e=>e!=='v11 injected pageerror')):r.errors.length!==0))fail(`${kind}: missing or unexpected pageerror evidence`);
 if((kind==='browser'||kind==='regression'||kind==='modal')&&(typeof r.version!=='string'||!r.version))fail(`${kind}: missing version`);
 if(kind==='modal'){if(!Array.isArray(r.trials)||r.trials.length!==3||r.trials.some(t=>{const k=t.trace?.find(x=>x.event==='keydown'),c=t.trace?.find(x=>x.event==='cancel');return !t.before?.open||t.before.display==='none'||t.before.visibility==='hidden'||typeof t.before.animation!=='string'||typeof t.before.animationDuration!=='string'||typeof t.before.transitionDuration!=='string'||![0,1].includes(t.immediateCount)||typeof t.immediateVisible!=='boolean'||t.afterCount!==0||t.focusRestored!==true||!Number.isFinite(k?.time)||!Number.isFinite(c?.time)||k.time>c.time}))fail('modal: incomplete state or event trace');continue}
 const checks=kind==='browser'?browserChecks:kind==='additional'?extraChecks:regressionChecks;const actual=Array.isArray(r.checks)?r.checks.map(x=>typeof x==='string'?x:x?.name):null;if(!exactChecks(actual,checks))fail(`${kind}: missing, duplicate or unexpected checks`);
 if(r.checks.some(x=>x&&typeof x==='object'&&(x.skip||x.skipped||x.pass===false||x.status==='SKIP')))fail(`${kind}: skipped or failed check`);
 if(kind==='additional'){const focus=r.checks.find(x=>x.name==='Tab and visible focus')?.focus;if(!focus||focus.visible!==true||!(parseFloat(focus.outline)>0))fail('additional: focus evidence missing')}
 if(kind==='regression')for(const name of actualKeys){const check=r.checks.find(x=>x.name===name),event=check?.event;const mod=name.includes('Control+')?'ctrl':'meta';const expectedKey=name.match(/\+([ACVX]) /)?.[1];if(!event||event.trusted!==true||event.prevented!==false||event[mod]!==true||event.key?.toUpperCase()!==expectedKey)fail('regression: real key evidence missing')}
 }
 return rows;
}
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
function validatePngs(dir){const names=engines.flatMap(e=>[...widths.flatMap(w=>themes.map(t=>[`${e}-${w}-${t}.png`,w])),...[375,390].map(w=>[`${e}-${w}-zoom.png`,w])]);for(const [name,width] of names){const file=path.join(dir,name);if(!fs.existsSync(file))fail(`missing screenshot: ${name}`);validatePng(file,width,900)}}
module.exports={validateRecords,validatePngs};
