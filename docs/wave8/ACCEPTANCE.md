# 第8便 事前受入契約（2026-11-16 JST）
Issue #62。基準 HEAD dbba2e7f0900191caa88497d6d3a881c16368a16 / tree 3c34ab1fd044ee446becd93369f5a1c877ce4d9a。PR61 merged、144展示11分類、AGENTS/DEVELOPMENT/第7便契約・監査/正式結果を確認。起票の審査拒否を保持、本人明示再承認後にIssue成功。旧作業域を使わず専用clone、空き49GB。実装・検証・Draft提出まで、Stage3 HOLD/v10 NO/PR46 SUSPENDED/原因UNKNOWN維持。

## 重複と固定データ
145は既存の視覚的progress/loadingではなく、固定チャンクの受理・世代・中断と不完全結果を扱う。146は125の権限matrixと異なり個別操作ID/版/内容への承認を独立管理。147は通知一覧や単なるretry表示と異なりタスク毎の試行結果と正本集約を扱う。全てインタラクション分類、架空メモリ内のみ、実通信・権限変更・ファイル変更なし。

## 145 Streaming Result Inspector
初期IDLE、generation=0、chunks=[]、final=null、reason=null。固定3chunk: {id:c1,seq:1,text:'架空の'}, {id:c2,seq:2,text:'<b>結果</b>'}, {id:c3,seq:3,text:'です。'}。textContent/escapeしHTML実行なし。固定シナリオnormal/duplicate/missing/invalid、UIで選択（実行前のみ）。start IDLE→RUNNING、generation++。tickはRUNNINGのみnext chunk受理、PAUSEDは受理しない。pause RUNNING→PAUSED、resume PAUSED→RUNNING、cancel RUNNING/PAUSED→CANCELED、retry FAILED/CANCELED→RUNNING(generation++)。正常3受理＋endのみCOMPLETED、未受理end/順序重複/不正payloadはFAILED、旧generation通知は無変更拒否。中断後通知も無変更拒否。Reset任意→IDLEかつgeneration++、タイマー破棄、旧callback拒否。禁止操作は明示拒否、状態不変。partialとfinalを区別し未完成はfinal=null。イベントは論理連番、時間を成功根拠にしない。PAUSEDは受理済partial保持。一定間隔のタイマーは表示便宜で、手動「次の到着」も同じreduceを用いる。reset後focus=start、通常操作で不要なfocus移動なし。

## 146 Approval Gate Workbench
固定操作op-a/op-b、各version=1、対象/理由/permission=true/変更前後を表示。初期PENDING、approval=null、result=null。approve PENDING→APPROVED、署名はid/version/内容の完全snapshot。reject PENDING/APPROVED→REJECTED。executeはAPPROVEDかつpermission=trueかつ署名一致時のみEXECUTING、同id二重実行拒否。complete EXECUTING→COMPLETEDまたはFAILED（op-b固定failure）。承認者判断と実行resultは別record。内容改訂でversion++、PENDING/approval=null、旧署名流用拒否。REJECTED/FAILED/COMPLETEDから直接execute不可。Reset初期化・epoch++、旧completion拒否。旧版/別ID/二重approve/executeは不変拒否。permission存在は承認と独立。UI操作は実権限を持たないと常時表示。reset focus=op-a approve。

## 147 Partial Failure Recovery Console
固定4task a,b,c,d。初期PENDING。startでa,b RUNNING、c SKIPPED、d NOT_TESTED。a初回成功、b初回失敗（固定理由）、b再試行成功。FAILEDのみretry、成功/skip/not-testedは実行対象外。各task attemptIdは単調、履歴に全結果保持。batch duplicate request拒否、epoch/attempt一致かつRUNNINGの完了のみ受理、旧完了で上書きしない。集約は正本から毎回計算: RUNNINGあればRUNNING、全PENDINGならPENDING、全SUCCEEDEDのみSUCCESS、他はPARTIAL（成功0で失敗のみ等はBLOCKED可）。集計SUCCEEDED/FAILED/SKIPPED/NOT_TESTED別。b成功後もc,dが残るためPARTIAL。Reset全初期化・epoch++、旧callback拒否、focus=start。

## 固定試験
単体は意味的な正負の同入力対照を先行し、製品なしRED（module不在はREDの実装待ちであり意味的検出に数えない）→実装後GREEN。状態誤実装mutantを別試験で検出し正常受理と対照する。
ブラウザ14条件: Chromium/WebKit × 375/390/1280 × light/dark + 各375dark reduced-motion実測全text2倍。各展示初期/主操作/取消・失敗/旧通知/Resetとfocus、横溢れ、console/pageerrorを照合。表示のsnapshotを正本から独立計算。文字2倍は実computed font-size比を取得。
意味的故障は各展示6種、計18種類×2engine=36pair（正常/故障）固定。145 stale-generation/duplicate/missing/cancel-update/early-complete/reset-resurrection、146 unapproved/rejected/stale-approval/substitution/double-execute/approval-as-success、147 partial-success/skip-success/not-tested-success/rerun-success/stale-attempt/tampered-count。全て意図する不整合理由で拒否、起動例外を合格にしない。
監査器負対照は21件: 上記18状態不整合＋欠測ファイル・source hash不一致・条件ID不一致。正常原票受理を各コピーと対照。元原票不変確認。固定件数を減らさない。
143 P3:375dark実文字2倍の比較表数値折返しを前後保存。計算/範囲/Reset不変、数値nowrapをスクロール領域内だけで検討する。
既存144全metadata baseline一致、v09/v10/lock Git path/byte保全。既存試験の件数/配信資源更新は147/新2資源の追随のみ、操作期待値や時間を緩めない。

## 証拠と判定
各実行を新規.work・専用TMPDIRに出力。source/配信HTML JS CSSの実体・hash、HEAD/tree、OS/browser、JSON、期待/実測、PNG、HAR、trace、正常/故障対照、監査負対照、内部manifestを保存。原ZIPを再圧縮せずLibraryまたは利用可能なWindows承認先へ保存、別担当が実再取得し全byte/SHA/CRC/manifest/HEAD対応照合。後作成補足は別扱い。独立レビュー未実施/正式条件欠落はPARTIAL/限定マージNO。実機Safari/VoiceOver/physical touch/OS拡大NOT_TESTED。承認のない公開・merge・Draft解除なし。
