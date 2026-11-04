"use strict";
// Recalculate archived CI images. This command does not launch a browser.
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { validateCapture, compareCapture, validateComparisons } = require("./kanban-contract.cjs");
const { sha, read } = require("./kanban-image.cjs");
const [input, output] = process.argv.slice(2);
assert(input && output, "artifact directory and NEW output directory required");
const artifact = path.resolve(input), out = path.resolve(output), baseline = path.join(__dirname, "kanban-baselines");
assert(!fs.existsSync(out)); fs.mkdirSync(out, { recursive: true });
const summary = JSON.parse(fs.readFileSync(path.join(artifact, "summary.json")));
const audit = { kind: "archived CI recalculation; NOT new browser execution", inputHarnessHead: summary.harnessHead,
  inputHarnessTree: summary.harnessTree, started: new Date().toISOString(), runs: [] };
for (const run of summary.runs) {
  const dir = path.join(artifact, run.label), capture = JSON.parse(fs.readFileSync(path.join(dir, "capture.json")));
  validateCapture(capture, dir, run.identity, run.child);
  assert.equal(run.source.head, run.identity.targetHead); assert.equal(run.source.tree, run.identity.targetTree);
  const git = (...args) => execFileSync("git", args, { cwd: path.resolve(__dirname, "../..") });
  assert.equal(git("rev-parse", run.source.head + "^{tree}").toString().trim(), run.source.tree);
  for (const [name, hash] of Object.entries(run.source.files))
    assert.equal(sha(git("show", `${run.source.head}:apps/v11/${name}`)), hash);
  const comparisons = compareCapture(capture, dir, baseline, path.join(out, run.label + "-diff"));
  validateComparisons(comparisons);
  fs.writeFileSync(path.join(out, run.label + "-comparisons.json"), JSON.stringify(comparisons, null, 2));
  audit.runs.push({ label: run.label, source: run.source, accepted: comparisons.filter(r => r.status === "PASS").length,
    rejected: comparisons.filter(r => r.status === "FAIL").length });
  if (run.label === "current") {
    assert(comparisons.every(r => r.status === "PASS"));
    const base = JSON.parse(fs.readFileSync(path.join(baseline, "manifest.json")));
    audit.imageIdentity = capture.rows.flatMap(r => r.images.map(i => ({ file: i.file, sha256: i.sha256,
      baselineSha256: base.images.find(b => b.file === i.file).sha256 })));
    assert(audit.imageIdentity.every(i => i.sha256 === i.baselineSha256), "reference image identity differs");
    audit.existingControls = require("./kanban-controls.cjs").controls(capture, dir, run.identity, run.child, baseline, path.join(out, "existing-controls")).length;
    audit.boundaries = require("./kanban-boundary-controls.cjs").boundaryControls(capture, dir, run.identity, run.child, baseline, path.join(out, "boundaries"));
    audit.reviewReplay = require("./kanban-review-replay.cjs").replay(capture, dir, run.identity, run.child, baseline, path.join(out, "review-replay"));
  } else if (run.label === "old") {
    for (const engine of ["chromium", "webkit"]) for (const label of ["todo", "doing"])
      assert.equal(comparisons.find(c => c.condition === `${engine}-375-dark-2` && c.label === label).status, "FAIL");
    const legacy = JSON.parse(fs.readFileSync(path.join(artifact, "legacy-old/results.json")));
    assert.equal(legacy.length, 24); assert(legacy.every(r => r.status === "PASS"));
    audit.historicalLegacyOld = "24/24 accepted (archived result; fresh execution is separate)";
  }
}
audit.status = "PASS"; audit.finished = new Date().toISOString();
fs.writeFileSync(path.join(out, "audit.json"), JSON.stringify(audit, null, 2));
console.log(JSON.stringify({ status: audit.status, runs: audit.runs, boundaries: audit.boundaries, reviewReplay: audit.reviewReplay }, null, 2));
