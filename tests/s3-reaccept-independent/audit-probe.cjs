// Synthetic contract fixture; never claimed as product/browser execution evidence.
// Mutations test the primary gate's treatment of missing bound evidence.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../..'),out=path.resolve(process.env.REVIEW_OUT||path.join(repo,'evidence/s3-reaccept-20261106/independent/audit-red'));
if(fs.existsSync(out))throw Error('fresh review output required');fs.mkdirSync(out,{recursive:true});
const workspace=fs.mkdtempSync(path.join(repo,'.work/independent-audit-')),base=path.join(workspace,'base');fs.mkdirSync(base);
const head='1'.repeat(40),tree='2'.repeat(40),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const write=(dir,f,data)=>{const target=path.join(dir,f);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,typeof data==='string'?data:JSON.stringify(data,null,2));};
const read=(dir,f)=>JSON.parse(fs.readFileSync(path.join(dir,f)));
const source={'src/main.tsx':'3'.repeat(64)},build={'index.html':'4'.repeat(64)},runners={'scripts/s3-reaccept/browser.cjs':'5'.repeat(64)};
write(base,'identity.json',{head,tree,source,build,runners});write(base,'sdk.json',{status:'PASS',version:'0.2.2',files:{synthetic:'6'.repeat(64)}});
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
const focus=[];for(const engine of ['chromium','webkit'])for(const id of ['A','B'])for(const way of ['mouse','keyboard','escape']){focus.push({engine,condition:{id},way,verdict:{pass:true},expectationMatched:true,errors:[],after:{sameOpener:true,body:false,hasFocus:true,visibility:'visible'}});write(base,`focus/${engine}-${id}-${way}.png`,'SYNTHETIC IMAGE PLACEHOLDER');}
while(focus.length<44)focus.push({engine:'chromium',condition:{id:'synthetic-extra-'+focus.length},way:'keyboard',verdict:{pass:true},expectationMatched:true,errors:[],after:{sameOpener:true,body:false,hasFocus:true,visibility:'visible'}});
write(base,'focus/results.json',{status:'PASS',failures:[],identity:source,rows:focus,faults:Array(14).fill({expectationMatched:true}),regressions:Array(4).fill({errors:[],checks:Object.fromEntries(Array.from({length:13},(_,i)=>['synthetic-'+i,true]))})});
write(base,'faults/results.json',{status:'PASS',rows:['alert-reopen','pageerror','focus-missing','focus-clipped','body-focus','wrong-trigger'].map(fault=>({fault,exit:1,reasonMatched:true,engines:['chromium','webkit']}))});
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.join(d,e.name)]);
const manifest={head,tree,complete:true,files:Object.fromEntries(files(base).map(f=>[path.relative(base,f),hash(fs.readFileSync(f))]))};write(base,'manifest.json',manifest);
const records=[];const run=(name,dir,expected,reason='')=>{const p=spawnSync(process.execPath,[path.join(repo,'scripts/s3-reaccept/audit.cjs'),dir,head,tree],{encoding:'utf8'});write(out,name+'.stdout.log',p.stdout);write(out,name+'.stderr.log',p.stderr);const report=JSON.parse(p.stdout);records.push({name,expectedExit:expected,expectedReason:reason,actualExit:p.status,matched:p.status===expected&&(!reason||report.failures.some(x=>x.includes(reason))),report});};
run('normal-synthetic-contract',base,0);
for(const name of ['unhashed-result','missing-stage-log','duplicate-replacement-image','contradictory-focus-row']){
 const dir=path.join(workspace,name);fs.cpSync(base,dir,{recursive:true});const m=read(dir,'manifest.json');
 if(name==='unhashed-result')delete m.files['matrix/results.json'];
 if(name==='missing-stage-log'){delete m.files['sdk.stdout.log'];fs.unlinkSync(path.join(dir,'sdk.stdout.log'));}
 if(name==='duplicate-replacement-image'){const r=read(dir,'matrix/results.json'),file=r.rows[0].images[0];r.rows[0].images[0]=r.rows[0].images[1];delete m.files['matrix/'+file];fs.unlinkSync(path.join(dir,'matrix',file));write(dir,'matrix/results.json',r);m.files['matrix/results.json']=hash(fs.readFileSync(path.join(dir,'matrix/results.json')));}
 if(name==='contradictory-focus-row'){const r=read(dir,'focus/results.json');r.rows[43].verdict.pass=false;write(dir,'focus/results.json',r);m.files['focus/results.json']=hash(fs.readFileSync(path.join(dir,'focus/results.json')));}
 write(dir,'manifest.json',m);run(name,dir,1,({'unhashed-result':'required manifest entry missing: matrix/results.json','missing-stage-log':'required manifest entry missing: sdk.stdout.log','duplicate-replacement-image':'missing required image','contradictory-focus-row':'contradictory focus row'})[name]);
}
const status=records.every(x=>x.matched)?'PASS':'FAIL';write(out,'results.json',{status,testedAt:new Date().toISOString(),evidenceKind:'SYNTHETIC validator fixtures; not real browser runs',gateHash:hash(fs.readFileSync(path.join(repo,'scripts/s3-reaccept/audit.cjs'))),records});console.log(JSON.stringify({status,records:records.map(({name,expectedExit,actualExit,matched})=>({name,expectedExit,actualExit,matched}))}));process.exitCode=status==='PASS'?0:1;
