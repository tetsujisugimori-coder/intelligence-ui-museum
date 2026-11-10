'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const http=require('node:http');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
const planFile=process.env.ROUND11_PHASE==='B2'?'plan-b2.json':process.env.ROUND11_PHASE==='B'?'plan-b.json':'plan.json';
const plan=require('./'+planFile);
const {selectors,capture,requireSnapshot,styleState}=require('./targets.cjs');
const {probe}=require('../select-factor-pilot/probe.cjs');
const repo=path.resolve(__dirname,'../..');
const pwRoot=path.join(repo,'tools/stage-a-browser/node_modules');
const output=path.resolve(process.env.ROUND11_OUT||'.work/select-round11');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=a=>execFileSync('git',a,{cwd:repo,encoding:'utf8'}).trim();
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(path.join(d,x.name)):[path.join(d,x.name)]);
const assert=(condition,message)=>{if(!condition)throw Error(message)};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const frame=p=>p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
if(fs.existsSync(output))throw Error('ROUND11_OUT must not exist; historical evidence must be immutable');
fs.mkdirSync(output,{recursive:true});
const old=fs.readFileSync(path.join(repo,'tests/select-path-pilot/reference/original-browser.cjs'),'utf8');
assert(hash(old)==='a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1','historical prelude changed');
const helpers=old.slice(old.indexOf('function visible(e)'),old.indexOf('const server=http'));
const preludePrefix=old.slice(old.indexOf("    await check('environment'"),old.indexOf("    await check('Select'"));
const {measure}=require('../../apps/v10/scripts/stage2r-focus-pixels.cjs');
const env={fs,path,modules:pwRoot,out:output,measure,assert,frames:frame,require,snapshot};
const {ring,prelude}=new Function(...Object.keys(env),`${helpers.replace('const g=await l.evaluate',"const captureSnapshot=prefix.endsWith('-Select')?await snapshot(l):null; const g=await l.evaluate").replace('return {...g,...measured,','return {...g,clip,captureSnapshot,...measured,')}\nreturn {ring,prelude:async function(p,id,row,check){const theme='light',text=100,width=375;${preludePrefix}}};`)(...Object.values(env));
// Same frozen Switch actions/assertions, split only at the registered observer boundary.
async function splitSwitch(p,id,row,check){
 await check('environment',async()=>{const d=await p.evaluate(()=>({focus:document.hasFocus(),visibility:document.visibilityState,theme:document.documentElement.dataset.theme,font:getComputedStyle(document.documentElement).fontSize}));assert(d.focus&&d.visibility==='visible'&&d.theme==='light'&&d.font==='16px','environment mismatch');return d});
 const control=p.locator('#Switch [role=switch]'),out=p.locator('#Switch output');
 await check('SwitchPrefix',async()=>{
  await control.click();assert(await control.getAttribute('aria-checked')==='true'&&(await out.innerText()).includes('ON'),'Switch ON');
  await control.focus();await p.keyboard.press('Space');assert(await control.getAttribute('aria-checked')==='false'&&(await out.innerText()).includes('OFF'),'Switch OFF');
  return {mouseON:true,spaceOFF:true};
 });
 await check('SwitchDisabled',async()=>{
  const box=p.locator('#Switch input[type=checkbox]').first();await box.check();assert(await control.isDisabled(),'Switch disabled');
  if(!row.omitDisabledNoop)await control.evaluate(e=>e.click());assert(await control.getAttribute('aria-checked')==='false','disabled Switch changed');
  await box.uncheck();return {disabledStable:true};
 });
}
function slots(){
 const rows=[];
 for(let iteration=1;iteration<=plan.repeats;iteration++){
  for(const factor of plan.factors){
   for(const arm of (iteration%2?[0,1]:[1,0])){
    rows.push({id:`${factor}-${arm}-${iteration}`,factor,arm,iteration,...plan.arms[factor][arm]});
   }
  }
 }
 return rows;
}
async function snapshot(t){
 return requireSnapshot(await t.evaluate(capture,selectors));
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
const comparisons=()=> {
 const out=[];
 for(const factor of plan.factors)for(let i=1;i<=plan.repeats;i++){
  const a=data.rows.find(x=>x.factor===factor&&x.iteration===i&&x.arm===0);
  const b=data.rows.find(x=>x.factor===factor&&x.iteration===i&&x.arm===1);
  const errors=[];
  if(!a||!b||[a,b].some(x=>x.classification.diagnostic!=='COMPLETE'))errors.push('incomplete-trial');
  if(a&&b){
   const x=a.samples?.beforeFocus,y=b.samples?.beforeFocus;
   if(!x||!y)errors.push('missing-before-focus');
   else{
    for(const k of ['scroll','viewport','font','theme','hasFocus','visibility'])if(!equal(x[k],y[k]))errors.push(`mismatch:${k}`);
    if(factor==='empty-style'){
     if(x.htmlNoEmptyStyle!==y.htmlNoEmptyStyle)errors.push('unexpected-DOM-difference');
     if(x.styleNodeCount!==1||y.styleNodeCount!==1)errors.push('ambiguous-disabled-node');
     const xa=x.disabled?.[0]?.attrs,xb=y.disabled?.[0]?.attrs;
     if(Object.hasOwn(xa||{},'style')||xb?.style!==''||Object.hasOwn(x.hidden?.attrs||{},'style')||y.hidden?.attrs?.style!=='')errors.push('marker-intervention-not-isolated');
    }else if(factor==='pre-screenshot'){
     const px=a.samples?.beforePhoto,py=b.samples?.beforePhoto;
     for(const k of ['html','scroll','viewport','font','theme'])if(!equal(px?.[k],py?.[k]))errors.push('pre-photo-different:'+k);
     for(const [label,ex,ey] of [['trigger',px?.trigger,py?.trigger],['checkbox',px?.disabled?.[0],py?.disabled?.[0]],['value',px?.hidden,py?.hidden]])for(const k of ['rect','computed'])if(!equal(ex?.[k],ey?.[k]))errors.push('pre-photo-'+label+'-different:'+k);
     // The post-photo DOM may differ; that is the observation being tested.
    }else if(x.html!==y.html)errors.push('target-DOM-different');
    for(const [label,ex,ey] of [['trigger',x.trigger,y.trigger],['checkbox',x.disabled?.[0],y.disabled?.[0]],['value',x.hidden,y.hidden]])for(const k of ['rect','computed'])if(!equal(ex?.[k],ey?.[k]))errors.push(`${label}-${k}-different`);
   }
  }
  out.push({factor,iteration:i,armA:a?.id,armB:b?.id,equivalence:errors.length?'UNCONFIRMED':'CONFIRMED_TARGET',errors,observed:a&&b?{outline:[a.classification.outline,b.classification.outline],focusVisible:[a.acquisition?.focusVisible,b.acquisition?.focusVisible],domStyle:[a.samples?.beforeFocus?.disabled?.[0]?.attrs?.style??null,b.samples?.beforeFocus?.disabled?.[0]?.attrs?.style??null]}:null,rootCause:'UNKNOWN'});
 }
 return out;
};
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
 schema:1,plan,planHash:hash(fs.readFileSync(path.join(__dirname,planFile))),
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
  row.samples.beforePrelude=await snapshot(t);
  await step('groups',()=> (plan.phase?splitSwitch:prelude)(p,s.id,row,async(name,fn)=>{
   if(!s.observedGroups.includes(name))return;
   const c={name,executed:s.groups.includes(name),pass:false,before:await snapshot(t)};row.checks.push(c);
   await p.evaluate(value=>value,'ROUND11_BEGIN:'+name);
   c.detail=c.executed?await fn():{sham:true};await p.evaluate(value=>value,'ROUND11_END:'+name);c.after=await snapshot(t);c.pass=true;
  }));
  assert(equal(row.checks.map(c=>c.name),s.observedGroups),'group execution order');
  row.switchFinal=await p.evaluate(()=>{const s=document.querySelector('#Switch [role=switch]'),b=document.querySelector('#Switch input[type=checkbox]');return {checked:s?.getAttribute('aria-checked'),disabled:s?.disabled,checkboxChecked:b?.checked}});
  assert(row.switchFinal.checked==='false'&&row.switchFinal.disabled===false&&row.switchFinal.checkboxChecked===false,'Switch final OFF/enabled');
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
  await step('acquire',()=>t.focus());
  row.acquisition=await snapshot(t);
  await step('open',async()=>{
   await p.keyboard.press('Space');
   await p.waitForFunction(()=>document.querySelector('#Select .stage [role=button]')?.getAttribute('aria-expanded')==='true');
   await p.getByRole('option',{name:'カード',exact:true}).waitFor({state:'visible'});
  });
  row.samples.open=await snapshot(t);
  await step('escape',async()=>{
   await p.keyboard.press('Escape');
   await p.waitForFunction(()=>{
    const e=document.querySelector('#Select .stage [role=button]');
    return e?.getAttribute('aria-expanded')==='false'&&!document.getElementById(e?.getAttribute('aria-controls'));
   });
  });
  row.final=await snapshot(t);
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
  browser=await pw.webkit.launch();
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

