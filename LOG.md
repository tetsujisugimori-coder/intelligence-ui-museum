# 開発LOG

## 2026-11-02 JST — PR #8 / Issue #6 P2

独立レビューB119-STATEを局所修正。残存項目の選択を安定ID・左右別Setで保持。移送先の新項目は未選択、Undoは所属復元＋全選択解除という既存仕様を保護。実キーfocusと最終Undo後focusを確認する新規回帰と、同一試験の旧HEAD負対照をCIへ追加。旧・新Chromium154×3幅でRED exit1→GREEN exit0。初回試験不備も新規証拠へ保全。固定Chromium/WebKit全6条件は最終CIで確認予定。Stage A・過去証拠は変更せず、独立再レビュー前マージ推奨NO、Draft、Stage 3 HOLD。

詳細・生データ：evidence/pr8-transfer-20261102/REPORT.md。

## 2026-11-02 JST — PR #8 / Issue #6 P3

旧root CSS200%条件の本文14→14pxを測定し、そのscopeを明記。別の実文字拡大試験でdescription14→28px・全子要素2倍を設定し、6展示の文字/操作部品clip・横超過・可視focusと移送/Undo操作を検証。ローカルChromium3幅成功（固定2engine全6条件はCIで確認）。セレクタと段落サイズの初回試験誤りを別記録で保存。P2製品修正とは別commit。Stage 3 HOLD・独立再レビュー前マージ推奨NO。

## 2026-11-02 JST — 再提出証拠

P2/P3実装HEAD e3679d1のCI browser-v11は正常28・新規Transfer6・実文字6・旧HEAD拒否6・pageerror2を成功。元レビューと新規保全差分を証拠化し、最終CIの数値をログから読戻せるよう新規試験JSONをstdoutにも出力する（合否条件不変）。ブラウザ配布先403に加え、connector発行artifact download URLも環境へ転送時403で、ZIPのローカル展開照合は未実施。CI自身の厳格validatorによる検査と、artifact生成・checksum metadata確認を区別する。最終HEAD全ジョブの終端確認を継続。

2026-11-03: Issues #12 / #13 の合成文字拡大計測と Kanban の列幅を改善。新規自己検証は evidence/zoom-issues-12-13-20261103/ を参照。Stage 3 HOLD と実機未検証を維持。

2026-11-04 JST: Issue #15 Kanbanのnative select文字画像回帰ゲートを追加。固定正常画像48枚、全24操作条件、実旧版の拒否と故障CIの非zero伝播を確認。証拠は evidence/kanban-issue-15-20261104/、設計は docs/KANBAN-VISUAL.md。独立レビュー未実施・Draft PR #16・Stage 3 HOLD。

## 2026-11-14 JST 第3便開始
Issue #52。main 260173fd9e07159846c82f73f8fe40a8cedd1243を基準に132展示候補、説明欠落局所修正。仕様・固定14条件はdocs/v11-wave3/PLAN.md。結果は未確定、旧証拠保持。

Wave3 acceptance follow-up: independent review closes same-data render-stop and trace-substitution counterexamples; measured 2× layout corrected from document width 517 to 375 CSS px. Initial CI run 43565124611 correctly failed at legacy Wave1 gallery count (132 actual vs 129 expected). Only the dataset-derived count is updated to 132; behavioral assertions and prior failed artifacts remain. Final CI and persistent archive are reported separately in PR #53 / Issue #52, not inferred from local success.

Wave3 original CI evidence correction: run43565124714 / artifact14101838513 (91,818,237 bytes, SHA256 5eb6ffb90ddc674c24ac83129084f690f26cc8c10a625a2b51f41cc87667d0cc) has 14 operational PASS cells and 16 semantic controls but overall audit FAIL. Standard Playwright trace omits JavaScript response bodies. Same-context HAR supplementation is required; incomplete original evidence is retained, not rewritten or accepted retroactively.

## 2026-11-14 JST 第4便 / Issue54
- 基準main d196ba933a0c5c08aca45e3f9c563998df320d65 / tree266b3fa055a6fc654874395ce68a65a826afbc85。PR53統合確認。
- 133–135追加と124–126説明map欠落修正。旧132 dataset全項目/v09 byte/v10/lockを保持。
- 初期化呼出欠落、予約背景14分割/18枠不整合を実ブラウザ反例で発見し修正。旧失敗を別証拠に保持。
- 通常Git push認証不足、認証済みGitHub接続の非force更新で提出。最終受入結果はPR55/Issue54で対象HEADを明記する。Draft維持、Stage3 HOLD。

- 初回候補dc0a773の第4便14条件/20対照はPASSだが、CI Kanban専用配信器がwave4資源を複製/配信せず24条件で未定義エラー。旧原artifact14109674732を保持。配信と独立監査の資源一覧へwave4を条件付き追加し、旧HEADには新資源を要求しない。期待値緩和ではなくHTTP実バイト閉包の修正。

## 2026-11-15 JST — 第5便候補検証
- Issue #56 / Draft PR #57。main 62a66d1/tree d733de6、135展示/11分類から開始。受入契約先行commit 57150e9（正規GitHub提出79d91d0）。通常pushは認証不足で失敗し記録、正規GitHub接続で同一treeを親子commit提出。
- 136〜138を教育用メモリ内教材として追加。旧135全dataset、legacy v09・v10・SDK・lockは変更なし。資源closureにwave5 JS/CSS追加。
- 初回local browserは実行物不存在、既存PW1.56.1参照でChromium7条件PASS、WebKitは共有library不足でBLOCKED。新規インストール/回避はしていない。旧unit初回はTMPDIR未設定の試験保護FAIL。案件専用TMPDIRで44/44 PASS。
- 独立レビューW5-R1監査誤受理、W5-R2矢印被覆、W5-R3 SVG文字2倍欠測を確認し修正。根拠と原票はdocs/wave5/INDEPENDENT-REVIEW.md。監査器はtrace/HAR/context/source/表示の照合を追加。矢印はノード境界終端、近接ノードへの移動拒否を契約に追記。
- 初回正式wave4 CI43650608764は138!==135の旧件数期待でFAIL。原artifact14135658057は26,842,741 bytes、SHA256 56419e6a0c056777aab4f0334f768d396306537b35f4d2393d599a279df23dc0、CRC正常。wave1〜4の件数のみ138へ更新、条件・閾値は維持。
- 原票は専用evidence領域へ保持。開始空き約34GB、途中32GB/証拠156MB。共有Temp/他案件/旧証拠は削除せず。正式CI・最終独立監査・永続読戻しは未完了。Stage3 HOLD、v10 NO、PR46 SUSPENDED、既知原因UNKNOWN、Draft維持。

## 2026-11-15 JST — 第5便CI原票による検査基盤修正
90bca09のwave5 CI43651745839はWebKit7条件の全操作段階後、138展示fullPage PNGが32767px上限を超え証拠採取FAIL。故障対照stepはskipでありPASSではない。原ZIP14137067856（69,535,865 bytes、SHA256 cf8c83e1c4eb1f3877b9a01172c913053c3b400a1e4d548d39883f259746e6d9）保持。検証対象を減らさずviewport PNGと3展示個別PNGへ採取を変更し、監査で3ID/寸法/CRC/SHAを必須にした。修正後WebKitの同一14条件確認は新HEAD CI待ち。
wave1 CI43651745849は保存対照用コピーにwave5-baseline.jsonがなく正常対照FAIL。正本は存在しており製品原本破損ではない。必要ファイルをコピー対象に追加し、同一正常/4故障で修正前exit1、後正常exit0/4故障非zero確認。旧FAILとログを保持。旧run取消・手動再実行なし。

## 2026-11-15 JST — 第5便独立P2追補
- e077b22の通常画像監査が故障対照行へ重複してundefined.mapとなる反例を保持。通常14条件の画像集合/寸法/SHA/CRCは残し、故障行から不適合な要求だけを除いた。同一schema反例はRED→GREEN。画像正常・欠落・条件名/寸法/hash改変・破損・実ファイル欠測を別検査。
- 137の上端/下端と136のUndo/Redo尽きでResetへフォーカスする実装を独立Chromiumで再現。契約に有効な反対操作へ戻す方針を固定し、同一4操作でreset→out/in/redo/undoを確認。既存状態制限は変更なし。
- 独立レビューで故障sourceの自己申告hashだけでは無改変sourceを故障原票として誤受理する問題を追加検出。Gitの元bytesから監査側固定変換を再計算しsource/HARと照合。sourceHash・実bytes・HARを全て元sourceへ戻した偽装を期待するfixed mutation bytes理由で拒否。
- Node製品3/検査3成功、既存135保護成功。新しい局所browser14条件はChromium7成功、WebKit7は共有library不足の起動FAIL(環境BLOCKED)。uncommitted作業コピーの局所原票であり最終HEAD CIの代替ではない。旧cross-realm試験器FAILも保持。正式両engineは新HEAD CI待ち。旧runの手動取消/再実行なし。

## 2026-11-15 JST: v11 第6便139〜141（提出準備、未マージ）
- 基準main 6ac4cc5ca459667558c95d1c6b671e3a29c8f635 / tree 9b50ff6414c4a500fb11cf87dbfec4d7df547bd0、PR57マージを確認。Issue58、受入契約先行commit b88498b（同treeを通常GitHub接続1f39c4eへ提出）。
- Linked Views、Conflict Resolution、Provenanceを固定架空教材として追加。旧138dataset全項目、v09/v10/SDK/lock保持。141展示11分類。
- 独立レビューR1/R2: 表数値・資料本文の誤表示を監査が誤受理。原反例sourceを保ち期待値照合を補強、正常19段階維持。R3: 取消後の未解決選択表示矛盾を実ブラウザ再現し確定値対応へ修正。R4: graph/field ID重複の原票誤受理を完全ID検査で拒否。各RED/GREEN原票別保全。
- 予備ローカルChromium7条件・17故障/17正常を確認。初回故障試験はcheckの再試行timeoutで意味的検出失敗と判定し保持、通常click後の独立assertへ修正。WebKitは共有ライブラリ不足でBLOCKED。正式CI結果の代用ではない。
- 実機Safari/VoiceOver/物理touch/OS文字拡大NOT_TESTED。正式最終HEAD CI、原ZIP保存・実再取得・独立監査はPENDING。Stage3HOLD、v10受入NO、PR46SUSPENDED、既存原因UNKNOWNを維持。Draft解除・マージ・公開なし。
- 追加原票: 専用TMPDIRを付け忘れた再検は49/50（環境契約違反1）として保持し、製品修正せず専用領域指定で再確認。旧FAILは成功に置換しない。

## 2026-11-15 JST 第6便提出再開・独立追加指摘
- Draft PR59へ提出。ローカル5d6418aとremote8ac5d982は同tree0f39bcbf、別commit。以前の無応答更新を盲目的再試行せず、remoteの欠測確認後にblob/treeを照合して非force更新した。旧原票は保持。
- R5/R6: reeditで確定済色を変更、Backで別記述へ戻る相互整合原票を旧監査が誤受理。同じ保存JSONを固定段階別の独立期待値で拒否、元のChromium7条件は受理を維持。新規実ブラウザ試行ではない。
- resource故障時の予定外pageerrorを拒否し、全画面PNGの実行時サイズ/SHA記録と監査を追加。旧原票へ実行時metadataを後付けしていない。独立helper検証と正式14条件の原artifact監査は別判定。
- 独立状態/helper62＋製品3＝65 PASS、保存対象141/11検査、migration、runner25 PASS。広域unitは129 PASS/1 FAIL（kanban artifact必須引数不足）、最初の依存不足FAILも保持。正式CIで必要artifact付き検査を確認する。
- この修正後HEADの正式14条件・故障/正常対照・原ZIP監査/再取得はPENDING。総合PARTIAL、限定マージNO。

## 2026-11-15 JST 第6便 E2BIG局所修正
- 保存済正式原ZIP14156471278を同一性確認。旧監査E2BIG exit1、必要4識別項目だけをargvへ渡す修正で同一原票の14条件/34pair監査exit0、11負対照全件意図理由で拒否。元500ファイル不変。
- stdin試作の欠測trace EPIPEは却下・ログ保持。製品変更/証拠改変/検査省略なし。66単体、保全、migration成功。旧HEAD再監査と新HEAD正式CIを区別し後者は待機。

## 2026-11-15 22:55 JST — 第7便 実装候補
- Issue60、PR59統合後main d454ce561cc3d4e9fbd01efe0598cb32a07ae5f6/tree80bbde2c499dc72642fe7474c6a05eba0f6ec50eから専用branch。実装前契約42c143a/85b508cを固定。
- 142固定有向依存と循環/到達経路、143整数の条件比較、144親IDチェーンの決定的履歴再生・分岐切詰め。既存141全項目一致、144連番/11分類を確認。
- 製品28＋独立期待値468＝496単体PASS。初回モジュール未作成とwidth fixture欠測FAILは別保持し、意味的検出成功に算入しない。故障source21種×2engineを実装、実browser未検証。正式14条件と原artifact保全はPENDING。
- Git HTTPS pushは認証入力不能で失敗。既存認証connectorの通常非force ref更新で提出予定。同treeのlocal/remote commit識別を分離する。
- ローカルPlaywright1.56.1の公式browser取得済みだがWebKit共有library欠測。環境BLOCKEDを製品FAILへ読み替えない。実機Safari/VoiceOver/物理touch/OS拡大NOT_TESTED。
- 独立R7-1: 142/144のgallery説明登録欠落で初回描画117件に留まりpageerror。候補495a6c7の原票とレビュー原票を保持。3展示の説明登録と静的欠落検査を追加し同一操作を再確認する。初回検査追加時の変数名誤記NameErrorも別失敗として保持。
- 23:00 JST: 再提出準備で既存wave2検証器の資源/総数整合が承認審査拒否。重複送信・迂回なし。局所製品は3fc95dd、Chromium7PASS/WebKit7BLOCKED。故障は18pair後resource追加consoleで工程FAIL、allowlistを緩和しない。正式CI/保全は未完、総合PARTIAL/限定マージNO。
- 23:20 JST 第7便再開：本人の既存検証器総数/資源一覧追随承認後、同書込み審査成功。resource条件を緩めず欠測guard製品修正で同反例確認。局所04 Chromium7条件/21pair PASS、WebKitBLOCKED、独立限定原票監査PASS。最終正式CI/全監査/原ZIPはPENDING。

## 2026-11-16 JST 第8便（Issue #62）開始追補
PR #61統合main dbba2e7から専用branch。受入契約を先行固定し145–147、143 P3と現在READMEの補訂。既存144・原本/v10/lockを保護。Issue初回拒否・push認証不足・検証初回失敗は保持。局所単体42と旧回帰496/75 PASS、独立監査P2を同反例で補強中。詳細docs/wave8、正式CI/原証拠/独立最終レビューはPENDINGで総合PARTIAL・限定マージNO。Draft提出のみ、Stage3 HOLDを維持。

## 2026-11-16 JST 第8便正式初回の回帰整合
f81e4dfの12 workflowは10成功2失敗。Wave8専用成功と旧回帰失敗を分離。隔離BASELINEコピー不足・kanban資源集合不足・noJS総数旧値の3箇所を最小修正。旧失敗保全、同入力のRED/GREEN、44単体とnormal/4保全故障を確認。新HEAD正式CIと独立原証拠監査PENDING。製品・既存期待値の弱化・timeout変更なし。詳細docs/wave8/RESULTS.md。
