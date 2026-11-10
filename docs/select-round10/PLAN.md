# 第10回 Select診断：事前登録・実験実行手順
2026-11-10 JST / Issue #37・親 #28。ここは**事前登録した診断実験**であり、試行結果の報告ではない。第9回 #36 は診断基盤限定でmainにマージ済み。

## 問題と境界
第9回では前段なしは各環境3/3輪郭VISIBLE、前段ありは各3/3 ABSENT。ただしSelect DOMの空 `style=""` が2要素に差を作り、共通事前screenshotより前のsnapshotだけで同等性を評価していた。DOM差を見過ごして「前段操作による原因確定」としない。

固定条件はmain `61b670c89eccc0b23565344385c8ae13d6c893ae` を基準、Museum原ソース・SDK0.2.2・Playwright1.56.1・WebKit26、375×1000/light/root100%/DPR1、同一build。Windows実PC、Windows CI、Linux CIは別母数。headless Playwrightは物理入力ではない。直接focus → Space → Escapeで輪郭を観測し、旧ordinary option click失敗はNOT_TESTEDのまま。

## 5つの診断対照（各2arm×3pair / 環境別30回）
1. `prelude`: 前段なし/凍結操作列あり。focus前DOMが違えばUNCONFIRMED。
2. `prelude-normalized`: 1と同じ前段差だが、両群に同じ診断用空style除去処理を適用する。処理前後を採取。**除去処理が完全に無害とは断定しない**。
3. `empty-style`: 同一前段なしで、2要素だけへの空style属性追加の有無。対象選択が一意でなければFAIL。製品修正ではない。
4. `pre-screenshot`: 同一前段なし・同一probeでfocus前screenshotだけ有無を比較。before/after/focus直前のDOMを記録。
5. `full-probe`: 同一前段なし・撮影なしで、既存event+MutationObserver probeの有無を比較。Playwright traceとfocus後の4PNGは全群共通。probeなし群のイベント欠測は想定どおりで、イベント証拠が存在すると偽らない。

`tests/select-round10/plan.json` を採取前に固定。反復のAB/BAを交替、全trial fresh context/page。比較前のDOM全文書一致は主張せず、Select subtree/2つの対象属性/trigger computed style/geometry/scroll/viewportを対象として厳密比較する。focus直前に必ず測定し、必要ならbefore-photoも比較。DOMのReact生成ID置換で検査上の差を隠していないか独立担当が監査する。

## 実行
```sh
python scripts/prepare-work.py
npm --prefix .work/v10 ci --ignore-scripts --no-audit --no-fund
npm --prefix .work/v10 run build
npm --prefix tools/stage-a-browser ci --ignore-scripts --no-audit --no-fund
node --test tests/select-round10/contract.test.cjs
ROUND10_OUT=.work/select-round10 node tests/select-round10/run.cjs
ROUND10_EXPECT_HEAD=$(git rev-parse HEAD) ROUND10_EXPECT_PLATFORM=$(node -p process.platform) node tests/select-round10/audit.cjs .work/select-round10
```
Windows PowerShellでは環境変数を`$env:NAME = ...`で設定する。対象ディレクトリがすでに存在すればrunnerは中止する。LinuxではWebKit実行に必要なOS依存をセットアップ、Windowsも固定WebKitを事前用意する。source/buildと元の製品ファイルのhashを検証し、改変しない。

## 診断と監査
- `diagnostic COMPLETE`と`outline VISIBLE/ABSENT`は別。輪郭ABSENTでも収集完了にはなり得るが製品PASSではない。原因は常にUNKNOWNから開始。
- 比較器は失敗、欠測、slot入替、バージョン不一致、focus情報欠落、trace/PNG欠落、manifest不整合、偽のexit0を拒否。必須前段操作と中間snapshotを確認。
- `equivalence=UNCONFIRMED`なら因果判定を保留し、追加標本を自動取得しない。
- エラーやWebKit不足の場合はNOT_TESTED/FAILを保持して正常試行へ変換しない。収集を強行しない。
- 旧raw・CI原ZIP・第9回の結果は不変。新試行のraw JSON・PNG・trace・manifest・終了値は実行環境の別領域で保全し、独立担当が原ファイルと実画素を別計算で監査する。
- 現段階では**公開GitHubへのrawトレース・スクリーンショット自動アップロードはしない**。証拠を外部転送する前に秘密情報審査・保管先の明示承認が必要。CIには非秘密のexit値とハッシュのみに限定した報告を残し、rawの長期保全・独立レビューは未完として扱う。

## 最終判定の禁止事項
本PRは実験系と診断記録用。公式SDK・apps/v10製品・lock、archive、旧evidence、#23は変更しない。Stage 3 HOLD、旧persistent offscreen原因UNKNOWN、PR #23未受入、Sites非公開を維持。実PCでの再採取、CI原ZIP長期保全、第三者の独立原票監査が済むまでは本実験全体をPASSと呼ばずDraftを維持する。
