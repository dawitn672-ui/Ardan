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
  // the stake line for one written choice, or ''; LF.stakeParts gives its pieces, each with what explains it
  const cache = new WeakMap();
  LF.stakeParts = function (c) {
    if (!c || typeof c !== 'object') return [];
    if (cache.has(c)) return cache.get(c);
    const bits = [];
    const label = typeof c.t === 'string' ? c.t : '';
    const cost = LF.coinCost(c.fx);
    if (cost && !/\bsuns?\b|\d/.test(label)) bits.push({ k: 'cost', n: cost, t: 'Costs ' + sumCoin(cost) });
    if (c.fx && typeof c.fx === 'object' && num(c.fx, 'treasury') < 0 && !/\btreasury\b/i.test(label)) bits.push({ k: 'treasury', n: -c.fx.treasury, t: 'Treasury ' + sumCoin(-c.fx.treasury) });
    if (c.check && c.lose) { const w = LF.failWords(c.lose.fx); if (w.length) bits.push({ k: 'fail', t: 'If it fails: ' + w.join(', ') }); }
    cache.set(c, bits);
    return bits;
  };
  LF.stake = c => LF.stakeParts(c).map(b => b.t).join(' · ');
  // with 59-tooltips each piece explains itself: a cost against your purse, what failing brings (lfFail below)
  const tipOf = (b, vi) => !UI.ttAttrs ? '' : b.k === 'cost' ? UI.ttAttrs('cost', b.n, false) : b.k === 'fail' ? UI.ttAttrs('lfFail', vi, false) : b.k === 'treasury' && UI.TIPS && UI.TIPS.treasury ? UI.ttAttrs('treasury', '', false) : '';
  LF.stakeHtml = (bits, vi) => bits.map(b => { const a = tipOf(b, vi); return a ? `<span class="lf-stake-b"${a}>${UI.esc(b.t)}</span>` : UI.esc(b.t); }).join(' · ');
  // the popover for "If it fails: ...": the written lose effect, word by word, and the chance of it. Pure: it reads the
  // event on screen and the written choice, never the random stream or the state.
  if (UI.TT && UI.TT.K) {
    const G = UI.TIPS = UI.TIPS || {}, K = UI.TT.K;
    const FAILD = { death: 'This can end your life.', prison: 'You are taken and held.', 'a wound': 'A wound that lasts, until it heals.', hurt: 'Your health falls.',
      'the treasury': 'The crown\'s purse pays for it.', punishment: 'Those over you punish you.', 'your name': 'Your renown or your name in the trade falls.',
      honour: 'Your honour falls.', 'your standing': 'Your standing at work falls.', 'their regard': 'They think less of you.',
      'the realm\'s peace': 'The realm grows less settled.', legitimacy: 'Your right to rule is doubted.', relations: 'Another realm thinks less of yours.', 'your spirits': 'Your spirits fall.' };
    G.lfFail = function (vi) {
      const q = (UI.TT.cur && UI.TT.cur.ev) || (A.S && A.S.queue && A.S.queue[0]), e = q && A.EV[q.ev], v = q && q.view;
      const vc = v && v.choices && v.choices[+vi], c = vc && vc.i >= 0 && e ? e.choices[vc.i] : null;
      if (!c || !c.check || !c.lose) return '';
      const w = LF.failWords(c.lose.fx); if (!w.length) return '';
      const show = A.DIFF && A.DIFF.showOdds ? A.DIFF.showOdds() : !!(UI.set && UI.set.odds !== false);
      const odds = vc.odds != null ? vc.odds : vc.fight ? vc.fight.pct : null;
      let h = K.H('If it fails', show && odds != null ? (100 - odds) + '%' : null, 'the chance it goes wrong');
      for (const x of w) h += K.R(UI.esc(x), UI.esc(/^−/.test(x) ? 'coin lost' : FAILD[x] || ''));
      return h + K.F(odds != null ? `As written for this choice. See ${K.L('odds', vi, 'the odds')}.` : 'As written for this choice.');
    };
  }
  const modal = UI.eventModal;
  UI.eventModal = function (q) {
    const h = modal.apply(this, arguments);
    if (LF.OFF || LF.STAKES_OFF) return h;
    try {
      const e = q && A.EV[q.ev], v = q && q.view;
      if (!e || !v || q.result || !Array.isArray(v.choices)) return h;
      return h.replace(/(<button data-a="evChoose" data-v="(\d+)"><span class="grow">)([\s\S]*?)(<\/span>)/g, (all, a, idx, label, b) => {
        const vc = v.choices[+idx], c = vc && vc.i >= 0 ? e.choices[vc.i] : null, bits = LF.stakeParts(c);
        return bits.length ? a + label + `<small class="lf-stake">${LF.stakeHtml(bits, +idx)}</small>` + b : all;
      });
    } catch (err) { console.error('stakes', err); return h; }
  };
  // a quiet line under the label
  const css = '.lf-stake{display:block;font-size:.78em;opacity:.78;margin-top:2px;font-weight:normal}';
  try { const st = document.createElement('style'); st.id = 'lf-css'; st.textContent = css; document.head.appendChild(st); } catch (e) {}
})();
