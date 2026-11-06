// Read-only approximation of S3-1 full-suite state before Select.
// It deliberately uses ordinary user actions, not DOM/style modifications.
'use strict';
async function priorS3Actions(page) {
  await page.evaluate(() => document.fonts.ready);
  // Existing S3 browser's layout pass scrolls these six stage containers.
  for (const name of ['Button', 'Badge', 'Alert', 'Switch', 'Select', 'Tooltip']) {
    await page.locator('#' + name + ' .stage').first().scrollIntoViewIfNeeded();
  }
  const b = page.locator('#Button .stage button');
  await b.click();
  await b.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await b.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await b.scrollIntoViewIfNeeded();
  await page.locator('#Button input[type=checkbox]').first().check();
  await page.locator('#Button input[type=checkbox]').first().uncheck();
  await page.locator('#Button input[type=checkbox]').nth(1).check();
  await page.locator('#Button input[type=checkbox]').nth(1).uncheck();
  await page.locator('#Badge select').selectOption('warning');
  await page.locator('#Badge .samples').scrollIntoViewIfNeeded();
  await page.locator('#Alert select').selectOption('danger');
  const alert = page.locator('#Alert .controls button');
  await alert.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.locator('#Alert .alert-demo').scrollIntoViewIfNeeded();
  const s = page.locator('#Switch [role=switch]');
  await s.click();
  await s.focus();
  await page.keyboard.press('Space');
  await page.locator('#Switch input[type=checkbox]').first().check();
  await page.locator('#Switch input[type=checkbox]').first().uncheck();
  const state = await page.evaluate(() => ({
    scrollY: window.scrollY,
    triggerTop: document.querySelector('#official-select')?.closest('[role=button]')?.getBoundingClientRect().top,
    active: document.activeElement?.getAttribute('role') || document.activeElement?.tagName
  }));
  return state;
}
module.exports = { priorS3Actions };
