// 93-figures · dress (C8c, D-060): the player picks what their character wears.
//
// A person may store `dress: { w, d }`: w an occasion of the figure library's WEARS (day, best, work, travel, arms,
// mourning), d a dye of their station. Both are optional and an older save has neither: then the person dresses "as the
// day asks" (everyday clothes; on an event's card, what the scene calls for) in the cloth their own taste picked (seeded
// from their id). Only the player's choice is stored. It changes the picture and nothing else: no stat, no roll.
//
//   A.setDress(w, d)     the command (journalled, so a replay dresses the same): '' clears either
//   UI.FIG.dressBar(p)   the control in the Profile's Gear panel: one line that says what is worn; opened, the choices
(function () {
  if (typeof PORTRAIT === 'undefined' || typeof PORTRAIT.svg !== 'function') return;
  const FG = UI.FIG = UI.FIG || {}, esc = s => UI.esc(s);
  const LIB = () => (A.V2 && A.V2.figure) || null;
  const WEARS = ['day', 'best', 'work', 'travel', 'arms', 'mourning'];
  FG.WEAR_NAME = { '': 'As the day asks', day: 'Everyday clothes', best: 'Your best', work: 'Working clothes', travel: 'For the road', arms: 'Under arms', mourning: 'Mourning' };
  FG.WEAR_NOTE = {
    '': 'Everyday clothes, and whatever a scene calls for: your best at court and in church, a cloak on the road, your harness at war.',
    day: 'What you wear from day to day, wherever you are.', best: 'Feast-day clothes: the good cloth, the jewel your rank allows, no apron and no harness.',
    work: 'Sleeves rolled and an apron on; for the high-born, riding leathers.', travel: 'A cloak over everything, and a hood against the weather out of doors.',
    arms: 'The armour you own, and your arms.', mourning: 'Black, or the darkest cloth you have. No jewels.',
  };
  FG.DYE_NAME = { undyed: 'Undyed wool', hemp: 'Hemp', linen: 'Linen', cream: 'Cream', white: 'Bleached white', brown: 'Brown', walnut: 'Walnut', russet: 'Russet', grey: 'Grey', sage: 'Sage', ochre: 'Ochre', woad: 'Woad blue',
    madder: 'Madder red', forest: 'Forest green', charcoal: 'Charcoal', green: 'Green', mustard: 'Mustard', teal: 'Teal', blue: 'Blue', rose: 'Rose', navy: 'Deep blue', murrey: 'Murrey', crimson: 'Crimson', scarlet: 'Scarlet', black: 'Black', purple: 'Purple' };

  // what the player may pick: every occasion, and "under arms" only with armour to wear
  FG.wearChoices = function (p) {
    const g = (p && p.gear) || {}, armed = !!(p && p.mil) || (g.armor && g.armor !== 'none' && (typeof g.armor !== 'object' || g.armor.id !== 'none'));
    return ['', ...WEARS.filter(w => w !== 'arms' || armed)];
  };
  FG.dyeChoices = function (p) { const L = LIB(); try { const sh = FG.sheet(p, 'tall'); return L && L.dyesFor ? L.dyesFor(sh.estate, sh.cult).slice(0, 12) : []; } catch (e) { return []; } };
  FG.dressOf = p => (p && p.dress && typeof p.dress === 'object' ? { w: WEARS.includes(p.dress.w) ? p.dress.w : '', d: typeof p.dress.d === 'string' && FG.DYE_NAME[p.dress.d] ? p.dress.d : '' } : { w: '', d: '' });

  // ---- the command: the player's own dress. w and d: a value, '' to clear, undefined to leave as it is
  A.setDress = function (w, d) {
    const pc = A.pc && A.pc(); if (!pc || !pc.alive) return false;
    const cur = FG.dressOf(pc), nw = w === undefined || w === null ? cur.w : FG.wearChoices(pc).includes(w) ? w : cur.w, nd = d === undefined || d === null ? cur.d : d === '' || FG.dyeChoices(pc).includes(d) ? d : cur.d;
    if (!nw && !nd) delete pc.dress; else { pc.dress = {}; if (nw) pc.dress.w = nw; if (nd) pc.dress.d = nd; }
    return true;
  };
  if (Array.isArray(A.COMMANDS) && !A.COMMANDS.includes('setDress')) A.COMMANDS.push('setDress');

  // ---- the control
  FG.dressOpen = false;
  FG.dressBar = function (p) {
    if (!p || !p.alive || !A.S || A.S.pc !== p.id || !LIB()) return '';
    const cur = FG.dressOf(p), L = LIB();
    let s = `<div class="fg-dress"><button class="small fg-dress-t" data-a="fgDressOpen" aria-expanded="${FG.dressOpen ? 'true' : 'false'}"><span class="fg-k">Dress</span> ${esc(FG.WEAR_NAME[cur.w])}${cur.d ? ', ' + esc(FG.DYE_NAME[cur.d].toLowerCase()) : ''}</button>`;
    if (FG.dressOpen) {
      s += `<div class="fg-dress-b" role="group" aria-label="What you wear">` + FG.wearChoices(p).map(w => `<button class="small${w === cur.w ? ' on' : ''}" data-a="fgWear" data-v="${esc(w)}" aria-pressed="${w === cur.w ? 'true' : 'false'}">${esc(FG.WEAR_NAME[w])}</button>`).join('') + `</div>`;
      s += `<p class="fg-dress-n">${esc(FG.WEAR_NOTE[cur.w])}</p>`;
      const dyes = FG.dyeChoices(p);
      if (dyes.length) s += `<div class="fg-dress-b" role="group" aria-label="The colour of your cloth"><button class="small${cur.d ? '' : ' on'}" data-a="fgDye" data-v="" aria-pressed="${cur.d ? 'false' : 'true'}">As it comes</button>` +
        dyes.map(d => `<button class="small fg-dye${d === cur.d ? ' on' : ''}" data-a="fgDye" data-v="${esc(d)}" aria-pressed="${d === cur.d ? 'true' : 'false'}"><i style="background:${esc(L.DYES[d] || '#888888')}"></i>${esc(FG.DYE_NAME[d] || d)}</button>`).join('') + `</div>`;
    }
    return s + '</div>';
  };
  const redraw = () => { try { UI.render(); } catch (e) {} };
  Object.assign(UI.A, {
    fgDressOpen() { FG.dressOpen = !FG.dressOpen; redraw(); },
    fgWear(v) { A.setDress(typeof v === 'string' ? v : '', undefined); redraw(); },
    fgDye(v) { A.setDress(undefined, typeof v === 'string' ? v : ''); redraw(); },
  });
  FG.DRESS_CSS = '.fg-dress{margin:6px 0 2px}.fg-dress-t .fg-k{font-variant:small-caps;letter-spacing:.04em;opacity:.75;margin-right:4px}.fg-dress-b{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}' +
    '.fg-dress-b button.on{outline:2px solid var(--gold,#c9a15a);outline-offset:-2px}.fg-dress-n{margin:6px 0 0;font-size:13px;color:inherit;opacity:.82}.fg-dye i{display:inline-block;width:11px;height:11px;border-radius:2px;border:1px solid rgba(0,0,0,.45);margin-right:5px;vertical-align:-1px}';
  FG.CSS = (FG.CSS || '') + FG.DRESS_CSS;
  if (FG.putStyle && typeof document !== 'undefined') { const old = document.getElementById('fg-style'); if (old) old.remove(); FG.putStyle(); }
})();
