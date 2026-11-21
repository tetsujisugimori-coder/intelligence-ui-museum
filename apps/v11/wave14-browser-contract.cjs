'use strict';
// Literal review-side scenarios from docs/wave14/ACCEPTANCE.md. No product imports.
const a=require('node:assert/strict');
const ids=[163,164,165];
const origin={163:'source-0',164:'start',165:'name'};
const following={163:'target-0',164:'reset',165:'lookup'};
function click(steps,key,expect,visible=[],focus){
 const op={action:'enter',key,expect,visible};if(focus)op.focus=focus;steps.push(op);
}
function set(steps,key,value,expect,visible=[],action='select'){
 steps.push({action,key,value,expect,visible});
}
function makeMapping(){
 const steps=[];
 const defaults=[{source:'title',target:'label'},{source:'count',target:'visitors'},{source:'open',target:'available'},{source:'tags',target:'labels'},{source:'info',target:'metadata'}];
 const initial={mappings:defaults,result:null};
 const valid=(label='来館予約',optional=true)=>({status:'valid',output:{label,visitors:0,available:false,...(optional?{labels:[],metadata:{room:'青波'}}:{metadata:{room:'青波'}})}});
 const invalid=reason=>({status:'invalid',reason,output:null});
 click(steps,'preview',{result:valid()},['プレビュー成功']);
 set(steps,'source-1','count',{result:valid()},['プレビュー成功']);
 set(steps,'source-0','blank',{result:null},['未評価']);
 click(steps,'preview',{result:valid('')},['プレビュー成功']);
 set(steps,'target-3','',{result:null},['未評価']);
 click(steps,'preview',{result:valid('',false)},['プレビュー成功']);
 set(steps,'target-1','label',{result:null},['未評価']);
 click(steps,'preview',{result:invalid('DUPLICATE_TARGET')},['二重接続']);
 click(steps,'reset',initial,['未評価'],'source-0');
 set(steps,'target-1','',{result:null},['未評価']);
 click(steps,'preview',{result:invalid('REQUIRED_UNMAPPED')},['未接続']);
 click(steps,'reset',initial,['未評価'],'source-0');
 for(const [src,reason,text] of [['title','TYPE_MISMATCH','number'],['nil','NULL_VALUE','null'],['absent','UNDEFINED_VALUE','未定義']]){
  set(steps,'source-1',src,{result:null},['未評価']);
  click(steps,'preview',{result:invalid(reason)},[text]);
 }
 click(steps,'reset',initial,['未評価'],'source-0');
 click(steps,'remove-4',{mappings:defaults.slice(0,4),result:null},['未評価']);
 click(steps,'add',{mappings:[...defaults.slice(0,4),{source:'',target:''}],result:null},['未評価']);
 click(steps,'reset',initial,['未評価'],'source-0');
 click(steps,'preview',{result:valid()},['プレビュー成功']);
 steps.at(-1).action='space';
 return steps;
}
function makeJoin(){
 const steps=[];
 const def={A:'failed',B:'success',C:'success'};
 const initial={phase:'idle',rule:'all',quorum:2,plan:def,history:[],decision:null,branches:{A:'pending',B:'pending',C:'pending'}};
 const started={phase:'running',decision:null,history:[],branches:{A:'running',B:'running',C:'running'}};
 const yes=(at,branch)=>({status:'joined',reason:'threshold-met',at,branch});
 const no=(at,branch)=>({status:'impossible',reason:'insufficient-failed',at,branch});
 const canceled={status:'cancelled',reason:'all-cancelled',at:3,branch:'C'};
 const actuals=[
  {rule:'all',edits:[['plan-a','success']],answers:['success','success','success'],decisions:[null,null,yes(3,'C')]},
  {rule:'any',edits:[['rule','any']],answers:['success','failed','success'],decisions:[yes(1,'B'),yes(1,'B'),yes(1,'B')]},
  {rule:'quorum',edits:[['rule','quorum']],answers:['success','failed','success'],decisions:[null,null,yes(3,'C')]},
  {rule:'quorum',edits:[['rule','quorum'],['quorum','3']],answers:['success','failed','success'],decisions:[null,no(2,'A'),no(2,'A')]},
  {rule:'any',edits:[['rule','any'],['plan-a','cancelled'],['plan-b','cancelled'],['plan-c','cancelled']],answers:['cancelled','cancelled','cancelled'],decisions:[null,null,canceled]}
 ];
 for(const act of actuals){
  click(steps,'reset',initial,['未確定'],'start');
  for(const [key,value] of act.edits){
   const expect=key==='rule'?{rule:value}:key==='quorum'?{quorum:Number(value)}:{plan:{[key.at(-1).toUpperCase()]:value}};
   set(steps,key,value,{phase:'idle',...expect},['未確定']);
  }
  click(steps,'start',started,['未確定'],'step');
  const order=['B','A','C'];
  const branches={A:'running',B:'running',C:'running'};
  const history=[];
  for(const [i,branch] of order.entries()){
   const status=act.answers[i],decision=act.decisions[i];
   branches[branch]=status;history.push({branch,status});
   click(steps,'step',{phase:i===2?'complete':'running',rule:act.rule,branches:{...branches},history:[...history],decision},
      [decision?`確定：${decision.at}件目 ${decision.branch}`:'未確定'],i===2?'reset':undefined);
  }
 }
 return steps;
}
function makeScope(){
 const steps=[];
 const initialVars={workflow:{route:'総合受付'},'branch-a':{route:'北展示室'},'branch-b':{},'step-a1':{route:'資料棚'},'step-a2':{},'step-b1':{}};
 const init={step:'a1',inputs:{name:'route',value:'',lookup:'nearest','explicit-scope':'workflow'},variables:initialVars,history:[],result:null};
 const history=[];
 const expect=(step,action,status,data,visible,focus)=>{
  const result={status,...data};
  history.push({seq:history.length+1,action,step,...result});
  return {step,history:structuredClone(history),result};
 };
 click(steps,'resolve',expect('a1','resolve','found',{source:'step-a1',value:'資料棚'}),['資料棚']);
 set(steps,'lookup','nearest',{result:{status:'found',source:'step-a1',value:'資料棚'},history:structuredClone(history)},['資料棚']);
 set(steps,'lookup','workflow',{result:null,history:structuredClone(history)},['未評価']);
 click(steps,'resolve',expect('a1','resolve','found',{source:'workflow',value:'総合受付'}),['総合受付']);
 set(steps,'lookup','branch-b',{result:null},['未評価']);
 click(steps,'resolve',expect('a1','resolve','out-of-scope',{target:'branch-b'}),['範囲外']);
 set(steps,'lookup','branch-a',{result:null},['未評価']);
 set(steps,'name','none',{result:null,history:structuredClone(history)},['未評価'],'fill');
 click(steps,'resolve',expect('a1','resolve','missing',{target:'branch-a'}),['明示先に不存在']);
 set(steps,'name','route',{result:null},['未評価'],'fill');
 set(steps,'lookup','nearest',{result:null},['未評価']);
 click(steps,'step-a2',expect('a2','move','moved',{from:'a1'}),['移動']);
 click(steps,'resolve',expect('a2','resolve','found',{source:'branch-a',value:'北展示室'}),['北展示室']);
 set(steps,'explicit-scope','branch-b',{result:null},['未評価']);
 set(steps,'value','南を上書きしない',{result:null},['未評価'],'fill');
 click(steps,'save',{...expect('a2','save','out-of-scope',{target:'branch-b'}),variables:initialVars},['範囲外']);
 set(steps,'explicit-scope','step-a2',{result:null},['未評価']);
 set(steps,'name','9invalid',{result:null},['未評価'],'fill');
 click(steps,'save',{...expect('a2','save','invalid',{}),variables:initialVars},['拒否']);
 set(steps,'name','route',{result:null},['未評価'],'fill');
 set(steps,'value','予約台',{result:null},['未評価'],'fill');
 const updated={...initialVars,'step-a2':{route:'予約台'}};
 click(steps,'save',{...expect('a2','save','saved',{source:'step-a2',value:'予約台'}),variables:updated},['予約台']);
 click(steps,'resolve',expect('a2','resolve','found',{source:'step-a2',value:'予約台'}),['予約台']);
 click(steps,'step-b1',expect('b1','move','moved',{from:'a2'}),['移動']);
 click(steps,'resolve',{...expect('b1','resolve','found',{source:'workflow',value:'総合受付'}),variables:updated},['総合受付']);
 click(steps,'reset',init,['未評価'],'name');
 return steps;
}
function plan(id){return (id===163?makeMapping:id===164?makeJoin:id===165?makeScope:null)();}
function project(actual,expect){
 if(Array.isArray(expect)){
  a.ok(Array.isArray(actual),'state mismatch: array missing');
  a.equal(actual.length,expect.length,'state mismatch: array length');
  return actual.map((x,i)=>project(x,expect[i]));
 }
 if(expect!==null&&typeof expect==='object'){
  a.ok(actual&&typeof actual==='object','state mismatch: missing object');
  return Object.fromEntries(Object.keys(expect).map(k=>[k,project(actual[k],expect[k])]));
 }
 return actual;
}
function checkRecord(id,record,op){
 a.deepEqual(record.operation,op,'operation/expected mismatch '+id);
 a.deepEqual(project(record.state,op.expect),op.expect,'state mismatch '+id+'/'+op.key);
 if(id===165&&Object.hasOwn(op.expect,'variables'))a.deepEqual(record.state.variables,op.expect.variables,'state mismatch: entire variable inventory');
 a.ok(typeof record.status==='string'&&record.status.length>0,'visible status missing '+id);
 for(const fragment of op.visible)a.ok(record.status.includes(fragment),'visible condition missing: '+id+'/'+fragment+' got '+record.status);
 if(op.focus)a.equal(record.focus,op.focus,'native focus destination '+id+'/'+op.key);
 a.equal(record.control[0],({enter:'BUTTON',space:'BUTTON',click:'BUTTON',select:'SELECT',fill:'INPUT'})[op.action]);
 a.equal(record.fits,true,'exhibit content escaped '+id);
 a.ok(record.hostWidth>0&&record.pageWidth>0&&record.hostScroll<=record.hostWidth+1&&record.pageScroll<=record.pageWidth+1,'overflow geometry '+id);
 if(id===163&&Object.hasOwn(op.expect,'result')){
  const output=op.expect.result?.output;
  if(!output)a.deepEqual(record.outputs,[],'stale output');
  else{
   a.deepEqual(Object.keys(record.state.result.output).sort(),Object.keys(output).sort(),'real output keys');
   a.deepEqual(record.outputs.map(r=>r[0]).sort(),Object.keys(output).sort(),'rendered output keys');
   for(const [key,text] of record.outputs)a.ok(text.includes(JSON.stringify(output[key])),'rendered value mismatch '+key);
  }
 }
 if((id===164||id===165)&&Object.hasOwn(op.expect,'history')){
  a.equal(record.renderedHistory.length,op.expect.history.length,'rendered operation-history count');
  if(id===164)for(const [i,h] of op.expect.history.entries()){
   a.match(record.renderedHistory[i],new RegExp('^'+h.branch+' '));a.ok(record.renderedHistory[i].includes(h.status[0].toUpperCase()+h.status.slice(1)));
  }
  if(id===165)for(const [i,h] of op.expect.history.entries())a.ok(record.renderedHistory[i].includes(h.step.toUpperCase()),'scope history step '+i);
 }
}
function checkCondition(row,c){
 for(const k of Object.keys(c))a.equal(row[k],c[k]);
 a.equal(row.themeObserved,c.theme);a.equal(row.reduced,c.zoom===2);a.deepEqual(row.viewport,[c.width,900]);
 a.equal(typeof row.browserVersion,'string');a.ok(row.browserVersion);
 a.deepEqual(row.errors,[]);a.deepEqual(row.externalRequests,[]);
 a.deepEqual(Object.keys(row.steps),ids.map(String));
 for(const id of ids){
  a.deepEqual(row.search[id],{id,count:1});
  a.deepEqual(row.navigation[id],{opened:true,closed:true});
  a.deepEqual(row.keyboard[id],{next:following[id],returnFocus:true});
  if(c.zoom===2)a.deepEqual(row.touch[id],{emulated:true,focus:origin[id]});
  const {before,after}=row.font[id];a.ok(Object.keys(before).length>=4);a.deepEqual(Object.keys(before),Object.keys(after));
  for(const [tag,size] of Object.entries(before))a.ok(size>0&&Math.abs(after[tag]-size*c.zoom)<.05,'font ratio '+id+'/'+tag);
  const {from,to}=row.scroll[id];a.ok(to.bottom>0&&to.top<to.viewport,'scroll target');
  if(from.bottom<=0||from.top>=from.viewport)a.notEqual(from.y,to.y);
  const expected=plan(id);a.equal(row.steps[id].length,expected.length,'operation count '+id);
  for(const [i,step] of row.steps[id].entries())checkRecord(id,step,expected[i]);
 }
 if(c.zoom!==2)a.deepEqual(row.touch,{});
}
module.exports={ids,origin,plan,checkRecord,checkCondition};
