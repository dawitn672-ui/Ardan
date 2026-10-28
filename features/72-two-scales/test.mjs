// Two scales at once: the fight a soldier is in, day by day, with the squad and the front on one screen. Real fights are
// frozen the moment an enlisted soldier's division goes in (bench/rankfx-lab.mjs) and played out through the scene.
// The tests need the features the scene works through: 44-rank-battles (the front), 48-fight-ladder (the body),
// 60-drill, 34-both-scales, 22-chronicle, 37-squad and 71-phone; on --only=two-scales the scene runs without them,
// and the tests that check those links fail by design.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { RANKFX_LAB } from '../../bench/rankfx-lab.mjs';
import { TS_LAB } from './lab.mjs';
import { openPage, PROBE, SETTLE } from '../71-phone/screens.mjs';
const require = createRequire(import.meta.url);

// in the page: frozen fights, a helper that restores one and takes the line, and one that answers a scene
const SETUP = () => {
  window.TSX = {
    fights: null,
    get(n) { if (!TSX.fights || TSX.fights.length < n) TSX.fights = RANKFX_FIGHTS(n, 5000); return TSX.fights; },
    load(f) { A.S = JSON.parse(f.snap); A.rngState = f.rng; A._idIdx = null; if (A.locDirty) A.locDirty(); A.S.queue = []; },
    take(f) {
      TSX.load(f);
      const pc = A.pc(), pid = +String(f.key).slice(1), F = A.S.fights[pid];
      A.CHOICE_FN.wsLine({ key: f.key, war: F.war, enemy: A.hostile(F.a, pc.mil.realm) ? F.a : F.b, pid });
      return A.S.queue.find(q => q.type === 'mission' && q.m.ts);
    },
    // answer what is in front of the player until the scene is back (or over); returns the scene at the head, if any
    until(pol) {
      for (let d = 0; d < 30; d++) {
        let h, g = 0;
        while ((h = A.S.queue[0]) && g++ < 60) {
          if (h.type === 'mission' && h.m.ts) return h;
          if (h.type === 'event') { try { A.eventAuto(); } catch (e) { A.S.queue.shift(); } } else A.S.queue.shift();
        }
        if (!A.S.tsq) return null;
        A.advance(1);
      }
      return null;
    },
  };
};
const prep = async pg => { await pg.evaluate(RANKFX_LAB); await pg.evaluate(TS_LAB); await pg.evaluate(SETUP); };

export default {
  // the scene at every stage it reaches: the book (squad and front), the strip with every division, the choices;
  // drawing it changes neither the state nor the random stream, and a name with markup in it is escaped
  async twoScalesView(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const out = { stages: {}, impure: 0, bad: [], draws: 0 };
      UI.screen = 'game'; UI.tab = 'life'; UI.ov = null;
      for (const f of TSX.get(8)) {
        let q = TSX.take(f);
        if (!q) continue;
        const mate = A.P(q.m.ts.men[0]);
        if (mate) mate.given = '<img src=x data-pwn=1>Oswin';
        q.m.cur = A.TS.view(q.m);
        for (let k = 0; k < 8 && q; k++) {
          const m = q.m;
          UI.render();   // a first draw may settle first-draw state elsewhere; the second must change nothing
          const h0 = T.hash(A.S), r0 = A.rngState;
          const html = UI.missionModal(m); UI.render();
          if (T.hash(A.S) !== h0 || A.rngState !== r0) out.impure++;
          out.draws++;
          const box = document.createElement('div'); box.innerHTML = html;
          const st = m.over ? 'over' : m.stages[m.stage];
          out.stages[st] = (out.stages[st] || 0) + 1;
          const strip = box.querySelector('svg.ts-strip[role=img]'), stds = box.querySelectorAll('.ts-std').length, divs = (m.ts.front.divs || []).length;
          if (!box.querySelector('.ts-book .ts-squad') || !strip || stds !== divs || divs < 2) out.bad.push(`${st}: book ${!!box.querySelector('.ts-book')}, strip ${!!strip}, standards ${stds} of ${divs}`);
          if (box.querySelector('[data-pwn]') || (mate && !box.textContent.includes('Oswin'))) out.bad.push(`${st}: the name was not escaped or not shown`);
          if (/\{[a-z]+\}/.test(box.textContent)) out.bad.push(`${st}: a raw token`);
          if (!m.over && box.querySelectorAll('[data-a=mChoose]').length !== m.cur.choices.length) out.bad.push(`${st}: choice buttons`);
          if (!(strip && strip.getAttribute('aria-label').length > 60)) out.bad.push(`${st}: the strip has no text`);
          if (m.over) { A.missionClose(); break; }
          A.missionChoose(TS_PICK(m, 'best'));
          q = A.S.queue[0] && A.S.queue[0].m === m ? A.S.queue[0] : TSX.until('best');
        }
        if (out.stages.ts_line && out.stages.over) break;
      }
      return out;
    });
    const seen = Object.keys(r.stages);
    const ok = r.draws >= 6 && !r.impure && !r.bad.length && ['ts_arrows', 'ts_clash', 'ts_break', 'over'].every(s => seen.includes(s));
    return { ok, detail: `${r.draws} draws (${seen.map(s => s + ' ' + r.stages[s]).join(', ')}); impure ${r.impure}; problems: ${r.bad.slice(0, 4).join('; ') || 'none'}` };
  },

  // every choice goes through the existing resolvers: the front through 44's A.RANKFX.apply with the choice's own
  // performance, a fight in the press at 48's fight-ladder odds, a formation offered only when 60's drill allows it
  async twoScalesResolvers(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const out = {};
      const f = TSX.get(4)[0];
      // the drill gate: never drilled shield walls, then hard-drilled
      const gate = v => {
        const q = TSX.take(f), m = q.m, d = A.divById(m.ts.div);
        d.dr = Object.assign({}, d.dr || {}, { shields: v }); A.S.queue = [q]; m.cur = A.TS.view(m);
        const c = m.cur.choices.find(x => x.tag === 'wall' || x.tag === 'cover');
        return { tag: c.tag, odds: c.odds, plain: A.missionOdds(A.pc(), m, c), bonus: A.TS.drillBonus(m, A.pc(), 'shields'), word: c.drillW || '' };
      };
      out.never = gate(0.05); out.hard = gate(0.8);
      // the arrows, then the clash: a push rolled at the fight ladder's odds, its performance sent to 44
      const q = TSX.take(f), m = q.m, pc = A.pc();
      const calls = [], ap = A.RANKFX.apply;
      A.RANKFX.apply = function (key, layer, perf) { calls.push([key, layer, perf]); return ap.apply(this, arguments); };
      try {
        const F = A.S.fights[m.ts.pid], foe = F[m.ts.weAtt ? 'dIds' : 'aIds'].map(A.divById).filter(Boolean);
        const org0 = foe.reduce((a, d) => a + d.org, 0);
        A.missionChoose(m.cur.choices.findIndex(c => c.tag === 'front'));
        const push = m.cur.choices.find(c => c.tag === 'push');
        out.pushOdds = push.odds; out.ladder = Math.max(5, Math.min(95, A.FL.resolve(pc, push.body, {}, null).pct)); out.measure = push.measure || '';
        A.missionChoose(m.cur.choices.indexOf(push));
        out.calls = calls.slice(); out.pf = A.TS.FX.push.pf; out.front0 = A.TS.FX.front.pf;
        out.org = [Math.round(org0), Math.round(foe.reduce((a, d) => a + d.org, 0))];
        out.parked = !!A.S.tsq && A.S.queue[0] !== q;
      } finally { A.RANKFX.apply = ap; }
      return out;
    });
    const c = r.calls || [];
    const ok = r.never.tag === 'cover' && r.hard.tag === 'wall' && r.hard.odds === Math.min(95, r.hard.plain + r.hard.bonus) && r.hard.bonus > 0 && /drilled/.test(r.hard.word) &&
      r.pushOdds === r.ladder && /^Measured:/.test(r.measure) && c.length === 2 && c.every(x => x[1] === 'line') && r.front0.includes(c[0][2]) && r.pf.includes(c[1][2]) &&
      (c[0][2] + c[1][2] > 0 ? r.org[1] < r.org[0] : true) && r.parked;
    return { ok, detail: `never drilled: ${r.never.tag}; hard-drilled: ${r.hard.tag} at ${r.hard.odds}% (${r.hard.plain} +${r.hard.bonus}, "${r.hard.word}"); push at ${r.pushOdds}%, the ladder says ${r.ladder}% ("${r.measure.slice(0, 70)}"); 44 called ${JSON.stringify(c)}; their order ${r.org.join(' -> ')}; parked for the day ${r.parked}` };
  },

  // the front moves by the engine: 100 real fights, each played once by the choice with the best expected performance
  // and once by the worst, from the same state and random stream. Best play wins at least 12 more of them
  // (features/72-two-scales/bench.mjs pools 300: see the README)
  async twoScalesMovesFront(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const fights = RANKFX_FIGHTS(100, 7000), res = {};
      for (const p of ['best', 'worst']) res[p] = fights.map(f => TS_PLAY(f, p));
      const flip = (a, b) => res[a].filter((x, i) => x.won === true && res[b][i].won === false).length;
      return { n: fights.length, best: res.best.filter(x => x.won).length, worst: res.worst.filter(x => x.won).length, up: flip('best', 'worst'), down: flip('worst', 'best'),
        perf: [res.best, res.worst].map(L => +(L.reduce((a, x) => a + x.perf, 0) / L.length).toFixed(2)), choices: +(res.best.reduce((a, x) => a + x.choices, 0) / fights.length).toFixed(1) };
    });
    const net = r.up - r.down;
    return { ok: r.n >= 90 && net >= 12 && r.perf[0] > 0.5 && r.perf[1] < -0.5, detail: `${r.n} fights: best play won ${r.best}, worst ${r.worst}; paired, ${r.up} changed hands toward best play and ${r.down} the other way (net ${net}); performance sent to the front ${r.perf[0]} and ${r.perf[1]}; ${r.choices} choices a fight` };
  },

  // the same fight played twice from the same state, once drawn at every step through the real actions, comes out the
  // same; and the game's own journal (01-replay) replays the player's clicks to the same world
  async twoScalesReplay(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const f = TSX.get(3)[1];
      UI.screen = 'game'; UI.tab = 'life'; UI.ov = null;
      const play = look => {
        TSX.take(f);
        for (let k = 0; k < 40; k++) {
          const h = A.S.queue[0];
          if (!h) { if (!A.S.tsq) break; A.advance(1); continue; }
          if (h.type === 'mission' && h.m.ts) {
            if (look) { UI.render(); UI.missionModal(h.m); }
            if (h.m.over) UI.A.mClose(); else UI.A.mChoose(String(TS_PICK(h.m, 'bold')));
          } else if (h.type === 'event') { if (look) UI.render(); A.eventAuto(); }
          else A.S.queue.shift();
        }
        return T.hash(A.S) + ':' + A.rngState;
      };
      const a = play(false), b = play(true);
      // the journal: the clicks recorded, then replayed from the same frozen state
      const ask = () => { const pc = A.pc(), pid = +String(f.key).slice(1), F = A.S.fights[pid];
        A.S.queue = [{ type: 'choice', title: 'Attack at X', text: '', options: [{ t: 'Take your place in the line', fn: 'wsLine', arg: { key: f.key, war: F.war, enemy: A.hostile(F.a, pc.mil.realm) ? F.a : F.b, pid } }, { t: 'Keep your head down', fn: 'noop' }] }]; };
      A.J = null; TSX.load(f); ask(); A.journalStart();
      A.choiceChoose(0);
      for (let k = 0; k < 40; k++) { const h = A.S.queue[0]; if (!h) break; if (h.type === 'mission' && h.m.ts) { if (h.m.over) UI.A.mClose(); else UI.A.mChoose(String(TS_PICK(h.m, 'steady'))); } else if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
      const want = T.hash(JSON.parse(A.serialize())), J = JSON.parse(JSON.stringify(A.J)), steps = J.e.length;
      TSX.load(f); ask();
      const res = A.replay(J, { checkBase: false });
      A.J = null;
      return { a, b, journal: res.ok && T.hash(JSON.parse(A.serialize())) === want, steps, why: res.why || '' };
    });
    return { ok: r.a === r.b && r.journal && r.steps >= 4, detail: `played twice, drawn and not: ${r.a === r.b ? 'same world' : r.a + ' vs ' + r.b}; journal of ${r.steps} commands replays to the same world: ${r.journal} ${r.why}` };
  },

  // a save made in the middle of the fight (the scene waiting for the day, and the scene in front of the player) loads
  // and plays on to the end; an old save (no scene fields, a scene without its newer fields) loads and draws
  async twoScalesSave(pg) {
    await prep(pg);
    const r = await pg.evaluate(async () => {
      const out = {};
      const f = TSX.get(3)[1];
      const reload = async () => { const enc = await SAVES.encode(A.S, A.J); const d = await SAVES.decode(enc.bytes); SAVES.clean(d); A.deserialize(d.S); A._idIdx = null; if (A.locDirty) A.locDirty(); };
      const finish = pol => { let h, n = 0; for (let k = 0; k < 40; k++) { h = A.S.queue[0] && A.S.queue[0].type === 'mission' ? A.S.queue[0] : TSX.until(pol); if (!h) break; n++; if (h.m.over) { A.missionClose(); return { n, closed: true }; } A.missionChoose(TS_PICK(h.m, pol)); } return { n, closed: false }; };
      // parked for the day
      let q = TSX.take(f); A.missionChoose(0); A.missionChoose(0);
      out.parked = !!A.S.tsq;
      await reload();
      out.parkedAfter = !!A.S.tsq && A.TS.on(A.S.tsq.m);
      out.endParked = finish('steady');
      // in front of the player
      q = TSX.take(f);
      await reload();
      out.headAfter = A.S.queue[0] && A.S.queue[0].type === 'mission' && !!A.S.queue[0].m.ts;
      UI.screen = 'game'; UI.ov = null; UI.render(); out.drawn = !!document.querySelector('#modal .ts-book');
      out.endHead = finish('care');
      // an old save: a scene without the fields added later, and a player without the counters
      q = TSX.take(f);
      const m = q.m; delete m.ts.front; delete m.ts.prev; delete m.ts.fell; delete m.ts.rounds; delete m.ts.v; delete A.pc().tsN; delete A.S.tsq; delete A.S.tsEnded;
      await reload();
      let drew = true; try { UI.render(); UI.missionModal(A.S.queue[0].m); } catch (e) { drew = String(e); }
      out.oldDrawn = drew;
      out.endOld = finish('bold');
      // a release line battle (no m.ts) in an old save still plays the release's way
      TSX.load(f); const pc = A.pc(); const ml = A.newLineBattle(pc, A.S.wars[0].id, A.neighbors(pc.mil.realm)[0]); A.S.queue = [{ type: 'mission', m: ml }];
      await reload(); A.missionAuto(A.S.queue[0].m); out.release = A.S.queue[0] && A.S.queue[0].m.over === true && !A.S.queue[0].m.ts;
      return out;
    });
    const ok = r.parked && r.parkedAfter && r.endParked.closed && r.headAfter && r.drawn && r.endHead.closed && r.oldDrawn === true && r.endOld.closed && r.release;
    return { ok, detail: JSON.stringify(r) };
  },

  // when it ends: 34's three panels follow, and the story log gets a line that names a comrade and the front together,
  // which the Chronicle (22) keeps
  async twoScalesChronicle(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      for (const f of TSX.get(6)) {
        const q = TSX.take(f), names = q.m.ts.men.map(id => A.P(id).given), place = q.m.place;
        let h = q, m = q.m;
        for (let k = 0; k < 30 && h; k++) { if (m.over) break; A.missionChoose(TS_PICK(m, 'steady')); h = A.S.queue[0] && A.S.queue[0].m === m ? A.S.queue[0] : TSX.until('steady'); }
        // a division pulled out of the line has its panels when the fight it left is over (twoScalesOtherLives holds that)
        if (!m.over || !A.pc().alive || (m.ts.end && m.ts.end.out)) continue;
        A.missionClose();
        const lines = A.S.log.flatMap(e => e.lines || []).filter(l => l[1] === 'big' && l[0].includes(place) && names.some(n => l[0].includes(n)));
        const book = A.chronicleBook().flatMap(L => L.chapters.flatMap(c => c.lines)).join(' ');
        const next = A.S.queue.find(x => x.ev === 'bs_reckoning');
        let panels = false;
        if (next) { const box = document.createElement('div'); box.innerHTML = UI.eventModal(next); panels = ['What you saw', 'The front', 'What the chronicle will say'].every(t => box.textContent.includes(t)); }
        return { line: lines[0] ? lines[0][0] : '', inBook: !!lines[0] && book.includes(lines[0][0]), panels, order: A.S.queue[0] && (A.S.queue[0].ev || A.S.queue[0].type) };
      }
      return { line: '' };
    });
    const front = /line (held|gave way|went forward)|who had the field/.test(r.line);
    return { ok: !!r.line && front && r.inBook && r.panels, detail: `log: "${r.line}"; in the Chronicle ${r.inBook}; 34's three panels follow ${r.panels} (next: ${r.order})` };
  },

  // a commoner whose home is fought over is called to the levy, and stands with the garrison beside neighbours;
  // a soldier in garrison is asked for a draft to a division that is fighting; a captain's tactical battle is
  // followed by the fight's later days and its end; a fight over on its first day still gets its short scene
  async twoScalesOtherLives(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const out = {};
      const fights = TSX.get(10);
      // the levy
      const f = fights.find(x => !x.weAtt) || fights[0];
      TSX.load(f);
      let pc = A.pc(); const pid = +String(f.key).slice(1), F = A.S.fights[pid];
      const def = A.divsAt(pid).filter(d => A.hostile(F.a, d.r)), att = F.aIds.map(A.divById).filter(Boolean);
      pc.mil = null; pc.home = pid; pc.realm = def[0].r; A.S.tsLevy = null;
      A.wsPCFightStart(F, att, def);
      const ask = A.S.queue.find(q => q.type === 'choice' && /levy/i.test(q.title || ''));
      out.ask = ask ? ask.title : null;
      if (ask) {
        A.S.queue = [ask]; A.choiceChoose(0);
        const q = A.S.queue.find(x => x.type === 'mission' && x.m.ts);
        out.levy = !!(q && q.m.ts.levy && q.m.ts.men.length === 3);
        const calls = [], ap = A.RANKFX.apply; A.RANKFX.apply = function (k, l, p) { calls.push(l); return ap.apply(this, arguments); };
        try { A.S.queue = [q]; A.missionChoose(0); if (A.S.queue[0] === q) A.missionChoose(0); } finally { A.RANKFX.apply = ap; }
        out.levyLayer = calls.join(','); out.noMilAfter = A.pc().mil == null;
      }
      // the draft
      TSX.load(fights[0]); pc = A.pc();
      const R = A.realm(pc.mil.realm), idle = R.forces.divs.find(d => !Object.values(A.S.fights).some(F2 => F2.aIds.concat(F2.dIds).includes(d.id)));
      pc.mil.div = idle.id; A.S.pcFightAsk = A.absDay() - 200; A.S.tsDraft = null;
      for (let k = 0; k < 12 && !A.S.queue.some(q => q.ev === 'ts_draft'); k++) A.TS.draftMonth(pc);
      const dq = A.S.queue.find(q => q.ev === 'ts_draft');
      if (dq) { A.S.queue = [dq]; const v = A.eventView(dq); A.eventChoose(0); out.draft = pc.mil.div === dq.ctx.div && pc.mil.div !== idle.id; out.draftText = (v.text || '').slice(0, 60); }
      // the captain: in the first fight that runs on past his battle, the next day's orders are his company's
      out.captainParked = 0;
      for (const fc of TSX.get(24).slice(1)) {
        TSX.load(fc); pc = A.pc(); pc.mil.rank = 4;
        const pid2 = +String(fc.key).slice(1), F2 = A.S.fights[pid2];
        A.CHOICE_FN.wsPart({ key: fc.key, war: F2.war, enemy: A.hostile(F2.a, pc.mil.realm) ? F2.a : F2.b, pid: pid2 });
        const bq = A.S.queue.find(q => q.type === 'battle'); if (!bq) continue;
        A.S.queue = [bq]; A.battleAuto(bq.b); if (A.S.queue[0] === bq) A.battleClose();
        if (A.S.tsq && A.S.tsq.m.ts.officer === 1) out.captainParked++;
        const h = TSX.until('best');
        if (h && h.m.stages[h.m.stage] === 'ts_line') { out.captainScene = h.m.cur.choices.map(c => c.t).join(' / '); break; }
      }
      // your division pulled out of the line mid-fight: the scene ends with the retreat, and the panels come when the
      // fight it left is over
      for (const fp of TSX.get(24).slice(2)) {
        const q = TSX.take(fp), m = q.m;
        if (m.ts.front.divs.filter(x => x.ours && !x.gone).length < 2) continue;   // the fight must go on without you
        A.missionChoose(0); A.missionChoose(0);   // the arrows and the clash; the scene waits for the day
        const d = A.divById(m.ts.div); d.org = 0; d.atk = null; d.path = [];
        const h = TSX.until('steady');
        out.pulled = !!(h && h.m === m && m.ts.end && m.ts.end.out && m.stages[m.stage] === 'ts_break');
        if (out.pulled) {
          A.missionChoose(0); A.missionClose();
          const F4 = A.S.fights[m.ts.pid], n = A.S.queue.length;
          out.outKept = !!A.S.tsOut;
          if (F4) { A.fightEnd(m.ts.pid, 'def'); out.outPanels = A.S.queue.slice(n).some(x => x.ev === 'bs_reckoning') || A.S.queue.some(x => x.ev === 'bs_reckoning'); }
          else out.outPanels = 'fight already over';
          break;
        }
      }
      // a fight over on its first day
      TSX.load(fights[2]); pc = A.pc();
      const pid3 = +String(fights[2].key).slice(1), F3 = A.S.fights[pid3];
      const arg = { key: fights[2].key, war: F3.war, enemy: A.hostile(F3.a, pc.mil.realm) ? F3.a : F3.b, pid: pid3 };
      A.fightEnd(pid3, fights[2].weAtt ? 'att' : 'def');
      A.CHOICE_FN.wsLine(arg);
      const sq = A.S.queue.findIndex(q => q.type === 'mission' && q.m.ts), rk = A.S.queue.findIndex(q => q.ev === 'bs_reckoning');
      out.short = sq >= 0 && A.S.queue[sq].m.ts.short === 1 && A.S.queue[sq].m.stages.join() === 'ts_break' && (rk < 0 || sq < rk);
      return out;
    });
    const ok = !!r.ask && r.levy && /^levy(,levy)*$/.test(r.levyLayer || '') && r.noMilAfter && r.draft && r.captainParked >= 1 && /company/i.test(r.captainScene || '') && r.short && r.pulled && r.outKept && r.outPanels === true;
    return { ok, detail: JSON.stringify(r).slice(0, 700) };
  },

  // the scene on an iPhone SE (375 px, with 71-phone): nothing wider than the screen, every control 44 px, no text under
  // 14 px outside the print; axe (WCAG 2.1 AA) finds nothing there or on a desktop
  async twoScalesPhone(pg, errs, { browser, file }) {
    const out = {};
    for (const dev of ['se', 'desk']) {
      const { ctx, pg: p } = await openPage(browser, file, dev, errs);
      try {
        await prep(p);
        await p.evaluate(() => { const f = TSX.get(3)[1]; const q = TSX.take(f); A.S.queue = [q]; A.missionChoose(TS_PICK(q.m, 'best')); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); });
        await p.evaluate(SETTLE);
        const m = await p.evaluate(PROBE);
        await p.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
        const v = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(v => `${v.id}(${v.nodes.length}: ${v.nodes[0].target.join(' ')})`));
        const book = await p.evaluate(() => !!document.querySelector('#modal .ts-book svg.ts-strip'));
        out[dev] = { book, overflow: m.overflow, off: m.nOff, hscroll: m.hscroll.length, small: m.small.slice(0, 3), tiny: m.tinyText.filter(t => !/^13px span\.tl /.test(t)).slice(0, 3), axe: v };
      } finally { await ctx.close(); }
    }
    for (let i = errs.length - 1; i >= 0; i--) if (/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1);
    const se = out.se, dk = out.desk;
    const ok = se.book && dk.book && !se.overflow && !se.off && !se.hscroll && !se.small.length && !se.tiny.length && !se.axe.length && !dk.axe.length;
    return { ok, detail: JSON.stringify(out).slice(0, 700) };
  },
};
