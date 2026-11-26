'use strict';
// Independent literal browser oracle: fixed transition observations from ACCEPTANCE.md.
// No product imports or product formulas.
const a=require('node:assert/strict');
const ids=[166,167,168],origin={166:'event',167:'policy',168:'id'},following={166:'field',167:'scenario',168:'key'};
const stateText={
 idle:'操作前',candidate:'条件一致',filtered:'条件不一致','invalid-event':'入力不正','invalid-filter':'条件不正',
 success:'成功',exhausted:'最大試行回数',permanent:'恒久エラー',unknown:'結果不明',invalid:'入力不正',overflow:'計算上限',
 new:'新規','in-flight':'処理中の重複',duplicate:'完了済みの重複',conflict:'衝突','blocked-unknown':'結果不明',completed:'完了'
};
const btn=(key,state,more={},action='enter')=>({key,action,expect:{state,...more}});
const submitted={type:'submitted',eventId:'E-APP-01',amount:0,urgent:false,note:''};
const edit=(key,value,action='select')=>({key,value,action,expect:{value}});
const search=(value,state,more)=>({key:'gallery-search',action:'fill',value,expect:{value,state,...more}});
const reset=(id)=>btn('reset','idle',{historyCount:0,focus:origin[id],...(id===168?{effects:'0',controlOutput:null}:{})});
function plan(id){
 if(id===166)return [
  btn('run','candidate',{repeat:'false',historyCount:1,eventBody:submitted,actionShown:'起動候補：申請受付通知'}),
  btn('run','candidate',{repeat:'true',historyCount:2},'space'),
  search('Event Trigger Inspector','candidate',{repeat:'true',historyCount:2}),
  edit('field','amount'),edit('value','0','fill'),btn('run','candidate',{repeat:'true',historyCount:3}),
  edit('value','1','fill'),btn('run','filtered',{historyCount:4,actionShown:'起動候補：なし'}),
  edit('value','"0"','fill'),btn('run','invalid-filter',{historyCount:5}),
  edit('value','{','fill'),btn('run','invalid-filter',{historyCount:6}),
  edit('field','invalid'),btn('run','invalid-filter',{historyCount:7}),
  edit('field','urgent'),edit('value','false','fill'),btn('run','candidate',{historyCount:8}),
  edit('field','note'),edit('value','""','fill'),btn('run','candidate',{historyCount:9}),
  edit('event','missing'),btn('run','invalid-event',{historyCount:10}),
  edit('event','unknown'),btn('run','invalid-event',{historyCount:11}),
  edit('event','approved'),edit('field','type'),edit('value','"approved"','fill'),btn('run','candidate',{repeat:'false',historyCount:12,actionShown:'起動候補：承認通知'}),
  btn('run','candidate',{repeat:'true',historyCount:12}),
  reset(id),btn('run','candidate',{repeat:'false',historyCount:1}),reset(id)
 ];
 if(id===167){
  const run=(state,timeline)=>btn('run',state,{timeline,historyCount:timeline.length});
  return [
   edit('scenario','first'),run('success',[['0','','success']]),
   search('Retry & Backoff Simulator','success',{timeline:[['0','','success']],historyCount:1}),
   edit('scenario','recover'),edit('policy','immediate'),run('success',[['0','0','transient'],['20','0','transient'],['40','','success']]),
   edit('policy','fixed'),run('success',[['0','100','transient'],['120','100','transient'],['240','','success']]),
   edit('policy','exponential'),run('success',[['0','100','transient'],['120','200','transient'],['340','','success']]),
   edit('scenario','exhaust'),run('exhausted',[['0','100','transient'],['120','200','transient'],['340','250','transient'],['610','','transient']]),
   edit('scenario','permanent'),run('permanent',[['0','','permanent']]),
   edit('scenario','timeout'),edit('tries','1','fill'),run('unknown',[['0','','timeout']]),
   edit('timeout','0','fill'),run('invalid',[]),
   edit('timeout','50','fill'),edit('base','-1','fill'),run('invalid',[]),
   reset(id),edit('policy','fixed'),edit('scenario','recover'),
   edit('base','9007199254740991','fill'),edit('cap','9007199254740991','fill'),run('overflow',[]),reset(id)
  ];
 }
 if(id===168){
  const s=(key,state,effects,n)=>btn(key,state,{effects:String(effects),historyCount:n});
  return [
   s('run','new',0,1),s('run','in-flight',0,2),s('complete','completed',1,3),
   {key:'gallery-category',action:'category-cycle',expect:{hiddenCount:0,visibleCount:1,state:'completed',effects:'1',historyCount:3}},
   edit('id','E-APP-02','fill'),s('run','duplicate',1,4),
   edit('payload','alternate'),s('run','conflict',1,5),
   edit('key','','fill'),s('run','invalid',1,6),reset(id),
   s('run','new',0,1),s('lost','unknown',1,2),
   edit('id','E-APP-02','fill'),s('run','blocked-unknown',1,3),
   search('Idempotency Workbench','blocked-unknown',{effects:'1',historyCount:3}),
   s('run','blocked-unknown',1,4),
   s('reconcile','completed',1,5),s('run','duplicate',1,6),
   {key:'control',action:'space',expect:{effects:'1',controlOutput:{normal:'1',fault:'2'},historyCount:6}},
   reset(id)
  ];
 }
 throw Error('unexpected exhibit id');
}
function checkRecord(id,record,op){
 a.deepEqual(record.operation,op,'operation/expected mismatch '+id);
 for(const [key,value] of Object.entries(op.expect))a.deepEqual(record[key],value,'observed '+key+' mismatch '+id+'/'+op.key);
 a.ok(typeof record.status==='string'&&record.status.trim(),'visible status missing '+id);
 if(op.expect.state)a.ok(record.status.includes(id===167&&op.expect.state==='unknown'?'副作用は不明':stateText[op.expect.state]),'visible reason mismatch '+id+'/'+op.key);
 a.equal(record.model?.state,record.state,'exhibit state / DOM mismatch '+id);
 a.equal(record.model?.history?.length,record.historyCount,'exhibit history / DOM mismatch '+id);
 if(id===167&&op.expect.timeline){
  a.deepEqual(record.model.history.map(x=>[String(x.start),x.delay===null?'':String(x.delay),x.result]),op.expect.timeline,'timeline model / DOM disagreement');
  for(const [index,start] of op.expect.timeline.entries())a.ok(record.renderedHistory[index].includes(start[0]+'→'),'rendered timeline start mismatch');
 }
 if(id===168&&op.key==='control'){
  a.equal(record.controlText.length,2,'rendered independent paired controls');
  a.match(record.controlText[0],/正常.*副作用 1件/);
  a.match(record.controlText[1],/故障.*副作用 2件/);
 }
 a.equal(record.control[0],({enter:'BUTTON',space:'BUTTON',select:'SELECT',fill:'INPUT','category-cycle':'BUTTON'})[op.action]);
 a.equal(record.controlNamed,true,'named control '+id+'/'+op.key);
 a.equal(record.controlVisible,true,'control not in viewport '+id+'/'+op.key);
 a.equal(record.fits,true,'exhibit content escaped '+id);
 a.ok(record.hostWidth>0&&record.pageWidth>0&&record.hostScroll<=record.hostWidth+1&&record.pageScroll<=record.pageWidth+1,'overflow geometry '+id);
 a.equal(record.historyCount,record.renderedHistory.length,'history count/DOM mismatch '+id);
 a.ok(record.renderedHistory.every(t=>typeof t==='string'&&t.trim()),'unreadable history '+id);
}
function checkCondition(row,c){
 for(const k of Object.keys(c))a.equal(row[k],c[k]);
 a.equal(row.themeObserved,c.theme);a.equal(row.reduced,c.zoom===2);a.deepEqual(row.viewport,[c.width,900]);
 a.equal(typeof row.browserVersion,'string');a.ok(row.browserVersion);
 a.deepEqual(row.consoleErrors,[]);a.deepEqual(row.pageErrors,[]);a.deepEqual(row.externalRequests,[]);
 a.deepEqual(Object.keys(row.steps),ids.map(String));
 for(const id of ids){
  a.deepEqual(row.search[id],{id,count:1});
  a.deepEqual(row.navigation[id],{opened:true,closed:true});
  a.deepEqual(row.keyboard[id],{next:following[id],returnFocus:true});
  if(c.zoom===2)a.deepEqual(row.touch[id],{emulated:true,focus:origin[id]});
  const {before,after,stateBefore,stateAfter,historyBefore,historyAfter}=row.font[id];
  a.equal(stateBefore,{166:'candidate',167:'success',168:'new'}[id]);a.equal(stateAfter,stateBefore);
  a.equal(historyBefore,1);a.equal(historyAfter,1);a.ok(before.li>0,'measured actual history text');a.ok(Object.keys(before).length>=4);a.deepEqual(Object.keys(before),Object.keys(after));
  for(const [tag,size] of Object.entries(before))a.ok(size>0&&Math.abs(after[tag]-size*c.zoom)<.05,'font ratio '+id+'/'+tag);
  const {from,to}=row.scroll[id];a.ok(to.bottom>0&&to.top<to.viewport,'scroll target');
  if(from.bottom<=0||from.top>=from.viewport)a.notEqual(from.y,to.y);
  const expected=plan(id);a.equal(row.steps[id].length,expected.length,'operation count '+id);
  for(const [i,step] of row.steps[id].entries())checkRecord(id,step,expected[i]);
 }
 if(c.zoom!==2)a.deepEqual(row.touch,{});
}
module.exports={ids,origin,plan,checkRecord,checkCondition};
