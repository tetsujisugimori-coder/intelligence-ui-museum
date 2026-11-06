# S3-1 Tooltip #24：RED保全と製品修正候補（2026-11-06 JST）

対象：Issue #24、再受入 #22／Draft #23、製品修正Draft #26。Stage 3 HOLD継続。公開・Draft解除・マージなし。

## RED：変更前の独立ブラウザ実行
- 元製品 main `77d30ac54e35b8a6408fb5f56db4697adff8a452`、公式SDK `@openai/apps-sdk-ui@0.2.2`。
- Chromium 375×1000 / dark / root200%、fresh20回すべてで同じTooltip triggerへTab復帰後、focus-visibleを保持したまま説明が消失。
- focus→open→祖先scroll→removeを観測。Radix内部との因果は単独イベント列だけでは断定せず、修正介入で検証する。
- 変更前原JSON：`evidence/s3-reaccept-20261106/independent/tooltip-return/results.json`。画像・イベント原本：固定#23 `evidence/s3-reaccept-20261106/raw/independent-local.tar.gz`。REDをGREENで上書きしない。

## 修正候補
`apps/v10/src/main.tsx`の教材Tooltipだけを変更。公式の`Tooltip` import/SDKは維持し、triggerにフォーカスがある間だけ`forceOpen`を有効にする。スクロールによる意図しない閉鎖要求に抗し、Escapeでの閉鎖、blurでの自動制御復帰、Tab再入時の再表示は残す。マウスhoverはSDKの通常制御を保持。

製品修正commit `97f8d03135f054b576d1399a03828d2b737a76ee`。画素ではなく、フォーカス・可視状態・正規キー入力の一貫性を検証対象とする。

## 修正後の専用検証（自己試験）
`tests/s3-reaccept-independent/tooltip-return.cjs`をChromium/WebKit×fresh20回で実行。復帰後2rAF時点の可視、Escape閉鎖、blur閉鎖、再focus開放、hoverと離脱、pageerrorをチェック。

専用CI初回run [42214003649](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/42214003649)：**40/40 PASS（Chromium20/WebKit20）**、型/buildと既存`npm test`成功。原票 artifact `13499433454`。この試験は修正実装者が整備した回帰試験であり、独立審査とは呼ばない。実Safari/VoiceOver/native OS文字拡大はNOT_TESTED。

## 次の判定
- 最終HEADのCI、原結果JSON/PNG、RED→GREEN同一条件、故障注入の負対照を独立担当が別経路で照合する。
- 初回GREEN成功をもってP2閉鎖・マージ推奨YESと宣言しない。
- #25のButton修正は別Draft #27。両修正統合後、#23の32条件・重点・full-run audit-controlsを再実施する。
