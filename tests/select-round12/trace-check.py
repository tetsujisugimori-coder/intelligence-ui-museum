import json,sys,zipfile
sys.dont_write_bytecode=True
from pathlib import Path
# Vetted visible expressions from pilot A-1; exact expression, arguments and ordering.
EXPRESSIONS=json.loads(Path(__file__).with_name("trace-expressions.json").read_text())

import importlib.util
_spec=importlib.util.spec_from_file_location('trace_signature',Path(__file__).with_name('trace-signature.py'))
_sig=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_sig)
CALLS=json.loads(Path(__file__).with_name('trace-calls.json').read_text())
def inspect(events,title,condition,tab_count,expected_clip=None):
 assert any(e.get('type')=='context-options' and e.get('title')==title for e in events),'title'
 assert any(e.get('type')=='frame-snapshot' for e in events),'snapshots'
 after={e.get('callId'):e for e in events if e.get('type')=='after'}
 before=[e for e in events if e.get('type')=='before']
 assert len({e.get('callId') for e in before})==len(before),'duplicate before IDs'
 afters=[e for e in events if e.get('type')=='after']
 assert len({e.get('callId') for e in afters})==len(afters),'duplicate after IDs'
 assert set(after)=={e.get('callId') for e in before},'unmatched call IDs'
 previous=-1
 for e in before:
  end=after[e['callId']].get('endTime');start=e.get('startTime')
  assert isinstance(start,(int,float)) and isinstance(end,(int,float)) and end>=start,'call time'
  if e.get('method')=='continue':
   assert e.get('class')=='Route' and e.get('params')=={'isFallback':False},'route continuation'
   continue
  assert start>=previous,'overlapping/reordered sequential calls'
  previous=end
 assert [_sig.signature(e) for e in before if e.get('method')!='continue']==CALLS[condition],'complete call sequence'
 if expected_clip is not None:
  photos=[e.get('params',{}) for e in before if e.get('method')=='screenshot']
  assert len(photos)==5 and [p.get('clip') for p in photos[:4]]==[expected_clip]*4 and 'clip' not in photos[4],'screenshot clip binding'
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
 assert len(sys.argv)==6,'production trace check requires bound clip'
 inspect(es,sys.argv[2],sys.argv[3],int(sys.argv[4]),json.loads(sys.argv[5]));print('VALID')
