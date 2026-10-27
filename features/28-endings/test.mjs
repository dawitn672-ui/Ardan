// Endings: every death gets a named ending and manner, an epilogue, and a place in the collection.
export default {
  async endingsNamed(pg) {
    const r = await pg.evaluate(() => {
      const cases = [];
      const mk = (o, prep, cause) => { A.newGame(Object.assign({ seed: 50 + cases.length, race: 'human', realm: 'POL-01', sex: 'M', startAge: 30 }, o));
        const pc = A.pc(); prep(pc); pc.cause = cause; return A.endingOf(pc); };
      cases.push(['dust_to_throne', mk({ status: 'peasant' }, pc => { pc.wasRuler = true; }, 'old age')]);
      cases.push(['crowned', mk({ status: 'noble' }, pc => { pc.wasRuler = true; }, 'a fever')]);
      cases.push(['chains', mk({ status: 'artisan' }, pc => { pc.prison = { y: A.S.year }; }, 'the flux')]);
      cases.push(['keeper', mk({ status: 'artisan' }, pc => { for (let i = 0; i < 4; i++) pc.flags['rl_k_' + LORE.secrets[i].id] = A.S.year; }, 'wounds taken in battle')]);
      cases.push(['cut_short', mk({ status: 'peasant', startAge: 19 }, pc => { pc.fame = 10; }, 'the Great Ash Dragon')]);
      cases.push(['unremembered', mk({ status: 'peasant' }, pc => { pc.fame = 0; pc.children = []; }, 'a fight with a drunk')]);
      const manners = cases.map(c => c[1].manner);
      return { cases: cases.map(([want, got]) => [want, got.id]), manners };
    });
    const bad = r.cases.filter(([w, g]) => w !== g);
    const wantM = ['age', 'sickness', 'sickness', 'battle', 'beast', 'duel'];
    const badM = r.manners.filter((m, i) => m !== wantM[i]);
    return { ok: !bad.length && !badM.length, detail: `endings ${JSON.stringify(r.cases)}; manners ${r.manners.join(', ')}` };
  },

  async endingsDeathScreen(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 61, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 40 });
      T.play(3);
      const pc = A.pc(); pc.fame = 30; pc.deeds.push({ y: A.S.year, t: 'Held the bridge at Ashford with 40 men' });
      A.pcDeath('a fever');
      const S = A.S, d = S.deadList[S.deadList.length - 1];
      const rng0 = JSON.stringify(S.rng), h0 = T.hash(S);
      const html = UI.deathModal();
      const pure = JSON.stringify(S.rng) === rng0 && T.hash(S) === h0;
      const div = document.createElement('div'); div.innerHTML = html; const txt = div.textContent;
      UI.screen = 'game'; UI.tab = 'legacy'; UI.render(); const leg = document.getElementById('app').textContent;
      const logged = JSON.stringify(S.log.slice(-2)).includes('Here the chronicler writes');
      const end = A.ENDINGS.find(e => e.id === pc.ending.id);
      return { ending: pc.ending, recorded: d.ending === pc.ending.id && S.endings[pc.ending.id] === S.year, shown: txt.includes(end.name) && txt.includes('What became of them'),
        lines: A.epilogue(pc), pure, legacy: new RegExp('Endings found \\(1/' + A.ENDINGS.length).test(leg), logged, raw: /\{[a-z]/.test(txt) };
    });
    return { ok: r.recorded && r.shown && r.pure && r.legacy && r.logged && !r.raw && r.lines.length >= 2,
      detail: `${JSON.stringify(r.ending)}; on the death screen ${r.shown}; render pure ${r.pure}; collected ${r.legacy}; logged ${r.logged}; epilogue: ${r.lines.join(' | ')}` };
  },

  async endingsVariety(pg) {
    // across real lives, the endings spread out instead of all landing on the fallback
    const r = await pg.evaluate(() => {
      const got = {};
      for (let s = 0; s < 6; s++) {
        A.newGame({ seed: 70 + s, race: 'human', realm: ['POL-01', 'POL-03', 'POL-13'][s % 3], status: ['peasant', 'artisan', 'noble'][s % 3], sex: s % 2 ? 'M' : 'F', startAge: 16 });
        T.play(60);
        const pc = A.pc(); if (pc.alive) A.pcDeath('old age');
        got[pc.ending.id] = (got[pc.ending.id] || 0) + 1;
      }
      return got;
    });
    const kinds = Object.keys(r).length;
    return { ok: kinds >= 3 && (r.plain || 0) <= 3, detail: JSON.stringify(r) };
  },
  // cycle 1 (lives B5, I8, visual B10): "a kick from a horse" read "as all things end"; a bishop on the council ended
  // "The Wealthy"; the gold "Your life is over…" bar showed under the obituary
  async endingsCycle1(pg) {
    const r = await pg.evaluate(() => {
      const mk = (cause, prep, age) => { A.newGame({ seed: 2801, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: age || 40 }); const pc = A.pc(); if (prep) prep(pc); pc.cause = cause; return A.endingOf(pc); };
      const manners = ['a kick from a horse', 'a wound gone bad', 'a bad tooth that poisoned the blood', 'a failing heart', 'a stroke'].map(c => [c, mk(c).manner]);
      const bishop = mk('old age', pc => { pc.job = { c: 'clergy', r: 3, y: 1100 }; pc.coin = 50000; pc.office = 'chaplain'; }, 59).id;
      const council = mk('old age', pc => { pc.coin = 50000; pc.office = 'treasurer'; }, 59).id;
      const rich = mk('old age', pc => { pc.coin = 50000; }, 59).id;
      T.enter({ seed: 2802, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 40 });
      A.pcDeath('a fever'); UI.render(); UI.renderModal();
      const bar = document.getElementById('agebar'), shown = bar ? getComputedStyle(bar).display : 'absent';
      const obit = !!document.querySelector('#modal .obit');
      return { manners, bishop, council, rich, bar: shown, obit };
    });
    const badM = r.manners.filter(([c, m]) => m === 'other');
    return { ok: !badM.length && r.bishop === 'shepherd' && r.council === 'council' && r.rich === 'rich' && r.obit && r.bar !== 'block' && r.bar !== 'flex',
      detail: `manners ${r.manners.map(x => x.join(' > ')).join('; ')}; bishop ${r.bishop}, councillor ${r.council}, merchant ${r.rich}; obituary open ${r.obit}, the bar beneath ${r.bar}` };
  },
};
