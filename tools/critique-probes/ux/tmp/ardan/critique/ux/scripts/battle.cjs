// Find an attack prompt the way 99997's test does, then play the battle through the real UI. node battle.cjs <w> <h>
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
const [W, H] = [+process.argv[2], +process.argv[3]];
const rec = async (page, name, full = false) => { const m = await shot(page, name, { full }); console.log(m.name, 'words', m.wordsView, '/', m.wordsPage, 'inter', m.interactiveInView, '/', m.interactive, 'small44', m.smallTargets44, 'title', m.titleAttrs, 'tt', m.ttTriggers, 'screens', m.screens); return m; };
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, W, H, { touch: W < 800 });
  await page.evaluate(HELPERS);
  const r = await page.evaluate(() => {
    const drain = () => { let h, n = 0; while ((h = A.S.queue[0]) && n++ < 200) { if (/^(Attack|Under attack) at/.test(h.title || '')) return; if (h.type === 'event') { try { A.eventAuto(); } catch (e) { A.S.queue.shift(); } } else A.S.queue.shift(); } };
    for (let seed = 1; seed <= 9; seed++) {
      A.newGame({ seed: 7300 + seed, race: 'human', realm: ['POL-01', 'POL-02', 'POL-03'][seed % 3], status: 'peasant', sex: 'M', startAge: 22 });
      const pc = A.pc(), me = pc.realm, en = A.neighbors(me)[seed % 2];
      if (!en) continue;
      A.startWar(me, en, null, 'conquest'); A.enlist(pc); pc.mil.rank = [0, 2, 5][seed % 3];
      for (let d = 0; d < 240 && pc.alive; d++) {
        A.advance(1);
        const q = A.S.queue.find(x => x.type === 'choice' && /^(Attack|Under attack) at/.test(x.title || ''));
        if (q) { A.S.queue = [q]; UI.screen = 'game'; UI.ov = null; UI.tab = 'life'; UI.render(); return { seed, rank: pc.mil.rank, d, title: q.title, text: q.text, opts: q.options.map(o => o.label || o.t) }; }
        drain();
      }
    }
    return null;
  });
  console.log('prompt', JSON.stringify(r));
  if (!r) { await browser.close(); return; }
  await page.waitForTimeout(800);
  await rec(page, 'battle-0-prompt', true);
  for (let step = 0; step < 16; step++) {
    const st = await page.evaluate(() => { const m = document.querySelector('#modal'); return m && m.innerText.trim() ? { text: m.innerText.replace(/\n+/g, ' / ').slice(0, 900), acts: [...m.querySelectorAll('[data-a]')].map(e => e.getAttribute('data-a') + '=' + (e.getAttribute('data-v') || '') + '=' + e.innerText.replace(/\s+/g, ' ').slice(0, 50)) } : null; });
    if (!st) { console.log('no modal at step', step, await page.evaluate(() => A.S.queue.slice(0, 3).map(x => x.type))); break; }
    console.log('STEP', step, '\n  TEXT:', st.text, '\n  ACTS:', st.acts.slice(0, 12).join(' | '));
    const pick = st.acts.find(a => /^(qChoice|v2wChoose|mChoose|evChoose|bStep)=/.test(a)) || st.acts.find(a => /^(v2wClose|bClose|qClose|evClose|closeOv|continue|mClose)=/.test(a));
    if (!pick) break;
    const [a, v] = pick.split('=');
    await page.evaluate(([a, v]) => { const e = [...document.querySelectorAll(`#modal [data-a="${a}"]`)].find(x => (x.getAttribute('data-v') || '') === v); e && e.click(); }, [a, v]);
    await page.waitForTimeout(1200);
    await rec(page, `battle-${step + 1}`, true);
  }
  console.log('errors', page.errs);
  await browser.close();
})();
