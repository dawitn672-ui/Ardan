// helpers shared by the life configs
const ini = page => page.evaluate(() => { const e = document.querySelector('.clk-ini'); const m = e && (e.getAttribute('aria-label') || '').match(/Initiative ([\d.]+) of ([\d.]+)/); return m ? { have: +m[1], cap: +m[2] } : { have: 0, cap: 0 }; });
const snapshot = page => page.evaluate(() => {
  const pc = A.pc(); if (!pc) return null;
  const rel = {}; for (const [id, r] of Object.entries(pc.rel || {})) { const p = A.P(id); const k = r.type + (p && !p.alive ? '(dead)' : ''); rel[k] = (rel[k] || 0) + 1; }
  return { date: A.dateStr(), age: A.age(pc), coin: Math.round(pc.coin), job: pc.job ? { k: pc.job.k, c: pc.job.c, rank: pc.job.rank, t: pc.occ || pc.title } : null, mil: pc.mil ? { rank: pc.mil.rank, unit: pc.mil.unit, div: pc.mil.div, branch: pc.mil.branch } : null, title: pc.title, occ: pc.occ, spouse: pc.spouse, kids: (pc.children || []).length, fame: pc.fame, health: Math.round(pc.health), happy: Math.round(pc.happy), traits: pc.traits, rel, nrel: Object.keys(pc.rel || {}).length, status: pc.status, noble: pc.noble };
});
module.exports = { ini, snapshot };
