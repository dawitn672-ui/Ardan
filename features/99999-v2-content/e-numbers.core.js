// 99999-v2-content, part 5: numbers a player should not see (playtest 1, the War Room and World > Diplomacy).
//
// - The War Room's division panels gave a commander the enemy's exact strength once a scout was near ("7,409/7,470",
//   "21,217 men" for three enemy divisions, the men of each enemy battalion), and current numbers above full strength
//   for his own ("10,836 / 10,835"). Enemy numbers are estimates now (99997-v2-war's words for a commander, "some
//   7,400"), and a bar's current value never reads above its full one.
// - World > Diplomacy's "Restless lords" read "45% of the swords, discontent 70", and the realm tab's army "quality
//   114%" (which the generic percentage pass turned into "quality more than all"). Both are words now.
// Rendering only: nothing here reads A.rand or writes A.S.
(function () {
  const esc = s => UI.esc(String(s == null ? '' : s));
  const C2 = A.V2C = A.V2C || {};
  const myRealm = () => { const pc = A.pc(); try { return UI.wrMyR ? UI.wrMyR(pc) : pc && pc.realm; } catch (e) { return pc && pc.realm; } };
  const hostile = r => { try { return !!r && A.hostile(myRealm(), r); } catch (e) { return false; } };
  C2.estimate = n => !(n > 0) ? 'none' : (A.V2W && A.V2W.estimate ? A.V2W.estimate(n, 'commander') : `about ${A.fmt(Math.round(n / 100) * 100)}`);
  const num = s => { const m = /^([\d.,]+)(k?)$/.exec(String(s).trim()); if (!m) return NaN; const v = +m[1].replace(/,/g, ''); return m[2] ? v * 1000 : v; };

  // a bar's "current/full" never reads above full (every panel that draws one: divisions, armies, the profile)
  if (typeof UI.barRow === 'function') {
    const bar0 = UI.barRow;
    UI.barRow = function (label, v, max, cls, pot, valTxt) {
      try {
        if (typeof v === 'number' && typeof max === 'number' && max > 0 && v > max) {
          v = max;
          if (typeof valTxt === 'string') { const m = /^\s*([^/\s]+)\s*\/\s*([^/\s]+)\s*$/.exec(valTxt); if (m && num(m[1]) > num(m[2])) valTxt = `${m[2]}/${m[2]}`; }
          return bar0.call(this, label, v, max, cls, pot, valTxt);
        }
      } catch (e) {}
      return bar0.apply(this, arguments);
    };
  }

  // the division panel: an enemy's numbers as estimates
  C2.foeDivHtml = function (h, ds) {
    if (ds.length === 1) {
      const d = ds[0];
      h = h.replace(/(<span class="lbl">Men<\/span>[\s\S]*?<span class="val">)([^<]*)(<\/span>)/, (all, a, v, b) => a + esc(C2.estimate(d.men)) + b);
      h = h.replace(/(Record: [^<]*?· )([\d,]+)( enemy dead)/, (all, a, n, b) => a + esc(C2.estimate(num(n))) + b);
      // 9997-companies' order of battle: each battalion's and company's men
      h = h.replace(/(data-tt="coMen" data-v="[^"]*">)([\d,]+)(<\/span>)/g, (all, a, n, b) => a + esc(C2.estimate(num(n))) + b);
      h = h.replace(/title="(\d+) of (\d+) men"/g, (all, n) => `title="${esc(C2.estimate(+n))} men"`);
      return h;
    }
    const men = ds.reduce((x, d) => x + (d.men || 0), 0);
    return h.replace(/(<span class="right tiny muted">)([\d,]+)( men<\/span>)/, (all, a, n, b) => a + esc(C2.estimate(men)) + b);
  };
  if (typeof UI.wrDivPanel === 'function') {
    const div0 = UI.wrDivPanel;
    UI.wrDivPanel = function (ids) {
      const h = div0.apply(this, arguments);
      try {
        const ds = (ids || []).map(A.divById).filter(Boolean);
        if (typeof h === 'string' && ds.length && ds.some(d => hostile(d.r))) return C2.foeDivHtml(h, ds);
      } catch (e) { console.error('v2 content war room', e); }
      return h;
    };
  }
  // a fight's row: "You attack · Aldmark 12,400 vs Solenne 9,872": the other side's men as an estimate
  if (typeof UI.wrFightRow === 'function') {
    const fight0 = UI.wrFightRow;
    UI.wrFightRow = function (F, myR) {
      const h = fight0.apply(this, arguments);
      try {
        if (!F || typeof h !== 'string') return h;
        const mySide = A.friendly(F.a, myR) ? 'a' : 'b';
        return h.replace(/(You (?:attack|defend) · [^<]*? )([\d,]+)( vs [^<]*? )([\d,]+)( ·)/, (all, a, n1, b, n2, c) =>
          mySide === 'a' ? a + n1 + b + esc(C2.estimate(num(n2))) + c : a + esc(C2.estimate(num(n1))) + b + n2 + c);
      } catch (e) { return h; }
    };
  }
  // an enemy army's row (an outrider's report): its men as an estimate
  if (typeof UI.wrArmyRow === 'function') {
    const army0 = UI.wrArmyRow;
    UI.wrArmyRow = function (a) {
      const h = army0.apply(this, arguments);
      try { if (a && hostile(a.r) && typeof h === 'string') return h.replace(/· ([\d,]+) men ·/, (all, n) => `· ${esc(C2.estimate(num(n)))} men ·`); } catch (e) {}
      return h;
    };
  }

  // ---- World > Diplomacy, and the realm tab: words ---------------------------------------------------------------------
  const VS = A.V2S || {};
  const frac = n => (VS.fracWords ? VS.fracWords(n) : n >= 50 ? 'half or more' : 'less than half');
  C2.discWord = d => (d >= 80 ? 'close to revolt' : d >= 60 ? 'angry' : d >= 40 ? 'restless' : d >= 20 ? 'grumbling' : 'content');
  C2.qualityWord = q => (q >= 1.3 ? 'fine' : q >= 1.1 ? 'good' : q >= 0.9 ? 'fair' : q >= 0.7 ? 'poor' : 'wretched');
  if (typeof UI.worldTabPolitics === 'function') {
    const pol0 = UI.worldTabPolitics;
    UI.worldTabPolitics = function () {
      const h = pol0.apply(this, arguments);
      try { return typeof h === 'string' ? h.replace(/— (\d+)% of the swords, discontent (\d+)/g, (all, p, d) => `— ${frac(+p)} of the swords, ${C2.discWord(+d)}`) : h; } catch (e) { return h; }
    };
  }
  if (typeof UI.realmTabBasic === 'function') {
    const realm0 = UI.realmTabBasic;
    UI.realmTabBasic = function () {
      const h = realm0.apply(this, arguments);
      try { return typeof h === 'string' ? h.replace(/· quality (\d+)%/g, (all, q) => `· ${C2.qualityWord(+q / 100)} quality`) : h; } catch (e) { return h; }
    };
  }
})();
