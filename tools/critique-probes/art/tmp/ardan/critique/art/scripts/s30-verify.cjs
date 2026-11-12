const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  const { b, pg, errs } = await open(1366, 768);
  // 1) who is the bust on a scene card: play months until an event with a bust appears; report aria-label and ctx
  await enter(pg, { seed: 5150, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 16 });
  const out = [];
  for (let m = 0; m < 30 && out.length < 6; m++) {
    await pg.evaluate(() => { A.advance(30); });
    for (let k = 0; k < 3; k++) {
      const r = await pg.evaluate(() => {
        const h = A.headReady(); if (!h) return null;
        if (h.type !== 'event') { A.skipPrompt(); return 'skip'; }
        const v = A.eventView(h); UI.render();
        const card = document.querySelector('.sc-card, .scene, [class*="scene"]');
        const busts = [...document.querySelectorAll('#modal svg.portrait, .sc-bust svg, [class*="scene"] svg.portrait')].map(s => s.getAttribute('aria-label') || '(no label) w' + s.getAttribute('width'));
        const ctx = h.ctx || {}; const them = ctx.pid ? A.S.people[ctx.pid] : null;
        const res = { ev: h.ev || h.id, title: v && v.title, pid: ctx.pid, them: them ? them.given + ' ' + them.sex + ' ' + A.age(them) : null, busts, pc: A.pc().given };
        A.eventAuto(); return res;
      });
      if (!r) break; if (r !== 'skip' && r.busts && r.busts.length) out.push(r);
    }
  }
  console.log(JSON.stringify(out, null, 1));
  // 2) a v2 battle: does "A wound to the face" leave a wound?
  await enter(pg, { seed: 7311, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
  const w = await pg.evaluate(() => {
    const pc = A.pc(); const me = pc.realm; const en = A.neighbors(me)[0];
    A.enlist(pc); A.startWar(me, en, null, 'conquest');
    const res = [];
    for (let g = 0; g < 900 && res.length < 6; g++) {
      A.advance(3);
      let hh, k = 0;
      while ((hh = A.headReady()) && k++ < 50) {
        if (hh.type === 'choice' && (hh.options || []).some(o => o && o.fn === 'wsLine')) {
          const w0 = (A.pc().wounds || []).length;
          A.CHOICE_FN.wsLine(hh.options.find(o => o.fn === 'wsLine').arg); A.S.queue.shift && 0;
          const q = A.S.queue.find(x => x.type === 'v2battle');
          if (q) { for (let i = 0; i < 6 && !q.b.done; i++) A.V2W.choose(1); }
          const txt = q ? JSON.stringify(q.b.phases).slice(0, 2000) : '';
          const faceTxt = (txt.match(/wound[^"]{0,40}/gi) || []).slice(0, 4);
          if (q) { A.V2W.close(); }
          const idx = A.S.queue.indexOf(hh); if (idx >= 0) A.S.queue.splice(idx, 1);
          res.push({ faceTxt, w0, w1: (A.pc().wounds || []).map(x => x.k), alive: A.pc().alive });
          break;
        }
        if (hh.type === 'event') A.eventAuto(); else A.skipPrompt();
      }
      if (!A.pc().alive) break;
    }
    return res;
  });
  console.log(JSON.stringify(w, null, 0));
  console.log(errs);
  await b.close();
})();
