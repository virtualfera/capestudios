import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
const root = path.dirname(new URL(import.meta.url).pathname);
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const W = +args.w || 720, H = +args.h || 1280;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const map = (u) => {
  if (u.startsWith('/three/')) return path.join(root, 'node_modules/three', u.slice(7));
  if (u.startsWith('/fonts/')) { const f = u.slice(7); const d = f.startsWith('eb-') ? 'eb-garamond' : 'inter'; return path.join(root, 'node_modules/@fontsource', d, 'files', f); }
  return path.join(root, 'src', u === '/' ? 'index.html' : u);
};
const server = http.createServer((req, res) => { const u = req.url.split('?')[0]; const f = map(u); fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(d); } }); });
await new Promise((r) => server.listen(0, r)); const port = server.address().port;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('console', (m) => console.log('[page]', m.text())); page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:${port}/?w=${W}&h=${H}${args.cam ? '&cam=' + args.cam : ''}`); await page.waitForFunction('window.__ready===true', null, { timeout: 120000 });
const shot = async (t) => { await page.evaluate((t) => window.renderAt(t), t); return page.screenshot({ type: 'jpeg', quality: 93 }); };
if (args.still) { // --still=12.5,40  --out=dir
  const out = args.out || 'out'; fs.mkdirSync(out, { recursive: true });
  for (const t of args.still.split(',').map(Number)) { const t0 = Date.now(); fs.writeFileSync(`${out}/still_${t}.jpg`, await shot(t)); console.log('still', t, Date.now() - t0, 'ms'); }
  if (args.events) fs.writeFileSync(`${out}/events.json`, JSON.stringify(await page.evaluate(() => window.getEvents()), null, 1));
} else {
  const fps = 30, dur = +args.dur || 90, from = +args.from || 0, to = +args.to || dur * fps;
  fs.mkdirSync(args.out || 'frames', { recursive: true });
  const ev = await page.evaluate(() => window.getEvents()); fs.writeFileSync('events.json', JSON.stringify(ev, null, 1));
  const t0 = Date.now();
  for (let f = from; f < to; f++) {
    fs.writeFileSync(`${args.out || 'frames'}/f_${String(f).padStart(5, '0')}.jpg`, await shot(f / fps));
    if (f % 30 === 0) console.log('frame', f, '/', to, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
}
await browser.close(); server.close();
