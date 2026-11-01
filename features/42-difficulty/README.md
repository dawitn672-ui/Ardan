# Difficulty that changes information and recovery

**Aspect:** Balance (Road to Ten, Balance 4) · **Kind:** system and 3 patches

The plan asks that "difficulty changes information and recovery". The release's three settings (Story, Hard, Realism) change only how often people die: children, mothers in childbirth, the wounded at 0 health, and the losers of duels. They change nothing about what you are told or how fast you come back.

**What it does.**

- **Information** (patch `DIFF-ODDS`, `A.DIFF.showOdds`):
  - Story always shows each choice's odds as a number ("62% · likely").
  - Realism never does, only the words ("likely", "risky").
  - Hard keeps the player's own odds setting, as in the release.
- **Recovery:**

  | | Story | Hard | Realism |
  | --- | --- | --- | --- |
  | The year's healing (patch `DIFF-HEAL`) | ×1.5 | ×1 | ×0.7 |
  | How long a timed wound lasts (`A.addWound`) | ×0.5 | ×1 | ×1.5 |
  | How long a prison sentence runs (`A.imprison`) | ×0.5 | ×1 | ×1.25 |

  Lasting wounds (a lost eye, a limp) are lasting on every setting.
- **The creation screen says so** (patch `DIFF-SAYS`). Each setting's description now names its odds and its recovery as well as its deaths.

**Measured by** (`test.mjs`).

- `difficultyRecovery`: the same 30-year-old on each setting.

  | | Story | Hard | Realism |
  | --- | --- | --- | --- |
  | Healing in a year from 20 health | 52 | 35 | 24 |
  | Damaged lungs last | 2 years | 4 years | 6 years |
  | A four-year sentence runs | 2 years | 4 years | 5 years |

- `difficultyInformation`: the same event's choices, with the player's odds setting off and on.

  | Odds setting | Story | Hard | Realism |
  | --- | --- | --- | --- |
  | Off | number | words | words |
  | On | number | number | words |

**Rules kept.**
- Hard plays exactly as the release: every multiplier is 1, and the odds follow the player's setting. The bot league plays on Hard.
- Only the player's own wounds and sentences scale.

**Limits.**
- **Duel and battle screens** still show their odds the release's way.
- **Recovery from ruin** (debt, a lost post, a burned house) is the same on every setting.
