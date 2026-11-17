# 第10便 検証履歴

## 最終追補：第10便の限定受入（2026-11-17 JST）

**総合PARTIAL、第10便限定技術PASS・独立レビューPASS・専用2原ZIPの保全PASS、第10便に限るマージ推奨YES。** 実マージは行っていません。
判定対象は `7e4cd0b2fb1340d8fe96de33c43005b0aabd0c09` / tree `e6cb5ace0f9f86479064da3eaef77bb4eb0e8e83`、Issue #66 / Draft PR #67です。

### 確認済み結果と母数
- 対象版の14 workflow・19 checksは全件completed/success、attempt 1。専用run `43978814869` / job `133689637688`。
- Chromium/WebKitの正式14条件、各71操作、40正常/故障組、40監査負対照。40組は14条件内の実UI操作からの抽出であり、別ブラウザ試行として加算しません。
- 正式専用単体342件（第10便258＋第9便84）。独立fresh checkout再実行355件（上記342＋統合13）。局所459件・独立10,148プローブとも範囲が重なるため合算しません。
- 153展示・11カテゴリー、旧150metadata全項目、保護2,529ファイル、migration302件を確認。no-JSは117/153表示、静的117枚の期待を保持。
- 前回P2三件は限定CLOSED：runner総数153へ厳密追随、wave5〜9のwave10.js/cssを含む配信/収集集合の完全化、保全fixtureへのbaselineと保護原物の独立コピー。正常exit 0と既存4改変exit非0の対照を維持し、timeout・期待集合を緩和していません。

### 保全の確認範囲
既存独立監査記録に基づき、初回専用run `43977574668` / artifact `14281711214`（99,998,845 bytes）と最終専用run `43978814869` / artifact `14282807574`（95,689,518 bytes）は、無改変保存後に別担当が実物を再取得し全byte・公式size/digest・SHA-256・CRC・manifest・Git source・HAR・HEAD/treeを照合済みです。初回版を最終版へ流用していません。
各ZIPはCRC371件、manifest370件、実行source11件、配信23資源×14条件=322件。両engine375px/dark/文字2倍×3展示の6代表画像を独立目視。全画像・全環境の視覚確認ではありません。
他13workflowの原ZIPは再取得保全対象外。実依存バイナリ全収録・当時runtime全byte再現性、Libraryの将来保持期限・アクセス範囲全体はUNKNOWN。今回の文書追補担当はこの監査記録を確認したのであり、新しい保存後再取得監査を行ったわけではありません。

### 公開根拠
- [閉鎖確認レビュー #5930182776](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/67#pullrequestreview-5930182776)
- [独立レビュー・専用原ZIP保存後再取得監査 #5929842327](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/67#pullrequestreview-5929842327)
- [提出最終報告（A〜O）](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/67#issuecomment-6932718774)
- [対象版の専用CI run 43978814869](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/43978814869)

### 版と今回の作業境界
この追補は上記対象版の確定結果を文書へ反映するものです。製品・oracle・監査器・workflow・lock・保護原物は変更しません。追補を含む新HEAD/treeと自動CIはPR #67の追補報告で別に記録します。上記版の実行・原ZIPを新HEADの実行証明へ読み替えず、今回原ZIPを再取得した、独立ブラウザを再実行したとも主張しません。
Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、旧原因UNKNOWN、実機Safari・VoiceOver・物理touch・OS文字拡大NOT_TESTED、Sites公開NOを維持します。以下の失敗・PENDING・browser BLOCKED・途中判定は過去時点の履歴です。

---

## 以下は実装・検証途中の履歴（上記の最終追補と区別）
2026-11-17 JST。

## 局所
事前契約a5a1d6e、初版1e52081、browser/監査11e7efb。主製品/oracle試験255件から独立指摘3反例を追加し258件PASS。旧wave1〜9とresult契約を含む実行は456件PASS（追加3件前）。正式CIとは別。
最初の広いtest globは依存未配置・専用TMPDIR未指定・新source未作成で失敗。setup障害であり意味故障REDに数えない。専用領域で再実行。
旧source closureのwave10追加に伴い、lexical sortの期待順不一致を同じ正常合成fixtureで確認→期待集合のsortのみ変更してGREEN。集合要素・拒否条件を削減していない。

## ブラウザ
local01 Chromium7条件はsocket Operation not permitted等で全てlaunch前BLOCKED。意味操作0件、HAR/trace/視覚NOT_TESTED。回避・設定変更・再試行なし。正式GitHub14条件は新HEADで別実行する。local01は製品REDではない。

## 独立指摘
IR01/02の同3反例は修正前258件中3FAIL→修正後258PASS。IR03は正常合成原票ACCEPT＋6誤受理→正常ACCEPT＋同6拒否。旧oracle/auditor原物・RED/GREENを案件保全へ残す。初期152公開matchResponsesの静的指摘は最初の試験時点で修正済みのため修正前RED未実施。

## 判定境界
正式CI・独立原ZIP読戻し未完時点で総合PARTIAL、限定マージNO。新展示・既存保護・実機未検証を分離する。旧FAIL/UNKNOWNは保持。最終判定はPRの版付き追補で行う。

## 初回正式CI c26af501の統合失敗履歴
旧wave1の合成保全fixtureが新wave10 baselineを収録せず正常例でFAIL。旧wave1〜9 runnerに登録数150、wave5〜9配信source生成にlength9が残りFAIL。初回原ログを保存。登録数153とsource10便へ厳密追随し、fixtureにbaseline/2529保護原物の独立copyを追加。既存4故障の拒否は維持し、追加10対照は修正前10FAIL→修正後既存2+新10=12PASS。独立担当が9runnerについて指定count/closure差分以外byte不変、fixture故障条件不変を確認。初回正式FAILを成功へ変更せず、次HEADで正式再検証する。
