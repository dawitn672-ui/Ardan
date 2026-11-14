// The release's core, event view (part 1 of 2): Showing an event, its tokens, checks and choices; the queue and the journal's helpers.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: viewSkip, A.eventView, A.ctxTokens, A.checkVal, A.checkOdds, A.eventChoose, A.eventClose, A.eventAuto,
// A.applyFx, A.inheritance, A.inherit, A.teachChild, A.migrateV10, GD.TIERS, A.tierOf, A.fightWorth, A.worthParts,
// A.cmdWorth, A.specialties, A.mainRole, A.styleParts, A.fullStyle, A.ensureMates, A.roster, A.knowCost,
// A.getToKnow, A.FAMILY_RELS, A.CLOSE_RELS, A.bondCap, A.bondCount, A.bondsYear, A.STAFF, A.STAFF_PARENT,
// A.staffSlots, A.staffLabel, A.staffHolder, A.staffCands, A.staffAppoint, A.staffDelegate, A.staffDelegateTo,
// A.staffResolveDelegates, A.staffApply, A.staffBonus, A.onMonth, GD.DRILLS, A.myUnit, A.drillShare, A.setDrill,
// A.drillDay, A.drillMonth, A.onDay, A.drillReview, GD.ORDERS, GD.LORE_RENAME, A.renameDeep, GD.ORDER_RENAMED,
// GD.ORDER_GONE, GD.ORDER_GEAR, GD.ORDER_RANKS, GD.ORDER_Q, and 10 more.

// [X1 baked patch core/02-content-fixes EVT-TOKEN-DIGITS] Tokens with digits ({mate2}, {h1}, {m2him}, {cap2},
// {age2}, {n1}...) were neither filled nor caught, so 39 events showed raw braces ("You owe {mate2} {debt} suns").
// The values were already in the context; allow digits in both patterns.
const viewSkip = (q, v) => (
  v &&
    v.skip == null &&
    (v.skip =
      !!(q.ctx && q.ctx.skip) ||
      /\{[a-zA-Z0-9_.]+\}/.test((v.title || "") + " " + (v.text || "") + " " + v.choices.map(c => c.t).join(" "))),
  v
);

A.eventView = function (q) {
  if (q.view) return viewSkip(q, q.view);
  const pc = A.pc(),
    e = A.EV[q.ev];
  if (!e) {
    q.view = {
      title: "Something happens",
      text: "(missing event " + q.ev + ")",
      choices: [
        {
          t: "Continue",
          i: 0,
        },
      ],
      skip: true,
    };
    return viewSkip(q, q.view);
  }
  if (((q.ctx = q.ctx || {}), e.setup))
    try {
      e.setup(pc, q.ctx);
    } catch (err) {
      q.ctx.skip = 1;
      if (A.S.debug) console.error("setup", e.id, err);
    }
  // [X1 baked patch core/03-engine-fixes ENG-EVENT-TEXT-GUARD] eventView caught a throwing setup (the event is
  // dropped) but not a throwing text, so one bad text function froze the game on the event screen. Seen in a bot
  // life: pl_royal_wedding_guest reads A.realm(p.realm).capital, and about twenty other release texts read
  // A.realm(p.realm) unguarded. A text that throws now drops the event the same way a setup does.
  const ctx = A.ctxTokens(pc, q.ctx);
  let text;
  try {
    text = typeof e.text == "function" ? e.text(pc, q.ctx) : e.text;
  } catch (err) {
    q.ctx.skip = 1;
    text = "";
    if (A.S.debug) console.error("text", e.id, err);
  }
  text = A.T(text, ctx);
  const choices = [];
  if (
    ((
      e.choices || [
        {
          t: "Continue",
        },
      ]
    ).forEach((c, i) => {
      let ok = true;
      try {
        if (c.req) ok = !!c.req(pc, A.C, q.ctx);
      } catch {
        ok = false;
      }
      if (!ok) return;
      const label = A.T(typeof c.t == "function" ? c.t(pc, q.ctx) : c.t, ctx),
        odds = c.check ? A.checkOdds(pc, c.check) : c.group && A.groupOdds ? A.groupOdds(pc, c.group, q.ctx) : null;
      choices.push({
        t: label,
        i,
        odds,
        risk: odds == null ? "" : odds >= 75 ? "likely" : odds >= 50 ? "even odds" : odds >= 30 ? "risky" : "long odds",
      });
    }),
    choices.length ||
      choices.push({
        t: "Continue",
        i: -1,
      }),
    (q.view = {
      title: A.T(e.title ? (typeof e.title == "function" ? e.title(pc, q.ctx) : e.title) : "", ctx),
      text,
      choices,
      img: e.img || null,
    }),
    e.more)
  ) {
    const m = typeof e.more == "function" ? e.more(pc, q.ctx) : e.more;
    if (m) q.view.more = A.T(m, ctx);
  }
  return viewSkip(q, q.view);
};

A.ctxTokens = function (pc, ctx) {
  const o = {};
  if (ctx.pid) {
    const t = A.P(ctx.pid);
    // [X1 baked patch events/97-first-life-fixes LF-THEM-NAME] The {them} token named the scene's person by given name
    // alone, so a second Suilan ("Suilan is going about saying ...") read as the patron Suilan who died twenty years
    // before. When someone else the player knows shares the given name, {them} now names the person in full
    // (A.knownName, 67-choice-memories); otherwise as before.
    if (t) {
      o.them = A.knownName ? A.knownName(t, pc) : t.given;
      o.themFull = A.fullName(t);
      o.theyHe = A.he(t);
      o.theirHis = A.his(t);
      o.themHim = A.him(t);
      o.themAge = String(A.age(t));
      o.themRace = GD.RACES[t.race].adj;
      o.themOcc = t.occ || "a stranger";
    }
  }
  if (ctx.beast) {
    const c = LORE.creatures.find(x => x.id === ctx.beast);
    if (c) {
      o.beast = c.name;
      o.beastSize = c.size;
      o.beastTruth = c.truth;
      o.beastBelief = c.belief;
      o.beastWhere = (A.BEASTS[ctx.beast] || {}).where || "the wilds";
    }
  }
  if (A.superior) {
    const b = A.superior(pc);
    // [X1 baked patch events/97-first-life-fixes LF-BOSS-NONE] With no superior, the tokens fell back to boss "your
    // master" and bossTitle "master", so the superior scenes (bd_boss_test, "{bossTitle} {boss} hands you a task")
    // read "Master your master hands you a task". bossTitle is now left unfilled when there is no superior, so the
    // engine drops a scene about a superior the life does not have; {boss} alone still falls back to "your master".
    if (b) {
      o.boss = b.given;
      o.bossFull = A.fullName(b);
      o.bossTitle = A.superiorTitle(pc) || "your superior";
    } else {
      o.boss = "your master";
      o.bossFull = "your master";
    }
  }
  if (ctx.rid && A.realm(ctx.rid)) {
    o.other = A.realmShort(ctx.rid);
    o.otherName = A.realmName(ctx.rid);
    const ru = A.P(A.realm(ctx.rid).ruler);
    o.otherRuler = ru ? A.rulerStyle(ru, A.realm(ctx.rid)) : "their ruler";
  }
  if (ctx.fid) {
    const f = (A.S.factions || []).find(x => x.id === ctx.fid);
    if (f) {
      o.faction = A.FACTIONS[f.kind].name;
      const h = A.S.houses[f.leader];
      o.factionLeader = h ? h.name : "the great lords";
    }
  }
  for (const k in ctx) if (typeof ctx[k] == "string" || typeof ctx[k] == "number") o[k] = String(ctx[k]);
  return o;
};

A.checkVal = function (pc, check) {
  const sv = k => {
      if (GD.STATS.includes(k)) return A.stat(pc, k);
      const st = A.stats(pc),
        avg = (st.str + st.spd + st.ins + st.sta + st.int + st.wil) / 6;
      return Math.max(A.skillEff(pc, k), 4 + avg * 0.3);
    },
    v1 = sv(check.s),
    v2 = check.s2 ? sv(check.s2) : v1;
  return v1 * 0.6 + v2 * 0.4 + (check.bonus ? check.bonus(pc) : 0);
};

A.checkOdds = function (pc, check) {
  const v = A.checkVal(pc, check);
  return A.clamp(Math.round(50 + (v - (check.d || 45)) * 1.6), 4, 96);
};

A.eventChoose = function (idx) {
  const q = A.S.queue[0];
  {
    const pc0 = A.pc();
    if (q && q.ctx && q.ctx.pid && pc0 && pc0.rel[q.ctx.pid]) pc0.rel[q.ctx.pid].seen = A.S.year;
  }
  if (!q || q.type !== "event") return null;
  const pc = A.pc(),
    e = A.EV[q.ev],
    view = A.eventView(q);
  if (q.result) return q;
  const vc = view.choices[idx];
  if (!vc || vc.i < 0 || !e) {
    q.result = {
      text: "",
    };
    return q;
  }
  const c = e.choices[vc.i];
  let branch = c,
    success = null,
    fightText = "";
  if (c.check) {
    // [X1 baked patch people/99993-v2-stats V2S-ROLL] An event check was one A.chance on the chance A.checkOdds gives.
    // V2 decides every attempt with odds.attempt(): the same chance as its edge, plus blunders (judgment, fatigue,
    // overconfidence) and surges (will under stakes). In the source: call the attempt resolver where eventChoose rolls
    // a check.
    success = A.V2S.roll(pc, c.check, c);
    branch = success ? c.win || {} : c.lose || {};
    if (!GD.STATS.includes(c.check.s) && GD.SKILLS[c.check.s]) A.trainSkill(pc, c.check.s, 1.5);
  } else if (c.group && A.groupFightPC) {
    const g = A.groupFightPC(pc, c.group, q.ctx || {});
    success = g.win;
    fightText = g.text;
    branch = success ? c.win || {} : c.lose || {};
  }
  const ctxT = A.ctxTokens(pc, q.ctx || {});
  let text = "";
  try {
    if (branch.fx) {
      const r = A.applyFx(pc, branch.fx, q.ctx || {});
      if (typeof r == "string") text += r;
    }
    if (typeof branch.r == "function") {
      const r = branch.r(pc, q.ctx || {}, success);
      if (typeof r == "string") text = (r + " " + text).trim();
    } else if (branch.r) text = (A.T(branch.r, ctxT) + " " + text).trim();
    if (fightText) text = (text + " " + fightText).trim();
  } catch (err) {
    console.error("event fx", q.ev, err);
    text = text || "...";
  }
  pc.flags.ev = pc.flags.ev || {};
  pc.flags.ev[q.ev] = A.S.year;
  q.result = {
    text: A.T(text, ctxT),
    success,
  };
  if (text) A.log(A.T(text, ctxT), success === false ? "bad" : success ? "good" : "");
  return q;
};

A.eventClose = function () {
  const q = A.S.queue[0];
  if (!q || q.type !== "event") return;
  A.S.queue.shift();
  const pc = A.pc();
  if ((pc && pc.alive && pc.health <= 0 && A.mortalCheck(pc, pc.lastHurt || "wounds"), q.after)) {
    const nx = q.after;
    if (A.EV[nx])
      A.S.queue.unshift({
        type: "event",
        ev: nx,
        ctx: q.ctx,
      });
  }
};

A.eventAuto = function () {
  const q = A.S.queue[0];
  if (!q || q.type !== "event") return;
  const v = A.eventView(q),
    ch = A.pick(v.choices);
  A.eventChoose(v.choices.indexOf(ch));
  A.eventClose();
};

A.applyFx = function (pc, fx, ctx) {
  if (typeof fx == "function") return fx(pc, ctx);
  const out = [],
    t = ctx && ctx.pid ? A.P(ctx.pid) : null;
  for (const k in fx) {
    const v = fx[k];
    // [X1 baked patch core/03-engine-fixes ENG-COIN-FINITE] The coin effect took any number, and NaN is a number: a
    // scene whose payout was never worked out (its setup failed, and something resolved it anyway) set the player's
    // purse to NaN for the rest of the life. Found by the exploit test: ni_deal_profit after a failed setup. A coin
    // effect that is not a finite number now counts as nothing.
    switch (k) {
      case "str":
      case "spd":
      case "ins":
      case "sta":
      case "int": {
        const g = A.train(pc, k, v);
        break;
      }
      case "wil":
        A.willGrow(pc, v, "event");
        break;
      case "health":
        pc.health = A.clamp(pc.health + v, 0, A.maxHealth(pc));
        // [X1 baked patch core/03-engine-fixes ENG-DEATH-CAUSE] A death right after a hurt was put down to a natural
        // cause. mortalCheck calls a death from health long gone "natural" when the last hurt is over 40 days old, but the
        // day of the last hurt is stamped only by the daily tick (onDay). A duel, a beast, a battle or an event that drops
        // health to 0 calls mortalCheck at once, before that tick, so it read the stamp of some older hurt: gored by the
        // Hell Boar at 16, the obituary said "marsh fever" (every one of 7 such deaths logged in 12 Varenna bot lives).
        // The tick now also notes the health it saw: a named hurt that took health from above 0 since then is today's. An
        // event's health loss with no cause of its own keeps the old name, so for it the release's rule stands, unless the
        // name itself is new since the tick (a beast fought the same day).
        if (v < 0) {
          if (!fx.cause) pc._lhAnon = 1;
          pc.lastHurt = fx.cause || pc.lastHurt || "an injury";
        }
        break;
      case "happy":
        pc.happy = A.clamp(pc.happy + v, 0, 100);
        break;
      case "looks":
        pc.looks = A.clamp(pc.looks + v, 1, 100);
        break;
      case "fame":
        A.fame(pc, v);
        break;
      case "honor":
        pc.honor = A.clamp(pc.honor + v, 0, 100);
        break;
      case "piety":
        pc.piety = A.clamp(pc.piety + v, 0, 100);
        break;
      case "coin": {
        const amt = typeof v == "number" && Number.isFinite(v) ? v : 0;
        if (amt < 0 && !A.isAdult(pc) && A.S.family) A.S.family.wealth = Math.max(0, A.S.family.wealth + amt);
        else pc.coin = Math.max(0, pc.coin + amt);
        break;
      }
      case "coinPct":
        pc.coin = Math.max(0, Math.round(pc.coin * (1 + v)));
        break;
      case "family":
        if (A.S.family) A.S.family.wealth = Math.max(0, A.S.family.wealth + v);
        break;
      case "skill":
        for (const s in v) A.trainSkill(pc, s, v[s]);
        break;
      case "rep":
        if (A.addRep) A.addRep(pc, v);
        break;
      case "masterwork":
        pc.works = pc.works || [];
        pc.works.push({
          y: A.S.year,
          t: A.T(String(v), ctx),
        });
        pc.deeds.push({
          y: A.S.year,
          t: "Made " + A.T(String(v), ctx),
        });
        A.fame(pc, 3);
        break;
      case "promote":
        if (pc.job) {
          if (A.jobRankUp) A.jobRankUp(pc, "Raised up");
          else {
            const C = GD.CAREERS[pc.job.c];
            if (C && C.ranks[pc.job.r + 1]) {
              pc.job.r++;
              A.log(`You are now ${C.ranks[pc.job.r][0]}.`, "good");
            }
          }
        } else if (pc.mil) pc.mil.merit += 40;
        break;
      case "style":
        if (A.learnStyle && A.style(v)) A.learnStyle(pc, v, 1);
        break;
      case "styleXp":
        if (A.styleXp && pc.styles) for (const sid in pc.styles) A.styleXp(pc, sid, v);
        break;
      case "apt":
        pc.apt = pc.apt || {};
        for (const s in v) if (GD.SKILLS[s]) pc.apt[s] = Math.max(pc.apt[s] || 1, v[s]);
        break;
      case "trait":
        A.addTrait(pc, v);
        break;
      case "untrait":
        A.removeTrait(pc, v);
        break;
      case "wound": {
        const n = A.addWound(pc, v);
        if (n) out.push(`(${n})`);
        break;
      }
      case "flag":
        pc.flags[v] = A.S.year;
        break;
      case "unflag":
        delete pc.flags[v];
        break;
      case "rel": {
        const list = A.relsOf(pc, [v.who]);
        for (const x of list.slice(0, v.all ? 99 : 1)) A.addOp(pc, x.p, v.op);
        break;
      }
      case "them":
        if (t) {
          if (pc.rel[t.id]) {
            if (v.op) A.addOp(pc, t, v.op);
            if (v.type) {
              pc.rel[t.id].type = v.type;
              if (t.rel[pc.id]) t.rel[pc.id].type = v.back || v.type;
            }
          } else A.link(pc, t, v.type || "acquaint", v.op || 0, v.back || v.type || "acquaint");
        }
        break;
      case "newRel": {
        const p = A.makeAcquaintance(pc, v.type || "friend");
        A.link(pc, p, v.type || "friend", v.op || 30, v.back || v.type || "friend");
        out.push(
          `(${p.given} ${v.type === "rival" ? "is your rival now" : v.type === "enemy" ? "is your enemy now" : "becomes your " + (v.type || "friend")})`,
        );
        break;
      }
      case "lover": {
        const p = A.makeLoveInterest(pc);
        A.link(pc, p, "lover", 50, "lover");
        out.push(`(${p.given} is your lover now)`);
        break;
      }
      case "die":
        A.pcDeath(v);
        break;
      case "prison":
        A.imprison(pc, v, fx.why || "a crime");
        break;
      case "punish":
        A.punish(pc, v);
        break;
      case "free":
        if (pc.prison) {
          pc.prison = null;
          out.push("(You are free.)");
        }
        break;
      case "merit":
        if (pc.mil) pc.mil.merit += v;
        else {
          if (pc.job) pc.job.merit = (pc.job.merit || 0) + v;
        }
        break;
      case "patronOp": {
        const pt = A.patronOf && A.patronOf(pc);
        if (pt) A.addOp(pc, pt, v);
        break;
      }
      case "rulerOp": {
        const r = A.realm(pc.realm),
          ru = r ? A.P(r.ruler) : null;
        if (ru && ru.id !== pc.id) {
          if (!pc.rel[ru.id]) A.link(pc, ru, "lord", 0, "acquaint");
          A.addOp(ru, pc, v);
        }
        break;
      }
      case "realmStab": {
        const r = A.realm(pc.ruler || pc.realm);
        if (r) r.stability = A.clamp(r.stability + v, 0, 100);
        break;
      }
      case "realmGold": {
        const r = A.realm(pc.ruler || pc.realm);
        if (r) r.treasury += v;
        break;
      }
      case "armyXp": {
        const r = A.realm(pc.ruler || pc.realm);
        if (r && r.forces) r.forces.xp = Math.min(200, r.forces.xp + v);
        break;
      }
      case "secret":
        pc.flags.secrets = (pc.flags.secrets || 0) + v;
        break;
      case "epithet":
        if (!pc.epithet) {
          pc.epithet = v;
          out.push(`They call you ${v} now.`);
          A.ach("epithet");
        }
        break;
      case "deed":
        pc.deeds.push({
          y: A.S.year,
          t: v,
        });
        break;
      case "ach":
        A.ach(v);
        break;
      case "job":
        if (GD.CAREERS[v])
          pc.job = {
            c: v,
            r: 0,
            y: 0,
            perf: 55,
          };
        break;
      case "perf":
        if (pc.job) pc.job.perf = A.clamp(pc.job.perf + v, 0, 100);
        break;
      case "lang":
        if (!pc.langs.includes(v)) {
          pc.langs.push(v);
          out.push(`(You learn ${v}.)`);
        }
        break;
      case "literate":
        pc.literate = true;
        break;
      case "gear":
        for (const s in v) pc.gear[s] = v[s];
        break;
      case "asset":
        pc.assets.push({
          k: v,
          name: GD.PROPERTY[v].name,
          y: A.S.year,
        });
        break;
      case "duel": {
        const foe =
          v.foe === "them" && t
            ? t
            : A.makeFoe(
                Object.assign(
                  {
                    realm: pc.realm,
                  },
                  v,
                ),
              );
        A.startDuelFront(
          pc,
          foe,
          Object.assign(
            {
              kind: "duel",
              lethal: true,
              toYield: true,
            },
            v.opts || {},
          ),
        );
        break;
      }
      case "beast":
        A.startDuelFront(
          pc,
          {
            beastId: v.id || ctx.beast,
            mod: v.mod || 1,
          },
          {
            kind: "beast",
            place: v.place || "the wilds",
            light: v.light || "day",
            title: v.title || "The hunt",
          },
        );
        break;
      case "event":
        A.S.queue.splice(1, 0, {
          type: "event",
          ev: v,
          ctx,
        });
        break;
      case "stability": {
        const r = A.realm(pc.ruler || pc.realm);
        if (r) r.stability = A.clamp(r.stability + v, 0, 100);
        break;
      }
      case "treasury": {
        const r = A.realm(pc.ruler);
        if (r) r.treasury += v;
        break;
      }
      case "legit": {
        const r = A.realm(pc.ruler);
        if (r) r.legit = A.clamp(r.legit + v, 0, 100);
        break;
      }
      case "realmRel": {
        const r = A.realm(pc.ruler || pc.realm),
          w = typeof v == "number" ? ctx.rid : v.with,
          d = typeof v == "number" ? v : v.d || 0;
        if (r && w && A.realm(w)) A.addRel(r.id, w, d);
        break;
      }
      case "favor": {
        const r = A.realm(pc.realm),
          ru = r ? A.P(r.ruler) : null;
        if (ru && ru.id !== pc.id) {
          if (!pc.rel[ru.id]) A.link(pc, ru, "lord", 0, "acquaint");
          A.addOp(pc, ru, v);
        }
        break;
      }
      case "mission":
        if (pc.mil || pc.company)
          A.S.queue.splice(1, 0, {
            type: "mission",
            m: A.newMission(
              pc,
              v === "war" ? A.enemyRealmOf(pc.realm) : null,
              v === "war" ? A.atWar(pc.realm)[0] : null,
            ),
          });
        break;
      case "cause":
        break;
      case "why":
        break;
      case "infamy": {
        const r = A.realm(pc.ruler);
        if (r) r.infamy = A.clamp((r.infamy || 0) + v, 0, 100);
        break;
      }
      case "authority": {
        const r = A.realm(pc.ruler);
        if (r && r.laws) {
          r.laws.authority = A.clamp((r.laws.authority != null ? r.laws.authority : 1) + v, 0, 3);
          A.updateRealmPops();
        }
        break;
      }
      case "houseOp": {
        const r = A.realm(pc.ruler || pc.realm);
        if (r) for (const h of A.realmHouses(r.id)) h.op = A.clamp((h.op != null ? h.op : 50) + v, 0, 100);
        break;
      }
      case "factionDisc": {
        const rid = pc.ruler || pc.realm;
        for (const f of (A.S.factions || []).filter(x => x.realm === rid && (!ctx.fid || x.id === ctx.fid)))
          f.discontent = A.clamp((f.discontent || 0) + v, 0, 100);
        break;
      }
      case "owed":
        if (t) {
          A.addFavor(pc, t.id, v);
          out.push(v > 0 ? `(${t.given} owes you a favor)` : "");
        }
        break;
      case "oweThem":
        if (t) {
          A.addOwe(pc, t.id, v);
          out.push(v > 0 ? `(you owe ${t.given} a favor)` : "");
        }
        break;
      case "letter": {
        if (t) {
          const L = A.giveLetter(pc, t, typeof v == "string" ? v : "any");
          out.push(`(a letter of recommendation, weight ${L.power})`);
        } else {
          pc.letters = pc.letters || [];
          pc.letters.push({
            from: "a well-placed friend",
            power: typeof v == "number" ? v : 20,
            kind: "any",
            y: A.S.year,
          });
          out.push("(a letter of recommendation)");
        }
        break;
      }
      case "bossOp": {
        const b = A.superior(pc);
        if (b) {
          if (!pc.rel[b.id]) A.link(pc, b, "superior", 0, "subordinate");
          A.addOp(b, pc, v);
        }
        break;
      }
      case "sworn":
        if (t && pc.rel[t.id]) {
          pc.rel[t.id].sworn = true;
          if (t.rel[pc.id]) t.rel[pc.id].sworn = true;
          out.push(`(sworn to ${t.given})`);
        }
        break;
      case "claim": {
        const r = A.realm(pc.ruler),
          tr = ctx.rid ? A.realm(ctx.rid) : null;
        if (r && tr) {
          const p =
            A.pick(A.S.prov.filter(x => x.owner === tr.id && x.adj.some(j => A.S.prov[j].owner === r.id))) ||
            A.pick(A.realmProvs(tr.id));
          if (p) {
            r.claims[p.id] = A.S.year;
            out.push(`(claim on ${p.name})`);
          }
        }
        break;
      }
      case "pact": {
        const r = A.realm(pc.ruler),
          tr = ctx.rid ? A.realm(ctx.rid) : null;
        if (r && tr && r.pacts && tr.pacts) {
          const k2 = v === "trade" ? "trade" : "nap";
          r.pacts[k2][tr.id] = A.S.year + (k2 === "trade" ? 15 : 10);
          tr.pacts[k2][r.id] = r.pacts[k2][tr.id];
          out.push(k2 === "trade" ? `(trade pact with ${tr.short})` : `(non-aggression pact with ${tr.short})`);
        }
        break;
      }
      case "ally": {
        const r = A.realm(pc.ruler);
        if (r && ctx.rid && A.realm(ctx.rid)) {
          A.ally(r.id, ctx.rid);
          out.push(`(alliance with ${A.realmShort(ctx.rid)})`);
        }
        break;
      }
      case "warOn": {
        const r = A.realm(pc.ruler);
        if (r && ctx.rid && A.realm(ctx.rid) && !A.hostile(r.id, ctx.rid))
          A.declareWar(
            r.id,
            ctx.rid,
            typeof v == "string" && A.CB[v]
              ? {
                  cb: v,
                }
              : {},
          );
        break;
      }
      default:
        break;
    }
  }
  return out.join(" ");
};

A.inheritance = function (from, to) {
  const out = [];
  if (!from || !to) return out;
  const kids = from.children.map(A.P).filter(c => c && c.alive),
    eldest = kids.length ? kids.slice().sort((a, b) => a.born - b.born)[0] : null,
    isEldest = eldest && eldest.id === to.id,
    share = kids.length <= 1 ? 1 : isEldest ? 0.6 : 0.4 / Math.max(1, kids.length - 1);
  out.push({
    k: "coin",
    name: "The purse",
    v: Math.round(Math.max(0, from.coin) * share),
    why:
      kids.length > 1
        ? isEldest
          ? "The eldest takes three parts in five; the rest is shared among the others."
          : "A younger child's share of what was left."
        : "All of it: there is no one else.",
  });
  const assets = (from.assets || []).length;
  if (assets)
    out.push({
      k: "assets",
      name: "Lands and property",
      v: assets,
      why:
        isEldest || kids.length <= 1
          ? "The house, the fields, the shop — they go with the name."
          : "They go to the eldest, not to you.",
      no: !(isEldest || kids.length <= 1),
    });
  const g = from.gear || {},
    best = ["weapon", "armor", "helm", "shield", "mount"].filter(s => g[s] && !["fists", "none"].includes(g[s]));
  if (best.length)
    out.push({
      k: "gear",
      name: "Arms and armor",
      v: best.map(s => (GD.GEAR[g[s]] ? GD.GEAR[g[s]].name : g[s])).join(", "),
      why: "A father's sword hangs over the hearth until a child can lift it.",
    });
  if (from.noble && from.noble.rung >= 2)
    out.push({
      k: "title",
      name: "Titles and lands",
      v: A.nobleTitle ? A.nobleTitle(from) : "the title",
      why:
        isEldest || kids.length <= 1
          ? "By the law of the realm the title passes to the eldest."
          : "The title passes to the eldest; you keep the family name.",
      no: !(isEldest || kids.length <= 1),
    });
  const fame = Math.round(Math.max(0, from.fame) * 0.25);
  if (fame >= 2)
    out.push({
      k: "name",
      name: "The family name",
      v: "+" + fame + " renown",
      why: "People know whose child this is — for good or ill.",
    });
  const friends = A.relsOf(from).filter(
    x =>
      x.p.alive &&
      x.p.id !== to.id &&
      Math.abs(x.r.op) >= 30 &&
      !["mother", "father", "sibling", "child", "grandparent", "grandchild", "spouse"].includes(x.r.type),
  );
  if (friends.length)
    out.push({
      k: "bonds",
      name: "Friends and enemies",
      v: `${friends.filter(x => x.r.op > 0).length} friends, ${friends.filter(x => x.r.op < 0).length} enemies`,
      why: "Those who loved or hated the parent watch the child.",
    });
  const taught = Object.keys(from.skills || {}).filter(k => A.skill(from, k) >= 40 && (from.flags.taught || {})[to.id]);
  if (taught.length)
    out.push({
      k: "taught",
      name: "What you taught them",
      v: taught
        .slice(0, 4)
        .map(k => GD.SKILLS[k])
        .join(", "),
      why: "Years of lessons by the fire and in the yard.",
    });
  if (from.styleFounded || (from.flags && from.flags.founded))
    out.push({
      k: "style",
      name: "The family style",
      v: "the style you founded",
      why: "It is taught first to the founder's blood.",
    });
  return out;
};

A.inherit = function (from, to) {
  if (!from || !to) return;
  const L = A.inheritance(from, to);
  for (const x of L)
    if (!x.no) {
      if ((x.k === "coin" && (to.coin += x.v), x.k === "gear")) {
        to.gear = to.gear || {};
        const g = from.gear || {};
        for (const s of ["weapon", "armor", "helm", "shield", "mount"])
          if (g[s] && !["fists", "none"].includes(g[s]) && (!to.gear[s] || ["fists", "none"].includes(to.gear[s]))) {
            to.gear[s] = g[s];
            if (from.gearQ && from.gearQ[s]) {
              to.gearQ = to.gearQ || {};
              to.gearQ[s] = from.gearQ[s];
            }
          }
      }
      if (
        (x.k === "name" && (to.fame = Math.min(100, (to.fame || 0) + Math.round(Math.max(0, from.fame) * 0.25))),
        x.k === "bonds")
      )
        for (const { p, r } of A.relsOf(from))
          if (
            !(
              !p.alive ||
              p.id === to.id ||
              Math.abs(r.op) < 30 ||
              ["mother", "father", "sibling", "child", "grandparent", "grandchild", "spouse"].includes(r.type)
            )
          ) {
            if (!to.rel[p.id])
              A.link(to, p, r.op > 0 ? "acquaint" : "enemy", Math.round(r.op * 0.4), r.op > 0 ? "acquaint" : "enemy");
            to.rel[p.id].why = r.op > 0 ? "a friend of your parent" : "your parent's enemy";
          }
      if (x.k === "taught")
        for (const k of Object.keys(from.skills))
          if (A.skill(from, k) >= 40 && A.skill(to, k) < A.skill(from, k) * 0.45)
            to.skills[k] = Math.max(to.skills[k] || 0, Math.round(A.skill(from, k) * 0.45));
    }
};

A.teachChild = function (cid) {
  const pc = A.pc(),
    c = A.P(cid);
  if (!c || !c.alive || !pc.children.includes(cid))
    return {
      ok: false,
      msg: "Not your child.",
    };
  if (A.S.time < 1)
    return {
      ok: false,
      msg: "Not enough initiative (⧗) yet.",
    };
  A.S.time -= 1;
  pc.flags.taught = pc.flags.taught || {};
  pc.flags.taught[cid] = (pc.flags.taught[cid] || 0) + 1;
  const best = Object.keys(pc.skills)
    .sort((a, b) => A.skill(pc, b) - A.skill(pc, a))
    .slice(0, 2);
  for (const k of best) A.trainSkill(c, k, 2 + A.skill(pc, "learning") / 40);
  if (c.rel[pc.id]) A.addOp(c, pc, 4);
  return {
    ok: true,
    msg: `You spend days teaching ${c.given}: ${best.map(k => GD.SKILLS[k]).join(" and ")}.`,
  };
};

A.migrateV10 = function (S) {
  if (S.legacy) delete S.legacy;
  S.lastLegacy = null;
  for (const id in S.people || {}) {
    const p = S.people[id];
    if (p && p.amb) delete p.amb;
  }
  S.dyn = S.dyn || [];
};

GD.TIERS = [
  {
    k: "t0",
    n: "Untrained",
    min: 0,
    d: "Most people: farmers, clerks, lords who never drilled. Any trained fighter beats them; it takes five or six of them to match one soldier.",
  },
  {
    k: "t1",
    n: "Brawler",
    min: 40,
    d: "A green levy, a street tough, a hunter with a knife. Dangerous to the untrained; two or three of them make one soldier.",
  },
  {
    k: "t2",
    n: "Trained",
    min: 50,
    d: "A drilled soldier, a town guard, a squire: the regular every other number is measured against. Holds a line; beats a brawler three times in four.",
  },
  {
    k: "t3",
    n: "Veteran",
    min: 63,
    d: "Years of real fighting. Worth two or three regulars at once.",
  },
  {
    k: "t4",
    n: "Elite",
    min: 77,
    d: "The best of a regiment; the knights of the eight orders. Can take 7–10 regulars or about 4 veterans at once — if their wind holds. One soldier in several hundred.",
  },
  {
    k: "t5",
    n: "Master",
    min: 91,
    d: "Takes 20–30 regulars or 8–10 veterans at once, with the body to match. One or two in a realm, often the head of its order; most realms have none.",
  },
  {
    k: "t6",
    n: "Legend",
    min: 118,
    d: "Takes 50–100 regulars, and needs a body like no one else's to keep it up. Perhaps five alive in all of Ardan. Still mortal: a crossbow bolt does not care.",
  },
];

A.tierOf = v => {
  let t = GD.TIERS[0];
  for (const x of GD.TIERS) if (v >= x.min) t = x;
  return t;
};

// [X1 baked patch core/01-replay ENG-STYLE-RNG] Looking at a fighter changed the world. A.fightWorth (a question)
// generated and saved NPC fighting styles with the main random stream, so rendering tier chips, odds or worth
// tooltips moved the dice and broke replays and problem reports. Now npcStyles rolls from a stream seeded by the
// world seed and the person, and fightWorth discards styles it only imagined; real styles are created by the duel
// code, at the same moment in every replay.
A.fightWorth = function (p) {
  if (!p || !p.st) return 0;
  const _ns = p.styles === void 0,
    f = A.fighterFrom(p, {});
  if (_ns) delete p.styles;
  let v = A.CR(
    Object.assign(
      {
        fat: 0,
        burst: 0,
        fury: 0,
        hp: 100,
        maxHp: 100,
        adapt: 0,
        mounted: false,
      },
      f,
    ),
    {
      round: 5,
    },
  );
  v += (f.wdmg || 3) * 0.9 + (f.prot || 0) * 1.1 + (f.shield || 0) * 1.4;
  return Math.round(Math.max(0, v));
};

A.worthParts = function (p) {
  if (!p || !p.st) return null;
  const total = A.fightWorth(p),
    bare = Object.assign({}, p, {
      gear: {},
    }),
    raw = Object.assign({}, bare, {
      skills: {},
      styles: {},
      flags: Object.assign({}, p.flags, {
        chain: null,
      }),
    }),
    wGear = A.fightWorth(bare),
    wRaw = A.fightWorth(raw),
    W = GD.GEAR[(p.gear || {}).weapon] || GD.GEAR.fists,
    st = p.styleMain && A.style ? A.style(p.styleMain) : null;
  return {
    total,
    body: wRaw,
    skill: wGear - wRaw,
    gear: total - wGear,
    stats: GD.STATS.map(k => [k, Math.round(A.stat(p, k))]),
    gearItems: ["weapon", "armor", "shield", "helm"]
      .map(sl => [sl, (p.gear || {})[sl]])
      .filter(x => x[1] && GD.GEAR[x[1]])
      .map(([sl, k]) => [sl, GD.GEAR[k].name]),
    skillK: GD.WEAPON_SKILL[W.kind] || "unarmed",
    style: st ? st.name : null,
    styleRank: st && p.styles && p.styles[st.id] ? p.styles[st.id].rank : 0,
  };
};

A.cmdWorth = p =>
  p ? Math.round(A.skill(p, "command") * 0.45 + A.skill(p, "tactics") * 0.35 + A.skill(p, "logistics") * 0.2) : 0;

A.specialties = function (p, n) {
  const ks = Object.keys(p.skills || {})
      .filter(k => GD.SKILLS[k])
      .sort((a, b) => A.skill(p, b) - A.skill(p, a))
      .slice(0, n || 3),
    word = v =>
      v >= 85
        ? "legendary"
        : v >= 70
          ? "masterful"
          : v >= 55
            ? "expert"
            : v >= 40
              ? "skilled"
              : v >= 25
                ? "competent"
                : "a beginner";
  return ks
    .filter(k => A.skill(p, k) >= 15)
    .map(k => ({
      k,
      name: GD.SKILLS[k],
      v: A.skill(p, k),
      word: word(A.skill(p, k)),
    }));
};

A.mainRole = function (p) {
  if (!p) return "";
  if (p.ruler) {
    const r = A.realm(p.ruler);
    return A.rulerStyle(p, r).replace(" " + A.fullName(p, false), "") + " of " + (r ? r.short : "");
  }
  if (p.office && A.COUNCIL[p.office]) return A.COUNCIL[p.office].name + " of " + A.realmShort(p.realm);
  // [A2 posts] someone else's title line is the post he holds in the registry (a seat, a command, an office), not a
  // style written once and never cleared
  if (A.POSTS && A.S && p.id !== A.S.pc) {
    const t = A.POSTS.title(p);
    if (t) return t;
  }
  if (p.order && A.orderRankName) return A.orderRankName(p);
  if (p.mil) {
    const d = p.mil.div && A.divById ? A.divById(p.mil.div) : null,
      u =
        p.mil.rank >= 7
          ? p.mil.army && A.army(p.mil.army)
            ? A.army(p.mil.army).name
            : ""
          : d
            ? d.name
            : p.mil.unit || "";
    return (
      GD.MIL[p.mil.rank].title +
      (u ? " of the " + u.replace(/^the /i, "") : p.mil.merc ? ", " + (p.mil.company || "a free company") : "")
    );
  }
  return p.company
    ? "Captain of " + p.company.name
    : p.job && GD.CAREERS[p.job.c]
      ? GD.CAREERS[p.job.c].ranks[p.job.r][0]
      : p.milRank != null
        ? GD.MIL[p.milRank].title
        : p.occ || "";
};

A.styleParts = function (p) {
  if (!p)
    return {
      nob: "",
      name: "",
      main: "",
      extra: [],
    };
  const nob =
      p.noble && p.noble.rung >= 2 && !p.ruler && GD.NOBLE_RUNGS[p.noble.rung]
        ? p.sex === "F"
          ? GD.NOBLE_RUNGS[p.noble.rung].f
          : GD.NOBLE_RUNGS[p.noble.rung].title
        : "",
    extra = [];
  if (p.noble && p.noble.rung >= 4 && p.noble.holding != null && !p.ruler)
    extra.push("Lord of " + A.provName(p.noble.holding));
  if (p.order && A.orderRankName && A.mainRole(p) !== A.orderRankName(p)) extra.push(A.orderRankName(p));
  if (p.office && p.mil && !p.ruler) extra.push(GD.MIL[p.mil.rank].title);
  for (const id in (A.S && A.S.realms) || {})
    if (A.S.realms[id].heir === p.id && A.S.realms[id].alive && !p.ruler) {
      extra.push("Heir of " + A.S.realms[id].short);
      break;
    }
  const pc = A.pc && A.pc();
  if (pc && pc.staff && pc.id !== p.id) {
    for (const k in pc.staff)
      if (pc.staff[k] === p.id || (pc.staff[k] === "deleg" && (pc.staffD || {})[k] === p.id)) {
        extra.push(
          "your " +
            (A.staffLabel ? A.staffLabel(pc, k) : k)
              .replace(/^Commander, /, "commander of the ")
              .replace(/^General, /, "general of the "),
        );
        break;
      }
  }
  if (p.prison) extra.push("a prisoner");
  return {
    nob,
    name: A.fullName(p, false),
    main: A.mainRole(p),
    extra,
  };
};

A.fullStyle = function (p) {
  if (!p) return "";
  const s = A.styleParts(p);
  return `${s.nob ? s.nob + " " : ""}${s.name}${s.main ? ", " + s.main : ""}${s.extra.length ? " · " + s.extra.join(" · ") : ""}`;
};

// [X1 baked patch core/01-replay ENG-ROSTER-PURE] Opening the People tab created people: A.roster (a list for the
// screen) hired missing colleagues with the main random stream. Colleagues are now hired by the engine at the
// start of each month (A.ensureMates), and the roster only lists.
A.ensureMates = function (pc) {
  if (pc && pc.alive && pc.job) {
    for (
      pc.job.mates = (pc.job.mates || []).filter(id => A.P(id) && A.P(id).alive);
      pc.job.mates.length < 2 && A.isAdult(pc);

    ) {
      const n = A.makeAcquaintance(pc, "acquaint");
      n.occ =
        "works beside you as " +
        GD.CAREERS[pc.job.c].ranks[
          Math.max(0, Math.min(pc.job.r, GD.CAREERS[pc.job.c].ranks.length - 1))
        ][0].toLowerCase();
      n.job = {
        c: pc.job.c,
        r: pc.job.r,
        y: A.ri(1, 8),
        perf: A.ri(30, 80),
        rep: A.ri(20, 60),
      };
      if (GD.CAREERS[pc.job.c].skill) n.skills[GD.CAREERS[pc.job.c].skill] = A.ri(15, 55);
      pc.job.mates.push(n.id);
    }
  }
};

A.roster = function (pc) {
  const out = [],
    seen = new Set([pc.id]),
    add = (p, role, grp) => {
      if (!(!p || !p.alive || seen.has(p.id))) {
        seen.add(p.id);
        out.push({
          p,
          role,
          grp,
        });
      }
    },
    sup = A.superior(pc);
  if (sup) add(sup, "your superior", "Above you");
  const pat = A.patronOf && A.patronOf(pc);
  if ((pat && add(pat, "your patron", "Above you"), pc.mil)) {
    for (const c of A.squad(pc)) add(c, pc.mil.rank >= 3 ? "one of your sergeants" : "in your mess", "Under you");
    const d = pc.mil.div && A.divById ? A.divById(pc.mil.div) : null;
    if (d) {
      const g = A.divGen(d);
      if (g && g.id !== pc.id) add(g, `commands the ${d.name}`, "Above you");
    }
  }
  if (pc.staff)
    for (const k in pc.staff) {
      const id = pc.staff[k];
      if (id && id !== "deleg") add(A.P(id), A.staffLabel ? A.staffLabel(pc, k) : k, "Your staff");
    }
  // [X1 baked patch core/01-replay ENG-ROSTER-PURE] Opening the People tab created people: A.roster (a list for the
  // screen) hired missing colleagues with the main random stream. Colleagues are now hired by the engine at the
  // start of each month (A.ensureMates), and the roster only lists.
  if (pc.job) {
    for (const id of pc.job.mates || []) add(A.P(id), "a colleague", "Beside you");
  }
  const r = A.realm(pc.ruler || pc.realm);
  if (r && (pc.office || pc.ruler || A.classOf(pc) >= 6)) {
    r.council = r.council || {};
    for (const k in r.council)
      add(A.P(r.council[k]), A.COUNCIL[k] ? A.COUNCIL[k].name + " of " + r.short : k, "The council");
    const ru = A.P(r.ruler);
    if (ru && ru.id !== pc.id) add(ru, A.rulerStyle(ru, r).split(" ")[0] + " of " + r.short, "Above you");
  }
  if (pc.ruler && r) {
    for (const a of A.armiesOf(r.id)) {
      const g = A.P(a.gen);
      if (g) add(g, `general of the ${a.name}`, "Your commanders");
    }
    const h = A.P(r.heir);
    if (h) add(h, "your heir", "Your house");
  }
  return out;
};

A.knowCost = 1;

A.getToKnow = function (pid) {
  const pc = A.pc(),
    t = A.P(pid);
  if (!t || !t.alive)
    return {
      ok: false,
      msg: "They are gone.",
    };
  if (pc.rel[pid])
    return {
      ok: false,
      msg: "You already know them.",
    };
  if (A.S.time < A.knowCost)
    return {
      ok: false,
      msg: "Not enough initiative (⧗) yet.",
    };
  A.S.time -= A.knowCost;
  const ro = A.roster(pc).find(x => x.p.id === pid),
    gap = A.classOf(t) - A.classOf(pc),
    ch = A.clamp(
      0.6 +
        A.skill(pc, "persuasion") / 250 +
        A.skill(pc, "etiquette") / 300 -
        Math.max(0, gap) * 0.08 +
        (pc.fame - 30) / 300,
      0.15,
      0.95,
    ),
    type =
      ro && ro.grp === "Under you"
        ? "comrade"
        : ro && ro.grp === "Above you"
          ? ro.role === "your superior"
            ? "superior"
            : "acquaint"
          : ro && ro.grp === "Your staff"
            ? "subordinate"
            : "acquaint",
    back = {
      comrade: "comrade",
      superior: "subordinate",
      subordinate: "superior",
      acquaint: "acquaint",
    }[type];
  return A.chance(ch)
    ? (A.link(pc, t, type, A.ri(15, 35) + (A.has(t, "friendly") ? 10 : 0), back),
      {
        ok: true,
        msg: `You get to know ${A.fullName(t, false)}. A beginning.`,
      })
    : (A.link(pc, t, type, A.ri(-5, 10), back),
      {
        ok: true,
        msg: `${t.given} keeps you at arm's length. It will take more than one evening.`,
      });
};

A.FAMILY_RELS = [
  "mother",
  "father",
  "sibling",
  "child",
  "spouse",
  "grandparent",
  "grandchild",
  "cousin",
  "uncle",
  "nephew",
  "inlaw",
  "ex",
  "betrothed",
];

A.CLOSE_RELS = ["friend", "bestfriend", "mentor", "student", "lover"];

A.bondCap = pc =>
  4 +
  Math.floor(A.skill(pc, "persuasion") / 30) +
  Math.floor(A.skill(pc, "etiquette") / 40) +
  (A.has(pc, "gregarious") || A.has(pc, "friendly") ? 2 : 0) -
  (A.has(pc, "shy") ? 1 : 0);

A.bondCount = pc => A.relsOf(pc, A.CLOSE_RELS).filter(x => x.p.alive).length;

A.bondsYear = function (pc) {
  if (A.obligationsYear) A.obligationsYear(pc);
  const Y = A.S.year,
    keep = new Set(Object.values(pc.staff || {}).concat(Object.values(pc.staffD || {}))),
    sup = A.superior ? A.superior(pc) : null;
  if (sup) keep.add(sup.id);
  const pat = A.patronOf ? A.patronOf(pc) : null;
  if (pat) keep.add(pat.id);
  if (pc.spouse) keep.add(pc.spouse);
  const close = [];
  for (const id in pc.rel) {
    const r = pc.rel[id],
      p = A.P(id);
    if (!p || A.FAMILY_RELS.includes(r.type) || keep.has(id) || r.sworn) continue;
    const seen = r.seen != null ? r.seen : r.since != null ? r.since : Y - 1,
      idle = Y - seen;
    if (!p.alive) {
      if (idle > 6 && !["friend", "bestfriend", "lover", "mentor"].includes(r.type)) delete pc.rel[id];
      continue;
    }
    if (A.CLOSE_RELS.includes(r.type)) {
      if (
        (close.push({
          id,
          r,
          seen,
        }),
        idle >= 2 &&
          ((r.op = Math.max(-100, r.op - (r.type === "bestfriend" ? 3 : 6) * (idle - 1))),
          r.op < (r.type === "bestfriend" ? 35 : 22)))
      ) {
        const was = r.type;
        r.type = was === "bestfriend" ? "friend" : "acquaint";
        r.why =
          r.why ||
          {
            mentor: "a former teacher",
            student: "a former student",
            lover: "an old flame",
            friend: "an old friend",
            bestfriend: "once your closest friend",
          }[was];
        if (p.rel[pc.id] && p.rel[pc.id].type === was) p.rel[pc.id].type = r.type;
      }
    } else if (["acquaint", "comrade", "colleague"].includes(r.type)) {
      if (idle >= 3 && Math.abs(r.op) < 25) {
        delete pc.rel[id];
        if (p.rel[pc.id]) delete p.rel[pc.id];
      }
    } else {
      if (["rival", "enemy"].includes(r.type) && idle >= 2) {
        r.op = Math.min(0, r.op + 4 * (idle - 1));
        if (r.op > -15 && idle >= 4) {
          delete pc.rel[id];
          if (p.rel[pc.id]) delete p.rel[pc.id];
        }
      }
    }
  }
  const cap = A.bondCap(pc);
  if (close.length > cap) {
    close.sort((x, y) => x.seen - y.seen || x.r.op - y.r.op);
    for (const c of close.slice(0, close.length - cap)) {
      c.r.op -= 12;
      if (c.r.op < 22 && c.r.type !== "lover") {
        c.r.why = c.r.why || "a friend you lost touch with";
        c.r.type = "acquaint";
      }
    }
  }
};

A.STAFF = {
  file: {
    label: "File-leader",
    skill: "melee",
    s2: "command",
    lvl: 1,
    eff: "Keeps a file of twenty in order. Drill quality.",
  },
  sgt: {
    label: "Sergeant",
    skill: "command",
    s2: "melee",
    lvl: 2,
    eff: "Runs a section of forty. Drill quality and discipline.",
  },
  lt: {
    label: "Lieutenant",
    skill: "command",
    s2: "tactics",
    lvl: 3,
    eff: "Your second. Holds the company together when you fall. Steadiness in battle.",
  },
  sgtmaj: {
    label: "Sergeant-major",
    skill: "command",
    s2: "melee",
    lvl: 3,
    eff: "The drill master. The biggest single effect on how fast your men learn.",
  },
  coy: {
    label: "Company captain",
    skill: "command",
    s2: "tactics",
    lvl: 4,
    eff: "Leads two hundred of your men.",
  },
  second: {
    label: "Second-in-command",
    skill: "tactics",
    s2: "command",
    lvl: 5,
    eff: "Plans with you; picks the battalion captains if you delegate. Better tactics in battle.",
  },
  qm: {
    label: "Quartermaster",
    skill: "logistics",
    s2: "stewardship",
    lvl: 4,
    eff: "Bread, boots and arrows. Supply for your division.",
  },
  bat: {
    label: "Battalion captain",
    skill: "command",
    s2: "tactics",
    lvl: 5,
    eff: "Leads eight hundred of your men.",
  },
  cos: {
    label: "Chief of staff",
    skill: "tactics",
    s2: "command",
    lvl: 6,
    eff: "Plans your battles and reads the enemy. Better scouting and planning; picks division commanders if you delegate.",
  },
  qmg: {
    label: "Quartermaster-general",
    skill: "logistics",
    s2: "stewardship",
    lvl: 6,
    eff: "Feeds the whole army. Supply across your command.",
  },
  scouts: {
    label: "Master of scouts",
    skill: "tracking",
    s2: "tactics",
    lvl: 5,
    eff: "Riders who find the enemy first. Scouting in every battle you fight.",
  },
  div: {
    label: "Division commander",
    skill: "tactics",
    s2: "command",
    lvl: 6,
    eff: "Commands the division in battle: their skill picks its tactics.",
  },
  army: {
    label: "General",
    skill: "command",
    s2: "tactics",
    lvl: 7,
    eff: "Leads one of your armies.",
  },
  guard: {
    label: "Captain of the Guard",
    skill: "melee",
    s2: "command",
    lvl: 6,
    eff: "Your life is in their hands. Plots against you fail more often.",
  },
  steward: {
    label: "Steward",
    skill: "stewardship",
    s2: "trade",
    lvl: 3,
    eff: "Runs your lands. More income from your estate.",
  },
  castellan: {
    label: "Castellan",
    skill: "command",
    s2: "siegecraft",
    lvl: 3,
    eff: "Holds your castle and drills your levy.",
  },
  factor: {
    label: "Factor",
    skill: "trade",
    s2: "stewardship",
    lvl: 3,
    eff: "Your agent in the markets. Better prices on every trade run.",
  },
};

A.STAFF_PARENT = {
  file: "sgt",
  sgt: "sgtmaj",
  coy: "lt",
  bat: "second",
  div: "cos",
  army: null,
};

A.staffSlots = function (pc) {
  const out = [],
    add = (k, n, extra) => {
      for (let i = 1; i <= (n || 1); i++)
        out.push(
          Object.assign(
            {
              key: n > 1 ? `${k}${i}` : k,
              type: k,
            },
            A.STAFF[k],
            extra || {},
          ),
        );
    };
  if (pc.mil && !pc.mil.merc) {
    const r = pc.mil.rank;
    if (
      (r === 2 && add("file", 2),
      r === 3 && add("sgt", 2),
      r === 4 && (add("lt"), add("sgtmaj"), add("sgt", 2)),
      r === 5 && (add("sgtmaj"), add("coy", 3)),
      r === 6 && (add("second"), add("qm"), add("bat", 3)),
      r >= 7)
    ) {
      add("cos");
      add("qmg");
      add("scouts");
      const R2 = A.cmdRole(pc);
      if (r === 7 || r === 8)
        for (const id of R2.divs) {
          const d = A.divById(id);
          if (d)
            out.push(
              Object.assign(
                {
                  key: "div:" + id,
                  type: "div",
                  unit: d.name,
                  divId: id,
                },
                A.STAFF.div,
                {
                  label: `Commander, ${d.name}`,
                },
              ),
            );
        }
      if (r >= 8)
        for (const a of A.armiesOf(pc.mil.realm))
          if (a.gen !== pc.id && (r >= 9 || a.sub === pc.id))
            out.push(
              Object.assign(
                {
                  key: "army:" + a.id,
                  type: "army",
                  armyId: a.id,
                },
                A.STAFF.army,
                {
                  label: `General, ${a.name}`,
                },
              ),
            );
    }
  }
  if (pc.ruler) {
    add("guard");
    for (const a of A.armiesOf(pc.ruler))
      out.push(
        Object.assign(
          {
            key: "army:" + a.id,
            type: "army",
            armyId: a.id,
          },
          A.STAFF.army,
          {
            label: `General, ${a.name}`,
          },
        ),
      );
  }
  if (pc.noble && pc.noble.rung >= 4 && pc.noble.holding != null && !pc.ruler) {
    add("steward");
    add("castellan");
  }
  if (pc.job && ["merchant"].includes(pc.job.c) && pc.job.r >= 2) add("factor");
  return out;
};

A.staffLabel = function (pc, key) {
  const s = A.staffSlots(pc).find(x => x.key === key);
  return s ? s.label : (A.STAFF[key.replace(/\d+$/, "").split(":")[0]] || {}).label || key;
};

A.staffHolder = function (pc, key) {
  pc.staff = pc.staff || {};
  const v = pc.staff[key];
  if (v === "deleg") {
    const id = (pc.staffD || {})[key],
      p2 = id && A.P(id);
    return p2 && p2.alive ? p2 : null;
  }
  const p = v && A.P(v);
  return p && p.alive ? p : null;
};

A.staffCands = function (pc, slot) {
  const S = A.S;
  pc.staffPool = pc.staffPool || {};
  const key = slot.type,
    lvl = slot.lvl;
  let pool = pc.staffPool[key];
  if (!pool || pool.y !== S.year || !pool.ids.every(id => A.P(id) && A.P(id).alive)) {
    const ids = [],
      realm = pc.ruler || (pc.mil && pc.mil.realm) || pc.realm;
    for (let i = 0; i < 4; i++) {
      const n = A.makeAcquaintance(pc, "acquaint");
      n.realm = realm;
      const base = 18 + lvl * 7;
      n.skills[slot.skill] = A.clamp(A.ri(base - 10, base + 22), 5, 95);
      n.skills[slot.s2] = A.clamp(A.ri(base - 18, base + 12), 5, 90);
      if (["div", "army", "cos", "second", "bat", "coy", "lt"].includes(key)) {
        n.skills.melee = A.ri(30, 65);
        n.milRank = Math.max(1, Math.min(8, lvl - 1 + A.ri(0, 1)));
        n.occ = `${GD.MIL[n.milRank].title} of ${A.realmShort(realm)}`;
        n.gear = {
          weapon: A.pick(["sword", "longsword", "spear", "mace"]),
          armor: A.pick(["mail", "mail", "brigandine", "mailplate"]),
          shield: "heater",
          helm: "helm",
          ranged: null,
          mount: lvl >= 5 ? "destrier" : null,
        };
        if (lvl >= 6 && A.chance(0.6)) n.status = "noble";
      } else {
        if (["file", "sgt", "sgtmaj", "guard", "castellan"].includes(key)) {
          n.skills.melee = A.ri(30, 70);
          n.milRank = key === "file" ? 1 : 2;
          n.occ =
            key === "guard" ? "a knight of the household" : `a ${A.STAFF[key].label.toLowerCase()} of long service`;
          n.gear = {
            weapon: A.pick(["spear", "sword", "axe"]),
            armor: A.pick(["padded", "mail", "leather"]),
            shield: "shield",
            helm: "helm",
            ranged: null,
            mount: null,
          };
        } else
          n.occ =
            key === "steward"
              ? "a steward of good family"
              : key === "factor"
                ? "a factor who knows the markets"
                : "a clerk of the stores";
      }
      n.traits = A.pick([
        ["loyal"],
        ["ambitious"],
        ["honest"],
        ["greedy"],
        ["brave"],
        ["cautious"],
        ["cruel"],
        ["generous"],
      ]).filter(t => GD.TRAITS[t]);
      n.npcTemp = true;
      ids.push(n.id);
    }
    pool = pc.staffPool[key] = {
      y: S.year,
      ids,
    };
  }
  const known = A.relsOf(pc)
      .filter(
        x =>
          x.p.alive && A.isAdult(x.p) && !["mother", "father", "child", "grandparent", "grandchild"].includes(x.r.type),
      )
      .map(x => x.p),
    around = A.roster(pc).map(x => x.p),
    all = [...new Set(known.concat(around).concat(pool.ids.map(A.P).filter(Boolean)))].filter(
      p => p.id !== pc.id && p.alive && A.isAdult(p) && !p.ruler,
    ),
    score = p => A.skill(p, slot.skill) * 0.65 + A.skill(p, slot.s2) * 0.35;
  return all
    .sort((a, b) => score(b) - score(a))
    .slice(0, 10)
    .map(p => ({
      p,
      score: Math.round(score(p)),
      known: !!pc.rel[p.id],
    }));
};

A.staffAppoint = function (key, pid) {
  const pc = A.pc(),
    slot = A.staffSlots(pc).find(x => x.key === key),
    p = A.P(pid);
  if (!slot || !p || !p.alive)
    return {
      ok: false,
      msg: "Not possible.",
    };
  pc.staff = pc.staff || {};
  for (const k in pc.staff) if (pc.staff[k] === pid && k !== key) delete pc.staff[k];
  const old = A.staffHolder(pc, key);
  pc.staff[key] = pid;
  if (old && old.id !== pid && pc.rel[old.id]) A.addOp(pc, old, -12);
  p.npcTemp = false;
  if (pc.rel[pid]) A.addOp(pc, p, 10);
  else A.link(pc, p, "subordinate", 25, "superior");
  A.staffApply(pc);
  return {
    ok: true,
    msg: `${A.fullName(p, false)} is your ${slot.label.toLowerCase()} now.`,
  };
};

A.staffDelegate = function (key) {
  const pc = A.pc(),
    slot = A.staffSlots(pc).find(x => x.key === key);
  if (!slot)
    return {
      ok: false,
    };
  pc.staff = pc.staff || {};
  pc.staff[key] = "deleg";
  A.staffResolveDelegates(pc);
  A.staffApply(pc);
  const by = A.staffDelegateTo(pc, slot);
  return {
    ok: true,
    msg: by ? `You leave the choice to ${A.fullName(by, false)}.` : "You leave it to the service to choose.",
  };
};

A.staffDelegateTo = function (pc, slot) {
  const pk = A.STAFF_PARENT[slot.type];
  if (!pk) return null;
  const k = A.staffSlots(pc).find(s => s.type === pk);
  return k ? A.staffHolder(pc, k.key) : null;
};

A.staffResolveDelegates = function (pc) {
  pc.staffD = pc.staffD || {};
  for (const slot of A.staffSlots(pc)) {
    if ((pc.staff || {})[slot.key] !== "deleg") continue;
    const cur = A.P(pc.staffD[slot.key]);
    if (cur && cur.alive) continue;
    const by = A.staffDelegateTo(pc, slot),
      c = A.staffCands(pc, slot).filter(x => !Object.values(pc.staff).includes(x.p.id));
    if (!c.length) continue;
    const pick = c
      .map(x => [x, x.score + (by && by.rel[x.p.id] ? by.rel[x.p.id].op * 0.3 : 0) + A.rf(-8, 8)])
      .sort((a, b) => b[1] - a[1])[0][0];
    pc.staffD[slot.key] = pick.p.id;
    pick.p.npcTemp = false;
  }
};

A.staffApply = function (pc) {
  for (const slot of A.staffSlots(pc)) {
    const h = A.staffHolder(pc, slot.key);
    if (slot.type === "div") {
      const d = A.divById(slot.divId);
      if (d) d.cmd = h ? h.id : d.cmd === pc.id ? null : d.cmd;
    }
    if (slot.type === "army") {
      const a = A.army(slot.armyId);
      if (a && h) a.gen = h.id;
    }
  }
};

A.staffBonus = function (pc, kind) {
  if (!pc) return 0;
  const get = t => {
    const s = A.staffSlots(pc).find(x => x.type === t);
    return s ? A.staffHolder(pc, s.key) : null;
  };
  if (kind === "recon") {
    const a = get("scouts"),
      b = get("cos");
    return (a ? A.skill(a, "tracking") / 4 : 0) + (b ? A.skill(b, "tactics") / 8 : 0);
  }
  if (kind === "supply") {
    const a = get("qmg") || get("qm");
    return a ? A.skill(a, "logistics") / 300 : 0;
  }
  if (kind === "plan") {
    const b = get("cos") || get("second");
    return b ? A.skill(b, "tactics") / 600 : 0;
  }
  if (kind === "drill") {
    let t = 0;
    for (const s of A.staffSlots(pc))
      if (["sgtmaj", "sgt", "file", "lt", "castellan"].includes(s.type)) {
        const h = A.staffHolder(pc, s.key);
        if (h) t += (A.skill(h, "command") + A.skill(h, "melee")) / (s.type === "sgtmaj" ? 200 : 450);
      }
    return t;
  }
  if (kind === "estate") {
    const a = get("steward");
    return a ? A.skill(a, "stewardship") / 350 : 0;
  }
  if (kind === "trade") {
    const a = get("factor");
    return a ? A.skill(a, "trade") / 400 : 0;
  }
  return 0;
};

A.onMonth = A.onMonth || [];

A.onMonth.push(pc => {
  if (pc.staff) {
    A.staffResolveDelegates(pc);
    A.staffApply(pc);
  }
});

GD.DRILLS = {
  formation: {
    short: "Formation",
    name: "Formation drill",
    ic: "shield",
    d: "Wheeling, closing ranks, holding the line under pressure. Better defense and organization.",
    fx: {
      def: 0.06,
      org: 0.08,
    },
  },
  weapons: {
    short: "Weapons",
    name: "Weapons drill",
    ic: "swords",
    d: "Thrust, parry, volley, again and again. Harder hitting.",
    fx: {
      atk: 0.07,
    },
  },
  march: {
    short: "Marches",
    name: "Forced marches",
    ic: "route",
    d: "Thirty miles a day with full kit. Faster on the road, quicker to recover.",
    fx: {
      spd: 0.08,
      orgReg: 0.15,
    },
  },
  skirmish: {
    short: "Skirmish",
    name: "Skirmish and scouting",
    ic: "eye",
    d: "Small parties, ambushes, reading ground. Better scouting; ambush and infiltration come easier.",
    fx: {
      recon: 12,
    },
  },
  shields: {
    short: "Shield walls",
    name: "Shield and spear walls",
    ic: "shield",
    d: "Locking shields against arrows and setting spears against horse. Walls hold better.",
    fx: {
      wall: 0.15,
    },
  },
  siege: {
    short: "Siege work",
    name: "Siege work",
    ic: "hammer",
    d: "Ladders, mines, rams. Sieges go faster.",
    fx: {
      siege: 0.15,
    },
  },
};

A.myUnit = function (pc) {
  return !pc || !pc.mil || pc.mil.merc || pc.mil.rank < 2 ? null : (pc.mil.div && A.divById(pc.mil.div)) || null;
};

A.drillShare = pc =>
  pc.mil
    ? A.clamp(
        GD.MIL[pc.mil.rank].leads /
          Math.max(
            1,
            (
              A.myUnit(pc) || {
                men: 3200,
              }
            ).men,
          ),
        0.02,
        1,
      )
    : 0;

A.setDrill = function (focus, intensity) {
  const pc = A.pc();
  return !pc.mil || pc.mil.rank < 2
    ? {
        ok: false,
        msg: "You need men under you to drill.",
      }
    : ((pc.mil.drill = pc.mil.drill || {
        focus: "formation",
        hard: 1,
      }),
      focus && GD.DRILLS[focus] && (pc.mil.drill.focus = focus),
      intensity != null && (pc.mil.drill.hard = A.clamp(+intensity, 0, 2)),
      {
        ok: true,
      });
};

A.drillDay = function (pc) {
  const d = A.myUnit(pc);
  if (!d) return;
  const D = (pc.mil.drill = pc.mil.drill || {
    focus: "formation",
    hard: 1,
  });
  if (d.atk != null || (A.S.fights || {})[d.loc] || (d.path && d.path.length)) return;
  const share = A.drillShare(pc),
    q = 0.6 + A.skill(pc, "command") / 160 + A.staffBonus(pc, "drill") + (pc.mil.rank >= 6 ? 0.2 : 0),
    hard = [0.5, 1, 1.6][D.hard];
  d.dr = d.dr || {};
  const cap = 0.5 + q * 0.5;
  d.dr[D.focus] = Math.min(cap, (d.dr[D.focus] || 0) + 0.0016 * q * hard * share * (1 - (d.dr[D.focus] || 0) / cap));
  D.own = D.own || {};
  D.own[D.focus] = Math.min(cap, (D.own[D.focus] || 0) + 0.0016 * q * hard * (1 - (D.own[D.focus] || 0) / cap));
  for (const k in D.own) if (k !== D.focus) D.own[k] = Math.max(0, D.own[k] - 4e-4);
  for (const k in d.dr) if (k !== D.focus) d.dr[k] = Math.max(0, d.dr[k] - 4e-4 * share);
  if (d.exp < 35) d.exp = Math.min(35, d.exp + 0.025 * q * hard * share);
  if (D.hard === 2) {
    d.org = Math.max(0, d.org - 0.05 * share);
    if (A.chance(0.002 * share)) A.divLose(d, Math.max(1, Math.round(d.men * 0.001)));
  }
};

A.drillMonth = function (pc) {
  if (
    !(!A.myUnit(pc) || !pc.mil.drill) &&
    ((pc.mil.drillMonths = (pc.mil.drillMonths || 0) + 1),
    A.trainSkill(pc, "command", 0.25 * [0.5, 1, 1.4][pc.mil.drill.hard]),
    pc.mil.drill.hard === 2 && (pc.mil.merit += 1.5),
    A.chance(0.12))
  ) {
    // [X1 baked patch events/97-first-life-fixes LF-POOL-PICK] A.councilMonth and A.drillMonth pick a councillor's or
    // a drilling soldier's business from a pool with only a 2- or 3-year cooldown, so the same war vote and the same
    // slow recruit came back every few years. Both now pick by the life memory (A.lfPoolPick: twice a life, 12 years
    // apart); when the pool is all held back the slot goes to a fresh scene.
    const pool = Object.values(A.EV).filter(
        e2 =>
          e2.drill &&
          (!e2.drill.length || e2.drill.includes(pc.mil.drill.focus) || e2.drill.includes("any")) &&
          (!e2.cond ||
            (() => {
              try {
                return e2.cond(pc, A.C);
              } catch {
                return false;
              }
            })()) &&
          !(A.S.evRecent && A.S.evRecent[e2.id] && A.S.year - A.S.evRecent[e2.id] < (e2.cool || 2)),
      ),
      e = A.lfPoolPick ? A.lfPoolPick(pool, pc) : A.wpick(pool, x => x.w || 1);
    if (e) {
      A.S.evRecent = A.S.evRecent || {};
      A.S.evRecent[e.id] = A.S.year;
      A.queue({
        type: "event",
        ev: e.id,
        forced: true,
      });
    }
  }
};

A.onDay = A.onDay || [];

A.onDay.push(pc => {
  if (pc.mil && !pc.mil.merc && pc.mil.rank >= 2) A.drillDay(pc);
});

A.onMonth.push(pc => {
  if (pc.mil && !pc.mil.merc && pc.mil.rank >= 2) A.drillMonth(pc);
});

A.drillReview = function () {
  const pc = A.pc(),
    d = A.myUnit(pc);
  if (!d)
    return {
      ok: false,
      msg: "No unit to review.",
    };
  if (A.S.time < 1)
    return {
      ok: false,
      msg: "Not enough initiative (⧗) yet.",
    };
  if (((A.S.dcool = A.S.dcool || {}), A.S.dcool.review != null && A.absDay() - A.S.dcool.review < 90))
    return {
      ok: false,
      msg: "One review a season.",
    };
  A.S.time -= 1;
  A.S.dcool.review = A.absDay();
  const dr = Object.assign({}, d.dr || {}),
    own = (pc.mil.drill || {}).own || {};
  for (const k in own) dr[k] = Math.max(dr[k] || 0, own[k]);
  const edge = Object.values(dr).reduce((a, b) => a + b, 0),
    sc = 30 + d.exp * 0.4 + edge * 60 + A.skill(pc, "command") * 0.25 + A.staffBonus(pc, "drill") * 40 + A.rf(-12, 12),
    sup = A.superior(pc),
    good = sc >= 55;
  pc.mil.merit += good ? 12 + Math.round(sc / 10) : 3;
  if (sup && pc.rel[sup.id]) A.addOp(sup, pc, good ? 6 : -3);
  return {
    ok: true,
    msg: good
      ? `The review goes well: ranks straight, kit clean, the drill sharp (${Math.round(sc)}). ${sup ? sup.given + " nods." : ""}`
      : `The review is ragged (${Math.round(sc)}). Somebody drops a spear. ${sup ? sup.given + " says nothing, which is worse." : ""}`,
  };
};

GD.ORDERS = {
  iron_wolf: {
    realm: "POL-01",
    name: "the Knights of the Iron Wolf",
    kind: "order",
    size: 260,
    comps: [["HC", 4]],
    exp: 84,
    gear: "knight",
    lead: "Grand Master of the Iron Wolf",
    ranks: ["Wolf-Aspirant", "Wolf-Brother|Wolf-Sister", "Pack-Leader", "Marshal of the Wolves"],
    spec: "Two hundred and sixty knights in black plate on barded horses, a wolf's head on every helm. The hardest charge in the north: they have never broken first.",
    tac: "shock",
    terr: ["plains", "steppe"],
    fx: {
      brk: 0.3,
    },
    req: {
      worth: 80,
      fame: 30,
      birth: true,
      skill: ["lance", 55],
      stat: ["str", 50],
    },
    lore: {
      name: "In the winter of 949, in the last year of the Wars of Founding, Harald Ironside and forty riders were snowed in on the frozen Glenwash with nothing left to eat. On the ninth night a wolf pack came for the horses. The riders went out on foot with their lances, killed eleven wolves, ate them, and lived. Harald called them his iron wolves, and the name stayed.",
      founded:
        "Founded in 950 by Harald Ironside, a year before he was crowned, from the forty who lived through the wolf winter. Every Grand Master since has sworn on the same iron ring as the emperors.",
      oath: '"We break last."',
      marks:
        "Black-enamelled plate, a wolf's head in black iron on the helm, and a grey wolf pelt over the saddle that each knight must take alone, on foot, with a lance.",
      war: "Knee to knee, lances couched, and only the last hundred paces at the gallop. They charge, rally and charge again. On open plains nothing in the Westland stands in front of them twice.",
      deeds: [
        "1047, the First Horde War: at the Glenwash fords they met an orc relay charge head-on three times in one afternoon, and the river held.",
        "1072, the Second Horde War: they covered the retreat from the upper Gordush. Ninety of 260 came home, and the army came home with them.",
        "1091: they were not at the Stagflow, where Aldmark lost 2,500 men in the fog. Old knights still say they should have been.",
      ],
      join: "Gentle birth or a knighthood, a lance worth the order's name, and a wolf pelt you took yourself. An aspirant squires for a brother for a year, then rides the Long Night: one winter night alone on the plain, in full armor, without a fire.",
      rumor: "No Iron Wolf has ever been taken alive.",
      truth:
        "Twelve have. The order paid their ransoms in secret and struck their names from the roll, and every one of the twelve died within the year. None of them, the records say, in bed.",
    },
  },
  sun: {
    realm: "POL-02",
    name: "the Knights of the Sun",
    kind: "order",
    size: 280,
    comps: [
      ["HC", 3],
      ["HI", 1],
    ],
    exp: 82,
    gear: "knight",
    org: 0.35,
    lead: "Grand Master of the Knights of the Sun",
    ranks: ["Dawn Aspirant", "Knight of the Sun", "Sun-Captain", "Marshal of the Sun"],
    spec: "The Holy See's vowed knights in gilded plate, written in the Book of Noon as already dead. They do not rout: a knight who flees is struck from the light forever.",
    tac: "counter",
    terr: ["plains"],
    fx: {
      def: 0.15,
    },
    req: {
      worth: 78,
      honor: 60,
      faith: true,
      stat: ["wil", 55],
    },
    lore: {
      name: "The Temple teaches that the righteous rise into the sun at noon after they die. A Knight of the Sun is given to the Light already: on the day they take their vows, their name is written in the Book of Noon as if they had died, and it is read out in the High Temple on the day they really do.",
      founded:
        "Founded in 760, the year the Holy See was born, from the last of the emperor's guard. In 759 they had failed to save Emperor Constantine IX from his own generals. The first High Luminary, Benedict, gave the survivors a choice: the axe, or vows. Every one of them chose the vows.",
      oath: '"The sun does not turn back, and neither do I."',
      marks:
        "Plate washed with gold leaf that blinds in the noon light, a white surcoat with the twelve-rayed sun, and no family arms at all: a knight gives up their house when they kneel.",
      war: "They charge at noon when they can, with the sun at their backs and in the enemy's eyes. They are few, so they wait while the Temple's crowned allies do most of the fighting, and they go in where the line is breaking.",
      deeds: [
        "760–762: they put down the last mutinous generals around Solenne and made the Holy See a state.",
        "In the reign of Aurelius III (1033–1050) they rode into the Highland passes to collect the tribute the League never paid. They came home with their dead and without the silver; the Temple still reads out the debt every Return Day.",
        "They keep watch over the Shadow Needle, the great stone sundial that sets the Temple's calendar, and over the Needle-Keeper who tends it.",
      ],
      join: "The faith of the Returning Sun, a clean name, an honor nobody can question, and a fighting worth fit for the order. The aspirant keeps the Noon Vigil: kneeling in armor in the sun from dawn to dusk on Return Day, without water. Those who faint try again next year. Those who faint three times never may.",
      rumor: "No Knight of the Sun has ever fled a field.",
      truth:
        "Thirty-one have, in 345 years. Their names were scraped from the Book of Noon. The Grand Master keeps them in a second, smaller book that nobody else may read.",
    },
  },
  greyfeathers: {
    realm: "POL-05",
    name: "the Greyfeathers",
    kind: "corps",
    size: 300,
    comps: [["LB", 4]],
    exp: 80,
    gear: "archer",
    lead: "Master of the Greyfeathers",
    ranks: ["Fletchling", "Greyfeather", "Sergeant-Archer", "Captain of the Butts"],
    spec: "The picked three hundred of the King's Bowmen, grey goose feathers on every shaft. Twelve arrows a minute, and at a hundred paces they choose which part of you to hit.",
    tac: "barrage",
    terr: ["hills", "plains"],
    fx: {
      soft: 0.3,
    },
    req: {
      worth: 66,
      skill: ["bow", 72],
      stat: ["str", 45],
    },
    lore: {
      name: "Every arrow they shoot is fletched with grey goose feathers from the royal flocks at Swanburg. Any other bowman may use any feather but grey. A man caught with grey-fletched arrows who is not one of them loses the hand that drew the bow.",
      founded:
        "Founded in 881 by King Aldred Ashford, called the Bowman, who picked the three hundred best yeomen at the first great Midsummer Shooting and paid each a penny a day more than any knight's man. Ashmere has held the Shooting every Midsummer since.",
      oath: '"Draw. Hold. Loose. Stand."',
      marks:
        "Grey hoods, brigandines covered in grey wool, a grey feather in the cap, and a war bow of Eldergrove yew taller than the one who draws it.",
      war: "They shoot from behind a stake line on a hillside: twelve arrows a minute each at the start, still eight at the end. Their arrows open the front and empty saddles before a charge arrives. At two hundred paces they hit a man; at a hundred they pick the part.",
      deeds: [
        "1014, the Varenna–Ashmere War: four volleys stopped a Varennan cavalry charge cold on a hillside. Ashmere lost the war anyway, at the treaty table.",
        "1091: at the Brightwash ford one of them put an arrowhead next to the spine of the Varennan captain Dario Montaro. It is still there.",
      ],
      join: "A yeoman's bow arm and the Midsummer Shooting: three arrows into a hoop the size of a man's head at two hundred paces, with the whole kingdom watching. Most years fewer than ten pass. Birth does not matter; a ploughman's son stands beside an earl's.",
      rumor: "A Greyfeather never misses.",
      truth:
        "They miss like everyone else. They just shoot three arrows while anyone else shoots one, and put all three in the same place.",
    },
  },
  shadow: {
    realm: "POL-06",
    name: "the Shadow Guard",
    kind: "corps",
    size: 200,
    comps: [
      ["EA", 2],
      ["LI", 2],
    ],
    exp: 88,
    gear: "shadow",
    lead: "Shade-Captain",
    ranks: ["Shade", "Blade of the Shadow", "Shade-Sergeant", "Second Shade"],
    spec: "Two hundred elves with long knives and short bows who move through the canopy faster than a horse on a road. They kill the officers at night and are gone before the horns blow.",
    tac: "ambush",
    terr: ["forest", "marsh", "hills"],
    fx: {
      soft: 0.35,
      brk: 0.4,
      spd: 0.4,
      recon: 30,
    },
    req: {
      worth: 72,
      race: ["elf", "halfelf"],
      skill: ["stealth", 60],
      skill2: ["dagger", 55],
      skill3: ["bow", 55],
      stat: ["spd", 55],
    },
    lore: {
      name: 'In 291 a Solen army marched into the Evenwood under banners of the sun. Queen Maerith the Unbending told her captains: "Let them bring their sun. We will be its shadow." The name stuck to the two hundred she sent into the trees that night.',
      founded:
        "Founded in 291, in the first year of the War of the Forest Edge, by Queen Maerith the Unbending. They won that war in eleven years without one open battle, and the Treaty of the Oak Line (302) still holds.",
      oath: '"Unseen. Unheard. Until the end."',
      marks:
        "No marks at all. Grey-green elven mail under moss-dyed cloaks, two long knives and a short bow, faces darkened with oak ash. The only sign of rank is a thin silver ring worn on a cord, never on a hand.",
      war: "They cross the canopy faster than a rider on a road, strike a camp at night, kill the officers and are gone before the horns blow. Each one shoots, moves twenty paces and shoots again. They will not hold a line, and nobody asks them to.",
      deeds: [
        "291–302, the War of the Forest Edge: eleven years of night raids. The Solen army never once found their camp.",
        "1078: Aldmark's loggers ignored three warnings at the Oak Line. In one September night the Shadow Guard burned three camps, and 140 loggers did not come home. Aldmark paid twenty thousand marks and handed over the lord who sent them.",
      ],
      join: "An elf or half-elf, quick, at home in the trees, deadly with knife and bow. The trial is the Long Walk: crossing the Evenwood from the Edge to Evenglade, three hundred miles, without being seen by the rangers sent to hunt you. Half fail. Those who are seen may try again in ten years. Elves have time.",
      rumor: "They can run the canopy for a hundred miles without touching the ground.",
      truth:
        "Thirty miles is their record, and they wrote it down. They never correct anyone, because the rumor kills more of their enemies than they do.",
    },
  },
  last_door: {
    realm: "POL-10",
    name: "the Last Door",
    kind: "guard",
    size: 220,
    comps: [["HI", 4]],
    exp: 90,
    gear: "dwarf",
    lead: "Keeper of the Last Door",
    ranks: ["Nail", "Hinge", "Bolt", "Second Keeper"],
    spec: "Two hundred and twenty dwarves in carved plate who have stood behind Irondeep's gates for five hundred years. Arrows bounce off them; charges break on them.",
    tac: "hold",
    terr: ["hills", "mountains"],
    fx: {
      def: 0.45,
    },
    req: {
      worth: 80,
      race: ["dwarf"],
      invite: true,
      stat: ["sta", 50],
    },
    lore: {
      name: "Irondeep has three doors. The Deep Gate faces the world and is made of iron. The Iron Door behind it is made of stone and steel. The last door is made of dwarves.",
      founded:
        "Founded in 612 by Korrin Deepeye the Founder, two years after the first hall was cut, when every name in the clan still fit on one wall. He chose the two hundred and twenty he would trust with his children. The number has never changed.",
      oath: '"Not past me."',
      marks:
        "Carved full plate of Irondeep steel, tower shields with an anvil struck on the face, and war-hammers whose heads pass from the dead to the newly sworn. Each name is cut into the wall of the Last Hall on the day they swear, and painted red on the day they die.",
      war: "They hold. In a gallery two paces wide a file of three can stop an army, and the Last Door has never needed more than three. On open ground they lock shields and walk forward; arrows rattle off and charges break on them.",
      deeds: [
        "No human army has ever passed the Deep Gate, so nobody has ever had to find out whether the Last Door can be passed.",
        "1088, the hungry winter: when Queen Brynja sold iron at half price for barley, the Last Door stood watch over the last of the grain for forty days, and not one sack went missing.",
      ],
      join: "A dwarf, invited by the crown, of proven worth and with the wind to stand all day. The candidate stands in the Narrow, a gallery two paces wide, against the whole Last Door one after another for a full turn of the hourglass. Nobody is expected to win. They are expected not to step back.",
      rumor: "Humans say a dragon's hoard lies behind the Last Door.",
      truth:
        "Behind it are the hold's grain stores, its records and its nurseries. The dwarves find the dragon story useful, and have never once corrected it.",
    },
  },
  stormriders: {
    realm: "POL-11",
    name: "the Stormriders",
    kind: "corps",
    size: 300,
    comps: [
      ["OR", 2],
      ["HC", 2],
    ],
    exp: 82,
    gear: "rider",
    lead: "Storm-Chief",
    ranks: ["Thunder-Calf", "Stormrider", "Storm-Sergeant", "Second Chief"],
    spec: "Three hundred orc riders on the biggest mares of the grass, who ride out into thunderstorms because the Storm calls them by name — and who, unlike other orcs, do not tire.",
    tac: "shock",
    terr: ["steppe", "plains"],
    fx: {
      brk: 0.3,
      spd: 0.15,
    },
    req: {
      worth: 72,
      race: ["orc", "halforc"],
      skill: ["riding", 60],
      stat: ["sta", 55],
    },
    lore: {
      name: "The orcs pray to the Storm and the Mare. When thunder rolls over the grass, most riders make for shelter. The Stormriders ride out into it, because the Storm is calling them by name.",
      founded:
        "Founded in 1041 by Gorath the Great on the night of the Salt Shore. A storm broke over the field; the Nine Winds' archers could not see to shoot or keep their bowstrings dry, and Gorath's three hundred charged through the rain and broke them. Gorath kept the three hundred as his own.",
      oath: '"When the sky speaks, I answer."',
      marks:
        "Mail and horned helms, a white lightning stroke painted from brow to chin, and the biggest mares on the steppe, always mares, for the Mare. Every rider carries a thunder-drum on the saddle.",
      war: "Orc riders fight in short relay charges and are spent in ten minutes. The Stormriders are chosen from the few who are not: they charge, wheel and charge again for an hour, and hit the flank of a tired line just as the rest of the Horde pulls back.",
      deeds: [
        "1041, the Salt Shore: the charge in the storm that made the Horde.",
        "1069, the Second Horde War: they crossed the Gordush at night in a storm and took the upper river in a week.",
        "1102: at the Coldbarrow Bridge War-Chief Vrag led them in the blood-fury charge that broke the Nine Winds' raiders.",
      ],
      join: "An orc or half-orc, a born rider, and the Ride of Wind: keeping pace with the war-chief's relay riders for a day and a night without changing horse. Then the Grey Mothers decide. They can refuse anyone, even a war-chief's son.",
      rumor: "Lightning never strikes a Stormrider.",
      truth:
        'It has killed eleven. The Drum Council calls them "taken home", and their mares are turned loose on the grass to run free for the rest of their days.',
    },
  },
  tenth_wind: {
    realm: "POL-12",
    name: "the Tenth Wind",
    kind: "corps",
    size: 297,
    comps: [["HA", 3]],
    exp: 84,
    gear: "horsearcher",
    lead: "Bearer of the Silver Tablet",
    ranks: ["Colt", "Rider of the Tenth Wind", "Arrow-Sergeant", "Second Bearer"],
    spec: "The khan's horse archers: thirty-three from each of the nine tribes, three remounts each, an arrow storm that never stops moving. Nine winds blow over the steppe; they are the tenth.",
    tac: "flank",
    terr: ["steppe", "plains"],
    fx: {
      soft: 0.25,
      spd: 0.25,
    },
    req: {
      worth: 68,
      skill: ["bow", 62],
      skill2: ["riding", 65],
      stat: ["sta", 45],
    },
    lore: {
      name: "Nine tribes, nine Winds: the Red Wind, the Sea Wind, the Morning Wind and the rest. The Tenth Wind belongs to no tribe. Its riders give up their Wind's colors when they join, and answer only to the khan and the kurultai.",
      founded:
        "Founded in 925 under the Compact by Berek Kharsan the Patient. Each Wind sends its thirty-three best riders, so no tribe can say the khan's riders were taken from it alone. Nine times thirty-three is 297, and there are never more.",
      oath: '"No Wind of my own. Every Wind my brother."',
      marks:
        "Lamellar lacquered sky-blue for the Eternal Blue, three remounts each, and a small silver tablet on a cord at the throat: the khan's sign, which opens every yam station on the steppe.",
      war: "Horse archers who never close: six to ten arrows a minute from the gallop, then wheel away. They feign flight, draw a line out of order and empty it. Nothing on four legs catches them, and nothing on two gets near.",
      deeds: [
        "1041, the Salt Shore: they covered the retreat after Gorath's storm charge and brought Khan Tulgar's body home.",
        "1079: when the kurultai voted to put Khan Toghrul aside, it was the Tenth Wind that rode to his tent to tell him. He left without a fight.",
      ],
      join: "Chosen by your own Wind at the Horse Feast, then the Ring Hunt: riding a whole winter hunt as an outrider without once losing your place in the ring, and taking a running hare from the saddle at forty paces.",
      rumor: "The Tenth Wind is the khan's sword.",
      truth:
        "It is the kurultai's. The Compact says the Tenth Wind serves the khan only while the nine chiefs agree that he is khan. Khan Toghrul learned that in 1079.",
    },
  },
  gold_masks: {
    realm: "POL-20",
    name: "the Gold Masks",
    kind: "guard",
    size: 300,
    comps: [
      ["SP", 2],
      ["HI", 1],
      ["HC", 1],
    ],
    exp: 88,
    gear: "zanara",
    lead: "First Face",
    ranks: ["Unmasked", "Bronze Mask", "Silver Mask", "Golden Face"],
    spec: "Three hundred spears behind masks of beaten gold, each mask an ancestor's face. When they lower their spears, the line in front of them breaks before the points arrive.",
    tac: "hold",
    terr: ["plains", "steppe", "hills"],
    fx: {
      def: 0.3,
      org: 0.15,
    },
    req: {
      worth: 80,
      fame: 30,
      invite: true,
      stat: ["str", 45],
    },
    lore: {
      name: "Each of them wears a mask of beaten gold with the face of an ancestor of the Kanemba line. Behind the mask the warrior is not themselves: they are that ancestor, come back to stand beside the emperor.",
      founded:
        "Founded in 930 by Mosi Kanemba, called the Runner, at the end of the Wars of Unification. He took three hundred of the bravest from every people of the Golden Plains and gave each a Kanemba ancestor's face, so that nobody at his side could be called a foreigner.",
      oath: '"My face is theirs. My life is his."',
      marks:
        "Masks of gold, spears with blades as long as a forearm, kite shields painted with the open eye of the Thousand Ancestors, and iron scale. When a Mask dies, the mask hangs in the Hall of Faces until the Rememberers choose who will wear it next.",
      war: "They are the chest of the Bull's Horns: they meet the enemy head-on and do not move while the horns of young runners race around both flanks. When the Gold Masks lower their spears, the line in front of them tends to break before the points arrive.",
      deeds: [
        "930: the last battle of the Wars of Unification, where Mosi the Runner's three hundred stood as the chest of the Horns.",
        "1060, the Salt War: they held the wells of the gold road against the Sand Clans for nine days without water.",
      ],
      join: "An invitation from the crown, and the Rememberers' word that your deeds are worthy of an ancestor's face. The candidate stands through a whole Night of Masks while the Rememberers sing the ancestor's life, and must answer to the ancestor's name at dawn.",
      rumor: "There is no face under the masks: the ancestors themselves walk in them.",
      truth:
        "The masks are not solid gold. They are bronze under gold leaf. The solid masks were melted down in 1062 to pay for the Salt War, and only the First Face and the emperor know.",
    },
  },
};

GD.LORE_RENAME = [
  [/Knights of the Noon/g, "Knights of the Sun"],
  [/Knight of the Noon/g, "Knight of the Sun"],
  [/Noon Knights/g, "Sun Knights"],
];

A.renameDeep = function (root) {
  const seen = new Set(),
    walk = o => {
      if (!(!o || typeof o != "object" || seen.has(o))) {
        seen.add(o);
        for (const k of Object.keys(o)) {
          const v = o[k];
          if (typeof v == "string") {
            if (/Noon/.test(v)) {
              let w = v;
              for (const [re, to] of GD.LORE_RENAME) w = w.replace(re, to);
              if (w !== v) o[k] = w;
            }
          } else if (v && typeof v == "object") walk(v);
        }
      }
    };
  walk(root);
};

GD.ORDER_RENAMED = {
  iron_ring: "iron_wolf",
  noon: "sun",
  bowmen: "greyfeathers",
  anvil: "last_door",
  ninth_wind: "tenth_wind",
};

GD.ORDER_GONE = {
  hearth: "the Hearth Guard",
  oathbound: "the Oathbound",
  steel: "the Steel Guard",
  crucible: "the Crucible Guard",
  stair: "the Stair Guard",
  snowborn: "the Snowborn",
  cloudwalkers: "the Cloudwalkers",
  tide: "the Tide Divers",
  drowned: "the Drowned Men",
  blackreef: "the Blackreef crews",
  red_sails: "the Red Sails",
  lances: "the Lances",
  lion_lances: "the Lion Lances",
  mistwalkers: "the Mistwalkers",
  crocodile: "the Crocodile Guard",
};

GD.ORDER_GEAR = {
  knight: {
    weapon: "longsword",
    shield: "heater",
    armor: "plate",
    helm: "bascinet",
    mount: "barded",
    ranged: null,
    sk: ["lance", "sword", "riding", "mounted"],
  },
  archer: {
    weapon: "arming",
    shield: null,
    armor: "brigandine",
    helm: "sallet",
    mount: null,
    ranged: "warbow",
    sk: ["bow", "sword"],
  },
  shadow: {
    weapon: "dagger",
    shield: "parrydagger",
    armor: "elfmail",
    helm: null,
    mount: null,
    ranged: "elfbow",
    sk: ["dagger", "dualwield", "bow", "stealth", "athletics"],
  },
  dwarf: {
    weapon: "warhammer",
    shield: "tower",
    armor: "dwarfplate",
    helm: "dwarfhelm",
    mount: null,
    ranged: null,
    sk: ["axe", "shield"],
  },
  rider: {
    weapon: "horsemace",
    shield: null,
    armor: "orcmail",
    helm: "horned",
    mount: "destrier",
    ranged: "compbow",
    sk: ["axe", "riding", "mounted", "bow"],
  },
  horsearcher: {
    weapon: "saber",
    shield: null,
    armor: "lamellar",
    helm: "spangen",
    mount: "courser",
    ranged: "horsebow",
    sk: ["bow", "riding", "mounted", "sword"],
  },
  zanara: {
    weapon: "partisan",
    shield: "kite",
    armor: "scale",
    helm: null,
    mount: null,
    ranged: "javelins",
    sk: ["spear", "shield", "throwing"],
  },
};

GD.ORDER_RANKS = {
  order: [
    ["Aspirant", "Aspirant"],
    ["Knight-Brother", "Knight-Sister"],
    ["Knight-Captain", "Knight-Captain"],
    ["Marshal of the Order", "Marshal of the Order"],
    null,
  ],
  guard: [
    ["Guardsman", "Guardswoman"],
    ["Guard-Sergeant", "Guard-Sergeant"],
    ["Guard-Captain", "Guard-Captain"],
    ["Second of the Guard", "Second of the Guard"],
    null,
  ],
  corps: [["Recruit", "Recruit"], ["Trooper", "Trooper"], ["Sergeant", "Sergeant"], ["Captain", "Captain"], null],
};

GD.ORDER_Q = {
  order: 1.8,
  guard: 1.7,
  corps: 1.6,
};

A.orderCode = (id, i) => `X${id}${i}`;

A.orderBuildCompanies = function () {
  for (const id in GD.ORDERS) {
    const o = GD.ORDERS[id],
      n = o.comps.reduce((s, [, k]) => s + k, 0),
      per = Math.round(o.size / n);
    o.bns = [];
    o.cos = [];
    o.comps.forEach(([base, k, qo], i) => {
      const B = GD.BN[base],
        T = GD.TROOPS[base];
      if (!B) return;
      const code = A.orderCode(id, i),
        q = qo || GD.ORDER_Q[o.kind],
        sc = (per / B.men) * q;
      GD.BN[code] = Object.assign({}, B, {
        men: per,
        w: Math.max(0.2, Math.round(((B.w * per) / B.men) * 1.5 * 10) / 10),
        soft: B.soft * sc,
        hard: B.hard * sc,
        def: B.def * sc,
        brk: B.brk * sc,
        hp: ((B.hp * per) / B.men) * q * 0.9,
        org: Math.min(95, B.org + 20),
        arm: B.arm + (o.kind === "corps" ? 1 : 4),
        prc: B.prc + 2,
        sup: ((B.sup * per) / B.men) * 1.6,
        spd: B.spd * (o.kind === "corps" ? 1.15 : 1),
        eq: Object.fromEntries(Object.entries(B.eq).map(([e, v]) => [e, Math.round(((v * per) / B.men) * 1.5)])),
        elite: id,
        role: `${A.cap(o.name.replace(/^the /, ""))}: ${per} picked ${B.cat === "horse" ? "riders" : B.cat === "missile" ? "shots" : "blades"}, each worth about ${q.toFixed(1)} of their kind.`,
      });
      if (T)
        GD.TROOPS[code] = Object.assign({}, T, {
          name: `${A.cap(o.name.replace(/^the /, ""))} — ${T.name.toLowerCase()}`,
          melee: T.melee * 1.7,
          def: T.def * 1.6,
          missile: (T.missile || 0) * 1.6,
          charge: (T.charge || 0) * 1.5,
          morale: Math.min(99, (T.morale || 60) + 25),
          elite: id,
        });
      for (let j = 0; j < k; j++) o.bns.push(code);
      o.cos.push({
        code,
        base,
        k,
        per,
      });
    });
  }
};

A.orderBuildCompanies();

A.orderDef = id => GD.ORDERS[id] || null;

A.theName = n => (/^the /i.test(n) ? n : "the " + n);

A.orderLeadTitle = o => (/\bof\b/.test(o.lead) ? o.lead : o.lead + " of " + A.theName(o.name));

A.orderRankName = function (p) {
  const o = p && p.order && A.orderDef(p.order.id);
  if (!o) return "";
  const rk = p.order.rank;
  if (o.ranks && o.ranks[rk]) {
    const parts = o.ranks[rk].split("|"),
      t2 = parts[p.sex === "F" && parts[1] ? 1 : 0],
      core = o.name.replace(/^the /i, "").replace(/s$/, "");
    return / of /.test(t2) || t2.includes(core) ? t2 : `${t2} of ${A.theName(o.name)}`;
  }
  const r = GD.ORDER_RANKS[o.kind][rk],
    t = r ? r[p.sex === "F" ? 1 : 0] : o.lead;
  return r ? `${t} of ${A.theName(o.name)}` : A.orderLeadTitle(o);
};

A.orderDiv = function (id) {
  const o = A.orderDef(id),
    r = o && A.realm(o.realm);
  return !r || !r.forces ? null : r.forces.divs.find(d => d.elite === id) || null;
};

A.orderTpl = function (r, id) {
  const o = GD.ORDERS[id];
  let tid = Object.keys(r.forces.tpl).find(k => r.forces.tpl[k].order === id);
  if (tid) {
    const t2 = r.forces.tpl[tid];
    if (t2.bns.join() !== o.bns.join()) {
      t2.bns = o.bns.slice();
      t2.sup = [];
      t2.v = (t2.v || 1) + 1;
    }
    t2.share = 1e-4;
    return tid;
  }
  const t = A.tplAdd(r, {
    name: A.cap(o.name.replace(/^the /, "")),
    bns: o.bns,
    sup: [],
    kind: o.kind === "corps" ? "custom" : "guard",
    share: 1e-4,
  });
  t.order = id;
  t.share = 1e-4;
  return t.id;
};

A.orderRaise = function (r, id) {
  const o = GD.ORDERS[id];
  if (!o || !r || !r.alive || r.isRebel) return null;
  A.F(r);
  const tid = A.orderTpl(r, id),
    d = A.newDiv(r, tid, r.capitalProv != null ? r.capitalProv : (A.realmProvs(r.id)[0] || {}).id, {
      name: A.cap(o.name),
      exp: o.exp,
      str: 1,
    });
  if (!d) return null;
  d.elite = id;
  r.orders = r.orders || {};
  let L = A.P(r.orders[id]);
  if (!L || !L.alive) {
    const R2 = GD.RACES[r.race] || GD.RACES.human;
    L = A.genNoble(
      r.id,
      "noble",
      null,
      Math.round(R2.adult + (R2.old - R2.adult) * A.rf(0.45, 0.85)),
      A.chance(0.8) ? "M" : "F",
    );
    const G = GD.ORDER_GEAR[o.gear] || GD.ORDER_GEAR.knight,
      legend = A.chance(0.1) && (A.legendCount ? A.legendCount() : 0) < (GD.LEGEND_CAP || 5) - 1;
    L.skills.command = A.ri(62, 84);
    L.skills.tactics = A.ri(55, 80);
    L.skills.melee = legend ? A.ri(80, 92) : A.ri(62, 74);
    for (const k of G.sk) if (GD.SKILLS[k]) L.skills[k] = legend ? A.ri(86, 96) : A.ri(74, 84);
    L.gear = {
      weapon: G.weapon,
      ranged: G.ranged,
      armor: G.armor,
      shield: G.shield,
      helm: G.helm,
      mount: G.mount,
      cloak: null,
    };
    for (const s of ["weapon", "ranged", "armor", "shield", "helm", "mount"])
      if (L.gear[s] && !GD.GEAR[L.gear[s]]) L.gear[s] = null;
    L.gearQ = {
      weapon: legend ? "master" : "fine",
      armor: "fine",
      ranged: "fine",
    };
    const set = (s, lo, hi) => {
      L.st[s] = A.ri(lo, hi);
    };
    set("spd", legend ? 62 : 48, legend ? 76 : 62);
    set("ins", legend ? 62 : 48, legend ? 76 : 62);
    set("wil", legend ? 66 : 52, legend ? 80 : 66);
    set("str", legend ? 70 : 56, legend ? 84 : 68);
    set("sta", legend ? 86 : 66, legend ? 96 : 78);
    if ((GD.RACES[L.race] || {}).burst) L.st.sta += 6;
    const want = legend ? A.ri(120, 134) : A.ri(96, 106),
      wk = Object.keys(L.skills).filter(k => G.sk.includes(k) || k === "melee");
    for (let i = 0; i < 80; i++) {
      const w = A.fightWorth(L),
        floor = w > (legend ? 138 : 110) ? 52 : legend ? 80 : 66;
      if (w > want + 1) {
        if (L.st.spd > 42 || L.st.ins > 42) {
          L.st.spd = Math.max(40, L.st.spd - 1);
          L.st.ins = Math.max(40, L.st.ins - 1);
        } else if (wk.some(k => L.skills[k] > floor))
          for (const k of wk) L.skills[k] = Math.max(floor, L.skills[k] - 1);
        else break;
      } else if (w < want - 1) for (const k of wk) L.skills[k] = Math.min(98, L.skills[k] + 1);
      else break;
    }
    if (r.capitalProv != null) L.home = r.capitalProv;
    L.occ = A.orderLeadTitle(o);
    L.fame = A.ri(45, 75);
    r.orders[id] = L.id;
    const ru = A.P(r.ruler);
    if (ru && o.kind === "guard") A.link(ru, L, "friend", 70, "lord");
  }
  d.cmd = L.id;
  A.forcesSync(r);
  return d;
};

A.ordersEnsure = function () {
  const S = A.S;
  for (const id in GD.ORDERS) {
    const o = GD.ORDERS[id],
      r = A.realm(o.realm);
    if (!(!r || !r.alive || r.isRebel) && (A.F(r), (r.orderGone = r.orderGone || {}), !A.orderDiv(id)))
      if (r.orderGone[id] == null) {
        if (A.orderRaise(r, id)) continue;
      } else if (S.year - r.orderGone[id] >= 3 && !A.atWar(r.id).length) {
        A.orderRaise(r, id);
        A.news(`${A.cap(o.name)} of ${r.short} rise again from the survivors and new blood.`, "crown");
        delete r.orderGone[id];
      }
  }
};

A.onMonth = A.onMonth || [];

A.onMonth.push(() => {
  if (A.S.year >= 1105) A.ordersEnsure();
});

A.on("worldInit", () => {
  try {
    A.ordersEnsure();
  } catch {}
});
