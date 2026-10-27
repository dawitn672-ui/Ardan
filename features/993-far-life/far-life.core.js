// Life in the Far Lands (993-far-life): what the event packs share.
//
// Condition helpers, in the C.* style CLAUDE.md asks for, so a cond reads like every other cond:
//   C.land(p, 'R', ...)      the person's home lies in one of these Far Lands (the first letter of its region code:
//                            F Long Grass, B Sand Basins, R Twin Rivers, M Southern Peninsulas, A Thousand Isles,
//                            H High Steppes, T Black Pines, I Sunrise Isles, D Deep Southland, N Rime Coast)
//   C.region(p, 'R-08', ...) the home province's lore region
//   C.farLand(p)             the home lies anywhere in the Far Lands
//   C.greatWorld(p)          this game is the Great Continent (S.world names the far lands); a Known World home in
//                            such a game can hear of the east, a Known World game never can
// All four read only the map and S.world, draw nothing from A.rand and are false in any Known World game, so the
// events gated on them never enter a Known World roll (its state hash is the same with or without this folder).
//
// A.FV holds the small tools the events use (people made to fit a story, years in words, a booked callback).
(function () {
  const regionOf = p => {
    if (!p || p.home == null) return null;
    const pr = A.prov(p.home);
    const r = pr && pr.region;
    return typeof r === 'string' && r.length > 2 ? r : null;
  };
  A.C.land = (p, ...L) => { const r = regionOf(p); return !!r && L.includes(r[0]); };
  A.C.region = (p, ...R) => { const r = regionOf(p); return !!r && R.includes(r); };
  A.C.farLand = p => !!regionOf(p);
  A.C.greatWorld = () => !!(A.S && A.S.world && Array.isArray(A.S.world.parts) && A.S.world.parts.length > 1);

  const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const yrs = (p, f) => { const y = p && p.flags ? p.flags[f] : null; return typeof y === 'number' ? Math.max(0, A.S.year - y) : 0; };
  const span = n => { n = Math.max(1, Math.round(n) || 1); return (NUM[n] || String(n)) + (n === 1 ? ' year' : ' years'); };
  const hAge = q => A.age(q) * 16 / GD.RACES[q.race].adult;

  // Someone new, made to fit the story; o.age is on the human scale. ctx.pid makes them {them}.
  const make = (p, ctx, o = {}) => {
    const race = o.race || p.race, realm = p.realm, sex = o.sex || (A.chance(0.5) ? 'M' : 'F'), st = o.status || 'peasant';
    const same = race === p.race, cult = same ? p.cult : A.cultureFor(race, realm), faith = same ? p.faith : A.faithFor(race, realm);
    const age = Math.max(1, Math.round((o.age != null ? o.age : hAge(p)) * GD.RACES[race].adult / 16));
    let given = '';
    try { given = A.givenName(cult, sex); } catch (e) { given = ''; }
    const q = A.newPerson({ given: given || 'Tam', sex, race, realm, cult, faith, born: A.S.year - age, status: st, home: p.home });
    try { const fn = A.familyName({ cult, realm, status: st, home: p.home, sex }); if (fn) { q.sur = fn.sur; q.surMode = fn.mode; } } catch (e) { /* none */ }
    q.occ = o.occ || (A.isAdult(q) ? A.pick(A.OCC[st] || A.OCC.peasant) : '');
    if (ctx) ctx.pid = q.id;
    return q;
  };
  // Someone the engine already linked to the player, else someone made.
  const kin = (p, ctx, types, o) => {
    const x = A.relsOf(p, types).find(r => r.p.alive && r.p.id !== p.id);
    if (x) { ctx.pid = x.p.id; return x.p; }
    return make(p, ctx, o);
  };
  const realmName = p => { const r = A.realm(p.realm); return r ? (r.short || r.name || 'the realm') : 'the realm'; };

  // The real people of the world: the realm's ruler, heir and councillors as the world holds them (99-far-lands names
  // the far rulers from the lore), and its noble houses. Each puts the person in the scene with ctx.pid and fills
  // ctx.rtitle (the ruler's title, without the lore's bracketed gloss); it returns null when there is nobody fit,
  // and the caller drops the scene with ctx.skip.
  const fit = (p, q) => !!(q && q.alive && q.id !== p.id);
  const titleOf = R => String((R && R.title) || 'ruler').replace(/\s*\(.*?\)\s*/g, ' ').trim() || 'ruler';
  const put = (p, ctx, q) => {
    const R = A.realm(p.realm);
    ctx.rtitle = titleOf(R);
    if (!fit(p, q)) { ctx.skip = 1; return null; }
    ctx.pid = q.id;
    return q;
  };
  const figures = {
    ruler: (p, ctx) => { const R = A.realm(p.realm); return put(p, ctx, R && A.P(R.ruler)); },
    heir: (p, ctx) => { const R = A.realm(p.realm); return put(p, ctx, R && R.heir != null ? A.P(R.heir) : null); },
    councillor: (p, ctx, seat) => {
      const R = A.realm(p.realm), c = (R && R.council) || {};
      const id = seat ? c[seat] : Object.values(c).find(x => fit(p, A.P(x)));
      return put(p, ctx, id != null ? A.P(id) : null);
    },
    house: (p, ctx) => {
      const hs = (A.realmHouses ? A.realmHouses(p.realm) : []).filter(h => h && !h.extinct && h.name);
      if (!hs.length) { ctx.skip = 1; return null; }
      const h = hs[(p.id.length + A.S.year) % hs.length];
      ctx.house = h.name; ctx.seat = h.seat || h.name;
      return h;
    },
  };

  A.FV = {
    cap, yrs, span, hAge, make, kin, realmName, titleOf, ...figures,
    ago: (p, f) => span(yrs(p, f)),
    Ago: (p, f) => cap(span(yrs(p, f))),
    fresh: (p, id) => !(p.flags.ev && p.flags.ev[id] != null),
    // book a callback event some years out (A.stillValid re-checks its cond when it falls due)
    later: (ev, years, ctx) => A.schedule({ type: 'event', ev, ctx: ctx || undefined }, Math.round((years + A.rf(0, 1)) * 365)),
    more: (p, ctx, fx) => A.applyFx(p, fx, ctx),
  };
})();
