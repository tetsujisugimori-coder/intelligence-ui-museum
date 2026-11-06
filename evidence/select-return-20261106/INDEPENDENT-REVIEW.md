# S3-1-SELECT-RETURN 独立再レビュー

2026-11-06 JST。実装者とは別のレビュー担当が独自 harness を作成し再実行。

## 判定

ローカル候補の指定 P2 フォーカス復帰は限定 PASS。修正を妨げる指摘なし。v10 研究版全体の FAIL および Stage 3 HOLD は変更しない。リモート最終 HEAD/tree/CI との結合は未実施。

## 対象

- ベース main a5766c4dae9bcda791b57bb06c263a5036249343 / tree e1f1604a8db5d62d5c713407f30511bb8ab5e30f は依頼元提示値。独立リモート再照合待ち。
- main.tsx SHA256 56252779287a5b304d0e75345c89045ddd7f59c692bd41f859d0a1d4215d6910。
- select-focus-return.ts SHA256 0138534d5d40e1f8c033f9ea08a55c3d93255f26897121b2375a1a25bea12c61。
- 上記は apps/v10 と .work/v10-green/src で一致。

## 独立実測

Chromium 141、Playwright 1.56.1、各ケース fresh page + bringToFront。
A=320px/dark/root200%、B=1280px/light/root100%。trigger focus → Tab → Shift+Tab → Space で開く。

- RED: mouse カード / ArrowDown Enter / Escape × A/B = 6/6 BODY。修正前の失敗を独立再現。
- GREEN: 同 6/6 が実 trigger へ復帰。activeElement と trigger の厳密同一性。focus-visible も6/6 true。
- mouse / Enter は b、Escape は a を維持。
- 再開閉→選択 A/B 2/2 復帰。
- 外側 heading クリック A/B 2/2 閉じるが BODY を奪取しない。
- Tab A/B は修正前後とも popup 内 DIV に focus、popup は開いたまま。これは Tab 閉鎖成功ではなく同等性の確認。
- 24ケースの pageerror は0。
- 実 helper を TypeScript transpile して isolated DOM に適用: positive 1 + negative 12 全期待一致。noIntent、outsidePointer、outsideFocus、Tab、disabled、hidden、inert、negativeTabindex、detached、existingFocus、cleanup、windowBlur。これは合成 guard 検証であり全ケースの実ユーザー操作ではない。
- A/Enter screenshot を目視。フォーカス輪郭と選択値表示を確認。

## コードと SDK

Select.d.ts の公開 stable TriggerView slot を使用。helper は document / aria-expanded / aria-controls と標準 focus のみで構成。SDK が既に選んだ activeElement を上書きせず、lost focus 時のみ復帰。cleanup は observer と全 listener を解除。StrictMode の再 effect に対応。SDK 内部モジュールの import、patch、依存変更は見つからない。

apps/v10 と red/green の package.json / package-lock.json はそれぞれ完全一致。SDK dist red-green の recursive diff は0。これは同一性の確認であり registry tarball と独立再取得照合したとはしない。

## 証拠と限界

run.cjs / results.json / 24 PNG / guards.cjs / guards.json。実装者の probe/evidence は結果の代用にしない。元資料は上書きしていない。

WebKit、実Safari、実OS文字拡大、スクリーンリーダーは未実施。root200% は合成拡大。旧履歴の独立レビュー archive は今回こちらでは未取得・未評価。docs/DEVELOPMENT.md は部分snapshotに存在せず参照不可を記録。ルート AGENTS.md、README、docs/MIGRATION.md は確認。
