# 第6便 independent review — initial worktree review

2026-11-15 JST. Acceptance commit b88498b, baseline main6ac4cc5. Product source SHA256 `07d9ef64a6cb30224d64db8c663d22f0c3393011167556011c21f6ce1cf89b76`. Read immutable contract, product, pure tests, browser runner, semantic contract, fault transforms, and audit. Reviewer separate from author. No product files changed.

## Fixed independent browser batch

Plan `INDEPENDENT-LOCAL-PLAN.md` fixed three isolated Chromium375×1000 normal-motion trials before execution. Actual author exercise and validateSteps were loaded with Function in same JS realm, avoiding earlier cross-realm assertion issues. Product is exercised through native controls; this is local fixture evidence, **not formal14-condition acceptance**.

- Normal: ACCEPT,19stages.
- Table-value renderer fault: only `${r.value}</td>` becomes `999</td>`, records and diagnostic state unchanged. All six actual table value cells read999. The full exercise and validator ACCEPT all19stages.
- Source-body renderer fault: both `esc(s.text)` render sites replaced with escaped wrong text, actual sources/IDs/names/locators unchanged. Comparison and source bodies display the wrong text. Full exercise and validator ACCEPT all19stages.

Raw outputs: `evidence/independent-review/render-red.json`, individual step files. Reproduction `review-render-counterexamples.cjs`. No retries or extra trials in this batch.

## Blocking P2 findings

### W6-R1: linked-view numeric/text display is not independently validated

Validator checks selected IDs, row order and count/name summary but not each actual table value or graph name/value. The fixed table-value counterexample above is a demonstrated false acceptance. Require independent fixed-record expectations for every row/graph ID, name, value and selection marker; retain normal control and rerun identical fault source.

### W6-R2: provenance actual source bodies are not validated

Validator checks source ID/name/locator but not source body. Both panels may display arbitrary wrong body while passing. Require exact independent source body expectations, relation claim/locator and selected source view contents, plus same-source comparison coverage if claimed. Retain same renderer-only counterexample and confirm rejection for semantic content, not unrelated launch failure.

## Additional static observation

After Conflict Resolution Cancel, pending is correctly restored to confirmed but choice is reset to empty, so its disabled dropdown displays「未解決」even when candidate and confirmed are青, unresolved count0 and viewing mode. Recommend a consistent confirmed-value display or appropriate choice restoration. This is initially static only, not independently reproduced in a separate browser trial.

## Interim decision

Independent review **FAIL (blocking semantic audit P2×2)**. Product manipulation tested in the normal local case passed; this does not close formal browser/CI/preservation gates. WebKit, final CI, original artifacts and Library independent readback NOT_TESTED at this stage. No broad historical truth or production acceptance implied.

## First recheck and additional finite counterexamples

Same three fixed browser variants rerun after semantic validator update: normal ACCEPT19 stages; same table-value fault SHA `f10ab3ee…` rejected at `table visible`; same source-body fault SHA `48cc45bc…` rejected at `source body`. Full source hashes unchanged from RED. Results `render-green.json`, each variant `*-green-steps.json`. W6-R1/R2 renderer counterexamples are closed for this recheck; final artifact acceptance remains separate.

The authorized one-case Cancel browser trial confirmed the static issue: confirm right青→edit left赤→Cancel yields pending/confirmed青, unresolved0, viewing mode, but disabled choice label未解決. Captured `cancel-before.json` before owner product changes. Treat as **W6-R3 (P2)** pending correction/recheck.

Two additional finite **observation-copy validator** counterexamples, not browser injections: from normal19-stage browser records, replace graph r5 with duplicate r4 in all stages; separately replace time with duplicate title in both pending/confirmed field displays. Existing validateSteps ACCEPTS each, and normal accepts. Graph/field cardinality alone does not prove stable identity completeness. Records `shape-red.json`, script `review-shape-counterexamples.cjs`. **W6-R4 (P2)** requires exact independent ID sequences/sets and no duplicates.

## R3/R4 same-counterexample recheck

- R3 identical Chromium operation (confirm right→edit left→Cancel), product SHA256 `da7ab9ab380d579411371e1843f75c8af45991adb29dffd5ee49de58862213a7`: candidate/confirmed青, unresolved0, viewing mode, choice `right` and visible label `right 青`. Contradiction removed. `cancel-after.json`; original `cancel-before.json` retained.
- R4 identical prior observation-copy mutations: graph duplicate rejects at `graph ID set`; field duplicate rejects at `pending field IDs`. `shape-green.json`. The unmodified **old** observation record now rejects at new `cancel choice` because that field was not collected then. This missing-field rejection is not counted as an R4 success or a product regression.
- To distinguish normal acceptance, performed one newly captured normal Chromium fixture run using current product/runner and unchanged operation sequence.19 stages ACCEPT, `cancel.choice=right` captured and validator PASS. `normal-final.json`, `normal-final-steps.json`. No expectations were relaxed or historical observations backfilled.

**Interim independent code/contract decision: PASS for reviewed R1–R4 fixes; no confirmed blocking P1/P2 remains in this local review scope.** Formal14-condition CI, fault artifacts, source-bound byte evidence and persistence/readback remain pending and must be separately audited before final limited acceptance/merge recommendation.

## Audit-negative runner static review

Reviewed `wave6-audit-negative.cjs` and CI wiring. The ten declared mutations target independent copies after a positive `audit(source)`. JSON hardlink is unlinked before writing; trace replacement unlinks before copy; missing-file controls unlink only their own names. Under the current mutation list this does not write through hardlinks into source artifact bytes. Expected failure locations were checked against current validator order; no confirmed blocker in those ten transformations.

Two small hardening recommendations sent to owner: require explicit dedicated TMPDIR instead of fallback to shared os.tmpdir; refuse overwriting existing audit-negative.json on rerun (exclusive creation or unique output) to preserve previous negative-run evidence. CI currently sets TMPDIR and starts a fresh evidence directory, but the local/default path should obey the same contract.

This is **static review only**; original14-condition artifact positive/negative execution has not yet been performed by this reviewer and must not be reported PASS from this note.

## 2026-11-15 JST 再開後独立レビュー
# Independent resumed review — P2 findings
2026-11-15 JST. Read-only product review; no new browser runs or public changes.
Target local HEAD 5d6418ae50186a779d41d03355179294a1940692 / submitted HEAD 8ac5d982c9d22a6ffd0407bb69c2e563baafdff0, shared tree0f39bcbf04cbdbcc5b3f8b816e008dc08a8a63b8.
Source: existing corrected Chromium375light normal browser observation, browser-review-fixed/results.json. This is an observation-copy mutation, not an observed product bug.
P2 W6-R5: wave6-contract.cjs lines6–7 do not bind reedit.confirmed to last confirmed values. Change confirmed.color and rendered confirmed[color] together from blue to red; ACCEPT. Contradicts requirement that re-edit preserve confirmed state.
P2 W6-R6: same lines do not bind back.claim to original c1. Change claim to c2 and visible links/registration consistently; ACCEPT. Focus remains source-s1. Contradicts fixed Back contract and stage identity.
Normal unmodified observation ACCEPT. Both same-input false acceptances saved. Require independent complete expected state per stage, preserving output consistency checks, then rerun these exact files and normal.
Static limitation: full formal14-condition artifact not available at review. No final evidence/CI acceptance granted. Viewport screenshot has only PNG structural/dimension validation, unlike exhibit PNG SHA binding; same-size substitution is not bound to normal row. This needs full artifact counterexample before definitive audit-integrity closure.

## Independent recheck
R5/R6 exact saved JSON now reject at fixed-state reedit/140 and back/141; original normal and all7 existing Chromium successful observations still accept. No observation bytes edited. All19-stage,3-exhibit explicit expected states reviewed against fixed scenario.
Resource-pageerror static policy gap also corrected: the prior runner skipped pageerror checks for any resource mode, and auditor skipped errors in resource/fault. Existing resource normal [] and fault [ReferenceError: wave6Init is not defined] accept; adding Error: unrelated to either rejects in new helper. This is original error-list policy testing, not a full14-condition artifact false-accept reproduction. Helper invocation was verified in runner and auditor. Regression61 PASS independently rerun.
R5/R6 and scoped resource-pageerror policy findings CLOSED for the reviewed source hashes in independent-green.json. Final CI and full formal14 artifact remain pending. Viewport PNG binding static concern remains an explicit follow-up before final evidence acceptance.

## Viewport binding follow-up
Runner now records viewport PNG file, byte length and SHA immediately from screenshot-return bytes; audit verifies all three before PNG validation. Existing real Chromium375 light/dark PNGs both have375x1000 dimensions. With an explicitly POST-CREATED helper binding, original accepts, dark replacement rejects (size), missing binding rejects. This does not retrofit execution-time metadata into old results and is not a full14 artifact audit. Same-length synthetic-byte hash mismatch also rejects in independently rerun62 state/helper tests. Source hashes and exact image hashes are in viewport-green.json.
Additional static integration finding: forged-success audit-negative expects /confirmed display/ although new fixed-state assertion runs first; needs expectation updated to fixed state confirmed/140. Full14 final artifacts and negative runner remain pending formal CI.

Final integration follow-up: forged-success expected reason now matches fixed state confirmed/140; viewport replacement explicitly matches engine/width/zoom and changes theme. Static review confirmed both corrections. Independently ran state/helper62 plus product3 =65 PASS. audit-negative SHA256 e9d1f367594488283169b6636bb10ebba86695f61e497d92cfed51bfd130bd40. Full14 artifact audit remains pending; local review does not grant final acceptance.
