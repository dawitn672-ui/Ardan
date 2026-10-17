// Voices: every culture has a voice bank and a naming rule; its local events show its words (W12); a person's line
// takes the manner of their traits, so two people read differently in the same event; nothing passes 80 words; the
// voice is drawn from hashes of ids, so drawing a view or the Realm tab never moves the random stream.
const SETUP = () => {
  window.VT = {
    words: s => (String(s || '').match(/\S+/g) || []).length,
    life(seed, o) {
      A.newGame(Object.assign({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 }, o || {}));
      A.S.queue = []; return A.pc();
    },
    // draw an event as the release would, then decorate it: the raw view and the voiced one from the same setup
    draw(pc, id, ctx) {
      const q = { type: 'event', ev: id, forced: true, ctx: ctx || {} };
      A.S.queue = [q];
      let v = null;
      try { v = A.VOICE.raw(q); } catch (e) { v = null; }
      A.S.queue = [];
      if (!v || v.skip) return null;
      return { q, v, d: A.VOICE.decorate(pc, A.EV[id], q, v) };
    },
  };
};

export default {
  // 24 cultures, each with a full bank; 40 traits, each with its manner
  async voiceBanks(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const V = A.VOICE, bad = [], creatures = LORE.creatures.map(c => c.name.toLowerCase().replace(/^the /, ''));
      let sayings = 0, lines = 0;
      const cults = Object.keys(LORE.cultures);
      for (const cid of cults) {
        const D = V.data(cid);
        if (!D) { bad.push(cid + ' no bank'); continue; }
        for (const k of ['lord', 'ruler', 'council']) if (!V.term(cid, k)) bad.push(cid + ' no ' + k);
        for (const k of ['greet', 'oath', 'curse', 'year']) if (!D[k] || V.fill(cid, D[k], { n: 'first', ru: 'X', y: 1 }) == null) bad.push(cid + ' ' + k);
        if ((D.sayings || []).length < 3) bad.push(cid + ' sayings');
        if ((D.lines || []).length < 2) bad.push(cid + ' lines');
        const all = V.lines(cid);
        if (all.length !== (D.sayings || []).length + (D.lines || []).length) bad.push(cid + ' a line that does not fill');
        for (const l of all) {
          if (/\{[A-Za-z0-9_.]+\}/.test(l.text)) bad.push(l.key + ' token');
          if (VT.words(l.text) > (l.kind === 'saying' ? 16 : 18)) bad.push(l.key + ' long ' + VT.words(l.text));
          if (!l.topics.every(t => V.TOPICS[t])) bad.push(l.key + ' topic');
          const low = l.text.toLowerCase();
          if (creatures.some(c => c.length > 3 && low.includes(c))) bad.push(l.key + ' names a creature');
          l.kind === 'saying' ? sayings++ : lines++;
        }
        if (V.wordsOf(cid).length < 4) bad.push(cid + ' words ' + V.wordsOf(cid).length);
      }
      const T = A.VOICE_TRAITS || {}, traits = Object.keys(GD.TRAITS);
      for (const t of traits) { const b = T[t]; if (!b || !b.tag || !b.tag.length || !b.beat || !b.beat.length || !b.bear || !b.bear.length) bad.push('trait ' + t); }
      return { cults: cults.length, banks: cults.filter(c => V.data(c)).length, sayings, lines, traits: traits.length, traitBanks: traits.filter(t => T[t]).length, bad };
    });
    return { ok: !r.bad.length && r.banks === 24 && r.traitBanks === r.traits, detail: `${r.banks} of ${r.cults} cultures with a voice bank (${r.sayings} sayings, ${r.lines} knowledge lines); ${r.traitBanks} of ${r.traits} traits with a manner${r.bad.length ? '; BAD ' + r.bad.slice(0, 8).join(', ') : ''}` };
  },

  // every culture has a naming generator (GD.NAMING), and it makes names of its own people
  async namingEveryCulture(pg) {
    const r = await pg.evaluate(() => {
      const MODES = ['house', 'clan', 'crew', 'band', 'line', 'trade', 'tribe', 'hall', 'patron', 'deed', 'single', 'place'];
      const out = [], bad = [];
      A.newGame({ seed: 4040, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      for (const [cid, C] of Object.entries(LORE.cultures)) {
        const N = GD.NAMING[cid];
        if (!N) { bad.push(cid + ' no rule'); continue; }
        const modes = [N.common, N.noble].concat(Object.values(N.alt || {}));
        if (!modes.every(m => MODES.includes(m))) bad.push(cid + ' mode ' + modes.join('/'));
        const rid = (C.pols || [])[0] || 'unclaimed', own = new Set([...(C.m || []), ...(C.f || [])]);
        let given = 0, sur = 0, n = 0;
        const sample = [];
        for (let i = 0; i < 12; i++) {
          const sex = i % 2 ? 'F' : 'M', status = i % 3 ? 'peasant' : 'noble', g = A.givenName(cid, sex);
          const f = A.familyName({ cult: cid, status, realm: rid, sex, home: 0 });
          n++; if (own.has(g)) given++; if (f.sur || f.mode === 'single') sur++;
          if (sample.length < 2) sample.push((g + ' ' + (f.sur || '')).trim());
        }
        if (given < n || sur < n) bad.push(cid + ` given ${given}/${n} sur ${sur}/${n}`);
        out.push(`${C.name}: ${sample.join(', ')}`);
      }
      return { n: Object.keys(LORE.cultures).length, out, bad };
    });
    return { ok: !r.bad.length && r.n === 24, detail: `${r.n - r.bad.length} of ${r.n} cultures name their people by their own rule (${r.out.slice(0, 6).join('; ')} ...)${r.bad.length ? '; BAD ' + r.bad.join(', ') : ''}` };
  },

  // W12: the share of each culture's local events that show at least one of its words, before (the release's text)
  // and after (voiced), drawn for three lives of that culture each. Local means gated in its cond to a realm or a
  // culture. Also: nothing over 80 words, no raw token
  async localEventsUseWords(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const V = A.VOICE, evs = Object.values(A.EV), C = {}, over = [], raw = [];
      let lifeKey = null;
      for (let s = 0; s < 3; s++) for (const cid of Object.keys(LORE.cultures)) {
        const R = C[cid] = C[cid] || { n: 0, before: 0, after: 0, voice: 0 };
        for (const e of evs) {
          if (!V.localTo(e).includes(cid)) continue;
          const g = V.gate(e), rid = g.realms.find(x => V.realmCult(x) === cid) || Object.keys(LORE.realms).find(x => V.realmCult(x) === cid);
          if (!rid) continue;
          let race = LORE.realms[rid].race;
          if (g.races.length && !g.races.includes(race)) race = g.races.find(x => GD.RACES[x]) || race;
          const key = s + rid + race;
          if (lifeKey !== key || !A.pc()) { VT.life(5200 + 100 * s + +rid.slice(4), { race, realm: rid }); lifeKey = key; }
          const pc = A.pc();
          if (g.cults.length && !g.cults.includes(pc.cult)) pc.cult = cid;
          const x = VT.draw(pc, e.id);
          if (!x) continue;
          R.n++;
          const b = V.has(cid, x.v.title + ' ' + x.v.text), a = V.has(cid, x.d.title + ' ' + x.d.text);
          if (b) R.before++;
          if (a) R.after++;
          if (a || x.d.line) R.voice++;
          if (VT.words(x.d.text) > 80 && VT.words(x.v.text) <= 80) over.push(e.id);
          if (/\{[A-Za-z0-9_.]+\}/.test(x.d.title + x.d.text)) raw.push(e.id);
        }
      }
      return { C, over, raw };
    });
    const rows = Object.entries(r.C).filter(([, R]) => R.n > 0);
    const pct = (a, n) => Math.round(100 * a / n);
    const low = rows.filter(([, R]) => pct(R.after, R.n) < 30);
    const n = rows.reduce((a, [, R]) => a + R.n, 0), b = rows.reduce((a, [, R]) => a + R.before, 0), af = rows.reduce((a, [, R]) => a + R.after, 0), vo = rows.reduce((a, [, R]) => a + R.voice, 0);
    const min = rows.reduce((m, [c, R]) => (pct(R.after, R.n) < m[1] ? [c, pct(R.after, R.n)] : m), ['', 101]);
    const max = rows.reduce((m, [c, R]) => (pct(R.after, R.n) > m[1] ? [c, pct(R.after, R.n)] : m), ['', -1]);
    return { ok: !low.length && !r.over.length && !r.raw.length && rows.length >= 20,
      detail: `${rows.length} cultures with local events (${n} draws, 3 lives each): with one of its words before ${pct(b, n)}%, after ${pct(af, n)}% (lowest ${min[0]} ${min[1]}%, highest ${max[0]} ${max[1]}%); a word or a voice line ${pct(vo, n)}%; ${rows.length - low.length} of ${rows.length} cultures at 30% or more${low.length ? ' (BELOW: ' + low.map(([c, R]) => c + ' ' + pct(R.after, R.n) + '%').join(', ') + ')' : ''}; over 80 words ${r.over.length}, raw tokens ${r.raw.length}`,
      data: r.C };
  },

  // the same event read with two different people: their lines differ, and each carries a phrase of their own trait
  async twoVoicesOneEvent(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const V = A.VOICE, T = A.VOICE_TRAITS, out = [];
      const pairs = [['shy', 'proud'], ['kind', 'cruel'], ['honest', 'deceitful'], ['calm', 'wrathful'], ['witty', 'stoic']];
      const has = (txt, tr) => [...T[tr].tag, ...T[tr].beat, ...T[tr].bear].some(p => txt.includes(p.replace(/\{\w+\}/g, '\u0000').split('\u0000').sort((a, b) => b.length - a.length)[0].trim()));
      const ids = ['wk_sea_lodestone', 'av_wild_guide', 'av_wild_treasure_map', 'ct_plot_invite', 'av_crime_gutterking', 'ni_borrow_repaid', 'ni_gift', 'ni_apprentice'].filter(id => A.EV[id]);
      for (const id of ids) {
        const pc = VT.life(6100 + out.length, { status: 'artisan', startAge: 30 });
        const e = A.EV[id];
        let ctx = {};
        if (e.npc) { const t = Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && A.isAdult(p)); ctx = { pid: t.id }; }
        const x = VT.draw(pc, id, ctx);
        if (!x || !x.q.ctx.pid) continue;
        const t = A.P(x.q.ctx.pid), keep = t.traits;
        for (const [a, b] of pairs) {
          t.traits = [a]; const da = V.decorate(pc, e, x.q, x.v);
          t.traits = [b]; const db = V.decorate(pc, e, x.q, x.v);
          out.push({ id, a, b, differ: da.text !== db.text, ownA: has(da.text, a), ownB: has(db.text, b), long: Math.max(VT.words(da.text), VT.words(db.text)), ta: da.text, tb: db.text });
        }
        t.traits = keep;
      }
      return out;
    });
    const ok = r.length >= 20 && r.every(x => x.differ && x.ownA && x.ownB && x.long <= 80);
    const ex = r.find(x => x.a === 'shy') || r[0];
    return { ok, detail: `${r.filter(x => x.differ && x.ownA && x.ownB).length} of ${r.length} trait pairs read differently in the same event, each in its own trait's manner (${[...new Set(r.map(x => x.id))].length} events). e.g. shy: "${ex ? ex.ta.slice(-90) : ''}" / proud: "${ex ? ex.tb.slice(-90) : ''}"` };
  },

  // over every event that casts a person and quotes a line: how many lines get the speaker's manner
  async npcLinesHaveManner(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const V = A.VOICE, evs = Object.values(A.EV).filter(e => e.npc || (e.setup && /pid/.test(e.setup.toString())));
      const out = { n: 0, quoted: 0, voiced: 0, kinds: {}, over: 0 };
      let pc = null;
      evs.forEach((e, i) => {
        if (i % 60 === 0) pc = VT.life(6500 + i, { status: 'artisan', startAge: 30, sex: i % 120 ? 'F' : 'M' });
        let ctx = {};
        if (e.npc) { const t = Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && A.isAdult(p)); ctx = { pid: t.id }; }
        const x = VT.draw(pc, e.id, ctx);
        if (!x || !x.q.ctx.pid || !A.P(x.q.ctx.pid)) return;
        out.n++;
        const quoted = /"[^"]{2,}"/.test(x.v.text);
        if (quoted) out.quoted++;
        const k = x.d.added.find(a => /^(tag|beat|greet|bear):/.test(a));
        if (k) { out.kinds[k.split(':')[0]] = (out.kinds[k.split(':')[0]] || 0) + 1; if (quoted) out.voiced++; }
        if (VT.words(x.d.text) > 80) out.over++;
      });
      return out;
    });
    const share = r.quoted ? Math.round(100 * r.voiced / r.quoted) : 0;
    return { ok: share >= 50 && !r.over, detail: `${r.n} events cast a person; ${r.quoted} quote a line, and ${r.voiced} of those (${share}%) give it the speaker's manner; added: ${JSON.stringify(r.kinds)}; over 80 words ${r.over}` };
  },

  // tokens for writers fill for any life, and name the year the place's way
  async tokensFill(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = [], bad = [];
      const s = '{saying} | {oath} | {greet} | {curse} | {lordWord} | {rulerWord} | {councilWord} | {yearName} | {themSaying} | {themOath} | {themGreet} | {themCurse} | {them} {theySay} | {they_say}';
      for (const [rid, race] of [['POL-01', 'human'], ['POL-22', 'human'], ['POL-28', 'dwarf'], ['POL-11', 'orc'], ['POL-09', 'giant'], ['POL-07', 'elf'], ['POL-33', 'human']]) {
        const pc = VT.life(6900 + +rid.slice(4), { race, realm: rid });
        const t = Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && A.isAdult(p));
        const txt = A.T(s, A.ctxTokens(pc, { pid: t.id }));
        if (/\{[A-Za-z0-9_.]+\}/.test(txt)) bad.push(rid + ': ' + txt);
        out.push(rid + ': ' + txt.split(' | ')[7]);
      }
      return { out, bad };
    });
    return { ok: !r.bad.length, detail: `every token fills in 7 realms; the year: ${r.out.join('; ')}${r.bad.length ? '; RAW ' + r.bad[0] : ''}` };
  },

  // drawing the voice is pure: the same view twice reads the same, the random stream does not move, and the Realm
  // tab's card changes nothing and escapes what it shows
  async voicePureAndEscaped(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const V = A.VOICE, pc = VT.life(7301), out = {};
      const id = Object.values(A.EV).find(e => V.localTo(e).includes('CUL-02') && VT.draw(pc, e.id) && VT.draw(pc, e.id).d.line).id;
      const x = VT.draw(pc, id), rng0 = JSON.stringify(A.rngState), s0 = JSON.stringify(A.S);
      const d1 = V.decorate(pc, A.EV[id], x.q, x.v), d2 = V.decorate(pc, A.EV[id], x.q, x.v);
      out.same = d1.text === d2.text && d1.title === d2.title;
      out.pure = JSON.stringify(A.rngState) === rng0 && JSON.stringify(A.S) === s0;
      UI.TAB.realm(pc);
      const keep = A.VOICE_DATA['CUL-02'].greet; A.VOICE_DATA['CUL-02'].greet = '<img src=x> hello';
      const s1 = JSON.stringify(A.S), r1 = JSON.stringify(A.rngState), h = UI.TAB.realm(pc);
      A.VOICE_DATA['CUL-02'].greet = keep;
      out.cardPure = JSON.stringify(A.S) === s1 && JSON.stringify(A.rngState) === r1;
      out.card = /How the Northfolk speak/.test(h) && /Overhald/.test(h);
      out.escaped = !/<img src=x>/.test(h) && /&lt;img/.test(h);
      // a drawn view remembers its line in pc.vo, and the same line is not drawn again within REPEAT_YEARS
      const q = { type: 'event', ev: id, forced: true, ctx: {} }; A.S.queue = [q]; const v = A.eventView(q); A.S.queue = [];
      out.remembered = !!(pc.vo && Object.keys(pc.vo).length);
      const again = VT.draw(pc, id);
      out.notTwice = !again || again.d.line !== Object.keys(pc.vo)[0];
      out.example = v.text.split('\n\n').pop();
      return out;
    });
    const ok = r.same && r.pure && r.cardPure && r.card && r.escaped && r.remembered && r.notTwice;
    return { ok, detail: JSON.stringify(r) };
  },

  // voices only change words: the same seed played with and without them reaches the same world and random stream
  async sameWorld(pg) {
    const r = await pg.evaluate(() => {
      const run = off => {
        A.VOICE.OFF = off;
        try {
          A.newGame({ seed: 9090, race: 'human', realm: 'POL-18', status: 'peasant', sex: 'F', startAge: 18 });
          const end = A.S.year + 15;
          let voiced = 0;
          for (let g = 0; g < 5000 && A.S.year < end && A.pc().alive; g++) {
            A.advance(400);
            let h, k = 0;
            // the view is drawn (and voiced) inside headReady, so what it was given is read after it
            while ((A.VOICE.last = [], h = A.headReady()) && k++ < 200) {
              if (h.type !== 'event') { A.S.queue.shift(); continue; }
              if (A.VOICE.last.length) voiced++;
              A.eventAuto();
            }
          }
          const people = JSON.parse(JSON.stringify(A.S.people));
          // the voice's own cache, and 67-memory-weave's record, which keeps a scene's title as it was shown (in the place's words)
          for (const p of Object.values(people)) { delete p.vo; delete p.mw; }
          return { rng: JSON.stringify(A.rngState), people: JSON.stringify(people).length + ':' + T.hash(people), year: A.S.year, voiced };
        } finally { A.VOICE.OFF = false; }
      };
      return { off: run(true), on: run(false) };
    });
    const ok = r.off.rng === r.on.rng && r.off.people === r.on.people && r.on.voiced > 0 && r.off.voiced === 0;
    return { ok, detail: ok ? `15 years in Tamar with and without voices (${r.on.voiced} events voiced): the same random stream and the same people` : `worlds differ or nothing voiced: ${JSON.stringify(r)}` };
  },

  // in lives played by the bot: the share of local events that come with the culture's words or voice, how often a
  // line repeats, titles in the place's words, and nothing over 80 words
  async voicesInLives(pg, errs, { lives }) {
    await pg.evaluate(SETUP);
    const n = Math.max(6, lives || 6);
    const r = await pg.evaluate((n) => {
      const V = A.VOICE, starts = [['POL-01', 'human'], ['POL-18', 'human'], ['POL-28', 'dwarf'], ['POL-11', 'orc'], ['POL-06', 'elf'], ['POL-20', 'human'], ['POL-33', 'human'], ['POL-12', 'human'], ['POL-09', 'giant'], ['POL-30', 'human'], ['POL-25', 'human'], ['POL-17', 'human']];
      const T = { lives: 0, years: 0, ev: 0, local: 0, localWords: 0, localVoice: 0, lines: 0, repeats: 0, titles: 0, npc: 0, over: 0, overIds: [] };
      for (let i = 0; i < n; i++) {
        const [rid, race] = starts[i % starts.length];
        VT.life(8800 + i * 31, { race, realm: rid, status: i % 2 ? 'peasant' : 'artisan', sex: i % 2 ? 'F' : 'M', startAge: 16 });
        const y0 = A.S.year, seen = {};
        for (let g = 0; g < 3000 && A.S.year < y0 + 30; g++) {
          const res = A.advance(400);
          let h, k = 0;
          while ((V.last = [], h = A.headReady()) && k++ < 200) {
            if (h.type !== 'event') { A.S.queue.shift(); continue; }
            const e = A.EV[h.ev], v = A.eventView(h), pc = A.pc(), c = V.eventCult(pc, e);
            T.ev++;
            if (VT.words(v.text) > 80) { T.over++; T.overIds.push(`${h.ev} ${VT.words(v.text)}w${(V.last || []).length ? ' +' + V.last.join('/') : ''}`); }
            const line = ((V.last || []).find(a => /^line:/.test(a)) || '').slice(5);   // the key of the line voices added
            if (c && V.localTo(e).includes(c)) { T.local++; if (V.has(c, v.title + ' ' + v.text)) T.localWords++; if (line || V.has(c, v.title + ' ' + v.text)) T.localVoice++; }
            if (line) { const k = A.S.pc + line; T.lines++; if (seen[k] != null && A.S.year - seen[k] < V.REPEAT_YEARS) T.repeats++; seen[k] = A.S.year; }
            if (e && typeof e.title === 'string' && !/\{/.test(e.title) && v.title !== e.title) T.titles++;
            if ((V.last || []).some(a => /^(tag|beat|greet|bear):/.test(a))) T.npc++;
            A.eventAuto();
          }
          if ((res && res.why === 'dead') || !A.pc() || !A.pc().alive) break;
        }
        T.lives++; T.years += A.S.year - y0;
      }
      return T;
    }, n);
    const pct = (a, b) => (b ? Math.round(100 * a / b) : 0);
    const ok = r.over === 0 && r.repeats === 0 && r.local > 0 && pct(r.localWords, r.local) >= 30;
    return { ok, detail: `${r.lives} lives, ${r.years} years, ${r.ev} events: ${r.local} local, of which ${pct(r.localWords, r.local)}% show the culture's words and ${pct(r.localVoice, r.local)}% its words or a voice line; ${r.lines} voice lines (${(10 * r.lines / Math.max(1, r.years)).toFixed(1)} a decade), ${r.repeats} heard twice within ${5} years; ${r.titles} titles in the place's words; ${r.npc} people's lines in the speaker's manner; over 80 words ${r.over}${r.overIds.length ? ' (' + r.overIds.join(', ') + ')' : ''}` };
  },
};
