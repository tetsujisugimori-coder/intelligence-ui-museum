# 第1便・途中報告（2026-11-13 JST）

## A 総合判定
PARTIAL。実装・静的保全と純粋単体は確認。実UIはローカル環境でBLOCKED、固定CIと最終独立レビュー待ち。限定マージ推奨NO、Stage3 HOLD維持。

## B–C 提出
Issue #48 / Draft PR #49 / `feat/v11-wave1-124-126`。
基準main `78e6e99fa46274cae9435dae4483c5266ad6b021`。最終HEAD/treeはPRの最新報告で固定する。直接git pushは認証情報が利用できずexit128。認証済GitHub connectorのtree/commit/branch経路で提出し、原本再アップロードやtoken記録はない。

## D 展示
124: AND/ORと最大2階層、4グループ×6条件。入力変更で即時検索、無効条件は検索停止。条件・グループ追加削除とReset。
125: 継承なし、閲覧拒否は編集/削除設定より優先し実効拒否。役割選択と各セルの許可切替、競合説明、Undo/Reset。実認証とは接続しない。
126: 地域×種類の軸切替、レコード件数・数値合計・有効数値平均。総平均は元レコードから計算。空/金額欠損の切替、総計、元データ比較、Reset。

## E 保全
126連番・11分類・旧123canonical JSON SHA・v09原本SHA照合PASS。apps/v10/、archive/、旧evidence/reviews/、PR46変更なし。既存browserとno-JS検証器の件数期待だけ126へ更新。歴史fixtureはファイルを変えずメモリ上の件数ラベルだけ変換。

## F–G 検証
Node24自己単体6/6、既存契約17/17、実CLI保全正常exit0＋故障4件（重複/件数/旧123変更/新分類）非ゼロ。独立純粋21 assertions。PNG偽証拠・欠落/不完全行列・非成功状態もCLI非ゼロ、正常fixture復帰exit0。自己作成synthetic故障と実ブラウザ故障対照は別。
ローカルChromiumはsocket許可拒否＋SIGABRT、WebKit executableなし。ブラウザ14条件と実UI故障対照はローカルNOT_TESTED。保護緩和、browser追加導入、追加flagsの迂回なし。初回Node試験はTMP設定漏れをガードで拒否、ファイル作成前停止。再実行は専用領域で成功。旧fixture2件の件数ラベル未更新失敗も保持し修正後17/17。

## H 証拠・CI
非公開ローカル原ログ/JSONと相対名SHA一覧はLOCAL-EVIDENCE-HASHES.json。ローカル作業領域の保全はWindows永続ARCHIVE PASSではない。CI原artifactは可視性・機密確認後に別判定。初回CI定義の全体envでrunner contextを使用した不備はjob envへ修正。古い実行結果を新HEADへ流用しない。

## I–J 未検証とレビュー
実機Safari、VoiceOver、物理タッチ、OS文字拡大、全123展示網羅操作はNOT_TESTED。独立担当はPNG監査と文字2倍再描画計測の不足を指摘、修正後のコード確認と実ブラウザ確認を分離。最終CI/evidence review未完了。

## K–L 判断
限定マージNO。Draft解除・マージ・公開なし。127–129は本便の未完了ゲートを先に閉じ、候補として複数段階入力/データ検証/差分承認を重複調査後に検討。承認済み次工程とはしない。

## CI実測更新（2026-11-13 04:05 JST）
初回1258e8f / run43285267570、次回5fac6af / run43285728602はともに専用browser **13/14 PASS・1 FAIL**。WebKit26.0 / 375 dark / 実測文字2倍のQuery Reset後がOR・西・2件のまま。追加keyboard-mainは成功cell13件で完了、失敗cellはquery段階停止。Chromium141の7条件とWebKit標準文字6条件は成功。各engineのReset/Undo/permission/pivot/queryの実故障5種類（計10）はassertion検出＋clean counterpart復帰成功。2回の原ZIPを取得しSHA/CRC一致。

- 初回ZIP13974876828：1,584,651bytes、SHA256 `7e0232559d27db61fe92f313c71e553ea2339ee7d08b9c9c4b92adf1b56380a8`。
- 次回ZIP13975745040：1,605,813bytes、SHA256 `3b1a3dc47aa8227b63fd6eee6c3e110d0c6d8f47bf190362ea0facafc0d23df2`。
- 次回checkoutは仮merge `04f9391f6a0c47c5c26a1ad06a23c308ddfab75c`、tree `f26b613a67dacd25fe254dfd49a6c71a512ba430`（提出と一致）。実mergeではない。

Reset原因UNKNOWN。グローバルreset衝突の根拠はなく製品処理は同期。クリック再試行で隠さず、次回は一回のclickイベント/座標/active/状態/描画frameを記録し最大2秒で初期状態を待つ。失敗時画像も保全する。文字拡大時の金額改行を目視確認し、表内横scrollで数値を保持する局所CSS修正を追加。初回失敗と未検証を後の成功で消さない。

## 第3・4回の追加診断
第3run43286507837の単一クリックtraceで、Resetへのmousedown時矩形459–539pxがmouseup時416–496pxへ43px上移動。scrollYは不変、mouseupは隣接summary、clickはsectionへ配送されてReset handlerに届かなかった。単純な完了待ち不足ではなく2秒後も旧状態。根本のnative blur/change因果は未確定。

Queryは同値changeでも変更前snapshotを置換していたため、同値イベントを冪等にする局所修正を追加。同値synthetic changeの説明文・高さ不変を検査するが、native再現証明とは別。v11 CSSの表幅修正も継続確認。

通常CIの構文不備はcheckout.withがrun stepへ移動した編集ミスと特定して修正。第4run43286772798では保全/build成功、Kanban旧runnerは参照資源の固定3ファイルだけをcopy/serveし新wave1.js/cssを欠落させcapture失敗。対象版HTMLに参照がある場合だけ2資源のcopy/serve/実HEAD hash監査を追加。旧版の3資源契約は維持し、画像基準・旧展示製品は変更しない。過去失敗は保持。
