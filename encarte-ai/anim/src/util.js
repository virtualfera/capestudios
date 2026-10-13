// Deterministic helpers: every animated value is a pure function of t.
export const C = {
  bg: '#060D09', green: '#3CAD4C', greenHot: '#6EE07A', greenDeep: '#2F8A3B', greenEdge: '#0B2A17',
  orange: '#F6A624', ink: '#F4F7F2', mute: 'rgba(244,247,242,0.62)', pale: '#E3F5D5',
};

export function PRNG(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
    return (s >>> 0) / 4294967296;
  };
}

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const inv = (t, t0, t1) => clamp((t - t0) / (t1 - t0));

// cubic-bezier evaluator (for the signature ease .16,1,.3,1)
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) { const d = sx(u) - x; const dd = dx(u); if (Math.abs(d) < 1e-6 || dd === 0) break; u -= d / dd; }
    return sy(clamp(u));
  };
}

export const E = {
  lin: (u) => u,
  cape: bezier(0.16, 1, 0.3, 1),
  outExpo: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
  inExpo: (u) => (u <= 0 ? 0 : Math.pow(2, 10 * u - 10)),
  inOutExpo: (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2),
  outCubic: (u) => 1 - Math.pow(1 - u, 3),
  inCubic: (u) => u * u * u,
  inOutCubic: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  inOutSine: (u) => -(Math.cos(Math.PI * u) - 1) / 2,
  outBack: (u) => { const s = 1.70158; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); },
  outBackSoft: (u) => { const s = 0.9; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); },
  outElastic: (u) => (u <= 0 ? 0 : u >= 1 ? 1 : Math.pow(2, -10 * u) * Math.sin((u * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
};

// tween a value between t0..t1
export const tw = (t, t0, t1, a, b, ease = E.cape) => lerp(a, b, ease(inv(t, t0, t1)));

// keyframes: [[t, v], [t, v, ease], ...] (ease applies to the segment ending at that key)
export function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, ease] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t <= t1) return lerp(v0, v1, (ease || E.inOutCubic)(inv(t, t0, t1)));
  }
  return keys[keys.length - 1][1];
}

// visibility window with fades
export const win = (t, t0, t1, fin = 0.12, fout = 0.12) => Math.min(inv(t, t0, t0 + fin), 1 - inv(t, t1 - fout, t1));

// smooth deterministic noise (sum of sines) for drift / handheld feel
export const drift = (t, seed = 0, amp = 1) =>
  amp * (Math.sin(t * 0.73 + seed * 1.7) * 0.6 + Math.sin(t * 1.31 + seed * 3.1) * 0.3 + Math.sin(t * 2.17 + seed * 5.3) * 0.1);
