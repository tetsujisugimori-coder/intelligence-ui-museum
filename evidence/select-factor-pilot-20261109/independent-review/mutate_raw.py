import pathlib,json,hashlib,shutil,subprocess,sys,zipfile
root=pathlib.Path(sys.argv[1]).resolve();repo=pathlib.Path(sys.argv[2]).resolve();dest=pathlib.Path(sys.argv[3]).resolve();dest.mkdir(exist_ok=True)
mutations=['missing_events','wrong_focus_type','contradictory_paint','missing_source','wrong_platform','missing_os','wrong_browser_type','missing_trace_focus','missing_trace_frame','missing_pointer_event','changed_png','missing_slot','wrong_paint_geometry']
results=[]
for name in mutations:
 p=dest/name;shutil.copytree(root,p);d=json.loads((p/'results.json').read_text());r=next(r for r in d['rows'] if r['status']=='COMPLETE' and r['history']=='pointer')
 if name=='missing_events':r.pop('events')
 elif name=='wrong_focus_type':r['acquisition']['focused']='yes'
 elif name=='contradictory_paint':r['paint']['pass']=not r['paint']['pass']
 elif name=='missing_source':d['sources'].pop(next(iter(d['sources'])))
 elif name=='wrong_platform':d['platform']='linux' if d['platform']=='win32' else 'win32'
 elif name=='missing_os':d.pop('os')
 elif name=='wrong_browser_type':r['browser']=123
 elif name.startswith('missing_trace_'):
  zpath=p/r['traceFile'];entries={}
  with zipfile.ZipFile(zpath) as z:
   entries={n:z.read(n) for n in z.namelist()}
  if name=='missing_trace_frame':
   target=None
   for n,b in entries.items():
    if n.endswith('.trace'):
     frame=next((json.loads(l) for l in b.splitlines() if json.loads(l).get('type')=='screencast-frame'),None)
     if frame:target='resources/'+frame['sha1'];break
   assert target in entries;del entries[target]
  else:
   for n,b in entries.copy().items():
    if n.endswith('.trace'):
     a=[json.loads(l) for l in b.splitlines()];ids={e.get('callId') for e in a if e.get('type')=='before' and e.get('method')=='focus'}
     entries[n]=b'\n'.join(json.dumps(e).encode() for e in a if e.get('callId') not in ids)+b'\n'
  with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED) as z:
   for n,b in entries.items():z.writestr(n,b)
 elif name=='missing_pointer_event':
  idx=next(i for i,e in enumerate(r['events']) if e['kind']=='pointerdown' and r['historyStart']<e['seq']<=r['historyEnd']);r['events'][idx]['kind']='mutation'
 elif name=='changed_png':shutil.copyfile(p/r['paint']['images'][1],p/r['paint']['images'][0])
 elif name=='missing_slot':d['rows'].pop()
 elif name=='wrong_paint_geometry':r['paint']['rect']['x']+=1
 # Rebind all raw rows and manifest to defeat superficial manifest/row-only rejection.
 for row in d['rows']:
  if row['status']=='COMPLETE':(p/(row['id']+'.json')).write_text(json.dumps(row))
 (p/'results.json').write_text(json.dumps(d));(p/'SHA256SUMS.json').write_text(json.dumps({f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in p.iterdir() if f.is_file() and f.name!='SHA256SUMS.json'}))
 proc=subprocess.run(['node','tests/select-factor-pilot/audit.cjs',str(p)],cwd=repo,text=True,capture_output=True)
 (dest/(name+'.stdout')).write_text(proc.stdout);(dest/(name+'.stderr')).write_text(proc.stderr)
 results.append({'mutation':name,'rejected':proc.returncode!=0,'exit':proc.returncode})
print(json.dumps(results,indent=2));(dest/'summary.json').write_text(json.dumps(results,indent=2))
