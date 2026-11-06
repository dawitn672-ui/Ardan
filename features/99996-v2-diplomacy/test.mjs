// v2 diplomacy (step 7 of docs/v2/V2_SPEC.md): relations are sums of named reasons, one status, monthTick decides.
const HELP = () => {
  window.DT = {
    // play on from the current life; when the player dies, carry on as someone else (the world is what is tested)
    run(years, each) {
      const end = A.S.year + years; let lastY = A.S.year;
      for (let k = 0; k < 100000 && A.S.year < end; k++) {
        A.advance(30);
        let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
        if (!A.pc() || !A.pc().alive) { const kid = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc && A.isAdult(p) && !p.ruler); if (!kid) break; A.S.pc = kid.id; }
        if (A.S.year !== lastY) { lastY = A.S.year; each && each(); }
      }
    },
    others() { const me = A.pc().realm; return Object.values(A.S.realms).filter(r => r.alive && !r.isRebel && r.id !== me && !r.playerRun).map(r => r.id).sort(); },
    text(h) { const d = document.createElement('div'); d.innerHTML = h; return d.textContent; },
  };
};

export default {
  // over a century and more (3 seeds x 40 years; 100 years each passes too but takes 14 minutes) alliances form and break, and wars start and end, for named reasons
  async v2DipAlive(pg) {
    await pg.evaluate(HELP);
    const out = [];
    for (const seed of [11, 2024, 90210]) {
      out.push(await pg.evaluate((seed) => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
        const DV = A.V2DIP, s0 = Object.assign({}, DV.stats), seen = new Set(), ended = new Set();
        const look = () => { const now = new Set(A.S.wars.map(w => w.id)); for (const id of seen) if (!now.has(id)) ended.add(id); for (const id of now) seen.add(id); };
        look();
        DT.run(40, look);
        const d = k => DV.stats[k] - s0[k];
        const h = A.S.v2dip.h, pairs = Object.keys(A.S.v2dip.f).length;
        return { seed: A.S.seed, years: A.S.year, ally: d('alliance'), broken: d('broken'), war: d('war'), ended: ended.size, marriage: d('marriage'), rival: d('rival'), unrival: d('unrival'), heard: d('heard'), unheard: d('unheard'), hist: h.length, pairs };
      }, seed));
    }
    const ok = out.every(o => o.ally >= 2 && o.broken >= 1 && o.war >= 2 && o.ended >= 2 && o.unheard > 0 && o.heard > 0);
    return { ok, detail: out.map(o => `seed ${o.seed}: ${o.ally} alliances, ${o.broken} broken, ${o.war} v2 wars, ${o.ended} wars ended, ${o.marriage} marriages, ${o.rival}/${o.unrival} rivalries named/buried, news heard ${o.heard} / not ${o.unheard}`).join('; ') };
  },

  // marriage plus feud reads as one coherent status, in the AI's read and in every view
  async v2DipMarriageFeud(pg) {
    await pg.evaluate(HELP);
    const r = await pg.evaluate((seed) => {
      T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const DV = A.V2DIP, me = A.pc().realm, ids = DT.others();
      let a = null, b = null;
      for (const x of ids) { for (const y of ids) if (x < y && !A.hostile(x, y) && !A.realm(x).allies.includes(y)) { a = x; b = y; break; } if (a) break; }
      A.sign('marriage', a, b, { silent: true });
      A.sign('rival', a, b, { silent: true });
      const x = DV.relation(a, b), st = DV.status(a, b);
      const blk = DT.text(UI.v2RelBlock(a, b, 'test'));
      // the player's realm married to and feuding with a: the realm card and the diplomacy card say the same
      A.sign('marriage', a, me, { silent: true }); A.sign('rival', a, me, { silent: true });
      const st2 = DV.status(a, me), card = DT.text(UI.realmCard(a)), dip = DT.text(UI.diplCard(A.realm(me), A.realm(a)));
      return { st, toward: x.toward.map(q => q.text), apart: x.apart.map(q => q.text), blk, st2, inCard: card.includes(st2), inDip: dip.includes(st2), lists: card.includes('Drawing together') && card.includes('Pulling apart') && dip.includes('Drawing together') };
    }, 5);
    const ok = r.st === 'uneasy marriage alliance' && r.st2 === r.st && r.toward.some(t => /royal marriage/.test(t)) && r.apart.includes('sworn rivals') && r.blk.includes(r.st) && r.inCard && r.inDip && r.lists;
    return { ok, detail: `${r.st} / ${r.st2}; drawing together: ${r.toward.join(', ')}; pulling apart: ${r.apart.join(', ')}; card ${r.inCard}, diplomacy ${r.inDip}, lists ${r.lists}` };
  },

  // the view and the AI read the same status: every alliance and war v2 makes is made from the status the views
  // show, every pact the AI signs agrees with it, and the status never contradicts the treaties
  async v2DipSameStatus(pg) {
    await pg.evaluate(HELP);
    const r = await pg.evaluate((seed) => {
      T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const DV = A.V2DIP, o = { ally: 0, allyBad: [], pact: 0, pactBad: [], checked: 0, contra: [] };
      const sign = A.sign;
      const tick = DV.tick; DV.tick = function () { DV._t = true; try { return tick.apply(this, arguments); } finally { DV._t = false; } };
      A.sign = function (k, a, b) {
        if (k === 'ally' && DV._t) { o.ally++; const x = DV.relation(a, b); if (x.score < 22) o.allyBad.push(`${a}-${b} ${x.status} ${Math.round(x.score)}`); }
        if (['def', 'trade', 'nap'].includes(k) && DV.inAI) { o.pact++; const s = DV.status(a, b); if (DV.COLD.includes(s)) o.pactBad.push(`${k} ${a}-${b} ${s}`); }
        return sign.apply(this, arguments);
      };
      try {
        DT.run(30, () => {
          const ids = Object.values(A.S.realms).filter(x => x.alive && !x.isRebel).map(x => x.id);
          for (const a of ids) for (const b of ids) if (a < b) {
            const s = DV.status(a, b), al = A.realm(a).allies.includes(b), war = A.hostile(a, b);
            o.checked++;
            if (war && !/^at war/.test(s)) o.contra.push(`${a}-${b} war but ${s}`);
            if (al && !war && !/^allied/.test(s)) o.contra.push(`${a}-${b} allies but ${s}`);
            if (!al && !war && /^allied|^at war/.test(s)) o.contra.push(`${a}-${b} ${s} with no treaty`);
          }
          const a = ids[0], b = ids[1], blk = DT.text(UI.v2RelBlock(a, b));
          if (!blk.includes(DV.status(a, b))) o.contra.push(`view ${blk.slice(0, 40)} vs ${DV.status(a, b)}`);
        });
      } finally { A.sign = sign; DV.tick = tick; }
      return o;
    }, 31);
    const ok = r.ally > 0 && !r.allyBad.length && !r.pactBad.length && !r.contra.length && r.checked > 1000;
    return { ok, detail: `${r.ally} alliances from the status (${r.allyBad.slice(0, 3).join('; ') || 'none against it'}); ${r.pact} lesser pacts (${r.pactBad.slice(0, 3).join('; ') || 'none against it'}); ${r.checked} pair-years, contradictions: ${r.contra.slice(0, 4).join('; ') || 'none'}` };
  },

  // the same seed gives the same diplomatic history; the views draw no randomness and change nothing
  async v2DipDeterminism(pg) {
    await pg.evaluate(HELP);
    const one = (seed) => pg.evaluate((seed) => {
      T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      DT.run(15);
      const S = A.S, R = Object.values(S.realms).map(r => [r.id, r.alive, (r.allies || []).slice().sort(), (r.rivals || []).slice().sort(), r.marriages || {}]);
      return T.hash({ v: S.v2dip, R, w: S.wars.map(w => [w.id, w.att, w.def]) });
    }, seed);
    const h1 = await one(424), h2 = await one(424), h3 = await one(425);
    await pg.evaluate(HELP);
    const pure = await pg.evaluate(() => {
      const pc = A.pc(), me = pc.realm, ids = DT.others(), h0 = T.hash(A.S), r0 = A.rngState;
      for (const id of ids) { UI.realmCard(id); UI.diplCard(A.realm(me), A.realm(id)); UI.relStatus(A.realm(me), A.realm(id)); }
      const far = Object.values(A.S.people).filter(p => p.alive && p.realm && p.realm !== me).slice(0, 8);
      for (const p of far) { try { UI.personModal(p, ''); } catch (e) {} }
      return T.hash(A.S) === h0 && A.rngState === r0;
    });
    const ok = h1 === h2 && h1 !== h3 && pure;
    return { ok, detail: `seed 424 twice ${h1 === h2 ? 'the same' : 'DIFFERENT'}; seed 425 ${h1 !== h3 ? 'differs' : 'the same (?)'}; views pure ${pure}` };
  },

  // no percentages in the diplomacy views
  async v2DipNoPercent(pg) {
    await pg.evaluate(HELP);
    const r = await pg.evaluate((seed) => {
      T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      DT.run(3);
      const me = A.pc().realm, bad = [];
      for (const id of DT.others()) {
        for (const [w, h] of [['card', UI.realmCard(id)], ['dipl', UI.diplCard(A.realm(me), A.realm(id))], ['block', UI.v2RelBlock(id, me)]]) {
          const t = DT.text(h); if (t.includes('%')) bad.push(`${w} ${id}: ${t.slice(Math.max(0, t.indexOf('%') - 40), t.indexOf('%') + 5)}`);
        }
      }
      const far = Object.values(A.S.people).filter(p => p.alive && p.realm && p.realm !== me).slice(0, 6);
      let blocks = 0;
      for (const p of far) { const t = DT.text(UI.personModal(p, '')); if (t.includes('Their realm and yours')) { blocks++; const i = t.indexOf('Their realm and yours'); if (t.slice(i).includes('%')) bad.push('person ' + p.id); } }
      return { bad, blocks, n: DT.others().length };
    }, 8);
    const ok = !r.bad.length && r.blocks > 0;
    return { ok, detail: `${r.n} realms' cards, diplomacy cards and blocks, ${r.blocks} person views: ${r.bad.slice(0, 3).join(' | ') || 'no %'}` };
  },
  // playtest 1 #22: a bloc is realms all allied to each other (no chain of 33), and a coalition agrees with the status
  async v2DipBlocsCoalition(pg) {
    await pg.evaluate(HELP);
    const r = await pg.evaluate((seed) => {
      T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      DT.run(12);
      const DV = A.V2DIP, ids = DT.others(), live = Object.values(A.S.realms).filter(x => x.alive && !x.isRebel).length;
      // a chain: x-y and y-z allied, x and z not
      const [x, y, z] = ids.filter(id => !A.atWar(id).length).slice(0, 3);
      for (const q of [x, y, z]) for (const o of A.realm(q).allies.slice()) A.unally(q, o);
      A.ally(x, y); A.ally(y, z);
      UI.worldView = 'dipl';
      const html = UI.worldTabPolitics(A.pc()), d = document.createElement('div'); d.innerHTML = html;
      const byName = {}; for (const rr of Object.values(A.S.realms)) byName[rr.short] = rr.id;
      const h = [...d.querySelectorAll('.group-h')].find(e => e.textContent === 'Alliance blocs');
      const blocs = []; for (let e = h && h.nextElementSibling; e && e.classList.contains('card'); e = e.nextElementSibling) blocs.push(e.querySelector('b').textContent.split(' · ').map(t => byName[t.trim()]));
      const bad = blocs.filter(bl => bl.some(a => bl.some(b => a !== b && !A.realm(a).allies.includes(b))));
      const chain = blocs.some(bl => bl.includes(x) && bl.includes(z));
      const biggest = Math.max(0, ...blocs.map(b => b.length));
      const army = [...d.querySelectorAll('.card .tiny')].map(e => e.textContent).find(t => /Combined army/.test(t));
      // a conqueror: the coalition against it is only realms cold or worse with it, none allied to it
      const t = ids.find(id => A.neighbors(id).length >= 3) || ids[0];
      A.realm(t).infamy = 75; A.politicsYear();
      const ms = (A.S.coalitions || {})[t] || [], off = ms.filter(m => !DV.COLD.includes(DV.status(m, t)) || A.realm(m).allies.includes(t));
      return { live, n: blocs.length, biggest, bad: bad.length, chain, army: army || '', ms: ms.length, off: off.length, fear: ms.length ? DV.relation(ms[0], t).apart.map(q => q.text).join(', ') : '' };
    }, 61);
    const ok = r.n > 0 && r.biggest <= 4 && !r.bad && !r.chain && !/\d/.test(r.army) && !r.off;
    return { ok, detail: `${r.n} blocs, biggest ${r.biggest} of ${r.live} realms, ${r.bad} not all allied, chain joined ${r.chain}; "${r.army}"; coalition of ${r.ms}, ${r.off} not cold to the conqueror (${r.fear})` };
  },

  // CI 88 (riGoldGetsUsed at 0.043 wars a realm-year): a war v2 names for a hostile pair waits while the crown rests
  // after its last war, is war-weary or has no opening, and then turns into a declaration only by the seeded chance
  async v2DipWarPace(pg) {
    await pg.evaluate(HELP);
    const r = await pg.evaluate((seed) => {
      T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const DV = A.V2DIP, D = A.V2.diplomacy, mt = D.monthTick, pk = A.cbPreview ? 'cbPreview' : 'warPreview', pv = A[pk], me = A.pc().realm;
      const free = id => { const x = A.realm(id); return x && x.alive && !x.isRebel && !x.playerRun && id !== me && !A.atWar(id).length && (x.stability || 0) >= 30 && !x.overlord; };
      let pair = null;
      for (const a of DT.others()) {
        if (!free(a)) continue;
        const b = A.neighbors(a).find(o => free(o) && A.realm(o).overlord !== a && !(A.outOfReach && A.outOfReach(a, o)) && !A.hostile(a, o) && !(A.realm(a).allies || []).includes(o));
        if (b) { pair = [a, b]; break; }
      }
      if (!pair) return { pair: null };
      let ratio = 5;
      const RA = A.realm(pair[0]), had = { lw: 'aiLastWar' in RA, lwv: RA.aiLastWar, ex: RA.exhaustion }, W0 = Object.assign({}, DV.WAR);
      D.monthTick = (d, world) => { const ix = rid => world.realms.findIndex(x => x.rid === rid); return [{ kind: 'war', a: ix(pair[0]), b: ix(pair[1]), year: A.S.year, month: 0, text: 'war' }]; };
      A[pk] = function () { const P = pv.apply(this, arguments); return P && Object.assign({}, P, { ratio }); };
      const once = () => {
        const w0 = DV.stats.war, k0 = Object.assign({}, DV.stats.warWait), n0 = A.S.wars.length; DV.tick();
        const wait = Object.keys(DV.stats.warWait).filter(k => DV.stats.warWait[k] !== (k0[k] || 0)).join();
        const w = A.S.wars.length > n0 ? A.S.wars[A.S.wars.length - 1] : null;
        return { war: DV.stats.war - w0, wait, casus: w && w.casus ? w.casus.t : null };
      };
      const out = {};
      try {
        RA.aiLastWar = A.S.year; out.rest = once();
        if (had.lw) RA.aiLastWar = had.lwv; else delete RA.aiLastWar;
        RA.exhaustion = 99; out.weary = once(); RA.exhaustion = had.ex;
        ratio = 0.2; out.nerve = once(); ratio = 5;
        DV.WAR.p = 0; out.chance = once();
        DV.WAR.p = 1; out.go = once();
      } finally { D.monthTick = mt; A[pk] = pv; Object.assign(DV.WAR, W0); }
      return { pair, out };
    }, 2024);
    const o = r.out || {};
    const ok = !!r.pair && o.rest.wait === 'rest' && !o.rest.war && o.weary.wait === 'weary' && !o.weary.war && o.nerve.wait === 'nerve' && !o.nerve.war &&
      o.chance.wait === 'chance' && !o.chance.war && o.go.war === 1 && !o.go.wait && !!o.go.casus;
    return { ok, detail: r.pair ? `${r.pair.join(' on ')}: ` + Object.entries(o).map(([k, v]) => `${k}: ${v.war ? 'war' + (v.casus ? ` ("${v.casus}")` : ' without a casus belli') : 'waits (' + (v.wait || 'nothing counted') + ')'}`).join('; ') : 'no free bordering pair' };
  },

  // playtest 1 #22: what you see of a realm depends on who you are
  async v2DipWhatYouKnow(pg) {
    await pg.evaluate(HELP);
    const r = await pg.evaluate((seed) => {
      T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      DT.run(1);
      const DV = A.V2DIP, pc = A.pc(), me = pc.realm, o = DT.others()[0], R = A.realm(o), M = A.realm(me);
      // the army and stability, not the population: the Codex primer on the card may quote one (lore, not a live figure)
      const has = (h, n) => DT.text(h).includes(A.fmt(n));
      UI.worldView = 'realms';
      const peasant = { card: has(UI.realmCard(o), R.army) || /stability \d/.test(DT.text(UI.realmCard(o))), table: has(UI.worldTabBasic ? UI.worldTabBasic(pc) : '', R.army), own: DV.seen(me), seenO: DV.seen(o), words: DT.text(UI.realmCard(o)).includes('said to be') };
      const tip = UI.TIPS && UI.TIPS.realmGold ? DT.text(UI.TIPS.realmGold(o)) : '';
      pc.ruler = me; // as the ruler of his own realm
      const ruler = { own: DV.seen(me), other: DV.seen(o), ownExact: DV.armyText(M) === A.fmt(M.army), otherAbout: /^about /.test(DV.armyText(R)) };
      pc.ruler = null;
      return { peasant, tip: tip.includes(A.fmt(R.treasury)), ruler };
    }, 62);
    const P = r.peasant, ok = !P.card && !P.table && P.own === 'hearsay' && P.seenO === 'hearsay' && P.words && !r.tip && r.ruler.own === 'exact' && r.ruler.other === 'estimate' && r.ruler.ownExact && r.ruler.otherAbout;
    return { ok, detail: `peasant: exact figures in the card ${P.card}, the realms table ${P.table}, the treasury tip ${r.tip}; hearsay words ${P.words}; ruler: own ${r.ruler.own}, others ${r.ruler.other}` };
  },
};
