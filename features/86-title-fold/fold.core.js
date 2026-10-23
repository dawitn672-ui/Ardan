// The title screen's "Begin a new life" sits in sight on a laptop. The map strip is drawn 579 px tall whatever the
// window, so on 1280x800, 1366x768 and 1440x900 (the commonest laptop screens) the buttons began at 891 px, below the
// bottom edge: a new player saw a map and a paragraph and had to know to scroll. The strip now takes the height the
// window can spare (the window less about 430 px for the title, the lines under the map and both rows of buttons),
// never more than its own 579 or less than 220. Only its height is set, so the canvas keeps its shape and simply draws
// smaller.
(function () {
  // desktop only: on a phone the strip is already as narrow as the screen and short enough
  const css = '@media (min-width:761px){#title canvas.mapstrip{height:clamp(220px,calc(100vh - 430px),579px);width:auto;max-width:100%}}';
  const put = () => { if (typeof document === 'undefined' || document.getElementById('tf-style')) return; const s = document.createElement('style'); s.id = 'tf-style'; s.textContent = css; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
