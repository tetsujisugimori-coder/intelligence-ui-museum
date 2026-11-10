# Select 第11回: reproduction and interpretation

Issue #39 / Draft PR #40 / parent #28. Diagnostic infrastructure only; Stage 3 HOLD, #23 Draft unchanged. No SDK/product/lock or rounds1–10 source/evidence changed.

## Reproduction

Use a clean dedicated checkout at the evidence HEAD (GitHub checkout uses exact PR head, not an unexplained merge tree). Run `python scripts/prepare-work.py`, install the existing locked dependencies with `npm --prefix .work/v10 ci --ignore-scripts` and `npm --prefix tools/stage-a-browser ci --ignore-scripts`, build with `npm --prefix .work/v10 run build`, and install fixed WebKit via the latter package. Do not update locks. Node22 / Playwright1.56.1 / WebKit26 / SDK0.2.2.

Run the contracts: `node --test tests/select-round11/contract.test.cjs tests/select-round11/privacy.test.cjs tests/select-round11/negative-review.test.cjs tests/select-factor-pilot/contract.test.cjs`. Run `python tests/select-round11-review/trace-counterexamples.py` for independent, manually enumerated operation-sequence expectations.

A: `ROUND11_OUT=<fresh-directory> node tests/select-round11/run.cjs`.
B: same command with `ROUND11_PHASE=B`. Never reuse an output directory. Capture the actual exit code, then run `ROUND11_RUNNER_EXIT=<actual> ROUND11_EXPECT_HEAD=<producer-head> ROUND11_EXPECT_PLATFORM=<linux|win32> node tests/select-round11/audit.cjs <directory>` (also `ROUND11_PHASE=B` for B). Source checkout/build must match producer. Missing or incomplete trials cannot PASS.

GitHub-hosted raw release additionally uses `privacy-check.cjs` after successful runner/auditor. It checks fresh empty contexts, only fixed public localhost assets and queries, no external network, exact asset inventory, hashes and known image metadata. This does not prove arbitrary pixels harmless. Actual Windows PC is excluded from automated release. `run-windows-pc.ps1` preserves local evidence without upload. B can be run separately with explicit environment variable and fresh directory; do not pool environments.

Independent image recalculation: `python tests/select-round11-review/pixel-recompute.py <raw-directory>` (Pillow required in the verification environment). It reads original PNGs using separate code and does not mutate them. Contract fake traces use parser expectations for coverage only; only the manually enumerated review test is an independent expectation.

## Scope and evidence history

- A v1 preregistration f4a001b; implementation d2c7ced. Local dependency checks initially prevented launch. An exploratory local run reached 15 complete rows and one page crash, then exit137 without final manifest. It is incomplete and not pooled.
- Balanced-observer amendment 3d9117 and implementation 7af62ba: local A completed36/36, auditor PASS. Independent review checked all 289 manifest files, 36 traces and separate pixel calculation. All18 target pairs equivalent. Button/Switch/full each3/3 displayed absent outline; layout/Badge/Alert each3/3 retained visible outline. This supports bundled candidates only.
- A hosted runner/auditor passed at7af62ba, but the release gate inherited a 30-row/all-prelude-assets inventory and blocked raw upload. The gate is corrected to require the preregistered count and exact selected-group assets, with regression tests. No privacy approval is bypassed.
- B preregistration is separate, after A completion and independent verification. See part-b-preregistration.md. B results and final CI are recorded in the PR, not retroactively invented here.

## Limits

CONFIRMED_TARGET means only recorded Select subtree/attributes, geometry/computed, viewport/scroll/theme and focus conditions match. It does not prove whole-document or internal browser-state equality. Boundary observation is balanced but may itself influence behavior. A group is not a single factor. No arbitrary sleeps, forced successful clicks or weakened asserts. Disabled DOM no-op checks are preserved historical tests, not successful user interaction substitutes.

Actual Windows PC availability is separately checked; currently reported offline, so current round actual-PC results are NOT_TESTED. Hosted Windows and Linux are separate populations, as is supplemental local Linux. Physical keyboard/touch, iPhone Safari and VoiceOver remain NOT_TESTED. Causal necessity/sufficiency and product acceptance remain unproven.
