# GitHub未登録の引継ぎ案
状態: BLOCKED。これはIssue/PRを作成した証拠ではない。

Issue件名: v10 Stage 2-R2: Selectの名前と値の区別、runner失敗判定の回復
本文: 本依頼の局所修正と検証基盤回復を追跡する。対象baseはSites daa42f25dfadd22a1deb5fcbe8c6f98c75a2397f。既存117展示/公式6import/lock/過去証拠を保護。受入条件と停止条件はdocs/stage2r2/acceptance.md。A/B/Cを独立判定しStage3 HOLDを維持。GitHub既存履歴とbundleのbaseを照合する前に上書きやunrelated history統合をしない。

Draft PR件名: Selectのアクセシブル名を補い、runnerの偽GREENを拒否する
本文: Selectが選択値だけを名前として伝えていたため、公開TriggerViewでフィールド名を補う。検査失敗/起動失敗/欠落/重複/未完了でもrunnerが非0となるよう判定を固定する。focusの狭幅余白を局所調整。17隔離process試験成功、Chromium表示16条件確認、最終dist8/8再build一致。focus2条件/全条件keyboard/WebKit/公開認証後/実CI/依存licenseは未完了。総合PARTIAL・Stage3 HOLD。マージ禁止。最終証拠は同梱manifest/FINAL-STATEを参照。

再開順: 対象repo URL確認→Issue先行登録→既存履歴/PR/branch確認→差分取り込み→隔離CI RED/GREEN→commit/push/Draft PR→最終HEADの独立照合。意図的失敗は隔離branchでのみ実行し最終提出コードへ残さない。
