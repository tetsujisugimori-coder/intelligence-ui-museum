# 第8便 結果（最終追補済・過去経過は保持）
2026-11-16 JST。tetsujisugimori-coder/intelligence-ui-museum / Issue #62。

## 最終判定・正式結果（2026-11-16 JST／実装・検証対象版）
**限定技術PASS／正式CI PASS／原ZIP保全整合PASS／今回の展示追加に限る限定マージ推奨YES／総合PARTIAL。** 対象は第8便145–147、143のP3修正、旧回帰の最小追随修正。既存のStage 3 HOLD・v10製品受入NO・PR #46 SUSPENDED・根本原因UNKNOWNは変えない。マージと公開はこの記録の時点で未実施。

- 正式に検証した実装HEAD `787a057b6d4f22324746e1b2cada23a97dc6b226`、tree `40d7989e1e15f44fae3ec5b1566e26a0ab621594`。これ以降の**文書のみ**の補訂commitは、この実行版と同一HEADであったことを意味しない。CI結果を別版の実行成功に読み替えず、補訂後の差分とチェック状態をマージ前に別途確認する。
- 正式12 workflow・17 checksはすべてsuccess（attempt 1）。代表run: Wave8 `43757497927`、通常CI `43757497993`、Wave1 `43757498029`。Wave8の44 Node test、Chromium/WebKitの14条件×41段階、36正常／故障pair、監査器21負対照を提出原票と照合済み。timer、Tab/Space、取消、旧通知、Reset、実測文字2倍・143の数値改行抑止を含む。
- 旧実装HEAD `f81e4df16c7716480cbd4b452ecc638434805ed1` は12 workflow中10成功・2失敗。Wave1の隔離コピーへのBASELINE欠落、kanban監査のWave8資源期待集合欠落、noJSの旧表示総数144という追随漏れを限定修正。同一固定入力で旧RED→新GREENを確認し、旧失敗と原票は上書きせず保管。従来の操作期待値・timeoutを緩めていない。
- 最終正式原artifact 17 ZIP（合計770,332,228 bytes）＋runlogs 3 ZIP（648,954 bytes）をWindows指定領域 `C:\Users\tetsu\Dev-Artifact-Archive\intelligence-ui-museum\Wave8-20261116\HEAD-787a057` に無加工保存。保存後に別担当が20 ZIPの実物を再取得し、全byte/size/SHA/CRCを照合。17 artifactは公式digest/size一致、3 logsは公式digest NOT_PROVIDED（提供されない値を一致認定しない）。Wave8 manifest 666件、Wave7 manifest 695件は照合済み。manifestを備えない他のartifactに完全manifest検査済みという意味を付さない。
- Wave8の実行source 11件と配信19資源×14条件を原票・HAR本文・対象Git blobへ全byte/hashで結合。後取得Git blobは当時の原証拠とは区別。独立担当は全20 ZIP、14/36/21の理由、両engine代表4画像、3回帰修正の結果を確認。独立監査の詳細は PR #63 最終報告と保存台帳を参照。
- 旧回帰の大半は保全レベルの監査であり、依存npm/browserバイナリ実体は一部未収録。全画像目視・実機Safari/VoiceOver/物理touch/OS文字拡大はNOT_TESTED。Windows保管先ACLは「本人限定」と未認定、保持期限UNKNOWN。Issue #62への最終追補は投稿審査拒否のため未投稿で、PR #63へ記録した。これらを総合PARTIALとして維持。

根拠： [PR #63 最終報告](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/63#issuecomment-6901191447) ／ [対象HEADのActions](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions?query=event%3Apull_request) 。

**履歴の読み方：以下のPENDING・限定マージNO・未保存等は各節の記録時点の判定であり、上記の最終結果を上書きしない。旧失敗と途中評価を意図的に残している。**

---

## 開始・提出経路
基準main dbba2e7f0900191caa88497d6d3a881c16368a16/tree3c34ab1fd044ee446becd93369f5a1c877ce4d9a。PR61は2026-11-15T19:12:50Z merged。144登録/11分類。旧READMEは第6便141記載で、追補と先頭を現況へ補訂。旧報告履歴は保持。
Issue作成は初回承認審査拒否。本人の具体範囲への明示再承認後#62成功。旧作業域を使わず専用clone/専用TMPDIR、空き約49GB。契約先行local5722546/tree044b8b69c0a6273d078ab7a95b0e5c4dd0d5c458、正規GitHub同tree契約e4caac0773203808a0fbe919c34b5a213f696419。通常Git pushは認証情報なしexit128、正規connector親子commit方式（非force）を使用。初回update-refは未作成branchの422、create-branchで正常作成。履歴改変なし。

## 製品・保全
145固定3chunk/順序と世代検証/一時停止/中断/再試行/Reset、146操作ID・版・全内容署名/改訂失効/承認と実行結果分離、147個別試行/失敗のみ再試行/正本集計/旧epoch拒否。全て架空メモリ内、外部通信・認証・権限変更なし。
既存144全登録fieldを基準JSONと全比較。legacy/v09およびapps/v10のGit管理308path集合/全bytes/SHA同一。migrationの原bundle302hash照合PASS。新依存なし・lock変更なし。147展示11分類検査PASS。
既存runnerの展示総数と配信資源closureを147/追加wave8 JS CSSへ追随。従来の操作期待値や時間予算は変更なし。

## 単体と旧回帰
製品単体42PASS（18種の意味的変異/正常対照を含む）。初期module不在REDは実装待ちであり意味的検出に数えない。完了通知時の承認署名検査漏れは同一target改変反例で旧受理RED→修正拒否GREEN。旧wave7単体/契約496PASS、wave1〜7状態/結果契約75PASS。これらは局所sourceに対する結果であり正式CIではない。

## 143 P3局所修正
同じ基準sourceの375px dark、実computed32px、入力20人/30日/10000円でbefore数値7セルが複数行。td white-space:nowrap/overflow-wrap:normalで0セルへ。初稿afterはthが一字縦割りとなるためth min-width:5emを追加、after02画像で独立実見。計算式・範囲・Resetは変更なし。既存名前付き内部scrollを使用、右列操作は正式行列で確認する。誤ったPlaywright module指定による初回起動失敗も保存、意味的REDではない。

## 独立レビューと進行中範囲
W8-R1:整合改変chunk本文/承認対象が初回監査を通過するP2。同じ局所原票の独立コピーで旧受理→固定全状態検査の新版拒否、正常受理を確認。W8-R2:timer経路/Tab/Spaceの検査不足は追加中。旧原票は上書きしない。
正式14条件、36fault/normal pairs、21監査負対照、正式CI・原ZIP保全・実再取得・独立最終レビューはPENDING。
総合PARTIAL、限定マージNO、Draft維持。Stage3 HOLD/v10 NO/PR46 SUSPENDED/原因UNKNOWN。実機Safari/VoiceOver/物理touch/OS文字拡大NOT_TESTED。

## 提出前追補
- 独立W8-R3：全events空の整合改変が旧検査器を通過。固定全イベント列の新版で同一原票正常受理/3反例拒否を別担当が確認。R1/R3は同反例範囲で閉鎖。
- local01はHEAD61ae5bd/tree f4d35c95でChromium7条件・18pair成功、WebKitは既存host依存不足BLOCKED（起動失敗を意味的検出に数えない）。
- local02は追加timer/keyboard/143scrollを含む部分回帰。記録HEADff86a79に対し起動前のLOCAL_ENGINE絞込み2行が未commitだったため実行source hashは不一致。実行コピーを保存し、この結果をHEAD一致・正式CI成功としない。現在はa50594bで同変更をcommitし、CIではLOCAL_ENGINE指定を拒否し正式14条件を維持。旧原票を後から書き換えない。
- runner検査は最初cwd違いでENOENT失敗を保存、正しいapps/v10で25PASS。製品失敗とは別。
- Windows ギャラリアは接続・指定archive root実在、約382GB空き。新Wave8フォルダ未作成。read-only sandboxのため保存時追加実行審査が必要。root ACLの本人以外の権限を確認しており本人だけのアクセスと断定しない。保持期限UNKNOWN。

## 2026-11-16 JST 正式初回と回帰整合修正
提出 f81e4df16c7716480cbd4b452ecc638434805ed1/tree70b82cb46ea86edc24f2105c031b1d798a85b067 の12 workflowは10成功・2失敗（すべてattempt1）。第8便43754014566は14条件・36pair・21監査負対照がログ上成功。正式原ZIP14177669653は135395972 bytes、SHA256 892393067e8c2aa1cf5ed25cd56c86c539d4b19607ac42b58ffec6ac45f3f96a。Windows保存後全byte・公式digest・CRC読戻し済、独立内部監査は進行中。この成功を後続HEADへ転用しない。

旧回帰の追随漏れ3箇所を修正。製品・既存画像期待・timeout・ケース数は変更しない。
- Wave1 43754014525: verify.pyの新しい必須BASELINEを隔離コピーし忘れ、正常入力がFileNotFoundErrorで停止。docs/wave8/BASELINE.jsonだけコピー集合へ追加。同じデータで旧exit1→新normal exit0、4変異すべて拒否。ブラウザ前停止でartifact0、原ログを別保存。結果欠落による後続ENOENTを別の製品不具合と数えない。
- 通常CI43754014605 kanban: runnerはwave8.js/cssを収録するが監査期待集合がwave7止まり。対象固定Git sourceがwave8を参照する場合だけ2資源を追加。各Git bytes/hash・集合完全一致は維持。同一固定sourceの旧集合不一致→新一致、旧source集合は不変。
- 同CI nojs: 静的cards117は維持し表示総数の期待117/144のみ117/147へ更新。同じ固定HTMLを旧regex拒否→新受理。ブラウザ不要の契約再生であり、新ブラウザ実測の代用ではない。

追加2回帰を含む44 Node test成功。隔離保全正常/4故障成功。独立担当が3原因と最小差分方針をreadonlyで照合。追加testは正式workflowに含め、実行source収録/監査集合にも追加。旧失敗原ZIP・ログを保持し、新HEAD正式CIは別実行としてPENDING。総合PARTIAL・限定マージNO。
