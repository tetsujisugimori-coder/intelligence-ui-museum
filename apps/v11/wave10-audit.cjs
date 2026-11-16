'use strict';
const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const C=require('./wave10-contract.cjs'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const scenarios={151:['budget','priority','duplicate','missing','fixed','structure'],152:['unknown','missing','type','unauthorized','wrong-id','stale','duplicate','timeout'],153:['required','format','forbidden','value','expectation','missing-output']};
function names(){return ['initial','153-details-open','153-details-closed',...[151,152,153].flatMap(id=>[`${id}-normal`,`${id}-same`,...scenarios[id].flatMap(x=>[`${id}-${x}-edited`,`${id}-${x}`]),`${id}-reset`,`${id}-restored`]),'151-priority-input-edited','151-priority-input','151-priority-input-same','151-priority-input-reset','151-priority-input-restored','151-budget-zero-edited','151-budget-zero','151-final-reset','152-args-edited','152-args','152-tool-edited','152-sum','152-delete','152-final-reset','153-edit-again','153-final-reset'];}
function reasonExpected(check){const choices={required:['missing','present'],forbidden:['forbidden-present','absent'],type:['wrong-type','correct-type'],exact:['different-value','matches'],structure:['object-required','object-valid']};const pair=choices[check.condition.split(':')[0]];a.ok(pair,'known explanation condition');return pair[check.status==='PASS'?1:0];}
const compact=s=>String(s).replace(/\s/g,'');
function validateRendered(id,state,rendered){
 a.ok(rendered&&typeof rendered.text==='string','render record');const r=state.result;
 if(!r){for(const k of ['capacity','stage','ids','payload'])a.equal(rendered[k],null,'stale rendered '+k);for(const k of ['included','excluded','history','rows'])a.deepEqual(rendered[k],[],'stale rendered '+k);a.ok(/未|IDLE/.test(rendered.text),'unexecuted visible');a.ok(!/MOCK_COMPLETED|IMPROVED|REGRESSED|OVER_BUDGET/.test(rendered.text),'stale visible result');return;}
 a.equal(rendered.verdict,r.status,'render verdict');a.ok(rendered.status.includes(r.status),'render status');
 if(id===151){a.equal(rendered.capacity,r.status==='VALID'?`使用 ${r.used} / 残容量 ${r.remaining}`:null,'render capacity');a.deepEqual(rendered.included,r.status==='VALID'?r.included.map(i=>i+' '+C.ITEMS.find(x=>x.id===i).name):[],'render included exact');a.deepEqual(rendered.excluded,r.status==='VALID'?(r.excluded.length?r.excluded.map(x=>`${x.id}：容量不足（${x.reason}）`):['なし']):[],'render excluded exact');}
 if(id===152){a.equal(rendered.stage,`処理段階 ${r.stage} / 理由 ${r.reason}`,'render tool stage exact');a.equal(rendered.ids,`呼出しID ${r.callId} / 応答ID ${r.responseId??'なし'}`,'render tool IDs exact');a.deepEqual(rendered.history,r.history,'render tool history exact');a.equal(rendered.payload,r.payload===null?'未確定':JSON.stringify(r.payload,null,2),'render payload exact');}
 if(id===153){a.deepEqual(rendered.rows.map(x=>x.id),r.rows.map(x=>x.id),'render row set');for(let i=0;i<r.rows.length;i++){const x=r.rows[i],v=rendered.rows[i];a.equal(v.heading,x.id+'：'+x.change,'render row change exact');a.equal(v.status,`旧版 ${x.old.status} → 新版 ${x.new.status}`,'render row status exact');a.deepEqual(v.checks,['old','new'].flatMap(k=>x[k].checks.length?x[k].checks.map(c=>c.condition+'：'+c.status+' / '+reasonExpected(c)):['出力欠落：判定不能']),'render row conditions and reasons exact');}}
 const text=compact(rendered.text);a.ok(text.includes(r.status),'render result status');
 if(id===151){for(const x of r.included||[])a.ok(text.includes(typeof x==='string'?x:x.id),'render included');for(const x of r.excluded||[]){a.ok(text.includes(x.id),'render excluded ID');a.ok(text.includes(x.reason),'render exclusion reason');}for(const field of (r.status==='OVER_BUDGET'?['shortfall']:['used','remaining']))if(r[field]!==null&&r[field]!==undefined)a.ok(text.includes(String(r[field])),'render budget '+field);}
 if(id===152){for(const field of ['stage','reason','callId'])a.ok(text.includes(compact(r[field])),'render tool '+field);if(r.responseId)a.ok(text.includes(r.responseId),'render response ID');if(r.payload)a.ok(text.includes(compact(r.payload.value)),'render payload');else a.ok(!/架空A|架空B/.test(text),'stale tool payload');for(const x of r.history)a.ok(text.includes(x),'render history');}
 if(id===153)for(const row of r.rows){for(const x of [row.id,row.old.status,row.new.status,row.change])a.ok(text.includes(x),'render regression '+x);for(const version of ['old','new'])for(const check of row[version].checks){a.ok(text.includes(check.condition),'render condition');a.ok(text.includes(check.status),'render condition verdict');}}
}
// Independent prescribed UI history. No product reducer/import: the state of every
// exhibit (including untouched peers), input revision, epoch and call counter is fixed.
function expectedSteps(){
 const clone=x=>JSON.parse(JSON.stringify(x));
 const fresh=(id,epoch=0)=>id===151?{id,budget:16,items:clone(C.ITEMS),scenario:'normal',revision:0,result:null}:id===152?{id,tool:'lookup',args:'{"key":"alpha"}',scenario:'normal',revision:0,result:null,epoch,counter:0}:{id,scenario:'normal',revision:0,result:null};
 const states={151:fresh(151),152:fresh(152),153:fresh(153)},steps=[];
 const capture=name=>steps.push({name,states:clone(states)});
 const edit=(id,fields)=>{const state=states[id];if(Object.entries(fields).some(([key,value])=>JSON.stringify(state[key])!==JSON.stringify(value))){Object.assign(state,fields);state.revision++;state.result=null;}};
 const run=id=>{const state=states[id];if(id===152)state.counter++;state.result=C.expectedResult(id,C.stateInput(state));};
 const reset=id=>{states[id]=fresh(id,id===152?states[id].epoch+1:0);};
 capture('initial');capture('153-details-open');capture('153-details-closed');
 for(const id of [151,152,153]){
  run(id);capture(`${id}-normal`);capture(`${id}-same`);
  for(const scenario of scenarios[id]){edit(id,{scenario});capture(`${id}-${scenario}-edited`);run(id);capture(`${id}-${scenario}`);}
  reset(id);capture(`${id}-reset`);run(id);capture(`${id}-restored`);
 }
 const reordered=clone(C.ITEMS);reordered[2].priority=9;edit(151,{items:reordered});capture('151-priority-input-edited');run(151);capture('151-priority-input');capture('151-priority-input-same');reset(151);capture('151-priority-input-reset');run(151);capture('151-priority-input-restored');
 edit(151,{budget:0});capture('151-budget-zero-edited');run(151);capture('151-budget-zero');reset(151);capture('151-final-reset');
 edit(152,{args:'{"key":"beta"}'});capture('152-args-edited');run(152);capture('152-args');
 edit(152,{tool:'sum',args:'{"a":1,"b":2}'});capture('152-tool-edited');edit(152,{args:'{"a":2,"b":3}'});run(152);capture('152-sum');
 edit(152,{tool:'delete',args:'{"key":"alpha"}'});run(152);capture('152-delete');reset(152);capture('152-final-reset');
 edit(153,{scenario:'missing-output'});capture('153-edit-again');reset(153);capture('153-final-reset');
 return steps;
}
function validateSteps(row){
 const expected=expectedSteps();

 a.deepEqual(row.steps.map(x=>x.name),names(),'fixed step set');
 for(const [index,step] of row.steps.entries()){for(const id of [151,152,153]){const actual=step.states[id];a.deepEqual({...actual,result:actual.result===null?null:C.projectResult(id,actual.result)},expected[index].states[id],'fixed full state '+step.name+' exhibit '+id);}a.equal(step.documentFits,true,'document overflow');const fixedDetails=C.regressionFixture(step.states[153].scenario);a.deepEqual(step.rendered[153].details,{open:step.name==='153-details-open',headings:fixedDetails.map(c=>c.id+' '+c.label),texts:fixedDetails.flatMap(c=>[JSON.stringify(c.expectation,null,2),JSON.stringify(c.old,null,2),Object.prototype.hasOwnProperty.call(c,'new')?JSON.stringify(c.new,null,2):'欠落'])},'fixed visible input details');for(const id of [151,152,153]){C.validateState(step.states[id]);validateRendered(id,step.states[id],step.rendered[id]);}
  const parts=step.name.split('-'),id=Number(parts[0]);if([151,152,153].includes(id)){
   const s=step.states[id];if(step.name.endsWith('-edited')||step.name==='153-edit-again')a.equal(s.result,null,'input invalidation');
   if(step.name.endsWith('-same')){const prior=row.steps.find(x=>x.name===(step.name==='151-priority-input-same'?'151-priority-input':`${id}-normal`));a.deepEqual(s,prior.states[id],'same input consistency');}
   if(step.name.endsWith('-reset')){a.equal(s.result,null,'reset result');a.equal(s.revision,0,'reset revision');a.equal(s.scenario,'normal','reset scenario');a.equal(step.rendered[id].activeKey,{151:'budget',152:'tool',153:'scenario'}[id],'reset focus');}
  }
 }
 const first=row.steps[0];for(const id of [151,152,153]){a.equal(first.states[id].result,null,'initial result');a.equal(first.states[id].revision,0,'initial revision');a.equal(first.states[id].scenario,'normal','initial scenario');}
 a.equal(first.states[151].budget,16,'initial budget');a.deepEqual(first.states[151].items,C.ITEMS,'initial fixed items');a.equal(first.states[152].tool,'lookup','initial tool');a.deepEqual(JSON.parse(first.states[152].args),{key:'alpha'},'initial args');
 for(const id of [151,152,153]){const normal=row.steps.find(x=>x.name===`${id}-normal`).states[id].result;a.equal(normal.status,id===152?'MOCK_COMPLETED':'VALID','normal acceptance');for(const scenario of scenarios[id]){const step=row.steps.find(x=>x.name===`${id}-${scenario}`);a.equal(step.states[id].scenario,scenario,'scenario binding');a.ok(step.states[id].result,'executed scenario');}}
 const priority=row.steps.find(x=>x.name==='151-priority-input').states[151];a.equal(priority.items[2].priority,9,'real priority input');a.deepEqual(priority.result.included,['c1','c2','c4'],'priority changes selection');a.equal(priority.result.used,13,'priority used');a.equal(priority.result.remaining,3,'priority remaining');
 a.equal(row.steps.find(x=>x.name==='151-budget-zero').states[151].result.status,'OVER_BUDGET','zero capacity');a.equal(row.steps.find(x=>x.name==='152-sum').states[152].result.payload.value,5,'sum result');a.equal(row.steps.find(x=>x.name==='152-delete').states[152].result.status,'DENIED','delete refusal');
 for(const id of [151,152,153])a.deepEqual(row.accessibility[id],{forward:'reset',back:true,focusVisible:true},'native keyboard');a.equal(row.accessibility.reducedMotion,row.zoom===2,'reduced motion');
}
function trace(dir,row){cp.execFileSync('python3',['-c',`import sys,zipfile,json,urllib.parse
z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None
r=json.loads(sys.argv[2]);events=[json.loads(l) for n in z.namelist() if n.endswith('.trace') for l in z.read(n).decode().splitlines() if l.strip()]
c=[e for e in events if e.get('type')=='context-options'];assert len(c)==1
assert c[0]['browserName']==r['engine'];o=c[0]['options'];assert o['viewport']=={'width':r['width'],'height':1000};assert o.get('hasTouch') is True;assert o.get('reducedMotion')==('reduce' if r['zoom']==2 else 'no-preference')
g=[e for e in events if e.get('type')=='before' and e.get('method')=='goto'];assert len(g)==1;assert urllib.parse.urlsplit(g[0]['params']['url']).query=='wave10-condition='+r['id']
log=json.load(open(sys.argv[3]))['log'];assert len(log['pages'])==1 and log['pages'][0]['id']==g[0]['pageId'];assert all(e.get('pageref')==g[0]['pageId'] for e in log['entries']);assert any(e.get('type')=='frame-snapshot' for e in events);assert sum(e.get('type')=='after' for e in events)>30
`,path.join(dir,row.id+'.zip'),JSON.stringify({id:row.id,engine:row.engine,width:row.width,zoom:row.zoom}),path.join(dir,row.id+'.har')]);}
function audit(dir){
 const report=JSON.parse(fs.readFileSync(path.join(dir,'results.json'))),git=(...args)=>cp.execFileSync('git',args),B=require('./wave10-browser.cjs');
 a.equal(report.schema,1);a.match(report.head,/^[0-9a-f]{40}$/);a.equal(git('rev-parse',report.head+'^{tree}').toString().trim(),report.tree,'HEAD/tree');a.equal(report.ci.checkout,report.head,'checkout attribution');a.equal(report.environment.playwright,'1.56.1','Playwright identity');a.ok(report.environment.node&&report.environment.os&&report.environment.arch,'environment');
 a.deepEqual(report.results.map(r=>r.id).sort(),B.matrix().map(r=>`${r.engine}-${r.width}-${r.theme}-${r.zoom}`).sort(),'condition set');
 const html=git('show',report.head+':apps/v11/index.html').toString(),assets=['index.html',...[...html.matchAll(/(?:src|href)="([^"/]+\.(?:js|css))"/g)].map(x=>x[1])];
 a.deepEqual(Object.keys(report.source).sort(),assets.sort(),'asset closure');for(const f of assets)a.equal(report.source[f],hash(git('show',`${report.head}:apps/v11/${f}`)),'Git/source '+f);
 a.deepEqual(Object.keys(report.execution).sort(),B.execution.slice().sort(),'execution set');for(const f of B.execution){a.equal(report.execution[f],hash(git('show',`${report.head}:apps/v11/${f}`)),'execution source '+f);a.equal(report.execution[f],hash(fs.readFileSync(path.join(dir,'execution',f))),'execution bytes '+f);}
 for(const row of report.results){a.equal(row.head,report.head,'row HEAD');a.equal(row.tree,report.tree,'row tree');a.equal(row.id,`${row.engine}-${row.width}-${row.theme}-${row.zoom}`,'row identity');a.equal(row.status,'PASS','formal condition');a.deepEqual(row.errors,[],'browser errors');a.ok(row.browserVersion,'browser identity');validateSteps(row);trace(dir,row);
  for(const step of row.steps){a.ok(step.fonts.length>20,'font samples');a.deepEqual([...new Set(step.fonts.map(f=>f.host))].sort(),['151','152','153'],'font hosts');for(const f of step.fonts){a.ok(row.baseline[f.tag]>0,'font baseline');a.ok(Math.abs(f.size-row.baseline[f.tag]*row.zoom)<.1,'measured text size');}}
  const log=JSON.parse(fs.readFileSync(path.join(dir,row.id+'.har'))).log;
  a.deepEqual(row.responses.map(x=>x.name).sort(),assets.slice().sort(),'response asset set');for(const f of assets){const responses=row.responses.filter(x=>x.name===f),entries=log.entries.filter(e=>(new URL(e.request.url).pathname.slice(1)||'index.html')===f);a.equal(responses.length,1);a.equal(responses[0].status,200);a.equal(responses[0].sha256,report.source[f]);a.equal(entries.length,1,'single HAR asset');a.equal(entries[0].response.status,200);const c=entries[0].response.content;a.equal(typeof c.text,'string','embedded HAR');a.equal(hash(Buffer.from(c.text,c.encoding==='base64'?'base64':'utf8')),report.source[f],'HAR/source '+f);const b=fs.readFileSync(path.join(dir,row.id,f));a.equal(hash(b),report.source[f],'response/source '+f);a.equal(b.length,responses[0].size);}
  a.deepEqual(row.screenshots.map(x=>x.id),row.zoom===2?[151,152,153]:[],'representative screenshot set');for(const s of row.screenshots){a.equal(s.file,`${row.id}-exhibit-${s.id}.png`);const b=fs.readFileSync(path.join(dir,s.file));a.equal(b.length,s.size);a.equal(hash(b),s.sha256,'screenshot hash');a.ok(s.width>0&&s.width<=row.width&&s.height>0&&s.height<32768);require('./wave4-audit.cjs').validatePng(path.join(dir,s.file),s.width,s.height);}
 }
 const faults=JSON.parse(fs.readFileSync(path.join(dir,'faults.json')));a.equal(faults.head,report.head,'fault HEAD');a.equal(faults.tree,report.tree,'fault tree');const expected=require('./wave10-faults.cjs').derive(report);a.deepEqual(faults,expected,'fixed live fault pair records');
 return {status:'PASS',head:report.head,tree:report.tree,conditions:14,steps:names().length,faultPairs:faults.results.length,scope:'fixed fictional automated contracts; not real Safari/VoiceOver/physical touch/OS enlargement/AI internals'};
}
module.exports={audit,expectedSteps,validateSteps,validateRendered,names,scenarios,trace};if(require.main===module)console.log(JSON.stringify(audit(path.resolve(process.argv[2])),null,2));
