// Retired by W1-5 (D-091, D-095), as they stood at 84b7f92: the peace table's terms priced against the war score and a
// willingness number (A.peaceTerms), the odds shown to the player as a percentage (A.peaceOdds), the offer rolled
// against them (A.peaceOffer), and the AI's offers to a ruling player read from the score (sue, demand, white peace).

// ---- src/core/release/core/13-factions-and-decisions.js lines 548-752
A.peaceTerms = function (w, rid) {
  const S = A.S,
    side = A.warSide(w, rid);
  if (!side) return null;
  const my = side === "att" ? w.att : w.def,
    them = side === "att" ? w.def : w.att,
    eid = side === "att" ? w.leadD : w.leadA,
    e = A.realm(eid),
    r = A.realm(rid);
  if (!e || !r) return null;
  const sc = side === "att" ? w.score : -w.score,
    ePop = S.prov.filter(p => them.includes(p.owner)).reduce((a, p) => a + p.pop, 0) || 1,
    myPop = S.prov.filter(p => my.includes(p.owner)).reduce((a, p) => a + p.pop, 0) || 1,
    out = [];
  for (const p of S.prov)
    if (them.includes(p.owner) && my.includes(p.occ)) {
      const cap = A.realm(p.owner) && A.realm(p.owner).capitalProv === p.id;
      out.push({
        k: "take:" + p.id,
        grp: "Land you hold",
        name: `Take ${p.name}`,
        sub: `${A.realmShort(p.owner)} · ${A.fmt(p.pop)} people${cap ? " · their capital" : ""}${r.claims && r.claims[p.id] ? " · your claim" : ""}`,
        cost: Math.round(6 + (70 * p.pop) / ePop + (cap ? 15 : 0) - (r.claims && r.claims[p.id] ? 4 : 0)),
      });
    }
  const g1 = Math.round(Math.max(800, (e.treasury > 0 ? e.treasury * 0.25 : 0) + e.income * 0.1));
  out.push({
    k: "gold",
    grp: "Gold and honor",
    name: `Reparations: ${A.fmt(g1)} suns`,
    sub: "Paid from their treasury.",
    cost: 14,
    gold: g1,
  });
  out.push({
    k: "gold2",
    grp: "Gold and honor",
    name: `Crushing reparations: ${A.fmt(g1 * 2.5)} suns`,
    sub: "They will borrow to pay it, and hate you for years.",
    cost: 30,
    gold: Math.round(g1 * 2.5),
  });
  if (!e.overlord && r.overlord !== e.id)
    out.push({
      k: "trib",
      grp: "Gold and honor",
      name: "They become your tributary",
      sub: "8% of their income every year until they break free.",
      cost: 42,
    });
  if (e.allies.filter(x => A.realm(x) && A.realm(x).alive && x !== rid).length)
    out.push({
      k: "unally",
      grp: "Gold and honor",
      name: "They renounce their alliances",
      sub: e.allies
        .filter(x => A.realm(x))
        .map(A.realmShort)
        .join(", "),
      cost: 16,
    });
  out.push({
    k: "humble",
    grp: "Gold and honor",
    name: "A public submission",
    sub: "Their ruler kneels to yours. Legitimacy +8 for you, −8 for them.",
    cost: 10,
  });
  for (const p of S.prov)
    if (my.includes(p.owner) && them.includes(p.occ))
      out.push({
        k: "cede:" + p.id,
        grp: "What you give",
        name: `Cede ${p.name}`,
        sub: `They hold it already · ${A.fmt(p.pop)} people`,
        cost: -Math.round(6 + (70 * p.pop) / myPop),
      });
  const pay = Math.round(Math.max(600, r.income * 0.12));
  out.push({
    k: "pay",
    grp: "What you give",
    name: `Pay them ${A.fmt(pay)} suns`,
    sub: "Silver to end it.",
    cost: -14,
    gold: pay,
  });
  // [X1 baked patch diplomacy/20-ai-personality AIP-PEACE] A.checkPeace: the loser gives in sooner if cautious,
  // later if proud or wrathful (A.aiYield); white peace comes sooner between calm, kind, cautious rulers
  // (A.aiWhite). A.peaceTerms adds the enemy ruler's temper to their willingness. Every settlement is logged.
  const will =
    sc * 1.3 +
    18 +
    (e.exhaustion || 0) * 0.35 -
    (r.exhaustion || 0) * 0.15 +
    (A.atWar(eid).length > 1 ? 10 : 0) +
    A.aiPeaceWill(eid);
  return {
    w,
    side,
    my,
    them,
    eid,
    e,
    r,
    sc,
    terms: out,
    will,
  };
};

// [X1 baked patch core/04-world-fixes WLD-REPARATIONS-EXCLUSIVE] "Reparations" and "Crushing reparations" could
// both be ticked and were both paid: 3.5x gold for cost 44 beat the crushing option alone (2.5x for 30). They are
// now one choice: the engine keeps only the crushing one if both arrive, and ticking one unticks the other.
A.peaceOdds = function (T, picks) {
  if (picks.includes("gold2")) picks = picks.filter(k => k !== "gold");
  const cost = T.terms.filter(t => picks.includes(t.k)).reduce((a, t) => a + t.cost, 0),
    p = cost <= 0 ? 0.9 + Math.min(0.08, -cost / 200) : A.clamp(0.55 + (T.will - cost) / 45, 0.02, 0.95);
  return {
    cost,
    p: Math.round(p * 100),
  };
};

A.peaceOffer = function (wid, picks) {
  const pc = A.pc(),
    rid = pc && pc.ruler,
    w = A.S.wars.find(x => x.id === wid);
  if (!w || !rid)
    return {
      ok: false,
      msg: "There is no such war.",
    };
  if (!(w.leadA === rid || w.leadD === rid))
    return {
      ok: false,
      msg: "Only the leader of your side can make peace.",
    };
  const T = A.peaceTerms(w, rid);
  if (A.S.yearActs["peace_" + wid] >= 2)
    return {
      ok: false,
      msg: "They have heard two offers this year. They will not hear a third.",
    };
  A.S.yearActs["peace_" + wid] = (A.S.yearActs["peace_" + wid] || 0) + 1;
  // [X1 baked patch core/04-world-fixes WLD-REPARATIONS-EXCLUSIVE] "Reparations" and "Crushing reparations" could
  // both be ticked and were both paid: 3.5x gold for cost 44 beat the crushing option alone (2.5x for 30). They are
  // now one choice: the engine keeps only the crushing one if both arrive, and ticking one unticks the other.
  if (picks.includes("gold2")) picks = picks.filter(k => k !== "gold");
  const { cost, p } = A.peaceOdds(T, picks);
  if (!A.chance(p / 100)) {
    A.addRel(rid, T.eid, -4);
    return {
      ok: false,
      msg: `${A.realmShort(T.eid)} refuses your terms (${p}% chance). The war goes on.`,
    };
  }
  const r = T.r,
    e = T.e,
    got = [];
  for (const t of T.terms.filter(x => picks.includes(x.k)))
    if (t.k.startsWith("take:")) {
      const pr = A.prov(+t.k.slice(5));
      if (pr && T.them.includes(pr.owner)) {
        A.transferProv(pr, rid, true);
        got.push(pr.name);
      }
    } else if (t.k.startsWith("cede:")) {
      const pr = A.prov(+t.k.slice(5));
      if (pr && pr.owner === rid) {
        A.transferProv(pr, pr.occ && T.them.includes(pr.occ) ? pr.occ : T.eid, true);
        got.push("ceded " + pr.name);
      }
    } else if (t.k === "gold" || t.k === "gold2") {
      e.treasury -= t.gold;
      r.treasury += t.gold;
      if (e.treasury < 0) {
        e.debt += -e.treasury;
        e.treasury = 0;
      }
      got.push(A.fmt(t.gold) + " suns");
    } else if (t.k === "pay") {
      r.treasury -= t.gold;
      e.treasury += t.gold;
      got.push("paid " + A.fmt(t.gold));
    } else if (t.k === "trib") {
      e.overlord = rid;
      A.unally(rid, e.id);
      got.push("tribute");
    } else if (t.k === "unally") {
      for (const x of e.allies.slice()) if (x !== rid) A.unally(e.id, x);
      got.push("their alliances broken");
    } else if (t.k === "humble") {
      r.legit = Math.min(100, r.legit + 8);
      e.legit = Math.max(0, e.legit - 8);
      got.push("submission");
    }
  const res = cost > 0 ? T.side : cost < 0 ? (T.side === "att" ? "def" : "att") : "white";
  A.endWar(w, res, `${w.name} ends at the table: ${got.length ? got.join(", ") : "nothing changes hands"}.`);
  A.updateRealmPops();
  if (cost > 30) A.addRel(rid, T.eid, -25);
  return {
    ok: true,
    msg: `Peace! ${got.join(", ") || "White peace."}`,
  };
};

// ---- src/core/release/core/13-factions-and-decisions.js lines 893-926
  for (const w of A.atWar(r.id)) {
    if (w.leadA !== r.id && w.leadD !== r.id) continue;
    const side = A.warSide(w, r.id),
      sc = side === "att" ? w.score : -w.score,
      eid = side === "att" ? w.leadD : w.leadA,
      e = A.realm(eid);
    if (!(!e || e.playerRun)) {
      if (sc >= 30 || (e.exhaustion > 60 && sc >= 10))
        out.push({
          w: 4,
          kind: "sue",
          rid: eid,
          war: w.id,
        });
      else {
        if (sc <= -35)
          out.push({
            w: 4,
            kind: "demand",
            rid: eid,
            war: w.id,
          });
        else {
          if ((e.exhaustion > 55 && r.exhaustion > 40) || S.year - w.start >= 4)
            out.push({
              w: 2,
              kind: "whitepeace",
              rid: eid,
              war: w.id,
            });
        }
      }
    }
  }

// ---- src/core/release/core/13-factions-and-decisions.js lines 1118-1155
    case "sue": {
      const w = A.S.wars.find(x => x.id === o.war);
      if (!w) return;
      const side = A.warSide(w, r.id),
        provs = A.wsTreatyProvinces(w, side);
      o.provs = provs.map(p => p.id);
      Q(
        `${t.short} sues for peace`,
        `${w.name} is going your way. ${who} offers peace: ${provs.length ? "you keep " + provs.map(p => p.name).join(", ") : "reparations of " + A.fmt(Math.round(t.income * 0.15)) + " suns"}.`,
        "Accept their surrender",
        "Fight on for more",
      );
      break;
    }
    case "demand": {
      const w = A.S.wars.find(x => x.id === o.war);
      if (!w) return;
      const side = A.warSide(w, r.id) === "att" ? "def" : "att",
        provs = A.wsTreatyProvinces(w, side);
      o.provs = provs.map(p => p.id);
      Q(
        `${t.short} demands your surrender`,
        `${w.name} is going badly. ${who} offers to stop — if you ${provs.length ? "give up " + provs.map(p => p.name).join(", ") : "pay " + A.fmt(Math.round(r.income * 0.2)) + " suns"}.`,
        "Accept their terms",
        "Never — fight on",
      );
      break;
    }
    case "whitepeace": {
      const w = A.S.wars.find(x => x.id === o.war);
      if (!w) return;
      Q(
        `${t.short} offers a white peace`,
        `Both realms are bleeding for ${w.name}. ${who} offers to end it where it stands: no land, no gold.`,
        "Accept the white peace",
        "Refuse",
      );
      break;

// ---- src/core/release/core/13-factions-and-decisions.js lines 1231-1270
        case "sue": {
          const w = A.S.wars.find(x => x.id === o.war);
          if (!w) return;
          const side = A.warSide(w, r.id),
            provs = (o.provs || []).map(A.prov).filter(p => p && w[side === "att" ? "def" : "att"].includes(p.owner));
          for (const p of provs) A.transferProv(p, r.id, true);
          if (!provs.length) {
            const g = Math.round(t.income * 0.15);
            t.treasury -= g;
            r.treasury += g;
          }
          A.endWar(
            w,
            side,
            `${w.name} ends: ${t.short} sues for peace${provs.length ? " and gives up " + provs.map(p => p.name).join(", ") : " and pays"}.`,
          );
          A.updateRealmPops();
          break;
        }
        case "demand": {
          const w = A.S.wars.find(x => x.id === o.war);
          if (!w) return;
          const side = A.warSide(w, r.id) === "att" ? "def" : "att",
            provs = (o.provs || []).map(A.prov).filter(p => p && p.owner === r.id);
          for (const p of provs) A.transferProv(p, t.id, true);
          if (!provs.length) {
            const g = Math.round(r.income * 0.2);
            r.treasury -= g;
            t.treasury += g;
          }
          r.legit = Math.max(0, r.legit - 5);
          A.endWar(w, side, `${w.name} ends: ${r.short} accepts ${t.short}'s terms.`);
          A.updateRealmPops();
          break;
        }
        case "whitepeace": {
          const w = A.S.wars.find(x => x.id === o.war);
          if (w) A.settleWar(w, "white");
          break;
        }

// and the peace table's view (UI.peacePanel), with its willingness number and its percentage

// ---- src/core/release/core/23-ui-c.js lines 596-626
UI.peacePicks = UI.peacePicks || {};

// W0 (D-052): the terms no longer show a war score chip; the land held and the battles won stand in its place. The
// score still decides the foe's willingness inside A.peaceTerms.
UI.peacePanel = function (wid) {
  const pc = A.pc(),
    w = A.S.wars.find(x => x.id === wid);
  if (!w || !pc.ruler) return '<p class="muted">This war is over.</p>';
  const T = A.peaceTerms(w, pc.ruler);
  if (!T) return "";
  const picks = UI.peacePicks[wid] || (UI.peacePicks[wid] = []),
    odds = A.peaceOdds(T, picks),
    lead = w.leadA === pc.ruler || w.leadD === pc.ruler;
  let h = `<div class="peace"><div class="row"><b>Terms for ${UI.esc(w.name)}</b></div><div class="small">${UI.esc(A.warFactsText(w, pc.ruler))}</div><div class="tiny muted">${UI.esc(A.realmName(T.eid))} is ${T.e.exhaustion > 60 ? "exhausted" : T.e.exhaustion > 30 ? "tiring" : "still fresh"} (war weariness ${Math.round(T.e.exhaustion)}). What they will accept depends on the land each side holds, the battles won, their weariness and what you ask.</div>`;
  const grps = {};
  for (const t of T.terms) (grps[t.grp] = grps[t.grp] || []).push(t);
  for (const g in grps) {
    h += `<div class="group-h">${UI.esc(g)}</div>`;
    for (const t of grps[g]) {
      const on = picks.includes(t.k);
      h += `<label class="term ${on ? "on" : ""}"><input type="checkbox" data-c="peaceT" data-k="${wid}" value="${UI.esc(t.k)}" ${on ? "checked" : ""}><div class="grow"><div>${UI.esc(t.name)}</div><div class="tiny muted">${UI.esc(t.sub || "")}</div></div><span class="cost ${t.cost < 0 ? "good" : ""}">${t.cost > 0 ? "−" + t.cost : "+" + -t.cost}</span></label>`;
    }
  }
  const tot = odds.cost;
  // [X1 baked patch diplomacy/20-ai-personality AIP-DIPL-UI] UI.diplCard: the fictional "Slowly pulling them" list
  // (A.realmStanding fed nothing) now shows the real yearly pulls from A.aiPullParts; a temperament line names the
  // ruler's traits and what they do; every offer shows its top 3 reasons. The peace screen explains their
  // willingness.
  h += `<div class="peace-sum"><div>Your demands: <b>${tot}</b> · Their willingness: <b>${Math.round(T.will)}</b>${UI.aiWillWhy(T)}</div>${UI.barRow("They accept", odds.p, 100, odds.p < 30 ? "hpbar" : "", null, odds.p + "%")}<div class="row"><button class="primary" data-a="peaceSend" data-v="${wid}" ${lead ? "" : "disabled"}>Send the envoy (${odds.p}%)</button><button class="small" data-a="peaceClear" data-v="${wid}">Clear</button></div>${lead ? "" : '<div class="tiny bad">Only the leader of your side can make peace.</div>'}<div class="tiny muted">Two offers a year. A refusal sours relations a little.</div></div></div>`;
  return h;
};
