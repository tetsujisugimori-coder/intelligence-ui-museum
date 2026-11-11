'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const http=require('node:http');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
const planFile='plan.json';
const engine=process.env.ROUND13_ENGINE||'webkit';
if(!['webkit','chromium'].includes(engine))throw Error('engine');
const plan=require('./'+planFile);
const {selectors,requireSnapshot,styleState}=require('../select-round12/targets.cjs');
const {probe}=require('../select-round12/probe.cjs');
const {capture}=require('./snapshot.cjs');
const repo=path.resolve(__dirname,'../..');
const pwRoot=path.join(repo,'tools/stage-a-browser/node_modules');
const output=path.resolve(process.env.ROUND13_OUT||'.work/select-round13');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=a=>execFileSync('git',a,{cwd:repo,encoding:'utf8'}).trim();
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(path.join(d,x.name)):[path.join(d,x.name)]);
const assert=(condition,message)=>{if(!condition)throw Error(message)};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const frame=p=>p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
if(fs.existsSync(output))throw Error('ROUND13_OUT must not exist; historical evidence must be immutable');
fs.mkdirSync(output,{recursive:true});
const old=fs.readFileSync(path.join(repo,'tests/select-path-pilot/reference/original-browser.cjs'),'utf8');
assert(hash(old)==='a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1','historical prelude changed');
const helpers=old.slice(old.indexOf('function visible(e)'),old.indexOf('const server=http'));
const preludePrefix=old.slice(old.indexOf("    await check('environment'"),old.indexOf("    await check('Select'"));
const {measure}=require('../../apps/v10/scripts/stage2r-focus-pixels.cjs');
const env={fs,path,modules:pwRoot,out:output,measure,assert,frames:frame,require,snapshot};
const {ring,prelude}=new Function(...Object.keys(env),`${helpers.replace('const g=await l.evaluate',"const captureSnapshot=prefix.endsWith('-Select')?await snapshot(l):null; const g=await l.evaluate").replace('return {...g,...measured,','return {...g,clip,captureSnapshot,...measured,')}\nreturn {ring,prelude:async function(p,id,row,check){const theme='light',text=100,width=375;${preludePrefix}}};`)(...Object.values(env));
function slots(){
 const rows=[];
 for(let iteration=1;iteration<=plan.repeats;iteration++)
  for(const condition of plan.conditions)
   for(const observer of (iteration%2?plan.observerArms:[...plan.observerArms].reverse()))
    rows.push({id:`${condition}-${observer}-${iteration}`,condition,iteration,observer,fullProbe:observer==='on',clearEmptyStyle:true});
 return rows;
}
async function switchSnapshot(p){return p.evaluate(()=>{const s=document.querySelector('#Switch [role=switch]'),b=document.querySelector('#Switch input[type=checkbox]');return {checked:s?.getAttribute('aria-checked'),disabled:s?.disabled,checkboxChecked:b?.checked,html:document.querySelector('#Switch')?.outerHTML}})}
async function snapshot(t){return requireSnapshot(await t.evaluate(capture,selectors));}
// Common sampling in both arms; not an observation-free baseline.
async function transition(t,phase){
 return t.evaluate((e,phase)=>{
  const base=getComputedStyle(e),after=getComputedStyle(e,'::after');
  return {phase,time:performance.now(),focused:document.activeElement===e,
   hasFocus:document.hasFocus(),focusVisible:e.matches(':focus-visible'),
   expanded:e.getAttribute('aria-expanded'),rect:e.getBoundingClientRect().toJSON(),
   scroll:{x:scrollX,y:scrollY},
   style:{outline:base.outline,shadow:base.boxShadow,afterOutline:after.outline,afterShadow:after.boxShadow}};
 },phase);
}
function resultClass(row){
 if(row.captureError||row.cleanup!==true)return {diagnostic:'INCOMPLETE',outline:'UNKNOWN',reason:row.captureError||'context not cleanly closed'};
 if(row.status!=='COMPLETE')return {diagnostic:'INCOMPLETE',outline:'UNKNOWN',reason:row.error||row.captureError||'not complete'};
 if(row.pageErrors?.length)return {diagnostic:'INCOMPLETE',outline:'UNKNOWN',reason:'pageerror'};
 if(row.fullProbe&&(!row.events?.length||row.overflow))return {diagnostic:'INCOMPLETE',outline:'UNKNOWN',reason:'missing/overflow events'};
 if(!row.paint||typeof row.paint.pass!=='boolean'||!row.paint.captureSnapshot||!row.final||!row.acquisition)return {diagnostic:'INCOMPLETE',outline:'UNKNOWN',reason:'missing paint/snapshots'};
 if(!row.final.focused||!row.final.hasFocus)return {diagnostic:'COMPLETE',outline:'FOCUS_LOST',cause:'UNKNOWN'};
 return {diagnostic:'COMPLETE',outline:row.paint.pass?'VISIBLE':row.paint.changed===0?'ABSENT':'INSUFFICIENT',cause:'UNKNOWN'};
}
const comparisons=()=>plan.conditions.flatMap(condition=>Array.from({length:plan.repeats},(_,i)=>({
 condition,iteration:i+1,
 arms:plan.observerArms.map(observer=>{
  const r=data.rows.find(x=>x.id===`${condition}-${observer}-${i+1}`);
  return {observer,id:r?.id,diagnostic:r?.classification?.diagnostic,transition:r?.transitions?.map(t=>({phase:t.phase,focused:t.focused,focusVisible:t.focusVisible,expanded:t.expanded}))};
 }),
 causalStatus:'UNKNOWN'
})));
const serve=http.createServer((req,res)=>{
 if(req.url==='/favicon.ico')return res.writeHead(204).end();
 try{
  const root=fs.realpathSync(path.join(repo,'.work/v10/dist'));
  const u=new URL(req.url,'http://localhost');
  const rel=decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname);
  const f=fs.realpathSync(path.resolve(root,'.'+rel));
  assert(f.startsWith(root+path.sep),'outside root');
  res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'application/octet-stream');
  res.end(fs.readFileSync(f));
 }catch{res.writeHead(404).end();}
});
const data={
 schema:2,engine,plan,planHash:hash(fs.readFileSync(path.join(__dirname,planFile))),
 head:git(['rev-parse','HEAD']),tree:git(['rev-parse','HEAD^{tree}']),dirty:git(['status','--porcelain']),
 system:{platform:process.platform,os:os.release(),node:process.version},
 product:{},build:{},sources:{},rows:[],started:new Date().toISOString(),
 github:{run:process.env.GITHUB_RUN_ID||null,attempt:process.env.GITHUB_RUN_ATTEMPT||null}
};
async function trial(browser,s){
 const row={...s,status:'INCOMPLETE',steps:[],samples:{},pageErrors:[],consoleErrors:[],images:[],checks:[],started:new Date().toISOString(),browser:browser.version(),input:'Playwright automated, NOT physical'};
 let context,p;
 const step=async(name,fn)=>{
  const a={name,started:Date.now(),success:false};row.steps.push(a);
  try{const v=await fn();a.success=true;return v;}finally{a.finished=Date.now();}
 };
 try{
  context=await browser.newContext({viewport:plan.viewport,colorScheme:'light',deviceScaleFactor:1});
  row.privacy={freshContext:true,physicalInput:false,initialStorage:await context.storageState(),allowedOrigin:`http://127.0.0.1:${serve.address().port}`,blockedRequests:[],externalRequests:0};
  await context.route('**/*',async route=>{
   const url=route.request().url();
   if(new URL(url).origin===row.privacy.allowedOrigin)return route.continue();
   row.privacy.blockedRequests.push({urlSha256:hash(url),method:route.request().method()});
   return route.abort('blockedbyclient');
  });
  context.on('response',r=>{if(new URL(r.url()).origin!==row.privacy.allowedOrigin)row.privacy.externalRequests++});
  await context.tracing.start({title:plan.id+':'+s.id,screenshots:true,snapshots:true,sources:true});
  p=await context.newPage();p.setDefaultTimeout(5000);
  if(s.fullProbe)await p.addInitScript(probe);
  p.on('pageerror',e=>row.pageErrors.push(String(e)));
  p.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(m.text())});
  await step('goto',()=>p.goto(`http://127.0.0.1:${serve.address().port}/?theme=light&text=100`));
  await p.locator('#Button .stage button').waitFor();
  await p.evaluate(()=>document.fonts.ready);
  const h=p.locator('#Select h2'),t=p.locator(selectors.trigger);
  row.observerInstalled=await p.evaluate(()=>!!window.__path);
  assert(row.observerInstalled===s.fullProbe,'observer installation mismatch');
  row.samples.beforePrelude=await snapshot(t);
  const checkbox=p.locator('#Switch input[type=checkbox]').first();
  const operations=plan.histories[s.condition];
  assert(Array.isArray(operations),'unregistered history');
  row.operations=[];
  for(const slot of ['setup','first','second']){
   const op=slot==='setup'?operations.find(x=>x==='setup-on'):operations.filter(x=>x!=='setup-on')[slot==='first'?0:1];
   const before={select:await snapshot(t),switch:await switchSnapshot(p)};
   if(op)await step('switch-'+op,async()=>{if(op.endsWith('on'))await checkbox.check();else await checkbox.uncheck();assert(await checkbox.isChecked()===op.endsWith('on'),'checkbox operation state');assert(await p.locator('#Switch [role=switch]').isDisabled()===op.endsWith('on'),'disabled state');});
   row.operations.push({slot,op:op||null,before,after:{select:await snapshot(t),switch:await switchSnapshot(p)}});
  }
  row.switchFinal=await switchSnapshot(p);
  await step('normalize',async()=>{await h.evaluate(e=>{e.scrollIntoView({block:'center'});document.activeElement?.blur()});await frame(p)});
  row.samples.beforePhoto=await snapshot(t);
  if(s.preScreenshot)await step('pre-screenshot',async()=>{row.preImage=s.id+'-pre.png';await p.screenshot({path:path.join(output,row.preImage)})});
  row.samples.afterPhoto=await snapshot(t);
  if(s.clearEmptyStyle)await step('normalize-empty-style',async()=>{
   row.samples.beforeStyleNormalization=await snapshot(t);
   await p.evaluate(sel=>{
    const boxes=[...document.querySelectorAll(sel.checkbox)];
    const values=[...document.querySelectorAll(sel.valueInput)],hidden=values[0];
    if(values.length!==1)throw Error('value input ambiguous');
    if(boxes.length!==1||!hidden||boxes[0]===hidden)throw Error('normalization nodes ambiguous');
    for(const el of [boxes[0],hidden]){
     if(el.hasAttribute('style')&&el.getAttribute('style')!=='')throw Error('nonempty style; no silent cleanup');
     if(el.hasAttribute('style'))el.removeAttribute('style');
    }
   },selectors);
   row.samples.afterStyleNormalization=await snapshot(t);
  });
  if(s.emptyStyle)await step('empty-style-diagnostic',async()=>{
   await snapshot(t);
   await p.evaluate(sel=>{
    const nodes=[...document.querySelectorAll(sel.checkbox)];
    const values=[...document.querySelectorAll(sel.valueInput)],hidden=values[0];
    if(values.length!==1)throw Error('value input ambiguous');
    if(nodes.length!==1||!hidden||nodes[0]===hidden)throw Error('marker nodes ambiguous');
    for(const el of [nodes[0],hidden]){
     if(el.hasAttribute('style'))throw Error('marker preexists; cannot isolate');
     el.setAttribute('style','');
    }
   },selectors);
  });
  row.samples.beforeHistory=await snapshot(t);
  await step('pointer-history',()=>h.click());
  row.samples.beforeFocus=await snapshot(t);
  await step('acquire',async()=>{row.tabRoute=[];await t.focus();});
  row.acquisition=await snapshot(t);
  row.transitions=[await transition(t,'acquisition')];
  await step('open',async()=>{
   await p.keyboard.press('Space');
   row.transitions.push(await transition(t,'afterSpace'));
   await p.waitForFunction(()=>document.querySelector('#Select .stage [role=button]')?.getAttribute('aria-expanded')==='true');
   await p.getByRole('option',{name:'カード',exact:true}).waitFor({state:'visible'});
  });
  row.samples.open=await snapshot(t);
  await step('escape',async()=>{
   await p.keyboard.press('Escape');
   row.transitions.push(await transition(t,'afterEscape'));
   await p.waitForFunction(()=>{
    const e=document.querySelector('#Select .stage [role=button]');
    return e?.getAttribute('aria-expanded')==='false'&&!document.getElementById(e?.getAttribute('aria-controls'));
   });
  });
  row.final=await snapshot(t);
  assert(row.transitions.length===3,'transition inventory');
  row.paint=await ring(p,t,row.id+'-Select');row.images.push(...row.paint.images);
  row.status='COMPLETE';
 }catch(err){row.error=String(err);}
 finally{
  if(p){
   try{
    row.afterImage=s.id+'-after.png';
    await p.screenshot({path:path.join(output,row.afterImage)});
    if(s.fullProbe)Object.assign(row,await p.evaluate(()=>({events:window.__path?.events||[],overflow:window.__path?.overflow||false})));
    else{row.events=null;row.overflow=null;}
   }catch(err){row.captureError=String(err);}
  }
  if(context){
   try{
    row.traceFile=s.id+'-trace.zip';
    await context.tracing.stop({path:path.join(output,row.traceFile)});
   }catch(err){row.captureError=String(err);}
   // A failed trace export must not skip context teardown or contaminate later slots.
   try{await context.close();row.cleanup=true;}
   catch(err){row.captureError=[row.captureError,String(err)].filter(Boolean).join('; ');row.cleanup=false;}
  }
  row.finished=new Date().toISOString();row.classification=resultClass(row);
  fs.writeFileSync(path.join(output,s.id+'.json'),JSON.stringify(row,null,2));
  console.log(s.id,row.classification.diagnostic,row.classification.outline,row.error||'');
 }
 return row;
}
(async()=>{
 let browser;
 try{
  const pw=require(path.join(pwRoot,'playwright'));
  data.playwright=require(path.join(pwRoot,'playwright/package.json')).version;
  data.sdkVersion=JSON.parse(fs.readFileSync(path.join(repo,'.work/v10/node_modules/@openai/apps-sdk-ui/package.json'))).version;
  assert(data.playwright===plan.playwright,'Playwright version');
  assert(data.sdkVersion===plan.sdkVersion,'SDK version');
  for(const f of ['src/main.tsx','src/main.css','src/select-focus-return.ts','package.json','package-lock.json']){
   const originalFile=fs.readFileSync(path.join(repo,'apps/v10',f));
   const workingFile=fs.readFileSync(path.join(repo,'.work/v10',f));
   assert(hash(originalFile)===hash(workingFile),'product byte mismatch '+f);
   data.product[f]=hash(originalFile);
  }
  data.build=Object.fromEntries(files(path.join(repo,'.work/v10/dist')).map(f=>[path.relative(path.join(repo,'.work/v10/dist'),f).split(path.sep).join('/'),hash(fs.readFileSync(f))]));
  data.sources=Object.fromEntries(files(__dirname).map(f=>[path.relative(repo,f).split(path.sep).join('/'),hash(fs.readFileSync(f))]));
  await new Promise(resolve=>serve.listen(0,'127.0.0.1',resolve));
  data.executableOverride=process.env.ROUND13_EXECUTABLE||null;browser=await pw[engine].launch(data.executableOverride?{executablePath:data.executableOverride}:{});
  for(const s of slots())data.rows.push(await trial(browser,s));
 }catch(err){data.fatal=String(err);}
 finally{
  if(browser)try{await browser.close();data.browserClosed=true}catch(err){data.browserCloseError=String(err)}
  serve.close();
 }
 const identities=slots();
 for(const s of identities)if(!data.rows.some(r=>r.id===s.id))data.rows.push({...s,status:'NOT_TESTED',reason:data.fatal||'not reached',classification:{diagnostic:'NOT_TESTED',outline:'UNKNOWN'}});
 data.finished=new Date().toISOString();
 data.pairs=comparisons();
 const errors=[];
 if(data.fatal)errors.push('fatal: '+data.fatal);
 if(!data.browserClosed)errors.push('browser not cleanly closed');
 if(data.playwright!==plan.playwright||data.sdkVersion!==plan.sdkVersion)errors.push('version mismatch');
 if(data.rows.length!==plan.expectedSlotsPerEnvironment)errors.push('missing slots');
 if(new Set(data.rows.map(r=>r.id)).size!==plan.expectedSlotsPerEnvironment)errors.push('duplicate identities');
 for(const r of data.rows)if(r.classification?.diagnostic!=='COMPLETE')errors.push('incomplete '+r.id+': '+(r.error||r.classification?.reason||r.reason||'unknown'));
 data.validation=errors;
 data.rootCause='UNKNOWN';data.stage3='HOLD';data.oldOffscreenClick='NOT_TESTED';
 data.exitCode=errors.length?1:0;
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(data,null,2));
 fs.writeFileSync(path.join(output,'SHA256SUMS.json'),JSON.stringify(Object.fromEntries(files(output).filter(f=>!f.endsWith('SHA256SUMS.json')).map(f=>[path.basename(f),hash(fs.readFileSync(f))])),null,2));
 console.log(JSON.stringify({head:data.head,tree:data.tree,rows:data.rows.length,pairs:data.pairs,validation:data.validation,exitCode:data.exitCode},null,2));
 process.exitCode=data.exitCode;
})();
