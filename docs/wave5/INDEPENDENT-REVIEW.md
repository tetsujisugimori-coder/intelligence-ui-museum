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
