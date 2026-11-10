'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const planFile=process.env.ROUND11_PHASE==='B'?'plan-b.json':'plan.json';
const plan=require('./'+planFile);
const {snapshotErrors,styleState}=require('./targets.cjs');
const {PNG}=require('../../tools/stage-a-browser/node_modules/playwright-core/lib/utilsBundle.js');
const {measure}=require('../../apps/v10/scripts/stage2r-focus-pixels.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const errors=[];
const fail=(condition,msg)=>{if(!condition)errors.push(msg)};
const root=path.resolve(process.argv[2]||'.work/select-round11');
const repo=path.resolve(__dirname,'../..');
const safe=file=>typeof file==='string'&&file.length>0&&path.basename(file)===file&&!file.includes('..')&&!path.isAbsolute(file);
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
 fail(d.planHash===hash(fs.readFileSync(path.join(__dirname,planFile))),'plan-hash');
 fail(/^[a-f0-9]{40}$/.test(d.head||''),'head-sha');
 fail(d.head===process.env.ROUND11_EXPECT_HEAD,'unexpected-producer-head');
 fail(/^[a-f0-9]{40}$/.test(d.tree||''),'tree-sha');
 fail(d.playwright==='1.56.1'&&d.sdkVersion==='0.2.2','versions');
 fail(d.rootCause==='UNKNOWN'&&d.stage3==='HOLD'&&d.oldOffscreenClick==='NOT_TESTED','status-claim');
 fail(!d.fatal&&d.browserClosed===true&&d.exitCode===0&&Array.isArray(d.validation)&&d.validation.length===0,'producer-exit-and-cleanup');
 fail(process.env.ROUND11_RUNNER_EXIT==='0','actual-runner-exit');
 fail(d.dirty==='','dirty-producer');
 try{fail(d.tree===execFileSync('git',['rev-parse',d.head+'^{tree}'],{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim(),'producer-tree')}catch{errors.push('producer-tree-unresolved')}
 fail(d.rows?.length===plan.expectedSlotsPerEnvironment,'row-count');
 fail(eq(d.rows?.map(r=>r.id),expected.map(r=>r.id)),'trial-order');
 fail(new Set(d.rows?.map(x=>x.id)).size===plan.expectedSlotsPerEnvironment,'row-ids');
 fail(d.system?.platform===process.env.ROUND11_EXPECT_PLATFORM,'platform');
 const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
 const expectedFiles={sources:walk(__dirname).map(f=>path.relative(repo,f).split(path.sep).join('/')),product:['src/main.tsx','src/main.css','src/select-focus-return.ts','package.json','package-lock.json'],build:walk(path.join(repo,'.work/v10/dist')).map(f=>path.relative(path.join(repo,'.work/v10/dist'),f).split(path.sep).join('/'))};
 for(const cat of ['sources','product','build']){
  fail(eq(Object.keys(d[cat]||{}).sort(),expectedFiles[cat].sort()),'source-inventory:'+cat);
  fail(d[cat]&&Object.keys(d[cat]).length>0,'source-category:'+cat);
  for(const [f,v] of Object.entries(d[cat]||{})){
   if(!expectedFiles[cat].includes(f)){errors.push('unexpected-source-path:'+cat);continue}
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
  const rowStart=Date.parse(row.started),rowEnd=Date.parse(row.finished);
  fail(Number.isFinite(rowStart)&&Number.isFinite(rowEnd)&&rowEnd>=rowStart,'row-time:'+row.id);
  let previousEnd=rowStart;
  for(const step of row.steps||[]){fail(step.started>=previousEnd&&step.finished>=step.started&&step.finished<=rowEnd,'step-time:'+row.id+':'+step.name);previousEnd=step.finished}
  const stepNames=['goto','groups','normalize',...(expectedSlot.preScreenshot?['pre-screenshot']:[]),...(expectedSlot.clearEmptyStyle?['normalize-empty-style']:[]),...(expectedSlot.emptyStyle?['empty-style-diagnostic']:[]),'pointer-history','acquire','open','escape'];
  fail(eq(row.steps?.map(s=>s.name),stepNames),'step-order:'+row.id);
  fail(eq(row.checks?.map(c=>c.name),expectedSlot.observedGroups),'group-order:'+row.id);
  let groupTime=-Infinity;
  for(const c of row.checks||[]){
   fail(c.executed===expectedSlot.groups.includes(c.name),'group-executed:'+row.id+':'+c.name);
   fail(c.pass===true,'group-incomplete:'+row.id+':'+c.name);
   for(const key of ['before','after']){for(const problem of snapshotErrors(c[key]))errors.push('group-snapshot:'+row.id+':'+c.name+':'+key+':'+problem);fail(c[key]?.time>=groupTime,'group-time:'+row.id);groupTime=c[key]?.time}
  }
  const sn=row.samples||{},a=row.acquisition,f=row.final;
  fail(sn.beforePhoto?.time>=groupTime,'group-snapshot-order:'+row.id);
  const phases=['beforePrelude','beforePhoto','afterPhoto',...(expectedSlot.clearEmptyStyle?['beforeStyleNormalization','afterStyleNormalization']:[]),'beforeHistory','beforeFocus','acquisition','open','final'];
  let last=-Infinity;
  for(const name of phases){
   const snap=name==='acquisition'?a:name==='final'?f:sn[name];
   for(const problem of snapshotErrors(snap))errors.push('snapshot:'+row.id+':'+name+':'+problem);
   fail(snap?.time>=last,'snapshot-time:'+row.id+':'+name);last=snap?.time;
  }
  fail(a?.hasFocus===true&&a?.focused===true&&a.expanded==='false','acquisition:'+row.id);
  fail(f?.expanded==='false','final:'+row.id);
  fail(sn.open?.expanded==='true','open:'+row.id);
  for(const phase of ['beforePhoto','afterPhoto','beforeHistory','beforeFocus'])fail(sn[phase]?.expanded==='false'&&sn[phase]?.focused===false,'pre-focus-state:'+row.id+':'+phase);
  if(expectedSlot.clearEmptyStyle){
   for(const el of [sn.afterStyleNormalization?.disabled?.[0],sn.afterStyleNormalization?.hidden])fail(styleState(el)==='ABSENT','neutralization-incomplete:'+row.id);
   fail(sn.beforeStyleNormalization?.htmlNoEmptyStyle===sn.afterStyleNormalization?.html,'neutralization-other-change:'+row.id);
  }
  if(expectedSlot.factor==='empty-style'){
   for(const el of [sn.beforeFocus?.disabled?.[0],sn.beforeFocus?.hidden])fail(styleState(el)===(expectedSlot.emptyStyle?'EMPTY':'ABSENT'),'intervention-style:'+row.id);
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
  const expectedImages=['on','off','off2','on2'].map(n=>row.id+'-Select-'+n+'.png');
  const preludeImages=[...(expectedSlot.groups.includes('Button')?['on','off','off2','on2'].map(n=>row.id+'-Button-'+n+'.png'):[]),...(expectedSlot.groups.includes('Badge')?[row.id+'-Badge.png']:[]),...(expectedSlot.groups.includes('Alert')?[row.id+'-Alert.png']:[])];
  fail(eq(row.images,[...preludeImages,...expectedImages])&&eq(p?.images,expectedImages),'image-inventory:'+row.id);
  fail(row.afterImage===row.id+'-after.png'&&row.traceFile===row.id+'-trace.zip'&&(!expectedSlot.preScreenshot||row.preImage===row.id+'-pre.png'),'asset-identity:'+row.id);
  const assets=[row.afterImage,row.traceFile,...(row.images||[]),...(expectedSlot.preScreenshot?[row.preImage]:[])];
  fail(assets.every(x=>safe(x)&&fs.existsSync(path.join(root,x))&&fs.statSync(path.join(root,x)).size>0),'assets:'+row.id);
  try{
   if(!assets.every(safe))throw Error('unsafe asset path');
   for(const img of assets.filter(x=>x?.endsWith('.png'))){const png=PNG.sync.read(fs.readFileSync(path.join(root,img)));fail(png.width>0&&png.height>0,'png:'+img)}
   const imgs=expectedImages.map(x=>PNG.sync.read(fs.readFileSync(path.join(root,x))));
   fail(rect(p?.clip)&&rect(p?.rect)&&imgs.every(i=>i.width===p.clip.width&&i.height===p.clip.height),'paint-geometry:'+row.id);
   const capture=p.captureSnapshot;
   for(const problem of snapshotErrors(capture))errors.push('snapshot:'+row.id+':paint-capture:'+problem);
   fail(capture?.time>=f?.time,'paint-capture-time:'+row.id);
   fail(eq(p.rect,capture?.trigger?.rect),'paint-capture-geometry:'+row.id);
   fail(p.active===capture?.focused&&p.visible===capture?.focusVisible,'paint-capture-focus:'+row.id);
   fail(p.viewport?.width===capture?.viewport?.width&&p.viewport?.height===capture?.viewport?.height,'paint-capture-viewport:'+row.id);
   const rx=p.rect.x,ry=p.rect.y,right=rx+p.rect.width,bottom=ry+p.rect.height;
   fail(rx>=0&&ry>=0&&right<=p.viewport?.width&&bottom<=p.viewport?.height,'paint-viewport-bounds:'+row.id);
   const cx=Math.max(0,Math.floor(rx-24)),cy=Math.max(0,Math.floor(ry-24));
   const expectedClip={x:cx,y:cy,width:Math.min(p.viewport?.width,Math.ceil(right+24))-cx,height:Math.min(p.viewport?.height,Math.ceil(bottom+24))-cy};
   fail(eq(p.clip,expectedClip),'paint-clip-binding:'+row.id);
   const measured=measure(imgs,p.clip,[{x:p.rect.x,y:p.rect.y,width:p.rect.width,height:p.rect.height}]);
   for(const k of ['changed','unstable','indicators','threshold','reason'])fail(eq(p[k],measured[k]),'pixel-recompute:'+row.id+':'+k);
   const pass=p.active&&p.visible&&Array.isArray(p.clipping)&&p.clipping.length===0&&measured.pass;
   fail(p.pass===pass,'pixel-pass:'+row.id);
   const outline=(!f?.focused||!f?.hasFocus)?'FOCUS_LOST':pass?'VISIBLE':measured.changed===0?'ABSENT':'INSUFFICIENT';
   fail(row.classification?.outline===outline,'outline-classification:'+row.id);
   const trace=execFileSync('python',[path.join(__dirname,'trace-check.py'),path.join(root,row.traceFile),plan.id+':'+row.id,JSON.stringify(expectedSlot.observedGroups),JSON.stringify(expectedSlot.groups)],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
   fail(trace==='VALID','trace:'+row.id);
  }catch(e){errors.push('asset-decode:'+row.id+':'+String(e).split('\n')[0])}
  const rowFile=row.id+'.json';
  fail(fs.existsSync(path.join(root,rowFile))&&eq(read(rowFile),row),'row-file:'+row.id);
  fail(row.paint?.active===f?.focused&&row.paint?.visible===f?.focusVisible,'paint-state:'+row.id);
 }
 const pairKeys=plan.factors.flatMap(f=>[1,2,3].map(i=>f+':'+i));
 fail(eq((d.pairs||[]).map(p=>p.factor+':'+p.iteration).sort(),pairKeys.sort()),'pair-identities');
 fail(Array.isArray(d.pairs)&&d.pairs.length===plan.factors.length*plan.repeats,'pair-count');
 for(const pair of d.pairs||[]){
  const [a,b]=[0,1].map(i=>d.rows?.find(r=>r.factor===pair.factor&&r.iteration===pair.iteration&&r.arm===i));
  if(!a||!b){errors.push('pair-missing-arm');continue;}
  fail(pair.armA===a.id&&pair.armB===b.id,'pair-arm-identities');
  const x=a.samples?.beforeFocus,y=b.samples?.beforeFocus;
  if(!x||!y)continue;
  const mismatch=['scroll','viewport','font','theme','hasFocus','visibility'].some(k=>!eq(x[k],y[k]))||!eq(x.trigger?.rect,y.trigger?.rect)||!eq(x.trigger?.computed,y.trigger?.computed)||['rect','computed'].some(k=>!eq(x.disabled?.[0]?.[k],y.disabled?.[0]?.[k])||!eq(x.hidden?.[k],y.hidden?.[k]));
  let delta=false;
  if(pair.factor==='empty-style')delta=x.htmlNoEmptyStyle!==y.htmlNoEmptyStyle||x.styleNodeCount!==1||y.styleNodeCount!==1||x.disabled?.[0]?.attrs?.style!==undefined||y.disabled?.[0]?.attrs?.style!==''||x.hidden?.attrs?.style!==undefined||y.hidden?.attrs?.style!=='';
  else if(pair.factor==='pre-screenshot'){const px=a.samples?.beforePhoto,py=b.samples?.beforePhoto;delta=['html','scroll','viewport','font','theme'].some(k=>!eq(px?.[k],py?.[k]))||['rect','computed'].some(k=>!eq(px?.trigger?.[k],py?.trigger?.[k])||!eq(px?.disabled?.[0]?.[k],py?.disabled?.[0]?.[k])||!eq(px?.hidden?.[k],py?.hidden?.[k]));}
  else delta=x.html!==y.html;
  const shouldConfirm=[a,b].every(r=>r.classification?.diagnostic==='COMPLETE')&&!mismatch&&!delta;
  fail((pair.equivalence==='CONFIRMED_TARGET')===shouldConfirm,'equivalence-claim:'+pair.factor+':'+pair.iteration);
  fail(pair.rootCause==='UNKNOWN','cause-claim:'+pair.factor+':'+pair.iteration);
 }
 const sums=read('SHA256SUMS.json');
 const disk=fs.readdirSync(root).filter(f=>f!=='SHA256SUMS.json').sort();
 fail(eq(Object.keys(sums).sort(),disk),'manifest-inventory');
 const required=['results.json',...expected.flatMap(r=>[r.id+'.json',r.id+'-trace.zip',r.id+'-after.png',...([...(r.groups.includes('Button')?['on','off','off2','on2'].map(n=>r.id+'-Button-'+n+'.png'):[]),...(r.groups.includes('Badge')?[r.id+'-Badge.png']:[]),...(r.groups.includes('Alert')?[r.id+'-Alert.png']:[])]),...['on','off','off2','on2'].map(n=>r.id+'-Select-'+n+'.png'),...(r.preScreenshot?[r.id+'-pre.png']:[])])];
 fail(required.every(f=>Object.hasOwn(sums,f)),'manifest-required-assets');
 for(const [file,digest] of Object.entries(sums)){
  const target=path.join(root,file);
  fail(safe(file)&&/^[a-f0-9]{64}$/.test(digest)&&fs.existsSync(target)&&hash(fs.readFileSync(target))===digest,'manifest:'+file);
 }
 fail(!Object.hasOwn(sums,'SHA256SUMS.json'),'manifest-self');
 fail(Object.hasOwn(sums,'results.json'),'manifest-results');
}
try{
 fail(fs.existsSync(root),'raw-output-not-found');
 if(fs.existsSync(root))inspect(read('results.json'));
}catch(e){errors.push('audit-exception:'+String(e))}
const verdict={diagnostic:errors.length?'FAIL':'PASS',rootCause:'UNKNOWN',stage3:'HOLD',errors,artifactRoot:root,head:process.env.ROUND11_EXPECT_HEAD||null};
console.log(JSON.stringify(verdict,null,2));
if(errors.length)process.exitCode=1;

