# Design research for the Ardan redesign

*Oct 26. Research for `docs/design/brief.md`. Read with `docs/design/critique.md` (what is wrong today) and `docs/art/style-guide.md` (the current art direction).*

The owner asked for "some of the greatest visual productions possible", anime-like, for players of 13 to 23, and for a screen that does not need so much scrolling. This file collects what the masters of design and of game interfaces teach, principle by principle, and says what each one means for Ardan.

**How the sources were gathered.** Web search only. This environment's network policy blocked direct page fetches from most sites (nngroup.com, gamespot.com, paradoxinteractive.com, wikipedia.org and others), so the points below rest on search-result summaries of those pages. Where a claim comes from my own knowledge rather than a cited page, it says **(general knowledge)**. Before quoting any source in public, open the page and check the wording.

**What I measured first** (the current `index.html`, Playwright at 1366×768 and 390×844, the screens from `features/71-phone/screens.mjs`):

| Screen | 1366×768: scrolling pane | 390×844: page |
| --- | --- | --- |
| Life tab | 2,749 px in a 559 px pane: **4.9 screens** | **5.1 screens** |
| Profile column (left) | 1,275 px in 674 px: 1.9 screens | (in the page) |
| Holdings | 5,622 px in 613 px: **9.2 screens** | |
| Path & War | 3.7 screens | |
| Realm | 3.5 screens | 3.7 screens |
| An event | modal fits | **5.2 screens** |
| Character creation | page 1.8 screens | 3.8 screens |

The body text is 17 px. The Life tab holds about 30 activity cards in 13 groups, each card 58 to 93 px tall with a two-line description. That list alone is about 1,900 px. Font metrics below were measured from the real woff2 files in Chromium.

---

## Part 1. Foundations of design

### 1.1 Less, but better (Dieter Rams)

Rams wrote ten principles for good design in the late 1970s: it is innovative, useful, aesthetic, understandable, unobtrusive, honest, long-lasting, thorough down to the last detail, environmentally friendly, and "as little design as possible". He summed them up as "Less, but better" (*Weniger, aber besser*, the title of his 1995 book).

- [Vitsœ: Good design](https://www.vitsoe.com/us/about/good-design)
- [Making Good: Dieter Rams' principles](https://makinggood.ac.nz/dieter-rams-principles-of-good-design/)
- [CRM: Dieter Rams' 10 principles](https://crm.org/articles/dieter-rams-10-principles-of-good-design)

**What it means for Ardan.**

- **Useful and understandable first.** Every element on the Life screen should answer "what is happening to me, and what can I do now". The 30 activity descriptions are always visible. They are useful the first time and noise the fiftieth, so they belong in a tooltip.
- **Honest.** The odds badges must be the odds the engine rolls. 24-honest-odds already does this; the redesign must not round them into vaguer words.
- **Thorough.** Disabled buttons give their reason. Every number has a unit. Every icon has a label. Empty states say what to do.
- **As little design as possible** means one card level, not cards inside cards inside columns. The critique counted three nested frames around What now.

### 1.2 Restraint and a small set of tools (Massimo Vignelli)

Vignelli worked with very few typefaces: Garamond, Bodoni, Century Expanded and Helvetica in a 1991 show, and he said he could work with about a dozen in all. His point: "it is not the type but what you do with it that counts." *The Vignelli Canon* (Lars Müller) argues for a grid, a few sizes, and discipline in their use.

- [Fonts In Use: Vignelli's A Few Basic Typefaces](https://fontsinuse.com/uses/14164/massimo-vignelli-s-a-few-basic-typefaces)
- [UX Collective: The Vignelli Canon](https://uxdesign.cc/the-vignelli-canon-a-design-classic-from-the-last-of-the-modernists-74d6e7dc0169)
- [SEGD: The Vignelli Canon](https://segd.org/?p=7876)

**What it means for Ardan.** Three text families, used by role, never mixed at random. Seven type sizes, not the eleven the release's tokens allow. Two weights per family in normal use. Colour is a tool with a meaning (a stat, a tier, a danger), not decoration.

### 1.3 The grid (Josef Müller-Brockmann)

*Grid Systems in Graphic Design* (Niggli, 1981) gives grids of 8 to 32 fields for organizing information "in a meaningful, logical, and consistent way". It is the Swiss method: a module repeated and combined, with every element aligned to it.

- [Thames & Hudson: Grid Systems in Graphic Design](https://thamesandhudson.com.au/?p=93182)
- [AbeBooks listing with publication details](https://www.abebooks.com/first-edition/Grid-Systems-Graphic-Design-Josef-Muller-Brockmann/32247472605/bd)

**What it means for Ardan.** A 4 px base unit, with every height a multiple of 4. A row height of 32 px for controls and 24 px for data rows, so a column of stats, a list of people and a list of actions line up across panels. The three desktop columns get fixed widths at each breakpoint, so panels never reflow when the content changes.

### 1.4 Asymmetry with order (Jan Tschichold)

In *Die neue Typographie* (1928) Tschichold argued that asymmetry is "the rhythmic expression of functional design", and that it is more optically effective than centred symmetry. He insisted it "must not degenerate into unrest or chaos". He also warned, later, that what works on a poster is exhausting in a long text, and returned to classical setting for Penguin books.

- [BU Research: The New New Typography](https://www.bu.edu/research/magazine/2011/04-3-typography.html)
- [MoMA: The New Typography](https://production-gcp.moma.org/calendar/exhibitions/1013)
- [Tschichold, The New Typography (excerpt, PDF)](https://openlab.citytech.cuny.edu/langecomd3504fa2019/files/2018/10/Tschichold_NewTypo.pdf)

**What it means for Ardan.** Two modes. The **poster mode** (event cut-ins, battle openings, a new year) can use bold diagonals, big display type and asymmetric layout. The **book mode** (the story log, event text, the Chronicle) is calm: flush left, ragged right, a measure of about 65 characters, no angled text. The release centres many headings and portraits. Flush-left headings and names, aligned to the same edge as the text below, read faster.

### 1.5 Colour is relative (Josef Albers, Johannes Itten)

Albers' *Interaction of Color* (1963) teaches that a colour changes with its neighbours: the same grey looks warm on blue and cool on orange. Itten's *The Art of Colour* (1961) lists seven contrasts: hue, light-dark, cold-warm, complementary, simultaneous, saturation and extension (how much area each colour covers).

- [MIT List: Josef Albers, Interaction of Color](https://listart.mit.edu/node/1124)
- [UNSW Library: Interaction of Color](https://www.library.unsw.edu.au/about-unsw-library/exhibitions-program/experiential-learning-program/interaction-of-color)
- [Johannes Itten (Wikipedia)](https://en.wikipedia.org/wiki/Johannes_Itten)
- [Onlineprinters: Itten and the number 7](https://onlineprinters.ie/magazine/?p=7839)

**What it means for Ardan.**

- **Light-dark contrast carries meaning; hue carries category.** Text and controls are separated by lightness (checked at WCAG AA). Hue says which stat, which tier, which realm.
- **Contrast of extension.** A small area of a strong colour balances a large field of a quiet one. The ground is a deep, quiet indigo. Gold and vermilion are small: a button, a badge, a seal. This is also the style guide's "rule of one".
- **Cold-warm contrast** is the anime sky: a cool blue shadow against a warm lit edge. In the UI, cool surfaces and warm accents give the same depth.
- **Simultaneous contrast** is why realm colours cannot be used raw for text: a mid-red realm reads differently on indigo and on cream. The brief derives a text-safe realm colour per theme.

### 1.6 Data-ink and small multiples (Edward Tufte)

Tufte: make most of the ink carry data, and erase non-data ink and redundant data ink. Chartjunk (heavy grids, fake 3D, decoration) hinders understanding. Small multiples are "postage-stamp" graphics repeated by category so the eye compares them without turning a page. Sparklines are "small, intense, simple, word-sized graphics" set inside text.

- [IEEE Spectrum: Tufteisms](https://spectrum.ieee.org/tufteisms)
- [Georgia Tech course notes on Tufte (PDF)](https://faculty.cc.gatech.edu/~stasko/4460/Notes/tufte.pdf)
- [Lessons from Edward Tufte](https://www.antoinebuteau.com/lessons-from-edward-tufte/)

**What it means for Ardan.**

- **Stat bars lose their frames.** Today each bar has a border, a gradient fill and a separate number column. A bar can be a 4 to 6 px line with its number at the end. A potential tick is one 2 px mark.
- **Small multiples for people and realms.** The people list and the realm list should be rows of identical small cells (portrait, name, a relation bar, three numbers), so a glance compares twenty people. The release gives each person a large card.
- **Sparklines** for coin, health and realm strength over the last ten years, 60×16 px, beside the number. The game already records history in the chronicle.
- **No gradients on data.** The release's stat fill is a gold gradient. A flat fill in the stat's colour is clearer, and gradients are kept for art (skies, light).

### 1.7 Signifiers, feedback and mapping (Don Norman)

Norman's *The Design of Everyday Things* (1988; revised 2013) separates an **affordance** (what an action allows) from a **signifier** (the visible cue that says where and how to act). He introduced "signifier" because designers were using "affordance" to mean "how the user knows where to click". His other core concepts are constraints, mappings, feedback and the conceptual model; every action needs immediate, visible feedback.

- [UX Collective: book notes on The Design of Everyday Things](https://uxdesign.cc/book-notes-the-design-of-everyday-things-by-don-norman-debe462ffc04)
- [Signifier (notes)](https://notes.dsebastien.net/30+Areas/33+Permanent+notes/33.02+Content/Signifier)
- [Université Paris-Saclay: design principles slides (PDF)](https://www.lri.fr/~mbl/FundHCI/slides/FundHCI1-7-DesignPrinciples.pdf)

**What it means for Ardan.**

- **One look for "you can press this".** Every button has a visible boundary (fill or a 3:1 border) and a hover change. Text that is not clickable never uses the button look. Glossary words keep the dotted underline that 59-tooltips gives them.
- **Feedback for every choice.** After a choice: the button presses in (80 ms), the result appears in place, the changed numbers flash their delta (+2 Strength, in the stat's colour) and a short toast lists the changes. Today the player often has to compare numbers before and after.
- **Mapping.** The six stats sit in the same order and colours everywhere: the profile, checks on choices, tooltips, level-ups.
- **The conceptual model.** The screen should show the three layers of the game the same way every time: you (left), what happens (centre), what you can do (right).

### 1.8 Gestalt grouping

Nearby items read as related (proximity), and proximity can overpower similar colour or shape. A boundary around items (common region) is stronger still, and is the tool when spacing alone cannot separate groups. Items that share colour or shape read as one kind (similarity).

- [NN/g: Proximity](https://www.nngroup.com/articles/gestalt-proximity/)
- [NN/g: Common Region](https://www.nngroup.com/articles/common-region/)
- [Laws of UX: Common Region](https://lawsofux.com/law-of-common-region/index.md)
- [IxDF: The Gestalt Principles](https://ixdf.org/literature/topics/gestalt-principles)

**What it means for Ardan.** The critique found that every panel is the same brown card with the same gold rule, so similarity groups everything as one thing. The fix:

- **Proximity first.** 4 px inside a group, 12 px between groups, 24 px between sections.
- **Common region once.** One card per panel section, never nested.
- **Similarity on purpose.** All actions share one tile shape; all people share one row shape; all stats share one colour per stat.

### 1.9 Fitts's law

The time to hit a target grows with its distance and shrinks with its size, on a log scale, so doubling distance does not double time. For rectangles, the smaller dimension stands in for width. Size matters more on touch screens, where the finger hides the target.

- [NN/g: Fitts's Law and Its Applications in UX](https://nngroup.com/articles/fitts-law)
- [NN/g video: Fitts's law for links and buttons](https://www.nngroup.com/videos/fittss-law-links-buttons/)
- [Fitts's law (Wikipedia)](https://en.wikipedia.org/wiki/Fitts%27s_law)
- [W3C: What's New in WCAG 2.2 (2.5.8 Target Size, 24×24 CSS px)](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)

**What it means for Ardan.**

- **Play and the speed control stay at top centre,** near the centre column where the eye already is.
- **Event choices are full-width rows of at least 44 px,** with the number keys 1 to 6 as the fastest target of all.
- **Desktop targets are at least 28 px tall, phone targets at least 44 px.** WCAG 2.2's minimum is 24×24, which 27-accessibility already enforces.
- **The most common action of each screen goes in the corner of the thumb on phones,** the bottom bar.

### 1.10 Progressive disclosure and accordions (Nielsen Norman Group)

NN/g: progressive disclosure "defers advanced or rarely used features to a secondary screen", which makes an application easier to learn and less error-prone. It is credited to Jakob Nielsen (1995). On accordions, NN/g's desktop guidance is that they shorten long pages and reduce scrolling, but they hide content and raise interaction cost. Use them where users will not need the content under several sections at once, and avoid them when users need most of the content or read it straight through. Tabs suit a few long sections; accordions suit many short ones.

- [NN/g video: Progressive Disclosure](https://www.nngroup.com/videos/progressive-disclosure/)
- [NN/g video: Tabs vs. Accordions](https://www.nngroup.com/videos/tabs-vs-accordions/)
- [NN/g video: Accordions, 5 scenarios to avoid them](https://www.nngroup.com/videos/avoid-accordions/)
- [The Decision Lab: Progressive Disclosure](https://thedecisionlab.com/reference-guide/design/progressive-disclosure)

**What it means for Ardan.**

- **The Life tab is many short sections:** What now, Your days, How you are, and 13 groups of activities. That is the accordion case. Each section header carries a one-line summary ("Your days · Push for advancement · steady"), so a collapsed section still informs.
- **Layer 1, always visible:** what happens now, your vitals, your stats, the three suggested actions, the action names.
- **Layer 2, one click:** descriptions, breakdowns, the full proficiency list.
- **Layer 3, a tooltip inside a tooltip:** the formula behind a number (59-tooltips).
- **Remember each section's open state.** Do not collapse what the player opened; NN/g's cost of hiding content is paid again on every visit otherwise.

---

## Part 2. Game interface masters

### 2.1 Persona 5 and Persona 3 Reload (Atlus; UI by Masayoshi Sutoh, characters by Shigenori Soejima)

- **The UI as entertainment.** Sutoh first saw the interface as a way to lay out information. On Persona 3 he began treating it as "graphical entertainment", taking ideas from websites. Persona 5's type drew on the ransom-note lettering of Sex Pistols covers and on the bombastic graphics of televised sports.
- **One theme colour per game,** matched by the interface: teal for 3, yellow for 4, crimson for 5. Sutoh called matching the interface to each game's main colour his biggest challenge. Soejima chose red for 5 because it is "a very passionate colour".
- **Persona 3 Reload** (art director Tomohiro Kumagai) built its interface on the original blue and on flowing water and bubbles, "the sea of the protagonist's mind". Its colours are cold where Persona 5's are warm. The main menu shows the hero sinking into water; options are revealed by cards flipping and faces reflected in glass shards.
- **Atlus gives UI to senior designers.** Director Katsura Hashino says most Japanese studios hand UI to new staff and that this is a mistake. Every menu gets its own design, which he calls slow and "really annoying" to make.
- **The cost of style.** Hashino said Persona 5's angular menus were at first "impossible to read" and took many rounds to fix. Sakurai's Famitsu column calls the UI unconventionally cluttered, and says you sometimes cannot quickly do what you want until you learn it. A review of Persona 5 Tactica credits its rational sans-serif type with making menus easier to read than Persona 5's. A Persona 5 study notes that the selected item's blue stands out because it is the one cool colour against red, black and white.
- **Timing.** The Persona 5 day-change animation runs about 12 seconds: 6 s on the current date, 2 s for the change, 4 s on the new date.

Sources:

- [SEGAbits: Famitsu interview with Persona 5 art and audio leads](https://segabits.com/?p=54918)
- [GameSpot: Persona 5's menus continue to look stunning](https://www.gamespot.com/articles/persona-5s-menus-continue-to-look-stunning/1100-6439532/)
- [Push Square: Persona 3 Reload's "sexy UI"](https://www.pushsquare.com/news/2024/02/persona-3-reloads-sexy-ui-result-of-retaining-key-staff-says-atlus)
- [Automaton: Persona 3 Reload's viral UI](https://automaton-media.com/en/news/20240207-26873/)
- [One More Game: Persona 3 Reload Switch 2 interview](https://onemoregame.ph/2025/10/persona-3-reload-switch-2-interview/)
- [Kotaku: Metaphor and Persona menus](https://kotaku.com/-metaphor-refantazio-persona-5-menu-ui-hashino-1851667088)
- [Push Square: making Persona's menus is "really annoying"](https://www.pushsquare.com/news/2024/10/making-metaphor-refantazio-personas-immaculate-menus-is-really-annoying-says-director)
- [Inverse: Persona 5 Tactica's interface](https://inverse.com/gaming/persona-5-tactica-user-interface)
- [Mechanics of Magic: Visual design of Persona 5](https://mechanicsofmagic.com/2022/04/23/visual-design-of-games-persona-5/)
- [Source Gaming: Sakurai's Famitsu column vol. 515](https://sourcegaming.info/2016/11/24/the-aims-of-ui-sakurais-famitsu-column-vol-515/)
- [itch.io: Making UI come to life, a study of Persona 5](https://itch.io/blog/533534/making-ui-come-to-life-study-of-persona-5)
- [RPG Site: Q&A with Shigenori Soejima](https://www.rpgsite.net/interview/4887-persona-5-q-a-with-character-designer-shigenori-soejima)
- [Game Informer: A glimpse into the mind of Persona's art director](https://gameinformer.com/b/features/archive/2014/07/18/a-glimpse-into-the-mind-of-personas-art-director)

**What it means for Ardan.**

- **Give Ardan a theme colour and hold it everywhere.** Proposed: night indigo (Prussian blue) with gold, and vermilion as the one hot accent.
- **Use the Persona energy for moments, not for reading.** Diagonal panels, big display type and cut-ins are for events opening, a choice landing, a battle, a promotion, a new year. Lists, numbers and prose stay level and plain, because Persona's own team found angled text hard to read.
- **Make the selected item the one off-palette colour.** The focus and selection state is the brightest thing on screen.
- **Treat the interface as part of the art,** with its own budget, not something left until last.

### 2.2 Hades and Hades II (Supergiant Games; art director Jen Zee)

Zee's vivid colour and painted style are widely praised. In an interview about *Transistor* she named John William Waterhouse and Gustav Klimt as sources for a palette that is "muted yet vibrant". Supergiant calls itself "first and foremost a game design-led team". Much published commentary on Hades' silhouettes is unsourced, so the points below that are not cited are **(general knowledge)**:

- heavy black ink shapes with a few saturated hues per character;
- strong rim light in the character's own colour;
- each god has one signature colour carried by their boons, portraits and UI frames;
- the boon choice screen shows three options with an icon, a rarity border (common, rare, epic, heroic, legendary) and one or two lines of text.

Sources:

- [Jen Zee (Wikipedia)](https://en.wikipedia.org/wiki/Jen_Zee)
- [Nerdy But Flirty: interview with Jen Zee (2013)](https://nerdybutflirty.com/2013/07/11/unicorn-sparkle-an-interview-with-jen-zee-of-supergiant-games/)
- [MCV: Jen Zee interview](https://mcvuk.com/?p=216051)
- [Creative Bloq: How we made the Hades II artwork](https://creativebloq.com/art/digital-art/hades-ii-artwork)

**What it means for Ardan.**

- **Signature colour per realm and per house,** carried by banners, portrait grounds and frames. The data already exists.
- **Rarity borders on choices** that are rare: a once-in-a-life event, a masterwork, a legendary beast.
- **Dark ink plus a few saturated hues plus rim light** can all be built procedurally. That is the portrait recipe in the brief.

### 2.3 Genshin Impact and Honkai: Star Rail (HoYoverse)

The two games share a menu layout: main menu, settings, character, shop. A trade outlet suggests the likeness helps Genshin players adapt. HoYoverse revises its interfaces often to remove friction. An independent UX review of Star Rail on mobile names nested menus, frequent pop-ups and crowded screens as its friction points. A heuristic study (Saputra and Andelina) tests the HSR interface against Nielsen's heuristics. Five-star and four-star characters mark rarity; the stars mean how hard a character is to get, not how strong it is.

From playing them **(general knowledge)**:

- light glassy panels over a full-bleed painted background;
- a large character render on one side and stats in a narrow column on the other;
- grey, green, blue, purple and gold item frames for 1 to 5 stars;
- a thin sans-serif for UI text, with numbers set larger than their labels.

Sources:

- [VCGamers: Star Rail's UI and Genshin's](https://www.vcgamers.com/news/ko/?p=81852)
- [UX Collective: How these massive games keep players locked in](https://uxdesign.cc/how-these-massive-games-keep-players-locked-in-da40d5eb3857)
- [Analysis of Interface Design in Honkai Star Rail (usability heuristics)](https://ojs.unimal.ac.id/index.php/game/article/view/19957)
- [Independent Honkai Star Rail mobile UX analysis](https://app.notion.com/p/Independent-Honkai-Star-Rail-Mobile-UX-Analysis-21bba50a6ad4807aa6a5e286d42bd510)
- [Mobalytics: Genshin characters and rarities](https://mobalytics.gg/blog/genshin-impact/all-genshin-impact-characters-rarities-attributes-and-how-to-get-them/)

**What it means for Ardan.** Ardan's audience reads that grey, green, blue, purple and gold ladder without being taught. Use it for gear quality, masterworks, fighting tiers and rare events, and never for anything else. The lesson from the HSR review: count pop-ups. A choice result should land in place, not in another modal.

### 2.4 Octopath Traveler (Square Enix, "HD-2D")

HD-2D sets pixel-art sprites in 3D scenes with dynamic light, depth of field and tilt-shift blur, which gives a diorama look. Point lights cast character shadows, and post-processing plus particles add depth.

- [HD-2D (Wikipedia)](https://en.wikipedia.org/wiki/HD-2D)
- [Unreal Engine: Octopath Traveler II builds a bigger, bolder world](https://www.unrealengine.com/en-us/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style)
- [TechRaptor: HD-2D trademark](https://techraptor.net/gaming/news/trademark-for-octopath-travelers-hd-2d-filed-by-square-enix)

**What it means for Ardan.** The diorama effect comes cheap in SVG. Event vignettes in three or four flat layers, the far layers blurred a little (`feGaussianBlur` 1 to 2 px) and hazed toward the sky colour, and the near layer sharp and dark. A soft light glow over a lit window or a fire. It reads as depth without any 3D.

### 2.5 Disco Elysium (ZA/UM)

Skill-check options carry the skill's name in brackets, coloured by the skill's group. Hovering shows the chance of success as a percentage. White checks can be retried after the skill improves; red checks are one try only. Dialogue sits in one tall column on the right of the screen. Portraits are painted in an expressive, watercolour-like style.

- [The Sixth Axis: Disco Elysium Final Cut review](https://www.thesixthaxis.com/2021/04/14/disco-elysium-the-final-cut-review-ps5-ps4-stadia-pc/)
- [Can I Play That: Disco Elysium](https://caniplaythat.com/2020/07/27/indie-spotlight-disco-elysium/)
- [RPGamer: Disco Elysium review](https://rpgamer.com/review/disco-elysium-review/)
- [Critical Play case study: dialogue UI](https://tommartin.myblog.arts.ac.uk/?p=168)

**What it means for Ardan.** This is the model for event choices. A check choice shows its stat in the stat's colour (`[STR 34]`), the odds as a number, and the band word ("risky"). The engine already gives the bands: likely 75% and up, even odds 50 to 74, risky 30 to 49, long odds under 30. A one-shot choice could carry a red edge, like a red check. The tall reading column also argues for keeping the story log as a narrow column of about 65 characters.

### 2.6 Darkest Dungeon (Red Hook; Chris Bourassa)

Bourassa used no "dead grey" or black anywhere but in the inks, and kept the palette warm. Even cool colours are slightly yellowed, like old parchment. He wanted a melancholic, lonely mood, plus "the tiniest bit of cuteness" so it would not feel oppressive. The style is hand-drawn crowquill, shaped by Mike Mignola's simple, dark comics, and it had to be something one artist could make alone.

- [GameSpot: The gothic sensibilities of Darkest Dungeon](https://www.gamespot.com:443/articles/the-gothic-sensibilities-of-darkest-dungeon/1100-6424880/)
- [Blogcritics: MIGS 2018 interview with Chris Bourassa](https://blogcritics.org/montreal-international-game-summit-2018-interview-with-chris-bourassa-creative-director-red-hook-studios/)
- [Game Developer: Road to the IGF, Darkest Dungeon](https://www.gamedeveloper.com/audio/road-to-the-igf-red-hook-studios-i-darkest-dungeon-i-)

**What it means for Ardan.**

- **Black only in the line.** Shadows are coloured, never grey. A cool shadow on a warm subject, a warm lit edge on a cool one.
- **One rule ties every surface together.** Bourassa's is that everything is a little warm. Ardan's can be that every surface leans indigo and every light leans gold.
- **A style one generator can make.** Ardan has no artist, so the look must come from a small set of rules applied everywhere. A huge parts library would dilute it.

### 2.7 Slay the Spire

Enemy intents are distinct icons with a number when it matters, so the state reads at a glance. Players report that once they learned the icons, the game state was "really easy to understand at a glance". Other designers note that text-heavy status effects are hard to read in the short time they show, and that an icon's metaphor can mislead (a heart read as health, not turns).

- [Untapped: How to read enemy intent in Slay the Spire 2](https://sts2.untapped.gg/guides/how-to-read-enemy-intent)
- [itch.io feedback thread on readability](https://itch.io/t/5090607/feedback-on-the-game)

**What it means for Ardan.** Give each of the six stats, each need, each resource (coin, initiative, renown) and each action group one icon. Draw them as 16 px inline SVG, test each on a stranger, and always show the label beside them on first use and in tooltips.

### 2.8 Into the Breach (Subset Games)

Designer Jay Ma: "we would sacrifice cool ideas for the sake of clarity every time." The interface was called one of the game's greatest strengths and one of its hardest problems. Enemies telegraph their attacks a turn ahead, so the player plans against a known future. A review: the clean designs give "a crystal-clear view of the battlefield that can be digested in an instant".

- [Into the Breach (Wikipedia)](https://en.wikipedia.org/wiki/Into_the_Breach)
- [GDC Vault: Into the Breach design postmortem (Matthew Davis, 2019)](https://gdcvault.com/play/1025772/-Into-the-Breach-Design)
- [Repost of Rock Paper Shotgun's interview](https://reads.mhlakhani.com/posts/582127219_10156233399322220)
- [WorthPlaying review](https://www.worthplaying.com/article/2018/3/29/reviews/107991-pc-review-into-the-breach/)

**What it means for Ardan.** Telegraph the future in the UI:

- A choice shows what it costs and what it risks before you press it: initiative, coin, the stat checked, the odds.
- The war map shows where armies will move next month, as arrows.
- A scheduled event (an `A.schedule` callback) can show as a faint mark on the year's timeline.

When style and clarity conflict, clarity wins, as Ma says.

### 2.9 Crusader Kings III (Paradox)

CK3 introduced nested tooltips: hold a tooltip, then hover a highlighted word inside it to open another, like hypertext. The goal is to keep the relevant information "one mouse move away" wherever highlighted text appears. Paradox carried the system into Victoria 3 and Europa Universalis V. CK3 also paired its tooltips with a guided tutorial and later mini-tutorials.

- [Paradox: EU5 Tinto Talks #77 (tooltips based on CK3's)](https://admin-forum.paradoxplaza.com/forum/developer-diary/tinto-talks-77-20th-of-august-2025.1856053)
- [PCGamesN: Victoria 3's nested tooltip system](https://www.pcgamesn.com/victoria-3/nested-tooltip-system)
- [GamingOnLinux: CK3 tutorials and tooltips](https://www.gamingonlinux.com/articles/16333/)
- [Paradox: CK3 console dev diary #3, UI/UX and controls](https://www.paradoxinteractive.com/games/crusader-kings-iii/news/ck3-console-dev-diary-3-uiux-and-controls)
- [Obsidian forum: nested popovers, describing CK3](https://forum.obsidian.md/t/nested-popovers/573)

**What it means for Ardan.** 59-tooltips already gives Ardan CK3-style nesting. That is what makes the dense layout safe: a stat can show only "34" because the breakdown is one hover away. The redesign gives tooltips one consistent look and a "pinned" state with a visible edge, and colours the trigger words the same way everywhere.

### 2.10 Hollow Knight and Ori

- **Hollow Knight** (Team Cherry; art and animation by Ari Gibson) is hand-drawn with a muted, mostly dark palette. A fan guide (not a primary source) says each zone has its own limited palette, to help navigation and mood. Gibson said the Knight's simple design came partly from technical limits, and that a cloak helps because you cannot see the arms.
- **Ori** (Moon Studios) began with block-outs that were only black and white silhouettes. Its lead artists cite *Princess Mononoke*. Each graphic has its own light, colour and motion. The background layers are lit separately to make a deep forest, with depth of field and a glow around Ori.

Sources:

- [Red Bull: Hollow Knight interview](https://www.redbull.com/us-en/hollow-knight-nintendo-interview)
- [Cyberpost: How Team Cherry made the art for Hollow Knight](https://cyberpost.co/how-did-team-cherry-make-the-art-for-hollow-knight/)
- [Xbox Wire: The art of Ori and the Blind Forest](https://news.xbox.com/en-us/?p=4339)
- [TheGamer: Ori and the Will of the Wisps art interview](https://www.thegamer.com/ori-and-the-will-of-the-wisps-art-interview/)
- [The Sixth Axis: Deep into the woods with Ori](https://www.thesixthaxis.com/2014/10/22/deep-into-the-woods-with-ori-and-the-blind-forest/)

**What it means for Ardan.**

- **Design in silhouette first.** Every portrait, beast and vignette must read as a black shape at 32 px.
- **One palette per region** (terrain or culture), applied to vignette skies and grounds, so the world map and the events of a place agree.
- **Light as the subject.** A single glow (a hearth, a lantern, the sun) makes a flat SVG scene feel alive.

### 2.11 Arcane (Fortiche) and Ghibli, Shinkai: colour and light

- **Arcane** treats each frame like an oil painting. Light and shadow are painted onto simple 3D forms rather than computed. It mixes cel-shaded faces, painted backgrounds and chalk or watercolour textures. A thesis that tried to rebuild the look in Unreal concluded it has more in common with hand-drawn animation than with 3D films.
- **Studio Ghibli's Kazuo Oga** painted with about 21 cheap poster colours. What mattered was how he combined and contrasted a few hues. He works from large shapes to small, and an art director says he "extracts the essence" of a scene and then enriches it.
- **Makoto Shinkai's** frames are dense with detail (power lines, shrine stones) but lead the eye along lines: tracks, cables, paths. Large empty skies carry the mood. Characters are cel-animated, environments digitally composited.

Sources:

- [RedShark News: Why Arcane looks so good](https://redsharknews.com/why-netflixs-arcane-looks-so-good-how-fortiche-ramped-up-the-animation-pipeline)
- [HAW Hamburg thesis on recreating Arcane's look](https://reposit.haw-hamburg.de/handle/20.500.12738/16175)
- [Animation Obsessive: What Kazuo Oga thinks about when he thinks about backgrounds](https://animationobsessive.substack.com/p/what-kazuo-oga-thinks-about-when)
- [Open Culture: inside Kazuo Oga's painting process](https://www.openculture.com/2021/01/a-look-inside-the-painting-process-of-the-studio-ghibli-artist-kazuo-oga.html)
- [Color Culture: Your Name cinematography analysis](https://colorculture.org/your-name-cinematography-analysis/)

**What it means for Ardan.**

- **A small fixed pigment set,** about 20 colours, from which every scene is mixed. That is Oga's lesson, and it is what makes procedural art look like one hand.
- **Big skies.** The vignette is two thirds sky: a vertical gradient of three or four stops by hour and weather. The land is a dark band of flat layers at the bottom. The sky carries the emotion of the event (dawn for a birth, a bruised violet for a death, a gold dusk for a wedding).
- **Hand-placed light.** Light is never computed. Each layer gets a fixed light side and a rim colour.

### 2.12 Ukiyo-e: the bridge from woodcut to anime

Hiroshige and Hokusai used flat blocks of colour with fine detail. Their skies use **bokashi**, a graded tone printed from a wiped block. *Ichimonji bokashi* is the straight band of colour across the top of a sky. Prussian blue (*bero-ai*) reached Japanese printing in the 1820s and became cheap by about 1830. Hokusai's *Thirty-Six Views of Mount Fuji* was first advertised as an all-blue series, and the blue became a craze. Hiroshige's prints work like posters: flat shapes, strong silhouettes, graded skies, bold foreground framing and a title cartouche. They shaped Monet, Whistler and Pissarro.

- [Columbia JAANUS: ichimonji bokashi](https://projects.mcah.columbia.edu/jaanus/node/3857)
- [MFA CAMEO: Prussian blue as an ukiyo-e colorant](https://cameo.mfa.org/wiki/Prussian_Blue:_Ukiyo-e_colorant)
- [Aizuri-e (Wikipedia)](https://en.wikipedia.org/wiki/Aizuri-e)
- [Auckland Art Gallery: Hiroshige, The Sea off Satta](https://www.aucklandartgallery.com/explore-art-and-ideas/artwork/11187/suruga-satta-kaijo-the-sea-off-satta-in-suruga-province)
- [Made Good Designs: Hiroshige, weather and design lessons](https://madegooddesigns.com/?p=106666)

**What it means for Ardan.** This is the key to moving from the current style to anime without throwing away its tools. Ardan's prints are already woodcuts: ink line, flat colour and a cut foot. Ukiyo-e is also woodblock printing, and it is the direct ancestor of manga and anime colour (flat fills, a strong line, graded skies). So the change is from a European woodcut to a Japanese colour woodblock. The style guide's line and seeded variety stay. The rule "no gradients" becomes "gradients only as bokashi skies and light". The palette's lapis becomes Prussian blue and leads. A vignette gets a cartouche (title box) in its corner, as Hiroshige's prints do.

### 2.13 Silhouette and line: Toriyama, Amano, Nihei

- **Akira Toriyama's** machines combine big soft forms with fine internal detail. A clear silhouette lets a character be known without colour or detail, and round shapes read as friendly and light.
- **Yoshitaka Amano** combines thin line with vivid colour, drawing on Western comics, art nouveau and Japanese woodblock prints.
- **Tsutomu Nihei's** later work (*Aposimz*) strips the line to a feathered minimum. His earlier *Blame!* uses heavy blacks and greys for a dense mass. He once worked at an architecture firm.

Sources:

- [Gizmodo: Akira Toriyama's mechanical design](https://gizmodo.com/akira-toriyama-mechanical-design-dragon-ball-sand-land-1851320681)
- [BINUS: Turning simple shapes into personality](https://binus.ac.id/bandung/dkv/2025/11/04/character-design-101-turning-simple-shapes-into-personality/)
- [CG Wire: Character shape language](https://blog.cg-wire.com/character-shape-language/)
- [Ocula: Yoshitaka Amano](https://ocula.com/artists/yoshitaka-amano/)
- [Vaguely Offensive: Aposimz vol. 3](https://vaguely-offensive.com/comics-z/aposimz-vol-3-tsutomu-nihei/)
- [Carroll News: Nihei's style is special](https://carrollnews.org/200840/arts-and-life/niheis-style-is-special/)

**What it means for Ardan.**

- **Shape language per people:** humans mixed, elves long verticals and points, dwarves squares, orcs heavy wedges, giants big masses with small heads. Do it Toriyama's way, with big simple forms and a little fine detail inside.
- **Amano's thin line plus colour** for royal and sacred subjects.
- **Nihei's architectural mass** for the realm screen: keeps, walls and the scale of a state as solid dark shapes against a sky.

---

## Part 3. Anime language that a browser can make

All of this is CSS, inline SVG and canvas, with no image files. 61-illumination and 63-miniatures already prove the pipeline: seeded, pure SVG strings, 6 to 20 KB each.

### 3.1 Cel shading

- **Two tones, a hard edge.** Anime and manga shade without gradients. A guide for hand painters: a hard-edged shadow on a multiply layer, clipped to the shape, in a light purple, with light from the upper left. For 3D toon shading, two stops give two tones and three add a mid-tone, and a single strong key light gives the cleanest edge.
- **Shift the shadow's hue, do not just darken it.** Move it toward purple or blue; plain darkening looks muddy.
- **Rim light** is a thin bright line on the side away from the key light. In 3D it is a Fresnel term on top of the bands.
- **The SVG recipe.** Draw each shape with its base fill. Clip a shadow shape (the same path offset 6 to 12% toward the dark side, or a hand-placed polygon) with `mix-blend-mode: multiply` in the shadow colour. Add a 1 to 1.5 px rim stroke in a light tint on the lit edge, clipped to the shape. Then draw the ink outline last.
- **Posterize filter.** `feComponentTransfer` in `discrete` mode, with `color-interpolation-filters="sRGB"`, bands anything already drawn. MDN notes that the default is linearRGB. It is useful for skies and glows; for figures, hand-placed shapes look better than a filter.

Sources:

- [Udemy: two-tone shading lesson](https://www.udemy.com/tutorial/the-digital-painting-mega-course-beginner-to-advanced/two-tone-shading/)
- [Anime Outline: How to shade an anime face in different lighting](https://www.animeoutline.com/how-to-shade-an-anime-face-in-different-lighting/)
- [StraySpark: anime toon look in Blender](https://www.strayspark.studio/blog/how-to-get-anime-toon-look-blender)
- [Booth: AnimeShaderV2 docs (rim light, Fresnel width)](https://booth.pm/en/items/3893139)
- [MDN: feComponentTransfer](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feComponentTransfer)
- [Codrops: poster image effect with feComponentTransfer](https://tympanus.net/codrops/?p=37507)

### 3.2 Gradient skies and parallax landscapes

- **The sky:** a `linearGradient` of three or four stops, picked from a table by hour (dawn, day, golden hour, dusk, night) and weather (clear, overcast, storm, snow). Add an *ichimonji* band, a darker stripe at the very top, as in Hiroshige.
- **Clouds:** flat ellipses or cumulus paths in two tones, lit edge up.
- **Sun and moon:** a disc with a 2-stop radial glow.
- **Stars:** a seeded scatter of 1 px dots.
- **The land:** three to five ridge layers generated from a seeded 1D noise or midpoint displacement. Each layer is a flat fill mixed toward the sky colour by distance (aerial perspective), and the farthest gets a light blur. The near layer is dark and holds the silhouette subject: a keep, a tree, a figure.
- **Parallax:** on the title screen and the map's edge, layers translate at 0.1×, 0.25×, 0.5× and 1× of a slow pan. Use `transform` only. It is off under reduced motion.
- **Mood:** Shinkai's leading lines (a road, a river, a wall) point at the subject.

This is **(general knowledge)** built on the Ghibli and Shinkai sources in 2.11.

### 3.3 Speed lines and diagonal panels

- **Focus lines:** radial wedges from a focal point, with seeded angles and lengths, written as `<polygon>` elements. Apple Motion and Clip Studio build in radial "inward" lines. A browser tool, the Manga Effect Line Maker, generates focus lines, speed lines and flashes from a seed but exports PNG, so Ardan should generate its own SVG.
- **Speed lines:** parallel thin wedges along the motion direction.
- **Diagonal panels:** a `clip-path: polygon()` band at −8° to −12° across the screen, holding the display text. A second, thinner band in the accent colour sits offset behind it. This is the Persona cut-in.

Sources:

- [Clip Studio: Speed lines and focus lines](https://help.clip-studio.com/en-us/manual_en/540_comic/Speed_lines_and_Focus_lines.htm)
- [Apple Motion: Manga Lines generator](https://help.apple.com/motion/mac/5.4/en.lproj/motnd0dfd077.html)
- [Uhiyama Lab: Manga effect line maker](https://uhiyama-lab.com/en/tools/effect-line-maker/)

### 3.4 Portrait construction (anime proportions)

- **Head:** a circle for the cranium plus a jaw shape below. The eyes sit on the horizontal midline, or a little below it. Lower eyes read younger, higher eyes older. One guide warns that strict midpoint rules make a face look older than intended; for youth, shorten the jaw and lower the eyes.
- **"Half rule":** the eyes halfway from hairline to chin, the nose halfway from eyes to chin, the mouth halfway from nose to chin. The ears run from the brow line to the nose.
- **Eyes, built in layers:**
  1. the upper lash line, the most important stroke (thick reads intense, the taper sets the character);
  2. the outer corner and the crease;
  3. the iris, an upright oval cropped by the lids, never a full circle;
  4. a soft shadow under the upper lid;
  5. two catchlights, one large and one small, on opposite sides.
- **Hair:** front and back layers are separate groups. Back hair is drawn behind the head, bangs and side locks in front. Reallusion's Cartoon Animator SVG rig uses the same split.
- **A generator** picks parts by a hash of the person's id, as 63-miniatures already does.

Sources:

- [Envato Tuts+: How to draw anime heads and faces](https://design.tutsplus.com/tutorials/how-to-draw-anime-heads-and-faces--cms-31884)
- [Skillshare: How to draw anime for beginners](https://www.skillshare.com/en/blog/how-to-draw-anime-for-beginners-a-step-by-step-guide/)
- [Udemy blog: anime eyes in 9 steps](https://blog.udemy.com/learn-how-to-draw-anime-eyes-in-9-simple-steps/)
- [Clip Studio Tips: sparkling eyes with blending modes](https://tips.clip-studio.com/en-us/articles/11776)
- [Reallusion: SVG structure for characters (front and back hair groups)](https://manual.reallusion.com/Cartoon-Animator/Content/Resources/5.1/07-SVG-Out/SVG-Structure-Character.htm)
- [Anime OC Maker: 13 layers, back hair and bangs](https://tool.teamzlab.com/design/anime-oc-maker/)

**What it means for Ardan.** 63-miniatures has the right skeleton: parts per head, hair, garment, arms and weapon, seeded by id, pure, and escaped. It draws painted miniatures, though: hatching, a two-tone wash, small faces. The anime portrait changes the face and the shading, not the system:

- a bigger head-to-body ratio;
- big layered eyes;
- hair as front and back masses with clumped tips;
- two-tone cel shadows with a hue shift;
- one rim light;
- a ground that carries the realm colour.

The brief gives exact proportions.

---

## Part 4. Typography

**Candidates were measured in Chromium** from the real Google Fonts woff2 files (Latin subset, Oct 26):

- **x-height** is the share of the em that `x` stands, which sets how big text looks;
- **width** is the length of a pangram at 100 px, relative;
- **file sizes** are for the Latin subset and the Latin Extended subset.

| Family | x-height | Width | Tabular figures | Latin + Latin Ext | Notes |
| --- | --- | --- | --- | --- | --- |
| Alegreya (today's body) | 0.46 | 17.9 | yes | 43 + 38 KB (400–700) | Small at 14 px; lovely at 17 |
| Literata | 0.51 | 21.0 | yes | 38 + 32 KB (400–700, no opsz); italic 39 + 32 | Google's e-book serif; clear at 14–15 px |
| Spectral | 0.45 | 19.8 | yes | 21 + 20 KB per weight | Too light at 14 px |
| Source Serif 4 | 0.50 | 21.3 | yes | 50 + 41 KB | Good, plainer, heavier file |
| Atkinson Hyperlegible Next | 0.50 | 19.6 | yes | 33 + 19 KB (variable 400–700); italic 14 + 8 | Made by the Braille Institute for legibility; distinct 0/O, 1/l/I |
| Fira Sans | 0.53 | 20.2 | yes | 23 + 45 KB per weight | Good; Latin Ext is heavy |
| M PLUS 2 | 0.52 | 21.5 | no (always tabular) | 34 + 26 KB | Japanese-made; wide |
| Inter | 0.55 | 21.2 | yes | 47 + 83 KB | Neutral, heavy file |
| Barlow Semi Condensed | 0.51 | 17.3 | yes | 22 + 14 KB per weight | Dense labels |
| Cinzel (today's display) | 0.60 (caps) | 24.6 | yes | 25 + 14 KB (600–700) | Roman capitals |
| Dela Gothic One | 0.55 | 25.4 | yes | 14 + 9 KB | Heavy Japanese poster gothic; the Persona punch |
| Mochiy Pop One / Potta One | 0.57 / 0.58 | 25 / 24 | partly | 18 / 25 KB | Too cartoonish for prose |

All are under the SIL Open Font License 1.1, as are today's three fonts (see `features/77-offline-fonts/README.md`).

**What it means for Ardan.**

- **Three roles.** Prose (event text, the log, the Chronicle), UI (labels, numbers, buttons) and display (titles and cut-ins).
- **Prose: Literata** at 15 px matches Alegreya at about 16.6 px in apparent size, because of its larger x-height. That saves the space the critique asks for without strain.
- **UI: Atkinson Hyperlegible Next** in one variable file. Its digits are unambiguous, which matters for a numbers game, and its slightly quirky letterforms have more character than Inter.
- **Display: Cinzel** for names and screen titles, to keep the continuity of "a chronicle". **Dela Gothic One** only for cut-ins and big numbers, which gives the anime and Persona energy for 22 KB.
- **Alegreya and Cinzel Decorative** (about 180 KB) can be dropped. The illuminated initial can be Cinzel 700 at 3 lines high in a drawn frame.

The full stack and its size are in the brief.

---

## Part 5. Accessibility constraints that shape the look

- **Text contrast (WCAG 1.4.3):** 4.5:1 for body text, 3:1 for large text.
- **Non-text contrast (WCAG 1.4.11):** 3:1 for the boundaries of controls and meaningful graphics. My reading; the search results only confirmed that 1.4.11 still applies in 2.2.
- **Target size (WCAG 2.5.8):** 24×24 CSS px minimum, with the spacing exception.
- **Reduced motion:** `prefers-reduced-motion` asks to minimize non-essential motion. Large scaling and panning can trigger vestibular disorders. The advice is to reduce, not always remove: fades, dissolves and colour changes instead of slides and zooms. Also offer an in-game switch, because many players never find the OS setting.

Sources:

- [W3C: What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [Intopia: WCAG 2.2 map (PDF)](https://intopia.digital/wp-content/uploads/2023/10/Intopia-WCAG-2.2-Map-Portrait-Mode.pdf)
- [MDN (FR): prefers-reduced-motion](https://developer.mozilla.org/fr/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)
- [BOIA: prefers-reduced-motion](https://www.boia.org/blog/what-to-know-about-the-css-prefers-reduced-motion-feature)
- [University of Michigan: Accommodating vertigo and vestibular disorders](https://teamdynamix.umich.edu/TDClient/30/Portal/KB/Article/14019/Accommodating-Vertigo-and-Vestibular-Disorders)
- [Flutter: Material Easing (emphasized decelerate = cubic-bezier(0.05, 0.7, 0.1, 1))](https://api.flutter.dev/flutter/material/Easing-class.html)

**What it means for Ardan.** Every colour in the brief was computed against every surface it sits on (script in the brief's appendix). 27-accessibility's axe checks must stay at zero. Motion has a reduced variant for every effect, and the game's own Motion setting overrides the OS either way.

---

## Summary: ten lessons in one line each

1. **Clarity beats style when they conflict** (Into the Breach, Persona 5's own readability fixes).
2. **One theme colour, held everywhere** (Persona, Soejima): Prussian-blue night with gold.
3. **Style for moments, plainness for reading** (Tschichold's poster against book; Persona against Tactica).
4. **Few tools, used strictly** (Rams, Vignelli, Oga's 21 paints).
5. **Group by space first and frames once** (Gestalt; the critique's nested cards).
6. **Show layer 1 and keep the rest one hover away** (NN/g, CK3's nested tooltips).
7. **Data as ink:** thin bars, small multiples, sparklines (Tufte).
8. **Every control looks pressable and answers when pressed** (Norman).
9. **Ink line, flat colour, graded sky:** the ukiyo-e bridge from Ardan's woodcuts to anime.
10. **Silhouette first, light second, detail last** (Ori, Hollow Knight, Toriyama).
