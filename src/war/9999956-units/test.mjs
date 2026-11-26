// Tests for D11-2, "units that differ" (docs/design/war.md §14.2, §14.3, §16; D-116 to D-121). See README.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const SAVES = path.join(ROOT, 'tests', 'saves');

// a soldier of a branch in a world at peace, in a company (tries worlds until one has a host of that branch's troop)
const SOLDIER = `window.UNT = {
  SV: (p, k, v) => A.SK.set(p, k, A.SK.lvOfValue(v)),
  peace(rid) { A.S.wars = A.S.wars.filter(w => !w.att.includes(rid) && !w.def.includes(rid)); A._idIdx = null; },
  soldier(seed, branch, o) {
    o = o || {};
    T.enter({ seed, race: 'human', realm: o.realm || 'POL-01', status: 'peasant', sex: 'M', startAge: o.age || 20 });
    const pc = A.pc(); A.S.queue = [];
    if (o.peace !== false) UNT.peace(pc.realm);
    A.enlist(pc, false, { branch });
    A.S.queue = [];
    if (o.rank != null) { pc.mil.rank = o.rank; A.pcDivAttach(pc); }
    if (A.S.coOn) A.CO.place(pc);
    return A.UNITS.mine(pc) ? pc : null;
  },
};`;

export default {
  // the drills and duties are whole: eight families, every branch named exists, every drill feeds a war-map drill, every
  // branch entered at a muster has three drills or more and a duty
  async unData(pg) {
    const r = await pg.evaluate(() => {
      const U = A.UNITS, MU = A.MUSTER, bad = [];
      const fams = new Set(U.drills().map(x => x.family));
      for (const x of U.drills()) {
        if (!GD.DRILLS[x.feeds]) bad.push(`${x.id}: feeds ${x.feeds}`);
        for (const b of x.branches) if (!MU.B(b)) bad.push(`${x.id}: branch ${b}`);
        if (x.teacher && !A.DATA.skills.skills.some(s => s.id === x.teacher)) bad.push(`${x.id}: teacher ${x.teacher}`);
        if (/\d+\s?%/.test(x.desc)) bad.push(`${x.id}: a percentage`);
      }
      for (const D of U.duties()) { for (const b of D.branches) if (!MU.B(b)) bad.push(`duty ${D.id}: ${b}`); if (!A.DATA.skills.skills.some(s => s.id === D.skill)) bad.push(`duty ${D.id}: skill`); }
      const thin = MU.branches().filter(B => (B.muster || []).some(k => k === 'crown' || k === 'house') && (U.listFor(B.id).length < 3 || !U.duties().some(D => D.branches.includes(B.id)))).map(B => B.id);
      return { n: U.drills().length, fams: fams.size, bad, thin, duties: U.duties().length };
    });
    return { ok: r.n >= 34 && r.fams === 8 && !r.bad.length && !r.thin.length && r.duties >= 8, detail: JSON.stringify(r) };
  },

  // war.md §14.3: no unit's syllabus holds a drill outside its branch's list (every company of a world read)
  async unSyllabusArm(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const U = A.UNITS, out = { companies: 0, offers: 0, outside: [], empty: 0, branches: {} };
      for (const d of A.allDivs()) {
        if (!Array.isArray(d.bs)) continue;
        for (let i = 0; i < d.bs.length; i++) {
          const S = U.syllabus(d, i);
          if (!S) continue;
          out.companies++;
          out.branches[S.branch] = (out.branches[S.branch] || 0) + 1;
          if (!S.offers.length) out.empty++;
          for (const o of S.offers) { out.offers++; if (!U.D(o.id).branches.includes(S.branch) && out.outside.length < 5) out.outside.push(`${d.id}:${i} ${S.branch} ${o.id}`); }
        }
      }
      return out;
    });
    return { ok: r.companies > 500 && !r.outside.length && r.empty < r.companies / 10 && Object.keys(r.branches).length >= 6, detail: JSON.stringify(r) };
  },

  // war.md §14.3: two companies of one branch with different histories get different syllabuses at least 8 times in 10
  async unSyllabusHistory(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const U = A.UNITS, pairs = [], seen = new Map();
      for (const d of A.allDivs()) {
        if (!Array.isArray(d.bs)) continue;
        for (let i = 0; i < d.bs.length; i++) {
          const b = U.branchOf(d.bs[i]);
          if (!seen.has(b)) seen.set(b, []);
          const L = seen.get(b);
          if (L.length < 4) L.push([d, i]);
        }
      }
      for (const [b, L] of seen) for (let k = 0; k + 1 < L.length && pairs.length < 20; k += 2) pairs.push([b, L[k], L[k + 1]]);
      let differ = 0, n = 0;
      const sample = [];
      for (const [b, [d1, i1], [d2, i2]] of pairs.slice(0, 20)) {
        const r1 = d1.bs[i1], r2 = d2.bs[i2];
        const save = [r1.td, r1.dg, r2.td, r2.dg];
        // the same arm: one company drilled its arm's first two drills hard and broke at a fight the year before; the
        // other drilled nothing and held a ford
        const L = U.listFor(b);
        if (L.length < 3) continue;
        r1.dg = {}; for (const X of L) r1.dg[X.id] = U.baseGrade(d1, i1, X.id);
        r2.dg = {}; for (const X of L) r2.dg[X.id] = U.baseGrade(d2, i2, X.id);
        r1.dg[L[0].id] = 90; r1.dg[L[1].id] = 85;
        r1.td = [[b === 'lances' || b === 'light_horse' || b === 'household' ? 'chases' : 'shy_horse', A.S.year - 1, 'Camia']];
        r2.td = [['proud', A.S.year - 1, 'the Vite']];
        const a = U.syllabus(d1, i1).offers.map(o => o.id).slice(0, 3).join(','), c = U.syllabus(d2, i2).offers.map(o => o.id).slice(0, 3).join(',');
        n++; if (a !== c) differ++;
        if (sample.length < 3) sample.push(`${b}: ${a} | ${c}`);
        [r1.td, r1.dg, r2.td, r2.dg] = save;
      }
      return { n, differ, sample };
    });
    return { ok: r.n >= 8 && r.differ >= r.n * .8, detail: JSON.stringify(r) };
  },

  // war.md §14.3: a company's role-holder moves the measures it claims, in a lab: morale at rest (the standard-bearer),
  // the wounded kept (the surgeon's mate), the bread a foraging party brings (the forager), the men held (the provost's
  // man), how far he sees on campaign (the pathfinder), a river's cost to an attack (the carpenter)
  async unRolesMove(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const U = A.UNITS, out = {};
      const pc = T.trySeeds(T.seedRun(7, 4), s => UNT.soldier(s, 'spears')).res;
      if (!pc) return { skip: 'no world gave a spearman a company' };
      // the player's own role, alone (D-120); since D11-3 every company's role-holders work too (D-126: A.LADDER's
      // world part, measured by lcWorldRoles), so the player's company is one among many: it is set aside here
      const npc = A.LADDER && A.LADDER.T ? A.LADDER.T.npc : null;
      if (npc != null) A.LADDER.T.npc = false;
      const M = U.mine(pc), d = M.d, role = k => { pc.mil.role = k ? { k, co: A.MUSTER.coKey(pc.mil), y: A.S.year } : null; if (!k) delete pc.mil.role; };
      // morale
      role(null); const m0 = A.CO.restVal(d, M.b, M.i, 0); role('bearer'); const m1 = A.CO.restVal(d, M.b, M.i, 0);
      out.morale = [m0, m1];
      // wounded: the same losses in a battle, with and without a surgeon's mate
      const wd = k => { role(k); const b = d.bs[M.b], w0 = b.wd, men0 = d.men; A.CO.WHY = 'battle'; A.divLose(d, 400); A.CO.WHY = null; const got = b.wd - w0; A.divRefill ? A.divRefill(d, men0 - d.men) : 0; b.wd = w0; return Math.round(got * 10) / 10; };
      out.wounded = [wd(null), wd('surgeon')];
      // foraging
      const P = A.S.prov[d.loc], fo = k => { role(k); const f0 = d.food = 2, u0 = P.unrest; A.CO.forage(d, P); const g = d.food - f0; P.unrest = u0; return g; };
      out.forage = [fo(null), fo('forager')];
      // the ledger
      const net = k => { role(k); const L = A.LEDGER.read(d); return L ? L.net : 0; };
      out.ledger = [net(null), net('provost')];
      // sight: at war
      role(null);
      out.sees = [U.sees(pc)]; role('pathfinder'); out.sees.push(U.sees(pc));
      // a river
      role(null); const f0 = U.crossF(d, .7); role('carpenter'); const f1 = U.crossF(d, .7);
      out.cross = [f0, f1];
      role(null);
      if (npc != null) A.LADDER.T.npc = npc;
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    const ok = r.morale[1] > r.morale[0] && r.wounded[1] > r.wounded[0] && r.forage[1] > r.forage[0] && r.ledger[1] > r.ledger[0] && r.sees[1] > r.sees[0] && r.cross[1] > r.cross[0];
    return { ok, detail: JSON.stringify(r) };
  },

  // war.md §14.3: a new soldier has a duty or a task within three months in 19 careers of 20
  async unFirstDuty(pg) {
    const r = await pg.evaluate(() => {
      const BR = ['spears', 'archers', 'light_horse', 'engineers', 'train', 'garrison', 'scouts', 'foot_men_at_arms', 'crossbows', 'lances'];
      let n = 0, got = 0, standby = 0;
      const misses = [];
      for (let s = 3300; s < 3360 && n < 20; s++) {
        T.enter({ seed: s, race: 'human', realm: 'POL-01', status: s % 3 ? 'peasant' : 'gentry', sex: 'M', startAge: 19 + (s % 6) });
        const pc = A.pc(); A.S.queue = [];
        const b = BR[s % BR.length];
        const res = A.enlist(pc, false, { branch: A.MUSTER.B(b) ? b : 'spears' });
        if (!pc.mil) { standby++; continue; }
        const start = A.absDay();
        let task = false;
        T.play(1, { each: () => {
          const m = pc.mil;
          if (!m || task || A.absDay() - start > 92) return;
          if (m.duty || (m.missions || 0) > 0 || (A.S.queue || []).some(q => q && q.type === 'mission') || (m.div && A.divById(m.div) && A.divById(m.div).army)) task = true;
        } });
        if (!pc.alive || !pc.mil) { standby++; continue; }
        n++; if (task) got++; else misses.push(s);
        void res;
      }
      return { n, got, standby, misses: misses.slice(0, 5) };
    });
    return { ok: r.n >= 20 && r.got >= 19, detail: JSON.stringify(r) };
  },

  // a scout, an engineer or a man of the train stands in the support company his branch mans; one holder a post; a
  // commander leaves it for a wing
  async unSupport(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const U = A.UNITS, out = { got: [], audit: 0 };
      for (const b of ['scouts', 'engineers', 'train']) {
        const f = T.trySeeds(T.seedRun(9711, 6), s => {
          const pc = UNT.soldier(s, b, { rank: 3 });
          if (!pc) return null;
          const M = U.mine(pc), sup = A.MUSTER.B(b).sup;
          const has = M.d.bs.some(x => sup.includes(x.c));
          if (!has) return null;
          const inSup = sup.includes(M.rec.c), holds = A.POSTS.held(pc.id);
          out.audit += A.POSTS.audit().length;
          pc.mil.rank = 5; A.CO.place(pc);
          const M2 = U.mine(pc);
          return { b, inSup, holds: holds.length, name: A.CO.coName(M.d, M.b, M.i), wing: !!M2 && !sup.includes(M2.rec.c) };
        });
        out.got.push(f.res || { b, none: f.tried });
      }
      return out;
    });
    const found = r.got.filter(x => !x.none);
    const ok = found.length >= 2 && found.every(x => x.inSup && x.holds >= 1 && x.wing) && !r.audit;
    return { ok, detail: JSON.stringify(r) };
  },

  // the month's drill: the captain's choice through A.WHY with its reasons, the drill's grade rises and the others fade,
  // the war map's drill gains its share, the scene every fourth session; a captain's own pick is honoured
  async unDrillMonth(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const U = A.UNITS, out = {};
      const pc = T.trySeeds(T.seedRun(7, 4), s => UNT.soldier(s, 'spears')).res;
      if (!pc) return { skip: 'no company' };
      const M = U.mine(pc);
      const res = U.drillMonth(pc);
      out.first = res && res.ids;
      const rec = (A.S.why || []).find(x => x.k === 'drill');
      out.rec = rec ? { chose: rec.chose, why: rec.why.map(x => x[0]) } : null;
      // (D-194: each month the captain chooses again, and a drill already well learned gives way to another, so the drill
      // of each month is read in that month: it rises, one left alone fades, the war map's drill of its family gains)
      const rise = [], fade = [], dr = [];
      for (let k = 0; k < 3; k++) {
        const g = Object.assign({}, M.rec.dg), d0 = Object.assign({}, M.d.dr || {});
        const rr = U.drillMonth(pc), id = rr && rr.ids[0];
        if (!id) continue;
        const fam = U.D(id).feeds, other = Object.keys(g).find(x => !rr.ids.includes(x) && g[x] > 0);
        rise.push([g[id] || 0, M.rec.dg[id]]);
        if (other) fade.push([g[other], M.rec.dg[other]]);
        dr.push([Math.round((d0[fam] || 0) * 1000) / 1000, Math.round(((M.d.dr || {})[fam] || 0) * 1000) / 1000]);
      }
      out.rise = rise; out.fade = fade; out.dr = dr;
      out.scene = A.S.queue.filter(q => q.ev === 'un_drill').length;
      // a captain's own pick
      pc.mil.rank = 3; A.CO.place(pc);
      const M2 = U.mine(pc), S = U.syllabus(M2.d, M2.b, { pc });
      const want = S.offers[S.offers.length - 1].id;
      UI.A.unSyl(want);
      const res2 = U.drillMonth(pc);
      out.own = res2 && res2.ids[0] === want && res2.by === 'you';
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    const ok = r.first && r.rec && r.rec.why.length >= 1 && r.rise.length === 3 && r.rise.every(x => x[1] > x[0] || x[1] >= 100) && r.fade.length && r.fade.every(x => x[1] < x[0]) && r.dr.every(x => x[1] > x[0]) && r.scene === 1 && r.own;
    return { ok, detail: JSON.stringify(r) };
  },

  // aptitude noticed in service: another branch's officer asks for a spearman who tracks and knows the woods; he goes
  async unTransfer(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const U = A.UNITS;
      const pc = T.trySeeds(T.seedRun(7, 4), s => UNT.soldier(s, 'spears')).res;
      if (!pc) return { skip: 'no company' };
      for (const k of A.DATA.skills.skills.map(s => s.id)) UNT.SV(pc, k, 0);
      const none = U.transferAsk(pc);
      const quiet = !A.S.queue.some(q => q.ev === 'un_transfer');
      UNT.SV(pc, 'tracking', 55); UNT.SV(pc, 'survival', 50); UNT.SV(pc, 'stealth', 45);
      const rec = U.transferAsk(pc);
      const q = A.S.queue.find(x => x.ev === 'un_transfer');
      const out = { quiet, chose: rec && rec.chose, card: !!q, to: q && q.ctx.tb };
      if (q) { A.S.queue = [q]; A.headReady(); A.eventView(q); A.eventChoose(0); A.eventClose(); out.branch = pc.mil.branch; }
      void none;
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    return { ok: r.quiet && r.chose === 'ask' && r.card && r.branch === r.to && r.to !== 'spears', detail: JSON.stringify(r) };
  },

  // the War tab at 375 by 667: the company card in words (no grade as a number, no percentages), 44-point notes, a
  // captain's choose buttons; drawing it changes nothing
  async unView(pg) {
    await pg.setViewportSize({ width: 375, height: 667 });
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const pc = T.trySeeds(T.seedRun(7, 4), s => UNT.soldier(s, 'archers', { rank: 3 })).res || T.trySeeds(T.seedRun(7, 4), s => UNT.soldier(s, 'spears', { rank: 3 })).res;
      if (!pc) return { skip: 'no company' };
      UI.screen = 'game'; UI.tab = 'war'; UI.ov = null; UI.render();
      const h0 = T.hash(A.S), r0 = A.rngState;
      UI.render();
      const pure = T.hash(A.S) === h0 && A.rngState === r0;
      const card = document.querySelector('.un-card');
      const out = { pure, card: !!card };
      if (!card) return out;
      out.text = card.innerText.replace(/\s+/g, ' ').slice(0, 300);
      out.pct = /\d+\s?%/.test(card.innerText);
      out.gradeNum = /drilled \d|grade \d/i.test(card.innerText);
      const btns = [...card.querySelectorAll('button')];
      out.btns = btns.length; out.small = btns.filter(b => { const x = b.getBoundingClientRect(); return x.height < 44 || x.width < 44; }).length;
      const pick = card.querySelector('[data-a="unSyl"]');
      out.pickable = !!pick;
      if (pick) { pick.click(); out.chosen = (pc.mil.syl || []).length; }
      out.wide = document.documentElement.scrollWidth > 376;
      UI.tab = 'life'; UI.render();
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    const ok = r.pure && r.card && !r.pct && !r.gradeNum && r.btns >= 3 && !r.small && r.pickable && r.chosen === 1 && !r.wide;
    return { ok, detail: JSON.stringify(r) };
  },

  // old saves: every sample save loads, its soldier's company reads, a year plays
  async unOldSaves(pg) {
    const files = fs.readdirSync(SAVES).filter(f => f.endsWith('.ardan')).sort();
    const out = [];
    for (const f of files) {
      const b64 = fs.readFileSync(path.join(SAVES, f)).toString('base64');
      out.push(await pg.evaluate(async ([b64, f]) => {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        try {
          const d = await SAVES.decode(bytes);
          UI.enterSaveSafe(d);
          const pc = A.pc();
          if (pc && pc.mil) { UI.tab = 'war'; UI.render(); UI.tab = 'life'; UI.render(); }
          T.play(1);
          return { f, ok: true, soldier: !!(pc && pc.mil), duty: !!(A.pc() && A.pc().mil && A.pc().mil.duty) };
        } catch (e) { return { f, ok: false, err: String(e && e.message || e).slice(0, 120) }; }
      }, [b64, f]));
    }
    const bad = out.filter(x => !x.ok);
    return { ok: !bad.length && out.length >= 5, detail: `${out.length} saves; ${bad.length ? 'bad: ' + JSON.stringify(bad.slice(0, 3)) : 'all load and play'}; soldiers: ${out.filter(x => x.soldier).map(x => `${x.f}${x.duty ? ' (a duty)' : ''}`).join(', ') || 'none'}` };
  },

  // the same seed and the same choices give the same drills, duties and transfers
  async unDeterministic(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const run = () => {
        const pc = UNT.soldier(2024, 'archers');
        if (!pc) return 'none';
        T.play(2);
        const M = A.UNITS.mine(pc);
        return JSON.stringify([pc.mil.duty, pc.mil.branch, M && M.rec.dg, M && M.rec.td, A.rngState]);
      };
      const a = run(), b = run();
      return { same: a === b, a: a.slice(0, 160) };
    });
    return { ok: r.same, detail: JSON.stringify(r) };
  },
};
