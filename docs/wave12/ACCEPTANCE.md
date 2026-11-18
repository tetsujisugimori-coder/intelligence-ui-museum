# 第12便 事前受入契約 v1
2026-11-18 JST / Issue #70 / 開始main db57a7bb068b5215425b2f845f7253dd1eb2af27、tree de72a58fb4a87f5c7ecdf0399917bc75d6f80e3c。PR69 merged。製品実装前commitで固定する。

## 共通契約
157 Uncertainty & Abstention Workbench、158 Disclosure Boundary Inspector、159 Correction & Re-evaluation Studio。159展示・11カテゴリー、既存156の全metadata、v09/v10、SDK、migration、lock、履歴原票を保持。static/no-JS117を変更しない。固定架空データと決定的な教育モデルであり実LLM/API/検索/メモリ/外部agent/ネットワーク送信/永続化をしない。
各展示の通常入力は編集可能なJSON（入力全文を表示）と固定教材scenario選択。明示Runで判定、編集でresult=null・入力版+1、同じ文字列または同scenarioは状態保持。Resetは初期JSON・scenario=normal・revision=0・history=[]・未実行へ戻してJSON入力へfocus。結果はstatus/reasons/decisionVersion/inputRevisionを文字で表示。壊れたJSON、疎配列、重複ID、欠落・余剰項目、不正型、非有限数、未知enum/refはINVALID、成功payloadなし。起動例外やtimeoutを意味拒否成功としない。159の履歴は旧結果と現在有効な結果を明確に区別する。

## 157：独自の判断十分性
入力厳密keys question,evidence,policy。questionは固定q1。evidenceはdense配列、各項目厳密keys id,claim,stance,strength。idは非空文字列・一意、claimはlocation/date、stanceはsupport/contradict、strengthは整数1..3。policy厳密keys threshold,onMissing。thresholdは整数1..3、onMissingはrequest/abstain。初期 evidence=[{id:e1,claim:location,stance:support,strength:2},{id:e2,claim:date,stance:support,strength:2}]、policy={threshold:2,onMissing:request}。
各claimのsupport最大強度を計算（同claimの資料件数で加算しない）。contradictが一つでもあれば全体ABSTAIN/reason=contradictory-evidence。矛盾なし、両claimの最大強度>=thresholdならANSWERABLE/sufficient-evidence。足りない場合onMissing=requestならREQUEST_INFO/missing-required-coverage、abstainならABSTAIN/insufficient-evidence。空配列は正常な不足。missingは未達claimの固定順location,date。各claimのsupport/conflictを表示。確率や実モデル信頼度でなく、固定教材の充足規則。149の単純coverageと154の資料順位に対し、矛盾優先・保留・追加情報判断を扱う。

## 158：開示境界
入力厳密keys destination,fields,policy。destinationはpublic/internal。fieldsはdense配列、項目厳密keys id,value,classification。idはtitle/contact/secretのみ・重複不可。valueは非空文字列。classificationはpublic/private/secretで、固定idの分類を変えることを許可しない(title=public,contact=private,secret=secret)。初期title=架空展示,contact=fictional@example.invalid,secret=FICTIONAL-SECRET-ONLY。policyはmask/reject。
public fieldはpayloadへ採用。privateはinternalなら値を採用、public+maskなら値を'[MASKED]'へ置換。secretは宛先に関係なく除外。公開不可fieldがありpolicy=rejectならBLOCKED/disclosure-policy-rejected、payload={}。maskならREDACTED/fields-redacted、除外・mask不要ならREADY/permitted-fields-only。空fieldsはEMPTY/empty-fields、payload={}。不正入力はINVALIDでpayload={}。結果・audit・historyは秘密値を含めず、行にはid/action/reasonだけを持つ。元入力欄のみ原valueを持ち、隠れたDOMへ元データを複製しない。152のtool構文検査でなく、宛先とfield単位の許可判断。ネットワーク送信なし。

## 159：訂正と再評価
入力厳密keys original,corrections,threshold。original厳密keys id,score,label、id=r1、scoreは整数0..10、labelはfixed文字列 '架空評価'。thresholdは整数0..10。correctionsはdense配列、各項目厳密keys id,field,value,reason。id非空・一意、fieldはscoreのみ、value整数0..10、reason非空trim文字列。同fieldを複数訂正はCONFLICT/conflicting-corrections（適用なし）、構造/参照不正INVALID。初期original={id:r1,score:3,label:架空評価},corrections=[{id:c1,field:score,value:7,reason:架空資料の転記訂正}],threshold=5。旧score>=thresholdならACCEPT、未満ならREVIEW。訂正後も同規則、結果status=REEVALUATED、理由correction-applied、before={score:3,decision:REVIEW},after={score:7,decision:ACCEPT},applied=[c1]。空correctionsはUNCHANGED/no-corrections。同値訂正はUNCHANGED/equivalent-correctionで適用記録は残す。訂正は真実性の保証でない。153の複数prompt比較、150のrubric比較、156の担当間受渡しに対し、一入力の訂正履歴と現行判定を分ける。

## 事前意味対照
各展示12組以上を正常対照と組み合わせ、固定期待値と製品計算を相互importさせない。
157: 正常、空証拠、片claim不足、threshold境界、弱証拠多数、contradict優先、abstain方針、重複id、欠落、疎配列、未知claim、未知stance、NaN、Infinity、小数、未知policy。
158: 正常mask、reject、internal、全public、空、secretのみ、privateのみ、未知destination、未知policy、重複id、分類偽装、欠落、疎配列、非文字value、未知field。
159: 正常、空訂正、同値、下方訂正、threshold境界、競合field、重複id、理由空、未知field、未知original、欠落、疎配列、NaN、Infinity、範囲外、小数。
共通状態: Run、同値保持、編集失効、scenario失効、Reset、再Run、159履歴と現行の区別。監査器正常受理と状態/理由/stale/条件/source/manifest/証拠参照の改変拒否。

## Browser・保全・判定
Chromium/WebKit各375/390/1280×light/darkの6条件＋375dark/reduced-motion/computed-font-size2倍の1条件＝14。実操作・表示・focus・keyboard・overflow・console/pageerror・失効・Resetを確認。CSS2倍をOS accessibility実測としない。実機Safari/VoiceOver/物理操作/実AI NOT_TESTED。WebKit問題は影響分析し、別engine成功で置き換えない。
正式run/attempt/job/checkout HEAD/tree/source hash、原stdout/stderr、trace/HAR、画像、manifestを追跡。既存原票を上書きせず案件専用領域へ新規保存。承認済み保存先へ原ZIP無改変保存、別担当が実物を再取得しbyte/size/SHA/CRC/manifest/版/条件を照合。ACL/長期保持の未確認はUNKNOWN。再生成ZIPは正式原artifactではない。
許容変更: wave12製品/試験/docs、indexの追加登録159とassets、既存runnerの登録数・配信資源・fixture調整のみ。旧metadata/原本/lock/過去証拠/旧検査の削除・弱化なし。
限定技術受入、独立レビュー、原証拠保全、限定マージ推奨を別判定。未解決重大P1/P2、重大証拠欠落、危険開示はマージNO。総合PARTIAL/Stage3 HOLD/v10製品受入NO/PR46 SUSPENDED/旧原因UNKNOWN維持。Draft提出のみ、公開・mergeなし。

## 独立予備審査による同値境界の明確化（2026-11-18 JST）
事前本文の「同じ文字列」は同値要件の十分条件として狭かった。正常JSONの空白・objectキー順だけの差は入力意味同値とし、表示文字列だけ更新、入力版・有効結果・履歴は保持する。JSON配列順序は保持して比較し、自動並べ替えはしない。不正JSONはraw文字列同値だけを採用。非normal反例から通常編集へ移る場合は検査対象が変わるので失効する。元本文を削除せず本追補を適用する。これは意味同値操作の契約明確化であり、故障入力の拒否条件を緩めない。

## 独立予備審査による診断入力表示の補完（2026-11-18 JST）
診断scenario選択時に入力欄もその固定fixtureへ更新する。normal選択は正常fixtureへ戻る。NaN/Infinity/疎配列穴は入力欄に [NaN]/[Infinity]/[SPARSE HOLE] の表示用文字列として示し、実評価は内部原型を保持する。表示用表記を通常編集するとnormalへ戻り通常JSON値となることを画面に明記する。158の秘密値は入力欄以外へ複製しない。表示入力と判定対象の乖離をなくす補完であり、元反例・拒否期待値を変更しない。
