// The top bar keeps the place and the purse in sight at every desktop width. The release's desktop rule
// (@media (min-width: 761px) { #topbar { flex-wrap: nowrap } }) never lets the bar wrap, so when the clock's controls
// take the room, the place and the purse are squeezed instead: at 1024 px they shrank to 14 px and vanished, and at
// 1180 and 1280 the debt was cut mid-word ("(debt 30 su"). Below 1440 px the bar may now wrap; the place and purse ask
// for at least 260 px, so they move to a second line rather than disappear, and the purse never shrinks (a long town
// name takes the ellipsis instead).
(function () {
  const css = '@media (min-width:761px){#topbar .top-info .top-coin,#topbar .top-info>span:last-child{flex-shrink:0;overflow:visible}}' +
    '@media (min-width:761px) and (max-width:1439px){#topbar{flex-wrap:wrap}#topbar .top-info{flex:1 0 260px;min-width:260px}}';
  const put = () => { if (typeof document === 'undefined' || document.getElementById('tb-style')) return; const s = document.createElement('style'); s.id = 'tb-style'; s.textContent = css; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
