import json,hashlib,re

def signature(e):
 m=e['method'];p=json.loads(json.dumps(e.get('params',{})))
 if m=='goto':
  assert re.fullmatch(r'http://127\.0\.0\.1:\d+/\?theme=light&text=100',p['url'])
  p['url']='http://127.0.0.1:PORT/?theme=light&text=100'
 if m=='screenshot' and 'clip' in p:
  assert all(isinstance(p['clip'].get(k),(int,float)) for k in ['x','y','width','height'])
  p['clip']='BOUND_BY_PIXEL_AUDITOR'
 for k in ['expression','source']:
  if k in p:p[k]='SHA256:'+hashlib.sha256(p[k].encode()).hexdigest()
 return {'method':m,'params':p,'title':e.get('title')}
