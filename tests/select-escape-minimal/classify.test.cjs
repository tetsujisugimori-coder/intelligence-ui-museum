'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{validateRow,comparePair}=require('./classify.cjs');
const events=(cancel)=>[
{kind:'keydown-capture',owner:null,from:null,to:null,trusted:true,target:null},
{kind:'select-handler',owner:null,from:null,to:null,trusted:null,target:null},
...(cancel?[{kind:'prevent-default',owner:'select',from:null,to:null,trusted:null,target:null}]:[]),
{kind:'close-request',owner:'select-controlled',from:null,to:null,trusted:null,target:null},
{kind:'close-commit',owner:'select-controlled',from:null,to:null,trusted:null,target:null},
{kind:'keydown-bubble',owner:null,from:null,to:null,trusted:null,target:null},
{kind:'mutation',owner:null,from:true,to:false,trusted:null,target:null},
{kind:'focusin',owner:null,from:null,to:null,trusted:null,target:'trigger'},
{kind:'focus-return',owner:'model-mutation',from:null,to:null,trusted:null,target:null},
{kind:'keyup',owner:null,from:null,to:null,trusted:true,target:null}
];
function row(yes){
  const c=yes?'controlled-cancel':'controlled-plain';
  return {case:c,engine:'chromium',route:'tab',iteration:1,status:'COMPLETE',errors:[],sourceSha256:'a'.repeat(64),pngSha256:'b'.repeat(64),snapshot:{case:c,config:{select:true,selectCancel:yes,hook:false,fallback:false},keydownTrusted:true,keydownCancelled:yes,preventCount:yes?1:0,open:false,expanded:'false',value:'a',closeOwner:'select-controlled',triggerFocused:true,focusReturns:1,closeRequests:1,focusVisible:true,events:events(yes)}};
}
const clone=x=>JSON.parse(JSON.stringify(x));
test('positive is strictly model-scoped',()=>{
 const x=comparePair(row(true),row(false));
 assert.equal(x.classification,'MODEL_COMPARABLE');
 assert.equal(x.scope,'MODEL_ONLY_NOT_SDK_CAUSAL');
});
for(const [name,mutate] of [
 ['no cancellation contrast',r=>{r.snapshot.keydownCancelled=true;r.snapshot.preventCount=1;}],
 ['fallback closure owner',r=>{r.snapshot.closeOwner='fallback-model';}],
 ['missing focus return',r=>{r.snapshot.focusReturns=0;}],
 ['changed event ordering',r=>{r.snapshot.events.reverse();}],
 ['false trusted input',r=>{r.snapshot.keydownTrusted=false;}],
 ['unverified trace',r=>{r.status='INCOMPLETE';}],
 ['reduced provenance',r=>{r.iteration=2;}]
]){
 test('negative: '+name,()=>{const b=clone(row(false));mutate(b);assert.equal(comparePair(row(true),b).classification,'NOT_COMPARABLE');});
}
test('render and focus-visible are measured outcomes, not comparability invariants',()=>{
 const a=row(true),b=row(false);
 b.pngSha256='c'.repeat(64);
 b.snapshot.focusVisible=false;
 const report=comparePair(a,b);
 assert.equal(report.classification,'MODEL_COMPARABLE');
 assert.equal(report.outcomes.focusVisibleDiff,true);
 assert.equal(report.outcomes.renderedPngDiff,true);
});
test('changed fixture control config invalidates causal comparison',()=>{
 const a=row(true),b=row(false);
 b.snapshot.config.fallback=true;
 assert.equal(comparePair(a,b).classification,'NOT_COMPARABLE');
});
test('row outside planned cases is invalid',()=>{const r=row(true);r.case='unknown';assert.notEqual(validateRow(r).length,0);});
