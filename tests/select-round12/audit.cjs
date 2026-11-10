'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const plan=require('./plan.json'),{snapshotErrors}=require('./targets.cjs');
const {PNG}=require('../../tools/stage-a-browser/node_modules/playwright-core/lib/utilsBundle.js');
const {measure}=require('../../apps/v10/scripts/stage2r-focus-pixels.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const expectedOps={A:[],B:['on'],C:['setup-on','off'],D:['on','off'],E:['setup-on','off','on'],F:['on','off'],G:['on','off']};
function inspect(d,expected){
 const errors=[],check=(v,k)=>{if(!v)errors.push(k)};
 check(eq(d.plan,plan),'plan');check(d.planHash===hash(fs.readFileSync(path.join(__dirname,'plan.json'))),'plan hash');
 check(d.head===expected.head&&/^[a-f0-9]{40}$/.test(d.head||''),'head');check(d.system?.platform===expected.platform,'platform');check(d.engine===expected.engine,'engine');
 check(d.dirty===''&&!d.fatal&&d.browserClosed===true&&d.exitCode===0&&expected.exit===0&&d.validation?.length===0,'completion');
 check(d.playwright==='1.56.1'&&d.sdkVersion==='0.2.2','dependencies');check(d.stage3==='HOLD'&&d.rootCause==='UNKNOWN','claims');
 const slots=[];for(let i=1;i<=plan.repeats;i++)for(const c of i%2?plan.conditions:[...plan.conditions].reverse())slots.push(`${c}-${i}`);
 check(eq(d.rows?.map(r=>r.id),slots),'trial count/order');
 for(const r of d.rows||[]){
  const c=(v,k)=>check(v,r.id+':'+k);
  c(r.id===`${r.condition}-${r.iteration}`&&plan.conditions.includes(r.condition)&&Number.isInteger(r.iteration)&&r.iteration>=1&&r.iteration<=plan.repeats,'row identity');
  c(r.status==='COMPLETE'&&r.cleanup===true&&!r.error&&!r.captureError&&r.pageErrors?.length===0,'completion');
  c(d.engine==='webkit'?r.browser==='26.0':/^141\./.test(r.browser),'browser version');
  c(eq(r.operations?.map(x=>x.slot),['setup','first','second']),'boundary order');
  const ops=expectedOps[r.condition];c(eq(r.operations?.filter(x=>x.op).map(x=>x.op),ops),'operation order');
  const steps=['goto',...ops.map(o=>'switch-'+o),'normalize','normalize-empty-style','pointer-history','acquire','open','escape'];
  c(eq(r.steps?.map(s=>s.name),steps)&&r.steps?.every(s=>s.success&&Number.isFinite(s.started)&&s.finished>=s.started),'steps');
  let checked=false;
  for(const op of r.operations||[]){
   c(op.before?.switch?.checkboxChecked===checked&&op.before?.switch?.disabled===checked,'before switch');
   if(op.op)checked=op.op.endsWith('on');
   c(op.after?.switch?.checkboxChecked===checked&&op.after?.switch?.disabled===checked&&op.after?.switch?.checked==='false','after switch');
   for(const s of [op.before?.select,op.after?.select])c(snapshotErrors(s).length===0,'operation snapshot');
  }
  c(r.switchFinal?.checkboxChecked===checked&&r.switchFinal?.disabled===checked,'switch final');
  c(eq(Object.keys(r.samples||{}).sort(),['beforePrelude','beforePhoto','afterPhoto','beforeStyleNormalization','afterStyleNormalization','beforeHistory','beforeFocus','open'].sort()),'snapshot inventory');
  const snaps=[...Object.values(r.samples||{}),r.acquisition,r.final,r.paint?.captureSnapshot,...(r.tabRoute||[])];
  for(const s of snaps){c(snapshotErrors(s).length===0,'snapshot');c(typeof s?.trigger?.computed?.boxShadow==='string','box shadow');}
  c(r.acquisition?.focused===true&&r.acquisition?.expanded==='false','focus target');c(r.samples?.open?.expanded==='true'&&r.final?.expanded==='false','menu lifecycle');
  c(r.condition==='F'?r.tabRoute?.length>0&&r.tabRoute.length<=40&&r.tabRoute.at(-1)?.focused:r.tabRoute?.length===0,'Tab route');
  c(Array.isArray(r.events)&&r.events.length>0&&r.overflow===false,'events');
  c(r.events?.every((e,i)=>e.seq===i+1&&Number.isFinite(e.time)&&(i===0||e.time>=r.events[i-1].time)),'event order');
  const ev=r.events?.filter(e=>['input','change'].includes(e.kind)&&e.target?.section==='Switch');
  c(ev?.length===ops.length*2,'input/change count');
  for(let i=0;i<ops.length;i++)c(ev?.[2*i]?.kind==='input'&&ev?.[2*i+1]?.kind==='change'&&ev?.[2*i]?.target?.checked===ops[i].endsWith('on')&&ev?.[2*i+1]?.target?.checked===ops[i].endsWith('on'),'input/change state');
  c(typeof r.paint?.pass==='boolean'&&Number.isInteger(r.paint?.changed)&&r.paint.changed>=0,'pixels');
  c(r.paint?.active===r.paint?.captureSnapshot?.focused&&r.paint?.visible===r.paint?.captureSnapshot?.focusVisible,'paint state');
 }
 for(let i=1;i<=plan.repeats;i++){
  const a=d.rows?.find(r=>r.id===`A-${i}`)?.samples?.beforeFocus;
  for(const cond of plan.conditions){const b=d.rows?.find(r=>r.id===`${cond}-${i}`)?.samples?.beforeFocus;
   check(a&&b&&['html','scroll','viewport','font','theme','hasFocus','visibility'].every(k=>eq(a[k],b[k]))&&['trigger','hidden'].every(e=>['rect','computed'].every(k=>eq(a[e]?.[k],b[e]?.[k]))),'target equivalence:'+cond+':'+i);
  }
 }
 return errors;
}
function audit(root,expected){
 const read=f=>JSON.parse(fs.readFileSync(path.join(root,f))),d=read('results.json'),errors=inspect(d,expected),check=(v,k)=>{if(!v)errors.push(k)};
 const safe=f=>typeof f==='string'&&path.basename(f)===f&&!f.includes('..');
 const sums=read('SHA256SUMS.json');check(eq(Object.keys(sums).sort(),fs.readdirSync(root).filter(f=>f!=='SHA256SUMS.json').sort()),'manifest inventory');
 for(const [f,h]of Object.entries(sums))check(safe(f)&&hash(fs.readFileSync(path.join(root,f)))===h,'hash:'+f);
 const repo=path.resolve(__dirname,'../..');check(execFileSync('git',['rev-parse',d.head+'^{tree}'],{cwd:repo,encoding:'utf8'}).trim()===d.tree,'tree');
 const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(p,x.name)):[path.join(p,x.name)]);
 const inventory={sources:walk(__dirname).map(p=>path.relative(repo,p).split(path.sep).join('/')),product:['src/main.tsx','src/main.css','src/select-focus-return.ts','package.json','package-lock.json'],build:walk(path.join(repo,'.work/v10/dist')).map(p=>path.relative(path.join(repo,'.work/v10/dist'),p).split(path.sep).join('/'))};
 for(const [category,prefix]of [['sources',''],['product','apps/v10'],['build','.work/v10/dist']]){check(eq(Object.keys(d[category]||{}).sort(),inventory[category].sort()),'source inventory:'+category);for(const[f,h]of Object.entries(d[category]||{}))check(!f.includes('..')&&hash(fs.readFileSync(path.join(repo,prefix,f)))===h,'source:'+f);}
 for(const r of d.rows||[]){
  try{
   check(eq(read(r.id+'.json'),r),'row consistency');
   const images=['on','off','off2','on2'].map(n=>r.id+'-Select-'+n+'.png');check(eq(r.images,images)&&eq(r.paint?.images,images),'image inventory');
   check(r.traceFile===r.id+'-trace.zip'&&r.afterImage===r.id+'-after.png','asset identity');
   for(const f of [...images,r.afterImage]){const p=PNG.sync.read(fs.readFileSync(path.join(root,f)));check(p.width>0&&p.height>0,'PNG');}
   const p=r.paint,imgs=images.map(f=>PNG.sync.read(fs.readFileSync(path.join(root,f))));
   check(imgs.every(i=>i.width===p.clip.width&&i.height===p.clip.height),'clip size');check(eq(p.rect,p.captureSnapshot.trigger.rect),'rect binding');
   const m=measure(imgs,p.clip,[p.rect]);for(const k of ['changed','unstable','indicators','threshold','reason'])check(eq(p[k],m[k]),'pixel recomputation');
   const pass=p.active&&p.visible&&p.clipping?.length===0&&m.pass;check(p.pass===pass,'pixel PASS');
   check(r.classification?.outline===(!r.final.focused||!r.final.hasFocus?'FOCUS_LOST':pass?'VISIBLE':m.changed===0?'ABSENT':'INSUFFICIENT'),'classification');
   check(execFileSync('python',[path.join(__dirname,'trace-check.py'),path.join(root,r.traceFile),plan.id+':'+r.id,r.condition,String(r.tabRoute.length)],{encoding:'utf8'}).trim()==='VALID','trace');
  }catch(e){errors.push(r.id+':asset '+String(e).split('\n')[0]);}
 }
 return {diagnostic:errors.length?'FAIL':'PASS',errors,rootCause:'UNKNOWN',stage3:'HOLD'};
}
module.exports={inspect,audit};
if(require.main===module){let result;try{result=audit(path.resolve(process.argv[2]),{head:process.env.ROUND12_EXPECT_HEAD,platform:process.env.ROUND12_EXPECT_PLATFORM,engine:process.env.ROUND12_ENGINE||'webkit',exit:Number(process.env.ROUND12_RUNNER_EXIT)});}catch(e){result={diagnostic:'FAIL',errors:[String(e)]};}console.log(JSON.stringify(result,null,2));process.exitCode=result.diagnostic==='PASS'?0:1;}
