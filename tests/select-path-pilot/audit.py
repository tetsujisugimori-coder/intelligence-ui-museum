"""Re-read raw file bindings and trace actions, never infer physical interaction."""
import sys,json,hashlib,zipfile,pathlib,subprocess
root=pathlib.Path(sys.argv[1]).resolve(); errors=[]
def check(c,m):
 if not c: errors.append(m)
data=json.loads((root/'results.json').read_text()); manifest=json.loads((root/'SHA256SUMS.json').read_text())
for f,h in manifest.items():
 p=(root/f).resolve();check(p.is_relative_to(root) and p.is_file(),f+' absent/path')
 if p.is_file(): check(hashlib.sha256(p.read_bytes()).hexdigest()==h,f+' sha')
check(set(manifest)=={str(p.relative_to(root)).replace('\\','/') for p in root.rglob('*') if p.is_file() and p.name!='SHA256SUMS.json'},'manifest exact set')
trace_summary=[]
for row in data['rows']:
 path=root/(row['id']+'.json');check(path.is_file(),row['id']+' missing')
 if path.is_file():check(json.loads(path.read_text())==row,row['id']+' row binding')
 for key in ['preImage','finalImage','traceFile']:
  f=row.get(key);check(bool(f) and f in manifest,row['id']+' '+key)
 for f in row.get('images',[]):check(f in manifest,row['id']+' image '+f)
 t=root/row.get('traceFile','absent.zip')
 if t.is_file():
  with zipfile.ZipFile(t) as z:
   check(z.testzip() is None,row['id']+' trace CRC');check(len(z.namelist())==len(set(z.namelist())),row['id']+' duplicate entries')
   entries=[]
   for n in z.namelist():
    if n.endswith('.trace'):
     entries += [json.loads(line) for line in z.read(n).splitlines() if line.strip()]
   before=[e for e in entries if e.get('type')=='before']
   after={e.get('callId'):e for e in entries if e.get('type')=='after'}
   presses=[e.get('params',{}).get('key') for e in before if e.get('method')=='press' and e.get('class')=='Keyboard']
   requested=[o['argument'] for o in row.get('operations',[]) if o['name']=='key']
   check(presses==requested,row['id']+' trace keyboard mismatch')
   anchors=[i for i,e in enumerate(before) if 'window.s3Opener=e' in e.get('params',{}).get('expression','')]
   check(len(anchors)==1,row['id']+' acquisition trace anchor')
   action_summary=[]
   if len(anchors)==1:
    actions=[e for e in before[anchors[0]+1:] if e.get('method') in ['focus','click'] or (e.get('class')=='Keyboard' and e.get('method')=='press') or (e.get('class')=='Mouse' and e.get('method')=='move')]
    for e in actions:
     check(e.get('callId') in after and not after[e['callId']].get('error'),row['id']+' trace unsuccessful action')
     p=e.get('params',{});m=e['method'];action_summary.append([m,p.get('key') if m=='press' else [p.get('x'),p.get('y')] if m=='move' else p.get('selector')])
     check(not p.get('force',False),row['id']+' forced action')
    # Acquisition sequence is distinct from the opening sequence; use trace order.
    n=next((i for i,a in enumerate(action_summary) if a[0]=='press' and a[1] in ['Space','ArrowDown']),len(action_summary))
    aq=action_summary[:n];post=action_summary[n:];museum='museum' in row['cohort']
    target='#Select .stage [role=button]' if museum else '[data-parity-trigger]'
    expected_aq=[['focus',target]] if row['route']=='direct' else [['focus',target],['press','Tab'],['press','Shift+Tab']] if row['route']=='legacy' else [['focus','#before'],['press','Tab']] if not museum else [['press','Shift+Tab']]*(len(aq)-1)+[['press','Tab']]
    check(aq==expected_aq and bool(aq),row['id']+' trace acquisition order')
    if row['cohort']=='A-museum-old':
     check(len(post)==8 and post[0]==['press','Space'] and post[1][0]=='click' and 'option' in str(post[1][1]) and 'カード' in str(post[1][1]) and post[2]==['move',[0,0]] and post[3:]==[['press',k] for k in ['Space','ArrowUp','Enter','Space','Escape']],row['id']+' trace old input sequence')
    else:check(post==[['press','ArrowDown'],['press','Escape']],row['id']+' trace short input sequence')
   frames=[e for e in entries if e.get('type')=='screencast-frame']
   check(bool(frames),row['id']+' no screencast')
   for frame in frames:check('resources/'+frame['sha1'] in z.namelist(),row['id']+' missing frame')
   trace_summary.append({'id':row['id'],'keys':presses,'actions':action_summary,'screencastFrames':len(frames),'frameTiming':'sampled; exact pre/post-open frame is not guaranteed'})
# Independent subprocess invokes strict classification against original plan, not saved PASS labels.
js="const fs=require('fs'),c=require('./tests/select-path-pilot/contract.cjs');const d=JSON.parse(fs.readFileSync(process.argv[1]));const e=c.validateRun(d);for(const r of d.rows){if(JSON.stringify(c.classify(r))!==JSON.stringify(r.classification))e.push(r.id+':saved-classification');const p=r.paint;if(p){try{const path=require('path'),{PNG}=require('./tools/stage-a-browser/node_modules/playwright-core/lib/utilsBundle.js'),m=require('./apps/v10/scripts/stage2r-focus-pixels.cjs').measure;const z=m(p.images.map(f=>PNG.sync.read(fs.readFileSync(path.join(path.dirname(process.argv[1]),f)))),p.clip,[{x:p.rect.x,y:p.rect.y,width:p.rect.width,height:p.rect.height}]);for(const k of ['changed','unstable','indicators','threshold','reason'])if(JSON.stringify(z[k])!==JSON.stringify(p[k]))e.push(r.id+':paint-recompute-'+k);if((p.active&&p.visible&&!p.clipping.length&&z.pass)!==p.pass)e.push(r.id+':paint-pass');}catch(x){e.push(r.id+':paint-decode:'+x)}}}console.log(JSON.stringify(e));process.exitCode=e.length?1:0"
p=subprocess.run(['node','-e',js,str(root/'results.json')],text=True,capture_output=True)
check(p.returncode==0,'contract:'+p.stdout+p.stderr)
print(json.dumps({'status':'PASS' if not errors else 'FAIL','rows':len(data['rows']),'errors':errors,'traces':trace_summary},ensure_ascii=False,indent=2))
sys.exit(1 if errors else 0)
