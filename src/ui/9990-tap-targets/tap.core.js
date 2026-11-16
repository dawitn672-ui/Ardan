// Tap targets of at least 44 x 44 points (I1-2, order 62 build rule "Input", docs/IOS_ROADMAP.md §7.2).
// docs/research/ios/tap-probe.mjs found 58 of 382 controls under 44 points at 375 x 667: description words (.tt, .tt-n,
// b[data-tt]), chips, stat rows (.v2-row, .pf-stat). They are short, not narrow, so the fix is a taller hit area and never
// bigger type:
//   - a word that opens a description: a 44-point tall inline box whose margins cancel the extra height, so the line does not
//     move; the underline is drawn as text-decoration (not a bottom border, which would drop 10 points below the word);
//   - a chip: a transparent ::after hit box 44 points tall centred on it, so the pill keeps its look;
//   - a stat row: a minimum height of 44 points (a few points taller, in a list).
// A description glyph inside a button is left alone: the button is the target (and the glyph takes no touch there, 71-phone).
// Not touched here: the skills rows (.prow, .pf-sk: S1b's new skills page owns them) and the map canvases (D9).
// Scoped to a touch screen or a phone-width window; a mouse on a wide window is unchanged. Rules sit after 59-descriptions
// and 71-phone, so they win at equal specificity.
// The page's panels are #game and #modal: an id in front puts these rules above 59-descriptions' and 71-phone's, whose
// stylesheets are added later or carry an id of their own.
const IN = (list, tail = '') => ['#game', '#modal'].map(r => list.map(x => `${r} ${x}${tail}`).join(',')).join(',');
const WORD = ['span.tt', 'b.tt', '.tt-n', 'b[data-tt]', 'span[data-tt]:not(.chip)'];
const CHIP = ['.chip[data-tt]', '.chip[data-tip]', '.chip.tipt'];
const TAP_CSS = `
@media (pointer:coarse), (max-width:760px){
  ${IN(WORD, ':not(.tt-pop *):not(button *)')}{
    display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;margin-top:-10px;margin-bottom:-10px;
    border-bottom:0;text-decoration:underline dotted var(--accent-line);text-underline-offset:3px}
  ${IN(CHIP)}{position:relative}
  ${IN(CHIP, '::after')}{content:"";position:absolute;left:0;right:0;top:calc(50% - 22px);height:44px}
  ${IN(['div.v2-row.tt', '.pf div[data-tt].pf-row.tt'])}{min-height:44px;align-content:center;align-items:center}
}`;
{
  const put = () => {
    if (typeof document === 'undefined' || document.getElementById('tap-css')) return;
    const s = document.createElement('style'); s.id = 'tap-css'; s.textContent = TAP_CSS; document.head.appendChild(s);
  };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
}
