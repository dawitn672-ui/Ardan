// 9997-companies, part 2: orders by courier. An order the player gives an army does not land at once: it rides at
// 60 km a day from where he is to the army's centre (x1.5 through hills, forest or marsh; x0.7 with scouts in the
// army), and lands on the war clock's day it arrives. An order sent while one is in flight lands after it.
(function () {
  const CO = A.CO, K = CO.K;
  const ROUGH = { hills: 1.5, forest: 1.5, marsh: 1.5, mountains: 1.5, jungle: 1.5, swamp: 1.5 };
  // where the sender stands: with his division, else at home (pure)
  CO.senderAt = function (pc) {
    const S = A.S;
    if (pc && pc.mil && pc.mil.div) { const d = A.divById(pc.mil.div); if (d && S.prov[d.loc]) return S.prov[d.loc]; }
    const h = pc && (pc.loc != null ? pc.loc : pc.home);
    return S.prov[h] || null;
  };
  CO.centroid = function (a) {
    const S = A.S, ds = (a.divs || []).map(A.divById).filter(Boolean);
    if (!ds.length) return null;
    let x = 0, y = 0;
    for (const d of ds) { const P = S.prov[d.loc]; x += P.x; y += P.y; }
    x /= ds.length; y /= ds.length;
    let best = null, bd = Infinity;
    for (const d of ds) { const P = S.prov[d.loc], k = Math.hypot(P.x - x, P.y - y); if (k < bd) { bd = k; best = P; } }
    return { x, y, P: best, ds };
  };
  // the delay in days, and why (pure)
  CO.delay = function (pc, a) {
    const from = CO.senderAt(pc), c = CO.centroid(a);
    if (!from || !c) return { days: 0, km: 0 };
    const km = Math.hypot(from.x - c.x, from.y - c.y);
    const rough = ROUGH[c.P.terr] || 1, scouts = c.ds.some(d => ((A.tplOf(d) || {}).sup || []).includes('scouts'));
    const days = km / K.COURIER_KM * rough * (scouts ? 0.7 : 1);
    return { days: Math.round(days * 10) / 10, km: Math.round(km), rough: rough > 1, scouts };
  };
  CO.inFlight = a => (a && Array.isArray(a.orderQ) ? a.orderQ : []);
  const wsSetOrder = A.wsSetOrder;
  CO.landOrder = (aid, k, arg) => wsSetOrder.call(A, aid, k, arg);
  A.wsSetOrder = function (aid, k, arg) {
    const pc = A.pc(), a = A.army(aid), S = A.S;
    if (!S.coOn || !a || !pc || CO.NOW || !A.wsCanCommand(pc, a)) return wsSetOrder.apply(this, arguments);
    const D = CO.delay(pc, a), whole = Math.ceil(D.days - 0.25);
    CO.stats.orders++; CO.stats.delays.push(D.days); if (CO.stats.delays.length > 2000) CO.stats.delays.shift();
    if (whole <= 0 && !CO.inFlight(a).length) return wsSetOrder.apply(this, arguments);
    a.orderQ = CO.inFlight(a);
    const last = a.orderQ.length ? a.orderQ[a.orderQ.length - 1].arrive : 0;
    const q = { k, arg: arg == null ? null : arg, sent: S.warClock || 0, arrive: Math.max((S.warClock || 0) + Math.max(1, whole), last) };
    a.orderQ.push(q);
    const n = q.arrive - (S.warClock || 0);
    return { ok: true, msg: `A courier rides for ${a.name} with your orders, ${D.km} km${D.rough ? ' over rough country' : ''}${D.scouts ? ', guided by its scouts' : ''}: they reach the army in ${n} day${n === 1 ? '' : 's'}.`, delay: n };
  };
  // the war clock delivers what is due (called at the start of A.wsDay)
  CO.courierDay = function () {
    const S = A.S, now = (S.warClock || 0) + 1;
    for (const a of S.armies || []) {
      if (!Array.isArray(a.orderQ) || !a.orderQ.length) continue;
      while (a.orderQ.length && a.orderQ[0].arrive <= now) {
        const q = a.orderQ.shift();
        CO.NOW = true;
        try { const r = wsSetOrder.call(A, a.id, q.k, q.arg); const pc = A.pc(); if (r && r.ok && pc && a.gen === pc.id) A.log(`Your courier reaches ${a.name}. ${r.msg}`, 'good'); }
        catch (e) { console.error('companies courier', e); }
        finally { CO.NOW = false; }
      }
      if (!a.orderQ.length) delete a.orderQ;
    }
  };
  // the army row's words (pure)
  CO.courierText = function (a) {
    const q = CO.inFlight(a), S = A.S;
    if (!q.length) return '';
    const n = q[q.length - 1].arrive - (S.warClock || 0);
    return `orders on the road: they reach the army in ${Math.max(1, n)} day${n === 1 ? '' : 's'}`;
  };
})();
