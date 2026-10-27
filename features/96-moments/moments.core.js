// 96-moments: cut-ins for the big moments of a life, and the Motion setting (docs/design/brief.md §5.10, §6, §8 items
// 14 and 15).
//
// A cut-in is a Persona-style band across the screen at -10 degrees, a word in Dela Gothic One (PROMOTED, VICTORY,
// WEDDED, A SON, FAREWELL, 1106), one line under it, the subject's bust and a seeded burst of focus lines. It is kept
// for the big moments only: a promotion, a battle won, a title or a crown, a marriage, a birth, a death among your kin,
// an epithet, and the new year. At most one shows in a game month; when several fall due at once, only the most
// important shows. A click or any key skips it. It takes 1.2 s (220 ms in, 700 held, 260 out); under reduced motion it
// is a still banner that fades in, stays 1.5 s and fades out; with Motion off it is the same banner without the fades.
//
// The moments are read, never made: after each draw (UI.render, UI.refresh, UI.renderModal, the clock's light redraw)
// the life is read again (its year, post, rank, title, crown, spouse, children, living kin, epithet) and compared with
// the reading before. The readings and the month of the last cut-in are UI state here, never in A.S, so a save, a
// replay and the bots never see them, and nothing draws a random number (the focus lines hash the moment).
//
// The Motion setting (Menu: Follow system, Full, Reduced, Off) sets <html data-motion>, which 91-look and
// 92-scene-card read; "Moment cut-ins" turns the cut-ins off altogether.
(function () {
  const MO = UI.MOMENTS = UI.MOMENTS || {};
  const esc = s => UI.esc(String(s == null ? '' : s));
  const doc = typeof document !== 'undefined' ? document : null;
  if (UI.set.motion == null) UI.set.motion = 'system';
  if (UI.set.cutins == null) UI.set.cutins = true;

  // ---- the Motion setting ---------------------------------------------------------------------------------------
  MO.MODES = [['system', 'Follow system'], ['full', 'Full'], ['reduced', 'Reduced'], ['off', 'Off']];
  MO.systemReduced = () => { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };
  // the motion in force: the setting, or the system's when the setting follows it
  MO.mode = () => { const m = UI.set.motion; return m === 'full' || m === 'reduced' || m === 'off' ? m : MO.systemReduced() ? 'reduced' : 'full'; };
  MO.applyMotion = function () {
    if (!doc) return;
    const m = UI.set.motion, d = doc.documentElement;
    if (m === 'full' || m === 'reduced' || m === 'off') d.dataset.motion = m; else delete d.dataset.motion;
  };
  const apply = UI.applySettings;
  UI.applySettings = function () { const r = apply.apply(this, arguments); try { MO.applyMotion(); } catch (e) {} return r; };
  MO.menu = () => `<label class="row">Motion <select data-c="setMotion" aria-label="Motion">${MO.MODES.map(([v, n]) => `<option value="${v}"${(UI.set.motion || 'system') === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label>` +
    `<label class="row"><input type="checkbox" data-c="setCutins" ${UI.set.cutins !== false ? 'checked' : ''}> Moment cut-ins (a promotion, a victory, a wedding, a birth, a death, the new year)</label>`;
  Object.assign(UI.C, {
    setMotion(el) { UI.set.motion = MO.MODES.some(x => x[0] === el.value) ? el.value : 'system'; UI.saveSettings(); },
    setCutins(el) { UI.set.cutins = !!el.checked; UI.saveSettings(); if (!el.checked) MO.skip(); },
  });

  // ---- reading the life ------------------------------------------------------------------------------------------
  const P = id => (id != null && A.P ? A.P(id) : null);
  // your kin, by what they are to you: parents, spouse, children, brothers and sisters
  MO.kin = function (pc) {
    const out = [], seen = new Set([pc.id]);
    const add = (id, rel) => { if (id == null || seen.has(id)) return; const p = P(id); if (!p) return; seen.add(id); out.push({ id, rel, p }); };
    for (const id of pc.parents || []) add(id, 'parent');
    if (pc.spouse) add(pc.spouse, 'spouse');
    for (const id of pc.children || []) add(id, 'child');
    for (const pid of pc.parents || []) { const par = P(pid); for (const id of (par && par.children) || []) add(id, 'sibling'); }
    return out;
  };
  MO.read = function () {
    const S = A.S, pc = S && A.pc && A.pc();
    if (!pc || UI.screen !== 'game') return null;
    let month = 0; try { month = A.monthOf(A.today()).m; } catch (e) {}
    return {
      S, pc: pc.id, alive: !!pc.alive, year: S.year, month,
      job: pc.job ? { c: pc.job.c, r: pc.job.r } : null, mil: pc.mil ? pc.mil.rank : null,
      noble: pc.noble ? pc.noble.rung : null, ruler: pc.ruler || null, spouse: pc.spouse || null,
      kids: (pc.children || []).slice(), kin: MO.kin(pc).filter(k => k.p.alive).map(k => [k.id, k.rel]), epithet: pc.epithet || '',
    };
  };

  // ---- what changed: the moments, most important first --------------------------------------------------------------
  const he = p => p && p.sex === 'F' ? 'daughter' : 'son';
  const REL = { parent: p => (p.sex === 'F' ? 'Your mother' : 'Your father'), spouse: p => (p.sex === 'F' ? 'Your wife' : 'Your husband'),
    child: p => (p.sex === 'F' ? 'Your daughter' : 'Your son'), sibling: p => (p.sex === 'F' ? 'Your sister' : 'Your brother') };
  const RANK_OF_DEATH = { spouse: 10, child: 10, parent: 9, sibling: 8 };
  const jobTitle = j => { const C = j && GD.CAREERS && GD.CAREERS[j.c]; return C && C.ranks && C.ranks[j.r] ? C.ranks[j.r][0] : ''; };
  const milTitle = r => (GD.MIL && GD.MIL[r] ? GD.MIL[r].title : '');
  const rungTitle = (r, pc) => { const N = GD.NOBLE_RUNGS && GD.NOBLE_RUNGS[r]; return N ? (pc && pc.sex === 'F' && N.f ? N.f : N.title) : ''; };
  const name = p => (A.fullName ? A.fullName(p, false) : p.given || '');
  MO.found = function (a, b) {
    const out = [];
    if (!a || !b || a.S !== b.S || a.pc !== b.pc || !b.alive) return out;
    const pc = P(b.pc);
    // deaths among your kin (the dead person was alive at the last reading)
    const now = new Set(b.kin.map(k => k[0]));
    for (const [id, rel] of a.kin) {
      if (now.has(id)) continue;
      const p = P(id);
      if (!p || p.alive) continue;
      const span = p.born != null && p.died != null ? ` · ${p.born}–${p.died}` : '';
      out.push({ k: 'death', pri: RANK_OF_DEATH[rel] || 7, word: 'Farewell', sub: `${REL[rel] ? REL[rel](p) : 'Your kin'}, ${p.given || ''}${span}`, who: p.id });
    }
    if (!a.ruler && b.ruler) { const r = A.realm && A.realm(b.ruler); out.push({ k: 'crowned', pri: 9, word: 'Crowned', sub: r ? `${pc && pc.sex === 'F' ? 'Queen' : 'King'} of ${r.name || r.short || ''}`.trim() : '', who: b.pc }); }
    if (b.spouse && b.spouse !== a.spouse) { const s = P(b.spouse); out.push({ k: 'wedded', pri: 6, word: 'Wedded', sub: s ? `to ${name(s)}` : '', who: b.spouse }); }
    for (const id of b.kids) {
      if (a.kids.includes(id)) continue;
      const c = P(id);
      if (!c || (c.born != null && c.born < b.year - 1)) continue;   // a stepchild or an adoption, not a birth
      out.push({ k: 'birth', pri: 6, word: c.sex === 'F' ? 'A daughter' : 'A son', sub: `${c.given || 'A child'} is born`, who: id });
    }
    if (a.job && b.job && a.job.c === b.job.c && b.job.r > a.job.r) out.push({ k: 'promoted', pri: 5, word: 'Promoted', sub: jobTitle(b.job), who: b.pc });
    if (a.mil != null && b.mil != null && b.mil > a.mil) out.push({ k: 'promoted', pri: 5, word: 'Promoted', sub: milTitle(b.mil), who: b.pc });
    if (b.noble != null && (a.noble == null || b.noble > a.noble)) out.push({ k: 'titled', pri: 5, word: 'Titled', sub: rungTitle(b.noble, pc), who: b.pc });
    if (b.epithet && b.epithet !== a.epithet) out.push({ k: 'named', pri: 4, word: 'Named', sub: `They call you ${b.epithet}`, who: b.pc });
    if (b.year === a.year + 1) { const age = pc && A.age ? A.age(pc) : null; out.push({ k: 'year', pri: 1, word: String(b.year), sub: `The year ${b.year}${age != null ? ` · you are ${age}` : ''}`, who: b.pc }); }
    return out.sort((x, y) => y.pri - x.pri);
  };
  // a battle won: the battle screen at its end, your side the winner (once for each battle)
  const wonSeen = new WeakSet();
  MO.battleWon = function () {
    const q = A.S && A.S.queue && A.S.queue[0], B = q && q.type === 'battle' ? q.b : null;
    if (!B || B.phase !== 'end' || !B.pcSide || B.winner !== B.pcSide || wonSeen.has(B)) return null;
    wonSeen.add(B);
    return { k: 'victory', pri: 8, word: 'Victory', sub: String(B.title || ''), who: A.S.pc };
  };

  // a battle lost: the same screen, the other side the winner (brief §5.10 names victory and defeat)
  MO.battleLost = function () {
    const q = A.S && A.S.queue && A.S.queue[0], B = q && q.type === 'battle' ? q.b : null;
    if (!B || B.phase !== 'end' || !B.pcSide || !B.winner || B.winner === B.pcSide || wonSeen.has(B)) return null;
    wonSeen.add(B);
    return { k: 'defeat', pri: 8, word: 'Defeat', sub: String(B.title || ''), who: A.S.pc };
  };
  // a duel opening (cycle 1 visual I6): two busts and VS, once for each duel, before the first exchange
  const duelSeen = new WeakSet();
  MO.duelOpen = function () {
    const q = A.S && A.S.queue && A.S.queue[0], D = q && q.type === 'duel' ? q.d : null;
    if (!D || !D.a || !D.b || D.over || duelSeen.has(D)) return null;
    duelSeen.add(D);
    if ((D.round || 0) > 0 || D.b.beast) return null;
    const nm = f => { const p = P(f.pid); return (p && A.fullName ? A.fullName(p, false) : f.name) || f.name || ''; };
    return { k: 'duel', pri: 8, word: 'VS', sub: `${nm(D.a)} · ${nm(D.b)}`, who: D.a.pid, vs: D.b.pid };
  };
  // your own death (cycle 1 visual I5): a muted FAREWELL before the death screen
  MO.ownDeath = function (a, b) {
    if (!a || !b || a.S !== b.S || a.pc !== b.pc || !a.alive || b.alive) return null;
    const pc = P(b.pc);
    return { k: 'farewell', pri: 10, word: 'Farewell', sub: pc ? `${name(pc)}${pc.born != null ? ` · ${pc.born}–${pc.died || A.S.year}` : ''}` : '', who: b.pc };
  };

  // ---- the check after each draw ---------------------------------------------------------------------------------
  MO.prev = null;
  MO.lastKey = null;       // the game month (year * 12 + month) of the last cut-in
  MO.log = [];             // what was shown and what was passed over (read by the tests), the newest last
  MO.check = function () {
    if (!doc) return null;
    const b = MO.read();
    if (!b) { MO.prev = null; return null; }
    const a = MO.prev;
    MO.prev = b;
    const found = MO.found(a, b);
    const won = MO.battleWon() || MO.battleLost(), duel = MO.duelOpen(), gone = MO.ownDeath(a, b);
    for (const x of [won, duel, gone]) if (x) found.unshift(x);
    found.sort((x, y) => y.pri - x.pri);
    if (!found.length) return null;
    const key = b.year * 12 + b.month, top = found[0];
    // an opening (a duel) and your own death are not held to one a month: they belong to the moment they open
    const urgent = top.k === 'duel' || top.k === 'farewell';
    if (UI.set.cutins === false || (MO.lastKey === key && !urgent) || MO.el && !urgent) { MO.note(found, null, key); return null; }
    MO.lastKey = key;
    MO.note(found, top, key);
    MO.show(top);
    return top;
  };
  MO.note = function (found, shown, key) {
    MO.log.push({ key, shown: shown ? shown.k : null, passed: found.filter(x => x !== shown).map(x => x.k) });
    if (MO.log.length > 60) MO.log.splice(0, MO.log.length - 60);
  };

  // ---- the cut-in ------------------------------------------------------------------------------------------------
  // a seeded burst of focus lines from the band's centre (an FNV hash of the moment; no A.rand)
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  MO.lines = function (seedStr) {
    const r = rng(hash(seedStr)), n = 24 + Math.floor(r() * 17), cx = 500, cy = 300;
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.12, w = 0.004 + r() * 0.012, r0 = 150 + r() * 120, r1 = 900;
      const p = (rad, ang) => `${(cx + Math.cos(ang) * rad * 1.6).toFixed(1)} ${(cy + Math.sin(ang) * rad).toFixed(1)}`;
      d += `M${p(r0, a)}L${p(r1, a - w)}L${p(r1, a + w)}Z`;
    }
    return `<svg class="mo-lines" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
  };
  MO.html = function (m, mode) {
    const who = P(m.who), vs = m.vs != null ? P(m.vs) : null;
    let bust = '', bust2 = '';
    try { if (who && typeof PORTRAIT !== 'undefined' && PORTRAIT.svg) bust = PORTRAIT.svg(who, 112); /* a bust: 93 draws the full figure from 120 px */ } catch (e) { bust = ''; }
    try { if (vs && typeof PORTRAIT !== 'undefined' && PORTRAIT.svg) bust2 = PORTRAIT.svg(vs, 112); } catch (e) { bust2 = ''; }
    const seed = [m.k, m.word, A.S ? A.S.year : 0, A.S ? A.S.pc : ''].join('|');
    return `<div class="mo-dim" aria-hidden="true"></div>` + (mode === 'full' && m.k !== 'death' && m.k !== 'farewell' ? MO.lines(seed) : '') +
      `<div class="mo-band" aria-hidden="true"><div class="mo-band-acc"></div><div class="mo-band-ink"></div></div>` +
      `<div class="mo-content" aria-hidden="true">${bust ? `<div class="mo-bust">${bust}</div>` : ''}<div class="mo-words"><div class="mo-word">${esc(m.word)}</div>${m.sub ? `<div class="mo-sub">${esc(m.sub)}</div>` : ''}</div>${bust2 ? `<div class="mo-bust mo-bust2">${bust2}</div>` : ''}</div>` +
      `<span class="mo-vh">${esc(m.word)}${m.sub ? ': ' + esc(m.sub) : ''}</span>`;
  };
  MO.TIME = { full: 1200, reduced: 1740, off: 1500 };
  MO.el = null; MO.timer = 0; MO.shown = null;
  MO.show = function (m) {
    if (!doc || !doc.body) return;
    MO.skip();
    const mode = MO.mode();
    const el = doc.createElement('div');
    el.id = 'mo-cut';
    el.className = `mo-cut mo-k-${m.k} mo-${mode}`;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = MO.html(m, mode);
    doc.body.appendChild(el);
    MO.el = el; MO.shown = m;
    MO.timer = setTimeout(MO.skip, MO.TIME[mode] || 1200);
  };
  MO.skip = function () {
    if (MO.timer) { clearTimeout(MO.timer); MO.timer = 0; }
    if (MO.el) { MO.el.remove(); MO.el = null; }
  };
  if (doc) {
    // a click or any key skips it (the key is spent on the skip, so a number key does not also pick a choice under it)
    doc.addEventListener('pointerdown', e => { if (MO.el && e.target && e.target.closest && e.target.closest('#mo-cut')) { e.preventDefault(); e.stopPropagation(); MO.skip(); } }, true);
    doc.addEventListener('click', e => { if (e.target && e.target.closest && e.target.closest('#mo-cut')) { e.preventDefault(); e.stopPropagation(); MO.skip(); } }, true);
    doc.addEventListener('keydown', e => {
      if (!MO.el || ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;
      e.preventDefault(); e.stopPropagation(); MO.skip();
    }, true);
  }

  // ---- the hooks: after each draw --------------------------------------------------------------------------------
  for (const k of ['render', 'refresh', 'renderModal', 'clkLight']) {
    const f = UI[k];
    if (typeof f !== 'function') continue;
    UI[k] = function () { const r = f.apply(this, arguments); try { MO.check(); } catch (e) { console.error('moments', e); } return r; };
  }
  // a new life or a loaded one starts from a fresh reading
  const newGame = A.newGame;
  if (typeof newGame === 'function') A.newGame = function () { MO.prev = null; MO.lastKey = null; MO.skip(); return newGame.apply(this, arguments); };

  // ---- the look --------------------------------------------------------------------------------------------------
  // the band's colours are fixed, the same in both themes (ink on the band is light by day and by night). The class on
  // the cut-in says which motion it was drawn for; the animations carry !important so that Motion: Full still moves
  // under the release's reduced-motion floor (1 ms for every animation), and so that the reduced banner still fades.
  MO.CSS = `
.mo-cut{position:fixed;inset:0;z-index:95;pointer-events:auto;cursor:pointer;overflow:hidden;--mo-ink:#1b1730;--mo-acc:#e8b04a;--mo-acc2:#ffd98a;--mo-word:#f8f1e2;--mo-sub:#e9dcc0;--mo-h:120px}
.mo-cut .mo-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
.mo-cut .mo-dim{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(13,17,32,.18),rgba(13,17,32,.55))}
.mo-cut .mo-lines{position:absolute;inset:0;width:100%;height:100%}
.mo-cut .mo-lines path{fill:var(--mo-word);opacity:.25}
.mo-cut .mo-band{position:absolute;left:-10vw;right:-10vw;top:50%;height:var(--mo-h);margin-top:calc(var(--mo-h) / -2);transform:rotate(-10deg)}
.mo-cut .mo-band-acc{position:absolute;inset:0;transform:translate(0,10px);background:var(--mo-acc);box-shadow:0 0 0 0 transparent}
.mo-cut .mo-band-ink{position:absolute;inset:0 0 6px;background-color:var(--mo-ink);box-shadow:inset 0 22px 30px -18px rgba(120,100,200,.35);border-top:2px solid var(--mo-acc2)}
.mo-cut .mo-content{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%) rotate(-10deg);display:flex;align-items:center;justify-content:center;gap:24px;padding:0 48px;pointer-events:none}
.mo-cut .mo-bust{flex:none;width:120px;height:120px;filter:drop-shadow(3px 0 0 var(--mo-acc)) drop-shadow(-3px 0 0 var(--mo-acc)) drop-shadow(0 3px 0 var(--mo-acc)) drop-shadow(0 -3px 0 var(--mo-acc)) drop-shadow(0 10px 18px rgba(0,0,0,.5))}
.mo-cut .mo-bust svg{width:100%;height:100%;display:block}
.mo-cut .mo-words{min-width:0;display:flex;flex-direction:column;align-items:flex-start}
.mo-cut .mo-word{font-family:var(--f-impact,"Dela Gothic One",Impact,sans-serif);font-size:var(--t-display,44px);line-height:1;color:var(--mo-word);letter-spacing:.02em;text-transform:uppercase;white-space:nowrap;
  text-shadow:3px 3px 0 var(--mo-ink),-1px -1px 0 var(--mo-ink),0 0 24px rgba(240,192,98,.35)}
.mo-cut .mo-sub{margin-top:6px;margin-left:-4px;padding:0 4px;background-color:var(--mo-ink);font-family:var(--f-ui,sans-serif);font-size:var(--t-h3,16px);font-weight:700;color:var(--mo-sub);letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70vw}
.mo-cut.mo-k-death{--mo-acc:#8f9bbd;--mo-acc2:#c4cbe0}
.mo-cut.mo-k-death{--mo-ink:#161a2c}
.mo-cut.mo-k-death .mo-word{text-shadow:2px 2px 0 var(--mo-ink)}
.mo-cut.mo-k-victory{--mo-acc:#ff8a5c;--mo-acc2:#ffd98a}
.mo-cut.mo-k-defeat{--mo-acc:#c8402a;--mo-acc2:#f0a090;--mo-ink:#1a1222}
.mo-cut.mo-k-farewell{--mo-acc:#8f9bbd;--mo-acc2:#c4cbe0;--mo-ink:#161a2c}
.mo-cut.mo-k-farewell .mo-word{text-shadow:2px 2px 0 var(--mo-ink);letter-spacing:.12em}
.mo-cut.mo-k-farewell .mo-bust{filter:grayscale(.8) drop-shadow(0 10px 18px rgba(0,0,0,.5))}
.mo-cut.mo-k-duel{--mo-acc:#e8463a;--mo-acc2:#ffd98a}
.mo-cut.mo-k-duel .mo-content{gap:32px}
.mo-cut.mo-k-duel .mo-words{align-items:center}
.mo-cut.mo-k-duel .mo-word{font-size:calc(var(--t-display,44px) * 1.6);font-style:italic}
.mo-cut .mo-bust2{transform:scaleX(-1)}
/* Day: the dim is the indigo shade, not a flat grey that reads as disabled, and the focus lines are ink (I9) */
:root[data-theme=light] .mo-cut .mo-dim{background:radial-gradient(ellipse at 50% 50%,rgba(58,47,107,.12),rgba(58,47,107,.35))}
:root[data-theme=light] .mo-cut .mo-lines path{fill:#1b1730;opacity:.3}
.mo-cut .mo-sub{font-size:calc(20px * var(--tx, 1))}
.mo-cut.mo-k-crowned{--mo-acc:#ffb648;--mo-acc2:#fff0c4}
.mo-cut.mo-k-wedded{--mo-acc:#f2a3b8;--mo-acc2:#ffe0e8}
.mo-cut.mo-k-birth{--mo-acc:#f2a77a;--mo-acc2:#ffe3c8}
.mo-cut.mo-k-year{--mo-acc:#e8b04a;--mo-acc2:#ffe7b0}
.mo-cut.mo-k-year .mo-word{font-size:calc(var(--t-display,44px) * 1.25)}
@media (min-width:1600px){.mo-cut{--mo-h:150px}}
@media (max-width:760px){.mo-cut{--mo-h:104px}.mo-cut .mo-content{gap:14px;padding:0 20px}.mo-cut .mo-bust{width:84px;height:84px}.mo-cut .mo-word{font-size:min(calc(34px * var(--tx, 1)), 8.2vw);white-space:normal;line-height:1.05}.mo-cut .mo-words{max-width:calc(100vw - 140px)}.mo-cut .mo-sub{font-size:var(--t-small,14px);max-width:60vw}}
@media (max-width:760px){.mo-cut.mo-k-duel .mo-bust{width:68px;height:68px}.mo-cut.mo-k-duel .mo-content{gap:10px}.mo-cut.mo-k-duel .mo-words{max-width:calc(100vw - 196px)}.mo-cut.mo-k-duel .mo-word{font-size:min(calc(44px * var(--tx, 1)), 11vw)}.mo-cut.mo-k-duel .mo-sub{white-space:normal;text-align:center}}
/* reduced motion and Motion off: a still banner, level, no focus lines */
.mo-cut.mo-reduced .mo-band, .mo-cut.mo-off .mo-band{transform:none}
.mo-cut.mo-reduced .mo-content, .mo-cut.mo-off .mo-content{transform:translateY(-50%)}
.mo-cut.mo-reduced{animation:moFade 1740ms linear both!important}
@keyframes moFade{0%{opacity:0}7%{opacity:1}93%{opacity:1}100%{opacity:0}}
@keyframes moBandIn{0%{transform:rotate(-10deg) translateX(-110%)}18%{transform:rotate(-10deg) translateX(0)}78%{transform:rotate(-10deg) translateX(0)}100%{transform:rotate(-10deg) translateX(110%)}}
@keyframes moAccIn{0%{transform:translate(-120%,10px)}20%{transform:translate(0,10px)}78%{transform:translate(0,10px)}100%{transform:translate(120%,10px)}}
@keyframes moWordIn{0%{opacity:0;transform:translateX(-60px) scale(1.25)}20%{opacity:1;transform:translateX(0) scale(1)}26%{transform:scale(1.04)}30%{transform:none}78%{opacity:1;transform:none}100%{opacity:0;transform:translateX(80px)}}
@keyframes moLines{0%{opacity:0;transform:scale(1.2)}18%{opacity:1;transform:scale(1)}78%{opacity:1}100%{opacity:0}}
@keyframes moDim{0%{opacity:0}15%{opacity:1}80%{opacity:1}100%{opacity:0}}
.mo-cut.mo-full .mo-band{animation:moBandIn 1200ms cubic-bezier(.05,.7,.1,1) both!important}
.mo-cut.mo-full .mo-band-acc{animation:moAccIn 1200ms cubic-bezier(.05,.7,.1,1) both!important}
.mo-cut.mo-full .mo-words, .mo-cut.mo-full .mo-bust{animation:moWordIn 1200ms cubic-bezier(.2,.8,.2,1) both!important}
.mo-cut.mo-full .mo-lines{animation:moLines 1200ms ease-out both!important;transform-origin:50% 50%}
.mo-cut.mo-full .mo-dim{animation:moDim 1200ms linear both!important}
`;
  MO.install = function () {
    if (!doc || !doc.head || doc.getElementById('mo-style')) return;
    const st = doc.createElement('style'); st.id = 'mo-style'; st.textContent = MO.CSS; doc.head.appendChild(st);
    MO.applyMotion();
  };
  if (doc) { if (doc.head) MO.install(); else doc.addEventListener('DOMContentLoaded', MO.install); }
})();
