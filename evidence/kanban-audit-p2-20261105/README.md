# Audit P2: reject incomplete runner evidence

2026-11-05 JST. Implementation self-verification; independent re-review pending.
Overall FAIL until new verification/review establishes the fix; merge NO.
The previous independent PASS missed this audit boundary and is not reused.
P3-01's full-raster comparison, baseline PNG/manifest and tolerance remain intact.

The old CLI iterated only present runs and unconditionally assigned PASS. It
validated neither the producer summary's successful completion nor the required
set of runs/checks. This is an audit false success, not a new product display bug.

| Same copied input | Old CLI f9db21c | Revised working-code CLI |
| --- | --- | --- |
| A: status FAIL, exit1, runs[], no PNGs | PASS / exit0 / no images checked | FAIL / exit1 / SUMMARY_STATUS |
| B: only old run retained | PASS / exit0 / normal48,192,four-review omitted | FAIL / exit1 / RUN_SET |

Each directory saves the input summary, stdout/stderr, generated report, exit
and executed/NOT_RUN checks. Both calls use the same input-summary SHA. A has no
image files. Reconstruct B by copying immutable normal artifact 13361393667 from
CI41909726108 and replacing summary.json. Original raw working copies/logs remain
in .work; machine-local workspace paths in the published traces are redacted.
working-code-sha256.json records actual source bytes before commit; it does not
pretend the patched working tree was the earlier f9db21c HEAD.

The new acceptance contract is documented in docs/KANBAN-AUDIT.md. Exactly one
current/old, successful parent/children, Git HEAD/tree/source/identity/file-set
bindings, complete capture/comparison/legacy/control/P3 records are required.
Stored comparison/control images, actual differences and source hashes are
verified. Eleven checkpointed phases must all complete, including new normal48,
old priority rejection, original20, 192 edges and four-review reexecution. Any
failure returns nonzero with structured cause; later phases stay NOT_RUN.

Supported historical profiles are selected from immutable Git contract hashes;
e40-era complete artifacts may predate saved P3 records, but must execute the
full current 192/four-review checks in this audit. New full-raster archives may
not omit those original records. No generic failed-input diagnostic PASS exists.

The actual CLI suite covers A/B RED→GREEN, complete acceptance and semantic/
file/result omissions, duplication, contradictions and intermediate failures.
Its input overlays and recipes reconstruct faults from the complete base, with
raw stdout/stderr/audit/exit/phase ledgers. New CI first shoots all 24 fixed
Chromium/WebKit conditions, then feeds the new artifact to that CLI suite. A
separate manual audit-test fault verifies test assertion -> nonzero -> CI FAIL.
Fresh browser results and CI URLs will be reported after execution, separately
from these archived-image/synthetic-input tests. No local fixed-container
browser execution is claimed (Windows has no Docker/WSL).

Independent review is delegated by the parent to a different reviewer. Its
new browser execution must be reported separately; absence stays NOT_TESTED.
Completed label/native popup, physical Safari, VoiceOver and OS text enlargement
remain NOT_TESTED. Stage 3 HOLD, Draft and Issue open; no merge or Sites changes.
