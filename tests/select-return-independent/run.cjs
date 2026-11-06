const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const pw=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || path.resolve('tools/stage-a-browser/node_modules'),'playwright'));
const engine=process.env.SELECT_ENGINE || 'chromium';
const out=path.resolve(process.env.EVIDENCE_DIR || '.work/independent-run');
if(fs.existsSync(out))throw Error('Evidence directory must be new: '+out);fs.mkdirSync(out,{recursive:true});
const root=process.cwd(); const results=[];
const paint = p => p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function settle(p, method, variant) {
  if(method==='tab') { await paint(p); return {identityWait:'not-applicable',maxWaitMs:0}; }
  await p.getByRole('option',{name:'カード',exact:true}).waitFor({state:'hidden'});
  await p.waitForFunction(()=>document.getElementById('official-select').closest('[role=button]').getAttribute('aria-expanded')==='false');
  let identityWait='not-applicable';
  const returning=['mouse','enter','escape','repeat'].includes(method);
  if(returning) {
    try { await p.waitForFunction(()=>document.activeElement===document.getElementById('official-select').closest('[role=button]'),null,{timeout:2000});identityWait='matched'; }
    catch(e) { if(e.name!=='TimeoutError')throw e;identityWait='timed-out'; }
    assert.strictEqual(identityWait,variant==='green'?'matched':'timed-out');
  }
  await paint(p);
  return {identityWait,maxWaitMs:returning?2000:0};
}
(async()=>{const browser=await pw[engine].launch({headless:true});
for(const variant of ['red','green']) {
 const dist=path.join(path.resolve(variant==='red'?(process.env.RED_ROOT || '.work/v10-red'):(process.env.GREEN_ROOT || '.work/v10-green')),'dist');
 const server=http.createServer((req,res)=>{let url=new URL(req.url,'http://localhost');let f=path.join(dist,url.pathname==='/'?'index.html':url.pathname);try{res.setHeader('content-type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f))}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 for(const condition of [{id:'A',width:320,theme:'dark',text:200},{id:'B',width:1280,theme:'light',text:100}])for(const method of ['mouse','enter','escape','tab','outside','repeat']) {
 const p=await browser.newPage({viewport:{width:condition.width,height:1000}});let errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(`${origin}/?theme=${condition.theme}&text=${condition.text}`);await p.bringToFront();
 await p.evaluate(()=>{window.trace=[];for(const type of ['focusin','focusout','keydown','pointerdown','pointerup'])document.addEventListener(type,e=>window.trace.push({type,key:e.key,tag:e.target.tagName,id:e.target.id,text:e.target.textContent.slice(0,60)}),true)});
 const trigger=p.locator('#official-select').locator('xpath=ancestor::*[@role="button"]'); await trigger.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');assert(await trigger.evaluate(e=>e===document.activeElement));await p.keyboard.press('Space');await p.getByRole('option',{name:'カード',exact:true}).waitFor();
 if(method==='mouse') await p.getByRole('option',{name:'カード',exact:true}).click();
 if(method==='enter'){await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter')}
 if(method==='escape'||method==='repeat')await p.keyboard.press('Escape');
 if(method==='tab')await p.keyboard.press('Tab');
 if(method==='outside')await p.getByRole('heading',{name:'Select',exact:true}).click();
 const observation=await settle(p,method,variant);let first=await trigger.evaluate(e=>({returned:e===document.activeElement,active:document.activeElement.tagName,open:e.getAttribute('aria-expanded')}));
 let repeatObservation=null;if(method==='repeat'){await trigger.focus();await p.keyboard.press('Space');await p.getByRole('option',{name:'カード',exact:true}).click();repeatObservation=await settle(p,method,variant)}
 const state=await trigger.evaluate(e=>({returned:e===document.activeElement,active:document.activeElement.tagName,html:document.activeElement.outerHTML,open:e.getAttribute('aria-expanded'),text:e.textContent,focusVisible:e.matches(':focus-visible'),hasFocus:document.hasFocus(),trace:window.trace}));
 const value=await p.locator('#Select output').textContent();await trigger.scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,`${variant}-${condition.id}-${method}.png`)});
 results.push({variant,condition,method,observation,repeatObservation,first,state,value,errors});console.log(variant,condition.id,method,state.returned,state.active,state.open,value);await p.close();
 }
 await new Promise(r=>server.close(r));
}
const failures=results.filter(r=>{const returning=['mouse','enter','escape','repeat'].includes(r.method);const expected=r.variant==='green'&&returning;const expectedValue=['mouse','enter','repeat'].includes(r.method)?'b':'a';return r.state.returned!==expected || (r.variant==='red'&&returning&&r.state.active!=='BODY') || (r.method==='repeat'&&r.first.returned!==expected) || r.state.open!==(r.method==='tab'?'true':'false') || !r.value.includes('選択値：'+expectedValue) || r.errors.length;}).map(r=>`${r.variant}/${r.condition.id}/${r.method}`);
const pass=results.length===24&&!failures.length;fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({engine,browser:await browser.version(),pass,failures,results},null,2));if(!pass)process.exitCode=1;await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
