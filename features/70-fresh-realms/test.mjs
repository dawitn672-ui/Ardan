// Fresh realms and starting tensions: a varied world splits 1 to 3 large realms into smaller breakaways that are
// whole, named and ruled, that every system runs (AI, markets, the war map, the Realm tab, saves), and seeds 1 to 3
// tensions the engine plays out. The world as written is untouched.
// console errors are caught and logged by the features' own try/catch; a test here counts them as failures
const watch = pg => { const E = []; pg.on('console', m => { if (m.type() === 'error') E.push(m.text().slice(0, 200)); }); return E; };
const HELP = () => {
  window.__frStart = (seed, extra) => Object.assign({ seed, race: 'human', realm: 'POL-02', status: 'peasant', sex: 'M', startAge: 18, world: 'varied' }, extra || {});
  window.__frPlay = years => {
    const end = A.absDay() + Math.round(years * 365);
    for (let m = 0; m < 3000 && A.pc() && A.pc().alive && A.absDay() < end; m++) {
      A.advance(Math.min(60, Math.max(1, end - A.absDay())));
      let h, n = 0;
      while ((h = A.headReady()) && n++ < 300) {
        if (h.type === 'event') A.eventAuto(); else if (h.type === 'choice') A.choiceChoose(0);
        else if (h.type === 'battle') { if (A.battleAuto) A.battleAuto(h.b); if (A.S.queue[0] === h) { if (A.battleClose) A.battleClose(); else A.S.queue.shift(); } }
        else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); }
        else if (h.type === 'mission' && A.missionAuto) { A.missionAuto(h.m); if (A.S.queue[0] === h) A.S.queue.shift(); }
        else A.S.queue.shift();
      }
    }
    return !!(A.pc() && A.pc().alive);
  };
  window.__frSig = () => JSON.stringify(Object.values(A.S.realms).filter(r => r.fresh).map(r => [r.id, r.name, r.short, r.title, r.fresh.kind, r.fresh.from, r.fresh.provs, r.ruler, r.house, r.army, Math.round(r.treasury)]).concat([(A.S.freshTensions || []).map(t => [t.k, t.a, t.b || ''])]));
};

export default {
  async freshRealmsValid(pg) {
    const cerr = watch(pg);
    await pg.evaluate(HELP);
    const r = await pg.evaluate(() => {
      const FR = A.FRESH, bad = [], kinds = {}, counts = [], share = [];
      let n = 0, sumOk = 0, sumN = 0;
      for (let s = 0; s < 24; s++) {
        // the same varied world without the split: what the parents had before
        A.newGame(__frStart(700 + s, { fresh: false }));
        const before = {};
        for (const r of Object.values(A.S.realms)) before[r.id] = { tre: r.treasury, inc: r.baseIncome, pop: A.realmProvs(r.id).reduce((a, P) => a + P.pop, 0), pieces: FR.pieces(r.id) };
        A.newGame(__frStart(700 + s));
        const S = A.S, F = Object.values(S.realms).filter(r => r.fresh);
        counts.push(F.length);
        for (const r of F) {
          n++; kinds[r.fresh.kind] = (kinds[r.fresh.kind] || 0) + 1;
          const P = r.fresh.provs, own = A.realmProvs(r.id).map(x => x.id), p = A.realm(r.fresh.from), ru = A.P(r.ruler), h = S.houses[r.house];
          const why = [];
          if (P.length < 2 || P.length > 4) why.push('size ' + P.length);
          if (!FR.contiguous(P)) why.push('not contiguous');
          if (own.length !== P.length || !P.every(id => own.includes(id))) why.push('owns ' + own.length);
          if (!P.includes(r.capitalProv) || A.prov(r.capitalProv).name !== r.capital) why.push('capital');
          if (P.includes(p.capitalProv)) why.push('took the parent capital');
          const sh = P.reduce((a, id) => a + A.prov(id).pop, 0) / before[p.id].pop; share.push(sh);
          if (sh > 0.35) why.push('took ' + Math.round(sh * 100) + '% of the people');
          if (!ru || !ru.alive || ru.ruler !== r.id || ru.realm !== r.id) why.push('ruler');
          if (!h || !h.name) why.push('house');
          const words = [r.name, r.short, r.title, r.fresh.want, r.fresh.fear, r.fresh.place.name, r.fresh.place.text, r.primer.intro, h && h.name].join(' | ');
          if (!r.name || !r.short || /[{}]|undefined|null|NaN|\bthe the\b/i.test(words)) why.push('words: ' + words);
          if (!P.every(id => p.claims && p.claims[id])) why.push('no claim');
          if (FR.pieces(p.id) > before[p.id].pieces) why.push('parent cut in two');
          if (!(r.rel[p.id] <= -30 && p.rel[r.id] <= -30)) why.push('rel ' + r.rel[p.id]);
          if (!(r.fresh.war || (p.truce[r.id] > S.year && r.truce[p.id] === p.truce[r.id]))) why.push('no truce or war');
          if (r.fresh.war && !S.wars.some(w => w.att.includes(p.id) && w.def.includes(r.id))) why.push('war missing');
          if (!r.forces || !r.forces.divs.length || !(r.army > 0)) why.push('no army');
          if (A.cultureFor('human', r.id) !== A.cultureFor('human', p.id) || A.faithFor('human', r.id) !== A.faithFor('human', p.id)) why.push('culture or faith');
          const D = A.BIBLE && A.BIBLE.of(r.id);
          if (A.BIBLE && (!D || !D.want || !D.fear || !D.place || !(D.customs || []).length)) why.push('bible');
          if (A.BONDS && A.BONDS.FEUD && !A.BONDS.FEUD.list(p.id, r.id).length) why.push('feud ledger');
          if (why.length) bad.push(`${s}:${r.name}: ${why.join(', ')}`);
        }
        // treasuries and incomes are shared out, not made
        for (const pid of new Set(F.map(r => r.fresh.from))) {
          const kids = F.filter(r => r.fresh.from === pid), p = A.realm(pid);
          const tre = p.treasury + kids.reduce((a, r) => a + r.treasury, 0);
          const inc = A.realmProvs(pid).reduce((a, P) => a + P.pop, 0) / before[pid].pop * before[pid].inc + kids.reduce((a, r) => a + r.baseIncome, 0);
          sumN++;
          if (Math.abs(tre - before[pid].tre) <= 2 && Math.abs(inc / before[pid].inc - 1) < 0.12) sumOk++;
          else bad.push(`${s}:${pid} treasury ${Math.round(tre)} vs ${Math.round(before[pid].tre)}, income ${Math.round(inc)} vs ${before[pid].inc}`);
        }
      }
      share.sort((a, b) => a - b);
      return { n, kinds, counts, bad: bad.slice(0, 6), nbad: bad.length, sumOk, sumN, share: [share[0], share[share.length >> 1], share[share.length - 1]].map(x => Math.round(x * 100)),
        eg: Object.values(A.S.realms).filter(r => r.fresh).map(r => `${r.name} (${r.fresh.kind}, from ${A.realmShort(r.fresh.from)}, ${r.fresh.provs.map(id => A.prov(id).name).join('+')}, ${A.rulerStyle(A.P(r.ruler), r)})`) };
    });
    const ok = (r.n >= 30 && r.nbad === 0 && Object.keys(r.kinds).length >= 3 && r.counts.every(c => c >= 1 && c <= 3) && r.sumOk === r.sumN) && !cerr.length;
    return { ok, detail: (cerr.length ? `console errors: ${cerr.slice(0, 2).join(' | ')}; ` : '') + `24 varied worlds: ${r.n} fresh realms (${r.counts.join(',')} a world), kinds ${JSON.stringify(r.kinds)}, taking ${r.share.join('/')}% (least/median/most) of the parent's people; ${r.nbad} invalid${r.bad.length ? ': ' + r.bad.join('; ') : ''}; treasury and income shared out exactly in ${r.sumOk} of ${r.sumN} parents. e.g. ${r.eg.join('; ')}` };
  },

  async freshDeterministic(pg) {
    const cerr = watch(pg);
    await pg.evaluate(HELP);
    const r = await pg.evaluate(() => {
      const sig = [];
      for (let s = 0; s < 10; s++) { A.newGame(__frStart(800 + s)); sig.push(__frSig()); }
      A.newGame(__frStart(803)); const again = __frSig();
      // a world as written, and a varied world asked to stay unsplit
      A.newGame({ seed: 803, race: 'human', realm: 'POL-02', status: 'peasant', sex: 'M', startAge: 18 });
      const canon = { fresh: Object.values(A.S.realms).filter(r => r.fresh || /^NEW-/.test(r.id)).length, notes: !!A.S.freshNotes, tensions: !!A.S.freshTensions };
      A.newGame(__frStart(803, { fresh: false }));
      const off = Object.values(A.S.realms).filter(r => r.fresh).length + (A.S.freshTensions ? 1 : 0);
      return { same: again === sig[3], distinct: new Set(sig).size, canon, off, reg: Object.keys(GD.REALM_CULTURE).filter(k => /^NEW-/.test(k)).length };
    });
    const ok = (r.same && r.distinct === 10 && !r.canon.fresh && !r.canon.notes && !r.canon.tensions && r.off === 0 && r.reg === 0) && !cerr.length;
    return { ok, detail: (cerr.length ? `console errors: ${cerr.slice(0, 2).join(' | ')}; ` : '') + `same seed, same world ${r.same}; 10 seeds give ${r.distinct} different sets of fresh realms and tensions; as written: ${r.canon.fresh} fresh realms, notes ${r.canon.notes}, tensions ${r.canon.tensions}; fresh:false gives ${r.off}; stale table entries after a canon game ${r.reg}` };
  },

  async freshRealmsRun(pg) {
    const cerr = watch(pg);
    await pg.evaluate(HELP);
    const r = await pg.evaluate(() => {
      const out = [], seeds = [811, 812, 813, 814];
      for (const seed of seeds) {
        A.newGame(__frStart(seed));
        const F = Object.values(A.S.realms).filter(r => r.fresh), ids = F.map(r => r.id);
        const t0 = {}; for (const r of F) t0[r.id] = { tre: Math.round(r.treasury), divs: r.forces.divs.length, rel: JSON.stringify(r.rel) };
        const alive = __frPlay(6);
        const S = A.S, rs = ids.map(A.realm);
        const mk = rs.filter(r => r.alive).every(r => { const m = A.mkt ? A.mkt(r.id) : r.mkt; return m && m.p && Object.keys(m.p).length > 5 && (!A.ECON || (m.s && Object.keys(m.s).length > 5)); });
        out.push({ seed, alive, n: F.length, still: rs.filter(r => r.alive).length,
          treMoved: rs.filter(r => r.alive && Math.round(r.treasury) !== t0[r.id].tre).length,
          relMoved: rs.filter(r => r.alive && JSON.stringify(r.rel) !== t0[r.id].rel).length,
          divs: rs.filter(r => r.alive).map(r => r.forces.divs.length).join('/'), mk,
          wars: S.wars.filter(w => w.att.concat(w.def).some(x => ids.includes(x))).length,
          news: (S.news || []).filter(n => rs.some(r => String(n.t).includes(r.short.replace(/^the /i, '')))).length });
      }
      return out;
    });
    const ok = (r.every(x => x.n >= 1 && x.mk && x.treMoved + x.relMoved >= x.still) && r.reduce((a, x) => a + x.news, 0) >= 4) && !cerr.length;
    return { ok, detail: (cerr.length ? `console errors: ${cerr.slice(0, 2).join(' | ')}; ` : '') + r.map(x => `seed ${x.seed}: ${x.n} fresh, ${x.still} still standing after 6 years, treasury moved in ${x.treMoved}, relations in ${x.relMoved}, divisions ${x.divs}, markets ${x.mk}, ${x.news} news lines, ${x.wars} wars now`).join('; ') };
  },

  async freshRealmsRender(pg) {
    const cerr = watch(pg);
    await pg.evaluate(HELP);
    const r = await pg.evaluate(() => {
      const out = { tabs: 0, errs: [], card: '', esc: true, pure: true };
      for (const seed of [821, 822, 823]) {
        T.enter(__frStart(seed));
        const F = Object.values(A.S.realms).filter(x => x.fresh), pc = A.pc();
        // from the parent's side, then living in the fresh realm itself
        const fr = F[0], par = A.realm(fr.fresh.from);
        pc.realm = par.id; pc.home = A.realmProvs(par.id)[0].id;
        try { UI.tab = 'realm'; UI.render(); out.card = out.card || (document.body.innerHTML.match(/Old quarrels[\s\S]{0,300}/) || [''])[0]; } catch (e) { out.errs.push('parent realm tab: ' + e.message); }
        pc.realm = fr.id; pc.home = fr.capitalProv;
        // the release fills some things in lazily the first time a view is drawn (a realm's market, a job's standing):
        // the first pass warms those up, the second must change nothing
        try { T.renderAll(); out.tabs += T.tabs().length; } catch (e) { out.errs.push('render: ' + e.message); }
        const h0 = T.hash(A.S), rng0 = A.rngState;
        try { T.renderAll(); out.tabs += T.tabs().length; } catch (e) { out.errs.push('render: ' + e.message); }
        for (const v of ['families', 'power']) { try { UI.tab = 'codex'; UI.codex = v; UI.codexRealm = fr.id; UI.render(); } catch (e) { out.errs.push('codex ' + v + ': ' + e.message); } }
        UI.codex = null; UI.tab = 'life'; UI.render();
        if (T.hash(A.S) !== h0 || A.rngState !== rng0) out.pure = false;
        // markup in a fresh realm's name is drawn as text
        fr.fresh.want = '<img src=x data-pwn=1>'; fr.name = '<b data-pwn=1>x</b>';
        try { UI.tab = 'realm'; UI.render(); } catch (e) { out.errs.push('xss render: ' + e.message); }
        if (document.querySelector('[data-pwn]')) out.esc = false;
      }
      return out;
    });
    const ok = (!r.errs.length && r.pure && r.esc && /Old quarrels/.test(r.card) && r.tabs > 0) && !cerr.length;
    return { ok, detail: (cerr.length ? `console errors: ${cerr.slice(0, 2).join(' | ')}; ` : '') + `${r.tabs} tab draws with the player in a fresh realm, errors ${r.errs.length ? r.errs.join('; ') : 'none'}; drawing is pure ${r.pure}; markup escaped ${r.esc}; the parent's Realm tab: "${r.card.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200)}"` };
  },

  async freshSaveLoad(pg) {
    const cerr = watch(pg);
    await pg.evaluate(HELP);
    const r = await pg.evaluate(() => {
      A.newGame(__frStart(831));
      __frPlay(1);
      const F = Object.values(A.S.realms).filter(x => x.fresh), id = F[0].id, from = F[0].fresh.from;
      const text = A.serialize(), sig = __frSig();
      // another game in between drops the fresh realm's table entries
      A.newGame({ seed: 5, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const dropped = GD.REALM_CULTURE[id] == null;
      A.deserialize(SAVES.clean ? JSON.parse(JSON.stringify(JSON.parse(text))) : text);
      const back = __frSig() === sig && GD.REALM_CULTURE[id] === GD.REALM_CULTURE[from] && A.cultureFor('human', id) === A.cultureFor('human', from);
      const plays = __frPlay(2);
      // a save from before this feature: no fresh fields at all
      const old = JSON.parse(text);
      for (const r of Object.values(old.realms)) delete r.fresh;
      delete old.freshTensions; delete old.freshNotes; delete old.freshTold;
      A.deserialize(old);
      const oldPlays = __frPlay(2);
      return { dropped, back, plays, oldPlays, id };
    });
    const ok = (r.dropped && r.back && r.plays && r.oldPlays) && !cerr.length;
    return { ok, detail: (cerr.length ? `console errors: ${cerr.slice(0, 2).join(' | ')}; ` : '') + `a new game drops ${r.id}'s table entries ${r.dropped}; the save loads with the same fresh realms and culture ${r.back}; plays on ${r.plays}; a save without the new fields loads and plays ${r.oldPlays}` };
  },

  async tensionsRun(pg) {
    const cerr = watch(pg);
    await pg.evaluate(HELP);
    const r = await pg.evaluate(() => {
      const FR = A.FRESH, out = {};
      const fresh = (seed, k) => { A.newGame(__frStart(seed, { fresh: false })); const t = FR.T[k](); if (t) { A.S.freshTensions = [t]; } return t; };
      // succession: a claimant faction the release's factions run
      { const t = fresh(841, 'succession'), f = A.S.factions.find(x => x.realm === t.a && x.kind === 'claimant'), d0 = f.discontent;
        __frPlay(1.1); const f2 = A.S.factions.find(x => x.id === f.id);
        out.succession = { ok: !!f && (!f2 || f2.discontent !== d0), note: t.note, members: f.members.length, after: f2 ? `discontent ${d0} -> ${f2.discontent}` : 'the faction has made its demand or broken up' }; }
      // famine: the granary at a fifth, so grain is dear
      { const t = fresh(842, 'famine'); __frPlay(0.25);
        const mine = A.mkt(t.a), others = Object.values(A.S.realms).filter(x => x.alive && x.id !== t.a && !x.isRebel).map(x => A.mkt(x.id).p.grain / ((GD.GOODS.grain || {}).base || 1));
        const ratio = mine.p.grain / ((GD.GOODS.grain || {}).base || 1), med = others.sort((a, b) => a - b)[Math.floor(others.length / 2)];
        out.famine = { ok: ratio > med * 1.4, note: t.note, after: `grain at ${ratio.toFixed(2)}× its base price, the median realm ${med.toFixed(2)}×${A.ECON ? `, stock ${Math.round(mine.s.grain)} of a normal ${Math.round(A.ECON.normal(mine, 'grain'))}` : ''}` }; }
      // holy war: a cause the AI's war choice reads
      { const t = fresh(843, 'holywar'); out.holywar = { ok: A.cbOn(t.a, t.b) === 'holy' && A.relBetween(t.a, t.b) <= -15, note: t.note, after: `cause ${A.cbOn(t.a, t.b)}, opinion ${Math.round(A.relBetween(t.a, t.b))}` }; }
      // regency: a child ruler, a regent whose temper counts, and the regency ends when the child comes of age
      { const t = fresh(844, 'regency'), r = A.realm(t.a), kid = A.P(r.ruler), R = r.regency;
        const child = !!kid && !A.isAdult(kid) && !!R && R.kid === kid.id;
        let persona = 'no 20-ai-personality';
        if (A.rulerPersona && R) { const rg = A.P(R.pid), a = A.rulerPersona(r.id); persona = rg ? `persona read from the regent ${a.parts ? 'with parts' : ''}`.trim() : 'no regent'; }
        // fast-forward the child's birth so the coming of age falls in the next year
        kid.born = A.S.year - (GD.RACES[kid.race].adult - 1);
        __frPlay(1.2);
        out.regency = { ok: child && !r.regency && r.ruler === kid.id && A.isAdult(kid), note: t.note, after: `child ruler ${child}; ${persona}; after the coming of age regency ${r.regency ? 'still on' : 'over'}` }; }
      // debt: paid a fifth each New Year, or a cause for the creditor
      { const t = fresh(845, 'debt'), a = A.realm(t.a), b = A.realm(t.b), b0 = b.treasury;
        t.amt = t.left = 1e9;   // a debt the debtor cannot meet
        __frPlay(3.1);
        const missed = t.missed, cb = (A.realm(t.b).cbs || {})[t.a], cause = cb && cb.k, reads = A.cbOn(t.b, t.a);
        const t2 = fresh(845, 'debt'), a2 = A.realm(t2.a); a2.treasury = 1e7; __frPlay(1.1);
        out.debt = { ok: missed >= 2 && cause === 'tribute' && reads != null && t2.left < t2.amt, note: t.note, after: `an empty treasury misses ${missed} payments and ${b.short} gains the cause "${cause}"; a full one pays ${t2.amt - t2.left} of ${t2.amt}` }; }
      return out;
    });
    const ok = (Object.values(r).every(x => x.ok)) && !cerr.length;
    return { ok, detail: (cerr.length ? `console errors: ${cerr.slice(0, 2).join(' | ')}; ` : '') + Object.entries(r).map(([k, x]) => `${k} ${x.ok ? 'ok' : 'FAIL'}: "${x.note}"; ${x.after}`).join(' | ') };
  },

  async freshTold(pg) {
    const cerr = watch(pg);
    await pg.evaluate(HELP);
    const r = await pg.evaluate(() => {
      const out = [];
      for (const seed of [851, 852, 853]) {
        A.newGame(__frStart(seed));
        __frPlay(1);
        const lines = A.S.log.flatMap(e => (e.lines || []).map(l => l[0]));
        const told = lines.find(l => /Older quarrels shape the year/.test(l)) || '';
        out.push({ told, n: (A.S.freshNotes || []).length, t: (A.S.freshTensions || []).map(t => t.k).join('+') });
      }
      return out;
    });
    const ok = (r.every(x => x.told && x.n >= 2 && !/[{}]|undefined/.test(x.told))) && !cerr.length;
    return { ok, detail: (cerr.length ? `console errors: ${cerr.slice(0, 2).join(' | ')}; ` : '') + r.map(x => `${x.n} notes (${x.t})`).join('; ') + `. "${(r[0].told || '').slice(0, 400)}"` };
  },
};
