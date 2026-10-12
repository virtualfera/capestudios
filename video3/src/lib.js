import * as THREE from 'three';

export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const sstep = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const nz = (x) => Math.sin(x * 1.7) * .5 + Math.sin(x * 2.9 + 1.3) * .3 + Math.sin(x * 5.3 + 2.1) * .2;
export const easeInOut = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, rep = [1, 1], srgb = true) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

/** Calçadão de Copacabana: ondas pretas e brancas (pedra portuguesa) com textura de pedrinhas. */
export function calcadaTexture() {
  const S = 1024; const [c, g] = canvas(S, S); const R = rng(4);
  g.fillStyle = '#e9e4d8'; g.fillRect(0, 0, S, S);
  g.fillStyle = '#23211f';
  for (let k = -1; k < 3; k++) {
    g.beginPath();
    for (let x = 0; x <= S; x += 4) { const y = k * 512 + 150 + Math.sin(x / S * Math.PI * 2) * 120; x ? g.lineTo(x, y) : g.moveTo(x, y); }
    for (let x = S; x >= 0; x -= 4) { const y = k * 512 + 330 + Math.sin(x / S * Math.PI * 2) * 120; g.lineTo(x, y); }
    g.closePath(); g.fill();
  }
  // pedrinhas
  for (let i = 0; i < 16000; i++) { const x = R() * S, y = R() * S, s = 5 + R() * 6; g.strokeStyle = `rgba(0,0,0,${0.08 + R() * 0.12})`; g.lineWidth = 1; g.strokeRect(x, y, s, s * (0.8 + R() * 0.4)); }
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${R() < .5 ? 255 : 0},${R() < .5 ? 240 : 0},${R() < .5 ? 220 : 0},${0.03 + R() * 0.05})`; g.fillRect(R() * S, R() * S, 3 + R() * 6, 3 + R() * 6); }
  return tex(c);
}
export function sandTexture() {
  const S = 1024; const [c, g] = canvas(S, S); const R = rng(9);
  g.fillStyle = '#e2c99c'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 60000; i++) { const v = R(); g.fillStyle = v < .5 ? `rgba(255,245,220,${R() * .25})` : `rgba(140,110,70,${R() * .2})`; g.fillRect(R() * S, R() * S, 1 + R() * 2, 1 + R() * 2); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(150,120,80,${0.03 + R() * 0.05})`; g.beginPath(); g.ellipse(R() * S, R() * S, 10 + R() * 50, 4 + R() * 12, R() * 3, 0, 7); g.fill(); }
  return tex(c);
}
export function asphaltTexture() {
  const S = 512; const [c, g] = canvas(S, S); const R = rng(11);
  g.fillStyle = '#3a3b3d'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 30000; i++) { g.fillStyle = `rgba(${R() < .5 ? 255 : 0},${R() < .5 ? 255 : 0},${R() < .5 ? 255 : 0},${R() * .06})`; g.fillRect(R() * S, R() * S, 1 + R() * 2, 1 + R() * 2); }
  return tex(c);
}

/** Fachada de prédio de Copacabana: faixas de varanda, janelas de correr, ar-condicionados, térreo comercial. */
export function facadeTexture(cols, rows, wall, seed, opts = {}) {
  const R = rng(seed), cw = 32, ch = 32, w = cols * cw, h = rows * ch;
  const [c, g] = canvas(w, h); const [e, ge] = canvas(w, h);
  ge.fillStyle = '#000'; ge.fillRect(0, 0, w, h);
  g.fillStyle = wall; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h / 60; i++) { g.fillStyle = `rgba(0,0,0,${R() * 0.035})`; g.fillRect(R() * w, R() * h, 2 + R() * 6, 2 + R() * 6); }
  for (let r = 0; r < rows; r++) {
    const y = h - (r + 1) * ch;
    if (r === 0) { // térreo: lojas
      for (let k = 0; k < cols; k++) { g.fillStyle = '#1d2228'; g.fillRect(k * cw + 2, y + 6, cw - 4, ch - 6); g.fillStyle = ['#c0392b', '#2e86c1', '#f1c40f', '#27ae60', '#ecf0f1'][Math.floor(R() * 5)]; g.fillRect(k * cw, y + 2, cw, 6); }
      continue;
    }
    // faixa da varanda (concreto mais claro)
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, y + ch - 7, w, 7);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, y + ch - 1, w, 1);
    for (let k = 0; k < cols; k++) {
      const x = k * cw;
      const glass = R() < 0.5 ? 'rgba(40,60,78,.95)' : 'rgba(70,96,118,.95)';
      g.fillStyle = glass; g.fillRect(x + 4, y + 5, cw - 8, ch - 14);
      g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x + 4, y + 5, (cw - 8) / 2, ch - 14);
      g.fillStyle = 'rgba(230,230,230,.8)'; g.fillRect(x + cw / 2 - 1, y + 5, 2, ch - 14);
      if (R() < 0.35) { g.fillStyle = 'rgba(245,240,230,.95)'; g.fillRect(x + 4, y + 5, cw - 8, (ch - 14) * (0.3 + R() * 0.6)); } // cortina
      if (R() < 0.18) { g.fillStyle = '#d9d9d4'; g.fillRect(x + 6, y + ch - 14, 9, 6); g.fillStyle = '#9a9a96'; g.fillRect(x + 7, y + ch - 13, 7, 1); } // ar-condicionado
      if (R() < (opts.lit ?? 0.25)) { ge.fillStyle = `rgb(${Math.round((0.3 + R() * 0.7) * 255)},${Math.round((0.4 + R() * 0.5) * 255)},${Math.round(R() * 120)})`; ge.fillRect(x + 4, y + 5, cw - 8, ch - 14); }
    }
  }
  const map = tex(c); map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  const emi = tex(e); emi.wrapS = emi.wrapT = THREE.ClampToEdgeWrapping;
  return { map, emi };
}

export function softDot() {
  const [c, g] = canvas(128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t;
}
export function puffTexture(seed = 7) {
  const [c, g] = canvas(256, 256); const R = rng(seed);
  for (let i = 0; i < 22; i++) { const x = 128 + (R() - .5) * 110, y = 128 + (R() - .5) * 110, r = 40 + R() * 60; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${0.25 + R() * .2})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
