# Stage 3 統合評価

判定：HOLD（公開承認の要求ではなく検証上の未達）。今回の公開・Site更新なし。

独立した静的ルート /official-lab/ を候補とする。v09 HTMLへReactを直接埋めず、既存117 IDとルートを保全。base:'./'の静的distをサブパス配信し、リンク/asset/iframe/Portalを実配信環境で検証する。テーマはhtml data-theme、Portalにも適用。全館CSSを注入しない。

5つのv09 iframeがそれぞれ全117展示を初期化するため、将来は対象部分の正当な抽出または単一比較iframe化で負荷を下げる。現行は元コード保全を優先し、テーマ変更で比較側のみ初期化することを明記した。

必須残件：WebKit、実機iPhone Safari/VoiceOver、Tooltip hover、全館回帰、v09比較側文字200%、audit残件の解消または到達性評価、未使用KaTeX外部font参照の除去/ローカル化、配信環境CSP下のsandbox/asset動作、ライセンス最終照合、GitHub管理先決定。root font 200%を実機文字拡大PASSとして扱わない。

ChatGPTホストでのMCP UI/bridge、CSP、ツール呼出し、認証はこの部品集の単独動作とは独立の実装段階。APIキー・トークンをフロントへ追加しない。表示データは固定教材のみ、外部入力やHTML挿入は追加していない。
