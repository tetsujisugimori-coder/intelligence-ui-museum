# 現在の依存・ライセンス判定
2026-10-27 JST。現在lockfile不変。npm auditを再実行しhigh1/moderate1/low4、6package/4根本Advisory。結果JSONは今回取得。npm lsで実依存経路を再取得。監査件数0を目的に無関係更新をしない。

|Advisory|現在版・経路|条件・アプリ利用・到達性|今回判断・停止条件|
|---|---|---|---|
|GHSA-r5fr-rjxr-66jc / CVE-2026-4800|lodash4.17.21、直接依存SDK0.2.2からの間接依存、SDKはexact pin|templateのimports名を攻撃者が制御するとコード注入。現在srcは6UI import、template入口なし。配信JS mapでlodash本体sourceなし。完全な到達不能証明とはしない|HOLD。修正4.18.0を上流採用または隔離互換検証後に評価。未信頼template処理追加・広範公開を停止|
|GHSA-f23m-r3pf-42rh / CVE-2026-2950|同lodash4.17.21・間接|unset/omitへ配列で包んだpathを渡すとprototype属性の削除。現在srcにその入口なし、mapにも本体なし。動的全経路の不存在までは未証明|HOLD。4.18.0評価。path操作入口追加・広範公開を停止|
|GHSA-xxjr-mmjv-4gpg / CVE-2025-13465|同lodash4.17.21・間接|細工したpathがunset/omitへ到達。prototypeの削除であり任意上書きと混同しない。上2件と同じ利用経路調査|HOLD。4.17.23で本件修正でも後続問題が残る。全体は4.18.0候補。未承認で安全/非該当としない|
|GHSA-238p-pmpm-9mq7 / CVE-2026-103923|katex0.16.47・SDK→rehype-katex7.0.1、SDK→remark-math6.0.0→micromark-extension-math3.1.0、いずれも間接|既に汚染されたprototype/options＋未信頼数式＋独立sanitizeなしのHTML挿入が前提。現在entryに数式render入口なし、mapにKaTeX JSなし。一方公式CSSにはKaTeX font外部参照が残る。font参照とJS脆弱性を別評価|HOLD。修正0.18.2は親の^0.16.0を外れる。未検証overrideなし。math renderer追加や広範公開前に更新/緩和の受入必須|

直接依存@openai/apps-sdk-uiと上記親packageへの伝播を6影響packageとして数え、6個の独立した脆弱性とは数えない。上記到達性は今回のsrc/lock/配信mapに限定した静的推論。攻撃入力を含む全実行経路の安全性保証は未完了。人間によるリスク承認なし、非該当確定なし、更新0。
一次資料（今回取得・照合）：
- https://github.com/advisories/GHSA-r5fr-rjxr-66jc
- https://github.com/advisories/GHSA-f23m-r3pf-42rh
- https://github.com/advisories/GHSA-xxjr-mmjv-4gpg
- https://github.com/advisories/GHSA-238p-pmpm-9mq7

## ライセンス来歴
fresh公式npm0.2.2 tgzのsha512はlock integrityと一致、installed2645/2645一致。MIT本文を含む公式配布物の真正性を保持した。公開6部品は直接importで維持。通知本文は変更していない。
react-remove-scroll-bar2.3.8を今回fresh npm packし、MIT宣言はあるが27配布ファイルにLICENSE本文なし。実bundleの3sourceに含まれる。registry gitHead b3b1287aad81def2e2ae707274b74531b61ddbaf のLICENSE取得APIは今回も404（ref解決不能）。404は不存在の証明ではない。既存master補足本文と当該releaseの対応を証明できずHOLD。配布・再利用条件の全面受入は人間判断へ残す。release対応本文または権利者からの根拠が揃うまで広範公開を停止。
CSP/font方針は現公開版で未検証。保存版meta policyだけを本番HTTP policyと同一視しない。
