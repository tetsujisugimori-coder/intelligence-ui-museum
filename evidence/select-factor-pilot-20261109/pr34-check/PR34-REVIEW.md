# PR34 independent readback, 2026-11-09 JST

Frozen analysis HEAD 5edb9c7bf5c24add6a238eec7ba2cd968384e357; tree 9d3dd62568a9b1ca40737d05651c576f264721c6. Separate checkout `museum-round9-independent` at this commit. Fresh locked npm installation (not shared node_modules) and both Museum + detail SDK fixture rebuilds.

Reacquired producer b7b1e8e6b6cdf5518a2b061766cbd098502c41b3 Windows artifact13638290463 and Linux13637439295. ZIP digest matches supplied GitHub API digest, CRC clear, 403 entries each. Windows SHA256 b5f6ede889ff775086d21f52e23c757168187d2d7b4d505ee4e005c1e1a11b6e, Linux 6c9a23f66ee28cba2af3c0f5477582bc154c218896103f7e145d29c4b7638376.

Original raw bytes were not changed. Frozen audit.py in reclassification mode passed separately for both 36-trial artifacts: manifest membership + per-file SHA, row binding, source/tree/product identity, rebuilt distribution bytes and SDK provenance, 72 trace CRC/actions/frame references, 288 Select PNG pixel recomputations. Original classification and exit remain intact. Existing 112 tests and 302 protected original-file checks pass. These are artifact reanalysis, not new browser samples.

Visually inspected Windows A-direct-1 Select-on (no blue outline) and A-tab-1 Select-on (blue outline). The aggregate audit matches previous report. No causal inference or Stage 3 acceptance follows.

Limit: local Windows original ZIP 873c54b6a7da2a171fc620741760774d50a1c83fa253e36c4c4ad6690b4b5c95 was not reacquired in this reviewer run. The existing prior review reports its integrity, which is distinct from this independent CI-artifact reanalysis.
