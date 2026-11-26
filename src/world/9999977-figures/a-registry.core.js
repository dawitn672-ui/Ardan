// The figures registry (order 96, D-193): full profiles of the strongest and most influential people and beings of the
// continent, in a clear organization by category (data/figures/, one file a category).
//
// A.FIG
//   FIG.CATS               the categories, in order: { id, name, group, order, kind, note, groupBy }
//   FIG.list(catId)        that category's profiles (pure): the fixed beings' from data, the linked legends' and masters'
//                          from their sheets with the overlay, the generated people's computed from the world as it is
//   FIG.profile(id)        one profile by id ('fig:<pid>' for a person of the world), or null
//   FIG.all()              every profile of every category, in order
//   FIG.mind(id)           a fixed being's mind for A.WHY.decide: { id, temper, feel, grudges } (its goals are reasons
//                          a caller adds to the options they feed)
//   FIG.knows(pc, prof)    what the player may read of a profile: { listed, arts, secret } (order 93: only what he should
//                          know): listed, its name and public facts; arts, its skills, arts and items (once met); secret,
//                          its goals, grudges and secret story (once learned)
// A profile: { id, cat, type ('being' | 'legend' | 'master' | 'person'), name, style, race, nature, level, cls, skills,
// arts, titles, items, temper, traits, goals, grudges, home, fame, story, secret: { story }, liege, pid, realm }.
//
// The fixed beings are wired into A.POWER as the legends are (src/world/9999970-powers PW.being reads PW.FIG): their
// level (the data's, plus what they gain by the same rule as the legends) and their might are real; they fight only when
// an existing encounter path meets them. Nothing here is stored: the people's profiles are views of the state, cached for
// the day they were read in (a Map keyed by the state and the date; never saved). Pure: no draw from any stream, no write
// to A.S, so a page may read it.
(function () {
  const DD = A.DATA || {}, V = DD['figures/vocab'], PW = A.POWER;
  if (!V || !PW) { console.error('[figures] data/figures/vocab.json or A.POWER is missing'); return; }
  const FIG = A.FIG = { V };
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const files = Object.keys(DD).filter(k => /^figures\//.test(k) && k !== 'figures/vocab').sort();
  const groupIx = g => V.groups.findIndex(x => x.id === g);
  FIG.FILES = new Map(files.map(k => [DD[k].category.id, DD[k]]));
  FIG.CATS = files.map(k => Object.assign({}, DD[k].category)).sort((a, b) => groupIx(a.group) - groupIx(b.group) || a.order - b.order);
  FIG.GROUPS = V.groups;

  // ---------------------------------------------------------------- the fixed beings, read once
  const SKD = new Map();
  for (const k of Object.keys(DD)) if (/^skills\//.test(k) && DD[k] && Array.isArray(DD[k].skills)) for (const s of DD[k].skills) if (!SKD.has(s.id)) SKD.set(s.id, s);
  // a skill of a sheet as the legends' are written ({ n, rank, lvl, kind, fight, does }), the library's read from data/skills
  const skillOf = k => {
    if (!k.id) return Object.assign({}, k);
    const s = SKD.get(k.id) || {};
    return { id: k.id, n: s.name || k.id, rank: s.rank || 'D', lvl: k.lvl, kind: s.kind || 'active', fight: k.fight !== false, does: s.text || '' };
  };
  const FIX = new Map(), BEING = new Map();
  for (const [cid, d] of FIG.FILES) if (d.category.kind === 'fixed') for (const f of d.figures || []) {
    const sp = PW.species(f.kind);
    if (!sp) { console.error('[figures] ' + f.id + ': no bestiary kind ' + f.kind); continue; }
    FIX.set(f.id, Object.assign({}, f, { cat: cid }));
    // the sheet A.POWER reads, as a legend's: its kind's capabilities, its skills (caps), items (gives), titles (buffs)
    BEING.set(f.id, { id: f.id, n: f.name, fam: sp.fam, level: f.level, int: sp.int, prof: Object.assign({}, sp.prof), skills: f.skills.map(skillOf),
      items: f.items || [], titles: (f.titles || []).map(PW.titleRef), class: null, sp: sp.id });
  }
  FIG.FIX = FIX;
  PW.FIG = BEING;   // PW.being(id) resolves these as it does the legends and the masters

  // ---------------------------------------------------------------- words
  const AXW = V.axisWords || {};
  // a temper in words: the axes that stand out (|v| >= 0.4), strongest first, at most four
  FIG.temperWords = T => Object.keys(T || {}).filter(k => AXW[k] && Math.abs(T[k]) >= 0.4).sort((a, b) => Math.abs(T[b]) - Math.abs(T[a]) || byId(a, b)).slice(0, 4).map(k => AXW[k][T[k] > 0 ? 1 : 0]);
  FIG.traitName = t => (GD.TRAITS && GD.TRAITS[t] ? GD.TRAITS[t].name : String(t));
  const sexOf = p => (p && p.sex === 'F' ? 'F' : 'M');
  const fill = (tpl, x) => String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => {
    const lo = k.charAt(0).toLowerCase() + k.slice(1), v = x[k] != null ? x[k] : x[lo];
    if (v == null || v === '') return '\u0000';
    const s = String(v); return k !== lo ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  });
  const line = (tpl, x) => { const s = fill(tpl, x); return s.includes('\u0000') ? null : s; };
  const ord = n => ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'][n - 1] || null;
  const realmName = rid => { const r = rid && A.realm ? A.realm(rid) : null; return r ? r.name : ''; };
  const atName = g => {
    if (g.kind === 'figure') { const f = FIX.get(g.at) || (PW.MAS.get(g.at) || null); return f ? (f.name || f.n) : g.at; }
    if (g.kind === 'legend') { const L = PW.LEG.get(g.at); return L ? L.n : g.at; }
    if (g.kind === 'realm') return realmName(g.at) || g.at;
    if (g.kind === 'race') return (GD.RACES && GD.RACES[g.at] ? GD.RACES[g.at].name + 's' : g.at);
    if (g.kind === 'kind') return g.at === 'dragon' ? 'the dragons' : g.at;
    if (g.kind === 'person') { const q = A.P ? A.P(g.at) : null; return q ? A.fullName(q, false) : (A.WC && A.WC.name ? A.WC.name(g.at) : '') || 'someone'; }
    return String(g.at);
  };
  const withNames = gs => (gs || []).map(g => Object.assign({}, g, { atName: atName(g) }));

  // ---------------------------------------------------------------- the beings' profiles (fixed, linked)
  const titlesOf = list => (list || []).map(t => { const T = typeof t === 'string' ? PW.titleRef(t) : t; return { id: T.id, n: T.n, honour: T.honour || 0, buffs: T.buffs || {} }; });
  const levelOf = id => { const b = PW.being(id); return b ? b.level : 0; };
  const fixedProfile = f => {
    const sp = PW.species(f.kind), b = PW.being(f.id);
    return {
      id: f.id, cat: f.cat, type: 'being', name: f.name, style: f.style || null, nature: sp.tier, kindName: sp.n, race: sp.fam, level: b ? b.level : f.level,
      cls: null, skills: BEING.get(f.id).skills, arts: f.arts || [], titles: titlesOf(BEING.get(f.id).titles), items: f.items || [],
      temper: f.temper, traits: f.traits, goals: f.goals, grudges: withNames(f.grudges), home: f.home, fame: f.fame,
      story: f.story, secret: { story: (f.secret && f.secret.story) || [] }, liege: f.liege || null, power: b ? b.power : 0,
    };
  };
  const LGF = FIG.FILES.get('legends') || { groups: [], secret: [] };
  const legendProfile = L => {
    const b = PW.being(L.id), clsId = L.class ? String(L.class).toLowerCase().replace(/[^a-z]+/g, '-') : null;
    const cls = clsId && A.LV && A.LV.CL && A.LV.CL.BY.get(clsId) ? { id: clsId, name: A.LV.CL.BY.get(clsId).name } : (L.class ? { id: null, name: L.class } : null);
    const grp = (LGF.groups || []).find(g => (g.ids || []).includes(L.id));
    const sec = [];
    if (L.century) sec.push('What it wants this century: ' + L.century);
    if (L.desires && L.desires.length) sec.push('It desires ' + L.desires.join(' and ') + '.');
    if (L.fears && L.fears.length) sec.push('It fears ' + L.fears.join(' and ') + '.');
    return {
      id: L.id, cat: 'legends', type: 'legend', group: grp ? grp.name : null, name: L.n, style: PW.styled(L), nature: 'legend', race: L.fam, level: b ? b.level : L.level,
      cls, skills: L.skills || [], arts: (L.skills || []).filter(k => k.kind === 'active').map(k => k.n), titles: titlesOf(L.titles), items: L.items || [],
      temper: L.temper || {}, traits: (L.traits || []).slice(), freeTraits: true,
      goals: L.century ? [{ kind: 'ambition', w: 1.5, why: L.century }] : [], grudges: withNames((L.grudges || []).map(g => Object.assign({}, g, { kind: g.kind === 'being' ? 'legend' : g.kind }))),
      home: { name: (L.home && L.home.place) || '', domain: (L.home && L.home.what) || '', known: true }, fame: 'known',
      story: [L.d, L.history].filter(Boolean), secret: { story: sec }, liege: null, power: b ? b.power : 0,
    };
  };
  const RMF = FIG.FILES.get('race-masters') || { figures: [] }, RMO = new Map((RMF.figures || []).map(f => [f.id, f]));
  const masterProfile = M => {
    const o = RMO.get(M.id) || {}, b = PW.being(M.id), road = o.road || [], c = road.length && A.LV && A.LV.CL ? A.LV.CL.BY.get(road[road.length - 1]) : null;
    return {
      id: M.id, cat: 'race-masters', type: 'master', name: M.n, style: PW.styled(M), nature: 'master', race: M.race, level: b ? b.level : M.level,
      cls: c ? { id: c.id, name: c.name, road: road.map(id => (A.LV.CL.BY.get(id) || {}).name || id) } : null, skills: M.skills || [], arts: o.arts || [],
      titles: titlesOf(M.titles), items: M.items || [], temper: o.temper || {}, traits: o.traits || [], goals: o.goals || [], grudges: withNames(o.grudges),
      home: o.home || { name: M.homeName || '', domain: '', known: true }, fame: o.fame || 'known', story: [M.d].concat(o.story || []).filter(Boolean),
      secret: { story: (o.secret && o.secret.story) || [] }, liege: null, power: b ? b.power : 0,
    };
  };

  // ---------------------------------------------------------------- the people of the world (generated, views of state)
  const live = p => !!(p && p.alive !== false && p.st);
  const sinceOf = key => { const h = A.S && A.S.posts && A.S.posts.h && A.S.posts.h[key]; return h && h.s > 0 ? Math.floor(h.s / 365) : null; };
  const SKIDS = () => (A.SK && A.SK.IDS) || Object.keys((GD && GD.SKILLS) || {});
  FIG.skillsOf = function (p) {
    const out = [];
    for (const k of SKIDS()) {
      let r = null; try { r = A.SK2 && A.SK2.rungFor ? A.SK2.rungFor(p, k) : null; } catch (e) { r = null; }
      if (!r) continue;
      const v = A.SK2.E().value(r.rank, r.lv);
      out.push({ k, n: A.SK2.rungName(k, r.rank), rank: r.rank, lvl: r.lv, label: A.SK2.label(p, k, { bare: true }), v });
    }
    return out.sort((a, b) => b.v - a.v || byId(a.k, b.k)).slice(0, 6);
  };
  // the arts he holds and readies, by the same pure choice a fight makes (37-skills2 f-kinds: E.chooseReady)
  FIG.artsOf = function (p) {
    const SK2 = A.SK2; if (!SK2 || !SK2.artsHeld) return { held: [], ready: [] };
    let held = []; try { held = SK2.artsHeld(p) || []; } catch (e) { held = []; }
    const E = SK2.E(), ix = SK2.IX();
    const uses = held.map(h => { const s = ix.BY[h.id]; return s ? E.artUse(ix, s, h.lv) : null; }).filter(u => u && u.kind !== 'passive' && SK2.inFight(ix.BY[u.id]));
    let ready = [];
    try { ready = E.chooseReady(uses, SK2.slotsOf(p), null); } catch (e) { ready = []; }
    const nm = id => (ix.BY[id] ? ix.BY[id].name : id);
    return { held: held.map(h => ({ id: h.id, n: nm(h.id), lvl: h.lv, rank: (ix.BY[h.id] || {}).rank || 'D', kind: (ix.BY[h.id] || {}).kind || 'active' })), ready: ready.map(nm) };
  };
  FIG.itemsOf = function (p) {
    const g = p.gear || {}, out = [];
    for (const slot of ['weapon', 'ranged', 'armor', 'shield', 'helm', 'mount']) {
      const k = g[slot]; if (!k || k === 'none' || k === 'fists') continue;
      const G = GD.GEAR && GD.GEAR[k]; out.push({ n: G && G.name ? G.name : k, kind: slot, quality: 'fine', does: '', gives: {} });
    }
    return out;
  };
  const castOf = p => { const C = typeof LORE !== 'undefined' && LORE.cast; return p && p.castId && C ? (Array.isArray(C) ? C.find(c => c.id === p.castId) : C[p.castId]) || null : null; };
  // the reasons A.WHY reads in him (W.temper, W.mind): what his post and his temper make him want, and the feelings and
  // enmities he carries now
  const AMB = { ambitious: ['ambition', 1.2, 'more than he has'], greedy: ['coin', 1.0, 'coin, and more of it'], zealous: ['faith', 1.0, 'the faith kept, by everyone'],
    loyal: ['loyalty', 1.0, 'to keep faith with those he is sworn to'], proud: ['station', 0.8, 'the honour his place is owed'], kind: ['kin', 0.8, 'his own kept safe'] };
  FIG.goalsOf = function (p, post) {
    const out = [];
    if (post === 'ruler') out.push({ kind: 'kin', w: 1.4, why: 'the throne kept for his own line' });
    if (post === 'house') out.push({ kind: 'claim', w: 1.0, why: 'his house\'s lands and rank held, and raised if he can' });
    if (post === 'general') out.push({ kind: 'duty', w: 1.2, why: 'his host kept whole and his realm\'s wars won' });
    if (post === 'order') out.push({ kind: 'duty', w: 1.2, why: 'his order kept the best of the realm' });
    for (const t of p.traits || []) if (AMB[t]) out.push({ kind: AMB[t][0], w: AMB[t][1], why: AMB[t][2] });
    const c = castOf(p); if (c && c.wants) out.push({ kind: 'want', w: 1.0, why: c.wants.replace(/^(He|She) wants /, '') });
    return out.slice(0, 4);
  };
  FIG.grudgesOf = function (p) {
    const out = [], F = A.WHY && A.WHY.E && A.WHY.E.FEELINGS;
    for (const f of Array.isArray(p.feel) ? p.feel : []) if (f && F && F[f.k] && F[f.k].wrong && f.at != null) {
      const r = A.realm && A.realm(f.at);
      out.push({ at: f.at, kind: r ? 'realm' : 'person', w: Math.round((f.heat || 0.5) * 100) / 100, why: F[f.k].word + (f.cause && f.cause.label ? ': ' + f.cause.label : '') });
    }
    for (const id of Object.keys(p.rel || {}).sort()) { const r = p.rel[id]; if (r && (r.type === 'rival' || r.type === 'enemy') && A.P(id)) out.push({ at: id, kind: 'person', w: r.type === 'enemy' ? 1.2 : 0.8, why: r.type === 'enemy' ? 'an enemy of long standing' : 'a rival' }); }
    return withNames(out.slice(0, 4));
  };
  const ageWords = p => { const a = A.age(p); return a + ''; };
  const wcLines = p => {
    const WC = A.WC; if (!WC || !WC.all) return [];
    const R = A.S && A.S.wrec; if (!R || !Array.isArray(R.e)) return [];
    const out = [];
    for (let i = R.e.length - 1; i >= 0 && out.length < 3; i--) { const e = R.e[i]; if (e && Array.isArray(e[6]) && e[6].includes(p.id)) { const s = WC.line(WC.ent(i)); if (s) out.push(s); } }
    return out;
  };
  // where he lives: his own province when it lies in his realm, else his realm's capital
  const homeOf = p => {
    const P = p.home != null && A.prov ? A.prov(p.home) : null, r = A.realm ? A.realm(p.realm) : null;
    if (P && (P.realm === p.realm || P.owner === p.realm)) return P.name;
    return r ? r.capital || '' : P ? P.name : '';
  };
  const personProfile = (p, cat, post, extra) => {
    const lv = A.LV ? A.LV.level(p) : PW.level(p), c = A.LV && A.LV.CL ? A.LV.CL.shown(p) : null, arts = FIG.artsOf(p), cast = castOf(p);
    const story = (extra.story || []).filter(Boolean).concat(wcLines(p));
    if (cast && cast.manner) story.push(cast.manner);
    const sec = [];
    if (cast && cast.wants) sec.push(cast.wants);
    if (cast && cast.fears) sec.push(cast.fears);
    return {
      id: 'fig:' + p.id, pid: p.id, cat, type: 'person', name: A.fullName(p, false), style: extra.style || null, nature: null, race: p.race, level: lv,
      cls: c ? { id: c.id, name: c.name } : null, skills: FIG.skillsOf(p), arts: arts.ready, artsHeld: arts.held,
      titles: A.TT && A.TT.shownOf ? A.TT.shownOf(p) : [], items: FIG.itemsOf(p), temper: A.WHY ? A.WHY.temper(p) : {}, traits: (p.traits || []).filter(t => V.traits.includes(t)),
      goals: FIG.goalsOf(p, post), grudges: FIG.grudgesOf(p), home: { name: extra.home || homeOf(p), domain: realmName(p.realm), known: true },
      fame: 'known', story, secret: { story: sec }, liege: null, realm: p.realm, age: A.age(p), sex: sexOf(p), looks: p.desc || (cast && cast.looks) || '',
    };
  };
  const pron = p => (sexOf(p) === 'F' ? { khe: 'she', khis: 'her' } : { khe: 'he', khis: 'his' });
  const RH = () => (typeof LORE !== 'undefined' && LORE.rulerHistory) || {};
  const ruler = function (r) {
    const p = A.P(r.ruler); if (!live(p)) return null;
    const VO = (FIG.FILES.get('rulers') || {}).voice || {}, x = Object.assign({ name: A.fullName(p, false), realm: r.name, age: ageWords(p) }, pron(p));
    // the reign: the realm's line in the lore (its reigning entry), else the world record's succession
    let since = null, nth = null, lineName = null;
    const h = RH()[r.id], sur = p.sur || '';
    if (Array.isArray(h) && h.length) {
      const cur = h.find(e => e[4] === 'reigning' && String(e[0]).split(' ')[0] === p.given);
      if (cur) since = cur[2];
      if (cur && sur) { lineName = sur + 's'; nth = h.filter(e => String(e[0]).endsWith(' ' + sur)).length; }
    }
    const R = A.S.wrec;
    if (since == null && R && Array.isArray(R.e)) for (let i = R.e.length - 1; i >= 0; i--) { const e = R.e[i]; if (e && (e[0] === 'ruler' || e[0] === 'crown') && Array.isArray(e[6]) && e[6].includes(p.id)) { since = e[1]; break; } }
    const story = [since != null ? line(VO.reign, Object.assign({ since }, x)) : null,
      lineName && nth > 1 && ord(nth) ? line(VO.line, Object.assign({ nth: ord(nth), line: lineName }, x)) : lineName && nth === 1 ? line(VO.first, Object.assign({ line: lineName }, x)) : null];
    return personProfile(p, 'rulers', 'ruler', { story, style: p.title || (r.title ? r.title + ' of ' + (r.short || r.name) : null) });
  };
  const RUNG = { N01: 'Duke', N02: 'Marquis' };
  const house = function (h) {
    const p = h.headPid != null ? A.P(h.headPid) : null; if (!live(p)) return null;
    const r = A.realm(h.realm), VO = (FIG.FILES.get('great-houses') || {}).voice || {};
    const rank = (p.sex === 'F' ? { Duke: 'Duchess', Marquis: 'Marchioness' } : {})[RUNG[h.rung]] || RUNG[h.rung] || h.title || 'lord';
    const x = Object.assign({ name: A.fullName(p, false), house: h.name, rank, realm: r ? r.name : '', since: sinceOf('house:' + h.id), seat: h.seat || null, age: ageWords(p) }, pron(p));
    return personProfile(p, 'great-houses', 'house', { story: [line(VO.head, x), line(VO.since, x), line(VO.seat, x)], style: rank + ', ' + h.name, house: h.id, home: h.seat || null });
  };
  const general = function (x0) {
    const g = x0.general, p = g && g.pid ? A.P(g.pid) : null; if (!live(p)) return null;
    const r = A.realm(x0.realm), VO = (FIG.FILES.get('generals') || {}).voice || {}, H = g.house && A.S.houses[g.house];
    const x = Object.assign({ name: A.fullName(p, false), host: x0.name || 'a host', realm: r ? r.name : '', house: H ? H.name : null, age: ageWords(p),
      battles: p.mil && p.mil.battles ? (p.mil.battles === 1 ? 'one battle' : p.mil.battles + ' battles') : null }, pron(p));
    const story = [line(VO.leads, x), x0.first ? line(VO.senior, x) : null, g.by === 'lord' ? line(VO.byRight, x) : null, line(VO.battles, x)];
    return personProfile(p, 'generals', 'general', { story, style: x0.first ? 'Senior General of ' + (r ? r.short || r.name : '') : 'General, ' + (x0.name || '') });
  };
  const ORD = id => (GD.ORDERS && GD.ORDERS[id]) || {}, ORDN = id => ORD(id).name || String(id).replace(/_/g, ' ');
  const master = function (key, pid) {
    const p = A.P(pid); if (!live(p)) return null;
    const k = A.POSTS.parse(key), r = A.realm(k.rid), VO = (FIG.FILES.get('order-masters') || {}).voice || {};
    const x = Object.assign({ name: A.fullName(p, false), order: ORDN(k.id), realm: r ? r.name : '', since: sinceOf(key), age: ageWords(p) }, pron(p));
    return personProfile(p, 'order-masters', 'order', { story: [line(VO.master, x), line(VO.since, x)], style: ORD(k.id).lead || 'Grand Master, ' + ORDN(k.id) });
  };

  // every generated category at once (a person is listed once: ruler, then great house, then order master, then General)
  const CACHE = new Map();
  const genKey = () => { const S = A.S; return S ? [S.seed, S.year, S.warClock || 0, S.nextId, S.pc, (S.posts && S.posts.h ? Object.keys(S.posts.h).length : 0)].join('|') : ''; };
  FIG.generated = function () {
    const S = A.S; if (!S || !S.realms) return { rulers: [], 'great-houses': [], generals: [], 'order-masters': [] };
    const key = genKey(), hit = CACHE.get(S);
    if (hit && hit.key === key) return hit.v;
    const seen = new Set(), out = { rulers: [], 'great-houses': [], generals: [], 'order-masters': [] };
    const put = (cat, prof) => { if (prof && !seen.has(prof.pid)) { seen.add(prof.pid); out[cat].push(prof); } };
    const rids = Object.keys(S.realms).sort();
    for (const rid of rids) { const r = S.realms[rid]; if (r && r.alive !== false && r.ruler) put('rulers', ruler(r)); }
    const GH = (FIG.FILES.get('great-houses') || {}).rule || { rungs: ['N01', 'N02'] };
    for (const hid of Object.keys(S.houses || {}).sort()) { const h = S.houses[hid]; if (h && !h.extinct && (GH.rungs || []).includes(h.rung) && S.realms[h.realm] && S.realms[h.realm].alive !== false) put('great-houses', house(h)); }
    if (A.POSTS) for (const k of Object.keys(S.posts.h || {}).sort()) if (/^order:/.test(k) && S.posts.h[k] && S.posts.h[k].p) put('order-masters', master(k, S.posts.h[k].p));
    if (A.HOSTS && A.HOSTS.all) { let hs = []; try { hs = A.HOSTS.all(); } catch (e) { hs = []; } for (const x of hs) if (x.host && x.general && x.general.pid) put('generals', general(x)); }
    const order = (a, b) => byId(a.realm || '', b.realm || '') || b.level - a.level || byId(a.pid, b.pid);
    out.rulers.sort((a, b) => b.level - a.level || byId(a.realm, b.realm));
    out['great-houses'].sort(order); out.generals.sort(order); out['order-masters'].sort(order);
    if (CACHE.size > 4) CACHE.clear();
    CACHE.set(S, { key, v: out });
    return out;
  };

  // ---------------------------------------------------------------- the registry
  let FIXP = null, LINKP = null;
  const fixedAll = () => FIXP || (FIXP = [...FIX.values()].map(fixedProfile));
  // the linked sheets' profiles read A.POWER's level, which moves with what a legend gains: computed afresh each read
  const linked = () => ({ legends: PW.LD.legends.map(legendProfile), 'race-masters': PW.D.masters.map(masterProfile) });
  FIG.list = function (cid) {
    const c = FIG.CATS.find(x => x.id === cid); if (!c) return [];
    if (c.kind === 'fixed') return fixedAll().filter(p => p.cat === cid).map(p => Object.assign({}, p, { level: levelOf(p.id) }));
    if (c.kind === 'link') { const L = linked()[cid] || []; return cid === 'legends' ? L.sort((a, b) => b.power - a.power || byId(a.id, b.id)) : L.sort((a, b) => b.level - a.level); }
    return FIG.generated()[cid] || [];
  };
  FIG.all = () => FIG.CATS.flatMap(c => FIG.list(c.id));
  FIG.profile = function (id) {
    if (FIX.has(id)) return FIG.list(FIX.get(id).cat).find(p => p.id === id) || null;
    if (PW.LEG.has(id)) return legendProfile(PW.LEG.get(id));
    if (PW.MAS.has(id)) return masterProfile(PW.MAS.get(id));
    const g = FIG.generated();
    for (const k in g) { const p = g[k].find(x => x.id === id || x.pid === id); if (p) return p; }
    return null;
  };
  FIG.count = cid => FIG.list(cid).length;
  FIG.mind = function (id) {
    const f = FIX.get(id); if (!f) return null;
    return { id: 'figure:' + id, temper: f.temper || {}, feel: [], grudges: (f.grudges || []).map(g => ({ at: g.at, w: g.w, cause: { t: 'figure', id, label: g.why } })) };
  };

  // ---------------------------------------------------------------- what the player may read (order 93)
  const CLOSE = /^(father|mother|son|daughter|brother|sister|husband|wife|spouse|lover|friend|best friend|grandfather|grandmother|uncle|aunt|cousin|half-brother|half-sister|liege|mentor)$/i;
  FIG.learned = (pc, id) => !!(pc && pc.flags && pc.flags['fig_' + id] != null);
  FIG.knows = function (pc, prof) {
    if (!pc || !prof) return { listed: false, arts: false, secret: false };
    const st = (A.S && A.S.pw) || {}, metB = (st.metLeg || {})[prof.id] != null, learned = FIG.learned(pc, prof.pid || prof.id);
    if (prof.type === 'being') {
      const listed = prof.fame === 'known' || learned || metB || (st.known || {})[prof.id] != null;
      return { listed, arts: metB, secret: metB || learned };
    }
    if (prof.type === 'legend' || prof.type === 'master') {
      const k = PW.knowLevel ? PW.knowLevel(prof.id) : 0;
      return { listed: k >= 1 || (prof.type === 'master' && prof.fame === 'known') || learned, arts: k >= 2, secret: k >= 2 || learned };
    }
    // a person of the world: known by name to all (rulers, the orders' masters) or in his own realm; his arms once met,
    // his heart once close (kin, a friend, a lover, his lord, or a bond of real warmth), or once learned
    if (prof.pid === pc.id) return { listed: true, arts: true, secret: true };
    const rule = ((FIG.FILES.get(prof.cat) || {}).rule || {}).known || 'realm', rel = pc.rel && pc.rel[prof.pid];
    const listed = rule === 'all' || prof.realm === pc.realm || !!rel || learned;
    const close = !!rel && (CLOSE.test(String(rel.type || '')) || (rel.op || 0) >= 50);
    return { listed, arts: !!rel, secret: close || learned };
  };
})();
