import * as THREE from 'three';

export function rng(seed){ let a=seed>>>0; return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}; }
export const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const sstep=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x)};
export const lerp=(a,b,t)=>a+(b-a)*t;
export const nz=x=>Math.sin(x*1.7)*.5+Math.sin(x*2.9+1.3)*.3+Math.sin(x*5.3+2.1)*.2;
export function interp(keys,t){
  if(t<=keys[0][0]) return keys[0][1];
  for(let i=1;i<keys.length;i++){ if(t<=keys[i][0]){ const a=keys[i-1],b=keys[i]; return lerp(a[1],b[1],(t-a[0])/(b[0]-a[0])); } }
  return keys[keys.length-1][1];
}

export const winU={ uOn:{value:0}, uOff:{value:0} };

export function patchWindows(mat){
  mat.onBeforeCompile=(sh)=>{
    sh.uniforms.uOn=winU.uOn; sh.uniforms.uOff=winU.uOff;
    sh.fragmentShader=sh.fragmentShader
      .replace('#include <common>','#include <common>\nuniform float uOn;\nuniform float uOff;')
      .replace('#include <emissivemap_fragment>',`
        #ifdef USE_EMISSIVEMAP
          vec4 ec=texture2D(emissiveMap,vEmissiveMapUv);
          float lit=step(0.004,ec.r)*step(ec.r,uOn)*(1.0-step(ec.g,uOff));
          totalEmissiveRadiance=vec3(1.0,0.80,0.46)*lit*0.82;
        #endif`);
  };
}

export function hex(c){ return new THREE.Color(c); }

/** Fachada procedural: devolve {map, emi} (CanvasTexture) */
export function facade(cols,rows,wall,seed,opts={}){
  const R=rng(seed), cw=14, ch=14;
  const w=cols*cw, h=rows*ch;
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d');
  g.fillStyle=wall; g.fillRect(0,0,w,h);
  for(let i=0;i<260;i++){ g.fillStyle=`rgba(${R()<.5?0:255},${R()<.5?0:255},${R()<.5?0:255},${0.02+R()*0.03})`; g.fillRect(R()*w,R()*h,2+R()*8,2+R()*8); }
  const e=document.createElement('canvas'); e.width=w; e.height=h;
  const ge=e.getContext('2d'); ge.fillStyle='#000'; ge.fillRect(0,0,w,h);
  const lit=opts.lit??0.6;
  for(let r=0;r<rows;r++){
    const y=h-(r+1)*ch; // r=0 térreo
    if(r===0 && opts.shop){
      g.fillStyle='rgba(20,22,26,.85)'; g.fillRect(0,y+3,w,ch-3);
      g.fillStyle=opts.awning||'#b33a2a';
      for(let k=0;k<cols;k++){ g.fillStyle=k%2?opts.awning||'#b33a2a':'#e9e4d6'; g.fillRect(k*cw,y+1,cw,4); }
      continue;
    }
    g.fillStyle='rgba(0,0,0,.14)'; g.fillRect(0,y+ch-1,w,1);
    for(let k=0;k<cols;k++){
      const x=k*cw;
      g.fillStyle='rgba(58,74,90,.92)'; g.fillRect(x+4,y+4,cw-8,ch-7);
      g.fillStyle='rgba(255,255,255,.10)'; g.fillRect(x+4,y+4,cw-8,2);
      g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x+2,y+ch-3,cw-4,1);
      if(R()<lit){
        const tr=0.04+R()*0.96, tg=R();
        ge.fillStyle=`rgb(${Math.round(tr*255)},${Math.round(tg*255)},0)`;
        ge.fillRect(x+4,y+4,cw-8,ch-7);
      }
    }
  }
  const map=new THREE.CanvasTexture(c); map.colorSpace=THREE.SRGBColorSpace; map.anisotropy=4;
  const emi=new THREE.CanvasTexture(e); emi.generateMipmaps=false; emi.minFilter=THREE.NearestFilter; emi.magFilter=THREE.NearestFilter;
  return {map,emi};
}

export function puffTexture(){
  const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d');
  const R=rng(7);
  for(let i=0;i<9;i++){
    const x=64+(R()-.5)*50,y=64+(R()-.5)*50,r=26+R()*26;
    const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(255,255,255,.55)'); gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr; g.fillRect(0,0,128,128);
  }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

export function crackTexture(seed,density,width){
  const R=rng(seed); const S=1024;
  const c=document.createElement('canvas'); c.width=c.height=S; const g=c.getContext('2d');
  g.lineCap='round'; g.lineJoin='round';
  for(let i=0;i<density;i++){
    let x=R()*S,y=R()*S,a=R()*Math.PI*2; const L=6+Math.floor(R()*14);
    g.beginPath(); g.moveTo(x,y);
    for(let k=0;k<L;k++){ a+=(R()-.5)*1.1; const l=14+R()*40; x+=Math.cos(a)*l; y+=Math.sin(a)*l; g.lineTo(x,y);
      if(R()<.18){ // ramificação
        let bx=x,by=y,ba=a+(R()<.5?1:-1)*(.6+R()*.6); g.moveTo(bx,by); for(let j=0;j<4;j++){ ba+=(R()-.5)*.9; bx+=Math.cos(ba)*(10+R()*24); by+=Math.sin(ba)*(10+R()*24); g.lineTo(bx,by);} g.moveTo(x,y);} }
    g.strokeStyle='rgba(8,8,8,.92)'; g.lineWidth=width*(0.6+R()*1.1); g.stroke();
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}

export function calcadaTexture(){
  // calçada portuguesa de Copacabana: ondas preto e branco
  const S=256; const c=document.createElement('canvas'); c.width=c.height=S; const g=c.getContext('2d');
  g.fillStyle='#d9d4c8'; g.fillRect(0,0,S,S);
  g.fillStyle='#2b2926';
  for(let row=0;row<4;row++){
    g.beginPath();
    for(let x=0;x<=S;x+=4){ const y=row*64+16+Math.sin(x/S*Math.PI*2)*14; x===0?g.moveTo(x,y):g.lineTo(x,y); }
    for(let x=S;x>=0;x-=4){ const y=row*64+40+Math.sin(x/S*Math.PI*2)*14; g.lineTo(x,y); }
    g.closePath(); g.fill();
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}

export function grassTexture(){
  const S=512; const c=document.createElement('canvas'); c.width=c.height=S; const g=c.getContext('2d'); const R=rng(21);
  g.fillStyle='#5b7d3a'; g.fillRect(0,0,S,S);
  for(let i=0;i<1400;i++){ g.fillStyle=`rgba(${60+R()*50},${100+R()*70},${40+R()*30},.55)`; g.beginPath(); g.arc(R()*S,R()*S,3+R()*14,0,7); g.fill(); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=THREE.SRGBColorSpace; return t;
}

export function rayTexture(){
  const c=document.createElement('canvas'); c.width=64; c.height=256; const g=c.getContext('2d');
  const gx=g.createLinearGradient(0,0,64,0); gx.addColorStop(0,'rgba(255,255,255,0)'); gx.addColorStop(.5,'rgba(255,255,255,1)'); gx.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gx; g.fillRect(0,0,64,256);
  g.globalCompositeOperation='destination-in'; const gy=g.createLinearGradient(0,0,0,256); gy.addColorStop(0,'rgba(0,0,0,0)'); gy.addColorStop(.25,'rgba(0,0,0,1)'); gy.addColorStop(.8,'rgba(0,0,0,.7)'); gy.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gy; g.fillRect(0,0,64,256);
  return new THREE.CanvasTexture(c);
}
