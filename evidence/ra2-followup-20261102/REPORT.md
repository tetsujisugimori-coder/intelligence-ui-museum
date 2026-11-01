# R-A2追補：本体枠がある場合の非表示疑似要素
2026-11-02 JST。実装者による追加点検であり独立レビューではない。
開始HEAD 6456521898bf3bd42b7435a978293f3f9a006da3。

本体にmagenta 3px outlineを表示し、::afterをdisplay:noneにすると、geometryが非描画疑似要素のauto寸法を解決しようとしてUNVERIFIEDとなり、正常な本体枠まで拒否した。Chromium/WebKitの双方で再現。
同じ本体枠に対するdisplay:none・visibility:hidden・opacity:0の3条件×2engineを旧helperで実行し、4成功・2誤FAIL。修正後は同じ6条件すべて成功。4件は元から成功、改善は2件と分離する。

generatedかつdisplay非none・visibility visible・opacity>0の疑似要素だけをgeometry候補にする。本体の可視性・compositing制限、画像差・clip判定、最終style判定は緩和しない。非表示pseudoを除いても、本体枠まで消えた負対照は引き続き失敗する。公開製品コード・依存/lock・R-A1には変更なし。
既存fixture28＋今回追加6＝34/34期待どおり。既存runner契約25、保全検査も成功。CIは提出後の固定HEADで既存smoke12/matrix40・既存9受入・clip40・34fixtureを再実行する。

red.jsonは旧helperで全6条件を収集するため、assertを各観測のexitCode記録へ変更した別copyで取得した。期待値・CSS・旧helperは不変更。green.jsonは修正版の正式fixtureで全34条件完走。旧helperはgit show 6456521:apps/v10/scripts/stage2r-focus-pixels.cjsで再取得できる。
完全なON/OFF画像は新出力.work/ra2-followup/greenとCI artifactへ保存する。旧証拠には追記・上書きしない。
総合PARTIAL、独立P2閉鎖保留、マージ推奨NO。Draft・未マージ・Stage 3 HOLD・PR #8停止を維持する。
