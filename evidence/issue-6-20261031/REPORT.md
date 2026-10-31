# Issue #6 — 実装者の受入記録

2026-10-31 JST。独立レビューではありません。base は PR #7 の `910b8c511674b3a1832531f521f94327adee679e`（Stage A）。PR #7 の差分を含む状態で確認し、Stage B のPRはそのブランチを比較対象とする。mainは `98698b0cf7442baef9d6169466ee06ed9de602ad`。

| ID | 展示 | 判定 | 確認した主な操作 |
|---|---|---|---|
|118|Time Picker|PASS|範囲外・最小最大の逆転、12/24表示、時・分のEnter/タッチ増減、リセット|
|119|Transfer List|PASS|選択・左右移送・全移送・空選択・Undo・リセット|
|120|Kanban Board|PASS|列間ドラッグ、キーボードの移動先選択・Enter、移動後フォーカス、Undo、タッチ代替|
|121|Heatmap|PASS|データ切替、数値セル選択、強度変更、凡例、リセット|
|122|Keyboard Shortcut Recorder|PASS|記録、タッチ代替、登録、重複、解除、予約組合せ拒否、リセット|
|123|Notification Center|PASS|通知発生、ライブ領域更新、個別・一括既読、削除、未読数、リセット|

PASSは下記の環境・操作の範囲での自己確認で、全環境や実読み上げの保証ではない。

- `final-browser-results.json`: Windows、Node 24、Playwright、Chromium 151.0.7922.34 / WebKit 26.0。375、390、1280px × ライト／ダーク × 2エンジンの12条件。検索・分類・テーマ・6展示主要操作・ページエラー・文書幅を確認、12/12 PASS。各条件はreduced motion有効。自動化された実ブラウザ操作。
- `final-additional.json`: 同2エンジン、375/390pxの4条件。旧Primary/Select/Modal、無効時刻と空移送、Tabと3pxフォーカス、タッチ、予約キーの非抑止（合成キーイベント）、リセット、200%ルート文字拡大時の文書幅、4/4 PASS。これはネイティブのテキストのみ拡大ではない。
- `final-nojs.json`: JavaScript無効では両エンジンで旧117件と「117 / 123 展示（静的表示）」を確認（2/2）。
- `screenshots/`: Chromium 390pxで各展示の初期状態をライト／ダーク撮影。実装者が全6展示の画像を確認。操作後の状態は自動試験結果で確認。
- 初期試験ではドラッグ開始位置、WebKit記録開始後のフォーカス、200% WebKit時刻入力のはみ出しが失敗し修正。`initial-browser.json`、`initial-zoom.json` は修正前の失敗を保持。別途WebKitの標準時刻入力で矢印キーが値を変えなかったため、時・分の増減ボタンを追加した。
- `stage-a-smoke.json`: Stage A修正runnerをv10隔離コピーで再実行し Chromium/WebKitの12/12 PASS。Stage B 6展示の確認とは別。
- `python apps/v11/verify.py`: 001〜123の連番、旧117件のデータ全体の一致、新規6件の名称・分類・出自を確認。v09原本 SHA-256 `327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97`、293948 bytes。302 bundleハッシュ・保護証拠・117件/11分類の既存保全検査もPASS（Windows Git autocrlf=false）。runner契約20/20 PASS。
- 実機Safari、VoiceOver、スクリーンリーダーの実読み上げ、全117展示の実操作は未検証。キーボード予約はOS/ブラウザ固有のものを完全には列挙できない。JS無効時の静的名前一覧は旧117件のみ。Stage 3 HOLDを維持。

実機、読み上げ、フォーカス順、予約キーの網羅性、展示の教材品質、差分と証拠保全について独立レビューを依頼する。マージ判断は独立レビューまで保留。
