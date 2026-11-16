// Inventory: tooltip keys, menu text, fonts, title attributes per screen, nav depth
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, 1366, 768);
  await page.evaluate(HELPERS);
  const r = await page.evaluate(() => {
    T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 });
    const out = {};
    out.tipsKeys = Object.keys(UI.TIPS || {}).length;
    out.uiA = Object.keys(UI.A).length;
    out.uiC = Object.keys(UI.C || {}).length;
    // menu
    UI.A.menu && UI.A.menu();
    const m = document.querySelector('#modal');
    out.menuText = m ? m.innerText : null;
    out.menuControls = m ? m.querySelectorAll('button, input, select').length : 0;
    UI.ov = null; UI.render();
    // fonts used on screen
    const fams = {};
    for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim())) { const f = cs.fontFamily.split(',')[0].replace(/"/g, ''); fams[f] = (fams[f] || 0) + 1; } }
    out.fonts = fams;
    // titles on the Life screen: list texts
    out.titlesLife = [...document.querySelectorAll('[title]')].filter(e => e.getBoundingClientRect().width).map(e => e.getAttribute('title').slice(0, 90)).slice(0, 60);
    out.hiddenRule = [...document.styleSheets].some(ss => { try { return [...ss.cssRules].some(r => /\[hidden\]/.test(r.selectorText || '') && /display:\s*none\s*!important/.test(r.cssText)); } catch (e) { return false; } });
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
