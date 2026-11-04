// v2 stats, part 7 (playtest round 1): words for the 0-100 numbers outside the body sheet (V2_SPEC complaint 11).
//
// Health, happiness, looks, renown, honour, piety, a realm's stability, a duel's blood and wind are shown as bands
// with plain words ("hale", "content", "known in the province"); a scene's result chips say how much ("a lot more
// Merewyn's regard"), not "+36"; the training picker, the training log, the orders' trials and the tier beside a
// fighter's name say tiers and words. Real units and counts (suns, years, men, kg, km) stay numbers.
// The odds popover on a check is words only and says the same as the chip and the badge.
// Rendering only: nothing here reads A.rand or writes A.S.
const VS = A.V2S;
const esc = s => UI.esc(String(s == null ? '' : s));
const pick = (bands, v) => { for (const [t, w] of bands) if (v >= t) return w; return bands[bands.length - 1][1]; };
VS.BANDS = {
  health: [[90, 'hale'], [70, 'well'], [50, 'worn'], [30, 'ailing'], [15, 'gravely ill'], [-1e9, 'near death']],
  happiness: [[80, 'joyful'], [60, 'content'], [40, 'middling'], [20, 'low'], [-1e9, 'wretched']],
  looks: [[85, 'striking'], [70, 'handsome'], [55, 'pleasing'], [40, 'plain'], [25, 'homely'], [-1e9, 'ill-favoured']],
  renown: [[80, 'famous across the realms'], [60, 'known in the realm'], [40, 'known in the province'], [20, 'known locally'], [5, 'known to the neighbours'], [-1e9, 'unknown']],
  honor: [[80, 'spotless'], [60, 'honourable'], [40, 'decent'], [20, 'doubted'], [-1e9, 'disgraced']],
  piety: [[80, 'saintly'], [60, 'devout'], [40, 'observant'], [20, 'lax'], [-1e9, 'faithless']],
  stability: [[80, 'rock steady'], [60, 'steady'], [40, 'uneasy'], [20, 'shaky'], [-1e9, 'near collapse']],
  legitimacy: [[80, 'unquestioned'], [60, 'accepted'], [40, 'doubted'], [20, 'contested'], [-1e9, 'usurping']],
  blood: [[80, 'unhurt'], [55, 'bloodied'], [30, 'badly hurt'], [-1e9, 'failing']],
  wind: [[75, 'fresh'], [45, 'breathing hard'], [20, 'blown'], [-1e9, 'spent']],
};
const KEY = { health: 'health', happiness: 'happiness', happy: 'happiness', looks: 'looks', renown: 'renown', fame: 'renown', honor: 'honor', honour: 'honor',
  piety: 'piety', stability: 'stability', legitimacy: 'legitimacy', blood: 'blood', wind: 'wind' };
VS.band = (k, v) => { const b = VS.BANDS[KEY[String(k).toLowerCase()]]; return b ? pick(b, +v) : String(v); };
const amount = a => (a < 3 ? 'a little' : a < 8 ? 'some' : a < 20 ? 'a lot' : 'a great deal');

// ---- the profile's vitals bars: the bar stays, the number becomes the band ---------------------------------------------
const barRow = UI.barRow;
UI.barRow = function (label, v, max, cls, pot, valTxt) {
  try {
    const l = String(label || ''), m = /data-tt="(health|happy|looks|fame|honor|piety)"/.exec(l) || /^(Health|Happiness|Looks|Renown|Honou?r|Piety)$/.exec(l);
    if (m && typeof v === 'number') return barRow.call(this, label, v, max, cls, pot, VS.band(m[1], v));
  } catch (e) {}
  return barRow.apply(this, arguments);
};

// ---- a scene's result chips: how much, not "+36" ------------------------------------------------------------------------
if (UI.SCENE && UI.SCENE.chipHtml) {
  const ch = UI.SCENE.chipHtml;
  UI.SCENE.chipHtml = function (x) {
    const h = ch.apply(this, arguments);
    try {
      if (!x || x.coin || x.trait || x.wound || typeof h !== 'string') return h;
      const up = x.d > 0, w = `${amount(Math.abs(x.d))} ${up ? 'more' : 'less'}`;
      return h.replace(/(<span aria-hidden="true">[▲▼]<\/span> )[+−-]\d+(?:\.\d+)?/, `$1${esc(w)}`);
    } catch (e) { return h; }
  };
}

// ---- the orders' trials: tiers and words, not "Fighting worth 80+ (Elite)" and "(29)" ----------------------------------
if (A.orderReqs) {
  const reqs = A.orderReqs;
  A.orderReqs = function (pc) {
    const out = reqs.apply(this, arguments);
    try {
      const statKey = Object.fromEntries(Object.entries(GD.STAT_NAMES || {}).map(([k, n]) => [n, k]));
      for (const x of out || []) {
        let m;
        if ((m = /^Fighting worth (\d+)\+ \(([^)]+)\)$/.exec(x.label))) { x.label = `Fighting worth: ${m[2]} or better`; if (typeof x.have === 'number') x.have = A.tierOf(x.have).n; }
        else if ((m = /^(Renown|Honor) (\d+)\+$/.exec(x.label))) { x.label = `${m[1]}: ${VS.band(m[1], +m[2])} or more`; if (typeof x.have === 'number') x.have = VS.band(m[1], x.have); }
        else if ((m = /^(.+) (\d+)\+ \(the body to keep up\)$/.exec(x.label)) && statKey[m[1]]) { const k = statKey[m[1]]; x.label = `${m[1]}: ${VS.statWord(pc, k, +m[2])} or better (the body to keep up)`; if (typeof x.have === 'number') x.have = VS.statWord(pc, k, x.have); }
        else if ((m = /^(.+) (\d+)\+$/.exec(x.label))) { x.label = `${m[1]}: ${VS.tierOf(+m[2]).name} or better`; if (typeof x.have === 'number') x.have = VS.tierOf(x.have).name; }
      }
    } catch (e) { console.error('v2 order trials', e); }
    return out;
  };
}

// ---- the odds popover on a check: words only, the same words as the badge and the chip ---------------------------------
const dWord = d => (d <= 30 ? 'an easy test' : d <= 40 ? 'a fair test' : d <= 50 ? 'a typical test' : d <= 60 ? 'a hard test' : d <= 70 ? 'a very hard test' : 'a test few pass');
const nameOf = k => (GD.STATS.includes(k) ? (GD.STAT_NAMES || {})[k] || k : (GD.SKILLS || {})[k] || k);
if (UI.TIPS && UI.TIPS.odds && UI.TT && UI.TT.choiceOf) {
  const odds0 = UI.TIPS.odds;
  UI.TIPS.odds = function (vi) {
    let h;
    try {
      const X = UI.TT.choiceOf(vi), p = A.pc(), ck = X && X.c && X.c.check;
      if (X && p && ck && !ck.fight && X.vc && X.vc.odds != null) {
        const o = VS.oddsOf(X.vc.odds), val = k => (UI.SCENE && UI.SCENE.valueOf ? UI.SCENE.valueOf(p, k) : GD.STATS.includes(k) ? A.stat(p, k) : A.skill(p, k));
        h = `<div class="tip-h">The odds <span class="muted">${esc(o.words)}</span></div>`;
        for (const k of [ck.s, ck.s2].filter(Boolean)) h += `<div class="tip-row"><span>Your ${esc(String(nameOf(k)).split(/[:(]/)[0].trim())}</span><b>${esc(VS.valueWord(p, k, val(k)))}</b></div>`;
        h += `<div class="tip-row"><span>The test</span><b>${esc(dWord(ck.d || 45))}</b></div>`;
        h += `<div class="tip-f">${esc(o.line)} A careless moment can lose what you should win; will, when it matters, can win what you should lose.</div>`;
        return h;
      }
    } catch (e) { console.error('v2 odds popover', e); }
    h = odds0.apply(this, arguments);
    return typeof h === 'string' ? h.replace(/On Realism the odds are not shown in numbers\. ?/g, '') : h;
  };
}
// the choice's risk word is the v2 odds word everywhere it is drawn (the badge, 59's popover header, 92's card)
const view = A.eventView;
A.eventView = function () {
  const v = view.apply(this, arguments);
  try { if (v && v.choices) for (const c of v.choices) if (c && c.odds != null) c.risk = VS.oddsText(c.odds); } catch (e) {}
  return v;
};

// ---- numbers in text: the 0-100 scales as bands, tier numbers dropped -------------------------------------------------
const VITAL_RE = /\b(Health|Happiness|Looks|Renown|Honou?r|Piety|Stability|Legitimacy|Blood|Wind)(\s*[:·—–-]?\s*)(\d{1,3})\b(?!\s*(?:suns?|years?|days?|months?|men|km|kg|cm|ms|hours?|levies|[/,.]\d|→))/gi;
const TIER = '(Untrained|Brawler|Trained|Veteran|Elite|Master|Champion|Legend|Hero|Novice|Apprentice|Journeyman|Adept|Expert|Grandmaster)';
VS.NUMRULES = [
  [/\ball of it from doing, the rest from practice/g, () => 'all of it from doing'],
  [/\bnone of it from doing, the rest from practice/g, () => 'all of it from practice'],
  [/\b([A-Z][A-Za-z&' ]{1,28}?) (\d{1,3})\s?→\s?(\d{1,3})\b/g, (m, n, a, b) => `${n} ${+b >= +a ? 'up' : 'down'}${Math.abs(b - a) >= 5 ? ' a good deal' : ' a little'}`],
  [/\b(STR|SPD|INS|STA|INT|WIL) ([+−-])\d{1,2}\b/g, (m, k, s) => `${k} ${s === '+' ? 'up' : 'down'}`],
  [/ fighter \((\d{1,3})\)/g, () => ' fighter'],
  [new RegExp(`\\b${TIER} · (\\d{1,3})\\b(?! levies)`, 'g'), (m, t) => t],
  [/(Most (?:feared|loved|trusted|hated|respected)[^\d\n]{0,40}?) (\d{1,3})\b/g, (m, a) => a],
  [VITAL_RE, (m, k, sep, v) => `${k}${sep || ' '}${VS.band(k, +v)}`],
];
const statKeyOf = name => { for (const k in GD.STAT_NAMES || {}) if (GD.STAT_NAMES[k] === name) return k; return null; };
const skillKeyOf = name => { for (const k in GD.SKILLS || {}) if (GD.SKILLS[k] === name) return k; return null; };
VS.deNum = function (t, node) {
  if (typeof t !== 'string') return t;
  const pc = A.S && A.pc && A.pc();
  if (/piety/i.test(t)) t = VS.dePiety(t);
  if (!/\d/.test(t)) return t;
  const par = node && node.parentNode;
  // the training picker: "Strength — 29", "Survival & hunting — 62"
  if (par && par.nodeName === 'OPTION' && pc) {
    const m = /^(.+?) — (\d{1,3})$/.exec(t.trim());
    if (m) { const sk = statKeyOf(m[1]); return `${m[1]} — ${sk ? VS.statWord(pc, sk, +m[2]) : VS.tierOf(+m[2]).name}`; }
  }
  // a number in an element of its own beside its label ("Health <b>97</b>")
  if (par && /^\s*\d{1,3}\s*$/.test(t) && par.nodeType === 1 && par.childNodes.length === 1 && !par.closest('[data-tt="initiative"]')) {
    const prev = par.previousSibling, m = prev ? LABELS.exec(prev.textContent || '') : null;
    if (m) return VS.band(m[1], +t);
  }
  let s = t;
  for (const [re, fn] of VS.NUMRULES) s = s.replace(re, fn);
  return s;
};
// piety for the faithless is a pull toward the faith, and said so
VS.dePiety = function (t) {
  const pc = A.S && A.pc && A.pc();
  if (!pc || VS.hasFaith(pc) || typeof t !== 'string' || !/piety/i.test(t)) return t;
  return t.replace(/\bmuch more piety\b/g, 'a strong pull toward the faith').replace(/\bmore piety\b/g, 'a pull toward the faith')
    .replace(/\bmuch less piety\b/g, 'a strong pull away from the faith').replace(/\bless piety\b/g, 'a pull away from the faith');
};
const LABELS = /(health|happiness|looks|renown|honou?r|piety|stability|legitimacy|blood|wind)\s*[:·]?\s*$/i;
