// Mutations of genuinely executed evidence. Rehash selected corruptions so schema
// and completeness gates, rather than just checksum failure, must reject them.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const [input,head,tree,output]=process.argv.slice(2),out=path.resolve(output),rows=[];
if(fs.existsSync(out))throw Error('fresh control output required');fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=(d,f)=>JSON.parse(fs.readFileSync(path.join(d,f))),write=(d,f,x)=>{const p=path.join(d,f);fs.unlinkSync(p);fs.writeFileSync(p,JSON.stringify(x));};
const controls=[
 ['normal',()=>{},null],
 ['missing-image',d=>{const m=read(d,'manifest.json'),f=Object.keys(m.files).find(f=>f.startsWith('matrix/')&&f.endsWith('.png'));fs.unlinkSync(path.join(d,f));},'missing artifact'],
 ['missing-json',d=>fs.unlinkSync(path.join(d,'matrix/results.json')),'missing/invalid JSON'],
 ['short-count',d=>{const r=read(d,'matrix/results.json');r.rows.pop();write(d,'matrix/results.json',r);rehash(d,'matrix/results.json');},'expected 32 conditions'],
 ['wrong-head',d=>{const m=read(d,'manifest.json');m.head='0'.repeat(40);write(d,'manifest.json',m);},'HEAD mismatch'],
 ['wrong-tree',d=>{const m=read(d,'manifest.json');m.tree='0'.repeat(40);write(d,'manifest.json',m);},'tree mismatch'],
 ['wrong-hash',d=>{const m=read(d,'manifest.json'),f=Object.keys(m.files).find(f=>f.endsWith('.png'));m.files[f]='0'.repeat(64);write(d,'manifest.json',m);},'hash mismatch'],
 ['omitted-stage',d=>{const s=read(d,'steps.json');s.splice(s.findIndex(s=>s.name==='build2'),1);write(d,'steps.json',s);rehash(d,'steps.json');},'stage failed/missing: build2'],
 ['child-abnormal',d=>{const p=spawnSync(process.execPath,['-e','process.exit(23)']);if(p.status!==23)throw Error('abnormal child not observed');const s=read(d,'steps.json');s.find(s=>s.name==='matrix').exit=p.status;write(d,'steps.json',s);rehash(d,'steps.json');},'stage failed/missing: matrix'],
 ['missing-focus-image',d=>{fs.unlinkSync(path.join(d,'focus/chromium-A-mouse.png'));},'missing artifact'],
 ['source-mix',d=>{const r=read(d,'matrix/results.json');r.source['src/main.tsx']='0'.repeat(64);write(d,'matrix/results.json',r);rehash(d,'matrix/results.json');},'source mismatch'],
 ['false-pass',d=>{const r=read(d,'matrix/results.json');r.rows[0].checks[0].pass=false;write(d,'matrix/results.json',r);rehash(d,'matrix/results.json');},'missing/failed assertion'],
];
function rehash(d,f){const m=read(d,'manifest.json');m.files[f]=hash(fs.readFileSync(path.join(d,f)));write(d,'manifest.json',m);}
for(const[name,mutate,reason]of controls){const d=fs.mkdtempSync(path.join(os.tmpdir(),'s3-audit-'));
 try{fs.cpSync(input,d,{recursive:true,copyFile:fs.constants.COPYFILE_FICLONE});mutate(d);const p=spawnSync(process.execPath,[path.join(__dirname,'audit.cjs'),d,head,tree],{encoding:'utf8',timeout:30000,maxBuffer:1e6});const data=JSON.parse(p.stdout);const matched=!p.error&&!p.signal&&(reason?p.status===1&&data.failures.some(x=>x.includes(reason)):p.status===0&&data.status==='PASS');rows.push({name,expected:reason||'PASS',exit:p.status,signal:p.signal,reasonMatched:matched,result:data});}
 catch(e){rows.push({name,reasonMatched:false,error:String(e)});}finally{fs.rmSync(d,{recursive:true});}}
const status=rows.length===controls.length&&rows.every(r=>r.reasonMatched)?'PASS':'FAIL';fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({status,head,tree,rows},null,2));console.log(JSON.stringify({status,rows}));process.exitCode=status==='PASS'?0:1;
