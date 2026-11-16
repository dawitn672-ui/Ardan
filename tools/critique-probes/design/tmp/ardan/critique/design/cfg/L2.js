// Life 2: a younger son of a noble house of Aldmark, from 16. Enlists at once and plays the soldier's ladder.
const C = require('./common.js');
module.exports = {
  create: { status: 'noble', startAge: 16, race: 'human', realm: 'POL-01', sex: 'M', seed: 'L2-noble-army', diff: 'hard' },
  persona: {
    salt: 'L2', noise: 2.5, fearDeath: 4, fearHurt: 1,
    likes: [[/charge|lead|volunteer|attack|hold the line|stand|fight|duel|honou?r|oath|men|command|scout|flank|press/, 1.3], [/run|flee|hide|desert|bribe/, -1.2], [/renown|command|tactics/, 0.5]],
  },
  async between(page, ctx, s) {
    const { ini, snapshot } = C;
    const me = await snapshot(page);
    const I = await ini(page);
    const mo = await page.evaluate(() => A.V2T.monthOf(A.S.warClock || 0));
    if (mo === 0 || !ctx.once) {
      ctx.once = true;
      ctx.log({ k: 'snap', me, ini: I });
      await ctx.shot(`y${me.age}-${mo}-now`);
      if (me.age % 3 === 1) await ctx.shot(`y${me.age}-now`, 420);
      // the Path page each year: the ladder as the player sees it
      const path = await page.evaluate(() => { UI.tab = 'path'; UI.render(); const t = document.querySelector('main').innerText; UI.tab = 'life'; UI.render(); return t; });
      ctx.log({ k: 'path', text: path.slice(0, 4000) });
    }
    if (!me.mil) {
      const r = await ctx.D.act(page, 'enlist', ctx.policy, ctx.log);
      ctx.log({ k: 'enlist', r, me: await snapshot(page) });
    }
    // spend initiative on what a young officer would: spar, friends, the hall, a tournament now and then
    if (I.have >= 1 && (me.age < 25 || mo % 3 === 0)) {
      const order = me.age < 25 ? ['spar', 'make_friend', 'court_love', 'spar', 'tavern', 'tournament', 'hunt'] : ['make_friend', 'tavern', 'hunt', 'pray'];
      const k = order[(me.age * 12 + mo) % order.length];
      await ctx.D.act(page, k, ctx.policy, ctx.log);
    }
    await page.evaluate(() => {
      const s = document.querySelector('select[data-c="planTrain"]'); if (s && !s.value) { s.value = 'command'; s.dispatchEvent(new Event('change', { bubbles: true })); }
      const a = document.querySelector('select[data-c="planAim"]'); if (a && !a.value) { a.value = 'advance'; a.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  },
};
