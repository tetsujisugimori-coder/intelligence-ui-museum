# Intelligence UI Museum v10 Stage 0–2 最終報告

確認日時：2026-10-26 21:44 JST

1. **総合判定：PARTIAL。** 公式6部品の直接導入・実ビルド・Chromium限定操作と16条件の表示計測は完了。未検証と依存リスクを残す。既存Siteの更新・新規Site登録・公開は実施していない。
2. **v09正本・保全：確認済み。** 後発の`intelligence-ui-museum-v09-117-exhibits-final.html`を採用。SHA-256 `327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97`。117 ID連続・名称重複0・11カテゴリー、v08 105件のID/名称/分類保持。HTTP GETした現行公開HTMLもbyte一致。初期ZIPは初期HTMLと一致しfinalとは不一致のため別版扱い。全117操作の回帰を済ませた意味ではない。
3. **公式調査：** npm `@openai/apps-sdk-ui@0.2.2`、gitHead/固定ソースcommit `0f00143c7a639906f1621fe58e1b6be7b5bea46d`。React 19.0.0、Tailwind 4.0.17、TypeScript 5.7.3、Vite 6.4.5を採用。公式peerはReact18/19・Tailwind4。公式CSSと@source設定を使用。Providerはrouter差替え用途でoptionalのため今回は未使用。ホスト通信なし。MIT通知同梱。公式README、npm metadata、package.json、license、source commitを保存。指定UI guidelines URLは取得できたが抽出がナビゲーション中心、StorybookはJSページで本文抽出不可。APIの根拠は配布物の型・実装・READMEを優先した。
4. **6部品の実装・操作：** Buttonクリック/Enter/Space/disabled/loading、Badge色と3variant、Selectマウス選択/Space/矢印/Enter確定/Escape/disabled、Switch Space/disabled、Tooltipキーボードfocus表示/Escape、Alert色/閉じるを確認。Selectは公式仕様でEnter単独展開なし。Tooltip hover・タッチ・安定した説明関連付けの追加確認は未達。
5. **真正性証拠：** `src/main.tsx`の6 import、公式exportsと実ファイル、lockfile integrity、npm metadata/gitHead、依存木、ビルドJS sourcemap、実操作を紐付けた。別担当がインストール済み公式distをnpm配布原版と全件byte照合し不変を確認。内部コピーによる代替なし。独自コードは状態、ラベル、説明、比較枠に限定。
6. **比較教材：** 公式6件、v09比較5件（082/016/085/047/086）。Badgeは対応展示なし。デスクトップ左右/モバイル縦、両テーマ。v09はsandbox iframeに隔離。元HTMLは無改変、viewerは対象表示用CSSとクエリ処理を追記した派生物。テーマ変更で比較側が初期化されることを明記。
7. **テスト：** 型検査/本番build、公式import/export/sourcemap/保全byte/dataset/sandbox/通知検査、v08照合/公開byte照合は成功。Chromiumで320/375/390/1280×light/dark×root font100/200%=16条件、6 sectionと横超過なしを計測。実ブラウザ操作/画像を保存。200%はroot fontでありOS文字拡大や比較iframeのv09文字200%とは異なる。アプリ起点のJS errorは取得範囲で未確認、拡張機能由来errorあり。WebKit・実機Safari・VoiceOver・全館回帰はUNVERIFIED。
8. **独立レビュー：PARTIAL。** 別担当が真正性・保全・v08照合・通知・静的テスト・最終差分と画像を確認。P2：依存木auditにhigh1/moderate1/low4残存。公式固定lodash等に由来。今回JS sourcemapにlodash本体とKaTeX本体は含まれず、実6部品での到達は未確認（完全な到達不能証明ではない）。P3：公式CSSに未使用KaTeX CDNフォントURL。初回の通知欠落は修正済み。教材checkboxが公式resetで見えない不具合も修正・再操作済み。react-remove-scroll-bar補足MITはupstream master由来で同一リリース時点の来歴は未証明。P0/P1は限定静的確認で発見なし。
9. **GitHub：管理先未確定。** `user:tetsujisugimori-coder Intelligence`、`intelligence-ui-museum`、`user:tetsujisugimori-coder museum`、`user:tetsujisugimori-coder UI`を検索。専用リポジトリを特定できず、別プロジェクトのLoading-museum/calculator-memoには追加しなかった。Issue・Draft PR・branch・commit SHA・pushは未実施。新規リポジトリも作成していない。検索で見つからないことをリポジトリ不存在の証明とはしない。
10. **成果物：** `intelligence-ui-museum-v10-stage0-2.zip`にソース・package/lock・実行可能dist・元版/初期ZIP/v08・manifest・出自一覧・比較表・第三者通知・静的/ブラウザ検証記録・画像・独立レビュー・Stage3設計を収録。展開後README参照。distは静的HTTPで動作。source再buildはnpm ciが必要。ZIP内SHA256SUMS.jsonで収録ファイルを照合可能。
11. **Stage 3：HOLD。** 静的別ルートへの隔離統合候補は成立。WebKit/実機/hover/全館回帰、依存リスク、KaTeX外部font、配信CSP、ライセンス来歴、GitHub管理先を解決・評価してから判断する。今回の正式公開なし。
