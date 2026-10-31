# Stage 2-R2 修正前固定計画
固定日時: 2026-10-27 JST。対象: Sites公開source daa42f25dfadd22a1deb5fcbe8c6f98c75a2397f の隔離clone。
過去証拠は不変とし、新規証拠は evidence/stage2r2/ に限る。GitHub一覧28 repoと検索から管理先を特定できず、Issue先行登録はBLOCKED。無関係repoに登録しない。

## 今回の試験
Button/Select: Chromium、320/375/390/1280 CSS px × light/dark × root16/32px (合成200%) =16条件。旧比較と同一の幅区分。スクロールバー有効幅を別記録。各条件でページ横超過、control矩形、文字Rangeと全overflow祖先、祖先scrollLeft=0、キーボードfocus、click/Enter/Space count3、Select一覧→カード→一覧とAX名/hidden input値a,bを確認。root32は固定px文字が拡大しない限界を実font/Rangeで記録。native text zoomは未検証扱い。
focus疑義は320/root32/classic scrollbarでButton本体とoutline+offsetを祖先clipと比較、画像目視。幾何疑義とWCAG違反を分ける。視認性は輪郭が識別可能かを別評価。
runnerは空結果、失敗assert、engine起動失敗、未完了、期待されないbefore失敗を全て非0。beforeの期待REDは明示allowlistのみ除外し、期待REDが再現しない場合も非0。独立子processで元実装のexit0→修正後exit1/成功exit0を観測。これは判定経路の試験でブラウザ再操作の代替ではない。
v09はhash/117ID/名称/11分類/viewer datasetを照合。全117操作は保証しない。公式6import/lock/installed packageを照合。build二回のdist全byte一致。

## Stage 3 HOLD解除条件（事前固定）
|条件|対象環境|判定責任|代替証拠|
|---|---|---|---|
|A Select・Button局所操作/AX/拡大、真正性、v09保全、再build|保存版Chromium。WebKitも追加実測が必要|実装者実測＋独立レビュアー|静的だけでGUI代替不可|
|B 認証後asset/操作/CSP/network分類|現公開review Site、許可された通常ログイン|アクセス可能な検証者＋人間受入者|管理metadataだけは不可。本人の手順付き証拠は独立照合後可|
|C assert適合、RED/GREEN exit、実CI伝播|同runner、対象GitHub repo/隔離CI試験|実装者＋独立レビュアー|ローカルはCI代替不可|
|依存4Advisory処置/停止条件、license release本文来歴|lock版、最終配布物|根拠整理は実装者、リスク受入は人間|最新版/別release/master本文だけは不可|
|文字拡大保証|今回は合成root200の局所範囲。native文字200の広範保証はHOLD|人間が公開範囲決定|page zoomや画像拡大は文字のみ拡大代替不可|
|実機Safari/VoiceOver|今回保証対象外、NOT TESTED明示|人間が対象追加時に実機担当を指定|WebKit/AX treeを実機と称さない|
A/B/Cは独立判定。B/C重要未解決ならStage3公開・機能実装HOLD。設計検討のみ可。マージ/公開権限は人間へ残す。
