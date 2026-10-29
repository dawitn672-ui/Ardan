// 91-look, part 8 (cycle 2): the detail pass. Pure CSS, appended as <style id="lk-chrome">:
//   - panel chrome: each of the three columns gets the cut corner's echo, two gold brackets at its top left and
//     bottom right (light from the upper left), a faint grain, and a highlight falling from the lit corner;
//   - the Day theme's washi: long paper fibres in the panels as well as the ground;
//   - dark-mode glows: a tile, a choice row and a person row lift with a soft gold glow on hover; the chosen tab, the
//     rail's bust frame and the docked scene card carry a quiet halo; by day the glow is a 2 px edge instead (brief §3.3);
//   - typography: balanced headings, prose that avoids orphans, real small caps and old-style figures in the story,
//     kerning and ligatures on, tabular figures wherever a number can change.
// Static: nothing here moves or loops, and nothing reads the game.
(function () {
  if (typeof document === 'undefined') return;
  const svgUrl = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  // a fine grain by night (alpha noise), long fibres by day (stretched turbulence), both tiling
  const GRAIN = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="11" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 -.38"/></filter><rect width="220" height="220" filter="url(#n)" opacity=".05"/></svg>`);
  const FIBRE = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360"><filter id="f"><feTurbulence type="fractalNoise" baseFrequency=".008 .22" numOctaves="3" seed="5" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .36  0 0 0 0 .22  0 0 0 1.4 -.72"/></filter><rect width="360" height="360" filter="url(#f)" opacity=".16"/></svg>`);
  const P = ':root[data-theme] #game';
  const DK = ':root:not([data-theme=light]) #game', LT = ':root[data-theme=light] #game';
  const CSS = `
:root{--lk-grain:${GRAIN};--lk-fibre:${FIBRE};--lk-bracket:rgba(240,192,98,.55)}
:root[data-theme=light]{--lk-bracket:#8a5a10}
/* ---- panel chrome ---- */
@media (min-width:761px){
  ${P} > #logwrap.panel, ${P} > #side.panel{position:relative}
  ${P} > #profile.panel, ${P} > #logwrap.panel, ${P} > #side.panel{background-image:linear-gradient(135deg,rgba(255,255,255,.04),transparent 38%),var(--lk-grain);background-repeat:no-repeat,repeat}
  ${LT} > #profile.panel, ${LT} > #logwrap.panel, ${LT} > #side.panel{background-image:linear-gradient(135deg,rgba(255,255,255,.6),transparent 40%),var(--lk-fibre)}
  ${P} > #profile.panel::before, ${P} > #logwrap.panel::before, ${P} > #side.panel::before,
  ${P} > #profile.panel::after, ${P} > #logwrap.panel::after, ${P} > #side.panel::after{content:"";position:absolute;width:14px;height:14px;pointer-events:none;z-index:2;border:0 solid var(--lk-bracket)}
  ${P} > #profile.panel::before, ${P} > #logwrap.panel::before, ${P} > #side.panel::before{left:5px;top:5px;border-left-width:2px;border-top-width:2px}
  ${P} > #profile.panel::after, ${P} > #logwrap.panel::after, ${P} > #side.panel::after{right:5px;bottom:5px;border-right-width:2px;border-bottom-width:2px}
}
/* the ground of the top bar: one rule of gold under it, fading out to both sides */
${P} > #topbar.panel{background-image:linear-gradient(90deg,transparent,rgba(240,192,98,.28) 30%,rgba(240,192,98,.28) 70%,transparent);background-size:100% 1px;background-position:0 100%;background-repeat:no-repeat}
${LT} > #topbar.panel{background-image:linear-gradient(90deg,transparent,rgba(138,90,16,.35) 30%,rgba(138,90,16,.35) 70%,transparent)}
/* ---- dark-mode glows (by day a 2 px edge stands in) ---- */
${DK} .lk-acts > .act:hover:not(:disabled), ${DK} .lk-acts > .act:focus-visible{box-shadow:0 0 0 1px rgba(240,192,98,.45),0 0 14px rgba(240,192,98,.22)}
${DK} .card.person.click.lk-row:hover{box-shadow:inset 3px 0 0 var(--accent),0 0 12px rgba(240,192,98,.12)}
${DK} #tabs [role=tab][aria-selected=true]{text-shadow:0 0 12px rgba(240,192,98,.45)}
${DK} #profile .lk-bust{filter:drop-shadow(0 0 10px rgba(168,200,255,.18))}
${LT} .lk-acts > .act:hover:not(:disabled){box-shadow:inset 0 0 0 2px var(--accent)}
:root:not([data-theme=light]) #modal .sc-card{box-shadow:var(--e-3),0 0 0 1px rgba(240,192,98,.18),0 0 40px rgba(240,192,98,.07)}
/* ---- typography ---- */
${P} h1, ${P} h2, ${P} h3, #modal h2, #modal h3, #modal .sc-title, #title .blurb{text-wrap:balance}
${P} #log p, ${P} #log .entry, #modal .sc-card .sc-text, #modal .sc-card .result, .il-vellum p{text-wrap:pretty;font-kerning:normal;font-variant-ligatures:common-ligatures;hanging-punctuation:first}
${P} #log .entry .yr, ${P} #log .date, ${P} #log time{font-variant-numeric:oldstyle-nums proportional-nums}
${P} .tag, ${P} .group-h, ${P} .fold-h, ${P} #tabs [role=tab] .tl{font-kerning:normal;font-feature-settings:"kern" 1,"case" 1}
${P} .val, ${P} .top-coin b, ${P} .clk-date b, ${P} .cost, #modal .risk, #modal .sc-odds{font-variant-numeric:tabular-nums lining-nums}
${P} .lk-name, ${P} .fold-pid-t .name, #modal .sc-head h2{letter-spacing:.015em}
`;
  const put = () => { if (document.getElementById('lk-chrome')) return; const s = document.createElement('style'); s.id = 'lk-chrome'; s.textContent = CSS; document.head.appendChild(s); };
  if (document.head) put(); else document.addEventListener('DOMContentLoaded', put);
})();
// cycle 2 (visual I10): at 1920 the docked event card left a 350 px well of nothing under it. The well over the story is
// lighter on a tall window, so the last lines of the log show, faded, under the card
(function () {
  if (typeof document === 'undefined') return;
  const css = '@media (min-width:1600px) and (min-height:900px){:root[data-theme] #modal.sc-dock::before{background:rgba(8,11,22,.42);-webkit-backdrop-filter:blur(1.5px) saturate(.6);backdrop-filter:blur(1.5px) saturate(.6)}' +
    ':root[data-theme=light] #modal.sc-dock::before{background:rgba(242,237,226,.5)}}';
  const put = () => { if (document.getElementById('lk-well')) return; const s = document.createElement('style'); s.id = 'lk-well'; s.textContent = css; document.head.appendChild(s); };
  if (document.head) put(); else document.addEventListener('DOMContentLoaded', put);
})();
// cycle 2 (visual B13): the clock's first hint hung over the story's Story / Map toggle; on desktop it now hangs to the
// right of it, still under the step buttons it explains
(function () {
  if (typeof document === 'undefined') return;
  const css = '@media (min-width:1100px){:root[data-theme] #topbar #clk .clk-step > .hint-pop{transform:translateX(118px)}}';
  const put = () => { if (document.getElementById('lk-hintpos')) return; const s = document.createElement('style'); s.id = 'lk-hintpos'; s.textContent = css; document.head.appendChild(s); };
  if (document.head) put(); else document.addEventListener('DOMContentLoaded', put);
})();
