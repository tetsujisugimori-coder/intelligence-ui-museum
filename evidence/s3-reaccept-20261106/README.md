# S3-1再受入 原票（2026-11-06 JST）

総合報告：`docs/S3-1-REACCEPTANCE-20261106.md`。Source main77d30ac/tree bae0835e、Issue22/Draft23。

`IDENTITY.json`にsource/原票hash/環境と初期失敗を記録。`setup`はコマンド生logとexit、`raw/local-matrix-v1..v5.json.gz`は検査器改訂別結果、`raw/local-focus.json.gz`は新規Chromium22row（重点6＋追加16）、7fault、2回帰set。

`raw/independent-local.tar.gz`は別担当の独自実操作・故障入力・原画像・RED/GREEN JSONのスナップショット。内部ファイルを展開して照合できる。後の追加指摘と最終再レビューは別ファイルで追記し、snapshotを上書きしない。

未保存の実行を成功扱いしない。CIの結果はartifact原票と最終HEADで照合し、過去run成功やZIP存在だけを完了根拠にしない。Stage3 HOLD維持。
