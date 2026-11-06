// Step 7 of docs/v2/V2_SPEC.md (complaint 5): relations between realms are sums of named reasons that move every month,
// and one function derives the status from all of them, so the realm view, the news and the AI never disagree.
//
// - Each month A.V2.diplomacy.monthTick runs over every pair of living realms. Its reasons come from two places:
//   v2's own (borders, a common threat, incidents, favours, broken alliances, ended wars), saved in A.S.v2dip.f, and
//   the game's (marriages, sworn rivalries, claims, faith, trade, tribute, comrades in a war, memories at court, old
//   standing, a new ruler), read fresh from the game each time and never saved.
// - Its decisions (alliance, its end, war, royal marriage) are carried out with the game's own A.sign / A.cancelTr /
//   A.declareWar, so the war machinery and the treaty records stay the release's.
// - The release's dice for the same decisions are switched off while A.V2DIP.ON: forming and breaking alliances,
//   betrayal wars, naming and burying rivals in A.diploAI, the random-war roll of A.aiWarCheck in the monthly and
//   yearly turn, and the random opinion drift of A.diplomacyYear (patch V2DIP-NO-DRIFT). The lesser pacts A.diploAI
//   still offers (trade, non-aggression, defence, access, guarantees, subsidies, embargoes) must agree with the status.
// - v2's draws come from its own makeRng, seeded from A.S.seed, the year and the month: A.rand is never touched by it.
// - The world news of these decisions goes through newsFor: the player hears for certain what touches their realm,
//   and only rumour, sometimes garbled, of the rest.
(function () {
  const V = A.V2, D = V && V.diplomacy;
  if (!D) return;
  const DV = A.V2DIP = { ON: true, inAI: false, inFlow: false, stats: { ticks: 0, alliance: 0, broken: 0, war: 0, warRefused: 0, marriage: 0, rival: 0, unrival: 0, heard: 0, unheard: 0, warWait: {} } };
  // the pace at which hostility turns to war (DV.tick's war branch; see the README for the numbers it was tuned on)
  DV.WAR = { rest: true, weary: true, nerve: 1, p: 0.35, cbMul: 1.5 };

  const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const live = () => Object.values(A.S.realms || {}).filter(r => r && r.alive && !r.isRebel).sort(byId);
  const pk = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  const short = id => (A.realmShort ? A.realmShort(id) : (A.realm(id) || {}).short || id);
  const yr = () => A.S.year;
  const month = () => (A.monthOf && A.today ? A.monthOf(A.today()).m : 0);

  // the ruler's temper in v2's words, from the release's persona model (20-ai-personality)
  DV.traitsOf = function (rid) {
    let P = null;
    try { P = A.rulerPersona ? A.rulerPersona(rid) : null; } catch (e) { P = null; }
    if (!P) return ['cautious'];
    const t = [];
    if ((P.war || 1) >= 1.15 || (P.greed || 0) >= 0.4) t.push('ambitious');
    if ((P.honor || 0) >= 0.4) t.push('honourable');
    if ((P.zeal || 0) >= 0.5) t.push('pious');
    if (!t.length) t.push('cautious');
    return t;
  };

  // the game's own reasons for one pair, as named factors (all flagged g: read fresh, never saved)
  const memK = (ra, b) => { const out = {}; for (const m of ((ra && ra.mem && ra.mem[b]) || [])) out[m.k] = (out[m.k] || 0) + (+m.v || 0); return out; };
  const memRaw = (ra, b) => { let s = 0; for (const m of ((ra && ra.mem && ra.mem[b]) || [])) s += +m.v || 0; return s; };
  function gameFactors(a, b) {
    const ra = A.realm(a), rb = A.realm(b), Y = yr(), out = [];
    const add = (name, value, text) => { value = Math.round(value * 10) / 10; if (Math.abs(value) >= 1) out.push([name, value, text]); };
    const st = (((ra.rel || {})[b] || 0) + ((rb.rel || {})[a] || 0)) / 2 * 0.35;
    add('standing', st, st > 0 ? 'old goodwill between the two courts' : 'old ill will between the two courts');
    const ma = memK(ra, b), mb = memK(rb, a);
    for (const k of Object.keys(Object.assign({}, ma, mb)).sort()) {
      if (k === 'wedding') continue; // the marriage itself is a reason of its own
      if (k === 'rival' && ((ra.rivals || []).includes(b) || (rb.rivals || []).includes(a))) continue; // and so is a standing rivalry
      const v = ((ma[k] || 0) + (mb[k] || 0)) / 2 * 0.5, lab = ((A.DMEM && A.DMEM[k]) || [k.replace(/_/g, ' ')])[0];
      add((v < 0 ? 'grudge-m-' : 'mem-') + k, v, String(lab).toLowerCase());
    }
    // what the later features add to a court's memory (feud ledgers, talk at court, tellings): one line for the rest
    let extra = 0;
    try { extra = ((A.memSum(a, b) - memRaw(ra, b)) + (A.memSum(b, a) - memRaw(rb, a))) / 2 * 0.5; } catch (e) { extra = 0; }
    add(extra < 0 ? 'grudge-told' : 'told', extra, extra < 0 ? 'old wrongs still told at both courts' : 'old kindnesses still told at both courts');
    const wy = (ra.marriages && ra.marriages[b]) || (rb.marriages && rb.marriages[a]);
    if (wy) add('marriage-' + wy, Math.max(5, 16 - 0.6 * (Y - wy)), `royal marriage in ${wy}`);
    if ((ra.rivals || []).includes(b) || (rb.rivals || []).includes(a)) add('feud-rival', -20, 'sworn rivals');
    const hasCl = r => r.claims && Object.keys(r.claims).length;
    let nc = 0; try { nc = (hasCl(ra) ? A.claimsOn(a, b).length : 0) + (hasCl(rb) ? A.claimsOn(b, a).length : 0); } catch (e) { nc = 0; }
    if (nc) add('claim', -Math.min(24, 6 + 4 * nc), nc > 2 ? 'many claims on each other\'s land' : 'a claim on the other\'s land');
    if (ra.faith && rb.faith) {
      const fn = ((A.faith && A.faith(ra.faith)) || {}).name || 'one faith';
      add('faith', ra.faith === rb.faith ? 6 : -3, ra.faith === rb.faith ? `share ${fn}` : 'keep different faiths');
    }
    if (A.hasTrade && A.hasTrade(a, b)) add('trade', 6, 'trade with each other');
    if (ra.overlord === b || rb.overlord === a) add('tribute', -6, `${short(ra.overlord === b ? a : b)} pays tribute`);
    if (A.friendly && A.friendly(a, b) && A.atWar(a).length) add('comrades', 12, 'fight side by side');
    // a conqueror is feared by those near it (the coalition reads this through the status)
    for (const [x, y] of [[a, b], [b, a]]) {
      const inf = +(A.realm(x).infamy || 0);
      if (inf < 40) continue;
      const nx = A.neighbors(x), near = nx.includes(y) || A.neighbors(y).some(n => nx.includes(n));
      if (near) add('fear-' + x, -Math.min(25, (inf - 30) / 2), `fear of ${short(x)}'s conquests`);
    }
    const R = (A.S.v2dip && A.S.v2dip.ruler) || {};
    for (const x of [a, b]) { const s = R[x] && R[x][1]; if (s != null && Y - s < 3) add('ruler-' + x, 5 - 2 * (Y - s), `a new ruler in ${short(x)} seeks goodwill`); }
    return out;
  }
  function gamePact(a, b) {
    const ra = A.realm(a), rb = A.realm(b), Y = yr();
    if (A.hostile(a, b)) return 'war';
    if ((ra.allies || []).includes(b)) return 'alliance';
    if ((ra.truce && ra.truce[b] > Y) || (rb.truce && rb.truce[a] > Y)) return 'truce';
    return null;
  }

  // one pair's relation, as v2 holds it: the saved v2 reasons plus the game's, and the pact the game has.
  // Pure: reads A.S only (rendering calls it).
  function loadPair(d, i, j, a, b) {
    const r = d.get(i, j), saved = (A.S.v2dip && A.S.v2dip.f && A.S.v2dip.f[pk(a, b)]) || {};
    for (const n of Object.keys(saved)) { const s = saved[n]; if (Array.isArray(s)) r.factors.set(n, { value: +s[0] || 0, decay: +s[1] || 0, since: s[2], text: String(s[3] || n) }); }
    for (const [n, v, t] of gameFactors(a, b)) r.factors.set(n, { value: v, decay: 0, since: yr(), text: t, g: 1 });
    r.pact = gamePact(a, b); r.pactSince = yr();
    return r;
  }
  const blank = () => D.makeDiplomacy([], { pick: x => x[0] });

  // THE status: every view, the news and the AI ask this
  function statusFrom(d, i, j, a, b) {
    let s = D.statusOf(d, i, j);
    const riv = ((A.realm(a).rivals || []).includes(b) || (A.realm(b).rivals || []).includes(a));
    if (riv && ['cordial', 'cold', 'hostile', 'friendly', 'close friends'].includes(s)) s = 'sworn rivals';
    return s;
  }
  DV.relation = function (a, b) {
    const ra = A.realm(a), rb = A.realm(b);
    if (!ra || !rb || a === b) return null;
    const d = blank(); loadPair(d, 0, 1, a, b);
    const why = D.reasons(d, 0, 1);
    return { status: statusFrom(d, 0, 1, a, b), score: D.score(d, 0, 1), toward: why.filter(x => x.toward), apart: why.filter(x => !x.toward) };
  };
  DV.status = (a, b) => { const x = DV.relation(a, b); return x ? x.status : null; };
  DV.WARM = ['allied', 'close friends', 'friendly', 'allied, but old wounds remain'];
  DV.COLD = ['cold', 'hostile', 'sworn rivals', 'at war', 'at war despite a marriage tie'];

  // the world as monthTick wants it: realm i owns pseudo-province i, whose neighbours are the realms it borders
  function buildWorld() {
    const L = live(), ids = L.map(r => r.id), idx = new Map(ids.map((id, i) => [id, i]));
    const realms = L.map((r, i) => ({ id: i, rid: r.id, name: r.short || r.name, provinces: [i], treasuryFactor: Math.max(1, +A.realmPower(r) || 1), ruler: { traits: DV.traitsOf(r.id) } }));
    const list = L.map(r => {
      const nb = [];
      for (const o of A.neighbors(r.id)) { const j = idx.get(o); if (j != null) nb.push(j, j, j); }
      return { neighbors: nb };
    });
    const d = blank();
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const r = loadPair(d, i, j, ids[i], ids[j]);
      if (!list[i].neighbors.includes(j)) r.factors.delete('border');
    }
    return { d, ids, idx, world: { realms, map: { provinces: { list } }, realmOf: realms.map((_, i) => i) } };
  }

  function store() {
    const S = A.S;
    if (!S.v2dip || typeof S.v2dip !== 'object') S.v2dip = {};
    const V2 = S.v2dip;
    V2.f = V2.f && typeof V2.f === 'object' ? V2.f : {};
    V2.p = V2.p && typeof V2.p === 'object' ? V2.p : {};
    V2.ruler = V2.ruler && typeof V2.ruler === 'object' ? V2.ruler : {};
    V2.h = Array.isArray(V2.h) ? V2.h : [];
    return V2;
  }
  const rngFor = (salt) => V.rng.makeRng(V.rng.hashStr(`${A.S.seed != null ? A.S.seed : 'ardan'}|v2dip|${yr()}|${month()}|${salt}`));

  // news: through newsFor, then the game's own news (whose later features add distance and delay)
  function tell(W, ev, text, cls) {
    const pc = A.pc(), my = pc && pc.realm != null ? W.idx.get(pc.realm) : undefined;
    const n = D.newsFor({ a: ev.a, b: ev.b, text }, my == null ? -1 : my, W.rng);
    if (!n.heard) { DV.stats.unheard++; return; }
    DV.stats.heard++;
    A.news(n.certain ? text : n.text, cls || 'crown');
  }
  const why = (W, i, j) => D.reasons(W.d, i, j).slice(0, 3).map(x => [x.text, x.toward ? 0.5 : -0.5]);
  const logAi = (k, a, b, t, w) => { try { A.aiLogAdd && A.aiLogAdd(k, a, b, t, w); } catch (e) {} };

  DV.tick = function () {
    const S = A.S;
    if (!DV.ON || !S || !S.realms) return [];
    const V2 = store(), Y = yr(), m = month();
    // new rulers: noted, and the old ruler's quarrels fade by half
    for (const r of live()) {
      const was = V2.ruler[r.id];
      if (!was) V2.ruler[r.id] = [r.ruler != null ? String(r.ruler) : '', -99];
      else if (String(r.ruler) !== was[0]) {
        V2.ruler[r.id] = [String(r.ruler), Y];
        for (const k of Object.keys(V2.f)) if (k.split('|').includes(r.id)) for (const n of Object.keys(V2.f[k])) if (V2.f[k][n][0] < 0 && V2.f[k][n][1]) V2.f[k][n][0] = Math.round(V2.f[k][n][0] * 5) / 10;
      }
    }
    const W = buildWorld(); W.rng = rngFor('news');
    const { d, ids } = W, n = ids.length;
    // a war that ended since last month leaves a grudge
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const k = pk(ids[i], ids[j]), r = d.get(i, j);
      if (V2.p[k] === 'war' && r.pact !== 'war') D.setFactor(d, i, j, `grudge-war-${Y}`, -20, { decay: 0.15, year: Y, text: `fought a war ending in ${Y}` });
    }
    const evs = D.monthTick(d, W.world, rngFor('tick'), Y, m);
    DV.stats.ticks++;
    for (const e of evs) {
      if (e.kind === 'new-ruler' || e.b < 0) continue;
      const i = Math.min(e.a, e.b), j = Math.max(e.a, e.b), a = ids[e.a], b = ids[e.b], ra = A.realm(a), rb = A.realm(b), r = d.get(i, j);
      if (!ra || !rb) continue;
      const pr = ra.playerRun ? ra : rb.playerRun ? rb : null;
      if (e.kind === 'alliance') {
        r.pact = gamePact(a, b);
        if (ra.overlord === b || rb.overlord === a || (ra.allies || []).length >= 3 || (rb.allies || []).length >= 3) continue;
        // an earlier decision this month (a war, a conqueror's new infamy) may have moved the reasons: act on them as they stand now
        if (DV.relation(a, b).score < 22) continue;
        if (pr) {
          const o = pr === ra ? rb : ra, pc = A.pc(); pr.offerSeen = pr.offerSeen || {};
          if (pc && A.queueAiOffer && !(pr.offerSeen['ally' + o.id] && Y - pr.offerSeen['ally' + o.id] < 4)) { pr.offerSeen['ally' + o.id] = Y; A.queueAiOffer(pc, pr, { kind: 'ally', rid: o.id }); }
          continue;
        }
        if (A.sign('ally', a, b, { silent: true })) {
          r.pact = 'alliance'; DV.stats.alliance++;
          logAi('ally', a, b, `swears an alliance with ${short(b)}.`, why(W, i, j));
          tell(W, e, `${short(a)} and ${short(b)} sign an alliance.`);
          V2.h.push([Y, m, 'alliance', a, b]);
        }
      } else if (e.kind === 'alliance-broken') {
        if (!(ra.allies || []).includes(b)) continue;
        A.cancelTr('ally', a, b, true); DV.stats.broken++;
        logAi('unally', pr === ra ? b : a, pr === ra ? a : b, `breaks the alliance with ${short(pr === ra ? a : b)}.`, why(W, i, j));
        if (pr) A.log(`${short(pr === ra ? b : a)} ends its alliance with you. Their envoy says only that times have changed.`, 'bad');
        tell(W, e, `${short(a)} and ${short(b)} end their alliance.`);
        V2.h.push([Y, m, 'broken', a, b]);
      } else if (e.kind === 'war') {
        r.pact = gamePact(a, b);
        let agg = a, tgt = b;
        if (A.realm(agg).playerRun) { if (A.realm(tgt).playerRun) continue; agg = b; tgt = a; }
        const RA = A.realm(agg), capFull = A.warCapFull && A.warCapFull();
        if (A.atWar(agg).length || RA.overlord === tgt || A.realm(tgt).overlord === agg || (RA.stability || 0) < 30 ||
          (!capFull && S.wars.filter(w => w.cb !== 'throne').length >= 4) || (capFull && capFull(RA)) || (A.outOfReach && A.outOfReach(agg, tgt))) { DV.stats.warRefused++; continue; }
        // war pace: hostility is the reason, but a crown still rests after a war it started, waits out war-weariness and
        // waits for an opening (the release's own rest, weariness and nerve, 20-ai-personality), and even then a
        // hostile month becomes a declaration only sometimes (DV.WAR.p, from v2's seeded makeRng, never A.rand)
        const cb = A.cbOn ? A.cbOn(agg, tgt) : null, rel = A.relBetween(agg, tgt);
        let P = null; try { P = A.cbPreview ? A.cbPreview(agg, tgt) : A.warPreview(agg, tgt); } catch (x) { P = null; }
        const WP = DV.WAR, wait = (k) => { DV.stats.warWait[k] = (DV.stats.warWait[k] || 0) + 1; DV.stats.warRefused++; };
        if (WP.rest && A.aiResting && A.aiResting(RA)) { wait('rest'); continue; }
        if (WP.weary && A.aiWeary && (+RA.exhaustion || 0) > A.aiWeary(agg)) { wait('weary'); continue; }
        if (WP.nerve && P && A.aiNerve && +P.ratio < A.aiNerve(agg) * WP.nerve) { wait('nerve'); continue; }
        const sc = D.score(d, i, j), pw = Math.min(1, WP.p * (1 + Math.max(0, -sc - 25) / 40) * (cb ? WP.cbMul : 1));
        if (!rngFor(`war|${agg}|${tgt}`).chance(pw)) { wait('chance'); continue; }
        const res = A.declareWar(agg, tgt, cb ? { cb } : undefined);
        if (A.aiNoteWar && P) A.aiNoteWar(agg, tgt, P, rel, cb, res);
        if (res && res.ok) { r.pact = 'war'; DV.stats.war++; V2.h.push([Y, m, 'war', agg, tgt]); } else DV.stats.warRefused++;
      } else if (e.kind === 'peace') {
        // wars end through the war machinery (war score, peace terms); v2's own peace roll is not used
        r.pact = gamePact(a, b);
        if (r.pact === 'war') for (const nm of [...r.factors.keys()]) if (nm === `grudge-war-${Y}`) r.factors.delete(nm);
      } else if (e.kind === 'marriage') {
        for (const nm of [...r.factors.keys()]) if (nm === `marriage-${Y}` && !r.factors.get(nm).g) r.factors.delete(nm);
        const nb = A.neighbors(a).includes(b);
        if (pr || r.pact === 'war' || (!nb && D.score(d, i, j) < 15)) continue;
        if (A.sign('marriage', a, b, { silent: true })) {
          DV.stats.marriage++;
          r.factors.set(`marriage-${Y}`, { value: 16, decay: 0, since: Y, text: `royal marriage in ${Y}`, g: 1 });
          tell(W, e, `A royal marriage joins ${short(a)} and ${short(b)}.`);
          V2.h.push([Y, m, 'marriage', a, b]);
        }
      }
    }
    // sworn rivalries follow from the status: named when neighbours turn hostile, buried when the bad blood is gone
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = ids[i], b = ids[j], ra = A.realm(a), rb = A.realm(b), r = d.get(i, j);
      if (!ra || !rb || r.pact === 'war') continue;
      const riv = (ra.rivals || []).includes(b) || (rb.rivals || []).includes(a), s = D.score(d, i, j);
      if (!riv && s <= -40 && W.world.map.provinces.list[i].neighbors.includes(j) && !ra.playerRun && !rb.playerRun &&
        (ra.rivals || []).filter(x => A.realm(x) && A.realm(x).alive).length < 2 && (rb.rivals || []).filter(x => A.realm(x) && A.realm(x).alive).length < 2) {
        A.sign('rival', a, b, { silent: true }); DV.stats.rival++;
        r.factors.set('feud-rival', { value: -20, decay: 0, since: Y, text: 'sworn rivals', g: 1 });
        logAi('rival', a, b, `names ${short(b)} its rival.`, why(W, i, j));
        tell(W, { a: i, b: j }, `${short(a)} and ${short(b)} name each other rivals.`, 'warn');
        V2.h.push([Y, m, 'rival', a, b]);
      } else if (riv && s > -5) {
        A.cancelTr('rival', a, b, true); DV.stats.unrival++;
        tell(W, { a: i, b: j }, `${short(a)} and ${short(b)} bury their rivalry.`);
        V2.h.push([Y, m, 'unrival', a, b]);
      }
    }
    // save v2's own reasons (not the game's, which are read fresh) and this month's pacts
    const f = {}, p = {};
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const k = pk(ids[i], ids[j]), r = d.get(i, j), o = {};
      for (const [nm, x] of r.factors) if (!x.g && !nm.startsWith('marriage-') && Math.abs(x.value) >= 0.5) o[nm] = [Math.round(x.value * 100) / 100, x.decay || 0, x.since == null ? null : x.since, String(x.text)];
      if (Object.keys(o).length) f[k] = o;
      const gp = gamePact(ids[i], ids[j]); if (gp) p[k] = gp;
    }
    V2.f = f; V2.p = p;
    if (V2.h.length > 400) V2.h.splice(0, V2.h.length - 400);
    return evs;
  };

  // ---- the release's dice, switched off where v2 decides ----
  const wrapIn = (name, flag) => {
    const f = A[name]; if (typeof f !== 'function') return;
    A[name] = function () { const was = DV[flag]; DV[flag] = true; try { return f.apply(this, arguments); } finally { DV[flag] = was; } };
  };
  const off = (name, val) => {
    const f = A[name]; if (typeof f !== 'function') return;
    A[name] = function () { return DV.ON && DV.inAI ? val : f.apply(this, arguments); };
  };
  wrapIn('diploAI', 'inAI');
  wrapIn('diploMonth', 'inFlow');
  wrapIn('diplomacyYear', 'inFlow');
  off('aiBreakAlly', false);   // alliances end in monthTick
  off('aiAllyBar', 1e9);       // and form there
  off('aiBetrayP', 0);         // a betrayal is a war, and wars start there
  off('aiRivalW', 0);          // rivals follow from the status (DV.tick)
  off('aiMendRival', false);
  { // the AI's random war roll: only when the monthly or yearly turn calls it (tests may still call it directly)
    const wc = A.aiWarCheck;
    if (typeof wc === 'function') A.aiWarCheck = function () { return DV.ON && DV.inFlow ? undefined : wc.apply(this, arguments); };
  }
  { // the lesser pacts the AI still offers must agree with the status
    const sg = A.aiSign;
    if (typeof sg === 'function') A.aiSign = function (k, a, b) {
      if (DV.ON && DV.inAI) {
        const s = DV.status(a, b);
        if (['def', 'nap', 'trade', 'access', 'guar', 'sub'].includes(k) && DV.COLD.includes(s)) return false;
        if (k === 'emb' && !DV.COLD.includes(s)) return false;
      }
      return sg.apply(this, arguments);
    };
  }

  A.onMonth = A.onMonth || [];
  A.onMonth.push(function () { try { DV.tick(); } catch (e) { console.error('v2 diplomacy', e); } });
})();
