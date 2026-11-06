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
  async warNamesUnique(pg) {
    // world review cycle 2, B5: a second war of the same name is "The Second ...", in the Known World too
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4406, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      A.S.queue.length = 0;
      A.startWar('POL-02', 'POL-03', 'The Long War', 'rivalry', { noAllies: true });
      A.startWar('POL-05', 'POL-06', 'The Long War', 'rivalry', { noAllies: true });
      A.startWar('POL-07', 'POL-08', 'The War of the Tessaria Succession', 'throne', { noAllies: true });
      A.startWar('POL-09', 'POL-10', 'The War of the Tessaria Succession', 'throne', { noAllies: true });
      return A.S.wars.map(w => w.name).slice(-4);
    });
    const ok = r[0] === 'The Long War' && r[1] === 'The Second Long War' && r[3] === 'The Second War of the Tessaria Succession';
    return { ok, detail: r.join('; ') };
  },

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
      // features that read the record (64-npc-beliefs seeds beliefs from its battles; 9991-atlas hears of places from its
      // news) are held back too: they act on what the record says, which is their business; this test is about whether
      // recording itself changes anything (with the atlas on, only pc.atlas differs: realms, provinces and the stream match)
      const chron = A.C.chron, ep = A.WC.EPIDEMIC, NB = A.NPCB, seed = NB && NB.seedBattles, AT = A.ATLAS, atOff = AT && AT.OFF;
      const run = off => {
        A.WC.OFF = off; A.WC.EPIDEMIC = false; A.C.chron = () => false; if (NB) NB.seedBattles = () => {}; if (AT) AT.OFF = true;
        try {
          A.newGame({ seed: 9090, race: 'human', realm: 'POL-05', status: 'merchant', sex: 'F', startAge: 20 });
          WCT.years(12);
          return { h: T.hash(A.S.realms) + ':' + T.hash(A.S.people) + ':' + T.hash(A.S.prov.map(P => [P.owner, P.occ, P.unrest])) + ':' + A.rngState, n: A.S.wrec ? A.S.wrec.e.length : 0 };
        } finally { A.WC.OFF = false; A.WC.EPIDEMIC = ep; A.C.chron = chron; if (NB) NB.seedBattles = seed; if (AT) AT.OFF = atOff; }
      };
      const on = run(false), off = run(true);
      return { same: on.h === off.h, on: on.n, off: off.n };
    });
    return { ok: r.same && r.on > 100 && r.off === 0, detail: `12 years with the record (${r.on} entries) and without it (${r.off}): ${r.same ? 'the same world, people and random stream' : 'the worlds DIFFER'}` };
  },

  async wcRecallYieldsToVoice(pg) {
    // the regression under wcObservesOnly (CI run 88): a card carries one extra line, and a recalled line used to push
    // the life's inner voice (9992-identity) out; the life remembers each voice line it hears (pc.idv), so whether the
    // record had an entry to recall decided what the character had heard. The recalled line now gives way: on every
    // card the voice that speaks is the one that would speak with no recalled line, and the record still recalls.
    // To meet the case often, every scene with a subject is offered a recalled line here (WC.RECALL 100, put back after);
    // the first life is the one wcObservesOnly plays, with the record off, where the canon alone is recalled.
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const ID = A.ID; if (!ID || typeof ID.voiceCore !== 'function') return { none: true };
      let cards = 0, recalls = 0, voices = 0, both = 0;
      const silenced = [], share = A.WC.RECALL;
      A.WC.RECALL = 100;
      try {
        for (const [seed, status, realm, age, off] of [[9090, 'merchant', 'POL-05', 20, true], [9090, 'merchant', 'POL-05', 20, false], [4242, 'peasant', 'POL-01', 18, false], [811, 'artisan', 'POL-03', 18, false]]) {
          A.WC.OFF = off;
          A.newGame({ seed, race: 'human', realm, status, sex: seed % 2 ? 'M' : 'F', startAge: age });
          WCT.years(8, { onEvent: (q, v) => {
            if (v.skip) return;
            cards++;
            const vo = ID.voiceCore(A.pc(), q);
            if (vo) voices++;
            if (!v.recall) return;
            recalls++;
            if (vo) both++;
            // the voice with the recalled line taken away (put back at once: the card is not changed)
            const line = v.recall; delete v.recall;
            let bare = null; try { bare = ID.voiceCore(A.pc(), q); } finally { v.recall = line; }
            if (bare) silenced.push(`${A.S.year} ${q.ev}: "${bare.line}" silenced by "${line}"`);
          } });
        }
      } finally { A.WC.RECALL = share; A.WC.OFF = false; }
      return { cards, recalls, voices, both, silenced };
    });
    if (r.none) return { ok: true, detail: 'no inner voice in this build' };
    const ok = r.cards > 200 && r.recalls > 0 && r.voices > 0 && !r.both && !r.silenced.length;
    return { ok, detail: `${r.cards} cards over four lives of 8 years: ${r.recalls} with a recalled line, ${r.voices} with an inner voice, ${r.both} with both; ` +
      `voices a recalled line silenced: ${r.silenced.length}${r.silenced.length ? ' e.g. ' + r.silenced[0] : ''}` };
  },

  async wcCitesShare(pg) {
    // W6: scenes cite dated entries, and each one is possible where and when it is told.
    // Changed for v2: W6 asked for 15% or more of a life's scenes to cite an entry, and almost all of them were the
    // recalled line under a scene ("the world remembers..."): about 17% of cards carried one. The owner's complaint 1
    // (V2_SPEC: everything on one card, no filler) and playtest 1 #10 ("every card carries filler") ask for extra lines
    // to be rare and to fit the scene, one at most on a card. So the bar is now the other way round: a recalled line on
    // fewer than 1 card in 10 over a played life (overall and in the median life, no life above 12%), each one about an
    // entry that bears on the scene (a person, the home or a named place, a named realm, or the war of the scene), never
    // beside counsel or a memory; citations must still happen (by line, token or pack). Kept: no citation outside the
    // character's place or time, no raw token.
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
          if (v.recall) {
            // the recalled line bears on the scene: read here from the entry and the scene's own words and context
            const pc = A.pc(), c = A.WC.cite(v.recallId), text = `${v.title || ''} ${v.text || ''}`, ctx = q.ctx || {};
            const vals = new Set(Object.values(ctx).filter(x => typeof x === 'string'));
            const named = id => { const r = A.realm(id); return !!r && [r.short, r.name].some(s => s && s.length > 3 && text.includes(s.replace(/^the /i, ''))); };
            let fits = false;
            if (c && c.c) fits = c.c.realms.some(id => vals.has(id) || named(id)) || (!!c.c.who && text.includes(c.c.who));
            else if (c && c.e) {
              const e = c.e, P = e.p != null && A.S.prov[e.p], wid = Array.isArray(e.x) ? (e.k === 'battle' ? e.x[2] : e.x[0]) : e.x;
              fits = (e.w || []).some(id => id && (id === pc.id || vals.has(id) || (A.WC.name(id) && text.includes(A.WC.name(id).split(' ').slice(-2).join(' '))))) ||
                e.p === pc.home || (!!P && P.name.length > 3 && text.includes(P.name.replace(/^The /, ''))) ||
                [e.a, e.b].some(id => id && (vals.has(id) || named(id))) ||
                (!!wid && (vals.has(wid) || (!!pc.mil && (A.atWar(pc.mil.realm || pc.realm) || []).some(w => w === wid || (w && w.id) === wid))));
            }
            if (!fits) wrong.push(`${q.ev}: recalled "${v.recall}" does not bear on "${v.title}"`);
            if ((v.adv && v.adv.length) || (ctx.mw && !ctx.mw.off && ctx.mw.ev === q.ev)) wrong.push(`${q.ev}: a recalled line beside counsel or a memory`);
            L.recall = (L.recall || 0) + 1;
          }
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
        L.recall = L.recall || 0; L.rpct = Math.round(1000 * L.recall / Math.max(1, L.seen)) / 10;
        lives.push(L);
      }
      return { lives, wrong: wrong.slice(0, 5), nWrong: wrong.length, sample };
    });
    const seen = r.lives.reduce((a, l) => a + l.seen, 0), cite = r.lives.reduce((a, l) => a + l.cite, 0), pct = Math.round(1000 * cite / seen) / 10;
    const sum = k => r.lives.reduce((a, l) => a + l[k], 0), raw = sum('raw');
    const pcts = r.lives.map(l => l.pct).sort((a, b) => a - b), med = (pcts[3] + pcts[4]) / 2;
    const rec = sum('recall'), rpct = Math.round(1000 * rec / seen) / 10, rp = r.lives.map(l => l.rpct).sort((a, b) => a - b), rmed = (rp[3] + rp[4]) / 2, rmax = rp[rp.length - 1];
    return { ok: rpct < 10 && rmed < 10 && rmax <= 12 && rec > 0 && cite > 0 && !r.nWrong && !raw, data: r, detail: `${r.lives.length} lives (${r.lives.map(l => `${l.race} ${l.status} ${l.years}y ${l.pct}% cite, ${l.rpct}% recalled`).join(', ')}): ` +
      `a recalled line on ${rec} of ${seen} cards, ${rpct}% (median life ${rmed}%, most ${rmax}%); ` +
      `${cite} of ${seen} scenes cite a dated entry, ${pct}% (median life ${med}%); by a recalled line ${sum('line')}, a scene of the pack ${sum('pack')}, a token ${sum('token')}; ` +
      `${sum('canon')} of the citations are canon. Citations outside the character's place or time, or lines that do not bear on their scene: ${r.nWrong}${r.wrong.length ? ' e.g. ' + r.wrong.slice(0, 3).join(' | ') : ''}; raw tokens ${raw}. ` +
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
      // a life long enough to see decades of the world (a shifted random stream can end one at 18): the first that lives 30 years
      let seed = 5150;
      for (; seed < 5160; seed++) {
        T.enter({ seed, race: 'human', realm: 'POL-02', status: 'artisan', sex: 'M', startAge: 16 });
        const y0 = A.S.year; WCT.years(50, { keep: false });
        if (A.S.year - y0 >= 30) break;
      }
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
      // what the forced roll saw of its realm, in the rebel strike: the regression has to reach the roll as a rebel
      let sawRebel = null, inRebel = false;
      A.WC.plagueChance = r => { const v = r.id === (A.prov(pc.home) || {}).owner ? 12 : 0; if (v && inRebel) sawRebel = !!r.isRebel; return v; };
      const P = A.prov(pc.home); P.adj = P.adj || [];
      const wp = A.wpick; A.wpick = (arr, f) => (arr.some(x => x && x.id === pc.home) ? arr.find(x => x.id === pc.home) : wp(arr, f));
      let queued = false;
      // whatever 40 years left waiting is answered first, and other scenes are stepped past while the month turns, or
      // A.advance stops on them before the epidemic's month comes (80-callbacks' events were enough to do it)
      const clearOthers = () => { A.S.queue = A.S.queue.filter(q => q.ev === 'wc_sickness_comes'); };
      clearOthers();
      const strike = () => { let got = false; for (let i = 0; i < 6 && !got; i++) { A.advance(31); got = A.S.queue.some(q => q.ev === 'wc_sickness_comes'); if (!got) clearOthers(); } return got; };
      let q, v, rebelQueued = null;
      const base = A.serialize(), found = A.EF && A.EF.found;
      try {
        queued = strike();
        q = A.S.queue.find(x => x.ev === 'wc_sickness_comes'); v = q && A.eventView(q);
        // CI run 88: the player's home was held by a rebel league after 40 years, and rebel-held land never sickened, so
        // the scene never came. From the same day again (a scene seen is not shown twice inside 240 days), with the
        // home's holder a rebel realm, the scene still comes
        A.deserialize(JSON.parse(base));
        const own = A.realm((A.prov(A.pc().home) || {}).owner);
        // 03-engine-fixes founds any rebel realm at peace each month (EF.found clears isRebel) before the roll, so a
        // home holder at peace made a rebel here was a crown again by the time it was rolled, and this passed on the old
        // code too (the verifier's finding). Founding is held off for the strike, and the roll must see a rebel.
        if (own) { own.isRebel = true; if (A.EF && found) A.EF.found = () => false; inRebel = true; clearOthers(); rebelQueued = strike(); }
      } finally { A.WC.plagueChance = chance; A.wpick = wp; if (A.EF && found) A.EF.found = found; inRebel = false; }
      return { n: pl.length, fam: fam.length, realms, perRealm20: Math.round(100 * pl.length / realms / 2) / 100, famPer20: Math.round(100 * fam.length / realms / 2) / 100, queued, rebelQueued, sawRebel, text: v ? v.text : '', skip: v ? v.skip : null };
    });
    return { ok: r.n > 0 && r.queued && r.rebelQueued === true && r.sawRebel === true && r.skip === false && !/\{/.test(r.text), detail: `40 years: ${r.n} epidemics (${r.perRealm20} per realm per 20 years) and ${r.fam} famines (${r.famPer20}) over ${r.realms} realms; struck at home, the scene comes: ${r.queued}; under a rebel holder too: ${r.rebelQueued} (the roll saw a rebel: ${r.sawRebel}): "${r.text}"` };
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
  async wcRecallLinesRead(pg) {
    // the writer's pass: every recalled line of every kind, drawn with plain words, is a whole sentence (a capital first,
    // a full stop last, no unfilled token, "a"/"an" right, no "The" inside a sentence) and short enough to sit under a
    // scene; every kind the record keeps has at least two lines, so a kind does not repeat itself every time
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 5701, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      const x = { y: 1120, P: 'the Bleakfold', A: 'Aldmark', B: 'the Horde', who: 'King Roderic', war: 'the Red War', dead: '3,400', days: 40, fell: true, how: 2, free: false,
        sick: 'the spotted fever', Sick: 'The spotted fever', order: 'the Stormriders', ref: 'the death of King Roderic in 1092' };
      const bad = [], kinds = {};
      let n = 0;
      for (const k of Object.keys(A.WC.LINES)) {
        kinds[k] = A.WC.LINES[k].length;
        for (const how of [0, 2, 3]) for (const fell of [true, false]) for (const free of [true, false]) for (const [, f] of A.WC.LINES[k]) {
          const s = f(Object.assign({}, x, { how, fell, free }));
          n++;
          const w = (s.match(/\S+/g) || []).length;
          if (!/^[A-Z0-9"]/.test(s) || !/[.]$/.test(s) || /\{|undefined|NaN/.test(s) || /\ba [aeiou]/i.test(s) || /[a-z,] The [A-Z]/.test(s) || /(^|[.] )[a-z]/.test(s) || w > 32) bad.push(s);
        }
      }
      const thin = Object.keys(kinds).filter(k => kinds[k] < 2);
      return { n, bad: [...new Set(bad)], kinds, thin, total: Object.values(kinds).reduce((a, b) => a + b, 0) };
    });
    return { ok: r.n > 300 && !r.bad.length && !r.thin.length && r.total >= 60, detail: `${r.total} line templates in ${Object.keys(r.kinds).length} kinds, ${r.n} drawn; kinds with one line ${r.thin.join(', ') || 'none'}; bad ${r.bad.length} ${r.bad.slice(0, 3).join(' | ')}` };
  },
  // playtest 2, new #13: "Mothers here still frighten children with the men of Aldmark" was said in Aldmark. A line that
  // fears the side that took a town ('foe') is said only where the taker is not the player's realm nor the place's
  async wcRecallRightSide(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 5711, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      const WC = A.WC, pc = A.pc(), other = Object.keys(A.S.realms).find(id => id !== pc.realm && A.S.realms[id].alive);
      const P = A.S.prov.findIndex(p => p && p.name && p.owner === pc.realm);
      const FOE = /frighten children|bar their doors/;
      const draw = (taker, n) => {
        const out = [];
        for (let i = 0; i < n; i++) {
          const y = A.S.year - 6, c = { id: 'rT' + i, y, k: 'fall', e: { i: 0, y, k: 'fall', a: taker, b: taker === pc.realm ? other : pc.realm, p: P, w: [], x: 1 } };
          const line = WC.recallLine(c, pc, 'wcRightSide|' + i);
          if (line) out.push(line);
        }
        return out;
      };
      const ours = draw(pc.realm, 40), theirs = draw(other, 40);
      return { ours: ours.filter(l => FOE.test(l)), oursN: ours.length, theirs: theirs.filter(l => FOE.test(l)).length, theirsN: theirs.length };
    });
    return { ok: r.oursN >= 20 && !r.ours.length && r.theirs > 0,
      detail: `the player's own realm took the town: ${r.oursN} lines, ${r.ours.length} fear the taker ${r.ours[0] || ''}; another realm took it: ${r.theirs} of ${r.theirsN} may` };
  },
  // cycle 1: "Since 1105, part of every tax here goes to Khaganate. Nobody forgets it." said in 1105. A "since" line
  // waits until the year is WC.SINCE_MIN years gone, and a realm whose short name is a noun takes its article.
  // Changed for v2: this test played a Far Lands realm (lands: 'great', POL-59 paying POL-58, "the Khaganate"). The
  // owner removed the Far Lands from the build (V2_SPEC complaint 3, LANES "The Far Lands"), so POL-58 no longer exists
  // and the line read "the share for a realm now gone". The bar is the same, but the realm is now made inside the test:
  // 99999-v2-names gave every continent realm a proper name (POL-19 "Confederacy of the Sand Clans" is now "Sahrim
  // Confederacy"), so no realm in the v2 build is noun-named, and a hardcoded name breaks with the next rename. The test
  // gives POL-19 a noun name for one draw ("League of the Salt Marches" / "Salt Marches", a name no rename table
  // touches), restores it, then draws again on POL-19's own proper name. Both draws are held to WC.realmWord's rule,
  // restated here: a short name that stands after "of the" in the full name takes "the"; any other takes no article.
  async wcEchoWords(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 5701, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      const pc = A.pc(), y = A.S.year, R = A.realm('POL-19');
      const c = (yy, i) => ({ id: 'x' + yy + i, k: 'trib', y: yy, e: { k: 'trib', p: pc.home, a: 'POL-01', b: 'POL-19', w: [], x: 0, y: yy } });
      const draw = tag => {
        const fresh = [], old = [];
        for (let i = 0; i < 6; i++) { fresh.push(A.WC.recallLine(c(y, i), pc, tag + i)); old.push(A.WC.recallLine(c(y - 5, i), pc, tag + i)); }
        return { fresh, old, name: R.name, short: R.short, word: A.WC.realmWord('POL-19') };
      };
      const keep = { name: R.name, short: R.short };
      let noun;
      try { R.name = 'League of the Salt Marches'; R.short = 'Salt Marches'; noun = draw('n'); }
      finally { R.name = keep.name; R.short = keep.short; }
      return { y, noun, proper: draw('p') };
    });
    const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rule = d => (new RegExp('\\bof the ' + esc(d.short) + '\\b', 'i').test(d.name) ? 'the ' + d.short : d.short);
    const judge = d => {
      const want = rule(d), named = d.old.filter(Boolean), sh = esc(d.short);
      // a noun name must never stand bare ("to Salt Marches"); a proper name must never take "the" ("the Sahrim")
      const wrong = want.startsWith('the ') ? new RegExp('\\b(to|for) ' + sh + '\\b') : new RegExp('\\b[Tt]he ' + sh + '\\b');
      const bad = named.filter(l => wrong.test(l)), since = d.fresh.filter(l => l && /since/i.test(l));
      return { want, named, bad, since, ok: d.word === want && named.length > 0 && !bad.length && !since.length && named.every(l => l.includes(want)) };
    };
    const n = judge(r.noun), p = judge(r.proper);
    const say = (k, d, j) => `${k} "${d.name}" -> "${d.word}" (rule "${j.want}"): ${j.named.length} lines five years on, ${j.bad.length} wrong, ${j.since.length} saying "since" this year; ${j.named[0] || ''}`;
    return { ok: n.ok && p.ok && n.want.startsWith('the ') && !p.want.startsWith('the '),
      detail: `${say('noun', r.noun, n)} || ${say('proper', r.proper, p)}` };
  },
};
