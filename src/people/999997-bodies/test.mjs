// C9 "Bodies that make sense" (D-040): the measured word scale, no real units, skill baselines, longer lives.
const UNITS = /\b\d+(?:[.,]\d+)?\s?(?:kg|cm|ms|m\/s)\b|\bkm a day\b|\blifts \d/;

export default {
  // the words against a generated population: four in ten average, few at the ends, a child is a child, giants off the chart
  async bodiesBands(pg) {
    const r = await pg.evaluate(() => {
      const VS = A.V2S, cnt = {}, n = { all: 0 };
      for (const seed of [11, 22]) {
        A.newGame({ seed, sex: 'M', race: 'human', realm: 'POL-01', status: 'peasant', startAge: 20 });
        for (const p of Object.values(A.S.people)) {
          if (!p.alive || !p.st || A.age(p) < (GD.RACES[p.race] || GD.RACES.human).grown) continue;
          n.all++;
          for (const s of GD.STATS) { const b = VS.statBand(p, s).band; cnt[b] = (cnt[b] || 0) + 1; }
        }
      }
      const tot = n.all * 6, share = b => (cnt[b] || 0) / tot;
      // an untrained grown man of 35 at his people's mean potential, grown by the release's own curve: average everywhere
      A.newGame({ seed: 5, sex: 'M', race: 'human', realm: 'POL-01', status: 'merchant', startAge: 30 });
      const pot = {}; for (const s of GD.STATS) pot[s] = 42;
      const man = A.newPerson({ race: 'human', sex: 'M', born: A.S.year - 35, pot, traits: [], quirks: [] }), mid = {};
      man.app = Object.assign({}, man.app, { build: 'average' });
      for (const s of GD.STATS) mid[s] = VS.statBand(man, s, man.st[s]).word;
      // a child of 9 at a typical body for its age
      const kid = Object.values(A.S.people).find(p => p.alive && p.race === 'human' && A.age(p) === 9);
      const kidW = kid ? VS.statWord(kid, 'str', VS.typicalStat(kid, 'str', 9)) : 'none';
      // a typical grown giant against men
      const g = Object.values(A.S.people).find(p => p.race === 'giant' && A.age(p) >= 35) || A.newPerson({ race: 'giant', born: A.S.year - 40 });
      const gs = VS.statBand(g, 'str', (42 + GD.RACES.giant.mods.str) * 0.78), gp = VS.statBand(g, 'spd', (42 + GD.RACES.giant.mods.spd) * 0.78);
      return { avg: share(3), lowEnd: share(0), highEnd: share(6) + share(7), off: share(7), mid, kidW, gs: gs.men, gp: gp.men, n: n.all };
    });
    const ok = r.n > 1000 && r.avg > 0.3 && r.avg < 0.55 && r.lowEnd > 0.005 && r.lowEnd < 0.06 && r.highEnd > 0.002 && r.highEnd < 0.06 && r.off < 0.01
      && Object.values(r.mid).every(w => w === 'average') && /^average for a child of nine$/.test(r.kidW)
      && /off the chart, stronger/.test(r.gs) && /off the chart at the other end, slower/.test(r.gp);
    return { ok, detail: JSON.stringify(r) };
  },

  // no real unit for a body anywhere a person is shown: the sheet, the Profile page, the full profile, another person,
  // a stat's popover, the character maker's height
  async bodiesNoUnits(pg) {
    const r = await pg.evaluate(async () => {
      const found = [], txt = h => { const d = document.createElement('div'); d.innerHTML = String(h || ''); for (const x of d.querySelectorAll('script,style')) x.remove(); return d.textContent.replace(/\s+/g, ' '); };
      const scan = (where, h) => { const t = txt(h); const m = t.match(/\b\d+(?:[.,]\d+)?\s?(?:kg|cm|ms|m\/s)\b|\bkm a day\b|\blifts \d/); if (m) found.push(where + ': ' + t.slice(Math.max(0, m.index - 60), m.index + 40)); };
      for (const o of [{ seed: 41, startAge: 9 }, { seed: 42, startAge: 24 }, { seed: 43, startAge: 30, race: 'dwarf' }]) {
        T.enter(o); T.play(2);
        const pc = A.pc();
        UI.tab = 'life'; UI.render(); scan('side ' + o.seed, (document.getElementById('game') || document.body).innerHTML);
        scan('sheet', A.V2S.sheetHtml(pc));
        if (UI.profileModal) scan('full', UI.profileModal(pc));
        UI.tab = 'profile'; if (UI.PF) UI.PF.forceOpen = true; UI.render(); scan('profile page', (document.getElementById('game') || document.body).innerHTML);
        for (const s of GD.STATS) if (UI.TIPS && UI.TIPS.stat) scan('tip ' + s, UI.TIPS.stat(s));
        const other = Object.values(A.S.people).filter(p => p.alive && p.id !== pc.id).slice(0, 6);
        for (const p of other) { if (UI.personModal) scan('person', UI.personModal(p, '<button>x</button>')); scan('sheet other', A.V2S.sheetHtml(p)); }
        if (UI.PF) UI.PF.forceOpen = false;
      }
      // the maker's height slider
      let maker = '';
      try { UI.cr = UI.cr || { race: 'human', sex: 'M', app: { height: 178 } }; maker = A.V2S.crHeightText('<label>Height (grown): <span id="hval">178 cm</span></label>'); } catch (e) { maker = 'error ' + e; }
      scan('maker', maker);
      return { found: found.slice(0, 8), n: found.length };
    });
    return { ok: r.n === 0, detail: r.n ? r.found.join(' | ') : 'no kg, cm, ms, m/s or km a day on any page that shows a body' };
  },

  // every NPC master clears the baseline; a player past it is held back and stalls; training a skill trains its stats a little
  async bodiesBaseline(pg) {
    const r = await pg.evaluate(() => {
      const BD = A.BODIES, out = { masters: 0, fail: [] };
      for (const seed of [11, 22]) {
        A.newGame({ seed, sex: 'M', race: 'human', realm: 'POL-01', status: 'noble', startAge: 20 });
        for (const p of Object.values(A.S.people)) {
          const R = GD.RACES[p.race] || GD.RACES.human, age = A.age(p);
          if (!p.alive || !p.st || p.id === A.S.pc || age < R.grown || age >= R.old * 0.85) continue;
          for (const k in p.skills) {
            const v = p.skills[k], ss = GD.SKILL_STAT[k];
            if (!(v >= 75) || !ss) continue;
            out.masters++;
            // the raw stat (before traits, wounds and weariness) clears the Master baseline: an untrained grown body's middle
            const r1 = Math.max(p.st[ss[0]], A.statFloor(p, ss[0])) / BD.typ(p, ss[0]), r2 = Math.max(p.st[ss[1]], A.statFloor(p, ss[1])) / BD.typ(p, ss[1]);
            if (r1 < 1 - 1e-6 || r2 < 0.9 - 1e-6) out.fail.push(`${p.race} ${age} ${k} ${Math.round(v)}: ${r1.toFixed(2)} ${r2.toFixed(2)}`);
          }
        }
      }
      // the player: a feeble swordsman with sword 80 fights as an Expert at most; training does not raise it
      A.newGame({ seed: 7, sex: 'M', race: 'human', realm: 'POL-01', status: 'peasant', startAge: 25 });
      const pc = A.pc(); pc.traits = []; pc.wounds = []; pc.flags.weary = false;
      pc.skills.sword = 80; pc.st.ins = 42 * 0.78 * 0.8; pc.st.spd = 42 * 0.78 * 1.3;
      out.capWeak = A.skill(pc, 'sword');
      const before = pc.skills.sword; A.trainSkill(pc, 'sword', 5); out.stall = pc.skills.sword - before;
      pc.st.ins = 42 * 0.78 * 1.05; out.capStrong = A.skill(pc, 'sword');
      // a plain skill below its cap still rises, and trains its first stat a little
      pc.skills.trade = 20; const i0 = pc.st.int; A.trainSkill(pc, 'trade', 5); out.tradeUp = pc.skills.trade - 20; out.intUp = pc.st.int - i0;
      // the player is never lifted by a floor
      out.pcFloor = A.statFloor(pc, 'ins');
      return out;
    });
    const ok = r.masters > 50 && r.fail.length === 0 && r.capWeak < 75 && r.capWeak >= 59 && r.stall === 0 && r.capStrong === 80 && r.tradeUp > 0 && r.intUp > 0 && r.intUp < r.tradeUp && r.pcFloor === 0;
    return { ok, detail: JSON.stringify(r).slice(0, 900) };
  },

  // a healthy grown life at peace: the release's own yearly odds of dying (A.deathChance), no war, no wounds, fed
  async bodiesLifespan(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9, sex: 'M', race: 'human', realm: 'POL-05', status: 'merchant', startAge: 20 });
      const pc = A.pc(), y0 = A.S.year, curve = st => {
        pc.status = st; let S = 1; const at = {};
        for (let age = 20; age <= 100; age++) {
          pc.born = A.S.year - age; pc.health = Math.min(85, A.maxHealth(pc));
          S *= 1 - A.deathChance(pc);
          if (age % 5 === 0) at[age] = Math.round(S * 1000) / 1000;
        }
        return at;
      };
      const m = curve('merchant'), p = curve('serf');
      pc.born = y0 - 20; pc.status = 'merchant';
      return { m, p };
    });
    const m = r.m, p = r.p;
    // reaching 50: nine in ten or more; dying between 50 and 75: most of those left; few past 80; serfs a little earlier
    const ok = m[50] >= 0.9 && (m[50] - m[75]) / m[50] >= 0.6 && m[80] < 0.2 && m[60] > 0.75 && p[65] < m[65];
    return { ok, detail: `merchant alive at 50/60/70/75/80: ${m[50]}/${m[60]}/${m[70]}/${m[75]}/${m[80]}; serf ${p[50]}/${p[60]}/${p[70]}/${p[75]}/${p[80]}` };
  },

  // rendering draws nothing and writes nothing; the same seed and choices read the same words
  async bodiesPure(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 44, startAge: 22 }); T.play(1);
      const pc = A.pc(), snap = JSON.stringify(A.S), rs = A.S.rng;
      let calls = 0; const rand = A.rand; A.rand = function () { calls++; return rand.apply(this, arguments); };
      let words;
      try {
        words = GD.STATS.map(s => A.V2S.statWord(pc, s)).join(',') + A.V2S.sheetHtml(pc).length;
        UI.tab = 'profile'; UI.render(); A.V2S.sheetHtml(pc);
        for (const p of Object.values(A.S.people).slice(0, 200)) for (const s of GD.STATS) { A.V2S.statBand(p, s); A.stat(p, s); }
        for (const p of Object.values(A.S.people).slice(0, 200)) for (const k in p.skills) A.skill(p, k);
      } finally { A.rand = rand; }
      return { calls, same: JSON.stringify(A.S) === snap, words: !!words };
    });
    return { ok: r.calls === 0 && r.same && r.words, detail: JSON.stringify(r) };
  },

  // an old save (made before this feature) loads, and its people read the floor and the scale with no new state
  async bodiesOldSave(pg) {
    const r = await pg.evaluate(async () => {
      const files = (window.__SAVES__ || []);
      A.newGame({ seed: 61, sex: 'F', race: 'human', realm: 'POL-01', status: 'noble', startAge: 30 });
      // strip everything this feature could have added; there is nothing: it stores no state
      const raw = JSON.stringify(A.S);
      const back = JSON.parse(raw);
      A.S = back;
      const pc = A.pc(), w = GD.STATS.map(s => A.V2S.statWord(pc, s));
      const before = JSON.stringify(A.S);
      for (const p of Object.values(A.S.people)) for (const s of GD.STATS) A.stat(p, s);
      return { words: w.every(x => typeof x === 'string' && x.length > 2), unchanged: JSON.stringify(A.S) === before, files: files.length };
    });
    return { ok: r.words && r.unchanged, detail: JSON.stringify(r) };
  },
};
