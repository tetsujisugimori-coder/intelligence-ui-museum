import json,pathlib,sys
import numpy as np
from PIL import Image
p=pathlib.Path(sys.argv[1]);d=json.loads((p/'results.json').read_text());out=[]
for r in d['rows']:
 if r['status']!='COMPLETE':continue
 q=r['paint'];a,b,c,e=[np.asarray(Image.open(p/n).convert('RGB')).astype(np.int16) for n in q['images']]
 unstable=(np.max(abs(a-e),axis=2)>8)|(np.max(abs(b-c),axis=2)>8)
 changed=(~unstable)&(np.max(abs(a-b),axis=2)>=24)&(np.max(abs(e-c),axis=2)>=24)
 ys,xs=np.where(changed);xs=xs+q['clip']['x'];ys=ys+q['clip']['y'];v=q['rect'];mask=(xs>=v['x']-24)&(xs<=v['x']+v['width']+24)&(ys>=v['y']-24)&(ys<=v['y']+v['height']+24);xx=xs[mask];yy=ys[mask]
 observed={'changed':int(changed.sum()),'unstable':int(unstable.sum()),'pixels':len(xx),'spanX':int(xx.max()-xx.min()+1) if len(xx) else 0,'spanY':int(yy.max()-yy.min()+1) if len(yy) else 0}
 expect={k:q[k] if k in q else q['indicators'][0][k] for k in observed}
 out.append({'id':r['id'],'same':observed==expect,'observed':observed,'expected':expect})
print(json.dumps({'allMatched':all(x['same'] for x in out),'rows':out},indent=2));sys.exit(0 if all(x['same'] for x in out) else 1)
