import json,sys,hashlib,zipfile
from pathlib import Path
from PIL import Image
root=Path(sys.argv[1]);reports=[]
for p in sorted(root.glob('*.json')):
 if p.name in ['results.json','SHA256SUMS.json']:continue
 r=json.load(open(p));paint=r.get('paint')
 if not paint or len(paint.get('images',[]))!=4:continue
 ims=[Image.open(root/x).convert('RGB') for x in paint['images']]
 assert len({i.size for i in ims})==1
 px=[i.load() for i in ims];w,h=ims[0].size;points=[];unstable=0
 for y in range(h):
  for x in range(w):
   ds=lambda a,b:max(abs(px[a][x,y][c]-px[b][x,y][c]) for c in range(3))
   if ds(0,3)>8 or ds(1,2)>8:unstable+=1
   elif ds(0,1)>=24 and ds(3,2)>=24:points.append((x+paint['clip']['x'],y+paint['clip']['y']))
 rect=paint['rect'];pts=[(x,y) for x,y in points if rect['x']-24<=x<=rect['x']+rect['width']+24 and rect['y']-24<=y<=rect['y']+rect['height']+24]
 assert len(points)==paint['changed'] and unstable==paint['unstable'],p.name
 assert len(pts)==paint['indicators'][0]['pixels'],p.name
 reports.append({'id':r['id'],'head':r.get('head'),'classification':r['classification']['outline'],'changed':len(points),'unstable':unstable,'focus':r['final']['focused'],'hasFocus':r['final'].get('hasFocus')})
print(json.dumps({'count':len(reports),'independentPixelEquality':True,'rows':reports},indent=2))
