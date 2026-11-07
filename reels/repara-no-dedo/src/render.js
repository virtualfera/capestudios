// Renderiza a cena quadro a quadro no Chromium (Playwright).
// Uso: node src/render.js <pasta_saida> [--frames 0,15,30] [--every N]
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
(async () => {
  const out = process.argv[2] || 'out/frames';
  const args = process.argv.slice(3);
  const FPS = 30, DUR = 26, N = FPS * DUR;
  let list = [...Array(N).keys()];
  const fi = args.indexOf('--frames'); if (fi >= 0) list = args[fi + 1].split(',').map(Number);
  const ei = args.indexOf('--times'); if (ei >= 0) list = args[ei + 1].split(',').map(x => Math.round(parseFloat(x) * FPS));
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') console.error('PAGE:', m.text()); });
  page.on('pageerror', e => console.error('PAGEERR:', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'scene.html'));
  await page.evaluate(() => window.ready);
  const ev = await page.evaluate(() => window.events());
  fs.writeFileSync(path.join(path.dirname(out), 'events.json'), JSON.stringify(ev, null, 0));
  const t0 = Date.now();
  for (const f of list) {
    await page.evaluate(t => window.seek(t), f / FPS);
    await page.screenshot({ path: path.join(out, String(f).padStart(4, '0') + '.png'), type: 'png' });
    if (f % 60 === 0) console.log('frame', f, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
  await browser.close();
})();
