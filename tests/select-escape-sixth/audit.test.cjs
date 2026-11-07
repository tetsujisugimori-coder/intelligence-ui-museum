'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{auditRow}=require('./audit.cjs');
const reference=()=>({head:'a'.repeat(40),tree:'b'.repeat(40),os:'linux',node:'test',sdk:'0.2.2',playwright:'1.56.1',viewport:{width:375,height:1000},theme:'light',rootPercent:100,id:'chromium-tab-1-B',engine:'chromium',route:'tab',i:1,condition:'B',images:['on.png','off.png','off2.png','on2.png'],status:'COMPLETE',checks:['environment','layout','Button','Badge','Alert','Switch'].map(name=>({name,pass:true})),errors:[],trace:{overflow:false,events:[
 {kind:'target-escape-start'}, {kind:'keydown',key:'Escape',trusted:true}, {kind:'preventDefault-before',key:'Escape',defaultPrevented:false,trusted:true,stack:'capture handler'}, {kind:'preventDefault-after',key:'Escape',trusted:true,defaultPrevented:true}, {kind:'mutation-callback',stack:'Museum observer'}, {kind:'focus-call',stack:'Museum MutationObserver'}, {kind:'focus-return',active:{role:'button'}}, {kind:'keydown-settled',key:'Escape',trusted:true,defaultPrevented:true}, {kind:'keyup',key:'Escape',trusted:true}, {kind:'keyup-settled',key:'Escape',trusted:true}, {kind:'target-escape-complete'}].map((e,i)=>({...e,seq:i+1,ms:i}))},paint:{images:['on.png','off.png','off2.png','on2.png'],changed:200,unstable:0,active:true,visible:true,clipping:[],pass:true},productOutline:'PASS'});
test('normal measured observation accepted',()=>assert.deepEqual(auditRow(reference()),{diagnosticOK:true,productOK:true,reasons:[]}));
test('known measured outline failure is diagnostic evidence, not product pass',()=>{const r=reference();Object.assign(r.paint,{changed:0,visible:false,pass:false});r.productOutline='FAIL';const a=auditRow(r);assert(a.diagnosticOK);assert(!a.productOK);});
const mutations={
 'BODY focus loss':r=>r.paint.active=false,
 'outline missing':r=>{r.paint.changed=0;r.paint.pass=false;},
 'clipped outline':r=>r.paint.clipping.push('clip'),
 'pageerror':r=>r.errors.push('injected'),
 'missing keyup':r=>r.trace.events=r.trace.events.filter(e=>e.kind!=='keyup'),
 'missing focus stack':r=>r.trace.events=r.trace.events.filter(e=>e.kind!=='focus-call'),
 'time reversal':r=>r.trace.events[4].ms=-1,
 'sequence duplication':r=>r.trace.events[4].seq=4,
 'untrusted Escape':r=>r.trace.events.find(e=>e.kind==='keydown').trusted=false,
 'missing cancellation':r=>r.trace.events=r.trace.events.filter(e=>!e.kind.startsWith('preventDefault')),
 'prelude false':r=>r.checks[2].pass=false,
 'prelude absent':r=>r.checks.splice(2,1),
 'prelude duplicate':r=>r.checks.push({...r.checks[2]}),
 'trace absent':r=>delete r.trace,
 'trace overflow':r=>r.trace.overflow=true,
 'cancel events swapped':r=>{const e=r.trace.events;[e[2],e[3]]=[e[3],e[2]];e.forEach((x,i)=>{x.seq=i+1;x.ms=i;});},
 'cancel state impossible':r=>r.trace.events[2].defaultPrevented=true,
 'missing focus return':r=>r.trace.events=r.trace.events.filter(e=>e.kind!=='focus-return'),
 'missing mutation callback':r=>r.trace.events=r.trace.events.filter(e=>e.kind!=='mutation-callback'),
 'settled contradiction':r=>r.trace.events.find(e=>e.kind==='keydown-settled').defaultPrevented=false,
 'paint path not registered':r=>r.images=[],
 'unknown condition':r=>r.condition='X',
 'duplicate boundary':r=>r.trace.events.push({...r.trace.events[0],seq:r.trace.events.length+1,ms:99}),
 'missing PNG':r=>r.paint.images.pop(),
 'duplicate PNG':r=>r.paint.images[3]=r.paint.images[0],
 'unstable paint':r=>r.paint.unstable=1,
 'incomplete claimed complete':r=>r.error='timeout',
 'fake product PASS':r=>{r.paint.pass=false;r.paint.visible=false;r.paint.changed=0;},
};
for(const [name,mutate]of Object.entries(mutations))test('reject '+name,()=>{const r=reference();mutate(r);assert.equal(auditRow(r).productOK,false);});
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{auditDirectory}=require('./audit.cjs');
const {PNG}=require('../../tools/stage-a-browser/node_modules/playwright-core/lib/utilsBundle.js'),{measure}=require('../../apps/v10/scripts/stage2r-focus-pixels.cjs');
function artifact(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sixth-audit-')),row=reference();const on=new PNG({width:40,height:40}),off=new PNG({width:40,height:40});for(let i=0;i<on.data.length;i+=4){on.data[i]=255;on.data[i+3]=255;off.data[i+3]=255;}const images=[on,off,off,on],rect={x:24,y:24,width:8,height:8};Object.assign(row.paint,measure(images,{x:0,y:0},[rect]),{rect});row.paint.images.forEach((f,i)=>fs.writeFileSync(path.join(dir,f),PNG.sync.write(images[i])));const other=structuredClone(row);other.condition='A';other.id='chromium-tab-1-A';other.trace.events.splice(4,0,{kind:'preventDefault-before',key:'Escape',defaultPrevented:true,trusted:true,stack:'second'},{kind:'preventDefault-after',key:'Escape',defaultPrevented:true,trusted:true});other.trace.events.forEach((e,i)=>{e.seq=i+1;e.ms=i;});const result={plan:{engines:['chromium'],routes:['tab'],repeats:1,conditions:['A','B']},os:'linux',node:'test',source:Object.fromEntries(['src/main.tsx','src/main.css','src/select-focus-return.ts','package.json','package-lock.json'].map(f=>[f,'c'.repeat(64)])),head:'a'.repeat(40),tree:'b'.repeat(40),expected:2,failures:[],rows:[row,other]};const save=()=>{fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(result));for(const item of result.rows)fs.writeFileSync(path.join(dir,item.id+'.json'),JSON.stringify(item));const files=fs.readdirSync(dir).filter(f=>f!=='SHA256SUMS.json');fs.writeFileSync(path.join(dir,'SHA256SUMS.json'),JSON.stringify(Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,f))).digest('hex')]))));};save();return {dir,row,result,save};}
test('complete PNG artifact positive',()=>{const {dir}=artifact();assert(auditDirectory(dir).diagnosticOK);});
test('modified original PNG rejected',()=>{const {dir}=artifact();fs.appendFileSync(path.join(dir,'on.png'),'tamper');assert(!auditDirectory(dir).diagnosticOK);});
test('missing PNG with self-consistent manifest rejected',()=>{const a=artifact();a.row.paint.images=['fake1.png','fake2.png','fake3.png','fake4.png'];a.row.images=[];a.save();assert(!auditDirectory(a.dir).diagnosticOK);});
test('falsified pixel count with updated JSON hashes rejected',()=>{const a=artifact();a.row.paint.changed=999;a.save();assert(!auditDirectory(a.dir).diagnosticOK);});
test('wrong expected HEAD rejected',()=>{const a=artifact();assert(!auditDirectory(a.dir,{head:'c'.repeat(40)}).diagnosticOK);});
test('wrong expected tree rejected',()=>{const a=artifact();assert(!auditDirectory(a.dir,{tree:'c'.repeat(40)}).diagnosticOK);});

test('missing A trial even with reduced claimed count rejected',()=>{const a=artifact();a.result.rows.pop();a.result.expected=1;a.save();assert(!auditDirectory(a.dir).diagnosticOK);});
test('wrong source key set rejected',()=>{const a=artifact();delete a.result.source['package.json'];a.result.source['fake.json']='c'.repeat(64);a.save();assert(!auditDirectory(a.dir).diagnosticOK);});
test('self-consistent smaller plan rejected against requested plan',()=>{const a=artifact();assert(!auditDirectory(a.dir,{plan:{...a.result.plan,repeats:5}}).diagnosticOK);});
