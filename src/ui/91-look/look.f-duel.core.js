// 91-look, part 6: the duel screen as a face-off (cycle 1 visual B6 and I6). The release's markup (UI.duelModal,
// 48-fight-ladder's measure line) is kept; this is CSS plus a pass over the drawn modal:
//   - the five moves are tall cards: the key in flow at the top (it once sat over the first letters, "3Guard"), the
//     move's icon, its name and its line; Yield and Flee are quiet ghost buttons beside "Fight on instinct";
//   - the two fighters face each other: the foe is mirrored, both stand on a ground shadow, and Blood and Wind are
//     big segmented bars under each;
//   - your instinct's read of the foe becomes an intent mark over the foe's head (the move it names), as well as the
//     line it already is;
//   - the log well is as tall as what it holds;
//   - on a phone the fighters are 96 px side by side and the moves a grid of two rows above the fold, the log under.
// Drawing only: the pass reads the modal's own text, never A.rand, never A.S.
(function () {
  const LOOK = UI.LOOK, X = LOOK.X, T = LOOK.T;
  const MOVE_ICON = { strike: 'swords', feint: 'mask', guard: 'shield', press: 'flame', grapple: 'fist' };
  const MOVE_WORDS = [['feint', /\bfeint/i], ['guard', /\bguard|\bwait|\briposte/i], ['press', /all-out|\bpress|\bcharge/i], ['grapple', /grapple|wrestl|\bclose/i], ['strike', /\bstrike|\battack|\bcut\b|\bthrust/i]];
  LOOK.duelIntent = function (txt) {
    const after = String(txt || '').split(/—|:/).slice(1).join(' ');
    for (const [k, rx] of MOVE_WORDS) if (rx.test(after)) return k;
    return null;
  };
  LOOK.duelPass = function () {
    if (typeof document === 'undefined') return;
    const box = document.querySelector('#modal .il-fight .duel, #modal .duel');
    if (!box) return;
    const icon = n => (UI.icon ? UI.icon(n, 's') : '');
    for (const b of box.querySelectorAll('.actbtns > button[data-a="duel"]')) {
      if (b.querySelector('.dl-ic')) continue;
      const k = b.dataset.v, ic = MOVE_ICON[k];
      if (ic) { const key = b.querySelector('.key'); const s = `<span class="dl-ic" aria-hidden="true">${icon(ic)}</span>`; if (key) key.insertAdjacentHTML('afterend', s); else b.insertAdjacentHTML('afterbegin', s); }
    }
    for (const b of box.querySelectorAll('.mid > .row > button[data-v="yield"], .mid > .row > button[data-v="flee"]')) b.classList.add('ghost', 'dl-quiet');
    const fighters = box.querySelectorAll(':scope > .fighter');
    const foe = fighters[fighters.length - 1], read = box.querySelector('.read');
    if (foe && fighters.length > 1 && !foe.querySelector('.dl-intent')) {
      const k = read ? LOOK.duelIntent(read.textContent) : null;
      if (k && MOVE_ICON[k]) {
        const name = { strike: 'a strike', feint: 'a feint', guard: 'a guard', press: 'an all-out press', grapple: 'a grapple' }[k];
        foe.insertAdjacentHTML('afterbegin', `<span class="dl-intent" role="img" aria-label="Your instinct says: ${UI.esc(name)}" title="Your instinct says: ${UI.esc(name)}">${icon(MOVE_ICON[k])}</span>`);
      }
    }
  };
  const apply = LOOK.apply;
  LOOK.apply = function () {
    const r = apply.apply(this, arguments);
    if (LOOK.OFF) return r;
    try { LOOK.duelPass(); } catch (e) {}
    return r;
  };

  const D = X('#modal .duel').split(',')[0];   // :root[data-theme] #modal .duel
  LOOK.css.duel = `
${D}{grid-template-columns:200px minmax(0,1fr) 200px;gap:20px;align-items:start}
${D} > .fighter{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px}
${D} > .fighter > svg:first-of-type{width:180px;height:auto;filter:drop-shadow(0 14px 10px rgba(10,8,30,.35))}
/* the portraits turn a quarter toward the picture's left (93), so you, on the left, are the one mirrored: the two face each other */
${D} > .fighter:not(.fighter ~ .fighter) > svg:first-of-type{transform:scaleX(-1)}
${D} > .fighter::after{content:"";order:1;width:120px;height:10px;margin-top:-14px;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,rgba(10,8,30,.45),rgba(10,8,30,0) 70%);pointer-events:none}
${D} > .fighter > *:not(svg){order:2}
${D} > .fighter .barrow{display:grid;grid-template-columns:44px minmax(0,1fr) 34px;align-items:center;gap:6px;width:100%}
${D} > .fighter .barrow .bar{height:12px;border-radius:2px;background:var(--sunken);border:1px solid var(--line-strong);overflow:hidden}
${D} > .fighter .barrow .bar > i{display:block;height:100%;border-radius:0;
  -webkit-mask:repeating-linear-gradient(90deg,#000 0 9px,transparent 9px 11px);mask:repeating-linear-gradient(90deg,#000 0 9px,transparent 9px 11px)}
${D} > .fighter .barrow .hpbar > i{background:var(--danger)}
${D} > .fighter .barrow .fatbar > i{background:var(--info)}
${D} > .fighter .barrow .val{font-family:var(--f-num,inherit);font-weight:700;text-align:right}
${D} .dl-intent{position:absolute;top:-6px;left:50%;z-index:2;transform:translateX(-50%);order:0;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;
  background:var(--danger-fill,#b0392b);color:#fff;border:2px solid var(--line-ink,#1b1730);box-shadow:0 0 0 2px var(--danger,#e06a5a)}
${D} .dl-intent svg{width:18px;height:18px}
${D} .duellog{min-height:0;height:auto;max-height:220px;overflow:auto}
${D} .actbtns{grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
${D} .actbtns > button{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;padding:10px 6px 12px;min-height:116px;text-align:center;line-height:1.25}
${D} .actbtns > button .key{position:static;flex:none;margin:0}
${D} .actbtns > button .dl-ic{display:grid;place-items:center;width:28px;height:28px;color:var(--accent)}
${D} .actbtns > button .dl-ic svg{width:22px;height:22px}
${D} .actbtns > button small{margin-top:2px}
${D} .actbtns > button:disabled .dl-ic{color:var(--ink-3)}
${D} .mid > .row > .dl-quiet{background:transparent;border-color:transparent;color:var(--ink-2)}
${D} .mid > .row > .dl-quiet:hover{background:var(--raised);color:var(--ink)}
@media (max-width:760px){
  ${D}{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}
  ${D} > .fighter > svg:first-of-type{width:96px}
  ${D} > .fighter::after{width:70px;margin-top:-10px}
  ${D} > .fighter .barrow{grid-template-columns:38px minmax(0,1fr) 28px}
  ${D} .mid{grid-column:1 / -1;order:3;display:flex;flex-direction:column}
  ${D} .mid > .duellog{order:9;max-height:120px}
  ${D} .actbtns{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
  ${D} .actbtns > button{min-height:76px;padding:6px 4px 8px;gap:2px}
  ${D} .actbtns > button small{display:none}
  ${D} .dl-intent{width:28px;height:28px;top:-4px}
}
`;
})();
