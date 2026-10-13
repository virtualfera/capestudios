# REFERENCE — "Spotify / Single Click" motion piece (TikTok @rikibosso)

Client quote: *"gosto de efeitos sonoros assim, cara de cinema, e que engaja"*

Source: `scratchpad/ref/tiktok.mp4`, 21.06 s, 1080x1920 at 29.97 fps. A phone films a monitor while DaVinci Resolve plays a 16:9 spec ad. The audio is "original sound - rikibosso", i.e. the phone microphone picking up the room. Every time below is **video time**. DaVinci timeline time = video time − 0.37 s, measured from the playhead timecode at 60 fps.

> **Important correction for the team:** the reference **does have narration**. A calm, close-miked female VO is on track `VO - Lauren B` (6 clips). Whisper ASR and a Demucs vocal split both confirm it. The piece is therefore a narrated ad with an SFX and music bed underneath, which is the same format as our reel. Its mix levels can be copied almost directly.

---

## 0. What the DaVinci project shows (read off the screen)

- **Scenes bin (01 Scenes 16x9):** S01 Logo · S02 iPhone reveal · S03 Island… · S04 Shortcuts UI · S05 New releases · S06 Listen · S07 With a single click · S08 Pill to logo · S09 Lock-up · S10 End card.
- **SFX bins (05 SFX):** `Whooshes`, `UI & foley`, `Hits & impacts`, `Glitch & light`. This is the same palette the sound recipe below uses.
- **Audio tracks:** VO lanes A/B with 6 clips (L1…L6, one clip per line), `Music 1 - Drums.wav`, `Music 2 - Bass.wav`. The drums and bass stems are **not audible**: Demucs drums and bass stems sit at −70 LUFS, peak −58 dBFS. What we hear is an ambient pad plus SFX.
- The timeline ruler is full of colored markers, which are SFX/sync cue points. It looks like a cue-driven edit.

## 1. VO transcript and timing (Whisper small plus Demucs vocal-stem activity, ±0.1 s)

| t (s) | line | on screen |
|---|---|---|
| 0.57–3.00 | "Every song you love already in your pocket." | logo → phone fly-in |
| 3.36–4.62 | "One tap and you're in." | home screen → island → art zoom → **flash on "in"** |
| 4.98–7.02 | "Chill mixes, late-night drives," | UI cards titled *Late Night Drive*, *Sunday Slow*… (the words match the UI) |
| 7.26–9.28 | "the new drop everyone's talking about." | "New releases for you" cards |
| 9.50–11.28 | "Listen to your favourite artists" | the same words as kinetic type, word by word |
| 11.72–12.73 | "with a single click." | the same words as kinetic type |
| *12.8–15.0* | *(no VO, 2.3 s)* | **silence drop → light streak → orb flash → icon** |
| 15.10–15.80 | "Spotify." | wordmark slides out (15.02) |
| *15.8–21* | *(no VO)* | lock-up hold, chord bloom, "made by" card |

There are 34 words over 15.2 s, about 2.2 words/s overall and about 2.7 words/s while speaking, with 0.3–0.4 s pauses between lines. On-screen text lands 2–3 frames **before** the VO speaks the same word.

---

## 2. Shot-by-shot breakdown (video time)

| # | t0 | t1 | scene | what appears | transition / motion | typography |
|---|---|---|---|---|---|---|
| 1 | 0.00 | 0.47 | S01 | Empty frame: large soft **green radial glow** (core about #1DB954, captured as #0D9D4A–#3BC166) on blue-black (#05100F–#0D151F), heavy vignette | glow breathing | – |
| 2 | 0.47 | 1.62 | S01 | **Logo icon** drops in from slightly above, blur → sharp (0.47–0.70). A **dark "negative halo"** behind it carves a hole in the glow. The **wordmark slides out to the right from behind the icon** with motion blur (1.03–1.23) while the icon shifts left. Holds. | ease-out about 230 ms; mask-reveal slide | wordmark reveal-by-slide |
| 3 | 1.62 | 1.85 | S01→S02 | Logo stretched vertically with motion blur and flung up and out; glow brightens | **whip-up exit**, about 200 ms | – |
| 4 | 1.75 | 2.58 | S02 | **3D glossy black phone** tumbles from far/bottom toward camera (about one rotation, motion blur) and swings upright into a low-angle hero | overlaps #3 (no cut) | – |
| 5 | 2.55 | 2.82 | S02 | Lock screen "9:41", green aurora wallpaper | settle with small overshoot, slow push-in | – |
| 6 | 2.82 | 3.62 | S02 | Unlock: **100 ms cross-dissolve** to the home screen (app icon centered). **Specular light sweep** across the glass at 3.45–3.60 | continuous dolly-in | – |
| 7 | 3.62 | 3.92 | S03 | **Dynamic Island springs open** into a now-playing player | spring overshoot, about 100 ms | – |
| 8 | 3.92 | 4.38 | S03 | Purple **album art scales out of the phone and fills the frame** (camera flies into it), light shafts | **zoom-through** | – |
| 9 | 4.38 | 4.60 | S03→S04 | **WHITE FLASH**: ramps to near-white in about 70 ms (4.38–4.45), holds 1–2 frames, decays through pale green (#DFF6C2) to dark green by 4.60 | flash transition | – |
| 10 | 4.60 | 6.50 | S04 | Dark green glow. **Filter chips pop in** left to right (4.67–4.93). 2x2 **playlist cards slide in from the right**, staggered about 70 ms, with motion blur and a slight 3D tilt (5.00–5.35). **"Music" chip is selected**: the green pill slides over (5.60–5.75). "Following" chip expands in (6.00–6.10). | constant slow camera drift plus shallow DOF | white semibold UI labels |
| 11 | 6.50 | 7.30 | S04→S05 | Camera pans/tilts, cards defocus and exit right; **"New releases for you" cards rise from the bottom** with blur (6.85–7.25) | motion-blur push | small section title |
| 12 | 7.30 | 9.15 | S05 | 3 tall album cards; slow push plus **tilt-up revealing a 2nd row** (8.00–8.50) | drift | card labels |
| 13 | 9.15 | 9.40 | S05→S06 | Everything **defocuses and fades** to an empty glow | **blur-out**, about 200 ms | – |
| 14 | 9.40 | 9.78 | S06 | **"Listen" glitches in**: RGB split and horizontal slice jitter for 2–3 frames, very wide tracking that tightens | glitch-in | bold sans, white, small (about 5% of frame height) |
| 15 | 9.78 | 11.38 | S06 | "to your favourite artists" **flies in from the right with heavy horizontal motion blur**. Words de-blur one by one (10.10–10.45) and **tracking compresses** (10.45–10.70). "artists" is in green. Holds. | kinetic type, expo ease-out | key word in brand color |
| 16 | 11.38 | 11.58 | S06→S07 | The line **smears into a horizontal streak and whips out left**; the next line enters from the right | whip-pan on type | – |
| 17 | 11.58 | 12.83 | S07 | "with a single click" sharpens by 11.70, "single" in green; glow drifts left | – | – |
| 18 | 12.83 | 13.06 | S08 | **Letter-spacing collapses to zero** ("withasingleclick") | tracking squeeze | – |
| 19 | 13.06 | 13.20 | S08 | The text becomes a **thin horizontal light streak** (white with a green core) that shortens | morph | – |
| 20 | 13.20 | 13.30 | S08 | The streak pinches into a **white-hot orb**: the brightest frame of the piece, with bloom | **flash** | – |
| 21 | 13.30 | 13.83 | S08 | The orb **cools to green and shrinks to icon size**; a dark halo forms; the glyph appears at 13.83 | morph → logo | – |
| 22 | 13.83 | 15.02 | S09 | Icon alone with dark halo; glow off-center to the left | anticipation hold, 1.2 s | – |
| 23 | 15.02 | 15.22 | S09 | **Wordmark slides out right** with motion blur, the same move as #2 | 200 ms | – |
| 24 | 15.22 | 18.63 | S09 | **Lock-up hold** (3.4 s); legal line fades in at the bottom (15.6); glow breathes | – | tiny legal line |
| 25 | 18.63 | 18.77 | S10 | Logo dims and defocuses to dark; a single **spark point** remains | – | – |
| 26 | 18.77 | 19.00 | S10 | The spark **stretches into a horizontal light line**; the background shifts to a **warm champagne glow** (#B9B5A8 core) on black | – | – |
| 27 | 19.00 | 21.06 | S10 | "made by / riccardo bosso" **scan-reveals out of the line** (19.00–19.35) and holds; audio fades out 20.0–20.45 | – | tiny label plus medium name |

**Pacing**
- 10 scenes in about 20.7 s, so the mean scene length is **2.1 s**.
- There are 27 visual beats, a mean of **0.78 s** each. In the body (0.5–15.2 s) that is about **1.5 motion events per second**.
- There are **zero hard cuts**. Every change is driven by motion: whip, zoom-through, flash, defocus, or morph.
- Transitions last **100–250 ms**. Holds last 0.3–1.9 s, and the end lock-up holds 3.4 s.
- The rhythm is "hold, snap, hold". The camera never stops: there is always a 2–5 %/s drift or dolly.

---

## 3. Audio analysis (librosa/scipy plus Demucs htdemucs stem split)

**Recording caveats.** The audio comes from the phone microphone, so:
- integrated loudness is −31.0 LUFS, true peak about −18 dBFS, LRA 5 LU
- it is near-mono: L/R correlation 0.96, side −16 dB under mid, so the original stereo image is lost
- below 100 Hz is unreliable, because phone mics and monitor speakers lose sub
- AAC 64 kbps leaves nothing above about 16 kHz, and there is a notch around 6 kHz
- room tone sits at about −50 dBFS, and reverb tails are inflated by the room

Treat the low-end and width numbers as *unknown*. Level ratios between VO and bed are reliable.

**Stems.** Vocals −30.9 LUFS · no-vocals (pad + SFX) −37.9 LUFS, so the **bed sits about 7 LU under the VO** overall.
- **Under speech** the bed is **−11.4 dB** below the VO in 50 ms RMS (median), and −10.7 dB median / −4.3 dB p90 in 400 ms momentary loudness.
- **Where there is no VO** (the outro), the bed rises to **+3.6 dB above** the VO's speaking level.

**Music.**
- **No beat.** There is no drums or bass stem content, and the onset autocorrelation of the bed has no stable tempo. The beat tracker's 110–121 BPM comes from VO syllables and should be ignored.
- The bed is a **dark ambient pad in C minor** (Krumhansl r = 0.85; next best Eb major 0.59). It is strongly harmonic (H/P +25 dB).
- It **breathes**: slow amplitude modulation at **0.8–1.1 Hz**, about **8 dB peak-to-peak** in 250–2 kHz, like detuned-saw beating or an LFO.

Chords by section (spectral peaks of the bed stem):

| section | notes found | reading |
|---|---|---|
| 0.5–1.9 logo | F3 C4 Eb4 F4 G4 C5 (+Ab3) | Cm(add11), swell in |
| 2.0–4.3 phone/home | **F2 87 Hz bass** + F3 Bb3 C4 Eb4 G4 C5 | Cm11 over F (lift); the bass enters with the phone whoosh at 1.97 |
| 4.4–7.0 UI | Db3 F3 Ab3 C4 **Eb4** F4 | Db-maj7-ish colour (bVI); the bass cuts on the white flash |
| 7.0–9.4 new releases | F3 Bb3 C4 Eb4 F4 Bb4 C5 | Cm7/Fm9 |
| 9.4–11.9 Listen | C3 Bb3 C4 Eb4 **F4** G4 | Cm11 |
| 11.95–13.0 single click | **F2 87 Hz bass returns** + F3 C4 Eb4 G4 | tension |
| 13.0–13.7 | *(bed cut, only a thin 2.79 kHz tone)* | **silence drop** |
| 13.75–14.8 icon | **D3 F3 A3** C4 Eb4 F4 | Dm7b5 / F6, unresolved |
| 15.7–20.2 lock-up/end | C4 **Eb4** G4 C5 Eb5 + F3 Ab3 C6 | **resolves to Cm(add11), bright bloom** |

Spectrograms and band plots (scratch, not in the repo): `scratchpad/ref-work/overview.png`, `nv/overview.png`, `zoom_spec.png`, `nv_detail.png`, `music_stereo.png`.

---

## 4. Sound events mapped to visuals

Levels are the bed stem's 50 ms RMS peak relative to the VO's median 50 ms RMS while speaking (the VO median is 0 dB).

| t (s) | type | description (measured) | synced visual | level vs VO |
|---|---|---|---|---|
| 0.38–0.62 | **light hit / sparkle** | broadband transient 1.5–20 kHz (+29 dB over the band median), about 230 ms, then a **sine glint about 925 Hz (Bb5)** 0.47–0.95 | logo icon appears (0.47); sound leads by about 3 frames | −19 dB |
| 0.45–1.30 | **pad swell-in** | from silence to the pad: +38 dB over about 0.9 s (fast jump at 0.48, then slow rise) | logo settles, VO starts 0.57 | −3 dB at top |
| 1.97–2.30 | **whoosh** | high-band swell +19 dB, about 330 ms, resonant peak about 1.76 kHz; **F2 bass drone enters** | phone tumbles toward camera (1.8–2.45) | −5 dB |
| 2.12 / 2.49 | tick | short transients (77 / 56 ms) | phone rotation / lands upright (2.45–2.58) | −6 dB |
| 2.94 | soft transient | +8 dB high band, 74 ms | unlock dissolve to home (2.82–2.90) | −7 dB |
| 3.62–4.11 | **riser / swell** | bed RMS +9.6 dB linear ramp (r² = 0.96) | island expands → art zoom-through | −6 dB |
| 4.30 | **low cut** | F2 drone stops dead | **white flash** (4.38) | – |
| 4.76 | soft bump | high +5 / low +6 dB | chips pop in (4.67) | −8 dB |
| 4.98 | whoosh | high +8 dB, about 220 ms | cards slide in (5.00) | −7 dB |
| 5.52 / 5.68 | **UI click** | mid +10 dB, 100–170 ms | "Music" chip selected (5.60) | −6 dB |
| 6.55 | whoosh | high +7 dB, about 270 ms | camera pan, cards exit (6.5–6.9) | −5.5 dB |
| 8.04 | soft whoosh | high +8 dB, about 230 ms | 2nd row rises (8.0–8.5) | −9.5 dB |
| 9.15–9.40 | dip | bed drops with the VO pause | defocus to empty glow | – |
| 9.48 | **glitch tick** | +9 dB, 80 ms, high band | "Listen" glitch-in (9.42) | −18 dB |
| 9.82 | tick-whoosh | +11 dB, 50 ms | line flies in from right (9.78) | −10 dB |
| 10.38 | shimmer | +16 dB high band, 185 ms | words de-blur, tracking settles (10.4) | −12 dB |
| 11.95–13.00 | **bass drone** | F2 87 Hz returns | "with a single click" | – |
| 12.71 | tick | 112 ms | tracking collapse (12.83) | – |
| **13.00–13.70** | **SILENCE DROP** | the whole bed hard-cuts (about −20 dB, room tone about −60 dBFS); only a **thin sine about 2.79 kHz (F7)** | text → **light streak** (13.06) | tone about −25 dB |
| 13.15–13.38 | **flash "zing"** | the tone flicks **up to about 3.4 kHz** (+6 dB) with an air burst, 235 ms | **orb flash** (13.20–13.27) | −19 dB |
| 13.46 | soft shimmer | +9.5 dB high band | orb cools | – |
| 13.71–13.76 | **hit + pad re-entry** | broadband transient, pad returns on the **Dm7b5** chord, air tail about 1 s | orb → icon (glyph 13.83) | −19 dB transient |
| 14.62–14.84 | **short riser** | +5 dB, 520 ms | icon hold (anticipation) | −6 dB |
| **14.84–14.90** | **LOGO HIT** | the biggest low-band hit (+14.5 dB at 80–250 Hz), attack about 50 ms, **chord change** | wordmark slides out (15.02); VO "Spotify" 15.10 | −5 dB |
| 15.6–16.3 | **chord bloom** | pad resolves to Cm, 2–8 kHz band +25 dB over about 700 ms | lock-up hold | **+3.6 dB** |
| 16.3–20.0 | sustained pad | 0.8–1.1 Hz breathing, about 8 dB peak-to-peak | lock-up, end card | +3 dB |
| 18.7–19.8 | high shimmer | soft 8–12 kHz sparkle | light line → "made by" scan-reveal | about −20 dB |
| 20.00–20.45 | **fade-out** | about −35 dB over 450 ms, then room tone | end card hold | – |

**Sync habit.** The SFX start **2–5 frames (60–150 ms) before** the visual peak: logo +90 ms, orb +80 ms, wordmark hit +180 ms before the slide. The text appears 2–3 frames before the VO word.

---

## 5. SOUND DESIGN RECIPE (procedural numpy/scipy, no samples)

General values: 48 kHz, float32. Reverb is an FFT-convolved exponentially decaying noise IR (stereo-decorrelated L and R, pre-delay 20–40 ms; RT60 as stated per element). "dB vs VO" means peak short-term (50 ms RMS) level relative to the VO's median speaking level, with the **VO normalized to −16 LUFS**, so roughly −16 LUFS short-term = 0 dB.

### 5.1 Ambient pad bed ("cinema drone"): the most important element
- **Voicing (C minor):** C3 130.8, G3 196.0, C4 261.6, Eb4 311.1, F4 349.2, G4 392.0, C5 523.3.
  - Section colours: add **F2 87.3 Hz** (sine plus 2nd harmonic) for "lift/tension" sections; **Db3/Ab3** for a bVI colour; **D3 + A3** (Dm7b5) for the unresolved pre-logo bar; **resolve to Cm(add11) plus C6** on the logo.
- **Oscillators:** each note gets 5 saws detuned ±4, ±9 cents with random phase (L and R use different detune seeds for width), plus one sine an octave below the root at −12 dB.
- **Filter:** 2-pole low-pass, cutoff 1.6–2.2 kHz under VO and **opening to 6–8 kHz over 700 ms** for the final bloom. LFO on cutoff ±15 % at **0.9 Hz**, plus an amplitude LFO of 6–8 dB peak-to-peak at 0.9–1.1 Hz (the "breathing").
- **Envelope:** attack 600–900 ms (exponential), release 450 ms. Chord changes crossfade over 250–350 ms **at transitions**.
- **Reverb:** hall RT60 4–6 s, 35 % wet; width 120 % (decorrelated L/R); mono below 150 Hz.
- **EQ:** HPF 90 Hz (except the intentional F2 bass note at −10 dB vs pad), −3 dB at 250–400 Hz, and a **VO-keyed dynamic dip of −3 to −4 dB at 1.5–4 kHz**.
- **Level:** **−11 dB vs VO under speech** (about −27 LUFS short-term). Rises to **+3 dB** in VO-free endings. The pad swells in from silence at the start (0 → full over about 0.9 s).

### 5.2 Light hit / sparkle ("glint")
Used on logo appearances, orb flashes, and sparkle reveals.
- **Duration:** 200–300 ms dry plus a 1.5–2.5 s tail.
- **Layer A (air):** white noise → bandpass 3–16 kHz (4th order), attack 2–5 ms, exponential decay τ = 60 ms.
- **Layer B (tone):** sine at a **chord tone** (Bb5 932 / C6 1047 / F7 2794 Hz), attack 5 ms, decay 400–800 ms. Add a **+3–5 % upward pitch flick in the first 30 ms**; the reference's orb flash goes 2.79 → 3.4 kHz.
- **Layer C (shimmer, optional):** 4 bell partials at ratios 1, 2.76, 5.40, 8.93 × f0, each decaying faster as it goes higher, randomly panned ±60 %.
- **Reverb:** bright plate 2.5 s, 40 % wet; stereo wide.
- **Level:** **−18 to −12 dB vs VO** (subtle, as in the reference), up to −8 dB in VO gaps.

### 5.3 Whoosh (objects and cards flying, camera pans, text fly-ins)
- **Duration:** 220–350 ms for small UI moves, 500–800 ms for big moves (phone, zoom-through).
- **Source:** pink noise plus about 20 % of a resonant band (Q 3) around 1.5–1.8 kHz. The reference whoosh has a tonal peak at about 1.76 kHz.
- **Filter sweep:** bandpass centre 600 Hz → 3.5 kHz → 1.2 kHz following the object's speed, with Q 1.5–2.5.
- **Envelope:** 65 % rise (ease-in, power 2.5), 35 % fall (ease-out). **Place the peak at the frame with maximum motion blur.**
- **Motion:** pan L→R (or follow screen motion). For tonal layers, Doppler: −2 to −4 semitones across the peak.
- **Reverb:** 0.8–1.2 s, 20 % wet.
- **Level:** **−5 to −9 dB vs VO**; HPF 250 Hz while VO is speaking.

### 5.4 UI click / tap (chip select, button press, price highlight)
- **Duration:** 15–50 ms.
- **Layer 1:** noise burst → bandpass 2–6 kHz, attack 1 ms, decay 8–15 ms.
- **Layer 2:** sine blip at a chord tone 1.2–2.5 kHz with 30 ms decay, or a "pop" (sine 600 → 300 Hz in 20 ms).
- **Stereo and reverb:** near-mono, panned toward the element; room 0.4 s, 15 %.
- **Level:** **−6 to −10 dB vs VO**.

### 5.5 Glitch (kinetic-type entrances)
- **Duration:** 60–120 ms.
- **Construction:** 3–6 stuttered slices of 8–20 ms. Each slice is bit-crushed noise or sine (6–8 bit, sample-and-hold to 8–11 kHz), randomly gated at 30–60 Hz, with HPF 1 kHz.
- **Visual sync:** 2–3 frames of RGB-split jitter.
- **Level:** **−12 to −18 dB vs VO**.

### 5.6 Riser / swell (into flashes and big transitions)
- **Duration:** 0.5–1.0 s; up to 2 s for the main reveal.
- **Source:** noise plus a filtered saw (C or G). Low-pass cutoff sweeps exponentially 400 Hz → 8 kHz; amplitude ramps +10–12 dB on a cubic ease-in. The tonal layer can rise +5 to +12 semitones.
- **End:** **stop dead (no tail) on the flash or hit frame**, or 1–2 frames before it.
- **Level:** from −20 rising to −6 dB vs VO.

### 5.7 Silence drop ("suck-out"): the signature move
- **Timing:** about 0.5–0.7 s before the logo, **hard-cut the pad and all music** (0–30 ms fade). Optionally precede the cut with a 150–250 ms reverse swell: reversed exponential noise plus pad, cut on the frame.
- **During the drop:** keep only a **thin high sine (about 2.8 kHz, F7) at about −25 dB vs VO**, or room tone. In the reference the bed falls about 20 dB.
- **Visual sync:** this is the moment the text collapses into a light streak.
- **Rule:** **no VO here.**

### 5.8 Impact / logo hit
In the reference this hit is mid-level (−5 dB) and low-mid weighted. We can make it slightly bigger, since the client wants "cinema", but keep it in a VO gap.
- **(a) Sub:** sine 55 → 38 Hz exponential pitch drop over 400 ms, attack 3 ms, decay τ 350 ms; HPF 30 Hz.
- **(b) Body:** sine/triangle 110 → 80 Hz plus noise low-passed at 400 Hz, 150 ms decay.
- **(c) Transient:** click of 2–5 ms bandpassed 2–5 kHz.
- **(d) Drive:** tanh saturation (drive 2–3) on (a) and (b) to create **150–400 Hz harmonics that phone speakers can play**.
- **(e) Tail:** hall 2.5–3.5 s, 25 % wet on (b) and (c) only. Everything below 150 Hz stays mono.
- **Harmony:** pair the hit with the **pad chord change/resolution** at the same moment.
- **Level:** **−3 to 0 dB vs VO**, only in VO gaps (at least 250 ms clear of speech).

### 5.9 Final chord bloom and outro
- **Bloom:** the pad resolves to Cm(add11) plus C6. The low-pass opens over 700 ms, the 2–8 kHz band comes up about +25 dB, and the level reaches **+3 to +4 dB vs VO** (no VO).
- **Breathing:** keep the 0.9–1.1 Hz breathing.
- **End-card shimmer:** soft 8–12 kHz granular sparkles at −20 dB.
- **Fade-out:** 450 ms, ending about 0.5 s before the last frame.

### 5.10 Mix rules (event density and low-end management)
- **Density:** about 1.5 small events per second in the body, but only **4–5 hero moments in 30 s** (one every 6–7 s): opening light hit, big whoosh, flash, silence drop plus logo hit, chord bloom.
- **Placement:** SFX under VO stay short (< 300 ms) and sit **between words or on word onsets**, never across a stressed syllable.
- **Low end:**
  - HPF every SFX at 120–150 Hz while the VO speaks.
  - Sub, booms and the F2 bass only in VO gaps.
  - Sidechain the pad and sub to the VO: −6 dB, attack 10 ms, release 250 ms.
  - Pad dynamic EQ −3 to −4 dB at 1.5–4 kHz keyed by the VO.
  - Keep < 100 Hz mono.
- **Stereo:** VO mono centre; pad and reverbs wide; whooshes pan with motion; check mono compatibility (correlation > 0.3), because phone speakers are mono.
- **Targets:**
  - VO −16 LUFS integrated
  - pad about −27 LUFS short-term under VO
  - whooshes and clicks −21 to −25 short-term
  - sparkles −28 to −34 short-term
  - logo hit about −16 to −13 momentary
  - bloom about −13 momentary
  - final master **−14 LUFS integrated, −1 dBTP** (for IG/TikTok)
- **Sync:** SFX onset 0–2 frames **before** the visual peak; the reference uses up to 3–5 frames.

---

## 6. VISUAL RECIPE adapted to Encarte Aí (green brand)

Brand colors from `assets/icon-symbol.svg`: green **#3CAD4C**, dark green **#2F8A3B**, orange accent **#F6A623**, white card, near-black green background (about **#0F1C16**), and a **4-point sparkle** inside the tag. That sparkle is the natural "light" motif, the equivalent of the reference's orb.

- **Glow:**
  - Background is one big soft radial gradient (ellipse 70–90 % of frame width, Gaussian falloff) on #07110D. Core is #3CAD4C → hot centre #6EE07A, edges #0B2A17 → black, with a strong vignette.
  - The glow centre **drifts slowly** (5–10 % of the frame over 2–3 s) and **breathes** ±8–10 % brightness at about 0.9 Hz, in sync with the pad.
- **Negative halo:** behind every hero object (tag icon, phone, logo) put a black radial at 2× the object's size, 60–70 % opacity, so it pops off the glow.
- **Camera:** never static; constant 2–5 %/s dolly or drift and shallow-DOF blur on the background layers.
- **Entrances:** 150–250 ms, heavy directional motion blur (shutter about 360°), **expo ease-out** `cubic-bezier(0.16,1,0.3,1)`.
- **Exits:** 150–200 ms, expo ease-in, whip with blur.
- **UI:** springs with 5–8 % overshoot and about 100 ms settle; cards staggered 60–80 ms.
- **Transitions (no hard cuts):**
  - whip / motion-blur push
  - **zoom-through** into an image, e.g. a flyer filling the frame
  - **white flash**: 70 ms ramp → 2 frames hold → 150 ms decay through #E3F5D5 to the green glow
  - **defocus-out** (blur 0→40 px plus fade, 200 ms) into an empty glow
  - the **text → streak → orb morph** for the logo reveal
- **Typography:**
  - Bold geometric sans, white, **small** (4–6 % of frame height, one short line, centred, lots of negative space).
  - **Key word in brand green**, e.g. *"mercado"*, *"melhor oferta"*, *"Petrópolis"*. Orange #F6A623 only 1–2 times, for price/offer highlights.
  - Entrances: (a) glitch-in with RGB split while wide tracking tightens over 300 ms, or (b) fly-in from the right with horizontal blur and word-by-word de-blur, with tracking compressing over 200–250 ms.
  - Exits: tracking collapse → light streak.
  - Text appears 2–3 frames before the VO says it.
- **Logo reveal, adapted from S08–S09:**
  1. The final line's tracking collapses to a **light streak**.
  2. The streak pinches into a **white orb flash** (brightest frame).
  3. The orb cools to green and becomes the **4-point sparkle**.
  4. The white card and the green tag draw around it.
  5. The **"Encarte Aí" wordmark slides out to the right** with motion blur.
  6. Hold the lock-up with breathing glow for 2.5–3.5 s.
- **End card / CTA:** the logo dims to a spark → the spark stretches into a light line → the CTA ("Baixe grátis • App Store / Google Play", or "Encarte Aí • Petrópolis") **scan-reveals out of the line**. Optionally shift the glow to a warm tone (champagne, or a desaturated orange #F6A623 at 20 %) for the closing card, as the reference shifts green → champagne.
- **Mobile 9:16:** the reference is 16:9. Scale the glow to about 120 % of frame height, keep text in the centre 60 % (IG UI safe zones), and start phone and card shots closer.

---

## 7. Takeaways for our ~30 s narrated reel

1. **The reference is already narrated.** We can copy its level relationships: bed about 11 dB under VO, small SFX 5–10 dB under, sparkles about 18 dB under, and full-level moments only where the VO is silent.
2. **The "cinema" feel comes from dynamics and harmony, not loud booms:**
   - a continuous dark **minor-key pad that breathes**
   - **swells into transitions** and a **bass note that cuts on the flash**
   - a **hard silence drop** before the logo
   - a bright **light hit / flash zing**
   - a **chord resolution bloom** on the brand
   Keep these four or five moves.
3. **Give the sound room in the script.** Plan two VO-free windows:
   - about **2–2.5 s right before and at the logo reveal** (silence drop → orb flash → logo hit)
   - about **4–5 s at the end** for the lock-up, chord bloom and CTA (VO may say the brand name once, as "Spotify." here)
   The copy should be about **55–65 words for 30 s** (about 2.3 words/s overall, 2.6–2.8 while speaking), in short lines with 0.3–0.4 s pauses.
4. **Mirror the VO in the visuals.** UI card titles and kinetic type repeat the words being said ("late-night drives" → a *Late Night Drive* card). For us: when the VO names the markets or "compare preços", show those flyers or the comparison UI at the same moment.
5. **Suggested 30 s skeleton** (for the copy and animation agents; adjust to the final script):
   - 0–2.5: glow + sparkle light hit + pad swell; VO hook starts at about 0.6
   - 2.5–9: the "problem": many flyers fly in and stack (whooshes, ticks; F-bass lift)
   - 9–10: zoom-through into the phone, then **white flash** (riser → flash, bass cuts)
   - 10–19: app UI: search, compare, best-offer highlight in orange (UI clicks, chip selects, soft whooshes)
   - 19–23: kinetic type for the key line ("Petrópolis é uma cidade só… e agora o mercado também"), key words in green
   - 23–25.5: **silence drop → streak → orb flash → sparkle → tag icon → logo hit** (no VO)
   - 25.5–30: lock-up + CTA + **chord bloom**, fade-out ending about 0.5 s before the last frame
6. **Don't add a drum beat.** The reference has none. If the client wants more drive, add at most a soft, sparse pulse (a muted heartbeat-style low tom every 2 beats, HPF 60 Hz, −14 dB vs VO). The pad itself is the score.

---

### Method / reproducibility (scratch only, not committed)
- Frames: 6 fps contact sheets plus 30 fps zooms at `scratchpad/ref-work/sheets/` (crop 590x345+388+868 = Resolve viewer).
- Audio: `scratchpad/ref-work/audio48k.wav`; stems `sep/htdemucs/audio48k/{vocals,no_vocals}.wav` (Demucs htdemucs, output at 44.1 kHz, resampled to 48 kHz for alignment).
- Scripts: `scratchpad/ref-work/scripts/{analyze,zoom,nvdetail,notes,levels,asr}.py`, run with venv `scratchpad/venvs/refan` (librosa 0.11, faster-whisper small, demucs, torch CPU).
- Machine-readable timings: `ref/reference_timing.json`.
