// The top bar keeps the place and the purse in sight at every desktop width. The release's desktop rule
// (@media (min-width: 761px) { #topbar { flex-wrap: nowrap } }) never lets the bar wrap, so when the clock's controls
// take the room, the place and the purse are squeezed instead: at 1024 px they shrank to 14 px and vanished, and at
// 1180 and 1280 the debt was cut mid-word ("(debt 30 su"). The place, the purse, Save and Menu now sit in one group
// (.top-right, patches.mjs) that wraps to a second line as a whole, never one button alone; the purse never shrinks
// (a long town name takes the ellipsis); and below 1440 px Save and Menu show only their icons (each keeps its
// aria-label). On a phone the group dissolves (display: contents), so 71-phone's layout is exactly as it was.
(function () {
  const css = [
    '#topbar .top-right{display:flex;align-items:center;gap:var(--s-2);flex:1 0 auto;justify-content:flex-end;min-width:0}',
    '@media (min-width:761px){#topbar .top-info .top-coin,#topbar .top-info>span:last-child{flex-shrink:0;overflow:visible}}',
    '@media (min-width:761px) and (max-width:1439px){#topbar{flex-wrap:wrap}#topbar .top-right{flex:1 0 360px}#topbar .top-right>button .bt{display:none}}',
    '#game.phone #topbar .top-right{display:contents}',
    '#game.phone #topbar .top-right>button{min-width:44px;min-height:44px;padding:0 8px}',
  ].join('');
  const put = () => { if (typeof document === 'undefined' || document.getElementById('tb-style')) return; const s = document.createElement('style'); s.id = 'tb-style'; s.textContent = css; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
