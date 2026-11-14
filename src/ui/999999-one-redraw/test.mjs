// 999999-one-redraw: one full redraw a press, cards drawn alone, the story log kept in place, a line while a life starts.
// The press timings themselves are tools/bench/press-gate.mjs (CPU budgets on the committed saves).
const PRESS = () => {
  // a Next month press as a player makes it: the button, each card's first choice and its Close, until the step ends
  window.__rdPress = async () => {
    const R = UI.REDRAW, f0 = R.full, l0 = R.lite, sleep = ms => new Promise(r => setTimeout(r, ms));
    let cards = 0, g = 0, ran = false;
    UI.A.v2Next();
    for (; g < 4000; g++) {
      // the press ends with its step: small cards that waited for the step's end (B6) are read afterwards, each its own
      // click with its own draw, and are not this press's (a world where one waits met two full draws here, A2 merge)
      if (UI.stepper.run) ran = true; else if (ran) break;
      const q = A.S.queue[0], m = document.querySelector('#modal');
      if (q && m && q.type === 'event') {
        const b = q.result ? m.querySelector('[data-a="evClose"]') : m.querySelector('button[data-a="evChoose"]:not([disabled]):not([aria-disabled="true"])');
        if (b) { if (!q.result) cards++; b.click(); } else { A.eventAuto(); UI.refresh(); }
      } else if (q && m) { A.skipPrompt(); UI.refresh(); }
      else if (UI.stepper.run && UI.stepper.wait) UI.stepGo();
      else if (!UI.stepper.run) break;
      await sleep(q ? 0 : 4);
    }
    const out = { cards, full: R.full - f0, lite: R.lite - l0 };
    // then the cards left waiting are answered, outside the press's count
    for (let k = 0; k < 200 && A.S.queue.length; k++) { const q = A.S.queue[0]; if (q.type === 'event') { if (!q.result) A.eventAuto(); A.eventClose(); } else A.skipPrompt(); }
    UI.refresh();
    return out;
  };
};

export default {
  async rdOnePerPress(pg) {
    await pg.evaluate(PRESS);
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 4417, race: 'human', realm: 'POL-02', status: 'noble', sex: 'F', startAge: 17 });
      A.S.queue.length = 0; UI.render();
      const out = [];
      for (let i = 0; i < 8; i++) out.push(await __rdPress());
      return out;
    });
    const cards = r.reduce((a, x) => a + x.cards, 0);
    const ok = r.every(x => x.full === 1) && cards > 0 && r.filter(x => x.cards).every(x => x.lite >= 1);
    return { ok, detail: r.map(x => `${x.cards} card${x.cards === 1 ? '' : 's'}: ${x.full} full, ${x.lite} card-only`).join('; ') + (cards ? '' : ' (no card met: the card path was not tried)') };
  },
  async rdLogInPlace(pg) {
    await pg.evaluate(PRESS);
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 912, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      A.S.queue.length = 0; UI.render();
      // three years of story, so the window (UI.LOG_YEARS) is full and "Show earlier years" is offered
      T.play(3); A.S.queue.length = 0; UI.render();
      const lines0 = [...document.querySelectorAll('#log .ll')], first = lines0[lines0.length - 1];
      const years0 = document.querySelectorAll('#log .ly').length, more = !!document.querySelector('#log [data-a="logAll"]');
      let kept = true, grew = 0;
      for (let i = 0; i < 4; i++) {
        const n0 = document.querySelectorAll('#log .ll').length, year0 = A.S.year;
        await __rdPress();
        const n1 = document.querySelectorAll('#log .ll').length;
        if (A.S.year === year0 && !first.isConnected) kept = false;   // within the same years, nodes stay
        grew += Math.max(0, n1 - n0);
      }
      // the in-place log reads exactly as a log drawn whole
      // (both after 99993-v2-stats' sweep, which rewords numbers in whatever is put on the page)
      const inPlace = document.getElementById('log').textContent;
      document.getElementById('logwrap').innerHTML = UI.renderLogWrap();
      await new Promise(r => setTimeout(r, 0));
      const whole = document.getElementById('log').textContent;
      return { years0, more, kept, grew, same: inPlace === whole, logYears: A.S.log.length };
    });
    const ok = r.years0 <= 2 && r.more && r.kept && r.same;
    return { ok, detail: `${r.years0} years in the page of ${r.logYears}, earlier years ${r.more ? 'on demand' : 'NOT OFFERED'}; lines ${r.kept ? 'kept' : 'REDRAWN'} (+${r.grew}); in place ${r.same ? 'reads as drawn whole' : 'DIFFERS from a whole draw'}` };
  },
  async rdStartLine(pg) {
    // a real press of "Begin" shows the line before the world is made, and takes it away after
    await pg.evaluate(() => {
      window.__rdSaw = false;
      new MutationObserver(() => { if (document.getElementById('rd-start')) window.__rdSaw = true; }).observe(document.body, { childList: true });
      UI.screen = 'title'; UI.render();
    });
    // the creation screen as a player goes through it (71-phone's tasks.mjs does the same)
    for (const sel of ['[data-a=newLife]', '[data-a=randomizeCr]', '[data-a=crStep][data-v="3"]']) { const b = await pg.$(sel); if (b) await b.click(); }
    const btn = await pg.$('[data-a="startLife"]');
    if (!btn) return { ok: true, skip: 'no Begin button on the creation screen' };
    await btn.click();
    await pg.waitForFunction(() => UI.screen === 'game' && !document.getElementById('rd-start'), null, { timeout: 60000 });
    const saw = await pg.evaluate(() => window.__rdSaw);
    return { ok: saw, detail: saw ? 'the line was up while the world was made, and gone after' : 'NO LINE while the world was made' };
  },
};
