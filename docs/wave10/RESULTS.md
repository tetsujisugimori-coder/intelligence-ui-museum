# 第10便 検証履歴
2026-11-17 JST。

## 局所
事前契約a5a1d6e、初版1e52081、browser/監査11e7efb。主製品/oracle試験255件から独立指摘3反例を追加し258件PASS。旧wave1〜9とresult契約を含む実行は456件PASS（追加3件前）。正式CIとは別。
最初の広いtest globは依存未配置・専用TMPDIR未指定・新source未作成で失敗。setup障害であり意味故障REDに数えない。専用領域で再実行。
旧source closureのwave10追加に伴い、lexical sortの期待順不一致を同じ正常合成fixtureで確認→期待集合のsortのみ変更してGREEN。集合要素・拒否条件を削減していない。

## ブラウザ
local01 Chromium7条件はsocket Operation not permitted等で全てlaunch前BLOCKED。意味操作0件、HAR/trace/視覚NOT_TESTED。回避・設定変更・再試行なし。正式GitHub14条件は新HEADで別実行する。local01は製品REDではない。

## 独立指摘
IR01/02の同3反例は修正前258件中3FAIL→修正後258PASS。IR03は正常合成原票ACCEPT＋6誤受理→正常ACCEPT＋同6拒否。旧oracle/auditor原物・RED/GREENを案件保全へ残す。初期152公開matchResponsesの静的指摘は最初の試験時点で修正済みのため修正前RED未実施。

## 判定境界
正式CI・独立原ZIP読戻し未完時点で総合PARTIAL、限定マージNO。新展示・既存保護・実機未検証を分離する。旧FAIL/UNKNOWNは保持。最終判定はPRの版付き追補で行う。
