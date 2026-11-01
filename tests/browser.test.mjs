import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { before, after } from 'node:test';
import { chromium } from 'playwright';
import { root, themes, cssRgb } from './helpers.mjs';

const fixture = await readFile(new URL('tests/fixtures/immich-tokens.html', root), 'utf8');
let browser;
before(async () => {
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
});
after(async () => { await browser?.close(); });

async function snapshot(page) {
  return page.evaluate(() => {
    const ids = ['bodyText', 'muted', 'primary', 'panel', 'button', 'label', 'field', 'invalidField', 'legacy', 'warning', 'danger', 'tooltip', 'photo', 'hiddenPhoto', 'video', 'dialog'];
    const properties = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'outlineStyle', 'outlineWidth', 'filter', 'opacity', 'mixBlendMode', 'transform', 'objectFit', 'display', 'position', 'overflow'];
    return Object.fromEntries(['html', 'body', ...ids.map((id) => `#${id}`)].map((selector) => {
      const element = document.querySelector(selector);
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return [selector, { ...Object.fromEntries(properties.map((property) => [property, style[property]])), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }];
    }));
  });
}

async function photoScreenshot(page) {
  const bounds = await page.locator('#photo').boundingBox();
  // Exclude fractional edge pixels, which can include the surrounding canvas.
  return page.screenshot({ clip: { x: Math.ceil(bounds.x) + 1, y: Math.ceil(bounds.y) + 1, width: Math.floor(bounds.width) - 2, height: Math.floor(bounds.height) - 2 } });
}

for (const theme of themes) {
  test(`${theme.name}: light appearance remains unchanged`, async () => {
    const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
    try {
      await page.setContent(fixture);
      await page.locator('#photo').evaluate((image) => image.decode());
      const before = await snapshot(page);
      await page.addStyleTag({ content: theme.css });
      assert.deepEqual(await snapshot(page), before);
    } finally { await page.close(); }
  });

  test(`${theme.name}: native and legacy consumers, fields, dialogs, focus and media work in dark appearance`, async () => {
    const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
    try {
      await page.setContent(fixture);
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.querySelector('#dialog').hidden = false;
      });
      await page.locator('#photo').evaluate((image) => image.decode());
      const baseline = await snapshot(page);
      const photoPixels = await photoScreenshot(page);
      await page.addStyleTag({ content: theme.css });
      const actual = await snapshot(page);
      const token = (name) => cssRgb(theme.tokens.get(name));
      assert.equal(actual.body.backgroundColor, token('--immich-ui-light'));
      assert.equal(actual.body.color, token('--immich-ui-dark'));
      assert.equal(actual['#panel'].backgroundColor, token('--immich-ui-gray'));
      assert.equal(actual['#muted'].color, token('--immich-ui-muted'));
      assert.equal(actual['#primary'].color, token('--immich-ui-primary-500'));
      assert.equal(actual['#button'].backgroundColor, token('--immich-ui-primary-500'));
      assert.equal(actual['#button'].color, token('--immich-ui-light'));
      assert.equal(actual['#field'].backgroundColor, token('--color-gray-800'));
      assert.equal(actual['#label'].color, token('--color-gray-300'));
      assert.equal(actual['#legacy'].color, token('--immich-ui-dark'));
      assert.equal(actual['#legacy'].backgroundColor, token('--immich-ui-gray'));
      assert.equal(actual['#dialog'].backgroundColor, token('--immich-ui-gray'));
      assert.equal(actual['#tooltip'].color, token('--immich-ui-light'));
      assert.equal(actual['#tooltip'].backgroundColor, token('--immich-ui-light-800'));
      for (const id of ['#warning', '#danger']) assert.equal(actual[id].backgroundColor, baseline[id].backgroundColor);
      assert.equal(actual['#invalidField'].outlineColor, baseline['#invalidField'].outlineColor, 'native validation state must remain visible');
      for (const selector of Object.keys(baseline)) assert.deepEqual(actual[selector].rect, baseline[selector].rect, `${selector} layout changed`);
      for (const id of ['#photo', '#hiddenPhoto', '#video']) {
        for (const property of ['filter', 'opacity', 'mixBlendMode', 'transform', 'objectFit']) {
          assert.equal(actual[id][property], baseline[id][property], `${id} ${property} changed`);
        }
      }
      assert.ok((await photoScreenshot(page)).equals(photoPixels), 'photo pixels must not be recolored');
      await page.keyboard.press('Tab');
      await page.locator('#button').focus();
      const focus = await page.locator('#button').evaluate((element) => {
        const style = getComputedStyle(element);
        return { visible: element.matches(':focus-visible'), color: style.outlineColor, width: style.outlineWidth, style: style.outlineStyle };
      });
      assert.deepEqual(focus, { visible: true, color: token('--immich-ui-primary-500'), width: '2px', style: 'solid' });
      const selection = await page.locator('#bodyText').evaluate((element) => {
        const style = getComputedStyle(element, '::selection');
        return { color: style.color, background: style.backgroundColor };
      });
      assert.deepEqual(selection, { color: token('--immich-ui-light'), background: token('--immich-ui-primary-500') });
      await page.evaluate(() => document.body.classList.add('asset-viewer-open'));
      assert.equal(await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor), 'rgb(0, 0, 0)', 'fullscreen viewer must keep its black backdrop');
    } finally { await page.close(); }
  });
}
