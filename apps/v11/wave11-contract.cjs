'use strict';
// Independent specification model. Never imports wave11.js or its output.
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
const dense=a=>Array.isArray(a)&&Array.from({length:a.length},(_,i)=>own(a,i)).every(Boolean);
const text=s=>typeof s==='string'&&s.trim().length>0;
const int=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const fields=(o,ks)=>plain(o)&&ks.every(k=>own(o,k))&&Object.keys(o).length===ks.length;
const clone=x=>structuredClone(x);
const DOCS=[{id:'d1',terms:['城'],relevance:3,freshness:1},{id:'d2',terms:['城','地図'],relevance:2,freshness:3},{id:'d3',terms:['地図'],relevance:1,freshness:2},{id:'d4',terms:['城'],relevance:2,freshness:3}];
const MEMORIES=[{id:'m1',key:'style',value:'短く',scope:'global',conversationId:'c1',projectId:'p1',version:1,expiresAt:2000},{id:'m2',key:'style',value:'丁寧',scope:'project',conversationId:'c1',projectId:'p1',version:1,expiresAt:2000},{id:'m3',key:'format',value:'表',scope:'conversation',conversationId:'c1',projectId:'p1',version:1,expiresAt:2000},{id:'m4',key:'old',value:'旧',scope:'global',conversationId:'c1',projectId:'p1',version:1,expiresAt:1000}];
const HANDOFF={id:'h1',from:'researcher',to:'implementer',projectId:'p1',version:2,goal:'架空表示を実装',constraints:['外部通信なし'],evidence:[{id:'e1',version:1},{id:'e2',version:2}],unresolved:[]};
function rankingExpected(docs,query,wr,wf,count){
 const invalid=()=>({status:'INVALID',included:[],ranked:[],excluded:[]});
 if(typeof query!=='string'||!int(wr,0,5)||!int(wf,0,5)||!int(count,1,4)||!dense(docs)||docs.length!==4)return invalid();
 const ids=new Set();
 for(const d of docs){if(!fields(d,['id','terms','relevance','freshness']))return invalid();const fixed=DOCS.find(x=>x.id===d.id);if(!fixed||ids.has(d.id)||!dense(d.terms)||JSON.stringify(d.terms)!==JSON.stringify(fixed.terms)||d.relevance!==fixed.relevance||d.freshness!==fixed.freshness)return invalid();ids.add(d.id);}
 const q=query.trim();if(!q)return {status:'EMPTY_QUERY',included:[],ranked:[],excluded:[]};
 if(wr===0&&wf===0)return {status:'ZERO_WEIGHTS',included:[],ranked:[],excluded:[]};
 const ranked=DOCS.filter(d=>d.terms.includes(q)).map(d=>({id:d.id,score:d.relevance*wr+d.freshness*wf,relevanceScore:d.relevance*wr,freshnessScore:d.freshness*wf}));
 ranked.sort((a,b)=>b.score-a.score||(a.id<b.id?-1:1));
 if(!ranked.length)return {status:'NO_MATCH',included:[],ranked:[],excluded:[]};
 const included=ranked.slice(0,count).map(d=>d.id);
 const excluded=DOCS.filter(d=>!included.includes(d.id)).map(d=>({id:d.id,reason:d.terms.includes(q)?'rank-limit':'query-mismatch'}));
 return {status:'VALID',included,ranked,excluded};
}
function memoryExpected(items,conversation,project,now){
 const invalid=()=>({status:'INVALID',included:[],rows:[]});
 if(!text(conversation)||!text(project)||!int(now,0,9999)||!dense(items))return invalid();
 const seen=new Set();
 for(const m of items){if(!fields(m,['id','key','value','scope','conversationId','projectId','version','expiresAt'])||!['id','key','value','conversationId','projectId'].every(k=>text(m[k]))||!['global','project','conversation'].includes(m.scope)||!int(m.version,1,9)||!int(m.expiresAt,0,9999)||seen.has(m.id))return invalid();seen.add(m.id);}
 if(!items.length)return {status:'EMPTY',included:[],rows:[]};
 const rows=items.map(m=>({id:m.id,key:m.key,reason:now>=m.expiresAt?'expired':m.scope==='global'||m.projectId===project&&(m.scope==='project'||m.conversationId===conversation)?'eligible':'out-of-scope'}));
 const priority={global:1,project:2,conversation:3};let conflict=false;
 for(const key of new Set(items.map(m=>m.key))){const eligible=items.filter(m=>m.key===key&&rows.find(r=>r.id===m.id).reason==='eligible');if(!eligible.length)continue;const scope=Math.max(...eligible.map(m=>priority[m.scope]));const version=Math.max(...eligible.filter(m=>priority[m.scope]===scope).map(m=>m.version));const top=eligible.filter(m=>priority[m.scope]===scope&&m.version===version);if(top.length>1)conflict=true;for(const m of eligible)rows.find(r=>r.id===m.id).reason=top.includes(m)?top.length>1?'conflict':'selected':'shadowed';}
 return {status:conflict?'CONFLICT':'VALID',included:rows.filter(r=>r.reason==='selected').map(r=>r.id).sort(),rows};
}
function handoffExpected(ticket,previous=null){
 const bad=reason=>({status:'INVALID',reasons:[reason],rows:[],included:[]});
 if(!fields(ticket,['id','from','to','projectId','version','goal','constraints','evidence','unresolved']))return bad('invalid-ticket-fields');
 if(!['id','from','to','projectId','goal'].every(k=>text(ticket[k])))return bad('invalid-ticket-text');
 if(!int(ticket.version,1,9))return bad('invalid-ticket-version');
 if(!dense(ticket.constraints)||!ticket.constraints.length||!ticket.constraints.every(text))return bad('invalid-constraints');
 if(!dense(ticket.unresolved)||!ticket.unresolved.every(text))return bad('invalid-unresolved');
 if(!dense(ticket.evidence)||!ticket.evidence.length)return bad('invalid-evidence-array');
 const ids=[];for(const e of ticket.evidence){if(!fields(e,['id','version'])||!text(e.id)||!int(e.version,1,9))return bad('invalid-evidence-fields');if(ids.includes(e.id))return bad('duplicate-evidence-id');ids.push(e.id);}
 const reasons=[];
 if(ticket.id!=='h1')reasons.push('unknown-ticket-id');
 if(ticket.projectId!=='p1')reasons.push('unknown-project');
 const permitted=['researcher','implementer','reviewer'];
 if(!permitted.includes(ticket.from)||!permitted.includes(ticket.to))reasons.push('unknown-agent');
 if(ticket.from===ticket.to)reasons.push('same-sender-recipient');
 const catalog={e1:1,e2:2};
 const rows=[];for(const ref of ticket.evidence){const required=own(catalog,ref.id)?catalog[ref.id]:null;const reason=required===null?'unknown-evidence':required===ref.version?'reference-matched':'evidence-version-mismatch';rows.push({id:ref.id,version:ref.version,expectedVersion:required,reason});if(reason!=='reference-matched')reasons.push(reason);}
 let status='ACCEPTED';
 if(reasons.length)status='RETURNED';
 else if(ticket.version<2){status='STALE';reasons.push('stale-ticket');}
 else if(ticket.version>2){status='VERSION_MISMATCH';reasons.push('ticket-version-mismatch');}
 else if(previous!==null&&(typeof previous==='string'?previous:ticketKey(previous))===ticketKey(ticket)){status='REPLAY';reasons.push('same-ticket-replay');}
 else reasons.push('formally-accepted');
 return {status,reasons,rows,included:status==='ACCEPTED'?ids:[],unresolvedExplicit:true,unresolvedCount:ticket.unresolved.length,truth:'NOT_VERIFIED',completion:'NOT_VERIFIED'};
}
function projectHandoff(r){const fields=['status','reasons','rows','included'];if(r.status!=='INVALID')fields.push('unresolvedExplicit','unresolvedCount','truth','completion');return Object.fromEntries(fields.map(k=>[k,r[k]]));}
function ticketKey(x){return JSON.stringify(Object.fromEntries(['id','from','to','projectId','version','goal','constraints','evidence','unresolved'].map(k=>[k,k==='evidence'?x[k].map(e=>({id:e.id,version:e.version})):x[k]])));}
function projectRanking(r){return {status:r.status,included:r.included,ranked:r.status==='VALID'?r.rows.filter(x=>x.rank!==null).map(x=>({id:x.id,score:x.score,relevanceScore:x.parts.relevance,freshnessScore:x.parts.freshness})):[],excluded:r.status==='VALID'?r.rows.filter(x=>!x.adopted).map(x=>({id:x.id,reason:x.reason})).sort((a,b)=>a.id<b.id?-1:1):[]};}
function projectMemory(r){return {status:r.status,included:r.included,rows:r.rows.map(x=>({id:x.id,key:x.key,reason:x.reason==='same-rank-conflict'?'conflict':x.reason})).sort((a,b)=>a.id<b.id?-1:1)};}
function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
[DOCS,MEMORIES,HANDOFF].forEach(freeze);
module.exports={DOCS,MEMORIES,HANDOFF,rankingExpected,memoryExpected,handoffExpected,clone,ticketKey,projectRanking,projectMemory,projectHandoff};
