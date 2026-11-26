# 第15便 受入契約（事前固定）

- Issue #79、基準 main `1c17ce9f722e87ed7bd4f99d6a96a5ce5d2cd078`（PR #78 merge）、tree `9894aca5ea75a8519b2df6db22c39f69061d405f`。165展示・11カテゴリーおよび静的117件を保持し、166〜168を既存カテゴリーに追加する。v09・v10・SDK・lockfile・既存試験の強度・過去証拠を保護する。
- 共通題材は架空の青波交流館の申請通知。166の候補判定→167の仮想再試行→168の副作用前のキー照合として関連を説明するが、展示の状態は独立。147は複数工程中の回復、166〜168はイベント選別、単一の再試行判定、同一処理の重複抑止をそれぞれ扱う。全部オフライン。

## 166 Event Trigger Inspector

イベント type（submitted/approved/rejected/updated）、eventId、amount（非負の安全整数）、urgent（boolean）、note（string）の必須型を検査する。0・false・空文字は値として有効。固定 submitted は 0/false/空文字、approved は 12/true/「承認」、rejected は 0/false/「却下」、updated は 2/false/「更新」。故障選択 missing は note がない、unknown は未知 type。条件は等値だけ（evalなし）、field は type/amount/urgent/note、値は同じ型のJSONリテラル。未知field、不正JSON、型不一致、未知typeの条件値を拒否。受信しても処理成功ではない。固定の候補は申請受付・承認・却下・更新の各通知。履歴には判定と、同一種類・eventIdの今回セッションでの再配信を別欄で保持。無効条件も受信済みのイベントと区別し、履歴は最近12件を表示。Resetで全履歴、見たID、判定、入力を初期化。
- UI契約：`[data-wave15="166"]` 内 `[data-w15-event]`（submitted/approved/rejected/updated/missing/unknown）、`[data-w15-field]`（type/amount/urgent/note/invalid）、`[data-w15-value]`（初期 `"submitted"`）、`[data-w15-run]`、`[data-w15-status]`（`data-state`: idle/candidate/filtered/invalid-event/invalid-filter）、`[data-w15-history]`、`[data-w15-repeat]`（`data-repeat`: true/false）。正常 submitted＋amount 0・urgent false・note "" は候補、amount 1は不一致、missing/unknownは入力不正、amount "0"は条件不正、同一IDを2回で再配信。

## 167 Retry & Backoff Simulator

仮想整数ms。tries 1..8は初回を含む。base/cap 0..MAX_SAFE_INTEGER、timeout 1..MAX_SAFE_INTEGER。入力の不正、加算の上限超過を拒否し、Infinityや精度落ちを通さない。待機は immediate=0、fixed=min(base,cap)、exponential=min(base×2^(失敗順−1),cap)。上限が先に効く場合は安全に上限へ丸める。初回は0ms。各結果は success（10ms）、transient（retry可・20ms）、permanent（不可・20ms）、timeout（締切で結果不明・retry可の計画のみ）。観測時間がtimeoutを超える場合も結果不明。時刻超過は timeline を確定しない。結果不明の再試行計画は、元の副作用がなかった証拠ではない。168のキー照合を実処理前に行う必要がある。履歴は最新シミュレーションの全試行、Resetで全部初期化。
- UI契約：`[data-wave15="167"]` 内 `[data-w15-policy]`（immediate/fixed/exponential）、`[data-w15-scenario]`（first/recover/exhaust/permanent/timeout）、`[data-w15-tries]` 初期4、`[data-w15-base]` 100、`[data-w15-cap]` 250、`[data-w15-timeout]` 50、`[data-w15-run]`、`[data-w15-status]`（idle/success/exhausted/permanent/unknown/invalid/overflow）、`[data-w15-history]` 試行。first=[success]、recover=[transient,transient,success]、exhaust=transient反復、permanent=permanent、timeout=timeout反復。recoverの開始時刻は immediate 0/20/40、fixed 0/120/240、exponential 0/120/340。exhaustの指数待機は100/200/250、timeoutかつtries=1はunknown。負待機はinvalid、fixed＋base=cap=MAX_SAFE_INTEGERかつrecoverはoverflow（20+MAX_SAFE_INTEGER）。

## 168 Idempotency Workbench

eventId（配信識別）と key（処理識別）は独立。通知送信という単一のスコープ。申請識別と通知内容の組を安定順で比較する。空白のみの必須key/eventIdは拒否。メモリ内保持、Reset/ページ更新で消える運用モデルであって永続、分散、exactly-once保証はない。受け付け前に key/入力を比較：新規→running登録し実行候補、同一処理中→in-flight、同一完了→duplicate、異内容→conflict、同一結果不明→blocked-unknown。実行候補だけでは副作用は増加しない。成功応答は running→completed、副作用+1。タイムアウト／裏側成功は running→unknown、仮想サーバ側の副作用+1（学習用観測であり依頼側からの保証ではない）。照合は照合証拠がある unknown→completed、副作用は増やさない。通常再送後も合計1、結果不明を未実行扱いする明示的な隔離故障対照では合計2。故障対照は別の完結した履歴で、通常台帳・件数を変更しない。Resetで台帳・履歴・入力初期化。
- UI契約：`[data-wave15="168"]` 内 `[data-w15-id]` 初期 E-APP-01、`[data-w15-key]` 初期 notify-01、`[data-w15-payload]` 初期 standard（alternateも選択）、`[data-w15-run]`（要求）、`[data-w15-complete]`（成功応答）、`[data-w15-lost]`（タイムアウト／裏側成功）、`[data-w15-reconcile]`、`[data-w15-control]`（分離した正常／故障対照を表示）、`[data-w15-status]`（idle/new/in-flight/duplicate/conflict/blocked-unknown/completed/unknown/invalid）、`[data-w15-history]`、`[data-w15-effects]`、`[data-w15-control-output]`（data-normal=1/data-fault=2）。新規 E-APP-01 →タイムアウト／裏側成功→E-APP-02で同一キー再送は blocked-unknown、仮想副作用数1→照合→再送duplicateで1。alternateはconflict。失敗モデルだけ2。

## 共通UI・検証

- Resetはカードの既存ボタン、再描画後は展示の最初の主要コントロールにフォーカス。明確な日本語の理由、名前付き標準コントロール、縦に折り返すUI、モーション依存なし。状態は文字と可視履歴で示し色だけに依存しない。操作10件以上を独立の期待値（上記の手計算・状態ベクトル、製品コードをimportしない）で検査し、独立Oracleに意図的な故障を入力し拒否を確認する。
- Playwright 1.56.1 Noble digest固定を継承。Chromium/WebKit各375/390/1280px×Light/Darkの12、各375px Dark reduced motion＋実測文字2倍の2、計14。表示・操作・エラー・状態遷移・キーボード/フォーカス・Reset・スクロール達着・横はみ出し・console error/pageerrorを実操作で確認。正式CIの固定HEAD/tree/run/job/attempt、操作原票・PNG・trace・HAR・実行ソース/配信実体・manifestに結合し、監査器に故障レコードを入れ拒否を実測。
- 受入には正式14件、既存回帰、独立レビュー、当該正式原ZIPの本人限定・権限内保存と別担当の実再取得（全バイト/SHA-256/CRC/manifest照合）が必要。失敗・欠測・証拠不整合・未解決P1/P2はマージ拒否。実机Safari、VoiceOver、物理タッチ、OS文字拡大は別のNOT_TESTED。Stage 3 HOLD、v10製品受入NO、#46 SUSPENDED、#72 P3 OPEN、既存WebKit原因UNKNOWN。Draft維持。公開・マージなし。
