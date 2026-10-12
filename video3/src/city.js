import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng, clamp, sstep, lerp, nz, calcadaTexture, sandTexture, asphaltTexture, facadeTexture } from './lib.js';

export const SHORE_Z = 34;
export const sandY = (z) => 0.25 - Math.max(0, z - 6) * 0.022;
const std = (c, r = 0.8, m = 0, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...extra });
function colorize(g, c) { const n = g.attributes.position.count, a = new Float32Array(n * 3), col = new THREE.Color(c); for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); if (g.attributes.uv1) g.deleteAttribute('uv1'); return g; }
const ni = (g) => g.index ? g.toNonIndexed() : g;

export function buildCity(scene) {
  const R = rng(2026);
  const U = { time: { value: 0 }, quake: { value: 0 } };
  const out = { U, buildings: [], cars: [], palms: [], parasols: null, kiosks: [], props: [] };

  // ------------------------------------------------------------ MAR (shader próprio)
  const seaGeo = new THREE.PlaneGeometry(2400, 1000, 360, 160); seaGeo.rotateX(-Math.PI / 2); seaGeo.translate(0, 0, SHORE_Z - 8 + 500);
  const seaMat = new THREE.ShaderMaterial({
    fog: true, transparent: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uQuake: { value: 0 }, uSunDir: { value: new THREE.Vector3(0.3, 0.25, 1).normalize() }, uSky: { value: new THREE.Color(0xf3c9a0) }, uSunCol: { value: new THREE.Color(0xfff0d0) } }]),
    vertexShader: `
      #include <common>
      #include <fog_pars_vertex>
      uniform float uTime; uniform float uQuake;
      varying vec3 vW; varying vec3 vN; varying float vShore; varying float vCrest;
      vec3 gerst(vec2 d, float A, float L, float S, vec3 p, inout vec3 tg, inout vec3 bn){
        float k=6.2831/L; float f=k*(dot(d,p.xz)-S*uTime); float Q=0.55;
        tg+=vec3(-d.x*d.x*Q*A*k*sin(f), d.x*A*k*cos(f), -d.x*d.y*Q*A*k*sin(f));
        bn+=vec3(-d.x*d.y*Q*A*k*sin(f), d.y*A*k*cos(f), -d.y*d.y*Q*A*k*sin(f));
        return vec3(d.x*Q*A*cos(f), A*sin(f), d.y*Q*A*cos(f));
      }
      void main(){
        vec3 p=position; float shore=clamp((p.z-${SHORE_Z.toFixed(1)})/60.0,0.0,1.0);
        float amp=mix(0.25,1.0,shore);
        vec3 tg=vec3(1,0,0), bn=vec3(0,0,1); vec3 o=vec3(0);
        o+=gerst(normalize(vec2(0.15,-1.0)),0.55*amp,38.0,6.0,p,tg,bn);
        o+=gerst(normalize(vec2(-0.3,-1.0)),0.32*amp,21.0,4.6,p,tg,bn);
        o+=gerst(normalize(vec2(0.6,-0.8)),0.16*amp,11.0,3.3,p,tg,bn);
        o+=gerst(normalize(vec2(-0.8,-0.5)),0.08,5.5,2.2,p,tg,bn);
        // tremor: ondulações concêntricas
        float rq=length(p.xz-vec2(0.0,-40.0)); o.y+=uQuake*0.22*sin(rq*0.35-uTime*9.0)*exp(-rq*0.004);
        p+=o; p.y-=0.35;
        vN=normalize(cross(bn,tg)); vCrest=o.y; vShore=p.z;
        vec4 wp=modelMatrix*vec4(p,1.0); vW=wp.xyz;
        vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime; uniform vec3 uSunDir; uniform vec3 uSky; uniform vec3 uSunCol;
      varying vec3 vW; varying vec3 vN; varying float vShore; varying float vCrest;
      float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec3 V=normalize(cameraPosition-vW);
        // micro-normal (ondulinhas)
        vec2 q=vW.xz*0.35+vec2(uTime*0.4,uTime*0.25);
        float e=0.15; float n0=vn(q)+0.5*vn(q*2.3+3.1);
        float nx=(vn(q+vec2(e,0))+0.5*vn((q+vec2(e,0))*2.3+3.1))-n0; float nzz=(vn(q+vec2(0,e))+0.5*vn((q+vec2(0,e))*2.3+3.1))-n0;
        vec3 N=normalize(vN+vec3(nx,0.0,nzz)*1.6);
        float fres=pow(1.0-max(dot(N,V),0.0),4.0)*0.85+0.04;
        float shoreD=clamp((vShore-${SHORE_Z.toFixed(1)})/40.0,0.0,1.0);
        vec3 deep=vec3(0.02,0.16,0.27), mid=vec3(0.05,0.36,0.45), shallow=vec3(0.32,0.66,0.62);
        vec3 water=mix(shallow,mix(mid,deep,smoothstep(0.15,1.0,shoreD)),smoothstep(0.0,0.35,shoreD));
        water+=vec3(0.06,0.10,0.08)*clamp(vCrest,0.0,1.0);
        vec3 R=reflect(-V,N); float sp=pow(max(dot(R,uSunDir),0.0),220.0)*6.0+pow(max(dot(R,uSunDir),0.0),24.0)*0.35;
        vec3 col=mix(water,uSky,fres)+uSunCol*sp;
        // espuma: arrebentação e cristas
        float sw=sin(uTime*0.55+vW.x*0.015)*2.2+sin(uTime*0.31+vW.x*0.04)*0.8;
        float d=vShore-(${SHORE_Z.toFixed(1)}+sw);
        float foamN=vn(vW.xz*vec2(0.6,1.4)+vec2(0.0,uTime*0.8));
        float band=smoothstep(7.0,0.0,d)*smoothstep(-1.5,0.5,d);
        float lines=smoothstep(0.55,0.75,sin(d*1.4-uTime*2.2)*0.5+0.5)*smoothstep(16.0,2.0,d);
        float foam=clamp(band*(0.55+0.6*foamN)+lines*foamN*0.8+smoothstep(0.55,0.95,vCrest)*foamN*0.7,0.0,1.0);
        col=mix(col,vec3(0.95,0.96,0.94),foam*0.9);
        gl_FragColor=vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const sea = new THREE.Mesh(seaGeo, seaMat); sea.receiveShadow = false; scene.add(sea);
  out.sea = sea;

  // ------------------------------------------------------------ AREIA (com faixa molhada)
  const sandT = sandTexture(); sandT.repeat.set(60, 4);
  const sandGeo = new THREE.PlaneGeometry(1400, 64, 280, 64); sandGeo.rotateX(-Math.PI / 2); sandGeo.translate(0, 0, 32);
  { const p = sandGeo.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const y = sandY(z) + 0.05 * Math.sin(x * 0.21 + z * 0.4) * (z < 28 ? 1 : 0) + 0.04 * Math.sin(x * 0.07 - z * 0.9); p.setY(i, y);
      const wet = sstep(27, 33, z); const c = new THREE.Color(1, 1, 1).lerp(new THREE.Color(0.62, 0.54, 0.44), wet * 0.85); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    sandGeo.setAttribute('color', new THREE.BufferAttribute(col, 3)); sandGeo.computeVertexNormals(); }
  const sand = new THREE.Mesh(sandGeo, new THREE.MeshStandardMaterial({ map: sandT, vertexColors: true, roughness: 0.95 })); sand.receiveShadow = true; scene.add(sand);

  // ------------------------------------------------------------ CALÇADÃO + AVENIDA
  const cal = calcadaTexture();
  const calMat = new THREE.MeshStandardMaterial({ map: cal, roughness: 0.85 }); cal.repeat.set(380, 1.0);
  const calcadao = new THREE.Mesh(new THREE.BoxGeometry(1400, 0.3, 7.2), calMat); calcadao.position.set(0, 0.1, -3.6); calcadao.receiveShadow = true; scene.add(calcadao);
  const curb = new THREE.Mesh(new THREE.BoxGeometry(1400, 0.32, 0.35), std(0xcfc9bb, 0.7)); curb.position.set(0, 0.1, -7.2); curb.receiveShadow = true; scene.add(curb);
  const asp = asphaltTexture(); asp.repeat.set(280, 4);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(1400, 20), new THREE.MeshStandardMaterial({ map: asp, roughness: 0.92 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.0, -17.3); road.receiveShadow = true; scene.add(road);
  const cal2 = cal.clone(); cal2.needsUpdate = true; cal2.repeat.set(140, 0.4);
  const median = new THREE.Mesh(new THREE.BoxGeometry(1400, 0.22, 2.0), new THREE.MeshStandardMaterial({ map: cal2, roughness: .85 })); median.position.set(0, 0.11, -17.3); median.receiveShadow = true; scene.add(median);
  const cal3 = cal.clone(); cal3.needsUpdate = true; cal3.repeat.set(140, 0.9);
  const sideW = new THREE.Mesh(new THREE.BoxGeometry(1400, 0.28, 6.0), new THREE.MeshStandardMaterial({ map: cal3, roughness: .85 })); sideW.position.set(0, 0.12, -30.3); sideW.receiveShadow = true; scene.add(sideW);
  // faixas brancas
  const dashG = new THREE.PlaneGeometry(3, 0.15); dashG.rotateX(-Math.PI / 2);
  const dashM = new THREE.MeshStandardMaterial({ color: 0xe8e6de, roughness: 0.6 });
  const dashes = []; for (let x = -700; x < 700; x += 9) for (const z of [-10.5, -13.8, -20.8, -24.1]) dashes.push([x, z]);
  const dIM = new THREE.InstancedMesh(dashG, dashM, dashes.length); const m4 = new THREE.Matrix4();
  dashes.forEach((d, i) => { m4.makeTranslation(d[0], 0.02, d[1]); dIM.setMatrixAt(i, m4); }); dIM.receiveShadow = true; scene.add(dIM);

  // ------------------------------------------------------------ PRÉDIOS (fileira da Atlântica)
  const balconyM = std(0xf2efe8, 0.6);
  const glassRail = new THREE.MeshStandardMaterial({ color: 0x9fc4d8, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.35 });
  const walls = ['#efe9dc', '#e8c9a8', '#d9b48c', '#c9d6dc', '#f0dcc4', '#e3c4b2', '#f6f1e8', '#cdb89a', '#b9cbd0', '#e9b9a0', '#d8d0bf', '#f2e6cf'];
  let x = -330;
  while (x < 330) {
    const w = 15 + R() * 12, d = 18 + R() * 10, h = 34 + Math.floor(R() * 5) * 3.1;
    const cx = x + w / 2, cz = -33.5 - d / 2;
    const rows = Math.round(h / 3.1), wall = walls[Math.floor(R() * walls.length)];
    const fF = facadeTexture(Math.round(w / 2.6), rows, wall, 100 + out.buildings.length, { lit: 0.18 });
    const fS = facadeTexture(Math.round(d / 3.0), rows, wall, 500 + out.buildings.length, { lit: 0.12 });
    const mk = (f) => new THREE.MeshStandardMaterial({ map: f.map, emissiveMap: f.emi, emissive: 0xffd7a0, emissiveIntensity: 0.0, roughness: 0.75 });
    const mF = mk(fF), mS = mk(fS), roof = std(0x8b8780, 0.9);
    const geo = new THREE.BoxGeometry(w, h, d); geo.translate(0, h / 2, 0);
    const body = new THREE.Mesh(geo, [mS, mS, roof, roof, mF, mS]); body.castShadow = body.receiveShadow = true;
    const g = new THREE.Group(); g.position.set(cx, 0, cz); g.add(body);
    // varandas reais na fachada
    const slabs = [], rails = [];
    for (let r = 1; r < rows; r++) {
      const s = new THREE.BoxGeometry(w * 0.96, 0.16, 1.1); s.translate(0, r * 3.1 - 0.08, d / 2 + 0.55); slabs.push(ni(s));
      const rl = new THREE.BoxGeometry(w * 0.96, 0.95, 0.04); rl.translate(0, r * 3.1 + 0.47, d / 2 + 1.08); rails.push(ni(rl));
      for (let k = -1; k <= 1; k += 2) { const sd = new THREE.BoxGeometry(0.1, 3.1, 1.1); sd.translate(k * w * 0.48, r * 3.1 + 1.47, d / 2 + 0.55); slabs.push(ni(sd)); }
    }
    const bal = new THREE.Mesh(mergeGeometries(slabs), balconyM); bal.castShadow = true; bal.receiveShadow = true; g.add(bal);
    const rail = new THREE.Mesh(mergeGeometries(rails), glassRail); g.add(rail);
    // cobertura: caixa d'água, casa de máquinas, antenas
    const top = new THREE.Mesh(new THREE.BoxGeometry(w * 0.35, 3.2, d * 0.3), std(0xd8d2c6, .8)); top.position.set((R() - .5) * w * .3, h + 1.6, -d * 0.1); top.castShadow = true; g.add(top);
    if (R() < .7) { const an = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6, 4), std(0x555555, .5, .6)); an.position.set(w * .25, h + 3, d * .2); g.add(an); }
    // marquise do térreo
    const mq = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, 2.4), std(0xe9e4da, .7)); mq.position.set(0, 3.6, d / 2 + 1.2); mq.castShadow = true; g.add(mq);
    scene.add(g);
    out.buildings.push({ g, w, d, h, cx, cz, mats: [mF, mS], seed: R() });
    x += w + 0.6 + R() * 2.2;
  }
  // segunda e terceira fileiras (mais altas, mais simples)
  for (let k = 0; k < 2; k++) {
    let xx = -360;
    while (xx < 360) {
      const w = 18 + R() * 16, d = 20 + R() * 10, h = 40 + R() * 24 + k * 6;
      const f = facadeTexture(Math.round(w / 2.8), Math.round(h / 3.1), walls[Math.floor(R() * walls.length)], 900 + Math.floor(xx) + k * 1000, { lit: 0.12 });
      const m = new THREE.MeshStandardMaterial({ map: f.map, roughness: .8 });
      const geo = new THREE.BoxGeometry(w, h, d); geo.translate(0, h / 2, 0);
      const b = new THREE.Mesh(geo, m); b.position.set(xx + w / 2, 0, -78 - k * 45 - R() * 10); b.castShadow = true; b.receiveShadow = true; scene.add(b);
      xx += w + 4 + R() * 8;
    }
  }

  // ------------------------------------------------------------ MORROS, CORCOVADO, CRISTO, PÃO DE AÇÚCAR
  function hill(cx, cz, rx, rz, h, seed, rock = 0.0, sharp = 1) {
    let g = new THREE.IcosahedronGeometry(1, 6); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g); const p = g.attributes.position; const r = rng(seed);
    const col = new Float32Array(p.count * 3); let top = { y: -1 };
    const o1 = r() * 10, o2 = r() * 10;
    for (let i = 0; i < p.count; i++) {
      const ux = p.getX(i), uy = p.getY(i), uz = p.getZ(i);
      const n = 1 + 0.08 * Math.sin(ux * 9 + o1) * Math.cos(uz * 7 + o2) + 0.05 * Math.sin(ux * 23 + uz * 19) + 0.03 * Math.sin(ux * 41 - uz * 37) + 0.012 * Math.sin(ux * 97 + uz * 83) + 0.008 * Math.sin(ux * 160 - uz * 140);
      const y = Math.max(0, uy); const Y = Math.pow(y, sharp) * h * n;
      p.setXYZ(i, ux * rx * n, Y, uz * rz * n);
      const hh = Y / h; const slope = 1 - y;
      const c = new THREE.Color().setHSL(0.27 + 0.05 * r(), 0.55 + 0.15 * r(), 0.045 + 0.05 * r() * r() + 0.025 * hh);
      if (rock > 0 && (hh > 0.55 || Math.sin(ux * 13 + uz * 9) > 0.6)) c.lerp(new THREE.Color(0x8a877d), rock * sstep(0.45, 0.8, hh + 0.2 * Math.sin(ux * 27)));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      if (Y > top.y) top = { x: ux * rx * n, y: Y, z: uz * rz * n };
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
    m.position.set(cx, 0, cz); m.receiveShadow = true; scene.add(m); m.userData.top = top;
    return m;
  }
  hill(-420, -330, 260, 120, 150, 3, 0.5, 0.9);
  hill(160, -360, 300, 110, 130, 5, 0.4, 0.9);
  hill(-40, -520, 380, 160, 190, 8, 0.4, 0.85);
  const corc = hill(-60, -640, 150, 130, 215, 13, 0.9, 1.6);
  // Pão de Açúcar (dois "pães" de granito)
  const pao = hill(560, -40, 70, 60, 230, 21, 1.0, 0.55); const urca = hill(470, -80, 70, 60, 120, 22, 0.8, 0.7);
  // Cristo Redentor (estilizado, mais detalhado)
  const cristo = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0xf1ede2, roughness: 0.55, emissive: 0x3a362e, emissiveIntensity: 0.5 });
  const robePts = []; [[0, 0], [4.6, 0], [4.3, 3], [3.9, 9], [3.5, 15], [3.3, 19.5], [3.7, 22.5], [2.6, 24.2], [1.2, 24.8], [0, 24.9]].forEach(([r, y]) => robePts.push(new THREE.Vector2(r, y)));
  const robe = new THREE.Mesh(new THREE.LatheGeometry(robePts, 18), stone); robe.scale.z = 0.62; robe.position.y = 8; cristo.add(robe);
  const armG = new THREE.CylinderGeometry(1.5, 2.1, 13.5, 12); armG.rotateZ(Math.PI / 2);
  const aL = new THREE.Mesh(armG, stone); aL.position.set(-8.4, 29.4, 0); aL.rotation.z = 0.03; cristo.add(aL);
  const aR = aL.clone(); aR.position.x = 8.4; aR.rotation.z = -0.03; cristo.add(aR);
  [-1, 1].forEach((s) => { const hand = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.8), stone); hand.position.set(s * 15.4, 29.2, 0); cristo.add(hand); const sleeve = new THREE.Mesh(new THREE.ConeGeometry(2.2, 6, 10, 1, true), stone); sleeve.rotation.z = s * Math.PI / 2; sleeve.position.set(s * 11.5, 28.8, 0); cristo.add(sleeve); });
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.75, 18, 14), stone); head.scale.set(1, 1.2, 1); head.position.y = 34.6; cristo.add(head);
  const ped = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd8d3c6, roughness: .7 })); ped.position.y = 4; cristo.add(ped);
  cristo.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  const ct = corc.userData.top; cristo.scale.setScalar(2.4); cristo.position.set(corc.position.x + ct.x, ct.y - 2, corc.position.z + ct.z); cristo.rotation.y = 0.15;
  scene.add(cristo); out.cristo = cristo;

  // ------------------------------------------------------------ COQUEIROS (tronco curvo + folhas pendentes)
  function palmGeo(seed) {
    const r = rng(seed); const parts = [];
    const lean = new THREE.Vector3((r() - .5) * 3, 0, 1.5 + r() * 2.5);
    const H = 9 + r() * 4;
    const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean.x * .2, H * .35, lean.z * .1), new THREE.Vector3(lean.x * .7, H * .7, lean.z * .6), new THREE.Vector3(lean.x, H, lean.z));
    const trunk = new THREE.TubeGeometry(curve, 16, 0.24, 7); // anéis do tronco via cor
    { const p = trunk.attributes.position, c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const k = 0.5 + 0.07 * Math.sin(p.getY(i) * 7); c[i * 3] = 0.52 * k / 0.5; c[i * 3 + 1] = 0.44 * k / 0.5; c[i * 3 + 2] = 0.34 * k / 0.5; } trunk.setAttribute('color', new THREE.BufferAttribute(c, 3)); trunk.deleteAttribute('uv'); }
    parts.push(ni(trunk));
    const top = curve.getPoint(1);
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + r() * .3; const L = 3.6 + r() * 1.6; const segs = 8;
      const pos = [], cols = []; const col = new THREE.Color().setHSL(0.24 + r() * 0.04, 0.55, 0.22 + r() * 0.08);
      for (let s = 0; s < segs; s++) {
        const u0 = s / segs, u1 = (s + 1) / segs; const w0 = 0.55 * Math.sin(Math.PI * Math.min(1, u0 * 1.2 + .05)), w1 = 0.55 * Math.sin(Math.PI * Math.min(1, u1 * 1.2 + .05));
        const P = (u, w) => { const dx = Math.cos(a) * u * L, dz = Math.sin(a) * u * L; const dy = 0.6 * u * L * (0.6 - u) * 1.4 - u * u * 1.6; return [top.x + dx - Math.sin(a) * w, top.y + dy, top.z + dz + Math.cos(a) * w]; };
        const A = P(u0, -w0), B = P(u0, w0), C = P(u1, -w1), D = P(u1, w1);
        pos.push(...A, ...B, ...C, ...B, ...D, ...C);
        for (let k = 0; k < 6; k++) cols.push(col.r, col.g, col.b);
      }
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); fg.computeVertexNormals(); parts.push(fg);
    }
    for (let i = 0; i < 5; i++) { const c = ni(new THREE.SphereGeometry(0.22, 7, 5)); c.translate(top.x + (r() - .5) * .6, top.y - .35, top.z + (r() - .5) * .6); colorize(c, 0x5a6b2a); parts.push(c); }
    parts.forEach((p) => { if (p.attributes.uv) p.deleteAttribute('uv'); if (p.attributes.normal === undefined) p.computeVertexNormals(); });
    return mergeGeometries(parts);
  }
  const palmMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
  const palmGs = [0, 1, 2, 3].map((k) => palmGeo(70 + k));
  for (let px = -320; px < 320; px += 15 + R() * 8) {
    const m = new THREE.Mesh(palmGs[Math.floor(R() * 4)], palmMat); m.castShadow = true; m.position.set(px, sandY(1.5), 1.2 + R() * 1.5); m.rotation.y = (R() - .5) * 0.8;
    scene.add(m); out.palms.push({ m, ph: R() * 6.28 });
  }

  // ------------------------------------------------------------ GUARDA-SÓIS, CADEIRAS, BARRACAS
  const pc = [0xe74c3c, 0xf1c40f, 0x2e86c1, 0x27ae60, 0xffffff, 0xe67e22, 0x9b59b6, 0x1abc9c, 0xff6fa0];
  const canopyG = new THREE.ConeGeometry(1.25, 0.55, 12, 1, true); canopyG.translate(0, 2.05, 0);
  const poleG = new THREE.CylinderGeometry(0.025, 0.025, 2.1, 5); poleG.translate(0, 1.05, 0);
  const chairG = new RoundedBoxGeometry(0.55, 0.08, 1.4, 2, 0.03); chairG.rotateX(-0.35); chairG.translate(0, 0.32, 0);
  const NP = 520; const canIM = new THREE.InstancedMesh(canopyG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .7, side: THREE.DoubleSide }), NP);
  const polIM = new THREE.InstancedMesh(poleG, std(0xe8e8e8, .4, .3), NP); const chIM = new THREE.InstancedMesh(chairG, std(0xffffff, .6), NP);
  canIM.castShadow = polIM.castShadow = chIM.castShadow = true;
  const parData = [];
  for (let i = 0; i < NP; i++) {
    const px = (R() - .5) * 640, pz = 8 + R() * 18; if (Math.abs(px - 9) < 7 && pz < 16) { i--; continue; }
    const tilt = (R() - .5) * 0.25;
    parData.push({ x: px, z: pz, y: sandY(pz), tilt, ry: R() * 6, ph: R() * 6, c: pc[Math.floor(R() * pc.length)], fall: R() < .35 ? 4.8 + R() * 4 : 99 });
    canIM.setColorAt(i, new THREE.Color(parData[i].c)); chIM.setColorAt(i, new THREE.Color(pc[Math.floor(R() * pc.length)]));
  }
  scene.add(canIM, polIM, chIM); out.parasols = { canIM, polIM, chIM, parData };

  // ------------------------------------------------------------ QUIOSQUES de Copacabana
  const kGlass = new THREE.MeshStandardMaterial({ color: 0xb8d6e0, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.45 });
  for (let kx = -300; kx < 300; kx += 75) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.9, 4), std(0xe9e3d6, .6)); base.position.y = 0.6; g.add(base);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.2, 3.8), kGlass); glass.position.y = 2.15; g.add(glass);
    const roofK = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.25, 5.6), std(0xf4f1ea, .5)); roofK.position.y = 3.35; g.add(roofK);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.6, 0.1), new THREE.MeshStandardMaterial({ color: 0x1e7f5c, emissive: 0x1e7f5c, emissiveIntensity: 0.35 })); sign.position.set(0, 3.0, 2.0); g.add(sign);
    for (let t = 0; t < 4; t++) { const tb = new THREE.Group(); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 14), std(0xffffff, .5)); top.position.y = 0.75; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75, 6), std(0x777777, .4, .5)); leg.position.y = 0.37; const um = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.4, 10, 1, true), new THREE.MeshStandardMaterial({ color: [0xe74c3c, 0xf1c40f, 0x2e86c1, 0x27ae60][t], roughness: .7, side: THREE.DoubleSide })); um.position.y = 2.2; const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.0, 5), std(0xdddddd)); pole.position.y = 1.2; tb.add(top, leg, um, pole); tb.position.set(-4.5 + t * 3, 0, 3.6 + (t % 2) * 0.8); g.add(tb); out.props.push({ o: tb, ph: R() * 6, kind: 'table' }); }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(kx + 14, 0.25, -4.2); g.rotation.y = 0; scene.add(g); out.kiosks.push(g);
  }

  // ------------------------------------------------------------ CARROS na Atlântica
  const carCols = [0xe8b923, 0xe8b923, 0xf2f2f2, 0x1d1f22, 0xb9bcc0, 0x8e1f1f, 0x2b4c7e, 0xe8b923];
  const glassM = new THREE.MeshStandardMaterial({ color: 0x0e1418, roughness: 0.08, metalness: 0.9 });
  const tyreM = std(0x111111, .9); const lightM = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff2c8, emissiveIntensity: 2.2 }); const tailM = new THREE.MeshStandardMaterial({ color: 0x700000, emissive: 0xff2010, emissiveIntensity: 1.6 });
  function car(kind, c) {
    const g = new THREE.Group();
    if (kind === 'bus') {
      const b = new THREE.Mesh(new RoundedBoxGeometry(2.6, 2.9, 11.5, 3, 0.25), std(0xf2f2ef, .45, .1)); b.position.y = 1.75; g.add(b);
      const st = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.45, 11.4), std(0x1f6fb5, .5)); st.position.y = 1.0; g.add(st);
      const gl = new THREE.Mesh(new THREE.BoxGeometry(2.66, 1.0, 10.6), glassM); gl.position.y = 2.35; g.add(gl);
      [[-1, -3.8], [1, -3.8], [-1, 3.8], [1, 3.8]].forEach(([s, z]) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 14), tyreM); t.rotation.z = Math.PI / 2; t.position.set(s * 1.15, 0.5, z); g.add(t); });
    } else {
      const b = new THREE.Mesh(new RoundedBoxGeometry(1.85, 0.72, 4.3, 3, 0.18), std(c, .32, .55)); b.position.y = 0.72; g.add(b);
      const cab = new THREE.Mesh(new RoundedBoxGeometry(1.62, 0.62, 2.2, 3, 0.2), glassM); cab.position.set(0, 1.3, -0.15); g.add(cab);
      if (c === 0xe8b923) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.1, 4.32), std(0x2457b8, .4)); s.position.y = 0.78; g.add(s); const tx = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.25), std(0xffffff, .5)); tx.position.set(0, 1.68, -0.1); g.add(tx); }
      [[-1, -1.35], [1, -1.35], [-1, 1.35], [1, 1.35]].forEach(([s, z]) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 14), tyreM); t.rotation.z = Math.PI / 2; t.position.set(s * 0.86, 0.33, z); g.add(t); });
      [-0.6, 0.6].forEach((s) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.05), lightM); l.position.set(s, 0.82, 2.16); g.add(l); const tl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.05), tailM); tl.position.set(s, 0.85, -2.16); g.add(tl); });
    }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; } }); scene.add(g); return g;
  }
  const lanes = [[-9.0, 1], [-12.2, 1], [-15.4, 1], [-19.2, -1], [-22.4, -1], [-25.6, -1]];
  for (let i = 0; i < 70; i++) {
    const [lz, dir] = lanes[i % 6]; const kind = R() < 0.1 ? 'bus' : 'car';
    const g = car(kind, carCols[Math.floor(R() * carCols.length)]);
    g.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    out.cars.push({ g, z: lz, dir, x0: -340 + R() * 680, v: (kind === 'bus' ? 9 : 11) + R() * 4, ph: R() * 6, brake: 4.7 + R() * 0.8 });
  }

  // ------------------------------------------------------------ postos de salva-vidas e postes
  const poleM = std(0x2f3337, .5, .6);
  for (let px = -330; px < 330; px += 30) {
    const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 9, 8), poleM); p.position.y = 4.5; g.add(p);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2.4), poleM); arm.position.set(0, 8.9, 1.1); g.add(arm);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.8), new THREE.MeshStandardMaterial({ color: 0xffeccc, emissive: 0xffd9a0, emissiveIntensity: 0.4 })); lamp.position.set(0, 8.8, 2.2); g.add(lamp);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); g.position.set(px, 0.25, -6.6); scene.add(g); out.props.push({ o: g, ph: R() * 6, kind: 'pole' });
  }
  { const g = new THREE.Group(); const post = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 3.6), std(0xe8e2d4, .6)); post.position.y = 4.6; g.add(post); const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.0, 1.2), std(0xd5cfc1, .6)); leg.position.y = 1.5; g.add(leg); const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ color: 0xd62d2d, side: THREE.DoubleSide })); flag.position.set(1.6, 7.5, 0); g.add(flag); const fp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 5), poleM); fp.position.set(1.0, 7.0, 0); g.add(fp); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); g.position.set(-38, sandY(14), 14); scene.add(g); out.props.push({ o: flag, ph: 0, kind: 'flag' }); }

  return out;
}
