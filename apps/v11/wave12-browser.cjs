'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),cp=require('node:child_process'),a=require('node:assert/strict');
const C=require('./wave12-contract.cjs');
const root=path.resolve(process.env.APP_ROOT||'.work/wave12-app'),out=path.resolve(process.env.EVIDENCE_DIR||'.work/wave12-evidence');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const assets=['index.html','exhibits.js','exhibits.css',...Array.from({length:12},(_,i)=>[`wave${i+1}.js`,`wave${i+1}.css`]).flat()];
const execution=['wave12-browser.cjs','wave12-faults.cjs','wave12-audit.cjs','wave12-audit-negative.cjs','wave12-manifest.py','wave12-contract.cjs','wave12-test.cjs','wave12.js','wave12.css','wave12-baseline.json','package.json','package-lock.json','wave4-audit.cjs','wave4-contract.cjs'];
const scenarios=require('./wave12-audit.cjs').scenarios;
const matrix=()=>['chromium','webkit'].flatMap(engine=>[...['light','dark'].flatMap(theme=>[375,390,1280].map(width=>({engine,theme,width,zoom:1}))),{engine,theme:'dark',width:375,zoom:2}]);
const host=(p,id)=>p.locator(`[data-wave12="${id}"]`),key=(h,k)=>h.locator(`[data-key="${k}"]`);
const fontSelector='[data-wave12] input,[data-wave12] textarea,[data-wave12] button,[data-wave12] select,[data-wave12] output,[data-wave12] p,[data-wave12] li,[data-wave12] pre,[data-wave12] label,[data-wave12] legend,[data-wave12] summary,[data-wave12] h4,[data-wave12] h5,[data-wave12] h6';
async function exercise(p,row){
 row.steps=[];row.accessibility={};
 async function snap(name,operation){
  const x=await p.evaluate(selector=>{const states={},rendered={},fonts=[];for(const id of [157,158,159]){const h=document.querySelector(`[data-wave12="${id}"]`),r=h.getBoundingClientRect();if(r.width<=0||r.height<=0||getComputedStyle(h).visibility!=='visible')throw Error('invisible exhibit');states[id]=h.wave12.getState();const safe=h.cloneNode(true);for(const e of safe.querySelectorAll('textarea'))e.remove();rendered[id]={status:h.querySelector('[data-w12-status]').textContent,text:h.querySelector('[data-w12-result]').innerText,verdict:h.querySelector('[data-w12-verdict]')?.textContent??null,activeKey:h.contains(document.activeElement)?document.activeElement.dataset.key:null,reasons:[...h.querySelectorAll('[data-w12-reasons] li')].map(x=>x.textContent),current:h.querySelector('[data-w12-current]').textContent,resultJSON:h.querySelector('[data-w12-result] pre')?JSON.parse(h.querySelector('[data-w12-result] pre').textContent):null,historyJSON:id===159?JSON.parse(h.querySelector('[data-w12-history] pre').textContent):null};if(id===158){let input;try{input=states[id].scenario==='normal'?JSON.parse(states[id].input):window.Wave12.fixture(158,states[id].scenario);}catch{input=null;}const fields=Array.isArray(input?.fields)?input.fields.filter(Boolean):[];rendered[id].secretAbsent=fields.filter(f=>f.classification==='secret'&&typeof f.value==='string').every(f=>!safe.textContent.includes(f.value));rendered[id].publicPrivateAbsent=input?.destination!=='public'||fields.filter(f=>f.classification==='private'&&typeof f.value==='string').every(f=>!safe.textContent.includes(f.value));try{const x=JSON.parse(states[id].input);if(Array.isArray(x.fields))for(const f of x.fields)if(f&&typeof f==='object')f.value='[SOURCE-VALUE-REDACTED]';states[id].input=JSON.stringify(x,null,2);}catch{states[id].input='[INVALID-JSON]';}}}for(const e of document.querySelectorAll(selector))fonts.push({host:e.closest('[data-wave12]').dataset.wave12,tag:e.tagName,size:parseFloat(getComputedStyle(e).fontSize)});return {states,rendered,fonts,documentFits:document.documentElement.scrollWidth<=document.documentElement.clientWidth};},fontSelector);
  a.equal(x.documentFits,true,'document overflow');const recorded=structuredClone(operation);if(recorded.id===158&&recorded.type==='input'&&recorded.value!=='{')recorded.value=require('./wave12-audit.cjs').redactInput(recorded.value);row.steps.push({name,operation:recorded,...x});
 }
 await snap('initial',{kind:'initial'});
 for(const {name,operation:o} of require('./wave12-audit.cjs').operations().slice(1)){
  const h=host(p,o.id),e=key(h,o.type);
  if(o.type==='run'||o.type==='reset'){if(o.method==='Enter'||o.method==='Space'){await e.focus();await e.press(o.method);}else if(o.method==='tap')await e.tap();else await e.click();}
  else if(o.type==='scenario')await e.selectOption(o.name);
  else if(o.type==='input')await e.fill(o.value);
  await snap(name,o);
 }
 for(const id of [157,158,159]){const e=key(host(p,id),'run');await e.focus();await p.keyboard.press('Tab');const forward=await p.evaluate(()=>document.activeElement.dataset.key||null);await p.keyboard.press('Shift+Tab');const back=await e.evaluate(e=>document.activeElement===e);const focusVisible=await e.evaluate(e=>e.matches(':focus-visible')&&parseFloat(getComputedStyle(e).outlineWidth)>0);row.accessibility[id]={forward,back,focusVisible};a.equal(focusVisible,true,'focus-visible');a.equal(forward,'reset','native Tab');a.equal(back,true,'native Shift+Tab');await key(host(p,id),'reset').tap();}
 row.accessibility.reducedMotion=await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 require('./wave12-audit.cjs').validateSteps(row);
}
async function main(){
 if((process.env.LOCAL_ENGINE||process.env.CHROMIUM_EXECUTABLE)&&process.env.GITHUB_ACTIONS)throw Error('partial matrix prohibited in CI');
 fs.mkdirSync(out,{recursive:true});const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
 const git=(...args)=>cp.execFileSync('git',args).toString().trim();
 const report={schema:1,head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),ci:{event:process.env.GITHUB_EVENT_NAME||'local',eventSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,job:process.env.GITHUB_JOB||null,attempt:process.env.GITHUB_RUN_ATTEMPT||null,checkout:git('rev-parse','HEAD')},environment:{platform:process.platform,arch:process.arch,node:process.version,os:require('node:os').release(),playwright:require(path.join(process.env.PLAYWRIGHT_MODULE||'playwright','package.json')).version},source:Object.fromEntries(assets.map(f=>[f,hash(fs.readFileSync(path.join(root,f)))])),execution:Object.fromEntries(execution.map(f=>[f,hash(fs.readFileSync(path.join(root,f)))])),results:[]};
 fs.mkdirSync(path.join(out,'execution'),{recursive:true});for(const f of execution)fs.copyFileSync(path.join(root,f),path.join(out,'execution',f));
 const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
 const server=http.createServer((req,res)=>{const f=req.url.split('?')[0].slice(1)||'index.html';if(!assets.includes(f)){res.writeHead(404).end();return;}res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(root,f)));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{for(const c of matrix().filter(x=>!process.env.LOCAL_ENGINE||process.env.LOCAL_ENGINE===x.engine)){
  const id=`${c.engine}-${c.width}-${c.theme}-${c.zoom}`,row={...c,id,head:report.head,tree:report.tree,status:'FAIL',errors:[],responses:[]};report.results.push(row);let browser,ctx;
  try{browser=await pw[c.engine].launch({headless:true,...(c.engine==='chromium'&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});row.browserVersion=browser.version();ctx=await browser.newContext({viewport:{width:c.width,height:1000},hasTouch:true,reducedMotion:c.zoom===2?'reduce':'no-preference',recordHar:{path:path.join(out,id+'.har'),content:'embed',mode:'full'}});await ctx.tracing.start({screenshots:true,snapshots:true,sources:true});const p=await ctx.newPage();p.setDefaultTimeout(5000);await p.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());p.on('pageerror',e=>row.errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')row.errors.push(m.text());});const pending=[];
   p.on('response',response=>pending.push((async()=>{try{const f=new URL(response.url()).pathname.slice(1)||'index.html';if(assets.includes(f)){const b=await response.body();fs.mkdirSync(path.join(out,id),{recursive:true});fs.writeFileSync(path.join(out,id,f),b);row.responses.push({name:f,status:response.status(),size:b.length,sha256:hash(b),url:response.url()});}}catch(e){row.errors.push('capture:'+String(e));}})()));
   await p.goto(`http://127.0.0.1:${server.address().port}/?wave12-condition=${id}`);if(c.theme==='light')await p.locator('#theme').click();await p.locator('#search').fill('');a.equal(await p.locator('#gallery article').count(),159);
   for(const n of [157,158,159])a.ok((await p.locator(`article[data-id="${n}"] .description`).innerText()).length>10);
   row.fontCalibration=[];for(const id of [157,158,159]){await key(host(p,id),'run').click();row.fontCalibration.push({id,action:'run'});}
   row.baseline=await p.locator(fontSelector).evaluateAll(es=>{const r={};for(const e of es){const size=parseFloat(getComputedStyle(e).fontSize);if(r[e.tagName]&&Math.abs(r[e.tagName]-size)>.1)throw Error('nonuniform baseline '+e.tagName);r[e.tagName]=size;}for(const tag of ['TEXTAREA','BUTTON','SELECT','OUTPUT','P','PRE','LABEL','H4','LI'])if(!(r[tag]>0))throw Error('missing initial actual font baseline '+tag);return r;});
   for(const id of [157,158,159]){await key(host(p,id),'reset').click();row.fontCalibration.push({id,action:'reset'});}
   if(c.zoom===2)await p.addStyleTag({content:Object.entries(row.baseline).map(([tag,size])=>`.wave12 ${tag.toLowerCase()}{font-size:${size*2}px!important}`).join('')});
   await exercise(p,row);
   // Representative enlarged/dark captures only; all conditions retain raw state, HAR and trace.
   row.screenshots=[];if(c.zoom===2){for(const exhibit of [157,158,159]){await key(host(p,exhibit),'run').click();const file=id+'-exhibit-'+exhibit+'.png',bytes=await host(p,exhibit).screenshot({path:path.join(out,file)});row.screenshots.push({id:exhibit,file,size:bytes.length,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),sha256:hash(bytes)});}}
   await Promise.all(pending);for(const f of assets){const rs=row.responses.filter(x=>x.name===f);a.equal(rs.length,1,'single served asset '+f);a.equal(rs[0].status,200);a.equal(rs[0].sha256,report.source[f],'served bytes '+f);}a.deepEqual(row.errors,[]);row.status='PASS';
  }catch(e){row.error=e.stack;if(!browser)row.status='BLOCKED';}finally{if(ctx){await ctx.tracing.stop({path:path.join(out,id+'.zip')}).catch(e=>{row.errors.push('trace:'+e);row.status='FAIL';});await ctx.close().catch(e=>{row.errors.push('context:'+e);row.status='FAIL';});}if(browser)await browser.close().catch(e=>{row.errors.push('browser:'+e);row.status='FAIL';});save();}
 }}finally{await new Promise(r=>server.close(r));save();}
 console.log(JSON.stringify(report.results.map(r=>({id:r.id,status:r.status,error:r.error})),null,2));if(report.results.some(r=>r.status!=='PASS'))process.exitCode=1;
}
module.exports={matrix,scenarios,assets,execution,exercise};if(require.main===module)main();
