// Nested tooltips, part two: where the new entries go. Each wrapper takes the HTML a screen's own function returns
// and adds triggers to its numbers by string insertion, as tt.wire.core.js does; it returns the HTML unchanged on any
// error and while UI.TT.wired is off. They are installed when the game starts (TT.installLater, at UI.init), after
// every feature's code has run, so they wrap the screens as the last feature left them. A feature that is not in the
// build simply leaves its markers out, and the wrapper finds nothing to do.
(function () {
  const TT = UI.TT, W = TT.wire2, esc = TT.K.esc;
  const reEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const N = (key, arg, label, o) => UI.ttNum(key, arg, label, o);
  const A_ = (key, arg) => UI.ttAttrs(key, arg, false);

  // ---- Holdings -------------------------------------------------------------------------------------------------------
  W.holdings = function (h, p) {
    const pc = p || A.pc(); if (!pc) return h;
    // the purse
    h = h.replace(/<div>Coin<\/div><div><b>([^<]*)<\/b><\/div>/, (m, v) => `<div>${UI.tt('coin', '', 'Coin')}</div><div><b${A_('coin', '')}>${v}</b></div>`)
      .replace(/<div>Debt<\/div><div class="bad">([^<]*)<\/div>/, (m, v) => `<div>${UI.tt('debt', '', 'Debt')}</div><div class="bad"${A_('debt', '')}>${v}</div>`)
      .replace(/<div>Family purse<\/div><div>([^<]*)<\/div>/, (m, v) => `<div>Family purse</div><div${A_('coin', '')}>${v}</div>`)
      .replace(/<div>Everything you own<\/div><div>([^<]*)<\/div>/, (m, v) => `<div>${UI.tt('worthAll', '', 'Everything you own')}</div><div${A_('worthAll', '')}>${v}</div>`);
    // the money book: each line, and the sum
    const book = (which, seg) => {
      const B = pc.riPurse && (which === 'last' ? pc.riPurse.last : pc.riPurse.cur); if (!B) return seg;
      const byLabel = {}; for (const k in B.lines || {}) { const x = B.lines[k]; if (x && x[1]) byLabel[esc(x[0])] = k; }
      return seg.replace(/<tr><td>([^<]*)<\/td><td class="(good|bad)" style="text-align:right">([^<]*)<\/td><\/tr>/g, (m, lab, c, v) => byLabel[lab] ?
        `<tr><td>${UI.tt('purseLine', which + '|' + byLabel[lab], lab)}</td><td class="${c}" style="text-align:right"${A_('purseLine', which + '|' + byLabel[lab])}>${v}</td></tr>` : m)
        .replace(/<tr><td><b>All told<\/b><\/td><td style="text-align:right"><b>([^<]*)<\/b><\/td><\/tr>/, (m, v) => `<tr><td><b>${UI.tt('purseTotal', which, 'All told')}</b></td><td style="text-align:right"><b${A_('purseTotal', which)}>${v}</b></td></tr>`);
    };
    h = TT.within(h, '<b>This year, since New Year', '<div class="tiny" style="margin-top:6px"><b>The year before', s => book('cur', s));
    h = TT.within(h, '<b>The year before (', '<div class="tiny muted">Regular income', s => book('last', s));
    // what you carry
    h = h.replace(/<div class="card small gear-c"><span class="tag">(\w+)<\/span><div><b>([^<]*)<\/b>((?:(?!<\/div>)[\s\S])*)<\/div><div class="muted">([^<]+)<\/div>/g,
      (m, slot, nm, q, stat) => `<div class="card small gear-c"><span class="tag">${slot}</span><div><b>${UI.tt('gearSlot', slot, nm)}</b>${q}</div><div class="muted"${A_('gearSlot', slot)}>${stat}</div>`);
    // the armorer
    const q = UI.shopQ || 'common';
    h = h.replace(/<tr><td>([^<]*)((?:<span class="chip[^>]*>[^<]*<\/span>)?)<\/td><td class="small">([^<]*)<\/td><td>([^<]*)<\/td><td><button class="small" data-a="buyGearQ" data-v="([^"]+)"/g,
      (m, nm, chip, stat, price, k) => `<tr><td>${UI.tt('shopItem', k + '|' + q, nm)}${chip}</td><td class="small"${A_('shopItem', k + '|' + q)}>${stat}</td><td${A_('shopItem', k + '|' + q)}>${price}</td><td><button class="small" data-a="buyGearQ" data-v="${k}"`);
    // the market: what you carry, the carts, each good's price and your loads
    h = h.replace(/<span class="small">Carrying <b>(\d+)<\/b> \/ (\d+) loads<\/span>/, (m, a, b) => `<span class="small"${A_('cargo', '')}>${UI.tt('cargo', '', 'Carrying')} <b>${a}</b> / ${b} loads</span>`)
      .replace(/<button class="small" data-a="buyTransport" data-v="(\w+)"/g, (m, k) => `${m}${A_('transport', k)}`);
    h = h.replace(/<tr><td>([^<]*?) ((?:<span class="chip[^>]*>[^<]*<\/span>)?)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td>(<td class="[^"]*hide-s"[^>]*>[\s\S]*?<\/td>)<td>([^<]*)<\/td><td class="nowrap"><button class="small" data-a="mktBuy" data-v="(\w+)\|1"/g,
      (m, nm, tag, b, s, here, mine, k) => `<tr><td>${UI.tt('mktPrice', k + '|buy', nm)} ${tag}</td><td${A_('mktPrice', k + '|buy')}>${b}</td><td${A_('mktPrice', k + '|sell')}>${s}</td>${here}<td${mine ? A_('cargo', '') : ''}>${mine}</td><td class="nowrap"><button class="small" data-a="mktBuy" data-v="${k}|1"`);
    // the nearest market towns (66-markets): the road, the carting and the prices there
    if (A.MT && A.MT.on && A.MT.on() && h.indexOf('class="t small mt-t"') > 0) {
      const cargo = pc.cargo || {}, Gd = GD.GOODS, k = UI.mtGood && Gd[UI.mtGood] ? UI.mtGood : Object.keys(cargo).find(x => cargo[x] > 0) || 'grain';
      h = TT.within(h, '<table class="t small mt-t">', '</table>', seg => seg
        .replace(/(<tr class="sel"><td>[\s\S]*?<\/td><td class="muted">—<\/td><td class="muted">—<\/td>)<td>([^<]*)<\/td><td>([^<]*)<\/td>/, (m, pre, b, s) => `${pre}<td${A_('mktPrice', k + '|buy')}>${b}</td><td${A_('mktPrice', k + '|sell')}>${s}</td>`)
        .replace(/<tr><td>([\s\S]*?)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><td><button class="small" data-a="mtTrip" data-v="(\d+)"/g,
          (m, nm, road, cart, b, s, pid) => `<tr><td>${nm}</td><td${A_('mtRoad', pid)}>${road}</td><td${A_('mtCart', pid + '|' + k)}>${cart}</td><td${A_('mktPrice', k + '|buy|' + pid)}>${b}</td><td${A_('mktPrice', k + '|sell|' + pid)}>${s}</td><td><button class="small" data-a="mtTrip" data-v="${pid}"`));
    }
    // the trade roads, and the plan of a run
    h = h.replace(/<tr class="[^"]*"><td>([\s\S]*?)<\/td><td>([^<]*)<\/td><td class="([^"]*)">([^<]*)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><td><button class="small" data-a="runDest" data-v="([^"]+)">/g,
      (m, to, good, c, mg, days, risk, id) => m.replace(`<td class="${c}">${mg}</td><td>${days}</td><td>${risk}</td>`, `<td class="${c}"${A_('tradeRun', id)}>${mg}</td><td${A_('tradeRun', id)}>${days}</td><td${A_('runRisk', id)}>${risk}</td>`)
        .replace(`<td>${to}</td>`, `<td>${UI.tt('tradeRun', id, to)}</td>`));
    if (UI.run && UI.run.dest) h = TT.within(h, '<div class="run-plan">', '<div class="row" style="margin-top:6px"><button class="primary small" data-a="runGo"', seg => TT.inText(seg, /\d[\d,.]*(?:%| suns| km| days)?/g, m => N('runPlan', UI.run.dest, m)));
    // property: what you hold, and the table
    (pc.assets || []).forEach((a, i) => {
      if (!a || !GD.PROPERTY[a.k]) return;
      h = h.replace(new RegExp(`(<span class="muted">)([^<]*· income ~[^<]*)(</span><span class="right"></span><button class="small" data-a="sellProp" data-v="${i}">)`), (m, x, t, y) => `<span class="muted"${A_('prop', a.k)}>${t}${y}`);
    });
    h = h.replace(/<tr><td>([^<]*)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><td><button class="small" data-a="buyProp" data-v="(\w+)"/g,
      (m, nm, inc, up, price, k) => `<tr><td>${UI.tt('prop', k, nm)}</td><td${A_('prop', k)}>${inc}</td><td${A_('prop', k)}>${up}</td><td${A_('prop', k)}>${price}</td><td><button class="small" data-a="buyProp" data-v="${k}"`);
    h = h.replace(/<button class="small" data-a="riRebuild" data-v="(\d+)"/g, (m, i) => { const a = pc.assets[+i]; return a ? m + A_('prop', a.k) : m; });
    // the tables' last columns hold only buttons; a header word for each, so a screen reader can name the column
    h = h.replace('<th>Price</th><th></th></tr>', '<th>Price</th><th class="tiny muted">Buy</th></tr>')
      .replace('<th>Yours</th><th></th></tr>', '<th>Yours</th><th class="tiny muted">Trade</th></tr>')
      .replace('<th>Buy</th><th>Sell</th><th></th></tr>', '<th>Buy</th><th>Sell</th><th class="tiny muted">Go</th></tr>')
      .replace('<th>Danger</th><th></th></tr>', '<th>Danger</th><th class="tiny muted">Plan</th></tr>')
      .replace(/<th>Upkeep<\/th><th>Price<\/th><th class="tiny muted">Buy<\/th><\/tr>|<th>Upkeep<\/th><th>Price<\/th><th><\/th><\/tr>/, '<th>Upkeep</th><th>Price</th><th class="tiny muted">Buy</th></tr>');
    return TT.wireCosts(h);
  };
  TT.wireLater(() => UI.TAB, 'holdings', 'holdings');
  // ---- costs anywhere: initiative (⧗) on an action, and a price in a button's words; hover (the tap is the action's)
  TT.wireCosts = function (h) {
    return h.replace(/<span class="cost">(\d+)⧗<\/span>/g, (m, n) => `<span class="cost"${A_('initiative', '')}>${n}⧗</span>`)
      .replace(/(<button\b[^>]*>)([^<]*?)\((\d+)⧗\)/g, (m, b, t, n) => /data-tt=/.test(b) ? m : `${b}${t}(${N('initiative', '', n + '⧗')})`)
      .replace(/(<button\b[^>]*>)([^<]*?)\(([\d,]+) suns?\)/g, (m, b, t, n) => /data-tt=/.test(b) ? m : `${b}${t}(${N('cost', n.replace(/,/g, ''), n + ' suns')})`)
      .replace(/(<button\b[^>]*>)([^<]*?)\(([\d,]+)\)<\/button>/g, (m, b, t, n) => /data-tt=/.test(b) ? m : `${b}${t}(${N('cost', n.replace(/,/g, ''), n)})</button>`);
  };

  // ---- the Path tab --------------------------------------------------------------------------------------------------
  W.pathsList = function (h) {
    h = h.replace(/<span class="grow" title="([^"]*)"><b>([^<]*)<\/b> <span class="tiny muted">start as ([^·<]*) · ([^<]*?\/yr)([\s\S]*?)<\/span><\/span><span class="tiny ([^"]*)">(\d+)%<\/span><button class="small" data-a="applyJob" data-v="(\w+)"/g,
      (m, ti, nm, title, pay, rest, c, n, k) => `<span class="grow" title="${ti}"><b${A_('career', k)}>${nm}</b> <span class="tiny muted">start as ${title} · <span${A_('career', k)}>${pay}</span>${rest}</span></span><span class="tiny ${c}"${UI.ttAttrs('jobOdds', k)}>${n}%</span><button class="small" data-a="applyJob" data-v="${k}"`);
    return TT.wireCosts(h);
  };
  W.jobPathCard = function (h, p) {
    const pc = p || A.pc(); if (!pc || !pc.job) return h;
    h = h.replace(/<div class="small muted">([\d,.]+ suns?\/yr)/, (m, v) => `<div class="small muted">${N('pay', '', v, { focus: true })}`);
    h = TT.wireBars(h, lbl => lbl === 'Performance' ? ['perf', ''] : lbl === 'Reputation' ? ['rep', ''] : null);
    h = h.replace(/<div class="wr-board"><div class="small"><b>To become ([^<]*?) \(([^)]*)\)<\/b>/, (m, t, pay) => `<div class="wr-board"><div class="small"><b>To become ${t} (${N('career', pc.job.c, pay)})</b>`);
    return TT.wireCosts(h.replace(/<span class="right tag">(\d+)⧗<\/span>/g, (m, n) => `<span class="right tag"${A_('initiative', '')}>${n}⧗</span>`));
  };
  // a board's rows, in the order the board gives them
  const boardRows = (h, b, kind) => {
    if (!b || !b.length) return h;
    let i = 0;
    return h.replace(/<div class="tiny row">([\s\S]*?)<span class="grow">([\s\S]*?)<\/span><b>([^<]*)<\/b><\/div>/g, (m, ic, lab, v) => {
      const x = b[i++]; if (!x) return m;
      return `<div class="tiny row">${ic}<span class="grow"${/\d/.test(lab) ? A_('board', kind + '|' + x.k) : ''}>${lab}</span><b${UI.ttAttrs('board', kind + '|' + x.k)}>${v}</b></div>`;
    });
  };
  W.boardHtml = function (h, b) { return boardRows(h, b, 'job'); };
  W.promoBoardHtml = function (h, p) {
    const pc = p || A.pc(); if (!pc || !pc.mil) return h;
    h = h.replace(/<b>Promotion board — ([^<]*)<\/b> <span class="tiny muted">\(leads ([^)]*)\)<\/span>/, (m, t, n) => `<b>${UI.tt('promoOdds', 'mil', 'Promotion board — ' + t)}</b> <span class="tiny muted">(${N('milRank', '', 'leads ' + n)})</span>`);
    return boardRows(h, A.promoBoard(pc), 'mil');
  };
  W.armyPathCard = function (h, p) {
    const pc = p || A.pc(); if (!pc || !pc.mil) return h;
    return h.replace(/(<div class="small muted">)([^<]*· leads [^<]*?)( · merit )(\d+)(<\/div>)/, (m, a, t, b, n, c) => `${a}${N('milRank', '', t, { focus: true })}${b}${N('merit', '', n)}${c}`);
  };
  W.superiorCard = function (h, p) {
    const pc = p || A.pc(), b = pc && A.superior && A.superior(pc); if (!b) return h;
    return TT.wireBars(h, lbl => lbl === 'Their opinion' ? ['opinion', b.id] : null);
  };
  W.councilCard = function (h, p) {
    const pc = p || A.pc(), seat = pc && A.COUNCIL[pc.office]; if (!seat) return h;
    const nm = UI.esc(GD.SKILLS[seat.skill]);
    return TT.wireCosts(h.replace(new RegExp(`· ${reEsc(nm)} (\\d+)`), (m, n) => `· ${N('skill', seat.skill, nm + ' ' + n)}`));
  };
  W.specCard = function (h) { return h.replace(/pay ×([\d.]+)/g, (m, v) => N('pay', '', m)); };
  W.pathTab = function (h, p) {
    const pc = p || A.pc(); if (!pc) return h;
    if (pc.school) h = h.replace(/ — year (\d+)/, (m, n) => ` — ${N('school', '', 'year ' + n, { focus: true })}`).replace(/ · ([\d,.]+ suns?)\/yr<div class="row"/, (m, v) => ` · ${N('school', '', v + '/yr')}<div class="row"`);
    // how you live: the cost of each way
    h = h.replace(/(<span class="muted small">)([\d,.]+ (?:suns?|pence)\/yr)(<\/span>)/g, (m, a, v, b) => `<span class="muted small"${A_('lifestyle', '')}>${v}${b}`);
    return TT.wireCosts(h);
  };
  for (const k of ['pathsList', 'jobPathCard', 'boardHtml', 'promoBoardHtml', 'armyPathCard', 'superiorCard', 'councilCard', 'specCard']) TT.wireLater(() => UI, k, k);
  TT.wireLater(() => UI.TAB, 'path', 'pathTab');

  // ---- the War tab and the War Room ---------------------------------------------------------------------------------
  W.wrBars = function (h, d) { return d ? h.replace('<div class="wr-bars" title=', `<div class="wr-bars"${A_('divStr', d.id)} title=`) : h; };
  W.wrDivStatus = function (h, d) {
    if (!d) return h;
    return h.replace(/<span class="chip( red| gold)?">((?:(?!<\/span>)[\s\S])*?\d(?:(?!<\/span>)[\s\S])*?)<\/span>/g, (m, c, body) => `<span class="chip${c || ''}"${A_(/supply/.test(body) ? 'divSup' : 'divStr', d.id)}>${body}</span>`);
  };
  const STAT_KEYS = ['soft', 'hard', 'def', 'brk', 'org', 'hp', 'w', 'sup', 'spd', 'arm', 'prc', 'exp'];
  W.wrStatGrid = function (h, d) {
    if (!d) return h;
    let i = 0;
    return h.replace(/<div title="([^"]*)"><span>/g, (m, t) => { const k = STAT_KEYS[i++]; return k ? `<div title="${t}"${UI.ttAttrs('divStat', d.id + '|' + k)}><span>` : m; });
  };
  W.wrArmyRow = function (h, a) {
    if (!a) return h;
    h = h.replace(/(<div class="tiny muted">)([^<]*· \d+ div · [^<]*)/, (m, x, t) => `<div class="tiny muted"${A_('army', a.id)}>${t}`);
    return h.replace(/<div class="tiny"><b>(Bold|Cautious|Cunning|Steady)<\/b>/, (m, t) => `<div class="tiny"${A_('temper', a.id)}><b>${t}</b>`);
  };
  W.wrArmyPanel = function (h, a) {
    if (!a) return h;
    const g = a.gen ? A.P(a.gen) : null;
    if (g) h = h.replace(/(<div class="small">)([^<]*· command \d+ · tactics \d+ · logistics \d+)(<\/div>)/, (m, x, t, y) => `${x}${N('genSkills', g.id, t, { focus: true })}${y}`);
    h = h.replace(/<div class="tiny muted">(\d+\/24 divisions · [^<]*)<\/div>/, (m, t) => `<div class="tiny muted">${N('army', a.id, t, { focus: true })}</div>`);
    h = TT.wireBars(h, lbl => ({ Organization: ['armyOrg', a.id], Planning: ['armyPlan', a.id], Supply: ['armySup', a.id] })[lbl] || null);
    return h;
  };
  // the division panel (wrapped whole: UI.wrDivPanel reads the markup of UI.wrDivPanelBasic)
  W.wrDivPanel = function (h, ids) {
    const ds = (ids || []).map(A.divById).filter(Boolean); if (!ds.length) return h;
    if (ds.length > 1) return h.replace(/<b>(\d+) divisions<\/b><span class="right tiny muted">([^<]*)<\/span>/, (m, n, men) => `<b>${n} divisions</b><span class="right tiny muted"${A_('divMen', ds[0].id)}>${men}</span>`)
      .replace(/<div class="tiny muted">((?:[A-Z][a-z]+ \d+%(?: · )?)+)<\/div>/, (m, t) => `<div class="tiny muted"${A_('divMen', ds[0].id)}>${t}</div>`);
    const d = ds[0];
    h = TT.wireBars(h, lbl => ({ Organization: ['divOrg', d.id], Men: ['divMen', d.id], Equipment: ['divEq', d.id], Experience: ['divExp', d.id] })[lbl] || null);
    h = h.replace(/<div class="tiny">((?:Planning|Dug in| · supply)[^<]*)<\/div>/, (m, t) => `<div class="tiny"${A_('divStr', d.id)}>${t}</div>`)
      .replace(/<div class="tiny muted wr-comp">/, `<div class="tiny muted wr-comp"${A_('divMen', d.id)}>`)
      .replace(/<div class="tiny muted">(Record: [^<]*)<\/div>/, (m, t) => `<div class="tiny muted">${N('divRecord', d.id, t)}</div>`)
      .replace(/<div class="tiny">([\d,]+± men, by the campfires\.)<\/div>/, (m, t) => `<div class="tiny">${N('divIntel', '', t, { focus: true })}</div>`)
      .replace(/<div class="bn-g"([^>]*)>/g, (m, at) => /data-tt/.test(at) ? m : `<div class="bn-g"${at}${A_('divMen', d.id)}>`);
    return h;
  };
  W.wrForces = function (h) {
    const r = A.realm(UI.wrMyR(A.pc())); if (!r || !r.forces) return h;
    h = h.replace(/<span class="right muted">(\d+ divisions)<\/span>/, (m, t) => `<span class="right muted"${A_('host', r.id)}>${t}</span>`);
    h = TT.wireBars(h, lbl => lbl === 'Men' ? ['host', r.id] : null);
    h = h.replace(/<div class="tiny muted">(Manpower pool [^<]*)<\/div>/, (m, t) => `<div class="tiny muted">${N('host', r.id, t, { focus: true })}</div>`);
    for (const a of A.armiesOf(r.id)) h = h.replace(`data-a="wrSelArmy" data-v="${a.id}">${UI.esc(a.name)}</span><span class="right tiny muted">`, `data-a="wrSelArmy" data-v="${a.id}">${UI.esc(a.name)}</span><span class="right tiny muted"${A_('army', a.id)}>`);
    let i = 0;
    h = h.replace(/<div class="small">(<svg[\s\S]*?<\/svg>)? ?([^<]*) — ([\d,]+ men) /g, (m, ic, nm, men) => { const k = i++; return m.replace(`— ${men} `, `— ${N('training', r.id + '|' + k, men)} `); });
    return h.replace(/<span class="tiny muted">(\d+ mo)<\/span><\/div>/g, (m, t) => `<span class="tiny muted"${A_('host', r.id)}>${t}</span></div>`);
  };
  W.wrWars = function (h) {
    const myR = UI.wrMyR(A.pc());
    for (const w of A.atWar(myR)) {
      const at = h.indexOf(`<b>${UI.esc(w.name)}</b>`); if (at < 0) continue;
      h = h.slice(0, at) + h.slice(at).replace(/War score <b class="([^"]*)">([^<]*)<\/b> · ([^<]*)<\/div>/, (m, c, sc, rest) => `${UI.tt('warScore', w.id, 'War score')} <b class="${c}"${A_('warScore', w.id)}>${sc}</b> · <span${A_('warScore', w.id)}>${rest}</span></div>`)
        .replace(/(<div class="tiny">)(<span class="(?:good|bad)-t">(?:Won|Lost)<\/span> · [^<]*)(<\/div>)/g, (m, x, t, y) => `<div class="tiny"${A_('warScore', w.id)}>${t}${y}`);
    }
    const w0 = A.atWar(myR)[0];
    if (w0) h = TT.within(h, '<div class="group-h">Dispatches</div>', null, seg => seg.replace(/<div class="tiny">/g, `<div class="tiny"${A_('warScore', w0.id)}>`));
    return h;
  };
  W.wrFightRow = function (h, F0) {
    if (!F0) return h;
    return h.replace(/<span class="right tiny muted">(day \d+)<\/span>/, (m, t) => `<span class="right tiny muted"${A_('fight', F0.loc)}>${t}</span>`)
      .replace(/<div class="tiny muted">(You (?:attack|defend) · )/, (m, t) => `<div class="tiny muted"${A_('fight', F0.loc)}>${t}`);
  };
  W.wrFightPanelBasic = function (h, pid) {
    if (!(A.S.fights || {})[pid]) return h;
    h = h.replace(/<span class="right tiny muted">(day \d+)<\/span>/, (m, t) => `<span class="right tiny muted">${N('fight', pid, t, { focus: true })}</span>`)
      .replace(/<div class="tiny">([\d,]+ men · \d+ attacks\/day · [^<]*)<\/div>/g, (m, t) => `<div class="tiny"${A_('fight', pid)}>${t}</div>`)
      .replace('<div class="group-h">Modifiers</div><div class="kv tiny">', `<div class="group-h">Modifiers</div><div class="kv tiny"${A_('fight', pid)}>`)
      .replace(/<div class="tiny muted">(Losses so far: [^<]*)<\/div>/, (m, t) => `<div class="tiny muted"${A_('fight', pid)}>${t}</div>`);
    return h;
  };
  // the fight panel's day-by-day tactics and scouting (UI.wrFightPanel, around the basic panel)
  W.wrFightPanel = function (h, pid) {
    if (!(A.S.fights || {})[pid]) return h;
    return h.replace(/<div class="tiny muted">(Scouting: attackers \d+, defenders \d+)/, (m, t) => `<div class="tiny muted"><span${A_('fight', pid)}>${t}</span>`);
  };
  W.wrProvPanel = function (h, pid) { return h.replace(/<div class="kv tiny">/, `<div class="kv tiny"${A_('prov', pid)}>`); };
  // what to do next: a promotion board's line opens its odds
  W.wrCommandBasic = function (h) {
    return h.replace(/<div class="tip([^"]*)">((?:<svg[\s\S]*?<\/svg>)?)<span>(For [^<]*\d[^<]*)<\/span>/g, (m, c, ic, t) => `<div class="tip${c}">${ic}<span${A_('promoOdds', 'mil')}>${t}</span>`);
  };
  W.wrRoleCard = function (h) {
    const r = UI.wrMyR(A.pc());
    return h.replace(/<span class="muted small">(of [^<]*· [^<]*)<\/span>/, (m, t) => `<span class="muted small">${N('warFront', r, t)}</span>`);
  };
  W.wrTemplates = function (h) {
    const r = A.realm(UI.wrMyR(A.pc())); if (!r || !r.forces) return h;
    h = h.replace(/<span class="right chip gold" title="([^"]*)">/, (m, t) => `<span class="right chip gold" title="${t}"${UI.ttAttrs('host', r.id)}>`)
      .replace(/<button class="small ?(?:on)?" data-a="wrDoc" data-v="(\w+)"/g, (m, k) => m + A_('doctrine', k));
    const tpls = Object.values(r.forces.tpl), parts = h.split('<div class="card wr-tpl">');
    for (let i = 1; i < parts.length && i - 1 < tpls.length; i++) {
      const t = tpls[i - 1], arg = k => r.id + '|' + t.id + '|' + k;
      parts[i] = parts[i].replace(/<span class="tiny muted">(\d+ divisions?)<\/span>/, (m, x) => `<span class="tiny muted"${A_('host', r.id)}>${x}</span>`)
        .replace(/<div title="(\w+)"><span>/g, (m, k) => `<div title="${k}"${UI.ttAttrs('tplStat', arg(k))}><span>`)
        .replace(/<div class="tiny muted">(Equipment: [^<]*)<\/div>/, (m, x) => `<div class="tiny muted"${A_('tplStat', arg('w'))}>${x}</div>`);
    }
    return parts.join('<div class="card wr-tpl">');
  };
  W.wrIndustry = function (h) {
    const r = A.realm(UI.wrMyR(A.pc())); if (!r || !r.ind) return h;
    let i = 0;
    h = h.replace(/(<div class="wr-kpis">)([\s\S]*?)(<\/div><\/div>\s*(?:<div class="tiny warn-t">|<\/div>))/, (m, a, body, b) => {
      const keys = ['civ', 'mil', 'sold'];
      body = body.replace(/<div>(<svg[\s\S]*?<\/svg>)<b>/g, (x, ic) => `<div${UI.ttAttrs('industry', keys[i++] || 'civ')}>${ic}<b>`).replace(/<small>ore /, `<small><span${A_('industry', 'ore')}>ore</span> `);
      return a + body + b;
    });
    h = h.replace(/<button class="small ?(?:on)?" data-a="wrLaw" data-v="(\w+)"/g, (m, k) => m + A_('econLaw', k))
      .replace(/<button class="small" data-a="wrBuild" data-v="(\w+)"/g, (m, k) => m + A_('buildKind', k));
    h = h.replace(/<tr><td( title="[^"]*")?>(<svg[\s\S]*?<\/svg> )?([^<]*)<\/td><td>([\s\S]*?)<\/tr>/g, (m, ti, ic, nm, rest) => {
      const k = /data-v="(\w+)\|/.exec(m); const key = k ? k[1] : Object.keys(GD.EQ).find(x => GD.EQ[x].name === nm.trim()) || (/Sell arms/.test(nm) ? 'trade' : null);
      return key ? `<tr${A_('line', key)}><td${ti || ''}>${ic || ''}${nm}</td><td>${rest}</tr>` : m;
    });
    i = 0;
    h = h.replace(/<div class="wr-build"><span class="grow small">/g, m => `<div class="wr-build"${A_('build', i++)}><span class="grow small">`);
    return h.replace(/(<div class="group-h">Construction <span class="tiny muted">)/, `$1<span${A_('industry', 'civ')}>`).replace(/(— \d+ workshops free, at most 15 per project)(<\/span>)/, '$1</span>$2');
  };
  W.wrManpower = function (h) {
    const r = A.realm(UI.wrMyR(A.pc())); if (!r || !r.forces) return h;
    h = TT.wireBars(h, lbl => lbl === 'Pool' ? ['manpower', r.id] : null);
    h = h.replace(/(<small>[^<]*)(Pool ×[\d.]+\.)(<\/small>)/g, (m, a, x, b) => `${a}<span${A_('manpower', r.id)}>${x}</span>${b}`);
    const tpls = Object.values(r.forces.tpl); let i = 0;
    h = h.replace(/<div class="wr-trainrow"><div class="grow"><b class="small">([^<]*)<\/b><div class="tiny muted">/g, (m, nm) => { const t = tpls[i++]; return t ? `<div class="wr-trainrow"><div class="grow"><b class="small">${nm}</b><div class="tiny muted"${UI.ttAttrs('trainCost', r.id + '|' + t.id)}>` : m; });
    let q = 0;
    h = TT.within(h, '<div class="group-h">In the drill yards</div>', '<div class="group-h">Disband', seg => seg.replace(/<div class="wr-build">/g, m => `<div class="wr-build"${A_('training', r.id + '|' + q++)}>`));
    return TT.within(h, '<div class="group-h">Disband', null, seg => seg.replace(/<div class="wr-build"><span class="grow small">([^<]*) · ([\d,]+ men)<\/span><button class="small ghost" data-a="wrDisband" data-v="([^"]+)"/g, (m, nm, men, id) => `<div class="wr-build"><span class="grow small">${nm} · <span${A_('divMen', id)}>${men}</span></span><button class="small ghost" data-a="wrDisband" data-v="${id}"`));
  };
  W.wrHint = function (h) {
    const s = UI.wr && UI.wr.sel; if (!s || s.k !== 'divs' || !s.ids || !s.ids.length) return h;
    return h.replace(/<b>(\d+ divisions? selected\.)<\/b>/, (m, t) => `<b${A_('divMen', s.ids[0])}>${t}</b>`);
  };
  W.warRoomModal = function (h) {
    return h.replace(/<span class="chip gold" id="wrDate">/, `<span class="chip gold" id="wrDate"${UI.ttAttrs('date', '')}>`);
  };
  W.warTabClock = function (h, p) {
    const pc = p || A.pc(); if (!pc) return h;
    const myR = pc.ruler || (pc.mil && !pc.mil.merc ? pc.mil.realm : pc.mil && pc.mil.contract ? pc.mil.contract : pc.realm);
    h = h.replace(/(<div class="small muted">)(\d+ armies in the field · [^<]*?)(<b>[^<]*<\/b>)?(<\/div>)/, (m, a, t, b, c) => `${a}${N('warFront', myR, t + (b || ''), { focus: true })}${c}`);
    if (pc.mil && pc.mil.div) {
      const d = A.divById(pc.mil.div);
      if (d) h = h.replace(/(— )([^<]*?\. [^<]*?, \d+% strength\.)(<\/div>)/, (m, a, t, c) => `${a}${N('divStr', d.id, t, { focus: true })}${c}`);
    }
    if (pc.mil && !pc.mil.merc) h = h.replace(/(<div class="tiny muted" style="margin-top:4px">)([^<]*· merit )(\d+)/, (m, a, t, n) => `${a}${t}${N('merit', '', n, { focus: true })}`);
    // the squad: each one's age
    h = h.replace(/<div class="card person click" data-a="ov" data-v="person:([^"]+)">([\s\S]*?)<div class="sub">(\d+),/g, (m, id, mid, age) => `<div class="card person click" data-a="ov" data-v="person:${id}">${mid}<div class="sub"><span${A_('age', id)}>${age}</span>,`);
    // the wars of your realm: each war score bar, in the order they are drawn
    const mine = A.S.wars.filter(w => w.att.includes(myR) || w.def.includes(myR));
    let k = 0;
    h = TT.within(h, '<div class="group-h">Wars of your realm</div>', null, seg => TT.wireBars(seg, lbl => lbl === 'War score' ? (mine[k] ? ['warScore', mine[k++].id] : null) : null));
    return TT.wireCosts(h);
  };
  W.oobBreadcrumb = function (h) {
    let i = 0;
    return h.replace(/<span class="tiny muted">([\d,]+) · /g, (m, n) => `<span class="tiny muted"><span${UI.ttAttrs('oob', i++)}>${n}</span> · `);
  };
  W.chainOfCommand = function (h, p) {
    const pc = p || A.pc(); if (!pc || !pc.mil) return h;
    return h.replace(/<div class="tiny muted">([^<]*· leads [\d,]+)<\/div><\/div><span class="chip gold right">/, (m, t) => `<div class="tiny muted">${N('milRank', '', t)}</div></div><span class="chip gold right">`);
  };
  W.ordersCard = function (h, p, compact) {
    const pc = p || A.pc(); if (!pc || !GD.ORDERS) return h;
    const list = Object.keys(GD.ORDERS).map(id => A.orderSummary(id)).filter(s => s.r && s.r.alive).sort((a, b) => b.pow - a.pow);
    const myR = pc.mil && !pc.mil.merc ? pc.mil.realm : pc.realm, shown = list.filter((s, i) => !compact || i < 4 || (pc.order && pc.order.id === s.id) || s.o.realm === myR);
    const parts = h.split('<div class="ord ');
    for (let i = 1; i < parts.length && i - 1 < shown.length; i++) {
      const id = shown[i - 1].id; let j = 0;
      parts[i] = parts[i].replace(/<span class="tiny"><b>([\d,]+)<\/b>([^<]*)<\/span>/, (m, n, rest) => `<span class="tiny"${UI.ttAttrs('orderPow', id)}><b>${n}</b>${rest}</span>`)
        .replace(/<div class="ord-traits">([\s\S]*?)<\/div>/, (m, body) => `<div class="ord-traits"${A_('orderTraits', id)}>${body}</div>`)
        .replace(/<span class="req (ok|no)">/g, (m, c) => `<span class="req ${c}"${UI.ttAttrs('orderReq', id + '|' + j++)}>`)
        .replace(/(— [^<(]*fighter )\((\d+)\)/, (m, a, w) => { const L0 = shown[i - 1].L; return L0 ? `${a}(${N('worth', L0.id, w)})` : m; })
        .replace(/(Merit in the order: )(\d+)/, (m, a, n) => `${a}${N('merit', '', n)}`);
    }
    return parts.join('<div class="ord ').replace(/(<div class="tiny muted">…and )(\d+)( more in the Codex)/, (m, a, n, b) => `${a}<span${A_('orderPow', (list[list.length - 1] || {}).id)}>${n}</span>${b}`);
  };
  W.drillCard = function (h, p) {
    const pc = p || A.pc(); if (!pc || !pc.mil) return h;
    const D0 = pc.mil.drill || {}, d = A.myUnit && A.myUnit(pc), share = A.drillShare ? A.drillShare(pc) : 1;
    h = h.replace(/<span class="tiny muted">(you drill [^<]*)<\/span>/, (m, t) => `<span class="tiny muted">${N('drillShare', '', t, { focus: true })}</span>`);
    let i = 0; const fams = Object.keys(GD.DRILLS);
    h = h.replace(/<div class="dr-b( on)?" title="([^"]*)">/g, (m, on, t) => { const k = fams[i++]; if (!k) return m; const own = (D0.own || {})[k] || 0, dv = d ? (d.dr || {})[k] || 0 : 0, v = share >= 0.99 ? dv : own; return `<div class="dr-b${on || ''}" title="${t}"${UI.ttAttrs('drill', k + '|' + v)}>`; });
    h = h.replace(/(The tick on each bar is as far as your officers can teach )\((\d+)\)/, (m, a, n) => `${a}(${N('drillCap', '', n)})`)
      .replace(/(your drill counts for )(\d+%)/, (m, a, n) => `${a}${N('drillShare', '', n)}`)
      .replace(/<span class="tiny muted">(next review in \d+ days)<\/span>/, (m, t) => `<span class="tiny muted"${A_('initiative', '')}>${t}</span>`);
    // 60-drill's unlocks: each drill and what it opens
    if (A.DRILL) {
      const byShort = {}; for (const f in GD.DRILLS) byShort[UI.esc(GD.DRILLS[f].short || GD.DRILLS[f].name)] = f;
      const rec = A.DRILL.mine ? A.DRILL.mine(pc) : null;
      h = h.replace(/<div class="dr-unl( muted)?"><b>([^<]*?) (\d+)<\/b> <span class="tiny">/g, (m, mu, nm, v) => { const f = byShort[nm]; return f ? `<div class="dr-unl${mu || ''}"${UI.ttAttrs('drill', f + '|' + (rec ? rec[f] || 0 : +v / 100))}><b>${nm} ${v}</b> <span class="tiny">` : m; });
      h = h.replace(/<div class="tiny">([^<:]+): ((?:(?:shield walls|the charge|the feigned flight|skirmish|weapons|formation|marches|field works) \d+(?:, )?)+)<\/div>/g, (m, nm, list) => `<div class="tiny"${A_('drill', 'formation|')}>${nm}: ${list}</div>`);
    }
    return TT.wireCosts(h);
  };
  W.staffCard = function (h, p) {
    const pc = p || A.pc(); if (!pc || !A.staffSlots) return h;
    const slots = A.staffSlots(pc);
    return h.replace(/<div class="st-slot"><div class="st-head"><b>([^<]*)<\/b>([\s\S]*?)fit for the post: <b>(\d+)<\/b>/g, (m, lab, mid, n) => {
      const s = slots.find(x => UI.esc(x.label) === lab), cur = s && A.staffHolder(pc, s.key); if (!cur) return m;
      return `<div class="st-slot"><div class="st-head"><b>${lab}</b>${mid}fit for the post: <b${UI.ttAttrs('staffFit', s.key + '|' + cur.id)}>${n}</b>`;
    });
  };
  for (const k of ['wrBars', 'wrDivStatus', 'wrStatGrid', 'wrArmyRow', 'wrArmyPanel', 'wrDivPanel', 'wrCommandBasic', 'wrForces', 'wrWars', 'wrFightRow', 'wrFightPanelBasic', 'wrFightPanel', 'wrProvPanel', 'wrRoleCard', 'wrTemplates', 'wrIndustry', 'wrManpower', 'wrHint', 'warRoomModal', 'warTabClock', 'oobBreadcrumb', 'chainOfCommand', 'ordersCard', 'drillCard', 'staffCard']) TT.wireLater(() => UI, k, k);

  // ---- the Realm tab, as one who does not rule -----------------------------------------------------------------------
  W.factionCard = function (h, f) {
    if (!f) return h;
    h = TT.wireBars(h, lbl => lbl === 'Power' ? ['facPower', f.id] : lbl === 'Discontent' ? ['facDisc', f.id] : null);
    return h.replace(/<span class="tag">(\d+ houses?(?: \+ you)?)<\/span>/, (m, t) => `<span class="tag"${A_('facPower', f.id)}>${t}</span>`);
  };
  W.realmTab2 = function (h, p) {
    const pc = p || A.pc(); if (!pc) return h;
    const r = A.realm(pc.noble ? pc.noble.realm : pc.realm), ru = r && A.P(r.ruler);
    if (ru) h = h.replace(new RegExp(`(<div class="card person click" data-a="ov" data-v="person:${reEsc(ru.id)}">[\\s\\S]*?<div class="sub">)(\\d+)( · their opinion of you: )(-?\\d+)(<\\/div>)`), (m, a, age, b, op, c) => `${a}<span${A_('age', ru.id)}>${age}</span>${b}<span${A_('rulerOp', ru.id)}>${op}</span>${c}`);
    // the great lords: loyalty
    h = TT.within(h, '<div class="group-h">The great lords</div>', '</table>', seg => seg.replace(/(<td><span class="click u" data-a="ov" data-v="house:([^"]+)">[^<]*<\/span><\/td><td>[\s\S]*?<\/td>)<td>(\d+)<\/td>/g, (m, pre, hid, v) => `${pre}<td${UI.ttAttrs('loyalty', hid)}>${v}</td>`));
    if (r) h = TT.within(h, '<div class="group-h">Lately at court</div>', '<div class="card ri-ledger', seg => seg
      .replace(/\(mean loyalty (\d+)\)/g, (m, n) => `(${N('loyaltyAll', r.id, 'mean loyalty ' + n)})`)
      .replace(/(: )([\d,]+ suns)(\.)/g, (m, a, v, b) => `${a}${N('crownBook', r.id, v)}${b}`));
    h = h.replace(/If it came to the crown today: (\d+)% it passes\./, (m, n) => N('courtOdds', '', `If it came to the crown today: ${n}% it passes.`, { focus: true }));
    // the crown's purse
    if (r) h = h.replace(/<div class="card ri-ledger small"><div class="row"><b>([^<]*)<\/b><span class="right"><\/span><span class="tag">([^<]*)<\/span><\/div><table class="t small">([\s\S]*?)<\/table>/, (m, t, tag, rows) =>
      `<div class="card ri-ledger small"><div class="row"><b>${UI.tt('crownBook', r.id, t)}</b><span class="right"></span><span class="tag"${A_('crownBook', r.id)}>${tag}</span></div><table class="t small">${rows.replace(/<td class="(good|bad)" style="text-align:right">/g, (x, c) => `<td class="${c}" style="text-align:right"${A_('crownBook', r.id)}>`)}</table>`);
    // the ladder of rungs (drawn highest first)
    h = h.replace('<div class="group-h">The ladder (Part 12)</div>', `<div class="group-h">${UI.tt('rungs', '', 'The ladder (Part 12)')}</div>`);
    const NR = GD.NOBLE_RUNGS || []; let i = NR.length;
    h = TT.within(h, 'The ladder (Part 12)</span></div>', '</table>', seg => seg.replace(/<tr><td>([^<]*)<\/td><td>([^<]*suns\/yr, levy [^<]*)<\/td><\/tr>/g, (m, t, v) => { i--; return `<tr><td>${t}</td><td${UI.ttAttrs('rung', i)}>${v}</td></tr>`; }));
    // 47-realm-bible's customs
    const B = A.BIBLE, D0 = B && r && B.of(r.id);
    if (D0 && D0.customs) { let j = 0; h = TT.within(h, '<div class="card small rb"', '</div></div>', seg => seg.replace(/<span class="muted">\((met \d+×, first in \d+|not met yet)\)<\/span>/g, (m, t) => { const c = D0.customs[j++]; return c ? `<span class="muted">(${N('custom', c.id, t)})</span>` : m; })); }
    // 55-bonds' long memories: rows in the order the card draws them
    const FE = A.BONDS && A.BONDS.FEUD, rid = pc.ruler || pc.realm;
    if (FE && h.indexOf('bd-feuds') > 0) {
      const held = [], against = [];
      for (const o of Object.keys(A.S.realms || {})) {
        if (o === rid || !A.S.realms[o].alive) continue;
        FE.list(rid, o).forEach((e, k) => { if (Math.abs(e.w) >= 2) held.push([rid, o, k, e]); });
        FE.list(o, rid).forEach((e, k) => { if (Math.abs(e.w) >= 2) against.push([o, rid, k, e]); });
      }
      const by = (x, y) => Math.abs(y[3].w) - Math.abs(x[3].w), rows = held.sort(by).slice(0, 6).concat(against.sort(by).slice(0, 6));
      let k = 0;
      h = TT.within(h, '<div class="card small bd-feuds"', null, seg => seg.replace(/<span class="muted">\(([+−]\d+)\)<\/span>/g, (m, v) => { const x = rows[k++]; return x ? `<span class="muted">(${N('feud', x[0] + '|' + x[1] + '|' + x[2], v)})</span>` : m; }));
    }
    return TT.wireCosts(h);
  };
  TT.wireLater(() => UI, 'factionCard', 'factionCard');
  TT.wireLater(() => UI.TAB, 'realm', 'realmTab2');

  // ---- the Codex (Power & scale) and the Dynasty page -----------------------------------------------------------------
  W.powerPage = function (h, p) {
    const pc = p || A.pc(); if (!pc) return h;
    h = TT.within(h, '<div class="group-h">The ladder of fighters</div>', '</table>', seg => seg
      .replace(/<td><span class="chip tier (\w+)">([^<]*)<\/span><\/td><td>([^<]*)<\/td>/g, (m, k, n, rg) => `<td><span class="chip tier ${k}">${n}</span></td><td${UI.ttAttrs('tier', k)}>${rg}</td>`)
      .replace(/— you are here \((\d+)\)/, (m, w) => `— you are here (${N('worth', pc.id, w)})`));
    h = TT.within(h, '<div class="group-h">One against many</div>', '</table>', seg => seg.replace(/<tr><td><span class="chip tier (\w+)">([^<]*)<\/span><\/td>/g, (m, k, n) => `<tr${A_('crowd', n)}><td><span class="chip tier ${k}"${UI.ttAttrs('crowd', n)}>${n}</span></td>`));
    h = h.replace(/(<div class="small" style="margin-top:4px"><b>You:<\/b> )([\s\S]*?)(<\/div>)/, (m, a, body, c) => `${a}<span${UI.ttAttrs('takeLine', '')}>${body}</span>${c}`);
    h = h.replace(/(Legends alive in Ardan: )(\d+ of a possible \d+)(\. Masters in [^:]*: )(\d+ \(no realm raises more than \d+\))/, (m, a, l, b, ms) => `${a}${N('census', 'legends', l, { focus: true })}${b}${N('census', 'masters', ms, { focus: true })}`)
      .replace(/<div class="tiny muted">(\d+ more, whose names have not reached you\.)<\/div>/, (m, t) => `<div class="tiny muted">${N('census', 'legends', t)}</div>`);
    return h;
  };
  TT.wireLater(() => UI, 'powerPage', 'powerPage');
  W.legacy = function (h, p) {
    const pc = p || A.pc(); if (!pc) return h;
    h = h.replace(/<div class="small muted">(Generation \d+ · [^<]*)<\/div>/, (m, t) => `<div class="small muted">${N('dynasty', '', t, { focus: true })}</div>`)
      .replace(/<div class="tiny muted">living, (\d+)<\/div>/, (m, a) => `<div class="tiny muted">living, ${N('age', pc.id, a)}</div>`)
      .replace(/<div class="group-h">Endings found \(([^)]*)\)<\/div>/, (m, t) => `<div class="group-h"><span>Endings found (${N('endings', '', t, { focus: true })})</span></div>`)
      .replace(/<div class="group-h">Achievements \(([^)]*)\)<\/div>/, (m, t) => `<div class="group-h">Achievements (${N('achs', '', t, { focus: true })})</div>`);
    const keys = Object.keys(GD.ACH); let i = 0;
    h = TT.within(h, '<div class="group-h">Achievements', null, seg => seg.replace(/<div class="card ach( lock)?"><b>/g, (m, l) => { const k = keys[i++]; return k ? `<div class="card ach${l || ''}"${UI.ttAttrs('ach', k)}><b>` : m; }));
    // children: each one's age
    h = h.replace(/<div class="card person( sel)?"><div class="pp click" data-a="ov" data-v="person:([^"]+)">([\s\S]*?)<div class="sub">(\d+) · /g, (m, s2, id, mid, a) => `<div class="card person${s2 || ''}"><div class="pp click" data-a="ov" data-v="person:${id}">${mid}<div class="sub">${N('age', id, a)} · `);
    return TT.wireCosts(h);
  };
  TT.wireLater(() => UI.TAB, 'legacy', 'legacy');

  // ---- an event: each choice's odds (a tap target inside the choice), the measure of a fight, a cost in the words ----
  W.eventModal = function (h, q) {
    TT.cur.ev = q || null;
    if (!q || q.result) return h;
    return h.replace(/<button data-a="evChoose" data-v="(\d+)">([\s\S]*?)<\/button>/g, (m, vi, body) => {
      body = body.replace(/<span class="risk([^"]*)">/, (x, c) => `<span class="risk${c}"${A_('odds', vi)} data-tt-tap="1">`)
        .replace(/<small class="fl-measure">/, `<small class="fl-measure"${A_('odds', vi)} data-tt-tap="1">`)
        .replace(/\((\d[\d,]*) suns?\)/g, (x, n) => `(${N('cost', String(n).replace(/,/g, ''), n + ' suns')})`);
      return `<button data-a="evChoose" data-v="${vi}">${body}</button>`;
    });
  };
  TT.wireLater(() => UI, 'eventModal', 'eventModal');

  // ---- the duel: both fighters, blood and wind, the measure, your instincts' read ---------------------------------------
  const BARS = { Blood: 'duelBlood', Wind: 'duelWind', Adapting: 'duelAdapt' };
  W.duelModal = function (h, D0) {
    TT.cur.duel = D0 || null;
    if (!D0) return h;
    const parts = h.split('<div class="fighter">');
    if (parts.length === 3) {
      for (const [i, side] of [[1, 'a'], [2, 'b']]) {
        let seg = parts[i];
        seg = TT.wireBars(seg, lbl => BARS[lbl] ? [BARS[lbl], side] : null);
        seg = seg.replace(/<div class="tiny muted">([^<]*)<\/div>/, (m, t) => /\d/.test(t) || !D0.b.beast || side === 'a' ? `<div class="tiny muted"${A_('duelSide', side)}>${t}</div>` : m);
        if (side === 'b') seg = seg.replace(/<span class="chip tier ([^"]*)" title="([^"]*)">/, (m, c, t) => `<span class="chip tier ${c}" title="${t}"${UI.ttAttrs('duelSide', 'b')}>`);
        parts[i] = seg;
      }
      h = parts.join('<div class="fighter">');
    }
    // the measure: the whole line answers to hover, and its last sentence (the chance) is a trigger of its own; the
    // fighters' words stay as 48-fight-ladder wrote them
    h = h.replace(/<div class="fl-duel small"><b>The measure\.<\/b> ([\s\S]*?)<\/div>/, (m, body) => {
      const i = body.lastIndexOf('. ', body.length - 2), last = i >= 0 ? body.slice(i + 2) : '';
      return `<div class="fl-duel small"${A_('duelOdds', '')}><b>The measure.</b> ${last ? body.slice(0, i + 2) + N('duelOdds', '', last, { focus: true }) : body}</div>`;
    });
    h = h.replace(/<div class="read">Your instincts \((\d+)% sure\)/, (m, n) => `<div class="read">Your instincts (${N('duelRead', '', n + '% sure', { focus: true })})`);
    return h;
  };
  TT.wireLater(() => UI, 'duelModal', 'duelModal');

  // ---- the battle: the sides, the wings, the pulse, the dead, the after-action causes, the drill ---------------------------
  W.battleModal = function (h, B) {
    TT.cur.battle = B || null;
    if (!B || !B.sides) return h;
    const me = B.pcSide, en = me === 'A' ? 'B' : 'A';
    h = h.replace(/· pulse (\d+) of (\d+)<\/span>/, (m, a, b) => `· ${N('bPulse', '', `pulse ${a} of ${b}`, { focus: true })}</span>`)
      .replace(/(each block ≈ )([^<]*)(<\/span>)/, (m, a, b, c) => `${a}${N('bScale', '', b)}${c}`);
    let k = 0;
    h = h.replace(/<b>([^<]*)<\/b> ([\d,]+ \/ [\d,]+) <span class="muted">\(morale (\d+)\)<\/span>/g, (m, nm, men, mo) => {
      const side = k++ === 0 ? me : en;
      return `<b>${nm}</b> ${N('bSide', side, men, { focus: true })} <span class="muted">(${N('bMorale', side, 'morale ' + mo)})</span>`;
    });
    h = h.replace(/<div class="wingctl card small"><b>(Left wing|Center|Right wing)<\/b> <span class="muted">/g, (m, n) => {
      const w = { 'Left wing': 'L', Center: 'C', 'Right wing': 'R' }[n];
      return `<div class="wingctl card small"><b>${UI.tt('bWing', me + '|' + w, n)}</b> <span class="muted"${A_('bWing', me + '|' + w)}>`;
    }).replace('<div class="card small"><b>Reserve</b> <span class="muted">', `<div class="card small"><b>${UI.tt('bWing', me + '|X', 'Reserve')}</b> <span class="muted"${A_('bWing', me + '|X')}>`);
    if (A.DRILL) {
      const byName = {}; for (const f in A.DRILL.NAME) byName[A.DRILL.NAME[f]] = f;
      h = h.replace(/<div class="tiny muted drill-note">([^<]*)<\/div>/g, (m, t) => `<div class="tiny muted drill-note">${t.replace(/(shield walls|the charge|the feigned flight|skirmish|weapons|formation|marches|field works) (\d+)/g, (x, nm, v) => byName[nm] ? N('drill', byName[nm] + '|' + (+v / 100), x) : x)}</div>`);
    }
    h = h.replace(/(<div class="result [^"]*"><b>[^<]*<\/b> )(Dead: [^<]*)(<\/div>)/, (m, a, t, b) => a + N('bDead', '', t, { focus: true }) + b);
    let i = 0;
    h = h.replace(/<li><span class="(good|bad)">([^<]*)<\/span>/g, (m, c, v) => `<li><span class="${c}"${UI.ttAttrs('aarCause', i++)}>${v}</span>`);
    return h;
  };
  TT.wireLater(() => UI, 'battleModal', 'battleModal');

})();
