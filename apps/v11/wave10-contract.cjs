'use strict';
// Independent specification oracle. No product implementation import.
const assert = require('node:assert/strict');
const own = (value,key) => Object.prototype.hasOwnProperty.call(value,key);
const plain = value => value !== null && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const dense = value => Array.isArray(value) && Array.from({length:value.length},(_,i)=>i).every(i=>own(value,i));
const copy = value => JSON.parse(JSON.stringify(value));
const ITEMS = [
 {id:'c1',name:'目的',size:6,priority:0,required:true},
 {id:'c2',name:'必須制約',size:4,priority:0,required:true},
 {id:'c3',name:'参考例',size:5,priority:1,required:false},
 {id:'c4',name:'補足',size:3,priority:2,required:false}
];
const EXPECTATION = {required:['title','kind'],forbidden:['secret'],types:{title:'string',kind:'string'},exact:{kind:'summary'}};
const valid = {title:'要約',kind:'summary'};
const CASES = [
 {id:'r1',label:'改善例',expectation:copy(EXPECTATION),old:{kind:'summary'},new:copy(valid)},
 {id:'r2',label:'退行例',expectation:copy(EXPECTATION),old:copy(valid),new:{...valid,secret:'禁止'}},
 {id:'r3',label:'両版成功',expectation:copy(EXPECTATION),old:copy(valid),new:copy(valid)},
 {id:'r4',label:'両版失敗',expectation:copy(EXPECTATION),old:{title:'要約',kind:'other'},new:{title:'要約',kind:'other'}}
];
function deepFreeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(deepFreeze);Object.freeze(x);}return x;}
[ITEMS,CASES,EXPECTATION].forEach(deepFreeze);
function budgetExpected(items,limit){
 const empty={included:[],excluded:[],used:null,remaining:null,shortfall:0};
 if(!Number.isSafeInteger(limit)||limit<0||limit>100||!dense(items)||items.length!==4)return {status:'INVALID',...empty};
 const ids = new Set();
 for(const item of items){
  if(!plain(item))return {status:'INVALID',...empty};
  const fixed=ITEMS.find(x=>x.id===item.id);
  if(!fixed||ids.has(item.id)||['id','name','size','priority','required'].some(k=>!own(item,k))||Object.keys(item).some(k=>!['id','name','size','priority','required'].includes(k))||['name','size','required'].some(k=>item[k]!==fixed[k])||!Number.isSafeInteger(item.priority)||item.priority<0||item.priority>9)return {status:'INVALID',...empty};
  ids.add(item.id);
 }
 if(limit<10)return {status:'OVER_BUDGET',...empty,shortfall:10-limit};
 const included=['c1','c2'],excluded=[];let used=10;
 // Fixed IDs are the independent tie-breaker. Never depends on incoming order.
 const candidates=items.filter(x=>x.id==='c3'||x.id==='c4').sort((x,y)=>x.priority-y.priority||(x.id<y.id?-1:1));
 for(const item of candidates){if(used+item.size<=limit){included.push(item.id);used+=item.size;}else excluded.push({id:item.id,reason:'capacity'});}
 return {status:'VALID',included,excluded,used,remaining:limit-used,shortfall:0};
}
function expectationValid(spec){
 if(!plain(spec)||Object.keys(spec).sort().join('|')!=='exact|forbidden|required|types')return false;
 if(!dense(spec.required)||!dense(spec.forbidden)||JSON.stringify(spec.required)!==JSON.stringify(EXPECTATION.required)||JSON.stringify(spec.forbidden)!==JSON.stringify(EXPECTATION.forbidden))return false;
 for(const key of ['types','exact']){if(!plain(spec[key])||Object.keys(spec[key]).sort().join('|')!==Object.keys(EXPECTATION[key]).sort().join('|'))return false;for(const k of Object.keys(EXPECTATION[key]))if(!own(spec[key],k)||spec[key][k]!==EXPECTATION[key][k])return false;}
 return true;
}
function outputExpected(output){
 if(output===null||output===undefined)return {status:'UNKNOWN',checks:[]};
 if(!plain(output))return {status:'FAIL',checks:[{condition:'structure',status:'FAIL'}]};
 const checks=[];
 for(const key of ['title','kind'])checks.push({condition:'required:'+key,status:own(output,key)?'PASS':'FAIL'});
 checks.push({condition:'forbidden:secret',status:own(output,'secret')?'FAIL':'PASS'});
 for(const key of ['title','kind'])checks.push({condition:'type:'+key,status:own(output,key)&&typeof output[key]==='string'?'PASS':'FAIL'});
 checks.push({condition:'exact:kind',status:own(output,'kind')&&output.kind==='summary'?'PASS':'FAIL'});
 return {status:checks.every(x=>x.status==='PASS')?'PASS':'FAIL',checks};
}
function regressionExpected(cases){
 if(!dense(cases)||cases.length!==4)return {status:'INVALID',rows:[]};
 const ids=new Set();
 for(const entry of cases){
  if(!plain(entry)||!own(entry,'id')||!['r1','r2','r3','r4'].includes(entry.id)||ids.has(entry.id)||!own(entry,'label')||entry.label!==CASES.find(x=>x.id===entry.id).label||Object.keys(entry).some(k=>!['id','label','expectation','old','new'].includes(k))||!own(entry,'expectation')||!expectationValid(entry.expectation))return {status:'INVALID',rows:[]};
  ids.add(entry.id);
 }
 // Fixed case IDs, not received array order, define the comparison presentation.
 const ordered=['r1','r2','r3','r4'].map(id=>cases.find(entry=>entry.id===id));
 const rows=ordered.map(entry=>{const old=outputExpected(entry.old),next=outputExpected(entry.new);let change='UNCHANGED';if(old.status==='UNKNOWN'||next.status==='UNKNOWN')change='UNDETERMINED';else if(old.status==='FAIL'&&next.status==='PASS')change='IMPROVED';else if(old.status==='PASS'&&next.status==='FAIL')change='REGRESSED';return {id:entry.id,old,new:next,change};});
 return {status:'VALID',rows};
}
function projectResult(id,r){
 assert.ok(r&&typeof r==='object','result object');
 if(id===151)return Object.fromEntries(['status','included','excluded','used','remaining','shortfall'].map(k=>[k,r[k]]));
 if(id===152)return Object.fromEntries(['status','stage','reason','callId','responseId','payload','history'].map(k=>[k,r[k]]));
 if(id===153)return {status:r.status,rows:r.rows.map(row=>({id:row.id,old:{status:row.old.status,checks:row.old.checks.map(x=>({condition:x.condition,status:x.status}))},new:{status:row.new.status,checks:row.new.checks.map(x=>({condition:x.condition,status:x.status}))},change:row.change}))};
 throw Error('unknown exhibit');
}
function expectedResult(id,input){if(id===151)return budgetExpected(input.items,input.limit);if(id===152)return toolExpected(input.name,input.args,input.scenario,input.callId);if(id===153)return regressionExpected(input.cases);throw Error('unknown exhibit');}
function validateResult(id,input,result){assert.deepEqual(projectResult(id,result),expectedResult(id,input),'independent full semantic result '+id);if(result.status==='INVALID'&&id!==152)assert.ok(Array.isArray(result.errors)&&result.errors.length>0,'invalid result has explanation');return true;}
function toolExpected(name,args,scenario='normal',callId='e0-c1'){
 const result={status:'INVALID',stage:'VALIDATING',reason:'',callId,responseId:null,payload:null,history:['IDLE','VALIDATING']};
 const refuse=reason=>({...result,reason});
 if(typeof callId!=='string'||!/^e\d+-c[1-9]\d*$/.test(callId))return refuse('invalid-call-id');
 if(scenario==='unknown')name='unknown';
 if(scenario==='missing')args={};
 if(scenario==='type')args=name==='sum'?{a:'1',b:2}:{key:1};
 if(scenario==='unauthorized'){name='delete';args={key:'alpha'};}
 if(!['lookup','sum','delete'].includes(name))return refuse('unknown-tool');
 const names=name==='sum'?['a','b']:['key'];
 if(!plain(args)||Object.keys(args).length!==names.length||names.some(k=>!own(args,k)))return refuse('invalid-arguments');
 if(name==='sum'?!names.every(k=>Number.isSafeInteger(args[k])&&args[k]>=0&&args[k]<=100):!['alpha','beta'].includes(args.key))return refuse('invalid-arguments');
 if(!['normal','unknown','missing','type','unauthorized','wrong-id','stale','duplicate','timeout'].includes(scenario))return refuse('unknown-scenario');
 if(name==='delete')return {...result,status:'DENIED',stage:'AUTHORIZATION',reason:'operation-not-permitted',history:[...result.history,'DENIED']};
 const history=[...result.history,'AUTHORIZED'];
 if(scenario==='timeout')return {...result,status:'TIMEOUT',stage:'RESPONSE',reason:'mock-timeout',history:[...history,'TIMEOUT']};
 if(['wrong-id','stale','duplicate'].includes(scenario))return {...result,status:'RESPONSE_REJECTED',stage:'RESPONSE',reason:{'wrong-id':'response-id-mismatch',stale:'stale-response',duplicate:'duplicate-response'}[scenario],responseId:scenario==='wrong-id'?callId+'-wrong':scenario==='stale'?callId.replace(/-c(\d+)$/,(_,n)=>'-c'+(Number(n)-1)):callId,history:[...history,'RESPONSE_REJECTED']};
 return {...result,status:'MOCK_COMPLETED',stage:'RESPONSE',reason:'matched-response',responseId:callId,payload:{value:name==='sum'?args.a+args.b:args.key==='alpha'?'架空A':'架空B'},history:[...history,'MOCK_COMPLETED']};
}
function budgetFixture(scenario='normal',items=ITEMS,limit=16){
 const fixture={items:copy(items),limit};
 if(scenario==='budget')fixture.limit=-1;
 else if(scenario==='priority')fixture.items[2].priority=-1;
 else if(scenario==='duplicate')fixture.items[3]=copy(fixture.items[2]);
 else if(scenario==='missing')fixture.items.pop();
 else if(scenario==='fixed')fixture.items[0].size=5;
 else if(scenario==='structure')delete fixture.items[1];
 else assert.equal(scenario,'normal','known 151 scenario');
 return fixture;
}
function regressionFixture(scenario='normal'){
 const cases=copy(CASES);
 if(scenario==='required')delete cases[0].new.title;
 else if(scenario==='format')cases[0].new.title=7;
 else if(scenario==='forbidden')cases[0].new.secret='禁止';
 else if(scenario==='value')cases[0].new.kind='other';
 else if(scenario==='expectation')cases[0].expectation.required=[];
 else if(scenario==='missing-output')delete cases[0].new;
 else assert.equal(scenario,'normal','known 153 scenario');
 return cases;
}
function stateInput(s){
 if(s.id===151)return budgetFixture(s.scenario,s.items,s.budget);
 if(s.id===152){let args;try{args=JSON.parse(s.args);}catch{args=null;}return {name:s.tool,args,scenario:s.scenario,callId:`e${s.epoch}-c${s.counter}`};}
 if(s.id===153)return {cases:regressionFixture(s.scenario)};
 throw Error('unknown state ID');
}
function validateState(s){
 assert.ok(s&&[151,152,153].includes(s.id),'known state ID');assert.ok(Number.isSafeInteger(s.revision)&&s.revision>=0,'revision');
 if(s.id===151){assert.ok(dense(s.items)&&s.items.length===4,'state item set');for(let i=0;i<4;i++)for(const k of ['id','name','size','required'])assert.equal(s.items[i][k],ITEMS[i][k],'state fixed '+k);}
 if(s.id===152){assert.ok(Number.isSafeInteger(s.epoch)&&s.epoch>=0,'epoch');assert.ok(Number.isSafeInteger(s.counter)&&s.counter>=0,'counter');assert.ok(['lookup','sum','delete'].includes(s.tool),'state tool');assert.equal(typeof s.args,'string','args text');}
 const input=stateInput(s);if(s.result!==null)validateResult(s.id,input,s.result);
 return true;
}
module.exports={ITEMS,CASES,EXPECTATION,budgetExpected,toolExpected,regressionExpected,outputExpected,expectationValid,projectResult,expectedResult,validateResult,budgetFixture,regressionFixture,stateInput,validateState};
