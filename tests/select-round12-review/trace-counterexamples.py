"""Independent hand-coded negative controls; exit nonzero if a bad trace is accepted."""
import copy, runpy, json
from pathlib import Path
inspect = runpy.run_path(str(Path(__file__).resolve().parents[1] / 'select-round12' / 'trace-check.py'))['inspect']
import os,sys,zipfile
root=Path(sys.argv[1] if len(sys.argv)>1 else os.environ.get('ROUND12_EVIDENCE','.work/select-round12'))
row=json.loads((root/'A-1.json').read_text());title=json.loads((root/'results.json').read_text())['plan']['id']+':A-1'
with zipfile.ZipFile(root/row['traceFile']) as z:
 base=[json.loads(line) for n in z.namelist() if n.endswith('.trace') for line in z.read(n).splitlines() if line]
inspect(base,title,'A',0,row['paint']['clip'])
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
 try: inspect(bad,title,'A',0,row['paint']['clip'])
 except (AssertionError,ValueError,KeyError): print('REJECTED',name)
 else: accepted.append(name); print('ACCEPTED BAD TRACE',name)
assert not accepted, accepted
