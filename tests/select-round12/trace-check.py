import json,sys,zipfile
from pathlib import Path
# Vetted visible expressions from pilot A-1; exact expression, arguments and ordering.
EXPRESSIONS=json.loads(Path(__file__).with_name("trace-expressions.json").read_text())

def inspect(events,title,condition,tab_count):
 assert any(e.get('type')=='context-options' and e.get('title')==title for e in events),'title'
 assert any(e.get('type')=='frame-snapshot' for e in events),'snapshots'
 after={e.get('callId'):e for e in events if e.get('type')=='after'}
 observed=[]
 expressions=[]
 allowed={"newPage","addInitScript","goto","continue","waitForSelector","evaluateExpression","waitForFunction","screenshot","isChecked","isDisabled","check","uncheck","click","focus","keyboardPress"}
 for e in events:
  if e.get('type')!='before':continue
  m=e.get('method');p=e.get('params',{});s=p.get('selector','')
  assert m in allowed, ('unexpected method',m)
  assert e.get('callId') in after and not after[e['callId']].get('error'),'incomplete call'
  if m in ('evaluateExpression','waitForFunction','addInitScript'):
   expressions.append({'method':m,'params':p})
  if m=='isChecked': assert s=='#Switch input[type=checkbox] >> nth=0','check observer target'
  if m=='isDisabled': assert s=='#Switch [role=switch]','disabled observer target'
  if m in ('check','uncheck','click','focus','keyboardPress'):
   assert not p.get('force'),'forced'
   assert e.get('callId') in after and not after[e['callId']].get('error'),'incomplete operation'
   observed.append((m,p.get('key') if m=='keyboardPress' else s))
 box='#Switch input[type=checkbox] >> nth=0'
 ops={'A':[],'B':['check'],'C':['check','uncheck'],'D':['check','uncheck'],'E':['check','uncheck','check'],'F':['check','uncheck'],'G':['check','uncheck']}[condition]
 expected=[(x,box) for x in ops]+[('click','#Select h2')]+([('keyboardPress','Tab')]*tab_count if condition=='F' else [('focus','#Select .stage [role=button]')])+[('keyboardPress','Space'),('keyboardPress','Escape')]
 assert observed==expected,(observed,expected)
 assert expressions==EXPRESSIONS,"unexpected/missing/reordered expression or arguments"
if __name__=='__main__':
 with zipfile.ZipFile(sys.argv[1]) as z:
  assert z.testzip() is None
  names=z.namelist();assert len(names)==len(set(names)) and any(n.endswith('.network') for n in names)
  es=[json.loads(l) for n in names if n.endswith('.trace') for l in z.read(n).splitlines() if l]
 inspect(es,sys.argv[2],sys.argv[3],int(sys.argv[4]));print('VALID')
