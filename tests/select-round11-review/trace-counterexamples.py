import runpy,copy,json
from pathlib import Path
check=runpy.run_path(str(Path(__file__).resolve().parents[1]/'select-round11'/'trace-check.py'))['inspect']
# Independent actions enumerated from frozen source; no checker expected()/token() reuse.
seq=[('click','#Button .stage button'),('focus','#Button .stage button'),('keyboardPress','Enter'),('keyboardPress','Space'),('focus','#Button .stage button'),('keyboardPress','Tab'),('keyboardPress','Shift+Tab'),('scroll','#Button .stage button'),('screenshot',''),('screenshot',''),('screenshot',''),('screenshot',''),('check','#Button input >> nth=0'),('noop','#Button .stage button'),('uncheck','#Button input >> nth=0'),('check','#Button input >> nth=1'),('noop','#Button .stage button'),('uncheck','#Button input >> nth=1')]
e=[{'type':'context-options','title':'independent'},{'type':'frame-snapshot'}]
def add(m,p,title=None):
 n=str(len(e));ev={'type':'before','method':m,'params':p,'callId':n}
 if title:ev['title']=title
 e.extend([ev,{'type':'after','callId':n}])
add('evaluateExpression',{'arg':{'value':{'s':'ROUND11_BEGIN:Button'}}})
for m,v in seq:
 if m=='keyboardPress':add(m,{'key':v})
 elif m=='scroll':add('waitForSelector',{'selector':v},'Scroll into view')
 elif m=='noop':add('waitForSelector',{'selector':v},'Evaluate')
 else:add(m,{'selector':v})
add('evaluateExpression',{'arg':{'value':{'s':'ROUND11_END:Button'}}})
check(e,'independent',['Button'],['Button'])
results={'positive':'PASS','negative':{}}
for label,mut in [
 ('missing click',lambda a:a.__delitem__(slice(4,6))),
 ('missing completion',lambda a:a.__delitem__(5)),
 ('wrong key',lambda a:a[8]['params'].update(key='Escape')),
 ('reordered keys',lambda a:(a[8]['params'].update(key='Space'),a[10]['params'].update(key='Enter'))),
 ('wrong target',lambda a:a[4]['params'].update(selector='#Switch [role=switch]')),
 ('force click',lambda a:a[4]['params'].update(force=True)),
 ('operation error',lambda a:a[5].update(error={'message':'failed'})),
 ('missing end',lambda a:a.__delitem__(slice(-2,None))),
 ('no-op without checked state',lambda a:a[28]['params'].update(selector='#bad')),
]:
 a=copy.deepcopy(e);mut(a)
 try:check(a,'independent',['Button'],['Button']);results['negative'][label]='ACCEPTED'
 except (AssertionError,KeyError):results['negative'][label]='REJECTED'
print(json.dumps(results,indent=2))
assert all(x=='REJECTED' for x in results['negative'].values())
