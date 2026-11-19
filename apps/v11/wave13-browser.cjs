'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),cp=require('node:child_process'),a=require('node:assert/strict');
const C=require('./wave13-contract.cjs');
const root=path.resolve(process.env.APP_ROOT||'.work/wave13-app'),out=path.resolve(process.env.EVIDENCE_DIR||'.work/wave13-evidence');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const assets=['index.html','exhibits.js','exhibits.css',...Array.from({length:13},(_,i)=>[`wave${i+1}.js`,`wave${i+1}.css`]).flat()];
const execution=['wave13-browser.cjs','wave13-contract.cjs','wave13-test.cjs','wave13-audit.cjs','wave13-manifest.py','wave13-baseline.json','verify.py','package.json','package-lock.json'];
const matrix=['chromium','webkit'].flatMap(engine=>['light','dark'].flatMap(theme=>[375,390,1280].map(width=>({engine,theme,width,zoom:1}))).concat({engine,theme:'dark',width:375,zoom:2}));
const tags=['input','select','button','output','p','li','label'];
function styleFor(host){
 return host.evaluate((h,tags)=>Object.fromEntries(tags.filter(tag=>h.querySelector(tag)).map(tag=>[tag,parseFloat(getComputedStyle(h.querySelector(tag)).fontSize)])),tags);
}
async function run(){
 if(process.env.GITHUB_ACTIONS&&(process.env.LOCAL_ENGINE||process.env.CHROMIUM_EXECUTABLE))throw Error('Partial matrix not allowed in Actions');
 const prHead=process.env.EXPECTED_HEAD||null;
 const git=(...xs)=>cp.execFileSync('git',xs,{encoding:'utf8'}).trim();
 const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
 if(prHead&&head!==prHead)throw Error('Wrong checked-out HEAD');
 const source=Object.fromEntries(assets.map(x=>[x,hash(fs.readFileSync(path.join(root,x)))]));
 const execRoot=path.join(out,'execution');fs.mkdirSync(execRoot,{recursive:true});
 const executed=Object.fromEntries(execution.map(x=>{
  const file=path.join(root,x);fs.copyFileSync(file,path.join(execRoot,x));return [x,hash(fs.readFileSync(file))];
 }));
 fs.copyFileSync('.github/workflows/v11-wave13.yml',path.join(execRoot,'v11-wave13.yml'));
 executed['v11-wave13.yml']=hash(fs.readFileSync(path.join(execRoot,'v11-wave13.yml')));
 const report={head,tree,prHead,source,execution:executed,run:process.env.GITHUB_RUN_ID??null,attempt:process.env.GITHUB_RUN_ATTEMPT??null,node:process.version,results:[]};
 const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
 const server=http.createServer((req,res)=>{
   const f=req.url.split('?')[0].slice(1)||'index.html';
   if(!assets.includes(f))return res.writeHead(404).end();
   res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html; charset=utf-8');
   res.end(fs.readFileSync(path.join(root,f)));
 });
 const pmod=process.env.PLAYWRIGHT_MODULE||'playwright';
 const pw=require(pmod);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try {
  for(const c of matrix.filter(x=>!process.env.LOCAL_ENGINE||x.engine===process.env.LOCAL_ENGINE)){
   const key=[c.engine,c.width,c.theme,c.zoom].join('-');
   const row={...c,key,status:'FAIL',steps:{},font:{},navigation:{},keyboard:{},errors:[],screenshots:[]};report.results.push(row);
   let browser,context;
   try{
    browser=await pw[c.engine].launch({headless:true,...(c.engine==='chromium'&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
    row.browserVersion=browser.version();
    context=await browser.newContext({viewport:{width:c.width,height:950},reducedMotion:c.zoom===2?'reduce':'no-preference',recordHar:{path:path.join(out,key+'.har'),content:'embed',mode:'full'}});
    await context.tracing.start({screenshots:true,snapshots:true,sources:true});
    const p=await context.newPage();p.setDefaultTimeout(5000);
    await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    p.on('console',m=>{if(m.type()==='error')row.errors.push(m.text())});
    p.on('pageerror',e=>row.errors.push(String(e)));
    await p.goto(`http://127.0.0.1:${server.address().port}/`);
    if(c.theme==='light')await p.locator('#theme').click();
    row.themeObserved=await p.locator('body').evaluate(b=>b.classList.contains('light')?'light':'dark');
    row.reduced=await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
    a.equal(row.themeObserved,c.theme);a.equal(row.reduced,c.zoom===2);
    a.equal(await p.locator('#gallery article').count(),162);
    for(const id of [160,161,162]){
     await p.locator('#search').fill(String(id));
     a.equal(await p.locator('#gallery article').count(),1);
     const card=p.locator(`article[data-id="${id}"]`), host=card.locator('[data-wave13]');
     const by=k=>host.locator(`[data-w13-key="${k}"]`);
     const detail=card.locator('.provenance summary');
     await detail.focus(); await detail.press('Enter');
     row.navigation[id]=await detail.evaluate(x=>x.parentElement.open);
     a.equal(row.navigation[id],true);
     await detail.press('Enter');
     await by('run').click();
     const before=await styleFor(host);
     await by('reset').click();
     if(c.zoom===2){
      const style=Object.entries(before).map(([tag,size])=>`[data-wave13="${id}"] ${tag}{font-size:${size*2}px!important}`).join('');
      await p.addStyleTag({content:style});
     }
     await by('run').click();
     const after=await styleFor(host);
     for(const [tag,size] of Object.entries(before))a.ok(Math.abs(after[tag]-size*c.zoom)<.05,'actual measured ratio '+id+'/'+tag);
     row.font[id]={before,after};
     await by('reset').click();
     await by('run').focus();
     await p.keyboard.press('Tab');
     const tab=await p.evaluate(()=>document.activeElement.dataset.w13Key);
     await p.keyboard.press('Shift+Tab');
     row.keyboard[id]={tab,visible:await by('run').evaluate(e=>e.matches(':focus-visible')&&parseFloat(getComputedStyle(e).outlineWidth)>0&&document.activeElement===e)};
     a.deepEqual(row.keyboard[id],{tab:'reset',visible:true});
     row.steps[id]=[];
     for(const op of C.plan(id)){
      const e=by(op.action==='input'?op.key:op.action);
      if(op.action==='input'){
       if(op.key==='date')await e.fill(op.value);
       else await e.selectOption(op.value);
      }else await e.press('Enter');
      const record=await host.evaluate(h=>{
       const r=h.getBoundingClientRect(),card=h.closest('.card').getBoundingClientRect();
       const fits=r.left>=card.left-.5&&r.right<=card.right+.5&&h.scrollWidth<=h.clientWidth+1&&document.documentElement.scrollWidth<=document.documentElement.clientWidth;
       return {result:h.wave13.getState().result,status:h.querySelector('output').textContent,focus:document.activeElement.dataset.w13Key??null,rows:[...h.querySelectorAll('li')].map(li=>li.textContent),fits};
      });
      record.operation=op;row.steps[id].push(record);C.checkRecord(id,record,op);
     }
     if(c.zoom===2){
      await by('run').click();
      const file=`${key}-${id}.png`,buf=await host.screenshot({path:path.join(out,file)});
      row.screenshots.push({id,file,sha256:hash(buf),size:buf.length});
     }
    }
    a.deepEqual(row.errors,[]);C.auditSteps(row);row.status='PASS';
   }catch(err){row.error=String(err.stack||err)}
   finally{
    if(context){await context.tracing.stop({path:path.join(out,key+'.trace.zip')}).catch(e=>{row.errors.push(String(e));row.status='FAIL'});await context.close().catch(e=>{row.errors.push(String(e));row.status='FAIL'});}
    if(browser) await browser.close().catch(e=>{row.errors.push(String(e));row.status='FAIL'});
    save();
   }
  }
 }finally{server.close();save()}
 console.log(JSON.stringify(report.results.map(({key,status,error})=>({key,status,error})),null,2));
 if(report.results.some(r=>r.status!=='PASS'))process.exitCode=1;
}
module.exports={matrix,assets,execution};
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
