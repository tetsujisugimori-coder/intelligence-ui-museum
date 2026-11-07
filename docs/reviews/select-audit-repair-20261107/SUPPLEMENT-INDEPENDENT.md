# Independent correction addendum

2026-11-07 19:05 JST. CI for the corrected source is PENDING. This addendum does not rewrite the earlier report or the 7e58e2d CI artifacts.

- Independently ran the corrected submitted suite: 109/109 passed (83 unit and 26 real-subprocess replay tests).
- Confirmed the primitive-final false success first on HEAD 7e58e2d using fresh minimal Chromium raw evidence and real-subprocess wrapper replay. Control and final:true both incorrectly returned COMPLETE/exit0 before the correction.
- Replayed the same fixtures after correction. Control remains COMPLETE/exit0; final:true now produces INCOMPLETE/exit1 with TRACE_FINAL_INVALID. The change checks the final object/finite scrollY/Boolean hasFocus and the none-lane string active. It adds no in-viewport constraint and no browser action.
- Re-audited the actual 20-condition Windows historical CI artifact 13569683432. The old runner omits only top-level CHECKS. With the pinned historical schema adapter, all twenty records are accepted by the semantic audit. With historical CHECKS present but malformed, missing historical identity, missing per-row check, or a false required per-row check, the audit rejects.
- Canonical top-level CHECKS missing or malformed is still rejected. A corrected direct control derives the minimal lane's callsite after omitting its original event listeners, and accepts normally. The first direct canonical probe used the original runner's listener-bearing callsite and also reported SELECT_UNEXPECTED_FAILURE; that test-setup mismatch is explicitly corrected in canonical-semantic-corrected.json. Actual wrapper controls were valid throughout.
- Inspected the schema exception: it requires the explicit historical-v1 selector, pinned runner hash, diagnosticNotFormal flag and exact sourceRunner/sourceRunnerHash. Per-row checks retain their strict shared validation. Canonical omission is not permitted.

No new product/SDK/lock/runner-source change, force click or fixed sleep was performed. The known Windows direct-focus ring failure remains: old-HEAD CI raw PNGs and pixel recomputation show 20/20 with active true, focus-visible false and zero changed pixels. Historical schema rejection is a separate diagnostic compatibility defect, not that product observation.

Reviewed source SHA256:
- third-audit.cjs: 0c929bcc270eef501690b504959aadc0bdaa93a24a101c1873616d99ccce25fe
- third-run.cjs: 3bcc852d1c082c4bea269ad5b17f78cc70bd8500a5bff0825b14d13d80e97f39
- third-audit.test.cjs: d90505ad60e62837b863659ccbae70bb4afe65410c217ff54d9688e38040270d
- third-wrapper.test.cjs: 457d5340450e3c5e5e202da1d2766ea6f1e3f02e9ccdae56613c8cff53aa8b6a

The old-HEAD CI is being preserved and audited separately. No old success is attributed to the next HEAD. The local checks above resolve the two specific follow-up findings; final remote HEAD/CI/artifact association remains pending.
