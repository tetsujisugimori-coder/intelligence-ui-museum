from pathlib import Path
import json,re

def data(p):
 s=Path(p).read_text(encoding='utf8')
 return json.loads(re.search(r'<script id="dataset" type="application/json">([\s\S]*?)</script>',s)[1])
a=data('legacy/v09/index.html');b=data('apps/v11/index.html')
assert len(b)==135 and [x['id'] for x in b]==list(range(1,136))
assert a==b[:117], 'old dataset changed'
expected=[('Time Picker','入力'),('Transfer List','入力'),('Kanban Board','インタラクション'),('Heatmap','データ表示'),('Keyboard Shortcut Recorder','入力'),('Notification Center','通知')]
assert [(x['name'],x['category']) for x in b[117:123]]==expected
assert all(x['provenance']['出自区分']=='独自実装' and x['provenance']['OpenAI公式との関連']=='公式SDK・APIを使用しない' for x in b[117:])
print('PASS: 135 consecutive IDs, original 117 complete dataset equality, six names/categories/origins')

html=Path('apps/v11/index.html').read_text(encoding='utf8')
assert '<title>Intelligence UI Museum | v11 135 exhibits</title>' in html
assert len({x['category'] for x in b})==11
print('PASS: v11 title and 11 categories')

import hashlib
baseline=json.loads(Path('apps/v11/wave1-baseline.json').read_text())
assert hashlib.sha256(json.dumps(b[:123],ensure_ascii=False,separators=(',',':')).encode()).hexdigest()==baseline['dataset_sha256'], 'previous123 changed'
assert hashlib.sha256(Path('legacy/v09/index.html').read_bytes()).hexdigest()==baseline['legacy_sha256'], 'legacy bytes changed'
assert [(x['name'],x['category']) for x in b[123:126]]==[('Query Builder','入力'),('Permission Matrix','データ表示'),('Pivot Table','データ表示')]
print('PASS: original123 dataset hash, legacy bytes, new124–126 metadata')

baseline2=json.loads(Path("apps/v11/wave2-baseline.json").read_text())
assert hashlib.sha256(json.dumps(b[:126],ensure_ascii=False,separators=(",",":")).encode()).hexdigest()==baseline2["dataset_sha256"], "previous126 changed"
assert [(x["name"],x["category"]) for x in b[126:129]]==[("Tree Grid","データ表示"),("Visual Rule Editor","入力"),("Dependency Graph","データ表示")]
print("PASS: original126 dataset hash, new127–129 metadata")

baseline3=json.loads(Path("apps/v11/wave3-baseline.json").read_text())
assert hashlib.sha256(json.dumps(b[:129],ensure_ascii=False,separators=(",",":")).encode()).hexdigest()==baseline3["dataset_sha256"], "previous129 changed"
assert [(x["name"],x["category"]) for x in b[129:132]]==[("Editable Data Grid","データ表示"),("Schema Form","入力"),("Gantt Editor","データ表示")]
print("PASS: original129 dataset hash, new130–132 metadata")

baseline4=json.loads(Path("apps/v11/wave4-baseline.json").read_text())
assert hashlib.sha256(json.dumps(b[:132],ensure_ascii=False,separators=(",",":")).encode()).hexdigest()==baseline4["dataset_sha256"], "previous132 changed"
assert [(x["name"],x["category"]) for x in b[132:]]==[("Calendar Scheduler","入力"),("Faceted Search","入力"),("Master–Detail Inspector","データ表示")]
print("PASS: original132 dataset hash, new133–135 metadata")
