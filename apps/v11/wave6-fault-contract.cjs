'use strict';
// Fixed semantic fault input transformations, independently recomputed by auditor.
const cases=[
['one-way',"k?.startsWith('table-'))selected=toggle(selected,k.slice(6));","k?.startsWith('table-'))selected=selected;"],
['sort-id','data-row="${r.id}"','data-row="${sort===\'desc\'?\'r1\':r.id}"'],
['wrong-id',"k.slice(6));else if(id===139&&k==='sort')","'r4');else if(id===139&&k==='sort')"],
['linked-reset',"selected=[];sort='id';pending=draft();","selected=['r2'];sort='id';pending=draft();"],
['conflict-missing',"f.right===f.base?f.left:null","f.right===f.base?f.left:f.base"],
['unresolved-commit',"throw Error('未解決の競合')","return Object.fromEntries(fields.map(f=>[f.id,f.base]))"],
['wrong-side',"side?f[side]:null","side?f.base:null"],
['cancel-loss',"pending=clone(confirmed);editing=false","confirmed=Object.fromEntries(fields.map(f=>[f.id,f.base]));pending=clone(confirmed);editing=false"],
['wrong-claim',"relations.filter(r=>r.claim===id)","relations.filter(r=>r.claim==='c2')"],
['compare-mix','const s=sourceRecord(sid);','const s=sourceRecord(\'s1\');'],
['contradiction-loss',"claims.map(c=>`<li", "claims.filter(c=>c.id!=='c2').map(c=>`<li"],
['unregistered',"'未登録'","'対応登録1件'"],
['description','${instructions[id]}','undefined'],
['init',"h.dataset.initialized='true'","h.dataset.initialized='false'"],
['resource','NO_MUTATION','NO_MUTATION'],
['text2x','<span data-graph-label>','<span data-graph-label style="font-size:16px!important">'],
['focus','if(target&&!target.disabled)target.focus();',"if(target&&!target.disabled)$('[data-key=\"reset\"]').focus();"]];
function mutate(original,id){const c=cases.find(c=>c[0]===id);if(!c)throw Error('unknown case');if(id==='resource')return original;if(original.split(c[1]).length-1!==1)throw Error('mutation unique '+id);return original.replace(c[1],c[2]);}
module.exports={cases,mutate};
