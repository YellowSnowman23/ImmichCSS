/** Reproduce all illustrative screenshots with a local-only browser session. */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const themes = JSON.parse(await readFile(resolve(root, 'src/palettes.json'), 'utf8'));
const output = resolve(root, 'docs/images');
await mkdir(output, { recursive: true });
const contentTypes = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server = createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const path = resolve(root, `.${pathname}`);
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) { response.writeHead(403).end(); return; }
    const data = await readFile(path);
    response.writeHead(200, { 'Content-Type': contentTypes[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(data);
  } catch { response.writeHead(404).end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
  const context = await browser.newContext({ deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce' });
  await context.route('**/*', route => route.request().url().startsWith(base + '/') ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const theme of themes) {
    for (const [size, viewport] of [['desktop',{width:1440,height:1000}], ['mobile',{width:390,height:844}]]) {
      await page.setViewportSize(viewport);
      await page.goto(`${base}/preview/?theme=${theme.slug}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('html[data-ready="true"]');
      await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
      const state = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, canvas: getComputedStyle(document.documentElement).getPropertyValue('--immich-ui-light').trim(), overflow: document.documentElement.scrollWidth > innerWidth }));
      if (state.theme !== theme.slug || state.canvas.toLowerCase() !== theme.canvas.toLowerCase()) throw new Error(`${theme.slug}: theme CSS did not load (${JSON.stringify(state)})`);
      if (state.overflow) throw new Error(`${theme.slug}: horizontal overflow at ${size} viewport`);
      const filename = `${theme.slug}${size === 'mobile' ? '-mobile' : ''}.png`;
      await page.screenshot({ path: resolve(output, filename), fullPage: false, animations: 'disabled' });
      console.log(`Saved docs/images/${filename} (${viewport.width}×${viewport.height})`);
    }
  }
  // Validate the theme selector and downloadable file, in addition to direct URLs.
  const first = themes[0], last = themes.at(-1);
  await page.selectOption('#theme-picker', first.slug);
  await page.waitForFunction(slug => document.documentElement.dataset.theme === slug, first.slug);
  if (!(await page.locator('#download-theme').getAttribute('href')).endsWith(`${first.slug}.css`)) throw new Error('Download link does not track the selected theme');
  await page.selectOption('#theme-picker', last.slug);
  await page.setViewportSize({width:1600,height:1000});
  await page.goto(`${base}/preview/overview.html`, {waitUntil:'networkidle'});
  await page.waitForSelector('html[data-ready="true"]');
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
  await page.screenshot({path:resolve(output,'overview.png'),fullPage:true,animations:'disabled'});
  console.log('Saved docs/images/overview.png');
  if (errors.length) throw new Error(`Preview JavaScript errors: ${errors.join('; ')}`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
