from pathlib import Path
import json,hashlib,sys
root=Path(sys.argv[1]);root.mkdir(parents=True,exist_ok=True)
core='--core' in sys.argv
if core:
    r=json.loads((root/'results.json').read_text())
    names={'results.json','faults.json'}|{'execution/'+f for f in r['execution']}
    for row in r['results']:
        names.update({row['id']+'.zip',row['id']+'.har'})
        names.update(row['id']+'/'+f for f in r['source'])
        names.update(s['file'] for s in row.get('screenshots',[]))
    paths=[root/n for n in sorted(names)];name='core-manifest.json'
else:
    paths=[p for p in sorted(root.rglob('*')) if p.is_file() and p.name!='manifest.json'];name='manifest.json'
files={str(p.relative_to(root)):{'size':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths}
(root/name).write_text(json.dumps({'schema':1,'scope':'fixed core evidence' if core else 'all files except manifest itself','files':files},indent=2))
