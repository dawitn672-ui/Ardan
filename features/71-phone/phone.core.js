// The phone, designed on its own (Road to Ten, UI and UX 6): a leather dock and tab bar under the thumb, cards sized
// for thumbs, prompts as full-height sheets with the choices at the bottom, long tables turned into stacked cards,
// a section index on long pages, and pinch zoom on the maps.
//
// Everything here is scoped to the phone: the stylesheet sits inside `@media (max-width: 760px)` (the width at which
// the release already draws its phone layout, UI.isPhone) and most rules also need `#game.phone`; the wrappers do
// nothing unless UI.isPhone() is true. Drawing never touches A.S or the random stream: the wrappers only reshape
// markup already drawn.
const PH = UI.PHONE = {
  off: false,                                      // a switch for the desktop-unchanged test (and for debugging)
  on: () => !PH.off && UI.isPhone(),
};

// ---- the stylesheet --------------------------------------------------------------------------------------------
const T = (px) => `calc(${px}px * var(--tx, 1))`; // sizes follow the text-size setting
PH.CSS = `
@media (max-width: 760px){
  /* --- type: nothing a reader needs under 14 px; uppercase labels and the tab bar's captions at 13 --- */
  :root{--fs-1:${T(14)};--fs-2:${T(14)}}
  #game.phone, #modal, #title, .create-grid{-webkit-text-size-adjust:100%}
  #game.phone .chip, #modal .chip, #game.phone .tier, #modal .tier, #game.phone .cost, #modal .cost, #game.phone .req, #modal .req,
  #game.phone .risk, #modal .risk, #game.phone .apt, #modal .apt, #game.phone .key, #game.phone small, #modal small,
  #game.phone .wn-why, #game.phone .wn-n, #game.phone .lore-deed, #game.phone .ld, #game.phone .m, #game.phone .d, #game.phone .ad,
  #modal .ad, #game.phone .sub, #modal .sub, #game.phone .tacdesc, #modal .tacdesc, #game.phone td, #modal td, #game.phone label, #modal label,
  #game.phone summary, #modal summary, #game.phone .tip-d, #game.phone .tip-f, .tt-pop .tip-d, .tt-pop .tip-f, #game.phone .chron-y,
  #game.phone .badge, #modal .badge, #game.phone .now, #modal .now, #modal .tiny, #game.phone .tiny, #game.phone .clk-date, #game.phone .clk-ini{font-size:${T(14)}}
  #game.phone .tag, #modal .tag, #game.phone .group-h, #modal .group-h, #game.phone th, #modal th, #game.phone .ro-h, #modal .ro-h,
  #game.phone .leg-h, #modal .leg-h, #game.phone .pcat{font-size:${T(14)};letter-spacing:.06em}
  #game.phone .mkt-t, #modal .mkt-t, #game.phone .prow, #modal .prow, #game.phone .lore-row, #modal .lore-row, #game.phone .card.ach, #modal .legend,
  #modal .wr-tabs button span, #modal .squad .m, #game.phone .card.ach b, #game.phone .ladder, #game.phone .yh span, .create-grid .field label, .create-grid .card.opt .d, #app .card.opt .d, #app .field label{font-size:${T(14)}}
  @media (pointer: coarse){ #modal .key, #game.phone .key, #modal .choices button:before{font-size:${T(14)}} #modal .actbtns .key{display:none} }
  #game.phone #tabs .subbar button, #modal .seg button{font-size:${T(14)}}

  /* --- the page: no frame inside a frame; 8 px gutters --- */
  #game.phone{padding:0 0 calc(124px + env(safe-area-inset-bottom, 0px));gap:0}
  #game.phone #side.panel{border:0;border-radius:0;box-shadow:none;background:transparent;padding:0}
  #game.phone #tabbody{padding:6px 8px 8px}
  #game.phone #tabs .subbar{margin:8px 8px 0}

  /* --- the top bar: one row, sticky: date and age, initiative, coin, save, menu --- */
  #game.phone #topbar.panel{border-radius:0;border-width:0 0 1px;margin:0;padding:calc(4px + env(safe-area-inset-top, 0px)) 8px 4px;gap:4px 8px;flex-wrap:nowrap;min-height:52px;
    background:linear-gradient(180deg, rgba(255,236,196,.05), transparent), var(--surface-1);box-shadow:0 4px 14px #0000004d, inset 0 -1px 0 var(--frame)}
  #game.phone #topbar #clk, #game.phone #topbar .ph-stat{order:1}
  #game.phone #topbar .top-info{order:2}
  #game.phone #topbar > [data-a=save]{order:3}
  #game.phone #topbar > [data-a=menu]{order:4}
  #game.phone #topbar .top-info .ic, #game.phone #topbar .clk-ini .muted{display:none}
  #game.phone #topbar .ph-stat{display:flex;align-items:center;gap:10px;flex:1 1 auto;min-width:0}
  #game.phone #topbar .ph-stat .clk-date{flex:0 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #game.phone #topbar .ph-stat .clk-ini{display:inline-flex;align-items:center;gap:3px;white-space:nowrap}
  #game.phone #topbar .ph-stat .clk-ini .clk-bar, #game.phone #topbar .ph-stat .clk-ini .tiny{display:none}
  #game.phone #topbar .top-info{flex:0 0 auto;white-space:nowrap}
  #game.phone #topbar > button{min-width:44px;min-height:44px;padding:0 8px}

  /* --- the dock: the clock under the thumb, just above the tab bar --- */
  #game.phone .ph-dock{position:fixed;left:0;right:0;bottom:calc(60px + env(safe-area-inset-bottom, 0px));z-index:44;display:flex;gap:6px;padding:6px 8px;
    background:linear-gradient(180deg, rgba(255,236,196,.04), transparent), var(--surface-1);border-top:1px solid var(--border-2);box-shadow:0 -4px 12px #00000040}
  #game.phone .ph-dock button{flex:1 1 0;min-width:44px;min-height:46px;margin:0;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:${T(15)}}
  #game.phone .ph-dock > *{order:2 !important}
  #game.phone .ph-dock > .clk-play{order:1 !important}
  #game.phone .ph-dock .clk-play{flex:2 1 0;font-size:${T(17)};font-weight:700}
  #game.phone .ph-dock button span{display:inline !important}
  #game.phone .ph-dock .ph-spd b{font-size:${T(17)}}

  /* --- the tab bar: leather, gold rule on the chosen page, icons over short captions --- */
  #bnav{background:linear-gradient(180deg, rgba(255,236,196,.05), transparent 60%), var(--surface-1);border-top:1px solid var(--frame);box-shadow:0 -6px 18px #00000059, inset 0 1px 0 var(--border-2)}
  #bnav .tabbar button{min-height:60px;font-size:${T(13)};color:var(--text-2);border-top:3px solid transparent}
  #bnav .tabbar button .ic.s{width:22px;height:22px}
  #bnav .tabbar button.on{color:var(--accent-2);border-top-color:var(--accent);background:linear-gradient(180deg, var(--accent-soft), transparent)}
  #bnav .tabbar button.on .ic{stroke-width:2.2}
  #bnav .tabbar button.on .tl{font-weight:700}

  /* --- thumbs: every control at least 44 x 44 --- */
  #game.phone button, #modal button, #title button, .create-grid button, #app > div > .row button{min-height:44px}
  #game.phone button.small, #modal button.small, #app button.small{min-height:44px;padding-left:12px;padding-right:12px}
  #game.phone select, #modal select, #app select, #game.phone input[type=number], #modal input[type=number], #game.phone input[type=text], #modal input[type=text]{min-height:44px}
  #game.phone summary, #modal summary{min-height:44px;display:flex;align-items:center}
  #game.phone label:has(> input[type=checkbox]), #modal label:has(> input[type=checkbox]), #game.phone label:has(> input[type=radio]), #modal label:has(> input[type=radio]){min-height:44px;display:flex;align-items:center;gap:10px}
  #game.phone input[type=checkbox], #modal input[type=checkbox]{width:22px;height:22px}
  #game.phone label:has(> input[type=range]), #modal label:has(> input[type=range]){min-height:44px;display:flex;align-items:center;gap:10px}
  #game.phone input[type=range], #modal input[type=range]{min-height:44px;flex:1 1 auto}
  #game.phone #tabs .subbar button{min-height:44px;min-width:44px}
  #game.phone button, #modal button, #app button{min-width:44px}
  #game.phone label[for], #modal label[for]{min-height:44px;display:flex;align-items:center}
  :root body .tt-pop button.tt-x{width:44px;height:44px;top:0;right:0}
  #game.phone [data-tt=need], #game.phone [data-tt=stat], #modal [data-tt=stat], #modal [data-tt=need]{display:inline-flex;align-items:center;min-height:24px}
  #game.phone #topbar [data-tt]{display:inline-flex;align-items:center;min-height:44px}
  #game.phone .seg button, #modal .seg button{min-height:44px;min-width:44px}
  #game.phone .ph-wide, #modal .ph-wide{position:relative}
  /* words and avatars that open something: a 44 px reach without moving the line */
  #game.phone b[data-a], #game.phone span[data-a], #modal b[data-a], #modal span[data-a], #game.phone a[data-a], #modal a[data-a]{display:inline-block;padding:12px 0;margin:-12px 0;min-width:44px}
  #game.phone .avatar[data-a], #game.phone span[data-a]:has(> svg){min-width:44px;min-height:44px;padding:0;margin:0}
  #game.phone .barrow{min-height:44px;align-items:center}
  #game.phone .barrow .lbl [data-tt], #game.phone .barrow .val[data-tt], #game.phone .barrow .val [data-tt]{display:inline-flex;align-items:center;min-height:44px;min-width:44px;border-bottom:0;
    text-decoration:underline dotted var(--accent-line);text-underline-offset:4px}
  #game.phone .hint button, #modal .hint button{min-height:44px;min-width:56px}
  #game.phone .chip.click, #game.phone .click{min-height:44px}

  /* --- cards: room for a thumb between them --- */
  #game.phone .act{padding:12px 14px;min-height:56px}
  #game.phone .acts{gap:8px}
  #game.phone .wn-item{min-height:56px;padding:10px 12px}
  #game.phone .card{padding:12px}
  #game.phone .row{row-gap:8px}

  /* --- the section index on long pages --- */
  #game.phone .ph-jump{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}
  #game.phone .ph-jump .tag{width:100%;margin:0 0 2px}
  #game.phone .ph-jump button{min-height:44px;padding:0 14px;font-size:${T(15)};border-radius:var(--r-pill);border:1px solid var(--border-2);background:var(--surface-2);color:var(--text-1)}
  #game.phone .ph-jump button:active{background:var(--accent-soft);border-color:var(--accent)}

  /* --- long tables become stacked cards --- */
  table.ph-cards, table.ph-cards > tbody{display:block;width:100%}
  table.ph-cards > thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  table.ph-cards > tbody > tr, table.ph-cards > tr{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:12px;row-gap:2px;align-items:start;
    padding:10px 12px;margin:0 0 8px;border:1px solid var(--border-1);border-radius:var(--r-m);background:var(--surface-2)}
  table.ph-cards td, table.ph-cards th{display:block;grid-column:1;padding:0;border:0;text-align:left;white-space:normal;background:none;min-width:0}
  table.ph-cards td.ph-t, table.ph-cards th.ph-t{font-weight:700;color:var(--text-1);font-size:${T(16)}}
  table.ph-cards td[data-th]:not(.ph-t):not(.ph-act):not(:empty)::before{content:attr(data-th) " ";color:var(--text-3);font-family:var(--fh);font-size:${T(13)};letter-spacing:.05em;text-transform:uppercase;margin-right:4px}
  table.ph-cards td.ph-act{grid-column:2;grid-row:1 / span 3;align-self:center;display:flex;flex-direction:column;gap:6px;align-items:stretch}
  table.ph-cards td.ph-act button{min-width:64px}
  table.ph-cards td:empty{display:none}

  /* --- the profile on You: a compact card with the miniature beside the name --- */
  #game.phone .phone-profile{display:grid;grid-template-columns:104px minmax(0,1fr);column-gap:12px;align-items:start}
  #game.phone .phone-profile > *{grid-column:1 / -1}
  #game.phone .phone-profile > .portrait-wrap{grid-column:1;grid-row:1 / span 3;margin:0;justify-content:flex-start}
  #game.phone .phone-profile > .portrait-wrap svg{width:104px;height:auto}
  #game.phone .phone-profile > .pname{grid-column:2;grid-row:1;text-align:left;margin-top:4px}
  #game.phone .phone-profile > .ptitle{grid-column:2;grid-row:2;text-align:left}
  #game.phone .phone-profile > .center{grid-column:2;grid-row:3;justify-content:flex-start;text-align:left}
  #game.phone .phone-profile > .center .chip{margin:2px 4px 2px 0}

  /* --- you, at the top of Now --- */
  #game.phone .ph-you{display:flex;align-items:center;gap:12px;margin:0 0 10px;padding:6px 10px 6px 6px;border:1px solid var(--border-2);border-radius:var(--r-m);background:var(--surface-2)}
  #game.phone .ph-you-por{flex:none;width:56px;height:56px;min-width:56px;padding:0;border:0;background:none;box-shadow:none;border-radius:var(--r-s);overflow:hidden}
  #game.phone .ph-you-por svg{width:56px;height:56px;display:block}
  #game.phone .ph-you-b{min-width:0;flex:1 1 auto}
  #game.phone .ph-you-n{font-family:var(--fh);color:var(--accent-2);font-size:${T(16)};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #game.phone .ph-you-s{display:flex;gap:4px 16px;flex-wrap:wrap}
  #game.phone .ph-you-s .tt{display:inline-flex;align-items:center;gap:4px;min-height:44px;font-size:${T(15)};border-bottom:0;text-decoration:underline dotted var(--accent-line);text-underline-offset:4px}

  /* --- the story log --- */
  #game.phone .phone-log #log, #game.phone .phone-log .logbody{font-size:${T(17)};line-height:1.55}

  /* --- sheets: every modal rises from the bottom, full width --- */
  #modal{padding:0;flex-direction:column;align-items:stretch;justify-content:flex-end;backdrop-filter:none}
  #modal > .mbox{width:100%;max-width:none;max-height:100%;margin:auto 0 0;border-radius:var(--r-l) var(--r-l) 0 0;border-bottom:0;padding:16px 14px calc(16px + env(safe-area-inset-bottom, 0px));
    overflow-y:auto;overscroll-behavior:contain;flex:0 1 auto;min-height:0}
  #modal > .mbox.full{height:100%}
  #modal > .hint-float{position:static;transform:none;width:auto;margin:calc(6px + env(safe-area-inset-top, 0px)) 8px 6px;order:-1;flex:none;padding-right:8px}
  #modal > .mreport, #modal > .mbox > .mreport{position:absolute;right:8px;top:8px;bottom:auto;opacity:.55;background:var(--surface-1);z-index:3}
  #modal.ph-sheet > .mbox > .mreport{background:#ece0c4cc;color:#2b1d10;border-color:#2b1d10}
  #modal .mclose, #modal .closex{min-width:44px;min-height:44px;z-index:2}
  #modal .prof-head .grow, #modal .mbox > .row:first-child > h2:first-child{padding-right:44px}
  /* a person's sheet: who they are to you and what you can do together first, their particulars after */
  #modal > .mbox.prof{display:flex;flex-direction:column}
  #modal > .mbox.prof > *{flex:none}
  #modal > .mbox.prof > .prof-grid{order:9;margin-top:12px}
  #modal .prof-head .prof-por svg{width:96px;height:auto}
  #modal .prof-head{gap:12px}

  /* --- the prompt sheet (events, sieges, missions, line battles): full height, picture on top, choices at the bottom --- */
  #modal.ph-sheet > .mbox{height:100%;display:flex;flex-direction:column}
  #modal.ph-sheet > .mbox > *{flex:none}
  #modal.ph-sheet > .mbox > .choices, #modal.ph-sheet > .mbox > .ph-foot{margin-top:auto;padding-top:10px}
  #modal.ph-sheet.ph-pin > .mbox > .choices{position:sticky;bottom:calc(-16px - env(safe-area-inset-bottom, 0px));margin-bottom:calc(-16px - env(safe-area-inset-bottom, 0px));padding-bottom:calc(16px + env(safe-area-inset-bottom, 0px));
    background:linear-gradient(180deg, transparent, var(--surface-1) 14px);z-index:1}
  #modal.ph-sheet .woodcut-wrap{margin:-16px -14px 12px;border-radius:var(--r-l) var(--r-l) 0 0;overflow:hidden}
  #modal.ph-sheet .woodcut-wrap svg{display:block;width:100%;height:auto;max-height:30vh}
  #modal.ph-sheet .mbox > .row:has(> .grow > h2){display:grid;grid-template-columns:64px minmax(0,1fr);column-gap:12px;align-items:center}
  #modal.ph-sheet .mbox > .row:has(> .grow > h2) > .grow{display:contents}
  #modal.ph-sheet .mbox > .row:has(> .grow > h2) > :first-child:not(.grow){grid-column:1;grid-row:1;width:64px}
  #modal.ph-sheet .mbox > .row:has(> .grow > h2) > :first-child:not(.grow) svg{width:64px;height:auto}
  #modal.ph-sheet .mbox > .row:has(> .grow > h2) h2{grid-column:2;grid-row:1;margin:0;font-size:${T(22)}}
  #modal.ph-sheet .mbox > .row:has(> .grow > h2) > .grow > :not(h2){grid-column:1 / -1}
  #modal.ph-sheet .mtext{font-size:${T(18)};margin-top:10px}
  #modal .choices button{min-height:52px;padding-top:12px;padding-bottom:12px}
  #modal .choices button .risk{display:block;margin:4px 0 0;text-align:left}
  #modal .choices button:has(.risk){flex-wrap:wrap}
  #modal .choices button:has(.risk) > .grow{flex:1 1 calc(100% - 48px)}
  #modal .choices button:has(.risk) > .risk{flex:1 1 100%}

  /* --- the death page: text set left, so the initials sit right --- */
  #modal .mbox.ph-death p, #modal .mbox.ph-death .mtext, #modal .mbox.ph-death div:not(.center):not(.row){text-align:left}

  /* --- the tactical battle: the field wide enough to read, panned by finger --- */
  #modal .battle, #modal .battle > .col{min-width:0;max-width:100%}
  #modal .battle .ph-pan{overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;width:100%;max-width:100%;flex:none;height:auto}
  #modal .battle > .col{height:auto;max-height:none}
  #modal .mbox > .battle{flex:none;grid-template-rows:auto}
  #modal #battlecv{width:640px !important;max-width:none;height:auto}
  #modal .ph-pan-hint{display:block;margin:4px 0 0}

  /* --- the title and the new life --- */
  #title{padding:calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px))}
  #title .logo{font-size:${T(40)}}
  #title .sub{font-size:${T(14)};letter-spacing:.2em;margin-bottom:10px}
  #title .mapstrip{max-height:24vh;object-fit:cover}
  #title .blurb{font-size:${T(16)};margin:10px 0}
  #title .btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;max-width:420px;margin:0 auto;box-sizing:border-box}
  #title .btns button{width:100%;min-width:0;min-height:48px;margin:0;padding:10px 12px}
  #title .btns button.primary{grid-column:1 / -1;min-height:52px;font-size:${T(18)}}
  .create-grid .seg button, #app .crstep, #app [data-a=crStep]{min-height:44px}
  #app .card.opt.click{display:block}
  /* the step buttons of a new life ride at the bottom of the screen, so "Be born" is always a thumb away */
  .create-main > .row:has(> button[data-a=crStep]):has(> .right){position:sticky;bottom:0;z-index:5;margin:14px -12px -12px !important;padding:8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
    background:linear-gradient(180deg, transparent, var(--surface-1) 10px);border-top:1px solid var(--border-2)}
}
@media (max-width: 760px) and (prefers-reduced-motion: reduce){ #modal > .mbox{animation:none} }
`;
PH.install = () => {
  if (typeof document === 'undefined' || document.getElementById('ph-css')) return;
  const st = document.createElement('style'); st.id = 'ph-css'; st.textContent = PH.CSS; document.head.appendChild(st);
};
PH.install();

// ---- the clock: on a phone, the date and initiative stay on top and the clock goes to the dock --------------------
const clkHtml = UI.clkHtml;
UI.clkHtml = function () {
  const h = clkHtml.apply(this, arguments);
  if (!PH.on() || !A.S || !A.pc() || typeof document === 'undefined') return h;
  const t = document.createElement('template'); t.innerHTML = h;
  const clk = t.content.querySelector('#clk'); if (!clk) return h;
  const pick = s => clk.querySelector(s);
  const stat = document.createElement('div'); stat.className = 'ph-stat';
  const dock = document.createElement('div'); dock.className = 'ph-dock'; dock.setAttribute('role', 'group'); dock.setAttribute('aria-label', 'Clock');
  for (const s of ['.clk-date', '.clk-ini']) { const e = pick(s); if (e) stat.appendChild(e.closest('#clk > *')); }
  const play = pick('[data-a=clkPlay]'), skip = pick('[data-a=clkSkip]'), quiet = pick('[data-a=clkQuiet]'), seg = pick('.clk-spd');
  const sp = UI.clk.speed || 1;
  if (play) dock.appendChild(play.closest('#clk > *'));
  if (seg) {
    const b = document.createElement('button');
    b.className = 'small ph-spd'; b.dataset.a = 'phSpeed';
    b.setAttribute('aria-label', `Speed ${sp} of 5: tap for ${sp < 5 ? 'faster' : 'speed 1'}`);
    b.title = `Speed ${sp}: about ${UI.CLK_SPEEDS ? UI.CLK_SPEEDS[sp] : sp} days a second`;
    b.innerHTML = `<span aria-hidden="true">×</span><b>${UI.esc(sp)}</b>`;
    dock.appendChild(b); seg.closest('#clk > *').remove();
  }
  if (skip) dock.appendChild(skip.closest('#clk > *'));
  if (quiet) dock.appendChild(quiet.closest('#clk > *'));
  clk.classList.add('ph-clk'); clk.innerHTML = ''; clk.appendChild(stat); clk.appendChild(dock);
  return t.innerHTML;
};
Object.assign(UI.A, {
  // the speed cycles 1 to 5 on one button: five 44 px buttons do not fit beside Play
  phSpeed() { UI.A.clkSpeed((UI.clk.speed || 1) % 5 + 1); },
  // the section index: scroll to the n-th heading of the page, under the sticky top bar
  phJump(v) {
    const h = document.getElementById('ph-h-' + v); if (!h) return;
    const top = document.querySelector('#topbar'), off = top ? top.getBoundingClientRect().height + 8 : 8;
    const y = h.getBoundingClientRect().top + window.scrollY - off;
    window.scrollTo({ top: Math.max(0, y), behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
    try { h.focus({ preventScroll: true }); } catch (e) {}
  },
});

// ---- the decorations: tables to cards, the section index, the sheet's kind -------------------------------------
// a table of three or more columns becomes cards: each cell keeps its column's name, the first is the card's title,
// a cell holding a control goes to the right
PH.cardify = function (root) {
  if (!root) return 0;
  let n = 0;
  for (const tb of root.querySelectorAll('table')) {
    if (tb.classList.contains('ph-cards') || tb.closest('.ph-keep')) continue;
    const head = tb.tHead && tb.tHead.rows[0] ? tb.tHead.rows[0] : (tb.rows[0] && [...tb.rows[0].cells].every(c => c.tagName === 'TH') ? tb.rows[0] : null);
    const cols = head ? [...head.cells].reduce((a, c) => a + (c.colSpan || 1), 0) : (tb.rows[0] ? tb.rows[0].cells.length : 0);
    if (cols < 3) continue;
    const names = []; if (head) for (const c of head.cells) for (let i = 0; i < (c.colSpan || 1); i++) names.push(c.textContent.trim());
    for (const tr of tb.rows) {
      if (tr === head || tr.parentElement === tb.tHead) continue;
      let col = 0;
      for (const [i, c] of [...tr.cells].entries()) {
        if (names[col] && !c.dataset.th) c.dataset.th = names[col];
        if (i === 0) c.classList.add('ph-t');
        else if (c.querySelector('button, select, input')) c.classList.add('ph-act');
        col += c.colSpan || 1;
      }
    }
    if (head && head.parentElement !== tb.tHead) head.classList.add('ph-headrow'), head.style.display = 'none';
    tb.classList.add('ph-cards'); n++;
  }
  return n;
};
// a heading as a short button caption: "The market of Kingsmere" -> "Market of Kingsmere"
PH.short = t => { t = t.trim().replace(/\s*\(\d+\)$/, '').replace(/^the\s+/i, ''); t = t.charAt(0).toUpperCase() + t.slice(1); return t.length > 24 ? t.slice(0, 23) + '…' : t; };
// a page with four or more sections gets an index at its top
PH.index = function (tb) {
  if (!tb || tb.querySelector('.ph-jump')) return 0;
  const hs = [...tb.querySelectorAll('.group-h')].filter(h => !h.closest('details:not([open]), .mbox, .card .card') && h.textContent.trim());
  if (hs.length < 4) return 0;
  hs.forEach((h, i) => { if (!h.id) h.id = 'ph-h-' + i; });
  const nav = document.createElement('nav'); nav.className = 'ph-jump'; nav.setAttribute('aria-label', 'On this page');
  nav.innerHTML = `<span class="tag">On this page</span>` + hs.map((h, i) => `<button class="small ghost" data-a="phJump" data-v="${i}">${UI.esc(PH.short(h.textContent))}</button>`).join('');
  // just before the first section it lists
  const first = hs[0], at = [...tb.children].find(c => c === first || c.contains(first)) || tb.firstChild;
  tb.insertBefore(nav, at);
  hs.forEach((h, i) => { if (h.id !== 'ph-h-' + i) { const a = document.createElement('span'); a.id = 'ph-h-' + i; h.parentElement.insertBefore(a, h); } });
  return hs.length;
};
// names for what a screen reader would otherwise meet as a nameless button (an avatar beside a name), and a way in by
// keyboard for a region the phone layout makes scroll (a map's side panel)
PH.a11y = function (root) {
  if (!root) return;
  for (const el of root.querySelectorAll('[role=button]:not([aria-label]):not([aria-labelledby]), [data-a]:not(button):not([aria-label])')) {
    if (el.textContent.trim()) continue;
    const twin = el.dataset.a && [...root.querySelectorAll(`[data-a="${el.dataset.a}"]`)].find(x => x !== el && x.dataset.v === el.dataset.v && x.textContent.trim());
    if (twin) el.setAttribute('aria-label', twin.textContent.trim().slice(0, 60));
  }
  for (const el of root.querySelectorAll('#gmSide, .wr-side, .wr-panel')) {
    if (el.hasAttribute('tabindex') || el.scrollHeight <= el.clientHeight + 1 || el.querySelector('button, a[href], select, input, [tabindex]')) continue;
    el.tabIndex = 0; if (!el.getAttribute('role')) el.setAttribute('role', 'region'); if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Details');
  }
};
PH.decoratePage = function () {
  if (!PH.on() || typeof document === 'undefined') return;
  const tb = document.querySelector('#tabbody');
  if (tb) { PH.cardify(tb); PH.index(tb); PH.a11y(tb); }
  PH.maps();
};
const SHEETS = ['event', 'mission', 'choice', 'msg', 'school', 'travel'];
PH.decorateModal = function () {
  if (typeof document === 'undefined') return;
  const m = document.querySelector('#modal'); if (!m) return;
  if (!PH.on()) return;
  const q = UI.screen === 'game' && A.S && A.S.queue && A.S.queue[0];
  const sys = UI.ov && UI.SYS_OV && UI.SYS_OV.includes(UI.ov.type);
  const kind = !sys && q ? q.type : (UI.ov ? UI.ov.type : '');
  m.dataset.ph = kind || '';
  m.classList.toggle('ph-sheet', SHEETS.includes(kind) && !m.querySelector(':scope > .mbox.full'));
  if (m.querySelector(':scope > .hint-float')) m.dataset.phHint = '1'; else delete m.dataset.phHint;
  const box = m.querySelector(':scope > .mbox');
  if (box && kind === 'death') box.classList.add('ph-death');
  // the report flag rides in the sheet's top corner, not over the choices
  const flag = m.querySelector(':scope > .mreport');
  if (flag && box) box.insertBefore(flag, box.firstChild);
  // pin the choices only while they leave most of the sheet to the text
  const ch = box && box.querySelector(':scope > .choices');
  m.classList.toggle('ph-pin', !!(ch && m.classList.contains('ph-sheet') && ch.getBoundingClientRect().height < 0.5 * window.innerHeight));
  if (box) { PH.cardify(box); PH.a11y(box); }
  // the battle field in a frame of its own that pans sideways, with a line saying so
  const cv = m.querySelector('#battlecv');
  if (cv && !cv.parentElement.classList.contains('ph-pan')) {
    const f = document.createElement('div'); f.className = 'ph-pan'; f.setAttribute('role', 'region'); f.setAttribute('aria-label', 'The field'); f.tabIndex = 0;
    cv.parentElement.insertBefore(f, cv); f.appendChild(cv);
    const p = document.createElement('span'); p.className = 'tiny muted ph-pan-hint'; p.textContent = 'Drag the field sideways to see all of it.'; f.insertAdjacentElement('afterend', p);
  }
  PH.maps();
};

// ---- pinch zoom on the full map and the war room ---------------------------------------------------------------
// The release pans both by dragging (pointer events) and zooms by the wheel or buttons. Two fingers now zoom about
// their midpoint; while two are down the release's own drag does not see them.
PH.pinch = function (cv, zoomAt, ui) {
  if (!cv || cv._phPinch) return;
  cv._phPinch = true;
  const wrap = cv.parentElement || cv, pts = new Map();
  let last = 0;
  const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const mid = () => { const [a, b] = [...pts.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
  wrap.addEventListener('pointerdown', e => {
    if (e.target !== cv || e.pointerType !== 'touch') return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { last = dist(); e.stopPropagation(); if (cv.onpointerup) cv.onpointerup(e); }
  }, true);
  wrap.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size < 2) return;
    e.stopPropagation();
    const d = dist();
    if (last > 0 && d > 0 && Math.abs(d / last - 1) > 0.01) {
      const r = cv.getBoundingClientRect(), m = mid();
      zoomAt(d / last, Math.min(1, Math.max(0, (m.x - r.left) / r.width)), Math.min(1, Math.max(0, (m.y - r.top) / r.height)));
      last = d;
      if (ui) ui.dragged = true;
    }
  }, true);
  const up = e => { if (!pts.delete(e.pointerId)) return; if (pts.size < 2) last = 0; };
  wrap.addEventListener('pointerup', up, true);
  wrap.addEventListener('pointercancel', up, true);
};
PH.maps = function () {
  if (typeof document === 'undefined') return;
  const gm = document.querySelector('#gmap');
  if (gm && UI.gm && UI.gmDraw) PH.pinch(gm, (f, px, py) => {
    const v = UI.gm.view; if (!v) return;
    const kx = v.x0 + v.w * px, ky = v.y0 + v.h * py;
    v.w /= f; v.h /= f; v.x0 = kx - v.w * px; v.y0 = ky - v.h * py;
    UI.wrClampView && UI.wrClampView(v); UI.gmDraw();
  }, UI.gm);
  const wm = document.querySelector('#warmap');
  if (wm && UI.wrZoom && UI.drawWar) PH.pinch(wm, (f, px, py) => { UI.wrZoom(f, px, py); UI.drawWar(wm); }, UI.wr);
};

// ---- the Now page on a phone opens with you: the miniature, health and happiness, one tap from their breakdowns ----
// (the desktop has the profile beside the page at all times; the phone had it a sub-tab away)
PH.youCard = function (pc) {
  const hp = Math.round(pc.health || 0), hap = Math.round(pc.happy || 0);
  const por = typeof PORTRAIT !== 'undefined' && PORTRAIT.svg ? PORTRAIT.svg(pc, 56) : '';
  return `<div class="ph-you" role="group" aria-label="You">` +
    `<button class="ph-you-por" data-a="tab" data-v="you" aria-label="Your page: ${UI.esc(A.fullName(pc))}">${por}</button>` +
    `<div class="ph-you-b"><div class="ph-you-n">${UI.esc(A.fullName(pc))}</div>` +
    `<div class="ph-you-s"><span class="tt" data-tt="health" data-v="">Health <b>${UI.esc(hp)}</b></span><span class="tt" data-tt="happy" data-v="">Happiness <b>${UI.esc(hap)}</b></span></div></div></div>`;
};
const renderTab = UI.renderTab;
UI.renderTab = function () {
  const h = renderTab.apply(this, arguments);
  try { const pc = A.pc(); if (PH.on() && UI.tab === 'life' && pc && pc.alive) return PH.youCard(pc) + h; } catch (e) { console.error(e); }
  return h;
};

// ---- wiring --------------------------------------------------------------------------------------------------
const render = UI.render;
UI.render = function () { const r = render.apply(this, arguments); try { PH.decoratePage(); PH.decorateModal(); } catch (e) { console.error(e); } return r; };
const refreshTab = UI.refreshTab;
if (refreshTab) UI.refreshTab = function () { const r = refreshTab.apply(this, arguments); try { PH.decoratePage(); } catch (e) { console.error(e); } return r; };
const renderModal = UI.renderModal;
UI.renderModal = function () { const r = renderModal.apply(this, arguments); try { PH.decorateModal(); } catch (e) { console.error(e); } return r; };

// ---- the opening view (cycle 1, first-hour I4): a life on a phone opens on its story ------------------------------
// "Be born" landed on Life → Now, a near-empty page for a newborn, while the page that says who you are and where
// ("You are born in Amberwick... your father is Hesketh, a shepherd") sat under Story, which nothing pointed to. A new
// life on a phone now opens on Story, and Story carries the sub-tab badge when new lines have come in since it was last
// open. The badge reads the log; nothing is written to the world.
const storyLines = () => { let n = 0; for (const e of (A.S && A.S.log) || []) if (e && Array.isArray(e.lines)) n += e.lines.length; return n; };
PH.storySeen = 0;
PH.markStory = () => { PH.storySeen = storyLines(); };
const startLife = UI.startLife;
UI.startLife = function () {
  const S0 = A.S, pc0 = S0 && S0.pc;
  const r = startLife.apply(this, arguments);
  try {
    if (PH.on() && UI.screen === 'game' && A.S && A.pc() && (A.S !== S0 || A.S.pc !== pc0)) { UI.setTab('story'); PH.markStory(); UI.render(); }
  } catch (e) { console.error('phone story start', e); }
  return r;
};
const setTab = UI.setTab;
UI.setTab = function () {
  const was = UI.tab, r = setTab.apply(this, arguments);
  try { if (was === 'story' || UI.tab === 'story') PH.markStory(); } catch (e) {}
  return r;
};
const tabBadge = UI.tabBadge;
UI.tabBadge = function (k, pc) {
  const b = tabBadge.apply(this, arguments);
  try { if (!b && k === 'story' && PH.on() && UI.tab !== 'story' && A.S && storyLines() > PH.storySeen) return 'new lines in your story'; } catch (e) {}
  return b;
};
