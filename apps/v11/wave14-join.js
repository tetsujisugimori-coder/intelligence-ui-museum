(function (scope) {
'use strict';
const names = {A:'受付',B:'会場',C:'案内'};
const order = ['B','A','C'];
const rules = {all:'All：全枝',any:'Any：いずれか',quorum:'Quorum：必要数'};
const outcomes = {success:'Success：成功',failed:'Failed：失敗',cancelled:'Cancelled：取消'};
const statusLabels = {pending:'Pending：待機',running:'Running：処理中',...outcomes};
const phaseLabels = {idle:'未開始',running:'記録中',complete:'全3枝の記録完了'};
const planKeys = {'plan-a':'A','plan-b':'B','plan-c':'C'};
const own = (obj, key) => typeof key === 'string' && Object.prototype.hasOwnProperty.call(obj, key);
function initial() {
  return {phase:'idle',rule:'all',quorum:2,plan:{A:'failed',B:'success',C:'success'},
    branches:{A:'pending',B:'pending',C:'pending'},history:[],decision:null,rejected:null};
}
const reject = (state, reason) => ({...state,rejected:reason});
const threshold = (rule,quorum) => rule==='all'?3:rule==='any'?1:quorum;
function decide(branches, history, rule, quorum) {
  const required = threshold(rule,quorum);
  const statuses = Object.values(branches);
  const success = statuses.filter(status => status==='success').length;
  const running = statuses.filter(status => status==='running').length;
  const at = history.length;
  const branch = history[at-1].branch;
  if(success>=required) return {status:'joined',reason:'threshold-met',at,branch};
  if(success+running>=required) return null;
  if(statuses.every(status => status==='cancelled')) {
    return {status:'cancelled',reason:'all-cancelled',at,branch};
  }
  return {status:'impossible',reason:statuses.includes('failed')?'insufficient-failed':'insufficient-cancelled',at,branch};
}
function reduce(state, event) {
  switch(event?.type) {
    case 'reset': return initial();
    case 'input': {
      if(state.phase!=='idle') return reject(state,'inputs-locked');
      const {key,value} = event;
      if(key==='rule' && own(rules,value)) return {...state,rule:value,rejected:null};
      if(key==='quorum' && [1,2,3].includes(value)) return {...state,quorum:value,rejected:null};
      if(own(planKeys,key) && own(outcomes,value)) return {...state,plan:{...state.plan,[planKeys[key]]:value},rejected:null};
      return reject(state,'invalid-input');
    }
    case 'start':
      if(state.phase!=='idle') return reject(state,'already-started');
      return {...state,phase:'running',branches:{A:'running',B:'running',C:'running'},rejected:null};
    case 'step': {
      if(state.phase==='idle') return reject(state,'not-started');
      if(state.phase==='complete') return reject(state,'no-remaining-branch');
      const branch = order[state.history.length];
      const status = state.plan[branch];
      const branches = {...state.branches,[branch]:status};
      const history = [...state.history,{branch,status}];
      const decision = state.decision ?? decide(branches,history,state.rule,state.quorum);
      return {...state,branches,history,decision,phase:history.length===order.length?'complete':'running',rejected:null};
    }
    default: return reject(state,'unknown-event');
  }
}
const select = (key,label,options) => `<label>${label}<select data-w14-key="${key}">${Object.entries(options)
  .map(([value,text])=>`<option value="${value}">${text}</option>`).join('')}</select></label>`;
function wave14JoinDemo(id=164) {
  if(String(id)!=='164') return '';
  return `<section class="wave14" data-wave14="164">
    <p>青波交流館の架空の案内業務。独立した三つの作業の結果を、合流条件で判定します。実際に並列処理はしません。</p>
    <p>表示順は A → B → C。完了は B → A → C の固定順です。合流の判定が確定しても、残りの枝を記録できます。</p>
    ${select('rule','合流条件',rules)}${select('quorum','Quorum の必要数（Quorum 選択時）',{'1':'1枝','2':'2枝','3':'3枝'})}
    ${Object.entries(names).map(([id,name])=>select('plan-'+id.toLowerCase(),`${id} ${name}の予定結果`,outcomes)).join('')}
    <div class="w14-actions">
      <button type="button" data-w14-key="start">Start：開始</button>
      <button type="button" data-w14-key="step">Next：1枝を完了</button>
      <button type="button" data-w14-key="reset">Reset</button>
    </div>
    <output data-w14-status="summary" aria-live="polite"></output>
    <p data-w14-status="decision"></p>
    <p>枝の状態（表示順）</p>
    <ul>${Object.entries(names).map(([id,name])=>`<li>${id} ${name}：<span data-w14-status="branch-${id.toLowerCase()}"></span></li>`).join('')}</ul>
    <p>完了履歴（先着順）</p>
    <ol data-w14-status="history"></ol>
  </section>`;
}
const decisionLabels = {
  'threshold-met':'合流成立：必要な成功数に達しました',
  'insufficient-failed':'成立不能（失敗由来）：残りすべてが成功しても必要数に達しません',
  'insufficient-cancelled':'成立不能（取消由来）：残りすべてが成功しても必要数に達しません',
  'all-cancelled':'取消：すべての枝が取り消され、合流しません',
};
const rejectLabels = {
  'inputs-locked':'開始後は条件・予定を変更できません。',
  'invalid-input':'条件または予定結果が無効です。',
  'already-started':'開始済みです。',
  'not-started':'まだ開始していません。',
  'no-remaining-branch':'完了を記録する枝は残っていません。',
  'unknown-event':'未定義の操作です。',
};
function wave14JoinInit(root) {
  for(const host of root.querySelectorAll('[data-wave14="164"]')) {
    if(host.wave14) continue;
    let state = initial();
    const input = key => host.querySelector(`[data-w14-key="${key}"]`);
    const view = key => host.querySelector(`[data-w14-status="${key}"]`);
    function draw() {
      const idle = state.phase==='idle';
      const values = {rule:state.rule,quorum:String(state.quorum),'plan-a':state.plan.A,'plan-b':state.plan.B,'plan-c':state.plan.C};
      for(const [key,value] of Object.entries(values)) {
        const control = input(key);
        if(control.value!==value) control.value=value;
        control.disabled = !idle || (key==='quorum' && state.rule!=='quorum');
      }
      input('start').disabled = !idle;
      input('step').disabled = state.phase!=='running';
      const required = threshold(state.rule,state.quorum);
      const wins = Object.values(state.branches).filter(status=>status==='success').length;
      const d = state.decision;
      const decision = d?`${decisionLabels[d.reason]}（確定：${d.at}件目 ${d.branch}）。`:'合流判定：未確定。';
      const cancelled = Object.values(state.branches).every(status=>status==='cancelled');
      view('summary').textContent = `${phaseLabels[state.phase]}。成功 ${wins}枝 / 必要 ${required}枝。 ${decision}${cancelled?' 全3枝が取消。確定した合流判定は変更しません。':''}${state.rejected?' 操作拒否：'+rejectLabels[state.rejected]:''}`;
      view('decision').textContent = decision;
      for(const [id,status] of Object.entries(state.branches)) view('branch-'+id.toLowerCase()).textContent=statusLabels[status];
      const history = state.history.map(({branch,status})=>{
        const row=host.ownerDocument.createElement('li');
        row.textContent=`${branch} ${names[branch]}：${outcomes[status]}`;
        return row;
      });
      view('history').replaceChildren(...history);
    }
    host.addEventListener('change',e=>{
      const key=e.target.dataset?.w14Key;
      if(key!=='rule' && key!=='quorum' && !own(planKeys,key)) return;
      const raw=e.target.value;
      const value=key==='quorum' && ['1','2','3'].includes(raw)?Number(raw):raw;
      state=reduce(state,{type:'input',key,value});draw();
    });
    host.addEventListener('click',e=>{
      const key=e.target.closest('button[data-w14-key]')?.dataset.w14Key;
      if(!['start','step','reset'].includes(key)) return;
      state=reduce(state,{type:key});draw();
      if(key==='reset') input('start').focus();
      else if(key==='start' && state.phase==='running') input('step').focus();
      else if(key==='step' && state.phase==='complete') input('reset').focus();
    });
    host.wave14={getState:()=>JSON.parse(JSON.stringify(state))};
    draw();
  }
}
if(typeof module!=='undefined'&&module.exports) module.exports={initial,reduce};
Object.assign(scope,{wave14JoinDemo,wave14JoinInit});
})(typeof window==='undefined'?globalThis:window);
