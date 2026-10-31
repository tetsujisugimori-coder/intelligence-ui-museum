'use strict';
const fs=require('node:fs'),path=require('node:path');
const engines=['chromium','webkit'],widths=[375,390,1280],themes=['dark','light'];
const browserChecks=['123 cards','theme','search category','118 invalid, format, keyboard, reset','119 select, transfer all, undo','120 keyboard move, focus, undo, drag','121 sample, selection, strength','122 alternative, registration, duplicate, clear, keyboard','123 add, announce, read, read all, delete','no document overflow or pageerror'];
const extraChecks=['old Primary, Select and Modal representative operations','invalid time range and empty transfer recovery','Tab and visible focus','reserved shortcut rejected via touch','reserved key not prevented, synthetic dispatch','reset all new demonstrations','synthetic text enlargement document overflow'];
const actualKeys=['Control','Meta'].flatMap(mod=>['A','C','V','X'].map(key=>`real ${mod}+${key} not suppressed`));
const regressionChecks=[...actualKeys,'Ctrl/Meta listed and Alt/combined modifiers not suppressed, synthetic events','Tab F5 and unmodified key not suppressed, synthetic events','modifier only, Escape, normal recording, duplicate, clear','read, sequential first/middle/last/empty deletion, Tab, read all, add, reset focus'];
function fail(message){throw Error(message)}
function exactChecks(actual,expected){return Array.isArray(actual)&&actual.length===expected.length&&new Set(actual).size===expected.length&&expected.every(x=>actual.includes(x))}
function validateRecords(rows,kind,fault=false){
 const expected=kind==='browser'?engines.flatMap(e=>widths.flatMap(w=>themes.map(t=>`${e}|${w}|${t}`))):kind==='additional'?engines.flatMap(e=>[375,390].map(w=>`${e}|${w}`)):engines;
 if(!Array.isArray(rows)||rows.length!==expected.length)fail(`${kind}: missing or extra records`);const seen=new Set();
 for(const r of rows){if(!r||typeof r!=='object')fail(`${kind}: invalid record`);const key=kind==='browser'?`${r.engine}|${r.width}|${r.theme}`:kind==='additional'?`${r.engine}|${r.width}`:r.engine;if(!expected.includes(key)||seen.has(key))fail(`${kind}: duplicate or unexpected condition`);seen.add(key);
 if(r.status!==(fault?'FAIL':'PASS')||r.skipped||r.skip)fail(`${kind}: non-passing or skipped condition`);
 if(kind==='nojs'){if(r.cards!==117||typeof r.count!=='string'||!r.count.includes('117 / 123'))fail('nojs: baseline missing');continue}
 if(!Array.isArray(r.errors)||(fault?(!r.errors.includes('v11 injected pageerror')||r.errors.some(e=>e!=='v11 injected pageerror')):r.errors.length!==0))fail(`${kind}: missing or unexpected pageerror evidence`);
 if((kind==='browser'||kind==='regression')&&(typeof r.version!=='string'||!r.version))fail(`${kind}: missing version`);
 const checks=kind==='browser'?browserChecks:kind==='additional'?extraChecks:regressionChecks;const actual=Array.isArray(r.checks)?r.checks.map(x=>typeof x==='string'?x:x?.name):null;if(!exactChecks(actual,checks))fail(`${kind}: missing, duplicate or unexpected checks`);
 if(r.checks.some(x=>x&&typeof x==='object'&&(x.skip||x.skipped||x.pass===false||x.status==='SKIP')))fail(`${kind}: skipped or failed check`);
 if(kind==='additional'){const focus=r.checks.find(x=>x.name==='Tab and visible focus')?.focus;if(!focus||focus.visible!==true||!(parseFloat(focus.outline)>0))fail('additional: focus evidence missing')}
 if(kind==='regression')for(const name of actualKeys){const check=r.checks.find(x=>x.name===name),event=check?.event;const mod=name.includes('Control+')?'ctrl':'meta';const expectedKey=name.match(/\+([ACVX]) /)?.[1];if(!event||event.trusted!==true||event.prevented!==false||event[mod]!==true||event.key?.toUpperCase()!==expectedKey)fail('regression: real key evidence missing')}
 }
 return rows;
}
function validatePngs(dir){const names=engines.flatMap(e=>[...widths.flatMap(w=>themes.map(t=>`${e}-${w}-${t}.png`)),...[375,390].map(w=>`${e}-${w}-zoom.png`)]);const signature=Buffer.from([137,80,78,71,13,10,26,10]);for(const name of names){const file=path.join(dir,name);if(!fs.existsSync(file)||fs.statSync(file).size<=8)fail(`missing screenshot: ${name}`);const fd=fs.openSync(file,'r'),bytes=Buffer.alloc(8);try{fs.readSync(fd,bytes,0,8,0)}finally{fs.closeSync(fd)}if(!bytes.equals(signature))fail(`invalid PNG: ${name}`)}}
module.exports={validateRecords,validatePngs};
