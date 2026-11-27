// Tests for src/world/9999977-figures (the figures registry, order 96, D-193). Every test fails (never skips) when the
// feature is not in the build. World-robust (H-082): the generated categories are read over several worlds, and nothing
// asserts one world's people.

const GATE = () => typeof A !== 'undefined' && !!A.FIG && !!A.POWER && !!A.DATA && !!A.DATA['figures/vocab'];
const NO = { ok: false, detail: 'A.FIG not in this build' };
const SEEDS = [7, 23, 41];

export default {
  // every category present; the fixed counts (33 ancient demons at the bestiary's four counts and sworn to the three
  // Archdemons, the three ancient dragons, nine elder dragons); every profile whole, and its titles, skills and class
  // valid against their data; the fixed beings real in A.POWER (their level the data's with their titles', every one
  // below every legend, the ancient dragons above the elders, the ancient demons about the elders); the people of three
  // worlds each a full profile with a level, skills read from their rungs, valid classes and titles
  async figRegistry(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(SEEDS => {
      const F = A.FIG, PW = A.POWER, bad = [], out = {};
      const want = ['rulers', 'great-houses', 'generals', 'order-masters', 'race-masters', 'legends', 'ancient-dragons', 'elder-dragons', 'ancient-demons'];
      for (const id of want) if (!F.CATS.some(c => c.id === id)) bad.push('no category ' + id);
      const CL = A.LV && A.LV.CL, TDEF = id => PW.titleRef(id), IX = A.SK2.IX(), RANKS = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'X'];
      const avg = xs => xs.reduce((a, x) => a + x, 0) / Math.max(1, xs.length);
      A.newGame({ seed: SEEDS[0], race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      // the fixed beings
      const dem = F.list('ancient-demons'), anc = F.list('ancient-dragons'), eld = F.list('elder-dragons');
      out.counts = { dem: dem.length, anc: anc.length, eld: eld.length };
      for (const s of PW.BD.species) {
        if (s.tier === 'ancient demon' && dem.filter(p => PW.FIG.get(p.id).sp === s.id).length !== s.world) bad.push('demons of ' + s.id);
        if (s.tier === 'elder dragon' && eld.filter(p => PW.FIG.get(p.id).sp === s.id).length !== s.world) bad.push('elders of ' + s.id);
      }
      out.lieges = ['ghazrul', 'morvane', 'vethrael'].map(l => dem.filter(p => p.liege === l).length);
      if (out.lieges.some(n => n < 8) || out.lieges.reduce((a, b) => a + b, 0) !== 33) bad.push('lieges ' + out.lieges);
      const full = p => ['name', 'level', 'skills', 'arts', 'titles', 'items', 'temper', 'traits', 'goals', 'grudges', 'home', 'story', 'secret'].every(k => p[k] != null) &&
        p.skills.length >= 2 && p.titles.length >= 1 && p.items.length >= 1 && p.goals.length >= 1 && p.grudges.length >= 1 && p.story.length >= 1 && p.secret.story.length >= 1 && p.home.name;
      // the storm ancient is the legend Vaskareth (D-198): her sheet is a legend's, listed with the two fixed ancients
      const ancFix = anc.filter(p => p.type === 'being');
      if (anc.filter(p => p.type === 'legend').map(p => p.id).join() !== 'vaskareth') bad.push('the storm ancient is not Vaskareth');
      if (!anc.every(p => p.dominion)) bad.push('an ancient dragon without a dominion');
      for (const p of dem.concat(ancFix, eld)) {
        if (!full(p)) bad.push('not full: ' + p.id);
        for (const t of p.titles) { const T = TDEF(t.id); if (!T || !T.n) bad.push(p.id + ' title ' + t.id); }
        for (const k of p.skills) { if (!RANKS.includes(k.rank) || !(k.lvl >= 1 && k.lvl <= 10)) bad.push(p.id + ' skill ' + k.n); if (k.id && !IX.BY[k.id]) bad.push(p.id + ' no skill ' + k.id); }
        for (const a of p.arts) if (!p.skills.some(k => (k.id || k.n) === a || k.n === a)) bad.push(p.id + ' art ' + a);
        if (p.cls !== null) bad.push(p.id + ' a class');
        const sheet = PW.FIG.get(p.id), lv = sheet.level + sheet.titles.reduce((a, t) => a + ((t.buffs && t.buffs.level) || 0), 0);
        if (PW.level(p.id) !== lv) bad.push(`${p.id} level ${PW.level(p.id)} not ${lv}`);
        const g = F.mind(p.id); if (!g || !g.temper || !g.grudges.length) bad.push(p.id + ' mind');
      }
      for (const t of Object.keys(A.DATA['figures/vocab'].traits)) if (!GD.TRAITS[A.DATA['figures/vocab'].traits[t]]) bad.push('trait ' + A.DATA['figures/vocab'].traits[t]);
      const pw = ps => ps.map(p => PW.power(p.id));
      const legMin = Math.min(...PW.LD.legends.map(l => PW.power(l.id))), figMax = Math.max(...pw(dem.concat(ancFix, eld)));
      out.power = { legMin: Math.log10(legMin), figMax: Math.log10(figMax), anc: Math.log10(avg(pw(anc))), eld: Math.log10(avg(pw(eld))), dem: Math.log10(avg(pw(dem))), mas: Math.log10(Math.max(...PW.D.masters.map(m => PW.power(m.id)))) };
      if (!(figMax < legMin)) bad.push('a figure above a legend');
      if (!(Math.min(...pw(anc)) > avg(pw(eld)))) bad.push('the ancient dragons not above the elders');
      const ratio = avg(pw(dem)) / avg(pw(eld)); out.power.demOverEld = ratio;
      if (!(ratio > 1 / 3 && ratio < 3)) bad.push('the ancient demons do not rival the elder dragons');
      // the links
      const leg = F.list('legends'), mas = F.list('race-masters');
      if (leg.length !== PW.LD.legends.length) bad.push('legends ' + leg.length);
      for (const p of mas) { if (!p.cls || !CL.BY.get(p.cls.id)) bad.push('master class ' + p.id); if (!p.goals.length || !p.grudges.length || !p.secret.story.length) bad.push('master not full ' + p.id); }
      // the people of three worlds
      out.worlds = [];
      for (const seed of SEEDS) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
        const g = F.generated(), live = Object.values(A.S.realms).filter(x => x.alive !== false && x.ruler && A.P(x.ruler) && A.P(x.ruler).alive !== false).length;
        out.worlds.push({ seed, rulers: g.rulers.length, live, houses: g['great-houses'].length, generals: g.generals.length, orders: g['order-masters'].length });
        if (g.rulers.length !== live) bad.push(`world ${seed}: ${g.rulers.length} rulers of ${live} realms`);
        if (!g['great-houses'].length || !g.generals.length || !g['order-masters'].length) bad.push(`world ${seed}: an empty category`);
        const ids = new Set();
        for (const k in g) for (const p of g[k]) {
          if (ids.has(p.pid)) bad.push('twice: ' + p.pid); ids.add(p.pid);
          if (!(p.level >= 1) || !p.name || !p.story.length || !p.temper || !p.home.name) bad.push(`not full: ${k} ${p.pid}`);
          if (p.level !== A.LV.level(A.P(p.pid))) bad.push('level ' + p.pid);
          if (p.cls && !CL.BY.get(p.cls.id)) bad.push('class ' + p.pid);
          for (const t of p.titles) if (!A.TT.BY.get(t.id)) bad.push('title ' + t.id);
          for (const s of p.skills) if (A.SK2.label(A.P(p.pid), s.k, { bare: true }) !== s.label) bad.push('skill ' + p.pid + ' ' + s.k);
        }
        if (bad.length > 20) break;
      }
      out.sample = { demon: F.profile('skarn').name, king: F.list('rulers')[0].name };
      return { bad: bad.slice(0, 20), out };
    }, SEEDS);
    const o = r.out, ok = !r.bad.length && o.counts.dem === 33 && o.counts.anc === 3 && o.counts.eld === 9;
    return { ok, detail: `${r.bad.length ? 'faults: ' + r.bad.join('; ') + '. ' : ''}fixed ${JSON.stringify(o.counts)}, sworn ${o.lieges}; power (log10): legends from ${o.power.legMin.toFixed(2)}, figures to ${o.power.figMax.toFixed(2)}, ancient ${o.power.anc.toFixed(2)}, elder ${o.power.eld.toFixed(2)}, demons ${o.power.dem.toFixed(2)} (x${o.power.demOverEld.toFixed(2)} the elders), masters to ${o.power.mas.toFixed(2)}; worlds ${JSON.stringify(o.worlds)}` };
  },

  // a fresh life sees no secret (order 93): over three worlds, a peasant's page in every category, with every figure he may
  // read opened, shows no goal, grudge or secret line of anyone, and no whispered being's name; a flag that tells him (the
  // positive control) and a meeting open them
  async figKnown(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(SEEDS => {
      const F = A.FIG, leaks = [], out = { secretNow: 0, opened: 0 };
      for (const seed of SEEDS) {
        A.newGame({ seed, race: 'human', realm: 'POL-02', status: 'peasant', sex: 'F', startAge: 18 });
        const pc = A.pc();
        for (const c of F.CATS) {
          UI.figCat = c.id; UI.figOpen = null;
          const list = F.list(c.id), page = UI.figuresPage(pc);
          for (const p of list) {
            const k = F.knows(pc, p);
            if (k.secret && p.pid !== pc.id) { out.secretNow++; leaks.push(`${seed} ${p.id} secret`); }
            if (!k.listed && p.type === 'being' && page.includes(UI.esc(p.name))) leaks.push(`${seed} ${p.id} named`);
            if (!k.listed) continue;
            const h = F.profileHtml(pc, p, k); out.opened++;
            for (const s of (p.secret.story || []).concat(p.goals.map(g => g.why))) if (s && s.length > 12 && h.includes(UI.esc(s))) leaks.push(`${seed} ${p.id}: ${s.slice(0, 40)}`);
          }
        }
        if (leaks.length > 10) break;
      }
      // the positive control: learned by a flag, and met
      const pc = A.pc(), sk = F.profile('skarn');
      const before = F.profileHtml(pc, sk);
      pc.flags.fig_skarn = A.S.year;
      const after = F.profileHtml(pc, sk);
      delete pc.flags.fig_skarn;
      const st = A.POWER.state ? A.POWER.state() : A.S.pw; st.metLeg = st.metLeg || {}; st.metLeg.rimewing = A.S.year;
      const met = F.knows(pc, F.profile('rimewing'));
      delete st.metLeg.rimewing;
      const wh = F.profile('vesh');
      out.control = { hidden: !before.includes(UI.esc(sk.secret.story[0])), shown: after.includes(UI.esc(sk.secret.story[0])), met: met.arts && met.secret, whisperedHidden: !F.knows(pc, wh).listed };
      return { leaks: leaks.slice(0, 10), out };
    }, SEEDS);
    const c = r.out.control, ok = !r.leaks.length && r.out.opened > 100 && c.hidden && c.shown && c.met && c.whisperedHidden;
    return { ok, detail: `${r.leaks.length ? 'leaks: ' + r.leaks.join('; ') + '. ' : ''}${r.out.opened} profiles a fresh peasant may read, opened over ${SEEDS.length} worlds: no secret; control ${JSON.stringify(c)}` };
  },

  // the same seed gives the same registry, and reading it (and drawing its page) draws nothing from the game's stream
  async figDeterministic(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const run = () => {
        A.newGame({ seed: 4471, race: 'human', realm: 'POL-03', status: 'noble', sex: 'M', startAge: 20 });
        const all = A.FIG.all();
        for (const c of A.FIG.CATS) { UI.figCat = c.id; UI.figuresPage(A.pc()); }
        T.play(1);
        const later = A.FIG.all();
        return { h0: T.hash(all), h1: T.hash(later), n: all.length, drew: (() => { const a = A.S.rng; A.FIG.all(); UI.figuresPage(A.pc()); return a !== A.S.rng; })() };
      };
      const a = run(), b = run();
      return { a, b };
    });
    const ok = r.a.h0 === r.b.h0 && r.a.h1 === r.b.h1 && !r.a.drew && !r.b.drew && r.a.n > 150;
    return { ok, detail: `${r.a.n} profiles; at the start ${r.a.h0} / ${r.b.h0}, a year on ${r.a.h1} / ${r.b.h1}; reading drew from the stream: ${r.a.drew || r.b.drew}` };
  },

  // 375 x 667: the codex's "Figures of the Age" fits; every category button and figure row is at least 44 points; a row
  // opens its profile on a press; a description opens on a press, never on hover; no percentage anywhere
  async figPhone(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    await pg.setViewportSize({ width: 375, height: 667 });
    await pg.evaluate(() => { T.enter({ seed: 9791, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 }); A.S.queue = []; UI.ov = null; UI.tab = 'codex'; UI.codex = 'power'; UI.figCat = null; UI.figOpen = null; UI.render(); });
    await pg.click('button[data-a="codex"][data-v="figures"]');
    const measure = () => pg.evaluate(() => {
      const f = document.querySelector('.fig'); if (!f) return null;
      const small = [...f.querySelectorAll('button')].filter(b => { const q = b.getBoundingClientRect(); return q.width > 0 && (q.width < 44 || q.height < 44); }).map(b => b.textContent.trim().slice(0, 30));
      return { cats: f.querySelectorAll('.fig-cat').length, rows: f.querySelectorAll('.fig-row').length, small, pct: /\d\s?%/.test(f.textContent), sideways: document.documentElement.scrollWidth > innerWidth + 0.5, hover: f.querySelectorAll('[onmouseover],[onmouseenter],[title]').length };
    });
    const first = await measure();
    const per = [];
    for (const id of ['rulers', 'ancient-demons', 'elder-dragons']) {
      await pg.click(`.fig-cat[data-v="${id}"]`);
      const m = await measure(); per.push([id, m && m.rows, m && m.small.length, m && m.sideways]);
    }
    await pg.click('.fig-cat[data-v="ancient-dragons"]');
    await pg.click('.fig-row');
    const opened = await pg.evaluate(() => ({ body: !!document.querySelector('.fig-body'), w: document.documentElement.scrollWidth, vw: innerWidth }));
    const tip = '.fig-body .tt';
    await pg.hover(tip); const hov = await pg.evaluate(() => (UI.TT ? UI.TT.depth() : 0));
    await pg.click(tip); const open = await pg.evaluate(() => (UI.TT ? UI.TT.depth() : 0));
    await pg.keyboard.press('Escape');
    const last = await measure();
    await pg.setViewportSize({ width: 1366, height: 768 });
    const ok = !!first && first.cats === 9 && !first.small.length && !first.pct && !first.sideways && !first.hover && per.every(x => x[1] > 0 && x[2] === 0 && !x[3]) &&
      opened.body && opened.w <= opened.vw + 0.5 && hov === 0 && open > 0 && !last.pct && !last.small.length;
    return { ok, detail: `${first ? `${first.cats} categories, small controls ${first.small.join(', ') || 'none'}, % ${first.pct}, sideways ${first.sideways}` : 'no page'}; ${JSON.stringify(per)}; a profile opened ${opened.body} (${opened.w} of ${opened.vw}); a note on hover ${hov}, on a press ${open}` };
  },
};
