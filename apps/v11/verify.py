from pathlib import Path
import json,re

def data(p):
 s=Path(p).read_text(encoding='utf8')
 return json.loads(re.search(r'<script id="dataset" type="application/json">([\s\S]*?)</script>',s)[1])
a=data('legacy/v09/index.html');b=data('apps/v11/index.html')
assert len(b)==150 and [x['id'] for x in b]==list(range(1,151))
assert a==b[:117], 'old dataset changed'
expected=[('Time Picker','入力'),('Transfer List','入力'),('Kanban Board','インタラクション'),('Heatmap','データ表示'),('Keyboard Shortcut Recorder','入力'),('Notification Center','通知')]
assert [(x['name'],x['category']) for x in b[117:123]]==expected
assert all(x['provenance']['出自区分']=='独自実装' and x['provenance']['OpenAI公式との関連']=='公式SDK・APIを使用しない' for x in b[117:])
print('PASS: 150 consecutive IDs, original 117 complete dataset equality, six names/categories/origins')

html=Path('apps/v11/index.html').read_text(encoding='utf8')
assert '<title>Intelligence UI Museum | v11 150 exhibits</title>' in html
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
assert [(x["name"],x["category"]) for x in b[132:135]]==[("Calendar Scheduler","入力"),("Faceted Search","入力"),("Master–Detail Inspector","データ表示")]
print("PASS: original132 dataset hash, new133–135 metadata")

baseline5=json.loads(Path("apps/v11/wave5-baseline.json").read_text())
assert hashlib.sha256(json.dumps(b[:135],ensure_ascii=False,separators=(",",":")).encode()).hexdigest()==baseline5["dataset_sha256"]
assert [(x["name"],x["category"]) for x in b[135:138]]==[('Flow Canvas Editor', 'インタラクション'), ('Semantic Zoom Explorer', 'ナビゲーション'), ('Branching History Explorer', 'インタラクション')]
print("PASS: previous135 intact, new136–138")

baseline6=json.loads(Path("apps/v11/wave6-baseline.json").read_text())
assert hashlib.sha256(json.dumps(b[:138],ensure_ascii=False,separators=(",",":")).encode()).hexdigest()==baseline6["dataset_sha256"], "previous138 changed"
assert [(x["name"],x["category"]) for x in b[138:141]]==[("Linked Views Explorer","データ表示"),("Conflict Resolution Editor","入力"),("Provenance Explorer","データ表示")]
print("PASS: previous138 intact, new139–141")

baseline7=json.loads(Path("apps/v11/wave7-baseline.json").read_text())
assert b[:141]==baseline7,"previous141 full metadata changed"
assert [(x["name"],x["category"]) for x in b[141:144]]==[('Dependency Impact Explorer', 'データ表示'), ('What-if Scenario Workbench', '入力'), ('Interaction Replay Timeline', 'インタラクション')]
print("PASS: previous141 full metadata intact; new142-144; 11categories")

# Wave7 gallery description registration is distinct from in-demo explanations.
for name in ['Dependency Impact Explorer','What-if Scenario Workbench','Interaction Replay Timeline']:
    assert re.search(r'"'+re.escape(name)+r'"\s*:\s*"[^"\n]{10,}"',html), 'wave7 description registration missing '+name
print('PASS: wave7 gallery description registrations')

base8=json.loads(Path("docs/wave8/BASELINE.json").read_text())
assert b[:144]==base8["dataset"], "previous144 full metadata changed"
assert [(x["name"],x["category"]) for x in b[144:147]]==[("Streaming Result Inspector","インタラクション"),("Approval Gate Workbench","インタラクション"),("Partial Failure Recovery Console","インタラクション")]
print("PASS: previous144 all fields preserved; 145-147 independent exhibits")

base9=json.loads(Path("docs/wave9/BASELINE.json").read_text())
assert b[:147]==base9["rows"], "previous147 complete fields"
assert [(x["name"],x["category"]) for x in b[147:]]==[("Structured Output Validator","入力"),("Evidence Coverage Matrix","データ表示"),("Evaluation Rubric Comparator","インタラクション")]
for x in b[147:]: assert x["name"] in html and x["provenance"]["既存展示との違い"]
print("PASS: previous147 intact; 148-150 metadata; 11 categories")
