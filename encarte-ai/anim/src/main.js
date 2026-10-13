// Encarte Aí — 9:16 motion reel. Deterministic: window.__seek(t) renders time t; window.__frame() returns the JPEG.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { C, PRNG, clamp, lerp, inv, E, tw, kf, win, drift } from './util.js';
import * as TX from './tex.js';
import * as OV from './overlay.js';

const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
const DW = 1080, DH = 1920;
const DUR = 30.8;

// ---------------------------------------------------------------- canvases
const VW = RENDER ? window.innerWidth : DW / 2;
const VH = RENDER ? window.innerHeight : DH / 2;
const S = VW / DW;
const out = document.createElement('canvas'); out.width = VW; out.height = VH;
const ctx = out.getContext('2d');
const glCanvas = document.createElement('canvas'); glCanvas.width = VW; glCanvas.height = VH;
const bloomC = document.createElement('canvas'); bloomC.width = Math.round(VW / 4); bloomC.height = Math.round(VH / 4);
const bctx = bloomC.getContext('2d');
const tmpC = document.createElement('canvas'); tmpC.width = VW; tmpC.height = VH;
const tctx = tmpC.getContext('2d');
document.getElementById('stage').appendChild(out);

// ---------------------------------------------------------------- three
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(VW, VH, false);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.fog = new THREE.Fog(0x050b07, 13, 28);
const camera = new THREE.PerspectiveCamera(30, DW / DH, 0.1, 100);
const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-4, 6, 8); scene.add(key);
const rim = new THREE.PointLight(0x3cad4c, 60, 30, 1.6); rim.position.set(3, 4, -4); scene.add(rim);
const rim2 = new THREE.PointLight(0x6ee07a, 30, 30, 1.6); rim2.position.set(-4, -2, -3); scene.add(rim2);
scene.add(new THREE.AmbientLight(0xffffff, 0.25));

const ASSET = (p) => `/assets/${p}`;
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }

function texOf(src) {
  const t = src instanceof HTMLCanvasElement ? new THREE.CanvasTexture(src) : new THREE.Texture(src);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true;
  return t;
}
function plane(src, h, { basic = false, bend = 0, seg = 1, side = THREE.DoubleSide, emissive = 0.4, tex = null } = {}) {
  const w = h * src.width / src.height;
  const geo = new THREE.PlaneGeometry(w, h, bend ? 16 : seg, 1);
  if (bend) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / w; p.setZ(i, -bend * x * x * w); } geo.computeVertexNormals(); }
  const map = tex || texOf(src);
  const mat = basic
    ? new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false, side, depthWrite: false })
    : new THREE.MeshStandardMaterial({ map, transparent: true, roughness: 0.82, metalness: 0, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: emissive, side, alphaTest: 0.03 });
  const m = new THREE.Mesh(geo, mat);
  m.userData.tex = map;
  return m;
}
function setOpacity(obj, a) {
  obj.traverse((o) => { if (o.material) { o.material.opacity = a; o.visible = a > 0.002; } });
  obj.visible = a > 0.002;
}

// tag with separate front/back faces, pivot at the hole
function makeTag(h, front, back) {
  const g = new THREE.Group();
  const f = plane(front, h, { side: THREE.FrontSide, basic: true });
  const b = plane(back || front, h, { side: THREE.FrontSide, basic: true });
  for (const m of [f, b]) { m.material.depthWrite = true; m.material.alphaTest = 0.03; }
  b.rotation.y = Math.PI;
  for (const m of [f, b]) m.geometry.translate(0, -h * 0.335, 0);
  g.add(f, b);
  g.userData = { f, b, front, back: back || front };
  return g;
}

const IMG = {};
const G = {}; // scene groups / objects
const DYN = []; // canvas textures to refresh per frame {canvas, tex, draw(t)}

async function init() {
  const fonts = [['Nunito', '900', 'nunito-latin-900-normal'], ['Nunito', '800', 'nunito-latin-800-normal'], ['Nunito', '700', 'nunito-latin-700-normal'],
    ['Inter', '600', 'inter-latin-600-normal'], ['Inter', '700', 'inter-latin-700-normal']];
  for (const [fam, wt, file] of fonts) { const f = new FontFace(fam, `url(${ASSET('fonts/' + file + '.woff2')})`, { weight: wt }); document.fonts.add(await f.load()); }
  await document.fonts.ready;
  const [city, home, icon, wordmark] = await Promise.all([
    loadImg(ASSET('ui/screen-city-masked.png')), loadImg(ASSET('ui/screen-home-masked.png')),
    loadImg(ASSET('icon-symbol-tight.png')), loadImg(ASSET('wordmark-on-dark.png'))]);
  Object.assign(IMG, { city, home, icon, wordmark });

  const flyers = [0, 1, 2, 3].map((i) => TX.flyer(i));

  // ---- S1: hero tag + background flyers
  G.s1 = new THREE.Group(); scene.add(G.s1);
  const tagFront = TX.canvas(420, 620); TX.drawTag(tagFront, { main: 'R$ ?' });
  G.heroTag = makeTag(3.0, tagFront); G.s1.add(G.heroTag);
  G.bgFlyers = [];
  const r = PRNG(11);
  for (let i = 0; i < 9; i++) {
    const m = plane(flyers[i % 4], 2.4, { bend: 0.06, emissive: 0.25 });
    m.userData.base = { x: (r() - 0.5) * 9, y: (r() - 0.5) * 11, z: -3 - r() * 6, rx: (r() - 0.5) * 0.8, ry: (r() - 0.5) * 1.2, rz: (r() - 0.5) * 0.9, s: r() };
    G.s1.add(m); G.bgFlyers.push(m);
  }

  // ---- S2: chat bubbles
  G.s2 = new THREE.Group(); scene.add(G.s2);
  const caps = ['olha o encarte\nde hoje!', 'promoção\nnova aqui', 'e esse\naqui?', 'mais um\nencarte...', 'corre que\nacaba!', 'qual tá\nmais barato?'];
  G.bubbles = caps.map((c, i) => { const m = plane(TX.bubble(c, flyers[i % 4], i % 2, `08:${12 + i * 3}`), 2.05, { emissive: 0.7 }); G.s2.add(m); return m; });

  // ---- S3: the slope ("ladeira") with three stores and a hopping pin
  G.s3 = new THREE.Group(); scene.add(G.s3);
  const road = TX.canvas(512, 2048); { const c2 = road.getContext('2d'); c2.fillStyle = '#0d1611'; c2.fillRect(0, 0, 512, 2048); for (let k = 0; k < 7; k++) { c2.save(); c2.translate(256, 150 + k * 290); c2.rotate((k % 2 ? 1 : -1) * 0.08); c2.globalAlpha = 0.55; c2.drawImage(flyers[k % 4], -190, -134, 380, 268 * 2); c2.restore(); } const gg = c2.createLinearGradient(0, 0, 0, 2048); gg.addColorStop(0, 'rgba(6,13,9,0.9)'); gg.addColorStop(0.5, 'rgba(6,13,9,0.2)'); gg.addColorStop(1, 'rgba(6,13,9,0.6)'); c2.fillStyle = gg; c2.fillRect(0, 0, 512, 2048); }
  G.slopeY = new THREE.Group(); G.slopeY.rotation.y = -0.38; G.slopeY.position.set(0.4, -3.2, 1); G.s3.add(G.slopeY);
  G.slope = new THREE.Group(); G.slope.rotation.x = -0.95; G.slopeY.add(G.slope);
  const roadM = plane(road, 22, { emissive: 0.5 }); roadM.position.y = 7; G.slope.add(roadM);
  G.stores = [0, 1, 2].map((i) => {
    const m = plane(TX.store(i), 1.9, { emissive: 0.55 });
    m.geometry.translate(0, 0.95, 0);
    m.rotation.x = 0.95; m.position.set(i === 1 ? 0.75 : -0.7, 2 + i * 5.2, 0.02);
    G.slope.add(m); return m;
  });
  G.hopPin = plane(TX.pin('você'), 1.1, { basic: true });
  G.hopPin.geometry.translate(0, 1.1 * 0.5 - 1.1 * (300 / 470), 0); // tip at origin
  G.hopPin.rotation.x = 0.95; G.slope.add(G.hopPin);

  // ---- S4: three price tags
  G.s4 = new THREE.Group(); scene.add(G.s4);
  G.tags4 = [0, 1, 2].map((i) => {
    const f = TX.canvas(420, 620); TX.drawTag(f, { label: `MERCADO ${i + 1}`, main: 'R$ ?' });
    const b = TX.canvas(420, 620); TX.drawTag(b, i === 0 ? { label: 'MERCADO 1', main: 'MAIS\nBARATO', green: true } : { label: `MERCADO ${i + 1}`, main: 'R$ ?', dim: 0.55 });
    const tg = makeTag(1.8, f, b); G.s4.add(tg); return tg;
  });
  G.icon3 = plane(icon, 2.4, { basic: true }); G.s4.add(G.icon3);

  // ---- phone (S5–S7, S10)
  G.phone = new THREE.Group(); scene.add(G.phone);
  const body = new THREE.Mesh(new RoundedBoxGeometry(3.0, 6.2, 0.34, 8, 0.44),
    new THREE.MeshPhysicalMaterial({ color: 0x0b0e0c, metalness: 0.65, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.3 }));
  G.phone.add(body);
  const rimM = new THREE.Mesh(new RoundedBoxGeometry(3.04, 6.24, 0.26, 8, 0.45), new THREE.MeshStandardMaterial({ color: 0x5f6b63, metalness: 1, roughness: 0.25 }));
  G.phone.add(rimM);
  const camBump = new THREE.Mesh(new RoundedBoxGeometry(1.05, 1.05, 0.1, 4, 0.22), new THREE.MeshPhysicalMaterial({ color: 0x151a17, metalness: 0.5, roughness: 0.35, clearcoat: 1 }));
  camBump.position.set(-0.78, 2.35, -0.2); G.phone.add(camBump);
  for (const [x, y] of [[-0.98, 2.55], [-0.58, 2.15], [-0.98, 2.15]]) {
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 24), new THREE.MeshPhysicalMaterial({ color: 0x050605, metalness: 0.2, roughness: 0.05, clearcoat: 1 }));
    lens.rotation.x = Math.PI / 2; lens.position.set(x, y, -0.27); G.phone.add(lens);
  }
  const scr = TX.canvas(822, 1780);
  const scrTex = texOf(scr);
  G.screen = new THREE.Mesh(new THREE.PlaneGeometry(2.78, 2.78 * 1780 / 822), new THREE.MeshBasicMaterial({ map: scrTex, transparent: true, toneMapped: false }));
  G.screen.position.z = 0.172; G.phone.add(G.screen);
  G.scr = { canvas: scr, tex: scrTex, last: '' };

  // vortex objects (flyers / bubbles flying into the phone)
  G.vortex = [];
  for (let i = 0; i < 12; i++) {
    const src = i % 3 === 0 ? TX.bubble(caps[i % 6], flyers[i % 4], i % 2, '08:30') : flyers[i % 4];
    const m = plane(src, 1.7, { emissive: 0.5 }); scene.add(m); G.vortex.push(m);
  }

  // search result tags (S7)
  G.tags7 = [0, 1, 2].map((i) => {
    const f = TX.canvas(420, 620);
    const tg = makeTag(1.75, f, f); scene.add(tg);
    tg.userData.canvas = f;
    return tg;
  });

  // ---- S8/S9: ground map, "você", pins, route, light line
  G.map = new THREE.Group(); scene.add(G.map);
  const gr = plane(TX.ground(), 18, { basic: true }); gr.rotation.x = -Math.PI / 2; gr.position.y = -2; G.map.add(gr);
  G.you = new THREE.Sprite(new THREE.SpriteMaterial({ map: texOf(TX.youDot()), transparent: true, toneMapped: false, depthWrite: false }));
  G.you.scale.set(1.5, 1.5, 1); G.you.position.set(0, -1.95, 0.6); G.map.add(G.you);
  G.youLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: texOf(TX.label('VOCÊ', { size: 40 })), transparent: true, toneMapped: false, depthWrite: false }));
  G.youLabel.center.set(0.5, 1.6); G.youLabel.scale.set(1.0, 0.45, 1); G.youLabel.position.set(0, -1.95, 0.6); G.map.add(G.youLabel);
  G.rings = [0, 1, 2].map(() => { const m = plane(TX.ring(), 1, { basic: true }); m.rotation.x = -Math.PI / 2; m.position.set(0, -1.98, 0.6); m.material.blending = THREE.AdditiveBlending; G.map.add(m); return m; });
  const PINS = [['3,5 km', -2.6, -2.6], ['3,8 km', 2.8, -3.0], ['1,5 km', 1.7, -0.6], ['1,2 km', -1.15, 1.5]];
  G.pins = PINS.map(([lab, x, z]) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texOf(TX.pin(lab)), transparent: true, toneMapped: false, depthWrite: false }));
    s.center.set(0.5, 170 / 470); s.scale.set(1.05, 1.05 * 470 / 300, 1);
    s.userData.base = new THREE.Vector3(x, -2, z); G.map.add(s); return s;
  });
  G.burst = plane(TX.ring(), 1, { basic: true }); G.burst.rotation.x = -Math.PI / 2; G.burst.material.blending = THREE.AdditiveBlending; G.map.add(G.burst);
  // dashed zig-zag route through all pins (the old way) and the straight light line (the new way)
  const routePts = [new THREE.Vector3(0, -1.97, 0.6), new THREE.Vector3(2.8, -1.97, -3.0), new THREE.Vector3(-2.6, -1.97, -2.6), new THREE.Vector3(1.7, -1.97, -0.6), new THREE.Vector3(-1.15, -1.97, 1.5)];
  const routeGeo = new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(routePts, false, 'catmullrom', 0.2).getPoints(200));
  G.route = new THREE.Line(routeGeo, new THREE.LineDashedMaterial({ color: 0xf4f7f2, dashSize: 0.18, gapSize: 0.14, transparent: true, linewidth: 2 }));
  G.route.computeLineDistances(); G.map.add(G.route);
  const a = new THREE.Vector3(0, -1.96, 0.6), b = new THREE.Vector3(-1.15, -1.96, 1.5);
  const len = a.distanceTo(b);
  G.beam = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.09), new THREE.MeshBasicMaterial({ color: 0x9dffad, transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }));
  G.beam.geometry.translate(0.5, 0, 0);
  G.beam.rotation.x = -Math.PI / 2; G.beam.rotation.z = Math.atan2(-(b.z - a.z), b.x - a.x);
  G.beam.position.copy(a); G.beam.userData.len = len; G.map.add(G.beam);
  G.beamGlow = G.beam.clone(); G.beamGlow.material = G.beam.material.clone(); G.beamGlow.material.color.set(0x3cad4c); G.beamGlow.scale.y = 5; G.map.add(G.beamGlow);
}

// ---------------------------------------------------------------- timing
const WHIPS = [
  { t0: 2.93, t1: 3.13, dir: [0, 1] },
  { t0: 4.62, t1: 4.82, dir: [-1, 0] },
  { t0: 7.60, t1: 7.80, dir: [0, -1] },
  { t0: 19.72, t1: 19.92, dir: [0, -1] },
  { t0: 24.22, t1: 24.42, dir: [0, 1] },
];
const FLASH1 = 10.85, DROP = 26.15, HIT = 26.65;

function whipOffset(t) {
  for (const w of WHIPS) {
    if (t >= w.t0 && t <= w.t1) {
      const u = inv(t, w.t0, w.t1);
      const d = u < 0.5 ? E.inExpo(u * 2) : -(1 - E.outExpo((u - 0.5) * 2));
      return { x: w.dir[0] * d * 9, y: w.dir[1] * d * 9, smear: Math.sin(Math.PI * u), dir: w.dir };
    }
  }
  return { x: 0, y: 0, smear: 0, dir: [0, 0] };
}

// which "set" is on screen
function setAt(t) {
  if (t < 3.03) return 's1';
  if (t < 4.72) return 's2';
  if (t < 7.70) return 's3';
  if (t < FLASH1) return 's4';
  if (t < 19.82) return 'phone';
  if (t < 24.32) return 'map';
  if (t < DROP) return 'phone';
  return 'end';
}

// camera framing per set, returns {p:[x,y,z], l:[x,y,z], fov, roll}
function framing(t, set) {
  const dx = drift(t, 1, 0.12), dy = drift(t, 2, 0.08);
  switch (set) {
    case 's1': return { p: [dx, 0.2 + dy, tw(t, 0, 3.0, 13.6, 12.2, E.inOutSine)], l: [0, 0.1, 0], fov: 30, roll: drift(t, 3, 0.01) };
    case 's2': return { p: [dx + 0.3, -1.6 + dy, tw(t, 3.0, 4.8, 12.5, 11.4, E.inOutSine)], l: [0, 0.6, 0], fov: 30, roll: -0.03 };
    case 's3': {
      const up = tw(t, 6.55, 7.3, 0, 1, E.inOutCubic);
      return { p: [dx + lerp(-0.6, 0.4, up), lerp(-0.5, -2.8, up) + dy, lerp(12.5, 11, up)], l: [lerp(0.2, 0.8, up), lerp(0.6, 3.4, up), lerp(-2, -6, up)], fov: lerp(32, 36, up), roll: lerp(0.02, -0.04, up) };
    }
    case 's4': {
      const push = tw(t, 9.9, 10.85, 0, 1, E.inOutCubic);
      return { p: [dx + lerp(0, -1.3, push), 0.3 + dy + lerp(0, 0.6, push), lerp(12.8, 8.8, push) + tw(t, 7.7, 9.8, 0.8, 0, E.outCubic)], l: [lerp(0, -1.3, push), lerp(0.1, 0.2, push), 0], fov: 30, roll: 0 };
    }
    case 'phone': {
      const z = kf(t, [[10.85, 11.8], [12.8, 11.2], [15.1, 11.0], [15.4, 10.5, E.cape], [19.7, 10.2], [24.3, 12.0], [26.1, 11.0, E.inCubic]]);
      return { p: [dx * 0.8, dy * 0.8, z], l: [0, 0, 0], fov: 30, roll: drift(t, 5, 0.006) };
    }
    case 'map': {
      const push = tw(t, 22.7, 24.2, 0, 1, E.inOutSine);
      return { p: [dx + lerp(0.6, -0.4, push), lerp(3.4, 2.9, push) + dy, lerp(9.2, 7.8, push)], l: [lerp(0, -0.5, push), -1.4, lerp(-1.2, 0.2, push)], fov: 32, roll: 0 };
    }
    default: return { p: [0, 0, 12], l: [0, 0, 0], fov: 30, roll: 0 };
  }
}

// ---------------------------------------------------------------- per-frame scene update
const tagFrontS7 = [0, 1, 2].map(() => '');
function update(t) {
  const set = setAt(t);
  const W = whipOffset(t);
  const f = framing(t, set);
  camera.position.set(f.p[0] + W.x, f.p[1] + W.y, f.p[2]);
  camera.lookAt(f.l[0] + W.x, f.l[1] + W.y, f.l[2]);
  camera.rotateZ(f.roll);
  camera.fov = f.fov; camera.updateProjectionMatrix();

  // ---- S1
  G.s1.visible = set === 's1';
  if (G.s1.visible) {
    const drop = E.outBackSoft(inv(t, 0, 0.5));
    G.heroTag.position.set(0, lerp(6, -0.2, drop) + 0.95, 0);
    const spin = tw(t, 2.06, 2.75, 0, Math.PI * 2, E.outExpo);
    G.heroTag.rotation.set(0.05 * Math.sin(t * 1.7), 0.32 * Math.sin(t * 1.25 + 0.4) * Math.exp(-t * 0.15) + spin, 0.07 * Math.sin(t * 2.1) * Math.exp(-t * 0.3) + (1 - drop) * 0.3);
    const s = 1 + 0.05 * Math.exp(-((t - 2.06) ** 2) / 0.004);
    G.heroTag.scale.setScalar(s);
    G.bgFlyers.forEach((m, i) => {
      const b = m.userData.base;
      m.position.set(b.x + Math.sin(t * 0.3 + i) * 0.3, b.y + t * (0.25 + b.s * 0.3) + tw(t, 2.0, 2.9, 0, -1.5 - b.s * 2, E.inCubic), b.z);
      m.rotation.set(b.rx + t * 0.05, b.ry + t * 0.08 * (i % 2 ? 1 : -1), b.rz + t * 0.04);
      setOpacity(m, 0.85 * inv(t, 0.05 + i * 0.03, 0.5 + i * 0.03));
    });
  }

  // ---- S2 bubbles: new one every ~0.34 s, stack scrolls up, accelerating
  G.s2.visible = set === 's2';
  if (G.s2.visible) {
    const times = [2.55, 2.88, 3.22, 3.56, 3.90, 4.24];
    G.bubbles.forEach((m, i) => {
      const ti = times[i];
      const enter = E.cape(inv(t, ti, ti + 0.3));
      let push = 0;
      for (let j = i + 1; j < times.length; j++) push += E.cape(inv(t, times[j], times[j] + 0.3)) * 2.15;
      const side = i % 2 ? 1 : -1;
      m.position.set(side * 0.5 + side * 0.15 * (1 - enter), lerp(-8, -3.6, enter) + push + tw(t, 4.3, 4.7, 0, 3, E.inCubic), -0.12 * (times.length - i) + 0.3 * enter);
      m.rotation.set(-0.12, side * -0.28, side * 0.03);
      m.scale.setScalar(lerp(0.75, 1, enter));
      setOpacity(m, t >= ti ? 1 : 0);
    });
  }

  // ---- S3 slope
  G.s3.visible = set === 's3';
  if (G.s3.visible) {
    const hop = [5.53, 5.83, 6.13];
    let idx = 0; hop.forEach((h, i) => { if (t >= h - 0.15) idx = i; });
    const from = G.stores[Math.max(0, idx - 1)].position, to = G.stores[idx].position;
    const u = idx === 0 ? 1 : E.inOutCubic(inv(t, hop[idx] - 0.15, hop[idx]));
    const up = new THREE.Vector3(0, Math.cos(0.95), Math.sin(0.95));
    const pos = new THREE.Vector3().lerpVectors(from, to, u).addScaledVector(up, 2.0 + Math.sin(Math.PI * u) * 1.4 * (idx ? 1 : 0));
    G.hopPin.position.copy(pos).add(new THREE.Vector3(0.35, 0, 0));
    const appear = E.outBack(inv(t, 5.4, 5.6));
    G.hopPin.scale.setScalar(Math.max(0.001, appear) * (1 + 0.15 * Math.exp(-((t - hop[idx]) ** 2) / 0.003)));
    G.stores.forEach((m, i) => { const a = E.outBack(inv(t, 4.75 + i * 0.08, 5.15 + i * 0.08)); m.scale.set(1, Math.max(0.001, a), 1); });
  }

  // ---- S4 tags
  G.s4.visible = set === 's4';
  if (G.s4.visible) {
    G.tags4.forEach((tg, i) => {
      const enter = E.cape(inv(t, 7.7 + i * 0.07, 8.15 + i * 0.07));
      const flip = i === 0 ? tw(t, 9.27, 9.75, 0, Math.PI, E.outExpo) : 0;
      const back = i > 0 ? tw(t, 9.3, 9.8, 0, 1, E.cape) : 0;
      const away = i > 0 ? tw(t, 9.95, 10.4, 0, 1, E.inCubic) : 0;
      tg.position.set((i - 1) * 1.3, lerp(6, 0.35, enter) - back * 0.2, -back * 1.2 - away * 3);
      tg.rotation.set(0, flip + 0.18 * Math.sin(t * 1.6 + i) * (1 - inv(t, 10.4, 10.8)), 0.06 * Math.sin(t * 2.3 + i * 1.3));
      const fade = i === 0 ? 1 - inv(t, 10.6, 10.84) : 1 - away;
      setOpacity(tg, fade);
      if (i > 0) { tg.userData.f.material.color.setScalar(1 - 0.55 * back); }
    });
    const ip = inv(t, 10.5, 10.84);
    G.icon3.position.set(-1.3, -0.55 + 0.2 * ip, 0.3);
    G.icon3.scale.setScalar(lerp(0.85, 1.05, E.outCubic(ip)));
    G.icon3.rotation.set(0, (1 - E.outCubic(ip)) * 1.2, 0);
    setOpacity(G.icon3, E.inOutCubic(ip));
  }

  // ---- phone
  const phoneOn = set === 'phone';
  G.phone.visible = phoneOn;
  if (phoneOn) {
    let ry, rx, y, sc;
    if (t < 24.32) {
      const settle = E.outBackSoft(inv(t, FLASH1, 11.6));
      ry = lerp(-1.1, 0, settle) + 0.08 * Math.sin(t * 0.9);
      rx = lerp(0.35, 0.06, settle) + 0.03 * Math.sin(t * 0.7);
      y = kf(t, [[10.85, -1.55], [12.8, -1.55], [14.0, -1.72, E.cape], [15.1, -1.72], [15.45, -1.62, E.cape], [19.7, -1.55]]);
      sc = kf(t, [[10.85, 0.8], [14.0, 0.86, E.cape], [15.45, 0.88, E.cape]]);
      if (t > 19.6) { y += E.inExpo(inv(t, 19.6, 19.82)) * 3; }
    } else {
      const sw = E.cape(inv(t, 24.32, 25.1));
      ry = lerp(-Math.PI * 1.15, 0, sw) + 0.07 * Math.sin(t * 0.9);
      rx = 0.08; y = lerp(-1.7, -1.25, sw); sc = lerp(0.72, 0.82, sw) + tw(t, 25.3, 26.15, 0, 0.05, E.inCubic);
    }
    G.phone.position.set(0, y, 0); G.phone.rotation.set(rx, ry, 0); G.phone.scale.setScalar(sc);
    drawPhoneScreen(t);
  }

  // ---- vortex: everything gets sucked into the phone (S6)
  const vOn = t > 12.7 && t < 13.95;
  G.vortex.forEach((m, i) => {
    m.visible = vOn;
    if (!vOn) return;
    const u = E.inCubic(inv(t, 12.72 + i * 0.03, 13.88));
    const a0 = i * 2.39996, r0 = 6.5 + (i % 3);
    const ang = a0 + u * 2.6;
    const target = new THREE.Vector3(0, G.phone.position.y + 0.3, 0.3);
    m.position.set(lerp(Math.cos(ang) * r0, target.x, u), lerp(Math.sin(ang) * r0 * 1.4, target.y, u), lerp(-2 + (i % 4), target.z, u));
    m.rotation.set(u * 3 + i, u * 4 + i * 0.5, u * 2);
    m.scale.setScalar(Math.max(0.01, 1 - u * 0.97));
    setOpacity(m, Math.min(1, inv(t, 12.72, 12.95)) * (1 - inv(t, 13.8, 13.9)));
  });

  // ---- S7 result tags around the phone
  const r7 = t > 16.55 && t < 19.8;
  G.tags7.forEach((tg, i) => {
    tg.visible = r7;
    if (!r7) return;
    const pos = [[-0.92, 0.55, 0.9], [0.92, -0.05, 1.0], [-0.9, -1.55, 0.8]][i];
    const out = E.cape(inv(t, 16.62 + i * 0.1, 17.1 + i * 0.1));
    const exit = E.inExpo(inv(t, 19.55, 19.8));
    tg.position.set(lerp(0, pos[0], out), lerp(-1.2, pos[1], out) + exit * 3, lerp(0.3, pos[2], out));
    tg.scale.setScalar(0.78 * Math.max(0.01, out) * (i === 1 ? 1 + 0.12 * E.outBack(inv(t, 18.62, 18.9)) : 1));
    const flip = i === 1 ? tw(t, 18.58, 18.98, 0, Math.PI * 2, E.outExpo) : 0;
    tg.rotation.set(0, flip + 0.25 * Math.sin(t * 1.5 + i * 2), 0.07 * Math.sin(t * 2 + i));
    const best = i === 1 && t >= 18.72;
    const dimmed = i !== 1 && t >= 18.62;
    const digits = best ? '' : String(100 + Math.floor((PRNG(Math.floor(t * 18) * 7 + i * 131)() * 899))).padStart(3, '0');
    const main = best ? 'MAIS\nBARATO' : `R$ ${digits[0]},${digits.slice(1)}`;
    const keyS = `${main}|${best}|${dimmed}`;
    if (tagFrontS7[i] !== keyS) {
      TX.drawTag(tg.userData.canvas, { label: `MERCADO ${'ABC'[i]}`, main, green: best, dim: dimmed ? 0.5 : 0 });
      tg.userData.f.userData.tex.needsUpdate = true; tg.userData.b.userData.tex.needsUpdate = true;
      tagFrontS7[i] = keyS;
    }
    setOpacity(tg, 1 - exit);
  });

  // ---- map (S8/S9)
  G.map.visible = set === 'map';
  if (G.map.visible) {
    const youA = E.outBack(inv(t, 19.95, 20.25));
    G.you.scale.setScalar(Math.max(0.01, 1.5 * youA)); G.youLabel.material.opacity = youA;
    G.rings.forEach((m, i) => {
      const ph = ((t - 20.05 - i * 0.4) % 1.2 + 1.2) % 1.2;
      const on = t > 20.05 + i * 0.4;
      m.visible = on; m.scale.setScalar(0.4 + ph * 3.2); m.material.opacity = on ? 0.8 * (1 - ph / 1.2) : 0;
    });
    const drops = [20.45, 20.80, 21.15, 21.50];
    G.pins.forEach((s, i) => {
      const d = inv(t, drops[i] - 0.25, drops[i] + 0.2);
      const fall = t < drops[i] ? E.inCubic(inv(t, drops[i] - 0.25, drops[i])) : 1;
      const bounce = t >= drops[i] ? Math.sin(Math.PI * inv(t, drops[i], drops[i] + 0.22)) * 0.25 : 0;
      s.position.copy(s.userData.base); s.position.y += (1 - fall) * 4 + bounce;
      const winner = i === 3;
      const dim = !winner ? tw(t, 22.9, 23.4, 1, 0.35) : 1;
      s.material.opacity = (d > 0 ? 1 : 0) * dim;
      s.visible = d > 0;
      const pulse = winner ? 1 + 0.25 * E.outBack(inv(t, 23.45, 23.7)) * (1 - inv(t, 23.7, 24.2)) : 1;
      s.scale.set(1.05 * pulse, 1.05 * 470 / 300 * pulse, 1);
    });
    const rd = inv(t, 22.12, 22.45);
    G.route.visible = rd > 0 && t < 22.75;
    G.route.geometry.setDrawRange(0, Math.floor(201 * rd));
    G.route.material.opacity = 0.85 * (1 - inv(t, 22.45, 22.75));
    const bl = E.outExpo(inv(t, 22.78, 23.2));
    G.beam.visible = G.beamGlow.visible = bl > 0;
    G.beam.scale.x = G.beamGlow.scale.x = Math.max(0.001, bl * G.beam.userData.len);
    G.beam.material.opacity = 1; G.beamGlow.material.opacity = 0.35 + 0.15 * Math.sin(t * 9);
    const bu = inv(t, 23.48, 24.1);
    G.burst.visible = bu > 0 && bu < 1;
    G.burst.position.set(-1.15, -1.97, 1.5); G.burst.scale.setScalar(0.3 + E.outCubic(bu) * 3.2); G.burst.material.opacity = 1 - bu;
  }
}

function drawPhoneScreen(t) {
  const s = {
    mix: E.inOutCubic(inv(t, 13.88, 14.15)),
    search: t < 24.3 ? E.cape(inv(t, 15.42, 15.7)) * (1 - inv(t, 19.6, 19.8)) : 0,
    typed: 'banana'.slice(0, [15.86, 15.94, 16.02, 16.10, 16.18, 16.26].filter((x) => t >= x).length),
    caret: t < 16.58 && Math.floor(t * 3.4) % 2 === 0,
    results: t < 24.3 ? inv(t, 16.6, 17.1) : 0,
    best: t >= 18.66 && t < 24.3,
    tap: { x: 411, y: 1712, p: inv(t, 15.34, 15.75) },
    sweep: t < 13 ? inv(t, 11.0, 11.9) * 2 - 0.5 : t < 20 ? inv(t, 14.0, 14.8) * 2 - 0.5 : inv(t, 24.7, 25.6) * 2 - 0.5,
    dim: 0,
  };
  if (t > 24.3) { s.mix = 1; }
  const keyS = `${s.mix.toFixed(3)}|${s.search.toFixed(3)}|${s.typed}|${s.caret}|${s.results.toFixed(3)}|${s.best}|${s.tap.p.toFixed(3)}|${s.sweep.toFixed(3)}`;
  if (keyS !== G.scr.last) {
    TX.drawScreen(G.scr.canvas, IMG, s);
    G.scr.tex.needsUpdate = true; G.scr.last = keyS;
  }
}

// screen position (design px) of a world point
const _v = new THREE.Vector3();
function toScreen(obj, offset = [0, 0, 0]) {
  if (obj.isVector3) _v.copy(obj); else { obj.updateWorldMatrix(true, false); _v.set(...offset).applyMatrix4(obj.matrixWorld); }
  _v.project(camera);
  return { x: (_v.x * 0.5 + 0.5) * DW, y: (-_v.y * 0.5 + 0.5) * DH };
}

// ---------------------------------------------------------------- background glow (design px)
function glowParams(t) {
  let I = kf(t, [[0, 0.55], [0.4, 1.0, E.outCubic], [9.9, 1.0], [10.2, 0.6], [10.84, 0.75], [10.9, 1.35], [11.6, 1.05, E.outCubic], [19.7, 1.0], [20.0, 0.8], [24.2, 0.85], [24.6, 1.0], [26.1, 1.35, E.inCubic], [26.15, 0.05, E.lin], [26.64, 0.05], [26.7, 1.7, E.lin], [27.6, 1.1, E.outCubic], [28.8, 1.25], [30.3, 1.15]]);
  I *= 1 + 0.08 * Math.sin(2 * Math.PI * 0.9 * t);
  const cy = kf(t, [[0, 820], [10.8, 900], [11, 1050], [19.7, 1000], [19.9, 1180], [24.3, 1150], [24.5, 1020], [26.6, 1020], [26.7, 780]]);
  return { I, cx: 540 + drift(t, 7, 60), cy: cy + drift(t, 8, 40), r: 980 };
}

function drawBackground(t) {
  const g = glowParams(t);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, DW, DH);
  const I = clamp(g.I, 0, 2);
  const grd = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, g.r);
  grd.addColorStop(0, `rgba(110,224,122,${0.55 * Math.min(1, I)})`);
  grd.addColorStop(0.18, `rgba(60,173,76,${0.42 * Math.min(1.3, I)})`);
  grd.addColorStop(0.5, `rgba(16,58,30,${0.5 * Math.min(1, I)})`);
  grd.addColorStop(1, 'rgba(6,13,9,0)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, DW, DH);
  if (I > 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g2 = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, g.r * 0.6); g2.addColorStop(0, `rgba(110,224,122,${0.35 * (I - 1)})`); g2.addColorStop(1, 'rgba(60,173,76,0)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, DW, DH); ctx.restore(); }
  // S1 dashed "trilha" path climbing behind the tag
  const tp = inv(t, 2.08, 2.75);
  if (tp > 0 && t < 3.05) {
    const pts = [[120, 1700], [430, 1530], [250, 1330], [640, 1150], [380, 930], [800, 760], [560, 560], [960, 330]];
    ctx.save(); ctx.globalAlpha = 1 - inv(t, 2.85, 3.0);
    ctx.setLineDash([26, 22]); ctx.lineDashOffset = -t * 80; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = C.greenHot; ctx.shadowColor = 'rgba(110,224,122,0.8)'; ctx.shadowBlur = 20;
    const total = pts.length - 1, n = E.outCubic(tp) * total;
    ctx.beginPath(); ctx.moveTo(...pts[0]);
    for (let i = 1; i <= Math.ceil(n); i++) { const k = Math.min(1, n - (i - 1)); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)); }
    ctx.stroke(); ctx.restore();
  }
  // negative halo behind hero objects
  const set = setAt(t);
  const halo = (x, y, r, a) => { const h = ctx.createRadialGradient(x, y, 0, x, y, r); h.addColorStop(0, `rgba(0,0,0,${a})`); h.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = h; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); };
  if (set === 'phone') { const p = toScreen(G.phone); halo(p.x, p.y, 760, 0.55); }
  if (set === 's1') { const p = toScreen(G.heroTag, [0, -1, 0]); halo(p.x, p.y, 520, 0.5); }
  // vignette
  const v = ctx.createRadialGradient(540, 900, 500, 540, 960, 1250);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, DW, DH);
}

// ---------------------------------------------------------------- headlines (times from VO word timestamps)
const w = (word, t, accent) => ({ w: word, t, accent });
const HEAD = [
  { lines: [[w('PETROPOLITANO', 0.08)], [w('NÃO', 0.86), w('FAZ', 1.02)], [w('MERCADO.', 1.34)]], y: [400, 505, 610], size: 104, tOut: 2.04, out: 'whip-up' },
  { lines: [[w('FAZ', 2.16), w('TRILHA.', 2.44, 1)]], y: [470], size: 128, tOut: 3.04, out: 'whip-up' },
  { lines: [[w('ENCARTE', 3.12)], [w('NO', 3.70), w('ZAP.', 4.20, 1)]], y: [420, 545], size: 128, tOut: 4.74, out: 'whip-left' },
  { lines: [[w('3', 5.45, 1), w('MERCADOS.', 5.75)]], y: [430], size: 118, tOut: 6.70, out: 'defocus' },
  { lines: [[w('HAJA', 6.72)], [w('LADEIRA.', 6.98, 1)]], y: [400, 528], size: 136, tOut: 7.74, out: 'whip-down' },
  { lines: [[w('E', 8.0), w('O', 8.06), w('MAIS', 8.12)], [w('BARATO...', 8.42)]], y: [400, 505], size: 104, tOut: 9.20, out: 'defocus' },
  { lines: [[w('ERA', 9.04), w('O', 9.12)], [w('PRIMEIRO.', 9.25, 1)]], y: [400, 525], size: 130, tOut: 10.15, out: 'defocus' },
  { lines: [[w('AGORA', 11.03), w('TEM', 11.2), w('O', 11.3)], [w('ENCARTE', 11.64, 1), w('AÍ', 12.18, 'orange')]], y: [370, 500], size: 138, tOut: 12.86, out: 'defocus' },
  { lines: [[w('OS', 12.92), w('MERCADOS', 13.0)], [w('DA', 13.44), w('CIDADE,', 13.56)]], y: [390, 495], size: 104, tOut: 14.26, out: 'defocus' },
  { lines: [[w('NUM', 14.27), w('LUGAR', 14.36)], [w('SÓ.', 14.72, 1)]], y: [370, 490], size: 124, tOut: 15.20, out: 'whip-up' },
  { lines: [[w('ONDE', 18.18), w('TÁ', 18.40)], [w('MAIS', 18.60, 1), w('BARATO.', 18.76, 1)]], y: [380, 495], size: 112, tOut: 19.82, out: 'whip-down' },
  { lines: [[w('O', 20.95), w('MAIS', 21.02), w('PERTO', 21.18, 1)], [w('DE', 21.5), w('VOCÊ.', 21.56)]], y: [380, 485], size: 106, tOut: 22.22, out: 'defocus' },
  { lines: [[w('DIRETO', 22.80), w('NO', 23.08)], [w('QUE', 23.30), w('COMPENSA.', 23.46, 1)]], y: [380, 485], size: 104, tOut: 24.36, out: 'whip-up' },
  { lines: [[w('BAIXA', 24.44), w('AÍ.', 24.88, 'orange')]], y: [450], size: 150, tOut: 25.26, out: 'defocus' },
  { lines: [[w('Petrópolis', 27.98), w('é', 28.06), w('uma', 28.12), w('cidade', 28.18), w('só.', 28.26)]], y: [985], size: 56, tOut: 0, out: 'none', color: C.ink },
  { lines: [[w('E', 28.5), w('agora,', 28.56), w('o', 28.64, 1), w('mercado', 28.7, 1), w('também.', 28.78, 1)]], y: [1060], size: 56, tOut: 0, out: 'none' },
];

function drawOverlay(t) {
  for (const h of HEAD) OV.drawHeadline(ctx, h.tOut ? h : { ...h, tOut: 99 }, t);
  OV.drawStreakText(ctx, { text: 'CALMA.', y: 430, size: 92, t0: 10.24, tOut: 10.86 }, t);
  OV.searchPill(ctx, t, { t0: 15.45, tOut: 18.14, typedAt: [15.86, 15.94, 16.02, 16.10, 16.18, 16.26], word: 'banana', doneAt: 16.58 });
  OV.pill(ctx, t, { text: 'LINK NA BIO', y: 450, t0: 25.24, tOut: DROP, size: 70, arrow: true });
  OV.streakOrb(ctx, t, { t0: DROP, tPinch: 26.52, tHit: HIT, y: 760 });
  OV.endCard(ctx, t, IMG, { tHit: HIT, y: 760 });
  OV.pill(ctx, t, { text: 'LINK NA BIO', y: 1185, t0: 28.95, tOut: 99, size: 52, arrow: true, reveal: 'pop' });
  if (t > 29.25) {
    ctx.save(); ctx.globalAlpha = E.outCubic(inv(t, 29.25, 29.6)); ctx.font = '600 40px Inter'; ctx.fillStyle = C.mute; ctx.textAlign = 'center';
    ctx.fillText('@encarteai.app', 540, 1290); ctx.restore();
  }
  // flares (brand sparkle as light motif)
  const fl = (x, y, s, a) => OV.flare(ctx, x, y, s, a);
  if (t < 0.6) { const p = toScreen(G.heroTag, [0, -0.6, 0]); fl(p.x, p.y, 120, Math.exp(-((t - 0.12) ** 2) / 0.02)); }
  if (t > 9.2 && t < 10.0) { const p = toScreen(G.tags4[0], [0, -0.9, 0.1]); fl(p.x, p.y, 150, Math.exp(-((t - 9.4) ** 2) / 0.03)); }
  if (t > 10.5 && t < 10.9) { const p = toScreen(G.icon3); fl(p.x, p.y, 260, inv(t, 10.55, 10.84) ** 2); }
  if (t > 12.1 && t < 12.6) fl(780, 470, 90, Math.exp(-((t - 12.28) ** 2) / 0.006));
  if (t > 18.5 && t < 19.2) { const p = toScreen(G.tags7[1], [0, -0.8, 0.1]); fl(p.x, p.y, 140, Math.exp(-((t - 18.7) ** 2) / 0.02)); }
  if (t > 22.75 && t < 23.4 && G.map.visible) { const a = new THREE.Vector3(0, -1.96, 0.6), b = new THREE.Vector3(-1.15, -1.96, 1.5); const u = E.outExpo(inv(t, 22.78, 23.2)); const p = toScreen(a.lerp(b, u)); fl(p.x, p.y, 80, 1 - inv(t, 23.2, 23.4)); }
  if (t > 23.4 && t < 24.0 && G.map.visible) { const p = toScreen(new THREE.Vector3(-1.15, -1.5, 1.5)); fl(p.x, p.y, 200, Math.exp(-((t - 23.55) ** 2) / 0.01)); }
  if (t > HIT - 0.02 && t < HIT + 0.9) fl(540, 760, 320, Math.exp(-((t - HIT - 0.05) ** 2) / 0.04));
  if (t > 29.0 && t < 29.6) fl(540 - 240, 690, 90, Math.exp(-((t - 29.22) ** 2) / 0.01));
  OV.flash(ctx, t, FLASH1, 1);
  OV.flash(ctx, t, HIT, 0.7);
}

// ---------------------------------------------------------------- frame
function renderFrame(t) {
  t = clamp(t, 0, DUR);
  update(t);
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  drawBackground(t);
  renderer.render(scene, camera);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(glCanvas, 0, 0);
  // cheap bloom from the 3D layer
  bctx.clearRect(0, 0, bloomC.width, bloomC.height);
  bctx.filter = 'blur(5px) brightness(1.25)';
  bctx.drawImage(glCanvas, 0, 0, bloomC.width, bloomC.height);
  bctx.filter = 'none';
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.22; ctx.drawImage(bloomC, 0, 0, VW, VH); ctx.restore();
  ctx.setTransform(S, 0, 0, S, 0, 0);
  const scrimA = t < DROP ? 0.6 : 0;
  if (scrimA > 0) { const sg = ctx.createLinearGradient(0, 180, 0, 760); sg.addColorStop(0, `rgba(3,8,5,${scrimA})`); sg.addColorStop(0.6, `rgba(3,8,5,${scrimA * 0.6})`); sg.addColorStop(1, 'rgba(3,8,5,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, DW, 760); }
  drawOverlay(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // directional smear on whips (fake motion blur on top of the 60 fps blend)
  const W = whipOffset(t);
  if (W.smear > 0.05) {
    tctx.clearRect(0, 0, VW, VH); tctx.drawImage(out, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const n = 10, L = 260 * S * W.smear;
    for (let k = 0; k < n; k++) { const o = (k / (n - 1) - 0.5) * L; ctx.globalAlpha = 1 / n; ctx.drawImage(tmpC, -W.dir[0] * o, W.dir[1] * o); }
    ctx.restore();
  }
  // fade to black
  const fo = inv(t, 30.35, 30.8);
  if (fo > 0) { ctx.fillStyle = `rgba(0,0,0,${fo})`; ctx.fillRect(0, 0, VW, VH); }
}

window.__duration = DUR;
window.__seek = (t) => renderFrame(t);
window.__frame = () => out.toDataURL('image/jpeg', 0.95);

init().then(() => {
  window.__ready = true;
  if (RENDER) return;
  const freeze = params.get('t');
  if (freeze !== null) { renderFrame(parseFloat(freeze)); return; }
  renderFrame(0);
  const audio = new Audio('/sfx/mix.wav');
  const btn = document.getElementById('play');
  btn.style.display = 'flex';
  btn.onclick = () => {
    btn.style.display = 'none'; audio.currentTime = 0; audio.play();
    const loop = () => { renderFrame(audio.currentTime); if (!audio.paused) requestAnimationFrame(loop); else btn.style.display = 'flex'; };
    requestAnimationFrame(loop);
  };
});
