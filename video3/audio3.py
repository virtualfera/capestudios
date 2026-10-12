"""Trilha do teste de 10 s (som de cinema, audível em celular: tudo com conteúdo em médios/agudos)."""
import wave, sys
import numpy as np

SR = 48000; DUR = 10.0; N = int(SR * DUR); T = np.arange(N) / SR
rng = np.random.default_rng(7)
TQ = 4.6


def sm(a, b, x):
    x = np.clip((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x)


def filt(x, lo=None, hi=None):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))


def nrm(x): return x / (np.max(np.abs(x)) + 1e-9)
def noise(n=N): return rng.standard_normal(n)


L = np.zeros(N); Rr = np.zeros(N)
def add(sig, t0, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0
    s = sig[:N - i] * g
    L[i:i + len(s)] += s * (1 - max(0, pan)); Rr[i:i + len(s)] += s * (1 + min(0, pan))


def env(t, a, d): return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)

# ---------------- praia: ondas, burburinho, gaivotas, vento
wave_env = 0.55 + 0.45 * np.sin(2 * np.pi * T / 4.2 - 1.0) ** 2
surf = nrm(filt(noise(), 150, 3500)) * wave_env
near = sm(3.5, 3.7, T) * (1 - 0.6 * sm(6.7, 6.9, T))           # mais perto no plano 2
add(surf * (0.22 + 0.22 * near) * (1 - 0.5 * sm(TQ, TQ + 1.5, T)), 0)
murmur = nrm(filt(noise(), 300, 2200)) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 1.7 * T) * np.sin(2 * np.pi * 0.63 * T)))
add(murmur * (0.07 + 0.09 * near) * (1 - sm(TQ, TQ + 0.6, T)), 0)
wind = nrm(filt(noise(), 400, 2500)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.2 * T)) * (1 - sm(3.5, 3.7, T)) * 0.07
add(wind, 0)
for t0 in [0.8, 2.1, 3.2, 3.9]:
    n = int(0.5 * SR); t = np.arange(n) / SR; f = 1900 + 900 * np.sin(np.pi * t / 0.5) * np.exp(-t * 3)
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.5) ** 2 * 0.06, t0, 1, rng.uniform(-.6, .6))
# bola da altinha (toques no ritmo da cena: a cada 0.62 s, só no plano 2 até o tremor)
k = 0
while k * 0.62 < TQ + 0.2:
    t0 = k * 0.62 + 0.31
    if 3.6 <= t0 < TQ + 0.2:
        n = int(0.12 * SR); t = np.arange(n) / SR
        add((np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.03) + nrm(filt(noise(n), 800, 4000)) * np.exp(-t / 0.01) * 0.4) * 0.22, t0, 1, 0.3)
    k += 1

# ---------------- TREMOR
# estrondo inicial
n = int(3.0 * SR); t = np.arange(n) / SR
boom = np.sin(2 * np.pi * (70 * np.exp(-t / 0.4) + 34) * t) * env(t, 0.01, 0.9)
boom += np.tanh(3 * boom) * 0.6
crack0 = nrm(filt(noise(n), 600, 7000)) * env(t, 0.002, 0.08)
add(filt(boom, 90) * 0.3 + crack0 * 0.7, TQ, 1)
# rumble contínuo com harmônicos (audível no celular)
q = sm(TQ, TQ + 0.4, T) * (0.55 + 0.3 * sm(6.8, 9.6, T)) * (1 - sm(9.93, 9.99, T))
br = np.cumsum(noise()); br = filt(br, 20, 120); br = nrm(br)
roar = nrm(filt(np.tanh(4 * br), 90, 900))
grind = nrm(filt(noise(), 350, 2800)) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 6.3 * T + 2 * np.sin(2 * np.pi * 0.9 * T))))
add((br * 0.05 + roar * 0.42 + grind * 0.34) * q, 0)
# chocalhar: mesas, copos, guarda-sóis
rat = nrm(filt(noise(), 1500, 7000)) * (np.random.default_rng(3).random(N) > 0.93) * q * (T < 6.8)
add(filt(rat, 1200, 8000) * 0.6, 0, 1, -0.3)
for i in range(26):
    t0 = rng.uniform(TQ + 0.1, 6.7); n = int(0.06 * SR); tt = np.arange(n) / SR
    add(np.sin(2 * np.pi * rng.uniform(2500, 5200) * tt) * np.exp(-tt / 0.012) * 0.08, t0, 1, rng.uniform(-.8, .8))   # tilintar de copos
# rachaduras correndo no chão
for t0 in [TQ + 0.05, TQ + 0.2, TQ + 0.35, TQ + 0.6, 6.95]:
    n = int(0.7 * SR); tt = np.arange(n) / SR
    c = nrm(filt(noise(n), 500, 6000)) * (np.random.default_rng(int(t0 * 100)).random(n) > 0.97) * np.exp(-tt / 0.25)
    c = np.convolve(c, np.exp(-np.arange(300) / 40), 'same')
    add(nrm(c) * 0.32, t0, 1, rng.uniform(-.5, .5))
# revoada de pássaros (asas)
n = int(1.8 * SR); tt = np.arange(n) / SR
flap = nrm(filt(noise(n), 300, 3000)) * (0.5 + 0.5 * np.sin(2 * np.pi * 17 * tt)) * env(tt, 0.08, 0.7)
add(flap * 0.22, TQ + 0.2, 1, 0.4)
# gritos/suspiros da multidão (swell filtrado, sem vozes sintéticas)
gasp = nrm(filt(noise(), 500, 2500)) * sm(TQ + 0.2, TQ + 0.8, T) * (1 - sm(5.6, 6.8, T)) * 0.10
add(gasp, 0)

# ---------------- plano 3: fachada desmoronando
fz = sm(7.25, 7.6, T) * (1 - sm(9.93, 9.99, T))
crunch = nrm(filt(noise(), 120, 3000)) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 3.1 * T))) * fz
add(crunch * 0.32, 0)
for i in range(70):
    t0 = rng.uniform(7.3, 9.9); n = int(0.25 * SR); tt = np.arange(n) / SR
    hit = (np.sin(2 * np.pi * rng.uniform(90, 260) * tt) * np.exp(-tt / 0.05) + nrm(filt(noise(n), 400, 5000)) * np.exp(-tt / 0.03)) * rng.uniform(0.03, 0.09)
    add(hit, t0, 1, rng.uniform(-.7, .7))
for i in range(40):  # vidro
    t0 = rng.uniform(7.35, 9.8); n = int(0.4 * SR); tt = np.arange(n) / SR
    g = sum(np.sin(2 * np.pi * rng.uniform(3000, 9000) * tt + rng.uniform(0, 6)) for _ in range(4)) * np.exp(-tt / 0.07) * 0.025
    add(g, t0, 1, rng.uniform(-.8, .8))
# solavanco grande
n = int(1.4 * SR); tt = np.arange(n) / SR
j = np.sin(2 * np.pi * (90 * np.exp(-tt / 0.25) + 40) * tt) * env(tt, 0.005, 0.5); j = np.tanh(2.5 * j)
add(filt(j, 60) * 0.5 + nrm(filt(noise(n), 300, 6000)) * env(tt, 0.002, 0.15) * 0.5, 8.6, 1)

# ---------------- whooshes nos cortes
for tc in [3.6, 6.8]:
    n = int(0.9 * SR); tt = np.arange(n) / SR
    w = nrm(filt(noise(n), 300, 5000)) * np.sin(np.pi * tt / 0.9) ** 3
    add(w * 0.16, tc - 0.6, 1)

# ---------------- música
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def pad(f, d, a=0.8):
    t = np.arange(int(d * SR)) / SR
    y = sum(np.sin(2 * np.pi * f * (1 + dt) * t) + 0.45 * np.sin(4 * np.pi * f * (1 + dt) * t) + 0.2 * np.sin(6 * np.pi * f * (1 + dt) * t) for dt in (-0.004, 0, 0.004))
    return y * np.minimum(1, t / a) * np.minimum(1, (d - t) / 0.6)
for m in [57, 60, 64]: add(pad(midi(m), 4.8, 1.2), 0.1, 0.022)          # calma (Lá menor)
for m in [56, 59, 63]: add(pad(midi(m), 5.3, 0.3), TQ, 0.03)           # tensão (sobe meio tom, dissonante)
t0 = TQ; k = 0
while t0 < 9.95:  # pulso que acelera
    n = int(0.25 * SR); tt = np.arange(n) / SR
    add((np.sin(2 * np.pi * 110 * tt) + 0.5 * np.sin(2 * np.pi * 220 * tt)) * np.exp(-tt / 0.08) * 0.12, t0)
    t0 += max(0.16, 0.5 - k * 0.025); k += 1
rs = int(3.0 * SR); tt = np.arange(rs) / SR
add(nrm(filt(noise(rs), 1500, 9000)) * (tt / tt[-1]) ** 3 * 0.12, 6.95)  # riser até o corte

# ---------------- mix final: corte seco em 9.97 (gancho), soft clip
mix = np.stack([L, Rr], 1)
mix *= np.minimum(1, T / 0.05)[:, None] * (1 - sm(9.95, 9.99, T))[:, None]
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
pcm = (mix * 32767).astype('<i2')
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'audio3.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok')
