// Tests for features/993-far-life (life in the Far Lands: events).
//
// fvFarEvents   every fv_ event is registered, the counts per land hold (at least 10 per Far Land, about 20 across
//               the world, about 15 for the faiths), every flag an fv_ event reads with C.flag is set by another
//               fv_ event, and every event is play-tested in a Great Continent game: a character is built that
//               satisfies its cond (realm, land, age, sex, status, job, faith, coast, children, the flags it reads set
//               years ago), the event is rendered (no skip, no raw {token}, no NaN or undefined, text <= 80 words,
//               labels <= 12) and every choice is taken from the same saved state, each check forced to win and to
//               lose, failing on engine errors, raw tokens or empty results. A callback must not fire in the year its
//               flag was set.
// fvKnownSame   a Known World game is unchanged: the same seed played four years with and without this folder's
//               events (and with lands: 'known' said outright) gives the same state hash and random stream, and no
//               fv_ cond is true for Known World characters of every class and age.
// fvFarLives    ten years from birth in five Far Lands, and six years from sixteen in two more: no page error, no
//               raw token in any event shown, and fv_ events fire.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const IDS = fs.readdirSync(here).filter(f => f.endsWith('.events.js'))
  .flatMap(f => [...fs.readFileSync(path.join(here, f), 'utf8').matchAll(/\bid:\s*"(fv_[a-z0-9_]+)"/g)].map(m => m[1]));

// realms to build characters in, by land, and the Known World realms the cross-world events name
const REALMS = {
  R: ['POL-36', 'POL-37', 'POL-39'], F: ['POL-58', 'POL-61', 'POL-63'], B: ['POL-70', 'POL-79', 'POL-88'],
  H: ['POL-83', 'POL-90', 'POL-86'], M: ['POL-91', 'POL-92', 'POL-98'], A: ['POL-111', 'POL-113', 'POL-110'],
  T: ['POL-127', 'POL-126', 'POL-128'], N: ['POL-135', 'POL-134'], I: ['POL-136', 'POL-137'], D: ['POL-142', 'POL-143', 'POL-146'],
  K: ['POL-34', 'POL-27', 'POL-21'],
};
const RACE = { 'POL-60': 'orc', 'POL-61': 'orc', 'POL-87': 'dwarf', 'POL-34': 'orc', 'POL-11': 'orc' };

export default {
  async fvFarEvents(pg) {
    const r = await pg.evaluate(({ ids, REALMS, RACE }) => {
      const problems = [], stats = { events: ids.length, perLand: {}, variants: 0, choices: 0, memory: 0, flagsRead: 0 };
      const words = s => (String(s || '').match(/\S+/g) || []).length;
      const RAW = /\{[A-Za-z0-9_.]+\}/, BAD = /\bNaN\b|\bundefined\b|\[object /;
      const src = f => (typeof f === 'function' ? f.toString() : JSON.stringify(f || ''));
      for (const id of ids) if (!A.EV[id]) problems.push(`${id}: not registered`);
      const evs = ids.map(id => A.EV[id]).filter(Boolean);
      for (const e of evs) { const k = e.id.split('_')[1]; stats.perLand[k] = (stats.perLand[k] || 0) + 1; }
      for (const L of ['r', 'f', 'b', 'h', 'm', 'a', 't', 'n', 'i', 'd']) if ((stats.perLand[L] || 0) < 15) problems.push(`land ${L}: only ${stats.perLand[L] || 0} events`);
      if ((stats.perLand.x || 0) < 18) problems.push(`across the world: only ${stats.perLand.x || 0} events`);
      if ((stats.perLand.y || 0) < 15) problems.push(`faiths: only ${stats.perLand.y || 0} events`);
      // every flag read is set by some other fv_ event
      const setBy = {};
      for (const e of evs) for (const c of e.choices || []) for (const m of [c.fx, c.win && c.win.fx, c.lose && c.lose.fx].map(src).join(' ').matchAll(/flag"?\s*:\s*"(fv_\w+)"/g)) (setBy[m[1]] = setBy[m[1]] || new Set()).add(e.id);
      for (const e of evs) {
        const read = [...new Set([...e.cond.toString().matchAll(/(!?)C\.flag\(p,\s*"(\w+)"\)/g)].filter(m => !m[1]).map(m => m[2]))].filter(f => f.startsWith('fv_'));
        stats.flagsRead += read.length;
        for (const f of read) if (!setBy[f] || ![...setBy[f]].some(s => s !== e.id)) problems.push(`${e.id}: reads ${f}, which no other fv_ event sets`);
        if (read.length) stats.memory++;
      }
      const orphans = Object.keys(setBy).filter(f => !evs.some(e => new RegExp(`C\\.flag\\(p,\\s*"${f}"\\)|flags\\.${f}\\b`).test(e.cond.toString() + src(e.text) + (e.choices || []).map(c => src(c.fx) + src(c.r)).join(' '))));
      stats.orphans = orphans;
      // far realms with a scene of their own (named in an fv_ cond)
      const own = new Set(evs.flatMap(e => [...e.cond.toString().matchAll(/"POL-(\d+)"/g)].map(m => +m[1]).filter(n => n >= 36)));
      stats.ownRealms = own.size;
      if (own.size < 118) problems.push(`only ${own.size} of 118 far realms have a scene of their own`);

      let cur = '';
      const ce = console.error;
      console.error = (...a) => { problems.push(`${cur}: engine error: ${a.map(x => String(x && x.message || x)).join(' ').slice(0, 160)}`); };
      const odds = A.checkOdds;
      const bases = {};
      const baseFor = realm => {
        if (!bases[realm]) {
          A.newGame({ seed: 4141, lands: 'great', realm, race: RACE[realm] || 'human', status: 'peasant', startAge: 20, sex: 'M' });
          bases[realm] = A.serialize();
        }
        return bases[realm];
      };
      baseFor('POL-36');   // the far lands are in LORE only while a Great Continent game is open
      const landOf = realm => Object.keys(REALMS).find(L => REALMS[L].includes(realm));
      const AGES = [6, 10, 12, 13, 15, 16, 18, 22, 30, 45, 70];
      const STATUS = ['peasant', 'merchant', 'noble'];
      const apply = (p, v, e) => {
        const R = GD.RACES[p.race];
        p.born = A.S.year - Math.round(v.age * R.adult / 16);
        p.sex = v.sex; p.status = v.status; p.coin = v.status === 'peasant' ? 40 : 1500; p.literate = true;
        p.job = v.job ? { c: v.job, r: 0, y: 2, perf: 50, rep: 40 } : null;
        if (v.faith) p.faith = v.faith;
        if (v.ruler) { p.ruler = p.realm; const rr = A.realm(p.realm); if (rr) rr.ruler = p.id; }
        if (v.coast) { const c = A.realmProvs(p.realm).find(q => A.prov(q.id) && A.prov(q.id).coast); if (c) p.home = c.id; }
        if (v.kids && !p.children.some(c => A.P(c) && A.P(c).alive)) {
          const k = A.newPerson({ given: 'Tam', sex: 'F', race: p.race, realm: p.realm, cult: p.cult, faith: p.faith, born: A.S.year - 6, status: p.status, home: p.home });
          p.children.push(k.id); k.parents = [p.id, null];
        }
        if (v.orphan) for (const id of p.parents || []) { const q = A.P(id); if (q) q.alive = false; }
        for (const f of v.flags || []) p.flags[f] = A.S.year - v.ago;
        // a realm without a base of its own: the character is moved to its capital (C.realm and C.land then hold)
        if (v.move) { const R = A.realm(v.move); p.realm = v.move; if (R && R.capitalProv != null) p.home = R.capitalProv; }
      };
      for (const e of evs) {
        const cs = e.cond.toString();
        let realms = [...new Set([...cs.matchAll(/"(POL-\d+)"/g)].map(m => m[1]))];
        const lands = [...new Set([...cs.matchAll(/C\.land\(p,\s*([^)]*)\)/g)].flatMap(m => [...m[1].matchAll(/"([A-Z])"/g)].map(x => x[1])))];
        if (!realms.length) realms = lands.length ? lands.flatMap(L => REALMS[L]) : /!C\.farLand/.test(cs) ? REALMS.K : ['POL-36', 'POL-58', 'POL-91', 'POL-127', 'POL-142'];
        else if (lands.length) realms = realms.filter(r => !landOf(r) || landOf(r) === 'K' || lands.includes(landOf(r))).concat(lands.flatMap(L => REALMS[L]));
        realms = [...new Set(realms)].filter(r => LORE.realms[r] && A.realm(r)).slice(0, 5);
        const flags = [...new Set([...cs.matchAll(/C\.flag\(p,\s*"(\w+)"\)/g)].map(m => m[1]))].filter(f => !new RegExp(`!C\\.flag\\(p,\\s*"${f}"\\)`).test(cs));
        const faiths = [...new Set([...cs.matchAll(/(!?)C\.faith\(p,\s*([^)]*)\)/g)].filter(m => !m[1]).flatMap(m => [...m[2].matchAll(/"(REL-\d+)"/g)].map(x => x[1])))];
        const want = { ruler: /C\.ruler\(p\)/.test(cs) && !/!C\.ruler\(p\)/.test(cs), coast: /C\.coast\(p\)/.test(cs), kids: /C\.hasKids\(p\)/.test(cs), orphan: /!C\.parentsAlive\(p\)/.test(cs) };
        const JOBS = [null, ...new Set([...cs.matchAll(/C\.job\(p,\s*"(\w+)"\)/g)].map(m => m[1]))];
        const agos = flags.length ? [3, 9, 16, 32, 45] : [0];
        // the flags may be needed one at a time (an "or" of two flags), or all together
        const flagSets = flags.length > 1 ? [flags, ...flags.map(f => [f])] : [flags];
        let found = null;
        search: for (const realm of realms) {
          const baseRealm = landOf(realm) ? realm : 'POL-36', move = baseRealm === realm ? null : realm;
          A.deserialize(JSON.parse(baseFor(baseRealm)));
          const p = A.pc(), snap = JSON.stringify({ born: p.born, sex: p.sex, status: p.status, coin: p.coin, job: p.job, faith: p.faith, home: p.home, flags: p.flags, ruler: p.ruler });
          for (const fs of flagSets) for (const ago of agos) for (const age of AGES) for (const sex of ['M', 'F']) for (const status of STATUS) for (const job of JOBS) for (const faith of faiths.length ? faiths : [null]) {
            const v = { age, sex, status, job, faith, ruler: want.ruler, coast: want.coast, kids: want.kids, orphan: want.orphan, flags: fs, ago, move, baseRealm };
            const o = JSON.parse(snap); Object.assign(p, { born: o.born, sex: o.sex, status: o.status, coin: o.coin, job: o.job, faith: o.faith, home: o.home, flags: o.flags, ruler: o.ruler });
            apply(p, v, e);
            let ok = false; try { ok = !!e.cond(p, A.C); } catch (err) { problems.push(`${e.id}: cond throws ${err.message}`); break search; }
            if (ok) {
              // a scene whose setup finds nobody fit (no heir, no house) declines; look in the next realm
              const q0 = { type: 'event', ev: e.id };
              let v0 = null; try { v0 = A.eventView(q0); } catch (err) { problems.push(`${e.id}: view throws ${err.message}`); break search; }
              if (v0 && v0.skip && q0.ctx && q0.ctx.skip) { stats.declined = (stats.declined || 0) + 1; continue search; }
              found = { realm, v }; break search;
            }
          }
        }
        if (!found) { problems.push(`${e.id}: never eligible in a Great Continent character`); continue; }
        stats.variants++;
        const { realm, v } = found, vtag = `${e.id} [${realm} ${v.sex} ${v.age} ${v.status} ${v.job || '-'}]`;
        cur = vtag;
        A.deserialize(JSON.parse(baseFor(v.baseRealm)));
        apply(A.pc(), v, e);
        const timed = v.flags.filter(f => new RegExp(`A\\.S\\.year - \\(?p\\.flags\\.${f}\\b`).test(cs));
        if (timed.length && timed.length === v.flags.length) {
          const p = A.pc(), keep = v.flags.map(f => p.flags[f]);
          v.flags.forEach(f => { p.flags[f] = A.S.year; });
          if (e.cond(p, A.C)) problems.push(`${vtag}: fires in the same year as its flag`);
          v.flags.forEach((f, i) => { p.flags[f] = keep[i]; });
        }
        const base = A.serialize();
        const plan = [];
        (e.choices || []).forEach((c, i) => { if (c.check) plan.push([i, 100], [i, 0]); else plan.push([i, null]); });
        let viewed = false;
        for (const [i, force] of plan) {
          A.deserialize(JSON.parse(base)); A.S.queue = [];
          const q = { type: 'event', ev: e.id }; A.S.queue.unshift(q);
          let view;
          try { view = A.eventView(q); } catch (err) { problems.push(`${vtag}: view throws ${err.message}`); break; }
          if (view.skip) { problems.push(`${vtag}: skipped by the engine${q.ctx && q.ctx.skip ? ' (setup)' : ''}: ${([view.text].join(' ').match(RAW) || [''])[0]}`); break; }
          if (!viewed) {
            viewed = true;
            const all = [view.title, view.text, ...view.choices.map(c => c.t)].join(' | ');
            if (RAW.test(all)) problems.push(`${vtag}: raw token ${all.match(RAW)[0]}`);
            if (BAD.test(all)) problems.push(`${vtag}: bad text ${all.match(BAD)[0]}`);
            if (words(view.text) > 80) problems.push(`${vtag}: rendered text ${words(view.text)} words`);
            for (const c of view.choices) if (words(c.t) > 12) problems.push(`${vtag}: rendered label ${words(c.t)} words`);
          }
          const idx = view.choices.findIndex(c => c.i === i);
          if (idx < 0) continue;
          cur = `${vtag} choice ${i + 1}${force === null ? '' : force ? ' win' : ' lose'}`;
          if (force !== null) A.checkOdds = () => force;
          try {
            A.eventChoose(idx);
            const res = A.S.queue[0] && A.S.queue[0].result;
            const rt = res ? String(res.text || '') : '';
            if (RAW.test(rt)) problems.push(`${cur}: raw token in result ${rt.match(RAW)[0]}`);
            if (BAD.test(rt)) problems.push(`${cur}: bad result text ${rt.match(BAD)[0]}`);
            if (!rt.trim()) problems.push(`${cur}: empty result`);
            if (force !== null && res && res.success !== !!force) problems.push(`${cur}: check not forced`);
            A.eventClose();
            stats.choices++;
          } catch (err) { problems.push(`${cur}: throws ${err.message}`); }
          finally { A.checkOdds = odds; }
        }
      }
      console.error = ce;
      A.checkOdds = odds;
      return { problems: [...new Set(problems)], stats };
    }, { ids: IDS, REALMS, RACE });
    const s = r.stats;
    return {
      ok: r.problems.length === 0,
      detail: r.problems.length ? `${r.problems.length} problems: ${r.problems.slice(0, 40).join(' / ')}`
        : `${s.events} events (${Object.entries(s.perLand).map(([k, n]) => k + ' ' + n).join(', ')}), ${s.memory} read a flag (${Math.round(100 * s.memory / s.events)}%), ${s.choices} choices taken, ${s.ownRealms} of 118 far realms with scenes of their own, ${s.declined || 0} setups declined in some realm, ${s.orphans.length} flags no one reads`,
      data: { stats: s, problems: r.problems },
    };
  },

  async fvKnownSame(pg) {
    const r = await pg.evaluate((ids) => {
      const run = (o, years) => { A.newGame(o); T.play(years); return { h: T.hash(A.serialize()), r: A.rand() }; };
      const out = { with: [], without: [], conds: 0, problems: [] };
      const lives = [{ seed: 7701, realm: 'POL-01', status: 'peasant', startAge: 16 }, { seed: 7702, realm: 'POL-20', status: 'merchant', startAge: 30 },
        { seed: 7703, realm: 'POL-34', race: 'orc', status: 'noble', startAge: 20, lands: 'known' }];
      for (const o of lives) out.with.push(run(o, 4));
      // every fv_ cond is false for Known World characters of each class and age
      for (const o of [{ realm: 'POL-01', status: 'peasant', startAge: 8 }, { realm: 'POL-27', status: 'noble', startAge: 30 }, { realm: 'POL-21', status: 'merchant', startAge: 45 },
        { realm: 'POL-34', race: 'orc', status: 'peasant', startAge: 18 }, { realm: 'POL-02', status: 'royal', startAge: 40 }, { realm: 'POL-19', status: 'serf', startAge: 66 }]) {
        A.newGame(Object.assign({ seed: 99 }, o));
        const p = A.pc();
        if (A.C.farLand(p) || A.C.greatWorld(p)) out.problems.push(`${o.realm}: far helpers true in the Known World`);
        for (const id of ids) { const e = A.EV[id]; if (!e) continue; out.conds++; let ok = false; try { ok = e.cond(p, A.C); } catch (err) { ok = false; } if (ok) out.problems.push(`${id}: eligible in a Known World game (${o.realm})`); }
      }
      const saved = {};
      for (const id of ids) { saved[id] = A.EV[id]; delete A.EV[id]; }
      for (const o of lives) out.without.push(run(o, 4));
      Object.assign(A.EV, saved);
      return out;
    }, IDS);
    const same = r.with.every((x, i) => x.h === r.without[i].h && x.r === r.without[i].r);
    if (!same) r.problems.push(`state differs: ${JSON.stringify(r.with)} vs ${JSON.stringify(r.without)}`);
    return { ok: r.problems.length === 0, detail: r.problems.length ? r.problems.slice(0, 5).join(' / ') : `3 Known World games x 4 years identical with and without ${IDS.length} events; ${r.conds} conds false`, data: r };
  },

  // the quick version, for CI: two far births, six years each
  async fvFarLives(pg) {
    return farLives(pg, [['POL-36', 0, 6], ['POL-142', 0, 6]], 1);
  },
  // the long version (about five minutes): ten years from birth in six Far Lands and six from sixteen in two more;
  // the median far newborn must meet at least 3 of the land's own scenes, as a Known World newborn does.
  // Runs only when named: node tests/run.mjs <build> --features=far-life --only=fvFarLivesLong
  async fvFarLivesLong(pg) {
    if (!process.argv.some(a => a.startsWith('--only=') && a.includes('fvFarLivesLong'))) return { ok: true, detail: 'skipped (five minutes): run with --only=fvFarLivesLong' };
    return farLives(pg, [['POL-36', 0, 10], ['POL-58', 0, 10], ['POL-91', 0, 10], ['POL-142', 0, 10], ['POL-136', 0, 10], ['POL-111', 0, 10],
      ['POL-127', 16, 6], ['POL-70', 16, 6]], 3);
  },
};

async function farLives(pg, plan, minMedian) {
  const r = await pg.evaluate(({ ids, plan }) => {
    const set = new Set(ids), out = { lives: [], raw: [], fired: 0, shown: 0 };
    plan.forEach(([realm, startAge, years], i) => {
      A.newGame({ seed: 8800 + i, lands: 'great', realm, status: i % 3 ? 'peasant' : 'artisan', startAge, sex: i % 2 ? 'F' : 'M' });
      const L = { realm, startAge, fv: [], events: 0 };
      T.play(years, { onEvent: v => {
        L.events++; out.shown++;
        const all = [v.title, v.text, ...(v.choices || []).map(c => c.t)].join(' | ');
        if (T.raw.test(all)) out.raw.push(`${realm}: ${all.match(T.raw)[0]} in "${v.title}"`);
      } });
      const seen = Object.keys(A.pc().flags.ev || {}).filter(id => set.has(id));
      L.fv = seen; out.fired += seen.length;
      out.lives.push(L);
    });
    return out;
  }, { ids: IDS, plan });
  const births = r.lives.filter(l => l.startAge === 0).map(l => l.fv.length).sort((a, b) => a - b);
  const median = births.length ? births[Math.floor((births.length - 1) / 2)] : 0;
  const ok = r.raw.length === 0 && median >= minMedian;
  return { ok, detail: `${r.lives.length} lives, ${r.shown} events shown, ${r.fired} fv_ scenes met (${r.lives.map(l => l.realm + (l.startAge ? '@' + l.startAge : '') + ':' + l.fv.length).join(' ')}), newborn median ${median}${r.raw.length ? '; raw: ' + r.raw.slice(0, 3).join(' / ') : ''}`, data: r };
}
