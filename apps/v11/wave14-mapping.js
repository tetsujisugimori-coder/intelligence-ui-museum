(function (scope) {
'use strict';

const FIXTURE = Object.freeze({
  title:'来館予約', count:0, open:false, tags:Object.freeze([]),
  info:Object.freeze({room:'青波'}), blank:'', nil:null,
});
const SOURCES = Object.freeze({
  title:'string', count:'number', open:'boolean', tags:'array', info:'object',
  blank:'string', nil:'null', absent:'undefined',
});
const TARGETS = Object.freeze({
  label:'string', visitors:'number', available:'boolean', labels:'array', metadata:'object',
});
const REQUIRED = ['label','visitors','available'];
const DEFAULTS = [
  ['title','label'], ['count','visitors'], ['open','available'], ['tags','labels'], ['info','metadata'],
];
const LIMIT = 8;
const own = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
const plain = value => value !== null && typeof value === 'object' &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

function valueType(value) {
  return value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
}

// Validate mapped payloads without JSON coercion (which could silently drop values or change NaN to null).
function isData(value, ancestors = new Set()) {
  const type = valueType(value);
  if (type === 'null' || type === 'string' || type === 'boolean') return true;
  if (type === 'number') return Number.isFinite(value);
  if (!(type === 'array' || (type === 'object' && plain(value))) || ancestors.has(value)) return false;
  ancestors.add(value);
  let valid = true;
  const keys = Reflect.ownKeys(value);
  if (type === 'array' && keys.length !== value.length + 1) valid = false;
  for (const key of keys) {
    if (type === 'array' && key === 'length') continue;
    const item = Object.getOwnPropertyDescriptor(value,key);
    if (typeof key !== 'string' || !item.enumerable || !own(item,'value') ||
        (type === 'array' && (!/^(0|[1-9][0-9]*)$/.test(key) || +key >= value.length)) ||
        !isData(item.value,ancestors)) {
      valid = false;
      break;
    }
  }
  ancestors.delete(value);
  return valid;
}

const invalid = (reason, details = {}) => ({status:'invalid',reason,output:null,...details});
function preview(mappings, source = FIXTURE) {
  if (!plain(source)) return invalid('INVALID_SOURCE');
  if (!Array.isArray(mappings) || mappings.length > LIMIT) return invalid('INVALID_MAPPINGS');
  const byTarget = new Map();
  for (const [index,row] of mappings.entries()) {
    if (!plain(row)) return invalid('INVALID_MAPPINGS',{index});
    const name = Object.getOwnPropertyDescriptor(row,'source')?.value;
    const target = Object.getOwnPropertyDescriptor(row,'target')?.value;
    if (typeof name !== 'string' || typeof target !== 'string') return invalid('INVALID_MAPPINGS',{index});
    if (name !== '' && !own(SOURCES,name)) return invalid('UNKNOWN_SOURCE',{index,source:name,target});
    if (target !== '' && !own(TARGETS,target)) return invalid('UNKNOWN_TARGET',{index,source:name,target});
    if (name === '' || target === '') continue;
    if (byTarget.has(target)) return invalid('DUPLICATE_TARGET',{index,source:name,target});
    byTarget.set(target,{name,index});
  }
  for (const target of REQUIRED) {
    if (!byTarget.has(target)) return invalid('REQUIRED_UNMAPPED',{target});
  }
  const output = {};
  for (const [target,expected] of Object.entries(TARGETS)) {
    if (!byTarget.has(target)) continue;
    const {name,index} = byTarget.get(target);
    const detail = {index,source:name,target,expected};
    const property = Object.getOwnPropertyDescriptor(source,name);
    if (property && !own(property,'value')) return invalid('INVALID_VALUE',detail);
    const value = property?.value;
    const actual = valueType(value);
    if (actual === 'null') return invalid('NULL_VALUE',{...detail,actual});
    if (actual === 'undefined') return invalid('UNDEFINED_VALUE',{...detail,actual});
    if (actual !== expected) return invalid('TYPE_MISMATCH',{...detail,actual});
    if (!isData(value)) return invalid('INVALID_VALUE',{...detail,actual});
    output[target] = structuredClone(value);
  }
  return {status:'valid',output};
}

function initial() {
  return {mappings:DEFAULTS.map(([source,target])=>({source,target})),result:null};
}
function reduce(state,event) {
  if (event.type === 'reset') return initial();
  const {mappings} = state;
  if (event.type === 'preview') return {...state,result:preview(mappings)};
  if (event.type === 'add') {
    if (mappings.length === LIMIT) return state;
    return {mappings:[...mappings,{source:'',target:''}],result:null};
  }
  if (event.type === 'remove') {
    if (!Number.isInteger(event.index) || event.index < 0 || event.index >= mappings.length) return state;
    return {mappings:mappings.filter((_,i)=>i!==event.index),result:null};
  }
  if (event.type === 'input') {
    const [,side,i] = /^(source|target)-(0|[1-9][0-9]*)$/.exec(event.key) || [];
    const index = Number(i);
    if (side === undefined || index >= mappings.length || typeof event.value !== 'string') return state;
    if (mappings[index][side] === event.value) return state;
    return {
      mappings:mappings.map((row,n)=>n===index ? {...row,[side]:event.value} : row),
      result:null,
    };
  }
  throw new Error('Unknown mapping event');
}

function display(value) {
  if (value === undefined) return '未定義（undefined・入力プロパティなし）';
  if (value === null) return 'null（明示値）';
  if (value === '') return '""（空文字）';
  if (Array.isArray(value) && value.length === 0) return '[]（空配列）';
  return JSON.stringify(value);
}
function message(result) {
  if (!result) return '未評価。接続を編集すると以前の出力を消します。';
  if (result.status === 'valid') return 'プレビュー成功。値を型変換せず出力しました。';
  const target = result.target ?? '接続';
  switch (result.reason) {
    case 'DUPLICATE_TARGET': return '判定拒否：同じ出力先「'+target+'」への二重接続です。';
    case 'REQUIRED_UNMAPPED': return '判定拒否：必須の出力先「'+target+'」が未接続です。';
    case 'UNKNOWN_SOURCE': return '判定拒否：未知の入力名です。';
    case 'UNKNOWN_TARGET': return '判定拒否：未知の出力名です。';
    case 'NULL_VALUE': return '判定拒否：出力先「'+target+'」は null（明示値）を受け付けません。';
    case 'UNDEFINED_VALUE': return '判定拒否：出力先「'+target+'」に指定した入力は未定義（undefined・プロパティなし）です。';
    case 'TYPE_MISMATCH': return '判定拒否：出力先「'+target+'」には '+result.expected+' が必要です。入力は '+result.actual+' でした。';
    default: return '判定拒否：接続または入力値の構造が無効です。';
  }
}
const requiredText = key => REQUIRED.includes(key) ? '必須' : '任意';
function wave14MappingDemo() {
  const sourceList = Object.entries(SOURCES).map(([key,type])=>
    '<li><code>'+key+'</code>（'+type+'）：<span>'+display(own(FIXTURE,key) ? FIXTURE[key] : undefined)+'</span></li>').join('');
  const targetList = Object.entries(TARGETS).map(([key,type])=>
    '<li><code>'+key+'</code>（'+type+'・'+requiredText(key)+'）</li>').join('');
  return `<section class="wave14 w14-mapping" data-wave14="163">
    <p>架空の青波交流館・固定データ。入力項目を出力項目につなぎ、名前と型を点検します。</p>
    <div class="w14-schemas"><div><h4>入力の型と値</h4><ul>${sourceList}</ul></div>
    <div><h4>出力スキーマ</h4><ul>${targetList}</ul></div></div>
    <h4>接続を編集</h4><p>未接続の任意出力は省略します。0、false、空文字、空配列はそのまま残します。</p>
    <div data-w14-mapping-rows></div>
    <div class="w14-actions">
      <button type="button" data-w14-key="add">接続を追加</button>
      <button type="button" data-w14-key="preview">出力をプレビュー</button>
      <button type="button" data-w14-key="reset">Reset</button>
    </div>
    <output data-w14-status="idle" aria-live="polite"></output>
    <h4>プレビュー出力</h4><ul data-w14-output></ul>
  </section>`;
}
const options = (fields,output) =>
  '<option value="">未接続</option>'+Object.entries(fields).map(([key,type])=>
    '<option value="'+key+'">'+key+'（'+type+(output ? '・'+requiredText(key) : '')+'）</option>').join('');
function wave14MappingInit(root) {
  for (const host of root.querySelectorAll('[data-wave14="163"]')) {
    if (host.dataset.initialized) continue;
    host.dataset.initialized = 'true';
    let state = initial();
    const rows = host.querySelector('[data-w14-mapping-rows]');
    const output = host.querySelector('[data-w14-output]');
    const status = host.querySelector('[data-w14-status]');
    const control = key => host.querySelector('[data-w14-key="'+key+'"]');
    function drawRows() {
      rows.innerHTML = state.mappings.map((_,i)=>`<fieldset class="w14-mapping-row">
        <legend>接続 ${i+1}</legend>
        <label>接続${i+1}の入力<select data-w14-key="source-${i}">${options(SOURCES)}</select></label>
        <label>接続${i+1}の出力<select data-w14-key="target-${i}">${options(TARGETS,true)}</select></label>
        <button type="button" data-w14-key="remove-${i}" aria-label="接続${i+1}を削除">削除</button>
      </fieldset>`).join('');
      state.mappings.forEach((row,i)=>{
        control('source-'+i).value = row.source;
        control('target-'+i).value = row.target;
      });
      control('add').disabled = state.mappings.length >= LIMIT;
    }
    function drawResult() {
      const r = state.result, text = message(r);
      status.dataset.w14Status = r?.status ?? 'idle';
      status.dataset.w14Reason = r?.reason ?? '';
      if (status.textContent !== text) status.textContent = text;
      output.replaceChildren();
      for (const [key,value] of Object.entries(r?.output ?? {})) {
        const row = host.ownerDocument.createElement('li');
        row.dataset.w14OutputKey = key;
        row.textContent = key+'（'+TARGETS[key]+'）：'+display(value);
        output.append(row);
      }
    }
    host.addEventListener('change',event=>{
      const selected = event.target.closest('select[data-w14-key]');
      if (!selected || !rows.contains(selected)) return;
      const next = reduce(state,{type:'input',key:selected.dataset.w14Key,value:selected.value});
      if (next !== state) { state=next; drawResult(); }
    });
    host.addEventListener('click',event=>{
      const key = event.target.closest('button[data-w14-key]')?.dataset.w14Key;
      if (key === 'preview') {
        state = reduce(state,{type:'preview'});
        drawResult();
      } else if (key === 'reset' || key === 'add' || /^remove-[0-9]+$/.test(key ?? '')) {
        const index = key.startsWith('remove-') ? Number(key.slice(7)) : -1;
        const next = reduce(state,{type:index < 0 ? key : 'remove',index});
        if (next === state) return;
        state = next;
        drawRows(); drawResult();
        const at = key==='reset' ? 0 : key==='add' ? state.mappings.length-1 : Math.min(index,state.mappings.length-1);
        (control('source-'+at) ?? control('add')).focus();
      }
    });
    host.wave14 = {getState:()=>structuredClone(state)};
    drawRows(); drawResult();
  }
}
if (typeof module !== 'undefined' && module.exports) module.exports = {initial,reduce,preview};
Object.assign(scope,{wave14MappingDemo,wave14MappingInit});
})(typeof window === 'undefined' ? globalThis : window);
