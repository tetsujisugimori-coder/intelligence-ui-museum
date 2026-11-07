# Select diagnostic false-success repair (#28 / #29)

Recorded: 2026-11-07 JST. This is a pre-submission evidence report; final HEAD,
remote CI and independent final outcome are recorded in the PR review/comment.

## Scope and verdict

Overall PARTIAL until final-head CI and independent review are complete.
False-success reproduction: YES. Old persistent Windows offscreen failure
remains UNKNOWN. PR #23 not accepted; Stage 3 HOLD. No product, SDK, dependency
or lock changes, no merge, Draft release or publication.

Fixed original HEAD: `8e52ebe049a74abf9f6a9f91f855a12488980f32`.
Original tree: `9a1a8c856f3f4985c5fd965945c59221876301d9`.
Base: `615334d30b0673c786b12877bcec3d7e723be9b2`.
Review: https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/29#pullrequestreview-5811199113

## Root cause and RED / GREEN

The old audit checked required names but not successful outcomes. The wrapper
only counted unexpected Select errors and used substring matching for the
policy stop. It did not reconcile original suite/row/child exit statuses.

An actual Node subprocess replay uses one real normal Chromium raw as baseline,
changes only the named fields, recalculates evidence hashes, and invokes the
old/new production wrapper and audit. Replays are not new browser trials.

| Mutation | Old audit | Old wrapper exit | New wrapper exit/reason |
| --- | --- | --- | --- |
| Button pass:false | accepts | 0 | 1 REQUIRED_CHECK_FAILED:Button |
| environment pass:false | accepts | 0 | 1 REQUIRED_CHECK_FAILED:environment |
| Required Button missing | rejects | 1 | 1 CHECKS_INCOMPLETE |
| Duplicate Button | accepts | 0 | 1 CHECKS_DUPLICATE |
| Row PASS despite failing Select | accepts | 0 | 1 ROW_STATUS_MISMATCH |
| Unexpected Select error | accepts | 1 (status incorrectly COMPLETE) | 1 SELECT_UNEXPECTED_FAILURE |
| Policy identifier only as substring | accepts | 0 | 1 SELECT_UNEXPECTED_FAILURE |
| Child exit0 with original FAIL | accepts | 0 | 1 PROCESS_STATUS_MISMATCH |

Six wrapper false-success cases reproduce and change RED -> GREEN. The normal
control remains wrapper exit0, original runner exit1 / suite FAIL, diagnostic
COMPLETE, forbidden Select continuation NOT_TESTED. The two existing rejection
cases are retained; they are not counted as new wrapper false successes.

## Local changes

- `third-audit.cjs`: strict check name/order/uniqueness, boolean pass, required
  success, row/suite/process status reconciliation, safe malformed input rejection.
- `third-preload.cjs`: block the original prohibited force-click before dispatch.
  Capture a Node-only receipt with run nonce, runner SHA, page/selector/options,
  exact source callsite and timestamp. No additional browser await before click.
- `third-run.cjs`: validate the receipt against the pinned source anchor and
  wrapper-owned run nonce; propagate all audit/trace failures to nonzero exit.
  Preserve original child status and mark only later Select assertions untested.
- Evidence audit checks file set, SHA, PNG identity and recomputes original
  Select differential-pixel measurements from the four images. It does not
  treat a digest as an authenticated signature against a coherently forged set.
- Unit, subprocess regression fixtures/support, and the existing diagnostic CI
  oracle step are updated. Original runners and historical evidence are intact.

## Verification before commit

- 105 tests: 81 auditor/unit cases and 24 real child-process wrapper replays.
- Existing diagnostic normal plus 9 fault controls: PASS.
- Migration preservation: 302 original bundle hashes, v09 117 IDs / 11 categories,
  v08 105 IDs and historical byte preservation: PASS (not full GUI coverage).
- Disposable v10 npm test and build: successful; existing Tailwind sourcemap
  warnings remain. No dependency/lock changes.
- Primary Chromium 141.0.7390.37 exact legacy and WebKit exact legacy actual
  browser controls reach the policy stop without delivering force-click.
  They are local Linux controls, not Windows acceptance or all matrix trials.
- Initial system Chromium launch and local WebKit dependency preflight failures
  are retained as environment failures, not counted as browser executions.
- WebKit requires official Debian libhidapi/lzo in the disposable `.work` runtime.
  The host ldconfig preflight cannot find the locally available GLES library;
  it is disabled only for this local run. Browser execution and all test asserts
  still run. CI uses its ordinary host installation/validation, unchanged.

## Independent review and boundaries

A separate reviewer reproduced old fail-open cases and ran real Chromium and
WebKit controls. Its first review found malformed input exceptions and insufficient
receipt/image checks in the initial repair; these were corrected and re-reviewed.
The final independent report and hashes are stored alongside this report.

Known Windows direct-focus ring FAIL must remain visible. The current task
repairs diagnostic truthfulness, not that UI behavior or the old offscreen cause.
Not tested locally: Windows desktop, physical keyboard/touch, real Safari,
assistive technology. Final CI is not claimed until read back at the submitted
HEAD. No P1/P2 product diagnosis is inferred from the runner defect.

## Reproduction commands

From the repository root after `python scripts/prepare-work.py` and the existing
pinned dependencies are installed in the disposable build copy:

```sh
node --test tests/select-webkit-timeline/third-audit.test.cjs tests/select-webkit-timeline/third-wrapper.test.cjs
node evidence/select-audit-repair-20261107/reproduce-red-green.cjs
THIRD_LANE=exact THIRD_ENGINE=webkit THIRD_FOCUS=legacy THIRD_OUT=.work/fresh-output node tests/select-webkit-timeline/third-run.cjs
```

The RED/GREEN command reads the original two diagnostic source files from the
fixed Git commit, creates an isolated output directory, invokes both wrappers,
and records reasons, raw and child/wrapper exits. No old evidence is overwritten.
Browser prerequisites are environment-specific; a launch failure is NOT_TESTED.

The checked-in normal raw fixture contains its original historical HEAD/tree.
The replay support deliberately substitutes only current test HEAD/tree/run
nonce before mutations. It must not be cited as final-HEAD browser execution.
