# 第10便 事前受入契約
2026-11-17 JST / Issue #66。実装前固定。開始 main f065515b3f52ade79a7e057abb86f385dfcce5e9 / tree 478e0ec826f39793682c445a852aa9e965cebc37。PR65 merged確認。既存open23/29/46は別診断で介入しない。

## 対象と規則
151 Context Budget Workbench、152 Tool Call Inspector、153 Prompt Regression Comparator。153展示11カテゴリー。固定架空教材、公式内部実装の複製ではない。実LLM/API/外部ツール/ネットワーク/永続保存なし。新依存なし。既存150 metadata全項目と旧原本/migration/SDK/lockを保護する。

## 151
固定資料 c1 必須6単位 priority0、c2 必須4単位 priority0、c3 任意5単位 priority1、c4 任意3単位 priority2。初期budget16。独自教材単位でtokenizer換算ではない。必須合計10を先に確保、任意はpriority昇順→ID昇順で収まる場合だけ採用（入らない項目を飛ばし次を検査）。使用15、残1、採用c1,c2,c3、除外c4。必須>budgetはOVER_BUDGET、採用確定なし・不足量明示。budgetは0..100安全整数、priorityは0..9整数。資料は4必須ID・name/size/required固定、priorityのみ変更可。疎配列、重複、不正型、非有限値、固定内容差替えをINVALID。全拒否で正常例を失わない。

## 152
lookup({key:alpha|beta})、sum({a,b:0..100整数})、delete({key:alpha|beta})の架空3ツール。deleteは常にDENIED。余分な引数も拒否。明示runでVALIDATING→AUTHORIZED→MOCK_COMPLETEDを履歴表示。成功は現在call IDに一致する応答一件のみ。unknown/missing/type/unauthorized/wrong-ID/stale/duplicate/timeoutを個別拒否。request IDはepoch+counter、Resetはepochを進め旧応答を失効。失敗結果はpayloadなしで以前成功を残さない。timeoutは固定模擬で壁時計実験でない。

## 153
固定4ケース、各ケースの期待はrequired keys/forbidden keys/field types/exact valuesで限定する。旧/新版出力は架空固定。期待契約自体の欠落・改変はINVALID、出力欠落はUNKNOWN、構造条件不一致はFAIL、全条件一致PASS。oldFAIL/newPASS=IMPROVED、oldPASS/newFAIL=REGRESSED、同状態=UNCHANGED、どちらかUNKNOWN=UNDETERMINED。各条件・理由と両版本文を表示。一般的プロンプト品質を主張しない。

## UI状態
入力変更は結果を即無効化、同値再選択は状態維持。明示run、Reset→起点focus、native keyboard Tab/ShiftTab/Space/Enter、focus-visible、文字状態・非色判定、狭幅overflowなし。light/dark、長文折返し、reduced-motion、computed文字2倍を確認。

## 差別化
131はフォーム生成→151は容量配分。141は出典経路→151は固定入力の選別。143は業務what-if→151は決定的容量制約。144は操作再生→152は呼出し契約・応答照合。146は承認gate→152は引数/ID/許可/模擬結果。147は部分失敗回復→152は単呼出し拒否と古い応答失効。148はJSON schema→152は呼出しライフサイクル。149は証拠網羅→153は固定出力の版別契約回帰。150は重み順位→153は構造条件の達成差。

## 検査と正式証拠
製品と独立oracleは相互import禁止、個別の固定期待値を持つ。正常、不正、境界、疎配列/継承要素、決定性、状態、Reset、同値、古い結果を検査。151 budget/priority/duplicate/missing/fixed-tamper/structure、152 tool/required/type/permission/ID/stale/duplicate/timeout、153 missing-required/format/forbidden/value/expectation/missing-outputを最低意味故障集合とする。少なくとも18故障×2engine=36正常・故障対照組。起動失敗等を意味故障PASSにしない。
正式14条件=Chromium/WebKit×375/390/1280×light/darkの12+各engine375dark reduced-motion/computed2倍の2。全3展示の主要操作、状態、keyboard、focus、Reset、touch相当、overflow、console/pageerror。監査負対照は原票欠落・重複・改変・HEAD/source不一致・状態/表示誤りを検出し正常受理も維持。
新wave10 workflowはsource-onlyでも起動。旧workflow/期待/timeoutは削減しない（登録数と配信closureの最小追随のみ根拠記録）。HEAD/tree/run/job/attempt/checkout/source/HAR/画像/manifestを保存。原artifactは再圧縮せずLibrary保存後別担当が再取得しbyte/SHA/CRC/manifest/source/HAR/代表画像を照合。

## 判定境界
合成/局所/正式/独立目視を区別。WebKit FAILを記録し、Chromiumで代替しない。実機Safari/VoiceOver/物理touch/OS拡大NOT_TESTED。未解決P1/P2・正式CIまたは独立保全未完は総合PARTIAL/限定マージNO。Stage3 HOLD/v10NO/PR46SUSPENDED/旧原因UNKNOWN維持。Draft解除・マージ・Sites公開なし。
