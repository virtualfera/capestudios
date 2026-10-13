// Canvas-drawn textures: generic flyers (no real store names), price tags, chat bubbles,
// store fronts, map pins, ground grid and the phone screen states built from the real app crops.
import { PRNG, C } from './util.js';

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export { rr };

function paper(ctx, w, h, base, seed) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  const r = PRNG(seed);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(80,60,30,${0.015 + r() * 0.03})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}

function burst(ctx, x, y, r, n, fill) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 ? r * 0.78 : r;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function product(ctx, kind, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  switch (kind) {
    case 'banana':
      ctx.strokeStyle = '#E8B511'; ctx.lineWidth = 16; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, -30 + i * 8, 46, 0.25 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
      ctx.strokeStyle = '#6B4B12'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(30, 6); ctx.lineTo(40, -6); ctx.stroke();
      break;
    case 'apple':
      ctx.fillStyle = '#D9302B'; ctx.beginPath(); ctx.arc(-10, 4, 30, 0, 7); ctx.arc(14, 4, 30, 0, 7); ctx.fill();
      ctx.fillStyle = '#3CAD4C'; ctx.beginPath(); ctx.ellipse(8, -32, 14, 6, -0.5, 0, 7); ctx.fill();
      break;
    case 'bottle':
      ctx.fillStyle = '#2F8A3B'; rr(ctx, -18, -20, 36, 64, 8); ctx.fill(); ctx.fillRect(-7, -44, 14, 26);
      ctx.fillStyle = '#F4EBD8'; ctx.fillRect(-18, 2, 36, 20);
      break;
    case 'cheese':
      ctx.fillStyle = '#F2C84B'; ctx.beginPath(); ctx.moveTo(-40, 24); ctx.lineTo(40, 24); ctx.lineTo(30, -24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#D9A92E'; [[0, 8, 6], [18, 0, 5], [-16, 14, 4]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(a, b, r, 0, 7); ctx.fill(); });
      break;
    case 'milk':
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-22, -30, 44, 64);
      ctx.fillStyle = '#2D6CDF'; ctx.fillRect(-22, 4, 44, 30);
      ctx.beginPath(); ctx.moveTo(-22, -30); ctx.lineTo(0, -46); ctx.lineTo(22, -30); ctx.fillStyle = '#E8E8E8'; ctx.fill();
      break;
    default: // bread
      ctx.fillStyle = '#C98B3E'; ctx.beginPath(); ctx.ellipse(0, 0, 44, 26, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#8A5A20'; ctx.lineWidth = 4;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 16 - 6, -16); ctx.lineTo(i * 16 + 6, 12); ctx.stroke(); }
  }
  ctx.restore();
}

const FLYERS = [
  { hdr: '#D62718', title: 'OFERTAS', sub: 'DA SEMANA', txt: '#FFE14D' },
  { hdr: '#1F5FBF', title: 'SUPER OFERTA', sub: 'SÓ ESTA SEMANA', txt: '#FFE14D' },
  { hdr: '#E8A10C', title: 'PROMOÇÃO', sub: 'APROVEITE', txt: '#FFFFFF' },
  { hdr: '#1E7A34', title: 'HORTIFRUTI', sub: 'FRESQUINHO', txt: '#FFF3A0' },
];
const KINDS = ['banana', 'apple', 'bottle', 'cheese', 'milk', 'bread'];

export function flyer(i) {
  const f = FLYERS[i % FLYERS.length];
  const w = 512, h = 724, c = canvas(w, h), ctx = c.getContext('2d');
  const r = PRNG(100 + i);
  paper(ctx, w, h, '#FBF7EC', 7 + i);
  ctx.fillStyle = f.hdr; ctx.fillRect(0, 0, w, 150);
  ctx.textAlign = 'center';
  ctx.font = `900 ${f.title.length > 9 ? 58 : 76}px Nunito`;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillText(f.title, w / 2 + 3, 92 + 4);
  ctx.fillStyle = f.txt; ctx.fillText(f.title, w / 2, 92);
  ctx.font = '800 26px Nunito'; ctx.fillStyle = '#FFFFFF'; ctx.fillText(f.sub, w / 2, 132);
  for (let k = 0; k < 6; k++) {
    const cx = 128 + (k % 2) * 256, cy = 250 + Math.floor(k / 2) * 165;
    ctx.fillStyle = '#FFFFFF'; rr(ctx, cx - 112, cy - 70, 224, 150, 14); ctx.fill();
    product(ctx, KINDS[(k + i) % 6], cx - 40, cy + 4, 0.95);
    burst(ctx, cx + 56, cy - 4, 52, 12, '#FFD400');
    const price = `${1 + Math.floor(r() * 18)},${['99', '49', '90', '79'][Math.floor(r() * 4)]}`;
    ctx.fillStyle = '#C8102E'; ctx.font = '900 18px Nunito'; ctx.fillText('R$', cx + 56, cy - 18);
    ctx.font = '900 30px Nunito'; ctx.fillText(price, cx + 56, cy + 12);
  }
  ctx.fillStyle = f.hdr; ctx.fillRect(0, h - 56, w, 56);
  ctx.font = '700 20px Inter'; ctx.fillStyle = '#FFFFFF'; ctx.fillText('OFERTAS VÁLIDAS ATÉ DOMINGO', w / 2, h - 21);
  return c;
}

// Price tag (paper or green). Main text drawn by caller via drawTagFace so it can update per frame.
export function tagShape(ctx, w, h, fill, edge) {
  ctx.beginPath();
  const cut = w * 0.22;
  ctx.moveTo(cut, 60); ctx.lineTo(w - cut, 60); ctx.lineTo(w - 8, 60 + cut); ctx.lineTo(w - 8, h - 22);
  ctx.arcTo(w - 8, h - 8, w - 22, h - 8, 18); ctx.lineTo(22, h - 8); ctx.arcTo(8, h - 8, 8, h - 22, 18);
  ctx.lineTo(8, 60 + cut); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = edge; ctx.stroke();
  // hole
  ctx.save(); ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(w / 2, 60 + cut * 0.55, 20, 0, 7); ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.arc(w / 2, 60 + cut * 0.55, 20, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = edge; ctx.stroke();
  // string
  ctx.strokeStyle = '#D9CBA8'; ctx.lineWidth = 5; ctx.beginPath();
  ctx.moveTo(w / 2, 60 + cut * 0.55 - 20); ctx.quadraticCurveTo(w / 2 + 30, 30, w / 2 + 10, 0); ctx.stroke();
}

export function drawTag(c, { label = '', main = 'R$ ?', green = false, dim = 0, sub2 = '' }) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);
  tagShape(ctx, w, h, green ? '#2E9A40' : '#F4EBD8', green ? '#1F6E2C' : '#CDBE98');
  ctx.textAlign = 'center';
  const ink = green ? '#FFFFFF' : '#1A2A20';
  if (label) { ctx.font = '700 34px Inter'; ctx.fillStyle = green ? 'rgba(255,255,255,0.9)' : '#5B6B60'; ctx.fillText(label, w / 2, h * 0.47); }
  const lines = main.split('\n');
  let size = 120;
  ctx.font = `900 ${size}px Nunito`;
  const widest = Math.max(...lines.map((ln) => ctx.measureText(ln).width));
  if (widest > w * 0.84) size = Math.floor(size * w * 0.84 / widest);
  ctx.font = `900 ${size}px Nunito`; ctx.fillStyle = ink;
  lines.forEach((ln, i) => ctx.fillText(ln, w / 2, h * 0.68 + (i - (lines.length - 1) / 2) * size * 1.0));
  if (sub2) { ctx.font = '700 30px Inter'; ctx.fillStyle = green ? '#FFFFFF' : '#5B6B60'; ctx.fillText(sub2, w / 2, h * 0.88); }
  if (dim) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = `rgba(0,0,0,${dim})`; ctx.fillRect(0, 0, w, h); ctx.restore(); }
}

export function bubble(caption, flyerCanvas, side, time) {
  const w = 680, h = 470, c = canvas(w, h), ctx = c.getContext('2d');
  ctx.fillStyle = side ? '#2F8A3B' : '#1C3A27';
  rr(ctx, 20, 10, w - 40, h - 60, 40); ctx.fill();
  ctx.beginPath();
  if (side) { ctx.moveTo(w - 90, h - 52); ctx.lineTo(w - 22, h - 4); ctx.lineTo(w - 150, h - 52); }
  else { ctx.moveTo(90, h - 52); ctx.lineTo(22, h - 4); ctx.lineTo(150, h - 52); }
  ctx.fill();
  ctx.save(); rr(ctx, 46, 36, 250, 354, 18); ctx.clip();
  ctx.drawImage(flyerCanvas, 46, 36, 250, 354); ctx.restore();
  ctx.fillStyle = '#FFFFFF'; ctx.font = '800 46px Nunito'; ctx.textAlign = 'left';
  caption.split('\n').forEach((ln, i) => ctx.fillText(ln, 322, 120 + i * 58));
  ctx.font = '600 28px Inter'; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillText(time, 322, 372);
  return c;
}

export function store(i) {
  const w = 460, h = 420, c = canvas(w, h), ctx = c.getContext('2d');
  const awn = ['#D62718', '#1F5FBF', '#E8A10C'][i % 3];
  ctx.fillStyle = '#EDE6D6'; rr(ctx, 10, 60, w - 20, h - 70, 16); ctx.fill();
  for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#FFFFFF' : awn; ctx.beginPath(); ctx.moveTo(10 + k * 55, 120); ctx.lineTo(10 + (k + 1) * 55, 120); ctx.lineTo(10 + (k + 1) * 55, 170); ctx.arc(10 + k * 55 + 27.5, 170, 27.5, 0, Math.PI); ctx.fill(); }
  ctx.fillStyle = awn; rr(ctx, 30, 10, w - 60, 100, 14); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.font = '900 54px Nunito'; ctx.textAlign = 'center'; ctx.fillText(`MERCADO ${i + 1}`, w / 2, 80);
  ctx.fillStyle = '#26352C'; ctx.fillRect(170, 240, 120, 170);
  ctx.fillStyle = '#9BC7D8'; ctx.fillRect(40, 240, 100, 90); ctx.fillRect(320, 240, 100, 90);
  burst(ctx, 90, 370, 36, 10, '#FFD400'); burst(ctx, 370, 370, 36, 10, '#FFD400');
  return c;
}

export function pin(label) {
  const w = 300, h = 470, c = canvas(w, h), ctx = c.getContext('2d');
  ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(w / 2, 110, 100, Math.PI * 0.85, Math.PI * 2.15);
  ctx.lineTo(w / 2, 300); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(w / 2, 110, 42, 0, 7); ctx.fill();
  ctx.fillStyle = '#0B1A12'; rr(ctx, 30, 330, w - 60, 90, 45); ctx.fill();
  ctx.strokeStyle = 'rgba(60,173,76,0.8)'; ctx.lineWidth = 4; rr(ctx, 30, 330, w - 60, 90, 45); ctx.stroke();
  ctx.fillStyle = '#FFFFFF'; ctx.font = '700 46px Inter'; ctx.textAlign = 'center'; ctx.fillText(label, w / 2, 392);
  return c;
}

export function ground() {
  const s = 2048, c = canvas(s, s), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(20,60,34,0.9)'); g.addColorStop(1, 'rgba(5,12,8,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(110,224,122,0.22)';
  for (let r = 120; r < s / 2; r += 120) { ctx.lineWidth = r % 480 === 0 ? 4 : 2; ctx.beginPath(); ctx.arc(s / 2, s / 2, r, 0, 7); ctx.stroke(); }
  ctx.lineWidth = 2;
  for (let a = 0; a < 24; a++) { const t = (a / 24) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(s / 2 + Math.cos(t) * 120, s / 2 + Math.sin(t) * 120); ctx.lineTo(s / 2 + Math.cos(t) * s / 2, s / 2 + Math.sin(t) * s / 2); ctx.stroke(); }
  return c;
}

export function ring() {
  const s = 512, c = canvas(s, s), ctx = c.getContext('2d');
  ctx.strokeStyle = '#6EE07A'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2 - 20, 0, 7); ctx.stroke();
  return c;
}

export function youDot() {
  const s = 360, c = canvas(s, s), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(110,224,122,0.9)'); g.addColorStop(0.25, 'rgba(60,173,76,0.6)'); g.addColorStop(1, 'rgba(60,173,76,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(s / 2, s / 2, 34, 0, 7); ctx.fill();
  ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(s / 2, s / 2, 22, 0, 7); ctx.fill();
  return c;
}

export function label(text, { size = 44, bg = '#0B1A12', fg = '#FFFFFF', border = 'rgba(60,173,76,0.9)', font = '800', fam = 'Nunito' } = {}) {
  const tmp = canvas(10, 10).getContext('2d');
  tmp.font = `${font} ${size}px ${fam}`;
  const tw = tmp.measureText(text).width;
  const w = Math.ceil(tw + size * 1.4), h = Math.ceil(size * 1.9), c = canvas(w, h), ctx = c.getContext('2d');
  ctx.fillStyle = bg; rr(ctx, 3, 3, w - 6, h - 6, h / 2 - 3); ctx.fill();
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = 4; rr(ctx, 3, 3, w - 6, h - 6, h / 2 - 3); ctx.stroke(); }
  ctx.fillStyle = fg; ctx.font = `${font} ${size}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + size * 0.04);
  return c;
}

// ---------------------------------------------------------------- phone screen
// state: {mode:'city'|'home'|'search', mix:0..1 (city->home), tap:{x,y,p}, typed:'ban', caret:bool,
//         results:0..1, sweep:-1..2, dim:0..1}
export function drawScreen(c, img, s) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);
  if (s.mix < 1) ctx.drawImage(img.city, 0, 0, w, h);
  if (s.mix > 0) {
    ctx.save(); ctx.globalAlpha = s.mix;
    ctx.drawImage(img.home, 0, (1 - s.mix) * 60, w, h);
    ctx.restore();
  }
  if (s.search > 0) {
    const a = Math.min(1, s.search);
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(255,255,255,${0.9 * a})`; ctx.fillRect(0, 150, w, h - 300);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#F2F3F2'; rr(ctx, 40, 170 - (1 - a) * 40, w - 80, 96, 48); ctx.fill();
    ctx.strokeStyle = '#3A7D44'; ctx.lineWidth = 4; rr(ctx, 40, 170 - (1 - a) * 40, w - 80, 96, 48); ctx.stroke();
    ctx.strokeStyle = '#3A7D44'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(104, 214 - (1 - a) * 40, 20, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(118, 228 - (1 - a) * 40); ctx.lineTo(132, 242 - (1 - a) * 40); ctx.stroke();
    ctx.fillStyle = '#1A1A1A'; ctx.font = '600 46px Inter'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(s.typed, 150, 218 - (1 - a) * 40);
    if (s.caret) { const tw = ctx.measureText(s.typed).width; ctx.fillStyle = '#3A7D44'; ctx.fillRect(154 + tw, 190 - (1 - a) * 40, 4, 56); }
    // results skeleton rows
    for (let i = 0; i < 3; i++) {
      const p = Math.min(1, Math.max(0, s.results * 3 - i));
      if (p <= 0) continue;
      const y = 330 + i * 170 + (1 - p) * 40;
      ctx.globalAlpha = a * p;
      ctx.fillStyle = '#FFFFFF'; rr(ctx, 40, y, w - 80, 140, 24); ctx.fill();
      ctx.strokeStyle = i === 1 && s.best ? '#3CAD4C' : '#E6E6E6'; ctx.lineWidth = i === 1 && s.best ? 6 : 3; rr(ctx, 40, y, w - 80, 140, 24); ctx.stroke();
      ctx.fillStyle = '#F6F0E0'; rr(ctx, 64, y + 22, 96, 96, 18); ctx.fill();
      product(ctx, 'banana', 112, y + 74, 0.7);
      ctx.fillStyle = '#2D2D2D'; ctx.font = '700 36px Inter'; ctx.fillText('Banana prata kg', 186, y + 52);
      ctx.fillStyle = '#999999'; ctx.font = '600 30px Inter'; ctx.fillText(`Mercado ${'ABC'[i]}`, 186, y + 100);
      if (i === 1 && s.best) {
        ctx.fillStyle = '#3CAD4C'; rr(ctx, w - 290, y + 40, 230, 60, 30); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.font = '800 28px Inter'; ctx.textAlign = 'center'; ctx.fillText('MAIS BARATO', w - 175, y + 71); ctx.textAlign = 'left';
      }
    }
    ctx.restore();
  }
  if (s.tap && s.tap.p > 0 && s.tap.p < 1) {
    const p = s.tap.p;
    ctx.save(); ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(58,125,68,${0.35 * (1 - p)})`;
    ctx.beginPath(); ctx.arc(s.tap.x, s.tap.y, 20 + p * 120, 0, 7); ctx.fill(); ctx.restore();
  }
  if (s.sweep > -0.5 && s.sweep < 1.5) {
    ctx.save(); ctx.globalCompositeOperation = 'source-atop';
    const x = s.sweep * (w + h) - h;
    const g = ctx.createLinearGradient(x, 0, x + h * 0.5, h * 0.5);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
  }
  if (s.dim > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = `rgba(0,0,0,${s.dim})`; ctx.fillRect(0, 0, w, h); ctx.restore();
  }
}
