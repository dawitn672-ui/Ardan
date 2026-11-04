// v2 stats, part 5: the character sheet in real units and words (V2_SPEC complaint 11).
//
// The profile (desktop side panel, the phone's You page) and the full profile no longer show "Strength 35 / 46": they
// show the body as A.V2.body.describe gives it (height that grows, lift in kg with a thing you know, sprint in m/s, march
// in km a day, reaction in ms, toughness in blows), the mind as words plus "1 in N", fighting worth in levies, and skills
// as named tiers with hours practised. Rendering only: everything is read through A.V2S.view, which writes no state.
const VS = A.V2S, B = A.V2.body;
const esc = s => UI.esc(String(s == null ? '' : s));
const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
VS.MIND_NAME = { wits: 'Wits', learning: 'Memory', judgment: 'Judgment', will: 'Will', presence: 'Presence', cunning: 'Cunning' };
VS.levyWords = function (lv) {
  if (lv < 0.15) return 'no use in a fight yet';
  if (lv < 0.7) return 'less than one levy';
  if (lv < 1.4) return 'about one levy';
  if (lv < 2) return 'about one and a half levies';
  if (lv < 20) return `about ${Math.round(lv)} levies`;
  return `about ${Math.round(lv / 5) * 5} levies`;
};
VS.levyRank = function (lv) {
  return lv < 0.7 ? 'not yet a fighter' : lv < 1.6 ? 'a levy\'s worth' : lv < 3.3 ? 'a man-at-arms' : lv < 8 ? 'a knight' : lv < 12 ? 'a champion'
    : lv < 32 ? 'an order knight, or a giant' : lv < 50 ? 'a hero of the age' : 'a legend';
};
// each row says what its number measures (59-tooltips: every number on the profile explains itself)
VS.ROW_TIP = { Height: 'Your height and weight now; a child grows each year.', Strength: 'The heaviest dead weight you can raise once.',
  Speed: 'Your flat-out sprint.', Endurance: 'How far you can march in a day with a pack.', Reflexes: 'How long you take to answer a blow.',
  Toughness: 'How many blows that would fell an ordinary man you can take.', 'In a fight': 'Your worth in a fight, counted in levies: untrained spearmen in padded coats.' };
const row = (lbl, val, words) => `<div class="v2-row" title="${esc(VS.ROW_TIP[lbl] || lbl + ', against everyone of your people')}"><span class="v2-l">${esc(lbl)}</span><span class="v2-v">${esc(val)}</span><span class="v2-w">${esc(words)}</span></div>`;
VS.sheetHtml = function (p, opts = {}) {
  const d = VS.describe(p), s = VS.stats(p);
  if (!d || !s) return '';
  const v = VS.view(p), R = GD.RACES[p.race] || GD.RACES.human, age = A.age(p);
  const growing = age < (R.grown || 20) ? ', still growing' : '';
  let h = '<div class="v2-sheet">';
  h += `<div class="group-h">Build and strength</div>`;
  h += row('Height', `${d.height}, ${d.weight}`, `${(p.app && p.app.build) || ''}${growing}`.replace(/^, /, ''));
  h += row('Strength', `lifts ${d.lift.value}`, `${d.lift.words.replace(/^can lift /, '')}; ${d.lift.rank}`);
  h += row('Speed', d.sprint.value, d.sprint.words);
  h += row('Endurance', d.march.value, d.march.words);
  h += row('Reflexes', d.reaction.value, d.reaction.words);
  h += row('Toughness', d.toughness.value, d.toughness.words);
  if (age >= 6) {
    const lv = VS.leviesOf(p);
    h += row('In a fight', VS.levyWords(lv), VS.levyRank(lv));
  }
  h += `<div class="group-h">Mind</div>`;
  for (const k of B.MENTAL) {
    const m = d[k];
    h += row(VS.MIND_NAME[k], cap(m.words), m.rarity || '');
  }
  const bt = (v.body.breakthroughs || []);
  if (bt.length) h += `<div class="tiny muted v2-bt">Broke through: ${esc(bt.slice(-3).map(b => `${b.attr === 'lift' ? 'strength' : b.attr} at ${b.age}${b.note ? ' (' + b.note + ')' : ''}`).join('; '))}.</div>`;
  if (!opts.noLegend) h += `<div class="tiny muted v2-legend">A levy: an untrained spearman in a padded coat.</div>`;
  return h + '</div>';
};
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
// a check chip's value (92-scene-card): a skill as its tier, a stat as a word for your place among your own kind
VS.statWord = function (p, s, v) {
  const age = A.age(p), typ = VS.raceMean(p, s) * 0.78 * VS.grow(p, age), r = (+v || 0) / Math.max(0.5, typ);
  return r < 0.55 ? 'poor' : r < 0.85 ? 'middling' : r < 1.2 ? 'fair' : r < 1.5 ? 'good' : r < 2 ? 'fine' : r < 3 ? 'rare' : 'legendary';
};
VS.valueWord = (p, k, v) => (GD.STATS.includes(k) ? VS.statWord(p, k, v) : VS.tierOf(v).name);
VS.css = '.v2-sheet{margin:4px 0 6px}.v2-row{display:grid;grid-template-columns:6em minmax(0,1fr);gap:0 8px;align-items:baseline;font-size:var(--t-small,13px);line-height:1.3;padding:2px 0}' +
  '.v2-l{opacity:.75}.v2-v{font-weight:600}.v2-w{grid-column:2;opacity:.8;font-size:.95em}.v2-hrs{white-space:nowrap;opacity:.75;text-align:right}' +
  '.prow:has(.v2-tier){grid-template-columns:minmax(0,1fr) auto 5.6em;gap:4px 10px}.prow .v2-tier{white-space:nowrap;font-weight:600}' +
  '.mbox .v2-row{grid-template-columns:6.5em minmax(0,auto) minmax(0,1fr)}.mbox .v2-v{white-space:nowrap}.mbox .v2-w{grid-column:auto}' +
  '@media (max-width:560px){.mbox .v2-row{grid-template-columns:6em minmax(0,1fr)}.mbox .v2-w{grid-column:2}}' +
  '.v2-odds{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}.v2-scale{width:1.15em;height:1.15em;flex:none;vertical-align:-.2em;pointer-events:none}.v2-ow{pointer-events:none}';
VS.style = () => { if (typeof document === 'undefined' || document.getElementById('v2s-style')) return; const s = document.createElement('style'); s.id = 'v2s-style'; s.textContent = VS.css; document.head.appendChild(s); };

// ---- the sheet's renderers ----------------------------------------------------------------------------------------------
VS.sheetDepth = 0;
const STAT_LBL = new Set(Object.values(GD.STAT_NAMES || {}));
const barRow = UI.barRow;
UI.barRow = function (label) {
  if (VS.sheetDepth > 0) {
    const l = String(label || '');
    if (/data-tip="stat:(str|spd|ins|sta|int|wil)"/.test(l) || STAT_LBL.has(l)) return '';
    if ((l === 'Piety' || /data-tt="piety"/.test(l)) && !VS.hasFaith(A.pc())) return '';
  }
  return barRow.apply(this, arguments);
};
const inSheet = (fn) => function () {
  VS.sheetDepth++;
  try { return fn.apply(this, arguments); } finally { VS.sheetDepth--; }
};
const prof = UI.renderProfile;
UI.renderProfile = inSheet(function () {
  let h = prof.apply(this, arguments);
  const pc = A.pc();
  if (typeof h !== 'string' || !pc) return h;
  try {
    VS.style();
    h = h.replace(/<div class="tiny muted" style="margin:2px 0 6px">Tick = potential\.[^<]*<\/div>/, '');
    // the body and mind go where the stat bars were: after the vitals' separator
    const at = h.indexOf('<div class="sep"></div>');
    const block = VS.sheetHtml(pc);
    h = at >= 0 ? h.slice(0, at) + '<div class="sep"></div>' + block + h.slice(at + 23) : h + block;
    h = VS.skillRows(h);
  } catch (e) { console.error('v2 sheet', e); }
  return h;
});
if (UI.profileModal) {
  const pm = UI.profileModal;
  UI.profileModal = inSheet(function (p) {
    let h = pm.apply(this, arguments);
    if (typeof h !== 'string' || !p) return h;
    try {
      VS.style();
      h = h.replace(/<div class="group-h">Stats \(current \/ potential\)<\/div>/, `<div class="group-h">Body and mind</div>${VS.sheetHtml(p)}`);
      h = h.replace(/<div>Height<\/div><div>\d+ cm, /, `<div>Height</div><div>${esc(VS.height(p))} cm${A.age(p) < ((GD.RACES[p.race] || {}).grown || 20) ? ' and growing' : ''}, `);
      if (!VS.hasFaith(p)) h = h.replace(/ · (?:<span[^>]*>)?(?:<span[^>]*>)?piety(?:<\/span>)? (?:<span[^>]*>)?\d+(?:<\/span>)?/i, '').replace(/ · [^·<]*piety[^<]*?\d+/i, '');
      h = VS.skillRows(h);
    } catch (e) { console.error('v2 sheet', e); }
    return h;
  });
}
for (const k of ['topProfs', 'profBlock']) {
  if (!UI[k]) continue;
  const f = UI[k];
  UI[k] = function () { const h = f.apply(this, arguments); try { return typeof h === 'string' ? VS.skillRows(h) : h; } catch (e) { return h; } };
}

// 92-scene-card's check chip: "INT 39" becomes "INT fair", "Diplomacy 12" "Diplomacy Novice"
if (UI.SCENE && UI.SCENE.chip) {
  const chip = UI.SCENE.chip;
  UI.SCENE.chip = function (pc, ck) {
    const h = chip.apply(this, arguments);
    try {
      if (typeof h !== 'string' || !ck || !ck.s || !pc) return h;
      return h.replace(/<b class="sc-chk-v">(-?\d+)<\/b>/, (m, n) => `<b class="sc-chk-v">${esc(VS.valueWord(pc, ck.s, +n))}</b>`);
    } catch (e) { return h; }
  };
}
// 48-fight-ladder's tier chip: "Untrained · 39" becomes "Untrained · about one levy"
if (UI.tierChip) {
  const tc = UI.tierChip;
  UI.tierChip = function (p) {
    const h = tc.apply(this, arguments);
    try {
      if (typeof h !== 'string') return h;
      return h.replace(/fighting worth (\d+)\./, (m, w) => `worth ${VS.levyWords(VS.fromWorth(+w))} in a fight.`)
        .replace(/ · (\d+)<\/span>$/, (m, w) => ` · ${esc(VS.levyWords(VS.fromWorth(+w)))}</span>`);
    } catch (e) { return h; }
  };
}
