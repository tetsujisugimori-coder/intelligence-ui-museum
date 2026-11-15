# 2026-11-15 JST: same-artifact audit follow-up

Original run43699507591 attempt1, artifact14156471278, HEAD8584a352e5cbff9ccdb603f1269c686b9cef3e7f / treeb02099dd5feebc764cf0c12f693a70cf3c185051. Raw ZIP66856825bytes SHA2568c795fd60464f31ea1f8a82721be364a47f39d42ce2e8fed206d41b8b7830698. Saved/retrieved bytes and500entry CRC verified before work. Dedicated .work copy and TMPDIR used; original500-file hashes unchanged after controls.

Old auditor passed the entire ~188KB serialized observation as one Python argv argument and exited1 E2BIG. Final change projects only the four identifiers used by Python: id, engine, width, zoom. The Python assertions, source/HEAD/tree checks, image/HAR/state/text checks and rejection reasons remain unchanged. No maxBuffer increase, exception suppression, product change or evidence rewriting.

Same original evidence, with its original execution-source hashes: corrected audit exit0,14 normal conditions and34 normal/fault pairs inspected; existing11 audit mutations reject for intended reasons and control runner exits0. This is retrospective re-audit of OLD HEAD evidence by a NEW auditor, not conversion of old CI failure into success and not new-head CI evidence.

An intermediate stdin transport prototype accepted normal evidence but produced EPIPE on early missing-trace exit. It was rejected; failure logs retained. Final minimal-identity transport avoids this secondary failure. Synthetic300KB transport test preserves engine/viewport/reduced-motion/HAR identity rejection; it is not real-browser evidence. State/helper/product/transport66 unit tests PASS; preservation and migration checks PASS. R5/R6 guards retained.

Control11: wrong-condition viewport; missing report/image/trace/HAR; wrong-condition trace; wrong graph ID; wrong source text; failed result; forged success; partial text2x. Full same-input independent review and final-head formalCI/rawZIP acceptance are separately recorded. OverallPARTIAL/limited mergeNO until all required checks complete. Draft, Stage3HOLD, v10NO, PR46SUSPENDED maintained.

Auditor raw-byte SHA256 old40968f4d5434811f45c0f8f9e426b2f3e2077ffdb9451b144022d248b30f307d / new9e7d18ae0c5a69eadd32087784c9aae9e6720d332625b310d7c18e9cc649df2d. Local Nodev24.22.1/Linux; original CI Nodev22.23.4/Linux Playwright1.56.1. No new local browser execution for this correction.

Independent reviewer (separate agent, not implementer) reran old E2BIG, final full normal audit14, all11 negative reasons,300KB synthetic transport and500-file byte invariance. All final scoped checks PASS; stdin EPIPE stays a rejected prototype. This is independent re-execution of the same auditor plus source/diff/reason inspection, not an independently implemented general evidence verifier. Final-head CI remains pending.
