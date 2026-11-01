// v2 stats, part 2: every event check is decided by A.V2.odds.attempt() (src/v2/odds.js), with blunders and surges.
//
// The old chain still works out the honest chance: A.checkOdds and its wrappers (75-fair-checks' life stage,
// 48-fight-ladder's fighting worth, 30-get-to-know, 67-memory-weave, 81-pacing). attempt() then plays it out: the chance
// becomes the edge (logit p, so with no blunder and no surge it wins exactly as often as before, and the first draw
// decides as A.chance did), then judgment, fatigue and overconfidence can throw a won fight, and will, under real stakes,
// can win a lost one. A surge that wins against long odds is a breakthrough: the body's ceiling rises for good.
// The draws are the game's own (A.rand), so a life replays exactly from its seed.
const VS = A.V2S, OD = A.V2.odds, B = A.V2.body;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const logit = p => Math.log(p / (1 - p));
VS.K = 2.45; // odds.js: edge = ln(capability / difficulty) x 2.45

// the game's dice in the shape attempt() takes. next() is 1 - A.rand(), so the first draw wins exactly when A.rand() < p
VS.rng = { next: () => 1 - A.rand(), chance: p => A.rand() < p };
VS.N = { attempts: 0, blunders: 0, surges: 0, breakthroughs: 0 };

// the capability against a difficulty of 1 that gives this chance (blunders and surges aside)
VS.capOf = pct => Math.exp(logit(clamp(pct / 100, 0.004, 0.996)) / VS.K);
VS.oddsOf = pct => OD.oddsWords(VS.capOf(pct), 1);

// the person's part in it: judgment and will from the v2 mind, fatigue from health and weariness, mood from happiness
VS.minds = function (p) {
  const s = p && p.st ? VS.stats(p) : null;
  return {
    judgment: s ? s.judgment : 100, will: s ? s.will : 100,
    fatigue: p ? clamp((p.flags && p.flags.weary ? 0.3 : 0) + (p.health != null ? Math.max(0, 60 - p.health) / 60 : 0), 0, 1) : 0,
    mood: p && p.happy != null ? clamp((p.happy - 50) / 50, -1, 1) : 0,
  };
};
// how much rides on it: a fight or a deadly loss most, a choice whose loss costs little least
VS.stakesOf = function (check, ch) {
  if (check && check.stakes != null) return check.stakes;
  if (check && check.fight) return 0.9;
  const lose = ch && ch.lose && ch.lose.fx;
  if (lose && typeof lose === 'object' && (lose.die || lose.wound || lose.prison || lose.duel || lose.beast)) return 0.8;
  return 0.5;
};
VS.statOfCheck = function (check) {
  if (!check) return null;
  for (const k of [check.s, check.s2]) if (k && GD.STATS.includes(k)) return k;
  if (check.fight) return 'str';
  return VS.STAT_OF_SKILL[check.s] || null;
};
// roll a chance (0..1) for p through attempt(); returns the attempt's result (success, tier, reasons, ...)
VS.attempt = function (p, chance, opts = {}) {
  const m = VS.minds(p);
  const r = OD.attempt(VS.rng, Object.assign({ capability: VS.capOf(chance * 100), difficulty: 1, stakes: opts.stakes != null ? opts.stakes : 0.5, label: opts.label || '' }, m));
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
// an event check, as A.eventChoose rolls it (patch V2S-ROLL): the chance the old chain gives, played out by attempt()
VS.roll = function (pc, check, ch) {
  const pct = A.checkOdds(pc, check);
  const r = VS.attempt(pc, pct / 100, { stakes: VS.stakesOf(check, ch), stat: VS.statOfCheck(check), label: check && check.s });
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
