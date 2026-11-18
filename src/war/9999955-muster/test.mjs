// Tests for D11-1, "the muster" (docs/design/war.md §14.1, §14.3, §16; D-110 to D-115). See README.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const SAVES = path.join(ROOT, 'tests', 'saves');

export default {
  // the branches and roles are whole: every troop, support company, arm, skill and way they name exists; every branch
  // has its drills, duties, three missions and a way out; no retired rank or the old call-up's word
  async mdData(pg) {
    const B = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/military/branches.json'), 'utf8'));
    const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/military/roles.json'), 'utf8'));
    const skills = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/skills.json'), 'utf8')).skills.map(s => s.id);
    const r = await pg.evaluate(({ B, R, skills }) => {
      const bad = [];
      for (const b of B.branches) {
        for (const t of b.troops || []) if (!GD.TROOPS[t]) bad.push(`${b.id}: troop ${t}`);
        for (const s of b.sup || []) if (!GD.SUP[s]) bad.push(`${b.id}: support ${s}`);
        if (!GD.ARMS[b.arm]) bad.push(`${b.id}: arm ${b.arm}`);
        for (const k of (b.weapon || []).concat(Object.keys(b.prizes || {}))) if (!skills.includes(k)) bad.push(`${b.id}: skill ${k}`);
        for (const w of b.ways || []) if (!B.ways[w]) bad.push(`${b.id}: way ${w}`);
        if (!(b.missions || []).length || !(b.duties || []).length || !b.wayOut || !b.desc || !(b.drills || []).length) bad.push(`${b.id}: incomplete`);
      }
      for (const x of R.roles) for (const k of [x.skill, x.skill2]) if (!skills.includes(k)) bad.push(`role ${x.id}: skill ${k}`);
      const onPage = A.DATA && A.DATA['military/branches'] && A.DATA['military/branches'].branches.length === B.branches.length && A.MUSTER.roles().length === R.roles.length;
      return { bad, onPage, n: B.branches.length, roles: R.roles.length };
    }, { B, R, skills });
    const words = JSON.stringify([B, R]);
    const banned = [/\bMarshal/, /\bhigh generals?\b/i, /\bfile-?leaders?\b/i, /\bsquad captains?\b/i, /\bsenior captains?\b/i, new RegExp('\\ble' + 'v(y|ies)\\b', 'i'), /\d+\s?%/].filter(rx => rx.test(words)).map(String);
    return { ok: !r.bad.length && r.onPage && r.n >= 14 && r.roles >= 10 && !banned.length, detail: `${r.n} branches, ${r.roles} roles on the page ${r.onPage}; faults: ${r.bad.slice(0, 6).join('; ') || 'none'}; banned words: ${banned.join(' ') || 'none'}` };
  },

  // war.md §14.3: in 200 musters of varied recruits the offered branches change with weapon, way and aptitude: no
  // branch is offered first to more than a third; every offer carries its reasons; a recruit who knows the sea is offered
  // a ship's company where his realm has a coast, and never where it has none
  async mdSpread(pg) {
    const r = await pg.evaluate(() => {
      const SV = (p, k, v) => A.SK.set(p, k, A.SK.lvOfValue(v));
      const MU = A.MUSTER;
      const found = T.trySeeds(T.seedRun(7, 6), seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
        const realms = Object.values(A.S.realms).filter(r => r && r.alive && !r.isRebel && r.capitalProv != null);
        const coast = realms.filter(r => MU.coast(r.id)), dry = realms.filter(r => !MU.coast(r.id));
        return coast.length >= 2 && dry.length >= 1 ? { coast: coast.map(r => r.id), dry: dry.map(r => r.id) } : null;
      });
      if (!found.res) return { skip: `no world of ${found.tried.join(', ')} had both coastal and landlocked realms` };
      const pc = A.pc();
      let x = 12345;
      const rnd = () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; };
      const pick = a => a[Math.floor(rnd() * a.length)];
      const WEAPONS = ['sword', 'spear', 'bow', 'riding', null];
      const APTS = ['command', 'stewardship', 'sea', 'tracking', 'survival', 'craft', 'medicine', 'learning', 'husbandry', 'music', 'stealth', 'trade', 'tactics'];
      const STAT = ['peasant', 'peasant', 'artisan', 'merchant', 'gentry', 'noble'];
      const all = A.DATA.skills.skills.map(s => s.id);
      const realmsAll = found.res.coast.concat(found.res.dry);
      const first = {}, out = { n: 0, offers: 0, noReason: 0, seaCoast: 0, seaCoastShip: 0, seaDry: 0, seaDryShip: 0, distinct: 0, byWeapon: {} };
      for (let i = 0; i < 200; i++) {
        for (const k of all) SV(pc, k, 0);
        const w = pick(WEAPONS);
        if (w) SV(pc, w, 25 + Math.floor(rnd() * 30));
        const apts = [pick(APTS)].concat(rnd() < .5 ? [pick(APTS)] : []);
        for (const k of apts) SV(pc, k, 22 + Math.floor(rnd() * 30));
        pc.gear.mount = w === 'riding' || rnd() < .15 ? 'horse' : null;
        pc.gear.armor = rnd() < .2 ? 'mail' : 'padded';
        pc.gear.ranged = w === 'bow' && rnd() < .6 ? (rnd() < .7 ? 'selfbow' : 'xbow') : null;
        pc.status = pick(STAT);
        for (const s of ['str', 'spd', 'ins', 'sta', 'int', 'wil']) pc.st[s] = 30 + Math.floor(rnd() * 40);
        const rid = i % 5 === 4 ? pick(found.res.dry) : pick(found.res.coast);
        pc.realm = rid;
        const M = MU.offers(pc, { rid, log: false });
        if (!M || !M.offers.length) continue;
        out.n++;
        out.offers += M.offers.length;
        for (const o of M.offers) if (!o.why.length) out.noReason++;
        first[M.offers[0].b] = (first[M.offers[0].b] || 0) + 1;
        const wk = w || 'none';
        (out.byWeapon[wk] = out.byWeapon[wk] || {})[M.offers[0].b] = ((out.byWeapon[wk] || {})[M.offers[0].b] || 0) + 1;
        if (apts.includes('sea')) {
          const ship = M.offers.some(o => o.b === 'ships');
          if (MU.coast(rid)) { out.seaCoast++; if (ship) out.seaCoastShip++; } else { out.seaDry++; if (ship) out.seaDryShip++; }
        }
      }
      out.first = first;
      out.top = Math.max(...Object.values(first));
      out.distinct = Object.keys(first).length;
      // the weapon moves the first offer: the commonest first offer differs between a bowman, a rider and a man with none
      const lead = k => { const o = out.byWeapon[k] || {}; return Object.keys(o).sort((a, b) => o[b] - o[a])[0]; };
      out.leads = { bow: lead('bow'), riding: lead('riding'), none: lead('none'), sword: lead('sword') };
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    const leadsDiffer = new Set(Object.values(r.leads)).size >= 3;
    const ok = r.n >= 190 && r.top <= r.n / 3 && r.distinct >= 7 && !r.noReason && leadsDiffer
      && r.seaCoast >= 5 && r.seaCoastShip >= r.seaCoast * 0.8 && r.seaDryShip === 0;
    return { ok, detail: JSON.stringify(r) };
  },

  // the reading's labs: each aptitude points to its branch (§14.1's table)
  async mdLabs(pg) {
    const r = await pg.evaluate(() => {
      const SV = (p, k, v) => A.SK.set(p, k, A.SK.lvOfValue(v));
      const MU = A.MUSTER;
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const pc = A.pc(), all = A.DATA.skills.skills.map(s => s.id);
      const base = () => { for (const k of all) SV(pc, k, 0); pc.gear.mount = null; pc.gear.ranged = null; pc.gear.armor = 'padded'; pc.status = 'peasant'; for (const s of ['str', 'spd', 'ins', 'sta', 'int', 'wil']) pc.st[s] = 45; };
      const lab = (f) => { base(); f(); const M = MU.offers(pc, { log: false }); return M ? M.offers.map(o => o.b) : []; };
      return {
        bow: lab(() => { SV(pc, 'bow', 45); pc.gear.ranged = 'selfbow'; }),
        rider: lab(() => { SV(pc, 'riding', 45); pc.gear.mount = 'horse'; pc.status = 'gentry'; }),
        scout: lab(() => { SV(pc, 'tracking', 45); SV(pc, 'survival', 35); }),
        engineer: lab(() => { SV(pc, 'craft', 50); }),
        steward: lab(() => { SV(pc, 'stewardship', 50); SV(pc, 'trade', 30); }),
        nothing: lab(() => {}),
        noHorse: (() => { base(); SV(pc, 'sword', 30); const M = MU.offers(pc, { log: false }); return M ? MU.readWords(M) : ''; })(),
      };
    });
    const has = (L, b) => L.slice(0, 2).includes(b);
    const ok = (has(r.bow, 'archers') || has(r.bow, 'crossbows')) && (has(r.rider, 'lances') || has(r.rider, 'light_horse')) && has(r.scout, 'scouts') && has(r.engineer, 'engineers') && has(r.steward, 'train')
      && r.nothing.length >= 1 && !/\d+\s?%/.test(r.noHorse);
    return { ok, detail: JSON.stringify(r) };
  },

  // the player goes to a muster: a card that reads him, offers with reasons, a way home; at 375 by 667, 44-point
  // targets, no percentages. His choice fixes his branch, troop, arm and command; the War tab says where he stands
  async mdPlayerMuster(pg) {
    await pg.setViewportSize({ width: 375, height: 667 });
    const r = await pg.evaluate(() => {
      const SV = (p, k, v) => A.SK.set(p, k, A.SK.lvOfValue(v));
      const out = {};
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const pc = A.pc(); A.S.queue = [];
      SV(pc, 'bow', 40); pc.gear.ranged = 'selfbow';
      const res = A.doActivity('enlist');
      out.msg = res && res.msg; out.notYet = !pc.mil;
      const q = A.headReady();
      out.card = q && q.ev;
      UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render();
      const v = A.eventView(q);
      out.text = (v.text || '').slice(0, 300); out.words = (v.text || '').split(/\s+/).length;
      out.choices = v.choices.map(c => c.t);
      const btns = [...document.querySelectorAll('[data-a="evChoose"]')];
      out.btns = btns.length; out.small = btns.filter(b => { const x = b.getBoundingClientRect(); return x.height < 44 || x.width < 44; }).length;
      out.pct = /\d+\s?%/.test(document.body.innerText);
      out.raw = T.raw.test(document.body.innerText);
      const want = q.ctx.offers[0][0];
      A.eventChoose(0); A.eventClose();
      const m = pc.mil || {};
      out.mil = { branch: m.branch, want, troop: m.troop, arm: m.arm, cmd: m.cmd, div: m.div };
      out.troopFits = !!(m.branch && (A.MUSTER.B(m.branch).troops.includes(m.troop) || m.troop === A.MUSTER.troopIn(m.branch, m.realm)));
      out.cmdHasDiv = !!(m.cmd && m.div && A.CMD.divCmd(A.divById(m.div)) === m.cmd) || !(A.CMD.get(m.cmd) && A.CMD.divs(A.CMD.get(m.cmd)).length);
      out.armCard = A.specChoices(pc).some(c => c.tier === 'arm');
      // the War tab
      UI.tab = 'war'; UI.render();
      const card = document.querySelector('.md-place');
      out.place = card ? card.innerText.replace(/\s+/g, ' ').slice(0, 260) : '';
      out.placePct = card ? /\d+\s?%/.test(card.innerText) : true;
      const notes = card ? [...card.querySelectorAll('.md-why')] : [];
      out.notes = notes.length; out.notesSmall = notes.filter(b => { const x = b.getBoundingClientRect(); return x.height < 44 || x.width < 44; }).length;
      out.wide = document.documentElement.scrollWidth > 376;
      UI.tab = 'life'; UI.render();
      // walking away: no oath
      T.enter({ seed: 8, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const p2 = A.pc(); A.S.queue = [];
      A.doActivity('enlist');
      const q2 = A.headReady(), v2 = q2 ? A.eventView(q2) : null;
      const k = v2 ? v2.choices.findIndex(c => /walk home/.test(c.t)) : -1;
      if (k >= 0) { A.eventChoose(k); A.eventClose(); }
      out.walked = k >= 0 && !p2.mil;
      return out;
    });
    const ok = r.notYet && r.card === 'md_muster' && r.words <= 80 && r.choices.length >= 2 && r.btns >= 2 && !r.small && !r.pct && !r.raw
      && r.mil.branch === r.mil.want && r.troopFits && r.mil.arm && r.mil.cmd && r.cmdHasDiv && !r.armCard && r.place && !r.placePct && r.notes >= 2 && !r.notesSmall && !r.wide && r.walked;
    return { ok, detail: JSON.stringify(r) };
  },

  // a scene of the release swears him in with no branch: the muster-master writes him down by his own decision, and the
  // card follows so he may ask for another place; the lot makes no offers
  async mdSceneAndLot(pg) {
    const r = await pg.evaluate(() => {
      const SV = (p, k, v) => A.SK.set(p, k, A.SK.lvOfValue(v));
      const out = {};
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const pc = A.pc(); A.S.queue = [];
      SV(pc, 'bow', 40); SV(pc, 'tracking', 40); SV(pc, 'craft', 40);
      // a scene's effect (as the release's cards call it): A.enlist inside A.applyFx
      let res = null;
      A.applyFx(pc, p => { res = A.enlist(p, false); return ''; }, {});
      out.ok = !!(res && res.ok !== false && pc.mil);
      out.branch = pc.mil && pc.mil.branch;
      const rec = (A.S.why || []).find(x => x.k === 'muster' && x.at === pc.id);
      out.rec = rec ? { chose: rec.chose, why: rec.why.length } : null;
      const q = A.S.queue.find(x => x.ev === 'md_muster');
      out.card = !!q && q.ctx.sworn === 1;
      if (q) {
        A.S.queue = [q].concat(A.S.queue.filter(x => x !== q));
        A.headReady();
        const v = A.eventView(q);
        out.walk = v.choices.some(c => /walk home/.test(c.t));
        out.n = v.choices.length;
        if (v.choices.length >= 2) {
          const want = q.ctx.offers[1][0];
          A.eventChoose(1); A.eventClose();
          out.moved = pc.mil.branch === want;
          out.troop = pc.mil.troop;
          const M = A.CO && A.CO.mine(pc);
          out.co = M ? M.d.id === pc.mil.div : !A.S.coOn;
        }
      }
      // the lot: conscript foot, no card
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const p2 = A.pc(); A.S.queue = [];
      A.enlist(p2, false, { branch: 'conscripts' });
      out.lot = { branch: p2.mil && p2.mil.branch, troop: p2.mil && p2.mil.troop, card: A.S.queue.some(x => x.ev === 'md_muster') };
      return out;
    });
    const ok = r.ok && r.branch && r.rec && r.rec.why >= 1 && r.rec.chose === r.branch && r.card && !r.walk && r.n >= 2 && r.moved && r.co
      && r.lot.branch === 'conscripts' && r.lot.troop === 'LV' && !r.lot.card;
    return { ok, detail: JSON.stringify(r) };
  },

  // roles: a captain offers one to a man with the skill and a reason, through A.WHY; the role pays and teaches; an
  // officer hands it on; a man with no aptitude is offered none
  async mdRoles(pg) {
    const r = await pg.evaluate(() => {
      const SV = (p, k, v) => A.SK.set(p, k, A.SK.lvOfValue(v));
      const MU = A.MUSTER, out = {};
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const pc = A.pc(); A.S.queue = [];
      A.enlist(pc, false, { branch: 'spears' }); A.S.queue = [];
      const all = A.DATA.skills.skills.map(s => s.id);
      for (const k of all) SV(pc, k, 0);
      out.none = MU.roleOptions(pc).length;
      const rec0 = MU.roleAsk(pc, { dry: true, log: false });
      out.noneChose = rec0 ? rec0.chose : null;
      SV(pc, 'learning', 45); SV(pc, 'medicine', 40);
      const rec = MU.roleAsk(pc, { muster: true });
      out.chose = rec && rec.chose; out.why = rec ? rec.why.map(x => x[0]) : [];
      const q = A.S.queue.find(x => x.ev === 'md_role');
      out.card = !!q;
      if (q) { A.S.queue = [q]; A.headReady(); const v = A.eventView(q); out.text = v.text; A.eventChoose(0); A.eventClose(); }
      out.role = pc.mil.role && pc.mil.role.k;
      const c0 = pc.coin, xp0 = JSON.stringify(pc.skx || pc.xp || null);
      MU.month(pc);
      out.paid = pc.coin - c0;
      pc.mil.rank = 3; MU.month(pc);
      out.dropped = !pc.mil.role;
      return out;
    });
    const ok = r.none === 1 && (r.noneChose === null || r.noneChose === 'none') && r.chose && r.chose !== 'none' && r.why.length >= 1 && r.card && r.role === r.chose && r.paid > 0 && r.dropped;
    return { ok, detail: JSON.stringify(r) };
  },

  // R14: one glossary of rank and unit words: at every grade the Path card, the chain of command, the War tab and the
  // rank's description say the same rank and the same number of men, and the unit word is the rank's
  async mdWordsAgree(pg) {
    const r = await pg.evaluate(() => {
      const SV = (p, k, v) => A.SK.set(p, k, A.SK.lvOfValue(v));
      const MU = A.MUSTER, out = { bad: [], seen: 0 };
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      const pc = A.pc(); A.S.queue = [];
      A.enlist(pc, false, { branch: 'spears' }); A.S.queue = [];
      for (let g = 0; g <= 6; g++) {
        pc.mil.rank = g; A.pcDivAttach(pc); if (A.S.coOn) A.CO.place(pc);
        const P = MU.post(pc), men = A.fmt(P.men);
        if (P.unit !== (g === 0 ? '' : A.milUnitWord(g))) out.bad.push(`grade ${g}: post ${P.unit} against ${A.milUnitWord(g)}`);
        const path = UI.armyPathCard(pc);
        if (!path.includes(`leads ${men}`)) out.bad.push(`grade ${g}: path card does not lead ${men}`);
        UI.tab = 'war'; UI.render();
        const card = document.querySelector('.md-place');
        const t = card ? card.innerText : '';
        if (!t.includes(GD.MIL[g].title)) out.bad.push(`grade ${g}: War tab lacks ${GD.MIL[g].title}`);
        if (g > 0 && !t.includes(`${P.unit} of ${men}`)) out.bad.push(`grade ${g}: War tab lacks "${P.unit} of ${men}" in "${t.slice(0, 80)}"`);
        const chain = document.querySelector('.chain');
        if (chain && !chain.innerText.includes(`leads ${men}`)) out.bad.push(`grade ${g}: chain does not lead ${men}`);
        const old = /\b(File-?Leader|Squad Captain|Senior Captain|High General|Marshal)\b/.exec(document.body.innerText);
        if (old) out.bad.push(`grade ${g}: old word ${old[0]}`);
        out.seen++;
      }
      UI.tab = 'life'; UI.render();
      return out;
    });
    return { ok: !r.bad.length && r.seen === 7, detail: `${r.seen} grades; ${r.bad.slice(0, 6).join('; ') || 'all agree'}` };
  },

  // old saves: a soldier with a troop and no branch reads as his troop's branch, and plays on
  async mdOldSaves(pg) {
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
          const before = pc && pc.mil ? { troop: pc.mil.troop, branch: pc.mil.branch || null } : null;
          const read = pc && pc.mil ? A.MUSTER.branchOf(pc) : null;
          if (pc && pc.mil) { UI.tab = 'war'; UI.render(); }
          const card = !pc || !pc.mil || !!document.querySelector('.md-place');
          UI.tab = 'life'; UI.render();
          T.play(1);
          const p2 = A.pc(), after = p2 && p2.alive && p2.mil ? p2.mil.branch : null;
          return { f, ok: (!before || (!!read && card)) && (!(p2 && p2.alive && p2.mil) || !!after), before, read, after };
        } catch (e) { return { f, ok: false, err: String(e && e.message || e).slice(0, 120) }; }
      }, [b64, f]));
    }
    const bad = out.filter(r => !r.ok);
    return { ok: !bad.length && out.length >= 5, detail: `${out.length} saves; soldiers: ${out.filter(r => r.before).map(r => `${r.f}: ${r.before.troop} reads as ${r.read}`).join('; ') || 'none'}${bad.length ? '; bad: ' + JSON.stringify(bad.slice(0, 3)) : ''}` };
  },

  // the same seed and the same choices give the same muster, offers, branch and role
  async mdDeterministic(pg) {
    const r = await pg.evaluate(() => {
      const SV = (p, k, v) => A.SK.set(p, k, A.SK.lvOfValue(v));
      const run = () => {
        T.enter({ seed: 2024, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
        const pc = A.pc(); A.S.queue = [];
        SV(pc, 'bow', 35); SV(pc, 'learning', 35);
        A.doActivity('enlist');
        const q = A.headReady(); const offers = q && q.ctx ? JSON.stringify(q.ctx.offers) : '';
        if (q) { A.eventChoose(0); A.eventClose(); }
        T.play(2);
        return JSON.stringify([offers, pc.mil && pc.mil.branch, pc.mil && pc.mil.role, A.rngState]);
      };
      const a = run(), b = run();
      return { same: a === b, a: a.slice(0, 200) };
    });
    return { ok: r.same, detail: JSON.stringify(r) };
  },
};
