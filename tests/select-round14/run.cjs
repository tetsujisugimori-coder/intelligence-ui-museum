'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const http=require('node:http');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
const planFile='plan.json';
const engine=process.env.ROUND14_ENGINE||'webkit';
if(!['webkit','chromium'].includes(engine))throw Error('engine');
const plan=require('./'+planFile);
const {selectors,requireSnapshot,styleState}=require('../select-round12/targets.cjs');
const {probe}=require('./probe.cjs');
const {slots,classify,comparisons}=require('./model.cjs');
const phase=process.env.ROUND14_PHASE||'formal';
const mono=()=>Number(process.hrtime.bigint())/1e6;
const {capture}=require('./snapshot.cjs');
const {resolveCalls}=require('./caller.cjs');
const repo=path.resolve(__dirname,'../..');
const pwRoot=path.join(repo,'tools/stage-a-browser/node_modules');
const output=path.resolve(process.env.ROUND14_OUT||'.work/select-round14');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=a=>execFileSync('git',a,{cwd:repo,encoding:'utf8'}).trim();
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(path.join(d,x.name)):[path.join(d,x.name)]);
const assert=(condition,message)=>{if(!condition)throw Error(message)};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const frame=p=>p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
if(fs.existsSync(output))throw Error('ROUND14_OUT must not exist; historical evidence must be immutable');
fs.mkdirSync(output,{recursive:true});
const old=fs.readFileSync(path.join(repo,'tests/select-path-pilot/reference/original-browser.cjs'),'utf8');
assert(hash(old)==='a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1','historical prelude changed');
const helpers=old.slice(old.indexOf('function visible(e)'),old.indexOf('const server=http'));
const preludePrefix=old.slice(old.indexOf("    await check('environment'"),old.indexOf("    await check('Select'"));
const {measure}=require('../../apps/v10/scripts/stage2r-focus-pixels.cjs');
const env={fs,path,modules:pwRoot,out:output,measure,assert,frames:frame,require,snapshot};
const {ring,prelude}=new Function(...Object.keys(env),`${helpers.replace('const g=await l.evaluate',"const captureSnapshot=prefix.endsWith('-Select')?await snapshot(l):null; const g=await l.evaluate").replace('return {...g,...measured,','return {...g,clip,captureSnapshot,...measured,')}\nreturn {ring,prelude:async function(p,id,row,check){const theme='light',text=100,width=375;${preludePrefix}}};`)(...Object.values(env));
async function snapshot(t){return requireSnapshot(await t.evaluate(capture,selectors));}
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
 schema:1,engine,phase,plan,planHash:hash(fs.readFileSync(path.join(__dirname,planFile))),
 head:git(['rev-parse','HEAD']),tree:git(['rev-parse','HEAD^{tree}']),dirty:git(['status','--porcelain']),
 system:{platform:process.platform,os:os.release(),node:process.version},
 product:{},build:{},sources:{},rows:[],started:new Date().toISOString(),
 github:{run:process.env.GITHUB_RUN_ID||null,attempt:process.env.GITHUB_RUN_ATTEMPT||null}
};
async function trial(browser,s){
 const row={...s,status:'INCOMPLETE',steps:[],pageErrors:[],consoleErrors:[],images:[],started:new Date().toISOString(),browser:browser.version(),input:'Playwright automated, NOT physical'};
 let context,p;
 const step=async(name,fn)=>{const a={name,start:mono(),success:false};row.steps.push(a);try{const v=await fn();a.success=true;return v}finally{a.end=mono()}};
 try{
  context=await browser.newContext({viewport:plan.viewport,colorScheme:'light',deviceScaleFactor:1,reducedMotion:'no-preference'});
  row.privacy={freshContext:true,physicalInput:false,initialStorage:await context.storageState(),allowedOrigin:`http://127.0.0.1:${serve.address().port}`,blockedRequests:[],externalRequests:0};
  await context.route('**/*',async route=>{const url=route.request().url();if(new URL(url).origin===row.privacy.allowedOrigin)return route.continue();row.privacy.blockedRequests.push({urlSha256:hash(url),method:route.request().method()});return route.abort('blockedbyclient')});
  context.on('response',r=>{if(new URL(r.url()).origin!==row.privacy.allowedOrigin)row.privacy.externalRequests++});
  if(s.tracing)await context.tracing.start({title:plan.id+':'+s.id,screenshots:true,snapshots:true,sources:true});
  p=await context.newPage();p.setDefaultTimeout(5000);
  if(s.probe)await p.addInitScript(probe);
  p.on('pageerror',e=>row.pageErrors.push(String(e)));p.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(m.text())});
  await step('goto',()=>p.goto(row.privacy.allowedOrigin+'/?theme=light&text=100'));
  await p.locator('#Button .stage button').waitFor();await p.evaluate(()=>document.fonts.ready);
  const t=p.locator(selectors.trigger),h=p.locator('#Select h2'),checkbox=p.locator('#Switch input[type=checkbox]').first();
  row.probeInstalled=await p.evaluate(()=>!!window.__round14);assert(row.probeInstalled===s.probe,'probe installation');
  row.initial=await snapshot(t);
  row.switchInitial={checked:await checkbox.isChecked(),disabled:await p.locator('#Switch [role=switch]').isDisabled()};
  assert(!row.switchInitial.checked&&!row.switchInitial.disabled,'initial Switch');
  for(const op of plan.histories[s.condition])await step('switch-'+op,async()=>{if(op==='on')await checkbox.check();else await checkbox.uncheck();assert(await checkbox.isChecked()===(op==='on'),'checkbox');assert(await p.locator('#Switch [role=switch]').isDisabled()===(op==='on'),'Switch disabled')});
  row.switchFinal={checked:await checkbox.isChecked(),disabled:await p.locator('#Switch [role=switch]').isDisabled()};
  await step('normalize',async()=>{await h.evaluate(e=>{e.scrollIntoView({block:'center'});document.activeElement?.blur()});await frame(p)});
  await step('normalize-empty-style',()=>p.evaluate(sel=>{for(const query of [sel.checkbox,sel.valueInput]){const nodes=[...document.querySelectorAll(query)];if(nodes.length!==1)throw Error('normalization inventory');const el=nodes[0];if(el.hasAttribute('style')&&el.getAttribute('style')!=='')throw Error('nonempty style');if(el.hasAttribute('style'))el.removeAttribute('style')}},selectors));
  await step('pointer-history',()=>h.click());row.beforeFocus=await snapshot(t);
  await step('acquire',()=>t.focus());
  await step('open',async()=>{await p.keyboard.press('Space');await p.getByRole('option',{name:'カード',exact:true}).waitFor({state:'visible'})});
  await step('escape',()=>p.keyboard.press('Escape'));
  row.intervention={kind:s.experiment==='caller'?'NONE':s.arm,start:mono(),apiStart:null,apiEnd:null,budgetMs:s.experiment==='measurement'&&s.arm!=='A0'?plan.matchDelayMs:0};
  const iv=row.intervention;
  if(s.experiment==='measurement'&&['A1','A2','A3'].includes(s.arm)){
   iv.apiStart=mono();
   if(s.arm==='A1')iv.result=await p.evaluate(()=>null);
   if(s.arm==='A2')iv.result=await snapshot(t);
   if(s.arm==='A3'){iv.image=s.id+'-intermediate.png';await p.screenshot({path:path.join(output,iv.image)});row.images.push(iv.image)}
   iv.apiEnd=mono();
  }
  iv.apiDuration=iv.apiEnd===null?0:iv.apiEnd-iv.apiStart;iv.overrun=iv.budgetMs>0&&mono()-iv.start>iv.budgetMs;
  if(iv.budgetMs>0){const left=iv.budgetMs-(mono()-iv.start);if(left>0)await new Promise(resolve=>setTimeout(resolve,left))}
  iv.end=mono();row.finalStart=mono();row.final=await snapshot(t);row.finalEnd=mono();
  assert(row.final.expanded==='false','Select did not close');
  row.paint=await ring(p,t,row.id+'-Select');row.images.push(...row.paint.images);
  row.status='COMPLETE';
 }catch(e){row.error=String(e)}
 finally{
  if(p&&s.probe)try{Object.assign(row,await p.evaluate(()=>window.__round14));}catch(e){row.captureError=String(e)}
  if(!s.probe){row.events=null;row.calls=null;row.overflow=null}
  if(context){try{if(s.tracing){row.traceFile=s.id+'-trace.zip';await context.tracing.stop({path:path.join(output,row.traceFile)})}else row.traceFile=null}catch(e){row.captureError=String(e)}try{await context.close();row.cleanup=true}catch(e){row.captureError=String(e);row.cleanup=false}}
  row.callers=resolveCalls(row.calls,path.join(repo,'.work/v10/dist'));row.finished=new Date().toISOString();row.classification=classify(row);fs.writeFileSync(path.join(output,s.id+'.json'),JSON.stringify(row,null,2));console.log(s.id,row.classification.diagnostic,row.classification.outline,row.error||'');
 }
 return row;
}
(async()=>{
 let browser;
 try{
  const pw=require(path.join(pwRoot,'playwright'));data.playwright=require(path.join(pwRoot,'playwright/package.json')).version;data.sdkVersion=JSON.parse(fs.readFileSync(path.join(repo,'.work/v10/node_modules/@openai/apps-sdk-ui/package.json'))).version;
  assert(data.playwright===plan.playwright,'Playwright version');assert(data.sdkVersion===plan.sdkVersion,'SDK version');
  for(const f of ['src/main.tsx','src/main.css','src/select-focus-return.ts','package.json','package-lock.json']){const a=fs.readFileSync(path.join(repo,'apps/v10',f)),b=fs.readFileSync(path.join(repo,'.work/v10',f));assert(hash(a)===hash(b),'product byte mismatch');data.product[f]=hash(a)}
  data.build=Object.fromEntries(files(path.join(repo,'.work/v10/dist')).map(f=>[path.relative(path.join(repo,'.work/v10/dist'),f).split(path.sep).join('/'),hash(fs.readFileSync(f))]));
  data.sources=Object.fromEntries(files(__dirname).map(f=>[path.relative(repo,f).split(path.sep).join('/'),hash(fs.readFileSync(f))]));
  await new Promise(resolve=>serve.listen(0,'127.0.0.1',resolve));data.executableOverride=process.env.ROUND14_EXECUTABLE||null;browser=await pw[engine].launch(data.executableOverride?{executablePath:data.executableOverride}:{});
  for(const s of slots(phase))data.rows.push(await trial(browser,s));
 }catch(e){data.fatal=String(e)}finally{if(browser)try{await browser.close();data.browserClosed=true}catch(e){data.browserCloseError=String(e)}serve.close()}
 for(const s of slots(phase))if(!data.rows.some(r=>r.id===s.id))data.rows.push({...s,status:'NOT_TESTED',classification:{diagnostic:'NOT_TESTED',outline:'UNKNOWN',cause:'UNKNOWN'}});
 data.finished=new Date().toISOString();data.pairs=comparisons(data.rows,phase);data.validation=[];
 if(data.fatal)data.validation.push('fatal');if(!data.browserClosed)data.validation.push('browser-close');for(const r of data.rows)if(r.classification.diagnostic!=='COMPLETE')data.validation.push(r.id);
 data.rootCause='UNKNOWN';data.stage3='HOLD';data.productAcceptance='NO';data.exitCode=data.validation.length?1:0;
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(data,null,2));fs.writeFileSync(path.join(output,'SHA256SUMS.json'),JSON.stringify(Object.fromEntries(files(output).map(f=>[path.basename(f),hash(fs.readFileSync(f))])),null,2));process.exitCode=data.exitCode;
})();
