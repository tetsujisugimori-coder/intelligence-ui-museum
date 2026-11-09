'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const plan=require('./plan.json');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const errors=[];
const fail=(condition,msg)=>{if(!condition)errors.push(msg)};
const root=path.resolve(process.argv[2]||'.work/select-round10');
const repo=path.resolve(__dirname,'../..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
function slots(){
 const out=[];
 for(let iteration=1;iteration<=plan.repeats;iteration++)for(const factor of plan.factors)for(const arm of iteration%2?[0,1]:[1,0])out.push({id:`${factor}-${arm}-${iteration}`,factor,arm,iteration,...plan.arms[factor][arm]});
 return out;
}
function rect(x){return x&&['x','y','width','height'].every(k=>Number.isFinite(x[k]))&&x.width>0&&x.height>0}
function inspect(d){
 const expected=slots();
 fail(eq(d.plan,plan),'plan-object');
 fail(d.planHash===hash(fs.readFileSync(path.join(__dirname,'plan.json'))),'plan-hash');
 fail(/^[a-f0-9]{40}$/.test(d.head||''),'head-sha');
 fail(d.head===process.env.ROUND10_EXPECT_HEAD,'unexpected-producer-head');
 fail(/^[a-f0-9]{40}$/.test(d.tree||''),'tree-sha');
 fail(d.playwright==='1.56.1'&&d.sdkVersion==='0.2.2','versions');
 fail(d.rootCause==='UNKNOWN'&&d.stage3==='HOLD'&&d.oldOffscreenClick==='NOT_TESTED','status-claim');
 fail(!d.fatal&&d.browserClosed===true&&d.exitCode===0&&!d.validation?.length,'producer-exit-and-cleanup');
 fail(d.rows?.length===plan.expectedSlotsPerEnvironment,'row-count');
 fail(new Set(d.rows?.map(x=>x.id)).size===plan.expectedSlotsPerEnvironment,'row-ids');
 fail(d.system?.platform===process.env.ROUND10_EXPECT_PLATFORM,'platform');
 for(const cat of ['sources','product','build']){
  fail(d[cat]&&Object.keys(d[cat]).length>0,'source-category:'+cat);
  for(const [f,v] of Object.entries(d[cat]||{})){
   fail(/^[a-f0-9]{64}$/.test(v),`bad-hash:${cat}:${f}`);
   const local=path.join(repo,cat==='product'?'apps/v10':cat==='build'?'.work/v10/dist':'',f);
   fail(fs.existsSync(local)&&hash(fs.readFileSync(local))===v,`source-byte-mismatch:${cat}:${f}`);
  }
 }
 for(const expectedSlot of expected){
  const row=d.rows?.find(r=>r.id===expectedSlot.id);
  if(!row){errors.push('missing:'+expectedSlot.id);continue}
  for(const [k,v] of Object.entries(expectedSlot))fail(eq(row[k],v),'slot-identity:'+row.id+':'+k);
  fail(row.status==='COMPLETE'&&row.cleanup===true&&!row.error&&!row.captureError,'incomplete:'+row.id);
  fail(row.browser==='26.0','browser:'+row.id);
  fail(row.classification?.diagnostic==='COMPLETE'&&row.classification?.cause!=='CERTAIN','classification:'+row.id);
  fail(Array.isArray(row.pageErrors)&&row.pageErrors.length===0,'pageerror:'+row.id);
  fail(Array.isArray(row.steps)&&row.steps.length>0&&row.steps.every(s=>s.success===true&&Number.isFinite(s.started)&&Number.isFinite(s.finished)),'steps:'+row.id);
  const stepNames=['goto',...(expectedSlot.prelude?['prelude']:[]),'normalize',...(expectedSlot.preScreenshot?['pre-screenshot']:[]),...(expectedSlot.clearEmptyStyle?['normalize-empty-style']:[]),...(expectedSlot.emptyStyle?['empty-style-diagnostic']:[]),'pointer-history','acquire','open','escape'];
  fail(eq(row.steps?.map(s=>s.name),stepNames),'step-order:'+row.id);
  const sn=row.samples||{},a=row.acquisition,f=row.final;
  for(const s of ['beforePhoto','afterPhoto','beforeHistory','beforeFocus','open'])fail(sn[s]&&typeof sn[s].html==='string'&&typeof sn[s].time==='number','snapshot:'+row.id+':'+s);
  fail(a&&a.focused===true&&typeof a.focusVisible==='boolean','acquisition:'+row.id);
  fail(f&&typeof f.focused==='boolean'&&typeof f.focusVisible==='boolean'&&f.expanded==='false','final:'+row.id);
  fail(sn.beforeFocus?.viewport?.width===375&&sn.beforeFocus?.viewport?.height===1000&&sn.beforeFocus?.font==='16px','viewport:'+row.id);
  fail(sn.beforeFocus?.styleNodeCount===1,'marker-identity:'+row.id);
  if(expectedSlot.clearEmptyStyle){
   fail(sn.beforeStyleNormalization&&sn.afterStyleNormalization,'neutralization-snapshots:'+row.id);
   fail(sn.afterStyleNormalization?.disabled?.[0]?.attrs?.style===undefined&&sn.afterStyleNormalization?.hidden?.attrs?.style===undefined,'neutralization-incomplete:'+row.id);
  }
  if(expectedSlot.fullProbe){
   const ev=row.events;
   fail(Array.isArray(ev)&&ev.length>0&&row.overflow===false,'events:'+row.id);
   if(Array.isArray(ev)){
    fail(ev.every((e,i)=>e.seq===i+1&&Number.isFinite(e.time)&&(i===0||e.time>=ev[i-1].time)),'event-order:'+row.id);
    const keys=ev.filter(e=>e.kind==='keydown'&&e.trusted===true).map(e=>e.key===' '?'Space':e.key);
    fail(keys.includes('Space')&&keys.includes('Escape'),'event-keys:'+row.id);
   }
  }else fail(row.events===null,'probe-off-should-have-no-events:'+row.id);
  const p=row.paint;
  fail(p&&typeof p.pass==='boolean'&&Number.isInteger(p.changed)&&p.changed>=0&&Array.isArray(p.images)&&p.images.length===4,'paint:'+row.id);
  const assets=[row.afterImage,row.traceFile,...row.images,...(expectedSlot.preScreenshot?[row.preImage]:[])];
  fail(assets.every(x=>typeof x==='string'&&x&&!path.isAbsolute(x)&&fs.existsSync(path.join(root,x))&&fs.statSync(path.join(root,x)).size>0),'assets:'+row.id);
  const rowFile=row.id+'.json';
  fail(fs.existsSync(path.join(root,rowFile))&&eq(read(rowFile),row),'row-file:'+row.id);
  fail(row.paint?.active===f?.focused&&row.paint?.visible===f?.focusVisible,'paint-state:'+row.id);
 }
 fail(Array.isArray(d.pairs)&&d.pairs.length===plan.factors.length*plan.repeats,'pair-count');
 for(const pair of d.pairs||[]){
  const [a,b]=[0,1].map(i=>d.rows?.find(r=>r.factor===pair.factor&&r.iteration===pair.iteration&&r.arm===i));
  if(!a||!b)continue;
  const x=a.samples?.beforeFocus,y=b.samples?.beforeFocus;
  if(!x||!y)continue;
  const mismatch=['scroll','viewport','font','theme'].some(k=>!eq(x[k],y[k]))||!eq(x.trigger?.rect,y.trigger?.rect)||!eq(x.trigger?.computed,y.trigger?.computed);
  let delta=false;
  if(pair.factor==='empty-style')delta=x.htmlNoEmptyStyle!==y.htmlNoEmptyStyle||x.styleNodeCount!==1||y.styleNodeCount!==1||x.disabled?.[0]?.attrs?.style!==undefined||y.disabled?.[0]?.attrs?.style!==''||x.hidden?.attrs?.style!==undefined||y.hidden?.attrs?.style!=='';
  else if(pair.factor==='pre-screenshot')delta=a.samples?.beforePhoto?.html!==b.samples?.beforePhoto?.html;
  else delta=x.html!==y.html;
  const shouldConfirm=!mismatch&&!delta;
  fail((pair.equivalence==='CONFIRMED_TARGET')===shouldConfirm,'equivalence-claim:'+pair.factor+':'+pair.iteration);
  fail(pair.rootCause==='UNKNOWN','cause-claim:'+pair.factor+':'+pair.iteration);
 }
 const sums=read('SHA256SUMS.json');
 for(const [file,digest] of Object.entries(sums)){
  const target=path.join(root,file);
  fail(!path.isAbsolute(file)&&!file.includes('..')&&fs.existsSync(target)&&hash(fs.readFileSync(target))===digest,'manifest:'+file);
 }
 fail(!Object.hasOwn(sums,'SHA256SUMS.json'),'manifest-self');
 fail(Object.hasOwn(sums,'results.json'),'manifest-results');
}
try{
 fail(fs.existsSync(root),'raw-output-not-found');
 if(fs.existsSync(root))inspect(read('results.json'));
}catch(e){errors.push('audit-exception:'+String(e))}
const verdict={diagnostic:errors.length?'FAIL':'PASS',rootCause:'UNKNOWN',stage3:'HOLD',errors,artifactRoot:root,head:process.env.ROUND10_EXPECT_HEAD||null};
console.log(JSON.stringify(verdict,null,2));
if(errors.length)process.exitCode=1;

