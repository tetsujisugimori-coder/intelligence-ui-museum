const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os');
const {spawnSync,execFileSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../..'),out=path.resolve(process.env.S3_OUT||path.join(repo,'.work/s3-evidence'));
if(fs.existsSync(out))throw Error('fresh evidence root required');fs.mkdirSync(out,{recursive:true});
const root=path.join(repo,'.work/v10'),root2=path.join(repo,'.work/s3-build2');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.join(d,e.name)]);
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
const env={...process.env,CODEX_PRIMARY_RUNTIME_NODE_MODULES:path.join(repo,'tools/stage-a-browser/node_modules')};const steps=[];const failed=[];
function step(name,command,args,cwd=repo,extra={},continueOnFailure=false){const s={name,command:[command,...args],started:new Date().toISOString()};steps.push(s);const p=spawnSync(command,args,{cwd,env:{...env,...extra},encoding:'utf8',timeout:900000,maxBuffer:32e6});Object.assign(s,{exit:p.status,signal:p.signal,error:p.error?.message,finished:new Date().toISOString()});fs.writeFileSync(path.join(out,name+'.stdout.log'),p.stdout||'');fs.writeFileSync(path.join(out,name+'.stderr.log'),p.stderr||'');fs.writeFileSync(path.join(out,'steps.json'),JSON.stringify(steps,null,2));console.log(name,p.status);if(p.status!==0||p.error||p.signal){failed.push(name);if(!continueOnFailure)throw Error('stage failed: '+name);}}
try{
 step('preservation','python3',['scripts/verify-migration.py']);step('unit','npm',['run','test:runner']);
 execFileSync('python3',['scripts/prepare-work.py'],{cwd:repo});fs.cpSync(root,root2,{recursive:true});
 step('install1','npm',['ci','--ignore-scripts'],root);step('install2','npm',['ci','--ignore-scripts'],root2);
 step('build1','npm',['run','build'],root);step('build2','npm',['run','build'],root2);
 step('authenticity','npm',['test'],root);step('baseline','node',['scripts/verify-baseline.mjs'],root);
 step('reproduce','diff',['-r',path.join(root,'dist'),path.join(root2,'dist')]);
 step('sdk','node',[path.join(__dirname,'sdk.cjs'),root,root2,out]);
 const source=Object.fromEntries(['src/main.tsx','src/main.css','src/select-focus-return.ts','package.json','package-lock.json'].map(f=>[f,hash(fs.readFileSync(path.join(root,f)))]));
 const build=Object.fromEntries(files(path.join(root,'dist')).map(f=>[path.relative(path.join(root,'dist'),f),hash(fs.readFileSync(f))]));
 const runners=Object.fromEntries(files(__dirname).map(f=>[path.relative(repo,f),hash(fs.readFileSync(f))]));
 fs.writeFileSync(path.join(out,'identity.json'),JSON.stringify({head,tree,source,build,runners,os:{platform:os.platform(),release:os.release(),arch:os.arch()},node:process.version,npm:execFileSync('npm',['-v'],{encoding:'utf8'}).trim(),date:new Date().toISOString()},null,2));
 step('matrix','node',[path.join(__dirname,'browser.cjs')],repo,{APP_ROOT:root,EVIDENCE_DIR:path.join(out,'matrix')},true);
 step('focus','node',[path.join(repo,'apps/v10/scripts/select-return-browser.cjs')],repo,{APP_ROOT:root,EVIDENCE_DIR:path.join(out,'focus')},true);
 step('faults','node',[path.join(__dirname,'faults.cjs')],repo,{APP_ROOT:root,EVIDENCE_DIR:path.join(out,'faults')},true);
 if(failed.length)throw Error('failed stages: '+failed.join(','));
}catch(e){fs.writeFileSync(path.join(out,'failure.txt'),String(e));console.error(e);process.exitCode=1;}
finally{const manifest={head,tree,complete:!process.exitCode,files:Object.fromEntries(files(out).filter(f=>path.basename(f)!=='manifest.json').map(f=>[path.relative(out,f),hash(fs.readFileSync(f))]))};fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));}
