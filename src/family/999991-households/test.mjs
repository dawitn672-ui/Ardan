// C6 households (docs/design/households.md, D-057; CRITIQUE §13 "Done when"): who you know at birth, how you met, no kin
// minted, one resolver for a house, the parish as seeds, nine months.
export const limits = { c6NoKinMinted: 3000 };
export default {
  // 42 starts: a commoner knows parents, living siblings and a grandparent only under the same roof (at most 8, no
  // uncle, cousin or in-law); a noble adds a nurse, a maid and a guard knight, and a tutor from six (at most 12)
  async c6Household42(pg) {
    const r = await pg.evaluate(() => {
      const F = A.V2F, bad = [], rows = [];
      const ST = ['peasant', 'serf', 'artisan', 'merchant', 'gentry', 'noble', 'royal'];
      let n = 0, roofs = 0, staffed = 0, maxC = 0, maxN = 0;
      for (const status of ST) for (let k = 0; k < 6; k++) {
        const seed = 3100 + n * 17, realm = 'POL-0' + (1 + (n % 5));
        T.enter({ seed, status, realm, startAge: 0, sex: n % 2 ? 'F' : 'M' }); n++;
        const pc = A.pc(), ids = Object.keys(pc.rel).filter(id => A.P(id));
        const noble = A.HH.NOBLE(pc), cap = noble ? 12 : 8;
        noble ? (maxN = Math.max(maxN, ids.length)) : (maxC = Math.max(maxC, ids.length));
        if (ids.length > cap) bad.push(`${seed} ${pc.status}: ${ids.length} known (cap ${cap})`);
        const fa = F.parentOf(pc, 'M'), mo = F.parentOf(pc, 'F');
        if (!fa || !pc.rel[fa.id] || !mo || !pc.rel[mo.id]) bad.push(`${seed}: a parent is not known`);
        for (const par of [fa, mo]) for (const id of (par && par.children) || []) { const c = A.P(id); if (c && c.alive && c.id !== pc.id && !pc.rel[id]) bad.push(`${seed}: a living sibling is not known`); }
        for (const id of ids) {
          const q = A.P(id), r0 = pc.rel[id], t = A.HH.typeOf(pc, q);
          if (['uncle', 'cousin', 'inlaw', 'nephew', 'grandchild'].includes(r0.type) || ['uncle', 'cousin', 'inlaw', 'nephew'].includes(t)) bad.push(`${seed}: born knowing a ${t || r0.type}`);
          if (t === 'grandparent') { roofs++; if (!(A.S.household.roof || []).includes(q.id)) bad.push(`${seed}: a grandparent not under the roof`); }
          if (!r0.met || !r0.met.by) bad.push(`${seed}: ${r0.type} without how they met`);
        }
        if (noble) {
          const st = A.S.household.staff || {};
          if (!st.nurse || !st.maid || !st.guard) bad.push(`${seed}: a noble household without a nurse, maid or guard knight`);
          else staffed++;
          if (st.tutor) bad.push(`${seed}: a tutor at birth`);
          for (const role of ['nurse', 'maid', 'guard']) { const q = A.P(st[role]); if (q && ['noble', 'royal'].includes(q.status)) bad.push(`${seed}: the ${role} is ${q.status}`); }
        }
        // the tree still holds the kin: grandparents, uncles and cousins exist, unmet
        if (!(fa.parents || []).length) bad.push(`${seed}: the tree lost the grandparents`);
      }
      // the tutor comes at six
      T.enter({ seed: 3333, status: 'noble', startAge: 0 });
      T.play(7);
      const tu = A.S.household.staff.tutor && A.P(A.S.household.staff.tutor);
      if (!tu || !A.pc().rel[tu.id]) bad.push('no tutor by seven');
      else rows.push(`tutor ${tu.given} (${A.relLabel(tu, A.pc().rel[tu.id])})`);
      return { bad, n, roofs, staffed, maxC, maxN, rows };
    });
    return { ok: !r.bad.length, detail: r.bad.slice(0, 5).join('; ') || `${r.n} births: commoners knew at most ${r.maxC}, nobles at most ${r.maxN}; ${r.roofs} grandparents under the roof; ${r.staffed} noble households with nurse, maid and guard knight; ${r.rows.join(', ')}` };
  },

  // every later entry records how you met (a reason, a place, a year); the person view says it
  async c6MetRecorded(pg) {
    const r = await pg.evaluate(() => {
      const bad = [], by = {};
      for (const [seed, status] of [[71, 'peasant'], [72, 'noble'], [73, 'artisan']]) {
        T.enter({ seed, status, startAge: 12 });
        const before = new Set(Object.keys(A.pc().rel));
        T.play(14);
        const pc = A.pc(); if (!pc) continue;
        for (const id of Object.keys(pc.rel)) {
          if (before.has(id)) continue;
          const m = pc.rel[id].met;
          if (!m || m.y == null || !m.by || m.at === undefined) bad.push(`${seed}: ${pc.rel[id].type} met ${JSON.stringify(m)}`);
          else by[m.by] = (by[m.by] || 0) + 1;
        }
        const any = Object.keys(pc.rel).find(id => pc.rel[id].met && !before.has(id));
        if (any) { const w = A.MEET.words(pc.rel[any].met); if (!/^Met .+, \d+\.$/.test(w)) bad.push('words: ' + w); }
      }
      return { bad, by };
    });
    const top = Object.entries(r.by).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v}`).join(', ');
    return { ok: !r.bad.length && Object.keys(r.by).length > 2, detail: r.bad.slice(0, 4).join('; ') || `every new entry says how: ${top}` };
  },

  // no event names kin who are not in the tree: in 12 worlds x 30 years no kin word is given to someone the tree does not
  // place (A.KIN.strays), and no blood relative is created after the start except by a birth (a story's secret, revealed
  // or recognised by the player, is counted apart)
  async c6NoKinMinted(pg) {
    const r = await pg.evaluate(() => {
      const F = A.V2F, ST = ['peasant', 'serf', 'artisan', 'merchant', 'gentry', 'noble', 'royal', 'peasant', 'artisan', 'noble', 'gentry', 'merchant'];
      const strays = [], minted = [], told = []; let years = 0;
      for (let i = 0; i < 12; i++) {
        T.enter({ seed: 9100 + i * 37, status: ST[i], startAge: i % 3 ? 0 : 14, sex: i % 2 ? 'F' : 'M' });
        const start = new Set(Object.keys(A.S.people)), y0 = A.S.year, seen = new Map();
        T.play(30, { each: () => {
          years++;
          const pc = A.pc(); if (!pc) return;
          const P = F.people();
          for (const id of Object.keys(pc.rel)) {
            if (start.has(id) || seen.has(id)) continue;
            const q = A.P(id); if (!q) continue;
            const k = F.kinOf(pc, q, P);
            if (!k || k.line === 'spouse' || k.line === 'in-law') continue;
            seen.set(id, { born: q.born, y: A.S.year, term: k.term, story: !!(q.flags && (q.flags.c6revealed || q.flags.c6recognized)) });
          }
        } });
        for (const s of A.KIN.strays) strays.push(`${ST[i]} ${s.y} ${s.word} (${s.ev || 'no scene'})`);
        for (const v of seen.values()) { if (v.born >= y0 || v.born >= v.y - 1) continue; (v.story ? told : minted).push(`${ST[i]} ${v.y}: a ${v.term} born ${v.born}`); }
      }
      return { strays, minted, told, years };
    });
    return { ok: !r.strays.length && !r.minted.length, data: r,
      detail: (r.strays.concat(r.minted)).slice(0, 5).join('; ') || `${r.years} months over 12 worlds x 30 years: no kin word for a stranger, no relative made; ${r.told.length} secret${r.told.length === 1 ? '' : 's'} a story told (${r.told.slice(0, 3).join(', ')})` };
  },

  // a scene that wants a relative the tree does not have drops; one the tree has is met then, with the scene as the reason
  async c6KinFromTree(pg) {
    const r = await pg.evaluate(() => {
      const bad = [];
      T.enter({ seed: 515, status: 'peasant', startAge: 24 });
      const pc = A.pc();
      const cz = A.KIN.list(pc, ['cousin']);
      if (!cz.length) return { skip: 'no cousin in this tree' };
      const q = A.MEET.as('lf_outlaw_cousin', () => A.KIN.take(pc, ['cousin']));
      if (!cz.includes(q)) bad.push('take gave someone outside the tree');
      if (!pc.rel[q.id] || pc.rel[q.id].met.by !== 'lf_outlaw_cousin') bad.push('the cousin was not met by the scene: ' + JSON.stringify(pc.rel[q.id]));
      // an only child: a sibling scene drops (setup throws), nobody is made
      T.enter({ seed: 516, status: 'peasant', startAge: 20 });
      const p2 = A.pc(); let threw = false; const n0 = Object.keys(A.S.people).length;
      for (const par of p2.parents.map(A.P)) par.children = par.children.filter(id => id === p2.id);
      try { A.KIN.take(p2, ['sibling']); } catch (e) { threw = true; }
      if (!threw) bad.push('a sibling was found for an only child');
      if (Object.keys(A.S.people).length !== n0) bad.push('a person was made');
      // the guard: a kin word for a stranger becomes an acquaintance, and is counted
      const x = A.newPerson({ sex: 'F', born: A.S.year - 20, race: 'human' });
      A.link(p2, x, 'sibling', 20, 'sibling');
      if (p2.rel[x.id].type !== 'acquaint' || !A.KIN.strays.length) bad.push('the guard let a stranger be a sister');
      return { bad };
    });
    if (r.skip) return { ok: true, skip: r.skip };
    return { ok: !r.bad.length, detail: r.bad.join('; ') || 'a cousin from the tree, met by the scene; an only child gets no sister; a stranger called sister is an acquaintance' };
  },

  // one resolver gives a house its head and heir; the post registry holds the same head; a death passes it by law
  async c6HouseResolver(pg) {
    const r = await pg.evaluate(() => {
      const bad = []; let checked = 0, passed = 0;
      for (const seed of [61, 62, 63]) {
        T.enter({ seed, status: 'noble', startAge: 20 });
        const each = () => {
          for (const hid of Object.keys(A.S.houses)) {
            const h = A.S.houses[hid], R = A.HOUSE.resolve(hid), hd = h.headPid && A.P(h.headPid);
            if (hd && hd.alive) {
              checked++;
              if (!R.head || R.head.id !== hd.id) bad.push(`${hid}: head ${hd.id} but the resolver says ${R.head && R.head.id}`);
              if (A.POSTS && A.POSTS.holder) { const ph = A.POSTS.holder(A.POSTS.houseKey(hid)); if (ph && ph !== hd.id) bad.push(`${hid}: the post says ${ph}`); }
              if (R.heir && (!R.heir.alive || R.heir.id === hd.id)) bad.push(`${hid}: a dead or self heir`);
            }
          }
        };
        each();
        // kill three heads: each passes to the heir the resolver named
        const heads = Object.keys(A.S.houses).map(id => [id, A.HOUSE.resolve(id)]).filter(([, R]) => R.head && R.heir && !R.head.ruler && R.head.id !== A.S.pc).slice(0, 3);
        for (const [hid, R] of heads) {
          A.kill(R.head, 'a test');
          const now = A.S.houses[hid].headPid;
          if (now !== R.heir.id) bad.push(`${hid}: passed to ${now}, the heir was ${R.heir.id}`); else passed++;
        }
        T.play(5, { each });
      }
      return { bad, checked, passed };
    });
    return { ok: !r.bad.length && r.passed >= 6, detail: r.bad.slice(0, 4).join('; ') || `${r.checked} house heads read the same from the record, the registry and the resolver; ${r.passed} deaths passed to the named heir` };
  },

  // the parish: seeds, the same from the seed, nothing stored until met; a commoner's acquaintances at home come from it
  async c6ParishSeeds(pg) {
    const r = await pg.evaluate(() => {
      const bad = [];
      T.enter({ seed: 808, status: 'peasant', startAge: 6 });
      const pc = A.pc(), prov = pc.home;
      const a = JSON.stringify(A.PARISH.seeds(prov)), b = JSON.stringify(A.PARISH.seeds(prov));
      if (a !== b) bad.push('seeds differ');
      if (A.PARISH.seeds(prov).length < 20) bad.push('a small parish');
      if (Object.keys((A.S.parish && A.S.parish.met) || {}).length) bad.push('a seed stored before it was met');
      const n0 = Object.keys(A.S.people).length, s0 = A.rngState;
      const kid = A.makeAcquaintance(pc, 'friend', true);
      if (!kid.flags.parish) bad.push('a child of the village was not of the parish');
      const met = A.S.parish.met; if (Object.keys(met).length !== 1) bad.push('the meeting was not kept');
      // the same seed in another world with the same seed gives the same person
      const name = A.fullName(kid);
      T.enter({ seed: 808, status: 'peasant', startAge: 6 });
      const again = A.makeAcquaintance(A.pc(), 'friend', true);
      if (A.fullName(again) !== name) bad.push(`not the same child: ${name} / ${A.fullName(again)}`);
      // a noble is not met by the parish
      T.enter({ seed: 809, status: 'noble', startAge: 20 });
      if (A.PARISH.acquaint(A.pc(), 'friend')) bad.push('a noble met the parish');
      void n0; void s0;
      return { bad, name };
    });
    return { ok: !r.bad.length, detail: r.bad.join('; ') || `the parish is seeds until met; a child of the village (${r.name}) is the same in every world from the seed` };
  },

  // births take nine months: a conception, then the child on its day, in any month; no birth on New Year's day alone
  async c6NineMonths(pg) {
    const r = await pg.evaluate(() => {
      const bad = [], days = [], gaps = [];
      // (H-082: four lives at least, and more, up to six, until five births are seen: the months are read off the births, and
      // how many a few couples have is the world's draw (about one a life here). Five births spread over the year fall in
      // fewer than three months about one time in a hundred; four, one in twenty)
      for (const seed of T.seedRun(91, 6)) {
        if (seed > 94 && days.length >= 5) break;
        T.enter({ seed, status: 'peasant', startAge: 18, sex: seed % 2 ? 'M' : 'F' });
        const pc = A.pc(), t = A.makeLoveInterest(pc); A.marry(pc, t);
        const conceived = new Map();
        // (S1b CI 139: at the yearly chance of one in five, four lives of twelve years gave one child in the shifted world and
        // three before it; the couple try for a child every year, so enough are born to read their months)
        T.play(12, { each: () => {
          for (const x of A.S.pregs || []) if (!conceived.has(x.m + '|' + x.due)) conceived.set(x.m + '|' + x.due, x);
          const p = A.pc(); if (!p) return;
          p.flags.tryChild = A.S.year;
          for (const id of p.children) { const c = A.P(id); if (c && !c._seen) { c._seen = 1; days.push(A.S.warClock || 0); } }
        } });
        for (const x of conceived.values()) gaps.push(x.due - x.c);
      }
      if (!days.length) bad.push('no child born');
      if (days.length && days.every(d => d <= 31)) bad.push('every birth in January');
      if (gaps.some(g => g < 262 || g > 280)) bad.push('a pregnancy not nine months: ' + gaps.join(','));
      // a mother with child does not conceive again
      T.enter({ seed: 95, status: 'peasant', startAge: 20, sex: 'F' });
      const me = A.pc(), h = A.makeLoveInterest(me); A.marry(me, h);
      A.conceive(me, h, 'own'); A.conceive(me, h, 'own');
      if ((A.S.pregs || []).filter(x => x.m === me.id).length !== 1) bad.push('two pregnancies at once');
      return { bad, days, gaps: gaps.length };
    });
    const months = new Set(r.days.map(d => Math.floor(d / 31))).size;
    return { ok: !r.bad.length && months >= 3, detail: r.bad.join('; ') || `${r.days.length} children born in ${months} different months; ${r.gaps} pregnancies, each 262-280 days` };
  },

  // an old save (no household, parish, pregs or met) loads and plays on
  async c6OldSave(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 77, status: 'noble', startAge: 10 });
      const S = A.S; delete S.household; delete S.parish; delete S.pregs;
      for (const id in A.pc().rel) delete A.pc().rel[id].met;
      void S;
      try { A.deserialize(A.serialize()); } catch (e) { return { bad: ['load: ' + e.message] }; }
      const out = T.play(3);
      return { bad: out === 'ok' || out === 'dead' ? [] : ['play: ' + out] };
    });
    return { ok: !r.bad.length, detail: r.bad.join('; ') || 'a save without households, parish, pregnancies or met loads and plays three years' };
  },
};
