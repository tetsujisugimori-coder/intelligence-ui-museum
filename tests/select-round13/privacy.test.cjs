'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {knownCSP,cspMessages,inspectTrace,gate,inspectHeader,expectedArtifacts}=require('./privacy-check.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const origin='http://127.0.0.1:3210';
function fixture(engine='webkit'){
 const source=Buffer.from('/* public synthetic runner */'),body=Buffer.from('<html>Public Museum</html>');
 const network={type:'resource-snapshot',snapshot:{serverIPAddress:'127.0.0.1',request:{method:'GET',url:origin+'/',headers:[],cookies:[],queryString:[],bodySize:0},response:{headers:[],cookies:[],redirectURL:'',content:{_sha1:'fixture.html'}}}};
 const trace=[{type:'context-options',browserName:engine,origin:'library',options:{}}];
 return {source,body,network,trace,extra:[],build:new Map([['index.html',hash(body)]])};
}
function run(f){
 const entries=[['trace.trace',Buffer.from(f.trace.map(x=>JSON.stringify(x)).join('\n'))],['trace.network',Buffer.from([f.network,...f.extra].map(x=>JSON.stringify(x)).join('\n'))],['trace.stacks',Buffer.from(JSON.stringify({files:['<anonymous>'],stacks:[]}))],['resources/fixture.html',f.body],['resources/src@abc.txt',f.source]];
 inspectTrace(entries,f.build,f.source,origin,f.trace[0].browserName);
}
function blockedFont(){return {type:'resource-snapshot',snapshot:{request:{method:'GET',url:'https://cdn.openai.com/common/fonts/katex/KaTeX_AMS-Regular.woff2',bodySize:0,cookies:[],queryString:[],headers:[{name:'Origin',value:origin},{name:'Referer',value:origin+'/'}]},response:{status:-1,statusText:'',_failureText:'csp',bodySize:-1,_transferSize:-1,cookies:[],headers:[],content:{size:-1,mimeType:'x-unknown'},redirectURL:''}}}}

test('exact known20 fonts × two observed CSP forms, never generalized URLs/text',()=>{
 assert.equal(cspMessages.size,40);for(const message of cspMessages){assert.ok(knownCSP(message));for(const bad of [message+'private detail',message.replace('cdn.openai.com','evil.test'),message.replace('KaTeX_','Private_'),message.replace('.woff2','.woff2?token=synthetic'),message.replace('font-src','script-src')])assert.equal(knownCSP(bad),false)}
 assert.equal(knownCSP(''),false);assert.equal(knownCSP(null),false);
});
test('known CSP console accepted; all other levels/args/messages rejected',()=>{
 const f=fixture();f.trace.push({type:'console',messageType:'error',text:[...cspMessages][0],args:[],location:{url:''}});assert.doesNotThrow(()=>run(f));
 for(const mutate of [x=>x.messageType='warning',x=>x.text+=' synthetic',x=>x.args.push({value:'private prose'}),x=>x.location.url='https://external.test/']){const g=structuredClone(f);mutate(g.trace[1]);assert.throws(()=>run(g))}
});
test('normal Chromium/WebKit traces and strictly blocked known CSP HAR accepted',()=>{
 for(const engine of ['webkit','chromium']){const f=fixture(engine);assert.doesNotThrow(()=>run(f));f.extra.push(blockedFont());assert.doesNotThrow(()=>run(f))}
});
test('CSP shape cannot admit actual external traffic, bodies, redirects or headers',()=>{
 for(const mutate of [s=>s.request.url+='?x=1',s=>s.request.url=s.request.url.replace('AMS-Regular','Unknown'),s=>s.request.url=s.request.url.replace('cdn.openai.com','external.test'),s=>s.serverIPAddress='203.0.113.1',s=>s._serverPort=443,s=>s._wasContinued=true,s=>s.response.status=200,s=>s.response._failureText='other',s=>s.response.content.text='private prose',s=>s.response.content._sha1='fixture.html',s=>s.response.headers.push({name:'Content-Type',value:'font/woff2'}),s=>s.response.bodySize=1,s=>s.response.redirectURL=origin+'/',s=>s.request.headers.push({name:'X-Private',value:'private prose'}),s=>s.request.headers[0].value='http://127.0.0.1:9999',s=>s.request.postData={text:'private prose'},s=>s.request.body='private prose']){const f=fixture('chromium'),x=blockedFont();mutate(x.snapshot);f.extra.push(x);assert.throws(()=>run(f))}
});
test('normal HAR rejects inline/unbound content and unknown request/response payload fields',()=>{
 for(const mutate of [s=>s.response.content.text='private prose',s=>s.response.content.encoding='base64',s=>s.request.body='private prose',s=>s.request.bodyText='private prose',s=>s.response.body='private prose',s=>s.response.redirectURL=origin+'/private',s=>s.request.cookies.push({name:'session',value:'private'}),s=>s.request.headers.push({name:'Authorization',value:'private'}),s=>s.request.method='POST']){const f=fixture();mutate(f.network.snapshot);assert.throws(()=>run(f))}
 const f=fixture();f.body=Buffer.from('unbound response');assert.throws(()=>run(f),/response-source/);
});
test('strict header values and no hidden payload in ordinary permitted headers',()=>{
 for(const [key,value]of [['accept','private prose'],['user-agent','private prose'],['date','private prose'],['sec-ch-ua-platform','"Private"'],['content-length','1\nprivate']])assert.throws(()=>inspectHeader(key,value));
 assert.doesNotThrow(()=>inspectHeader('sec-ch-ua-platform','"Windows"'));
});
test('gate denies local/self-hosted before reading evidence; inventory fixed128',()=>{
 assert.throws(()=>gate('/unused',{}),/ci-only/);
 assert.throws(()=>gate('/unused',{GITHUB_ACTIONS:'true',GITHUB_RUN_ID:'1',GITHUB_RUN_ATTEMPT:'1',RUNNER_ENVIRONMENT:'self-hosted'}),/ci-only/);
 assert.throws(()=>gate('/unused',{GITHUB_ACTIONS:'true',GITHUB_RUN_ID:'1',GITHUB_RUN_ATTEMPT:'1',RUNNER_ENVIRONMENT:'github-hosted'}),/expected-head/);
 assert.equal(expectedArtifacts().size,127);
});
