// 91-look, part 2: the base and the components (brief §2 type in use, §3.3 borders and elevation, §5.1-5.8, §6 motion).
// Plain CSS over the release's own markup: buttons, tabs, segmented controls, expanders (90-fold's behaviour), bars,
// chips, cards (one level), tables, modals, tooltips (59-tooltips' engine), toasts and focus rings.
//
// Selectors that must beat the release's light-theme rules (`:root[data-theme=light] button` and the like) carry the
// same weight (R below) and win by coming later: this stylesheet is kept last in <head> (look.z-wire.core.js).
(function () {
  const LOOK = UI.LOOK, T = LOOK.T;
  const R = ':root[data-theme]';
  const X = s => s.split(',').map(x => `${R} ${x.trim()}`).join(',');
  LOOK.R = R; LOOK.X = X;

  // the ground behind the panels: a seeded star field and a far ridge by night, washi fibre by day (brief §3.3); static
  const WASHI = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="f"><feTurbulence type="fractalNoise" baseFrequency=".9 .06" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .35 0 0 0 0 .28 0 0 0 0 .16 0 0 0 .55 0"/></filter><rect width="240" height="240" filter="url(#f)" opacity=".06"/></svg>')}")`;

  LOOK.css.base = `
html,body{font-family:var(--f-ui);font-size:var(--t-ui);line-height:var(--lh-ui);color:var(--ink);font-variant-numeric:lining-nums tabular-nums;font-feature-settings:"tnum" 1}
${X('body')}{background:var(--ground-img, none) center bottom / 100% 100% no-repeat fixed, var(--bg)}
:root[data-theme=light] body{background:${WASHI} repeat, var(--bg)}
.boot{background:#0d1120;color:#f0c062;font-family:var(--f-name)}
h1,h2{font-family:var(--f-name);font-weight:700;color:var(--accent-strong);letter-spacing:.02em}
${X('h1')}{font-size:var(--t-h1);line-height:1.2}
${X('h2')}{font-size:var(--t-h2);line-height:1.27}
${X('h3')}{font-family:var(--f-ui);font-size:var(--t-h3);line-height:1.38;font-weight:700;color:var(--ink);letter-spacing:0}
${X('h4')}{font-family:var(--f-ui);font-size:var(--t-cap);line-height:var(--lh-cap);font-weight:700;color:var(--ink-2);letter-spacing:.06em;text-transform:uppercase}
${X('a')}{color:var(--accent)}
${X('::selection')}{background:var(--accent-tint);color:var(--ink)}
*{scrollbar-color:var(--line-strong) transparent}
*::-webkit-scrollbar-thumb{background:var(--line-strong)}
${X('.muted')}{color:var(--ink-3)}
${X('.ink2')}{color:var(--ink-2)}
${X('.small')}{font-size:var(--t-small);line-height:var(--lh-small)}
${X('.tiny')}{font-size:var(--t-small);line-height:var(--lh-small)}
${X('.good,.good-t')}{color:var(--ok)}
${X('.bad,.bad-t')}{color:var(--danger)}
${X('.warn,.warn-t')}{color:var(--warn)}
${X('.gold-t')}{color:var(--accent-strong)}
${X('.tag')}{white-space:nowrap;font-family:var(--f-ui);font-size:var(--t-cap);line-height:var(--lh-cap);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);font-weight:700}
${X('.sep')}{background:var(--line);margin:var(--sp-2) 0}
${X('.lore-text')}{font-family:var(--f-prose);font-size:var(--t-small);color:var(--ink-2)}
/* prose: Literata, measure capped at 68ch (the story log, event text, results, the chronicle, obituaries) */
${X('.ll, .mtext, .result, .duellog, .mlog, .read, .chron-e, .obit p, details.more .mtext, .lore-body, .ts .ts-see')}{font-family:var(--f-prose)}
${X('#log .ll')}{font-size:var(--t-prose);line-height:var(--lh-prose);max-width:68ch;margin:0 0 6px}
${X('#log .ll.lore')}{font-size:var(--t-small);line-height:var(--lh-small);font-style:italic}
${X('#log .ll.muted')}{font-size:var(--t-small);line-height:var(--lh-small)}
${X('#log .ll .ld')}{font-family:var(--f-ui);font-size:var(--t-cap);color:var(--ink-3);min-width:46px;font-style:normal;letter-spacing:.02em}
${X('.ly')}{border-left:1px solid var(--line);padding-left:var(--sp-3);margin-bottom:var(--sp-4)}
${X('.ly:last-child')}{border-left:2px solid var(--accent)}
${X('.ly .yh')}{font-family:var(--f-ui);font-size:var(--t-cap);line-height:var(--lh-cap);font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-bottom:6px}
${X('.ly .yh span')}{font-family:var(--f-ui);font-size:var(--t-cap);color:var(--ink-3);letter-spacing:.04em}
${X('.ll.big, .ll.ach')}{color:var(--accent-strong)}
${X('.ll.good')}{color:var(--ok)}
${X('.ll.bad, .ll.death')}{color:var(--danger)}
${X('.ll.warn')}{color:var(--warn)}
/* names and titles: Cinzel, flush left */
${X('#profile .pname, .phone-profile .pname, .ph-you-n, .duel .fname, .ord-name, .opt .t, .stylecard .sname, .elite-ban b, .ach b')}{font-family:var(--f-name);font-weight:700;color:var(--accent-strong);letter-spacing:.01em}
${X('#topbar .brand')}{font-family:var(--f-name);font-size:${T(18)};letter-spacing:.14em;color:var(--accent-strong);font-weight:700}
${X('#title .logo')}{font-family:var(--f-name);letter-spacing:.12em;color:var(--accent-strong);text-shadow:0 2px 0 var(--line-ink), 0 0 32px var(--accent-glow)}
${X('#title .sub')}{font-family:var(--f-ui);font-size:var(--t-cap);letter-spacing:.3em;color:var(--ink-2);text-transform:uppercase;font-weight:700}
${X('#title .blurb')}{font-family:var(--f-prose);font-size:${T(16)};line-height:1.56;color:var(--ink-2)}
${X('.score')}{font-family:var(--f-impact);font-weight:400;color:var(--accent-strong);letter-spacing:.02em}
${X('.mbox h2, .wr-top h2')}{font-family:var(--f-name)}
${X('.mbox:not(.obit) .mtext:first-letter')}{font-family:var(--f-name);font-weight:700;color:var(--accent);text-shadow:none}
${X('[data-vellum="1"] .il-vellum p:first-of-type::first-letter, .ts .ts-see::first-letter')}{font-family:var(--f-name);font-weight:700}
${X('.ts-strip')}{font-family:var(--f-ui)}
/* the release's fixed sizes, set on the new scale (12 px is the floor) */
${X('table.t')}{font-size:var(--t-small);line-height:var(--lh-small)}
${X('table.t th')}{font-family:var(--f-ui);font-size:var(--t-cap);letter-spacing:.06em;color:var(--ink-2);font-weight:700;border-bottom-color:var(--line-strong)}
${X('table.t:not(.ph-cards) th')}{padding:4px 6px}
${X('table.t td')}{border-bottom-color:var(--line)}
${X('table.t:not(.ph-cards) td')}{padding:4px 6px}
${X('table.ph-cards > tbody > tr, table.ph-cards > tr')}{background:var(--raised);border-color:var(--line)}
${X('table.t tr.click:hover td, tr.sel td')}{background:var(--raised-hover)}
${X('.kv')}{font-size:var(--t-small);line-height:var(--lh-small)}
${X('.person .sub, .ditem .relv, .attn-i, .recap-l, .tacdesc, .legend, .skrow, .dr-b, .dr-exp, .lore-row, .ord-lore>summary, .squad .m, .blog, .wr-actions select, .mkt-t')}{font-size:var(--t-small)}
${X('.ditem .nm, .prof-role, .dec-in, .card.dec select, .st-ctl select')}{font-size:var(--t-ui)}
${X('.profs .tier')}{opacity:1;color:var(--ink-3)}
${X('.profs .prow, .req, .wr-chip, .wr-order small, .wr-sup small, .wr-laws small, .skrow i, .ord-traits .chip')}{font-size:var(--t-cap)}
${X('.badge, .tech, .techbtn small, .ladder, .perk, .profs .apt, .profs .tier, .bondline .chip, .ditem .ds .chip, .wr-stats span, .wr-stats b small, .wr-kpis small, .leg-h, .ro-h, .actbtns button small, .actbtns button .key, .chip.tier')}{font-size:var(--t-cap)}
${X('.leg-h, .ro-h')}{font-family:var(--f-ui);font-weight:700;letter-spacing:.06em;color:var(--ink-3)}
${X('.chron-y')}{font-family:var(--f-ui);font-size:var(--t-cap);letter-spacing:.06em;color:var(--accent)}
${X('.maptip')}{font-size:var(--t-small);background:var(--overlay);color:var(--ink);border-color:var(--line-strong)}
${X('#toast')}{font-size:var(--t-ui)}
@media (min-width:761px){${X('.obit .years')}{font-family:var(--f-ui);letter-spacing:.08em}}

/* ---- surfaces: panels are the one frame; the release's gilt corners and leather gradients go */
${X('.panel')}{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-l);box-shadow:var(--e-2)}
${X('#tabs')}{background:none}
/* cards: one level. A card on a panel is a section, not a frame: no fill and no border, a rule between it and the
   next. A card that is itself a thing to pick (a person, an offer, an option) stays a tile on --raised. */
${X('.card')}{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-m);box-shadow:none;padding:10px 12px}
${X('#tabbody > .card:where(:not(.click, .person, .sel, .opt)), #tabbody .fold-b > .card:where(:not(.click, .person, .sel, .opt)), #profile .card')}{background:none;border:0;border-top:1px solid var(--line);border-radius:0;padding:var(--sp-3) 0 var(--sp-2);margin:0}
${X('.card .card')}{background:none;border:0;border-top:1px solid var(--line);border-radius:0;padding:var(--sp-2) 0;box-shadow:none}
${X('.card.click, .card.person, .card.opt, .card.offer, .ach, .famcard')}{background:var(--raised);border:1px solid var(--line);border-radius:var(--r-m);box-shadow:var(--e-1)}
${X('.card.click:hover, .card.opt:hover')}{background:var(--raised-hover);border-color:var(--accent)}
${X('.card.sel')}{border:2px solid var(--accent);box-shadow:var(--glow-accent)}
${X('.plan-card, .whatnow, .path-role, .card.spec.pending, .wr-mine, .dipl-card')}{background:none;border-color:var(--line)}
${X('.card.attn, .card.boss, .card.offer, .door, .wr-army.mine')}{border-left:2px solid var(--accent)}
${X('.card.attn')}{border-left-color:var(--warn)}
${X('.warnbox')}{background:var(--warn-tint);border-color:var(--warn);color:var(--warn)}
${X('.hint')}{background:var(--accent-tint);border:1px solid var(--accent-rule);border-radius:var(--r-m);color:var(--ink);font-size:var(--t-small)}
${X('.hint .hint-t b, .hint .hint-ic')}{color:var(--accent-strong)}
${X('.hint-float')}{background:var(--overlay);box-shadow:var(--e-3)}
/* the first-run hint on the Life panel is a one-time callout under the What now header, over the rows, not a block
   that pushes the panel down (brief §4.1) */
@media (min-width:761px){
  #game:not(.phone) #tabbody.lk-life{position:relative}
  ${X('#game:not(.phone) #tabbody.lk-life > .hint')}{position:absolute;z-index:6;left:12px;right:12px;top:40px;margin:0;background:var(--overlay);border:1px solid var(--accent);box-shadow:var(--e-2)}
  ${X('#game:not(.phone) #tabbody.lk-life > .hint::before')}{content:"";position:absolute;left:28px;top:-6px;width:10px;height:10px;background:var(--overlay);border-left:1px solid var(--accent);border-top:1px solid var(--accent);transform:rotate(45deg)}
}
${X('.read')}{background:var(--info-tint);border:1px dashed var(--crown-ink);font-size:var(--t-small)}
${X('.result')}{background:var(--sunken);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:var(--r-s);font-size:var(--t-prose);line-height:var(--lh-prose)}
${X('.result.bad')}{border-left-color:var(--danger)}
${X('.result.good')}{border-left-color:var(--ok)}
${X('.mlog, .blog, .duellog, .oob-scroll, .dipl-list')}{background:var(--sunken);border-color:var(--line)}
${X('.mapwrap canvas, .wr-map canvas, .mapstrip')}{border:1px solid var(--line-strong);box-shadow:var(--e-2)}

/* ---- buttons (brief §5.1): secondary at rest; primary gold with the cut corner; ghost; danger */
${X('button')}{font-family:var(--f-ui);font-size:var(--t-ui);line-height:1.2;font-weight:600;color:var(--ink);background:var(--raised);border:1px solid var(--line-strong);border-radius:var(--r-s);box-shadow:none;
  min-height:var(--hit);padding:4px 12px;gap:6px;text-shadow:none;
  transition:background-color var(--m-quick) var(--ease-std),border-color var(--m-quick) var(--ease-std),color var(--m-quick) var(--ease-std),transform var(--m-press) var(--ease-press),box-shadow var(--m-quick) var(--ease-std)}
${X('button:hover:not(:disabled)')}{background:var(--raised);border-color:var(--accent);color:var(--accent)}
${X('button:active:not(:disabled)')}{background:var(--sunken);transform:translateY(1px)}
${X('button:disabled, button[aria-disabled=true]')}{opacity:1;color:var(--ink-3);border-color:var(--line);background:var(--raised);cursor:not-allowed}
${X('button.small')}{font-size:var(--t-small);min-height:28px;padding:2px 10px}
${X('button.ghost')}{background:transparent;border-color:transparent;color:var(--ink-2);box-shadow:none}
${X('button.ghost:hover:not(:disabled)')}{background:var(--raised);border-color:transparent;color:var(--ink)}
${X('button.ghost:active:not(:disabled)')}{background:var(--sunken)}
${X('button.danger')}{background:var(--danger-fill);border-color:var(--danger-line);color:#fff}
${X('button.danger:hover:not(:disabled)')}{background:var(--danger-fill);border-color:var(--danger-line);color:#fff;box-shadow:var(--glow-danger)}
${X('button.on, button[aria-pressed=true]')}{background:var(--raised);border-color:var(--accent);color:var(--accent);box-shadow:inset 0 -2px 0 var(--accent)}
${X('button.closex')}{width:32px;height:32px;min-height:32px;color:var(--ink-2);background:transparent;border-color:transparent}
/* the primary button: the gold fill sits on ::before, cut at the top-left and bottom-right corners (the signature
   shape, brief §3.2); the button itself is not clipped, so its focus ring still shows */
${X('button.primary')}{position:relative;isolation:isolate;background:transparent;border:0;color:var(--on-accent);font-weight:700;min-height:40px;padding:6px 18px;box-shadow:none;text-shadow:none}
${X('button.primary::before')}{content:"";position:absolute;inset:0;z-index:-1;background:var(--accent-fill);
  clip-path:polygon(var(--cut) 0,100% 0,100% calc(100% - var(--cut)),calc(100% - var(--cut)) 100%,0 100%,0 var(--cut));transition:background-color var(--m-quick) var(--ease-std),filter var(--m-quick)}
${X('button.primary::after')}{content:"";position:absolute;inset:-3px;z-index:-2;border-radius:6px;background:var(--accent-glow);filter:blur(8px);opacity:0;transition:opacity var(--m-quick) var(--ease-std);pointer-events:none}
${X('button.primary:hover:not(:disabled)')}{background:transparent;color:var(--on-accent);border:0;box-shadow:none}
${X('button.primary:hover:not(:disabled)::before')}{background:var(--accent-fill-hover)}
:root[data-theme=dark] button.primary:hover:not(:disabled)::after{opacity:1}
${X('button.primary:active:not(:disabled)')}{transform:translateY(1px);background:transparent}
${X('button.primary:active:not(:disabled)::before')}{background:var(--accent-fill-press)}
/* Washi: the gold fill alone is 2.1:1 on the page, so it gets a 1 px border in #8a5a10 */
:root[data-theme=light] button.primary::before{padding:1px;background:linear-gradient(var(--accent-fill),var(--accent-fill)) content-box, var(--accent-fill-line) border-box}
:root[data-theme=light] button.primary:hover:not(:disabled)::before{background:linear-gradient(var(--accent-fill-hover),var(--accent-fill-hover)) content-box, var(--accent-fill-line) border-box}
:root[data-theme=light] button.primary:active:not(:disabled)::before{background:linear-gradient(var(--accent-fill-press),var(--accent-fill-press)) content-box, var(--accent-fill-line) border-box}
${X('button.primary:disabled, button.primary[aria-disabled=true]')}{color:var(--ink-3)}
${X('button.primary:disabled::before, button.primary[aria-disabled=true]::before')}{background:var(--raised);box-shadow:inset 0 0 0 1px var(--line)}
${X('button.primary .ic')}{stroke-width:2.25}
/* an option that cannot be picked (the new-life screen): --ink-3 on a dashed edge, not a 35% fade that fails contrast */
${X('.opt.dis')}{opacity:1;border-style:dashed;background:transparent;box-shadow:none}
${X('.opt.dis .t, .opt.dis .d')}{color:var(--ink-3)}
${X('.card.opt .d')}{color:var(--ink-2)}
${X('.card.opt.sel')}{background:var(--raised)}
/* fields */
${X('input, select, textarea')}{font-family:var(--f-ui);font-size:var(--t-ui);color:var(--ink);background-color:var(--sunken);border:1px solid var(--line-strong);border-radius:var(--r-s);min-height:var(--hit);padding:4px 10px}
${X('select')}{padding-right:28px;background-image:linear-gradient(45deg,transparent 50%,var(--ink-2) 50%),linear-gradient(135deg,var(--ink-2) 50%,transparent 50%)}
${X('input:hover, select:hover, textarea:hover')}{border-color:var(--accent)}
${X('input:focus-visible, select:focus-visible, textarea:focus-visible')}{outline:2px solid var(--focus);outline-offset:2px;border-color:var(--accent);box-shadow:none}
${X('input[type=range], input[type=checkbox]')}{accent-color:var(--accent-fill)}
/* focus: 2 px --focus ring, 2 px offset, on the surface rather than the control (brief §3.3) */
${X(':focus-visible')}{outline:2px solid var(--focus);outline-offset:2px}

/* ---- segmented controls (Now | Decisions, How hard, the clock's speeds; brief §5.2) */
${X('.seg')}{background:var(--sunken);border:1px solid var(--line-strong);border-radius:var(--r-s);overflow:hidden}
${X('.seg button')}{background:transparent;border:0;border-radius:0;color:var(--ink-2);min-width:44px;min-height:30px;font-weight:600;box-shadow:none}
${X('.seg button+button')}{border-left:1px solid var(--line)}
${X('.seg button:hover:not(:disabled)')}{background:var(--raised);color:var(--ink);border-color:var(--line)}
${X('.seg button.on')}{background:var(--raised);color:var(--accent);box-shadow:inset 0 -2px 0 var(--accent)}

/* ---- the panel's tabs (brief §5.2): icon over a cap label; the chosen one gold on --raised with a cut-corner bar */
${X('#tabs')}{border-bottom:1px solid var(--line);padding:0}
${X('#tabs .tabbar')}{gap:0;padding:0 2px}
${X('#tabs .tabbar button')}{min-height:40px;padding:4px 1px 5px;gap:2px;border:0;border-radius:var(--r-s) var(--r-s) 0 0;background:transparent;color:var(--ink-2);font-family:var(--f-ui);font-size:var(--t-cap);font-weight:700;letter-spacing:.01em;text-transform:uppercase;line-height:1.1;box-shadow:none}
${X('#tabs .tabbar button .ic.s')}{width:18px;height:18px}
${X('#tabs .tabbar button:hover:not(:disabled)')}{color:var(--ink);background:transparent;border:0}
${X('#tabs .tabbar button.on')}{color:var(--accent);background:var(--raised);border:0}
${X('#tabs .tabbar button.on::after')}{content:"";display:block;position:absolute;left:10%;right:10%;bottom:0;top:auto;width:auto;height:3px;margin:0;transform:none;border:0;background:var(--accent);
  clip-path:polygon(3px 0,100% 0,100% 0,calc(100% - 3px) 100%,0 100%,0 0)}
${X('#tabs .subbar')}{margin:4px 8px;background:var(--sunken);border:1px solid var(--line-strong);border-radius:var(--r-s);overflow:hidden;gap:0}
${X('#tabs .subbar button')}{min-height:30px;padding:2px 10px;font-family:var(--f-ui);font-size:var(--t-cap);font-weight:700;letter-spacing:.06em;text-transform:uppercase;border:0;border-radius:0;background:transparent;color:var(--ink-2)}
${X('#tabs .subbar button+button')}{border-left:1px solid var(--line)}
${X('#tabs .subbar button.on')}{background:var(--raised);color:var(--accent);box-shadow:inset 0 -2px 0 var(--accent)}
${X('#tabs .tabbar .badge, #bnav .tabbar .badge, .badge')}{background:var(--danger-fill);color:#fff;font-family:var(--f-ui);font-weight:700}
/* a tab with something waiting carries a 6 px dot, not a number (brief §5.2); the "!" stays for screen readers' sake */
${X('#tabs .tabbar .badge')}{top:6px;right:calc(50% - 16px);width:7px;height:7px;min-width:0;padding:0;border-radius:50%;overflow:hidden;color:transparent;background:var(--danger);box-shadow:0 0 0 2px var(--surface)}

/* ---- expanders (brief §5.3; 90-fold's behaviour): one full-width header row, a chevron, a cap title, a count pill,
   a one-line summary on the right */
${X('.group-h')}{font-family:var(--f-ui);font-size:var(--t-cap);line-height:var(--lh-cap);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2);margin:var(--sp-3) 0 var(--sp-2)}
${X('.group-h::before')}{display:none}
${X('.group-h::after')}{background:var(--line)}
${X('.fold')}{margin:0;border-top:1px solid var(--line)}
${X('.fold > .fold-head')}{position:relative;margin:0;min-height:32px;padding:0 0 0 22px;gap:8px;color:var(--ink-2);white-space:nowrap;min-width:0;max-width:100%;overflow:hidden}
@media (max-width:760px){${X('.fold > .fold-head')}{white-space:normal}}
${X('.fold > .fold-head::after')}{display:none}
${X('.fold > .fold-head:hover')}{color:var(--ink)}
${X('.fold > .fold-head > .fold-h')}{position:absolute;inset:0;width:auto;height:auto;margin:0;padding:0 0 0 2px;border:0;border-radius:var(--r-s);background:transparent;display:flex;align-items:center;justify-content:flex-start;z-index:0;min-height:0;box-shadow:none}
${X('.fold > .fold-head > .fold-h:hover')}{background:transparent}
${X('.fold > .fold-head > :not(.fold-h)')}{position:relative;z-index:1}
${X('.fold > .fold-head > .tt, .fold > .fold-head > [data-tt], .fold > .fold-head > [data-tip], .fold > .fold-head > button:not(.fold-h), .fold > .fold-head > a')}{z-index:2}
${X('.fold-h::before, .fold-x::before')}{content:"";width:7px;height:7px;border:0;border-right:2px solid var(--ink-2);border-bottom:2px solid var(--ink-2);transform:rotate(45deg) translate(-2px,-2px);margin:0 6px 0 4px;transition:transform var(--m-quick) var(--ease-std)}
${X('.fold-h[aria-expanded="false"]::before, .fold-x[aria-expanded="false"]::before')}{transform:rotate(-45deg) translate(-1px,-1px)}
${X('.fold-h:hover::before, .fold-x:hover::before')}{border-color:var(--accent)}
${X('.fold-n')}{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 6px;border:0;border-radius:var(--r-pill);background:var(--sunken);color:var(--ink-2);line-height:1}
${X('.fold-n::before')}{font-family:var(--f-ui);font-size:var(--t-cap);font-weight:700}
${X('.fold-sum')}{flex:1 1 0;text-align:right;margin-left:auto;padding-left:8px;font-family:var(--f-ui);font-size:var(--t-small);font-weight:400;letter-spacing:0;text-transform:none;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;pointer-events:none}
${X('.fold > .fold-b')}{padding:2px 0 var(--sp-3)}
${X('.fold-tools')}{margin:0 0 2px;justify-content:flex-end}
${X('.fold-tools .ghost')}{min-height:24px;padding:0 4px;font-size:var(--t-cap);color:var(--ink-3);text-decoration:underline dotted;text-underline-offset:3px;background:none;border:0;font-weight:600}
${X('.fold-tools .ghost:hover:not(:disabled)')}{color:var(--accent);background:none}
/* a card that folds (What now, Your days, the armorer ...): its first row is the header; the corner button covers it */
${X('.fold-card')}{position:relative}
${X('.fold-card > .fold-x')}{position:absolute;left:0;right:0;top:0;height:32px;width:auto;float:none;margin:0;padding:0 0 0 2px;border:0;border-radius:var(--r-s);background:transparent;box-shadow:none;display:flex;align-items:center;justify-content:flex-start;z-index:0;min-height:0}
${X('.fold-card > .fold-x:hover:not(:disabled)')}{background:transparent;border:0}
${X('.fold-card > .fold-x + *')}{position:relative;z-index:1;pointer-events:none;min-height:32px;margin:0;padding-left:22px;display:flex;align-items:center}
${X('.fold-card > .fold-x + * :is(button, select, input, a, [data-a], [data-tt], [data-tip], .tt, .tipt)')}{pointer-events:auto;position:relative;z-index:2}
${X('#tabbody > .fold-card, #tabbody .fold-b > .fold-card')}{padding-top:0}
${X('.fold-card.folded')}{padding-bottom:0}

/* ---- bars (brief §5.4): flat fills, no gradient, no border; the potential a 2 px tick */
${X('.bar')}{height:6px;background:var(--sunken);border:0;border-radius:var(--r-xs);box-shadow:none;overflow:hidden}
${X('.bar > i')}{background:var(--vital);border-radius:0}
${X('.bar > s')}{width:2px;top:0;bottom:0;background:var(--ink);opacity:.6}
${X('.statbar > i')}{background:var(--accent)}
${X('.hpbar > i')}{background:var(--vital-health)}
${X('.fatbar > i')}{background:var(--info)}
${X('.adbar > i')}{background:var(--crown-ink)}
${X('.profs .prow .bar, .profs .prow .bar i')}{border-radius:0}
${X('.profs .prow .bar')}{background:var(--sunken);height:3px}
${X('.profs .prow .bar i')}{background:var(--accent)}
${X('.clk-bar')}{background:var(--sunken);border:1px solid var(--line-strong)}
${X('.clk-bar i')}{background:var(--accent)}
${X('.wr-bars, .comp')}{background:var(--sunken)}
${X('.stages i')}{background:var(--line)}
${X('.stages i.done')}{background:var(--accent)}
${X('.stages i.now')}{background:var(--accent-strong);box-shadow:none}
${X('.pip')}{background:var(--accent-fill);border-color:var(--accent-fill-line)}
${X('.pip.used')}{background:transparent;border-color:var(--line-strong)}

/* ---- chips (brief §5.5) */
${X('.chip')}{font-family:var(--f-ui);font-size:var(--t-cap);font-weight:600;line-height:1.2;min-height:22px;padding:2px 8px;border-radius:var(--r-pill);border:1px solid var(--line-strong);background:transparent;color:var(--ink-2);margin:0;gap:4px}
${X('.chip.click:hover')}{border-color:var(--accent);color:var(--accent)}
${X('.chip.gold')}{border-color:var(--accent-rule);color:var(--accent);background:var(--accent-tint)}
${X('.chip.red')}{border-color:transparent;color:var(--danger);background:var(--danger-tint)}
${X('.chip.green')}{border-color:transparent;color:var(--ok);background:var(--ok-tint)}
${X('.chip.blood')}{border-color:var(--blood-ink);color:var(--blood-ink)}
/* rarity (brief §1.5): the fighting tiers and gear quality read the gacha ladder */
${X('.chip.tier')}{color:var(--tc);border:1.5px solid var(--tc);background:transparent}
${X('.chip.tier::before')}{content:var(--gem, "◇");width:auto;height:auto;transform:none;background:none;font-size:.9em;color:var(--tc)}
${X('.chip.tier.t0, .chip.tier.t1')}{--tc:var(--r-common);--gem:"◇"}
${X('.chip.tier.t2')}{--tc:var(--r-uncommon);--gem:"◆"}
${X('.chip.tier.t3')}{--tc:var(--r-rare);--gem:"◆◆"}
${X('.chip.tier.t4')}{--tc:var(--r-epic);--gem:"◆◆◆"}
${X('.chip.tier.t5')}{--tc:var(--r-legendary);--gem:"★"}
${X('.chip.tier.t6')}{--tc:var(--r-mythic);--gem:"✦";background:transparent}
:root[data-theme=dark] .chip.tier.t3, :root[data-theme=dark] .chip.tier.t4, :root[data-theme=dark] .chip.tier.t5, :root[data-theme=dark] .chip.tier.t6{box-shadow:0 0 14px color-mix(in srgb, var(--tc) 30%, transparent)}
${X('.chip.qual.q-crude')}{border-color:var(--line-strong);color:var(--r-common)}
${X('.chip.qual.q-fine')}{border-color:var(--r-uncommon);color:var(--r-uncommon)}
${X('.chip.qual.q-master')}{border-color:var(--r-legendary);color:var(--r-legendary);background:transparent}
${X('.req')}{border-color:var(--line-strong);border-radius:var(--r-pill)}
${X('.req.ok')}{color:var(--ok);border-color:transparent;background:var(--ok-tint)}
${X('.req.no')}{color:var(--danger);border-color:var(--danger)}
${X('.perk, .tech')}{background:var(--accent-tint);border:1px solid var(--accent-rule);color:var(--ink)}
${X('.tech')}{background:var(--info-tint);border-color:var(--info)}
${X('.techbar')}{background:var(--info-tint);border-color:var(--info)}
${X('.ladder span')}{background:var(--sunken)}
${X('.ladder span.now')}{background:var(--accent-tint);border-color:var(--accent)}

/* ---- the odds of a choice (brief §1.4): the band word and its pips carry the meaning without colour */
${X('.choices .risk')}{font-family:var(--f-ui);font-size:var(--t-small);font-weight:700;color:var(--ink-2)}
${X('.choices .risk.likely')}{color:var(--odds-likely)}
${X('.choices .risk.risky')}{color:var(--odds-risky)}
${X('.choices .risk.long')}{color:var(--odds-long)}
${X('.choices .risk.even')}{color:var(--odds-even)}

/* ---- the clock and the top bar */
${X('.clk-date, .clk-ini')}{color:var(--ink-2);font-size:var(--t-small)}
${X('.clk-date b, .clk-ini b, #topbar .info b')}{color:var(--ink);font-weight:700}
${X('#topbar .info')}{font-size:var(--t-small);color:var(--ink-2)}
${X('#topbar .info .ic, .clk-date .ic')}{color:var(--ink-3)}
${X('.clk button.on')}{background:var(--raised);color:var(--accent);border-color:var(--accent);box-shadow:inset 0 -2px 0 var(--accent)}

/* ---- What now: three numbered rows */
${X('.wn-h')}{font-family:var(--f-ui);font-size:var(--t-cap);font-weight:700;letter-spacing:.06em;color:var(--ink-2);margin:0}
${X('.wn-h .ic')}{color:var(--accent)}
${X('.wn-item')}{background:var(--raised);border:1px solid var(--line);border-radius:var(--r-m);box-shadow:var(--e-1)}
${X('.wn-item:hover:not(:disabled)')}{background:var(--raised-hover);border-color:var(--accent);color:var(--ink)}
${X('.wn-item .wn-n')}{background:var(--sunken);color:var(--ink-2);font-family:var(--f-ui);font-weight:700;border-radius:var(--r-xs)}
${X('.wn-list > li:first-child .wn-item')}{border-color:var(--accent-rule)}
${X('.wn-list > li:first-child .wn-item .wn-n')}{background:var(--accent-fill);color:var(--on-accent)}
:root[data-theme=dark] .wn-list > li:first-child .wn-item{box-shadow:var(--glow-accent)}
${X('.wn-item .wn-t b')}{color:var(--ink);font-weight:600}
${X('.wn-item .wn-why')}{color:var(--ink-3);font-size:var(--t-small)}
${X('.wn-item.bad')}{border-color:var(--danger)}
${X('.wn-item.bad .wn-n')}{background:var(--danger-tint);color:var(--danger)}
${X('.wn-item.warn')}{border-color:var(--warn)}
${X('.wn-item.good')}{border-color:var(--ok)}
${X('.wn-item .ic')}{color:var(--ink-3)}

/* ---- the event and other prompts: choices are rows on --raised with a number-key badge (brief §5.9, the row only) */
${X('.choices')}{gap:6px}
${X('.choices button')}{background:var(--raised);border:1px solid var(--line);border-radius:var(--r-m);min-height:44px;padding:8px 12px 8px 44px;font-size:var(--t-ui);font-weight:600;box-shadow:var(--e-1);overflow:hidden;color:var(--ink)}
${X('.choices button::before')}{left:10px;width:22px;height:22px;border-radius:var(--r-xs);border:0;background:var(--sunken);color:var(--ink-2);font-family:var(--f-ui);font-size:var(--t-small);font-weight:700}
${X('.choices button:hover:not(:disabled)')}{background:var(--raised-hover);border-color:var(--accent);color:var(--ink)}
${X('.choices button:hover:not(:disabled)::before')}{background:var(--accent-fill);color:var(--on-accent);border:0}
${X('.choices button:active:not(:disabled)')}{background:var(--sunken)}
${X('.mbox .mtext')}{font-size:var(--t-prose);line-height:var(--lh-prose);max-width:68ch}
${X('.mbox:not(.obit) .mtext:first-letter')}{font-size:2.6em;line-height:.9;padding:4px 6px 0 0}
${X('.mbox h2')}{font-size:var(--t-h2);line-height:1.27;margin-bottom:var(--sp-2)}

/* ---- modals and sheets (brief §5.7) */
${X('#modal')}{background:var(--scrim-c);backdrop-filter:none;animation:lkFade var(--m-quick) var(--ease-std)}
${X('.mbox')}{background:var(--surface);border:1px solid var(--line-strong);border-radius:var(--r-l);box-shadow:var(--e-3);padding:var(--sp-5);animation:lkRise var(--m-enter) var(--ease-enter)}
${X('.mbox .mclose')}{color:var(--ink-2)}
${X('.mreport')}{background:var(--raised);border-color:var(--line-strong);color:var(--ink-2);opacity:.7}
@keyframes lkRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes lkFade{from{opacity:0}to{opacity:1}}

/* ---- tooltips (brief §5.8; 59-tooltips' engine): --overlay, one hairline, no gilt */
${X('.tt-pop')}{--tt-bg:var(--overlay);--tt-ink:var(--ink);--tt-ink2:var(--ink-2);--tt-ink3:var(--ink-3);--tt-gold:var(--accent);--tt-line:var(--line-strong);--tt-rule:var(--line);--tt-fit:transparent;
  background:var(--overlay);border:1px solid var(--line-strong);border-radius:8px;box-shadow:var(--e-2);padding:8px 12px 10px;font-family:var(--f-ui);font-size:var(--t-small);line-height:var(--lh-small);max-width:320px}
${X('.tt-pop.tt-deep')}{--tt-bg:var(--overlay);background:var(--overlay)}
${X('.tt-pop.lk-pin, .tt-pop[data-how=click]')}{border-top:2px solid var(--accent)}
${X('.tt-pop .tip-h')}{font-family:var(--f-ui);font-size:var(--t-h3);line-height:1.38;font-weight:700;letter-spacing:0;color:var(--ink)}
${X('.tt-pop .tip-h .muted')}{font-family:var(--f-ui);color:var(--ink-3)}
${X('.tt-pop .tip-d, .tt-pop .tip-f, .tt-pop .tt-feeds')}{font-size:var(--t-small);color:var(--ink-2)}
${X('.tt-pop .tip-f')}{color:var(--ink-3)}
${X('.tt-pop .tip-row.tt-sum span, .tt-pop .tt-feeds i')}{font-family:var(--f-ui);font-size:var(--t-cap);letter-spacing:.06em;text-transform:uppercase}
${X('.tt-pop .tt, .tt-pop .tipt')}{color:var(--info);border-bottom:1px dotted var(--info)}
${X('.tt-pop .tt:hover, .tt-pop .tipt:hover, .tt-pop .tt.tt-on, .tt-pop .tipt.tt-on')}{color:var(--info);border-bottom-style:solid;border-bottom-color:var(--info)}
${X('.tt-pop button.tt-x')}{color:var(--ink-3);background:none;border:0}
${X('.tt-pop button.tt-x:hover')}{color:var(--accent);background:none}
${X('.tt-pop:not([hidden])')}{animation:lkTip var(--m-quick) var(--ease-std)}
@keyframes lkTip{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
${X('.tip-pop')}{background:var(--overlay);border-color:var(--line-strong);color:var(--ink)}
${X('.tt, .tipt')}{border-bottom-color:var(--accent-rule)}
${X('.tt.tt-on, .tipt.tt-on, [data-tt].tt-on')}{color:var(--accent)}
${X('.barrow .lbl .tt')}{border-bottom:1px dotted var(--line-strong)}

/* ---- toasts (brief §5.10, the look): bottom right, --overlay, a 3 px edge */
${X('#toast')}{left:auto;right:16px;bottom:16px;transform:none;width:min(320px,calc(100vw - 32px));max-width:none;text-align:left;border-radius:var(--r-m);border:1px solid var(--line-strong);border-left:3px solid var(--accent);background:var(--overlay);color:var(--ink);box-shadow:var(--e-2);padding:10px 14px;transition:opacity var(--m-exit) var(--ease-exit)}
@media (min-width:761px){${X('#toast')}{bottom:72px}}

/* ---- the release's panels that carried leather: the war room, the map, the clock */
${X('.mapzoom .seg button, .mapzoom button:not(.primary)')}{background:var(--overlay);color:var(--ink);border-color:var(--line-strong)}
${X('.mapzoom .seg button.on')}{background:var(--accent-tint);color:var(--accent)}
${X('.wr-hint')}{background:var(--overlay);color:var(--ink);border-color:var(--line-strong)}
${X('.wr-stats > div, .wr-kpis > div, .wr-order, .wr-chip')}{background:var(--raised);border-color:var(--line)}
${X('.wr-tabs button')}{background:transparent;border-color:transparent;color:var(--ink-2)}
${X('.wr-tabs button.on')}{background:var(--raised);border-color:var(--line-strong);color:var(--accent)}
${X('.ditem.sel, .wr-drow.sel, .oob-row.path, .wr-order.on, .peace .term.on, .chain .link.you')}{background:var(--accent-tint)}
${X('.ditem:hover, .wr-drow:hover')}{background:var(--raised-hover)}
${X('.oob-row.you')}{background:var(--accent-tint);border-left-color:var(--accent)}
${X('.peace-sum')}{background:var(--surface)}
${X('.prof-por svg')}{box-shadow:0 0 0 1px var(--line-strong)}

/* ---- motion (brief §6): every transform becomes a short fade under reduced motion; the release's 1 ms floor stays */
@media (prefers-reduced-motion:reduce){
  ${X('.mbox')}{animation:lkFade 120ms linear}
  ${X('.tt-pop:not([hidden])')}{animation:lkFade 120ms linear}
  ${X('button:active:not(:disabled), .act:active:not(:disabled)')}{transform:none}
  ${X('.fold-h::before, .fold-x::before')}{transition:none}
}
:root.lk-theming *, :root.lk-theming *::before, :root.lk-theming *::after, :root.lk-theming{transition:none!important}
:root[data-motion=off] *, :root[data-motion=off] *::before, :root[data-motion=off] *::after{animation:none!important;transition:none!important}
:root[data-motion=reduced] .mbox, :root[data-motion=reduced] .tt-pop:not([hidden]){animation:lkFade 120ms linear}
`;
})();
