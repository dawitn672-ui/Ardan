// Press the real Next month button until event cards appear; screenshot cards with 3+ choices: node events.cjs <persona> <w> <h> <presses>
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
const fs = require('fs');
const [persona, W, H, N] = [process.argv[2], +process.argv[3], +process.argv[4], +(process.argv[5] || 24)];
const SETUP = {
  child: () => { T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 9 }); },
  noble: () => { T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); T.play(4); UI.screen = 'game'; UI.ov = null; UI.tab = 'life'; UI.render(); },
};
const SEL_OTHER = '.mbox [data-a="qChoice"], .mbox [data-a="mChoose"], .mbox [data-a="qClose"], .mbox [data-a="closeOv"], .mbox [data-a="cfYes"], .mbox [data-a="continue"]';
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, W, H);
  await page.evaluate(HELPERS);
  await page.evaluate(`(${SETUP[persona].toString()})()`);
  await page.waitForTimeout(500);
  const P = persona; let cards = 0, shots = 0; const times = []; const log = [];
  for (let i = 0; i < N; i++) {
    let guard = 0;
    while (guard++ < 6) {
      const card = await page.evaluate(() => {
        const ch = [...document.querySelectorAll('[data-a="evChoose"]')];
        const q = document.querySelector('.mbox, [role=dialog]');
        return { n: ch.length, text: q ? q.innerText.slice(0, 1600) : '' };
      });
      if (card.n) {
        cards++;
        log.push({ month: i, choices: card.n, text: card.text.replace(/\n+/g, ' / ') });
        if (card.n >= 3 && shots < 4) {
          shots++;
          const m = await shot(page, `${P}-card${shots}`, { full: true });
          console.log(m.name, 'words', m.wordsView, '/', m.wordsPage, 'inter', m.interactiveInView, 'small44', m.smallTargets44, 'title', m.titleAttrs, 'tt', m.ttTriggers);
          const risk = await page.$('.risk');
          if (risk && W > 800) { await risk.hover(); await page.waitForTimeout(700); await shot(page, `${P}-card${shots}-hover`); await page.mouse.move(5, 5); await page.waitForTimeout(500); }
        }
        const btns = await page.$$('[data-a="evChoose"]');
        await btns[0].click();
        await page.waitForTimeout(500);
        if (shots && shots <= 2) await shot(page, `${P}-card${shots}-result`);
        const c = await page.$('[data-a="evClose"]');
        if (c) { await c.click(); await page.waitForTimeout(300); }
        continue;
      }
      const other = await page.evaluate((sel) => { const b = document.querySelector(sel); return b ? b.getAttribute('data-a') + ':' + ((document.querySelector('.mbox') || {}).innerText || '').slice(0, 300).replace(/\n+/g, ' / ') : null; }, SEL_OTHER);
      if (other) {
        log.push({ month: i, prompt: other });
        if (shots < 6) await shot(page, `${P}-prompt-${i}`);
        await page.evaluate((sel) => { const b = document.querySelector(sel); if (b) b.click(); }, SEL_OTHER);
        await page.waitForTimeout(300);
        continue;
      }
      break;
    }
    // wait for the month to finish running or a card to show
    await page.waitForFunction(() => document.querySelector('[data-a="v2Next"]') || document.querySelector('#modal [data-a]'), null, { timeout: 30000 }).catch(() => {});
    const hasModal = await page.evaluate(() => !!document.querySelector('#modal [data-a="evChoose"], #modal [data-a="evClose"]'));
    if (hasModal) { i--; continue; }
    const nb = await page.$('[data-a="v2Next"]');
    if (!nb) { const st = await page.evaluate(() => ({ q: A.S.queue.slice(0, 2).map(x => x.type), modal: !!document.querySelector('#modal'), acts: [...document.querySelectorAll('#modal [data-a]')].map(e => e.getAttribute('data-a')).slice(0, 8) })); console.log('no next button at', i, JSON.stringify(st)); if (st.acts.length) { await page.evaluate(() => { const b = document.querySelector('#modal [data-a]:not([data-a="report"]):not([data-a="hintDone"])'); b && b.click(); }); await page.waitForTimeout(400); i--; continue; } break; }
    const t0 = Date.now();
    await nb.click();
    await page.waitForFunction(() => document.querySelector('[data-a="v2Next"]') || document.querySelector('#modal [data-a="evChoose"]'), null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(150);
    times.push(Date.now() - t0);
    const toast = await page.evaluate(() => { const t = document.querySelector('.toast, #toast, [role=status]'); return t ? t.innerText.slice(0, 160) : ''; });
    if (toast) log.push({ month: i, toast });
  }
  fs.writeFileSync(`/tmp/ardan/critique/ux/events-${P}-${W}.json`, JSON.stringify({ cards, times, log }, null, 1));
  console.log('cards', cards, 'avg next ms', Math.round(times.reduce((a, b) => a + b, 0) / Math.max(1, times.length)), 'max', Math.max(...times));
  console.log('errors', page.errs);
  await browser.close();
})();
