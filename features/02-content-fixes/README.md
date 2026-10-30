# Event content fixes

**Aspect:** Events and story · **Kind:** fix (applied in every build)

Raw {tokens} in 39 events, two events that never fired, text-diet misses, a stale promise.

## Patches

| Patch | Why |
| --- | --- |
| `EVT-TOKEN-DIGITS` | Tokens with digits ({mate2}, {h1}, {m2him}, {cap2}, {age2}, {n1}...) were neither filled nor caught, so 39 events showed raw braces ("You owe {mate2} {debt} suns"). The values were already in the context; allow digits in both patterns. |
| `EVT-DELEG-COUSIN` | st_deleg_cousin used {they}, which is not a token, so the event was always dropped after using up its roll. |
| `EVT-SERV-SECRET` | wk_serv_secret: one of its four secrets contains {enemy}, which this pack never filled, so the event was dropped 1 time in 4. |
| `EVT-TEXT-DIET` | The text diet (event text <= 80 words, choices <= 12) had three misses: two 13-word choices, and rl_sec_calf, whose 59-word intro plus the public story it pulls from the lore rendered at about 83 words. |
| `TXT-MENTOR-LEGACY` | The "The teacher" mastery still promised "+1 legacy", a system that was removed. |

## Tests

`tokens` in `test.mjs`. Run them with `node tests/run.mjs --features=content-fixes`.

- `EVT-DANCE-NIECE` (cycle 2, design A2): `lf_harvest_dance` said "the reeve's handsome nephew or niece" of a partner whose sex the setup had chosen. It now says one or the other.
