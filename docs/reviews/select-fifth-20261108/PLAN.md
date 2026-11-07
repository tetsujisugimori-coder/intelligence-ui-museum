# 第5回診断計画（2026-11-08 JST）

旧画面外問題とdirect-focus輪郭問題を別々に検証。第4回固定HEAD
64da60e9b4b1c3934b2000f73b19236cf77ef05c/tree5bde7f228b7aca4ce3ddfa59d53daa0ebc898543
を保存し、製品/SDK/依存/lock、以前の診断器と原票を変更しない。

## 事前仮説と対照

H1: browser再利用が旧持続画面外に必要。reuse/fresh以外は同一の原runner派生、20 fresh pageを比較。
H2: 計測が失敗を隠す。none/events/fullを同じ生成runnerで比較。noneは追加ブラウザhookなしであり、元runnerの既存計測は残る。
H3: 初期位置決定とクリック開始の競合。original（即Playwright click、内部安定待機あり）/raf2（option可視後2描画frame）の別系列。これは診断上の対照であり、待機増量による製品合格化ではない。
H4: 入力履歴とfocus復帰時刻が輪郭に影響。legacy/direct/pureTabを分離。SDK実経路をfocus呼出し前後・stack・keyup・rAFで観測し、別のSDKなしfixtureのkeydown同期、次task、keyup同期復帰と比較。fixtureの効果をSDK因果へ外挿しない。

主要Windows WebKit: reuse/none,events,full legacy各20、fresh/full legacy20、reuse/full/raf2 legacy20、reuse/full direct/pureTab各20。Linux WebKitとChromiumはfull legacy/fresh/raf2/direct/pureTab各20。各series独立。原前段操作・スクロール・PNG・assertを維持。source original a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1。

fullは第4回計測にscrollend、focus call前後/stack、console・pageerrorのperformance.now軸を追加する。追加自体が介入。trusted pointerとSDK synthetic pointerは別の配列に保存し、trusted必須検査は維持。持続offscreenは原clickのtimeoutとその時の矩形を併せて判断し、負座標sampleだけでは再現と呼ばない。

元runner exit1/FAIL、禁止disabled force-clickと後段NOT_TESTEDを保全。
COMPLETEは診断完了のみ。direct輪郭FAILを成功へ変更しない。
Windows hosted CIは独立物理端末実行ではない。実Safari/物理入力/VoiceOverはNOT_TESTED。

## 固定条件の一致・不一致

一致: 元前段runner、375x1000/light/root100%、製品source hash、Playwright1.56.1、WebKit26という公開version、reuse系列のbrowser lifetime。
未証明/不一致: 旧実行のOS patch/ホスト負荷/ブラウザ内部buildの完全一致、旧の全イベント順（旧原票に記録なし）、追加full hookの介入、現在Node/runtime、純Tabとdirect経路（明示的対照）。
旧integrated2/20とbaseline1/20は新規試行分母に合算しない。旧失敗はhistorical derivativeであり元runnerそのものではない。旧JSONが記録していない時刻は復元できない。
