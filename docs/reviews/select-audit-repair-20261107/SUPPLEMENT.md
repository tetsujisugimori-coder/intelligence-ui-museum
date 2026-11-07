# Trace/schema follow-up after the first submission

2026-11-07 JST. Earlier submission HEAD `7e58e2dcbdd7b8adc92076abd8a2347928fbdd8d`
and its CI run `42361663509` remain historical evidence, not the next HEAD's CI.

Independent follow-up reproduced an additional false success using a fresh
minimal-lane Chromium raw: change only `trace.final` to Boolean true and
recompute the manifest. The real wrapper still returned COMPLETE / exit0.
The repair now requires an object with finite scrollY and Boolean hasFocus;
minimal/no-hook mode additionally requires the recorded active-element id string.
It does not require the final Select geometry to be on screen: the later Tooltip
check legitimately scrolls away from Select.

The first submission's Windows historical CI job failed for a different reason:
the byte-pinned historical runner does not emit a top-level CHECKS field.
All twenty rows still had the complete correct nine checks and valid policy stops.
This was a compatibility defect in the first repair, not a product regression.
A narrowly identified historical schema accepts only that absent top-level field.
Its runner hash, sourceRunner, sourceRunnerHash, diagnosticNotFormal flag and the
explicit wrapper lane must all match. The per-row success/uniqueness/order checks
are identical. Canonical missing CHECKS, an explicitly wrong historical CHECKS,
and failed/missing historical row checks remain rejected.

109 tests pass (83 audit/unit and 26 subprocess wrapper replays). Minimal replay
fixtures explicitly adapt the runner/callsite/trace shape from the same real
control and are not counted as live browser trials. The independent follow-up
records the same actual minimal raw RED -> GREEN and the original Windows
historical artifact re-audit; a later CI at the new HEAD is still required.

The previous reports are preserved rather than rewritten. No product, SDK,
dependency, lock or original runner change; old offscreen UNKNOWN and direct
focus FAIL remain separate. PR #23 not accepted, Stage 3 HOLD, Draft unmerged.
