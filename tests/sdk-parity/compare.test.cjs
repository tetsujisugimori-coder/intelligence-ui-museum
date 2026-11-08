const {test}=require('node:test'),assert=require('node:assert/strict'),{compare}=require('./compare.cjs');const base=require('./test-pair.json');const clone=()=>JSON.parse(JSON.stringify(base));
test('positive restricted to common interventions',()=>{const p=compare(...clone());assert.equal(p.classification,'COMPARABLE_WITH_COMMON_INTERVENTIONS');assert.equal(p.unalteredSdkCausality,'UNKNOWN');});
for(const [name,fn,code]of [
 ['cancel forged',(a,b)=>b.result.events.find(e=>e.kind==='keydown-final').cancelled=true,'cancellation'],
 ['fallback',(a,b)=>b.result.events.push({kind:'radix-fallback',seq:999,time:99999}),'fallback'],
 ['missing return both',(a,b)=>{for(const x of [a,b])x.result.events=x.result.events.filter(e=>e.kind!=='museum-focus-return');},'event-count:museum-focus-return'],
 ['keys reverse',(a,b)=>{for(const x of [a,b])x.result.events.reverse();},'event-order'],
 ['source mismatch',(a,b)=>b.sourceHash='f'.repeat(64),'provenance:sourceHash'],
 ['build mismatch',(a,b)=>b.buildHash='e'.repeat(64),'provenance:buildHash'],
 ['incomplete forged',(a,b)=>{b.status='COMPLETE';b.error='failure';},'execution'],
 ['measurement',(a,b)=>b.measurement='none','callsite-not-observed'],
 ['popup remains',(a,b)=>b.result.popupPresent=true,'closed-value-focus'],
 ['value changed',(a,b)=>b.result.value='b','closed-value-focus'],
 ['CSS changed',(a,b)=>b.before.cssHash='different','DOM-CSS:cssHash'],
 ['condition changed',(a,b)=>b.condition='native','pair'],
 ['foreign owner',(a,b)=>a.result.events.find(e=>e.kind==='cancel-call').owner='radix','cancel-origin']
])test(name,()=>{const [a,b]=clone();fn(a,b);const r=compare(a,b);assert.equal(r.classification,'NOT_COMPARABLE');assert.ok(r.errors.some(e=>e.endsWith(code)),r.errors.join(','));});
test('paint/focus-visible are outcomes',()=>{const [a,b]=clone();b.result.focusVisible=false;b.pngSha256='0'.repeat(64);assert.equal(compare(a,b).classification,'COMPARABLE_WITH_COMMON_INTERVENTIONS');});
for(const [name,fn,code]of [
 ['both DOM evidence omitted',(a,b)=>{for(const r of [a,b]){delete r.before.triggerOuterHTML;delete r.before.cssHash;}},'DOM-CSS-evidence'],
 ['both close requests shifted',(a,b)=>{for(const r of [a,b]){const es=r.result.events,i=es.findIndex(e=>e.kind==='react-close-request'&&e.nextState===false),e=es.splice(i,1)[0];es.unshift(e);es.forEach((e,i)=>{e.seq=i+1;e.time=i;});}},'close-observer-order'],
 ['both commit observations missing',(a,b)=>{for(const r of [a,b])r.result.events=r.result.events.filter(e=>e.kind!=='react-layout-after-commit');},'react-layout-order'],
 ['source tags replaced',(a,b)=>{for(const r of [a,b])for(const e of r.result.events)if(e.source)e.source='forged';},'callsite-source'],
 ['cancel moved after keyup',(a,b)=>{const es=a.result.events,i=es.findIndex(e=>e.kind==='cancel-call'),e=es.splice(i,1)[0];es.push(e);es.forEach((e,i)=>{e.seq=i+1;e.time=i;});},'cancel-call-order'],
 ['before cancel contradicted',(a,b)=>a.result.events.find(e=>e.kind==='select-escape-before').cancelled=true,'cancel-before-contradiction'],
 ['runtime condition false',(a,b)=>b.result.runtimeCondition='native','runtime-config']
])test('audit regression: '+name,()=>{const [a,b]=clone();fn(a,b);const r=compare(a,b);assert.equal(r.classification,'NOT_COMPARABLE');assert.ok(r.errors.some(e=>e.endsWith(code)),r.errors.join(','));});
