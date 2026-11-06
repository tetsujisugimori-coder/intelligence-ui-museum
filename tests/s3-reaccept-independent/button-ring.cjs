// Independent SDK Button focus-paint control; preserve the original RED JSON separately.
// Compare focused/unfocused paint before and after temporarily removing only SECTION clipping.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const repo = path.resolve(__dirname, '../..');
const root = path.join(repo, '.work/v10/dist');
const modules = path.join(repo, 'tools/stage-a-browser/node_modules');
const out = path.resolve(process.env.REVIEW_OUT || path.join(repo, '.work/s3-button-regression'));
const pw = require(path.join(modules, 'playwright'));
const { PNG } = require(path.join(modules, 'playwright-core/lib/utilsBundle.js'));
const engines = (process.env.S3_ENGINES || 'chromium,webkit').split(',');
assert(engines.length > 0 && engines.every(engine => ['chromium', 'webkit'].includes(engine)) &&
  new Set(engines).size === engines.length, 'engines must be supported and unique');
if (fs.existsSync(out)) throw Error('fresh output directory required');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
    response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    response.end(fs.readFileSync(file));
  } catch { response.writeHead(404).end(); }
});
const frames = p => p.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const delta = (a, b, offset) => Math.max(...[0, 1, 2].map(channel =>
  Math.abs(a.data[offset + channel] - b.data[offset + channel])));
async function suppressFocus(p, button) {
  const handle = await p.evaluateHandle(() => {
    const style = document.createElement('style');
    style.textContent = '#Button .stage button,#Button .stage button::after{outline:none!important;box-shadow:none!important;transition:none!important}';
    document.head.append(style);
    return style;
  });
  const applied = await button.evaluate(element => [null, '::after'].every(pseudo => {
    const style = getComputedStyle(element, pseudo);
    return (parseFloat(style.outlineWidth) === 0 || style.outlineStyle === 'none') &&
      style.boxShadow === 'none';
  }));
  assert(applied, 'focus ring suppression control must apply');
  return handle;
}
(async () => {
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const rows = [], errors = [];
  try {
    for (const engine of engines) {
      const opts = engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE ?
        { headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE } : { headless: true };
      let browser;
      try {
        browser = await pw[engine].launch(opts);
        for (const width of [320, 375, 390, 1280])
        for (const theme of ['light', 'dark'])
        for (const text of [100, 200]) {
          const id = [width, theme, text].join('-');
          const row = { id, engine, width, theme, text, browserVersion: browser.version() };
          const p = await browser.newPage({ viewport: { width, height: 1000 } });
          try {
            await p.goto('http://127.0.0.1:' + server.address().port + '/?theme=' + theme + '&text=' + text, { waitUntil: 'domcontentloaded' });
            await p.bringToFront();
            // Freeze visual transitions before the first capture as well as the
            // suppression controls; otherwise the on/off pair can compare different
            // phases of the SDK's animated pseudo elements at fractional coordinates.
            await p.evaluate(() => {
              const style = document.createElement('style');
              style.textContent = '#Button .stage button,#Button .stage button::before,#Button .stage button::after{transition:none!important;animation:none!important}';
              document.head.append(style);
            });
            const button = p.locator('#Button .stage button');
            await button.waitFor();
            await button.focus();
            await p.keyboard.press('Tab');
            await p.keyboard.press('Shift+Tab');
            // Inspect the complete halo, including the seven pixels outside the
            // control; a merely visible button can still sit flush at viewport y=0.
            await button.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
            await frames(p);
            row.geometry = await button.evaluate(element => {
              const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
              const section = element.closest('section'), sectionRect = section.getBoundingClientRect();
              return {
                active: document.activeElement === element,
                focusVisible: element.matches(':focus-visible'), button: rect.toJSON(),
                outlineWidth: parseFloat(style.outlineWidth), offset: parseFloat(style.outlineOffset),
                section: sectionRect.toJSON(), sectionClipLeft: sectionRect.left + section.clientLeft,
                overflow: getComputedStyle(section).overflow,
              };
            });
            const g = row.geometry;
            assert(g.active && g.focusVisible, 'real keyboard focus must be visible');
            assert(g.outlineWidth === 3 && g.offset === 4, 'preserve the original 3px outline and 4px offset');
            row.expected = {
              left: g.button.left - g.outlineWidth - g.offset,
              right: g.button.right + g.outlineWidth + g.offset,
            };
            const region = {
              x: Math.max(0, Math.floor(g.button.x - 15)),
              y: Math.max(0, Math.floor(g.button.y - 15)),
              width: Math.min(width, Math.ceil(g.button.right + 15)) - Math.max(0, Math.floor(g.button.x - 15)),
              height: Math.ceil(g.button.height + 30),
            };
            const images = [];
            const shot = async name => {
              const filename = engine + '-' + id + '-' + name + '.png';
              const bytes = await p.screenshot({ clip: region, animations: 'disabled', scale: 'css' });
              fs.writeFileSync(path.join(out, filename), bytes);
              images.push(PNG.sync.read(bytes));
              return filename;
            };
            row.images = [await shot('original-on')];
            let style = await suppressFocus(p, button);
            row.images.push(await shot('original-off'));
            await style.evaluate(element => element.remove());
            // Diagnostic change only: SDK code and the committed product CSS remain untouched.
            await p.locator('#Button').evaluate(element => { element.style.overflow = 'visible'; });
            row.images.push(await shot('unclipped-on'));
            style = await suppressFocus(p, button);
            row.images.push(await shot('unclipped-off'));
            await style.evaluate(element => element.remove());
            // SECTION-only controls cannot reveal clipping inherited from the stage,
            // the button, or another ancestor: both images would contain the defect.
            // Keep that original diagnostic pair, and add an independent paint reference
            // that removes clipping/masking from the actual button and its ancestor chain.
            await button.evaluate(element => {
              for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
                for (const [property, value] of [['overflow', 'visible'], ['clip-path', 'none'], ['mask', 'none']])
                  node.style.setProperty(property, value, 'important');
              }
            });
            row.images.push(await shot('all-unclipped-on'));
            style = await suppressFocus(p, button);
            row.images.push(await shot('all-unclipped-off'));
            await style.evaluate(element => element.remove());
            let originalPixels = 0, unclippedPixels = 0;
            const missing = [], missingAll = [];
            for (let y = 0; y < images[0].height; y++) {
              for (let x = 0; x < images[0].width; x++) {
                const index = (y * images[0].width + x) * 4;
                const on = delta(images[0], images[1], index) >= 24;
                const unclip = delta(images[2], images[3], index) >= 24;
                if (on) originalPixels++;
                if (unclip) unclippedPixels++;
                if (unclip && !on) missing.push({ x: x + region.x, y: y + region.y });
                if (delta(images[4], images[5], index) >= 24 && !on)
                  missingAll.push({ x: x + region.x, y: y + region.y });
              }
            }
            // An opaque overlay can survive every clipping counterfactual. Require
            // actual focus paint at all four outer cardinal points as well, using
            // geometry and the original on/off images, never the counterfactual.
            const b = g.button;
            const cardinalPoints = {
              left: [Math.ceil(b.left - 7), Math.floor((b.top + b.bottom) / 2)],
              right: [Math.floor(b.right + 6), Math.floor((b.top + b.bottom) / 2)],
              top: [Math.floor((b.left + b.right) / 2), Math.ceil(b.top - 7)],
              bottom: [Math.floor((b.left + b.right) / 2), Math.floor(b.bottom + 6)],
            };
            const cardinal = Object.fromEntries(Object.entries(cardinalPoints).map(([side, [x, y]]) => {
              const px = x - region.x, py = y - region.y;
              const inImage = px >= 0 && py >= 0 && px < images[0].width && py < images[0].height;
              const contrast = inImage ? delta(images[0], images[1], (py * images[0].width + px) * 4) : 0;
              return [side, { x, y, contrast, painted: inImage && contrast >= 24 }];
            }));
            row.paint = {
              originalPixels, unclippedPixels, missingPixels: missing.length,
              missingColumns: [...new Set(missing.map(pixel => pixel.x))],
              missingAllClipPixels: missingAll.length,
              missingAllClipColumns: [...new Set(missingAll.map(pixel => pixel.x))],
              cardinal,
            };
            row.status = originalPixels > 100 && unclippedPixels > 100 &&
              missing.length === 0 && missingAll.length === 0 &&
              Object.values(cardinal).every(point => point.painted) ? 'PASS' : 'FAIL';
          } catch (error) {
            row.status = 'UNKNOWN';
            row.error = String(error);
          } finally {
            rows.push(row);
            await p.close();
          }
        }
      } catch (error) {
        errors.push({ engine, error: String(error) });
      } finally {
        if (browser) await browser.close();
      }
    }
  } finally {
    server.close();
    const status = errors.length === 0 && rows.length === engines.length * 16 &&
      rows.every(row => row.status === 'PASS') ? 'PASS' : 'FAIL';
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({
      status, engines, rows, errors, testedAt: new Date().toISOString(),
      formalMatrix: engines.length === 2 && rows.length === 32,
      scope: 'original/SECTION-unclipped/all-ancestor-unclipped on-off PNG pixel contrast; selected engines x 4 widths x 2 themes x 2 root scales',
    }, null, 2));
    console.log(JSON.stringify({
      status, total: rows.length, pass: rows.filter(row => row.status === 'PASS').length,
      failed: rows.filter(row => row.status !== 'PASS').map(row => ({
        engine: row.engine, id: row.id, missing: row.paint?.missingPixels, error: row.error,
      })), errors,
    }));
    process.exitCode = status === 'PASS' ? 0 : 1;
  }
})();
