"""Compare the review HEAD and Stage A/B origins without rewriting manifests."""
import json, subprocess, sys
from pathlib import Path
OLD='b9d3b840162c8d03fa5d2f62c89793ea55ce7d03'
BASE='6477d0bc3fcd207210524abeaace97d0e506e886'
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
def tree(ref):return {line.split('\t')[1]:line.split()[2] for line in git('ls-tree','-r',ref).splitlines()}
def changed(a,b):return git('diff','--name-only',a,b).splitlines()
a=tree('256cc1dbc3186d23026402c673ea085b901c4986');b=tree('9aa70a32dceb022ad6252f608b7af1d88ad57440');old=tree(OLD);current=tree('HEAD');main=tree(BASE)
afiles=set(changed('1c45d45','256cc1dbc3186d23026402c673ea085b901c4986'))- {'.github/workflows/ci.yml'}
bfiles=set(changed('1c45d45','9aa70a32dceb022ad6252f608b7af1d88ad57440'))- {'.github/workflows/ci.yml'}
allowed_existing={'.github/workflows/ci.yml','apps/v11/exhibits.js','apps/v11/run-browser-ci.cjs','apps/v11/accessibility-test.cjs','apps/v11/README.md'}
allowed_new={'LOG.md','scripts/verify-pr8-local-fix.py','apps/v11/transfer-contract.cjs','apps/v11/transfer-contract.test.cjs','apps/v11/transfer-red.cjs','apps/v11/transfer-scenarios.cjs','apps/v11/transfer-test.cjs','apps/v11/text-zoom-test.cjs','apps/v11/text-zoom-contract.cjs','apps/v11/text-zoom-contract.test.cjs'}
allowed_prefix=('evidence/pr8-transfer-20261102/','evidence/pr8-text-zoom-20261102/','evidence/pr8-resubmission-20261102/')
result={'head':git('rev-parse','HEAD'),'tree':git('rev-parse','HEAD^{tree}'),'reviewHead':OLD,'reviewTree':git('rev-parse',OLD+'^{tree}'),'base':BASE,'stageA':{},'stageB':{}}
assert len(afiles)==97 and len(bfiles)==122
for label,files,reference in [('stageA',afiles,a),('stageB',bfiles,b)]:
 assert all(old.get(f)==reference.get(f) for f in files),label+' original integration mismatch'
 modified=sorted(f for f in files if current.get(f)!=old.get(f))
 assert set(modified)<=allowed_existing
 result[label]={'total':len(files),'unchanged':len(files)-len(modified),'intentionallyModified':modified}
assert all(current.get(f)==blob for f,blob in main.items() if f!='.github/workflows/ci.yml'),'main protected blob changed'
product=[f for f in old if f.startswith('apps/v11/')];assert len(product)==16
result['stageBProduct']={'total':16,'unchanged':sum(current.get(f)==old[f] for f in product),'intentionallyModified':[f for f in product if current.get(f)!=old[f]]}
result['modifiedExisting']=sorted(f for f in old if current.get(f)!=old[f]);assert set(result['modifiedExisting'])<=allowed_existing
result['added']=sorted(set(current)-set(old));assert all(f in allowed_new or f.startswith(allowed_prefix) for f in result['added'])
assert not(set(old)-set(current)),'deleted original files'
result['mainNonCIUnchanged']=sum(f!='.github/workflows/ci.yml' for f in main)
result['status']='PASS'
print(json.dumps(result,ensure_ascii=False,indent=2))
