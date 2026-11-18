'use strict';
const test=require('node:test'),a=require('node:assert/strict');
const C=require('./wave11-contract.cjs'),P=require('./wave11.js');
const clone=x=>structuredClone(x);
const normalRanking=()=>[clone(C.DOCS),'城',2,1,2];
const normalMemory=()=>[clone(C.MEMORIES),'c1','p1',1000];
const rankCases=[
 ['empty query',x=>x[1]=' ','EMPTY_QUERY'],['unknown query',x=>x[1]='海','NO_MATCH'],['all zero',x=>{x[2]=0;x[3]=0;},'ZERO_WEIGHTS'],
 ['negative weight',x=>x[2]=-1,'INVALID'],['fraction weight',x=>x[2]=1.5,'INVALID'],['NaN weight',x=>x[3]=NaN,'INVALID'],['zero count',x=>x[4]=0,'INVALID'],['count above boundary',x=>x[4]=5,'INVALID'],
 ['duplicate ID',x=>x[0][3]=clone(x[0][0]),'INVALID'],['missing field',x=>delete x[0][0].relevance,'INVALID'],['sparse array',x=>delete x[0][1],'INVALID'],['non-array',x=>x[0]={},'INVALID'],
 ['tie reordered input',x=>x[0].reverse(),'VALID'],['map query',x=>x[1]='地図','VALID'],['upper weight boundary',x=>x[2]=5,'VALID'],['max count boundary',x=>x[4]=4,'VALID']
];
const memoryCases=[
 ['conversation outside',x=>x[1]='c2','VALID'],['project outside',x=>x[2]='p2','VALID'],['expiry exact',x=>x[0][2].expiresAt=1000,'VALID'],['expiry before',x=>x[0][2].expiresAt=1001,'VALID'],
 ['invalid now',x=>x[3]=NaN,'INVALID'],['unknown scope',x=>x[0][0].scope='any','INVALID'],['missing ID',x=>delete x[0][0].id,'INVALID'],['duplicate ID',x=>x[0][1].id='m1','INVALID'],
 ['invalid expiry',x=>x[0][0].expiresAt='2000','INVALID'],['unresolved same rank',x=>{x[0][0].scope='project';},'CONFLICT'],['higher version',x=>{x[0][0].scope='project';x[0][0].version=2;},'VALID'],
 ['empty collection',x=>x[0]=[],'EMPTY'],['sparse collection',x=>delete x[0][2],'INVALID'],['missing unrelated expired value',x=>delete x[0][3].value,'INVALID']
];
const handoffCases=[
 ['empty goal',x=>x.goal=' ','INVALID'],['missing constraints',x=>delete x.constraints,'INVALID'],['empty constraints',x=>x.constraints=[],'INVALID'],['missing evidence',x=>delete x.evidence,'INVALID'],
 ['unknown evidence',x=>x.evidence[0].id='e9','RETURNED'],['evidence version mismatch',x=>x.evidence[0].version=2,'RETURNED'],['duplicate evidence',x=>x.evidence[1]=clone(x.evidence[0]),'INVALID'],
 ['same sender recipient',x=>x.to=x.from,'RETURNED'],['unknown sender',x=>x.from='outsider','RETURNED'],['old version',x=>x.version=1,'STALE'],['unresolved missing',x=>delete x.unresolved,'INVALID'],
 ['explicit none',x=>x.unresolved=[],'ACCEPTED'],['sparse evidence',x=>delete x.evidence[0],'INVALID'],['future version',x=>x.version=3,'VERSION_MISMATCH'],['unresolved explicit',x=>x.unresolved=['史料未照合'],'ACCEPTED']
];
function implementations(){return [['product',P.ranking,P.memory,P.handoff],['oracle',C.rankingExpected,C.memoryExpected,C.handoffExpected]];}
for(const [label,rank,memory,handoff] of implementations()){
 for(const [name,mutate,status] of rankCases)test(`154 pair ${name} / ${label}`,()=>{a.equal(rank(...normalRanking()).status,'VALID');const args=normalRanking();mutate(args);a.equal(rank(...args).status,status);});
 for(const [name,mutate,status] of memoryCases)test(`155 pair ${name} / ${label}`,()=>{a.equal(memory(...normalMemory()).status,'VALID');const args=normalMemory();mutate(args);a.equal(memory(...args).status,status);});
 for(const [name,mutate,status] of handoffCases)test(`156 pair ${name} / ${label}`,()=>{a.equal(handoff(clone(C.HANDOFF)).status,'ACCEPTED');const x=clone(C.HANDOFF);mutate(x);a.equal(handoff(x).status,status);});
 for(const value of [null,undefined,true,[],NaN,Infinity])test(`154 rejects query type ${String(value)} / ${label}`,()=>{const x=normalRanking();x[1]=value;a.equal(rank(...x).status,'INVALID');});
 for(const value of [null,undefined,true,'2',Infinity,6])test(`154 rejects weight type ${String(value)} / ${label}`,()=>{const x=normalRanking();x[2]=value;a.equal(rank(...x).status,'INVALID');});
 for(const value of [null,undefined,true,'1000',Infinity,-1,10000,1.2])test(`155 rejects clock ${String(value)} / ${label}`,()=>{const x=normalMemory();x[3]=value;a.equal(memory(...x).status,'INVALID');});
 for(const value of [null,undefined,{},'text'])test(`155 rejects collection ${String(value)} / ${label}`,()=>a.equal(memory(value,'c1','p1',1000).status,'INVALID'));
 for(const field of ['id','key','value','scope','conversationId','projectId','version','expiresAt'])test(`155 missing field ${field} / ${label}`,()=>{const x=normalMemory();delete x[0][0][field];a.equal(memory(...x).status,'INVALID');});
 for(const value of [null,undefined,[],true,'long text'.repeat(50)])test(`156 rejects structure ${String(value).slice(0,10)} / ${label}`,()=>a.equal(handoff(value).status,'INVALID'));
 for(const field of ['id','from','to','projectId','version','goal','constraints','evidence','unresolved'])test(`156 missing field ${field} / ${label}`,()=>{const x=clone(C.HANDOFF);delete x[field];a.equal(handoff(x).status,'INVALID');});
 test(`own dense array entries / ${label}`,()=>{for(const [args,fn,index] of [[normalRanking(),rank,0],[normalMemory(),memory,0]]){const arr=args[index],proto=Object.create(Array.prototype);proto[1]=arr[1];delete arr[1];Object.setPrototypeOf(arr,proto);a.equal(fn(...args).status,'INVALID');}const ticket=clone(C.HANDOFF),proto=Object.create(Array.prototype);proto[0]=ticket.unresolved[0]='x';delete ticket.unresolved[0];Object.setPrototypeOf(ticket.unresolved,proto);a.equal(handoff(ticket).status,'INVALID');});
 test(`inputs unchanged / ${label}`,()=>{const r=normalRanking(),m=normalMemory(),h=clone(C.HANDOFF);const before=JSON.stringify([r,m,h]);rank(...r);memory(...m);handoff(h);a.equal(JSON.stringify([r,m,h]),before);});
}
test('oracle fixed normal ranking and score formula',()=>{const r=C.rankingExpected(...normalRanking());a.deepEqual(r.included,['d1','d2']);a.deepEqual(r.ranked.map(x=>[x.id,x.score]),[['d1',7],['d2',7],['d4',7]]);a.deepEqual(r.excluded,[{id:'d3',reason:'query-mismatch'},{id:'d4',reason:'rank-limit'}]);});
test('oracle fixed normal memory decisions',()=>{const r=C.memoryExpected(...normalMemory());a.deepEqual(r.included,['m2','m3']);a.deepEqual(r.rows.map(x=>[x.id,x.reason]),[['m1','shadowed'],['m2','selected'],['m3','selected'],['m4','expired']]);});
test('oracle imports no product and product imports no oracle',()=>{const fs=require('node:fs');a.ok(!/require\([^)]*wave11\.js/.test(fs.readFileSync(require.resolve('./wave11-contract.cjs'),'utf8')));a.ok(!/require\([^)]*wave11-contract/.test(fs.readFileSync(require.resolve('./wave11.js'),'utf8')));});

for(const [name,change] of rankCases)test('154 independent projection '+name,()=>{const x=normalRanking();change(x);a.deepEqual(C.projectRanking(P.ranking(...x)),C.rankingExpected(...x));});
for(const [name,change] of memoryCases)test('155 independent projection '+name,()=>{const x=normalMemory();change(x);a.deepEqual(C.projectMemory(P.memory(...x)),C.memoryExpected(...x));});
test('154 complete finite weight/count grid uses independent scores',()=>{for(const q of ['城','地図'])for(let wr=0;wr<=5;wr++)for(let wf=0;wf<=5;wf++)for(let n=1;n<=4;n++)a.deepEqual(C.projectRanking(P.ranking(clone(C.DOCS),q,wr,wf,n)),C.rankingExpected(clone(C.DOCS),q,wr,wf,n));});
for(const [label,fn] of [['product',P.handoff],['oracle',C.handoffExpected]]){
 test('156 same ticket replay '+label,()=>{const t=clone(C.HANDOFF);a.equal(fn(t).status,'ACCEPTED');a.equal(fn(t,clone(t)).status,'REPLAY');a.equal(fn(t,C.ticketKey(t)).status,'REPLAY');const reordered=Object.fromEntries(Object.entries(t).reverse());reordered.evidence=reordered.evidence.map(e=>Object.fromEntries(Object.entries(e).reverse()));a.equal(fn(reordered,t).status,'REPLAY');const changed=clone(t);changed.goal+='・限定';a.equal(fn(changed,t).status,'ACCEPTED');});
}
for(const id of [154,155,156])test('state contract '+id,()=>{const s=P.initial(id);a.equal(s.result,null);a.equal(s.revision,0);let run=P.reduce(s,{type:'run'});a.ok(run.result);a.equal(s.result,null);const field=id===154?'query':id===155?'conversation':'ticket';const same=P.reduce(run,{type:field,value:run[field]});a.deepEqual(same,run);const nextValue=id===154?'地図':id===155?'c2':run.ticket.replace('架空表示を実装','改訂表示を実装');const changed=P.reduce(run,{type:field,value:nextValue});a.equal(changed.result,null);a.equal(changed.revision,1);const again=P.reduce(changed,{type:'run'});a.ok(again.result);a.deepEqual(P.reduce(again,{type:'reset'}),P.initial(id));});
test('handoff repeated actual run is replay; reset clears receipt',()=>{let s=P.reduce(P.initial(156),{type:'run'});a.equal(s.result.status,'ACCEPTED');s=P.reduce(s,{type:'run'});a.equal(s.result.status,'REPLAY');s=P.reduce(s,{type:'reset'});s=P.reduce(s,{type:'run'});a.equal(s.result.status,'ACCEPTED');});
const handoffReasons={
 'empty goal':'invalid-ticket-text','missing constraints':'invalid-ticket-fields','empty constraints':'invalid-constraints','missing evidence':'invalid-ticket-fields','unknown evidence':'unknown-evidence','evidence version mismatch':'evidence-version-mismatch','duplicate evidence':'duplicate-evidence-id','same sender recipient':'same-sender-recipient','unknown sender':'unknown-agent','old version':'stale-ticket','unresolved missing':'invalid-ticket-fields','explicit none':'formally-accepted','sparse evidence':'invalid-evidence-array','future version':'ticket-version-mismatch','unresolved explicit':'formally-accepted'
};
for(const [name,change,status] of handoffCases)test('156 fixed reason and acceptance boundary '+name,()=>{const t=clone(C.HANDOFF);change(t);const r=P.handoff(t);a.equal(r.status,status);a.ok(r.reasons.includes(handoffReasons[name]),JSON.stringify(r));a.deepEqual(r.included,status==='ACCEPTED'?['e1','e2']:[]);if(status!=='INVALID'){a.equal(r.truth,'NOT_VERIFIED');a.equal(r.completion,'NOT_VERIFIED');a.equal(r.unresolvedExplicit,true);a.equal(r.unresolvedCount,t.unresolved.length);}});
test('155 existence, applicability and resolution are separate',()=>{const r=P.memory(...normalMemory()),byId=Object.fromEntries(r.rows.map(x=>[x.id,x]));a.ok(r.rows.every(x=>x.exists===true));a.equal(byId.m1.eligible,true);a.equal(byId.m1.adopted,false);a.equal(byId.m1.resolution,'resolved');a.equal(byId.m4.expired,true);a.equal(byId.m4.eligible,false);a.equal(byId.m4.resolution,'not-applicable');const x=normalMemory();x[0][0].scope='project';const c=P.memory(...x);for(const id of ['m1','m2']){const row=c.rows.find(r=>r.id===id);a.equal(row.eligible,true);a.equal(row.adopted,false);a.equal(row.resolution,'unresolved');}a.deepEqual(c.included,['m3']);});
test('155 all expired is valid zero adoption, not invalid input',()=>{const r=P.memory(clone(C.MEMORIES),'c1','p1',9999);a.equal(r.status,'VALID');a.deepEqual(r.included,[]);a.ok(r.rows.every(x=>x.exists&&!x.eligible&&x.reason==='expired'));});
test('154 all refusal states have no adopted output',()=>{for(const args of [[clone(C.DOCS),'',2,1,2],[clone(C.DOCS),'海',2,1,2],[clone(C.DOCS),'城',0,0,2],[clone(C.DOCS),'城',-1,1,2]]){const r=P.ranking(...args);a.deepEqual(r.included,[]);a.ok(r.rows.every(x=>x.adopted===false));}});
// P2-UI: independently fixed scope outcomes; no fixture output used as expected.
for(const [scope,status,included,reasons] of [
 ['global','VALID',['m2','m3'],['shadowed','selected','selected','expired']],
 ['project','CONFLICT',['m3'],['same-rank-conflict','same-rank-conflict','selected','expired']],
 ['conversation','VALID',['m1','m3'],['selected','shadowed','selected','expired']]
])test('155 user scope selection '+scope,()=>{let s=P.initial(155);a.equal(s.m1Scope,'global');s=P.reduce(s,{type:'m1Scope',value:scope});a.equal(s.m1Scope,scope);a.equal(s.revision,scope==='global'?0:1);s=P.reduce(s,{type:'run'});a.equal(s.result.status,status);a.deepEqual(s.result.included,included);a.deepEqual(s.result.rows.map(x=>x.reason),reasons);const expectedItems=clone(C.MEMORIES);expectedItems[0].scope=scope;a.deepEqual(C.projectMemory(s.result),C.memoryExpected(expectedItems,'c1','p1',1000));});
test('155 scope changed invalidates, same preserves, reset restores scope',()=>{let s=P.reduce(P.initial(155),{type:'run'});a.deepEqual(P.reduce(s,{type:'m1Scope',value:'global'}),s);s=P.reduce(s,{type:'m1Scope',value:'project'});a.equal(s.result,null);a.equal(s.revision,1);s=P.reduce(s,{type:'run'});a.equal(s.result.status,'CONFLICT');a.deepEqual(P.reduce(s,{type:'m1Scope',value:'project'}),s);const reset=P.reduce(s,{type:'reset'});a.deepEqual(reset,P.initial(155));a.equal(reset.m1Scope,'global');a.equal(reset.result,null);a.deepEqual(P.reduce(reset,{type:'run'}).result.included,['m2','m3']);});
for(const [name,change] of handoffCases)test('156 full independent projection '+name,()=>{const t=clone(C.HANDOFF);change(t);a.deepEqual(C.projectHandoff(P.handoff(t)),C.handoffExpected(t));});
test('156 independent evidence-row tamper controls',()=>{const expected=C.handoffExpected(clone(C.HANDOFF));a.deepEqual(C.projectHandoff(P.handoff(clone(C.HANDOFF))),expected);for(const field of ['id','version','expectedVersion','reason']){const fake=clone(P.handoff(clone(C.HANDOFF)));fake.rows[0][field]=field==='version'||field==='expectedVersion'?9:'unknown';a.notDeepEqual(C.projectHandoff(fake),expected);}const fake=clone(P.handoff(clone(C.HANDOFF)));fake.rows[0]={id:'invented',version:9,expectedVersion:9,reason:'reference-matched'};fake.included[0]='invented';a.notDeepEqual(C.projectHandoff(fake),expected);});
