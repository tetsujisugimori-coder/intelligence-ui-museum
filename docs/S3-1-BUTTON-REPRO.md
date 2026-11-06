# S3-1 Button #25：RED保全と製品修正候補（2026-11-06 JST）

対象：Issue #25、再受入 #22／Draft #23、製品修正Draft #27。Stage 3 HOLD継続。公開・Draft解除・マージなし。

## RED：変更前の独立画素対照
- 製品main `77d30ac54e35b8a6408fb5f56db4697adff8a452`、公式SDK `@openai/apps-sdk-ui@0.2.2`。
- Chromium 320/375/390×light/dark×root100/200＝12条件で左x14の焦点輪郭1columnが欠損。1280の4条件は欠損0。
- Button left x21、outline3px+offset4pxによりouter左14。親SECTIONのクリップ境界x15が1px内側にあるため欠損する。SECTION overflowだけvisibleにした対照で原画素が戻った。
- RED原JSON：`evidence/s3-reaccept-20261106/independent/button-ring/results.json`。原64 PNG：固定#23 `evidence/s3-reaccept-20261106/raw/independent-local.tar.gz`。既存REDを改変しない。

## 修正候補
`apps/v10/src/main.css`の狭幅Button教材pane余白だけ6px→7pxへ変更。ボタン全体が右へ1px移り、左端のouter輪郭がsection clip境界内に入る。**SDK、outline width、offset、検査閾値は変更しない。** 公式Button自体のフォーカス描画を保存する。

製品修正commit `12d78a8ae33c860cc308eeb6fd66de883904b8a1`。

## 修正後の専用検証（自己試験）
`tests/s3-reaccept-independent/button-ring.cjs`でChromium/WebKit×4幅×2theme×2root＝32条件の原本focus on/offとSECTION overflow解除focus on/offの差分を検証。輪郭抑止スタイルが適用されたこと、focus-visible、originalの輪郭画素が実在すること、対照との差分で欠けが0であることを確認。

専用CI初回run [42214009476](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/42214009476)：**32/32 PASS（Chromium16/WebKit16）**、型/buildと既存`npm test`成功。原票artifact `13500373085`。修正実装者が整備した回帰試験であり独立審査ではない。実Safari/VoiceOver/native OS文字拡大はNOT_TESTED。

## 次の判定
- 最終HEADのCI、画素対照、旧RED→GREEN、任意の輪郭消去や半分クリップで検査器が正理由でFAILすることを独立に再検証する。
- 初回GREEN成功をもってP2閉鎖・マージ推奨YESと宣言しない。
- #24のTooltip修正は別Draft #26。両修正統合後、#23の32条件・重点・full-run audit-controlsを再実施する。
