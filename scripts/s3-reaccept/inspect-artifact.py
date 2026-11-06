"""Inspect exact uploaded ZIP in a second CI job; never equate existence with integrity."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import zipfile

repo = os.environ['GITHUB_REPOSITORY']
run = os.environ['GITHUB_RUN_ID']
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
tree = subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], text=True).strip()
out = Path('.work/s3-artifact-inspection')
out.mkdir(parents=True, exist_ok=False)
artifacts = json.loads(subprocess.check_output(['gh', 'api', f'repos/{repo}/actions/runs/{run}/artifacts']))['artifacts']
selected = [a for a in artifacts if a['name'] == f's3-reaccept-{head}']
assert len(selected) == 1, 'one exact source artifact required'
a = selected[0]
data = subprocess.check_output(['gh', 'api', f'repos/{repo}/actions/artifacts/{a["id"]}/zip'])
digest = hashlib.sha256(data).hexdigest()
assert a['digest'] == 'sha256:' + digest, 'uploaded ZIP digest mismatch'
archive = out / 'original.zip'
archive.write_bytes(data)
inventory = {}
target = out / 'extracted'
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None, 'CRC failure'
    for info in z.infolist():
        parts = PurePosixPath(info.filename)
        assert not parts.is_absolute() and '..' not in parts.parts, 'unsafe ZIP entry'
        assert info.filename not in inventory, 'duplicate ZIP entry'
        if not info.is_dir():
            body = z.read(info)
            inventory[info.filename] = {'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()}
    z.extractall(target)

root = target / 's3-evidence'
manifest = json.loads((root / 'manifest.json').read_text())
assert manifest['head'] == head and manifest['tree'] == tree, 'wrong source identity'
for f, expected in manifest['files'].items():
    assert hashlib.sha256((root / f).read_bytes()).hexdigest() == expected, 'internal hash mismatch: ' + f
audit = subprocess.run(['node', 'scripts/s3-reaccept/audit.cjs', str(root), head, tree], text=True, capture_output=True)
summaries = {}
for name in ['matrix', 'focus', 'faults']:
    p = root / name / 'results.json'
    if p.exists():
        result = json.loads(p.read_text())
        summaries[name] = {'status': result['status'], 'rows': len(result.get('rows', [])), 'failures': result.get('failures', []),
                           'failedRows': [{'id': r.get('id'), 'engine': r.get('engine'), 'error': r.get('error'),
                                           'checks': [c for c in r.get('checks', []) if not c.get('pass')]} for r in result.get('rows', []) if r.get('status') == 'FAIL']}
        if name == 'matrix':
            summaries[name]['consoles'] = [r.get('console', [])[:2] for r in result['rows'][:1] + result['rows'][16:17]]
steps = json.loads((root / 'steps.json').read_text())
for s in steps:
    if s.get('exit') != 0:
        f = root / (s['name'] + '.stderr.log')
        print('FAILED STAGE', s['name'], f.read_text()[-5000:] if f.exists() else 'no stderr')
report = {'evidenceKind': 'CI-only ZIP inspection in separate job; not a local download', 'head': head, 'tree': tree,
          'runId': run, 'attempt': os.environ['GITHUB_RUN_ATTEMPT'], 'artifact': a,
          'zipSha256': digest, 'fileCount': len(inventory), 'internalManifestHashesVerified': len(manifest['files']),
          'sourceComplete': manifest['complete'], 'auditExit': audit.returncode, 'audit': json.loads(audit.stdout), 'summaries': summaries}
(out / 'inventory.json').write_text(json.dumps(inventory, indent=2))
(out / 'inspection.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
# An intact ZIP containing a genuine failed product run remains failed acceptance.
# Inspection success means only byte/identity/CRC consistency, not research PASS.
