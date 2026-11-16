'use strict';
const test=require('node:test'),a=require('node:assert/strict');
const oracle=require('./wave10-contract.cjs'),product=require('./wave10.js');
const clone=x=>structuredClone(x);
const each=(name,fn)=>{for(const [label,implementation] of [['product',product],['oracle',oracle]])test(name+' / '+label,()=>fn(implementation,label));};
const budget=(impl,items,limit)=>impl.budget?impl.budget(items,limit):impl.budgetExpected(items,limit);
const tool=(impl,...args)=>impl.tool?impl.tool(...args):impl.toolExpected(...args);
const regression=(impl,cases)=>impl.regression?impl.regression(cases):impl.regressionExpected(cases);
const normalItems=()=>clone(oracle.ITEMS),normalCases=()=>clone(oracle.CASES);
const projection=(id,r)=>oracle.projectResult(id,r);
for(const [limit,status,included,used,remaining,shortfall] of [
 [16,'VALID',['c1','c2','c3'],15,1,0],[18,'VALID',['c1','c2','c3','c4'],18,0,0],
 [10,'VALID',['c1','c2'],10,0,0],[13,'VALID',['c1','c2','c4'],13,0,0],
 [0,'OVER_BUDGET',[],null,null,10],[9,'OVER_BUDGET',[],null,null,1],[100,'VALID',['c1','c2','c3','c4'],18,82,0]
])each('151 explicit capacity '+limit,impl=>{const r=budget(impl,normalItems(),limit);a.equal(r.status,status);a.deepEqual(r.included,included);a.equal(r.used,used);a.equal(r.remaining,remaining);a.equal(r.shortfall,shortfall);});
each('151 fixed tie ID order and permutation invariant',impl=>{const items=normalItems();items[2].priority=2;const r=budget(impl,items,15);a.deepEqual(r.included,['c1','c2','c3']);a.deepEqual(projection(151,budget(impl,items.reverse(),15)),projection(151,r));});
each('151 priority reversal changes decision deterministically',impl=>{const items=normalItems();items[3].priority=0;const first=budget(impl,items,16);a.deepEqual(first.included,['c1','c2','c4']);a.equal(first.used,13);for(let i=0;i<3;i++)a.deepEqual(budget(impl,items,16),first);});
for(const v of [-1,101,1.5,NaN,Infinity,'16','',null,true,undefined])each('151 reject budget '+String(v),impl=>{const r=budget(impl,normalItems(),v);a.equal(r.status,'INVALID');a.deepEqual(r.included,[]);a.equal(r.used,null);a.equal(r.remaining,null);});
for(const v of [-1,10,0.5,NaN,Infinity,'1',null,true,undefined])each('151 reject priority '+String(v),impl=>{const items=normalItems();items[2].priority=v;a.equal(budget(impl,items,16).status,'INVALID');});
for(const index of [0,1,2,3])each('151 rejects sparse index '+index,impl=>{const items=normalItems();delete items[index];a.equal(budget(impl,items,16).status,'INVALID');const inherited=normalItems();const proto=Object.create(Array.prototype);proto[index]=inherited[index];delete inherited[index];Object.setPrototypeOf(inherited,proto);a.equal(budget(impl,inherited,16).status,'INVALID');});
for(const field of ['id','name','size','required','priority'])each('151 missing own '+field,impl=>{const items=normalItems();const item=items[0];const proto={[field]:item[field]};delete item[field];Object.setPrototypeOf(item,proto);a.equal(budget(impl,items,16).status,'INVALID');});
for(const [label,change] of [['duplicate',xs=>xs[3]=clone(xs[2])],['missing',xs=>xs.pop()],['fixed name',xs=>xs[0].name='changed'],['fixed size',xs=>xs[0].size=0],['fixed mandatory',xs=>xs[0].required=false],['extra field',xs=>xs[0].other=1],['array scalar',xs=>xs[1]=null]])each('151 reject '+label,impl=>{const xs=normalItems();change(xs);a.equal(budget(impl,xs,16).status,'INVALID');});
for(const [name,args,value] of [['lookup',{key:'alpha'},'架空A'],['lookup',{key:'beta'},'架空B'],['sum',{a:0,b:0},0],['sum',{a:100,b:100},200]])each('152 valid '+name+JSON.stringify(args),impl=>{const r=tool(impl,name,args,'normal','e2-c3');a.equal(r.status,'MOCK_COMPLETED');a.equal(r.responseId,'e2-c3');a.deepEqual(r.payload,{value});a.deepEqual(r.history,['IDLE','VALIDATING','AUTHORIZED','MOCK_COMPLETED']);});
for(const [scenario,status,reason] of [['unknown','INVALID','unknown-tool'],['missing','INVALID','invalid-arguments'],['type','INVALID','invalid-arguments'],['unauthorized','DENIED','operation-not-permitted'],['wrong-id','RESPONSE_REJECTED','response-id-mismatch'],['stale','RESPONSE_REJECTED','stale-response'],['duplicate','RESPONSE_REJECTED','duplicate-response'],['timeout','TIMEOUT','mock-timeout']])each('152 semantic '+scenario,impl=>{const r=tool(impl,'lookup',{key:'alpha'},scenario);a.equal(r.status,status);a.equal(r.reason,reason);a.equal(r.payload,null);a.notEqual(r.status,'MOCK_COMPLETED');});
for(const [name,args] of [['unknown',{}],['lookup',{}],['lookup',{key:1}],['lookup',{key:'gamma'}],['lookup',{key:'alpha',extra:true}],['sum',{a:1}],['sum',{a:-1,b:0}],['sum',{a:101,b:0}],['sum',{a:0.5,b:1}],['sum',{a:NaN,b:1}],['sum',{a:Infinity,b:1}],['sum',{a:'1',b:1}],['sum',{a:true,b:1}],['sum',{a:1,b:null}],['lookup',[]],['lookup',null]])each('152 rejects '+name+' '+JSON.stringify(args),impl=>{a.equal(tool(impl,name,args).status,'INVALID');a.equal(tool(impl,name,args).payload,null);});
each('152 inherited args are not own supplied values',impl=>{a.equal(tool(impl,'lookup',Object.create({key:'alpha'})).status,'INVALID');a.equal(tool(impl,'sum',Object.assign(Object.create({a:1}),{b:2})).status,'INVALID');});
each('152 direct denied and unknown scenario',impl=>{a.equal(tool(impl,'delete',{key:'alpha'}).status,'DENIED');a.equal(tool(impl,'lookup',{key:'alpha'},'fake').status,'INVALID');});
for(const id of ['',null,1,'old','e1-cNaN'])each('152 rejects call ID '+String(id),impl=>a.equal(tool(impl,'lookup',{key:'alpha'},'normal',id).status,'INVALID'));
each('153 fixed four comparisons individually expected',impl=>{const r=regression(impl,normalCases());a.equal(r.status,'VALID');a.deepEqual(r.rows.map(x=>[x.old.status,x.new.status,x.change]),[['FAIL','PASS','IMPROVED'],['PASS','FAIL','REGRESSED'],['PASS','PASS','UNCHANGED'],['FAIL','FAIL','UNCHANGED']]);a.ok(r.rows.every(x=>x.old.checks.length===6&&x.new.checks.length===6));});
for(const [label,change,want] of [['required',x=>delete x.new.title,'FAIL'],['format',x=>x.new.title=7,'FAIL'],['forbidden',x=>x.new.secret='bad','FAIL'],['exact',x=>x.new.kind='other','FAIL'],['missing',x=>delete x.new,'UNKNOWN'],['null',x=>x.new=null,'UNKNOWN'],['array',x=>x.new=[],'FAIL'],['scalar',x=>x.new='text','FAIL']])each('153 output '+label,impl=>{const cases=normalCases();change(cases[2]);const r=regression(impl,cases);a.equal(r.status,'VALID');a.equal(r.rows[2].new.status,want);a.equal(r.rows[2].change,want==='UNKNOWN'?'UNDETERMINED':'REGRESSED');});
for(const field of ['required','forbidden','types','exact'])each('153 rejects expectation mutation '+field,impl=>{const cases=normalCases();delete cases[0].expectation[field];const r=regression(impl,cases);a.equal(r.status,'INVALID');a.deepEqual(r.rows,[]);});
for(const index of [0,1,2,3])each('153 missing/sparse/inherited case '+index,impl=>{for(const kind of ['hole','inherited']){const cases=normalCases();if(kind==='inherited'){const proto=Object.create(Array.prototype);proto[index]=cases[index];Object.setPrototypeOf(cases,proto);}delete cases[index];const r=regression(impl,cases);a.equal(r.status,'INVALID');a.deepEqual(r.rows,[]);}});
each('153 duplicate and missing fixed cases are invalid',impl=>{const xs=normalCases();xs[3]=clone(xs[0]);a.equal(regression(impl,xs).status,'INVALID');a.equal(regression(impl,normalCases().slice(1)).status,'INVALID');});
each('153 inherited output fields cannot satisfy conditions',impl=>{const xs=normalCases();xs[2].new=Object.create({title:'要約',kind:'summary'});a.equal(regression(impl,xs).rows[2].new.status,'FAIL');});
test('oracle has no product dependency and fixed decisions are not product-generated',()=>{const fs=require('node:fs');const source=fs.readFileSync(require.resolve('./wave10-contract.cjs'),'utf8');a.ok(!/require\(['"]\.\/wave10\.js/.test(source));a.deepEqual(oracle.budgetExpected(normalItems(),16).included,['c1','c2','c3']);a.deepEqual(oracle.regressionExpected(normalCases()).rows.map(r=>r.change),['IMPROVED','REGRESSED','UNCHANGED','UNCHANGED']);});
test('normal full semantic result independently matches',()=>{oracle.validateResult(151,{items:normalItems(),limit:16},product.budget(normalItems(),16));oracle.validateResult(152,{name:'lookup',args:{key:'alpha'},scenario:'normal',callId:'e0-c1'},product.tool('lookup',{key:'alpha'}));oracle.validateResult(153,{cases:normalCases()},product.regression(normalCases()));});
for(const id of [151,152,153])test('state '+id+' run edit same reset invalidation',()=>{
 let s=product.initial(id);oracle.validateState(s);a.equal(s.result,null);
 s=product.reduce(s,{type:'run'});oracle.validateState(s);
 a.deepEqual(product.reduce(s,{type:'scenario',name:'normal'}),s);
 const event=id===151?{type:'budget',value:15}:id===152?{type:'args',text:'{"key":"beta"}'}:{type:'scenario',name:'required'};
 let changed=product.reduce(s,event);a.equal(changed.result,null);a.equal(changed.revision,1);a.deepEqual(product.reduce(changed,event),changed);
 changed=product.reduce(changed,{type:'run'});oracle.validateState(changed);
 const reset=product.reduce(changed,{type:'reset'});a.equal(reset.result,null);a.equal(reset.revision,0);a.equal(reset.scenario,'normal');
 if(id===152){a.equal(reset.epoch,1);a.equal(reset.counter,0);const next=product.reduce(reset,{type:'run'});a.equal(next.result.callId,'e1-c1');a.notEqual(next.result.callId,s.result.callId);oracle.validateState(next);}else a.deepEqual(reset,product.initial(id));
 a.throws(()=>product.reduce(s,{type:'bad-event'}));
});
for(const [id,scenarios] of [[151,['normal','budget','priority','duplicate','missing','fixed','structure']],[152,['normal','unknown','missing','type','unauthorized','wrong-id','stale','duplicate','timeout']],[153,['normal','required','format','forbidden','value','expectation','missing-output']]])for(const scenario of scenarios)test(id+' independent scenario '+scenario,()=>{let s=product.initial(id);s=product.reduce(s,{type:'scenario',name:scenario});s=product.reduce(s,{type:'run'});oracle.validateState(s);});
test('152 old payload removed after invalid arguments and timeout',()=>{let s=product.reduce(product.initial(152),{type:'run'});a.deepEqual(s.result.payload,{value:'架空A'});s=product.reduce(s,{type:'args',text:'{}'});a.equal(s.result,null);s=product.reduce(s,{type:'run'});a.equal(s.result.payload,null);a.equal(s.result.status,'INVALID');s=product.reduce(s,{type:'reset'});s=product.reduce(s,{type:'scenario',name:'timeout'});s=product.reduce(s,{type:'run'});a.equal(s.result.payload,null);a.equal(s.result.status,'TIMEOUT');});
test('151 priority input change invalidates result, same input is stable',()=>{const s=product.reduce(product.initial(151),{type:'run'});a.deepEqual(product.reduce(s,{type:'priority',index:2,value:1}),s);const n=product.reduce(s,{type:'priority',index:2,value:0});a.equal(n.result,null);a.equal(n.revision,1);});
test('152 malformed JSON rejects without retaining successful mock result',()=>{let s=product.reduce(product.initial(152),{type:'run'});s=product.reduce(s,{type:'args',text:'{'});s=product.reduce(s,{type:'run'});a.equal(s.result.status,'INVALID');a.equal(s.result.payload,null);oracle.validateState(s);});
for(const bad of [undefined,null,1,'','e0-c0','bad'])test('152 envelope rejects invalid current call ID '+String(bad),()=>{const r=product.matchResponses(bad,[{id:bad,payload:{value:'架空A'}}]);a.notEqual(r.reason,'matched-response');a.equal(r.payload,null);});
for(const [name,responses,reason] of [
 ['normal',[{id:'e1-c2',payload:{value:3}}],'matched-response'],
 ['previous counter',[{id:'e1-c1',payload:{value:3}}],'stale-response'],
 ['previous epoch',[{id:'e0-c99',payload:{value:3}}],'stale-response'],
 ['future epoch',[{id:'e2-c1',payload:{value:3}}],'response-id-mismatch'],
 ['wrong identifier',[{id:'unknown',payload:{value:3}}],'response-id-mismatch'],
 ['timeout',[],'mock-timeout'],
 ['duplicate',[{id:'e1-c2',payload:{value:3}},{id:'e1-c2',payload:{value:3}}],'duplicate-response'],
 ['null envelope',[null],'invalid-response-structure'],
 ['extra property',[{id:'e1-c2',payload:{value:3},extra:true}],'invalid-response-structure'],
 ['missing payload',[{id:'e1-c2'}],'invalid-response-structure'],
 ['nonarray',null,'invalid-response-structure']
])test('152 actual envelope '+name,()=>{const r=product.matchResponses('e1-c2',responses);a.equal(r.reason,reason);a.deepEqual(r.payload,reason==='matched-response'?{value:3}:null);});
test('152 actual envelope sparse and inherited index rejected',()=>{const xs=Array(1);a.equal(product.matchResponses('e1-c2',xs).reason,'invalid-response-structure');const proto=Object.create(Array.prototype);proto[0]={id:'e1-c2',payload:{value:3}};Object.setPrototypeOf(xs,proto);a.equal(product.matchResponses('e1-c2',xs).reason,'invalid-response-structure');});
for(const payload of [null,[],{}, {value:null},{value:NaN},{value:Infinity},{value:-1},{value:201},{value:'untrusted'},{value:3,extra:true}])test('152 rejects malformed response payload '+JSON.stringify(payload),()=>{const r=product.matchResponses('e1-c2',[{id:'e1-c2',payload}]);a.equal(r.reason,'invalid-response-payload');a.equal(r.payload,null);});
for(const key of ['label','extra'])test('IR01 fixed-case '+key+' altered is invalid in independent oracle',()=>{const x=normalCases();if(key==='label')x[0].label='tampered';else x[0].extra=true;a.equal(product.regression(x).status,'INVALID');a.equal(oracle.regressionExpected(x).status,'INVALID');});
test('IR02 legitimate case order yields fixed canonical rows',()=>{const x=normalCases().reverse();a.deepEqual(projection(153,product.regression(x)),oracle.regressionExpected(x));a.deepEqual(oracle.regressionExpected(x).rows.map(r=>r.id),['r1','r2','r3','r4']);});
