(function(scope){'use strict';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const copy=x=>JSON.parse(JSON.stringify(x));
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const dense=(x,n)=>Array.isArray(x)&&x.length===n&&Array.from({length:n},(_,i)=>own(x,i)).every(Boolean);
const keys=(x,expected)=>record(x)&&Object.keys(x).length===expected.length&&expected.every(k=>own(x,k));
const ITEMS=[{id:'c1',name:'目的',size:6,priority:0,required:true},{id:'c2',name:'必須制約',size:4,priority:0,required:true},{id:'c3',name:'参考例',size:5,priority:1,required:false},{id:'c4',name:'補足',size:3,priority:2,required:false}];
const FIXED_ITEMS=copy(ITEMS);
function budget(items,limit){
 const bad=reason=>({status:'INVALID',errors:[reason],included:[],excluded:[],used:null,remaining:null,shortfall:0});
 if(!Number.isSafeInteger(limit)||limit<0||limit>100)return bad('invalid-budget');
 if(!dense(items,4))return bad('fixed-item-contract');
 const ids=new Set();for(const item of items){if(!keys(item,['id','name','size','priority','required']))return bad('fixed-item-contract');const fixed=FIXED_ITEMS.find(x=>x.id===item.id);if(!fixed||ids.has(item.id)||!['id','name','size','required'].every(k=>item[k]===fixed[k])||!Number.isInteger(item.priority)||item.priority<0||item.priority>9)return bad('fixed-item-contract');ids.add(item.id);}
 const required=items.filter(x=>x.required).sort((a,b)=>a.id.localeCompare(b.id));const mandatory=required.reduce((s,x)=>s+x.size,0);
 if(mandatory>limit)return {status:'OVER_BUDGET',errors:[],included:[],excluded:[],used:null,remaining:null,shortfall:mandatory-limit};
 let used=mandatory;const included=required.map(x=>x.id),excluded=[];const optional=items.filter(x=>!x.required).sort((a,b)=>a.priority-b.priority||(a.id<b.id?-1:a.id>b.id?1:0));
 for(const item of optional)if(used+item.size<=limit){used+=item.size;included.push(item.id);}else excluded.push({id:item.id,reason:'capacity'});
 return {status:'VALID',errors:[],included,excluded,used,remaining:limit-used,shortfall:0};
}
function budgetFixture(scenario='normal',items=ITEMS,limit=16){const result={items:copy(items),limit};switch(scenario){case'normal':break;case'budget':result.limit=-1;break;case'priority':result.items[2].priority=-1;break;case'duplicate':result.items[3]=copy(result.items[2]);break;case'missing':result.items.pop();break;case'fixed':result.items[0].size=5;break;case'structure':delete result.items[1];break;default:throw Error('unknown scenario');}return result;}
const TOOLS=[{name:'lookup',arguments:'key: alpha | beta',permission:'許可（模擬のみ）'},{name:'sum',arguments:'a, b: 整数 0..100',permission:'許可（模擬のみ）'},{name:'delete',arguments:'key: alpha | beta',permission:'拒否（実行しません）'}];
const TOOL_SCENARIOS=['normal','unknown','missing','type','unauthorized','wrong-id','stale','duplicate','timeout'];
function matchResponses(callId,responses){
 if(typeof callId!=='string'||!/^e\d+-c[1-9]\d*$/.test(callId))return {reason:'invalid-call-id',responseId:null,payload:null};
 if(!Array.isArray(responses)||!dense(responses,responses.length))return {reason:'invalid-response-structure',responseId:null,payload:null};
 if(responses.length===0)return {reason:'mock-timeout',responseId:null,payload:null};
 if(responses.length!==1)return {reason:'duplicate-response',responseId:responses[0]?.id??null,payload:null};
 const response=responses[0];if(!keys(response,['id','payload']))return {reason:'invalid-response-structure',responseId:null,payload:null};
 if(!keys(response.payload,['value'])||!(typeof response.payload.value==='string'&&['架空A','架空B'].includes(response.payload.value)||Number.isInteger(response.payload.value)&&response.payload.value>=0&&response.payload.value<=200))return {reason:'invalid-response-payload',responseId:response.id,payload:null};
 if(response.id!==callId){const current=/^e(\d+)-c(\d+)$/.exec(callId),received=typeof response.id==='string'?/^e(\d+)-c(\d+)$/.exec(response.id):null;const stale=current&&received&&(Number(received[1])<Number(current[1])||(received[1]===current[1]&&Number(received[2])<Number(current[2])));return {reason:stale?'stale-response':'response-id-mismatch',responseId:response.id,payload:null};}
 return {reason:'matched-response',responseId:response.id,payload:response.payload};
}
function tool(name,args,scenario='normal',callId='e0-c1'){
 const history=['IDLE','VALIDATING'];const base={status:'INVALID',stage:'VALIDATING',reason:'',callId,responseId:null,payload:null,history};const reject=reason=>({...base,reason});
 if(typeof callId!=='string'||!/^e\d+-c[1-9]\d*$/.test(callId))return reject('invalid-call-id');
 if(!TOOL_SCENARIOS.includes(scenario))return reject('unknown-scenario');
 if(scenario==='unknown')name='unknown';else if(scenario==='missing')args={};else if(scenario==='type')args=name==='sum'?{a:'1',b:2}:{key:1};else if(scenario==='unauthorized'){name='delete';args={key:'alpha'};}
 if(!['lookup','sum','delete'].includes(name))return reject('unknown-tool');
 const argValid=name==='sum'?keys(args,['a','b'])&&['a','b'].every(k=>Number.isInteger(args[k])&&args[k]>=0&&args[k]<=100):keys(args,['key'])&&['alpha','beta'].includes(args.key);
 if(!argValid)return reject('invalid-arguments');
 if(name==='delete')return {...base,status:'DENIED',stage:'AUTHORIZATION',reason:'operation-not-permitted',history:[...history,'DENIED']};
 history.push('AUTHORIZED');
 const payload={value:name==='sum'?args.a+args.b:args.key==='alpha'?'架空A':'架空B'};
 let responses=[{id:callId,payload}];
 if(scenario==='timeout')responses=[];
 if(scenario==='wrong-id')responses[0].id=callId+'-wrong';
 if(scenario==='stale'){const parts=/^e(\d+)-c(\d+)$/.exec(callId);responses[0].id=`e${parts[1]}-c${Number(parts[2])-1}`;}
 if(scenario==='duplicate')responses.push(copy(responses[0]));
 const checked=matchResponses(callId,responses),status=checked.reason==='matched-response'?'MOCK_COMPLETED':checked.reason==='mock-timeout'?'TIMEOUT':'RESPONSE_REJECTED';
 return {...base,...checked,status,stage:'RESPONSE',history:[...history,status]};
}
const EXPECTATION={required:['title','kind'],forbidden:['secret'],types:{title:'string',kind:'string'},exact:{kind:'summary'}};
const good=()=>({title:'要約',kind:'summary'});
const CASES=[{id:'r1',label:'改善例',expectation:copy(EXPECTATION),old:{kind:'summary'},new:good()},{id:'r2',label:'退行例',expectation:copy(EXPECTATION),old:good(),new:{...good(),secret:'禁止'}},{id:'r3',label:'両版成功',expectation:copy(EXPECTATION),old:good(),new:good()},{id:'r4',label:'両版失敗',expectation:copy(EXPECTATION),old:{title:'要約',kind:'other'},new:{title:'要約',kind:'other'}}];
const FIXED_CASES=copy(CASES);
function validExpectation(e){return keys(e,['required','forbidden','types','exact'])&&dense(e.required,2)&&e.required[0]==='title'&&e.required[1]==='kind'&&dense(e.forbidden,1)&&e.forbidden[0]==='secret'&&keys(e.types,['title','kind'])&&e.types.title==='string'&&e.types.kind==='string'&&keys(e.exact,['kind'])&&e.exact.kind==='summary';}
function evaluate(output){
 if(output===null||output===undefined)return {status:'UNKNOWN',checks:[]};
 if(!record(output))return {status:'FAIL',checks:[{condition:'structure',status:'FAIL',reason:'object-required'}]};
 const checks=[];const add=(condition,ok,yes,no)=>checks.push({condition,status:ok?'PASS':'FAIL',reason:ok?yes:no});
 for(const key of ['title','kind'])add('required:'+key,own(output,key),'present','missing');
 add('forbidden:secret',!own(output,'secret'),'absent','forbidden-present');
 for(const key of ['title','kind'])add('type:'+key,own(output,key)&&typeof output[key]==='string','correct-type','wrong-type');
 add('exact:kind',own(output,'kind')&&output.kind==='summary','matches','different-value');
 return {status:checks.every(x=>x.status==='PASS')?'PASS':'FAIL',checks};
}
function regression(cases){
 const invalid=()=>({status:'INVALID',errors:['fixed-case-contract'],rows:[]});
 if(!dense(cases,4))return invalid();const ids=new Set();
 for(const c of cases){if(!record(c)||!own(c,'id')||!own(c,'label')||!own(c,'expectation')||Object.keys(c).some(k=>!['id','label','expectation','old','new'].includes(k)))return invalid();const fixed=FIXED_CASES.find(x=>x.id===c.id);if(!fixed||ids.has(c.id)||c.label!==fixed.label||!validExpectation(c.expectation))return invalid();ids.add(c.id);}
 const rows=FIXED_CASES.map(f=>{const c=cases.find(x=>x.id===f.id),old=evaluate(own(c,'old')?c.old:undefined),next=evaluate(own(c,'new')?c.new:undefined);let change='UNCHANGED';if([old.status,next.status].includes('UNKNOWN'))change='UNDETERMINED';else if(old.status==='FAIL'&&next.status==='PASS')change='IMPROVED';else if(old.status==='PASS'&&next.status==='FAIL')change='REGRESSED';return {id:c.id,old,new:next,change};});
 return {status:'VALID',errors:[],rows};
}
function regressionFixture(scenario='normal'){const cases=copy(FIXED_CASES);switch(scenario){case'normal':break;case'required':delete cases[0].new.title;break;case'format':cases[0].new.title=7;break;case'forbidden':cases[0].new.secret='禁止';break;case'value':cases[0].new.kind='other';break;case'expectation':cases[0].expectation.required=[];break;case'missing-output':delete cases[0].new;break;default:throw Error('unknown scenario');}return cases;}
function initial(id,epoch=0){if(id===151)return {id,budget:16,items:copy(FIXED_ITEMS),scenario:'normal',revision:0,result:null};if(id===152)return {id,tool:'lookup',args:'{"key":"alpha"}',scenario:'normal',revision:0,result:null,epoch,counter:0};if(id===153)return {id,scenario:'normal',revision:0,result:null};throw Error('unknown exhibit');}
function reduce(state,event){
 if(!record(event))throw Error('invalid event');const s=copy(state);
 if(event.type==='reset')return initial(s.id,s.id===152?s.epoch+1:0);
 if(event.type==='run'){
  if(s.id===151){const f=budgetFixture(s.scenario,s.items,s.budget);s.result=budget(f.items,f.limit);}
  else if(s.id===152){s.counter++;let args;try{args=JSON.parse(s.args);}catch{args=null;}s.result=tool(s.tool,args,s.scenario,`e${s.epoch}-c${s.counter}`);}
  else if(s.id===153)s.result=regression(regressionFixture(s.scenario));else throw Error('unknown exhibit');return s;
 }
 let changed=false;
 if(event.type==='scenario'){const allowed=s.id===151?['normal','budget','priority','duplicate','missing','fixed','structure']:s.id===152?TOOL_SCENARIOS:['normal','required','format','forbidden','value','expectation','missing-output'];if(!allowed.includes(event.name))throw Error('unknown scenario');changed=s.scenario!==event.name;s.scenario=event.name;}
 else if(s.id===151&&event.type==='budget'){changed=!Object.is(s.budget,event.value);s.budget=event.value;}
 else if(s.id===151&&event.type==='priority'){if(!Number.isInteger(event.index)||event.index<0||event.index>3)throw Error('unknown item');changed=!Object.is(s.items[event.index].priority,event.value);s.items[event.index].priority=event.value;}
 else if(s.id===152&&event.type==='tool'){if(!['lookup','sum','delete'].includes(event.name))throw Error('unknown tool');changed=s.tool!==event.name;s.tool=event.name;if(changed)s.args=event.name==='sum'?'{"a":1,"b":2}':'{"key":"alpha"}';}
 else if(s.id===152&&event.type==='args'){if(typeof event.text!=='string')throw Error('text required');changed=s.args!==event.text;s.args=event.text;}
 else throw Error('unknown event');
 if(changed){s.revision++;s.result=null;}return s;
}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const intro={151:'容量制約の中で必須・任意の資料を決定的に選びます。容量と優先順位を変更し「計算」を押してください。単位はこの教材独自で、実LLMのトークン数ではありません。131のフォーム生成、141の出典経路、143の業務条件比較とは異なります。',152:'架空ツールの引数・許可・呼出しIDと応答IDを検査します。選択とJSON引数を編集し「呼出し検査」を押してください。146の承認だけでなく応答整合性を扱い、144の再生・147の回復とは区別します。実ツールや通信は実行しません。',153:'旧・新プロンプトの固定出力例を、構造化された期待条件で比較します。「比較」を押して各条件と理由を確認してください。150の重み付き順位、149の証拠件数とは異なり、固定ケース内の回帰だけを評価します。実AIや一般的な品質向上の保証ではありません。'};
const option=(names,selected)=>names.map(n=>`<option value="${n}"${n===selected?' selected':''}>${n}</option>`).join('');
const pretty=x=>esc(JSON.stringify(x,null,2));
function wave10Demo(id){if(!intro[id])throw Error('unknown exhibit');return `<section class="wave10" data-wave10="${id}"><p>${intro[id]}</p><p class="w10-note">固定された架空の独自教材です。OpenAI公式部品・内部処理の複製ではありません。AI/API・外部送信・保存は行いません。入力変更で古い結果を失効、同値再選択では維持。Resetで初期入力と起点focusへ復帰します。</p><div data-w10-controls></div><button type="button" data-key="run">${id===151?'計算':id===152?'呼出し検査':'比較'}</button><button type="button" data-key="reset">Reset</button><output data-w10-status role="status" aria-live="polite">未検証</output><div data-w10-result></div><details><summary>現在の入力と判定</summary><pre data-w10-current></pre></details></section>`;}
function wave10Init(root){for(const h of root.matches?.('[data-wave10]')?[root]:root.querySelectorAll('[data-wave10]')){if(h.dataset.initialized)continue;h.dataset.initialized='true';let state=initial(Number(h.dataset.wave10));const $=q=>h.querySelector(q);
 function draw(){const active=h.contains(document.activeElement)?document.activeElement:null,key=active?.dataset.key;let selection=null;try{selection=active?.selectionStart;}catch{}
 const s=state;let controls='';
 if(s.id===151)controls=`<label>容量上限（0〜100）<input data-key="budget" type="text" inputmode="numeric" value="${esc(s.budget)}"></label><p>必須を先に確保。任意は優先順位の小さい順、同順位はID順。収まらなければ次へ進みます。必須合計10を満たせない場合は採用を確定しません。</p><ul>${s.items.map((x,i)=>`<li>${x.id} ${x.name} / ${x.size}単位 / ${x.required?'必須':'任意'} <label>優先順位（0〜9）<input data-key="priority-${i}" type="text" inputmode="numeric" value="${esc(x.priority)}" aria-label="${x.id} 優先順位"></label></li>`).join('')}</ul><label>診断用入力<select data-key="scenario">${option(['normal','budget','priority','duplicate','missing','fixed','structure'],s.scenario)}</select></label>`;
 if(s.id===152)controls=`<ul>${TOOLS.map(t=>`<li>${t.name}(${t.arguments})：${t.permission}</li>`).join('')}</ul><label>架空ツール<select data-key="tool">${option(['lookup','sum','delete'],s.tool)}</select></label><label>引数JSON（保存しません）<textarea data-key="args" rows="4">${esc(s.args)}</textarea></label><label>模擬応答・故障<select data-key="scenario">${option(TOOL_SCENARIOS,s.scenario)}</select></label><p>timeoutは固定模擬で、実時間の待機ではありません。IDLEから検証、許可、模擬完了までの履歴を一度の操作で表示します。Resetは入力を戻し、世代IDを進めて旧応答を失効します。</p>`;
 if(s.id===153)controls=`<p>旧プロンプト：「短く説明してください。」</p><p>新プロンプト：「title と kind=summary のJSONで説明し、secretを含めないでください。」</p><label>固定反例<select data-key="scenario">${option(['normal','required','format','forbidden','value','expectation','missing-output'],s.scenario)}</select></label><p>判定は事前定義の構造条件だけです。欠落出力はUNKNOWN、期待条件の改変はINVALID。どちらかUNKNOWNなら改善・退行を確定しません。</p><details><summary>期待条件と旧・新の固定出力</summary>${regressionFixture(s.scenario).map(c=>`<h4>${c.id} ${c.label}</h4><p>期待条件</p><pre>${pretty(c.expectation)}</pre><p>旧版</p><pre>${pretty(c.old)}</pre><p>新版</p><pre>${own(c,'new')?pretty(c.new):'欠落'}</pre>`).join('')}</details>`;
 $('[data-w10-controls]').innerHTML=controls;const r=s.result;let result=r?`<h4 data-w10-verdict>${esc(r.status)}</h4>`:'<p data-w10-verdict>未検証：入力を確認して実行してください。</p>';
 if(r&&s.id===151){if(r.status==='VALID')result+=`<p data-w10-capacity>使用 ${r.used} / 残容量 ${r.remaining}</p><h5>採用</h5><ul data-w10-included>${r.included.map(id=>`<li>${id} ${FIXED_ITEMS.find(x=>x.id===id).name}</li>`).join('')}</ul><h5>除外</h5><ul data-w10-excluded>${r.excluded.map(x=>`<li>${x.id}：容量不足（${x.reason}）</li>`).join('')||'<li>なし</li>'}</ul>`;else if(r.status==='OVER_BUDGET')result+=`<p>必須資料だけで容量超過。不足 ${r.shortfall}単位。採用は未確定です。</p>`;else result+=`<p>採用は未確定です。</p><ul>${r.errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`;}
 if(r&&s.id===152)result+=`<p data-w10-stage>処理段階 ${esc(r.stage)} / 理由 ${esc(r.reason)}</p><p data-w10-ids>呼出しID ${esc(r.callId)} / 応答ID ${esc(r.responseId??'なし')}</p><ol data-w10-history>${r.history.map(v=>`<li>${v}</li>`).join('')}</ol><p>模擬応答（成功時だけ確定）</p><pre data-w10-payload>${r.payload===null?'未確定':pretty(r.payload)}</pre>`;
 if(r&&s.id===153){result+=r.status==='INVALID'?`<ul>${r.errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`:r.rows.map(row=>`<article data-w10-row="${row.id}"><h5>${row.id}：${row.change}</h5><p>旧版 ${row.old.status} → 新版 ${row.new.status}</p><p>理由：${row.change==='UNDETERMINED'?'出力欠落で比較不能':row.change==='UNCHANGED'?'達成状態が同じ':row.change==='IMPROVED'?'固定条件が不達成から達成へ':'固定条件が達成から不達成へ'}</p>${['old','new'].map(v=>`<h6>${v==='old'?'旧版':'新版'}の条件別結果</h6><ul>${row[v].checks.map(c=>`<li>${c.condition}：${c.status} / ${c.reason}</li>`).join('')||'<li>出力欠落：判定不能</li>'}</ul>`).join('')}</article>`).join('');}
 $('[data-w10-result]').innerHTML=result;$('[data-w10-status]').textContent=(r?r.status:'未検証')+'（入力版'+s.revision+'）';$('[data-w10-current]').textContent=JSON.stringify(s,null,2);
 if(key){const next=$(`[data-key="${key}"]`);next?.focus();if(typeof selection==='number'&&next?.setSelectionRange)try{next.setSelectionRange(selection,selection);}catch{}}
 }
 function dispatch(event){try{state=reduce(state,event);draw();if(event.type==='reset')$(`[data-key="${state.id===151?'budget':state.id===152?'tool':'scenario'}"]`)?.focus();return {accepted:true,state:copy(state)};}catch(error){$('[data-w10-status]').textContent='拒否：'+error.message;return {accepted:false,reason:error.message,state:copy(state)};}}
 h.wave10={getState:()=>copy(state),dispatch};h.addEventListener('click',event=>{const b=event.target.closest('button[data-key]');if(b)dispatch({type:b.dataset.key});});
 const number=text=>/^\d+$/.test(text)?Number(text):text;
 h.addEventListener('input',event=>{const k=event.target.dataset.key;if(k==='budget')dispatch({type:'budget',value:number(event.target.value)});else if(/^priority-[0-3]$/.test(k||''))dispatch({type:'priority',index:Number(k.slice(-1)),value:number(event.target.value)});else if(k==='args')dispatch({type:'args',text:event.target.value});});
 h.addEventListener('change',event=>{const k=event.target.dataset.key;if(k==='scenario'||k==='tool')dispatch({type:k,name:event.target.value});});draw();
 }}
const api={ITEMS,TOOLS,CASES,budget,tool,matchResponses,regression,budgetFixture,regressionFixture,initial,reduce,wave10Demo,wave10Init};if(typeof module!=='undefined'&&module.exports)module.exports=api;scope.Wave10=api;Object.assign(scope,{wave10Demo,wave10Init});
})(typeof window==='undefined'?globalThis:window);
