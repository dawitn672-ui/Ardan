// 9990-journeys: travel is a road with stops, set by distance, roads and the season, and it stays deterministic.
const SETUP = () => {
  window.JT = {
    clear() { let h, g = 0; while ((h = A.headReady()) && g++ < 80) { if (h.type === 'event') { const v = A.eventView(h); JT.seen.push(h.ev + ':' + (v.text || '')); A.eventChoose(0); if (A.S.queue[0] && A.S.queue[0].result) A.S.queue.shift(); } else A.S.queue.shift(); } },
    seen: [],
    walk(days) { const pc = A.pc(); for (let g = 0; g < days / 5 && pc.alive; g++) { A.advance(5); JT.clear(); if (!pc.journey && g > 2) break; } },
    farCap(pc, min) { return Object.values(A.S.realms).filter(r => r.alive && r.capitalProv != null && A.wsDist(pc.home, r.capitalProv) > min).sort((a, b) => A.wsDist(pc.home, a.capitalProv) - A.wsDist(pc.home, b.capitalProv))[0]; },
    linked(path, sea) { for (let i = 1; i < path.length; i++) { const P = A.S.prov[path[i - 1]]; if (!(P.adj.includes(path[i]) || (P.sea || []).includes(path[i]) || (path.length === 2 && sea[1]))) return false; } return true; },
  };
};
export default {
  async journeysRoad(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = {};
      for (const lands of ['great', 'known']) {
        A.newGame({ seed: 21, lands, race: 'human', realm: lands === 'great' ? 'POL-101' : 'POL-01', status: 'peasant', startAge: 20 });
        const pc = A.pc(); pc.coin = 900; JT.seen = [];
        const from = pc.home, R = JT.farCap(pc, lands === 'great' ? 1500 : 900);
        const res = A.travelTo(R.capitalProv), j = pc.journey;
        const o = { ok: res.ok, km: j && j.km, days: j && j.days, stops: j ? j.stops.length : 0, linked: j ? JT.linked(j.path, j.sea) : false, homeKept: pc.home === from };
        // the season: the same road set out on in winter takes longer than in autumn
        const R1 = A.JR.route(from, R.capitalProv, A.S.year * 365 + 250), R2 = A.JR.route(from, R.capitalProv, A.S.year * 365 + 340);
        o.autumn = R1.days; o.winter = R2.days;
        JT.walk(o.days + 60);
        o.arrived = pc.home === R.capitalProv && !pc.journey;
        o.scenes = JT.seen.filter(s => /^jr_/.test(s)).map(s => s.split(':')[0]);
        o.raw = JT.seen.filter(s => /^jr_/.test(s) && T.raw.test(s)).length;
        o.log = (pc.jrLog || []).length;
        o.seen = A.ATLAS ? j.path.every(id => A.ATLAS.level(pc, id) === 2) : true;
        out[lands] = o;
      }
      return out;
    });
    const g = r.great, k = r.known;
    const ok = [g, k].every(o => o.ok && o.linked && o.homeKept && o.arrived && o.scenes.length >= 1 && !o.raw && o.log === 1 && o.seen && o.days > o.km / 60 && o.winter >= o.autumn) && g.winter > g.autumn;
    return { ok, detail: `Great Continent: ${g.km} km in ${g.days} days (autumn ${g.autumn}, winter ${g.winter}), ${g.stops} stops, scenes ${g.scenes.join(' ')}; arrived ${g.arrived}, path seen ${g.seen}. Known World: ${k.km} km in ${k.days} days, ${k.stops} stops, scenes ${k.scenes.join(' ')}; arrived ${k.arrived}` };
  },

  async journeysKinds(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const fresh = () => { A.newGame({ seed: 33, lands: 'great', race: 'human', realm: 'POL-101', status: 'peasant', startAge: 24 }); const pc = A.pc(); pc.coin = 900; JT.seen = []; return pc; };
      const out = {};
      // go and come back: home is kept, the far end asks, the road home ends at home
      let pc = fresh(); const home = pc.home, R = JT.farCap(pc, 700);
      A.travelTo(R.capitalProv, 'visit');
      out.visit = pc.journey && pc.journey.k;
      for (let g = 0; g < 200 && pc.journey && !pc.journey.there; g++) { A.advance(5); JT.clear(); }
      out.there = !!(pc.journey && pc.journey.there) || JT.seen.some(s => /^jr_arrive_visit/.test(s));
      JT.walk(400);
      out.back = pc.home === home && !pc.journey && (pc.jrLog || []).length === 2;
      // turning back mid-road
      pc = fresh(); A.travelTo(JT.farCap(pc, 1500).capitalProv); for (let g = 0; g < 40 && pc.journey && pc.journey.pi < 1; g++) { A.advance(3); JT.clear(); }
      out.turned = A.jrTurnBack().ok && pc.journey && pc.journey.k === 'return';
      // the pilgrimage is a road to a shrine and back
      pc = fresh(); A.S.time = 9; const pr = A.doActivity('pilgrimage');
      out.pilgrim = pc.journey ? pc.journey.k : (pr && pr.msg);
      // exile: the release moves you at once; the road out is told after, with its first scene
      pc = fresh(); const h0 = pc.home; A.exile(pc); A.advance(2);
      out.exile = pc.home !== h0 ? (pc.journey ? pc.journey.k + (pc.journey.applied ? '/told' : '') : 'short') : 'stayed';
      // a caravan of this month (45's S.eco.car) can be joined
      A.newGame({ seed: 33, lands: 'great', race: 'human', realm: 'POL-01', status: 'peasant', startAge: 24 }); pc = A.pc(); pc.coin = 900;
      for (let g = 0; g < 60 && !A.JR.caravansHome(pc).length; g++) { A.advance(5); JT.clear(); }
      const cars = A.JR.caravansHome(pc);
      out.cars = cars.length; if (cars.length) { const c = A.jrCaravan(0); out.caravan = c.ok && pc.journey && pc.journey.k; }
      // an old save: no journey, no jrAt, no jrLog
      pc = fresh(); delete pc.journey; delete pc.jrAt; delete pc.jrLog; const s = A.serialize(); A.deserialize(JSON.parse(s)); A.advance(40); JT.clear();
      out.old = A.pc().alive && !A.pc().journey;
      return out;
    });
    const ok = r.visit === 'visit' && r.there && r.back && r.turned && r.pilgrim === 'pilgrim' && /^(exile\/told|short)$/.test(r.exile) && r.cars > 0 && r.caravan === 'caravan' && r.old;
    return { ok, detail: `visit ${r.visit}, reached the far end ${r.there}, home again ${r.back}; turned back ${r.turned}; pilgrimage ${r.pilgrim}; exile ${r.exile}; caravans this month ${r.cars}${r.cars ? ', joined ' + r.caravan : ''}; old save ${r.old}` };
  },

  async journeysPure(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const run = look => {
        T.enter({ seed: 909, lands: 'great', race: 'human', realm: 'POL-101', status: 'peasant', startAge: 20 });
        const pc = A.pc(); pc.coin = 900; JT.seen = [];
        A.travelTo(JT.farCap(pc, 1500).capitalProv);
        for (let g = 0; g < 40; g++) {
          A.advance(7); JT.clear();
          if (look) { UI.storyView = 'map'; T.renderAll(); A.S.queue.push({ type: 'travel' }); UI.travelModal(); A.S.queue.pop(); UI.storyView = 'story'; }
        }
        return T.hash(A.S.people) + ':' + T.hash(A.S.realms) + ':' + A.rngState + ':' + JT.seen.map(s => s.split(':')[0]).join(',');
      };
      const a = run(false), b = run(true);
      // drawing the road modal and the map moves nothing
      const h0 = T.hash(A.S), rng0 = A.rngState;
      A.S.queue.push({ type: 'travel' }); UI.travelModal(); A.S.queue.pop(); UI.storyView = 'map'; UI.render(); UI.storyView = 'story'; UI.render();
      return { same: a === b, pure: T.hash(A.S) === h0 && A.rngState === rng0, a: a.slice(-120) };
    });
    return { ok: r.same && r.pure, detail: `same life with and without looking at the road ${r.same}; rendering pure ${r.pure}; scenes ${r.a}` };
  },
};
