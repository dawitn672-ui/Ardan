// v2 stats, part 2: every event check is decided by A.V2.odds.attempt() (src/people/engine/odds.js), with blunders and surges.
//
// The old chain still works out the honest chance: A.checkOdds and its wrappers (75-fair-checks' life stage,
// 48-event-fight-rules's fighting worth, 30-get-to-know, 67-choice-memories, 81-pacing). attempt() then plays it out: the chance
// becomes the edge (logit p, so with no blunder and no surge it wins exactly as often as before, and the first draw
// decides as A.chance did), then judgment, fatigue and overconfidence can throw a won fight, and will, under real stakes,
// can win a lost one. A surge that wins against long odds is a breakthrough: the body's ceiling rises for good.
// The draws are the game's own (A.rand), so a life replays exactly from its seed.
const VS = A.V2S, OD = A.V2.odds, B = A.V2.body;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const logit = p => Math.log(p / (1 - p));
VS.K = 2.45; // odds.js: edge = ln(capability / difficulty) x 2.45

// The game's dice in the shape attempt() takes. The first draw is the release's own A.chance(p), so the plain roll is
// what it always was (and a test that forces A.chance still forces it); a second draw places attempt()'s logistic noise
// inside the half that A.chance chose (the noise is then distributed exactly as attempt() draws it).
//
// One orientation for every draw. The release's dice read low as good (A.chance(p) is A.rand() < p), attempt() reads
// its rng's next() high as good (the noise is logit next()) and fires each chance(p) on a low next(), as v2's makeRng
// does (chance(p) is next() < p). So the rng attempt() gets is makeRng's shape on the game's dice turned round:
// next() is 1 - A.rand() and chance(p) is next() < p, and the noise is placed the same way, a lower second draw higher
// in the half (1 - v·q in a won half, (1 - q)(1 - v) in a lost one, kept just off the half's edge so the plain roll stays
// exactly A.chance's). A roll held low is then attempt()'s best day: the release's roll won, the noise at the top of the
// won half, and no blunder (held at 0.001, chance(p) fires only for p over 0.999; a blunder's is 0.35 at most). A roll
// held high is its worst: the roll lost and the noise at the bottom of the lost half (held at 0.999, perf is under -6.9),
// deeper than any surge lifts (5.4 at the most, with will held within 2.7 deviations). With live dice the odds, the
// blunders and the surges are distributed exactly as attempt() draws them.
// (Before, chance(p) was A.rand() < p and a won half was filled from its losing edge, against the release's dice: held
// at 0.001, A.chance won the roll, the noise sat on the edge, and the blunder chance, never under 0.002, fired every
// time and threw the check, so a test holding A.rand to win a check lost it.)
VS.realChance = A.chance;
VS.dice = function (q) {
  const won = A.chance(q), v = A.rand(), e = 1e-9;
  let first = won ? Math.min(1 - e, Math.max(1 - q + e, 1 - v * q)) : Math.max(e, Math.min(1 - q - e, (1 - q) * (1 - v)));
  const next = () => { if (first != null) { const u = first; first = null; return u; } return 1 - A.rand(); };
  return { won, rng: { next, chance: p => 1 - A.rand() < p } };
};
VS.N = { attempts: 0, blunders: 0, surges: 0, breakthroughs: 0 };

// the capability against a difficulty of 1 that gives this chance (blunders and surges aside)
VS.capOf = pct => Math.exp(logit(clamp(pct / 100, 0.004, 0.996)) / VS.K);
VS.oddsOf = pct => OD.oddsWords(VS.capOf(pct), 1);

// the person's part in it: judgment and will from the v2 mind, fatigue from health and weariness, mood from happiness
VS.minds = function (p) {
  const s = p && p.st ? VS.stats(p) : null;
  return {
    // within 2.7 standard deviations: the old willpower grows without bound through adversity (180 and more), and
    // attempt()'s surge odds grow as e^(0.7 z)
    judgment: s ? clamp(s.judgment, 60, 140) : 100, will: s ? clamp(s.will, 60, 140) : 100,
    fatigue: p ? clamp((p.flags && p.flags.weary ? 0.3 : 0) + (p.health != null ? Math.max(0, 60 - p.health) / 60 : 0), 0, 1) : 0,
    mood: p && p.happy != null ? clamp((p.happy - 50) / 50, -1, 1) : 0,
  };
};
// how much rides on it: a fight or a deadly loss most, a choice whose loss costs little least
// (playtest 2, new 1 and 2: a loss written as code, A.punish for treason or a queued gallows, and a hurt that would kill
// this person at their health now, are deadly losses too; VS.lossOf reads them, the same reading the card's chip says)
VS.stakesOf = function (check, ch, pc) {
  if (check && check.stakes != null) return check.stakes;
  if (check && check.fight) return 0.9;
  const lose = ch && ch.lose && ch.lose.fx;
  if (lose && typeof lose === 'object' && (lose.die || lose.wound || lose.prison || lose.duel || lose.beast)) return 0.8;
  try { if (lose && VS.lossOf) { const L = VS.lossOf(lose, pc); if (VS.lossDeadly(L) || VS.lossSerious(L)) return 0.8; } } catch (e) {}
  return 0.5;
};
VS.statOfCheck = function (check) {
  if (!check) return null;
  for (const k of [check.s, check.s2]) if (k && GD.STATS.includes(k)) return k;
  if (check.fight) return 'str';
  return VS.STAT_OF_SKILL[check.s] || null;
};
// roll a chance (0..1) for p through attempt(); returns the attempt's result (success, tier, reasons, ...)
VS.attemptRaw = function (p, chance, opts = {}) {
  const m = VS.minds(p), q = clamp(+chance || 0, 0.004, 0.996), D = VS.dice(q);
  const r = OD.attempt(D.rng, Object.assign({ capability: VS.capOf(q * 100), difficulty: 1, stakes: opts.stakes != null ? opts.stakes : 0.5, label: opts.label || '' }, m));
  // a test that replaces A.chance to force an outcome gets exactly that outcome
  if (A.chance !== VS.realChance) Object.assign(r, { success: D.won, blundered: false, surged: false, breakthrough: 0, reasons: [] });
  return r;
};
VS.attempt = (p, chance, opts = {}) => VS.book(p, VS.attemptRaw(p, chance, opts), opts);
// the attempt's bookkeeping: the counts, a breakthrough, VS.last
VS.book = function (p, r, opts = {}) {
  VS.N.attempts++;
  if (r.blundered) VS.N.blunders++;
  if (r.surged) VS.N.surges++;
  if (r.breakthrough && VS.isPC(p)) {
    const s = opts.stat || 'wil';
    if (VS.breakthrough(p, s, r.breakthrough, opts.label || '')) VS.N.breakthroughs++;
  }
  VS.last = r;
  return r;
};
VS.rollP = (p, chance, opts) => VS.attempt(p, chance, opts).success;

// ---- honest odds: the chance shown is the chance that happens (C9, D-040) -------------------------------------------
// attempt() wins a lost check by a surge of will and throws a won one by a blunder, so the old chain's chance q is not
// how often the check comes up: at the long end a fighter shown 3.6 in 100 won 7.5 (48's flHonest). VS.trueChance(q)
// is attempt()'s own chance of success for this person (judgment, will, fatigue, mood) and these stakes, worked out
// exactly over the noise, the blunder's depth and the surge's lift (no draw). A.checkOdds now returns it, so the card,
// the badge, the bot and the roll all read the chance that happens; VS.roll turns it back into the old chain's q
// (VS.baseFor, by bisection: trueChance rises with q) and plays attempt() on that, so the roll comes up as often as shown.
const NQ = 160, ND = 8;
VS.trueChance = function (q, m, stakes) {
  q = clamp(q, 0.004, 0.996); m = m || {};
  const e = logit(q), judgment = m.judgment != null ? m.judgment : 100, will = m.will != null ? m.will : 100;
  const fatigue = m.fatigue || 0, mood = m.mood || 0;
  const jz = (judgment - 100) / 15, overconf = e > 1 ? Math.min(1.5, (e - 1) * 0.5) : 0;
  const pB = clamp(0.025 * Math.exp(-0.7 * jz) * (1 + 1.6 * fatigue) * (1 + overconf), 0.002, 0.35);
  const wz = (will - 100) / 15, desp = clamp(-e / 3, 0, 1.5);
  const pS = stakes > 0.3 ? clamp(0.022 * Math.exp(0.7 * wz) * (0.5 + stakes) * (0.6 + desp) * (1 + mood * 0.3), 0, 0.6) : 0;
  const a = 1.5 + Math.max(0, wz) * 0.5;   // the surge's lift is uniform on [a, a + 2.5]
  const win = perf => (perf >= 0 ? 1 : pS * clamp((a + 2.5 + perf) / 2.5, 0, 1));
  let s = 0;
  for (let i = 0; i < NQ; i++) {
    const u = (i + 0.5) / NQ, perf = e + Math.log(u / (1 - u));
    let b = 0; for (let j = 0; j < ND; j++) b += win(perf - (2.5 + 2.5 * (j + 0.5) / ND));
    s += (1 - pB) * win(perf) + pB * b / ND;
  }
  return s / NQ;
};
VS.baseFor = function (p, m, stakes) {
  let lo = 0.004, hi = 0.996;
  if (VS.trueChance(lo, m, stakes) >= p) return lo;
  if (VS.trueChance(hi, m, stakes) <= p) return hi;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (VS.trueChance(mid, m, stakes) < p) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
};
// the choice a check belongs to (its stakes read the loss), found once over every event's choices
VS.chOf = new WeakMap();
VS.choiceOf = function (check) {
  if (!check || typeof check !== 'object') return null;
  if (!VS.chOfBuilt) { VS.chOfBuilt = true; for (const id in A.EV) for (const c of (A.EV[id].choices || [])) if (c && c.check && typeof c.check === 'object') VS.chOf.set(c.check, c); }
  return VS.chOf.get(check) || null;
};
VS.HONEST = true;
const checkOdds0 = A.checkOdds;
VS.oldOdds = checkOdds0;
A.checkOdds = function (pc, check) {
  const pct = checkOdds0.apply(this, arguments);
  if (!VS.HONEST || !pc || typeof pct !== 'number' || !isFinite(pct)) return pct;
  try {
    const t = VS.trueChance(pct / 100, VS.minds(pc), VS.stakesOf(check, VS.choiceOf(check), pc));
    return clamp(Math.round(t * 100), 1, 99);
  } catch (e) { return pct; }
};
// the odds popover (59-descriptions) names the honest share in a row of its own, so its rows still add up to the number
// on the button and no "Other things in play" is left for it (75's and 81's rows are read the same way). Pure.
VS.HONEST_ROW = 'Blunders and surges: your judgment, will and weariness on the day';
// checkParts(p, check, ...) and fightParts(p, spec, ctx, check, ...): the check is the 2nd or the 4th argument
for (const [name, at] of [['checkParts', 1], ['fightParts', 3]]) {
  if (!UI.TT || typeof UI.TT[name] !== 'function') continue;
  const parts0 = UI.TT[name];
  UI.TT[name] = function (p) {
    const ck = arguments[at];
    // the rows beneath (59's sums, 75's and 81's rules) are read on the old chain, so they add up to it, and the rest
    // up to the number shown is this row exactly
    const h = VS.HONEST;
    let S; VS.HONEST = false; try { S = parts0.apply(this, arguments); } finally { VS.HONEST = h; }
    try {
      if (!S || !Array.isArray(S.parts) || !p || !ck || !VS.HONEST) return S;
      const on = A.checkOdds(p, ck);
      VS.HONEST = false; let off; try { off = A.checkOdds(p, ck); } finally { VS.HONEST = true; }
      const mine = on - off; if (!mine) return S;
      const i = S.parts.findIndex(x => /^Other things in play$/.test(x[0]));
      if (i >= 0) {
        const rest = S.parts[i][1] - mine;
        S.parts.splice(i, 1, [VS.HONEST_ROW, mine]);
        if (Math.abs(rest) >= 0.5) S.parts.push(['Other things in play', rest]);
      }   // no "Other things in play" left: the rows already add up (75 and 81 took the share with this on)
    } catch (e) { console.error('honest odds tip', e); }
    return S;
  };
}
// an event check, as A.eventChoose rolls it (patch V2S-ROLL). The first draw is A.chance of the number shown, so the
// check comes up exactly as often as the card says (75's and 81's "the roll is the number shown" hold). Then the story:
// attempt() is played from the old chain's q that gives that chance (VS.baseFor) until it agrees with the draw (the
// game's own dice, at most 40 tries, almost always one or two), so a blunder or a surge is told as often as attempt()
// makes one among the checks that went that way.
VS.roll = function (pc, check, ch) {
  // the stakes the card's odds were read with (the choice the check belongs to)
  const pct = A.checkOdds(pc, check), stakes = VS.stakesOf(check, VS.choiceOf(check) || ch, pc);
  const opts = { stakes, stat: VS.statOfCheck(check), label: check && check.s };
  if (!VS.HONEST) { const r0 = VS.attempt(pc, pct / 100, opts); r0.pct = pct; return r0.success; }
  const won = A.chance(clamp(pct / 100, 0, 1)), q = VS.baseFor(pct / 100, VS.minds(pc), stakes);
  let r = null;
  for (let k = 0; k < 40 && !r; k++) { const t = VS.attemptRaw(pc, q, opts); if (t.success === won) r = t; }
  if (!r) r = { success: won, tier: won ? 'success' : 'failure', blundered: false, surged: false, breakthrough: 0, reasons: [won ? 'the better hand won' : 'outmatched'], label: opts.label };
  VS.book(pc, r, opts);
  r.pct = pct;
  return r.success;
};

// after the choice, say why it went that way when it was not the plain run of the dice
VS.WHY = {
  'overconfidence': 'Overconfidence undoes you.', 'exhaustion': 'You are too tired to do it right.', 'a lapse of judgment': 'A lapse of judgment costs you.',
  'a surge of will': 'Something in you refuses to lose.',
};
const choose = A.eventChoose;
A.eventChoose = function () {
  VS.last = null;
  const q = choose.apply(this, arguments);
  try {
    const r = VS.last;
    if (r && q && q.result && typeof q.result.text === 'string' && ((r.blundered && !r.success) || (r.surged && r.success))) {
      // a blunder is told when it cost the choice, a surge when it carried it
      const w = r.reasons.filter(x => (x === 'a surge of will' ? r.success : !r.success)).map(x => VS.WHY[x]).filter(Boolean);
      if (r.breakthrough) w.push('You have done what you should not have been able to do, and you are not the same for it.');
      q.result.why = r.reasons.slice();
      if (w.length) q.result.text = (q.result.text ? q.result.text + ' ' : '') + w.join(' ');
    }
  } catch (e) { console.error('v2 odds', e); }
  return q;
};
