// Synthetic contract fixture; never claimed as product/browser execution evidence.
// Mutations test the primary gate's treatment of missing bound evidence.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync,execFileSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../..'),out=path.resolve(process.env.REVIEW_OUT||path.join(repo,'evidence/s3-reaccept-20261106/independent/audit-red'));
if(fs.existsSync(out))throw Error('fresh review output required');fs.mkdirSync(out,{recursive:true});
const workspace=fs.mkdtempSync(path.join(repo,'.work/independent-audit-')),base=path.join(workspace,'base');fs.mkdirSync(base);
const gate=process.env.REVIEW_GATE||path.join(repo,'scripts/s3-reaccept/audit.cjs');
const git=(...args)=>execFileSync('git',args,{cwd:repo}),head=git('rev-parse','HEAD').toString().trim(),tree=git('rev-parse','HEAD^{tree}').toString().trim(),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const write=(dir,f,data)=>{const target=path.join(dir,f);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,typeof data==='string'?data:JSON.stringify(data,null,2));};
const read=(dir,f)=>JSON.parse(fs.readFileSync(path.join(dir,f)));
const source=Object.fromEntries(['src/main.tsx','src/main.css','src/select-focus-return.ts','package.json','package-lock.json'].map(f=>[f,hash(git('show',`${head}:apps/v10/${f}`))])),build={'index.html':'4'.repeat(64)},runners=Object.fromEntries(git('ls-tree','-r','--name-only',head,'scripts/s3-reaccept').toString().trim().split('\n').filter(Boolean).map(f=>[f,hash(git('show',`${head}:${f}`))]));
write(base,'identity.json',{head,tree,source,build,runners});write(base,'sdk.json',JSON.parse(fs.readFileSync(path.join(repo,'evidence/s3-reaccept-20261106/independent/sdk-rerun/sdk.json'))));
const required=['preservation','unit','install1','install2','build1','build2','authenticity','baseline','reproduce','sdk','matrix','focus','faults'];
write(base,'steps.json',required.map(name=>({name,exit:0,started:'2026-11-06T00:00:00Z',finished:'2026-11-06T00:00:01Z',command:['node','SYNTHETIC-UNIT-FIXTURE']})));
for(const n of required)for(const s of ['stdout','stderr'])write(base,`${n}.${s}.log`,'SYNTHETIC UNIT FIXTURE, NOT EXECUTED PRODUCT');
const rows=[];
for(const engine of ['chromium','webkit'])for(const width of [320,375,390,1280])for(const theme of ['light','dark'])for(const text of [100,200]){
 const id=[engine,width,theme,text].join('-');const images=[...['on','off','off2','on2'].map(x=>`${id}-Button-${x}.png`),`${id}-Badge.png`,`${id}-Alert.png`,...['on','off','off2','on2'].map(x=>`${id}-Select-${x}.png`),`${id}-Tooltip.png`];
 for(const f of images)write(base,'matrix/'+f,'SYNTHETIC IMAGE PLACEHOLDER');
 rows.push({id,engine,width,height:1000,theme,text,status:'PASS',checks:['environment','layout','Button','Badge','Alert','Switch','Select','Tooltip','errors'].map(name=>({name,pass:true})),images,errors:[],console:[]});
}
write(base,'matrix/results.json',{head,tree,source,build,status:'PASS',failures:[],fault:'',expected:32,rows});
const focus=[];const focusRow=(engine,condition,way)=>({engine,condition,way,verdict:{pass:true},expectationMatched:true,errors:[],after:{sameOpener:true,body:false,hasFocus:true,visibility:'visible',value:way==='escape'?'a':'b',expanded:'false',focusVisible:way!=='mouse'},pixels:way!=='mouse'?{pass:true,status:'PASS'}:undefined});
for(const engine of ['chromium','webkit'])for(const id of ['A','B'])for(const way of ['mouse','keyboard','escape']){focus.push(focusRow(engine,{id,width:id==='A'?320:1280,theme:id==='A'?'dark':'light',text:id==='A'?200:100},way));write(base,`focus/${engine}-${id}-${way}.png`,'SYNTHETIC IMAGE PLACEHOLDER');}
for(const engine of ['chromium','webkit'])for(const width of [320,375,390,1280])for(const theme of ['light','dark'])for(const text of [100,200])focus.push(focusRow(engine,{id:`${width}-${theme}-${text}`,width,theme,text},'keyboard'));
const focusFaults=[];for(const engine of ['chromium','webkit'])for(const fault of ['disabled-return','wrong-target','removed-opener','body-after-close','duplicate','recreated-opener','disabled-opener'])focusFaults.push({engine,fault,expectationMatched:true});
const regressionNames=['value-and-return','tab-leaves','shift-tab-returns','escape-retains-value','rapid-repeat','outside-dismiss-no-steal','tab-from-menu-no-steal','button-inputs','button-disabled','button-loading','select-disabled','select-enabled-value','no-pageerror'];
const regressions=[];for(const engine of ['chromium','webkit'])for(const id of ['A','B'])regressions.push({engine,condition:{id},errors:[],checks:Object.fromEntries(regressionNames.map(n=>[n,true]))});
write(base,'focus/results.json',{status:'PASS',failures:[],identity:source,rows:focus,faults:focusFaults,regressions});
write(base,'faults/results.json',{status:'PASS',rows:['alert-reopen','pageerror','focus-missing','focus-clipped','body-focus','wrong-trigger'].map(fault=>({fault,exit:1,reasonMatched:true,engines:['chromium','webkit']}))});
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.join(d,e.name)]);
const manifest={head,tree,complete:true,files:Object.fromEntries(files(base).map(f=>[path.relative(base,f),hash(fs.readFileSync(f))]))};write(base,'manifest.json',manifest);
const records=[];const run=(name,dir,expected,reason='')=>{const p=spawnSync(process.execPath,[gate,dir,head,tree],{encoding:'utf8'});write(out,name+'.stdout.log',p.stdout);write(out,name+'.stderr.log',p.stderr);const report=JSON.parse(p.stdout);records.push({name,expectedExit:expected,expectedReason:reason,actualExit:p.status,matched:p.status===expected&&(!reason||report.failures.some(x=>x.includes(reason))),report});};
run('normal-synthetic-contract',base,0);
for(const name of ['unhashed-result','missing-stage-log','duplicate-replacement-image','contradictory-focus-row','sdk-failed','duplicate-fault-engines','duplicate-focus-fault','shared-stale-source','stale-runner']){
 const dir=path.join(workspace,name);fs.cpSync(base,dir,{recursive:true});const m=read(dir,'manifest.json');
 if(name==='unhashed-result')delete m.files['matrix/results.json'];
 if(name==='missing-stage-log'){delete m.files['sdk.stdout.log'];fs.unlinkSync(path.join(dir,'sdk.stdout.log'));}
 if(name==='duplicate-replacement-image'){const r=read(dir,'matrix/results.json'),file=r.rows[0].images[0];r.rows[0].images[0]=r.rows[0].images[1];delete m.files['matrix/'+file];fs.unlinkSync(path.join(dir,'matrix',file));write(dir,'matrix/results.json',r);m.files['matrix/results.json']=hash(fs.readFileSync(path.join(dir,'matrix/results.json')));}
 if(name==='contradictory-focus-row'){const r=read(dir,'focus/results.json');r.rows[43].verdict.pass=false;write(dir,'focus/results.json',r);m.files['focus/results.json']=hash(fs.readFileSync(path.join(dir,'focus/results.json')));}
 if(name==='sdk-failed'){const r=read(dir,'sdk.json');r.status='FAIL';write(dir,'sdk.json',r);m.files['sdk.json']=hash(fs.readFileSync(path.join(dir,'sdk.json')));}
 if(name==='duplicate-fault-engines'){const r=read(dir,'faults/results.json');r.rows.forEach(r=>r.engines=['chromium','chromium']);write(dir,'faults/results.json',r);m.files['faults/results.json']=hash(fs.readFileSync(path.join(dir,'faults/results.json')));}
 if(name==='duplicate-focus-fault'){const r=read(dir,'focus/results.json');r.faults=Array.from({length:14},()=>r.faults[0]);write(dir,'focus/results.json',r);m.files['focus/results.json']=hash(fs.readFileSync(path.join(dir,'focus/results.json')));}
 if(name==='shared-stale-source'){for(const f of ['identity.json','matrix/results.json','focus/results.json']){const r=read(dir,f);(f==='focus/results.json'?r.identity:r.source)['src/main.tsx']='0'.repeat(64);write(dir,f,r);m.files[f]=hash(fs.readFileSync(path.join(dir,f)));}}
 if(name==='stale-runner'){const r=read(dir,'identity.json');r.runners['scripts/s3-reaccept/browser.cjs']='0'.repeat(64);write(dir,'identity.json',r);m.files['identity.json']=hash(fs.readFileSync(path.join(dir,'identity.json')));}
 write(dir,'manifest.json',m);run(name,dir,1,({'unhashed-result':'required manifest entry missing: matrix/results.json','missing-stage-log':'required manifest entry missing: sdk.stdout.log','duplicate-replacement-image':'missing required image','contradictory-focus-row':'contradictory focus row','sdk-failed':'SDK evidence contradicts fixed package','duplicate-fault-engines':'fault not rejected for expected reason','duplicate-focus-fault':'missing/duplicate focus fault coverage','shared-stale-source':'source differs from trusted Git HEAD','stale-runner':'runner differs from trusted Git HEAD'})[name]);
}
const status=records.every(x=>x.matched)?'PASS':'FAIL';write(out,'results.json',{status,testedAt:new Date().toISOString(),evidenceKind:'SYNTHETIC validator fixtures; not real browser runs',gateHash:hash(fs.readFileSync(gate)),records});console.log(JSON.stringify({status,records:records.map(({name,expectedExit,actualExit,matched})=>({name,expectedExit,actualExit,matched}))}));process.exitCode=status==='PASS'?0:1;
