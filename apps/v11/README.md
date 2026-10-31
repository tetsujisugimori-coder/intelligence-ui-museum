# v11 — Intelligence UI Museum

117件のv09を基点に118〜123を追加した開発候補。公式OpenAI製品ではなく、追加展示はいずれもHTML/CSS/JavaScriptによる独自実装です。外部サービスへの送信はありません。v09原本と過去証拠は変更しません。

ルートで `python -m http.server 8765 --bind 127.0.0.1` を起動し、`http://127.0.0.1:8765/apps/v11/` を開きます。JavaScript無効時の名前の静的表示は旧117件のみです。検索・分類・テーマ・リセットはJavaScriptを必要とします。

`python apps/v11/verify.py` は123連番、旧117件の全データ、6件の名称・分類・出自を検証します。実操作試験は `apps/v11` を新しい `.work/v11-verification` へコピーして実施します。ローカルサーバーとPlaywrightおよびChromium/WebKitを別途用意し、`CODEX_PRIMARY_RUNTIME_NODE_MODULES`、必要に応じて `CHROMIUM_EXECUTABLE` / `WEBKIT_EXECUTABLE`、新規 `EVIDENCE_DIR` を指定して `node apps/v11/browser-test.cjs` および `node apps/v11/accessibility-test.cjs` と `node apps/v11/nojs-test.cjs` を実行します。既定URLは隔離コピーで、必要に応じて `MUSEUM_URL` を指定できます。証拠ディレクトリを使い回さないでください。

既存展示との差：19 Dateは日付、96 Multi-selectは同じリストの選択、74 Drag reorderは一列内順序、50 Tableと55 Meterは表／単一値、94 Command Paletteはコマンド検索、41 Toastは短時間の通知です。新展示はそれぞれ時刻、左右移送、列間移動、二次元の値、キー組合せ登録、履歴管理を扱います。

実機Safari・VoiceOver・スクリーンリーダーの実読み上げは未検証。Stage 3はHOLDです。2026-10-31 JST。
