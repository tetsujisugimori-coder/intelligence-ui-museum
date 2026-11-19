# 第13便 正式原ZIPの保管

**[Draft PR #76](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/76)冒頭の原ZIP欄が現行判定。** 固定HEADの第13便専用CI原ZIPと、失敗が生じた版/attemptの原ZIPを、承認済み本人限定保管先に改変せず区別して保管する。保存側とは別の担当が、別作業領域で保存先原物とGitHub原物を直接取得し全バイト、サイズ、公式SHA-256、ZIP全エントリCRCと内部manifestを照合する。HEAD/tree、原票内の実行ソースとHAR配信資源もGit blobと比較する。転送完了だけを照合成功と扱わない。旧原票は変更しない。
