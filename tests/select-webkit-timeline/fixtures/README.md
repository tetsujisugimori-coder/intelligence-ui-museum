# Audit replay baseline

`audit-policy-stop/` preserves a real Chromium 141.0.7390.37 run on Linux,
375px / light / 100%, exact legacy focus route, captured 2026-11-07.
It contains raw JSON, trace, PNG files, the Node-side blocked-operation receipt,
and the original manifest. The product HEAD was
`8e52ebe049a74abf9f6a9f91f855a12488980f32`; the diagnostic repair was uncommitted.
It is not final-HEAD evidence or a Windows/WebKit result.

The wrapper regression test uses this normal diagnostic raw as its baseline,
changes only the named failure (and current checkout HEAD/tree metadata and test child run nonce), and
recomputes the manifest so semantic rejection cannot be attributed to a stale
hash. Deliberate corruption cases change evidence after manifest creation.
The child is a real subprocess but replays data: these tests are **not** new
browser trials. `normal` preserves original suite FAIL / child exit 1 and
diagnostic COMPLETE / wrapper exit 0. Forbidden force-click is never delivered.

The two minimal-lane regression cases also adapt the pinned executed runner hash,
source callsite and no-hook final-trace shape, so that the only semantic difference
between their normal/invalid pair is `final: true`. This is fixture preparation,
not a claim that the historical exact-lane raw was a minimal live execution.
