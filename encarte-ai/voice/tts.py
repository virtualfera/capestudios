#!/usr/bin/env python3
"""Encarte Aí voice-over CLI: Brazilian-Portuguese text-to-speech, open source, commercial-safe.

ENGINE (recommended by voice/BAKEOFF.md): Chatterbox Multilingual (Resemble AI, MIT license),
language "pt", conditioned on a pt-BR reference voice from voice/refs/ (voices made by
open models, not clones of real people). Fallback engine: Kokoro-82M (Apache-2.0), with the
pt-BR voices pf_dora / pm_alex / pm_santa.

VENV PYTHON (Chatterbox, torch 2.6 CPU):
    /tmp/claude-0/-home-user-capestudios/daf4fc2d-c9ac-5c63-9258-a70695f848b9/scratchpad/venvs/tts-cb/bin/python
VENV PYTHON (Kokoro fallback):
    /tmp/claude-0/-home-user-capestudios/daf4fc2d-c9ac-5c63-9258-a70695f848b9/scratchpad/venvs/tts-kokoro/bin/python
Running this file with any other python re-executes it with the right venv automatically.
Model cache: <scratchpad>/cache/hf (HF_HOME). Chatterbox weights about 3 GB, downloaded once.

Recreate the Chatterbox venv if it is gone:
    uv venv -p 3.11 tts-cb
    uv pip install -p tts-cb/bin/python chatterbox-tts "setuptools<81" \
        --extra-index-url https://download.pytorch.org/whl/cpu --index-strategy unsafe-best-match
  (setuptools<81 is needed: the Perth watermarker imports pkg_resources.)

USAGE
  python tts.py --text "Baixa o Encarte Aí. O link tá na bio!" --out cta.wav
  python tts.py --text-file roteiro.txt --out vo.wav --voice br-masc --exaggeration 0.6
  python tts.py --lines lines.json --outdir takes/ --seed 7
      lines.json = [{"id": "01_gancho", "text": "..."},
                    {"id": "02_cta", "text": "...", "exaggeration": 0.7, "cfg": 0.3}]
      -> takes/01_gancho.wav, takes/02_cta.wav, plus takes/manifest.json (durations, settings)
  python tts.py --list-voices

OPTIONS THAT MATTER
  --voice         preset in voice/refs/ (br-masc, br-fem, br-masc-2, ...), a path to a
                  reference .wav, or "builtin" (Chatterbox's own default voice: its accent is
                  not Brazilian, so avoid it for the ad). Only use reference audio you are
                  licensed to use. Never clone a real person without their consent.
  --exaggeration  0.25-1.0 (default 0.5). Higher = more emphatic and "salesy", faster.
  --cfg           0.0-1.0 (default 0.5). Lower = slower and more relaxed pacing; 0.3 pairs
                  well with exaggeration 0.7 for punchy lines.
  --temperature   sampling temperature (default 0.8).
  --seed          the same seed + text + settings + thread count gives the same audio (default 0).
  --speed         tempo multiplier applied after synthesis with ffmpeg atempo (pitch
                  preserved), e.g. 1.08. Kokoro uses its native speed parameter instead.
  --takes N       render N takes per line (seed, seed+1000, ...) as <id>_t1.wav, <id>_t2.wav ...
                  Pick the best by ear, or rank them with score.py.
  --best-of N     quality gate: render N candidates per take, transcribe each with Whisper
                  (score.py, eval venv) and keep the lowest error rate. Recommended (3) for
                  short punchy lines, because Chatterbox sometimes garbles a take.
  --sr            output sample rate (default 48000). Output is mono, 24-bit PCM WAV,
                  peak-normalised to -1 dBFS, edge silences trimmed to --pad-ms.

Lines over 200 characters are split into groups of whole sentences (Chatterbox is most stable
under about 25 s per generation) and joined with --pause-ms of silence. Shorter lines are
rendered in one pass, because Chatterbox garbles very short isolated sentences. Each chunk is
trimmed with an RMS gate at -35 dB, which removes Chatterbox's quiet "mumble" after the last word.
Chatterbox output carries Resemble's inaudible Perth watermark (responsible-AI marker). It is
kept on purpose.

Kokoro venv: uv venv -p 3.11 tts-kokoro && uv pip install -p tts-kokoro/bin/python torch \
  --index-url https://download.pytorch.org/whl/cpu && uv pip install -p tts-kokoro/bin/python kokoro soundfile
  (espeak-ng fails silently when its data path is longer than ~160 chars. This script copies the
  data to a short path automatically.)
"""
from __future__ import annotations

import argparse
import json
import os
import random
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SCRATCH = "/tmp/claude-0/-home-user-capestudios/daf4fc2d-c9ac-5c63-9258-a70695f848b9/scratchpad"
VENVS = {
    "chatterbox": f"{SCRATCH}/venvs/tts-cb/bin/python",
    "kokoro": f"{SCRATCH}/venvs/tts-kokoro/bin/python",
}
SCORE_PY = f"{SCRATCH}/venvs/tts-eval/bin/python"  # venv with faster-whisper, used by --best-of
ENGINE_MODULE = {"chatterbox": "chatterbox", "kokoro": "kokoro"}
HERE = Path(__file__).resolve().parent
REFS = HERE / "refs"
KOKORO_VOICES = {"pf_dora", "pm_alex", "pm_santa"}
DEFAULT_VOICE = {"chatterbox": "br-masc", "kokoro": "pm_alex"}

for _k, _v in {"HF_HOME": "cache/hf", "TORCH_HOME": "cache/torch", "XDG_CACHE_HOME": "cache/xdg"}.items():
    if os.path.isdir(SCRATCH):
        os.environ.setdefault(_k, f"{SCRATCH}/{_v}")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")


# --------------------------------------------------------------------------- helpers
def ensure_engine_python(engine: str) -> None:
    """Re-exec under the venv that has the engine installed (unless already inside it)."""
    import importlib.util

    if importlib.util.find_spec(ENGINE_MODULE[engine]) is not None:
        return
    py = VENVS[engine]
    if os.environ.get("_ENCARTE_TTS_REEXEC") or not os.path.exists(py):
        sys.exit(f"[tts] engine '{engine}' is not importable here and venv {py} is missing. See the docstring.")
    os.environ["_ENCARTE_TTS_REEXEC"] = "1"
    os.execv(py, [py, os.path.abspath(__file__), *sys.argv[1:]])


def seed_everything(seed: int) -> None:
    import numpy as np
    import torch

    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def split_sentences(text: str, max_chars: int = 200) -> list[str]:
    """Split long text into chunks of whole sentences (<= max_chars when possible).

    Short sentences are kept together: Chatterbox garbles very short inputs (for example a
    lone "Baixa o Encarte Aí."), so a line is only split when it is longer than max_chars.
    """
    text = " ".join(text.split())
    if len(text) <= max_chars:
        return [text] if text else []
    sents = [p.strip() for p in re.split(r"(?<=[.!?…])\s+", text) if p.strip()]
    pieces: list[str] = []
    for p in sents:  # break overlong sentences at commas
        while len(p) > max_chars:
            cut = p.rfind(",", 0, max_chars)
            cut = cut if cut > 40 else max_chars
            pieces.append(p[: cut + 1].strip())
            p = p[cut + 1:].strip()
        if p:
            pieces.append(p)
    chunks: list[str] = []
    for p in pieces:  # greedily merge into chunks
        if chunks and len(chunks[-1]) + 1 + len(p) <= max_chars:
            chunks[-1] = f"{chunks[-1]} {p}"
        else:
            chunks.append(p)
    return chunks


def trim_edges(y, sr: int, thr_db: float = -35.0, pad_start_ms: int = 10, pad_end_ms: int = 80):
    """Cut leading/trailing silence and Chatterbox's low-level tail noise (frame RMS gate re loudest frame)."""
    import numpy as np

    y = np.asarray(y, dtype=np.float32).reshape(-1)
    hop = max(1, int(0.02 * sr))
    if y.size < hop * 2:
        return y
    n = y.size // hop
    rms = np.sqrt(np.mean(y[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
    act = np.where(20 * np.log10(rms / rms.max()) > thr_db)[0]
    if not act.size:
        return y
    a = max(0, act[0] * hop - int(sr * pad_start_ms / 1000))
    b = min(y.size, (act[-1] + 1) * hop + int(sr * pad_end_ms / 1000))
    return y[a:b]


def list_presets() -> dict[str, dict]:
    presets = {}
    meta = REFS / "refs.json"
    info = json.loads(meta.read_text()) if meta.exists() else {}
    for wav in sorted(REFS.glob("*.wav")):
        presets[wav.stem] = {"path": str(wav), **info.get(wav.stem, {})}
    return presets


def resolve_voice(engine: str, voice: str | None) -> str:
    voice = voice or DEFAULT_VOICE[engine]
    if engine == "kokoro":
        if voice not in KOKORO_VOICES:
            sys.exit(f"[tts] kokoro voice must be one of {sorted(KOKORO_VOICES)}")
        return voice
    if voice == "builtin":
        return voice
    presets = list_presets()
    if voice in presets:
        return presets[voice]["path"]
    if os.path.exists(voice):
        return os.path.abspath(voice)
    sys.exit(f"[tts] unknown voice '{voice}'. Presets: {', '.join(presets) or '(none)'}; or pass a .wav path.")


def finish_audio(wav, sr: int, out: Path, target_sr: int, speed: float, pad_ms: int, peak_dbfs: float = -1.0) -> float:
    """Trim edges, optional tempo change, resample, peak-normalise, write 24-bit mono WAV. Returns seconds."""
    import numpy as np
    import soundfile as sf

    y = np.asarray(wav, dtype=np.float32).reshape(-1)
    y = trim_edges(y, sr, pad_start_ms=pad_ms, pad_end_ms=max(pad_ms, 80))
    with tempfile.TemporaryDirectory() as td:
        src, dst = Path(td) / "in.wav", Path(td) / "out.wav"
        sf.write(src, y, sr, subtype="FLOAT")
        filt = []
        if abs(speed - 1.0) > 1e-3:
            s = speed
            while s > 2.0:
                filt.append("atempo=2.0"); s /= 2.0
            while s < 0.5:
                filt.append("atempo=0.5"); s /= 0.5
            filt.append(f"atempo={s:.4f}")
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src)]
        if filt:
            cmd += ["-af", ",".join(filt)]
        cmd += ["-ar", str(target_sr), "-ac", "1", "-c:a", "pcm_f32le", str(dst)]
        subprocess.run(cmd, check=True)
        y, sr2 = sf.read(dst, dtype="float32")
    peak = float(np.max(np.abs(y))) if y.size else 0.0
    if peak > 0:
        y = y * (10 ** (peak_dbfs / 20) / peak)
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, y, sr2, subtype="PCM_24")
    return len(y) / sr2


# --------------------------------------------------------------------------- engines
class ChatterboxEngine:
    def __init__(self, threads: int):
        import torch
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS

        torch.set_num_threads(threads)
        self.model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
        self.sr = self.model.sr
        self._builtin = self.model.conds
        self._ref = None

    def set_voice(self, ref: str, exaggeration: float):
        if ref == "builtin":
            self.model.conds = self._builtin
            self._ref = ref
        elif ref != self._ref:
            self.model.prepare_conditionals(ref, exaggeration=exaggeration)
            self._ref = ref

    def synth(self, text: str, voice: str, exaggeration: float, cfg: float, temperature: float, seed: int, **_):
        import numpy as np

        self.set_voice(voice, exaggeration)
        seed_everything(seed)
        w = self.model.generate(text, language_id="pt", exaggeration=exaggeration, cfg_weight=cfg,
                                temperature=temperature)
        return w.squeeze(0).numpy().astype(np.float32)


class KokoroEngine:
    def __init__(self, threads: int):
        import torch

        torch.set_num_threads(threads)
        from kokoro import KPipeline
        from phonemizer.backend.espeak.wrapper import EspeakWrapper
        import espeakng_loader

        # espeak-ng silently fails when its data path is longer than ~160 chars: use a short copy.
        data = espeakng_loader.get_data_path()
        if len(data) > 150:
            short = Path(SCRATCH) / "voice-work" / "esd" if os.path.isdir(SCRATCH) else Path(tempfile.gettempdir()) / "esd"
            if not (short / "phontab").exists():
                shutil.copytree(data, short, dirs_exist_ok=True)
            data = str(short)
        EspeakWrapper.set_data_path(data)
        self.pipe = KPipeline(lang_code="p", repo_id="hexgrad/Kokoro-82M")
        self.sr = 24000

    def synth(self, text: str, voice: str, seed: int, kokoro_speed: float = 1.0, **_):
        import numpy as np

        seed_everything(seed)
        parts = [a.numpy() for _, _, a in self.pipe(text, voice=voice, speed=kokoro_speed, split_pattern=None)]
        return np.concatenate(parts).astype(np.float32)


# --------------------------------------------------------------------------- main
def render_line(eng, engine: str, text: str, settings: dict, pause_ms: int):
    import numpy as np

    chunks = []
    sentences = split_sentences(text) if settings.get("split", True) else [text]
    for i, sent in enumerate(sentences):
        w = eng.synth(sent, settings["voice"], exaggeration=settings["exaggeration"], cfg=settings["cfg"],
                      temperature=settings["temperature"], seed=settings["seed"] + i,
                      kokoro_speed=settings["speed"] if engine == "kokoro" else 1.0)
        w = trim_edges(w, eng.sr)  # joins are controlled by pause_ms only
        chunks.append(w)
        if i < len(sentences) - 1:
            chunks.append(np.zeros(int(eng.sr * pause_ms / 1000), dtype=np.float32))
    return np.concatenate(chunks) if chunks else np.zeros(1, dtype=np.float32)


def main():
    ap = argparse.ArgumentParser(description="Encarte Aí pt-BR TTS (see module docstring)",
                                 formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    src = ap.add_mutually_exclusive_group()
    src.add_argument("--text")
    src.add_argument("--text-file")
    src.add_argument("--lines", help='JSON list [{"id":..,"text":..,(optional per-line settings)}]')
    ap.add_argument("--out", help="output wav (with --text/--text-file)")
    ap.add_argument("--outdir", help="output folder (with --lines)")
    ap.add_argument("--engine", choices=["chatterbox", "kokoro"], default="chatterbox")
    ap.add_argument("--voice", default=None, help="preset (see --list-voices), .wav path, 'builtin', or a kokoro voice id")
    ap.add_argument("--exaggeration", type=float, default=0.5)
    ap.add_argument("--cfg", type=float, default=0.5)
    ap.add_argument("--temperature", type=float, default=0.8)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--takes", type=int, default=1, help="render N takes per line with consecutive seeds")
    ap.add_argument("--best-of", type=int, default=1,
                    help="render N candidates per take, ASR-check them with score.py and keep the best "
                         "(others stay in <outdir>/_candidates/). 3 is a good value for short lines")
    ap.add_argument("--pause-ms", type=int, default=280, help="silence between sentences")
    ap.add_argument("--pad-ms", type=int, default=60, help="silence kept at the start/end of each file")
    ap.add_argument("--sr", type=int, default=48000)
    ap.add_argument("--no-split", action="store_true", help="synthesize each line in one pass")
    ap.add_argument("--threads", type=int, default=int(os.environ.get("TTS_THREADS", os.cpu_count() or 4)))
    ap.add_argument("--list-voices", action="store_true")
    args = ap.parse_args()

    if args.list_voices:
        for name, p in list_presets().items():
            print(f"{name:12s} {p.get('description', '')}  [{p.get('source', '')}]")
        print("builtin      Chatterbox default voice (not Brazilian-accented; avoid for the ad)")
        print("kokoro:      " + ", ".join(sorted(KOKORO_VOICES)) + "  (use with --engine kokoro)")
        return
    if not (args.text or args.text_file or args.lines):
        ap.error("one of --text, --text-file or --lines is required")
    if args.lines and not args.outdir:
        ap.error("--lines needs --outdir")
    if not args.lines and not args.out:
        ap.error("--out is required with --text/--text-file")

    ensure_engine_python(args.engine)
    import time

    base = dict(voice=resolve_voice(args.engine, args.voice), exaggeration=args.exaggeration, cfg=args.cfg,
                temperature=args.temperature, seed=args.seed, speed=args.speed, split=not args.no_split)
    if args.lines:
        items = json.loads(Path(args.lines).read_text())
        outdir = Path(args.outdir)
    else:
        text = args.text if args.text is not None else Path(args.text_file).read_text()
        items = [{"id": Path(args.out).stem, "text": text}]
        outdir = Path(args.out).parent

    t0 = time.time()
    eng = ChatterboxEngine(args.threads) if args.engine == "chatterbox" else KokoroEngine(args.threads)
    print(f"[tts] {args.engine} loaded in {time.time() - t0:.1f}s", file=sys.stderr)

    jobs = []
    for it in items:
        st = dict(base)
        for k in ("exaggeration", "cfg", "temperature", "seed", "speed"):
            if k in it:
                st[k] = type(base[k])(it[k])
        if "voice" in it:
            st["voice"] = resolve_voice(args.engine, it["voice"])
        for t in range(args.takes):
            take = dict(st, seed=st["seed"] + t * 1000)
            name = it["id"] if args.takes == 1 else f"{it['id']}_t{t + 1}"
            out = Path(args.out) if (not args.lines and args.takes == 1) else outdir / f"{name}.wav"
            cands = []
            for j in range(max(1, args.best_of)):
                cs = dict(take, seed=take["seed"] + j * 100)
                cpath = out if args.best_of <= 1 else outdir / "_candidates" / f"{name}_c{j + 1}.wav"
                t1 = time.time()
                wav = render_line(eng, args.engine, it["text"], cs, args.pause_ms)
                dur = finish_audio(wav, eng.sr, cpath, args.sr, cs["speed"] if args.engine == "chatterbox" else 1.0, args.pad_ms)
                cands.append({"file": str(cpath), "seed": cs["seed"], "duration_s": round(dur, 3),
                              "render_s": round(time.time() - t1, 1)})
                print(f"[tts] {name} cand {j + 1}/{args.best_of}: {dur:.2f}s audio in {cands[-1]['render_s']}s", file=sys.stderr, flush=True)
            jobs.append((it, take, name, out, cands))

    if args.best_of > 1:
        pick_best_takes(jobs)

    manifest = []
    for it, take, name, out, cands in jobs:
        win = next((c for c in cands if c.get("chosen")), cands[0])
        rec = {"id": it["id"], "take": name, "file": str(out), "text": it["text"], "duration_s": win["duration_s"],
               "engine": args.engine, "voice": take["voice"], "exaggeration": take["exaggeration"],
               "cfg": take["cfg"], "temperature": take["temperature"], "seed": win["seed"],
               "speed": take["speed"], "render_s": win["render_s"]}
        if args.best_of > 1:
            rec["candidates"] = cands
        manifest.append(rec)
        print(json.dumps(rec, ensure_ascii=False), flush=True)
    if args.lines:
        (outdir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1))


def pick_best_takes(jobs) -> None:
    """Score every candidate with score.py (Whisper ASR, pauses, truncation) and copy the best to its output."""
    batch = [{"wav": c["file"], "text": it["text"]} for it, _, _, _, cands in jobs for c in cands]
    results = {}
    if os.path.exists(SCORE_PY) and (HERE / "score.py").exists():
        with tempfile.TemporaryDirectory() as td:
            bf, of = Path(td) / "batch.json", Path(td) / "scores.json"
            bf.write_text(json.dumps(batch, ensure_ascii=False))
            r = subprocess.run([SCORE_PY, str(HERE / "score.py"), "--batch", str(bf), "--out", str(of), "--no-mos"],
                               stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
            if r.returncode == 0 and of.exists():
                results = {x["wav"]: x for x in json.loads(of.read_text())}
            else:
                print(f"[tts] scoring failed, keeping candidate 1: {r.stderr[-400:]}", file=sys.stderr)
    else:
        print(f"[tts] {SCORE_PY} not found: cannot rank, keeping candidate 1", file=sys.stderr)
    for it, take, name, out, cands in jobs:
        for c in cands:
            x = results.get(c["file"], {})
            if "asr" in x:
                c["cer"], c["wer"], c["transcript"] = x["asr"]["cer"], x["asr"]["wer"], x["asr"]["transcript"]
                c["long_pauses"] = x["pauses"]["long_pauses_over_1s"]
                c["truncated_suspect"] = x["artifacts"]["truncated_suspect"]
                c["q"] = round(c["cer"] + 0.5 * c["wer"] + 0.05 * c["long_pauses"] + 0.1 * c["truncated_suspect"], 4)
        best = min(cands, key=lambda c: c.get("q", 9e9))
        best["chosen"] = True
        Path(out).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(best["file"], out)


if __name__ == "__main__":
    main()
