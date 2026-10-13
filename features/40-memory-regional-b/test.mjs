// Browser test for features/40-memory-regional-b. One test, mrxMemory, in four parts:
//   1. static: every event has the right shape, budget (80/12/45 words), weight, once, and a timed flag gate
//   2. coverage: each of the 27 chunk flags is read by some event's cond, and no mrx_* flag is left unread
//   3. play: every event is made eligible (realm, age, flag set N years back), rendered, and every choice is
//      taken on both its win and lose branch, checking for engine errors, raw {tokens} and the flags it sets
//   4. continuity: the person a setter or arc step links to you is the one the later callback brings back
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(here, 'regional-b.events.js');

// The orphan flags of chunk "regional-b": set by a regional story event, read by nothing before this feature.
export const CHUNK_FLAGS = [
  'ss_ab_tekle', 'ss_ab_clause', 'ss_sb_token', 'ss_sb_notebook', 'ss_sb_weights', 'ss_sb_hazimi', 'ss_sb_crew',
  'ss_sk_still', 'ss_sk_doubt', 'ss_sk_blades', 'ss_sk_guide', 'ss_sk_dragon', 'ss_rp_bladehall', 'ss_rp_mahout',
  'ss_rp_calf', 'ss_rp_unbound', 'ss_rp_taster', 'ss_rp_paper', 'ss_br_told', 'ss_br_tessar', 'ss_br_redsail',
  'ss_br_pilot', 'ss_br_forty', 'ss_br_book', 'ss_ks_kito', 'ss_sb_salwa', 'ss_rp_tollbook',
];
// Setters whose winning choice links a person in the same moment it sets the flag: [event, choice index, flag].
const LINKED_SETTERS = [['ss_ab_sealed', 0, 'ss_ab_clause'], ['ss_br_wheresleeps', 2, 'ss_br_told']];
// Effects that leave a mark the game keeps: a trait, a flag, a relation, a wound, a deed, a title, a debt...
const LASTING = ['trait', 'flag', 'them', 'newRel', 'wound', 'deed', 'epithet', 'owed', 'oweThem', 'gear', 'job', 'prison', 'secret', 'letter'];
const TICS = /looks at you (for )?a long time|for the rest of your life|\bNobody\b/;

const words = s => (String(s).match(/\S+/g) || []).length;

function loadStatic() {
  const events = [];
  const stub = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : stub()), apply: () => stub() });
  const A = new Proxy({ defEvents: list => events.push(...list) }, { get: (t, k) => (k in t ? t[k] : stub()) });
  vm.runInNewContext(fs.readFileSync(FILE, 'utf8'), { A, GD: stub(), LORE: stub(), console }, { filename: FILE });
  return events;
}

function staticChecks(events) {
  const problems = [], seen = new Set();
  for (const e of events) {
    const at = e.id;
    if (!/^mrx_[a-z0-9_]+$/.test(e.id)) problems.push(`${at}: id must start with mrx_`);
    if (seen.has(e.id)) problems.push(`${at}: duplicate id`); seen.add(e.id);
    if (e.w !== 2 && e.w !== 3) problems.push(`${at}: w should be 2 or 3`);
    if (e.once !== true) problems.push(`${at}: should be once: true`);
    const cs = e.cond ? e.cond.toString() : '';
    const gates = [...cs.matchAll(/C\.flag\(p, "([a-z0-9_]+)"\) && A\.S\.year - p\.flags\.([a-z0-9_]+) >= (\d+)/g)];
    if (!gates.length || gates.some(g => g[1] !== g[2] || +g[3] < 2 || +g[3] > 20)) problems.push(`${at}: cond needs C.flag(p, "x") && A.S.year - p.flags.x >= N (2..20)`);
    if (typeof e.text === 'string' && words(e.text) > 80) problems.push(`${at}: text ${words(e.text)} words`);
    const src = [typeof e.text === 'function' ? e.text.toString() : e.text, e.title];
    const ch = e.choices || [];
    if (ch.length < 2 || ch.length > 4) problems.push(`${at}: ${ch.length} choices`);
    let marks = 0;
    ch.forEach((c, i) => {
      if (words(c.t) > 12) problems.push(`${at} choice ${i + 1}: label ${words(c.t)} words`);
      for (const b of c.check ? [c.win, c.lose] : [c]) {
        if (!b || typeof b.r !== 'string') { problems.push(`${at} choice ${i + 1}: missing result text`); continue; }
        if (words(b.r) > 45) problems.push(`${at} choice ${i + 1}: result ${words(b.r)} words`);
        src.push(b.r);
        if (b.fx && Object.keys(b.fx).some(k => LASTING.includes(k))) marks++;
      }
      src.push(c.t);
    });
    if (!marks) problems.push(`${at}: no branch leaves a lasting mark`);
    const tic = src.find(s => TICS.test(String(s)));
    if (tic) problems.push(`${at}: house tic in "${String(tic).slice(0, 60)}"`);
  }
  return problems;
}

export default {
  async mrxMemory(pg) {
    const events = loadStatic();
    const problems = staticChecks(events);
    const ids = events.map(e => e.id);
    const r = await pg.evaluate(({ ids, flags, linked }) => {
      const out = { problems: [], played: 0, branches: 0, arcs: [], continuity: 0, reach: {} };
      const bad = s => out.problems.push(s);
      const RAW = /\{[A-Za-z0-9_.]+\}/, w = s => (String(s || '').match(/\S+/g) || []).length;
      const mine = ids.map(id => A.EV[id]).filter(Boolean);
      for (const id of ids) if (!A.EV[id]) bad(`${id}: not registered`);
      // classifier: a memory event must not be hidden by the tavern/street/errand/favor text filters
      for (const e of mine) { const a = A.evAudience(e); for (const k in a.txt) if (a.txt[k]) bad(`${e.id}: text classed as ${k}`); }

      // ---- coverage
      const all = Object.values(A.EV);
      const readers = f => all.filter(e => e.cond && e.cond.toString().includes(`"${f}"`));
      for (const f of flags) {
        const rd = readers(f);
        if (!rd.length) bad(`${f}: no event reads it`);
        else if (!rd.some(e => ids.includes(e.id))) bad(`${f}: not read by any mrx_ event`);
      }
      const setsOf = e => (e.choices || []).flatMap((c, i) => [[c, null], [c.win, true], [c.lose, false]].filter(([b]) => b && b.fx && b.fx.flag).map(([b, win]) => ({ flag: b.fx.flag, i, win, them: !!b.fx.them })));
      for (const e of mine) for (const s of setsOf(e)) {
        const rd = readers(s.flag).filter(x => x.id !== e.id && ids.includes(x.id));
        if (!rd.length) bad(`${e.id}: sets ${s.flag}, which nothing in this feature reads`);
        else if (!out.arcs.some(a => a.flag === s.flag)) out.arcs.push({ flag: s.flag, from: e.id, to: rd.map(x => x.id) });
      }

      // ---- play
      const errs = []; const ce = console.error; console.error = (...a) => errs.push(a.map(x => String(x && x.message || x)).join(' ').slice(0, 160));
      const realmOf = e => (e.cond.toString().match(/C\.realm\(p, "(POL-\d+)"/) || [])[1] || 'POL-33';
      const posFlags = e => [...e.cond.toString().matchAll(/(^|[^!])C\.flag\(p, "([a-z0-9_]+)"\)/g)].map(m => m[2]);
      const bases = {};
      const basesFor = realm => bases[realm] || (bases[realm] = [['peasant', 30], ['merchant', 45], ['noble', 34], ['peasant', 70]].map(([status, age], k) => {
        A.newGame({ seed: 7300 + k, race: 'human', realm, status, startAge: 26, sex: k % 2 ? 'F' : 'M' });
        const pc = A.pc(); pc.born = A.S.year - age;
        return A.serialize();
      }));
      const prep = (base, fl, off) => {
        A.deserialize(JSON.parse(base));
        const pc = A.pc(); for (const f of fl) pc.flags[f] = A.S.year - off;
        pc.coin = Math.max(pc.coin, 500); A.S.queue = [];
        return pc;
      };
      const oddsWas = A.checkOdds;
      try {
        for (const e of mine) {
          const fl = posFlags(e);
          let hit = null;
          for (const base of basesFor(realmOf(e))) {
            for (const off of [3, 6, 10, 14, 20]) {
              const pc = prep(base, fl, off);
              let okc = false; try { okc = !!e.cond(pc, A.C); } catch (err) { bad(`${e.id}: cond throws ${err.message}`); }
              if (okc) { hit = { base, off, age: A.age(pc), status: pc.status }; break; }
            }
            if (hit) break;
          }
          if (!hit) { bad(`${e.id}: not eligible for any test character in ${realmOf(e)}`); continue; }
          out.reach[e.id] = `${hit.status} ${hit.age}, flag ${hit.off}y back`;
          const q0 = { type: 'event', ev: e.id }; prep(hit.base, fl, hit.off); A.S.queue.unshift(q0);
          const v = A.eventView(q0);
          if (v.skip) { bad(`${e.id}: skipped by the engine (setup failed or unfilled token)`); continue; }
          const shown = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
          if (RAW.test(shown)) bad(`${e.id}: raw token ${shown.match(RAW)[0]}`);
          if (w(v.text) > 80) bad(`${e.id}: rendered text ${w(v.text)} words`);
          for (const c of v.choices) if (w(c.t) > 12) bad(`${e.id}: rendered choice "${c.t}" ${w(c.t)} words`);
          if (v.choices.length !== e.choices.length) bad(`${e.id}: only ${v.choices.length} of ${e.choices.length} choices shown with 500 coin`);
          if (e.setup && q0.ctx.pid && !(A.P(q0.ctx.pid) && A.P(q0.ctx.pid).alive)) bad(`${e.id}: ctx.pid is not a living person`);
          out.played++;
          e.choices.forEach((c, i) => {
            for (const win of c.check ? [true, false] : [null]) {
              const pc = prep(hit.base, fl, hit.off);
              const q = { type: 'event', ev: e.id }; A.S.queue.unshift(q);
              const vv = A.eventView(q), idx = vv.choices.findIndex(x => x.i === i);
              if (idx < 0) { bad(`${e.id} choice ${i + 1}: not offered`); continue; }
              A.checkOdds = () => (win === false ? 0 : 100);
              errs.length = 0;
              try { A.eventChoose(idx); } catch (err) { bad(`${e.id} choice ${i + 1}: throws ${err.message}`); continue; } finally { A.checkOdds = oddsWas; }
              const res = (A.S.queue[0] && A.S.queue[0].result) || {};
              const tag = `${e.id} choice ${i + 1}${win == null ? '' : win ? ' win' : ' lose'}`;
              if (errs.length) bad(`${tag}: engine error ${errs[0]}`);
              if (RAW.test(res.text || '')) bad(`${tag}: raw token in result`);
              if (!res.text) bad(`${tag}: empty result`);
              const b = win == null ? c : win ? c.win : c.lose;
              if (b.fx && b.fx.flag && pc.flags[b.fx.flag] !== A.S.year) bad(`${tag}: did not set ${b.fx.flag}`);
              if (b.fx && b.fx.them && b.fx.them.type && q.ctx.pid && !(pc.rel[q.ctx.pid] && pc.rel[q.ctx.pid].type === b.fx.them.type)) bad(`${tag}: relation with {them} not set to ${b.fx.them.type}`);
              try { A.eventClose(); } catch (err) { bad(`${tag}: close throws ${err.message}`); }
              out.branches++;
            }
          });
        }

        // ---- continuity: the person linked when a flag is set comes back in the callback that reads it
        const chains = linked.map(([ev, i, flag]) => ({ ev, i, win: true, flag }));
        for (const e of mine) for (const s of setsOf(e)) if (s.them) chains.push({ ev: e.id, i: s.i, win: s.win, flag: s.flag });
        for (const ch of chains) {
          const readersOf = mine.filter(x => x.setup && /\bfind\(/.test(x.setup.toString()) && posFlags(x).includes(ch.flag));
          if (!readersOf.length) continue;
          const setter = A.EV[ch.ev]; if (!setter) { bad(`continuity: no setter ${ch.ev}`); continue; }
          for (const rd of readersOf) {
            const realm = (rd.cond.toString().match(/C\.realm\(p, "(POL-\d+)"/) || [])[1] || (setter.cond.toString().match(/C\.realm\(p,"(POL-\d+)"/) || [])[1] || 'POL-33';
            const pc = prep(basesFor(realm)[0], posFlags(setter).filter(f => f !== ch.flag), 6);
            const q = { type: 'event', ev: ch.ev }; A.S.queue.unshift(q);
            const v = A.eventView(q), idx = v.choices.findIndex(x => x.i === ch.i);
            A.checkOdds = () => (ch.win === false ? 0 : 100);
            const before = new Set(Object.keys(pc.rel));
            try { A.eventChoose(idx); } finally { A.checkOdds = oddsWas; }
            A.eventClose();
            const who = q.ctx && q.ctx.pid && pc.rel[q.ctx.pid] ? q.ctx.pid : Object.keys(pc.rel).find(id => !before.has(id));
            if (!who || pc.flags[ch.flag] !== A.S.year) { bad(`continuity ${ch.ev} -> ${rd.id}: setter did not link a person and set ${ch.flag}`); continue; }
            // let the years pass: move the flag and the relation back together, then fire the reader
            const n = 12; pc.flags[ch.flag] -= n; pc.rel[who].since -= n;
            for (const f of posFlags(rd)) if (pc.flags[f] == null) pc.flags[f] = A.S.year - n;
            if (!rd.cond(pc, A.C)) { bad(`continuity ${ch.ev} -> ${rd.id}: reader not eligible after ${n} years`); continue; }
            const q2 = { type: 'event', ev: rd.id }; A.S.queue = [q2];
            const v2 = A.eventView(q2);
            if (v2.skip || String(q2.ctx.pid) !== String(who)) bad(`continuity ${ch.ev} -> ${rd.id}: brought back ${q2.ctx.pid}, expected ${who}`);
            else out.continuity++;
            A.S.queue = [];
          }
        }
      } finally { console.error = ce; A.checkOdds = oddsWas; }
      out.problems = [...new Set(out.problems)];
      return out;
    }, { ids, flags: CHUNK_FLAGS, linked: LINKED_SETTERS });
    problems.push(...r.problems);
    if (r.arcs.length < 5) problems.push(`only ${r.arcs.length} two-step arcs (want 5 or more)`);
    const detail = `${ids.length} events, ${CHUNK_FLAGS.length} chunk flags read, ${r.arcs.length} arcs, ${r.played} played, ` +
      `${r.branches} branches taken, ${r.continuity} people carried across years` + (problems.length ? `; ${problems.length} problems: ${problems.slice(0, 6).join('; ')}` : '');
    return { ok: problems.length === 0, detail, data: { problems, arcs: r.arcs, reach: r.reach } };
  },
};
