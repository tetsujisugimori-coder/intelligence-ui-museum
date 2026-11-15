# 第9便 独立レビュー（中間）

2026-11-16 JST。実装・harness作成とは別のレビュー担当による読取りと独立Node確認。対象 `tetsujisugimori-coder/intelligence-ui-museum`。この文書を作成した担当は製品・runner・oracleを変更していない。

## 対象版

- HEAD `65e06f89cc0714a1396a879bca8a65e30501170e`
- tree `3a6837ce2a9a2d23fbd168fe307a1434b15a18b1`
- wave9.js SHA-256 `4f0f0465ba2239d0191636f0e94358a76142f1590b3629f765b8ff0b61925b9b`
- wave9-contract.cjs SHA-256 `776b57d9fd12572ee875844f8871d27be34f48a849ba25771a8fa5f8e53548cb`
- wave9-audit.cjs SHA-256 `1778c8a67f10dee7fafaac63f4f6f3aae338867d41407a49d4faf2a95318f8a5`
- wave9-browser.cjs SHA-256 `69872d182f1ec45144c1c7de4290dab3ae418b51bf6ae73ced13caed89787733`

AGENTS、事前受入契約とR1追補、製品・純関数試験・固定oracle・意味故障契約・監査・監査負対照・browser runnerを直接読んだ。local02の実行sourceは別コピー。後続変更をこの実行結果へ遡及適用しない。

## W9-R1 P2：資料の意味と関係identity（同反例範囲で閉鎖）

旧版は「開館時刻は未確認」を9時への反証とした。また既知claim IDのすり替え、unknownからsupportへの改変、新規関係IDを誤受理した。事前設計にも誤りがあり、試験だけの修正とは扱わない。

固定s3第2行「開館は10時です。」を追加、e5の完全な関係組を固定した新版へ、保存した旧同一入力を独立再投入。正常はVALIDを維持し、旧conflict・claim/type/idすり替えはINVALID。新conflictは支持1・反証1・未判定1でCONFLICTを維持。資料本文と引用を一緒に8時へ改変する反例もfixed source/relation mismatchで拒否した。未確認を反証に読み替えない範囲で閉鎖する。一般的な自然言語理解を検証したものではない。

## W9-R2 P2：表示内容の監査不足（未解決）

local02 `chromium-375-light-1` の完成56step原票を直接読み、正常はvalidateStepsで受理された。同じ原票の独立コピーへの次の改変も受理された。

1. 149の表示本文の引用「開館は9時です。」を8時へ変更。
2. coverage-inspect-sourceの表示をcoverage-inspect-claimの表示で置換し、対象切替を無効化。
3. rubric-missingの表示へ旧総点と「順位 A」を加え、rendered.winnerも順位Aとする。

モデルstateは完全照合されるが、149の実表示引用・参照対象、および150の未確定時の順位/総点不存在が固定照合されない。これは製品の不具合実証ではなく、表示の意味的な誤りを監査が見逃す実証。正しいmodel JSONだけで画面の正しさを認定できない。

最小案：引用行・参照対象identity・固定資料原文・総点欄を構造化してsnapshotし、製品をimportしない固定oracleで比較する。INVALID/INCOMPLETE/NO_WEIGHTでは総点と順位の不存在も確認する。同じ3コピーを拒否し、未変更原票の受理を維持すること。旧原票を書き換えず、新snapshot追加部分は新実行で検証すること。

## その他の確認範囲

148は入力長をparse前に制限し、反復走査でdepth/node/array上限、syntaxとschemaの分離、追加propertyとprototype関連keyの拒否を実装している。エラーpath/上限試験を読取り。任意キーに対する表示pathの完全な標準準拠までは認定しない。

150は別の整数計算により36組（重み0・初期・逆転・最大重みと、零点・欠測・同点を含む）を独立照合しPASS。点数0と欠測、重み0の欠測除外、丸め前整数和による順位を確認。任意入力の全列挙試験ではない。

監査は14条件の完全集合、row HEAD/tree、10実行source、HTML由来の配信資源、HAR/trace/PNG、固定36意味故障を検査する構成。負対照は18意味＋3構造にHEAD誤認を追加して計22件となる。完全な正式原票による監査完走/22負対照の独立実行は未実施。

local02原票でChromium7条件×56stepsおよび18正常/故障pairのPASS記録を読んだ。正式両engine14条件/36pairへの代用ではない。Chromium375darkの148/149/150代表画像3枚を目視し、文章と識別表示が読めることを確認。150表の右列は横scroll領域にあるが、全列へのスクロール操作の独立実証は未実施。WebKit・物理Safari・VoiceOver・物理touch・OS文字拡大は今回の独立確認対象外。

## 判定

中間総合PARTIAL、限定マージ推奨NO。R2未解決、正式CI・原ZIP保存後実再取得・完全性・保護対象最終不変確認はPENDING。局所の算術PASSとR1閉鎖を全体受入へ拡張しない。Stage3 HOLD、v10製品受入NO、PR46 SUSPENDED、Draftを維持する。

## W9-R2 再確認追補（2026-11-16 JST）

更新後oracle SHA-256 `a1aca38cb62350949903eebffc2d4019f43b43e9ecce5fa9328b9cb1d4f11f06` を直接読み、独立担当が保管した同じ4原票コピーを改変せず再投入した。正常ACCEPT、引用改変・inspect表示差替え・欠測への旧総点追加の3件はすべて意図した `rendered exact text` のassertionでREJECT。起動失敗ではない。renderSchema=2を宣言した旧原票は、新しい構造欄が無いため `initial absent score` で拒否されることも確認。

149/150の表示全文を固定oracleで照合し、構造欄score/quotes/inspectHeading/sourcesを追加、未確定時winner/contributions/score不存在を検査する修正を確認。正式auditはrenderSchema=2必須。旧原票の限定的なsemantic再確認と、新snapshotの実測・正式受入を分離している。R2の旧3反例見逃しはこの範囲で閉鎖可能。ただし新構造欄を伴う正常実ブラウザ原票はこの追補時点で未確認、正式14条件・36pair・27監査負対照（旧21＋HEAD＋今回5）はPENDING。

この追補は中間判定を全体PASSへ変更しない。総合PARTIAL・最終受入/マージ推奨PENDING（必須未確認中はNO）を維持する。
