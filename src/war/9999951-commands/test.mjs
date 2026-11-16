// Tests for W1-3, "commands and the summons" (docs/design/war.md §9.5 and §16, D-064 points 2, 4, 5 and 6, D-081).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const SAVES = path.join(ROOT, 'tests', 'saves');

// in-page helpers: a seeded stream for the labs (A.rand untouched), a house with a seat on a foreign border
const LAB = () => {
  window.CMLAB = {
    rng(seed) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; },
    // a tenant-in-chief of rid whose seat borders another realm (for a hostile neighbour), else any
    border(rid) {
      const fit = h => { const p = h.headPid != null ? A.P(h.headPid) : null; return p && p.alive && A.isAdult(p) && A.age(p) < 55 && p.id !== A.S.pc && (p.health == null || p.health >= 30); };
      const hs = A.CMD.tics(rid).filter(h => A.CMD.seatProv(h) && fit(h));
      return hs.find(h => A.CMD.near(h).length) || null;
    },
    war(att, def) { return { id: 'WLAB', att: [att], def: [def], cb: 'conquest', name: 'the lab war' }; },
    // a few days of the world, the cards answered as the bot would
    days(n) { for (let i = 0; i < n; i++) { A.advance(1); let h, g = 0; while ((h = A.headReady()) && g++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } } },
  };
};

export default {
  // every armed man in exactly one command, each command with one owner, no man General of two; the posts audit clean;
  // over 15 years of a world at war
  async cmEveryManOneCommand(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 13, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      const out = { months: 0, faults: [], posts: 0, divs: 0, house: 0, crown: 0, realms: 0, cmds: 0, wars: 0, musters: 0 };
      const look = () => {
        out.months++;
        const f = A.CMD.audit(); if (f.length && out.faults.length < 6) out.faults.push(...f.slice(0, 2));
        out.posts += A.POSTS.audit().length;
      };
      for (let y = 0; y < 15; y++) T.play(1, { each: look });
      for (const id in A.S.realms) {
        const r = A.S.realms[id]; if (!r || r.alive === false || !r.forces) continue;
        out.realms++; out.cmds += A.CMD.of(id).length;
        for (const d of r.forces.divs) { out.divs++; if (A.CMD.divCmd(d).startsWith('house:')) out.house++; else out.crown++; }
      }
      out.wars = A.S.nextWar || 0; out.musters = A.CMD.musters().length;
      return out;
    });
    const ok = !r.faults.length && !r.posts && r.divs > 100 && r.house > 10 && r.crown > r.house / 2 && r.musters > 0;
    return { ok, detail: `${r.months} months read: ${r.faults.length} command faults${r.faults.length ? ' (' + r.faults.join('; ') + ')' : ''}, ${r.posts} one-holder faults; ${r.divs} hosts and columns in ${r.realms} realms' ${r.cmds} commands: ${r.house} in great lords' commands, ${r.crown} in the crowns'; ${r.wars} wars, ${r.musters} musters kept` };
  },

  // the summons: a range of answers in a real world, each with its reasons; the reason given and the true one recorded
  async cmSummonsRange(pg) {
    await pg.evaluate(LAB);
    const r = await pg.evaluate(() => {
      const out = { spread: {}, n: 0, noReason: 0, given: 0, truth: 0, lines: [] };
      for (const seed of [21, 22, 23]) {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
        // a world where the crown's hand and the lords' grievances vary: some lords have little love for the crown
        let k = 0;
        for (const id of Object.keys(A.S.houses)) { const h = A.S.houses[id]; if (A.CMD.isTic(h)) h.op = [15, 30, 45, 60, 75][k++ % 5]; }
        const pairs = [['POL-01', 'POL-05'], ['POL-03', 'POL-02'], ['POL-06', 'POL-07']];
        for (const [a, b] of pairs) {
          const w = A.startWar(a, b, null, 'conquest');
          if (!w) continue;
          for (const m of A.CMD.musters().filter(x => x.w === w.id)) for (const e of m.e) {
            out.n++; out.spread[e.a] = (out.spread[e.a] || 0) + 1;
            if (!e.why || !e.why.length) out.noReason++;
            if (e.a !== 'full' && e.g) out.given++;
            if (e.a !== 'full' && e.t) out.truth++;
            if (e.a !== 'full' && out.lines.length < 4) out.lines.push(A.CMD.lineFor(m, e, true));
          }
        }
      }
      return out;
    });
    const kinds = Object.keys(r.spread).length, notFull = r.n - (r.spread.full || 0);
    const ok = r.n >= 40 && kinds >= 5 && (r.spread.full || 0) > notFull && !r.noReason && r.given === notFull && r.truth >= notFull / 4;   // (many excuses are true: a deputy for his years, a border truly threatened)
    return { ok, detail: `${r.n} lords answered: ${Object.entries(r.spread).map(([k, v]) => `${k} ${v}`).join(', ')}; ${r.noReason} without a reason; of ${notFull} who did not come in full, ${r.given} gave a reason and ${r.truth} had another underneath. ${r.lines.join(' | ')}` };
  },

  // a lord who hates the king refuses or sends coin more often than the same lord who loves him; war.md §9.5's lab: a
  // named grievance and a hostile neighbour bring part or nothing 7 in 10, neither brings him in full 9 in 10
  async cmHatredRefuses(pg) {
    await pg.evaluate(LAB);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 31, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      // up to eight great lords of fighting age with a seat on a foreign border, from as many realms (their tempers vary)
      const lords = [];
      for (const id of Object.keys(A.S.realms)) { const x = A.S.realms[id]; if (!x.alive || x.isRebel) continue; const c = CMLAB.border(id); if (c) lords.push([id, c]); if (lords.length >= 8) break; }
      if (lords.length < 4) return { err: `only ${lords.length} great lords with a seat on a border` };
      const N = 30, rand = CMLAB.rng(7), tot = {};
      const run = (key, op, hostile) => {
        const c = tot[key] = tot[key] || { full: 0, part: 0, late: 0, deputy: 0, coin: 0, refuse: 0 };
        for (const [rid, h] of lords) {
          const r = A.realm(rid), foeFar = Object.keys(A.S.realms).find(id => id !== rid && A.S.realms[id].alive && !A.CMD.near(h).includes(id));
          const w = CMLAB.war(rid, foeFar);
          h.op = op;
          for (const nb of A.CMD.near(h)) A.setRelPair(rid, nb, hostile ? -80 : 40);
          for (let i = 0; i < N; i++) { const x = A.CMD.answer(h, r, w, { full: 0, refuse: 0 }, { rand }); c[x.e.a]++; }
        }
      };
      run('hate', 8, false); run('love', 80, false); run('both', 15, true); run('none', 65, false);
      return Object.assign({ n: lords.length * N, lords: lords.map(x => x[1].id) }, tot);
    });
    if (r.err) return { ok: false, detail: r.err };
    const no = c => c.refuse + c.coin, partOrNot = c => c.part + c.refuse + c.coin;
    const ok = no(r.hate) >= no(r.love) + r.n / 6 && partOrNot(r.both) >= .7 * r.n && r.none.full >= .9 * r.n;
    const f = c => Object.entries(c).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(', ');
    return { ok, detail: `${r.lords.length} great lords on a border, ${r.n} summonses each way: hating the king (opinion 8): ${f(r.hate)} (refuse or coin ${no(r.hate)}); loving him (80): ${f(r.love)} (${no(r.love)}); a grievance and a hostile neighbour: ${f(r.both)} (part or nothing ${partOrNot(r.both)}); neither: ${f(r.none)}` };
  },

  // a contingent is kept whole: a great lord's hosts in a war are in one army
  async cmContingentWhole(pg) {
    await pg.evaluate(LAB);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 41, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      const out = { wars: 0, houses: 0, split: 0, armies: 0 };
      for (const [a, b] of [['POL-03', 'POL-01'], ['POL-05', 'POL-02']]) { const w = A.startWar(a, b, null, 'conquest'); if (w) out.wars++; }
      CMLAB.days(40);
      for (const rid of ['POL-01', 'POL-03', 'POL-05', 'POL-02']) {
        const by = new Map();
        for (const a of A.armiesOf(rid)) { out.armies++; for (const id of a.divs) { const d = A.divById(id), h = d && A.CMD.houseOf(d); if (h) { if (!by.has(h.id)) by.set(h.id, new Set()); by.get(h.id).add(a.id); } } }
        for (const [, s] of by) { out.houses++; if (s.size > 1) out.split++; }
      }
      out.audit = A.CMD.audit().filter(x => /split/.test(x)).length;
      return out;
    });
    const ok = r.wars === 2 && r.houses >= 3 && !r.split && !r.audit;
    return { ok, detail: `${r.wars} wars, ${r.armies} armies: ${r.houses} great lords' contingents in the field, ${r.split} split between armies (audit: ${r.audit})` };
  },

  // the three ways the king commands two hosts or more, each for its reasons, and what each does
  async cmThreeWays(pg) {
    await pg.evaluate(LAB);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 51, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      const w = A.startWar('POL-03', 'POL-01', null, 'conquest');
      CMLAB.days(5);
      const a = A.armiesOf('POL-01').filter(x => A.HOSTS.armyHosts(x).length >= 2).sort((x, y) => y.divs.length - x.divs.length)[0];
      if (!a) return { err: 'no army of two hosts' };
      const r = A.realm('POL-01'), king = A.P(r.ruler), g = A.P(a.gen), out = {};
      const reset = () => { delete a.cmdBy; delete a.king; delete a.cmdWhy; for (const b of A.S.armies) if (b !== a && b.cmdBy === 'king') { delete b.cmdBy; delete b.king; } };
      const sk = { k: king.skills.command, g: g ? g.skills.command : 0 }, born = king.born, stab = r.stability;
      // a skilled king of fighting age, his realm attacked: in person
      reset(); king.skills.command = 90; king.born = A.S.year - 40; r.stability = 70; if (g) g.skills.command = 20;
      const rec1 = A.CMD.chooseCommand(a, { rand: CMLAB.rng(1) });
      out.king = { by: a.cmdBy, as: A.HOSTS.army(a).as, words: A.HOSTS.commandWords(a), why: a.cmdWhy, temper: A.GENERALS.of(a) === A.GENERALS.temper(king) || A.GENERALS.of(a) === 'steady' };
      // an old king with no skill, his throne shaking, a proven General he trusts: the commission
      reset(); king.skills.command = 5; king.born = A.S.year - 75; r.stability = 20; if (g) { g.skills.command = 95; if (!king.rel[g.id]) A.link(king, g, 'acquaint', 60, 'acquaint'); king.rel[g.id].op = 60; }
      const rec2 = A.CMD.chooseCommand(a, { rand: CMLAB.rng(2) });
      out.commission = { by: a.cmdBy, as: A.HOSTS.army(a).as, words: A.HOSTS.commandWords(a), why: a.cmdWhy };
      // the same old king, no General he can choose (the commission's man has no skill and no trust): a council of war
      reset(); if (g) { g.skills.command = 0; king.rel[g.id].op = -80; g.fame = 90; }
      const rec3 = A.CMD.chooseCommand(a, { rand: CMLAB.rng(3) });
      out.council = { by: a.cmdBy, as: A.HOSTS.army(a).as, words: A.HOSTS.commandWords(a), why: a.cmdWhy, slower: A.CMD.slow(a) === 1 && A.GENERALS.every(a) === (A.GENERALS.DIALS.steady.every || 3) + 1 };
      out.recs = [rec1, rec2, rec3].map(x => x && x.why.length >= 1);
      king.skills.command = sk.k; king.born = born; r.stability = stab; if (g) g.skills.command = sk.g;
      out.log = (A.S.why || []).filter(x => x.k === 'command').length;
      void w;
      return out;
    });
    if (r.err) return { ok: false, detail: r.err };
    const ok = r.king.by === 'king' && r.king.as === 'king' && r.commission.by === 'commission' && r.commission.as === 'commission' && r.council.by === 'council' && r.council.as === 'council of war' && r.council.slower && r.recs.every(Boolean) && r.log >= 3;
    return { ok, detail: `in person: ${r.king.by} ("${r.king.words}"; ${r.king.why}) · commission: ${r.commission.by} (${r.commission.why}) · council: ${r.council.by} ("${r.council.words}", a day slower: ${r.council.slower}; ${r.council.why}); ${r.log} records kept` };
  },

  // a refusal is a grievance; the king's sentence is decided, as far as his strength reaches, and the lord answers it
  async cmRefusalLadder(pg) {
    await pg.evaluate(LAB);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 61, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      const out = { sen: {}, ans: {}, unf: 0, n: 0, griefs: 0, why: 0 };
      const rand = CMLAB.rng(11);
      for (const rid of ['POL-01', 'POL-03', 'POL-05']) {
        const r = A.realm(rid);
        for (const h of A.CMD.tics(rid)) {
          for (const n of [0, 1, 3]) {
            h.cmRef = Array(n + 1).fill(A.S.year); delete h.cmGr;
            const m = { w: 'WLAB', r: rid, y: A.S.year, d: A.CMD.now(), e: [] };
            const e = { h: h.id, p: h.headPid, a: 'refuse', m: A.CMD.men(A.CMD.house(h)), n: A.CMD.full(h), g: 'the harvest', t: 'His grievance with the crown', d: m.d };
            m.e.push(e);
            const rec = A.CMD.sentence(m, e, { rand });
            if (!rec) continue;
            out.n++; out.sen[e.sen] = (out.sen[e.sen] || 0) + 1; if (e.ans) out.ans[e.ans] = (out.ans[e.ans] || 0) + 1; if (e.unf) out.unf++;
            if (e.sen !== 'accept' && A.CMD.griefs(h).length) out.griefs++;
            if (rec.why.length) out.why++;
          }
        }
      }
      return out;
    });
    const kinds = Object.keys(r.sen).length;
    const ok = r.n >= 20 && kinds >= 3 && r.why === r.n && r.griefs >= (r.n - (r.sen.accept || 0)) * .9 && Object.keys(r.ans).length >= 2;
    return { ok, detail: `${r.n} refusals judged: ${Object.entries(r.sen).map(([k, v]) => `${k} ${v}`).join(', ')} (${r.unf} beyond the crown's strength); the lords: ${Object.entries(r.ans).map(([k, v]) => `${k} ${v}`).join(', ')}; ${r.griefs} grievances recorded` };
  },

  // a landed lord is summoned as a real choice: six answers, each with what follows; a refusal brings the crown's
  // judgment; the War tab's muster roll at his rank; a peasant of another realm sees nothing of it
  async cmPlayerSummons(pg) {
    await pg.setViewportSize({ width: 375, height: 667 });
    const r = await pg.evaluate(() => {
      const out = { ways: {} };
      for (let i = 0; i < 6; i++) {
        let pc = null, o = null;
        for (let seed = 7101; seed < 7140 && !o; seed++) {
          A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
          pc = A.pc(); pc.noble = pc.noble || { rung: 4, realm: pc.realm }; pc.noble.rung = Math.max(4, pc.noble.rung || 0); pc.coin = 1e6; delete pc.mil; delete pc.company;
          o = A.POL.pcOath(pc); if (!o || !o.men) o = null;
        }
        if (!o) return { err: 'no landed lord with an oath' };
        UI.screen = 'game'; UI.tab = 'life'; UI.ov = null;
        A.S.queue = [];
        const foe = Object.keys(A.S.realms).find(id => id !== o.r.id && A.S.realms[id].alive && !A.S.realms[id].isRebel);
        const w = A.startWar(o.r.id, foe, null, 'conquest');
        const q = A.S.queue.find(x => x.ev === 'cm_summons');
        if (!q) { out.ways[i] = { queued: false }; continue; }
        const v = A.eventView(q);
        const coin0 = pc.coin, rung0 = pc.noble.rung;
        A.eventChoose(i);
        const m = A.CMD.musterOf(w.id, o.r.id), e = m && m.e.find(x => x.p === pc.id);
        out.ways[i] = { queued: true, n: v.choices.length, t: v.choices[i].t, a: e && e.a, paid: coin0 - pc.coin, sen: e && e.sen, card: A.S.queue.some(x => x.ev === 'cm_sentence'), battle: A.S.queue.some(x => x.type === 'battle'), rungLost: rung0 - pc.noble.rung };
        if (i === 0) {
          UI.tab = 'war'; UI.render();
          const el = document.querySelector('.cm-muster');
          out.card = !!el; out.cardText = el ? el.textContent.slice(0, 160) : '';
          out.wide = el ? el.scrollWidth > el.clientWidth + 1 || document.documentElement.scrollWidth > 376 : false;
          UI.tab = 'life'; UI.render();
        }
      }
      // a peasant of another realm: no muster roll on his War tab
      A.newGame({ seed: 7201, race: 'human', realm: 'POL-02', status: 'peasant', sex: 'M', startAge: 20 });
      UI.screen = 'game'; A.startWar('POL-01', 'POL-05', null, 'conquest');
      out.other = A.CMD.place('POL-01') == null && !UI.musterCard(A.pc());
      return out;
    });
    if (r.err) return { ok: false, detail: r.err };
    const W = r.ways, all = Object.values(W);
    const ok = all.length === 6 && all.every(x => x.queued && x.n === 6) && W[0].a === 'full' && W[0].battle && W[1].a === 'part' && W[2].a === 'late' && W[3].a === 'deputy' && W[4].a === 'coin' && W[4].paid > 0 && W[5].a === 'refuse' && !!W[5].sen && r.card && !r.wide && r.other;
    return { ok, detail: all.map(x => x.queued ? `"${x.t}": ${x.a}${x.battle ? ', a battle' : ''}${x.paid > 0 ? `, paid ${x.paid}` : ''}${x.sen ? `, judged: ${x.sen}${x.card ? ' (a card)' : ''}${x.rungLost ? ', a rung lost' : ''}` : ''}` : 'NOT QUEUED').join('; ') + `. The War tab's roll at 375 wide: ${r.card ? 'shown' : 'MISSING'}${r.wide ? ', TOO WIDE' : ''} ("${r.cardText}"); another realm's peasant sees none: ${r.other}` };
  },

  // the same seed gives the same musters, sentences and commands
  async cmDeterministic(pg) {
    const r = await pg.evaluate(() => {
      const run = () => {
        T.enter({ seed: 71, race: 'human', realm: 'POL-03', status: 'peasant', sex: 'M', startAge: 16 });
        A.startWar('POL-03', 'POL-02', null, 'conquest');
        T.play(3);
        return T.hash({ m: A.CMD.musters(), a: (A.S.armies || []).map(a => [a.id, a.cmdBy, a.king, a.gen]), own: A.allDivs().map(d => [d.id, d.own || null, d.hold || null]) });
      };
      const a = run(), b = run();
      return { a, b, n: A.CMD.musters().length };
    });
    return { ok: r.a === r.b && r.n > 0, detail: `two runs of seed 71: ${r.a} and ${r.b}; ${r.n} musters` };
  },

  // an old save: its armies map into commands (the crown's by default; the great houses' hosts dealt to them), the
  // audits are clean, and it plays on
  async cmOldSave(pg) {
    const files = fs.existsSync(SAVES) ? fs.readdirSync(SAVES).filter(f => f.endsWith('.ardan')).sort() : [];
    const pick = ['v2.1.0-alpha.9-marshal.ardan', 'v2.1.0-alpha.1-noble.ardan'].filter(f => files.includes(f));
    if (!pick.length) return { ok: true, skip: 'no sample saves' };
    const out = [];
    for (const f of pick) {
      const b64 = fs.readFileSync(path.join(SAVES, f)).toString('base64');
      const r = await pg.evaluate(async (b64) => {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const d = await SAVES.decode(bytes);
        const had = Object.values(d.S.realms).some(r => r && r.cmdDeal);
        const loaded = UI.enterSaveSafe(d);
        const before = A.CMD.audit().length;
        const play = T.play(1);
        let house = 0, divs = 0;
        for (const id in A.S.realms) { const r = A.S.realms[id]; if (!r || r.alive === false || !r.forces) continue; for (const x of r.forces.divs) { divs++; if (A.CMD.divCmd(x).startsWith('house:')) house++; } }
        return { loaded: loaded !== false, had, before, after: A.CMD.audit().length, posts: A.POSTS.audit().length, play, house, divs };
      }, b64);
      out.push(Object.assign({ f }, r));
    }
    const ok = out.every(x => x.loaded && !x.had && !x.after && !x.posts && (x.play === 'ok' || x.play === 'dead') && x.house > 0 && x.divs > x.house);
    return { ok, detail: out.map(x => `${x.f}: loaded ${x.loaded}, ${x.divs} hosts, ${x.house} dealt to great lords; command faults ${x.after}, one-holder faults ${x.posts}; plays on: ${x.play}`).join(' · ') };
  },
};
