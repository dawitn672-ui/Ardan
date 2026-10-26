# Anime portraits

**Aspect:** Visual art (design brief §7.1, "Portraits: cel-shaded anime busts"; §8 item 9) · **Kind:** a new portrait renderer in readable `anime.core.js`, one patch (the menu setting), no events

The brief asks for the portraits to be the game's strongest "anime" signal: cel-shaded busts with layered eyes, hair masses, a rim light and a realm ground, on every screen that shows a person. Until now every person went through 63-miniatures' woodcut miniature (ink line, two-tone wash, gold or lapis ground), or the release's paper doll.

**What it does.** `PORTRAIT.svg` is wrapped once more. While the setting is on (the default), every portrait in the game is drawn by `PORTRAIT2.svg(person, size, opts)` (also `UI.ANIME.svg`). That covers the side panel, the profile, people lists, events, duels, the obituary, the naming of a child, the family tree, the chain of command and the squad chips. When the setting is off, the woodcut miniatures come back (and the release's paper dolls when 63's own setting is off too). If drawing ever throws, the earlier portrait is drawn instead and `UI.ANIME.errors` counts it.

- **Sizes.** Busts (1:1) at any size, with the detail the brief gives for 20, 32, 48, 72, 88 and 120 px, and a 2:3 full figure (200 × 300) at 120 px and up. The profile is the one caller of `UI.portrait`. It gets a bust at 88 px when the window is under 1600 px wide, as the brief's 1366 layout has ("bust 88 beside the name"), and the full figure on a wide window (the 1920 rail). The obituary, duels and the profile sheet ask for 150 to 210 px and get the full figure.
- **The head** is built on the brief's proportions table: a 100 × 120 head box with the cranium a circle of radius 50. The eye line, eye width and gap, eye opening, chin, nose, mouth and figure height in heads all move with age. The keyframes are infant, child, teen, adult and old, by human-equivalent years, so an elf of 120 has a young face and a dwarf of 80 a grown one. Men have jaw corners at y 104 and a chin 18 wide; women and the young have a softer V; the old have a jowl line, a thinner mouth, larger ears and narrower eyes. Ears run from the brow to the nose. Elves add +40 up and back, half-elves half that, and orcs get a swept point.
- **Eyes** are six layers, back to front, drawn once per picture and placed twice (mirrored):
  1. the white `#f6f1ea`, with the upper lid's shadow (`--shade` at 35%);
  2. an upright iris cropped by the lids, in two tones (a hard stop, not a blend);
  3. the pupil;
  4. two catchlights, r 2.6 at the upper left and r 1.2 at the lower right, kept in the head's frame so the light is always upper left;
  5. a lash line about 3 units thick at the outer third, tapering inward, with a flick that is longer on women and elves;
  6. one short stroke for the lower lid.

  Brows are tapered strokes whose angle follows the mood and the traits stern, stoic, kind and proud.
- **Hair** comes in three groups. The game's own `hstyle` picks the back mass, one of ten: short, bob, shoulder, long, tied (a low tail, or twin tails for girls), braid, bun, topknot, shaved, or hooded. The bangs come from twelve styles: blunt, parted, side-swept left or right, spiky, curtain, wisps, swept back, messy, short, long and crest. Each style is a row of 5 to 7 fang-shaped clumps of quadratic curves, with seeded lengths, offsets and sweeps, deep notches and a thin strand in some notches. The extra is one of six: ponytail, braid, bun, pins, a feather or a band. The bangs and the extra are hashed from the id and weighted by culture: 63's table gives the dress and headwear, and a 24-row table here gives each people's favoured bangs, extras and ribbon colour. Each mass has a base colour and one shadow band: the layer under the bangs, which shows in the notches, and the back mass behind the neck, both the base multiplied by `--shade` at 40%. It also has the side away from the light in shadow, a sliver down the far side of each clump, the clumps' own lines up into the mass, and the angel ring: 3 to 5 toothed arcs at 30% of head height, base + 18 L. Black hair is lifted to a blue-black so its shadow and ring show. Greying follows age as in 63, and old men may recede or go bald.
- **Shading** puts the light at the upper left. Every part gets one hard-edged shadow (the base multiplied by `--shade` at 35%), with no gradients on skin or cloth. The terminators are the outsides of ellipses, so they curve round the form. Occlusion adds a second shadow under the bangs (their own shape cast onto the forehead), under the chin, and inside a hood.
- **Line.** Lines are `--line-ink` `#1b1730`, never black. The outer silhouette is grown from the figure's own shape, so it is about twice the inner line. Lines inside skin are the skin darkened 55% (iro-trace), and hair lines are the hair darkened. Line weights are set in pixels, so small pictures get heavier lines. There is no wobble at bust sizes. The full figure keeps a fixed-seed wobble.
- **Rim light.** The right edge of the silhouette gets a band of the ground's light colour: warm `#ffe7b0` by day (the light theme), and cool `#a8c8ff` at night (the dark theme) and in sacred and royal frames. A faint glow of that light sits behind the head.
- **Frame and ground.** The frame is square with the cut corner (top left and bottom right) and `--r-s` on the other two. The ground is a bokashi from the realm's tint (`UI.realmInk`'s, from 91-look, when it is built) down to `--surface`, with the house charge large and faint (12%) behind the head. The frame line depends on who is drawn:
  - most people: 1.5 px `--line-strong`;
  - rulers: 2 px `--r-legendary`, with a crown badge at the top right;
  - nobles: 2 px `--accent`;
  - the dead: `--ink-3`, an ink-wash ground, every colour of the figure at 20% chroma, the eyes closed and a small cross.
- **Expressions** come from the state at draw time:
  - neutral, smile, grin (closed happy eyes, open mouth), frown, sad, angry (lids slanted, mouth open on the teeth) and surprised;
  - eyes closed for the dead and for sleeping babies;
  - the romance blush (three short diagonal strokes).

  The person an event is about wears the event's tone (love and weddings smile and blush, funerals are sad, quarrels angry, gifts grin, omens surprise). The player's own face follows 35-moods' mood, others' faces their opinion of the player and their happiness, and the badly hurt look pained. Every head is tilted a few degrees (seeded, leaning with the mood).
- **Shape language by people** (`GD.RACES`: human, elf, half-elf, dwarf, orc, half-orc, giant):
  - elves: long points, a narrower jaw, lifted eye corners, often unusual eye colours;
  - half-elves: shorter points;
  - dwarves: square jaws, a bulbous nose with nostrils, a broad beard mass 34 units longer with gold rings, braids;
  - orcs: heavy wedges, tusks, a brow ridge over each eye, a flat nose with nostrils, amber eyes;
  - half-orcs: small tusks;
  - giants: big shoulders and a small head, heavy brows.
- **Dress.** Each people's cut follows 63's culture table: a tunic over a laced undershirt, a robe or kaftan crossed at the front, or a drape over one shoulder. Headwear also follows it: hoods, veils, kerchiefs, turbans and wraps, caps, fur hats and cones, fillets, leaf wreaths and feathers. Commoners wear a cel palette hashed from their id, kept near the release's colour and pulled toward their people's dye; rank wears the realm and house colours. Rank shows as crowns, circlets, an ermine or fur mantle, a gold collar with a jewel, a priest's stole and cowl, an artisan's apron, rags with patches, and an officer's sash. Every armour look is drawn (mail and scale as patterns, plate with pauldrons and highlights, leather with stitching), with tabards bearing the house's charge. Closed helms come off: a mail coif in the bust, the helm at the feet in the full figure.
- **The full figure** stands 6.5 heads tall (an infant 3, a child 4.5, a teen 6, the old 6.3; dwarves 4.7, elves 7, giants 8) on a lit floor disc. Its pose comes from the id and the role:
  - standing;
  - a hand on the hip;
  - arms crossed;
  - both hands on a sword planted point down;
  - holding a staff, spear, sceptre or walking stick.

  Weapons hang from the hand or sit at the hip. A shield is on the arm and a bow on the back. A newborn is swaddled on a cushion. A lost hand is a bound stump.
- **Wounds** show: a stitched scar over the eye, an eye patch on a cord, a kinked nose with a plaster, a notched ear (never under a hood or hidden by long hair), a burn, a brand, a birthmark and freckles. In the full figure a lost hand shows and a limp splays one leg.
- **The setting** is "Anime portraits (off: woodcut miniatures)" in the menu (`UI.set.anime`, saved with the other settings), next to 63's setting and the theme (patch `AP-MENU`).

**Measured by.** `test.mjs`, on the full build (`node tools/build.mjs --out=…`). Sheets of 40 people (every people, both sexes, child to old, rulers, nobles, soldiers, the dead) at 88 px, 32 px (in colour and as black silhouettes) and as full figures were rendered and critiqued over six rounds; see "Limits".

| Test | Result |
| --- | --- |
| `apDeterministic` | 1200 of 1200 drawings identical when drawn again (88 and 32 px busts and the 176 px full figure of 400 people in a world), 1200 identical through the cache. 400 distinct 88 px busts for 400 people, with names left out of the comparison. Poses: stand 144, hip 115, crossed 87, staff 51, hilt 2, swaddled 1 |
| `apPure` | Drawing the life, people, realm and legacy tabs, the profile and a person's page (21 anime portraits) leaves `A.S` and `A.rngState` unchanged; 0 fallbacks |
| `apBudget` | 107 people (every people × sex × age, 13 hair styles, rulers, armoured knights and dwarves, the scarred, the dead). Bust KB average / largest: 20 px 3.0/4.2, 32 px 5.5/7.4, 48 px 6.2/7.8, 72 px 6.2/7.8, 88 px 6.3/7.8, 120 px 6.9/8.0. Full figure 9.7/13.2. None over 8 KB or 18 KB. Uncached build 0.2 to 0.4 ms per portrait (best of three batches); through the cache 0.005 ms |
| `apEscaped` | Markup in a name, an id, a skin, hair, realm and house colour, a charge, a culture, gear and a wound reaches no SVG. No raw tags, no `on*` attributes, no outside `href`, and every `fill`, `stroke`, `stop-color` and `flood-color` is a checked colour or a local reference |
| `apEveryPeople` | 84 people (7 peoples × 2 sexes × 6 ages) at 200 (full), 88, 32 and 20 px, and the special cast: all valid SVG, 0 fallbacks |
| `apToggle` | The setting is in the menu and on by default; off shows the woodcut miniatures; on again. A ruler gets the gold frame and crown badge, the dead the `--ink-3` frame |
| `apAxe` | 0 axe violations (WCAG 2.1 AA) on the people tab, the profile and a person's page, with 11 anime portraits on them |

63-miniatures' own tests also run against this renderer and pass: `miniEveryRace`, `miniDeterministic`, `miniAgeWoundsChildren` (7 of 7 wounds show; figure heights newborn 141, 6 years 178, 14 years 245, grown 261, dwarf 195, giant 272), `miniPure`, `miniToggle` and `miniAxe`. So do the replay suites (`renderRng`, `replayWithRender`, `journalReplay`), 27-accessibility and 71-phone, except `phoneTasks`, which fails the same way without this feature ("check the market" at ×1.65). `lint-events` and `lint-choices` report nothing; the feature has no events.

**Rules kept.**
- Pure: no `A.rand`, no `Math.random`, no state change. Every choice is an FNV hash of the id and a key. The expression reads the state (mood, opinion, the event in view) and never writes it. 35-moods' `mood()` only reads.
- Every colour from the state is checked as a hex colour before use. Gear, culture, style and wound keys are only looked up, never printed. The house charge is the release's own path, checked against a path-only pattern. The one text, the `aria-label` (name and age, on portraits 60 px and up; smaller ones are `aria-hidden` next to the name they illustrate), goes through `UI.esc`.
- Ids are fixed-content or content-keyed: the same id always has the same content, so two portraits on a page can't disagree. That covers the shadow clips, patterns and filters, and the paths shared inside one picture (the face, the cap of hair, the eye), which are keyed by a hash of their content.
- The cache key holds the id, the age in years, the wounds, the gear, the look, the rank, the mood inputs, the event in view, the theme and the size. A redrawn list is a lookup.
- No new state. The setting lives in `UI.set`.

**Limits.**
- **Front view only.** Faces look straight out. A seeded tilt and the game's own eye shape, jaw, brow, nose and mouth vary them, but there is no three-quarter turn and the eyes never look aside. The face template (one eye, one nose tick, one mouth stroke) is shared by everyone, so faces are more alike than a hand-drawn cast.
- **The full figure is the weak half.** It stands well and its rank, dress, arms and wounds read. But it is still built from tubes and ellipses: hands are mittens, there are no fingers, and the poses are a closed set of five (no seated ruler, no mount, no action pose). At 6.5 heads the face is about 34 px wide at 200 px, so it gets the 48 px level of detail. The figure fills less than half the frame's width.
- **Procedural hair.** Twelve bang styles of fang-shaped clumps read well at 32 to 120 px. Close up (240 px and more), the cap of short hair still looks a little like a helmet, and curly hair is only a bumpier silhouette.
- **Silhouettes at 32 px.** Peoples, long hair, twin tails, ears, mohawks, helms and a giant's shoulders read in black. Short-haired humans look alike, and a dwarf's beard merges into the body (it reads as breadth, not as a beard).
- **The budget has a fallback.** A rich character (a ruler in ermine with braids, a dwarf in plate) can come out over 8 KB at full detail. It is then drawn again without clump lines, thin strands and folds, and if needed one level of detail lower, then at the 32 px level. It fits, at the cost of a little detail. In three real worlds (1,200 people) at 88 px, 92% draw at full detail, 7% need the first step, 4 people the second and 9 (0.75%, royals with every piece of regalia) the last. A world's busts average 7.0 KB. `UI.ANIME.lastLite` says how far the last picture stepped down, and `UI.ANIME.buildAt(p, size, opts, level)` draws one level (for sheets).
- **63's tests now exercise this renderer.** It is on by default and keeps 63's conventions (`class="portrait mini"`, `data-pose`, a `.mn-fig` group), so `miniEveryRace`, `miniDeterministic`, `miniAgeWoundsChildren` and `miniPure` run against it. The woodcut path is checked here by `apToggle`.
- **Expressions read the state.** The person an event is about shows its tone by matching the event's id and title against a few word lists. An event with an unusual name gets the opinion-and-mood face instead.
- **Beasts** (`PORTRAIT.beast`) and **coats of arms** (`PORTRAIT.coat`) are still the release's.
