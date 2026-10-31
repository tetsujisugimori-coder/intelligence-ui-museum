const BASE_CHECKS=['font condition','document overflow','Button full visibility','Select full visibility','selected label','JavaScript errors','external responses','CSP attempts classified'];
const MATRIX_CHECKS=[...BASE_CHECKS,'Select list accessible name','Select list form value','Button visible after hover','Button focus outer geometry (not WCAG verdict)','Button keyboard focus','Button click/Enter/Space','Button disabled','disabled count stable','Button disabled while loading','Select expanded visible','Select mouse selection','Select card accessible name','Select card form value','Select changed text visible','Select touch selection','Select keyboard selection','Select keyboard focus','Select aria-disabled attribute'];
const V09_CHECKS=['117 rendered cards','search, category switching','theme','Modal open/Escape','Primary and Select interactions (3 exhibits including Modal)'];
const SIX_CHECKS=['Badge','Switch','Tooltip visible on hover and hidden after Escape','Alert color/close/reopen','already-loaded offline Button'];
function sameChecks(actual,expected){return Array.isArray(actual)&&actual.length===expected.length&&new Set(actual).size===actual.length&&expected.every(x=>actual.includes(x));}
// Fail closed: a completed process is not evidence of a passing test suite.
function failures(report, kind) {
 const bad=[];
 if(!report || !Array.isArray(report.conditions) || !Array.isArray(report.failures))return ['invalid report'];
 if(report.failures.length)bad.push('engine/runner failure');
 if(!report.finished)bad.push('unfinished report');
 const seen=new Set();
 if(kind==='matrix'){
  const after=report.conditions.filter(x=>!x.prefix);
  if(after.length!==40)bad.push('expected 40 after conditions');
  for(const r of report.conditions){
   const key=JSON.stringify([r.engine,r.width,r.theme,r.text,r.mode,r.prefix||'']);
   if(seen.has(key))bad.push('duplicate condition');seen.add(key);
   if(r.error || !Array.isArray(r.checks) || !r.checks.length)bad.push('incomplete condition');
   if(!['chromium','webkit'].includes(r.engine)||![320,375,390,1280].includes(r.width)||!['light','dark'].includes(r.theme)||![100,200].includes(r.text)||!['root','browser-font'].includes(r.mode)|| (r.mode==='browser-font'&&(r.engine!=='chromium'||r.text!==200)))bad.push('unexpected condition');
   if(!sameChecks((r.checks||[]).map(x=>x.name),r.prefix?BASE_CHECKS:MATRIX_CHECKS))bad.push('missing, duplicate or unexpected assertion');
   const failed=(r.checks||[]).filter(x=>x.pass!==true);
   if(r.prefix){
    // Only the two original visibility regressions are expected RED.
    if(r.prefix!=='before/' || r.width!==320 || r.theme!=='light'||r.text!==200||r.mode!=='root'||!failed.length||failed.some(x=>!['Button full visibility','Select full visibility'].includes(x.name)))bad.push('unexpected or missing baseline RED');
   }else if(failed.length)bad.push('failed assertion');
  }
  for(const engine of ['chromium','webkit'])for(const width of [320,375,390,1280])for(const theme of ['light','dark'])for(const text of [100,200])if(!seen.has(JSON.stringify([engine,width,theme,text,'root',''])))bad.push('missing root condition');
  for(const width of [320,375,390,1280])for(const theme of ['light','dark'])if(!seen.has(JSON.stringify(['chromium',width,theme,200,'browser-font',''])))bad.push('missing font condition');
 }else if(kind==='smoke'){
  if(report.conditions.length!==12)bad.push('expected 12 smoke conditions');
  for(const r of report.conditions){
   const key=JSON.stringify([r.engine,r.width||'',!!r.sixComponents,!!r.noJS]);if(seen.has(key))bad.push('duplicate condition');seen.add(key);
   if(!['chromium','webkit'].includes(r.engine)||r.error||!Array.isArray(r.errors)||r.errors.length)bad.push('condition error');
   if(r.noJS){if(r.cards!==117)bad.push('noJS baseline count');}
   else if(r.status!=='PASS'||!sameChecks(r.checks,r.sixComponents?SIX_CHECKS:V09_CHECKS))bad.push('failed smoke condition');
  }
  for(const engine of ['chromium','webkit']){
   for(const width of [320,375,390,1280])if(!seen.has(JSON.stringify([engine,width,false,false])))bad.push('missing width');
   if(!seen.has(JSON.stringify([engine,'',true,false]))||!seen.has(JSON.stringify([engine,'',false,true])))bad.push('missing smoke mode');
  }
 }else bad.push('unknown report kind');
 return [...new Set(bad)];
}
module.exports={failures,MATRIX_CHECKS,BASE_CHECKS};
