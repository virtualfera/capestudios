# Voice bake-off: open-source pt-BR TTS for the Encarte Aí ad

Date: 2026-10-13. Box: 4 vCPU Xeon (AVX-512, no bf16/AMX), 15 GB RAM, **no GPU**, shared with other agents, so the speed numbers are pessimistic.

## Recommendation

**Use Chatterbox Multilingual (Resemble AI, MIT) with `language_id="pt"`, conditioned on a synthetic pt-BR reference voice.** Start with `exaggeration 0.5 / cfg 0.5`. For punchy CTA lines, use `0.7 / 0.3`. Render with `--best-of 3`.

- Voices: `voice/refs/br-masc.wav` (male, the default) and `br-fem.wav` (female). Both are Kokoro-82M pt-BR voices, Apache-2.0, so they are synthetic and not real people.
- Wrapper: `voice/tts.py`. It is seeded and deterministic (same seed gives a byte-identical file). It renders 48 kHz / 24-bit mono at -1 dBFS and supports line-by-line rendering for the timeline.
- Why this setup:
  - It is the most expressive engine that is licensed for commercial use. Pitch std is 4.2–4.7 semitones and the 5–95 % range is 15–17 semitones. Kokoro has 2.8–3.5 st and 9–11 st.
  - It keeps near-perfect intelligibility (CER 0.5–2 %) and a good naturalness proxy (UTMOS 3.6–3.8).
  - It gives the editor real control over energy and pacing.
  - It runs at about 6× real time on 4 CPU threads, so 10 s of VO takes about 60 s plus about 20 s to load the model.
- **Runner-up: Kokoro-82M (Apache-2.0), voice `pf_dora` or `pm_alex`.** It is clean, Brazilian by construction (espeak pt-BR G2P) and about 1.3× real time on a single thread. It is also built into `tts.py --engine kokoro`. Its prosody is flatter, closer to a narrator than an ad read.
- **Best quality ceiling but impractical here: Qwen3-TTS 1.7B VoiceDesign (Apache-2.0).** It has the most natural pacing and pauses in the measurements, but runs at 36–92× real time on this CPU. It also produces a different voice on every generation unless you build a design-then-clone pipeline.

> **The final choice should be confirmed by human ears.** All samples are in `voice/samples/`. The metrics below can rank takes and catch broken ones, but they cannot hear a carioca accent. Start with
> `chatterbox_ref-kokoropmalex_ex05-cfg05_*`, `chatterbox_ref-kokoropfdora_ex05-cfg05_*`, `kokoro_pf-dora_*`, `kokoro_pm-alex_*` and `qwen3tts-1.7b-voicedesign_male_*`.

## Test texts

- **A (brand):** "Fazer mercado em Petrópolis é um desafio. Cada mercado com seu encarte, sua oferta, seu horário. O Encarte Aí junta tudo num lugar só: você compara os preços e vai direto na melhor oferta."
- **B (offer + CTA):** "Banana prata com quarenta e um por cento de desconto, a um quilômetro e meio de você. Baixa o Encarte Aí. O link tá na bio!"

## Method

Each candidate rendered A and B. Multi-voice engines rendered 2–4 voices, and Chatterbox rendered 4 exaggeration/cfg settings. Every file went through `voice/score.py`:

| Measure | How |
|---|---|
| Intelligibility | faster-whisper `medium` int8 on CPU, `language="pt"`, beam 5. CER (without spaces) and WER against the input after normalising both sides: lowercase, accents and punctuation stripped, digits, `%`, `km` and `R$` written out in pt-BR. Key-term check for "encarte aí", "petrópolis" and "quilômetro". |
| Language | Whisper language-ID probability for `pt`. It cannot tell pt-BR from pt-PT. |
| Expressiveness | librosa pYIN F0 on voiced frames: std and 5–95 % range in semitones, plus median Hz. |
| Pace and pauses | syllables per second over the speech span (lead and tail silence excluded), articulation rate, and internal pauses of 150 ms or more. |
| Naturalness proxy | UTMOS22-strong (SpeechMOS v1.2.0), 1–5. It is trained on English, so treat it as a rough proxy only. |
| Artifacts | clipping ratio, spectral flatness on speech frames (buzz/noise), and a truncated-ending check. I also inspected mel-spectrogram contact sheets by eye. |
| Accent probe (experimental) | the wav2vec2-xlsr-53-espeak IPA recogniser counts [tʃ]/[dʒ] affricates (BR "encar**tchi**", "**dji**reto"). **Unreliable:** it found 0 affricates in the Brazilian-native Rápido model and in Kokoro, even though Kokoro's own phoneme input contained `ʧ`. Reported for completeness only and not used in the ranking. |
| Speed | CPU wall-time ÷ audio duration (RTF), measured under contention from parallel jobs. |

Each cell below is the mean over texts A and B (n = 2). Chatterbox, Qwen and VoxCPM sample stochastically, so ±1 % CER is noise. Raw per-file numbers, with transcripts, are in `voice/bakeoff_scores.json`.

## Results

| Engine | Voice | Settings | CER % | WER % | Pitch std (st) | Pitch range p5–95 (st) | Median F0 (Hz) | Rate (syl/s) | Pauses ≥150 ms | UTMOS proxy | License | Commercial OK? | CPU RTF |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Chatterbox-ML** | **ref Kokoro pm_alex (`br-masc`)** | ex 0.5 / cfg 0.5 | 2.1 | 5.8 | 4.23 | 17.0 | 144 | 6.2 | 2.0 | **3.76** | MIT | **yes** | 6.0 |
| **Chatterbox-ML** | **ref Kokoro pf_dora (`br-fem`)** | ex 0.5 / cfg 0.5 | 0.5 | 1.9 | 4.69 | 15.0 | 178 | 6.3 | 2.0 | 3.58 | MIT | **yes** | 5.9 |
| Chatterbox-ML | ref Qwen3 designed voice (`br-jovem`) | ex 0.5 / cfg 0.5 | 0.5 | 1.9 | 3.28 | 9.0 | 197 | 5.3 | 3.0 | 3.44 | MIT | yes | 9.5* |
| Chatterbox-ML | ref Qwen3 designed voice (`br-jovem`) | ex 0.7 / cfg 0.3 | 1.6 | 3.8 | 3.13 | 8.9 | 190 | 5.2 | 3.0 | 3.51 | MIT | yes | 12.3* |
| Chatterbox-ML | ref VoxCPM2 designed male (`br-masc-2`) | ex 0.5 / cfg 0.5 | 0.0 | 0.0 | 2.44 | 8.5 | 142 | 5.6 | 3.0 | 3.13 | MIT | yes | 5.8 |
| Chatterbox-ML | ref VoxCPM2 designed male (`br-masc-2`) | ex 0.7 / cfg 0.3 | 0.5 | 1.9 | 2.88 | 7.5 | 144 | 5.4 | 3.0 | 2.94 | MIT | yes | 5.6 |
| Chatterbox-ML | ref Rápido | ex 0.5 / cfg 0.5 | 1.2 | 3.4 | 4.94 | 21.8 | 218 | 5.7 | 2.5 | 2.64 | MIT | yes† | 8.3* |
| Chatterbox-ML | built-in (English ref) | ex 0.5 / cfg 0.5 | 0.5 | 1.9 | 4.55 | 14.2 | 163 | 6.9 | 1.5 | 3.73 | MIT | yes, but accent ✗ | 7.9* |
| Chatterbox-ML | built-in | ex 0.5 / cfg 0.3 | 2.3 | 6.8 | 4.58 | 14.3 | 179 | 7.0 | 1.0 | 3.87 | MIT | yes, but accent ✗ | 13.6* |
| Chatterbox-ML | built-in | ex 0.7 / cfg 0.5 | 0.9 | 3.4 | 4.82 | 14.9 | 161 | 7.7 | 0.0 | 3.61 | MIT | yes, but accent ✗ | 18.4* |
| Chatterbox-ML | built-in | ex 0.7 / cfg 0.3 | 1.4 | 5.3 | 5.40 | 15.3 | 160 | 7.2 | 0.5 | 3.80 | MIT | yes, but accent ✗ | 15.2* |
| Kokoro-82M | pf_dora | speed 1.0 | 0.5 | 1.9 | 2.76 | 8.8 | 174 | 6.5 | 2.5 | 3.66 | Apache-2.0 | **yes** | 1.3 (1 thread) |
| Kokoro-82M | pm_alex | speed 1.0 | 0.5 | 1.9 | 3.46 | 11.2 | 130 | 6.5 | 2.5 | 3.42 | Apache-2.0 | **yes** | 1.3 (1 thread) |
| Kokoro-82M | pm_santa | speed 1.0 | 0.5 | 1.9 | 4.65 | 17.0 | 134 | 6.4 | 0.0 | 2.73 | Apache-2.0 | yes | 1.2 (1 thread) |
| Qwen3-TTS 1.7B VoiceDesign | prompt "BR male announcer, Rio accent" | fp32 | 0.7 | 2.9 | 4.12 | 11.8 | 204 | 5.1 | 3.0 | 3.56 | Apache-2.0 | yes | **36–92** |
| VoxCPM2 (2B) voice design | same prompt | cfg 2.0, 10 steps | 1.1 | 1.9 | 3.51 | 12.1 | 163 | 6.8 | 1.5 | 2.71 | Apache-2.0 | yes | **29–39** |
| Rápido TTS (21M, pt-BR native) | built-in (female) | 8 steps, guidance 4 | **0.0** | **0.0** | 4.68 | 15.4 | 204 | 5.4 | 2.5 | 2.23 | Apache-2.0 | yes† | 1.6 (2 threads) |
| Piper | pt_BR-faber-medium | default | 1.9 | 7.2 | 3.01 | 10.3 | 169 | 6.6 | 2.0 | 3.25 | data CC0; base ckpt lessac | gray‡ | 0.3 |
| Piper | pt_BR-cadu-medium | default | 5.5 | 8.7 | 2.69 | 8.4 | 130 | 5.2 | 4.0 | 3.70 | data CC0; base ckpt lessac | gray‡ | 0.2 |
| Piper | pt_BR-jeff-medium | default | 10.7 | 22.3 | 1.94 | 6.6 | 144 | 5.4 | 4.0 | 2.31 | data CC0; base ckpt lessac | gray‡ | 0.2 |
| Piper | pt_BR-edresson-low | default | 9.6 | 20.4 | 2.29 | 7.8 | 152 | 4.6 | 3.0 | 2.51 | data CC-BY-4.0; base ckpt ryan | gray‡ | 0.2 |

\* Measured while other jobs were running. Uncontended Chatterbox on 4 threads is 5.6–6.3× real time. Through `tts.py`, short lines run at about 8–10× because of fixed per-call overhead.
† Rápido's training-data source and license are not stated on its model card.
‡ The Piper pt_BR voices are fine-tuned from the lessac/ryan English checkpoints. Lessac comes from the Blizzard 2013 data, whose license is research-oriented. The runtime `piper-tts` 1.8 is GPL-3.0, which does not affect the audio output.

Whisper's language-ID probability for `pt` was ≥ 0.984 for every file.

Clipping and truncation in the raw engine output:
- Chatterbox with the Rápido reference clipped 0.06–0.07 % of samples. That is real clipping.
- Piper (which normalises itself to 0 dBFS) and a few built-in Chatterbox takes touched full scale on fewer than 0.003 % of samples, which is harmless.
- The recommended `br-masc` / `br-fem` takes did not clip.
- Only one file was flagged as possibly cut off: `chatterbox_ref-voxcpmvdmale_ex07-cfg03_A` ends loud, at -8 dB relative to the body. The transcript is complete.

### What the numbers and spectrograms say

- **Chatterbox's built-in voice** reads too fast: 6.9–7.7 syl/s, with almost no pauses (it runs through the commas). Its reference voice is not Brazilian. One take rendered "encarte" as "enkart", which suggests a non-Brazilian final vowel. **Do not use the built-in voice for the ad.**
- Using a **pt-BR reference** brings Chatterbox's pace down to a natural 5.3–6.3 syl/s and restores pauses at sentence ends while keeping its pitch movement.
  - The Kokoro-based references, `br-masc` and `br-fem`, gave the best balance of expressiveness and UTMOS.
  - The VoxCPM2-designed male reference, `br-masc-2`, had perfect CER but flatter intonation.
- **Chatterbox output has a quiet tail artifact,** a -40 to -50 dB mumble after the last word, and it occasionally garbles very short inputs. A lone "Baixa o Encarte Aí." transcribed as "By showing Karcha aí". `tts.py` handles this in three ways:
  - It never splits lines shorter than 200 characters into separate generations.
  - It trims edges with an RMS gate at -35 dB.
  - `--best-of N` uses Whisper to pick the cleanest of N seeds. In the test, all three seeds of the CTA were intelligible and the winner had CER 0.
- **Kokoro** is clean and steady, but its pitch range is about half of Chatterbox's, so it sounds like an informational narrator. It is a solid fallback, and the best choice when speed matters.
- **Qwen3-TTS VoiceDesign** has the most human-looking prosody in the spectrograms: clear harmonics, phrase-final falls and natural pauses. However:
  - The voice requested as "male" came out at a median of 184 Hz on text A and 227 Hz on text B, so it may read as young or ambiguous.
  - The voice changes on every call.
  - At 36–92× real time it is too slow for iteration on this box.
- **VoxCPM2** has good intelligibility but a low UTMOS and an inconsistent voice between calls. It is also slow.
- **Rápido** is the only pt-BR-native model and the most intelligible (0 % CER), but its spectrogram shows a constant noise floor, a VAE hiss. That likely explains its lowest UTMOS (2.2). It has a single female voice and no control over style.
- **Piper** voices drop the nasal tilde ("Missing phoneme from id map: ̃", with both piper-tts 1.8 and 1.2). That makes them read "encarte" as "encate" and gives them flat pitch. They sound robotic next to the others.

## Ranking (honest judgment; commercial licensing weighted heavily)

1. **Chatterbox-ML + pt-BR synthetic reference** (`br-masc` / `br-fem`): MIT, expressive, controllable, deterministic and practical on CPU. **Recommended.**
2. **Kokoro-82M** pf_dora / pm_alex: Apache-2.0, fast and clean, but flatter. **Runner-up.**
3. Qwen3-TTS 1.7B VoiceDesign: Apache-2.0, the most natural prosody, but far too slow on this CPU and the voice is unstable between calls.
4. Chatterbox-ML + `br-masc-2` (VoxCPM2-designed male): perfect intelligibility, but a flatter, lower-MOS read.
5. Chatterbox-ML with the built-in voice: expressive but rushed, with an accent risk. Not for the ad.
6. Rápido TTS: perfect intelligibility and a native accent, but audible hiss.
7. VoxCPM2 voice design: slow, low MOS proxy.
8. Piper faber / cadu, then jeff / edresson: robotic, nasal vowels lost, license gray.

## Skipped or not tested (time-box about 15 min each)

| Candidate | Why |
|---|---|
| edge-tts (pt-BR Francisca / Antonio / Thalita) | Microsoft's websocket returned **HTTP 403** from this container. That happened after I fixed the client's CA bundle and proxy, and with the latest edge-tts 7.2.8. The voices are also proprietary, with no commercial license, so it could only have been a benchmark. |
| F5-TTS pt-BR fine-tunes | The base weights are **CC-BY-NC**, so they are not usable for a commercial ad. Not tested because of the time-box. |
| XTTS-v2 | Coqui Public Model License (**non-commercial**). Not tested because the install is heavy and it could not be used anyway. |
| Chatterbox HF Space via gradio_client | Not needed: the same model runs locally on CPU without queue limits, and the result is deterministic. |
| Qwen3-TTS 0.6B CustomVoice | Its 9 preset speakers are native zh/en/ja/ko voices, so Portuguese would come out foreign-accented. VoiceDesign was tested instead. |
| MOSS-TTS, CosyVoice2 | Found in the search for the current state of the art. Not tested for lack of time. |

## Voice-cloning compliance

No real or identifiable person was cloned. The Chatterbox references in `voice/refs/` are outputs of Apache-2.0 models: Kokoro's synthetic pt-BR voices, plus voices designed from a text prompt with VoxCPM2 and Qwen3-TTS. Their provenance is recorded in `voice/refs/refs.json`. Chatterbox embeds Resemble's inaudible **Perth watermark** in every output. It is kept on purpose as a responsible-AI marker and does not affect the sound.

## How to use (for the editor)

```bash
# one line
python voice/tts.py --text "Baixa o Encarte Aí. O link tá na bio!" --out out/cta.wav --exaggeration 0.7 --cfg 0.3 --best-of 3
# whole script, one wav per line + manifest.json with durations
python voice/tts.py --lines copy/vo_lines.json --outdir voice/takes --voice br-masc --best-of 3 --seed 7
# fast fallback
python voice/tts.py --engine kokoro --voice pm_alex --text "..." --out x.wav --speed 1.05
# score any take
/tmp/claude-0/-home-user-capestudios/daf4fc2d-c9ac-5c63-9258-a70695f848b9/scratchpad/venvs/tts-eval/bin/python voice/score.py --wav x.wav --text "..."
```

`tts.py` re-executes itself in the right venv, so any `python` works. The venv paths and rebuild steps are at the top of the file.

Tips:
- Write the copy the way it should be spoken: "quarenta e um por cento", "um quilômetro e meio".
- Chatterbox's pacing is best for lines between about 60 and 200 characters. For CTAs, use `--best-of 3`.
- For more energy, raise `--exaggeration` to 0.6–0.7 and lower `--cfg` to 0.3–0.4.
- `--speed 1.05–1.10` tightens the read without changing pitch.

## Caveats

- **None of this has been listened to.** The ranking uses objective proxies: ASR, F0, pace, an English-trained MOS predictor and spectrograms. The Brazilian accent of the Chatterbox and Kokoro voices could not be verified objectively, and the IPA affricate probe proved unreliable. A native listener should A/B the top 3 before the final mix.
- n = 2 sentences per configuration, and the autoregressive models are stochastic. Small CER and MOS differences (under 1 % CER, under 0.2 MOS) are within noise.
- Speeds were measured on a shared CPU while other jobs were running.
- Whisper normalises some colloquial forms ("Baixa" can come back as "Baixe", "tá" as "está"). That adds a small, uniform WER floor to every engine.
