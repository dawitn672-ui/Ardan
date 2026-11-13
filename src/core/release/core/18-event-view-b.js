// The release's core, event view (part 2 of 2): Showing an event, its tokens, checks and choices; the queue and the journal's helpers.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: A.orderReqs, A.orderJoin, A.orderMonth, A.orderLeave, A.orderSummary, A.orderTraits, A.migrateOrders,
// A.orderWithdraw, A.onDay, GD.GOODS, GD.TRANSPORT, A.mktInit, A.mkt, A.priceTarget, A.mktMonth, A.onMonth,
// A.tradeSkill, A.spread, A.buyPrice, A.sellPrice, A.mktDepth, A.homeMkt, A.cargo, A.cargoLoad, A.carryCap,
// A.buyTransport, A.buyGood, A.sellGood, A.capDist, A.runPlan, A.tradeRun, A.bestRuns, GD.QUAL, GD.MASTERS,
// A.qualOf, A.gearPrice, A.qualAvail, A.buyGearQ, GD.GEAR (+), GD.SHOP, GD.BEAST_TIER, GD.BEAST_FLYER, GD.TIER_INFO,
// A.beastTier, A.beastName, A.beastShort, A.canReachFlyer, A.armFor, GD.STR_CURVE, GD.REG_W, GD.VET_W,
// GD.LEGEND_CAP, A.strengthOf, A.vetS, A.bodyCapOf, A.bodyCap, A.takeK, A.canTake, A.crowdN, A.canTakeText, and 51
// more.

A.orderReqs = function (pc, id) {
  const o = GD.ORDERS[id],
    r = A.realm(o.realm),
    out = [],
    R2 = (label, ok, have) =>
      out.push({
        label,
        ok: !!ok,
        have: have ?? "",
      });
  R2(
    `Sworn to ${r ? r.short : "?"}`,
    pc.realm === o.realm || (pc.mil && pc.mil.realm === o.realm),
    A.realmShort(pc.mil ? pc.mil.realm : pc.realm),
  );
  R2("Serving in the army (not a mercenary)", pc.mil && !pc.mil.merc);
  if (o.req.race)
    R2(
      `One of the ${o.req.race.map(x => (GD.RACES[x] ? GD.RACES[x].name.toLowerCase() : x)).join(" or ")}`,
      o.req.race.includes(pc.race),
      GD.RACES[pc.race] ? GD.RACES[pc.race].name : pc.race,
    );
  const w = A.fightWorth(pc);
  R2(`Fighting worth ${o.req.worth}+ (${A.tierOf(o.req.worth).n})`, w >= o.req.worth, w);
  if (o.req.fame) R2(`Renown ${o.req.fame}+`, pc.fame >= o.req.fame, Math.round(pc.fame));
  if (o.req.honor) R2(`Honor ${o.req.honor}+`, pc.honor >= o.req.honor, Math.round(pc.honor));
  if (o.req.birth)
    R2(
      "Gentle birth, a title, or knighted",
      ["noble", "royal", "gentry"].includes(pc.status) ||
        (pc.noble && pc.noble.rung >= 2) ||
        (pc.job && pc.job.c === "knight"),
    );
  if (o.req.faith) R2(`Faith of ${r ? r.short : ""}`, r && pc.faith === r.faith);
  for (const sk of [o.req.skill, o.req.skill2, o.req.skill3])
    if (sk) R2(`${GD.SKILLS[sk[0]]} ${sk[1]}+`, A.skill(pc, sk[0]) >= sk[1], A.skill(pc, sk[0]));
  if (
    (o.req.stat &&
      R2(
        `${GD.STAT_NAMES[o.req.stat[0]]} ${o.req.stat[1]}+ (the body to keep up)`,
        A.stat(pc, o.req.stat[0]) >= o.req.stat[1],
        A.stat(pc, o.req.stat[0]),
      ),
    o.req.invite)
  ) {
    const ru = r && A.P(r.ruler);
    R2(
      "Invited by the crown (its opinion of you 50+)",
      ru && A.opinion(ru, pc) >= 50,
      ru ? Math.round(A.opinion(ru, pc)) : "-",
    );
  }
  return out;
};

A.orderJoin = function (id) {
  const pc = A.pc(),
    o = GD.ORDERS[id];
  if (!o)
    return {
      ok: false,
    };
  if (pc.order)
    return {
      ok: false,
      msg: "You are already sworn to an order.",
    };
  const miss = A.orderReqs(pc, id).filter(x => !x.ok);
  if (miss.length)
    return {
      ok: false,
      msg: "Not yet: " + miss.map(x => x.label).join("; ") + ".",
    };
  const d = A.orderDiv(id);
  if (!d)
    return {
      ok: false,
      msg: "The order is not in the field right now.",
    };
  pc.order = {
    id,
    rank: 0,
    since: A.absDay(),
    merit: 0,
  };
  pc.mil.div = d.id;
  pc.mil.unit = d.name;
  pc.mil.army = d.army || null;
  A.fame(pc, 4);
  pc.deeds.push({
    y: A.S.year,
    t: `Sworn to ${o.name}`,
  });
  const L = A.P((A.realm(o.realm).orders || {})[id]);
  if (L && !pc.rel[L.id]) A.link(pc, L, "superior", 30, "subordinate");
  A.log(`You kneel and swear the oath of ${o.name} — ${o.lore ? o.lore.oath : ""} — and rise one of them.`, "big");
  return {
    ok: true,
    msg: `Sworn to ${o.name}.`,
  };
};

A.orderMonth = function (pc) {
  if (!pc.order) return;
  if (!GD.ORDERS[pc.order.id] && GD.ORDER_RENAMED[pc.order.id]) pc.order.id = GD.ORDER_RENAMED[pc.order.id];
  const o = GD.ORDERS[pc.order.id],
    d = A.orderDiv(pc.order.id);
  if (!o || !pc.mil || !d) {
    if (!d && o) pc.order.homeless = (pc.order.homeless || 0) + 1;
    return;
  }
  if (pc.mil.div !== d.id) pc.mil.div = d.id;
  pc.order.merit += 1 + (d.atk != null || (A.S.fights || {})[d.loc] ? 6 : 0) + pc.fame / 50;
  const need = [0, 30, 90, 200, 400][pc.order.rank + 1];
  if (need && pc.order.merit >= need && pc.order.rank < 3 && A.chance(0.25)) {
    pc.order.rank++;
    A.fame(pc, 3);
    A.log(`The order raises you: ${A.orderRankName(pc)}.`, "big");
  }
};

A.onMonth.push(pc => A.orderMonth(pc));

A.orderLeave = function () {
  const pc = A.pc();
  if (!pc.order)
    return {
      ok: false,
    };
  const o = GD.ORDERS[pc.order.id];
  pc.order = null;
  pc.honor = Math.max(0, pc.honor - 6);
  A.log(`You give back your vows to ${o ? o.name : "the order"}. Some brothers will not look at you again.`, "warn");
  return {
    ok: true,
  };
};

A.orderSummary = function (id) {
  const o = GD.ORDERS[id],
    r = A.realm(o.realm),
    d = A.orderDiv(id),
    L = r && r.orders ? A.P(r.orders[id]) : null,
    pow = d ? Math.round(A.divPower(d)) : 0;
  let likeMen = 0;
  if (d && r && r.forces) {
    const line = r.forces.divs.filter(x => !x.elite && x.men > 500).sort((a, b) => b.men - a.men)[0];
    if (line) {
      const per = A.divPower(line) / Math.max(1, line.men);
      likeMen = Math.round(A.divPower(d) / Math.max(1e-4, per) / 50) * 50;
    }
  }
  const full = d ? A.divS(d).men : o.size;
  return {
    id,
    o,
    r,
    d,
    L,
    pow,
    men: d ? d.men : 0,
    full,
    likeMen,
    exp: d ? A.xpLevel(d.exp)[1] : "—",
    leaderWorth: L ? A.fightWorth(L) : 0,
    leaderCmd: L ? A.cmdWorth(L) : 0,
  };
};

A.orderTraits = function (id) {
  const o = GD.ORDERS[id],
    fx = o.fx || {},
    out = [],
    TER = {
      plains: "open plains",
      steppe: "the steppe",
      hills: "hills",
      forest: "forest",
      marsh: "marsh and river",
      mountains: "mountains",
      desert: "desert",
      coast: "coasts",
      tundra: "tundra",
    };
  if ((o.terr || []).length) out.push(`Deadliest in ${o.terr.map(t => TER[t] || t).join(", ")}`);
  if (fx.brk) out.push(`Charge +${Math.round(fx.brk * 100)}%`);
  if (fx.soft) out.push(`Killing power +${Math.round(fx.soft * 100)}%`);
  if (fx.hard) out.push(`Breaks armor +${Math.round(fx.hard * 100)}%`);
  if (fx.def) out.push(`Holds ground +${Math.round(fx.def * 100)}%`);
  if (fx.spd) out.push(`Moves +${Math.round(fx.spd * 100)}% faster`);
  if (fx.recon) out.push("Scouts for the whole army");
  if (o.org || fx.org) out.push("Almost never routs");
  if (o.kind === "guard") out.push("Stays with the sovereign");
  return out;
};

A.migrateOrders = function (S) {
  const ren = GD.ORDER_RENAMED;
  for (const id in S.realms || {}) {
    const r = S.realms[id];
    if (r.orders)
      for (const k of Object.keys(r.orders)) {
        if (ren[k]) {
          if (!r.orders[ren[k]]) r.orders[ren[k]] = r.orders[k];
          delete r.orders[k];
          continue;
        }
        if (!GD.ORDERS[k]) {
          const L = S.people && S.people[r.orders[k]];
          if (L && typeof L.occ == "string" && !/^once /.test(L.occ)) L.occ = "once " + L.occ.replace(/^the /, "");
          delete r.orders[k];
        }
      }
    if (r.orderGone) for (const k of Object.keys(r.orderGone)) if (ren[k] || !GD.ORDERS[k]) delete r.orderGone[k];
    if (!r.forces) continue;
    const gone = r.forces.divs.filter(x => x.elite && !GD.ORDERS[x.elite]);
    if (gone.length) {
      const ids = new Set(gone.map(d => d.id));
      for (const d of gone) r.levy = (r.levy || 0) + Math.round(d.men * 0.9);
      r.forces.divs = r.forces.divs.filter(d => !ids.has(d.id));
      for (const a of S.armies || []) if (a.divs) a.divs = a.divs.filter(x => !ids.has(x));
      const pc0 = S.people && S.people[S.pc];
      if (pc0 && pc0.mil && ids.has(pc0.mil.div)) pc0.mil.div = null;
    }
    for (const t of Object.keys(r.forces.tpl)) {
      const T = r.forces.tpl[t];
      if (T.order && !GD.ORDERS[T.order]) {
        if (ren[T.order]) {
          T.order = ren[T.order];
          T.bns = GD.ORDERS[T.order].bns.slice();
          T.sup = [];
          T.v = (T.v || 1) + 1;
          T.share = 1e-4;
        } else delete r.forces.tpl[t];
      }
    }
  }
  for (const id in S.people || {}) {
    const p = S.people[id];
    for (const k of ["occ", "title", "desc", "manner"])
      if (typeof p[k] == "string" && /Noon/.test(p[k])) {
        let w = p[k];
        for (const [re, to] of GD.LORE_RENAME) w = w.replace(re, to);
        p[k] = w;
      }
  }
  if (S.houses) A.renameDeep(S.houses);
  const pc = S.people && S.people[S.pc];
  if (
    (pc && pc.order && ren[pc.order.id] && (pc.order.id = ren[pc.order.id]), pc && pc.order && !GD.ORDERS[pc.order.id])
  ) {
    const nm = GD.ORDER_GONE[pc.order.id] || "your order";
    pc.deeds = pc.deeds || [];
    pc.deeds.push({
      y: S.year,
      t: `Served in ${nm} until the crown folded it back into the host`,
    });
    pc.order = null;
    S.news = S.news || [];
    S.news.unshift({
      y: S.year,
      d: 0,
      t: `By royal decree ${nm} is folded back into the host. Its members keep their honor and their names.`,
      c: "crown",
    });
  }
  if (A.locDirty) A.locDirty();
};

A.onMonth.push(() => {
  for (const id in GD.ORDERS) {
    const d = A.orderDiv(id);
    if (d) d.exp = Math.max(d.exp, GD.ORDERS[id].exp * 0.9);
  }
});

A.orderWithdraw = function (d) {
  const r = A.realm(d.r);
  if (!r) return false;
  const cap = r.capitalProv;
  if (cap == null || !A.friendly(A.ctrl(A.S.prov[cap]), d.r)) return false;
  if (d.army) {
    const a = A.army(d.army);
    if (a) a.divs = a.divs.filter(x => x !== d.id);
    d.army = null;
  }
  d.loc = cap;
  d.from = cap;
  d.path = [];
  d.prog = 0;
  d.atk = null;
  d.manual = false;
  d.sieging = false;
  d.rebuild = true;
  A.locDirty();
  A.news(
    `${d.name} leave the field, ${d.men} strong, and ride home to ${A.provName(cap)} to bury their dead and choose new members.`,
    "battle",
  );
  const pc = A.pc();
  if (pc && pc.mil && pc.mil.div === d.id)
    A.log("The order withdraws from the war to rebuild. You ride home with what is left of your brothers.", "warn");
  return true;
};

A.onDay = A.onDay || [];

A.onDay.push(() => {
  const S = A.S;
  for (const id in GD.ORDERS) {
    const d = A.orderDiv(id);
    if (!d) continue;
    const full = A.divS(d).men;
    if (!d.rebuild && d.men < full * 0.45) A.orderWithdraw(d);
    else {
      if (d.rebuild && d.men >= full * 0.9) d.rebuild = false;
    }
  }
});

A.onMonth.push(() => {
  for (const id in GD.ORDERS) {
    const d = A.orderDiv(id);
    if (!d || !d.rebuild) continue;
    const r = A.realm(d.r);
    if (r) A.divRefill(d, r, 0.18);
  }
});

GD.GOODS = {
  grain: {
    name: "Grain",
    base: 4,
    kw: /wheat|rye|barley|grain|rice|millet|oats|bread/i,
    war: 1.3,
    season: true,
  },
  fish: {
    name: "Salt fish",
    base: 6,
    kw: /fish|herring|cod|eel/i,
  },
  salt: {
    name: "Salt",
    base: 10,
    kw: /salt/i,
  },
  wool: {
    name: "Wool",
    base: 12,
    kw: /wool|fleece|sheep/i,
  },
  linen: {
    name: "Flax & linen",
    base: 20,
    kw: /flax|linen/i,
  },
  cloth: {
    name: "Fine cloth",
    base: 60,
    kw: /fine cloth|broadcloth|dyed cloth|velvet|brocade|cloth/i,
  },
  timber: {
    name: "Timber & tar",
    base: 3,
    kw: /timber|tar|oak|wood|pine/i,
  },
  iron: {
    name: "Iron",
    base: 18,
    kw: /\biron\b|ore/i,
    war: 1.35,
  },
  steel: {
    name: "Steel",
    base: 50,
    kw: /steel|crucible/i,
    war: 1.4,
  },
  tin: {
    name: "Tin & copper",
    base: 40,
    kw: /\btin\b|copper|bronze/i,
  },
  horses: {
    name: "Horses",
    base: 60,
    kw: /horse|pony|ponies|steed/i,
    war: 1.5,
  },
  wine: {
    name: "Wine",
    base: 25,
    kw: /wine|vine/i,
  },
  oil: {
    name: "Olive oil",
    base: 22,
    kw: /\boil\b|olive/i,
  },
  spices: {
    name: "Spices",
    base: 200,
    kw: /spice|pepper|clove|cinnamon|saffron/i,
  },
  silk: {
    name: "Silk",
    base: 260,
    kw: /silk/i,
  },
  furs: {
    name: "Furs",
    base: 80,
    kw: /fur|pelt|sable|ermine/i,
  },
  amber: {
    name: "Amber",
    base: 120,
    kw: /amber/i,
  },
  pearls: {
    name: "Pearls",
    base: 400,
    kw: /pearl/i,
  },
  ivory: {
    name: "Ivory",
    base: 300,
    kw: /ivory|tusk/i,
  },
  dyes: {
    name: "Dyes",
    base: 90,
    kw: /dye|indigo|purple|madder/i,
  },
  arms: {
    name: "Arms & armor",
    base: 70,
    kw: /arms|armor|armour|weapon|blade|sword/i,
    war: 1.5,
  },
};

GD.TRANSPORT = {
  back: {
    name: "On your back",
    cap: 1,
    price: 0,
  },
  cart: {
    name: "Ox cart",
    cap: 6,
    price: 60,
    d: "Six loads, slow but sure.",
  },
  wagon: {
    name: "Four-horse wagon",
    cap: 15,
    price: 260,
    d: "Fifteen loads. Needs roads.",
  },
  cog: {
    name: "A share in a cog",
    cap: 50,
    price: 1600,
    d: "Fifty loads by sea — if the ship comes home.",
  },
};

A.mktInit = function (r) {
  const L = LORE.realms[r.id] || {},
    ex = String(L.exports || ""),
    im = String(L.imports || ""),
    m = (r.mkt = {
      p: {},
      t: {},
      ex: [],
      im: [],
    });
  for (const k in GD.GOODS) {
    const G = GD.GOODS[k];
    let f = 1;
    if (G.kw.test(ex)) {
      f = 0.7;
      m.ex.push(k);
    } else {
      if (G.kw.test(im)) {
        f = 1.35;
        m.im.push(k);
      }
    }
    const ps = A.realmProvs(r.id),
      terr = {};
    for (const p of ps) terr[p.terr] = (terr[p.terr] || 0) + 1;
    const n = Math.max(1, ps.length);
    if (k === "grain") f *= 1.15 - (((terr.plains || 0) + (terr.steppe || 0) * 0.5) / n) * 0.4;
    if (k === "timber") f *= 1.2 - ((terr.forest || 0) / n) * 0.6;
    if (k === "iron" || k === "tin") f *= 1.15 - (((terr.mountains || 0) + (terr.hills || 0) * 0.6) / n) * 0.5;
    if (k === "fish" || k === "salt" || k === "pearls") f *= ps.some(p => p.coast) ? 0.9 : 1.25;
    if (r.race === "dwarf" && (k === "steel" || k === "arms")) f *= 0.75;
    m.t[k] = f;
    m.p[k] = Math.max(0.2, G.base * f * A.rf(0.92, 1.08));
  }
  return m;
};

A.mkt = function (rid) {
  const r = A.realm(rid);
  return r ? r.mkt || A.mktInit(r) : null;
};

A.priceTarget = function (r, k) {
  const G = GD.GOODS[k],
    m = r.mkt;
  let f = m.t[k];
  if (G.season) {
    const mo = A.monthOf(A.today()).m;
    f *= [1.12, 1.15, 1.18, 1.2, 1.1, 1, 0.95, 0.85, 0.8, 0.85, 0.95, 1.05][mo];
  }
  if ((G.war && A.atWar(r.id).length && (f *= G.war), r.stability < 30 && (f *= 1.08), m.im.includes(k))) {
    // [X1 baked patch core/09-engine-at-scale SCALE-EMBARGO-COUNT] A.priceTarget (for every imported good of every
    // market, twice a month) and A.tradeMul (for every realm in every A.updateRealmPops) counted embargoes and trade
    // pacts by walking every realm and calling A.hasTrade for each: realms² work per market pass, 23 ms per
    // updateRealmPops at 10x. 09-engine-at-scale counts the same two numbers over the realms that have an embargo on
    // their books and over the realm's own trade pacts (A.scaleEmbPact, A.scaleEmb); the original loop still runs when
    // they answer null (A.SCALE_OFF, or A.hasTrade replaced).
    let emb = 0,
      pact = 0;
    const _ep = A.scaleEmbPact && A.scaleEmbPact(r);
    if (_ep) {
      emb = _ep[0];
      pact = _ep[1];
    } else
      for (const id in A.S.realms) {
        const o = A.S.realms[id];
        if (o.alive) {
          if (o.tr && o.tr.emb && o.tr.emb[r.id] > A.S.year) emb++;
          if (A.hasTrade(r.id, id)) pact++;
        }
      }
    f *= 1 + emb * 0.06 - Math.min(0.15, pact * 0.03);
  }
  return G.base * f;
};

A.mktMonth = function () {
  for (const id in A.S.realms) {
    const r = A.S.realms[id];
    if (!r.alive || r.isRebel) continue;
    const m = A.mkt(id);
    for (const k in GD.GOODS) {
      const tgt = A.priceTarget(r, k);
      m.p[k] = Math.max(0.2, m.p[k] + (tgt - m.p[k]) * 0.2 + tgt * A.rf(-0.04, 0.04));
    }
  }
};

A.onMonth = A.onMonth || [];

A.onMonth.push(() => A.mktMonth());

A.tradeSkill = pc => A.skill(pc, "trade") + (pc.job && pc.job.c === "merchant" ? 10 + pc.job.r * 6 : 0);

A.spread = pc =>
  A.clamp(0.1 - A.tradeSkill(pc) / 1200 - (A.staffBonus ? A.staffBonus(pc, "trade") : 0) * 0.3, 0.02, 0.1);

// [X1 baked patch core/04-world-fixes ECO-THIN-MARKET-SPREAD] Buying one load raises the price by 0.3/depth (up to
// 10% in thin markets) while a skilled trader's spread could be 2%, so buying and selling straight back at home
// printed money (about 570 suns per 20 click pairs for pearls). Thin markets now have a wider spread: at least
// 0.2/depth, which keeps any buy-then-sell-back round trip at a loss. Deep markets are unchanged.
A.buyPrice = (rid, k, pc) => A.mkt(rid).p[k] * (1 + Math.max(A.spread(pc || A.pc()), 0.2 / A.mktDepth(rid)));

// [X1 baked patch core/04-world-fixes ECO-THIN-MARKET-SPREAD] Buying one load raises the price by 0.3/depth (up to
// 10% in thin markets) while a skilled trader's spread could be 2%, so buying and selling straight back at home
// printed money (about 570 suns per 20 click pairs for pearls). Thin markets now have a wider spread: at least
// 0.2/depth, which keeps any buy-then-sell-back round trip at a loss. Deep markets are unchanged.
A.sellPrice = (rid, k, pc) => A.mkt(rid).p[k] * (1 - Math.max(A.spread(pc || A.pc()), 0.2 / A.mktDepth(rid)));

A.mktDepth = rid => {
  const r = A.realm(rid);
  return A.clamp((r ? r.pop : 1e6) / 4e5, 3, 40);
};

A.homeMkt = pc => ((A.prov(pc.home) || {}).owner && A.realm(A.prov(pc.home).owner) ? A.prov(pc.home).owner : pc.realm);

A.cargo = pc => (pc.cargo = pc.cargo || {});

A.cargoLoad = pc => Object.values(A.cargo(pc)).reduce((a, b) => a + b, 0);

A.carryCap = function (pc) {
  let c = GD.TRANSPORT.back.cap;
  const mt = pc.gear && pc.gear.mount;
  if (mt === "mule") c += 2;
  else {
    if (mt === "camel") c += 3;
    else {
      if (mt) c += 1;
    }
  }
  for (const k of pc.transport || []) c += GD.TRANSPORT[k] ? GD.TRANSPORT[k].cap : 0;
  if (pc.job && pc.job.c === "merchant") c += pc.job.r * 5;
  return c;
};

A.buyTransport = function (k) {
  const pc = A.pc(),
    T = GD.TRANSPORT[k];
  return !T || !T.price
    ? {
        ok: false,
      }
    : ((pc.transport = pc.transport || []),
      pc.transport.includes(k)
        ? {
            ok: false,
            msg: "You already have one.",
          }
        : pc.coin < T.price
          ? {
              ok: false,
              msg: `That costs ${A.coin(T.price)}.`,
            }
          : k === "cog" && !A.realmProvs(A.homeMkt(pc)).some(p => p.coast)
            ? {
                ok: false,
                msg: "Your realm has no harbor.",
              }
            : ((pc.coin -= T.price),
              pc.transport.push(k),
              {
                ok: true,
                msg: `You buy ${T.name.toLowerCase()}.`,
              }));
};

A.buyGood = function (k, n) {
  const pc = A.pc(),
    rid = A.homeMkt(pc),
    m = A.mkt(rid);
  if (!GD.GOODS[k] || n <= 0)
    return {
      ok: false,
    };
  if (((n = Math.min(n, A.carryCap(pc) - A.cargoLoad(pc))), n <= 0))
    return {
      ok: false,
      msg: "You cannot carry more. Buy a cart or a wagon.",
    };
  let cost = 0;
  // [X1 baked patch economy/45-economy ECON-GOOD-DEPTH] Each extra load bought or sold moved the price by the
  // market's size (its people), the same for grain as for pearls, so fourteen loads of pearls sold into a realm
  // whose rich buy a third of a load a month as freely as grain. The per-load slide now asks for the depth of that
  // good's own market (A.mktDepth(rid, k)); found by the exploit test.
  for (let i = 0; i < n; i++) cost += A.buyPrice(rid, k) * (1 + (i * 0.6) / A.mktDepth(rid, k));
  cost = Math.round(cost);
  // [X1 baked patch economy/45-economy ECON-GOOD-DEPTH] Each extra load bought or sold moved the price by the
  // market's size (its people), the same for grain as for pearls, so fourteen loads of pearls sold into a realm
  // whose rich buy a third of a load a month as freely as grain. The per-load slide now asks for the depth of that
  // good's own market (A.mktDepth(rid, k)); found by the exploit test.
  return pc.coin < cost
    ? {
        ok: false,
        msg: `That costs ${A.coin(cost)}.`,
      }
    : ((pc.coin -= cost),
      (A.cargo(pc)[k] = (A.cargo(pc)[k] || 0) + n),
      (m.p[k] *= 1 + (n * 0.6) / A.mktDepth(rid, k) / 2),
      {
        ok: true,
        msg: `You buy ${n} load${n > 1 ? "s" : ""} of ${GD.GOODS[k].name.toLowerCase()} for ${A.coin(cost)}.`,
      });
};

A.sellGood = function (k, n, rid) {
  const pc = A.pc();
  rid = rid || A.homeMkt(pc);
  const m = A.mkt(rid),
    have = A.cargo(pc)[k] || 0;
  if (((n = Math.min(n, have)), n <= 0))
    return {
      ok: false,
    };
  let got = 0;
  // [X1 baked patch economy/45-economy ECON-GOOD-DEPTH] Each extra load bought or sold moved the price by the
  // market's size (its people), the same for grain as for pearls, so fourteen loads of pearls sold into a realm
  // whose rich buy a third of a load a month as freely as grain. The per-load slide now asks for the depth of that
  // good's own market (A.mktDepth(rid, k)); found by the exploit test.
  for (let i = 0; i < n; i++) got += A.sellPrice(rid, k) * Math.max(0.3, 1 - (i * 0.6) / A.mktDepth(rid, k));
  got = Math.round(got);
  pc.coin += got;
  A.cargo(pc)[k] -= n;
  if (!A.cargo(pc)[k]) delete A.cargo(pc)[k];
  // [X1 baked patch economy/45-economy ECON-GOOD-DEPTH] Each extra load bought or sold moved the price by the
  // market's size (its people), the same for grain as for pearls, so fourteen loads of pearls sold into a realm
  // whose rich buy a third of a load a month as freely as grain. The per-load slide now asks for the depth of that
  // good's own market (A.mktDepth(rid, k)); found by the exploit test.
  m.p[k] *= Math.max(0.5, 1 - (n * 0.6) / A.mktDepth(rid, k) / 2);
  pc.flags.traded = (pc.flags.traded || 0) + got;
  return {
    ok: true,
    got,
    msg: `You sell ${n} load${n > 1 ? "s" : ""} of ${GD.GOODS[k].name.toLowerCase()} for ${A.coin(got)}.`,
  };
};

A.capDist = function (a, b) {
  const ra = A.realm(a),
    rb = A.realm(b),
    pa = ra && A.prov(ra.capitalProv),
    pb = rb && A.prov(rb.capitalProv);
  return !pa || !pb ? 999 : Math.hypot(pa.x - pb.x, pa.y - pb.y);
};

A.runPlan = function (dest, opts) {
  const pc = A.pc(),
    home = A.homeMkt(pc);
  opts = opts || {};
  const r = A.realm(dest),
    me = A.realm(home);
  if (!r || !r.alive || dest === home) return null;
  const km = A.capDist(home, dest) * 0.9,
    sea =
      (pc.transport || []).includes("cog") &&
      A.realmProvs(home).some(p => p.coast) &&
      A.realmProvs(dest).some(p => p.coast),
    days = Math.max(6, Math.round(km / (sea ? 120 : 30))),
    near = A.neighbors(home).includes(dest),
    embargo =
      (r.tr && r.tr.emb && r.tr.emb[home] > A.S.year) || (me && me.tr && me.tr.emb && me.tr.emb[dest] > A.S.year),
    hostile = A.hostile(home, dest),
    toll = (near ? 0.04 : 0.09) * (A.hasTrade(home, dest) ? 0.5 : 1) * (embargo ? 3 : 1);
  let risk =
    0.05 +
    days / 400 +
    (A.S.wars.some(w => w.att.includes(dest) || w.def.includes(dest) || w.att.includes(home) || w.def.includes(home))
      ? 0.08
      : 0) +
    (sea ? 0.04 : 0);
  if (opts.guards) risk *= 0.35;
  risk = A.clamp(risk, 0.02, 0.6);
  const cargo = A.cargo(pc);
  let value = 0,
    sale = 0;
  const lines = [];
  for (const k in cargo) {
    const n = cargo[k];
    let s = 0;
    // [X1 baked patch economy/45-economy ECON-GOOD-DEPTH] Each extra load bought or sold moved the price by the
    // market's size (its people), the same for grain as for pearls, so fourteen loads of pearls sold into a realm
    // whose rich buy a third of a load a month as freely as grain. The per-load slide now asks for the depth of that
    // good's own market (A.mktDepth(rid, k)); found by the exploit test.
    for (let i = 0; i < n; i++) s += A.sellPrice(dest, k) * Math.max(0.3, 1 - (i * 0.6) / A.mktDepth(dest, k));
    value += A.sellPrice(home, k) * n;
    sale += s;
    lines.push({
      k,
      n,
      home: A.sellPrice(home, k),
      there: A.sellPrice(dest, k),
    });
  }
  const guardCost = opts.guards ? Math.round(12 + days * 0.8 + value * 0.02) : 0,
    ini = Math.max(1, Math.ceil(days / 25));
  return {
    dest,
    home,
    days,
    km: Math.round(km),
    sea,
    toll,
    risk,
    value: Math.round(value),
    sale: Math.round(sale),
    net: Math.round(sale * (1 - toll) - guardCost),
    guardCost,
    ini,
    lines,
    embargo,
    hostile,
  };
};

A.tradeRun = function (dest, opts) {
  const pc = A.pc();
  opts = opts || {};
  const P = A.runPlan(dest, opts);
  if (!P)
    return {
      ok: false,
      msg: "No market there.",
    };
  if (P.hostile)
    return {
      ok: false,
      msg: "You are at war with them. Nobody will buy — they will just take.",
    };
  if (!A.cargoLoad(pc) && !opts.buyBack)
    return {
      ok: false,
      msg: "You carry nothing to sell.",
    };
  if (A.S.time < P.ini)
    return {
      ok: false,
      msg: `A trip of ${P.days} days needs ${P.ini} initiative.`,
    };
  if (pc.coin < P.guardCost)
    return {
      ok: false,
      msg: "You cannot pay the guards.",
    };
  A.S.time -= P.ini;
  pc.coin -= P.guardCost;
  const log = [];
  let lost = 0;
  if (A.chance(P.risk)) {
    const what = P.sea
      ? A.pick(["a storm off the headland", "pirates out of a fog bank", "a leak below the waterline"])
      : A.pick([
          "bandits at a ford",
          "a washed-out bridge and a broken axle",
          "deserters on the road",
          `a lord's men demanding a "road tax" at sword-point`,
        ]);
    lost = A.clamp(A.rf(0.15, 0.6) - A.skill(pc, "melee") / 400 - A.skill(pc, "persuasion") / 500, 0.05, 0.7);
    for (const k in A.cargo(pc)) A.cargo(pc)[k] = Math.floor(A.cargo(pc)[k] * (1 - lost));
    log.push(`On the way: ${what}. You lose ${Math.round(lost * 100)}% of the cargo.`);
    if (A.chance(0.15) && !opts.guards) {
      pc.health = Math.max(5, pc.health - A.ri(4, 18));
      pc.lastHurt = what;
      log.push("You are hurt.");
    }
  }
  let got = 0;
  for (const k of Object.keys(A.cargo(pc))) {
    const r = A.sellGood(k, A.cargo(pc)[k], dest);
    if (r.ok) got += r.got;
  }
  const toll = Math.round(got * P.toll);
  if (((pc.coin -= toll), (got -= toll), P.embargo && A.chance(0.3))) {
    const fine = Math.round(got * 0.5);
    pc.coin -= fine;
    got -= fine;
    log.push(`Customs men catch the embargo-breaking and fine you ${A.coin(fine)}.`);
  }
  if (
    (log.push(
      `At ${A.realm(dest).capital} you sell for ${A.coin(got + toll)}, pay ${A.coin(toll)} in tolls${P.guardCost ? ` and ${A.coin(P.guardCost)} for guards` : ""}.`,
    ),
    opts.buyBack && GD.GOODS[opts.buyBack])
  ) {
    const room = A.carryCap(pc) - A.cargoLoad(pc);
    let n = 0,
      spent = 0;
    for (; n < room; ) {
      // [X1 baked patch economy/45-economy ECON-GOOD-DEPTH] Each extra load bought or sold moved the price by the
      // market's size (its people), the same for grain as for pearls, so fourteen loads of pearls sold into a realm
      // whose rich buy a third of a load a month as freely as grain. The per-load slide now asks for the depth of that
      // good's own market (A.mktDepth(rid, k)); found by the exploit test.
      const c = A.buyPrice(dest, opts.buyBack) * (1 + (n * 0.6) / A.mktDepth(dest, opts.buyBack));
      if (spent + c > Math.max(0, pc.coin) * 0.8) break;
      spent += c;
      n++;
    }
    if (n) {
      pc.coin -= Math.round(spent);
      A.cargo(pc)[opts.buyBack] = (A.cargo(pc)[opts.buyBack] || 0) + n;
      // [X1 baked patch economy/45-economy ECON-GOOD-DEPTH] Each extra load bought or sold moved the price by the
      // market's size (its people), the same for grain as for pearls, so fourteen loads of pearls sold into a realm
      // whose rich buy a third of a load a month as freely as grain. The per-load slide now asks for the depth of that
      // good's own market (A.mktDepth(rid, k)); found by the exploit test.
      A.mkt(dest).p[opts.buyBack] *= 1 + (n * 0.3) / A.mktDepth(dest, opts.buyBack);
      log.push(
        `You load ${n} loads of ${GD.GOODS[opts.buyBack].name.toLowerCase()} for the road home (${A.coin(Math.round(spent))}).`,
      );
    }
  }
  A.trainSkill(pc, "trade", 1 + P.days / 40);
  if (pc.job && pc.job.c === "merchant") pc.job.merit = (pc.job.merit || 0) + 4 + Math.round(got / 200);
  pc.flags.runs = (pc.flags.runs || 0) + 1;
  const msg = `Trade run to ${A.realmShort(dest)} (${P.days} days): ${log.join(" ")}`;
  A.log(msg, got > P.value ? "good" : "warn");
  return {
    ok: true,
    msg,
  };
};

A.bestRuns = function (pc) {
  const home = A.homeMkt(pc),
    out = [];
  for (const id in A.S.realms) {
    const r = A.S.realms[id];
    if (!r.alive || r.isRebel || id === home || A.hostile(home, id)) continue;
    A.mkt(id);
    let best = null;
    for (const k in GD.GOODS) {
      const buy = A.buyPrice(home, k),
        sell = A.sellPrice(id, k),
        m = (sell - buy) / buy;
      if (!best || m > best.m)
        best = {
          k,
          m,
          buy,
          sell,
        };
    }
    const P = A.runPlan(id, {});
    if (best && P)
      out.push({
        id,
        k: best.k,
        m: best.m,
        buy: best.buy,
        sell: best.sell,
        days: P.days,
        risk: P.risk,
        toll: P.toll,
        embargo: P.embargo,
      });
  }
  return out.sort((a, b) => b.m - b.toll - b.risk * 0.5 - (a.m - a.toll - a.risk * 0.5)).slice(0, 8);
};

GD.QUAL = {
  crude: {
    n: "Crude",
    dmg: 0.85,
    prot: 0.8,
    price: 0.55,
    d: "Bad iron, uneven temper. It will do, until it does not.",
  },
  common: {
    n: "Common",
    dmg: 1,
    prot: 1,
    price: 1,
    d: "Honest work from an ordinary forge.",
  },
  fine: {
    n: "Fine",
    dmg: 1.1,
    prot: 1.12,
    price: 2.6,
    pierce: 1,
    d: "Good steel, true balance, careful fitting.",
  },
  master: {
    n: "Masterwork",
    dmg: 1.2,
    prot: 1.25,
    price: 7,
    pierce: 1,
    spd: 1,
    d: "The best a named master can make. A handful a year.",
  },
};

GD.MASTERS = {
  "POL-01": "the Kingsmere Armorers' Guild",
  "POL-03": "the swordsmiths of Varenna",
  "POL-10": "the forges of Irondeep",
  "POL-28": "the hold-smiths of Stonehold",
  "POL-29": "the ember-forges of Emberdeep",
  "POL-30": "the crucible-masters of Ranpur",
  "POL-16": "the arms-merchants of Ostra",
  "POL-02": "the temple armorers of Solenne",
  "POL-25": "the steelworks of Velgrad",
};

A.qualOf = (p, slot) => (p.gearQ && p.gearQ[slot]) || "common";

A.gearPrice = function (k, q, rid) {
  const g = GD.GEAR[k];
  if (!g) return 0;
  const Q = GD.QUAL[q || "common"],
    m = rid && A.mkt(rid),
    metal =
      m && ["weapon", "armor", "helm", "shield", "ranged"].includes(g.slot)
        ? A.clamp((m.p.steel / GD.GOODS.steel.base) * 0.5 + (m.p.iron / GD.GOODS.iron.base) * 0.5, 0.6, 1.8)
        : m && g.slot === "mount"
          ? A.clamp(m.p.horses / GD.GOODS.horses.base, 0.6, 1.8)
          : 1;
  return Math.max(1, Math.round((g.price || 1) * Q.price * metal));
};

A.qualAvail = function (pc, q) {
  const rid = A.homeMkt(pc);
  return q === "master"
    ? GD.MASTERS[rid]
      ? [true, `Made by ${GD.MASTERS[rid]}`]
      : [
          false,
          "No master armorer works in your realm. Masterworks are made in " +
            Object.keys(GD.MASTERS).map(A.realmShort).join(", ") +
            ".",
        ]
    : [true, ""];
};

A.buyGearQ = function (k, q) {
  const pc = A.pc(),
    g = GD.GEAR[k];
  if (!g)
    return {
      ok: false,
    };
  if (((q = GD.QUAL[q] ? q : "common"), g.masterOnly && q !== "master"))
    return {
      ok: false,
      msg: `${g.name} is only made by master armorers.`,
    };
  const [ok, why] = A.gearAvailable(pc, k);
  if (!ok)
    return {
      ok: false,
      msg: why,
    };
  const [ok2, why2] = A.qualAvail(pc, q);
  if (!ok2)
    return {
      ok: false,
      msg: why2,
    };
  const price = A.gearPrice(k, q, A.homeMkt(pc));
  if (pc.coin < price)
    return {
      ok: false,
      msg: `That costs ${A.coin(price)}.`,
    };
  pc.coin -= price;
  if (g.slot === "mount" && pc.gear.mount) pc.gear.mount;
  const old = pc.gear[g.slot];
  if (old && GD.GEAR[old] && !["fists", "none"].includes(old))
    pc.coin += Math.round(A.gearPrice(old, A.qualOf(pc, g.slot), A.homeMkt(pc)) * 0.35);
  pc.gear[g.slot] = k;
  pc.gearQ = pc.gearQ || {};
  pc.gearQ[g.slot] = q;
  return {
    ok: true,
    msg: `You buy ${q === "common" ? "" : GD.QUAL[q].n.toLowerCase() + " "}${g.name.toLowerCase()} for ${A.coin(price)}${old && !["fists", "none"].includes(old) ? " and sell your old one" : ""}.`,
  };
};

Object.assign(GD.GEAR, {
  arming: {
    name: "Arming sword",
    slot: "weapon",
    price: 35,
    dmg: 11,
    spd: 2,
    reach: 1,
    pierce: 3,
    kind: "sword",
    look: "sword",
  },
  estoc: {
    name: "Estoc",
    slot: "weapon",
    price: 140,
    dmg: 12,
    spd: 1,
    reach: 3,
    pierce: 8,
    kind: "sword",
    twoHand: true,
    look: "longsword",
  },
  greatsword: {
    name: "Two-handed greatsword",
    slot: "weapon",
    price: 260,
    dmg: 17,
    spd: -1,
    reach: 5,
    pierce: 4,
    kind: "sword",
    twoHand: true,
    look: "longsword",
  },
  poleaxe: {
    name: "Poleaxe",
    slot: "weapon",
    price: 60,
    dmg: 15,
    spd: -1,
    reach: 5,
    pierce: 7,
    kind: "polearm",
    twoHand: true,
    look: "halberd",
  },
  warpick: {
    name: "War pick",
    slot: "weapon",
    price: 28,
    dmg: 12,
    spd: 0,
    reach: 0,
    pierce: 8,
    kind: "hammer",
    look: "mace",
  },
  scimitar: {
    name: "Scimitar",
    slot: "weapon",
    price: 45,
    dmg: 11,
    spd: 2,
    reach: 1,
    pierce: 2,
    kind: "sword",
    look: "saber",
  },
  boarspear: {
    name: "Boar spear",
    slot: "weapon",
    price: 6,
    dmg: 11,
    spd: 0,
    reach: 6,
    pierce: 4,
    kind: "spear",
    look: "spear",
  },
  partisan: {
    name: "Partisan",
    slot: "weapon",
    price: 30,
    dmg: 13,
    spd: -1,
    reach: 6,
    pierce: 5,
    kind: "polearm",
    twoHand: true,
    look: "halberd",
  },
  bill: {
    name: "Billhook",
    slot: "weapon",
    price: 9,
    dmg: 12,
    spd: -1,
    reach: 5,
    pierce: 4,
    kind: "polearm",
    twoHand: true,
    look: "halberd",
  },
  horsemace: {
    name: "Horseman's mace",
    slot: "weapon",
    price: 24,
    dmg: 11,
    spd: 1,
    reach: 0,
    pierce: 6,
    kind: "mace",
    look: "mace",
  },
  arbalest: {
    name: "Steel arbalest",
    slot: "ranged",
    price: 90,
    dmg: 14,
    range: 3,
    pierce: 7,
    kind: "xbow",
    look: "xbow",
  },
  horsebow: {
    name: "Recurve horse bow",
    slot: "ranged",
    price: 40,
    dmg: 9,
    range: 2,
    pierce: 3,
    kind: "bow",
    look: "compbow",
  },
  warbow: {
    name: "Heavy war bow",
    slot: "ranged",
    price: 12,
    dmg: 12,
    range: 3,
    pierce: 4,
    kind: "bow",
    look: "longbow",
  },
  gambeson: {
    name: "Quilted gambeson",
    slot: "armor",
    price: 18,
    prot: 4,
    weight: 1,
    look: "padded",
  },
  haubergeon: {
    name: "Mail haubergeon",
    slot: "armor",
    price: 90,
    prot: 6,
    weight: 2,
    look: "mail",
  },
  jack: {
    name: "Jack of plates",
    slot: "armor",
    price: 70,
    prot: 6,
    weight: 2,
    look: "brigandine",
  },
  coatplates: {
    name: "Coat of plates",
    slot: "armor",
    price: 260,
    prot: 8,
    weight: 2,
    look: "brigandine",
  },
  splinted: {
    name: "Splinted mail",
    slot: "armor",
    price: 380,
    prot: 9,
    weight: 3,
    look: "mailplate",
  },
  gothic: {
    name: "Fluted full harness",
    slot: "armor",
    price: 4800,
    prot: 13,
    weight: 3,
    look: "plate",
    masterOnly: true,
  },
  sallet: {
    name: "Sallet",
    slot: "helm",
    price: 45,
    prot: 2,
    look: "kettle",
  },
  barbute: {
    name: "Barbute",
    slot: "helm",
    price: 40,
    prot: 2,
    look: "spangen",
  },
  armet: {
    name: "Armet",
    slot: "helm",
    price: 160,
    prot: 3,
    ins: -1,
    look: "bascinet",
  },
  rouncey: {
    name: "Rouncey",
    slot: "mount",
    price: 90,
    ride: 1,
    look: "horse",
  },
  courser: {
    name: "Courser",
    slot: "mount",
    price: 450,
    ride: 3,
    look: "palfrey",
  },
  barded: {
    name: "Barded destrier",
    slot: "mount",
    price: 1500,
    ride: 3,
    war: true,
    prot: 2,
    look: "destrier",
  },
});

GD.SHOP = [
  ...new Set(
    (GD.SHOP || []).concat([
      "arming",
      "estoc",
      "greatsword",
      "poleaxe",
      "warpick",
      "scimitar",
      "boarspear",
      "partisan",
      "bill",
      "horsemace",
      "arbalest",
      "horsebow",
      "warbow",
      "gambeson",
      "haubergeon",
      "jack",
      "coatplates",
      "splinted",
      "gothic",
      "sallet",
      "barbute",
      "armet",
      "rouncey",
      "courser",
      "barded",
    ]),
  ),
];

if (GD.WEAPON_SKILL) Object.assign(GD.WEAPON_SKILL, {});

GD.BEAST_TIER = {
  "CRE-03": "animal",
  "CRE-06": "animal",
  "CRE-21": "animal",
  "CRE-26": "animal",
  "CRE-35": "animal",
  "CRE-38": "animal",
  "CRE-43": "animal",
  "CRE-47": "animal",
  "CRE-51": "animal",
  "CRE-53": "animal",
  "CRE-55": "animal",
  "CRE-56": "animal",
  "CRE-01": "great",
  "CRE-02": "great",
  "CRE-19": "great",
  "CRE-20": "great",
  "CRE-23": "great",
  "CRE-25": "great",
  "CRE-31": "great",
  "CRE-49": "great",
  "CRE-05": "titan",
  "CRE-24": "titan",
  "CRE-33": "titan",
  "CRE-34": "titan",
  "CRE-44": "titan",
  "CRE-45": "titan",
  "CRE-09": "titan",
  "CRE-61": "titan",
  "CRE-10": "great",
  "CRE-11": "titan",
  "CRE-12": "titan",
  "CRE-07": "legend",
  "CRE-08": "legend",
};

GD.BEAST_FLYER = {
  "CRE-01": 1,
  "CRE-02": 1,
  "CRE-03": 1,
  "CRE-06": 1,
};

GD.TIER_INFO = {
  animal: {
    name: "Animal",
    who: "One trained fighter can kill it. An untrained one can still die to it.",
    n: 1,
  },
  great: {
    name: "Great beast",
    who: "A hunting party's work: six to twelve people with spears, dogs and bows. Alone, even a master usually dies.",
    n: 8,
  },
  titan: {
    name: "Titan",
    who: "Over a tonne. Never fought alone. Brought down by expeditions with pits, ropes, fire and twenty or more spears — or by fleets of boats at sea.",
    n: 25,
  },
  legend: {
    name: "Legend",
    who: "Only a story. Nobody has ever seen one; scholars say it is a hoax or a mistake.",
    n: 0,
  },
};

A.beastTier = id =>
  GD.BEAST_TIER[id] ||
  (A.BEASTS[id] ? (A.BEASTS[id].hp >= 330 ? "titan" : A.BEASTS[id].hp >= 170 ? "great" : "animal") : "animal");

A.beastName = id => {
  const L = LORE.creatures.find(c => c.id === id);
  return L ? L.name : "the beast";
};

A.beastShort = id => A.beastName(id).replace(/^The /, "the ");

A.canReachFlyer = function (p) {
  const g = p.gear || {};
  if (g.ranged && GD.GEAR[g.ranged]) return "missile";
  const W = GD.GEAR[g.weapon];
  return W && ["spear", "pike", "polearm", "lance"].includes(W.kind) ? "spear" : null;
};

A.armFor = function (p) {
  const occ = (p.occ || "") + " " + (p.job ? p.job.c : "");
  if (p.ruler || p.noble || ["noble", "gentry", "royal"].includes(p.status))
    return {
      weapon: A.chance(0.7) ? "sword" : "goodsword",
      why: "a sword at the hip",
    };
  if (p.mil) {
    const g = GD.TROOP_GEAR[p.mil.troop] || GD.TROOP_GEAR.SP;
    return {
      weapon: g[0] === "lance" || g[0] === "pike" ? "sword" : g[0],
      why: "service steel",
    };
  }
  return /guard|soldier|sergeant|knight|man-at-arms|captain|mercenar|sword|warden|watch/i.test(occ)
    ? {
        weapon: A.pick(["sword", "spear", "mace"]),
        why: "a guard's weapon",
      }
    : /bandit|outlaw|thief|brigand|robber|cutthroat|pirate|raider/i.test(occ)
      ? {
          weapon: A.pick(["axe", "club", "dagger", "falchion", "shortsword"]),
          why: "a robber's blade",
        }
      : /smith|forge|armou?r/i.test(occ)
        ? {
            weapon: "warhammer",
            why: "a forge hammer",
          }
        : /hunt|forest|track|trapper/i.test(occ)
          ? {
              weapon: "spear",
              why: "a boar spear",
            }
          : /butcher|cook/i.test(occ)
            ? {
                weapon: "cleaver",
                why: "a butcher's cleaver",
              }
            : /boat|sail|fish|ferry|dock|sea/i.test(occ)
              ? {
                  weapon: "club",
                  why: "a boathook",
                }
              : /farm|peasant|serf|shepherd|herd|plough|field/i.test(occ) || ["peasant", "serf"].includes(p.status)
                ? {
                    weapon: A.pick(["staff", "club", "axe"]),
                    why: A.pick(["a quarterstaff", "a cudgel", "a wood axe"]),
                  }
                : {
                    weapon: A.pick(["dagger", "club", "staff"]),
                    why: "whatever was to hand",
                  };
};

A.onDay = A.onDay || [];

// [X1 baked patch core/03-engine-fixes ENG-DEATH-CAUSE] A death right after a hurt was put down to a natural
// cause. mortalCheck calls a death from health long gone "natural" when the last hurt is over 40 days old, but the
// day of the last hurt is stamped only by the daily tick (onDay). A duel, a beast, a battle or an event that drops
// health to 0 calls mortalCheck at once, before that tick, so it read the stamp of some older hurt: gored by the
// Hell Boar at 16, the obituary said "marsh fever" (every one of 7 such deaths logged in 12 Varenna bot lives).
// The tick now also notes the health it saw: a named hurt that took health from above 0 since then is today's. An
// event's health loss with no cause of its own keeps the old name, so for it the release's rule stands, unless the
// name itself is new since the tick (a beast fought the same day).
A.onDay.push(pc => {
  if (pc.lastHurt !== pc._lh) {
    pc._lh = pc.lastHurt;
    pc._lhDay = A.absDay ? A.absDay() : 0;
  }
  pc._hTick = pc.health;
  pc._lhAnon = 0;
});

GD.STR_CURVE = [
  [0, 0.04],
  [30, 0.15],
  [40, 0.3],
  [50, 0.7],
  [56, 1],
  [60, 1.3],
  [63, 2],
  [74, 3],
  [77, 7],
  [88, 10],
  [91, 20],
  [115, 30],
  [118, 50],
  [140, 100],
  [170, 160],
];

GD.REG_W = 56;

GD.VET_W = 68;

GD.LEGEND_CAP = 5;

A.strengthOf = function (w) {
  const C = GD.STR_CURVE;
  if (!(w > C[0][0])) return C[0][1];
  for (let i = 1; i < C.length; i++)
    if (w <= C[i][0]) {
      const [x02, y02] = C[i - 1],
        [x12, y12] = C[i];
      return Math.exp(Math.log(y02) + ((w - x02) / (x12 - x02)) * (Math.log(y12) - Math.log(y02)));
    }
  const [x0, y0] = C[C.length - 2],
    [x1, y1] = C[C.length - 1];
  return Math.exp(Math.log(y1) + ((w - x1) * (Math.log(y1) - Math.log(y0))) / (x1 - x0));
};

A.vetS = () => A.strengthOf(GD.VET_W);

A.bodyCapOf = function (sta, str, wil, health, armorW, race) {
  let c = 0.672 * Math.exp(0.054 * sta);
  c *= A.clamp(1 - 0.07 * Math.max(0, (armorW || 0) - str / 20), 0.6, 1);
  c *= 0.8 + A.clamp(wil, 0, 100) / 250;
  c *= 0.3 + (0.7 * A.clamp(health ?? 100, 0, 100)) / 100;
  if (race && GD.RACES[race] && GD.RACES[race].burst) c *= 0.8;
  return c;
};

A.bodyCap = function (p) {
  if (!p || !p.st) return 1;
  const Ar = GD.GEAR[(p.gear || {}).armor];
  return A.bodyCapOf(A.stat(p, "sta"), A.stat(p, "str"), A.stat(p, "wil"), p.health, (Ar && Ar.weight) || 0, p.race);
};

A.takeK = (S, C) => (S <= C ? S : Math.pow(S * Math.pow(C, 1.5), 0.4));

A.canTake = function (p, w) {
  w = w ?? A.fightWorth(p);
  const S = A.strengthOf(w),
    C = A.bodyCap(p),
    K = A.takeK(S, C);
  return {
    w,
    S,
    C,
    K,
    reg: K,
    vet: K / A.vetS(),
    limited: S > C * 1.05,
    skillReg: S,
  };
};

A.crowdN = function (k) {
  return k < 0.75
    ? "not even one"
    : k < 1.5
      ? "one"
      : k < 2.5
        ? "two"
        : k < 10
          ? String(Math.round(k))
          : String(Math.round(k / (k < 40 ? 1 : 5)) * (k < 40 ? 1 : 5));
};

A.canTakeText = function (p) {
  const c = A.canTake(p),
    t = `could take about ${A.crowdN(c.reg)} regular soldier${c.reg >= 1.5 ? "s" : ""} at once${c.vet >= 1.5 ? `, or ${A.crowdN(c.vet)} veterans` : ""}`;
  return c.limited ? `${t} — their skill is worth ${A.crowdN(c.skillReg)}, but their wind gives out first` : t;
};

GD.CROWD = {
  1: {
    w: 46,
    sta: 26,
    n: "green levies or toughs",
  },
  2: {
    w: 56,
    sta: 32,
    n: "regular soldiers",
  },
  3: {
    w: 68,
    sta: 40,
    n: "veterans",
  },
  4: {
    w: 82,
    sta: 52,
    n: "elite fighters",
  },
  5: {
    w: 100,
    sta: 64,
    n: "masters",
  },
};

A.groupSide = function (list) {
  const out = [];
  for (const x of list || []) {
    if (!x) continue;
    if (x.st) {
      out.push({
        p: x,
        w: A.fightWorth(x),
        S: A.strengthOf(A.fightWorth(x)),
        C: A.bodyCap(x),
      });
      continue;
    }
    const S = A.strengthOf(x.w),
      C = A.bodyCapOf(x.sta || 32, x.str || 35, x.wil || 40, 100, x.armorW || 2, x.race);
    for (let i = 0; i < Math.max(0, Math.round(x.n || 1)); i++)
      out.push({
        p: null,
        w: x.w,
        S,
        C,
      });
  }
  return out;
};

A.groupOddsSides = function (a, b, opts) {
  if (((opts = opts || {}), !a.length)) return 0;
  if (!b.length) return 1;
  const sum = l => l.reduce((s, f) => s + f.S, 0);
  let mA = 1,
    mB = 1;
  if (["passage", "bridge", "door", "stair"].includes(opts.ground)) {
    if (a.length > b.length) mA = 0.7;
    else {
      if (b.length > a.length) mB = 0.7;
    }
  }
  if (opts.arrowsA) mA *= 1.6;
  if (opts.arrowsB) mB *= 1.6;
  const SA = sum(a),
    SB = sum(b),
    eff = (list, Sme, Sopp, nOpp) => {
      let t = 0;
      for (const f of list) {
        const share = f.S / Math.max(1e-6, Sme),
          faced = share * nOpp,
          load = share * Sopp;
        t += f.S * (faced > 1.5 && load > f.C ? Math.pow(f.C / load, 1.5) : 1);
      }
      return t;
    },
    EA = eff(a, SA, SB * mB, b.length) * mA,
    EB = eff(b, SB, SA * mA, a.length) * mB;
  return EA / Math.max(1e-6, EA + EB);
};

A.groupFight = function (sideA, sideB, opts) {
  const a = A.groupSide(sideA),
    b = A.groupSide(sideB),
    pA = A.groupOddsSides(a, b, opts),
    win = A.chance(pA),
    killB = win
      ? Math.min(
          b.length,
          Math.max(1, Math.round(b.length * A.clamp(0.25 + 0.45 * A.rf(0, 1) + 0.2 * (pA - 0.5), 0.15, 0.95))),
        )
      : Math.round(b.length * A.clamp(pA * A.rf(0.3, 1.1), 0, 0.9));
  return {
    pA,
    win,
    nA: a.length,
    nB: b.length,
    killB,
  };
};

A.groupSpecSides = function (pc, spec, ctx) {
  const val = v => (typeof v == "function" ? v(pc, ctx || {}) : v),
    n = Math.max(1, Math.round(val(spec.n) || 3)),
    T = GD.CROWD[val(spec.tier) || 2] || GD.CROWD[2],
    foes = [
      {
        w: T.w,
        sta: T.sta,
        n,
        race: spec.race,
      },
    ],
    mine = [pc];
  let allies = val(spec.allies) || 0;
  if (allies === "squad") {
    const sq = ((pc.mil && pc.mil.squad) || [])
      .map(A.P)
      .filter(x => x && x.alive)
      .slice(0, 8);
    mine.push(...sq);
    allies = 0;
  }
  if (allies > 0) {
    const AT = GD.CROWD[val(spec.allyTier) || 2] || GD.CROWD[2];
    mine.push({
      w: AT.w,
      sta: AT.sta,
      n: allies,
    });
  }
  return {
    mine,
    foes,
    n,
    T,
  };
};

A.groupOdds = function (pc, spec, ctx) {
  const s = A.groupSpecSides(pc, spec, ctx);
  return Math.round(
    A.clamp(
      A.groupOddsSides(A.groupSide(s.mine), A.groupSide(s.foes), {
        ground: spec.ground,
        arrowsB: !!spec.arrows,
      }),
      0.02,
      0.98,
    ) * 100,
  );
};

A.groupFightPC = function (pc, spec, ctx) {
  const s = A.groupSpecSides(pc, spec, ctx),
    R2 = A.groupFight(s.mine, s.foes, {
      ground: spec.ground,
      arrowsB: !!spec.arrows,
    }),
    who = spec.who || s.T.n,
    take = A.canTake(pc),
    load = (s.n * A.strengthOf(s.T.w)) / Math.max(1, s.mine.length),
    lines = [];
  if (R2.win) {
    const hurt = Math.round(
      A.clamp(6 + 40 * (1 - R2.pA) * A.rf(0.4, 1.3) + 8 * Math.max(0, load / Math.max(0.5, take.C) - 1), 3, 55),
    );
    pc.health = Math.max(1, pc.health - hurt);
    if (hurt >= 8) pc.lastHurt = `a fight against ${who}`;
    lines.push(
      `(${R2.killB} of the ${s.n} go down${R2.killB < s.n ? "; the rest break and run" : ""}. You come out of it ${hurt >= 30 ? "badly cut up" : hurt >= 15 ? "bleeding" : "with bruises"}.)`,
    );
    if (s.mine.length === 1 && s.n >= 3) {
      A.fame(pc, Math.min(8, s.n));
      pc.deeds.push({
        y: A.S.year,
        t: `Fought off ${s.n} ${who} alone`,
      });
    }
  } else {
    const hurt = Math.round(A.clamp(30 + 45 * R2.pA + A.ri(0, 25), 25, 90));
    pc.health -= hurt;
    pc.lastHurt = `a fight against ${who}`;
    lines.push(
      `(You take ${R2.killB ? R2.killB + " of them" : "none of them"} with you before ${s.mine.length > 1 ? "your side breaks" : "they bring you down"}.)`,
    );
    if (spec.lethal === false && pc.health < 4) pc.health = 4;
  }
  for (const k of ["melee", GD.WEAPON_SKILL[(GD.GEAR[pc.gear.weapon] || GD.GEAR.fists).kind] || "unarmed"])
    A.trainSkill(pc, k, 1 + Math.min(3, s.n / 3));
  if (A.train) A.train(pc, "sta", 0.4);
  return {
    win: R2.win,
    pA: R2.pA,
    text: lines.join(" "),
  };
};

A.legendCount = function () {
  let n = 0;
  const S = A.S;
  if (!S) return 0;
  for (const id in S.people) {
    const p = S.people[id];
    if (p.alive && id !== S.pc && p.st && A.fightWorth(p) >= 118) n++;
  }
  return n;
};

A.POWER_CODEX = [
  {
    h: "There is no magic in Ardan",
    t: "No spells, no chosen heroes, no glowing swords. A fighter is muscle, speed, instinct, will, training and steel. Everything that makes one person stronger than another can be seen and measured.",
  },
  {
    h: "What makes a fighter",
    t: "Six body stats (strength, speed, instinct, stamina, will, intellect) set the ceiling. Weapon skill (0–100) is how much of that ceiling you can use. Gear multiplies it: a good sword over a cudgel, mail over cloth, a shield, a helm, a horse. Quality matters too — a master-forged blade cuts deeper than a village one. Bloodlines can give real but small edges (night eyes, thick skin, a longer reach).",
  },
  {
    h: "The tiers of fighters",
    t: 'Untrained → Brawler → Trained (the "regular" soldier every number is measured against) → Veteran (2–3 regulars) → Elite (7–10 regulars, or about 4 veterans) → Master (20–30 regulars, or 8–10 veterans) → Legend (50–100 regulars). One on one, a tier up wins about three fights in four, two tiers up about nine in ten. The higher you go, the fewer there are: one soldier in several hundred is Elite, a realm has one or two Masters at most, and perhaps five Legends live in all of Ardan.',
  },
  {
    h: "One against many",
    t: `"Can take 8" means: against 8 at once it is a coin toss; against 4 they nearly always win; against 16 they die. These numbers are for steel at arm's length in the open. A door, a bridge or a stair helps the one, because only two or three can reach you at a time. Bows and crossbows help the many: in the open, a Legend is just a big target.`,
  },
  {
    h: "The body has to keep up",
    t: "Skill says how fast you can kill; the body says for how long. Every man you fight costs wind. Stamina sets how much fighting you can keep up, strength decides whether your armor wears you down, and will keeps you on your feet. A Master with a ploughman's lungs fights like a Master for a minute, then like a tired man. Every profile shows both: what the skill could take, and what the body allows.",
  },
  {
    h: "Armies beat heroes",
    t: "In a real battle a Master is one more man in the line: the man beside him dies, arrows fall, the line moves. Battles are won by numbers, supply, drill, morale and generals, not by champions. The eight orders of Ardan — the Knights of the Iron Wolf, the Knights of the Sun, the Greyfeathers, the Shadow Guard, the Last Door, the Stormriders, the Tenth Wind and the Gold Masks — are 200 to 300 each, because no kingdom has more people good enough. A few hundred of them hit like one or two thousand line soldiers, more on their own ground; but they die like anyone else, and an order that loses half its members takes years to fill the gaps.",
  },
  {
    h: "Beasts: animals, great beasts, titans, legends",
    t: "Animals (wolves, hyenas, wyverns, basilisks; up to about 100 kg) — one trained fighter can win. Great beasts (cave bears, tigers, hell boars, snow apes, the Great Ash Dragon; 200–700 kg) — a hunting party's work; alone, even a Master usually dies. Titans (mammoths, woolly rhinos, river horses, amber wyrms, great crocodiles; over a tonne) — never fought alone: expeditions with pits, ropes, fire and twenty spears. Leviathans (50–70 tonnes) are hunted only by fleets of harpoon boats. Legends (the hill-sized Black Dragon, the 60-metre Dragon of Blackreef) are stories — hoaxes and misunderstandings.",
  },
  {
    h: "Why a swordsman cannot kill a dragon",
    t: "A Great Ash Dragon weighs about as much as a tiger, but it has a 13-metre wingspan and stays in the air. Its fire is for stampeding herds off cliffs, not for cooking knights. A sword cannot reach it. Arrows and crossbow bolts tear its thin wing membranes, and a torn wing grounds it — then a party of spearmen can finish it. That is how dragons have always been killed: archers, then spears, then many people at once.",
  },
  {
    h: "Children, old age and luck",
    t: "A careful life in Ardan usually runs past fifty and often past sixty. What kills people young is what they choose: duels, crime, beast hunts, war, the sea. Fevers and accidents still happen — this is a world without medicine as we know it — but the dice are not loaded against you.",
  },
];

A.occSweep = function () {
  const S = A.S;
  if (!(!S || !S.prov))
    for (const p of S.prov)
      if (p.occ && (!A.realm(p.occ) || !A.realm(p.occ).alive || !A.hostile(p.occ, p.owner))) p.occ = null;
};

A.on("warEnd", () => A.occSweep());

A.on("worldYear", () => A.occSweep());

A.onMonth = A.onMonth || [];

A.onMonth.push(() => A.occSweep());

A.MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

A.MONTH_START = A.MONTH_DAYS.reduce((a, d, i) => (a.push(i ? a[i - 1] + A.MONTH_DAYS[i - 1] : 0), a), []);

A.onDay = A.onDay || [];

A.onMonth = A.onMonth || [];

A.onYear = A.onYear || [];

A.today = () => (A._yearTurn ? 0 : Math.min(364, Math.max(0, A.S.warClock || 0)));

A.absDay = () => A.S.year * 365 + (A.S.warClock || 0);

A.monthOf = function (day) {
  let m = 0;
  for (; m < 11 && day >= A.MONTH_START[m + 1]; ) m++;
  return {
    m,
    d: day - A.MONTH_START[m] + 1,
  };
};

A.dateStr = function (day, year, short) {
  const S = A.S;
  day = day ?? A.today();
  year = year ?? S.year;
  const { m, d } = A.monthOf(Math.min(364, day));
  return short ? `${d} ${GD.MONTHS[m].slice(0, 3)}` : `${d} ${GD.MONTHS[m]} ${year}`;
};

A.monthName = day => GD.MONTHS[A.monthOf(day ?? A.today()).m];

A.wrDate = () => A.dateStr();

A.schedule = function (item, inDays) {
  const S = A.S;
  S.sched = S.sched || [];
  S.sched.push({
    at: A.absDay() + Math.max(0, Math.round(inDays || 0)),
    item,
  });
  S.sched.sort((a, b) => a.at - b.at);
};

A.stillValid = function (q) {
  const pc = A.pc();
  if (!pc || !pc.alive) return false;
  if (q.type === "event") {
    const e = A.EV[q.ev];
    if (!e) return false;
    if (e.cond && !q.forced)
      try {
        if (!e.cond(pc, A.C)) return false;
      } catch {
        return false;
      }
    return !(A.evFit && !q.forced && A.evFit(e, pc) <= 0);
  }
  if (q.type === "mission") {
    const m = q.m;
    return !((m && m.war && !A.S.wars.find(w => w.id === m.war)) || (!pc.mil && !pc.company));
  }
  if (q.type === "warroom") return false;
  if (q.type === "choice" && q.fnCheck)
    try {
      return !!q.fnCheck(pc);
    } catch {
      return false;
    }
  return true;
};

A.fireSched = function () {
  const S = A.S;
  if (!S.sched || !S.sched.length) return;
  const now = A.absDay();
  for (; S.sched.length && S.sched[0].at <= now; ) {
    const { item } = S.sched.shift();
    if (A.stillValid(item)) S.queue.push(item);
  }
};

A.initiativeCap = function (pc) {
  return Math.max(2, A.freeTime(pc));
};

A.initiativeRate = function (pc) {
  return (A.freeTime(pc) / 365) * (A.initiativeMul ? A.initiativeMul(pc) : 1);
};

A.dayTick = function () {
  const S = A.S,
    pc = A.pc();
  if (!pc || !pc.alive) return "dead";
  if (S.queue.length) return "queue";
  if ((S.warClock || 0) >= 365) {
    A.yearTurn();
    A.realmRanges();
    return S.queue.length ? "queue" : "year";
  }
  const before = S.warClock || 0;
  if (
    (S.wars.length || (S.armies || []).length ? A.wsDay() : (S.warClock = before + 1),
    A.wsQueuePCBattles && A.wsQueuePCBattles(),
    !pc.alive)
  )
    return "dead";
  S.time = Math.min(A.initiativeCap(pc), (S.time || 0) + A.initiativeRate(pc));
  for (const f of A.onDay)
    try {
      f(pc);
    } catch (e) {
      if (A.S.debug) throw e;
      console.error("onDay", e);
    }
  if (pc.alive && pc.health <= 0) A.mortalCheck(pc, pc.lastHurt || "wounds and sickness");
  A.fireSched();
  const day = S.warClock;
  if (day >= 1 && day <= 365 && A.MONTH_START.includes(day - 1)) A.monthTick(pc);
  return pc.alive ? (S.queue.length ? "queue" : null) : "dead";
};

A.monthTick = function (pc) {
  for (const f of A.onMonth)
    try {
      f(pc);
    } catch (e) {
      if (A.S.debug) throw e;
      // [X1 baked patch core/01-replay ENG-ROSTER-PURE] Opening the People tab created people: A.roster (a list for the
      // screen) hired missing colleagues with the main random stream. Colleagues are now hired by the engine at the
      // start of each month (A.ensureMates), and the roster only lists.
      console.error("onMonth", e);
    }
  A.ensureMates(pc);
  A.monthEvents(pc);
};

A.monthEvents = function (pc) {
  if (!pc.alive || (pc.prison && A.chance(0.6))) return;
  const st = A.stage(pc);
  if (A.age(pc) < 1) return;
  const p =
    {
      infant: 0.05,
      child: 0.17,
      teen: 0.28,
      adult: 0.32,
      old: 0.26,
    }[st] || 0.3;
  if (!A.chance(p)) return;
  const n = A.chance(0.12) ? 2 : 1;
  A.rollEventsN(pc, n);
};

A.rollEventsN = function (pc, n) {
  const S = A.S;
  pc.flags.ev = pc.flags.ev || {};
  S.evRecent = S.evRecent || {};
  const elig = [],
    wts = new Map();
  for (const id in A.EV) {
    const e = A.EV[id];
    // [X1 baked patch events/25-variety-guard VAR-COOLDOWN] Both event rolls (A.rollEvents, yearly, and A.rollEventsN,
    // monthly) let an event without its own cooldown come back after 6 years. The plan asks for no repeat within 10.
    // The default now reads A.EV_COOL (10); an author-set cool still wins.
    if (
      e.trigger ||
      (e.once && pc.flags.ev[id]) ||
      (S.evRecent[id] && S.year - S.evRecent[id] < (e.cool || A.EV_COOL || 6))
    )
      continue;
    let ok = false;
    try {
      ok = e.cond ? !!e.cond(pc, A.C) : true;
    } catch {
      ok = false;
    }
    if (!ok) continue;
    const fit = A.evFit ? A.evFit(e, pc) : 1;
    if (!(fit <= 0)) {
      elig.push(e);
      // [X1 baked patch events/25-variety-guard VAR-SHAPE-WEIGHT] Nothing stopped two tavern scenes, or three letters,
      // from coming one after another. Both rolls now multiply each event's weight by A.evVariety (0.15 for the shape
      // just seen, 0 for a third in a row, 1 otherwise).
      wts.set(e, (e.w || 1) * fit * (A.evVariety ? A.evVariety(e, pc) : 1));
    }
  }
  let k = 0;
  for (let i = 0; i < n && elig.length; i++) {
    const e = A.wpick(elig, x => wts.get(x));
    if (!e) break;
    elig.splice(elig.indexOf(e), 1);
    S.evRecent[e.id] = S.year;
    A.queue({
      type: "event",
      ev: e.id,
    });
    k++;
  }
  return k;
};

A.yearTurn = function () {
  const S = A.S,
    pc = A.pc();
  if (!pc || !pc.alive || S.queue.length) return false;
  const keep = S.time || 0;
  A._yearTurn = true;
  let ok = false;
  try {
    ok = A.ageUp();
  } finally {
    A._yearTurn = false;
  }
  if (!ok) return false;
  for (const f of A.onYear)
    try {
      f(pc);
    } catch (e) {
      if (A.S.debug) throw e;
      console.error("onYear", e);
    }
  S.time = Math.min(A.initiativeCap(pc), keep);
  const now = S.queue.splice(0),
    urgent = [],
    later = [];
  for (const q of now)
    if (q.type !== "warroom") {
      if (["death", "msg", "duel", "battle", "school", "travel"].includes(q.type) || q.now) urgent.push(q);
      else later.push(q);
    }
  S.queue.push(...urgent);
  const choices = later.filter(q => q.type === "choice"),
    rest = later.filter(q => q.type !== "choice");
  choices.forEach(q => A.schedule(q, A.ri(3, 45)));
  const slots = rest.length;
  rest.forEach((q, i) => {
    const lo = 4 + Math.floor((i * 330) / Math.max(1, slots));
    A.schedule(q, lo + A.ri(0, Math.max(1, Math.floor(300 / Math.max(1, slots)))));
  });
  return true;
};

A.advance = function (maxDays, stopOn) {
  if (typeof stopOn == "string") {
    const k = stopOn;
    stopOn = why2 => why2 === k;
  }
  let n = 0,
    why = null;
  for (; n < maxDays && ((why = A.dayTick()), !(why === "dead" || why === "queue")); n++)
    if (stopOn && stopOn(why)) {
      n++;
      break;
    }
  return {
    days: n,
    why,
  };
};

A.skipToEvent = function (max) {
  return A.advance(max || 365);
};

A.headReady = function () {
  const S = A.S;
  let g = 0;
  for (; S.queue.length && g++ < 50; ) {
    const q = S.queue[0];
    if (q.type === "warroom") {
      S.queue.shift();
      S.wantWarRoom = true;
      continue;
    }
    if (q.type === "event" && !q.result) {
      if (
        ((S.evShown = S.evShown || {}),
        !q.view && !q.forced && !(q.ctx && q.ctx.gid) && S.evShown[q.ev] != null && A.absDay() - S.evShown[q.ev] < 240)
      ) {
        S.queue.shift();
        continue;
      }
      if (A.eventView(q).skip) {
        S.queue.shift();
        continue;
      }
      if (!q.seen) {
        q.seen = 1;
        S.evShown[q.ev] = A.absDay();
      }
    }
    break;
  }
  return S.queue[0] || null;
};

A.SAVE_VER = 13;

A.cacheResetAll = function () {
  A._sup = {};
  A._supIn = {};
  A._thr = null;
  A._locIdx = null;
  A._idIdx = null;
  A._yearTurn = false;
  A._promoBoard = false;
  if (A.locDirty) A.locDirty();
};

A.migrate = function (S) {
  if (!S) return S;
  const v = S.ver || 8;
  S.queue = S.queue || [];
  S.sched = S.sched || [];
  S.gath = S.gath || [];
  S.dcool = S.dcool || {};
  const had = S.queue.some(q => q.type === "warroom" || q.type === "campaign");
  S.queue = S.queue.filter(
    q =>
      q.type !== "warroom" &&
      q.type !== "campaign" &&
      !(q.type === "choice" && (q.options || []).some(o => o.fn === "warroom" || o.fn === "campaign")),
  );
  if (had) S.wantWarRoom = true;
  for (const q of S.sched) if (q.item && (q.item.type === "warroom" || q.item.type === "campaign")) q.item = null;
  S.sched = S.sched.filter(q => q && q.item);
  const pc = S.people && S.people[S.pc];
  if (pc) {
    if (pc.mil && pc.mil.stance && !pc.tac)
      pc.tac = {
        atk: pc.mil.stance === "press" ? "assault" : pc.mil.stance === "spare" ? "probe" : "auto",
        def: "auto",
      };
    if (pc.mil && pc.mil.rankSince == null) pc.mil.rankSince = S.year * 365 + (S.warClock || 0) - 365;
    if (typeof S.time != "number" || !isFinite(S.time)) S.time = 2;
  }
  if (v < 11 && A.migrateV10) A.migrateV10(S);
  if (v < 13 && A.migrateOrders) A.migrateOrders(S);
  S.ver = A.SAVE_VER;
  return S;
};

A.leaveSchool = function () {
  const pc = A.pc();
  return !pc || !pc.school
    ? {
        ok: false,
      }
    : (A.log(`You leave ${pc.school.name}.`),
      (pc.school = null),
      {
        ok: true,
      });
};

A.studyHard = function () {
  const pc = A.pc(),
    S = A.S;
  return !pc || S.time < 1
    ? {
        ok: false,
        msg: "You have no time left this season.",
      }
    : ((S.time -= 1),
      (pc.flags.studyHard = S.year),
      pc.school && (A.trainSkill(pc, pc.school.skill, 4), pc.school.style && A.styleXp(pc, pc.school.style, 15)),
      A.log("You study until the candles gutter."),
      {
        ok: true,
      });
};

A.setMainStyle = function (id) {
  const pc = A.pc();
  return pc
    ? ((pc.styleMain = id || null),
      {
        ok: true,
      })
    : {
        ok: false,
      };
};

A.setTac = function (side, k) {
  const pc = A.pc();
  return !pc || (side !== "atk" && side !== "def")
    ? {
        ok: false,
      }
    : ((pc.tac = pc.tac || {
        atk: "auto",
        def: "auto",
      }),
      (pc.tac[side] = k),
      {
        ok: true,
      });
};

A.skipPrompt = function () {
  A.S.queue.shift();
  return {
    ok: true,
  };
};

A.nameChild = function (name) {
  const id = (A.S.pendingName || []).shift(),
    c = A.P(id),
    n = String(name || "")
      .trim()
      .replace(/[<>]/g, "")
      .slice(0, 24);
  if (c && n) c.given = n;
  return {
    ok: !!c,
  };
};

A.openSchools = function () {
  A.queue({
    type: "school",
  });
  return {
    ok: true,
  };
};

A.warRoomView = function () {
  A.queue({
    type: "warroom",
    war: null,
    view: true,
  });
  return {
    ok: true,
  };
};

A.realmEnsure = function (r) {
  return r && (A.polInit && A.polInit(r), (r.council = r.council || {}), r);
};

A.chooseSpec = function (tier, k) {
  const r = A.pickSpec(tier, k);
  if (r && r.ok) A.S.queue = A.S.queue.filter(q => !q.spec);
  return r;
};

A.takeWarRoomRequest = function () {
  return A.S.wantWarRoom ? (delete A.S.wantWarRoom, true) : false;
};

A.realmRanges = function () {
  for (const id in A.S.realms) {
    const r = A.S.realms[id];
    if (r.alive)
      for (const k of ["stability", "legit", "exhaustion"]) if (typeof r[k] == "number") r[k] = A.clamp(r[k], 0, 100);
  }
};

A.onDay = A.onDay || [];

A.onDay.push(() => A.realmRanges());

A.COMMANDS = [
  "newGame",
  "continueAs",
  "advance",
  "dayTick",
  "ageUp",
  "headReady",
  "eventChoose",
  "eventClose",
  "eventAuto",
  "eventView",
  "choiceChoose",
  "simpleClose",
  "skipPrompt",
  "nameChild",
  "pickSpec",
  "duelAct",
  "duelAuto",
  "duelClose",
  "missionChoose",
  "missionAuto",
  "missionClose",
  "missionView",
  "battleSetTactic",
  "battleCommitReserve",
  "battleStep",
  "battleClose",
  "battleAuto",
  "campOrder",
  "campEndTurn",
  "campAuto",
  "campClose",
  "doActivity",
  "applyJob",
  "quitJob",
  "workHard",
  "doWork",
  "takeOffer",
  "declineOffer",
  "resign",
  "desert",
  "volunteer",
  "interact",
  "getToKnow",
  "callFavor",
  "bossAct",
  "teachChild",
  "decide",
  "takeDoor",
  "travelTo",
  "tradeRun",
  "setPlan",
  "planSession",
  "setLifestyle",
  "setStance",
  "setDrill",
  "drillReview",
  "exercise",
  "setTac",
  "chooseSpec",
  "takeWarRoomRequest",
  "joinSchool",
  "joinSchool2",
  "leaveSchool",
  "studyHard",
  "openSchools",
  "setMainStyle",
  "foundStyle",
  "orderJoin",
  "orderLeave",
  "joinFaction",
  "leaveFaction",
  "buyGear",
  "buyGearQ",
  "sellGear",
  "buyGood",
  "sellGood",
  "buyProperty",
  "sellProperty",
  "buyTransport",
  "recruitCompany",
  "nobleAction",
  "rulerAction",
  "setLaw",
  "councilAct",
  "councilPropose",
  "diplDo",
  "peaceOffer",
  "fxAct",
  "staffAppoint",
  "staffDelegate",
  "staffDelegateTo",
  "realmEnsure",
  "polInit",
  "F",
  "indCount",
  "armySync",
  "wrOpen",
  "wrClose",
  "wrLeave",
  "wrAuto",
  "warRoomView",
  "wsDay",
  "wsSetOrder",
  "wsDivOrder",
  "wsDivHold",
  "wsDivRaid",
  "wsDivRejoin",
  "wsLeadBattle",
  "wsMerge",
  "wsSplit",
  "wsTransferDiv",
  "wsOfferPeace",
  "log",
  "queue",
];

A.J = null;

A.jDepth = 0;

A.jPaused = false;
