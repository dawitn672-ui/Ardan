// 999911-d9-ground, in play: the same ground drives the journey, the march, supply and the fight.
//   - a journey's step (9990-journeys, A.JR.stepDays) goes at the road's pace: a high road or a track is faster than
//     open country (A.D9.TRAVEL);
//   - an army's march (A.divMove) and its choice of way (A.wsPath, 38-orders' roundRoad) read the road (A.D9.MARCH):
//     edits in the release's source and 38's, each marked D9;
//   - supply (A.supplyNeighbours) carries further along high roads and navigable rivers (A.D9.supplyF);
//   - a fight on the war map (A.fightDay): each attacking division that comes over a river or through a pass strikes for
//     less (A.D9.across, below), and 23-after-action names the crossing or the pass among the causes;
//   - the battle you play (99997-v2-war, A.V2W.begin): the attacking side's units fight at the same factor, and the
//     report's first cause names the place.
(function () {
  const D9 = A.D9;
  if (!D9) return;
  // the attackers of one fight day: each division's factor by where it comes from, the men-weighted factor, and the
  // name of the place most of them come over (a fight with no crossing: null)
  D9.across = function (divs, pid) {
    if (!D9.ctx() || !divs || !divs.length) return null;
    const by = new Map(), names = new Map(); let men = 0, sum = 0;
    for (const d of divs) {
      const r = d && d.loc !== pid ? D9.attack(d.loc, pid) : null, n = Math.max(1, d.men || 1);
      men += n; sum += n * (r ? r.f : 1);
      if (r) { by.set(d, r.f); names.set(r.name, (names.get(r.name) || 0) + n); }
    }
    if (!by.size) return null;
    let name = null, best = -1; for (const [k, v] of [...names].sort((x, y) => (x[0] < y[0] ? -1 : 1))) if (v > best) { best = v; name = k; }
    return { f: Math.round((sum / men) * 1000) / 1000, by, name };
  };

  // the battle you play (99997-v2-war): the side that attacks over the river or through the pass fights at the same
  // factor, and the report's first cause names the place
  const W = A.V2W;
  if (W && typeof W.begin === 'function' && typeof W.aarOf === 'function' && !W.begin.d9) {
    const begin0 = W.begin, aar0 = W.aarOf;
    W.begin = function (pc, F) {
      const b = begin0.apply(this, arguments);
      try {
        if (b && F) {
          const x = D9.across((F.aIds || []).map(A.divById).filter(Boolean), F.loc);
          if (x && x.f < 1) {
            const att = b.camp.armies[b.weAtt ? 0 : 1];
            for (const u of att.units) u.worth = Math.round(u.worth * x.f * 100) / 100;
            b.cross = { name: x.name, f: x.f };
          }
        }
      } catch (e) { console.error('D9 battle', e); }
      return b;
    };
    W.begin.d9 = true;
    W.aarOf = function (b) {
      const r = aar0.apply(this, arguments);
      try {
        if (b && b.cross && r && Array.isArray(r.causes)) {
          const nm = b.cross.name[0].toUpperCase() + b.cross.name.slice(1), us = !!b.weAtt;
          const c = { key: 'crossing', label: `${nm} ${us ? 'cost us' : 'cost them'}`, pct: Math.round((us ? -1 : 1) * (1 - b.cross.f) * 100) };
          r.causes = [c].concat(r.causes.slice(0, 2));
          r.text = `${r.headline} What decided it: ${r.causes.map(x => x.label).join('; ')}.`;
        }
      } catch (e) { console.error('D9 report', e); }
      return r;
    };
  }

  // the journey's pace on the road
  const JR = A.JR;
  if (JR && typeof JR.stepDays === 'function' && !JR.stepDays.d9) {
    const step0 = JR.stepDays;
    JR.stepDays = function (a, b, sea) {
      const d = step0.apply(this, arguments);
      return sea || !isFinite(d) ? d : d / D9.travelF(a, b);
    };
    JR.stepDays.d9 = true;
  }
})();
