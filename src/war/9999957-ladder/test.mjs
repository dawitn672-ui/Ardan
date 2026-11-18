// Tests for D11-3, "careers" (docs/design/war.md §14.1, §16; CRITIQUE W11, R12 and D11's list; D-122 to D-127). See README.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const SAVES = path.join(ROOT, 'tests', 'saves');

const SOLDIER = `window.LCT = {
  SV: (p, k, v) => A.SK.set(p, k, A.SK.lvOfValue(v)),
  zero(p) { for (const k of A.DATA.skills.skills.map(s => s.id)) LCT.SV(p, k, 0); },
  soldier(seed, branch, o) {
    o = o || {};
    T.enter({ seed, race: 'human', realm: o.realm || 'POL-01', status: 'peasant', sex: 'M', startAge: o.age || 22 });
    const pc = A.pc(); A.S.queue = [];
    if (o.peace !== false) { A.S.wars = A.S.wars.filter(w => !w.att.includes(pc.realm) && !w.def.includes(pc.realm)); A._idIdx = null; }
    A.enlist(pc, false, { branch });
    A.S.queue = [];
    if (o.rank != null) { pc.mil.rank = o.rank; A.pcDivAttach(pc); }
    if (A.S.coOn) A.CO.place(pc);
    return pc.mil ? pc : null;
  },
};`;

export default {
  // every branch has its five-rank ladder, its key skill and missions the war can give
  async lcData(pg) {
    const r = await pg.evaluate(() => {
      const bad = [];
      for (const B of A.MUSTER.branches()) {
        if (!Array.isArray(B.ladder) || B.ladder.length !== 5) bad.push(`${B.id}: ladder`);
        if (!A.DATA.skills.skills.some(s => s.id === B.key)) bad.push(`${B.id}: key ${B.key}`);
        if (!(B.mtypes || []).length) bad.push(`${B.id}: no missions`);
        for (const [ph, t] of B.mtypes || []) if (!A.MISSION_TYPES[t] || !ph) bad.push(`${B.id}: mission ${t}`);
      }
      for (const R of A.MUSTER.roles()) if (!Array.isArray(R.line) || R.line.length < 3) bad.push(`role ${R.id}: line`);
      return { n: A.MUSTER.branches().length, bad };
    });
    return { ok: r.n >= 14 && !r.bad.length, detail: JSON.stringify(r) };
  },

  // CRITIQUE D11: half the war cards are the branch's own. For each branch entered at a muster, a soldier and a captain
  // at war: of the missions the war gives them, the branch's own work, each titled with it and with its reasons
  async lcMissions(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const out = { by: {}, low: [], titled: 0, n: 0 };
      const found = T.trySeeds(T.seedRun(7, 4), s => {
        const pc = LCT.soldier(s, 'spears', { peace: false });
        if (!pc) return null;
        const foe = A.neighbors(pc.realm).map(A.realm).find(x => x && x.alive && !x.isRebel);
        if (!foe) return null;
        A.startWar(pc.realm, foe.id, null, 'conquest');
        return { pc, foe: foe.id };
      });
      if (!found.res) return { skip: `no world of ${found.tried.join(', ')} gave a war` };
      const { pc, foe } = found.res, w = A.atWar(pc.realm)[0];
      for (const B of A.MUSTER.branches().filter(x => (x.muster || []).some(k => k === 'crown' || k === 'house'))) {
        if (!A.MUSTER.open({ id: 'crown:' + pc.realm, k: 'crown', r: pc.realm }, {}).includes(B) && B.id !== 'household') continue;
        let own = 0, n = 0;
        for (const rank of [0, 3]) {
          pc.mil.branch = B.id; pc.mil.rank = rank;
          for (let k = 0; k < 15; k++) {
            A.S.warClock = (A.S.warClock || 0) + 1;
            const m = A.newMission(pc, foe, w);
            n++; out.n++;
            const mine = (B.mtypes || []).some(([ph, t]) => t === m.type);
            if (mine) own++;
            if ((B.mtypes || []).some(([ph]) => m.title.toLowerCase().startsWith(ph.toLowerCase()))) out.titled++;
          }
        }
        out.by[B.id] = Math.round(own / n * 100) / 100;
        if (own / n < .5) out.low.push(B.id);
      }
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    return { ok: Object.keys(r.by).length >= 8 && !r.low.length && r.titled >= r.n * .4, detail: JSON.stringify(r) };
  },

  // §14.1: promotion weighs the post's own aptitudes; R12: duties done and long service at one rank count
  async lcBoard(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const L = A.LADDER, out = {};
      const pc = LCT.soldier(7, 'scouts');
      if (!pc) return { skip: 'no soldier' };
      LCT.zero(pc);
      out.none = L.mod(pc).f;
      LCT.SV(pc, 'tracking', 60); out.tracker = L.mod(pc).f;
      pc.mil.rank = 1; LCT.SV(pc, 'command', 55); out.withVoice = L.mod(pc).f;
      LCT.zero(pc); LCT.SV(pc, 'sword', 70); out.swordsman = L.mod(pc).f;
      pc.mil.rankSince = A.absDay(); out.s0 = L.service(pc).f;
      pc.mil.svc = { r: pc.mil.rank, n: 3 }; out.s3 = L.service(pc).f;
      pc.mil.rankSince = A.absDay() - 365 * 6; out.long = L.service(pc).f; out.longWhy = L.service(pc).why.map(x => x[0]);
      // the board's roll reads it: the hazard's factor passed to the promotion check
      const RN = A.RN, keep = RN.promoRoll; let mods = null;
      RN.promoRoll = (p, o) => { mods = o.mods; return null; };
      RN.milRoll(pc, .5, []); const withAll = mods;
      pc.mil.svc = null; pc.mil.rankSince = A.absDay(); LCT.zero(pc);
      RN.milRoll(pc, .5, []); const bare = mods;
      RN.promoRoll = keep;
      out.mods = [bare, withAll];
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    const ok = r.tracker > r.none && r.withVoice > r.tracker && r.swordsman < r.withVoice && r.s3 > r.s0 && r.long > r.s3 && r.longWhy.some(x => /long and faithful/.test(x)) && r.mods[1] > r.mods[0];
    return { ok, detail: JSON.stringify(r) };
  },

  // R12: in peace a soldier's duties are deeds of service the board reads (two years at peace)
  async lcPeaceService(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const f = T.trySeeds(T.seedRun(3300, 6), s => {
        const pc = LCT.soldier(s, 'spears');
        if (!pc) return null;
        const r0 = pc.mil.rank;
        // two years, kept at peace (a war gives other work)
        for (let k = 0; k < 24 && pc.alive && pc.mil; k++) {
          A.S.wars = A.S.wars.filter(w => !w.att.includes(pc.realm) && !w.def.includes(pc.realm)); A._idIdx = null;
          A.advance(31); let h, g = 0; while ((h = A.headReady()) && g++ < 60) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
        }
        if (!pc.alive || !pc.mil) return null;
        const deeds = ((pc.rn || {}).v || []).filter(x => x.field === 'war').length;
        return { svc: pc.mil.svc ? pc.mil.svc.n : 0, rankMoved: pc.mil.rank !== r0, deeds, standout: A.RN.standout(pc, 'mil', pc.mil.rank) };
      });
      return f.res ? Object.assign({ seed: f.seed }, f.res) : { none: f.tried };
    });
    if (r.none) return { ok: false, detail: `no life of ${r.none.join(', ')} lived two years in arms` };
    return { ok: (r.svc >= 3 || r.rankMoved) && r.deeds >= 1, detail: JSON.stringify(r) };
  },

  // a role's line: two years and grown skill, and the captain raises him (clerk to quartermaster); his pay rises; a
  // raised role is kept by a captain and given up by a commander
  async lcRoleLine(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const L = A.LADDER, MU = A.MUSTER;
      const pc = T.trySeeds(T.seedRun(7, 6), s => { const p = LCT.soldier(s, 'train'); if (!p || !A.CO.mine(p)) return null; const o = L.roleOptions(Object.assign(p, {})) ; void o; return p; }).res;
      if (!pc) return { skip: 'no company' };
      pc.mil.role = { k: 'clerk', co: MU.coKey(pc.mil), y: A.S.year - 3 };
      const pay0 = L.rolePay(pc);
      LCT.SV(pc, 'learning', 70);
      let rec = null;
      for (let k = 0; k < 4 && !(pc.mil.role.lv > 0); k++) { rec = L.roleYear(pc); pc.mil.role.y = A.S.year - 3; }
      const out = { lv: pc.mil.role.lv || 0, title: L.roleTitle(pc), why: rec ? rec.why.map(x => x[0]) : [], pay: [pay0, L.rolePay(pc)] };
      pc.mil.rank = 3; MU.month(pc); out.keptAt3 = !!pc.mil.role;
      pc.mil.rank = 5; MU.month(pc); out.goneAt5 = !pc.mil.role;
      // no skill: not raised
      pc.mil.rank = 0; pc.mil.role = { k: 'clerk', co: MU.coKey(pc.mil), y: A.S.year - 3 }; LCT.SV(pc, 'learning', 23);
      const r2 = L.roleYear(pc); out.lowChose = r2 && r2.chose;
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    const ok = r.lv === 1 && /quartermaster/.test(r.title) && r.pay[1] > r.pay[0] && r.keptAt3 && r.goneAt5 && r.lowChose === 'stay';
    return { ok, detail: JSON.stringify(r) };
  },

  // W11: pay rebased: a soldier a few suns a month, near a farmhand's wage and not five times it; an officer's pay rises
  // with his command; the year's pay is the rank's
  async lcPay(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const pay = GD.MIL.map(x => x.pay), farm = GD.CAREERS.farm.ranks;
      const out = { pay, farmhand: farm[0][2], yeoman: farm[farm.length - 1][2] };
      const pc = LCT.soldier(7, 'spears');
      if (pc) { A.S.realms[pc.mil.realm].treasury = Math.max(1000, A.S.realms[pc.mil.realm].treasury || 0); const c0 = pc.coin; A.milYear(pc); out.year = pc.coin - c0; }
      return out;
    });
    const p = r.pay, rising = p.every((x, i) => i === 0 || x >= p[i - 1]);
    const ok = rising && p[0] >= r.farmhand && p[0] <= 2 * r.farmhand && p[4] <= 3 * r.yeoman && (r.year == null || (r.year >= p[0] * .4 && r.year <= p[0] * 3));
    return { ok, detail: JSON.stringify(r) };
  },

  // D-126: every company's role-holders work, not only the player's: a third of companies hold each role; a battalion with
  // surgeon's mates keeps more wounded, one with a standard-bearer stands higher; off, the world's part is gone
  async lcWorldRoles(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
      const L = A.LADDER, U = A.UNITS, out = { comps: 0, roles: {}, woundHi: 0, woundLo: 0, morHi: 0, morLo: 0, nHi: 0, nLo: 0 };
      for (const d of A.allDivs()) {
        if (!Array.isArray(d.bs)) continue;
        for (let i = 0; i < d.bs.length; i++) {
          const m = L.masks(d, i);
          for (let ci = 0; ci < m.length; ci++) { out.comps++; for (const R of A.MUSTER.roles()) if (L.has(d, i, ci, R.id)) out.roles[R.id] = (out.roles[R.id] || 0) + 1; }
          const s = L.share(d, i, 'surgeon');
          if (s > 0) { out.woundHi += U.woundF(d, i); out.nHi++; } else { out.woundLo += U.woundF(d, i); out.nLo++; }
          for (let ci = 0; ci < m.length; ci++) { if (L.has(d, i, ci, 'bearer')) out.morHi++; }
        }
      }
      for (const k in out.roles) out.roles[k] = Math.round(out.roles[k] / out.comps * 100) / 100;
      out.woundHi = Math.round(out.woundHi / Math.max(1, out.nHi) * 100) / 100; out.woundLo = Math.round(out.woundLo / Math.max(1, out.nLo) * 100) / 100;
      const d = A.allDivs().find(x => Array.isArray(x.bs) && x.bs.length);
      const ci = L.masks(d, 0).findIndex((_, k) => L.has(d, 0, k, 'bearer'));
      out.bearer = ci >= 0 ? U.roleMorale(d, 0, ci) : null;
      L.T.npc = false; out.off = [U.woundF(d, 0), U.roleMorale(d, 0, Math.max(0, ci))]; L.T.npc = true;
      const t0 = performance.now(); for (const x of A.allDivs()) if (Array.isArray(x.bs)) for (let i = 0; i < x.bs.length; i++) for (let k = 0; k < x.bs[i].k.length; k++) U.roleMorale(x, i, k);
      out.ms = Math.round((performance.now() - t0) * 10) / 10;
      return out;
    });
    const shares = Object.values(r.roles);
    const ok = r.comps > 1000 && shares.length === 10 && shares.every(x => x > .25 && x < .42) && r.woundHi > r.woundLo && r.woundLo === 1 && r.bearer >= 4 && r.off[0] === 1 && r.off[1] === 0;
    return { ok, detail: JSON.stringify(r) };
  },

  // the Path's place card: the ladder and the next board in words, notes on a tap at 44 points, no percentages
  async lcView(pg) {
    await pg.setViewportSize({ width: 375, height: 667 });
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const pc = LCT.soldier(7, 'archers', { rank: 1 });
      if (!pc) return { skip: 'no soldier' };
      UI.screen = 'game'; UI.tab = 'war'; UI.ov = null; UI.render();
      const h0 = T.hash(A.S); UI.render(); const pure = T.hash(A.S) === h0;
      const live = document.querySelector('.md-place');
      // the notes as the card writes them (59-descriptions moves data-note off the live buttons)
      const card = live ? new DOMParser().parseFromString(UI.placeCard(pc), 'text/html').querySelector('.md-place') : null;
      const small = live ? [...live.querySelectorAll('button')].filter(b => { const x = b.getBoundingClientRect(); return x.height < 44 || x.width < 44; }).length : 1;
      const btns = card ? [...card.querySelectorAll('button')] : [];
      const ladder = btns.find(b => /the ladder/.test(b.textContent)), next = btns.find(b => /next rank/.test(b.textContent));
      const out = { pure, card: !!card, ladder: ladder ? ladder.getAttribute('data-note') : '', next: next ? next.getAttribute('data-note') : '', small, pct: card ? /\d+\s?%/.test(card.innerText + (ladder ? ladder.getAttribute('data-note') : '')) : true };
      UI.tab = 'life'; UI.render();
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    return { ok: r.pure && r.card && /Sergeant/.test(r.ladder) && /General/.test(r.ladder) && r.next.length > 10 && !r.small && !r.pct, detail: JSON.stringify(r) };
  },

  // old saves load and play a year; the same seed gives the same career
  async lcOldSaves(pg) {
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
  async lcDeterministic(pg) {
    await pg.evaluate(SOLDIER);
    const r = await pg.evaluate(() => {
      const run = () => { const pc = LCT.soldier(2024, 'scouts', { peace: false }); if (!pc) return 'none'; T.play(2); return JSON.stringify([pc.mil && pc.mil.rank, pc.mil && pc.mil.svc, pc.mil && pc.mil.role, pc.coin, A.rngState]); };
      const a = run(), b = run();
      return { same: a === b, a: a.slice(0, 160) };
    });
    return { ok: r.same, detail: JSON.stringify(r) };
  },
};
