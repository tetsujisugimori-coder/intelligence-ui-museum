'use strict';
const assert=require('node:assert/strict'),{validateTransfer}=require('./transfer-contract.cjs');
function validateTextMeasurements(r){
 assert.deepEqual(r.rootCss,{before:14,after:14,root:32});
 assert.deepEqual(r.fonts.map(x=>x.id),[118,119,120,121,122,123]);assert(r.fonts.every(x=>x.before===14&&x.after===28),'actual computed body text doubling required');
 assert.deepEqual(r.geometry.map(x=>x.id),[118,119,120,121,122,123]);for(const g of r.geometry){assert(g.width>0&&g.scrollWidth<=g.width+1&&g.documentScrollWidth<=g.documentWidth);assert.deepEqual(g.clipped,[])}
 assert.deepEqual(r.focus.map(x=>x.id),[118,119,120,121,122,123]);for(const f of r.focus){assert(f.active&&f.visible&&parseFloat(f.outline)>0);assert.deepEqual(f.clipped,[])}
}
function validateTextZoom(rows){validateTransfer(rows);for(const row of rows)validateTextMeasurements(row);return rows}
module.exports={validateTextZoom,validateTextMeasurements};
