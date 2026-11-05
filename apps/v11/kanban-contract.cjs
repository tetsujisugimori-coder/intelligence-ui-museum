"use strict";
const assert = require("node:assert/strict"),
  path = require("node:path"),
  fs = require("node:fs");
const { conditions, key, states } = require("./kanban-scenarios.cjs"),
  { sha, read, compare, policy } = require("./kanban-image.cjs");
function freshRead(file, identity) {
  assert(
    fs.statSync(file).mtimeMs >= identity.started - 2,
    "stale image timestamp",
  );
  return read(file);
}
function validateCapture(report, dir, identity, child) {
  assert.equal(child.code, 0, "capture child nonzero");
  assert.equal(child.signal, null);
  assert.equal(child.timedOut, false);
  assert.equal(report.exitCode, 0);
  for (const k of ["runId", "targetHead", "targetTree"])
    assert.equal(report[k], identity[k], `${k} mismatch`);
  assert.equal(report.rows.length, 24, "missing conditions");
  assert.deepEqual(report.rows.map(key), conditions.map(key));
  assert(Date.parse(report.started) >= identity.started, "stale report");
  assert(Date.parse(report.finished) >= Date.parse(report.started));
  for (const r of report.rows) {
    assert.equal(r.status, "PASS", r.error);
    assert.equal(r.selectFocus.active, true);
    assert.equal(r.selectFocus.visible, true);
    assert(r.selectFocus.outline > 0);
    assert.equal(r.movedFocus, true);
    assert.equal(r.undoFocus, true);
    assert.deepEqual(r.errors, []);
    assert.deepEqual(
      r.snapshots.map((s) => s.state),
      states,
    );
    for (const s of r.snapshots) {
      assert.deepEqual(s.fonts, Array(4).fill(r.zoom === 2 ? "32px" : "16px"));
      assert(s.geometry.scroll <= s.geometry.client);
      assert.deepEqual(s.errors, []);
      freshRead(path.join(dir, `${key(r)}-${s.state}.png`), identity);
    }
    assert.deepEqual(
      r.images.map((i) => i.label),
      ["todo", "doing"],
    );
    for (const i of r.images) {
      assert.equal(i.file, `${key(r)}-${i.label}.png`);
      assert.equal(
        i.sha256,
        sha(freshRead(path.join(dir, i.file), identity).bytes),
      );
      assert.equal(i.text, i.label === "todo" ? "未着手" : "進行中");
    }
  }
  return report;
}
function compareCapture(report, dir, baselineDir, diffDir) {
  const base = JSON.parse(
    fs.readFileSync(path.join(baselineDir, "manifest.json"), "utf8"),
  );
  assert.deepEqual(base.policy, policy);
  assert.equal(base.sourceHead, "1b4befda87c97bd70da2c1d6065427034d12660a");
  assert.equal(base.sourceTree, "99d5f7f904f95fbd64d4ff4fb3aebf72511da29d");
  assert.equal(base.images.length, 48);
  assert.equal(new Set(base.images.map((i) => i.file)).size, 48);
  assert.equal(base.environment.platform, report.environment.platform);
  assert.equal(base.environment.playwright, report.environment.playwright);
  assert.equal(
    base.fontFingerprint,
    report.fontFingerprint,
    "font inventory mismatch",
  );
  fs.mkdirSync(diffDir, { recursive: true });
  const comparisons = [];
  for (const r of report.rows) {
    assert.equal(
      r.version,
      base.versions[r.engine],
      "browser version mismatch",
    );
    for (const i of r.images) {
      const b = base.images.find((b) => b.file === i.file);
      assert(b, "baseline missing required image");
      assert.equal(
        sha(read(path.join(baselineDir, b.file)).bytes),
        b.sha256,
        "baseline checksum mismatch",
      );
      assert.equal(i.text, b.text);
      // The approved raster fixes the region, never current DOM/canvas metrics
      // or current ink bounds. Native widgets need not paint at CSS padding.
      // Historical manifest.roi is retained as evidence, but is not an oracle.
      const approved = read(path.join(baselineDir, b.file)).png;
      const roi = { x: 0, y: 0, width: approved.width, height: approved.height };
      const result = compare(
        path.join(dir, i.file),
        path.join(baselineDir, b.file),
        roi,
        path.join(diffDir, i.file),
      );
      comparisons.push({ condition: key(r), label: i.label, ...result });
    }
  }
  assert.equal(comparisons.length, 48);
  return comparisons;
}
function validateComparisons(rows) {
  assert(Array.isArray(rows), "comparison processing not executed");
  const expected = conditions.flatMap((r) =>
    ["todo", "doing"].map((label) => `${key(r)}|${label}`),
  );
  assert.equal(rows.length, 48, "comparison processing incomplete");
  assert.deepEqual(
    rows.map((r) => `${r.condition}|${r.label}`),
    expected,
  );
  for (const r of rows) {
    assert(["PASS", "FAIL"].includes(r.status), "comparison verdict missing");
    assert(Number.isInteger(r.differentPixels) && r.differentPixels >= 0);
    assert.deepEqual(r.policy, policy);
    for (const k of ["actualSha256", "baselineSha256", "diffSha256"])
      assert.match(r[k], /^[0-9a-f]{64}$/);
    assert.equal(
      r.status,
      !r.dimensionMismatch && r.differentPixels <= policy.maxDifferentPixels ? "PASS" : "FAIL",
    );
  }
}
module.exports = { validateCapture, compareCapture, validateComparisons };
