// Powers wave 1, part 2: the world pushes back (docs/design/powers.md).
//
//   The wilds (A.onMonth): each month the ground the player stands on may bring an encounter card (pw_encounter), scaled
//     to where he is (terrain, a town or the frontier, the season) and what he does (travel, exploring, a pilgrimage, war;
//     the hunt has its own door, A.startHunt). The beast met is drawn from the bestiary by habitat, season and the place's
//     danger. Its odds are words; a fight far above him is settled here (death or flight), a close one goes to the duel.
//   Wild monsters (each spring): up to WILD_CAP notable monsters live in the wild provinces. They feed, fight and, when they
//     have fed, won and lived long enough at a form, rise to the next form of their line; at the top they take a name and a
//     mind. Each rise is written in A.S.pw.evo with its reasons. Beasts act by instinct (hunger, the season, their ground;
//     every act names its cause). Speaking and wise ones decide through A.WHY.
//   The great beings (each season): every legend of data/legends.json decides what the season brings through A.WHY.decide,
//     with reasons read from its character sheet: its habit for the season, its hunger, its desires, its grudges and
//     loves (realms, peoples, other beings), its fears, its wounds and its anger. A raid costs a province people and a realm
//     stability, and its ruler answers through A.WHY: send a host, or endure. A host can kill a legend; a man alone cannot.
//   News: what happens near the player is news; far away, a rumour reaches him now and then. He learns of the great beings
//     by news, rumour, a tale in the year or meeting one; A.POWER.great() ranks them and the codex shows those he knows.
// Determinism: the world's own draws (whether a card comes, the monsters' and legends' lives) use a seeded stream of their
// own (A.V2.rng from the world seed, the date and a salt), so the game's main stream moves only when the player meets
// something and plays the card. Rendering reads only.
// State (all optional; an old save starts it the first month): A.S.pw = { leg, wild, evo, known, met, last, acts, n }.
(function () {
  const PW = A.POWER;
  if (!PW) return;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const D = PW.D, LD = PW.LD;
  const T = PW.T = Object.assign({
    WILD_CAP: 24, EVO_CAP: 30, MET_CAP: 120, GAP_MONTHS: 4,
    // the chance of a card a month by the ground under him (before the town, the season and what he does)
    terr: { plains: 0.0025, steppe: 0.004, forest: 0.006, hills: 0.005, mountains: 0.01, marsh: 0.008, desert: 0.007 },
    city: 0.3, town: 0.6, wild: 1.2, doing: 4, war: 1.5, winter: 1.3,
    huntChance: 0.15, famousChance: 0.6,
  }, PW.T || {});
  const SEASONS = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
  const month = () => { try { return A.monthOf(A.today()).m; } catch (e) { return 0; } };
  PW.season = () => SEASONS[month()];
  const absMonth = () => A.S.year * 12 + month();
  const mk = (A.V2 && A.V2.rng && A.V2.rng.makeRng) || null;
  // the world's own stream for this month and salt (never A.rand)
  PW.rng = function (salt) {
    const seed = PW.hash(`${A.S.seed != null ? A.S.seed : 'ardan'}|pw|${A.S.year}|${month()}|${salt}`);
    if (mk) return mk(seed);
    let s = seed >>> 0;
    const next = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return { next, chance: p => next() < p, int: (a, b) => a + Math.floor(next() * (b - a + 1)), pick: arr => arr[Math.floor(next() * arr.length)] };
  };
  const wpick = (rng, items, wf) => { let tot = 0; const ws = items.map(x => { const w = Math.max(0, wf(x)); tot += w; return w; }); if (!(tot > 0)) return null; let r = rng.next() * tot; for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; };
  const provs = () => (A.S && A.S.prov) || [];
  const P_ = i => (i != null ? A.prov(i) : null);
  const realmOf = P => (P && P.owner ? A.realm(P.owner) : null);
  const short = rid => { try { return A.realmShort(rid); } catch (e) { return String(rid); } };
  const isWild = P => P && (!P.town || P.town < 3000);
  const terrOk = (s, P) => P && ((s.terr || []).includes(P.terr) || (s.coast && P.coast) || (P.terr === 'steppe' && s.terr.includes('plains')));

  // ---------------------------------------------------------------- state
  PW.state = function () {
    const S = A.S;
    if (!S) return null;
    if (!S.pw || typeof S.pw !== 'object') S.pw = {};
    const st = S.pw;
    st.leg = st.leg || {}; st.wild = Array.isArray(st.wild) ? st.wild : []; st.evo = Array.isArray(st.evo) ? st.evo : [];
    st.known = st.known || {}; st.met = st.met || {}; st.n = st.n || 0;
    for (const L of LD.legends) if (!st.leg[L.id]) st.leg[L.id] = PW.place(L);
    if (st.known['sword-saint'] == null) st.known['sword-saint'] = S.year;   // everyone grows up knowing his name
    return st;
  };
  // where a great being lives, chosen from the world as it is, by its seed (no draw from any stream)
  PW.place = function (L) {
    const H = PW.hash(`${A.S.seed}|${L.id}`), all = provs();
    const ty = L.home.type;
    let cands = [];
    if (ty === 'sea') cands = all.filter(P => P.coast && !P.town);
    if (ty === 'sea' && !cands.length) cands = all.filter(P => P.coast);
    if (ty === 'city') cands = all.filter(P => P.town >= 20000);
    if (ty === 'lair' || ty === 'roam' || ty === 'sealed') cands = all.filter(P => (L.home.terr || []).includes(P.terr) && isWild(P));
    if (!cands.length && ty !== 'realm') cands = all.filter(P => (L.home.terr || []).includes(P.terr));
    let rid = null;
    if (ty === 'realm') {
      const rs = Object.values(A.S.realms || {}).filter(r => r.alive && r.capitalProv != null && (L.home.terr || []).includes((P_(r.capitalProv) || {}).terr));
      const pool = rs.length ? rs : Object.values(A.S.realms || {}).filter(r => r.alive && r.capitalProv != null);
      const r = pool.length ? pool[H % pool.length] : null;
      rid = r ? r.id : null;
      cands = r ? [P_(r.capitalProv)] : [];
    }
    if (!cands.length) cands = all.slice(0, 1);
    const P = cands[H % cands.length];
    const g = { at: P ? P.id : 0, home: ty === 'roam' ? null : (P ? P.id : null), fed: 0, hurt: 0, raids: 0, feel: [], grudges: [] };
    if (rid) g.rid = rid;
    for (const gr of L.grudges || []) g.grudges.push({ at: gr.at, y: A.S.year - 30, w: gr.w, cause: { t: 'sheet', label: gr.why, pub: 1 } });
    return g;
  };
  PW.know = function (id) { const st = PW.state(); if (st && st.known[id] == null) st.known[id] = A.S.year; };
  PW.meet = function (sp) { const st = PW.state(); if (!st) return; st.met[sp] = A.S.year; const ks = Object.keys(st.met); if (ks.length > T.MET_CAP) { ks.sort((a, b) => st.met[a] - st.met[b]); delete st.met[ks[0]]; } };

  // ---------------------------------------------------------------- news, near and far
  const near = (pc, P, steps) => {
    if (!pc || !P) return false;
    if (pc.home === P.id) return true;
    let fr = [pc.home];
    const seen = new Set(fr);
    for (let i = 0; i < steps; i++) { const nx = []; for (const id of fr) for (const j of (P_(id) || {}).adj || []) if (!seen.has(j)) { seen.add(j); nx.push(j); } fr = nx; if (seen.has(P.id)) return true; }
    return seen.has(P.id);
  };
  PW.tell = function (P, text, about, rng) {
    const pc = A.pc && A.pc();
    if (!pc || !pc.alive) return false;
    const close = near(pc, P, 2) || (P && pc.realm && P.owner === pc.realm);
    if (close) { A.news(text, 'pw'); if (about) PW.know(about); return true; }
    if (rng && rng.chance(0.3)) { A.news(`Travellers' talk from far away: ${text}`, 'pw'); if (about) PW.know(about); return true; }
    return false;
  };

  // ---------------------------------------------------------------- minds of the great beings
  const legMind = (L, g) => ({ id: 'legend:' + L.id, temper: L.temper || {}, feel: g.feel || [], grudges: g.grudges || [] });
  const realmRace = rid => (A.realm(rid) || {}).race;
  // what the sheet says of a realm or its people: [{ w, why, kind }] (positive grudge, negative love)
  const sheetOn = (L, rid) => {
    const out = [], race = realmRace(rid);
    for (const g of L.grudges || []) if (g.at === rid || g.at === race) out.push({ w: g.w, why: g.why, k: 'grudge', at: g.at });
    for (const l of L.loves || []) if (l.at === rid || l.at === race) out.push({ w: -l.w, why: l.why, k: 'love', at: l.at });
    return out;
  };
  const DESIRE = {
    gold: P => ({ w: clamp((P.town || 0) / 60000, 0, 1.2), kind: 'coin', label: `the wealth of ${P.name}` }),
    books: P => ({ w: clamp((P.dev || 0) / 8, 0, 1), kind: 'want', label: `the books of ${P.name}` }),
    souls: P => ({ w: clamp((P.town || 0) / 80000, 0, 1), kind: 'want', label: `the many souls of ${P.name}` }),
    horses: P => ({ w: P.terr === 'steppe' || P.terr === 'plains' ? 0.8 : 0, kind: 'want', label: `the horse-herds of ${P.name}` }),
    herds: P => ({ w: P.terr === 'steppe' || P.terr === 'plains' || P.terr === 'hills' ? 0.6 : 0.2, kind: 'want', label: `the herds of ${P.name}` }),
    children: P => ({ w: P.town ? 0.4 : 0, kind: 'want', label: `the children of ${P.name}` }),
    worship: P => ({ w: 0.4, kind: 'ambition', label: `to be feared in ${P.name}` }),
    cold: () => ({ w: PW.season() === 'winter' ? 0.8 : 0, kind: 'want', label: 'the winter at its back' }),
    peace: () => ({ w: -1.6, kind: 'duty', label: 'it wants the old peace kept' }),
  };
  const FEAR = {
    hosts: r => ({ w: -clamp((r && r.army ? r.army : 0) / 80000, 0, 1.6), kind: 'fear', label: `the host of ${r ? r.short : 'the realm'}` }),
    sea: P => ({ w: P.coast ? -1 : 0, kind: 'fear', label: 'the sea' }),
  };
  // the province a raid would fall on: near its place, settled, and where its sheet points (a grudge pulls, a love holds back)
  const raidTarget = (L, g) => {
    const here = P_(g.at);
    if (!here) return null;
    const cand = new Set([here.id]);
    let fr = [here.id];
    for (let i = 0; i < 2; i++) { const nx = []; for (const id of fr) for (const j of (P_(id) || {}).adj || []) if (!cand.has(j)) { cand.add(j); nx.push(j); } fr = nx; }
    let best = null, bs = -1e9;
    for (const id of cand) {
      const P = P_(id); if (!P || !P.owner || !(P.town > 0)) continue;
      let s = (P.town || 0) / 100000;
      for (const x of sheetOn(L, P.owner)) s += x.w;
      for (const d of L.desires || []) if (DESIRE[d]) s += Math.max(0, DESIRE[d](P).w);
      s -= (P.id === here.id ? 0 : 0.05);
      if (s > bs) { bs = s; best = P; }
    }
    return best;
  };
  const why = (w, kind, label, source, pub) => ({ kind, weight: w, label, source: source || null, pub: pub !== false });

  PW.legendSeason = function (L, g, rng) {
    const se = PW.season(), hab = L.sleeper && awake(L.id) ? (L.wakeHabit || { do: L.id === 'sword-saint' ? 'roam' : 'hunt', why: 'awake after an age asleep' }) : (L.habits || {})[se] || { do: 'roam', why: 'its ground calls it' };
    const hungry = clamp(g.fed / Math.max(1, L.hungerMonths), 0, 2.5);
    const opts = [];
    const habit = act => (hab.do === act ? [why(2.2, 'temper', `its ${se} habit: ${hab.why}`, { t: 'habit', at: se })] : []);
    const hurt = g.hurt > 0 ? [why(1.5, 'fear', 'its wounds are still open', { t: 'hurt' })] : [];
    opts.push({ id: 'sleep', reasons: [...habit('sleep'), ...hurt, why(hungry < 0.5 ? 0.6 : hungry > 1 ? -1.5 * (hungry - 1) : 0, 'want', hungry < 0.5 ? 'it has fed' : `hunger: ${g.fed} months since it fed`, { t: 'hunger' })] });
    opts.push({ id: 'hunt', reasons: [...habit('hunt'), why(1.2 * hungry, 'want', `hunger: ${g.fed} months since it fed`, { t: 'hunger' }, true)] });
    if (L.home.type !== 'realm') opts.push({ id: 'roam', reasons: [...habit('roam'), why(L.home.type === 'roam' ? 0.5 : -0.5, 'temper', L.home.type === 'roam' ? 'it is a wanderer' : 'it keeps to its lair', { t: 'home' })] });
    opts.push({ id: 'stay', reasons: [...habit('guard'), ...habit('court'), ...habit('stay'), why(0.3, 'temper', L.home.what ? `its place: ${L.home.what}` : 'its place', { t: 'home' })] });
    if (g.rid) {
      const r = A.realm(g.rid), war = r && r.alive && A.atWar && A.atWar(g.rid).length;
      if (war) opts.push({ id: 'march', reasons: [why(2.4, 'duty', `its oath to the crown of ${short(g.rid)}, at war`, { t: 'oath', r: g.rid })] });
    }
    const T_ = g.rid ? null : raidTarget(L, g);
    if (T_) {
      const r = realmOf(T_), rs = [why(0.9 * hungry, 'want', `hunger: ${g.fed} months since it fed`, { t: 'hunger' })];
      for (const d of L.desires || []) if (DESIRE[d]) { const x = DESIRE[d](T_); if (x.w) rs.push(why(x.w, x.kind, x.label, { t: 'desire', at: T_.id })); }
      for (const x of sheetOn(L, T_.owner)) rs.push(why(x.k === 'grudge' ? 1.2 * x.w : 1.6 * x.w, x.k === 'grudge' ? 'grudge' : 'kin', (x.k === 'grudge' ? 'an old grudge: ' : 'it is fond of them: ') + x.why, { t: x.k, r: T_.owner }));
      for (const f of L.fears || []) if (FEAR[f]) { const x = FEAR[f](f === 'hosts' ? r : T_); if (x.w) rs.push(why(x.w, x.kind, x.label, { t: 'fear', r: T_.owner })); }
      if ((L.aims || []).includes('dominion')) rs.push(why(0.4, 'ambition', 'it would rule what it burns', { t: 'aim' }));
      rs.push(why(-2.4, 'cost', 'a raid wakes the realms and their hosts', { t: 'cost' }));
      opts.push({ id: 'raid', at: T_.owner, target: T_.id, reasons: rs, feeds: ['anger', 'pride', 'grudge'] });
    }
    const rec = A.WHY.decide(legMind(L, g), 'legend', opts, { rand: () => rng.next(), band: 1.2, logIf: r => r.chose !== 'sleep' && r.chose !== 'stay' });
    if (!rec) return null;
    g.last = { y: A.S.year, s: se, did: rec.chose, why: A.WHY.tell(rec, true) };
    PW.legendAct(L, g, rec, opts.find(o => o.id === rec.chose), rng);
    return rec;
  };

  PW.legendAct = function (L, g, rec, opt, rng) {
    const Lname = PW.styled(L);
    if (g.hurt > 0) g.hurt = Math.max(0, g.hurt - 1);
    if (rec.chose === 'sleep') { g.fed += 3; g.awake = false; return; }
    g.awake = true;
    if (rec.chose === 'hunt') { g.fed = 0; if (near(A.pc(), P_(g.at), 0)) PW.tell(P_(g.at), `Something vast hunts the wild country around ${P_(g.at).name}. Herdsmen find whole flocks gone. They say it is ${Lname}.`, L.id, rng); return; }
    if (rec.chose === 'stay') { g.fed += 3; return; }
    if (rec.chose === 'roam') {
      g.fed += 3;
      const here = P_(g.at), next = ((here && here.adj) || []).map(P_).filter(P => P && (L.home.terr || []).includes(P.terr));
      if (next.length) g.at = rng.pick(next).id;
      return;
    }
    if (rec.chose === 'march') { g.fed += 3; PW.tell(P_(g.at), `${Lname} has left the gate and marches with the host of ${short(g.rid)}.`, L.id, rng); return; }
    if (rec.chose === 'raid') PW.raid(L, g, P_(opt.target), rec, rng);
  };

  PW.raid = function (L, g, P, rec, rng) {
    if (!P) return;
    const r = realmOf(P), Lname = PW.styled(L);
    g.fed = 0; g.raids = (g.raids || 0) + 1;
    const lost = Math.round((P.pop || 0) * (0.01 + 0.02 * rng.next()));
    if (P.pop) P.pop = Math.max(0, P.pop - lost);
    if (r) r.stability = clamp((r.stability || 0) - (2 + Math.round(3 * rng.next())), 0, 100);
    const because = A.WHY.tell(rec, true);
    PW.tell(P, `${Lname} fell on ${P.name}${r ? ' in ' + short(r.id) : ''}. ${lost > 1000 ? 'Thousands' : 'Many'} are dead or fled. ${because}`, L.id, rng);
    if (r && r.alive) PW.realmAnswer(L, g, r, P, rng);
  };

  // the crown answers a raid through A.WHY: send a host after it, or endure (a host far below it dies for nothing)
  PW.hostOf = r => { const n = Math.max(100, Math.round((r.army || 0) * 0.1)); return { kind: 'host', id: 'host:' + r.id, n: `the host of ${r.short}`, level: PW.levelOf(Math.pow(n, 1.35) * 2), might: Math.pow(n, 1.35) * 2, t: PW.tOf(Math.pow(n, 1.35) * 2), prof: { str: 5, spd: 4, hide: 4, venom: 0, flight: 0, regen: 0, ward: 3, swarm: 10, cunning: 5, magic: 0 }, int: 'wise', titles: [], ranged: true, hardy: 5, men: n }; };
  PW.realmAnswer = function (L, g, r, P, rng) {
    const host = PW.hostOf(r), c = PW.compare(host, L.id);
    const opts = [
      { id: 'host', at: 'legend:' + L.id, reasons: [
        why(0.8 + (r.stability < 30 ? 0.6 : 0), 'duty', `the dead of ${P.name}`, { t: 'raid', at: P.id }),
        why(Math.log(Math.max(0.01, c.p) / Math.max(0.01, 1 - c.p)), 'reckoning', `the host against ${L.n}: ${c.word}`, { t: 'count' }, false),
        why(-0.6, 'cost', 'the men a host would cost', { t: 'cost' }, false),
      ], feeds: ['anger', 'pride', 'grief'] },
      { id: 'endure', reasons: [why(0.4, 'fear', `the dread of ${L.n}`, { t: 'dread' })] },
    ];
    const rec = A.WHY.decide(r.id, 'beast', opts, { rand: () => rng.next(), band: 0.8 });
    if (!rec || rec.chose !== 'host') return rec;
    if (rng.chance(c.p)) {
      g.slain = A.S.year; g.slayer = r.id;
      A.news(`${short(r.id)}'s host has slain ${L.n}${L.titles && L.titles[0] ? ', ' + L.titles[0].n : ''}, at a terrible price. The songs have begun already.`, 'pw');
      PW.know(L.id);
      r.army = Math.max(0, Math.round((r.army || 0) - host.men * 0.5));
      r.stability = clamp((r.stability || 0) + 6, 0, 100);
    } else {
      r.army = Math.max(0, Math.round((r.army || 0) - host.men * (0.3 + 0.4 * rng.next())));
      r.stability = clamp((r.stability || 0) - 4, 0, 100);
      g.hurt = (g.hurt || 0) + 2;
      if (A.WHY.E && A.WHY.E.feel) { const m = legMind(L, g); A.WHY.E.feel(m, 'anger', { at: r.id, label: `${short(r.id)} sent a host against it`, pub: 1 }, 1, { year: A.S.year }); g.feel = m.feel; g.grudges = m.grudges; }
      PW.tell(P, `${short(r.id)} sent a host against ${L.n}. It broke; few came home.`, L.id, rng);
    }
    return rec;
  };

  // ---------------------------------------------------------------- the sleepers at the summit
  // Two of the legends sleep: the King of Dragons wounded under the Crown Range since the Sword Saint threw him there, and
  // the Archdemon Ghazrul bound under the Burning Waste. Once a year each weighs sleep against waking,
  // through A.WHY: what would wake it is on its sheet (wake), read from the world as it is. Its nature weighs hard for sleep,
  // and one that woke within a generation sleeps on. A waking lasts a few years (wakeYears); while awake it lives by
  // legendSeason like the others. If the King wakes while the old Saint lives, they meet on the ridge again.
  const legOf = id => (A.S.pw && A.S.pw.leg && A.S.pw.leg[id]) || null;
  const awake = id => { const g = legOf(id), L = PW.LEG.get(id); return !!(g && L && !g.slain && (!L.sleeper || (g.wokeUntil != null && g.wokeUntil >= A.S.year))); };
  const WAKE = {
    'great wars': () => ({ w: Math.min(2, ((A.S.wars || []).length) * 0.3), label: `${(A.S.wars || []).length} wars burning at once` }),
    'his children slain': () => { const g = legOf('vaskareth'); return { w: g && g.slain ? 3 : 0, label: 'his eldest daughter is slain' }; },
    'the old fight unfinished': () => ({ w: awake('sword-saint') ? 0.6 : 0, label: 'the old man who threw him down still lives' }),
    'the King wakes': () => ({ w: awake('sarnavoth') ? 4 : 0, label: 'the King of Dragons is awake' }),
    'archdemons walk': () => { const g = legOf('morvane'); return { w: (awake('ghazrul') ? 4 : 0) + Math.min(1.5, ((g && g.raids) || 0) * 0.2), label: 'the Archdemons are loose in the world' }; },
    'the seal weakens': () => ({ w: Math.min(1.5, ((A.S.wars || []).length) * 0.12), label: 'the blood spilled in the wars soaks down to the seal' }),
    'souls spilled': () => ({ w: Math.min(1.5, ((A.S.wars || []).length) * 0.2), label: 'souls spilled in the wars above her' }),
    'her brother calls': () => { const g = legOf('morvane'); return { w: Math.min(1.5, ((g && g.raids) || 0) * 0.3), label: 'her brother hunts the world above' }; },
  };
  const WOKE = {
    sarnavoth: 'The roof of the Crown Range has fallen in. Sarnavoth, King of Dragons, is awake after nine hundred years, and every dragon in the sky has turned north.',
    ghazrul: 'The glass seal in the Burning Waste has cracked. Ghazrul the Unmaker is loose. Caravans turn back; the sand is burning.',
  };
  PW.sleeperYear = function (L, g, rng) {
    if (awake(L.id)) return null;
    const lately = g.woke != null && A.S.year - g.woke < 30;
    const rs = (L.wake || []).map(k => (WAKE[k] ? WAKE[k]() : null)).filter(x => x && x.w > 0).map(x => why(x.w, 'want', x.label, { t: 'wake' }));
    const opts = [
      { id: 'sleep', reasons: [why(3.5, 'temper', `its nature: ${(L.habits.spring || {}).why || 'it sleeps'}`, { t: 'habit' }), ...(lately ? [why(3, 'temper', `it woke ${A.S.year - g.woke} years ago`, { t: 'woke' })] : [])] },
      { id: 'wake', reasons: rs },
    ];
    const rec = A.WHY.decide(legMind(L, g), 'legend', opts, { rand: () => rng.next(), band: 0.5, logIf: r => r.chose === 'wake' });
    if (!rec || rec.chose !== 'wake') return rec;
    g.woke = A.S.year; g.wokeUntil = A.S.year + (L.wakeYears || 3); g.awake = true;
    A.news(`${WOKE[L.id] || PW.styled(L) + ' is awake.'} ${A.WHY.tell(rec, true)}`, 'pw');
    PW.know(L.id);
    return rec;
  };
  // the King and the Saint, both awake: they meet on the ridge, as he promised; the loser goes back to his long sleep
  PW.ridge = function (rng) {
    if (!awake('sarnavoth') || !awake('sword-saint')) return null;
    const kg = legOf('sarnavoth');
    if (kg.ridge != null && kg.ridge === kg.woke) return null;   // once a waking
    kg.ridge = kg.woke;
    const c = PW.compare('sword-saint', 'sarnavoth'), saintWins = rng.chance(c.p);
    const lose = legOf(saintWins ? 'sarnavoth' : 'sword-saint');
    lose.hurt = (lose.hurt || 0) + 8; if (saintWins) { lose.wokeUntil = A.S.year - 1; lose.awake = false; }
    if (!saintWins) lose.hurt += 4;   // an old man's wounds
    A.news(saintWins ? 'On the Saint\'s Stair the fight of sixty years ago has been fought again. The old man came down from his hut with his sword, and the King of Dragons has gone back under the mountain.'
      : 'On the Saint\'s Stair the King of Dragons has had his answer. The old Saint was carried down from the ridge alive, barely, and the dragon-king is in the sky.', 'pw');
    return saintWins ? 'saint' : 'king';
  };


  // ---------------------------------------------------------------- wild monsters: feed, fight, rise
  const NAME_A = ['Old', 'Red', 'Black', 'Grey', 'Hollow', 'Iron', 'Bitter', 'Long', 'Pale', 'Night', 'Ash', 'Salt', 'Crook', 'Mother', 'Thorn'];
  const NAME_B = ['tooth', 'maw', 'hide', 'eye', 'claw', 'back', 'horn', 'coil', 'wing', 'hunger', 'jaw', 'tongue', 'mane', 'heart', 'shadow'];
  PW.nameFor = w => { const h = PW.hash(`${A.S.seed}|${w.id}|${w.sp}`); return NAME_A[h % NAME_A.length] + NAME_B[(h >>> 8) % NAME_B.length]; };
  // room in the world (order 96, D-191): a kind the canon counts (world: how many live) and a family under a cap (the
  // dragons: at most 100 of every age and kind) never have more tracked in the wilds than the world holds. Pure: counts only
  PW.room = function (st, s) {
    if (!s) return false;
    const cap = (PW.BD.families[s.fam] || {}).cap;
    if (s.world == null && !cap) return true;
    let kind = 0, fam = 0;
    for (const w of st.wild) { if (w.dead) continue; const ws = PW.species(w.sp); if (!ws) continue; if (ws.id === s.id) kind++; if (ws.fam === s.fam) fam++; }
    return (s.world == null || kind < s.world) && (!cap || fam < cap);
  };
  PW.spawnWild = function (st, rng) {
    const wild = provs().filter(P => isWild(P) || ['mountains', 'marsh'].includes(P.terr));
    if (!wild.length) return null;
    const P = rng.pick(wild), se = PW.season();
    const cands = PW.BD.species.filter(s => !s.apex && s.evolve && s.t >= 12 && s.t <= 45 && terrOk(s, P) && PW.room(st, s));
    const s = wpick(rng, cands, x => Math.exp(-x.t / 18));
    if (!s) return null;
    const w = { id: 'w' + (++st.n), sp: s.id, at: P.id, fed: 0, wins: 0, yrs: 0, born: A.S.year, key: 'w' + st.n };
    st.wild.push(w);
    void se;
    return w;
  };
  PW.wildYear = function (rng) {
    const st = PW.state();
    for (let i = 0; i < 3 && st.wild.length < T.WILD_CAP; i++) if (rng.chance(0.6)) PW.spawnWild(st, rng);
    const keep = [];
    for (const w of st.wild) {
      const s = PW.species(w.sp), P = P_(w.at);
      if (!s || !P) continue;
      w.yrs++;
      // instinct: it feeds where there is prey (the herds of a settled province if it raids stock, else the wild game)
      for (let k = 0; k < 4; k++) if (rng.chance(P.town && s.beh.stock === 'raids' ? 0.65 : 0.5)) { w.fed++; w.ate = P.town && s.beh.stock === 'raids' ? `the herds of ${P.name}` : `the game of the ${P.terr} around ${P.name}`; }
      // it meets rivals and hunters: a fight a year, more for a territorial kind
      if (rng.chance(s.beh.drives.includes('territory') ? 0.55 : 0.35)) {
        const oppL = clamp(s.t + rng.int(-6, 6), 1, 100), me = PW.being(w);
        const p = 1 / (1 + Math.pow(PW.mightOfT(oppL) / me.power, D.odds.k));
        const foe = P.owner && rng.chance(0.4) ? `hunters out of ${P.name}` : `a rival of the ${P.terr}`;
        if (rng.chance(p)) { w.wins++; w.won = foe; }
        else if (rng.chance(0.35)) { w.dead = A.S.year; w.by = foe; if (w.name) PW.tell(P, `${w.name} the ${s.n} is dead, killed by ${foe}.`, w.id, rng); continue; }
      }
      // a winter raid on the flocks, from hunger (a beast's instinct, named)
      if (s.beh.stock === 'raids' && P.owner && rng.chance(w.name ? 0.35 : 0.12)) {
        const pc = A.pc();
        if (pc && pc.alive && near(pc, P, 1)) A.news(`${w.name ? w.name + ' the ' + s.n : 'A' + (/^[aeiou]/i.test(s.n) ? 'n ' : ' ') + s.n.toLowerCase()} took the flocks of ${P.name} in the hungry months.`, 'pw');
      }
      // the rise: fed, won and lived long enough at this form
      const E_ = s.evolve, nx = s.next && PW.species(s.next);
      if (E_ && nx && w.fed >= E_.feeds && w.wins >= E_.wins && w.yrs >= E_.years && PW.room(st, nx)) {
        const rec = { y: A.S.year, id: w.id, from: s.id, to: nx.id, at: P.id,
          why: `fed ${w.fed} times on ${w.ate || 'what it caught'}, won ${w.wins} fight${w.wins === 1 ? '' : 's'} (the last against ${w.won || 'a rival'}), ${w.yrs} year${w.yrs === 1 ? '' : 's'} at its form` };
        w.sp = nx.id; w.fed = 0; w.wins = 0; w.yrs = 0;
        if (nx.apex && !w.name) {
          w.name = PW.nameFor(w); w.int = nx.int;
          w.titles = [{ n: `the ${P.terr === 'marsh' ? 'Mire' : P.terr === 'mountains' ? 'Crag' : P.terr === 'desert' ? 'Dune' : P.terr === 'forest' ? 'Wood' : 'Wild'}-${nx.fam === 'oozes' ? 'Mind' : 'Lord'} of ${P.name}`, honour: 5, buffs: { level: 10, power: 0.2 }, req: 'hidden' }];
          rec.named = w.name;
          PW.tell(P, `In the wilds of ${P.name} a ${s.n.toLowerCase()} has grown into ${/^[AEIOU]/.test(nx.n) ? 'an' : 'a'} ${nx.n.toLowerCase()} and taken a name: ${w.name}. ${nx.int === 'beast' ? '' : 'They say it speaks.'}`, w.id, rng);
        }
        st.evo.unshift(rec);
        if (st.evo.length > T.EVO_CAP) st.evo.length = T.EVO_CAP;
      }
      // a named monster with a mind chooses (A.WHY); a beast does not
      if (w.name && (w.int === 'speaking' || w.int === 'wise')) PW.namedChoice(w, PW.species(w.sp), P, rng);
      keep.push(w);
    }
    st.wild = keep;
  };
  PW.namedChoice = function (w, s, P, rng) {
    const tgt = [P, ...(P.adj || []).map(P_)].filter(x => x && x.owner && x.town > 0)[0];
    if (!tgt) return null;
    const r = realmOf(tgt);
    const opts = [
      { id: 'lair', reasons: [why(0.8, 'temper', `its ${s.beh.guards} in the ${P.terr}`, { t: 'home' })] },
      { id: 'raid', at: tgt.owner, reasons: [
        why(s.beh.drives.includes('hunger') ? 0.9 : 0.3, 'want', `hunger, and the herds of ${tgt.name}`, { t: 'hunger' }),
        why(s.beh.drives.includes('pride') ? 0.7 : 0.2, 'ambition', 'it would be feared', { t: 'pride' }),
        why(-clamp(((r && r.army) || 0) / 60000, 0, 1.5), 'fear', `the spears of ${r ? r.short : 'the realm'}`, { t: 'fear' }),
      ] },
    ];
    const mind = { id: 'beast:' + w.id, temper: { pride: 0.4, wrath: 0.3, caution: s.beh.people === 'avoids' ? 0.5 : 0, greed: s.beh.guards === 'hoard' ? 0.6 : 0 }, feel: [] };
    const rec = A.WHY.decide(mind, 'beast', opts, { rand: () => rng.next(), band: 1, logIf: x => x.chose === 'raid' });
    if (rec && rec.chose === 'raid') {
      if (tgt.pop) tgt.pop = Math.max(0, Math.round(tgt.pop * 0.995));
      if (r) r.stability = clamp((r.stability || 0) - 1, 0, 100);
      PW.tell(tgt, `${w.name} the ${s.n} raided ${tgt.name}. ${A.WHY.tell(rec, true)}`, w.id, rng);
    }
    return rec;
  };

  // ---------------------------------------------------------------- the player: what the wilds bring him
  const WILD_ACTS = ['explore', 'travel', 'pilgrimage'];
  const doingWild = st => {
    const ya = A.S.yearActs || {}, a = st.acts && st.acts.y === A.S.year ? st.acts : { y: A.S.year };
    let n = 0;
    for (const k of WILD_ACTS) { if ((ya[k] || 0) > (a[k] || 0)) n++; a[k] = ya[k] || 0; }
    st.acts = a;
    return n > 0;
  };
  // the place's danger: the level the wilds here usually bring (a town's lanes to the deep wild)
  PW.placeLevel = function (P, doing) {
    if (!P) return 10;
    let t = P.town >= 20000 ? 8 : P.town >= 3000 ? 14 : 22;
    if (['mountains', 'marsh'].includes(P.terr)) t += 6; else if (['forest', 'desert'].includes(P.terr)) t += 3;
    if (doing) t += 6;
    return t;
  };
  PW.pickBeast = function (P, target, rng, opts) {
    opts = opts || {};
    const se = PW.season();
    const cands = PW.BD.species.filter(s => !s.unique && terrOk(s, P) && (s.seasons || []).includes(se) && (!opts.max || s.t <= opts.max));
    return wpick(rng, cands, s => Math.exp(-Math.pow(s.t - target, 2) / (2 * 49)) / (s.beh.people === 'avoids' && !opts.hunt ? 2 : 1));
  };
  PW.exposure = function (pc, P, doing) {
    let x = (T.terr[P.terr] || 0.004) * (P.town >= 20000 ? T.city : P.town >= 3000 ? T.town : T.wild);
    if (doing) x *= T.doing;
    if (PW.season() === 'winter') x *= T.winter;
    try { if (A.C && A.C.soldier(pc) && A.C.atWar(pc)) x *= T.war; } catch (e) { /* no war helpers */ }
    return x;
  };
  PW.cause = function (s, P) {
    const se = PW.season(), b = s.beh;
    if (b.nature) return `it is ${b.nature.k}: it ${b.nature.spec.split(';')[0]}`;   // its nature is its reason
    if (b.mating === se) return `it is the ${se} and its blood is up`;
    if (se === 'winter' && b.drives.includes('hunger')) return 'the winter has starved it bold';
    if (b.drives[0] === 'territory') return 'you have walked onto its ground';
    if (b.drives[0] === 'young' || b.guards === 'young') return 'its young are somewhere close';
    if (b.drives[0] === 'curiosity' || b.drives[0] === 'play') return 'it is curious about you';
    if (b.drives[0] === 'devotion' || b.drives[0] === 'duty') return `it keeps its ${b.guards}, and you are near it`;
    return b.hunt === 'scavenge' ? 'it smells food on you' : 'it is hunting, and you are what it found';
  };
  PW.monthPlayer = function (pc, st) {
    if (!pc || !pc.alive || pc.prison || A.age(pc) < 12) return;
    if (st.last != null && absMonth() - st.last < T.GAP_MONTHS) return;
    if ((A.S.queue || []).some(q => q && q.ev && /^pw_/.test(q.ev))) return;
    const P = P_(pc.home);
    if (!P) return;
    const doing = doingWild(st), rng = PW.rng('enc:' + pc.id);
    if (!rng.chance(PW.exposure(pc, P, doing))) return;
    // a named monster or an awake great being on this very ground is met first, now and then
    const here = st.wild.filter(w => w.at === P.id && !w.dead);
    let ctx = null;
    const leg = LD.legends.find(L => { const g = st.leg[L.id]; return g && !g.slain && g.awake && g.at === P.id; });
    if (leg && rng.chance(0.25)) { A.queue({ type: 'event', ev: 'pw_great', ctx: { lg: leg.id, cause: (st.leg[leg.id].last || {}).did || 'roam' } }); st.last = absMonth(); return; }
    if (here.length && rng.chance(0.4)) { const w = rng.pick(here); ctx = { sp: w.sp, wid: w.id, key: w.key }; }
    if (!ctx) { const s = PW.pickBeast(P, PW.placeLevel(P, doing), rng); if (!s) return; ctx = { sp: s.id, key: `m${absMonth()}` }; }
    ctx.cause = PW.cause(PW.species(ctx.sp), P);
    ctx.place = P.name;
    if (doing) ctx.doing = 1;
    A.queue({ type: 'event', ev: 'pw_encounter', ctx, npc: true });
    st.last = absMonth();
  };
  // the hunt (A.startHunt asks first): the bestiary by place and the hunter's standing; true when it took the hunt
  PW.hunt = function (pc, famous) {
    const st = PW.state(), P = P_(pc && pc.home);
    if (!st || !P) return false;
    st.hn = (st.hn || 0) + 1;
    const rng = PW.rng('hunt:' + st.hn);
    if (!rng.chance(famous ? T.famousChance : T.huntChance)) return false;
    const me = PW.being(pc).t;
    let ctx = null;
    if (famous) {
      const prey = st.wild.filter(w => !w.dead && (w.at === P.id || (P.adj || []).includes(w.at)));
      if (prey.length) { const w = rng.pick(prey); ctx = { sp: w.sp, wid: w.id, key: w.key }; }
    }
    if (!ctx) { const s = PW.pickBeast(P, famous ? me + 4 : Math.max(4, me - 3), rng, { hunt: true }); if (!s) return false; ctx = { sp: s.id, key: `h${st.hn}` }; }
    Object.assign(ctx, { hunt: 1, famous: famous ? 1 : 0, place: P.name, cause: famous ? 'you have tracked it for weeks' : 'you came looking for game, and found this' });
    A.queue({ type: 'event', ev: 'pw_encounter', ctx });
    return true;
  };

  // ---------------------------------------------------------------- the year's tale: a great being the player hears of
  PW.tale = function (pc, st, rng) {
    if (!pc || !pc.alive) return;
    // the Sword Saint's story every child hears, told as his own people tell it (the sheet's tellings), with one saying
    const S_ = PW.LEG.get('sword-saint');
    if (S_ && !st.saintTold && A.age(pc) >= 4) {
      const tell = (S_.tellings || {})[pc.race] || (S_.tellings || {}).human || S_.d, say = S_.sayings && S_.sayings.length ? S_.sayings[PW.hash(`${A.S.seed}|${pc.id}`) % S_.sayings.length] : '';
      A.log(`The story every child knows: Cael Vardan, the Sword Saint. ${tell}${say ? ` They say he said: "${say}"` : ''}`, 'lore');
      st.saintTold = A.S.year; PW.know('sword-saint');
      return;
    }
    if (A.age(pc) < 8) return;
    const unknown = PW.great().filter(x => st.known[x.id] == null);
    if (!unknown.length || !rng.chance(0.3)) return;
    const x = rng.pick(unknown), L = PW.LEG.get(x.id) || PW.MAS.get(x.id);
    const t = x.titles && x.titles[0] ? ` ${x.titles[0].n}` : '';
    A.log(`A tale by the fire: ${x.n}${t}. ${L && L.d ? L.d : 'A name the old ones lower their voices for.'}`, 'lore');
    PW.know(x.id);
  };

  // ---------------------------------------------------------------- the monthly turn
  PW.month = function (pc) {
    const st = PW.state();
    if (!st) return;
    const m = month();
    if (m % 3 === 2) { const rng = PW.rng('legends'); for (const L of LD.legends) { const g = st.leg[L.id]; if (g && !g.slain && (!L.sleeper || awake(L.id))) PW.legendSeason(L, g, rng); } }
    if (m === 2) { const rng = PW.rng('sleepers'); for (const L of LD.legends) { const g = st.leg[L.id]; if (g && !g.slain && L.sleeper) PW.sleeperYear(L, g, rng); } PW.ridge(rng); }
    if (m === 2) { PW.wildYear(PW.rng('wild')); PW.tale(pc, st, PW.rng('tale')); }
    PW.monthPlayer(pc, st);
  };
  A.onMonth = A.onMonth || [];
  A.onMonth.push(pc => { try { PW.month(pc); } catch (e) { console.error('[powers] month', e); } });
})();
