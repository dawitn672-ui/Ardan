// W1-2 "minds" (R1's core, rule 18, D-062, D-064 point 9, D-069): one way of deciding for every decider.
//
//   decide(mind, kind, options, opts) -> record
//     mind     { id, temper: { pride, wrath, caution, patience, honor, greed, warmth, zeal, social, ambition } (each -1..1),
//                feel: [feeling], grudges: [grudge] }   (every field optional: a missing temper is an even one)
//     options  [{ id, at, label, reasons: [{ kind, weight, source, label, pub }], feeds: ['pride', 'anger', 'grudge', ...] }]
//     opts     { rand: () => [0, 1), year, band, at }
//   A reason's weight is in log-odds units: +1 makes an option e (2.7) times likelier in a draw. Its kind says which part
//   of the temper bends it (KINDS); its source points at the record that made it (an insult, a debt, a relation, a count).
//   Feelings ({ k, at, heat, cause, since }) add reasons of their own to the options that feed on them, and their heat
//   discounts the reckoning of a hot-headed decider (a cold one's never). The best option wins; only when others come
//   within the band of it does a seeded draw choose among those, weighted by e^score. That is the only chance: dice
//   among reasons, never instead of them.
//   The record: { y, who, k, at, chose, s, why: [reason], not: [reason], rej: [[id, score]], drawn, form } with reasons
//   as [label, weight, kind, source, pub]: the three heaviest for, the two heaviest against (the option's own reasons
//   against it, then the runner-up's for it), the options rejected, whether a draw chose, and whether the temper pushed
//   toward the choice (+1, true to form) or away from it (-1, against his nature).
//   feel(mind, k, cause, heat) lights a feeling (and writes a grudge for a wrong); cool(mind, months) cools them.
// Pure: no globals, no Math.random, no Date. The game's wiring is src/people/9999950-why/why.core.js (A.WHY).

export const AXES = ['pride', 'wrath', 'caution', 'patience', 'honor', 'greed', 'warmth', 'zeal', 'social', 'ambition'];

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const r2 = x => Math.round(x * 100) / 100;
const ax = (T, k) => (T && isFinite(T[k]) ? clamp(+T[k], -1, 1) : 0);

// how each kind of reason is bent by the temper: a multiplier on its weight, clamped to 0.1..2.5
// (war.md §11.1: "a proud man weighs an insult double; a greedy one counts coin; a cautious one counts spears twice")
export const KINDS = {
  insult: T => 1 + ax(T, 'pride'),
  grudge: T => 1 + .5 * ax(T, 'wrath') + .25 * ax(T, 'pride'),
  reckoning: T => 1 + .6 * ax(T, 'caution'),
  fear: T => 1 + .6 * ax(T, 'caution'),
  cost: T => 1 + .4 * ax(T, 'caution') - .3 * ax(T, 'ambition'),
  coin: T => 1 + .8 * ax(T, 'greed'),
  duty: T => 1 + .6 * ax(T, 'honor'),
  debt: T => 1 + .6 * ax(T, 'honor'),
  loyalty: T => 1 + .6 * ax(T, 'honor'),
  kin: T => 1 + .6 * ax(T, 'warmth'),
  faith: T => 1 + .8 * ax(T, 'zeal'),
  ambition: T => 1 + .8 * ax(T, 'ambition'),
  want: T => 1 + .4 * ax(T, 'ambition'),
  claim: T => 1 + .3 * ax(T, 'pride') + .3 * ax(T, 'ambition'),
  merit: () => 1,
  temper: () => 1,
  feeling: () => 1,
  chance: () => 1,
};
export const bend = (kind, T) => clamp((KINDS[kind] || KINDS.temper)(T), .1, 2.5);

// how hot-headed: heat discounts this share of his reckoning (0 for a cold man)
export const hotness = T => clamp(.35 + .45 * ax(T, 'wrath') + .3 * ax(T, 'pride') - .45 * ax(T, 'patience') - .25 * ax(T, 'caution'), 0, 1);

// the feelings (war.md §11.1's table): the temper axis that feeds each, its cooling a month, and whether it is a wrong
// (a wrong is written into the grudge ledger, where it outlasts the heat)
export const FEELINGS = {
  pride: { axis: 'pride', cool: .07, wrong: true, word: 'wounded pride' },
  anger: { axis: 'wrath', cool: .12, wrong: true, word: 'anger' },
  grief: { axis: 'warmth', cool: .04, wrong: true, word: 'grief' },
  fear: { axis: 'caution', cool: .10, wrong: false, word: 'fear' },
  greed: { axis: 'greed', cool: .10, wrong: false, word: 'greed' },
  shame: { axis: 'pride', cool: .05, wrong: true, word: 'shame' },
  love: { axis: 'warmth', cool: .05, wrong: false, word: 'loyalty' },
  zeal: { axis: 'zeal', cool: .05, wrong: false, word: 'zeal' },
};
export const T = {
  feelW: 3,        // a feeling at heat 1 adds this much (log-odds) to an option that feeds on it, before the temper
  maxDisc: .85,    // heat discounts a hot man's reckoning by at most this share
  band: 1.5,       // options within this of the best go to the draw
  maxFeel: 4,      // feelings a mind carries at once
  maxGrudge: 6,    // grudges a mind keeps
  gone: .06,       // a feeling below this heat is gone
  grudgeFade: .12, // a grudge's weight fades by e^-(fade * years), slower for a vengeful man
  keepWhy: 3, keepNot: 2, keepRej: 3,
};

const sameAt = (a, b) => a == null || b == null || String(a) === String(b);

// the heat of the hottest feeling aimed at `at` (or any, when at is null)
export function heatAt(mind, at) {
  let h = 0;
  for (const f of (mind && mind.feel) || []) if (f && sameAt(f.at, at) && f.heat > h) h = f.heat;
  return h;
}

const reasonOut = r => [String(r.label || r.kind), r2(r.w), r.kind, r.source == null ? null : r.source, r.pub ? 1 : 0];

// score one option: its reasons bent by the temper, the reckoning discounted by heat, the feelings and grudges it feeds on
export function weigh(mind, option, opts = {}) {
  const Tm = (mind && mind.temper) || {};
  const at = option.at != null ? option.at : opts.at;
  const disc = Math.min(T.maxDisc, heatAt(mind, at) * hotness(Tm));
  const rs = [];
  let raw = 0;
  for (const r of option.reasons || []) {
    if (!r || !isFinite(r.weight)) continue;
    let w = r.weight * bend(r.kind, Tm);
    if (r.kind === 'reckoning' && disc > 0) w *= 1 - disc;
    raw += r.weight;
    rs.push({ kind: r.kind, label: r.label, source: r.source, pub: !!r.pub, w, raw: r.weight });
  }
  const feeds = option.feeds || [];
  if (feeds.length) {
    for (const f of (mind && mind.feel) || []) {
      const F = FEELINGS[f && f.k];
      if (!F || !feeds.includes(f.k) || !sameAt(f.at, at)) continue;
      const base = f.heat * T.feelW, w = base * clamp(1 + ax(Tm, F.axis), .2, 2.5);
      raw += base;
      const c = f.cause || {};
      rs.push({ kind: 'feeling', feeling: f.k, label: cap(F.word) + (c.label ? ': ' + c.label : ''), source: f.cause || null, pub: !!c.pub, w, raw: base });
    }
    if (feeds.includes('grudge')) {
      const y = opts.year != null ? opts.year : 0, fade = T.grudgeFade * clamp(1 - .8 * ax(Tm, 'wrath'), .2, 2);
      for (const g of (mind && mind.grudges) || []) {
        if (!g || !sameAt(g.at, at)) continue;
        const yrs = Math.max(0, y - (g.y || y)), base = (g.w || 1) * Math.exp(-fade * yrs);
        if (base < .05) continue;
        const c = g.cause || {};
        raw += base;
        rs.push({ kind: 'grudge', label: (c.label ? cap(c.label) : 'An old wrong') + (yrs >= 1 ? `, carried ${yrs} year${yrs === 1 ? '' : 's'}` : ''), source: g.cause || null, pub: !!c.pub, w: base * bend('grudge', Tm), raw: base });
      }
    }
  }
  const score = rs.reduce((a, r) => a + r.w, 0);
  return { id: option.id, at, option, reasons: rs, score, raw, disc };
}

const cap = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };

export function decide(mind, kind, options, opts = {}) {
  const list = (options || []).filter(o => o && o.id != null);
  if (!list.length) return null;
  const scored = list.map(o => weigh(mind, o, opts));
  let best = scored[0];
  for (const s of scored) if (s.score > best.score) best = s;
  const band = opts.band != null ? opts.band : T.band;
  const close = scored.filter(s => best.score - s.score <= band);
  let chosen = best, drawn = false;
  if (close.length > 1 && typeof opts.rand === 'function') {
    const ws = close.map(s => Math.exp(s.score - best.score)), tot = ws.reduce((a, b) => a + b, 0);
    let x = opts.rand() * tot;
    chosen = close[close.length - 1];
    for (let i = 0; i < close.length; i++) { x -= ws[i]; if (x <= 0) { chosen = close[i]; break; } }
    drawn = true;
  }
  const others = scored.filter(s => s !== chosen).sort((a, b) => b.score - a.score);
  const runner = others[0] || null;
  const pro = chosen.reasons.filter(r => r.w > 0).sort((a, b) => b.w - a.w).slice(0, T.keepWhy);
  const con = chosen.reasons.filter(r => r.w < 0).map(r => ({ ...r })).sort((a, b) => a.w - b.w);
  if (runner) for (const r of runner.reasons.filter(r => r.w > 0).sort((a, b) => b.w - a.w)) con.push({ ...r, w: -r.w });
  // the temper's push: how much the bending moved the chosen option against its runner-up
  const lean = (chosen.score - chosen.raw) - (runner ? runner.score - runner.raw : 0);
  return {
    y: opts.year != null ? opts.year : null,
    who: mind && mind.id != null ? mind.id : null,
    k: kind,
    at: chosen.at != null ? chosen.at : (opts.at != null ? opts.at : null),
    chose: chosen.id,
    s: r2(chosen.score),
    why: pro.map(reasonOut),
    not: con.slice(0, T.keepNot).map(reasonOut),
    rej: others.slice(0, T.keepRej).map(s => [s.id, r2(s.score)]),
    drawn,
    form: lean > .1 ? 1 : lean < -.1 ? -1 : 0,
  };
}

// light a feeling: { k, at, heat, cause, since }. The heat lit follows the temper (a hot man burns hotter); the same
// feeling at the same target merges (the hotter heat, a little more). A wrong goes into the grudge ledger too.
export function feel(mind, k, cause, heat = 1, opts = {}) {
  const F = FEELINGS[k];
  if (!mind || !F) return null;
  const Tm = mind.temper || {};
  const lit = clamp(heat * (.45 + .55 * hotness(Tm) + .25 * ax(Tm, F.axis)), .05, 1.5);
  const at = cause && cause.at != null ? cause.at : null;
  mind.feel = Array.isArray(mind.feel) ? mind.feel : [];
  let f = mind.feel.find(x => x && x.k === k && String(x.at) === String(at));
  if (f) { f.heat = r2(Math.min(1.5, Math.max(f.heat, lit) + .25 * Math.min(f.heat, lit))); f.cause = cause || f.cause; }
  else {
    f = { k, at, heat: r2(lit), cause: cause || null, since: opts.year != null ? opts.year : null };
    mind.feel.push(f);
    if (mind.feel.length > T.maxFeel) { mind.feel.sort((a, b) => b.heat - a.heat); mind.feel.length = T.maxFeel; }
  }
  if (F.wrong && at != null) {
    mind.grudges = Array.isArray(mind.grudges) ? mind.grudges : [];
    mind.grudges.push({ at, y: opts.year != null ? opts.year : 0, w: r2(clamp(heat, .2, 1.5)), cause: cause || null });
    if (mind.grudges.length > T.maxGrudge) mind.grudges.splice(0, mind.grudges.length - T.maxGrudge);
  }
  return f;
}

// cool every feeling by `months`: a vengeful man's slowly, a forgiving man's fast; gone below T.gone
export function cool(mind, months = 1) {
  if (!mind || !Array.isArray(mind.feel) || !mind.feel.length) return 0;
  const Tm = mind.temper || {}, rate = clamp(1 - .8 * ax(Tm, 'wrath'), .3, 2);
  for (const f of mind.feel) {
    const F = FEELINGS[f && f.k];
    if (F) f.heat = r2(f.heat * Math.exp(-F.cool * rate * months));
  }
  mind.feel = mind.feel.filter(f => f && FEELINGS[f.k] && f.heat >= T.gone);
  return mind.feel.length;
}

// "Because: ...; despite: ..." in plain words, from a record; `pubOnly` keeps to what anyone could know
export function tell(rec, pubOnly = false) {
  if (!rec) return '';
  const ok = r => r && (!pubOnly || r[4]);
  const pro = (rec.why || []).filter(ok).map(r => lower(r[0]));
  const con = (rec.not || []).filter(ok).map(r => lower(r[0]));
  if (!pro.length) return '';
  return `Because: ${pro.join('; ')}.${con.length ? ` Despite: ${con.join('; ')}.` : ''}`;
}
const lower = s => { s = String(s || ''); return /^[A-Z][a-z]/.test(s) && !/^(I|The [A-Z])/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; };
