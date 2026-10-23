// Kin and blood (50-arcs-kin): thirteen story arcs about families, on the story track of 46-life-arcs.
// Every stage is a trigger-only scene; every choice moves the arc on (fx.arc) and leaves a mark the later stages read
// (M below: the flag 'la_' + mark). The people in an arc are kept on the arc's own state (A.AKIN.get), so the cousin
// who took the keys in the first scene is the one with the man of law in the third. Ages, sums and names come from the
// life: a share of what you own is shown in suns, a child's age is the child's.
(function () {
  const H = A.AKIN;
  const M = (p, m) => !!(p && p.flags && p.flags['la_' + m]);
  const yrsSince = (p, k) => { const a = p.arcs && p.arcs[k]; return H.num(a && a.y != null ? Math.max(1, A.S.year - a.y) : 1); };
  const own = (p, k) => (p.assets || []).some(x => x && x.ak === k);
  const opp = s => (s === 'F' ? 'M' : 'F');
  const likes = p => (p.flags && (p.flags.likes === 'M' || p.flags.likes === 'F') ? p.flags.likes : opp(p.sex));

  // ================================================================== the feud
  const FEUD = 'ak_feud';
  const feud = (p, ctx) => {
    const hi = H.hi(p), town = H.town(p, FEUD);
    const foe = H.get(p, FEUD, 'foe', () => H.mk(p, { age: Math.min(60, H.adj(p) + 16), sex: 'M', occ: hi ? 'a lord with a mill on the river' : 'the miller' }));
    const son = H.get(p, FEUD, 'son', () => H.mk(p, { age: Math.max(17, Math.min(40, H.adj(p) - 4)), sex: 'M', parents: [foe.id], sur: foe.sur, surMode: foe.surMode, occ: 'a son of ' + foe.given }));
    ctx.town = town; ctx.cuz = H.given(p, FEUD, 'cuz', 'M', p.cult);
    ctx.foeRole = hi ? 'lord of ' + town : 'the miller'; ctx.foeSeat = hi ? 'hall' : 'mill';
    // the old man dead before the end: his son has the quarrel now, and says the old man's lines
    const head = foe.alive || !son.alive ? foe : son;
    ctx.lead = head === foe ? '' : `Old ${foe.given} is in his grave, and ${son.given} has the ${ctx.foeSeat} and the quarrel. `;
    H.tok(ctx, 'foe', head); H.tok(ctx, 'son', son); ctx.yrs = yrsSince(p, FEUD);
    ctx.mill = 'The mill-right on the lower stream at ' + town;
    ctx.pid = head.id;
    return { foe, son };
  };

  // ================================================================== a child you did not know
  const SEC = 'ak_secret';
  const secret = (p, ctx) => {
    const town = H.town(p, SEC);
    const ol = H.get(p, SEC, 'ol', () => {
      const old = H.loves(p).filter(q => q.id !== p.spouse && q.sex !== p.sex).sort((a, b) => (p.rel[a.id].since || 0) - (p.rel[b.id].since || 0))[0];
      if (old) return old;
      const q = H.mk(p, { age: H.adj(p) + A.ri(-3, 3), sex: opp(p.sex) });
      A.kill(q, 'fever', true);
      return q;
    });
    const kid = H.get(p, SEC, 'kid', () => H.mk(p, { age: Math.max(9, Math.min(19, H.adj(p) - 19)), parents: p.sex === 'F' ? [ol.id, p.id] : [p.id, ol.id], sur: ol.sur, surMode: ol.surMode, status: ol.status }));
    ctx.town = town; H.tok(ctx, 'kid', kid); H.tok(ctx, 'ol', ol);
    ctx.craft = H.name(p, SEC, 'craft', () => A.pick(['cooper', 'saddler', 'chandler', 'wheelwright', 'glover']));
    ctx.young = H.num(Math.max(15, Math.round(H.adj(p) - H.adj(kid))));
    const s = H.spouse(p); if (s) H.tok(ctx, 'sp', s);
    ctx.pid = kid.id;
    if (!kid.alive) ctx.skip = 1;
    return { kid, ol, s };
  };

  // ================================================================== your uncle's mill
  const INH = 'ak_inherit';
  const inherit = (p, ctx) => {
    const town = H.town(p, INH);
    const cz = H.get(p, INH, 'cz', () => {
      const c = A.relsOf(p, ['cousin']).map(x => x.p).find(q => q.alive && A.isAdult(q));
      return c || H.mk(p, { age: H.adj(p) + A.ri(-6, 6), occ: 'a cousin of yours' });
    });
    ctx.town = town; H.tok(ctx, 'cz', cz);
    ctx.u = H.given(p, INH, 'u', 'M', p.cult);
    ctx.side = H.name(p, INH, 'side', () => (A.chance(0.5) ? "father's" : "mother's"));
    ctx.hk = H.given(p, INH, 'hk', 'F', p.cult);
    ctx.court = H.hi(p) ? "the lord's court" : 'the manor court';
    ctx.mill = 'The mill below ' + town + ' (two stones)';
    ctx.pid = cz.id;
    if (!cz.alive) ctx.skip = 1;
    return { cz };
  };

  // ================================================================== the one who came back
  const SIB = 'ak_sibling';
  const sibling = (p, ctx) => {
    const sib = H.get(p, SIB, 'sib', () => {
      const q = H.mk(p, { age: H.adj(p) + A.ri(6, 11), parents: (p.parents || []).slice(0, 2), sur: p.sur, surMode: p.surMode, occ: 'a galley-hand, lately' });
      for (const par of (p.parents || []).map(A.P)) if (par && !par.children.includes(q.id)) par.children.push(q.id);
      return q;
    });
    H.tok(ctx, 'sib', sib);
    const mo = H.mother(p), fa = H.father(p);
    ctx.moAlive = mo && mo.alive ? '1' : ''; ctx.faAlive = fa && fa.alive ? '1' : '';
    ctx.port = H.name(p, SIB, 'port', () => { const c = A.S.prov.filter(x => x.coast && x.owner === p.realm); return c.length ? A.pick(c).name : 'the coast'; });
    ctx.pid = sib.id;
    if (!sib.alive) ctx.skip = 1;
    return { sib };
  };

  // ================================================================== the match
  const MATCH = 'ak_match';
  const match = (p, ctx) => {
    const hi = H.hi(p), town = H.town(p, MATCH);
    const kin = H.get(p, MATCH, 'kin', () => {
      const k = H.kidsOf(p).filter(q => H.adj(q) >= 15 && H.adj(q) <= 30 && !H.spouse(q)).sort((a, b) => a.born - b.born)[0];
      if (k) return k;
      const s = A.relsOf(p, ['sibling']).map(x => x.p).filter(q => q.alive && H.adj(q) >= 15 && H.adj(q) <= 30 && !H.spouse(q) && q.born > p.born)[0];
      return s || H.mk(p, { age: 18, parents: [p.sex === 'M' ? p.id : null, p.sex === 'F' ? p.id : null], sur: p.sur, surMode: p.surMode });
    });
    const fh = H.get(p, MATCH, 'fh', () => H.mk(p, { age: H.adj(p) + A.ri(-2, 8), status: hi ? 'noble' : 'merchant', occ: hi ? 'a lord of three manors' : 'a wool-merchant with two warehouses' }));
    const mate = H.get(p, MATCH, 'mate', () => H.mk(p, { age: H.adj(kin) + A.ri(0, 5), sex: opp(kin.sex), parents: fh.sex === 'F' ? [null, fh.id] : [fh.id], sur: fh.sur, surMode: fh.surMode, status: fh.status }));
    ctx.town = town; H.tok(ctx, 'kin', kin); H.tok(ctx, 'fh', fh); H.tok(ctx, 'mate', mate);
    ctx.kinRel = (p.children || []).includes(kin.id) ? ctx.kinSD : ctx.kinBS;
    ctx.fhWho = (hi ? 'who holds three manors between ' : 'the richest wool-merchant between ') + A.provName(p.home) + ' and ' + town;
    ctx.mateHW = mate.sex === 'F' ? 'wife' : 'husband';
    ctx.pid = kin.id;
    if (!kin.alive) ctx.skip = 1;
    return { kin, fh, mate };
  };

  // ================================================================== the bastard of the house
  const BAS = 'ak_bastard';
  const bastard = (p, ctx) => {
    const town = H.town(p, BAS);
    const bas = H.get(p, BAS, 'bas', () => H.mk(p, { age: Math.min(60, H.adj(p) + A.ri(2, 10)), sex: A.chance(0.7) ? 'M' : 'F', status: 'merchant', occ: 'a captain of hired spears' }));
    ctx.town = town; H.tok(ctx, 'bas', bas);
    ctx.pr = H.given(p, BAS, 'pr', 'M', p.cult);
    ctx.house = H.hi(p) ? 'house' : 'family';
    ctx.pid = bas.id;
    if (!bas.alive) ctx.skip = 1;
    return { bas };
  };

  // ================================================================== what runs in the blood
  const BLOOD = 'ak_blood';
  const fate = p => H.st(p, BLOOD).nm.fate || '0';   // whether it is in you, settled at the first scene and not shown
  const blood = (p, ctx) => {
    H.name(p, BLOOD, 'fate', () => (A.chance(0.5) ? '1' : '0'));
    ctx.town = H.town(p, BLOOD);
    ctx.au = H.given(p, BLOOD, 'au', 'F', p.cult);
    ctx.oc = H.given(p, BLOOD, 'oc', 'F', p.cult);
    ctx.doc = H.given(p, BLOOD, 'doc', 'M', p.cult);
    const s = H.spouse(p); if (s) { H.tok(ctx, 'sp', s); ctx.pid = s.id; }
    ctx.kids = H.kidsOf(p).length ? '1' : '';
    return { s };
  };

  // ================================================================== the carter's child
  const AD = 'ak_adopt';
  const adopt = (p, ctx) => {
    const kid = H.get(p, AD, 'kid', () => H.mk(p, { age: 5, status: 'peasant' }));
    ctx.town = H.town(p, AD); H.tok(ctx, 'kid', kid);
    ctx.cd = H.given(p, AD, 'cd', 'M', p.cult);
    ctx.wd = H.given(p, AD, 'wd', 'F', p.cult);
    ctx.craft = H.name(p, AD, 'craft', () => A.pick(['cooper', 'saddler', 'wheelwright', 'smith', 'mason']));
    const s = H.spouse(p); if (s) H.tok(ctx, 'sp', s);
    ctx.kids = H.kidsOf(p).length ? '1' : '';
    ctx.pid = kid.id;
    if (!kid.alive) ctx.skip = 1;
    return { kid };
  };

  // ================================================================== the night road
  const EL = 'ak_elope';
  const elope = (p, ctx) => {
    const hi = H.hi(p), town = H.town(p, EL);
    const lv = H.get(p, EL, 'lv', () => {
      const old = A.relsOf(p, ['lover']).map(x => x.p).find(q => q.alive && !H.spouse(q) && A.isAdult(q));
      return old || H.mk(p, { age: H.adj(p) + A.ri(-3, 2), sex: likes(p), status: hi ? 'peasant' : 'artisan' });
    });
    const lp = H.get(p, EL, 'lp', () => H.mk(p, { age: Math.min(70, H.adj(lv) + 26), sex: 'M', status: lv.status, sur: lv.sur, surMode: lv.surMode, occ: hi ? "your family's falconer" : 'the reeve' }));
    ctx.town = town; H.tok(ctx, 'lv', lv); H.tok(ctx, 'lp', lp);
    ctx.lpJob = hi ? 'falconer' : 'reeve';
    ctx.wid = H.given(p, EL, 'wid', lv.sex === 'F' ? 'M' : 'F', p.cult);
    ctx.widKind = lv.sex === 'F' ? 'widower' : 'widow'; ctx.widHis = lv.sex === 'F' ? 'his' : 'her';
    ctx.br = H.given(p, EL, 'br', 'M', lv.cult);
    ctx.wed = p.spouse === lv.id ? '1' : '';
    ctx.pid = lv.id;
    if (!lv.alive) ctx.skip = 1;
    return { lv, lp };
  };

  // ================================================================== the will
  const WILL = 'ak_will';
  const will = (p, ctx) => {
    const town = H.town(p, WILL);
    const par = H.get(p, WILL, 'par', () => {
      const d = (p.parents || []).map(A.P).filter(q => q && !q.alive).sort((a, b) => (b.died || 0) - (a.died || 0))[0];
      if (d) return d;
      const q = H.mk(p, { age: H.adj(p) + 28, sex: 'M' }); A.kill(q, 'old age', true); return q;
    });
    const comp = H.get(p, WILL, 'comp', () => H.mk(p, { age: Math.max(40, Math.min(62, ((par.died || A.S.year) - par.born) * 16 / (GD.RACES[par.race] || GD.RACES.human).adult - 6)), sex: opp(par.sex), occ: 'kept house for your ' + (par.sex === 'F' ? 'mother' : 'father') }));
    const sib = A.relsOf(p, ['sibling']).map(x => x.p).find(q => q.alive && A.isAdult(q));
    ctx.town = town; H.tok(ctx, 'par', par); H.tok(ctx, 'comp', comp); if (sib) H.tok(ctx, 'sib', sib);
    ctx.buyer = H.given(p, WILL, 'buyer', 'M', p.cult);
    ctx.owner = H.given(p, WILL, 'owner', 'M', p.cult);
    ctx.owned = own(p, WILL) ? '1' : '';
    ctx.pid = comp.id;
    return { par, comp, sib };
  };

  // ================================================================== the red cow
  const DOW = 'ak_dowry';
  const dowry = (p, ctx) => {
    const hi = H.hi(p);
    const old = H.get(p, DOW, 'cr', () => H.mk(p, { age: Math.min(66, H.adj(p) + 12), sex: 'M', occ: hi ? 'a lord with a long memory' : 'a horse-breeder with a long memory' }));
    // dead before it is settled: the paper passes to his son, like the debt
    const cr = old.alive ? old : H.get(p, DOW, 'crHeir', () => H.mk(p, { age: Math.max(24, Math.min(50, H.adj(old) - 26)), sex: 'M', parents: [old.id], sur: old.sur, surMode: old.surMode, occ: old.occ }));
    ctx.lead = cr === old ? '' : `Old ${old.given} is dead, and his son ${cr.given} has the paper now. `;
    ctx.town = H.town(p, DOW); H.tok(ctx, 'cr', cr);
    ctx.ga = H.given(p, DOW, 'ga', 'F', p.cult);
    ctx.sum = H.price(p, 60, 0.25); ctx.half = H.price(p, 30, 0.12);
    ctx.beast = hi ? 'horse' : 'plough-ox';
    ctx.pid = cr.id;
    if (!cr.alive) ctx.skip = 1;
    return { cr };
  };
  // the match that would settle it: your own unmarried child, or you, or a cousin's child (named only)
  const dowryMatch = (p, ctx, cr) => {
    const a = H.st(p, DOW);
    let kin = A.P(a.who.kin);
    if (!kin) {
      kin = H.kidsOf(p).filter(q => H.adj(q) >= 14 && H.adj(q) <= 30 && !H.spouse(q)).sort((x, y) => x.born - y.born)[0] || (!H.spouse(p) ? p : null);
      if (kin) H.keep(p, DOW, 'kin', kin);
    }
    const ksex = kin ? kin.sex : H.name(p, DOW, 'nsex', () => (A.chance(0.5) ? 'F' : 'M'));
    const gc = H.get(p, DOW, 'mate', () => H.mk(p, { age: kin ? H.adj(kin) + A.ri(-2, 3) : 19, sex: kin === p ? likes(p) : opp(ksex), parents: [cr.id], sur: cr.sur, surMode: cr.surMode, status: cr.status }));
    H.tok(ctx, 'gc', gc);
    if (kin === p) { ctx.who = 'you marry'; }
    else if (kin) { H.tok(ctx, 'kin', kin); ctx.who = 'your ' + ctx.kinSD + ' ' + kin.given + ' marries'; }
    else { ctx.kin = H.given(p, DOW, 'niece', ksex, p.cult); ctx.who = "your cousin's " + (ksex === 'F' ? 'girl' : 'boy') + ' ' + ctx.kin + ' marries'; }
    return gc;
  };

  // ================================================================== the old ground
  const LAND = 'ak_land';
  const land = (p, ctx) => {
    const ow = H.get(p, LAND, 'ow', () => H.mk(p, { age: Math.min(70, H.adj(p) + 8), sex: 'M', status: 'peasant', occ: 'a grazier' }));
    const tn = H.get(p, LAND, 'tn', () => H.mk(p, { age: Math.min(66, H.adj(p) + 16), sex: 'M', status: 'peasant', occ: 'an old cottager' }));
    ctx.town = H.town(p, LAND); H.tok(ctx, 'ow', ow); H.tok(ctx, 'tn', tn);
    ctx.ground = H.name(p, LAND, 'ground', () => A.pick(['the Long Acre', 'Crow Hill', 'Thorn Garth', 'the Highfield', 'Hollin Ridge', 'the Steadings']));
    ctx.price = H.price(p, 150, 0.15); ctx.cheap = H.price(p, 100, 0.08);
    ctx.owned = own(p, LAND) ? '1' : '';
    ctx.pid = ow.id;
    return { ow, tn };
  };

  // ================================================================== your father's other house
  const SF = 'ak_second';
  const second = (p, ctx) => {
    const fa = H.get(p, SF, 'fa', () => H.father(p) || H.mk(p, { age: H.adj(p) + 28, sex: 'M' }));
    const hi = H.hi(p);
    const ow = H.get(p, SF, 'ow', () => H.mk(p, { age: Math.max(30, Math.min(60, H.adj(fa) - 12)), sex: 'F', occ: hi ? 'keeps a tall house on the river' : "keeps a chandler's shop" }));
    const hs = H.get(p, SF, 'hs', () => {
      const q = H.mk(p, { age: Math.max(14, Math.min(40, H.adj(p) - A.ri(4, 10))), parents: [fa.id, ow.id], sur: ow.sur, surMode: ow.surMode, status: ow.status });
      q.flags.bastard = true;
      if (!fa.children.includes(q.id)) fa.children.push(q.id);
      if (!ow.children.includes(q.id)) ow.children.push(q.id);
      return q;
    });
    const mo = H.mother(p);
    ctx.town = H.town(p, SF); H.tok(ctx, 'fa', fa); H.tok(ctx, 'ow', ow); H.tok(ctx, 'hs', hs);
    ctx.faAlive = fa.alive ? '1' : ''; ctx.moAlive = mo && mo.alive ? '1' : '';
    ctx.yrs = H.num(Math.max(2, Math.round(A.age(hs)) + 1));
    ctx.pcBS = p.sex === 'F' ? 'sister' : 'brother';
    ctx.owHouse = hi ? 'a tall house on the river' : "a chandler's shop"; ctx.lane = hi ? 'the river house' : 'Tallow Lane';
    ctx.gift = hi ? 'a basket of pears' : 'a basket of candles';
    ctx.pid = fa.id;
    return { fa, ow, hs };
  };

  const EVS = [
    // ================================================================== the feud (six scenes)
    { id: 'ak_feud_1', title: 'Blood at the horse fair', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { feud(p, ctx); },
      text: 'Your cousin {cuz} is pulled out of the mill-race below the {home} horse fair with his skull broken. The night before, he argued over a grey mare with {son}, the son of {foe}, {foeRole}. {son} rode out before dawn. Your uncle sits by the body with a boar-spear across his knees, and waits for you to speak.',
      choices: [
        { t: 'Take it to the magistrate, and do it by law', check: { s: 'persuasion', s2: 'int', d: 45 },
          win: { r: 'The magistrate hears you out. {foe} pays the blood-money into court, counting it slowly so the room can watch.', fx: { honor: 2, coin: 20, them: { op: -10, type: 'enemy' }, arc: { mark: 'akf_law' } } },
          lose: { r: 'The magistrate dines with {foe} on Sundays. He writes it down as a drowning.', fx: { honor: 1, happy: -4, them: { op: -15, type: 'enemy' }, arc: { mark: 'akf_scorned' } } } },
        { t: 'Ride after {son} with your uncle', check: { s: 'riding', s2: 'str', d: 50 },
          win: { r: 'You run him down at the ford. Your uncle breaks his arm with the spear-butt, and you bring him back tied to his own saddle.', fx: { fame: 2, honor: -1, them: { op: -30, type: 'enemy' }, arc: { mark: 'akf_caught' } } },
          lose: { r: '{son} is waiting at the ford with two cousins of his own. You come home bleeding. Your uncle comes home across his horse.', fx: { wound: 'deep_cut', health: -10, them: { op: -25, type: 'enemy' }, arc: { mark: 'akf_ford' } } } },
        { t: "Go to {foe}'s door and ask the blood-price", r: '{foe} pays it at his own gate, forty suns and a heifer, in front of the whole street. It is a fair price. Your uncle will not speak to you.',
          fx: { coin: 40, honor: -2, happy: -2, them: { op: -5, type: 'enemy' }, arc: { mark: 'akf_price' } } },
      ] },
    { id: 'ak_feud_2', title: 'The rick-fire', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { feud(p, ctx); },
      text: p => `{lead}In the dry month your hay-rick burns in the night, and the barn with it. Nobody saw anything. Everyone knows. ${M(p, 'akf_caught') ? '{son} came back from the ford with a crooked arm, and nobody over there has forgotten.'
        : M(p, 'akf_ford') ? "You buried your uncle in the spring. {foe}'s men still laugh about the ford."
        : M(p, 'akf_price') ? 'Taking the blood-price did not end it. It made your family look cheap.'
        : M(p, 'akf_law') ? "The court roll did not change anybody's mind." : M(p, 'akf_scorned') ? "The magistrate wrote {cuz} down as a drowning, and dines with {foe} on Sundays." : "Nothing was ever settled for {cuz}."} Your cousins are sharpening things in the yard.`,
      choices: [
        { t: 'Rebuild, and say nothing', r: 'You rebuild with borrowed timber and keep your mouth shut. Silence costs more than hay.', fx: { coinPct: -0.05, wil: 1, arc: { mark: 'akf_quiet' } } },
        { t: "Burn {foe}'s {foeSeat} in return", check: { s: 'stealth', s2: 'spd', d: 50 },
          win: { r: 'It burns to the stones. Nobody saw anything.', fx: { honor: -4, happy: 3, them: { op: -20 }, arc: { mark: 'akf_burned' } } },
          lose: { r: 'A dog wakes the house. You are seen running, and named in the church porch on Sunday.', fx: { honor: -6, happy: -3, them: { op: -20 }, arc: { mark: 'akf_seen' } } } },
        { t: 'Ask the priest to call both families to church', check: { s: 'persuasion', s2: 'wil', d: 50 },
          win: { r: 'The priest shames both families from the pulpit, by name. For a season nobody burns anything.', fx: { piety: 2, honor: 2, arc: { mark: 'akf_truce' } } },
          lose: { r: "{foe}'s people do not come. Yours do, and sit there being looked at.", fx: { piety: 1, happy: -3, arc: { mark: 'akf_quiet' } } } },
      ] },
    { id: 'ak_feud_3', title: 'The market road', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { feud(p, ctx); },
      text: p => `{lead}Coming home from the market at {town} at dusk, you find three of {foe}'s kin across the road, with cudgels and one hatchet. ${M(p, 'akf_burned') || M(p, 'akf_seen') ? 'They have not forgotten the fire.' : M(p, 'akf_truce') ? "So much for the priest's peace." : M(p, 'akf_quiet') ? 'You rebuilt the rick and said nothing. They took that for an answer.' : 'The rick was not the end of it.'} Your cart is between you and them, and the ditch beside the road is deep.`,
      choices: [
        { t: 'Stand and fight them in the road', check: { s: 'melee', s2: 'str', d: 50 },
          win: { r: "You break a cudgel and a collarbone, and they run. The collarbone is {son}'s.", fx: { fame: 2, health: -6, them: { op: -15 }, arc: { mark: 'akf_fought' } } },
          lose: { r: 'They beat you in the road and roll you into the ditch. A carter finds you at dawn.', fx: { wound: 'broken_ribs', health: -15, arc: { mark: 'akf_beaten' } } } },
        { t: 'Leave the cart and run for the fields', check: { s: 'athletics', s2: 'spd', d: 40 },
          win: { r: 'You lose the cart and the cabbages, and keep your teeth.', fx: { coin: -15, happy: -3, arc: { mark: 'akf_ran' } } },
          lose: { r: 'They catch you at the stile.', fx: { wound: 'broken_nose', health: -8, arc: { mark: 'akf_beaten' } } } },
        { t: 'Talk, and offer them the cart', r: 'They take the cart, the ox and your boots, and let you walk home barefoot. The valley hears of it by Sunday.',
          fx: { coinPct: -0.03, honor: -3, happy: -4, arc: { mark: 'akf_paid' } } },
      ] },
    { id: 'ak_feud_4', title: 'The kiss of peace', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { feud(p, ctx); },
      text: p => `{lead}The bishop's dean rides through {home} and hears of the feud. On the feast of the saints both families are to kneel in the church and give each other the kiss of peace, or both will be fined. ${M(p, 'akf_beaten') ? 'Your ribs still ache when it rains.' : M(p, 'akf_fought') ? '{son} will be there, with his arm in a sling.' : M(p, 'akf_paid') ? "Your ox is pulling {foe}'s plough." : M(p, 'akf_ran') ? 'They still ask after your cabbages at the market.' : 'The road has been quiet, which is not the same as peace.'} {foe} says he will come if you do.`,
      choices: [
        { t: 'Kneel and kiss {foe}', r: 'You kneel and kiss him on both cheeks. He smells of sour wine. It is done in front of the whole parish.', fx: { honor: 3, piety: 3, happy: -2, them: { op: 15 }, arc: { mark: 'akf_kissed' } } },
        { t: 'Kneel, but turn your face from him', r: 'You kneel. You do not kiss him. The dean pretends not to see, and the whole parish sees.', fx: { honor: 1, wil: 1, them: { op: -10 }, arc: { mark: 'akf_refused' } } },
        { t: 'Stay away and pay the fine', r: 'You pay the fine and go to market that day instead. People mark the empty place on your bench.', fx: { coinPct: -0.04, piety: -3, happy: 2, arc: { mark: 'akf_away' } } },
      ] },
    { id: 'ak_feud_5', title: 'Young blood', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => {
        const { foe } = feud(p, ctx);
        const yk = H.kidsOf(p).find(k => H.adj(k) >= 14 && H.adj(k) <= 26 && !H.spouse(k));
        let ys;
        if (yk) { H.tok(ctx, 'yk', yk); ctx.ykRel = 'Your ' + ctx.ykSD; ys = yk.sex; }
        else { ys = H.name(p, FEUD, 'yks', () => (A.chance(0.5) ? 'F' : 'M')); ctx.yk = H.given(p, FEUD, 'yk', ys, p.cult); ctx.ykRel = "Your cousin's " + (ys === 'F' ? 'girl' : 'boy'); }
        ctx.ym = H.name(p, FEUD, 'ym', () => A.givenName(foe.cult, opp(ys)));
      },
      text: p => `{lead}{ykRel} {yk} and {foe}'s youngest grandchild, {ym}, are found together in the tithe barn after the harvest dance. Both families know it by noon. ${M(p, 'akf_kissed') ? '{foe} sends word that he would sooner have a wedding than another funeral.' : M(p, 'akf_refused') ? "{foe} has not forgotten the kiss you would not give, and his sons remember it too." : M(p, 'akf_away') ? "{foe} knelt that day and you were at market. His sons have not let it go." : "{foe}'s sons are talking about what they will do to {yk}."} {yk} says they will marry, or go into the river together.`,
      choices: [
        { t: 'Let them marry, and end it there', r: 'They marry at Martinmas. Both families stand on their own side of the church, and nobody brings a knife.', fx: { coinPct: -0.04, honor: 2, them: { op: 20 }, arc: { mark: 'akf_wed' } } },
        { t: 'Send {yk} away to kin at {town}', r: "{yk} goes, in tears, on the carrier's cart. {ym} stands at the crossroads to watch it out of sight.", fx: { happy: -4, wil: 1, them: { op: -5 }, arc: { mark: 'akf_sent' } } },
        { t: 'Make {foe} pay a bride-price first', check: { s: 'trade', s2: 'int', d: 50 },
          win: { r: '{foe} pays it, to his own surprise. The wedding is set for spring.', fx: { coin: 60, them: { op: 5 }, arc: { mark: 'akf_wed' } } },
          lose: { r: '{foe} laughs at the sum, and the match is off. {yk} does not forgive you.', fx: { happy: -5, them: { op: -10 }, arc: { mark: 'akf_sent' } } } },
      ] },
    { id: 'ak_feud_6', title: 'The last of the feud', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => {
        const { foe, son } = feud(p, ctx);
        const heir = son.alive ? son : H.get(p, FEUD, 'heir', () => H.mk(p, { age: Math.max(18, H.adj(p) - 12), sex: 'M', parents: [son.id], sur: foe.sur, surMode: foe.surMode }));
        H.tok(ctx, 'foe', foe); H.tok(ctx, 'heir', heir); ctx.pid = heir.id; ctx.foeDead = foe.alive ? '' : '1';
      },
      text: (p, ctx) => `${ctx.foeDead ? '{foe} is dead of the dropsy, and {heir} has his place. {heir} sends for you, alone.' : '{foe} is dying of the dropsy in the room over his {foeSeat}. He sends for you, alone, and {heir} shows you up the stair.'} ${M(p, 'akf_wed') ? 'Your families share a cradle now.' : M(p, 'akf_sent') ? 'You sent one of your own away to stop a wedding. There has been blood between your families for {yrs} years.' : 'There has been blood between your families for {yrs} years.'} ${ctx.foeDead ? '{heir}' : 'The old man'} wants to know if it ends here.`,
      choices: [
        { t: 'Swear the peace with {heir}, hand on hand', r: 'You swear it with {heir}, hands together on the Book, before both families. The ford is only a ford again.',
          fx: { honor: 4, them: { op: 50, type: 'friend' }, sworn: true, flag: 'ak_feud_peace', arc: { go: 'end' } } },
        { t: 'Tell them it ends when their line does', r: 'You say it plainly. {heir} hears it, and so do your children. It will outlive you both.',
          fx: { wil: 2, honor: -2, them: { op: -60, type: 'enemy' }, epithet: 'the Unforgiving', flag: 'ak_feud_open', arc: { go: 'end' } } },
        { t: 'Ask the mill-right as the price of peace', check: { s: 'intrigue', s2: 'int', d: 55 },
          win: { r: 'You get it in writing: the mill-right on the lower stream, for ever. {heir} signs as if signing away a hand.', fx: { akin: 'mill', them: { op: -25, type: 'enemy' }, flag: 'ak_feud_mill', arc: { go: 'end' } } },
          lose: { r: '{heir} tears your terms in half in front of you. The feud goes on, and now it has a price on it.', fx: { happy: -3, them: { op: -40, type: 'enemy' }, flag: 'ak_feud_open', arc: { go: 'end' } } } },
      ] },

    // ================================================================== a child you did not know (five scenes)
    { id: 'ak_secret_1', title: 'A letter from {town}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { secret(p, ctx); },
      text: (p, ctx) => {
        const ol = H.who(p, SEC, 'ol'), alive = ol && ol.alive, s = H.spouse(p);
        const tail = s ? '{sp} is in the next room.' : 'Nobody else in {home} knows.';
        const kin = A.C.flag(p, 'ak_sf_kin') ? ' You know what a hidden house costs; you have a half-sibling to show for it.' : '';
        if (p.sex === 'F') return `A {kidBG} of {kidAge} stands at your door with a nun's letter. {kid} is the child you bore at {young} and left with the sisters at {town}, and the nuns have told {kidHim} your name. {kidHis} father was {ol}. ${tail}${kin}`;
        return `${alive ? 'A letter comes from {town} in a hand you knew once. {ol} writes that she has' : 'A priest from {town} brings a letter. {ol}, whom you knew one summer, is dead of a fever, and leaves'} a {kidBG} of {kidAge}, {kid}, with your crooked thumb and nobody to feed {kidHim}. ${alive ? 'She asks nothing for herself.' : 'She named you on her last day.'} ${tail}${kin}`;
      },
      choices: [
        { t: p => (p.sex === 'F' ? 'Bring {kidHim} in to the fire' : 'Go to {town} and see {kidHim}'), r: '{kid} eats like a wolf and says almost nothing. When {kidHe} laughs, it is your laugh.', fx: { honor: 2, happy: -3, them: { op: 15 }, arc: { mark: 'aks_saw' } } },
        { t: 'Send money, and no name', r: 'You send money by the carrier, wrapped in a cloth with no mark on it. It will go every quarter-day.', fx: { coinPct: -0.03, them: { op: 3 }, arc: { mark: 'aks_money' } } },
        { t: 'Say it is no child of yours', r: 'You say so, and say it well. The {kidBG} goes away. The face stays in your head.', fx: { honor: -3, happy: 1, them: { op: -20 }, arc: { mark: 'aks_denied' } } },
      ] },
    { id: 'ak_secret_2', title: 'A trade for {kid}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { secret(p, ctx); },
      text: p => `${M(p, 'aks_saw') ? 'You have been to see {kid} three times now.' : M(p, 'aks_money') ? 'Your money reaches {kid} every quarter-day, and a letter comes back in a careful hand.' : 'You denied {kid}. {kidHe} came to {home} anyway, and works at the tannery.'} {kid} is {kidAge} and wants a trade. A {craft} at {town} will take {kidHim} as apprentice, for a fee, but wants to know whose {kidSD} {kidHe} is before he signs.`,
      choices: [
        { t: 'Pay the fee and sign your own name', r: 'You sign your own name on the indenture, plain. The {craft} raises an eyebrow, and takes the fee.', fx: { coinPct: -0.04, honor: 2, them: { op: 20 }, arc: { mark: 'aks_signed' } } },
        { t: 'Pay the fee and sign a false name', r: 'The indenture names a dead uncle in another county. The {craft} does not care, so long as the money is good.', fx: { coinPct: -0.04, honor: -2, happy: 2, them: { op: 8 }, arc: { mark: 'aks_false' } } },
        { t: 'Take {kidHim} into your house as a servant', r: '{kid} sleeps over your kitchen and fetches your water. You both know what {kidHe} is. Nobody says it.', fx: { happy: -2, them: { op: 10 }, arc: { mark: 'aks_servant' } } },
      ] },
    { id: 'ak_secret_3', title: 'Somebody knows', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => {
        const { s } = secret(p, ctx);
        if (!s) { const m = H.mother(p), sib = A.relsOf(p, ['sibling']).map(x => x.p).find(q => q.alive && A.isAdult(q)); ctx.talker = m && m.alive ? 'Your mother' : sib ? 'Your ' + (sib.sex === 'F' ? 'sister ' : 'brother ') + sib.given : "The reeve's wife"; }
      },
      text: (p, ctx) => (H.spouse(p)
        ? `{sp} has worked it out: ${M(p, 'aks_servant') ? 'the servant in the kitchen who has your laugh' : M(p, 'aks_signed') ? 'your own name on an indenture at {town}' : M(p, 'aks_false') ? 'a dead uncle on an indenture, written in your hand' : 'the money that goes to {town} every quarter-day'}. {sp} is waiting at the table when you come in, with the lamp lit and the door shut, and does not ask. {sp} waits for you to say it.`
        : `{talker} has worked it out, from {kid}'s face or the money, and is telling it at the well. By Sunday the whole of {home} will have it, one way or another. The only question left is whose way.`),
      choices: [
        { t: 'Tell the whole truth', r: (p, ctx) => (ctx.sp ? 'You tell it all, from the summer on. {sp} hears you out, and then goes to sleep at a sister\'s for a week.' : 'You tell it all, at the well, before anyone else can. It is a short story, told plainly.'),
          fx: { honor: 4, happy: -4, rel: { who: 'spouse', op: -15 }, arc: { mark: 'aks_truth' } } },
        { t: 'Lie, and lie well', check: { s: 'deception', s2: 'int', d: 50 },
          win: { r: "You have a story ready about a dead cousin's child. It holds, for now.", fx: { honor: -2, arc: { mark: 'aks_lied' } } },
          lose: { r: 'The story comes apart over supper. Now there is the child, and the lie.', fx: { honor: -4, happy: -5, rel: { who: 'spouse', op: -25 }, arc: { mark: 'aks_caught' } } } },
        { t: 'Say nothing, and let them think what they like', r: 'You say nothing at all. It is not a lie. It is not much else, either.', fx: { wil: 1, happy: -2, arc: { mark: 'aks_silent' } } },
      ] },
    { id: 'ak_secret_4', title: 'The lock-up at {town}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { secret(p, ctx); },
      text: p => `{kid} is in the lock-up at {town}: a fight at the hiring fair, a man's jaw broken, and the man's father on the jury. A parent's word would go a long way with the bench. ${M(p, 'aks_truth') ? 'Everyone knows whose {kidSD} {kid} is now.' : M(p, 'aks_caught') ? 'Your story came apart at home, and the bench will have heard some of it.' : M(p, 'aks_lied') ? "At home {kid} is a dead cousin's child. That will not hold in open court." : 'Nobody at {town} knows whose {kidSD} {kidHe} is, unless you say it in open court.'}`,
      choices: [
        { t: 'Stand up in court as {kidHis} parent', r: 'You stand up and say it, in front of the bench and half of {town}. The fine is light. Your name is not.', fx: { honor: 3, happy: -2, fame: 1, them: { op: 25 }, arc: { mark: 'aks_stood' } } },
        { t: "Pay the injured man's family, quietly", r: "The injured man's father finds he cannot remember the fight. {kid} is out by Friday, and does not know why.", fx: { coinPct: -0.06, them: { op: 8 }, arc: { mark: 'aks_paid' } } },
        { t: 'Let {kidHim} take {kidHis} chances', r: 'The bench gives {kid} a month and a fine. {kidHe} pays the fine with {kidHis} tools.', fx: { wil: 1, them: { op: -20 }, arc: { mark: 'aks_left' } } },
      ] },
    { id: 'ak_secret_5', title: 'Your name', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { secret(p, ctx); },
      text: p => `{kid} is grown now, {kidAge}, and asks you plainly: will you call {kidHim} your {kidSD} before the priest and the parish, and write it in the register, so {kidHe} can carry your name? ${M(p, 'aks_stood') ? 'You have said it once already, in a courtroom.' : M(p, 'aks_left') ? '{kidHe} has not forgotten the lock-up at {town}.' : M(p, 'aks_denied') ? 'You denied {kidHim} once, at your own door.' : M(p, 'aks_paid') ? '{kidHe} never learned who paid the man with the broken jaw.' : M(p, 'aks_silent') ? '{kidHe} has had your silence for years, and asks anyway.' : 'It is the first thing {kidHe} has ever asked of you.'}`,
      choices: [
        { t: 'Before the priest: my {kidSD}', r: 'The priest writes it in the register, with the date. {kid} is your {kidSD} in ink now, with a share of what you leave.',
          fx: { akin: 'acknowledge', honor: 2, happy: 3, them: { op: 30 }, flag: 'ak_sec_named', arc: { go: 'end' } } },
        { t: 'A purse and a start, but not your name', r: 'You give {kid} enough to set up alone. {kidHe} takes it and thanks you like a stranger.',
          fx: { coinPct: -0.1, them: { op: 5 }, deed: 'Set up a child you never named', flag: 'ak_sec_settled', arc: { go: 'end' } } },
        { t: 'Tell {kidHim} never to ask again', r: '{kid} does not ask again. {kidHe} goes back to {town} and takes another name for good.',
          fx: { wil: 1, them: { op: -40 }, flag: 'ak_sec_denied', arc: { go: 'end' } } },
      ] },

    // ================================================================== your uncle's mill (four scenes)
    { id: 'ak_inherit_1', title: "Uncle {u}'s mill", trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { inherit(p, ctx); },
      text: 'Your {side} brother {u}, who never married, is buried at {town}. He leaves a mill on the stream below the town: two stones, a sound roof, a debt to the abbey, and no will that anyone can find. Your cousin {cz} nursed him at the end. You were his godchild. The miller\'s boy keeps the wheel turning, and waits to hear who pays him.',
      choices: [
        { t: 'Ride to {town} and take the keys', r: 'You are in the mill-house by dark with the keys on your belt. Possession, the lawyers say, is most of the law. {cz} hears of it by morning.', fx: { honor: -2, happy: 2, them: { op: -20, type: 'cousin' }, arc: { mark: 'aki_keys' } } },
        { t: 'Write to {cz}: halves, and no lawyers', r: '{cz} writes back warmly, and does not say yes.', fx: { honor: 2, them: { op: 10, type: 'cousin' }, arc: { mark: 'aki_halves' } } },
        { t: 'Pay a man of law at {capital} to find a will', r: 'The man of law takes your money and a list of every notary between {town} and the sea.', fx: { coinPct: -0.03, skill: { learning: 1 }, them: { op: 0, type: 'cousin' }, arc: { mark: 'aki_lawyer' } } },
      ] },
    { id: 'ak_inherit_2', title: "{u}'s housekeeper", trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { inherit(p, ctx); },
      text: p => `Old {hk}, who kept {u}'s house, swears that on his last night he said the mill was for {cz}, "who came when I was sick." {cz} has her mark on a sworn paper. ${M(p, 'aki_keys') ? 'You are sleeping in the mill-house; {cz} has taken a room at the inn across the lane, to watch.' : M(p, 'aki_halves') ? '{cz} has stopped answering your letters about halves.' : M(p, 'aki_lawyer') ? "Your man of law has found no will, and says a housekeeper's word is worth whatever a jury thinks of her." : "There is still no will, and now there is a sworn paper."}`,
      choices: [
        { t: 'Find out what {hk} was promised for it', check: { s: 'intrigue', s2: 'ins', d: 50 },
          win: { r: 'A new cloak, a pig, and a cottage for life, from {cz}. A jury will like hearing that.', fx: { skill: { intrigue: 1 }, them: { op: -10 }, arc: { mark: 'aki_bought' } } },
          lose: { r: 'You find nothing, and {hk} tells the whole parish you called her a liar.', fx: { honor: -2, happy: -2, arc: { mark: 'aki_shamed' } } } },
        { t: 'Pay {hk} to remember it differently', r: '{hk} takes your money, counts it twice, and remembers that {u} was wandering in his mind that night.', fx: { coinPct: -0.03, honor: -4, arc: { mark: 'aki_bribed' } } },
        { t: 'Believe her', r: 'You believe her, and say so. It costs you something to say it, and {cz} notices.', fx: { honor: 3, happy: -3, them: { op: 12 }, arc: { mark: 'aki_believed' } } },
      ] },
    { id: 'ak_inherit_3', title: 'The court at {town}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { inherit(p, ctx); },
      text: p => `The case comes before {court} at {town}: twelve jurors, a clerk with a cold, and the steward in the chair. ${M(p, 'aki_bribed') ? '{hk} will swear the opposite of what she swore last spring.' : M(p, 'aki_bought') ? 'You have the cloak, the pig and the cottage to tell them about.' : M(p, 'aki_believed') ? 'You have not much of a case, and everybody knows it.' : M(p, 'aki_shamed') ? '{hk} has told the parish you called her a liar, and will tell the jury the same.' : 'Nobody has a will. Everybody has a story.'} {cz} has hired a man of law with a voice like a church bell.`,
      choices: [
        { t: 'Plead it yourself', check: { s: 'persuasion', s2: 'int', d: 55 },
          win: { r: 'You tell it plainly, and the jury likes plain. They find for you after an hour and a barrel.', fx: { fame: 1, arc: { mark: 'aki_won' } } },
          lose: { r: 'The church bell rings louder. The jury finds for {cz}.', fx: { happy: -3, arc: { mark: 'aki_lost' } } } },
        { t: 'Hire a better man of law from {capital}', check: { s: 'persuasion', s2: 'int', d: 40 },
          win: { r: 'Your man from {capital} is louder than a bell and twice as dear. The jury finds for you.', fx: { coinPct: -0.06, arc: { mark: 'aki_won' } } },
          lose: { r: 'Your man from {capital} is very fine, and the jury is from {town}. They find for {cz}.', fx: { coinPct: -0.06, happy: -2, arc: { mark: 'aki_lost' } } } },
        { t: 'Settle with {cz} on the court steps', r: 'You settle on the steps: the mill to share, the debt to share, and the lawyers sent home hungry.', fx: { honor: 1, them: { op: 10 }, arc: { mark: 'aki_settled' } } },
      ] },
    { id: 'ak_inherit_4', title: 'The mill', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { inherit(p, ctx); },
      text: p => `${M(p, 'aki_won') ? "The mill is yours by the court roll, with the abbey's debt on it. {cz} is selling {czHis} horse to pay {czHis} man of law." : M(p, 'aki_lost') ? "The mill is {cz}'s by the court roll. {czHe} has put in a new stone and painted the door." : M(p, 'aki_settled') ? 'You settled on the court steps, and meet at the mill now to finish it, without a clerk.' : 'You and {cz} meet at the mill to finish it between you, without a clerk.'} The wheel turns, whoever owns it. The miller's boy is waiting to be told who pays him.`,
      choices: [
        { t: p => (M(p, 'aki_won') ? 'Keep the mill, and its debt' : "Buy out {cz}'s half, and keep the mill"), req: p => !M(p, 'aki_lost'),
          r: 'The mill is yours: the stones, the wheel, the debt to the abbey and the boy. {cz} does not come to the feast.',
          fx: { akin: 'mill', coin: -40, coinPct: -0.05, them: { op: -25 }, flag: 'ak_inh_mill', arc: { go: 'end' } } },
        { t: 'Give the mill to {cz}, and keep the peace', req: p => !M(p, 'aki_lost'),
          r: '{cz} weeps, which you did not expect, and asks you to stand godparent to {czHis} next child.',
          fx: { honor: 4, them: { op: 40 }, flag: 'ak_inh_gave', arc: { go: 'end' } } },
        { t: "Shake {cz}'s hand at the mill door", req: p => M(p, 'aki_lost'),
          r: 'You shake {czHis} hand at the door, in front of the boy. It is the hardest thing you do that year.',
          fx: { honor: 3, them: { op: 30 }, flag: 'ak_inh_lost', arc: { go: 'end' } } },
        { t: 'Appeal to the court at {capital}', req: p => M(p, 'aki_lost'), check: { s: 'persuasion', s2: 'wil', d: 55 },
          win: { r: 'The court at {capital} overturns {town}. The mill is yours, and {cz} will never speak to you again.', fx: { akin: 'mill', coin: -40, coinPct: -0.05, them: { op: -40 }, flag: 'ak_inh_mill', arc: { go: 'end' } } },
          lose: { r: '{capital} agrees with {town}, and charges more for it.', fx: { coin: -40, coinPct: -0.08, them: { op: -30 }, flag: 'ak_inh_lost', arc: { go: 'end' } } } },
      ] },

    // ================================================================== the one who came back (five scenes)
    { id: 'ak_sibling_1', title: 'A stranger at the gate', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { sibling(p, ctx); },
      text: (p, ctx) => `A {sibMW} with a sailor's walk and a burned hand stands at your gate and says your mother's name. {sib}, your elder {sibBS}, was sold to a galley-master in the famine year, when you were too small to remember. ${ctx.moAlive ? 'Your mother still lights a candle for {sibHim} every winter.' : 'Your mother lit a candle for {sibHim} every winter until she died.'} {sibHe} knows the words of your mother's song.`,
      choices: [
        { t: 'Take {sibHim} in, and send for the family', r: '{sib} sleeps two days and eats like three. Once, at night, {sibHe} cries where {sibHe} thinks nobody can hear.', fx: { happy: 4, them: { op: 25, type: 'sibling' }, arc: { mark: 'akb_welcome' } } },
        { t: 'Ask things only your own blood would know', check: { s: 'ins', s2: 'int', d: 45 },
          win: { r: "{sibHe} knows the dog's name, the cracked well, and what your father said the night the barn fell. It is {sib}.", fx: { wil: 1, them: { op: 15, type: 'sibling' }, arc: { mark: 'akb_tested' } } },
          lose: { r: '{sibHe} gets half of it right. It could be {sib}. It could be someone who shared a galley bench with {sib}.', fx: { happy: -2, them: { op: 0, type: 'acquaint' }, arc: { mark: 'akb_doubt' } } } },
        { t: 'Give {sibHim} a purse and a bed at the inn', r: '{sib} takes the purse without counting it, and goes to the inn. You lie awake.', fx: { coinPct: -0.02, wil: 1, them: { op: 5, type: 'acquaint' }, arc: { mark: 'akb_inn' } } },
      ] },
    { id: 'ak_sibling_2', title: 'The bailiff from {port}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { sibling(p, ctx); },
      text: p => `${M(p, 'akb_inn') ? '{sib} has been a year at the inn in {home}, on your money.' : '{sib} has been in {home} a year.'} {sibHe} drinks with men you would not, and plays dice for more than {sibHe} has. Now a bailiff from {port} is asking for {sibHim}: a man knifed on the quay two winters ago, by a galley-hand with a burned hand. ${M(p, 'akb_doubt') ? 'You still do not know for certain that {sibHe} is your blood.' : "{sibHe} swears it was the other man's knife."}`,
      choices: [
        { t: 'Hide {sibHim} in the hayloft', r: 'The bailiff searches the house and not the loft. {sib} comes down at dark with straw in {sibHis} hair, grinning.', fx: { honor: -3, them: { op: 15 }, arc: { mark: 'akb_hid' } } },
        { t: "Pay the dead man's family the blood-price", r: 'You pay the widow on the quay at {port}. She spits, and takes it, and swears off the charge.', fx: { coinPct: -0.06, honor: 1, them: { op: 10 }, arc: { mark: 'akb_paid' } } },
        { t: 'Hand {sibHim} to the bailiff', r: '{sib} goes with the bailiff without a word, and does not look back at you.', fx: { honor: 2, happy: -4, them: { op: -40 }, arc: { mark: 'akb_handed' } } },
      ] },
    { id: 'ak_sibling_3', title: "The eldest's share", trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { sibling(p, ctx); },
      text: (p, ctx) => `${M(p, 'akb_handed') ? '{sib} is out of the gaol at {port} with a branded thumb, and nowhere to go but your door.' : M(p, 'akb_hid') ? '{sib} is clear of the law, and still goes up to the loft when a stranger comes up the lane.' : M(p, 'akb_paid') ? "You paid the dead man's widow on the quay, and the charge went with the money." : '{sib} is clear of the law, for now.'} {sibHe} wants the eldest's share of what your parents left, which by the custom of {home} is most of it. ${ctx.faAlive ? 'Your father says the custom is the custom.' : 'The notary says {sibHe} has a case.'}`,
      choices: [
        { t: "Give {sibHim} the eldest's share", r: 'You count it out. {sib} has never held so much at once, and does not know what to do with {sibHis} hands.', fx: { coinPct: -0.15, honor: 3, them: { op: 20 }, arc: { mark: 'akb_gave' } } },
        { t: 'Offer a third, and a place in your work', r: '{sib} takes the third and the work. {sibHe} is good at it, which surprises you both.', fx: { coinPct: -0.05, them: { op: 5 }, arc: { mark: 'akb_third' } } },
        { t: 'Tell {sibHim} the galleys took that right', r: '{sib} goes white around the mouth and says nothing at all. That is worse than shouting.', fx: { wil: 1, them: { op: -25 }, arc: { mark: 'akb_refused' } } },
      ] },
    { id: 'ak_sibling_4', title: 'The galley fever', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { sibling(p, ctx); },
      text: p => `The galley fever comes back on {sib}: the marsh kind, that sleeps in a body for years and wakes. The physician says it will kill {sibHim} this time or the next. {sibHe} asks for a priest, and for you. ${M(p, 'akb_refused') ? 'You have not spoken since the matter of the share.' : M(p, 'akb_gave') ? '{sibHe} has spent most of the share already.' : M(p, 'akb_third') ? '{sibHe} has worked beside you since the share was settled.' : M(p, 'akb_welcome') ? '{sibHe} has slept under your roof since the day {sibHe} came to the gate.' : ''}`,
      choices: [
        { t: 'Nurse {sibHim} yourself', check: { s: 'medicine', s2: 'sta', d: 50 },
          win: { r: 'The fever breaks on the ninth night. {sib} wakes, and asks for beer.', fx: { health: -4, them: { op: 20 }, arc: { mark: 'akb_nursed' } } },
          lose: { r: '{sib} lives. You catch it in turn, and lie a month in the next bed.', fx: { health: -12, wound: 'lungs', them: { op: 15 }, arc: { mark: 'akb_nursed' } } } },
        { t: 'Pay for the physician from {capital}', r: 'The physician bleeds {sib}, purges {sibHim}, and charges you for both. {sib} lives, mostly in spite of him.', fx: { coinPct: -0.05, them: { op: 10 }, arc: 'next' } },
        { t: 'Send the priest, and stay away', r: 'The priest sits with {sib}. You hear from the priest, after, that {sibHe} lived.', fx: { piety: 2, them: { op: -10 }, arc: { mark: 'akb_away' } } },
      ] },
    { id: 'ak_sibling_5', title: 'Kin again, or not', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { sibling(p, ctx); },
      text: (p, ctx) => `${ctx.moAlive ? 'Your mother, old now, sits between you and {sib} at the hearth and will not let go of either hand.' : "You stand with {sib} at your mother's grave in the {home} churchyard."} {sib} has a berth on a ship out of {port} in the spring, or {sibHe} could stay. ${M(p, 'akb_doubt') ? 'You have still not decided what {sibHe} is to you.' : M(p, 'akb_nursed') ? 'You sat out the fever at {sibHis} bedside, and {sibHe} knows what it cost you.' : M(p, 'akb_away') ? 'You sent the priest and did not come yourself. {sibHe} has never said so.' : M(p, 'akb_tested') ? "{sibHe} still remembers the dog's name, and says so in drink." : '{sibHe} asks what you want.'}`,
      choices: [
        { t: 'Swear yourselves kin again, hand on hand', r: 'You swear it, hand on hand, the way your father swore things. {sib} stays, and takes the cottage at the end of the lane.',
          fx: { happy: 3, them: { op: 30, type: 'sibling' }, sworn: true, flag: 'ak_sib_sworn', arc: { go: 'end' } } },
        { t: 'Pay {sibHis} passage, and let {sibHim} go', r: 'You see {sib} off at {port} with a good coat and a purse. {sibHe} waves until the ship is round the point.',
          fx: { coinPct: -0.03, them: { op: 15 }, deed: 'Saw a lost sibling off to sea in a good coat', flag: 'ak_sib_gone', arc: { go: 'end' } } },
        { t: 'Tell {sibHim} {sibHe} is no blood of yours', r: '{sib} takes it the way {sibHe} took the galleys: without a word, and for good.',
          fx: { wil: 1, them: { op: -50, type: 'enemy' }, flag: 'ak_sib_denied', arc: { go: 'end' } } },
      ] },

    // ================================================================== the match (four scenes)
    { id: 'ak_match_1', title: 'An offer for {kin}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { match(p, ctx); },
      text: p => `{fh}, {fhWho}, offers {fhHis} {mateSD} {mate} for your {kinRel} {kin}. The settlement would favour you, and {fh} would stand with your family in any quarrel. {kin} has met {mate} twice and says {mateHe} is "very polite." ${A.C.flag(p, 'ak_bl_told') ? '{fh} has heard about the shaking in your line, and asks anyway.' : ''} {fh} wants an answer by Lady Day.`,
      choices: [
        { t: 'Accept, and settle the terms', r: "You shake on it in {fh}'s counting-room. The wedding is set for midsummer, and the settlement is generous.", fx: { coin: 80, akin: 'wedKin', them: { op: -5 }, arc: 'next' } },
        { t: 'Let {kin} decide', r: '{kin} thinks about it for a week, and says yes, because you asked {kinHim} to think about it.', fx: { happy: 1, akin: 'wedKin', them: { op: 10 }, arc: { mark: 'akm_asked' } } },
        { t: 'Hold out for better terms', check: { s: 'trade', s2: 'persuasion', d: 50 },
          win: { r: '{fh} pays more than {fhHe} meant to, and remembers that you made {fhHim}.', fx: { coin: 160, akin: 'wedKin', arc: { mark: 'akm_haggled' } } },
          lose: { r: '{fh} gives way on nothing, and remembers that you tried.', fx: { coin: 40, happy: -2, akin: 'wedKin', arc: { mark: 'akm_haggled' } } } },
      ] },
    { id: 'ak_match_2', title: 'Letters from {town}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { match(p, ctx); },
      text: p => `{kin} has been married a year and lives in {fh}'s house at {town}. The letters came every week, then every month; now they come in someone else's hand. A carter who delivers to {fh}'s kitchen says {kin} has not been seen at church since Candlemas. ${M(p, 'akm_haggled') ? '{fh} has not forgotten your haggling.' : M(p, 'akm_asked') ? '{kin} chose this, and you let {kinHim}.' : ''}`,
      choices: [
        { t: 'Ride to {town} unannounced', r: "You ride all night and arrive at breakfast, which nobody at {fh}'s table enjoys.", fx: { happy: -2, them: { op: 10 }, arc: { mark: 'akm_rode' } } },
        { t: 'Write to {fh}, politely', r: "{fh} writes back within the week: {kin} is well, and busy, and sends love. It is in {fh}'s hand.", fx: { honor: 1, wil: 1, arc: { mark: 'akm_wrote' } } },
        { t: 'Send the carter with a note only {kin} will understand', check: { s: 'intrigue', s2: 'int', d: 45 },
          win: { r: "The answer comes back in {kin}'s own hand, folded very small: come.", fx: { skill: { intrigue: 1 }, them: { op: 5 }, arc: { mark: 'akm_secret' } } },
          lose: { r: 'The carter is caught with it. {fh} sends it back unopened, with a note about manners.', fx: { happy: -3, arc: { mark: 'akm_wrote' } } } },
      ] },
    { id: 'ak_match_3', title: "In {fh}'s house", trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { match(p, ctx); },
      text: p => `${M(p, 'akm_secret') ? 'The note said come, and you have come.' : M(p, 'akm_rode') ? "You are at {fh}'s table again, and again you sent no word ahead." : M(p, 'akm_wrote') ? "{fh} answered your letter in his own hand, and asked you to come and see." : "You are at {fh}'s table at {town}."} {kin} has a yellowing bruise along the jaw, and says {kinHe} fell on the stair. {mate} is pleasant at dinner and drinks steadily. Afterwards {fh} talks about money: the match has cost {fhHim} a lawsuit, and {fhHe} wants part of the settlement back.`,
      choices: [
        { t: 'Take {kin} home tonight', r: "You take {kin} home that night in your own cart, with {kinHis} clothes in a sheet. Nobody at {fh}'s house tries to stop you.", fx: { honor: 2, happy: -2, them: { op: 20 }, arc: { mark: 'akm_took' } } },
        { t: 'Take {mate} out to the yard', check: { s: 'melee', s2: 'str', d: 50 },
          win: { r: 'You explain things to {mate} in the yard. {mateHe} understands, with a split lip.', fx: { honor: -1, them: { op: 15 }, arc: { mark: 'akm_beat' } } },
          lose: { r: '{mate} is younger and drunker and luckier. You go to bed with a broken nose and nothing settled.', fx: { wound: 'broken_nose', health: -8, them: { op: 5 }, arc: { mark: 'akm_beaten' } } } },
        { t: "Pay {fh} what {fhHe} asks, for {kin}'s sake", r: '{fh} is all warmth at breakfast. {kin} watches you count the money out.', fx: { coinPct: -0.06, them: { op: 5 }, arc: { mark: 'akm_paid' } } },
      ] },
    { id: 'ak_match_4', title: 'Before the bishop', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { match(p, ctx); },
      text: p => `${M(p, 'akm_took') ? "{kin} has been home a season. {fh} has gone to the bishop's court for the settlement, and to have {kin} sent back to {kinHis} {mateHW}." : M(p, 'akm_beat') ? '{mate} has drunk less since the yard, in company at least, and {kin} says things are quieter.' : M(p, 'akm_beaten') ? 'Your nose set crooked, and {mate} drinks as {mateHe} did. {kin} says things are quieter.' : M(p, 'akm_paid') ? '{fh} has your money, and {kin} says things are quieter at {town}.' : 'Things are quieter at {town}, or {kin} says they are. {mate} drinks less, in company.'} The bishop's official hears marriage cases at {capital} after Easter. Whatever you do now, {fh} will remember it.`,
      choices: [
        { t: 'Ask the bishop to undo the marriage', check: { s: 'persuasion', s2: 'faith', d: 50 },
          win: { r: 'The official finds a flaw in the banns, as officials do when asked properly. {kin} is free, and {fh} is your enemy until one of you is buried.', fx: { akin: 'unwedKin', honor: 2, them: { op: 20 }, flag: 'ak_mt_annulled', arc: { go: 'end' } } },
          lose: { r: "The official upholds the marriage and fines you for the bishop's time. {kin} thanks you for trying.", fx: { coinPct: -0.04, them: { op: 20 }, flag: 'ak_mt_upheld', arc: { go: 'end' } } } },
        { t: 'Keep {kin} at home, married or not', r: '{kin} lives at home, married to a {mateHW} at {town}, and keeps your accounts better than you ever did.', fx: { honor: -2, happy: 2, them: { op: 30 }, flag: 'ak_mt_kept', arc: { go: 'end' } } },
        { t: 'Send {kin} back to {mate}, with a priest to watch', r: '{kin} goes back. {kinHe} writes every week now, short letters, and never asks you for anything again.', fx: { honor: 1, them: { op: -30 }, flag: 'ak_mt_sent', arc: { go: 'end' } } },
      ] },

    // ================================================================== the bastard of the house (four scenes)
    { id: 'ak_bastard_1', title: "Your grandfather's nose", trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { bastard(p, ctx); },
      text: p => `A {basMW} of {basAge} with your grandfather's nose rides into {home} with six hired spears and a full purse. {bas} says {basHe} is your grandfather's grandchild, by a woman of {town} he married in secret before he married your grandmother. That would make {basHis} line the true one, and yours the bastards. {basHe} has a contract.${A.C.flag(p, 'ak_sec_named') ? ' You have a bastard of your own in the register, which makes it harder to sneer.' : ''}`,
      choices: [
        { t: 'Seat {basHim} at your table and hear it out', r: '{bas} eats well, talks well, and drinks to your grandfather with wet eyes. Your aunts count the spoons.', fx: { honor: 1, them: { op: 10, type: 'acquaint' }, arc: { mark: 'akx_table' } } },
        { t: 'Keep {basHim} at the gate', r: '{bas} sits {basHis} horse at your gate for an hour, so the street can see, and rides off to the inn.', fx: { wil: 1, them: { op: -20, type: 'acquaint' }, arc: { mark: 'akx_gate' } } },
        { t: 'Ask to read the contract yourself', check: { s: 'learning', s2: 'int', d: 50 },
          win: { r: "Old parchment, your grandfather's seal, and a witness: Father {pr} of {town}, who is still alive. It may be true.", fx: { skill: { learning: 1 }, them: { op: 0, type: 'acquaint' }, arc: { mark: 'akx_read' } } },
          lose: { r: "Old parchment, a smudged seal, and clerk's Latin you cannot follow. {bas} takes it back, politely.", fx: { happy: -2, them: { op: 0, type: 'acquaint' }, arc: { mark: 'akx_unread' } } } },
      ] },
    { id: 'ak_bastard_2', title: 'Father {pr}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { bastard(p, ctx); },
      text: p => `The priest who witnessed the contract, Father {pr}, is ninety and nearly blind, and lives on the abbey's charity at {town}. The parish register for that year should hold his entry. ${M(p, 'akx_read') ? 'You saw the page cited in the contract.' : M(p, 'akx_unread') ? "The Latin was past you, so you have only {bas}'s word for what it says." : "You have only {bas}'s word for what it says."} {bas} has been to see the old man already.`,
      choices: [
        { t: 'Cut the page out of the register', check: { s: 'stealth', s2: 'int', d: 55 },
          win: { r: 'You borrow the register for an hour and give it back a page lighter. Nobody will know but you.', fx: { honor: -6, arc: { mark: 'akx_cut' } } },
          lose: { r: 'The sacristan finds you with the register open and a knife in your hand.', fx: { honor: -8, happy: -3, arc: { mark: 'akx_caught' } } } },
        { t: 'Ask Father {pr} what he remembers', check: { s: 'persuasion', s2: 'ins', d: 45 },
          win: { r: "He remembers the wedding, your grandfather's boots, and the bride. He remembers that the bride already had a husband, at sea.", fx: { piety: 1, arc: { mark: 'akx_truth' } } },
          lose: { r: 'Father {pr} remembers his breakfast, and a dog he had as a boy.', fx: { happy: -1, arc: { mark: 'akx_muddle' } } } },
        { t: "Leave it to the bishop's court", r: 'You write to the bishop. The court will sit after Michaelmas, and charges by the day.', fx: { coinPct: -0.03, honor: 2, arc: { mark: 'akx_court' } } },
      ] },
    { id: 'ak_bastard_3', title: 'The family council', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { bastard(p, ctx); },
      text: p => `Your aunts, uncles and cousins gather in your hall to decide what the family will say, since what the family says is what the court will hear. ${M(p, 'akx_truth') ? 'You know what Father {pr} said about the bride.' : M(p, 'akx_cut') ? 'The register page is ash in your grate.' : M(p, 'akx_caught') ? 'Everyone has heard about you and the sacristan.' : M(p, 'akx_muddle') ? 'Father {pr} remembered his breakfast and a dog he had as a boy.' : M(p, 'akx_court') ? "You have put it to the bishop's court, which sits after Michaelmas." : 'Nobody knows the truth of it, which has never stopped anybody.'} {bas} has offered each of them something. ${M(p, 'akx_table') ? 'They have not forgotten that you seated {basHim} high.' : M(p, 'akx_gate') ? 'They have not forgotten that you kept {basHim} at the gate.' : ''}`,
      choices: [
        { t: 'Speak for {bas}: blood is blood', r: 'You speak for {bas}. Half the hall stares at you, and the other half was going to say it anyway.', fx: { honor: 3, them: { op: 25 }, arc: { mark: 'akx_for' } } },
        { t: 'Speak against {basHim}', check: { s: 'persuasion', s2: 'wil', d: 50 },
          win: { r: 'You speak, and the hall comes round. The family will say {bas} is nothing to it.', fx: { wil: 1, them: { op: -20 }, arc: { mark: 'akx_against' } } },
          lose: { r: "Half the family has already taken {bas}'s money, and the other half wants some.", fx: { happy: -3, them: { op: -20 }, arc: { mark: 'akx_split' } } } },
        { t: 'Offer terms: the name, but not the land', check: { s: 'diplomacy', s2: 'int', d: 45 },
          win: { r: '{bas} hears your terms and laughs, and then stops laughing and asks for wine.', fx: { skill: { diplomacy: 1 }, them: { op: 10 }, arc: { mark: 'akx_terms' } } },
          lose: { r: 'Nobody wants half of anything. The council breaks up shouting.', fx: { happy: -2, arc: { mark: 'akx_split' } } } },
      ] },
    { id: 'ak_bastard_4', title: 'Whose name', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { bastard(p, ctx); },
      text: p => `${M(p, 'akx_truth') ? "The bishop's court has Father {pr}'s word on the bride's first husband, and the contract is worth nothing. {bas} is a bastard twice over." : M(p, 'akx_cut') || M(p, 'akx_against') ? 'Without the register, or the family, the court has only a contract and a story.' : M(p, 'akx_for') ? 'You spoke for {basHim} in your own hall, and the court has heard of it.' : M(p, 'akx_terms') ? '{bas} has had your terms: the name, and none of the land.' : M(p, 'akx_split') ? 'The family said two things at once, and the court heard both.' : "The court has the contract, the register and the family's word."} {bas} comes to you one last time, older than when {basHe} came, with {basHis} spears paid off.`,
      choices: [
        { t: 'Name {basHim} kin, and seat {basHim} high', r: '{bas} goes into the register, onto the family tomb and to the top of your table. {basHe} swears to the family in turn, and means it.',
          fx: { honor: 2, them: { op: 40, type: 'cousin' }, sworn: true, flag: 'ak_bas_named', arc: { go: 'end' } } },
        { t: "Let the court's word stand, whatever it is", r: "You let the court have the last word. It is written down, and the matter is closed, and so is {bas}'s face.",
          fx: { honor: 3, them: { op: -15 }, deed: 'Let the court settle the family name', flag: 'ak_bas_judged', arc: { go: 'end' } } },
        { t: 'Pay {basHim} to ride away', r: '{bas} weighs your purse, laughs, and rides away with it. {basHe} will tell the story in every inn on the road.',
          fx: { coinPct: -0.12, them: { op: -20 }, deed: 'Paid off a claimant to the family name', flag: 'ak_bas_bought', arc: { go: 'end' } } },
      ] },

    // ================================================================== what runs in the blood (five scenes)
    { id: 'ak_blood_1', title: "Aunt {au}'s hands", trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { blood(p, ctx); },
      text: 'They bury your mother\'s sister {au} at {town}. For ten years her hands danced on their own, then her feet, then her temper; at the end she knew nobody. At the wake an old cousin, {oc}, says it plainly: {au}\'s father went the same way, and his mother before him. "It skips some," {oc} says, and looks at your hands.',
      choices: [
        { t: 'Ask {oc} for every name she remembers', r: '{oc} gives you nine names from memory, back to a woman who died in the year of the great frost. Five of them shook.', fx: { skill: { medicine: 1 }, happy: -3, arc: { mark: 'akl_names' } } },
        { t: 'Drink to {au} and go home', r: 'You drink to {au}, and to her father, and go home with your hands in your pockets.', fx: { happy: 1, arc: { mark: 'akl_quiet' } } },
        { t: 'Ask the physician at {town} what it is', r: 'Master {doc} has seen it before. One child in two, he says, from a parent who has it; and it comes in middle life.', fx: { coinPct: -0.02, skill: { medicine: 2 }, happy: -2, arc: { mark: 'akl_doc' } } },
      ] },
    { id: 'ak_blood_2', title: 'Your own hands', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { blood(p, ctx); },
      text: (p, ctx) => `You find yourself watching your own hands at table. ${ctx.sp ? '{sp} has noticed you watching.' : 'The matchmaker has noticed you are still unmarried, and says so.'} ${ctx.kids ? "Your children have your mother's long fingers." : "You have no children. Some of your mother's line chose to have none."} ${M(p, 'akl_doc') ? 'One child in two, Master {doc} said.' : M(p, 'akl_names') ? "{oc}'s nine names are written in the back of your psalter." : M(p, 'akl_quiet') ? 'You drank to {au} at the wake and have not said her name since.' : ''}`,
      choices: [
        { t: 'Tell your family what runs in it', r: 'You tell them at supper, plainly. Nobody eats much, and nobody leaves the table.', fx: { honor: 3, happy: -3, flag: 'ak_bl_told', arc: { mark: 'akl_told' } } },
        { t: 'Say nothing. It may skip you', r: 'You say nothing. Most days you even believe it.', fx: { happy: 2, honor: -2, arc: { mark: 'akl_hid' } } },
        { t: (p, ctx) => (ctx.kids ? 'Swear before the priest to have no more children' : 'Swear before the priest to have no children'), r: 'You swear it before the priest, who thinks you have lost your wits, and says so.', fx: { wil: 2, happy: -4, piety: 1, arc: { mark: 'akl_sworn' } } },
      ] },
    { id: 'ak_blood_3', title: 'The physician from {capital}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { blood(p, ctx); ctx.doc2 = H.given(p, BLOOD, 'doc2', 'M', p.cult); },
      text: p => `A physician from the college at {capital}, Master {doc2}, is writing a book on the shaking sickness, and riding the valleys for families that have it. He wants your family's names and dates, and to see your hands once a year until you die, and will pay for both. ${M(p, 'akl_told') ? 'Your family knows already; the shame is spent.' : M(p, 'akl_sworn') ? 'You have sworn off children over it; he would write that down too.' : M(p, 'akl_hid') ? 'Nobody knows, and nobody outside the family need know, he says.' : 'Nobody outside the family need know, he says.'}`,
      choices: [
        { t: 'Give him everything, your hands too', r: "Master {doc2} writes for two days and takes your pulse, your hands and your grandmother's name. He pays in silver.", fx: { coin: 40, fame: 1, skill: { medicine: 1 }, happy: -2, arc: { mark: 'akl_book' } } },
        { t: 'Sell him the names, but not yourself', r: 'He pays for the names, less than he would have for your hands, and rides off disappointed in you.', fx: { coin: 20, arc: { mark: 'akl_sold' } } },
        { t: 'Send him away', r: "You send him away. He writes your village's name in his book anyway, with a question mark.", fx: { honor: 1, wil: 1, arc: { mark: 'akl_sent' } } },
      ] },
    { id: 'ak_blood_4', title: 'Hold your hand still', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { blood(p, ctx); ctx.doc2 = H.given(p, BLOOD, 'doc2', 'M', p.cult); ctx.testerHe = M(p, 'akl_book') ? 'he' : 'she'; ctx.ageW = H.num(A.age(p)); },
      text: (p, ctx) => `You are {ageW}, near the age {au}'s hands began. ${M(p, 'akl_book') ? 'Master {doc2} has come for his yearly look.' : M(p, 'akl_sold') ? 'Master {doc2} has the names and never saw your hands. Old {oc} has come to visit, and asks to see them.' : M(p, 'akl_sent') ? 'You sent Master {doc2} away. Old {oc} has come to visit, and asks to see your hands.' : 'Old {oc} has come to visit, and asks to see your hands.'} "Hold it out flat," {testerHe} says, "and count to a hundred." The kitchen is very quiet. ${ctx.sp ? '{sp} has stopped pretending to sew.' : ''}`,
      choices: [
        { t: 'Hold your hand out, and count', req: p => fate(p) === '0', r: 'Your hand is still at a hundred, and still at two hundred. It is wine and worry, nothing more.', fx: { happy: 8, arc: { mark: 'akl_clear' } } },
        { t: 'Hold your hand out, and count', req: p => fate(p) === '1', r: 'At forty your little finger begins to move on its own. At sixty you put your hand in your lap.', fx: { happy: -8, wound: 'ak_shaking', arc: { mark: 'akl_shows' } } },
        { t: 'Put your hand in your lap. You would rather not know', r: 'You put your hand in your lap and talk about the harvest. Nobody makes you.', fx: { wil: 1, happy: -1, arc: { mark: 'akl_unknown' } } },
      ] },
    { id: 'ak_blood_5', title: 'The years left', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { blood(p, ctx); ctx.doc2 = H.given(p, BLOOD, 'doc2', 'M', p.cult); ctx.phys = M(p, 'akl_book') ? 'Master ' + ctx.doc2 : M(p, 'akl_doc') ? 'Master ' + ctx.doc : 'the physician at ' + ctx.town; },
      text: (p, ctx) => `${M(p, 'akl_shows') ? 'It comes slowly, {phys} says: ten years, perhaps fifteen, before the walk goes, and longer before the mind.'
        : M(p, 'akl_clear') ? `You are past the age it took {au}, and your hands are steady. It skipped you. ${ctx.kids ? 'It may not skip your children.' : 'It ends with you.'}`
        : M(p, 'akl_unknown') && fate(p) === '1' ? 'You never let anyone count. Now your cup rattles on its saucer in front of guests, and everyone counts for you.'
        : 'You never let anyone count, and the years have counted instead: you are past the age it came to {au}.'} What will you do with the time?`,
      choices: [
        { t: 'Put every affair in order while you can', r: 'You settle your debts, make peace with two old enemies, and write down where everything is. It takes a year. You sleep better.',
          fx: { akin: 'fate', honor: 2, trait: 'diligent', deed: 'Put every affair in order against the family sickness', flag: 'ak_bl_ordered', arc: { go: 'end' } } },
        { t: 'Spend it hard and gladly', r: 'You buy the grey horse, drink the good wine, and dance at every wedding in {home}. People talk. You let them.',
          fx: { akin: 'fate', coinPct: -0.08, happy: 8, trait: 'gregarious', deed: 'Spent the years the family sickness left, and gladly', flag: 'ak_bl_spent', arc: { go: 'end' } } },
        { t: 'Leave your body to the physicians, to learn from', r: 'You write it in your will: the college at {capital} may have you when you die. The priest is appalled. The physicians are not.',
          fx: { akin: 'fate', fame: 3, piety: -2, trait: 'stoic', deed: 'Left your body to the physicians, to learn the family sickness', flag: 'ak_bl_given', arc: { go: 'end' } } },
      ] },

    // ================================================================== the carter's child (five scenes, ten years or more)
    { id: 'ak_adopt_1', title: 'On your step', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { adopt(p, ctx); },
      text: (p, ctx) => `The sweating fever takes {cd} the carter and his wife in one week. Their {kidBG}, {kid}, {kidAge} years old, is found asleep on your step with a rag doll and the carter's whip. The parish will send {kidHim} to the poorhouse at {capital} on Monday, unless someone takes {kidHim}. ${ctx.sp ? '{sp} looks at you across the step.' : 'Your house is not large.'}`,
      choices: [
        { t: 'Take {kidHim} in', r: '{kid} comes in with the doll and the whip, and will not let go of either for a month.', fx: { happy: 3, coinPct: -0.02, them: { op: 30, type: 'ward', back: 'acquaint' }, arc: { mark: 'akd_took' } } },
        { t: 'Pay the widow {wd} to raise {kidHim}', r: 'The widow {wd} takes {kid} and your money, and sends word on the first of each month that {kidHe} is eating.', fx: { coinPct: -0.04, honor: 1, them: { op: 10, type: 'ward', back: 'acquaint' }, arc: { mark: 'akd_paid' } } },
        { t: 'Let the parish take {kidHim}', r: 'The parish cart takes {kid} on Monday. {kidHe} looks back at your step all the way to the bend.', fx: { wil: 1, happy: -3, them: { op: -5, type: 'acquaint' }, arc: { mark: 'akd_parish' } } },
      ] },
    { id: 'ak_adopt_2', title: 'Not your blood', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { adopt(p, ctx); },
      text: (p, ctx) => (M(p, 'akd_took') ? `{kid} is {kidAge} and has your house's ways, but at the well the other children call {kidHim} "the carter's leavings." {kidHe} came home today with a split lip and somebody else's tooth in {kidHis} fist. ${ctx.kids ? 'Your own children took {kidHis} side, mostly.' : ''}`
        : M(p, 'akd_paid') ? 'The widow {wd} is going blind and can keep {kid} no longer. {kidHe} is {kidAge}, sharp and silent, and sits on her step waiting to hear where {kidHe} goes next.'
        : M(p, 'akd_parish') ? 'On business at {capital} you pass the poorhouse yard, and a {kidBG} of {kidAge} at the railings says your name. {kid} remembers your step.' : '{kid} is {kidAge} now, and belongs to nobody in {home}.'),
      choices: [
        { t: p => (M(p, 'akd_took') ? 'Keep {kidHim} under your roof, and say so' : 'Bring {kidHim} under your roof, for good'), r: '{kid} has a bed of {kidHis} own now, and a place at your table that nobody else sits in.', fx: { coinPct: -0.02, happy: 2, them: { op: 20, type: 'ward' }, arc: { mark: 'akd_home' } } },
        { t: 'Find {kidHim} a place in service', r: 'A farmer at {town} takes {kid} for {kidHis} keep, and works {kidHim} hard. {kidHe} does not complain, which is worse.', fx: { wil: 1, them: { op: -5 }, arc: { mark: 'akd_service' } } },
        { t: 'Pay for {kidHim} at the parish school', r: "The parish clerk teaches {kid} letters for a fee. {kidHe} learns them faster than the reeve's son, and fights him over it.", fx: { coinPct: -0.03, honor: 2, them: { op: 10, type: 'ward' }, arc: { mark: 'akd_school' } } },
      ] },
    { id: 'ak_adopt_3', title: "{kid}'s uncle", trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { adopt(p, ctx); ctx.un = H.given(p, AD, 'un', 'M', p.cult); },
      text: p => `A hill-farmer called {un} comes down to {home} with a dog and a lawyer's letter. He is {cd}'s brother, and he wants {kid}: blood should be with blood, he says, and the carter's right on the {town} road goes with the child. ${M(p, 'akd_service') ? "{kid}'s master would let {kidHim} go, for a price." : M(p, 'akd_school') ? "{kid}, {kidAge} now, read the lawyer's letter aloud to you, twice, and then hid in the hayloft." : M(p, 'akd_home') ? '{kid}, {kidAge} now and yours by your own word, is hiding in your hayloft.' : '{kid}, {kidAge} now, is hiding in your hayloft.'}`,
      choices: [
        { t: 'Let {kid} choose, and abide by it', r: '{kid} comes down from the loft, looks at {un} and at you, and takes your hand. {un} curses your house at the church door and goes home.', fx: { honor: 2, happy: -2, them: { op: 15 }, arc: { mark: 'akd_chose' } } },
        { t: 'Fight {un} for {kidHim} in the manor court', check: { s: 'persuasion', s2: 'int', d: 50 },
          win: { r: 'The court finds that the cart-right goes with the blood, and the child with whoever fed {kidHim}. You keep {kid}; {un} keeps the road.', fx: { fame: 1, them: { op: 15 }, arc: { mark: 'akd_won' } } },
          lose: { r: "The court finds for blood. {kid} goes up the hill on {un}'s cart, looking back.", fx: { happy: -6, them: { op: 10 }, arc: { mark: 'akd_lost' } } } },
        { t: '{un} wants the road, not the child: buy him off', r: '{un} takes the money, spits, and goes back up his hill.', fx: { coinPct: -0.05, them: { op: 5 }, arc: { mark: 'akd_bought' } } },
      ] },
    { id: 'ak_adopt_4', title: 'What {kid} will be', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { adopt(p, ctx); ctx.un = H.given(p, AD, 'un', 'M', p.cult); },
      text: p => `${M(p, 'akd_lost') ? "{kid} walks down from {un}'s farm in the snow, three days on foot, and will not go back." : M(p, 'akd_chose') ? '{kid} took your hand in front of {un}, and is taller than you this spring.' : M(p, 'akd_won') ? 'The court left you the child and {un} the road. {kid} is taller than you this spring.' : M(p, 'akd_bought') ? '{un} took your money and stayed up his hill. {kid} is taller than you this spring.' : '{kid} is taller than you this spring.'} {kidHe} is {kidAge}, and has to be something. The {craft} at {town} would take {kidHim} as apprentice, for a fee. The recruiting sergeant would take {kidHim} for nothing, and pay the house a bounty. Or {kidHe} could stay and work beside you.`,
      choices: [
        { t: 'Pay the apprentice fee', r: 'The {craft} takes {kid} and your fee. {kidHe} comes home at Christmas smelling of the shop, and proud of it.', fx: { coinPct: -0.05, honor: 1, them: { op: 15 }, arc: { mark: 'akd_trade' } } },
        { t: "Let {kidHim} take the sergeant's coin", r: '{kid} marches off behind a drum with eleven other young fools. The bounty buys a pig.', fx: { coin: 30, happy: -3, them: { op: -5 }, arc: { mark: 'akd_soldier' } } },
        { t: 'Keep {kidHim} at home, at your side', r: '{kid} works beside you from dark to dark and knows your trade before the year is out.', fx: { happy: 3, them: { op: 20 }, arc: { mark: 'akd_stay' } } },
      ] },
    { id: 'ak_adopt_5', title: 'The register', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { adopt(p, ctx); },
      text: p => `${M(p, 'akd_soldier') ? '{kid} comes home from the muster for one day, to ask you something.' : M(p, 'akd_trade') ? "{kid}'s master has given {kidHim} the day." : M(p, 'akd_stay') ? '{kid} has worked beside you three years, and stops in the middle of it to ask you something.' : ''} {kid} is {kidAge}. {kidHe} asks to be written in the parish register as your {kidSD}: your name, and the right to stand at your grave as kin. Or {kidHe} could take back {cd}'s name, and the carter's road with it.`,
      choices: [
        { t: 'Write it: my {kidSD}', r: '{kid} signs under your name, carefully. The priest sands the page and shakes your hand.',
          fx: { akin: 'adopt', happy: 4, them: { op: 30 }, flag: 'ak_ad_named', arc: { go: 'end' } } },
        { t: "Give {kidHim} {cd}'s name, and the carter's road", r: "{kid} takes the carter's name and the carter's road, and drives past your door every week with a wave.",
          fx: { coinPct: -0.03, them: { op: 20 }, deed: "Raised a carter's orphan to drive the carter's road", flag: 'ak_ad_carter', arc: { go: 'end' } } },
        { t: 'Tell {kidHim} a name is not a thing you give', r: '{kid} hears you, goes back to work, and does not ask again. {kidHe} is gone by the next spring.',
          fx: { wil: 1, them: { op: -30 }, flag: 'ak_ad_refused', arc: { go: 'end' } } },
      ] },

    // ================================================================== the night road (four scenes)
    { id: 'ak_elope_1', title: '{lv}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p) && !C.married(p),
      setup: (p, ctx) => { elope(p, ctx); },
      text: p => `You love {lv}, the {lpJob}'s {lvSD}, and {lvHe} loves you; the whole lane knows it. {lp} has promised {lvHim} to {wid}, a {widKind} of fifty with a mill and a cough, and the banns go up in a month. ${H.hi(p) ? "Your family says a falconer's {lvSD} is for the mews, not the hall." : 'Your family says the reeve would sooner drown {lvHim} than see {lvHim} marry you.'}`,
      choices: [
        { t: 'Ask {lp} for {lvHim}, properly, in your best coat', check: { s: 'persuasion', s2: 'etiquette', d: 55 },
          win: { r: '{lp} hears you out and says: a year. Show you can keep {lvHim}, and {wid} can wait.', fx: { honor: 2, arc: { mark: 'ake_year' } } },
          lose: { r: '{lp} hears you out, and then sets the dog on you.', fx: { happy: -3, health: -2, arc: { mark: 'ake_barred' } } } },
        { t: 'Plan to go by night', r: 'You and {lv} meet behind the tithe barn and plan it to the hour: two horses, the hill road, a priest at {town} who asks no questions.', fx: { wil: 1, honor: -1, them: { op: 10, type: 'lover' }, arc: { mark: 'ake_plan' } } },
        { t: 'Let {lvHim} go. It would ruin {lvHim}', r: '{lv} hears it at the stile. {lvHe} does not cry until you have gone.', fx: { honor: 2, happy: -6, arc: { mark: 'ake_gave' } } },
      ] },
    { id: 'ak_elope_2', title: 'The night', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p) && !C.married(p),
      setup: (p, ctx) => { elope(p, ctx); },
      text: p => `${M(p, 'ake_year') ? '{lp} has quietly put the banns forward. {lv} sends word by the goose-girl: tonight, or never.' : M(p, 'ake_gave') ? '{lv} is at your door at midnight with a bundle. The wedding to {wid} is in the morning.' : M(p, 'ake_barred') ? "Your coat is still torn where {lp}'s dog had it. {lv} has a bundle under the hedge, and two borrowed horses." : M(p, 'ake_plan') ? 'It is as you planned it behind the tithe barn: the bundle, the horses, the hour.' : '{lv} has a bundle under the hedge, and two horses borrowed from a carter who owes you.'} The hedge-priest at {town}, over the hill, will marry anyone for a silver penny and no banns.`,
      choices: [
        { t: 'Go now, by the hill road', check: { s: 'riding', s2: 'spd', d: 45 },
          win: { r: 'You are over the hill before the cocks, and married by the hedge-priest before breakfast, with a carter for a witness.', fx: { akin: 'wed', happy: 6, arc: { mark: 'ake_hill' } } },
          lose: { r: "A horse goes lame on the hill, and {lp}'s riders come up behind you at dawn. You are married with them hammering on the chapel door.", fx: { akin: 'wed', health: -5, happy: 2, arc: { mark: 'ake_chased' } } } },
        { t: 'Go by the river, slow and quiet', r: 'The ferryman wants double for the hour. You are married at noon, with river mud to the knee.', fx: { akin: 'wed', coin: -10, happy: 3, arc: 'next' } },
        { t: 'Stay, and face them all by daylight', r: "You send {lv} home with the bundle, and go to {lp}'s door at dawn, alone.", fx: { honor: 3, happy: -3, arc: { mark: 'ake_stayed' } } },
      ] },
    { id: 'ak_elope_3', title: "{lv}'s brothers", trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { elope(p, ctx); },
      text: p => `${M(p, 'ake_stayed') ? "You stand in {lp}'s yard by daylight, and {lv}'s three brothers come out of the house with cudgels." : M(p, 'ake_chased') ? "You were married with {lp}'s riders at the chapel door. {lv}'s three brothers have found your two rooms at {town}, and are in the yard with cudgels." : M(p, 'ake_hill') ? "You were over the hill before the cocks. {lv}'s three brothers have found your two rooms at {town}, and are in the yard with cudgels." : "You and {lv} have two rooms over a cooper's at {town}. {lv}'s three brothers have found them, and are in the yard below with cudgels."} {wid} has asked for {widHis} betrothal gifts back, and {lp} cannot pay.`,
      choices: [
        { t: 'Fight them in the yard', check: { s: 'melee', s2: 'str', d: 55 },
          win: { r: 'You put the eldest in the water-trough, and the other two think better of it.', fx: { fame: 2, health: -4, arc: { mark: 'ake_fought' } } },
          lose: { r: "Three is a lot of brothers. You wake in the cooper's shavings with your ribs strapped.", fx: { wound: 'broken_ribs', health: -12, arc: { mark: 'ake_beaten' } } } },
        { t: 'Talk to the eldest, alone', check: { s: 'persuasion', s2: 'ins', d: 45 },
          win: { r: 'The eldest is called {br}, and it turns out he never liked {wid} either. He takes the other two home.', fx: { skill: { persuasion: 1 }, arc: { mark: 'ake_talked' } } },
          lose: { r: '{br} hears you out and hits you anyway, once, for form.', fx: { health: -6, arc: { mark: 'ake_beaten' } } } },
        { t: "Pay back {wid}'s gifts yourself", r: 'You pay {wid} for a gold ring, a cow and {widHis} trouble. The brothers go home short of a grievance.', fx: { coinPct: -0.06, honor: 1, them: { op: 10 }, arc: { mark: 'ake_paid' } } },
      ] },
    { id: 'ak_elope_4', title: 'Home again', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { elope(p, ctx); },
      text: (p, ctx) => `A year on. ${ctx.wed ? 'You and {lv} have a rented room, a borrowed table and a debt to the cooper.' : "{lv} is still in {lp}'s house, and {wid} is dead of {widHis} cough."} Word comes from {home}: your people will have you both back, and {lp} will sit at the same table, if asked. ${M(p, 'ake_fought') ? "{lv}'s eldest brother still walks crooked." : M(p, 'ake_beaten') ? 'Your ribs ache in wet weather, and nobody asks about the yard.' : M(p, 'ake_talked') ? '{br}, the eldest of them, drinks with you now, warily.' : M(p, 'ake_paid') ? '{wid} has {widHis} gifts back, and the brothers have no grievance left to ride with.' : ''}`,
      choices: [
        { t: 'Go home to {home}, together', r: '{lp} sits at the far end of the table and passes the salt when asked. It is a start.',
          fx: { akin: 'wed', honor: 2, them: { op: 20 }, rel: { who: 'father', op: 15 }, flag: 'ak_el_home', arc: { go: 'end' } } },
        { t: 'Stay at {town} and make your own life', r: 'You take a cottage at {town} with a pear tree and a chimney that smokes. It is yours, which is the point.',
          fx: { akin: 'wed', asset: 'cottage', coinPct: -0.03, them: { op: 15 }, flag: 'ak_el_away', arc: { go: 'end' } } },
        { t: (p, ctx) => (ctx.wed ? 'Let {lv} go home without you' : 'Let {lvHim} go, this time for good'),
          r: (p, ctx) => (ctx.wed ? 'You part at the crossroads without a scene. {lv} goes home to {lp}. The priest calls it a separation; the parish calls it something else.' : 'You let {lv} go for good. {lvHe} marries a carter from {town} in the autumn, and is happy, you hear.'),
          fx: { akin: 'unwed', happy: -6, them: { op: -30 }, flag: 'ak_el_parted', arc: { go: 'end' } } },
      ] },

    // ================================================================== the will (four scenes)
    { id: 'ak_will_1', title: "{par}'s will", trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { will(p, ctx); },
      text: (p, ctx) => `The notary comes up from {capital} with {par}'s will in a box. To you: {parHis} house, on two conditions. {comp}, who kept house for {parHim} these last years, is to live in it until death; and it is never to be sold out of the family. A sealed letter is to be opened by you, and only you, in five years. ${ctx.sib ? '{sib} gets the furniture, and is not pleased.' : ''}`,
      choices: [
        { t: 'Take the house, and its conditions', r: '{comp} gives you the keys, and keeps the one to the cellar.', fx: { akin: 'house', happy: 3, them: { op: 10, type: 'acquaint' }, arc: { mark: 'akw_took' } } },
        { t: 'Contest the conditions in court', check: { s: 'persuasion', s2: 'int', d: 55 },
          win: { r: 'The court strikes both conditions: a dead hand cannot rule a live house. {comp} has a month to go.', fx: { akin: 'house', coinPct: -0.02, them: { op: -30, type: 'acquaint' }, arc: { mark: 'akw_free' } } },
          lose: { r: 'The court upholds the will to the letter, and sends you the bill.', fx: { akin: 'house', coinPct: -0.04, them: { op: -15, type: 'acquaint' }, arc: { mark: 'akw_bound' } } } },
        { t: 'Refuse it. Let the church have the house', r: 'You refuse it before the notary. The house goes to the church with {comp} in it, and the parish thinks you mad, or a saint.', fx: { honor: 3, piety: 2, them: { op: 15, type: 'acquaint' }, arc: { mark: 'akw_refused' } } },
      ] },
    { id: 'ak_will_2', title: '{comp}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { will(p, ctx); },
      text: p => `${M(p, 'akw_refused') ? "{comp} writes to you from {par}'s house, which is the church's now. The new priest wants {compHim} out by Lady Day, conditions or no." : M(p, 'akw_free') ? '{comp} has gone to a sister at {town}, and the parish talks of nothing else.' : M(p, 'akw_bound') ? "The court upheld every word, so {comp} keeps the best chair, the cellar key and {par}'s ways." : M(p, 'akw_took') ? "{comp} keeps the best chair, the cellar key and {par}'s ways, and corrects how you bank the fire." : "{comp} keeps the best chair and the cellar key, and corrects how you bank the fire."} {compHe} is {compAge}, and knew {par} at the end better than anyone.`,
      choices: [
        { t: p => (M(p, 'akw_refused') || M(p, 'akw_free') ? 'Take {comp} into your own house' : "Let {comp} keep {par}'s place by the fire"), r: '{comp} keeps {compHis} place by the fire, and tells you things about {par} you did not know and could have done without.', fx: { honor: 2, happy: -3, them: { op: 20 }, arc: { mark: 'akw_kept' } } },
        { t: 'Ask {comp} what {par} was like at the end', r: '{comp} talks for an evening. {par} was frightened, and funny, and asked for you twice.', fx: { happy: 2, them: { op: 10 }, arc: { mark: 'akw_asked' } } },
        { t: 'Find {comp} a room elsewhere, and pay for it', r: 'You find {comp} a room at {town} with a good fire, and pay a year ahead. {compHe} goes without a word.', fx: { coinPct: -0.03, happy: 3, them: { op: -10 }, arc: { mark: 'akw_moved' } } },
      ] },
    { id: 'ak_will_3', title: 'A buyer from {capital}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { will(p, ctx); },
      text: p => `{buyer}, a wool-merchant from {capital}, wants {par}'s house and garden, and offers more than they are worth: the new road will pass the door. ${M(p, 'akw_refused') ? 'The church will sell it to him unless you buy it first.' : M(p, 'akw_free') ? 'The court struck the conditions, so you may sell.' : 'The will says it is never to be sold out of the family.'} ${M(p, 'akw_moved') ? '' : M(p, 'akw_kept') ? '{comp} is listening at the door, out of {parHis} own chair.' : M(p, 'akw_asked') ? '{comp}, who told you how {par} died, is listening at the door.' : '{comp} is listening at the door.'}`,
      choices: [
        { t: 'Sell it to him', req: p => !M(p, 'akw_refused'), r: '{buyer} pays in good coin and has the garden dug up by Easter.', fx: { coin: 250, honor: -3, akin: 'sell', arc: { mark: 'akw_sold' } } },
        { t: 'Buy it back from the church first', req: p => M(p, 'akw_refused'), r: 'The church sells you {par}\'s house at the price {buyer} offered, and blesses you for it.', fx: { coin: -200, coinPct: -0.05, happy: 2, akin: 'house', arc: { mark: 'akw_bought' } } },
        { t: p => (M(p, 'akw_refused') ? 'Let the church sell it to him' : 'Turn {buyer} away'), r: p => (M(p, 'akw_refused') ? '{buyer} buys it from the church, and has the garden dug up by Easter.' : '{buyer} goes back to {capital} and tells everyone you are a fool. The house stays.'), fx: { wil: 1, happy: 1, arc: { mark: 'akw_kept2' } } },
        { t: 'Lease it to him for twenty years', req: p => !M(p, 'akw_refused'), r: 'A lease is not a sale, says your notary, who is paid to say so. {buyer} takes it.', fx: { coin: 80, honor: -1, arc: { mark: 'akw_leased' } } },
      ] },
    { id: 'ak_will_4', title: 'The sealed letter', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => {
        will(p, ctx);
        const heir = H.get(p, WILL, 'heir', () => H.mk(p, { age: H.adj(p) + A.ri(-6, 6), status: 'peasant', occ: 'keeps pigs at ' + ctx.town }));
        H.tok(ctx, 'heir', heir); ctx.pid = heir.id;
        ctx.house = ctx.owned ? (M(p, 'akw_leased') ? "The house is yours, with twenty years of a wool-merchant's lease on it." : M(p, 'akw_bought') ? 'You bought the house back from the church. It is yours.' : M(p, 'akw_kept2') ? 'The house is yours, and the wool-merchant went home disappointed.' : 'The house is yours, for now.')
          : M(p, 'akw_sold') ? 'The house is sold, and the money mostly spent.' : M(p, 'akw_kept2') ? 'The church sold the house to the wool-merchant.' : 'The house is not yours to give.';
      },
      text: 'The day comes, and you break {par}\'s seal. In {parHis} hand: "The house was never mine to leave. I won it from {owner} at dice in the hungry year, with a weighted bone. Do what I could not." {owner} is long dead. His grandchild, {heir}, keeps pigs at {town}. {house}',
      choices: [
        { t: 'Give the house to {heir}', req: (p, C, ctx) => !!(ctx && ctx.owned), r: '{heir} cannot believe it, and then can. {heirHe} moves in at Michaelmas with four children and a sow.',
          fx: { akin: 'sell', honor: 6, them: { op: 40, type: 'friend' }, flag: 'ak_will_righted', arc: { go: 'end' } } },
        { t: 'Pay {heir} what the house was worth', req: (p, C, ctx) => !(ctx && ctx.owned), r: "You pay {heir} the price of {par}'s house, in coin, at {heirHis} own table. {heirHe} counts it twice and weeps once.",
          fx: { coin: -100, coinPct: -0.06, honor: 5, them: { op: 35, type: 'friend' }, flag: 'ak_will_righted', arc: { go: 'end' } } },
        { t: 'Burn the letter. It was another age', r: 'The letter burns as quickly as any other. Nobody alive knows but you.',
          fx: { wil: 1, honor: -2, deed: "Burned a dead parent's confession", flag: 'ak_will_burned', arc: { go: 'end' } } },
        { t: 'Tell {heir}, and offer a fair price for it', req: (p, C, ctx) => !!(ctx && ctx.owned), r: '{heir} hears it out, and takes your price, and shakes your hand on the step as if it were a market day.',
          fx: { coinPct: -0.06, honor: 3, them: { op: 25, type: 'friend' }, flag: 'ak_will_paid', arc: { go: 'end' } } },
      ] },

    // ================================================================== the red cow (four scenes, a decade)
    { id: 'ak_dowry_1', title: 'A red cow', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { dowry(p, ctx); },
      text: "A man of law from {capital} reads you a contract sixty years old. When your great-aunt {ga} married into {cr}'s family, your great-grandfather promised forty suns and a red cow, and paid neither. {cr} has kept the paper, and counted the interest. He reckons it now at {sum}. You are the eldest of your line, so it falls to you.",
      choices: [
        { t: 'Pay half now, and ask for time', req: p => p.coin >= 30, r: "You pay {half} into the man of law's hands. {cr} sends thanks, and a reminder.", fx: { coin: -30, coinPct: -0.12, honor: 2, them: { op: 10, type: 'acquaint' }, arc: { mark: 'akr_half' } } },
        { t: "Refuse. A dead man's debt died with him", r: 'The man of law writes your refusal down very carefully, as if it were worth money. To {cr}, it is.', fx: { wil: 1, honor: -2, them: { op: -20, type: 'acquaint' }, arc: { mark: 'akr_refused' } } },
        { t: 'Have your own man of law read it', check: { s: 'learning', s2: 'int', d: 50 },
          win: { r: 'Your man finds that no priest witnessed it. It is worth half what {cr} says, at most.', fx: { coinPct: -0.02, skill: { learning: 1 }, them: { op: 0, type: 'acquaint' }, arc: { mark: 'akr_flaw' } } },
          lose: { r: 'Your man reads it twice, says it is sound, and sends his bill.', fx: { coinPct: -0.02, them: { op: 0, type: 'acquaint' }, arc: { mark: 'akr_refused' } } } },
      ] },
    { id: 'ak_dowry_2', title: 'The bailiff', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { dowry(p, ctx); },
      text: p => `{lead}{cr} has gone to the court at {town}${M(p, 'akr_half') ? ' for the other half' : ''}, and won.${M(p, 'akr_refused') ? ' Your refusal was read out to the court, slowly.' : ''} A bailiff comes to your door for a pledge against the debt: your best {beast}, or its worth in silver. Your neighbours are watching from their doorways. ${M(p, 'akr_flaw') ? 'Your man of law says the flaw will hold on appeal, if you can keep paying him.' : ''}`,
      choices: [
        { t: 'Let the bailiff take the pledge', r: 'The bailiff leads the beast away down the lane. Your neighbours go back inside, one by one.', fx: { coinPct: -0.05, honor: 1, happy: -3, arc: { mark: 'akr_pledged' } } },
        { t: 'Bar the door against him', check: { s: 'intimidation', s2: 'str', d: 50 },
          win: { r: 'The bailiff looks at the door, and at you, and decides it is a matter for another day.', fx: { fame: 1, honor: -1, arc: { mark: 'akr_barred' } } },
          lose: { r: 'The bailiff comes back with six men and takes twice the pledge, and the door.', fx: { coinPct: -0.1, happy: -4, arc: { mark: 'akr_pledged' } } } },
        { t: 'Go to {cr} yourself, head of family to head', check: { s: 'diplomacy', s2: 'persuasion', d: 45 },
          win: { r: '{cr} gives you cider and two hours. He wants it settled, it turns out, almost as much as he wants the money.', fx: { them: { op: 15 }, arc: { mark: 'akr_talks' } } },
          lose: { r: '{cr} keeps you standing in the yard and talks about red cows.', fx: { happy: -2, them: { op: -10 }, arc: { mark: 'akr_scorned' } } } },
      ] },
    { id: 'ak_dowry_3', title: 'A match to settle it', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { const { cr } = dowry(p, ctx); dowryMatch(p, ctx, cr); },
      text: p => `{lead}{cr} makes an offer. The debt is forgiven if {who} {crHis} grandchild {gc}, and brings forty suns and a red cow to the wedding, exactly as written. ${M(p, 'akr_talks') ? 'It was your talk in his yard that gave him the idea.' : M(p, 'akr_barred') ? 'He has not forgotten your barred door, and says so.' : M(p, 'akr_scorned') ? 'He kept you standing in his yard once, and has had sixty years to think of it.' : M(p, 'akr_pledged') ? 'He has your {beast} in his byre already, and sixty years of thinking behind him.' : 'He has had sixty years to think of it.'}`,
      choices: [
        { t: 'Agree to the match', r: '{cr} laughs until he coughs, and sends for his best cider.', fx: { honor: 1, happy: -2, them: { op: 20 }, arc: { mark: 'akr_match' } } },
        { t: 'Refuse the match, and pay what you can', r: 'You pay what you can, which is a great deal. {cr} takes it without thanks.', fx: { coin: -20, coinPct: -0.1, them: { op: -5 }, arc: { mark: 'akr_paid' } } },
        { t: 'Leave it for your children to settle', r: 'You tell {cr} the debt can wait a generation, as it waited for this one. He says it will.', fx: { happy: 2, wil: 1, them: { op: -15 }, arc: { mark: 'akr_passed' } } },
      ] },
    { id: 'ak_dowry_4', title: 'Forty suns and a red cow', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { const { cr } = dowry(p, ctx); dowryMatch(p, ctx, cr); },
      text: p => `{lead}${M(p, 'akr_match') ? 'The wedding is set for Michaelmas, and {cr} has asked for the red cow to walk in front.' : M(p, 'akr_passed') ? '{cr} is failing. {crHis} heir has the paper, and the patience of a younger man.' : M(p, 'akr_paid') ? 'You paid what you could, and the rest of it still stands. {cr} has sent for that.' : 'There is one payment left, and {cr} has sent for it.'} Whatever you do now, your children inherit it: the debt, or the end of it.`,
      choices: [
        { t: 'Hold the wedding, red cow and all', req: p => M(p, 'akr_match'), r: 'The red cow walks in front, garlanded and furious. The paper is burned at the feast, and both families cheer.',
          fx: { coin: -40, happy: 2, akin: 'wedMatch', them: { op: 30 }, flag: 'ak_dw_wed', arc: { go: 'end' } } },
        { t: 'Pay it off, and burn the paper together', req: p => !M(p, 'akr_match') && p.coin >= 40, r: 'You and {cr} burn the contract in his kitchen fire and watch it go. It was only paper.',
          fx: { coin: -40, coinPct: -0.15, honor: 3, them: { op: 25 }, deed: 'Settled a dowry sixty years unpaid', flag: 'ak_dw_paid', arc: { go: 'end' } } },
        { t: 'Pay exactly as written: forty suns and a cow', check: { s: 'persuasion', s2: 'int', d: 60 },
          win: { r: 'You stand up in the court at {town} with forty suns and a red cow on a rope. The judge laughs, and then finds for you.', fx: { coin: -40, fame: 3, epithet: 'of the Red Cow', deed: 'Paid a sixty-year dowry with forty suns and a red cow', flag: 'ak_dw_cow', arc: { go: 'end' } } },
          lose: { r: 'The judge does not laugh. You pay the interest, and the court keeps the cow.', fx: { coin: -60, coinPct: -0.15, happy: -3, deed: 'Paid a sixty-year dowry, with interest', flag: 'ak_dw_paid', arc: { go: 'end' } } } },
        { t: 'Leave it to your heirs, interest and all', r: "You put the contract in the family chest with a note: unpaid. Your children will curse you, a little, and {cr}'s will curse them.",
          fx: { happy: 3, wil: 1, them: { op: -30 }, flag: 'ak_dw_passed', arc: { go: 'end' } } },
      ] },

    // ================================================================== the old ground (four scenes)
    { id: 'ak_land_1', title: 'Your name on the stones', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { land(p, ctx); },
      text: "Sheltering from rain in the churchyard at {town}, you find your family's name cut on six stones, the oldest worn nearly smooth. The sexton says your people held {ground}, above the village, for two hundred years, until a famine and a debt to the abbey in your great-grandfather's time. A grazier called {ow} has it now. From the church door you can see the roof.",
      choices: [
        { t: 'Walk up and ask {ow} his price', r: '{ow} names a price at once, as if he had been waiting for someone with your face.', fx: { skill: { trade: 1 }, them: { op: 5, type: 'acquaint' }, arc: { mark: 'akg_asked' } } },
        { t: 'Hire on with {ow} for a season, to learn the ground', r: 'You shear his sheep, mend his walls, and learn every spring and soft place on {ground}. Your back remembers it.', fx: { health: -3, skill: { husbandry: 2 }, them: { op: 10, type: 'acquaint' }, arc: { mark: 'akg_worked' } } },
        { t: 'Start putting money by, and tell nobody', r: 'You start a box under the floor and put something in it every quarter-day. It is surprising what a box does to a person.', fx: { wil: 1, happy: -1, arc: { mark: 'akg_saving' } } },
      ] },
    { id: 'ak_land_2', title: "{ow}'s price", trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { land(p, ctx); },
      text: p => `{ow} will sell {ground}: the house, the spring, sixty acres of thin hill grass and the old orchard. He wants {price} and not a penny less, and he knows what the ground is worth to you. ${M(p, 'akg_worked') ? 'He likes you, after the season. The price is the same.' : M(p, 'akg_saving') ? 'Your box under the floor is heavier than it was.' : M(p, 'akg_asked') ? 'He has raised it since you asked.' : 'He names it as if the figure were older than both of you.'}`,
      choices: [
        { t: 'Pay his price', req: p => p.coin >= 150, r: "You pay {price} at {ow}'s table, in front of a notary and a dog. {ground} is yours.", fx: { coin: -150, coinPct: -0.15, happy: 6, akin: 'farm', arc: { mark: 'akg_bought' } } },
        { t: 'Haggle him down', req: p => p.coin >= 100, check: { s: 'trade', s2: 'persuasion', d: 50 },
          win: { r: 'You beat him down to {cheap}, over three evenings and a barrel. {ground} is yours.', fx: { coin: -100, coinPct: -0.08, happy: 4, akin: 'farm', arc: { mark: 'akg_bought' } } },
          lose: { r: '{ow} sells {ground} to the abbey out of spite, the same week.', fx: { happy: -4, them: { op: -15 }, arc: { mark: 'akg_abbey' } } } },
        { t: 'Tell {ow} you cannot pay it, yet', r: '{ow} shrugs. The ground has waited eighty years; it can wait for you, or not.', fx: { wil: 1, happy: -3, arc: { mark: 'akg_left' } } },
        { t: 'Buy only the orchard and the graves', r: '{ow} sells you the orchard and the six stones for a twentieth part. He keeps the rest, and grazes sheep among your grandfathers.', fx: { coinPct: -0.05, happy: 2, piety: 1, arc: { mark: 'akg_part' } } },
      ] },
    { id: 'ak_land_3', title: 'Old {tn}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { const { tn } = land(p, ctx); ctx.pid = tn.id; },
      text: p => `${M(p, 'akg_bought') ? '{ground} is yours, and worse than you thought: the spring silts, the roof lets in the stars, and old {tn} has grazed the low field rent-free for forty years.' : M(p, 'akg_abbey') ? "The abbey's cellarer will sell you {ground} at {ow}'s price, and a candle a year for the founder. Old {tn} grazes the low field." : M(p, 'akg_part') ? 'You own the orchard and six stones. Old {tn} keeps the graves weeded, for nothing.' : M(p, 'akg_left') ? "You could not find {ow}'s price. You own nothing on {ground}, and old {tn} keeps your family's graves weeded, for nothing." : "You own nothing on {ground}. Old {tn} keeps your family's graves weeded, for nothing."} {tn} says his people have been there as long as yours were.`,
      choices: [
        { t: 'Buy the rest, whatever it costs', req: (p, C, ctx) => !(ctx && ctx.owned) && p.coin >= 150, r: 'You pay {price}. {ground} is yours, every stone and sheep-track of it.', fx: { coin: -150, coinPct: -0.15, happy: 5, akin: 'farm', arc: { mark: 'akg_bought2' } } },
        { t: (p, ctx) => (ctx.owned ? 'Mend the roof and winter there' : 'Work the ground beside {tn} for a season'),
          r: (p, ctx) => (ctx.owned ? 'You winter on {ground} with a fire that smokes and a roof that mostly holds. In spring the spring runs clear.' : 'You work beside {tn} through the lambing, unpaid, on ground that was yours. Your back remembers it.'),
          fx: { health: -4, happy: 4, arc: { mark: 'akg_wintered' } } },
        { t: 'Let old {tn} stay as he is', r: '{tn} touches his cap and goes on as before. His dog stops barking at you.', fx: { honor: 2, them: { op: 20, type: 'acquaint' }, arc: { mark: 'akg_tn' } } },
        { t: 'Put {tn} off the land', req: (p, C, ctx) => !!(ctx && ctx.owned), r: "{tn} goes to his daughter's at {town} with a cart and the dog. The village does not forget it.", fx: { coin: 20, honor: -4, them: { op: -30, type: 'acquaint' }, arc: { mark: 'akg_evicted' } } },
      ] },
    { id: 'ak_land_4', title: 'Midsummer on {ground}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { const { tn } = land(p, ctx); ctx.pid = tn.id; },
      text: (p, ctx) => (ctx.owned ? `Midsummer on {ground}. ${M(p, 'akg_wintered') ? 'The roof holds now.' : M(p, 'akg_bought2') ? 'You paid for the same hill twice, and hold all of it.' : ''} You walk the bounds from the spring to the stones. ${M(p, 'akg_evicted') ? 'The low field is empty, and the village still does not wave.' : M(p, 'akg_tn') ? 'Old {tn} grazes the low field as he always has, and walks the bounds with you.' : 'Old {tn} walks them with you, and knows a boundary stone you did not.'} The question is what {ground} is to be, after you.`
        : 'Midsummer at {town}. You weed your family\'s six stones yourself, with old {tn} beside you. {ground} is not yours. The stones are. The question is where your own will go.'),
      choices: [
        { t: 'Cut your own name on a new stone, beside theirs', r: 'The mason cuts your name and leaves room for the date. You will lie with your people.',
          fx: { happy: 4, piety: 2, deed: 'Brought the family name home to the old ground', flag: 'ak_land_home', arc: { go: 'end' } } },
        { t: "Leave {ground} to {tn}'s family in your will", req: (p, C, ctx) => !!(ctx && ctx.owned), r: '{tn} cannot read the will, so you read it to him. He goes very quiet, and then asks if you want the dog.',
          fx: { honor: 5, them: { op: 35 }, flag: 'ak_land_given', arc: { go: 'end' } } },
        { t: 'Sell {ground} again. The dead do not need it', req: (p, C, ctx) => !!(ctx && ctx.owned), r: 'You sell it to the abbey for less than you paid. The stones stay. You do not go back.',
          fx: { akin: 'sell', coin: 200, happy: -4, deed: 'Sold the old family ground again', flag: 'ak_land_sold', arc: { go: 'end' } } },
        { t: 'Bring the six stones down to {home}', req: (p, C, ctx) => !(ctx && ctx.owned), r: 'A cart, two masons and a priest bring your people down to {home}. The churchyard there is small, but it is yours.',
          fx: { coinPct: -0.03, piety: 3, deed: 'Carried the family gravestones home', flag: 'ak_land_moved', arc: { go: 'end' } } },
      ] },

    // ================================================================== your father's other house (four scenes)
    { id: 'ak_second_1', title: 'Market day at {town}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { second(p, ctx); },
      text: (p, ctx) => `At the market in {town} you see your father buying ribbon, which he has never done in his life. He gives it to a woman of {owAge} in a good blue cloak, and a {hsBG} of {hsAge} with his ears takes his other hand. They walk off together like people who do it every week. ${ctx.moAlive ? 'Your mother thinks he is at the wool sales.' : ''}`,
      choices: [
        { t: 'Follow them home', r: 'They go to {owHouse} in {lane}. Your father has a key.', fx: { skill: { stealth: 1 }, happy: -2, arc: { mark: 'aksf_followed' } } },
        { t: 'Walk up and wish your father good morning', r: 'He goes the colour of tallow, and introduces you to {ow} very properly, as if it were any other morning.', fx: { honor: 2, happy: -3, them: { op: -10 }, arc: { mark: 'aksf_faced' } } },
        { t: 'Go home and say nothing', r: 'You go home and say nothing. At supper your father asks after your day.', fx: { wil: 1, happy: -1, arc: { mark: 'aksf_silent' } } },
      ] },
    { id: 'ak_second_2', title: '{ow}', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { const { ow } = second(p, ctx); ctx.pid = ow.id; },
      text: (p, ctx) => `{ow} keeps {owHouse} at {town}, and ${ctx.faAlive ? 'has kept your father three days in seven' : 'kept your father three days in seven, until the end,'} for {yrs} years. {hs} is hers and his. ${M(p, 'aksf_faced') ? 'Your father has begged you not to tell your mother.' : M(p, 'aksf_followed') ? '{ow} saw you in the lane, and asks you in.' : M(p, 'aksf_silent') ? 'You said nothing to anyone, so it is {ow} who comes to you, with {gift} and a speech she has practised.' : 'It is {ow} who comes to you, with {gift} and a speech she has practised.'} ${ctx.moAlive ? 'Your mother says nothing, which may mean anything.' : 'Your mother is in her grave, and was no fool, you think now.'}`,
      choices: [
        { t: (p, ctx) => (ctx.moAlive ? 'Tell your mother' : ctx.faAlive ? 'Tell your father you know' : 'Tell the priest, at least'),
          r: (p, ctx) => (ctx.moAlive ? 'You tell your mother in the dairy. She hears you out, wipes her hands, and says she has known for years.' : ctx.faAlive ? 'You tell your father you know. He sits down slowly, like an old man, and asks how {hs} looked.' : 'You tell the priest. He has heard worse, and says so.'),
          fx: { honor: 3, happy: -4, them: { op: -10 }, arc: { mark: 'aksf_told' } } },
        { t: 'Sit down with {ow} and listen', r: '{ow} talks for an hour. Your father, it turns out, is a different man in {lane}. He sings.', fx: { happy: -1, them: { op: 15 }, arc: { mark: 'aksf_listened' } } },
        { t: 'Tell {ow} to give him up, or the parish will hear', check: { s: 'intimidation', s2: 'wil', d: 50 },
          win: { r: '{ow} goes white. She says she will think about it, which from her is yes.', fx: { wil: 1, them: { op: -25 }, arc: { mark: 'aksf_threat' } } },
          lose: { r: "{ow} looks at you with your father's own patience, and says she will not.", fx: { happy: -2, them: { op: -15 }, arc: { mark: 'aksf_refused' } } } },
      ] },
    { id: 'ak_second_3', title: 'Both houses', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { const { hs } = second(p, ctx); ctx.pid = hs.id; },
      text: (p, ctx) => (ctx.faAlive ? `Your father falls ill at {town}, in {ow}'s house, and the physician says he must not be moved. He asks for you. {ow} opens the door; {hs} is on the stair. ${M(p, 'aksf_told') && ctx.moAlive ? 'Your mother is coming up the lane behind you.' : M(p, 'aksf_threat') ? 'The last thing you said to {ow} was a threat.' : M(p, 'aksf_refused') ? '{ow} refused you to your face once, and opens the door anyway.' : M(p, 'aksf_listened') ? 'You have sat in her kitchen and heard her out.' : ''}`
        : `Your father is buried at {home}. {ow} and {hs} stand at the back of the church, and everyone in it knows who they are. ${ctx.moAlive ? 'Your mother is in the front pew, and does not turn round.' : ''}`),
      choices: [
        { t: (p, ctx) => (ctx.faAlive ? 'Let them keep him, and sit with him there' : 'Bring {ow} and {hs} to the front'),
          r: (p, ctx) => (ctx.faAlive ? 'You sit with him in {lane}, with {ow} on the other side of the bed. {hs} brings the broth.' : 'You walk to the back and bring them to the front pew. The church goes very quiet, and then the priest begins.'),
          fx: { honor: 2, happy: -2, them: { op: 20 }, arc: { mark: 'aksf_front' } } },
        { t: (p, ctx) => (ctx.faAlive ? 'Have him carried home, physician or not' : 'Leave them at the back'),
          r: (p, ctx) => (ctx.faAlive ? 'You have him carried home on a door. {hs} walks beside it to the end of the lane, and no further.' : 'They stay at the back, and leave before the last hymn.'),
          fx: { wil: 1, honor: -1, them: { op: -15 }, arc: { mark: 'aksf_back' } } },
        { t: 'Ask {hs} to walk with you, after', r: "{hs} walks with you as far as the bridge. {hsHe} has your father's laugh, and uses it once.", fx: { happy: 1, them: { op: 10 }, arc: { mark: 'aksf_walk' } } },
      ] },
    { id: 'ak_second_4', title: 'Half your blood', trigger: true, cool: 1,
      cond: (p, C) => C.adult(p),
      setup: (p, ctx) => { const { hs } = second(p, ctx); ctx.pid = hs.id; if (!hs.alive) ctx.skip = 1; },
      text: p => `{hs} is {hsAge} now, with your father's ears and his laugh. {hsHe} comes to you with {hsHis} hat in {hsHis} hands. {hsHe} wants nothing from the estate. {hsHe} wants to be called your {hsBS} in the street, and to have you at {hsHis} wedding in the spring. ${M(p, 'aksf_back') ? 'You left {hsHim} at the back once, and {hsHe} has not said so.' : M(p, 'aksf_front') ? 'You brought {hsHim} to the front pew yourself, in front of the parish.' : M(p, 'aksf_walk') ? 'You walked as far as the bridge with {hsHim} once.' : ''}`,
      choices: [
        { t: 'Call {hsHim} {hsBS}, in the street and at the wedding', r: 'At the wedding you stand where family stands. Somebody asks who you are, and {hs} answers before you can.',
          fx: { happy: 3, them: { op: 40, type: 'sibling' }, flag: 'ak_sf_kin', arc: { go: 'end' } } },
        { t: 'Send a wedding gift, and keep your distance', r: 'You send a good gift and a short letter. {hs} writes back a long one, which you keep.',
          fx: { coinPct: -0.03, them: { op: 10 }, deed: 'Sent a half-sibling a wedding gift and a short letter', flag: 'ak_sf_gift', arc: { go: 'end' } } },
        { t: 'Tell {hsHim} {hsHe} has no family of yours', r: '{hs} puts {hsHis} hat back on and goes. You see {hsHim} at the market in {town} after, and {hsHe} looks through you.',
          fx: { wil: 1, them: { op: -40 }, flag: 'ak_sf_denied', arc: { go: 'end' } } },
      ] },
  ];
  // a variant that is empty leaves two spaces; the classifiers (A.evAudience, the bot's memory index) read the text
  // function's source, so the tidy wrapper hands them the original
  const tidy = s => (typeof s === 'string' ? s.replace(/\s{2,}/g, ' ').trim() : s);
  for (const e of EVS) if (typeof e.text === 'function') { const f = e.text; e.text = function (p, ctx) { return tidy(f(p, ctx)); }; e.text.toString = () => f.toString(); }
  A.defEvents(EVS);
})();
