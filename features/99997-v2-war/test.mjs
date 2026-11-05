// 99997-v2-war: no view of a war you are not in (only rumours); your rank sets the screen; your choices move the result
// at every rank; the after-action report names three causes; elite orders are worth their numbers; no percentages.
// Real fights are frozen the moment an enlisted soldier's division goes in (bench/rankfx-lab.mjs).
import { RANKFX_LAB } from '../../bench/rankfx-lab.mjs';

const SETUP = () => {
  window.VWX = {
    fights: null,
    get(n) { if (!VWX.fights || VWX.fights.length < n) VWX.fights = RANKFX_FIGHTS(n, 7300); return VWX.fights.slice(0, n); },
    load(f, rank) {
      A.S = JSON.parse(f.snap); A.rngState = f.rng; A._idIdx = null; if (A.locDirty) A.locDirty(); A.S.queue = [];
      const pc = A.pc(); pc.mil.rank = rank;
      const pid = +String(f.key).slice(1), F = A.S.fights[pid];
      return { pc, F, arg: { key: f.key, war: F.war, enemy: A.hostile(F.a, pc.mil.realm) ? F.a : F.b, pid } };
    },
    // take part at a rank and answer every phase with the same choice; returns the scene
    play(f, rank, pick, tac) {
      const { arg } = VWX.load(f, rank);
      (rank >= 7 ? A.CHOICE_FN.wsLead : rank >= 4 ? A.CHOICE_FN.wsPart : A.CHOICE_FN.wsLine)(rank >= 7 ? arg.key : arg);
      const q = A.S.queue[0];
      if (!q || q.type !== 'v2battle') return null;
      if (tac) A.V2W.setTac(tac);
      for (let g = 0; g < 6 && !q.b.done; g++) A.V2W.choose(pick);
      return q.b;
    },
    // the real fight's balance of order after the scene: ours over theirs
    orgEdge(f) {
      const pc = A.pc(), F = A.S.fights[+String(f.key).slice(1)];
      if (!F) return 0;
      let a = 0, b = 0;
      for (const id of F.aIds.concat(F.dIds)) { const d = A.divById(id); if (!d) continue; if (A.hostile(d.r, pc.mil.realm)) b += d.org; else a += d.org; }
      return a - b;
    },
  };
};
const prep = async pg => { await pg.evaluate(RANKFX_LAB); await pg.evaluate(SETUP); };

export default {
  // a war you are not in: no War place, no war room, no battle, no war cards; its battles reach you only as rumour,
  // late and sometimes wrong. Enlisted, the same war is yours.
  async v2wNoSpectate(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7311, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
      const pc = A.pc(), me = pc.realm, en = A.neighbors(me)[0];
      A.startWar(me, en, null, 'conquest');
      // a second war between two other realms
      const others = Object.values(A.S.realms).filter(x => x.alive && x.id !== me && x.id !== en && !A.atWar(x.id).length);
      let ow = null;
      for (const x of others) { const n = A.neighbors(x.id).find(y => y !== me && y !== en && !A.atWar(y).length); if (n) { A.startWar(x.id, n, null, 'conquest'); ow = A.S.wars[A.S.wars.length - 1]; break; } }
      const out = { inWar: A.V2W.inWar(pc), places: A.V2T.groups().map(g => g.k) };
      UI.warRoomOpen(); out.room = !!(UI.ov && UI.ov.type === 'warroom'); UI.ov = null;
      const n0 = A.S.queue.length;
      A.queue({ type: 'battle', b: { war: A.S.wars[0].id, title: 'x' } }); A.queue({ type: 'warroom', war: null });
      out.queued = A.S.queue.length - n0;
      UI.tab = 'war'; UI.render();
      const tab = UI.TAB.war(pc);
      out.warCards = /War score|Elsewhere/.test(tab); out.peaceLie = /is at peace/.test(tab); out.roomBtn = /warRoomView/.test(tab);
      UI.worldView = 'wars'; const wv = UI.TAB.world(pc); out.worldWars = A.S.wars.filter(w => wv.includes(w.name)).length;
      // three years: battle news of these wars never reaches the news; rumours do
      // (counted only while he is outside every war: the levy or a draft may put him in one)
      let battleNews = 0, rumours = 0, wrong = 0, outside = 0;
      const seen = new Set(), news0 = A.news;
      A.news = function (t, c) { const k = A.S.news.length; const r = news0.apply(this, arguments); if (c === 'battle' && A.S.news.length > k && !A.V2W.inWar()) { battleNews++; out.bn = String(t).slice(0, 120); } return r; };
      const drain = () => { let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } };
      try { const d0 = A.absDay(); for (let m = 0; m < 36 && A.pc().alive; m++) { for (let g2 = 0; g2 < 40 && A.absDay() < d0 + 30 * (m + 1); g2++) { A.advance(5); drain(); } if (!A.V2W.inWar()) outside++; } } finally { A.news = news0; }
      for (const n of A.S.news) { if (n.c === 'rumour' && !seen.has(n.t)) { seen.add(n.t); rumours++; } }
      for (const x of (A.S.v2w && A.S.v2w.heard) || []) if (x.wrong) wrong++;
      out.battleNews = battleNews; out.rumours = rumours; out.pending = ((A.S.v2w || {}).rum || []).length;
      out.sample = [...seen][0] || '';
      out.otherWar = !!ow;
      // enlisted: the war is yours
      const pc2 = A.pc();
      if (pc2 && pc2.alive && !A.atWar(pc2.realm).length) A.startWar(pc2.realm, A.neighbors(pc2.realm)[0], null, 'conquest');
      out.outside = outside;
      if (pc2 && pc2.alive && A.atWar(pc2.realm).length) { if (!pc2.mil) A.enlist(pc2); out.enlisted = A.V2W.inWar(pc2); UI.warRoomOpen(); out.room2 = !!(UI.ov && UI.ov.type === 'warroom'); UI.ov = null; out.places2 = A.V2T.groups().map(g => g.k); }
      UI.tab = 'life'; UI.render();
      return out;
    });
    const ok = !r.inWar && !r.places.includes('war') && !r.room && r.queued === 0 && !r.warCards && !r.peaceLie && !r.roomBtn && r.worldWars === 0 && r.outside >= 6 && r.battleNews === 0 && r.rumours + r.pending > 0 &&
      /pedlar|swears/i.test(r.sample || 'pedlar') && (r.enlisted === undefined || (r.enlisted && r.room2 && r.places2.includes('war')));
    return { ok, detail: `outside: in war ${r.inWar}, places ${r.places.join('/')}, war room ${r.room}, battle/war room queued ${r.queued}, war cards ${r.warCards}, 'at peace' ${r.peaceLie}, War Room button ${r.roomBtn}, world wars listed ${r.worldWars}; 3 years (${r.outside} months outside every war): battle news while outside ${r.battleNews}${r.bn ? ' (' + r.bn + ')' : ''}, rumours ${r.rumours} (+${r.pending} on the road), e.g. "${r.sample.slice(0, 90)}"; enlisted: in war ${r.enlisted}, war room ${r.room2}` };
  },

  // the screen at each rank: soldier and sergeant choices against the unit across, estimates only; the captain's company
  // tactic against their general; the commander's battle (9997's simulator) with each wing's tactic and the reserve
  async v2wRankScreens(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const f = VWX.get(1)[0], out = {};
      UI.screen = 'game'; UI.ov = null;
      for (const [rank, k] of [[0, 'soldier'], [2, 'sergeant'], [5, 'captain']]) {
        const { arg } = VWX.load(f, rank);
        (rank >= 4 ? A.CHOICE_FN.wsPart : A.CHOICE_FN.wsLine)(arg);
        const q = A.S.queue[0];
        if (!q || q.type !== 'v2battle') { out[k] = { none: true }; continue; }
        UI.render();
        const m = document.querySelector('#modal') || document.body, html = m.innerHTML, txt = m.textContent;
        const names = A.V2.war.CHOICES[k].map(c => c.name);
        out[k] = { rank: q.b.rank, choices: names.filter(n => txt.includes(n)).length, want: names.length, tac: !!m.querySelector('[data-a="v2wTac"]'),
          about: /about [\d,]+ (men|of)/.test(txt), exact: /\b\d{1,3},\d{3}\b/.test(txt.replace(/(about|some) [\d,]+/g, '')), general: /their general/.test(txt), pct: /\d\s*%/.test(txt), words: !!m.querySelector('.v2-odds .v2-ow') };
      }
      // the commander: the release's command of the battle
      const { arg } = VWX.load(f, 7);
      A.CHOICE_FN.wsLead(arg.key);
      const q = A.S.queue[0];
      UI.ov = null; UI.render();
      const m = document.querySelector('#modal');
      out.commander = { head: q && q.type, tac: !!(m && m.querySelector('[data-c="bTac"]')), reserve: !!(m && (m.querySelector('[data-a="bRes"]') || /reserve/i.test(m.textContent))) && typeof A.battleCommitReserve === 'function' };
      A.S.queue = []; UI.render();
      return out;
    });
    const s = r.soldier, g = r.sergeant, c = r.captain, k = r.commander;
    const ok = s && g && c && !s.none && !g.none && !c.none && s.choices === s.want && g.choices === g.want && c.choices === c.want &&
      !s.tac && !g.tac && c.tac && s.about && g.about && !s.exact && !g.exact && c.general && ![s, g, c].some(x => x.pct) && [s, g, c].every(x => x.words) &&
      k.head === 'battle' && k.tac && k.reserve;
    return { ok, detail: `soldier ${JSON.stringify(s)}; sergeant ${JSON.stringify(g)}; captain ${JSON.stringify(c)}; commander ${JSON.stringify(k)}` };
  },

  // paired seeds: the same frozen fight and random stream, two choices; the bold one does better at every rank, in the
  // scene's grade and in the real fight's order (44's RANKFX); the commander's reserve moves his battle
  async v2wChoicesMove(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const fs = VWX.get(10), out = {};
      // rank, the low choice, the high one: drift to the rear / push with the front rank; keep the squad tight / plug the
      // gap; keep the company back / follow the army's orders
      const pairs = { soldier: [0, 4, 1], sergeant: [2, 0, 1], captain: [5, 3, 0] };
      for (const [k, [rank, lo, hi]] of Object.entries(pairs)) {
        let pl = 0, ph = 0, el = 0, eh = 0, n = 0, wl = 0, wh = 0;
        for (const f of fs) {
          const bl = VWX.play(f, rank, lo, k === 'captain' ? 'hold' : null); if (!bl) continue; const edl = VWX.orgEdge(f);
          const bh = VWX.play(f, rank, hi, k === 'captain' ? 'flank' : null); if (!bh) continue; const edh = VWX.orgEdge(f);
          n++; pl += bl.perf; ph += bh.perf; el += edl; eh += edh; wl += bl.camp.battle.winner === 0; wh += bh.camp.battle.winner === 0;
        }
        out[k] = { n, lo: +(pl / n).toFixed(2), hi: +(ph / n).toFixed(2), orgLo: Math.round(el / n), orgHi: Math.round(eh / n), wl, wh };
      }
      // the commander: commit the reserve at once, or never
      let cl = 0, ch = 0, cn = 0;
      for (const f of fs.slice(0, 6)) {
        const res = [];
        for (const commit of [false, true]) {
          const { arg } = VWX.load(f, 7);
          A.CHOICE_FN.wsLead(arg.key);
          const q = A.S.queue[0]; if (!q || q.type !== 'battle') break;
          const B = q.b, me = B.pcSide || 'A';
          if (commit) { try { A.battleCommitReserve(); } catch (e) {} }
          for (let g = 0; g < 400 && !B.winner; g++) A.battleStep();
          const live = s => (B.sides[s].units || []).reduce((a, u) => a + (u.status === 'gone' ? 0 : u.men || 0), 0);
          res.push(live(me) - live(me === 'A' ? 'B' : 'A'));
        }
        if (res.length === 2) { cn++; cl += res[0]; ch += res[1]; if (res[0] !== res[1]) out.cMoved = (out.cMoved || 0) + 1; }
      }
      out.commander = { n: cn, moved: out.cMoved || 0, never: Math.round(cl / Math.max(1, cn)), commit: Math.round(ch / Math.max(1, cn)) };
      return out;
    });
    const ok = ['soldier', 'sergeant', 'captain'].every(k => r[k].n >= 6 && r[k].hi > r[k].lo && r[k].orgHi >= r[k].orgLo) && r.commander.n >= 3 && r.commander.moved >= Math.ceil(r.commander.n / 2);
    return { ok, detail: ['soldier', 'sergeant', 'captain'].map(k => `${k}: grade ${r[k].lo} -> ${r[k].hi}, the fight's order edge ${r[k].orgLo} -> ${r[k].orgHi}, scene won ${r[k].wl} -> ${r[k].wh} of ${r[k].n}`).join('; ') + `; commander: the reserve changed ${r.commander.moved} of ${r.commander.n} battles (men left ${r.commander.never} -> ${r.commander.commit})` };
  },

  // the after-action report: three causes, in words, on the scene (b.aar, 23's shape), in the story and on the war's record
  async v2wAfterAction(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const out = [];
      for (const f of VWX.get(4)) {
        const b = VWX.play(f, 0, 0);
        if (!b) continue;
        const log = JSON.stringify(A.S.log);
        out.push({ n: b.aar.causes.length, labels: b.aar.causes.map(c => c.label), shape: b.aar.causes.every(c => typeof c.pct === 'number' && typeof c.label === 'string'), text: !!b.aar.text, story: /captains reckon it/.test(log) });
      }
      return out;
    });
    const ok = r.length >= 3 && r.every(x => x.n === 3 && x.shape && x.text && x.story && new Set(x.labels).size === 3);
    return { ok, detail: `${r.length} scenes: ${r.map(x => x.labels.join(' / ')).slice(0, 2).join(' || ')}` };
  },

  // elite orders: 150-350 members each worth 14-26 levies, in v2's battle and in the division simulator (12-45 there: the
  // simulator adds each order's own bonuses on top, such as the Last Door's +45% defence); 250 of them
  // break 3,000 levies; joining takes three trials
  async v2wOrders(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7320, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 24 });
      const list = A.V2W.orderList().map(o => { const d = A.orderDiv(o.id); return Object.assign(o, { sim: d ? +A.V2W.simWorth(d).toFixed(1) : null }); });
      const VW = A.V2.war, rng = A.V2.rng.makeRng('v2w-orders');
      let w3 = 0;
      for (let i = 0; i < 20; i++) {
        const camp = { armies: [VW.makeArmy('Order', 0, [VW.makeUnit(1, 'Knights', 'order', 250, A.V2W.orderWorth('iron_wolf'), { terror: A.V2W.orderTerror('iron_wolf'), morale: 0.95 })]), VW.makeArmy('Levy', 1, [VW.makeUnit(2, 'Levy', 'levy', 3000, 1)])], battle: VW.startBattle({}, 'open') };
        while (!camp.battle.over) VW.battlePhase(rng, camp, { armyTactic: ['advance', 'advance'] });
        w3 += camp.battle.winner === 0;
      }
      // trials: an untrained youth fails one of the three and is sent away
      const pc = A.pc();
      const id = Object.keys(GD.ORDERS).find(k => GD.ORDERS[k].realm === pc.realm) || 'iron_wolf';
      const t = A.V2W.trialFor(pc, id);
      return { list, w3, trials: t.results.length, labels: t.results.map(x => x.label) };
    });
    const ok = r.list.length >= 5 && r.list.every(o => o.members >= 150 && o.members <= 350 && o.worth >= 14 && o.worth <= 26 && o.levies >= 10 * o.members && (o.sim == null || (o.sim >= 12 && o.sim <= 45))) && r.w3 >= 15 && r.trials === 3;
    return { ok, detail: `${r.list.map(o => `${o.id} ${o.members} x ${o.worth} = ${o.levies} levies (sim ${o.sim})`).join(', ')}; 250 knights beat 3,000 levies ${r.w3}/20; trials: ${r.labels.join(', ')}` };
  },

  // drawing the scene changes neither the state nor the random stream, and shows no percentage
  async v2wPure(pg) {
    await prep(pg);
    // a frozen fight can end in a rout after two phases (v2's battlePhase: one side all broken; since the generated
    // continent the first frozen fight is a beaten division at morale 35 against four), so the scene is drawn on the
    // next frozen fights too until the bar of 10 draws is met. The bar is unchanged.
    const r = await pg.evaluate(() => {
      const out = { impure: 0, pct: 0, draws: 0 };
      for (const f of VWX.get(3)) for (const rank of [0, 3, 6]) {
        if (out.draws >= 15) break;
        const { arg } = VWX.load(f, rank);
        (rank >= 4 ? A.CHOICE_FN.wsPart : A.CHOICE_FN.wsLine)(arg);
        const q = A.S.queue[0]; if (!q || q.type !== 'v2battle') continue;
        UI.screen = 'game'; UI.ov = null;
        for (let k = 0; k < 6; k++) {
          UI.render();
          const s0 = JSON.stringify(A.S), r0 = A.rngState;
          UI.render(); out.draws++;
          if (JSON.stringify(A.S) !== s0 || A.rngState !== r0) out.impure++;
          const txt = (document.querySelector('#modal') || document.body).textContent;
          if (/\d\s*%/.test(txt)) out.pct++;
          if (q.b.done) break;
          A.V2W.choose(1);
        }
        A.V2W.close(); UI.render();
      }
      return out;
    });
    return { ok: r.draws >= 10 && !r.impure && !r.pct, detail: `${r.draws} draws, ${r.impure} changed the state or the dice, ${r.pct} showed a percentage` };
  },
  // integration: the map's Wars colouring shows no war you are not in
  async v2wMapWars(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7312, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 24 });
      const me = A.pc().realm;
      const x = Object.values(A.S.realms).find(q => q.alive && q.id !== me && !A.neighbors(me).includes(q.id) && A.neighbors(q.id).some(y => y !== me));
      const y = A.neighbors(x.id).find(z => z !== me);
      A.startWar(x.id, y, null, 'conquest');
      const h0 = T.hash(A.S), r0 = A.rngState, n = A.S.wars.length;
      const info = MAP.modeInfo('wars');
      const txt = JSON.stringify(info.legend || []);
      return { wars: n, mentions: A.S.wars.filter(w => txt.includes(w.name) || txt.includes(A.realm(w.att) ? A.realm(w.att).short : '@')).length, kept: A.S.wars.length === n, pure: T.hash(A.S) === h0 && A.rngState === r0, outside: !A.V2W.inWar(A.pc()) };
    });
    return { ok: r.wars >= 1 && r.outside && r.mentions === 0 && r.kept && r.pure, detail: `${r.wars} war(s) in the world, the player in none ${r.outside}; the Wars map names ${r.mentions} of them; the world's wars kept ${r.kept}; pure ${r.pure}` };
  },
  // playtest round 1: leaving the field ends the step; the call to battle and the reckoning give numbers by rank; an
  // outsider's map has no other war's divisions or fights; World > Wars says your realm is at war without you; the
  // captain's choices are rated against the unit he faces and differ; the orders' page reads 14-26 levies a member
  async v2wRound1(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const out = {};
      const f = VWX.get(1)[0];
      // 1. a finished battle closed mid-step: the step ends, the queue is empty
      VWX.play(f, 0, 0);
      const ST = UI.stepper; ST.run = true; ST.wait = true;
      UI.screen = 'game'; UI.ov = null;
      UI.A.v2wClose();
      out.stepAfter = !!ST.run; out.queue = A.S.queue.length;
      // 2. the call to battle, by rank
      out.calls = {};
      for (const [rank, k] of [[0, 'soldier'], [2, 'sergeant'], [5, 'captain'], [7, 'commander']]) {
        const { F } = VWX.load(f, rank);
        A.S.pcFightAsk = null;
        const att = F.aIds.map(A.divById).filter(Boolean), def = F.dIds.map(A.divById).filter(Boolean);
        A.wsPCFightStart(F, att, def);
        const q = A.S.queue.find(x => x.type === 'choice');
        const m = q && /— (.*?) of yours against (.*?) of theirs/.exec(q.text);
        out.calls[k] = m ? [m[1], m[2]] : null;
      }
      out.retell = A.V2W.retell('9 days at X, on hills: 61,538 men. Dead: 47 of yours, 251 of theirs.', 'sergeant');
      // 5. the captain: the unit across, and words that differ
      const b = VWX.play(f, 5, 0) || null;
      const { arg } = VWX.load(f, 5); A.CHOICE_FN.wsPart(arg);
      const q5 = A.S.queue[0];
      out.capWords = q5 && q5.type === 'v2battle' ? A.V2.war.CHOICES.captain.map(c => A.V2W.oddsOf(q5.b, c).words) : [];
      out.capText = q5 && q5.type === 'v2battle' ? A.V2W.view(q5.b).includes('Across from you') : false;
      A.S.queue = [];
      // 3 and 4. a peasant outside the war
      T.enter({ seed: 7311, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
      const pc = A.pc(); A.startWar(pc.realm, A.neighbors(pc.realm)[0], null, 'conquest');
      const n0 = A.allDivs().length, f0 = A.S.fights;
      out.seenDivs = A.V2W.withSeen(() => A.allDivs().length); out.allDivs = n0; out.restored = A.allDivs().length === n0 && A.S.fights === f0;
      UI.worldView = 'wars'; const wv = UI.TAB.world(pc);
      out.peaceLie = /for once, at peace/.test(wv); out.notIn = /not in it/.test(wv);
      // 6. the orders' page
      out.orders = Object.keys(GD.ORDERS).map(id => { const s = A.orderSummary(id); return s && s.men ? +(s.likeMen / s.men).toFixed(1) : null; });
      return out;
    });
    const c = r.calls, est = x => x && /^(about|a handful)/.test(x[0]) && /^(about|a handful)/.test(x[1]);
    const ok = !r.stepAfter && r.queue === 0 && est(c.soldier) && est(c.sergeant) && c.captain && /^some/.test(c.captain[0]) && /^some/.test(c.captain[1]) &&
      c.commander && /^[\d,]+$/.test(c.commander[0]) && /^(about|a handful)/.test(c.commander[1]) && !/61,538|\b47\b|251/.test(r.retell) &&
      r.capText && new Set(r.capWords).size >= 2 && r.seenDivs === 0 && r.allDivs > 0 && r.restored && !r.peaceLie && r.notIn &&
      r.orders.filter(x => x != null).length >= 5 && r.orders.every(x => x == null || (x >= 14 && x <= 26));
    return { ok, detail: `step after close ${r.stepAfter}, queue ${r.queue}; calls ${JSON.stringify(c)}; reckoning "${r.retell}"; captain words ${r.capWords.join('/')}; outsider sees ${r.seenDivs} of ${r.allDivs} divisions (restored ${r.restored}); World > Wars at peace ${r.peaceLie}, "not in it" ${r.notIn}; orders a member ${r.orders.join(', ')}` };
  },
  // playtest 2, finding 3 (and 4's Book): World > Annals and The Book give a war you were not in only as hearsay, late
  // and without exact counts; a battle of your own war at your rank's precision; drawing is pure
  async v2wAnnalsHearsay(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7341, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 22 });
      T.play(6);
      const pc = A.pc(), S = A.S, WC = A.WC, me = pc.realm, nb = new Set(A.neighbors(me));
      const far = Object.keys(S.realms).filter(id => S.realms[id].alive && id !== me && !nb.has(id)).sort();
      const fp = S.prov.find(P => P.owner === far[0] && P.id !== pc.home && !(A.prov(pc.home).adj || []).includes(P.id));
      // a far battle of a war he is not in: one long past, one this week
      const old = WC.put('battle', { p: fp.id, a: far[0], b: far[1], w: [], n: 31234, x: [6789, 2, 'W-far'], y: S.year - 1, d: 10 });
      const fresh = WC.put('battle', { p: fp.id, a: far[0], b: far[1], w: [], n: 41234, x: [7891, 2, 'W-far'] });
      // a battle of his own war (he is enlisted in it)
      A.enlist(pc); const en = A.neighbors(me)[0]; A.startWar(me, en, null, 'conquest'); const war = A.V2W.myWars(pc)[0];
      const mine = WC.put('battle', { p: fp.id, a: me, b: en, w: [], n: 25432, x: [5321, 3, war ? war.id : ''] });
      const rng0 = A.rngState, h0 = T.hash(A.S);
      UI.tab = 'world'; UI.worldView = 'annals'; UI.wcGroup = 'field'; UI.wcNear = false; UI.wcPage = 0; UI.render();
      const rows = [...document.querySelectorAll('.wc-entry')].map(x => x.textContent);
      const exact = rows.filter(t => /\b\d{1,3},\d{3}\b/.test(t.replace(/(about|some) [\d,]+/g, '')));
      const oldT = WC.tellOf(WC.ent(old), pc), freshT = WC.tellOf(WC.ent(fresh), pc), mineT = WC.tellOf(WC.ent(mine), pc);
      UI.tab = 'book'; UI.render();
      const bk = document.querySelector('#tabbody').textContent, wy = bk.slice(Math.max(0, bk.indexOf('The world in your time')));
      const text = A.chronicleText ? A.chronicleText() : '';
      const out = { rows: rows.length, exact: exact.slice(0, 2), old: oldT && oldT.t, oldMine: oldT && oldT.mine, fresh: freshT, mine: mineT && mineT.t,
        bookExact: (wy.match(/\b\d{1,3},\d{3} (men in the field|dead)/g) || []).length, textExact: /31,234|6,789|41,234/.test(text),
        names: document.querySelectorAll('.wc-heard').length, pure: A.rngState === rng0 && T.hash(A.S) === h0 };
      UI.tab = 'life'; UI.worldView = 'map'; UI.render();
      return out;
    });
    const ok = r.rows > 0 && !r.exact.length && r.old && r.oldMine === false && /word came/.test(r.old) && !/6,789|31,234/.test(r.old) && r.fresh === null &&
      r.mine && /about [\d,]+ men in the field, about [\d,]+ dead/.test(r.mine) && !r.bookExact && !r.textExact && r.pure;
    return { ok, detail: `${r.rows} rows on the Annals' battles page, ${r.exact.length} with an exact count ${JSON.stringify(r.exact)}; a far battle of last year: "${r.old}"; this week's not yet heard ${r.fresh === null}; ` +
      `his own war's: "${r.mine}"; exact counts in The Book ${r.bookExact}, in the export ${r.textExact}; pure ${r.pure}` };
  },
  // playtest 2, finding 4: a belief card's "The record" is a battle you know, at your rank's precision, and a
  // neighbour's battle you had no part in is not one you know
  async v2wBeliefRecord(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 7342, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 30 });
      const NB = A.NPCB, WC = A.WC, pc = A.pc(), S = A.S;
      if (!NB || !WC || !NB.battleClaim) return { skip: true };
      const nbR = A.neighbors(pc.realm)[0], nbP = S.prov.find(P => P.owner === nbR && P.id !== pc.home && !(A.prov(pc.home).adj || []).includes(P.id));
      const other = A.neighbors(nbR).find(x => x !== pc.realm) || nbR;
      const iN = WC.put('battle', { p: nbP.id, a: nbR, b: other, w: [], n: 33333, x: [4444, 2, 'W-nb'] });
      const iH = WC.put('battle', { p: pc.home, a: pc.realm, b: nbR, w: [], n: 22222, x: [3333, 1, 'W-home'] });
      const cN = NB.claim(NB.battleClaim(iN, 'T')), cH = NB.claim(NB.battleClaim(iH, 'T'));
      return { knowsNb: NB.pcKnows(pc, cN), knowsHome: NB.pcKnows(pc, cH), line: NB.recordLine(cH) };
    });
    if (r.skip) return { ok: true, detail: 'no 64-npc-beliefs in this build' };
    const ok = r.knowsNb === null && r.knowsHome === true && /about [\d,]+ men in the field, about [\d,]+ dead/.test(r.line) && !/22,222|3,333/.test(r.line);
    return { ok, detail: `a neighbour's battle he had no part in: known ${r.knowsNb}; one at his door: known ${r.knowsHome}, the record "${r.line}"` };
  },
  // playtest 2, finding 5 and playtest 1's 4: the levy is told estimates (its call, the front, the standards, the
  // day's tally); the commander's battle has his own side exactly, the enemy's as an estimate, morale and drill in
  // words
  async v2wRankCounts(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const out = {};
      const exactIn = t => (String(t).replace(/(about|some) [\d,]+/g, '').match(/\b\d{1,3}(,\d{3})+\b/g) || []);
      // the levy
      const fs = VWX.get(6);
      for (const f of fs) {
        const { pc, F } = VWX.load(f, 0); const pid = +String(f.key).slice(1);
        const def = A.divsAt(pid).filter(d => A.hostile(F.a, d.r)), att = F.aIds.map(A.divById).filter(Boolean);
        if (!def.length) continue;
        pc.mil = null; pc.home = pid; pc.realm = def[0].r; A.S.tsLevy = null;
        A.wsPCFightStart(F, att, def);
        const ask = A.S.queue.find(q => q.type === 'choice' && /levy/i.test(q.title || ''));
        if (!ask) continue;
        out.ask = ask.text; out.askExact = exactIn(ask.text);
        A.S.queue = [ask]; A.choiceChoose(0);
        const q = A.S.queue.find(x => x.type === 'mission' && x.m.ts);
        if (!q) break;
        A.S.queue = [q]; UI.screen = 'game'; UI.ov = null; UI.render();
        const m = document.querySelector('#modal'), txt = m ? m.textContent : '';
        out.front = A.TS.frontWords(q.m).join(' '); out.frontExact = exactIn(out.front);
        out.slips = [...document.querySelectorAll('#modal .ts-std text')].map(x => x.textContent);
        out.sceneExact = exactIn(txt);
        // the day's tally, as the scene's end sets it down
        A.TS.finish(q.m);
        out.log = (q.m.log || []).find(l => /^— /.test(l)) || '';
        break;
      }
      // the commander
      const f = fs[0]; const { arg } = VWX.load(f, 8);
      A.CHOICE_FN.wsLead(arg.key);
      const q = A.S.queue[0];
      if (q && q.type === 'battle') {
        const B = q.b, en = B.sides[B.pcSide === 'A' ? 'B' : 'A'], me = B.sides[B.pcSide];
        UI.screen = 'game'; UI.ov = null; UI.render();
        const h0 = T.hash(A.S), r0 = A.rngState;
        const html = UI.battleModal(B); UI.render();
        out.pure = T.hash(A.S) === h0 && A.rngState === r0;
        const t = html.replace(/<[^>]+>/g, ' ');
        out.cmd = { enemyExact: t.includes(A.fmt(en.men0)), ownExact: t.includes(A.fmt(me.men0)), morale: /morale \d+/.test(t), drill: /drilled \d+|Drill: [^.]*\d/.test(t) };
      }
      return out;
    });
    const L = r.cmd || {};
    const ok = !!r.ask && /about [\d,]+ against about [\d,]+/.test(r.ask) && !r.askExact.length && !r.frontExact.length && !r.sceneExact.length && r.slips.length > 0 && r.slips.every(s => !/^\d{1,3}(\.\d)?k$|^\d{3,}$/.test(s) || /^~/.test(s)) &&
      /(about [\d,]+|a handful|none) of yours dead/i.test(r.log) && !/\b\d{1,3}(,\d{3})+\b/.test(r.log.replace(/(about|some) [\d,]+/gi, "")) && r.cmd && !L.enemyExact && L.ownExact && !L.morale && !L.drill && r.pure;
    return { ok, detail: `levy call: "${(r.ask || '').slice(-60)}"; front: "${(r.front || '').slice(0, 160)}"; standards ${JSON.stringify((r.slips || []).slice(0, 6))}; tally "${r.log}"; ` +
      `commander: enemy exact ${L.enemyExact}, own exact ${L.ownExact}, a morale number ${L.morale}, a drill number ${L.drill}; pure ${r.pure}` };
  },
};
