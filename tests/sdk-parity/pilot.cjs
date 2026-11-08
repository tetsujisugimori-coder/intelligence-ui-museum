const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const root=path.resolve(process.env.SDK_APP||'.work/sdk-parity'),out=path.resolve(process.env.SDK_OUT||'.work/sdk-pilot'),engine=process.env.SDK_ENGINE||'chromium';
const pw=require(process.env.PLAYWRIGHT_MODULE||'../../tools/stage-a-browser/node_modules/playwright');
if(fs.existsSync(out))throw Error('fresh evidence required');fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const server=http.createServer((req,res)=>{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname.includes('..')){res.writeHead(400);res.end();return;}let file=path.join(root,'dist-detail',pathname==='/'?'index.html':pathname);try{res.setHeader('content-type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const rows=[];try{browser=await pw[engine].launch();for(const route of ['direct','tab'])for(const condition of ['native','paired-cancel','paired-plain']){
 const row={route,condition,engine,status:'INCOMPLETE',errors:[]},page=await browser.newPage({viewport:{width:375,height:1000},colorScheme:'light'});rows.push(row);page.on('pageerror',e=>row.errors.push(String(e)));
 try{await page.goto(`http://127.0.0.1:${server.address().port}/?condition=${condition}`);const trigger=page.locator('[data-parity-trigger]');await trigger.waitFor();
 if(route==='direct')await trigger.focus();else{await page.locator('#before').focus();await page.keyboard.press('Tab');if(!await trigger.evaluate(e=>e===document.activeElement))throw Error('Tab did not reach trigger');}
 await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>document.querySelector('[data-parity-trigger]')?.getAttribute('aria-expanded')==='true');
 row.before=await trigger.evaluate(e=>({active:document.activeElement?.id,expanded:e.getAttribute('aria-expanded')}));
 await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('[data-parity-trigger]')?.getAttribute('aria-expanded')==='false');
 row.result=await page.evaluate(()=>{const e=document.querySelector('[data-parity-trigger]'),r=e.getBoundingClientRect(),s=getComputedStyle(e);return{active:document.activeElement?.id,focused:document.activeElement===e,focusVisible:e.matches(':focus-visible'),expanded:e.getAttribute('aria-expanded'),value:document.querySelector('#value').textContent,rect:{x:r.x,y:r.y,width:r.width,height:r.height},outline:s.outline,events:window.__parity.events};});
 const r=row.result.rect;const png=await page.screenshot({clip:{x:Math.max(0,r.x-16),y:Math.max(0,r.y-16),width:r.width+32,height:r.height+32},animations:'disabled'});row.pngFile=`${route}-${condition}.png`;row.pngSha256=sha(png);fs.writeFileSync(path.join(out,row.pngFile),png);row.status='COMPLETE';
 }catch(e){row.error=String(e);}finally{await page.close();fs.writeFileSync(path.join(out,`${route}-${condition}.json`),JSON.stringify(row,null,2));}}
 }catch(e){rows.push({status:'INCOMPLETE',error:String(e)});}finally{if(browser)await browser.close();server.close();}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({engine,rows},null,2));console.log(rows.map(r=>({route:r.route,condition:r.condition,status:r.status,error:r.error,result:r.result&&{focus:r.result.focusVisible,focused:r.result.focused,events:r.result.events.map(e=>[e.kind,e.cancelled])}})));
 process.exitCode=rows.length!==6||rows.some(r=>r.status!=='COMPLETE'||r.errors?.length)?1:0;
})();
