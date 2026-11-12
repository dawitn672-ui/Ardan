# 08-coherency: the coherency checks

**Aspect:** Foundations (round 2, item 3: "after every update, run checks for contradictions"). **Kind:** system (one
core file, no patches, no events), in the fix layer so every build has it.

`A.COHERENCY.add(name, fn, { owner })` registers a read-only check that returns a list of problems in plain words;
`A.COHERENCY.run()` runs them all and returns only the failing ones. The built-in checks: the v2 invariants
(`A.V2SAVE.check`), one ruler per realm, one holder per council seat, one general per army, family links that agree,
and the player fitting their age. Features add their own (the post registry adds one holder per post).

- `node tools/coherency.mjs [built.html] [--seeds=4] [--years=30]` runs every check over lives of every class and
  prints each contradiction with ids. Run it after every update; fix what it finds before calling the update done.
- `tests/suites/coherency.test.mjs` runs a short round in CI, and checks that running the checks changes nothing.
