// Independent literals from docs/wave13/ACCEPTANCE.md; no product import.
const a = require('node:assert/strict');
const date = {
  '2026-03-31':['before','before'], '2026-04-01':['valid','before'],
  '2026-04-14':['valid','before'], '2026-04-15':['valid','valid'],
  '2026-04-30':['valid','valid'], '2026-05-01':['expired','valid'],
  '2026-05-15':['expired','valid'], '2026-05-16':['expired','expired'],
};
const comparisons={R2:['exact','exact'],R3:['format','exact'],R4:['exact','conflict'],R5:['exact','incomparable']};
const ids='T01 T02 T03 T04 T05 T06 T07 T08 T09 T10 T11 T12 T13 T14 T15 T16 T17 T18 T19 T20'.split(' ');
const slices={all:[18,20,90,ids],regular:[18,18,100,ids.slice(0,18)],closed:[0,2,0,['T19','T20']],night:[0,0,null,[]]};
const x=(id,key,value,initial)=>({action:'input',id,key,value,expect:initial??null});
const run=(id,expect,text)=>({action:'run',id,expect,text});
const reset=(id,focus)=>({action:'reset',id,expect:null,focus});
function plan(id){
 if(id===160)return [
  ...Object.entries(date).flatMap(([v,e])=>[x(id,'date',v),run(id,e)]),
  x(id,'date','2026-05-16',date['2026-05-16']),
  x(id,'date','2026-02-29'),run(id,'invalid','判定拒否'),
  x(id,'date','2026-04-01'),x(id,'period','reversed'),run(id,'invalid','判定拒否'),reset(id,'date'),
 ];
 if(id===161)return [run(id,comparisons.R2),
  ...Object.entries(comparisons).slice(1).flatMap(([v,e])=>[x(id,'right',v),run(id,e)]),
  x(id,'right','R5',comparisons.R5),x(id,'right','R1'),run(id,'invalid','判定拒否'),reset(id,'left')];
 return [run(id,slices.all,'18/20件（90%）'),
  x(id,'slice','regular'),run(id,slices.regular,'18/18件（100%）'),
  x(id,'slice','closed'),run(id,slices.closed,'0/2件（0%）'),
  x(id,'slice','closed',slices.closed),x(id,'slice','night'),run(id,slices.night,'対象なし'),reset(id,'slice')];
}
const project=(id,r)=>!r?null:r.status==='invalid'?'invalid':id===162?[r.passed,r.total,r.percent,r.rows.map(x=>x.id)]:r.rows.map(x=>x.status);
const words={before:'発効前',valid:'有効',expired:'期限切れ',exact:'完全一致',format:'表記差のみ',conflict:'内容の不一致',incomparable:'比較不能'};
function checkRecord(id, row, expected){
 a.deepEqual(row.operation,expected,'operation/expected mismatch');
 a.deepEqual(project(id,row.result),expected.expect,'semantic verdict');
 a.ok(row.fits,'horizontal clipping');
 if(expected.text) a.ok(row.status.includes(expected.text),'visible verdict');
 if(expected.focus) a.equal(row.focus,expected.focus,'Reset focus');
 if(expected.expect===null||expected.expect==='invalid') a.deepEqual(row.rows,[],'stale/success rows');
 else if(id===162){
  a.equal(row.rows.length,expected.expect[1],'display denominator');
  a.deepEqual(row.rows.map(v=>v.split(' ')[0]),expected.expect[3],'display IDs');
  a.equal(row.rows.filter(v=>v.endsWith('：合格')).length,expected.expect[0],'display numerator');
 }else{
  a.equal(row.rows.length,2);
  expected.expect.forEach((v,i)=>a.ok(row.rows[i].includes(words[v])&&row.result.rows[i].reason,'visible reasons'));
 }
}
function auditSteps(result){
 for(const id of [160,161,162]){
  const expected=plan(id), actual=result.steps[id];
  a.equal(actual.length,expected.length,'operation count');
  actual.forEach((record,i)=>checkRecord(id,record,expected[i]));
 }
}
module.exports={date,comparisons,slices,plan,project,checkRecord,auditSteps};
