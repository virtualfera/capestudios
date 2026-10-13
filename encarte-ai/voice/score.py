#!/usr/bin/env python3
"""Objective scorer for Brazilian-Portuguese TTS takes (Encarte Aí project).

Run with the evaluation venv (has faster-whisper, librosa, torch-cpu, transformers):

    PY=/tmp/claude-0/-home-user-capestudios/daf4fc2d-c9ac-5c63-9258-a70695f848b9/scratchpad/venvs/tts-eval/bin/python
    $PY score.py --wav take.wav --text "Baixa o Encarte Aí. O link tá na bio!"
    $PY score.py --wav take.wav --text-file line.txt --no-mos
    $PY score.py --batch takes.json --out scores.json      # [{"wav": "...", "text": "..."}, ...]

If that venv is gone, recreate it with:
    uv venv -p 3.11 venv && uv pip install -p venv/bin/python torch torchaudio \
        --index-url https://download.pytorch.org/whl/cpu && \
    uv pip install -p venv/bin/python faster-whisper librosa soundfile numpy scipy num2words "transformers<5"

Prints JSON to stdout (one object, or a list in --batch mode). What it measures:

  asr        faster-whisper transcript (language forced to "pt"), CER and WER against the
             input text after normalisation (lowercase, accents and punctuation stripped,
             digits and % written out in pt-BR words), and a check that the key brand and
             place terms were heard ("encarte ai", "petropolis", "quilometro", ...).
  lang_id    Whisper language-ID probability for "pt" (does not tell BR from PT apart).
  pitch      pYIN F0 on voiced frames: median Hz, std and 5-95 % range in semitones.
  rate       words/s and approximate syllables/s over the speech span (lead/tail silence
             excluded), plus articulation rate with internal pauses removed.
  pauses     internal pauses >= 150 ms: count, total, longest; lead/tail silence.
  artifacts  clipping ratio, mean spectral flatness (buzz/noise proxy), a truncated-ending
             flag (loud last 40 ms, or the last text word missing from the transcript).
  mos        UTMOS22-strong (SpeechMOS) naturalness proxy, 1-5. English-trained: rough.
  accent     (--accent) a wav2vec2 IPA phone recogniser counts t-sh / d-zh affricates.
             Brazilian Portuguese turns "te/de/ti/di" into [tʃi]/[dʒi] ("encarTCHi",
             "DJIreto", "DJI você"); European Portuguese does not. More affricates per
             expected site means a more Brazilian-sounding take. A heuristic, not a verdict.

None of this replaces listening. Use it to rank takes and to catch broken ones.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

import numpy as np

SCRATCH = "/tmp/claude-0/-home-user-capestudios/daf4fc2d-c9ac-5c63-9258-a70695f848b9/scratchpad"
for _k, _v in {"HF_HOME": "cache/hf", "TORCH_HOME": "cache/torch", "XDG_CACHE_HOME": "cache/xdg"}.items():
    if os.path.isdir(SCRATCH):
        os.environ.setdefault(_k, f"{SCRATCH}/{_v}")
DEFAULT_UTMOS_REPO = f"{SCRATCH}/voice-work/src/SpeechMOS"  # local clone of tarepan/SpeechMOS v1.2.0
KEY_TERMS = ["encarte ai", "petropolis", "quilometro", "desconto", "oferta", "baixa"]

# ----------------------------------------------------------------------------- text


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def numbers_to_words(s: str) -> str:
    try:
        from num2words import num2words
    except ImportError:  # pragma: no cover
        return s
    s = re.sub(r"(\d+)\s*%", r"\1 por cento", s)
    # "1,5 km" -> "1 quilômetro e meio", "3,5 kg" -> "3 quilos e meio"
    units = {"km": ("quilômetro", "quilômetros"), "kg": ("quilo", "quilos"), "m": ("metro", "metros"),
             "g": ("grama", "gramas"), "l": ("litro", "litros")}

    def half(m):
        n, u = m.group(1), m.group(2).lower()
        sg, pl = units[u]
        return f"{n} {sg if n == '1' else pl} e meio"

    s = re.sub(r"(\d+),5\s*(km|kg|m|g|l)\b", half, s, flags=re.I)
    s = re.sub(r"(\d)\s*(km|kg)\b", lambda m: f"{m.group(1)} {units[m.group(2).lower()][1]}", s, flags=re.I)
    s = re.sub(r"\bkg\b", "quilo", s, flags=re.I)
    # prices: "R$ 3,99" -> "3 reais e 99 centavos", "R$ 1" -> "1 real"
    def money(m):
        r, c = m.group(1).replace(".", ""), m.group(2)
        out = f"{r} {'real' if r == '1' else 'reais'}"
        if c and int(c):
            out += f" e {int(c)} centavos"
        return out

    s = re.sub(r"r\$\s*(\d[\d.]*)(?:,(\d{2}))?", money, s, flags=re.I)

    def conv(m):
        tok = m.group(0)
        try:
            if "," in tok:
                a, b = tok.split(",", 1)
                return f"{num2words(int(a.replace('.', '')), lang='pt_BR')} vírgula {num2words(int(b), lang='pt_BR')}"
            return num2words(int(tok.replace(".", "")), lang="pt_BR")
        except Exception:
            return tok

    return re.sub(r"\d[\d.]*(?:,\d+)?", conv, s)


def normalize(s: str) -> str:
    s = numbers_to_words(s.lower())
    s = strip_accents(s)
    s = s.replace("-", " ")
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def edit_distance(a, b) -> int:
    prev = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, y in enumerate(b, 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x != y))
        prev = cur
    return prev[-1]


def syllables_pt(text: str) -> int:
    """Rough pt syllable count: vowel groups, splitting common hiatus (i/u + vowel at word end)."""
    n = 0
    for w in normalize(text).split():
        groups = re.findall(r"[aeiouy]+", w)
        n += max(1, len(groups))
        n += len(re.findall(r"(?:ia|io|ua|uo|ea|eo|oa)$", w))  # dia, desafio, rua ... count 2
    return n


def term_hits(ref_norm: str, hyp_norm: str) -> dict:
    out = {}
    for t in KEY_TERMS:
        if t not in ref_norm:
            continue
        if t in hyp_norm:
            out[t] = 1.0
            continue
        # best fuzzy match over windows of the same word length (1 - normalized char edit distance)
        tw, hw = t.split(), hyp_norm.split()
        best = 0.0
        for n in (len(tw), len(tw) + 1, max(1, len(tw) - 1)):
            for i in range(0, max(1, len(hw) - n + 1)):
                cand = " ".join(hw[i:i + n])
                cand_nospace, t_nospace = cand.replace(" ", ""), t.replace(" ", "")
                d = edit_distance(cand_nospace, t_nospace)
                best = max(best, 1 - d / max(len(t_nospace), 1))
        out[t] = round(best, 3)
    return out


# --------------------------------------------------------------------------- models
_WHISPER = {}
_UTMOS = None
_PHONE = None


def whisper(model_name: str, compute_type: str):
    key = (model_name, compute_type)
    if key not in _WHISPER:
        from faster_whisper import WhisperModel

        _WHISPER[key] = WhisperModel(model_name, device="cpu", compute_type=compute_type,
                                     cpu_threads=int(os.environ.get("SCORE_THREADS", "4")))
    return _WHISPER[key]


def utmos(repo: str | None):
    global _UTMOS
    if _UTMOS is None:
        import torch

        repo = repo or os.environ.get("UTMOS_REPO") or DEFAULT_UTMOS_REPO
        if os.path.isdir(repo):
            _UTMOS = torch.hub.load(repo, "utmos22_strong", source="local", trust_repo=True)
        else:
            _UTMOS = torch.hub.load("tarepan/SpeechMOS:v1.2.0", "utmos22_strong", trust_repo=True,
                                    skip_validation=True)
        _UTMOS.eval()
    return _UTMOS


def phone_model():
    global _PHONE
    if _PHONE is None:
        from huggingface_hub import hf_hub_download
        from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForCTC

        name = "facebook/wav2vec2-xlsr-53-espeak-cv-ft"
        vocab = json.loads(Path(hf_hub_download(name, "vocab.json")).read_text())
        id2tok = {v: k for k, v in vocab.items()}
        _PHONE = (Wav2Vec2FeatureExtractor.from_pretrained(name), Wav2Vec2ForCTC.from_pretrained(name).eval(), id2tok)
    return _PHONE


# -------------------------------------------------------------------------- scoring


def load_audio(path: str, sr: int | None = None):
    import librosa
    import soundfile as sf

    y, file_sr = sf.read(path, always_2d=True, dtype="float32")
    y = y.mean(axis=1)
    if sr and file_sr != sr:
        y = librosa.resample(y, orig_sr=file_sr, target_sr=sr)
        file_sr = sr
    return y, file_sr


def expected_affricate_sites(text: str) -> int:
    """Places where most Brazilian accents produce [tʃ]/[dʒ]."""
    n = 0
    for w in normalize(text).split():
        if w in ("de", "da", "do", "das", "dos") and w != "de":
            continue
        if w == "de":
            n += 1
            continue
        n += len(re.findall(r"[td]i", w))           # direto, tia, dia
        if re.search(r"[td]e$", w) and len(w) > 2:  # encarte, onde, noite
            n += 1
    return n


def score(wav: str, text: str, args) -> dict:
    import librosa

    res: dict = {"wav": str(wav), "text": text}
    y_orig, sr_orig = load_audio(wav)
    dur = len(y_orig) / sr_orig
    res["duration_s"] = round(dur, 3)
    res["sample_rate"] = sr_orig
    peak = float(np.max(np.abs(y_orig)) + 1e-12)
    res["artifacts"] = {"clip_ratio": float(np.mean(np.abs(y_orig) >= 0.999)), "peak_dbfs": round(20 * np.log10(peak), 2)}

    y16, _ = load_audio(wav, 16000)
    y16n = y16 / (np.max(np.abs(y16)) + 1e-9) * 0.9

    # ---- ASR
    if not args.no_asr:
        wm = whisper(args.whisper, args.compute_type)
        try:
            lang, lang_p, all_p = wm.detect_language(y16n)
            pt_p = dict(all_p).get("pt", lang_p if lang == "pt" else 0.0)
            res["lang_id"] = {"top": lang, "top_prob": round(float(lang_p), 4), "pt_prob": round(float(pt_p), 4)}
        except Exception as e:  # older faster-whisper
            res["lang_id"] = {"error": str(e)}
        segs, _ = wm.transcribe(y16n, language="pt", beam_size=5, condition_on_previous_text=False,
                                vad_filter=False, temperature=0.0)
        hyp = " ".join(s.text.strip() for s in segs).strip()
        rn, hn = normalize(text), normalize(hyp)
        cer = edit_distance(rn.replace(" ", ""), hn.replace(" ", "")) / max(1, len(rn.replace(" ", "")))
        cer_sp = edit_distance(rn, hn) / max(1, len(rn))
        wer = edit_distance(rn.split(), hn.split()) / max(1, len(rn.split()))
        last_word = rn.split()[-1] if rn else ""
        res["asr"] = {"model": args.whisper, "transcript": hyp, "ref_norm": rn, "hyp_norm": hn,
                      "cer": round(cer, 4), "cer_with_spaces": round(cer_sp, 4), "wer": round(wer, 4),
                      "key_terms": term_hits(rn, hn), "last_word_heard": last_word in hn.split()[-3:]}

    # ---- silence / pauses
    intervals = librosa.effects.split(y16, top_db=args.top_db, frame_length=512, hop_length=128)
    if len(intervals):
        lead = intervals[0][0] / 16000
        tail = (len(y16) - intervals[-1][1]) / 16000
        gaps = [(intervals[i + 1][0] - intervals[i][1]) / 16000 for i in range(len(intervals) - 1)]
        pauses = [g for g in gaps if g >= 0.15]
        speech_span = (intervals[-1][1] - intervals[0][0]) / 16000
    else:
        lead, tail, pauses, speech_span = dur, 0.0, [], 0.0
    res["pauses"] = {"lead_s": round(lead, 3), "tail_s": round(tail, 3), "count": len(pauses),
                     "total_s": round(sum(pauses), 3), "max_s": round(max(pauses), 3) if pauses else 0.0,
                     "long_pauses_over_1s": sum(p > 1.0 for p in pauses)}

    # ---- rate
    n_words = len(normalize(text).split())
    n_syl = syllables_pt(text)
    art_span = max(1e-6, speech_span - sum(pauses))
    res["rate"] = {"words": n_words, "syllables_est": n_syl, "speech_span_s": round(speech_span, 3),
                   "words_per_s": round(n_words / max(speech_span, 1e-6), 3),
                   "syll_per_s": round(n_syl / max(speech_span, 1e-6), 3),
                   "articulation_syll_per_s": round(n_syl / art_span, 3)}

    # ---- pitch
    y22, _ = load_audio(wav, 22050)
    f0, vflag, _ = librosa.pyin(y22, fmin=60, fmax=500, sr=22050, frame_length=1024, hop_length=256)
    f0v = f0[vflag & ~np.isnan(f0)]
    if len(f0v) > 10:
        med = float(np.median(f0v))
        st = 12 * np.log2(f0v / med)
        res["pitch"] = {"median_hz": round(med, 1), "std_st": round(float(np.std(st)), 3),
                        "range_st_p5_p95": round(float(np.percentile(st, 95) - np.percentile(st, 5)), 3),
                        "voiced_ratio": round(float(np.mean(vflag)), 3)}
    else:
        res["pitch"] = {"error": "too few voiced frames"}

    # ---- artifacts: spectral flatness on speech frames, truncated ending
    S = np.abs(librosa.stft(y22, n_fft=1024, hop_length=256))
    flat = librosa.feature.spectral_flatness(S=S)[0]
    rms = librosa.feature.rms(S=S, frame_length=1024)[0]
    active = rms > (np.max(rms) * 0.05)
    res["artifacts"]["spectral_flatness_speech"] = round(float(np.mean(flat[active])) if active.any() else float("nan"), 4)
    tail_n = int(0.04 * sr_orig)
    tail_rms = float(np.sqrt(np.mean(y_orig[-tail_n:] ** 2)) + 1e-12)
    body_rms = float(np.sqrt(np.mean(y_orig ** 2)) + 1e-12)
    res["artifacts"]["tail_rms_db_rel"] = round(20 * np.log10(tail_rms / body_rms), 2)
    trunc = res["artifacts"]["tail_rms_db_rel"] > -12
    if "asr" in res and not res["asr"]["last_word_heard"]:
        trunc = True
    res["artifacts"]["truncated_suspect"] = bool(trunc)

    # ---- MOS proxy
    if not args.no_mos:
        try:
            import torch

            with torch.no_grad():
                mos = utmos(args.utmos_repo)(torch.from_numpy(y16.astype(np.float32))[None], 16000)
            res["mos_utmos"] = round(float(mos.item()), 3)
        except Exception as e:
            res["mos_utmos"] = None
            res["mos_error"] = str(e)[:300]

    # ---- accent probe
    if args.accent:
        try:
            import torch

            fe, model, id2tok = phone_model()
            with torch.no_grad():
                inp = fe(y16n, sampling_rate=16000, return_tensors="pt")
                ids = torch.argmax(model(inp.input_values).logits, dim=-1)[0].tolist()
            seq, prev = [], None  # greedy CTC decode: collapse repeats, drop specials
            for i in ids:
                if i != prev:
                    tok = id2tok.get(i, "")
                    if not (tok.startswith("<") and tok.endswith(">")) and tok not in ("|", ""):
                        seq.append(tok)
                prev = i
            phones = " ".join(seq)
            compact = phones.replace(" ", "")
            n_aff = len(re.findall(r"tʃ|dʒ", compact))
            exp = expected_affricate_sites(text)
            res["accent"] = {"phones": phones, "affricates": n_aff, "expected_br_sites": exp,
                             "affricate_ratio": round(n_aff / max(exp, 1), 3),
                             "close_central_vowel_ɨ": compact.count("ɨ")}
        except Exception as e:
            res["accent"] = {"error": str(e)[:300]}
    return res


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--wav")
    g.add_argument("--batch", help='JSON list of {"wav":..., "text":...} (models load once)')
    ap.add_argument("--text")
    ap.add_argument("--text-file")
    ap.add_argument("--out", help="also write the JSON here")
    ap.add_argument("--whisper", default="medium", help="faster-whisper model (default: medium)")
    ap.add_argument("--compute-type", default="int8")
    ap.add_argument("--top-db", type=float, default=35.0, help="silence threshold for pause detection")
    ap.add_argument("--no-asr", action="store_true")
    ap.add_argument("--no-mos", action="store_true")
    ap.add_argument("--utmos-repo", default=None, help="local SpeechMOS clone (default: scratch clone, else torch.hub)")
    ap.add_argument("--accent", action="store_true", help="run the wav2vec2 IPA affricate probe (downloads ~1.3 GB once)")
    args = ap.parse_args()

    if args.batch:
        items = json.loads(Path(args.batch).read_text())
        out = []
        for it in items:
            try:
                out.append(score(it["wav"], it["text"], args))
            except Exception as e:
                out.append({"wav": it.get("wav"), "error": str(e)})
            print(f"scored {it['wav']}", file=sys.stderr, flush=True)
    else:
        text = args.text if args.text is not None else (Path(args.text_file).read_text().strip() if args.text_file else None)
        if not text:
            ap.error("--text or --text-file is required with --wav")
        out = score(args.wav, text, args)
    js = json.dumps(out, ensure_ascii=False, indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o))
    if args.out:
        Path(args.out).write_text(js)
    print(js)


if __name__ == "__main__":
    main()
