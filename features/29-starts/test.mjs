// Starting stories: every story starts the life it promises, opens with its scene, and comes back years later.
export default {
  async startsAll(pg) {
    const r = await pg.evaluate(() => {
      const out = [];
      for (const s of A.STARTS) {
        const o = Object.assign({ seed: 900 + out.length, sex: 'F' }, s.cr, { story: s.id });
        A.newGame(o);
        const pc = A.pc(), q = A.S.queue.find(x => x.type === 'event' && x.ev === 'st_' + s.id + '_open');
        const bad = [];
        if (pc.race !== s.cr.race) bad.push('race ' + pc.race);
        if (pc.realm !== s.cr.realm) bad.push('realm ' + pc.realm);
        if (pc.status !== s.cr.status) bad.push('status ' + pc.status);
        if (!q) bad.push('no opening');
        let text = '', nChoices = 0;
        if (q) {
          A.S.queue = [q].concat(A.S.queue.filter(x => x !== q));
          const v = A.eventView(q); text = v.text; nChoices = v.choices.length;
          if (T.raw.test(v.text) || v.choices.some(c => T.raw.test(c.t))) bad.push('raw token');
          if (v.choices.length < 2) bad.push('choices ' + v.choices.length);
          A.eventChoose(0); const res = A.S.queue[0] && A.S.queue[0].result;
          if (!res || !res.text || T.raw.test(res.text)) bad.push('result');
          A.eventClose && A.eventClose();
        }
        // the callback: move the story's start back in time and see that its echo is eligible
        const echo = A.EV['st_' + s.id + '_echo'];
        for (const k of Object.keys(pc.flags)) if (k.startsWith('st_' + s.id)) pc.flags[k] -= 16;
        const age0 = pc.born; pc.born -= 16;
        let eligible = false; try { eligible = !!echo && !!echo.cond(pc, A.C); } catch (e) { bad.push('echo cond ' + e.message); }
        pc.born = age0;
        if (!eligible) bad.push('echo not eligible');
        out.push({ id: s.id, bad, words: text.split(/\s+/).length, nChoices });
      }
      return out;
    });
    const bad = r.filter(x => x.bad.length);
    return { ok: r.length === 20 && !bad.length, detail: `${r.length} stories; ${bad.length ? 'problems: ' + bad.map(x => x.id + ' (' + x.bad.join(', ') + ')').join('; ') : 'all open, resolve and come back'}; longest opening ${Math.max(...r.map(x => x.words))} words` };
  },

  async startsCreateScreen(pg) {
    const r = await pg.evaluate(() => {
      UI.A.newLife();
      UI.step = 0; UI.render();
      const html0 = document.getElementById('app').innerHTML;
      const listed = A.STARTS.every(s => html0.includes(UI.esc(s.title).replace(/&#39;/g, "'")) || document.getElementById('app').textContent.includes(s.title));
      UI.A.crStory('widow');
      const c = UI.cr, set = c.race === 'human' && c.realm === 'POL-04' && c.status === 'merchant' && c.sex === 'F' && c.startAge === 24;
      const summary = document.getElementById('app').textContent.includes("The Widow's Books");
      // changing the rank clears the story
      const kept = A.storyFor(c) === 'widow'; c.status = 'peasant'; const cleared = A.storyFor(c) === null; c.status = 'merchant';
      UI._newLifeOk = true; UI.startLife(); UI._newLifeOk = false;
      const pc = A.pc(), opened = A.S.queue.some(q => q.ev === 'st_widow_open'), flagged = pc.flags.st_widow != null;
      return { listed, set, summary, kept, cleared, opened, flagged, coin: pc.coin };
    });
    return { ok: r.listed && r.set && r.summary && r.kept && r.cleared && r.opened && r.flagged, detail: JSON.stringify(r) };
  },

  async startsDeterministic(pg) {
    const r = await pg.evaluate(() => {
      const run = () => { A.newGame(Object.assign({ seed: 4242 }, A.STARTS[17].cr, { story: A.STARTS[17].id })); T.play(2); return T.hash(A.S); };
      return run() === run();
    });
    return { ok: r, detail: r ? 'the same story and seed give the same life' : 'two runs differ' };
  },
};
