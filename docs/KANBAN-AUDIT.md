# Kanban archived-evidence acceptance contract

2026-11-05 JST. P2: an evidence-audit false success, not a new product display defect.
The previous independent PASS did not test this boundary and is not evidence for
this fix. P3-01's full approved raster, PNGs and 12/2 tolerance remain unchanged.

## Acceptance, not a best-effort diagnostic

```sh
node apps/v11/kanban-audit.cjs COMPLETE_ARTIFACT .work/NEW-audit
```

The artifact and output must be separate; the output must not exist. No browser
is launched. A failed/incomplete input is rejected with exit 1 and a FAIL report;
there is no diagnostic mode that labels such an input acceptance PASS. Input
files are never modified. An existing output is refused rather than overwritten.
All required checks below must complete successfully before the only assignment
of PASS. A readable PNG, an empty list, some successful rows or a producer's PASS
string alone is insufficient.

### Input summary and identity

- The summary must be an object, status PASS, numeric exitCode 0, no failure
  error, complete valid parent start/end and distinct parent/current/old UUIDs.
- Exactly one current and one old run, no duplicate/missing/unknown labels.
  Each has a complete source and identity, successful capture child (code 0,
  signal null, timedOut false), and old also has a successful legacy child.
- Complete HEAD/tree hashes must resolve to the same commit/tree in local Git
  history. Current source must match the recorded harness (not the audit's
  present HEAD); old is the fixed real defect commit 3b90ddbb… . Identity target
  and source must match. Start times must lie in the parent's interval.
- Served files are exactly index.html, exhibits.js and exhibits.css. Each SHA-256
  must match the corresponding immutable Git blob; missing or extra files fail.
- Summary comparison records must contain current and old once each, 48 verdicts
  each, zero current failures and at least the four old priority failures. The
  original control count must be 20. Full-raster producers additionally must
  record normal48/suffix48/edge192 and the four-review completion counts.

### Required capture, comparison and control evidence

Both captures require 24 unique ordered conditions, all four states, measured
16/32px fonts, operations/focus/overflow/pageerror results, 48 label PNGs plus
state PNGs, CRC/decode/checksum/relative timestamp validation and matching run
identity. Capture finish must be within its parent. Nonempty child logs and
complete legacy 24-condition results/screenshots/log are required. Child exit,
signal or timeout failure is never converted into acceptance.

Stored current/old comparison files must contain every required condition/label
and valid verdict/count/policy/hash fields. Their counts must match the summary.
The actual images and stored difference PNGs are read; ROI, image hashes,
difference counts and verdicts are recalculated under the producer's immutable
comparison profile. This rejects stale or invented comparison results, not just
missing files. Old's priority four must have failed that recorded comparison.

All original 20 control names/outcomes must be present exactly once and match
their expected positive/negative outcomes. A declared count without the results
does not pass. These controls are also reexecuted in the current audit.

Full-raster archives require their saved boundary and review evidence: 48 image
audit records/overlays, 192 exact edge keys and meaningful image failures, actual
altered/difference PNGs, suffix capture with matching updated SHA-256 and 48 FAIL
verdicts, plus the four-review mutation, source hashes, capture and before/after
comparison records. The erased regions/pixels are reconstructed from the normal
source images to verify that their declared edge and SHA/counts describe the
actual saved image, with unchanged dimensions. Four-review counts remain
12/13/19/26, before PASS/0 and after FAIL.

### Historical compatibility is explicit

The comparison contract's SHA-256 in recorded Git history selects a supported
profile, never a user-declared profile or equality with today's HEAD:

| Profile | Immutable kanban-contract.cjs SHA-256 | Historical requirements |
| --- | --- | --- |
| legacy-crop-v1 | 7a55f06d2ee1d9a33e7fccb3f9031f949fcd02177de42164563f29286aa845ec | e40d92b-era captures, stored crop comparisons, legacy24 and original20 |
| full-raster-v2 | 37e6f1c50302e01da50abde23a3244bcaed7677e395411e7c478b4ebc9017f18 | all preceding records plus saved P3-01 boundary/review evidence |

The legacy input predates the 192/four-review records. The profile check records
that historical absence explicitly; it does not pretend that the producer ran
those tests. **Both profiles must then actually execute all current 192 edge
controls and four-review controls in this audit before acceptance.** Historical
crop verdicts and today's full-raster verdicts are kept separate (old can have
46 historical failures and 48 current full-raster failures). An unsupported
profile is rejected with a reason, not silently treated as a known version.

### Mandatory execution ledger

The 11 phases are summary contract; captures; recorded comparisons; legacy
evidence; original control records; profile-appropriate P3 records; current
recalculation; old recalculation; original20 reexecution; boundary192
reexecution; and four-review reexecution. The last three explicitly check their
expected result counts. Current recalculation must accept all normal48, old must
reject all priority four, and no phase may be NOT_RUN/RUNNING/FAIL at PASS.

The initial persisted report is FAIL. Each phase is checkpointed RUNNING before
execution and PASS only after its assertions. Exceptions produce a structured
error code, phase, message and stack on stderr and audit.json, stdout FAIL and
exit 1. Remaining phases stay NOT_RUN. Interruption before completion leaves no
accepted PASS. Output report-write failure also cannot produce a successful CLI
exit. These records check consistency/completeness, not cryptographic proof of
browser execution; fresh browser runs and independent review remain separate.

## CLI regression and fresh browser CI

```sh
node apps/v11/kanban-audit.test.cjs COMPLETE_ARTIFACT .work/NEW-cli-tests
```

The black-box suite executes the actual public CLI. It loads unmodified old CLI
sources from f9db21c… for A (FAIL/exit1/empty runs/no PNGs) and B (only old run).
Old and new receive the same input SHA. Expected RED→GREEN is old PASS/exit0 to
new semantic rejection/exit1, not accidental missing-file errors. It also tests
complete acceptance, missing/current-only/duplicate/unknown labels, mandatory
metadata, state/exit contradictions, timeout/child failures, missing/stale/corrupt
images, absent/partial/contradictory comparisons, incomplete legacy/control/
boundary/review records and failures after earlier phases already completed.

Each case saves input summary, stdout/stderr, generated report, exit/signal and
executed/NOT_RUN checks. Files changed from the base are saved as input-overrides
with delete/mtime/hash recipes. These reduced input overlays need the complete
immutable base artifact to reconstruct; they are not standalone captures. Full
working copies are retained under .work, never written over the base. Old-source
resolution proxies are environment-specific; rebuild with the committed test
command instead of executing an artifact's proxy in a different environment.

CI first captures/operates the fixed Chromium/WebKit 24 conditions with the
unchanged pinned image/browser/font policy. It then feeds that **new** complete
artifact to this suite, including both acceptance and mutated omissions. Native
evidence remains `kanban-visual-HEAD`; CLI evidence is separately uploaded as
`kanban-audit-cli-HEAD`. Test failure is nonzero and fails the CI step/job.
Manual dispatch `kanban_audit_test_failure=true` runs all tests and then forces a
test assertion failure to verify that propagation. Default/PR runs do not force
failure; the pre-existing image-erasure fault input is retained separately.

New browser execution is by the implementation CI; archived recalculation and
synthetic CLI inputs are not fresh browser/product defect experiments. All
initial/moved/Undo/Reset, selection/move/Undo/Reset, fonts/focus/overflow/pageerror
assertions remain intact. The initial two labels retain full-text visual and
pixel checking. Completed label/native popup automatic comparison, physical
iPhone Safari, VoiceOver and OS text enlargement remain NOT_TESTED. Stage 3 HOLD,
Draft and Issue open remain; no merge or Sites changes. Independent review must
execute its own checks and identify any independently unavailable browser runs.
