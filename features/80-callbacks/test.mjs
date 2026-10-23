// Browser tests for the callback pack (callbacks.events.js).
//
// cbFlagsRead   every cb_ event is registered, reads at least one memory in its cond (C.flag(p, "x") or had(p, "k")),
//               and every memory it reads is set by some other live event (not retired, not another cb_ event). The
//               bench's own memoryIndex counts each cb_ event as a memory event, and none of the flags they read is
//               left an orphan.
// cbPlay        every cb_ event, under three characters with its memory set ten years back: the engine renders it
//               without skipping, with no raw {token}, text within 80 words and labels within 12; every choice
//               runs (checks both won and lost) with no engine error.
// cbBotLives    bot lives with a few of these memories seeded at birth play on with no page error, and some cb_
//               events fire.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOT } from '../../bench/bot.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(HERE, 'callbacks.events.js'), 'utf8');
const IDS = [...SRC.matchAll(/\bid: "(cb_[a-z0-9_]+)"/g)].map(m => m[1]);

// what each cond reads: flags, and the marks had(p, 'k') reads (the bench calls them la_k). Installed in the page
// as window.CBREADS (the page's policy forbids eval, so it goes in as a function of its own)
const INSTALL = () => { window.CBREADS = () => {
  const out = {};
  for (const id of Object.keys(A.EV).filter(k => k.startsWith('cb_'))) {
    const cs = A.EV[id].cond ? A.EV[id].cond.toString() : '';
    out[id] = [...cs.matchAll(/C\.flag\(p, "([A-Za-z0-9_]+)"\)|had\(p, "([A-Za-z0-9_]+)"\)/g)].map(m => (m[1] ? m[1] : 'la_' + m[2]));
  }
  return out;
}; };

export default {
  async cbFlagsRead(pg) {
    await pg.evaluate(BOT); await pg.evaluate(INSTALL);
    const r = await pg.evaluate(({ IDS }) => {
      const reads = window.CBREADS();
      const M = B.memoryIndex(), ret = new Set(A.EV_RETIRED || []);
      const out = { missing: IDS.filter(id => !A.EV[id]), noRead: [], unset: [], notMemory: [], orphanRead: [], flags: new Set() };
      for (const id of IDS) {
        if (!A.EV[id]) continue;
        const fl = reads[id] || [];
        if (!fl.length) out.noRead.push(id);
        if (!M.memory.has(id)) out.notMemory.push(id);
        for (const f of fl) {
          out.flags.add(f);
          const by = [...(M.setters[f] || [])].filter(s => !s.startsWith('cb_') && A.EV[s] && !ret.has(s));
          if (!by.length) out.unset.push(`${id} reads ${f}`);
          if (M.orphan.includes(f)) out.orphanRead.push(f);
        }
      }
      out.flags = out.flags.size;
      return out;
    }, { IDS});
    const ok = IDS.length >= 150 && !r.missing.length && !r.noRead.length && !r.unset.length && !r.notMemory.length && !r.orphanRead.length;
    return {
      ok,
      detail: `${IDS.length} events read ${r.flags} memories, each set by a live event` +
        (r.missing.length ? `; not registered: ${r.missing.slice(0, 6).join(', ')}` : '') +
        (r.noRead.length ? `; read no memory: ${r.noRead.slice(0, 6).join(', ')}` : '') +
        (r.unset.length ? `; nothing live sets: ${r.unset.slice(0, 6).join(', ')}` : '') +
        (r.notMemory.length ? `; not a memory event to the bench: ${r.notMemory.slice(0, 6).join(', ')}` : '') +
        (r.orphanRead.length ? `; still orphans: ${r.orphanRead.slice(0, 6).join(', ')}` : ''),
      data: r,
    };
  },

  async cbPlay(pg) {
    await pg.evaluate(INSTALL);
    const r = await pg.evaluate(({ IDS }) => {
      const reads = window.CBREADS();
      const RAW = /\{[A-Za-z0-9_.]+\}/, w = s => (String(s || '').match(/\S+/g) || []).length;
      const out = { played: 0, branches: 0, eligible: 0, problems: [] };
      let cur = '';
      const ce = console.error; console.error = (...a) => { out.problems.push(`${cur}: engine error: ${a.map(x => String(x && x.message || x)).join(' ').slice(0, 160)}`); };
      const chance = A.chance;
      const people = [
        { race: 'human', realm: 'POL-01', status: 'peasant', startAge: 34 },
        { race: 'human', realm: 'POL-05', status: 'noble', startAge: 70 },
        { race: 'dwarf', realm: 'POL-20', status: 'artisan', startAge: 90 },
      ];
      try {
        for (const o of people) {
          A.newGame(Object.assign({ seed: 8080, sex: o.startAge % 2 ? 'F' : 'M' }, o));
          const pc = A.pc(); pc.prison = null;
          const base = A.serialize();
          for (const id of IDS) {
            const e = A.EV[id]; if (!e) continue;
            // the memory this event reads, ten years back: a flag, an old-age mark, or a mark on a bond
            A.deserialize(JSON.parse(base));
            const me = A.pc();
            for (const f of reads[id] || []) {
              if (!f.startsWith('la_')) { me.flags[f] = A.S.year - 10; continue; }
              const k = f.slice(3);
              if (/^ni/.test(k)) { const t = A.makeAcquaintance(me, 'friend'); A.link(me, t, 'friend', 40, 'friend'); me.rel[t.id][k] = A.S.year - 10; }
              else { me.oa = me.oa || {}; me.oa.m = me.oa.m || {}; me.oa.m[k] = A.S.year - 10; me.oa.m[k + '_who'] = 'Wenna'; }
            }
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
    }, { IDS});
    const ok = r.played >= IDS.length * 2 && !r.problems.length;
    return {
      ok,
      detail: `${r.played} renders, ${r.branches} branches played, ${r.eligible} conds held with the memory set` +
        (r.problems.length ? `; ${r.problems.length} problems: ${r.problems.slice(0, 8).join(' | ')}` : ''),
      data: r,
    };
  },

  async cbBotLives(pg, errs, { lives }) {
    await pg.evaluate(BOT); await pg.evaluate(INSTALL);
    const n = Math.max(3, Math.min(4, lives || 4));
    const STARTS = [
      { race: 'human', realm: 'POL-01', status: 'peasant' }, { race: 'human', realm: 'POL-05', status: 'merchant' },
      { race: 'human', realm: 'POL-01', status: 'noble' }, { race: 'human', realm: 'POL-07', status: 'serf' },
      { race: 'orc', realm: 'POL-11', status: 'peasant' }, { race: 'dwarf', realm: 'POL-20', status: 'artisan' },
    ];
    const got = { lives: 0, fired: 0, kinds: new Set(), years: 0 };
    for (let i = 0; i < n; i++) {
      const r = await pg.evaluate(({ o, i }) => {
        const reads = window.CBREADS();
        // seed a past: eight of the memories these events read, set at birth (the world forgets nothing)
        const flags = [...new Set(Object.values(reads).flat().filter(f => !f.startsWith('la_')))].sort();
        const pickN = flags.filter((f, j) => (j * 7 + i * 13) % flags.length < 8);
        const ng = A.newGame;
        A.newGame = function () { const res = ng.apply(this, arguments); const pc = A.pc(); for (const f of pickN) pc.flags[f] = A.S.year - 6; return res; };
        let L;
        try { L = B.life(o, ['careful', 'random', 'greedy'][i % 3], false, 45); } finally { A.newGame = ng; }
        const seen = Object.keys((A.pc() && A.pc().flags.ev) || {}).filter(k => k.startsWith('cb_'));
        return { years: L.years, seen };
      }, { o: Object.assign({ seed: 5150 + i * 31, sex: i % 2 ? 'F' : 'M' }, STARTS[i % STARTS.length]), i});
      got.lives++; got.years += r.years; got.fired += r.seen.length; for (const k of r.seen) got.kinds.add(k);
    }
    const ok = !errs.length && got.fired >= 1;
    return { ok, detail: `${got.lives} bot lives (${got.years} years), ${got.fired} callbacks fired, ${got.kinds.size} kinds: ${[...got.kinds].slice(0, 6).join(', ')}`, data: { fired: got.fired, kinds: [...got.kinds] } };
  },
};
