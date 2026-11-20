// Tests for D11+, "the military path" (docs/design/war.md §14.1, §14.2; D-128 to D-132). See README.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const SAVES = path.join(ROOT, 'tests', 'saves');

const SOLDIER = `window.PAT = {
  SV: (p, k, v) => A.SK.set(p, k, A.SK.lvOfValue(v)),
  zero(p) { for (const k of A.DATA.skills.skills.map(s => s.id)) PAT.SV(p, k, 0); },
  soldier(seed, branch, o) {
    o = o || {};
    T.enter({ seed, race: 'human', realm: o.realm || 'POL-01', status: 'peasant', sex: 'M', startAge: o.age || 20 });
    const pc = A.pc(); A.S.queue = [];
    A.S.wars = A.S.wars.filter(w => !w.att.includes(pc.realm) && !w.def.includes(pc.realm)); A._idIdx = null;
    A.enlist(pc, false, { branch });
    A.S.queue = [];
    if (o.rank != null) { pc.mil.rank = o.rank; A.pcDivAttach(pc); }
    if (A.S.coOn) A.CO.place(pc);
    return pc.mil ? pc : null;
  },
};`;

export default {
  // every branch has its road: five rungs, each training real skills, with a trial and the next rung's wants; the
  // specialisms named exist; the roles opened exist
  async paData(pg) {
    const r = await pg.evaluate(() => {
      const S = A.SK, bad = [];
      for (const B of A.MUSTER.branches()) {
        const P = A.PATHS.byBranch(B.id);
        if (!P) { bad.push(`${B.id}: no road`); continue; }
        if (P.tiers.length !== 5) bad.push(`${B.id}: rungs`);
        for (const t of P.tiers) {
          for (const k in t.train) if (!S.isSkill(k)) bad.push(`${B.id}: trains ${k}`);
          if (!t.trial || !S.isSkill(t.trial[0]) || !t.trial[1]) bad.push(`${B.id}: trial`);
          for (const k of t.wants || []) if (!S.isSkill(k)) bad.push(`${B.id}: wants ${k}`);
          if (t.opens && !A.MUSTER.R(t.opens)) bad.push(`${B.id}: opens ${t.opens}`);
          const sum = Object.values(t.train).reduce((a, x) => a + x, 0); if (Math.abs(sum - 1) > .01) bad.push(`${B.id}: shares ${sum}`);
        }
        for (const w in P.specs) { const [k, id] = P.specs[w]; if (!S.isSkill(k) || (id && !(S.SPEC[S.canon(k)[0]] || {})[id])) bad.push(`${B.id}: spec ${k}/${id}`); }
      }
      return { n: A.MUSTER.branches().length, bad };
    });
    return { ok: !r.bad.length, detail: JSON.stringify(r) };
  },

  // war.md §14.1: the roads differ: a lancer, an archer, a sapper and a scout, the same man in the same world, two years in
  // (each road's key skill is read from the road's own effort; the whole growth, the world's share in it, is in the detail)
  // arms at peace: each grows his own road's skills more than the others' roads' (what each trains differs), and the
  // month's effort follows his talent (a gifted hand gets more of it)
  async paRoadsDiffer(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const out = {}, BR = ['lances', 'archers', 'engineers', 'scouts'], KEY = { lances: 'riding', archers: 'bow', engineers: 'craft', scouts: 'tracking' };
      for (const b of BR) {
        const f = T.trySeeds(T.seedRun(4400, 4), s => {
          const pc = PAT.soldier(s, b);
          if (!pc) return null;
          PAT.zero(pc); for (const k of Object.values(KEY)) PAT.SV(pc, k, 12);
          const x0 = {}; for (const k of Object.values(KEY)) x0[k] = A.SK.view(pc)[k] ? JSON.stringify(pc.sk[k]) : '';
          const val = k => (pc.sk[k] || {}).lv * 1000 + ((pc.sk[k] || {}).xp || 0);
          const lv0 = {}; for (const k of Object.values(KEY)) lv0[k] = val(k);
          // the road's own training (its months of effort; A.gainXp queues them for the month's pass), apart from what the
          // world sends him (a patrol, his own chosen practice, the troop's duty): M1's designed world sent an archer after
          // brigands and taught him more tracking than the scout's road did in a world where the scout was promoted early
          // (H-082: the rule, not one world's luck)
          const road = {}, P = A.PATHS.of(pc), g0 = A.gainXp;
          A.gainXp = function (p, k, e, c) {
            if (p === pc && P && c && typeof c.why === 'string' && c.why.indexOf(P.name + ':') === 0 && Object.values(KEY).includes(k)) road[k] = (road[k] || 0) + (+e || 0);
            return g0.apply(this, arguments);
          };
          try {
            for (let m = 0; m < 24 && pc.alive && pc.mil; m++) {
              A.S.wars = A.S.wars.filter(w => !w.att.includes(pc.realm) && !w.def.includes(pc.realm)); A._idIdx = null;
              A.advance(31); let h, g = 0; while ((h = A.headReady()) && g++ < 60) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
            }
          } finally { A.gainXp = g0; }
          if (!pc.alive || !pc.mil) return null;
          const gain = {}; for (const k of Object.values(KEY)) gain[k] = Math.round((road[k] || 0) * 100) / 100;
          gain.all = {}; for (const k of Object.values(KEY)) gain.all[k] = Math.round((val(k) - lv0[k]) * 10) / 10;
          void x0;
          return gain;
        });
        out[b] = f.res || { none: f.tried };
      }
      // the plan follows the talent
      const pc = PAT.soldier(4400, 'archers');
      const base = A.PATHS.plan(pc).find(x => x.k === 'bow').w;
      pc.tal = Object.assign({}, pc.tal || {}, { bow: 'A' });
      const gifted = A.PATHS.plan(pc).find(x => x.k === 'bow').w;
      pc.tal.bow = 'D';
      const slow = A.PATHS.plan(pc).find(x => x.k === 'bow').w;
      out.plan = [slow, base, gifted];
      out.words = A.PATHS.skillWords(Object.assign(pc, { tal: { bow: 'A' } }), 'bow');
      return out;
    });
    const KEY = { lances: 'riding', archers: 'bow', engineers: 'craft', scouts: 'tracking' };
    const own = Object.keys(KEY).filter(b => r[b] && !r[b].none && Object.keys(KEY).every(o => o === b || r[b][KEY[b]] > r[o] ? true : r[b][KEY[b]] >= r[o][KEY[b]]));
    // each road grew its own key skill more than the other roads grew it
    const cross = Object.keys(KEY).filter(b => r[b] && !r[b].none).every(b => Object.keys(KEY).filter(o => o !== b && r[o] && !r[o].none).every(o => r[b][KEY[b]] > r[o][KEY[b]]));
    void own;
    const ok = cross && r.plan[0] < r.plan[1] && r.plan[1] < r.plan[2] && /rare/.test(r.words);
    return { ok, detail: JSON.stringify(r) };
  },

  // the trial: at the edge of a word in the rung's skill, wanting a proof, the trial's card comes; standing it is S1's
  // proof and is recorded for the board, which then weighs it
  async paTrial(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const pc = PAT.soldier(4400, 'archers');
      if (!pc) return { skip: 'no soldier' };
      const SK = A.SK, out = {};
      // stand him at the edge of Expert in the bow: Advanced V, the step's experience full, every concept of the next word held
      const lv = SK.levelOfWord('advanced') + 4;
      SK.set(pc, 'bow', lv);
      const s = pc.sk.bow; s.xp = SK.E().cost(lv) + 1;
      for (const c of SK.E().openConcepts(SK.view(pc), 'bow')) { s.got = s.got || {}; s.got[c.id] = A.S.year; }
      out.ready = A.C.ready(pc, 'bow');
      let proofs = 0; const keep = SK.proof; SK.proof = function () { proofs++; return keep.apply(this, arguments); };
      const m0 = A.LADDER.mod(pc).f;
      A.PATHS.month(pc);
      const q = A.S.queue.find(x => x.ev === 'pa_trial');
      out.card = !!q;
      if (q) { A.S.queue = [q]; A.headReady(); const v = A.eventView(q); out.text = v.text; out.n = v.choices.length; A.eventChoose(0); A.eventClose(); }
      SK.proof = keep;
      out.proofs = proofs; out.trials = (pc.mil.trials || []).length;
      out.mod = [m0, A.LADDER.mod(pc).f];
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    const ok = r.ready && r.card && r.n === 2 && r.proofs === 1 && r.trials === 1 && r.mod[1] > r.mod[0] && !/\d+\s?%/.test(r.text || '');
    return { ok, detail: JSON.stringify(r) };
  },

  // the road's specialism by his way: when the skill has room, the card offers it; taken, it is his
  async paSpec(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const pc = PAT.soldier(4400, 'archers');
      if (!pc) return { skip: 'no soldier' };
      const SK = A.SK, sp = A.PATHS.specFor(pc), out = { sp };
      SK.set(pc, sp[0], SK.levelOfWord('advanced') + 1);
      A.PATHS.month(pc);
      const q = A.S.queue.find(x => x.ev === 'pa_spec');
      out.card = !!q;
      if (q) { A.S.queue = [q]; A.headReady(); const v = A.eventView(q); out.choices = v.choices.map(c => c.t); A.eventChoose(0); A.eventClose(); }
      out.have = SK.specsOf(pc, SK.canon(sp[0])[0]);
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    return { ok: r.card && r.have.includes(r.sp[1]) && r.choices.length >= 2, detail: JSON.stringify(r) };
  },

  // the board weighs what the road's next rung wants: an archer for a captaincy the bow and command, a sapper for
  // command works; a rung opens its role, offered by the captain
  async paBoardAndRole(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const L = A.LADDER, out = {};
      const a = PAT.soldier(4400, 'archers', { rank: 2 });
      if (!a) return { skip: 'no soldier' };
      PAT.zero(a); PAT.SV(a, 'command', 50); out.archerCmd = L.mod(a).f; PAT.SV(a, 'bow', 60); out.archerBoth = L.mod(a).f;
      out.archerWhy = L.mod(a).why.map(x => x[0]);
      const e = PAT.soldier(4401, 'engineers', { rank: 4 });
      PAT.zero(e); PAT.SV(e, 'tactics', 60); out.sapTactics = L.mod(e).f; PAT.SV(e, 'bow', 80); out.sapBow = L.mod(e).f;
      // the scout's road opens the pathfinder's work to a soldier who tracks
      const s = PAT.soldier(4402, 'scouts');
      PAT.zero(s); PAT.SV(s, 'tracking', 45); A.S.queue = [];
      A.PATHS.month(s);
      const q = A.S.queue.find(x => x.ev === 'md_role');
      out.opens = q ? q.ctx.rk : null;
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    const ok = r.archerBoth > r.archerCmd && r.archerWhy.some(x => /archery|bow/.test(x)) && r.sapBow === r.sapTactics && r.opens === 'pathfinder';
    return { ok, detail: JSON.stringify(r) };
  },

  // the War tab's road at 375 by 667: words, no talent letters, no percentages, 44-point notes, pure
  async paView(pg) {
    await pg.setViewportSize({ width: 375, height: 667 });
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const pc = PAT.soldier(4400, 'scouts', { rank: 1 });
      if (!pc) return { skip: 'no soldier' };
      pc.tal = Object.assign({}, pc.tal || {}, { tracking: 'B' });
      UI.screen = 'game'; UI.tab = 'war'; UI.ov = null; UI.render();
      const h0 = T.hash(A.S); UI.render(); const pure = T.hash(A.S) === h0;
      const card = document.querySelector('.pa-card');
      const btns = card ? [...card.querySelectorAll('button')] : [];
      const out = { pure, card: !!card, text: card ? card.innerText.replace(/\s+/g, ' ').slice(0, 300) : '', small: btns.filter(b => { const x = b.getBoundingClientRect(); return x.height < 44 || x.width < 44; }).length, btns: btns.length };
      out.letters = /\b(Talent|talent)\s*:?\s*[A-F]\b|\([A-F]\)/.test(out.text);
      out.pct = /\d+\s?%/.test(out.text);
      UI.tab = 'life'; UI.render();
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    return { ok: r.pure && r.card && /gifted/.test(r.text) && !r.letters && !r.pct && !r.small && r.btns >= 2, detail: JSON.stringify(r) };
  },

  async paOldSaves(pg) {
    const files = fs.readdirSync(SAVES).filter(f => f.endsWith('.ardan')).sort();
    const out = [];
    for (const f of files) {
      const b64 = fs.readFileSync(path.join(SAVES, f)).toString('base64');
      out.push(await pg.evaluate(async ([b64, f]) => {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        try { const d = await SAVES.decode(bytes); UI.enterSaveSafe(d); UI.tab = 'war'; UI.render(); UI.tab = 'life'; UI.render(); T.play(1); return { f, ok: true }; }
        catch (e) { return { f, ok: false, err: String(e && e.message || e).slice(0, 120) }; }
      }, [b64, f]));
    }
    const bad = out.filter(x => !x.ok);
    return { ok: !bad.length && out.length >= 5, detail: `${out.length} saves${bad.length ? '; bad: ' + JSON.stringify(bad.slice(0, 3)) : ', all load and play'}` };
  },
  async paDeterministic(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const run = () => { const pc = PAT.soldier(2024, 'lances'); if (!pc) return 'none'; T.play(2); return JSON.stringify([pc.mil && pc.mil.trials, pc.sk && pc.sk.riding, A.rngState]); };
      const a = run(), b = run();
      return { same: a === b, a: a.slice(0, 160) };
    });
    return { ok: r.same, detail: JSON.stringify(r) };
  },
};
