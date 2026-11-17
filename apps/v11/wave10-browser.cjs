'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),cp=require('node:child_process'),a=require('node:assert/strict');
const C=require('./wave10-contract.cjs');
const root=path.resolve(process.env.APP_ROOT||'.work/wave10-app'),out=path.resolve(process.env.EVIDENCE_DIR||'.work/wave10-evidence');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const assets=['index.html','exhibits.js','exhibits.css',...Array.from({length:10},(_,i)=>[`wave${i+1}.js`,`wave${i+1}.css`]).flat()];
const execution=['wave10-browser.cjs','wave10-faults.cjs','wave10-audit.cjs','wave10-audit-negative.cjs','wave10-manifest.py','wave10-contract.cjs','wave10-test.cjs','wave10.js','wave10.css','wave4-audit.cjs','wave4-contract.cjs'];
const scenarios={151:['budget','priority','duplicate','missing','fixed','structure'],152:['unknown','missing','type','unauthorized','wrong-id','stale','duplicate','timeout'],153:['required','format','forbidden','value','expectation','missing-output']};
const matrix=()=>['chromium','webkit'].flatMap(engine=>[...['light','dark'].flatMap(theme=>[375,390,1280].map(width=>({engine,theme,width,zoom:1}))),{engine,theme:'dark',width:375,zoom:2}]);
const host=(p,id)=>p.locator(`[data-wave10="${id}"]`),key=(h,k)=>h.locator(`[data-key="${k}"]`);
const fontSelector='[data-wave10] input,[data-wave10] textarea,[data-wave10] button,[data-wave10] select,[data-wave10] output,[data-wave10] p,[data-wave10] li,[data-wave10] pre,[data-wave10] label,[data-wave10] legend,[data-wave10] summary,[data-wave10] h4,[data-wave10] h5,[data-wave10] h6';
async function exercise(p,row){
 row.steps=[];row.accessibility={};
 async function snap(name){
  const x=await p.evaluate(selector=>{const states={},rendered={},fonts=[];for(const id of [151,152,153]){const h=document.querySelector(`[data-wave10="${id}"]`),r=h.getBoundingClientRect();if(r.width<=0||r.height<=0||getComputedStyle(h).visibility!=='visible')throw Error('invisible exhibit');states[id]=JSON.parse(h.querySelector('[data-w10-current]').textContent);rendered[id]={status:h.querySelector('[data-w10-status]').textContent,text:h.querySelector('[data-w10-result]').innerText,verdict:h.querySelector('[data-w10-verdict]')?.textContent??null,activeKey:h.contains(document.activeElement)?document.activeElement.dataset.key:null,capacity:h.querySelector('[data-w10-capacity]')?.textContent??null,included:[...h.querySelectorAll('[data-w10-included] li')].map(x=>x.textContent),excluded:[...h.querySelectorAll('[data-w10-excluded] li')].map(x=>x.textContent),stage:h.querySelector('[data-w10-stage]')?.textContent??null,ids:h.querySelector('[data-w10-ids]')?.textContent??null,history:[...h.querySelectorAll('[data-w10-history] li')].map(x=>x.textContent),payload:h.querySelector('[data-w10-payload]')?.textContent??null,rows:[...h.querySelectorAll('[data-w10-row]')].map(x=>({id:x.dataset.w10Row,heading:x.querySelector('h5').textContent,status:x.querySelector('p').textContent,checks:[...x.querySelectorAll('li')].map(l=>l.textContent)})),details:id===153?{open:h.querySelector('[data-w10-controls] details').open,headings:[...h.querySelectorAll('[data-w10-controls] details h4')].map(x=>x.textContent),texts:[...h.querySelectorAll('[data-w10-controls] details pre')].map(x=>x.textContent)}:null};}for(const e of document.querySelectorAll(selector))fonts.push({host:e.closest('[data-wave10]').dataset.wave10,tag:e.tagName,size:parseFloat(getComputedStyle(e).fontSize)});return {states,rendered,fonts,documentFits:document.documentElement.scrollWidth<=document.documentElement.clientWidth};},fontSelector);
  a.equal(x.documentFits,true,'document overflow');row.steps.push({name,...x});for(const id of [151,152,153])C.validateState(x.states[id]);
 }
 async function press(id,k,name,method='click'){const e=key(host(p,id),k);if(method==='Enter'||method==='Space'){await e.focus();await e.press(method);}else if(method==='tap')await e.tap();else await e.click();if(name)await snap(name);}
 await snap('initial');await host(p,153).locator('[data-w10-controls] details summary').click();await snap('153-details-open');await host(p,153).locator('[data-w10-controls] details summary').click();await snap('153-details-closed');
 for(const id of [151,152,153]){
  await press(id,'run',`${id}-normal`,'Enter');
  await key(host(p,id),'scenario').selectOption('normal');await snap(`${id}-same`);
  for(const scenario of scenarios[id]){await key(host(p,id),'scenario').selectOption(scenario);await snap(`${id}-${scenario}-edited`);await press(id,'run',`${id}-${scenario}`);}
  await press(id,'reset',`${id}-reset`,'Space');
  await press(id,'run',`${id}-restored`,'tap');
 }
 // Real priority editing (not a fixture mutation), same-value selection, and reset.
 await key(host(p,151),'priority-2').fill('9');await snap('151-priority-input-edited');await press(151,'run','151-priority-input');await key(host(p,151),'priority-2').fill('9');await snap('151-priority-input-same');await press(151,'reset','151-priority-input-reset');await press(151,'run','151-priority-input-restored');
 // Real input edits invalidate results; reset restores the documented origin focus.
 await key(host(p,151),'budget').fill('0');await snap('151-budget-zero-edited');await press(151,'run','151-budget-zero');await press(151,'reset','151-final-reset');
 await key(host(p,152),'args').fill('{"key":"beta"}');await snap('152-args-edited');await press(152,'run','152-args');await key(host(p,152),'tool').selectOption('sum');await snap('152-tool-edited');await key(host(p,152),'args').fill('{"a":2,"b":3}');await press(152,'run','152-sum');await key(host(p,152),'tool').selectOption('delete');await key(host(p,152),'args').fill('{"key":"alpha"}');await press(152,'run','152-delete');await press(152,'reset','152-final-reset');
 await key(host(p,153),'scenario').selectOption('missing-output');await snap('153-edit-again');await press(153,'reset','153-final-reset');
 for(const id of [151,152,153]){const e=key(host(p,id),'run');await e.focus();await p.keyboard.press('Tab');const forward=await p.evaluate(()=>document.activeElement.dataset.key||null);await p.keyboard.press('Shift+Tab');const back=await e.evaluate(e=>document.activeElement===e);const focusVisible=await e.evaluate(e=>e.matches(':focus-visible')&&parseFloat(getComputedStyle(e).outlineWidth)>0);row.accessibility[id]={forward,back,focusVisible};a.equal(focusVisible,true,'focus-visible');a.equal(forward,'reset','native Tab');a.equal(back,true,'native Shift+Tab');await press(id,'reset',null,'tap');}
 row.accessibility.reducedMotion=await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 require('./wave10-audit.cjs').validateSteps(row);
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
   await p.goto(`http://127.0.0.1:${server.address().port}/?wave10-condition=${id}`);if(c.theme==='light')await p.locator('#theme').click();await p.locator('#search').fill('');a.equal(await p.locator('#gallery article').count(),153);
   for(const n of [151,152,153])a.ok((await p.locator(`article[data-id="${n}"] .description`).innerText()).length>10);
   row.baseline=await p.locator(fontSelector).evaluateAll(es=>{const r={};for(const e of es){const size=parseFloat(getComputedStyle(e).fontSize);if(r[e.tagName]&&Math.abs(r[e.tagName]-size)>.1)throw Error('nonuniform baseline '+e.tagName);r[e.tagName]=size;}for(const tag of ['INPUT','TEXTAREA','BUTTON','SELECT','OUTPUT','P','LI','PRE','LABEL','SUMMARY','H4'])if(!(r[tag]>0))throw Error('missing initial actual font baseline '+tag);r.H5=r.H4;r.H6=r.H4;return r;});
   if(c.zoom===2)await p.addStyleTag({content:Object.entries(row.baseline).map(([tag,size])=>`.wave10 ${tag.toLowerCase()}{font-size:${size*2}px!important}`).join('')});
   await exercise(p,row);
   // Representative enlarged/dark captures only; all conditions retain raw state, HAR and trace.
   row.screenshots=[];if(c.zoom===2){for(const exhibit of [151,152,153]){await key(host(p,exhibit),'run').click();const file=id+'-exhibit-'+exhibit+'.png',bytes=await host(p,exhibit).screenshot({path:path.join(out,file)});row.screenshots.push({id:exhibit,file,size:bytes.length,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),sha256:hash(bytes)});}}
   await Promise.all(pending);for(const f of assets){const rs=row.responses.filter(x=>x.name===f);a.equal(rs.length,1,'single served asset '+f);a.equal(rs[0].status,200);a.equal(rs[0].sha256,report.source[f],'served bytes '+f);}a.deepEqual(row.errors,[]);row.status='PASS';
  }catch(e){row.error=e.stack;}finally{if(ctx){await ctx.tracing.stop({path:path.join(out,id+'.zip')}).catch(e=>{row.errors.push('trace:'+e);row.status='FAIL';});await ctx.close().catch(e=>{row.errors.push('context:'+e);row.status='FAIL';});}if(browser)await browser.close().catch(e=>{row.errors.push('browser:'+e);row.status='FAIL';});save();}
 }}finally{await new Promise(r=>server.close(r));save();}
 console.log(JSON.stringify(report.results.map(r=>({id:r.id,status:r.status,error:r.error})),null,2));if(report.results.some(r=>r.status!=='PASS'))process.exitCode=1;
}
module.exports={matrix,scenarios,assets,execution,exercise};if(require.main===module)main();
