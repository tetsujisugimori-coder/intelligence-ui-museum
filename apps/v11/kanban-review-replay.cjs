"use strict";
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { read, sha } = require("./kanban-image.cjs");
const current = require("./kanban-contract.cjs");
const { injectReviewErasure } = require("./kanban-boundary-controls.cjs");
const reviewedHead = "e40d92bcc97fa1bf214b0d613aac2d144fd2138f";
function replay(report, dir, identity, child, baseline, out) {
  assert(!fs.existsSync(out)); fs.mkdirSync(out, { recursive: true });
  const harness = path.join(out, "reviewed-harness"); fs.mkdirSync(harness);
  const sourceHashes = {};
  for (const file of ["kanban-contract.cjs", "kanban-image.cjs", "kanban-scenarios.cjs"]) {
    const data = execFileSync("git", ["show", `${reviewedHead}:apps/v11/${file}`], { cwd: path.resolve(__dirname, "../..") });
    fs.writeFileSync(path.join(harness, file), data); sourceHashes[file] = sha(data);
  }
  // Resolve the SAME locked codec, without changing any archived source byte.
  const proxy = path.join(harness, "node_modules/playwright-core/lib"); fs.mkdirSync(proxy, { recursive: true });
  fs.writeFileSync(path.join(proxy, "utilsBundle.js"), `module.exports = require(${JSON.stringify(require.resolve("./node_modules/playwright-core/lib/utilsBundle.js"))});\n`);
  const legacy = require(path.join(harness, "kanban-contract.cjs"));
  const copied = path.join(out, "capture"); fs.cpSync(dir, copied, { recursive: true });
  const mutated = JSON.parse(JSON.stringify(report)), base = JSON.parse(fs.readFileSync(path.join(baseline, "manifest.json")));
  // Preserve diagnostic capture ROI when present. If absent, replay with the
  // exact historical metadata; this never chooses the production region.
  for (const r of mutated.rows) for (const i of r.images) i.roi ??= base.images.find(b => b.file === i.file).roi;
  injectReviewErasure(mutated, copied, path.join(out, "mutation.json"));
  legacy.validateCapture(mutated, copied, identity, child);
  const oldResults = legacy.compareCapture(mutated, copied, baseline, path.join(out, "before-diff"));
  legacy.validateComparisons(oldResults);
  assert(oldResults.every(r => r.status === "PASS" && r.differentPixels === 0), "reviewed harness must reproduce false acceptance");
  current.validateCapture(mutated, copied, identity, child);
  const newResults = current.compareCapture(mutated, copied, baseline, path.join(out, "after-diff"));
  current.validateComparisons(newResults);
  const expected = { "chromium|todo": 12, "chromium|doing": 13, "webkit|todo": 19, "webkit|doing": 26 };
  const review = newResults.filter(r => r.condition.endsWith("-375-dark-2"));
  assert.equal(review.length, 4);
  for (const r of review) {
    assert.equal(r.status, "FAIL"); assert.equal(r.dimensionMismatch, false);
    assert.equal(r.differentPixels, expected[r.condition.split("-")[0] + "|" + r.label]);
  }
  assert.equal(newResults.filter(r => r.status === "PASS").length, 44);
  const result = { status: "PASS", reviewedHead, sourceHashes, checksumValidation: "both PASS with updated SHA256",
    unchanged: "same PNG dimensions, baseline PNGs and tolerance 12/2; no alignment or resizing", before: oldResults, after: newResults };
  fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(result, null, 2));
  return { status: "PASS", oldFalseAcceptances: 4, newImageRejections: 4 };
}
if (require.main === module) {
  const [artifact, output] = process.argv.slice(2), summary = JSON.parse(fs.readFileSync(path.join(artifact, "summary.json")));
  const run = summary.runs.find(r => r.label === "current"), dir = path.join(artifact, "current");
  console.log(JSON.stringify(replay(JSON.parse(fs.readFileSync(path.join(dir, "capture.json"))), dir, run.identity, run.child,
    path.join(__dirname, "kanban-baselines"), path.resolve(output)), null, 2));
}
module.exports = { replay };
