'use strict';
// Independent specification oracle. No import of product, product fixtures, or reducer.
const clone=x=>structuredClone(x),own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const keys=(x,ks)=>record(x)&&Object.keys(x).length===ks.length&&ks.every(k=>own(x,k));
const dense=x=>Array.isArray(x)&&Array.from({length:x.length},(_,i)=>own(x,i)).every(Boolean);
const text=x=>typeof x==='string'&&x.trim().length>0;
const integer=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const NORMAL={157:{question:'q1',evidence:[{id:'e1',claim:'location',stance:'support',strength:2},{id:'e2',claim:'date',stance:'support',strength:2}],policy:{threshold:2,onMissing:'request'}},158:{destination:'public',fields:[{id:'title',value:'架空展示',classification:'public'},{id:'contact',value:'fictional@example.invalid',classification:'private'},{id:'secret',value:'FICTIONAL-SECRET-ONLY',classification:'secret'}],policy:'mask'},159:{original:{id:'r1',score:3,label:'架空評価'},corrections:[{id:'c1',field:'score',value:7,reason:'架空資料の転記訂正'}],threshold:5}};
function uncertaintyExpected(x){
 if(!keys(x,['question','evidence','policy'])||x.question!=='q1'||!dense(x.evidence)||!keys(x.policy,['threshold','onMissing'])||!integer(x.policy.threshold,1,3)||!['request','abstain'].includes(x.policy.onMissing))return {status:'INVALID'};
 const seen=new Set();for(const e of x.evidence){if(!keys(e,['id','claim','stance','strength'])||!text(e.id)||seen.has(e.id)||!['location','date'].includes(e.claim)||!['support','contradict'].includes(e.stance)||!integer(e.strength,1,3))return {status:'INVALID'};seen.add(e.id);}
 const missing=['location','date'].filter(c=>!x.evidence.some(e=>e.claim===c&&e.stance==='support'&&e.strength>=x.policy.threshold));
 const conflict=x.evidence.some(e=>e.stance==='contradict');
 return {status:conflict?'ABSTAIN':missing.length?x.policy.onMissing==='request'?'REQUEST_INFO':'ABSTAIN':'ANSWERABLE',reason:conflict?'contradictory-evidence':missing.length?x.policy.onMissing==='request'?'missing-required-coverage':'insufficient-evidence':'sufficient-evidence',missing};
}
function disclosureExpected(x){
 const bad=()=>({status:'INVALID',payload:{}});
 if(!keys(x,['destination','fields','policy'])||!['public','internal'].includes(x.destination)||!dense(x.fields)||!['mask','reject'].includes(x.policy))return bad();
 const classes={title:'public',contact:'private',secret:'secret'},ids=[];
 for(const f of x.fields){if(!keys(f,['id','value','classification'])||!own(classes,f.id)||classes[f.id]!==f.classification||!text(f.value)||ids.includes(f.id))return bad();ids.push(f.id);}
 if(!x.fields.length)return {status:'EMPTY',reason:'empty-fields',payload:{}};
 const restricted=x.fields.some(f=>f.classification==='secret'||f.classification==='private'&&x.destination==='public');
 if(restricted&&x.policy==='reject')return {status:'BLOCKED',reason:'disclosure-policy-rejected',payload:{}};
 const payload={};for(const f of x.fields){if(f.classification==='secret')continue;payload[f.id]=f.classification==='private'&&x.destination==='public'?'[MASKED]':f.value;}
 return {status:restricted?'REDACTED':'READY',reason:restricted?'fields-redacted':'permitted-fields-only',payload};
}
function correctionExpected(x){
 if(!keys(x,['original','corrections','threshold'])||!keys(x.original,['id','score','label'])||x.original.id!=='r1'||x.original.label!=='架空評価'||!integer(x.original.score,0,10)||!integer(x.threshold,0,10)||!dense(x.corrections))return {status:'INVALID'};
 const seen=new Set();for(const c of x.corrections){if(!keys(c,['id','field','value','reason'])||!text(c.id)||seen.has(c.id)||c.field!=='score'||!integer(c.value,0,10)||!text(c.reason))return {status:'INVALID'};seen.add(c.id);}
 if(x.corrections.length>1)return {status:'CONFLICT',reason:'conflicting-corrections',applied:[]};
 const score=x.corrections.length?x.corrections[0].value:x.original.score;
 return {status:score===x.original.score?'UNCHANGED':'REEVALUATED',reason:!x.corrections.length?'no-corrections':score===x.original.score?'equivalent-correction':'correction-applied',before:{score:x.original.score,decision:x.original.score>=x.threshold?'ACCEPT':'REVIEW'},after:{score,decision:score>=x.threshold?'ACCEPT':'REVIEW'},applied:x.corrections.map(c=>c.id)};
}
function expected(id,input){return ({157:uncertaintyExpected,158:disclosureExpected,159:correctionExpected})[id](input);}
function project(id,result){if(!result||typeof result!=='object')throw Error('missing result');const x={status:result.status};if(result.status==='INVALID'){if(id===158)x.payload=result.payload;return x;}x.reason=result.reasons?.[0];if(id===157)x.missing=result.missing;if(id===158)x.payload=result.payload;if(id===159){x.applied=result.applied;if(result.status!=='CONFLICT'){x.before=result.before;x.after=result.after;}}return x;}
const MUTATIONS={157:{'empty-evidence':x=>x.evidence=[],'missing-claim':x=>x.evidence.pop(),'threshold-boundary':x=>x.policy.threshold=3,'weak-many':x=>x.evidence=[{id:'a',claim:'location',stance:'support',strength:1},{id:'b',claim:'location',stance:'support',strength:1},{id:'c',claim:'date',stance:'support',strength:1}],'contradiction':x=>x.evidence.push({id:'c',claim:'date',stance:'contradict',strength:1}),'abstain-policy':x=>{x.evidence=[];x.policy.onMissing='abstain';},'duplicate-id':x=>x.evidence[1].id='e1','missing-field':x=>delete x.evidence[0].strength,'sparse-array':x=>delete x.evidence[0],'unknown-claim':x=>x.evidence[0].claim='owner','unknown-stance':x=>x.evidence[0].stance='neutral','nan':x=>x.evidence[0].strength=NaN,'infinity':x=>x.policy.threshold=Infinity,'fraction':x=>x.evidence[0].strength=1.5,'unknown-policy':x=>x.policy.onMissing='guess'},158:{'reject':x=>x.policy='reject','internal':x=>x.destination='internal','all-public':x=>x.fields=x.fields.slice(0,1),'empty':x=>x.fields=[],'secret-only':x=>x.fields=x.fields.slice(2),'private-only':x=>x.fields=x.fields.slice(1,2),'unknown-destination':x=>x.destination='internet','unknown-policy':x=>x.policy='send','duplicate-id':x=>x.fields.push(clone(x.fields[0])),'classification-spoof':x=>x.fields[2].classification='public','missing-field':x=>delete x.fields[0].value,'sparse-array':x=>delete x.fields[0],'non-string':x=>x.fields[0].value=42,'unknown-field':x=>x.fields[0].id='password'},159:{'empty':x=>x.corrections=[],'equivalent':x=>x.corrections[0].value=3,'downward':x=>x.corrections[0].value=1,'threshold-boundary':x=>x.corrections[0].value=5,'conflict':x=>x.corrections.push({id:'c2',field:'score',value:8,reason:'別の架空訂正'}),'duplicate-id':x=>x.corrections.push(clone(x.corrections[0])),'empty-reason':x=>x.corrections[0].reason=' ','unknown-field':x=>x.corrections[0].field='label','unknown-original':x=>x.original.id='r2','missing-field':x=>delete x.original.score,'sparse-array':x=>delete x.corrections[0],'nan':x=>x.corrections[0].value=NaN,'infinity':x=>x.threshold=Infinity,'out-of-range':x=>x.corrections[0].value=11,'fraction':x=>x.corrections[0].value=2.5}};
const scenarios=Object.fromEntries(Object.entries(MUTATIONS).map(([id,ms])=>[id,Object.keys(ms)]));
function fixture(id,name='normal',input=NORMAL[id]){const x=clone(input);if(name!=='normal'){if(!MUTATIONS[id][name])throw Error('unknown scenario');MUTATIONS[id][name](x);}return x;}
module.exports={NORMAL,expected,project,uncertaintyExpected,disclosureExpected,correctionExpected,fixture,scenarios,clone};
