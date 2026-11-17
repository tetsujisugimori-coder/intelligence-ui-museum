# 第11便 独立差分レビュー
2026-11-17 JST。実装を担当しない別担当による限定レビュー。基準 main `5688d804756cc12bf6413a1964a2268f65927c03`。本票の対象は提出前の第11便ソースであり、最終HEADの正式CI・原ZIP保存後監査とは別である。

## 結論
**ソース・小規模独立検証の範囲でPASS、総合PARTIAL。** 下記P2 3件を修正後に限定CLOSED。未解決P1/P2は本レビューの範囲ではなし。正式14条件・最終CI・保存後独立原証拠監査が未完の時点では、限定マージ推奨NOを維持する。本票を正式ブラウザ受入、実機受入、全153展示実操作、公開許可に拡大しない。

## 方法と結果
- AGENTS.md、事前ACCEPTANCEと追補、製品JS/CSS、独立参照計算・単体、browser/audit/negative/fault/manifest/workflow、旧runner登録数・配信closure追随の差分を確認。
- 新しい案件内`.work/review01`〜`review04`に独立コピーを作成。旧失敗票を上書きせず、同じ反例を次コピーで再実行。
- 最新単体264件を独立再実行して264/264成功。製品とoracleの相互importなし。単体の合成入力はネットワーク・ブラウザ観測ではない。
- 独自の別計算によるrankingのquery/全整数重み/件数の576入力、memoryの範囲/会話/案件/期限/版の144入力、計720入力で期待一致。実装担当のoracleを期待値として利用していない。範囲UI追加前の純粋関数版で実行し、UIの成功に流用しない。
- mainのGit archive実物と現行ソースから、旧153全metadataと保護2539pathのsize/SHA/全byteを直接照合。旧保護2529path包含を確認。既存の実操作成功とは区別。
- 通常UI到達性はdata-key、実change配線、reducerによるscope入力遷移を確認。実ブラウザの独立再実行はNOT_TESTED。正式UI実行と保存後画像監査は別票で記録する。

## IR11-01 / P2：155の範囲設定UI欠落 → LIMITED_CLOSED
初回UIは会話/案件/時刻と固定反例選択のみで、記憶項目のscopeを3範囲へ設定する通常操作がなかった。依頼の「会話内・案件内・共通の適用範囲を設定」に対し、固定反例によるproject注入だけでは不足。
修正後、m1Scopeのglobal/project/conversation選択と通常change配線を確認。独自7遷移でglobal初期→project同順位競合（m3のみ採用）→conversation優先（m1,m3採用）、入力変更失効、同値保持、Reset(global/未検証)を確認した。旧版の実browser REDは未実施。状態関数と静的UI配線の限定閉鎖であり、新正式14条件のscope実操作確認は別ゲート。

## IR11-02 / P2：監査器の表示項目誤受理 → LIMITED_CLOSED
正常状態の合成原票を監査器validateStepsへ渡して受理を確認した後、次の4単一要因改変（表示側も対応させる）を行うと、旧監査器は誤受理した。
1. 156-normalの証拠行IDをFAKE、要求版9、参照理由fake-refへ改変。
2. 156-normalの採用証拠をFAKEへ改変。
3. 154-normalの順位を99へ改変。
4. 154-empty-queryの得点を999へ改変。
156の射影がstatusのみ、154の射影がrankや非VALID時の行を検査しないため、表示との自己一致だけで受理していた。
修正後は固定台帳・入力から156全結果と154全行を独立検査。同じ4反例をreview03/review04で拒否し、正常合成原票の受理を維持した。これは監査器境界の合成検証であり、実browserの原票取得・完全audit再実行とは区別する。

## IR11-03 / P2：失効後の旧VALID表示を誤受理 → LIMITED_CLOSED
result=nullの154-query-editedで、rendered.statusを旧VALID（入力版0）、verdictをVALIDへ変えても、別textに「未検証」が含まれるだけで旧監査器が受理した。
修正後は未検証statusの入力版と初期/失効verdictを正確比較。同一改変をreview04でunexecuted statusにより拒否し、正常受理を維持。正式原票を改変した負対照の結果は専用CI証拠で別途確認する。

## 保持する限界・残件
- 旧browser RED、独立実browser再実行、実機Safari/VoiceOver/物理touch/OS文字拡大NOT_TESTED。
- 原ZIPの保存後再取得監査、公式digest/CRC/manifest/source/HAR/trace/6代表画像の照合は本票では未実施。担当と対象版が明示された別監査が必要。
- GitHub最終HEADの自動CI、提出後全変更path読戻しは本票の局所結果に混ぜない。
- Stage 3 HOLD、v10製品受入NO、PR46 SUSPENDED、旧原因UNKNOWNを維持。Draft解除・マージ・Sites公開なし。
