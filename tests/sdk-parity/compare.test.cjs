const {test}=require('node:test'),assert=require('node:assert/strict'),{compare}=require('./compare.cjs');const base=require('./test-pair.json');const clone=()=>JSON.parse(JSON.stringify(base));
for(const [name,value] of [['undefined',undefined],['null',null],['string','true'],['number',1],['object',{}],['array',[]]])test('reject focus-visible '+name+' on either or both rows',()=>{
 for(const sides of [[0],[1],[0,1]]){const p=clone();for(const i of sides)p[i].result.focusVisible=value;const r=compare(...p);assert.equal(r.classification,'NOT_COMPARABLE');assert.ok(r.errors.some(e=>e.endsWith('focus-visible-observation')));}
});
test('reject missing or inherited focus-visible',()=>{
 for(const inherited of [false,true]){const p=clone();for(const r of p){delete r.result.focusVisible;if(inherited)Object.setPrototypeOf(r.result,{focusVisible:true});}assert.equal(compare(...p).classification,'NOT_COMPARABLE');}
});
test('all boolean pairs and PNG/pixel differences remain outcomes',()=>{
 for(const a of [true,false])for(const b of [true,false]){const p=clone();p[0].result.focusVisible=a;p[1].result.focusVisible=b;p[1].pngSha256='0'.repeat(64);p[1].pixels.outlineEstimate=0;assert.equal(compare(...p).classification,'COMPARABLE_WITH_COMMON_INTERVENTIONS');}
});
test('unrelated stack formatting does not change the route',()=>{
 const p=clone();for(const e of p[0].result.events)if(Object.hasOwn(e,'stack'))e.stack='Error\n    at renamed (https://another-host/bundle.js:999:7)';assert.equal(compare(...p).classification,'COMPARABLE_WITH_COMMON_INTERVENTIONS');
});
test('even matching alternate close-owner routes reject',()=>{
 const p=clone();for(const r of p){const es=r.result.events,i=es.findIndex(e=>e.kind==='react-close-request'&&e.nextState===false);es.splice(i,0,{...es[i],kind:'radix-on-open-change'});es.forEach((e,i)=>{e.seq=i+1;e.time=i;});}
 const r=compare(...p);assert.equal(r.classification,'NOT_COMPARABLE');assert.ok(r.errors.some(e=>e.endsWith('close-owner-route')));
});
test('duplicate commit observation is not the same close path',()=>{
 const p=clone();for(const r of p){const es=r.result.events,ci=es.findIndex(e=>e.kind==='react-close-request'&&e.nextState===false),i=es.findIndex((e,j)=>j>ci&&e.kind==='react-layout-after-commit'&&e.open===false);es.splice(i,0,{...es[i]});es.forEach((e,i)=>{e.seq=i+1;e.time=i;});}
 const r=compare(...p);assert.equal(r.classification,'NOT_COMPARABLE');assert.ok(r.errors.some(e=>e.endsWith('close-commit-count')));
});
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
for(const [name,mutate,code]of [
 ['missing image hash',(a,b)=>{delete a.pngSha256;delete b.pngSha256;},'PNG-evidence'],
 ['missing actual focusin',(a,b)=>{for(const r of [a,b])r.result.events=r.result.events.filter(e=>e.kind!=='focusin');},'focus-return-target-order'],
 ['wrong actual focus target',(a,b)=>{for(const r of [a,b]){const es=r.result.events,i=es.findIndex(e=>e.kind==='museum-focus-return');es.slice(i+1).filter(e=>e.kind==='focusin').forEach(e=>e.target='different-target');}},'focus-return-target-order']
])test('evidence boundary: '+name,()=>{const p=clone();mutate(...p);const r=compare(...p);assert.equal(r.classification,'NOT_COMPARABLE');assert.ok(r.errors.some(e=>e.endsWith(code)));});
for(const [name,mutate,code]of [
 ['reopen after focus',(r)=>{const es=r.result.events,ci=es.findIndex(e=>e.kind==='react-close-request'&&e.nextState===false),li=es.findIndex((e,i)=>i>ci&&e.kind==='react-layout-after-commit'),ki=es.findIndex(e=>e.kind==='keyup');es.splice(ki,0,{...es[ci],nextState:true},{...es[li],open:true});},'reopen-after-close'],
 ['keyup wrong active element',r=>r.result.events.find(e=>e.kind==='keyup').active='different','final-focus-observation'],
 ['last DOM contradictory',r=>r.result.events.filter(e=>e.kind==='observer-dom').at(-1).expanded='true','final-DOM-observation'],
 ['focus moved away again',r=>{const es=r.result.events,i=es.findIndex(e=>e.kind==='keyup');es.splice(i,0,{kind:'focusin',target:'different'});},'final-focus-observation']
])test('independent review boundary: '+name,()=>{const p=clone();for(const r of p){mutate(r);r.result.events.forEach((e,i)=>{e.seq=i+1;e.time=i;});}const r=compare(...p);assert.equal(r.classification,'NOT_COMPARABLE');assert.ok(r.errors.some(e=>e.endsWith(code)));});
test('duplicate unchanged MutationObserver notification is harmless',()=>{const p=clone();for(const r of p){const es=r.result.events,i=es.findLastIndex(e=>e.kind==='museum-observer');es.splice(i,0,{...es[i]});es.forEach((e,i)=>{e.seq=i+1;e.time=i;});}assert.equal(compare(...p).classification,'COMPARABLE_WITH_COMMON_INTERVENTIONS');});
