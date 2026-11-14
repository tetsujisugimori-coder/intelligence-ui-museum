"""Run the real preservation CLI against isolated mutations; never edit originals."""
import json,re,subprocess,tempfile,os,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[2]
assert os.environ.get('TMPDIR') and not tempfile.gettempdir().startswith('/tmp')
original=(root/'apps/v11/index.html').read_text()
pattern=r'(<script id="dataset" type="application/json">)([\s\S]*?)(</script>)'
data=json.loads(re.search(pattern,original)[2])
for fault in ['normal','duplicate','count','previous123','metadata']:
 with tempfile.TemporaryDirectory(prefix='preservation-') as tmp:
  d=Path(tmp)
  for file in ['apps/v11/verify.py','apps/v11/wave1-baseline.json','apps/v11/wave2-baseline.json','apps/v11/wave3-baseline.json','apps/v11/wave4-baseline.json','legacy/v09/index.html']:
   (d/file).parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(root/file,d/file)
  rows=json.loads(json.dumps(data))
  if fault=='duplicate': rows[-1]['id']=125
  if fault=='count': rows.pop()
  if fault=='previous123': rows[122]['name']='MUTATED'
  if fault=='metadata': rows[-1]['category']='入力'
  s=re.sub(pattern,lambda m:m[1]+json.dumps(rows,ensure_ascii=False)+m[3],original)
  (d/'apps/v11/index.html').write_text(s)
  result=subprocess.run(['python3','apps/v11/verify.py'],cwd=d,capture_output=True,text=True)
  print(json.dumps({'fault':fault,'exit':result.returncode,'stdout':result.stdout,'stderr':result.stderr},ensure_ascii=False))
  assert (result.returncode==0)==(fault=='normal'),fault
print('PASS normal exit0 and 4 mutated product datasets exit nonzero')
