'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const plan=require('./plan.json'),{slots,classify,comparisons}=require('./model.cjs'),{resolveCalls}=require('./caller.cjs'),{snapshotErrors}=require('../select-round12/targets.cjs');
const {PNG}=require('../../tools/stage-a-browser/node_modules/playwright-core/lib/utilsBundle.js'),{measure}=require('../../apps/v10/scripts/stage2r-focus-pixels.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),repo=path.resolve(__dirname,'../..');
function inspect(d,expected){
 const errors=[],check=(v,k)=>{if(!v)errors.push(k)};
 check(d.schema===1&&eq(d.plan,plan)&&d.planHash===hash(fs.readFileSync(path.join(__dirname,'plan.json'))),'plan');
 check(d.head===expected.head&&/^[a-f0-9]{40}$/.test(d.head||'')&&d.system?.platform===expected.platform&&d.engine===expected.engine,'provenance');
 check(d.dirty===''&&!d.fatal&&d.browserClosed===true&&d.exitCode===0&&expected.exit===0&&d.validation?.length===0,'completion');
 check(d.playwright===plan.playwright&&d.sdkVersion===plan.sdkVersion,'dependencies');check(d.stage3==='HOLD'&&d.rootCause==='UNKNOWN'&&d.productAcceptance==='NO','claims');
 const inventory=slots(d.phase);check(eq(d.rows?.map(r=>r.id),inventory.map(r=>r.id)),'trial count/order');
 for(const [i,r]of (d.rows||[]).entries()){
  const c=(v,k)=>check(v,r.id+':'+k),s=inventory[i];c(s&&Object.entries(s).every(([k,v])=>eq(r[k],v)),'identity');
  c(r.probeInstalled===r.probe,'probe installation');c(eq(r.classification,classify(r))&&r.classification.diagnostic==='COMPLETE','classification');
  c(d.engine==='webkit'?r.browser==='26.0':/^141\./.test(r.browser),'browser');
  const names=['goto',...plan.histories[r.condition].map(o=>'switch-'+o),'normalize','normalize-empty-style','pointer-history','acquire','open','escape'];
  c(eq(r.steps?.map(x=>x.name),names),'operation order');c(r.steps?.every((x,i)=>x.success&&Number.isFinite(x.start)&&x.end>=x.start&&(i===0||x.start>=r.steps[i-1].end)),'step chronology');
  c(eq(r.switchInitial,{checked:false,disabled:false})&&eq(r.switchFinal,{checked:r.condition==='B',disabled:r.condition==='B'}),'Switch state');
  for(const snap of [r.initial,r.beforeFocus,r.final,r.paint?.captureSnapshot])c(snapshotErrors(snap).length===0,'snapshot');
  c(r.initial.time<=r.beforeFocus.time&&r.beforeFocus.time<=r.final.time&&r.final.time<=r.paint.captureSnapshot.time,'snapshot chronology');
  c(r.beforeFocus.focused===false&&r.final.expanded==='false','focus/menu');
  const iv=r.intervention,hasAPI=r.experiment==='measurement'&&['A1','A2','A3'].includes(r.arm),budget=r.experiment==='measurement'&&r.arm!=='A0'?200:0;
  c(iv?.kind===(r.experiment==='caller'?'NONE':r.arm)&&iv.budgetMs===budget,'measurement group');
  c(Number.isFinite(iv?.start)&&iv.start>=r.steps.at(-1).end&&iv.end>=iv.start&&r.finalStart>=iv.end&&r.finalEnd>=r.finalStart,'intervention chronology');
  c(hasAPI?Number.isFinite(iv.apiStart)&&iv.apiStart>=iv.start&&iv.apiEnd>=iv.apiStart&&iv.end>=iv.apiEnd:iv.apiStart===null&&iv.apiEnd===null,'API presence/timing');
  c(typeof iv.overrun==='boolean'&&iv.apiDuration===(hasAPI?iv.apiEnd-iv.apiStart:0),'API duration');
  if(r.arm==='A1')c(iv.result===null,'no-op return');if(r.arm==='A2')c(snapshotErrors(iv.result).length===0&&iv.result.time<=r.final.time,'DOM intervention');
  if(r.arm==='A3')c(iv.image===r.id+'-intermediate.png','image intervention');
  c(r.paint.active===r.paint.captureSnapshot.focused&&r.paint.visible===r.paint.captureSnapshot.focusVisible,'paint state');
  c(r.final.focused===r.final.trigger.focused&&r.final.focusVisible===r.final.trigger.focusVisible,'final focus duplicate');
  c(r.final.focusVisible===r.paint.captureSnapshot.focusVisible&&r.final.focused===r.paint.captureSnapshot.focused,'adjacent focus state');
  c(['outline','afterOutline'].every(k=>r.paint[k]===r.paint.captureSnapshot.trigger.computed[k])&&r.paint.shadow===r.paint.captureSnapshot.trigger.computed.boxShadow&&r.paint.afterShadow===r.paint.captureSnapshot.trigger.computed.afterShadow,'pseudo CSS');
  if(r.probe){
   c(Array.isArray(r.events)&&r.events.length>0&&!r.overflow&&Array.isArray(r.calls),'probe completeness');
   c(r.events.every((e,i)=>e.seq===i&&Number.isFinite(e.time)&&(i===0||e.time>=r.events[i-1].time)),'event chronology');
   for(const key of [' ','Escape'])for(const type of ['keydown','keyup'])c(r.events.some(e=>e.type===type&&e.key===key),'keyboard event missing');
   for(const type of ['focus-call','focus-return','focusin','focusout','focus','blur','trigger-mutation','menu-dom-change','microtask-after-escape'])c(r.events.some(e=>e.type===type),'event missing '+type);
   c(r.calls.every((call,i)=>call.index===i&&Number.isFinite(call.time)&&call.end>=call.time&&typeof call.stack==='string'&&r.events.filter(e=>e.type==='focus-call'&&e.index===i).length===1&&r.events.filter(e=>e.type==='focus-return'&&e.index===i).length===1),'call chronology');
   c(eq(r.callers,resolveCalls(r.calls,path.join(repo,'.work/v10/dist'))),'caller attribution');
  }else c(r.events===null&&r.calls===null&&r.overflow===null&&eq(r.callers,[]),'probe OFF');
  c(r.tracing?r.traceFile===r.id+'-trace.zip':r.traceFile===null,'trace arm');
 }
 check(eq(d.pairs,comparisons(d.rows,d.phase)),'pairs recomputation');return errors;
}
function audit(root,expected){
 const d=JSON.parse(fs.readFileSync(path.join(root,'results.json'))),errors=inspect(d,expected),check=(v,k)=>{if(!v)errors.push(k)};
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'SHA256SUMS.json')));
 check(eq(Object.keys(manifest).sort(),fs.readdirSync(root).filter(n=>n!=='SHA256SUMS.json').sort()),'manifest inventory');
 for(const [n,h]of Object.entries(manifest)){check(path.basename(n)===n,'manifest path');check(hash(fs.readFileSync(path.join(root,n)))===h,'hash '+n)}
 check(execFileSync('git',['rev-parse',d.head+'^{tree}'],{cwd:repo,encoding:'utf8'}).trim()===d.tree,'tree');
 for(const [n,h]of Object.entries(d.sources))check(hash(execFileSync('git',['show',d.head+':'+n],{cwd:repo}))===h,'source '+n);
 for(const r of d.rows){
  check(eq(JSON.parse(fs.readFileSync(path.join(root,r.id+'.json'))),r),'raw row '+r.id);
  const images=['on','off','off2','on2'].map(n=>r.id+'-Select-'+n+'.png');check(eq(r.paint.images,images)&&eq(r.images,r.arm==='A3'?[r.id+'-intermediate.png',...images]:images),'image inventory');
  const p=r.paint,m=measure(images.map(f=>PNG.sync.read(fs.readFileSync(path.join(root,f)))),p.clip,[{x:p.rect.x,y:p.rect.y,width:p.rect.width,height:p.rect.height}]);
  for(const k of ['changed','unstable','indicators','threshold','reason'])check(eq(p[k],m[k]),'pixel recomputation '+r.id+':'+k);
  check(p.pass===(p.active&&p.visible&&!p.clipping.length&&m.pass),'pixel pass '+r.id);
  if(r.tracing)check(execFileSync('python',[path.join(__dirname,'trace-check.py'),path.join(root,r.traceFile),plan.id+':'+r.id,r.condition,JSON.stringify(r.paint.clip)],{encoding:'utf8'}).trim()==='VALID','trace '+r.id);
 }
 return {diagnostic:errors.length?'FAIL':'PASS',errors,head:d.head,phase:d.phase,rows:d.rows.length,productAcceptance:'NO',rootCause:'UNKNOWN'};
}
module.exports={inspect,audit};
if(require.main===module){try{const d=JSON.parse(fs.readFileSync(path.join(process.argv[2],'results.json'))),result=audit(process.argv[2],{head:process.env.ROUND14_EXPECT_HEAD,platform:process.env.ROUND14_EXPECT_PLATFORM,engine:process.env.ROUND14_ENGINE,exit:Number(process.env.ROUND14_RUNNER_EXIT)});console.log(JSON.stringify(result,null,2));process.exitCode=result.errors.length?1:0}catch(e){console.log(JSON.stringify({diagnostic:'FAIL',errors:[String(e)]}));process.exitCode=1}}
