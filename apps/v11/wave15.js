(function (global) {
  'use strict';
  const effects = {
    submitted: '申請受付通知', approved: '承認通知', rejected: '却下通知', updated: '更新通知',
  };
  const events = {
    submitted: { type: 'submitted', eventId: 'E-APP-01', amount: 0, urgent: false, note: '' },
    approved: { type: 'approved', eventId: 'E-APP-02', amount: 12, urgent: true, note: '承認' },
    rejected: { type: 'rejected', eventId: 'E-APP-03', amount: 0, urgent: false, note: '却下' },
    updated: { type: 'updated', eventId: 'E-APP-04', amount: 2, urgent: false, note: '更新' },
    missing: { type: 'submitted', eventId: 'E-MISSING', amount: 0, urgent: false },
    unknown: { type: 'forwarded', eventId: 'E-UNKNOWN', amount: 0, urgent: false, note: '' },
  };
  const own = (object, property) => Object.prototype.hasOwnProperty.call(object, property);
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const integer = (value, min, max = Number.MAX_SAFE_INTEGER) =>
    Number.isSafeInteger(value) && value >= min && value <= max;
  const state = (name, reason, extra = {}) => ({ state: name, reason, ...extra });
  const types = {
    type: value => typeof value === 'string' && own(effects, value),
    amount: value => integer(value, 0),
    urgent: value => typeof value === 'boolean',
    note: value => typeof value === 'string',
  };
  const newTrigger = () => ({ seen: new Set(), history: [] });
  function trigger(store, event, field, literal) {
    let outcome, repeat = false;
    if (!event || !own(event, 'type') || !types.type(event.type) || !own(event, 'eventId') || !text(event.eventId)) {
      outcome = state('invalid-event', '入力不正：既知の種別と配信IDが必要です。');
    } else if (!Object.keys(types).every(key => own(event, key) && types[key](event[key]))) {
      outcome = state('invalid-event', '入力不正：amount・urgent・note の必須項目と型を確認してください。');
    } else {
      const identity = JSON.stringify([event.type, event.eventId]);
      repeat = store.seen.has(identity);
      store.seen.add(identity);
      let value;
      try { value = JSON.parse(literal); } catch {} // invalid literal remains undefined
      if (!own(types, field) || !types[field](value)) {
        outcome = state('invalid-filter', '条件不正：項目と値の型を合わせてください。文字列は二重引用符で囲みます。');
      } else if (event[field] === value) {
        outcome = state('candidate', '条件一致：起動候補です。処理成功を意味しません。', { action: effects[event.type] });
      } else {
        outcome = state('filtered', '条件不一致：処理を起動しません。');
      }
    }
    const entry = { ...outcome, repeat, eventId: event?.eventId ?? null, type: event?.type ?? null };
    store.history.push(entry);
    if (store.history.length > 12) store.history.shift();
    return entry;
  }

  const hazard = Number.MAX_SAFE_INTEGER;
  const scenarios = {
    first: ['success'], recover: ['transient', 'transient', 'success'],
    exhaust: ['transient'], permanent: ['permanent'], timeout: ['timeout'],
  };
  const durations = { success: 10, transient: 20, permanent: 20 };
  const classifications = {
    success: '成功', transient: '一時エラー（再試行可能）',
    permanent: '恒久エラー（再試行不可）', timeout: '締切・結果不明（副作用は未確認）',
  };
  function backoff(policy, base, cap, failure) {
    if (policy === 'immediate') return 0;
    if (policy === 'fixed') return Math.min(base, cap);
    const factor = 2 ** (failure - 1);
    // Decide the cap before multiplying. The product, when done, is safe.
    return base > Math.floor(cap / factor) ? cap : base * factor;
  }
  function retry({ policy, scenario, tries, base, cap, timeout }) {
    if (!['immediate', 'fixed', 'exponential'].includes(policy) || !own(scenarios, scenario) ||
        !integer(tries, 1, 8) || !integer(base, 0) || !integer(cap, 0) || !integer(timeout, 1)) {
      return state('invalid', '入力不正：試行1〜8回、待機0以上、締切1以上の安全な整数msを指定してください。', { history: [] });
    }
    const sequence = scenarios[scenario], history = [];
    let at = 0;
    const overflow = () => state('overflow', '計算上限：安全な整数msを超えるため時系列を確定しません。', { history: [] });
    for (let attempt = 1; attempt <= tries; attempt++) {
      const plan = sequence[Math.min(attempt - 1, sequence.length - 1)];
      const result = plan === 'timeout' || durations[plan] > timeout ? 'timeout' : plan;
      const duration = result === 'timeout' ? timeout : durations[result];
      if (duration > hazard - at) return overflow();
      const finish = at + duration;
      const row = { attempt, start: at, finish, result, delay: null };
      history.push(row);
      if (result === 'success') return state('success', history.some(prior => prior.result === 'timeout') ? '再試行は成功。先行試行の副作用は未確認です。' : '処理の成功を観測しました。', { history });
      if (result === 'permanent') return state('permanent', '恒久エラーのため再試行しません。', { history });
      if (attempt === tries) {
        return history.some(prior => prior.result === 'timeout')
          ? state('unknown', '試行上限。締切後の元処理の結果・副作用は不明です。', { history })
          : state('exhausted', '最大試行回数に到達しました。', { history });
      }
      row.delay = backoff(policy, base, cap, attempt);
      if (row.delay > hazard - finish) return overflow();
      at = finish + row.delay;
    }
  }

  const payloads = {
    standard: ['R-042', '申請を受け付けました'],
    alternate: ['R-042', '申請内容が更新されました'],
  };
  const newLedger = () => ({ records: new Map(), effects: 0, history: [] });
  function record(ledger, request, outcome) {
    const entry = { ...outcome, eventId: request.eventId, key: request.key, effects: ledger.effects };
    ledger.history.push(entry);
    if (ledger.history.length > 12) ledger.history.shift();
    return entry;
  }
  function idempotency(ledger, request, operation = 'request') {
    const { eventId, key, payload } = request;
    if (!text(eventId) || !text(key) || eventId.length > 40 || key.length > 40 || !own(payloads, payload)) {
      return record(ledger, request, state('invalid', '入力不正：有効な配信ID・処理キー（各40文字以内）と固定本文が必要です。'));
    }
    const body = JSON.stringify(payloads[payload]);
    const previous = ledger.records.get(key);
    const mark = (name, reason) => record(ledger, request, state(name, reason));
    if (previous && body !== previous.body) return mark('conflict', '衝突：同じキーで本文が異なるため拒否しました。');
    if (operation === 'request') {
      if (!previous) {
        ledger.records.set(key, { body, phase: 'running' });
        return mark('new', '新規：副作用の前にキーを登録し、実行候補にしました。');
      }
      if (previous.phase === 'running') return mark('in-flight', '処理中の重複。副作用は追加しません。');
      if (previous.phase === 'completed') return mark('duplicate', '完了済みの重複。副作用は再実行しません。');
      return mark('blocked-unknown', '結果不明のため再送を保留。未実行とはみなしません。');
    }
    if (operation === 'reconcile' && previous?.phase === 'unknown') {
      previous.phase = 'completed';
      return mark('completed', '仮想サーバの証跡を照合。副作用を増やさず完了確認しました。');
    }
    if ((operation === 'complete' || operation === 'lost') && previous?.phase === 'running') {
      ledger.effects += 1;
      if (operation === 'complete') {
        previous.phase = 'completed';
        return mark('completed', '成功応答を受信し完了しました。');
      }
      previous.phase = 'unknown';
      return mark('unknown', '応答が締切に到達し結果不明。教材の観測欄では裏側の副作用1件を確認できます。');
    }
    return mark('invalid', '状態遷移不正：指定キーの現在の状態ではこの操作はできません。');
  }
  function pairedControl() {
    function single(fault) {
      const ledger = newLedger();
      const request = { eventId: 'E-APP-01', key: 'demo-notify', payload: 'standard' };
      idempotency(ledger, request);
      idempotency(ledger, request, 'lost');
      // Fault injection only in this isolated simulation: misclassify unknown as unexecuted.
      if (fault) ledger.records.delete(request.key);
      const redelivery = { ...request, eventId: 'E-APP-02' };
      const next = idempotency(ledger, redelivery);
      if (next.state === 'new') idempotency(ledger, redelivery, 'complete');
      return { effects: ledger.effects, history: ledger.history };
    }
    return { normal: single(false), fault: single(true) };
  }

  const options = values => values.map(([id, label]) => `<option value="${id}">${label}</option>`).join('');
  const select = (field, label, values) => `<label>${label}<select data-w15-${field}>${options(values)}</select></label>`;
  const input = (field, label, attrs) => `<label>${label}<input data-w15-${field} ${attrs}></label>`;
  const button = (field, label) => `<button type="button" data-w15-${field}>${label}</button>`;
  const number = (field, label, value) => input(field, label, `type="text" inputmode="numeric" value="${value}" maxlength="32"`);
  const status = `<p data-w15-status role="status" data-state="idle">操作前。まだ処理していません。</p>`;
  const history = label => `<h4>${label}</h4><ol data-w15-history aria-label="${label}"></ol>`;
  const stage = (id, intro, hint, controls, output) =>
    `<section class="wave15" data-wave15="${id}"><p>${intro}</p><div class="wave15-controls">${controls}</div><p class="muted">${hint}</p>${status}${output}</section>`;
  const eventChoices = [['submitted','申請受付（0／false／空文字）'],['approved','承認'],['rejected','却下'],['updated','更新'],['missing','故障例：必須項目欠落'],['unknown','故障例：未知の種別']];
  const resultLabels = {
    candidate: '起動候補', filtered: '起動しない', 'invalid-event': '入力不正', 'invalid-filter': '条件不正',
    new: '新規実行候補', 'in-flight': '処理中の重複', duplicate: '完了済みの重複',
    conflict: '衝突', 'blocked-unknown': '結果不明のため保留', completed: '完了確認', unknown: '結果不明',
    invalid: '入力・操作不正',
  };
  function wave15Demo(id) {
    if (id === 166) return stage(id,
      '青波交流館｜受信した架空の申請イベントをフィルターで選びます。受信と処理成功は別です。',
      '正常例：amount に 0、urgent に false、note に ""。故障例：必須項目欠落、未知の種別、型違い。',
      select('event','受信イベント',eventChoices) +
      select('field','等値条件の項目',[['type','種別'],['amount','金額'],['urgent','緊急'],['note','備考'],['invalid','故障例：未知の項目']]) +
      input('value','比較する値（JSON）',`type="text" value='&quot;submitted&quot;' maxlength="96"`) +
      button('run','受信して判定'),
      '<h4>受信候補の本文</h4><pre data-w15-event-body></pre><p data-w15-action>起動候補：なし</p><p data-w15-repeat data-repeat="false">再配信：なし</p>' + history('受信・判定履歴（最近12件）'));
    if (id === 167) return stage(id,
      '青波交流館｜通知処理の再試行を仮想時計で進め、各試行時刻と結果を比べます。',
      '正常例：一時エラーから回復。故障例：タイムアウト、負の待機。締切は副作用なしの証明ではなく、副作用を伴う再試行には168の事前照合が必要です。',
      select('policy','再試行方式',[['exponential','指数バックオフ'],['immediate','即時'],['fixed','固定間隔']]) +
      select('scenario','仮想シナリオ',[['first','初回成功'],['recover','2回の一時エラー後に成功'],['exhaust','一時エラーが継続'],['permanent','恒久エラー'],['timeout','タイムアウトが継続']]) +
      number('tries','最大試行回数（初回込み）',4) + number('base','基準待機（ms）',100) +
      number('cap','最大待機（ms）',250) + number('timeout','1回の締切（ms）',50) + button('run','仮想時間で試行'),
      history('試行タイムライン（仮想ms）'));
    if (id === 168) return stage(id,
      '青波交流館｜通知の副作用を起こす前にキーと本文を照合します。配信IDと処理キーは別です。',
      '対象は通知送信のみ。このページのメモリ内でReset・更新まで保持。永続・分散・厳密な一度だけ実行を保証しません。147は複数工程の回復、この展示は単一処理の重複抑止です。',
      input('id','イベント配信ID','type="text" value="E-APP-01" maxlength="40"') +
      input('key','通知の処理キー','type="text" value="notify-01" maxlength="40"') +
      select('payload','通知本文',[['standard','R-042：申請受付'],['alternate','R-042：申請内容の更新']]) +
      button('run','副作用前に照合・要求') + button('complete','成功応答') +
      button('lost','タイムアウト／裏側で成功') + button('reconcile','仮想証跡を照合') +
      button('control','通常／故障モデルを比較'),
      '<p>仮想サーバの累計副作用：<output data-w15-effects>0</output>件</p>' +
      '<ol data-w15-control-output aria-label="隔離対照結果" hidden></ol>' + history('処理履歴（最近12件）'));
    return '';
  }
  function wave15Init(root) {
    for (const host of root.querySelectorAll('[data-wave15]')) {
      if (host.wave15) continue;
      const find = field => host.querySelector(`[data-w15-${field}]`);
      const id = Number(host.dataset.wave15), code = find('status'), hist = find('history');
      const show = outcome => { code.dataset.state = outcome.state; code.textContent = outcome.reason; };
      const idle = () => show(state('idle', '入力を編集しました。もう一度、操作してください。'));
      const render = (target, rows, formatter) => {
        target.replaceChildren(...rows.map(row => {
          const li = host.ownerDocument.createElement('li');
          li.textContent = formatter(row);
          if ('start' in row) Object.assign(li.dataset, { start: row.start, delay: row.delay ?? '', result: row.result });
          return li;
        }));
      };
      const interact = (fields, callback) => fields.forEach(name => {
        const element = find(name);
        let last = element.value;
        const changed = () => { if (element.value !== last) { last = element.value; callback(); } };
        element.addEventListener('input', changed);
        element.addEventListener('change', changed);
      });
      const value = name => find(name).value;
      let entries = [];
      host.wave15 = Object.freeze({ getState: () => ({ state: code.dataset.state, history: JSON.parse(JSON.stringify(entries)) }) });
      if (id === 166) {
        const store = newTrigger();
        const showEvent = () => { find('event-body').textContent = JSON.stringify(events[value('event')], null, 2); };
        showEvent();
        const clear = () => {
          idle(); showEvent();
          find('action').textContent = '起動候補：なし';
          find('repeat').dataset.repeat = 'false';
          find('repeat').textContent = '再配信：未判定';
        };
        interact(['event','field','value'], clear);
        find('run').addEventListener('click', () => {
          const outcome = trigger(store, events[value('event')], value('field'), value('value'));
          entries = store.history;
          show(outcome);
          find('action').textContent = '起動候補：' + (outcome.action ?? 'なし');
          find('repeat').dataset.repeat = String(outcome.repeat);
          find('repeat').textContent = outcome.state === 'invalid-event' ? '再配信：有効なイベントとして記録なし' : outcome.repeat ? '再配信：あり' : '再配信：なし';
          render(hist, entries, item => `${item.eventId ?? 'IDなし'} / ${resultLabels[item.state]} / ${item.repeat ? '再配信' : '再配信なし'}`);
        });
      } else if (id === 167) {
        const numeric = key => /^-?(0|[1-9][0-9]*)$/.test(value(key)) ? Number(value(key)) : NaN;
        interact(['policy','scenario','tries','base','cap','timeout'], () => {
          idle(); entries = []; hist.replaceChildren();
        });
        find('run').addEventListener('click', () => {
          const outcome = retry({ policy: value('policy'), scenario: value('scenario'), tries: numeric('tries'), base: numeric('base'), cap: numeric('cap'), timeout: numeric('timeout') });
          show(outcome); entries = outcome.history;
          render(hist, entries, row => `第${row.attempt}試行 ${row.start}→${row.finish} ms：${classifications[row.result]}${row.delay === null ? '' : ` ／ 次まで ${row.delay} ms`}`);
        });
      } else if (id === 168) {
        const ledger = newLedger();
        interact(['id','key','payload'], idle);
        const request = () => ({ eventId: value('id'), key: value('key'), payload: value('payload') });
        ['run','complete','lost','reconcile'].forEach(operation => {
          find(operation).addEventListener('click', () => {
            show(idempotency(ledger, request(), operation === 'run' ? 'request' : operation));
            find('effects').textContent = String(ledger.effects);
            entries = ledger.history;
            render(hist, entries, item => `${item.eventId || 'IDなし'} / ${item.key || 'キーなし'} / ${resultLabels[item.state]} / 副作用 ${item.effects}件`);
          });
        });
        find('control').addEventListener('click', () => {
          const result = pairedControl(), output = find('control-output');
          output.hidden = false;
          output.dataset.normal = String(result.normal.effects);
          output.dataset.fault = String(result.fault.effects);
          render(output, [result.normal, result.fault], (branch) =>
            `${branch === result.normal ? '正常・事前照合' : '故障・不明を未実行扱い'}：${branch.history.map(item => resultLabels[item.state]).join(' → ')}。副作用 ${branch.effects}件`);
        });
      }
    }
  }
  if (typeof module === 'object') module.exports = { trigger, newTrigger, retry, idempotency, newLedger, pairedControl };
  else { global.wave15Demo = wave15Demo; global.wave15Init = wave15Init; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
