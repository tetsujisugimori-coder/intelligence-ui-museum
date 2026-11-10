'use strict';
// Synthetic, localhost-only contract evidence. Never a browser trial or product PASS.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const planFile=process.env.ROUND11_PHASE==='B2'?'plan-b2.json':process.env.ROUND11_PHASE==='B'?'plan-b.json':'plan.json';
const plan=require('./'+planFile);
const {PNG}=require('../../tools/stage-a-browser/node_modules/playwright-core/lib/utilsBundle.js');
const {measure}=require('../../apps/v10/scripts/stage2r-focus-pixels.cjs');
const repo=path.resolve(__dirname,'../..');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
function fixture(root){
 const head=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
 const tree=cp.execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:repo,encoding:'utf8'}).trim();
 const el=(tag,attrs,type=null)=>({tag,attrs,type,checked:false,disabled:false,html:'<input>',rect:{x:0,y:0,width:10,height:10,top:0,right:10,bottom:10,left:0},computed:{display:'block',outline:'none',visibility:'visible',position:'static',opacity:'1',transform:'none'},focused:false,focusVisible:false});
 const sample=(empty=false,focused=false,expanded='false',time=1)=>{
  const c=el('INPUT',{type:'checkbox'},'checkbox'),h=el('INPUT',{id:'official-select',tabindex:'-1',class:'sr-only w-full h-0 left-0 bottom-0 pointer-events-none','aria-hidden':'true',value:'a'},'text');
  if(empty){c.attrs.style='';h.attrs.style=''}
  const t=el('SPAN',{id:'trigger',role:'button','aria-disabled':'false','aria-expanded':expanded});t.focused=focused;
  return {hasFocus:true,visibility:'visible',time,html:'<section></section>',htmlNoEmptyStyle:'<section></section>',rootCount:1,styleNodeCount:1,hiddenCount:1,triggerCount:1,distinct:true,contained:true,disabled:[c],hidden:h,trigger:t,active:focused?structuredClone(t):el('BODY',{}),focused,focusVisible:false,expanded,value:'a',scroll:{x:0,y:0},viewport:{width:375,height:1000,dpr:1},font:'16px',theme:'light'};
 };
 const png=new PNG({width:34,height:34});png.data.fill(255);const pngBytes=PNG.sync.write(png);
 const trace=(id,groups,executed,omitDisabledNoop)=>cp.execFileSync('python',[path.join(__dirname,'synthetic-trace.py'),plan.id+':'+id,JSON.stringify(groups),path.join(__dirname,'trace-check.py'),JSON.stringify(executed),JSON.stringify({omitDisabledNoop:!!omitDisabledNoop})]);
 const d={schema:1,plan,planHash:hash(fs.readFileSync(path.join(__dirname,planFile))),head,tree,dirty:'',playwright:plan.playwright,sdkVersion:plan.sdkVersion,rootCause:'UNKNOWN',stage3:'HOLD',oldOffscreenClick:'NOT_TESTED',browserClosed:true,exitCode:0,validation:[],system:{platform:process.platform},sources:{},product:{},build:{},rows:[],pairs:[]};
 d.sources=Object.fromEntries(walk(__dirname).map(f=>[path.relative(repo,f).split(path.sep).join('/'),hash(fs.readFileSync(f))]));
 d.product=Object.fromEntries(['src/main.tsx','src/main.css','src/select-focus-return.ts','package.json','package-lock.json'].map(f=>[f,hash(fs.readFileSync(path.join(repo,'apps/v10',f)))]));
 const dist=path.join(repo,'.work/v10/dist');d.build=Object.fromEntries(walk(dist).map(f=>[path.relative(dist,f).split(path.sep).join('/'),hash(fs.readFileSync(f))]));
 for(let iteration=1;iteration<=3;iteration++)for(const factor of plan.factors)for(const arm of iteration%2?[0,1]:[1,0]){
  const r={id:`${factor}-${arm}-${iteration}`,factor,arm,iteration,...plan.arms[factor][arm],status:'COMPLETE',started:new Date(0).toISOString(),finished:new Date(100).toISOString(),cleanup:true,browser:'26.0',classification:{diagnostic:'COMPLETE',outline:'ABSENT',cause:'UNKNOWN'},pageErrors:[],samples:{},events:null,overflow:null};
  const names=['goto','groups','normalize',...(r.preScreenshot?['pre-screenshot']:[]),...(r.clearEmptyStyle?['normalize-empty-style']:[]),...(r.emptyStyle?['empty-style-diagnostic']:[]),'pointer-history','acquire','open','escape'];
  r.switchFinal={checked:'false',disabled:false,checkboxChecked:false};
  r.checks=r.observedGroups.map(name=>({name,executed:r.groups.includes(name),pass:true,before:sample(false,false,'false',0),after:sample(false,false,'false',0)}));
  r.steps=names.map((name,i)=>({name,success:true,started:i,finished:i}));
  r.samples.beforePrelude=sample(false,false,'false',0);r.samples.beforePhoto=sample();r.samples.afterPhoto=sample(false,false,'false',2);
  if(r.clearEmptyStyle){r.samples.beforeStyleNormalization=sample(false,false,'false',3);r.samples.afterStyleNormalization=sample(false,false,'false',4)}
  r.samples.beforeHistory=sample(r.emptyStyle,false,'false',5);r.samples.beforeFocus=sample(r.emptyStyle,false,'false',6);
  r.acquisition=sample(r.emptyStyle,true,'false',7);r.samples.open=sample(r.emptyStyle,false,'true',8);r.final=sample(r.emptyStyle,true,'false',9);
  if(r.fullProbe){r.events=[{seq:1,time:1,kind:'keydown',key:'Space',trusted:true},{seq:2,time:2,kind:'keydown',key:'Escape',trusted:true}];r.overflow=false}
  const ringImages=['on','off','off2','on2'].map(n=>r.id+'-Select-'+n+'.png');
  r.images=[...([...(r.groups.includes('Button')?['on','off','off2','on2'].map(n=>r.id+'-Button-'+n+'.png'):[]),...(r.groups.includes('Badge')?[r.id+'-Badge.png']:[]),...(r.groups.includes('Alert')?[r.id+'-Alert.png']:[])]),...ringImages];r.afterImage=r.id+'-after.png';r.traceFile=r.id+'-trace.zip';if(r.preScreenshot)r.preImage=r.id+'-pre.png';
  r.paint={...measure([png,png,png,png],{x:0,y:0,width:34,height:34},[{x:0,y:0,width:10,height:10}]),clip:{x:0,y:0,width:34,height:34},rect:{x:0,y:0,width:10,height:10,top:0,right:10,bottom:10,left:0},captureSnapshot:sample(r.emptyStyle,true,'false',10),viewport:{width:375,height:1000},images:ringImages,active:true,visible:false,clipping:[]};
  for(const f of [...r.images,r.afterImage,...(r.preImage?[r.preImage]:[])])fs.writeFileSync(path.join(root,f),pngBytes);
  fs.writeFileSync(path.join(root,r.traceFile),trace(r.id,r.observedGroups,r.groups,r.omitDisabledNoop));d.rows.push(r);
 }
 for(const factor of plan.factors)for(let i=1;i<=3;i++)d.pairs.push({factor,iteration:i,armA:`${factor}-0-${i}`,armB:`${factor}-1-${i}`,equivalence:'CONFIRMED_TARGET',rootCause:'UNKNOWN'});
 save(root,d);return d;
}
function save(root,d){for(const r of d.rows)fs.writeFileSync(path.join(root,r.id+'.json'),JSON.stringify(r));fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(d));manifest(root)}
function manifest(root){fs.writeFileSync(path.join(root,'SHA256SUMS.json'),JSON.stringify(Object.fromEntries(fs.readdirSync(root).filter(f=>f!=='SHA256SUMS.json').map(f=>[f,hash(fs.readFileSync(path.join(root,f)))]))))}
module.exports={fixture,save,manifest};
