#!/usr/bin/env python3
"""Procedural soundtrack + mix for the Encarte Aí reel (no third-party samples).

Reads anim/timeline.json (VO placements, SFX cues, music sections) and writes:
  sfx/stems/{vo,music,sfx}.wav  (pre-master stems)
  sfx/mix.wav                   (48 kHz / 24-bit stereo, -14 LUFS integrated, <= -1 dBTP)

Run with the shared tools venv (numpy, scipy, soundfile, pyloudnorm):
  <scratchpad>/venvs/tools/bin/python sfx/build.py
Sound recipe follows ref/REFERENCE.md (C-minor-world pad, light hits, whooshes,
risers that cut dead, silence drop, logo hit with phone-speaker harmonics).
"""
import json
import os

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, "anim", "timeline.json")))
DUR = TL["duration"]
N = int(round(DUR * SR))
rng = np.random.default_rng(20261013)


# ---------------------------------------------------------------- helpers
def t_axis(n):
    return np.arange(n) / SR


def db(x):
    return 10 ** (x / 20)


def note_hz(name):
    names = {"C": 0, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "Gb": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}
    pitch, octave = (name[:2], name[2:]) if name[:2] in names else (name[:1], name[1:])
    midi = 12 * (int(octave) + 1) + names[pitch]
    return 440.0 * 2 ** ((midi - 69) / 12)


def noise(n, color="white"):
    w = rng.standard_normal(n)
    if color == "pink":
        f = np.fft.rfft(w)
        k = np.arange(len(f))
        k[0] = 1
        w = np.fft.irfft(f / np.sqrt(k), n)
    return w / (np.max(np.abs(w)) + 1e-9)


def sos(kind, f, order=2, q=None):
    if kind == "bp":
        lo, hi = f
        return signal.butter(order, [lo, min(hi, SR / 2 * 0.95)], "bandpass", fs=SR, output="sos")
    return signal.butter(order, min(f, SR / 2 * 0.95), kind, fs=SR, output="sos")


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x, axis=-1)


def tv_filter(x, freqs, kind="lowpass", bw=1.0, block=256):
    """Time-varying 2nd-order filter (block-wise coefficient update, state carried)."""
    y = np.zeros_like(x)
    zi = None
    for i in range(0, len(x), block):
        f = float(np.clip(freqs[min(i, len(freqs) - 1)], 30, SR / 2 * 0.9))
        if kind == "bandpass":
            lo, hi = f / (2 ** (bw / 2)), f * (2 ** (bw / 2))
            s = signal.butter(1, [lo, min(hi, SR / 2 * 0.95)], "bandpass", fs=SR, output="sos")
        else:
            s = signal.butter(2, f, kind, fs=SR, output="sos")
        if zi is None or zi.shape != (s.shape[0], 2):
            zi = np.zeros((s.shape[0], 2))
        y[i:i + block], zi = signal.sosfilt(s, x[i:i + block], zi=zi)
    return y


def env_ar(n, attack, decay_tau, hold=0.0):
    t = t_axis(n)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    d = np.where(t < attack + hold, 1.0, np.exp(-(t - attack - hold) / decay_tau))
    return a * d


def ir(rt60, n_ch=2, predelay=0.012, damp=6000, seed=1):
    r = np.random.default_rng(seed)
    n = int(rt60 * SR)
    t = t_axis(n)
    out = []
    for c in range(n_ch):
        w = r.standard_normal(n) * np.exp(-6.91 * t / rt60)
        w = filt(w, "lowpass", damp, 1)
        w = np.concatenate([np.zeros(int(predelay * SR)), w])
        out.append(w / np.sqrt(np.sum(w ** 2)))
    return np.array(out)


IR_CACHE = {}


def reverb(st, rt60, wet, damp=6000):
    key = (rt60, damp)
    if key not in IR_CACHE:
        IR_CACHE[key] = ir(rt60, damp=damp, seed=int(rt60 * 100))
    h = IR_CACHE[key]
    mono = st.mean(axis=0)
    w = np.array([signal.fftconvolve(mono, h[c])[: st.shape[1] + h.shape[1]] for c in range(2)])
    out = np.zeros((2, w.shape[1]))
    out[:, : st.shape[1]] += st * (1 - wet * 0.5)
    out += w * wet * 1.6
    return out


def pan_st(x, p):
    p = np.clip(p, -1, 1)
    if np.ndim(p) == 0:
        p = np.full(len(x), p)
    ang = (p + 1) * np.pi / 4
    return np.array([x * np.cos(ang), x * np.sin(ang)])


def drive(x, k):
    return np.tanh(k * x) / np.tanh(k)


def sweep_sine(f0, f1, n, curve="exp"):
    t = np.linspace(0, 1, n)
    f = f0 * (f1 / f0) ** t if curve == "exp" else f0 + (f1 - f0) * t
    return np.sin(2 * np.pi * np.cumsum(f) / SR), f


def trim_tail(st, thresh=1e-4):
    a = np.max(np.abs(st), axis=0)
    idx = np.where(a > thresh)[0]
    return st[:, : idx[-1] + 1] if len(idx) else st


# ---------------------------------------------------------------- SFX generators (stereo float)
def g_light_hit(f0=932.33):
    n = int(2.6 * SR)
    t = t_axis(n)
    air = filt(noise(n), "bp", (3000, 16000)) * env_ar(n, 0.003, 0.06)
    flick = f0 * (1 + 0.04 * np.exp(-t / 0.03))
    glint = sum(a * np.sin(2 * np.pi * np.cumsum(flick * m) / SR) * np.exp(-t / (0.6 / m ** 0.5))
                for m, a in [(1, 1.0), (2.76, 0.35), (5.4, 0.18), (8.93, 0.08)])
    glint *= env_ar(n, 0.005, 10)
    x = 0.7 * air + 0.45 * glint
    return reverb(np.array([x, x]) * 0.7, 2.5, 0.4, damp=9000)


def g_whoosh(dur=0.32, pan=0.0, bright=1.0, tonal=0.25):
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    peak = 0.65
    e = np.where(u < peak, (u / peak) ** 2.5, ((1 - u) / (1 - peak)) ** 1.6)
    fc = np.where(u < 0.5, 600 * (3500 / 600) ** (u / 0.5), 3500 * (1200 / 3500) ** ((u - 0.5) / 0.5)) * bright
    x = tv_filter(noise(n, "pink"), fc, "bandpass", bw=1.2)
    x += 0.5 * tv_filter(noise(n), fc * 1.1, "bandpass", bw=0.35)
    ton, _ = sweep_sine(220 * bright, 220 * bright * 2 ** (-3 / 12), n)
    x = (x / (np.max(np.abs(x)) + 1e-9) + tonal * ton) * e
    st = pan_st(x, np.linspace(-pan, pan, n) if pan else 0.0)
    return reverb(st, 1.0, 0.2)


def g_impact_small():
    n = int(1.6 * SR)
    t = t_axis(n)
    sub, _ = sweep_sine(72, 44, int(0.35 * SR))
    sub = np.pad(sub * np.exp(-t[: len(sub)] / 0.18), (0, n - len(sub)))
    body = filt(noise(n), "lowpass", 420) * env_ar(n, 0.002, 0.07)
    body2, _ = sweep_sine(140, 90, n)
    body2 *= env_ar(n, 0.002, 0.09)
    click = filt(noise(n), "bp", (2000, 5000)) * env_ar(n, 0.0005, 0.004)
    x = drive(0.9 * sub + 0.6 * body + 0.5 * body2 + 0.25 * click, 2.2)
    st = np.array([x, x])
    wet = reverb(np.array([body + click, body + click]) * 0.4, 1.6, 0.25)
    out = np.zeros((2, max(st.shape[1], wet.shape[1])))
    out[:, : st.shape[1]] += st
    out[:, : wet.shape[1]] += wet * 0.5
    return out


def g_notif_blip(i=0):
    base = [784, 880, 988, 1175][i % 4]
    n = int(0.5 * SR)
    t = t_axis(n)
    a = np.sin(2 * np.pi * base * t) * env_ar(n, 0.002, 0.05)
    b = np.sin(2 * np.pi * base * 1.5 * t) * np.where(t > 0.07, env_ar(n, 0.002, 0.07), 0)
    b = np.roll(b, int(0.07 * SR))
    x = 0.6 * a + 0.5 * b
    return reverb(np.array([x, x]) * 0.8, 0.8, 0.2, damp=8000)


def g_pop(f0=620, f1=260):
    n = int(0.35 * SR)
    s, _ = sweep_sine(f0, f1, int(0.07 * SR))
    s = np.pad(s * np.hanning(len(s) * 2)[len(s):], (0, n - len(s)))
    click = filt(noise(n), "bp", (2500, 7000)) * env_ar(n, 0.0005, 0.003)
    x = 0.9 * s + 0.3 * click
    return reverb(np.array([x, x]), 0.6, 0.15)


def g_thud():
    n = int(0.6 * SR)
    s, _ = sweep_sine(130, 62, int(0.2 * SR))
    s = np.pad(s * np.exp(-t_axis(len(s)) / 0.07), (0, n - len(s)))
    b = filt(noise(n), "lowpass", 600) * env_ar(n, 0.001, 0.03)
    x = drive(s + 0.4 * b, 2.0)
    return np.array([x, x])


def g_riser(dur, pitch_st=7):
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    fc = 400 * (8000 / 400) ** (u ** 1.6)
    x = tv_filter(noise(n, "pink"), fc, "lowpass")
    f = 110 * 2 ** (pitch_st * u ** 2 / 12)
    saw = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) + signal.sawtooth(2 * np.pi * np.cumsum(f * 1.006) / SR)
    saw = tv_filter(saw, fc * 0.6, "lowpass")
    e = u ** 3
    x = (x / (np.max(np.abs(x)) + 1e-9) + 0.35 * saw / 2) * e
    x[-int(0.004 * SR):] *= np.linspace(1, 0, int(0.004 * SR))  # cut dead, no tail
    return np.array([x, x])


def g_reverse_swell(dur):
    n = int(dur * SR)
    m = int(1.6 * SR)
    burst = filt(noise(m), "bp", (300, 9000)) * env_ar(m, 0.002, 0.08)
    tone = sum(np.sin(2 * np.pi * note_hz(nm) * t_axis(m)) for nm in ["Eb4", "Bb4", "G5"]) * env_ar(m, 0.002, 0.5) * 0.15
    wet = reverb(np.array([burst + tone, burst + tone]), 1.6, 0.9)
    rev = wet[:, ::-1]
    rev = rev[:, -n:] if rev.shape[1] >= n else np.pad(rev, ((0, 0), (n - rev.shape[1], 0)))
    rev *= np.linspace(0.3, 1, n) ** 2
    rev[:, -int(0.003 * SR):] *= np.linspace(1, 0, int(0.003 * SR))
    return rev


def g_flash_zing():
    n = int(0.9 * SR)
    t = t_axis(n)
    f = 2400 * (3400 / 2400) ** np.clip(t / 0.06, 0, 1)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ar(n, 0.002, 0.12)
    air = filt(noise(n), "bp", (4000, 16000)) * env_ar(n, 0.004, 0.08)
    x = 0.5 * tone + 0.8 * air
    return reverb(np.array([x, x]), 1.8, 0.35, damp=10000)


def g_shimmer():
    n = int(0.9 * SR)
    t = t_axis(n)
    air = filt(noise(n), "bp", (6000, 14000)) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t)) * env_ar(n, 0.04, 0.16)
    parts = sum(np.sin(2 * np.pi * note_hz(nm) * t) for nm in ["Bb6", "Eb7", "G7"]) * env_ar(n, 0.01, 0.25) * 0.12
    x = air + parts
    return reverb(np.array([x, x]), 2.2, 0.45, damp=12000)


def g_glint():
    n = int(0.8 * SR)
    t = t_axis(n)
    x = sum(a * np.sin(2 * np.pi * 2793.8 * m * t) * np.exp(-t / (0.25 / m)) for m, a in [(1, 1), (2.0, 0.3), (3.01, 0.15)])
    x *= env_ar(n, 0.002, 10)
    return reverb(np.array([x, x]) * 0.6, 1.8, 0.4, damp=12000)


def g_tick():
    n = int(0.12 * SR)
    x = filt(noise(n), "bp", (2000, 6000)) * env_ar(n, 0.0005, 0.008)
    return np.array([x, x])


def g_ui_click():
    n = int(0.3 * SR)
    t = t_axis(n)
    a = filt(noise(n), "bp", (2000, 6000)) * env_ar(n, 0.0005, 0.01)
    b = np.sin(2 * np.pi * 1800 * t) * env_ar(n, 0.001, 0.02)
    return reverb(np.array([a + 0.5 * b] * 2), 0.4, 0.15)


def g_type_tick(i=0):
    n = int(0.08 * SR)
    f0 = 3000 + 300 * ((i * 7) % 5)
    x = filt(noise(n), "bp", (f0 * 0.6, f0 * 1.6)) * env_ar(n, 0.0003, 0.005)
    x += 0.3 * np.sin(2 * np.pi * (900 + 60 * (i % 3)) * t_axis(n)) * env_ar(n, 0.0005, 0.006)
    return np.array([x, x])


def g_sonar_ping():
    n = int(1.6 * SR)
    t = t_axis(n)
    f = 1250 * (1 - 0.02 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ar(n, 0.003, 0.25)
    return reverb(np.array([x, x]) * 0.7, 2.4, 0.45)


def g_silence_drop(dur=0.5):
    n = int(dur * SR)
    x = np.sin(2 * np.pi * 2794 * t_axis(n)) * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.5
    return np.array([x, x])


def g_logo_hit():
    n = int(4.0 * SR)
    t = t_axis(n)
    sub, _ = sweep_sine(56, 38, int(0.4 * SR))
    sub = np.concatenate([sub, np.sin(2 * np.pi * 38 * t_axis(n - len(sub)) + 0.0)]) * np.exp(-t / 0.42)
    body, _ = sweep_sine(112, 78, n)
    body *= env_ar(n, 0.002, 0.16)
    bn = filt(noise(n), "lowpass", 420) * env_ar(n, 0.001, 0.15)
    click = filt(noise(n), "bp", (2000, 5000)) * env_ar(n, 0.0005, 0.004)
    dry = drive(1.0 * sub + 0.7 * body + 0.6 * bn + 0.35 * click, 2.6)
    harm = filt(drive(0.9 * sub + 0.7 * body, 4.0), "bp", (150, 420)) * 0.5  # phone-speaker translation
    x = dry + harm
    wet = reverb(np.array([body + bn + click] * 2) * 0.5, 3.0, 0.3)
    out = np.zeros((2, max(n, wet.shape[1])))
    out[:, :n] += np.array([x, x])
    out[:, : wet.shape[1]] += wet * 0.5
    return out


# ---------------------------------------------------------------- music
def music_track(vo_env):
    mu = TL["music"]
    out = np.zeros((2, N))
    xf = 0.35
    for k, sec in enumerate(mu["sections"]):
        t0, t1 = sec["t0"], sec["t1"]
        a0 = max(0, int((t0 - (xf if k else 0)) * SR))
        a1 = min(N, int((t1 + xf) * SR))
        n = a1 - a0
        t = t_axis(n) + a0 / SR
        u = (t - t0) / max(t1 - t0, 1e-3)
        lfo = np.sin(2 * np.pi * 0.9 * t)
        base_fc = {"closed": 1700, "opening": None, "open": 4200}[sec["filter"]]
        fc = (1500 * (6000 / 1500) ** np.clip(u, 0, 1)) if base_fc is None else np.full(n, base_fc)
        fc = fc * (1 + 0.15 * lfo)
        chans = []
        for c in range(2):
            r = np.random.default_rng(100 + 10 * k + c)
            acc = np.zeros(n)
            for nm in sec["notes"]:
                f = note_hz(nm)
                for v in range(5):
                    det = 2 ** (r.uniform(-9, 9) / 1200)
                    ph = r.uniform(0, 2 * np.pi)
                    acc += signal.sawtooth(2 * np.pi * f * det * t + ph) * 0.2
                acc += 0.25 * np.sin(2 * np.pi * f / 2 * t)
            acc = tv_filter(acc, fc, "lowpass", block=512)
            chans.append(acc)
        x = np.array(chans)
        x = x / (np.sqrt(np.mean(x ** 2)) + 1e-12)  # unit RMS, then place relative to VO (-20 dBFS)
        att = np.clip((t - (t0 - (xf if k else 0))) / (0.8 if k == 0 else xf), 0, 1)
        rel = np.clip(((t1 + xf) - t) / xf, 0, 1)
        g = att * rel * (1 + 0.18 * lfo) * db(-20 + sec["level_db_vs_vo"])
        out[:, a0:a1] += x * g
    # bass
    for b in mu["bass"]:
        a0, a1 = int(b["t0"] * SR), int(b["t1"] * SR)
        n = a1 - a0
        t = t_axis(n)
        f = note_hz(b["note"])
        x = drive(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t), 1.6)
        e = np.clip(t / 0.15, 0, 1) * np.clip((t[-1] - t) / 0.3, 0, 1)
        out[:, a0:a1] += db(-32) / np.sqrt(np.mean(x ** 2)) * x * e  # bass ~12 dB under the VO
    out = reverb(out, 4.5, 0.35, damp=5000)[:, :N]
    # breathing already in; ducking under VO
    duck = db(mu["duck_under_vo_db"] * vo_env)
    out *= duck
    # silence drop (hard cut), bloom swell and final fade
    tt = t_axis(N)
    sd = mu["silence_drop"]
    gate = np.ones(N)
    gate[(tt >= sd["t0"]) & (tt < sd["t1"])] = 0.0
    gate = signal.lfilter([1 - 0.995], [1, -0.995], gate)  # ~4 ms smoothing at edges
    bl = mu["bloom"]
    bloom = 1 + 0.4 * np.clip((tt - bl["t0"]) / (bl["t1"] - bl["t0"]), 0, 1)
    fd = mu["fade"]
    fade = np.clip((fd["t1"] - tt) / (fd["t1"] - fd["t0"]), 0, 1)
    return out * gate * bloom * fade


# ---------------------------------------------------------------- VO
def highshelf(x, f0, gain_db):
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / 2 * np.sqrt(2)
    cw = np.cos(w0)
    b = [A * ((A + 1) + (A - 1) * cw + 2 * np.sqrt(A) * alpha), -2 * A * ((A - 1) + (A + 1) * cw),
         A * ((A + 1) + (A - 1) * cw - 2 * np.sqrt(A) * alpha)]
    a = [(A + 1) - (A - 1) * cw + 2 * np.sqrt(A) * alpha, 2 * ((A - 1) - (A + 1) * cw),
         (A + 1) - (A - 1) * cw - 2 * np.sqrt(A) * alpha]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x)


def comp_gain(x, thr_db=-22, ratio=3.0, att=0.005, rel=0.12):
    e = np.abs(x)
    ca, cr = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    # one-pole peak follower (vectorised approximation: attack/release via two filters)
    fast = signal.lfilter([1 - ca], [1, -ca], e)
    slow = signal.lfilter([1 - cr], [1, -cr], e)
    env = np.maximum(fast, slow)
    lvl = 20 * np.log10(env + 1e-9)
    gr = np.minimum(0, (thr_db - lvl) * (1 - 1 / ratio))
    return db(gr)


def compress(x, thr_db=-22, ratio=3.0, att=0.005, rel=0.12):
    return x * comp_gain(x, thr_db, ratio, att, rel)


def vo_track():
    vo = np.zeros(N)
    for line in TL["vo"]:
        x, sr = sf.read(os.path.join(ROOT, line["file"]), dtype="float64")
        assert sr == SR
        if x.ndim > 1:
            x = x.mean(axis=1)
        a = int(round(line["start"] * SR))
        vo[a: a + len(x)] += x[: N - a]
    vo = filt(vo, "highpass", 85)
    vo = highshelf(vo, 4000, 2.5)
    vo = compress(vo, -24, 2.5)
    # normalise speech level to -20 dBFS RMS over voiced samples
    frame = int(0.05 * SR)
    rms = np.sqrt(np.convolve(vo ** 2, np.ones(frame) / frame, "same"))
    voiced = rms > np.max(rms) * 0.1
    vo *= db(-20) / np.sqrt(np.mean(vo[voiced] ** 2))
    # ducking envelope 0..1 (10 ms attack, 250 ms release)
    act = (rms > np.max(rms) * 0.06).astype(float)
    up = signal.lfilter([1 - np.exp(-1 / (0.01 * SR))], [1, -np.exp(-1 / (0.01 * SR))], act)
    envd = np.maximum.accumulate(np.zeros(1)) if False else up
    rel = np.exp(-1 / (0.25 * SR))
    envd = signal.lfilter([1 - rel], [1, -rel], act)
    envd = np.clip(np.maximum(envd * 1.6, up), 0, 1)
    return vo, envd, voiced


# ---------------------------------------------------------------- SFX placement
RISER_DUR = {}


def sfx_track(vo_voiced):
    cues = TL["sfx"]
    hits = sorted(c["t"] for c in cues if c["type"] in ("light_hit", "flash_zing", "silence_drop", "logo_hit", "impact_small"))
    out = np.zeros((2, N + 6 * SR))
    ref_rms = db(-20)
    counters = {}
    for c in cues:
        ty, t0 = c["type"], c["t"]
        i = counters.get(ty, 0)
        counters[ty] = i + 1
        if ty in ("riser", "riser_short"):
            nxt = min([h for h in hits if h > t0 + 0.2] or [t0 + 1.0])
            x = g_riser(nxt - t0, 7 if ty == "riser" else 5)
        elif ty == "reverse_swell":
            nxt = min([h for h in hits if h > t0 + 0.1] + [c2["t"] for c2 in cues if c2["type"] == "pop" and c2["t"] > t0 + 0.1])
            x = g_reverse_swell(nxt - t0)
        elif ty == "whoosh":
            x = g_whoosh(0.32, c["pan"])
        elif ty == "whoosh_big":
            x = g_whoosh(0.7, c["pan"], 0.8, 0.35)
        elif ty == "whoosh_small":
            x = g_whoosh(0.2, c["pan"], 1.3, 0.1)
        elif ty == "whoosh_line":
            x = g_whoosh(0.45, c["pan"], 1.5, 0.3)
        elif ty == "notif_blip":
            x = g_notif_blip(i)
        elif ty == "pop":
            x = g_pop(620 + 80 * i, 260 + 30 * i)
        elif ty == "type_tick":
            x = g_type_tick(i)
        elif ty == "silence_drop":
            x = g_silence_drop(0.5)
        else:
            x = {"light_hit": g_light_hit, "impact_small": g_impact_small, "flash_zing": g_flash_zing, "shimmer": g_shimmer,
                 "glint": g_glint, "tick": g_tick, "ui_click": g_ui_click, "thud": g_thud, "sonar_ping": g_sonar_ping,
                 "logo_hit": g_logo_hit}[ty]()
        x = trim_tail(x)
        a = int(round(t0 * SR))
        span = slice(a, min(N, a + x.shape[1]))
        # under speech: thin the low end so SFX never mask the voice
        if np.any(vo_voiced[span]) and ty not in ("logo_hit",):
            x = filt(x, "highpass", 150)
        # level: loudest 50 ms window RMS -> VO speech RMS + level
        w = int(0.05 * SR)
        m = x.mean(axis=0)
        r = np.sqrt(np.convolve(m ** 2, np.ones(w) / w, "valid").max() + 1e-12)
        x = x * (ref_rms * db(c["level_db_vs_vo"]) / r)
        if ty not in ("whoosh", "whoosh_big", "whoosh_small", "whoosh_line") and c["pan"]:
            x = np.array([x[0] * np.cos((c["pan"] + 1) * np.pi / 4) * 1.41, x[1] * np.sin((c["pan"] + 1) * np.pi / 4) * 1.41])
        out[:, a: a + x.shape[1]] += x
    out = out[:, :N]
    fd = TL["music"]["fade"]
    tt = t_axis(N)
    return out * np.clip((TL["duration"] - 0.05 - tt) / 0.4, 0, 1)


# ---------------------------------------------------------------- master
def true_peak(x):
    up = signal.resample_poly(x, 4, 1, axis=-1)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def limiter(x, ceiling_db=-1.2, look=0.003, rel=0.08):
    c = db(ceiling_db)
    peak = np.max(np.abs(x), axis=0)
    need = np.minimum(1.0, c / (peak + 1e-12))
    la = int(look * SR)
    need = np.minimum.reduce([np.roll(need, -k) for k in range(0, la, 8)])
    a = np.exp(-1 / (rel * SR))
    g = np.empty_like(need)
    cur = 1.0
    # release smoothing (vectorised via reversed min-filter approach is complex; loop in chunks)
    for i in range(len(need)):
        cur = need[i] if need[i] < cur else cur * a + (1 - a) * need[i]
        g[i] = cur
    return x * g


def main():
    os.makedirs(os.path.join(ROOT, "sfx", "stems"), exist_ok=True)
    vo, vo_env, voiced = vo_track()
    mus = music_track(vo_env)
    fx = sfx_track(voiced)
    vo_st = np.array([vo, vo])
    for name, st in (("vo", vo_st), ("music", mus), ("sfx", fx)):
        sf.write(os.path.join(ROOT, "sfx", "stems", name + ".wav"), st.T, SR, subtype="PCM_24")
    mix = vo_st + mus + fx
    # glue: gentle bus compression
    mix = mix * comp_gain(mix.mean(axis=0), -14, 1.6, 0.01, 0.2)
    meter = pyln.Meter(SR)
    for _ in range(3):
        L = meter.integrated_loudness(mix.T)
        mix = mix * db(-14.0 - L)
        mix = limiter(mix, -1.3)
    L = meter.integrated_loudness(mix.T)
    tp = true_peak(mix)
    sf.write(os.path.join(ROOT, "sfx", "mix.wav"), mix.T, SR, subtype="PCM_24")
    print(f"mix.wav  integrated {L:.2f} LUFS  true-peak {tp:.2f} dBTP  dur {mix.shape[1] / SR:.2f}s")


if __name__ == "__main__":
    main()
