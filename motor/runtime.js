// Runtime comum dos templates de motion da Cape.
// Cada template define window.CENA = { dur, montar(spec), desenhar(t) }.
// O render (render.js) injeta window.SPEC = { marca, dados, base_dir, transparente } e chama
// window.prontos (Promise) e depois window.seek(t) quadro a quadro.
// Abrir o .html direto no navegador com ?t=3.2 mostra um instante (usa spec de exemplo).

const U = {
  clamp: (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)),
  lerp: (a, b, k) => a + (b - a) * k,
  // progresso 0..1 entre t0 e t1
  p: (t, t0, t1) => U.clamp((t - t0) / (t1 - t0)),
  eOut: k => 1 - Math.pow(1 - k, 3),
  eIn: k => k * k * k,
  eInOut: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  eBack: k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
  // mola amortecida: sobe de 0 a 1 com um pequeno ricochete
  mola: (k, freq = 3.2, amort = 6) => (k <= 0 ? 0 : 1 - Math.exp(-amort * k) * Math.cos(freq * Math.PI * k)),
  // entra/segura/sai: 0 -> 1 (entrada) -> 1 -> 0 (saida)
  janela: (t, a, b, ent = 0.35, sai = 0.3) => Math.min(U.eOut(U.p(t, a, a + ent)), 1 - U.eIn(U.p(t, b - sai, b))),
  el: (tag, cls, pai, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (pai) pai.appendChild(e); return e; },
  css: (e, o) => { for (const k in o) e.style[k] = o[k]; return e; },
};

// Texto com *acento*: as palavras entre asteriscos recebem o estilo de acento da marca
// (caixa-destaque no Arteiro, gradiente no Hospital, itálico serifado na Intensa, caixa laranja no W&S).
function textoComAcento(txt) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc(txt).replace(/\*([^*]+)\*/g, '<span class="acento">$1</span>').replace(/\n/g, '<br>');
}

// Quebra um texto em palavras animáveis, preservando os acentos
function palavras(container, txt) {
  container.innerHTML = '';
  const linhas = txt.split('\n');
  const out = [];
  linhas.forEach((ln, li) => {
    const linha = U.el('div', 'linha', container);
    const partes = ln.split(/(\*[^*]+\*)/).filter(Boolean);
    partes.forEach(pt => {
      const ac = pt.startsWith('*');
      const s = ac ? pt.slice(1, -1) : pt;
      if (ac) { const w = U.el('span', 'pal acento', linha, s.replace(/</g, '&lt;')); out.push(w); linha.append(' '); }
      else s.split(/\s+/).filter(Boolean).forEach(w0 => {
        // pontuação colada na palavra anterior (ex.: "*andares*." não vira "andares .")
        if (/^[.,!?;:…]+$/.test(w0) && out.length && linha.lastChild && linha.lastChild.nodeType === 3) { linha.lastChild.remove(); out[out.length - 1].insertAdjacentHTML('afterend', `<span class="pal">${w0}</span>`); out.push(linha.lastChild.previousSibling || linha.lastChild); linha.append(' '); return; }
        out.push(U.el('span', 'pal', linha, w0.replace(/</g, '&lt;'))); linha.append(' ');
      });
    });
  });
  return out;
}

function aplicarMarca(marca) {
  const r = document.documentElement.style, c = marca.cores, f = marca.fontes;
  r.setProperty('--fundo', c.fundo); r.setProperty('--pri', c.primaria); r.setProperty('--sec', c.secundaria);
  r.setProperty('--dest', c.destaque); r.setProperty('--txt', c.texto); r.setProperty('--txt-dest', c.texto_sobre_destaque || c.texto);
  r.setProperty('--f-titulo', `"${f.titulo}", "Inter", sans-serif`);
  r.setProperty('--f-texto', `"${f.texto}", "Inter", sans-serif`);
  r.setProperty('--f-acento', `"${f.acento}", "Inter", serif`);
  if (c.gradiente_acento) r.setProperty('--grad', `linear-gradient(90deg, ${c.gradiente_acento.join(',')})`);
  document.body.dataset.estilo = marca.estilo_acento || '';
  document.body.dataset.cliente = marca.slug;
}

// Ícones simples em SVG (traço), na cor atual
const ICONES = {
  pin: '<path d="M12 22s7-6.4 7-12a7 7 0 1 0-14 0c0 5.6 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/>',
  carro: '<path d="M4 16v-4l2-5h12l2 5v4"/><path d="M3 16h18v3H3z"/><circle cx="7.5" cy="16" r="1.4"/><circle cx="16.5" cy="16" r="1.4"/>',
  predio: '<path d="M5 21V4h14v17"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2"/><path d="M3 21h18"/>',
  martelo: '<path d="M14 4l6 6-3 3-6-6z"/><path d="M11 7L3 15l3 3 8-8"/>',
  estrela: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  cafe: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3c0 1.5 1.5 1.5 1.5 3M12 3c0 1.5 1.5 1.5 1.5 3"/>',
  olho: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  coracao: '<path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 3 5 6.3 5c2 0 3.2 1.1 3.7 2 .5-.9 1.7-2 3.7-2C17 5 18.8 8.3 17.2 11.4 15 15.6 12 20 12 20z" transform="translate(1.2 0)"/>',
  porta: '<path d="M6 21V3h12v18"/><path d="M3 21h18"/><circle cx="14.5" cy="12" r=".9"/>',
  mesa: '<path d="M3 9h18"/><path d="M6 9v10M18 9v10"/><path d="M8 6h8"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
const icone = (nome, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONES[nome] || ICONES.pin}</svg>`;

// Legendas sincronizadas (narração). dados.legendas = [{t0, t1, texto}] — *acento* permitido.
function montarLegendas(stage, legendas) {
  const box = U.el('div', 'legenda', stage);
  const itens = (legendas || []).map(l => ({ ...l, html: textoComAcento(l.texto) }));
  let atual = -1;
  return t => {
    const i = itens.findIndex(l => t >= l.t0 && t < l.t1);
    if (i !== atual) { box.innerHTML = i >= 0 ? `<span>${itens[i].html}</span>` : ''; atual = i; }
    if (i >= 0) { const l = itens[i]; const k = U.eBack(U.p(t, l.t0, l.t0 + 0.18)); box.style.opacity = U.p(t, l.t0, l.t0 + 0.08); box.style.transform = `translateX(-50%) scale(${0.92 + 0.08 * k})`; }
    else box.style.opacity = 0;
  };
}

function caminho(rel) {
  if (!rel) return null;
  if (/^(https?:|file:|data:)/.test(rel)) return rel;
  if (rel.startsWith('/')) return 'file://' + rel;
  const base = window.SPEC.base_dir || '';
  return (base.startsWith('file:') ? base : 'file://' + base) + '/' + rel;
}

async function carregarImagens(urls) {
  await Promise.all(urls.filter(Boolean).map(u => new Promise(res => { const i = new Image(); i.onload = i.onerror = res; i.src = u; })));
}

window.addEventListener('DOMContentLoaded', () => {
  const qs = new URLSearchParams(location.search);
  if (!window.SPEC && window.SPEC_EXEMPLO) window.SPEC = window.SPEC_EXEMPLO;
  const spec = window.SPEC;
  if (spec.transparente) document.documentElement.classList.add('transparente');
  aplicarMarca(spec.marca);
  window.prontos = (async () => {
    await document.fonts.ready;
    await window.CENA.montar(spec);
    await document.fonts.ready;
  })();
  window.seek = t => window.CENA.desenhar(t);
  window.duracao = () => window.CENA.dur;
  if (qs.has('t')) window.prontos.then(() => window.seek(parseFloat(qs.get('t'))));
});
