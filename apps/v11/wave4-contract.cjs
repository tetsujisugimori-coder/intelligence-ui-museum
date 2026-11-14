'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),crypto=require('node:crypto');
// Complete static script/stylesheet closure of index.html; inline code is bound
// by index.html itself. No network fonts, imports or runtime fetched assets.
const sourceFiles=['exhibits.css','exhibits.js','index.html','wave1.css','wave1.js','wave2.css','wave2.js','wave3.css','wave3.js','wave4.css','wave4.js'];
const executionFiles=['wave4-audit-test.cjs','wave4-audit.cjs','wave4-browser.cjs','wave4-contract.cjs','wave4-test.cjs'];
const stages=['initial','calendar-adjacent','calendar-conflict','calendar-self','calendar-move','calendar-cancel','calendar-undo','calendar-delete','facets-or','facets-and','facets-keyword','facets-zero','facets-clear','detail-clean','detail-dirty','detail-invalid','detail-continue','detail-discard','detail-save','reset'];
const selectors=[133,134,135].flatMap(id=>['',' button',' input',' label',' [data-w4-state]',' [data-w4-before]',' [data-w4-current]',...(id===135?[' select',' [data-detail-id]',' [data-detail-list]']:[' [data-w4-results] li']),...(id===133?[' [data-cal-bar]']:[])].map(s=>`[data-wave4="${id}"]${s}`));
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
 for(const stage of stages){const m=r.zoomMeasurements[stage];assert.equal(m.reducedMotion,true,`reduced motion missing: ${stage}`);assert.ok(Array.isArray(m.elements),'elements missing');const expectedSelectors=selectors.filter(s=>!(stage==='facets-zero'&&s==='[data-wave4="134"] [data-w4-results] li'));assert.deepEqual([...new Set(m.elements.map(e=>e.selector))].sort(),expectedSelectors.sort(),`element coverage: ${stage}`);
  const identities=new Set();for(const e of m.elements){assert.ok(Number.isInteger(e.index)&&e.index>=0,'element index');const key=e.selector+'#'+e.index;assert.ok(!identities.has(key),'duplicate element');identities.add(key);assert.equal(e.before,r.zoomBaseline[e.selector],'baseline changed');assert.ok(typeof e.after==='number'&&Number.isFinite(e.after)&&e.after>0,'invalid measurement');assert.ok(Math.abs(e.after-2*e.before)<tolerance,`text ratio: ${stage} ${key}`);assert.equal(e.animationName,'none','animation active');assert.ok(/^0s(?:,\s*0s)*$/.test(e.transitionDuration),'transition active');}
  for(const selector of selectors){const items=m.elements.filter(e=>e.selector===selector);assert.deepEqual(items.map(e=>e.index),items.map((_,i)=>i),'element indices incomplete');}
 }
}
const initialCal=[{id:'a1',name:'調査',start:'09:00',end:'10:00'},{id:'a2',name:'設計',start:'11:00',end:'12:00'}];
const initialDetails=[{id:'r1',name:'史料目録',status:'準備'},{id:'r2',name:'地形図',status:'進行'},{id:'r3',name:'模型写真',status:'完了'}];
const clone=x=>JSON.parse(JSON.stringify(x));
// Independent hand-enumerated fixture, never imported from product computation.
const expectedFacet={
 initial:{ids:['f1','f2','f3','f4','f5','f6'],counts:{'kind:本':3,'kind:動画':3,'topic:歴史':3,'topic:技術':3}},
 'facets-or':{ids:['f1','f2','f3','f4','f5','f6'],counts:{'kind:本':3,'kind:動画':3,'topic:歴史':3,'topic:技術':3}},
 'facets-and':{ids:['f1','f2','f4'],counts:{'kind:本':2,'kind:動画':1,'topic:歴史':3,'topic:技術':3}},
 'facets-keyword':{ids:['f1'],counts:{'kind:本':1,'kind:動画':0,'topic:歴史':1,'topic:技術':2}},
 'facets-zero':{ids:[],counts:{'kind:本':0,'kind:動画':0,'topic:歴史':0,'topic:技術':0}},
 'facets-clear':{ids:['f1','f2','f3','f4','f5','f6'],counts:{'kind:本':3,'kind:動画':3,'topic:歴史':3,'topic:技術':3}},
 reset:{ids:['f1','f2','f3','f4','f5','f6'],counts:{'kind:本':3,'kind:動画':3,'topic:歴史':3,'topic:技術':3}}
};
const names={f1:'城の地図',f2:'史料を読む',f3:'測量入門',f4:'城の散歩',f5:'地図を作る',f6:'模型制作'};
function calendarExpected(stage){let rows=clone(initialCal);if(stage==='initial'||stage==='reset')return rows;rows.push({id:'a3',name:'隣接予定',start:'10:00',end:'11:00'});if(['calendar-self','calendar-move','calendar-cancel','calendar-undo','calendar-delete'].includes(stage))rows[0].name='調査改';if(['calendar-move','calendar-cancel'].includes(stage)){rows[0].start='13:00';rows[0].end='14:00'}if(stage==='calendar-delete')rows.pop();return rows;}
const minutes=s=>Number(s.slice(0,2))*60+Number(s.slice(3));
function observationContract(r){
 assert.ok(r.observations&&typeof r.observations==='object','observations missing');assert.deepEqual(Object.keys(r.observations),stages,'observation stages');
 for(const stage of stages){const o=r.observations[stage];assert.deepEqual(Object.keys(o),['133','134','135'],'observed exhibit set');for(const v of Object.values(o)){assert.equal(typeof v.current,'string');JSON.parse(v.current);assert.ok(Array.isArray(v.inputs),'input observations missing');assert.equal(new Set(v.inputs.map(x=>x.key)).size,v.inputs.length,'duplicate input identity');}
 const facet=JSON.parse(o[134].current), inputs=o[134].inputs;
 assert.deepEqual(inputs.map(x=>x.key),['facet-keyword','facet-kind-本','facet-kind-動画','facet-topic-歴史','facet-topic-技術'],'facet input identity');
 assert.equal(inputs[0].value,facet.keyword,'facet keyword input/state mismatch');assert.equal(inputs[0].checked,null,'keyword is not checkbox');assert.equal(inputs[0].hidden,false,'keyword input hidden');
 for(const [i,k,v]of [[1,'kind','本'],[2,'kind','動画'],[3,'topic','歴史'],[4,'topic','技術']]){assert.equal(inputs[i].checked,facet.selected[k].includes(v),'facet checked/state mismatch');assert.equal(inputs[i].hidden,false,'facet checkbox hidden');}
 }
 for(const stage of ['initial','calendar-adjacent','calendar-conflict','calendar-self','calendar-move','calendar-cancel','calendar-undo','calendar-delete','reset']){
  const o=r.observations[stage][133],rows=calendarExpected(stage);assert.deepEqual(JSON.parse(o.current),rows,'calendar committed state '+stage);assert.deepEqual(o.list.map(x=>x.id),rows.map(x=>x.id),'calendar list identity');assert.deepEqual(o.bars.map(x=>x.id),rows.map(x=>x.id),'calendar bar identity');
  for(const [i,row]of rows.entries()){assert.ok(o.list[i].text.includes(row.name)&&o.list[i].text.includes(row.start+'–'+row.end),'calendar list values');const b=o.bars[i],start=minutes(row.start),end=minutes(row.end),offset=(start-540)/30,duration=(end-start)/30;assert.equal(b.start,start);assert.equal(b.end,end);assert.equal(b.column,`${offset+1} / span ${duration}`,'calendar rendered placement');assert.match(b.background,/5\.5555/,'calendar background18 slots');assert.ok(b.width>0,'calendar bar invisible');for(const k of ['parentLeft','parentWidth','borderLeft','borderRight','gap','left','width'])assert.ok(Number.isFinite(b[k]),'calendar pixel evidence missing');const unit=(b.parentWidth-b.borderLeft-b.borderRight-17*b.gap)/18;assert.ok(unit>0);assert.ok(Math.abs(b.left-(b.parentLeft+b.borderLeft+offset*(unit+b.gap)))<.3,'calendar pixel position');assert.ok(Math.abs(b.width-(unit*duration+(duration-1)*b.gap))<.3,'calendar pixel length');}
  if(!['initial','reset'].includes(stage))assert.equal(o.activeKey,'cal-name','calendar focus');
 }
 for(const [stage,e]of Object.entries(expectedFacet)){const o=r.observations[stage][134],actual=JSON.parse(o.current);assert.deepEqual(actual.ids,e.ids,'facet OR/AND results');const selected=['facets-or','facets-and','facets-keyword','facets-zero'].includes(stage)?{kind:['本','動画'],topic:stage==='facets-or'?[]:['歴史']}:{kind:[],topic:[]};assert.deepEqual(actual.selected,selected,'facet selected conditions');assert.equal(actual.keyword,stage==='facets-keyword'?'地図':stage==='facets-zero'?'存在しないXYZ':'','facet keyword expectation');assert.deepEqual(o.counts,e.counts,'facet displayed counts');assert.deepEqual(Object.fromEntries(Object.entries(actual.counts).flatMap(([k,vs])=>Object.entries(vs).map(([v,n])=>[k+':'+v,n]))),e.counts,'facet computed counts');assert.deepEqual(o.facetNames,e.ids.map(id=>names[id]),'facet displayed results');}
 const rules={initial:['r1',null,'史料目録'], 'detail-clean':['r2',null,'地形図'],'detail-dirty':['r2','r3','未保存の地形図'],'detail-invalid':['r2','r3',''],'detail-continue':['r2',null,'未保存の地形図'],'detail-discard':['r3',null,'模型写真'],'detail-save':['r1',null,'史料目録'],reset:['r1',null,'史料目録']};
 for(const [stage,[selected,pending,draft]]of Object.entries(rules)){const o=r.observations[stage][135],v=JSON.parse(o.current),records=clone(initialDetails);if(stage==='detail-save')Object.assign(records[2],{name:'新しい模型写真',status:'進行'});assert.deepEqual(v.records,records,'detail committed records');assert.equal(v.selected,selected,'detail selected ID');assert.equal(v.pending,pending,'detail pending target');assert.equal(v.draft.name,draft,'detail protected draft');assert.equal(v.draft.id,selected,'draft identity');assert.equal(o.detailId,'詳細ID：'+selected,'visible detail identity');assert.deepEqual(o.detailList.map(x=>x.key),['detail-r1','detail-r2','detail-r3']);for(const [i,item]of o.detailList.entries()){assert.equal(item.pressed,String(records[i].id===selected));assert.ok(item.text.includes(records[i].name)&&item.text.includes(records[i].status),'visible list saved values');}assert.equal(o.inputs.find(x=>x.key==='detail-name').value,draft,'visible detail input');if(stage!=='initial')assert.equal(o.activeKey,stage==='detail-dirty'?'detail-save-switch':'detail-name','detail focus');}
}
const injections={
 'calendar-conflict':`h(133).addEventListener('click',e=>{if(e.target.dataset.key==='cal-save')h(133).querySelector('[data-w4-current]').textContent='[]'})`,
 'calendar-adjacent':`h(133).addEventListener('click',e=>{if(e.target.dataset.key==='cal-save')e.stopImmediatePropagation()},true)`,
 'calendar-grid':`h(133).querySelector('[data-cal-bar="a1"]').parentElement.style.backgroundImage='repeating-linear-gradient(to right,transparent 0,transparent calc(100% / 14 - 1px),currentColor calc(100% / 14 - 1px),currentColor calc(100% / 14))'`,
 'facet-logic':`h(134).addEventListener('change',()=>{const n=h(134).querySelector('[data-w4-current]');const v=JSON.parse(n.textContent);v.ids=[];n.textContent=JSON.stringify(v)})`,
 'facet-count':`h(134).querySelector('[data-facet-count="kind:本"]').textContent='4'`,
 'wrong-record':`h(135).addEventListener('click',e=>{if(e.target.dataset.key==='detail-save'){const n=h(135).querySelector('[data-w4-current]'),v=JSON.parse(n.textContent);v.records[1].name=v.records[0].name;v.records[0].name='史料目録';n.textContent=JSON.stringify(v)}})`,
 'dirty-loss':`h(135).addEventListener('click',e=>{if(e.target.dataset.key==='detail-r2')h(135).querySelector('[data-key="detail-name"]').value='地形図'})`,
 'reset':`h(133).addEventListener('click',e=>{if(e.target.matches('[data-w4-reset]'))e.stopImmediatePropagation()},true)`,
 'focus':`h(133).addEventListener('click',e=>{if(e.target.matches('[data-w4-reset]'))document.activeElement.blur()})`,
 'description':`document.querySelector('[data-id="124"] .description').textContent=''`
};
const faultReasons={'calendar-conflict':'overlap must preserve committed bookings','calendar-adjacent':'adjacent booking must be accepted','calendar-grid':'calendar background18 slots','facet-logic':'facet OR must include both kinds','facet-count':'facet count','wrong-record':'save targets selected stable ID','dirty-loss':'dirty switch preserves draft','reset':'reset initial draft','focus':'focus contract','description':'description missing 124'};
const mutationSource=fault=>{assert.ok(Object.hasOwn(injections,fault),'unknown mutation');return `\n/* TEST-ONLY ISOLATED FAULT COPY: ${fault} */\nwindow.addEventListener('load',()=>{const h=id=>document.querySelector('[data-wave4="'+id+'"]');${injections[fault]}});\n`};
module.exports={faultReasons,mutationSource,observationContract,executionFiles,sourceFiles,stages,selectors,tolerance,digest,sourceContract,measureContract,commitTree};
