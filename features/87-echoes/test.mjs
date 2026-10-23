// Browser tests for the echo packs (*.events.js in this folder).
//
// ecReadsReal  every ec_ event is registered, names its source (ecSrc), and the source is a live event (not retired,
//              not another echo). Its cond reads that source: saw(p.flags.ev, "src", n) on the year the player last
//              saw it, or C.flag(p, "x") on a flag the source's own choices set. Every choice it asks about with
//              took(p, "src", i) is one of the source's choices; won / lost ask about a choice with a check. The bench's
//              memoryIndex counts each echo as a memory event.
// ecPlay       every echo, under three characters with its source seen ten years back (and the choice, the check and
//              the person its cond asks for put in the record): renders without a skip, no raw {token}, text within
//              80 words and labels within 12; every choice played, checks both won and lost, no engine error.
// ecBotLives   a few bot lives play on with no page error, the record fills, and some echoes fire.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOT } from '../../bench/bot.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readdirSync(HERE).filter(f => f.endsWith('.events.js')).map(f => fs.readFileSync(path.join(HERE, f), 'utf8')).join('\n');
const IDS = [...SRC.matchAll(/\bid: "(ec_[a-z0-9_]+)"/g)].map(m => m[1]);

// what each echo's cond reads, parsed from its source text. Installed in the page as window.ECREADS (the page's
// policy forbids eval, so it goes in as a function of its own)
const INSTALL = () => { window.ECREADS = () => {
  const out = {};
  for (const id of Object.keys(A.EV).filter(k => k.startsWith('ec_'))) {
    const e = A.EV[id], cs = e.cond ? e.cond.toString() : '';
    const r = { src: e.ecSrc || null, saw: [], flags: [], took: [], won: [], lost: [], who: [] };
    for (const m of cs.matchAll(/saw\(p\.flags\.ev, "([a-z0-9_]+)"(?:, (\d+))?(?:, (\d+))?\)/g)) r.saw.push({ id: m[1], min: +(m[2] || 3), max: +(m[3] || 40) });
    for (const m of cs.matchAll(/C\.flag\(p, "([A-Za-z0-9_]+)"\)/g)) r.flags.push(m[1]);
    for (const m of cs.matchAll(/took\(p, "([a-z0-9_]+)", ([\d, ]+)\)/g)) r.took.push({ id: m[1], i: m[2].split(',').map(Number) });
    for (const m of cs.matchAll(/\bwon\(p, "([a-z0-9_]+)"\)/g)) r.won.push(m[1]);
    for (const m of cs.matchAll(/\blost\(p, "([a-z0-9_]+)"\)/g)) r.lost.push(m[1]);
    for (const m of cs.matchAll(/\bwho\(p, "([a-z0-9_]+)"\)/g)) r.who.push(m[1]);
    out[id] = r;
  }
  return out;
};
// give the player the past this echo asks for, ago years back: the flags it reads, the source seen, the record
window.ECSEED = (me, r, ago) => {
  const y = A.S.year - ago;
  for (const f of r.flags) me.flags[f] = y;
  me.flags.ev = me.flags.ev || {};
  if (r.src) {
    me.flags.ev[r.src] = y;
    const t = r.took.length ? r.took[0].i[0] : 0;
    const ok = r.won.length ? 1 : r.lost.length ? 0 : -1;
    let pid = null;
    if (r.who.length) { const q = A.makeAcquaintance(me, 'acquaint'); A.link(me, q, 'acquaint', 10, 'acquaint'); pid = q.id; }
    me.ec = me.ec || {};
    me.ec[r.src] = [y, t, ok, pid];
  }
}; };

export default {
  async ecReadsReal(pg) {
    await pg.evaluate(BOT); await pg.evaluate(INSTALL);
    const r = await pg.evaluate(({ IDS }) => {
      const reads = window.ECREADS(), M = B.memoryIndex();
      const ret = A.EV_RETIRED instanceof Set ? A.EV_RETIRED : new Set(A.EV_RETIRED || []);
      const out = { missing: IDS.filter(id => !A.EV[id]), problems: [], sources: new Set(), byFlag: 0, bySeen: 0 };
      for (const id of IDS) {
        const e = A.EV[id], x = reads[id]; if (!e || !x) continue;
        const s = x.src, src = s && A.EV[s];
        if (!s) { out.problems.push(`${id}: no ecSrc`); continue; }
        if (!src) { out.problems.push(`${id}: source ${s} is not an event`); continue; }
        if (ret.has(s)) out.problems.push(`${id}: source ${s} is retired`);
        if (s.startsWith('ec_') || s.startsWith('cb_')) out.problems.push(`${id}: source ${s} is itself an echo or callback`);
        out.sources.add(s);
        const named = [...x.saw.map(a => a.id), ...x.took.map(a => a.id), ...x.won, ...x.lost, ...x.who];
        for (const n of named) if (n !== s) out.problems.push(`${id}: reads ${n}, but its source is ${s}`);
        const flagOk = x.flags.length && x.flags.every(f => M.setters[f] && M.setters[f].has(s));
        if (!x.saw.length && !flagOk) out.problems.push(`${id}: reads neither the sighting of ${s} nor a flag ${s} sets (${x.flags.join(', ') || 'none'})`);
        if (x.flags.length && !flagOk) out.problems.push(`${id}: a flag it reads is not set by ${s}: ${x.flags.filter(f => !(M.setters[f] && M.setters[f].has(s))).join(', ')}`);
        if (x.saw.length) out.bySeen++; else out.byFlag++;
        for (const t of x.took) for (const i of t.i) if (!src.choices || !src.choices[i]) out.problems.push(`${id}: asks for choice ${i} of ${s}, which has ${(src.choices || []).length}`);
        if (x.won.length || x.lost.length) for (const t of x.took) for (const i of t.i) if (src.choices[i] && !src.choices[i].check) out.problems.push(`${id}: asks whether choice ${i} of ${s} was won, but it has no check`);
        if (!M.memory.has(id)) out.problems.push(`${id}: not a memory event to the bench`);
      }
      out.sources = out.sources.size;
      return out;
    }, { IDS });
    const ok = IDS.length >= 300 && !r.missing.length && !r.problems.length;
    return {
      ok,
      detail: `${IDS.length} echoes of ${r.sources} live sources (${r.bySeen} read the sighting, ${r.byFlag} a flag the source sets)` +
        (r.missing.length ? `; not registered: ${r.missing.slice(0, 6).join(', ')}` : '') +
        (r.problems.length ? `; ${r.problems.length} problems: ${r.problems.slice(0, 8).join(' | ')}` : ''),
      data: r,
    };
  },

  async ecPlay(pg) {
    await pg.evaluate(INSTALL);
    const r = await pg.evaluate(({ IDS }) => {
      const reads = window.ECREADS();
      const RAW = /\{[A-Za-z0-9_.]+\}/, w = s => (String(s || '').match(/\S+/g) || []).length;
      const out = { played: 0, branches: 0, eligible: 0, problems: [] };
      let cur = '';
      const ce = console.error; console.error = (...a) => { out.problems.push(`${cur}: engine error: ${a.map(x => String(x && x.message || x)).join(' ').slice(0, 160)}`); };
      const chance = A.chance;
      const people = [
        { race: 'human', realm: 'POL-01', status: 'peasant', startAge: 34 },
        { race: 'human', realm: 'POL-05', status: 'noble', startAge: 56 },
        { race: 'dwarf', realm: 'POL-20', status: 'artisan', startAge: 90 },
      ];
      try {
        for (const o of people) {
          A.newGame(Object.assign({ seed: 8787, sex: o.startAge % 2 ? 'F' : 'M' }, o));
          const pc = A.pc(); pc.prison = null;
          const base = A.serialize();
          for (const id of IDS) {
            const e = A.EV[id], x = reads[id]; if (!e || !x) continue;
            A.deserialize(JSON.parse(base));
            const me = A.pc();
            const lo = Math.max(...x.saw.map(a => a.min), 0), hi = Math.min(...x.saw.map(a => a.max), 40);
            window.ECSEED(me, x, Math.max(lo, Math.min(10, hi)));
            try { if (e.cond(me, A.C)) out.eligible++; } catch (err) { out.problems.push(`${id}: cond throws: ${err.message}`); continue; }
            const withMem = A.serialize();
            const n = (e.choices || []).length;
            for (let i = 0; i < n; i++) for (const force of e.choices[i].check ? [true, false] : [null]) {
              A.deserialize(JSON.parse(withMem)); A.S.queue = [];
              const q = { type: 'event', ev: id }; A.S.queue.unshift(q);
              cur = `${id} (${o.status}) choice ${i + 1}${force == null ? '' : force ? ' won' : ' lost'}`;
              const v = A.eventView(q);
              if (v.skip) { if (!(q.ctx && q.ctx.skip)) out.problems.push(`${cur}: skipped by the engine: ${([v.title, v.text].join(' ').match(RAW) || ['?'])[0]}`); break; }
              if (i === 0 && force !== false) {
                out.played++;
                const all = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
                if (RAW.test(all)) out.problems.push(`${cur}: raw token ${all.match(RAW)[0]}`);
                if (w(v.text) > 80) out.problems.push(`${cur}: text ${w(v.text)} words`);
                for (const c of v.choices) if (w(c.t) > 12) out.problems.push(`${cur}: label ${w(c.t)} words`);
              }
              const idx = v.choices.findIndex(c => c.i === i); if (idx < 0) continue;   // a choice its req hides here
              if (force != null) A.chance = () => force;
              try {
                A.eventChoose(idx);
                const res = A.S.queue[0] && A.S.queue[0].result;
                const rt = res ? String(res.text || res.r || '') : '';
                if (RAW.test(rt)) out.problems.push(`${cur}: raw token in result ${rt.match(RAW)[0]}`);
                A.eventClose();
                out.branches++;
              } catch (err) { out.problems.push(`${cur}: throws: ${err.message}`); }
              finally { A.chance = chance; }
            }
          }
        }
      } finally { console.error = ce; A.chance = chance; }
      out.problems = [...new Set(out.problems)];
      return out;
    }, { IDS });
    const ok = r.played >= IDS.length * 2 && !r.problems.length;
    return {
      ok,
      detail: `${r.played} renders, ${r.branches} branches played, ${r.eligible} conds held with the past set` +
        (r.problems.length ? `; ${r.problems.length} problems: ${r.problems.slice(0, 8).join(' | ')}` : ''),
      data: r,
    };
  },

  async ecBotLives(pg, errs, { lives }) {
    await pg.evaluate(BOT);
    const n = Math.max(3, Math.min(4, lives || 4));
    const STARTS = [
      { race: 'human', realm: 'POL-01', status: 'peasant' }, { race: 'human', realm: 'POL-05', status: 'merchant' },
      { race: 'human', realm: 'POL-01', status: 'noble' }, { race: 'orc', realm: 'POL-11', status: 'peasant' },
    ];
    const got = { lives: 0, fired: 0, events: 0, kinds: new Set(), years: 0, noted: 0 };
    for (let i = 0; i < n; i++) {
      const r = await pg.evaluate(({ o, i }) => {
        const L = B.life(o, ['careful', 'random', 'greedy', 'reckless'][i % 4], i % 2 === 0, 70);
        const pc = A.pc();
        const seen = Object.keys((pc && pc.flags.ev) || {}).filter(k => k.startsWith('ec_'));
        return { years: L.years, events: L.events, seen, noted: Object.keys((pc && pc.ec) || {}).length };
      }, { o: Object.assign({ seed: 8700 + i * 37, sex: i % 2 ? 'F' : 'M' }, STARTS[i % STARTS.length]), i });
      got.lives++; got.years += r.years; got.events += r.events; got.fired += r.seen.length; got.noted += r.noted; for (const k of r.seen) got.kinds.add(k);
    }
    const ok = !errs.length && got.fired >= 1 && got.noted >= 1;
    return { ok, detail: `${got.lives} bot lives (${got.years} years, ${got.events} events), ${got.noted} sources recorded, ${got.fired} echoes fired, ${got.kinds.size} kinds: ${[...got.kinds].slice(0, 6).join(', ')}`, data: { fired: got.fired, kinds: [...got.kinds] } };
  },
};
