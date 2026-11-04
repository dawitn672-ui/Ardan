// 98-feedback: an action that only wrote to the log now says so on screen
export default {
  async fbMenuToggles(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 77, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 }); UI.screen = 'game'; UI.set.hints = false; A.S.queue = []; UI.ov = null; UI.render();
      UI.A.menu(); const opened = !!(UI.ov && UI.ov.type === 'menu');
      UI.A.menu(); const closed = !UI.ov;
      UI.ov = { type: 'bigmap' }; UI.renderModal();
      const pressed = [...document.querySelectorAll('[data-a="gmMode"]')].map(b => b.dataset.v + ':' + b.getAttribute('aria-pressed'));
      UI.ov = null; UI.renderModal();
      return { opened, closed, pressed };
    });
    const ok = r.opened && r.closed && r.pressed.filter(x => x.endsWith(':true')).length === 1;
    return { ok, detail: `menu opens ${r.opened}, a second click closes it ${r.closed}; map modes ${r.pressed.join(', ')}` };
  },
  async fbEnlistSays(pg) {
    const r = await pg.evaluate(async () => {
      const run = async (k, on) => {
        A.newGame({ seed: 77, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
        UI.screen = 'game'; UI.set.hints = false; A.S.queue = []; UI.ov = null; UI.tab = 'life'; UI.render();
        const t = document.getElementById('toast'); if (t) { t.textContent = ''; t.classList.remove('show'); }
        const f = on ? UI.A.act : (UI.A.act._orig || null);
        UI.A.act(k);
        await new Promise(res => setTimeout(res, 50));
        return { toast: (document.getElementById('toast') || {}).textContent || '', hash: JSON.stringify(A.S).length, rng: JSON.stringify(A.rngState) };
      };
      const out = {};
      for (const k of ['enlist', 'merc', 'crime_burgle', 'tournament']) out[k] = await run(k, true);
      return out;
    });
    const ok = /oath/.test(r.enlist.toast) && /oath|articles/.test(r.merc.toast) && r.crime_burgle.toast.length > 0 && /fee/.test(r.tournament.toast);
    return { ok, detail: Object.entries(r).map(([k, v]) => `${k}: "${v.toast.slice(0, 70)}"`).join('; ') };
  },
  async fbPure(pg) {
    const r = await pg.evaluate(() => {
      const go = () => { A.newGame({ seed: 91, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 }); UI.screen = 'game'; UI.set.hints = false; A.S.queue = []; UI.render(); };
      go(); const before = JSON.stringify(A.rngState);
      UI.A.act('enlist');
      const withFb = JSON.stringify(A.S), rngA = JSON.stringify(A.rngState);
      go(); A.doActivity('enlist'); UI.refresh();
      return { same: JSON.stringify(A.S) === withFb, rng: JSON.stringify(A.rngState) === rngA, moved: before !== rngA };
    });
    return { ok: r.same && r.rng, detail: `the game after enlisting through the button and directly: same ${r.same}, random stream same ${r.rng}` };
  },
};
