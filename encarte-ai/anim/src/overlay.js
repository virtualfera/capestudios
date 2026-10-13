// 2D compositor layer: kinetic typography, flares, flashes, light streak/orb, end card.
import { C, E, clamp, lerp, inv, tw } from './util.js';
import { rr } from './tex.js';

const FONT_H = 'Nunito';
const MAXW = 920;

// spec: {lines:[[{w, t, accent?}]], y:[...], size, tOut, out:'whip-up'|'defocus'|'whip-left'|'cut', color?}
export function drawHeadline(ctx, spec, t) {
  if (t < spec.lines[0][0].t - 0.05 || t > spec.tOut + 0.02) return;
  const q = spec.tOut ? inv(t, spec.tOut - 0.16, spec.tOut) : 0;
  if (q >= 1) return;
  spec.lines.forEach((line, li) => {
    let size = spec.size;
    ctx.font = `900 ${size}px ${FONT_H}`;
    ctx.letterSpacing = `${-0.015 * size}px`;
    const space = ctx.measureText(' ').width * 0.9;
    let widths = line.map((wd) => ctx.measureText(wd.w).width);
    let total = widths.reduce((a, b) => a + b, 0) + space * (line.length - 1);
    if (total > MAXW) {
      size = Math.floor(size * MAXW / total);
      ctx.font = `900 ${size}px ${FONT_H}`; ctx.letterSpacing = `${-0.015 * size}px`;
      widths = line.map((wd) => ctx.measureText(wd.w).width);
      total = widths.reduce((a, b) => a + b, 0) + space * (line.length - 1);
    }
    const base = spec.y[li] + size * 0.36;
    let x = 540 - total / 2;
    line.forEach((wd, wi) => {
      const p = E.cape(inv(t, wd.t, wd.t + 0.5));
      if (p <= 0) { x += widths[wi] + space; return; }
      ctx.save();
      // mask (extra headroom for PT-BR accents)
      ctx.beginPath();
      ctx.rect(x - 30, base - size * 1.18, widths[wi] + 60, size * 1.48);
      ctx.clip();
      let dy = (1 - p) * size * 1.05, dx = 0, blur = (1 - p) * 6, alpha = clamp(p * 1.4);
      if (q > 0) {
        const e = E.inExpo(q);
        if (spec.out === 'whip-up') { dy -= e * 320; blur += q * 16; }
        else if (spec.out === 'whip-left') { dx -= e * 420; blur += q * 16; }
        else if (spec.out === 'whip-down') { dy += e * 320; blur += q * 16; }
        else { blur += q * 28; }
        alpha *= 1 - q;
      }
      if (q > 0 && spec.out !== 'defocus') { ctx.restore(); ctx.save(); } // let whips leave the mask
      ctx.globalAlpha = alpha;
      if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
      ctx.font = `900 ${size}px ${FONT_H}`; ctx.letterSpacing = `${-0.015 * size}px`;
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      const col = wd.accent === 'orange' ? C.orange : wd.accent ? C.green : (spec.color || C.ink);
      ctx.shadowColor = wd.accent ? (wd.accent === 'orange' ? 'rgba(246,166,36,0.55)' : 'rgba(60,173,76,0.6)') : 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = wd.accent ? 36 : 22;
      ctx.fillStyle = col;
      if (spec.out === 'defocus' && q > 0) {
        const s = 1 + 0.06 * q, cx = x + widths[wi] / 2;
        ctx.translate(cx, base - size * 0.36); ctx.scale(s, s); ctx.translate(-cx, -(base - size * 0.36));
      }
      ctx.fillText(wd.w, x + dx, base + dy);
      ctx.restore();
      x += widths[wi] + space;
    });
  });
  ctx.letterSpacing = '0px';
}

// light-streak reveal of a single line (used for "CALMA." etc.)
export function drawStreakText(ctx, { text, y, size, t0, tOut, color = C.ink, weight = 900 }, t) {
  if (t < t0 || t > tOut) return;
  const p = E.outCubic(inv(t, t0, t0 + 0.32));
  const q = inv(t, tOut - 0.14, tOut);
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT_H}`; ctx.letterSpacing = `${0.04 * size * (1 - p) - 0.01 * size}px`;
  const w = ctx.measureText(text).width;
  const x0 = 540 - w / 2, xr = x0 - 40 + (w + 80) * p;
  ctx.beginPath(); ctx.rect(0, y - size, xr, size * 2); ctx.clip();
  ctx.globalAlpha = 1 - q;
  if (q > 0) ctx.filter = `blur(${(q * 20).toFixed(1)}px)`;
  ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(110,224,122,0.5)'; ctx.shadowBlur = 24;
  ctx.fillText(text, x0, y + size * 0.04);
  ctx.restore();
  if (p > 0 && p < 1) streakLine(ctx, xr, y, size * 1.3, 1 - p * 0.6);
  ctx.letterSpacing = '0px';
}

function streakLine(ctx, x, y, h, a) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x - 18, 0, x + 18, 0);
  g.addColorStop(0, 'rgba(110,224,122,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(110,224,122,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 18, y - h / 2, 36, h);
  ctx.restore();
}

// 4-point sparkle flare (the brand's sparkle as the light motif)
export function flare(ctx, x, y, size, a, rot = 0) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(x, y); ctx.rotate(rot);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.9);
  g.addColorStop(0, `rgba(255,255,255,${0.9 * a})`); g.addColorStop(0.15, `rgba(170,255,180,${0.5 * a})`);
  g.addColorStop(0.5, `rgba(60,173,76,${0.18 * a})`); g.addColorStop(1, 'rgba(60,173,76,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, size * 0.9, 0, 7); ctx.fill();
  for (const [sx, sy] of [[1, 0.035], [0.035, 1]]) {
    const L = size * 2.2;
    const lg = ctx.createRadialGradient(0, 0, 0, 0, 0, L);
    lg.addColorStop(0, `rgba(255,255,255,${a})`); lg.addColorStop(0.4, `rgba(200,255,205,${0.35 * a})`); lg.addColorStop(1, 'rgba(110,224,122,0)');
    ctx.save(); ctx.scale(sx, sy); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(0, 0, L, 0, 7); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}

// white flash: 70 ms ramp, ~2 frames hold, decay through pale green
export function flash(ctx, t, tf, scale = 1) {
  const a = t < tf - 0.07 ? 0 : t < tf ? inv(t, tf - 0.07, tf) : t < tf + 0.066 ? 1 : 1 - E.outCubic(inv(t, tf + 0.066, tf + 0.066 + 0.15 * scale + 0.08));
  if (a <= 0) return;
  ctx.save();
  const k = clamp((t - tf - 0.066) / 0.12);
  ctx.fillStyle = k <= 0 ? `rgba(255,255,255,${a})` : `rgba(${Math.round(lerp(255, 227, k))},${Math.round(lerp(255, 245, k))},${Math.round(lerp(255, 213, k))},${a * (1 - 0.2 * k)})`;
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.restore();
}

export function searchPill(ctx, t, { t0, tOut, typedAt, word, doneAt }) {
  if (t < t0 || t > tOut) return;
  const p = E.cape(inv(t, t0, t0 + 0.4));
  const q = E.inExpo(inv(t, tOut - 0.15, tOut));
  const n = typedAt.filter((tt) => t >= tt).length;
  const typed = word.slice(0, n);
  const y = 330 - q * 300, h = 136, w = 780;
  ctx.save();
  ctx.globalAlpha = p * (1 - q);
  ctx.translate(540, y); ctx.scale(lerp(0.86, 1, p), lerp(0.86, 1, p)); ctx.translate(-540, -y);
  if (q > 0) ctx.filter = `blur(${(q * 14).toFixed(1)}px)`;
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
  ctx.fillStyle = 'rgba(246,248,245,0.96)'; rr(ctx, 540 - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = C.green; ctx.lineWidth = 5; rr(ctx, 540 - w / 2, y - h / 2, w, h, h / 2); ctx.stroke();
  // magnifier
  ctx.strokeStyle = '#3A7D44'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(540 - w / 2 + 82, y - 6, 24, 0, 7); ctx.stroke();
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(540 - w / 2 + 100, y + 12); ctx.lineTo(540 - w / 2 + 120, y + 32); ctx.stroke();
  ctx.fillStyle = '#16211A'; ctx.font = '700 78px Inter'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const tx = 540 - w / 2 + 150;
  ctx.fillText(typed, tx, y + 3);
  const tw_ = ctx.measureText(typed).width;
  if (t < doneAt && Math.floor(t * 3.4) % 2 === 0) { ctx.fillStyle = C.green; ctx.fillRect(tx + tw_ + 8, y - 40, 6, 80); }
  if (t >= doneAt) {
    const d = E.outBack(inv(t, doneAt, doneAt + 0.3));
    const cx = 540 + w / 2 - 80;
    ctx.save(); ctx.translate(cx, y); ctx.scale(d, d);
    ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(0, 0, 44, 0, 7); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-18, 2); ctx.lineTo(-5, 16); ctx.lineTo(20, -14); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function pill(ctx, t, { text, y, t0, tOut, size = 62, arrow = false, reveal = 'streak' }) {
  if (t < t0 || t > tOut) return;
  const q = inv(t, tOut - 0.12, tOut);
  ctx.save();
  ctx.font = `900 ${size}px ${FONT_H}`; ctx.letterSpacing = `${0.02 * size}px`;
  const tw_ = ctx.measureText(text).width + (arrow ? size * 0.9 : 0);
  const w = tw_ + size * 1.5, h = size * 1.75, x0 = 540 - w / 2;
  let p;
  if (reveal === 'streak') {
    p = E.outCubic(inv(t, t0, t0 + 0.35));
    ctx.beginPath(); ctx.rect(0, y - h, x0 - 20 + (w + 40) * p, h * 2); ctx.clip();
  } else {
    p = E.outBack(inv(t, t0, t0 + 0.4));
    ctx.translate(540, y); ctx.scale(p, p); ctx.translate(-540, -y);
  }
  ctx.globalAlpha = 1 - q;
  if (q > 0) ctx.filter = `blur(${(q * 16).toFixed(1)}px)`;
  ctx.shadowColor = 'rgba(60,173,76,0.6)'; ctx.shadowBlur = 40;
  ctx.fillStyle = C.green; rr(ctx, x0, y - h / 2, w, h, h / 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(text, x0 + size * 0.75, y + size * 0.05);
  if (arrow) {
    const ax = x0 + size * 0.75 + tw_ - size * 0.45, ay = y;
    const bob = Math.sin(t * 7) * 5;
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = size * 0.13; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(ax, ay - size * 0.32 + bob); ctx.lineTo(ax, ay + size * 0.3 + bob);
    ctx.moveTo(ax - size * 0.22, ay + size * 0.1 + bob); ctx.lineTo(ax, ay + size * 0.32 + bob); ctx.lineTo(ax + size * 0.22, ay + size * 0.1 + bob); ctx.stroke();
  }
  ctx.restore();
  ctx.letterSpacing = '0px';
  if (reveal === 'streak' && p > 0 && p < 1) streakLine(ctx, x0 - 20 + (w + 40) * p, y, h * 1.2, 1 - p * 0.5);
}

// silence drop → horizontal light line → orb pinch
export function streakOrb(ctx, t, { t0, tPinch, tHit, y }) {
  if (t < t0 || t > tHit + 0.05) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (t < tPinch) {
    const p = E.cape(inv(t, t0, t0 + 0.3));
    const half = 460 * p;
    const g = ctx.createLinearGradient(540 - half, 0, 540 + half, 0);
    g.addColorStop(0, 'rgba(110,224,122,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(110,224,122,0)');
    ctx.fillStyle = g; ctx.fillRect(540 - half, y - 2, half * 2, 4);
    ctx.globalAlpha = 0.45; ctx.fillRect(540 - half, y - 10, half * 2, 20);
  } else {
    const p = inv(t, tPinch, tHit);
    const half = 460 * (1 - E.inExpo(p));
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(540 - half, y - 2, half * 2, 4);
    const r = 8 + 60 * E.inCubic(p);
    const g = ctx.createRadialGradient(540, y, 0, 540, y, r * 2.2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(200,255,205,0.8)'); g.addColorStop(1, 'rgba(60,173,76,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(540, y, r * 2.2, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// end card: icon pop, wordmark wipe, brand line, CTA pill, handle
export function endCard(ctx, t, img, { tHit, y }) {
  if (t < tHit) return;
  const iconH0 = 330, iconH1 = 236;
  const ia = img.icon.width / img.icon.height;
  const wmW = 560, wmH = wmW * img.wordmark.height / img.wordmark.width;
  const gap = 34;
  const totalW = iconH1 * ia + gap + wmW;
  const xIconFinal = 540 - totalW / 2 + (iconH1 * ia) / 2;
  const pPop = E.cape(inv(t, tHit, tHit + 0.35));
  const pSlide = E.cape(inv(t, tHit + 0.22, tHit + 0.62));
  const ih = lerp(lerp(iconH0 * 1.25, iconH0, pPop), iconH1, pSlide);
  const ix = lerp(540, xIconFinal, pSlide);
  // dark halo
  ctx.save();
  const hg = ctx.createRadialGradient(ix, y, 0, ix, y, ih * 1.2);
  hg.addColorStop(0, 'rgba(0,0,0,0.55)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(ix, y, ih * 1.2, 0, 7); ctx.fill();
  // wordmark wipes out from behind the icon
  if (pSlide > 0) {
    const wx = xIconFinal + (iconH1 * ia) / 2 + gap;
    ctx.save();
    ctx.beginPath(); ctx.rect(ix + (ih * ia) / 2 + 4, y - wmH, 2000, wmH * 2); ctx.clip();
    ctx.globalAlpha = pSlide;
    ctx.drawImage(img.wordmark, lerp(wx - 260, wx, pSlide), y - wmH / 2 + 4, wmW, wmH);
    ctx.restore();
  }
  ctx.shadowColor = 'rgba(60,173,76,0.55)'; ctx.shadowBlur = 50;
  ctx.drawImage(img.icon, ix - (ih * ia) / 2, y - ih / 2, ih * ia, ih);
  ctx.restore();
}
