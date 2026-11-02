'use strict';
// CSS test instrumentation, not native OS text sizing or physical device testing.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{exercise}=require('./transfer-scenarios.cjs');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright');
const out=process.env.EVIDENCE_DIR;fs.mkdirSync(out,{recursive:true});const rows=[];
(async()=>{for(const engine of (process.env.TRANSFER_ENGINES||'chromium,webkit').split(',')){
 const browser=await ({chromium,webkit}[engine]).launch({headless:true,executablePath:process.env[engine.toUpperCase()+'_EXECUTABLE']});
 try{for(const width of [375,390,1280]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),r={engine,width,version:browser.version(),theme:width===390?'light':'dark',checks:[],observations:[],errors:[],consoleErrors:[],fonts:[],geometry:[],focus:[]};
  page.on('pageerror',e=>r.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')r.consoleErrors.push(m.text())});
  const shot=async name=>{await page.locator('[data-id="119"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${engine}-${width}-text-${name}.png`)})};
  try{
   await page.goto(process.env.MUSEUM_URL,{waitUntil:'domcontentloaded'});if(r.theme==='light')await page.locator('#theme').click();
   // First measure the original root-only test rather than calling it text doubling.
   r.rootCss=await page.evaluate(()=>{const el=document.querySelector('[data-id="119"] p.description');const before=parseFloat(getComputedStyle(el).fontSize);document.documentElement.style.setProperty('font-size','200%','important');return {before,after:parseFloat(getComputedStyle(el).fontSize),root:parseFloat(getComputedStyle(document.documentElement).fontSize)}});
   assert.equal(r.rootCss.before,14);assert.equal(r.rootCss.after,14);assert.equal(r.rootCss.root,32);
   r.fonts=await page.evaluate(()=>{
    document.documentElement.style.removeProperty('font-size');
    const nodes=[...document.querySelectorAll('.card')].filter(c=>+c.dataset.id>=118).flatMap(c=>[c,...c.querySelectorAll('*')]);
    const sizes=nodes.map(el=>({el,before:parseFloat(getComputedStyle(el).fontSize)}));
    // Snapshot all original sizes before changing inherited styles.
    for(const {el,before} of sizes)el.style.setProperty('font-size',`${before*2}px`,'important');
    return [118,119,120,121,122,123].map(id=>{const el=document.querySelector(`[data-id="${id}"] p.description`);return {id,before:sizes.find(x=>x.el===el).before,after:parseFloat(getComputedStyle(el).fontSize)}});
   });
   assert(r.fonts.every(x=>x.before===14&&x.after===28));
   // Transfer re-renders its native inputs. Enlarge replacements from the saved
   // baseline by applying the measured 28px native control rule as well.
   await page.addStyleTag({content:'.card[data-id="119"] [data-item] { font-size:28px !important; }'});
   await exercise(page,r,shot);assert(r.checks.every(x=>x.pass));
   // Reset replaces nodes; restore the measured styles before geometry/focus checks.
   await page.evaluate(()=>{for(const c of [...document.querySelectorAll('.card')].filter(c=>+c.dataset.id>=118))for(const el of c.querySelectorAll('*')){if(!el.style.getPropertyValue('font-size'))el.style.setProperty('font-size','28px','important')}});
   for(const id of [118,119,120,121,122,123]){
    const card=page.locator(`[data-id="${id}"]`);await card.scrollIntoViewIfNeeded();
    // Direct text ranges detect actual clipped text under overflow clipping ancestors.
    const geometry=await card.evaluate(el=>{
     const clipped=[];for(const node of el.querySelectorAll('*')){
      const rect=node.getBoundingClientRect(),style=getComputedStyle(node);if(!rect.width||!rect.height)continue;
      if(/hidden|clip/.test(style.overflowX)&&node.scrollWidth>node.clientWidth+1)clipped.push({tag:node.tagName,reason:'horizontal clipping',text:node.textContent.slice(0,40)});
      if(/hidden|clip/.test(style.overflowY)&&node.scrollHeight>node.clientHeight+1)clipped.push({tag:node.tagName,reason:'vertical clipping',text:node.textContent.slice(0,40)});
      for(const child of node.childNodes)if(child.nodeType===Node.TEXT_NODE&&child.textContent.trim()){
       const range=document.createRange();range.selectNodeContents(child);
       for(const r of range.getClientRects())for(let a=node;a&&el.contains(a);a=a.parentElement){const s=getComputedStyle(a),b=a.getBoundingClientRect();if((/hidden|clip/.test(s.overflowX)&&(r.left<b.left-1||r.right>b.right+1))||(/hidden|clip/.test(s.overflowY)&&(r.top<b.top-1||r.bottom>b.bottom+1)))clipped.push({tag:node.tagName,reason:'text range clipped',text:child.textContent.slice(0,40)})}
      }
     }
     return {id:+el.dataset.id,width:el.clientWidth,scrollWidth:el.scrollWidth,documentWidth:document.documentElement.clientWidth,documentScrollWidth:document.documentElement.scrollWidth,clipped};
    });r.geometry.push(geometry);assert(geometry.scrollWidth<=geometry.width+1,`card ${id} horizontal overflow`);assert(geometry.documentScrollWidth<=geometry.documentWidth,`document overflow ${id}`);assert.deepEqual(geometry.clipped,[],`clipping ${id}`);
    const control=card.locator('.v11-demo button:not(:disabled),.v11-demo input,.v11-demo select').first();await control.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await control.scrollIntoViewIfNeeded();
    const focus=await control.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el),padding=parseFloat(s.outlineWidth)+parseFloat(s.outlineOffset),clipped=[];for(let a=el.parentElement;a;a=a.parentElement){const b=a.getBoundingClientRect(),t=getComputedStyle(a);if((/hidden|clip/.test(t.overflowX)&&(r.left-padding<b.left||r.right+padding>b.right))||(/hidden|clip/.test(t.overflowY)&&(r.top-padding<b.top||r.bottom+padding>b.bottom)))clipped.push(a.tagName)}return {active:el===document.activeElement,visible:el.matches(':focus-visible'),outline:s.outlineWidth,clipped}});r.focus.push({id,...focus});assert.equal(focus.active,true);assert.equal(focus.visible,true);assert(parseFloat(focus.outline)>0);assert.deepEqual(focus.clipped,[]);
    await card.screenshot({path:path.join(out,`${engine}-${width}-text-card-${id}.png`)});
   }
  }catch(e){r.error=e.stack}
  finally{await context.close();r.status=!r.error&&!r.errors.length&&!r.consoleErrors.length?'PASS':'FAIL';rows.push(r);fs.writeFileSync(path.join(out,'text-zoom.json'),JSON.stringify(rows,null,2))}
 }}finally{await browser.close()}}
 console.log(JSON.stringify(rows,null,2));if(rows.some(x=>x.status!=='PASS'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
