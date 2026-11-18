# 第12便 157–159（2026-11-18 JST）

Issue #70。PR69の正式merge `db57a7bb` を開始点とした追加。Uncertainty & Abstention、Disclosure Boundary、Correction & Re-evaluationの固定架空教材を159展示・11分類へ実装中。過去の第11便本文の途中判定は歴史記録であり、PR69の正式マージ状態とは区別します。

[事前契約](docs/wave12/ACCEPTANCE.md) / [検証結果](docs/wave12/RESULTS.md) / [独立レビュー](docs/wave12/INDEPENDENT-REVIEW.md) / [保全台帳](docs/wave12/CUSTODY.md)。初回提出時点は総合PARTIAL・CI/独立レビュー/保全待ち、限定マージNO。Stage3 HOLD、v10受入NO、PR46 SUSPENDED、旧原因UNKNOWNは維持。

---

# 第11便 154–156（2026-11-17 JST）

Issue #68。PR #67 は merge 5688d804 として統合済み。以下の第10便「実マージなし」等は当時の履歴であり現在状態とは区別する。156展示・11カテゴリーを実装。Retrieval Rankingは固定検索順位（真偽保証なし）、Memory Scopeは架空項目の適用/競合、Agent Handoffは担当間引継ぎの形式検査。実LLM/API/実メモリ/実エージェントなし。初回正式HEAD 3e05971fで14条件×128操作・84意味対照・監査負対照40件が成立し、独立P2三件は限定CLOSED。専用原ZIPのLibrary保存後別担当再取得・source/HAR/trace/6画像監査PASS。総合PARTIAL、最終文書HEADの自動CIと原ZIP保全を残すため限定マージNO。詳細は docs/wave11/RESULTS.md。最終ゲート結果はPR #69の最終報告へ追記する。Stage3 HOLD、v10製品受入NO、PR46 SUSPENDED、旧原因UNKNOWN、実機NOT_TESTEDを維持。Draft提出まで、マージ/公開なし。

---

# Intelligence UI Museum

## 最終追補：第10便の限定受入（2026-11-17 JST）

**総合PARTIAL、第10便限定技術PASS・独立レビューPASS・専用2原ZIPの保全PASS、第10便に限るマージ推奨YES。** 実マージは行っていません。
判定対象は `7e4cd0b2fb1340d8fe96de33c43005b0aabd0c09` / tree `e6cb5ace0f9f86479064da3eaef77bb4eb0e8e83`、Issue #66 / Draft PR #67です。

153展示・11カテゴリー、151〜153の固定架空教材について、対象版の14 workflow・19 checks成功と限定受入を確認済みです。前回P2三件（旧runnerの150固定、wave5〜9の配信資源不足、保全fixture不足）は限定CLOSED。no-JSの117/153表示と静的117件を維持しています。
詳細は[検証結果](docs/wave10/RESULTS.md)と[独立レビュー](docs/wave10/INDEPENDENT-REVIEW.md)を参照してください。専用2原ZIPの保全PASSは他13workflowの原ZIPや実機検証へ拡大しません。

- [閉鎖確認レビュー #5930182776](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/67#pullrequestreview-5930182776)
- [独立レビュー・専用原ZIP保存後再取得監査 #5929842327](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/67#pullrequestreview-5929842327)
- [提出最終報告（A〜O）](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/67#issuecomment-6932718774)
- [対象版の専用CI run 43978814869](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/43978814869)

### 版と今回の作業境界
この追補は上記対象版の確定結果を文書へ反映するものです。製品・oracle・監査器・workflow・lock・保護原物は変更しません。追補を含む新HEAD/treeと自動CIはPR #67の追補報告で別に記録します。上記版の実行・原ZIPを新HEADの実行証明へ読み替えず、今回原ZIPを再取得した、独立ブラウザを再実行したとも主張しません。
Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、旧原因UNKNOWN、実機Safari・VoiceOver・物理touch・OS文字拡大NOT_TESTED、Sites公開NOを維持します。以下の失敗・PENDING・browser BLOCKED・途中判定は過去時点の履歴です。

---

## 以下は実装・検証途中の履歴（上記の最終追補と区別）

## 2026-11-17 JST：第10便の現在状態
第9便PR #65はmerge `f065515b3f52ade79a7e057abb86f385dfcce5e9` で統合済みです。最新mainを起点にIssue #66の第10便151〜153を専用branchで追加しています。153展示・11カテゴリーの候補であり、下記の「147展示・第9便実装中」は旧時点の履歴です。

- 151 Context Budget Workbench：独自容量単位と必須項目・優先順位による決定的な選別。実token数ではありません。
- 152 Tool Call Inspector：架空呼出しの引数・許可・ID対応と固定模擬応答。実ツール通信なし。
- 153 Prompt Regression Comparator：固定旧新版出力の構造条件回帰。LLM評価や一般品質保証ではありません。

受入契約：[docs/wave10/ACCEPTANCE.md](docs/wave10/ACCEPTANCE.md)。正式CI・独立レビュー・証拠保全の完了前は総合PARTIAL・限定マージNO。Stage 3 HOLD、v10製品受入NO、PR46 SUSPENDED維持。マージ・公開はしません。


UIを操作して、状態・仕組み・出自を比較する教材。OpenAIの公式製品ではありません。

2026-11-16 JST現在のmainは第8便（PR #63、merge f5b1aef）まで統合済み、147展示・11カテゴリーです。第9便148〜150はIssue #64の専用ブランチで実装・検証中です。Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDEDを維持します。OpenAI公式部品や実製品と同等とは主張しません。

開発管理先：[tetsujisugimori-coder/intelligence-ui-museum](https://github.com/tetsujisugimori-coder/intelligence-ui-museum)。過去の移行・各便の判定はその時点の記録であり、現在のGitHub状態と区別します。PR経由・force push禁止・人間によるマージ判断を守ります。

## 構成

|場所|用途|
|---|---|
|`legacy/v09/index.html`|117展示・11カテゴリーの既存基準版。原本byte保持|
|`apps/v10/`|Stage 2-R2の公式UI比較実験。依存lockと既存証拠を保持|
|`archive/`|初期版、旧Git bundle、patch、同定記録。配信対象外|
|`reviews/stage2r2-20261030/`|最新の独立レビュー原文と証拠|
|`docs/`|移行記録、開発手順、残件、Issue・PR本文案|

開始は [開発手順](docs/DEVELOPMENT.md)、現在の判定は [GitHub移行報告](docs/MIGRATION-GITHUB.md)、初回準備記録は [移行準備報告](docs/MIGRATION.md)、残件は [BACKLOG](docs/BACKLOG.md) を参照。

```sh
python3 scripts/verify-migration.py
npm run test:runner
python3 scripts/prepare-work.py
npm --prefix .work/v10 ci --ignore-scripts
npm --prefix .work/v10 run build
npm --prefix .work/v10 test
```

初回移行時の記録：mainは運用説明のみとし、ソース移行は `chore/github-migration` のDraft PRでレビューします。GitHub正式移行完了後は、Issue→作業ブランチ→検証→Draft PR→独立レビュー→人間のマージ判断を基本とします。

Issues #12 / #13 の文字拡大と Kanban 表示の自己検証は [記録](evidence/zoom-issues-12-13-20261103/README.md) を参照。合成文字拡大は OS 設定の代替ではありません。

Issue #15のKanban画像回帰検査は [設計・再現手順](docs/KANBAN-VISUAL.md) と [新規証拠](evidence/kanban-issue-15-20261104/README.md) を参照。独立レビュー前はDraft、Stage 3 HOLD。

## 2026-11-14 JST：第3便（PR #53マージ済み）

132展示・11カテゴリーの候補。130 Editable Data Grid、131 Schema Form、132 Gantt Editorと127–129説明登録の修正。基準はPR51マージ後main。旧記録は当時の結果として保持。仕様と受入条件は [計画](docs/v11-wave3/PLAN.md) を参照。正式結果は対象HEADの証拠照合後に記録する。Stage3 HOLD、v10受入NO、Draft提出まで。

## 2026-11-14 JST：第4便（PR #55マージ済み）

135展示・11カテゴリー。133 Calendar Scheduler、134 Faceted Search、135 Master–Detail Inspector、124–126説明登録の局所修正。基準main `d196ba9`（PR53統合後）。[固定契約](docs/v11-wave4/acceptance.md)・[試験計画](docs/v11-wave4/browser-plan.md)。旧結果と原本を保持し、今回の技術受入・CI・保全は別判定。Stage3 HOLD、v10受入NO、PR46 SUSPENDED。

## 第5便（PR #57マージ済み）
Issue #56: 136–138。最終HEAD345a44cの技術検証・正式CI・原証拠照合完了後PR57統合。旧記録は当時の判定。Stage 3 HOLDを維持。

## 第6便（PR #59マージ済み：2026-11-15確認）
Issue #58、139–141（Linked Views Explorer／Conflict Resolution Editor／Provenance Explorer）を追加し、全141展示・11カテゴリー。受入条件は事前固定の[契約](docs/wave6/ACCEPTANCE.md)を参照。
検証対象実装HEAD `c9ce4490db96148421f706d243e6a52bba39c50a` で正式10 workflowすべて成功。Chromium／WebKitの固定14条件、故障・正常対照34組、監査器負対照11件、別担当による監査器再実行と代表画像確認を完了。原ZIPはLibrary保存後に実物を再取得し、別担当の全バイト・SHA-256・CRC照合PASSを記録した。旧HEADの`E2BIG`失敗と旧原票の修正後再監査は保持し、新HEADの正式成功とは区別する。
第6便の限定技術受入PASS、限定マージ推奨YES。実機Safari・VoiceOver・物理touch・OS文字拡大はNOT_TESTED、Libraryのアクセス範囲・保持期限は未確認。Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、既存原因UNKNOWNは維持。製品全体の受入・公開は許可していない。

## 第7便（Issue #60：実装・検証中）
142 Dependency Impact Explorer、143 What-if Scenario Workbench、144 Interaction Replay Timeline。固定架空教材で144展示・11カテゴリーへ拡張します。[受入契約](docs/wave7/ACCEPTANCE.md)を製品実装前に固定しました。正式14条件、独立レビュー、最終CI・原証拠保全は未完了。完了・PASS・マージ済みとは扱いません。

## 2026-11-16 JST 現況追補
PR #61はマージ済み。上記「第7便実装・検証中」は以前の履歴記述です。第8便の契約は[docs/wave8/ACCEPTANCE.md](docs/wave8/ACCEPTANCE.md)。145–147と143 P3の局所改善、147展示11分類。正式CI・独立レビュー・保全は結果文書へ分離して記録します。Stage3 HOLDは継続。

## 2026-11-16 JST 第9便（Issue #64）
148 Structured Output Validator、149 Evidence Coverage Matrix、150 Evaluation Rubric Comparator。固定架空のJSON適合、主張別根拠、評価重みを操作する教材。事前[受入契約](docs/wave9/ACCEPTANCE.md)に基づき実装中です。前便の成功を今回の正式CIに流用せず、実サービスの自動評価と区別します。全150展示11分類。
