# 9993-chapters: a life in chapters, and what a house carries

**Aspect:** Story and goals (design review cycle 1, #12 Chapter cards, #20 Dynasty legacies) · **Kind:** one readable core file, two trigger-only events (`chapters.events.js`, prefix `chp_`), tests. No patches.

**Why.** 97-life-fixes gives a life one long ambition, asked at coming of age and at 35. Between those two questions there are nineteen years with one far-off aim. A session lasts 20 to 40 minutes, and a lifelong ambition does not fit it; short aims do (Pentiment's acts, BitLife's challenges, Reigns' objectives). The second and third generations are where life sims lose players, and a house earned nothing as a house.

## What it does

**A chapter for each stage of life:** childhood, youth, the prime of life (a new chapter every eight years of it), age, and a reign (every ten years). The month hook opens it, and the chapter card (`chp_card`) says:
- what the last chapter came to ("The Hungry Years is closed: 2 of 3 aims met.");
- the new one's title, drawn from your life so far by hash among the names that fit: at war "The Years of Smoke", unfree "Other Men's Fields", a poor childhood "The Hungry Years", a noble youth "The Gilded Cage", a sailor "Salt", a reign "The Weight of the Crown", age "The Long Evening" (18 situations, 3 or 4 names each);
- three aims. Two are set, and for the third you choose between two ("I will see a realm you have never seen" or "I would rather make a true friend").

**Aims are concrete and checkable**, measured from where you stand when the chapter opens. Each month they are checked; one that is met says so ("Aim met: Have 140 suns in your purse.") and pays a small reward. A chapter closed with all three met writes a deed ("Closed Chapter Two: Silver and Silk with every aim met") and 2 renown. There are 29 aims across the stages:

| From | Aims |
| --- | --- |
| **Your path** | rise a rank in your trade; find steady work; bring your trade's skill (or your best) up by 10; stand in a battle line and live; win your freedom; own a roof of your own |
| **Your life** | learn your letters; make a true friend; grow hardier; marry; have a child; hold a grandchild; see a child married; live to see 70; grow in faith |
| **Your ambition (97)** | a long step toward it: its progress up by a quarter |
| **The world** | see the war through; see a realm you have never seen; learn the sea (on a coast); be talked of (renown +10) |
| **A reign** | steady the realm (stability +10); fill the treasury; get an heir; bind a neighbour with an alliance |
| **Your mark (9992)** | design your arms; give a name to something you love; let a thought you hold ripen |

**On screen.** The chapter sits on the Life tab above the ambition (on a phone, inside the ambition card, which 90-fold folds to its title line there, so the phone Life page stays at 1.29 screens): its number and title, the years, and the aims with ticks. The Book lists every chapter of every life by name, with the years and the aims met, before the chronicler's pages.

**Dynasty legacies.** When you go on as your heir and the house has renown (the dead members' life scores in thousands plus their deeds, at least 3), `chp_legacy` offers three of five perks not yet taken. Each perk is given to the new head at once and to every heir after:
- *Strong blood* (+5 health, +2 stamina);
- *The house blade* (+3 melee, +2 swordsmanship);
- *The house purse* (60 suns);
- *The house tutor* (letters, +3 learning, +2 etiquette);
- *The house chapel* (+8 piety, +2 faith lore).

They are kept in `S.dynasty.legacies`.

## APIs (for later work)

- `A.CH.AIMS.push({ k, st: [stages], fit(p), base(p), label(p, b), done(p, b), reward })`. 13-weekly-challenge or a quest system can add aims; `fit` 0 keeps an aim out.
- `A.CH.TITLES.unshift([test(p), [names]])` adds chapter names for a situation.
- `A.CH.stage(p)`, `A.CH.heading(chapter)`, `A.CH.card(p)` (the Life card), `A.CH.bookHtml()`.
- `A.CH.LEGACY[k] = { name, t, give(p) }` adds a legacy track.
- fx keys: `chapter: 'alt'` (take the other third aim), `legacy: 0 | 1 | 2 | 'k'`.

## State (new; an old save opens a chapter the first month)

`pc.chap = { n, cur: { n, st, t, y0, a0, aims: [{ k, l, b, d }], alt }, past: [{ n, st, t, y0, y1, aims: [{ l, d }], full }] }` · `S.dynasty.legacies = [{ k, y, by }]`.

## Measured by (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `chpOpen` | A 13-year-old opens Chapter One of youth; the card has no raw token, at most 80 words, three aims; the second choice swaps in the other aim; the Life tab and the Book draw it without changing state or dice |
| `chpAims` | A purse aim is met and said, renown next; eight years on the chapter closes full, writes its deed, and the next card's recap says so |
| `chpStages` | A life from 6 to 20: chapters of childhood, then youth, then the prime, each with its card |
| `chpLegacy` | Going on as a child of a house with renown queues the legacy scene; the choice is stored in `S.dynasty.legacies` |

`lint-events` and `lint-choices` pass.

## Limits

- Big turns (a marriage, a move, a war) do not open a chapter of their own yet. Only stages and time do.
- The chronicler's own chapters (22) are still by decade. The Book lists these chapters beside them and does not rename them.
- Legacies are a flat list of five, one choice per succession. There are no tiers and no renown costs as in CK3.
