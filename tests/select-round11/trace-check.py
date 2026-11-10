"""Read-only API-sequence audit. Synthetic traces test this parser, not browsers."""
import json,sys,zipfile

# Independent enumerated expected interaction sequence from frozen original prelude.
def expected(name):
    b='#Button .stage button'; s='#Switch [role=switch]'
    if name=='environment': return [('environment', '')]
    if name=='layout': return [('scroll', '#'+n+' .stage >> nth=0') for n in ['Button','Badge','Alert','Switch','Select','Tooltip']]
    if name=='Button': return [('click',b),('focus',b),('key','Enter'),('key','Space'),('focus',b),('key','Tab'),('key','Shift+Tab'),('scroll',b)]+[('photo','')]*4+[('check','#Button input >> nth=0'),('disabled-noop',''),('uncheck','#Button input >> nth=0'),('check','#Button input >> nth=1'),('disabled-noop',''),('uncheck','#Button input >> nth=1')]
    if name=='Badge': return [('select','#Badge select:warning'),('scroll','#Badge .samples'),('photo','')]
    if name=='Alert': return [('select','#Alert select:danger'),('focus','#Alert .controls button'),('key','Enter'),('key','Enter'),('scroll','#Alert .alert-demo'),('photo','')]
    if name=='SwitchPrefix':return [('click',s),('focus',s),('key','Space')]
    if name=='SwitchDisabled':return [('check','#Switch input[type=checkbox] >> nth=0'),('disabled-noop',''),('uncheck','#Switch input[type=checkbox] >> nth=0')]
    if name=='Switch': return [('click',s),('focus',s),('key','Space'),('check','#Switch input[type=checkbox] >> nth=0'),('disabled-noop',''),('uncheck','#Switch input[type=checkbox] >> nth=0')]
    raise AssertionError('unknown group')

def token(e):
    m=e.get('method');p=e.get('params',{});selector=p.get('selector','');ex=p.get('expression','')
    if m in ['click','focus','check','uncheck']: assert not p.get('force');return (m,selector)
    if m=='keyboardPress':return ('key',p['key'])
    if m=='selectOption':return ('select',selector+':'+p['options'][0]['valueOrLabel'])
    if m=='screenshot':return ('photo','')
    if m=='waitForSelector' and e.get('title')=='Scroll into view':return ('scroll',selector)
    if m=='evaluateExpression' and ex=='e=>e.click()':return ('disabled-noop','')
    if m=='evaluateExpression' and 'focus:document.hasFocus()' in ex:return ('environment','')
    return None

def inspect(events,title,groups,executed):
    assert any(e.get('type')=='context-options' and e.get('title')==title for e in events),'trace title'
    assert any(e.get('type')=='frame-snapshot' for e in events),'no frame snapshots'
    begun=[];active=None;tokens=[];checked=False;calls={e.get('callId'):e for e in events if e.get('type')=='after'}
    for e in events:
        if e.get('type')!='before':continue
        p=e.get('params',{});marker=p.get('arg',{}).get('value',{}).get('s','')
        if e.get('method')=='evaluateExpression' and marker.startswith('ROUND11_BEGIN:'):
            assert active is None,'overlapping group';active=marker.split(':',1)[1];begun.append(active);tokens=[];continue
        if e.get('method')=='evaluateExpression' and marker.startswith('ROUND11_END:'):
            assert active==marker.split(':',1)[1],'group close mismatch'
            want=expected(active) if active in executed else []
            assert tokens==want,(active,tokens,want)
            active=None;continue
        if active:
            t=token(e)
            if e.get('method')=='check':checked=True
            if e.get('method')=='uncheck':checked=False
            if checked and e.get('method')=='waitForSelector' and e.get('title')=='Evaluate' and p.get('selector') in ['#Button .stage button','#Switch [role=switch]']:
                t=('disabled-noop','')
            if t:
                assert e.get('callId') in calls and not calls[e['callId']].get('error'),'operation missing completion'
                tokens.append(t)
    assert active is None and begun==groups,'groups missing/reordered'

if __name__=='__main__':
    with zipfile.ZipFile(sys.argv[1]) as z:
        assert z.testzip() is None
        names=z.namelist();assert len(names)==len(set(names)) and any(n.endswith('.network') for n in names)
        events=[json.loads(l) for n in names if n.endswith('.trace') for l in z.read(n).splitlines() if l]
    inspect(events,sys.argv[2],json.loads(sys.argv[3]),json.loads(sys.argv[4]));print('VALID')
