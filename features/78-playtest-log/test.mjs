// A short playtest through the real buttons: start it from the Menu, answer events, open tabs, raise an error, then
// download the results file and read the session log inside it. The same clicks with and without the log give the
// same game.
const SESSION = async (pg, logOn) => {
  await pg.evaluate(on => {
    T.enter({ seed: 4411, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 18 });
    if (on) { UI.A.playtest(); UI.render(); }
  }, logOn);
  const clicks = [];
  for (let i = 0; i < 6; i++) {
    // let time run until an event is on screen, then answer it by clicking its first choice
    await pg.evaluate(() => { for (let g = 0; g < 40 && !(A.S.queue[0] && A.S.queue[0].type === 'event'); g++) { A.advance(30); while (A.S.queue[0] && A.S.queue[0].type !== 'event') A.S.queue.shift(); } UI.render(); UI.renderModal(); });
    // in-page clicks: the same click event a player's tap sends, without waiting on layout
    const did = await pg.evaluate(() => {
      const out = [], click = sel => { const el = document.querySelector(sel); if (el) { el.click(); out.push(el.getAttribute('data-a')); } };
      click('button[data-a="evChoose"]'); click('[data-a="evClose"]');
      const tabs = [...document.querySelectorAll('[data-a="tab"]')]; if (tabs.length) { const t = tabs[out.length % tabs.length]; t.click(); out.push('tab'); }
      return out;
    });
    clicks.push(...did);
  }
  return clicks;
};

export default {
  async plSessionInFile(pg, errs) {
    await SESSION(pg, true);
    await pg.evaluate(() => { console.error('playtest-log test: a reported fault'); });
    // finish the playtest's tasks the quick way (skip them), so its bar shows "Download results"
    await pg.evaluate(() => { for (let i = 0; i < 12; i++) { const s = document.querySelector('#ptbar [data-a="ptSkip"]'); if (!s) break; s.click(); } });
    const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 15000 }), pg.evaluate(() => document.querySelector('#ptbar [data-a="ptSave"]').click())]);
    const fs = await import('node:fs');
    const out = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
    const s = out.session || {};
    for (let i = errs.length - 1; i >= 0; i--) if (/playtest-log test/.test(errs[i])) errs.splice(i, 1);
    const ev = (s.events || [])[0] || {};
    const ok = out.kind === 'ardan-playtest' && s.actions > 5 && (s.events || []).length >= 3 && ev.ev && ev.label && ev.read >= 0 &&
      Object.keys(s.tabs || {}).length >= 1 && (s.errors || []).some(e => /a reported fault/.test(e.msg)) && s.stoppedAt && s.stoppedAt.screen === 'game';
    return { ok, detail: `results file: ${out.results.length} tasks; session ${s.secs}s, ${s.actions} controls used (${Object.entries(s.counts || {}).map(([k, n]) => k + ' ' + n).join(', ')}); ${(s.events || []).length} events answered, first ${ev.ev} "${ev.label}" read ${ev.read}s; tabs ${JSON.stringify(s.tabs)}; ${(s.errors || []).length} errors logged; stopped at ${JSON.stringify(s.stoppedAt)}` };
  },

  // the log only watches: the same clicks give the same game with it on and with it off
  async plPure(pg) {
    await SESSION(pg, false);
    const off = await pg.evaluate(() => T.hash(A.S) + ':' + JSON.stringify(A.rngState));
    await pg.reload(); await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
    const { HELPERS } = await import('../../tests/helpers.mjs'); await pg.evaluate(HELPERS);
    const clicks = await SESSION(pg, true);
    const on = await pg.evaluate(() => { const L = UI.ptLog; return T.hash(A.S) + ':' + JSON.stringify(A.rngState) + '|' + L.acts.length; });
    const [h, n] = on.split('|');
    return { ok: h === off && +n > 0, detail: `${clicks.length} clicks; state and random stream with the log ${h === off ? 'the same as' : 'DIFFERENT from'} without it; ${n} actions logged` };
  },
};
