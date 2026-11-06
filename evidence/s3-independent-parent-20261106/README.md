# Independent S3-1 review observations (2026-11-06)

## Scope and verdict

Product main: `77d30ac54e35b8a6408fb5f56db4697adff8a452`.
Tree: `bae0835e1832cf569b71fd33816bb77acabf52c3`.
This independent observer did not author the reacceptance runner and did not change product code, SDK, dependencies, baseline images or historical evidence. This report is **FAIL for Tooltip keyboard retention in the tested condition**, not a blanket finding that all six controls fail. Final research acceptance must incorporate the separate primary and CI results.

The previously reported Select return failure did not recur: all six new Chromium focus cases returned to the same connected trigger, retained the expected selection, and showed focus-visible. A representative 320px dark/root200 screenshot was opened and visually inspected; its blue outline was visible and not clipped. This does not replace WebKit or the full visual matrix.

## Executions and raw evidence

- `python3 scripts/verify-migration.py`: successful independent preservation check, 302 original hashes, v09 117 exhibits/11 categories and historical evidence preserved.
- `python3 scripts/prepare-work.py`; `.work/v10: npm run build && npm test && node scripts/verify-baseline.mjs`: success. See `build-test.log`.
- Separate `.work/second-build: npm run build`, followed by `diff -qr .work/v10/dist .work/second-build/dist`: success, exit 0 and byte-identical build output. See `build2.log`.
- Fresh dependency acquisition was not completed: initial npm cache ENOENT (exit 254), a later network approval was cancelled before a decision. Already installed dependencies from a previous review were reused only after byte-identical lock comparison. A temporary nested-copy mistake caused `tsc: not found` (127), then directory placement was corrected; failed directories were retained locally. These are environment/setup outcomes, not product test failures or a fresh npm install PASS.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/museum-playwright node .work/independent-browser/run.cjs`: first 16 Chromium configurations plus six focus cases executed. Runner returned exit 1. Raw known KaTeX font/CSP console errors made the first conservative gate fail. A single Tooltip keyboard timeout also occurred (375/light/root200). WebKit failed to launch because host libraries were absent. See `matrix-first.json`.
- `... node .work/independent-browser/run-second.cjs`: second 16 Chromium configurations, six focus cases. Runner returned exit 1. Raw errors retained; only exact known KaTeX font/CSP messages separately classified. 14/16 configurations completed their 16 assertions, while 375/dark/root200 and 390/dark/root200 timed out at Tooltip keyboard display. All six focus cases passed. See `matrix-second.json` and six PNGs. Counts describe configurations, not number of independent component operations.
- `... node .work/independent-browser/tooltip-diagnostic.cjs`: 20 diagnostic fresh-page loops at 375x1000, dark, root200. Ten hover/Escape-before-keyboard and ten keyboard-only variants. Two failures in hover variants; transient opening then closure visible in trace. See `tooltip-fast-20.json`.
- `... node .work/independent-browser/tooltip-converged.cjs`: same 20 loops with two requestAnimationFrame boundaries between Tab and Shift+Tab and after observing opening. **20/20 failed to retain the Tooltip**. See `tooltip-converged-20.json`.
- `... node .work/independent-browser/tooltip-natural-tab.cjs`: **10/10 failed with natural Tab only**, starting from fresh page top, pressing Tab until the Tooltip trigger, with two animation frames per key. No programmatic focus or hover was required. See `tooltip-natural-tab-10.json`, `tooltip-natural-tab-fail.png`.

The three diagnostic programs deliberately preserve pass/fail observations without defining a process exit gate (exit 0). Do not report those exit codes as acceptance PASS. The matrix programs do have nonzero failure exits. Their absolute module path documents the actual host and can be adjusted for a separate reproduction; execution here used the saved source exactly.

## P2 candidate: Tooltip disappears after natural keyboard focus auto-scroll

Reproduction:
1. Chromium 141.0.7390.37, new page at 375x1000, `?theme=dark&text=200`.
2. From page top, repeatedly press Tab. Wait for rendered frames between keys.
3. Reach the official Tooltip's `説明を見る` trigger.
4. Observe that the focused trigger remains outlined, but the explanation is absent.

Observed first natural-Tab trial (performance.now milliseconds): focusin 1642.4; Tooltip instant-open/DOM content around 1649.2; ancestor scroll 1653.4; content closed/removed 1657.3. `document.activeElement` remains the trigger, document focused and visible. A 2000ms visibility wait then fails. All 10 fresh natural-Tab trials reproduced.

Cause evidence: installed official `@radix-ui/react-tooltip/dist/index.js`, lines 363–374, closes Tooltip on a captured ancestor scroll event (`event.target.contains(context.trigger)`). Focusing an off-screen trigger causes browser scrolling; Tooltip opens on focus and the subsequent scroll dismisses it. The high text-size layout exposes this event sequence. This is consistent source and event evidence, not a claim that the original Stage 2R review already tested this path.

Recommended next action: create a separate product defect issue with this minimal reproduction; investigate an application-level/public-API solution or document a justified acceptance limitation. Do not modify the official SDK distribution and do not hide the defect by asserting presence before the post-focus scroll has settled. A pre-centred `element.focus()` path is useful but does not substitute for natural keyboard navigation.

## Additional evidence-gate review (candidate 0b3aead)

Static findings sent to the primary reviewer: focus audit only validates the core 12 rows out of 44, and only counts the 14 faults/4 regressions; matrix images accept a length of 11 without uniqueness or required-name validation. These findings need independent mutation controls against genuinely executed evidence and reevaluation on the final runner HEAD. They are not reported here as already fixed or as independently executed fault controls.

## Limits and preserved boundaries

- WebKit is NOT_TESTED in this independent host. It lacks libgtk-4, libgraphene, woff2dec, harfbuzz-icu, hyphen, manette and GLES libraries. No unsafe installation or denied-network bypass was attempted.
- Known font CSP errors remain raw and are not described as console-clean. The six tested controls do not render KaTeX mathematics; font/CSP remains a separate publication gate.
- No real Safari, VoiceOver, native OS text zoom, authenticated deployment assets, release licensing or full117-exhibit interaction verification.
- No final CI/artifact ZIP integrity claim in this report. Primary execution/CI and independent evidence are separate.
- Stage 3 HOLD remains; no publication/merge/Draft release.

## Supplemental independent audit (candidate 655cb29, not final acceptance)

The primary synthetic audit fixture was run in a separate temporary directory, then three independently selected mutations were applied with hashes recomputed. A contradictory `sdk.json status=FAIL`, duplicated engines `[chromium,chromium]`, and 14 identical `chromium/disabled-return` focus fault entries were all wrongly accepted with exit 0/PASS. `audit-review/challenge-results-655cb29.json` records the actual outputs. The challenge driver correctly returned exit 1. These are synthetic evidence-contract failures, not live browser executions. The primary implementer was asked to fix and rerun them on the final candidate.

Original CI artifact ZIPs for runs 42204503942 and 42205120241 were independently downloaded, CRC tested and all manifest hashes checked. Full counts, identities and digests are in `audit-review/ci-*-zip-audit.json`. The second run executed all 32 matrix configurations but failed; required Select focus cases passed 12/12. Known font-CSP classification and WebKit style injection measurement failures need separation from genuine product defects. These CI observations are not this observer's WebKit browser runs and are not final-HEAD evidence.

The initial CI's extracted registry package and the SDK files used in this observer's real Chromium runs matched for all 2,645 SDK-owned files. This comparison excludes nested dependencies and does not claim independent verification of a raw tarball that was not retained.
