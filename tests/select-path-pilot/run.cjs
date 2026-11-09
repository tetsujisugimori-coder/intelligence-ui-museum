'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),os=require('node:os'),{execFileSync}=require('node:child_process');
const plan=require('./plan.json'),{slots,classify,validateRun}=require('./contract.cjs'),{probe}=require('./probe.cjs');
const repo=path.resolve(__dirname,'../..'),modules=path.join(repo,'tools/stage-a-browser/node_modules'),pw=require(path.join(modules,'playwright'));
const out=path.resolve(process.env.PATH_OUT||'.work/path-pilot'),engine=process.env.PATH_ENGINE||'webkit';
if(fs.existsSync(out))throw Error('Fresh output required');if(!['webkit','chromium'].includes(engine))throw Error('Unknown engine');fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const assert=(x,m)=>{if(!x)throw Error(m);},frames=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.join(d,e.name)]);
const original=fs.readFileSync(path.join(__dirname,'reference/original-browser.cjs'),'utf8');assert(sha(original)===plan.oldReferenceSha256,'Original reference hash');
const helpers=original.slice(original.indexOf('function visible(e)'),original.indexOf('const server=http'));
const prefix=original.slice(original.indexOf("    await check('environment'"),original.indexOf("    await check('Select'"));
const {measure}=require('../../apps/v10/scripts/stage2r-focus-pixels.cjs');
const env={fs,path,modules,out,measure,assert,frames,require};
const {ring,prelude}=new Function(...Object.keys(env),`${helpers.replace('return {...g,...measured,', 'return {...g,clip,...measured,')}\nreturn {ring,prelude:async function(p,id,row,check){const theme='light',text=100,width=375;${prefix}}};`)(...Object.values(env));
const sources=Object.fromEntries(files(__dirname).filter(f=>/\.(cjs|json)$/.test(f)).map(f=>[path.relative(repo,f).split(path.sep).join('/'),sha(fs.readFileSync(f))]));
const productFiles=['src/main.tsx','src/main.css','src/select-focus-return.ts','package.json','package-lock.json'];
const product=Object.fromEntries(productFiles.map(f=>{const b=fs.readFileSync(path.join(repo,'.work/v10',f));assert(sha(b)===sha(fs.readFileSync(path.join(repo,'apps/v10',f))),'Product preservation '+f);return [f,sha(b)];}));
const builds={};for(const [name,dir]of Object.entries({museum:'.work/v10/dist',sdk:'.work/sdk-parity/dist-detail'}))builds[name]=Object.fromEntries(files(path.join(repo,dir)).map(f=>[path.relative(path.join(repo,dir),f).split(path.sep).join('/'),sha(fs.readFileSync(f))]));
const sdkVersion=JSON.parse(fs.readFileSync(path.join(repo,'.work/v10/node_modules/@openai/apps-sdk-ui/package.json'))).version;assert(sdkVersion==='0.2.2','SDK version');
const sdkProvenance=JSON.parse(fs.readFileSync(path.join(repo,'.work/sdk-parity/provenance/detail.json')));
const server=http.createServer((q,s)=>{try{const u=new URL(q.url,'http://localhost'),segments=decodeURIComponent(u.pathname).split('/').filter(Boolean),type=segments.shift();assert(['museum','sdk'].includes(type),'type');const base=fs.realpathSync(path.join(repo,type==='museum'?'.work/v10/dist':'.work/sdk-parity/dist-detail'));const f=fs.realpathSync(path.resolve(base,segments.join('/')||'index.html'));assert(f.startsWith(base+path.sep),'outside');s.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'application/octet-stream');s.end(fs.readFileSync(f));}catch{s.writeHead(404).end();}});
const snapshot=async p=>p.evaluate(()=>{const t=document.querySelector('#Select .stage [role=button],[data-parity-trigger]'),o=document.querySelector('[role=option][data-option-id="b"]')||document.querySelector('[role=option]');return {time:performance.now(),active:{tag:document.activeElement?.tagName,id:document.activeElement?.id},scroll:{x:scrollX,y:scrollY},trigger:t?.getBoundingClientRect().toJSON(),option:o?.getBoundingClientRect().toJSON()??null};});
async function trial(browser,slot){
 const row={...slot,engine,browserVersion:browser.version(),sdkVersion,viewport:plan.viewport,theme:plan.theme,rootPercent:100,input:'Playwright keyboard/pointer plus locator.focus; NOT physical',status:'INCOMPLETE',errors:[],console:[],operations:[],selectKeys:[],checks:[],images:[],started:new Date().toISOString(),normalClick:null,cleanup:false};
 let context,p,selectRecording=false;const museum=slot.cohort.includes('museum'),condition=slot.cohort.replace('B-sdk-','');
 const op=async(name,argument,fn)=>{const r={name,argument,started:Date.now(),success:false};row.operations.push(r);try{const v=await fn();r.success=true;return v;}catch(e){r.error=String(e);throw e;}finally{r.finished=Date.now();}};
 try{
  context=await browser.newContext({viewport:plan.viewport,colorScheme:'light',deviceScaleFactor:1});await context.tracing.start({screenshots:true,snapshots:true,sources:true});p=await context.newPage();p.setDefaultTimeout(5000);p.on('pageerror',e=>row.errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')row.console.push(m.text());});await p.addInitScript(probe);
  const press=p.keyboard.press.bind(p.keyboard);p.keyboard.press=(key,...args)=>{if(selectRecording)row.selectKeys.push(key);return op('key',key,()=>press(key,...args));};
  await op('goto',museum?'museum':'sdk',()=>p.goto(`http://127.0.0.1:${server.address().port}/${museum?'museum/?theme=light&text=100':`sdk/?condition=${condition}`}`));
  const t=p.locator(museum?'#Select .stage [role=button]':'[data-parity-trigger]');
  if(museum){await p.bringToFront();await p.locator('#Button .stage button').waitFor();await p.evaluate(()=>document.fonts.ready);const check=async(name,fn)=>{const c={name,pass:false};row.checks.push(c);c.detail=await fn();c.pass=true;};await prelude(p,row.id,row,check);}else await t.waitFor();
  row.initial=await snapshot(p);row.preImage=row.id+'-before-acquisition.png';await p.screenshot({path:path.join(out,row.preImage)});await t.evaluate(e=>window.s3Opener=e);
  row.acquireEventStart=await p.evaluate(()=>window.__path.seq);
  await op('acquire',slot.route,async()=>{
   if(slot.route==='tab'){if(museum){let found=false;for(let n=0;n<60;n++){if(await p.locator('#Select input[type=checkbox]').evaluate(e=>document.activeElement===e)){found=true;break;}await p.keyboard.press('Shift+Tab');}assert(found,'Tab anchor not reached');await p.keyboard.press('Tab');}else{await p.locator('#before').focus();await p.keyboard.press('Tab');}}
   else {await t.focus();if(slot.route==='legacy'){await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');}}
  });
  row.acquisition=await t.evaluate(e=>({focused:e===document.activeElement,active:document.activeElement?.id||document.activeElement?.tagName,seq:window.__path.seq,time:performance.now(),rect:e.getBoundingClientRect().toJSON()}));assert(row.acquisition.focused,'Acquisition target');
  // Acquisition assertion RPC includes geometry; no additional screenshot wait. Timing equivalence UNKNOWN.
  selectRecording=true;
  if(slot.cohort==='A-museum-old'){
   const v=p.locator('#official-select');await p.keyboard.press('Space');
   try{await op('ordinary-option-click','カード',()=>p.getByRole('option',{name:'カード',exact:true}).click());row.normalClick={success:true};}catch(e){row.normalClick={success:false,error:String(e)};row.clickFailureSnapshot=await snapshot(p);throw e;}
   await p.waitForFunction(()=>document.activeElement===window.s3Opener,null,{timeout:2000});assert(await v.inputValue()==='b','mouse selection');await frames(p);await op('mouse-move',[0,0],()=>p.mouse.move(0,0));
   await p.keyboard.press('Space');await p.getByRole('option',{name:'カード',exact:true}).waitFor();await p.locator('[data-option-id="b"][data-highlight]').waitFor();await p.waitForFunction(()=>document.activeElement?.id.startsWith('select-list-'),null,{timeout:2000});await p.keyboard.press('ArrowUp');await p.locator('[data-option-id="a"][data-highlight]').waitFor();await p.keyboard.press('Enter');await p.waitForFunction(()=>document.activeElement===window.s3Opener&&window.s3Opener.getAttribute('aria-expanded')==='false',null,{timeout:2000});assert(await v.inputValue()==='a','keyboard selection');await frames(p);
   await p.keyboard.press('Space');await p.getByRole('option',{name:'カード',exact:true}).waitFor();await p.keyboard.press('Escape');await p.waitForFunction(()=>document.activeElement===window.s3Opener&&window.s3Opener.getAttribute('aria-expanded')==='false',null,{timeout:2000});assert(await v.inputValue()==='a','Escape value');
  }else{
   await p.keyboard.press('ArrowDown');await p.waitForFunction(()=>window.s3Opener?.getAttribute('aria-expanded')==='true');
   if(!museum){row.sdkBefore=await t.evaluate(e=>({triggerOuterHTML:e.outerHTML,expanded:e.getAttribute('aria-expanded'),popupId:e.getAttribute('aria-controls'),popupPresent:!!document.getElementById(e.getAttribute('aria-controls')),css:Array.from(document.styleSheets).map(s=>{try{return Array.from(s.cssRules).map(r=>r.cssText).join('')}catch{return 'inaccessible'}}).join('\n')}));row.sdkBefore.cssHash=sha(row.sdkBefore.css);delete row.sdkBefore.css;}
   await p.keyboard.press('Escape');await p.waitForFunction(()=>window.s3Opener?.getAttribute('aria-expanded')==='false'&&!document.getElementById(window.s3Opener.getAttribute('aria-controls')));
  }
  selectRecording=false;
  row.beforePaint=await snapshot(p);
  row.final=await t.evaluate(e=>({time:performance.now(),focused:document.activeElement===e,active:document.activeElement?.id||document.activeElement?.tagName,focusVisible:e.matches(':focus-visible'),expanded:e.getAttribute('aria-expanded')==='true',value:document.querySelector('#official-select')?.value??document.querySelector('#value')?.textContent,rect:e.getBoundingClientRect().toJSON(),outline:getComputedStyle(e).outline,afterOutline:getComputedStyle(e,'::after').outline,scroll:{x:scrollX,y:scrollY},viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,scale:visualViewport?.scale}}));
  row.paint=await ring(p,t,row.id+'-Select');row.images.push(...row.paint.images);row.status='COMPLETE';
 }catch(e){row.error=String(e);}finally{
  if(p){try{row.finalImage=row.id+'-after-sequence.png';await p.screenshot({path:path.join(out,row.finalImage)});const a=await p.evaluate(()=>({events:window.__path?.events??[],overflow:window.__path?.overflow??false,sdkEvents:window.__parity?.events??null}));Object.assign(row,a);}catch(e){row.captureError=String(e);}}
  if(context){try{row.traceFile=row.id+'-trace.zip';await context.tracing.stop({path:path.join(out,row.traceFile)});await context.close();row.cleanup=true;}catch(e){row.cleanupError=String(e);}}
  row.finished=new Date().toISOString();row.classification=classify(row);fs.writeFileSync(path.join(out,row.id+'.json'),JSON.stringify(row,null,2));console.log(row.id,row.classification.diagnostic,row.classification.offscreen,row.classification.outline,row.error||'');
 }
 return row;
}
(async()=>{const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH)):{};const data={schema:1,planId:plan.id,plan,engine,platform:process.platform,os:os.release(),node:process.version,playwright:require(path.join(modules,'playwright/package.json')).version,head:git(['rev-parse','HEAD']),tree:git(['rev-parse','HEAD^{tree}']),github:{sha:process.env.GITHUB_SHA??null,head:event.pull_request?.head?.sha??null,run:process.env.GITHUB_RUN_ID??null,attempt:process.env.GITHUB_RUN_ATTEMPT??null},sources,product,builds,sdkProvenance,started:new Date().toISOString(),rows:[],cleanup:false};let browser;
 await new Promise(r=>server.listen(0,'127.0.0.1',r));try{browser=await pw[engine].launch();for(const slot of slots())data.rows.push(await trial(browser,slot));}catch(e){data.fatal=String(e);}finally{try{if(browser)await browser.close();data.cleanup=true;}catch(e){data.cleanupError=String(e);}server.close();}
 // Planned slots not reached remain explicit NOT_TESTED, never disappear from denominator.
 for(const slot of slots())if(!data.rows.some(r=>r.id===slot.id))data.rows.push({...slot,status:'NOT_TESTED',error:data.fatal||'Not reached'});
 data.finished=new Date().toISOString();data.validation=validateRun(data);data.exitCode=data.validation.length?1:0;fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(data,null,2));fs.writeFileSync(path.join(out,'SHA256SUMS.json'),JSON.stringify(Object.fromEntries(files(out).map(f=>[path.relative(out,f).split(path.sep).join('/'),sha(fs.readFileSync(f))])),null,2));console.log(JSON.stringify({rows:data.rows.length,exitCode:data.exitCode,validation:data.validation},null,2));process.exitCode=data.exitCode;
})();
