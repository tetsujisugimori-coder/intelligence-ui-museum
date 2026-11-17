# 第11便 事前受入契約
2026-11-17 JST / Issue #68。製品実装前に固定。main 5688d804756cc12bf6413a1964a2268f65927c03、tree c5832baa409201b99643025a375d35a2da986ef1、PR67 merged確認。既存23/29/46は別案件。

## 共通
154 Retrieval Ranking Explorer、155 Memory Scope Inspector、156 Agent Handoff Inspector。全156展示・11分類、既存153全metadataと原本/migration/SDK/lock/過去証拠の集合・size・SHAを保持。固定架空データ・決定的計算だけで、Museum独自説明モデル。実LLM/検索/API/エージェント/ChatGPTメモリ/永続化なし。公式内部仕様の複製でない。
入力変更はresult=nullとして失効表示、同値入力は版と結果保持。入力版revisionは変更時のみ+1。明示runで結果、Resetは初期入力・未検証・起点focusへ戻す。実keyboard・狭幅・長文折返し・非色理由・空状態を検査。実UI操作と検査用注入は原票で分離。配列はdense own-index、ID重複/欠落/null/誤型/非有限値/未知IDを拒否し、起動例外を意味拒否に数えない。

## 154 順位
資料固定4件: d1 {terms:[城], relevance:3, freshness:1}, d2 {terms:[城,地図], relevance:2,freshness:3}, d3 {terms:[地図],relevance:1,freshness:2}, d4 {terms:[城],relevance:2,freshness:3}。項目はid/terms/relevance/freshness。IDはd1..d4完全集合、termsと評価値は上記固定。入力queryは文字列、trim後の空はEMPTY_QUERY、未登録語はNO_MATCH。登録語は城/地図。該当資料だけを選び score=relevance*wRelevance+freshness*wFreshness、降順、同点はASCII ID昇順。重みは各0..5安全整数、全0はZERO_WEIGHTS（採用なし）。採用件数は1..4整数。不正はINVALID（採用なし）。初期城・重み2/1・件数2→d1=7,d2=7,d4=7、採用d1,d2、d4はrank-limit、d3はquery-mismatch。得点内訳・採用/除外理由を表示。順位は真偽/主張支持を保証しない。149証拠充足、151容量配分とは別。

## 155 範囲と競合
固定初期now=1000（独自整数時刻、Unix/現在時刻でない）、conversation=c1/project=p1。項目はid,key,value,scope,conversationId,projectId,version,expiresAt。id/key/valueは非空文字列、scopeはconversation/project/global、versionは1..9整数、expiresAtは0..9999整数（now>=expiresAtで期限切れ）、nowは0..9999整数。conversation項目はconversationIdとprojectId両一致、projectはprojectId一致、globalは範囲一致。conversation優先3、project2、global1、同scopeはversion降順。同一keyの最上位が複数ならCONFLICTでそのkey採用なし（IDで競合を解消しない）。下位はshadowed、範囲外out-of-scope、期限expired。存在/適用可否/競合解決を別表示。重複id、必須欠落、不正scope/ID/期限、疎配列はINVALID、空配列はEMPTY。
初期4項目: m1 key=style value=短く scope=global conversationId=c1 projectId=p1 version=1 expiresAt=2000、m2同key value=丁寧 scope=project c1/p1 v1 exp2000、m3 key=format value=表 scope=conversation c1/p1 v1 exp2000、m4 key=old value=旧 scope=global c1/p1 v1 exp1000。初期採用m2,m3、m1 shadowed、m4 expired。UIは会話c1/c2、案件p1/p2、評価時刻、固定反例選択。Reset focus=conversation。

## 156 引継ぎ
票はid,from,to,projectId,version,goal,constraints,evidence,unresolved。id=h1、from/toはresearcher/implementer/reviewer（同一不可）、projectId=p1、version=1..9整数。goal非空trim文字列、constraintsは非空文字列dense配列（1件以上）、evidenceは{ id,version }のdense配列（1件以上・重複ID禁止）、unresolvedはdense文字列配列（空=[]は明示的なし、欠落不可）。台帳e1@1/e2@2、未知参照/要求版違いはRETURNED。要求票版2、旧版はSTALE、新版>2はVERSION_MISMATCH。同一票内容の再runはREPLAY（受理や作業完了の二重計上なし）、変更後は再検査。初期h1 researcher→implementer p1 v2 goal=架空表示を実装 constraints=[外部通信なし] evidence=[e1@1,e2@2] unresolved=[]→ACCEPTED。不正構造はINVALID、意味差戻しはRETURNED。形式上受理・証拠内容の真偽・作業完了は別。152の単一tool実行でなく担当間の目的/制約/証拠/未解決事項。

## 事前対照集合
各展示12組以上。正常入力を基準とし次の単一要因差分を照合（境界/期待拒否を含み成功数のため重複しない）。
154: 空query/未知query/重み0全/負重み/重み小数/NaN/件数0/件数5/重複ID/欠落項目/疎配列/不正array/同点順/地図query。
155: 会話外/案件外/期限同値/期限前/不正now/不正scope/欠落ID/重複ID/無効期限/同順位競合/版優先/空配列/疎配列/欠落unrelated項目。
156: 空目的/制約欠落/空制約/証拠欠落/未知証拠/版不一致/重複証拠/同一送受信/未知送信元/旧票版/同票再送/未解決事項欠落/明示なし/疎配列。
独立期待値/参照計算と製品は相互import禁止。正常・故障、状態、結果失効・同値・Reset検査。監査器は正常受理と改変拒否（状態、理由、focus、条件欠落、source、画像、配信資源対応）を確認し、元原票不変hashを比較。

## 証拠と14条件
Chromium/WebKit各375/390/1280×light/darkの6+375dark/reduced/computed font-size前後2倍の1=14。OS文字拡大ではない。keyboard/reset/focus/overflow/console/pageerror/入力変更/同値を検査。実機Safari/VoiceOver/物理touch NOT_TESTED。起動不可BLOCKED、条件削減禁止。新隔離.workコピーと案件TMPDIR、既存証拠削除移動上書きなし。
実行時source収録: index.html、全wave製品JS/CSS、今回browser/contract/fault/audit/negative/manifest、保護baseline、package.json/package-lock.json。runtimeは版と識別情報、依存バイナリ全byte再現保証なし。HEAD/tree/run/attempt/job/checkout・source hash・全配信資源/HAR・trace・状態原票・画像・ログ・manifestを対応。専用workflowの成功失敗原ZIPを無改変保存。その他workflowは結果/ログ対象、全artifact保全と呼ばない。Windows優先、不可なら本人限定Library。保存後別担当が別pathへ実再取得しbyte/公式size,digest/SHA/全CRC/manifest/traceCRC/source/Git/HAR/14条件/対照/6代表画像を照合。保持期限・アクセス範囲UNKNOWNは残す。

## 判定
独立差分レビューと独立原証拠監査を区別。未解決P1/P2、正式14条件・CI・保全未完なら限定マージNO。総合PARTIALと限定技術判定を分離。Stage3 HOLD/v10製品受入NO/PR46 SUSPENDED/旧原因UNKNOWN。Draft提出まで、merge・公開・force・履歴改変なし。
