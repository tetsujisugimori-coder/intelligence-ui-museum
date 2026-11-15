# 第7便 実装前受入契約 — 2026-11-15 21:55 JST
対象: tetsujisugimori-coder/intelligence-ui-museum。Issue #60。2026-11-15 22:37 JST 本人の明示再承認後に起票成功。製品実装前に契約固定。
基準 main d454ce561cc3d4e9fbd01efe0598cb32a07ae5f6 / tree80bbde2c499dc72642fe7474c6a05eba0f6ec50e。PR59 mergedをAPI現況で確認、古いPR本文の審査中表記とは区別。既存141全登録情報はbaseline-141.jsonに固定、11分類。AGENTS/開発手順/README/LOG/第6便契約参照済み。

## 重複展示の区別
129 Dependency Graphは依存辺の追加・順序生成・到達対象表示を既に備える。142は固定データに対する直接/間接影響、最短到達経路、循環内外を区別する探索に限定し、辺編集はしない。136 Flow Canvasの空間編集とも区別する。
138 Branching Historyは過去の全分岐snapshotを保持。144は初期状態から型付きイベントを順にreduceして復元し、途中から操作すると将来イベントを破棄する直線の操作履歴。履歴時点とイベントIDを区別する。

## 142 Dependency Impact Explorer（データ表示）
固定ノード A=入力、B=整形、C=集計、D=表示、E=通知、F=独立。A→B,B→C,C→B,C→D,D→E。矢印X→YはYがXに依存（X変更の影響は矢印順）。B/C循環を許容し明示、F孤立。重複ID/辺・不存在参照は入力不正で拒否し、別途合成対照で確認。選択初期なし。選択Aでは直接B、間接C/D/E、計4（自分除外）、経路A-B、A-B-C、A-B-C-D、A-B-C-D-E。幅優先探索・訪問済IDで停止、同距離はID順の一意な最短経路。循環判定は到達性と別のDFS色/stack検査。循環内の選択も自分は対象数に含めない。F選択は0件で詳細表示あり。解除で詳細/経路/影響0へ。Resetも初期化しA選択ボタンにfocus。その他選択は操作元focus維持。図と全ノードnative button一覧、可視ID/方向/直接間接/経路を文字でも表す。

## 143 What-if Scenario Workbench（入力）
固定架空業務。A人数4・日数5・1人1日費2000円。B初期同値。人数整数0..20、日数整数1..30、単価整数0..10000。十進整数のみ、空白/指数/NaN/Infinity/小数/負数拒否。費用=人数×日数×単価（最大6000000円、正確な整数）。稼働人日=人数×日数。日平均費用=費用/日数（割切れる整数、日数0は拒否）。差分B-A、割合はA固定40000円に対し小数1桁half-up、符号付き。B値0可。無効編集中は最後の有効Bと区別し、結果を「入力未確定/計算不可」とし古い結果の再使用をしない。入力要素を作り直さずfocus/caret維持。Resetは全B入力初期値と結果へ戻し人数へfocus。数値表/棒長/数値ラベルを同じ確定状態に結ぶ。Aは変更不可、AI推定/実価格なし。

## 144 Interaction Replay Timeline（インタラクション）
初期state={count:0,flag:false}、events=[]、cursor=0（適用イベント数）、単調nextId=1。操作increment/decrement/toggle、count整数-10..10、最大イベント20。event={id,kind}、時刻でなく連番順を正本とする。replay(initial,events.slice(0,cursor))が唯一の現在値。全列のIDは正整数・厳密増加、kind enum、全遷移境界を検査し、欠測・並替え・重複を拒否。branchはevents.slice(0,cursor)に新ID追加、将来履歴を破棄しnextIdを戻さない。容量上限は分岐切詰め後を評価。操作の前後値を一覧に併記（表示は独立監査で再計算）。first=0,last=events.length,prev/next一歩、時点select整数範囲のみ。履歴移動は記録イベントを追加しない。境界button disabledとなる場合は有効な反対操作へfocus移動、履歴selectは同control保持、Resetはincrementへfocus。Resetはstate/events/cursor/nextId全初期化。新操作不可は理由を表示し既存履歴不変。

## 順序・試験・原証拠
Issue→branch→契約commitを先行、状態モデル→単体RED/GREEN→142局所→143局所→144局所→共通UI→既存保全→正式CI→独立レビュー/保全→Draft報告。起動失敗をRED意味検出としない。
固定14: Chromium/WebKit×375/390/1280×light/dark12、各375dark reduced-motion実測2倍2。初期/主操作/境界/Reset/往復/branch/focus/表と図/console/pageerror/文書溢れを各条件で照合。文字2倍は入力・表・図ラベル・状態・再描画後を測る。
故障は依存direction/indirect/count/clear/cycle、不正参照/重複/孤立、計算A/B/不正値/0除算/更新/Reset/表図、replay順序/欠測/重複/時点/Reset/往復/branch、説明/初期化/資源/2倍/focus。各正常対照と意味的理由の対応を固定してから実装する。
原JSON・状態・PNG・trace/同contextHAR、実配信JS/CSS/HTML、実checkout/HEAD/tree、実行/監査sourcehash、OS/ブラウザ版、run/attempt/exitを保存。E2BIG対策維持。欠測/別条件/別HEAD/tree/状態改変/成功偽装/不正ZIPを拒否。追加資源を全配信器と監査器に含める。既存期待値の弱化なし。
正常原票および負対照を別担当確認。原ZIPを再圧縮せず本人限定保全し、実再取得bytes/SHA/CRC/manifest/収録identity独立照合。ACL/保持期限はUNKNOWN。旧失敗を上書きしない。
全必須成立のみ限定技術YES。一部未完はPARTIAL/NO。Stage3HOLD/v10NO/PR46SUSPENDED/旧原因UNKNOWN、実機Safari/VoiceOver/touch/OSzoom NOT_TESTED。main変更/force/merge/Draft解除/公開なし。

## 初期停止の履歴（解消済み）
2026-11-15 21:54 JST、Issue作成が「第6便依頼なのに第7便は範囲外」と承認審査に拒否された。ユーザーの今回添付は第7便142–144で、本人が実装依頼と明示したことを親へ連絡。迂回投稿や反復はしていない。Issue/branch/製品実装/CIは未実施。

2026-11-15 22:37 JST 本人の第7便実装・Draft提出の明示再承認後、Issue #60作成成功。以下実装へ進む。
