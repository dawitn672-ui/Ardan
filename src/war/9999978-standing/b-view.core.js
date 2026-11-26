// The standing military in words (D-194, order 95): round figures, never a percentage, and only as well as the player
// may know them (v2 diplomacy's A.V2DIP.seen: exact for the realm's own ruler, an estimate for its nobles and officers and
// any ruler abroad, hearsay for the rest). Pure: reads only.
//   A.MIL.round(n)       a round figure: 216,000; 40,000; 3,000; 600; 40
//   A.MIL.words(r)       "about 216,000 men under arms, some 3,000 knights" (or "said to keep ..." by hearsay)
//   A.MIL.eliteNote(r)   the realm's best ten as a click-to-open note: name, what he is, level and its band's words
//   A.MIL.cardHtml(r)    the realm card's line (the release's UI.realmCard calls it)
(function () {
  const MIL = A.MIL; if (!MIL) return;
  const fmt = n => (A.fmt ? A.fmt(n) : String(n));
  const esc = s => (UI && UI.esc ? UI.esc(s) : String(s));
  MIL.round = function (n) {
    n = Math.max(0, +n || 0);
    const step = n >= 100000 ? 10000 : n >= 10000 ? 1000 : n >= 1000 ? 100 : n >= 200 ? 50 : 10;
    return Math.max(n > 0 ? step : 0, Math.round(n / step) * step);
  };
  // one significant figure, for what is only heard
  const coarse = n => { n = Math.max(0, +n || 0); if (n < 10) return n; const p = Math.pow(10, Math.floor(Math.log10(n))); return Math.round(n / p) * p; };
  const seen = r => (A.V2DIP && A.V2DIP.seen ? A.V2DIP.seen(r.id) : 'estimate');
  MIL.words = function (r, how) {
    r = typeof r === 'string' ? A.realm(r) : r; if (!r) return '';
    how = how || seen(r);
    const men = r.army || 0, kn = MIL.kn(r), k = kn ? kn.t : MIL.knights(r);
    const kw = k === 1 ? 'knight' : 'knights';
    if (how === 'hearsay') return `said to keep some ${fmt(coarse(men))} men under arms and ${k >= 1000 ? 'a few thousand' : k >= 200 ? 'some hundreds of' : 'a few score'} ${kw}`;
    return `${how === 'exact' ? '' : 'about '}${fmt(MIL.round(men))} men under arms, some ${fmt(MIL.round(k))} ${kw}`;
  };
  const band = L => (A.POWER && A.POWER.band ? A.POWER.band(L).w : '');
  MIL.eliteNote = function (r) {
    r = typeof r === 'string' ? A.realm(r) : r; if (!r) return '';
    const E = MIL.elite(r), lv = MIL.levels(r);
    if (!E.length) return '';
    const how = seen(r);
    const head = `The best of ${r.short || r.name}: about ${E.length} fighters the realm knows by name. Its soldiers stand near level ${lv.soldier} (${band(lv.soldier)}), its knights near ${lv.knight} (${band(lv.knight)}), a few of them more than ordinary knights.`;
    // by hearsay only the names that travel (the best three)
    const list = (how === 'hearsay' ? E.slice(0, 3) : E).map(x => `${x.name}${x.role ? ', ' + x.role : ''}: level ${x.level}, ${band(x.level)}`);
    return head + ' ' + list.join('. ') + '.' + (how === 'hearsay' ? ' The rest are only names in the songs.' : '');
  };
  MIL.cardHtml = function (r) {
    r = typeof r === 'string' ? A.realm(r) : r; if (!r || r.alive === false) return '';
    const w = MIL.words(r), note = MIL.eliteNote(r);
    const cap = w.charAt(0).toUpperCase() + w.slice(1);
    return `<div class="small mil-might" style="margin-top:4px"><span><b>Might:</b> ${esc(cap)}.</span>${note ? ` <button type="button" class="small mil-best" data-note="${esc(note)}">its best</button>` : ''}</div>`;
  };
  try {
    const st = document.createElement('style');
    st.textContent = '.mil-might{display:flex;flex-wrap:wrap;align-items:center;gap:6px}:root .mil-might button.small.mil-best{min-height:44px;min-width:44px;padding:0 10px}';
    document.head.appendChild(st);
  } catch (e) {}
})();
