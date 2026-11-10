# 第12回 Select診断（2026-11-10 JST）

Issue #41 / Draft PR #42 / parent #28。製品・SDK・依存lock・第1〜11回のコードと原証拠は変更しない。Stage 3 HOLD、PR #23の製品再受入NO。診断基盤の成功と製品修正を混同しない。

## 再現

固定main80be039から作成した提出HEADをcheckout。AGENTSに従い `python scripts/prepare-work.py`、既存lockの `npm --prefix .work/v10 ci --ignore-scripts`、`npm --prefix .work/v10 run build`、`npm --prefix tools/stage-a-browser ci --ignore-scripts`。Playwright1.56.1のWebKit/Chromiumをインストール。依存更新はしない。

`ROUND12_ENGINE=webkit ROUND12_OUT=<存在しない出力先> node tests/select-round12/run.cjs`。Chromiumはengineのみ変更。実際のexitを保持して `ROUND12_RUNNER_EXIT=<exit> ROUND12_EXPECT_HEAD=<producer HEAD> ROUND12_EXPECT_PLATFORM=<linux|win32> ROUND12_ENGINE=<engine> node tests/select-round12/audit.cjs <出力先>`。過去出力は再利用しない。

正常原票に `ROUND12_EVIDENCE=<出力先> node --test tests/select-round12/evidence.test.cjs`、独立反例 `python tests/select-round12-review/trace-counterexamples.py <出力先>`、`python tests/select-round12-review/temporal-counterexamples.py <出力先>`、`node tests/select-round12-review/semantic-counterexamples.cjs <出力先>/results.json`。故障対照は原票を改変せず、メモリ複製または一時hardlinkの欠損コピーを使う。ブラウザ試行数には合算しない。

## 実験の解釈

Aなし、B ON、C準備ONからOFF、D ON→OFF、E準備ONからOFF→ON、F D後Tab2回、G D後direct focus。D/Gは同一経路の再現対照。Cの実履歴はDと同じ、EはON→OFF→ONなので、OFF単独や順序の純粋な因果試験とは呼ばない。B/EだけSwitchはdisabledで終わる。Select対象のDOM・矩形・scroll・CSS同等性と、全画面/内部状態の同一性は別である。

A/FはローカルWebKit pilot/限定正式試行それぞれ各3/3で輪郭表示。他の5条件はそれぞれ各3/3でfocus取得あり、focus-visible不成立、輪郭欠落。正式ローカル原票21/21、148 manifestファイルを独立照合。これらはhostedに合算しない。最終HEAD CIの結果はPRへ別記する。

H1（ON必要）はUNKNOWN。ONを含まない独立したOFF条件がない。H2（OFF必要）、H3（ON→OFF必要）はBの欠落によりこの限定pilot内では反証。H4（DOM/属性）は記録したSelectの持続的差だけの説明が弱まるが、広いDOM/内部状態はUNKNOWN。H5（入力方法）は同じSwitch履歴のD/G対Fにより関連を支持。ただしTab経路は中間フォーカスも含む。H6（Museum管理処理）、H7（ブラウザ内部原因）、H8（観測副作用）はUNKNOWN。根本原因を確定せず製品修正しない。

## 失敗・限界

- 最初のローカル3起動は依存ライブラリ/stock wrapperの環境で起動不能、NOT_TESTED。以後は既存の明示launcherと共有ライブラリで起動した補助Linux環境。hostedは標準インストールで別母数。
- WebKit pilotのdirty表示は依存directoryへのuntracked symlink。後でローカルexcludeを設定したが過去原票を修正していない。pilotは最終監査PASSではない。
- ローカルChromium pilotはA/Bの2行完了後に進捗停止。追加活動を続けずSIGINTで終了（exit130）、原因UNKNOWN、欠落19行を成功扱いにしない。途中PNG/traceは保全。
- 独立新規WebKit実行はD-1でTarget crashed、20/21完了でexit1。原因UNKNOWN。別の正式21/21成功でこの失敗を消さない。
- 独立反例で対象の欠測、イベント信頼/状態、時間順、完全なtrace順序、画像clipの結合不足を発見し修正した。画像再計算でDOMRectの余分な4項目が期待値に混入する誤FAILも修正。原画像や旧assertは変更していない。
- Playwright traceはlocator.evaluateのcallback本文を保存しない。見える呼出の全順序・params・source hash・状態/eventは照合するが、traceだけで隠れたcallbackの不存在を証明しない。
- 幅390/765/1280、reduced motion、Windows実PC、実機iPhone Safari、物理入力、VoiceOverはNOT_TESTED。2026-11-10 20:29 JSTの実PCカタログはギャラリアoffline。
- 375px限定で原因候補を絞ることを優先。全16条件完了とは主張しない。観測off対照、DOMだけの介入、Museum処理隔離は後続候補。

## 提出境界

新しい診断コード・計画・CI・報告だけを提出。Draft維持、マージ・公開なし。CI、原artifact、独立レビューの確認前はマージ推奨NO。最終報告で判定を更新する。
