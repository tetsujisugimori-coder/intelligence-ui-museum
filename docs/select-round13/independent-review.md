# 第13回 独立監査・修正記録

2026-11-11 JST。対象初期HEAD: 6f29b3d4b0a1679e8f25264d0a18999305b825b0。
原CI: https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/42882508199

## 原証拠の再集計

添付の independent-recount-original.json は取得した4原artifactを直接読み、作者の要約を入力にせず再集計したもの。Windows WebKit/Chromium、Linux WebKit/Chromiumそれぞれ18試行。計72試行、各環境9組、計36組。各127ファイル、合計508のSHA-256一致を確認した。manifest自体はこの508件に含まれない。元の監査器でも4組の完全監査（PNG再計算・trace・ソース/ビルド照合）はPASS。

全72試行の対象focusは true → false → true、document.hasFocusは各時点true。Aのfocus-visibleは全環境 true → false → true。B/DはWebKit false → false → false、Chromium false → false → true。Space後はメニューへfocusが移動した記録であり、トリガーfalseだけから入力モダリティ原因を断定できない。最終PNGはWebKit B/Dが輪郭ABSENT、その他VISIBLE。4環境のA/B/D代表画像を目視照合した。中間時点の画素輪郭は撮影されておらずNOT_TESTED。

## P2: transitionレコードの未照合

旧監査器はafterSpace.focused、afterSpace.focusVisible、afterEscape.focusVisibleの改ざんを誤受理した。同一原票クローンを使い、旧版errors空、新版で対象時点の不整合を拒否するRED/GREENを記録した。

各transitionを独立した隣接snapshotのfocus、focus-visible、document focus、expanded、rect、scroll、computed outline/shadowへ結び付け、時系列も照合した。これは隣接サンプルの整合性検査であり、サンプル間の未観測遷移がなかった証明ではない。不一致は安全側にFAILとする。5反例を追加した。さらに欠損asset故障試験が別のsource不一致だけで通らないよう、完全auditの正例を先に追加した。

## 比較の限界

OFFでは診断が追加する常駐イベント監視とMutationObserverは設置しない。製品自身の監視処理、共通page.evaluate、trace、撮影は残る。完全無観測ではない。入力操作、DOM、scroll、撮影数の契約内同等性のみ確認可能。36組一致は追加probeの観測された差がないことを支持するが、全観測処理の因果的無関係を証明しない。

Museumにはメニュー閉鎖後のfocus復帰fallbackが存在するが、この原証拠からEscape後の実際のfocus呼出主体をSDK・Museum・ブラウザへ一意に帰属できない。根本原因・仕様違反・ブラウザ内部モダリティはUNKNOWN。第14回候補は共通測定の影響切分け、focus復帰呼出経路の独立観測、中間画素の取得。

## 保全と受入範囲

製品コード・公式SDK・依存lock・第1〜12回および過去原証拠を変更しない。Stage 3 HOLD、PR #23製品受入NO。原証拠はGitHub hosted合成環境のみ。privacy判定は診断の正当性と独立。ローカル環境で最初のnpm取得は標準cacheのEROFSで失敗し、workspace内cacheで再実行成功。元失敗ログはローカル保全。これを製品不具合や正式CI成功として扱わない。

修正後最終CIと原artifactの再監査結果はPR/Issueの最終レビューに記録する。未確認をPASSへ読み替えない。実機Safari・物理入力・VoiceOver・他幅/reduced motionは本診断の検証対象外でNOT_TESTED。
