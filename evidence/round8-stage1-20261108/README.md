# Round 8 Stage 1 independent audit and comparator repair

2026-11-08 JST. Scope: MODEL_ONLY_NOT_SDK_CAUSAL. Issue #30 / #28, Draft PR #31.

Original HEAD c65eea3aa96214ee0e73ffa24e3afb12495e0eb3, tree d7f8bc20ca3346b14ff55b9dce38cf553285432d; base 615334d30b0673c786b12877bcec3d7e723be9b2. Run 42441011564 attempt 1 checked out PR merge 13b863d2c496629083d81d5d3e3831f49c448959; it is not the head SHA.

Independent auditor retrieved all 3 original ZIPs, verified authenticated API digest, decoded 60 PNG and recalculated 60 rows / 12 contrasts. Each ZIP has 42 files. Windows WebKit artifact13600669838 SHA256 86fd33cc3da8bf726e22a172e14a9fa683ebd8b5fe276bdc7738f43b6b8535e0; Linux Chromium13600858923 SHA256 5a3cbceaf439d962442abd060697086ec5782f30be38cf97dbdb3d0d62980553; Linux WebKit13601806945 SHA256 fc2e5230e53b85d78cd67537b6b9f0981985abf83ebdc6bac0626b4dc196e366.

Initial formal independent review: https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/31#pullrequestreview-5817415718 . PARTIAL, comparator P2, original evidence consistency PASS. Direct WebKit pairs show canceled focus-visible false versus uncanceled true. Chromium Tab differing hash consists of 2 changed pixels; both pictures contain the outline (981 orange pixels). Whole-image hash differences alone do not identify outline absence. Two repetitions do not establish long-term stability.

## Repair and identical counterexamples

The original comparator accepted mutually matching corrupt traces: cancellation contradiction, both close origins changed, both focus traces omitted, reversed keys, source hash relabel, and an error-bearing COMPLETE. It also lacked an explicit instrumentation contract. Repair checks each row independently, event counts/order/owners, cancellation consistency, source and identity binding. An independent second review found focus-before-mutation and internal identity relabel; these also now reject. Outcome focus-visible/PNG differences are never comparability failures.

10 required counterexamples: 9 rejected by internal validator, fully rehashed PNG substitution rejected at the external ZIP digest boundary. An editable internal manifest is not a signature and cannot authenticate fully rewritten evidence. `verify-archive.cjs` requires the authenticated external digest. Raw images are also checked for trial filename binding, dimensions, signature, chunk bounds and inflated scanline/filter structure. The independent Python audit fully decodes pixels.

To reproduce old/new on identical fault inputs: extract the attached bundle, run `node independent/source/audit.cjs independent/fault-inputs/NAME` for old, then `MINIMAL_SOURCE_DIR=/absolute/path/to/independent/source node tests/select-escape-minimal/audit.cjs independent/fault-inputs/NAME` for repaired. Engine chromium and repeats2 are defaults. Expected source is the independently retrieved original commit snapshot, never edited to make a test pass. Verify original ZIP before extraction with `verify-archive.cjs ZIP sha256:DIGEST`.

Bundle `round8-stage1-independent-evidence-final.tar.gz`, SHA256 e56f97bb65e56df00da8c5b1b3b6035367020493058af1c5b52d1df8cc7badb4, contains original ZIPs, old source, exact fault input snapshots, independent recomputation code/results, RED/GREEN logs and reviewed source snapshots. No old evidence was overwritten. Original CI offers shell step success, not a separate numeric exit-code sidecar.

## Additional implementation checks and limits

Implementer: 18 unit tests PASS; new local Chromium20 rows/4 pairs plus audit PASS, external exit0. Local WebKit launch failed before trials due missing shared libraries; exit1 and logs retained. Windows and WebKit fresh checks depend on new Actions runs. Independent source re-audit: original60 rows PASS; 10 specified +2 extra faults rejected at their documented boundaries. New final CI and formal committed-head rereview are pending at this commit; do not infer success.

No SDK/product/lock changes. Stage 2 real-SDK fixture not yet started. PR31/29/23 stay Draft, no merge, Stage3 HOLD. Real Safari/physical input/VoiceOver NOT_TESTED; real SDK and historical offscreen causality UNKNOWN.
