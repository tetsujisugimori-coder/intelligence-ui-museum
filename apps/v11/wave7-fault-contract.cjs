'use strict';
// Synthetic product mutations; each has a paired, unmodified browser control.
const cases=[
['direction','e[0]===n.id).map(e=>e[1])','e[1]===n.id).map(e=>e[0])'],
['indirect','indirect=Object.keys(paths).filter(id=>!direct.includes(id)).sort()','indirect=[]'],
['count','count:Object.keys(paths).length','count:direct.length'],
['clear',"k==='clear')selected=null","k==='clear')selected='A'"],
['cycle',"cycles:cycles(graph)","cycles:[]"],
['scenario-invalid',"raw[k]=e.target.value;draw();","raw[k]=e.target.value==='NaN'?'4':e.target.value;draw();"],
['scenario-range',"raw[k]=e.target.value;draw();","raw[k]=e.target.value==='21'?'20':e.target.value;draw();"],
['scenario-zero',"raw[k]=e.target.value;draw();","raw[k]=k==='days'&&e.target.value==='0'?'1':e.target.value;draw();"],
['scenario-reset',"if(id===143)for(const key of Object.keys(raw))","if(id===143)raw.people='2';if(id===143)for(const key of Object.keys(raw))"],
['table-graph','data-value="${c[k].total}"','data-value="${c.a.total}"'],
['replay-missing',"s.events.map((e,i)=>","s.events.filter(e=>e.id!==2).map((e,i)=>"],
['replay-duplicate','data-event-id="${e.id}"','data-event-id="1"'],
['replay-order',"s.events.map((e,i)=>","s.events.slice().reverse().map((e,i)=>"],
['replay-branch',"h.events.slice(0,h.cursor).map(e=>({...e}))","h.events.map(e=>({...e}))"],
['replay-reset',"history=initialHistory();if(id===143)","history=history;if(id===143)"],
['replay-roundtrip',"h.events.slice(0,h.cursor).reduce","h.events.slice(0,h.cursor===h.events.length?h.cursor:0).reduce"],
['description','${descriptions[id]}','undefined'],
['init',"h.dataset.initialized='true'","h.dataset.initialized='false'"],
['resource','NO_MUTATION','NO_MUTATION'],
['text2x','<span data-bar-label>','<span data-bar-label style="font-size:16px!important">'],
['focus',"if(e&&!e.disabled)e.focus();","if(e&&!e.disabled)$('[data-key=\"reset\"]').focus();"]];
function mutate(original,id){const c=cases.find(c=>c[0]===id);if(!c)throw Error('unknown fault '+id);if(id==='resource')return original;if(original.split(c[1]).length-1!==1)throw Error('mutation not unique '+id);return original.replace(c[1],c[2]);}
function validatePageErrors(id,mode,errors){const a=require('node:assert/strict');a.ok(Array.isArray(errors));if(id==='resource'&&mode==='fault'){a.ok(errors.length<=1,'unexpected resource pageerror count');for(const e of errors)a.ok(["ReferenceError: wave7Init is not defined","ReferenceError: Can't find variable: wave7Init"].includes(e),'unexpected resource pageerror');}else a.deepEqual(errors,[],'unexpected pageerror');}
module.exports={cases,mutate,validatePageErrors};
