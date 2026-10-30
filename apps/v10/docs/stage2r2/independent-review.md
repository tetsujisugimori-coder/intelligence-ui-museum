# Stage 2-R2 独立レビュー
レビュー担当: `/root/stage2r2_independent`。日時: 2026-10-27 JST。

## 判定
**PARTIAL。局所ソースとrunner判定処理の静的レビュー・隔離process試験は限定PASS。Stage 3の公開・機能実装はHOLD。**
本担当はブラウザを起動せず、親のCUA実測記録を算術照合した。親の実操作を独立ブラウザ再検証として数えていない。GitHub管理先、実CI失敗伝播、公開認証後の配信・通信、WebKit、実機Safari、VoiceOverは本レビューで未検証。

## 発見と修正確認
|重要度|発見|修正・再確認|
|---|---|---|
|P2|40条件があっても各checksが無関係なpass1件だけで検証器がGREEN。必要な製品assertの欠落を検知しなかった|BASE/MATRIX/V09/SIXの必須検査名と集合完全一致・重複拒否を追加。同じ独立入力は修正後に `missing, duplicate or unexpected assertion` として拒否。missingAssert/fakeGreen/duplicateAssert回帰を含む17試験成功|
|P3|実行回数の部分文字列一致は30/300も3として受け入れる|区切りを含む正規表現に修正。3のみ一致、30/300不一致。smokeの1も10/100を拒否することを独立確認|
|P3|文字Rangeのクリップ祖先走査がcontrol内で止まり、説明する全祖先確認と一致しなかった|祖先末尾まで走査しclientLeft/clientWidth境界に統一。ソースで確認。最終native browser runnerの実描画再実行は未検証|

修正前の独立再現は `evidence/stage2r2/independent/missing-assert-reproduction.json`、修正後は `missing-assert-after.json`。修正前結果を上書きしていない。

## Select・公式API
`@openai/apps-sdk-ui` の公開型定義は `TriggerView?: React.FC<T>` とstable referenceを要求する。追加した `DisplayModeTrigger` はmodule scopeの関数でこの条件を満たし、sr-only「表示モード：」とoption labelを合成している。公式Select内部、role、公開パッケージのソースを独自実装へ置換する変更は見られない。`id` がhidden inputへ入り、focusは生成triggerへ転送される公式構造も実装を読んで確認した。
親の `cua-matrix.json` 16行を再計算し、一覧AX一致1・カードAX一致1、input値a→b、Button回数3、ページ横超過なし、文字Rangeのcutsなし、control矩形clipなし、祖先横scroll0の各記録に不一致はなかった。これは親が記録した測定値の整合性確認であり、スクリーンリーダー読み上げや独立GUIの証明ではない。focusのCSS局所修正後の最終ブラウザ結果は親の最終報告に従う。

## runner・assert
実runner入口とfinalizerをVM隔離subprocessで実行し、故意のengine起動失敗が両runnerで非0になる試験を独立実行した。実socket、実ブラウザ、実CIを使ったものではない。終了コードだけでGUI合格とはしない。matrixは40条件の一意性・完全性、必須assert集合、pass=true、engine failures、finished、想定外before失敗を検査する。期待REDはbefore/320/light/root200の元の可視性2名称だけを許容し、期待REDが起きない場合も拒否する。smokeは12条件と必要経路・check集合、noJS117件を要求する。TooltipはEscape操作だけでなくhiddenをassertし、hover/loading/disabled検査名は実際の検査範囲へ限定された。

最終独立実行は17 passed、failed/skipped/cancelled=0。証拠: `runner-tests-final.log`、`count-boundary.json`。レビューした7ソースのSHA-256は `reviewed-source-sha256.txt` に固定してある。これ以後のコード変更はこのレビュー対象外。

## 残る受入条件
Aの保存版品質全体を本レビューだけで全面PASSにしない。最終build一致・最終focus画像・対象matrixは親の測定と照合が必要。
B公開版は認証後本文に到達できた証拠が必要で、管理metadataを代用しない。
Cはローカルの失敗検知改善を限定受入できるが、実CI伝播はUNVERIFIED。GitHub管理先の確定と隔離CI RED/GREENを残す。
依存Advisory・license来歴はこの担当の独立監査対象外。未解決のHOLDを解除していない。全117展示操作・native text200・実機保証へ検証範囲を拡大しない。

## 最終証拠の追補照合
`cua-final-matrix.json` は16条件・組合せ重複0。AX名・a/b値・回数3・ページ横超過・control矩形clip・文字Range cuts・祖先scrollの記録を独立再計算し不一致0。一方、Button focusのactive/visibleがfalseの条件は **320/root200/dark、1280/root100/lightの2件**。これらを成功へ読み替えず、focus全16条件の受入れはPARTIALとする。操作経路の問題か製品問題かは記録だけでは断定できない。ブラウザRuntime timeout後の再確認未完了も未検証として残す。初回16件と最終16件を合算して32条件の独立範囲へ拡大しない。

320/light/root200の個別active-focus証拠は、修正前outline3px+offset4pxの右外縁がclip境界を1.546875px超過、修正後Button pane横padding6pxで0.453125pxの余白になった。`focus-fixed.json`のactive=true/focusVisible=trueと幾何記録が整合する。Button本体が完全に隠れる記録はなく、外縁欠けの再現をそのままWCAG 2.4.11違反としない。ここでも画像を独立再描画したものではない。

`keyboard.json` の1280/dark/root200代表では、Space→native Up→Return後に一覧、a、closed、AX一致1、Button回数3の記録が整合。全16条件のキーボード往復成功を証明するものではない。

`rebuild-equality.json` のfirst/secondは8ファイル集合・hashが完全一致し、現在のclean distの8ファイルを本担当でも再hashして全一致、余剰ファイル0を確認。最終mapは `dist/assets/index-ItwAwdWS.js.map`、SHA-256 `f9f0f77cf8db1730dc8c337639419b0305ba7c0704dee6cd1b42b6497df39fbe`。同mapの公式38sourcesContentをinstalled公式ファイルへ照合し38/38一致。map source pathにcheckout名が含まれるため、比較は `/node_modules/` 以降の正規のpackage相対pathを使用した。別の古いmapを任意選択していない。fresh tarball2645/2645は親の `authenticity-current.json` 記録として確認し、本担当による再ダウンロードとはしない。

追補証拠: `independent/final-record-reconciliation.json`、`independent/current-map-reconciliation.json`。レビュー対象7ソースの既存hash一覧を再検証し全一致。以上でも総合PARTIAL、Stage3 HOLDを維持する。
