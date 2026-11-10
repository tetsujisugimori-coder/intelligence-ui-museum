"""Independent hand-coded negative controls; exit nonzero if a bad trace is accepted."""
import copy, runpy, json
from pathlib import Path
inspect = runpy.run_path(str(Path(__file__).resolve().parents[1] / 'select-round12' / 'trace-check.py'))['inspect']
# A has no Switch operation. Explicitly enumerate its ordinary pointer/focus/key sequence.
base = [{'type':'context-options','title':'independent:A'}, {'type':'frame-snapshot'}]
for i,(method,params) in enumerate([
 ('click', {'selector':'#Select h2'}),
 ('focus', {'selector':'#Select .stage [role=button]'}),
 ('keyboardPress', {'key':'Space'}),
 ('keyboardPress', {'key':'Escape'}),
]):
 base += [{'type':'before','callId':str(i),'method':method,'params':params}, {'type':'after','callId':str(i)}]
# A full raw expression sequence is a fixture, not an independent expectation.
# Negative action methods below remain independently enumerated.
for i, entry in enumerate(json.loads((Path(__file__).resolve().parents[1] / 'select-round12' / 'trace-expressions.json').read_text())):
 base += [{'type':'before','callId':'expr'+str(i),**entry}, {'type':'after','callId':'expr'+str(i)}]
inspect(base,'independent:A','A',0)
faults = {
 'extra DOM click': ('evaluateExpression', {'expression':'e => e.click()', 'selector':'#Switch input[type=checkbox] >> nth=0'}),
 'extra dispatch event': ('dispatchEvent', {'selector':'#Switch input[type=checkbox] >> nth=0','type':'click'}),
 'extra locator key': ('press', {'selector':'#Select .stage [role=button]','key':'Tab'}),
 'extra mouse click': ('mouseClick', {'x':10,'y':10}),
 'extra keyboard down': ('keyboardDown', {'key':'Tab'}),
}
accepted=[]
for name,(method,params) in faults.items():
 bad=copy.deepcopy(base)
 bad[2:2]=[{'type':'before','callId':'extra','method':method,'params':params},{'type':'after','callId':'extra'}]
 try: inspect(bad,'independent:A','A',0)
 except (AssertionError,ValueError,KeyError): print('REJECTED',name)
 else: accepted.append(name); print('ACCEPTED BAD TRACE',name)
assert not accepted, accepted
