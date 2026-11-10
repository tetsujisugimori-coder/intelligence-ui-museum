"""Release only synthetic localhost hosted evidence; never actual-PC raw data."""
import json,sys,zipfile,urllib.parse,pathlib,hashlib
root=pathlib.Path(sys.argv[1]);d=json.loads((root/'results.json').read_text())
assert d['github']['run'] and d['system']['platform'] in ['linux','win32']
assert d['executableOverride'] is None and d['exitCode']==0 and not d.get('fatal')
allowed={'/','/favicon.ico'}|{'/'+f for f in d['build']}
for r in d['rows']:
 p=r['privacy'];assert p['freshContext'] and not p['physicalInput'] and p['initialStorage']=={'cookies':[],'origins':[]}
 assert p['blockedRequests']==[] and p['externalRequests']==0 and r['consoleErrors']==[] and r['pageErrors']==[]
 assert r['status']=='COMPLETE' and not r.get('error') and not r.get('captureError')
 origin=p['allowedOrigin'];assert origin.startswith('http://127.0.0.1:')
 with zipfile.ZipFile(root/r['traceFile']) as z:
  assert z.testzip() is None
  for n in z.namelist():
   assert '..' not in pathlib.PurePosixPath(n).parts
   if n.endswith('.network'):
    for line in z.read(n).splitlines():
     row=json.loads(line);q=row.get('snapshot',{}).get('request',{});u=urllib.parse.urlsplit(q.get('url',''))
     assert u.scheme+'://'+u.netloc==origin and u.path in allowed
     assert u.query in ['', 'theme=light&text=100'] and q.get('method')=='GET'
     assert not q.get('postData') and not q.get('cookies')
print('SAFE_SYNTHETIC_HOSTED_ONLY')
