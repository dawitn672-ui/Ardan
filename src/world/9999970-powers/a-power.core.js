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
  // Titles live in data/titles/ (src/people/9999976-titles, D-183): a legend's or a master's sheet names its titles by id,
  // and each is read here as the object it always was ({ id, n, honour, buffs, born, req }), with the same buffs, so the
  // matchups do not move
  const TDEF = new Map();
  for (const k of Object.keys(A.DATA)) if (/^titles\//.test(k) && A.DATA[k] && Array.isArray(A.DATA[k].titles)) for (const t of A.DATA[k].titles) if (!TDEF.has(t.id)) TDEF.set(t.id, t);
  PW.titleRef = function (t) {
    if (!t || typeof t !== 'string') return t;
    const T = TDEF.get(t);
    if (!T) { console.error('[powers] no title ' + t + ' in data/titles/'); return { id: t, n: t, honour: 0, buffs: {}, req: 'hidden' }; }
    return { id: T.id, n: T.name, honour: T.honour || 0, buffs: T.buffs || {}, born: !!T.born || undefined, req: T.req || (T.born ? 'born' : 'hidden') };
  };
  for (const L of LD.legends.concat(D.masters)) if (Array.isArray(L.titles)) L.titles = L.titles.map(PW.titleRef);
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
  // the level (1-1000) from the might, and back: log10(might) = a + b L + c L^2 above level 20 (c > 0, so each level
  // multiplies the might by more than the one before), fifteen levels to a tenfold below (data/power.json levelCurve)
  const CV = D.levelCurve, gOf = L => CV.a + CV.b * L + CV.c * L * L, X20 = gOf(CV.low.from);
  PW.levelOf = function (m) {
    const x = Math.log10(Math.max(1e-12, m));
    if (x < X20) return clamp(Math.round(CV.low.from + (x - X20) * CV.low.perDecade), LV.min, LV.max);
    return clamp(Math.round((-CV.b + Math.sqrt(CV.b * CV.b + 4 * CV.c * (x - CV.a))) / (2 * CV.c)), LV.min, LV.max);
  };
  PW.mightOf = L => Math.pow(10, L >= CV.low.from ? gOf(L) : X20 + (L - CV.low.from) / CV.low.perDecade);
  // fighting power: the level's might x the titles' power x the mastery and quality of its skills (data/power.json power)
  // art: the sum over the fight skills of the rank's weight x level / 10 (skills stop at level 10; past it they evolve or merge)
  PW.artOf = skills => (skills || []).reduce((a, k) => a + (k.fight === false ? 0 : (D.power.rankW[k.rank] || 0) * Math.min(D.power.maxSkillLevel, k.lvl || 0) / 10), 0);
  PW.artMult = skills => Math.pow(2, PW.artOf(skills) / D.power.artPerDouble);
  PW.titleMult = titles => (titles || []).reduce((m, t) => m * (1 + ((t.buffs && t.buffs.power) || 0)), 1);
  PW.itemMult = items => (items || []).reduce((m, t) => m * Math.max(0.1, 1 + ((t.gives && t.gives.power) || 0)), 1);
  // what skills and items add to the profile (titles add theirs in withTitles)
  PW.addCaps = function (prof, list, key) {
    const out = Object.assign({}, prof);
    for (const x of list || []) for (const k in (x && x[key]) || {}) if (k !== 'power' && k in out) out[k] = clamp(out[k] + x[key][k], 0, 12);
    return out;
  };
  // t: the even log scale the odds, gaps and draws use inside the code (t = 10 x log10(might / 0.01); ten t is ten times the might)
  PW.tOf = m => Math.round(100 * LV.perTen * Math.log10(Math.max(1e-12, m) / LV.base)) / 100;
  PW.mightOfT = t => LV.base * Math.pow(10, t / LV.perTen);
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
      cunning: clamp((st('ins') + st('int')) / 20, 0, 10), magic: 0, fire: 0,
      duel: clamp(((A.weaponSkillOf && A.skill ? A.skill(p, A.weaponSkillOf(p)) : 30) || 0) / 10, 0, 10),
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
      // the level is the person's own (src/people/9999975-level: held once he has one, earned by defeats); his might stays
      // his fighting worth, so the odds read what he can do now
      // his titles (src/people/9999976-titles) are named here for the cards; what they give is in his worth already, so
      // they carry no buffs and his power stays his might; a title that is a class (the Sword Saint) is his class
      return { kind: 'person', id: x.id, n: A.fullName ? A.fullName(x, false) : 'a person', level: A.LV ? A.LV.level(x, m) : PW.levelOf(m), t: PW.tOf(m), might: m, power: m, mastery: null, prof, int: 'wise',
        titles: A.TT && x.tt ? A.TT.shownOf(x) : [], cls: (A.LV && A.LV.className ? A.LV.className(x) : null) || (A.TT && x.tt ? A.TT.classOf(x) : null),
        ranged: !!(x.gear && x.gear.ranged), hardy: clamp(((A.stat ? A.stat(x, 'sta') : 50) || 50) / 10, 0, 10) };
    }
    if (typeof x === 'object' && x.sp) {   // a wild individual: its species, its temper, its own name and titles
      const s = SP.get(x.sp); if (!s) return null;
      const t = PW.individual(s, x.key || x.id || '');
      const prof = Object.assign({}, s.prof); for (const k in t.mod) prof[k] = clamp(prof[k] + t.mod[k], 0, 10);
      const w = PW.withTitles(prof, PW.levelOf(PW.mightOfT(s.t + t.lv)), (s.titles || []).concat(x.titles || [])), m = PW.mightOf(w.level);
      return { kind: 'wild', id: x.id || s.id, sp: s.id, n: x.name || s.n, level: clamp(w.level, 1, LV.max), t: PW.tOf(m * PW.titleMult(x.titles)), might: m, power: m * PW.titleMult(x.titles), prof: w.prof,
        int: x.int || s.int, titles: x.titles || [], temper: t, ranged: s.prof.flight >= 6 || s.prof.magic >= 6, hardy: s.prof.regen };
    }
    const id = typeof x === 'string' ? x : x.id;
    if (SP.has(id)) {   // a kind may be born with a title (the oldest dragons, the gate-born demons): its buffs count
      const s = SP.get(id), w = PW.withTitles(s.prof, s.level, s.titles), m = s.titles ? PW.mightOf(w.level) : s.might;
      return { kind: 'species', id, sp: id, n: s.n, level: clamp(w.level, 1, LV.max), t: PW.tOf(m * PW.titleMult(s.titles)), might: m, power: m * PW.titleMult(s.titles), prof: w.prof, int: s.int, titles: s.titles || [], ranged: s.prof.flight >= 6 || s.prof.magic >= 6, hardy: s.prof.regen };
    }
    if (BYCRE.has(id)) return PW.being(BYCRE.get(id).id);
    const L = LEG.get(id) || MAS.get(id);
    if (L) {
      // the level's might x titles x items x art (its skills' ranks and levels); the profile with what each of them adds
      // its level is the data's plus what it has gained by defeats since (order 92, D-184: the legends grow too, slowly)
      const lvG = A.LV && A.LV.legendGain ? A.LV.legendGain(id) : 0;
      const w = PW.withTitles(PW.addCaps(PW.addCaps(L.prof, L.skills, 'cap'), L.items, 'gives'), L.level + lvG, L.titles), m = PW.mightOf(w.level);
      // and refined by the years (order 95: the great grow mostly by refining their arts; 1 in a fresh world, alike for all)
      const pw = m * PW.titleMult(L.titles) * PW.itemMult(L.items) * PW.artMult(L.skills) * (A.LV && A.LV.legendRefine ? A.LV.legendRefine(id) : 1);
      return { kind: LEG.has(id) ? 'legend' : 'master', id, n: L.n, level: clamp(w.level, 1, LV.max), t: PW.tOf(pw), might: m, power: pw, art: PW.artOf(L.skills), prof: w.prof, int: L.int, cls: L.class || null,
        titles: L.titles || [], base: L.level, ranged: true, hardy: w.prof.regen };
    }
    return null;
  };
  PW.level = x => { const b = PW.being(x); return b ? b.level : 0; };
  // a few great beings fighting as one add up nearly in a line: the sum of their powers, times (1 + groupSynergy) for each
  // one past the first. Lanchester's square law (three equals as nine) is for hosts of many men, where every spear can reach
  // the foe at once (PW.hostOf: N^1.35 x a soldier); a few giants mostly get in each other's way. The profile takes each
  // one's best (a handful is not a swarm)
  PW.group = function (xs) {
    const bs = (xs || []).map(PW.being).filter(Boolean);
    if (!bs.length) return null;
    const pw = bs.reduce((a, b) => a + (b.power || b.might), 0) * Math.pow(1 + (D.power.groupSynergy || 0), bs.length - 1), prof = {};
    for (const k of CAPS) prof[k] = Math.max(...bs.map(b => b.prof[k] || 0));
    return { kind: 'group', id: 'group:' + bs.map(b => b.id).join('+'), n: bs.map(b => b.n).join(', '), level: Math.max(...bs.map(b => b.level)), t: PW.tOf(pw), might: pw, power: pw, prof, int: 'wise', titles: [], ranged: bs.some(b => b.ranged), hardy: Math.max(...bs.map(b => b.hardy || 0)) };
  };
  PW.might = x => { const b = PW.being(x); return b ? b.might : 0; };
  PW.power = x => { const b = PW.being(x); return b ? b.power : 0; };

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
    // single combat against firepower (the owner, 2026-11-26): a duellist's art finds the gap one to one; raw firepower
    // falls on many at once and breaks numbers
    const d6 = (B_.duel || 0) - (A_.duel || 0); if (d6 >= 3) add(-0.12 * d6, sign > 0 ? 'it is a master of single combat' : 'one to one, your art finds every gap');
    if ((B_.fire || 0) >= 6 && A_.swarm >= 5) add(-0.06 * B_.fire, sign > 0 ? 'its fire falls on all of you at once' : 'your fire falls on all of them at once');
  };
  PW.compare = function (a0, b0) {
    const a = PW.being(a0), b = PW.being(b0);
    if (!a || !b) return null;
    const edges = [];
    edgesOver(a, b, 1, edges);
    edgesOver(b, a, -1, edges);
    const prof = edges.reduce((s, e) => s + e.w, 0);
    const lg = D.odds.k * Math.log(Math.max(1e-12, a.power || a.might) / Math.max(1e-12, b.power || b.might)) + prof;   // power, not the level alone
    const p = 1 / (1 + Math.exp(-lg)), gap = a.t - b.t;   // the gap on the even log scale (10 = ten times the might)
    edges.sort((x, y) => Math.abs(y.w) - Math.abs(x.w));
    return { p, gap, word: PW.oddsWord(p), edges, huge: Math.abs(gap) >= 10 * D.odds.hugeLog, close: Math.abs(gap) <= 10 * D.odds.closeLog, a, b };
  };
  // how a gap (on the t scale) reads in words (no numbers beside it on a card)
  PW.gapWords = gap => (gap <= -45 ? 'a legend: the whole world moves when it does' : gap <= -30 ? 'beyond anything you could ever hope to stand against' : gap <= -18 ? 'far beyond you: a host would die here'
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
      reach: P_.str >= 7 ? 30 : 5, verb: VERB[s.fam] || 'strikes', weapon: VERB[s.fam] || 'strikes', fame: Math.round(s.t / 3), tier: 'animal',
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
    // ranked by fighting power (level, titles, mastery), not the level alone
    out.sort((a, b) => b.b.power - a.b.power || (a.id < b.id ? -1 : 1));
    out.forEach((x, i) => { x.rank = i + 1; });
    return out;
  };
})();
