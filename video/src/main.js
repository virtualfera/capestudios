import * as THREE from 'three';
import { buildWorld } from './world.js';
import { clamp, sstep, interp, nz } from './lib.js';

const q = new URLSearchParams(location.search);
const W = +q.get('w') || 720, H = +q.get('h') || 1280;
const SB = await (await fetch('/storyboard.json')).json();
const TL = SB.timeline;
document.documentElement.style.setProperty('--u', (H / 1024) + 'px');
const stage = document.getElementById('stage'); stage.style.width = W + 'px'; stage.style.height = H + 'px';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, W / H, 1, 2200);
const CAM = { pos: new THREE.Vector3(-14, 34, 66), yaw: -0.16, pitch: -0.22 };
if (q.has('cam')) { const c = q.get('cam').split(',').map(Number); CAM.pos.set(c[0], c[1], c[2]); CAM.yaw = c[3]; CAM.pitch = c[4]; if (c[5]) camera.fov = c[5]; camera.updateProjectionMatrix(); }
const world = buildWorld(SB, scene, camera);

// ---------------------------------------------------------------- HUD
const el = (id) => document.getElementById(id);
const hud = el('hud'), hState = el('h-state'), hCount = el('h-count'), hMetric = el('h-metric'), hMetric2 = el('h-metric2'), legend = el('legend'), shade = el('shade'), seismo = el('seismo');
const SW = Math.round(W * 0.74), SH = Math.round(H * 0.055); seismo.width = SW; seismo.height = SH; seismo.style.width = SW + 'px'; seismo.style.height = SH + 'px'; const sg = seismo.getContext('2d');
const title = el('titlecard'), black = el('black'), endcard = el('endcard');
title.innerHTML = 'E se a terra tremesse<br>por 1.000 dias seguidos?';
el('e-t').innerHTML = 'E se a terra tremesse<br>por 1.000 dias seguidos?';
el('e-s').textContent = SB.meta.endSubtitle;
const fmt = (n) => Math.floor(n).toLocaleString('pt-BR');

function counterAt(t) {
  if (t < TL.hudIn) return null;
  if (t < TL.quakeStop) {
    const d = interp(SB.counter.quake, t);
    if (d < 2) return 'Hora ' + Math.floor(d * 24 + 0.01);
    return 'Dia ' + fmt(d + 0.0001);
  }
  return 'Ano ' + fmt(interp(SB.counter.epilogueYears, t) + 0.0001);
}
function magnitude(t) {
  if (t < TL.quakeStart || t >= TL.quakeStop) return 0;
  const tt = Math.floor(t * 4) / 4;
  const m = 7.1 + 0.55 * nz(tt * 0.9) + 0.9 * sstep(40, 66, tt) * (0.5 + 0.5 * nz(tt * 1.7 + 3)) - 0.5 * (1 - sstep(7, 14, tt)) + 0.3 * nz(tt * 6);
  return Math.round(clamp(m, 5.8, 9.4) * 10) / 10;
}

let lastStanding = 100;
function setHUD(t) {
  // título
  title.style.opacity = t < TL.titleOut ? String(1 - sstep(TL.titleOut - 0.9, TL.titleOut, t)) : '0';
  const c = counterAt(t);
  hud.style.opacity = c ? String(sstep(TL.hudIn - 0.05, TL.hudIn + 0.5, t) * (1 - sstep(TL.fadeToBlack - 1.2, TL.fadeToBlack, t))) : '0';
  if (c) {
    const st = SB.states.find((s) => t >= s.from && t < s.to) || SB.states[SB.states.length - 1];
    hState.textContent = st.label; hCount.textContent = c;
    const pct = t < TL.quakeStart ? 100 : world.update.standingPct;
    if (t < TL.quakeStop) {
      const days = interp(SB.counter.quake, t);
      const n = t < TL.quakeStart ? 0 : Math.max(1, Math.round(1440 * days));
      hMetric.textContent = fmt(n) + ' ABALOS ACUMULADOS';
    } else {
      const g = Math.round(100 * sstep(72, 86.5, t));
      hMetric.textContent = 'ÁREA VERDE RETOMADA ' + g + '%';
    }
    hMetric2.textContent = 'PRÉDIOS EM PÉ ' + pct + '%';
  }
  // sismógrafo (elemento próprio)
  const sa = c ? sstep(TL.hudIn, TL.hudIn + 0.6, t) * (1 - sstep(TL.fadeToBlack - 1.2, TL.fadeToBlack, t)) : 0;
  shade.style.opacity = String(sa); seismo.style.opacity = String(sa * 0.9);
  if (sa > 0) {
    sg.clearRect(0, 0, SW, SH); sg.lineWidth = Math.max(1.5, H / 640); sg.strokeStyle = 'rgba(255,255,255,.88)'; sg.shadowColor = 'rgba(0,0,0,.7)'; sg.shadowBlur = 4;
    sg.beginPath();
    for (let x = 0; x <= SW; x++) {
      const tt = t - 6 * (1 - x / SW);
      const amp = tt < 0 ? 0 : (world.quakeAmp(tt) * 0.5 + world.spikeAt(tt) * 0.9);
      const y = SH / 2 + Math.sin(tt * 37 + x * 0.9) * amp * SH * 0.22 * (0.6 + 0.4 * Math.sin(tt * 91 + x * 0.31)) * (1 + 0.8 * Math.sin(x * 0.07 + tt * 5));
      x ? sg.lineTo(x, Math.max(1, Math.min(SH - 1, y))) : sg.moveTo(x, y);
    }
    sg.stroke();
  }
  // legenda
  let a = 0, txt = '';
  for (const l of SB.legends) { if (t >= l.from && t <= l.to) { a = sstep(l.from, l.from + 0.6, t) * (1 - sstep(l.to - 0.6, l.to, t)); txt = l.text; } }
  legend.textContent = txt; legend.style.opacity = String(a);
  // fade final
  black.style.opacity = String(sstep(TL.fadeToBlack, TL.fadeToBlack + 1.0, t));
  endcard.style.opacity = String(sstep(TL.endCardIn, TL.endCardIn + 0.9, t));
}

function setCamera(t) {
  const s = camera.userData.shake || { x: 0, y: 0, z: 0, r: 0 };
  camera.position.set(CAM.pos.x + s.x, CAM.pos.y + s.y, CAM.pos.z + s.z);
  camera.rotation.set(CAM.pitch, CAM.yaw, 0, 'YXZ');
  camera.rotateZ(s.r);
}

window.renderAt = (t) => {
  world.update(t); setCamera(t);
  renderer.render(scene, camera); setHUD(t);
  return true;
};
window.getEvents = () => world.EVENTS;
window.__cam = CAM; window.__ready = true;
await document.fonts.ready;
if (q.has('t')) window.renderAt(+q.get('t'));
