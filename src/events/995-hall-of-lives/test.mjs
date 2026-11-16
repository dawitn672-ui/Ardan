// 995-hall-of-lives: lives kept in the browser, the shelf, the death line, the Dynasty tab, the stories it opens.
export default {
  async hallKeepsLives(pg) {
    const r = await pg.evaluate(() => {
      localStorage.removeItem(UI.HALL.KEY);
      const pure = [];
      for (let i = 0; i < 3; i++) {
        T.enter({ seed: 900 + i, race: ['human', 'orc', 'dwarf'][i], realm: ['POL-01', 'POL-34', 'POL-28'][i], status: 'peasant', startAge: 20 + i * 10 });
        T.play(1);
        if (i === 1) A.ach('first_blood');
        A.pcDeath(['a fever', 'wounds taken in battle', 'old age'][i]);
        A.pcDeath('a second death');   // the same life, never counted twice
        const rng0 = A.rngState, h0 = T.hash(A.S);
        UI.deathModal(); UI.screen = 'title'; UI.render(); UI.screen = 'game'; UI.tab = 'legacy'; UI.render();
        pure.push(A.rngState === rng0 && T.hash(A.S) === h0);
      }
      const H = UI.HALL.read(), t = UI.HALL.totals();
      // a new game wipes the save's own collection (28 keeps it in A.S), the Hall keeps it
      A.newGame({ seed: 950, race: 'human', realm: 'POL-01', status: 'peasant', startAge: 20 });
      const saveEndings = Object.keys(A.S.endings || {}).length;
      UI.screen = 'game'; UI.tab = 'legacy'; UI.render();
      const leg = document.getElementById('app').textContent;
      // the Hall is never in the save
      const inSave = /ardan\.hall|hl-shelf/.test(A.serialize());
      return { n: H.n, lives: H.lives.length, ach: H.lives[1].ach, t, pure, saveEndings, leg: /Across your 3 lives in this browser/.test(leg), inSave };
    });
    const ok = r.n === 3 && r.lives === 3 && r.ach.includes('first_blood') && r.t.lives === 3 && r.t.ach >= 1 && r.pure.every(Boolean) && r.saveEndings === 0 && r.leg && !r.inSave;
    return { ok, detail: `${r.n} lives kept (${r.lives} listed), endings ${r.t.endings}, achievements ${r.t.ach}; a new save's own endings ${r.saveEndings}, the Hall's shown on the Dynasty tab ${r.leg}; render pure ${r.pure.join(',')}; in the save ${r.inSave}` };
  },

  async hallNotOnReplay(pg) {
    const r = await pg.evaluate(() => {
      localStorage.removeItem(UI.HALL.KEY);
      A.J = null; A.journalStart();
      T.enter({ seed: 4321, race: 'human', realm: 'POL-01', status: 'peasant', startAge: 30 });
      T.play(1);
      A.pcDeath('a fever');
      const after = UI.HALL.read().n, J = JSON.parse(JSON.stringify(A.J));
      const res = A.replay(J);
      return { after, replayed: res.ok, why: res.why, again: UI.HALL.read().n };
    });
    return { ok: r.after === 1 && r.again === 1, detail: `after the death ${r.after}; after replaying the journal (${r.replayed ? 'ok' : r.why}) ${r.again}` };
  },

  async hallShelfEscaped(pg) {
    const r = await pg.evaluate(() => {
      const bad = '<img src=x data-pwn=1>';
      localStorage.setItem(UI.HALL.KEY, JSON.stringify({ v: 1, n: 2, endings: { cut_short: 1, '<x>': 3 }, manners: {}, ach: {},
        lives: [{ k: 'a', name: bad + 'Edda', realm: 'POL-01', realmName: bad, born: 1100, died: 1120, ending: 'cut_short', color: 'red;background:url(x)', seed: 'x' }, 'junk'] }));
      UI.screen = 'title'; UI.render();
      const el = document.querySelector('.hl-shelf');
      return { shelf: !!el, img: !!document.querySelector('[data-pwn]'), text: el ? el.textContent : '', style: el ? el.innerHTML.includes('url(x)') : null };
    });
    return { ok: r.shelf && !r.img && !r.style && r.text.includes('Edda') && r.text.includes('Cut Short'), detail: `shelf drawn ${r.shelf}; markup ran ${r.img}; bad colour kept ${r.style}; text "${r.text.slice(0, 90)}"` };
  },

  async hallOpensStories(pg) {
    const r = await pg.evaluate(() => {
      localStorage.removeItem(UI.HALL.KEY);
      const shown = () => { UI.ensureWorld && UI.ensureWorld(); UI.cr = UI.crDefaults(); UI.step = 0; UI.screen = 'create'; UI.render(); return !!document.querySelector('[data-a="crStory"][data-v="hl_beggar"]'); };
      const before = shown();
      UI.A.crStory('hl_beggar'); const pickedShut = UI.cr.story === 'hl_beggar';
      localStorage.setItem(UI.HALL.KEY, JSON.stringify({ v: 1, n: 3, endings: {}, manners: {}, ach: {}, lives: [] }));
      const after = shown();
      const tag = !!document.querySelector('[data-v="hl_beggar"] .hl-tag');
      UI.A.crStory('hl_beggar');
      const story = A.storyFor(UI.cr);
      // a life from the story, and its journal replayed with the Hall empty again: the same life
      A.J = null; A.journalStart();
      A.newGame(Object.assign({}, UI.cr, { seed: 77, story }));
      const head = A.S.queue.find(q => q.ev === 'st_hl_beggar_open');
      A.eventView && head && A.S.queue[0] === head && A.eventAuto();
      const want = T.hash(JSON.parse(A.serialize())), J = JSON.parse(JSON.stringify(A.J));
      localStorage.removeItem(UI.HALL.KEY);
      const res = A.replay(J);
      return { before, pickedShut, after, tag, story, opened: !!head, replay: res.ok && T.hash(JSON.parse(A.serialize())) === want };
    });
    return { ok: !r.before && !r.pickedShut && r.after && r.tag && r.story === 'hl_beggar' && r.opened && r.replay,
      detail: `shut before: shown ${r.before}, pickable ${r.pickedShut}; after three lives: shown ${r.after} (tagged New ${r.tag}); story ${r.story}, opening queued ${r.opened}; replay without the Hall identical ${r.replay}` };
  },
};
