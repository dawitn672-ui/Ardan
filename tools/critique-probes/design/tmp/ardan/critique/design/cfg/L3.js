// Life 3: a merchant's daughter of the Free City of Ostra, grown (22). Trade, ventures, a household, a guild seat.
const C = require('./common.js');
module.exports = {
  create: { status: 'merchant', startAge: 22, race: 'human', realm: 'POL-16', sex: 'F', seed: 'L3-merchant', diff: 'hard' },
  persona: {
    salt: 'L3', noise: 2.5, fearDeath: 7, fearHurt: 2,
    likes: [[/trade|bargain|coin|suns|profit|contract|deal|invest|ledger|ship|cargo|price|buy|sell|guild|partner/, 1.3], [/lie|cheat|smuggl/, -0.3], [/fight|duel|strike/, -0.8]],
  },
  async between(page, ctx, s) {
    const { ini, snapshot } = C;
    const me = await snapshot(page);
    const I = await ini(page);
    const mo = await page.evaluate(() => A.V2T.monthOf(A.S.warClock || 0));
    if (mo === 0 || !ctx.once) {
      ctx.once = true;
      ctx.log({ k: 'snap', me, ini: I });
      await ctx.shot(`y${me.age}-now`);
      if (me.age % 3 === 1) await ctx.shot(`y${me.age}-now`, 420);
      const path = await page.evaluate(() => { UI.tab = 'path'; UI.render(); const t = document.querySelector('main').innerText; UI.tab = 'life'; UI.render(); return t; });
      ctx.log({ k: 'path', text: path.slice(0, 4000) });
    }
    if (!me.job || me.job.k !== 'merchant') {
      if (!ctx.triedJob || ctx.triedJob < me.age) {
        ctx.triedJob = me.age;
        const r = await page.evaluate(() => { UI.tab = 'path'; UI.render(); const b = document.querySelector('[data-a="applyJob"][data-v="merchant"]'); return b ? (b.disabled ? 'disabled' : 'ok') : 'none'; });
        if (r === 'ok') { await page.click('[data-a="applyJob"][data-v="merchant"]'); await page.waitForTimeout(300); await ctx.D.settle(page, ctx.policy, ctx.log, {}, null); }
        const t = await page.evaluate(() => { const t = document.getElementById('toast'); const x = t ? t.innerText : ''; UI.tab = 'life'; UI.render(); return x; });
        ctx.log({ k: 'applyJob', r, toast: t, me: await snapshot(page) });
      }
    }
    if (I.have >= 1 && (me.age < 30 || mo % 2 === 0)) {
      const order = me.age >= 30 ? ['moneylend', 'make_friend', 'moneylend', 'rest'] : me.spouse ? ['trade_venture', 'moneylend', 'make_friend', 'festival', 'trade_venture', 'rest'] : ['trade_venture', 'court_love', 'make_friend', 'moneylend', 'festival', 'court_love'];
      const k = order[(me.age * 12 + mo) % order.length];
      await ctx.D.act(page, k, ctx.policy, ctx.log);
    }
    await page.evaluate(() => {
      const s = document.querySelector('select[data-c="planTrain"]'); if (s && !s.value) { s.value = 'trade'; s.dispatchEvent(new Event('change', { bubbles: true })); }
      const a = document.querySelector('select[data-c="planAim"]'); if (a && !a.value) { a.value = 'wealth'; a.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  },
};
