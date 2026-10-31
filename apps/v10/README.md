# Stage 2-R current entry

Current decision: PARTIAL / Stage 3 HOLD. Read docs/stage2r-final-report.md and evidence/stage2r/independent-security-review/SECURITY-REVIEW.md. Root SHA256SUMS.json is regenerated for Stage2-R; docs/stage0-2-SHA256SUMS.json preserves the input manifest. Older docs/final-report.md and evidence outside stage2r are historical Stage0–2 records.

Reproduce: npm ci --ignore-scripts; npm run build; npm test; node scripts/verify-baseline.mjs. Browser runners require an external Playwright installation (used1.62.1, see environment.json) via CODEX_PRIMARY_RUNTIME_NODE_MODULES or compatible path; CHROMIUM_EXECUTABLE and WEBKIT_EXECUTABLE select installed browsers. Set APP_ROOT to absolute dist, EVIDENCE_DIR to an output folder, optional BEFORE_ROOT to unmodified original dist. node scripts/stage2r-browser.cjs and node scripts/stage2r-smoke.cjs serve dist in the same process and close browser/server at end. Synthetic root200 is explicitly separate from native browser font preference. No Sites publishing commands.

Git branch is a new local snapshot workflow only: no identified upstream repository or prior Git history. Git bundle contains local history for handoff; do not confuse it with pushed commits.

# Intelligence UI Museum v10 / Official UI Lab — Stage 0–2

独立実験。既存Sitesは変更せず、未公開。OpenAI公式製品ではありません。

## 起動

Node 22または24推奨。

```sh
npm ci --ignore-scripts
node scripts/licenses.mjs
npm run build
npm test
npm run dev
```

`npm run dev`は**ビルド済みdist**をVite previewで配信します。任意の静的HTTPサーバでもdistを配信できます。file://で直接開く方式は対象外。実験6部品にAPIキー・ChatGPTホスト・認証・CDNスクリプトは不要。

`public/qa.html`→distのqa.htmlは320/375/390/1280のiframe viewport、両テーマ、root font 200%の検証用。OSやSafariの文字拡大そのものではありません。v09比較iframe内の文字200%検証とは別です。

## 構造

- src/main.tsx: 公式6 import、React状態、解説、比較UI
- src/main.css: 公式CSS/Tailwind + 実験枠のみの独自CSS
- public/v09-original.html: 無改変保全HTML、公開版とbyte一致
- public/v09-viewer.html: 保全HTMLに対象だけ表示するCSS/読取クエリ処理を付加した派生物。元の117展示定義・イベントは維持
- dist/: 実行可能な静的成果物
- docs/provenance.json: import・版・固定commit・比較ID
- evidence/: 静的試験、依存木、audit、ブラウザ16条件、画像

Providerは公式README上optional。今回の6部品にはrouter/link componentのカスタマイズがないため未使用。ChatGPTホスト用window.openai等の接続は未実装。

公式パッケージの内部コードは変更していません。Button回数、disabled/loading制御、Badge/Alert色、Switch状態、Select選択値、Alert表示切替、説明とフレームは独自コードです。Tooltipトリガーは独自HTMLボタン、Tooltip本体は公式です。

## 制限

総合PARTIAL。Chromiumの限定操作・表示検証のみ。WebKit・実機Safari・VoiceOver・マウスhover単独検証は未実施。全117展示の操作回帰は今回実施していません。保全/公開byte一致と操作回帰を区別してください。

npm auditに残件あり。公式0.2.2の固定lodash等に由来し、原版変更で隠していません。配信JSのsourcemapにlodash本体/KaTeX本体は含まれませんが、到達不能の完全証明ではありません。公式CSSに未使用KaTeXのCDNフォントURLがあります。成果物全体の外部参照ゼロは未達。

第三者通知をpublic/THIRD_PARTY_NOTICES.txtに同梱。パッケージに通知がないreact-remove-scroll-barについて上流MITを補足。未使用依存にもライセンスmetadataを記録。

管理先GitHubリポジトリは検索で確定できず。Loading-museum/calculator-memoは別プロジェクトのため追加しませんでした。新規リポジトリ作成、Issue、push、Draft PRは未実施。
