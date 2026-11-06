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

  // playtest 1, #14: the house panel never shows a head its own law forbids, and a passed-over line says why
  async v2fLawPanelTrue(pg) {
    const r = await pg.evaluate(() => {
      const F = A.V2F, bad = [];
      T.enter({ seed: 41, status: 'noble', realm: 'POL-03', startAge: 20 });
      const pc = A.pc(), h = A.S.houses[pc.house], keep = h.headPid;
      // a woman at the head of a house whose drawn law is agnatic: the law, not the head, gives way
      const ids = Object.keys(A.S.houses).filter(id => !F.royalRealmOf(id));
      const ag = ids.find(id => A.V2.succession.makeHouseLaw(F.rng('law|' + id)).law === 'agnatic');
      if (ag) {
        const hh = A.S.houses[ag], k0 = hh.headPid, w = A.newPerson({ sex: 'F', born: A.S.year - 50, race: 'human', house: ag });
        hh.headPid = w.id;
        if (F.houseLaw(ag).law === 'agnatic') bad.push('an agnatic house is headed by a woman');
        if (F.audit().some(x => x.k === 'law')) bad.push('the audit finds a law the head breaks');
        hh.headPid = k0;
      } else bad.push('no agnatic house to try');
      // disinherited: the panel gives the reason and the year
      pc.flags.disinherited = A.S.year - 2;
      const txt = F.lineCard(pc);
      if (!/passed over: you were cut out of the inheritance in \d+/.test(txt) && h && A.P(h.headPid) && h.headPid !== pc.id) bad.push('no reason given: ' + txt.replace(/<[^>]+>/g, ' ').slice(0, 200));
      delete pc.flags.disinherited; h.headPid = keep;
      // no man of the family carries a woman's occupation word, nor a woman a man's
      for (const id of Object.keys(pc.rel)) { const q = A.P(id); if (q && ((q.sex !== 'F' && q.occ === 'a lady of the house') || (q.sex === 'F' && q.occ === 'a lord'))) bad.push(`${q.given} (${q.sex}) is "${q.occ}"`); }
      return bad;
    });
    return { ok: !r.length, detail: r.join('; ') || 'an agnatic house never keeps a woman at its head; "passed over" says why and when; occupation words follow sex' };
  },

  // playtest 2, new #9: orc full siblings were each "of Clan" something else ("Tarn of Clan Gholruk / Ozrak of Clan
  // Hrogul / Brak of Clan Mukhoth", parents Zardak and Ozhgar, you Kozrak). A child takes a parent's clan by the law:
  // the father's where the crown goes to sons or to either, the mother's where it goes to daughters (the Tusk Clans);
  // you, your elder siblings, the brothers and sisters born later and the father's brothers all share one clan
  async v2fClanByLaw(pg) {
    const r = await pg.evaluate(() => {
      const bad = [], rows = [], clan = q => (/^of Clan (.+)$/.exec(q.sur || '') || [])[1] || null;
      for (const [seed, realm] of [[4242, 'POL-01'], [4243, 'POL-11'], [4244, 'POL-34'], [4245, 'POL-34']]) {
        T.enter({ seed, race: 'orc', realm, status: 'artisan', sex: seed % 2 ? 'F' : 'M', startAge: 18 });
        const pc = A.pc(), fa = A.AKIN ? A.AKIN.parent(pc, 'M') : A.P(pc.parents[0]), mo = A.AKIN ? A.AKIN.parent(pc, 'F') : A.P(pc.parents[1]);
        if (pc.surMode !== 'deed') { bad.push(`${seed}: an orc artisan named in ${pc.surMode} mode`); continue; }
        const female = A.realm(pc.realm).law === 'female', want = clan(female ? mo : fa);
        // two brothers or sisters born now, by the game's own birth
        const n0 = mo.children.length;
        for (let i = 0; i < 2; i++) { const ch = A.chance; A.chance = () => true; try { A.birth(mo, fa, true, true); } finally { A.chance = ch; } }
        const sibs = [...new Set([...fa.children, ...mo.children])].map(A.P).filter(q => q && q.id !== pc.id);
        const born = mo.children.length - n0;
        const unc = (fa.parents || []).map(A.P).filter(Boolean).flatMap(g => g.children).map(A.P).filter(q => q && q.id !== fa.id && q.sex !== 'F');
        const off = [pc, ...sibs].filter(q => clan(q) !== want).map(q => `${q.given} ${q.sur}`);
        if (off.length || pc.flags.clan !== want) bad.push(`${seed} ${realm}: want Clan ${want} (${female ? "mother's" : "father's"}); off: ${off.join(', ') || 'flag ' + pc.flags.clan}`);
        const uoff = unc.filter(q => clan(q) !== clan(fa)).map(q => q.given + ' ' + q.sur);
        if (uoff.length) bad.push(`${seed}: the father's brothers ${uoff.join(', ')} not of Clan ${clan(fa)}`);
        // the grandparent the law runs through has the parent's clan, on both sides
        for (const par of [fa, mo]) {
          const g = (par.parents || []).map(A.P).find(q => q && (q.sex === 'F') === female);
          if (g && clan(g) !== clan(par)) bad.push(`${seed}: ${par.given} of Clan ${clan(par)}, but ${female ? 'mother' : 'father'} ${g.given} ${g.sur}`);
        }
        if (!born) bad.push(`${seed}: no child born`);
        rows.push(`${realm} (${female ? 'through the mother' : 'through the father'}): father ${fa.sur}, mother ${mo.sur}, you and ${sibs.length} siblings (${born} born now) ${want}`);
      }
      // the release's draw is still made: the stream after a name is the same as before the fix
      T.enter({ seed: 4250, race: 'orc', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 18 });
      const pc = A.pc(), s0 = A.rngState;
      const a = A.familyName({ cult: pc.cult, realm: pc.realm, status: 'artisan', father: A.P(pc.parents[0]), mother: A.P(pc.parents[1]), sex: 'M' });
      const s1 = A.rngState; A.rngState = s0;
      const ch = A.familyName({ cult: pc.cult, realm: pc.realm, status: 'artisan', sex: 'M' });
      if (A.rngState !== s1) bad.push('naming a child with parents draws differently from naming one without');
      if (a.clan !== clan(A.P(pc.parents[0]))) bad.push(`familyName with parents gave Clan ${a.clan}`);
      void ch;
      return { bad, rows };
    });
    return { ok: !r.bad.length, detail: (r.bad.length ? 'BAD: ' + r.bad.slice(0, 5).join('; ') + '. ' : '') + r.rows.join('; ') };
  },

  // playtest 1, #15: one coherent label: "best friend" in words, no "Enemy" beside a warm opinion, one lover, one superior
  async v2fOneLabel(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 42, status: 'peasant', sex: 'M', startAge: 30 });
      const pc = A.pc(), bad = [], mk = (sex, g) => A.newPerson({ sex, born: pc.born, race: 'human', given: g });
      const L = (x) => A.relLabel(x, pc.rel[x.id]);
      const bf = mk('M', 'Bram'); A.link(pc, bf, 'bestfriend', 70, 'bestfriend');
      if (L(bf) !== 'Best friend') bad.push(`best friend reads "${L(bf)}"`);
      const en = mk('M', 'Hesk'); A.link(pc, en, 'enemy', 60, 'enemy');
      if (/^Enemy/.test(L(en))) bad.push(`a warm enemy reads "${L(en)}"`);
      const a = mk('F', 'Ada'), b = mk('F', 'Bet');
      A.link(pc, a, 'lover', 50, 'lover'); pc.rel[a.id].since = A.S.year - 3;
      A.link(pc, b, 'lover', 50, 'lover'); pc.rel[b.id].since = A.S.year;
      const lov = [a, b].filter(x => L(x) === 'Lover').length;
      if (lov !== 1) bad.push(`${lov} people read "Lover"`);
      const s1 = mk('M', 'Sup1'), s2 = mk('M', 'Sup2');
      A.link(pc, s1, 'superior', 20, 'subordinate'); A.link(pc, s2, 'superior', 20, 'subordinate');
      const cur = A.superior ? A.superior(pc) : null;
      const sups = [s1, s2].filter(x => /^Your superior/.test(L(x))).length;
      if (sups > (cur && [s1, s2].includes(cur) ? 1 : 0)) bad.push(`${sups} people read "your superior"`);
      // a death told of someone else takes their pronoun
      const g = mk('F', 'Gran'); g.born = A.S.year - 90;
      let n = 0; for (let i = 0; i < 200; i++) { const c = A.naturalCause(g); if (/your sleep/.test(c)) n++; }
      if (n) bad.push(`${n} of 200 causes say "your sleep" of a grandmother`);
      return { bad, words: [L(bf), L(en), L(a), L(b)].join(' / ') };
    });
    return { ok: !r.bad.length, detail: r.bad.join('; ') || r.words };
  },
};
