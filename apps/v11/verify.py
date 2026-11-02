from pathlib import Path
import json,re

def data(p):
 s=Path(p).read_text(encoding='utf8')
 return json.loads(re.search(r'<script id="dataset" type="application/json">([\s\S]*?)</script>',s)[1])
a=data('legacy/v09/index.html');b=data('apps/v11/index.html')
assert len(b)==123 and [x['id'] for x in b]==list(range(1,124))
assert a==b[:117], 'old dataset changed'
expected=[('Time Picker','入力'),('Transfer List','入力'),('Kanban Board','インタラクション'),('Heatmap','データ表示'),('Keyboard Shortcut Recorder','入力'),('Notification Center','通知')]
assert [(x['name'],x['category']) for x in b[117:]]==expected
assert all(x['provenance']['出自区分']=='独自実装' and x['provenance']['OpenAI公式との関連']=='公式SDK・APIを使用しない' for x in b[117:])
print('PASS: 123 consecutive IDs, original 117 complete dataset equality, six names/categories/origins')

html=Path('apps/v11/index.html').read_text(encoding='utf8')
assert '<title>Intelligence UI Museum | v11 123 exhibits</title>' in html
assert len({x['category'] for x in b})==11
print('PASS: v11 title and 11 categories')
