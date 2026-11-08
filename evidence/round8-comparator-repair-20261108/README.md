# Stage 1 comparator observation contract repair

2026-11-08 JST. Refs #30, PR #31 review 5817800901. Old fixed HEAD: `1c24c3ed5c36235526641cd1bc5ae25599c7d094`.

## Contract

`snapshot.focusVisible` must be an own property with a boolean value. Both true and false are valid observations; all four A/B boolean combinations remain comparable. Undefined/missing/null/string/number/object/array are invalid observations even when both sides match. PNG differences remain outcomes, never equality prerequisites. Missing trials now return NOT_COMPARABLE instead of throwing before the runner can save its failure report.

Runner and archive audit already call the same `validateRow` / `comparePair`; they therefore enforce the new contract without rewriting the fixture or historical evidence. Fixture HTML/JS, original input sequences, trial counts and browser configuration are unchanged.

## Same-input RED to GREEN

The separately preserved corpus has 16 fixed JSON pair inputs and their SHA256, exact old source, old/new stdout, source SHA256 and process exit codes. Old missing-both: `validateRow` returns [] for each side, MODEL_COMPARABLE, both focusVisible outcomes null, exit 0. The same bytes under the repair produce NOT_COMPARABLE / `focus-visible-observation`, exit 1. Null and all invalid types reject, valid boolean/PNG differences remain accepted. Existing invalid owner, missing focus return, interrupted/error-bearing trial and missing PNG hash remain rejected.

Reproduction in the evidence bundle: `node evidence/compare-case.cjs evidence/old-source/pr31/classify.cjs evidence/cases/pr31/missing-both.json`, then the same command with `pr31/tests/select-escape-minimal/classify.cjs`. The command maps accepted classification to exit 0 and rejected classification to exit 1. These are comparator-process codes, not historical browser exit sidecars. Explicit undefined/inherited properties are also covered by unit tests because JSON cannot encode undefined or inheritance.

27 Node tests pass. New local Chromium: 20/20 trials, 4/4 pairs, runner/audit exit 0. Local WebKit cannot launch due missing shared libraries; its zero-trial failure report and exit 1 are retained, never PASS. Remote CI and independent review are separate acceptance gates, pending when this commit is submitted.

## Preservation and boundaries

Original 60 trials/60 PNG, previous repair's 60 trials/60 PNG, their original ZIPs, audit material and failed/successful old CI remain unchanged. New executions use fresh paths. CI success is not a substitute for API-digest ZIP verification and independent PNG/JSON recalculation.

Scope remains MODEL_ONLY_NOT_SDK_CAUSAL. Real Safari, physical input, VoiceOver and old product root cause remain NOT_TESTED / UNKNOWN. PR31 and PR33 stay Draft, no merge. PR29/23 acceptance unchanged. Stage 3 HOLD is not lifted.
