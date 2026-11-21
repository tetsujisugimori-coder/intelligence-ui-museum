(function (global) {
'use strict';

const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const stepNames = {a1:'A1（北・収集）',a2:'A2（北・収束）',b1:'B1（南・案内）'};
const branches = {a1:'branch-a',a2:'branch-a',b1:'branch-b'};
const scopeNames = {
  workflow:'共有：workflow',
  'branch-a':'ローカル：branch A（北）',
  'branch-b':'ローカル：branch B（南）',
  'step-a1':'ローカル：step A1',
  'step-a2':'ローカル：step A2',
  'step-b1':'ローカル：step B1',
};
const inputs = {name:'route',value:'',lookup:'nearest','explicit-scope':'workflow'};
function initial() {
  return {step:'a1',inputs:{...inputs},variables:{
    workflow:{route:'総合受付'},'branch-a':{route:'北展示室'},'branch-b':{},
    'step-a1':{route:'資料棚'},'step-a2':{},'step-b1':{},
  },result:null,history:[]};
}
function record(state, action, result) {
  return {...state,result,history:[...state.history,
    {seq:state.history.length+1,action,step:state.step,...result}]};
}
const chain = step => ['step-'+step,branches[step],'workflow'];
const validName = name => typeof name==='string' && /^[A-Za-z][A-Za-z0-9_]{0,23}(?![\s\S])/u.test(name);
const validValue = value => typeof value==='string' && [...value].length<=80;
function reduce(state, event) {
  const {type,key,value}=event;
  if(type==='reset') return initial();
  if(type==='input') {
    if(!own(inputs,key) || typeof value!=='string') throw new Error('Invalid scope input');
    return value===state.inputs[key]?state:{...state,inputs:{...state.inputs,[key]:value},result:null};
  }
  if(type==='move') {
    if(!own(stepNames,value)) return record(state,type,{status:'invalid',reason:'unknown-step'});
    if(value===state.step) return state;
    return record({...state,step:value},type,{status:'moved',from:state.step});
  }
  if(type!=='resolve'&&type!=='save') throw new Error('Unknown scope action');
  const {name,lookup,'explicit-scope':target,value:proposed}=state.inputs;
  const explicit=type==='save'?target:lookup;
  const finish = (status, extra) => record(state,type,{status,name,target:explicit,...extra});
  if(!validName(name)) return finish('invalid',{reason:'invalid-name'});
  const scopes=chain(state.step), nearest=type==='resolve'&&explicit==='nearest';
  if(!nearest&&!own(scopeNames,explicit)) return finish('invalid',{reason:'unknown-scope'});
  if(!nearest&&!scopes.includes(explicit)) return finish('out-of-scope',{reason:'inaccessible-scope'});
  if(type==='resolve') {
    const source=(nearest?scopes:[explicit]).find(scope=>own(state.variables[scope],name));
    return source?finish('found',{source,value:state.variables[source][name],reason:nearest?'nearest':'explicit'}):
      finish('missing',{reason:nearest?'not-found':'absent-in-target'});
  }
  if(!validValue(proposed)) return finish('invalid',{reason:'invalid-value'});
  const previous=state.variables[explicit], reason=own(previous,name)?'updated':'defined';
  return record({...state,variables:{...state.variables,[explicit]:{...previous,[name]:proposed}}},type,
    {status:'saved',name,target:explicit,source:explicit,value:proposed,reason});
}
const options=(values)=>Object.entries(values).map(([key,label])=>`<option value="${key}">${label}</option>`).join('');
const stepButtons=Object.entries(stepNames).map(([key,label])=>`<button type="button" data-w14-key="step-${key}" aria-pressed="false">${label}</button>`).join('');
function wave14ScopeDemo() {
  return `<section class="wave14" data-wave14="165">
<p>架空の青波交流館の案内手順です。同じ名前でも、共有・枝・手順のどこに定義したかで、読める値が変わります。</p>
<p data-w14-location></p>
<div class="w14-actions" aria-label="現在の実行位置">${stepButtons}</div>
<label>変数名（半角英字で始まる1〜24文字）<input type="text" data-w14-key="name" autocapitalize="none" spellcheck="false"></label>
<label>参照方法<select data-w14-key="lookup">${options({nearest:'最寄り（step→branch→workflow）',...scopeNames})}</select></label>
<div class="w14-actions"><button type="button" data-w14-key="resolve">Inspect（参照）</button></div>
<label>定義・更新先<select data-w14-key="explicit-scope">${options(scopeNames)}</select></label>
<label>値（文字列、最大80文字。空文字可）<input type="text" data-w14-key="value"></label>
<div class="w14-actions"><button type="button" data-w14-key="save">Define / Update（定義・更新）</button><button type="button" data-w14-key="reset">Reset（初期状態に戻す）</button></div>
<p role="status" data-w14-status style="overflow-wrap:anywhere"></p>
<h4>表示できる変数</h4><ul data-w14-variables style="overflow-wrap:anywhere"></ul>
<h4>操作履歴（実行順）</h4><p data-w14-nohistory></p><ol data-w14-history style="overflow-wrap:anywhere"></ol>
</section>`;
}
const quote = value => JSON.stringify(value);
function describe(result) {
  if(!result) return '未評価。入力を変えると旧結果は失効します。';
  const label=own(scopeNames,result.source)?scopeNames[result.source]:'';
  switch(result.reason) {
    case 'nearest':return `参照成功：${result.name} = ${quote(result.value)}。最寄りは ${label}。`;
    case 'explicit':return `参照成功：${result.name} = ${quote(result.value)}。明示先は ${label}。`;
    case 'defined':case 'updated':return `${result.reason==='defined'?'定義':'更新'}：${label} の ${result.name} = ${quote(result.value)}。`;
    case 'not-found':return '見つかりません。現在の手順・枝・共有のどこにもありません。';
    case 'absent-in-target':return '明示先に不存在。ほかの範囲は検索しません。';
    case 'inaccessible-scope':return '拒否：明示先が範囲外。ほかの範囲に切り替えません。';
    case 'invalid-name':return '拒否：名前は半角英字開始、英数字・アンダースコアの1〜24文字です。';
    case 'invalid-value':return '拒否：値は最大80文字の文字列です。';
    case 'unknown-scope':return '拒否：未定義の範囲です。';
    case 'unknown-step':return '拒否：未定義の実行位置です。';
    default:return '移動しました。';
  }
}
function wave14ScopeInit(root) {
  const hosts=Array.from(root.querySelectorAll('[data-wave14="165"]'));
  if(root.matches?.('[data-wave14="165"]')) hosts.unshift(root);
  for(const host of hosts) {
    if(host.wave14) continue;
    let state=initial();
    const input=key=>host.querySelector(`[data-w14-key="${key}"]`);
    const slot=key=>host.querySelector(`[data-w14-${key}]`);
    const row=(list,text)=>{
      const item=host.ownerDocument.createElement('li');
      item.textContent=text;
      list.append(item);
    };
    function draw() {
      for(const [key,value] of Object.entries(state.inputs)) if(input(key).value!==value) input(key).value=value;
      for(const step of Object.keys(stepNames)) input('step-'+step).setAttribute('aria-pressed',String(step===state.step));
      slot('location').textContent='現在の実行位置：'+stepNames[state.step];
      const status=slot('status');
      status.textContent=describe(state.result);
      status.dataset.state=state.result?.status??'unresolved';
      const variables=slot('variables');
      variables.replaceChildren();
      for(const scope of chain(state.step)) {
        const entries=Object.entries(state.variables[scope]);
        row(variables,scopeNames[scope]+'：'+(entries.length?entries.map(([name,value])=>name+' = '+quote(value)).join('、'):'定義なし'));
      }
      const history=slot('history');
      history.replaceChildren();
      slot('nohistory').textContent=state.history.length?'':'履歴なし';
      for(const entry of state.history) row(history,`${stepNames[entry.step]}：${entry.action==='move'&&entry.status==='moved'?'移動（前：'+stepNames[entry.from]+'）':describe(entry)}`);
    }
    function apply(event) {
      const next=reduce(state,event);
      if(next!==state) {state=next;draw();}
    }
    function edit(event) {
      const {w14Key:key}=event.target.dataset;
      if(own(inputs,key)) apply({type:'input',key,value:event.target.value});
    }
    host.addEventListener('input',edit);
    host.addEventListener('change',edit);
    host.addEventListener('click',event=>{
      const key=event.target.closest('button[data-w14-key]')?.dataset.w14Key;
      if(!key) return;
      if(key.startsWith('step-')) apply({type:'move',value:key.slice(5)});
      else if(['save','resolve','reset'].includes(key)) apply({type:key});
      if(key==='reset') input('name').focus();
    });
    host.wave14={getState:()=>JSON.parse(JSON.stringify(state))};
    draw();
  }
}
if(typeof module!=='undefined'&&module.exports) module.exports={initial,reduce};
Object.assign(global,{wave14ScopeDemo,wave14ScopeInit});
})(typeof window==='undefined'?globalThis:window);
