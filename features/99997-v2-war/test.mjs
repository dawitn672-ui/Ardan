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
      out.warCards = /War score|Elsewhere/.test(tab);
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
    const ok = !r.inWar && !r.places.includes('war') && !r.room && r.queued === 0 && !r.warCards && r.worldWars === 0 && r.outside >= 6 && r.battleNews === 0 && r.rumours + r.pending > 0 &&
      /pedlar|swears/i.test(r.sample || 'pedlar') && (r.enlisted === undefined || (r.enlisted && r.room2 && r.places2.includes('war')));
    return { ok, detail: `outside: in war ${r.inWar}, places ${r.places.join('/')}, war room ${r.room}, battle/war room queued ${r.queued}, war cards ${r.warCards}, world wars listed ${r.worldWars}; 3 years (${r.outside} months outside every war): battle news while outside ${r.battleNews}${r.bn ? ' (' + r.bn + ')' : ''}, rumours ${r.rumours} (+${r.pending} on the road), e.g. "${r.sample.slice(0, 90)}"; enlisted: in war ${r.enlisted}, war room ${r.room2}` };
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
      const fs = VWX.get(6), out = {};
      const pairs = { soldier: [0, 4, 1], sergeant: [2, 0, 1], captain: [5, 3, 2] };   // rank, low choice, high choice
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
      for (const f of fs) {
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
    const ok = ['soldier', 'sergeant', 'captain'].every(k => r[k].n >= 4 && r[k].hi > r[k].lo && r[k].orgHi > r[k].orgLo) && r.commander.n >= 3 && r.commander.moved >= Math.ceil(r.commander.n / 2);
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
    const r = await pg.evaluate(() => {
      const f = VWX.get(1)[0], out = { impure: 0, pct: 0, draws: 0 };
      for (const rank of [0, 3, 6]) {
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
};
