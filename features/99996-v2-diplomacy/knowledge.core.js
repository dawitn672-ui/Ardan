// What you know of a realm depends on who you are (playtest 1 #22): a ruler knows his own realm exactly and
// estimates the others; a noble or courtier estimates his own realm and hears of the rest; a commoner has only
// words and hearsay. Used by the realm card, the World > Realms table, the alliance blocs and the realm tooltips.
// Pure: reads A.S only.
(function () {
  const DV = A.V2DIP;
  if (!DV) return;
  const pcOf = () => (A.pc ? A.pc() : null);
  const noble = p => ['noble', 'royal'].includes(p.status) || (p.noble && p.noble.rung >= 4);

  // 'exact' | 'estimate' | 'hearsay'
  DV.seen = function (rid) {
    const p = pcOf();
    if (!p) return 'hearsay';
    if (p.ruler) return p.ruler === rid ? 'exact' : 'estimate';
    if ((noble(p) || p.office) && p.realm === rid) return 'estimate';
    return 'hearsay';
  };
  const median = k => {
    const v = Object.values(A.S.realms || {}).filter(r => r.alive && !r.isRebel).map(r => +r[k] || 0).sort((a, b) => a - b);
    return v.length ? Math.max(1, v[v.length >> 1]) : 1;
  };
  const about = n => {
    n = Math.max(0, Math.round(+n || 0));
    if (n < 100) return 'a few dozen';
    const m = Math.pow(10, Math.floor(Math.log10(n)) - 1);
    return 'about ' + A.fmt(Math.round(n / m) * m);
  };
  DV.armyWords = n => { const x = (+n || 0) / median('army'); return x >= 2.5 ? 'a great host' : x >= 1.2 ? 'a strong army' : x >= 0.6 ? 'a middling army' : 'a small army'; };
  DV.popWords = n => { const x = (+n || 0) / median('pop'); return x >= 2.5 ? 'a great, crowded realm' : x >= 1.2 ? 'well peopled' : x >= 0.6 ? 'of middling size' : 'thinly peopled'; };
  DV.stabWords = s => (s >= 70 ? 'settled' : s >= 50 ? 'steady' : s >= 30 ? 'unsettled' : 'in turmoil');
  DV.goldWords = r => { const inc = Math.max(1, +r.income || 1), t = +r.treasury || 0; return r.debt > 0 ? 'in debt' : t >= 2 * inc ? 'rich' : t >= 0.5 * inc ? 'comfortable' : 'short of money'; };

  // the three things the old views gave as exact figures
  DV.armyText = function (r, n) {
    n = n == null ? r.army : n; const s = r ? DV.seen(r.id) : 'hearsay';
    return s === 'exact' ? A.fmt(n) : s === 'estimate' ? about(n) : `said to be ${DV.armyWords(n)}`;
  };
  DV.popText = function (r) {
    const s = DV.seen(r.id);
    return s === 'exact' ? `${A.fmt(r.pop)} people` : s === 'estimate' ? `${about(r.pop)} people` : DV.popWords(r.pop);
  };
  DV.stabText = function (r) {
    const s = DV.seen(r.id);
    return s === 'exact' ? `stability ${Math.round(r.stability)}` : s === 'estimate' ? DV.stabWords(r.stability) : `said to be ${DV.stabWords(r.stability)}`;
  };
  DV.goldText = function (r) {
    const s = DV.seen(r.id);
    return s === 'exact' ? `${A.fmt(r.treasury)} suns` : s === 'estimate' ? `${DV.goldWords(r)}, ${about(r.treasury)} suns` : `said to be ${DV.goldWords(r)}`;
  };
  // a bloc's strength: exact only if you rule every member (never), estimated by a ruler, heard by anyone else
  DV.blocArmy = function (bl) {
    const n = bl.reduce((a, x) => a + (+x.army || 0), 0), p = pcOf();
    const x = n / median('army');
    return p && p.ruler ? about(n) : `said to be ${x >= 6 ? 'a vast host' : x >= 3 ? 'a great host' : x >= 1.5 ? 'a strong host' : 'a modest strength'} between them`;
  };

  // the realm tooltips (59-tooltips) give formulas and figures: only for the realm you rule
  const T = UI.TIPS;
  if (T) for (const [k, title, fn] of [['realmGold', 'Treasury', r => DV.goldText(r)], ['realmStab', 'Stability', r => DV.stabText(r)],
    ['realmLegit', 'Legitimacy', () => 'what is said of the crown\'s right'], ['realmWeary', 'War weariness', r => (r.exhaustion > 30 ? 'said to be weary of war' : 'not known to be weary')]]) {
    const f = T[k]; if (typeof f !== 'function') continue;
    T[k] = function (id) {
      const r = A.realm(id);
      if (!r || DV.seen(r.id) === 'exact') return f.apply(this, arguments);
      return `<div class="tip-h">${UI.esc(title)} <span class="muted">${UI.esc(r.short || r.name)}</span></div><div class="tip-d">${UI.esc(fn(r))}. You know only what reaches you.</div>`;
    };
  }
})();
