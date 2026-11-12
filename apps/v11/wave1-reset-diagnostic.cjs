'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{pathToFileURL}=require('node:url');
const {queryScenario,verifyZoom}=require('./wave1-browser.cjs');const {selectors,digest}=require('./wave1-contract.cjs');
const pw=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright');
async function main(){
 if(!process.env.TMPDIR||os.tmpdir()!==process.env.TMPDIR)throw Error('dedicated temp required');
 const out=path.resolve(process.env.EVIDENCE_DIR),root=path.resolve(process.env.APP_ROOT);fs.mkdirSync(out,{recursive:true});
 const report={kind:'native-reset-diagnostic',transport:process.env.APP_URL?'http':'file-local-only',productHead:process.env.WAVE1_PRODUCT_HEAD,plan:'RESET-FOLLOWUP-PLAN.md',runs:[]};
 const browser=await pw.webkit.launch();report.version=browser.version();
 try{for(const mode of ['original','expanded','none'])for(let repetition=1;repetition<=3;repetition++){
  process.env.WAVE1_RESET_OBSERVER=mode;const r={mode,repetition,width:375,zoom:2,status:'FAIL'};report.runs.push(r);
  const ctx=await browser.newContext({viewport:{width:375,height:1000},reducedMotion:'reduce'}),p=await ctx.newPage();r.errors=[];p.on('pageerror',e=>r.errors.push(e.message));
  try{await p.goto(process.env.APP_URL||pathToFileURL(path.join(root,'index.html')).href);
   r.zoomBaseline=await p.evaluate(selectors=>{
    const baseline=Object.fromEntries(selectors.map(s=>{const e=document.querySelector(s);if(!e)throw Error('missing '+s);return [s,parseFloat(getComputedStyle(e).fontSize)]}));
    const rules={};for(const host of document.querySelectorAll('[data-wave1]'))for(const e of [host,...host.querySelectorAll('*')]){const sel=`[data-wave1="${host.dataset.wave1}"]${e===host?'':' '+e.tagName.toLowerCase()}`;const size=parseFloat(getComputedStyle(e).fontSize);if(rules[sel]&&rules[sel]!==size)throw Error('nonuniform baseline');rules[sel]=size;}
    const style=document.createElement('style');style.textContent=Object.entries(rules).map(([s,n])=>`${s}{font-size:${n*2}px!important}`).join('\n');document.head.append(style);return baseline;
   },selectors);
   await verifyZoom(p,r,'initial');await queryScenario(p,r);await verifyZoom(p,r,'query');r.status='PASS';
  }catch(e){r.error=e.stack}finally{
   try{r.resetTrace=await p.evaluate(()=>window.wave1ResetTrace||null);r.finalState=await p.locator('[data-wave1="124"] [data-w1-state]').innerText();r.screenshot=`${mode}-${repetition}.png`;await p.screenshot({path:path.join(out,r.screenshot)});r.sha256=digest(fs.readFileSync(path.join(out,r.screenshot)))}catch(e){r.captureError=e.message}
   await ctx.close();fs.writeFileSync(path.join(out,'reset-results.json'),JSON.stringify(report,null,2));
  }
 }}finally{await browser.close()}
 process.exitCode=report.runs.every(r=>r.status==='PASS'&&!r.errors.length)?0:1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
