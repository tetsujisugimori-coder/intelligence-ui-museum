'use strict';
const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),cp=require('node:child_process');
const C=require('./wave14-browser-contract.cjs');
const matrix=['chromium','webkit'].flatMap(engine=>['light','dark'].flatMap(theme=>[375,390,1280].map(width=>({engine,theme,width,zoom:1}))).concat({engine,theme:'dark',width:375,zoom:2}));
const assets=['index.html','exhibits.js','exhibits.css',...Array.from({length:13},(_,i)=>['wave'+(i+1)+'.js','wave'+(i+1)+'.css']).flat(),'wave14-mapping.js','wave14-join.js','wave14-scope.js','wave14.css','wave15.js','wave15.css'];
const execution=['wave14-browser.cjs','wave14-browser-contract.cjs','wave14-audit.cjs','wave14-oracle-negative.test.cjs','wave14-manifest.py','package.json','package-lock.json'];
const workflow='v11-wave14.yml';
const tags=['input','select','button','output','p','li','label','h3','h4','dt','dd'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const keyOf=c=>[c.engine,c.width,c.theme,c.zoom].join('-');
const fonts=host=>host.evaluate((h,tags)=>Object.fromEntries(tags.map(tag=>[tag,h.querySelector(tag)]).filter(([,el])=>el).map(([tag,el])=>[tag,parseFloat(getComputedStyle(el).fontSize)])),tags);
async function apply(host,op){
 const control=host.locator(`[data-w14-key="${op.key}"]`);
 await control.scrollIntoViewIfNeeded();
 const kind=await control.evaluate(e=>[e.tagName,e.type||null]);
 if(op.action==='select'){a.equal(kind[0],'SELECT');await control.selectOption(op.value);}
 else if(op.action==='fill'){a.equal(kind[0],'INPUT');await control.fill(op.value);}
 else if(op.action==='enter'||op.action==='space'){
  a.equal(kind[0],'BUTTON');
  await control.focus();
  a.ok(await control.evaluate(e=>e===document.activeElement),'native button focus before key');
  await control.press(op.action==='enter'?'Enter':'Space');
 }else if(op.action==='click'){a.equal(kind[0],'BUTTON');await control.click();}
 else throw new Error('unknown operation: '+op.action);
 return kind;
}
async function observe(host){
 return host.evaluate(h=>{
  const r=h.getBoundingClientRect(),card=h.closest('.card').getBoundingClientRect();
  const fits=r.left>=card.left-.5&&r.right<=card.right+.5&&h.scrollWidth<=h.clientWidth+1&&document.documentElement.scrollWidth<=document.documentElement.clientWidth+1;
  const status=h.querySelector('[data-w14-status]');
  return {state:h.wave14.getState(),status:status?.innerText.trim()??null,text:h.innerText,
    focus:document.activeElement?.dataset.w14Key??null,
    outputs:[...h.querySelectorAll('[data-w14-output-key]')].map(e=>[e.dataset.w14OutputKey,e.innerText]),
    renderedHistory:[...h.querySelectorAll('[data-w14-history] li,[data-w14-status="history"] li')].map(e=>e.innerText),
    pageWidth:document.documentElement.clientWidth,pageScroll:document.documentElement.scrollWidth,
    hostWidth:h.clientWidth,hostScroll:h.scrollWidth,fits};
 });
}
async function main(){
 if(process.env.GITHUB_ACTIONS&&(process.env.LOCAL_ENGINE||process.env.CHROMIUM_EXECUTABLE))throw Error('Partial or substitute executable not allowed in Actions');
 const root=path.resolve(process.env.APP_ROOT||'.work/wave14-app'),out=path.resolve(process.env.EVIDENCE_DIR||'.work/wave14-evidence');
 const prHead=process.env.EXPECTED_HEAD||null;
 const git=(...xs)=>cp.execFileSync('git',xs,{encoding:'utf8'}).trim();
 const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
 if(prHead&&head!==prHead)throw Error('Wrong checked-out HEAD');
 const source=Object.fromEntries(assets.map(x=>[x,hash(fs.readFileSync(path.join(root,x)))]));
 const execRoot=path.join(out,'execution');fs.mkdirSync(execRoot);
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
  const key=keyOf(c), row={...c,key,status:'INCOMPLETE',steps:{},font:{},search:{},keyboard:{},touch:{},navigation:{},scroll:{},errors:[],externalRequests:[],screenshots:[]};
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
   p.on('console',m=>{if(m.type()==='error')row.errors.push(m.text());});
   p.on('pageerror',e=>row.errors.push(String(e)));
   await p.goto(origin+'/',{timeout:10000});
   if(c.theme==='light')await p.locator('#theme').click();
   row.themeObserved=await p.locator('body').evaluate(b=>b.classList.contains('light')?'light':'dark');
   row.reduced=await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
   row.viewport=await p.evaluate(()=>[innerWidth,innerHeight]);
   a.equal(await p.locator('#gallery article').count(),168);
   for(const id of C.ids){
    await p.locator('#search').fill(String(id));
    a.equal(await p.locator('#gallery article').count(),1);
    const card=p.locator(`article[data-id="${id}"]`),host=card.locator(`[data-wave14="${id}"]`);
    row.search[id]={count:await p.locator('#gallery article').count(),id:Number(await card.getAttribute('data-id'))};
    const detail=card.locator('.provenance summary');
    await detail.focus();await detail.press('Enter');
    const opened=await detail.evaluate(x=>x.parentElement.open);
    await detail.press('Enter');row.navigation[id]={opened,closed:!(await detail.evaluate(x=>x.parentElement.open))};
    const before=await fonts(host);
    if(c.zoom===2)await p.addStyleTag({content:Object.entries(before).map(([tag,size])=>`[data-wave14="${id}"] ${tag}{font-size:${size*2}px!important}`).join('')});
    row.font[id]={before,after:await fonts(host)};
    const origin=host.locator(`[data-w14-key="${C.origin[id]}"]`);
    await origin.focus();
    await p.keyboard.press('Tab');
    const next=await p.evaluate(()=>document.activeElement?.dataset.w14Key??null);
    await p.keyboard.press('Shift+Tab');
    row.keyboard[id]={next,returnFocus:await origin.evaluate(e=>e===document.activeElement&&e.matches(':focus-visible')&&parseFloat(getComputedStyle(e).outlineWidth)>0)};
    row.steps[id]=[];
    if(c.zoom===2){
     await host.locator('[data-w14-key="reset"]').tap();
     row.touch[id]={emulated:true,focus:(await observe(host)).focus};
    }
    const last=host.locator('[data-w14-key="reset"]');
    const visible=e=>{const r=e.getBoundingClientRect();return {y:scrollY,top:r.top,bottom:r.bottom,viewport:innerHeight};};
    const from=await last.evaluate(visible);await last.scrollIntoViewIfNeeded();
    const to=await last.evaluate(visible);row.scroll[id]={from,to};
    for(const op of C.plan(id)){
     const control=await apply(host,op), record={operation:op,control,...await observe(host)};
     row.steps[id].push(record);C.checkRecord(id,record,op);
    }
    if(c.zoom===2){
     const name=`${key}-${id}.png`,b=await host.screenshot({path:path.join(out,name),timeout:10000});
     row.screenshots.push({id,file:name,size:b.length,sha256:hash(b)});
    }
   }
   C.checkCondition(row,c);
   row.status='PASS';
  }catch(e){row.status='FAIL';row.error=String(e.stack||e);}
  finally{
   if(tracing)await context.tracing.stop({path:path.join(out,key+'.trace.zip')}).catch(e=>{row.errors.push(String(e));row.status='FAIL';});
   if(context)await context.close().catch(e=>{row.errors.push(String(e));row.status='FAIL';});
   if(browser)await browser.close().catch(e=>{row.errors.push(String(e));row.status='FAIL';});
   if(row.errors.length||row.externalRequests.length)row.status='FAIL';
   save();
  }
 }
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));save();}
 console.log(JSON.stringify(report.results.map(({key,status,error})=>({key,status,error})),null,2));
 if(report.results.length!==(process.env.LOCAL_ENGINE?7:14)||report.results.some(r=>r.status!=='PASS'))process.exitCode=1;
}
module.exports={matrix,assets,execution,workflow,keyOf};
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
