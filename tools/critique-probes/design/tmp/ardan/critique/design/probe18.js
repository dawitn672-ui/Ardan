const D = require('./bin/drive.js');
(async () => {
  const { b, page, errs } = await D.open(1366);
  const out = await page.evaluate(() => {
    const res = [];
    for (const status of ['serf', 'peasant', 'artisan', 'merchant', 'gentry', 'noble', 'royal']) {
      A.newGame({ seed: 4242, race: 'human', realm: 'POL-01', status, sex: 'M', startAge: 16 });
      const pc = A.pc();
      UI.screen = 'game'; UI.tab = 'path'; UI.ov = null; UI.render();
      const t = document.querySelector('main').innerText;
      const how = (t.match(/HOW YOU LIVE\n([^\n]+)/) || [])[1];
      const post = (t.match(/Months in your current post\n([^\n]+)/) || [])[1];
      const where = (t.match(/WHERE YOU STAND\n([^\n]+)\n([^\n]+)/) || []).slice(1).join(' / ');
      const onLS = [...document.querySelectorAll('[data-a="lifestyle"]')].filter(b => b.classList.contains('on') || b.getAttribute('aria-pressed') === 'true').map(b => b.getAttribute('data-v'));
      res.push({ status, coin: pc.coin, job: pc.job && (pc.job.c + ':' + pc.job.r), life: pc.life || pc.lifestyle || (pc.plan && pc.plan.life), how, onLS, post, where, rankSince: pc.job && pc.job.since });
    }
    return res;
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
