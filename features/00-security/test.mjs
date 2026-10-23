// Browser tests for security. Each test gets (page, pageErrors, {browser, file}).
export default {
  async xssSave(pg) {
    // a hand-edited save must not be able to run script
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 5, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M' });
      T.play(1);
      const d = await SAVES.decode((await SAVES.encode(A.S, A.J)).bytes);
      const S2 = d.S, pay = n => `x"><img src=x data-pwn onerror="window.__pwned=(window.__pwned||0)+1;/*${n}*/">`;
      S2.log[S2.log.length - 1].lines.push(['harmless', pay('logclass'), null]);
      S2.log[S2.log.length - 1].year = pay('logyear');
      const r0 = Object.values(S2.realms)[0]; r0.color = `#fff;" data-x="${pay('color')}`;
      window.__pwned = 0;
      try { await UI.loadGame((await SAVES.encode(S2, null)).bytes); } catch (e) {}
      for (const t of T.tabs()) { UI.tab = t; try { UI.render(); } catch (e) {} }
      await new Promise(res => setTimeout(res, 800));
      return { pwned: window.__pwned, injected: document.querySelectorAll('img[data-pwn]').length, screen: UI.screen };
    });
    return { ok: !r.pwned && !r.injected, detail: `script ran ${r.pwned}x, ${r.injected} injected elements, screen ${r.screen}` };
  },

  async csp(pg, errs) {
    // defence in depth: even if markup slips through, inline handlers must not run
    const r = await pg.evaluate(async () => {
      window.__csp = 0;
      document.body.insertAdjacentHTML('beforeend', '<img src="x" onerror="window.__csp=1">');
      await new Promise(res => setTimeout(res, 500));
      return { ran: window.__csp, meta: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]') };
    });
    // the block we just provoked is the point of the test, not a failure
    for (let i = errs.length - 1; i >= 0; i--) if (/inline event handler/.test(errs[i])) errs.splice(i, 1);
    return { ok: r.meta && !r.ran, detail: `CSP meta present: ${r.meta}; injected inline handler ran: ${!!r.ran}` };
  },
};
