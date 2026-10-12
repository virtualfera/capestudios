import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { rng, clamp, sstep, lerp, nz, easeInOut } from './lib.js';
import { buildCity, sandY, SHORE_Z } from './city.js';
import { makePerson, pose } from './people.js';
import { makeDust, makeDebris, makeCracks, makeBirds } from './fx.js';

const q = new URLSearchParams(location.search);
const W = +q.get('w') || 1080, H = +q.get('h') || 1920;
const NO_AO = q.has('noao');
document.documentElement.style.setProperty('--u', (H / 1024) + 'px');
const stage = document.getElementById('stage'); stage.style.width = W + 'px'; stage.style.height = H + 'px';

// ------------------------------------------------------------ roteiro do teste (10 s)
const TQ = 4.6;              // início do tremor
const SHOTS = [
  { from: 0.0, to: 3.6, name: 'drone' },
  { from: 3.6, to: 6.8, name: 'calcadao' },
  { from: 6.8, to: 10.0, name: 'areia' },
];
const CAPTIONS = [
  { from: 0.5, to: 3.4, text: 'E se a terra começasse a tremer agora' },
  { from: 3.95, to: 6.55, text: 'Começa como um tremor qualquer.' },
  { from: 7.1, to: 9.85, text: 'Mas ele não para.' },
];
const EVENTS = [];

// ------------------------------------------------------------ renderer + pós
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.42;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, W / H, 0.2, 4000);

// céu físico + mapa de ambiente
const sky = new Sky(); sky.scale.setScalar(3500); scene.add(sky);
const sunDir = new THREE.Vector3(0.42, 0.22, 1).normalize();
const su = sky.material.uniforms; su.turbidity.value = 6.5; su.rayleigh.value = 1.6; su.mieCoefficient.value = 0.006; su.mieDirectionalG.value = 0.86; su.sunPosition.value.copy(sunDir);
const pm = new THREE.PMREMGenerator(renderer); const envScene = new THREE.Scene(); const sky2 = new Sky(); sky2.scale.setScalar(3000); sky2.material.uniforms.sunPosition.value.copy(sunDir); sky2.material.uniforms.turbidity.value = 6.5; sky2.material.uniforms.rayleigh.value = 1.6; envScene.add(sky2);
scene.environment = pm.fromScene(envScene, 0.04).texture; scene.environmentIntensity = 0.35;
scene.fog = new THREE.FogExp2(0xd8cbbd, 0.0011);

const sun = new THREE.DirectionalLight(0xffe2b8, 4.2); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.00025; sun.shadow.normalBias = 0.04; scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xbfd6ec, 0xc9a77c, 0.9); scene.add(hemi);

const city = buildCity(scene);
city.sea.material.uniforms.uSunDir.value.copy(sunDir);

// ------------------------------------------------------------ pessoas
const people = [];
function addPerson(seed, x, z, o) { const P = makePerson(seed, o); P.root.position.set(x, o.y ?? 0.25, z); scene.add(P.root); const p = { P, x0: x, z0: z, ...o }; people.push(p); return p; }
const PR = rng(321);
// calçadão (plano 2)
for (let i = 0; i < 34; i++) {
  const dir = PR() < 0.5 ? 1 : -1; const z = -6.4 + PR() * 5.6;
  addPerson(1000 + i, -30 + PR() * 64, z, { kind: 'walk', dir, v: 1.15 + PR() * 0.5, react: TQ + 0.1 + PR() * 0.6, flee: PR() < 0.45, y: 0.25 });
}
// vendedor de mate com galões
const vend = addPerson(77, -2, -1.6, { kind: 'walk', dir: 1, v: 1.0, react: TQ + 0.25, flee: false, y: 0.25 });
{ const tankM = new THREE.MeshStandardMaterial({ color: 0xd9dde0, metalness: 0.9, roughness: 0.25 }); [-1, 1].forEach((s) => { const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.55, 14), tankM); tk.position.set(s * 0.24, 0.2, -0.05); tk.castShadow = true; vend.P.spine.add(tk); }); }
// altinha na areia
const ALT = [[7.6, 9.2], [10.4, 8.4], [11.2, 11.0], [8.2, 11.8]];
ALT.forEach(([x, z], i) => addPerson(2000 + i, x, z, { kind: 'altinha', idx: i, react: TQ + 0.15 + i * 0.12, y: sandY(z), beach: true, flee: true }));
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfff3c0, roughness: 0.5 })); ball.castShadow = true; scene.add(ball);
// corredores do plano 3 (correm da cidade para o mar, passando pela câmera)
for (let i = 0; i < 16; i++) addPerson(3000 + i, -14 + PR() * 30, 4 + PR() * 14, { kind: 'runner', start: 6.9 + PR() * 0.8, v: 4.2 + PR() * 1.8, y: sandY(10), beach: true });
// banhistas parados na areia (plano 3 e 1)
for (let i = 0; i < 40; i++) { const x = -40 + PR() * 80, z = 12 + PR() * 14; if (Math.abs(x - 6) < 3 && z > 24) continue; addPerson(4000 + i, x, z, { kind: 'stand', react: 6.9 + PR() * 1.2, v: 3 + PR() * 2, y: sandY(z), beach: true, flee: true }); }

// multidão distante (instanciada, barata)
const crowd = (() => {
  const N = 900, body = new THREE.CapsuleGeometry(0.18, 0.95, 3, 6); body.translate(0, 0.65, 0);
  const head = new THREE.SphereGeometry(0.12, 8, 6); head.translate(0, 1.4, 0);
  const bIM = new THREE.InstancedMesh(body, new THREE.MeshStandardMaterial({ roughness: .8 }), N), hIM = new THREE.InstancedMesh(head, new THREE.MeshStandardMaterial({ roughness: .7 }), N);
  const cols = [0xf2f0ea, 0x1f5fbf, 0xe8c12e, 0x2f9a53, 0xd83b3b, 0xff7a2f, 0x18233a, 0xc68a5e, 0xe0ac86, 0x8d5a3c]; const skin = [0xf1c7a5, 0xc68a5e, 0x8d5a3c, 0xe0ac86];
  const D = []; const r = rng(808);
  for (let i = 0; i < N; i++) { let x = (r() - .5) * 600, z = 6 + r() * 26; if (Math.abs(x) < 45 && z < 28) x += Math.sign(x || 1) * 45; D.push({ x, z, s: 0.9 + r() * 0.2, ph: r() * 6, lie: r() < 0.25, run: 6.9 + r() * 1.5 }); bIM.setColorAt(i, new THREE.Color(cols[Math.floor(r() * cols.length)])); hIM.setColorAt(i, new THREE.Color(skin[Math.floor(r() * skin.length)])); }
  bIM.castShadow = true; scene.add(bIM, hIM);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), P = new THREE.Vector3();
  return { update(t) { D.forEach((d, i) => { const run = Math.max(0, t - d.run); const z = d.z + run * 3.5, y = sandY(z); E.set(d.lie && run === 0 ? Math.PI / 2 : 0.15 * Math.min(1, run), 0, 0); Q.setFromEuler(E); S.setScalar(d.s); P.set(d.x, y + (d.lie && run === 0 ? 0.15 : Math.abs(Math.sin(run * 9 + d.ph)) * 0.08 * Math.min(1, run)), z); M.compose(P, Q, S); bIM.setMatrixAt(i, M); hIM.setMatrixAt(i, M); }); bIM.instanceMatrix.needsUpdate = hIM.instanceMatrix.needsUpdate = true; } };
})();

// ------------------------------------------------------------ efeitos
const target = city.buildings.reduce((a, b) => Math.abs(b.cx - 2) < Math.abs(a.cx - 2) ? b : a);
const tFront = target.cz + target.d / 2 + 1.2;
const dust = makeDust(scene, [
  // poeira levantando do chão no calçadão (plano 2)
  { t0: TQ, t1: 6.8, count: 380, x: 20, y: 0.3, z: -3.5, sx: 40, sy: 0.3, sz: 7, vy: 0.35, spread: 0.6, size: 0.7, life: 2.0 },
  { t0: TQ + 0.2, t1: 6.8, count: 250, x: 10, y: 0.3, z: -17, sx: 60, sy: 0.4, sz: 18, vy: 0.5, spread: 1.0, size: 1.3, life: 2.5 },
  // fachada desmoronando (plano 3)
  { t0: 7.3, t1: 10, count: 3400, x: target.cx, y: target.h * 0.75, z: tFront, sx: target.w * 0.9, sy: target.h * 0.45, sz: 2, vy: -2.2, vz: 1.6, spread: 2.6, size: 2.0, life: 4.0 },
  { t0: 7.6, t1: 10, count: 1400, x: target.cx, y: 2, z: tFront + 4, sx: target.w + 10, sy: 2, sz: 10, vy: 1.4, vz: 3.0, spread: 3.0, size: 5, life: 4.5 },
  { t0: 6.8, t1: 10, count: 900, x: 0, y: 3, z: -40, sx: 300, sy: 8, sz: 10, vy: 1.2, spread: 2.0, size: 6, life: 5 },
]);
const debris = makeDebris(scene, [
  { t0: 7.3, t1: 9.9, count: 420, x: target.cx, y: target.h * 0.7, z: tFront, sx: target.w * 0.95, sy: target.h * 0.55, sz: 1, v: 3.2, vz: 2.2, size: 0.9, cols: [0xe8e2d4, 0xcac2b2, 0x9a958a, 0x6d6a64], glass: true },
  { t0: 5.0, t1: 6.8, count: 60, x: 14, y: 3.4, z: -2.2, sx: 7, sy: 0.3, sz: 2, v: 1.5, size: 0.25, cols: [0xf4f1ea, 0xd9d3c6], glass: true },
], (z) => z > 0 ? sandY(z) : 0.25);
const cracks = makeCracks(scene, [
  { x: 4, z: -2.0, dir: 0.4, branches: 6, t0: TQ + 0.05, speed: 9, w: 0.05 },
  { x: 9, z: -3.2, dir: 2.6, branches: 5, t0: TQ + 0.35, speed: 8, w: 0.045 },
  { x: 2, z: -17, dir: 0.0, branches: 7, t0: TQ + 0.2, speed: 11, w: 0.09 },
  { x: -10, z: 9, dir: 1.4, branches: 4, t0: 6.9, speed: 6, w: 0.07 },
], (x, z) => z > 0 ? sandY(z) : (z > -7.2 ? 0.25 : (z > -27.4 ? 0.0 : 0.26)));
const birds = makeBirds(scene, 46, { x: 10, z: 16, y: sandY(16) + 0.15, sx: 30, sz: 8, t0: TQ + 0.2 });
EVENTS.push({ t: TQ, type: 'quake_start' }, { t: 7.3, type: 'facade' }, { t: 8.6, type: 'jolt' }, { t: TQ + 0.2, type: 'birds' }, { t: 3.6, type: 'cut' }, { t: 6.8, type: 'cut' });

// ------------------------------------------------------------ composição
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.setPixelRatio(1); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
let gtao = null;
if (!NO_AO) { gtao = new GTAOPass(scene, camera, W, H); gtao.output = GTAOPass.OUTPUT.Default; gtao.blendIntensity = 0.9; gtao.updateGtaoMaterial({ radius: 1.4, distanceExponent: 1.5, thickness: 2.0, samples: 12 }); composer.addPass(gtao); }
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.18, 0.5, 2.6); composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uShake: { value: 0 }, uFlash: { value: 0 }, uRes: { value: new THREE.Vector2(W, H) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uShake, uFlash; uniform vec2 uRes; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 c=vUv-0.5; float r=length(c);
      float ca=0.0008+uShake*0.0022;
      vec3 col; col.r=texture2D(tDiffuse,vUv+c*ca).r; col.g=texture2D(tDiffuse,vUv).g; col.b=texture2D(tDiffuse,vUv-c*ca).b;
      col=mix(col, col*vec3(1.04,1.0,0.94)+vec3(0.012,0.006,0.0), 0.6);           // grade quente
      col=(col-0.5)*1.06+0.5;                                                       // contraste
      col*=1.0-smoothstep(0.35,0.95,r)*0.42;                                        // vinheta
      col+=(h(vUv*uRes+fract(uTime*7.13))-0.5)*0.045;                               // grão
      col=mix(col, vec3(1.0), uFlash);
      gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
    }`,
});
composer.addPass(grade);

// ------------------------------------------------------------ câmeras
const tmpV = new THREE.Vector3();
function shotCam(t) {
  const s = SHOTS.find((x) => t >= x.from && t < x.to) || SHOTS[SHOTS.length - 1];
  const u = clamp((t - s.from) / (s.to - s.from));
  let pos, look, fov = 50;
  if (s.name === 'drone') { const e = easeInOut(u * 0.85 + 0.15 * u * u); pos = new THREE.Vector3(lerp(-80, -30, e), lerp(70, 34, e), lerp(200, 86, e)); look = new THREE.Vector3(lerp(-50, -20, e), lerp(40, 40, e), lerp(-200, -120, e)); fov = lerp(50, 54, e); }
  else if (s.name === 'calcadao') { pos = new THREE.Vector3(lerp(38, 34.5, u), 1.55, -6.4); look = new THREE.Vector3(lerp(20, 17, u), lerp(1.4, 1.8, u), lerp(-1.0, 0.5, u)); fov = 44; }
  else { const e = easeInOut(u); pos = new THREE.Vector3(lerp(7, 4.6, e), lerp(0.9, 5.2, e), lerp(31, 27.5, e)); look = new THREE.Vector3(lerp(2, 1, e), lerp(20, 24, e), lerp(-38, -40, e)); fov = lerp(58, 52, e); }
  return { s, u, pos, look, fov };
}
function shakeAmp(t) {
  if (t < TQ) return 0;
  let a = 0.45 + 0.55 * Math.exp(-(t - TQ) / 0.5);
  if (t > 6.8) a = 0.55 + 0.25 * sstep(6.8, 9.5, t);
  a += 1.1 * Math.exp(-Math.max(0, t - 8.6) / 0.35) * (t >= 8.6 ? 1 : 0);
  return a;
}
function setCamera(t) {
  const c = shotCam(t); const a = shakeAmp(t);
  const hand = c.s.name === 'calcadao' ? 1 : (c.s.name === 'areia' ? 0.6 : 0.15);
  const f = t * 1.3;
  camera.position.copy(c.pos).add(tmpV.set(nz(f) * 0.04 * hand + a * 0.07 * nz(t * 23 + 1), nz(f + 3) * 0.03 * hand + a * 0.06 * nz(t * 27 + 5), nz(f + 7) * 0.03 * hand));
  camera.fov = c.fov; camera.updateProjectionMatrix();
  camera.lookAt(c.look);
  camera.rotateZ(a * 0.012 * nz(t * 19 + 2) + nz(f * 0.7 + 11) * 0.004 * hand);
  camera.rotateX(a * 0.008 * nz(t * 21 + 8)); camera.rotateY(a * 0.008 * nz(t * 17 + 3));
  // sombra acompanha a ação
  const center = c.s.name === 'drone' ? new THREE.Vector3(-10, 0, 0) : (c.s.name === 'calcadao' ? new THREE.Vector3(8, 0, -2) : new THREE.Vector3(2, 0, -6));
  const size = c.s.name === 'drone' ? 170 : (c.s.name === 'calcadao' ? 45 : 90);
  const sc = sun.shadow.camera; sc.left = -size; sc.right = size; sc.top = size; sc.bottom = -size; sc.near = 1; sc.far = 900; sc.updateProjectionMatrix();
  sun.target.position.copy(center); sun.position.copy(center).addScaledVector(sunDir, 400);
  grade.uniforms.uShake.value = a;
  return c;
}

// ------------------------------------------------------------ pessoas: comportamento
function updatePeople(t) {
  for (const p of people) {
    const P = p.P; let x = p.x0, z = p.z0, yaw = 0, ps = { walk: 0 };
    const quake = t > (p.react || 99);
    const k = quake ? sstep(p.react, p.react + 0.5, t) : 0;
    if (p.kind === 'walk') {
      const tw = Math.min(t, p.react ?? 99);
      x += p.dir * p.v * tw; yaw = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      ps = { walk: 1 - k, cadence: 1.75 };
      if (quake) {
        ps.balance = k * (0.8 + 0.3 * Math.sin(t * 5 + P.phase)); ps.crouch = k * 0.25; ps.look = Math.sin(t * 2.3 + P.phase) * 0.8 * k; ps.lookUp = 0.4 * k;
        if (p.flee && t > p.react + 0.7) { const r = t - p.react - 0.7; z += Math.min(r, 3) * 3.4; x += p.dir * r * 0.8; yaw = Math.atan2(p.dir * 0.8, 3.4); ps = { walk: 1, run: 1, panic: 1, cadence: 1.6, look: 0 }; }
      }
    } else if (p.kind === 'altinha') {
      const cx = 9.35, cz = 10.1; yaw = Math.atan2(cx - p.x0, cz - p.z0);
      const beat = 0.62; const cyc = Math.floor(t / beat), kicker = cyc % 4;
      ps = { walk: 0.15, cadence: 1.2 };
      if (!quake && kicker === p.idx) ps.kick = Math.sin(clamp((t % beat) / beat) * Math.PI);
      if (quake) { ps = { walk: 0, balance: k, crouch: 0.35 * k, lookUp: 0.5 * k, look: Math.sin(t * 2 + p.idx) * 0.7 }; if (t > p.react + 0.9) { const r = t - p.react - 0.9; z += r * 3.8; yaw = 0; ps = { walk: 1, run: 1, panic: 1, cadence: 1.6 }; } }
    } else if (p.kind === 'runner') {
      const r = Math.max(0, t - p.start); z += r * p.v; x += Math.sin(r * 0.8 + P.phase) * 0.3; yaw = 0.0;
      ps = r > 0 ? { walk: 1, run: 1, panic: 1, cadence: 1.65 } : { walk: 0, balance: 0.6, lookUp: 0.5, look: -0.5 };
    } else if (p.kind === 'stand') {
      yaw = Math.PI + (P.phase - 3) * 0.3; ps = { walk: 0 };
      if (t > TQ + 0.3) ps = { balance: 0.7, lookUp: 0.6, look: Math.sin(t + P.phase) * 0.6, crouch: 0.2 };
      if (t > p.react) { const r = t - p.react; z += r * p.v; yaw = 0; ps = { walk: 1, run: 1, panic: 1, cadence: 1.6 }; }
    }
    const gy = z > 0 ? sandY(z) : 0.25;
    P.root.position.set(x, gy, z); P.root.rotation.set(0, yaw, 0);
    pose(P, t, ps);
  }
  // bola da altinha (arcos entre jogadores; cai quando o tremor começa)
  const beat = 0.62, tb = Math.min(t, TQ + 0.2), cyc = Math.floor(tb / beat), u = (tb % beat) / beat;
  const a = ALT[cyc % 4], b = ALT[(cyc + 1) % 4];
  if (t < TQ + 0.2) ball.position.set(lerp(a[0], b[0], u), sandY(lerp(a[1], b[1], u)) + 0.5 + Math.sin(u * Math.PI) * 3.0, lerp(a[1], b[1], u));
  else { const r = t - TQ - 0.2; const bx = lerp(a[0], b[0], u) + r * 0.9, bz = lerp(a[1], b[1], u) + r * 0.5; const h0 = 0.5 + Math.sin(u * Math.PI) * 3.0; const by = Math.max(0, h0 - 4.9 * r * r); const bb = by === 0 ? Math.abs(Math.sin((r - Math.sqrt(h0 / 4.9)) * 8)) * 0.4 * Math.exp(-(r - Math.sqrt(h0 / 4.9)) * 2) : by; ball.position.set(bx, sandY(bz) + 0.11 + bb, bz); }
}

// ------------------------------------------------------------ objetos da cidade
const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), E4 = new THREE.Euler(), S4 = new THREE.Vector3(), P4 = new THREE.Vector3();
function updateCity(t) {
  const a = shakeAmp(t);
  city.sea.material.uniforms.uTime.value = t; city.sea.material.uniforms.uQuake.value = sstep(TQ, TQ + 1.5, t);
  // carros: andam, freiam no tremor, um ou outro desvia
  for (const c of city.cars) {
    const tt = Math.min(t, c.brake) + (t > c.brake ? (1 - Math.exp(-(t - c.brake) * 2.5)) * 0.4 : 0);
    let x = c.x0 + c.dir * c.v * tt; x = ((x + 340) % 680 + 680) % 680 - 340;
    c.g.position.set(x, a * 0.03 * Math.abs(nz(t * 31 + c.ph)), c.z);
    c.g.rotation.z = a * 0.02 * nz(t * 25 + c.ph);
  }
  // coqueiros balançam
  for (const p of city.palms) { p.m.rotation.x = 0.012 * Math.sin(t * 0.8 + p.ph) + a * 0.04 * nz(t * 6 + p.ph); p.m.rotation.z = 0.01 * Math.sin(t * 0.6 + p.ph) + a * 0.04 * nz(t * 5 + p.ph + 2); }
  // guarda-sóis: tremem, alguns tombam
  const { canIM, polIM, chIM, parData } = city.parasols;
  parData.forEach((d, i) => {
    const fall = sstep(d.fall, d.fall + 0.7, t);
    E4.set(d.tilt + a * 0.06 * nz(t * 13 + d.ph) + fall * 1.35, d.ry, a * 0.06 * nz(t * 11 + d.ph)); Q4.setFromEuler(E4); P4.set(d.x, d.y, d.z); S4.setScalar(1);
    M4.compose(P4, Q4, S4); canIM.setMatrixAt(i, M4); polIM.setMatrixAt(i, M4);
    E4.set(0, d.ry + 1.2, 0); Q4.setFromEuler(E4); P4.set(d.x + Math.cos(d.ry) * 1.1, d.y, d.z + 0.8); M4.compose(P4, Q4, S4); chIM.setMatrixAt(i, M4);
  });
  canIM.instanceMatrix.needsUpdate = polIM.instanceMatrix.needsUpdate = chIM.instanceMatrix.needsUpdate = true;
  for (const pr of city.props) {
    if (pr.kind === 'flag') { pr.o.rotation.y = Math.sin(t * 3) * 0.3; continue; }
    pr.o.rotation.z = a * (pr.kind === 'pole' ? 0.03 : 0.05) * nz(t * 12 + pr.ph); pr.o.rotation.x = a * 0.03 * nz(t * 10 + pr.ph + 4);
  }
  for (const b of city.buildings) { const k = b === target ? 1.8 : 1; b.g.rotation.z = a * 0.0035 * k * nz(t * 4 + b.seed * 10); b.g.rotation.x = a * 0.0025 * k * nz(t * 3.3 + b.seed * 7); }
  city.cristo.rotation.z = a * 0.004 * nz(t * 3 + 1);
}

// ------------------------------------------------------------ overlays
const el = (id) => document.getElementById(id);
const capEl = el('cap'), titleEl = el('title'), hud = el('hud'), hn = el('hn'), hs = el('hs'), flash = el('flash');
let capCur = null;
function setOverlay(t) {
  titleEl.style.opacity = String(sstep(0.15, 0.6, t) * (1 - sstep(3.1, 3.55, t)));
  const c = CAPTIONS.find((x) => t >= x.from && t <= x.to);
  if (c !== capCur) { capCur = c; capEl.innerHTML = c ? c.text.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ') : ''; }
  if (c) {
    const words = capEl.querySelectorAll('.w'); const dur = (c.to - c.from) * 0.62;
    words.forEach((w, i) => { const t0 = c.from + (i / words.length) * dur; const k = sstep(t0, t0 + 0.22, t); w.style.opacity = String(k); w.style.transform = `translateY(${(1 - k) * 6 * H / 1024}px)`; });
    capEl.style.opacity = String(1 - sstep(c.to - 0.3, c.to, t));
  } else capEl.style.opacity = '0';
  // HUD estilo BR: rótulo, número grande, sublinha
  hud.style.opacity = String(sstep(TQ + 0.15, TQ + 0.6, t));
  const n = t < TQ ? 0 : Math.floor(1 + (t - TQ) * 2.2 + Math.pow(Math.max(0, t - 7), 2) * 1.3);
  hn.innerHTML = n.toLocaleString('pt-BR');
  const mag = (6.4 + 0.5 * sstep(TQ, 6, t) + 0.7 * sstep(7, 9.8, t) + 0.15 * nz(t * 2)).toFixed(1).replace('.', ',');
  hs.innerHTML = `DIA 1 &nbsp;·&nbsp; MAGNITUDE <b>${mag}</b>`;
  // flash e corte seco no fim
  const fl = Math.max(0, 1 - Math.abs(t - 8.62) / 0.12) * 0.55 + sstep(9.9, 10.0, t) * 0;
  grade.uniforms.uFlash.value = fl;
}

// ------------------------------------------------------------ frame
window.renderAt = (t) => {
  const c = setCamera(t);
  updateCity(t); updatePeople(t); crowd.update(t);
  dust.update(t, H / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)));
  debris.update(t); cracks.update(t); birds.update(t);
  grade.uniforms.uTime.value = t;
  composer.render();
  setOverlay(t);
  return c.s.name;
};
window.getEvents = () => EVENTS;
await document.fonts.ready;
window.__ready = true;
