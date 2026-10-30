// 97-life-fixes, words: the creation summary's ruler (patch LF-CR-RULER). Pure: reads the lore, writes nothing.
(function () {
  const FEM = { King: 'Queen', Emperor: 'Empress', Sultan: 'Sultana', Prince: 'Princess', Raja: 'Rani', Khan: 'Khatun', Emir: 'Emira', Abbot: 'Abbess', Doge: 'Dogaressa', Duke: 'Duchess', Khagan: 'Khatun', Lord: 'Lady' };
  const MAS = { Queen: 'King', 'Forge-Queen': 'Forge-King', 'War-Mother': 'War-Father' };
  // "(Queen Kalunge)" for the realm's ruler as the lore gives it; '' when the lore names nobody
  UI.crRulerNote = function (realm) {
    if (!realm) return '';
    const c = LORE.cast && LORE.cast[realm.ruler];
    const rid = realm.id || Object.keys(LORE.realms || {}).find(k => LORE.realms[k] === realm) || (UI.cr && UI.cr.realm);
    const F = A.FAR && A.FAR.D && A.FAR.D.realms ? A.FAR.D.realms[rid] : null;
    const name = c && c.name ? c.name : F && F.rulerName ? F.rulerName : '';
    if (!name) return '';
    const sex = c && c.name ? c.sex : F ? F.rulerSex : null;
    let t = String(realm.title || '').split(' / ')[0];
    t = sex === 'F' ? FEM[t] || t : MAS[t] || t;
    return `<span class="muted">(${UI.esc(t ? t + ' ' + name : name)})</span>`;
  };
})();
// the first rank of two careers named a boy ("Herd-boy", "Pot-boy"), which a woman's post then read as; every reader
// of the career table takes ranks[r][0], so the rank itself is named for either sex
(function () {
  const C = GD.CAREERS || {};
  const rename = (k, from, to) => { const r = C[k] && C[k].ranks && C[k].ranks[0]; if (r && r[0] === from) r[0] = to; };
  rename('herd', 'Herd-boy', 'Herd-hand');
  rename('brewer', 'Pot-boy', 'Pot-hand');
})();
// the top of the ladder, for scenes written for the bottom (patch LF-TIER-GATES): a reigning ruler, a commander or a
// general, a council seat, a lord of a barony or more, or one who once held a commander's rank (p.veteran, kept when
// the army is left). Cycle 2 (lives F3): a Marshal of the council who had left the army was asked to drill the town
// muster, and a Chancellor kept the scribe's love-letter duty, because only rulers and serving generals counted.
A.lfRank = p => (p && p.mil && typeof p.mil.rank === 'number' ? p.mil.rank : -1);
A.lfTop = p => !!(p && (p.ruler || A.lfRank(p) >= 6 || p.office || (p.noble && p.noble.rung >= 4) || (p.veteran && p.veteran.rank >= 6)));
// older than n in human years (an elf of 200 is not old for a sellsword)
A.lfOld = (p, n) => !!(p && A.C && A.C.ageAdj && A.C.ageAdj(p) > n);
