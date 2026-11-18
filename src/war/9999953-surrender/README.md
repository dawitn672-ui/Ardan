# 9999953-surrender: surrender or defeat (W1-5)

**Aspect:** the owner's answer 6 (order 54, D-062): "They end when one side surrenders or is defeated." `docs/design/war.md`
§11.3 and §11.4; D-064 point 10; D-091 to D-096 · **Kind:** system, three readable core files over the v2 engine's
`src/war/engine/surrender.js`; edits in the release (the war score, `A.checkPeace`, `A.peaceOdds`, `A.warYear`,
`A.warFront` and `A.wsScore` retired to `archive/w1-5-war-score-and-peace`), in 20-ai-personality, 68-reasons-for-war,
09-engine-at-scale, 57-world-chronicle and 994-careers. No events.

## What it does

**A war ends only by surrender or defeat.** There is no score, no timer and no peace nobody asked for.

- **Defeat is a fact** (`A.WAR.defeated`, `E.defeated`): a side with no realm left; a leader gone with no one to take up
  the war; its capital fallen and no host left in the field (under a tenth of its largest); every host broken (under one
  in sixteen) with half its people under enemy soldiers; a rising whose leader is dead. A defeated side is asked nothing:
  the victor names the peace.
- **Surrender is a decision** (`A.WAR.yieldQ`): each side's decider (the ruler of its leading realm; a fallen leader's side
  passes to its next living realm) re-reads two pans every four weeks of the war clock, and after a great battle (at most
  once a fortnight), through `A.WHY.decide`:
  - **to fight on**: the cause (what he went to war for; half of it if he did not begin the war), defending his own land,
    his pride, a war still young (his lords' men still answering the summons), his host the stronger, allies in the
    field, the enemy at war elsewhere, the land and capital he holds, battles won, his word to his allies, and what
    yielding would cost (the terms the other side would name);
  - **to ask for terms**: his hosts broken, the enemy's host the stronger, battles lost, the realm's weariness, an empty
    chest, debt, years of war, his land and capital held by the enemy, the realm shaking, a rising, a second enemy, a peace
    faction, his age (told as a man's years), illness, a regency, an attack that has won nothing, blows struck at his
    side by events, and his temper (20-ai-personality's `A.aiYield`, 68-sharpened).
  Feelings at the foe (wounded pride, anger, shame, zeal, grief) feed the first; fear the second. The side leaning more
  toward asking is asked first. Options within the band (0.4) go to A.WHY's seeded draw; that is the only chance.
- **Envoys ride** (`A.WAR.day`): capital to capital at 45 km a day (2 to 40 days a leg). An ask reaches the victor, who
  names his terms (`A.WAR.want`: his cause's, everything he holds, nothing yet when the realm is all but his, or, from a
  defeated realm he nearly holds, the realm itself); the terms ride back and the asker takes or refuses them
  (`A.WAR.answer`); asked everything, he counters with the cause's terms, which the victor takes or refuses
  (`A.WAR.takeCounter`). The stronger, tired himself, may offer his cause's terms (`A.WAR.offerQ`, pathway 7). The
  fighting goes on while they ride. A refusal: the asker waits four months.
- **Terms are real things** (`A.WAR.terms`), from why the victor fought (`w.cb`) and what he holds: land his soldiers
  hold (his claims first; 68-reasons-for-war's cap on how much one peace takes still applies), a capital, coin (a share
  of the loser's yearly income), tribute, a public submission, alliances renounced, a claim given up (a rising's lands
  returned), a claimant crowned, a land's freedom, the whole realm, ten years of sworn peace. They hand over for real:
  land through `A.transferProv` (and the titles and fiefs that follow it), a crown through `A.makeRuler`, a realm
  through `A.realmFalls`, tribute through the overlord field. One holder per post, as everywhere.
- **The record** (`w.end`): `{ y, d, kind: 'surrender' | 'defeat', by (the side that yielded), who, asked (the day it was
  asked), path (1 to 8: the lost battle, exhaustion, the king or capital taken, revolt at home, the army gone home, the
  decider dead, terms offered and taken, conquest), terms: [{ k, label }], why: [reasons], told, signed: [the two
  rulers] }`, made by every ending (an event's peace, a realm's fall and a test's too, read from what they were by
  `A.WAR.endOf`), kept on the world record's peace entry and in `A.S.warEnds` (the last 40). Decisions are in `A.S.why`
  (kinds `yield` and `terms`, 20 each) and in the rulers' log (20-ai-personality).
- **Blows** (`A.WAR.blow`): an event that hurts a side (a mission, volunteers in borrowed colours, a hostage sent home with
  terms, Tessar betrayed) is a named reason in its pan to ask, fading over a year; at most six a war.

## What the player sees

- **News by rank** (`A.WAR.tell`): the ruler and his council hear that their crown sends envoys to ask for terms, and why
  ("Because: ...; Despite: ...", A.WHY's words); a commander, a General or a great lord hears that envoys have ridden; the
  other side's council hears they are coming; everyone in the war hears the peace and its terms; the world hears the
  peace. No numbers.
- **Only a ruler of a side's leading realm** decides for it, and only through his own choices: the peace table (terms
  in words, each with how heavy a demand it is, how the other crown would answer in words and a tipped scale, and its
  reasons; no percentage; his envoys ride and come back with its answer), the War Room's three buttons (each sends envoys
  with set terms), and choice cards: envoys asking him for terms (his cause's terms, all he holds, or send them away), a
  counter-offer, terms offered him, a beaten foe's peace to dictate. A card dismissed unanswered is answered as a ruler
  who ignores envoys answers (they go home; a beaten foe's peace is his cause's). A councillor's counsel of peace is one
  reason among the ruler's own (`A.WAR.counsel`).

## State (all optional; old saves load)

`w.d0` (its first day; set by `A.startWar`), `w.r0` (the two rulers when it began), `w.pk` (each side's largest host),
`w.blows`, `w.ask` (envoys on the road), `w.quiet`, `w.offerD`, `w.readD`, `w.stir`, `w.end` (now a record, was a year),
`A.S.warEnds`. An old save's war goes on: `w.score`, `w.bscore` and `w.manualPeace` are dropped on load
(`A.WAR.convert`), and its first reading counts its hosts as they stand.

## Tests

- `tests/v2/surrender.test.js` (unit): the pans, defeat's five conditions, what terms cost, the pathways, the cautious and
  the proud king (50 of 50 against 0 of 50), a victor who demands everything fights longer (10 of 10 seeds).
- `test.mjs` (browser): `w5NoScore` (no score, `A.checkPeace` or `A.peaceOdds` in the build), `w5WarsEnd` (three worlds of
  twenty years: every ending recorded), `w5Tempers`, `w5AiEnding` (an ask, the envoys, the terms, the land; a defeat),
  `w5Player` (the peace table, envoys, cards, at 375 by 667), `w5NewsByRank`, `w5OldSaves`, `w5Deterministic`, and the long
  `w5TwoCenturies` (four worlds of two hundred years).
