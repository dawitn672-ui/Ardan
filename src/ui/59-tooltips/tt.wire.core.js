// Nested tooltips: where they go. Small wrappers around the release's render functions add data-tt triggers to the
// numbers that had none, by string insertion on the HTML the original returns (as 61-illumination does). Each wrapper
// calls the original first and gives its output back unchanged if anything goes wrong, or while UI.TT.wired is off.
//
// The profile (desktop side panel and the phone's You page): health, happiness, looks, renown, honor, piety and their
// numbers; each stat's number (its name already opened the release's stat tip); the trait, quirk, faith, people and
// blood chips (they keep their titles, which the engine lifts while a popover is open); the best proficiencies.
// The top bar: the date and age, initiative, coin. The Realm tab (as ruler): treasury, stability, legitimacy, war
// weariness, infamy. People: each opinion bar. The Life tab: the needs card of 35-moods, when it is in the build.
(function () {
  const TT = UI.TT;
  const reEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const safe = (name, f) => function () {
    const h = f.apply(this, arguments);
    if (!TT.wired || typeof h !== 'string') return h;
    try { return TT.wire[name].call(this, h, ...arguments); } catch (e) { console.error('tooltips ' + name, e); return h; }
  };
  TT.wire = {};

  // a bar row: <div class="barrow"><span class="lbl">LABEL</span>BAR<span class="val">V</span></div>
  // pick(label) gives [key, arg, plainLabel] or null; the label becomes a trigger, the number answers to hover and tap
  TT.wireBars = function (h, pick) {
    return h.replace(/<div class="barrow"><span class="lbl">([\s\S]*?)<\/span>(<div class="bar[^"]*">[\s\S]*?<\/div>)<span class="val">/g, (m, lbl, bar) => {
      const k = pick(lbl); if (!k) return m;
      const [key, arg] = k, label = /data-t[it]/.test(lbl) ? lbl : UI.tt(key, arg, lbl);
      return `<div class="barrow"><span class="lbl">${label}</span>${bar}<span class="val"${UI.ttAttrs(key, arg, false)}>`;
    });
  };
  const PROFILE_BARS = { Health: 'health', Happiness: 'happy', Looks: 'looks', Renown: 'fame', Honor: 'honor', Piety: 'piety' };

  TT.wire.renderProfile = function (h) {
    const pc = A.pc(); if (!pc) return h;
    h = TT.wireBars(h, lbl => {
      if (PROFILE_BARS[lbl]) return [PROFILE_BARS[lbl], ''];
      const m = /data-tip="stat:(\w+)"/.exec(lbl); return m ? ['stat', m[1]] : null;
    });
    // chips: each keeps its title (other features write their reasons there); the popover says it and more, and the
    // engine lifts the title while the popover is open so the browser does not repeat it
    const chip = (re, key, arg) => { h = h.replace(re, m => m.slice(0, -1) + UI.ttAttrs(key, arg) + '>'); };
    for (const t of pc.traits || []) { const T = GD.TRAITS[t]; if (T) chip(new RegExp(`<span class="chip" title="[^"]*">(?=${reEsc(T.name)}</span>)`), 'trait', t); }
    for (const q of pc.quirks || []) { const Q = GD.QUIRKS && GD.QUIRKS[q]; if (Q) chip(new RegExp(`<span class="chip" title="[^"]*">(?=${reEsc(Q.name)}</span>)`), 'quirk', q); }
    const fa = A.faith(pc.faith);
    if (fa) chip(new RegExp(`<span class="chip" title="[^"]*">(?=${reEsc(UI.esc(fa.name))}</span>)`), 'faith', pc.faith);
    const R2 = GD.RACES[pc.race];
    if (R2) h = h.replace(`<span class="chip">${UI.esc(R2.name)}</span>`, `<span class="chip"${UI.ttAttrs('race', pc.race)}>${UI.esc(R2.name)}</span>`);
    chip(/<span class="chip blood" title="[^"]*">/, 'blood', '');
    // 49-body-mind's body under the stats: each wound opens what it costs
    const bi = h.indexOf('<div class="row bm-body"');
    if (bi > 0) {
      let body = h.slice(bi);
      for (const k of [...new Set((pc.wounds || []).map(w => w && w.k).filter(k => GD.WOUNDS[k]))]) {
        const nm = UI.esc(GD.WOUNDS[k].name);
        body = body.replace(new RegExp(`<span class="(bad|ink2)">(?=${reEsc(nm)})`), (m, c) => `<span class="${c}"${UI.ttAttrs('wound', k)}>`);
      }
      h = h.slice(0, bi) + body;
    }
    // the best proficiencies: each row opens its skill
    const byName = {}; for (const k in GD.SKILLS) byName[UI.esc(GD.SKILLS[k])] = k;
    h = h.replace(/<div class="prow" title="[^"]*"><span>([^<]*)/g, (m, nm) => byName[nm] ? `<div class="prow"${UI.ttAttrs('skill', byName[nm])} aria-label="${UI.esc(nm)}: ${A.skill(pc, byName[nm])}"><span>${nm}` : m);
    return h;
  };
  TT.wire.clkHtml = function (h) {
    if (!A.pc()) return h;
    return h.replace('<span class="clk-date" title="Today">', `<span class="clk-date"${UI.ttAttrs('date', '')} aria-label="Today: ${UI.esc(A.dateStr())}, age ${A.age(A.pc())}">`)
      .replace(/<span class="clk-ini" title="[^"]*">/, `<span class="clk-ini"${UI.ttAttrs('initiative', '')} aria-label="Initiative ${(A.S.time || 0).toFixed(1)} of ${A.initiativeCap(A.pc())}">`);
  };
  TT.wire.renderTop = function (h) {
    const pc = A.pc(); if (!pc) return h;
    return h.replace('<span title="Coin">', `<span class="top-coin"${UI.ttAttrs('coin', '')} aria-label="Coin: ${UI.esc(A.coin(pc.coin))}${pc.debt ? ', debt ' + UI.esc(A.coin(pc.debt)) : ''}">`);
  };
  const REALM_BARS = { Stability: 'realmStab', Legitimacy: 'realmLegit', 'War weariness': 'realmWeary', Infamy: 'infamy' };
  TT.wire.realmTab = function (h) {
    const r = A.myRealm && A.myRealm(); if (!r) return h;
    h = TT.wireBars(h, lbl => REALM_BARS[lbl] ? [REALM_BARS[lbl], r.id] : null);
    return h.replace('<div>Treasury</div><div><b>', `<div>${UI.tt('realmGold', r.id, 'Treasury')}</div><div><b${UI.ttAttrs('realmGold', r.id, false)}>`);
  };
  TT.wire.peopleList = function (h) {
    return h.replace(/<div class="card person click" data-a="ov" data-v="person:([^"]+)">([\s\S]*?)<div class="opbar" title="Opinion (-?\d+)">/g,
      (m, id, mid, op) => `<div class="card person click" data-a="ov" data-v="person:${id}">${mid}<div class="opbar"${UI.ttAttrs('opinion', id, false)} role="img" aria-label="Opinion ${op}">`);
  };
  // the full profile: the stat bars (current / potential) and the renown line
  TT.wire.profileModal = function (h, p) {
    if (!p || p.id !== A.S.pc) return h;
    const byStat = {}; for (const k of GD.STATS) byStat[GD.STAT_NAMES[k]] = k;
    h = TT.wireBars(h, lbl => byStat[lbl] ? ['stat', byStat[lbl]] : null);
    return h.replace(/<div>Renown<\/div><div>(\d+) · honor (\d+) · piety (\d+)<\/div>/, (m, f, ho, pi) =>
      `<div>${UI.tt('fame', '', 'Renown')}</div><div><span${UI.ttAttrs('fame', '', false)}>${f}</span> · ${UI.tt('honor', '', 'honor ' + ho)} · ${UI.tt('piety', '', 'piety ' + pi)}</div>`);
  };
  // 35-moods' card on the Life tab
  const NEED = { Rest: 'rest', Company: 'company', Purpose: 'purpose', Comfort: 'comfort' };
  TT.wire.lifeTab = function (h) {
    if (!A.MOODS || h.indexOf('class="card small moods"') < 0) return h;
    h = h.replace(/<span style="min-width:64px">(Rest|Company|Purpose|Comfort)<\/span>([\s\S]*?)<span class="muted" style="min-width:24px;text-align:right">/g,
      (m, nm, mid) => `<span style="min-width:64px">${UI.tt('need', NEED[nm], nm)}</span>${mid}<span class="muted" style="min-width:24px;text-align:right"${UI.ttAttrs('need', NEED[nm], false)}>`);
    const m = A.MOODS.mood(A.pc());
    h = h.replace('<b>How you are</b>', `<b>${UI.tt('needs', '', 'How you are')}</b>`);
    if (m) h = h.replace(new RegExp(`(<div class="card small moods"[\\s\\S]*?)<span class="right (bad|good)">${reEsc(UI.esc(m.name))}</span>`), (x, pre, c) => `${pre}<span class="right ${c}">${UI.tt('mood', m.k, UI.esc(m.name))}</span>`);
    return h;
  };

  UI.renderProfile = safe('renderProfile', UI.renderProfile);
  if (UI.profileModal) UI.profileModal = safe('profileModal', UI.profileModal);
  UI.clkHtml = safe('clkHtml', UI.clkHtml);
  UI.renderTop = safe('renderTop', UI.renderTop);
  UI.peopleList = safe('peopleList', UI.peopleList);
  if (UI.realmTabBasic) UI.realmTabBasic = safe('realmTab', UI.realmTabBasic);
  UI.TAB.life = safe('lifeTab', UI.TAB.life);
})();
