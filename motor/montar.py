#!/usr/bin/env python3
"""Monta um vídeo da Cape a partir de um projeto JSON.

    python3 -I motor/montar.py projetos/arteiro/localizacao.json            # vídeo completo
    python3 -I motor/montar.py projetos/arteiro/localizacao.json --checar   # só 6 quadros-chave em PNG (rápido)

Projeto (caminhos relativos à raiz do repositório):
{
  "cliente": "arteiro",                       # pasta em clientes/
  "template": "localizacao",                  # motor/templates/<template>.html
  "saida": "entregas/arteiro/Arteiro_Localizacao_v1.mp4",
  "dados": { ... },                           # textos/tempos do template (ver formatos/)
  "clipes": [ {"src": "brutos/arteiro/dji_0451.mp4", "in": 3.0, "dur": 5.0} ],   # opcional: takes por baixo do motion
  "audio": { "narracao": "brutos/arteiro/narracao.wav",                         # opcional
             "trilha": "brutos/trilhas/xxx.mp3", "trilha_db": -20,
             "som_clipes": false }              # sem "audio" => vídeo mudo (faixa silenciosa, padrão de story)
}
Nunca sobrescreve uma saída existente: suba a versão (v2, v3...).
"""
import json, os, subprocess, sys, shutil, tempfile
from pathlib import Path

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30


def abs_(p):
    return p if (p is None or os.path.isabs(p)) else os.path.join(RAIZ, p)


def sh(cmd):
    print('  $', ' '.join(cmd if len(' '.join(cmd)) < 300 else cmd[:6] + ['...']))
    subprocess.run(cmd, check=True)


def carregar(proj_path):
    proj = json.load(open(proj_path, encoding='utf-8'))
    cdir = os.path.join(RAIZ, 'clientes', proj['cliente'])
    marca = json.load(open(os.path.join(cdir, 'marca.json'), encoding='utf-8'))
    # caminhos viram file:// URI (funciona no Windows, Mac e Linux)
    uri = lambda p: Path(p).resolve().as_uri()
    marca['logo'] = uri(os.path.join(cdir, marca['logo']))
    dados = proj.get('dados', {})
    for k in ('fundo', 'foto'):
        if dados.get(k):
            dados[k] = uri(abs_(dados[k]))
    for cena in dados.get('cenas', []):
        if cena.get('foto'):
            cena['foto'] = uri(abs_(cena['foto']))
    tem_clipes = bool(proj.get('clipes'))
    spec = {'template': proj['template'], 'marca': marca, 'dados': dados, 'base_dir': Path(RAIZ).as_uri(), 'transparente': tem_clipes}
    return proj, spec


def checar_publicacao(proj, spec):
    """Trava de qualidade: avisa o que não pode ir ao ar sem confirmação."""
    m, avisos = spec['marca'], []
    loc = m.get('local', {})
    if proj['template'] == 'localizacao' and loc.get('endereco') and not loc.get('endereco_confirmado'):
        avisos.append(f"Endereço '{loc['endereco']}' não confirmado — o cartão final mostra só bairro/cidade.")
    if proj['template'] == 'localizacao' and not loc.get('endereco'):
        avisos.append('Sem endereço completo na ficha: o cartão final mostra só bairro/cidade. Pedir rua e número ao cliente.')
    if not proj.get('clipes') and not spec['dados'].get('fundo') and proj['template'] == 'localizacao':
        avisos.append('Sem take de vídeo nem foto de fundo: versão só-motion. Ideal: drone/fachada real do cliente.')
    for a in avisos:
        print('  ⚠', a)
    return avisos


def montar(proj_path, checar=False):
    proj, spec = carregar(proj_path)
    saida = abs_(proj['saida'])
    print(f"\n== {proj['cliente']} · {proj['template']} -> {os.path.relpath(saida, RAIZ)}")
    checar_publicacao(proj, spec)
    tmp = tempfile.mkdtemp(prefix='cape_')
    spec_path = os.path.join(tmp, 'spec.json')
    json.dump(spec, open(spec_path, 'w', encoding='utf-8'), ensure_ascii=False)
    quadros = os.path.join(tmp, 'q')

    if checar:
        dur = spec['dados'].get('dur', 15)
        ts = [round(dur * k, 2) for k in (0.08, 0.2, 0.32, 0.55, 0.72, 0.93)]
        destino = os.path.splitext(saida)[0] + '_checagem'
        os.makedirs(destino, exist_ok=True)
        sh(['node', os.path.join(RAIZ, 'motor', 'render.js'), spec_path, destino, '--times', ','.join(map(str, ts))])
        print('  quadros em', os.path.relpath(destino, RAIZ))
        return destino

    if os.path.exists(saida):
        sys.exit(f'Já existe {saida} — suba a versão no nome (nunca sobrescrever).')
    os.makedirs(os.path.dirname(saida), exist_ok=True)
    sh(['node', os.path.join(RAIZ, 'motor', 'render.js'), spec_path, quadros])
    dur = json.load(open(os.path.join(quadros, '_info.json')))['dur']

    ins, filtros, n = [], [], 0
    clipes = proj.get('clipes') or []
    if clipes:
        partes = []
        for c in clipes:
            ins += ['-ss', str(c.get('in', 0)), '-t', str(c['dur']), '-i', abs_(c['src'])]
            filtros.append(f"[{n}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps={FPS},setsar=1,format=yuv420p[c{n}]")
            partes.append(f'[c{n}]'); n += 1
        filtros.append(f"{''.join(partes)}concat=n={len(partes)}:v=1:a=0,tpad=stop_mode=clone:stop_duration={dur}[base]")
        ins += ['-framerate', str(FPS), '-i', os.path.join(quadros, '%05d.png')]
        filtros.append(f'[base][{n}:v]overlay=format=auto:shortest=1,format=yuv420p[v]'); n += 1
    else:
        ins += ['-framerate', str(FPS), '-i', os.path.join(quadros, '%05d.png')]
        filtros.append(f'[{n}:v]format=yuv420p[v]'); n += 1

    au = proj.get('audio') or {}
    vozes = []
    if au.get('narracao'):
        ins += ['-i', abs_(au['narracao'])]; filtros.append(f'[{n}:a]aresample=48000,asplit=2[nar][nsc]'); vozes.append('nar'); n += 1
    if au.get('som_clipes') and clipes:
        ins_idx = [i for i in range(len(clipes))]
        filtros.append(''.join(f'[{i}:a]' for i in ins_idx) + f'concat=n={len(ins_idx)}:v=0:a=1[sc]'); vozes.append('sc')
    if au.get('trilha'):
        ins += ['-stream_loop', '-1', '-i', abs_(au['trilha'])]
        db = au.get('trilha_db', -18)
        filtros.append(f'[{n}:a]aresample=48000,volume={db}dB,afade=t=out:st={max(dur - 1.2, 0)}:d=1.2[tr]'); n += 1
        if 'nar' in vozes:
            filtros.append('[tr][nsc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[trd]'); vozes.append('trd')
        else:
            vozes.append('tr')
    elif 'nar' in vozes:
        filtros.append('[nsc]anullsink')
    if vozes:
        filtros.append(''.join(f'[{v}]' for v in vozes) + f'amix=inputs={len(vozes)}:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,atrim=0:{dur}[a]')
    else:
        ins += ['-f', 'lavfi', '-t', str(dur), '-i', 'anullsrc=r=48000:cl=stereo']
        filtros.append(f'[{n}:a]anull[a]'); n += 1

    sh(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *ins, '-filter_complex', ';'.join(filtros),
        '-map', '[v]', '-map', '[a]', '-t', str(dur), '-r', str(FPS),
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', saida])

    capa_t = spec['dados'].get('capa_t', round(dur * 0.3, 2))
    sh(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(capa_t), '-i', saida, '-frames:v', '1', '-q:v', '2',
        os.path.splitext(saida)[0] + '_capa.jpg'])
    shutil.rmtree(tmp, ignore_errors=True)
    print('  OK', os.path.relpath(saida, RAIZ))
    return saida


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit(__doc__)
    for p in args:
        montar(p, checar='--checar' in sys.argv)
