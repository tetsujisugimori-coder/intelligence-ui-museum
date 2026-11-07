'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const CHECKS=['environment','layout','Button','Badge','Alert','Switch','Select','Tooltip','errors'];
const POLICY_ERROR='Error: THIRD_POLICY_FORCED_CLICK_NOT_TESTED';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function policyCallsite(source){
 const needle='await t.click({force:true})',at=source.indexOf(needle);
 if(at<0||source.indexOf(needle,at+1)!==-1)throw Error('Unique policy stop anchor missing');
 const line=source.slice(0,at).split('\n').length,firstColumn=at-source.lastIndexOf('\n',at);
 return {line,firstColumn,lastColumn:firstColumn+needle.length-1};
}
function policyStopValid(row,receipt,expected,index){
 const c=(Array.isArray(row?.checks)?row.checks:[]).find(c=>c?.name==='Select'),p=row?.selectPaint;
 if(typeof row?.id!=='string'||typeof receipt?.recordedAt!=='string'||typeof c?.started!=='string'||typeof c?.finished!=='string')return false;
 const at=Date.parse(receipt?.recordedAt),start=Date.parse(c?.started),end=Date.parse(c?.finished),site=expected.policyCallsite;
 return c?.pass===false&&c.error===POLICY_ERROR&&
  receipt?.schema===1&&receipt.kind==='disabled-select-force-click'&&receipt.blockedBeforeDispatch===true&&
  receipt.page===index+1&&receipt.runnerHash===expected.runner&&receipt.selector==='#Select .stage [role=button]'&&
  equal(receipt.options,{force:true})&&receipt.callsite?.matched===true&&
  typeof expected.runToken==='string'&&expected.runToken.length>=16&&receipt.runToken===expected.runToken&&
  site&&receipt.callsite.line===site.line&&Number.isSafeInteger(receipt.callsite.column)&&receipt.callsite.column>=site.firstColumn&&receipt.callsite.column<=site.lastColumn&&
  Number.isFinite(at)&&Number.isFinite(start)&&Number.isFinite(end)&&at>=start&&at<=end&&
  p?.pass===true&&p.active===true&&p.visible===true&&Array.isArray(p.clipping)&&p.clipping.length===0&&
  Array.isArray(row.images)&&equal(p.images,['on','off','off2','on2'].map(s=>row.id+'-Select-'+s+'.png'))&&
  p.images.every(f=>row.images?.includes(f));
}
function audit(result,expected,processResult,receipts=[]){
 const reasons=[];
 if(processResult?.error||processResult?.signal||![0,1].includes(processResult?.status))reasons.push('PROCESS_ABNORMAL');
 if(!result||!Array.isArray(result.rows)||!Array.isArray(result.failures))return [...reasons,'RESULT_MISSING'];
 for(const key of ['head','tree','runner'])if(result[key]!==expected[key])reasons.push(key.toUpperCase()+'_MISMATCH');
 if(!equal(result.source,expected.source))reasons.push('SOURCE_MISMATCH');
 if(result.failures.length)reasons.push('RUN_FAILURE');
 // The byte-pinned historical runner never emitted top-level CHECKS. This
 // explicit legacy schema exception does not weaken any per-row check.
 const historical=expected.resultSchema==='historical-v1'&&expected.runner==='94d6111fb59f4c7b192dc20759d1dbad63913efc084f4f8678236f229adb1ee1'&&result.diagnosticNotFormal===true&&result.sourceRunner==='scripts/s3-reaccept/browser.cjs'&&result.sourceRunnerHash==='a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1';
 if(result.expected!==expected.ids.length||(!equal(result.CHECKS,CHECKS)&&!(historical&&result.CHECKS===undefined)))reasons.push('EXPECTED_CHECKS_MISMATCH');
 if(result.rows.length!==expected.ids.length||new Set(result.rows.map(r=>r?.id)).size!==expected.ids.length||result.rows.some((r,i)=>r?.id!==expected.ids[i]))reasons.push('CONDITION_IDS_MISMATCH');
 for(const [i,row] of result.rows.entries()){
  if(!row||typeof row!=='object'){reasons.push('ROW_INVALID');continue;}
  if(!Array.isArray(row.errors)||row.errors.length)reasons.push('PAGEERROR_OR_MISSING');
  if(!Array.isArray(row.console)||row.console.some(c=>c?.classification!=='known-font-CSP'||typeof c.message!=='string'||!/https:\/\/cdn\.openai\.com\/common\/fonts\/katex\/KaTeX_[A-Za-z0-9-]+\.woff2/.test(c.message)||!/Content Security Policy|content security policy|font-src/.test(c.message)))reasons.push('CONSOLE_ERROR_OR_MISSING');
  if(row.error)reasons.push('ROW_ERROR');
  if(!Array.isArray(row.checks)){reasons.push('CHECKS_INCOMPLETE');continue;}
  const names=row.checks.map(c=>c?.name);
  if(!CHECKS.every(n=>names.includes(n)))reasons.push('CHECKS_INCOMPLETE');
  if(new Set(names).size!==names.length)reasons.push('CHECKS_DUPLICATE');
  if(!equal(names,CHECKS))reasons.push('CHECK_ORDER_MISMATCH');
  for(const c of row.checks){
   if(typeof c?.pass!=='boolean')reasons.push('CHECK_PASS_INVALID');
   if(c?.pass===true&&c.error)reasons.push('CHECK_STATE_CONTRADICTION');
   if(c?.name!=='Select'&&c?.pass!==true)reasons.push('REQUIRED_CHECK_FAILED:'+(typeof c?.name==='string'?c.name:'INVALID_NAME'));
  }
  const select=row.checks.find(c=>c?.name==='Select');
  const receipt=receipts[i];
  if(select?.pass!==true){
   if(!policyStopValid(row,receipt,expected,i))reasons.push('SELECT_UNEXPECTED_FAILURE');
  }else if(receipt)reasons.push('POLICY_RECEIPT_UNEXPECTED');
  const status=!row.error&&equal(names,CHECKS)&&row.checks.every(c=>c.pass===true)?'PASS':'FAIL';
  if(row.status!==status)reasons.push('ROW_STATUS_MISMATCH');
 }
 if(receipts.slice(result.rows.length).some(Boolean))reasons.push('POLICY_RECEIPT_UNEXPECTED');
 const suiteStatus=result.rows.length===expected.ids.length&&result.rows.every(r=>r?.status==='PASS')&&!result.failures.length?'PASS':'FAIL';
 if(result.status!==suiteStatus)reasons.push('SUITE_STATUS_MISMATCH');
 if(processResult?.status!==(suiteStatus==='PASS'?0:1))reasons.push('PROCESS_STATUS_MISMATCH');
 return [...new Set(reasons)];
}
// Verify the original runner's manifest before semantic evaluation. A coherent forged
// manifest is not authenticated evidence; semantic checks remain independently required.
function evidenceAudit(dir,result){
 const reasons=[];let manifest;
 try{manifest=JSON.parse(fs.readFileSync(path.join(dir,'SHA256SUMS.json')));}catch{return ['EVIDENCE_MANIFEST_MISSING'];}
 if(!manifest||typeof manifest!=='object'||Array.isArray(manifest))return ['EVIDENCE_MANIFEST_INVALID'];
 const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
 const actual=walk(dir).map(f=>path.relative(dir,f).split(path.sep).join('/')).filter(f=>f!=='SHA256SUMS.json').sort();
 if(!equal(Object.keys(manifest).sort(),actual))reasons.push('EVIDENCE_FILE_SET_MISMATCH');
 for(const [f,h] of Object.entries(manifest)){
  if(typeof h!=='string'||!/^[a-f0-9]{64}$/.test(h)||f.includes('\\')||f.split('/').some(s=>['..','.',''].includes(s))||path.isAbsolute(f)){reasons.push('EVIDENCE_MANIFEST_INVALID');continue;}
  try{if(sha(fs.readFileSync(path.join(dir,f)))!==h)reasons.push('EVIDENCE_HASH_MISMATCH');}catch{reasons.push('EVIDENCE_FILE_MISSING');}
 }
 for(const row of Array.isArray(result?.rows)?result.rows:[]) {
  if(!row||!Array.isArray(row.images)){reasons.push('EVIDENCE_IMAGE_LIST_INVALID');continue;}
  for(const f of [...row.images,...(Array.isArray(row.selectPaint?.images)?row.selectPaint.images:[])]){
   if(typeof f!=='string'||!Object.hasOwn(manifest,f)){reasons.push('EVIDENCE_IMAGE_MISSING');continue;}
   try{const b=fs.readFileSync(path.join(dir,f));if(!f.endsWith('.png')||b.length<24||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')reasons.push('EVIDENCE_IMAGE_INVALID');}catch{reasons.push('EVIDENCE_IMAGE_MISSING');}
  }
  const p=row.selectPaint;
  if(p?.pass===true){
   try{
    const {PNG}=require('../../tools/stage-a-browser/node_modules/playwright-core/lib/utilsBundle.js');
    const {measure}=require('../../apps/v10/scripts/stage2r-focus-pixels.cjs');
    if(!geometry(p)||!equal(p.images,['on','off','off2','on2'].map(s=>row.id+'-Select-'+s+'.png')))throw Error('invalid paint geometry/images');
    const x=Math.max(0,Math.floor(p.rect.x-24)),y=Math.max(0,Math.floor(p.rect.y-24));
    const clip={x,y,width:Math.min(p.viewport.width,Math.ceil(p.rect.right+24))-x,height:Math.min(p.viewport.height,Math.ceil(p.rect.bottom+24))-y};
    const images=p.images.map(f=>PNG.sync.read(fs.readFileSync(path.join(dir,f))));
    if(images.some(i=>i.width!==clip.width||i.height!==clip.height))throw Error('image capture dimensions');
    const measured=measure(images,clip,[{x:p.rect.x,y:p.rect.y,width:p.rect.width,height:p.rect.height}]);
    if(!measured.pass||['unstable','changed','indicators','threshold','reason'].some(k=>!equal(measured[k],p[k])))reasons.push('EVIDENCE_PAINT_MISMATCH');
   }catch{reasons.push('EVIDENCE_PAINT_INVALID');}
  }
 }
 return [...new Set(reasons)];
}
const geometry=g=>g&&g.rect&&['x','y','width','height','top','left','right','bottom'].every(k=>Number.isFinite(g.rect[k]))&&g.rect.width>0&&g.rect.height>0;
function traceAudit(t,level){
 const reasons=[];
 if(!t||t.collectionError||!t.final)reasons.push('TRACE_FINAL_MISSING');
 if(!t?.final||typeof t.final!=='object'||Array.isArray(t.final)||!Number.isFinite(t.final.scrollY)||typeof t.final.hasFocus!=='boolean'||(level==='none'&&typeof t.final.active!=='string'))reasons.push('TRACE_FINAL_INVALID');
 if(!t||t.level!==level)reasons.push('TRACE_LEVEL_MISMATCH');
 if(level!=='none'){
  if(!Array.isArray(t?.events)||!t.events.some(e=>e.type==='focusin')||!t.events.some(e=>e.type==='keydown'&&e.key===' '))reasons.push('TRACE_EVENTS_INCOMPLETE');
  if(t?.overflow)reasons.push('TRACE_OVERFLOW');
  if(level==='full'){
   if(!Array.isArray(t?.frames)||!t.frames.some(f=>geometry(f.trigger)&&Number.isFinite(f.ms)&&Number.isFinite(f.scrollY)))reasons.push('TRACE_RAF_MISSING');
   if(!t?.events?.some(e=>geometry(e.option)&&geometry(e.popup)&&geometry(e.trigger)&&Number.isFinite(e.ms)&&Number.isFinite(e.scrollY)&&e.viewport?.width>0&&e.viewport?.height>0&&e.expanded==='true'))reasons.push('TRACE_POPUP_GEOMETRY_MISSING');
   if(!t?.final?.triggerId||typeof t.final.hasFocus!=='boolean')reasons.push('TRACE_FINAL_IDENTITY_MISSING');
  }
 }
 return reasons;
}
module.exports={audit,traceAudit,evidenceAudit,policyStopValid,policyCallsite,CHECKS,POLICY_ERROR};
