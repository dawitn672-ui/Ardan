const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, 420, 900);
  await page.evaluate(HELPERS);
  for (const [label, setup] of [['noble', "T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); T.play(4);"], ['child', "T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 9 });"], ['newborn', "T.enter({ seed: 4343, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 0 });"], ['noblechild', "T.enter({ seed: 4444, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 0 });"]]) {
    const r = await page.evaluate((setup) => { eval(setup); UI.screen = 'game'; UI.ov = null; UI.tab = 'people'; UI.render();
      const body = document.querySelector('#tabbody');
      const heads = [...body.querySelectorAll('h2,h3,h4,summary,.fold-h,.card-h,.sec-h,[data-a="fold"]')].map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 60)).filter(Boolean);
      const people = [...body.querySelectorAll('[data-a="ov"][data-v^="person:"]')].map(e => e.getAttribute('data-v'));
      return { heads: [...new Set(heads)].slice(0, 25), personLinks: people.length, distinct: new Set(people).size, rel: Object.keys(A.pc().rel || {}).length };
    }, setup);
    console.log(label, JSON.stringify(r));
  }
  await browser.close();
})();
