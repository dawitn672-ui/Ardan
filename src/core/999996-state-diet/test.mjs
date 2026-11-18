// X5, the state diet: compaction changes nothing in the world and nothing in the book; compacting on load is compacting
// in play; the save stays under bars set from measured lives; every sample save loads and is compacted.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = p => fileURLToPath(new URL(p, import.meta.url));
const SAVEDIR = here('../../../tests/saves/');

// in the page: one life of `years`, its player killed at `kill` years and played on as an heir (the same each run)
const INSTALL = () => {
  // the heir a test plays on as: the eldest living child, else the first young person of the realm by id, else of Ardan
  const young = p => p.alive && A.age(p) >= 16 && A.age(p) <= 30, byId = (a, b) => (a.id < b.id ? -1 : 1);
  window.__dietHeir = old => ((old.children || []).map(A.P).filter(p => p && p.alive).sort((a, b) => a.born - b.born || byId(a, b))[0]
    || Object.values(A.S.people).filter(p => young(p) && p.realm === old.realm).sort(byId)[0] || Object.values(A.S.people).filter(young).sort(byId)[0]);
  window.__dietLife = ([o, kill, years]) => {
    T.enter(o);
    const end = A.S.year + years;
    T.play(kill);
    if (A.pc() && A.pc().alive) A.pcDeath('a winter fever');
    const first = A.pc();
    let p = first;
    for (let g = 0; g < 12; g++) {
      const heir = __dietHeir(p);
      if (!heir) return { dead: true, year: A.S.year };
      A.continueAs(heir.id); UI.ov = null;
      if (A.S.year >= end || T.play(end - A.S.year) !== 'dead') break;
      p = A.pc();
    }
    return { dead: A.S.year < end, year: A.S.year, former: first.id };
  };
};

export default {
  // The same life with the diet off, then compacted at its end, and with the diet on all along: the same state to the
  // byte (the world untouched, compacting on load = compacting in play), the same book, nothing drawn.
  async dietSameAsPlayed(pg) {
    await pg.evaluate(INSTALL);
    const r = await pg.evaluate(() => {
      const life = window.__dietLife;
      const o = { seed: 7, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 };
      A.DIET.OFF = true;
      const a = life([o, 6, 50]);
      const book0 = A.chronicleText(), raw = A.serialize().length;
      A.DIET.OFF = false;
      const k0 = A.rngState, c = A.DIET.compact(A.S, 'load'), pure = A.rngState === k0;
      const fpLoad = A.fingerprint(), book1 = A.chronicleText(), slim = A.serialize().length;
      const again = A.DIET.compact(A.S, 'load');
      const b = life([o, 6, 50]);
      const fpPlay = A.fingerprint(), book2 = A.chronicleText(), former = A.P(b.former);
      return { a, b, c, again, pure, same: fpLoad === fpPlay, book: book0 === book1 && book1 === book2, bookLen: book0.length, raw, slim,
        formerTrim: !!former && !former.alive && !('mw' in former) && !('evC' in former) && 'skills' in former && 'flags' in former && 'app' in former,
        tomb: A.S.log.filter(e => e.year <= A.S.year - A.DIET.KEEP_LOG).every(e => e.lines.length > 0) };
    });
    const ok = !r.a.dead && !r.b.dead && r.same && r.book && r.pure && r.c.lines > 0 && r.c.fields > 0 && r.again.lines === 0 && r.again.fields === 0 && r.formerTrim && r.tomb;
    return { ok, detail: `to ${r.b.year}: compacted on load = in play ${r.same}; book the same ${r.book} (${r.bookLen} chars); drew nothing ${r.pure}; ` +
      `${r.c.lines} log lines and ${r.c.fields} fields of a former life cut (again: ${r.again.lines}, ${r.again.fields}); former life trimmed ${r.formerTrim}; ` +
      `state ${Math.round(r.raw / 1024)} -> ${Math.round(r.slim / 1024)} KB` };
  },

  // The save's size, held under bars from measured lives (tools/bench/state-size.mjs, X5, D-105): fresh, year 50, year
  // 100. Readings with this build, four lives (packed state KB / gzipped save KB; the story log KB):
  //   seed 7 noble M 20 (POL-01):       y0 1839/333   y50 4096/853 (log 119)   y100 4678/990 (log 94)   [the life tested]
  //   seed 11 peasant F 0 (POL-01):     y0 1807/327   y50 4136/861 (log 87)    y100 4722/991 (log 90)
  //   seed 23 artisan M 18 (POL-14):    y0 1823/331   y50 3978/830 (log 92)    (the line ended in 1182)
  //   seed 31 noble F 20 (POL-07):      y0 1854/337   y50 3879/814 (log 79)    y100 4449/927 (log 83)
  //   before X5, seed 7:                                y50 4106/855 (log 129)   y100 4929/1049 (log 233)
  // The bars sit a sixth over the largest reading; the log's bar fails a log kept whole again (233 KB at year 100).
  async dietSaveBars(pg) {
    const BAR = { 0: [2170, 395], 50: [4840, 1010], 100: [5530, 1160] }, LOGBAR = 140;
    await pg.evaluate(INSTALL);
    const r = await pg.evaluate(async BAR => {
      const o = { seed: 7, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 };
      T.enter(o);
      const y0 = A.S.year, out = [];
      for (const at of [0, 50, 100]) {
        while (A.S.year < y0 + at) {
          if (T.play(y0 + at - A.S.year) !== 'dead') continue;
          const k = __dietHeir(A.pc());
          if (!k) return { out, dead: A.S.year };
          A.continueAs(k.id); UI.ov = null;
        }
        const packed = JSON.stringify(A.packState(A.S)).length, gz = (await SAVES.encode(A.S, A.J)).bytes.length;
        const log = JSON.stringify(A.S.log).length;
        out.push({ at, year: A.S.year, packed: Math.round(packed / 1024), gz: Math.round(gz / 1024), log: Math.round(log / 1024), people: Object.keys(A.S.people).length });
      }
      return { out };
    }, BAR);
    const bad = r.out.filter(x => x.packed > BAR[x.at][0] || x.gz > BAR[x.at][1] || x.log > LOGBAR);
    const ok = !r.dead && r.out.length === 3 && !bad.length;
    return { ok, detail: (r.dead ? `the line ended in ${r.dead}; ` : '') + r.out.map(x => `y${x.at} (${x.year}): packed ${x.packed} KB (bar ${BAR[x.at][0]}), save ${x.gz} KB gz (bar ${BAR[x.at][1]}), log ${x.log} KB (bar ${LOGBAR}), ${x.people} people`).join('; ') };
  },

  // Every sample save loads through the real path and comes in compacted; compacting it again changes nothing; the book
  // of a save compacted on load reads as the book of the save as it was.
  async dietOldSaves(pg) {
    const files = [];
    for (const d of [SAVEDIR, SAVEDIR + 'press/']) for (const f of fs.readdirSync(d).filter(f => f.endsWith('.ardan')).sort()) files.push([d === SAVEDIR ? f : 'press/' + f, fs.readFileSync(d + f).toString('base64')]);
    const rows = [];
    for (const [name, b64] of files) {
      const r = await pg.evaluate(async b64 => {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const d = await SAVES.decode(bytes); SAVES.clean(d);
        A.DIET.OFF = true; A.deserialize(JSON.parse(JSON.stringify(d.S)));
        const book0 = A.chronicleText(), raw = A.serialize().length;
        A.DIET.OFF = false;
        const d2 = await SAVES.decode(bytes), loaded = UI.enterSaveSafe(d2);
        const book1 = A.chronicleText(), slim = A.serialize().length, again = A.DIET.compact(A.S, 'load');
        return { loaded, book: book0 === book1, raw, slim, again: again.lines + again.fields, year: A.S.year, lines: A.DIET.last ? A.DIET.last.lines : -1 };
      }, b64);
      rows.push(Object.assign({ name }, r));
    }
    const bad = rows.filter(x => !x.loaded || !x.book || x.again || x.slim > x.raw);
    const y50 = rows.find(x => /y50/.test(x.name));
    return { ok: !bad.length && rows.length >= 10 && !!y50 && y50.slim < y50.raw,
      detail: `${rows.length} saves: ` + rows.map(x => `${x.name} ${x.year} ${Math.round(x.raw / 1024)}->${Math.round(x.slim / 1024)} KB${x.book ? '' : ' BOOK CHANGED'}${x.loaded ? '' : ' NOT LOADED'}${x.again ? ' NOT IDEMPOTENT' : ''}`).join('; ') };
  },
};
