'use strict';
// Independent literal oracle derived from docs/wave16/ACCEPTANCE.md, no product imports.
const a=require('node:assert/strict');
const ids=[169,170,171],origin={169:'origin',170:'origin',171:'origin'},following={169:'cap',170:'failure',171:'kind'};
const edit=(key,value,action='select')=>({key,value,action,expect:{value}});
const act=(key,state,more={},action='enter')=>({key,action,expect:{state,...more}});
const search=(value,state,more={})=>({key:'gallery-search',action:'fill',value,expect:{value,state,...more}});
const category=(state,more={})=>({key:'gallery-category',action:'category-cycle',expect:{state,hiddenCount:0,visibleCount:1,...more}});
const reset=act('reset','idle',{historyCount:0,focus:'origin'});
const plan=id=>{
 if(id===169)return [
  act('run','complete',{historyCount:2,reason:'通常通知'}),edit('origin','transient'),act('run','retried',{historyCount:6,reason:'2回目'},'space'),
  search('Error Routing Workbench','retried',{historyCount:6}),category('retried',{historyCount:6}),
  edit('cap','0'),act('run','limit',{reason:'上限 0'}),edit('cap','3'),edit('recovery','no'),act('run','limit',{reason:'上限 3'}),
  edit('origin','permanent'),act('run','stopped',{reason:'代替も失敗'}),edit('recovery','yes'),act('run','fallback',{reason:'原処理は再実行せず'}),
  edit('origin','unknown'),act('run','manual',{reason:'分類不能'}),edit('policy','missing'),act('run','undefined',{reason:'未定義'}),
  edit('policy','cycle'),act('run','cycle',{reason:'循環'}),edit('policy','multi-cycle'),act('run','cycle',{reason:'循環'}),reset
 ];
 if(id===170)return [
  act('undo','invalid',{residual:[],reason:'二重補償'}),edit('failure','1'),act('run','pending',{residual:[0,1]}),
  edit('target','2'),act('undo','invalid',{residual:[0,1]}),edit('target','0'),act('undo','invalid',{residual:[0,1]}),
  edit('target','1'),act('undo','pending',{residual:[0,1],history:'失敗・効果が残留'}),
  act('undo','invalid',{residual:[0,1]}),search('Compensation Flow Simulator','invalid',{residual:[0,1]}),
  edit('target','0'),act('undo','manual',{residual:[1],reason:'部分復旧',detailsText:'枠確保：前進済み / 初期効果なし → 現在あり'}),
  {...act('undo','invalid',{residual:[1],historyCount:24,detailsAll:['枠確保：前進済み / 初期効果なし → 現在あり / 補償失敗','受付確定：前進失敗']}),times:25},
  reset,edit('origin','0'),act('run','no-effect',{residual:[],detailsAll:['仮登録：前進失敗','枠確保：未実行','受付確定：未実行']}),
  {...act('undo','invalid',{historyCount:24,detailsAll:['仮登録：前進失敗','枠確保：未実行']}),times:25},
  reset,edit('origin','1'),act('run','pending',{residual:[0],detailsAll:['仮登録：前進済み','枠確保：前進失敗','受付確定：未実行']}),
  reset,act('run','pending',{residual:[0,1]}),
  act('undo','pending',{residual:[0]}),edit('target','0'),act('undo','restored',{residual:[],reason:'全補償'}),reset
 ];
 if(id===171)return [
  edit('kind','permanent'),act('run','quarantined',{detailsText:'M-042：恒久障害／試行 1 回／隔離'}),
  edit('kind','malformed'),act('run','quarantined',{detailsText:'M-043：形式不正／試行 1 回／隔離'}),
  edit('kind','all'),edit('origin','存在しない','fill'),act('run','invalid',{detailsText:'条件に合う通はありません。'}),
  edit('origin','M-041','fill'),act('run','running',{effects:0,tries:3}),category('running',{effects:0,tries:3}),
  act('run','duplicate',{effects:0,tries:3}),act('fail','quarantined',{effects:0,tries:3,detailsText:'試行 3 回／隔離'}),
  search('Dead Letter Queue Inspector','quarantined',{effects:0,tries:3}),
  act('run','running',{effects:0,tries:4}),act('success','processed',{effects:1,tries:4,detailsText:'処理成功効果 1 件'}),
  act('run','duplicate',{effects:1,tries:4}),act('success','invalid',{effects:1,tries:4}),
  edit('origin','','fill'),edit('kind','exhausted'),act('run','running',{detailsText:'M-044：再試行上限／試行 4 回／処理中'}),
  act('success','processed',{detailsText:'M-044：再試行上限／試行 4 回／処理済み'}),reset
 ];
 throw Error('unexpected exhibit');
};
function checkRecord(id,record,op){
 a.deepEqual(record.operation,op,'operation mismatch');
 a.equal(record.snapshot.current[0],record.state,'model state mismatch');
 a.equal(record.snapshot.current[1],record.status,'visible reason/model mismatch');
 a.ok(record.status.trim());
 const model=record.snapshot.model;
 a.equal(record.historyCount,(id===169?model:model.history).length,'history count/model mismatch');
 a.deepEqual(record.renderedHistory,(id===169?model:model.history),'history DOM/model mismatch');
 for(const [k,v] of Object.entries(op.expect)){
  if(k==='residual')a.deepEqual(model.remaining,v,'residual mismatch');
  else if(k==='effects'||k==='tries')a.equal(model.items[0][k],v,k+' mismatch');
  else if(k==='reason')a.ok(record.status.includes(v),'reason mismatch: '+record.status);
  else if(k==='detailsAll')for(const x of v)a.ok(record.details.includes(x),'missing stable step status: '+x);
  else if(k==='detailsText')a.ok(record.details.includes(v),'details mismatch: '+record.details);
  else if(k==='history')a.ok(record.renderedHistory.some(x=>x.includes(v)),'missing failed compensation');
  else a.deepEqual(record[k],v,'observed '+k+' mismatch '+id+'/'+op.key);
 }
 const types={enter:'BUTTON',space:'BUTTON',select:'SELECT',fill:'INPUT','category-cycle':'BUTTON'};
 a.equal(record.control[0],types[op.action]);a.equal(record.controlNamed,true);a.equal(record.controlVisible,true);a.equal(record.fits,true,'horizontal overflow');
 a.ok(record.hostWidth>0&&record.pageWidth>0&&record.hostScroll<=record.hostWidth+1&&record.pageScroll<=record.pageWidth+1,'overflow geometry');
}
function checkCondition(row,c){
 for(const k of Object.keys(c))a.equal(row[k],c[k]);
 a.equal(row.themeObserved,c.theme);a.equal(row.reduced,c.zoom===2);a.deepEqual(row.viewport,[c.width,900]);
 a.equal(typeof row.browserVersion,'string');a.ok(row.browserVersion);
 a.deepEqual(row.consoleErrors,[]);a.deepEqual(row.pageErrors,[]);a.deepEqual(row.externalRequests,[]);
 a.deepEqual(Object.keys(row.steps),ids.map(String));
 for(const id of ids){
  a.deepEqual(row.search[id],{id,count:1});a.deepEqual(row.navigation[id],{opened:true,closed:true});
  a.deepEqual(row.keyboard[id],{next:following[id],returnFocus:true});
  if(c.zoom===2)a.deepEqual(row.touch[id],{emulated:true,focus:origin[id]});
  const {before,after,stateBefore,stateAfter,historyBefore,historyAfter}=row.font[id];
  a.equal(stateBefore,{169:'complete',170:'pending',171:'running'}[id]);a.equal(stateAfter,stateBefore);
  a.equal(historyBefore,{169:2,170:3,171:1}[id]);a.equal(historyAfter,historyBefore);
  a.ok(before.li>0&&before.label>0&&before.button>0&&Object.keys(before).length>=4);a.deepEqual(Object.keys(before),Object.keys(after));
  for(const [tag,size] of Object.entries(before))a.ok(size>0&&Math.abs(after[tag]-size*c.zoom)<.05,'font ratio '+id+'/'+tag);
  const {from,to}=row.scroll[id];a.ok(to.bottom>0&&to.top<to.viewport,'scroll target');
  if(from.bottom<=0||from.top>=from.viewport)a.notEqual(from.y,to.y);
  const expected=plan(id);a.equal(row.steps[id].length,expected.length,'operation count '+id);
  for(const [i,step] of row.steps[id].entries())checkRecord(id,step,expected[i]);
 }
 if(c.zoom!==2)a.deepEqual(row.touch,{});
}
module.exports={ids,origin,plan,checkRecord,checkCondition};
