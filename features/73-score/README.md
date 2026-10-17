# A score for each land

**Aspect:** Visual art (Road to Ten, Visual art 7) · **Kind:** UI system, 1 patch, no events. The style guide is `docs/art/style-guide.md` (Sound).

The plan asks: "Add sound: a calm score per region and UI sounds (quill scratch, wax seal, steel)." The UI sounds are 61-illumination's: quill, paper, wax seal, bell and steel. The score was the missing half, marked "needs a composer". This feature is the best procedural score that can be made in the page. A composer gets a strong baseline to replace or retune, and if none comes it can ship as it is.

It is a chronicle being read, not a film score. A drone, one voice at a time, slow phrases, and long silences.

**What it does.**

- **Off by default.** The menu gains "Music (a quiet score for each land)" and a volume slider (patch `SCORE-MENU`, just above the autosave toggle).
  - No audio context exists until the player turns the music on.
  - A setting left on from an earlier visit waits for the player's first touch or key, because browsers start audio only on a gesture.
- **Six synthesized instruments,** with no files and nothing fetched (`music.core.js`):
  - a **lute** and a **harp**: plucked strings (Karplus-Strong with a fractional delay, so they are in tune), computed once per pitch into a buffer;
  - a **vielle** (or hurdy-gurdy): two detuned saws through a low-pass, with a bow swell and a late vibrato. It plays both the drone and the melody, and the drone's saws breathe slowly against its triangles;
  - a **flute**: a soft periodic wave, breath noise and a chiff on each note;
  - a **frame drum or tabor**: a thump that falls in pitch, and a rim stroke;
  - a **low bell** of inharmonic partials (hum, prime, minor third, fifth, nominal);
  - **a room**: a convolution reverb from an impulse response generated once per context.
- **Fourteen families of music** for the 24 cultures (`modes.core.js`). Each family has a mode and a war colour, a tonic and a tempo, its lead instruments, its drone, and its habits. The table is data, written to be retuned (below).
- **Generative pieces,** composed by a pure function (`SC.compose`). The seed is a hash of the culture's style, the province, the year and the season, run through a seeded PRNG. The same place and date always compose the same piece.
  1. A drone on the tonic swells in alone.
  2. Section A: a lead plays two phrases cut from two short motifs. They move mostly by step, with a leap now and then and rests between. The first ends on the fifth (a half cadence), the second on the tonic.
  3. Section B: another instrument answers with new motifs, and in some families the drone steps to the fourth.
  4. Gaps of drone and a slow rising figure let the music breathe.
  5. The last phrase comes home, and the drone dies away.
  6. A piece runs 2 to 4 minutes, then 30 to 90 seconds of silence before the next.
- **The game shapes the score.** It reads the game and never writes to it.
  - **The land:** the culture of the realm that first held the province you live in. Moving to another land crossfades to its music over 4 seconds.
  - **The season:** winter is thinner, slower and darker; summer adds the plucked fill and the peacetime drum.
  - **War:** while your realm is at war (or you are on campaign), a slow tabor fades in over a few seconds, and the next phrases take the mode's war colour.
  - **A fight:** a battle or duel sinks the score to 12% over 2 seconds, under 61's steel. It comes back over 4 seconds.
  - **Death:** the death screen fades the piece out, then brings a single bell and one slow lament falling from the fifth to the tonic. Then silence, until the next life.
  - **Night:** the game has no hour of the day. The score takes "night" from the scene, as the woodcuts do: a tavern, a dark road, a crime or an errand makes it softer and darker and drops the fill.
  - **Faith:** a scene of faith or a funeral rings a temple bell at each section.
- **It stops cleanly.**
  - **Off:** a 40 ms fade, then every source is stopped and the context is closed.
  - **A hidden tab:** a fade, then the context is suspended and the scheduler stops. When the tab is shown again, it carries on where it was.
- **Light on the CPU.**
  - A lookahead scheduler runs every 250 ms and puts the next 1.6 s on the audio clock.
  - Nodes are made per note, or per phrase for the flute and vielle, never per sample.
  - Strings, bells, drums and breath are buffers computed at 24 kHz. The 40 most recent are kept per context.
  - Each tick computes at most two strings ahead of need, so no tick does much at once.
  - No filter moves with the notes, because an automated filter costs a coefficient per sample. Only the night colour ramps the master filter, and the ramp ends.
- **A composer's preview.** `UI.SCORE.renderOffline({ cult, season, war, lament, seconds, solo, room })` renders any family through the same graph in an OfflineAudioContext. `solo` plays only some parts, and `room: false` drops the reverb. `UI.SCORE.compose(...)` gives the note list.

**The mode table** (`modes.core.js`; semitones above the tonic; the composer's to retune).

| Family | Cultures (and their own retuning) | Mode | War colour | Tonic | BPM | Lead | Drone | Habits |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| north | Northfolk (Aldmark, the Seven Halls), Marchfolk (Mixolydian / Dorian) | Dorian 0 2 3 5 7 9 10 | Aeolian | D4 | 64 | lute, vielle, flute | bowed tonic + fifth | drone to the 4th in B |
| solen | Solenfolk | Mixolydian 0 2 4 5 7 9 10 | Dorian | G3 | 56 | vielle, flute (plainchant) | bowed tonic, fifth, octave | a bell each section |
| east | Eastfolk | Aeolian 0 2 3 5 7 8 10 | Phrygian | A3 | 58 | vielle, flute, lute | bowed tonic + fifth | a bell each section; drone to the 6th in B |
| giant | Hall-giants | Mixolydian | Aeolian | C3 | 46 | vielle, flute | bowed tonic + fifth | a great bell at the opening; drone to the 4th in B |
| south | Qadiri, Sandfolk, Sabrans (D4), Tamari (Phrygian) | hijaz 0 1 4 5 7 8 10 | Phrygian | E4 | 66 | lute (oud), flute (ney), vielle | bowed tonic + fifth | a soft frame drum in peace |
| steppe | Wind Riders | major pentatonic 0 2 4 7 9 | kumoi 0 2 3 7 9 | A3 | 60 | flute, vielle (horsehead fiddle), lute | bowed open fifth | dry air (little room) |
| roof | Skyfolk | minor pentatonic 0 3 5 7 10 | in 0 1 5 7 10 | D4 | 48 | flute, vielle | bowed tonic + fifth | a bowl-bell each section |
| savanna | Zanari, Abari (D4) | major pentatonic | kumoi | F4 | 70 | flute, harp, lute | none | a repeating harp figure (kora); drum in peace |
| monsoon | Keshi (D4), Ranpuri | major pentatonic | 0 1 4 7 8 | C4 | 58 | lute, flute, vielle | plucked, cycling fifth-octave-octave-tonic (tanpura) | |
| isles | Amberfolk, Leaf People (flute alone, A4), Cloudfolk (major pentatonic, E4) | slendro-like 0 2.4 4.8 7.2 9.6 | pelog-like 0 1.2 3.8 7 8.2 | G4 | 62 | harp, flute | none | a gong-bell at the opening |
| coast | Corsairs | Mixolydian | Dorian | A3 | 68 | lute, flute | bowed tonic + fifth | a deck drum in peace; drone to the 4th in B |
| elf | Sylvari, Grovers of the Coast (Ionian / Aeolian, E4) | Lydian 0 2 4 6 7 9 11 | Dorian | F4 | 52 | harp, flute | bowed tonic + fifth | a long room |
| dwarf | Holdfolk | Aeolian | Phrygian | G3 | 54 | vielle, flute, lute | bowed tonic, fifth, octave | the melody doubled a fifth below (organum); a bell |
| orc | Horde clans, Tusk clans (D3, no drum in peace) | raw fourths 0 2 5 7 10 | in 0 1 5 7 10 | E3 | 62 | vielle, flute | bowed tonic, fourth, octave | the melody doubled a fourth above; a drum on the grass |

Every family also has a tabor pattern for war, a rhythm set its motifs are cut from, and a room size. A culture missing from the table (from a mod or a new realm) hears the Northfolk.

**Measured by** (`test.mjs`, on the full build of 67 features).

| Test | Result |
| --- | --- |
| `scoreSilentUntilAsked` | A year played, every tab drawn, the menu opened, a click and a key with the music off: 0 audio contexts, live or offline. Saved on: none until a touch, then 1. Turned off: the context is closed |
| `scoreDeterministic` | 240 pieces (24 cultures × 10 dates). Each composed twice comes out identical, and all 240 differ. Length 140–229 s (median 192), none outside 120–245 s; silence after 31–90 s. 1,754 of 1,754 phrases end on the tonic or the fifth; 75% of melodic moves are steps or repeats; the melody rests 30% of the time. A season or a year later gives another piece |
| `scoreModes` | 24 cultures in 14 families, each with a mode and a war colour of the same length. 9,088 composed notes checked in peace and at war, all in their mode. All 10 named tunings hold (Northfolk Dorian, Hall-giants Mixolydian, the desert hijaz, Tamari Phrygian, steppe and sky pentatonic, Sylvari Lydian, Grovers Ionian, dwarves' fifths, orcs' fourths, war darker) |
| `scoreMood` | Notes that sound in one piece: winter 124, spring 146, summer 178, a summer night 124. Tabor hits: 0 in peace, 95 at war; 15 of 119 melody notes lowered at war. A duel, the death screen, a tavern scene (night) and a faith scene (the temple bell) are all read from the state. Live, the scheduler plays the composed piece's planned notes, in order. A duel sinks the score to 0.12 and it comes back to 1.00. A move from the north to the Evenwood fades the old piece (1.00 → 0.62 in 1.5 s) and starts the elves'. Death brings a bell and a lament ending on the tonic, then silence |
| `scorePure` | Three years played with the score ticking and the screen drawn at every step end in the same state and random stream as without. Then twenty ticks, drawings, the menu, and 10 s of the score playing: the state is unchanged, with 0 random draws |
| `scoreMenu` | The toggle starts the score (5 sources playing at gain 0.36). The slider at 20 gives gain 0.040, and both are saved. A hidden tab suspends the context and stops the scheduler; shown, it runs again. Off: 0 sources left, the context closed |
| `scoreInstruments` | 16 plucked strings (lute and harp, G2 to C6) in tune within 0.9 cents by autocorrelation. Bell and drum normalized; the thump sits near 120 Hz |
| `scoreRender` | 20 s rendered offline at full volume, for the north in spring, the desert coast in summer, the elves in autumn, the holds at war in winter, and the lament. Peaks 0.25–0.37, RMS 0.033–0.058 (−30 to −25 dBFS), no silent second after the first two, no NaN. **The WAVs are in `/tmp/ardan/score/score-*.wav` for a person to hear** |
| `scoreCpu` | See the next table |

**What it costs** (`scoreCpu`). The machine was a loaded 4-core container (load average 4 to 7), so these are upper bounds.

| Measure | Result |
| --- | --- |
| Offline render, one thread, as a share of real time | the clans at war in summer (the busiest family): 3.3–4.4% of a core, 2.8–3.2% without the room; the north in spring: 2.5–2.9% |
| Live audio thread, from a Chrome trace (`AudioOutputDevice::FireRenderCallback`) | 3.4–5.7% of a core over 8 s (the thread's own time, `tdur`; wall time on a shared CI runner read 17%) |
| Main-thread scheduler | 0.02–0.10% (33 ticks in 8 s) |
| Audio sources started | 0.7 per second |
| Buffers kept after 200 s of the Golden Plains in summer | 24 (4.7 MB) |
| One-off work | a piece composed in 0.3–0.9 ms; a harp string in 1.6–1.8 ms; a bell in 13–19 ms |

The room costs about 1% of a core. It is one mono convolution, widened by a 13 ms delay on the right. The limiter costs about 0.4%.

**Rules kept.**

- The score never touches `A.S` or `A.rand`. Its randomness comes from its own seeded PRNG (mulberry32 on an FNV hash of the place and date). `performance.now` is used only to time itself.
- No files, nothing fetched, and no `eval`. The one interpolated value in the menu goes through `UI.esc`. The settings use `data-c` handlers.
- Settings live in `UI.set` (`music`, `musicVol`), so old settings without them get the defaults: off, volume 60.
- The patch anchors on the autosave row, a string none of 58, 61, 62, 63 or 65 uses.
- No balance band should move: nothing in the engine changes.

**Limits (what needs a person).**

- **No themes.** A composer writes melodies a player remembers: a theme for Aldmark, a lament for the holds. This score cuts phrases from random motifs inside sound rules, so it is pleasant, plausible and forgettable. The frame takes any note list per family (`SC.compose` returns `{ notes: [{ t, d, k, i, g, v, L, p }] }`), so a composer's written pieces can be dropped in beside the generated ones.
- **The instruments are synthesized.** The strings and bell are good. The vielle is a filtered saw, closer to a reed organ than to gut strings under a bow. The flute is clean but has no tonguing variety. Recorded samples would do better, but the CSP forbids fetching them; they would have to be embedded.
- **Nobody has listened to it here.** The checks are numerical: tuning, peaks, loudness, note rules and the plan of each mood. Whether it is calm and period-plausible to the ear needs a person: play the WAVs in `/tmp/ardan/score/`.
- **Tuning is equal temperament,** except the isles' five-step scales. A composer might prefer just fifths for the drones, a quarter-tone hijaz, or a real slendro and pelog.
- **The land is where you live,** not where you stand. A soldier on campaign hears home with the tabor added, and travel has no road music.
- **Nothing ducks for the UI sounds.** 61's steel plays over the score sunk by the fight, but the quill and the seal play over the music at its level.
