// Evaluate trusted fixed Git modules only, with a minimal render sink.
// Not a browser/E2E run. Assertions express the independently inspected source contract.
const assert=require('node:assert/strict');
const path=require('node:path');
const app=path.resolve(process.argv[2]);
const open=(file,id,init)=>{
 const module=require(path.join(app,file));
 const elements=new Map(),listeners={};
 const host={dataset:{},matches:()=>true,querySelector(sel){
  if(!elements.has(sel))elements.set(sel,{innerHTML:'',textContent:'',value:'',focus(){},insertAdjacentHTML(_position,text){this.innerHTML+=text}});
  return elements.get(sel);
 },addEventListener(kind,action){listeners[kind]=action},contains(){return false;}};
 host.dataset[file.slice(0,-3)]=String(id);
 module[init](host);
 return {node:sel=>host.querySelector(sel),listeners};
};
const ids=(raw,attr)=>Array.from(raw.matchAll(new RegExp(attr+'="([^"]+)"','g')),m=>m[1]);
const assertSameKeys=(a,b)=>{
 assert.deepEqual([...a].sort(),[...b].sort());
 assert.equal(new Set(a).size,a.length);
};
{
 const {node,listeners}=open('wave3.js',132,'wave3Init');
 const ctrl='[data-w3-controls]',results='[data-w3-results]';
 assert.match(node(ctrl).innerHTML,/<table>/);
 assertSameKeys(ids(node(ctrl).innerHTML,'data-gantt-row'),['t1','t2','t3','t4','t5']);
 assertSameKeys(ids(node(ctrl).innerHTML,'data-gantt-row'),ids(node(results).innerHTML,'data-w3-bar'));
 const bars=()=>node(results).innerHTML;
 const end=()=>node('[data-gantt-end="t1"]').textContent;
 const before=bars(), endBefore=end();
 listeners.input({target:{dataset:{key:'gantt-t1-duration'},value:'5'}});
 assert.equal(bars(),before,'draft must not change bars or committed snapshot');
 assert.equal(end(),endBefore,'draft must not change committed table end date');
 listeners.click({target:{dataset:{key:'gantt-t1-commit'},matches:()=>false}});
 assert.notEqual(bars(),before,'commit must change bars and snapshot');
 assert.notEqual(end(),endBefore,'commit must change committed table end date');
 listeners.click({target:{dataset:{key:'gantt-undo'},matches:()=>false}});
 assert.equal(bars(),before,'undo must restore bars and snapshot');
 assert.equal(end(),endBefore,'undo must restore table end date');
}
{
 const {node}=open('wave5.js',136,'wave5Init');
 assert.match(node('[data-w5-controls]').innerHTML,/<select[^>]*data-key="node"/);
 assert.match(node('[data-w5-results]').innerHTML,/<svg[^>]*aria-label="有向フロー"/);
 assertSameKeys(ids(node('[data-w5-results]').innerHTML,'data-node'),['a','b','c']);
}
{
 const {node,listeners}=open('wave6.js',139,'wave6Init');
 const get=()=>node('[data-w6-results]').innerHTML;
 assert.match(get(),/<table>/);
 assert.match(get(),/<div data-graph/);
 assertSameKeys(ids(get(),'data-record'),ids(get(),'data-row'));
 listeners.click({target:{closest:()=>({dataset:{key:'graph-r2'}})}});
 assert.match(get(),/data-key="graph-r2" data-record="r2" aria-pressed="true"/);
 assert.match(get(),/data-key="table-r2"[^>]* checked/);
 listeners.change({target:{dataset:{key:'sort'},value:'desc'}});
 assert.match(get(),/data-key="table-r2"[^>]* checked/);
 assertSameKeys(ids(get(),'data-record'),ids(get(),'data-row'));
}
{
 const {initial,reduce}=require(path.join(app,'wave12.js'));
 for(const [id,expected] of [[157,0],[158,0],[159,2]]){
  const after=reduce(reduce(initial(id),{type:'run'}),{type:'run'});
  assert.equal(after.history.length,expected,'only #159 retains decision history');
  assert.ok(after.result);
 }
}
process.stdout.write('4 fixed-source probes PASS (132/136/139 + 157–159 decision history)\n');
