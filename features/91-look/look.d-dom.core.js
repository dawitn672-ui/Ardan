// 91-look, part 4: the small reshaping the new layout needs after each draw, on top of 90-fold's sections:
// - the rail: an 88 px bust beside the name, the rank (fighting tier) under the post, the chips in one row with a
//   "+N" for the rest, the six vitals 2 x 3, the six stats as 3 x 2 tiles with their colour and icon, the four needs of
//   35-moods (moved here from the Life tab), and the profile's buttons in one row;
// - the Life panel: each activity tile gets its group's icon and a tooltip (59-tooltips' engine, UI.TIPS.act) that
//   holds the description the tile no longer prints; the initiative line moves into the Activities header;
// - the ground: a star field and a far ridge by night, seeded from the world's seed through a hash.
// It only reads the game and the page and rewrites markup already drawn: no A.rand, no change to A.S.
(function () {
  const LOOK = UI.LOOK, esc = s => UI.esc(String(s == null ? '' : s));
  const svg = d => `<svg class="ic s" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
  const ic = k => (UI.ICONS && UI.ICONS[k]) || '';
  // the six stats: one icon each (brief §1.3): fist, wing, eye, flame, lamp, peak
  LOOK.STAT_ICON = {
    str: '<path d="M7 12V8a1.5 1.5 0 0 1 3 0v3"/><path d="M10 11V7a1.5 1.5 0 0 1 3 0v4"/><path d="M13 11V7.5a1.5 1.5 0 0 1 3 0V12"/><path d="M16 10.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.8-2.4L5 15.2a1.6 1.6 0 0 1 2.4-2.1L9 14.5"/>',
    spd: '<path d="M21 4C15 4 8 7 4 14c3-1.5 6-2 9-2"/><path d="M6 11c3-.5 6-1 9-3"/><path d="M4 14c-.5 2-.5 4 0 6"/><path d="M4 20c4-1 8-3 10-6"/>',
    ins: ic('eye'),
    sta: ic('flame'),
    int: '<path d="M3 15c0 2.2 3 3.5 7 3.5h3.5c3.5 0 6.5-1.6 6.5-4.5H3z"/><path d="M20 14c1.2-.2 1.6-1.2 1.4-2.4"/><path d="M11.5 4c1.6 1.9 1.6 3.6 0 5.4C9.9 7.6 9.9 5.9 11.5 4z"/><path d="M11.5 9.4V14"/><path d="M8 21.5h7"/>',
    wil: '<path d="M2.5 20.5l6.5-11 3.5 5 3-5.5 6 11.5z"/><path d="M13.6 12.5l1.4 1.3 1.2-1.2"/>',
  };
  // the action groups (brief §7.4), from the release's icon set where it has one
  LOOK.GROUP_ICON = {
    'only now': 'sparkles', 'body & mind': 'book-open', social: 'users', faith: 'flame', health: 'heart', wilds: 'paw', glory: 'award', money: 'coins',
    world: 'route', war: 'swords', intrigue: 'eye', crime: 'knife', work: 'hammer', 'at work': 'hammer', study: 'book-open', craft: 'hammer', family: 'house',
    love: 'heart', court: 'crown',
  };
  const KNIFE = '<path d="M14.5 3.5l6 6-9.5 9.5-3-3z"/><path d="M8 16l-4.5 4.5"/><path d="M5 16.5l2.5 2.5"/>';
  LOOK.groupIcon = g => { const k = LOOK.GROUP_ICON[g] || 'star'; return svg(k === 'knife' ? KNIFE : ic(k) || ic('star')); };

  // ---- the activity tooltip: what the tile no longer prints
  UI.TIPS = UI.TIPS || {};
  UI.TIPS.act = function (k) {
    const D = GD.ACTIVITIES && GD.ACTIVITIES[k];
    if (!D) return '';
    let ok = true, why = '';
    try { const r = A.canAct(k); ok = !!r[0]; why = r[1] || ''; } catch (e) {}
    const cost = D.cost ? `${D.cost} initiative` : 'free';
    const meets = A.MOODS && A.MOODS.ACT && A.MOODS.ACT[k] ? Object.entries(A.MOODS.ACT[k]).map(([n, v]) => `${n} ${v > 0 ? '+' : '−'}${Math.abs(v)}`).join(', ') : '';
    const group = String(D.cat || '').replace(/^Only now$/, 'Only now' + (D.stage ? ', in ' + D.stage : ''));
    return `<div class="tip-h">${esc(D.name)}</div><p class="tip-d">${esc(D.desc || '')}</p>` +
      `<div class="tip-row"><span>Costs</span><b>${esc(cost)}</b></div>` +
      (meets ? `<div class="tip-row"><span>Meets</span><b>${esc(meets)}</b></div>` : '') +
      `<div class="tip-row"><span>Group</span><b>${esc(group)}</b></div>` +
      (!ok && why ? `<p class="tip-f">Not now: ${esc(why)}</p>` : '');
  };

  // ---- the rail
  const VITALS = { health: 'health', happiness: 'happiness', looks: 'looks', renown: 'renown', honor: 'honor', honour: 'honor', piety: 'piety' };
  LOOK.chipsOpen = false;
  LOOK.rail = function (pr, pc) {
    if (!pr || !pc || pr.querySelector(':scope > .lk-vitals, :scope > .lk-stats')) return;
    const pid = pr.querySelector(':scope > .fold-pid');
    if (pid) {
      const wrap = pid.querySelector('.portrait-wrap');
      if (wrap && !pid.querySelector('.lk-bust') && typeof PORTRAIT !== 'undefined' && PORTRAIT.svg) {
        const b = document.createElement('div');
        b.className = 'lk-bust' + (pc.ruler ? ' lk-ruler' : pc.house ? ' lk-noble' : '');
        b.innerHTML = PORTRAIT.svg(pc, 88, { bust: true });
        wrap.before(b);
      }
      const side = pid.querySelector('.fold-pid-t'), chips = side && side.querySelector(':scope > .center');
      if (side && chips) {
        const tier = chips.querySelector('.chip.tier');
        if (tier) { const r = document.createElement('div'); r.className = 'lk-rank'; r.appendChild(tier); side.appendChild(r); }
        chips.classList.add('lk-chips');
        chips.removeAttribute('style');
        pid.after(chips);
      }
    }
    const bars = pr.querySelectorAll(':scope > .fold-bars');
    if (bars[0]) {
      bars[0].classList.add('lk-vitals');
      for (const r of bars[0].querySelectorAll(':scope > .barrow')) {
        const k = VITALS[(r.querySelector('.lbl') || r).textContent.trim().toLowerCase()];
        if (k) r.classList.add('lk-v-' + k);
        const v = parseFloat((r.querySelector('.val') || {}).textContent);
        if (!isNaN(v) && v < 25 && k !== 'renown') r.classList.add('lk-low');
      }
    }
    if (bars[1]) {
      bars[1].classList.add('lk-stats');
      const rows = bars[1].querySelectorAll(':scope > .barrow'), keys = (GD.STATS || []).slice(0, rows.length);
      rows.forEach((r, i) => {
        const k = keys[i]; if (!k) return;
        r.classList.add('st-' + k);
        const s = document.createElement('span'); s.className = 'lk-si'; s.innerHTML = svg(LOOK.STAT_ICON[k] || ''); r.prepend(s);
        const lbl = r.querySelector('.lbl'), t = lbl && (lbl.querySelector('[data-tt],[data-tip],.tt,.tipt') || lbl);
        const nm = LOOK.STATS[k];
        if (t && nm) { const full = t.textContent.trim() || nm[0]; t.textContent = nm[1]; t.setAttribute('aria-label', `${full} (${nm[1]})`); t.setAttribute('title', full); }
      });
      // the needs of 35-moods, after the stats
      if (A.MOODS && A.MOODS.needs && A.age && A.age(pc) >= 6 && !pr.querySelector('.lk-needs')) {
        const n = A.MOODS.needs(pc), m = A.MOODS.mood ? A.MOODS.mood(pc) : null, LOW = A.MOODS.LOW || 30;
        const NAME = { rest: 'Rest', company: 'Company', purpose: 'Purpose', comfort: 'Comfort' };
        const row = k => { const v = Math.round(n[k]); return `<div class="lk-need${v < LOW ? ' lk-low' : ''}"><span class="lbl">${UI.tt ? UI.tt('need', k, NAME[k]) : NAME[k]}</span><span class="val"${UI.ttAttrs ? UI.ttAttrs('need', k, false) : ''}>${esc(v)}</span><div class="bar" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div></div>`; };
        const box = document.createElement('div');
        box.className = 'lk-needs';
        box.setAttribute('role', 'group');
        box.setAttribute('aria-label', 'How you are');
        box.innerHTML = `<div class="lk-nh"><span class="tag">${UI.tt ? UI.tt('needs', '', 'How you are') : 'How you are'}</span><span class="lk-mood${m && m.k !== 'content' ? '' : ' ok'}">${esc(m ? m.name : 'Well enough')}</span></div>` +
          (A.MOODS.NEEDS || Object.keys(NAME)).map(row).join('');
        bars[1].after(box);
      }
    }
    // the profile's buttons in one row at the foot of the rail
    const btns = [...pr.querySelectorAll('.row > button[data-a="ov"]')];
    if (btns.length) {
      const row = document.createElement('div'); row.className = 'lk-railrow';
      for (const b of btns) { const p = b.parentElement; row.appendChild(b); if (p && !p.children.length) p.remove(); }
      for (const s of pr.querySelectorAll('.fold-b > .sep')) s.remove();
      pr.appendChild(row);
    }
    // two columns (761-1099 px): the rail is a strip, and this button opens it whole
    const rb = document.createElement('button');
    rb.type = 'button'; rb.className = 'small lk-railbtn'; rb.dataset.a = 'lookRail';
    rb.setAttribute('aria-expanded', String(!!LOOK.railOpen));
    rb.textContent = LOOK.railOpen ? 'Close' : 'Stats';
    pr.appendChild(rb);
    LOOK.chipFit(pr);
  };
  // the chips in one row: what does not fit is counted in a "+N" chip that shows the rest
  LOOK.chipFit = function (pr) {
    const row = pr && pr.querySelector(':scope > .lk-chips');
    if (!row || row.querySelector('.lk-more') || !row.offsetWidth) return;
    const chips = [...row.children].filter(c => c.classList.contains('chip'));
    const W = row.clientWidth, MORE = 40;
    let cut = 0;
    for (const c of chips) { if (c.offsetLeft - row.offsetLeft + c.offsetWidth > W - (cut || c !== chips[chips.length - 1] ? MORE : 0)) { c.classList.add('lk-cut'); cut++; } }
    if (!cut) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip lk-more'; b.dataset.a = 'lookChips';
    b.setAttribute('aria-expanded', String(LOOK.chipsOpen));
    b.setAttribute('aria-label', LOOK.chipsOpen ? 'Show fewer' : `Show ${cut} more`);
    b.title = LOOK.chipsOpen ? 'Show fewer' : `${cut} more: ` + chips.filter(c => c.classList.contains('lk-cut')).map(c => c.textContent.trim()).join(', ');
    b.textContent = LOOK.chipsOpen ? 'fewer' : '+' + cut;
    row.classList.toggle('lk-open', LOOK.chipsOpen);
    row.appendChild(b);
  };

  // ---- the Life panel
  LOOK.panel = function (tb, phone) {
    if (!tb) return;
    const life = UI.tab === 'life';
    tb.classList.toggle('lk-life', life && !phone);
    if (!life) return;
    for (const t of tb.querySelectorAll('.lk-acts > .act:not([data-lk])')) {
      t.dataset.lk = '1';
      const s = document.createElement('span'); s.className = 'lk-gi'; s.setAttribute('aria-hidden', 'true'); s.innerHTML = LOOK.groupIcon(t.dataset.g || ''); t.prepend(s);
      const c = t.querySelector('.cost'); if (c && /free/i.test(c.textContent)) c.classList.add('lk-free');
      if (t.dataset.a === 'act' && t.dataset.v && !t.dataset.tt) t.dataset.tt = 'act';
    }
    // the initiative line, as the Activities header's summary
    const ini = [...tb.children].find(e => e.matches && e.matches('.row.small.muted') && /Initiative/.test(e.textContent));
    const head = tb.querySelector(':scope > .fold-acts > .fold-head');
    if (ini) {
      ini.classList.add('lk-ini');
      if (head && !phone) {
        const txt = ini.textContent.replace(/\s+/g, ' ').trim().replace(/^Initiative ([\d.]+)/, '$1 initiative');
        let s = head.querySelector(':scope > .fold-sum');
        if (!s) { s = document.createElement('span'); s.className = 'fold-sum lk-keep'; s.setAttribute('aria-hidden', 'true'); head.appendChild(s); }
        s.classList.add('lk-keep'); s.textContent = txt;
      }
    }
    if (!phone) for (const w of tb.querySelectorAll('.wn-item')) { const y = w.querySelector('.wn-why'); if (y && !w.title) w.title = y.textContent.trim(); }
    // Your days: what you train is chosen often, so its select rides in the header and stays in reach when the card is
    // folded to its summary; the rest (how hard, free hours, the breakthrough) is one click away
    const plan = tb.querySelector('.plan-card');
    if (plan && !plan.querySelector('.lk-yd-sel')) {
      const sel = plan.querySelector('.plan-grid select[aria-label="Training focus"]'), head = plan.querySelector(':scope > .fold-x + .row') || plan.querySelector(':scope > .row');
      const box = sel && sel.parentElement;
      if (box && head && box.parentElement && box.parentElement.classList.contains('plan-grid')) {
        const lab = box.previousElementSibling;
        box.classList.add('lk-yd-sel');
        const tag = head.querySelector('.tag');
        if (tag) tag.after(box); else head.prepend(box);
        if (lab && lab.classList.contains('plan-l')) lab.classList.add('lk-vh');
        head.classList.add('lk-yd-head');
      }
    }
  };

  // a name for an avatar that opens a person (a button with only a picture), from the name beside it that opens the
  // same; 71-phone does the same on a phone
  LOOK.names = function (root) {
    if (!root) return;
    for (const el of root.querySelectorAll('[data-a]:not(button):not([aria-label]), [role=button]:not([aria-label]):not([aria-labelledby])')) {
      if (el.textContent.trim() || !el.dataset.a) continue;
      const twin = [...root.querySelectorAll(`[data-a="${CSS.escape(el.dataset.a)}"]`)].find(x => x !== el && x.dataset.v === el.dataset.v && x.textContent.trim());
      if (twin) el.setAttribute('aria-label', twin.textContent.trim().slice(0, 60));
    }
  };
  // ---- the ground: stars and a far ridge, seeded from the world's seed (brief §3.3); static, drawn once per world
  let groundSeed = null;
  LOOK.ground = function () {
    const seed = A.S && A.S.seed != null ? String(A.S.seed) : 'ardan';
    if (seed === groundSeed) return;
    groundSeed = seed;
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
    const W = 1600, H = 900;
    let dots = '';
    for (let i = 0; i < 140; i++) dots += `<circle cx="${(rnd() * W).toFixed(1)}" cy="${(rnd() * (H - 120)).toFixed(1)}" r="${rnd() < 0.15 ? 1.4 : 0.9}"/>`;
    let ridge = `M0 ${H} L0 ${H - 30}`;
    for (let x = 0; x <= W; x += 40) ridge += ` L${x} ${(H - 22 - rnd() * 30 - Math.sin(x / 260) * 8).toFixed(1)}`;
    ridge += ` L${W} ${H} Z`;
    const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice"><g fill="#c9d2f0" fill-opacity=".2">${dots}</g><path d="${ridge}" fill="#111731"/></svg>`;
    document.documentElement.style.setProperty('--ground-img', `url("data:image/svg+xml,${encodeURIComponent(s)}")`);
  };

  // ---- actions (data-a, through UI.A; no inline handlers)
  Object.assign(UI.A, {
    lookChips(v, el) {
      LOOK.chipsOpen = !LOOK.chipsOpen;
      const row = el && el.closest('.lk-chips');
      if (row) {
        row.classList.toggle('lk-open', LOOK.chipsOpen);
        const cut = [...row.querySelectorAll('.chip.lk-cut')], n = cut.length;
        el.textContent = LOOK.chipsOpen ? 'fewer' : '+' + n;
        el.setAttribute('aria-expanded', String(LOOK.chipsOpen));
        el.setAttribute('aria-label', LOOK.chipsOpen ? 'Show fewer' : `Show ${n} more`);
        el.title = LOOK.chipsOpen ? 'Show fewer' : `${n} more: ` + cut.map(c => c.textContent.trim()).join(', ');
      }
    },
    lookRail(v, el) {
      LOOK.railOpen = !LOOK.railOpen;
      const g = document.getElementById('game'); if (g) g.classList.toggle('lk-rail-open', LOOK.railOpen);
      if (el) { el.setAttribute('aria-expanded', String(LOOK.railOpen)); el.textContent = LOOK.railOpen ? 'Close' : 'Stats'; }
    },
  });

  LOOK.apply = function () {
    if (LOOK.OFF || typeof document === 'undefined') return;
    try {
      const game = document.getElementById('game');
      LOOK.keepLast();
      if (!game) return;
      const phone = game.classList.contains('phone'), pc = A.pc && A.pc();
      game.classList.toggle('lk-rail-open', !!LOOK.railOpen && !phone);
      if (!phone) LOOK.rail(document.getElementById('profile'), pc);
      LOOK.panel(document.getElementById('tabbody'), phone);
      if (!phone) LOOK.names(document.getElementById('tabbody'));
      LOOK.ground();
    } catch (e) { console.error('look', e); }
  };
})();
