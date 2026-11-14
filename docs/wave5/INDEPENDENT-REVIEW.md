# Wave 5 independent review — 2026-11-15 JST

Reviewed candidate HEAD `409db9785d74f93856571b0ac7fef996a2c918db`, tree `9e1f2104ed9598b4772cb3191942efa53d4b305c`. Reviewer separate from implementation. Static inspection plus independent executable counterexamples; not final CI/evidence acceptance.

## Blocking findings

### W5-R1 (P1): auditor accepts fabricated condition execution and invalid binary evidence

`review-audit-counterexample.cjs` constructs actual candidate Git resource bytes and matching HAR response bodies, but all rows report engine `NOT_A_BROWSER`, width 1, wrong theme, zoom 1, empty font measurements. IDs alone resemble the 14 expected conditions. Trace is plain `NOT A ZIP`, screenshot is plain `NOT A PNG`. Sparse semantic observations are manually supplied. Current `audit()` returns PASS/14 conditions. This is a semantic false acceptance, not a crash or timeout. Original result: `evidence/independent-review/audit-red.json` and `fake-context/` outside Git.

Required: validate each condition's metadata against the fixed matrix; parse original trace/context options and original PNG dimensions, bind HAR/source/runner and condition evidence; require complete per-stage font/visible semantic observations; reject missing/incorrect context. Do not substitute existence/nonzero length for original evidence validation. Keep normal evidence acceptance alongside the same counterexample rejection.

### W5-R2 (P2): direction arrowhead is covered by target node

Chromium independent minimal fixture runs current product code. Initial edge a→b ends at b's center (165,75), inside the opaque target rectangle. Lines and marker are painted before node rectangles, so the endpoint arrow is covered. Text lists a→b separately but the flow canvas itself does not visually show the intended arrowhead. Current geometry check asserts center endpoints, reinforcing this rendering defect rather than detecting it. Use geometrically defined boundary endpoints/visible arrows, including node movement, and check actual rendering as well as ID correspondence.

### W5-R3 (P2): measured text2x excludes SVG node labels

Exact current runner selector/CSS algorithm leaves all 136 SVG node texts at 16px before and after supposed 2x text (ratio1). The font audit cannot notice because `text` nodes are not recorded. Preserve original measurements and add SVG node labels plus visible/control/result text completeness, with re-render checks. `review-product-counterexample.cjs` records both W5-R2/R3 and screenshot.

## Executed checks and limitations

- Existing Node product test file: 3/3 PASS independently rerun (does not cover the defects above).
- Independent audit forgery counterexample: false acceptance reproduced.
- Independent Chromium minimal fixture: arrow occlusion geometry and missing SVG doubling reproduced, screenshot saved.
- WebKit local execution NOT_TESTED (reported shared-library deficiency); official final CI pending.
- Original artifact/Library refetch audit NOT_TESTED at this review stage.
- No product/source files changed by reviewer. Review scripts and this document only.

## Decision

Independent review currently **FAIL / blocking P1+P2 unresolved**. No merge recommendation. Re-review same inputs after implementation fix and final HEAD/CI/source evidence binding required. This document records the initial review; preserve it when appending correction results.

## Candidate recheck (2026-11-15 JST)

Candidate local commit `fbf307c00c97193b0b97cc44480f34895f817b08` was supplied after the fixes. This is an interim recheck, not final HEAD/CI/original artifact acceptance.

- W5-R1: reran the initial fabricated report. Its missing newly required execution fields caused rejection, which was **not counted** as the target semantic fix. Then supplied correct candidate execution source hashes. The same invalid condition metadata was rejected specifically by `metadata identity`. After correcting only metadata, the original plain-text trace was rejected by ZIP parsing (`BadZipFile`). Records: `audit-candidate-recheck.json`. Positive normal artifact acceptance and complete final context/font corruption controls remain **NOT_TESTED** in this independent recheck.
- W5-R2: the identical initial a→b graph now terminates at target boundary x=130, y≈63.333, not inside b. Independent Chromium screenshot visually shows the arrowhead before b. Initial-graph counterexample correction confirmed. All possible moved-node geometries were not exhaustively tested by reviewer.
- W5-R3: revised runner selector includes SVG `text`. Independent Chromium measurements now show each node label 16→32px, ratio2, and screenshot confirms enlarged node labels. Records: `product-candidate.json`, `product-136-candidate.png`. These were captured on the modified working tree before candidate commit; recorded HEAD alone does not identify those uncommitted product bytes. Final candidate artifact linkage therefore remains pending.
- Found a fault-runner setup defect during static review: query strings were included in filesystem paths, causing the initial query-bearing navigation to return404. Implementation owner reported pathname fix before candidate freeze. Independent browser recheck of that fix: **NOT_TESTED**.
- Additional static gap: Overview visible aggregate and Group visible membership are not independently checked against fixed expected data by the then-reviewed exercise/audit. An attempted dynamic counterexample using a VM-loaded exercise failed on cross-realm `deepStrictEqual` for both normal and fault cases, before reaching this property. `overview-red.json` is retained as **INVALID_COUNTEREXAMPLE / harness failure**, not proof of semantic rejection or false acceptance. This static gap remains open for owner verification; no valid RED/GREEN claim is made.

No further trials were run after the owner requested recording-only completion. Overall independent review remains **PARTIAL** pending full positive evidence audit, the visible semantic-content gap, final HEAD CI, and Library readback. Initial failure evidence and review are preserved above.
