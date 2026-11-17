# 独立レビューP2: 実測終了時刻による時間対照判定

2026-11-11 JST。レビュー対象f54ecb825024ed99da0edbab0c29a5cb4f947d9f。

独立担当はLinux Chromiumの原ZIP（artifact13834879791、SHA-256 `4d42d75d1ca9f46450b7d36fd2758d63b36759fda36b95193277c96b6c68ca87`）のCRC、424 member、422内部hash、正式72行の画像・trace、故障対照21件、privacy/gate13件、redirect5種を確認した。

一方、残余host待機より前にoverrunを決めていたため、Escape API終了→最終read開始が200.079417ms（B/A2/2）と200.264178ms（B/A3/1）の行を時間比較可能とした。さらにend/finalStart/finalEndへ1000msを同時加算しpairsを更新した反例も監査を通過した。これは時間条件の分類P2であり、旧版の限定マージ推奨はNO。因果判定UNKNOWNと製品NOは変わらない。

## 修正契約

- schema2でEscape API終了→最終read開始のelapsedMsを保存し、その時刻からoverrunを計算する。
- pairsは記録済みoverrunを信用せず、元のhost時刻から200ms閾値を再計算する。
- auditorはelapsedMsとoverrunの再計算一致を要求する。
- +1000ms同時改変を追加負対照にする。
- 事前planの200ms閾値、群、順序、各群3反復を変更しない。閾値超過を許容する新しい誤差幅は導入しない。
- タイマー精度による実測差は記録する。timingComparableは当該予算内という限定判定で、完全な時間等価性や因果無関係の証明ではない。

旧schema1原票・旧run・旧statusはそのまま保存。新schema2は別HEAD/runであり、旧成功・未完了・誤分類を置換しない。根本原因UNKNOWN、Stage3 HOLD、PR23製品受入NO。
