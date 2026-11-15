# PR #61 正式原ZIP保全・独立監査

日時：2026-11-15 23:53 JST。Issue #60 / PR #61。過去の局所失敗・提出時PENDINGを上書きしない日時付き追補。

## 対象版と分離判定

- 正式実行HEAD `9c74d898fa534de6f5b380cc36b425fb854afa8c`、tree `f9e2aacc7a4fe1e865fbeabf3db30531e6e721c4`。
- run `43724015917` / attempt `1` / artifact `14166072555` / `v11-wave7-evidence`。開始時GitHub APIで全対応を再確認。Git commit objectのtreeも一致。監査開始時のPR HEADも同一。
- workflow：対象HEADの11 workflowは全てcompleted/success。第7便job内のブラウザ・fault・監査・負対照・manifest・upload各stepもsuccess。CI成功を原票内容や保存成功の代替にしていない。
- 原票内容：固定14条件、各26 snapshot（initialを含む364段階）、42正常／故障pair、原ZIP内21監査器負対照記録を独立照合PASS。
- 保存完全性：正式ZIP無改変保存・保存先実再取得・独立照合PASS。
- 独立監査：作成・保全担当 `/root` と別の `/root/independent_audit` が再取得実物から実質照合PASS。最大同時担当2、上限7以内。過去担当の報告を流用していない。
- **対象版の限定技術受入PASS、限定マージ推奨YES（提案のみ）。** 今回作成する文書commitは対象実行版へ読み替えず、変更一覧とCIを別途記録する。
- 総合PARTIALは実機等の対象外と証拠範囲注記を保持する意味で維持する。固定自動化範囲のPASSとは区別する。

開始時にはPRコメント0件・Windows保管先にPR61なしを確認。作業途中に[並行担当の23:48追補](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/61#issuecomment-6896360248)と[最終レビュー](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/61#pullrequestreview-5911323843)を読取り確認した。既存のLibrary原ZIP16本・補足資料保全はその担当の成果として保持し、今回のWindows正式原ZIP1本の追加保全・別担当監査と区別する。既存報告・資料を上書きしない。

## 正式原ZIPと保存経路

GitHub Actions artifact APIからバイナリ取得。正式ZIPは **107365453 bytes**、SHA-256 **51d3ed7e79dc2b37a8c568781b2061906b1b7a43862dd79c2729fbbab9caa827**。公式digestと一致。

保存前download → 本人指定Windows archiveの専用storageId → その保存先ファイルからarchive-readbackへCopy-Itemで実再取得。保存前コピーの再読込みで代替していない。3実物を別々に読み、全バイト・size・SHA一致。原ZIPは再圧縮・内部変更なし。展開物・再実行出力・文書は別領域。

668全ZIPメンバーのCRC正常。manifest667対象の集合・サイズ・SHA全件一致。manifest自身のみ対象外。これはZIP全体の公式digestとは別の検査である。[保全台帳](preservation-ledger.json)に取得元・storageId・各copy・照合時刻を記録。本人向け取得URL・認証情報は掲載しない。

専用保管フォルダーはNTFS継承を無効化し、現在の本人SIDのFullControlのみのallow ACEを設定。保存ZIPの継承ACLも確認。管理者による所有権取得等は未試験。ローカル保持期限UNKNOWN、GitHub artifactのAPI expires_atは2027-02-13T14:22:33Z。将来の可用性は保証しない。

## 実内容・独立範囲

独立担当は保存先再取得ZIPを直接読み、Git HEAD/tree/run/attempt/artifact、6実行source、17 HTML/JS/CSS配信資源×14条件のGit bytes・保存応答・HAR応答実bytesを照合。98 traceの全CRC/context/viewport/reduced-motion/条件URL/HAR page対応を照合。light/darkはcontext colorScheme指定ではなく製品body.light切替であり、traceのtheme clickとsnapshot BODY class、GitのCSS/handlerを別照合した。

固定14は両engine×375/390/1280×light/darkの12条件と、各engine375dark/reduced-motion文字実測2倍の2条件。重複・欠測なし。364段階の142到達性/経路、143算術/無効時の古い表示消去、144replay/branchを独立再計算し、表示・focus・2倍フォント3788標本を確認。

42pairは各engine21組。正常ACCEPT、故障は固定改変bytes・想定assertion/理由によるREJECT。起動失敗・timeout・予定外例外を検出成功に算入していない。resource故障の予定404と正常console/pageerror、cleanup等を区別。

原ZIP内audit-negative.jsonの21件は正常ACCEPT・改変REJECT・理由・originalUnchanged記録を直接確認。原票内の実行記録と、今回の再実行を区別する。詳細は[独立報告](independent-report.md)。

証拠scopeの限界：明示6実行sourceと17配信資源は実体照合したが、PNG helper/unit/manifest生成器等の全依存実体は原ZIPに収録されていない。Git上の対象コードは取得済みでも後作成コピーで実行当時の証明を遡及補完しない。旧回帰15原ZIPの再監査は今回の対象外。並行担当の注意事項を維持する。

## 監査器再実行（新規ブラウザ実行なし）

対象HEADをgit archiveした変更なしコードと、案件別`.work/pr61-audit-20261115`の新規展開コピー・専用TMPDIRを使用。Node24.20.0 / Python3.14.7 / Windows11、ディスク空き約386GB、物理メモリ約16.9GB・空き約1.2GBを観測（資源計測は実行中23:51 JST）。原ZIP・原票を変更していない。

WindowsApps python3不在は専用venvのpython3.exeで対応。初回HAR読取りは既定cp932でUnicodeDecodeError、失敗stderr保持。ソースを変更せずPYTHONUTF8=1で別展開コピーへ再実行し[14条件/42pair PASS](auditor-rerun-utf8.json)。負対照初回はsandbox hardlink EPERMで停止し記録保持。制限外の別コピーで再実行し[21/21正常受理・改変拒否・理由照合・原票不変PASS](negative-rerun-unsandboxed.json)。このstderr中の意図的missing trace/HARエラーはcatch後の理由検証と区別。いずれもexit0。

負対照runnerの出力flag wxに合わせ、workコピー内の既存audit-negative.jsonだけを同案件別領域へ退避。再実行のoriginalFileCount667はこの1ファイルを除いた集合であり、原ZIP内668メンバーを削除した意味ではない。公開用再実行JSONはローカルパスを伏字にした派生物、raw出力hashは[台帳](local-report-hashes.json)。

## 画像実見と別提案

独立担当が `chromium/webkit-375-dark-2-exhibit-142/143/144.png` と `chromium/webkit-1280-light-1-exhibit-142/143/144.png`、計12枚を実見。142の方向・循環表示、143入力/表/棒、144操作/時点/初期履歴に切れ・重なりを観測せず認読可能。Reset後最終状態の画像であり、選択中・無効編集中・branch途中の視覚確認へ拡張しない。

別修正提案：375px文字2倍の143表で40000が40/00/0へ途中折返しし、見出しも分割され一覧性が低い。欠字・誤値・遮蔽は観測せず、契約に数値非改行条件はないため限定監査FAILとはしない。数値を連続表示できるresponsive表の別提案として残す。製品/CSS/テスト/監査器/受入条件は変更しない。

## 維持する制限

Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、既存原因UNKNOWNを維持。実機Safari・VoiceOver・物理touch・OS拡大NOT_TESTED。Playwright WebKitを実機Safariへ読み替えない。新規実験・ブラウザ起動・CI手動再実行/dispatch・main変更・force push・Draft解除・マージ・公開・既存証拠削除なし。限定マージ推奨は対象版の技術提案であり実際のmergeはしない。
