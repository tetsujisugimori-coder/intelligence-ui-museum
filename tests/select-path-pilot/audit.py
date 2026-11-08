"""Re-read raw file bindings and trace actions, never infer physical interaction."""
import sys,json,hashlib,zipfile,pathlib,subprocess
root=pathlib.Path(sys.argv[1]).resolve(); errors=[]
def check(c,m):
 if not c: errors.append(m)
data=json.loads((root/'results.json').read_text()); manifest=json.loads((root/'SHA256SUMS.json').read_text())
for f,h in manifest.items():
 p=(root/f).resolve();check(p.is_relative_to(root) and p.is_file(),f+' absent/path')
 if p.is_file(): check(hashlib.sha256(p.read_bytes()).hexdigest()==h,f+' sha')
check(set(manifest)=={str(p.relative_to(root)).replace('\\','/') for p in root.rglob('*') if p.is_file() and p.name!='SHA256SUMS.json'},'manifest exact set')
trace_summary=[]
for row in data['rows']:
 path=root/(row['id']+'.json');check(path.is_file(),row['id']+' missing')
 if path.is_file():check(json.loads(path.read_text())==row,row['id']+' row binding')
 for key in ['preImage','finalImage','traceFile']:
  f=row.get(key);check(bool(f) and f in manifest,row['id']+' '+key)
 for f in row.get('images',[]):check(f in manifest,row['id']+' image '+f)
 t=root/row.get('traceFile','absent.zip')
 if t.is_file():
  with zipfile.ZipFile(t) as z:
   check(z.testzip() is None,row['id']+' trace CRC');check(len(z.namelist())==len(set(z.namelist())),row['id']+' duplicate entries')
   entries=[]
   for n in z.namelist():
    if n.endswith('.trace'):
     entries += [json.loads(line) for line in z.read(n).splitlines() if line.strip()]
   presses=[e.get('params',{}).get('key') for e in entries if e.get('type')=='before' and e.get('method')=='press' and e.get('class')=='Keyboard']
   # Input trace and requested keyboard log must be identical, including prelude.
   requested=[o['argument'] for o in row.get('operations',[]) if o['name']=='key']
   check(presses==requested,row['id']+' trace keyboard mismatch')
   frames=[e for e in entries if e.get('type')=='screencast-frame']
   check(bool(frames),row['id']+' no screencast')
   for frame in frames:check('resources/'+frame['sha1'] in z.namelist(),row['id']+' missing frame')
   trace_summary.append({'id':row['id'],'keys':presses,'screencastFrames':len(frames),'frameTiming':'sampled; exact pre/post-open frame is not guaranteed'})
# Independent subprocess invokes strict classification against original plan, not saved PASS labels.
js="const fs=require('fs'),c=require('./tests/select-path-pilot/contract.cjs');const d=JSON.parse(fs.readFileSync(process.argv[1]));const e=c.validateRun(d);for(const r of d.rows)if(JSON.stringify(c.classify(r))!==JSON.stringify(r.classification))e.push(r.id+':saved-classification');console.log(JSON.stringify(e));process.exitCode=e.length?1:0"
p=subprocess.run(['node','-e',js,str(root/'results.json')],text=True,capture_output=True)
check(p.returncode==0,'contract:'+p.stdout+p.stderr)
print(json.dumps({'status':'PASS' if not errors else 'FAIL','rows':len(data['rows']),'errors':errors,'traces':trace_summary},ensure_ascii=False,indent=2))
sys.exit(1 if errors else 0)
