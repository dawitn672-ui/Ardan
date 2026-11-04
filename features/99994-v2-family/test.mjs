// v2 family (docs/v2/V2_SPEC.md complaints 5 and 14, integration step 5): the tests the spec names for this step, in
// the browser build: kinship terms exact, a parent never "a mutual friend", marriage and feud read as one label, one
// holder per title over 30 seeds, the birth-position picker gone, three generations of family, succession by law.
export default {
  // the family generated at birth: both pairs of grandparents, uncles and aunts on both sides, cousins; the same twice
  // from one seed; the game's random stream is set aside while it is made
  async v2fThreeGenerations(pg) {
    const r = await pg.evaluate(() => {
      const F = A.V2F, rows = [], bad = [];
      for (const [seed, status, startAge] of [[11, 'noble', 0], [12, 'peasant', 16], [13, 'royal', 8], [14, 'artisan', 20], [15, 'gentry', 0], [16, 'merchant', 30]]) {
        const fam = () => {
          T.enter({ seed, status, startAge });
          const pc = A.pc(), P = F.people(), me = P.of(pc);
          const par = P.parents(me), gps = par.flatMap(p => P.parents(p));
          const unc = par.flatMap(p => P.parents(p)[0] ? P.children(P.parents(p)[0]).filter(x => x.id !== p.id) : []);
          const cz = unc.flatMap(u => P.children(u));
          const married = par.every(p => { const g = P.parents(p); return g.length === 2 && g[0].spouseIds.includes(g[1].id); });
          const sides = par.map(p => P.parents(p)[0] ? P.children(P.parents(p)[0]).filter(x => x.id !== p.id).length : 0);
          return { pc: pc.id, n: par.length, g: gps.length, married, sides, unc: unc.length, cz: cz.length, h: T.hash(Object.keys(A.S.people).map(id => [id, A.S.people[id].given, A.S.people[id].born, A.S.people[id].parents])) };
        };
        const a = fam(), b = fam();
        rows.push(`${status} ${a.g} grandparents, ${a.unc} uncles and aunts (${a.sides.join('+')}), ${a.cz} cousins`);
        if (a.n !== 2 || a.g !== 4 || !a.married) bad.push(`${seed}: ${a.n} parents, ${a.g} grandparents, married ${a.married}`);
        if (a.sides.some(x => x < 1)) bad.push(`${seed}: a side with no uncle or aunt (${a.sides})`);
        if (a.h !== b.h) bad.push(`${seed}: a different family the second time`);
        a.cz === 0 && bad.push(`${seed}: no cousins`);
      }
      const s0 = A.rngState; F.sandbox('t', () => { A.rand(); A.rand(); }); if (A.rngState !== s0) bad.push('the sandbox moved the stream');
      return { bad, rows };
    });
    const tooFew = r.bad.filter(x => /no cousins/.test(x)).length;
    const hard = r.bad.filter(x => !/no cousins/.test(x));
    return { ok: !hard.length && tooFew <= 1, detail: hard.concat(tooFew > 1 ? [`${tooFew} families with no cousins`] : []).join('; ') || r.rows.join('; ') };
  },

  // the picker is gone: no "Place in the family" choice on any creation step for any rank; a random character draws no
  // position; an old option (order: 'heir') changes nothing
  async v2fPickerGone(pg) {
    const r = await pg.evaluate(() => {
      const bad = [];
      UI.set.lfLives = 0; UI.A.newLife();
      const app = document.getElementById('app');
      for (const status of ['peasant', 'artisan', 'gentry', 'noble', 'royal']) {
        UI.A.crStep(0);
        Object.assign(UI.cr, { status, race: 'human', realm: 'POL-03' }); UI.crFix();
        let all = '';
        for (const st of [0, 1, 2, 3]) { UI.A.crStep(st); all += app.innerHTML; }
        if (/data-v="order:/.test(all)) bad.push(`${status}: the picker is drawn`);
        if (UI.cr.house && !/Not chosen/.test(all)) bad.push(`${status}: no note where the picker was`);
      }
      if (UI.crRandomize) { UI.crRandomize(); if (UI.cr.order) bad.push('random character drew ' + UI.cr.order); }
      const same = [];
      for (const order of [undefined, 'heir', 'younger', 'cadet', 'bastard']) {
        A.newGame({ seed: 4242, status: 'noble', realm: 'POL-03', order });
        const pc = A.pc();
        same.push([A.relsOf(pc, ['sibling']).length, !!pc.flags.bastard, (pc.parents || []).join()].join('|'));
      }
      if (new Set(same).size !== 1) bad.push('the order option still changes the birth: ' + same.join(' / '));
      return bad;
    });
    return { ok: !r.length, detail: r.join('; ') || 'no picker on any rank; random characters and old options draw no birth position' };
  },

  // kinship terms are exact (the family graph, not rel.type): grandparents, uncles, cousins, in-laws, half-siblings,
  // removed cousins, great-uncles, nephews, step-parents
  async v2fKinTerms(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 31, status: 'peasant', startAge: 30 });
      const pc = A.pc(), F = A.V2F, bad = [];
      const mk = (sex, born, parents) => { const p = A.newPerson({ sex, born, race: 'human', parents: parents ? parents.map(x => x.id) : [] }); for (const q of parents || []) q.children.push(p.id); return p; };
      const fa = F.parentOf(pc, 'M'), mo = F.parentOf(pc, 'F');
      const lab = (o, rel) => { A.link(pc, o, rel || 'acquaint', 10); return A.relLabel(o, pc.rel[o.id]); };
      const gf = (fa.parents || []).map(A.P).find(q => q.sex === 'M');
      const want = [];
      want.push([lab(fa, 'friend'), 'Father (close to you)']);
      want.push([lab(gf), 'Grandfather']);
      // a sibling of your grandfather: great-uncle; their grandchild: your second cousin
      const ggf = mk('M', gf.born - 25), ggm = mk('F', gf.born - 23); gf.parents = [ggf.id, ggm.id]; ggf.children.push(gf.id); ggm.children.push(gf.id);
      const gu = mk('M', gf.born + 2, [ggf, ggm]);
      want.push([lab(gu), 'Great-uncle']);
      const guk = mk('F', gu.born + 25, [gu]), guk2 = mk('M', guk.born + 24, [guk]);
      want.push([lab(guk), 'First cousin once removed'], [lab(guk2), 'Second cousin']);
      // a half-brother (father's son by another woman), a nephew, a step-mother, a father-in-law
      const other = mk('F', fa.born + 3), half = mk('M', pc.born + 3, [fa, other]);
      want.push([lab(half), 'Half-brother']);
      const neph = mk('M', half.born + 20, [half]);
      want.push([lab(neph), 'Nephew']);
      const wife = mk('F', pc.born + 1), wf = mk('M', wife.born - 26); wife.parents = [wf.id]; wf.children.push(wife.id);
      pc.spouse = wife.id; wife.spouse = pc.id; A.link(pc, wife, 'spouse', 50, 'spouse');
      want.push([A.relLabel(wife, pc.rel[wife.id]), 'Wife'], [lab(wf), 'Father-in-law']);
      // {father} and {mother} by sex, whatever the order of p.parents
      pc.parents = [mo.id, fa.id];
      const tok = A.T('{father} and {mother}');
      if (tok !== `${fa.given} and ${mo.given}`) bad.push(`tokens read "${tok}"`);
      for (const [got, exp] of want) if (got !== exp) bad.push(`"${got}" for ${exp}`);
      return { bad, n: want.length };
    });
    return { ok: !r.bad.length, detail: r.bad.join('; ') || `${r.n} kinship terms exact, and {father}/{mother} by sex` };
  },

  // a parent is never "a mutual friend": the circle line, first impressions and gossip skip kin and spouses
  async v2fParentNotMutualFriend(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 32, status: 'artisan', startAge: 25 });
      const pc = A.pc(), F = A.V2F, fa = F.parentOf(pc, 'M'), mo = F.parentOf(pc, 'F'), bad = [];
      for (const [a, b] of [[pc, fa], [pc, mo], [fa, mo], [mo, fa]]) { if (a.rel[b.id]) a.rel[b.id].op = 80; else A.link(a, b, 'friend', 80); }
      if (F.mayCallFriend(pc, mo, fa)) bad.push('your father may be called a mutual friend of you and your mother');
      const c = A.CIRCLES.circleOf(pc, mo);
      if (c.friends.some(x => x.id === fa.id)) bad.push('the circle of your mother lists your father as your friend');
      const html = UI.personModal(mo, '');
      if (/Circle:/.test(html) && html.includes(UI.esc(fa.given))) bad.push('the person view names your father in your mother\'s circle');
      // between two people who are not kin, a friend outside both families is still a friend in common (between you
      // and your mother kin.js refuses even that: he is a friend of the family, not "a mutual friend")
      const y = A.newPerson({ sex: 'F', born: pc.born - 1, race: 'human' }), x = A.newPerson({ sex: 'M', born: pc.born - 2, race: 'human' });
      A.link(pc, y, 'friend', 70, 'friend'); A.link(pc, x, 'friend', 70, 'friend'); A.link(y, x, 'friend', 70, 'friend');
      if (!F.mayCallFriend(pc, y, x)) bad.push('a friend outside the family is refused');
      if (!A.CIRCLES.circleOf(pc, y).friends.some(z => z.id === x.id)) bad.push('the circle lost a real friend in common');
      // no event text says "mutual friend" without the gate (none does today)
      const evs = Object.values(A.EV).filter(e => /mutual friend/i.test(String(e.text) + JSON.stringify(e.choices || [])));
      if (evs.length) bad.push('events say "mutual friend": ' + evs.map(e => e.id).join(', '));
      return bad;
    });
    return { ok: !r.length, detail: r.join('; ') || 'kin and spouses are never "a friend of" anyone in the circle line, impressions or gossip' };
  },

  // marriage and feud read as one coherent label: the spouse first, the feud as its qualifier; she stays in Family;
  // {rival} never names her
  async v2fMarriageFeud(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 33, status: 'merchant', sex: 'M', startAge: 30 });
      const pc = A.pc(), bad = [];
      const w = A.newPerson({ sex: 'F', born: pc.born + 2, race: 'human', given: 'Wenna' });
      pc.spouse = w.id; w.spouse = pc.id;
      A.link(pc, w, 'rival', -60, 'rival');
      const lab = A.relLabel(w, pc.rel[w.id]);
      if (lab !== 'Wife (at odds with you)') bad.push(`the label reads "${lab}"`);
      const x = A.newPerson({ sex: 'M', born: pc.born, race: 'human', given: 'Odo' }); A.link(pc, x, 'rival', -40, 'rival');
      const t = A.T('{rival} waits.');
      if (/Wenna/.test(t)) bad.push('{rival} names your wife');
      UI.tab = 'people'; UI.render();
      const html = UI.peopleList(pc), foes = html.split(/group-h/).find(s => /Rivals/.test(s)) || '';
      if (foes.includes('person:' + w.id)) bad.push('your wife is listed under Rivals');
      if (!/Wife \(at odds with you\)/.test(html)) bad.push('the People tab does not show the one label');
      return { bad, lab, t };
    });
    return { ok: !r.bad.length, detail: r.bad.join('; ') || `"${r.lab}"; "${r.t}"` };
  },

  // succession follows the house law: absolute gives the eldest child, male-preference the eldest son, agnatic skips a
  // daughter's son, a dead eldest son's son comes before his younger brother (the release took the brother)
  async v2fSuccessionLaw(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 34, status: 'noble', startAge: 20 });
      const F = A.V2F, bad = [], keep = F.houseLaw;
      const hid = Object.keys(A.S.houses).find(id => { const h = A.S.houses[id]; return h.great !== false && h.kind === 'noble' && !F.royalRealmOf(id) && id !== A.pc().house; });
      const h = A.S.houses[hid];
      const run = (law, build) => {
        F.houseLaw = () => ({ law, fitness: 'none' });
        const head = A.newPerson({ sex: 'M', born: A.S.year - 70, race: 'human', house: hid }); h.headPid = head.id;
        const kid = (sex, age, par) => { const k = A.newPerson({ sex, born: A.S.year - age, race: 'human', house: hid, parents: [par.id] }); par.children.push(k.id); return k; };
        const want = build(head, kid);
        A.kill(head, 'old age');
        return { got: h.headPid, want: want.id };
      };
      try {
        let x = run('absolute', (hd, kid) => { const d = kid('F', 45, hd); kid('M', 40, hd); return d; });
        if (x.got !== x.want) bad.push('absolute: not the eldest child');
        x = run('male-preference', (hd, kid) => { kid('F', 45, hd); return kid('M', 40, hd); });
        if (x.got !== x.want) bad.push('male-preference: not the eldest son');
        x = run('agnatic', (hd, kid) => { const d = kid('F', 45, hd); kid('M', 20, d); return kid('M', 38, hd); });
        if (x.got !== x.want) bad.push("agnatic: a daughter's son inherited");
        x = run('male-preference', (hd, kid) => { const s = kid('M', 46, hd); s.alive = false; s.died = A.S.year - 2; const gs = kid('M', 22, s); kid('M', 40, hd); return gs; });
        if (x.got !== x.want) bad.push("a dead eldest son's son should come before his uncle");
      } finally { F.houseLaw = keep; }
      // a crown too: the realm's heir is the depth-first line
      const rr = Object.values(A.S.realms).find(z => z.alive !== false && z.gov === 'hereditary' && A.P(z.ruler));
      const ru = A.P(rr.ruler), s1 = A.newPerson({ sex: 'M', born: A.S.year - 40, race: ru.race, parents: [ru.id] }); ru.children.push(s1.id);
      const g1 = A.newPerson({ sex: 'M', born: A.S.year - 15, race: ru.race, parents: [s1.id] }); s1.children.push(g1.id);
      const s2 = A.newPerson({ sex: 'M', born: A.S.year - 30, race: ru.race, parents: [ru.id] }); ru.children.push(s2.id);
      s1.alive = false; s1.died = A.S.year - 1; rr.heirLocked = null;
      const heir = A.pickHeir(rr);
      if (!heir || heir.id !== g1.id) bad.push(`crown: ${heir ? heir.given : 'nobody'} instead of the dead heir's son`);
      return bad;
    });
    return { ok: !r.length, detail: r.join('; ') || 'absolute, male-preference, agnatic and depth-first lines hold for houses and crowns' };
  },

  // one holder per title (crowns, house headships, lordships) over 30 seeds and 10 years each; grants never land on a
  // held province
  async v2fOneHolder(pg) {
    const r = await pg.evaluate(() => {
      const bad = [], F = A.V2F; let moves = 0, years = 0;
      const kill = A.kill; A.kill = function (p) { const h = p && p.alive && p.house && A.S.houses[p.house]; const was = h && h.headPid === p.id; const res = kill.apply(this, arguments); if (was && h.headPid !== p.id) moves++; return res; };
      const ST = ['noble', 'royal', 'gentry', 'peasant', 'merchant'];
      try {
        for (let i = 0; i < 30; i++) {
          T.enter({ seed: 9000 + i, status: ST[i % 5], startAge: 24 });
          const pc = A.pc();
          // three grants of a lordship in the realm: none may take a held province
          for (let k = 0; k < 3; k++) { const p = A.newPerson({ sex: 'M', born: A.S.year - 30, race: 'human', realm: pc.realm, home: pc.home }); p.noble = { rung: 4, realm: pc.realm, holding: F.freeHolding(pc.realm, pc.home, p) }; }
          const a0 = F.audit(); if (a0.length) bad.push(`seed ${9000 + i} at start: ${JSON.stringify(a0[0])}`);
          T.play(10, { each: () => { years++; const a = F.audit(); if (a.length && bad.length < 8) bad.push(`seed ${9000 + i} in ${A.S.year}: ${JSON.stringify(a[0])}`); } });
        }
      } finally { A.kill = kill; }
      return { bad, moves, years };
    });
    return { ok: !r.bad.length && r.moves > 0, detail: r.bad.slice(0, 4).join('; ') || `no title with two holders in ${r.years} checks over 30 seeds; ${r.moves} headships passed by law` };
  },
};
