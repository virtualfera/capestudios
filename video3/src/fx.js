import * as THREE from 'three';
import { rng, clamp, sstep, lerp, softDot } from './lib.js';

/** Partículas de poeira (GPU): cada partícula tem nascimento, origem, velocidade, tamanho e vida. */
export function makeDust(scene, emitters, max = 9000) {
  const R = rng(55);
  const pos = new Float32Array(max * 3), vel = new Float32Array(max * 3), info = new Float32Array(max * 4);
  let n = 0;
  for (const e of emitters) {
    for (let i = 0; i < e.count && n < max; i++, n++) {
      const tb = e.t0 + R() * (e.t1 - e.t0);
      const px = e.x + (R() - .5) * e.sx, py = e.y + (R() - .5) * e.sy, pz = e.z + (R() - .5) * e.sz;
      pos.set([px, py, pz], n * 3);
      vel.set([(R() - .5) * e.spread + (e.vx || 0), e.vy * (0.4 + R()), (R() - .5) * e.spread + (e.vz || 0)], n * 3);
      info.set([tb, e.size * (0.6 + R() * 0.8), e.life * (0.6 + R() * 0.7), R()], n * 4);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('vel', new THREE.BufferAttribute(vel, 3)); g.setAttribute('info', new THREE.BufferAttribute(info, 4));
  g.setDrawRange(0, n);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uMap: { value: softDot() }, uScale: { value: 900 }, uCol: { value: new THREE.Color(0xd9c7a8) }, uSun: { value: new THREE.Color(0xffd9a8) } }]),
    vertexShader: `
      #include <common>
      #include <fog_pars_vertex>
      attribute vec3 vel; attribute vec4 info; uniform float uTime; uniform float uScale;
      varying float vA; varying float vS;
      void main(){
        float age=uTime-info.x; float life=info.z;
        vA=0.0; vec3 p=position;
        if(age>0.0 && age<life){
          float k=age/life;
          p+=vel*age*(1.0-0.35*k)+vec3(0.0,0.6*age,0.0)*info.w;
          vA=smoothstep(0.0,0.12,k)*(1.0-smoothstep(0.55,1.0,k));
        }
        vS=info.w;
        vec4 mvPosition=viewMatrix*modelMatrix*vec4(p,1.0);
        gl_Position=projectionMatrix*mvPosition;
        float sz=info.y*(1.0+2.2*clamp(age/life,0.0,1.0));
        gl_PointSize=vA>0.0? sz*uScale/max(1.0,-mvPosition.z):0.0;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      #include <common>
      #include <fog_pars_fragment>
      uniform sampler2D uMap; uniform vec3 uCol; uniform vec3 uSun; varying float vA; varying float vS;
      void main(){
        vec4 t=texture2D(uMap,gl_PointCoord);
        float lit=0.75+0.25*(1.0-gl_PointCoord.y);
        vec3 c=mix(uCol,uSun,0.25)*lit*(0.85+0.3*vS);
        gl_FragColor=vec4(c,t.a*vA*0.28);
        if(gl_FragColor.a<0.004) discard;
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 5; scene.add(pts);
  return { pts, mat, update(t, pxScale) { mat.uniforms.uTime.value = t; mat.uniforms.uScale.value = pxScale; } };
}

/** Detritos (concreto/reboco) e vidro: balística com quique, instanciados. */
export function makeDebris(scene, sources, floorY) {
  const R = rng(77);
  const items = [];
  for (const s of sources) for (let i = 0; i < s.count; i++) {
    const a = R() * Math.PI * 2;
    items.push({ glass: s.glass && R() < 0.6, tl: s.t0 + R() * (s.t1 - s.t0), x0: s.x + (R() - .5) * s.sx, y0: s.y + (R() - .5) * s.sy, z0: s.z + (R() - .5) * s.sz,
      vx: Math.cos(a) * s.v * R() + (s.vx || 0), vy: R() * s.v * 0.4, vz: Math.abs(Math.sin(a)) * s.v * R() + (s.vz || 0), sz: s.size * (0.3 + R()),
      ax: new THREE.Vector3(R() - .5, R() - .5, R() - .5).normalize(), spin: (R() - .5) * 14, col: s.cols[Math.floor(R() * s.cols.length)] });
  }
  const conc = items.filter((i) => !i.glass), glass = items.filter((i) => i.glass);
  const cIM = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), Math.max(1, conc.length));
  const gIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.6, 0.45), new THREE.MeshStandardMaterial({ color: 0xcfe6f0, roughness: 0.02, metalness: 1.0, side: THREE.DoubleSide, envMapIntensity: 2.5 }), Math.max(1, glass.length));
  cIM.castShadow = true; cIM.frustumCulled = gIM.frustumCulled = false;
  conc.forEach((it, i) => cIM.setColorAt(i, new THREE.Color(it.col)));
  scene.add(cIM, gIM);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
  function place(IM, list, t) {
    list.forEach((it, i) => {
      const tau = t - it.tl;
      if (tau < 0) { M.makeScale(0, 0, 0); IM.setMatrixAt(i, M); return; }
      const fy = floorY(it.z0 + it.vz * tau) + it.sz * 0.35;
      // queda + 2 quiques amortecidos
      let y = it.y0 + it.vy * tau - 4.9 * tau * tau, x = it.x0 + it.vx * tau, z = it.z0 + it.vz * tau, rot = it.spin * tau;
      const tl = (it.vy + Math.sqrt(it.vy * it.vy + 19.6 * Math.max(0, it.y0 - fy))) / 9.8;
      if (tau > tl) { const vb = Math.min(6, 9.8 * tl * 0.28); const t2 = tau - tl; const tb = 2 * vb / 9.8;
        if (t2 < tb) y = fy + vb * t2 - 4.9 * t2 * t2; else y = fy;
        const drift = Math.min(t2, tb * 1.4); x = it.x0 + it.vx * tl + it.vx * 0.35 * drift; z = it.z0 + it.vz * tl + it.vz * 0.35 * drift; rot = it.spin * (tl + Math.min(t2, tb) * 0.5); }
      Q.setFromAxisAngle(it.ax, rot); S.setScalar(it.sz); P.set(x, Math.max(y, fy), z); M.compose(P, Q, S); IM.setMatrixAt(i, M);
    });
    IM.instanceMatrix.needsUpdate = true;
  }
  return { update(t) { place(cIM, conc, t); place(gIM, glass, t); } };
}

/** Rachaduras que se propagam (geometria de faixas escuras regerada por frame). */
export function makeCracks(scene, seeds, surfaceY) {
  const R = rng(91); const paths = [];
  for (const s of seeds) {
    for (let b = 0; b < s.branches; b++) {
      const pts = [[s.x, s.z]]; let a = s.dir + (R() - .5) * 1.6, x = s.x, z = s.z, L = 0;
      for (let k = 0; k < 28; k++) { a += (R() - .5) * 0.7; const l = 0.35 + R() * 0.8; x += Math.cos(a) * l; z += Math.sin(a) * l; L += l; pts.push([x, z]); }
      paths.push({ pts, t0: s.t0 + b * 0.06, speed: s.speed * (0.7 + R() * 0.6), w: s.w * (0.6 + R() * 0.8) });
    }
  }
  const maxQ = paths.reduce((a, p) => a + p.pts.length, 0);
  const pos = new Float32Array(maxQ * 18); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x0b0a09, polygonOffset: true, polygonOffsetFactor: -4, side: THREE.DoubleSide, fog: true })); m.frustumCulled = false; scene.add(m);
  return { update(t) {
    let q = 0;
    for (const p of paths) {
      const len = (t - p.t0) * p.speed; if (len <= 0) continue;
      let acc = 0;
      for (let k = 1; k < p.pts.length; k++) {
        const [x0, z0] = p.pts[k - 1], [x1, z1] = p.pts[k]; const seg = Math.hypot(x1 - x0, z1 - z0);
        if (acc >= len) break; const u = Math.min(1, (len - acc) / seg); acc += seg;
        const xe = x0 + (x1 - x0) * u, ze = z0 + (z1 - z0) * u; const nx = -(ze - z0) / seg, nzz = (xe - x0) / seg;
        const w0 = p.w * (1 - k / p.pts.length) * Math.min(1, len * 0.4), w1 = w0 * 0.85;
        const y0 = surfaceY(x0, z0) + 0.012, y1 = surfaceY(xe, ze) + 0.012;
        const v = [x0 - nx * w0, y0, z0 - nzz * w0, x0 + nx * w0, y0, z0 + nzz * w0, xe + nx * w1, y1, ze + nzz * w1, x0 - nx * w0, y0, z0 - nzz * w0, xe + nx * w1, y1, ze + nzz * w1, xe - nx * w1, y1, ze - nzz * w1];
        pos.set(v, q * 18); q++;
      }
    }
    g.setDrawRange(0, q * 6); g.attributes.position.needsUpdate = true;
  } };
}

/** Bando de pássaros (gaivotas/pombos) com batida de asa. */
export function makeBirds(scene, n, spawn) {
  const R = rng(13);
  const body = new THREE.CapsuleGeometry(0.09, 0.32, 3, 6); body.rotateX(Math.PI / 2);
  const wing = new THREE.BufferGeometry(); wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.12, 0.62, 0.02, 0.0, 0, 0, 0.14, 0.62, 0.02, 0.0, 0.55, 0.0, 0.16, 0, 0, 0.14], 3)); wing.computeVertexNormals();
  const mB = new THREE.MeshStandardMaterial({ color: 0xe9e9e4, roughness: .8 }), mW = new THREE.MeshStandardMaterial({ color: 0xdcdcd6, roughness: .8, side: THREE.DoubleSide });
  const bIM = new THREE.InstancedMesh(body, mB, n), lIM = new THREE.InstancedMesh(wing, mW, n), rIM = new THREE.InstancedMesh(wing, mW, n);
  [bIM, lIM, rIM].forEach((m) => { m.frustumCulled = false; m.castShadow = true; scene.add(m); });
  const B = []; for (let i = 0; i < n; i++) B.push({ x: spawn.x + (R() - .5) * spawn.sx, z: spawn.z + (R() - .5) * spawn.sz, y: spawn.y, t0: spawn.t0 + R() * 0.7, vx: (R() - .3) * 4, vz: 5 + R() * 6, vy: 3 + R() * 3, ph: R() * 6, s: 0.8 + R() * 0.5 });
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), P = new THREE.Vector3(), W = new THREE.Matrix4();
  return { update(t) {
    B.forEach((b, i) => {
      const tau = Math.max(0, t - b.t0); const fly = t > b.t0;
      const x = b.x + b.vx * tau, z = b.z + b.vz * tau, y = b.y + (fly ? b.vy * tau - 0.12 * tau * tau * 0 + 1.2 * Math.log(1 + tau) : 0);
      const head = Math.atan2(b.vx, b.vz);
      E.set(fly ? -0.25 : 0, head, 0); Q.setFromEuler(E); S.setScalar(b.s); P.set(x, y, z); M.compose(P, Q, S); bIM.setMatrixAt(i, M);
      const flap = fly ? Math.sin(t * 22 + b.ph) * 0.9 : -0.1;
      W.makeRotationZ(flap); lIM.setMatrixAt(i, M.clone().multiply(W));
      W.makeRotationZ(Math.PI - flap); rIM.setMatrixAt(i, M.clone().multiply(new THREE.Matrix4().makeScale(1, 1, 1)).multiply(W));
    });
    bIM.instanceMatrix.needsUpdate = lIM.instanceMatrix.needsUpdate = rIM.instanceMatrix.needsUpdate = true;
  } };
}
