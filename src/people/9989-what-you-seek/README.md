# 9989-what-you-seek: the world answers what you seek

**Aspect:** free will (owner order 54, P3; D-062 addendum) · **Kind:** one readable core file (`seek.core.js`), a test, and
one line in the release (`C.ambition`, `src/core/release/core/17-careers-and-event-engine-b.js`).

**Why.** The owner: "remove the ambitions feature, the useless decisions and chapters. Everything comes down to free will.
Any of these things should be available to you but not a single thing should be handed to you without you seeking it
out." The ambitions (97-first-life-fixes part 3) and the chapters (9993-life-chapters) are retired to
`archive/p3-ambitions/` and `archive/p3-chapters/`. The release's 37 `pa_*` scenes (a sword master passing through, a
guild seat, cheap land, buying your freedom, a petition to widen the realm...) were written for an ambition and read
`C.ambition(p, k)`. Without a handed ambition they would never come; they now come to the life that seeks the thing.

**What counts as seeking** (`A.SEEK.RULES`, each a reason in words): the aim you set in your plan (Push for advancement,
Turn a coin, Seek renown, Devotion, Study, Look for love, Tend your family, Win a patron, Scheme, Plan your freedom,
Govern, Statecraft, Prepare for war); the training you chose yourself (not the one the engine fills in, `trainAuto`); a
post you took (a trade, the army, the clergy, an office); a shop you opened; a fighting style you went to school for;
the roads you travelled; for the unfree, coin put by.

| Key | Sought when |
| --- | --- |
| freedom | unfree, and you plan your freedom or have 20 suns put by |
| wealth | aim Turn a coin; a shop of your own; a guild trade with 500 suns |
| trade | a trade, and aim Push for advancement or your own training in its skill |
| family | aim Tend your family or Look for love |
| renown | aim Seek renown, or renown 30 |
| faith | aim Devotion, or holy orders |
| scholar / teacher | aim Study or your own training in learning (a teacher: learning 35, age 25) |
| blade | your own training in the sword or melee, or a style |
| knight / soldier | an order; or the army (not a company) with aim Push for advancement |
| explorer | two realms seen, or the sea |
| court / throne | an office, or aim Win a patron as gentry or noble; aim Scheme within reach of a crown |
| expand / golden / web | a ruler with aim Prepare for war / Govern / Statecraft |

`A.SEEK.why(p, k)` gives the reason, `A.SEEK.is(p, k)` the yes or no. Pure: event conditions call it.

**Old saves.** A save's `p.amb` (a handed ambition) is ignored; its chapter state (`p.chap`, `S.dynasty.legacies`) is
left as it was and read by nothing.

## Test

`seekNotHanded`: no ambition or chapter card exists or is queued; nothing is sought before the player chooses (and the
engine's own training plan is not a choice); an old save's ambition opens nothing; setting an aim or a training opens the
matching scenes, with a reason; a serf putting coin by seeks his freedom; reading is pure.
