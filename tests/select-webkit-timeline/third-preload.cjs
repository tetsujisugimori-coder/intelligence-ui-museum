'use strict';
// Node-side adapter: prohibit the original runner's later disabled force-click.
// Uninstrumented lane adds no browser-side hooks or pre-click awaits.
const fs=require('node:fs'),path=require('node:path');
const {installProbe}=require('./third-probe.cjs');
const repo=path.resolve(__dirname,'../..');
const pw=require(path.join(repo,'tools/stage-a-browser/node_modules/playwright'));
let serial=0;
for(const engine of ['chromium','webkit']){
 const launch=pw[engine].launch.bind(pw[engine]);
 pw[engine].launch=async(...args)=>{const browser=await launch(...args),newPage=browser.newPage.bind(browser);
 browser.newPage=async(...opts)=>{const page=await newPage(...opts),index=++serial,close=page.close.bind(page);const proto=Object.getPrototypeOf(page.locator('body'));
 if(!proto.__thirdGuard){const click=proto.click;proto.click=function(options){if(options?.force)throw Error('THIRD_POLICY_FORCED_CLICK_NOT_TESTED');return click.call(this,options);};Object.defineProperty(proto,'__thirdGuard',{value:true});}
 if(process.env.THIRD_PROBE!=='none')await page.addInitScript(installProbe,process.env.THIRD_PROBE||'events');
 page.close=async(...a)=>{const dir=process.env.EVIDENCE_DIR;try{const trace=await page.evaluate(()=>window.__thirdProbe?.collect()||{level:'none',instrumentation:'no browser hooks; final-only collection',final:{scrollY,hasFocus:document.hasFocus(),active:document.activeElement?.id}});fs.writeFileSync(path.join(dir,`third-trace-${index}.json`),JSON.stringify(trace,null,2));}catch(e){fs.writeFileSync(path.join(dir,`third-trace-${index}.json`),JSON.stringify({collectionError:String(e)}));}return close(...a);};return page;};return browser;};
}
