"""Independent raw-trace negative controls; originals are read, never rewritten.

Use a completed C-1 trace from ROUND12_EVIDENCE (or the first argument).
The positive control is essential: failure to read/accept the baseline is not
counted as successful rejection of any mutation.
"""
import copy
import json
import os
from pathlib import Path
import runpy
import sys
import zipfile

inspect = runpy.run_path(str(Path(__file__).resolve().parents[1] / 'select-round12' / 'trace-check.py'))['inspect']
root = Path(sys.argv[1] if len(sys.argv) > 1 else os.environ.get('ROUND12_EVIDENCE', '.work/select-round12'))
with zipfile.ZipFile(root / 'C-1-trace.zip') as archive:
    original = [json.loads(line) for name in archive.namelist() if name.endswith('.trace')
                for line in archive.read(name).splitlines() if line]
title = next(e['title'] for e in original if e.get('type') == 'context-options')
expected_clip = json.loads((root / 'C-1.json').read_text())['paint']['clip']
inspect(original, title, 'C', 0, expected_clip)
print('ACCEPTED original C-1 positive control')


def omit_screenshots(events):
    return [e for e in events if not (e.get('type') == 'before' and e.get('method') == 'screenshot')]


def omit_goto(events):
    return [e for e in events if not (e.get('type') == 'before' and e.get('method') == 'goto')]


def operations_after_normalization(events):
    operations = [e for e in events if e.get('type') == 'before' and e.get('method') in ('check', 'uncheck')]
    assert len(operations) == 2
    remaining = [e for e in events if not (e.get('type') == 'before' and e.get('method') in ('check', 'uncheck'))]
    index = next(i for i, e in enumerate(remaining) if e.get('type') == 'before' and e.get('method') == 'click')
    remaining[index:index] = operations
    return remaining


def negative_duration(events):
    before = next(e for e in events if e.get('type') == 'before' and e.get('method') == 'check')
    after = next(e for e in events if e.get('type') == 'after' and e.get('callId') == before['callId'])
    after['endTime'] = before['startTime'] - 1
    return events


def wrong_clip(events):
    for event in events:
        if event.get('type') == 'before' and event.get('method') == 'screenshot' and 'clip' in event.get('params', {}):
            event['params']['clip'] = {'x': 0, 'y': 0, 'width': 1, 'height': 1}
    return events


missed = []
for label, mutate in [
    ('missing screenshot calls', omit_screenshots),
    ('missing goto call', omit_goto),
    ('Switch calls moved after normalization', operations_after_normalization),
    ('operation ends before it starts', negative_duration),
    ('screenshot clip differs from row evidence', wrong_clip),
]:
    bad = mutate(copy.deepcopy(original))
    try:
        inspect(bad, title, 'C', 0, expected_clip)
    except (AssertionError, ValueError, KeyError):
        print('REJECTED', label)
    else:
        missed.append(label)
        print('ACCEPTED BAD TRACE', label)
assert not missed, missed
