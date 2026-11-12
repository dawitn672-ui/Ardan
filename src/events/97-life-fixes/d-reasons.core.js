// 97-life-fixes, part 4: a control that is greyed out says why.
//
// On a peasant's Holdings tab 61 controls were disabled and 43 gave no reason (the market's "+1" and "+5", the
// property "Buy"); the Decisions cards' "Decide", the Path tab's "Apply", the elite orders' "Ask to join" and the
// realm's actions were the same. After every draw (UI.render, UI.refreshTab, UI.refresh, UI.renderModal) each disabled
// control without a title gets one, worked out from the same rules that disabled it (LF.WHY, by its data-a):
//   mktBuy      not enough coin for that many loads, or no room left to carry them
//   buyProp     not enough coin
//   decide      the requirements still missing (the ✗ lines of its card)
//   applyJob    applied already this year, the post you hold, or they would not take you yet (and the card's reason)
//   orderJoin   the order's requirements still missing, or already sworn to an order
//   act         the action's own refusal (A.canAct)
// Anything else falls back to the ✗ requirements in its card, then to "Not open to you now". A title is also the
// control's accessible description. It only reads the game; it never changes it or draws a number.
(function () {
  const LF = A.LF = A.LF || {};
  const coin = n => (A.coin ? A.coin(Math.round(n)) : Math.round(n) + ' suns');
  const tryS = f => { try { return f() || ''; } catch (e) { return ''; } };
  LF.WHY = {
    mktBuy(v, pc) {
      const [k, n0] = String(v).split('|'), n = +n0 || 1, home = A.homeMkt(pc), b = A.buyPrice(home, k);
      const cap = A.carryCap(pc), load = A.cargoLoad(pc);
      if (load + n > cap) return cap <= 0 ? 'You have nothing to carry goods in. A mule or a cart carries loads.' : `No room: you carry ${load} of ${cap} loads.`;
      if (pc.coin < b * n) return `Not enough coin: ${n} ${n === 1 ? 'load costs' : 'loads cost'} ${coin(b * n)}, you have ${coin(pc.coin)}.`;
      return '';
    },
    buyProp(v, pc) { const P = GD.PROPERTY[v]; return P && pc.coin < P.price ? `Not enough coin: ${coin(P.price)}, you have ${coin(pc.coin)}.` : ''; },
    decide(v, pc) {
      const d = A.DEC && A.DEC[v]; if (!d) return '';
      const miss = A.decisionState(pc, d).rs.filter(x => !x[1]).map(x => x[0]);
      return miss.length ? 'Still needed: ' + miss.join('; ') + '.' : '';
    },
    applyJob(v, pc) {
      if (A.S.yearActs && A.S.yearActs['apply_' + v]) return 'You have applied here this year. Try again next year.';
      if (pc.job && pc.job.c === v) return 'This is the post you hold.';
      return 'They would not take you yet: your chance is under 2 in 100. Train the skills the trade asks for.';
    },
    orderJoin(v, pc) {
      if (pc.order) return 'You are already sworn to an order.';
      const miss = A.orderReqs ? A.orderReqs(pc, v).filter(x => !x.ok).map(x => x.label) : [];
      return miss.length ? 'Not yet: ' + miss.join('; ') + '.' : '';
    },
    act(v) { const r = A.canAct ? A.canAct(v) : null; return r && !r[0] ? String(r[1] || '') : ''; },
    joinSchool() { return 'The school is not open to you here.'; },
  };
  LF.reasonFor = function (el, pc) {
    const a = el.getAttribute('data-a'), v = el.getAttribute('data-v');
    let why = a && LF.WHY[a] && pc ? tryS(() => LF.WHY[a](v, pc)) : '';
    if (!why) {
      const card = el.closest && el.closest('.card');
      const miss = card ? [...card.querySelectorAll('.req.no')].map(x => x.textContent.replace(/^\s*✗\s*/, '').trim()).filter(Boolean) : [];
      if (miss.length) why = 'Still needed: ' + miss.join('; ') + '.';
    }
    return why || 'Not open to you now.';
  };
  LF.explainDisabled = function (root) {
    if (LF.OFF || typeof document === 'undefined') return 0;
    const pc = A.S ? A.pc() : null;
    let n = 0;
    for (const el of (root || document).querySelectorAll('button[disabled],select[disabled],input[disabled]')) {
      if ((el.getAttribute('title') || '').trim() || el.getAttribute('data-tip') || el.getAttribute('data-tt')) continue;
      const why = LF.reasonFor(el, pc);
      el.setAttribute('title', why);
      n++;
    }
    return n;
  };
  for (const name of ['render', 'refreshTab', 'refresh', 'renderModal']) {
    const f = UI[name];
    if (typeof f !== 'function') continue;
    UI[name] = function () {
      const r = f.apply(this, arguments);
      try { LF.explainDisabled(); } catch (e) { console.error('disabled reasons', e); }
      return r;
    };
  }
})();
