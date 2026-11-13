'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),crypto=require('node:crypto');
// Complete static script/stylesheet closure of index.html; inline code is bound
// by index.html itself. No network fonts, imports or runtime fetched assets.
function filesAt(head){return ['exhibits.css','exhibits.js','index.html','wave1.css','wave1.js',...(git('show',`${head}:apps/v11/index.html`).toString().includes('src="wave2.js"')?['wave2.css','wave2.js']:[])];}
const sourceFiles=filesAt('HEAD');
const stages=['initial','query','permission','pivot','keyboard'];
const selectors=[124,125,126].flatMap(id=>['',' button',' select',' label',' [data-w1-before]',' [data-w1-state]',' th',' td',...(id===124?[' input']:[])].map(s=>`[data-wave1="${id}"]${s}`));
const tolerance=.1; // absolute CSS px, fixed before execution
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function git(...args){return cp.execFileSync('git',args,{maxBuffer:8e6});}
function commitTree(head){assert.equal(typeof head,'string');assert.match(head,/^[a-f0-9]{40}$/);assert.equal(git('rev-parse',`${head}^{commit}`).toString().trim(),head);return git('rev-parse',`${head}^{tree}`).toString().trim();}
function sourceContract(report,expected={}){
 assert.equal(typeof report.tree,'string');assert.match(report.tree,/^[a-f0-9]{40}$/);
 assert.equal(commitTree(report.head),report.tree,'commit/tree mismatch');
 if(expected.head)assert.equal(report.head,expected.head,'checkout HEAD mismatch');
 if(expected.tree)assert.equal(report.tree,expected.tree,'expected tree mismatch');
 assert.equal(commitTree(report.submittedHead),report.tree,'submitted HEAD / checkout tree mismatch');
 if(expected.submittedHead)assert.equal(report.submittedHead,expected.submittedHead,'submitted HEAD mismatch');
 assert.ok(report.sourceHashes&&typeof report.sourceHashes==='object'&&!Array.isArray(report.sourceHashes),'source hashes missing');
 const expectedFiles=filesAt(report.head);
 assert.deepEqual(Object.keys(report.sourceHashes).sort(),expectedFiles,'source file set mismatch');
 for(const name of expectedFiles){const h=report.sourceHashes[name];assert.equal(typeof h,'string');assert.match(h,/^[a-f0-9]{64}$/);assert.equal(h,digest(git('show',`${report.head}:apps/v11/${name}`)),`source hash mismatch: ${name}`);}
}
function measureContract(r){
 assert.ok(r.zoom===1||r.zoom===2,'zoom must be numeric 1 or 2');
 assert.ok(Number.isInteger(r.width)&&[375,390,1280].includes(r.width),'width must be numeric matrix width');
 if(r.zoom!==2)return;
 assert.ok(r.zoomBaseline&&typeof r.zoomBaseline==='object'&&!Array.isArray(r.zoomBaseline),'baseline missing');
 assert.deepEqual(Object.keys(r.zoomBaseline).sort(),[...selectors].sort(),'baseline selector set');
 for(const size of Object.values(r.zoomBaseline))assert.ok(typeof size==='number'&&Number.isFinite(size)&&size>0,'invalid baseline');
 assert.ok(r.zoomMeasurements&&typeof r.zoomMeasurements==='object'&&!Array.isArray(r.zoomMeasurements),'stage measurements missing');
 assert.deepEqual(Object.keys(r.zoomMeasurements).sort(),[...stages].sort(),'measurement stages missing');
 for(const stage of stages){const m=r.zoomMeasurements[stage];assert.equal(m.reducedMotion,true,`reduced motion missing: ${stage}`);assert.ok(Array.isArray(m.elements),'elements missing');assert.deepEqual([...new Set(m.elements.map(e=>e.selector))].sort(),[...selectors].sort(),`element coverage: ${stage}`);
  const identities=new Set();for(const e of m.elements){assert.ok(Number.isInteger(e.index)&&e.index>=0,'element index');const key=e.selector+'#'+e.index;assert.ok(!identities.has(key),'duplicate element');identities.add(key);assert.equal(e.before,r.zoomBaseline[e.selector],'baseline changed');assert.ok(typeof e.after==='number'&&Number.isFinite(e.after)&&e.after>0,'invalid measurement');assert.ok(Math.abs(e.after-2*e.before)<tolerance,`text ratio: ${stage} ${key}`);assert.equal(e.animationName,'none','animation active');assert.ok(/^0s(?:,\s*0s)*$/.test(e.transitionDuration),'transition active');}
  for(const selector of selectors){const items=m.elements.filter(e=>e.selector===selector);assert.deepEqual(items.map(e=>e.index),items.map((_,i)=>i),'element indices incomplete');}
 }
}
module.exports={sourceFiles,stages,selectors,tolerance,digest,sourceContract,measureContract,commitTree};
