"use strict";
const fs=require('node:fs'),path=require('node:path'),{exercise}=require('./transfer-scenarios.cjs');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright');
const out=process.env.EVIDENCE_DIR;fs.mkdirSync(out,{recursive:true});const rows=[];
(async()=>{for(const engine of (process.env.TRANSFER_ENGINES||'chromium,webkit').split(',')){
 const browser=await ({chromium,webkit}[engine]).launch({headless:true,executablePath:process.env[engine.toUpperCase()+'_EXECUTABLE']});
 try{for(const width of [375,390,1280]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),r={engine,version:browser.version(),width,theme:width===390?'light':'dark',checks:[],observations:[],errors:[],consoleErrors:[]};
  page.on('pageerror',e=>r.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')r.consoleErrors.push(m.text())});
  const shot=async name=>{await page.locator('[data-id="119"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${engine}-${width}-transfer-${name}.png`)})};
  try{await page.goto(process.env.MUSEUM_URL,{waitUntil:'domcontentloaded'});if(r.theme==='light')await page.locator('#theme').click();await exercise(page,r,shot)}catch(e){r.error=e.stack}
  finally{await context.close();r.status=!r.error&&!r.errors.length&&!r.consoleErrors.length&&r.checks.length===6&&r.checks.every(x=>x.pass)?'PASS':'FAIL';rows.push(r);fs.writeFileSync(path.join(out,'transfer.json'),JSON.stringify(rows,null,2))}
 }}finally{await browser.close()}}
 console.log(JSON.stringify(rows,null,2));if(rows.some(x=>x.status!=='PASS'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
