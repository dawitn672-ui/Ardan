// Retired by S1b (D-072): 99993-v2-stats' skill tiers and hours (e-sheet.core.js).
// skill rows: "Sword  Journeyman · 812 hours" with the bar as the way to the next tier
VS.tierOf = function (v) {
  const hrs = VS.hoursOf(v), T = B.SKILL_TIERS;
  let t = 0; for (let i = 0; i < T.length; i++) if (hrs >= T[i][0]) t = i;
  const lo = T[t][0], hi = T[t + 1] ? T[t + 1][0] : lo * 2;
  return { name: T[t][1], hours: Math.round(hrs), next: T[t + 1] ? T[t + 1][1] : null, frac: Math.max(0, Math.min(1, (hrs - lo) / Math.max(1, hi - lo))) };
};
VS.fmtH = n => (n >= 10000 ? Math.round(n / 1000) + ',000' : n >= 1000 ? Math.floor(n / 1000) + ',' + String(n % 1000).padStart(3, '0') : String(n));
VS.skillRows = function (h) {
  // the release's row is name, <b>value</b>, <span class="tier">, bar: the value's place takes the tier, the tier's the hours
  return h.replace(/<b>(\d+)<\/b><span class="tier">[^<]*<\/span><div class="bar"><i style="width:\d+(?:\.\d+)?%"><\/i><\/div>/g, (m, n) => {
    const t = VS.tierOf(+n);
    return `<b class="v2-tier">${esc(t.name)}</b><span class="tier v2-hrs">${esc(VS.fmtH(t.hours))} hours</span>` +
      `<div class="bar" title="${esc(t.next ? 'on the way to ' + t.next : 'the top')}"><i style="width:${Math.round(t.frac * 100)}%"></i></div>`;
  });
};
