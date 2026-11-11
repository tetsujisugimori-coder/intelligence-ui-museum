"""Independent archive download + original digest/CRC/member manifest/HEAD checks.
No archive is rewritten. Only aggregate status is printed/uploaded.
"""
import hashlib,json,os,sys,urllib.request,zipfile,io,pathlib
repo=os.environ['GITHUB_REPOSITORY']; run=os.environ['GITHUB_RUN_ID']; head=os.environ['EXPECTED_HEAD']; expected=os.environ['ARTIFACT_NAME']
def get(url):
 req=urllib.request.Request(url,headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
 with urllib.request.urlopen(req) as response:return response.read()
artifacts=json.loads(get(f'https://api.github.com/repos/{repo}/actions/runs/{run}/artifacts?per_page=100'))['artifacts']
matching=[a for a in artifacts if a['name']==expected]
assert len(matching)==1,'artifact inventory'; a=matching[0]
raw=get(a['archive_download_url']); digest=hashlib.sha256(raw).hexdigest();assert a['digest']=='sha256:'+digest,'ZIP digest'
root=pathlib.Path('.work/archive-readback');root.mkdir(parents=True,exist_ok=False);(root/'original.zip').write_bytes(raw)
with zipfile.ZipFile(io.BytesIO(raw)) as z:
 assert z.testzip() is None,'CRC';names=z.namelist();assert len(names)==len(set(names)),'duplicate entry'
 assert all(not n.startswith('/') and '..' not in pathlib.PurePosixPath(n).parts for n in names),'path'
 manifests=[n for n in names if n.endswith('/SHA256SUMS.json')];assert len(manifests)==2,'pilot/formal manifests'
 total=0;counts={}
 for name in manifests:
  prefix=name.rsplit('/',1)[0]+'/'; manifest=json.loads(z.read(name));d=json.loads(z.read(prefix+'results.json'))
  assert d['head']==head and d['exitCode']==0 and d['github']['run']==run,'HEAD/run/exit'
  assert d['phase'] not in counts,'duplicate phase';counts[d['phase']]=len(d['rows'])
  assert set(n for n in names if n.startswith(prefix) and not n.endswith('/') )==set(prefix+n for n in manifest)|{name},'member inventory'
  for n,h in manifest.items():assert hashlib.sha256(z.read(prefix+n)).hexdigest()==h,'member SHA';total+=1
 report={'status':'PASS','head':head,'artifact':a['id'],'zipSHA256':digest,'manifestHashes':total,'rows':counts,'retention':'90 days; not permanent archive'}
pathlib.Path('.work/archive-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
