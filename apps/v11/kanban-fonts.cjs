"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  { sha } = require("./kanban-image.cjs");
function fonts() {
  const root =
    process.platform === "win32"
      ? path.join(process.env.WINDIR, "Fonts")
      : "/usr/share/fonts";
  const files = [];
  function visit(dir) {
    for (const e of fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      const file = path.join(dir, e.name);
      if (e.isDirectory()) visit(file);
      else if (/\.(ttf|ttc|otf|woff2?)$/i.test(e.name))
        files.push({
          file: path.relative(root, file).split(path.sep).join("/"),
          sha256: sha(fs.readFileSync(file)),
        });
    }
  }
  visit(root);
  if (!files.length) throw Error("No font inventory");
  return {
    fontFiles: files,
    fontFingerprint: sha(Buffer.from(JSON.stringify(files))),
  };
}
module.exports = { fonts };
