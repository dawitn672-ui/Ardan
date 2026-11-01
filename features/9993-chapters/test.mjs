// 9993-chapters: a chapter opens with each stage of life, its aims are checked and paid, it closes with a recap, the
// Life tab and the Book show it without changing anything, and a house's legacy passes to its heirs.
export default {
  async chpOpen(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 301, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 13 });
      const pc = A.pc();
      A.S.queue = [];
      A.CH.month(pc);
      const c = pc.chap && pc.chap.cur, q = A.S.queue.find(x => x.ev === 'chp_card');
      const v = q && A.eventView(q);
      const words = v ? String(v.text).split(/\s+/).length : 0;
      const third = c && c.aims[2] && c.aims[2].l, alt = c && c.alt && c.alt.l;
      // the second choice takes the other third aim
      if (q) { A.S.queue.splice(A.S.queue.indexOf(q), 1); A.S.queue.unshift(q); A.eventChoose(v.choices[1].i); A.eventClose(); }
      const swapped = pc.chap.cur.aims[2] && pc.chap.cur.aims[2].l;
      // drawing the Life tab and the Book changes nothing
      const h0 = T.hash(A.S), r0 = A.rngState;
      UI.tab = 'life'; UI.render(); const life = document.querySelector('#tabbody .chp-card');
      const lt = life ? life.textContent : '';
      UI.tab = 'book'; UI.render();
      const pure = T.hash(A.S) === h0 && A.rngState === r0;
      return { st: c && c.st, title: v && v.title, text: v && v.text, words, n: c && c.aims.length, third, alt, swapped, life: !!life, lt, pure, raw: v && T.raw.test(v.text + v.title + v.choices.map(x => x.t).join(' ')) };
    });
    const ok = r.st === 'youth' && /^Chapter One: /.test(r.title) && r.words <= 80 && r.n === 3 && r.alt && r.swapped === r.alt && r.life && r.lt.includes(r.swapped) && r.pure && !r.raw;
    return { ok, detail: `${r.title}: "${r.text}" (${r.words} words); third aim ${r.third} -> ${r.swapped}; Life card ${r.life}; pure ${r.pure}` };
  },

  async chpAims(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 302, race: 'human', realm: 'POL-01', status: 'merchant', sex: 'M', startAge: 25 });
      const pc = A.pc(), CH = A.CH;
      A.S.queue = []; CH.month(pc);
      const c = pc.chap.cur;
      // make the chapter's aims ones we can meet by hand: a purse and renown
      c.aims = [CH.mk(pc, CH.aim('coin')), CH.mk(pc, CH.aim('fame')), CH.mk(pc, CH.aim('travel'))];
      const coinT = c.aims[0].b.t, h0 = pc.happy;
      pc.coin = coinT + 1; CH.month(pc);
      const met0 = c.aims[0].d != null, said = A.S.log.some(e => (e.lines || []).some(l => /^Aim met: Put by/.test(l[0])));
      pc.fame = c.aims[1].b.t; c.aims[2].d = A.S.year; CH.month(pc);
      const all = c.aims.every(a => a.d != null);
      // eight years on, the next chapter of the prime: the last one closes with every aim met, set down as a deed
      c.y0 -= 8; A.S.queue = []; const deeds0 = pc.deeds.length; CH.month(pc);
      const past = pc.chap.past[pc.chap.past.length - 1], next = pc.chap.cur, q = A.S.queue.find(x => x.ev === 'chp_card');
      const v = q && A.eventView(q);
      return { met0, said, all, full: past && past.full, deed: pc.deeds.length > deeds0 && /every aim met/.test(pc.deeds[pc.deeds.length - 1].t), n: next && next.n, recap: v && v.text.split('.')[0] };
    });
    const ok = r.met0 && r.said && r.all && r.full && r.deed && r.n === 2 && /is closed: every aim met/.test(r.recap);
    return { ok, detail: `aim met and said ${r.met0}/${r.said}; all met ${r.all}; closed full ${r.full}, deed ${r.deed}; next chapter ${r.n}: "${r.recap}"` };
  },

  async chpStages(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 303, race: 'human', realm: 'POL-01', status: 'gentry', sex: 'M', startAge: 6 });
      const seen = [];
      T.play(14, { onEvent: v => { if (/^Chapter /.test(v.title)) seen.push(v.title); } });
      const pc = A.pc();
      return { seen, past: (pc.chap.past || []).map(c => c.st + ':' + c.t), cur: pc.chap.cur && pc.chap.cur.st, alive: pc.alive };
    });
    const sts = r.past.map(x => x.split(':')[0]);
    const ok = sts[0] === 'child' && sts.includes('youth') && r.cur && r.seen.length >= 3 && r.seen[0].startsWith('Chapter One');
    return { ok, detail: `cards ${r.seen.join(' / ')}; now ${r.cur}` };
  },

  async chpTitleCard(pg) {
    // the chapter card is a title card, not a scene card: the stage's print (a childhood's is play, not a wedding),
    // the title, the aims as a list, keys 1 and 2 choose, Enter begins; nothing lands in the Book for it
    await pg.evaluate(() => {
      T.enter({ seed: 311, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 6 });
      const pc = A.pc(); A.S.queue = []; A.CH.month(pc);
      const q = A.S.queue.find(x => x.ev === 'chp_card'); A.S.queue = [q];
      UI.render(); UI.renderModal();
    });
    const a = await pg.evaluate(() => { const m = document.querySelector('#modal .chp-title'); return m && { st: m.dataset.chp, sky: !!m.querySelector('.chp-sky svg'), h: (m.querySelector('.chp-h') || {}).textContent, aims: m.querySelectorAll('.chp-aimlist li').length, picks: m.querySelectorAll('button[data-a="evChoose"]').length, scene: !!document.querySelector('#modal .sc-card'), shape: A.CH.SHAPE.child }; });
    await pg.keyboard.press('2');
    await pg.waitForTimeout(300);
    const b = await pg.evaluate(() => ({ aims: document.querySelectorAll('#modal .chp-aimlist li').length, begin: !!document.querySelector('#modal .chp-title [data-a="evClose"]') }));
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(300);
    const c = await pg.evaluate(() => ({ gone: !A.S.queue.some(x => x.ev === 'chp_card'), alt: A.pc().chap.cur.aims[2] && A.pc().chap.cur.aims[2].l, book: A.S.log.flatMap(e => e.lines || []).some(l => /So it is written/.test(l[0])) }));
    const ok = a && a.st === 'child' && a.sky && a.shape === 'play' && a.h && a.aims === 2 && a.picks === 2 && !a.scene && b.aims === 3 && b.begin && c.gone && !c.book;
    return { ok, detail: `${JSON.stringify(a)}; after 2: ${b.aims} aims, Begin ${b.begin}; Enter closes ${c.gone}; a line in the Book ${c.book}` };
  },

  async chpSumsAndSpacing(pg) {
    const r = await pg.evaluate(() => {
      const CH = A.CH, nice = [137, 1247334, 6982391, 18].map(CH.nice);
      // a rich purse gets no purse aim; a poor one a round one
      T.enter({ seed: 321, race: 'human', realm: 'POL-01', status: 'merchant', sex: 'M', startAge: 30 });
      const pc = A.pc(); pc.coin = 2e6; A.S.queue = []; delete pc.chap; CH.month(pc);
      const rich = pc.chap.cur.aims.concat(pc.chap.cur.alt || []).map(a => a.l);
      pc.coin = 1234; const ca = CH.mk(pc, CH.aim('coin'));
      // an aim left unmet is not set again in the next chapter
      const c = pc.chap.cur, k0 = c.aims[0].k; c.aims.forEach((a, i) => { if (i) a.d = A.S.year; }); c.y0 -= 9; A.S.queue = []; CH.month(pc);
      const repeat = pc.chap.cur.aims.concat(pc.chap.cur.alt || []).some(a => a.k === k0);
      // every aim met: the next chapter opens a year on, whatever the stage
      const c2 = pc.chap.cur; c2.aims.forEach(a => { a.d = A.S.year - 1; }); A.S.queue = []; const n0 = pc.chap.n; CH.month(pc);
      const early = pc.chap.n === n0 + 1;
      // day one: the chapter card never comes in the same month as another scene
      T.enter({ seed: 2601, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      const d0 = A.absDay(), order = [];
      for (let g = 0; g < 400 && A.absDay() - d0 < 120; g++) {
        A.advance(400); let h, k = 0;
        while ((h = A.headReady()) && k++ < 50) { if (h.type === 'event') { order.push([A.absDay() - d0, h.ev]); A.eventAuto(); } else A.S.queue.shift(); }
      }
      const card = order.find(x => x[1] === 'chp_card'), amb = order.find(x => /^lfx_amb/.test(x[1])), pup = order.find(x => x[1] === 'ix_pup');
      return { nice, rich, ca: ca.l, repeat, early, card, amb, pup, order: order.slice(0, 6).map(x => x.join(' ')) };
    });
    const ok = r.nice.join() === '140,1300000,7000000,20' && !r.rich.some(l => /^Put by/.test(l)) && /Put by 1,900 suns|Put by 1900/.test(r.ca) && !r.repeat && r.early &&
      r.card && (!r.amb || r.card[0] - r.amb[0] >= 20) && (!r.pup || r.pup[0] >= 60);
    return { ok, detail: `rounded ${r.nice.join(', ')}; a 2,000,000-sun purse's aims: ${r.rich.join(' / ')}; at 1,234: "${r.ca}"; unmet aim set again ${r.repeat}; all met opens the next ${r.early}; day one: ${r.order.join(', ')}` };
  },

  async chpLegacy(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 304, race: 'human', realm: 'POL-01', status: 'gentry', sex: 'M', startAge: 40 });
      T.play(1);
      let pc = A.pc();
      // a child to go on as
      let kid = (pc.children || []).map(A.P).find(k => k && k.alive);
      // none born yet: adopt a young person of the realm as the heir
      if (!kid) { kid = Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && A.age(p) >= 10 && A.age(p) < 20 && p.realm === pc.realm); if (kid) { pc.children = (pc.children || []).concat([kid.id]); } }
      if (!kid || !A.S.dynasty) return { skip: true, why: !kid ? 'no young person' : 'no dynasty' };
      for (let i = 0; i < 4; i++) pc.deeds.push({ y: A.S.year, t: 'A deed for the house ' + i });
      A.S.queue = []; A.pcDeath('a fever');
      A.continueAs(kid.id);
      pc = A.pc();
      const q = A.S.queue.find(x => x.ev === 'chp_legacy');
      if (!q) return { queued: false, renown: A.CH.renown() };
      A.S.queue.splice(A.S.queue.indexOf(q), 1); A.S.queue.unshift(q);
      const v = A.eventView(q), k0 = q.ctx.lg0, coin0 = pc.coin, lit0 = pc.literate;
      A.eventChoose(v.choices[0].i); A.eventClose();
      const L = A.S.dynasty.legacies;
      return { queued: true, labels: v.choices.map(c => c.t), k0, L, text: v.text, raw: T.raw.test(v.text) };
    });
    if (r.skip) return { ok: false, detail: 'could not set up a succession: ' + r.why };
    const ok = r.queued && r.L && r.L.length === 1 && r.L[0].k === r.k0 && r.labels.length >= 2 && !r.raw;
    return { ok, detail: `legacy scene ${r.queued} (renown ${r.renown}); offered ${r.labels && r.labels.join(' / ')}; chosen ${JSON.stringify(r.L)}` };
  },
};
