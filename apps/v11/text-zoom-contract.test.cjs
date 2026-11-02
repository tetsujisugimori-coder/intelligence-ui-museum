'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{validateTextMeasurements}=require('./text-zoom-contract.cjs');
const ids=[118,119,120,121,122,123];
function fixture(){return {rootCss:{before:14,after:14,root:32},fonts:ids.map(id=>({id,before:14,after:28})),geometry:ids.map(id=>({id,width:300,scrollWidth:300,documentWidth:375,documentScrollWidth:375,clipped:[]})),focus:ids.map(id=>({id,active:true,visible:true,outline:'3px',clipped:[]}))}}
test('accept measured text doubling with all six cards and visible focus',()=>validateTextMeasurements(fixture()));
test('reject root-only enlargement mislabeled as actual text doubling',()=>{const r=fixture();r.fonts.forEach(x=>x.after=14);assert.throws(()=>validateTextMeasurements(r))});
test('reject absent, clipped, overflowing or unfocused text evidence',()=>{for(const mutate of [r=>r.fonts.pop(),r=>r.geometry[0].clipped.push('text range'),r=>r.geometry[0].scrollWidth=400,r=>r.focus[0].visible=false,r=>r.focus[0].clipped.push('fieldset')]){const r=fixture();mutate(r);assert.throws(()=>validateTextMeasurements(r))}});
