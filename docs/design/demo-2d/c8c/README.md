# C8c · dress, class and regalia: the sheets and the blind reading

Everything here is drawn by the game's own figure library (`src/ui/engine/figure`), from the sheets the game would hand it.
`node docs/design/demo-2d/c8c/sheet.mjs` draws them again (the default cast is the one the last two readings read;
`--seed=k` draws another). The decision is D-060; the wardrobe is described in `src/ui/93-figures/README.md`.

| File | What |
| --- | --- |
| `stations.png` | Eight stations in four peoples, one of each cut (Northfolk tunic, Qadiri robe, Wind Riders kaftan, Zanari drape), labelled: the class sheet CRITIQUE V2 asked for |
| `stations-blind-1.png`, `stations-blind-2.png` | The same 32 people, shuffled, numbered, no labels: what a blind reader is handed |
| `stations-key.json` | The answer key |
| `soldiers.png` | The ranks of an army as busts at list size and as cards (V7); a lord's household in his livery beside it |
| `occasions.png` | One person, six outfits (day, best, work, travel, arms, mourning) |
| `peoples.png` | A countryman, a countrywoman, a merchant and a lady of each of the 24 cultures |
| `blind-prompt.txt`, `blind-reading-N.txt` | What the reader was asked, and what each reader answered |

## The blind reading

The critique's bar: on a sheet of 8 stations x 4 cultures with the labels hidden, agents name the station 85 times in 100.

**The reader.** A fresh Sonnet at default effort (`claude -p --model sonnet`), run in an empty folder holding only the two
blind images and the prompt, with only the Read tool. It never saw the key, the labelled sheet or the repository. Each
reading is a new reader. The answers were scored against the key by script.

| Reading | Cast | Right | Misread |
| --- | --- | --- | --- |
| 1 | `c8c`, first wardrobe | 30 of 32 (94) | a Qadiri soldier in mail as a knight; a Zanari peasant in beads as a noble |
| 2 | `c8c-2`, after the fixes from 1 | 26 of 32 (81) | two serfs as peasants, two peasants as merchants, a cleric as a noble, a mailed soldier as a knight |
| 3 | `c8c-3` as then drawn, after the fixes from 2 | 28 of 32 (88) | a merchant as a noble, two peasants as merchants, a serf as a peasant |
| 4 | the same images as 3, another reader | 23 of 32 (72) | three merchants as nobles, three peasants as merchants, two serfs as peasants, a noble lady as a merchant |
| 5 | `c8c-3` as now drawn: the final wardrobe, the sheets here | 25 of 32 (78) | three serfs (two as peasants, one in an apron as an artisan), three peasants (two as merchants, one as a serf), a merchant as a noble |
| 6 | the same images as 5, another reader | 27 of 32 (84) | two merchants as nobles, a peasant as a merchant, a peasant as a serf, a serf as a peasant |

**What it says.** Six readings, 159 of 192: **83 in 100**; the two of the final wardrobe, 52 of 64: **81 in 100**. The bar
of 85 is met in two readings of six and not on the final sheet. Two readers of the same images differed by 16 and by 6
points, so one reading is a rough measure.

- **Five stations are read every time:** royal 24 of 24, clergy 23 of 24, artisan 24 of 24, knight or noble 23 of 24,
  soldier 22 of 24 (both misses were a man in mail read as a knight, before the rank and file lost their plate arms and
  were stood with shield and spear; none since).
- **Three are not:** serf 15 of 24, peasant 11 of 24, merchant 17 of 24. A serf and a free countryman are both plain
  people in a belted tunic, and a reader shown one at a time puts the line in a different place each time; a countryman
  in good dyed cloth with a hat reads as a trader; a merchant in a long gown reads as a lord until the purse and keys
  are seen. Before C8c only the nobility was told apart (the critique's finding).

**What each reading changed.** After 1: no plate on the arms of the rank and file; a countryman's beads of clay and bone,
not ochre. After 2: a patch on the breast (the one on the skirt is out of the frame); a serf wears no hat of his people;
a countryman's girdle is narrow and plain; a mid-rank stole has dark crosses, not gilt; a woman of the cloth is veiled;
the rank and file stand with the shield shown. After 4: fur at the neck only for the rich (and for a merchant only on a
feast day), a merchant always in his hat with a larger purse, a lady in a circlet or a veil with fur at her collar, a
serf in torn short sleeves with two patches, no rope belt on a free countryman.

**Not done.** The serf's apron (reading 5 took a serf woman in one for an artisan) and the Zanari countryman's bright
wrap and tall head cloth (read as a merchant in each of the last four readings) are left as they were when the last readings
were taken, so that the sheets here are what the readers saw.

## The same test, by rule

`fgDressStations` (`src/ui/93-figures/test.mjs`) runs in CI: a reader that knows only the garments (no sheet, no label)
names 191 of 192 people of eight stations in the four cuts. It holds the marks in place (a rope belt and patches, an apron
or a tool, a purse and keys, the sun and the cord, a helm or a quilted collar, gold, a crown); it does not say a person
would see them, which is what the blind reading is for.
