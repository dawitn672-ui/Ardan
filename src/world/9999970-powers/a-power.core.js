// Powers wave 1 (the owner, 2026-11-25: "make the powerscaling of this world much larger"; docs/design/powers.md).
//
// A.POWER: one power scale for every being, people and beasts alike.
//   A.POWER.level(x)       a being's level, 1 to 100 (ten levels = ten times the might); x: a person, a species id, a
//                          legend or master id, a wild individual ({ sp, key }), or a being from A.POWER.being
//   A.POWER.might(x)       the one number behind the level: a person's fighting worth in conscripts, squared
//   A.POWER.being(x)       { kind, id, n, level, might, prof, int, titles, ranged, hardy }: the level, the profile of ten
//                          capabilities (two beings of one level fight differently) and the titles, whose buffs it reads
//   A.POWER.compare(a, b)  { p, gap, word, edges, huge, close }: A's odds against B, in words, from the might AND the
//                          matchup of their profiles (flight against no bow, hide against strength, venom against a hardy
//                          body, numbers, magic against a ward, regeneration, cunning)
//   A.POWER.fighter(id)    a duel fighter for a bestiary species, built on the release's own beast fighter (close fights only)
//   A.POWER.band(level)    the words for a level (data/power.json bands), A.POWER.oddsWord(p) the odds in words
// Pure: reads the data and the people; draws no random number and writes nothing to A.S.
(function () {
  const D = A.DATA && A.DATA.power, BD = A.DATA && A.DATA.bestiary, LD = A.DATA && A.DATA.legends;
  if (!D || !BD || !LD) { console.error('[powers] data/power.json, bestiary.json or legends.json is missing'); return; }
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const PW = A.POWER = { D, BD, LD };
  const CAPS = PW.CAPS = D.capabilities.map(c => c.k);
  const SP = PW.SP = new Map(BD.species.map(s => [s.id, s]));
  const BYCRE = PW.BYCRE = new Map();
  for (const s of BD.species) if (s.cre && !BYCRE.has(s.cre)) BYCRE.set(s.cre, s);
  const LEG = PW.LEG = new Map(LD.legends.map(l => [l.id, l]));
  const MAS = PW.MAS = new Map(D.masters.map(m => [m.id, m]));
  const hash = s => { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  PW.hash = hash;

  // ---------------------------------------------------------------- the scale
  const LV = D.levels;
  PW.levelOf = m => clamp(Math.round(LV.perTen * Math.log10(Math.max(1e-9, m) / LV.base)), LV.min, LV.max);
  PW.mightOf = L => LV.base * Math.pow(10, L / LV.perTen);
  PW.band = L => { let b = D.bands[0]; for (const x of D.bands) if (L >= x.from) b = x; return b; };
  PW.oddsWord = p => (A.RN && A.RN.oddsWord ? A.RN.oddsWord(p)
    : p >= 0.9 ? 'a sure thing' : p >= 0.6 ? 'better than even odds' : p >= 0.4 ? 'about even odds' : p >= 0.2 ? 'long odds' : p >= 0.08 ? 'very long odds' : 'odds no one would take');
  PW.capName = k => (D.capabilities.find(c => c.k === k) || {}).n || k;

  // ---------------------------------------------------------------- people
  // a person's fighting worth in conscripts (the number his sheet shows), squared: the Lanchester strength of that band
  PW.personMight = function (p) {
    if (!p || !p.st) return 0;
    let c = 0;
    try { c = A.V2S && A.V2S.shownConscripts ? A.V2S.shownConscripts(p) : Math.exp((A.fightWorth(p) - 40.6) / 13); } catch (e) { c = 0; }
    return Math.max(1e-4, c) * Math.max(1e-4, c);
  };
  // a person's capabilities on the beings' 0-10 scale (stats are 0-100, armour's protection up to about 12)
  PW.personProf = function (p) {
    const st = k => (A.stat ? A.stat(p, k) : (p.st && p.st[k]) || 40);
    const g = p.gear || {}, arm = (GD.GEAR && GD.GEAR[g.armor]) || {};
    return {
      str: clamp(st('str') / 10, 0, 10), spd: clamp(st('spd') / 10, 0, 10), hide: clamp((arm.prot || 0) * 0.8, 0, 10),
      venom: 0, flight: 0, regen: 0, ward: clamp(st('wil') / 12, 0, 10), swarm: 0,
      cunning: clamp((st('ins') + st('int')) / 20, 0, 10), magic: 0,
    };
  };

  // ---------------------------------------------------------------- titles: honour and buffs (requirements never shown)
  PW.withTitles = function (prof, level, titles) {
    const out = Object.assign({}, prof);
    let lv = level;
    for (const t of titles || []) for (const k in t.buffs || {}) {
      if (k === 'level') lv += t.buffs[k];
      else if (k in out) out[k] = clamp(out[k] + t.buffs[k], 0, 12);
    }
    return { prof: out, level: lv };
  };
  // a name with its most honoured title ("Vaskareth the Ash-Crowned")
  PW.styled = L => { const t = (L && L.titles ? L.titles.slice() : []).sort((a, b) => (b.honour || 0) - (a.honour || 0))[0]; return L ? L.n + (t ? (/^the /.test(t.n) ? ' ' : ', ') + t.n : '') : ''; };
  // titles as the player may read them: the name and the honour, never what earned it
  PW.titlesShown = b => (b && b.titles ? b.titles.map(t => ({ n: t.n, honour: t.honour || 0, buffs: Object.keys(t.buffs || {}).filter(k => t.buffs[k]) })) : []);

  // ---------------------------------------------------------------- individuals vary (temper, age, scars), from a seed
  const TEMPERS = [
    { k: 'bold', w: 'bold', lv: 1, mod: { cunning: -1 } }, { k: 'wary', w: 'wary', lv: 0, mod: { spd: 1 } },
    { k: 'sly', w: 'sly', lv: 0, mod: { cunning: 2 } }, { k: 'old', w: 'old and grey', lv: 2, mod: { spd: -1, cunning: 1 } },
    { k: 'young', w: 'young', lv: -2, mod: { spd: 1 } }, { k: 'scarred', w: 'scarred from old fights', lv: 1, mod: { hide: 1 } },
    { k: 'hungry', w: 'starving', lv: -1, mod: { spd: -1 } }, { k: 'calm', w: 'unhurried', lv: 0, mod: {} },
  ];
  PW.TEMPERS = TEMPERS;
  PW.individual = (sp, key) => TEMPERS[hash(`${sp && sp.id}|${key}`) % TEMPERS.length];

  // ---------------------------------------------------------------- beings
  PW.species = id => SP.get(id) || null;
  PW.speciesOfCre = cre => BYCRE.get(cre) || null;
  PW.being = function (x) {
    if (!x) return null;
    if (x.kind && x.prof && x.level != null) return x;
    if (typeof x === 'object' && x.st) {
      const m = PW.personMight(x), prof = PW.personProf(x);
      return { kind: 'person', id: x.id, n: A.fullName ? A.fullName(x, false) : 'a person', level: PW.levelOf(m), might: m, prof, int: 'wise', titles: [],
        ranged: !!(x.gear && x.gear.ranged), hardy: clamp(((A.stat ? A.stat(x, 'sta') : 50) || 50) / 10, 0, 10) };
    }
    if (typeof x === 'object' && x.sp) {   // a wild individual: its species, its temper, its own name and titles
      const s = SP.get(x.sp); if (!s) return null;
      const t = PW.individual(s, x.key || x.id || '');
      const prof = Object.assign({}, s.prof); for (const k in t.mod) prof[k] = clamp(prof[k] + t.mod[k], 0, 10);
      const w = PW.withTitles(prof, s.level + t.lv, (s.titles || []).concat(x.titles || []));
      return { kind: 'wild', id: x.id || s.id, sp: s.id, n: x.name || s.n, level: clamp(w.level, 1, LV.max), might: PW.mightOf(w.level), prof: w.prof,
        int: x.int || s.int, titles: x.titles || [], temper: t, ranged: s.prof.flight >= 6 || s.prof.magic >= 6, hardy: s.prof.regen };
    }
    const id = typeof x === 'string' ? x : x.id;
    if (SP.has(id)) {   // a kind may be born with a title (the oldest dragons, the gate-born demons): its buffs count
      const s = SP.get(id), w = PW.withTitles(s.prof, s.level, s.titles);
      return { kind: 'species', id, sp: id, n: s.n, level: clamp(w.level, 1, LV.max), might: PW.mightOf(w.level), prof: w.prof, int: s.int, titles: s.titles || [], ranged: s.prof.flight >= 6 || s.prof.magic >= 6, hardy: s.prof.regen };
    }
    if (BYCRE.has(id)) return PW.being(BYCRE.get(id).id);
    const L = LEG.get(id) || MAS.get(id);
    if (L) {
      const w = PW.withTitles(L.prof, L.level, L.titles);
      return { kind: LEG.has(id) ? (L.level >= 100 ? 'summit' : 'legend') : 'master', id, n: L.n, level: clamp(w.level, 1, LV.max), might: PW.mightOf(w.level), prof: w.prof, int: L.int,
        titles: L.titles || [], base: L.level, ranged: true, hardy: w.prof.regen };
    }
    return null;
  };
  PW.level = x => { const b = PW.being(x); return b ? b.level : 0; };
  PW.might = x => { const b = PW.being(x); return b ? b.might : 0; };

  // ---------------------------------------------------------------- the matchup: what one being's profile does to the other
  // edges from a's side, in log-odds; each one says why in words the player may read
  const edgesOver = function (a, b, sign, out) {
    const A_ = a.prof, B_ = b.prof, add = (w, t) => { if (w) out.push({ w: sign * w, t }); };
    const reachA = a.ranged || A_.flight >= 4 || A_.magic >= 6;
    if (B_.flight >= 6 && !reachA) add(-0.9, sign > 0 ? 'it flies, and nothing you carry reaches the sky' : 'you can take to the air where it cannot follow');
    const d1 = B_.hide - Math.max(A_.str, A_.magic); if (d1 >= 3) add(-0.15 * d1, sign > 0 ? 'its hide turns a blade' : 'your armour turns its blows');
    const d2 = B_.venom - Math.max(a.hardy || 0, A_.regen); if (d2 >= 3) add(-0.1 * d2, sign > 0 ? 'one scratch of its venom can kill' : 'your venom works on it');
    if (B_.regen >= 7 && A_.magic < 5) add(-0.4, sign > 0 ? 'its wounds close as you make them' : 'you mend faster than it can hurt you');
    const d3 = B_.swarm - A_.swarm; if (d3 >= 3) add(-0.12 * d3, sign > 0 ? 'they are many, and you are one' : 'you are many');
    const d4 = B_.magic - A_.ward; if (d4 >= 3) add(-0.1 * d4, sign > 0 ? 'its fire or frost reaches past any guard' : 'your magic finds no ward');
    const d5 = B_.cunning - A_.cunning; if (d5 >= 3) add(-0.08 * d5, sign > 0 ? 'it is cleverer than you' : 'you outthink it');
  };
  PW.compare = function (a0, b0) {
    const a = PW.being(a0), b = PW.being(b0);
    if (!a || !b) return null;
    const edges = [];
    edgesOver(a, b, 1, edges);
    edgesOver(b, a, -1, edges);
    const prof = edges.reduce((s, e) => s + e.w, 0);
    const lg = D.odds.k * Math.log(Math.max(1e-12, a.might) / Math.max(1e-12, b.might)) + prof;
    const p = 1 / (1 + Math.exp(-lg)), gap = a.level - b.level;
    edges.sort((x, y) => Math.abs(y.w) - Math.abs(x.w));
    return { p, gap, word: PW.oddsWord(p), edges, huge: Math.abs(gap) >= D.odds.hugeGap, close: Math.abs(gap) <= D.odds.closeGap, a, b };
  };
  // how a gap reads in words (no numbers beside it on a card)
  PW.gapWords = gap => (gap <= -55 ? 'beyond every rank: the whole world moves when it does' : gap <= -30 ? 'beyond anything you could ever hope to stand against' : gap <= -18 ? 'far beyond you: a host would die here'
    : gap <= -10 ? 'far stronger than you' : gap <= -4 ? 'stronger than you' : gap < 4 ? 'about your match' : gap < 10 ? 'weaker than you' : 'no match for you');

  // ---------------------------------------------------------------- a duel fighter for a bestiary species (close fights)
  // Built on the release's own beast fighter (the Evenwood Wolf's row, an animal-tier beast the duel engine already knows),
  // then given this species' body: blood, strength, speed, hide and venom from its profile, and the skill that puts its
  // duel worth where its level says (the same human fit that put the release's beasts on the scale, run backwards).
  const TEMPLATE = 'CRE-21';
  const VERB = { vermin: 'bites', hounds: 'bites', cats: 'claws', bears: 'mauls', hooved: 'gores', serpents: 'strikes', wyrms: 'rakes', dragons: 'rends',
    giants: 'clubs', ogres: 'clubs', skyborne: 'rakes', crawlers: 'stings', undead: 'claws', spirits: 'burns', demons: 'rends', deep: 'crushes', fey: 'lashes', oozes: 'engulfs', constructs: 'crushes' };
  const worthOf = f => A.CR(Object.assign({ fat: 0, burst: 0, fury: 0, adapt: 0 }, f), { round: 5 }) + (f.wdmg || 0) * 0.9 + (f.prot || 0) * 1.1;
  PW.fighter = function (id, mod) {
    const s = SP.get(id);
    if (!s || !A.BEASTS[TEMPLATE]) return null;
    mod = mod || 1;
    const f = A.fighterBeast(TEMPLATE, 1), P_ = s.prof;
    const hp = clamp(Math.round(100 * (0.6 + P_.str / 10 + P_.hide / 20)), 30, 600);
    Object.assign(f, {
      name: s.n, short: /^The /.test(s.n) ? s.n.replace(/^The /, 'the ') : 'the ' + s.n.toLowerCase(), beast: s.id,
      str: (30 + P_.str * 10) * mod, spd: 30 + P_.spd * 7, ins: 40 + P_.cunning * 5, sta: 40 + P_.regen * 4,
      wdmg: 6 + P_.str * 2, pierce: P_.venom >= 5 ? 4 : 2, prot: Math.round(P_.hide * 0.8), mass: (30 + P_.str * 10) / 40,
      reach: P_.str >= 7 ? 30 : 5, verb: VERB[s.fam] || 'strikes', weapon: VERB[s.fam] || 'strikes', fame: Math.round(s.level / 3), tier: 'animal',
    });
    f.maxHp = f.hp = Math.round(hp * mod);
    const c = Math.sqrt(s.might) / Math.sqrt(hp / 100);
    const wt = (Math.log(Math.max(1e-6, c)) - D.people.lnA) / D.people.lnB;
    f.skill += (wt - worthOf(f)) / 0.42;
    return f;
  };

  // ---------------------------------------------------------------- the great beings, ranked
  // every legend and master, and every named wild monster, by level with titles; the player knows only those he has heard of
  PW.great = function () {
    const S = A.S, st = (S && S.pw) || {}, out = [];
    for (const L of LD.legends) { const g = (st.leg || {})[L.id] || {}; if (g.slain) continue; const b = PW.being(L.id); out.push({ id: L.id, kind: b.kind, n: L.n, level: b.level, titles: L.titles, b }); }
    for (const M of D.masters) { const b = PW.being(M.id); out.push({ id: M.id, kind: 'master', n: M.n, level: b.level, titles: M.titles, b }); }
    for (const w of st.wild || []) if (w.name) { const b = PW.being(w); if (b) out.push({ id: w.id, kind: 'named', n: w.name, level: b.level, titles: w.titles || [], b }); }
    out.sort((a, b) => b.level - a.level || (a.id < b.id ? -1 : 1));
    out.forEach((x, i) => { x.rank = i + 1; });
    return out;
  };
})();
