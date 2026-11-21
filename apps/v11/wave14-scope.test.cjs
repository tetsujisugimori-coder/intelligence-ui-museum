const {test} = require('node:test');
const assert = require('node:assert/strict');
const {initial,reduce} = require('./wave14-scope.js');

const edit=(s,key,value)=>reduce(s,{type:'input',key,value});
const move=(s,value)=>reduce(s,{type:'move',value});
const act=(s,type)=>reduce(s,{type});
const variableSnapshot={
  workflow:{route:'総合受付'},'branch-a':{route:'北展示室'},'branch-b':{},
  'step-a1':{route:'資料棚'},'step-a2':{},'step-b1':{},
};
test('nearest is lexical and falls through only visible scopes',()=>{
  let s=initial();
  for(const [step,value,source] of [['a1','資料棚','step-a1'],['a2','北展示室','branch-a'],['b1','総合受付','workflow']]) {
    s=act(move(s,step),'resolve');
    assert.deepEqual(s.result,{status:'found',name:'route',target:'nearest',source,value,reason:'nearest'});
  }
  assert.deepEqual(s.history.map(({seq,action,step})=>[seq,action,step]),[
    [1,'resolve','a1'],[2,'move','a2'],[3,'resolve','a2'],[4,'move','b1'],[5,'resolve','b1'],
  ]);
});
test('explicit visibility and existing definitions are separate from nearest',()=>{
  let s=act(edit(initial(),'lookup','workflow'),'resolve');
  assert.deepEqual(s.result,{status:'found',name:'route',target:'workflow',source:'workflow',value:'総合受付',reason:'explicit'});
  s=act(edit(s,'lookup','branch-b'),'resolve');
  assert.deepEqual(s.result,{status:'out-of-scope',name:'route',target:'branch-b',reason:'inaccessible-scope'});
  s=act(edit(move(s,'a2'),'lookup','step-a2'),'resolve');
  assert.deepEqual(s.result,{status:'missing',name:'route',target:'step-a2',reason:'absent-in-target'});
  s=act(edit(s,'lookup','step-a1'),'resolve');
  assert.equal(s.result.status,'out-of-scope');
  s=act(edit(edit(s,'lookup','nearest'),'name','noSuchName'),'resolve');
  assert.deepEqual(s.result,{status:'missing',name:'noSuchName',target:'nearest',reason:'not-found'});
  assert.deepEqual(s.variables,variableSnapshot);
});
test('visible save updates a branch only, and an empty step value shadows it',()=>{
  let s=initial();
  s=act(edit(edit(s,'explicit-scope','branch-a'),'value','北展示室・変更'),'save');
  assert.deepEqual(s.result,{status:'saved',name:'route',target:'branch-a',source:'branch-a',value:'北展示室・変更',reason:'updated'});
  assert.deepEqual(s.variables,{...variableSnapshot,'branch-a':{route:'北展示室・変更'}});
  s=act(move(s,'a2'),'resolve');
  assert.equal(s.result.value,'北展示室・変更');
  s=act(edit(edit(s,'explicit-scope','step-a2'),'value',''),'save');
  assert.deepEqual(s.result,{status:'saved',name:'route',target:'step-a2',source:'step-a2',value:'',reason:'defined'});
  s=act(s,'resolve');
  assert.equal(s.result.value,'');
  assert.equal(s.result.source,'step-a2');
  s=act(move(s,'b1'),'resolve');
  assert.equal(s.result.value,'総合受付');
  assert.equal(s.result.source,'workflow');
});
test('hidden save and invalid names/values never mutate a scope',()=>{
  let s=act(edit(edit(initial(),'explicit-scope','step-b1'),'value','無効'),'save');
  assert.deepEqual(s.result,{status:'out-of-scope',name:'route',target:'step-b1',reason:'inaccessible-scope'});
  assert.deepEqual(s.variables,variableSnapshot);
  s=edit(s,'explicit-scope','workflow');
  for(const name of ['','_name','7name','日本語','has space','name\n','N'.repeat(25)]) {
    s=act(edit(s,'name',name),'save');
    assert.equal(s.result.status,'invalid');
    assert.equal(s.result.reason,'invalid-name');
    assert.deepEqual(s.variables,variableSnapshot);
  }
  s=act(edit(edit(s,'name','valid_1'),'value','あ'.repeat(81)),'save');
  assert.equal(s.result.reason,'invalid-value');
  assert.deepEqual(s.variables,variableSnapshot);
});
test('exact input boundaries, empty values and inherited keys',()=>{
  let s=act(edit(initial(),'name','constructor'),'resolve');
  assert.equal(s.result.status,'missing');
  for(const [name,value] of [['A',''],['A'+'x'.repeat(23),'あ'.repeat(80)],['constructor','値']]) {
    s=act(edit(edit(s,'name',name),'value',value),'save');
    assert.equal(s.result.status,'saved');
    assert.equal(s.variables.workflow[name],value);
    assert.equal(act(s,'resolve').result.value,value);
  }
});
test('only changed input invalidates; history stable; literal Reset restoration',()=>{
  let s=act(initial(),'resolve');
  assert.strictEqual(edit(s,'lookup','nearest'),s);
  for(const [key,value] of [['lookup','workflow'],['name','newName'],['value','変更'],['explicit-scope','branch-a']]) {
    const changed=edit(s,key,value);
    assert.equal(changed.result,null);
    assert.deepEqual(changed.history,[{seq:1,action:'resolve',step:'a1',status:'found',name:'route',target:'nearest',source:'step-a1',value:'資料棚',reason:'nearest'}]);
  }
  s=act(edit(s,'value','変更'),'save');
  s=move(s,'b1');
  assert.deepEqual(act(s,'reset'),{step:'a1',
    inputs:{name:'route',value:'',lookup:'nearest','explicit-scope':'workflow'},
    variables:variableSnapshot,result:null,history:[]});
});
