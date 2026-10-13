// Deterministic frame renderer for anim/index.html.
// The page must expose window.__ready = true and window.__seek(t) (seconds) that renders the WebGL
// canvas + DOM for time t synchronously. Frames are written as JPEG (q=0.95) by canvas readback when
// the page exposes window.__frame() -> dataURL (fast path), otherwise via page screenshots (slow, DOM included).
// Usage: node render.mjs --root <dir served> --page index.html --out <frames dir> --fps 60 --start 0 --end 30.5 --workers 3
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const root = path.resolve(args.root || '.');
const page = args.page || 'index.html';
const out = path.resolve(args.out || 'frames');
const fps = +(args.fps || 60), t0 = +(args.start || 0), t1 = +(args.end || 1);
const workers = +(args.workers || 3), port = +(args.port || 8790);
const W = +(args.width || 1080), H = +(args.height || 1920);
const only = args.only ? args.only.split(',').map(Number) : null; // re-render specific frame indices
fs.mkdirSync(out, { recursive: true });

const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4' };
const srv = http.createServer((q, s) => {
  const p = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
}).listen(port);

const total = Math.round((t1 - t0) * fps);
const indices = only || Array.from({ length: total }, (_, i) => i);
const todo = indices.filter(i => only || !fs.existsSync(path.join(out, `f${String(i).padStart(5, '0')}.jpg`))); // resumable
console.log(`frames: ${indices.length} total, ${todo.length} to render, ${workers} workers`);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
let next = 0, done = 0; const started = Date.now();
async function worker(w) {
  const pg = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  pg.on('console', m => { if (m.type() === 'error') console.log(`[w${w}] console:`, m.text()); });
  pg.on('pageerror', e => console.log(`[w${w}] pageerror:`, e.message));
  await pg.goto(`http://localhost:${port}/${page}?render`);
  await pg.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  const fast = await pg.evaluate(() => typeof window.__frame === 'function');
  while (next < todo.length) {
    const i = todo[next++]; const t = t0 + i / fps;
    const file = path.join(out, `f${String(i).padStart(5, '0')}.jpg`);
    if (fast) {
      const url = await pg.evaluate(async (t) => { await window.__seek(t); return window.__frame(); }, t);
      fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    } else {
      await pg.evaluate(async (t) => { await window.__seek(t); }, t);
      await pg.screenshot({ path: file, type: 'jpeg', quality: 95 });
    }
    if (++done % 30 === 0) { const el = (Date.now() - started) / 1000; console.log(`${done}/${todo.length}  ${(el / done).toFixed(2)} s/frame  eta ${((todo.length - done) * el / done / 60).toFixed(1)} min`); }
  }
  await pg.close();
}
await Promise.all(Array.from({ length: workers }, (_, w) => worker(w)));
await browser.close(); srv.close();
console.log(`done in ${((Date.now() - started) / 60000).toFixed(1)} min`);
