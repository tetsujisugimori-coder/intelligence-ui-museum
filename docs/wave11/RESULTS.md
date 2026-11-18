# 第11便 実装・実測・保全結果
2026-11-17 JST / Issue #68 / Draft PR #69 / branch `feat/v11-wave11-154-156`。

## 現行判定への導線（2026-11-18 JST、履歴原文は保持）
- **最終ゲートの正本**： [PR #69の最終ゲート報告](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/69#issuecomment-6947404245)（検証対象HEAD `d16e9c58dadf3a382b327200ea9c03b5093c12c0`）。同HEADの15 workflow／20 job成功、専用Chromium／WebKit 14条件・各128操作PASS、P2 3件限定CLOSED、初回／最終専用原ZIPのLibrary保存後独立再取得照合PASSを報告。判定は**総合PARTIAL・第11便限定の技術受入PASS／独立レビューPASS／限定マージ推奨YES**。これは全製品の受入や実機・実AI連携の証明ではない。
- **状態の時点差**：本文中の「限定マージNO」「最終CI待ち」「PENDING」「未マージ」は、それぞれ当該記述を作成した時点の判定・作業記録。失敗や保留を消さず保持する。文書だけで最終版の再実行を証明したとは扱わない。
- **この文書追補の版**：上記成功は `d16e9c58dadf3a382b327200ea9c03b5093c12c0` に帰属する。この追補による新HEADのCI／差分は別途確認し、結果はPR #69の後続レビュー記録で明示する。旧HEADの成功を新HEADに移し替えない。
- **継続HOLD**：Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、旧原因UNKNOWN。実機Safari／VoiceOver／物理touch／OS文字拡大・実LLM／実メモリ／実エージェントはNOT_TESTED。Libraryの厳密な保持期限・外部ACL一覧はUNKNOWN。

## 判定と範囲
総合PARTIAL。154–156の固定架空教材について正式14条件PASS。製品・監査器の独立P2 3件は限定CLOSED。最終文書HEADの自動CI・原ZIP再保全を別ゲートとし、完了までは限定マージNO。Draft解除・実マージ・Sites公開なし。
Stage3 HOLD、v10製品受入NO、PR46 SUSPENDED、旧原因UNKNOWNを維持。実LLM/API/実メモリ/実エージェントの評価ではない。

## 基準と提出履歴
- 開始main: `5688d804756cc12bf6413a1964a2268f65927c03` / tree `c5832baa409201b99643025a375d35a2da986ef1`。PR67の統合を確認。旧本文の「未マージ」は当時の履歴として保持。
- 製品実装前契約: remote `079ffafd7499056ccfec4dc14bb7a32bc635ce69` / local `e6b923bd31f4a0660b4d3350fd8489e57edf239a`。両tree `c7be8f828d0cc2af2854ec143b156ceda6a98943`。
- 初回正式実測HEAD: `3e05971fa3b546dae1dd31d5e33b15004717d4e2` / tree `6e767ba38d613e76116a10cd3d545f9d674b8f33`。
- Git object APIで専用branchへ非force提出。CLI認証の追加なし。初回変更41pathは固定remote HEADから全byte/size/SHA-256読戻し一致。
- 結果追補による最終HEADとその自動CI/保存後照合は、自己参照commitを作らずPR #69の最終報告と本人限定補助証拠へ記録する。前HEAD成功を最終HEAD成功と呼ばない。

## 実装
156展示・11カテゴリー。154は固定検索語/整数重み/採用数による順位、155は架空記憶の範囲/期限/競合、156は固定担当/引継ぎ票/証拠版の形式検査。順位≠真偽、存在≠適用≠競合解決、形式受理≠真実≠作業完了を別表示。入力変更で失効、同値保持、Resetと起点focus、keyboard/タップを検査。
旧153全metadata・保護2539pathを保持。既存runner変更は156登録、新配信資源2件、隔離保全fixture追随のみ。集合/欠落/改変検査・過去判定・timeoutを緩めていない。新依存・lock変更なし。no-JSは117/156と静的117件を保持。全153展示の実操作を主張しない。

## 検証の区別
- 新単体264/264。専用CIでは新旧wave10単体合計522/522。局所選択回帰627/627、移行/原本保全PASS、normal保全+4破損拒否PASS。
- 独立別計算720入力、旧153metadata/2539files直接照合、同じ反例によるP2-UI/P2-AUDIT/P2-STALE再確認。詳細INDEPENDENT-REVIEW.md。
- 局所実測はlocal `46e2bff8f6d3c165305cc2250a3829045fb75f7c` / tree `005b1f6afbc28a759b3c23c62a11036a7d3fcc49`。Chromium7 PASS、WebKit7 BLOCKED（ホスト共有library不足）。正式版とsourceが異なるため正式14条件の代替ではない。OS設定変更/依存強行導入なし。
- 旧source回帰初回19/21は浅いcloneの歴史object欠落。unshallow後同テスト成功。初回単体188/189は重複証拠IDの分類曖昧さで、拒否維持の契約明確化。旧失敗原票を保存し製品RED→GREENと偽らない。
- P2-UIの旧244/248→新248/248は純粋状態反例。旧版実browser REDはNOT_TESTED。正式版scope操作は下記14条件に含む。

## 初回正式CI（attempt 1）
専用run `44074259302` / job `134008096996` / checkout `3e05971fa3b546dae1dd31d5e33b15004717d4e2`。pull_request event SHA `f55829133ef2dade404025b11fe265380cbb0802` はcheckoutとは異なるため分離記録。
Node22.23.4 / Linux x64 / Playwright1.56.1 / Chromium141.0.7390.37 / WebKit26.0。
- Chromium/WebKit各375/390/1280×light/dark、375dark+reduced+computed font2倍、計14/14 PASS。
- 各128操作。実状態・独立期待・表示・input・focus・overflow・console/pageerror・配信sourceの一致。
- 意味対照84pair（14シナリオ×3展示×2engine）、正常/故障または空値・境界の比較。全てを異常故障と呼ばない。
- 独立監査器負対照40件の正常ACCEPT→改変REJECT。原証拠不変。40は原票の実件数であり、準備時の38という見積りと区別。
- source25配信資源、execution14資源、14 HAR、14 trace、6代表画像、原票/ログ/manifestを専用ZIPに収録。
- 初回HEADの全15workflow・20checks成功をAPIで確認。専用以外の14workflowは結果・jobログの確認対象。専用ZIPの保全を他workflow全artifact保全へ拡大しない。最終状態一覧はPR最終報告と補助証拠へ記録。

## 保存後照合
Windows指定保管先の親フォルダは存在するが接続環境がread-onlyのため書込み不可。依頼の代替指定に従い本人のLibraryへ保存。共有公開リンクを作成しない。Libraryの正確な保持期限/外部ACL一覧はAPI未提供でUNKNOWN。
- 局所原票束: `PR69-Wave11-local-evidence-20261117.zip`、80,016,778 bytes、SHA-256 `23d20a03b977ee73ade28aa5ff76aaa282de1e56810b3f7fe1d7baa8a8302417`。293原ファイル＋custody manifest。別担当のLibrary再取得実物で全byte/size/SHA/CRC/manifest集合と全項目/trace7本内部CRC PASS。
- 初回正式原ZIP: artifact `14324636056`、144,509,134 bytes、公式SHA-256 `1098fe7ae246ce0b3f7ddd0dd3a6d9ac8ea086890230b93b280792dd7a65fca9`。GitHub期限2027-02-15T11:28:01Z。再ZIPせず原bytesをLibrary保存。別担当のLibrary別path再取得により全byte/外CRC/manifest406件/trace14内部CRC/source・Git・HAR/14条件×128操作/84pairs/負対照40件/6原画像目視PASS。初回監査側の「38件」見積りと非Git cwdでの失敗は原票を変えず別記録。詳細独立監査追補を参照。
- 専用workflowの失敗runはこの時点0件。局所BLOCKED・独立監査準備の失敗は別票として保持。

## 未検証・次の最小工程
最終文書HEADの自動CIと専用原ZIP保存後再取得を確認し、PRへ結果を追記する。実機Safari/VoiceOver/物理touch/OS文字拡大、全展示手動受入、実AI・実ネットワークサービス連携はNOT_TESTED。追加公開やマージは行わない。

---
## 作業中の履歴原文（当時の判定を保持）
# 第11便 結果（作業中）
2026-11-17 JST。総合PARTIAL・限定マージNO。実マージ・公開なし。
基準main5688d804756cc12bf6413a1964a2268f65927c03/tree c5832baa409201b99643025a375d35a2da986ef1。契約先行local e6b923bd31f4a0660b4d3350fd8489e57edf239a、remote079ffafd7499056ccfec4dc14bb7a32bc635ce69は同tree c7be8f828d0cc2af2854ec143b156ceda6a98943。CLI認証追加なし、Git object APIで非force提出。製品前契約を固定。

旧153metadata・2539保護filesの検査は保全であり既存全展示実操作の主張でない。旧runnerは156登録/新配信2資源への追随のみ。旧判定/timeoutは緩和しない。
独立指摘P2-UI:155scope通常設定不足を修正中。P2-AUDIT:156証拠行の監査射影不足を修正中。合成反例と実UIを区別。
初回単体188/189は重複証拠IDの分類曖昧さ（oracle RETURNED/製品INVALID）、契約拒否維持の分類明確化。製品RED→GREENとはしない。旧source回帰19/21は浅いcloneの歴史object欠落、unshallowで復旧確認予定。

正式CI、14条件、原ZIP保存後再取得、独立最終判定はPENDING。旧便の成功/ZIPを流用しない。Stage3 HOLD/v10NO/PR46 SUSPENDED/旧原因UNKNOWN。

## 独立事前レビュー追補
P2-UI: m1scope三択追加。純粋状態の同一4反例は旧244/248→新248/248、実ブラウザ旧REDではない。P2-AUDIT:順位/得点/証拠行/採用一覧の同時表示改変4反例を独立検出・修正後拒否。P2-STALE:結果null時に旧VALID表示を残す反例を拒否へ修正。独立正常合成原票受理維持。最新単体264/264、旧153全metadata/2539保護files独立照合PASS。正式CI/原ZIP監査は別ゲートとして未完了。
