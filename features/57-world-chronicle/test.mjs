// The world record (57-world-chronicle): a dated record of the whole run, of more than ten kinds, with a place and
// people on every entry and nothing dropped (W5); events that cite it, and only entries the character could know of
// (W6); the record changes nothing in the world; the Annals page and "The world in your time" in the Chronicle export.
const SETUP = () => {
  window.WCT = {
    // play on, answering every scene by the engine's own auto choice; the player cannot die of it
    years(n, opts = {}) {
      const end = A.S.year + n;
      for (let g = 0; g < 9000 && A.S.year < end; g++) {
        A.advance(opts.step || 400);
        let h, k = 0;
        while ((h = A.headReady()) && k++ < 500) {
          if (h.type === 'event') { const v = A.eventView(h); if (opts.onEvent) opts.onEvent(h, v); A.eventAuto(); } else A.S.queue.shift();
        }
        const pc = A.pc();
        if (opts.keep !== false && !pc.alive) { pc.alive = true; pc.health = 80; }
        if (opts.each) opts.each();
        if (!pc.alive) return 'dead';
      }
      return 'ok';
    },
    raw: /\{[A-Za-z0-9_.]+\}/,
    words: s => (String(s || '').match(/\S+/g) || []).length,
  };
};

export default {
  async wcRecordWhole(pg) {
    // W5: sixty years of the world, kept whole: every kind, the oldest entry still there, a place and people on each
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      const R0 = A.S.wrec, first = JSON.stringify(R0.e[0]);
      let shrank = 0, n = 0, snap10 = null;
      WCT.years(60, { each: () => { const m = A.S.wrec.e.length; if (m < n) shrank++; n = m; if (!snap10 && A.S.year >= 1115) snap10 = JSON.stringify(A.S.wrec.e.slice(0, 200)); } });
      const R = A.S.wrec, by = {};
      for (const e of R.e) by[e[0]] = (by[e[0]] || 0) + 1;
      const bad = R.e.filter(e => e[3] == null && !e[4]).length, nobody = R.e.filter(e => !(e[6] || []).some(id => A.WC.name(id))).length;
      const lines = R.e.map((_, i) => A.WC.line(A.WC.ent(i)));
      const broken = lines.filter(l => /undefined|NaN|\{|null/.test(l) || !/^In \w+ \d{3,4}, /.test(l));
      const dated = R.e.filter(e => !(e[1] >= 1000) || !(e[2] >= 0 && e[2] <= 364)).length;
      return { year: A.S.year, n: R.e.length, by, kinds: Object.keys(by).length, firstKept: JSON.stringify(R.e[0]) === first, first: lines[0],
        tenKept: snap10 === JSON.stringify(R.e.slice(0, 200)), shrank, bad, nobody, dated, broken: broken.slice(0, 3), nBroken: broken.length,
        kb: Math.round(JSON.stringify(R).length / 1024), stateKb: Math.round(JSON.stringify(A.S).length / 1024), names: Object.keys(R.nm).length, json: JSON.stringify(R),
        news: A.S.news.length, oldestNews: A.S.news.length ? A.S.news[A.S.news.length - 1].y : null, history: A.S.history.length };
    });
    // gzipped, as a save is
    r.gzKb = await pg.evaluate(async j => { const s = new Blob([j]).stream().pipeThrough(new CompressionStream('gzip')); return Math.round((await new Response(s).arrayBuffer()).byteLength / 1024); }, r.json);
    delete r.json;
    const ok = r.kinds >= 10 && r.firstKept && r.tenKept && !r.shrank && !r.bad && !r.nobody && !r.dated && !r.nBroken;
    return { ok, data: r, detail: `${r.year}: ${r.n} entries of ${r.kinds} kinds (${Object.entries(r.by).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}); ` +
      `the first entry (${r.first}) and the first 200 as they stood in 1115 are still there: ${r.firstKept && r.tenKept}; never shrank: ${!r.shrank}; ` +
      `without a place ${r.bad}, without a named person ${r.nobody}, undated ${r.dated}, lines that do not read ${r.nBroken}${r.broken.length ? ' e.g. ' + r.broken[0] : ''}; ` +
      `${r.kb} KB of JSON, ${r.gzKb} KB gzipped (${r.names} names), in a ${r.stateKb} KB state. Beside it the news keeps ${r.news} lines back to ${r.oldestNews}, the release's history ${r.history}` };
  },

  async wcObservesOnly(pg) {
    // the record watches; it does not act: with the epidemic off, the same seed reaches the same world with recording
    // on or off (the pack's scenes are held back in both, since they only exist where there is a record)
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      // features that read the record (64-npc-beliefs seeds beliefs from its battles) are held back too: they act on
      // what the record says, which is their business; this test is about whether recording itself changes anything
      const chron = A.C.chron, ep = A.WC.EPIDEMIC, NB = A.NPCB, seed = NB && NB.seedBattles;
      const run = off => {
        A.WC.OFF = off; A.WC.EPIDEMIC = false; A.C.chron = () => false; if (NB) NB.seedBattles = () => {};
        try {
          A.newGame({ seed: 9090, race: 'human', realm: 'POL-05', status: 'merchant', sex: 'F', startAge: 20 });
          WCT.years(12);
          return { h: T.hash(A.S.realms) + ':' + T.hash(A.S.people) + ':' + T.hash(A.S.prov.map(P => [P.owner, P.occ, P.unrest])) + ':' + A.rngState, n: A.S.wrec ? A.S.wrec.e.length : 0 };
        } finally { A.WC.OFF = false; A.WC.EPIDEMIC = ep; A.C.chron = chron; if (NB) NB.seedBattles = seed; }
      };
      const on = run(false), off = run(true);
      return { same: on.h === off.h, on: on.n, off: off.n };
    });
    return { ok: r.same && r.on > 100 && r.off === 0, detail: `12 years with the record (${r.on} entries) and without it (${r.off}): ${r.same ? 'the same world, people and random stream' : 'the worlds DIFFER'}` };
  },

  async wcCitesShare(pg) {
    // W6: the share of a life's scenes that cite a dated entry, and that each one is possible where and when it is told
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const mixes = [['human', 'POL-01', 'peasant'], ['human', 'POL-05', 'merchant'], ['elf', 'POL-03', 'peasant'], ['dwarf', 'POL-20', 'artisan'],
        ['orc', 'POL-11', 'peasant'], ['human', 'POL-02', 'noble'], ['human', 'POL-07', 'serf'], ['human', 'POL-14', 'artisan']];
      const lives = [], wrong = [], sample = [];
      for (let i = 0; i < mixes.length; i++) {
        const [race, realm, status] = mixes[i];
        A.newGame({ seed: 700 + i * 31, race, realm, status, sex: i % 2 ? 'F' : 'M', startAge: 16 });
        const L = { race, realm, status, seen: 0, cite: 0, line: 0, pack: 0, token: 0, canon: 0, raw: 0 };
        WCT.years(60, { keep: false, onEvent: (q, v) => {
          if (v.skip) return;
          L.seen++;
          if (WCT.raw.test(`${v.title} ${v.text} ${v.recall || ''}`)) L.raw++;
          if (!A.WC.cites(q)) return;
          L.cite++;
          if (v.recall) L.line++; else if (/^wc_/.test(q.ev)) L.pack++; else L.token++;
          const pc = A.pc(), realms = A.WC.nearRealms(pc), provs = A.WC.nearProvs(pc), own = new Set([pc.realm, (A.prov(pc.home) || {}).owner]);
          for (const id of v.cites) {
            const c = A.WC.cite(id);
            if (!c) { wrong.push(id + ' missing'); continue; }
            if (c.c) { L.canon++; if (!c.c.realms.some(x => own.has(x)) || c.y >= A.S.year) wrong.push(`${q.ev}: canon ${c.ref} for ${pc.realm}`); continue; }
            const e = c.e, here = (e.p != null && provs.has(e.p)) || realms.has(e.a) || realms.has(e.b);
            // told after it happened (or, for a sickness at the door, as it happens), and not before the teller was born
            const when = e.y >= (pc.born || 0) && e.y * 365 + e.d <= A.absDay();
            if (!here || !when) wrong.push(`${q.ev}: ${A.WC.line(e)} (born ${pc.born}, ${A.S.year}, ${pc.realm})`);
          }
          if (sample.length < 12 && v.recall) sample.push(v.recall);
        } });
        L.years = A.S.year - 1105; L.pct = Math.round(1000 * L.cite / Math.max(1, L.seen)) / 10;
        lives.push(L);
      }
      return { lives, wrong: wrong.slice(0, 5), nWrong: wrong.length, sample };
    });
    const seen = r.lives.reduce((a, l) => a + l.seen, 0), cite = r.lives.reduce((a, l) => a + l.cite, 0), pct = Math.round(1000 * cite / seen) / 10;
    const sum = k => r.lives.reduce((a, l) => a + l[k], 0), raw = sum('raw');
    const pcts = r.lives.map(l => l.pct).sort((a, b) => a - b), med = (pcts[3] + pcts[4]) / 2;
    return { ok: pct >= 15 && med >= 12 && !r.nWrong && !raw, data: r, detail: `${r.lives.length} lives (${r.lives.map(l => `${l.race} ${l.status} ${l.years}y ${l.pct}%`).join(', ')}): ` +
      `${cite} of ${seen} scenes cite a dated entry, ${pct}% (median life ${med}%); by a recalled line ${sum('line')}, a scene of the pack ${sum('pack')}, a token ${sum('token')}; ` +
      `${sum('canon')} of the citations are canon. Citations outside the character's place or time: ${r.nWrong}${r.wrong.length ? ' e.g. ' + r.wrong.slice(0, 3).join(' | ') : ''}; raw tokens ${raw}. ` +
      `e.g. "${r.sample[0] || ''}"` };
  },

  async wcTokens(pg) {
    // any event may write {since_event} or {last_war}: filled from an entry near the character, the same one in the text
    // and the result; with nothing to cite the engine drops the scene
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      A.defEvents([{ id: 'wct_probe', title: 'A probe', trigger: true, cond: (p, C) => C.adult(p),
        text: 'Nothing has been the same {since_event}. The old men talk of {last_war}, fought in {last_war_year}.',
        choices: [{ t: 'Agree', r: 'Yes, {last_war}.', fx: {} }, { t: 'Disagree', r: 'No.', fx: {} }] }]);
      const view = () => { A.S.queue.unshift({ type: 'event', ev: 'wct_probe' }); const q = A.S.queue[0], v = A.eventView(q); return { q, v }; };
      // an empty world with no canon: dropped
      A.newGame({ seed: 31, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      const canon = A.WC.canon; A.WC._canon = []; A.WC._canonById = {};
      const empty = view().v.skip;
      A.S.queue.shift(); delete A.WC._canon;
      WCT.years(25);
      const { q, v } = view();
      A.eventChoose(0);
      const res = q.result && q.result.text, pc = A.pc();
      const ids = v.cites || [], cs = ids.map(id => A.WC.cite(id)).filter(Boolean);
      const near = cs.every(c => c.c ? c.c.realms.includes(pc.realm) || c.c.realms.includes((A.prov(pc.home) || {}).owner) : (A.WC.nearRealms(pc).has(c.e.a) || A.WC.nearRealms(pc).has(c.e.b) || A.WC.nearProvs(pc).has(c.e.p)));
      const war = cs.find(c => c.k === 'war' || c.k === 'peace');
      A.WC.canon = canon;
      return { empty, skip: v.skip, text: v.text, res, n: cs.length, near, same: !!war && res.includes(war.ref) && v.text.includes(war.ref) };
    });
    return { ok: r.empty && !r.skip && r.n >= 2 && r.near && r.same, detail: `nothing to cite: dropped ${r.empty}; after 25 years: "${r.text}" / result "${r.res}"; ${r.n} entries cited, all near: ${r.near}, the same war in text and result: ${r.same}` };
  },

  async wcAnnalsPage(pg) {
    // the World tab's Annals: paged, filtered, escaped, and drawing it changes nothing
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 77, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 20 });
      WCT.years(20);
      const R = A.S.wrec, pid = R.e.find(e => e[0] === 'ruler')[6][0];
      R.nm[pid] = '<img src=x onerror=alert(1)>Hostile';
      const rng = A.rngState, h0 = T.hash(A.S);
      UI.tab = 'world'; UI.worldView = 'news'; UI.render();
      const btn = !!document.querySelector('[data-a="wview"][data-v="annals"]');
      UI.A.wview('annals');
      const body = () => document.querySelector('#tabbody').innerHTML;
      const p1 = body(), rows1 = document.querySelectorAll('.wc-entry').length;
      UI.A.wcPage(1); const p2 = body();
      UI.A.wcGroup('want'); const want = [...document.querySelectorAll('.wc-entry')].map(x => x.textContent);
      UI.A.wcGroup('all'); UI.A.wcNear('1'); const nearRows = document.querySelectorAll('.wc-entry').length;
      UI.A.wcNear('0'); UI.A.wcGroup('crown');
      const crown = body();
      const out = { btn, rows1, paged: p1 !== p2 && p2.includes('Page 2 of'), want: want.length, wantOk: want.every(t => /harvest failed|broke out/.test(t)), nearRows,
        escaped: !crown.includes('<img src=x') && crown.includes('&lt;img'), pure: A.rngState === rng && T.hash(A.S) === h0, n: R.e.length };
      UI.worldView = 'map'; UI.tab = 'life'; UI.render();
      return out;
    });
    return { ok: r.btn && r.rows1 === 40 && r.paged && r.want > 0 && r.wantOk && r.nearRows > 0 && r.escaped && r.pure,
      detail: `Annals button ${r.btn}; ${r.n} entries, ${r.rows1} on a page, page 2 differs ${r.paged}; hunger and sickness ${r.want} rows (${r.wantOk ? 'all of that kind' : 'MIXED'}); near you ${r.nearRows}; a hostile name escaped ${r.escaped}; drawing is pure ${r.pure}` };
  },

  async wcExportLegends(pg) {
    // Replayability 5: the Chronicle's export gains "The world in your time", the run's great entries in prose
    await pg.evaluate(SETUP);
    if (!(await pg.evaluate(() => typeof A.chronicleText === 'function'))) return { ok: true, detail: 'skipped: 22-chronicle is not in this build (the section wraps its export)' };
    const r = await pg.evaluate(() => {
      T.enter({ seed: 5150, race: 'human', realm: 'POL-02', status: 'artisan', sex: 'M', startAge: 16 });
      WCT.years(50, { keep: false });
      const text = A.chronicleText(), at = text.indexOf('THE WORLD IN YOUR TIME'), part = at >= 0 ? text.slice(at) : '';
      const words = WCT.words(part), decades = (part.match(/^The years? \d{4}/gm) || []).length;
      const rng = A.rngState, h0 = T.hash(A.S);
      UI.tab = 'book'; UI.render();
      const html = document.querySelector('#tabbody').innerHTML;
      const pure = A.rngState === rng && T.hash(A.S) === h0;
      UI.tab = 'life'; UI.render();
      const wars = A.S.wrec.e.filter(e => e[0] === 'war').length;
      return { at, words, decades, raw: WCT.raw.test(part), bad: /undefined|NaN|null/.test(part), shown: html.includes('The world in your time'), pure, sample: part.slice(0, 600), lives: words, wars,
        life: WCT.words(text.slice(0, at)) };
    });
    const ok = r.at > 0 && r.words >= 400 && r.decades >= 4 && !r.raw && !r.bad && r.shown && r.pure;
    return { ok, detail: `the export has the section: ${r.at > 0}, ${r.words} words over ${r.decades} decades (the life itself ${r.life} words); raw tokens ${r.raw}, broken words ${r.bad}; on the Book page ${r.shown}; pure ${r.pure}. It opens: ${r.sample.replace(/\n+/g, ' / ').slice(0, 300)}` };
  },

  async wcExportDownload(pg) {
    // the export action: the downloaded file carries the world's section
    await pg.evaluate(SETUP);
    if (!(await pg.evaluate(() => !!(UI.A.chronicleExport && A.chronicleText)))) return { ok: true, detail: 'skipped: 22-chronicle is not in this build' };
    await pg.evaluate(() => { T.enter({ seed: 61, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 18 }); WCT.years(15); A.S.queue = []; UI.ov = null; UI.tab = 'book'; UI.render(); });
    // the button's own action (22-chronicle's test clicks the button itself; the page's ink animations keep it moving)
    const dl = pg.waitForEvent('download', { timeout: 30000 }).catch(e => null);
    await pg.evaluate(() => UI.A.chronicleExport());
    const d = await dl, fs = await import('node:fs');
    if (!d) return { ok: false, detail: 'no download' };
    const p = await d.path(), txt = p ? fs.readFileSync(p, 'utf8') : '';
    return { ok: txt.includes('THE WORLD IN YOUR TIME') && txt.includes('THE CHRONICLE OF ARDAN'), detail: `downloaded ${d.suggestedFilename()}, ${txt.length} characters, the world's section ${txt.includes('THE WORLD IN YOUR TIME')}` };
  },

  async wcOldSave(pg) {
    // a save from before the record loads, and the record starts from there; a save with it round-trips exactly
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(async () => {
      A.newGame({ seed: 12, race: 'dwarf', realm: 'POL-20', status: 'artisan', sex: 'M', startAge: 20 });
      WCT.years(3);
      const S = JSON.parse(A.serialize()); delete S.wrec;
      A.deserialize(S);
      let err = null;
      try { WCT.years(4); } catch (e) { err = String(e); }
      const n = A.S.wrec ? A.S.wrec.e.length : 0;
      const enc = await SAVES.encode(A.S, A.J), d = await SAVES.decode(enc.bytes);
      return { err, n, same: JSON.stringify(d.S.wrec) === JSON.stringify(A.S.wrec), kb: Math.round(enc.bytes.length / 1024) };
    });
    return { ok: !r.err && r.n > 5 && r.same, detail: `an old save played 4 more years: ${r.err || 'no error'}, ${r.n} entries since; the record round-trips through a save: ${r.same} (${r.kb} KB gzipped)` };
  },

  async wcEpidemic(pg) {
    // the epidemic (the release has none): how often across Ardan, and the scene it brings to a player's town
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4243, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
      WCT.years(40);
      const R = A.S.wrec, pl = R.e.filter(e => e[0] === 'plague'), fam = R.e.filter(e => e[0] === 'famine');
      const realms = Object.values(A.S.realms).filter(x => !x.isRebel).length;
      // force one into the player's home: the scene comes
      const pc = A.pc(), chance = A.WC.plagueChance;
      A.WC.plagueChance = r => (r.id === (A.prov(pc.home) || {}).owner ? 12 : 0);
      const P = A.prov(pc.home); P.adj = P.adj || [];
      const wp = A.wpick; A.wpick = (arr, f) => (arr.some(x => x && x.id === pc.home) ? arr.find(x => x.id === pc.home) : wp(arr, f));
      let queued = false;
      try { for (let i = 0; i < 2 && !queued; i++) { A.advance(31); queued = A.S.queue.some(q => q.ev === 'wc_sickness_comes'); } } finally { A.WC.plagueChance = chance; A.wpick = wp; }
      const q = A.S.queue.find(x => x.ev === 'wc_sickness_comes'), v = q && A.eventView(q);
      return { n: pl.length, fam: fam.length, realms, perRealm20: Math.round(100 * pl.length / realms / 2) / 100, famPer20: Math.round(100 * fam.length / realms / 2) / 100, queued, text: v ? v.text : '', skip: v ? v.skip : null };
    });
    return { ok: r.n > 0 && r.queued && r.skip === false && !/\{/.test(r.text), detail: `40 years: ${r.n} epidemics (${r.perRealm20} per realm per 20 years) and ${r.fam} famines (${r.famPer20}) over ${r.realms} realms; struck at home, the scene comes: ${r.queued}: "${r.text}"` };
  },

  async wcScenesRender(pg) {
    // every scene of the pack, from lives 30 years into a run (so run entries, not only canon): no raw token, none over
    // 80 words, labels of 12 words or fewer, and each choice resolves
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const ids = Object.keys(A.EV).filter(id => /^wc_/.test(id)), shown = {}, bad = [];
      const people = [['human', 'POL-01', 'noble', 30], ['human', 'POL-05', 'peasant', 8], ['human', 'POL-02', 'artisan', 40], ['orc', 'POL-11', 'peasant', 25], ['human', 'POL-07', 'serf', 9]];
      for (const [race, realm, status, age] of people) {
        A.newGame({ seed: 515, race, realm, status, sex: 'M', startAge: Math.max(1, age - 30) });
        WCT.years(30);
        // thirty years of world, and a character of the age wanted (a child for the children's scenes)
        const pc = A.pc(); pc.alive = true; pc.literate = true; if (age < 14) pc.born = A.S.year - age;
        const base = A.serialize();
        for (const id of ids) {
          const e = A.EV[id];
          for (const soldier of [false, true]) {
            A.deserialize(JSON.parse(base));
            if (soldier) { const p2 = A.pc(); if (!p2.mil) continue; }
            if (e.cond && !e.cond(A.pc(), A.C) && !e.trigger) continue;
            A.S.queue = [];
            const ctx = id === 'wc_sickness_comes' ? { wci: A.S.wrec.e.findIndex(x => x[0] === 'plague') } : {};
            const q = { type: 'event', ev: id, ctx }; A.S.queue.unshift(q);
            const v = A.eventView(q);
            if (v.skip) continue;
            shown[id] = (shown[id] || 0) + 1;
            const all = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
            if (/\{[A-Za-z0-9_.]+\}|undefined|NaN/.test(all)) bad.push(`${id}: ${all.slice(0, 120)}`);
            if (WCT.words(v.text) > 80) bad.push(`${id}: ${WCT.words(v.text)} words`);
            for (const c of v.choices) if (WCT.words(c.t) > 12) bad.push(`${id}: label ${c.t}`);
            try { A.eventChoose(0); const t = q.result && q.result.text; if (/\{[A-Za-z0-9_.]+\}/.test(t || '')) bad.push(`${id}: result ${t}`); } catch (err) { bad.push(`${id}: ${err.message}`); }
          }
        }
      }
      return { ids: ids.length, shown, bad: bad.slice(0, 5), nBad: bad.length };
    });
    const n = Object.keys(r.shown).length;
    // some scenes need what only other features make (a famine needs 45-economy, a Legend 32-ladder) or a rare event
    return { ok: !r.nBad && n >= 8, detail: `${n} of ${r.ids} scenes drawn from lives 30 years in (${Object.entries(r.shown).map(([k, v]) => `${k.replace('wc_', '')} ${v}`).join(', ')}); problems ${r.nBad}${r.bad.length ? ': ' + r.bad.join('; ') : ''}` };
  },
};
