"""R1 build/check from fixed Git blobs; Python stdlib and Node template reader only."""
import argparse
from contextlib import contextmanager
import hashlib
from html.parser import HTMLParser
from functools import lru_cache
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
SHARED_UNKNOWN = {'liveAccessibility','actualAiSelection','actualAiDataExchange'}
AXES = ('selection', 'providedData', 'receiveOperation', 'combine', 'textFallback')
FIELDS = ('inputs', 'outputs', 'operations', 'events', 'state', 'error', 'appropriate', 'inappropriate')
LEVELS = ('basic', 'composite', 'pattern', 'ai', 'visualize')
READ_FIELDS = {'id', 'name', 'legacyCategory', 'purpose', 'source', 'classification', 'relations',
               'implementation', 'accessibility', 'aiHypotheses', 'status', 'unknowns', 'binding'}
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


@lru_cache(maxsize=1)
def fixed_sources():
    fail(git('rev-parse', f'{BASE}^{{tree}}').decode().strip() == TREE, 'baseline tree mismatch')
    paths = git('ls-tree','-r','--name-only',BASE,'apps/v11').decode().splitlines()
    selected = [p for p in paths if re.fullmatch(r'apps/v11/(index.html|exhibits.js|wave[\w-]+\.js)',p)]
    return {p.removeprefix('apps/v11/'):git('show',f'{BASE}:{p}').decode() for p in selected}


@lru_cache(maxsize=512)
def source_identity(source, symbol):
    hit = (re.search(re.escape(symbol.removeprefix('literal:')), source) if symbol.startswith(("case '",'literal:')) else
           re.search(r'\b(?:function\s+|(?:const|let)\s+)'+re.escape(symbol)+r'\b', source))
    fail(hit, f'locator not found: {symbol}')
    return source[:hit.start()].count('\n')+1,hashlib.sha256(source.encode()).hexdigest()


def loc(sources, file, symbol, i):
    line,digest=source_identity(sources[file],symbol)
    return {'path':'apps/v11/'+file,'line':line,'symbol':symbol,'exhibitId':i,'blobSha256':digest}


@contextmanager
def materialized_sources(sources):
    (ROOT/'.work/research-r1').mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='trusted-base-',dir=ROOT/'.work/research-r1') as t:
        for name, text in sources.items():
            (Path(t)/name).write_text(text,encoding='utf8')
        yield t


def probe_bindings(directory):
    return subprocess.check_output(['node', str(Path(__file__).with_name('probe-bindings.cjs')), directory],
                                   cwd=ROOT, timeout=25)


def read_templates(sources):
    with materialized_sources(sources) as t:
        probe_bindings(t)
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


DYNAMIC = {132: {'composite:table':'<table><caption>開始と期間は編集中',
                 'composite:chart':'data-w3-bar="', 'basic:text-input':'data-key="gantt-${t.id}-start"'},
           136: {'basic:select':"select('node','移動ノード'", 'composite:graphic':'<svg width="340"'},
           139: {'composite:chart':'<div data-graph', 'composite:table':'<table><thead><tr><th>選択',
                 'basic:checkbox':'data-key="table-${r.id}"', 'basic:select':"select('sort','表の順序'"}}
BINDINGS = {132: ('t.id','確定 tasks。編集中の開始/期間は別 drafts。確定/Undoで棒と表の確定終了日が同時に更新される。',
                  'data-gantt-row="','data-w3-bar="'),
            139: ('r.id','表示順を変えても selected は安定IDで保持。チャートの押下とチェック済み行が同一IDを参照。',
                  'data-record="','data-row="')}


def binding_for(sources, file, i):
    if i not in BINDINGS:
        return {'status':'N/A' if i==1 else UNKNOWN,'value':None}
    key, meaning, left, right=BINDINGS[i]
    return {'status':'SOURCE_PROBED','key':key,'meaning':meaning,
            'anchors':[loc(sources,file,'literal:'+token,i) for token in (left,right)]}


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
        for component, token in DYNAMIC.get(i,{}).items():
            kind, tag=component.split(':')
            if tag not in c[kind]:
                c[kind].append(tag)
            c[kind].sort()
            refs.setdefault('dynamic',{})[component]=loc(sources,file,'literal:'+token,i)
        c['composite'].sort()
        relations=[['uses',f'{kind}:{k}', ('static-template' if k in (e.basic if kind=='basic' else e.composite) else 'source-review')]
                   for kind in ('basic','composite') for k in c[kind]]
        relations += [['contains',f'composite:{p}',f'basic:{b}'] for p,b in sorted(e.contains)]
        if i in BINDINGS:
            relations.append(['shares-key','composite:chart','composite:table'])
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
        unknowns=sorted({k for k in FIELDS if facts[k]['status']==UNKNOWN}|SHARED_UNKNOWN|
                        ({'sharedKeyBinding'} if binding_for(sources,file,i)['status']==UNKNOWN else set()))
        out.append({'id':i,'name':x['name'],'legacyCategory':x['category'],'purpose':purpose,'source':refs,
                    'classification':c,'relations':relations,'implementation':facts,
                    'accessibility':{'status':'STATIC_ONLY','templateMarkers':sorted(e.a11y),'runtime':'NOT_TESTED'},
                    'aiHypotheses':{'status':'HYPOTHESIS','axes':hypotheses(x,study,c)},
                    'status':'SOURCE_REVIEWED' if study else 'TEMPLATE_REVIEWED','unknowns':unknowns,
                    'binding':binding_for(sources,file,i)})
    return out, registry, t


def validate(rows, registry, taxonomy):
    sources=fixed_sources()
    annotations=json.loads((DOC/'annotations.json').read_text())
    fail(type(rows) is list and all(type(r) is dict and 'id' in r for r in rows), 'row type or missing ID')
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
        fail(type(row['classification']) is dict and set(row['classification']) == set(LEVELS), 'classification field mismatch')
        for kind, refs in row['classification'].items():
            fail(type(refs) is list and all(type(x) is str for x in refs) and refs==sorted(set(refs)) and set(refs)<=taxonomy[kind].keys(), 'bad classification reference')
        source=row['source']
        fail(type(source) is dict, 'source type')
        studied=annotations['study'].get(str(i))
        expected={'template','registry'}|({'behavior'} if studied else set())|({'dynamic'} if i in DYNAMIC else set())
        fail(set(source)==expected and (row['status']=='SOURCE_REVIEWED')==bool(studied), 'source references missing')
        fail(source['registry']=={'path':'apps/v11/index.html','elementId':'dataset','exhibitId':i}, 'registry source reference')
        file,symbol=profile(i)
        fail(source['template']==loc(sources,file,symbol,i), 'bad source reference')
        if studied:
            fail(source['behavior']==loc(sources,file,studied[0],i), 'bad behavior source reference')
        if i in DYNAMIC:
            fail(source['dynamic']=={k:loc(sources,file,'literal:'+v,i) for k,v in DYNAMIC[i].items()}, 'bad dynamic source reference')
        fail(row['binding']==binding_for(sources,file,i), 'invalid binding evidence/status')
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
            elif rel=='shares-key':
                fail(i in BINDINGS and p=='composite:chart' and q=='composite:table' and q in members, 'invalid shared key relation')
            else:
                fail(rel=='contains' and p.startswith('composite:') and q.startswith('basic:') and q in members, 'invalid contains reference')
        fail(members==uses, 'component missing relation')
        fail(sum(x[0]=='shares-key' for x in relations)==int(i in BINDINGS), 'missing shared key relation')
        hypothesis=row['aiHypotheses']
        fail(type(hypothesis) is dict and hypothesis.get('status')=='HYPOTHESIS' and set(hypothesis['axes'])==set(AXES) and
             all(isinstance(x,str) and x.strip() for x in hypothesis['axes'].values()), 'invalid AI hypothesis')
        impl=row['implementation']
        fail(type(impl) is dict and set(impl)==set(FIELDS)|{'controlsInTemplate','stateAttributesInTemplate','componentTokens','initialText','aiConnection','humanOperationTest'}, 'behavior fields missing')
        for k in FIELDS:
            d=impl[k]
            fail(type(d) is dict and set(d)=={'status','value'}, 'invalid fact fields')
            if d['status']==UNKNOWN:
                fail(d['value'] is None and k in row['unknowns'], 'UNKNOWN masked')
            else:
                expected_status='USE_CASE' if k in {'appropriate','inappropriate'} else 'SOURCE_READ'
                fail(d['status']==expected_status and row['status']=='SOURCE_REVIEWED' and
                     isinstance(d['value'],str) and d['value'].strip() and k not in row['unknowns'], 'unsubstantiated fact')
        unknowns=row['unknowns']
        expected_unknowns=sorted({k for k in FIELDS if impl[k]['status']==UNKNOWN}|SHARED_UNKNOWN|
                                 ({'sharedKeyBinding'} if row['binding']['status']==UNKNOWN else set()))
        fail(unknowns==expected_unknowns,'mandatory shared UNKNOWN / invalid unknown set')
        fail(all(impl[k]=={'status':'NOT_TESTED','value':None} for k in ('aiConnection','humanOperationTest')), 'unperformed activity promoted')
        fail(row['accessibility']['status']=='STATIC_ONLY' and row['accessibility']['runtime']=='NOT_TESTED', 'accessibility promotion')


def pinned_vectors(rows):
    # Independent literal expectations: neither generated annotation rules nor output derive these.
    def has(i, level, key):
        return key in rows[i-1]['classification'][level]
    for i,kind,tag in ((1,'basic','button'),(24,'basic','file-input'),(33,'composite','tab-list'),
                       (106,'basic','slider'),(121,'visualize','statistics'),(121,'composite','chart'),
                       (132,'composite','table'),(134,'pattern','search'),(136,'basic','select'),
                       (136,'composite','graphic'),(137,'visualize','hierarchy'),(139,'composite','table'),
                       (164,'visualize','workflow'),(168,'pattern','validation')):
        fail(has(i,kind,tag),f'missing independent positive vector {i} {tag}')
    for i in (132,139):
        fail(['shares-key','composite:chart','composite:table'] in rows[i-1]['relations'], f'missing independent binding {i}')
    for i in (157,158):
        fail('履歴なし' in rows[i-1]['implementation']['state']['value'], f'false decision history {i}')
    fail(rows[0]['binding']['status']=='N/A' and rows[135]['binding']['status']==UNKNOWN, 'binding NOT_APPLICABLE/UNKNOWN confusion')
    fail('履歴保持' in rows[158]['implementation']['state']['value'], 'missing decision history 159')
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
            'sharedKeyRelations':sum(typ=='shares-key' for r in rows for typ,*_ in r['relations']),
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
    ap=argparse.ArgumentParser(description=__doc__)
    mode=ap.add_mutually_exclusive_group()
    mode.add_argument('--write',action='store_true')
    mode.add_argument('--probe-bindings', action='store_true', help='run the binding probes on frozen Git blobs only')
    args=ap.parse_args()
    if args.probe_bindings:
        with materialized_sources(fixed_sources()) as t:
            print(probe_bindings(t).decode('utf-8'), end='')
        return
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
    print(json.dumps(summary(generated,taxonomy),ensure_ascii=False))


if __name__ == '__main__':
    main()
