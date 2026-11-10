# Round 10 repair and validation protocol

Recorded 2026-11-10 JST. Issue #37, parent #28, Draft PR #38.

## Identity correction

Fresh WebKit DOM inspection at original HEAD `f4914a5ee45bcf886600e627509ddfcc6c917228` found one enabled, unchecked checkbox in `#Select .controls`. The SDK's `#official-select` is a visually hidden value input, **not** `input[type=hidden]`: its type attribute is absent, DOM type is text, `aria-hidden=true`, `tabindex=-1`, and its fixed SDK classes hide its geometry. Requiring type=hidden would introduce another target error.

The original snapshot queried `input:disabled` and therefore captured zero checkbox markers. The old string-only contract did not exercise snapshot's actual query. A separate clean original worktree and its original auditor reproduce exactly 30 marker-identity errors (runner exit 0, auditor exit 1) from the local 30-slot baseline. Two earlier launch attempts were NOT_TESTED due to missing system libraries; they are separate preserved directories and are not diagnostic trials. Extracted Debian libraries were placed in a new local browser cache, preserving the original cache; this local Debian environment is distinct from Ubuntu CI and Windows populations.

The repair uses one target definition for capture and intervention. Counts, distinctness, containment, input attributes/state, absent/empty/nonempty style, geometry, computed style, activeElement and focus-visible consistency are checked at every phase, including acquisition and final. Only the two target markers are normalized in the comparison HTML. Checkbox and value-input geometry/computed styles participate in equivalence, not just the trigger.

## Amendment before repaired trials

The five registered comparisons, two arms and three pairs remain unchanged. No product, SDK, dependency lock, old evidence or Stage 3 decision changes.

Every repaired trial uses a new context whose initial cookies and storage origins are recorded as empty. A common route allows only the newly started localhost server's exact origin; other requests are aborted and counted. This privacy instrumentation is identical in all arms. It can affect caching/network timing, so old/new runs are diagnostic infrastructure comparisons, not evidence that instrumentation is behaviorally neutral. No single-factor causal claim is made about the multi-operation prelude.

Development runs validate code while the checkout is dirty and are never represented as final-head acceptance. A final clean-head run is required; raw directories are never overwritten. Repeated validation does not add experimental arms or enter a pooled population.

## Fault controls and acceptance

`node --test tests/select-round10/contract.test.cjs tests/select-round10/privacy.test.cjs` checks positive synthetic evidence and rejects missing/duplicate/swapped elements, invalid attributes/styles, absent phase snapshots, inconsistent focus, duplicated comparisons, marker and pre-photo geometry/computed differences, changed pixel metrics, invalid PNG/ZIP bytes, exchanged valid traces, omitted manifest entries, absent/unrun steps, cleanup failures, and claimed/observed exit mismatches.

`node tests/select-round10/regression-proof.cjs` runs the **same** fixed synthetic counterexamples against the original and repaired auditor code, using the current positive fixture and unchanged mutation. RED means the original validator incorrectly accepted a fault; GREEN means the repaired validator rejects it. These are synthetic validation tests, never product trials. The original marker failure is separately shown by real browser evidence.

The auditor recomputes PNG differential metrics and classification; the independent reviewer implements its own pixel check. Trace titles bind a trace to its registered row, preventing valid traces from being silently exchanged. Manifest entries must cover every required image, trace and row JSON and match all local files. An observed runner process exit is mandatory (`ROUND10_RUNNER_EXIT`), separate from self-reported JSON exit.

The actual repaired-run report, source HEAD, hashes, CI OS populations and independent review must be attached to final coordination. This protocol alone is not PASS. Root cause remains UNKNOWN, Stage 3 remains HOLD, and the PR remains Draft without merge.

## Provenance correction before final run

Independent inspection found that 25 of the 30 local baseline traces attached runner source bytes edited after the original Node process started (Playwright reads source files during export). Preserve these files unchanged, but label this local baseline **mixed trace provenance** and exclude it from a complete baseline evidence claim. Its original in-memory runner and original auditor support the marker error diagnosis; the original Windows/Linux CI summaries separately establish the 30 errors. The development run also is not final evidence. The final clean-head run is therefore necessary, and all tracked source files must remain frozen until every trace is exported. Do not revise code or contract files during that run. Any required revision gets a new commit and separate full final run; do not silently overwrite or pool prior runs.

## Independent-review follow-up and next exact run

At repaired candidate `05e7be2a58e53766e3c2d2f0fd46dec1e745230f`, independent counterexamples showed that an ABSENT row could carry unrelated paint geometry or a negative capture clip, and inverted step timestamps were accepted. Self-review also found that final screenshot/trace cleanup errors could leave the runner's own classification COMPLETE even though the auditor rejected them.

The next revision binds the measured geometry, viewport, focus and exact clip calculation to a new common snapshot **after** the ring's scroll operation and finite-animation wait, immediately before capture/suppression. This avoids assuming that the earlier final snapshot's geometry is unchanged by scrolling. It validates step start/end order within the row's wall-clock bounds and makes capture/cleanup failures INCOMPLETE at the producer. The new common snapshot is additional observation instrumentation, not a claim of behavioral neutrality.

Before sampling the next revision, register one separate exact 30-slot validation attempt per available environment at the new clean commit: the same five factors, two arms, three pairs and order. Do not add arms, relax the existing 5000ms timeout, retry a failed slot, overwrite prior evidence, or pool runs. The 05e7be2 local attempt had a 5000ms screenshot timeout at prelude-normalized-1-1 and is retained as an incomplete infrastructure run. The next full run is justified by these reviewed infrastructure fixes, not by selecting a preferable product result. Freeze all source bytes during export and avoid concurrent validation workloads on the same local executor.

For the next local attempt, finish contract/regression subprocesses before starting the browser and postpone CPU-heavy local pixel/fault audits until trace export completes. This is a recorded resource-isolation condition, not proof that contention caused the previous timeout. CI and physical-PC tests run on separate hosts. Keep the same 5000ms timeout and do not retry individual slots.

At 05e7be2, Windows CI's runner and auditor both returned 0 but the privacy gate blocked its PNG encoder metadata, so no Windows CI originals were released. The next gate admits only the exact 456-byte public Skia sRGB ICC profile (independently synthesized from public constants), with bounded decompression and SHA256 verification. Arbitrary profiles, text/EXIF chunks, malformed lengths/CRC, duplicate metadata and trailing compressed bytes remain rejected. No Windows-PC original bytes were copied into tests or uploaded; generated synthetic PNG controls establish the format allowance.
