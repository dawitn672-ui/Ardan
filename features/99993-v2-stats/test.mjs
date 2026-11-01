// v2 stats: the body adapter, attempt() rolls, v2 fighting worth, faith for those who take it up, and words, not numbers.
export default {
  // height follows the v2 growth curve from birth; an adult's stays put
  async v2sHeight(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 31, race: 'human', sex: 'M', startAge: 0 });
      const pc = A.pc(), out = [];
      for (const age of [0, 1, 3, 6, 10, 14, 18, 25, 40]) { const born = pc.born; pc.born = A.S.year - age; A.V2S.cache = new WeakMap(); out.push([age, A.V2S.height(pc)]); pc.born = born; }
      A.V2S.cache = new WeakMap();
      return { out, adult: pc.app.height };
    });
    const h = r.out.map(x => x[1]);
    const grows = h.slice(0, 7).every((v, i) => i === 0 || v > h[i - 1]);
    const ok = grows && h[0] < 0.35 * r.adult && Math.abs(h[7] - r.adult) <= 1 && h[8] === h[7];
    return { ok, detail: `height by age ${r.out.map(x => `${x[0]}:${x[1]}cm`).join(' ')} (adult ${r.adult})` };
  },

  // strength rises, peaks and declines; the old 0-100 stat is derived from the body and still read by C.stat
  async v2sDerive(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 32, race: 'human', sex: 'M', startAge: 0 });
      const pc = A.pc(), byAge = [];
      for (let y = 0; y < 30; y++) { T.play(1); if (!pc.alive) break; if ([5, 12, 18, 25].includes(A.age(pc))) byAge.push([A.age(pc), Math.round(A.stat(pc, 'str')), Math.round(A.V2S.stats(pc).lift)]); }
      const before = { c: pc.v2.c.lift, st: pc.st.str, cstat: A.C.stat(pc, 'str') };
      A.applyFx(pc, { str: 3 }, {});
      A.V2S.sync(pc);
      const after = { c: pc.v2.c.lift, st: pc.st.str, cstat: A.C.stat(pc, 'str') };
      // decline: the same body read at 70
      const born = pc.born; pc.born = A.S.year - 70; A.V2S.cache = new WeakMap(); const old = Math.round(A.V2S.stats(pc).lift); pc.born = born; A.V2S.cache = new WeakMap();
      return { byAge, before, after, old, peak: Math.round(A.V2S.stats(pc).lift), alive: pc.alive };
    });
    const s = r.byAge.map(x => x[1]), l = r.byAge.map(x => x[2]);
    const rises = s.every((v, i) => i === 0 || v >= s[i - 1]) && l.every((v, i) => i === 0 || v > l[i - 1]);
    const ok = r.alive && rises && r.after.c > r.before.c && r.after.st > r.before.st && r.after.cstat > r.before.cstat && r.old < r.peak;
    return { ok, detail: `str/lift by age ${r.byAge.map(x => `${x[0]}: ${x[1]}, ${x[2]} kg`).join('; ')}; fx str +3: cond ${r.before.c} -> ${r.after.c}, st ${r.before.st} -> ${r.after.st}, C.stat ${r.before.cstat} -> ${r.after.cstat}; lift ${r.peak} kg now, ${r.old} kg at 70` };
  },

  // races are different bodies: in levies a giant beats an orc beats a man beats an elf, and the old scale follows
  async v2sRaces(pg) {
    const r = await pg.evaluate(() => {
      const by = {};
      for (const seed of [33, 34]) {
        T.enter({ seed });
        for (const p of Object.values(A.S.people)) {
          if (!p.alive || !p.st || A.age(p) < (GD.RACES[p.race].grown || 20)) continue;
          const o = by[p.race] || (by[p.race] = { lv: [], w: [], lift: [], h: [] });
          o.lv.push(A.V2S.leviesOf(p)); o.w.push(A.fightWorth(p)); o.lift.push(A.V2S.stats(p).lift); o.h.push(A.V2S.height(p));
        }
      }
      const med = a => { a = a.slice().sort((x, y) => x - y); return a[a.length >> 1]; }, out = {};
      for (const k in by) out[k] = { n: by[k].lv.length, lv: +med(by[k].lv).toFixed(2), worth: med(by[k].w), lift: Math.round(med(by[k].lift)), h: Math.round(med(by[k].h)) };
      // v2's calibration (tests/v2 'fighting worth'): an ordinary adult giant, and a human master with a breakthrough in order gear
      const H = A.V2.body, avg = { lift: 1, sprint: 1, march: 1, reaction: 1, toughness: 1, liftCeil: 1, sprintCeil: 1, marchCeil: 1, reactionCeil: 1, toughnessCeil: 1, heightZ: 0, build: 1 };
      const mk = (race, age, sk, hrs, cond, gear) => ({ race, sex: 'male', age, genes: Object.assign(H.makeGenes(A.V2.rng.makeRng(5), race, 'male'), avg), body: Object.assign(H.newBody(), { skills: { [sk]: hrs }, cond: Object.assign({ lift: 1, sprint: 1, march: 1, reaction: 1, toughness: 1 }, cond) }), gear });
      const giant = H.fightingWorth(mk('ardan_giant', 60, 'axe', 30, {}, 'club'), 'axe', 'club').worth;
      const hero = H.fightingWorth(mk('ardan_human', 30, 'sword', 12000, { lift: 4, sprint: 1.6, reaction: 1.4, toughness: 3 }, 'order'), 'sword', 'order').worth;
      return { out, giant: +giant.toFixed(1), hero: +hero.toFixed(1) };
    });
    const o = r.out;
    const ok = o.giant.lv > 5 * o.human.lv && o.orc.lv > 1.5 * o.human.lv && o.dwarf.lv > o.human.lv && o.giant.worth > o.human.worth + 20 &&
      o.giant.h > 300 && o.dwarf.h < o.human.h && o.giant.lift > 10 * o.human.lift && r.giant > 12 && r.giant < 30 && r.hero >= r.giant * 0.8;
    return { ok, detail: Object.entries(o).map(([k, v]) => `${k} (${v.n}) ${v.lv} levies, worth ${v.worth}, lift ${v.lift} kg, ${v.h} cm`).join('; ') + `; an ordinary giant ${r.giant} levies, a master human with a breakthrough in order gear ${r.hero}` };
  },

  // every event check goes through A.V2.odds.attempt(): 200 events with checks, one check choice each
  async v2sAttempt(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 34, startAge: 25 });
      const pc = A.pc();
      const ids = Object.keys(A.EV).filter(id => (A.EV[id].choices || []).some(c => c && c.check)).sort();
      const step = Math.max(1, Math.floor(ids.length / 400));
      let tried = 0, routed = 0, missed = [];
      // A.V2.odds is a module namespace (read-only), so count the adapter's calls into it
      const N = A.V2S.N; let calls = 0;
      try {
        for (let i = 0; i < ids.length && tried < 200; i += step) {
          const id = ids[i], q = { type: 'event', ev: id, ctx: {} };
          A.S.queue.unshift(q);
          let v; try { v = A.eventView(q); } catch (e) { v = null; }
          const idx = v && !v.skip ? v.choices.findIndex(vc => vc.i >= 0 && A.EV[id].choices[vc.i] && A.EV[id].choices[vc.i].check) : -1;
          if (idx < 0) { A.S.queue = A.S.queue.filter(x => x !== q); continue; }
          const c0 = N.attempts; tried++;
          try { A.eventChoose(idx); } catch (e) {}
          if (N.attempts === c0 + 1) routed++; else missed.push(id);
          A.S.queue = A.S.queue.filter(x => x !== q);
          if (!pc.alive) { pc.alive = true; pc.health = 80; }
          if (pc.prison) pc.prison = null;
        }
      } finally { calls = N.attempts; }
      return { tried, routed, missed: missed.slice(0, 5), N: A.V2S.N };
    });
    return { ok: r.tried >= 200 && r.routed === r.tried, detail: `${r.routed} of ${r.tried} sampled event checks rolled by attempt()${r.missed.length ? '; missed ' + r.missed.join(', ') : ''}; blunders ${r.N.blunders}, surges ${r.N.surges}, breakthroughs ${r.N.breakthroughs} in ${r.N.attempts} attempts` };
  },

  // attempt() keeps the chance it is given (the first draw decides as A.chance did), and judgment and will matter
  async v2sOddsShape(pg) {
    const r = await pg.evaluate(() => {
      const V = A.V2S, n = 4000, at = (p, pct, m) => { let w = 0; const save = V.minds; V.minds = () => m; try { for (let i = 0; i < n; i++) w += V.attempt(null, pct / 100, { stakes: 0.8 }).success ? 1 : 0; } finally { V.minds = save; } return w / n; };
      const A0 = A.S.rngState;
      const avg = { judgment: 100, will: 100, fatigue: 0, mood: 0 };
      return { p50: at(null, 50, avg), p80: at(null, 80, avg), p20: at(null, 20, avg),
        fool: at(null, 85, { judgment: 60, will: 100, fatigue: 0.6, mood: 0 }), sage: at(null, 85, { judgment: 135, will: 100, fatigue: 0, mood: 0 }),
        weak: at(null, 10, { judgment: 100, will: 70, fatigue: 0, mood: 0 }), iron: at(null, 10, { judgment: 100, will: 140, fatigue: 0, mood: 0 }) };
    });
    const ok = Math.abs(r.p50 - 0.5) < 0.05 && Math.abs(r.p80 - 0.8) < 0.06 && Math.abs(r.p20 - 0.2) < 0.06 && r.fool < r.sage - 0.03 && r.iron > r.weak + 0.02;
    return { ok, detail: `won at 50/80/20: ${r.p50}/${r.p80}/${r.p20}; at 85 a tired fool ${r.fool}, a sage ${r.sage}; at 10 a weak will ${r.weak}, an iron will ${r.iron}` };
  },

  // an old save (no v2 body) migrates once, by percentile: the old stats come out of the body as they went in
  async v2sMigrate(pg) {
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 35, race: 'dwarf', sex: 'F', startAge: 40, status: 'artisan' });
      T.play(2);
      const pc = A.pc();
      delete pc.v2; for (const k in pc.skills) pc.skills[k] = pc.skills[k];
      const enc = await SAVES.encode(A.S, A.J), d = await SAVES.decode(enc.bytes);
      const P = d.S.people[d.S.pc], before = {}; for (const s of GD.STATS) before[s] = P.st[s];
      const real = A.S; A.S = d.S;
      let after, v2, stats0 = {}, stats1 = {};
      try {
        for (const s of GD.STATS) stats0[s] = A.stat(P, s);
        A.V2S.sync(P);
        v2 = P.v2 && { v: P.v2.v, mig: P.v2.mig, lift: P.v2.c.lift };
        after = {}; for (const s of GD.STATS) { after[s] = P.st[s]; stats1[s] = A.stat(P, s); }
        A.V2S.sync(P); var again = GD.STATS.every(s => Math.abs(P.st[s] - after[s]) < 0.02);
      } finally { A.S = real; }
      return { before, after, stats0, stats1, v2, again, tier: A.V2S.tierOf(40).name };
    });
    const drift = Math.max(...Object.keys(r.before).map(s => Math.abs(r.stats1[s] - r.stats0[s])));
    return { ok: !!r.v2 && r.v2.v === 1 && drift <= 1 && r.again, detail: `migrated (v ${r.v2 && r.v2.v}, ${r.v2 && r.v2.mig}): the stats checks read moved by at most ${drift}; ${Object.keys(r.before).map(s => `${s} ${Math.round(r.stats0[s])}->${Math.round(r.stats1[s])}`).join(' ')}; a skill of 40 reads as ${r.tier}` };
  },

  // piety is not everyone's: a commoner has none on the sheet, pinned neutral; taking up the faith brings it back
  async v2sFaith(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 36, startAge: 18, status: 'peasant' });
      const pc = A.pc();
      const no = !A.V2S.hasFaith(pc);
      A.applyFx(pc, { piety: 6 }, {});
      const pinned = pc.piety, pull = A.V2S.pull(pc);
      UI.tab = 'life'; UI.render();
      const side = UI.renderProfile();
      const shows = /Piety/.test(side.replace(/<[^>]+>/g, ' '));
      A.V2S.takeFaith(pc);
      const after = pc.piety, has = A.V2S.hasFaith(pc), side2 = UI.renderProfile();
      return { no, pinned, pull, shows, after, has, shows2: /Piety/.test(side2.replace(/<[^>]+>/g, ' ')), ev: !!A.EV.v2s_seek_faith };
    });
    const ok = r.no && r.pinned === 30 && r.pull === 6 && !r.shows && r.has && r.after === 36 && r.shows2 && r.ev;
    return { ok, detail: `faithless by default ${r.no}; piety +6 kept at ${r.pinned}, pull ${r.pull}; piety on the sheet ${r.shows}; after taking up the faith piety ${r.after}, on the sheet ${r.shows2}` };
  },

  // the sheet speaks in units and words; minds as rarity; skills as tiers with hours
  async v2sSheet(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 37, startAge: 24 });
      T.play(3);
      UI.tab = 'life'; UI.render();
      const h = UI.renderProfile(), t = h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      return { t: t.slice(0, 1600), kg: /lifts \d+ kg/.test(t), ms: /\d+(\.\d)? m\/s/.test(t), km: /km a day/.test(t), react: /\d+ ms/.test(t), mind: /Wits/.test(t), tier: /(Untrained|Novice|Apprentice|Journeyman|Adept|Expert|Master)/.test(t) && /hours/.test(t), oldBars: /Strength \d+|Combat Instincts/.test(t) };
    });
    const ok = r.kg && r.ms && r.km && r.react && r.mind && r.tier && !r.oldBars;
    return { ok, detail: ok ? r.t.slice(r.t.indexOf('Height'), r.t.indexOf('Height') + 520) : JSON.stringify(r).slice(0, 900) };
  },

  // no percentage reaches the player across a played life: events, results, every tab, the profile and skills
  async v2sNoPct(pg) {
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 38, startAge: 16 });
      const found = [], tick = () => new Promise(res => setTimeout(res, 0));
      const scan = async where => {
        await tick();
        const t = document.body.innerText;
        for (const m of t.match(/[^\n]{0,40}\d\s?%[^\n]{0,20}/g) || []) found.push(where + ': ' + m);
        for (const el of document.querySelectorAll('[title],[aria-label]')) { const v = (el.getAttribute('title') || '') + ' ' + (el.getAttribute('aria-label') || ''); if (/\d\s?%/.test(v)) found.push(where + ' (attribute): ' + v.slice(0, 60)); }
      };
      let evs = 0;
      for (let y = 0; y < 12 && A.pc() && A.pc().alive; y++) {
        const end = A.S.year + 1;
        for (let g = 0; g < 100 && A.S.year < end; g++) {
          const rr = A.advance(400); let h, k = 0;
          while ((h = A.headReady()) && k++ < 60) {
            if (h.type === 'event') { UI.ov = null; UI.render(); if (evs < 120) await scan('event ' + h.ev); evs++; A.eventAuto(); UI.render(); if (evs < 120) await scan('result ' + h.ev); }
            else A.skipPrompt();
          }
          if (rr.why === 'dead' || !A.pc() || !A.pc().alive) break;
        }
        if (y % 4 === 3) { for (const tab of T.tabs()) { UI.tab = tab; UI.render(); await scan('tab ' + tab); } for (const ov of ['profile', 'profs']) { try { UI.A.ov(ov); UI.render(); await scan('ov ' + ov); } catch (e) {} } UI.ov = null; UI.tab = 'life'; UI.render(); }
      }
      return { evs, found: [...new Set(found)] };
    });
    return { ok: r.found.length === 0 && r.evs > 20, detail: `${r.evs} scenes and every tab over 12 years: ${r.found.length ? r.found.length + ' percentages, e.g. ' + r.found.slice(0, 6).join(' | ') : 'no percentage on screen'}` };
  },

  // the odds badge on a check choice is words and a tipped balance
  async v2sBadge(pg) {
    const r = await pg.evaluate(async () => {
      A.newGame({ seed: 39, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 30 });
      const ev = Object.values(A.EV).find(e => !e.trigger && (e.choices || []).some(c => c.check) && typeof e.text === 'string' && !/\{/.test(e.text + e.title) && !('_mwOwnSetup' in e ? e._mwOwnSetup : e.setup));
      const q = { type: 'event', ev: ev.id, forced: true, ctx: {} };
      A.S.queue = [q];
      const html = String(UI.eventModal(q) || '');
      const box = document.createElement('div'); box.id = 'v2s-badge-test'; box.innerHTML = html; document.body.appendChild(box);
      await new Promise(res => setTimeout(res, 0));
      const b = [...box.querySelectorAll('button[data-a="evChoose"]')].map(x => x.innerText.replace(/\s+/g, ' ').trim());
      const svg = box.querySelectorAll('button[data-a="evChoose"] .v2-scale').length;
      box.remove(); A.S.queue = [];
      return { id: ev.id, b, svg, digits: /\d+\s?%/.test(html.replace(/<[^>]+>/g, ' ')) };
    });
    const words = /(a certainty|heavily in your favour|in your favour|evenly matched|against you|long odds|hopeless)/;
    const ok = r.svg >= 1 && r.b.some(t => words.test(t)) && !r.b.some(t => /\d\s?%/.test(t)) && !r.digits;
    return { ok, detail: `${r.id}: ${r.b.join(' | ')} (${r.svg} balance icon${r.svg === 1 ? '' : 's'}; digits in the HTML: ${r.digits})` };
  },

  // the fit that puts levies on the game's worth scale still holds, and the duel engine reads the same worth
  async v2sWorthFit(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 77 });
      const xs = [], ys = [], dev = [];
      for (const p of Object.values(A.S.people)) {
        if (!p.alive || p.race !== 'human' || A.age(p) < 16) continue;
        xs.push(Math.log(A.V2S.leviesOf(p))); ys.push(A.V2S.oldWorth(p));
        dev.push(Math.abs(A.fightWorth(p) - Math.round(A.V2S.toWorth(A.V2S.leviesOf(p)))));
      }
      const m = a => a.reduce((x, y) => x + y, 0) / a.length, mx = m(xs), my = m(ys);
      let c = 0, vx = 0, vy = 0; for (let i = 0; i < xs.length; i++) { c += (xs[i] - mx) * (ys[i] - my); vx += (xs[i] - mx) ** 2; vy += (ys[i] - my) ** 2; }
      return { n: xs.length, r: c / Math.sqrt(vx * vy), dev: Math.max(...dev) };
    });
    return { ok: r.r > 0.75 && r.dev <= 1, detail: `${r.n} humans: r = ${r.r.toFixed(3)} between ln levies and the release's worth; A.fightWorth is the v2 worth within ${r.dev}` };
  },
};
