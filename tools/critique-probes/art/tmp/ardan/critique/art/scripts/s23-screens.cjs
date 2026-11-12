const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  const W = +(process.argv[2] || 1366), H = W < 600 ? 900 : W >= 1900 ? 1080 : 768;
  const { b, pg, errs } = await open(W, H);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 20 });
  await pg.evaluate(() => { UI.set.hints = false; UI.render(); });
  const clickText = async (t, name) => {
    const l = pg.locator(`button:has-text("${t}"), [data-a]:has-text("${t}")`).first();
    if (!(await l.count())) { console.log('missing', t); return false; }
    await l.click({ timeout: 3000 }).catch(e => console.log('fail', t, e.message.slice(0, 60)));
    await pg.waitForTimeout(900);
    if (name) await shot(pg, name);
    return true;
  };
  await shot(pg, `scr-life-noble-${W}`);
  await clickText('Full profile', `scr-profile-${W}`);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
  await pg.evaluate(() => { UI.ov = null; UI.render(); });
  await clickText('Family', `scr-familyov-${W}`);
  await pg.evaluate(() => { UI.ov = null; UI.render(); });
  // family group -> dynasty
  await pg.evaluate(() => { UI.tab = 'legacy'; UI.render(); });
  await pg.waitForTimeout(700); await shot(pg, `scr-dynasty-${W}`);
  // court
  await pg.evaluate(() => { UI.tab = 'realm'; UI.render(); });
  await pg.waitForTimeout(700); await shot(pg, `scr-court-${W}`);
  // the book (chronicle)
  await pg.evaluate(() => { UI.tab = 'book'; UI.render(); });
  await pg.waitForTimeout(700); await shot(pg, `scr-book-${W}`);
  // path
  await pg.evaluate(() => { UI.tab = 'path'; UI.render(); });
  await pg.waitForTimeout(700); await shot(pg, `scr-path-${W}`);
  // light theme life
  await pg.evaluate(() => { UI.set.theme = 'light'; UI.applySettings && UI.applySettings(); UI.tab = 'life'; UI.render(); });
  await pg.waitForTimeout(700); await shot(pg, `scr-life-light-${W}`);
  await pg.evaluate(() => { UI.tab = 'world'; UI.worldView = 'map'; UI.render(); });
  await pg.waitForTimeout(1200); await shot(pg, `scr-world-light-${W}`);
  console.log(errs);
  await b.close();
})();
