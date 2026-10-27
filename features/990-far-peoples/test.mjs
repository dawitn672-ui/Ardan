// Tests for features/990-far-peoples: every far realm has a bible whose customs the engine keeps, every far culture a
// voice and a score, every far faith its clergy and holy day, every far birth an opening; rendering stays pure; a
// Known World game is exactly what it was without this feature; and three far lives meet their customs and voices.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HELPERS } from '../../tests/helpers.mjs';
import { unpack, repack } from '../../tools/pack.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const NAME = '990-far-peoples';

// the same build without this feature: its code cut from the core blob, its events from the content blob, its
// patches undone
async function beforeBuild(file) {
  const html = fs.readFileSync(file, 'utf8'), parts = unpack(html);
  let core = parts['ardan-core'];
  const MARK = '\n;(function(){ // features/', mine = MARK + NAME + '/';
  for (let at = core.indexOf(mine); at >= 0; at = core.indexOf(mine)) {
    const next = core.indexOf(MARK, at + 1);
    core = core.slice(0, at) + (next >= 0 ? core.slice(next) : '');
  }
  let content = parts['ardan-content'];
  const SEP = '\u0001ARDAN-PACK\u0001', mineE = SEP + '// features/' + NAME + '/';
  for (let at = content.indexOf(mineE); at >= 0; at = content.indexOf(mineE)) {
    const next = content.indexOf(SEP, at + 1);
    content = content.slice(0, at) + (next >= 0 ? content.slice(next) : '');
  }
  parts['ardan-core'] = core; parts['ardan-content'] = content;
  const patches = (await import(pathToFileURL(path.join(HERE, 'patches.mjs')).href)).default;
  for (const p of patches.slice().reverse()) for (const [find, replace, want = 1] of p.edits.slice().reverse()) {
    const src = parts[p.blob], n = src.split(replace).length - 1;
    if (n !== want) throw new Error(`${p.id}: ${n} copies of the patched text, expected ${want}`);
    parts[p.blob] = src.split(replace).join(find);
  }
  const out = path.join(os.tmpdir(), `ardan-fp-before-${process.pid}.html`);
  fs.writeFileSync(out, repack(html, parts, 3));
  return out;
}
async function openPage(browser, file) {
  const ctx = await browser.newContext(), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
  await pg.goto(pathToFileURL(file).href);
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  await pg.evaluate(HELPERS);
  return { pg, ctx, errs };
}

const SETUP = () => {
  window.FPT = {
    great(o) { A.newGame(Object.assign({ seed: 9900, lands: 'great', race: 'human', realm: 'POL-36', status: 'peasant', sex: 'M', startAge: 22 }, o || {})); A.S.queue = []; const pc = A.pc(); pc.coin = 500; pc.prison = null; return pc; },
    words: s => (String(s).match(/\S+/g) || []).length,
    raw: s => /\{[A-Za-z0-9_.]+\}/.test(String(s)),
    markup: s => /[<>]/.test(String(s)),
    COMMON: ['year', 'rite', 'mourn', 'wed', 'ward', 'grave', 'exam', 'census', 'muster', 'season'],
  };
};

export default {
  // 118 far realms, each a want, a fear, a place and three customs of three kinds, two of them kinds a typical life
  // meets; 110 far cultures with words
  async fpBiblesComplete(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      FPT.great();
      const B = A.BIBLE, bad = [], kinds = {}, ids = new Set();
      const realms = Object.keys(A.FAR.D.realms), cults = Object.keys(A.FAR.D.cultures);
      for (const rid of realms) {
        const D = B.of(rid);
        if (!D || !D.want || !D.fear || !D.place || !D.place.name || !D.place.text) { bad.push(rid + ' bible'); continue; }
        if (FPT.words(D.want) > 40 || FPT.words(D.fear) > 40 || FPT.words(D.place.text) > 40) bad.push(rid + ' long');
        const C = D.customs || [], k = C.map(c => c.kind);
        if (C.length !== 3 || new Set(k).size !== 3) bad.push(rid + ' kinds ' + k.join('/'));
        if (k.filter(x => FPT.COMMON.includes(x)).length < 2) bad.push(rid + ' common ' + k.join('/'));
        for (const c of C) {
          ids.add(c.id); kinds[c.kind] = (kinds[c.kind] || 0) + 1;
          if (!B.KINDS.includes(c.kind)) bad.push(c.id + ' kind');
          if (!/^[a-z]{2,4}_[a-z_]+$/.test(c.id)) bad.push(c.id + ' id');
          if (!c.name || !c.rule || !c.log || FPT.words(c.rule) > 25 || FPT.words(c.log) > 25) bad.push(c.id + ' words');
          if (c.kind !== 'grave' && (!c.text || FPT.words(c.text) > 60 || !c.keepT || !c.keep || !c.defy || !c.defy.t || !c.defy.r || FPT.words(c.keepT) > 12 || FPT.words(c.defy.t) > 12)) bad.push(c.id + ' scene');
          if (c.kind === 'ward' && !B.WHEN[c.when]) bad.push(c.id + ' when ' + c.when);
          if (c.who && !B.WHO[c.who]) bad.push(c.id + ' who ' + c.who);
          if (c.kind === 'mourn' && !['eldest', 'eldestSon', 'youngest', 'daughters', 'equal', 'temple', 'lord', 'clan', 'none'].includes(c.share)) bad.push(c.id + ' share');
          if (c.kind === 'name' && !B.NAME[B.nameBy(c)]) bad.push(c.id + ' by');
          if ((c.kind === 'year' || A.FARP.KINDS.includes(c.kind)) && !(c.m >= 0 && c.m <= 11)) bad.push(c.id + ' month');
          for (const s of [c.text, c.keep, c.log, c.rule, c.defy && c.defy.r]) if (FPT.markup(s) || /"/.test(String(s || ''))) bad.push(c.id + ' markup');
        }
      }
      const noWords = cults.filter(c => !(A.BIBLE_WORDS[c] || []).length);
      return { realms: realms.length, cults: cults.length, noWords, customs: realms.length * 3, distinct: ids.size, kinds, bad };
    });
    const ok = r.realms === 118 && r.cults === 110 && !r.bad.length && !r.noWords.length;
    return { ok, detail: `${r.realms} far realms, ${r.customs} customs (${r.distinct} distinct: a faith's holy day is shared by its realms); kinds ${JSON.stringify(r.kinds)}; ${r.cults - r.noWords.length} of ${r.cults} cultures with words${r.bad.length ? '; BAD ' + r.bad.slice(0, 8).join(', ') : ''}` };
  },

  // every far custom's scene renders from a life in its own realm: no raw token, no markup, at most 80 words with any
  // voice line, labels of 12 words or fewer; defying resolves; each new kind, kept, runs and logs a clean line
  async fpScenesRender(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = FPT.great(), B = A.BIBLE, bad = [], seen = new Set();
      let n = 0, voiced = 0, runs = 0;
      const extra = { got: '12 suns', estate: '60 suns', parent: 'Old Tam', child: 'Ada', dowry: '20 suns', paid: '20 suns', cut: '2 suns', n: '3', due: '3 suns' };
      for (const rid of Object.keys(A.FAR.D.realms)) {
        pc.realm = rid; pc.cult = A.FAR.D.realms[rid].cult || pc.cult;
        for (const c of B.of(rid).customs) {
          if (seen.has(rid + c.id)) continue; seen.add(rid + c.id);
          if (c.kind === 'grave') { if (FPT.raw(B.fill(pc, c.log))) bad.push(c.id + ' log'); continue; }
          const q = { type: 'event', ev: 'rb_custom', forced: true, ctx: Object.assign({ cid: c.id }, extra) };
          A.S.queue = [q]; const v = A.eventView(q); n++;
          if ((A.VOICE.last || []).some(x => /^line:/.test(x))) voiced++;
          const all = [v.title, v.text].concat(v.choices.map(x => x.t));
          if (v.skip) bad.push(c.id + ' skipped');
          if (all.some(FPT.raw)) bad.push(c.id + ' token');
          if (all.some(FPT.markup)) bad.push(c.id + ' markup');
          if (FPT.words(v.text) > 80) bad.push(c.id + ' long ' + FPT.words(v.text));
          if (v.choices.length !== 2 || v.choices.some(x => FPT.words(x.t) > 12)) bad.push(c.id + ' choices');
          A.eventChoose(1); const res = A.S.queue[0].result.text;
          if (!res || FPT.raw(res)) bad.push(c.id + ' result');
          A.S.queue = [];
          if (A.FARP.RUN[c.kind]) {
            const l0 = A.S.log.length; pc.coin = 50;
            try { A.FARP.RUN[c.kind](pc, c); runs++; } catch (e) { bad.push(c.id + ' run ' + e.message); }
            const lines = A.S.log.slice(Math.max(0, l0 - 1)).flatMap(e => e.lines || []).map(l => l[0]);
            if (lines.some(FPT.raw)) bad.push(c.id + ' run line');
          }
        }
      }
      return { n, voiced, runs, bad };
    });
    return { ok: r.n >= 250 && !r.bad.length && r.runs >= 20, detail: `${r.n} far scenes rendered and defied (${r.voiced} end in the realm's voice); ${r.runs} new-kind customs run${r.bad.length ? '; BAD ' + r.bad.slice(0, 8).join(', ') : ''}` };
  },

  // each new kind fires at its moment in a far life, and the first meeting is a scene whose keep runs the rule
  async fpNewKindsFire(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const B = A.BIBLE, out = {};
      const one = (rid, id, setup) => {
        const pc = FPT.great({ realm: rid, seed: 9910 + +rid.slice(4) }), c = B.custom(id);
        pc.coin = 400; pc.literate = true; setup && setup(pc);
        const mo = A.monthOf, y = A.S.year;
        if (c.every) A.S.year = y + ((c.every - ((y - (c.off || 0)) % c.every)) % c.every);
        A.monthOf = () => ({ m: c.m || 0 });
        try { A.FARP.month(pc); } finally { A.monthOf = mo; }
        const q = A.S.queue.find(x => x.ev === 'rb_custom' && x.ctx.cid === id);
        let kept = null;
        if (q) { A.S.queue = [q]; A.headReady(); A.eventView(q); const c0 = pc.coin, l0 = A.S.log.length; A.eventChoose(0); kept = { coin: pc.coin - c0, logged: A.S.log.length > l0 || !!(pc.flags && pc.flags['fp_exam_' + id]) }; A.eventClose(); }
        // a year on it is met quietly
        A.S.year += c.every || 1; A.S.queue = [];
        A.monthOf = () => ({ m: c.m || 0 });
        try { A.FARP.month(pc); } finally { A.monthOf = mo; }
        return { scene: !!q, kept, quiet: (pc.rb[id] || {}).n === 2 && !A.S.queue.some(x => x.ev === 'rb_custom') };
      };
      out.exam = one('POL-36', 'tau_exam');
      out.census = one('POL-54', 'seu_uncle', pc => { pc.spouse = null; });
      out.muster = one('POL-37', 'hsh_banner', pc => { pc.gear.mount = null; });
      out.season = one('POL-111', 'kmd_water');
      return out;
    });
    const bad = Object.entries(r).filter(([, x]) => !x.scene || !x.kept || !x.quiet).map(([k]) => k);
    return { ok: !bad.length, detail: `${Object.keys(r).map(k => `${k}: scene ${r[k].scene}, kept (coin ${r[k].kept && r[k].kept.coin}), a later meeting quiet ${r[k].quiet}`).join('; ')}${bad.length ? '; BAD ' + bad.join(',') : ''}` };
  },

  // all 110 far cultures have a full voice bank in 54's form; tokens fill for a far life; the Realm cards render,
  // escape and change nothing
  async fpVoicesComplete(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = FPT.great(), V = A.VOICE, bad = [], creatures = LORE.creatures.map(c => c.name.toLowerCase().replace(/^the /, '')).filter(c => c.length > 3);
      let sayings = 0, lines = 0;
      const cults = Object.keys(A.FAR.D.cultures);
      for (const cid of cults) {
        const D = V.data(cid);
        if (!D) { bad.push(cid + ' no bank'); continue; }
        for (const k of ['lord', 'ruler', 'council']) if (!V.term(cid, k)) bad.push(cid + ' ' + k);
        for (const k of ['greet', 'oath', 'curse', 'year']) if (!D[k] || V.fill(cid, D[k], { n: 'first', ru: 'X', y: 1 }) == null) bad.push(cid + ' ' + k);
        if (D.sayings.length < 3 || D.lines.length < 2) bad.push(cid + ' bank small');
        const all = V.lines(cid), own = all.filter(l => !/:w\d+$/.test(l.key));
        if (own.length !== D.sayings.length + D.lines.length) bad.push(cid + ' unfilled');
        for (const l of all) {
          if (FPT.raw(l.text) || FPT.markup(l.text)) bad.push(l.key + ' token');
          if (FPT.words(l.text) > (l.kind === 'saying' ? 16 : 18)) bad.push(l.key + ' long');
          if (!l.topics.every(t => V.TOPICS[t])) bad.push(l.key + ' topic');
          if (creatures.some(c => l.text.toLowerCase().includes(c))) bad.push(l.key + ' creature');
          l.kind === 'saying' ? sayings++ : lines++;
        }
        if (V.wordsOf(cid).length < 4) bad.push(cid + ' words');
      }
      // tokens and cards for a life in each of ten far realms, one per land
      const lands = {}; for (const [rid, L] of Object.entries(A.FAR.D.realms)) if (!lands[L.land]) lands[L.land] = rid;
      const cards = [];
      for (const rid of Object.values(lands)) {
        pc.realm = rid; pc.cult = A.FAR.D.realms[rid].cult;
        const t = A.ctxTokens(pc, {});
        for (const k of ['greet', 'oath', 'curse', 'lordWord', 'rulerWord', 'councilWord', 'yearName', 'cw1']) if (!t[k] || FPT.raw(t[k])) bad.push(rid + ' token ' + k);
        const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState);
        const h = UI.TAB.realm(pc);
        if (JSON.stringify(A.S) !== s0 || JSON.stringify(A.rngState) !== r0) bad.push(rid + ' card not pure');
        if (!/How the .* speak/.test(h) || !/The ways of/.test(h)) bad.push(rid + ' cards');
        cards.push(`${A.realm(rid).short}: "${t.greet}" (${t.lordWord}, ${t.yearName})`);
      }
      return { n: cults.length, banks: cults.filter(c => V.data(c)).length, sayings, lines, cards, bad };
    });
    return { ok: r.banks === 110 && !r.bad.length, detail: `${r.banks} of ${r.n} far cultures with a voice bank (${r.sayings} sayings, ${r.lines} knowledge lines); ${r.cards.slice(0, 4).join('; ')}${r.bad.length ? '; BAD ' + r.bad.slice(0, 8).join(', ') : ''}` };
  },

  // the 55 far faiths: clergy, a holy day with a month, the holy day as the realm's custom; C.faith reads them; the feast
  // days the release names are the far faith's own in a far realm and the release's in the Known World; a far believer
  // in a realm of another faith keeps the day
  async fpFaiths(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = FPT.great(), bad = [], far = Object.keys(LORE.faiths).filter(f => +f.slice(4) >= 20);
      for (const fid of far) {
        const F = A.FARP_FAITH[fid];
        if (!F || !F.priest || !F.rite) { bad.push(fid + ' data'); continue; }
        const c = A.FARP.faithCustom(fid);
        if (!c || !(c.m >= 0 && c.m <= 11) || FPT.raw(c.text) || FPT.words(c.text) > 60) bad.push(fid + ' custom');
        if (!A.FARP.days(fid).length) bad.push(fid + ' days');
      }
      pc.faith = 'REL-20';
      const festFar = GD.FESTIVALS.map(f => f[0]).join(', ');
      // a believer of the Standing Flame living under the Ledger keeps the New Day
      pc.faith = 'REL-28'; const p0 = pc.piety || 0, mo = A.monthOf;
      A.monthOf = () => ({ m: 2 }); try { A.FARP.month(pc); } finally { A.monthOf = mo; }
      const kept = (pc.piety || 0) > p0 && A.S.log.flatMap(e => e.lines || []).some(l => /New Day/.test(l[0]));
      // the Known World
      A.newGame({ seed: 9921, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const festKnown = GD.FESTIVALS[0][0];
      return { n: far.length, bad, festFar, festKnown, kept };
    });
    const ok = r.n === 55 && !r.bad.length && /Sweeping of Graves/.test(r.festFar) && r.festKnown === "New Year's Day" && r.kept;
    return { ok, detail: `${r.n} far faiths, each with clergy and a holy day; feast days under the Ledger: ${r.festFar}; in the Known World: ${r.festKnown}...; a Flame believer under the Ledger keeps the New Day: ${r.kept}${r.bad.length ? '; BAD ' + r.bad.slice(0, 8).join(', ') : ''}` };
  },

  // 110 far cultures x 3 dates: each piece composed twice the same, all different, of the shape 73 asks, in its mode
  async fpScore(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const SC = UI.SCORE, bad = [], seen = new Set(), fams = new Set();
      let n = 0, same = 0, notes = 0, cad = 0, cadOk = 0;
      const cults = Object.keys(A.FAR.D.cultures);
      for (const c of cults) {
        if (!SC.CULTURES[c]) { bad.push(c + ' unmapped'); continue; }
        const F = SC.family(c); fams.add(F.id);
        if (F.mode.length !== F.warMode.length) bad.push(c + ' mode');
        if (!(F.warMode.reduce((a, x) => a + x, 0) < F.mode.reduce((a, x) => a + x, 0) || JSON.stringify(F.warMode) === JSON.stringify(SC.MODES.phrygian))) bad.push(c + ' war not darker');
        for (let k = 0; k < 3; k++) {
          const o = { cult: c, key: `${300 + k}|${1100 + k}|${k % 4}|1`, season: k % 4 };
          const p = SC.compose(o), q = SC.compose(Object.assign({}, o));
          if (JSON.stringify(p) === JSON.stringify(q)) same++;
          seen.add(T.hash(JSON.stringify(p.notes))); n++;
          if (p.dur < 120 || p.dur > 245 || p.silence < 30 || p.silence > 90) bad.push(`${c}:${p.dur}`);
          for (const war of [false, true]) {
            const set = new Set((war ? F.warMode : F.mode).map(x => Math.round(x * 100)));
            for (const x of p.notes) if (x.k === 'lead' || x.k === 'fill') { notes++; const pcl = Math.round((((SC.pitch(F, x.g, war) - F.tonic) % 12) + 12) % 12 * 100); if (!set.has(pcl)) { bad.push(`${c} off-mode`); break; } }
          }
          for (const x of p.notes) if (x.k === 'lead' && x.c) { cad++; const d = ((x.g % F.n) + F.n) % F.n; if (d === 0 || d === F.five) cadOk++; }
        }
      }
      // the mood in a far game reads the far culture, and reading it changes nothing
      FPT.great({ realm: 'POL-58' }); UI.screen = 'game';
      const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState), m = SC.mood();
      const pure = JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0;
      UI.screen = 'title';
      return { cults: cults.length, n, same, distinct: seen.size, notes, cad, cadOk, fams: fams.size, mood: m.cult, pure, bad };
    });
    const ok = r.cults === 110 && r.same === r.n && r.distinct === r.n && r.cadOk === r.cad && !r.bad.length && r.mood === 'CUL-43' && r.pure;
    return { ok, detail: `${r.n} pieces (110 far cultures x 3 dates) in ${r.fams} families: composed twice the same ${r.same}, all different ${r.distinct}; ${r.notes} notes in their modes; ${r.cadOk}/${r.cad} phrases end on the tonic or the fifth; the Khaganate hears ${r.mood}, read purely: ${r.pure}${r.bad.length ? '; BAD ' + r.bad.slice(0, 6).join(', ') : ''}` };
  },

  // a far birth opens with its land, its realm's kind and its rank: all ten lands x eight ranks render; a Known World
  // birth and a chosen story do not get it; the callback reads the choice
  async fpStarts(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const bad = [], sample = [];
      A.newGame({ seed: 9931, lands: 'great', race: 'human', realm: 'POL-91', status: 'artisan', sex: 'F', startAge: 18 });
      const queued = A.S.queue.some(q => q.ev === 'fp_start');
      const pc = A.pc(), lands = {};
      for (const [rid, L] of Object.entries(A.FAR.D.realms)) if (L.race === 'human') (lands[L.land] = lands[L.land] || []).push(rid);
      let n = 0;
      for (const land of Object.keys(lands)) for (const st of Object.keys(GD.STATUS)) {
        const rid = lands[land][n % lands[land].length]; n++;
        pc.realm = rid; pc.status = st; pc.cult = A.FAR.D.realms[rid].cult;
        const q = { type: 'event', ev: 'fp_start', forced: true, ctx: {} };
        A.S.queue = [q]; const v = A.eventView(q);
        const all = [v.title, v.text].concat(v.choices.map(c => c.t));
        if (v.skip || all.some(FPT.raw) || all.some(FPT.markup) || FPT.words(v.text) > 80 || v.choices.length !== 3) bad.push(`${land}/${st}`);
        if (sample.length < 2 && (st === 'serf' || st === 'noble')) sample.push(v.text);
        A.eventChoose(n % 3); const res = A.S.queue[0].result && A.S.queue[0].result.text; if (!res || FPT.raw(res)) bad.push(`${land}/${st} result`);
        A.S.queue = [];
      }
      // the callback, six years on
      pc.flags.fp_start = A.S.year - 7;
      const q = { type: 'event', ev: 'fp_start_echo', forced: true, ctx: {} }; A.S.queue = [q]; const ev = A.eventView(q);
      const echoOk = !ev.skip && !FPT.raw(ev.text) && /young|youth|years ago/.test(ev.text);
      A.newGame({ seed: 9932, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const known = A.S.queue.some(q => q.ev === 'fp_start');
      A.newGame({ seed: 9933, lands: 'great', race: 'human', realm: 'POL-05', status: 'serf', sex: 'M', startAge: 17, story: 'serf' });
      const story = A.S.queue.some(q => q.ev === 'fp_start');
      return { queued, n, bad, sample, echoOk, known, story };
    });
    const ok = r.queued && r.n === 80 && !r.bad.length && r.echoOk && !r.known && !r.story;
    return { ok, detail: `a far birth opens with fp_start: ${r.queued}; ${r.n} openings (10 lands x 8 ranks) render and resolve; the callback reads the choice: ${r.echoOk}; none for a Known World birth (${!r.known}) or a chosen story (${!r.story}). "${r.sample[0]}"${r.bad.length ? '; BAD ' + r.bad.slice(0, 8).join(', ') : ''}` };
  },

  // the year as each far realm names it: its ruler's reign from the lore, its house's years, the Ledger's Long Count,
  // the Lamp, the Cold Gate's wall; a successor's reign counts from the year he came to the throne in play
  async fpYearNames(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = FPT.great(), bad = [], out = {}, V = A.VOICE;
      let named = 0, reign = 0;
      const rids = Object.keys(A.FAR.D.realms);
      for (const rid of rids) {
        const cid = V.realmCult(rid), y = V.yearName(rid, cid);
        if (FPT.raw(y) || FPT.markup(y)) bad.push(rid + ' ' + y);
        if (!/^the year \d+$/.test(y)) named++;
        if (V.reignStart(A.realm(rid)) != null) reign++;
        if (['POL-36', 'POL-37', 'POL-70', 'POL-87', 'POL-91', 'POL-142'].includes(rid)) out[rid] = y;
      }
      // a new ruler: the lore's year no longer applies, the realm's history does
      const R = A.realm('POL-37'), old = V.reignStart(R), ru = A.P(R.ruler);
      const was = ru.given; ru.given = 'Zzother';
      const after = V.reignStart(R); ru.given = was;
      // the Known World
      A.newGame({ seed: 9961, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const known = V.yearName('POL-01', 'CUL-02');
      return { n: rids.length, named, reign, out, old, after, known, bad };
    });
    const ok = r.named >= 110 && r.reign >= 70 && !r.bad.length && r.old === 1096 && r.after == null && /winter of/.test(r.known);
    return { ok, detail: `${r.named} of ${r.n} far realms name the year in their own way (${r.reign} by the lore's reign); ${Object.entries(r.out).map(([k, v]) => k + ': ' + v).join('; ')}; Hesh's reign from 1096 (${r.old}), and not for a successor (${r.after}); Aldmark: ${r.known}${r.bad.length ? '; BAD ' + r.bad.slice(0, 5).join(', ') : ''}` };
  },

  // the release's tables of children's games and of the lord a commoner answers to: every far culture has its own, and
  // the scenes that read them show them; a Known World culture keeps the release's
  async fpTables(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = FPT.great({ startAge: 9 }), bad = [], cults = Object.keys(A.FAR.D.cultures);
      for (const c of cults) { const g = A.FARP_GAME[c], l = A.FARP_LORD[c]; if (!g || !g[0] || !g[1] || !l || FPT.markup(g.join(' ') + l) || FPT.words(g[1]) > 20) bad.push(c); }
      const show = (ev, cid) => { pc.cult = cid; const q = { type: 'event', ev, forced: true, ctx: {} }; A.S.queue = [q]; const v = A.eventView(q); A.S.queue = []; return v.skip ? null : v.text; };
      let gameShown = 0, lordShown = 0, tried = 0;
      for (const c of cults.slice(0, 40)) {
        tried++;
        const g = show('ch_play_game', c); if (g && g.includes(A.FARP_GAME[c][0])) gameShown++;
        const l = show('ch_serf_bailiff', c); if (l && l.includes(A.FARP_LORD[c])) lordShown++;
      }
      A.newGame({ seed: 9962, race: 'human', realm: 'POL-01', status: 'serf', sex: 'M', startAge: 9 });
      const k = A.pc(); A.S.queue = [];
      const q = { type: 'event', ev: 'ch_play_game', forced: true, ctx: {} }; A.S.queue = [q]; const v = A.eventView(q); A.S.queue = [];
      return { n: cults.length, bad, tried, gameShown, lordShown, known: v.skip ? 'skipped' : v.text };
    });
    const ok = r.n === 110 && !r.bad.length && r.gameShown >= 30 && r.lordShown >= 30 && /Ring Game/.test(r.known);
    return { ok, detail: `${r.n - r.bad.length} of ${r.n} far cultures with a game and a lord; of ${r.tried} tried, the game scene shows its own game ${r.gameShown} times and the bailiff scene its own lord ${r.lordShown}; Aldmark: "${String(r.known).slice(0, 80)}"${r.bad.length ? '; BAD ' + r.bad.slice(0, 6).join(', ') : ''}` };
  },

  // far people (courtiers, spouses, anyone) show their people in the person view: greeting, oath, faith's practice,
  // manners, food; escaped and pure; a Known World person shows none
  async fpPeopleViews(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = FPT.great({ realm: 'POL-37' }), bad = [];
      const R = A.realm('POL-37'), court = Object.values(R.council || {}).map(x => A.P(x && x.id || x)).filter(Boolean);
      const folk = Object.values(A.S.people).filter(p => p.alive && p.id !== pc.id && A.FAR.D.cultures[p.cult]).slice(0, 30);
      let shown = 0;
      const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState);
      for (const t of court.concat(folk)) {
        const h = UI.personModal(t);
        if (/Their people/.test(h)) shown++; else bad.push(t.id);
        if (/<img|<script/.test(A.FARP.personHtml(t))) bad.push(t.id + ' markup');
      }
      const pure = JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0;
      const sample = A.FARP.personHtml(folk[0]).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      A.newGame({ seed: 9963, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const kw = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc);
      const known = /Their people/.test(UI.personModal(kw));
      return { n: court.length + folk.length, court: court.length, shown, pure, sample, known, bad };
    });
    return { ok: r.shown === r.n && r.n >= 20 && r.pure && !r.known, detail: `${r.shown} of ${r.n} far people (${r.court} of them Hesh's court) show their people, purely: ${r.pure}; a Known World person: ${r.known ? 'SHOWN' : 'none'}. "${r.sample.slice(0, 260)}"` };
  },

  // the powers inside every far realm, named from the lore, with the factions 56 keeps; pure and escaped
  async fpPowers(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = FPT.great(), bad = [];
      let n = 0;
      for (const rid of Object.keys(A.FAR.D.realms)) {
        const P = A.FARP.powers(rid);
        if (!P || ['peace', 'liberty', 'war', 'claimant', 'independence'].some(k => !P[k] || !P[k][0] || !P[k][1])) { bad.push(rid); continue; }
        pc.realm = rid;
        const s0 = JSON.stringify(A.S), h = A.FARP.powersCard(pc);
        if (!/The powers of/.test(h) || JSON.stringify(A.S) !== s0) bad.push(rid + ' card'); else n++;
      }
      pc.realm = 'POL-37';
      const hesh = A.FARP.powersCard(pc).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      pc.realm = 'POL-36';
      const tab = UI.TAB.realm(pc);
      return { n, bad, hesh, tab: /The powers of Taulen/.test(tab) };
    });
    return { ok: r.n === 118 && !r.bad.length && r.tab && /examined officials/.test(r.hesh) && /banner princes/.test(r.hesh), detail: `${r.n} far realms with their powers named; the Realm tab shows the card: ${r.tab}. ${r.hesh.slice(0, 300)}${r.bad.length ? '; BAD ' + r.bad.slice(0, 6).join(', ') : ''}` };
  },

  // one world: in a Great Continent game the Known World's cultures speak of the lands past the edge and the far
  // cultures of the west, and six stories of the chain of hands are secrets with a truth; in a Known World game none
  async fpOneWorld(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      FPT.great();
      const V = A.VOICE, bad = [], creatures = LORE.creatures.map(c => c.name.toLowerCase().replace(/^the /, '')).filter(c => c.length > 3);
      const kw = Object.keys(A.FARP_WEST), far = Object.keys(A.FAR.D.cultures);
      let west = 0, east = 0;
      for (const c of kw.concat(far)) {
        const w = V.lines(c).filter(l => /:w\d+$/.test(l.key));
        if (!w.length) bad.push(c + ' none');
        for (const l of w) { if (FPT.raw(l.text) || FPT.words(l.text) > 18 || !l.topics.every(t => V.TOPICS[t]) || creatures.some(x => l.text.toLowerCase().includes(x))) bad.push(l.key); kw.includes(c) ? west++ : east++; }
      }
      const secrets = LORE.secrets.filter(s => /^SEC-F/.test(s.id)).length;
      const sample = [V.lines('CUL-11').find(l => /:w/.test(l.key)).text, V.lines('CUL-60').find(l => /:w/.test(l.key)).text];
      A.newGame({ seed: 9964, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const knownLines = V.lines('CUL-02').filter(l => /:w/.test(l.key)).length, knownSecrets = LORE.secrets.filter(s => /^SEC-F/.test(s.id)).length;
      return { kw: kw.length, far: far.length, west, east, secrets, knownLines, knownSecrets, sample, bad };
    });
    const ok = r.kw === 24 && !r.bad.length && r.secrets === 6 && !r.knownLines && !r.knownSecrets;
    return { ok, detail: `${r.kw} Known World cultures speak of the far lands (${r.west} lines) and ${r.far} far cultures of the west (${r.east}); 6 stories of the chain of hands are secrets in a Great Continent game (${r.secrets}); in a Known World game: ${r.knownLines} lines, ${r.knownSecrets} secrets. "${r.sample[0]}" / "${r.sample[1]}"${r.bad.length ? '; BAD ' + r.bad.slice(0, 6).join(', ') : ''}` };
  },

  // the Known World plays exactly as it did without this feature: three lives of five years in the Known World, and
  // the creation of a Great Continent game, same state hash and random stream
  async fpKnownWorldSame(pg, errs, { browser, file }) {
    let before;
    try { before = await beforeBuild(file); } catch (e) { return { ok: false, detail: 'could not derive the build without this feature: ' + e.message }; }
    const MEASURE = () => {
      const out = [];
      for (const [seed, realm, race] of [[9941, 'POL-01', 'human'], [9942, 'POL-19', 'human'], [9943, 'POL-28', 'dwarf']]) {
        A.newGame({ seed, lands: 'known', race, realm, status: 'peasant', sex: 'M', startAge: 16 });
        T.play(5);
        out.push({ seed, hash: T.hash(A.S), rng: A.rngState, fest: GD.FESTIVALS.length });
      }
      return out;
    };
    const B = await openPage(browser, before);
    let a;
    try { a = await B.pg.evaluate(MEASURE); } finally { await B.ctx.close(); fs.rmSync(before, { force: true }); }
    const b = await pg.evaluate(MEASURE);
    const diff = a.filter((x, i) => x.hash !== b[i].hash || x.rng !== b[i].rng).map(x => x.seed);
    return { ok: !diff.length && !B.errs.length, detail: `3 Known World lives of 5 years with and without this feature: ${diff.length ? 'DIFFER ' + diff.join(',') : 'identical'} (${b.map(x => x.hash).join(', ')})${B.errs.length ? '; page error before: ' + B.errs[0] : ''}` };
  },

  // three far births play ten years: the bibles' rules fire and the voices appear
  async fpFarLives(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = [];
      const V = A.VOICE, view = A.eventView;
      let deco = {};
      A.eventView = function (q) { const fresh = q && !q.view; const v = view.apply(this, arguments); if (fresh && V.last) for (const x of V.last) { const k = x.split(':')[0]; deco[k] = (deco[k] || 0) + 1; } V.last = null; return v; };
      try {
        for (const [seed, realm, status] of [[9951, 'POL-36', 'peasant'], [9952, 'POL-58', 'peasant'], [9953, 'POL-111', 'artisan']]) {
          // a life that ends in its first years (a fever, a horse) is played again from the next seed, up to three times
          let y0, pc0, res;
          for (let k = 0; k < 3; k++) {
            deco = {};
            A.newGame({ seed: seed + k * 101, lands: 'great', race: 'human', realm, status, sex: 'M', startAge: 18 });
            y0 = A.S.year; pc0 = A.pc();
            res = T.play(10);
            if (A.S.year - y0 >= 8) break;
          }
          const pc = A.pc() || pc0, rb = pc.rb || {};
          const mine = A.BIBLE.of(realm).customs;
          const logs = A.S.log.flatMap(e => e.lines || []).map(l => l[0]);
          out.push({ realm, status, years: A.S.year - y0, res, met: mine.filter(c => rb[c.id]).map(c => `${c.id}:${c.kind}x${rb[c.id].n}`), hits: Object.keys(rb).length,
            logged: logs.filter(l => mine.some(c => l.indexOf(A.BIBLE.fill(pc, c.name)) >= 0)).length, deco: Object.assign({}, deco), start: pc.flags && pc.flags.fp_start != null });
        }
      } finally { A.eventView = view; }
      return out;
    });
    const fired = r.filter(x => x.met.length >= 2).length, voiced = r.filter(x => (x.deco.line || 0) + (x.deco.title || 0) + (x.deco.greet || 0) + (x.deco.swap || 0) > 0).length;
    return { ok: fired === 3 && voiced >= 2 && r.every(x => x.start), detail: r.map(x => `${x.realm} ${x.status}, ${x.years}y: met ${x.met.join(' ')}; voice ${JSON.stringify(x.deco)}`).join(' | ') };
  },
};
