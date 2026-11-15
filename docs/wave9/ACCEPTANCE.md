# 第9便 事前受入契約
2026-11-16 JST / Issue64。基準main f5b1aefa3776dc7713a038cb597952a28f7912d6/tree f2e22a84c29a7842f20b903e37b67f9d4adeba14。PR63 merged、最新2文書追補と旧失敗/局所source不一致を読取り。専用clone/branch、空き38GB。製品実装前に固定する。変更は追補で理由・版を記録しPASS目的で緩和しない。

## 共通契約
既存147全登録field、11分類、legacy/v09/apps/v10/archive/reviews366原本path/size/SHA、SDK/lockを保護。148は入力、149はデータ表示、150はインタラクションに追加（既存分類のみ）。固定架空・メモリ内、実AI/API/外部通信・eval・保存・認証なし。既存131はschemaから入力フォームを作る教材、148は生成済JSONの構文と限定schema適合の検査。141は出典の経路、149は主張別支持/反証と欠落。143は業務入力のwhat-if、150は同じ回答の評価基準/重みの比較。各表示に違いと非公式教材を明記。
全入力変更は古い結果を無効化して未検証、同値再選択は現結果保持。検証/比較は明示操作。Resetは固定初期状態と起点focus。結果はstatus text/role=statusで通知、色だけに依存しない。長文・数値は文書幅からはみ出さず、表だけ名前付き横scroll。キーボードTab/ShiftTab/Enter/Space、focus保持、touch相当タップ、reduced-motion確認。

## 148 Structured Output Validator
固定schema（JSON Schema全仕様ではない）：root object、必須 name/status/score/tags。name string length1..40、status enum draft/ready、score finite number0..100、tags array0..3 of nonempty string最大20文字、追加property禁止。null/array root拒否。syntaxとschema結果を別欄、エラーはpath（$、$.score、$.tags[0]等）/expected/actual/reason。JSON.parseのみ、prototype関連キーも追加propertyとして拒否し評価しない。
固定正常 {name:"架空レポート",status:"ready",score:80,tags:["教材"]}。プリセットvalid/syntax/type/missing/enum/range/array/extra/null/empty/deep/oversize。textarea編集可だが永続保存しない。文字列16384 UTF-16 units、深さ8（root=1）、全node128、配列要素32、エラー32上限。入力長はparse前、深さ/nodeは反復走査で検査し上限ならLIMITでschema採点しない。nullは一node。深さ9は拒否、深さ8はlimitとしては許容（schema不適合は別拒否）。UIは未検証→VALID/INVALID/LIMIT、構文FAILならschema NOT_TESTED。Reset validの初期テキスト/未検証、focus=textarea。結果は構文適合≠事実正確性と表示。

## 149 Evidence Coverage Matrix
架空主張 c1「開館は9時」、c2「毎日開館」、c3「入場無料」。固定資料 s1案内第1版/1行目「開館は9時です。」、s1/2行目「入場は無料です。」、s2休館告知/1行目「月曜は休館です。」、s3調査メモ/1行目「開館時刻は未確認です。」。出典本文は固定教材。関係e1 c1/s1/1支持、e2 c2/s2/1反証、e3 c3/s1/2支持、e4 c1/s3/1未判定。引用は行番号+原文完全一致で検査。資料選択初期s1,s2,s3すべて。選択/除外→明示再計算、各主張支持数/反証数/未判定数と状態。支持>0反証0=SUPPORTED、支持0反証>0=CONTRADICTED、両方>0=CONFLICT、両方0=UNRESOLVED。これは教材内関係の集約であり史実/十分性の自動確証でない。件数多数決をしない。
不正id/重複関係id/引用欠落・範囲外・本文不一致/未知claim/source/relationはINVALID、正しい関係だけを選別してPASSにしない。固定faultプリセットduplicate/source/quote/conflict（conflictは正常にCONFLICT）、空選択は全UNRESOLVED。欠落資料を根拠として数えない。Reset全選択/未計算、focus=最初の資料checkbox。資料・主張クリックで引用と関係を表示するが選択対象identityを変更しない。

## 150 Evaluation Rubric Comparator
固定架空回答A「9時開館。資料1を確認してください。」、B「毎日8時から無料で利用できます。」。点数は教材編集値で実AI採点ではない。軸accuracy/evidence/format/readability、0..5整数またはnull（欠測）。初期A=[5,4,3,3]、B=[2,2,5,5]、重み=[4,3,1,1]（0..5整数）。重みの変更と点数編集、比較button。sum(w*s)/sum(w)を小数2桁表示、順位は丸め前整数加重和で比較。同じ正分母で同点ならTIE。重み0の欠測は集計対象外、正重みの欠測が一つでもあればINCOMPLETEで総点/順位を出さない。全0はNO_WEIGHT、負数/小数/範囲外/非数値/空weightはINVALID。空scoreはnull、0は実測点として扱う。初期加重和A38/B24、分母9、4.22/2.67 A。重み[0,0,1,1]でA3/B5 Bへ逆転、どの軸寄与が変わったか表示。初期との重み差・寄与/式を公開。Reset全初期/未比較、focus=最初の重みinput。結果の正確性は固定算術に限定し回答品質の客観保証でない。

## 検証固定
各モデルの状態遷移と純関数単体、上限/境界/同値再選択/古い結果失効/resetを検査。意味的故障各6種計18×2engine=36正常/故障pair。148 syntax/type/required/depth/path/extra、149 missing/fabricated/conflict/id/duplicate/quote、150 weight/total/missing/invalid/tie/reversal。正常対照受理、故障は意図した不一致理由で拒否、起動例外や構文エラーを意味的検出に算入しない。
監査器負対照21件=18意味改変＋missing-file/source-hash/condition-id（HEAD誤認も独立試験で追加）。正常原票受理、期待値自体の弱化は固定判定との比較で拒否。固定件数は減らさない。旧失敗保持、修正なら同反例前後。
正式14条件=Chromium/WebKit×375/390/1280×light/dark＋各375dark reduced-motion実computed文字2倍。全3展示の正常/故障/編集/選択/Reset/focus/Tab ShiftTab Enter Space/touch相当/console/pageerror/横幅を検査。実機Safari/VoiceOver/物理touch/OS拡大は未実施ならNOT_TESTED。
専用CI source-only変更もtrigger。正式HEAD/tree/実checkout/仮merge/run/job/attempt、JSON/PNG/trace/HAR/配信原byte/source/hash/実行監査依存/manifestを収録。原ZIP正規取得・再圧縮せず承認先保存後別担当実再取得、公式size/digest/全byte/SHA/CRC/manifest/sourceと代表画像を独立照合。依存実体非収録等の範囲は明記。未確認ACL/保持期限UNKNOWN。最終CI失敗・必須未実施・blockingP1/P2ならPARTIAL/HOLD/限定mergeNO。全成功でもStage3 HOLD/v10 NO/PR46 SUSPENDED/旧原因UNKNOWN、Draftのみ。
