# 旧／新Select操作経路pilot 結果（2026-11-09 JST）

## A. 総合判定と用途

総合PARTIAL。操作順の復元、固定pilot、原票の再解析を実施。製品不具合の解消・根本原因の確定ではない。Stage 3 HOLD、原因UNKNOWN。

この文書は原票の結果を示す。最終CIと独立レビュー、限定マージ推奨の最終判定はPR #34の最終コメントとレビューに記録する。Draft解除・マージ・公開は行わない。

## B. 固定版と証拠

- 基準main: 49256d1e6f5ebe1f18a7187e8684eac58ba6e0c2。
- producer: b7b1e8e6b6cdf5518a2b061766cbd098502c41b3、tree4796f065590481e605517213fc7cf15b60812e73。
- 固定計画: tests/select-path-pilot/plan.json。1環境36試行、12セル×3反復。結果に基づく追加・除外なし。
- 原取得run42531791744/attempt1。原runnerは後述の過剰なclick条件によりexit1、旧auditも失敗。70a8のWindows再解析もcp1252既定decodeで開始失敗し、原stderrとZIPを保持した。明示UTF-8に修正して同一原票を再解析し、ブラウザ試行は追加しない。原JSON・trace・PNG・exitはそのまま保全し、修正した分類器で同じ入力を再解析。最終CIはこの固定原artifactの再解析であり、新しい試行ではない。
- Ubuntu原artifact13637439295: 104790080 bytes、API digestと実ZIP SHA256とも6c9a23f66ee28cba2af3c0f5477582bc154c218896103f7e145d29c4b7638376。
- Windows原artifact13638290463: 61890403 bytes、API digestと実ZIP SHA256ともb5f6ede889ff775086d21f52e23c757168187d2d7b4d505ee4e005c1e1a11b6e。
- 原ZIP: https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/42531791744 。Actions原artifactの期限は2027-02-06 UTC。長期保全用コピーとmanifestを別途保持する。

## C. 操作差分・固定手順

詳細はPLAN.mdの表と読取専用旧runner参照。Aは旧Museum前段とSpace→通常カードclick→Space→ArrowUp→Enter→Space→Escape。Bは前段のない隔離SDKでArrowDown→Escape。CはAと同一Museum/SDK/前段/焦点獲得でArrowDown→Escapeのみ。

legacyはfocus→Tab→ShiftTab、directはlocator.focus、tabは実TabでSelectへ移るが起点には前段操作またはbefore.focusがある。物理操作ではない。A/Bは画面・CSS・SDK測定介入も異なる。Bの橙輪郭とMuseumの青輪郭は同じスタイルではない。A/Cも開くキー・選択履歴・再開回数の複合差であり単一要因ではない。

## D. 実行環境と症状別の結果

CI Windows Server2025（10.0.26100）、CI Ubuntu24.04（kernel7.0.0-1017-azure）。両方Node22.23.4、Playwright1.56.1、WebKit表示版26.0、SDK0.2.2。375×1000、light、root100%、DPR1、scale1。fresh context/page、browser再利用。各環境は独立の36試行であり合算しない。

両CI環境で同じセル結果を得た。ただし以下の各分母3は**各環境ごと**である。

|経路|焦点獲得|輪郭欠落|通常clickを伴う持続画面外失敗|
|---|---|---:|---:|
|A 旧Museum|legacy|0/3|0/3|
|A 旧Museum|direct|3/3|0/3|
|A 旧Museum|tab|0/3|0/3|
|C 短縮Museum|legacy|0/3|NOT_TESTED|
|C 短縮Museum|direct|3/3|NOT_TESTED|
|C 短縮Museum|tab|0/3|NOT_TESTED|
|B SDK native|direct / tab|各0/3|NOT_TESTED|
|B SDK paired-cancel|direct / tab|各0/3|NOT_TESTED|
|B SDK paired-plain|direct / tab|各0/3|NOT_TESTED|

A direct/C directはDOM焦点がtriggerにあり、focus-visible=false、4PNG再計算の差分画素0。Museum Tab/legacyはfocus-visible=true、1465画素。Bはfocus-visible=true、3599画素。色・レイアウトの違うBとMuseumの画素数を効果量として比較しない。

旧持続画面外失敗はAで各環境0/9。これは解消の証明ではない。全経路の初期展開イベントには一時的な負のoption座標も観測された（例Museum y=-178、隔離SDK y=-114）。初期配置中の負座標と、通常clickがtimeoutする持続故障を区別する。単なる負座標を「再現FAIL」と数えず、反対に初期座標異常を存在しなかったとも扱わない。C/Bには通常option clickがなく、この症状のクリック成否は未検証。

## E. 誤成功・誤拒否の修正と回帰

f07候補は独立レビューで証拠欠落の誤受理8件を発見し、同じ保存fixtureを再実行して拒否を確認した。ただし元のsynthetic positive自体が不完全だったため、この反例だけでは正常受入を立証しない。実b7原票を正例として再解析する。

b7分類器はSDKがpointerupでoptionをunmountするのに、その後のoption clickイベントまで要求していた。Playwrightの通常locator.clickの成功traceとtrusted option pointerdown/upを使う修正で、発生しないイベントを捏造しない。旧分類・旧exit1は残す。監査器のtrace API名も実原票に合わせて修正した。

最終監査は生JSON、manifest全体、全36行、順序、実trace focus/keyboard/click/mouse、終了状態、4PNGを再計算する。producer HEAD/tree、ソースhash、製品hash、全計画、OS、SDK版、locked build全ファイルとSDK変換記録も固定値へ照合。analysis HEAD/treeと監査コードhashを別記録する。元の60/348試行や旧故障証拠を変更しない。

現時点の単体は新pilot44、既存SDK41、最小モデル27の計112成功。元302ファイル・過去HTML/資料保全を確認。最終CIと独立担当の実artifact再計算はPRの確定結果を参照する。

## F. 原因仮説、本実験への判断

AとBのdirect-focus症状は異なる。しかし同じMuseumで開くキーと後続選択履歴を短縮したCはAと同じ3/3だった。したがって「SpaceかArrowDownか」または「3回開くか1回か」だけで差が説明されたとは言えない。前段のpointer/keyboard履歴、初期focus-visible、画面/CSS、隔離用介入を分離して調べる必要がある。相関は原因確定ではない。

現行の交絡したA/Bを大規模化する本実験はNO。次は同一Museum・同一DOM/CSS/SDKを固定した小規模1要因実験を提案する。

1. direct-focus前の直前入力をpointer対keyboardとして事前固定し、focus-visibleの初期値と閉鎖後を比較する。
2. それ以外を維持して前段操作の有無を切り分ける。
3. 同一画面内で開くキーのみSpace/ArrowDownを比較する。選択・再開履歴は固定。
4. 隔離fixtureへの移植や共通介入の有無は別実験とし、製品原因へ直結させない。

n=3は低頻度故障の検出力が小さい。旧頻度1/20程度なら3回で非再現でも不自然ではなく、統計的解消を主張しない。

## G. UNKNOWN / NOT_TESTED

旧OS/browser版との完全一致、計測によるタイミングへの無影響、厳密なReact commit時刻はUNKNOWN。イベント時計・runner時計・trace時計を無補正で統合しない。開いた瞬間のexactスクリーンショットがない場合はtraceの近接フレームに限定し、閉鎖後PNGで代用しない。

実機Safari、物理キーボード／ポインター、VoiceOver、ネイティブOS popupの可視性はNOT_TESTED。SDK DOM popupの結果をnative Selectへ一般化しない。旧製品の画面外問題・輪郭問題の根本原因はUNKNOWN、Stage 3 HOLD継続。
