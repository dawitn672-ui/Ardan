# 9994-share: keep a moment as a picture

**Aspect:** Sharing (design review cycle 1, #4 Share cards) · **Kind:** one readable core file, tests. No patches, no events, no engine change.

**Why.** Young players share games through pictures: BitLife lives on TikTok and Reddit, Wordle's grid, CK3's "my king did what" screenshots. Ardan's moments are the kind people post, but nothing could leave the page as a picture. The only export was the Book as a text file.

## What it does

**Three buttons:**
- *Keep this* on a scene's result, in 92's foot beside Continue (or beside the release's Continue when the card is off);
- *Keep this life* on the death screen, beside A new life;
- *Keep this page* on the Book, beside "Save the chronicle as text".

**The card** is 1080 × 1350 (the 4:5 portrait size feeds use), drawn on a canvas:
- 94's woodblock print across the top: the scene's own print, a dusk print of the grave for a life, an interior for the Book;
- 93's anime bust in an inked round frame, overlapping the print's edge (the scene's subject, or you);
- your arms, from 9992-identity's design or your house's;
- beside the bust, who and where ("TOVA, 17", the place and date);
- the title in Cinzel, what you chose, the result line in Literata, and the epitaph (your name and epithet; a life's ending; the Book's chapter);
- an ink footer: "ARDAN · seed 4242 · Empire of Aldmark · 1107 AR".

**Three ways out**, in an overlay that opens over the scene and closes back onto it:
- *Save the picture (PNG)*: through the release's own `UI.download` (a Blob, an object URL, `<a download>`), the path its save export takes, so it works inside the page's CSP (`img-src data: blob:`). Every picture on the canvas is an SVG data URL the game drew, so the canvas is never tainted.
- *Copy the seed*: the world seed in a read-only field, copied with the clipboard API or by selection. A friend types it into the creation screen's World seed field and gets the same world.
- *Share…*: the Web Share API with the PNG, where the browser offers one.

**Pure.** Drawing a card reads the state and writes none of it, and draws no random numbers. The last PNG is UI state (`UI.SHARE.last`) and is never saved.

## Cycle 2 (Oct 29)

- **The face and the name agree** (design A9). When a scene has a subject, the bust and the tag are theirs ("BRAND, 52"), and you go in the line under the text ("With Garth Brambleworth").
- **The overlay's buttons are a plain row** (visual B8), not `.choices` rows. Save is the gold primary, Back is a ghost, and there are no key badges.
- **The card's foot** (visual F9) has a strip of four numbers: age, renown, purse, and the odds or the year (a life shows children and what was left). The words stop above it, cut with an ellipsis. The print is 80 px shorter, so a three-line result fits.
- **A life with no arms gets a wax seal** with its initial, instead of nothing.

## APIs (for later work)

- `UI.SHARE.KINDS[k] = () => ({ title, sub, line, epitaph, tag, place, sky, bust, arms, file })` adds a kind of card, such as a battle's after-action report or a weekly challenge's result. Then `UI.SHARE.keep(k)` or a `data-a="shKeep" data-v="k"` button.
- `UI.SHARE.make(k)` gives `{ bytes, url, name, seed }` without opening the overlay.
- `UI.SHARE.draw(data, canvas)` and `UI.SHARE.svgImage(svg, w, h)`: any SVG the game draws, as a canvas image.

## Measured by (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `shScene` | Keep this on a real result (chosen through the button): a download named `ardan-<event>-<year>.png`, a PNG 1080 × 1350 over 50 KB; the seed field holds `A.S.seed`; state and dice unchanged; Back returns to the result |
| `shLife` | Keep this life on the death screen: a 1080 × 1350 PNG; back on the death screen |
| `shBook` | Keep this page on the Book: a 1080 × 1350 PNG |

The runner fails any test on a Content-Security-Policy violation, so all three also hold that the card stays inside the policy.

## Limits

- Fonts are the page's own (77's embedded faces). A card drawn before they have loaded waits for `document.fonts.load`, and falls back to Georgia and system fonts if they fail.
- There is no card for a battle or a reign yet. `KINDS` is where they go.
- Web Share with files is offered only where `navigator.canShare` exists (most phones, few desktops).
