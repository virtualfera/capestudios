import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, clamp, sstep, lerp, nz, interp, winU, patchWindows, hex, facade, puffTexture, rayTexture, crackTexture, calcadaTexture, grassTexture } from './lib.js';

export function buildWorld(SB, scene, camera) {
  const TL = SB.timeline;
  const QS = TL.quakeStart, QE = TL.quakeStop;
  const R = rng(1000);
  const EVENTS = []; // para sincronizar áudio
  const L = (c) => new THREE.MeshLambertMaterial({ color: c, flatShading: true });

  // ---------------------------------------------------------------- luzes
  const hemi = new THREE.HemisphereLight(0xcfd8e0, 0x6b6558, 0.7); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d8, 1.0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -115; sc.right = 115; sc.top = 115; sc.bottom = -115; sc.near = 10; sc.far = 520;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target); sun.target.position.set(0, 0, -30);
  scene.fog = new THREE.FogExp2(0xb4c0c8, 0.0016);
  scene.background = new THREE.Color(0xb4c0c8);

  // ---------------------------------------------------------------- chão
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), L(0x2d3034));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);
  const sideTex = calcadaTexture(); sideTex.repeat.set(1, 1);
  function slab(x0, x1, z0, z1, y, h, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, z1 - z0), mat);
    m.position.set((x0 + x1) / 2, y + h / 2, (z0 + z1) / 2); m.receiveShadow = true; scene.add(m); return m;
  }
  const sidewalkMat = new THREE.MeshLambertMaterial({ map: sideTex });
  const sw = (x0, x1, z0, z1) => { const m = slab(x0, x1, z0, z1, 0, 0.28, sidewalkMat.clone()); m.material.map = sideTex.clone(); m.material.map.needsUpdate = true; m.material.map.repeat.set((x1 - x0) / 4, (z1 - z0) / 4); return m; };
  // calçadas (4 quarteirões) + calçada larga dos dois lados
  const swParts = [
    [10, 17, -4, 80], [10, 17, -300, -20], [-17, -10, -4, 80], [-17, -10, -300, -20],
  ];
  swParts.forEach((p) => sw(p[0], p[1], p[2], p[3]));
  // cruzamento: calçadas das esquinas da rua transversal
  [[17, 140], [-140, -17]].forEach(([a, b]) => { sw(a, b, -4, -2); sw(a, b, -22, -20); });
  // canteiro central com grama
  const grassTex = grassTexture(); grassTex.repeat.set(1, 30);
  const median = slab(-1.4, 1.4, -300, 80, 0, 0.3, new THREE.MeshLambertMaterial({ map: grassTex }));
  median.material.map = grassTex;
  // gap do canteiro no cruzamento
  const cutMat = L(0x2d3034);
  const cut = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.34, 16), cutMat); cut.position.set(0, 0.17, -12); cut.receiveShadow = true; scene.add(cut);

  // faixas
  const white = new THREE.MeshBasicMaterial({ color: 0xd9d6cc });
  const dashG = new THREE.BoxGeometry(0.18, 0.04, 2.2);
  const dashes = [];
  [-7.35, -4.45, 4.45, 7.35].forEach((x) => { for (let z = 78; z > -300; z -= 6) { if (z < -3 && z > -21) continue; dashes.push([x, z]); } });
  const dashIM = new THREE.InstancedMesh(dashG, white, dashes.length);
  const dm = new THREE.Matrix4(); dashes.forEach((d, i) => { dm.makeTranslation(d[0], 0.04, d[1]); dashIM.setMatrixAt(i, dm); }); scene.add(dashIM);
  const yel = new THREE.MeshBasicMaterial({ color: 0xc9a227 });
  [-1.7, 1.7].forEach((x) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 380), yel); m.position.set(x, 0.05, -110); scene.add(m); });
  const dashX = []; for (let x = -140; x < 140; x += 6) { if (Math.abs(x) < 11) continue; dashX.push(x); }
  const dashXIM = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 0.04, 0.18), white, dashX.length);
  dashX.forEach((x, i) => { dm.makeTranslation(x, 0.04, -12); dashXIM.setMatrixAt(i, dm); }); scene.add(dashXIM);
  // faixas de pedestre
  const zebra = [];
  [-2.4, -21.6].forEach((z) => { for (let x = -9.4; x <= 9.4; x += 1.1) zebra.push([x, z]); });
  [-11.2, 11.2].forEach((x) => { for (let z = -19; z <= -5; z += 1.1) zebra.push([x, z, 1]); });
  const zebraIM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.045, 3.0), white, zebra.length);
  zebra.forEach((p, i) => { if (p[2]) { dm.makeRotationY(Math.PI / 2); dm.setPosition(p[0], 0.045, p[1]); } else dm.makeTranslation(p[0], 0.045, p[1]); zebraIM.setMatrixAt(i, dm); });
  scene.add(zebraIM);

  // rachaduras
  const crackA = crackTexture(3, 60, 2.2), crackB = crackTexture(5, 130, 4.0);
  const crackMats = [crackA, crackB].map((tx, k) => { tx.repeat.set(k ? 3 : 4, 14); return new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 - k }); });
  const crackPlanes = crackMats.map((m, k) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(22, 380), m); p.rotation.x = -Math.PI / 2; p.position.set(0, 0.07 + k * 0.01, -110); scene.add(p); return p; });
  const crackX = crackMats.map((m) => m.clone());
  crackX.forEach((m, k) => { const tx = m.map.clone(); tx.needsUpdate = true; tx.repeat.set(10, 1.3); m.map = tx; const p = new THREE.Mesh(new THREE.PlaneGeometry(280, 17), m); p.rotation.x = -Math.PI / 2; p.position.set(0, 0.075 + k * 0.01, -12); scene.add(p); });

  // lajes do asfalto levantadas
  const SL = 70;
  const slabIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.35, 1), L(0x3a3d41), SL);
  slabIM.castShadow = slabIM.receiveShadow = true;
  const slabData = [];
  for (let i = 0; i < SL; i++) slabData.push({ x: (R() - 0.5) * 19, z: 70 - R() * 330, sx: 2 + R() * 4, sz: 2 + R() * 4, ax: (R() - .5) * 0.7, az: (R() - .5) * 0.7, rise: 0.2 + R() * 1.3, t0: 12 + R() * 48, ry: R() * 3 });
  scene.add(slabIM);

  // fendas (abismos)
  const rifts = [];
  function riftShape(len, w, seed) {
    const r = rng(seed); const s = new THREE.Shape(); const n = 14;
    const left = [], right = [];
    for (let i = 0; i <= n; i++) { const u = i / n; const ww = w * Math.sin(Math.PI * u) * (0.6 + r() * 0.8); const xx = (r() - .5) * 1.6; left.push([xx - ww / 2, u * len]); right.push([xx + ww / 2, u * len]); }
    s.moveTo(left[0][0], left[0][1]); left.forEach((p) => s.lineTo(p[0], p[1])); right.reverse().forEach((p) => s.lineTo(p[0], p[1]));
    return new THREE.ShapeGeometry(s);
  }
  [[-3, 20, 1, 5, 52, 3.4], [2, -34, 1.1, 26, 56, 2.8], [-5, 8, 0.7, 12, 60, 2.2], [4, -70, 1.4, 34, 58, 3.6], [-1, -120, 1.2, 40, 62, 2.4], [-6, -12, 0.45, 20, 54, 2.6]].forEach(([x, z, , len, t0, w], i) => {
    const m = new THREE.Mesh(riftShape(len, w, 90 + i), new THREE.MeshBasicMaterial({ color: 0x050505 }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.12, z); m.rotation.z = (R() - 0.5) * 0.5; m.scale.set(0, 0, 0); scene.add(m);
    rifts.push({ m, t0: t0 - 22 + i * 3, t1: t0 + 8 + i * 2 });
  });

  // ---------------------------------------------------------------- prédios
  const defs = []; // x,z,w,d,h, wall color, style
  const left = (z0, z1, w, h, c, o = {}) => defs.push({ x: -17 - w / 2 - (o.off || 0), z: (z0 + z1) / 2, w, d: z1 - z0, h, c, ...o });
  const right = (z0, z1, w, h, c, o = {}) => defs.push({ x: 17 + w / 2 + (o.off || 0), z: (z0 + z1) / 2, w, d: z1 - z0, h, c, ...o });
  left(28, 56, 26, 24, '#8d3b2d', { shop: 1, awning: '#d9c37a', key: 'red' });
  left(8, 28, 30, 36, '#d6c79d', { shop: 1 });
  left(-4, 8, 22, 21, '#c47657', { shop: 1, awning: '#2d6b6e' });
  left(-36, -20, 26, 58, '#d7cbab');
  left(-62, -36, 30, 40, '#b57a5c', { shop: 1 });
  left(-96, -62, 36, 74, '#cfc19d');
  left(-140, -96, 34, 38, '#c28b63');
  left(-190, -140, 40, 66, '#d4c8a8');
  left(-250, -190, 44, 88, '#c9bb98');
  right(34, 60, 26, 18, '#caa64b', { shop: 1, awning: '#b33a2a' });
  right(14, 34, 28, 44, '#dcd2b6');
  right(-4, 14, 24, 26, '#a85f4a', { shop: 1 });
  right(-36, -20, 24, 31, '#c98f5e', { shop: 1 });
  right(-70, -36, 30, 64, '#dad1b6');
  right(-100, -70, 28, 27, '#b9654d');
  right(-150, -100, 32, 50, '#cdbf9f');
  right(-205, -150, 36, 76, '#d3c7a6');
  right(-260, -205, 40, 58, '#c2b090');
  // segunda fileira (atrás)
  left(20, 56, 28, 62, '#d9ceb0', { off: 30 });
  left(-40, -4, 30, 48, '#c8b996', { off: 31 });
  left(-100, -50, 30, 92, '#d2c8aa', { off: 37 });
  right(24, 60, 30, 70, '#d6cbb0', { off: 30 });
  right(-60, -4, 34, 56, '#c9bd9c', { off: 31 });
  right(-130, -70, 34, 100, '#d0c6a8', { off: 36 });

  const lightsMat = []; // materiais com janelas
  const buildings = [];
  const winMatFor = (tex, wall) => {
    const m = new THREE.MeshLambertMaterial({ color: 0xffffff, map: tex.map, emissive: 0xffffff, emissiveMap: tex.emi, flatShading: true });
    patchWindows(m); return m;
  };
  const roofMat = L(0x4b4742);
  defs.forEach((d, i) => {
    const rr = rng(200 + i);
    const rowsN = Math.max(2, Math.round(d.h / 3.3));
    const colsX = Math.max(2, Math.round(d.d / 3.6)); // faces ±x mostram a profundidade (z)
    const colsZ = Math.max(2, Math.round(d.w / 3.6));
    const fx = facade(colsX, rowsN, d.c, 300 + i, { shop: d.shop, awning: d.awning, lit: 0.62 });
    const fz = facade(colsZ, rowsN, d.c, 700 + i, { shop: d.shop, awning: d.awning, lit: 0.62 });
    const mx = winMatFor(fx), mz = winMatFor(fz);
    const geo = new THREE.BoxGeometry(d.w, d.h, d.d); geo.translate(0, d.h / 2, 0);
    const mesh = new THREE.Mesh(geo, [mx, mx, roofMat, roofMat, mz, mz]);
    mesh.castShadow = mesh.receiveShadow = true;
    const g = new THREE.Group(); g.position.set(d.x, 0, d.z); g.add(mesh);
    // caixa d'água / coroamento
    if (d.h < 45 && rr() < 0.5) { const w = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.4, 8), L(0x6b5a48)); w.position.set((rr() - .5) * d.w * .5, d.h + 1.5, (rr() - .5) * d.d * .5); w.castShadow = true; mesh.add(w); }
    scene.add(g);
    // escalonamento do colapso: dispersa por faixas de tempo
    const order = i;
    const survivor = (i === 5 || i === 13);
    const base = [47.5, 38.5, 23, 45, 36, 64, 44, 56, 60.5, 19.5, 42, 27.5, 34, 65, 53.5 + 0, 51, 63.5, 53, 49, 40, 58, 57, 54, 62][i] ?? (45 + (i * 7) % 15);
    const dur = 2.4 + rr() * 2.2 + d.h / 40;
    const b = {
      g, mesh, d, rr, tS: base, tE: base + dur, ratio: survivor ? 0.6 : 0.07 + rr() * 0.17, tiltX: (rr() - .5) * 0.5, tiltZ: (rr() - .5) * 0.5,
      survivor, phase: rr() * 6.28, mats: [mx, mz, roofMat], debris: [], rubble: null, dust: [],
    };
    // pilha de entulho
    const rub = new THREE.Group(); rub.position.set(d.x, 0, d.z); rub.scale.y = 0.0001;
    const rc = [hex(d.c).multiplyScalar(0.55).lerp(hex(0x6a6258), 0.5), hex(0x6a6258), hex(0x8a8276), hex(0x4a4640)];
    const nPieces = 12 + Math.floor(d.w / 3);
    for (let k = 0; k < nPieces; k++) {
      const sz = 2 + rr() * Math.min(7, d.w / 3);
      const p = new THREE.Mesh(new THREE.BoxGeometry(sz, 1 + rr() * 3.5 * b.ratio * 5 + 1, sz * (0.6 + rr() * 0.9)), L(rc[Math.floor(rr() * rc.length)]));
      p.position.set((rr() - .5) * (d.w + 6), p.geometry.parameters.height / 2 - 0.2, (rr() - .5) * (d.d + 6));
      p.rotation.set((rr() - .5) * .5, rr() * 3, (rr() - .5) * .5); p.castShadow = p.receiveShadow = true; rub.add(p);
    }
    scene.add(rub); b.rubble = rub;
    // poeira
    for (let k = 0; k < 6; k++) b.dust.push({ tb: b.tS + rr() * (b.tE - b.tS), x: d.x + (rr() - .5) * d.w, z: d.z + (rr() - .5) * d.d, sz: 14 + rr() * 20 + d.h * 0.2, rise: 0.8 + rr() * 1.4, cap: d.h * 0.4 + 6, life: 9 + rr() * 8, far: clamp(1.25 - Math.abs(d.z - 60) / 260, 0.3, 1) });
    buildings.push(b);
    EVENTS.push({ t: (b.tS + b.tE) / 2, type: 'collapse', size: clamp(d.h / 70, 0.2, 1.2), dur });
  });

  // detritos balísticos
  const DEB_PER = 30;
  const debN = buildings.length * DEB_PER;
  const debIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), debN);
  debIM.castShadow = true; debIM.frustumCulled = false;
  const debData = [];
  buildings.forEach((b, bi) => {
    const rr = rng(5000 + bi);
    for (let k = 0; k < DEB_PER; k++) {
      const a = rr() * Math.PI * 2, sp = 1 + rr() * 6.5 * (0.7 + b.d.h / 100), sz = 1.0 + rr() * (2.0 + b.d.w / 9);
      const y0 = b.d.h * (0.25 + rr() * 0.75);
      const p = { tl: b.tS + rr() * (b.tE - b.tS) * 0.95, x0: b.d.x + (rr() - .5) * b.d.w, z0: b.d.z + (rr() - .5) * b.d.d, y0, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: rr() * 2, sz, sp: (rr() - .5) * 6, ax: new THREE.Vector3(rr() - .5, rr(), rr() - .5).normalize(), c: k % 3 === 0 ? 0x6e675c : hex(b.d.c).multiplyScalar(0.7).getHex(), sy: 0.5 + rr() * 0.8 };
      p.tLand = (p.vy + Math.sqrt(p.vy * p.vy + 19.6 * (p.y0 - 0.5))) / 9.8; debData.push(p);
      debIM.setColorAt(bi * DEB_PER + k, new THREE.Color(p.c));
    }
  });
  scene.add(debIM);

  // poeira (sprites)
  const puff = puffTexture();
  const dustSprites = [];
  buildings.forEach((b) => b.dust.forEach((d) => {
    const m = new THREE.SpriteMaterial({ map: puff, color: 0x9a8f80, transparent: true, depthWrite: false, opacity: 0 });
    const s = new THREE.Sprite(m); s.visible = false; scene.add(s); d.s = s; dustSprites.push(d);
  }));

  // ---------------------------------------------------------------- carros
  const cars = [];
  function makeCar(kind, color) {
    const g = new THREE.Group();
    if (kind === 'bus') {
      const b = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.7, 10.5), L(0xe6e3dc)); b.position.y = 1.9;
      const st = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.5, 10.55), L(0xc23a2e)); st.position.y = 1.0;
      const gl = new THREE.Mesh(new THREE.BoxGeometry(2.66, 0.9, 9.6), L(0x1c2630)); gl.position.y = 2.25;
      const un = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 9.8), L(0x1a1a1a)); un.position.y = 0.4;
      [b, st, gl, un].forEach((m) => { m.castShadow = true; g.add(m); });
    } else {
      const col = color;
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 4.2), L(col)); b.position.y = 0.75;
      const gl = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.62, 2.2), L(0x1d2731)); gl.position.set(0, 1.4, -0.1);
      const rf = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.1, 1.9), L(col)); rf.position.set(0, 1.75, -0.1);
      const un = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.3, 3.8), L(0x151515)); un.position.y = 0.3;
      [b, gl, rf, un].forEach((m) => { m.castShadow = true; g.add(m); });
      if (kind === 'taxi') { const sg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.3), L(0xf4f1e6)); sg.position.set(0, 1.9, -0.1); g.add(sg); const stp = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.12, 4.22), L(0x2d5db8)); stp.position.y = 0.88; g.add(stp); }
    }
    scene.add(g); return g;
  }
  const carSpec = [
    ['taxi', 0xe8b923, 3.0, 1, 30, 9], ['taxi', 0xe8b923, 5.9, 1, 8, 8.5], ['car', 0xb8b8b4, 8.8, 1, 52, 8], ['bus', 0, 8.8, 1, 18, 7], ['taxi', 0xe8b923, 3.0, 1, -6, 8], ['car', 0x2a2d33, 5.9, 1, 66, 9.5],
    ['car', 0x6b1f1f, -3.0, -1, 14, 8.5], ['taxi', 0xe8b923, -5.9, -1, 30, 9], ['bus', 0, -8.8, -1, 4, 7], ['car', 0xf0efe8, -8.8, -1, 46, 8], ['taxi', 0xe8b923, -3.0, -1, 56, 8.5], ['car', 0x2d4a7a, -5.9, -1, -10, 9],
    ['taxi', 0xe8b923, 3.0, 1, -60, 9], ['car', 0xb8b8b4, -5.9, -1, -50, 9], ['taxi', 0xe8b923, 5.9, 1, -90, 9], ['bus', 0, -3.0, -1, -80, 8], ['car', 0x7a2020, 8.8, 1, -120, 8], ['taxi', 0xe8b923, -8.8, -1, -150, 8],
  ];
  carSpec.forEach((s, i) => {
    const g = makeCar(s[0], s[1]); const rr = rng(900 + i);
    cars.push({ g, kind: s[0], x: s[2], dir: s[3], z0: s[4], v: s[5], rr, tD0: 14 + rr() * 40, flip: rr() < 0.3, rx: (rr() - .5) * 1.0, rz: (rr() - .5) * 1.1, ry: (rr() - .5) * 2.4, cross: false, baseCol: g.children[0].material.color.clone() });
  });
  // dois carros na transversal
  [['taxi', 0xe8b923, -9, 1, -60, 8], ['car', 0xd8d4c8, -15, -1, 40, 8]].forEach((s, i) => { const g = makeCar(s[0], s[1]); g.rotation.y = Math.PI / 2; const rr = rng(1200 + i); cars.push({ g, kind: s[0], x: s[2], dir: s[3], z0: s[4], v: s[5], rr, tD0: 20 + rr() * 20, flip: false, rx: .3, rz: .4, ry: 1, cross: true, baseCol: g.children[0].material.color.clone() }); });
  cars.forEach((c) => { if (!c.cross && c.dir > 0) c.g.rotation.y = 0; if (!c.cross && c.dir < 0) c.g.rotation.y = Math.PI; });

  // ---------------------------------------------------------------- pessoas
  const people = [];
  const shirt = [0xe6c229, 0x2a9d4a, 0x2f6fd0, 0xd23d3d, 0xf2f2f2, 0xff8a1f, 0x8e44ad];
  for (let i = 0; i < 18; i++) {
    const rr = rng(1500 + i); const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.34), L(shirt[Math.floor(rr() * shirt.length)])); body.position.y = 1.0;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), L(rr() < .5 ? 0xc68a5e : 0x8d5a3c)); head.position.y = 1.7;
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.3), L(0x2a3140)); legs.position.y = 0.28;
    [body, head, legs].forEach((m) => { m.castShadow = true; g.add(m); });
    const side = i % 2 ? 1 : -1; const x = side * (11.3 + rr() * 4.5);
    scene.add(g);
    people.push({ g, x, z0: 50 - i * 6 + rr() * 4, dirz: rr() < .5 ? 1 : -1, v: 1.1 + rr() * .5, tFlee: 7.4 + rr() * 5, tGone: 0, side, rr });
    people[i].tGone = people[i].tFlee + 3 + rr() * 6;
  }

  // ---------------------------------------------------------------- palmeiras imperiais
  function palmGeo() {
    const parts = [];
    const trunk = new THREE.CylinderGeometry(0.3, 0.46, 10.4, 6).toNonIndexed(); trunk.translate(0, 5.2, 0); parts.push([trunk, [0.66, 0.62, 0.55]]);
    const bulge = new THREE.CylinderGeometry(0.46, 0.34, 1.6, 6).toNonIndexed(); bulge.translate(0, 1.4, 0); parts.push([bulge, [0.7, 0.66, 0.58]]);
    const shaft = new THREE.CylinderGeometry(0.34, 0.3, 1.5, 6).toNonIndexed(); shaft.translate(0, 10.9, 0); parts.push([shaft, [0.36, 0.55, 0.26]]);
    for (let i = 0; i < 9; i++) {
      const f = new THREE.BoxGeometry(0.42, 0.1, 5.6).toNonIndexed(); f.translate(0, 0, 2.8); f.rotateX(0.5 + (i % 2) * 0.25); f.rotateY((i / 9) * Math.PI * 2); f.translate(0, 11.6, 0);
      parts.push([f, [0.26 + (i % 3) * .03, 0.5, 0.2]]);
    }
    parts.forEach(([g, c]) => { const n = g.attributes.position.count; const col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); });
    return mergeGeometries(parts.map((p) => p[0]));
  }
  const palmG = palmGeo(); const palmM = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const palms = [];
  const palmPos = [];
  for (let z = 50; z > -250; z -= 14) { if (z < -2 && z > -22) continue; palmPos.push([0, z]); }
  for (let z = 44; z > -250; z -= 27) { if (z < 0 && z > -24) continue; palmPos.push([-11.4, z], [11.4, z - 6]); }
  palmPos.forEach((p, i) => {
    const rr = rng(2000 + i); const m = new THREE.Mesh(palmG, palmM); m.castShadow = true; const g = new THREE.Group(); g.add(m); g.position.set(p[0], 0.3, p[1]); g.rotation.y = rr() * 6; const s = 0.9 + rr() * 0.35; g.scale.setScalar(s * 0.66); scene.add(g);
    palms.push({ g, rr, tF: 18 + rr() * 52, dir: rr() * Math.PI * 2, falls: rr() < 0.65, ph: rr() * 6 });
  });

  // ---------------------------------------------------------------- postes
  const poles = [];
  const poleMat = L(0x3b3f44);
  [[-11, 30], [11, 14], [-11, -2], [11, -22], [-11, -22], [11, -60], [-11, -80], [11, -110], [-11, -140], [11, -170], [-11, 56]].forEach((p, i) => {
    const g = new THREE.Group(); const rr = rng(2500 + i);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 9, 6), poleMat); pole.position.y = 4.5; pole.castShadow = true;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(5, 0.14, 0.14), poleMat); arm.position.set(-Math.sign(p[0]) * 2.5, 8.7, 0);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.4), L(0x20242a)); lamp.position.set(-Math.sign(p[0]) * 4.6, 8.0, 0);
    const lampOn = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.1), new THREE.MeshBasicMaterial({ color: 0xff3b2e })); lampOn.position.set(-Math.sign(p[0]) * 4.6, 8.3, 0.22);
    g.add(pole, arm, lamp, lampOn); g.position.set(p[0], 0.3, p[1]); scene.add(g);
    poles.push({ g, tF: 20 + rr() * 38, dir: (rr() - .5) * 2.4, ang: 0.9 + rr() * 0.7, lampOn });
  });

  // ---------------------------------------------------------------- árvores (epílogo)
  function treeGeo() {
    const parts = [];
    const tr = new THREE.CylinderGeometry(0.28, 0.4, 5, 5).toNonIndexed(); tr.translate(0, 2.5, 0); parts.push([tr, [0.32, 0.22, 0.14]]);
    const cn = new THREE.IcosahedronGeometry(3.1, 0).toNonIndexed(); cn.scale(1, 0.88, 1); cn.translate(0, 6.2, 0); parts.push([cn, [0.43, 0.63, 0.27]]);
    const c2 = new THREE.IcosahedronGeometry(2.1, 0).toNonIndexed(); c2.translate(1.7, 5.0, 0.5); parts.push([c2, [0.36, 0.56, 0.24]]);
    parts.forEach(([g, c]) => { const n = g.attributes.position.count; const col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); });
    return mergeGeometries(parts.map((p) => p[0]));
  }
  const treeG = treeGeo(); const treeM = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const trees = [];
  function addTree(x, y, z, t0, s) { const m = new THREE.Mesh(treeG, treeM); m.castShadow = m.receiveShadow = true; m.position.set(x, y, z); m.scale.setScalar(0.0001); m.rotation.y = R() * 6; scene.add(m); trees.push({ m, t0, s, tg: 6 + R() * 5 }); }
  for (let i = 0; i < 130; i++) {
    const z = 60 - R() * 250; const roadSide = R();
    let x = roadSide < .55 ? (R() - .5) * 20 : (R() < .5 ? -1 : 1) * (11 + R() * 7);
    addTree(x, 0.2, z, 72 + R() * 11, 0.55 + R() * 0.95);
  }
  buildings.forEach((b) => { const n = b.d.h > 40 ? 2 : 3; for (let k = 0; k < n; k++) addTree(b.d.x + (b.rr() - .5) * b.d.w * 0.7, b.d.h * (b.survivor ? 1 : b.ratio) + 0.2, b.d.z + (b.rr() - .5) * b.d.d * 0.7, 74 + b.rr() * 9, 0.7 + b.rr() * 1.0); });

  // capim cobrindo a rua no epílogo
  const grassOverlay = new THREE.Mesh(new THREE.PlaneGeometry(60, 420), new THREE.MeshLambertMaterial({ map: (() => { const t = grassTexture(); t.repeat.set(5, 30); return t; })(), transparent: true, opacity: 0, depthWrite: false }));
  grassOverlay.rotation.x = -Math.PI / 2; grassOverlay.position.set(0, 0.12, -110); grassOverlay.receiveShadow = true; scene.add(grassOverlay);

  // ---------------------------------------------------------------- Corcovado + Cristo
  const mtn = (() => {
    const g = new THREE.IcosahedronGeometry(1, 4); const p = g.attributes.position; const rr = rng(77);
    const col = new Float32Array(p.count * 3); let top = { y: -1 };
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const nzv = 1 + 0.07 * Math.sin(x * 9 + z * 5) + 0.06 * Math.sin(z * 11 - x * 3) + 0.04 * Math.sin(x * 21 + z * 17);
      y = Math.max(y, 0); const k = Math.pow(y, 0.82);
      const X = x * 330 * nzv, Z = z * 250 * nzv, Y = (y > 0 ? k * 86 * (0.9 + 0.1 * nzv) : 0);
      p.setXYZ(i, X, Y, Z);
      const h = Y / 86; const gcol = new THREE.Color().setHSL(0.30 - 0.03 * h, 0.35 + 0.1 * (1 - h), 0.22 + 0.17 * h);
      if (h > 0.86) gcol.lerp(new THREE.Color(0x8d958a), (h - 0.86) * 4);
      col[i * 3] = gcol.r; col[i * 3 + 1] = gcol.g; col[i * 3 + 2] = gcol.b;
      if (Y > top.y) top = { y: Y, x: X, z: Z };
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    m.position.set(10, 0, -440); m.castShadow = false; scene.add(m); m.userData.top = top; return m;
  })();
  const hazeObjs = [mtn];
  // morros laterais
  [[-260, -380, 150, 70], [300, -420, 160, 60], [-120, -520, 200, 45], [150, -600, 220, 38]].forEach(([x, z, r, h], i) => {
    const g = new THREE.IcosahedronGeometry(1, 3); const p = g.attributes.position; const col = new Float32Array(p.count * 3);
    for (let k = 0; k < p.count; k++) { const nzv = 1 + 0.08 * Math.sin(p.getX(k) * 8 + i) + 0.06 * Math.sin(p.getZ(k) * 12); const y = Math.max(0, p.getY(k)); p.setXYZ(k, p.getX(k) * r * nzv, y * h * nzv, p.getZ(k) * r * 0.8 * nzv); const c = new THREE.Color().setHSL(0.31, 0.32, 0.2 + 0.12 * y); col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })); m.position.set(x, 0, z); scene.add(m); hazeObjs.push(m);
  });
  // Cristo
  const cristo = new THREE.Group();
  const cm = new THREE.MeshLambertMaterial({ color: 0xf3f1ea, emissive: 0x6a6860, flatShading: true });
  const ped = new THREE.Mesh(new THREE.BoxGeometry(7, 9, 7), cm);
  const pedStep = new THREE.Mesh(new THREE.BoxGeometry(9, 2, 9), new THREE.MeshLambertMaterial({ color: 0xcfcab8, flatShading: true }));
  pedStep.position.y = 1; ped.position.y = 6.5; cristo.add(pedStep, ped);
  const figure = new THREE.Group(); figure.position.y = 11; cristo.add(figure);
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 3.4, 20, 6), cm); robe.position.y = 10;
  const head = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4, 3.2), cm); head.position.y = 22.2;
  const armL = new THREE.Mesh(new THREE.BoxGeometry(14, 2.8, 2.6), cm); armL.position.set(-8.8, 17.6, 0);
  const armR = armL.clone(); armR.position.x = 8.8;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.6, 3.0), cm); neck.position.y = 19.3;
  [robe, head, armL, armR, neck].forEach((m) => { m.castShadow = false; figure.add(m); });
  [ped, pedStep, robe, head, armL, armR, neck].forEach((m) => hazeObjs.push(m));
  const CR = 2.3; // exagero estilizado
  cristo.scale.setScalar(CR);
  const top = mtn.userData.top; cristo.position.set(mtn.position.x + top.x, top.y - 1, mtn.position.z + top.z);
  scene.add(cristo);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, color: 0xfff0c8, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(120, 120, 1); glow.position.set(cristo.position.x, cristo.position.y + 38, cristo.position.z + 3); scene.add(glow);
  const pieces = [robe, head, armL, armR, neck].map((m) => ({ m, p0: m.position.clone(), r0: m.rotation.clone(), v: new THREE.Vector3((Math.random() * 0), 0, 0) }));
  const cr = rng(31); const pieceV = pieces.map(() => ({ vx: (cr() - .5) * 8, vz: 6 + cr() * 8, vy: 3 + cr() * 5, spx: (cr() - .5) * 5, spz: (cr() - .5) * 5, spy: (cr() - .5) * 5 }));
  EVENTS.push({ t: TL.cristoFall + 2.6, type: 'cristo' });
  // pedaços que se soltam: 'poeira do pico'
  const peakDust = []; for (let k = 0; k < 8; k++) { const m = new THREE.SpriteMaterial({ map: puff, color: 0xb8aea0, transparent: true, depthWrite: false, opacity: 0 }); const s = new THREE.Sprite(m); s.visible = false; scene.add(s); peakDust.push({ s, o: new THREE.Vector3((cr() - .5) * 12, cr() * 8, (cr() - .3) * 14), sz: 30 + cr() * 40 }); }

  // ---------------------------------------------------------------- blocos à deriva (poeira densa)
  const DR = 46;
  const driftIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), DR);
  for (let i = 0; i < DR; i++) driftIM.setColorAt(i, new THREE.Color([0x55493e, 0x3c322b, 0x7a4a3a, 0x2a231f, 0x6a645a][i % 5]));
  driftIM.frustumCulled = false; scene.add(driftIM);
  const driftData = []; { const rr = rng(4400); for (let i = 0; i < DR; i++) driftData.push({ x: (rr() - .5) * 60, y: rr() * 60 - 5, z: 70 - rr() * 150, sx: 2 + rr() * 7, sy: 1 + rr() * 4, sz: 2 + rr() * 6, vx: (rr() - .5) * 1.5, vy: -1.5 - rr() * 2.5, rx: rr() * 3, ry: rr() * 3, sp: (rr() - .5) * 0.6 }); }

  // ---------------------------------------------------------------- raios de luz + pássaros
  const rayMat = new THREE.MeshBasicMaterial({ map: rayTexture(), color: 0xffe2a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const rays = []; for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(10 + i * 3, 190), rayMat); p.position.set(30 + i * 9, 62, -70 - i * 14); p.rotation.set(0, -0.3, 0.52); scene.add(p); rays.push(p); }
  const birdG = new THREE.BufferGeometry(); birdG.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, -1.4, 0.4, 0.5, -0.2, 0, 0.3, 0, 0, 0, 1.4, 0.4, 0.5, 0.2, 0, 0.3]), 3));
  const birdM = new THREE.MeshBasicMaterial({ color: 0x1b1b18, side: THREE.DoubleSide, fog: false });
  const birds = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(birdG, birdM); scene.add(m); birds.push({ m, o: new THREE.Vector3((R() - .5) * 60, 28 + R() * 30, -R() * 70), ph: R() * 6 }); }

  // ---------------------------------------------------------------- spikes (para câmera)
  const spikes = EVENTS.filter((e) => e.type === 'collapse' || e.type === 'cristo').map((e) => ({ t: e.t - 0.3, a: e.type === 'cristo' ? 1.6 : 0.5 + (e.size || 0.5) * 0.8 }));
  EVENTS.push({ t: QE, type: 'stop' });
  EVENTS.sort((a, b) => a.t - b.t);

  const hazeK = { v: 0.4 };
  hazeObjs.forEach((o) => { o.onBeforeRender = () => { hazeK.keep = scene.fog.density; scene.fog.density = hazeK.keep * hazeK.v; }; o.onAfterRender = () => { scene.fog.density = hazeK.keep; }; });
  // ---------------------------------------------------------------- estado por frame
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3(), tmpE = new THREE.Euler();
  const lightKeys = SB.lighting.keys;
  function lightAt(t) {
    let i = 1; while (i < lightKeys.length - 1 && t > lightKeys[i][0]) i++;
    const a = lightKeys[i - 1], b = lightKeys[i]; const u = clamp((t - a[0]) / (b[0] - a[0]));
    const cA = hex(a[1]), cB = hex(b[1]), fA = hex(a[2]), fB = hex(b[2]), sA = hex(a[6]), sB = hex(b[6]);
    return { sky: cA.lerp(cB, u), fog: fA.lerp(fB, u), dens: lerp(a[3], b[3], u), sun: lerp(a[4], b[4], u), hemi: lerp(a[5], b[5], u), sunC: sA.lerp(sB, u), win: lerp(a[7], b[7], u) };
  }
  function quakeAmp(t) {
    if (t < QS || t >= QE) return 0;
    return sstep(QS, QS + 1.8, t) * (0.5 + 0.5 * sstep(QS + 2, 40, t));
  }
  function spikeAt(t) { let s = 0; for (const k of spikes) if (t >= k.t) s += k.a * Math.exp(-(t - k.t) / 0.9); return t >= QE ? 0 : s; }

  function update(t) {
    const qa = quakeAmp(t), sp = spikeAt(t);
    const Lt = lightAt(t);
    scene.background.copy(Lt.fog); scene.fog.color.copy(Lt.fog); scene.fog.density = Lt.dens;
    hemi.intensity = Lt.hemi; sun.intensity = Lt.sun; sun.color.copy(Lt.sunC);
    hemi.color.copy(Lt.fog).lerp(new THREE.Color(0xffffff), 0.35);
    const elev = lerp(1.05, 0.62, sstep(68, 84, t)); // elevação do sol (rad)
    const az = lerp(0.9, 1.5, sstep(66, 86, t));
    sun.position.set(sun.target.position.x + Math.cos(elev) * Math.sin(az) * 260, Math.sin(elev) * 260, sun.target.position.z + Math.cos(elev) * Math.cos(az) * 260);
    sun.castShadow = Lt.sun > 0.2;
    // janelas
    const night = Lt.win;
    winU.uOn.value = t < 11 ? 0 : sstep(11, 15.5, t);
    winU.uOff.value = sstep(57.5, 64.5, t);
    // cor do tijolo -> musgo no epílogo
    const moss = sstep(74, 86, t);

    // câmera
    const f = t * 19.0, a = qa * 0.22 + sp * 0.5;
    camera.userData.shake = { x: a * 0.34 * nz(f), y: a * 0.30 * nz(f * 1.31 + 9), z: a * 0.22 * nz(f * 0.87 + 4), r: a * 0.0075 * nz(f * 1.1 + 2) };

    // prédios
    let standing = 0;
    for (const b of buildings) {
      const s = sstep(b.tS, b.tE, t), s2 = Math.pow(s, 1.5);
      const pre = sstep(QS, b.tS, t) * (1 - sstep(QE - 0.5, QE, t));
      const sway = (qa * 0.0014 * b.d.h / 40) * nz(t * 11 + b.phase) + pre * 0.01 * nz(t * 5 + b.phase) * (1 - s);
      const g = b.g;
      g.scale.y = lerp(1, b.ratio, s2) ; g.scale.x = g.scale.z = 1 + 0.1 * s;
      g.rotation.set(b.tiltX * s * (1 - 0.45 * s) + sway, 0, b.tiltZ * s * (1 - 0.45 * s) + sway * 0.8);
      const j = Math.sin(s * Math.PI) * (b.d.w * 0.015) * Math.sin(t * 43 + b.phase);
      g.position.set(b.d.x + j, -s * 0.8 * (b.survivor ? 0 : 1), b.d.z);
      b.rubble.scale.y = Math.max(0.0001, sstep(b.tS + (b.tE - b.tS) * 0.35, b.tE, t));
      if (s < 0.5 || b.survivor) standing++;
      // tom de musgo/ruína nos materiais
      const tone = lerp(1, 0.78, sstep(30, 60, t) * (1 - moss)) ;
      b.mats[0].color.setRGB(tone, tone, tone).lerp(new THREE.Color(0.62, 0.85, 0.52), moss * 0.55);
      b.mats[1].color.copy(b.mats[0].color);
    }
    update.standingPct = Math.round(100 * standing / buildings.length);

    // detritos
    for (let i = 0; i < debN; i++) {
      const p = debData[i];
      const tau = t - p.tl;
      if (tau < 0) { tmpM.makeScale(0, 0, 0); debIM.setMatrixAt(i, tmpM); continue; }
      let x, y, z, spin;
      if (tau < p.tLand) { x = p.x0 + p.vx * tau; z = p.z0 + p.vz * tau; y = p.y0 + p.vy * tau - 4.9 * tau * tau; spin = p.sp * tau; }
      else { const tl = p.tLand; x = p.x0 + p.vx * tl * 1.0 + p.vx * Math.min(tau - tl, 0.5) * 0.2; z = p.z0 + p.vz * tl + p.vz * Math.min(tau - tl, 0.5) * 0.2; y = p.sz * 0.35; spin = p.sp * tl; }
      tmpQ.setFromAxisAngle(p.ax, spin); tmpS.set(p.sz, p.sz * p.sy, p.sz * 0.9); tmpP.set(x, Math.max(y, p.sz * 0.3), z);
      tmpM.compose(tmpP, tmpQ, tmpS); debIM.setMatrixAt(i, tmpM);
    }
    debIM.instanceMatrix.needsUpdate = true; if (debIM.instanceColor) debIM.instanceColor.needsUpdate = true;

    // poeira
    const stopFade = 1 - sstep(QE, QE + 3.2, t);
    for (const d of dustSprites) {
      const tau = t - d.tb;
      if (tau < 0 || tau > d.life) { d.s.visible = false; continue; }
      const o = 0.55 * d.far * sstep(0, 1.4, tau) * (1 - sstep(d.life * 0.45, d.life, tau)) * (t >= QE ? stopFade : 1);
      d.s.visible = o > 0.01; d.s.material.opacity = o;
      const sz = d.sz * (0.5 + 0.9 * Math.min(1, tau / 5));
      d.s.scale.set(sz, sz * 0.8, 1); d.s.position.set(d.x, Math.min(3 + tau * d.rise, d.cap) + sz * 0.25, d.z);
      d.s.material.color.setHex(t > QE ? 0xb9a98c : 0x8f8678);
    }

    // rachaduras
    crackMats[0].opacity = sstep(14, 30, t) * (1 - sstep(QE + 3, QE + 9, t) * 0);
    crackMats[1].opacity = sstep(34, 56, t);
    crackX[0].opacity = crackMats[0].opacity; crackX[1].opacity = crackMats[1].opacity;
    // lajes
    const roadD = (tt) => sstep(10, 56, tt);
    slabData.forEach((s, i) => {
      const k = sstep(s.t0, s.t0 + 14, t);
      tmpE.set(s.ax * k + (qa ? nz(t * 17 + i) * 0.01 * k : 0), s.ry, s.az * k); tmpQ.setFromEuler(tmpE);
      tmpS.set(s.sx * (k > 0 ? 1 : 0.0001), 1, s.sz); tmpP.set(s.x, 0.14 + s.rise * k * 0.55, s.z);
      tmpM.compose(tmpP, tmpQ, tmpS); slabIM.setMatrixAt(i, tmpM);
    });
    slabIM.instanceMatrix.needsUpdate = true;
    rifts.forEach((r) => { const k = sstep(r.t0, r.t1, t); r.m.scale.set(k, k, 1); });

    // carros
    cars.forEach((c, i) => {
      const brake = sstep(QS - 0.2, QS + 1.8, t);
      const d = c.cross ? 1 : 1;
      const run = (t < QS ? t : QS + (1 - Math.pow(1 - clamp((t - QS) / 1.8), 2)) * 0.9);
      const adv = c.v * run * (1 - 0.0);
      const dmg = sstep(c.tD0, c.tD0 + 9, t);
      let x = c.x, z = c.z0;
      if (c.cross) { x = c.z0 + c.dir * adv; z = -12 + (c.x + 3) * 0.0 - 1.8 * c.dir; c.g.position.set(x, 0.3, z); }
      else { z = c.z0 + c.dir * adv; c.g.position.set(x + (qa > 0 ? 0 : 0) + dmg * c.rr() * 0 + c.ry * dmg * 1.4 * (c.cross ? 0 : 1), 0.3, z); }
      const jit = qa * 0.05 * nz(t * 23 + i * 3);
      const fl = c.flip ? sstep(c.tD0 + 3, c.tD0 + 5, t) * Math.PI * 0.92 : 0;
      c.g.rotation.set(c.rx * dmg * 0.5 + jit, c.g.rotation.y, c.rz * dmg * 0.7 + fl * (c.flip ? 1 : 0) + jit);
      c.g.position.y = 0.3 + (c.flip ? sstep(c.tD0 + 3, c.tD0 + 5, t) * 1.4 : 0) - dmg * 0.25 + (qa > 0 ? Math.abs(nz(t * 29 + i)) * 0.05 * qa : 0);
      if (c.cross) c.g.rotation.y = Math.PI / 2;
      // ferrugem/musgo
      const rust = sstep(70, 84, t);
      c.g.children.forEach((m, k) => { if (m.material && m.material.color && k !== 1 && c.g.children[0] === c.g.children[0]) { /* tinge só carroceria */ } });
      c.g.children[0].material.color.copy(c.baseCol).lerp(new THREE.Color(0x55493b), rust * 0.9);
    });

    // pessoas
    for (const p of people) {
      const visible = t < p.tGone;
      p.g.visible = visible; if (!visible) continue;
      const walk = Math.min(t, p.tFlee);
      let z = p.z0 + p.dirz * p.v * walk, x = p.x;
      if (t > p.tFlee) { const u = (t - p.tFlee) / (p.tGone - p.tFlee); x = p.x + (p.side > 0 ? 1 : -1) * 6.5 * u; z += p.dirz * 3 * u; p.g.scale.setScalar(1 - 0.0 * u); }
      const stumble = t > QS ? qa * 0.5 * nz(t * 13 + p.z0) : 0;
      p.g.position.set(x, 0.28 + Math.abs(Math.sin(t * 7 + p.z0)) * 0.06, z);
      p.g.rotation.set(stumble * 0.5, p.dirz > 0 ? 0 : Math.PI, stumble * 0.8);
      if (t > p.tFlee) p.g.position.y += Math.abs(Math.sin(t * 14)) * 0.12;
    }

    // palmeiras
    for (const p of palms) {
      const sway = qa * 0.012 * nz(t * 6 + p.ph);
      const fall = p.falls ? sstep(p.tF, p.tF + 2.2, t) : 0;
      p.g.rotation.x = sway + Math.cos(p.dir) * fall * 1.35; p.g.rotation.z = sway * 0.8 + Math.sin(p.dir) * fall * 1.35;
    }
    for (const p of poles) { const k = sstep(p.tF, p.tF + 1.8, t); p.g.rotation.z = p.dir * k * p.ang * 0.8 + qa * 0.004 * nz(t * 9); p.g.rotation.x = Math.sin(p.dir * 3) * k * 0.4; if (t > QS + 2) p.lampOn.visible = Math.floor(t * 1.2 + p.ang * 5) % 2 === 0 && t < 56; }

    // vegetação
    for (const tr of trees) { const k = sstep(tr.t0, tr.t0 + 8, t); tr.m.scale.setScalar(Math.max(0.0001, k * tr.s)); }
    grassOverlay.material.opacity = sstep(73, 86, t) * 0.92;
    grassOverlay.material.color.setScalar(1);

    // Cristo
    const tc = TL.cristoFall;
    const shake = t > tc - 2.5 && t < tc ? Math.sin(t * 50) * 0.03 * sstep(tc - 2.5, tc, t) : 0;
    if (t < tc + 0.3) { figure.rotation.set(shake * 0.6, 0, shake); figure.position.set(0, 11, 0); pieces.forEach((pc) => { pc.m.position.copy(pc.p0); pc.m.rotation.copy(pc.r0); }); }
    else {
      const tau = t - tc;
      const th = Math.min(1.55, 0.5 * 0.5 * tau * tau);
      if (tau < 2.7) { figure.rotation.set(0, 0, -th); }
      else {
        const k = tau - 2.7; figure.rotation.set(0, 0, -1.55);
        pieces.forEach((pc, i) => { const v = pieceV[i]; pc.m.position.set(pc.p0.x + v.vx * k, pc.p0.y + v.vy * k - 4.9 * k * k, pc.p0.z + v.vz * k * 1.2 + k * k * 4); pc.m.rotation.set(pc.r0.x + v.spx * k, pc.r0.y + v.spy * k, pc.r0.z + v.spz * k); });
        figure.visible = k < 6.0; // após rolar morro abaixo some na névoa
      }
    }
    if (t < tc + 0.3) figure.visible = true;
    glow.material.opacity = 0.5 * (1 - sstep(tc, tc + 2.2, t)) * (1 - sstep(54, 59, t) * 0.7); glow.visible = glow.material.opacity > 0.01;
    peakDust.forEach((d) => { const tau = t - (tc + 2.4); if (tau < 0 || tau > 22) { d.s.visible = false; return; } const o = 0.6 * sstep(0, 1.2, tau) * (1 - sstep(8, 22, tau)); d.s.visible = true; d.s.material.opacity = o * (t >= QE ? 0.8 : 1); const sz = d.sz * (0.6 + tau * 0.13); d.s.scale.set(sz, sz * 0.85, 1); d.s.position.set(cristo.position.x + d.o.x * (1 + tau * 0.5), cristo.position.y + 4 + d.o.y + tau * 1.6, cristo.position.z + d.o.z); });

    // blocos à deriva
    const dv = sstep(56, 60, t) * (1 - sstep(QE - 0.2, QE + 0.9, t)); driftIM.visible = dv > 0.01;
    if (driftIM.visible) for (let i = 0; i < DR; i++) { const d = driftData[i]; const tt = t - 56; const y = ((d.y + d.vy * tt + 70) % 90) - 20; tmpQ.setFromEuler(tmpE.set(d.rx + d.sp * tt, d.ry + d.sp * tt * 0.7, 0)); tmpP.set(d.x + d.vx * tt, y, d.z); tmpS.set(d.sx * dv, d.sy * dv, d.sz * dv); tmpM.compose(tmpP, tmpQ, tmpS); driftIM.setMatrixAt(i, tmpM); }
    driftIM.instanceMatrix.needsUpdate = true;

    // raios e pássaros
    const rv = sstep(70.4, 74, t) * (1 - sstep(80, 86, t)); rayMat.opacity = rv * 0.1; rays.forEach((r) => (r.visible = rv > 0.01));
    birds.forEach((b) => { const k = t - 78.5; b.m.visible = k > 0 && k < 9; if (!b.m.visible) return; b.m.position.set(b.o.x + k * 3.2 - 14, b.o.y + Math.sin(k * 1.2 + b.ph) * 1.5, b.o.z); b.m.rotation.z = Math.sin(t * 9 + b.ph) * 0.35; b.m.scale.setScalar(1.6); });
  }
  return { update, EVENTS, buildings, camera };
}
