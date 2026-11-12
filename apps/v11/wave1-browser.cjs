'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const {matrix,key,audit}=require('./wave1-audit.cjs');
const playwright=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright');
const root=path.resolve(process.env.APP_ROOT||'.work/wave1-app'),out=path.resolve(process.env.EVIDENCE_DIR||'.work/wave1-evidence');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function exercise(p,r){
 // Scenarios defined below. Each checkpoint is appended only after assertions succeed.
 await queryScenario(p,r);r.checks.push('query');await verifyZoom(p,r);await permissionScenario(p);r.checks.push('permission');await verifyZoom(p,r);await pivotScenario(p);r.checks.push('pivot');await verifyZoom(p,r);await keyboardScenarios(p);r.checks.push('keyboard-main');await verifyZoom(p,r);
 const button=p.locator('[data-id="126"] button').first();await button.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');
 assert.equal(await button.evaluate(e=>e===document.activeElement),true);
 assert.equal(await button.evaluate(e=>{const s=getComputedStyle(e);return (s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0)||s.boxShadow!=='none'}),true,'visible keyboard focus');r.checks.push('keyboard-focus');
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true,'document overflow');r.checks.push('overflow');
 assert.equal(await p.locator('#runtime-status').getAttribute('data-error-count'),'0');r.checks.push('runtime');
}
// SCENARIOS
async function keyboardScenarios(p){
 // Focus establishes each exhibit entry point only; all subsequent navigation uses real Tab.
 async function tabTo(target){for(let i=0;i<80;i++){if(await target.evaluate(e=>document.activeElement===e))return;await p.keyboard.press('Tab')}throw Error('Keyboard target not reachable by Tab')}
 const q=p.locator('[data-id="124"]'),qs=q.locator('[data-w1-state]');await q.locator('[data-q-root]').focus();
 await tabTo(q.locator('[data-q-add="0"]'));await p.keyboard.press('Enter');assert.match(await qs.innerText(),/一致 2件/);
 await tabTo(q.locator('[data-q-value="0,0"]'));await p.keyboard.press('ControlOrMeta+A');await p.keyboard.type('西');assert.match(await qs.innerText(),/一致 1件/);
 // Product intentionally restores root focus after add/delete; backward tabs retain ordinary navigation.
 await p.keyboard.press('Shift+Tab');await p.keyboard.press('Shift+Tab');await p.keyboard.press('Shift+Tab');
 assert.equal(await q.locator('[data-q-group-op="0"]').evaluate(e=>document.activeElement===e),true);
 await p.keyboard.press('End');await p.keyboard.press('Enter');assert.match(await qs.innerText(),/一致 4件/);
 await tabTo(q.locator('[data-q-delete="0,1"]'));await p.keyboard.press('Enter');assert.match(await qs.innerText(),/一致 2件/);
 await tabTo(q.locator('[data-q-add-group]'));await p.keyboard.press('Space');assert.match(await qs.innerText(),/一致 1件/);
 await tabTo(q.locator('[data-q-delete-group="1"]'));await p.keyboard.press('Enter');assert.match(await qs.innerText(),/一致 2件/);
 await tabTo(q.locator('[data-w1-reset]'));await p.keyboard.press('Enter');assert.match(await qs.innerText(),/一致 3件/);
 const m=p.locator('[data-id="125"]'),ms=m.locator('[data-w1-state]');await m.locator('[data-p-role]').focus();await p.keyboard.press('Home');await p.keyboard.press('Enter');assert.match(await ms.innerText(),/閲覧者/);
 await tabTo(m.locator('[data-p-toggle="1,0"]'));await p.keyboard.press('Space');assert.match(await ms.innerText(),/不整合/);assert.match(await ms.innerText(),/編集 無効/);
 await tabTo(m.locator('[data-p-undo]'));await p.keyboard.press('Enter');assert.match(await ms.innerText(),/編集 有効/);
 await tabTo(m.locator('[data-p-toggle="1,2"]'));await p.keyboard.press('Space');assert.match(await ms.innerText(),/削除 有効/);
 await tabTo(m.locator('[data-w1-reset]'));await p.keyboard.press('Enter');assert.equal(await m.locator('[data-p-toggle="1,2"]').getAttribute('aria-pressed'),'false');
 const t=p.locator('[data-id="126"]');await t.locator('[data-pivot-row]').focus();await p.keyboard.press('End');await p.keyboard.press('Enter');assert.match(await t.locator('[data-w1-state]').innerText(),/入力エラー/);
 await tabTo(t.locator('[data-pivot-col]'));await p.keyboard.press('Home');await p.keyboard.press('Enter');assert.equal(await t.locator('[data-pivot-total]').innerText(),'700');
 await tabTo(t.locator('[data-pivot-measure]'));await p.keyboard.press('End');await p.keyboard.press('Enter');assert.equal(await t.locator('[data-pivot-total]').innerText(),'175');
 await tabTo(t.locator('[data-pivot-data]'));await p.keyboard.press('Home');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');assert.match(await t.locator('[data-w1-state]').innerText(),/空データ/);
 await tabTo(t.locator('[data-w1-reset]'));await p.keyboard.press('Enter');assert.equal(await t.locator('[data-pivot-total]').innerText(),'700');
}
async function verifyZoom(p,r){if(r.zoom!==2)return;const measurements=await p.evaluate(()=>Object.entries(window.wave1ZoomRules).flatMap(([selector,before])=>[...document.querySelectorAll(selector)].map(e=>({selector,before,after:parseFloat(getComputedStyle(e).fontSize)}))));assert.ok(measurements.length>0&&measurements.every(x=>Math.abs(x.after-x.before*2)<.1),'200% text must survive regenerated controls');r.zoomMeasurements=measurements;}
async function queryScenario(p,diagnostic){
 const c=p.locator('[data-id="124"]'), state=c.locator('[data-w1-state]');assert.match(await state.innerText(),/一致 3件/);
 await c.locator('[data-q-add="0"]').click();assert.match(await state.innerText(),/一致 2件/);
 await c.locator('[data-q-group-op="0"]').selectOption('OR');assert.match(await state.innerText(),/一致 4件/);
 await c.locator('[data-q-value="0,0"]').fill('');assert.match(await state.innerText(),/入力エラー/);assert.equal(await c.locator('[data-q-value="0,0"]').getAttribute('aria-invalid'),'true');
 await c.locator('[data-q-value="0,0"]').fill('西');assert.match(await state.innerText(),/一致 4件/);
 await c.locator('[data-q-delete="0,1"]').click();assert.match(await state.innerText(),/一致 2件/);
 await c.locator('[data-q-add-group]').focus();await p.keyboard.press('Enter');assert.match(await state.innerText(),/一致 1件/);
 await c.locator('[data-q-root]').selectOption('OR');assert.match(await state.innerText(),/一致 3件/);
 await c.locator('[data-q-delete-group="1"]').click();assert.match(await state.innerText(),/一致 2件/);
 const beforeNoop=await c.locator('[data-w1-before]').innerText(),beforeNoopHeight=await c.locator('[data-w1-before]').evaluate(e=>e.getBoundingClientRect().height);await c.locator('[data-q-root]').dispatchEvent('change');assert.equal(await c.locator('[data-w1-before]').innerText(),beforeNoop,'same-value synthetic change must preserve before snapshot');assert.equal(await c.locator('[data-w1-before]').evaluate(e=>e.getBoundingClientRect().height),beforeNoopHeight,'same-value synthetic change must preserve before height');if(diagnostic)diagnostic.sameValueSyntheticChange='PASS';
 if(diagnostic)await p.evaluate(()=>{
 const host=document.querySelector('[data-wave1="124"]'),reset=host.querySelector('[data-w1-reset]');
 const describe=e=>e&&e.nodeType===1?{tag:e.tagName,attrs:[...e.attributes].filter(a=>a.name.startsWith('data-')||a.name==='id').map(a=>[a.name,a.value])}:null;
 const snapshot=()=>({time:performance.now(),state:host.querySelector('[data-w1-state]').textContent,beforeText:host.querySelector('[data-w1-before]').textContent,rect:reset.getBoundingClientRect().toJSON(),scroll:{x:scrollX,y:scrollY},active:describe(document.activeElement)});
 window.wave1ResetTrace={before:snapshot(),events:[]};
 for(const name of ['mousedown','mouseup','click','change','blur'])document.addEventListener(name,e=>{const item={type:name,trusted:e.isTrusted,x:e.clientX,y:e.clientY,target:describe(e.target),path:e.composedPath().map(describe).filter(Boolean),capture:snapshot()};window.wave1ResetTrace.events.push(item);queueMicrotask(()=>item.microtask=snapshot());requestAnimationFrame(()=>item.nextAnimationFrame=snapshot());},true);
 });
 await c.locator('[data-w1-reset]').click();
 if(diagnostic){diagnostic.resetAfterClick=await state.innerText();await p.waitForFunction(()=>{const h=document.querySelector('[data-wave1="124"]');return h.querySelector('[data-q-root]').value==='AND'&&h.querySelector('[data-q-value="0,0"]').value==='東'&&h.querySelector('[data-w1-state]').textContent.includes('一致 3件')},null,{timeout:2000});diagnostic.resetTrace=await p.evaluate(()=>window.wave1ResetTrace);}
 assert.match(await state.innerText(),/一致 3件/);assert.equal(await c.locator('[data-q-group]').count(),1);assert.equal(await c.locator('[data-q-root]').inputValue(),'AND');
}
async function permissionScenario(p){
 const c=p.locator('[data-id="125"]'), state=c.locator('[data-w1-state]');assert.match(await state.innerText(),/編集 有効/);
 await c.locator('[data-p-toggle="1,0"]').focus();await p.keyboard.press('Space');assert.match(await state.innerText(),/不整合/);assert.match(await state.innerText(),/編集 無効/);assert.equal(await c.locator('[data-p-toggle="1,0"]').getAttribute('aria-pressed'),'false');
 await c.locator('[data-p-undo]').click();assert.match(await state.innerText(),/編集 有効/);assert.equal(await c.locator('[data-p-toggle="1,0"]').getAttribute('aria-pressed'),'true');
 await c.locator('[data-p-toggle="1,2"]').click();assert.match(await state.innerText(),/削除 有効/);
 await c.locator('[data-p-role]').selectOption('0');assert.match(await state.innerText(),/閲覧者/);
 await c.locator('[data-w1-reset]').click();assert.equal(await c.locator('[data-p-role]').inputValue(),'1');assert.equal(await c.locator('[data-p-toggle="1,2"]').getAttribute('aria-pressed'),'false');assert.equal(await c.locator('[data-p-undo]').isDisabled(),true);
}
async function pivotScenario(p){
 const c=p.locator('[data-id="126"]'), total=()=>c.locator('[data-pivot-total]');assert.equal(await total().innerText(),'700');
 await c.locator('[data-pivot-measure]').selectOption('average');assert.equal(await total().innerText(),'175');
 await c.locator('[data-pivot-measure]').selectOption('count');assert.equal(await total().innerText(),'5');
 await c.locator('[data-pivot-row]').selectOption('kind');assert.match(await c.locator('[data-w1-state]').innerText(),/入力エラー/);assert.equal(await total().count(),0);
 await c.locator('[data-pivot-col]').selectOption('region');assert.equal(await total().innerText(),'5');
 await c.locator('[data-pivot-data]').selectOption('empty');assert.equal(await total().innerText(),'0');
 await c.locator('[data-pivot-data]').selectOption('missing');assert.equal(await total().innerText(),'1');await c.locator('[data-pivot-measure]').selectOption('sum');assert.match(await total().innerText(),/数値なし/);
 await c.locator('[data-w1-reset]').click();assert.equal(await total().innerText(),'700');assert.equal(await c.locator('[data-pivot-row]').inputValue(),'region');
}
async function faults(browser,url,report,save,engine){
 const cases=[['reset',124,queryScenario],['undo',125,permissionScenario],['permission-display',125,permissionScenario],['pivot-display',126,pivotScenario],['query-display',124,queryScenario]];
 report.controls=report.controls||[];
 for(const [fault,id,scenario] of cases){const ctx=await browser.newContext(),p=await ctx.newPage();let caught=false,error='';try{await p.goto(url);await p.evaluate(({fault,id})=>{
 const host=document.querySelector(`[data-wave1="${id}"]`);
 if(fault==='reset'||fault==='undo')host.addEventListener('click',e=>{if(e.target.matches(fault==='reset'?'[data-w1-reset]':'[data-p-undo]'))e.stopImmediatePropagation()},true);
 else if(fault==='pivot-display')host.querySelector('[data-pivot-total]').textContent='701';
 else if(fault==='permission-display')host.querySelector('[data-w1-state]').textContent='有効権限：編集 無効';
 else host.querySelector('[data-w1-state]').textContent='一致 999件';
 },{fault,id});await scenario(p);}catch(e){caught=e.code==='ERR_ASSERTION';error=e.message}finally{await ctx.close()}
 assert.ok(caught,`fault escaped validator: ${fault}`);const control={engine,fault,detected:true,green:false,error};report.controls.push(control);save();
 // Remove each fault by creating a clean context; the same scenario must pass.
 const clean=await browser.newContext(),page=await clean.newPage();try{await page.goto(url);await scenario(page);control.green=true;save();}finally{await clean.close()}
 }
}
async function main(){
 assert.ok(process.env.TMPDIR&&!os.tmpdir().startsWith('/tmp'),'dedicated TMPDIR required');assert.equal(os.tmpdir(),process.env.TMPDIR);
 fs.mkdirSync(out,{recursive:true});assert.ok(fs.existsSync(path.join(root,'index.html')),'isolated APP_ROOT missing');
 const report={schema:1,head:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree:cp.execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),sourceHashes:Object.fromEntries(['index.html','wave1.js','wave1.css'].map(f=>[f,hash(fs.readFileSync(path.join(root,f)))])),started:new Date().toISOString(),temp:os.tmpdir(),results:[],exitCode:1};
 const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));save();
 const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]);if(name==='/favicon.ico'){res.writeHead(204);return res.end()};const dest=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!dest.startsWith(root+path.sep)){res.writeHead(403);return res.end()};try{res.setHeader('content-type',dest.endsWith('.js')?'text/javascript':dest.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(dest))}catch{res.writeHead(404);res.end()}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}/`;
 try{for(const engine of ['chromium','webkit']){let browser;try{browser=await playwright[engine].launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 await faults(browser,url,report,save,engine);
 for(const cell of matrix().filter(x=>x.engine===engine)){const r={...cell,version:browser.version(),status:'FAIL',checks:[],errors:[]};report.results.push(r);let ctx,p;try{ctx=await browser.newContext({viewport:{width:cell.width,height:1000},reducedMotion:cell.zoom===2?'reduce':'no-preference'});p=await ctx.newPage();p.on('pageerror',e=>r.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')r.errors.push(m.text())});await p.goto(url);assert.equal(await p.locator('#gallery article').count(),126);if(cell.theme==='light')await p.locator('#theme').click();
 if(cell.zoom===2){r.zoomBaseline=await p.evaluate(()=>{
 const rules={},nodes=[...document.querySelectorAll('[data-wave1]')].flatMap(c=>[c,...c.querySelectorAll('*')]);
 for(const e of nodes){const id=e.closest('[data-wave1]').dataset.wave1,tag=e.tagName.toLowerCase(),selector=`[data-wave1="${id}"]${e.hasAttribute('data-wave1')?'':' '+tag}`,size=parseFloat(getComputedStyle(e).fontSize);if(rules[selector]&&rules[selector]!==size)throw Error('Nonuniform font baseline '+selector);rules[selector]=size;}
 const style=document.createElement('style');style.textContent=Object.entries(rules).map(([selector,size])=>`${selector}{font-size:${size*2}px!important}`).join('\n');document.head.append(style);window.wave1ZoomRules=rules;return rules;
 });await verifyZoom(p,r);}

 await exercise(p,r);r.screenshot=key(cell)+'.png';await p.screenshot({path:path.join(out,r.screenshot),fullPage:false});r.sha256=hash(fs.readFileSync(path.join(out,r.screenshot)));r.checks.push('screenshot');assert.deepEqual(r.errors,[]);r.status='PASS';
 }catch(e){r.error=e.stack;if(p){try{r.resetTrace=await p.evaluate(()=>window.wave1ResetTrace||null);r.failureScreenshot=key(cell)+'-failure.png';await p.screenshot({path:path.join(out,r.failureScreenshot)});r.failureSha256=hash(fs.readFileSync(path.join(out,r.failureScreenshot)));}catch(captureError){r.captureError=captureError.message}}}finally{if(ctx)await ctx.close();if(r.errors.length)r.status='FAIL';save()}}
 }catch(e){report.results.push({engine,status:browser?'FAIL':'BLOCKED',error:e.stack})}finally{if(browser)await browser.close()}}
 report.exitCode=report.results.length===14&&report.results.every(r=>r.status==='PASS')?0:1;report.finished=new Date().toISOString();save();if(!report.exitCode)audit(report,out);process.exitCode=report.exitCode;
 }finally{await new Promise(resolve=>server.close(resolve))}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={exercise};
