(function (scope) {
'use strict';
const docs = [
  { name:'受付案内', start:'2026-04-01', end:'2026-04-30' },
  { name:'展示案内', start:'2026-04-15', end:'2026-05-15' },
];
const answers = {
  R1:{ guide:'正面 受付', opens:'09:00' }, R2:{ guide:'正面 受付', opens:'09:00' },
  R3:{ guide:'  正面   受付  ', opens:'09:00' }, R4:{ guide:'正面 受付', opens:'10:00' },
  R5:{ guide:'正面 受付' },
};
const slices = {all:'全体', regular:'通常日', closed:'臨時休館日', night:'夜間'};
const cases = Array.from({length:20}, (_,i)=>({
  id:'T'+String(i+1).padStart(2,'0'), slice:i<18?'regular':'closed', pass:i<18,
}));
const labels = {
  before:'発効前', valid:'有効', expired:'期限切れ', exact:'完全一致', format:'表記差のみ',
  conflict:'内容の不一致', incomparable:'比較不能', invalid:'判定拒否', empty:'対象なし',
};
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
function validDate(value) {
  if (typeof value!=='string'||value.length!==10||!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y,m,d]=value.split('-').map(Number);
  const leap=y%4===0&&(y%100!==0||y%400===0);
  return y>=1&&m>=1&&m<=12&&d>=1&&d<=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][m-1];
}
const reject = reason => ({status:'invalid',reason,rows:[]});
function freshness(date, periods=docs) {
  if (!validDate(date)) return reject('基準日には YYYY-MM-DD の有効な暦日が必要です。');
  if (!Array.isArray(periods)||!periods.length) return reject('資料の有効期間がありません。');
  for(const p of periods) {
    if(!p||typeof p.name!=='string'||!validDate(p.start)||!validDate(p.end)||p.start>p.end)
      return reject('資料の有効期間が無効、または発効日と期限が逆転しています。');
  }
  return {status:'evaluated',reason:'両端を含む固定暦日で判定。',rows:periods.map(p=>{
    const status=date<p.start?'before':date>p.end?'expired':'valid';
    return {...p,status,reason:status==='before'?date+' は '+p.start+' より前。':
      status==='expired'?date+' は '+p.end+' より後。':date+' は発効日から期限までの範囲内。'};
  })};
}
function compare(ids) {
  if (!Array.isArray(ids)||ids.length<2||new Set(ids).size!==ids.length||
      !Array.from(ids).every(id=>typeof id==='string'&&own(answers,id)))
    return reject('異なる固定回答を二つ以上選んでください。');
  const rows=['guide','opens'].map(field=>{
    const values=ids.map(id=>answers[id][field]??null);
    const normalize=field==='guide'?x=>x.replace(/^ +| +$/g,'').replace(/ {2,}/g,' '):x=>x;
    const valid=x=>typeof x==='string'&&(field==='guide'?normalize(x).length>0:
      x.length===5&&/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(x));
    const status=!values.every(valid)?'incomparable':values.every(x=>x===values[0])?'exact':
      values.every(x=>normalize(x)===normalize(values[0]))?'format':'conflict';
    const reason={incomparable:'必須項目に欠落または無効値があります。',exact:'すべての生値が同じです。',
      format:'ASCII空白だけを調整すると同じです。',conflict:'許可する変換を適用しても値が異なります。'}[status];
    return {field,status,reason,values:ids.map((id,i)=>({id,value:values[i]}))};
  });
  return {status:rows.some(x=>x.status==='incomparable')?'incomparable':'compared',
    reason:'同じ質問・設定の回答間の比較です。正答の認定ではありません。',rows};
}
function inspect(slice) {
  if (typeof slice!=='string'||!own(slices,slice)) return reject('未定義の評価条件です。');
  const rows=cases.filter(x=>slice==='all'||x.slice===slice).map(x=>({...x}));
  const total=rows.length, passed=rows.filter(x=>x.pass).length;
  return {status:total?'evaluated':'empty',reason:'同じ採点基準 facility-rubric-v1。表示したケースのみを集計。',total,passed,percent:total?100*passed/total:null,rows};
}
const defaults = {160:{date:'2026-04-01',period:'normal'},161:{left:'R1',right:'R2'},162:{slice:'all'}};
function initial(id) {return {id,inputs:{...defaults[id]},result:null};}
function reduce(state,event) {
  const {id,inputs}=state;
  if(event.type==='reset') return initial(id);
  if(event.type==='input') {
    if(!own(inputs,event.key)) throw new Error('Unknown input');
    return inputs[event.key]===event.value?state:{id,inputs:{...inputs,[event.key]:event.value},result:null};
  }
  if(event.type!=='run') throw new Error('Unknown event');
  const result=id===160?(inputs.period==='reversed'?freshness(inputs.date,[{...docs[0],start:'2026-05-01'}]):
    inputs.period==='normal'?freshness(inputs.date):reject('未定義の資料例です。')):id===161?compare([inputs.left,inputs.right]):inspect(inputs.slice);
  return {...state,result};
}
const intro={
  160:'141「出典追跡」と異なり、同じ案内資料が基準日によって発効前・有効・期限切れに変わります。',
  161:'153「旧新版の比較」と異なり、質問「青波交流館は何時に開き、受付はどこですか？」と設定「来館者向け・日本語」は固定し、繰り返し回答のばらつきだけを比較します。',
  162:'150「採点基準の比較」と異なり、同じ採点基準のまま条件を切り替えます。全体が良くても臨時休館日に弱いことがあります。',
};
const select=(key,label,options)=>`<label>${label}<select data-w13-key="${key}">${Object.entries(options).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>`;
function wave13Demo(id) {
  const controls=id===160?`<label>基準日（YYYY-MM-DD）<input data-w13-key="date" type="text" maxlength="10"></label>${select('period','資料例',{normal:'通常の期間',reversed:'故障対照：期間逆転'})}`:
    id===161?select('left','回答A',Object.fromEntries(Object.keys(answers).map(k=>[k,k])))+select('right','回答B',Object.fromEntries(Object.keys(answers).map(k=>[k,k]))):select('slice','絞り込み',slices);
  return `<section class="wave13" data-wave13="${id}"><p>架空の青波交流館・固定データ</p><p>${intro[id]}</p>${controls}<div class="w13-actions"><button type="button" data-w13-key="run">判定 Run</button><button type="button" data-w13-key="reset">Reset</button></div><output data-w13-status aria-live="polite"></output><ul data-w13-rows></ul></section>`;
}
function wave13Init(root) {
  for(const host of root.querySelectorAll('[data-wave13]')) {
    if(host.dataset.initialized) continue;
    host.dataset.initialized='true';
    let state=initial(Number(host.dataset.wave13));
    const input=k=>host.querySelector(`[data-w13-key="${k}"]`);
    function draw() {
      for(const [k,v] of Object.entries(state.inputs)) if(input(k).value!==v) input(k).value=v;
      const r=state.result, status=host.querySelector('[data-w13-status]'), list=host.querySelector('[data-w13-rows]');
      list.replaceChildren();
      status.textContent=!r?'未判定。入力を変えると旧結果は失効します。':
        state.id===162&&r.status==='evaluated'?`${r.passed}/${r.total}件（${r.percent}%）。${r.reason}`:
        r.status==='empty'?'対象なし（0件）。'+r.reason:(labels[r.status]?labels[r.status]+'：':'')+r.reason;
      for(const row of r?.rows??[]) {
        const li=document.createElement('li');
        li.textContent=state.id===160?`${row.name}（${row.start}〜${row.end}）: ${labels[row.status]}。${row.reason}`:
          state.id===161?`${row.field==='guide'?'受付案内':'開館時刻'}: ${labels[row.status]}。${row.values.map(v=>v.id+'='+ (v.value===null?'欠落':JSON.stringify(v.value))).join(' / ')}。${row.reason}`:
          `${row.id} ${slices[row.slice]}：${row.pass?'合格':'不合格'}`;
        list.append(li);
      }
    }
    function edit(e) {const el=e.target,key=el.dataset.w13Key;if(!own(state.inputs,key))return;state=reduce(state,{type:'input',key,value:el.value});draw();}
    host.addEventListener('input',edit);
    host.addEventListener('change',edit);
    host.addEventListener('click',e=>{
      const key=e.target.closest('button[data-w13-key]')?.dataset.w13Key;
      if(!['run','reset'].includes(key))return;
      state=reduce(state,{type:key});draw();
      if(key==='reset') input(Object.keys(state.inputs)[0]).focus();
    });
    host.wave13={getState:()=>JSON.parse(JSON.stringify(state))};draw();
  }
}
if(typeof module!=='undefined'&&module.exports) module.exports={validDate,freshness,compare,inspect,initial,reduce};
Object.assign(scope,{wave13Demo,wave13Init});
})(typeof window==='undefined'?globalThis:window);
