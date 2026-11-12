# 08-coherency: the coherency checks

**Aspect:** Foundations (round 2, A3: "after every update, run checks for contradictions"). **Kind:** system (one core
file, no patches, no events), in the fix layer so every build has it. In the default build since A3a (it was `.wip`).

`A.COHERENCY.add(name, fn, { owner })` registers a read-only check that returns a list of problems in plain words;
`A.COHERENCY.run([names])` runs them and returns only the failing ones, `[{ check, owner, n, problems }]`. A check must
never change `A.S` or draw from the random stream, and must not call anything that mends state lazily (`A.houseHead`
makes a head when asked; the check reads `h.headPid`). Features add their own checks as later steps land (A2's post
registry adds one holder per post).

The checks:

| Check | What it holds | Who removes what it finds |
|---|---|---|
| v2 invariants | `A.V2SAVE.check()`: one continent, A.V2F's title audit (one holder per title), the body within its ceilings, the stores `court`, `v2dip`, `v2w`, `v2t` | — |
| one ruler per realm | a living ruler who knows it, and nobody else claiming the crown | — |
| one holder per council seat | each seat held by the living, nobody in two seats | A2 |
| one general per army | a living general, nobody leading two armies | A2 |
| family links agree | marriages both ways, parents and children point at each other | C6 |
| the player fits their age | a child holds no adult job or rank | — |
| no dead holder: titles | a court title is held by the living, or has passed on (`p.noble.passed`), or is marked vacant | A2 |
| no dead holder: house heads | a house that has not died out has a living head | A2, C6 |
| no dead holder: shire offices | 9996-polity's offices (`r.pol.off`) are held by the living | A2 |
| every realm has a council | a realm with land has someone in its council (a rebel faction still at war is left out) | A2 |
| no child in an adult office | council seats, shire offices and armies go to people of age for their race (`GD.RACES[race].adult`); land titles may pass to a ward | A2 |
| one office, one styled holder | no two living people of a realm styled with one of its council offices (`p.occ`, `p.title`) | A2, C6 |

## Running them

- `node tools/coherency.mjs [built.html] [--seeds=3] [--years=30] [--every=5]` plays lives of every class and prints
  each contradiction with ids; any page error or console.error, or a check that is not pure, fails it.
- **The baseline.** `tests/coherency-baseline.json` counts the contradictions still known, per check, for two runs:
  `quick` (4 lives x 16 years, held in CI by `tests/suites/coherency.test.mjs`) and `nightly` (8 lives x 60 years,
  `.github/workflows/nightly.yml`). A count may only shrink: lower it when a step removes contradictions
  (`node tools/coherency.mjs --baseline=quick --write`), never raise it without a line in `docs/DECISIONS.md`. It is
  empty when round 2 ends.
- `coherencyDay0` (same suite): a new game of every class and race passes every check on day 0, and running the checks
  twice changes nothing and draws nothing.
