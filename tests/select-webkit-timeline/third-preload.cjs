'use strict';
// Node-side adapter: prohibit the original runner's later disabled force-click.
// Uninstrumented lane adds no browser-side hooks or pre-click awaits.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {installProbe}=require('./third-probe.cjs');
const repo=path.resolve(__dirname,'../..');
const pw=require(path.join(repo,'tools/stage-a-browser/node_modules/playwright'));
let serial=0;
for(const engine of ['chromium','webkit']){
 const launch=pw[engine].launch.bind(pw[engine]);
 pw[engine].launch=async(...args)=>{const browser=await launch(...args),newPage=browser.newPage.bind(browser);
 browser.newPage=async(...opts)=>{const page=await newPage(...opts),index=++serial,close=page.close.bind(page);const proto=Object.getPrototypeOf(page.locator('body'));
 if(!proto.__thirdGuard){const click=proto.click;proto.click=function(options){
  if(options?.force){
   const error=new Error('THIRD_POLICY_FORCED_CLICK_NOT_TESTED');
   const runner=path.resolve(process.env.THIRD_RUNNER_PATH||'');
   const source=fs.readFileSync(runner,'utf8');
   const frame=error.stack.split('\n').find(line=>line.includes(runner+':'))||'';
   const match=frame.match(/:(\d+):(\d+)\)?$/),line=Number(match?.[1]),column=Number(match?.[2]);
   const sourceLine=source.split(/\r?\n/)[line-1]||'',needle='await t.click({force:true})',offset=sourceLine.indexOf(needle);
   const matched=source.split(needle).length===2&&offset>=0&&column>=offset+1&&column<=offset+needle.length;
   const owner=this.page().__thirdPageIndex;
   const receipt={schema:1,kind:'disabled-select-force-click',blockedBeforeDispatch:true,page:owner,runToken:process.env.THIRD_RUN_TOKEN,
    runnerHash:crypto.createHash('sha256').update(source).digest('hex'),selector:this._selector,options,
    callsite:{line,column,matched},recordedAt:new Date().toISOString()};
   fs.writeFileSync(path.join(process.env.EVIDENCE_DIR,`third-policy-${owner}.json`),JSON.stringify(receipt,null,2),{flag:'wx'});
   if(!matched||this._selector!=='#Select .stage [role=button]'||JSON.stringify(options)!=='{"force":true}')throw Error('THIRD_POLICY_UNEXPECTED_FORCED_CLICK_NOT_TESTED');
   throw error;
  }
  return click.call(this,options);
 };Object.defineProperty(proto,'__thirdGuard',{value:true});}
 page.__thirdPageIndex=index;
 if(process.env.THIRD_PROBE!=='none')await page.addInitScript(installProbe,process.env.THIRD_PROBE||'events');
 page.close=async(...a)=>{const dir=process.env.EVIDENCE_DIR;try{const trace=await page.evaluate(()=>window.__thirdProbe?.collect()||{level:'none',instrumentation:'no browser hooks; final-only collection',final:{scrollY,hasFocus:document.hasFocus(),active:document.activeElement?.id}});fs.writeFileSync(path.join(dir,`third-trace-${index}.json`),JSON.stringify(trace,null,2));}catch(e){fs.writeFileSync(path.join(dir,`third-trace-${index}.json`),JSON.stringify({collectionError:String(e)}));}return close(...a);};return page;};return browser;};
}
