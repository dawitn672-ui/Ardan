// 91-look, part 5: rows, rarity and realm colours (docs/design/brief.md §1.5, §1.6, §4.5, §5.5).
// - People: each person is a small-multiple row (bust, name, relation, the bond chip, a 48 px opinion bar), so a panel
//   holds about twenty people instead of six cards.
// - Realm: a header band in the realm's tint, with its coat of arms, the ruler's bust, the realm's name in its own ink
//   and four headline numbers; the council and the court below as rows.
// - Holdings: the gear and shop tables as dense rows; a gear's quality wears its rarity tier.
// - Rarity tiers (§1.5): gear quality (Fine, Masterwork) and the achievements of the Dynasty tab carry the tier's gem,
//   colour and edge.
// - Realm chips: a realm named in a row gets its swatch dot and its name in its ink (UI.realmInkOf).
// Drawing only: it reads the game, rewrites markup already drawn, never draws a random number, never writes A.S.
(function () {
  const LOOK = UI.LOOK, esc = s => UI.esc(String(s == null ? '' : s));
  const R = LOOK.R || ':root[data-theme]', X = LOOK.X || (s => s);

  // ---- rarity (§1.5): a tier for a thing, its gem, and the markup of a rarity chip
  LOOK.TIER_OF_QUAL = { crude: 'common', common: 'common', fine: 'uncommon', master: 'epic' };
  // a piece of gear: its quality's tier, raised for the rare (a people's own make), the famed and the masters' own
  LOOK.gearTier = function (key, q) {
    const g = GD.GEAR && GD.GEAR[key];
    let t = LOOK.TIER_OF_QUAL[q] || 'common';
    const order = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'], up = k => { if (order.indexOf(k) > order.indexOf(t)) t = k; };
    if (g && g.rare) up('rare');
    if (g && g.masterOnly) up('epic');
    if (g && g.fame) up('legendary');
    return t;
  };
  // the achievements, by how rare a life that earns them is
  LOOK.ACH_TIER = {
    first_blood: 'common', survivor: 'common', married: 'common', breakthrough: 'common', epithet: 'common', freed: 'common', escaped: 'common',
    sergeant: 'uncommon', ten_battles: 'uncommon', big_family: 'uncommon', rich: 'uncommon', outlaw: 'uncommon', polyglot: 'uncommon', knighted: 'uncommon',
    captain: 'rare', master_craft: 'rare', banker: 'rare', lord: 'rare', school_master: 'rare', beast: 'rare', founder: 'rare', patriarch: 'rare',
    general: 'epic', centurion: 'epic', giant_killer: 'epic', usurper: 'epic', dynasty3: 'epic', hundred_kills: 'epic', pirate_king: 'epic', ancient: 'epic',
    marshal: 'legendary', ruler: 'legendary', conqueror: 'legendary', king_slayer: 'legendary', peasant_king: 'legendary', dragon: 'legendary',
    legend: 'mythic',
  };
  const TIER_NAME = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary', mythic: 'Mythic' };
  LOOK.gem = t => `<span class="rar-gem" aria-hidden="true">${esc((LOOK.TIERS || {})[t] || '◇')}</span>`;
  // the release's quality chip, as a rarity chip: tier border, gem, tier text (the quality's own name stays the word)
  if (typeof UI.qualChip === 'function') {
    const qc = UI.qualChip;
    UI.qualChip = function (q) {
      const h = qc.apply(this, arguments);
      if (!h || typeof q !== 'string') return h;
      const t = LOOK.TIER_OF_QUAL[q] || 'common';
      return h.replace(/^<span class="chip qual q-([a-z]+)"/, `<span class="chip qual q-$1 rar rar-${t}" data-tier="${t}"`).replace(/">([^<]*)<\/span>$/, `">${LOOK.gem(t)}$1</span>`);
    };
  }

  // ---- the rows of the People tab and the court: each person card becomes one line
  LOOK.peopleRows = function (tb) {
    for (const c of tb.querySelectorAll('.card.person.click')) {
      if (c.classList.contains('lk-row')) continue;
      c.classList.add('lk-row');
      const mid = c.children[1];
      if (mid) mid.classList.add('lk-row-m');
    }
  };

  // ---- sparklines (§5.4): 60 x 16, a 1.5 px line in --ink-2, the last point a dot in the accent. The game keeps no
  // history of these numbers, so the look keeps its own while the game is drawn: one sample a game month (the realm's
  // treasury, army, stability and provinces; the player's six stats), at most ten years, reset for a new life or a
  // loaded game. It is UI state, never saved; a line appears once there are two months to join.
  LOOK.hist = { S: null, pc: null, rows: [] };
  LOOK.sample = function (pc) {
    if (!pc || !A.S) return;
    const H = LOOK.hist;
    if (H.S !== A.S || H.pc !== pc.id) { H.S = A.S; H.pc = pc.id; H.rows = []; }
    let m = 0; try { m = A.monthOf(A.today()).m; } catch (e) {}
    const k = A.S.year * 12 + m, last = H.rows[H.rows.length - 1];
    if (last && last.k === k) return;
    if (last && k < last.k) H.rows = [];
    const r = A.realm && A.realm(pc.realm), st = {};
    for (const s of (GD.STATS || [])) { try { st[s] = Math.round(A.stat(pc, s)); } catch (e) {} }
    H.rows.push({ k, y: A.S.year, r: r ? { treasury: +r.treasury || 0, army: +r.army || 0, stab: +r.stability || 0, prov: +r.provCount || 0, id: r.id } : null, st });
    if (H.rows.length > 120) H.rows.shift();
  };
  LOOK.spark = function (vals, label, cls) {
    vals = vals.filter(v => typeof v === 'number' && isFinite(v));
    if (vals.length < 2) return '';
    const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1, n = vals.length;
    const pts = vals.map((v, i) => [1.5 + i * 57 / (n - 1), 14.5 - (v - lo) / span * 13]);
    const d = pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join('');
    const [lx, ly] = pts[n - 1];
    return `<svg class="lk-spark${cls ? ' ' + cls : ''}" viewBox="0 0 60 16" width="60" height="16" role="img" aria-label="${esc(label)}"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="1.5" class="lk-spark-dot"/></svg>`;
  };
  const sparkOf = (pick, name, fmt) => {
    const rows = LOOK.hist.rows.filter(x => pick(x) != null), vals = rows.map(pick);
    if (vals.length < 2) return '';
    return LOOK.spark(vals, `${name} since ${rows[0].y}: ${fmt(Math.min(...vals))} to ${fmt(Math.max(...vals))}`);
  };
  // the roomy rail (1600 px and up): each stat tile gets its line
  LOOK.statSparks = function () {
    if (typeof innerWidth === 'undefined' || innerWidth < 1600) return;
    const pr = document.getElementById('profile');
    if (!pr) return;
    for (const r of pr.querySelectorAll('.lk-stats > .barrow')) {
      if (r.querySelector('.lk-spark')) continue;
      const k = [...r.classList].map(c => /^st-(\w+)$/.exec(c)).find(Boolean);
      if (!k) continue;
      const nm = (LOOK.STATS[k[1]] || [k[1]])[0];
      const sp = sparkOf(x => x.st ? x.st[k[1]] : null, nm, v => String(v));
      if (sp) r.insertAdjacentHTML('beforeend', sp);
    }
  };

  // ---- the Realm tab's header band (§4.5): tint, coat of arms, ruler, name, four numbers
  const big = n => { n = Math.round(+n || 0); const a = Math.abs(n); return a >= 1e6 ? (n / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M' : a >= 1e4 ? Math.round(n / 1e3) + 'k' : a >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n); };
  LOOK.realmBand = function (tb, pc) {
    if (!pc || UI.tab !== 'realm' || tb.querySelector('.lk-band')) return;
    const r = A.realm && A.realm(pc.realm);
    if (!r) return;
    const ink = UI.realmInkOf ? UI.realmInkOf(r) : null;
    const house = A.house ? A.house(r.house) : null;
    let coat = '';
    try { coat = house && PORTRAIT.coat ? PORTRAIT.coat(house, 40) : ''; } catch (e) { coat = ''; }
    const ru = r.ruler && A.P ? A.P(r.ruler) : null;
    let bust = '';
    try { bust = ru && UI.portrait ? (UI.ANIME && UI.set.anime !== false ? UI.ANIME.svg(ru, 48, { bust: true }) : UI.portrait(ru, 48)) : ''; } catch (e) { bust = ''; }
    const ttl = ru ? (A.fullName ? A.fullName(ru, false) : ru.given) : '';
    const mine = x => x.r && x.r.id === r.id ? x.r : null;
    const nums = [
      ['Treasury', big(r.treasury) + ' suns', sparkOf(x => mine(x) && mine(x).treasury, 'Treasury', v => big(v))],
      ['Army', big(r.army), sparkOf(x => mine(x) && mine(x).army, 'Army', v => big(v))],
      ['Stability', Math.round(+r.stability || 0), sparkOf(x => mine(x) && Math.round(mine(x).stab), 'Stability', v => String(v))],
      ['Provinces', Math.round(+r.provCount || 0), sparkOf(x => mine(x) && mine(x).prov, 'Provinces', v => String(v))],
    ];
    const band = document.createElement('section');
    band.className = 'lk-band';
    band.setAttribute('aria-label', 'Your realm');
    if (ink) band.style.cssText = `--lk-tint:${ink.tint};--lk-ink:${ink.ink};--lk-sw:${ink.swatch}`;
    band.innerHTML = `<div class="lk-band-id">${coat ? `<span class="lk-band-coat" aria-hidden="true">${coat}</span>` : ''}<div class="lk-band-t"><b class="lk-band-n">${esc(r.name)}</b>` +
      `<span class="lk-band-r">${ru ? esc(A.rulerStyle ? A.rulerStyle(ru, r) : (r.title ? r.title + ' ' : '') + ttl) : 'No ruler'}</span></div>${bust ? `<span class="lk-band-bust" aria-hidden="true">${bust}</span>` : ''}</div>` +
      `<dl class="lk-band-k">${nums.map(([k, v, sp]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd>${sp ? `<dd class="lk-band-sp">${sp}</dd>` : ''}</div>`).join('')}</dl>`;
    tb.insertBefore(band, tb.firstChild && tb.firstChild.classList && tb.firstChild.classList.contains('fold-tools') ? tb.firstChild.nextSibling : tb.firstChild);
  };

  // ---- the Dynasty tab's achievements: tier gem, colour and edge (locked ones keep the gem, muted)
  LOOK.achTiers = function (tb) {
    if (!GD.ACH) return;
    const byName = new Map(Object.entries(GD.ACH).map(([k, v]) => [Array.isArray(v) ? String(v[0]) : '', k]));
    for (const grid of tb.querySelectorAll('.achgrid')) {
    if (grid.dataset.lkTier) continue;
    grid.dataset.lkTier = '1';
    grid.querySelectorAll('.card.ach').forEach(c => {
      const b0 = c.querySelector('b'), key = b0 ? byName.get(b0.textContent.trim()) : null;
      if (!key) return;
      const t = LOOK.ACH_TIER[key] || 'common';
      c.classList.add('rar', 'rar-' + t);
      c.dataset.tier = t;
      const b = c.querySelector('b');
      if (b) b.insertAdjacentHTML('afterbegin', LOOK.gem(t));
      c.insertAdjacentHTML('beforeend', `<span class="rar-w">${esc(TIER_NAME[t])}</span>`);
    });
    }
  };

  // ---- the armourer and the market: the name is the one tooltip target of a row; the other cells only repeat it (and
  // a click on them, which opened nothing new, read as a dead control), so they lose their own tooltip
  LOOK.shopRows = function (tb) {
    for (const td of tb.querySelectorAll('td[data-tt="shopItem"]')) {
      const tr = td.closest('tr');
      if (!tr || !tr.querySelector('span[data-tt="shopItem"]')) continue;
      td.classList.add('lk-shop-c');
    }
    // the gear cards: the card takes its piece's rarity
    for (const c of tb.querySelectorAll('.card.gear-c')) {
      const ch = c.querySelector('.chip.rar');
      c.classList.toggle('rar-card', !!ch);
      if (ch) c.dataset.tier = ch.dataset.tier;
    }
  };

  // ---- realm chips (§5.5): where a page names a realm in a "Realm" row, the name gets the realm's swatch dot and ink
  const realmByName = name => { if (!A.S || !A.S.realms) return null; for (const r of Object.values(A.S.realms)) if (r && (r.name === name || r.short === name)) return r; return null; };
  LOOK.chipHtml = (r, label) => { const ink = UI.realmInkOf(r), d = UI.realmInkOf(r, 'dark'), l = UI.realmInkOf(r, 'light'); return `<span class="lk-realm" style="--lk-ink:${ink.ink};--lk-ink-d:${d.ink};--lk-ink-l:${l.ink};--lk-sw:${ink.swatch}"><i aria-hidden="true"></i>${esc(label)}</span>`; };
  // a leaf whose whole text is a realm's name (or short name) becomes a realm chip: tooltips name realms in their rows
  // realm names in a tooltip become realm chips (an 8 px swatch dot, the name in the realm's ink): whole words in the
  // popover's text, longest names first, never in its heading, a button or a link to another tooltip
  LOOK.chipLeaves = function (root) {
    if (!A.S || !A.S.realms || typeof document === 'undefined') return;
    const by = new Map();
    for (const r of Object.values(A.S.realms)) if (r && r.alive !== false) for (const n of [r.name, r.short]) if (n && n.length >= 4 && !by.has(n)) by.set(n, r);
    if (!by.size) return;
    const names = [...by.keys()].sort((a, b) => b.length - a.length).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const rx = new RegExp(`(^|[^\\p{L}])(${names.join('|')})(?![\\p{L}])`, 'u');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const pe = n.parentElement;
      if (!pe || pe.closest('.lk-realm, .tip-h, button, [data-a], [data-tt], h2, h3')) continue;
      if (rx.test(n.nodeValue)) nodes.push(n);
    }
    for (const n of nodes.slice(0, 12)) {
      const m = rx.exec(n.nodeValue);
      if (!m) continue;
      const at = m.index + m[1].length, name = m[2], r = by.get(name);
      const rest = n.splitText(at); rest.nodeValue = rest.nodeValue.slice(name.length);
      const span = document.createElement('span');
      span.innerHTML = LOOK.chipHtml(r, name);
      rest.parentNode.insertBefore(span.firstChild, rest);
    }
  };
  // People rows: the person's realm as a chip (its short name) after the name
  LOOK.rowRealms = function (root) {
    for (const c of root.querySelectorAll('.card.person.lk-row')) {
      if (c.querySelector('.lk-realm')) continue;
      const m = /^person:(.+)$/.exec(c.dataset.v || ''), who = m && A.P ? A.P(m[1]) : null;
      const r = who && who.realm && A.realm ? A.realm(who.realm) : null;
      for (const ch of c.querySelectorAll('.chip')) if (!ch.title && ch.textContent.trim().length > 12) ch.title = ch.textContent.trim();
      const nm = c.querySelector('.lk-row-m > .nm');
      if (!r || !nm) continue;
      nm.insertAdjacentHTML('afterend', `<span class="lk-row-r">${LOOK.chipHtml(r, r.short || r.name)}</span>`);
    }
  };
  if (UI.TT && typeof UI.TT.open === 'function') {
    const open = UI.TT.open;
    UI.TT.open = function (a, lvl) {
      const r = open.apply(this, arguments);
      try {
        const st = UI.TT.stack.find(x => x && x.a === a);
        if (st && st.el) { LOOK.chipLeaves(st.el); if (UI.TT.place) UI.TT.place(UI.TT.stack.indexOf(st) + 1); }
      } catch (e) {}
      return r;
    };
  }
  LOOK.realmChips = function (root) {
    for (const k of root.querySelectorAll('.kv > div, .kv > dt, .prof-kv > div')) {
      if (k.textContent.trim() !== 'Realm') continue;
      const v = k.nextElementSibling;
      if (!v || v.querySelector('.lk-realm')) continue;
      const r = realmByName(v.textContent.trim());
      if (!r) continue;
      v.innerHTML = LOOK.chipHtml(r, v.textContent.trim());
    }
  };

  // ---- the War tab: each war of your realm gets a strength bar of us against them (§4.5): the standing armies of
  // each side's realms, ours in --ok from the left, theirs in --danger from the right, with the two numbers
  LOOK.warRows = function (tb, pc) {
    if (!pc || UI.tab !== 'war' || !A.S || !Array.isArray(A.S.wars)) return;
    const myR = pc.realm, wars = A.S.wars.filter(w => w && Array.isArray(w.att) && Array.isArray(w.def) && (w.att.includes(myR) || w.def.includes(myR)));
    if (!wars.length) return;
    const byName = new Map(wars.map(w => [String(w.name), w]));
    const men = ids => ids.reduce((a, id) => { const r = A.realm(id); return a + (r && r.alive !== false ? Math.max(0, +r.army || 0) : 0); }, 0);
    for (const c of tb.querySelectorAll('.card')) {
      if (c.querySelector('.lk-str')) continue;
      const b = c.querySelector(':scope > b');
      const w = b && byName.get(b.textContent.trim());
      if (!w) continue;
      const side = A.warSide ? (A.warSide(w, myR) || 'att') : (w.att.includes(myR) ? 'att' : 'def');
      const us = men(side === 'att' ? w.att : w.def), them = men(side === 'att' ? w.def : w.att), tot = Math.max(1, us + them);
      const pct = Math.round(us / tot * 100);
      c.classList.add('lk-war');
      c.insertAdjacentHTML('beforeend', `<div class="lk-str" role="img" aria-label="${esc(`Strength: us ${big(us)} against them ${big(them)}`)}">` +
        `<span class="lk-str-n lk-us">${esc(big(us))}</span><span class="lk-str-b"><i style="width:${pct}%"></i></span><span class="lk-str-n lk-them">${esc(big(them))}</span></div>`);
    }
  };

  // ---- the rail's delta flash (§5.4): when a vital or a stat on the rail changes between two draws of the same life,
  // its number shows the change in its place (▲ +2 in --ok, ▼ −3 in --danger) for 1.6 s and its bar pulses once (not under reduced
  // motion). The last numbers seen are UI state here, reset for a new life or a loaded game; the first draw of a life
  // shows none. aria-hidden: the number itself is what a screen reader reads.
  LOOK.flash = { S: null, pc: null, vals: {}, live: {} };
  LOOK.deltaFlash = function (pc) {
    const pr = document.getElementById('profile');
    if (!pr || !pc) return;
    const F = LOOK.flash, now = (typeof performance !== 'undefined' ? performance.now() : 0);
    if (F.S !== A.S || F.pc !== pc.id) { F.S = A.S; F.pc = pc.id; F.vals = {}; F.live = {}; }
    for (const r of pr.querySelectorAll('.lk-vitals > .barrow, .lk-stats > .barrow')) {
      const k = [...r.classList].find(c => /^(lk-v-|st-)/.test(c));
      const ve = r.querySelector('.val');
      if (!k || !ve) continue;
      const v = Math.round(parseFloat(ve.textContent));
      if (isNaN(v)) continue;
      const was = F.vals[k];
      F.vals[k] = v;
      if (was != null && v !== was) F.live[k] = { d: v - was + ((F.live[k] && F.live[k].until > now) ? F.live[k].d : 0), until: now + 1600 };
      const L = F.live[k];
      if (!L || L.until <= now || r.querySelector('.lk-dlt')) continue;
      r.classList.add('lk-flashing', 'lk-pulse');
      ve.insertAdjacentHTML('afterend', `<span class="lk-dlt ${L.d > 0 ? 'up' : 'dn'}" aria-hidden="true">${L.d > 0 ? '▲ +' : '▼ −'}${Math.abs(L.d)}</span>`);
      const left = Math.max(0, L.until - now);
      setTimeout(() => { try { if (r.isConnected) { r.classList.remove('lk-flashing', 'lk-pulse'); const x = r.querySelector('.lk-dlt'); if (x) x.remove(); } } catch (e) {} }, left);
    }
  };

  // ---- the Codex's bestiary: a beast's card wears its tier (animal common, great rare, titan legendary, legend mythic)
  LOOK.BEAST_TIER = { animal: 'common', great: 'rare', titan: 'legendary', legend: 'mythic' };
  LOOK.beastTiers = function (tb) {
    if (UI.tab !== 'codex' || typeof LORE === 'undefined' || !Array.isArray(LORE.creatures)) return;
    let byName = null;
    for (const c of tb.querySelectorAll('.card:not([data-tier]) > b:first-child')) {
      if (!byName) byName = new Map(LORE.creatures.map(x => [String(x.name), x]));
      const cr = byName.get(c.textContent.trim());
      if (!cr) continue;
      const bt = (GD.BEAST_TIER && GD.BEAST_TIER[cr.id]) || (/hoax|misunderstanding/i.test(cr.cat || '') ? 'legend' : A.BEASTS && A.BEASTS[cr.id] && A.beastTier ? A.beastTier(cr.id) : null);
      const t = LOOK.BEAST_TIER[bt];
      if (!t) continue;
      const card = c.parentElement;
      card.classList.add('rar', 'rar-' + t, 'rar-beast');
      card.dataset.tier = t;
      c.insertAdjacentHTML('afterbegin', LOOK.gem(t));
    }
  };

  // ---- the profile's "Hair & eyes" words follow the portrait: a far person whose stored look predates 93's land ranges
  // (an old save) is drawn in their land's tones, and the words name what is drawn (UI.ANIME.drawnApp)
  LOOK.appWords = function (root, who) {
    if (!who || !UI.ANIME || !UI.ANIME.drawnApp) return;
    const d = UI.ANIME.drawnApp(who);
    if (d.hair === (who.app || {}).hair && d.eye === (who.app || {}).eye) return;
    for (const k of root.querySelectorAll('.kv > div')) {
      if (k.textContent.trim() !== 'Hair & eyes') continue;
      const v = k.nextElementSibling;
      if (v) v.textContent = `${(GD.HAIR_NAMES || [])[d.hair] || ''}, ${(GD.EYE_NAMES || [])[d.eye] || ''}`;
    }
  };

  const apply = LOOK.apply;
  LOOK.apply = function () {
    const r = apply.apply(this, arguments);
    if (LOOK.OFF || typeof document === 'undefined') return r;
    try {
      const tb = document.getElementById('tabbody'); let pc = null; try { pc = A.S && A.pc ? A.pc() : null; } catch (e) { pc = null; }
      LOOK.sample(pc);
      LOOK.statSparks();
      if (tb) {
        LOOK.peopleRows(tb);
        LOOK.rowRealms(tb);
        LOOK.realmBand(tb, pc);
        LOOK.achTiers(tb);
        LOOK.shopRows(tb);
        LOOK.warRows(tb, pc);
        LOOK.beastTiers(tb);
      }
      LOOK.deltaFlash(pc);
      const m = document.getElementById('modal');
      if (m) {
        LOOK.peopleRows(m); LOOK.rowRealms(m); LOOK.shopRows(m); LOOK.realmChips(m);
        let who = pc; try { if (UI.ov && UI.ov.id && A.P) who = A.P(UI.ov.id) || pc; } catch (e) {}
        LOOK.appWords(m, who);
      }
      const pr = document.getElementById('profile');
      if (pr) LOOK.appWords(pr, pc);
      if (tb) LOOK.realmChips(tb);
    } catch (e) { console.error('look rows', e); }
    return r;
  };

  // a new life starts the armourer and the market on their first page (UI state, kept between lives before, so a page
  // chosen in one life opened the next one on Bows or on Fine goods)
  if (typeof A.newGame === 'function') {
    const ng = A.newGame;
    A.newGame = function () { const r = ng.apply(this, arguments); try { UI.shopSlot = 'weapon'; UI.shopQ = 'common'; } catch (e) {} return r; };
  }

  // ---- a pinned tooltip shows it is pinned (§5.8): a 2 px gold top edge and a pin glyph. 59-tooltips pins a popover
  // on a click (or a hover held); its stack says how each was opened. After every click and key the marks are synced.
  // (A click that pinned a hovered tooltip changed nothing on screen, and read as a dead control.)
  LOOK.syncPins = function () {
    const TT = UI.TT;
    if (!TT || !Array.isArray(TT.stack)) return;
    for (const el of document.querySelectorAll('.tt-pop.tt-pin')) if (!TT.stack.some(x => x && x.el === el && x.how !== 'hover')) el.classList.remove('tt-pin');
    for (const x of TT.stack) if (x && x.el) x.el.classList.toggle('tt-pin', x.how !== 'hover');
  };
  if (typeof window !== 'undefined') {
    const later = () => setTimeout(() => { try { LOOK.syncPins(); } catch (e) {} }, 0);
    window.addEventListener('click', later, true);
    window.addEventListener('keydown', later, true);
  }

  const TIER_VARS = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  LOOK.css = LOOK.css || {};
  LOOK.css.rows = `
/* ---- rarity (§1.5): a 2 px edge in the tier's colour, the gem, a glow by night */
${TIER_VARS.map(t => `${X(`.rar-${t}`)}{--tier:var(--r-${t})}`).join('\n')}
${X('.chip.rar')}{border:1.5px solid var(--tier);color:var(--tier);background:transparent;gap:3px;display:inline-flex;align-items:center}
${X('.rar-gem')}{color:var(--tier);font-size:1em;line-height:1;margin-right:3px}
${X('.card.gear-c.rar-card')}{border:2px solid var(--tier)}
${X('.card.gear-c[data-tier=uncommon]')}{--tier:var(--r-uncommon)} ${X('.card.gear-c[data-tier=rare]')}{--tier:var(--r-rare)} ${X('.card.gear-c[data-tier=epic]')}{--tier:var(--r-epic)} ${X('.card.gear-c[data-tier=legendary]')}{--tier:var(--r-legendary)}
${X('.card.gear-c[data-tier=common]')}{border-width:1px}
${X('.achgrid .card.ach.rar')}{border:2px solid var(--tier);position:relative}
${X('.achgrid .card.ach.rar.lock')}{border:1px dashed var(--line-strong)}
${X('.achgrid .card.ach.rar.lock .rar-gem')}{color:var(--ink-3)}
${X('.achgrid .card.ach .rar-w')}{display:block;margin-top:4px;font-family:var(--f-ui);font-size:var(--t-cap,12px);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--tier)}
${X('.achgrid .card.ach.lock .rar-w')}{color:var(--ink-3)}
:root[data-theme=dark] .achgrid .card.ach.rar:not(.lock), :root[data-theme=dark] .card.gear-c.rar-card:not([data-tier=common]){box-shadow:0 0 14px color-mix(in srgb,var(--tier) 30%,transparent)}

/* ---- People and the court as rows (§4.5): bust 24, name, the relation and age, the bond chip, a 48 px opinion bar */
${X('.card.person.click.lk-row')}{display:grid;grid-template-columns:22px minmax(0,1fr) 48px;align-items:center;column-gap:8px;min-height:26px;padding:1px 8px;margin:0;
  background:transparent;border:0;border-bottom:1px solid var(--line);border-radius:0;box-shadow:none}
${X('.card.person.click.lk-row:hover')}{background:var(--raised)}
${X('.card.person.click.lk-row > .pp')}{width:22px;height:22px;flex:none;margin:0;overflow:hidden;border-radius:var(--r-xs,3px)}
${X('.card.person.click.lk-row > .pp > svg, .card.person.click.lk-row > .pp > .portrait')}{width:22px!important;height:22px!important}
${X('.card.person.click.lk-row > .lk-row-m')}{display:flex;align-items:baseline;gap:8px;min-width:0;white-space:nowrap;overflow:hidden}
${X('.card.person.click.lk-row > .lk-row-m > .nm')}{flex:none;font-family:var(--f-ui);font-size:var(--t-ui,14px);font-weight:600;line-height:20px;max-width:55%;overflow:hidden;text-overflow:ellipsis}
${X('.card.person.click.lk-row > .lk-row-m > .sub')}{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;font-size:var(--t-small,13px);color:var(--ink-3)}
${X('.card.person.click.lk-row > .lk-row-m > .bondline')}{order:3;flex:none;margin:0;display:flex;gap:4px}
${X('.card.person.click.lk-row > .lk-row-m > .bondline .chip')}{height:18px;line-height:16px;padding:0 6px;font-size:var(--t-cap,12px)}
${X('.card.person.click.lk-row > .opbar')}{width:48px;margin:0}
${X('.card.person.click.lk-row > .opbar .bar')}{height:4px}
@media (pointer:coarse){${X('.card.person.click.lk-row')}{min-height:44px}}
@media (max-width:760px){${X('.card.person.click.lk-row > .lk-row-m')}{flex-wrap:wrap;white-space:normal;row-gap:0}${X('.card.person.click.lk-row > .lk-row-m > .nm')}{max-width:none}${X('.card.person.click.lk-row > .lk-row-m > .sub')}{flex-basis:100%;white-space:nowrap}}

/* ---- the Realm tab's header band */
${X('.lk-band')}{margin:0 0 12px;padding:12px;border-radius:var(--r-m,10px);border:1px solid var(--line);background:linear-gradient(180deg,var(--lk-tint,var(--raised)) 0,var(--surface) 140%);box-shadow:inset 3px 0 0 var(--lk-sw,var(--line-strong))}
${X('.lk-band-id')}{display:flex;align-items:center;gap:12px}
${X('.lk-band-coat svg')}{display:block;width:34px;height:auto}
${X('.lk-band-t')}{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}
${X('#tabbody .lk-band .lk-band-n, #tabbody .lk-band b.lk-band-n')}{font-family:var(--f-display);font-size:var(--t-name,18px);line-height:24px;color:var(--lk-ink,var(--ink));overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${X('.lk-band-r')}{font-size:var(--t-small,13px);color:var(--ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${X('.lk-band-bust')}{flex:none;width:48px;height:48px;overflow:hidden;border-radius:var(--r-s,6px)}
${X('.lk-band-bust svg')}{width:48px;height:48px;display:block}
${X('.lk-band-k')}{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 0}
${X('.lk-band-k > div')}{margin:0;min-width:0}
${X('.lk-band-k dt')}{font-family:var(--f-ui);font-size:var(--t-cap,12px);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3)}
${X('.lk-band-k dd')}{margin:0;font-family:var(--f-ui);font-size:var(--t-num-lg,20px);line-height:24px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--ink)}
@media (max-width:760px){${X('.lk-band-k')}{grid-template-columns:repeat(2,minmax(0,1fr))}}

/* ---- a beast's card in the Codex */
${X('.card.rar-beast')}{border-left:3px solid var(--tier)}
${X('.card.rar-beast.rar-legendary, .card.rar-beast.rar-mythic')}{border:2px solid var(--tier)}
:root[data-theme=dark] .card.rar-beast.rar-legendary, :root[data-theme=dark] .card.rar-beast.rar-mythic{box-shadow:0 0 14px color-mix(in srgb,var(--tier) 30%,transparent)}

/* ---- the rail's delta flash */
${X('#profile .barrow.lk-flashing')}{position:relative}
${X('#profile .lk-dlt')}{position:absolute;right:-4px;top:-11px;padding:0 4px;border-radius:var(--r-xs,3px);background:var(--overlay);box-shadow:var(--e-1);
  font-family:var(--f-ui);font-size:var(--t-cap,12px);font-weight:700;font-variant-numeric:tabular-nums;line-height:16px;white-space:nowrap;pointer-events:none;z-index:2}
/* cycle 2 (visual B9): the chip rides above the row's top-right corner, on its own plate, so the number it reports
   stays in sight and the label keeps its width */
${X('#profile .lk-stats .barrow .lk-dlt')}{top:-9px;right:-3px}
${X('#profile .barrow.lk-flashing > .lbl, #profile .barrow.lk-flashing > .val')}{flex-shrink:0}
${X('#profile .lk-dlt.up')}{color:var(--ok)}
${X('#profile .lk-dlt.dn')}{color:var(--danger)}
@keyframes lkPulse{0%{filter:brightness(1)}40%{filter:brightness(1.8)}100%{filter:brightness(1)}}
@keyframes lkDlt{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:no-preference){:root:not([data-motion=reduced]):not([data-motion=off]) #profile .barrow.lk-pulse .bar > i{animation:lkPulse 300ms ease-out 1}
  :root:not([data-motion=reduced]):not([data-motion=off]) #profile .lk-dlt{animation:lkDlt var(--m-snap,240ms) var(--ease-snap,ease-out) both}}

/* ---- the rail's proficiencies: one line each, the name cut with an ellipsis (a long name such as "Hafts: axe, mace &
   spear" wrapped to two lines and pushed the rail's buttons out of sight at 1366 x 768); the full name is the row's label */
@media (min-width:761px){${X('#profile .profs .prow > span:first-child')}{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}

/* ---- sparklines */
${X('.lk-spark')}{display:block;width:60px;height:16px;color:var(--ink-2);overflow:visible}
${X('.lk-spark .lk-spark-dot')}{fill:var(--accent)}
${X('.lk-band-k dd.lk-band-sp')}{margin-top:2px;line-height:0}
${X('#profile .lk-stats > .barrow > .lk-spark')}{width:100%;max-width:60px;height:12px;margin-top:2px;grid-column:1 / -1}

/* ---- a war's strength, us against them */
${X('.lk-str')}{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;margin-top:6px;font-family:var(--f-ui);font-size:var(--t-small,13px);font-variant-numeric:tabular-nums}
${X('.lk-str-b')}{height:6px;border-radius:var(--r-xs,3px);background:var(--danger);overflow:hidden;display:block}
${X('.lk-str-b > i')}{display:block;height:100%;background:var(--ok)}
${X('.lk-str-n.lk-us')}{color:var(--ok);font-weight:700}
${X('.lk-str-n.lk-them')}{color:var(--danger);font-weight:700}

/* ---- a realm chip: an 8 px swatch dot with a line edge, the name in the realm's ink */
${X('.lk-realm')}{display:inline-flex;align-items:center;gap:6px;color:var(--lk-ink,var(--ink));font-weight:600}
:root[data-theme=dark] .lk-realm{color:var(--lk-ink-d,var(--lk-ink,var(--ink)))}
:root[data-theme=light] .lk-realm{color:var(--lk-ink-l,var(--lk-ink,var(--ink)))}
${X('.card.person.click.lk-row > .lk-row-m > .lk-row-r')}{flex:none;order:2;font-size:var(--t-small,13px)}
/* cycle 2 (visual B11): a chip in a row ends in an ellipsis, never a clipped letter; its words are in its title */
${X('.card.person.click.lk-row .chip')}{display:inline-block;max-width:14ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom}
${X('.card.person.click.lk-row > .lk-row-m > .bondline')}{min-width:0;flex:0 1 auto;overflow:hidden}
${X('.card.person.click.lk-row > .lk-row-m > .sub')}{order:1}
${X('.lk-realm > i')}{flex:none;width:8px;height:8px;border-radius:2px;background:var(--lk-sw);box-shadow:0 0 0 1px var(--line-strong)}

/* ---- a dialog's close button: the glyph fills its 32 px button (it drew as a speck inside the focus ring) */
${X('button.closex')}{display:inline-grid;place-items:center;padding:0}
${X('button.closex > svg')}{width:18px;height:18px;stroke-width:2}

/* ---- a pinned tooltip */
${X('.tt-pop.tt-pin')}{border-top:2px solid var(--accent)}
${X('.tt-pop.tt-pin::after')}{content:"";position:absolute;top:6px;right:8px;width:10px;height:10px;opacity:.8;background:var(--accent);
  -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 3h6l-1 6 4 4H6l4-4zM12 13v8' fill='none' stroke='black' stroke-width='2.4' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat;
  mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 3h6l-1 6 4 4H6l4-4zM12 13v8' fill='none' stroke='black' stroke-width='2.4' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat}

/* ---- Holdings: what you carry as one row per slot (the slot, the piece and its tier, what it does, Sell) */
${X('#tabbody .grid2:has(> .card.gear-c)')}{display:flex;flex-direction:column;gap:0;border-top:1px solid var(--line)}
${X('#tabbody .grid2 > .card.gear-c')}{display:grid;grid-template-columns:64px minmax(0,1fr) minmax(0,auto) auto;align-items:center;column-gap:10px;min-height:30px;padding:2px 8px;margin:0;
  border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent;box-shadow:none}
${X('#tabbody .grid2 > .card.gear-c.rar-card')}{border:0;border-bottom:1px solid var(--line);box-shadow:inset 3px 0 0 var(--tier)}
${X('#tabbody .grid2 > .card.gear-c > .tag')}{margin:0;font-size:var(--t-cap,12px)}
${X('#tabbody .grid2 > .card.gear-c > div')}{margin:0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${X('#tabbody .grid2 > .card.gear-c > .muted')}{font-size:var(--t-small,13px);text-align:right}
${X('#tabbody .grid2 > .card.gear-c > button')}{margin:0;grid-column:4}
@media (pointer:coarse){${X('#tabbody .grid2 > .card.gear-c')}{min-height:44px}}
@media (max-width:760px){${X('#tabbody .grid2 > .card.gear-c')}{grid-template-columns:56px minmax(0,1fr) auto}${X('#tabbody .grid2 > .card.gear-c > .muted')}{grid-column:2;grid-row:2;text-align:left;white-space:normal}${X('#tabbody .grid2 > .card.gear-c > button')}{grid-column:3;grid-row:1 / span 2}}

/* ---- a career's ladder as one horizontal track (§4.5): a dot per rank on a line, the ranks behind you filled in gold,
   your own a larger gold dot with its name in gold; the release's chevrons give way to the line */
${X('.ladder')}{display:flex;align-items:flex-start;flex-wrap:nowrap;gap:0;margin:10px 0 6px;padding:0 0 4px;overflow-x:auto;background:transparent;border:0}
${X('.ladder > i')}{display:none}
${X('.ladder > span, .ladder span')}{flex:1 1 0;min-width:52px;position:relative;margin:0;padding:16px 2px 0;border:0;border-radius:0;background:transparent;text-align:center;
  font-family:var(--f-ui);font-size:var(--t-small,13px);line-height:1.25;color:var(--ink-3);overflow-wrap:normal;word-break:keep-all;hyphens:none}
/* cycle 2 (visual B7): a rank's name is never broken mid-word ("Comma / nder"): each stop is as wide as its longest
   word, the track scrolls sideways if it must, and the passed ranks are not struck through (the gold dots say it) */
${X('.ladder > span')}{flex:1 0 auto;min-width:min-content;padding-left:4px;padding-right:4px;font-size:var(--t-cap,12px)}
${X('.ladder > span.done, .ladder > span s, .ladder s, .ladder del')}{text-decoration:none}
${X('.ladder > span::before')}{content:"";position:absolute;z-index:1;top:3px;left:50%;width:9px;height:9px;margin-left:-4.5px;border-radius:50%;background:var(--sunken);box-shadow:0 0 0 1.5px var(--line-strong)}
${X('.ladder > span::after')}{content:"";position:absolute;top:7px;left:calc(50% + 6px);width:calc(100% - 12px);height:2px;background:var(--line-strong)}
${X('.ladder > span:last-of-type::after')}{display:none}
${X('.ladder > span.done')}{color:var(--ink-2)}
${X('.ladder > span.done::before')}{background:var(--accent);box-shadow:none}
${X('.ladder > span.done::after')}{background:var(--accent)}
${X('.ladder > span.now')}{color:var(--accent);font-weight:700;background:transparent;border:0}
${X('.ladder > span.now::before')}{top:1px;width:13px;height:13px;margin-left:-6.5px;background:var(--accent-fill);box-shadow:0 0 0 2px var(--surface),0 0 0 3.5px var(--accent)}

/* ---- the armourer and the market: dense rows */
${X('#tabbody table td, #tabbody table th')}{padding-top:3px;padding-bottom:3px}
${X('#tabbody table td.lk-shop-c')}{cursor:default}
`;
})();
