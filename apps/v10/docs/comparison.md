# 6部品の比較

|部品|v09対応|公式|独自追加|操作検証|
|---|---|---|---|---|
|Button|082 SDK Button styles|公式Button、color/disabled/loading|回数と状態切替|クリック/Enter/Spaceで3回、disabled/loading|
|Badge|なし|Badgeのsoft/solid/outline/pill|色選択|success→warning、表示更新|
|Select|016 Select|Radix系Select、公式TriggerView API|選択肢・表示名・現在値|クリック選択、Space展開、矢印/Enter確定、Escape、disabled|
|Switch|085 SDK Switch|Radix Switch、label|ON/OFF状態・disabled切替|Space、ON表示、disabled|
|Tooltip|047 Tooltip|Radix Tooltipのfocus/portal|独自トリガー・focus観察|フォーカス表示/role tooltip、Escape。マウスhoverは未検証|
|Alert|086 SDK Alert|Alertのcolor/title/description|色選択・閉じる/再表示・role=status|色更新、Enterで閉じる|

EnterでSelectが開かないのは公式SelectControlの意図した実装（フォーム送信との区別）。教材説明を実APIに合わせて修正。公式APIへ独自キー処理を加えていない。

v09比較側ではButton主操作、Select詳細、Switch Space、Alert通知表示を操作。Tooltip比較側の操作は未検証。公式側Switch ONは比較側操作後もONで状態干渉なし。CSS分離はiframe構造と表示の限定確認。
