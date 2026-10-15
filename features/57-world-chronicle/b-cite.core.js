// Events cite the world record (Road to Ten, World 5: "NPCs and events refer back to it"). Three ways in:
//   tokens   {since_event} {last_war} {last_peace} {last_battle} {last_siege} {last_fall} {last_famine} {last_plague}
//            {last_ruler} {last_revolt} {last_wedding} {last_legend} {last_founding} {last_realm_fall}, each with a
//            _year twin ({last_war_year}). Any event may use them. Each names an entry of this run (or the realm's
//            canon) that the character could know of: in their realm, their home's master's or a neighbour's, and after
//            their birth. With none, the token stays unfilled and the engine drops the event, as it does for any token.
//   lines    a recalled line under an event whose subject touches an entry: bread and the famine, soldiers and the
//            battle, a court and the old ruler's death, a temple and the plague. Set when the scene is first drawn up
//            (A.eventView builds it once), so the scene, the choice and the saved game all see the same line.
//   events   the pack in chronicle.events.js, written around entries (C.chron gates them).
// Every pick is by hashing ids and the date, never A.rand: citing changes nothing the world will do.
(function () {
  const WC = A.WC;
  if (!WC) return;
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const lc = s => s.charAt(0).toLowerCase() + s.slice(1);

  // ---- the realm's canon: dated lore entries tied to realms by the names in them (built once, from LORE)
  WC.canon = function () {
    if (WC._canon) return WC._canon;
    const out = [], realms = LORE.realms || {}, words = {};
    for (const id in realms) {
      const R = realms[id], w = new Set([R.short, R.name, R.capital].filter(s => s && s.length > 3).map(s => s.replace(/^the /i, '')));
      for (const P of (A.S && A.S.prov) || []) if (P.orig === id && P.name && P.name.length > 3) w.add(P.name);
      words[id] = [...w];
    }
    const tie = txt => Object.keys(words).filter(id => words[id].some(w => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(txt)));
    // rulers of each realm who died in office
    for (const id in LORE.rulerHistory || {}) {
      (LORE.rulerHistory[id] || []).forEach((r, j) => {
        if (!r || r[4] !== 'died' || !(r[3] >= 1000)) return;
        out.push({ id: `cR${id}.${j}`, y: r[3], k: 'ruler', realms: [id], ref: `the death of ${r[0]}${r[1] ? ' ' + r[1] : ''}`, who: r[0] });
      });
    }
    // the wars of the last century and a half
    for (const w of LORE.wars || []) {
      if (!(+w[2] >= 950)) continue;
      const rs = tie(`${w[1]} ${w[4]}`);
      if (rs.length) out.push({ id: `cW${w[0]}`, y: +w[2], k: 'war', realms: rs, ref: `the ${String(w[1]).replace(/^the /i, '')}` });
    }
    // the dated chronicle, where its title is a name for a thing that happened
    const NOUN = /^(The |Death of |Coronation of |Battle of |Fight at |Founding of |Truce of |Election of |Exile of |Fire at |Flood |Earthquake |Riot at |Killing winter |Settlers for )/;
    const KIND = [[/^Death of/, 'ruler'], [/^Coronation|^Election/, 'crown'], [/^Battle|^Fight|blockade|landing|massacre/i, 'battle'], [/fire|burn/i, 'fall'],
      [/Hungry|famine|lean flood|winter|blizzard/i, 'famine'], [/Truce/, 'peace'], [/Founding|Settlers/, 'founded'], [/riot|strike/i, 'revolt']];
    (LORE.chronicle || []).forEach((c, j) => {
      // "The Kyzai fire" names a thing; "The Gashmar ferry burned" tells one, and cannot follow "since"
      if (!c || !(c[0] >= 1000) || !NOUN.test(c[1]) || /ed$|\b(is|are|was|were|comes|goes|stops|fails|begins|ends|arrives|returns|marries|faints|buys|crosses|broken|bought|taken|found|held|sold|burnt|sees|see)\b/.test(c[1])) return;
      const rs = tie(`${c[1]} ${c[2]}`);
      if (!rs.length || rs.length > 3) return;
      const k = (KIND.find(([rx]) => rx.test(c[1])) || [null, 'canon'])[1];
      out.push({ id: `cC${j}`, y: c[0], k, realms: rs, ref: /^The /.test(c[1]) ? lc(c[1]) : 'the ' + lc(c[1]), who: k === 'ruler' ? c[1].replace(/^Death of /, '') : null });
    });
    WC._canon = out;
    WC._canonById = Object.fromEntries(out.map(c => [c.id, c]));
    return out;
  };
  WC.canonNear = function (p, kinds, opts) {
    opts = opts || {};
    const own = new Set([p.realm, (A.prov(p.home) || {}).owner].filter(Boolean)), ks = kinds ? new Set(kinds) : null;
    const from = opts.since != null ? opts.since : 1000;
    return WC.canon().filter(c => (!ks || ks.has(c.k)) && c.y >= from && c.y < A.S.year && c.realms.some(r => own.has(r)));
  };

  // ---- a citation: { id, y, k, ref, e? } for a run entry ('r' + index) or a canon entry ('c...')
  const fromEntry = e => ({ id: 'r' + e.i, y: e.y, k: e.k, e, ref: WC.ref(e) });
  WC.cite = function (id) {
    if (!id) return null;
    if (id[0] === 'r') { const e = WC.ent(+id.slice(1)); return e ? fromEntry(e) : null; }
    WC.canon();
    const c = WC._canonById[id];
    return c ? { id: c.id, y: c.y, k: c.k, ref: `${c.ref} in ${c.y}`, c } : null;
  };
  const score = (p, c) => {
    const g = (WC.KINDS[c.k] || ['', 1])[1] + 1 + (c.e && c.e.k === 'battle' && c.e.n >= 50000 ? 1 : 0);
    const age = Math.max(0, A.S.year - c.y), near = c.e ? (WC.nearProvs(p).has(c.e.p) ? 2 : (c.e.a === p.realm || c.e.b === p.realm) ? 1.5 : 1) : 0.7;
    return g * near / (1 + age / 8);
  };
  // the entry to cite: of these kinds, around this person, among the greatest and nearest; picked by hashing key (pure)
  WC.choose = function (p, kinds, key, opts) {
    opts = opts || {};
    if (!p || !A.S) return null;
    const cd = opts.cd || {}, now = A.absDay(), fresh = c => !(cd[c.id] && now - cd[c.id] < (opts.gap || 730));
    let pool = WC.near(p, kinds, { max: 30, minDays: opts.minDays != null ? opts.minDays : 60, home: opts.home, since: opts.since }).map(fromEntry).filter(fresh);
    if (opts.canon !== false && pool.length < 2 && !opts.home) {
      const since = opts.living ? Math.max(1000, (p.born || A.S.year) - 40) : 1000;
      pool = pool.concat(WC.canonNear(p, kinds, { since }).map(c => WC.cite(c.id)).filter(fresh));
    }
    if (opts.filter) pool = pool.filter(c => opts.filter(c, p));
    if (!pool.length) return null;
    // a recalled line leans away from the kinds recalled lately, so one sacked town does not fill a decade
    const recent = opts.recent || [], sc = c => score(p, c) * Math.pow(0.45, recent.filter(k => k === c.k).length);
    pool.sort((a, b) => sc(b) - sc(a) || b.y - a.y);
    const top = pool.slice(0, 4);
    return top[hash(key) % top.length];
  };

  // ---- tokens
  WC.TOKENS = {
    since_event: { kinds: ['fall', 'battle', 'siege', 'famine', 'plague', 'ruler', 'fallen', 'founded', 'peace', 'revolt'], text: c => 'since ' + c.ref },
    last_war: { kinds: ['war', 'peace'], text: c => c.ref },
    last_peace: { kinds: ['peace'], text: c => c.ref },
    last_battle: { kinds: ['battle'], text: c => c.ref },
    last_siege: { kinds: ['siege', 'fall'], text: c => c.ref },
    last_fall: { kinds: ['fall'], text: c => c.ref },
    last_famine: { kinds: ['famine'], text: c => c.ref },
    last_plague: { kinds: ['plague'], text: c => c.ref },
    last_ruler: { kinds: ['ruler'], text: c => c.ref },
    last_revolt: { kinds: ['revolt'], text: c => c.ref },
    last_wedding: { kinds: ['wedding'], text: c => c.ref },
    last_legend: { kinds: ['legend'], text: c => c.ref },
    last_founding: { kinds: ['founded'], text: c => c.ref },
    last_realm_fall: { kinds: ['fallen'], text: c => c.ref },
  };
  // the citation behind a token, kept on the event's context so its text and its result name the same entry
  WC.tokenCite = function (pc, ctx, key) {
    const T = WC.TOKENS[key]; if (!T || !pc) return null;
    ctx = ctx || {};
    const kept = ctx._wcp && ctx._wcp[key];
    const c = kept ? WC.cite(kept) : WC.choose(pc, T.kinds, `${key}|${pc.id}|${A.absDay()}`, { canon: true });
    if (!c) return null;
    try { (ctx._wcp = ctx._wcp || {})[key] = c.id; } catch (e) {}
    WC.mark(c.id);
    return c;
  };
  const tokens = A.ctxTokens;
  if (typeof tokens === 'function') A.ctxTokens = function (pc, ctx) {
    const o = tokens.apply(this, arguments);
    try {
      if (o && pc) for (const key of Object.keys(WC.TOKENS)) {
        for (const [name, fn] of [[key, c => WC.TOKENS[key].text(c)], [key + '_year', c => String(c.y)]]) {
          if (Object.prototype.hasOwnProperty.call(o, name)) continue;
          Object.defineProperty(o, name, { configurable: true, enumerable: false, get() { const c = WC.tokenCite(pc, ctx, key); return c ? fn(c) : undefined; } });
        }
      }
    } catch (e) { console.error('world record tokens', e); }
    return o;
  };
  // a condition helper, C.chron(p, kinds, mode): is there an entry of these kinds this person could know of? Its
  // modes, shared by a scene's cond and its setup so the two agree: run (this run only), home (this run, in or next to
  // the home province), sack (a town sacked or burned, or a realm fallen), mine (an entry of the character's own realm)
  WC.MODES = {
    run: { canon: false }, home: { canon: false, home: true },
    sack: { canon: false, filter: c => !!c.e && (c.e.k === 'fallen' || (c.e.x || 0) >= 2) },
    mine: { filter: (c, p) => !c.e || c.e.a === p.realm || c.e.b === p.realm },
    pair: { canon: false, filter: c => !!c.e && !!c.e.b },
  };
  A.C.chron = (p, kinds, mode) => !!WC.choose(p, typeof kinds === 'string' ? kinds.split(',') : kinds, 'cond', Object.assign({ canon: true }, WC.MODES[mode] || {}));
  // for an event's setup: pick the entry, mark the scene as citing it, and fill its words as tokens ({wcRef} {wcYear}
  // {wcPlace} {wcRealm} {wcOther} {wcWho} {wcWar} {wcDead} {wcDays} {wcSick} {wcAgo}); none fits: the scene backs out
  const AGO = ['not a year', 'a year', 'two years', 'three years', 'four years', 'five years', 'six years', 'seven years', 'eight years', 'nine years', 'ten years', 'eleven years', 'twelve years'];
  WC.pickFor = function (p, ctx, kinds, opts) {
    opts = opts || {};
    const c = WC.choose(p, typeof kinds === 'string' ? kinds.split(',') : kinds, `${opts.id || 'ev'}|${p.id}|${A.absDay()}`, Object.assign({ canon: true }, WC.MODES[opts.mode] || {}, opts));
    if (!c) { ctx.skip = true; return null; }
    WC.mark(c.id);
    const x = WC.words(c), n = A.S.year - c.y;
    Object.assign(ctx, {
      wcRef: c.ref, wcYear: String(c.y), wcPlace: x.P || x.A || (A.realm(p.realm) || {}).capital || 'the capital', wcRealm: x.A || A.realmShort(p.realm), wcOther: x.B || 'the enemy',
      wcWho: x.who || 'the old ruler', wcWar: x.war || 'the war', wcDead: x.dead || 'many', wcDays: String(x.days || 'many'), wcSick: x.sick || 'the sickness',
      wcAgo: n < AGO.length ? AGO[n] : `${n} years`, wcKind: c.k, wcRun: c.e ? '1' : '',
    });
    return c;
  };

  // ---- recalled lines
  // what an event is about, read from its id, title and text; each subject names the entries it calls to mind
  WC.TOPICS = [
    { k: 'market', rx: /\b(market|bread|grain|flour|loaf|loaves|baker|price|prices|granary|stores|rent|tithe|merchant|stall|pedlar|haggle)\b/i, kinds: ['famine', 'plague', 'fall', 'war'] },
    { k: 'war', rx: /\b(soldier|soldiers|sergeant|veteran|army|camp|march|battle|war|levy|levies|muster|drill|captain|siege|banner|recruit|deserter|spearmen|archers|cavalry|the front|garrison)\b/i, kinds: ['battle', 'siege', 'fall', 'peace', 'war', 'order'] },
    { k: 'court', rx: /\b(king|queen|ruler|throne|crown|court|prince|princess|heir|council|steward|duke|emperor|empress|jarl|khan|sultan|lord|lady|regent|herald)\b/i, kinds: ['ruler', 'crown', 'wedding', 'revolt', 'trib', 'alliance', 'founded', 'fallen'] },
    { k: 'temple', rx: /\b(priest|priests|temple|shrine|prayer|pray|prays|funeral|grave|graves|burial|monk|nun|chapel|sick|sickness|fever|healer|physician|cough|plague)\b/i, kinds: ['plague', 'famine', 'ruler', 'legend', 'battle'] },
    { k: 'tavern', rx: /\b(tavern|inn|ale|alehouse|song|songs|singer|minstrel|story|stories|tale|tales|feast|gossip)\b/i, kinds: ['legend', 'battle', 'fall', 'wedding', 'ruler', 'revolt', 'order'] },
    { k: 'road', rx: /\b(road|roads|travel|traveller|caravan|journey|bridge|ford|ferry|border|pilgrim|stranger|strangers|refugee|refugees|ruin|ruins|exile)\b/i, kinds: ['fall', 'fallen', 'war', 'revolt', 'founded', 'plague'] },
    { k: 'land', rx: /\b(field|fields|farm|plough|plow|sow|harvest|reap|herd|flock|village|barn|orchard|cattle|sheep|crop|crops|mill)\b/i, kinds: ['famine', 'war', 'plague', 'fall', 'cede'] },
    { k: 'town', rx: /\b(town|city|walls|gate|gates|street|square|guild|workshop|smith|apprentice|watchman|the watch)\b/i, kinds: ['siege', 'fall', 'plague', 'famine', 'cede'] },
  ];
  WC.topic = function (e, v) {
    const s = `${e && e.id ? e.id.replace(/_/g, ' ') : ''} ${v.title || ''} ${v.text || ''}`;
    let best = null, bestAt = Infinity;
    // the subject named first in the scene wins
    for (const T of WC.TOPICS) { const m = T.rx.exec(s); if (m && m.index < bestAt) { best = T; bestAt = m.index; } }
    return best;
  };
  WC.RECALL = 34;          // per cent of scenes with a subject that get a recalled line, if an entry fits
  WC.GAP = 730;            // days before the same entry is recalled again
  const fmt = n => (A.fmt ? A.fmt(n) : String(n));
  const rs = id => (id ? (A.realm(id) ? A.realm(id).short : WC.name(id) || 'a realm now gone') : '');
  const pn = i => (i != null && A.S.prov[i] ? A.S.prov[i].name : '');
  const the = s => String(s || '').replace(/^The /, 'the ');
  // lines by kind: [needsHome, (c, x) => string]; x has the entry's words. Second person, present tense.
  WC.LINES = {
    famine: [
      [0, x => `Bread has not been cheap in ${x.A} since the harvest failed there in ${x.y}.`],
      [0, x => `The old women still keep a second crock of beans under the bed, as they learned to in ${x.y}.`],
      [0, x => `Someone says the price aloud and adds, "Not as bad as ${x.y}," and nobody laughs.`],
      [1, x => `People here weigh every loaf twice. They began in ${x.y}, the year the harvest failed in ${x.A}.`],
    ],
    plague: [
      [1, x => `The graves from ${x.sick} of ${x.y} still stand in a row at ${x.P}, their earth not yet settled.`],
      [0, x => `Someone coughs, and two people step back. ${x.Sick} came to ${x.P} in ${x.y}, and they remember.`],
      [1, x => `Since ${x.sick} of ${x.y}, people at ${x.P} wash their hands at the door and say a word over the water.`],
    ],
    battle: [
      [0, x => `A man with a stiff arm says he got it at ${x.P} in ${x.y}, when ${x.A} beat ${x.B}.`],
      [0, x => `${x.dead} men died at ${x.P} in ${x.y}. People here still argue over whose fault it was.`],
      [0, x => `A drover's dog is called ${x.P}, after the battle of ${x.y}. Nobody finds that strange.`],
      [0, x => `An old spearman counts the dead of ${x.P} (${x.y}) on his fingers and gives up past the third hand.`],
    ],
    siege: [
      [0, x => x.fell ? `They still talk about the siege of ${x.P} in ${x.y}: ${x.days} days, and the dogs eaten by the end.` : `They still talk about the siege of ${x.P} in ${x.y}, and the walls that held.`],
      [0, x => `You pass a man who carried water at the siege of ${x.P} in ${x.y}. He limps from it yet.`],
    ],
    fall: [
      [0, x => x.how === 3 ? `Since ${x.P} burned in ${x.y}, its people are scattered all over; you hear their voices in every market.` : x.how === 2 ? `A pedlar sells spoons he swears came out of the sack of ${x.P} in ${x.y}.` : `People still speak of the day ${x.A} took ${x.P}, in ${x.y}.`],
      [0, x => `Mothers here still frighten children with the men of ${x.A}, who took ${x.P} in ${x.y}.`],
    ],
    war: [
      [0, x => `Everyone over thirty has a story from ${x.war}, begun in ${x.y}, and no two of them agree.`],
      [0, x => `The roads and the prices have not been the same since ${x.war} began in ${x.y}.`],
    ],
    peace: [
      [0, x => `Since ${x.war} ended in ${x.y}, men here drink to ${x.A} or refuse to, and you can tell which.`],
      [0, x => `An old soldier says ${x.war} was won at the table in ${x.y}, not in the field.`],
    ],
    ruler: [
      [0, x => `People here still date things from the death of ${x.who}, in ${x.y}.`],
      [0, x => `An old servant compares everything to the days of ${x.who}, dead since ${x.y}.`],
      [0, x => `There is a song about ${x.who}, who died in ${x.y}. You hear the chorus twice before noon.`],
    ],
    crown: [[0, x => `Since ${x.who} took the throne of ${x.A} in ${x.y}, the coins in your purse wear two different faces.`]],
    fallen: [[0, x => `Some old people still say "${x.A}" for the land, though it fell in ${x.y}.`], [0, x => `Beggars from ${x.A}, which fell in ${x.y}, still sit at the gates with their old badges sewn on.`]],
    founded: [[0, x => `Some here still will not say the name ${x.A}. It has only stood since ${x.y}.`]],
    revolt: [[0, x => `Since ${x.who} rose against the crown of ${x.A} in ${x.y}, the lords here are watched, and know it.`]],
    wedding: [[0, x => `Cups painted for the royal wedding of ${x.y} still sit on shelves here: ${x.A} and ${x.B}, hand in hand.`]],
    alliance: [[0, x => `Since ${x.A} and ${x.B} swore their alliance in ${x.y}, their merchants drink at the same tables.`]],
    trib: [[0, x => x.free ? `Since ${x.y}, when ${x.A} stopped paying ${x.B}, the tax men here have had less to say.` : `Since ${x.y}, part of every tax here goes to ${x.B}. Nobody forgets it.`]],
    order: [[0, x => `Since ${x.order} were cut down at ${x.P} in ${x.y}, boys here play at being them.`]],
    legend: [[0, x => `They say the sword over the inn door belonged to ${x.who}, who died in ${x.y}. It is not that sword.`], [0, x => `Old men here saw ${x.who} fight once, or say they did. ${x.who} has been dead since ${x.y}.`]],
    cede: [[1, x => `Since ${x.y}, when ${x.P} passed to ${x.A}, the old men still pay their dues in the old coin when they can.`]],
    canon: [[0, x => `Old people here still date things from ${x.ref}.`]],
  };
  WC.words = function (c) {
    const e = c.e, y = c.y;
    if (!e) {
      const who = c.c && c.c.who;
      return { y, ref: c.ref, who: who || 'the old ruler', war: c.c ? c.c.ref : c.ref };
    }
    const sick = WC.name('sick:' + e.p + ':' + e.y) || 'the sickness';
    return {
      y, P: pn(e.p), A: rs(e.a), B: rs(e.b), who: WC.name(e.w[0]) || 'the old ruler', war: the(WC.warName(e)),
      dead: fmt(Array.isArray(e.x) ? e.x[0] || 0 : 0), days: e.n || 0, fell: e.x === 'fell', how: e.x || 0, free: e.x === 'free',
      sick, Sick: sick.charAt(0).toUpperCase() + sick.slice(1), order: the(WC.name(e.x) || 'the knights'), ref: c.ref,
    };
  };
  WC.recallLine = function (c, p, key) {
    const set = WC.LINES[c.e ? c.k : ['ruler', 'war'].includes(c.k) ? c.k : 'canon'] || WC.LINES.canon;
    const home = c.e && c.e.p != null && WC.nearProvs(p).has(c.e.p);
    const ok = set.filter(l => !l[0] || home);
    if (!ok.length) return null;
    // the lines of a kind come round in turn
    const R = WC.rec(), kc = R.kc = R.kc || {}, n = kc[c.k] = (kc[c.k] || 0) + 1;
    const line = ok[(n + hash(key) % 2) % ok.length][1](WC.words(c));
    return line && !/\{|undefined|NaN/.test(line) ? line : null;
  };
  WC.recall = function (q, v) {
    if (!q || !v || v.skip || q.type !== 'event') return;
    const pc = A.pc(), e = A.EV[q.ev];
    if (!pc || !pc.alive || !e || /^wc_/.test(e.id) || (A.age(pc) < 6)) return;
    if ((v.cites && v.cites.length) || (q.ctx && (q.ctx.siege || q.ctx.front))) return;
    const T = WC.topic(e, v);
    if (!T) return;
    const key = `${q.ev}|${pc.id}|${A.absDay()}`;
    if (hash(key + '|gate') % 100 >= WC.RECALL) return;
    const R = WC.rec();
    R.cd = R.cd || {};
    R.lk = Array.isArray(R.lk) ? R.lk : [];
    const c = WC.choose(pc, T.kinds, key, { cd: R.cd, gap: WC.GAP, canon: true, living: true, minDays: 60, recent: R.lk });
    if (!c) return;
    const line = WC.recallLine(c, pc, key);
    if (!line) return;
    v.recall = line;
    R.lk.push(c.k); if (R.lk.length > 8) R.lk.splice(0, R.lk.length - 8);
    q.ctx = q.ctx || {};
    WC.mark(c.id);
    const now = A.absDay();
    R.cd[c.id] = now;
    for (const k in R.cd) if (now - R.cd[k] > WC.GAP) delete R.cd[k];
  };
  // the entries a scene cites are gathered while its view is first drawn up (tokens, the pack's setups, the recalled
  // line) and kept on the view, so a follow-up scene that inherits the context does not count as citing
  WC._cur = null;
  WC.mark = id => { if (WC._cur && id && !WC._cur.includes(id)) WC._cur.push(id); };
  const view = A.eventView;
  A.eventView = function (q) {
    if (!q || q.view) return view.apply(this, arguments);
    const outer = WC._cur, cur = WC._cur = [];
    let v;
    try { v = view.apply(this, arguments); } finally { WC._cur = outer; }
    try {
      if (v && !v.skip) {
        WC._cur = cur;
        v.cites = cur.slice(); WC.recall(q, v); v.cites = cur.slice();
        if (!v.cites.length) delete v.cites;
      }
    } catch (e) { console.error('world record recall', e); } finally { WC._cur = outer; }
    return v;
  };
  // does this scene cite the record? (a token, a recalled line, or an event of the pack)
  WC.cites = q => !!(q && q.view && q.view.cites && q.view.cites.length);
  // the line, under the scene's text (pure)
  const modal = UI.eventModal;
  if (typeof modal === 'function') UI.eventModal = function (q) {
    const h = modal.apply(this, arguments);
    try {
      const line = q && q.view && q.view.recall;
      if (!line) return h;
      const at = h.indexOf('<div class="mtext">'), end = at >= 0 ? h.indexOf('</div>', at) : -1;
      const add = `<div class="tiny muted wc-recall" style="margin-top:4px"><em>${UI.esc(line)}</em></div>`;
      return end > 0 ? h.slice(0, end + 6) + add + h.slice(end + 6) : h;
    } catch (e) { return h; }
  };
})();
