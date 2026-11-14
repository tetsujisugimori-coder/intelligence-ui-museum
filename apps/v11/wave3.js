/* Local deterministic educational editors. No network, persistence, eval or arbitrary schema execution. */
(function (scope) {
'use strict';
const copy = x => JSON.parse(JSON.stringify(x));
const escape = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = cents => (cents / 100).toFixed(2);
const gridRows = [
 {id:'r1',name:'ノート',quantity:2,cents:1250},
 {id:'r2',name:'ペン',quantity:3,cents:220},
 {id:'r3',name:'定規',quantity:1,cents:550}
];
function validateGridRow(draft) {
 const errors = [];
 if (!draft || typeof draft !== 'object') return {errors:['行の形式が不正です'],value:null};
 if (typeof draft.name !== 'string' || !draft.name.trim() || draft.name.trim().length > 40) errors.push('名前は空白を除き1〜40文字です');
 if (typeof draft.quantity !== 'string' || !/^[0-9]+$/.test(draft.quantity) || +draft.quantity < 1 || +draft.quantity > 999) errors.push('数量は整数1〜999です');
 if (typeof draft.price !== 'string' || !/^(?:0|[1-9][0-9]{0,4})(?:\.[0-9]{1,2})?$/.test(draft.price)) errors.push('単価は0〜99999.99、小数2桁までです');
 if (errors.length) return {errors,value:null};
 const [whole, fraction=''] = draft.price.split('.');
 const cents = Number(whole)*100 + Number(fraction.padEnd(2,'0'));
 return {errors,value:{name:draft.name.trim(),quantity:Number(draft.quantity),cents}};
}
function gridTotals(rows) {
 return {subtotals:rows.map(row=>({id:row.id,cents:row.quantity*row.cents})),cents:rows.reduce((sum,row)=>sum+row.quantity*row.cents,0)};
}
function initialSchema() { return {fields:[
 {id:'name',label:'名前',type:'string',required:true},
 {id:'count',label:'個数',type:'number',required:true,min:1,max:9},
 {id:'enabled',label:'補足を表示',type:'boolean'},
 {id:'note',label:'補足',type:'string',required:true,showWhen:{field:'enabled',equals:true}},
 {id:'category',label:'用途',type:'select',options:['study','work']}
]}; }
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const exactKeys = (x,allowed) => Object.keys(x).every(k=>allowed.includes(k));
function validateSchema(schema) {
 const errors=[];
 if (!plain(schema)||!exactKeys(schema,['fields'])||!Array.isArray(schema.fields)||schema.fields.length<1||schema.fields.length>6) return ['定義はfieldsだけを持つオブジェクト、項目数は1〜6です'];
 const previous=new Map();
 for(const [i,f] of schema.fields.entries()) {
  const label=`項目${i+1}`;
  if (!plain(f)||!exactKeys(f,['id','label','type','required','min','max','options','showWhen'])) {errors.push(label+'の属性が不正です');continue;}
  if(typeof f.id!=='string'||!/^[a-z][a-z0-9_]{0,19}$/.test(f.id)||['__proto__','constructor','prototype'].includes(f.id)||previous.has(f.id))errors.push(label+'のIDは一意の英小文字始まり20字以内です');
  if(typeof f.label!=='string'||!f.label.trim()||f.label.length>40)errors.push(label+'のラベルは1〜40文字です');
  if(!['string','number','select','boolean'].includes(f.type))errors.push(label+'のtypeが未対応です');
  if(Object.hasOwn(f,'required')&&typeof f.required!=='boolean')errors.push(label+'のrequiredは真偽値です');
  if(f.type==='number') {
   for(const k of ['min','max'])if(Object.hasOwn(f,k)&&(!Number.isFinite(f[k])||Math.abs(f[k])>1000000))errors.push(label+'の数値境界は有限な±1000000以内です');
   if(Object.hasOwn(f,'min')&&Object.hasOwn(f,'max')&&f.min>f.max)errors.push(label+'のminがmaxを超えています');
  } else if(Object.hasOwn(f,'min')||Object.hasOwn(f,'max'))errors.push(label+'のmin/maxはnumber専用です');
  if(f.type==='select') {
   if(!Array.isArray(f.options)||f.options.length<1||f.options.length>6||f.options.some(x=>typeof x!=='string'||!x.trim()||x.length>40)||new Set(f.options).size!==f.options.length)errors.push(label+'のoptionsは一意な文字列1〜6個です');
  } else if(Object.hasOwn(f,'options'))errors.push(label+'のoptionsはselect専用です');
  if(Object.hasOwn(f,'showWhen')) {
   const c=f.showWhen;
   if(!plain(c)||!exactKeys(c,['field','equals'])||typeof c.field!=='string'||typeof c.equals!=='boolean'||!previous.has(c.field)||previous.get(c.field).type!=='boolean'||previous.get(c.field).showWhen)errors.push(label+'のshowWhenは先行する常時表示boolean項目とequals真偽値のみです');
  }
  previous.set(f.id,f);
 }
 return errors;
}
const initialValues = schema => Object.fromEntries(schema.fields.map(f=>[f.id,f.type==='boolean'?false:'']));
const visibleField = (f,values) => !f.showWhen || values[f.showWhen.field]===f.showWhen.equals;
function formResult(schema,values) {
 const errors=validateSchema(schema), entries=[];
 if(errors.length)return {errors,output:{},visible:[]};
 if(!plain(values))return {errors:['入力値の形式が不正です'],output:{},visible:[]};
 const visible=schema.fields.filter(f=>visibleField(f,values));
 for(const f of visible) {
  const v=values[f.id];
  if(f.type==='boolean') {if(typeof v!=='boolean')errors.push(f.label+'は真偽値です');else {entries.push([f.id,v]);if(f.required&&!v)errors.push(f.label+'を選択してください');}continue;}
  if(typeof v!=='string') {errors.push(f.label+'の入力形式が不正です');continue;}
  if(!v.trim()) {if(f.required)errors.push(f.label+'は必須です');continue;}
  if(f.type==='number') {
   if(!/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(v)||!Number.isFinite(+v)||Math.abs(+v)>1000000||(+v<(f.min??-1000000))||(+v>(f.max??1000000)))errors.push(f.label+'の数値・範囲を確認してください');
   else entries.push([f.id,+v]);
  } else if(f.type==='select') {if(!f.options.includes(v))errors.push(f.label+'は選択肢から選んでください');else entries.push([f.id,v]);}
  else {if(v.length>100)errors.push(f.label+'は100文字以内です');else entries.push([f.id,v]);}
 }
 return {errors,output:Object.fromEntries(entries),visible:visible.map(f=>f.id)};
}
const ganttStart='2026-11-01',ganttDays=14,dayMs=86400000;
const ganttTasks=[{id:'t1',name:'調査',start:'2026-11-01',duration:2},{id:'t2',name:'設計',start:'2026-11-03',duration:3},{id:'t3',name:'試作',start:'2026-11-05',duration:4},{id:'t4',name:'確認',start:'2026-11-09',duration:2},{id:'t5',name:'整理',start:'2026-11-11',duration:3}];
function dayNumber(value) {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const ms=Date.parse(value+'T00:00:00.000Z');
 if(!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,10)!==value)return null;
 return ms/dayMs;
}
const endDate=(start,duration)=>new Date((dayNumber(start)+duration-1)*dayMs).toISOString().slice(0,10);
function validateTask(draft) {
 const errors=[];
 if(!draft||typeof draft!=='object')return {errors:['作業の形式が不正です'],value:null};
 const day=dayNumber(draft.start),base=dayNumber(ganttStart);
 if(day===null)errors.push('開始日は実在するYYYY-MM-DD形式です');
 if(typeof draft.duration!=='string'||!/^\d+$/.test(draft.duration)||+draft.duration<1||+draft.duration>14)errors.push('期間は整数1〜14日です');
 if(!errors.length&&(day<base||day+Number(draft.duration)-1>base+ganttDays-1))errors.push('開始日と終了日は2026-11-01〜2026-11-14内です');
 return {errors,value:errors.length?null:{start:draft.start,duration:Number(draft.duration)}};
}
function ganttLayout(tasks) {
 const bars=tasks.map(t=>({id:t.id,start:t.start,end:endDate(t.start,t.duration),offset:dayNumber(t.start)-dayNumber(ganttStart),duration:t.duration}));
 const overlaps=[];for(let i=0;i<bars.length;i++)for(let j=i+1;j<bars.length;j++)if(Math.max(bars[i].offset,bars[j].offset)<=Math.min(bars[i].offset+bars[i].duration-1,bars[j].offset+bars[j].duration-1))overlaps.push([bars[i].id,bars[j].id]);
 return {bars,overlaps};
}
const descriptions={
 130:'複数セルを編集し、行全体を検証して確定するEditable Data Grid。111 Sortable Tableの並べ替え、Inline Editの単一値編集、127 Tree Gridの階層比較とは異なります。',
 131:'小さな独自JSON定義から入力欄を生成するSchema Form。Form Wizardの段階移動、Validationの個別検証、JSON Inspectorの閲覧と異なり、定義と生成されたフォームの対応を学びます。JSON Schema全体への準拠ではありません。',
 132:'開始日・期間・重なりを編集するGantt Editor。Timelineの出来事表示、Kanban Boardの状態移動、Dependency Graphの依存関係と異なります。自動日程調整・クリティカルパス・129との連動はありません。'
};
function wave3Demo(id) {
 if(!descriptions[id])return '';
 return `<section class="wave3" data-wave3="${id}"><p>${descriptions[id]}</p><p>Tab/Shift+Tabで操作欄を移動し、ボタンはEnter/Spaceで実行。固定データだけの教材で、保存・外部通信はしません。検索・フィルターの再描画では初期化されます。</p><p data-w3-initial></p><div data-w3-controls></div><p data-w3-before>変更前：まだ確定操作はありません。</p><output data-w3-state aria-live="polite"></output><div data-w3-results></div><button type="button" data-w3-reset>Reset</button></section>`;
}
const button=(text,key,disabled=false)=>`<button type="button" data-key="${key}"${disabled?' disabled':''}>${text}</button>`;
function wave3Init(root) {
 const hosts=root.matches?.('[data-wave3]')?[root]:[...root.querySelectorAll('[data-wave3]')];
 for(const host of hosts) {
  if(host.dataset.initialized)continue;host.dataset.initialized='true';
  const id=Number(host.dataset.wave3),$=s=>host.querySelector(s),controls=$('[data-w3-controls]'),results=$('[data-w3-results]'),state=$('[data-w3-state]'),before=$('[data-w3-before]'),initial=$('[data-w3-initial]');
  const focus=key=>host.querySelector(`[data-key="${key}"]`)?.focus();
  if(id===130) {
   let rows=copy(gridRows),drafts,undo=null;
   const draft=row=>({name:row.name,quantity:String(row.quantity),price:money(row.cents)});
   const snapshot=()=>JSON.stringify(rows);const resetDrafts=()=>{drafts=Object.fromEntries(rows.map(r=>[r.id,draft(r)]));};resetDrafts();
   initial.textContent='初期：ノート2×12.50、ペン3×2.20、定規1×5.50。確定総計37.10。名前1〜40文字、数量は整数1〜999、単価0〜99999.99・小数2桁まで。単価は銭の整数へ変換して乗算・加算し、小数2桁で表示します。3桁以上は丸めず拒否。';
   const update=()=>{const total=gridTotals(rows);results.innerHTML=`<p>確定済み総計：<strong data-grid-total>${money(total.cents)}</strong></p><pre data-grid-current data-w3-current>${escape(snapshot())}</pre><p>編集中の値は確定総計に含めません。取消はその行の確定値へ戻ります。Undoは直前の確定1件を戻し、その行の編集中の値も戻します。他行の編集中の値は保持します。</p>`;for(const r of rows){const valid=validateGridRow(drafts[r.id]);$(`[data-grid-error="${r.id}"]`).textContent=valid.errors.join(' / ');$(`[data-key="grid-${r.id}-commit"]`).disabled=!!valid.errors.length;$(`[data-grid-subtotal="${r.id}"]`).textContent=money(r.quantity*r.cents);$(`[data-grid-draft="${r.id}"]`).textContent=valid.errors.length?'入力エラー':`編集中小計 ${money(valid.value.quantity*valid.value.cents)}`;}$('[data-key="grid-undo"]').disabled=!undo;};
   const draw=()=>{controls.innerHTML=`<div class="w3-scroll" tabindex="0" role="region" aria-label="編集表の横スクロール"><table><caption>3行の編集表。入力欄は編集中、右端は確定済み小計。</caption><thead><tr><th scope="col">名前</th><th scope="col">数量</th><th scope="col">単価</th><th scope="col">確定済み小計・操作</th></tr></thead><tbody>${rows.map(r=>`<tr data-grid-row="${r.id}">${['name','quantity','price'].map((k,i)=>`<td><label>${r.id} ${['名前','数量','単価'][i]}<input type="text" ${k!=='name'?`inputmode="${k==='quantity'?'numeric':'decimal'}"`:''} data-key="grid-${r.id}-${k}" value="${escape(drafts[r.id][k])}" aria-describedby="w3-${r.id}-error"></label></td>`).join('')}<td><span data-grid-subtotal="${r.id}"></span><p data-grid-draft="${r.id}"></p>${button('確定','grid-'+r.id+'-commit')}${button('取消','grid-'+r.id+'-cancel')}<p id="w3-${r.id}-error" data-grid-error="${r.id}" role="status"></p></td></tr>`).join('')}</tbody></table></div>${button('Undo（直前の確定）','grid-undo')}`;update();};
   host.addEventListener('input',e=>{const m=/^grid-(r[1-3])-(name|quantity|price)$/.exec(e.target.dataset.key||'');if(!m)return;drafts[m[1]][m[2]]=e.target.value;update();state.textContent='編集中。確定済みの値は変更していません。';});
   host.addEventListener('click',e=>{if(e.target.matches('[data-w3-reset]')){before.textContent='変更前：'+snapshot();rows=copy(gridRows);resetDrafts();undo=null;draw();state.textContent='初期状態へ戻しました。';focus('grid-r1-name');return;}const key=e.target.dataset.key;if(key==='grid-undo'&&undo){before.textContent='変更前：'+snapshot();rows=rows.map(r=>r.id===undo.id?copy(undo.row):r);drafts[undo.id]=draft(undo.row);const rowId=undo.id;undo=null;draw();state.textContent='直前の確定を戻しました。';focus(`grid-${rowId}-name`);return;}const m=/^grid-(r[1-3])-(commit|cancel)$/.exec(key||'');if(!m)return;const r=rows.find(r=>r.id===m[1]);before.textContent='変更前：'+snapshot();if(m[2]==='cancel'){drafts[r.id]=draft(r);state.textContent='この行の編集を取り消しました。';}else{const v=validateGridRow(drafts[r.id]);if(v.errors.length){state.textContent='確定拒否：'+v.errors.join(' / ');focus(`grid-${r.id}-name`);return;}undo={id:r.id,row:copy(r)};Object.assign(r,v.value);drafts[r.id]=draft(r);state.textContent='行全体を確定しました。';}draw();focus(`grid-${r.id}-name`);});draw();state.textContent='初期状態。入力欄は編集中の値です。';
  }
  if(id===131) {
   let schema=initialSchema(),values=initialValues(schema),submitted=null;
   initial.textContent='初期定義：名前・個数・補足を表示・補足・用途の5項目。最大6項目。非表示の値は保持しますが検証・出力から除外。定義の適用成功は全入力を空文字/falseへ初期化、失敗は有効な定義と入力を保持します。必須booleanはtrueが必要です。文字列100文字以内、数値は通常の十進表記・±1000000以内です。';
   controls.innerHTML='<label>独自定義JSON<textarea data-key="schema-editor" rows="14" spellcheck="false" aria-describedby="w3-schema-error"></textarea></label>'+button('初期例を編集欄へ','schema-example')+button('定義を適用','schema-apply')+'<p id="w3-schema-error" data-schema-error role="status"></p><div data-schema-fields></div>'+button('検証して出力','schema-submit');
   const editor=$('[data-key="schema-editor"]');editor.value=JSON.stringify(schema,null,2);
   const update=()=>{const m=formResult(schema,values);for(const f of schema.fields){const wrap=$(`[data-field-wrap="${f.id}"]`);wrap.hidden=!m.visible.includes(f.id);}results.innerHTML=`<p>現在の有効な定義：</p><pre data-schema-current data-w3-current>${escape(JSON.stringify(schema))}</pre><p>現在の表示対象：${escape(m.visible.join(', '))}。入力値（非表示の保持値を含む）：</p><pre data-schema-values>${escape(JSON.stringify(values))}</pre><p>直近の検証結果：</p><pre data-schema-output>${escape(submitted===null?'未出力':JSON.stringify(submitted))}</pre><p>仕組み：許可した属性だけを検査し、type別のHTML入力欄へ変換。showWhenは先行する常時表示booleanへの等値条件だけ。外部参照・式・コード実行は非対応です。</p>`;};
   const drawFields=()=>{$('[data-schema-fields]').innerHTML=schema.fields.map(f=>`<div data-field-wrap="${f.id}"><label>${escape(f.label)}${f.required?'（必須）':''}${f.type==='boolean'?`<input type="checkbox" data-key="field-${f.id}"${values[f.id]?' checked':''}>`:f.type==='select'?`<select data-key="field-${f.id}"><option value="">未選択</option>${f.options.map(v=>`<option value="${escape(v)}"${values[f.id]===v?' selected':''}>${escape(v)}</option>`).join('')}</select>`:`<input type="text"${f.type==='number'?' inputmode="decimal"':''} data-key="field-${f.id}" value="${escape(values[f.id])}">`}</label>${f.type==='number'?`<small>範囲 ${f.min??-1000000}〜${f.max??1000000}</small>`:''}</div>`).join('');update();};
   const changed=e=>{const key=e.target.dataset.key||'';if(!key.startsWith('field-'))return;const f=schema.fields.find(f=>f.id===key.slice(6));if(!f)return;values[f.id]=f.type==='boolean'?e.target.checked:e.target.value;submitted=null;update();state.textContent='入力を変更しました。出力には再検証が必要です。';};host.addEventListener('input',changed);host.addEventListener('change',changed);
   host.addEventListener('click',e=>{const key=e.target.dataset.key;if(e.target.matches('[data-w3-reset]')){before.textContent='変更前：'+JSON.stringify({schema,values});schema=initialSchema();values=initialValues(schema);submitted=null;editor.value=JSON.stringify(schema,null,2);$('[data-schema-error]').textContent='';drawFields();state.textContent='定義と入力を初期状態へ戻しました。';focus('schema-editor');}else if(key==='schema-example'){editor.value=JSON.stringify(initialSchema(),null,2);state.textContent='編集欄に初期例を読み込みました。まだ適用していません。';focus('schema-editor');}else if(key==='schema-apply'){let candidate,errors=[];try{if(editor.value.length>12000)throw Error('定義は12000文字までです');candidate=JSON.parse(editor.value);errors=validateSchema(candidate);}catch(err){errors=[err.message];}if(errors.length){$('[data-schema-error]').textContent='適用拒否：'+errors.join(' / ');state.textContent='以前の有効なフォームと入力値を保持しました。';focus('schema-editor');return;}before.textContent='変更前：'+JSON.stringify({schema,values});schema=copy(candidate);values=initialValues(schema);submitted=null;$('[data-schema-error]').textContent='';drawFields();state.textContent='定義を適用し、入力を初期化しました。';focus('field-'+schema.fields[0].id);}else if(key==='schema-submit'){const m=formResult(schema,values);before.textContent='検証前：'+JSON.stringify(values);submitted=m.errors.length?{status:'拒否',errors:m.errors}:{status:'有効',value:m.output};update();state.textContent=m.errors.length?'検証拒否：'+m.errors.join(' / '):'表示中の有効な値だけを出力しました。';focus('schema-submit');}});drawFields();state.textContent='初期定義を表示。補足は非表示です。';
  }
  if(id===132) {
   let tasks=copy(ganttTasks),drafts,undo=null;
   const draft=t=>({start:t.start,duration:String(t.duration)});const resetDrafts=()=>{drafts=Object.fromEntries(tasks.map(t=>[t.id,draft(t)]));};resetDrafts();const snapshot=()=>JSON.stringify(tasks);
   initial.textContent='初期：5作業、表示範囲2026-11-01〜2026-11-14。開始・終了を含む日数で、1日の終了日は開始日と同じ。UTCの日単位で計算し、時刻・夏時間は扱いません。期間は整数1〜14、範囲外や不正日は丸めず拒否します。';
   const update=()=>{const m=ganttLayout(tasks);results.innerHTML=`<div class="w3-scroll" tabindex="0" role="region" aria-label="14日間の工程図の横スクロール"><div class="w3-gantt"><div class="w3-days" aria-hidden="true">${Array.from({length:14},(_,i)=>`<span>${i+1}</span>`).join('')}</div>${tasks.map((t,i)=>`<div class="w3-gantt-row"><span>${escape(t.name)}</span><div class="w3-track"><div class="w3-bar" data-w3-bar="${t.id}" data-offset="${m.bars[i].offset}" data-duration="${t.duration}" style="grid-column:${m.bars[i].offset+1} / span ${t.duration}" role="img" aria-label="${escape(t.name)} ${t.start}〜${m.bars[i].end} ${t.duration}日">${t.duration}日</div></div></div>`).join('')}</div></div><p data-gantt-overlap>重なり：${m.overlaps.length?m.overlaps.map(p=>p.join(' / ')).join('、'):'なし'}</p><pre data-gantt-current data-w3-current>${escape(snapshot())}</pre><p>棒と重なりは確定済み状態から計算します。取消はその行の確定値、Undoは直前の確定1件へ戻ります。変更前は直前の確定操作前の全作業です。</p>`;for(const t of tasks){const v=validateTask(drafts[t.id]);$(`[data-gantt-error="${t.id}"]`).textContent=v.errors.join(' / ');$(`[data-key="gantt-${t.id}-commit"]`).disabled=!!v.errors.length;$(`[data-gantt-end="${t.id}"]`).textContent=endDate(t.start,t.duration);$(`[data-gantt-draft="${t.id}"]`).textContent=v.errors.length?'入力エラー':'編集中終了日 '+endDate(v.value.start,v.value.duration);}$('[data-key="gantt-undo"]').disabled=!undo;};
   const draw=()=>{controls.innerHTML=`<div class="w3-scroll" tabindex="0" role="region" aria-label="作業編集表の横スクロール"><table><caption>開始と期間は編集中、終了は確定済み。図の各棒と同じ作業IDです。</caption><thead><tr><th scope="col">作業</th><th scope="col">開始日</th><th scope="col">期間</th><th scope="col">確定終了日・操作</th></tr></thead><tbody>${tasks.map(t=>`<tr data-gantt-row="${t.id}"><th scope="row">${t.id} ${escape(t.name)}</th><td><label>${t.id} 開始日<input type="text" data-key="gantt-${t.id}-start" value="${escape(drafts[t.id].start)}" aria-describedby="w3-${t.id}-error"></label></td><td><label>${t.id} 期間<input type="text" inputmode="numeric" data-key="gantt-${t.id}-duration" value="${escape(drafts[t.id].duration)}" aria-describedby="w3-${t.id}-error"></label></td><td><span data-gantt-end="${t.id}"></span><p data-gantt-draft="${t.id}"></p>${button('確定','gantt-'+t.id+'-commit')}${button('取消','gantt-'+t.id+'-cancel')}<p role="status" id="w3-${t.id}-error" data-gantt-error="${t.id}"></p></td></tr>`).join('')}</tbody></table></div>${button('Undo（直前の確定）','gantt-undo')}`;update();};
   host.addEventListener('input',e=>{const m=/^gantt-(t[1-5])-(start|duration)$/.exec(e.target.dataset.key||'');if(!m)return;drafts[m[1]][m[2]]=e.target.value;update();state.textContent='編集中。確定済みの棒は変更していません。';});
   host.addEventListener('click',e=>{if(e.target.matches('[data-w3-reset]')){before.textContent='変更前：'+snapshot();tasks=copy(ganttTasks);resetDrafts();undo=null;draw();state.textContent='初期状態へ戻しました。';focus('gantt-t1-start');return;}const key=e.target.dataset.key;if(key==='gantt-undo'&&undo){before.textContent='変更前：'+snapshot();tasks=tasks.map(t=>t.id===undo.id?copy(undo.task):t);drafts[undo.id]=draft(undo.task);const taskId=undo.id;undo=null;draw();state.textContent='直前の確定を戻しました。';focus(`gantt-${taskId}-start`);return;}const m=/^gantt-(t[1-5])-(commit|cancel)$/.exec(key||'');if(!m)return;const t=tasks.find(t=>t.id===m[1]);before.textContent='変更前：'+snapshot();if(m[2]==='cancel'){drafts[t.id]=draft(t);state.textContent='この作業の編集を取り消しました。';}else{const v=validateTask(drafts[t.id]);if(v.errors.length){state.textContent='確定拒否：'+v.errors.join(' / ');focus(`gantt-${t.id}-start`);return;}undo={id:t.id,task:copy(t)};Object.assign(t,v.value);drafts[t.id]=draft(t);state.textContent='開始日と期間を確定しました。';}draw();focus(`gantt-${t.id}-start`);});draw();state.textContent='初期状態。棒は確定済みの値です。';
  }
 }
}
function descriptionFor(name,map) { if(!map || !Object.hasOwn(map,name) || typeof map[name]!=='string' || !map[name].trim())throw new Error('説明未登録：'+name); return map[name]; }
const api={descriptionFor,gridRows,validateGridRow,gridTotals,initialSchema,validateSchema,initialValues,visibleField,formResult,ganttTasks,ganttStart,ganttDays,dayNumber,endDate,validateTask,ganttLayout,wave3Demo,wave3Init};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
Object.assign(scope,{wave3Demo,wave3Init,museumDescription:descriptionFor});
})(typeof window==='undefined'?globalThis:window);
