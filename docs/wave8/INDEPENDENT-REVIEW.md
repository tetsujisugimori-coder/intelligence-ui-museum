# 第8便 独立レビュー（最終追補済・過去経過は保持）
2026-11-16 JST。対象: tetsujisugimori-coder/intelligence-ui-museum / Issue #62。作成に関与しない別担当による読取り・独立反例照合。自己点検と区別する。

## 最終独立レビュー追補（2026-11-16 JST／提出済み独立監査記録の反映）
**対象実装HEAD `787a057b6d4f22324746e1b2cada23a97dc6b226`、tree `40d7989e1e15f44fae3ec5b1566e26a0ab621594`。第8便展示・143 P3・旧回帰追随の限定技術PASS、正式CI PASS、保全原ZIP整合PASS、今回限定マージ推奨YES、総合PARTIAL。** これは既存の別担当による最終監査結果を文書に反映したものであり、文書補訂そのものを新たな独立実験・証拠の再取得と数えない。

- 正式12 workflow・17 checks success。Wave8 `43757497927`、通常CI `43757497993`、Wave1 `43757498029` を確認。最終正式44 Node test、両engine14条件×41段階、36正常／故障pair、監査器21負対照の正常受理・意図した改変拒否が最終原票で報告されている。
- **W8-R1/R3**：チャンク本文・承認対象署名・イベント履歴欠測の旧誤受理について、同一反例の旧ACCEPT→修正後REJECTと無改変原票ACCEPTを確認して限定閉鎖。**W8-R2**：実timerのpause/resume/cancel/reset/離脱、Tab/Spaceを固定試験に追加し、正式条件と記録を確認して限定閉鎖。局所local02のsource hash不一致は当時のまま保持し、正式CI成功に流用しない。
- 最終正式17 artifact ZIP＋3 logs ZIPの計20本はWindows保存後に別担当が実体を再取得して全byte・size・SHA・CRCを照合。17 artifactのみ公式digest/size一致、logs 3件の公式digestはNOT_PROVIDED。Wave8 manifest666件、Wave7 manifest695件、Wave8実行source11件・HAR配信19資源×14条件を照合。両engine代表4画像を実見。manifest未収録の証拠を全manifest監査済みとは扱わない。
- 旧初回実装HEADのCI 10成功・2失敗と原票は履歴として残す。隔離コピーBASELINE、kanbanのWave8資源、noJS総数の追随漏れは旧RED→新GREENの限定修正と正常・故障対照で確認。既存製品・timeout・旧期待値を緩和していない。
- **残る制約**：実行依存の一部未収録、旧回帰の大半は保存整合監査、全画像の目視ではない。実機Safari/VoiceOver/物理touch/OS文字拡大はNOT_TESTED。原証拠のアクセス範囲と保持期限は全面的には確認されていない。Stage 3 HOLD・v10製品受入NO・PR #46 SUSPENDED・従来の根本原因UNKNOWNを維持。未解決blocking P1/P2なしは今回限定の判断であり、製品全体の受入ではない。
- Issue #62の最終追補は投稿審査拒否のため未投稿。結果は [PR #63最終報告](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/63#issuecomment-6901191447) に記録済み。

**この追補以前の「閉鎖待ち」「PENDING」「限定マージNO」は記録当時の判定として保存。後続の文書のみのcommitは、上記の実装・CI対象版と同一HEADの実行であったことを意味しない。**

---

## 対象と範囲
基準main dbba2e7f0900191caa88497d6d3a881c16368a16、契約5722546固定後の作業treeを確認。AGENTS.md、事前ACCEPTANCE、製品wave8.js/css、ブラウザ・意味的故障・監査・監査負対照・CIを直接読んだ。
初期確認したwave8-contract.cjs SHA-256: `8c7362fa61a93eafdc434013c0b404b84dc50f1619242d4a14802e3b246578c6`。
製品wave8.js SHA-256: `b7d13719a73b9c9a0f5dd7b4c7a1ee0714cd7ac27abf9a6a3067190bdf9b673e`。
単体42件を独立再実行しPASS。既存144展示全metadata照合verify.py PASS。Git差分でlegacy/v09、apps/v10、archive、reviews変更なしを確認。これらは既存全展示の実操作受入を意味しない。

## W8-R1 / P2: 正常原票の意味的照合が部分的
初期validateStepsは状態名/世代などの一部のみ固定期待に照合し、チャンク本文・seq、承認snapshot対象などの整合改変を拒否しない。
実行中local01で完成した最初のChromium375light・41段階原票を複製して以下を確認した。
- 未変更原票: ACCEPT。
- chunk1の受理チャンクtextをFORGED、partialとrendered.partialを同値へ変更: ACCEPT（誤受理）。
- approvalが存在する全段階のapproval.targetをforeign-operationへ変更し、拒否段階の前後一致を保持: ACCEPT（誤受理）。
後者は個別承認の対象同一性という核心契約に関わる。元の製品で誤った操作が実行されたとの断定ではない。壊れた原票への検査器の抜け道。
旧検査器、元行、変異生成スクリプト、結果を案件専用の非公開作業証拠に保持。修正担当へ反例を渡し、同入力の修正後拒否と正常受理維持を要請。**閉鎖確認待ち**。

## W8-R2 / P2: 実timer経路とキーボード検査の不足
初期ブラウザ列では自動到着を有効化せず、旧generationを手動dispatchするのみ。これはモデルの拒否契約を確認するが、実timerのpause/cancel/reset/展示離脱後のcallbackを検証したことにはならない。時計を制御する有限試験などで実callback経路を確認する必要がある。
また初期列のキーボードはEnterのみで、Tab/Spaceは未実施。契約に沿う追加確認を要請。**閉鎖確認待ち**。

## 検証限界と現在判定
正式14条件・36pair・21負対照の最終原票、原ZIP保全再取得、代表画像実見はこの時点で未確認。初期局所実行の一部とNode検証を正式CIへ読み替えない。
現在: 独立レビューPARTIAL、W8-R1/R2対応待ち、限定マージNO。Stage 3 HOLD、v10製品受入NO、PR46 SUSPENDED、既存原因UNKNOWN維持。実機Safari/VoiceOver/物理touch/OS文字拡大NOT_TESTED。

## W8-R1 同一反例の独立閉鎖確認
2026-11-16 JST。修正contract SHA-256 `69d9c1ae39ee58af5fcf5509e5ab1043dfc6956c762ade436b77e362592e0934` を独立再実行。元のlocal01・41段階原票と同じ変異スクリプトを使用し、正常ACCEPT、chunk改変REJECT（`fixed chunk payload chunk1`）、approval対象改変REJECT（`fixed approval binding gate-approved`）を確認。製品reducerをimportせず独立固定期待列を追加した変更を読み、重要なチャンクpayload・承認binding・試行履歴・epochなどの固定照合を確認。R1をこの二反例と追加固定照合の範囲で閉鎖。元原票と旧誤受理記録は保持、新CI成功として転用しない。

143 P3の前後PNGを別担当が実見。前は比較数値が分割、後は数値の1行表示を確認。既存内部横スクロールに右列が続き、画像のみで右列の操作確認はしない。行見出しが1字幅で縦長になる点は追加の軽微な可読性候補。計算式・値の変更は確認されない。

## W8-R3 / P2: イベント履歴の欠測誤受理
R1修正後の中間contractでも、全41段階の3モデルeventsを空配列へ変更した原票をACCEPTした。順序検査が空列を許し、履歴の期待件数・内容・表示は照合していなかった。実装操作の履歴欠落を正常として扱わないため、固定操作列に対応するイベント記録・描画の検査を要請。中間検査器・同一原票・変異生成器v2・誤受理結果を別に保存。**閉鎖確認待ち**。

143 P3追加画像p3-after-02を実見。th最小幅により行見出しの1字縦積みが解消。数値の1行保持は維持。右列への横スクロール操作は別途ブラウザ原票を確認する。

## W8-R3閉鎖・R1最終独立再確認
2026-11-16 JST。修正commit `ff86a797e1937347ea292ff143a4fa8b483e7f9b` のcontract SHA-256 `08be82b8ce1e2cea2f2a4a3fc1f1707bd529c93b5673c5415791b77f882f52a7` で、同じ旧local01原票と変異生成器v2を独立再実行。正常ACCEPT、チャンク改変REJECT、承認対象改変REJECT、全イベント空配列REJECT（`fixed stream event history`）。R1/R3をこれら同一反例と追加固定照合の範囲で閉鎖。新正式監査は表示イベント配列の欠測も拒否することをsourceで確認。
R2についてpage.clockによるpause/resume/cancel/reset/離脱callback、Space、Tab移動、および143横scroll確認のコード追加を確認。実行結果確認前なのでR2閉鎖は保留。

## 局所実行の限定追補（2026-11-16 JST）
レビュー担当がlocal02の最初の `chromium-375-light-1` 完了原票を直接読み、41段階の状態、実timerの開始・停止・再開・中断・reset・展示離脱後の不変、Space開始とTab移動を独立に確認した。R2はこの1条件の実callback経路に限り閉鎖。正式14条件全体の閉鎖判定は正式原票の確認待ちであり、局所結果をWebKit等へ外挿しない。

重要な出典制限: local02の記録HEADは `ff86a797e1937347ea292ff143a4fa8b483e7f9b` だが、起動時browser sourceには未commitの局所engine選別変更が含まれていた。実行コピーのSHA-256は `d0225c47947f0c92ca3232558a597c5671f73c676e79f8a119ddaac12d6a7ac7`、同HEADのGit blobは `0029d7d303ef9d00a2be6351b745fc34ed8297837bfc43769ba1f6485bb80921` で不一致を独立確認。原票は変更せず保存する。後続commitで変更を収録しても、この局所原票のHEAD/source結合を遡ってPASSにはしない。上記は実際のコピーに対する機能観察であり、正式CI・Git識別監査の成功ではない。

143について同条件の9数値がnowrapで各1行、右端まで横スクロール可能、文書幅内、reset後の元値40000を原票で確認。前記after-02画像の見出し改善と合わせ、局所P3改善を確認した。正式の文字2倍条件はこの1倍条件で代用しない。

145/146/147の同条件PNGを別々に実見した。説明・架空教材の注意・状態ラベル・ボタン・Resetを狭幅で読め、色以外の文字による区別を確認。146には93と125との違いの説明もある。画像はreset後またはstale epoch拒否後の代表状態であり、全41状態の目視検査ではない。

保存対象の回帰確認としてbase `dbba2e7f0900191caa88497d6d3a881c16368a16` のlegacy/v09・apps/v10・archive・reviewsに含まれる366ファイルをGit blobと作業ファイルでバイト比較し、不一致0を確認。既存144展示metadataの検査とNode42件PASSも確認済み。これは後続commit後の再確認や正式証拠保全を代替しない。

### 提出前の独立結論
- sourceと同一反例の限定レビュー: R1/R3閉鎖、R2は上記局所1条件で閉鎖。検査器を強化したことは全欠陥不存在の保証ではない。
- 正式14条件・36pair・21負対照、最終HEAD一致、正式原ZIP保存後の実物再取得・独立照合: PENDING。
- 独立レビュー総合PARTIAL、現段階の限定マージ推奨NO。正式確認後に別の追補で判定する。
- Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、既存原因UNKNOWNを維持。実機Safari・VoiceOver・物理touch・OS文字拡大NOT_TESTED。
