// A realm bible, and customs the engine keeps (Road to Ten, World 1, 2 and 7).
//   World 1: "a realm bible for each of the 34 realms: one want, one fear, three customs, and one place that matters,
//            stored as data next to the realm";
//   World 2: "turn every custom into a rule the engine enforces ... 3 rules per realm, about 100 in total";
//   World 7: "give each culture ... 2 or 3 of its own words that show up in titles and events".
// Done when, in part: "bots show 90% of realms have at least 2 rules a typical life actually runs into".
//
// A custom is a rule of one of a dozen kinds, each tied to a moment most lives pass through. The bible's data
// (bible.*.data.core.js) picks the kind and sets its numbers and words:
//   year   on the first of a month each year (a tax, a tithe, a fast, a feast)       m, who
//   rite   on reaching an age                                                        age, who
//   wed    when you marry: the dowry is multiplied (0 none, -1 a bride price paid)   dowry
//   mourn  when a parent dies: who takes the estate                                  share
//   name   when a child of yours is born: how it is named                            by
//   levy   when your realm goes to war                                               who
//   law    after you are punished for a crime
//   ward   a standing rule, met when your life fits it (armed, mounted, rich ...)    when, every
//   market when you sell goods: a cut of the proceeds                                cut
//   grave  how you are buried (a line at your death)
// The first time a custom touches you it is a scene: you keep it, or you defy it and pay for that. After that it is
// simply the custom, applied and noted in the log. Customs are those of the realm you belong to (pc.realm).
//
// Engine side: the month hook and wrappers of A.marry, A.kill, A.birth, A.punish and A.sellGood. Rendering only reads.
(function () {
  const B = A.BIBLE = {
    KINDS: ['year', 'rite', 'wed', 'mourn', 'name', 'levy', 'law', 'ward', 'market', 'grave'],
    // a parent's estate, by status rank (slave .. royal): what the release never paid out while you lived
    ESTATE: [0, 4, 15, 60, 250, 500, 1500, 5000],
    WARD_EVERY: 3,      // years between two meetings with a standing rule
    TOKENS: ['w1', 'w2', 'w3', 'realm', 'dowry', 'paid', 'got', 'estate', 'parent', 'child', 'cut'],
    SCENE_GAP: 30,      // days between two first-meeting scenes; inside it a custom is met quietly
  };
  B.of = rid => (A.BIBLE_DATA || {})[rid] || null;
  B.words = cid => (A.BIBLE_WORDS || {})[cid] || [];
  B.custom = id => { for (const r of Object.values(A.BIBLE_DATA || {})) for (const c of r.customs || []) if (c.id === id) return c; return null; };
  B.mine = pc => { const R = pc && B.of(pc.realm); return R && Array.isArray(R.customs) ? R.customs : []; };
  B.met = (pc, id) => !!(pc && pc.rb && pc.rb[id]);
  const rank = pc => (GD.STATUS[pc.status] || { rank: 2 }).rank;
  const unfree = pc => !!(pc.flags && pc.flags.unfree);
  B.WHO = {
    all: () => true,
    adult: pc => A.isAdult(pc),
    free: pc => A.isAdult(pc) && !unfree(pc),
    commoner: pc => A.isAdult(pc) && rank(pc) <= 3,
    unfree: pc => unfree(pc),
    noble: pc => rank(pc) >= 5,
    rich: pc => rank(pc) >= 4 || pc.coin >= 500,
    poor: pc => rank(pc) <= 2 && pc.coin < 200,
    male: pc => A.isAdult(pc) && pc.sex === 'M',
    female: pc => A.isAdult(pc) && pc.sex === 'F',
    married: pc => !!pc.spouse,
    parent: pc => (pc.children || []).length > 0,
  };
  const who = (pc, w) => (B.WHO[w || 'adult'] || B.WHO.adult)(pc);
  B.WHEN = {
    armed: pc => !!(pc.gear && pc.gear.weapon && !['fists', 'staff', 'club'].includes(pc.gear.weapon)),
    mounted: pc => !!(pc.gear && pc.gear.mount),
    rich: pc => pc.coin >= 1000,
    poor: pc => pc.coin < 20,
    unwed: pc => A.age(pc) >= 25 && !pc.spouse,
    childless: pc => !!pc.spouse && A.age(pc) >= 30 && !(pc.children || []).length,
    old: pc => A.age(pc) >= 60,
    sick: pc => pc.health < 40,
    foreignFaith: pc => { const R = A.realm(pc.realm), f = R && LORE.realms[R.id] && String(LORE.realms[R.id].faith || ''); return !!f && !!pc.faith && !f.includes(pc.faith); },
    soldier: pc => !!pc.mil,
    landed: pc => rank(pc) >= 5 || !!(pc.props && Object.keys(pc.props).length),
    any: () => true,
  };

  // the realm's culture words fill {w1} {w2} {w3} in custom texts, and in any event as {cw1} {cw2} {cw3}
  B.cult = pc => { const R = pc && A.realm(pc.realm); return R ? A.cultureFor(R.race === 'human' ? 'human' : R.race, R.id) : null; };
  B.fill = (pc, s, extra) => {
    const W = B.words(B.cult(pc)), R = A.realm(pc.realm);
    const map = Object.assign({ w1: (W[0] || [''])[0], w2: (W[1] || W[0] || [''])[0], w3: (W[2] || W[0] || [''])[0], realm: R ? R.short : '' }, extra || {});
    // a moment's own token that this moment did not fill is left empty rather than shown raw
    return String(s || '').replace(/\{(\w+)\}/g, (m, k) => (map[k] != null ? String(map[k]) : B.TOKENS.includes(k) ? '' : m));
  };

  // a custom touches the player: the first time it is a scene, after that it is applied and noted
  B.hit = function (pc, c, extra) {
    if (!pc || !c) return;
    const S = A.S, now = A.absDay();
    pc.rb = pc.rb && typeof pc.rb === 'object' ? pc.rb : {};
    const h = pc.rb[c.id];
    const scene = !h && c.kind !== 'grave' && pc.alive && (S.rbScene == null || now - S.rbScene >= B.SCENE_GAP) &&
      !S.queue.some(q => q && q.ev === 'rb_custom');
    pc.rb[c.id] = { n: (h ? h.n : 0) + 1, y: S.year, first: h ? h.first : S.year };
    if (scene) {
      S.rbScene = now;
      A.queue({ type: 'event', ev: 'rb_custom', forced: true, ctx: Object.assign({ cid: c.id }, extra || {}) });
      return 'scene';
    }
    if (c.fx && c.kind !== 'grave') { try { A.applyFx(pc, c.fx, {}); } catch (e) { console.error('custom fx', c.id, e); } }
    const R = A.realm(pc.realm);
    A.log(`${R ? R.short + ': ' : ''}${B.fill(pc, c.name)}. ${B.fill(pc, c.log, extra)}`, 'muted');
    return 'log';
  };
  (A.FX_EXTRA = A.FX_EXTRA || []).push('custom');
  // fx.custom: 'keep' applies the custom's own effect (the scene's keep choice)
  const applyFx = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = applyFx.apply(this, arguments);
    try {
      if (fx && typeof fx === 'object' && fx.custom === 'keep' && ctx && ctx.cid) { const c = B.custom(ctx.cid); if (c && c.fx) applyFx.call(this, pc, c.fx, {}); }
    } catch (e) { console.error('custom keep', e); }
    return r;
  };

  // ---- the moments
  B.month = function (pc) {
    if (!pc || !pc.alive) return;
    const S = A.S, mo = A.monthOf(A.today()).m, age = A.age(pc);
    pc.rb = pc.rb && typeof pc.rb === 'object' ? pc.rb : {};
    const war = A.atWar(pc.realm) || [];
    for (const c of B.mine(pc)) {
      const h = pc.rb[c.id];
      if (c.kind === 'year') {
        if (mo === (c.m || 0) && (!h || h.y !== S.year) && who(pc, c.who)) B.hit(pc, c);
      } else if (c.kind === 'rite') {
        if (!h && age >= (c.age || 16) && age <= (c.age || 16) + 2 && who(pc, c.who || 'all')) B.hit(pc, c);
      } else if (c.kind === 'ward') {
        const f = B.WHEN[c.when] || B.WHEN.any;
        if ((!h || S.year - h.y >= (c.every || B.WARD_EVERY)) && A.isAdult(pc) && f(pc)) B.hit(pc, c);
      } else if (c.kind === 'levy') {
        // once for each war: the war's start year is its mark
        const w = war[0], key = w ? (w.id || w.name || '') + '|' + (w.start || w.y || '') : null;
        if (w && who(pc, c.who) && !pc.mil && (!h || h.war !== key)) { B.hit(pc, c); pc.rb[c.id].war = key; }
      }
    }
  };
  A.onMonth.push(pc => { try { B.month(pc); } catch (e) { console.error('customs month', e); } });

  const kindOf = (pc, k) => B.mine(pc).filter(c => c.kind === k);

  // wed: the dowry the release pays is multiplied (0: none; 2: twice; -1: a bride price of the same size is paid)
  const marry = A.marry;
  A.marry = function (pc, t) {
    const me = A.pc(), c0 = pc ? pc.coin : 0;
    const r = marry.apply(this, arguments);
    try {
      if (pc && me && pc.id === me.id) for (const c of kindOf(pc, 'wed')) {
        const dowry = pc.coin - c0, m = c.dowry == null ? 1 : c.dowry;
        let paid = 0;
        if (m !== 1) {
          const base = dowry > 0 ? dowry : B.ESTATE[Math.max(1, rank(t || pc))] / 2;
          const want = m < 0 ? -Math.round(base * -m) : Math.round(dowry * m);
          paid = want - dowry; pc.coin = Math.max(0, pc.coin + paid);
        }
        B.hit(pc, c, { dowry: A.coin(Math.abs(dowry)), paid: A.coin(Math.abs(paid)) });
      }
    } catch (e) { console.error('custom wed', e); }
    return r;
  };

  // mourn: a parent dies; the custom says who takes the estate. grave: your own burial.
  B.estate = p => Math.round(B.ESTATE[(GD.STATUS[p.status] || { rank: 2 }).rank] || 0);
  B.share = function (pc, parent, share) {
    const kids = (parent.children || []).map(A.P).filter(k => k && k.alive);
    const all = kids.length ? kids : [pc], born = k => k.born == null ? 0 : k.born;
    const sons = all.filter(k => k.sex === 'M'), daughters = all.filter(k => k.sex === 'F');
    const oldest = l => l.slice().sort((a, b) => born(a) - born(b))[0], youngest = l => l.slice().sort((a, b) => born(b) - born(a))[0];
    const est = B.estate(parent);
    switch (share) {
      case 'eldest': return oldest(all) === pc ? est : 0;
      case 'eldestSon': return (sons.length ? oldest(sons) : oldest(all)) === pc ? est : 0;
      case 'youngest': return youngest(all) === pc ? est : 0;
      case 'daughters': return daughters.length ? (pc.sex === 'F' ? Math.round(est / daughters.length) : 0) : Math.round(est / all.length);
      case 'equal': return Math.round(est / all.length);
      case 'temple': return Math.round(est * 0.9 / all.length);   // the faith takes its tenth first
      default: return 0;   // 'lord', 'clan', 'none': the estate goes back to the lord or the clan
    }
  };
  const kill = A.kill;
  A.kill = function (p) {
    const was = p && p.alive, pc = A.pc();
    const r = kill.apply(this, arguments);
    try {
      if (was && p && !p.alive && pc) {
        if (p.id === pc.id) { for (const c of kindOf(pc, 'grave')) B.hit(pc, c); }
        else if (pc.alive && (pc.parents || []).includes(p.id)) for (const c of kindOf(pc, 'mourn')) {
          const got = B.share(pc, p, c.share);
          if (got > 0) pc.coin += got;
          B.hit(pc, c, { got: A.coin(got), estate: A.coin(B.estate(p)), parent: A.fullName ? A.fullName(p) : p.given || 'your parent' });
        }
      }
    } catch (e) { console.error('custom mourn', e); }
    return r;
  };

  // name: a child of yours is born and named by the custom
  B.NAME = {
    grandparent: (pc, k) => { const g = (pc.parents || []).map(A.P).find(x => x && x.sex === k.sex); return g ? g.given : null; },
    parent: (pc, k) => (k.sex === pc.sex ? pc.given : (A.P(pc.spouse) || {}).given) || null,
    keep: () => null,
  };
  // (A.birth returns the first child; the release then asks the player to name it, with this name as the default)
  // the naming rule is c.by; early data kept it in c.rule, which is otherwise the card's sentence
  B.nameBy = c => c.by || (B.NAME[c.rule] ? c.rule : 'keep');
  B.ruleLine = c => (c.rule && !B.NAME[c.rule] ? c.rule : c.text || '');
  const birth = A.birth;
  A.birth = function (mother, father) {
    const k = birth.apply(this, arguments);
    try {
      const pc = A.pc();
      if (pc && k && k.id && (mother === pc || father === pc)) for (const c of kindOf(pc, 'name')) {
        const nm = (B.NAME[B.nameBy(c)] || B.NAME.keep)(pc, k);
        // a name already worn by a living brother or sister is not given twice
        const taken = (pc.children || []).map(A.P).some(x => x && x !== k && x.alive && x.given === nm);
        if (nm && !taken) k.given = nm;
        B.hit(pc, c, { child: k.given });
      }
    } catch (e) { console.error('custom name', e); }
    return k;
  };

  // law: after a punishment, the custom has its say
  const punish = A.punish;
  A.punish = function (pc) {
    const r = punish.apply(this, arguments);
    try { const me = A.pc(); if (pc && me && pc.id === me.id && pc.alive) for (const c of kindOf(pc, 'law')) B.hit(pc, c); } catch (e) { console.error('custom law', e); }
    return r;
  };

  // market: a cut of what you sell at home
  const sell = A.sellGood;
  if (typeof sell === 'function') A.sellGood = function (k, n, rid) {
    const pc = A.pc(), c0 = pc ? pc.coin : 0;
    const r = sell.apply(this, arguments);
    try {
      const got = pc ? pc.coin - c0 : 0;
      if (got > 0 && (!rid || rid === A.homeMkt(pc))) for (const c of kindOf(pc, 'market')) {
        const cut = Math.round(got * (c.cut || 0.05)); pc.coin -= cut;
        const h = pc.rb && pc.rb[c.id];
        if (!h || h.y !== A.S.year) B.hit(pc, c, { cut: A.coin(cut) });
        else h.n++;
      }
    } catch (e) { console.error('custom market', e); }
    return r;
  };

  // ---- the Realm tab: the realm's bible and its customs as you have met them (pure)
  B.card = function (pc) {
    const R = A.realm(pc.realm), D = R && B.of(R.id);
    if (!D) return '';
    const W = B.words(B.cult(pc)), esc = UI.esc;
    const met = c => (pc.rb && pc.rb[c.id] ? `met ${pc.rb[c.id].n}×, first in ${pc.rb[c.id].first}` : 'not met yet');
    return `<div class="card small rb" aria-label="The ways of ${esc(R.short)}"><b>The ways of ${esc(R.short)}</b>` +
      `<div class="tiny"><b>It wants</b> ${esc(D.want)}</div><div class="tiny"><b>It fears</b> ${esc(D.fear)}</div>` +
      (D.place ? `<div class="tiny"><b>${esc(D.place.name)}</b>: ${esc(D.place.text)}</div>` : '') +
      `<div class="tiny" style="margin-top:4px"><b>Customs</b></div>` +
      (D.customs || []).map(c => `<div class="tiny">${esc(B.fill(pc, c.name))}: ${esc(B.fill(pc, B.ruleLine(c)))} <span class="muted">(${esc(met(c))})</span></div>`).join('') +
      (W.length ? `<div class="tiny muted" style="margin-top:4px">${W.map(w => `<i>${esc(w[0])}</i>, ${esc(w[1])}`).join('; ')}</div>` : '') +
      `</div>`;
  };
  const realmTab = UI.TAB && UI.TAB.realm;
  if (typeof realmTab === 'function') UI.TAB.realm = function (pc) {
    const h = realmTab.apply(this, arguments);
    try { const card = pc && pc.alive ? B.card(pc) : ''; return card ? h + card : h; } catch (e) { return h; }
  };

  // {cw1} {cw2} {cw3} in any event: the player's realm's culture words
  const tokens = A.ctxTokens;
  if (typeof tokens === 'function') A.ctxTokens = function (pc) {
    const t = tokens.apply(this, arguments);
    try { const W = B.words(B.cult(pc)); if (t && W.length) { t.cw1 = W[0][0]; t.cw2 = (W[1] || W[0])[0]; t.cw3 = (W[2] || W[0])[0]; } } catch (e) {}
    return t;
  };
})();
