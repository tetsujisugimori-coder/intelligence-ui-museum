'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),crypto=require('node:crypto');
// Complete static script/stylesheet closure of index.html; inline code is bound
// by index.html itself. No network fonts, imports or runtime fetched assets.
const sourceFiles=['exhibits.css','exhibits.js','index.html','wave1.css','wave1.js','wave2.css','wave2.js','wave3.css','wave3.js','wave4.css','wave4.js'];
const executionFiles=['wave3-audit-test.cjs','wave3-audit.cjs','wave3-browser.cjs','wave3-contract.cjs','wave3-test.cjs'];
const stages=['initial','grid-edit','grid-commit','grid-cancel','grid-undo','form-invalid','form-applied','form-conditional','gantt-edit','gantt-commit','gantt-cancel','gantt-undo','reset'];
const selectors=[130,131,132].flatMap(id=>['',' button',' input',' label',' [data-w3-state]',' [data-w3-initial]',' [data-w3-before]',' [data-w3-current]',...(id===131?[' textarea',' select']:[' th',' td'])].map(s=>`[data-wave3="${id}"]${s}`));
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
 assert.deepEqual(Object.keys(report.sourceHashes).sort(),sourceFiles,'source file set mismatch');
 assert.deepEqual(Object.keys(report.executionHashes||{}).sort(),executionFiles,'execution files missing');
 for(const name of executionFiles)assert.equal(report.executionHashes[name],digest(git('show',`${report.head}:apps/v11/${name}`)),`execution hash mismatch: ${name}`);
 for(const name of sourceFiles){const h=report.sourceHashes[name];assert.equal(typeof h,'string');assert.match(h,/^[a-f0-9]{64}$/);assert.equal(h,digest(git('show',`${report.head}:apps/v11/${name}`)),`source hash mismatch: ${name}`);}
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
function observationContract(r){
 assert.ok(r.observations&&typeof r.observations==='object','observations missing');
 assert.deepEqual(Object.keys(r.observations),stages,'observation stages');
 for(const stage of stages){const o=r.observations[stage];assert.deepEqual(Object.keys(o),['130','131','132'],'observed exhibit set');for(const v of Object.values(o)){assert.equal(typeof v.current,'string');assert.ok(v.current.length>0,'current state missing');assert.ok(Array.isArray(v.inputs),'input observations missing');assert.equal(new Set(v.inputs.map(x=>x.key)).size,v.inputs.length,'duplicate input identity');}}
 for(const stage of ['initial','grid-undo','reset'])assert.match(r.observations[stage][130].gridTotal,/37\.10/,'observed initial total');
 for(const stage of ['grid-commit','grid-cancel'])assert.match(r.observations[stage][130].gridTotal,/17\.10/,'observed committed total');
 assert.equal(r.observations['grid-edit'][130].current,r.observations.initial[130].current,'draft changed committed grid');
 assert.equal(r.observations['grid-undo'][130].current,r.observations.initial[130].current,'Undo did not restore grid');
 assert.equal(r.observations.reset[130].current,r.observations.initial[130].current,'Reset did not restore grid');
 for(const [stage,offset,duration] of [['initial',0,2],['gantt-commit',3,1],['gantt-cancel',3,1],['gantt-undo',0,2],['reset',0,2]]){const bars=r.observations[stage][132].bars;assert.deepEqual(bars.map(b=>b.id),['t1','t2','t3','t4','t5'],'bar set');assert.equal(Number(bars[0].offset),offset,'observed gantt offset');assert.equal(Number(bars[0].duration),duration,'observed gantt duration');assert.equal(bars[0].gridColumn,`${offset+1} / span ${duration}`,'observed rendered position');assert.ok(bars[0].width>0,'zero visible bar width');}
 assert.deepEqual(Object.keys(r.barMeasurements||{}),['initial','gantt-commit','gantt-cancel','gantt-undo','reset'],'pixel bar stage coverage');
 for(const [stage,offset,duration] of [['initial',0,2],['gantt-commit',3,1],['gantt-cancel',3,1],['gantt-undo',0,2],['reset',0,2]]){const v=r.barMeasurements[stage];for(const field of ['left','width','parentLeft','parentWidth','borderLeft','borderRight','paddingLeft','paddingRight','gap'])assert.ok(Number.isFinite(v[field]),'bar measurement missing');assert.equal(v.offset,offset);assert.equal(v.duration,duration);const unit=(v.parentWidth-v.borderLeft-v.borderRight-v.paddingLeft-v.paddingRight-13*v.gap)/14;assert.ok(unit>0);const left=v.parentLeft+v.borderLeft+v.paddingLeft+offset*(unit+v.gap),width=duration*unit+(duration-1)*v.gap;assert.ok(Math.abs(v.left-left)<.2,'pixel bar position');assert.ok(Math.abs(v.width-width)<.2,'pixel bar length');}
 assert.equal(r.observations['gantt-edit'][132].current,r.observations.initial[132].current,'draft changed gantt');
 assert.equal(r.observations['gantt-undo'][132].current,r.observations.initial[132].current,'Undo did not restore gantt');
 assert.equal(r.observations.reset[132].current,r.observations.initial[132].current,'Reset did not restore gantt');
 for(const [stage,id,target] of [['grid-commit',130,'grid-r1-name'],['grid-cancel',130,'grid-r1-name'],['grid-undo',130,'grid-r1-name'],['form-invalid',131,'schema-editor'],['form-applied',131,'field-name'],['gantt-commit',132,'gantt-t1-start'],['gantt-cancel',132,'gantt-t1-start'],['gantt-undo',132,'gantt-t1-start']])assert.equal(r.observations[stage][id].activeKey,target,'observed focus');
}
const injections={
 'grid-total':`h(130).querySelector('[data-grid-total]').textContent='38.10'`,
 'grid-invalid':`h(130).addEventListener('input',()=>{h(130).querySelector('[data-key="grid-r1-commit"]').disabled=false});h(130).addEventListener('click',e=>{if(e.target.dataset.key==='grid-r1-commit')h(130).querySelector('[data-grid-current]').textContent='INVALID ROW ACCEPTED'})`,
 'form-visibility':`h(131).addEventListener('change',e=>{if(e.target.dataset.key==='field-enabled'){const n=h(131).querySelector('[data-key="field-note"]');n.hidden=true;n.style.display='none'}})`,
 'gantt-position':`const b=h(132).querySelector('[data-w3-bar="t1"]');b.dataset.offset='1';b.style.gridColumn='2 / span 2'`,
 'gantt-duration':`const b=h(132).querySelector('[data-w3-bar="t1"]');b.dataset.duration='3';b.style.gridColumn='1 / span 3'`,
 'reset':`h(130).addEventListener('click',e=>{if(e.target.matches('[data-w3-reset]'))e.stopImmediatePropagation()},true)`,
 'focus':`h(130).addEventListener('click',e=>{if(e.target.matches('[data-w3-reset]'))document.activeElement.blur()})`,
 'description':`document.querySelector('[data-id="127"] .description').textContent='undefined'`
};
const mutationSource=fault=>`\n/* TEST-ONLY ISOLATED FAULT COPY: ${fault} */\nwindow.addEventListener('load',()=>{const h=id=>document.querySelector('[data-wave3="'+id+'"]');${injections[fault]}});\n`;
module.exports={mutationSource,observationContract,executionFiles,sourceFiles,stages,selectors,tolerance,digest,sourceContract,measureContract,commitTree};
