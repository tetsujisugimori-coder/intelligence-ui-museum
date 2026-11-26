'use strict';
const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),cp=require('node:child_process');
const C=require('./wave16-browser-contract.cjs');
const matrix=['chromium','webkit'].flatMap(engine=>['light','dark'].flatMap(theme=>[375,390,1280].map(width=>({engine,theme,width,zoom:1}))).concat({engine,theme:'dark',width:375,zoom:2}));
const assets=['index.html','exhibits.js','exhibits.css',...Array.from({length:13},(_,i)=>['wave'+(i+1)+'.js','wave'+(i+1)+'.css']).flat(),'wave14-mapping.js','wave14-join.js','wave14-scope.js','wave14.css','wave15.js','wave15.css','wave16.js','wave16.css'];
const execution=['wave16-browser.cjs','wave16-browser-contract.cjs','wave16-audit.cjs','wave16.test.cjs','wave15-manifest.py','package.json','package-lock.json'];
const workflow='v11-wave16.yml';
const tags=['input','select','button','output','p','li','label','h3','h4','dt','dd','pre'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const keyOf=c=>[c.engine,c.width,c.theme,c.zoom].join('-');
const fonts=host=>host.evaluate((h,tags)=>Object.fromEntries(tags.map(tag=>[tag,h.querySelector(tag)]).filter(([,el])=>el).map(([tag,el])=>[tag,parseFloat(getComputedStyle(el).fontSize)])),tags);
function controlFor(host,card,key){
 return key==='reset'?card.locator('[data-action=reset]'):host.locator(`[data-w16-${key}]`);
}
async function apply(host,card,op){
 const page=card.page();
 const categoryCycle=op.action==='category-cycle';
 const control=op.key==='gallery-search'?page.locator('#search'):categoryCycle
  ?page.locator('#filters button[data-cat]:not([data-cat="すべて"]):not([data-cat="インタラクション"])').first()
  :controlFor(host,card,op.key);
 await control.scrollIntoViewIfNeeded();
 const before=await control.evaluate(e=>{
  const r=e.getBoundingClientRect();
  return {control:[e.tagName,e.type||null],
    controlNamed:!!(e.getAttribute('aria-label')?.trim()||e.getAttribute('aria-labelledby')?.trim()||e.textContent.trim()||Array.from(e.labels??[]).some(l=>l.textContent.trim())),
    controlVisible:r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth};
 });
 const kind=before.control;
 if(categoryCycle){
  await control.press('Enter');
  const hiddenCount=await card.count();
  await page.locator('#filters button[data-cat="すべて"]').press('Enter');
  return {...before,hiddenCount,visibleCount:await card.count()};
 }
 if(op.action==='select'){a.equal(kind[0],'SELECT');await control.selectOption(op.value);}
 else if(op.action==='fill'){a.equal(kind[0],'INPUT');await control.fill(op.value);}
 else if(op.action==='enter'||op.action==='space'){
  a.equal(kind[0],'BUTTON');await control.focus();
  a.ok(await control.evaluate(e=>e===document.activeElement),'native button focus before key');
  await control.press(op.action==='enter'?'Enter':'Space');
 }else throw new Error('unknown operation: '+op.action);
 return {...before,value:op.action==='select'||op.action==='fill'?await control.inputValue():null};
}
async function observe(host){
 return host.evaluate(h=>{
  const r=h.getBoundingClientRect(),card=h.closest('.card').getBoundingClientRect();
  const fits=r.left>=card.left-.5&&r.right<=card.right+.5&&h.scrollWidth<=h.clientWidth+1&&document.documentElement.scrollWidth<=document.documentElement.clientWidth+1;
  const status=h.querySelector('[data-w16-status]'),history=[...h.querySelectorAll('[data-w16-history] li')];
  const active=document.activeElement,focus=active&&Object.keys(active.dataset).find(k=>/^w16[A-Z]/.test(k))?.slice(3).toLowerCase()||null;
  const snapshot=h.wave16.snapshot();
  return {state:status?.dataset.state??null,status:status?.innerText.trim()??null,snapshot,focus,
    details:h.querySelector('[data-w16-details]').innerText.trim(),
    historyCount:history.length,renderedHistory:history.map(e=>e.innerText.trim()),
    pageWidth:document.documentElement.clientWidth,pageScroll:document.documentElement.scrollWidth,
    hostWidth:h.clientWidth,hostScroll:h.scrollWidth,fits};
 });
}
async function main(){
 if(process.env.GITHUB_ACTIONS&&(process.env.LOCAL_ENGINE||process.env.CHROMIUM_EXECUTABLE))throw Error('Partial or substitute executable not allowed in Actions');
 const root=path.resolve(process.env.APP_ROOT||'.work/wave16-app'),out=path.resolve(process.env.EVIDENCE_DIR||'.work/wave16-evidence');
 const prHead=process.env.EXPECTED_HEAD||null;
 const git=(...xs)=>cp.execFileSync('git',xs,{encoding:'utf8'}).trim();
 const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
 if(prHead&&head!==prHead)throw Error('Wrong checked-out HEAD');
 const source=Object.fromEntries(assets.map(x=>[x,hash(fs.readFileSync(path.join(root,x)))]));
 const execRoot=path.join(out,'execution');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(execRoot);
 const executed=Object.fromEntries(execution.map(x=>{
  const active=path.join(__dirname,x),app=path.join(root,x),b=fs.readFileSync(active);
  a.ok(b.equals(fs.readFileSync(app)),'execution copies differ: '+x);
  fs.writeFileSync(path.join(execRoot,x),b,{flag:'wx'});
  return [x,hash(b)];
 }));
 const ci=fs.readFileSync(path.join('.github','workflows',workflow));
 fs.writeFileSync(path.join(execRoot,workflow),ci,{flag:'wx'});executed[workflow]=hash(ci);
 const pmod=process.env.PLAYWRIGHT_MODULE||'playwright';
 const pw=require(pmod),version=require(pmod+'/package.json').version;
 a.equal(version,'1.56.1');
 const report={head,tree,prHead,source,execution:executed,run:process.env.GITHUB_RUN_ID??null,attempt:process.env.GITHUB_RUN_ATTEMPT??null,event:process.env.GITHUB_EVENT_NAME??null,job:process.env.GITHUB_JOB??null,node:process.version,playwright:version,results:[]};
 const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
 const server=http.createServer((req,res)=>{
   const f=req.url.split('?')[0].slice(1)||'index.html';
   if(req.method!=='GET'||!assets.includes(f)){res.writeHead(404);res.end();return;}
   const b=fs.readFileSync(path.join(root,f));
   res.writeHead(200,{'Content-Type':f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html; charset=utf-8','Content-Length':b.length});
   res.end(b);
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const origin=`http://127.0.0.1:${server.address().port}`;
 save();
 try{
 for(const c of matrix.filter(x=>!process.env.LOCAL_ENGINE||x.engine===process.env.LOCAL_ENGINE)){
  const key=keyOf(c), row={...c,key,status:'INCOMPLETE',steps:{},font:{},search:{},keyboard:{},touch:{},navigation:{},scroll:{},consoleErrors:[],pageErrors:[],cleanupErrors:[],externalRequests:[],screenshots:[]};
  report.results.push(row);
  let browser,context,tracing=false;
  try{
   browser=await pw[c.engine].launch({headless:true,timeout:15000,...(c.engine==='chromium'&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
   row.browserVersion=browser.version();
   context=await browser.newContext({viewport:{width:c.width,height:900},hasTouch:c.zoom===2,reducedMotion:c.zoom===2?'reduce':'no-preference',serviceWorkers:'block',recordHar:{path:path.join(out,key+'.har'),content:'embed',mode:'full'}});
   await context.tracing.start({screenshots:true,snapshots:true,sources:true});tracing=true;
   const p=await context.newPage();p.setDefaultTimeout(5000);
   await p.route('**/*',r=>{
    if(new URL(r.request().url()).origin===origin)return r.continue();
    row.externalRequests.push(r.request().url());return r.abort();
   });
   p.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(m.text());});
   p.on('pageerror',e=>row.pageErrors.push(String(e)));
   await p.goto(origin+'/?wave16-condition='+key,{timeout:10000});
   if(c.theme==='light')await p.locator('#theme').click();
   row.themeObserved=await p.locator('body').evaluate(b=>b.classList.contains('light')?'light':'dark');
   row.reduced=await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
   row.viewport=await p.evaluate(()=>[innerWidth,innerHeight]);
   a.equal(await p.locator('#gallery article').count(),171);
   for(const id of C.ids){
    await p.locator('#search').fill(String(id));
    a.equal(await p.locator('#gallery article').count(),1);
    const card=p.locator(`article[data-id="${id}"]`),host=card.locator(`[data-wave16="${id}"]`);
    row.search[id]={count:await p.locator('#gallery article').count(),id:Number(await card.getAttribute('data-id'))};
    const detail=card.locator('.provenance summary');
    await detail.focus();await detail.press('Enter');
    const opened=await detail.evaluate(x=>x.parentElement.open);
    await detail.press('Enter');row.navigation[id]={opened,closed:!(await detail.evaluate(x=>x.parentElement.open))};
    // Measure a populated exhibit, including actual history text, then reset
    // before the independent plan. This scales the text seen during operations,
    // not only the empty controls that happened to exist before interaction.
    const baseline=host.locator('[data-w16-run]'),reset=controlFor(host,card,'reset');
    await baseline.click();
    const normal=await observe(host),before=await fonts(host);
    await reset.click();
    if(c.zoom===2)await p.addStyleTag({content:Object.entries(before).map(([tag,size])=>`[data-wave16="${id}"] ${tag}{font-size:${size*2}px!important}`).join('')});
    await baseline.click();
    const scaled=await observe(host);
    row.font[id]={before,after:await fonts(host),stateBefore:normal.state,stateAfter:scaled.state,historyBefore:normal.historyCount,historyAfter:scaled.historyCount};
    await reset.click();
    const origin=controlFor(host,card,C.origin[id]);
    await origin.focus();
    await p.keyboard.press('Tab');
    const next=await p.evaluate(()=>Object.keys(document.activeElement?.dataset??{}).find(k=>/^w16[A-Z]/.test(k))?.slice(3).toLowerCase()??null);
    await p.keyboard.press('Shift+Tab');
    row.keyboard[id]={next,returnFocus:await origin.evaluate(e=>e===document.activeElement&&e.matches(':focus-visible')&&parseFloat(getComputedStyle(e).outlineWidth)>0)};
    row.steps[id]=[];
    if(c.zoom===2){
     await controlFor(host,card,'reset').tap();
     row.touch[id]={emulated:true,focus:(await observe(host)).focus};
    }
    const last=controlFor(host,card,'reset');
    const visible=e=>{const r=e.getBoundingClientRect();return {y:scrollY,top:r.top,bottom:r.bottom,viewport:innerHeight};};
    const from=await last.evaluate(visible);await last.scrollIntoViewIfNeeded();
    const to=await last.evaluate(visible);row.scroll[id]={from,to};
    const ops=C.plan(id);
    for(const [i,op] of ops.entries()){
     const applied=await apply(host,card,op),record={operation:op,...applied,...await observe(host)};
     row.steps[id].push(record);C.checkRecord(id,record,op);
     if(c.zoom===2&&i===ops.length-2){
      const name=`${key}-${id}.png`,b=await host.screenshot({path:path.join(out,name),timeout:10000});
      row.screenshots.push({id,file:name,size:b.length,sha256:hash(b)});
     }
    }
   }
   C.checkCondition(row,c);
   row.status='PASS';
  }catch(e){row.status='FAIL';row.error=String(e.stack||e);}
  finally{
   if(tracing)await context.tracing.stop({path:path.join(out,key+'.trace.zip')}).catch(e=>{row.cleanupErrors.push(String(e));row.status='FAIL';});
   if(context)await context.close().catch(e=>{row.cleanupErrors.push(String(e));row.status='FAIL';});
   if(browser)await browser.close().catch(e=>{row.cleanupErrors.push(String(e));row.status='FAIL';});
   if(row.consoleErrors.length||row.pageErrors.length||row.cleanupErrors.length||row.externalRequests.length)row.status='FAIL';
   save();
  }
 }
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));save();}
 console.log(JSON.stringify(report.results.map(({key,status,error})=>({key,status,error})),null,2));
 if(report.results.length!==(process.env.LOCAL_ENGINE?7:14)||report.results.some(r=>r.status!=='PASS'))process.exitCode=1;
}
module.exports={matrix,assets,execution,workflow,keyOf};
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
