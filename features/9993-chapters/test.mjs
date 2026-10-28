// 9993-chapters: a chapter opens with each stage of life, its aims are checked and paid, it closes with a recap, the
// Life tab and the Book show it without changing anything, and a house's legacy passes to its heirs.
export default {
  async chpOpen(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 301, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 13 });
      const pc = A.pc();
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
      CH.month(pc);
      const c = pc.chap.cur;
      // make the chapter's aims ones we can meet by hand: a purse and renown
      c.aims = [CH.mk(pc, CH.aim('coin')), CH.mk(pc, CH.aim('fame')), CH.mk(pc, CH.aim('travel'))];
      const coinT = c.aims[0].b.t, h0 = pc.happy;
      pc.coin = coinT + 1; CH.month(pc);
      const met0 = c.aims[0].d != null, said = A.S.log.some(e => (e.lines || []).some(l => /^Aim met: Have/.test(l[0])));
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
