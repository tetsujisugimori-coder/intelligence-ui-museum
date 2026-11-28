(function (global) {
  'use strict';
  const failureLabels = { normal:'障害なし', transient:'一時障害', permanent:'恒久障害', unknown:'未知の障害' };
  const steps = ['仮登録','枠確保','受付確定'];
  // Retry is a bounded loop inside an action, not an edge in this graph.
  const terminal = new Set(['retry','fallback','manual']);
  function invalidRoute(graph, start) {
    const visited = new Set();
    for(let at=start;!terminal.has(at);at=graph[at]){
      if(!Object.hasOwn(graph,at))return 'undefined';
      if(visited.has(at))return 'cycle';
      visited.add(at);
    }
    return null;
  }
  function route(error, cap, policy, recovers) {
    const history = ['申請受付 → 入力確認'];
    const result = (state, reason) => ({state, reason, history});
    if (!Object.hasOwn(failureLabels,error) || !Number.isInteger(cap) || cap < 0 || cap > 3 ||
        !['standard','missing','cycle','multi-cycle'].includes(policy) || typeof recovers !== 'boolean') return result('invalid','入力不正。実行しません。');
    if (error === 'normal') { history.push('通知処理 → 正常完了'); return result('complete','障害なし：通常通知を完了。'); }
    history.push('通知処理で発生：'+failureLabels[error]);
    const graph=policy==='missing'?{}:policy==='cycle'?{error:'error'}:policy==='multi-cycle'?{error:'classify',classify:'error'}:
      {error:({transient:'retry',permanent:'fallback',unknown:'manual'})[error]};
    const invalid=invalidRoute(graph,'error');
    if (invalid === 'undefined') return result('undefined','異常経路が未定義。実行前に停止。');
    if (invalid === 'cycle') return result('cycle','無制限の循環参照を検出。実行前に停止。');
    if (error === 'unknown') { history.push('担当者へ引継ぎ'); return result('manual','分類不能なので再試行や代替を始めません。'); }
    if (error === 'permanent') {
      history.push('代替：受付画面内の通知'+(recovers?'成功':'失敗'));
      return recovers ? result('fallback','原処理は再実行せず、代替通知を完了。') : result('stopped','代替も失敗したため停止。');
    }
    for (let i=1;i<=cap;i++) {
      const ok = recovers && i === 2;
      history.push('再試行 '+i+'：'+(ok?'成功':'失敗'));
      if (ok) return result('retried','一時障害。2回目の再試行で成功。');
    }
    return result('limit','一時障害。上限 '+cap+' 回に達し停止。');
  }

  const newCompensation = () => ({phase:'idle', completed:[], remaining:[], attempted:[], history:[], failComp:-1, failureStep:null, outcomes:[null,null,null]});
  function begin(s, failAt, failComp) {
    if (s.phase !== 'idle' || ![-1,0,1,2].includes(failAt) || ![-1,0,1,2].includes(failComp)) return ['invalid','開始済み、または設定不正。Resetで別試行を開始してください。'];
    s.failComp=failComp;
    for (let i=0;i<steps.length;i++) {
      if (i===failAt) {
        s.failureStep=i;
        s.history.push(steps[i]+'：失敗（未確定）');
        s.phase = s.completed.length ? 'pending' : 'no-effect';
        return [s.phase,s.completed.length?'完了済み工程を後ろから補償してください。':'完了済み工程なし。補償なし。'];
      }
      s.completed.push(i);s.remaining.push(i);s.history.push(steps[i]+'：完了');
    }
    s.phase='finished';
    return ['finished','全工程が成功。補償は不要です。'];
  }
  function undo(s, index) {
    const next = s.completed.at(-1-s.attempted.length);
    if (s.phase!=='pending' || next!==index || !Number.isInteger(index)) {
      s.history.push('補償を拒否：未完了・再実行・順序違反のいずれか');
      return ['invalid','補償対象は逆順の次工程だけです。未実行・二重補償は拒否します。'];
    }
    s.attempted.push(index);
    const success=index!==s.failComp;
    s.outcomes[index]=success?'succeeded':'failed';
    if(success)s.remaining=s.remaining.filter(x=>x!==index);
    s.history.push('新規の補償操作：'+steps[index]+' → '+(success?'成功':'失敗・効果が残留'));
    if(s.attempted.length===s.completed.length)s.phase=s.remaining.length?'manual':'restored';
    return [s.phase,s.phase==='manual'?'部分復旧。残留効果は人手で対応してください。':s.phase==='restored'?'全補償を完了。元の実行履歴は保持します。':'次の補償へ。失敗した効果は残留欄を確認してください。'];
  }

  const reasons = {transient:'一時障害', permanent:'恒久障害', malformed:'形式不正', exhausted:'再試行上限'};
  const newQueue=()=>({
    items:[
      ['M-041','transient','会議室の受付通知',2],
      ['M-042','permanent','削除済み宛先に空き枠通知',1],
      ['M-043','malformed','申請番号のない受付通知',1],
      ['M-044','exhausted','修復済みの手配先へ確認通知',3],
    ].map(([id,kind,body,tries])=>({id,kind,body,tries,state:'isolated',effects:0})),
    history:[],
  });
  function queue(s,id,operation) {
    const item=s.items.find(x=>x.id===id);
    const finish=(state,reason)=>{
      s.history.push((item?.id??'未選択')+'：'+reason);
      return [state,reason];
    };
    if (!item) return finish('invalid','対象メッセージを選択してください。');
    if(operation==='start'){
      if(item.state==='processed'||item.state==='running')return finish('duplicate','処理中または完了済みの重複。実行しません。');
      if(item.kind==='malformed'||item.kind==='permanent')return finish('quarantined','原因未解消。隔離を維持。');
      item.state='running';item.tries++;
      return finish('running','再処理を開始。完了応答は別操作で確定します。');
    }
    if(item.state!=='running'||!['succeed','fail'].includes(operation))return finish('invalid','再処理中の通だけ結果を確定できます。');
    if(operation==='fail'){item.state='isolated';return finish('quarantined','再処理失敗。隔離に戻しました。');}
    item.state='processed';item.effects++;
    return finish('processed','再処理成功。成功効果を記録しました。');
  }

  const choices = xs => xs.map(([id,title])=>'<option value="'+id+'">'+title+'</option>').join('');
  const select = (name,title,xs) => '<label>'+title+'<select data-w16-'+name+'>'+choices(xs)+'</select></label>';
  const btn = (name,title) => '<button type="button" data-w16-'+name+'>'+title+'</button>';
  const named = xs => Object.entries(xs);
  const stepChoices = steps.map((x,i)=>[String(i),x]);
  function wave16Demo(id) {
    const forms={
      169:['障害の種類で通知処理の経路を切り替えます。正常経路：受付 → 入力確認 → 通知。異常経路：再試行・代替・人手確認・停止。',
        select('origin','障害分類',named(failureLabels))+select('cap','再試行上限（初回を除く）',[2,0,1,3].map(n=>[n,n+' 回']))+
        select('policy','経路設定（標準／故障対照）',[['standard','標準'],['missing','未定義'],['cycle','自己参照'],['multi-cycle','複数箇所の循環']])+
        select('recovery','回復条件',[['yes','回復可能'],['no','回復不可']])+btn('run','経路を実行')],
      170:['成功した工程の効果だけに、逆順で新しい補償操作を行います。巻き戻しとは違い実行の履歴は残ります。',
        select('origin','障害を起こす工程',[['2','受付確定'],['-1','障害なし'],...stepChoices.slice(0,2)])+
        select('failure','補償を失敗させる工程',[['-1','なし'],...stepChoices])+btn('run','前進処理を実行')+
        select('target','補償対象',[stepChoices[1],stepChoices[0],stepChoices[2]])+btn('undo','対象を補償')],
      171:['通常処理できなかった通知を隔離します。原因を確認し、条件を満たす通だけ仮想的に再処理します。',
        '<label>メッセージ検索<input data-w16-origin type="search" maxlength="80" placeholder="ID または内容"></label>'+
        select('kind','理由で絞り込み',[['all','すべて'],...named(reasons)])+
        select('message','隔離メッセージ',[])+btn('run','再処理を開始')+btn('success','成功応答を記録')+btn('fail','失敗応答を記録')],
    };
    const [intro,controls]=forms[id];
    return '<section class="wave16" data-wave16="'+id+'"><p class="muted">青波交流館｜架空データ・外部通信なし</p><p>'+intro+
      '</p><div class="wave16-controls">'+controls+'</div><p data-w16-status data-state="idle" role="status">操作待ち。</p>'+
      '<div data-w16-details></div><h4>操作履歴</h4><ol data-w16-history aria-label="操作履歴"></ol></section>';
  }

  function wave16Init(scope) {
    for (const host of scope.querySelectorAll('[data-wave16]')) {
      if (host.wave16) continue;
      const id=Number(host.dataset.wave16), $=k=>host.querySelector('[data-w16-'+k+']');
      const comp=newCompensation(), dlq=newQueue(), routes=[];
      let current=['idle','操作待ち。'];
      const saveHistory = log => { if(log.length>24)log.splice(0,log.length-24); };
      const list=$('message');
      function filter() {
        const search=$('origin').value.trim().toLowerCase(),kind=$('kind').value,prev=list.value;
        const matching=dlq.items.filter(i=>(kind==='all'||i.kind===kind)&&[i.id,i.body].some(x=>x.toLowerCase().includes(search)));
        list.replaceChildren(...matching.map(i=>new Option(i.id+' · '+reasons[i.kind],i.id)));
        if(matching.some(i=>i.id===prev))list.value=prev;
      }
      function render() {
        $('status').dataset.state=current[0];$('status').textContent=current[1];
        const add=(parent,tag,value)=>{const e=document.createElement(tag);e.textContent=value;parent.append(e);return e;};
        const d=$('details');d.replaceChildren();
        if(id===170) {
          const facts=add(d,'ul','');
          const forward=i=>comp.completed.includes(i)?'前進済み':comp.failureStep===i?'前進失敗':'未実行';
          const reversed={succeeded:'補償成功',failed:'補償失敗'};
          for(let i=0;i<steps.length;i++) add(facts,'li',steps[i]+'：'+forward(i)+
            ' / 初期効果なし → '+(comp.remaining.includes(i)?'現在あり':'現在なし')+' / '+(reversed[comp.outcomes[i]]??'補償未実行'));
        }
        if(id===171) {
          const listDetails=add(d,'ul','');
          const states={isolated:'隔離',running:'処理中',processed:'処理済み'};
          for(const opt of list.options){
            const i=dlq.items.find(i=>i.id===opt.value);
            add(listDetails,'li',i.id+'：'+reasons[i.kind]+'／試行 '+i.tries+' 回／'+states[i.state]);
          }
          const i=dlq.items.find(i=>i.id===list.value);
          add(d,'p',i? i.id+' 本文：'+i.body+'｜処理成功効果 '+i.effects+' 件':'条件に合う通はありません。');
        }
        const history=id===169?routes:id===170?comp.history:dlq.history;
        const ordered=$('history');ordered.replaceChildren();for(const entry of history.slice(-24))add(ordered,'li',entry);
      }
      const apply=fn=>()=>{current=fn();saveHistory(id===169?routes:id===170?comp.history:dlq.history);render();};
      if(id===169) $('run').onclick=apply(()=>{
        const outcome=route($('origin').value,Number($('cap').value),$('policy').value,$('recovery').value==='yes');
        routes.push(...outcome.history);
        return [outcome.state,outcome.reason];
      });
      if(id===170) {
        $('run').onclick=apply(()=>begin(comp,Number($('origin').value),Number($('failure').value)));
        $('undo').onclick=apply(()=>undo(comp,Number($('target').value)));
      }
      if(id===171) {
        for(const key of ['origin','kind']) $(key).addEventListener(key==='origin'?'input':'change',()=>{filter();render();});
        list.onchange=render;
        for(const [key,op] of [['run','start'],['success','succeed'],['fail','fail']]) $(key).onclick=apply(()=>queue(dlq,list.value,op));
        filter();
      }
      host.wave16={snapshot:()=>JSON.parse(JSON.stringify({current,model:id===169?routes:id===170?comp:dlq}))};
      render();
    }
  }
  if (typeof module==='object') module.exports={route,newCompensation,begin,undo,newQueue,queue};
  else Object.assign(global,{wave16Demo,wave16Init});
})(globalThis);
