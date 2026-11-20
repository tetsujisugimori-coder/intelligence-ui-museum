from pathlib import Path
import json,hashlib,sys
root=Path(sys.argv[1]);root.mkdir(parents=True,exist_ok=True)
paths=[p for p in sorted(root.rglob('*')) if p.is_file() and p != root/'manifest.json']
name='manifest.json'
files={str(p.relative_to(root)):{'size':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths}
(root/name).write_text(json.dumps({'schema':1,'scope':'all files except manifest itself','files':files},indent=2))
