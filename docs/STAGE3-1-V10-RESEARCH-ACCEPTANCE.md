# S3-1 v10固定研究版 受入計画と証拠棚卸し（提案版）

- 記録日：2026-11-05 JST
- 管理Issue：[#18](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/issues/18)
- スコープ親：[#17](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/issues/17)（S3-0 提案・独立レビュー待ち）
- Stage 3 HOLD：[#5](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/issues/5)
- 判定：**NOT_TESTED（現行HEADのS3-1統合受入）**。本書作成は試験実施でも受入でもない。

## 1. 目的・信頼境界

v10の研究版は`@openai/apps-sdk-ui@0.2.2`由来の Button / Badge / Alert / Switch / Select / Tooltip を直接importし、独自の説明・React状態・v09比較フレームで使う固定実験。公式部品の出自を説明でき、ローカル隔離環境で再現・操作でき、正常と故障を見分ける試験器を備えることを受入対象とする。公式製品の全面的な品質保証、ChatGPTホスト連携、一般公開、ユーザーの既存Sites更新は対象外。

- 保護：`legacy/v09/index.html`（117展示/11分類、歴史原本）、`apps/v10/`の採取時点の固定パッケージ・lock・公式import・過去証拠、レビュー。
- 信頼した隔離コピー、127.0.0.1で実行。研究用HTTP runnerを敵対者が並行改変するrootに対して安全と主張しない（Issue #9）。
- 許可：読取、隔離再現、必要な局所修正の別Issue化、正常/負対照の新規保存、独立レビュー。
- 不許可：依存の無断一括更新、正式公開、Sites操作、過去証拠上書き、全117展示の操作成功主張。v11常設展示の受入・マージは独立したC系ゲートで判断する。

## 2. 既存資料と「証拠種別」の区別

| 項目 | 現存資料で支持できる範囲 | 2026-11-05の新規実行 |
| --- | --- | --- |
| 6公式importと出自 | `apps/v10/docs/provenance.json`に0.2.2・source commit・直接import・`official_modified=false`を記録。Stage2-R2の独立レビューが取得tgzとlock・installedを照合 | NOT_RUN |
| v09原本保全 | Stage2-R2独立レビューの117ID/11分類、原本SHA-256 `327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97`。過去HEADの証明 | NOT_RUN |
| 再現ビルド | Stage2-R2の独立2buildでdist 8/8 byte一致、同梱distも一致（歴史的な固定実験） | NOT_RUN |
| runnerのC-01/C-02 | 2026-10-30時点の独立reviewでは合成故障を誤PASS。後続PR #7は局所修正・独立レビューを経てマージ済み。後続結果の対象HEAD・証拠を再収集して判定 | NOT_RUN |
| Button/Select表示 | Stage2-Rの両engine・幅・テーマ・root実験と根本修正資料がある。Stage2-R2は独立GUIが環境起動前に停止しfocus重点2条件が未確認 | NOT_RUN |
| その他6部品・実キー | 旧main/smokeの提供実行証拠と一部代表key試験あり。最新HEADで全matrix独立PASSの根拠として流用しない | NOT_RUN |
| 依存/CSP/ライセンス | 2026-10月の固定lock監査と未解決条件を記録。研究用隔離受入と公開リスク承認は別 | 対象外（新規監査はS3-2で必要） |

歴史的な独立レビュー：[2026-10-30 FINAL-REVIEW](../reviews/stage2r2-20261030/FINAL-REVIEW.md)。修正履歴：[PR #7](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/7)、[Issue #4](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/issues/4)。現行branchのmain SHA/treeは着手時に取得して別の検証記録へ記載する。旧レビューの`66032de7...`は「今回のHEAD」を意味しない。

## 3. 受入検査契約

| ID | 検査 | 成功条件 | 開始時状態 |
| --- | --- | --- | --- |
| T1 | 対象の同定 | main固定HEAD/tree、対象ファイルhash、公式import/package/lock、v09原本の保全を再照合。対象に対応しない証拠は受理しない | NOT_RUN |
| T2 | 再現ビルド | `verify-migration`、runner契約、型/build/test、baselineを隔離コピーで実行し全終了値とログを記録。2つの独立した出力先でdistハッシュ比較 | NOT_RUN |
| T3 | 6部品の状態遷移 | Button（click/Enter/Space/disabled/loading）、Badge/Alert、Switch、Select（accessible nameと値、keyboard）、Tooltip（表示とfocus）を実ブラウザで観測。独自教材状態と公式コンポーネントを区別 | NOT_RUN |
| T4 | focus重点2条件 | 320 dark root200、1280 light root100を**両engine**でTab/Shift+Tab。activeElement/:focus-visible/outline幾何/PNG/pageerrorを取得。「active=false」だけで製品故障とも成功とも判定しない | NOT_RUN |
| T5 | 代表matrix | Chromium/WebKit×320/375/390/1280×light/dark×root100/200＝32条件。clip・横overflow・主要状態・keyboard・console/pageerror・CSP観測。既存提供40条件と独立実行を混同しない | NOT_RUN |
| T6 | 負対照・runner | 通常PASS+exit0、Alert再表示不成立・pageerror・focus輪郭消去・保存失敗などはFAIL+exit非0。件数欠落、結果JSONの矛盾、HEAD不一致を緑にしない | NOT_RUN |
| T7 | 証拠の独立性 | 生成者/独立レビュー担当、実行日時、ブラウザ、OS/Node/lock、HEAD/tree、画像/JSON/log/hash、再現コマンド、NOT_TESTEDを保存 | NOT_RUN |

T3は表示だけでなく、画面の観測値と実際の状態変化の整合を確認する。T5のmatrixは一律にあらゆる操作を32重複検証する宣言ではない。操作別の実施条件と期待値を事前に固定し、どの条件がカバーされたかを機械可読で残す。正常資料の画像目視とブラウザ試験成功は別に記録する。

### 最優先：focus再検証

2026-10-30の独立レビューでは提供16条件のfocusが14/16。未確認は320 dark root200、1280 light root100。独立GUI環境が起動せず、製品不具合は確定しなかった。

再実行時は同一HEAD/フォント/viewport/engineで、Tab開始時のフォーカス位置、操作でのactiveElement、`:focus-visible`、computed outlineと描画PNG、コンソール・pageerror時刻を結合した証拠を採る。前の要素がフォーカスされたままであればTabの順序の問題も調べ、要素自体の輪郭消失と混同しない。合成root200は実OS/ブラウザのネイティブ文字200%と区別する。重点2条件を「未テスト」のまま研究版全面PASSにしない。

## 4. 隔離した基本実行手順（実行記録ではない）

```sh
python3 scripts/verify-migration.py
npm run test:runner
python3 scripts/prepare-work.py
npm --prefix .work/v10 ci --ignore-scripts
npm --prefix .work/v10 run build
npm --prefix .work/v10 test
(cd .work/v10 && node scripts/verify-baseline.mjs)
```

実行は固定HEADで、`.work/`など新しい出力先を使用する。Windowsで`python3`がなければ`python`を用いる。公式ブラウザ試験は`apps/v10/README.md`の`APP_ROOT`/`EVIDENCE_DIR`/Playwright実行環境に従い、`node scripts/stage2r-browser.cjs`と`node scripts/stage2r-smoke.cjs`を隔離buildに対して起動する。必要環境変数を記録し、Windowsでの無条件動作を約束しない。実行前に対象HEAD・各出力の衝突防止、終了値、失敗/正常期待を確認する。

## 5. S3-1の判定ルール

- **PASS（研究限定）**：T1–T7の採用契約が実際に完了し、重大な未説明の矛盾がなく、実装に関与していない担当が固定HEADの証拠と必要な独立実行を再確認。限定用途を明記。
- **PARTIAL**：保全/実装の有用な成功はあるが、独立GUI・重点focus等の必要条件が未完了、またはリスクが残る。どの範囲まで言えるか記す。
- **FAIL**：固定対象の必須条件で実故障/誤PASSなどを再現し、受入契約を満たさない。
- **NOT_TESTED / BLOCKED**：実行無し/環境・権限等で着手不能。過去の成功やCIを新規実行の代わりにしない。
- **S3-2公開可否**：S3-1 PASSから自動承認しない。公開asset/CSP/network/認証/ライセンス・依存到達性は親#5とS3-2の別ゲートでHOLD。

旧監査のhigh1/moderate1/low4は歴史値であり最新セキュリティ評価ではない。`react-remove-scroll-bar@2.3.8`の配布LICENSE来歴とKaTeXの外部font/CSPは未解決。研究用の閉じた環境での限定受入を、第三者への安全配信やライセンス承認と読み替えない。実機Safari・VoiceOver・全117操作をS3-1の無条件必須に増やさない。

## 6. 次に保存するべき証拠

- `evidence/stage3-1-<date>/IDENTITY.md`：main HEAD/tree、v10 fixed baseline、各出力/lock/環境
- `.../RUNS.md`＋生JSON/ログ：実行・子process・exit・検査件数
- `.../FOCUS.md`＋PNG：重点2条件と負対照
- `.../REVIEW.md`：独立レビューが読んだ対象、追加独立試験、判定、未検証、残件

証拠は今後の実行で新規生成。**本PR作成時点では、上記evidenceは未生成・未実行。** 原本と過去のレビューを上書きしない。試験結果の証明と受入設計の完了を混同しない。

## 7. 作業分担・ゲート

1. 主担当：固定HEADで隔離再現、契約に沿う実ブラウザ・失敗検出、証拠保存。
2. 八兵衛など独立担当：原資料を事前に熟読し、実装に参加せず固定HEAD/treeに対し証拠の独立再計算・独自反例/ブラウザ確認・漏れの検出。
3. 主担当：P1/P2は局所修正/追加検証、P3はIssue管理。再修正があれば変更HEADで再レビュー。
4. ユーザー：研究版の限定マージ/受入判断。S3-2公開移行/既存Sites変更は別途明示指示が必要。

**今回のDraft PRは受入計画・歴史証拠棚卸しのみ。S3-1最終PASSではない。Draft解除やマージは行わない。**
