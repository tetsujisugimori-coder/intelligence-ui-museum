'use strict';
// Release gate, not a proof that arbitrary pixels contain no private information.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../..');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const requireSafe=(v,code)=>{if(!v)throw Error(code)};
const safeName=n=>typeof n==='string'&&/^[a-zA-Z0-9@_.-]+(?:\/[a-zA-Z0-9@_.-]+)*$/.test(n)&&!n.split('/').some(p=>p==='.'||p==='..');
function localURL(s,{blank=false}={}){
 if(blank&&s==='about:blank')return null;
 requireSafe(typeof s==='string'&&/^http:\/\/(?:127\.0\.0\.1|localhost|\[::1\]):[0-9]+(?:\/|$)/.test(s),'non-loopback-url');
 requireSafe(!/[\\%\s]/.test(s)&&!s.split('/').includes('..'),'url-path');
 const u=new URL(s);requireSafe(!u.username&&!u.password&&!u.hash&&['127.0.0.1','localhost','[::1]'].includes(u.hostname),'url-credentials-or-host');
 requireSafe(u.port&&Number(u.port)>0&&!/%|\\/.test(u.pathname)&&!u.pathname.split('/').includes('..'),'url-path');
 const allowed={theme:['light'],text:['100'],exhibit:['82','16','85','47','86']};
 const seen=new Set();for(const [k,v] of u.searchParams){requireSafe(!seen.has(k)&&allowed[k]?.includes(v),'private-query');seen.add(k)}
 return u;
}
function scanText(s){
 s=s.replace("Password:'表示・非表示を切り替える。'",'PUBLIC_DEMO_LABEL');
 s=s.replace(/\bpage@[a-f0-9]+-[0-9]+\.jpeg\b/g,'TRACE_IMAGE');
 requireSafe(!/-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16})\b|\bBearer\s+[A-Za-z0-9._~-]{8,}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(s),'secret-or-personal-pattern');
 requireSafe(!/(?:password|passwd|api[_-]?key|private[_-]?key|session[_-]?token|recovery[_-]?(?:token|code|key)|access[_-]?token|refresh[_-]?token|client[_-]?secret)\s*[=:]\s*["'][^"']+["']/i.test(s),'secret-assignment');
}
function inspectJPEG(b){
 requireSafe(b[0]===255&&b[1]===216&&b.at(-2)===255&&b.at(-1)===217,'invalid-image');
 let i=2;
 while(i<b.length-2){requireSafe(b[i]===255,'invalid-image');const t=b[i+1];i+=2;if(t===218){requireSafe(i+2<=b.length,'invalid-image');const size=b.readUInt16BE(i);requireSafe(size>=2&&i+size<b.length,'invalid-image');i+=size;while(i<b.length){if(b[i++]!==255)continue;const marker=b[i++];if(marker===0||(marker>=0xd0&&marker<=0xd7))continue;requireSafe(marker===0xd9&&i===b.length,'image-metadata');return}requireSafe(false,'invalid-image')}
 requireSafe([0xe0,0xdb,0xc0,0xc4,0xdd].includes(t),'image-metadata');requireSafe(i+2<=b.length,'invalid-image');const n=b.readUInt16BE(i);requireSafe(n>=2&&i+n<=b.length,'invalid-image');
 if(t===0xe0)requireSafe(n===16&&b.toString('ascii',i+2,i+7)==='JFIF\0','image-metadata');i+=n;
 }requireSafe(false,'invalid-image');
}
function pngCRC(b){
 let c=0xffffffff;for(const v of b){c^=v;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0;
}
function inspectPNG(b){
 requireSafe(b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')),'invalid-png');
 let i=8,end=false,channels=0,dataSeen=false;const seen=new Set();
 const allowed=new Set(['IHDR','IDAT','IEND','sRGB','sBIT','gAMA','cHRM','pHYs','iCCP']);
 while(i<b.length){
  requireSafe(i+12<=b.length&&!end,'invalid-png');const n=b.readUInt32BE(i),t=b.toString('ascii',i+4,i+8);
  requireSafe(allowed.has(t)&&i+n+12<=b.length,'image-metadata');const p=b.subarray(i+8,i+8+n);
  requireSafe(pngCRC(b.subarray(i+4,i+8+n))===b.readUInt32BE(i+8+n),'invalid-png-crc');
  requireSafe((i===8)===(t==='IHDR')&&(t==='IDAT'||!seen.has(t)),'image-chunk-order');
  if(t==='IHDR'){
   requireSafe(n===13&&p.readUInt32BE(0)>0&&p.readUInt32BE(0)<=32768&&p.readUInt32BE(4)>0&&p.readUInt32BE(4)<=32768&&p[8]===8&&[2,6].includes(p[9])&&p[10]===0&&p[11]===0&&p[12]===0,'invalid-png-header');channels=p[9]===6?4:3;
  }else if(t==='IDAT'){requireSafe(channels>0&&n>0,'invalid-png');dataSeen=true}
  else if(t==='IEND'){requireSafe(n===0&&dataSeen,'invalid-png');end=true}
  else{
   requireSafe(!dataSeen,'image-chunk-order');
   if(t==='sBIT')requireSafe(n===channels&&[...p].every(v=>v>=1&&v<=8),'image-metadata');
   if(t==='sRGB')requireSafe(n===1&&p[0]<=3&&!seen.has('iCCP'),'image-metadata');
   if(t==='gAMA')requireSafe(n===4&&p.readUInt32BE(0)>0&&p.readUInt32BE(0)<=1000000,'image-metadata');
   if(t==='cHRM'){requireSafe(n===32,'image-metadata');for(let j=0;j<32;j+=8)requireSafe(p.readUInt32BE(j)<=100000&&p.readUInt32BE(j+4)<=100000&&p.readUInt32BE(j)+p.readUInt32BE(j+4)<=100000,'image-metadata')}
   if(t==='pHYs')requireSafe(n===9&&p[8]<=1&&p.readUInt32BE(0)>0&&p.readUInt32BE(4)>0&&p.readUInt32BE(0)<=10000000&&p.readUInt32BE(4)<=10000000,'image-metadata');
   if(t==='iCCP'){
    // Observed Windows encoder metadata was identified by digest, not assumed safe.
    // Independently synthesized from public Skia sRGB constants in privacy.test.cjs.
    // Only this exact public profile is admitted, never arbitrary ICC text/tags.
    requireSafe(!seen.has('sRGB')&&n>6&&n<=1024&&p.subarray(0,6).equals(Buffer.from('Skia\0\0')),'image-metadata');
    const z=require('node:zlib').inflateSync(p.subarray(6),{maxOutputLength:456,info:true});
    requireSafe(z.engine.bytesWritten===n-6&&z.buffer.length===456&&hash(z.buffer)==='12afb4d9953adee0607d347daee5b78b18d6b3cab2d572b88970703f5edb37bc','image-metadata');
   }
  }
  seen.add(t);i+=n+12;
 }
 requireSafe(end,'invalid-png');
}
function inspectObject(o){
 if(typeof o==='string'){scanText(o);return}if(!o||typeof o!=='object')return;
 if(typeof o.name==='string'&&'value'in o)requireSafe(!/authorization|cookie|token|secret|password|api[-_]?key/i.test(o.name),'private-header-or-field');
 for(const [k,v]of Object.entries(o)){
  if(/^(?:token|api[-_]?key|private[-_]?key|session[-_]?token|recovery[-_]?(?:token|code|key)|client[-_]?secret|access[-_]?token|refresh[-_]?token|secret|credential|credentials)$/i.test(k))requireSafe(v==null||v==='','private-credential-field');
  if(/^(cookies|origins|localStorage|sessionStorage|storageState|httpCredentials|postData|postDataJSON|password|passwd|accessToken|refreshToken|authorization)$/i.test(k))requireSafe(v==null||v===''||(Array.isArray(v)&&v.length===0),'private-state-or-body');
  if(['url','frameUrl','redirectURL'].includes(k)&&v) localURL(v,{blank:true});
  inspectObject(v);
 }
}
const unzipScript=String.raw`import zipfile,json,base64,sys,stat
with zipfile.ZipFile(sys.argv[1]) as z:
 infos=z.infolist()
 assert len(infos)<5000 and len({i.filename for i in infos})==len(infos)
 assert sum(i.file_size for i in infos)<64000000
 out=[]
 for i in infos:
  assert not i.is_dir() and not stat.S_ISLNK(i.external_attr>>16) and not (i.flag_bits&1)
  assert i.file_size<16000000 and i.compress_type in (0,8)
  out.append([i.filename,base64.b64encode(z.read(i)).decode()])
 print(json.dumps(out))`;
function zipEntries(f){return JSON.parse(execFileSync(process.env.PYTHON||'python',['-c',unzipScript,f],{encoding:'utf8',maxBuffer:100*1024*1024,stdio:['ignore','pipe','pipe']})).map(([n,b])=>[n,Buffer.from(b,'base64')])}
function inspectTrace(entries,build,source,allowedOrigin){
 const names=new Set(),resources=new Map(),referenced=new Set();let requests=0,contexts=0;
 for(const [n,b]of entries){requireSafe(safeName(n)&&!names.has(n),'zip-path-or-duplicate');names.add(n);if(n.startsWith('resources/'))resources.set(n.slice(10),b);else requireSafe(['trace.trace','trace.network','trace.stacks'].includes(n),'unknown-zip-entry')}
 for(const n of ['trace.trace','trace.network','trace.stacks'])requireSafe(names.has(n),'missing-trace-part');
 for(const [n,b]of entries){
  if(n==='trace.stacks'){const x=JSON.parse(b);requireSafe(x.files.every(f=>f==='<anonymous>'||f.replaceAll('\\','/').replace(/^async /,'').endsWith('/tests/select-round11/run.cjs')),'unknown-source-path');continue}
  if(n.startsWith('resources/'))continue;
  for(const line of b.toString('utf8').trim().split('\n')){
   if(!line)continue;const x=JSON.parse(line);inspectObject(x);
   if(x.type==='context-options'){contexts++;requireSafe(x.browserName==='webkit'&&x.origin==='library'&&!x.options.storageState&&!x.options.httpCredentials,'context-provenance')}
   if(x.type==='screencast-frame'){requireSafe(/^page@[a-f0-9]+-[0-9]+\.jpeg$/.test(x.sha1),'screencast-reference');referenced.add(x.sha1)}
   if(x.type==='resource-snapshot'){
    requests++;const s=x.snapshot,r=s.request,u=localURL(r.url);if(allowedOrigin)requireSafe(u.origin===allowedOrigin,'unexpected-loopback-origin');requireSafe(['127.0.0.1','::1'].includes(s.serverIPAddress),'non-loopback-server');requireSafe(r.method==='GET'&&(!r.bodySize||r.bodySize===-1)&&!r.postData,'request-body');
    const rel=u.pathname==='/'?'index.html':u.pathname.slice(1);requireSafe(build.has(rel)||rel==='favicon.ico','unknown-request-path');
    const requestHeaders=new Set(['accept','upgrade-insecure-requests','user-agent','accept-encoding','accept-language','connection','host','sec-fetch-dest','sec-fetch-mode','sec-fetch-site','origin','referer','cache-control','pragma']);
    const responseHeaders=new Set(['content-type','date','connection','keep-alive','content-length']);
    for(const [headers,allowed]of [[r.headers,requestHeaders],[s.response.headers,responseHeaders]])for(const h of headers){requireSafe(allowed.has(h.name.toLowerCase()),'unexpected-header');if(['origin','referer'].includes(h.name.toLowerCase()))localURL(h.value)}
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
const planFile=process.env.ROUND11_PHASE==='B'?'plan-b.json':'plan.json';
const plan=require('./'+planFile);
function expectedArtifacts(){
 const expected=new Set(['results.json']);
 for(const factor of plan.factors)for(let arm=0;arm<2;arm++)for(let iteration=1;iteration<=3;iteration++){const id=`${factor}-${arm}-${iteration}`;for(const f of [id+'.json',id+'-trace.zip',id+'-after.png',...['on','off','off2','on2'].map(n=>id+'-Select-'+n+'.png'),...(plan.arms[factor][arm].preScreenshot?[id+'-pre.png']:[]),...([...(plan.arms[factor][arm].groups.includes('Button')?['on','off','off2','on2'].map(n=>id+'-Button-'+n+'.png'):[]),...(plan.arms[factor][arm].groups.includes('Badge')?[id+'-Badge.png']:[]),...(plan.arms[factor][arm].groups.includes('Alert')?[id+'-Alert.png']:[])])])expected.add(f)}
 return expected;
}
function gate(root,env=process.env){
 requireSafe(env.GITHUB_ACTIONS==='true'&&/^\d+$/.test(env.GITHUB_RUN_ID||'')&&/^\d+$/.test(env.GITHUB_RUN_ATTEMPT||'')&&env.RUNNER_ENVIRONMENT==='github-hosted','ci-only-not-physical');
 requireSafe(env.ROUND11_RUNNER_EXIT==='0'&&env.ROUND11_AUDITOR_EXIT==='0','audit-or-runner-failed');
 root=path.resolve(root);requireSafe(!fs.lstatSync(root).isSymbolicLink(),'symlink-root');
 const read=n=>{requireSafe(safeName(n)&&!n.includes('/'),'unsafe-file-name');const f=path.join(root,n),s=fs.lstatSync(f);requireSafe(s.isFile()&&!s.isSymbolicLink()&&s.size<64*1024*1024,'unsafe-file');return fs.readFileSync(f)};
 const manifest=JSON.parse(read('SHA256SUMS.json')),d=JSON.parse(read('results.json'));
 requireSafe(d.github?.run===env.GITHUB_RUN_ID&&d.github?.attempt===env.GITHUB_RUN_ATTEMPT&&d.head===env.ROUND11_EXPECT_HEAD&&!d.dirty,'ci-provenance');
 requireSafe(d.rows?.length===plan.expectedSlotsPerEnvironment&&d.rows.every(r=>r.input==='Playwright automated, NOT physical'&&r.cleanup===true),'synthetic-provenance');
 for(const r of d.rows){const p=r.privacy;requireSafe(p?.freshContext===true&&p.physicalInput===false&&JSON.stringify(p.initialStorage)===JSON.stringify({cookies:[],origins:[]})&&p.externalRequests===0&&Array.isArray(p.blockedRequests)&&p.blockedRequests.length===0,'fresh-empty-context');localURL(p.allowedOrigin)}
 const expected=expectedArtifacts();
 requireSafe(JSON.stringify(Object.keys(manifest).sort())===JSON.stringify([...expected].sort()),'manifest-allowlist');
 requireSafe(JSON.stringify(fs.readdirSync(root).sort())===JSON.stringify([...expected,'SHA256SUMS.json'].sort()),'unmanifested-file');
 const git=args=>execFileSync('git',args,{cwd:repo,encoding:null});
 // Public source reviewed at the preserved baseline; any change requires a new privacy review.
 requireSafe(git(['diff','61b670c89eccc0b23565344385c8ae13d6c893ae','--','apps/v10','archive']).length===0,'public-source-changed');
 const build=new Map();for(const [n,h]of Object.entries(d.build||{})){requireSafe(safeName(n),'unsafe-build-path');const b=fs.readFileSync(path.join(repo,'.work/v10/dist',n));requireSafe(hash(b)===h,'build-provenance');build.set(n,h)}requireSafe(build.has('index.html'),'missing-build');
 const source=fs.readFileSync(path.join(__dirname,'run.cjs'));requireSafe(d.sources?.['tests/select-round11/run.cjs']===hash(source),'runner-provenance');
 for(const n of expected){const b=read(n);requireSafe(hash(b)===manifest[n],'artifact-hash');if(n.endsWith('.json'))inspectObject(JSON.parse(b));else if(n.endsWith('.zip'))inspectTrace(zipEntries(path.join(root,n)),build,source,d.rows.find(r=>r.traceFile===n)?.privacy.allowedOrigin);else if(n.endsWith('.png'))inspectPNG(b);else requireSafe(false,'unknown-file-type')}
 return {status:'PASS',scope:'fresh synthetic GitHub-hosted localhost Museum only',files:expected.size+1,pixelAssurance:'Provenance based; regex does not prove pixel privacy. Physical PC excluded.'};
}
module.exports={expectedArtifacts,inspectJPEG,inspectPNG,gate,localURL,scanText,inspectObject,inspectTrace,zipEntries,safeName};
if(require.main===module){try{console.log(JSON.stringify(gate(process.argv[2]||'.work/select-round11')))}catch(e){console.log(JSON.stringify({status:'BLOCKED',reason:/^[a-z-]+$/.test(e.message)?e.message:'unreadable-or-unrecognized-evidence'}));process.exitCode=1}}
