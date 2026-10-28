# 9992-identity: your mark, your inner voices, your thoughts

**Aspect:** Identity and story (design review cycle 1, #14 Make your mark, #7 Inner voices, #19 Thoughts you adopt) · **Kind:** three readable core files, 28 events (`identity.events.js`, prefix `ix_`), tests. No patches.

**Why.** The only thing a player wrote in a whole life was a house name in a text box. Nothing was theirs: no arms, no named horse, no voice of their own in a scene, and a repeated stance never became part of who they were. Creative players of 13 to 23 want a character that is theirs, and a sigil they made is the best thing to share (9994-share).

## What it does

**Arms** (`identity.a-mark.core.js`).
- **The designer** ("Your mark" on the Life tab, *Design your arms*): field, a division or ordinary (chief, fess, pale, bend, chevron, cross, saltire, per pale, per fess, quarterly, bordure) in a second tincture, one of the release's 24+ charges, the charge's tincture, and a motto. Eight tinctures in the woodblock palette (94's pigments), 91's ink line round the shield. Every button is at least 44 px; on a phone the rows stack.
- **Where it shows.** `PORTRAIT.coat` is taught the ordinary, so the house you head is drawn with your design on every house chip, family card, realm band and share card, with no change to those screens. Before you head a house it is your own device (`pc.mark`); when you found one (`found_house`), the heralds register the device as the house's arms and its motto as the house words.
- **Stored as ids, never markup:** tincture names, a charge id, an ordinary id. The motto keeps letters, spaces and `' , . -` only, so `SAVES.clean` has nothing to strip.

**Things you love.** A dog (a pup that follows you home: `ix_pup`), a horse (`ix_horse_name`, when you have a mount), a blade (`ix_blade_name`), a ship (`ix_ship_name`). Each naming scene offers two names hashed from your id, or you name it yourself from the Life tab.
- `pc.named[kind] = { n, y, deeds }`. The tokens `{dog}` `{horse}` `{blade}` `{ship}` (and `{dogYears}`...) name them in any scene; an event that uses one is dropped when you have none.
- **Deeds:** the horse counts your battles, the blade your kills; scenes add lines ("Ran a thief off in 1109", "Came home through the squall off the point").
- **Ends are remembered.** A dog's last winter (`ix_dog_old`), a horse put out to grass or sold, a blade set aside, a ship sold: each goes to `pc.named.past`, and a death writes a deed ("Buried Brindle, the dog who was with you 11 years").

**Your epithet, as you earn it.** When `pc.epithet` changes, the month hook queues `ix_epithet` ("You hear it first from a boy carrying water..."), and the Life card shows what you are called and what you were called before. An old save or a start that came with a name is noted quietly.

**Inner voices** (`identity.b-voice.core.js`, Disco Elysium). One muted line above the choices, at most 14 words, from the part of you that knows most: the skill a check rests on (your best of them, if 15 or more), else your strongest skill (30 and up) or your most marked trait.
- **18 voices:** twelve skill families (Steel, The Draw, Fieldcraft, Salt, Silver Tongue, Guile, Menace, The Captain, The Ledger, Letters, The Psalter, Calluses) and six trait families (Nerve, Dread, Pride, Mercy, Hunger, Temper), each with lines by kind of scene (fight, talk, money, faith, wild, court, kin, body, any).
- **Pure.** The voice and the line are picked by hashing the event and person ids, nothing is written, and it speaks only the first time a life meets an event (`p.flags.ev` has no year for it). About 60% of first sightings carry one. Off in the settings ("Inner voices in scenes").
- **Open registry:** `A.ID.VOICES[key] = { name, skills, traits, lines: { kind: [...] } }`.

**Thoughts** (`identity.c-thoughts.core.js`, the Thought Cabinet). Sixteen ideas ("The lord's barn is always full", "Steel answers what words cannot", "Every coin is a seed"...), offered by scenes that fit the life you lead (`ix_th_*`, each once) and by people you trust (`ix_th_friend`: their trait picks the idea).
- **Two slots.** A third thought pushes out the oldest. *Let it go* on the Life card drops one.
- **A real cost while held:** half the thought's cost on its skill's checks (`A.checkVal`).
- **Ripening** after 10 to 14 months: the trait (its opposite removed), the full gain on two skills' checks (+2 to +5) and the full cost on a third (−3 to −5).
- **It speaks:** a held or ripe thought takes the inner voice one time in four.

## Hooks and APIs (for later work)

- `A.ID.arms(pc)`, `A.ID.coatSvg(pc, size)`, `A.ID.blazon(arms)`; tokens `{arms}` `{words}` `{epithet}`.
- `A.ID.named(pc, kind)`, `A.ID.deed(pc, kind, text)`, `A.ID.lose(pc, kind, how)`; `A.ID.KINDS` takes new kinds (a hawk, a falcon).
- fx keys (declared in `A.FX_EXTRA`): `name: { kind, i }`, `named: { kind, deed }`, `lose: { kind, how }`, `thought: 'id' | 'ctx'`.
- Journaled commands: `A.idSetArms(part, value)`, `A.idName(kind, name)`, `A.thDrop(id)`; replays reach the same world.
- Overlays `idArms` and `idName` are in `UI.SYS_OV`, so they open over an event and close back onto it.

## State (new fields; old saves have none)

`pc.mark = { f, f2, c, ch, ord, words, y }` · `house.ord`, `house.f2` · `pc.named` · `pc.idEp = [{ e, y }]` · `pc.thoughts = { held, ripe, dropped }`.

## Measured by (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `idArms` | The designer through its buttons (79 options), the motto cleaned; the Life card draws the chevron; a journal replays to the same world; founding a house registers the device, and the house chip draws it |
| `idNamed` | The pup's choice names the dog from the offered name; `{dog}` fills; the last winter puts it in `past` with a deed, and `{dog}` no longer fills; a horse named from the screen (markup stripped) and parted with when the mount goes |
| `idEpithet` | A new epithet queues its scene with the name in it; an old save's existing epithet is quiet |
| `idVoicePure` | 60 first sightings drawn twice: voiced on 38, the same line both times, state and dice untouched, none over 14 words, no raw token; a seen scene and the setting off are quiet |
| `idThoughts` | A held thought lowers its cost skill's check, two slots, ripening gives the trait, the full cost and the gain; an old save without thoughts checks as before |
| `idOldSave` | A save with none of the new fields loads, draws every tab and plays two years |

`lint-events` and `lint-choices` pass (0 of 22 compared choices obviously best).

## Limits

- The designer has no field patterns (vair, ermine) and one charge; two-charge arms would need a second device slot in `PORTRAIT.coat`.
- 63's woodcut miniatures and 93's tabards read the house's two colours and charge, not the ordinary.
- The voices are written, not generated: 18 voices of 3 to 10 lines. A voice can sound beside the point in a scene its kind does not fit.
