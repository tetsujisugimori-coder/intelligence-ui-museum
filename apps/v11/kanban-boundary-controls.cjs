"use strict";
// Synthetic raster controls, not browser defect reproductions or OCR.
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const { PNG } = require("./node_modules/playwright-core/lib/utilsBundle.js");
const { read, sha, policy, compare } = require("./kanban-image.cjs");
const { compareCapture, validateCapture, validateComparisons } = require("./kanban-contract.cjs");

function layout(png) {
  const rgba = (x, y) => [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4)];
  const background = rgba(5, 5), pixels = [];
  // Diagnostic mask ONLY: the gap before the arrow and the chrome-free interior
  // were inspected in all 48 approved rasters. This window never limits the
  // production comparison, which covers the entire approved select image.
  const window = { x: 8, y: 8, right: png.width - 23, bottom: png.height - 9 };
  for (let y = window.y; y <= window.bottom; y++)
    for (let x = window.x; x <= window.right; x++)
      if (rgba(x, y).some((v, c) => v !== background[c])) pixels.push({ x, y });
  assert(pixels.length > 0, "no reference glyph ink");
  const bounds = { left: Math.min(...pixels.map(p => p.x)), right: Math.max(...pixels.map(p => p.x)),
    top: Math.min(...pixels.map(p => p.y)), bottom: Math.max(...pixels.map(p => p.y)) };
  assert(bounds.left > window.x && bounds.right < window.right && bounds.top > window.y && bounds.bottom < window.bottom,
    "reference ink touches diagnostic window; re-review mask");
  return { background, window, bounds, pixels };
}

function erase(source, target, region, background) {
  const p = read(source).png;
  let changedPixels = 0, changedChannels = 0;
  for (let y = region.y; y < region.y + region.height; y++)
    for (let x = region.x; x < region.x + region.width; x++) {
      assert(x >= 0 && x < p.width && y >= 0 && y < p.height);
      const offset = (y * p.width + x) * 4;
      if (background.some((v, c) => Math.abs(v - p.data[offset + c]) > policy.channelTolerance)) changedPixels++;
      if (background.some((v, c) => v !== p.data[offset + c])) changedChannels++;
      p.data.set(background, offset);
    }
  fs.writeFileSync(target, PNG.sync.write(p));
  return { region, background, changedPixels, changedPixelsAnyChannel: changedChannels, sha256: sha(fs.readFileSync(target)) };
}

function regions(bounds) {
  // Three pixels deep from each true raster edge; >2 materially changed glyph
  // pixels is required per control, so painting empty background cannot pass.
  return {
    suffix: { x: bounds.right - 2, y: bounds.top, width: 3, height: bounds.bottom - bounds.top + 1 },
    prefix: { x: bounds.left, y: bounds.top, width: 3, height: bounds.bottom - bounds.top + 1 },
    top: { x: bounds.left, y: bounds.top, width: bounds.right - bounds.left + 1, height: 3 },
    bottom: { x: bounds.left, y: bounds.bottom - 2, width: bounds.right - bounds.left + 1, height: 3 },
  };
}

function overlay(png, bounds, legacyRoi, file) {
  const pad = 4, out = new PNG({ width: png.width + pad * 2, height: png.height + pad * 2 });
  out.data.fill(255);
  for (let y = 0; y < png.height; y++) png.data.copy(out.data, ((y + pad) * out.width + pad) * 4, y * png.width * 4, (y + 1) * png.width * 4);
  function box(x, y, right, bottom, color) {
    function dot(a, b) { out.data.set(color, ((b + pad) * out.width + a + pad) * 4); }
    for (let a = x; a <= right; a++) { dot(a, y); dot(a, bottom); }
    for (let b = y; b <= bottom; b++) { dot(x, b); dot(right, b); }
  }
  box(-1, -1, png.width, png.height, [0, 150, 0, 255]);
  // Outside the detected glyph box, never over its edge pixels.
  box(bounds.left - 1, bounds.top - 1, bounds.right + 1, bounds.bottom + 1, [255, 0, 0, 255]);
  fs.writeFileSync(file, PNG.sync.write(out));
  // Old ROI coordinates are recorded alongside, not drawn over glyphs.
  return { padding: pad, fullRegion: { x: 0, y: 0, width: png.width, height: png.height }, glyphBounds: bounds, legacyRoi };
}

function boundaryControls(report, dir, identity, child, baseline, out) {
  assert(!fs.existsSync(out), "boundary evidence directory must be new");
  fs.mkdirSync(out, { recursive: true });
  const base = JSON.parse(fs.readFileSync(path.join(baseline, "manifest.json")));
  const normal = compareCapture(report, dir, baseline, path.join(out, "normal-diff"));
  validateComparisons(normal);
  assert(normal.every(r => r.status === "PASS"), "normal 48 must pass before controls");
  const controls = [], audits = [];
  for (const b of base.images) {
    const reference = path.join(baseline, b.file), p = read(reference).png, l = layout(p);
    const audit = { file: b.file, sha256: b.sha256, ...overlay(p, l.bounds, b.roi, path.join(out, "overlay-" + b.file)),
      maskWindow: l.window, background: l.background, allChannelInkPixels: l.pixels.length };
    audits.push(audit);
    for (const [edge, region] of Object.entries(regions(l.bounds))) {
      const sub = path.join(out, edge); fs.mkdirSync(sub, { recursive: true });
      const actual = path.join(sub, b.file), mutation = erase(path.join(dir, b.file), actual, region, l.background);
      assert(mutation.changedPixels > policy.maxDifferentPixels, `${b.file}/${edge}: no meaningful glyph erasure`);
      const result = compare(actual, reference, audit.fullRegion, path.join(sub, "diff-" + b.file));
      assert.equal(result.dimensionMismatch, false);
      assert.equal(result.status, "FAIL", `${b.file}/${edge}: glyph erasure escaped image comparison`);
      assert.equal(result.differentPixels, mutation.changedPixels, "erased reference glyph pixels must explain difference");
      controls.push({ file: b.file, edge, ...mutation, ...result });
    }
  }
  // A complete capture copy with matching mutated SHA256 must reach the image
  // oracle. Preserve identity/conditions/operations, not checksum-only rejection.
  const mutatedDir = path.join(out, "suffix-capture");
  fs.cpSync(dir, mutatedDir, { recursive: true });
  const mutated = JSON.parse(JSON.stringify(report));
  for (const r of mutated.rows) for (const i of r.images) {
    fs.copyFileSync(path.join(out, "suffix", i.file), path.join(mutatedDir, i.file));
    i.sha256 = sha(fs.readFileSync(path.join(mutatedDir, i.file)));
  }
  fs.writeFileSync(path.join(mutatedDir, "capture.json"), JSON.stringify(mutated, null, 2));
  validateCapture(mutated, mutatedDir, identity, child);
  const suffixResults = compareCapture(mutated, mutatedDir, baseline, path.join(out, "suffix-capture-diff"));
  validateComparisons(suffixResults);
  assert(suffixResults.every(r => r.status === "FAIL" && r.differentPixels > 2 && !r.dimensionMismatch));
  const result = { status: "PASS", normalAccepted: normal.length, suffixRejected: suffixResults.length,
    edgeControls: controls.length, captureValidation: "PASS with updated hashes",
    comparisonValidation: "PASS (complete FAIL verdicts); acceptance rejects all 48", audits, controls, normal, suffixResults };
  fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(result, null, 2));
  return { normalAccepted: 48, suffixRejected: 48, edgeControls: controls.length };
}

// Explicit workflow fault: the four review regions on fresh captures, preserving
// dimensions and updating checksums. The normal runner must exit nonzero.
function injectReviewErasure(report, dir, out, baseline = path.join(__dirname, "kanban-baselines")) {
  const mutations = [];
  const historical = JSON.parse(fs.readFileSync(path.join(baseline, "manifest.json")));
  for (const r of report.rows.filter(r => r.width === 375 && r.theme === "dark" && r.zoom === 2))
    for (const i of r.images) {
      const file = path.join(dir, i.file), p = read(file).png;
      const roi = historical.images.find(b => b.file === i.file).roi;
      const mutation = erase(file, file, { x: 106, y: roi.y, width: 6, height: roi.height }, layout(p).background);
      i.sha256 = mutation.sha256;
      mutations.push({ file: i.file, ...mutation });
    }
  assert.equal(mutations.length, 4);
  assert(mutations.every(m => m.changedPixels > 2));
  fs.writeFileSync(path.join(dir, "capture.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(out, JSON.stringify({ kind: "synthetic review erasure; NOT a product change", mutations }, null, 2));
}
module.exports = { boundaryControls, layout, regions, erase, injectReviewErasure };
