// D11-1: the muster-master reads a recruit and makes offers (docs/design/war.md §14.1, §14.3; D-111).
//
// A muster is a command's: the crown's, or a great lord's (A.CMD, W1-3). A man goes to the muster of the land he lives in
// (the province's nearest seat, as A.CALLS raises men, W1-4), or to his own house's when it holds of the crown; a free
// company keeps its own table. The muster-master reads him in words (his weapon and what he carries, his way of fighting
// from his body and temper, every aptitude a branch can use in or out of battle, his birth and people, who speaks for
// him, what the command lacks this season) and the command decides where it would have him: one A.WHY.decide (kind
// 'muster') over the branches open at that muster, its reasons the reading. The offers are the best few, each with its
// reasons; the recruit chooses among them. The decider is the command's owner (the king, or the lord), whose temper
// bends the reasons (a proud lord weighs birth more). Its draw, when options are close, is a stream keyed by the
// recruit and the day, so a muster never moves the world's own random stream.
(function () {
  const MU = A.MUSTER;
  MU.T = Object.assign({
    gap: 2.4,       // an option this far below the chosen one (log-odds) is not offered
    floor: -0.8,    // nor one whose reasons sum below this
    max: 3,         // offers at most
    band: 1.0,      // options this close go to the keyed draw
    knows: 18,      // a skill's value at which the muster-master notices it
  }, MU.T || {});
  const r2 = x => Math.round(x * 100) / 100;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sk = (p, k) => (A.skill ? A.skill(p, k) || 0 : 0);

  // a stream of numbers keyed by a string (the recruit, the day): the same muster gives the same draw, and A.rand is untouched
  MU.rng = function (key) {
    let h = 2166136261;
    const s = String(key) + ':' + ((A.S && A.S.seed) || 0);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    let x = h >>> 0 || 1;
    return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return (x % 1e9) / 1e9; };
  };

  // ---------------------------------------------------------------- what the muster-master sees, in words
  const SAY = {
    sword: 'you can use a blade', spear: 'you know a spear', shield: 'you know a shield', bow: 'you can draw a bow',
    melee: 'you keep your feet in a press', riding: 'you ride well', athletics: 'you are strong and long in the wind',
    unarmed: 'you can fight with your hands', command: 'men follow you', tactics: 'you know how walls are taken',
    survival: 'you know the woods and the hills', tracking: 'you can track', husbandry: 'you know horses and beasts',
    sea: 'you know the sea', craft: 'you have a trade in your hands', medicine: 'you can dress a wound',
    music: 'you can sound a horn and keep a drum', trade: 'you know a market', stewardship: 'you can keep accounts and stores',
    learning: 'you read and write', faith: 'you are devout', etiquette: 'you know a hall\'s manners',
    intimidation: 'men do as you tell them', stealth: 'you move quietly', persuasion: 'you have a tongue',
  };
  MU.SAY = SAY;
  const WAY_SAY = {
    shock: 'you have the build and the nerve for a charge', wall: 'you would hold a file and not give a step',
    press: 'you go forward when it comes to blows', loose: 'you are quick and see the ground',
    shot: 'you are patient and have a good eye', stealth: 'you keep your head and your feet quiet',
    works: 'you have a head for how things are built', steady: 'you are steady, the kind trusted with a gate',
  };
  MU.WAY_SAY = WAY_SAY;
  const HEAVY = g => { const x = g && GD.GEAR[g]; return !!(x && (x.prot || 0) >= 7); };
  const kindOf = g => { const x = g && GD.GEAR[g]; return x ? x.kind || '' : ''; };

  // the reading: weapons, gear, way, aptitudes, birth, people, tongues; pure
  MU.read = function (pc) {
    const g = pc.gear || {}, st = k => (A.stat ? A.stat(pc, k) : 40) || 0;
    const stats = { str: st('str'), spd: st('spd'), ins: st('ins'), sta: st('sta'), int: st('int'), wil: st('wil') };
    const vals = Object.values(stats), mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.max(6, Math.sqrt(vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / vals.length));
    const z = k => (stats[k] - mean) / sd;
    const T = A.WHY && A.WHY.temper ? A.WHY.temper(pc) : {};
    const t = k => (T && isFinite(T[k]) ? T[k] : 0);
    const age = A.age ? A.age(pc) : 20;
    const ways = {
      shock: .5 * z('str') + .3 * z('spd') + .5 * t('pride') - .5 * t('caution') + .2 * t('ambition'),
      wall: .5 * z('sta') + .3 * z('str') + .5 * t('patience') + .3 * t('caution'),
      press: .5 * z('str') + .2 * z('sta') + .4 * t('wrath') + .2 * t('pride'),
      loose: .6 * z('spd') + .3 * z('ins') - .3 * t('patience') + .2 * t('ambition'),
      shot: .6 * z('ins') + .5 * t('patience') + .1 * z('wil'),
      stealth: .4 * z('ins') + .3 * z('spd') + .4 * t('caution') + sk(pc, 'stealth') / 60,
      works: .7 * z('int') + .3 * t('patience'),
      steady: .4 * z('wil') + .4 * t('patience') + .3 * t('honor') + (age >= 35 ? .5 : 0),
    };
    const way = Object.keys(ways).sort((a, b) => ways[b] - ways[a] || (a < b ? -1 : 1));
    const skills = {};
    for (const k of Object.keys(SAY)) { const v = sk(pc, k); if (v >= MU.T.knows) skills[k] = Math.round(v); }
    return {
      age, ways, way: way.slice(0, 2), skills,
      mount: !!(g.mount && g.mount !== 'none'), heavy: HEAVY(g.armor), ranged: kindOf(g.ranged),
      weapon: kindOf(g.weapon), status: pc.status || 'peasant', race: pc.race || 'human',
      tongues: Array.isArray(pc.langs) ? pc.langs.length : 1,
      coastBorn: !!(A.prov && pc.home != null && A.prov(pc.home) && A.prov(pc.home).coast),
    };
  };

  // ---------------------------------------------------------------- where a man goes to the muster
  // his own house's command, when it holds of the crown; else the command of the land he lives in (nearest seat)
  MU.cmdFor = function (pc, rid) {
    rid = rid || pc.realm;
    const CM = A.CMD, r = A.realm(rid);
    if (!CM || !r) return { id: 'crown:' + rid, k: 'crown', r: rid };
    // a lord's muster takes men into his hosts: a command with no host on the map (a count whose men are called) sends
    // its recruits to the crown's
    const hosts = hh => CM.divs(CM.house(hh)).some(d => d && !d.elite && !d.call);
    const h = pc.house && A.S.houses ? A.S.houses[pc.house] : null;
    if (h && CM.isTic(h, rid) && hosts(h)) return CM.house(h);
    const P = A.prov && pc.home != null ? A.prov(pc.home) : null;
    if (P && A.CALLS && A.CALLS.lands && P.owner === rid) {
      const cap = r.capitalProv != null ? A.S.prov[r.capitalProv] : null;
      let by = null, best = cap && A.wsDist ? A.wsDist(P.id, cap.id) : 1e9;
      for (const hh of CM.tics(rid)) {
        const S = CM.seatProv(hh);
        if (!S || S.owner !== rid || !hosts(hh)) continue;
        const d = S.id === P.id ? 0 : A.wsDist ? A.wsDist(P.id, S.id) : 1e9;
        if (d < best) { best = d; by = hh; }
      }
      if (by) return CM.house(by);
    }
    return CM.crown(rid);
  };
  MU.placeOf = function (c) {
    if (!c) return '';
    if (c.k === 'house') {
      const h = A.S.houses[c.h], P = h && A.CMD.seatProv ? A.CMD.seatProv(h) : null;
      return `${h ? h.name : 'The lord'}'s muster${P ? ' at ' + P.name : ''}`;
    }
    const r = A.realm(c.r);
    return `The crown's muster${r && r.capital ? ' at ' + r.capital : ''}`;
  };
  MU.masterOf = c => (A.oobLeader ? A.oobLeader(c.r, 'mm:' + c.id, 2).name : 'the muster-master');

  // what the command lacks: the men short in its companies, by branch (the war map's companies, 9997-companies)
  MU.gaps = function (c) {
    const out = {};
    if (!c || !A.CMD || !A.CMD.divs) return out;
    const full = {}, have = {};
    for (const d of A.CMD.divs(c)) {
      for (const rec of d.bs || []) {
        if (!rec || !Array.isArray(rec.k)) continue;
        const code = rec.c;
        const b = GD.BN && GD.BN[code] ? MU.branchOfTroop(code) : (MU.branches().find(x => (x.sup || []).includes(code)) || {}).id;
        if (!b) continue;
        const nom = GD.BN && GD.BN[code] ? GD.BN[code].men : GD.SUP && GD.SUP[code] ? GD.SUP[code].men : 0;
        if (!nom) continue;
        full[b] = (full[b] || 0) + nom;
        have[b] = (have[b] || 0) + rec.k.reduce((a, x) => a + (x || 0), 0);
      }
    }
    for (const b in full) { const s = 1 - have[b] / full[b]; if (s > .08) out[b] = r2(Math.min(1, s)); }
    return out;
  };
  // what the command's host is made of: each branch's share of its companies' strength (D-194: a realm's regiments are
  // raised whole at the world's birth, so a small realm whose host is nearly all one arm, an elven crown's bows or a
  // dwarven hold's foot, often lacks nothing; the bulk of its host is then the muster-master's reason to put a man there)
  MU.mix = function (c) {
    const out = {};
    if (!c || !A.CMD || !A.CMD.divs) return out;
    let tot = 0;
    for (const d of A.CMD.divs(c)) for (const rec of d.bs || []) {
      if (!rec) continue;
      const code = rec.c, b = GD.BN && GD.BN[code] ? MU.branchOfTroop(code) : null;
      const nom = b && GD.BN[code].men; if (!nom) continue;
      out[b] = (out[b] || 0) + nom; tot += nom;
    }
    for (const b in out) out[b] = r2(out[b] / Math.max(1, tot));
    return out;
  };

  // a kinsman or friend who holds a field post in the realm speaks for the recruit at that branch
  MU.patrons = function (pc, rid) {
    const out = [];
    if (!A.relsOf || !A.POSTS || !A.POSTS.held || !pc.rel) return out;
    for (const { p, r } of A.relsOf(pc)) {
      if (!p || !p.alive || p.realm !== rid || (r && r.op != null && r.op < 10)) continue;
      for (const k of A.POSTS.held(p.id)) {
        const m = /^(coy|bn):([^:]+):(\d+)/.exec(k);
        if (!m) continue;
        const d = A.divById ? A.divById(m[2]) : null, rec = d && d.bs ? d.bs[+m[3]] : null;
        if (!rec) continue;
        const b = GD.BN[rec.c] ? MU.branchOfTroop(rec.c) : (MU.branches().find(x => (x.sup || []).includes(rec.c)) || {}).id;
        if (b) out.push({ b, pid: p.id, name: p.given || A.fullName(p), rel: (r && r.type) || 'friend', post: k });
        break;
      }
      if (out.length >= 3) break;
    }
    return out;
  };

  // ---------------------------------------------------------------- the branches open at a muster, as options with reasons
  const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source: source || null, pub: pub ? 1 : 0 });
  const TITLE = { household: c => (c && c.k === 'crown' ? 'The royal knights' : 'The household guard') };
  MU.nameOf = (B, c) => (TITLE[B.id] ? TITLE[B.id](c) : B.name);
  MU.open = function (c, o) {
    o = o || {};
    const kind = o.merc ? 'company' : c && c.k === 'house' ? 'house' : 'crown';
    const rid = c && c.r;
    // a free company signs men into its fighting arms (its own branch, the hired companies, is the table itself)
    const COMPANY = ['lances', 'light_horse', 'spears', 'foot_men_at_arms', 'archers', 'crossbows'];
    return MU.branches().filter(B => {
      if (o.merc ? !COMPANY.includes(B.id) : !(B.muster || []).includes(kind)) return false;
      const need = B.needs || {};
      if (need.coast === 'must' && !MU.coast(rid)) return false;
      if (!o.merc && rid && (B.troops || []).length && !(B.sup || []).length && B.id !== 'ships') {
        const av = A.wsTroopsFor ? A.wsTroopsFor(rid) : [];
        if (!B.troops.some(t => av.includes(t))) return false;
      }
      return true;
    });
  };
  MU.options = function (pc, c, o) {
    o = o || {};
    const R = o.read || MU.read(pc), rid = c && c.r;
    const gaps = o.merc ? {} : MU.gaps(c), mix = o.merc ? {} : MU.mix(c), pats = o.merc ? [] : MU.patrons(pc, rid);
    const noble = ['gentry', 'noble', 'royal'].includes(R.status);
    const out = [], open = MU.open(c, o);
    for (const B of open) {
      const need = B.needs || {}, reasons = [];
      const nm = MU.nameOf(B, c).replace(/^The /, 'the ');
      // the weapon and every aptitude the branch prizes: the best two the recruit has
      const want = {};
      for (const k of B.weapon || []) want[k] = 1;
      for (const k in B.prizes || {}) want[k] = Math.max(want[k] || 0, B.prizes[k]);
      const sks = Object.keys(want).filter(k => R.skills[k]).map(k => [k, want[k] * clamp((R.skills[k] - 12) / 18, 0, 2.2)]).sort((a, b) => b[1] - a[1]);
      for (const [k, w] of sks.slice(0, 2)) if (w > .05) reasons.push(rs('merit', w, SAY[k], { t: 'skill', id: k, r: R.skills[k] }, 1));
      // the way of fighting he is made for
      const wi = R.way.findIndex(w => (B.ways || []).includes(w));
      if (wi >= 0 && R.ways[R.way[wi]] > 0) reasons.push(rs('temper', (wi === 0 ? .9 : .5) * clamp(.5 + R.ways[R.way[wi]], .3, 1.6), WAY_SAY[R.way[wi]], { t: 'way', id: R.way[wi] }, 1));
      // what he brings
      if (need.mount === 'pref') {
        if (R.mount) reasons.push(rs('merit', 1.2, 'you bring a horse', { t: 'gear', id: 'mount' }, 1));
        else if ((R.skills.riding || 0) < 30) reasons.push(rs('cost', -2.4, `no horse, so not ${nm}`, { t: 'gear', id: 'mount' }, 1));
        else reasons.push(rs('cost', -.6, 'you have no horse of your own', { t: 'gear', id: 'mount' }, 1));
      }
      if (need.armor === 'pref' && R.heavy) reasons.push(rs('merit', .8, 'you bring mail', { t: 'gear', id: 'armor' }, 1));
      if (need.ranged === 'pref' && ((B.id === 'archers' && R.ranged === 'bow') || (B.id === 'crossbows' && R.ranged === 'xbow')))
        reasons.push(rs('merit', 1, `you bring your own ${R.ranged === 'xbow' ? 'crossbow' : 'bow'}`, { t: 'gear', id: 'ranged' }, 1));
      if (need.tongues === 'pref' && R.tongues > 1) reasons.push(rs('merit', .8, 'you speak more than one tongue', { t: 'tongues', r: R.tongues }, 1));
      // birth
      if (need.station) {
        if (noble) reasons.push(rs('station', 1.1, 'a man of your birth', { t: 'status', id: R.status }, 1));
        else if (need.sworn === 'must' && !pats.some(x => x.b === B.id)) continue;
        else reasons.push(rs('station', -1.8, `${nm} take men of birth`, { t: 'status', id: R.status }, 1));
      }
      if (!need.station && noble && (B.id === 'spears' || B.id === 'train')) reasons.push(rs('station', -.9, 'a man of your birth is wasted in a file', { t: 'status', id: R.status }, 1));
      // his people
      if (R.race === 'elf' && B.id === 'archers') reasons.push(rs('kin', 1.4, 'your people\'s bows are famous', { t: 'race', id: 'elf' }, 1));
      if (R.race === 'dwarf' && (B.id === 'engineers' || B.id === 'foot_men_at_arms')) reasons.push(rs('kin', .7, 'your people are miners and smiths', { t: 'race', id: 'dwarf' }, 1));
      if ((R.race === 'giant' || R.race === 'orc' || R.race === 'halforc') && B.id === 'foot_men_at_arms') reasons.push(rs('merit', .6, 'your size', { t: 'race', id: R.race }, 1));
      if (B.id === 'ships' && R.coastBorn) reasons.push(rs('merit', .6, 'you were born by the sea', { t: 'home' }, 1));
      // years
      if (B.id === 'garrison' && R.age >= 35) reasons.push(rs('merit', 1, 'older men keep the gate', { t: 'age', r: R.age }, 1));
      if ((B.id === 'lances' || B.id === 'light_horse' || B.id === 'scouts') && R.age >= 40) reasons.push(rs('cost', -.8, 'the saddle wants younger men', { t: 'age', r: R.age }, 1));
      // who speaks for him
      const pat = pats.find(x => x.b === B.id);
      if (pat) reasons.push(rs('kin', 1.2, `your ${pat.rel === 'friend' ? 'friend' : pat.rel} ${pat.name} serves there`, { t: 'patron', id: pat.pid }, 1));
      // what the command lacks
      if (gaps[B.id]) reasons.push(rs('want', clamp(gaps[B.id] * 4, .3, 1.5), `${B.short} are short of men this season`, { t: 'gap', id: B.id, r: gaps[B.id] }, 1));
      else if (mix[B.id] >= .15) reasons.push(rs('want', .5 * mix[B.id], `${B.short} are the most of this muster's host`, { t: 'mix', id: B.id, r: mix[B.id] }, 1));
      if (B.base) reasons.push(rs('want', B.base, `${B.short} always want men`, { t: 'base', id: B.id }, 0));
      // the same small weight on every branch (it moves no choice): where nothing else speaks for the branch he is put in,
      // this is the muster-master's reason, said aloud (D-194)
      reasons.push(rs('want', .05, 'the muster takes every able man', { t: 'any' }, 0));
      out.push({ id: B.id, reasons });
    }
    return out;
  };

  // the muster-master's decision and his offers: { c, place, master, rec, offers: [{ b, name, why: [labels], score }], read, refusal }
  MU.offers = function (pc, o) {
    o = o || {};
    const rid = o.merc ? null : (o.rid || pc.realm);
    const c = o.merc ? { id: 'company', k: 'company', r: pc.realm } : (o.cmd ? (A.CMD && A.CMD.get(o.cmd)) || MU.cmdFor(pc, rid) : MU.cmdFor(pc, rid));
    const read = MU.read(pc);
    const opts = MU.options(pc, c, Object.assign({ read }, o));
    if (!opts.length) return null;
    const who = c.k === 'house' && A.WHY && A.WHY.houseMind ? A.WHY.houseMind(A.S.houses[c.h]) : c.k === 'crown' ? c.r : 'company';
    const rec = A.WHY.decide(who, 'muster', opts, {
      band: MU.T.band, at: pc.id, r: c.r, log: o.log !== false,
      rand: MU.rng('mm:' + pc.id + ':' + (A.absDay ? A.absDay() : 0) + (o.merc ? ':co' : '')),
    });
    if (!rec) return null;
    const sum = op => op.reasons.reduce((a, x) => a + x.weight, 0);
    const byId = new Map(opts.map(x => [x.id, x]));
    const ids = [rec.chose].concat((rec.rej || []).map(x => x[0]));
    const top = rec.s;
    const scoreOf = id => (id === rec.chose ? rec.s : ((rec.rej || []).find(x => x[0] === id) || [0, -9])[1]);
    const offers = [];
    for (const id of ids) {
      const op = byId.get(id), B = MU.B(id);
      if (!op || !B) continue;
      const s = scoreOf(id);
      if (id !== rec.chose && (s < top - MU.T.gap || sum(op) < MU.T.floor)) continue;
      const pos = op.reasons.filter(x => x.weight > 0), real = pos.filter(x => !(x.source && x.source.t === 'any'));
      const why = (real.length ? real : pos).sort((a, b) => b.weight - a.weight).slice(0, 2).map(x => x.label);
      offers.push({ b: id, name: MU.nameOf(B, c), why, score: r2(s) });
      if (offers.length >= MU.T.max) break;
    }
    // one door he will not open, said aloud: the heaviest refusal among the branches not offered
    let refusal = '';
    for (const op of opts) {
      if (offers.some(x => x.b === op.id)) continue;
      const no = op.reasons.filter(x => x.weight <= -1.5).sort((a, b) => a.weight - b.weight)[0];
      if (no) { refusal = no.label; break; }
    }
    return { c, place: o.merc ? (o.company ? `The table of ${o.company}` : 'A free company\'s table') : MU.placeOf(c), master: o.merc ? 'the company\'s captain' : MU.masterOf(c), rec, offers, read, refusal, gaps: o.merc ? {} : MU.gaps(c) };
  };

  // the reading in his own words, for the card (three things at most, a door he will not open, what the command lacks)
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  MU.readWords = function (M) {
    const R = M.read, notes = [];
    const ks = Object.keys(R.skills).sort((a, b) => R.skills[b] - R.skills[a]);
    const wpn = ks.find(k => ['sword', 'spear', 'bow', 'riding', 'shield', 'melee'].includes(k));
    if (wpn) notes.push(SAY[wpn]);
    if (R.way[0] && R.ways[R.way[0]] > 0) notes.push(WAY_SAY[R.way[0]]);
    const apt = ks.find(k => k !== wpn && !['sword', 'spear', 'bow', 'riding', 'shield', 'melee', 'athletics', 'unarmed'].includes(k));
    if (apt) notes.push(SAY[apt]);
    if (R.mount && notes.length < 3) notes.push('you bring a horse');
    let t = notes.length ? `He looks you over and says it plainly: ${notes.slice(0, 3).join('; ')}.` : 'He looks you over: nothing in your hands he has not seen a thousand times.';
    if (M.refusal) t += ` ${cap(M.refusal)}.`;
    const g = Object.keys(M.gaps || {}).sort((a, b) => M.gaps[b] - M.gaps[a])[0];
    if (g && MU.B(g)) t += ` ${cap(MU.B(g).short)} are short of men.`;
    return t;
  };
  // a choice's words: "The bows: you can draw a bow", at most twelve words
  MU.offerLabel = function (x) {
    const words = `${x.name}: ${x.why[0] || 'they will have you'}`.split(/\s+/);
    return words.length > 12 ? words.slice(0, 12).join(' ').replace(/[,;:]$/, '') : words.join(' ');
  };
})();
