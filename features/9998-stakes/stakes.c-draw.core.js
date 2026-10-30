// 9998-stakes, part 3: drawing the stakes. Pure: it reads the view, the written event and the player, never A.rand,
// never A.S's contents (the tests hash the state and the random stream around every drawing).
//
// - Every event choice carries one row of chips under its label (part 1's grammar). The row keeps 97-life-fixes'
//   class (.lf-stake) and its words ("Costs 30 suns", "If it fails: hurt, −5 suns, their regard"), so what read the
//   old line still reads it; 97's own line is switched off while this one is on, and 92's two hints give way to it.
// - A failed white check that is ready again says so first: "Again: you are better at this now (+7 since 1112)".
// - The locked choices (part 2) follow the choices, greyed, each with its reason: "Needs 40 suns (you have 12)",
//   "Not yet: you failed this in 1112 at 23; at 28 you may try again", "You failed this in 1112. It does not come again."
//   They are rows, not buttons, so keys 1-6 and the release's counter count only what can be chosen.
// - With the scene card off (92), the white and red marks go on the chip row; with it on, the card puts them on the right.
// - Registered kinds (A.STAKES.add(kind, ...) for a data-a action) are drawn after every render: a chip row inside each
//   <button data-a=kind>. A.STAKES.why(kind, ...) feeds 97's reasons for disabled controls (LF.WHY).
(function () {
  const ST = A.STAKES, LF = A.LF = A.LF || {};
  const esc = s => UI.esc(String(s == null ? '' : s));
  const coin = n => (A.coin ? A.coin(Math.round(n)) : Math.round(n) + ' suns');
  const digits = () => (A.DIFF && A.DIFF.showOdds ? !!A.DIFF.showOdds() : !!(UI.set && UI.set.odds !== false));
  const cardOn = () => !!(UI.SCENE && UI.SCENE.off && !UI.SCENE.off());

  // 97's line gives way while this one is on (its switch, read each time it draws)
  let lfOff = false;
  try { Object.defineProperty(LF, 'STAKES_OFF', { get: () => lfOff || ST.on(), set: v => { lfOff = !!v; }, configurable: true }); } catch (e) {}

  const curQ = () => (UI.TT && UI.TT.cur && UI.TT.cur.ev) || (A.S && A.S.queue && A.S.queue[0]) || null;
  // the chips of the choice drawn at index vi of the event on screen (shared by the row and its popovers)
  ST.rowChips = function (q, vi) {
    const e = q && A.EV[q.ev], v = q && q.view, pc = A.pc();
    const vc = v && v.choices && v.choices[vi], c = vc && vc.i >= 0 && e ? e.choices[vc.i] : null;
    if (!c || !pc) return [];
    const chips = ST.choiceChips(c, e, q, pc, vc);
    const rs = ST.retryState(pc, e, vc.i);
    if (rs.rec && rs.ready && rs.kind === 'white' && rs.gain != null)
      chips.unshift({ k: 'again', t: digits() ? `Again: you are better at this now (+${Math.round(rs.gain)} since ${rs.rec.y})` : `Again: you are better at this now than in ${rs.rec.y}` });
    if (!cardOn()) {
      const kind = ST.checkKind(c, e);
      if (kind === 'red') chips.push({ k: 'red', t: 'One chance' });
      else if (kind === 'white') chips.push({ k: 'white', t: '↻ can be tried again' });
    }
    return chips;
  };

  // ---- the popovers (59-tooltips) ------------------------------------------------------------------------------------
  const WHAT = {
    gain: ['A sure gain', 'Comes with this choice, as written.'],
    cost: ['A sure cost', 'Comes with this choice, as written.'],
    win: ['If it works', 'What the scene gives when the check succeeds.'],
    risk: ['If it fails', 'What the scene takes when the check fails.'],
    safe: ['Nothing lost', 'A failure here costs you nothing that shows, though it may still sting. A failed check teaches more than a passed one.'],
    touch: ['It touches', 'The scene changes this, but it does not say which way, or by how much.'],
    again: ['A white check, again', 'You failed this check once. You have grown since, so the scene offers it again.'],
    red: ['One chance', 'Failing costs something that lasts, or the scene comes once in a life. Fail it, and it is not offered again.'],
    white: ['A white check', 'Fail it, and you can try again here once you are better at it (5 more than you had).'],
    note: ['Stakes', ''],
  };
  if (UI.TT && UI.TT.K) {
    const G = UI.TIPS = UI.TIPS || {}, K = UI.TT.K;
    // arg "vi.ci": chip ci of choice vi of the event on screen
    G.stChip = function (arg) {
      const [vi, ci] = String(arg).split('.').map(Number), q = curQ(), chips = ST.rowChips(q, vi), ch = chips[ci];
      if (!ch) return '';
      const w = WHAT[ch.k] || WHAT.note, vc = q && q.view && q.view.choices[vi];
      const odds = vc && (vc.odds != null ? vc.odds : vc.fight ? vc.fight.pct : null);
      const val = ch.k === 'risk' && odds != null && digits() ? (100 - odds) + '%' : ch.k === 'win' && odds != null && digits() ? odds + '%' : null;
      let h = K.H(esc(w[0]), val, val ? (ch.k === 'risk' ? 'the chance it goes wrong' : 'the chance it works') : '');
      h += K.R(ST.chipText(ch.t), '');
      return h + K.F(esc(w[1]) + (odds != null && (ch.k === 'risk' || ch.k === 'win') ? ` See ${K.L('odds', vi, 'the odds')}.` : ''));
    };
    // arg "j": locked row j of the event on screen
    G.stLock = function (arg) {
      const q = curQ(), L = q && q.view && q.view.locked && q.view.locked[+arg];
      if (!L) return '';
      const why = ST.lockWhy(q, L);
      const title = L.lock === 'req' ? 'Out of reach' : L.lock === 'red' ? 'A red check, spent' : 'A white check, not yet';
      const foot = L.lock === 'req' ? 'The scene offers this when you have what it needs.' : L.lock === 'red' ? WHAT.red[1] : 'Raise the skill or stat it asks, by 5 or more, and it opens again.';
      return K.H(esc(title)) + K.D(esc(why)) + K.F(esc(foot));
    };
    G.stCheck = function (k) { const w = WHAT[k === 'red' ? 'red' : 'white']; return K.H(esc(w[0])) + K.F(esc(w[1])); };
  }
  const tipFor = (ch, vi, ci) => {
    if (!UI.ttAttrs) return '';
    if (ch.coin && ch.n) return UI.ttAttrs('cost', ch.n, false);
    if (ch.treasury && UI.TIPS && UI.TIPS.treasury) return UI.ttAttrs('treasury', '', false);
    return UI.ttAttrs('stChip', vi + '.' + ci, false);
  };

  // ---- the reason of a locked row -------------------------------------------------------------------------------------
  ST.lockWhy = function (q, L) {
    const pc = A.pc(), e = q && A.EV[q.ev], c = e && e.choices && e.choices[L.i];
    if (!pc || !c) return '';
    if (L.lock === 'req') return ST.reqWhy(c, pc, q.ctx || {});
    const rs = ST.retryState(pc, e, L.i), y = rs.rec && rs.rec.y;
    if (L.lock === 'red' || rs.kind === 'red') return y ? `You failed this in ${y}. It does not come again.` : 'It does not come again.';
    if (!rs.rec) return '';
    if (rs.ready) return '';
    const ck = c.check || {}, what = [ck.s, ck.s2].filter(Boolean).map(k => (GD.STATS || []).includes(k) ? String((GD.STAT_NAMES && GD.STAT_NAMES[k]) || k) : ST.skillWord(k)).join(' and ');
    const left = Math.max(1, Math.ceil(rs.rec.v + ST.RETRY_GAIN - (rs.rec.v + (rs.gain || 0))));
    if (!digits()) return `Not yet: you failed this in ${y}. Grow in ${what} first.`;
    return `Not yet: you failed this in ${y}. Grow ${left} more in ${what} to try again.`;
  };
  ST.lockedHtml = function (q) {
    const v = q && q.view;
    if (!v || !Array.isArray(v.locked) || !v.locked.length) return '';
    let rows = '';
    v.locked.forEach((L, j) => {
      const why = ST.lockWhy(q, L);
      if (!why) return;
      const tip = UI.ttAttrs ? UI.ttAttrs('stLock', j, true) : '';
      rows += `<div class="st-lock st-lock-${esc(L.lock)}"${tip}><span class="st-lock-i" aria-hidden="true"></span><span class="st-lock-t">${esc(L.t)}</span>` +
        `<small class="st-why"><span class="sc-vh">Out of reach: </span>${esc(why)}</small></div>`;
    });
    return rows ? `<div class="st-locked" role="group" aria-label="Out of reach">${rows}</div>` : '';
  };

  // ---- the event modal ------------------------------------------------------------------------------------------------
  const modal = UI.eventModal;
  UI.eventModal = function (q) {
    let h = modal.apply(this, arguments);
    if (!ST.on()) return h;
    try {
      const e = q && A.EV[q.ev], v = q && q.view;
      if (!e || !v || q.result || !Array.isArray(v.choices)) return h;
      h = h.replace(/(<button data-a="evChoose" data-v="(\d+)"><span class="grow">)([\s\S]*?)(<\/span>)/g, (all, a, idx, label, b) => {
        const vi = +idx, chips = ST.rowChips(q, vi);
        if (!chips.length) return all;
        return a + label + `<small class="lf-stake st-row">${ST.html(chips, (ch, ci) => tipFor(ch, vi, ci))}</small>` + b;
      });
      const lk = ST.lockedHtml(q);
      if (lk) {
        const at = h.indexOf('<div class="choices">');
        const end = at >= 0 ? h.indexOf('</div>', at) : -1;
        if (end > 0) h = h.slice(0, end + 6) + lk + h.slice(end + 6);
      }
    } catch (err) { console.error('stakes', err); }
    return h;
  };

  // ---- registered kinds: a chip row inside each <button data-a=kind>, after every draw --------------------------------
  ST.decorate = function (root) {
    if (!ST.on() || typeof document === 'undefined') return 0;
    const pc = A.S ? A.pc() : null;
    let n = 0;
    for (const kind of Object.keys(ST.reg)) {
      if (kind === 'choice' || !/^[\w-]+$/.test(kind)) continue;
      for (const el of (root || document).querySelectorAll(`[data-a="${kind}"]`)) {
        if (el.querySelector(':scope > .st-row')) continue;
        const chips = ST.run(kind, el.getAttribute('data-v'), pc, el);
        if (!chips.length) continue;
        el.insertAdjacentHTML('beforeend', `<small class="st-row">${ST.html(chips)}</small>`);
        n++;
      }
    }
    return n;
  };
  for (const name of ['render', 'refreshTab', 'refresh', 'renderModal']) {
    const f = UI[name];
    if (typeof f !== 'function') continue;
    UI[name] = function () {
      const r = f.apply(this, arguments);
      try { ST.decorate(); } catch (e) { console.error('stakes decorate', e); }
      return r;
    };
  }
  // a reason registered for a disabled control joins 97's (LF.WHY, by data-a), ahead of what was there
  const why0 = ST.why;
  ST.why = function (kind, fn) {
    why0.call(ST, kind, fn);
    if (LF.WHY && !(LF.WHY[kind] && LF.WHY[kind].stakes)) {
      const prev = LF.WHY[kind];
      const g = (v, pc) => ST.reason(kind, v, pc, null) || (prev ? prev(v, pc) : '');
      g.stakes = true;
      LF.WHY[kind] = g;
    }
    return ST;
  };

  // a feature that loads before this one (9996, 9997 sort first) registers through a queue it may create itself:
  //   (A.STAKES = A.STAKES || {}).pre = (A.STAKES.pre || []).concat([['add', 'poPropose', fn], ['why', 'jrGo', fn2]]);
  // the queue is drained here, once every part is in place; later features call A.STAKES.add / .why directly
  for (const [how, kind, fn] of (Array.isArray(ST.pre) ? ST.pre : [])) { try { if (how === 'why') ST.why(kind, fn); else ST.add(kind, fn); } catch (e) { console.error('stakes pre', e); } }
  ST.pre = { push: (...xs) => { for (const [how, kind, fn] of xs) { if (how === 'why') ST.why(kind, fn); else ST.add(kind, fn); } } };

  // ---- the look -------------------------------------------------------------------------------------------------------
  const css = `
.st-row{display:flex!important;flex-wrap:wrap;gap:4px 6px;margin-top:4px;font-weight:400;opacity:1}
.st-c{display:inline-block;max-width:100%;min-height:20px;padding:2px 6px;border-radius:var(--r-xs,3px);font-family:var(--f-ui,inherit);font-size:var(--t-cap,12px);line-height:1.25;font-weight:600;white-space:normal;overflow-wrap:anywhere;box-sizing:border-box;
  color:var(--ink-2,inherit);background:color-mix(in srgb,var(--ink-3,#888) 10%,transparent);border:1px solid color-mix(in srgb,var(--ink-3,#888) 22%,transparent)}
.st-c.st-gain,.st-c.st-again{color:var(--ok,#2e7d32);background:color-mix(in srgb,var(--ok,#2e7d32) 10%,transparent);border-color:color-mix(in srgb,var(--ok,#2e7d32) 32%,transparent)}
.st-c.st-cost{color:var(--danger,#b3261e);background:color-mix(in srgb,var(--danger,#b3261e) 9%,transparent);border-color:color-mix(in srgb,var(--danger,#b3261e) 30%,transparent)}
.st-c.st-risk{color:var(--danger,#b3261e);background:transparent;border-style:dashed;border-color:color-mix(in srgb,var(--danger,#b3261e) 45%,transparent)}
.st-c.st-win{color:var(--ok,#2e7d32);background:transparent;border-style:dashed;border-color:color-mix(in srgb,var(--ok,#2e7d32) 45%,transparent)}
.st-c.st-safe,.st-c.st-touch,.st-c.st-white{color:var(--ink-3,inherit);background:transparent}
.st-c.st-again{font-weight:700}
.st-c.st-red{color:var(--danger,#b3261e);border-color:var(--danger,#b3261e);text-transform:uppercase;letter-spacing:.06em;font-weight:700;background:transparent}
.st-c[data-tt],.st-lock[data-tt]{cursor:help}
.st-sep,.st-short{display:none}
.sc-sheet .st-long{display:none!important} .sc-sheet .st-short{display:inline!important}
/* a phone sheet: the chips flow as one line of words, not stacked boxes, so a scene still fits one screen */
.sc-sheet .st-row{display:block!important;line-height:1.3;margin-top:2px;font-size:12px}
.sc-sheet .st-c{display:inline!important;padding:0!important;border:0!important;background:none!important;min-height:0!important}
.sc-sheet .st-c.st-red{border:0}
.sc-sheet .st-sep{display:inline!important;margin:0 5px;color:var(--ink-3,inherit)}
/* a short phone (an iPhone SE): costs and risks stay; what a check wins and what code touches give way (the scene fits) */
@media (max-height:700px){.sc-sheet .st-c.st-win,.sc-sheet .st-c.st-touch,.sc-sheet .st-c.st-win+.st-sep,.sc-sheet .st-c.st-win+.sc-vh+.st-sep{display:none!important}
  .sc-sheet .st-row:not(:has(.st-c:not(.st-win):not(.st-touch))){display:none!important}}
.st-lock:focus-visible{outline:2px solid var(--accent,currentColor);outline-offset:2px}
.st-locked{display:flex;flex-direction:column;gap:6px;margin:6px 0 0}
.st-lock{display:grid;grid-template-columns:24px minmax(0,1fr);column-gap:12px;row-gap:2px;align-items:center;min-height:40px;padding:6px 10px;border-radius:var(--r-m,10px);
  border:1px dashed var(--line,rgba(127,127,127,.35));color:var(--ink-3,inherit);background:transparent;font-family:var(--f-ui,inherit);font-size:var(--t-ui,14px);font-weight:600}
.st-lock-i{grid-row:1/span 2;width:16px;height:16px;justify-self:center;border:2px solid currentColor;border-radius:3px;position:relative;margin-top:4px;opacity:.75}
.st-lock-i::before{content:"";position:absolute;left:1px;right:1px;top:-8px;height:7px;border:2px solid currentColor;border-bottom:0;border-radius:6px 6px 0 0}
.st-lock-t{grid-column:2;text-decoration:line-through;text-decoration-thickness:1px;text-decoration-color:color-mix(in srgb,currentColor 45%,transparent)}
.st-why{grid-column:2;display:block;font-weight:400;font-size:var(--t-small,13px);color:var(--ink-2,inherit)}
.st-lock-red .st-why{color:var(--danger,#b3261e)}
.sc-card .st-locked{padding:0 18px 18px;margin-top:-10px}
.sc-chk .st-wr{margin-left:2px;font-weight:700;opacity:.8}
`;
  try { const st = document.createElement('style'); st.id = 'st-css'; st.textContent = css; document.head.appendChild(st); } catch (e) {}
})();
