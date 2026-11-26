"""R1 build/check from fixed Git blobs; Python stdlib and Node template reader only."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[3]
DOC = ROOT / 'docs/research/r1'
BASE = '691a52f4e61fb2b3bc5943c3544eda418d3c8ef7'
TREE = 'c8df96120fc8235cafa362ad99c82f1d0efe676c'
ORACLE = '2e4bd6c71695adc0fadc4a6651a57b6c8fd104d6f1a69cf848c9735a9661708a'
UNKNOWN = 'UNKNOWN'
AXES = ('selection', 'providedData', 'receiveOperation', 'combine', 'textFallback')
FIELDS = ('inputs', 'outputs', 'operations', 'events', 'state', 'error', 'appropriate', 'inappropriate')
LEVELS = ('basic', 'composite', 'pattern', 'ai', 'visualize')
READ_FIELDS = {'id', 'name', 'legacyCategory', 'purpose', 'source', 'classification', 'relations',
               'implementation', 'accessibility', 'aiHypotheses', 'status', 'unknowns'}
PARSER_VERSION = 1


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def profile(i):
    if i <= 117:
        return ('index.html', 'v09Demo' if i >= 106 else 'v08Demo' if i >= 94 else 'labDemo' if i >= 82 else 'demo')
    if i <= 123:
        return ('exhibits.js', 'v11Demo')
    if i <= 162:
        wave = (i - 124) // 3 + 1
        return (f'wave{wave}.js', f'wave{wave}Demo')
    if i <= 165:
        key = ('Mapping', 'Join', 'Scope')[i - 163]
        return (f'wave14-{key.lower()}.js', f'wave14{key}Demo')
    return ('wave15.js', 'wave15Demo')


class Elements(HTMLParser):
    """Conservative static evidence. Never infer implemented keyboard or runtime behavior."""
    shapes = {'table':'table', 'form':'form', 'ul':'list', 'ol':'list', 'details':'disclosure',
              'dialog':'dialog', 'fieldset':'group', 'svg':'graphic', 'canvas':'graphic',
              'pre':'code-panel'}
    roles = {'list':'list','group':'group','dialog':'dialog','tablist':'tab-list'}
    inputs = {'checkbox':'checkbox','radio':'radio','range':'slider','number':'number',
              'date':'date-time','time':'date-time','color':'color-picker','file':'file-input',
              'button':'button','submit':'button','reset':'button'}

    def __init__(self, markup):
        super().__init__(convert_charrefs=True)
        self.basic, self.composite, self.contains = {}, {}, set()
        self.controls, self.states, self.a11y, self.visible_text = set(), set(), set(), []
        self.stack = []
        self.feed(markup)
        self.close()

    def put(self, registry, k, token):
        if k:
            registry.setdefault(k, set()).add(token)

    def handle_starttag(self, name, attr):
        a = dict(attr)
        role = a.get('role')
        marker = next((k for k in a if k.startswith('data-')), name)
        basic = {'button':'button','textarea':'multiline','select':'select','summary':'summary',
                 'output':'status-text','progress':'progress-control','meter':'progress-control'}.get(name)
        if name == 'input' and a.get('type') != 'hidden':
            basic = self.inputs.get(a.get('type'), 'text-input')
        if name == 'a' and 'href' in a:
            basic = 'link'
        if role in {'button','switch','tab'}:
            basic = 'button'
        if role == 'combobox':
            basic = 'select'
        if role == 'slider':
            basic = 'slider'
        if role in {'status','alert','log'} or 'aria-live' in a:
            basic = 'status-text'
        if set(a.get('class','').split()) & {'badge','chip','status-badge'}:
            basic = 'badge'
        comp = self.shapes.get(name) or self.roles.get(role)
        self.put(self.basic, basic, marker)
        self.put(self.composite, comp, marker)
        if basic:
            self.contains.update((k, basic) for _, k in self.stack if k)
        if basic and any(k.startswith('data-') for k in a):
            self.controls.update((f'{k}={v}' if k == 'data-action' else k) for k,v in a.items() if k.startswith('data-') and v is not None)
        self.states.update(k for k in a if k in {'aria-selected','aria-pressed','aria-checked','aria-expanded','aria-current','disabled','hidden'})
        self.a11y.update(k for k in a if k.startswith('aria-') or k in {'role','tabindex','for','scope','alt'})
        if name == 'label':
            self.a11y.add('label element')
        if name not in {'input','br','hr','img','area','meta','source','link','wbr','col','embed','base','param','track'}:
            self.stack.append((name, comp))

    def handle_endtag(self,name):
        for j in range(len(self.stack)-1,-1,-1):
            if self.stack[j][0] == name:
                del self.stack[j:]
                return

    def handle_data(self,data):
        if data.strip():
            self.basic.setdefault('text', set()).add('#text')
            self.contains.update((k, 'text') for _, k in self.stack if k)
            self.visible_text.append(' '.join(data.split()))

    def handle_startendtag(self,name,attrs):
        self.handle_starttag(name,attrs)
        self.handle_endtag(name)


def fail(condition, reason):
    if not condition:
        raise ValueError(reason)


def parse_registry(index):
    match = re.search(r'<script id="dataset" type="application/json">([\s\S]*?)</script>', index)
    fail(match, 'registry missing')
    rows = json.loads(match[1])
    fail([r['id'] for r in rows] == list(range(1,169)), 'baseline id range')
    identity = [[r['id'], r['name'], r['category']] for r in rows]
    fail(len({r[2] for r in identity}) == 11, 'baseline category count')
    fail(hashlib.sha256(json.dumps(identity,ensure_ascii=False,separators=(',',':')).encode()).hexdigest() == ORACLE, 'baseline oracle digest')
    return rows


def fixed_sources():
    fail(git('rev-parse', f'{BASE}^{{tree}}').decode().strip() == TREE, 'baseline tree mismatch')
    paths = git('ls-tree','-r','--name-only',BASE,'apps/v11').decode().splitlines()
    selected = [p for p in paths if re.fullmatch(r'apps/v11/(index.html|exhibits.js|wave[\w-]+\.js)',p)]
    return {p.removeprefix('apps/v11/'):git('show',f'{BASE}:{p}').decode() for p in selected}


def loc(sources, file, symbol, i):
    source = sources[file]
    hit = (re.search(re.escape(symbol), source) if symbol.startswith("case '") else
           re.search(r'\b(?:function\s+|(?:const|let)\s+)'+re.escape(symbol)+r'\b', source))
    fail(hit, f'locator not found: {file} {symbol}')
    return {'path':'apps/v11/'+file,'line':source[:hit.start()].count('\n')+1,'symbol':symbol,
            'exhibitId':i, 'blobSha256':hashlib.sha256(source.encode()).hexdigest()}


def read_templates(sources):
    with tempfile.TemporaryDirectory(prefix='trusted-base-',dir=ROOT/'.work/research-r1') as t:
        for name, text in sources.items():
            (Path(t)/name).write_text(text,encoding='utf8')
        return json.loads(subprocess.check_output(['node',str(Path(__file__).with_name('read-templates.cjs')),t],
                                                 cwd=ROOT, timeout=25))


def labels_for(i, pairs):
    return sorted(k for k, values in pairs.items() if i in values)


def hypotheses(item, study, classification):
    # Research proposal only: not observed traffic, runtime feature, or public API.
    if study:
        selection = f'利用場面候補：{study[-2]}。'
        inputs = f'候補データ：{study[1]}。実AI向けデータ契約は未設計。'
        receive = f'候補イベント：{study[3]}を明示確定した結果だけ受け取る。'
    else:
        selection = '数値の比較・構造の探索が必要で、文章だけでは追跡しづらい場合。' if classification["visualize"] else '個別の選択理由は UNKNOWN。'
        inputs = '候補は固定値・選択肢と表示ラベル。個別の入力設計は UNKNOWN。' if 'select' in classification['basic'] else '個別の入力設計は UNKNOWN。'
        receive = '操作の意味と確定結果を分けて提案する。通知形式・伝達が必要かは未設計。'
    combine = ('同じ安定IDで結果と可視化を照合する候補。' if classification['visualize'] else
               '必要時のみ入力と状態表示を組み合わせる。接続の妥当性は未検証。')
    return dict(zip(AXES, (selection,inputs,receive,combine,
                           '一つの説明・結果で目的を満たせば文章。反復比較や入力が必要ならUIを候補とする。'),strict=True))


def make():
    sources = fixed_sources()
    registry = parse_registry(sources['index.html'])
    templates = read_templates(sources)
    a = json.loads((DOC/'annotations.json').read_text())
    t = json.loads((DOC/'taxonomy.json').read_text())
    fail([x['id'] for x in templates] == [x['id'] for x in registry], 'template coverage')
    for source_key, kind in [('pattern','pattern'),('visualize','visualize'),('aiTeaching','ai')]:
        for k, ids in a[source_key].items():
            fail(k in t[kind] and len(ids) == len(set(ids)) and all(type(i) is int and 1<=i<=168 for i in ids), 'invalid annotation tag / ID')
    out=[]
    for x, markup in zip(registry,templates,strict=True):
        i=x['id']
        fail(markup['name'] == x['name'], 'registry/template disagreement')
        file, symbol=profile(i)
        e=Elements(markup['stage'])
        study=a['study'].get(str(i))
        refs={'template':loc(sources,file,symbol,i),'registry':{'path':'apps/v11/index.html','elementId':'dataset','exhibitId':i}}
        if study:
            refs['behavior']=loc(sources,file,study[0],i)
        c={'basic':sorted(e.basic),'composite':sorted(e.composite),
           'pattern':labels_for(i,a['pattern']),'ai':labels_for(i,a['aiTeaching']),
           'visualize':labels_for(i,a['visualize'])}
        # Documented additional dynamic structures may be absent from the unmounted template.
        for comp, ids in {'carousel':(75,79,89), 'timeline':(51,123,138,144,160,167),
                          'chart':(121,126,132,139,143), 'workbench':tuple(range(124,169)),
                          'card':(25,28,29,30,31,88,120)}.items():
            if i in ids and comp not in c['composite']:
                c['composite'].append(comp)
        c['composite'].sort()
        relations=[['uses',f'{kind}:{k}', ('static-template' if k in (e.basic if kind=='basic' else e.composite) else 'source-review')]
                   for kind in ('basic','composite') for k in c[kind]]
        relations += [['contains',f'composite:{p}',f'basic:{b}'] for p,b in sorted(e.contains)]
        facts = {key:{'status':UNKNOWN,'value':None} for key in FIELDS}
        if study:
            for k,v in zip(FIELDS,study[1:],strict=True):
                if v != UNKNOWN:
                    facts[k]={'status':'USE_CASE' if k in {'appropriate','inappropriate'} else 'SOURCE_READ','value':v}
        # These are direct markup facts, not handler coverage, a full schema or a live transcript.
        facts.update({'controlsInTemplate':sorted(e.controls),'stateAttributesInTemplate':sorted(e.states),
                      'componentTokens':{f'{kind}:{k}':sorted(tokens) for kind, mapping in
                                         [('basic',e.basic),('composite',e.composite)] for k,tokens in sorted(mapping.items())},
                      'initialText':' '.join(e.visible_text)[:140],
                      'aiConnection':{'status':'NOT_TESTED','value':None},
                      'humanOperationTest':{'status':'NOT_TESTED','value':None}})
        purpose=markup['description'] or x['dup']
        unknowns=[k for k in FIELDS if facts[k]['status']==UNKNOWN]+['liveAccessibility','actualAiSelection','actualAiDataExchange']
        out.append({'id':i,'name':x['name'],'legacyCategory':x['category'],'purpose':purpose,'source':refs,
                    'classification':c,'relations':relations,'implementation':facts,
                    'accessibility':{'status':'STATIC_ONLY','templateMarkers':sorted(e.a11y),'runtime':'NOT_TESTED'},
                    'aiHypotheses':{'status':'HYPOTHESIS','axes':hypotheses(x,study,c)},
                    'status':'SOURCE_REVIEWED' if study else 'TEMPLATE_REVIEWED','unknowns':unknowns})
    return out, registry, t


def validate(rows, registry, taxonomy):
    ids = [r['id'] for r in rows]
    fail(all(type(i) is int for i in ids), 'ID type')
    fail(len(ids) == len(set(ids)), 'duplicate exhibit ID')
    fail(ids == [r['id'] for r in registry], 'missing, invented or reordered ID')
    for row, fixed in zip(rows,registry,strict=True):
        fail(set(row)==READ_FIELDS, 'mandatory exhibit fields')
        i=row['id']
        fail((row['name'],row['legacyCategory'])==(fixed['name'],fixed['category']), 'legacy identity drift')
        fail(isinstance(row['purpose'],str) and row['purpose'].strip(), 'purpose required')
        fail(row['status'] in {'SOURCE_REVIEWED','TEMPLATE_REVIEWED'}, 'invalid review status')
        fail(set(row['classification']) == set(LEVELS), 'classification field mismatch')
        for kind, refs in row['classification'].items():
            fail(isinstance(refs,list) and refs==sorted(set(refs)) and set(refs)<=taxonomy[kind].keys(), 'bad classification reference')
        source=row['source']
        fail(set(source)==({'template','registry','behavior'} if row['status']=='SOURCE_REVIEWED' else {'template','registry'}), 'source references missing')
        fail(source['registry']=={'path':'apps/v11/index.html','elementId':'dataset','exhibitId':i}, 'registry source reference')
        file,symbol=profile(i)
        for ref in (source[k] for k in source if k!='registry'):
            fail(ref['path']=='apps/v11/'+file and ref['exhibitId']==i and
                 type(ref['line']) is int and ref['line']>0 and re.fullmatch(r'[0-9a-f]{64}',ref['blobSha256']), 'bad source reference')
        fail(source['template']['symbol']==symbol, 'wrong template route')
        c=row['classification']
        members={f'{k}:{v}' for k in ('basic','composite') for v in c[k]}
        uses=set()
        relations=row['relations']
        fail(isinstance(relations,list) and all(isinstance(x,list) and len(x)==3 and all(isinstance(v,str) for v in x) for x in relations)
             and len(relations)==len({tuple(x) for x in relations}), 'invalid or duplicate relation')
        for rel,p,q in relations:
            fail(p in members, 'unregistered relation source')
            if rel=='uses':
                fail(q in {'static-template','source-review'} and p not in uses, 'invalid uses relation')
                uses.add(p)
            else:
                fail(rel=='contains' and p.startswith('composite:') and q.startswith('basic:') and q in members, 'invalid contains reference')
        fail(members==uses, 'component missing relation')
        hypothesis=row['aiHypotheses']
        fail(hypothesis['status']=='HYPOTHESIS' and set(hypothesis['axes'])==set(AXES) and
             all(isinstance(x,str) and x.strip() for x in hypothesis['axes'].values()), 'invalid AI hypothesis')
        impl=row['implementation']
        fail(set(impl)==set(FIELDS)|{'controlsInTemplate','stateAttributesInTemplate','componentTokens','initialText','aiConnection','humanOperationTest'}, 'behavior fields missing')
        for k in FIELDS:
            d=impl[k]
            fail(set(d)=={'status','value'}, 'invalid fact fields')
            if d['status']==UNKNOWN:
                fail(d['value'] is None and k in row['unknowns'], 'UNKNOWN masked')
            else:
                expected_status='USE_CASE' if k in {'appropriate','inappropriate'} else 'SOURCE_READ'
                fail(d['status']==expected_status and row['status']=='SOURCE_REVIEWED' and
                     isinstance(d['value'],str) and d['value'].strip() and k not in row['unknowns'], 'unsubstantiated fact')
        fail(all(impl[k]=={'status':'NOT_TESTED','value':None} for k in ('aiConnection','humanOperationTest')), 'unperformed activity promoted')
        fail(row['accessibility']['status']=='STATIC_ONLY' and row['accessibility']['runtime']=='NOT_TESTED', 'accessibility promotion')


def pinned_vectors(rows):
    # Independent literal expectations: neither generated annotation rules nor output derive these.
    def has(i, level, key):
        return key in rows[i-1]['classification'][level]
    for i,kind,tag in ((1,'basic','button'),(24,'basic','file-input'),(33,'composite','tab-list'),
                       (106,'basic','slider'),(121,'visualize','statistics'),(121,'composite','chart'),
                       (134,'pattern','search'),(137,'visualize','hierarchy'),
                       (164,'visualize','workflow'),(168,'pattern','validation')):
        fail(has(i,kind,tag),f'missing independent positive vector {i} {tag}')
    for i,kind,tag in ((1,'visualize','workflow'),(24,'basic','select'),(121,'visualize','network'),
                       (137,'visualize','spatial'),(168,'ai','select-ui')):
        fail(not has(i,kind,tag),f'false independent vector {i} {tag}')


def summary(rows, taxonomy):
    usage={k:dict(sorted((ref,sum(ref in r['classification'][k] for r in rows)) for ref in taxonomy[k])) for k in LEVELS}
    return {'catalogVersion':PARSER_VERSION,'baseline':BASE,'tree':TREE,'exhibits':len(rows),
            'legacyCategories':len({r['legacyCategory'] for r in rows}),
            'coverage':{status:sum(r['status']==status for r in rows) for status in ('SOURCE_REVIEWED','TEMPLATE_REVIEWED')},
            'unclassified':sum(not r['classification']['pattern'] for r in rows),
            'exhibitsWithUnknowns':sum(bool(r['unknowns']) for r in rows),
            'unknownFields':sum(len(r['unknowns']) for r in rows),
            'relations':sum(len(r['relations']) for r in rows),
            'containsRelations':sum(typ=='contains' for r in rows for typ,*_ in r['relations']),
            'visualizeExhibits':sum(bool(r['classification']['visualize']) for r in rows),
            'definitions':{k:len(taxonomy[k]) for k in LEVELS},
            'observedKinds':{k:sum(bool(n) for n in v.values()) for k,v in usage.items()},
            'usage':usage}


def files(rows, taxonomy):
    parts={}
    for start in range(0,len(rows),28):
        chunk=rows[start:start+28]
        parts[DOC/'catalog'/f'{chunk[0]["id"]:03d}-{chunk[-1]["id"]:03d}.jsonl']=''.join(
            json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in chunk)
    parts[DOC/'catalog'/'summary.json']=json.dumps(summary(rows,taxonomy),ensure_ascii=False,indent=2)+'\n'
    return parts


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--write',action='store_true')
    args=ap.parse_args()
    (ROOT/'.work/research-r1').mkdir(parents=True,exist_ok=True)
    generated, registry, taxonomy=make()
    validate(generated,registry,taxonomy)
    pinned_vectors(generated)
    values=files(generated,taxonomy)
    if args.write:
        for p,v in values.items():
            p.write_text(v,encoding='utf8')
    else:
        actual={p for p in (DOC/'catalog').iterdir() if p.is_file()}
        fail(actual==set(values),'unexpected/missing catalog files')
        rows=[json.loads(l) for p in sorted(actual) if p.suffix=='.jsonl' for l in p.read_text().splitlines()]
        validate(rows,registry,taxonomy)
        pinned_vectors(rows)
        for p,v in values.items():
            fail(p.read_bytes()==v.encode(),f'catalog not reproducible: {p.name}')
        changed=git('diff','--name-only','--no-renames',BASE).decode().splitlines()
        fail(all(p.startswith(('docs/research/r1/','scripts/research/r1/')) or p=='.github/workflows/research-r1.yml'
                 for p in changed), 'protected paths changed')
    print(json.dumps(summary(generated,taxonomy),ensure_ascii=False))


if __name__ == '__main__':
    main()
