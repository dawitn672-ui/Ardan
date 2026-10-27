// 92-scene-card, part 4: the look (brief §5.9 the card, §1.3 the stat colours, §1.4 the odds bands, §3.2 the cut corner,
// §3.3 elevation, §6 motion). One <style id="sc-style">. 91-look's stylesheet is kept last in <head>, so every rule here
// that meets one of 91's carries more weight (#modal and the card's classes) rather than coming later.
//
// Motion follows the Motion setting when 96-moments is in the build (<html data-motion="full|reduced|off">), else the
// system: full motion rises, slides and pops; reduced motion only fades (120 ms or less); off is still.
(function () {
  const SC = UI.SCENE;
  const T = px => `calc(${px}px * var(--tx, 1))`;
  const R = ':root[data-theme] #modal';
  const C = `${R} .sc-card`;
  // the chamfer: top left and bottom right cut at 45 degrees
  const cut = n => `polygon(${n}px 0,100% 0,100% calc(100% - ${n}px),calc(100% - ${n}px) 100%,0 100%,0 ${n}px)`;
  // the same rules for full motion (the setting, or the system when the setting follows it) and for reduced motion
  const full = css => `@media (prefers-reduced-motion:no-preference){${css.replace(/@@/g, ':root:not([data-motion])')}}\n${css.replace(/@@/g, ':root[data-motion=full]')}`;
  const reduced = css => `@media (prefers-reduced-motion:reduce){${css.replace(/@@/g, ':root:not([data-motion])')}}\n${css.replace(/@@/g, ':root[data-motion=reduced]')}`;
  const M = '@@[data-theme] #modal .sc-card';
  const STAT = ['str', 'spd', 'ins', 'sta', 'int', 'wil'].map(s => `${R} [data-st=${s}]{--chk:var(--st-${s}, #c9c4b4)}`).join('\n');

  SC.CSS = `
:root{--sc-scrim:rgba(5,7,15,.38);--sc-well:rgba(8,11,22,.62);--sc-slash:rgba(240,192,98,.13);--sc-slash-edge:rgba(240,192,98,.55);--sc-frame-top:rgba(240,192,98,.7);--sc-sticker:#0d1120}
:root[data-theme=light]{--sc-scrim:rgba(40,30,10,.16);--sc-well:rgba(242,237,226,.6);--sc-slash:rgba(127,81,0,.08);--sc-slash-edge:rgba(127,81,0,.55);--sc-frame-top:#8a5a10;--sc-sticker:#faf7f0}
.sc-vh{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

/* ---- the dock: over the story, in the centre column ---- */
${R}.sc-dock{display:block;padding:0;background:var(--sc-scrim);backdrop-filter:none}
${R}.sc-dock::before{content:"";position:fixed;left:var(--col-x,0);top:var(--col-y,0);width:var(--col-w,0);height:var(--col-h,0);border-radius:var(--r-m,10px);background:var(--sc-well);-webkit-backdrop-filter:blur(3px) saturate(.6);backdrop-filter:blur(3px) saturate(.6);pointer-events:none}
${R}.sc-dock > .mbox.sc-card{position:fixed;left:var(--sc-x);top:var(--sc-y);width:var(--sc-w);max-width:none;max-height:var(--sc-h);margin:0}
/* the first-run odds hint sits in the column above the card and pushes it down, instead of floating over the top
   bar's step controls (cycle 1 visual B2) */
${R}.sc-dock:not(.sc-free) > .hint-float{position:fixed;left:var(--sc-x);top:var(--sc-y);width:var(--sc-w);max-width:none;transform:none;margin:0;z-index:2;box-sizing:border-box;min-height:56px}
${R}.sc-dock:not(.sc-free):has(> .hint-float) > .mbox.sc-card{top:calc(var(--sc-y) + 66px);max-height:calc(var(--sc-h) - 66px)}
${R}.sc-dock:not(.sc-free):has(> .hint-float) > .mbox.sc-card > .sc-in{max-height:calc(var(--sc-h) - 68px)}
${R}.sc-dock.sc-free > .hint-float{position:relative;top:auto;left:auto;transform:none;margin:0 0 8px}
${R}.sc-dock.sc-free:has(> .hint-float){flex-direction:column;align-items:center}
${R}.sc-dock.sc-free{display:flex;align-items:flex-start;justify-content:center;padding:32px 16px}
${R}.sc-dock.sc-free::before{display:none}
${R}.sc-dock.sc-free > .mbox.sc-card{position:relative;left:auto;top:auto;width:min(720px,100%);max-height:calc(100vh - 64px)}
${R}.sc-dock.sc-free > .mbox.sc-card > .sc-in{max-height:calc(100vh - 66px)}

/* ---- the card: a frame with the cut corner, its inside scrolls ---- */
${C}{animation:none;display:flex;flex-direction:column;padding:1px;background:transparent;border:0;border-radius:0 var(--r-l,14px) 0 var(--r-l,14px);box-shadow:var(--e-3);overflow:visible;isolation:isolate}
${C}::before{content:"";position:absolute;inset:0;z-index:0;border-radius:inherit;clip-path:${cut(12)};
  background:linear-gradient(180deg,var(--sc-frame-top),var(--line-strong) 38%,var(--line-strong))}
${C} > .sc-in{position:relative;z-index:1;flex:1 1 auto;min-height:0;max-height:calc(var(--sc-h, 100vh) - 2px);overflow:auto;overscroll-behavior:contain;
  background:var(--surface);border-radius:0 calc(var(--r-l,14px) - 1px) 0 calc(var(--r-l,14px) - 1px);clip-path:${cut(11.4)};scrollbar-width:thin;scrollbar-color:var(--line-strong) transparent}
${C} > .mreport{position:absolute}

/* the vignette, full bleed */
${C} .sc-vig{position:relative;line-height:0}
${C} .sc-vig > .woodcut-wrap{margin:0}
${C} .sc-vig svg.woodcut{width:100%;height:auto;max-height:none;border-radius:0;box-shadow:none;aspect-ratio:16/5}
${C} .sc-vig .sky-cart{z-index:2}

/* the bust over the picture's edge, then the title */
${C} .sc-head{position:relative;z-index:2;display:flex;align-items:flex-end;gap:14px;padding:14px 18px 0}
${C}.sc-has-vig.sc-has-bust .sc-head{margin-top:-30px}
${C} .sc-bust{flex:none;width:84px;height:84px;line-height:0;
  filter:drop-shadow(2px 0 0 var(--sc-sticker)) drop-shadow(-2px 0 0 var(--sc-sticker)) drop-shadow(0 2px 0 var(--sc-sticker)) drop-shadow(0 -2px 0 var(--sc-sticker)) drop-shadow(0 8px 12px rgba(4,6,14,.5))}
${C} .sc-bust svg{width:100%;height:100%;display:block}
${C} .sc-ttl{flex:1 1 auto;min-width:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;padding-bottom:4px}
${C} .sc-ttl h2{margin:0;flex:1 1 auto;min-width:0;font-family:var(--f-name,Cinzel,Georgia,serif);font-size:var(--t-h2,22px);line-height:1.22;font-weight:700;color:var(--accent-strong,var(--accent));letter-spacing:.01em;overflow-wrap:anywhere;text-wrap:balance}
${C} .sc-tier{flex:none;display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:var(--r-pill,999px);border:1.5px solid var(--r-rare);color:var(--r-rare);font-family:var(--f-ui);font-size:var(--t-cap,12px);font-weight:700;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
:root[data-theme=dark] #modal .sc-card .sc-tier{box-shadow:0 0 14px color-mix(in srgb,var(--r-rare) 30%,transparent)}
${C} .sc-tier.sc-tier-legendary{border-color:var(--r-legendary);color:var(--r-legendary)}
${C} .sc-tier.sc-tier-mythic{border-color:var(--r-mythic);color:var(--r-mythic)}
:root[data-theme=dark] #modal .sc-card .sc-tier.sc-tier-legendary{box-shadow:0 0 14px color-mix(in srgb,var(--r-legendary) 30%,transparent)}
:root[data-theme=dark] #modal .sc-card .sc-tier.sc-tier-mythic{box-shadow:0 0 14px color-mix(in srgb,var(--r-mythic) 30%,transparent)}

/* the text: Literata, 68ch; the asides quieter */
${C} .sc-body{padding:8px 18px 2px}
${C} .sc-body > .mtext{margin:0 0 8px;font-family:var(--f-prose,Georgia,serif);font-size:var(--t-prose,15px);line-height:var(--lh-prose,1.53);color:var(--ink);max-width:68ch}
${R} .mbox.sc-card .sc-body > .mtext:first-letter{font-size:2.35em;line-height:.88;padding:3px 7px 0 0;color:var(--accent)}
${C} .sc-body .bd-past, ${C} .sc-body .wc-recall{font-family:var(--f-prose,Georgia,serif);font-style:italic;font-size:var(--t-small,13px);line-height:1.45;color:var(--ink-3);margin:0 0 6px;max-width:68ch}
${C} .sc-body details.more{margin:0 0 8px}
${C} .sc-body details.more > summary{font-size:var(--t-small);color:var(--accent);cursor:pointer;min-height:24px;display:inline-flex;align-items:center}
${C} .sc-body .scales{margin:4px 0 8px;gap:6px}
${C} .sc-body .scales .card{background:var(--raised);border:1px solid var(--line);border-radius:var(--r-m);padding:8px 10px}

/* ---- the choices: rows on --raised, the number key, the label, the tags on the right ---- */
${C} .choices{display:flex;flex-direction:column;gap:6px;padding:8px 18px 18px;margin:0}
${C} .choices > button.sc-ch{position:relative;display:grid;grid-template-columns:24px minmax(0,1fr) auto;column-gap:12px;align-items:center;min-height:46px;margin:0;padding:8px 10px 8px 10px;
  text-align:left;background:var(--raised);border:1px solid var(--line);border-radius:var(--r-m,10px);box-shadow:var(--e-1);overflow:hidden;isolation:isolate;
  font-family:var(--f-ui);font-size:var(--t-ui,14px);line-height:var(--lh-ui,1.43);font-weight:600;color:var(--ink);transition:border-color var(--m-quick,140ms) var(--ease-std,ease),background-color var(--m-quick,140ms) var(--ease-std,ease)}
${C} .choices > button.sc-ch.sc-plain{grid-template-columns:24px minmax(0,1fr)}
/* the key: a slanted tag (the one angle on the row; the label stays level) */
${C} .choices > button.sc-ch::before{position:static;transform:none;grid-column:1;grid-row:1;width:26px;height:24px;margin-left:-2px;display:grid;place-items:center;border:0;border-radius:0;
  clip-path:polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%);background:var(--sunken);color:var(--ink-2);font-family:var(--f-ui);font-size:var(--t-small,13px);font-weight:700;font-variant-numeric:tabular-nums;
  transition:background-color var(--m-quick,140ms),color var(--m-quick,140ms)}
${C} .choices > button.sc-ch::after{content:"";position:absolute;z-index:-1;top:-4px;bottom:-4px;left:-30px;width:72%;pointer-events:none;opacity:0;
  background:linear-gradient(90deg,var(--sc-slash) 0,var(--sc-slash) 55%,transparent 100%);transform:skewX(-8deg)}
${C} .choices > button.sc-ch:hover:not(:disabled), ${C} .choices > button.sc-ch:focus-visible{background:var(--raised-hover,var(--raised));border-color:var(--accent);color:var(--ink)}
${C} .choices > button.sc-ch:hover:not(:disabled)::after, ${C} .choices > button.sc-ch:focus-visible::after{opacity:1}
${C} .choices > button.sc-ch:hover:not(:disabled)::before, ${C} .choices > button.sc-ch:focus-visible::before{background:var(--accent-fill);border-color:var(--accent-fill-line,var(--accent-fill));color:var(--on-accent)}
${C} .choices > button.sc-ch:active:not(:disabled){background:var(--sunken)}
${C} .choices > button.sc-ch > .grow{grid-column:2;min-width:0;display:block;overflow-wrap:anywhere}
${C} .choices > button.sc-ch .lf-stake, ${C} .choices > button.sc-ch .fl-measure{display:block;margin-top:2px;font-family:var(--f-ui);font-size:var(--t-small,13px);line-height:1.35;font-weight:400;color:var(--ink-3);opacity:1}
${C} .choices > button.sc-ch.sc-once{box-shadow:inset 3px 0 0 var(--danger),var(--e-1)}
${C} .choices > button.sc-ch > .sc-tags{grid-column:3;grid-row:1;display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:6px;max-width:300px}

/* the check chip: the stat's colour and icon, your value */
${STAT}
${C} .sc-chk{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 7px 0 5px;border-radius:var(--r-xs,3px);white-space:nowrap;
  color:var(--chk);background:color-mix(in srgb,var(--chk) 13%,var(--raised));border:1px solid color-mix(in srgb,var(--chk) 42%,transparent);
  font-family:var(--f-ui);font-size:var(--t-cap,12px);line-height:1;font-weight:700;letter-spacing:.03em}
${C} .sc-chk svg{width:14px;height:14px;flex:none}
${C} .sc-chk-v{font-size:var(--t-small,13px);font-variant-numeric:tabular-nums;letter-spacing:0}
${C} .sc-chk-2{font-weight:600;opacity:.85;letter-spacing:.03em}

/* the odds badge: the number, the band word, four pips, on the band's tint (brief §1.4) */
${C} .sc-b-likely{--bc:var(--odds-likely)} ${C} .sc-b-even{--bc:var(--odds-even)} ${C} .sc-b-risky{--bc:var(--odds-risky)} ${C} .sc-b-long{--bc:var(--odds-long)}
${C} .choices button .risk.sc-odds{display:inline-flex;align-items:center;gap:6px;height:22px;margin:0;padding:0 8px;border-radius:var(--r-xs,3px);white-space:nowrap;text-align:left;
  color:var(--bc,var(--ink-2));background:color-mix(in srgb,var(--bc,var(--ink-3)) var(--odds-tint,14%),var(--raised));border:0;border-bottom:0;
  font-family:var(--f-ui);font-size:var(--t-num,14px);line-height:1;font-weight:700;font-variant-numeric:tabular-nums}
${C} .risk.sc-odds .sc-sep{display:none}
${C} .risk.sc-odds .sc-w{font-size:var(--t-cap,12px);letter-spacing:.06em;text-transform:uppercase}
${C} .risk.sc-odds .sc-pips{flex:none;width:30px;height:7px;--n:0;
  background:linear-gradient(90deg,currentColor calc(var(--n) * 25%),color-mix(in srgb,currentColor 26%,transparent) 0);
  -webkit-mask:radial-gradient(circle at 3.5px 3.5px,#000 2.7px,transparent 3.2px) 0 0 / 7.67px 7px repeat-x;mask:radial-gradient(circle at 3.5px 3.5px,#000 2.7px,transparent 3.2px) 0 0 / 7.67px 7px repeat-x}
${C} .risk.sc-odds .sc-pips[data-n="1"]{--n:1} ${C} .risk.sc-odds .sc-pips[data-n="2"]{--n:2} ${C} .risk.sc-odds .sc-pips[data-n="3"]{--n:3} ${C} .risk.sc-odds .sc-pips[data-n="4"]{--n:4}
${C} .risk.sc-odds[data-tt-tap]{cursor:help}
${C} .risk.sc-odds.tt-on{box-shadow:0 0 0 1.5px var(--bc,var(--accent))}
${C} .sc-hint{font-family:var(--f-ui);font-size:var(--t-small,13px);font-weight:600;white-space:nowrap}
${C} .sc-hint.sc-up{color:var(--ok)} ${C} .sc-hint.sc-down{color:var(--danger)}
${C} .sc-oncew{display:inline-flex;align-items:center;height:22px;padding:0 7px;border-radius:var(--r-xs,3px);border:1px solid var(--danger);color:var(--danger);font-family:var(--f-ui);font-size:var(--t-cap,12px);font-weight:700;letter-spacing:.08em;text-transform:uppercase}

/* ---- the result, in place ---- */
${C} .sc-result{display:flex;flex-direction:column;gap:10px;padding:6px 18px 18px}
${C}[data-sc=result] .sc-body > .mtext{color:var(--ink-2)}
${C} .sc-chose{display:flex;align-items:center;gap:10px;min-height:40px;padding:6px 10px;border-radius:var(--r-m,10px);background:var(--sunken);border:1px solid var(--line);
  font-family:var(--f-ui);font-size:var(--t-ui,14px);font-weight:600;color:var(--ink-2)}
${C} .sc-chose .sc-key{flex:none;width:26px;height:24px;display:grid;place-items:center;clip-path:polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%);background:var(--accent-fill);color:var(--on-accent);font-size:var(--t-small,13px);font-weight:700}
${C} .sc-chose-t{flex:1 1 auto;min-width:0}
/* the verdict: a stamp in the impact face, slanted, that lands with the result */
${C} .sc-verdict{flex:none;display:inline-flex;align-items:baseline;gap:7px;height:26px;padding:0 12px 0 10px;transform:skewX(-8deg);transform-origin:50% 50%;
  font-family:var(--f-impact,"Dela Gothic One",sans-serif);font-size:var(--t-small,13px);font-weight:400;line-height:26px;letter-spacing:.06em;text-transform:uppercase}
${C} .sc-verdict.sc-ok{color:var(--ok);background:var(--ok-tint);box-shadow:inset 0 -2px 0 var(--ok)} ${C} .sc-verdict.sc-fail{color:var(--danger);background:var(--danger-tint);box-shadow:inset 0 -2px 0 var(--danger)}
${C} .sc-verdict-n{font-family:var(--f-ui);letter-spacing:0;text-transform:none;font-weight:600;font-size:var(--t-small,13px)}
${C} .sc-result > .result{margin:0;padding:12px 16px;border:0;border-left:3px solid var(--accent);border-radius:var(--r-s,6px);
  background:linear-gradient(90deg,var(--accent-tint),transparent 75%),var(--raised);font-family:var(--f-prose,Georgia,serif);font-size:var(--t-prose,15px);line-height:var(--lh-prose,1.53);color:var(--ink);white-space:pre-line}
${C} .sc-result > .result.good{border-left-color:var(--ok);background:linear-gradient(90deg,var(--ok-tint),transparent 75%),var(--raised)}
${C} .sc-result > .result.bad{border-left-color:var(--danger);background:linear-gradient(90deg,var(--danger-tint),transparent 75%),var(--raised)}
${C} .sc-deltas{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
${C} .sc-d{display:inline-flex;align-items:center;gap:5px;min-height:26px;padding:2px 11px 2px 9px;border-radius:var(--r-pill,999px);font-family:var(--f-ui);font-size:var(--t-small,13px);font-weight:700;line-height:1.2;border:1px solid}
${C} .sc-d.sc-up{color:var(--ok);background:var(--ok-tint);border-color:color-mix(in srgb,var(--ok) 38%,transparent)}
${C} .sc-d.sc-down{color:var(--danger);background:var(--danger-tint);border-color:color-mix(in srgb,var(--danger) 38%,transparent)}
${C} .sc-d svg{width:15px;height:15px;flex:none}
${C} .sc-d.sc-d-st svg{color:var(--chk)}
${C} .sc-dv{font-variant-numeric:tabular-nums;white-space:nowrap}
${C} .sc-dl{font-weight:600;color:var(--ink)}
${C} .sc-foot{display:flex;justify-content:flex-end;align-items:center;gap:12px}
${C} .sc-foot .sc-cont{min-width:168px;min-height:40px;gap:10px}
${C} .sc-kbd{display:inline-flex;align-items:center;height:18px;padding:0 6px;border-radius:var(--r-xs,3px);border:1px solid color-mix(in srgb,var(--on-accent) 40%,transparent);font-family:var(--f-ui);font-size:${T(11)};font-weight:700;letter-spacing:.04em;opacity:.75}
@media (pointer:coarse){${C} .sc-kbd{display:none}}

/* ---- 761-1099: the same dock, a narrower column ---- */
@media (min-width:761px) and (max-width:1099px){
  ${C} .choices > button.sc-ch{grid-template-columns:24px minmax(0,1fr);row-gap:6px}
  ${C} .choices > button.sc-ch > .sc-tags{grid-column:2;grid-row:2;justify-content:flex-start;max-width:none}
}
@media (min-width:1600px){
  ${C} .sc-bust{width:96px;height:96px}
  ${C}.sc-has-vig.sc-has-bust .sc-head{margin-top:-34px}
  ${C} .choices > button.sc-ch{min-height:48px}
}

/* ---- the phone: a full-screen sheet with its own scroll, choices of 52 px (brief §4.4) ---- */
${R}.sc-sheet > .mbox.sc-card{padding:0;overflow:hidden;display:flex;flex-direction:column;border-radius:var(--r-l,14px) var(--r-l,14px) 0 0;box-shadow:var(--e-3)}
${R}.sc-sheet > .mbox.sc-card::before{display:none}
${R}.sc-sheet > .mbox.sc-card > .sc-in{display:flex;flex-direction:column;max-height:none;clip-path:none;border-radius:inherit;overflow-y:auto;padding-bottom:env(safe-area-inset-bottom,0px)}
${R}.sc-sheet > .mbox.sc-card > .sc-in > *{flex:none}
/* the picture is a band of 16:6 at most (146 px at 390 wide, brief §4.4's 390 x 140), never the height the words
   leave: it once grew to 390 x 371 and pushed the page to 1,200 px (cycle 1 visual B9). The print is sliced, so it
   crops at the sides rather than stretching, and the choices follow the text instead of sinking to the bottom. */
${R}.sc-sheet > .mbox.sc-card > .sc-in > .sc-vig{flex:none;height:min(calc(100vw * 6 / 16), 160px);min-height:0;max-height:160px;overflow:hidden}
${R}.sc-sheet .sc-card .sc-vig > .woodcut-wrap{height:100%}
${R}.sc-sheet .sc-card .sc-vig svg.woodcut{aspect-ratio:auto;width:100%;height:100%;min-height:0;max-height:none}
${R}.sc-sheet .sc-card .sc-head{padding:12px 14px 0;gap:12px}
${R}.sc-sheet .sc-card.sc-has-vig.sc-has-bust .sc-head{margin-top:-24px}
${R}.sc-sheet .sc-card .sc-bust{width:68px;height:68px}
${R}.sc-sheet .sc-card .sc-ttl h2{font-size:${T(21)}}
${R}.sc-sheet .sc-card .sc-body{padding:8px 14px 0}
${R}.sc-sheet .sc-card .sc-body > .mtext{font-size:var(--t-prose,16px);line-height:var(--lh-prose,1.56);margin-top:0}
${R}.sc-sheet .sc-card .choices{margin-top:0;padding:10px 12px 14px;gap:8px}
${R}.sc-sheet .sc-card .choices > button.sc-ch{grid-template-columns:28px minmax(0,1fr);row-gap:6px;min-height:52px;padding:10px 12px}
${R}.sc-sheet .sc-card .choices > button.sc-ch::before{width:28px;height:28px}
${R}.sc-sheet .sc-card .choices > button.sc-ch > .sc-tags{grid-column:2;grid-row:2;justify-content:flex-start;max-width:none}
${R}.sc-sheet .sc-card .choices button .risk.sc-odds{display:inline-flex;margin:0;height:26px}
${R}.sc-sheet .sc-card .sc-chk, ${R}.sc-sheet .sc-card .sc-oncew{height:26px}
${R}.sc-sheet .sc-card .sc-chk-2{display:none}
${R}.sc-sheet .sc-card .choices > button.sc-ch > .sc-tags{gap:4px}
${R}.sc-sheet .sc-card .choices button .risk.sc-odds{gap:4px;padding:0 6px}
${R}.sc-sheet .sc-card .sc-chk{padding:0 6px 0 4px;gap:3px}
${R}.sc-sheet .sc-card .risk.sc-odds .sc-w{letter-spacing:.03em}
${R}.sc-sheet .sc-card .risk.sc-odds .sc-pips{width:26px;-webkit-mask-size:6.67px 7px;mask-size:6.67px 7px}
${R}.sc-sheet .sc-card .sc-result{margin-top:0;padding:8px 12px 14px}
${R}.sc-sheet .sc-card .sc-foot .sc-cont{flex:1 1 auto;min-height:52px}
${R}.sc-sheet .sc-card .sc-d{min-height:30px}
${R}.sc-sheet .sc-card .sc-head > .mreport{position:static;flex:none;align-self:flex-start;margin:4px 0 0 auto;width:44px;height:44px;opacity:.6}
/* the first-run hint ("Each choice shows your odds") floats over the print instead of pushing the sheet 90 px down,
   which made a short event scroll on a 375 x 667 phone; the tags' row is a little tighter for the same reason */
${R}.sc-sheet > .hint-float{position:absolute;z-index:6;top:calc(8px + env(safe-area-inset-top,0px));left:8px;right:8px;margin:0;order:0}
${R}.sc-sheet .sc-card .choices > button.sc-ch{row-gap:4px;padding-top:9px;padding-bottom:9px}
${R}.sc-sheet .sc-card .choices button .risk.sc-odds, ${R}.sc-sheet .sc-card .sc-chk, ${R}.sc-sheet .sc-card .sc-oncew{height:24px}
/* a short phone (an iPhone SE, 667 px): a smaller bust and tighter gaps, so a three-choice scene fits one sheet */
@media (max-height:700px){
  ${R}.sc-sheet > .mbox.sc-card > .sc-in > .sc-vig{height:min(calc(100vw * 5 / 16), 140px)}
  ${R}.sc-sheet .sc-card .sc-bust{width:60px;height:60px}
  ${R}.sc-sheet .sc-card.sc-has-vig.sc-has-bust .sc-head{margin-top:-20px}
  ${R}.sc-sheet .sc-card .sc-head{padding-top:10px}
  ${R}.sc-sheet .sc-card .sc-body{padding-top:6px}
  ${R}.sc-sheet .sc-card .choices{padding:8px 12px 10px;gap:6px}
  ${R}.sc-sheet .sc-card .choices > button.sc-ch{padding-top:8px;padding-bottom:8px}
}

/* ---- motion ---- */
@keyframes scRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes scSlide{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}
@keyframes scBust{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
@keyframes scPop{0%{opacity:0;transform:scale(.7)}100%{opacity:1;transform:none}}
@keyframes scFade{from{opacity:0}to{opacity:1}}
@keyframes scStamp{0%{opacity:0;transform:skewX(-8deg) scale(1.6) rotate(-6deg)}60%{opacity:1;transform:skewX(-8deg) scale(.94) rotate(0)}100%{opacity:1;transform:skewX(-8deg)}}
@keyframes scSettle{from{transform:scale(1.035)}to{transform:none}}
${full(`
${M}.sc-enter{animation:scRise var(--m-enter,280ms) var(--ease-enter,ease-out) both!important}
${M}.sc-enter .sc-vig svg.woodcut{animation:scSettle 900ms var(--ease-enter,ease-out) both!important}
${M}.sc-enter .sc-bust{animation:scBust 320ms var(--ease-enter,ease-out) 90ms both!important}
${M}.sc-enter .choices > button{animation:scSlide 240ms var(--ease-enter,ease-out) both!important}
${M}.sc-enter .choices > button:nth-child(1){animation-delay:120ms!important} ${M}.sc-enter .choices > button:nth-child(2){animation-delay:160ms!important}
${M}.sc-enter .choices > button:nth-child(3){animation-delay:200ms!important} ${M}.sc-enter .choices > button:nth-child(4){animation-delay:240ms!important}
${M}.sc-enter .choices > button:nth-child(5){animation-delay:280ms!important} ${M}.sc-enter .choices > button:nth-child(n+6){animation-delay:320ms!important}
${M} .choices > button.sc-ch::after{transform:skewX(-8deg) translateX(-28%);transition:opacity var(--m-quick,140ms) var(--ease-std,ease),transform 160ms var(--ease-std,ease)!important}
${M} .choices > button.sc-ch:hover:not(:disabled)::after, ${M} .choices > button.sc-ch:focus-visible::after{transform:skewX(-8deg) translateX(0)}
${M}.sc-land .sc-result{animation:scRise var(--m-enter,280ms) var(--ease-enter,ease-out) both!important}
${M}.sc-land .sc-d{animation:scPop var(--m-snap,240ms) var(--ease-snap,ease-out) both!important}
${M}.sc-land .sc-verdict{animation:scStamp 300ms var(--ease-snap,ease-out) 60ms both!important}
${M}.sc-land .sc-d:nth-child(1){animation-delay:160ms!important} ${M}.sc-land .sc-d:nth-child(2){animation-delay:200ms!important} ${M}.sc-land .sc-d:nth-child(3){animation-delay:240ms!important}
${M}.sc-land .sc-d:nth-child(4){animation-delay:280ms!important} ${M}.sc-land .sc-d:nth-child(5){animation-delay:320ms!important} ${M}.sc-land .sc-d:nth-child(n+6){animation-delay:360ms!important}
`)}
${reduced(`
${M}.sc-enter, ${M}.sc-land .sc-result{animation:scFade 120ms linear both}
${M}.sc-enter .choices > button, ${M}.sc-enter .sc-bust, ${M}.sc-enter .sc-vig svg.woodcut, ${M}.sc-land .sc-d, ${M}.sc-land .sc-verdict{animation:none}
${M} .choices > button.sc-ch::after{display:none}
`)}
:root[data-motion=off] #modal .sc-card, :root[data-motion=off] #modal .sc-card *{animation:none!important;transition:none!important}
:root[data-motion=off] #modal .sc-card .choices > button.sc-ch::after{display:none}
`;
  SC.install = function () {
    if (typeof document === 'undefined' || !document.head || document.getElementById('sc-style')) return;
    const st = document.createElement('style'); st.id = 'sc-style'; st.textContent = SC.CSS; document.head.appendChild(st);
  };
  if (typeof document !== 'undefined') { if (document.head) SC.install(); else document.addEventListener('DOMContentLoaded', SC.install); }
})();
