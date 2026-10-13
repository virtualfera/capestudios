// Render specific times as full-res stills: node stills.mjs <outdir> t1 t2 ...  (root = encarte-ai/)
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const [outdir, ...ts] = process.argv.slice(2);
fs.mkdirSync(outdir, { recursive: true });
const types = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.json': 'application/json' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); s.end(d); }); }).listen(8799);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('pageerror', e => console.log('pageerror:', e.message)); pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 300)); });
await pg.goto('http://localhost:8799/anim/index.html?render');
await pg.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
for (const t of ts) {
  const t0 = Date.now();
  const url = await pg.evaluate(async (t) => { await window.__seek(t); return window.__frame(); }, +t);
  fs.writeFileSync(path.join(outdir, `t${(+t).toFixed(2).padStart(5, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  console.log(t, Date.now() - t0, 'ms');
}
await b.close(); srv.close();
