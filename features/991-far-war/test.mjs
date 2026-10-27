// Tests for features/991-far-war: armies, styles, orders, Legends and Masters, conflicts, tempers and sieges of the
// Great Continent, and the Known World left exactly as it was.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { HELPERS } from '../../tests/helpers.mjs';
import { unpack, repack } from '../../tools/pack.mjs';

// the same build without this feature: its code files cut from the core blob (it has no patches)
function beforeBuild(file) {
  const html = fs.readFileSync(file, 'utf8'), parts = unpack(html);
  let core = parts['ardan-core'];
  const MARK = '\n;(function(){ // features/', mine = MARK + '991-far-war/';
  for (let at = core.indexOf(mine); at >= 0; at = core.indexOf(mine)) {
    const next = core.indexOf(MARK, at + 1);
    core = core.slice(0, at) + (next >= 0 ? core.slice(next) : '');
  }
  parts['ardan-core'] = core;
  const out = path.join(os.tmpdir(), `ardan-fw-before-${process.pid}.html`);
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
// three Known World lives of three years each: the state hash and the random stream
const KNOWN = () => {
  const out = [];
  for (const [seed, realm, race] of [[9911, 'POL-01', 'human'], [9912, 'POL-20', 'human'], [9913, 'POL-11', 'orc']]) {
    A.newGame({ seed, race, realm, status: 'peasant', sex: 'M', startAge: 17, lands: 'known' });
    T.play(3);
    out.push(T.hash(A.S) + ':' + A.rngState + ':' + JSON.stringify(A.S).length);
  }
  return out;
};
const GREAT = o => Object.assign({ seed: 9921, race: 'human', realm: 'POL-36', status: 'peasant', sex: 'M', startAge: 20, lands: 'great' }, o || {});

export default {
  // every far realm's army is built from its lore codes: doctrine slots, shares and divisions all name real troops
  async fwArmies(pg) {
    const r = await pg.evaluate(G => {
      A.newGame(G);
      const D = A.FW.D, S = A.S, bad = [], tpl = new Set(), names = new Set();
      let n = 0, divs = 0, codes = new Set();
      for (const rid in D.armies) {
        const R = S.realms[rid]; if (!R || !R.alive) continue;
        n++;
        const doc = GD.DOCTRINE[rid], a = D.armies[rid];
        if (!doc || doc.length !== 7 || doc.some(c => c && !GD.TROOPS[c])) bad.push(rid + ' doctrine');
        const sh = A.compShares(rid, null);
        if (sh.some(([c]) => !GD.BN[c] || !a.c[c])) bad.push(rid + ' shares ' + sh.map(x => x[0]).join(','));
        if (Math.abs(sh.reduce((s, x) => s + x[1], 0) - 1) > 1e-6) bad.push(rid + ' share sum');
        for (const t of Object.values(R.forces.tpl)) { for (const c of t.bns) { if (!GD.BN[c]) bad.push(rid + ' bn ' + c); codes.add(c); } if (!t.order) names.add(t.name); }
        divs += R.forces.divs.length;
        if (!R.forces.divs.length) bad.push(rid + ' no divisions');
        tpl.add(a.t);
      }
      const kinds = ['HA', 'XB', 'EL', 'CM', 'MR', 'HC', 'OR', 'GI', 'SC', 'EN'].filter(c => codes.has(c));
      const scen = !!GD.TROOPS.SC && !!GD.TROOPS.EN;
      A.newGame({ seed: 9922, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20, lands: 'known' });
      const gone = !GD.TROOPS.SC && !GD.TROOPS.EN && !GD.DOCTRINE['POL-36'];
      return { n, divs, tpl: tpl.size, bad: bad.slice(0, 6), nbad: bad.length, kinds, names: [...names].slice(0, 12), scen, gone };
    }, GREAT());
    const ok = r.n >= 110 && !r.nbad && r.tpl === 23 && r.kinds.length >= 9 && r.scen && r.gone;
    return { ok, detail: `${r.n} far realms, ${r.divs} divisions from ${r.tpl} templates; troop kinds in the field: ${r.kinds.join(' ')}; division names: ${r.names.join(', ')}; ` +
      `${r.nbad} bad${r.nbad ? ' (' + r.bad.join('; ') + ')' : ''}; scouts and engineers ${r.scen ? 'in' : 'MISSING'} far, ${r.gone ? 'out' : 'STILL IN'} in the Known World` };
  },

  // the 303 styles resolve; schools in their seats; household styles in far houses; maneuvers; learn, main, found
  async fwStyles(pg) {
    const r = await pg.evaluate(G => {
      T.enter(G);
      const D = A.FW.D, pc = A.pc(), out = {};
      out.resolve = D.styles.filter(s => A.style(s.id) && A.style(s.id).techniques.length >= 3).length;
      out.kinds = D.styles.reduce((m, s) => (m[s.kind] = (m[s.kind] || 0) + 1, m), {});
      out.house = D.styles.filter(s => s.kind === 'household').filter(s => { const st = A.style(s.id); return st.house && A.FAR.D.houses[st.house]; }).length;
      out.mv = D.styles.filter(s => s.maneuver && GD.BATTLE_TACTICS['mv_' + s.id]).length;
      out.mvN = D.styles.filter(s => s.maneuver).length;
      const L = A.schoolList(pc), far = L.filter(o => o.kind === 'style' && A.style(o.id) && A.style(o.id).far);
      out.schools = far.length; out.here = far.filter(o => o.here).length;
      out.seats = far.filter(o => A.S.prov.some(p => p.name === o.seat)).length;
      // learn a far style, make it the main one, fight with it, found one's own
      const sid = 'ST36-01';
      A.learnStyle(pc, sid, 2); A.setMainStyle(sid);
      const f = A.fighterFrom ? A.fighterFrom(pc) : null;
      out.main = pc.styleMain === sid; out.chain = f && f.chain;
      pc.skills.xbow = 80; pc.skills.sword = 80; pc.gear.weapon = 'longsword'; pc.flags.duelWins = 12; pc.st.int = 60; pc.st.ins = 60;
      const fs = A.foundStyle(pc, 'The Venshai Bolt'); out.found = fs.ok;
      // a national style is taught to a far realm's soldiers
      let taught = 0;
      let soldiers = 0;
      for (const id in A.S.people) {
        const p = A.S.people[id];
        if (!p.alive || p.realm !== 'POL-36' || !A.isAdult(p) || p.fw) continue;
        const q = Object.assign({}, p, { styles: undefined, status: 'gentry' }); soldiers++;
        A.npcStyles(q); if (Object.keys(q.styles || {}).some(k => /^ST36-/.test(k))) taught++;
      }
      out.soldiers = soldiers;
      out.taught = taught;
      A.newGame({ seed: 9923, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20, lands: 'known' });
      out.gone = !A.style(sid) && !GD.BATTLE_TACTICS['mv_' + sid];
      return out;
    }, GREAT());
    const ok = r.resolve === 303 && r.house === r.kinds.household && r.mv === r.mvN && r.schools >= 250 && r.here >= 3 && r.main && r.chain && r.found && r.gone && r.taught > r.soldiers / 3;
    return { ok, detail: `${r.resolve} of 303 styles resolve (${Object.entries(r.kinds).map(([k, v]) => v + ' ' + k).join(', ')}); ${r.house} household styles in far houses; ${r.mv} of ${r.mvN} maneuvers are battle tactics; ` +
      `${r.schools} far schools listed (${r.here} in the player's realm, ${r.seats} seats are places on the map); learned and made main: ${r.main ? r.chain : 'NO'}; founded a style: ${r.found}; ` +
      `${r.taught} of ${r.soldiers} grown people of Taulen (as gentry) are taught a Taulen style; out of a Known World game: ${r.gone}` };
  },

  // the 121 orders resolve: field orders raised with a leader, organisations with a seat; groups; joining one
  async fwOrders(pg) {
    const r = await pg.evaluate(G => {
      T.enter(G);
      const D = A.FW.D, S = A.S, FW = A.FW, out = { bad: [] };
      const groups = new Set(D.groups.map(g => g.name));
      let field = 0, orgs = 0, led = 0, lore = 0, raised = 0;
      for (const o of D.orders) {
        const x = FW.org(o.id);
        if (!x) { out.bad.push(o.id + ' missing'); continue; }
        if (!groups.has(x.group)) out.bad.push(o.id + ' group ' + x.group);
        if (!x.seat) out.bad.push(o.id + ' seat');
        if (x.field) {
          field++;
          if (!GD.ORDERS[o.id]) { out.bad.push(o.id + ' not in GD.ORDERS'); continue; }
          const d = A.orderDiv(o.id), R = S.realms[o.realm];
          if (d) raised++;
          const L = R && R.orders && A.P(R.orders[o.id]);
          if (L && L.alive) led++;
          if (L && S.fw.heads[o.id] === L.id) lore++;
          if (!A.orderRankName({ order: { id: o.id, rank: 1 }, sex: 'M' })) out.bad.push(o.id + ' rank');
        } else orgs++;
      }
      Object.assign(out, { field, orgs, led, lore, raised });
      // a soldier of Taulen good enough for the Ninefold Crossbows asks, and is sworn
      const pc = A.pc();
      A.enlist(pc);
      pc.skills.xbow = 70; pc.skills.bow = 70; pc.skills.sword = 70; pc.skills.melee = 70; for (const s of ['str', 'spd', 'ins', 'sta', 'wil']) pc.st[s] = 75;
      pc.gear.weapon = 'longsword'; pc.gear.armor = 'mail';
      out.reqs = A.orderReqs(pc, 'ORD-001').filter(x => !x.ok).map(x => x.label);
      const j = A.orderJoin('ORD-001'); out.join = j.ok; out.rank = A.orderRankName(pc);
      out.card = (UI.ordersCard(pc) || '').includes('in all of Ardan');
      return out;
    }, GREAT());
    const ok = !r.bad.length && r.field + r.orgs === 121 && r.raised === r.field && r.led === r.field && r.lore >= 40 && r.join;
    return { ok, detail: `${r.field} field orders (${r.raised} raised, ${r.led} led, ${r.lore} by the head the lore names) and ${r.orgs} organisations; ` +
      `joined the Ninefold Crossbows: ${r.join ? 'yes, as ' + r.rank : 'NO (' + r.reqs.join('; ') + ')'}${r.bad.length ? '; bad: ' + r.bad.slice(0, 5).join('; ') : ''}` };
  },

  // the 40 Legends and 160 Masters are people of 1105: realms, styles, ages, homes, weaknesses; the census caps hold
  async fwPeople(pg) {
    const r = await pg.evaluate(G => {
      A.newGame(G);
      const D = A.FW.D, S = A.S, out = { bad: [], tiers: {} };
      for (const x of D.legends.concat(D.masters)) {
        const p = A.P(S.fw.p[x.id]);
        if (!p || !p.alive) { out.bad.push(x.id + ' missing'); continue; }
        const kind = x.id.slice(0, 3), t = A.tierOf(A.fightWorth(p)).k;
        out.tiers[kind + ' ' + t] = (out.tiers[kind + ' ' + t] || 0) + 1;
        if (p.realm !== x.realm) out.bad.push(x.id + ' realm');
        if (p.styleMain !== x.style || !A.style(x.style)) out.bad.push(x.id + ' style');
        if (Math.abs(A.age(p) - x.age) > 1) out.bad.push(x.id + ' age ' + A.age(p) + '/' + x.age);
        if (p.home == null || !A.prov(p.home)) out.bad.push(x.id + ' home');
        if (!p.fw || p.fw.weak !== x.weak) out.bad.push(x.id + ' weakness');
      }
      const C = A.ladderCensus();
      out.legends = C.legends.length; out.cap = GD.LEGEND_CAP; out.mcap = GD.MASTER_CAP;
      out.maxM = Math.max(...Object.values(C.masters).map(l => l.length));
      out.farLegends = C.legends.filter(id => A.FAR.D.realms[A.P(id).realm]).length;
      const pc = A.pc(), legend = A.P(S.fw.p['LGD-01']);
      // seek out a Master, train under him, and learn his style
      const M = A.P(S.fw.p['MST-001']);
      pc.home = M.home; pc.coin = 900; pc.fame = 90; pc.skills.xbow = 60; pc.skills.bow = 60;
      let res = { ok: false };
      for (let i = 0; i < 6 && !res.ok; i++) res = A.FW.train(M.id);
      out.train = !!(res.ok && pc.styles && pc.styles[M.styleMain] && pc.rel[M.id] && pc.rel[M.id].type === 'mentor');
      const tf = A.teacherFor(pc, 'xbow'); out.teacher = !!(tf && tf.p.id === M.id);
      UI.screen = 'game';
      out.card = UI.personModal(legend, '').includes('Legend of the Far Lands');
      return out;
    }, GREAT());
    const lt6 = r.tiers['LGD t6'] || 0, m5 = r.tiers['MST t5'] || 0, m4 = r.tiers['MST t4'] || 0;
    const ok = !r.bad.length && lt6 === 40 && m5 + m4 === 160 && m5 >= 150 && r.maxM <= r.mcap && r.legends <= r.cap && r.card && r.train;
    return { ok, detail: `Legends: ${lt6} of 40 at Legend worth; Masters: ${m5} at Master worth, ${m4} trimmed to Elite (their realm had ${r.mcap}); census: ${r.legends} Legends (cap ${r.cap}, ${r.farLegends} in the far lands), ` +
      `at most ${r.maxM} Masters in a realm (cap ${r.mcap}); person card ${r.card ? 'shows the lore' : 'MISSING'}; trained under a Master: ${r.train ? 'yes' : 'NO'}${r.teacher ? ', who now teaches the crossbow' : ''}${r.bad.length ? '; bad: ' + r.bad.slice(0, 5).join('; ') : ''}` };
  },

  // the conflicts of 1105: three wars with a casus belli that cites the want, the rest wants with a plan
  async fwConflicts(pg) {
    const r = await pg.evaluate(G => {
      A.newGame(G);
      const S = A.S, cf = S.fw.cf, out = { cf: cf.length, wars: 0, cited: 0, plans: 0, wants: 0 };
      for (const c of cf) {
        if (c.mode === 'war') { const w = S.wars.find(x => x.id === c.w); if (w) { out.wars++; if (w.casus && (w.casus.cites || []).some(x => x.k === 'want')) out.cited++; } }
        if (c.mode === 'want') { if (S.realms[c.a].csPlan && S.realms[c.a].csPlan.t === c.b) out.plans++; if (A.CASUS.wantOf(c.a, c.b)) out.wants++; }
        const rel = S.realms[c.a].rel[c.b]; if (typeof rel === 'number' && rel > 0) out.warm = (out.warm || 0) + 1;
      }
      out.sample = (S.wars.find(x => x.id === cf.find(c => c.mode === 'war').w) || {}).casus;
      out.sample = out.sample ? out.sample.t : '';
      return out;
    }, GREAT());
    const ok = r.cf === 10 && r.wars === 3 && r.cited === 3 && r.plans === 6 && r.wants === 6 && !r.warm;
    return { ok, detail: `${r.cf} conflicts: ${r.wars} wars (${r.cited} with the want in the casus belli), ${r.plans} plans, ${r.wants} wants; e.g. "${r.sample.slice(0, 140)}"` };
  },

  // tempers, sieges, a duel with a Legend, a year of war in the far lands: no page error, and rendering is pure
  async fwFarPlays(pg) {
    const r = await pg.evaluate(G => {
      T.enter(G);
      const S = A.S, FW = A.FW, out = {};
      // tempers: a far general with no temper of his own takes his template's
      const t = {}; for (const rid in A.FAR.D.realms) { const R = S.realms[rid]; if (!R || !R.alive) continue; const g = A.P(R.ruler); if (g) { const k = A.GENERALS.temper(g); t[k] = (t[k] || 0) + 1; } }
      out.tempers = t;
      // sieges: the walls and size of Venshai
      const P = S.prov[S.realms['POL-36'].capitalProv];
      out.k = Math.round(FW.siegeK(P) * 100) / 100; out.fort = P.fort; out.city = P.name;
      out.kOpen = Math.round(FW.siegeK(S.prov[S.realms['POL-58'].capitalProv]) * 100) / 100;
      const besiege = on => {
        const d = S.realms['POL-37'].forces.divs[0], keep = { loc: d.loc, path: d.path, atk: d.atk };
        const def = A.divsAt(P.id).filter(x => x.r !== 'POL-37'), was = def.map(x => x.loc);
        for (const x of def) x.loc = S.realms['POL-36'].forces.divs.find(y => y.loc !== P.id).loc;
        A._locIdx = null;
        A.startWar('POL-37', 'POL-36', null, 'conquest', { silent: true });
        d.loc = P.id; d.path = []; d.atk = null; P.sgBy = null; P.sgd = 0; A._locIdx = null;
        const fon = FW.on; FW.on = on;
        const occ0 = P.occ || null;
        let days = 0, need = 0; try { while (A.ctrl(P) === 'POL-36' && days < 400) { A.wsSiegeDay([d]); days++; if (P.sgNeed) need = Math.round(P.sgNeed); } } finally { FW.on = fon; }
        P.sgBy = null; P.sgd = 0; P.occ = occ0; Object.assign(d, keep); def.forEach((x, i) => { x.loc = was[i]; }); A._locIdx = null;
        return [days, need];
      };
      try { out.siegeFar = besiege(true); out.siegePlain = besiege(false); } catch (e) { out.siegeErr = String(e).slice(0, 200); }
      // a duel with a Legend
      const pc = A.pc(), L = A.P(S.fw.p['LGD-01']);
      A.startDuel(pc, L, { kind: 'duel', lethal: false });
      let n = 0; while (S.duel && n++ < 300) A.duelAuto();
      out.duel = !S.duel;
      // a year of war
      A.enlist(pc);
      out.play = T.play(1);
      out.battles = S.wars.reduce((s, w) => s + (A.FAR.D.realms[w.leadA] ? (w.battles || []).length : 0), 0);
      // rendering is pure
      UI.screen = 'game';
      const s0 = T.hash(S), r0 = A.rngState;
      UI.personModal(L, ''); UI.ordersCard(pc); UI.powerPage(pc); T.renderAll && T.renderAll();
      out.pure = s0 === T.hash(S) && r0 === A.rngState;
      return out;
    }, GREAT({ realm: 'POL-91', seed: 9924 }));
    const [fd, fn] = r.siegeFar || [0, 0], [pd, pn] = r.siegePlain || [0, 0];
    const tempers = Object.entries(r.tempers).map(([k, v]) => v + ' ' + k).join(', ');
    const ok = r.k > 1.3 && r.kOpen === 1 && fd > pd * 1.25 && r.duel && r.play === 'ok' && r.battles > 0 && r.pure && !r.siegeErr && (r.tempers.steady || 0) < (r.tempers.bold || 0) + (r.tempers.cautious || 0) + (r.tempers.cunning || 0);
    return { ok, detail: `far rulers' tempers: ${tempers}; the walls of ${r.city} (walls ${r.fort}): a siege ${r.k}x as long (a tent capital: ${r.kOpen}x), ${fd} days against ${pd} without (need ${fn})${r.siegeErr ? ' ERR ' + r.siegeErr : ''}; ` +
      `a duel with a Legend ${r.duel ? 'fought out' : 'STUCK'}; a year at war: ${r.play}, ${r.battles} battles in far wars; rendering ${r.pure ? 'pure' : 'NOT PURE'}` };
  },

  // a life inside it: the cast of each realm, an organisation's way in and duties, the far soldier's scenes, the horse,
  // and the 1105 wars on the record with a recruiter
  async fwLife(pg) {
    const r = await pg.evaluate(G => {
      const out = {}, FW = A.FW;
      const render = (ev, ctx) => { const e = A.EV[ev], pc = A.pc(); const t = typeof e.text === 'function' ? e.text(pc, ctx) : e.text; return A.T(t, A.ctxTokens(pc, ctx)); };
      const queued = ev => A.S.queue.find(q => q && q.ev === ev);
      T.enter(G);
      const S = A.S;
      // the cast: people per realm who carry a national style of their realm
      const carry = {};
      for (const id in S.people) { const p = S.people[id]; if (!p.alive || !A.FAR.D.realms[p.realm]) continue; if (Object.keys(p.styles || {}).some(k => (A.style(k) || {}).realm === p.realm && A.style(k).kind === 'national')) carry[p.realm] = (carry[p.realm] || 0) + 1; }
      const vals = Object.keys(A.FW.D.armies).filter(id => S.realms[id]).map(id => carry[id] || 0).sort((a, b) => a - b);
      out.cast = FW.stats.cast; out.carryMed = vals[vals.length >> 1]; out.carryMin = vals[0];
      out.castMasters = Object.values(S.people).filter(p => p.fwc && A.fightWorth(p) >= 91).length;
      out.maxM = Math.max(...Object.values(A.ladderCensus().masters).map(l => l.length));
      // the 1105 wars: news, and the recruiter for a grown subject of Vahra
      out.news = (S.news || []).filter(n => /In the far lands:/.test(n.t || n.text || n)).length;
      S.queue = []; A.advance(31);
      const rq = queued('fw_war_recruit'); out.recruiter = !!rq; out.rqText = rq ? render('fw_war_recruit', rq.ctx) : '';
      S.queue = [];
      // an organisation: Vahra has none, so a subject of Taulen is taken into the Hall of Nine Targets
      const pc = A.pc();
      pc.realm = 'POL-36'; pc.skills.bow = 40; pc.skills.melee = 40; pc.coin = 200;
      const reqs = FW.orgReqs(pc, 'ORD-074').filter(x => !x.ok).map(x => x.label);
      const j = FW.orgJoin('ORD-074'); out.org = j.ok ? FW.orgRank(pc) : 'NO: ' + reqs.join('; ');
      pc.fwOrg.next = 0; A.advance(31);
      const dq = queued('fw_duty_school'); out.duty = !!dq; out.dutyText = dq ? render('fw_duty_school', dq.ctx) : '';
      A.applyFx(pc, { fwOrg: 30 }, {}); out.orgRank = FW.orgRank(pc);
      out.card = (UI.ordersCard(pc) || '').includes('Other bodies of');
      FW.orgLeave(); S.queue = [];
      // a soldier of the Khaganate: the recruit scene, the horse, a rank up
      pc.realm = 'POL-58'; pc.gear.mount = null;
      A.enlist(pc);
      const re = queued('fw_recruit'); out.recruit = re ? render('fw_recruit', re.ctx) : '';
      S.queue = []; out.troop0 = pc.mil && pc.mil.troop;
      A.advance(31);
      out.horseAsked = !!queued('fw_horse');
      A.applyFx(pc, { fwHorse: 'levy' }, {}); out.troop1 = pc.mil.troop; out.debt = pc.fwDebt;
      S.queue = []; pc.mil.rank = (pc.mil.rank || 0) + 1; A.advance(31);
      const ru = queued('fw_rankup'); out.rankup = ru ? render('fw_rankup', ru.ctx) : '';
      S.queue = []; out.play = T.play(0.5);
      return out;
    }, GREAT({ realm: 'POL-91', seed: 9927 }));
    const clean = s => s && !/[{}]/.test(s);
    const ok = r.cast > 500 && r.carryMed >= 5 && !r.castMasters && r.maxM <= 5 && r.news === 3 && r.recruiter && clean(r.rqText) && /of the Hall of Nine Targets$/.test(r.org) &&
      r.duty && clean(r.dutyText) && r.card && clean(r.recruit) && r.horseAsked && r.troop1 === 'HA' && r.debt === 60 && clean(r.rankup) && r.play === 'ok';
    return { ok, detail: `${r.cast} more named people (median ${r.carryMed}, least ${r.carryMin} per far realm carry a national style; ${r.castMasters} above Elite; at most ${r.maxM} Masters a realm); ` +
      `${r.news} wars in the news; a recruiter: "${(r.rqText || 'NONE').slice(0, 90)}…"; organisation: ${r.org}, a duty ${r.duty ? 'queued' : 'MISSING'} ("${(r.dutyText || '').slice(0, 60)}…"), then ${r.orgRank}; ` +
      `recruit scene "${(r.recruit || 'NONE').slice(0, 70)}…"; horse offered ${r.horseAsked}, ${r.troop0} to ${r.troop1} with a debt of ${r.debt}; rank-up "${(r.rankup || 'NONE').slice(0, 60)}…"; played on ${r.play}` };
  },

  // a far game saves and loads back with its Legends, orders and conflicts, after a Known World game in the page
  async fwSaveLoad(pg) {
    const r = await pg.evaluate(async G => {
      const sig = () => [T.hash(A.S.people), T.hash(A.S.realms), T.hash(A.S.fw), A.rngState].join('|');
      T.enter(G); T.play(0.5);
      const before = sig(), enc = await SAVES.encode(A.S, A.J);
      T.enter({ seed: 9926, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      const off = !A.FW.on && !GD.ORDERS['ORD-001'];
      const okLoad = UI.enterSave(await SAVES.decode(enc.bytes));
      const after = sig(), on = A.FW.on && !!GD.ORDERS['ORD-001'] && !!A.style('ST36-01');
      const L = A.P(A.S.fw.p['LGD-01']), legend = !!(L && L.fw && L.fw.id === 'LGD-01');
      const res = T.play(0.5);
      return { off, okLoad, same: before === after, on, legend, res, kb: Math.round(enc.bytes.length / 1024) };
    }, GREAT({ seed: 9925 }));
    const ok = r.off && r.okLoad && r.same && r.on && r.legend && r.res === 'ok';
    return { ok, detail: `save ${r.kb} KB; a Known World game in between ${r.off ? 'had none of it' : 'STILL HAD the far war'}; loaded back ${r.same ? 'the same' : 'DIFFERENT'}, far war ${r.on ? 'in' : 'MISSING'}, Legends ${r.legend ? 'as saved' : 'LOST'}; played on: ${r.res}` };
  },

  // the Known World plays exactly as before: the same state and stream without this feature, and after a far game
  async fwKnownSame(pg, pageErrors, { browser, file }) {
    let before;
    try { before = beforeBuild(file); } catch (e) { return { ok: false, detail: 'could not derive the build without this feature: ' + e.message }; }
    let base;
    const B = await openPage(browser, before);
    try { base = await B.pg.evaluate(KNOWN); } finally { await B.ctx.close(); fs.rmSync(before, { force: true }); }
    const mine = await pg.evaluate(KNOWN);
    const after = await pg.evaluate(G => { A.newGame(G); T.play(0.2); return true; }, GREAT()).then(() => pg.evaluate(KNOWN));
    const same = base.join() === mine.join(), same2 = base.join() === after.join();
    return { ok: same && same2 && !B.errs.length, detail: `3 Known World lives of 3 years: ${same ? 'identical' : 'DIFFERENT'} without this feature, ${same2 ? 'identical' : 'DIFFERENT'} after a Great Continent game in the same page` };
  },
};
