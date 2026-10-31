# Stage 2-R2 runner independent review

確認: 2026-10-30 21:30 JST。対象は同梱sourceを複製したrunner-work/scripts。原本・製品・既存証拠の変更なし。Node v24.22.1。実ブラウザ/実CIの代用ではない。

## 結論
失敗をprocess非0へ伝播する修正は隔離実行範囲でPASS。旧matrixのengine例外exit0→現matrix exit1を再現。現smokeのengine例外もexit1。保存失敗も非0。実CI反映は未検証、C基盤全体PASSとはしない。以下の小さな検証不足が残り、製品不具合があるとの断定はしない。

## 確認結果
- 提出済み単体17/17 PASS（existing-tests.log）。
- 独立result-validator/subprocess probe18/18 PASS（independent-probes.json/log）。有効smoke12、欠測、重複、偽GREEN、assert欠落、wrong noJS count、pageerror記録、未完了、engine失敗、許可baseline RED、余分RED、baseline RED未再現、真偽値厳密性を確認。
- matrixの回数regexは3に対して30/300を拒否、smokeの1に対して10/100を拒否。
- 保存失敗とengine起動例外を各runnerへ注入しexit1。保存失敗probeではengine例外も同時に発生しており、保存エラー専独の成功経路証明とは分離する。stderrでinjected save failureを確認。
- bundleから取得したbase daa42f25dfadd22a1deb5fcbe8c6f98c75a2397f のmatrix入口はengine例外exit0、提出版exit1（legacy-exit-probe.log）。

## 指摘 R1：Alert reopenのassertが欠落
重要度: P3（runnerを受入CI gateとして利用しこのcheckを機能保証に使う場合は条件付きP2）。
箇所: scripts/stage2r-smoke.cjs:12、stage2r-result.cjs:4,36。
再現: runner-work/smoke-reopen-probe.cjs は提出runnerを無変更でvm実行し、ブラウザAPIだけ隔離モデルへ差替え。Alertの2回目clickでもclosed=trueを維持する。その他必要APIは正常値。コマンド node smoke-reopen-probe.cjs。
期待: 『Alert color/close/reopen』と記録するなら2回目click後に再表示状態をassertし、この故障モデルは非0。
実結果: 両engine相当の再表示がfalseのまま12条件PASS、exit0（smoke-reopen-fault.json/log）。製品が実際に再表示しないとの証拠ではない。
最小案: 2回目click後、Alert role/status可視とoutputの表示状態をassertしてからcheckを追加。もしくはcheck名を実際に確認した範囲へ狭める。

## 指摘 R2：sixComponentsのpageerror未収集
重要度: P3（実CIの無例外保証に使う場合は条件付きP2）。
箇所: scripts/stage2r-smoke.cjs:11対:12、stage2r-result.cjs:34。
期待: sixComponentsでもpageerrorを収集しresult validatorへ渡す。
実結果: v09はerrors配列＋pageerror listenerを登録、sixComponentsは両方なし。モデルのButton click時にhandler登録有無を検査すると未登録、reportにerrorsなしでもexit0。記録されたerrorsをvalidatorが拒否することは別の独立probeで確認済み。ここは実ブラウザのuncaught error発生確認ではなくlistener欠落の静的＋APIモデル証拠。
最小案: sixComponents r.errors=[]とp.on('pageerror',...)を追加。

## 証拠範囲の注意
- browser.cjs:23の『Button focus outer geometry (not WCAG verdict)』は左右固定7pxをclosest('.exhibit')と比較するだけ。computed outline/offsetを計測せず、縦方向・全clip祖先のfocus外縁保証ではない。既存別focus測定記録や今回の限定実ブラウザ再検証と混同しない。これは製品WCAG違反の判定でもない。
- BASE条件なしでもmatrix40は許容される設計（BEFORE_ROOT任意）。今回before再現を別証拠で必須とする場合は別確認する。仕様にない新ゲートは提案しない。
- smoke Primary/Selectは操作実行のみ、結果状態の全保証ではない。labelは『interactions』であり、その範囲を超えたPASS表現を避ける。
- 6部品smoke/実ブラウザ40条件全体、CI、保存基盤の原子性、公開Siteはこの担当では未実施。
