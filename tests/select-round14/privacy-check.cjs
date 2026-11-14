 'use strict';
// Release gate for synthetic hosted Museum evidence. Never sanitizes originals.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {localURL,scanText,inspectObject,inspectPNG,inspectJPEG,zipEntries,safeName}=require('../select-round11/privacy-check.cjs');
const repo=path.resolve(__dirname,'../..');
const {slots}=require('./model.cjs');
const plan=require('./plan.json');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const requireSafe=(v,code)=>{if(!v)throw Error(code)};
const fonts=['AMS-Regular','Caligraphic-Bold','Caligraphic-Regular','Fraktur-Bold','Fraktur-Regular','Main-Bold','Main-BoldItalic','Main-Italic','Main-Regular','Math-BoldItalic','Math-Italic','SansSerif-Bold','SansSerif-Italic','SansSerif-Regular','Script-Regular','Size1-Regular','Size2-Regular','Size3-Regular','Size4-Regular','Typewriter-Regular'];
const cspMessages=new Set(fonts.flatMap(font=>{
 const url=`https://cdn.openai.com/common/fonts/katex/KaTeX_${font}.woff2`;
 return [`Refused to load ${url} because it does not appear in the font-src directive of the Content Security Policy.`, `Refused to load the font '${url}' because it violates the following Content Security Policy directive: "font-src 'self'".\n`];
}));
const fontURLs=new Set(fonts.map(f=>`https://cdn.openai.com/common/fonts/katex/KaTeX_${f}.woff2`));
function knownCSP(text){return typeof text==='string'&&cspMessages.has(text)}
function inspectHeader(name,value){
 const exact={
  'accept':['*/*','text/css,*/*;q=0.1','text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8','text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'],
  'upgrade-insecure-requests':['1'],'sec-fetch-dest':['script','style','iframe','document','empty'],'sec-fetch-mode':['navigate','cors','no-cors'],'sec-fetch-site':['same-origin','none'],
  'cache-control':['no-cache'],'pragma':['no-cache'],'connection':['keep-alive','close'],'accept-encoding':['gzip, deflate, br','gzip, deflate, br, zstd'],'accept-language':['en-US','en-US,en;q=0.9'],
  'sec-ch-ua':['"HeadlessChrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"'],'sec-ch-ua-mobile':['?0'],'sec-ch-ua-platform':['"Linux"','"Windows"'],
  'content-type':['text/html','text/css','text/javascript','application/octet-stream'],
  'user-agent':['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',...['X11; Linux x86_64','Windows NT 10.0; Win64; x64'].map(os=>`Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.37 Safari/537.36`)]
 };
 const patterns={'date':/^(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:, )?|)[0-9]{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} GMT$/,'content-length':/^[0-9]+$/,'keep-alive':/^timeout=[0-9]+$/,'host':/^127\.0\.0\.1:[0-9]+$/};
 requireSafe(typeof value==='string'&&(exact[name]?.includes(value)||patterns[name]?.test(value)||(name==='date'&&/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/.test(value))),'unexpected-header-value');
}
function networkShape(s){
 const allowed={request:['method','url','httpVersion','cookies','headers','queryString','headersSize','bodySize'],response:['status','statusText','httpVersion','cookies','headers','content','headersSize','bodySize','redirectURL','_transferSize','_failureText'],content:['size','mimeType','compression','_sha1']};
 for(const key of ['request','response'])requireSafe(s[key]&&Object.keys(s[key]).every(k=>allowed[key].includes(k)),'unexpected-network-field');
 requireSafe(s.response.content&&Object.keys(s.response.content).every(k=>allowed.content.includes(k)),'inline-or-unknown-response-body');
 requireSafe(s.response.redirectURL==='','unexpected-redirect');
}
function failedFont(s,origin){
 networkShape(s);const r=s.request,q=s.response;
 requireSafe(fontURLs.has(r.url)&&r.method==='GET'&&r.bodySize===0&&r.cookies?.length===0&&r.queryString?.length===0,'unknown-csp-request');
 requireSafe(q.status===-1&&q.statusText===''&&q._failureText==='csp'&&q.bodySize===-1&&q._transferSize===-1&&q.cookies?.length===0&&q.headers?.length===0&&JSON.stringify(q.content)===JSON.stringify({size:-1,mimeType:'x-unknown'})&&!s.serverIPAddress&&!s._serverPort&&!s._securityDetails&&!s._wasContinued,'csp-request-not-blocked');
 requireSafe(r.headers.every(h=>['origin','referer'].includes(h.name.toLowerCase())&&localURL(h.value).origin===origin),'csp-request-headers');
}
function inspectTrace(entries,build,source,allowedOrigin,engine){
 const names=new Set(),resources=new Map(),referenced=new Set();let requests=0,contexts=0;
 for(const [n,b]of entries){requireSafe(safeName(n)&&!names.has(n),'zip-path-or-duplicate');names.add(n);if(n.startsWith('resources/'))resources.set(n.slice(10),b);else requireSafe(['trace.trace','trace.network','trace.stacks'].includes(n),'unknown-zip-entry')}
 for(const n of ['trace.trace','trace.network','trace.stacks'])requireSafe(names.has(n),'missing-trace-part');
 for(const [n,b]of entries){
  if(n==='trace.stacks'){const x=JSON.parse(b);inspectObject(x);requireSafe(x.files.every(f=>f==='<anonymous>'||f.replaceAll('\\','/').replace(/^async /,'').endsWith('/tests/select-round14/run.cjs')),'unknown-source-path');continue}
  if(n.startsWith('resources/'))continue;
  for(const line of b.toString('utf8').trim().split('\n')){
   if(!line)continue;const x=JSON.parse(line);let blockedFont=false;if(x.type==='resource-snapshot'){networkShape(x.snapshot);if(fontURLs.has(x.snapshot.request.url)){failedFont(x.snapshot,allowedOrigin);blockedFont=true;const checked=structuredClone(x);checked.snapshot.request.url=allowedOrigin+'/';inspectObject(checked)}else inspectObject(x)}else inspectObject(x);if(x.type==='console')requireSafe(x.messageType==='error'&&knownCSP(x.text)&&Array.isArray(x.args)&&x.args.length===0,'unknown-console-error');
   if(x.type==='context-options'){contexts++;requireSafe(x.browserName===engine&&x.origin==='library'&&!x.options.storageState&&!x.options.httpCredentials,'context-provenance')}
   if(x.type==='screencast-frame'){requireSafe(/^page@[a-f0-9]+-[0-9]+\.jpeg$/.test(x.sha1),'screencast-reference');referenced.add(x.sha1)}
   if(x.type==='resource-snapshot'){
    if(blockedFont)continue;requests++;const s=x.snapshot,r=s.request,u=localURL(r.url);if(allowedOrigin)requireSafe(u.origin===allowedOrigin,'unexpected-loopback-origin');requireSafe(['127.0.0.1','::1'].includes(s.serverIPAddress),'non-loopback-server');requireSafe(r.method==='GET'&&(!r.bodySize||r.bodySize===-1)&&!r.postData,'request-body');
    const rel=u.pathname==='/'?'index.html':u.pathname.slice(1);requireSafe(build.has(rel)||rel==='favicon.ico','unknown-request-path');
    const requestHeaders=new Set(['accept','upgrade-insecure-requests','user-agent','accept-encoding','accept-language','connection','host','sec-fetch-dest','sec-fetch-mode','sec-fetch-site','origin','referer','cache-control','pragma','sec-ch-ua','sec-ch-ua-mobile','sec-ch-ua-platform']);
    const responseHeaders=new Set(['content-type','date','connection','keep-alive','content-length']);
    for(const [headers,allowed]of [[r.headers,requestHeaders],[s.response.headers,responseHeaders]])for(const h of headers){requireSafe(allowed.has(h.name.toLowerCase()),'unexpected-header');if(['origin','referer'].includes(h.name.toLowerCase()))requireSafe(localURL(h.value).origin===allowedOrigin,'unexpected-header-origin');else inspectHeader(h.name.toLowerCase(),h.value)}
    requireSafe(JSON.stringify(r.queryString||[])===JSON.stringify([...u.searchParams].map(([name,value])=>({name,value}))),'query-evidence');
    const sha=s.response.content?._sha1;if(sha){requireSafe(resources.has(sha)&&build.has(rel)&&hash(resources.get(sha))===build.get(rel),'response-source-mismatch');referenced.add(sha)}
   }
  }
 }
 requireSafe(requests>0&&contexts===1,'trace-provenance');
 for(const [n,b]of resources){
  if(/^src@[a-f0-9]+\.txt$/.test(n)){requireSafe(b.equals(source),'source-attachment-mismatch');scanText(b.toString());continue}
  requireSafe(referenced.has(n),'unreferenced-resource');
  if(n.endsWith('.jpeg'))inspectJPEG(b);
  else scanText(b.toString('utf8'));
 }
}
function expectedArtifacts(phase){
 const out=new Set(['results.json']);for(const s of slots(phase)){
  const id=s.id;out.add(id+'.json');for(const n of ['on','off','off2','on2'])out.add(id+'-Select-'+n+'.png');
  if(s.tracing)out.add(id+'-trace.zip');if(s.arm==='A3')out.add(id+'-intermediate.png');
 }return out;
}
// Exported for read-only structural tests. This is NOT release authorization and
// has no CLI entry point; only gate() can return a release PASS.
function inspectEvidence(root){
 root=path.resolve(root);requireSafe(!fs.lstatSync(root).isSymbolicLink(),'symlink-root');
 const read=n=>{requireSafe(safeName(n)&&!n.includes('/'),'unsafe-file-name');const f=path.join(root,n),s=fs.lstatSync(f);requireSafe(s.isFile()&&!s.isSymbolicLink()&&s.size<64*1024*1024,'unsafe-file');return fs.readFileSync(f)};
 const manifest=JSON.parse(read('SHA256SUMS.json')),d=JSON.parse(read('results.json'));
 requireSafe(d.schema===2&&d.exitCode===0&&!d.fatal&&!d.dirty&&d.browserClosed===true&&['webkit','chromium'].includes(d.engine)&&['linux','win32'].includes(d.system?.platform),'incomplete-producer');
 requireSafe(d.rows?.length===plan[d.phase]?.slotsPerEnvironment&&d.rows.every(r=>r.input==='Playwright automated, NOT physical'&&r.cleanup===true&&r.status==='COMPLETE'&&!r.error&&!r.captureError&&Array.isArray(r.pageErrors)&&r.pageErrors.length===0),'synthetic-provenance');
 const expected=expectedArtifacts(d.phase);
 requireSafe(JSON.stringify(Object.keys(manifest).sort())===JSON.stringify([...expected].sort()),'manifest-allowlist');
 requireSafe(JSON.stringify(fs.readdirSync(root).sort())===JSON.stringify([...expected,'SHA256SUMS.json'].sort()),'unmanifested-file');
 const ids=new Set(d.rows.map(r=>r.id));requireSafe(ids.size===slots(d.phase).length&&slots(d.phase).every(s=>ids.has(s.id)),'row-inventory');
 for(const r of d.rows){
  const p=r.privacy;requireSafe(p?.freshContext===true&&p.physicalInput===false&&JSON.stringify(p.initialStorage)===JSON.stringify({cookies:[],origins:[]})&&p.externalRequests===0&&Array.isArray(p.blockedRequests)&&p.blockedRequests.length===0,'fresh-empty-context');
  requireSafe(/^http:\/\/127\.0\.0\.1:[0-9]+$/.test(p.allowedOrigin),'unexpected-loopback-origin');localURL(p.allowedOrigin);
  requireSafe(Array.isArray(r.consoleErrors)&&r.consoleErrors.every(knownCSP),'unknown-console-error');
  requireSafe(r.tracing?r.traceFile===r.id+'-trace.zip':r.traceFile===null,'trace-row-binding');
  requireSafe(JSON.stringify(JSON.parse(read(r.id+'.json')))===JSON.stringify(r),'row-consistency');
 }
 const git=args=>execFileSync('git',args,{cwd:repo,encoding:null,stdio:['ignore','pipe','pipe']});
 requireSafe(/^[a-f0-9]{40}$/.test(d.head||'')&&git(['rev-parse',d.head+'^{tree}']).toString().trim()===d.tree,'source-tree');
 // Existing public product source must remain exactly at the preregistered baseline.
 requireSafe(git(['diff','78e6e99fa46274cae9435dae4483c5266ad6b021',d.head,'--','apps/v10','archive']).length===0,'public-source-changed');
 for(const [f,h]of Object.entries(d.sources||{})){
  requireSafe(safeName(f)&&f.startsWith('tests/select-round14/'),'unsafe-source-path');
  requireSafe(hash(git(['show',d.head+':'+f]))===h,'source-provenance');
 }
 // Capture code must be the currently reviewed source even when auditing an older run.
 for(const f of ['run.cjs','audit.cjs','trace-check.py','plan.json','snapshot.cjs','probe.cjs','caller.cjs','model.cjs'])requireSafe(d.sources?.['tests/select-round14/'+f]===hash(fs.readFileSync(path.join(__dirname,f))),'capture-source-changed');
 const build=new Map();for(const [n,h]of Object.entries(d.build||{})){requireSafe(safeName(n),'unsafe-build-path');const b=fs.readFileSync(path.join(repo,'.work/v10/dist',n));requireSafe(hash(b)===h,'build-provenance');build.set(n,h)}requireSafe(build.has('index.html'),'missing-build');
 const source=fs.readFileSync(path.join(__dirname,'run.cjs'));
 for(const n of expected){const b=read(n);requireSafe(hash(b)===manifest[n],'artifact-hash');if(n.endsWith('.json'))inspectObject(JSON.parse(b));else if(n.endsWith('.zip'))inspectTrace(zipEntries(path.join(root,n)),build,source,d.rows.find(r=>r.traceFile===n)?.privacy.allowedOrigin,d.engine);else if(n.endsWith('.png'))inspectPNG(b);else requireSafe(false,'unknown-file-type')}
 return {status:'STRUCTURALLY_CHECKED_NOT_RELEASED',files:expected.size+1,producer:d};
}
function gate(root,env=process.env){
 requireSafe(env.GITHUB_ACTIONS==='true'&&/^\d+$/.test(env.GITHUB_RUN_ID||'')&&/^\d+$/.test(env.GITHUB_RUN_ATTEMPT||'')&&env.RUNNER_ENVIRONMENT==='github-hosted','ci-only-not-physical');
 requireSafe(/^[a-f0-9]{40}$/.test(env.ROUND14_EXPECT_HEAD||''),'missing-expected-head');
 // Do provenance first: a local/actual-PC run must never be promoted by content checks.
 const d=JSON.parse(fs.readFileSync(path.join(root,'results.json')));
 requireSafe(d.github?.run===env.GITHUB_RUN_ID&&d.github?.attempt===env.GITHUB_RUN_ATTEMPT&&d.head===env.ROUND14_EXPECT_HEAD&&d.executableOverride===null,'ci-provenance');
 const checked=inspectEvidence(root);
 return {status:'PASS',scope:'privacy-only release of fresh synthetic GitHub-hosted localhost Museum; not a diagnostic PASS',files:checked.files,pixelAssurance:'Provenance based; pattern scanning does not prove pixel privacy. Physical PC excluded.'};
}
module.exports={knownCSP,cspMessages,inspectHeader,failedFont,inspectTrace,inspectEvidence,gate,expectedArtifacts};
if(require.main===module){try{console.log(JSON.stringify(gate(process.argv[2]||'.work/select-round14')))}catch(e){console.log(JSON.stringify({status:'BLOCKED',reason:/^[a-z-]+$/.test(e.message)?e.message:'unreadable-or-unrecognized-evidence'}));process.exitCode=1}}
