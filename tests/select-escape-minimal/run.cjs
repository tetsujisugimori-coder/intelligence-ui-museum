'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os');
const {CASES,ROUTES,validateRow,comparePair}=require('./classify.cjs');
const playwright=require('../../tools/stage-a-browser/node_modules/playwright');
const engine=process.env.MINIMAL_ENGINE||'chromium';
const repeats=Number(process.env.MINIMAL_REPEATS||2);
const output=path.resolve(process.env.MINIMAL_OUT||'.work/escape-minimal');
if(!['chromium','webkit'].includes(engine)||!Number.isInteger(repeats)||repeats<1||repeats>20)throw Error('Invalid plan');
if(fs.existsSync(output))throw Error('Fresh output directory required');
fs.mkdirSync(output,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourceFiles=['fixture.html','fixture.js','classify.cjs','run.cjs'];
const source=Object.fromEntries(sourceFiles.map(n=>[n,sha(fs.readFileSync(path.join(__dirname,n)))]));
const server=http.createServer((request,response)=>{
  const pathname=new URL(request.url,'http://127.0.0.1').pathname;
  if(!['/fixture.html','/fixture.js'].includes(pathname)){response.writeHead(404);response.end();return;}
  response.writeHead(200,{'content-type':pathname.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8','cache-control':'no-store'});
  response.end(fs.readFileSync(path.join(__dirname,pathname.slice(1))));
});
async function main(){
 const rows=[],failures=[],started=new Date().toISOString();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
   browser=await playwright[engine].launch();
   for(const route of ROUTES)for(let iteration=1;iteration<=repeats;iteration++)for(const name of CASES){
     const id=engine+'-'+route+'-'+iteration+'-'+name;
     const row={id,case:name,engine,route,iteration,sourceSha256:source['fixture.js'],status:'INCOMPLETE',errors:[]};
     rows.push(row);
     let page;
     try{
       page=await browser.newPage({viewport:{width:375,height:1000},colorScheme:'light'});
       page.on('pageerror',e=>row.errors.push(String(e)));
       page.setDefaultTimeout(5000);
       await page.goto('http://127.0.0.1:'+server.address().port+'/fixture.html?case='+name);
       await page.waitForFunction(()=>window.minimalFixture?.ready===true);
       await page.locator('#trigger').click();
       await page.waitForFunction(()=>document.querySelector('#trigger').getAttribute('aria-expanded')==='true');
       if(route==='tab')await page.keyboard.press('Tab');
       else await page.locator('#choice').focus();
       if(!await page.locator('#choice').evaluate(e=>document.activeElement===e))throw Error('Focus route not established');
       await page.keyboard.press('Escape');
       if(name==='delegated-open')await page.waitForFunction(()=>window.minimalFixture?.snapshot().keydownCancelled===false);
       else await page.waitForFunction(()=>window.minimalFixture?.snapshot().triggerFocused===true&&window.minimalFixture?.snapshot().open===false);
       row.snapshot=await page.evaluate(()=>window.minimalFixture.snapshot());
       const png=await page.locator('#trigger').screenshot({animations:'disabled',scale:'css'});
       row.pngFile=id+'.png';fs.writeFileSync(path.join(output,row.pngFile),png);
       row.pngSha256=sha(png);
       row.status='COMPLETE';
       const check=validateRow(row);
       if(check.length)throw Error('invalid row: '+check.join(','));
     }catch(e){row.status='INCOMPLETE';row.error=String(e);failures.push(id+': '+String(e));}
     finally{
       if(page)await page.close();
       fs.writeFileSync(path.join(output,id+'.json'),JSON.stringify(row,null,2));
     }
   }
 }catch(e){failures.push('runner: '+String(e));}finally{
  if(browser)await browser.close();
  server.close();
 }
 const pairs=[];
 for(const route of ROUTES)for(let iteration=1;iteration<=repeats;iteration++){
   const a=rows.find(r=>r.route===route&&r.iteration===iteration&&r.case==='controlled-cancel');
   const b=rows.find(r=>r.route===route&&r.iteration===iteration&&r.case==='controlled-plain');
   const report=comparePair(a,b);pairs.push({route,iteration,...report});
 }
 const result={scope:'MODEL_ONLY_NOT_SDK_CAUSAL',engine,repeats,platform:os.platform(),node:process.version,playwright:require('../../tools/stage-a-browser/node_modules/playwright/package.json').version,started,finished:new Date().toISOString(),expected:repeats*ROUTES.length*CASES.length,source,rows:rows.map(r=>({id:r.id,file:r.id+'.json'})),pairs,failures};
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(result,null,2));
 const inventory=fs.readdirSync(output).filter(f=>f!=='SHA256SUMS.json');
 fs.writeFileSync(path.join(output,'SHA256SUMS.json'),JSON.stringify(Object.fromEntries(inventory.map(f=>[f,sha(fs.readFileSync(path.join(output,f)))])),null,2));
 console.log(JSON.stringify({scope:result.scope,engine,expected:result.expected,completed:rows.filter(r=>r.status==='COMPLETE').length,pairs,failures},null,2));
 process.exitCode=failures.length||rows.length!==result.expected||pairs.some(p=>p.classification!=='MODEL_COMPARABLE')?1:0;
}
main().catch(e=>{console.error(e);process.exitCode=1;server.close();});
