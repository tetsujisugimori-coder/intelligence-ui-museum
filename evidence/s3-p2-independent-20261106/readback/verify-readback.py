from pathlib import Path
import json,hashlib
p=Path(__file__).resolve().parent;out=[]
expected={26:'aa20f218ac526a7c8a162324f6ecac2bd48991d1',27:'af38afb7524aeee24a7405c5d5db48152100bf00',23:'ea6f19acfd60b37e9b147daa92e79838fd2f3070'}
for n,h in expected.items():
 r=json.loads((p/f'PR-{n}-review.json').read_text(encoding='utf-8'))
 m=json.loads((p/f'PR-{n}-metadata.json').read_text(encoding='utf-8-sig'))
 assert m['commit_id']==h and m['state']=='COMMENTED' and r['exactFullBodyMatch']
 assert (p/f'PR-{n}-review.txt').read_text(encoding='utf-8')==r['body']+'\n'
 out.append({'pr':n,'id':m['id'],'url':m['html_url'],'commit':h,'exactFullBodyMatch':True,'bodySha256':hashlib.sha256(r['body'].encode()).hexdigest()})
(p/'VERIFIED-READBACK.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
print(json.dumps(out))
