# P3-01 — full native select raster comparison

2026-11-05 JST. Implementation self-check; independent re-review pending.
Stage 3 HOLD. Draft maintained, Issue #15 remains open; no Sites changes.

This fixes a **test false acceptance**, not a newly discovered product display
defect. Product files, the 123 exhibits, original dataset, archive/reviews,
historical evidence, approved PNGs/manifest and dependency locks are unchanged.

## Region and visual audit

The old CSS border/padding origin and Canvas advance width do not locate native
select paint. For example, the 32px Canvas width is 96 at x=10, yet actual glyph
ink extends to x=109 (Chromium 未着手) or x=110 (WebKit 未着手).
The problem also affects the 16px images: this is not a special +6px case.

Candidates considered: (1) extending the old crop by 6px only, which offers no
four-edge guarantee; (2) a tight raster glyph bounding box, which needs a
segmentation oracle and can mask shifted/new ink outside the box; (3) the full
approved select raster, adopted here. The new ROI is x=0, y=0, width/height from
the immutable normal baseline PNG. Current images cannot shrink it. Widget
chrome and arrow differences also fail; that stricter scope is acceptable in
this fixed environment. Dimension changes fail, with no alignment/rescaling.
Tolerance remains channel difference >12, maximum 2 different pixels.

`visual-review.json` records all 48 individual images. The implementer viewed
all four `contact-*.png` sheets (12 images each) and confirmed full text and
four-edge containment. Green is the full comparison raster; red is a diagnostic
glyph box drawn outside its ink. Coordinates use original PNG pixels, inclusive
glyph bounds; contact-sheet enlargement is display-only, never comparison input.
Individual `boundaries/overlay-*.png` images and full coordinates are preserved.

The diagnostic mask uses non-background pixels inside a reviewed chrome-free
window (x=8..width-23, y=8..height-9); every mask has clear margins and the
observed ink/arrow gap is visible in all 48 sheets. Any-channel ink bounds
include faint antialias pixels; controls require >12/255 changes. The mask is
used only to choose synthetic faults and draw audit overlays, never to choose
the production ROI or to assess current-image readability.

## Archived CI recalculation and synthetic controls

Input: [normal CI 41807277710](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/41807277710),
artifact 13310507180, ZIP SHA-256
`d1de8074afe60e85bc832914283bffbea7f9026ee004e4c3b45b5e5bf0c02653`.
HEAD `e40d92bcc97fa1bf214b0d613aac2d144fd2138f`, tree
`a2a45930d647284db34f58f7039eb17718808393` match the review and current PR
before this fix. Latest main remains `1b4befda87c97bd70da2c1d6065427034d12660a`.
Source Git hashes, capture identities and all 48 PNG SHA-256 values were checked;
all 48 normal label PNGs are byte-identical to the unchanged approved PNGs.

| Check | Result |
| --- | --- |
| Normal original CI images | 48/48 accepted, difference 0 |
| Actual suffix ink erasure | 48/48 rejected by image comparison |
| Prefix / top / bottom ink erasure | 144/144 rejected by image comparison |
| Edge control differences | 5..57 materially changed pixels per control |
| Complete suffix capture with updated checksums | validateCapture PASS; 48 FAIL verdicts are complete/valid; acceptance rejects all |
| Existing controls | all 20 expected outcomes retained |
| Real old source 3b90ddbb… (archived images) | 48/48 rejected; all four priority cases remain rejected |
| Legacy script on real old source | archived 24/24 acceptance retained; fresh execution is separate |

Every boundary control saves actual erase region, background, changed pixels,
actual/baseline/diff SHA-256, difference count, image verdict and reason in
`boundaries/results.json`; the PNGs and red difference images are preserved.
No background-only erasure is counted. Widths/heights remain unchanged.

The exact review counterexamples erase x=106..111 in the historical ROI's
vertical range. The original comparator/contract/scenario sources are loaded
unmodified from Git at reviewed HEAD, and both old/new validations use the same
mutated PNGs with matching capture SHA-256, same approved PNGs and tolerance.

| 375px / dark / synthetic 2× | Erased pixels | Old image verdict | New image verdict |
| --- | ---: | --- | --- |
| Chromium 未着手 | 12 | PASS / 0 | FAIL / 12 |
| Chromium 進行中 | 13 | PASS / 0 | FAIL / 13 |
| WebKit 未着手 | 19 | PASS / 0 | FAIL / 19 |
| WebKit 進行中 | 26 | PASS / 0 | FAIL / 26 |

Both `validateCapture` and `validateComparisons` pass because checksums and
verdict completeness are valid. `compareCapture` emits the four FAIL verdicts;
the runner's acceptance assertion rejects them. This is not checksum rejection.
The original contract accepts all 48, including the four faulty PNGs. See
`review-replay/mutation.json`, `review-replay/results.json` and before/after diffs.

Reproduce from a complete downloaded artifact (not the reduced evidence copies):

```sh
npm ci --ignore-scripts --prefix apps/v11
node apps/v11/kanban-audit.cjs ARTIFACT_DIRECTORY .work/NEW-audit
```

This invokes no browsers. Source/target IDs are preserved rather than relabeled
as a fresh run. Stored capture copies omit unchanged state-card PNGs/logs to
avoid duplicating history; use the complete original artifact for validation.
`sha256.json` covers the archived recalculation deliverables (this explanatory
README and subsequent fresh-CI records are outside that snapshot manifest).

## Fresh browser execution and CI

The normal runner automatically includes all 48 normal/48 suffix/144 other edge
controls and exact review RED→GREEN, alongside old source and legacy 24/24,
20 original controls, and all initial/moved/Undo/Reset 16/32px, operation,
focus, horizontal overflow and pageerror checks. Nothing is removed from the
original `kanban-zoom-test.cjs`.

CI uses unchanged Playwright 1.56.1 Noble image digest, browser versions and font
fingerprint. Manual `workflow_dispatch` with `kanban_failure_control=true`
injects the exact four erased regions **after fresh browser capture**, updates
hashes, and must fail the normal runner/CI image assertion. Default is false.
It does not alter product code or baselines. Fresh normal and fault CI results
will be reported with run IDs and immutable artifacts after submission.

Local Windows has no Docker/WSL distribution: fixed-container browser runs are
NOT_TESTED locally. 17 contract tests and dataset verification pass locally.
Preservation's sandbox temp path and the runner's symlink test encounter Windows
permissions; these are environment failures, not successful tests. See
`provenance.json`, which also records an initial incorrectly tall synthetic
erasure (chrome included), corrected to the exact review vertical band before
RED→GREEN acceptance. No failure is described as a product regression.

## Limits and independent review

Overall PARTIAL until fresh CI and independent review. P3-01 closure is pending,
merge recommendation NO at this point. Independent re-review is separate from
this implementer visual inspection. Initial 未着手/進行中 are the automatic
image oracle scope; 完了, native popup, physical iPhone Safari, VoiceOver and OS
text enlargement remain NOT_TESTED. No Stage 3 release, Draft removal, Issue
closure, merge or publication is authorized here.
