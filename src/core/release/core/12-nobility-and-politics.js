// The release's core, nobility and politics: Noble actions, authority, reasons for war, the politics year and calls to arms.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: A.CHOICE_FN (+), A.nobleAction, A.AUTH, A.CB, A.polInit, A.polSeed, A.polAll, A.hasNap, A.hasTrade,
// A.isTributary, A.tributariesOf, A.claimsOn, A.ally, A.unally, A.tradeMul, A.politicsYear, politicsYearNow,
// A.callToArms, callToArmsNow.

Object.assign(A.CHOICE_FN, {
  swearNew(rid) {
    const pc = A.pc();
    if (pc.noble) {
      pc.noble.realm = rid;
      pc.realm = rid;
      pc.honor = A.clamp(pc.honor - 5, 0, 100);
      A.log(`You swear to ${A.realmName(rid)}. Your lands stay yours.`);
    }
  },
  loseLand() {
    const pc = A.pc();
    if (pc.noble) {
      pc.noble.rung = Math.min(pc.noble.rung, 3);
      pc.noble.holding = null;
      pc.honor = A.clamp(pc.honor + 8, 0, 100);
      A.log("You keep your oath and lose your lands. Honor is cold comfort, but it is yours.");
    }
  },
  levyBattle(arg) {
    const pc = A.pc();
    if (!pc.noble) {
      A.log("The summons no longer concerns you.");
      return;
    }
    const r = A.realm(pc.noble.realm),
      men = arg.men,
      er = A.realm(arg.enemy),
      B = A.newBattle({
        title: "A battle in " + (A.pick(A.S.prov.filter(p => p.owner === arg.enemy)) || A.prov(pc.home)).name,
        terr: A.pick(["plains", "hills", "forest"]),
        war: arg.war,
        sideA: {
          realm: pc.noble.realm,
          name: `your levy and the ${r ? r.short : ""} host`,
          men: Math.round(men * A.rf(3, 8)),
          q: r ? r.armyQ : 0.9,
          commander: pc.id,
        },
        sideB: {
          realm: arg.enemy,
          name: er ? er.short : "the enemy",
          men: Math.round(men * A.rf(3, 9)),
          q: er ? er.armyQ : 0.9,
        },
      });
    A.queue({
      type: "battle",
      b: B,
    });
    pc.noble.levied = A.S.year;
  },
  scutage(levy) {
    const pc = A.pc(),
      c = Math.round(levy * 3 + 20);
    pc.coin -= c;
    A.log(`You pay ${A.coin(c)} in shield-money and stay home.`);
    if (pc.coin < 0) {
      pc.debt = (pc.debt || 0) - pc.coin;
      pc.coin = 0;
    }
  },
  ignoreSummons() {
    const pc = A.pc(),
      r = A.realm(pc.noble.realm),
      ru = r ? A.P(r.ruler) : null;
    if (ru) A.addOp(pc, ru, -25);
    pc.honor = A.clamp(pc.honor - 12, 0, 100);
    A.log("You ignore the summons. The crown will remember.", "bad");
    if (A.chance(0.25)) {
      pc.noble.rung = Math.max(0, pc.noble.rung - 1);
      A.log(`The crown strips you of a rung: you are now ${A.nobleTitle(pc) || "landless"}.`, "bad");
    }
  },
});

// [X1 baked patch core/03-engine-fixes ENG-NOBLE-AGE] A newborn noble could attend court ("You shine at court"),
// petition the crown, seek a council seat and ride the estate ("You ride your lands, hear the reeves, fix the
// mill") — nobleAction had no age check. These need an adult now; the court tab still shows them, and says why.
A.nobleAction = function (key) {
  const pc = A.pc();
  if (!pc.noble && !["royal", "noble", "gentry"].includes(pc.status))
    return {
      ok: false,
    };
  if (!A.isAdult(pc))
    return {
      ok: false,
      msg: "You are too young for that. For now the court is something grown-ups talk about over your head.",
    };
  const r = A.realm(pc.noble ? pc.noble.realm : pc.realm),
    ru = r ? A.P(r.ruler) : null;
  if (A.S.yearActs["n_" + key])
    return {
      ok: false,
      msg: "Once a year.",
    };
  if (A.S.time < 1)
    return {
      ok: false,
      msg: "Not enough initiative (⧗) yet.",
    };
  switch (
    ((A.S.yearActs["n_" + key] = 1),
    (A.S.time -= 1),
    ru && !pc.rel[ru.id] && A.link(pc, ru, "lord", 20, "acquaint"),
    key)
  ) {
    case "court": {
      const ok = A.chance(0.45 + A.charm(pc) / 250);
      if (ru) A.addOp(pc, ru, ok ? A.ri(4, 12) : -A.ri(1, 5));
      A.trainSkill(pc, "diplomacy", 3);
      A.trainSkill(pc, "intrigue", 1.5);
      A.queue({
        type: "event",
        ev: A.pick(["court_whisper", "court_duel", "court_favor", "court_lady", "court_poison"]),
      });
      return {
        ok: true,
        msg: ok ? "You shine at court." : "Court is a snake pit. You are bitten.",
      };
    }
    case "petition": {
      const op = ru ? A.opinion(pc, ru) : 0,
        rung = pc.noble ? pc.noble.rung : 0,
        need = 20 + rung * 8,
        deedBonus =
          pc.deeds.length * 4 +
          (pc.mil ? pc.mil.rank * 3 : 0) +
          (A.letterPower && A.letterPower(pc, "court") ? A.useLetter(pc, "court") / 2 : 0);
      if (A.chance(A.clamp((op + pc.fame + deedBonus - need) / 120, 0.03, 0.75)) && r) {
        const nr = Math.min(8, rung + (rung < 2 ? 2 : 1)),
          rp = A.realmProvs(r.id);
        // [X1 baked patch family/99994-v2-family V2F-PETITION] A granted petition for a rung of 4 or more (A.nobleAction)
        // drew any province of the realm, held or not. The draw stays (the stream does not move) and the province is then
        // checked against every other holder.
        pc.noble = {
          rung: nr,
          realm: r.id,
          holding:
            nr >= 4
              ? pc.noble && pc.noble.holding != null
                ? pc.noble.holding
                : rp.length
                  ? A.V2F && A.V2F.freeHolding
                    ? A.V2F.freeHolding(r.id, A.pick(rp).id, pc)
                    : A.pick(rp).id
                  : pc.home
              : pc.noble
                ? pc.noble.holding
                : null,
        };
        A.log(`Your petition is granted. You are raised to ${A.nobleTitle(pc)}!`, "big");
        A.fame(pc, 5);
        if (nr === 2) pc.title = pc.sex === "F" ? "Dame" : "Sir";
        return {
          ok: true,
        };
      }
      if (ru) A.addOp(pc, ru, -4);
      A.log('Your petition is refused. "Do more. Then ask."', "bad");
      return {
        ok: true,
      };
    }
    case "office": {
      if (!r || !ru)
        return {
          ok: false,
        };
      const seat = A.pick(Object.keys(A.COUNCIL)),
        sk = A.skill(pc, A.COUNCIL[seat].skill);
      return A.chance(A.clamp((sk + A.opinion(pc, ru) + pc.fame / 2 - 60) / 100, 0.03, 0.7))
        ? ((r.council = r.council || {}),
          (r.council[seat] = pc.id),
          (pc.office = seat),
          A.log(`${A.rulerStyle(ru, r)} names you ${A.COUNCIL[seat].name}!`, "big"),
          A.fame(pc, 6),
          {
            ok: true,
          })
        : (A.log(`You seek the post of ${A.COUNCIL[seat].name}, but another gets it.`, "bad"),
          {
            ok: true,
          });
    }
    case "estate": {
      const g = Math.round(
        (pc.noble ? GD.NOBLE_RUNGS[pc.noble.rung].income : 50) *
          A.rf(0.05, 0.25) *
          (0.5 + A.skill(pc, "stewardship") / 100),
      );
      pc.coin += g;
      A.trainSkill(pc, "stewardship", 4);
      return {
        ok: true,
        msg: `You ride your lands, hear the reeves, fix the mill. +${A.coin(g)}.`,
      };
    }
  }
  return {
    ok: false,
  };
};

A.AUTH = [
  ["Low", 0.88, 8],
  ["Limited", 1, 0],
  ["High", 1.12, -6],
  ["Absolute", 1.25, -14],
];

A.CB = {
  conquest: "Conquest",
  reconquest: "Reclaim lost land",
  holy: "Holy war",
  throne: "War of succession",
  insult: "Avenge an insult",
  independence: "Independence",
  coalition: "Coalition against a conqueror",
  tribute: "Refused tribute",
  liberty: "Liberties of the lords",
};

A.polInit = function (r) {
  return (
    r &&
    ((r.pacts = r.pacts || {
      nap: {},
      trade: {},
    }),
    r.infamy == null && (r.infamy = 0),
    (r.claims = r.claims || {}),
    (r.laws = r.laws || {}),
    r.laws.authority == null &&
      (r.laws.authority = /empire|absolute|sultan|khan/i.test(r.gov || "")
        ? 2
        : /republic|league|confederacy|council|elect/i.test(r.gov || "")
          ? 0
          : 1),
    r.laws.levy == null && (r.laws.levy = 1),
    (r.marriages = r.marriages || {}),
    r)
  );
};

A.polSeed = function () {
  const S = A.S;
  for (const id in S.realms) {
    const r = S.realms[id],
      L = LORE.realms[id],
      g = String((L && L.gov) || r.gov || "");
    r.laws.authority = /empire|god-king|sultan|emirate|hold-monarchy|forge-monarchy|sacred/i.test(g)
      ? 2
      : /republic|council|league|confedera|horde|clans|ring|brotherhood|charter|compact|eldest/i.test(g)
        ? 0
        : 1;
  }
  for (const x of LORE.relations) {
    const a = S.realms[x.a],
      b = S.realms[x.b];
    if (!(!a || !b)) {
      if (x.rel === "trade" || x.rel === "debt") {
        a.pacts.trade[b.id] = S.year + A.ri(8, 15);
        b.pacts.trade[a.id] = a.pacts.trade[b.id];
      }
      if (/cold peace|tense peace|truce|treaty/i.test(x.detail || "")) {
        a.pacts.nap[b.id] = S.year + A.ri(3, 9);
        b.pacts.nap[a.id] = a.pacts.nap[b.id];
      }
    }
  }
};

A.polAll = function () {
  for (const id in A.S.realms) A.polInit(A.S.realms[id]);
  A.S.factions = A.S.factions || [];
  A.S.coalitions = A.S.coalitions || {};
};

A.hasNap = (a, b) => {
  const r = A.realm(a);
  return !!(r && r.pacts && r.pacts.nap[b] && r.pacts.nap[b] > A.S.year);
};

A.hasTrade = (a, b) => {
  const r = A.realm(a);
  return !!(r && r.pacts && r.pacts.trade[b] && r.pacts.trade[b] > A.S.year);
};

A.isTributary = (a, b) => {
  const r = A.realm(a);
  return !!(r && r.overlord === b);
};

A.tributariesOf = rid => Object.values(A.S.realms).filter(r => r.alive && r.overlord === rid);

A.claimsOn = (a, b) => {
  const r = A.realm(a);
  return !r || !r.claims ? [] : A.S.prov.filter(p => p.owner === b && r.claims[p.id] && A.S.year - r.claims[p.id] < 60);
};

A.ally = function (a, b) {
  const ra = A.realm(a),
    rb = A.realm(b);
  if (!(!ra || !rb)) {
    if (!ra.allies.includes(b)) ra.allies.push(b);
    if (!rb.allies.includes(a)) rb.allies.push(a);
  }
};

A.unally = function (a, b) {
  const ra = A.realm(a),
    rb = A.realm(b);
  if (ra) ra.allies = ra.allies.filter(x => x !== b);
  if (rb) rb.allies = rb.allies.filter(x => x !== a);
};

A.tradeMul = function (r) {
  const m =
    1 +
    Math.min(
      0.16,
      Object.keys((r.pacts && r.pacts.trade) || {}).filter(
        k => r.pacts.trade[k] > A.S.year && A.realm(k) && A.realm(k).alive,
      ).length * 0.04,
    );
  // [X1 baked patch core/09-engine-at-scale SCALE-EMBARGO-COUNT] A.priceTarget (for every imported good of every
  // market, twice a month) and A.tradeMul (for every realm in every A.updateRealmPops) counted embargoes and trade
  // pacts by walking every realm and calling A.hasTrade for each: realms² work per market pass, 23 ms per
  // updateRealmPops at 10x. 09-engine-at-scale counts the same two numbers over the realms that have an embargo on
  // their books and over the realm's own trade pacts (A.scaleEmbPact, A.scaleEmb); the original loop still runs when
  // they answer null (A.SCALE_OFF, or A.hasTrade replaced).
  let n = A.scaleEmb ? A.scaleEmb(r) : null;
  if (n == null) {
    n = 0;
    for (const id in A.S.realms) {
      const o = A.S.realms[id];
      if (o.alive && o.tr && o.tr.emb && o.tr.emb[r.id] > A.S.year) n++;
    }
  }
  const own = r.tr && r.tr.emb ? Object.keys(r.tr.emb).filter(k => r.tr.emb[k] > A.S.year).length : 0;
  return m * (1 - Math.min(0.12, n * 0.03 + own * 0.01));
};

A.politicsYear = function () {
  A.emit("politicsYearStart");
  const r = politicsYearNow();
  A.emit("politicsYearEnd");
  return r;
};

const politicsYearNow = function () {
  const S = A.S;
  A.polAll();
  const live = Object.values(S.realms).filter(r => r.alive && !r.isRebel);
  for (const r of live) {
    r.infamy = Math.max(0, r.infamy - (A.atWar(r.id).length ? 2 : 4));
    for (const k in r.pacts.nap) if (r.pacts.nap[k] <= S.year) delete r.pacts.nap[k];
    for (const k in r.pacts.trade)
      if (r.pacts.trade[k] <= S.year)
        if (A.relBetween(r.id, k) > 20 && !A.hostile(r.id, k) && !r.playerRun && !(A.realm(k) || {}).playerRun) {
          r.pacts.trade[k] = S.year + 15;
          const o = A.realm(k);
          if (o && o.pacts) o.pacts.trade[r.id] = S.year + 15;
        } else delete r.pacts.trade[k];
    // [X1 baked patch core/09-engine-at-scale SCALE-PAIR-PERSONA] A.politicsYear weighs every pair of live realms
    // (A.aiPullSum), and each weighing asks A.rulerPersona for both rulers: 2 × realms² persona lookups a year, each
    // building a key from the ruler's traits. Nothing in one realm's pass over the others changes a ruler, so
    // 09-engine-at-scale remembers each persona for the length of that pass (A.scalePairs opens and closes it;
    // A.SCALE_CHECK compares every remembered persona with a fresh one).
    for (const k in r.claims) if (S.year - r.claims[k] >= 60) delete r.claims[k];
    if (A.scalePairs) A.scalePairs(1);
    for (const o of live) {
      if (o.id === r.id) continue;
      // [X1 baked patch diplomacy/20-ai-personality AIP-DRIFT] A.politicsYear: yearly relation drift comes from
      // A.aiPullSum, which holds the same seven terms as before plus the ruler's character, so the diplomacy card can
      // show exactly what pulls opinion each year.
      let d = A.aiPullSum(r.id, o.id);
      // [X1 baked patch core/09-engine-at-scale SCALE-PAIR-PERSONA] A.politicsYear weighs every pair of live realms
      // (A.aiPullSum), and each weighing asks A.rulerPersona for both rulers: 2 × realms² persona lookups a year, each
      // building a key from the ruler's traits. Nothing in one realm's pass over the others changes a ruler, so
      // 09-engine-at-scale remembers each persona for the length of that pass (A.scalePairs opens and closes it;
      // A.SCALE_CHECK compares every remembered persona with a fresh one).
      r.rel[o.id] = A.clamp(Math.round((r.rel[o.id] || 0) + d), -100, 100);
    }
    if (A.scalePairs) A.scalePairs(0);
    if (r.overlord) {
      const ov = A.realm(r.overlord);
      if (!ov || !ov.alive) {
        r.overlord = null;
        continue;
      }
      const t = Math.round(r.income * 0.08);
      r.treasury -= t;
      ov.treasury += t;
      r.tributePaid = t;
      // [X1 baked patch diplomacy/20-ai-personality AIP-TRIBUTE] Tribute and greed: a tributary defies its overlord by
      // pride (A.aiDefy) and the overlord marches by wrath (A.aiPunish, rolled only when a war is possible); a greedy
      // victor makes the loser a tributary more often (A.aiExact); greedy rulers demand tribute of the player
      // (A.aiGreedW); the player's own tribute demand is weighed by the target ruler's pride and caution, and their
      // wrath decides whether a refusal means war.
      if (A.aiDefy(r.id, ov.id)) {
        r.overlord = null;
        A.news(`${r.name} stops paying tribute to ${ov.name}.`, "crown");
        // [X1 baked patch diplomacy/20-ai-personality AIP-TRIBUTE] Tribute and greed: a tributary defies its overlord by
        // pride (A.aiDefy) and the overlord marches by wrath (A.aiPunish, rolled only when a war is possible); a greedy
        // victor makes the loser a tributary more often (A.aiExact); greedy rulers demand tribute of the player
        // (A.aiGreedW); the player's own tribute demand is weighed by the target ruler's pride and caution, and their
        // wrath decides whether a refusal means war.
        if (!ov.playerRun && !A.atWar(ov.id).some(w => A.warSide(w, r.id)) && A.aiPunish(ov.id, r.id))
          A.startWar(ov.id, r.id, null, "tribute");
      }
    }
  }
  if (!S.clockMode && A.diploAI)
    for (let i = 0; i < 12; i++) {
      A.diploAI(5);
      for (const r of Object.values(S.realms)) if (r.alive && r.justify) A.justifyMonth(r);
    }
  S.coalitions = {};
  for (const t of live) {
    if (t.infamy < 40) continue;
    // [X1 baked patch core/09-engine-at-scale WORLD-REACH] Neighbours (land or sea lane) could declare war, a
    // coalition took in the neighbours of neighbours, and an ally or tributary (or a partner in a defensive pact, a
    // guarantee or a league) answered a call to arms from anywhere. On the Great Continent that made coalitions of 25
    // realms from six lands and allies marching 3,000 km to a war with no front. A.outOfReach (false on the Known
    // World) keeps all three to realms whose land comes within 1,500 km of the other side.
    // [X1 baked patch diplomacy/99996-v2-diplomacy V2DIP-COALITION] Playtest 1 #22: a coalition took every realm whose
    // opinion of the conqueror was under 20 (22 of 33, most of them cordial). A member must now stand cold or worse
    // with it by the one derived status (A.V2DIP.status), which counts fear of its conquests as a reason.
    const mem = live
      .filter(
        m =>
          m.id !== t.id &&
          !m.allies.includes(t.id) &&
          m.overlord !== t.id &&
          (A.V2DIP && A.V2DIP.ON ? A.V2DIP.COLD.includes(A.V2DIP.status(m.id, t.id)) : A.relBetween(m.id, t.id) < 20) &&
          (A.neighbors(t.id).includes(m.id) || A.neighbors(m.id).some(n => A.neighbors(t.id).includes(n))) &&
          !(A.outOfReach && A.outOfReach(m.id, t.id)),
      )
      .map(m => m.id);
    if (
      mem.length >= 2 &&
      ((S.coalitions[t.id] = mem),
      mem.reduce((a, m) => a + A.realmPower(A.realm(m)), 0) > A.realmPower(t) * 1.3 &&
        t.infamy > 58 &&
        A.chance(0.15) &&
        !A.atWar(t.id).length)
    ) {
      // [X1 baked patch diplomacy/20-ai-personality AIP-CLAIMANTS] Would-be rulers have tempers too: in AI-started
      // succession wars (a contested succession, a tottering crown) the claimant presses or kneels by his traits
      // (A.aiPressClaim); a refused faction rises or backs down by its leader's traits (A.aiRevolt), and the ruler
      // yields or refuses by pride and caution (A.aiFactionAnswer). Event-driven civil wars are untouched. A coalition
      // is led by its strongest hawk.
      const lead = mem
          .map(A.realm)
          .sort((a, b) => A.realmPower(b) * A.aiWarW(b.id) - A.realmPower(a) * A.aiWarW(a.id))[0],
        w = A.startWar(
          lead.id,
          t.id,
          `The War of the Coalition against ${t.short.replace(/^the /i, "")}`,
          "coalition",
          {
            noAllies: true,
          },
        );
      // [X1 baked patch diplomacy/20-ai-personality AIP-CLAIMANTS] Would-be rulers have tempers too: in AI-started
      // succession wars (a contested succession, a tottering crown) the claimant presses or kneels by his traits
      // (A.aiPressClaim); a refused faction rises or backs down by its leader's traits (A.aiRevolt), and the ruler
      // yields or refuses by pride and caution (A.aiFactionAnswer). Event-driven civil wars are untouched. A coalition
      // is led by its strongest hawk.
      if (w) {
        A.aiNoteCoalition(lead.id, t.id, mem);
        for (const m of mem) if (m !== lead.id && !w.att.includes(m) && !A.atWar(m).length) w.att.push(m);
        A.news(`${mem.length} realms march together against ${t.name}.`, "war");
      }
    }
  }
  for (const r of live) A.factionsYear(r);
  if (A.aiDiploYear) A.aiDiploYear();
};

A.callToArms = function (w, opts) {
  callToArmsNow(w, opts);
  A.emit("callToArms", w, opts);
};

const callToArmsNow = function (w, opts) {
  const S = A.S,
    att = w.leadA,
    def = w.leadD,
    ra = A.realm(att),
    rd = A.realm(def);
  if (!ra || !rd) return;
  A.polInit(ra);
  A.polInit(rd);
  // [X1 baked patch core/09-engine-at-scale WORLD-REACH] Neighbours (land or sea lane) could declare war, a
  // coalition took in the neighbours of neighbours, and an ally or tributary (or a partner in a defensive pact, a
  // guarantee or a league) answered a call to arms from anywhere. On the Great Continent that made coalitions of 25
  // realms from six lands and allies marching 3,000 km to a war with no front. A.outOfReach (false on the Known
  // World) keeps all three to realms whose land comes within 1,500 km of the other side.
  const join = (side, rid, why) => {
    const r = A.realm(rid);
    return !r ||
      !r.alive ||
      (A.outOfReach && A.outOfReach(rid, side === "att" ? w.leadD : w.leadA)) ||
      w.att.includes(rid) ||
      w.def.includes(rid) ||
      (side === "att" ? w.def : w.att).some(x => A.friendly(x, rid) && A.atWar(rid).length)
      ? false
      : (w[side].push(rid), why && A.news(`${r.name} ${why}.`, "war"), true);
  };
  for (const al of rd.allies.slice()) {
    const a = A.realm(al);
    if (!a || !a.alive || al === att) continue;
    // [X1 baked patch diplomacy/20-ai-personality AIP-CALL-TO-ARMS] callToArmsNow and A.warPreview: honorable rulers
    // answer calls to arms more often, craven ones less (A.aiCallAdj); warlike allies join offensive wars more often;
    // each answer is logged with reasons.
    const rel = A.relBetween(al, def),
      p = A.clamp(
        0.45 +
          rel / 200 -
          a.exhaustion / 200 -
          (A.atWar(al).length ? 0.3 : 0) -
          (A.relBetween(al, att) > 40 ? 0.25 : 0) +
          (a.marriages && a.marriages[def] ? 0.1 : 0) +
          A.aiCallAdj(al),
        0.05,
        0.95,
      );
    if (a.playerRun) {
      const pc = A.pc();
      if (pc && pc.ruler === al)
        A.queue({
          type: "choice",
          title: "A call to arms",
          text: `${ra.name} has declared war on your ally ${rd.name} (${A.CB[w.cb] || "conquest"}). ${rd.short}'s envoy kneels in your hall: "You swore. Will you march?" Refusing breaks the alliance, and every court will hear of it.`,
          options: [
            {
              t: `Honor the alliance: war with ${ra.short}`,
              fn: "callJoin",
              arg: {
                w: w.id,
                side: "def",
                r: al,
              },
            },
            {
              t: "Refuse (alliance broken, relations −30, legitimacy −8)",
              fn: "callRefuse",
              arg: {
                w: w.id,
                side: "def",
                r: al,
                ally: def,
              },
            },
          ],
        });
      continue;
    }
    // [X1 baked patch diplomacy/20-ai-personality AIP-CALL-TO-ARMS] callToArmsNow and A.warPreview: honorable rulers
    // answer calls to arms more often, craven ones less (A.aiCallAdj); warlike allies join offensive wars more often;
    // each answer is logged with reasons.
    if (A.aiAnswerCall(al, def, att, p))
      join("def", al, `honors the alliance and joins ${rd.short} against ${ra.short}`);
    else {
      A.unally(al, def);
      A.addRel(al, def, -30);
      A.news(`${a.name} refuses the call to arms. The alliance with ${rd.short} is broken.`, "crown");
    }
  }
  if (rd.overlord && rd.overlord !== att) join("def", rd.overlord, `marches to protect its tributary ${rd.short}`);
  for (const t of A.tributariesOf(def)) join("def", t.id, "answers its overlord's summons");
  for (const t of A.tributariesOf(att)) if (A.chance(0.7)) join("att", t.id, null);
  for (const al of ra.allies.slice()) {
    const a = A.realm(al);
    if (!(!a || !a.alive || a.playerRun || al === def)) {
      // [X1 baked patch diplomacy/20-ai-personality AIP-CALL-TO-ARMS] callToArmsNow and A.warPreview: honorable rulers
      // answer calls to arms more often, craven ones less (A.aiCallAdj); warlike allies join offensive wars more often;
      // each answer is logged with reasons.
      if (A.relBetween(al, att) > 50 && A.relBetween(al, def) < 0 && A.aiJoinAttack(al, att, def))
        join("att", al, `joins ${ra.short}`);
    }
  }
  const co = (S.coalitions || {})[att];
  if (co && co.includes(def))
    for (const m of co) if (m !== def && A.chance(0.75)) join("def", m, `joins the coalition against ${ra.short}`);
};
