"""Round 13 trace validator: exact user-input history; no silent/forced actions.
This is NOT proof that a Playwright evaluate callback has no hidden effects.
"""
import json, sys, zipfile
sys.dont_write_bytecode = True

METHODS = {
    'newPage', 'addInitScript', 'goto', 'continue', 'waitForSelector',
    'evaluateExpression', 'waitForFunction', 'screenshot', 'isChecked',
    'isDisabled', 'check', 'uncheck', 'click', 'focus', 'keyboardPress'
}
HISTORIES = {'A': [], 'B': ['check'], 'D': ['check', 'uncheck']}
PHASE_KEYS = ['Space', 'Escape']
SWITCH = '#Switch input[type=checkbox] >> nth=0'
SELECT = '#Select .stage [role=button]'

def inspect(events, title, condition, observer, clip):
    assert condition in HISTORIES and observer in ('on', 'off'), 'registered identifiers'
    assert any(e.get('type') == 'context-options' and e.get('title') == title for e in events), 'trace title'
    assert any(e.get('type') == 'frame-snapshot' for e in events), 'frame snapshots'
    befores = [e for e in events if e.get('type') == 'before']
    afters = [e for e in events if e.get('type') == 'after']
    before_ids = [e.get('callId') for e in befores]
    after_ids = [e.get('callId') for e in afters]
    assert len(before_ids) == len(set(before_ids)), 'duplicate before calls'
    assert len(after_ids) == len(set(after_ids)), 'duplicate after calls'
    assert set(before_ids) == set(after_ids), 'unpaired calls'
    finished = {e['callId']: e for e in afters}
    last = -1
    actions = []
    screenshots = []
    count_observer = 0
    for e in befores:
        method = e.get('method')
        params = e.get('params', {})
        assert method in METHODS, ('unexpected action', method)
        complete = finished[e['callId']]
        assert not complete.get('error'), 'failed traced action'
        a, b = e.get('startTime'), complete.get('endTime')
        assert isinstance(a, (int, float)) and isinstance(b, (int, float)) and b >= a, 'call timing'
        if method == 'continue':
            assert e.get('class') == 'Route' and params == {'isFallback': False}, 'route'
            continue
        assert a >= last, 'overlap / reordered calls'
        last = b
        if method == 'addInitScript':
            count_observer += 1
        if method in ('check', 'uncheck', 'click', 'focus', 'keyboardPress'):
            assert not params.get('force'), 'forced action'
            actions.append((method, params.get('key') if method == 'keyboardPress' else params.get('selector', '')))
        if method == 'screenshot':
            screenshots.append(params)
    assert count_observer == (1 if observer == 'on' else 0), 'observer installation'
    expected = [(op, SWITCH) for op in HISTORIES[condition]] + [
        ('click', '#Select h2'), ('focus', SELECT),
        ('keyboardPress', 'Space'), ('keyboardPress', 'Escape')
    ]
    assert actions == expected, ('operation history', actions, expected)
    assert len(screenshots) == 5, 'PNG trace count'
    assert [x.get('clip') for x in screenshots[:4]] == [clip] * 4, 'clip binding'
    assert 'clip' not in screenshots[4], 'final overview screenshot'
    return True

def run(filepath, title, condition, observer, clip):
    with zipfile.ZipFile(filepath) as z:
        assert z.testzip() is None, 'trace zip corruption'
        names = z.namelist()
        assert len(names) == len(set(names)), 'duplicate entries'
        assert any(n.endswith('.network') for n in names), 'missing network HAR'
        assert any(n.endswith('.stacks') for n in names), 'missing stacks'
        events = [json.loads(line) for name in names if name.endswith('.trace')
                  for line in z.read(name).splitlines() if line]
    assert events, 'no trace events'
    return inspect(events, title, condition, observer, clip)

if __name__ == '__main__':
    assert len(sys.argv) == 6, 'usage: file title condition observer jsonClip'
    assert run(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], json.loads(sys.argv[5]))
    print('VALID')
