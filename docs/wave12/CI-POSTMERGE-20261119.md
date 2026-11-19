# 第12便マージ後CI中断の限定是正（2026-11-19 JST）

対象: [Issue #73](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/issues/73)／PR #71、main `582f79f2fcfee418db236006ebbcafb29bb62736`。**この文書は未検証の修正計画・調査記録であり、CI解決PASS報告ではない。**

## 調査済みの事実
- 第12便製品HEAD `c41ea995d36b2dfb6dc5a34e12bea39f210b0d3a`: 16 workflow/21 checks成功（当時の固定検証）。文書追補HEAD `e3adf46cca870611d34fae4a421d85e420cab7eb`: 12 workflow成功、4キャンセル（再試行後も未完了）。旧キャンセルは保持。
- Select return [44339808650](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/44339808650) は15分、Wave 2 [44339808678](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/44339808678) とCI browser-v11 [44339808557](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/44339808557) は各20分のジョブ時間上限に到達。ログで `playwright install --with-deps` がUbuntu aptの依存取得／展開中に中断。低速なaptミラー取得を確認したが外部環境の究極原因はUNKNOWN。
- Wave 9 [44339808718](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/44339808718) は30分上限。unit/browser/故障組/正常監査がPASSした後、監査負対照の途中でキャンセル。負対照全数PASSとは扱わない。監査後に原artifact uploadが成功しても全検査完走を意味しない。
- Wave 2のキャンセル後auditおよびartifact uploadの追加失敗は、必要な結果ファイルが生成できなかったことに起因。成功と集計しない。

## このPRの局所変更
- 既存CIの `kanban-visual` で利用実績のある、digest固定のPlaywright 1.56.1 Nobleイメージを4ジョブに限定適用。ブラウザと依存ライブラリはコンテナ収録版を使う。
- コンテナ内で実行するため、重い `npx playwright install --with-deps chromium webkit` を削除。npm ciを残し、パッケージのPlaywright版を1.56.1と照合する。
- Wave 2/9の `PLAYWRIGHT_BROWSERS_PATH` はコンテナ内の `/ms-playwright` に固定し、異なる空ディレクトリを見に行かない。
- 各ジョブの実操作、判定、監査負対照、manifest、upload（失敗時を含む）の順序は維持。時間上限と合格閾値を緩和しない。

## 受入ゲート（未実施）
1. 新HEADに対する4対象ジョブの完走と、実装済みの正常・故障・監査負対照をすべて確認。環境の変化（hostとcontainer）を旧判定と別母数で記録。
2. 変更のない従来workflowやブラウザmatrixの回帰を確認。旧成功を新HEADの結果にすり替えない。
3. 新規公式原artifactのrun/job/attempt/commit/tree、ブラウザ・負対照・stdout/stderr、source/HAR/manifest/CRC等、案件の承認済み範囲で保存した実物と独立再取得原物を照合。正式保全の受入を別判断。
4. 独立レビュー後、今回のCI運用補訂だけを限定受入判定する。NGならDraft維持、原因を固定して改めて補訂する。

総合PARTIAL、Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、旧原因UNKNOWN、Issue #72 P3 OPEN、実機Safari/VoiceOver/物理touch/OS文字拡大/実AI NOT_TESTEDを維持。旧原ZIPを上書き・再生成して成功扱いにしない。中央規約v0.2.0準拠。
## CI差分追補（2026-11-19 JST、PR #74 review #5976489946）
元HEAD `cccc56a8` の正式結果は7 workflow中2 success / 3 failure / 2 cancelled。SelectとButtonはPASS。Wave2/Wave9はコンテナによるGit所有者相違で `git rev-parse HEAD` がexit128、後続監査・ZIP不成立。旧HEAD負対照は `Old HEAD negative control failed` でexit1、具体的なRED行と子プロセス終了値の独立確認が必要。Tooltip、Wave12、共通CI stage-a regressionは依存apt導入中の時間上限キャンセル。すべて旧失敗として保持し、本追補でPASS扱いにしない。

この変更は、checkout済みworkspaceだけを `safe.directory` に登録し、Wave12/Tooltip/共通stage-aに既存digest固定Playwrightコンテナを追加、OS依存導入を取り除く。共通CI旧HEAD負対照は期待値・計算・判定を変えず、失敗時に既存 `red-summary.json` と固定原票の判定理由を出力する診断を追加する。直後の新HEAD正式CIにより結果と負対照の意味を確認するまではCI受入NO。旧原artifact保持、Stage3 HOLD、Issue72 P3 OPEN維持。
