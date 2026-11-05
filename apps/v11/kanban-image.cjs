"use strict";
// Use the PNG codec already shipped with the exact locked Playwright version.
const { PNG } = require("./node_modules/playwright-core/lib/utilsBundle.js");
const fs = require("node:fs"),
  crypto = require("node:crypto");
const sha = (data) => crypto.createHash("sha256").update(data).digest("hex");
const policy = { channelTolerance: 12, maxDifferentPixels: 2 };
function read(file) {
  const bytes = fs.readFileSync(file);
  const png = PNG.sync.read(bytes, { checkCRC: true });
  if (!png.width || !png.height) throw Error("Empty PNG");
  return { bytes, png };
}
function crop(png, roi) {
  const out = new PNG({ width: roi.width, height: roi.height });
  for (let y = 0; y < roi.height; y++)
    for (let x = 0; x < roi.width; x++) {
      const dst = (y * roi.width + x) * 4,
        sx = x + roi.x,
        sy = y + roi.y;
      if (sx < 0 || sy < 0 || sx >= png.width || sy >= png.height) {
        out.data.set([255, 0, 255, 255], dst);
      } else
        png.data.copy(
          out.data,
          dst,
          (sy * png.width + sx) * 4,
          (sy * png.width + sx) * 4 + 4,
        );
    }
  return out;
}
function compare(actualFile, baselineFile, roi, diffFile) {
  const a = read(actualFile),
    b = read(baselineFile),
    ap = crop(a.png, roi),
    bp = crop(b.png, roi),
    diff = new PNG({ width: roi.width, height: roi.height });
  let differentPixels = 0;
  for (let i = 0; i < ap.data.length; i += 4) {
    const changed = [0, 1, 2, 3].some(
      (c) =>
        Math.abs(ap.data[i + c] - bp.data[i + c]) > policy.channelTolerance,
    );
    if (changed) differentPixels++;
    diff.data.set(
      changed
        ? [255, 0, 0, 255]
        : [bp.data[i], bp.data[i + 1], bp.data[i + 2], 100],
      i,
    );
  }
  fs.writeFileSync(diffFile, PNG.sync.write(diff));
  const dimensionMismatch = a.png.width !== b.png.width || a.png.height !== b.png.height;
  const passed = !dimensionMismatch && differentPixels <= policy.maxDifferentPixels;
  return {
    status: passed ? "PASS" : "FAIL",
    reason:
      dimensionMismatch ? "select raster dimensions differ from approved baseline" : passed
        ? "label paint matches approved baseline"
        : "label paint differs (including clipped or missing glyphs)",
    differentPixels,
    dimensionMismatch,
    actualDimensions: { width: a.png.width, height: a.png.height },
    baselineDimensions: { width: b.png.width, height: b.png.height },
    policy,
    roi,
    actualSha256: sha(a.bytes),
    baselineSha256: sha(b.bytes),
    diffSha256: sha(fs.readFileSync(diffFile)),
  };
}
module.exports = { sha, read, compare, policy };
