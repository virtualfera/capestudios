// Renderiza um template quadro a quadro no Chromium (Playwright).
// Uso: node motor/render.js <spec.json> <pasta_quadros> [--fps 30] [--times 0.5,3,12]
// spec.json é gerado pelo montar.py: { template, marca, dados, base_dir, transparente }
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const [specPath, out, ...args] = process.argv.slice(2);
  if (!specPath || !out) { console.error('uso: node motor/render.js <spec.json> <pasta> [--fps 30] [--times a,b]'); process.exit(1); }
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const fps = args.includes('--fps') ? +args[args.indexOf('--fps') + 1] : 30;
  const tpl = path.resolve(__dirname, 'templates', spec.template + '.html');
  fs.mkdirSync(out, { recursive: true });

  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--force-color-profile=srgb', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('ERRO NA PAGINA:', e.message); process.exitCode = 2; });
  page.on('console', m => { if (m.type() === 'error') console.error('PAGE:', m.text()); });
  await page.addInitScript(s => { window.SPEC = s; }, spec);
  await page.goto('file://' + tpl);
  await page.evaluate(() => window.prontos);
  const dur = await page.evaluate(() => window.duracao());

  let lista;
  if (args.includes('--times')) lista = args[args.indexOf('--times') + 1].split(',').map(x => Math.round(parseFloat(x) * fps));
  else lista = [...Array(Math.round(dur * fps)).keys()];

  const el = await page.$('#stage');
  const t0 = Date.now();
  for (const f of lista) {
    await page.evaluate(t => window.seek(t), f / fps);
    await el.screenshot({ path: path.join(out, String(f).padStart(5, '0') + '.png'), omitBackground: !!spec.transparente });
    if (f % (fps * 3) === 0) console.log(`  quadro ${f}/${lista.length} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  fs.writeFileSync(path.join(out, '_info.json'), JSON.stringify({ dur, fps, quadros: lista.length }));
  await browser.close();
})();
