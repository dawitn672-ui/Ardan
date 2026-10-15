// Realm bibles: every realm has a want, a fear, a place and three customs; each kind of custom fires at its moment and
// does what it says; the first meeting is a scene and later ones are applied; the card only reads.
import { BOT } from '../../bench/bot.mjs';

const SETUP = () => {
  window.RBT = {
    life(seed, o) {
      A.newGame(Object.assign({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 }, o || {}));
      const pc = A.pc(); pc.coin = 1000; pc.prison = null; A.S.queue = []; return pc;
    },
    // a test bible for the player's realm with one custom of each given kind; fx coin -1 marks each application
    bible(rid, list) {
      const keep = A.BIBLE_DATA[rid];
      A.BIBLE_DATA[rid] = { want: 'test', fear: 'test', place: { name: 'P', text: 'T' }, customs: list.map((c, i) => Object.assign({
        id: 'tst_' + c.kind + i, name: 'Test ' + c.kind, rule: 'R', text: 'Scene {w1}.', fx: { coin: -1 }, keepT: 'Keep', keep: 'Kept.',
        defy: { t: 'Defy', r: 'Defied.', fx: { honor: -5 } }, log: 'Met {got}{child}{cut}.' }, c)) };
      return () => { A.BIBLE_DATA[rid] = keep; };
    },
    drain() { let h, g = 0; const seen = []; while ((h = A.headReady()) && g++ < 80) { if (h.type === 'event') { seen.push(h.ev); A.eventChoose(0); A.eventClose(); } else A.skipPrompt(); } return seen; },
    lines(re) { return A.S.log.flatMap(e => e.lines || []).map(l => l[0]).filter(t => re.test(t)); },
  };
};

export default {
  async bibleComplete(pg) {
    const r = await pg.evaluate(() => {
      const bad = [], kinds = {}, words = Object.keys(A.BIBLE_WORDS || {}).length;
      let customs = 0;
      for (const R of Object.values(LORE.realms)) {
        const D = A.BIBLE.of(R.id);
        if (!D || !D.want || !D.fear || !D.place || (D.customs || []).length !== 3) { bad.push(R.id); continue; }
        for (const c of D.customs) { customs++; kinds[c.kind] = (kinds[c.kind] || 0) + 1; if (!A.BIBLE.KINDS.includes(c.kind)) bad.push(c.id); }
      }
      return { realms: Object.keys(LORE.realms).length, bad, kinds, customs, words };
    });
    return { ok: !r.bad.length && r.customs === 102 && r.words >= 24, detail: `${r.realms} realms, ${r.customs} customs, ${r.words} cultures with words; kinds ${JSON.stringify(r.kinds)}${r.bad.length ? '; BAD ' + r.bad.join(',') : ''}` };
  },

  // all 102 scenes render from a life in their own realm: no raw token, at most 80 words, labels at most 12 words
  async everySceneRenders(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const bad = [], words = s => (String(s).match(/\S+/g) || []).length;
      let n = 0;
      for (const R of Object.values(LORE.realms)) {
        RBT.life(4000 + +R.id.slice(4), { race: R.race, realm: R.id });
        const pc = A.pc();
        for (const c of A.BIBLE.of(R.id).customs) {
          if (c.kind === 'grave') { if (/\{\w+\}/.test(A.BIBLE.fill(pc, c.log))) bad.push(c.id + ' log'); continue; }
          const q = { type: 'event', ev: 'rb_custom', forced: true, ctx: { cid: c.id, got: '12 suns', estate: '60 suns', parent: 'Old Tam', child: 'Ada', dowry: '20 suns', paid: '20 suns', cut: '2 suns' } };
          A.S.queue = [q]; const v = A.eventView(q); n++;
          const all = [v.title, v.text].concat(v.choices.map(x => x.t));
          if (v.skip) bad.push(c.id + ' skipped');
          if (all.some(x => /\{\w+\}/.test(x))) bad.push(c.id + ' token');
          if (words(v.text) > 80) bad.push(c.id + ' long');
          if (v.choices.length !== 2 || v.choices.some(x => words(x.t) > 12)) bad.push(c.id + ' choices');
          A.eventChoose(1); const res = A.S.queue[0].result.text; if (/\{\w+\}/.test(res) || !res) bad.push(c.id + ' result');
          A.S.queue = [];
        }
      }
      return { n, bad };
    });
    return { ok: r.n >= 90 && !r.bad.length, detail: `${r.n} scenes rendered and defied; ${r.bad.length ? 'BAD ' + r.bad.slice(0, 8).join(', ') : 'no raw token, none over 80 words, every label 12 words or fewer'}` };
  },

  // the first time is a scene; keeping applies the custom, defying costs what the custom says; later it is applied quietly
  async firstMeetingIsAScene(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const run = (seed, idx) => {
        const pc = RBT.life(seed), undo = RBT.bible(pc.realm, [{ kind: 'ward', when: 'any', every: 1 }]);
        try {
          const c0 = pc.coin, h0 = pc.honor;
          A.BIBLE.month(pc);
          const q = A.S.queue.find(x => x.ev === 'rb_custom');
          A.S.queue = [q]; A.headReady(); const v = A.eventView(q);
          A.eventChoose(idx); const res = q.result.text; A.eventClose();
          const after1 = { coin: pc.coin - c0, honor: pc.honor - h0, defied: !!pc.rb.tst_ward0.defied };
          A.S.year++; A.BIBLE.month(pc);
          return { title: v.title, text: v.text, choices: v.choices.map(c => c.t), res, after1, second: pc.coin - c0, queued: A.S.queue.length, n: pc.rb.tst_ward0.n, line: RBT.lines(/Test ward/)[0] };
        } finally { undo(); }
      };
      return { keep: run(301, 0), defy: run(302, 1) };
    });
    const k = r.keep, d = r.defy;
    const ok = k.title === 'Test ward' && !/\{w1\}/.test(k.text) && k.choices.join() === 'Keep,Defy' && k.after1.coin === -1 && k.after1.honor === 0 &&
      d.after1.coin === 0 && d.after1.honor < 0 && d.after1.defied && k.second === -2 && k.queued === 0 && k.n === 2 && /Met/.test(k.line || '') && !/\{/.test(k.line || '');
    return { ok, detail: `scene "${k.title}: ${k.text}" [${k.choices.join(' / ')}]; keep: coin ${k.after1.coin}; defy: coin ${d.after1.coin}, honor ${d.after1.honor}; a year later applied without a scene (coin ${k.second}, met ${k.n}×): "${k.line}"` };
  },

  // each kind fires at its own moment
  async everyKindFires(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = {};
      const pc = RBT.life(401, { status: 'artisan' });
      const undo = RBT.bible(pc.realm, [
        { kind: 'year', m: 3, who: 'adult' }, { kind: 'rite', age: 21, who: 'all' }, { kind: 'wed', dowry: -1 }, { kind: 'mourn', share: 'equal' },
        { kind: 'name', by: 'grandparent' }, { kind: 'levy', who: 'adult' }, { kind: 'law' }, { kind: 'ward', when: 'armed' },
        { kind: 'market', cut: 0.1 }, { kind: 'grave' }]);
      const met = id => !!(pc.rb && pc.rb[id]);
      try {
        const mo = A.monthOf, mm = { m: 3 };
        A.monthOf = () => mm; A.BIBLE.month(pc); A.monthOf = mo; out.year = met('tst_year0');
        pc.born -= 1; A.BIBLE.month(pc); out.rite = met('tst_rite1') && A.age(pc) === 21;
        // wed: a bride price instead of a dowry
        const sp = A.newPerson({ given: 'Edda', sex: 'F', race: 'human', realm: pc.realm, cult: pc.cult, faith: pc.faith, born: A.S.year - 20, status: 'merchant', home: pc.home });
        const c0 = pc.coin; A.marry(pc, sp); out.wed = met('tst_wed2') && pc.coin < c0; out.wedPaid = c0 - pc.coin;
        // name: the child is named for the player's father
        const fa = A.P(pc.parents[0]); const k = A.birth(sp, pc, false, true);
        out.name = met('tst_name4'); out.named = k ? (k.sex === fa.sex ? k.given === fa.given : true) : false; out.child = k && k.given;
        // mourn: an equal share of the father's estate
        const c1 = pc.coin; A.kill(fa, 'age'); out.mourn = met('tst_mourn3'); out.share = pc.coin - c1 + 1;   // the custom's own fx is coin -1
        // levy
        const en = A.neighbors(pc.realm)[0]; A.startWar(pc.realm, en, null, 'conquest'); pc.mil = null; A.BIBLE.month(pc); out.levy = met('tst_levy5');
        const n1 = pc.rb.tst_levy5.n; A.BIBLE.month(pc); out.levyOnce = pc.rb.tst_levy5.n === n1;
        // law
        A.punish(pc, 'theft'); out.law = met('tst_law6');
        // ward
        pc.gear.weapon = 'sword'; A.BIBLE.month(pc); out.ward = met('tst_ward7');
        // market
        A.cargo(pc).grain = 5;
        const c2 = pc.coin; try { A.sellGood('grain', 2); } catch (e) {} out.market = met('tst_market8'); out.sold = pc.coin - c2;
        // grave
        A.kill(pc, 'age'); out.grave = met('tst_grave9');
      } finally { undo(); }
      return out;
    });
    const want = ['year', 'rite', 'wed', 'mourn', 'name', 'levy', 'law', 'ward', 'market', 'grave'];
    const miss = want.filter(k => !r[k]);
    const ok = !miss.length && r.named && r.levyOnce && r.share > 0;
    return { ok, detail: `fired: ${want.filter(k => r[k]).join(', ')}${miss.length ? '; MISSING ' + miss.join(', ') : ''}. Bride price paid ${r.wedPaid}; the child named ${r.child} (for a grandparent: ${r.named}); the father's estate shared: ${r.share}; the levy once a war: ${r.levyOnce}; sold for ${r.sold} after the market's cut` };
  },

  // who takes a parent's estate follows the custom
  async sharesFollowTheLaw(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = RBT.life(501, { status: 'merchant' }), fa = A.P(pc.parents[0]);
      const sib = (sex, dy) => { const s = A.newPerson({ given: 'Sib', sex, race: 'human', realm: pc.realm, cult: pc.cult, faith: pc.faith, born: pc.born + dy, status: pc.status, home: pc.home, parents: pc.parents.slice() }); fa.children.push(s.id); return s; };
      sib('M', -3); sib('F', 2);   // an elder brother, a younger sister
      const est = A.BIBLE.estate(fa), out = { est };
      for (const s of ['eldest', 'eldestSon', 'youngest', 'daughters', 'equal', 'temple', 'lord']) out[s] = A.BIBLE.share(pc, fa, s);
      return out;
    });
    const ok = r.eldest === 0 && r.eldestSon === 0 && r.youngest === 0 && r.daughters === 0 && r.equal === Math.round(r.est / 3) && r.temple < r.equal && r.lord === 0;
    return { ok, detail: `a middle son of three, estate ${r.est}: eldest ${r.eldest}, eldest son ${r.eldestSon}, youngest ${r.youngest}, daughters ${r.daughters}, equal ${r.equal}, after the temple's tenth ${r.temple}, to the lord ${r.lord}` };
  },

  async cardPureAndEscaped(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = RBT.life(601);
      const undo = RBT.bible(pc.realm, [{ kind: 'year', m: 0, name: '<img src=x>', rule: 'R <b>' }, { kind: 'ward', when: 'any' }, { kind: 'grave' }]);
      try {
        pc.rb = { tst_ward1: { n: 2, y: A.S.year, first: A.S.year - 1 } };
        UI.TAB.realm(pc);
        const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState);
        const h = UI.TAB.realm(pc);
        return { same: JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0, img: /<img src=x>/.test(h), card: /The ways of/.test(h), met: /met 2×/.test(h) };
      } finally { undo(); }
    });
    return { ok: r.same && !r.img && r.card && r.met, detail: JSON.stringify(r) };
  },

  // the real bibles: a commoner of each of eight realms meets its customs in the first years of a life
  async realLivesMeetCustoms(pg) {
    await pg.evaluate(BOT);
    const r = await pg.evaluate(() => {
      const out = [];
      for (const [rid, race] of [['POL-01', 'human'], ['POL-03', 'human'], ['POL-06', 'elf'], ['POL-10', 'dwarf'], ['POL-11', 'orc'], ['POL-18', 'human'], ['POL-20', 'human'], ['POL-23', 'giant']]) {
        const L = B.life({ seed: 7100 + +rid.slice(4), race, realm: rid, status: 'peasant', sex: 'M', startAge: 16 }, 'careful', true, 30);
        const pc = A.P(A.S.pc) || {}, mine = A.BIBLE.of(rid).customs.map(c => c.id), rb = pc.rb || {};
        out.push({ rid, years: L.years, met: mine.filter(id => rb[id]).length, scenes: Object.values(rb).length });
      }
      return out;
    });
    const two = r.filter(x => x.met >= 2).length;
    return { ok: two >= 6, detail: `${two} of ${r.length} thirty-year lives met at least 2 of their realm's customs: ${r.map(x => `${x.rid} ${x.met} (${x.years}y)`).join(', ')}. bench/customs.mjs measures all 34 realms` };
  },
};
