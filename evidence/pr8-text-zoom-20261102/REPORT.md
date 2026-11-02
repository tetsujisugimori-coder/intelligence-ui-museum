# P3 実文字拡大試験の改善・自己検証

2026-11-02 JST。実装担当。独立再レビュー未実施、マージ推奨NO、Stage 3 HOLD。

従来root CSS 200%条件ではroot32px、description14→14px。本文文字拡大の証拠にならなかった。旧条件・assert・契約8件を維持し、scope/実測値を追記。別スクリプトで全6展示の各要素の元computed sizeを先に採取し、その2倍のpxを設定。description14→28px、stageの16px段落は32px等、二重継承による過剰拡大を避ける。再描画する119の入力と新規要素は基準28pxへ再適用する。

ローカルChromium154×375/390/1280px、reduced motion、390light・他dark。`third-local/`が正規実行。3/3成功、Transfer6検査群×3=18成功。6展示×3=18の本文実測、geometry、Tab/Shift+Tabによるfocus復帰とfocus枠clipping測定成功。各cardの全文画像18枚、選択前後・focus画像9枚を保存。文書・各cardの横超過0、クリッピング判定0、console error/pageerror0。物理OS文字拡大・実機テストではない。

初回`first-local/`はセレクタ`.demo`が実DOMの`.stage`と異なる試験コード誤りで全3条件失敗。`second-local/`はstage段落16→32pxを14px本文と取り違えた前提で全3条件失敗。原レビューの固定14px本文は`.description`と確認し、そこの14→14/28pxを測定するよう訂正。失敗ログを上書きせず保存し、製品不具合や合格へ数えない。

追加の契約3試験は、実文字14pxのままの偽PASS、欠落、文字クリップ、横超過、focus欠落を拒否。CIには全6条件と既存28・pageerror2・P2正常/旧HEAD負対照を同居。固定Chromium141/WebKit26の最終結果は後続の統合報告に記録する。

NOT_TESTED: Safari/Mac実機、VoiceOver、物理タッチ、OS文字拡大。旧Linux Modal原因UNKNOWN、Issue #9/#10を維持。今回の局所試験は全123展示の網羅操作保証ではない。
