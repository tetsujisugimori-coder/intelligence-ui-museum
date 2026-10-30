# runner再現方法と限界
- `node --test scripts/stage2r-runner.test.cjs`: 17件、失敗/skip0。
- `node scripts/stage2r-runner.test.cjs --legacy-evidence`: Git base commitの元runnerをVM隔離subprocessで実行し、engine launchへ同一例外を注入。旧matrix入口exit0、修正後exit1。実ブラウザ起動ではない。元runner自体を変更して人工REDを埋め込んではいない。
- 修正後2runnerの本物の入口/finalizerでlaunch例外→exit1を確認。必須assert欠落、偽GREEN、重複assert、空、条件欠落、engine error、未完了、期待REDの不再現/想定外失敗を拒否。
- GREENは全必要条件と必須検査名の完全集合・一意性・全pass=trueで判定。ログを出せたことを成功としない。
- CUA検証はnative runnerの40条件実行の代替ではない。runner自身のChromium/WebKit browser-path最終実行は本環境では未実施。Sites managed環境のブラウザ操作はCUAだけを使用した。
- 現GitHub管理先未特定のため、CI workflow作成・実CI RED/GREEN・push・PRはBLOCKED。Sites GitはGitHubではない。旧runnerが実CI合否に使われていた証拠も未取得。したがって元指摘はP3、CI利用ならP2という条件付き分類を保持。今回独立レビューで見つかったassert欠落の偽GREENは検証器のP2として修正した。
- 過去runnerのhover/loading/disabled名称は実検査範囲へ限定し、Tooltip Escapeはhidden待ちを追加。Button回数は境界付き正規表現で3と30/300を区別。Rangeはsr-only説明を可視文字から除外し、全clip祖先境界を検査。
- 実CI再開時は対象repoに先行Issueを作成し、最終bundleのbaseと差分を確認。隔離一時branchで期待される実テスト失敗がCI failureになることと、同じ経路の修正後successを記録する。保護設定は変更しない。
