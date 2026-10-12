import * as THREE from 'three';
import { rng, clamp, sstep, lerp, nz } from './lib.js';

const SKIN = [0xf1c7a5, 0xe0ac86, 0xc68a5e, 0xa86f48, 0x8d5a3c, 0x6b4430];
const HAIR = [0x1a1410, 0x2b1d14, 0x4a3020, 0x8a6a3c, 0xd9b98a, 0x111111];
const CLOTH = [0xf2f0ea, 0x1f5fbf, 0xe8c12e, 0x2f9a53, 0xd83b3b, 0xff7a2f, 0x18233a, 0x9b4dbd, 0x40c4c0, 0xf06aa0];
const matCache = new Map();
function M(hex, rough = 0.75) {
  const k = hex + ':' + rough;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0 }));
  return matCache.get(k);
}
const G = {
  torso: new THREE.CapsuleGeometry(0.17, 0.36, 4, 10),
  pelvis: new THREE.CapsuleGeometry(0.16, 0.1, 4, 10),
  head: new THREE.SphereGeometry(0.115, 16, 12),
  hair: new THREE.SphereGeometry(0.122, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
  upperArm: new THREE.CapsuleGeometry(0.052, 0.24, 3, 8),
  lowerArm: new THREE.CapsuleGeometry(0.045, 0.22, 3, 8),
  hand: new THREE.SphereGeometry(0.05, 8, 6),
  thigh: new THREE.CapsuleGeometry(0.075, 0.34, 3, 8),
  shin: new THREE.CapsuleGeometry(0.06, 0.34, 3, 8),
  foot: new THREE.BoxGeometry(0.1, 0.06, 0.24),
  neck: new THREE.CylinderGeometry(0.05, 0.055, 0.08, 8),
  cap: new THREE.CylinderGeometry(0.125, 0.125, 0.06, 14),
  brim: new THREE.BoxGeometry(0.2, 0.015, 0.14),
  top: new THREE.CapsuleGeometry(0.175, 0.12, 4, 10),
  eye: new THREE.SphereGeometry(0.016, 8, 6),
  nose: new THREE.SphereGeometry(0.02, 8, 6),
  ear: new THREE.SphereGeometry(0.025, 8, 6),
};
function part(geo, mat, parent, x, y, z, cast = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; parent.add(m); return m; }

/** Pessoa articulada. Todas as juntas são Groups com pivô na articulação. */
export function makePerson(seed, opt = {}) {
  const R = rng(seed);
  const skin = M(SKIN[Math.floor(R() * SKIN.length)], 0.6);
  const hairM = M(HAIR[Math.floor(R() * HAIR.length)], 0.9);
  const shirtless = opt.beach ? R() < 0.45 : R() < 0.12;
  const female = R() < 0.5;
  const shirt = M(CLOTH[Math.floor(R() * CLOTH.length)]);
  const shorts = M(CLOTH[Math.floor(R() * CLOTH.length)]);
  const s = (opt.scale || 1) * (female ? 0.95 : 1.02) * (0.94 + R() * 0.12);
  const root = new THREE.Group(); root.scale.setScalar(s);
  const hips = new THREE.Group(); hips.position.y = 0.92; root.add(hips);
  part(G.pelvis, shorts, hips, 0, 0.02, 0).rotation.z = Math.PI / 2;
  const spine = new THREE.Group(); spine.position.y = 0.08; hips.add(spine);
  const torsoM = shirtless && !female ? skin : (shirtless && female ? skin : shirt);
  const torso = part(G.torso, torsoM, spine, 0, 0.26, 0); torso.scale.set(female ? 0.92 : 1.05, 1, 0.72);
  if (shirtless && female) { const t = part(G.top, shirt, spine, 0, 0.36, 0.0); t.scale.set(0.98, 0.5, 0.76); }
  part(G.neck, skin, spine, 0, 0.55, 0);
  const headG = new THREE.Group(); headG.position.y = 0.66; spine.add(headG);
  part(G.head, skin, headG, 0, 0, 0);
  const eyeM = M(0x111111, 0.3); part(G.eye, eyeM, headG, -0.04, 0.015, 0.103, false); part(G.eye, eyeM, headG, 0.04, 0.015, 0.103, false);
  part(G.nose, skin, headG, 0, -0.012, 0.112, false); part(G.ear, skin, headG, -0.112, 0, 0, false); part(G.ear, skin, headG, 0.112, 0, 0, false);
  const hair = part(G.hair, hairM, headG, 0, 0.012, -0.008); if (female) hair.scale.set(1.04, 1.25, 1.12);
  if (R() < 0.18) { part(G.cap, M(CLOTH[Math.floor(R() * CLOTH.length)]), headG, 0, 0.085, 0); part(G.brim, M(0x222222), headG, 0, 0.065, 0.1); }
  function arm(side) {
    const sh = new THREE.Group(); sh.position.set(side * 0.215, 0.46, 0); spine.add(sh);
    part(G.upperArm, shirtless ? skin : (R() < 0.5 ? shirt : skin), sh, 0, -0.15, 0);
    const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
    part(G.lowerArm, skin, el, 0, -0.13, 0); part(G.hand, skin, el, 0, -0.28, 0);
    return { sh, el };
  }
  function leg(side) {
    const hp = new THREE.Group(); hp.position.set(side * 0.095, -0.02, 0); hips.add(hp);
    const longPants = !opt.beach && R() < 0.4;
    part(G.thigh, longPants || R() < 0.6 ? shorts : skin, hp, 0, -0.21, 0);
    const kn = new THREE.Group(); kn.position.y = -0.43; hp.add(kn);
    part(G.shin, longPants ? shorts : skin, kn, 0, -0.2, 0);
    const ft = part(G.foot, opt.beach ? skin : M(R() < 0.5 ? 0xf4f4f4 : 0x222222, 0.6), kn, 0, -0.42, 0.05);
    return { hp, kn, ft };
  }
  const L = arm(-1), Rr = arm(1), LL = leg(-1), RL = leg(1);
  return { root, hips, spine, head: headG, armL: L, armR: Rr, legL: LL, legR: RL, R, phase: R() * 6.28, h: 1.75 * s };
}

/** Pose: aplica ângulos às juntas. p = {walk, speed, run, panic, balance, lookUp, kick, crouch, armsUp} */
export function pose(P, t, p) {
  const f = (p.cadence || 1.9) * (1 + 0.7 * (p.run || 0));
  const ph = t * f * Math.PI * 2 * (p.walk || 0) + P.phase;
  const w = p.walk || 0, run = p.run || 0;
  const swing = (0.5 + 0.4 * run) * w;
  // pernas
  const lA = Math.sin(ph) * swing, rA = Math.sin(ph + Math.PI) * swing;
  P.legL.hp.rotation.x = -lA - (p.crouch || 0) * 0.9; P.legR.hp.rotation.x = -rA - (p.crouch || 0) * 0.9;
  P.legL.kn.rotation.x = Math.max(0, Math.sin(ph - 1.2)) * (0.9 + run * 0.6) * w + (p.crouch || 0) * 1.5;
  P.legR.kn.rotation.x = Math.max(0, Math.sin(ph + Math.PI - 1.2)) * (0.9 + run * 0.6) * w + (p.crouch || 0) * 1.5;
  P.legL.hp.rotation.z = -(p.balance || 0) * 0.25; P.legR.hp.rotation.z = (p.balance || 0) * 0.25;
  // chute (altinha)
  if (p.kick) { P.legR.hp.rotation.x = -p.kick * 1.1; P.legR.kn.rotation.x = 0.6 * (1 - p.kick) + 0.2; }
  // braços
  const aS = (0.45 + 0.6 * run) * w;
  const bal = p.balance || 0, up = p.armsUp || 0, panic = p.panic || 0;
  P.armL.sh.rotation.set(lA * -aS / Math.max(0.01, swing || 1) * 0 + Math.sin(ph + Math.PI) * aS - up * 2.6, 0, -0.08 - bal * 0.75 - up * 0.2);
  P.armR.sh.rotation.set(Math.sin(ph) * aS - up * 2.6 - (p.point || 0) * 1.5, 0, 0.08 + bal * 0.75 + up * 0.2);
  P.armL.el.rotation.x = -(0.25 + run * 1.1) * w - bal * 0.2 - panic * 0.6;
  P.armR.el.rotation.x = -(0.25 + run * 1.1) * w - bal * 0.2 - panic * 0.6;
  // tronco
  const bob = Math.abs(Math.cos(ph)) * 0.035 * w * (1 + run);
  P.hips.position.y = 0.92 - bob - (p.crouch || 0) * 0.28;
  P.spine.rotation.x = 0.06 * w + run * 0.28 + (p.crouch || 0) * 0.35 - (p.lookUp || 0) * 0.18;
  P.spine.rotation.z = Math.sin(ph) * 0.04 * w + bal * 0.18 * Math.sin(t * 7 + P.phase);
  P.spine.rotation.y = Math.sin(ph) * 0.08 * w + (p.turn || 0);
  P.head.rotation.x = -(p.lookUp || 0) * 0.65 + 0.05;
  P.head.rotation.y = (p.look || 0);
}
