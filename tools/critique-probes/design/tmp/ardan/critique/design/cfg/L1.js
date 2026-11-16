// Life 1: a free peasant boy of Aldmark, born and played from the cradle. Cautious, family-minded, wants land and a household.
const C = require('./common.js');
module.exports = {
  create: { status: 'peasant', startAge: 0, race: 'human', realm: 'POL-01', sex: 'M', seed: 1105001, diff: 'hard' },
  persona: {
    salt: 'L1', noise: 3, fearDeath: 8, fearHurt: 2,
    likes: [[/family|mother|father|brother|sister|home|help|share|work|learn|save|marry|wife|child/, 1.2], [/coin|suns|pay|wage/, 0.6], [/steal|lie|cheat|run away|fight him|strike/, -0.8]],
  },
  async between(page, ctx, s) {
    const { ini, snapshot } = C;
    const me = await snapshot(page);
    const I = await ini(page);
    // a yearly look at the life: screenshot + state
    if (/January/.test(await page.evaluate(() => A.V2T.MONTHS[A.V2T.monthOf(A.S.warClock || 0)]))) {
      ctx.log({ k: 'snap', me, ini: I });
      if (me.age % 3 === 0) { await ctx.shot(`y${me.age}-now`); await ctx.shot(`y${me.age}-now`, 420); }
    }
    // spend initiative like a player: one or two things a month once there is some
    if (I.have >= 1 && me.age >= 4) {
      const order = me.age < 16 ? ['make_friend', 'bm_hire', 'festival', 'bm_bloods', 'spar', 'pray']
        : !me.spouse ? ['court_love', 'make_friend', 'bm_hire', 'festival', 'spar', 'tavern'] : ['bm_hire', 'make_friend', 'festival', 'pray', 'rest'];
      const k = order[(me.age * 12 + (await page.evaluate(() => A.V2T.monthOf(A.S.warClock || 0)))) % order.length];
      await ctx.D.act(page, k, ctx.policy, ctx.log);
    }
    // the big moves, as a player would make them
    if (me.age >= 12 && !me.flags_train) {
      await page.evaluate(() => { const s = document.querySelector('select[data-c="planTrain"]'); if (s && !s.value) { s.value = 'husbandry'; s.dispatchEvent(new Event('change', { bubbles: true })); } });
    }
    if (me.age >= 16 && !me.job && (!ctx.triedJob || ctx.triedJob < me.age)) {
      ctx.triedJob = me.age;
      for (const k of ['farm', 'herd', 'labor']) {
        const ok = await page.evaluate(k => { UI.tab = 'path'; UI.render(); const b = document.querySelector(`[data-a="applyJob"][data-v="${k}"]`); return b && !b.disabled; }, k);
        if (ok) { await page.click(`[data-a="applyJob"][data-v="${k}"]`).catch(() => {}); await page.waitForTimeout(300); const t = await page.evaluate(() => { const t = document.getElementById('toast'); return t ? t.innerText : ''; }); ctx.log({ k: 'applyJob', job: k, toast: t }); break; }
      }
      await page.evaluate(() => { UI.tab = 'life'; UI.render(); });
    }
    if (me.age >= 16 && me.job && (me.age * 12 + (await page.evaluate(() => A.V2T.monthOf(A.S.warClock || 0)))) % 4 === 0) {
      const ok = await page.evaluate(() => { UI.tab = 'path'; UI.render(); const b = document.querySelector('[data-a="doWork"][data-v="hard"]'); return b && !b.disabled; });
      if (ok) { await page.click('[data-a="doWork"][data-v="hard"]').catch(() => {}); await page.waitForTimeout(200); await ctx.D.settle(page, ctx.policy, ctx.log, {}, null); }
      await page.evaluate(() => { UI.tab = 'life'; UI.render(); });
    }
    if (me.age >= 16) {
      await page.evaluate(() => { const s = document.querySelector('select[data-c="planAim"]'); if (s && !s.value) { s.value = 'family'; s.dispatchEvent(new Event('change', { bubbles: true })); } });
    }
  },
};
