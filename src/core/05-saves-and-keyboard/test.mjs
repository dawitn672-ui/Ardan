// Browser tests for saves and keyboard. Each test gets (page, pageErrors, {browser, file}).
export default {
  async keyboard(pg) {
    // every clickable thing is reachable by keyboard, Enter opens it, and focus survives the running clock
    await pg.evaluate(() => { UI.screen = 'title'; UI.render(); });
    await pg.click('text=Random life');
    await pg.waitForTimeout(300);
    await pg.evaluate(() => { UI.tab = 'people'; UI.refresh(); });
    await pg.waitForTimeout(100);
    const unreachable = await pg.$$eval('#app [data-a]:not(button):not(a):not(input):not(select):not(textarea):not(option)', els => els.filter(e => !e.hasAttribute('tabindex')).length);
    const card = await pg.$('#tabbody [data-a="ov"]');
    let opened = false;
    if (card) { await card.focus(); await pg.keyboard.press('Enter'); await pg.waitForTimeout(200); opened = await pg.evaluate(() => !!(UI.ov && document.querySelector('#modal'))); await pg.keyboard.press('Escape'); }
    // focus a control in the tab body, run the clock past several redraws, see where focus is
    await pg.evaluate(() => { UI.tab = 'life'; UI.refresh(); });
    const btn = await pg.$('#tabbody button');
    let kept = null;
    if (btn) {
      const key = await btn.evaluate(b => b.getAttribute('data-a') + '|' + b.getAttribute('data-v'));
      await btn.focus();
      await pg.evaluate(() => UI.clkToggle && UI.clkToggle());
      await pg.waitForTimeout(4000);
      await pg.evaluate(() => UI.clk && UI.clk.on && UI.clkToggle());
      kept = await pg.evaluate(k => { const a = document.activeElement; return a === document.body ? 'body' : (a.getAttribute('data-a') + '|' + a.getAttribute('data-v')) === k ? 'same' : (a.id || a.tagName); }, key);
    }
    return { ok: unreachable === 0 && (!card || opened) && kept !== 'body', detail: `${unreachable} clickable elements unreachable by Tab; Enter on a person card ${card ? (opened ? 'opens it' : 'does NOTHING') : '(no card)'}; focus after 4 s of clock: ${kept}` };
  },

  async saveSafety(pg) {
    // a failed autosave speaks up; a new life over a living save asks first
    const r = await pg.evaluate(async () => {
      UI.screen = 'title'; UI.render();
      UI.A.randomLife(); await UI.save(false); await new Promise(res => setTimeout(res, 300));
      SAVES.listCache = await SAVES.list();
      const toasts = [], t0 = UI.toast; UI.toast = (m) => { toasts.push(m); };
      const put = SAVES.put; SAVES.put = async () => { throw new Error('QuotaExceededError'); };
      UI._saveWarn = 0; await UI.save(true);
      SAVES.put = put; UI.toast = t0;
      UI.ov = null; UI.screen = 'title'; UI.render();
      const pcBefore = A.S.pc;
      UI.A.randomLife();
      const asked = !!(UI.ov && UI.ov.type === 'confirm'), started = A.S.pc !== pcBefore;
      UI.ov = null; UI.renderModal && UI.renderModal();
      return { warned: toasts.some(m => /would not keep|not saving/.test(m)), asked, started };
    });
    return { ok: r.warned && r.asked && !r.started, detail: `failed autosave warns: ${r.warned}; new life over a living save asks first: ${r.asked}${r.started ? ' (but STARTED without asking)' : ''}` };
  },

  // two tabs of the same game must not both save
  async twoTabs(pg, errs, { browser, file }) {

    const ctx = await browser.newContext();
    const open = async () => { const p = await ctx.newPage(); await p.goto('file://' + file); await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 }); await p.waitForTimeout(400); return p; };
    const a = await open(), b = await open();
    const sa = await a.evaluate(async () => { A.newGame({ seed: 1 }); return (await SAVES.save(A.S, null)).ok; });
    const sb = await b.evaluate(async () => { A.newGame({ seed: 2 }); return (await SAVES.save(A.S, null)).ok; });
    await a.close(); await b.waitForTimeout(500);
    const sb2 = await b.evaluate(async () => (await SAVES.save(A.S, null)).ok);
    await ctx.close();
    return { ok: sa && !sb && sb2, detail: `first tab saves: ${sa}; second tab saves while the first is open: ${sb}; after the first closes: ${sb2}` };
  
  },
};
