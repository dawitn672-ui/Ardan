const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, 1366, 768);
  await page.evaluate(HELPERS);
  const r = await page.evaluate(() => {
    T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 });
    T.play(4); UI.render();
    const top1 = document.querySelector('header, .topbar, #top') ? (document.querySelector('header, .topbar, #top').innerText.slice(0, 200)) : document.body.innerText.slice(0, 200);
    const fns = Object.keys(UI).filter(k => /^render|Top|clk|story/i.test(k)).slice(0, 60);
    let top2 = null;
    try { UI.renderTop && UI.renderTop(); top2 = document.body.innerText.slice(0, 200); } catch (e) { top2 = 'err ' + e; }
    return { year: A.S.year, top1, top2, fns, storyLen: (A.S.log || A.S.story || []).length };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
