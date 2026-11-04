const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/dist/ardan-demo.local.html');
  await p.selectOption('#estate', process.argv[2] || 'noble');
  await p.click('#begin'); await p.waitForSelector('#app:not([hidden])');
  await p.evaluate(() => { const g = window.__ardanTest.game(); g.me.birthYear -= 22; g.me.age = 22; g.me.body.skills.sword = 3000; Object.assign(g.me.body.cond, { lift: 2, toughness: 1.6, sprint: 1.2 }); window.__ardanTest.war(); });
  await p.screenshot({ path: 'out/war-march.png', fullPage: true });
  for (let i = 0; i < 30 && !(await p.$('text=Battle ')); i++) await p.click('text=Next week');
  await p.screenshot({ path: 'out/war-battle.png', fullPage: true });
  for (let i = 0; i < 6 && !(await p.$('text=After the battle')); i++) { const ch = await p.$$('.card-acts .choice'); await ch[1].click(); }
  await p.screenshot({ path: 'out/war-report.png', fullPage: true });
  console.log('errors', errs);
  await b.close();
})();
