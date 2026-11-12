// Extra screens: battle (soldier), death screen, market rows, phone tap on tooltips. node extras.cjs <what> <w> <h>
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
const fs = require('fs');
const [what, W, H] = [process.argv[2], +process.argv[3], +process.argv[4]];
const rec = async (page, name, full = false) => { const m = await shot(page, name, { full }); console.log(m.name, 'words', m.wordsView, '/', m.wordsPage, 'inter', m.interactiveInView, '/', m.interactive, 'small44', m.smallTargets44, 'title', m.titleAttrs, 'tt', m.ttTriggers, 'screens', m.screens); return m; };
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, W, H, { touch: W < 800, mobile: false });
  await page.evaluate(HELPERS);
  if (what === 'death') {
    await page.evaluate(() => { T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); T.play(6); UI.screen = 'game'; UI.ov = null; UI.tab = 'life'; UI.render(); });
    await page.evaluate(() => { const pc = A.pc(); A.kill(pc, 'a fever'); let g = 0, h; while ((h = A.headReady()) && h.type !== 'death' && g++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } if (!A.S.queue.length || A.S.queue[0].type !== 'death') A.S.queue.unshift({ type: 'death' }); UI.render(); UI.renderModal && UI.renderModal(); });
    await page.waitForTimeout(1500);
    await rec(page, 'death-1', true);
    const t = await page.evaluate(() => { const m = document.querySelector('#modal') || document.body; return { text: m.innerText.slice(0, 3000), acts: [...m.querySelectorAll('[data-a]')].map(e => e.getAttribute('data-a') + '=' + e.innerText.replace(/\s+/g, ' ').slice(0, 40)), sh: m.scrollHeight }; });
    console.log(JSON.stringify(t, null, 1));
    // scroll the modal down a screen
    await page.evaluate(() => { const m = document.querySelector('#modal .mbox, #modal'); if (m) m.scrollTop = 700; });
    await page.waitForTimeout(400);
    await rec(page, 'death-2');
  }
  if (what === 'battle') {
    const r = await page.evaluate(() => {
      T.enter({ seed: 7301, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
      T.play(1);
      const pc = A.pc(); if (!pc.mil) A.enlist(pc);
      if (!A.atWar(pc.realm).length) A.startWar(pc.realm, A.neighbors(pc.realm)[0], null, 'conquest');
      // run days until an attack prompt, auto-answering events
      for (let d = 0; d < 400 && pc.alive; d++) {
        A.advance(1);
        const q = A.S.queue.find(x => x.type === 'choice' && /^(Attack|Under attack) at/.test(x.title || ''));
        if (q) { A.S.queue = [q].concat(A.S.queue.filter(x => x !== q)); UI.screen = 'game'; UI.ov = null; UI.tab = 'life'; UI.render(); return { day: d, title: q.title, opts: q.options.map(o => o.label || o.t || o.fn) }; }
        let h, g = 0; while ((h = A.headReady()) && g++ < 50) { if (h.type === 'event') A.eventAuto(); else if (h.type === 'choice' && /^(Attack|Under attack)/.test(h.title || '')) break; else A.skipPrompt(); }
      }
      return null;
    });
    console.log('attack prompt', JSON.stringify(r));
    await page.waitForTimeout(800);
    await rec(page, 'battle-0-prompt', true);
    console.log(await page.evaluate(() => { const m = document.querySelector('#modal'); return m ? m.innerText.slice(0, 1500).replace(/\n+/g, ' / ') + ' || ' + [...m.querySelectorAll('[data-a]')].map(e => e.getAttribute('data-a') + '=' + e.innerText.replace(/\s+/g, ' ').slice(0, 40)).join(' | ') : 'no modal'; }));
    // choose the first option that is not a skip
    for (let step = 0; step < 14; step++) {
      const acts = await page.evaluate(() => { const m = document.querySelector('#modal'); return m ? [...m.querySelectorAll('[data-a]')].map(e => e.getAttribute('data-a') + '=' + (e.getAttribute('data-v') || '') + '=' + e.innerText.replace(/\s+/g, ' ').slice(0, 40)) : []; });
      if (!acts.length) { console.log('no modal at step', step); break; }
      console.log('step', step, acts.slice(0, 10).join(' | '));
      const pick = acts.find(a => /^(qChoice|v2wChoose|v2wTac|bStep|mChoose|evChoose)=/.test(a)) || acts.find(a => /^(v2wClose|bClose|qClose|evClose|closeOv|continue)=/.test(a));
      if (!pick) break;
      const [a, v] = pick.split('=');
      await page.evaluate(([a, v]) => { const e = [...document.querySelectorAll(`#modal [data-a="${a}"]`)].find(x => (x.getAttribute('data-v') || '') === v); e && e.click(); }, [a, v]);
      await page.waitForTimeout(900);
      await rec(page, `battle-${step + 1}`, true);
    }
  }
  if (what === 'market') {
    await page.evaluate(() => { T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'merchant', sex: 'M', startAge: 25 }); UI.screen = 'game'; UI.ov = null; UI.tab = 'holdings'; UI.render(); });
    await page.waitForTimeout(500);
    await rec(page, 'merchant-holdings', true);
    const y = await page.evaluate(() => { const b = document.querySelector('[data-a="mktBuy"]'); if (!b) return null; b.scrollIntoView({ block: 'center' }); const tbl = b.closest('table'); return tbl ? { rows: tbl.querySelectorAll('tr').length, cols: tbl.querySelectorAll('tr')[1] ? tbl.querySelectorAll('tr')[1].children.length : 0, text: tbl.innerText.slice(0, 800) } : null; });
    console.log('market', JSON.stringify(y));
    await page.waitForTimeout(400);
    await rec(page, 'market');
  }
  if (what === 'tap') {
    // phone: does a tap on a stat word open a popover, and does hover open one on desktop
    await page.evaluate(() => { T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 9 }); UI.tab = W < 800 ? 'you' : 'life'; UI.render(); }).catch(() => {});
    await page.evaluate(() => { UI.tab = innerWidth < 800 ? 'you' : 'life'; UI.render(); });
    await page.waitForTimeout(400);
    const trig = await page.$('[data-tt]');
    const info = await page.evaluate(() => [...document.querySelectorAll('[data-tt]')].slice(0, 8).map(e => e.getAttribute('data-tt') + ':' + e.innerText.slice(0, 20)));
    console.log('triggers', info);
    if (W < 800) { await trig.tap(); } else { await trig.hover(); }
    await page.waitForTimeout(800);
    const pop = await page.evaluate(() => { const p = document.querySelector('.tt-pop'); return p ? p.innerText.slice(0, 600) : null; });
    console.log('popover after', W < 800 ? 'tap' : 'hover', JSON.stringify(pop));
    await rec(page, 'tt-open');
  }
  console.log('errors', page.errs);
  await browser.close();
})();
