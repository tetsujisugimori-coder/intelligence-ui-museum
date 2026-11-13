/* Independent educational simulations. No SDK, authentication, network or eval. */
(function (scope) {
'use strict';
const clone = x => JSON.parse(JSON.stringify(x));
const escape = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sample = [
 {name:'青いノート',region:'東',kind:'文具',amount:120},
 {name:'赤いペン',region:'西',kind:'文具',amount:80},
 {name:'星の本',region:'東',kind:'書籍',amount:300},
 {name:'森の本',region:'西',kind:'書籍',amount:200},
 {name:'白いノート',region:'東',kind:'文具',amount:null}
];
function initialQuery(){return {op:'AND',groups:[{op:'AND',conditions:[{field:'region',op:'eq',value:'東'}]}]};}
function validateQuery(query){
 const errors=[];
 if(!query || !['AND','OR'].includes(query.op) || !Array.isArray(query.groups) || !query.groups.length || query.groups.length>4)return ['グループは1〜4個、全体演算はAND/ORです'];
 query.groups.forEach((g,i)=>{
  if(!['AND','OR'].includes(g.op)||!Array.isArray(g.conditions)||!g.conditions.length||g.conditions.length>6){errors.push(`グループ${i+1}は条件1〜6個です`);return;}
  g.conditions.forEach((c,j)=>{
   if(!['name','region','kind','amount'].includes(c.field)||!['eq','contains','gte'].includes(c.op)||typeof c.value!=='string'||!c.value.trim())errors.push(`グループ${i+1} 条件${j+1}：値・項目・演算を確認してください`);
   else if(c.field==='amount' && (c.op==='contains'||!Number.isFinite(Number(c.value))))errors.push(`グループ${i+1} 条件${j+1}：金額は有限数と一致/以上で指定してください`);
   else if(c.field!=='amount'&&c.op==='gte')errors.push(`グループ${i+1} 条件${j+1}：「以上」は金額専用です`);
  });
 });return errors;
}
function queryRows(query,rows=sample){
 const errors=validateQuery(query);if(errors.length)return {errors,rows:[]};
 const combine=(op,list)=>op==='AND'?list.every(Boolean):list.some(Boolean);
 return {errors:[],rows:rows.filter(row=>combine(query.op,query.groups.map(g=>combine(g.op,g.conditions.map(c=>{
  const v=row[c.field];if(v===null||v===undefined)return false;
  if(c.field==='amount')return c.op==='eq'?v===Number(c.value):v>=Number(c.value);
  return c.op==='eq'?String(v)===c.value:String(v).includes(c.value);
 })))))};
}
const roles=['閲覧者','編集者','管理者'], permissions=['read','edit','delete'], labels={read:'閲覧',edit:'編集',delete:'削除'};
function initialPermissions(){return [[true,false,false],[true,true,false],[true,true,true]];}
function effectivePermissions(row){return {read:!!row[0],edit:!!row[0]&&!!row[1],delete:!!row[0]&&!!row[2],conflicts:row[0]?[]:permissions.filter((p,i)=>i>0&&row[i])};}
function pivot(rows,rowAxis,colAxis,measure){
 if(!['region','kind'].includes(rowAxis)||!['region','kind'].includes(colAxis)||rowAxis===colAxis||!['count','sum','average'].includes(measure))throw new Error('行と列は異なる軸、集計は件数/合計/平均で指定してください');
 const rowKeys=[...new Set(rows.map(x=>x[rowAxis]))].sort(), colKeys=[...new Set(rows.map(x=>x[colAxis]))].sort();
 const aggregate=items=>{const values=items.map(x=>x.amount).filter(x=>typeof x==='number'&&Number.isFinite(x));return {value:measure==='count'?items.length:values.length?(measure==='sum'?values.reduce((a,b)=>a+b,0):values.reduce((a,b)=>a+b,0)/values.length):null,count:items.length,numericCount:values.length};};
 return {rowKeys,colKeys,cells:rowKeys.map(r=>colKeys.map(c=>aggregate(rows.filter(x=>x[rowAxis]===r&&x[colAxis]===c)))),rowTotals:rowKeys.map(r=>aggregate(rows.filter(x=>x[rowAxis]===r))),colTotals:colKeys.map(c=>aggregate(rows.filter(x=>x[colAxis]===c))),total:aggregate(rows)};
}
const options=(values,current)=>values.map(([v,t])=>`<option value="${v}"${v===current?' selected':''}>${t}</option>`).join('');
const select=(label,attr,values,current)=>`<label>${label}<select ${attr}>${options(values,current)}</select></label>`;
const tableData=rows=>`<div class="w1-scroll" tabindex="0" role="region" aria-label="サンプルデータ。横にスクロールできます"><table><caption>固定・架空データ ${rows.length}件</caption><thead><tr><th scope="col">名称</th><th scope="col">地域</th><th scope="col">種類</th><th scope="col">金額</th></tr></thead><tbody>${rows.map(x=>`<tr><th scope="row">${escape(x.name)}</th><td>${escape(x.region)}</td><td>${escape(x.kind)}</td><td>${x.amount===null?'未入力':escape(x.amount)}</td></tr>`).join('')}</tbody></table></div>`;
function wave1Demo(id){
 const descriptions={124:'検索条件を組み立てる教材です。条件を追加・編集・削除し、グループ内と全体のAND（すべて）/OR（いずれか）を切り替えます。最大2階層、4グループ、各6条件。各条件を比較して真偽値を組み合わせ、文字列のプログラム実行はしません。',125:'役割ごとの権限を設計する教材です。表の許可/拒否を切り替え、対象役割の設定と有効権限を比較します。継承なし。閲覧が拒否なら編集・削除は設定が許可でも無効です。実際の認証・認可には接続しません。',126:'集計軸を変えて固定データを分析する教材です。行・列は異なる軸を選択し、件数・合計・平均を比較します。件数は欠損を含む全行、合計/平均は有限の数値のみ。総計の平均は元データから計算し、セル平均の平均ではありません。'};
 if(!descriptions[id])return '';
 return `<section class="wave1" data-wave1="${id}"><p>${descriptions[id]}</p><p>Tabで移動し、選択欄は矢印キー、ボタンはEnter/Spaceで操作できます。表は横スクロール領域です。フィルターによる再描画とResetは状態を初期化します。</p><div data-w1-controls></div><p data-w1-before></p><output data-w1-state aria-live="polite"></output><div data-w1-results></div><button type="button" data-w1-reset>Reset</button><details><summary>仕組みと制約</summary><p>${descriptions[id]} 外部通信・保存はありません。状態はこの展示の表示中だけ保持します。実機の読み上げ・タッチの検証は別途必要です。</p></details></section>`;
}
function wave1Init(root){
 const hosts=root.matches?.('[data-wave1]')?[root]:[...root.querySelectorAll('[data-wave1]')];
 for(const host of hosts){if(host.dataset.initialized)continue;host.dataset.initialized='true';const id=+host.dataset.wave1,$=s=>host.querySelector(s),controls=$('[data-w1-controls]'),state=$('[data-w1-state]'),results=$('[data-w1-results]'),before=$('[data-w1-before]');
 if(id===124){let query=initialQuery();const snapshot=()=>JSON.stringify(query);let previous='初期状態';
 const update=()=>{const result=queryRows(query);before.textContent=`変更前：${previous}`;state.textContent=`現在の条件：${snapshot()} / ${result.errors.length?'入力エラー：'+result.errors.join('、'):`一致 ${result.rows.length}件`}`;results.innerHTML=result.errors.length?'<p>条件が不正なため検索を停止しています。</p>':tableData(result.rows);host.querySelectorAll('[data-q-value]').forEach(x=>x.setAttribute('aria-invalid',String(result.errors.length>0)));};
 const draw=()=>{controls.innerHTML=select('全体の演算','data-q-root',[['AND','AND すべて'],['OR','OR いずれか']],query.op)+query.groups.map((g,i)=>`<fieldset data-q-group="${i}"><legend>グループ ${i+1}</legend>${select('グループ演算',`data-q-group-op="${i}"`,[['AND','AND すべて'],['OR','OR いずれか']],g.op)}${g.conditions.map((c,j)=>`<div class="w1-condition" data-q-condition="${j}">${select('項目',`data-q-field="${i},${j}"`,[['name','名称'],['region','地域'],['kind','種類'],['amount','金額']],c.field)}${select('比較',`data-q-op="${i},${j}"`,[['eq','一致'],['contains','含む'],['gte','以上']],c.op)}<label>値<input data-q-value="${i},${j}" value="${escape(c.value)}" maxlength="80"></label><button type="button" data-q-delete="${i},${j}"${g.conditions.length===1?' disabled':''}>条件${j+1}を削除</button></div>`).join('')}<button type="button" data-q-add="${i}"${g.conditions.length>=6?' disabled':''}>条件を追加</button><button type="button" data-q-delete-group="${i}"${query.groups.length===1?' disabled':''}>グループを削除</button></fieldset>`).join('')+`<button type="button" data-q-add-group${query.groups.length>=4?' disabled':''}>グループを追加</button>`;update();};
 host.addEventListener('input',e=>{const t=e.target;if(!t.matches('[data-q-value]'))return;previous=snapshot();const [i,j]=t.dataset.qValue.split(',').map(Number);query.groups[i].conditions[j].value=t.value;update();});
 host.addEventListener('change',e=>{
  const t=e.target;let target,key;
  if(t.matches('[data-q-root]')){target=query;key='op';}
  else if(t.matches('[data-q-group-op]')){target=query.groups[+t.dataset.qGroupOp];key='op';}
  else for(const [attr,field] of [['qField','field'],['qOp','op']])if(t.dataset[attr]!==undefined){const [i,j]=t.dataset[attr].split(',').map(Number);target=query.groups[i].conditions[j];key=field;}
  // A no-op change is not a state transition and must not overwrite the
  // preceding transition or reflow its before-state description.
  if(!target||target[key]===t.value)return;
  previous=snapshot();target[key]=t.value;update();
 });
 host.addEventListener('click',e=>{const t=e.target;if(!t.matches('[data-q-add],[data-q-delete],[data-q-add-group],[data-q-delete-group],[data-w1-reset]'))return;previous=snapshot();let changed=true;if(t.matches('[data-q-add]'))query.groups[+t.dataset.qAdd].conditions.push({field:'kind',op:'eq',value:'文具'});else if(t.matches('[data-q-delete]')){const [i,j]=t.dataset.qDelete.split(',').map(Number);query.groups[i].conditions.splice(j,1);}else if(t.matches('[data-q-add-group]'))query.groups.push({op:'AND',conditions:[{field:'kind',op:'eq',value:'書籍'}]});else if(t.matches('[data-q-delete-group]'))query.groups.splice(+t.dataset.qDeleteGroup,1);else if(t.matches('[data-w1-reset]'))query=initialQuery();else changed=false;if(changed){draw();controls.querySelector('select').focus();}});draw();
 }
 if(id===125){let matrix=initialPermissions(),selected=1,history=[],previous='初期状態';const describe=row=>permissions.map((p,i)=>`${labels[p]}:${row[i]?'許可':'拒否'}`).join(' / ');
 const update=()=>{const eff=effectivePermissions(matrix[selected]);before.textContent=`変更前：${previous}`;state.textContent=`${roles[selected]} 設定 ${describe(matrix[selected])}。有効権限：${permissions.map(p=>`${labels[p]} ${eff[p]?'有効':'無効'}`).join(' / ')}。${eff.conflicts.length?'不整合：閲覧拒否のため '+eff.conflicts.map(p=>labels[p]).join('・')+' は無効です':'競合なし'}`;controls.querySelector('[data-p-undo]').disabled=!history.length;};
 const draw=()=>{controls.innerHTML=select('対象役割','data-p-role',roles.map((x,i)=>[String(i),x]),String(selected))+`<div class="w1-scroll" tabindex="0" role="region" aria-label="権限マトリクス。横にスクロールできます"><table><caption>継承なし・閲覧拒否が優先</caption><thead><tr><th scope="col">役割</th>${permissions.map(p=>`<th scope="col">${labels[p]}</th>`).join('')}</tr></thead><tbody>${matrix.map((row,i)=>`<tr><th scope="row">${roles[i]}</th>${row.map((v,j)=>`<td><button type="button" data-p-toggle="${i},${j}" aria-label="${roles[i]} ${labels[permissions[j]]}" aria-pressed="${v}">${v?'許可':'拒否'}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div><button type="button" data-p-undo>Undo</button>`;update();};
 host.addEventListener('change',e=>{if(e.target.matches('[data-p-role]')){selected=+e.target.value;update();}});
 host.addEventListener('click',e=>{const t=e.target;let focus='[data-p-role]';if(t.matches('[data-p-toggle]')){const [i,j]=t.dataset.pToggle.split(',').map(Number);history.push(clone(matrix));previous=`${roles[i]} ${describe(matrix[i])}`;matrix[i][j]=!matrix[i][j];selected=i;focus=`[data-p-toggle="${i},${j}"]`;}else if(t.matches('[data-p-undo]')&&history.length){previous=`${roles[selected]} ${describe(matrix[selected])}`;matrix=history.pop();}else if(t.matches('[data-w1-reset]')){previous=`${roles[selected]} ${describe(matrix[selected])}`;matrix=initialPermissions();history=[];selected=1;}else return;draw();controls.querySelector(focus).focus();});draw();
 }
 if(id===126){let row='region',col='kind',measure='sum',mode='all',previous='初期状態';const axes=[['region','地域'],['kind','種類']];const format=a=>a.value===null?'—（数値なし）':Number.isInteger(a.value)?String(a.value):a.value.toFixed(2);
 const draw=()=>{controls.innerHTML=select('行軸','data-pivot-row',axes,row)+select('列軸','data-pivot-col',axes,col)+select('集計','data-pivot-measure',[['count','件数'],['sum','合計'],['average','平均']],measure)+select('データ','data-pivot-data',[['all','全データ'],['empty','空データ'],['missing','金額未入力のみ']],mode);update();};
 const update=()=>{before.textContent=`変更前：${previous}`;const rows=mode==='all'?sample:mode==='empty'?[]:sample.filter(x=>x.amount===null);if(row===col){state.textContent='入力エラー：行と列に異なる軸を指定してください。集計停止。';results.innerHTML=tableData(rows);return;}const p=pivot(rows,row,col,measure);state.textContent=`現在：行 ${row==='region'?'地域':'種類'} / 列 ${col==='kind'?'種類':'地域'} / ${measure} / 元データ ${rows.length}件、有効数値 ${p.total.numericCount}件 / 総計 ${format(p.total)}。${rows.length?'':'空データです。'}平均は有効数値の件数で重み付けします。`;results.innerHTML=`<div class="w1-scroll" tabindex="0" role="region" aria-label="集計結果。横にスクロールできます"><table><caption>集計結果（${measure}）</caption><thead><tr><th scope="col">行 / 列</th>${p.colKeys.map(c=>`<th scope="col">${escape(c)}</th>`).join('')}<th scope="col">行総計</th></tr></thead><tbody>${p.rowKeys.map((r,i)=>`<tr><th scope="row">${escape(r)}</th>${p.cells[i].map(a=>`<td>${format(a)}</td>`).join('')}<td>${format(p.rowTotals[i])}</td></tr>`).join('')}<tr><th scope="row">列総計</th>${p.colTotals.map(a=>`<td>${format(a)}</td>`).join('')}<td data-pivot-total>${format(p.total)}</td></tr></tbody></table></div>${tableData(rows)}`;};
 host.addEventListener('change',e=>{previous=`${row} × ${col} / ${measure} / ${mode}`;const t=e.target;if(t.matches('[data-pivot-row]'))row=t.value;if(t.matches('[data-pivot-col]'))col=t.value;if(t.matches('[data-pivot-measure]'))measure=t.value;if(t.matches('[data-pivot-data]'))mode=t.value;update();});host.addEventListener('click',e=>{if(e.target.matches('[data-w1-reset]')){previous=`${row} × ${col} / ${measure} / ${mode}`;row='region';col='kind';measure='sum';mode='all';draw();controls.querySelector('select').focus();}});draw();
 }
 }
}
const api={sample,initialQuery,validateQuery,queryRows,initialPermissions,effectivePermissions,pivot,wave1Demo,wave1Init};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
Object.assign(scope,{wave1Demo,wave1Init});
})(typeof window==='undefined'?globalThis:window);
