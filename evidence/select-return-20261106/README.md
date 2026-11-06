# Select return evidence index

2026-11-06 JST。Issue #20 / Draft PR #21。製品修正初回HEAD `5601a18b019de0d674088cfac38ed6b142e66e55` / tree `9f8804fef4f79875e49dda1e968d7b7b9259384f`。

- `raw/`: 実装担当のローカルRED/GREEN、独立担当の正常/4故障/13guard、CI両engine RED/GREENの完全JSONをgzipで保存。`gzip -dc FILE.json.gz`で読める。MANIFEST.jsonに圧縮前後SHA256。初回誤判定probeもinvalid名で保全し、成功件数へ含めない。
- `images/`: 新規CIの代表WebKit/Chromium画面とfocus輪郭。全PNGは下記artifact。
- `INDEPENDENT-REVIEW.md`: 製品実装と別担当のレビュー。自己検証の代用ではない。
- `SDK-INTEGRITY.json`: fresh registry tgz 2,645公式ファイルとinstalledが一致、lockのintegrity一致。nested依存は公式配布物と区別。
- `../../tests/select-return-independent/`: 独立担当が書いた別harness。正式試験のverdictを再利用せず、独立した正常・故障判定を行う。

## 初回CI原票の照合

[専用CI42135548280](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/42135548280)成功。
[全PNG/JSON/hash/SDK一覧artifact13466146264](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/42135548280/artifacts/13466146264)は2,700,027 bytes、ZIP SHA256 `8e5a13230c59b194c2b6860ff059ce833e5f11e326291869feb7418c815527e9`。期限2027-02-04 UTC。ダウンロード後にdigest一致、内部red/green全manifest対象hash、HEAD/treeを照合済み。

- Chromium141とWebKit26で旧6件ずつがすべてBODY、新6件ずつが同一triggerへ復帰。
- 新規正常は重点12＋追加行列32＝44件PASS。keyboard/Escape focus画素8件PASS。
- 各engine7対照＝14件が期待どおり故障拒否または安全非復帰。回帰A/B×2engine＝4条件PASS。
- 型/build/公式import/原本、別々にnpm ciした2buildのdist一致、旧新SDK byte/lock一致。
- [既存CI42135548325](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/42135548325)も成功。preservation/build/Stage A regression・clip/v11/Kanbanを維持。

この追補で独立担当harnessを両engine CIへ接続し、旧独立archiveを既知commit/hashでartifactへ保存する。後続CIと最終HEADの照合はPRの最終追記を参照。初回結果を後続HEADの新規実行と呼ばない。

## 保存経路の注意

大きなlocal-evidence.tar.gzのblob登録処理は応答が確定せず中断。branch/ref更新は行われていないことを確認し、盲目的に再実行していない。本追補は個別の小さいJSON gzip/blobを正常応答SHAで登録したもの。大きなarchiveおよびpartファイルはこのPRへ追加していない。

v10全体FAIL、限定受入NO、Stage3 HOLD、一般公開NOを維持。root200はCSS合成拡大。実Safari/VoiceOver/OS文字拡大・全117展示・別Issueの公開前残件は未検証または対象外。
