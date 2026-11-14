'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {matrix,key,audit,required,faults}=require('./wave3-audit.cjs');
const {sourceFiles,executionFiles,selectors,stages,digest,measureContract,mutationSource}=require('./wave3-contract.cjs');
const pw=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright');
const root=path.resolve(process.env.APP_ROOT||'.work/wave3-app'),out=path.resolve(process.env.EVIDENCE_DIR||'.work/wave3-evidence');
const git=(...a)=>cp.execFileSync('git',a,{encoding:'utf8'}).trim();
const host=(p,id)=>p.locator(`[data-wave3="${id}"]`),k=(c,key)=>c.locator(`[data-key="${key}"]`);
const focused=async loc=>assert.equal(await loc.evaluate(e=>document.activeElement===e),true,'focus contract');
async function zoom(p,r,stage){
 if(r.zoom!==2)return;
 r.zoomMeasurements[stage]=await p.evaluate(({selectors,baseline})=>({reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,elements:selectors.flatMap(selector=>{const nodes=[...document.querySelectorAll(selector)];if(!nodes.length)throw Error('Missing text '+selector);return nodes.map((e,index)=>{const s=getComputedStyle(e);return {selector,index,before:baseline[selector],after:parseFloat(s.fontSize),animationName:s.animationName,transitionDuration:s.transitionDuration}})})}),{selectors,baseline:r.zoomBaseline});
}
async function setupZoom(p,r){
 if(r.zoom!==2)return;r.zoomMeasurements={};
 r.zoomBaseline=await p.evaluate(selectors=>{const baseline={};for(const selector of selectors){const sizes=[...document.querySelectorAll(selector)].map(e=>parseFloat(getComputedStyle(e).fontSize));if(!sizes.length||sizes.some(s=>s!==sizes[0]||s<=0))throw Error('Nonuniform baseline '+selector);baseline[selector]=sizes[0]}
 const rules={};for(const host of document.querySelectorAll('[data-wave3]'))for(const e of [host,...host.querySelectorAll('*')]){const sel=`[data-wave3="${host.dataset.wave3}"]${e===host?'':' '+e.tagName.toLowerCase()}`,v=parseFloat(getComputedStyle(e).fontSize);if(rules[sel]&&rules[sel]!==v)throw Error('Nonuniform font '+sel);rules[sel]=v}
 const style=document.createElement('style');style.dataset.testTextEnlargement='measured';style.textContent=Object.entries(rules).map(([s,n])=>`${s}{font-size:${2*n}px!important}`).join('\n');document.head.append(style);return baseline},selectors);
}
async function observe(p,r,stage){
 r.observations[stage]=await p.evaluate(()=>Object.fromEntries([130,131,132].map(id=>{const h=document.querySelector(`[data-wave3="${id}"]`);return [id,{current:h.querySelector('[data-w3-current]')?.textContent,state:h.querySelector('[data-w3-state]').textContent,before:h.querySelector('[data-w3-before]').textContent,inputs:[...h.querySelectorAll('input,select,textarea')].map(e=>({key:e.dataset.key,value:e.value,checked:e.type==='checkbox'?e.checked:null,hidden:!e.getClientRects().length})),activeKey:h.contains(document.activeElement)?document.activeElement.dataset.key||null:null,gridTotal:h.querySelector('[data-grid-total]')?.textContent,bars:[...h.querySelectorAll('[data-w3-bar]')].map(e=>({id:e.dataset.w3Bar,offset:e.dataset.offset,duration:e.dataset.duration,gridColumn:getComputedStyle(e).gridColumn,left:e.getBoundingClientRect().left,width:e.getBoundingClientRect().width})),formOutput:h.querySelector('[data-schema-output]')?.textContent}]})));
 const expected={initial:[0,2],'gantt-commit':[3,1],'gantt-cancel':[3,1],'gantt-undo':[0,2],reset:[0,2]}[stage];
 if(expected){r.barMeasurements=r.barMeasurements||{};r.barMeasurements[stage]=await barCheck(host(p,132),'t1',...expected)}
 await zoom(p,r,stage);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true,'document overflow after '+stage);
}
async function descriptions(p){
 const names={127:'Tree Grid',128:'Visual Rule Editor',129:'Dependency Graph',130:'Editable Data Grid',131:'Schema Form',132:'Gantt Editor'};
 for(const [id,name] of Object.entries(names)){const card=p.locator(`[data-id="${id}"]`);assert.equal(await card.locator('h2').innerText(),name);const text=await card.locator('.description').innerText();assert.ok(text.trim().length>12,`description missing ${id}`);assert.ok(!/undefined|null/.test(text),`description invalid ${id}`)}
}
async function exercise(p,r){
 const g=host(p,130),s=host(p,131),t=host(p,132);r.observations={};
 await descriptions(p);r.checks.push('descriptions');await observe(p,r,'initial');
 // Fixed expected money is independently calculated in integer cents: 2*1250+3*220+550=3710.
 assert.match(await g.locator('[data-grid-total]').innerText(),/37\.10/);
 const initialGrid=await g.locator('[data-grid-current]').innerText();
 await k(g,'grid-r1-name').fill('架空品A');await k(g,'grid-r1-quantity').fill('4');await k(g,'grid-r1-price').fill('1.25');
 assert.equal(await g.locator('[data-grid-current]').innerText(),initialGrid,'draft must not commit');await observe(p,r,'grid-edit');
 await k(g,'grid-r1-commit').focus();await p.keyboard.press('Enter');await focused(k(g,'grid-r1-name'));
 assert.match(await g.locator('[data-grid-subtotal="r1"]').innerText(),/5\.00/);assert.match(await g.locator('[data-grid-total]').innerText(),/17\.10/);await observe(p,r,'grid-commit');
 const savedGrid=await g.locator('[data-grid-current]').innerText();
 for(const [field,value] of [['name',''],['quantity','0'],['quantity','1.5'],['quantity','1000'],['price','-1'],['price','1.234'],['price','100000'],['price','NaN']]){
  await k(g,'grid-r1-'+field).fill(value);if(!await k(g,'grid-r1-commit').isDisabled())await k(g,'grid-r1-commit').click();assert.equal(await g.locator('[data-grid-current]').innerText(),savedGrid,'invalid row accepted '+field+'='+value);await k(g,'grid-r1-cancel').click();await focused(k(g,'grid-r1-name'));
 }
 await k(g,'grid-r1-price').fill('3.50');await k(g,'grid-r1-cancel').click();assert.equal(await k(g,'grid-r1-price').inputValue(),'1.25');await focused(k(g,'grid-r1-name'));await observe(p,r,'grid-cancel');
 await k(g,'grid-undo').click();assert.match(await g.locator('[data-grid-total]').innerText(),/37\.10/);assert.equal(await g.locator('[data-grid-current]').innerText(),initialGrid);await focused(k(g,'grid-r1-name'));await observe(p,r,'grid-undo');r.checks.push('grid');
 // Valid form definition and inputs survive invalid JSON, unknown attributes, duplicate IDs and excessive fields.
 await k(s,'field-name').fill('架空のメモ');await k(s,'field-count').fill('3');const validDefinition=await k(s,'schema-editor').inputValue();const formBefore=await s.locator('[data-schema-current]').innerText();
 const parsed=JSON.parse(validDefinition),fields=Array.isArray(parsed)?parsed:parsed.fields;
 const invalid=[ '{',JSON.stringify({...parsed,unexpected:true}),JSON.stringify({...parsed,fields:fields.concat([{id:'extra',label:'Extra',type:'string'},{id:'extra2',label:'Extra2',type:'string'}])}),JSON.stringify(Array.isArray(parsed)?[...fields,fields[0]]:{...parsed,fields:[...fields,fields[0]]}) ];
 for(const text of invalid){await k(s,'schema-editor').fill(text);await k(s,'schema-apply').click();await focused(k(s,'schema-editor'));assert.equal(await s.locator('[data-schema-current]').innerText(),formBefore);assert.equal(await k(s,'field-name').inputValue(),'架空のメモ');assert.equal(await k(s,'field-count').inputValue(),'3');assert.ok((await s.locator('[data-schema-error]').innerText()).trim().length>0)}
 await observe(p,r,'form-invalid');
 await k(s,'schema-editor').fill(validDefinition);await k(s,'schema-apply').focus();await p.keyboard.press('Enter');await focused(k(s,'field-name'));assert.equal(await k(s,'field-name').inputValue(),'');await observe(p,r,'form-applied');
 await k(s,'field-name').fill('架空のメモ');await k(s,'field-count').fill('3');await k(s,'field-category').selectOption('study');
 assert.equal(await k(s,'field-note').isVisible(),false);await k(s,'schema-submit').click();let output=await s.locator('[data-schema-output]').innerText();assert.equal(JSON.parse(output).status,'有効');assert.ok(output.includes('架空のメモ'));assert.ok(!output.includes('"note"'),'hidden value included');
 await k(s,'field-enabled').check();assert.equal(await k(s,'field-note').isVisible(),true);await k(s,'schema-submit').click();assert.equal(JSON.parse(await s.locator('[data-schema-output]').innerText()).status,'拒否');
 await k(s,'field-note').fill('表示時だけ出力');await k(s,'schema-submit').click();assert.equal(JSON.parse(await s.locator('[data-schema-output]').innerText()).status,'有効');assert.ok((await s.locator('[data-schema-output]').innerText()).includes('表示時だけ出力'));
 await k(s,'field-enabled').uncheck();assert.equal(await k(s,'field-note').isVisible(),false);await k(s,'schema-submit').click();assert.ok(!(await s.locator('[data-schema-output]').innerText()).includes('"note"'));
 await k(s,'field-enabled').check();assert.equal(await k(s,'field-note').inputValue(),'表示時だけ出力');await k(s,'field-count').fill('10');await k(s,'schema-submit').click();assert.equal(JSON.parse(await s.locator('[data-schema-output]').innerText()).status,'拒否');await k(s,'field-count').fill('3');await k(s,'schema-submit').click();await observe(p,r,'form-conditional');r.checks.push('form');
 // UTC day arithmetic, no product date function imported. A one-day task ends on its start day.
 const initialGantt=await t.locator('[data-gantt-current]').innerText();
 await k(t,'gantt-t1-start').fill('2026-11-04');await k(t,'gantt-t1-duration').fill('1');assert.equal(await t.locator('[data-gantt-current]').innerText(),initialGantt);await observe(p,r,'gantt-edit');
 await k(t,'gantt-t1-commit').focus();await p.keyboard.press('Enter');await focused(k(t,'gantt-t1-start'));await barCheck(t,'t1',3,1);assert.ok((await t.locator('[data-gantt-current]').innerText()).includes('2026-11-04'));assert.equal(await t.locator('[data-gantt-end="t1"]').innerText(),'2026-11-04');assert.match(await t.locator('[data-gantt-overlap]').innerText(),/t1 \/ t2/);await observe(p,r,'gantt-commit');
 const savedGantt=await t.locator('[data-gantt-current]').innerText();
 for(const [field,value] of [['start','2026-11-00'],['start','2026-02-30'],['start','2026-11-15'],['duration','0'],['duration','-1'],['duration','1.5'],['duration','15'],['duration','']]){await k(t,'gantt-t1-'+field).fill(value);if(!await k(t,'gantt-t1-commit').isDisabled())await k(t,'gantt-t1-commit').click();assert.equal(await t.locator('[data-gantt-current]').innerText(),savedGantt,'invalid task accepted');await k(t,'gantt-t1-cancel').click();await focused(k(t,'gantt-t1-start'));}
 await k(t,'gantt-t1-start').fill('2026-11-10');await k(t,'gantt-t1-cancel').click();assert.equal(await k(t,'gantt-t1-start').inputValue(),'2026-11-04');await observe(p,r,'gantt-cancel');
 await k(t,'gantt-undo').click();await focused(k(t,'gantt-t1-start'));assert.equal(await t.locator('[data-gantt-current]').innerText(),initialGantt);assert.equal(await t.locator('[data-gantt-end="t1"]').innerText(),'2026-11-02');assert.match(await t.locator('[data-gantt-overlap]').innerText(),/t2 \/ t3/);await barCheck(t,'t1',0,2);await observe(p,r,'gantt-undo');r.checks.push('gantt');
 for(const [c,target] of [[g,'grid-r1-name'],[s,'schema-editor'],[t,'gantt-t1-start']]){await c.locator('[data-w3-reset]').tap();await focused(k(c,target));assert.ok((await c.locator('[data-w3-before]').innerText()).length>0)}
 assert.equal(await g.locator('[data-grid-current]').innerText(),initialGrid);assert.equal(await t.locator('[data-gantt-current]').innerText(),initialGantt);r.checks.push('reset');await observe(p,r,'reset');
 await k(g,'grid-r1-name').focus();await p.keyboard.press('Tab');await focused(k(g,'grid-r1-quantity'));assert.equal(await k(g,'grid-r1-quantity').evaluate(e=>{const style=getComputedStyle(e);return style.outlineStyle!=='none'&&parseFloat(style.outlineWidth)>0}),true);r.checks.push('keyboard');r.checks.push('touch-emulation');
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true,'document overflow');r.checks.push('overflow');assert.equal(await p.locator('#runtime-status').getAttribute('data-error-count'),'0');r.checks.push('runtime');
}
async function barCheck(t,id,offset,duration){
 const b=t.locator(`[data-w3-bar="${id}"]`),v=await b.evaluate(e=>{const p=e.parentElement,style=getComputedStyle(p),rect=p.getBoundingClientRect(),r=e.getBoundingClientRect();return {offset:Number(e.dataset.offset),duration:Number(e.dataset.duration),column:getComputedStyle(e).gridColumn,left:r.left,width:r.width,parentLeft:rect.left,parentWidth:rect.width,borderLeft:parseFloat(style.borderLeftWidth),borderRight:parseFloat(style.borderRightWidth),paddingLeft:parseFloat(style.paddingLeft),paddingRight:parseFloat(style.paddingRight),gap:parseFloat(style.columnGap)||0}});
 assert.equal(v.offset,offset,'gantt position');assert.equal(v.duration,duration,'gantt duration');assert.equal(v.column,`${offset+1} / span ${duration}`,'gantt rendered grid column');
 const content=v.parentWidth-v.borderLeft-v.borderRight-v.paddingLeft-v.paddingRight,unit=(content-v.gap*13)/14,expectedLeft=v.parentLeft+v.borderLeft+v.paddingLeft+offset*(unit+v.gap),expectedWidth=duration*unit+(duration-1)*v.gap;
 assert.ok(Math.abs(v.left-expectedLeft)<0.2,'gantt actual pixel position');assert.ok(Math.abs(v.width-expectedWidth)<0.2,'gantt actual pixel length');assert.ok(v.width>0,'gantt visible width');return {...v,expectedLeft,expectedWidth,tolerancePx:0.2};
}
// Each mutation is appended only to an isolated HTTP copy of wave3.js. Original assets stay byte-identical.

async function faultCheck(p,fault){const g=host(p,130),s=host(p,131),t=host(p,132);switch(fault){
 case 'grid-total':assert.match(await g.locator('[data-grid-total]').innerText(),/37\.10/,'grid total');break;
 case 'grid-invalid':{const before=await g.locator('[data-grid-current]').innerText();await k(g,'grid-r1-quantity').fill('0');if(!await k(g,'grid-r1-commit').isDisabled())await k(g,'grid-r1-commit').click();assert.equal(await g.locator('[data-grid-current]').innerText(),before,'invalid row accepted');break;}
 case 'form-visibility':await k(s,'field-enabled').check();assert.equal(await k(s,'field-note').isVisible(),true,'conditional field visibility');break;
 case 'gantt-position':case 'gantt-duration':await barCheck(t,'t1',0,2);break;
 case 'reset':await k(g,'grid-r1-name').fill('RESET MUTATION');await g.locator('[data-w3-reset]').click();assert.equal(await k(g,'grid-r1-name').inputValue(),'ノート','reset must restore initial name');break;
 case 'focus':await g.locator('[data-w3-reset]').click();await focused(k(g,'grid-r1-name'));break;
 case 'description':await descriptions(p);break;
 }}
async function faultControls(browser,url,engine,report,save){
 for(const fault of faults){const control={engine,fault,detected:false,green:false,errorCode:null,errors:[],mutationFile:`fault-${fault}.js`,mutationSha256:digest(mutationSource(fault)),originalSourceHash:report.sourceHashes['wave3.js'],faultSourceHash:digest(Buffer.concat([fs.readFileSync(path.join(root,'wave3.js')),Buffer.from(mutationSource(fault))]))};report.controls.push(control);
 for(const mode of ['fault','normal']){const ctx=await browser.newContext(),p=await ctx.newPage();p.setDefaultTimeout(5000);await ctx.tracing.start({screenshots:true,snapshots:true,sources:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});try{await p.goto((mode==='fault'?url+'fault/'+fault+'/':url)+'?wave3-control='+engine+'-'+fault+'-'+mode);await faultCheck(p,fault);if(mode==='normal')control.green=true;}catch(e){if(mode==='fault'){control.detected=e.code==='ERR_ASSERTION';control.errorCode=e.code||e.name;control.error=e.message}else{control.normalError=e.stack;control.green=false}}finally{
 control[mode+'Errors']=errors;const trace=`control-${engine}-${fault}-${mode}.zip`;try{await ctx.tracing.stop({path:path.join(out,trace)});control[mode+'Trace']=trace;control[mode+'TraceSha256']=digest(fs.readFileSync(path.join(out,trace)))}catch(e){control.traceError=e.message;control.detected=false;control.green=false}await ctx.close();save()}
 }
 }
}
async function run(){
 assert.ok(process.env.TMPDIR&&os.tmpdir()===process.env.TMPDIR&&!os.tmpdir().startsWith('/tmp'),'dedicated temporary directory required');fs.mkdirSync(out,{recursive:true});
 const stat=fs.statfsSync(out),report={schema:3,head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),submittedHead:process.env.WAVE3_SUBMITTED_HEAD||git('rev-parse','HEAD'),ci:{sha:process.env.GITHUB_SHA||null,run:process.env.GITHUB_RUN_ID||null,attempt:process.env.GITHUB_RUN_ATTEMPT||null},environment:{node:process.version,platform:process.platform,arch:process.arch,playwright:require(path.join(path.dirname(require.resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright')),'package.json')).version},sourceHashes:Object.fromEntries(sourceFiles.map(f=>[f,digest(fs.readFileSync(path.join(root,f)))])),executionHashes:Object.fromEntries(executionFiles.map(f=>[f,digest(fs.readFileSync(path.join(__dirname,f)))])),started:new Date().toISOString(),capacity:{freeBytes:stat.bavail*stat.bsize,freeInodes:stat.ffree,estimatedEvidenceBytes:300*1024*1024},results:matrix().map(c=>({...c,status:'NOT_RUN',checks:[],errors:[],servedHashes:{}})),controls:[],exitCode:1};
 assert.ok(report.capacity.freeBytes>report.capacity.estimatedEvidenceBytes*2,'insufficient capacity');const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));for(const fault of faults)fs.writeFileSync(path.join(out,`fault-${fault}.js`),mutationSource(fault));save();
 const allow=new Set(sourceFiles);const server=http.createServer((req,res)=>{const parts=new URL(req.url,'http://localhost').pathname.slice(1).split('/');const fault=parts[0]==='fault'?parts[1]:null;const name=(fault?parts.slice(2).join('/'):parts.join('/'))||'index.html';if(name==='favicon.ico'){res.writeHead(204);return res.end()}if((fault&&!faults.includes(fault))||!allow.has(name)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');let data=fs.readFileSync(path.join(root,name));if(fault&&name==='wave3.js')data=Buffer.concat([data,Buffer.from(mutationSource(fault))]);res.end(data)});
 server.on('error',e=>{report.environmentError=e.message;save()});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});const url=`http://127.0.0.1:${server.address().port}/`;
 try{for(const engine of ['chromium','webkit']){let browser;try{browser=await pw[engine].launch({headless:true});for(const r of report.results.filter(x=>x.engine===engine)){r.version=browser.version();r.started=new Date().toISOString();let ctx,p;const responses=[];try{ctx=await browser.newContext({viewport:{width:r.width,height:1000},hasTouch:true,reducedMotion:r.zoom===2?'reduce':'no-preference'});await ctx.tracing.start({screenshots:true,snapshots:true,sources:true});p=await ctx.newPage();p.setDefaultTimeout(5000);p.on('pageerror',e=>r.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')r.errors.push(m.text())});p.on('response',res=>{const u=new URL(res.url());const name=u.pathname.slice(1)||'index.html';if(sourceFiles.includes(name))responses.push(res.body().then(b=>{r.servedHashes[name]=digest(b)}))});await p.goto(url+'?wave3-condition='+key(r));await Promise.all(responses);assert.deepEqual(r.servedHashes,report.sourceHashes,'served resources differ');assert.equal(await p.locator('#gallery article').count(),132);if(r.theme==='light')await p.locator('#theme').click();await setupZoom(p,r);await exercise(p,r);
 r.exhibitScreenshots=[];for(const id of [130,131,132]){const filename=key(r)+'-exhibit-'+id+'.png';await host(p,id).screenshot({path:path.join(out,filename)});const bytes=fs.readFileSync(path.join(out,filename));r.exhibitScreenshots.push({id,file:filename,sha256:digest(bytes),width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)})}
 r.screenshot=key(r)+'.png';await p.screenshot({path:path.join(out,r.screenshot)});r.sha256=digest(fs.readFileSync(path.join(out,r.screenshot)));r.checks.push('screenshot');assert.deepEqual(r.errors,[]);measureContract(r);r.status='PASS'}catch(e){r.status='FAIL';r.error=e.stack;if(p)try{r.failureScreenshot=key(r)+'-failure.png';await p.screenshot({path:path.join(out,r.failureScreenshot)})}catch(capture){r.captureError=capture.message}}finally{if(ctx){r.trace=key(r)+'.zip';try{await ctx.tracing.stop({path:path.join(out,r.trace)});r.traceSha256=digest(fs.readFileSync(path.join(out,r.trace)))}catch(e){r.status='FAIL';r.traceError=e.message}await ctx.close()}r.finished=new Date().toISOString();save()}}
 await faultControls(browser,url,engine,report,save);
 }catch(e){report.engineErrors=report.engineErrors||[];report.engineErrors.push({engine,error:e.stack});for(const r of report.results.filter(x=>x.engine===engine&&x.status==='NOT_RUN')){r.status='BLOCKED';r.error=e.message}save()}finally{if(browser)await browser.close()}}
 report.exitCode=report.results.every(r=>r.status==='PASS')&&report.controls.every(c=>c.detected&&c.green)?0:1;report.finished=new Date().toISOString();const files=fs.readdirSync(out);report.capacity.generatedFiles=files.length;report.capacity.generatedBytes=files.reduce((sum,f)=>sum+fs.statSync(path.join(out,f)).size,0);const after=fs.statfsSync(out);report.capacity.afterFreeBytes=after.bavail*after.bsize;report.capacity.afterFreeInodes=after.ffree;save();try{report.audit=audit(report,out,{head:report.head,tree:report.tree,submittedHead:report.submittedHead})}catch(e){report.audit={status:'FAIL',error:e.message};report.exitCode=1}save();process.exitCode=report.exitCode;
 }finally{await new Promise(resolve=>server.close(resolve))}
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
module.exports={exercise,run,faultControls,faultCheck,mutationSource,barCheck};
