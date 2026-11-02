"use strict";
const assert=require('node:assert/strict'),{checkNames}=require('./transfer-scenarios.cjs');
function validateTransfer(rows,red=false){
 assert.equal(rows.length,6,'six engine/width conditions required');const keys=new Set();
 for(const r of rows){const key=`${r.engine}|${r.width}`;assert(['chromium','webkit'].includes(r.engine)&&[375,390,1280].includes(r.width)&&!keys.has(key),'unexpected/duplicate condition');keys.add(key);assert(r.version);assert.equal(r.status,red?'FAIL':'PASS');assert(!r.skip&&!r.skipped&&!r.error);assert.deepEqual(r.errors,[]);assert.deepEqual(r.consoleErrors,[]);assert.deepEqual(r.checks.map(x=>x.name),checkNames);
 for(const c of r.checks){assert.equal(c.pass,red?!['A','B','C','E'].includes(c.name[0]):true,c.name);if(c.pass)assert(!c.error);else assert.match(c.error,/AssertionError/)}
 const before=r.observations.find(x=>x.label==='A before'),after=r.observations.find(x=>x.label==='A after'),checked=s=>s.items.find(x=>x.name==='設計'&&x.side==='right').checked;
 assert.equal(checked(before),true);assert.equal(checked(after),!red);assert.equal(after.items.find(x=>x.name==='実装'&&x.side==='right').checked,false);
 if(!red){assert(after.items.every(x=>x.id));const focus=r.observations.find(x=>x.label==='E keyboard after transfer').focus;assert.equal(focus.move,'right');assert.equal(focus.visible,true);assert(parseFloat(focus.outline)>0)}
 }return rows;
}
module.exports={validateTransfer};
