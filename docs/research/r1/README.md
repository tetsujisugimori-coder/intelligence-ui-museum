# 研究基盤 R1：UI分類・実装棚卸し

親 #81、作業 #83。固定Gitの #80 統合main、168展示・11従来分類。
従来分類はそのまま。R1は研究用の別軸であり、公開UI・本番・Stage 3 HOLDを変更しない。

| 層 | 現在のラベル | #81 初期案との対応 |
|---|---|---|
| L1 | 基本部品 | 基本部品 |
| L2 | 複合部品 | 複合型UIの「どの部品で構成するか」 |
| L3 | 機能パターン | 機能型UIおよび複合型UIの「何をするか」 |
| L4 | AI対話 | 対話・作業環境の教材としての観点 |

所有者の最新4層指定を採用した。単一階層への排他的な所属ではない。Visualizeは別タグ軸。spatial は画面内の座標関係を含むが地理・3Dの確認ではない。AIタグは教材が例示する対話の段階であり、動作するAI機能ではない。ChatGPTの内部部品数・内部選択はUNKNOWN。

## ファイルと判定の範囲

- [先行受入契約](ACCEPTANCE.md)、[分類台帳](taxonomy.json)、[付与根拠・個別ソース見解](annotations.json)
- [行スキーマ](catalog.schema.json)、[棚卸し・合計](catalog/summary.json)、展示ID昇順の [JSONL台帳](catalog/)
- [集計報告](REPORT.md)

全行を固定Git実装のデータセットと対応付け、テンプレート関数をDOMスタブで呼び出した。ソース参照にはファイル、関数行、展示ID、ファイル内容SHA-256を持つ。DOMスタブにはユーザー操作、動的初期化、通信、アクセシビリティツリーがない。共通のギャラリー外枠/検索/グローバルResetは調査した展示テンプレートに含めない。initialText はテンプレートのテキスト断片であり、画面上の可視性や最終内容を保証しない。

SOURCE_REVIEWED は個別動作ソースも読んだ行。TEMPLATE_REVIEWED は登録と実際の表示生成ソースの確認までとし、入力・出力・イベント・異常時などの動作を未検証ならUNKNOWN。SOURCE_READ はソースの規則で、実操作の合格を意味しない。USE_CASE は教材の利用設計。マークアップから読める属性のみ STATIC_ONLY、実機・実操作・ATは NOT_TESTED。空タグは確認済みの不在ではなく「現在の付与なし」。3つの横断未知（live accessibility、実AI選択・データ交換）は全行に残す。全行の操作ソースに根拠位置を付けたが、実機実測ではない。

uses/basic:button/static-template はその展示のテンプレートにボタンがあるという関係。uses/composite:timeline/source-review は履歴などの追加構成のソース確認。contains/composite:form/basic:button はその展示中の包含。別展示との辺の推移・共起・API互換を意味しない。shares-key は同一展示内の表とグラフが同じ固定IDを使う場合だけで、132と139を根拠付きで収録した。132は確定tasksと下書きdraftsを分離し、139は並べ替えで選択IDを変えない。001はこの表/図の関連付けに非該当（N/A）、他の未審査の関連付けはUNKNOWN。166–168は教材として関連するが実行時の横断結合を実装していない。componentTokens に確認した基礎タグ/属性を保存し、relations は展示からも部品からも逆引きできる。仮説5軸は実測と別フィールド。外部への伝達をこのPRで実装しない。

## 検証と更新手順

    PYTHONDONTWRITEBYTECODE=1 python3 scripts/research/r1/catalog.py
    PYTHONDONTWRITEBYTECODE=1 python3 scripts/research/r1/test_catalog.py -v
    node scripts/research/r1/probe-bindings.cjs apps/v11
    python3 scripts/verify-migration.py
    python3 apps/v11/verify.py

Python 3.10以降、Node.js、Gitを使い、追加依存なし。固定コミットは取得済みであること。先にソース対応とラベル理由をレビューして、変更を明示的に再生成する場合だけ catalog.py --write。現行の固定ベースを保持し、第16便の受入後は基準commit/tree、ID/名称/分類の独立採取、表示分岐、差分台帳をレビューの上で更新する。169～171をこの基準に混入させない。

専用CIは読み取り権限、固定PR HEADの取得と検証のみ。Pages、Sites、実AIへの接続を追加しない。既存CI回帰の結果は専用CIと別に報告する。R2の表示・相性判定、R3以降の模擬／実AIは対象外。

132・136・139の条件分岐後の出力と157–159の決定履歴は、最小のDOMスタブに固定ソースを読み込む追加probeでも確認した。操作ブラウザ、通信ログ、全組成を確認するものではない。
