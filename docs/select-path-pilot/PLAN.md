# Select 操作経路固定 pilot（2026-11-09 JST）

Issue #28。Stage 3 HOLD、製品原因UNKNOWN。試行計画は `tests/select-path-pilot/plan.json` に結果取得前に固定。原本・公式SDK・製品・lockfile・既存証拠は変更しない。

## 開始時点

main 49256d1e6f5ebe1f18a7187e8684eac58ba6e0c2。PR31 head2db7cd836644c064615dfac10bf782a0b844c304はmerge済、PR33 head7061ab3db3f89f556bfcf03c9a571330bba6f92bはmerge済。PR29 head02e48225a56528611836092e52472d82bb3f051cとPR23 ea6f19acfd60b37e9b147daa92e79838fd2f3070はDraft未マージ。未マージPR29の製品ソースと現在mainのapps/v10は同一。PR29の診断実装は統合せず、旧runnerをハッシュ固定した読取専用参照として取り込む。

## 復元した操作差分

|項目|旧Museum経路A|第8回SDK経路B|同じMuseumで短縮した対照C|
|---|---|---|---|
|画面|全Museum。environment/layout/Button/Badge/Alert/Switchの前段|隔離Select、前段なし|Aと同じ|
|初期焦点|前段Switch処理後。direct=trigger.focus、legacy=focus→Tab→ShiftTab、tab=ShiftTabでcheckboxへ→Tab|direct=trigger.focus、tab=before.focus→Tab|Aと同じ|
|開くキー|Space|ArrowDown|ArrowDown|
|最初の選択|普通のカードclick、value bへ|選択しない|選択しない|
|再開と選択|2rAF→mouse(0,0)→Space→b強調/list焦点待ち→ArrowUp→a強調→Enter→復帰/value a→2rAF|なし|なし|
|閉鎖|3回目Space→カード可視→Escape→復帰/value a|expanded true→Escape→closed/popup除去|Bと同じ（元Museum）|
|SDK|未変更パッケージ、Museum focus-return|既存隔離ビルド。nativeも変換器経由。pairedはhook取消/Radix fallback抑止を共有|Aと同じ未変更パッケージ|
|描画計測|旧4PNG on/off/off2/on2のring測定|旧第8回は橙画素推定。本pilotは同じ4PNG方式を追加|Aと同じ|

Spaceを物理mouseクリックと呼ばない。SDK内部のsynthetic pointerdownと実入力を区別。Tab経路でも起点にprogrammatic focusまたは前段操作がある。「全操作が物理Tab」ではない。

旧原runner SHA256 a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1。出典はPR23固定runner、PR29に保全された同bytes。歴史的20回派生runner SHA256 94d6111fb59f4c7b192dc20759d1dbad63913efc084f4f8678236f229adb1ee1。旧画面外原票はWindows375×1000/light/root100%、統合2/20・旧main1/20。初期診断dark/200%と混ぜない。

## 母数と比較範囲

各OSで各セル3回。A/Cそれぞれlegacy/direct/tab=18。Bはnative/paired-cancel/paired-plainそれぞれdirect/tab=18、計36。Windows WebKit優先、Linux WebKit比較。n=3の非再現は低頻度故障の解消を証明しない。旧348試行へ混ぜない。browser再利用・fresh context/page、OSとbrowser実測版、SDK0.2.2・Playwright1.56.1を固定。旧OS/browser版との完全同一性はUNKNOWN。

AとBは画面構成・介入が違うため操作経路の単一要因比較ではない。AとCは同じMuseum/SDK/前段/焦点獲得で比較するが、開くキー・選択履歴・再開回数をまとめて変えた複合因子。差があれば次回は1要因ずつ切り分ける。本pilotで原子操作の原因確定をしない。

## 計測の介入と限界

入力順序と既存待機条件を保つ。追加のcaptureイベント/MOは同期で矩形を読み、Playwright trace screenshots/snapshotsも有効。この負荷による元タイミングへの無干渉は未証明。前段後・焦点獲得前に1枚のPNGを追加する。焦点獲得と最初の開放の間には画像取得の待機を挿入しない。開いた瞬間の画像はtraceの自動screencastを使用し、完全な直前/直後フレームが存在しない場合は未観測。全入力のsnapshot・time・rectは別に保存する。終端PNGは閉鎖後であり開いた状態の代替画像とは呼ばない。

元runnerの後段disabled force-clickは実行しない。本文原本にその文字列が含まれることと実行を区別。普通click timeoutを強制成功/追加sleepで解消しない。製品輪郭FAILでも診断が完全ならCOMPLETEとし、製品PASSとは呼ばない。普通clickを行わないB/Cの旧画面外クリック成否はNOT_TESTED、イベント中の矩形は観測情報として別報告。

## 再現

新checkoutで `python scripts/prepare-work.py`、`.work/v10`の固定lockをnpm ci、build。`node tests/sdk-parity/prepare.cjs`、同copyのnpm ci、VITE_MEASURE=detailで既存vite.config.mjs build。tools/stage-a-browserの固定lockからPlaywrightとWebKitを準備。`node --test tests/select-path-pilot/contract.test.cjs`。PATH_ENGINE=webkit PATH_OUT=新規ディレクトリで `node tests/select-path-pilot/run.cjs`、`python tests/select-path-pilot/audit.py 出力先`。CIが各exitを外側へ保存。再実行は新たな原票で保持し、結果の都合で反復追加しない。

実機Safari、物理入力、VoiceOver、ネイティブOS popupの画面取得はNOT_TESTED。対象SDK popupはDOMであり、ネイティブSelect全般へ外挿しない。

## Pre-pilot review repair (f07 candidate preserved)

Independent review rejected f07 contract false accepts (8 immutable mutations in evidence). Missing paint/geometry/acquisition, missing trusted option pointer events, wrong prelude names and capture errors now reject. Trace audit also checks focus/acquisition, ordinary option click, mouse move, order, successful returns, and independently decodes four PNGs. The former synthetic positive was itself incomplete; rejecting it is not evidence of a real positive. Real raw records must pass independently.

f07 Windows CI did not run the pilot: the old bundle's git archive inherited CRLF conversion and failed `.gitignore` SHA preservation. Set process-level core.autocrlf=false for the isolated workflow, retaining the failed job log. No original file/hash or acceptance threshold changed. Probe initialization was corrected to observe Document because documentElement can be absent in addInitScript. The f07 Linux attempt remains a separate failed candidate, never pooled into the repaired pilot.

Timing limits: performance.now(), runner Date.now() and trace times are separate clocks. defaultPrevented is capture-phase only; mutation samples do not identify React commits. Added tracing/screenshots/geometry reads affect timing. Input order is reconstructed, timing equivalence remains UNKNOWN.
