"""Trilha sonora procedural (sem narração, como na referência): rumble de terremoto,
chocalhar, colapsos sincronizados com events.json, silêncio na virada, vento e pássaros."""
import json, wave, sys
import numpy as np

SR = 44100
DUR = 90.0
N = int(SR * DUR)
rng = np.random.default_rng(42)
T = np.arange(N) / SR
ev = json.load(open('events.json'))
QS, QE = 7.0, 69.4


def smooth(a, b, x):
    x = np.clip((x - a) / (b - a), 0, 1)
    return x * x * (3 - 2 * x)


def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)   # passa-altas suave
    if hi: m *= 1 / (1 + (f / hi) ** 4)                      # passa-baixas suave
    return np.fft.irfft(X * m, len(x))


def noise(n=None):
    return rng.standard_normal(N if n is None else n)


def norm(x):
    return x / (np.max(np.abs(x)) + 1e-9)


# ---------------------------------------------------------------- rumble contínuo (tremor)
quake = smooth(QS, QS + 1.8, T) * (0.55 + 0.45 * smooth(QS + 2, 45, T)) * (1 - smooth(QE - 0.05, QE + 0.2, T))
brown = np.cumsum(noise()); brown = fft_filter(brown, lo=8)
rumble = norm(fft_filter(brown, lo=18, hi=70))
wob = 0.65 + 0.35 * np.sin(2 * np.pi * (3.2 + 2.0 * smooth(QS, 60, T)) * T) * np.sin(2 * np.pi * 0.37 * T)
sub = np.sin(2 * np.pi * (34 + 4 * np.sin(2 * np.pi * 0.11 * T)) * T) * 0.5
low = (rumble * 0.9 + sub) * wob * quake * 0.9

# chocalhar / estalos (agudos), abafado quando a poeira engole a câmera
rattle_env = quake * (0.25 + 0.75 * smooth(QS, 50, T)) * (1 - 0.65 * smooth(58, 63, T))
rat = norm(fft_filter(noise(), lo=180, hi=2600))
burst = np.clip(np.sin(2 * np.pi * 7.3 * T + 2 * np.sin(2 * np.pi * 0.9 * T)), 0, 1) ** 3
mid = rat * burst * rattle_env * 0.35
clicks = np.zeros(N)
idx = rng.integers(int(QS * SR), int(QE * SR), 900)
for i in idx:
    k = rng.integers(40, 260)
    clicks[i:i + k] += rng.standard_normal(min(k, N - i)) * np.exp(-np.arange(min(k, N - i)) / (k / 4)) * rng.uniform(0.2, 1)
clicks = fft_filter(clicks, lo=500, hi=6000) * quake * (1 - 0.7 * smooth(58, 63, T)) * 0.5

mix = low * 0.45 + mid + clicks


def add(sig, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= N: return
    seg = sig[: N - i]
    mix[i:i + len(seg)] += seg * gain


# ---------------------------------------------------------------- colapsos sincronizados
def collapse(size, dur):
    L = int((dur + 3.5) * SR)
    t = np.arange(L) / SR
    swell = smooth(0, dur * 0.55, t) * np.exp(-np.maximum(t - dur * 0.7, 0) / 1.8)
    body = norm(fft_filter(noise(L), lo=25, hi=500 + 700 * (1 - size))) * swell
    thump = np.sin(2 * np.pi * (95 * np.exp(-t / 0.5) + 28) * t) * np.exp(-t / 0.9)
    thump *= smooth(dur * 0.35, dur * 0.4, t)
    crash = norm(fft_filter(noise(L), lo=300, hi=4500)) * np.exp(-np.abs(t - dur * 0.55) / 0.7) * 0.5
    rub = norm(fft_filter(noise(L), lo=900, hi=5000)) * (np.random.default_rng(int(size * 1e4)).random(L) > 0.9985).astype(float)
    rub = np.fft.irfft(np.fft.rfft(rub) * np.fft.rfft(np.exp(-np.arange(900) / 120), len(rub)), len(rub)) * np.exp(-np.maximum(t - dur * 0.6, 0) / 1.5) * 0.9
    return (body * 0.9 + thump * 0.9 + crash * 0.7 + rub * 0.4) * (0.35 + 0.65 * size)


for e in ev:
    if e['type'] == 'collapse':
        dur = e.get('dur', 3.5)
        gain = 0.55 if e['t'] < 59 else 0.38  # mais abafado dentro da nuvem
        add(collapse(e.get('size', 0.5), dur), e['t'] - dur * 0.5, gain)
    elif e['type'] == 'cristo':
        L = int(9 * SR); t = np.arange(L) / SR
        creak = norm(fft_filter(noise(L), lo=120, hi=900)) * (np.sin(2 * np.pi * 9 * t) * 0.5 + 0.5) * smooth(0, 2.3, t) * (1 - smooth(2.3, 2.6, t))
        boom = np.sin(2 * np.pi * (70 * np.exp(-t / 1.6) + 22) * t) * np.exp(-t / 2.4) * smooth(2.5, 2.6, t)
        smash = norm(fft_filter(noise(L), lo=80, hi=3500)) * np.exp(-np.maximum(t - 2.6, 0) / 1.2) * smooth(2.5, 2.55, t)
        add(creak * 0.7 + boom * 1.6 + smash * 0.9, e['t'] - 2.6, 0.8)

# ---------------------------------------------------------------- ambiência da cidade (antes do tremor)
cb = fft_filter(np.cumsum(noise()), lo=40, hi=420); cb = norm(cb)
car = np.clip(np.sin(2 * np.pi * 0.21 * T + 1.0) * np.sin(2 * np.pi * 0.07 * T + 0.4), 0, 1) ** 2
bed = (cb * (0.18 + 0.35 * car) + norm(fft_filter(noise(), lo=2000, hi=6000)) * 0.03) * (1 - smooth(6.6, 10.5, T)) * smooth(0, 0.8, T)
mix += bed * 20.0

# ---------------------------------------------------------------- queda de energia (luzes apagando)
hum = np.sin(2 * np.pi * 60 * T) * 0.5 + np.sin(2 * np.pi * 120 * T) * 0.25
hum *= smooth(10, 14, T) * (1 - smooth(57.5, 64.5, T)) * 0.025 * (T < QE)
mix += hum

# ---------------------------------------------------------------- virada: o tremor para (silêncio)
mix *= 1 - smooth(QE - 0.05, QE + 0.15, T) * (T < QE + 0.3)  # corte seco do rumble
post = T >= QE
# vento + poeira assentando
wind = norm(fft_filter(noise(), lo=220, hi=1300)) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.13 * T + 1.3) ** 2)
wenv = smooth(QE + 0.5, QE + 4, T) * (1 - 0.55 * smooth(76, 86, T)) * 0.2 * post
air = norm(fft_filter(noise(), lo=2500, hi=7000)) * smooth(QE + 3, QE + 8, T) * 0.035 * post
# pad emocional (A menor, bem suave): A2, E3, A3, C4
pad = sum(np.sin(2 * np.pi * f * T + p) * a for f, p, a in [(110, 0, .5), (164.8, 1.1, .35), (220, 2.0, .3), (261.6, .4, .18)])
pad *= (0.8 + 0.2 * np.sin(2 * np.pi * 0.08 * T)) * smooth(QE + 1.2, QE + 7, T) * 0.06 * (1 - smooth(89.2, 90, T)) * post
# sino grave quando o tremor para
bell_t = np.maximum(T - (QE + 0.35), 0)
bell = (np.sin(2 * np.pi * 55 * T) + 0.5 * np.sin(2 * np.pi * 110.4 * T)) * np.exp(-bell_t / 3.2) * (T > QE + 0.35) * 0.22
mix += wind * wenv + air + pad + bell

# pássaros (epílogo)
for k in range(40):
    t0 = rng.uniform(78.3, 86.5)
    L = int(rng.uniform(0.12, 0.35) * SR); t = np.arange(L) / SR
    f0 = rng.uniform(2200, 4200)
    ph = 2 * np.pi * np.cumsum(f0 * (1 + 0.35 * np.sin(2 * np.pi * rng.uniform(8, 18) * t) + rng.uniform(-.25, .25) * t / t[-1])) / SR
    chirp = np.sin(ph) * np.sin(np.pi * t / t[-1]) ** 2
    add(chirp, t0, 0.045 * smooth(78, 82, np.array([t0]))[0] + 0.01)


# ================================================================ V2: som audível em celular + música
def env_exp(t, d): return np.exp(-np.maximum(t, 0) / d) * (t >= 0)

# (a) rumble com harmônicos (saturação do grave -> médios), é isso que o alto-falante do celular reproduz
sat = np.tanh(3.2 * norm(low)) * quake
roar = norm(fft_filter(sat, lo=90, hi=700)) * quake * 0.55
grind = norm(fft_filter(noise(), lo=350, hi=2600)) * (0.45 + 0.55 * np.abs(np.sin(2 * np.pi * 0.7 * T + np.sin(2 * np.pi * 0.19 * T) * 2))) * quake * (0.35 + 0.65 * smooth(QS, 45, T)) * (1 - 0.5 * smooth(58, 63, T)) * 0.65
shim = norm(fft_filter(noise(), lo=3000, hi=9000)) * quake * (np.random.default_rng(3).random(N) > 0.5) * 0.06
mix += roar + grind + shim

# estalos de vidro/concreto nos colapsos (agudos)
for e in ev:
    if e['type'] == 'collapse':
        L = int(2.2 * SR); t = np.arange(L) / SR
        glass = norm(fft_filter(noise(L), lo=2500, hi=9000)) * env_exp(t - 0.0, 0.35) * (rng.random(L) > 0.8)
        deb = norm(fft_filter(noise(L), lo=500, hi=3500)) * env_exp(t, 0.9)
        add(glass * 0.55 + deb * 0.7, e['t'] - e.get('dur', 3.5) * 0.35, 0.34 * (0.4 + e.get('size', .5)))

# (b) MÚSICA -------------------------------------------------------------
def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
def pluck(f, dur=2.4, bright=1.0):
    t = np.arange(int(dur * SR)) / SR
    y = sum(np.sin(2 * np.pi * f * h * t + 0.3 * h) / h ** (1.15 / bright) * np.exp(-t * (1.8 + 1.1 * h)) for h in range(1, 7))
    return y * np.minimum(1, t / 0.004)
def padnote(f, dur, a=1.2, r=1.8):
    t = np.arange(int(dur * SR)) / SR
    y = sum(np.sin(2 * np.pi * f * (1 + dt) * t) + 0.5 * np.sin(2 * np.pi * 2 * f * (1 + dt) * t) + 0.25 * np.sin(2 * np.pi * 3 * f * (1 + dt) * t) for dt in (-0.003, 0, 0.003))
    return y * np.minimum(1, t / a) * np.minimum(1, (dur - t) / r)
music = np.zeros(N)
def madd(sig, t0, g=1.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    seg = sig[:N - i]; music[i:i + len(seg)] += seg * g

BAR = 4.0
chords_m = [[45, 57, 60, 64], [41, 53, 57, 60], [48, 55, 60, 64], [43, 55, 59, 62]]  # Am F C G
# TENSÃO (7 → 69,4): drone em Lá + pulso grave tipo coração que acelera
for k, t0 in enumerate(np.arange(QS, QE, BAR)):
    ch = chords_m[0] if k % 4 in (0, 2) else chords_m[1 if k % 4 == 1 else 3]
    for n in ch[:3]:
        madd(padnote(midi(n) * (2 if n < 50 else 1), BAR + 1.5, 1.5, 1.5), t0, 0.07 * (0.5 + 0.5 * smooth(QS, 45, np.array([t0]))[0]))
t = QS
while t < QE:
    prog = (t - QS) / (QE - QS)
    madd(pluck(55, 0.9, 1.4) * 1.6, t, 0.16 * (0.5 + prog)); madd(pluck(110, 0.6, 1.2), t, 0.10 * (0.5 + prog))
    t += 1.15 - 0.62 * prog   # acelera
# riser antes da queda do Cristo + impacto
Lr = int(5.5 * SR); tr = np.arange(Lr) / SR
riser = norm(fft_filter(noise(Lr), lo=700, hi=6000)) * (tr / tr[-1]) ** 2.2
madd(riser, 55.0 + 2.6 - 5.5, 0.22)
madd(np.sin(2 * np.pi * (180 * np.exp(-np.arange(int(3 * SR)) / SR / 0.35) + 38) * np.arange(int(3 * SR)) / SR) * env_exp(np.arange(int(3 * SR)) / SR, 1.1), 57.6, 0.55)
# ALÍVIO (69,4 → 90): arpejo em lá menor -> dó maior, bem emocional
seq = [[57, 60, 64, 69, 72, 69, 64, 60], [53, 57, 60, 65, 69, 65, 60, 57], [48, 55, 60, 64, 67, 64, 60, 55], [55, 59, 62, 67, 71, 67, 62, 59]]
t0 = QE + 2.2; k = 0
while t0 < 88.2:
    arp = seq[k % 4]
    for j, n in enumerate(arp):
        tt = t0 + j * 0.5
        if tt < 89.2: madd(pluck(midi(n), 2.2, 1.0), tt, 0.20 * smooth(QE + 2, QE + 8, np.array([tt]))[0] * (1 - smooth(87, 89.2, np.array([tt]))[0]))
    for n in chords_m[k % 4][1:]:
        madd(padnote(midi(n) * 2, BAR + 1.5, 1.4, 1.8), t0, 0.075 * smooth(QE + 3, QE + 10, np.array([t0]))[0])
    t0 += BAR; k += 1
music = fft_filter(music, lo=70)
mix += music * 0.9

# ---------------------------------------------------------------- mixagem final
mix *= 1 - smooth(89.0, 90.0, T) * (T > 89.0) * 0.0  # mantém o pad até o fim
fade = np.minimum(1, T / 0.15) * np.minimum(1, (DUR - T) / 1.0)
mix *= fade
# compressor leve + soft clip
mix = np.tanh(mix * 1.15 / (np.percentile(np.abs(mix), 99.8) + 1e-9) * 1.1) / np.tanh(1.1)
mix *= 0.6
# estéreo: leve decorrelação
dl = np.roll(mix, 37) * 0.18; dr = np.roll(mix, -41) * 0.18
L = mix * 0.85 + dl; Rr = mix * 0.85 + dr
pcm = np.stack([L, Rr], 1)
pcm = (np.clip(pcm, -1, 1) * 32767).astype('<i2')
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', pcm.shape, 'rms dB', 20 * np.log10(np.sqrt(np.mean((pcm / 32767.0) ** 2)) + 1e-9))
