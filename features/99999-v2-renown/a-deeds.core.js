// 99999-v2-renown, part 1: renown is the memory of deeds (V2_SPEC complaint 15, src/v2/renown.js).
//
// The game kept fame as one 0-100 number that every success pushed up, with returns that shrank but never stopped:
// a busy noble life stood at 100 by its forties (playtest 1: "renown at 100 by 38"). Now every gain of fame the
// player makes is a deed, weighted by the odds it beat (the check's chance, the duel's gap) and by who saw it (alone,
// comrades, company, army, court, realm), and kept in p.rn.d. Renown is v2's renown(): the best deed counts fully,
// the next ones less and less, and deeds fade over the years, so a life of small deeds levels off and one great deed
// outweighs many small ones. The game's fame (p.fame, which conditions, checks and thresholds read) is derived from
// it on a curve that never reaches 100: F(R) = 100 R^a / (R^a + K^a).
//
// What does not fade: the standing you were born to (a royal's, a great house's) is a base, and a name once made
// keeps half of its best (the peak). A disgrace (a fall of fame) is a stain that fades the same way.
// Direct writes to p.fame (a start, an event that sets it) are folded into the base, so nothing the game does is lost.
// Only the player keeps deeds; other people keep the game's fame as it was (their words come from the same curve).
// Engine only: no draws here (promotion's draws are in b-promo, from A.rand).
(function () {
  const V = A.V2 && A.V2.renown;
  if (!V) return;
  const RN = A.RN = A.RN || {};
  RN.on = true;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // the curve from renown (v2's units: 3 known to comrades ... 90 a name in the realm ... 500 a living legend) to fame
  // The game's fame points are worth SCALE of v2's weight units (a battle the army saw, fame 3, is a deed of 18: "talked
  // about in camp"; a council seat, fame 6 at court, 48: "known across the province"). K is the renown at which fame
  // stands at 50; the curve reaches 64 at "a name in the realm" (90), 78 at "famous" (200), 89 at "a living legend" (500).
  RN.SCALE = 2; RN.K = 45; RN.A = 0.85;
  RN.F = R => (R > 0 ? 100 * Math.pow(R, RN.A) / (Math.pow(R, RN.A) + Math.pow(RN.K, RN.A)) : 0);
  RN.Finv = f => { f = clamp(+f || 0, 0, 99.5); return f > 0 ? RN.K * Math.pow(f / (100 - f), 1 / RN.A) : 0; };
  RN.FADE = 0.88;           // as v2's renown(): a deed's weight a year later
  RN.KEEP = 0.5;            // a name once made keeps this share of its best
  RN.MAX = 60;              // deeds kept (the faded small ones go first)
  RN.isPC = p => !!(p && A.S && p.id === A.S.pc);
  const year = () => A.S.year;
  const month = () => { try { return A.monthOf(A.today()).m; } catch (e) { return 0; } };

  // p.rn: { d: deeds [{ w, year, month, text, field }], s: stains [{ w, year }], b: base renown, pk: best renown of
  // the deeds, f: the fame last written }. A save from before has none: the fame it holds becomes the base.
  RN.st = function (p) {
    let r = p.rn;
    if (!r || typeof r !== 'object' || !Array.isArray(r.d)) {
      r = p.rn = { d: [], s: [], b: RN.Finv(p.fame || 0), pk: 0, f: p.fame || 0 };
    }
    if (!Array.isArray(r.s)) r.s = [];
    if (!Number.isFinite(r.b)) r.b = 0;
    if (!Number.isFinite(r.pk)) r.pk = 0;
    return r;
  };
  // someone wrote p.fame directly since we last did: that change goes into the base
  RN.sync = function (p) {
    const r = RN.st(p), f = Number.isFinite(p.fame) ? p.fame : 0;
    if (Number.isFinite(r.f) && Math.abs(f - r.f) > 1e-6) r.b = Math.max(0, r.b + RN.Finv(f) - RN.Finv(r.f));
    r.f = f;
    return r;
  };

  // ---- what a deed is worth --------------------------------------------------------------------------------------------
  // odds beaten: a sure thing counts once; a deed at even odds about 1.4 times; one at one chance in five about twice;
  // one at one chance in twenty about 2.8 times
  RN.oddsMult = q => (q == null || !(q < 1) ? 1 : 1 + 0.6 * Math.log(1 / clamp(q, 0.03, 1)));
  const WIT = ['alone', 'comrades', 'company', 'army', 'court', 'realm'];
  const more = (a, b) => (WIT.indexOf(a) >= WIT.indexOf(b) ? a : b);
  // a large change of fame in the game's own scale was a public thing: no quieter than this
  RN.witByMagnitude = d => (d >= 10 ? 'court' : d >= 5 ? 'company' : 'comrades');
  RN.ctxStack = [];
  RN.within = function (ctx, fn, self, args) {
    RN.ctxStack.push(ctx);
    try { return fn.apply(self, args); } finally { RN.ctxStack.pop(); }
  };
  RN.fieldOf = function (p) {
    if (p.mil || p.company) return 'war';
    if (p.job) return 'work:' + (A.pathOfCareer ? A.pathOfCareer(p.job.c) : 'common');
    if (p.ruler || p.office) return 'court';
    return 'life';
  };
  // where the deed happened: the explicit context, else what is at the head of the queue
  RN.context = function (p, d) {
    const c = Object.assign({}, RN.ctxStack[RN.ctxStack.length - 1] || {});
    const q = A.S && A.S.queue && A.S.queue[0];
    if (!c.wit && q) {
      if (q.type === 'duel' && q.d) {
        const D = q.d;
        c.wit = D.kind === 'tourney' ? 'court' : D.kind === 'duel' ? 'company' : 'comrades';
        c.field = c.field || (D.kind === 'tourney' || D.kind === 'duel' ? 'arms' : null);
        if (c.q == null && Number.isFinite(D.gap) && (D.result === 'win' || D.result === 'beastfled')) c.q = 1 / (1 + Math.exp(D.gap / 6));
        if (!c.text && D.b && D.b.short) c.text = (D.kind === 'tourney' ? 'the lists against ' : 'the fight with ') + D.b.short;
      } else if (q.type === 'mission' && q.m) {
        c.wit = q.m.isBattle ? 'army' : 'company'; c.field = c.field || 'war';
        if (!c.text && q.m.title) c.text = q.m.title;
      } else if (q.type === 'battle' || q.type === 'v2battle') {
        c.wit = 'army'; c.field = c.field || 'war';
        const b = q.b || {};
        if (!c.text && (b.title || b.place)) c.text = b.title || 'the battle at ' + b.place;
      } else if (q.type === 'event' && !q.result) {
        c.wit = 'comrades';
        const L = A.V2S && A.V2S.last;
        if (c.q == null && L && L.success && L.pct != null) c.q = clamp(L.pct / 100, 0.01, 1);
        const e = A.EV && A.EV[q.ev];
        if (!c.text && e && typeof e.title === 'string') c.text = e.title;
      }
    }
    c.wit = more(c.wit || 'comrades', RN.witByMagnitude(d));
    c.field = c.field || RN.fieldOf(p);
    if (!c.text) {
      const last = (p.deeds || [])[p.deeds && p.deeds.length - 1];
      c.text = last && last.y === year() ? String(last.t || '') : '';
    }
    return c;
  };

  // record one deed (the weight is in the game's fame points) and keep the list short
  RN.record = function (p, d, ctx) {
    const r = RN.st(p), c = ctx || RN.context(p, d);
    const w = d * RN.SCALE * RN.oddsMult(c.q);
    const out = V.recordDeed({ deeds: r.d }, { weight: w, witnesses: c.wit, year: c.year != null ? c.year : year(), month: c.month != null ? c.month : month(),
      text: String(c.text || '').replace(/[<>"]/g, '').slice(0, 80), field: c.field });
    // who saw it and the odds it beat, for the Renown tip's words (a deed from an older save has neither)
    const last = r.d[r.d.length - 1];
    if (last) { last.wit = WIT.includes(c.wit) ? c.wit : 'comrades'; if (Number.isFinite(c.q) && c.q < 1) last.q = Math.round(clamp(c.q, 0, 1) * 1000) / 1000; }
    if (r.d.length > RN.MAX) {
      const y = year(), fw = x => x.w * Math.pow(RN.FADE, Math.max(0, y - x.year));
      r.d.sort((a, b) => fw(b) - fw(a)); r.d.length = RN.MAX; r.d.sort((a, b) => a.year - b.year || (a.month || 0) - (b.month || 0));
    }
    return out;
  };
  RN.stain = function (p, d) {
    const r = RN.st(p);
    r.s.push({ w: Math.abs(d), year: year() });
    if (r.s.length > 30) r.s.splice(0, r.s.length - 30);
  };
  // renown now, in v2's units: the base, plus the share of the best a name keeps, plus the rest of what the deeds are
  // worth now (so every new deed adds, and a name made long ago fades to half its best, never to nothing)
  RN.R = function (p, y) {
    const r = RN.st(p); y = y != null ? y : year();
    const rd = V.renown({ deeds: r.d }, y);
    if (rd > r.pk) r.pk = rd;
    return r.b + RN.KEEP * r.pk + (1 - RN.KEEP) * rd;
  };
  RN.stains = function (p, y) {
    const r = RN.st(p); y = y != null ? y : year();
    let s = 0; for (const x of r.s) s += x.w * Math.pow(RN.FADE, Math.max(0, y - x.year));
    return s;
  };
  RN.fameOf = (p, y) => clamp(RN.F(RN.R(p, y)) - RN.stains(p, y), 0, 100);
  RN.apply = function (p) {
    const r = RN.st(p), f = RN.fameOf(p);
    p.fame = f; r.f = f;
    return f;
  };

  // ---- every change of the player's fame goes through here -------------------------------------------------------------
  const fame0 = A.fame;
  A.fame = function (p, d) {
    if (!RN.on || !RN.isPC(p) || !Number.isFinite(d) || !d || p.alive === false) return fame0.apply(this, arguments);
    try {
      RN.sync(p);
      if (d > 0) RN.record(p, d); else RN.stain(p, d);
      RN.apply(p);
    } catch (e) { console.error('v2 renown', e); return fame0.apply(this, arguments); }
  };
  // deeds fade month by month
  A.onMonth.push(pc => { try { if (RN.on && RN.isPC(pc)) { RN.sync(pc); RN.apply(pc); } } catch (e) { console.error('v2 renown month', e); } });

  // battles the world sim fights (a division's fight): seen by the army
  if (A.fightEnd) { const fe = A.fightEnd; A.fightEnd = function () { return RN.within({ wit: 'army', field: 'war' }, fe, this, arguments); }; }

  // ---- words -----------------------------------------------------------------------------------------------------------
  // renown in words (v2's renownWords), for anyone's fame: the player's, or another person's on the same curve
  RN.words = f => V.renownWords(RN.Finv(f));
  RN.wordsOf = p => (p ? RN.words(p.fame || 0) : 'unknown');
  // the deeds that made the name, best first (for the profile)
  RN.best = function (p, n = 3) {
    if (!p || !p.rn || !Array.isArray(p.rn.d)) return [];
    const y = year();
    return p.rn.d.filter(x => x.text).map(x => ({ x, v: x.w * Math.pow(RN.FADE, Math.max(0, y - x.year)) }))
      .sort((a, b) => b.v - a.v || b.x.w - a.x.w).slice(0, n).map(o => o.x);
  };

  // the profile and every 0-100 renown number become v2's words (99993-v2-stats' bands; here, the renown curve's)
  const VS = A.V2S;
  if (VS && VS.band) {
    const band0 = VS.band;
    VS.band = function (k, v) { return /^(renown|fame)$/i.test(String(k)) ? RN.words(+v) : band0.apply(this, arguments); };
  }
})();
