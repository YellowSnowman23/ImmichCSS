import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.IMMICH_PREVIEW_PORT || 4173);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (request, response) => {
  try {
    let path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (path === '/') { response.writeHead(302, { Location: '/preview/' }).end(); return; }
    if (path.endsWith('/')) path += 'index.html';
    const allowed = /^\/(?:preview|themes|docs\/images)\//.test(path) || path === '/src/palettes.json';
    const file = resolve(root, `.${path}`);
    if (!allowed || !file.startsWith(root.endsWith(sep) ? root : root + sep) || !types[extname(file)] || path.includes('/.')) {
      response.writeHead(404).end('Not found'); return;
    }
    const contents = await readFile(file);
    response.writeHead(200, { 'Content-Type': `${types[extname(file)]}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(contents);
  } catch { response.writeHead(404).end('Not found'); }
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}/preview/\nPress Ctrl+C to stop.`));
