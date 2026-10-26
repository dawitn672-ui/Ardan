// 97-life-fixes, part 7: a choice says what it costs and what failing costs.
//
// Odds are on 70% of scenes, but costs and stakes were not on the buttons: "Pay his rent" costs 30 suns and did not say
// so; "Apologise for the wrong · 49% · risky" did not say what failing costs. Each choice now carries one small line,
// read from the event as written (never from the random stream or the state, so drawing it is pure):
// - Its cost: the coin its effect takes (fx.coin below 0, or the literal sum a written effect subtracts), the
//   treasury it spends, unless the label already names a price.
// - For a choice with a check, what failing brings, from lose.fx: a wound, hurt, prison, death, coin, renown, honour,
//   standing at work, their regard. "If it fails: hurt, −10 suns".
// The line is a <small class="lf-stake"> inside the choice button, after its label; 59-tooltips' wiring of costs and
// odds is unchanged.
(function () {
  const LF = A.LF = A.LF || {};
  const src = v => (typeof v === 'function' ? String(v) : '');
  const num = (fx, k) => (fx && typeof fx === 'object' && typeof fx[k] === 'number' ? fx[k] : 0);
  const sumCoin = n => (A.coin ? A.coin(n) : n + ' suns');
  // the coin a written effect takes: fx.coin < 0, or `p.coin-=40` / `coin:-40` in a function's source
  LF.coinCost = function (fx) {
    if (!fx) return 0;
    if (typeof fx === 'object') return num(fx, 'coin') < 0 ? -num(fx, 'coin') : 0;
    const m = /\.coin\s*-=\s*(\d+)\b|\bcoin\s*:\s*-\s*(\d+)\b/.exec(src(fx));
    return m ? +(m[1] || m[2]) : 0;
  };
  // what failing brings, in a few words (at most three)
  LF.failWords = function (fx) {
    if (!fx) return [];
    const out = [], add = w => { if (!out.includes(w)) out.push(w); };
    if (typeof fx === 'object') {
      if (fx.die) add('death');
      if (fx.prison) add('prison');
      if (fx.wound) add('a wound');
      if (num(fx, 'health') < 0) add('hurt');
      if (num(fx, 'coin') < 0) add('−' + sumCoin(-fx.coin));
      if (num(fx, 'treasury') < 0) add('the treasury');
      if (fx.punish) add('punishment');
      if (num(fx, 'fame') < 0 || num(fx, 'rep') < 0) add('your name');
      if (num(fx, 'honor') < 0) add('honour');
      if (num(fx, 'merit') < 0 || num(fx, 'perf') < 0 || num(fx, 'bossOp') < 0) add('your standing');
      if (fx.them && typeof fx.them === 'object' && num(fx.them, 'op') < 0) add('their regard');
      if (num(fx, 'stability') < 0 || num(fx, 'realmStab') < 0) add('the realm\'s peace');
      if (num(fx, 'legit') < 0) add('legitimacy');
      if (num(fx, 'realmRel') < 0) add('relations');
      if (!out.length && num(fx, 'happy') < 0) add('your spirits');
    } else {
      const s = src(fx);
      if (/\bdie\s*:/.test(s) || /pcDeath\(/.test(s)) add('death');
      if (/\bprison\s*:|imprison\(/.test(s)) add('prison');
      if (/\bwound\s*:|addWound\(/.test(s)) add('a wound');
      if (/\bhealth\s*:\s*-|\.health\s*-=/.test(s)) add('hurt');
      const c = LF.coinCost(fx); if (c) add('−' + sumCoin(c));
    }
    return out.slice(0, 3);
  };
  // the stake line for one written choice, or ''
  const cache = new WeakMap();
  LF.stake = function (c) {
    if (!c || typeof c !== 'object') return '';
    if (cache.has(c)) return cache.get(c);
    const bits = [];
    const label = typeof c.t === 'string' ? c.t : '';
    const cost = LF.coinCost(c.fx);
    if (cost && !/\bsuns?\b|\d/.test(label)) bits.push('Costs ' + sumCoin(cost));
    if (c.fx && typeof c.fx === 'object' && num(c.fx, 'treasury') < 0 && !/\btreasury\b/i.test(label)) bits.push('Treasury ' + sumCoin(-c.fx.treasury));
    if (c.check && c.lose) { const w = LF.failWords(c.lose.fx); if (w.length) bits.push('If it fails: ' + w.join(', ')); }
    const s = bits.join(' · ');
    cache.set(c, s);
    return s;
  };
  const modal = UI.eventModal;
  UI.eventModal = function (q) {
    const h = modal.apply(this, arguments);
    if (LF.OFF || LF.STAKES_OFF) return h;
    try {
      const e = q && A.EV[q.ev], v = q && q.view;
      if (!e || !v || q.result || !Array.isArray(v.choices)) return h;
      return h.replace(/(<button data-a="evChoose" data-v="(\d+)"><span class="grow">)([\s\S]*?)(<\/span>)/g, (all, a, idx, label, b) => {
        const vc = v.choices[+idx], c = vc && vc.i >= 0 ? e.choices[vc.i] : null, s = LF.stake(c);
        return s ? a + label + `<small class="lf-stake">${UI.esc(s)}</small>` + b : all;
      });
    } catch (err) { console.error('stakes', err); return h; }
  };
  // a quiet line under the label
  const css = '.lf-stake{display:block;font-size:.78em;opacity:.78;margin-top:2px;font-weight:normal}';
  try { const st = document.createElement('style'); st.id = 'lf-css'; st.textContent = css; document.head.appendChild(st); } catch (e) {}
})();
