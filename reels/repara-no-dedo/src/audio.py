"""Trilha + efeitos sonoros sintetizados para a previa "Repara no dedo".

Tudo deterministico (semente fixa). 120 BPM, 13 compassos = 26 s exatos.
- Musica passa por um passa-baixa automatizado: abafado no "antes", aberto no "depois".
- Compasso 12 (Mi) resolve no compasso 0 (Lá menor) quando o video volta ao comeco.
- A cauda (reverb/decay) depois de 26 s e somada no inicio: o loop nao tem emenda.

Uso: python3 -I src/audio.py out/events.json out/audio_raw.wav
"""
import json
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

SR = 48000
LOOP = 26.0
TAIL = 3.0
N = int((LOOP + TAIL) * SR)
rng = np.random.default_rng(20261107)

events = json.load(open(sys.argv[1]))
out_path = sys.argv[2]


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def pan_gains(p):
    a = (p + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


def place(buf, sig, t, gain=1.0, pan=0.0):
    """Soma sinal mono (ou estereo Nx2) no buffer estereo, no instante t."""
    i = int(round(t * SR))
    if i >= len(buf):
        return
    if sig.ndim == 1:
        gl, gr = pan_gains(pan)
        sig = np.stack([sig * gl, sig * gr], axis=1)
    n = min(len(sig), len(buf) - i)
    buf[i:i + n] += sig[:n] * gain


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


# ------------------------------------------------------------------ instrumentos
def kick():
    t = tt(0.5)
    f = 46 + 104 * np.exp(-t / 0.032)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.17)
    click = hp(noise(0.5), 2500) * np.exp(-t / 0.0025) * 0.25
    return np.tanh(1.6 * (body + click)) * 0.9


def clap():
    t = tt(0.45)
    n = bp(noise(0.45), 900, 2800)
    env = np.zeros_like(t)
    for o in (0.0, 0.011, 0.022):
        env += np.where(t >= o, np.exp(-(t - o) / 0.0045), 0)
    env += np.where(t >= 0.03, np.exp(-(t - 0.03) / 0.11), 0) * 0.55
    return n * env * 0.5


def hat(open_=False):
    d = 0.32 if open_ else 0.09
    t = tt(d)
    return hp(noise(d), 7200) * np.exp(-t / (0.11 if open_ else 0.022)) * 0.6


def bass(m, dur):
    t = tt(dur + 0.06)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + 0.42 * np.sin(4 * np.pi * f * t) + 0.16 * np.sin(6 * np.pi * f * t)
    env = np.minimum(1, t / 0.006) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.02))
    return np.tanh(1.4 * s * env) * 0.8


def ep_note(m, dur=0.5, decay=0.28, bright=1.0):
    t = tt(dur)
    out = np.zeros((len(t), 2))
    for det, p in ((-5, -0.35), (5, 0.35)):
        f = mtof(m) * 2 ** (det / 1200)
        s = np.zeros_like(t)
        for k, a in enumerate((1, .5, .25, .14, .08), start=1):
            s += a * (bright if k > 1 else 1) * np.sin(2 * np.pi * f * k * t) * np.exp(-t / (decay / (1 + 0.6 * (k - 1))))
        s *= np.minimum(1, t / 0.004)
        gl, gr = pan_gains(p)
        out[:, 0] += s * gl
        out[:, 1] += s * gr
    return out * 0.5


def pad(chord, dur):
    t = tt(dur + 0.4)
    out = np.zeros((len(t), 2))
    env = np.minimum(1, t / 0.3) * np.where(t < dur, 1, np.exp(-(t - dur) / 0.15))
    for m in chord:
        for det, p in ((-8, -0.6), (0, 0), (8, 0.6)):
            f = mtof(m + 12) * 2 ** (det / 1200)
            s = sum(np.sin(2 * np.pi * f * k * t + k) / k for k in range(1, 9))
            gl, gr = pan_gains(p)
            out[:, 0] += s * env * gl
            out[:, 1] += s * env * gr
    out[:, 0] = lp(out[:, 0], 1700)
    out[:, 1] = lp(out[:, 1], 1700)
    return out * 0.02


# ------------------------------------------------------------------ arranjo
CH = {"Am": [57, 60, 64, 67], "F": [53, 57, 60, 64], "C": [55, 60, 62, 64], "G": [55, 59, 62, 67], "E": [56, 59, 62, 64]}
ROOT = {"Am": 33, "F": 29, "C": 36, "G": 31, "E": 28}
PROG = ["Am", "F", "C", "G", "Am", "F", "C", "G", "Am", "F", "C", "G", "E"]

drums = np.zeros((N, 2))
bassb = np.zeros((N, 2))
keys = np.zeros((N, 2))
pads = np.zeros((N, 2))
send = np.zeros((N, 2))  # envio para o reverb
K, CL, HC, HO = kick(), clap(), hat(), hat(True)
kick_times = []

for b, name in enumerate(PROG):
    t0 = b * 2.0
    build = b == 9          # compasso de preparacao (18-20 s)
    for q in range(4):      # bumbo 4x4
        kt = t0 + q * 0.5
        if build and kt >= 19.5:
            continue
        place(drums, K, kt, 1.0)
        kick_times.append(kt)
    if not build:
        for q in (1, 3):
            place(drums, CL, t0 + q * 0.5, 0.55)
            place(send, CL, t0 + q * 0.5, 0.2)
    else:                   # rufada de palmas 19,0-19,5
        for i, x in enumerate(np.arange(19.0, 19.5, 0.0625)):
            place(drums, CL, x, 0.18 + 0.05 * i)
    for s16 in range(16):
        ht = t0 + s16 * 0.125
        if build and ht >= 19.5:
            continue
        if s16 % 4 == 2:
            place(drums, HO, ht, 0.11, pan=0.2)
        else:
            place(drums, HC, ht, 0.07 if s16 % 2 == 0 else 0.045, pan=-0.15 if s16 % 2 else 0.15)
    if not build:
        for off, d in ((0, 0.22), (0.75, 0.2), (1.0, 0.22), (1.5, 0.2), (1.75, 0.2)):
            place(bassb, bass(ROOT[name] + (12 if off in (0.75, 1.75) else 0), d), t0 + off, 0.42)
        for q in range(4):
            gain = 0.19 if b == 10 else 0.15
            for m in CH[name]:
                st = ep_note(m)
                place(keys, st, t0 + 0.25 + q * 0.5, gain)
                place(send, st, t0 + 0.25 + q * 0.5, gain * 0.35)
    pd = pad(CH[name], 2.0)
    place(pads, pd, t0, 1.0)
    place(send, pd, t0, 0.3)
    if b in (10, 11):       # arpejo no drop e no final
        arp = [m + 12 for m in CH[name]] + [CH[name][0] + 24]
        for s16 in range(16):
            m = arp[(s16 * 3) % len(arp)]
            nt = ep_note(m, dur=0.25, decay=0.09, bright=1.3)
            g = 0.11 if b == 10 else 0.07
            place(keys, nt, t0 + s16 * 0.125, g, )
            place(send, nt, t0 + s16 * 0.125, g * 0.5)

# bombeamento (sidechain do bumbo)
pump = np.ones(N)
for kt in kick_times:
    i = int(kt * SR)
    t = np.arange(int(0.35 * SR)) / SR
    seg = 1 - 0.5 * np.exp(-t / 0.1)
    n = min(len(seg), N - i)
    pump[i:i + n] = np.minimum(pump[i:i + n], seg[:n])
bassb *= pump[:, None]
keys *= (0.35 + 0.65 * pump)[:, None]
pads *= (0.2 + 0.8 * pump)[:, None]

# subida (riser) 19,0 -> 19,95 e impacto do drop
riser = np.zeros((N, 2))
d = 0.95
t = tt(d)
r = noise(d)
blocks = np.array_split(np.arange(len(r)), 40)
for i, idx in enumerate(blocks):
    f = 500 * (16 ** (i / 39))
    r[idx] = bp(r[idx], max(200, f * 0.5), min(20000, f * 1.6), 1)
tone = np.sin(2 * np.pi * np.cumsum(220 + 900 * (t / d) ** 2) / SR) * 0.25
place(riser, (r * 0.6 + tone) * (t / d) ** 2.2, 19.0, 0.32)

music = drums + bassb + keys + pads + riser

# reverb (IR sintetico)
ir_t = tt(1.8)
ir = np.stack([lp(rng.standard_normal(len(ir_t)), 5500) * np.exp(-ir_t / 0.42) for _ in range(2)], axis=1)
ir /= np.sqrt((ir ** 2).sum(axis=0))
wet = np.stack([fftconvolve(send[:, c], ir[:, c])[:N] for c in range(2)], axis=1)
music += wet * 0.55

# ------------------------------------------------------------------ passa-baixa automatizado
CUT = [(0, 420), (2.42, 420), (2.62, 17000), (5.45, 17000), (5.95, 420), (7.85, 420), (8.1, 17000),
       (11.55, 17000), (12.0, 420), (13.85, 420), (14.1, 17000), (17.55, 17000), (18.0, 2400),
       (19.5, 7000), (19.98, 7000), (20.0, 17000), (25.0, 17000), (26.0, 420), (LOOP + TAIL, 420)]
ct = np.array([c[0] for c in CUT])
cf = np.log(np.array([c[1] for c in CUT], dtype=float))


def cutoff(t):
    return float(np.exp(np.interp(t, ct, cf)))


def lpf_coef(fc, q=0.85):
    w0 = 2 * np.pi * min(fc, SR * 0.45) / SR
    al = np.sin(w0) / (2 * q)
    cw = np.cos(w0)
    b = np.array([(1 - cw) / 2, 1 - cw, (1 - cw) / 2])
    a = np.array([1 + al, -2 * cw, 1 - al])
    return b / a[0], a / a[0]


BL = 64
filtered = np.zeros_like(music)
for ch in range(2):
    zi = np.zeros(2)
    x = music[:, ch]
    for s in range(0, N, BL):
        b, a = lpf_coef(cutoff((s + BL / 2) / SR))
        y, zi = lfilter(b, a, x[s:s + BL], zi=zi)
        filtered[s:s + BL, ch] = y

# impacto e prato do drop entram depois do filtro (sempre abertos)
sfx = np.zeros((N, 2))
t = tt(1.8)
boom = np.sin(2 * np.pi * np.cumsum(38 + 24 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.6)
boom += 0.35 * np.sin(2 * np.pi * np.cumsum(2 * (38 + 24 * np.exp(-t / 0.08))) / SR) * np.exp(-t / 0.4)
place(sfx, np.tanh(1.3 * boom), 20.0, 0.55)
t = tt(2.6)
crash = np.stack([hp(noise(2.6), 4200) * np.exp(-t / 0.85) for _ in range(2)], axis=1)
place(sfx, crash, 20.0, 0.10)


# ------------------------------------------------------------------ efeitos sonoros (discretos)
def whoosh(dur, f0, f1, peak=0.6):
    t = tt(dur)
    n = noise(dur)
    blocks = np.array_split(np.arange(len(n)), 30)
    for i, idx in enumerate(blocks):
        f = f0 * (f1 / f0) ** (i / 29)
        n[idx] = bp(n[idx], max(150, f * 0.6), min(18000, f * 1.6), 1)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    env = np.where(t / dur < peak, np.sin(np.pi / 2 * t / (dur * peak)) ** 2, np.cos(np.pi / 2 * (t / dur - peak) / (1 - peak)) ** 2)
    return n * env


def click(f=2400, dur=0.03, tau=0.006):
    t = tt(dur)
    return (np.sin(2 * np.pi * f * t) * 0.6 + hp(noise(dur), 3000) * 0.4) * np.exp(-t / tau)


def toc():
    t = tt(0.16)
    f = 120 + 120 * np.exp(-t / 0.012)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.045)
    c = np.zeros_like(body)
    ck = click(3400, 0.02, 0.003)
    c[:len(ck)] = ck
    return np.tanh(2 * body) * 0.9 + c * 0.35


def pop(f0=520, f1=900, dur=0.07):
    t = tt(dur)
    f = f0 + (f1 - f0) * (t / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.022)


def chime(m, dur=0.6):
    t = tt(dur)
    f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.01 * f * t)) * np.exp(-t / 0.22) * np.minimum(1, t / 0.003)


def pan_sweep(sig, p0, p1):
    k = np.linspace(0, 1, len(sig))
    a = (np.interp(k, [0, 1], [p0, p1]) + 1) * np.pi / 4
    return np.stack([sig * np.cos(a), sig * np.sin(a)], axis=1)


def stamp():
    t = tt(0.25)
    thud = np.sin(2 * np.pi * np.cumsum(90 + 80 * np.exp(-t / 0.01)) / SR) * np.exp(-t / 0.05)
    paper = bp(noise(0.25), 1200, 5000) * np.exp(-t / 0.03)
    return np.tanh(2.2 * thud) * 0.8 + paper * 0.5


rev_sfx = np.zeros((N, 2))
for e in events:
    t0, ty = e["t"], e["type"]
    if ty == "tick":
        v = min(1.0, e["v"] / 3000)
        place(sfx, click(2600 + 1400 * v, 0.02, 0.0035), t0, 0.05 + 0.03 * v, pan=0.1)
    elif ty == "flick":
        w = whoosh(0.32 if e.get("big") else 0.16, 1800, 5200, 0.4)
        place(sfx, w, t0, 0.05 if e.get("big") else 0.03)
    elif ty == "rewind":
        place(sfx, whoosh(1.0, 500, 4200, 0.85), t0, 0.12)
    elif ty == "stop":
        place(sfx, toc(), t0, 0.32)
    elif ty == "expand":
        place(sfx, whoosh(0.35, 1200, 6000, 0.3), t0, 0.06)
    elif ty == "collapse":
        place(sfx, whoosh(0.3, 5000, 1200, 0.5), t0, 0.05)
    elif ty == "swipe":
        place(sfx, pan_sweep(whoosh(0.5, 900, 4000, 0.5), 0.6, -0.6), t0, 0.12)
    elif ty in ("tap", "press", "rest"):
        place(sfx, click(1900, 0.03, 0.005), t0, 0.16)
    elif ty in ("sheet", "slide"):
        place(sfx, whoosh(0.38, 700, 2600, 0.35), t0, 0.07)
    elif ty == "key":
        place(sfx, bp(noise(0.03), 1500, 4500) * np.exp(-tt(0.03) / 0.006), t0, 0.07, pan=float(rng.uniform(-0.2, 0.2)))
    elif ty == "flip":
        place(sfx, click(3000, 0.02, 0.003), t0, 0.07)
    elif ty == "drop":
        place(sfx, stamp(), t0, 0.42)
    elif ty == "ring":
        for i, m in enumerate([69, 72, 76, 79, 81, 84]):     # seis notas, uma por cor do anel
            place(sfx, chime(m), t0 + 0.05 * i, 0.07, pan=-0.5 + 0.2 * i)
            place(rev_sfx, chime(m), t0 + 0.05 * i, 0.07)
        place(sfx, whoosh(0.8, 600, 5000, 0.5), t0, 0.07)
    elif ty == "word":
        place(sfx, pop(480, 820), t0, 0.12)
    elif ty == "sig":
        place(sfx, chime(88, 0.8), t0, 0.04)
        place(rev_sfx, chime(88, 0.8), t0, 0.05)
    elif ty == "hook":
        place(sfx, pop(420, 700), t0, 0.08)
    elif ty == "hookpill":
        place(sfx, pop(560, 1000), t0, 0.12)

sfx += np.stack([fftconvolve(rev_sfx[:, c], ir[:, c])[:N] for c in range(2)], axis=1) * 0.5

mix = filtered * 0.9 + sfx
mix = np.tanh(mix * 1.1) / 1.1

# dobra a cauda (> 26 s) para o inicio: loop sem emenda
L = int(LOOP * SR)
loop = mix[:L].copy()
tail = mix[L:]
loop[:len(tail)] += tail

peak = np.abs(loop).max()
loop = loop / peak * 0.89
print(f"pico antes da normalizacao: {peak:.3f}  duracao: {len(loop) / SR:.3f}s")
pcm = (np.clip(loop, -1, 1) * 32767).astype("<i2")
with wave.open(out_path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
