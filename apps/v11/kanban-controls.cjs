"use strict";
// Mutate copies only; preserve every positive/negative attempt and its error.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  { spawnSync } = require("node:child_process");
const {
    validateCapture,
    compareCapture,
    validateComparisons,
  } = require("./kanban-contract.cjs"),
  { read } = require("./kanban-image.cjs");
const { PNG } = require("./node_modules/playwright-core/lib/utilsBundle.js");
function controls(report, dir, identity, child, baseline, out) {
  fs.mkdirSync(out, { recursive: true });
  const rows = [];
  const clone = () => JSON.parse(JSON.stringify(report));
  function check(name, action, expected) {
    const row = { name, expected };
    try {
      action();
      row.observed = "accepted";
    } catch (e) {
      row.observed = "rejected";
      row.error = e.stack;
    }
    row.status = row.observed === expected ? "PASS" : "FAIL";
    rows.push(row);
    fs.writeFileSync(
      path.join(out, "results.json"),
      JSON.stringify(rows, null, 2),
    );
    assert.equal(
      row.status,
      "PASS",
      `control ${name}: ${row.error || row.observed}`,
    );
  }
  check(
    "valid current capture",
    () => validateCapture(report, dir, identity, child),
    "accepted",
  );
  const validComparisons = compareCapture(
    report,
    dir,
    baseline,
    path.join(out, "positive-diff"),
  );
  check(
    "valid image comparison verdicts",
    () => validateComparisons(validComparisons),
    "accepted",
  );
  for (const [name, mutate] of [
    ["comparison not executed", () => undefined],
    ["missing comparison", (r) => r.slice(1)],
    ["duplicate comparison", (r) => [r[0], ...r.slice(0, -1)]],
    [
      "missing verdict",
      (r) => {
        delete r[0].status;
        return r;
      },
    ],
  ])
    check(
      name,
      () =>
        validateComparisons(
          mutate(JSON.parse(JSON.stringify(validComparisons))),
        ),
      "rejected",
    );
  check(
    "actual child exit 7",
    () => {
      const p = spawnSync(process.execPath, ["-e", "process.exit(7)"]);
      assert.equal(p.status, 7);
      validateCapture(report, dir, identity, {
        code: p.status,
        signal: p.signal,
        timedOut: false,
      });
    },
    "rejected",
  );
  for (const [name, mutate] of [
    ["missing condition", (r) => r.rows.pop()],
    ["duplicate condition", (r) => (r.rows[1] = r.rows[0])],
    ["target HEAD mismatch", (r) => (r.targetHead = "0".repeat(40))],
    ["target tree mismatch", (r) => (r.targetTree = "0".repeat(40))],
    ["stale run token", (r) => (r.runId = "old-run")],
    ["old result timestamp", (r) => (r.started = "2000-01-01T00:00:00Z")],
    ["missing comparison image record", (r) => r.rows[0].images.pop()],
    [
      "font size changed after Undo",
      (r) => (r.rows[0].snapshots[2].fonts[0] = "28px"),
    ],
  ])
    check(
      name,
      () => {
        const r = clone();
        mutate(r);
        validateCapture(r, dir, identity, child);
      },
      "rejected",
    );
  // Each filesystem control starts from its own fresh copy.
  for (const kind of ["missing", "corrupt", "stale-image", "clipped-suffix"]) {
    const target = path.join(out, kind);
    fs.cpSync(dir, target, { recursive: true });
    const r = clone(),
      row = r.rows.find(
        (x) =>
          x.engine === "chromium" &&
          x.width === 375 &&
          x.theme === "dark" &&
          x.zoom === 2,
      ),
      image = row.images[0],
      file = path.join(target, image.file);
    if (kind === "missing") fs.unlinkSync(file);
    if (kind === "corrupt") fs.writeFileSync(file, "not a PNG");
    if (kind === "stale-image") fs.utimesSync(file, new Date(0), new Date(0));
    if (kind === "clipped-suffix") {
      const png = read(file).png;
      const roi = image.roi;
      for (let y = roi.y; y < Math.min(png.height, roi.y + roi.height); y++)
        for (
          let x = roi.x + Math.floor((roi.width * 2) / 3);
          x < Math.min(png.width, roi.x + roi.width);
          x++
        )
          png.data.set([0, 0, 0, 255], (y * png.width + x) * 4);
      fs.writeFileSync(file, PNG.sync.write(png));
    }
    check(
      kind,
      () => {
        if (kind !== "clipped-suffix")
          validateCapture(r, target, identity, child);
        else {
          const result = compareCapture(
            r,
            target,
            baseline,
            path.join(out, kind + "-diff"),
          );
          assert(
            result.every((x) => x.status === "PASS"),
            "synthetic missing suffix rejected by image comparator",
          );
        }
      },
      "rejected",
    );
    // Keep the failure overlay and complete base capture separately, without
    // duplicating every unaffected PNG four times in the artifact.
    fs.writeFileSync(
      path.join(target, "attempt.json"),
      JSON.stringify(
        {
          kind,
          base: "../../current",
          image: image.file,
          runId: report.runId,
          expected: "rejected",
        },
        null,
        2,
      ),
    );
    for (const name of fs.readdirSync(target))
      if (
        ![image.file, "attempt.json", "capture.json", "child.log"].includes(
          name,
        )
      )
        fs.unlinkSync(path.join(target, name));
  }
  check(
    "missing baseline",
    () =>
      compareCapture(
        report,
        dir,
        path.join(out, "absent"),
        path.join(out, "absent-diff"),
      ),
    "rejected",
  );
  return rows;
}
module.exports = { controls };
