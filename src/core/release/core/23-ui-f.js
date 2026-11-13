// The release's core, ui (part 6 of 6): UI: the interface.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: UI.TAB.holdings, UI.A (+), UI.C (+), UI.TAB.codex, UI.powerPage, UI.COMP_COL, UI.COMP_NAME, UI.realmCode,
// UI.divCats, UI.wrComp, UI.compStrip, UI.lumOf, UI.wrCounter, UI.wrLegend, UI.wrBars, UI.bnGrid, UI.wrDivPanel,
// UI.duelModal, UI.helpModal, UI.errLog, UI.noteError, UI.reportBundle, UI.downloadReport, UI.reportModal.

UI.TAB.holdings = function (pc) {
  const home = A.homeMkt(pc),
    hr = A.realm(home);
  let h = `<div class="card purse"><div class="row">${UI.icon("coins", "s")}<span class="tag">Your purse</span></div><div class="kv"><div>Coin</div><div><b>${A.coin(pc.coin)}</b></div>${pc.debt ? `<div>Debt</div><div class="bad">${A.coin(pc.debt)} (12% a year)</div>` : ""}${!A.isAdult(pc) && A.S.family ? `<div>Family purse</div><div>${A.coin(A.S.family.wealth)}</div>` : ""}<div>Everything you own</div><div>${A.coin(pc.coin + A.assetValue(pc))}</div><div>Your market</div><div>${UI.esc(hr ? hr.capital + ", " + hr.short : "—")}</div></div><div class="tiny muted">A sun is about a day's wage for a laborer. A soldier earns 2–4 a week; a good sword costs a month of a craftsman's work.</div></div>`;
  h += '<div class="group-h">What you carry</div><div class="grid2">';
  for (const slot of ["weapon", "shield", "ranged", "armor", "helm", "cloak", "mount"]) {
    const k = pc.gear[slot],
      g = k ? GD.GEAR[k] : null,
      q = A.qualOf(pc, slot),
      Q2 = GD.QUAL[q] || GD.QUAL.common,
      stat = g
        ? g.dmg
          ? `damage ${Math.round(g.dmg * Q2.dmg * 10) / 10}${g.pierce || Q2.pierce ? ", pierce " + ((g.pierce || 0) + (Q2.pierce || 0)) : ""}${g.reach ? ", reach " + g.reach : ""}`
          : g.prot != null
            ? `protection ${Math.round(g.prot * Q2.prot * 10) / 10}`
            : g.def
              ? "defense " + g.def
              : g.ride != null
                ? "riding " + g.ride
                : ""
        : "";
    h += `<div class="card small gear-c"><span class="tag">${slot}</span><div><b>${UI.esc(g ? g.name : "—")}</b> ${g && !["fists", "none"].includes(k) ? UI.qualChip(q) : ""}</div><div class="muted">${stat}</div>${g && k !== "fists" && k !== "none" ? `<button class="small" data-a="sellGear" data-v="${slot}">Sell</button>` : ""}</div>`;
  }
  if (((h += "</div>"), !A.isAdult(pc))) return h;
  const slots = [
      ["weapon", "Weapons"],
      ["ranged", "Bows"],
      ["shield", "Shields"],
      ["armor", "Armor"],
      ["helm", "Helms"],
      ["mount", "Horses"],
      ["cloak", "Cloaks"],
    ],
    [qok, qwhy] = A.qualAvail(pc, UI.shopQ);
  h += `<div class="group-h">The armorer</div><div class="card shop"><div class="row wrap"><div class="seg" role="group" aria-label="Kind">${slots.map(([k, n]) => `<button class="small ${UI.shopSlot === k ? "on" : ""}" aria-pressed="${UI.shopSlot === k}" data-a="shopSlot" data-v="${k}">${n}</button>`).join("")}</div></div>
    <div class="row wrap" style="margin-top:6px"><span class="tiny muted">Quality</span><div class="seg" role="group" aria-label="Quality">${Object.entries(
      GD.QUAL,
    )
      .map(
        ([k, Q2]) =>
          `<button class="small ${UI.shopQ === k ? "on" : ""}" aria-pressed="${UI.shopQ === k}" data-a="shopQ" data-v="${k}" title="${UI.esc(Q2.d)}">${UI.esc(Q2.n)}</button>`,
      )
      .join(
        "",
      )}</div><span class="tiny ${qok ? "muted" : "bad"} grow">${UI.esc(qok ? GD.QUAL[UI.shopQ].d + (qwhy ? " " + qwhy + "." : "") : qwhy)}</span></div>
    <div class="tscroll"><table class="t shop-t"><tr><th>Item</th><th>What it does</th><th>Price</th><th></th></tr>`;
  const Q = GD.QUAL[UI.shopQ],
    items = GD.SHOP.filter(k => GD.GEAR[k] && GD.GEAR[k].slot === UI.shopSlot).sort(
      (a, b) => GD.GEAR[a].price - GD.GEAR[b].price,
    );
  for (const k of items) {
    const g = GD.GEAR[k],
      [ok, why] = A.gearAvailable(pc, k);
    if (!ok && /giant|never/.test(why)) continue;
    const mOnly = g.masterOnly && UI.shopQ !== "master",
      price = A.gearPrice(k, UI.shopQ, home),
      stat = g.dmg
        ? `dmg ${Math.round(g.dmg * Q.dmg * 10) / 10}${g.pierce || Q.pierce ? " · pierce " + ((g.pierce || 0) + (Q.pierce || 0)) : ""}${g.reach ? " · reach " + g.reach : ""}${g.twoHand ? " · two hands" : ""}`
        : g.prot != null
          ? `prot ${Math.round(g.prot * Q.prot * 10) / 10}${g.weight ? " · weight " + g.weight : ""}`
          : g.def
            ? `def ${g.def}`
            : g.ride != null
              ? `ride ${g.ride}${g.war ? " · war-trained" : ""}`
              : "",
      have = pc.gear[g.slot] === k && A.qualOf(pc, g.slot) === UI.shopQ;
    h += `<tr><td>${UI.esc(g.name)}${g.masterOnly ? ' <span class="chip qual q-master">master only</span>' : ""}</td><td class="small">${stat}</td><td>${A.coin(price)}</td><td><button class="small" data-a="buyGearQ" data-v="${k}" ${ok && qok && !mOnly && pc.coin >= price && !have ? "" : "disabled"} title="${UI.esc(ok ? (mOnly ? "Only a master armorer makes this" : have ? "You have it" : pc.coin < price ? "Not enough coin" : "Buy (your old one is sold for a third of its worth)") : why)}">${have ? "Owned" : "Buy"}</button></td></tr>`;
  }
  if (
    ((h +=
      '</table></div><div class="tiny muted">Prices follow the price of iron, steel and horses in your market. Your old piece is sold back at about a third of its value.</div></div>'),
    hr)
  ) {
    const m = A.mkt(home),
      cap = A.carryCap(pc),
      load = A.cargoLoad(pc);
    // [X1 baked patch economy/66-markets MT-MARKET-HERE] Each realm now has several market towns, each with its own
    // stock and price. The market card named the realm's capital and rated each good (cheap, fair, dear) by the
    // realm's price; it now names the town the player trades at and rates the price there. Without 66-markets (or
    // before its first month) both read as before.
    h += `<div class="group-h">The market of ${UI.esc(A.MT && A.MT.on() ? A.MT.name(A.MT.here(pc)) : hr.capital)}</div><div class="card mkt"><div class="row"><span class="small">Carrying <b>${load}</b> / ${cap} loads</span><span class="grow"></span>${Object.entries(
      GD.TRANSPORT,
    )
      .filter(([k, T]) => T.price)
      .map(([k, T]) =>
        (pc.transport || []).includes(k)
          ? `<span class="chip gold">${UI.esc(T.name)}</span>`
          : `<button class="small" data-a="buyTransport" data-v="${k}" ${pc.coin >= T.price ? "" : "disabled"} title="${UI.esc(T.d + " " + A.coin(T.price))}">${UI.esc(T.name)} (${A.coin(T.price)})</button>`,
      )
      .join("")}</div>
      <div class="tscroll"><table class="t mkt-t"><tr><th>Goods</th><th>Buy</th><th>Sell</th><th class="hide-s">Here</th><th>Yours</th><th></th></tr>`;
    for (const k of Object.keys(GD.GOODS).sort((a, b) => GD.GOODS[a].base - GD.GOODS[b].base)) {
      // [X1 baked patch economy/66-markets MT-MARKET-HERE] Each realm now has several market towns, each with its own
      // stock and price. The market card named the realm's capital and rated each good (cheap, fair, dear) by the
      // realm's price; it now names the town the player trades at and rates the price there. Without 66-markets (or
      // before its first month) both read as before.
      const G = GD.GOODS[k],
        b = A.buyPrice(home, k),
        s = A.sellPrice(home, k),
        rel = (A.MT && A.MT.on() ? A.MT.price(home, k, pc) : m.p[k]) / G.base,
        tag = m.ex.includes(k)
          ? '<span class="chip green">made here</span>'
          : m.im.includes(k)
            ? '<span class="chip red">imported</span>'
            : "",
        mine = A.cargo(pc)[k] || 0;
      // [X1 baked patch economy/45-economy ECON-MARKET-WHY] The market table said only cheap, fair or dear. It now adds
      // the stock in words (famine, scarce, short, ample, glut) and, on hover, why: months of need in store, what was
      // made and used last month, the harvest, armies at war, caravans in and out.
      h += `<tr><td>${UI.esc(G.name)} ${tag}</td><td>${A.coin(Math.round(b))}</td><td>${A.coin(Math.round(s))}</td><td class="${rel < 0.85 ? "good" : rel > 1.2 ? "bad" : "muted"} small hide-s" title="${UI.esc(A.ECON ? A.ECON.why(home, k) : "")}">${rel < 0.85 ? "cheap" : rel > 1.2 ? "dear" : "fair"}${A.ECON && m.s ? `<span class="tiny"> · ${UI.esc(A.ECON.word(m, k))}</span>` : ""}</td><td>${mine || ""}</td><td class="nowrap"><button class="small" data-a="mktBuy" data-v="${k}|1" ${pc.coin >= b && load < cap ? "" : "disabled"}>+1</button><button class="small" data-a="mktBuy" data-v="${k}|5" ${pc.coin >= b * 5 && load + 5 <= cap ? "" : "disabled"}>+5</button>${mine ? `<button class="small" data-a="mktSell" data-v="${k}">Sell all</button>` : ""}</td></tr>`;
    }
    // [X1 baked patch economy/45-economy ECON-MARKET-WHY] The market table said only cheap, fair or dear. It now adds
    // the stock in words (famine, scarce, short, ample, glut) and, on hover, why: months of need in store, what was
    // made and used last month, the harvest, armies at war, caravans in and out.
    h +=
      "</table></div>" +
      (A.ECON ? A.ECON.card(home) : "") +
      '<div class="tiny muted">A load is what a mule carries. Buying pushes the price up and selling pushes it down — a market only swallows so much. A trade skill and a good factor narrow the gap between buying and selling.</div></div>';
    const runs = A.bestRuns(pc);
    h +=
      '<div class="group-h">The trade roads</div><div class="card runs"><div class="tscroll"><table class="t"><tr><th>To</th><th>Best cargo</th><th>Margin</th><th>Days</th><th>Danger</th><th></th></tr>';
    for (const x of runs)
      h += `<tr class="${UI.run.dest === x.id ? "sel" : ""}"><td>${UI.esc(A.realmShort(x.id))}${x.embargo ? ' <span class="chip red">embargo</span>' : ""}</td><td>${UI.esc(GD.GOODS[x.k].name)}</td><td class="${x.m > 0.3 ? "good" : x.m < 0.05 ? "bad" : ""}">${Math.round(x.m * 100)}%</td><td>${x.days}</td><td>${Math.round(x.risk * 100)}%</td><td><button class="small" data-a="runDest" data-v="${x.id}">Plan</button></td></tr>`;
    h += "</table></div>";
    const P = UI.run.dest
      ? A.runPlan(UI.run.dest, {
          guards: UI.run.guards,
        })
      : null;
    if (P)
      h += `<div class="run-plan"><div class="row"><b class="grow">To ${UI.esc(A.realm(P.dest).capital)}, ${UI.esc(A.realmShort(P.dest))}</b><span class="tiny muted">${P.km} km · ${P.days} days${P.sea ? " by sea" : " by road"}</span></div>
        ${P.lines.length ? `<table class="t small"><tr><th>Cargo</th><th>Loads</th><th>Worth here</th><th>Worth there</th></tr>${P.lines.map(l => `<tr><td>${UI.esc(GD.GOODS[l.k].name)}</td><td>${l.n}</td><td>${A.coin(Math.round(l.home))}</td><td class="${l.there > l.home ? "good" : "bad"}">${A.coin(Math.round(l.there))}</td></tr>`).join("")}</table>` : '<div class="small muted">You carry nothing yet. Buy cheap here first.</div>'}
        <div class="kv small"><div>Sale, roughly</div><div>${A.coin(P.sale)} (cargo worth ${A.coin(P.value)} here)</div><div>Tolls</div><div>${Math.round(P.toll * 100)}%${P.embargo ? ' <span class="bad">— embargo: fines likely</span>' : ""}</div><div>Danger on the road</div><div>${Math.round(P.risk * 100)}%${UI.run.guards ? " with guards" : ""}</div><div>Guards</div><div><label class="row" style="gap:6px"><input type="checkbox" data-c="runGuards" ${UI.run.guards ? "checked" : ""}> hire guards (${A.coin(P.guardCost || Math.round(12 + P.days * 0.8 + P.value * 0.02))})</label></div><div>Bring back</div><div><select data-c="runBuyBack" aria-label="Goods to bring back"><option value="">nothing</option>${Object.keys(
          GD.GOODS,
        )
          .map(
            k =>
              `<option value="${k}" ${UI.run.buyBack === k ? "selected" : ""}>${UI.esc(GD.GOODS[k].name)} (${A.coin(Math.round(A.buyPrice(P.dest, k)))} there, ${A.coin(Math.round(A.sellPrice(home, k)))} here)</option>`,
          )
          .join(
            "",
          )}</select></div><div>Net, if all goes well</div><div><b class="${P.net > P.value ? "good" : "bad"}">${A.coin(P.net)}</b></div></div>
        <div class="row" style="margin-top:6px"><button class="primary small" data-a="runGo" ${A.S.time >= P.ini && !P.hostile ? "" : "disabled"}>Set out (${P.ini}⧗)</button>${P.hostile ? '<span class="bad small">At war with them.</span>' : ""}<button class="small ghost" data-a="runDest" data-v="">Close</button></div></div>`;
    h += "</div>";
    if (A.staffSlots(pc).some(s => s.type === "factor" || s.type === "steward" || s.type === "castellan"))
      h += UI.staffCard(pc, ["factor", "steward", "castellan"]);
  }
  h += '<div class="group-h">Property</div>';
  pc.assets.forEach((a, i) => {
    const P = GD.PROPERTY[a.k];
    h += `<div class="card small row"><b>${UI.esc(a.name)}</b><span class="muted">${UI.esc(a.where || "")} · income ~${A.coin((P && P.income) || 0)} · upkeep ${A.coin(P ? P.upkeep : 0)}</span><span class="right"></span><button class="small" data-a="sellProp" data-v="${i}">Sell</button></div>`;
  });
  h +=
    '<div class="tscroll"><table class="t"><tr><th>Buy</th><th>Income</th><th>Upkeep</th><th>Price</th><th></th></tr>';
  for (const k in GD.PROPERTY) {
    const P = GD.PROPERTY[k];
    h += `<tr><td>${UI.esc(P.name)}</td><td>${P.income ? A.coin(P.income) : "—"}</td><td>${A.coin(P.upkeep)}</td><td>${A.coin(P.price)}</td><td><button class="small" data-a="buyProp" data-v="${k}" ${pc.coin >= P.price ? "" : "disabled"}>Buy</button></td></tr>`;
  }
  return h + "</table></div>";
};

Object.assign(UI.A, {
  shopSlot(v) {
    UI.shopSlot = v;
    UI.refreshTab();
  },
  shopQ(v) {
    UI.shopQ = v;
    UI.refreshTab();
  },
  buyGearQ(v) {
    const r = A.buyGearQ(v, UI.shopQ);
    UI.toast(r.msg || "");
    UI.refresh();
  },
  mktBuy(v) {
    const [k, n] = v.split("|"),
      r = A.buyGood(k, +n);
    UI.toast(r.msg || "");
    UI.refresh();
  },
  mktSell(v) {
    const r = A.sellGood(v, 9999);
    UI.toast(r.msg || "");
    UI.refresh();
  },
  buyTransport(v) {
    const r = A.buyTransport(v);
    UI.toast(r.msg || "");
    UI.refresh();
  },
  runDest(v) {
    UI.run.dest = v || null;
    UI.refreshTab();
  },
  runGo() {
    const r = A.tradeRun(UI.run.dest, {
      guards: UI.run.guards,
      buyBack: UI.run.buyBack || null,
    });
    UI.toast(r.msg ? (r.msg.length > 170 ? r.msg.slice(0, 167) + "…" : r.msg) : "");
    if (r.ok) UI.run.dest = null;
    UI.refresh();
  },
});

Object.assign(UI.C, {
  runGuards(el) {
    UI.run.guards = el.checked;
    UI.refreshTab();
  },
  runBuyBack(el) {
    UI.run.buyBack = el.value;
  },
});

UI.TAB.codex = function (pc) {
  let h = UI.codexBasic(pc);
  if (
    ((h = h.replace(
      '<div class="row" style="margin-bottom:8px">',
      `<div class="row" style="margin-bottom:8px"><button class="small ${UI.codex === "power" ? "primary" : ""}" data-a="codex" data-v="power">Power &amp; scale</button>`,
    )),
    UI.codex === "power" && (h += UI.powerPage(pc)),
    UI.codex === "beasts")
  ) {
    const i = h.indexOf('<div class="card"><b>' + UI.esc(LORE.creatures[0].name)),
      head = i >= 0 ? h.slice(0, i) : h,
      order = ["animal", "great", "titan", "legend"];
    let b = "";
    for (const tier of order) {
      const list = LORE.creatures.filter(
        c =>
          (GD.BEAST_TIER[c.id] ||
            (/hoax|misunderstanding/i.test(c.cat) ? "legend" : A.BEASTS[c.id] ? A.beastTier(c.id) : null)) === tier,
      );
      if (!list.length) continue;
      const I = GD.TIER_INFO[tier];
      b +=
        `<div class="group-h">${UI.esc(I.name)}s</div><p class="tiny muted" style="margin-top:-4px">${UI.esc(I.who)}</p>` +
        list
          .map(
            c =>
              `<div class="card beast-c"><b>${UI.esc(c.name)}</b> <span class="tag">${UI.esc(c.cat)}</span>${GD.BEAST_FLYER[c.id] ? ' <span class="chip">flies — needs bows or spears</span>' : ""}<div class="small muted">${UI.esc(c.habitat)} · ${UI.esc(c.size)}</div><div class="small"><b>Believed:</b> ${UI.esc(c.belief)}</div><div class="small"><b>True:</b> ${UI.esc(c.truth)}</div>${c.weak && c.weak !== "–" ? `<div class="small"><b>Weak points:</b> ${UI.esc(c.weak)}</div>` : ""}</div>`,
          )
          .join("");
    }
    const rest = LORE.creatures.filter(
      c => !(GD.BEAST_TIER[c.id] || /hoax|misunderstanding/i.test(c.cat) || A.BEASTS[c.id]),
    );
    if (rest.length)
      b +=
        '<div class="group-h">Other creatures</div>' +
        rest
          .map(
            c =>
              `<div class="card beast-c"><b>${UI.esc(c.name)}</b> <span class="tag">${UI.esc(c.cat)}</span><div class="small muted">${UI.esc(c.habitat)} · ${UI.esc(c.size)}</div><div class="small"><b>True:</b> ${UI.esc(c.truth)}</div></div>`,
          )
          .join("");
    h = head + b;
  }
  return h;
};

UI.powerPage = function (pc) {
  let h = '<div class="power">';
  for (const x of A.POWER_CODEX)
    h += `<div class="card"><h4 style="margin:0 0 4px">${UI.esc(x.h)}</h4><div class="small ink2">${UI.esc(x.t)}</div></div>`;
  const me = A.fightWorth(pc);
  h += `<div class="group-h">The ladder of fighters</div><table class="t small"><tr><th>Tier</th><th>Worth</th><th>Who</th></tr>${GD.TIERS.map((t, i) => `<tr class="${A.tierOf(me) === t ? "sel" : ""}"><td><span class="chip tier ${t.k}">${UI.esc(t.n)}</span></td><td>${t.min}${GD.TIERS[i + 1] ? "–" + (GD.TIERS[i + 1].min - 1) : "+"}</td><td>${UI.esc(t.d)}${A.tierOf(me) === t ? ' <b class="gold-t">— you are here (' + me + ")</b>" : ""}</td></tr>`).join("")}</table>
    <div class="tiny muted">A tier up wins about three fights in four; two tiers up, about nine in ten. Armor, a shield and the right weapon move you up a tier on their own.</div>`;
  {
    const band = [
        ["Trained", 50, 60],
        ["Veteran", 63, 74],
        ["Elite", 77, 88],
        ["Master", 91, 115],
        ["Legend", 118, 140],
      ],
      staFor = R2 => Math.max(0, Math.round(Math.log(R2 / 0.672) / 0.054 / 5) * 5),
      rng = (a, b) => {
        const f = v => (v < 3 ? (Math.round(v * 2) / 2).toString() : String(Math.round(v)));
        return f(a) === f(b) ? f(a) : f(a) + "–" + f(b);
      };
    h += `<div class="group-h">One against many</div><div class="tscroll"><table class="t small"><tr><th>Tier</th><th>Regulars at once</th><th>Veterans at once</th><th>Stamina to keep it up</th></tr>${band
      .map(([n, lo, hi]) => {
        const a = A.strengthOf(lo),
          b = A.strengthOf(hi);
        return `<tr><td><span class="chip tier ${GD.TIERS.find(x => x.n === n).k}">${UI.esc(n)}</span></td><td>${rng(a, b)}</td><td>${b / A.vetS() >= 1 ? rng(a / A.vetS(), b / A.vetS()) : "—"}</td><td>${b > 3 ? staFor(b) + "+" : "—"}</td></tr>`;
      })
      .join("")}</table></div>
      <div class="small" style="margin-top:4px"><b>You:</b> ${UI.takeLine(pc)}</div>
      <div class="tiny muted">"Can take 8" means 8 at once is a coin toss, 4 is a likely win and 16 is a grave. Steel at arm's length in the open: a doorway or a bridge helps the one, bows help the many.</div>`;
  }
  h += `<div class="group-h">Beasts by scale</div><table class="t small"><tr><th>Scale</th><th>What it takes</th><th>Examples</th></tr>${[
    "animal",
    "great",
    "titan",
    "legend",
  ]
    .map(
      t =>
        `<tr><td><b>${UI.esc(GD.TIER_INFO[t].name)}</b></td><td>${UI.esc(GD.TIER_INFO[t].who)}</td><td>${UI.esc(
          Object.keys(GD.BEAST_TIER)
            .filter(id => GD.BEAST_TIER[id] === t)
            .slice(0, 5)
            .map(A.beastName)
            .join(", "),
        )}</td></tr>`,
    )
    .join("")}</table>`;
  h += UI.ordersCard(pc, false);
  return h + "</div>";
};

UI.COMP_COL = {
  foot: "#b39a6c",
  missile: "#5f9e48",
  horse: "#4a80c4",
  beast: "#a9508a",
};

UI.COMP_NAME = {
  foot: "Foot",
  missile: "Archers",
  horse: "Horse",
  beast: "Beasts & giants",
};

UI.realmCode = function (rid) {
  const S = A.S;
  if (!S) return "";
  if (!UI._codes || UI._codesN !== Object.keys(S.realms).length) {
    UI._codes = {};
    UI._codesN = Object.keys(S.realms).length;
    const used = new Set();
    for (const id of Object.keys(S.realms).sort()) {
      const n = (S.realms[id].short || id)
        .replace(/^(the|al|el|le|la)\s+/i, "")
        .replace(/[^A-Za-z]/g, "")
        .toUpperCase();
      let c = n.slice(0, 3);
      if (used.has(c)) {
        const cons = n.slice(1).replace(/[AEIOU]/g, "");
        for (let i = 0; i < cons.length && used.has(c); i++) c = n[0] + cons.slice(i, i + 2);
      }
      if (used.has(c)) c = n.slice(0, 2) + String(used.size % 10);
      used.add(c);
      UI._codes[id] = c;
    }
  }
  return UI._codes[rid] || "";
};

UI.divCats = d => A.divS(d).cats || {};

UI.wrComp = function (u) {
  const c = {
    foot: 0,
    missile: 0,
    horse: 0,
    beast: 0,
  };
  for (const d of u) {
    const k = UI.divCats(d);
    for (const x in c) c[x] += (k[x] || 0) * (d.men / Math.max(1, A.divS(d).men));
  }
  const t = Object.values(c).reduce((a, b) => a + b, 0) || 1;
  for (const x in c) c[x] /= t;
  return c;
};

UI.compStrip = function (c, wide) {
  const parts = Object.entries(c).filter(([, v]) => v > 0.001);
  return `<div class="comp ${wide ? "wide" : ""}" title="${UI.esc(parts.map(([k, v]) => `${UI.COMP_NAME[k]} ${Math.round(v * 100)}%`).join(" · "))}">${parts.map(([k, v]) => `<i style="width:${(v * 100).toFixed(1)}%;background:${UI.COMP_COL[k]}"></i>`).join("")}</div>`;
};

UI.lumOf = function (hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return 0.5;
  const n = parseInt(m[1], 16),
    f = v => ((v /= 255), v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
};

UI.wrCounter = function (ctx, x, y, K, o) {
  const w = 50 * K,
    h = 25 * K,
    bw = 18 * K,
    foot = 10 * K,
    L = x - w / 2,
    T = y - h / 2,
    rr = (X, Y, W, H, R2) => {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(X, Y, W, H, R2);
      else ctx.rect(X, Y, W, H);
    };
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(0,0,0,.45)";
  rr(L + 1.6 * K, T + 2.2 * K, w, h + foot, 3 * K);
  ctx.fill();
  ctx.fillStyle = "#f2e7cc";
  rr(L, T, w, h + foot, 3 * K);
  ctx.fill();
  ctx.save();
  rr(L, T, w, h + foot, 3 * K);
  ctx.clip();
  ctx.fillStyle = o.color;
  ctx.beginPath();
  ctx.moveTo(L, T);
  ctx.lineTo(L + bw, T);
  ctx.lineTo(L + bw, T + h);
  ctx.lineTo(L + bw * 0.5, T + h - 4 * K);
  ctx.lineTo(L, T + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(27,20,11,.85)";
  ctx.lineWidth = 1 * K;
  ctx.beginPath();
  ctx.moveTo(L + bw + 0.5 * K, T);
  ctx.lineTo(L + bw + 0.5 * K, T + h);
  ctx.stroke();
  ctx.restore();
  const ink = UI.lumOf(o.color) > 0.36 ? "#1b140b" : "#f7efda";
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.3 * K;
  const gx = L + 3 * K,
    gy = T + 4 * K,
    gw = bw - 6 * K,
    gh = h - 11 * K;
  ctx.strokeRect(gx, gy, gw, gh);
  ctx.beginPath();
  if (o.cat === "horse") {
    ctx.moveTo(gx, gy + gh);
    ctx.lineTo(gx + gw, gy);
  } else {
    if (o.cat === "missile") {
      ctx.moveTo(gx + gw * 0.3, gy + 1);
      ctx.quadraticCurveTo(gx + gw * 0.78, gy + gh / 2, gx + gw * 0.3, gy + gh - 1);
      ctx.moveTo(gx + gw * 0.12, gy + gh / 2);
      ctx.lineTo(gx + gw * 0.88, gy + gh / 2);
    } else {
      if (o.cat === "beast") ctx.arc(gx + gw / 2, gy + gh / 2, gh * 0.32, 0, Math.PI * 2);
      else {
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + gw, gy + gh);
        ctx.moveTo(gx, gy + gh);
        ctx.lineTo(gx + gw, gy);
      }
    }
  }
  ctx.stroke();
  const cx = L + bw + (w - bw) / 2;
  if (o.code) {
    ctx.fillStyle = "#6a5233";
    ctx.font = `700 ${Math.round(7.2 * K)}px Cinzel, Georgia, serif`;
    ctx.fillText(o.code, cx, T + 6.6 * K);
  }
  ctx.fillStyle = "#1b140b";
  ctx.font = `800 ${Math.round(12.5 * K)}px system-ui, sans-serif`;
  ctx.fillText(o.label, cx, T + (o.code ? 16.6 : 13) * K);
  const by = T + h;
  if (((ctx.fillStyle = "#2b2218"), ctx.fillRect(L, by, w, foot), o.comp)) {
    let cx2 = L;
    for (const k of ["foot", "missile", "horse", "beast"]) {
      const v = o.comp[k] || 0;
      if (!(v <= 0)) {
        ctx.fillStyle = UI.COMP_COL[k];
        ctx.fillRect(cx2, by + 0.6 * K, w * v, 3 * K);
        cx2 += w * v;
      }
    }
  }
  ctx.fillStyle = "#56b04e";
  ctx.fillRect(L, by + 4.2 * K, w * A.clamp(o.org, 0, 1), 2.6 * K);
  ctx.fillStyle = "#e09a2c";
  ctx.fillRect(L, by + 7.2 * K, w * A.clamp(o.str, 0, 1), 2.2 * K);
  const edge = o.sel
    ? "#ffffff"
    : o.mine
      ? "#f0c247"
      : o.side === "foe"
        ? "#e0533e"
        : o.side === "ally"
          ? "#5d9de0"
          : "#2b2218";
  if (
    ((ctx.lineWidth = o.sel ? 3 * K : o.mine || o.side === "foe" || o.side === "ally" ? 2.2 * K : 1.2 * K),
    (ctx.strokeStyle = edge),
    rr(L, T, w, h + foot, 3 * K),
    ctx.stroke(),
    o.sel &&
      ((ctx.lineWidth = 1 * K),
      (ctx.strokeStyle = "rgba(0,0,0,.8)"),
      rr(L - 2.2 * K, T - 2.2 * K, w + 4.4 * K, h + foot + 4.4 * K, 4 * K),
      ctx.stroke()),
    o.elite)
  ) {
    const sx = L + 1 * K,
      sy = T + 1 * K,
      R2 = 6 * K;
    ctx.fillStyle = "#1b140b";
    ctx.beginPath();
    ctx.arc(sx, sy, R2 + 1.2 * K, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0c247";
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5,
        r = i % 2 ? R2 * 0.45 : R2;
      ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  }
  let fx = L + w + 3 * K;
  const flag = (txt, col) => {
    ctx.fillStyle = "#1b140b";
    ctx.beginPath();
    ctx.arc(fx + 5.5 * K, T + 5.5 * K, 6.3 * K, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(fx + 5.5 * K, T + 5.5 * K, 5.2 * K, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1b140b";
    ctx.font = `800 ${Math.round(7.5 * K)}px system-ui`;
    ctx.fillText(txt, fx + 5.5 * K, T + 5.9 * K);
    fx += 13 * K;
  };
  if (o.atk) flag("!", "#e0533e");
  if (o.hungry) flag("S", "#e6b75d");
  if (o.siege) flag("W", "#d9b45f");
  if (o.you) {
    ctx.font = `800 ${Math.round(9 * K)}px system-ui`;
    ctx.textBaseline = "alphabetic";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeText("▼ YOU", x, T - 3.5 * K);
    ctx.fillStyle = "#f0c247";
    ctx.fillText("▼ YOU", x, T - 3.5 * K);
  }
  ctx.restore();
  return {
    w,
    h: h + foot,
  };
};

UI.wrLegend = function () {
  const sw = (c, n) => `<span><i style="background:${c}"></i>${n}</span>`;
  return `<span class="leg-h">Edge:</span>${sw("#f0c247", "yours")}${sw("#5d9de0", "allies")}${sw("#e0533e", "enemies")}<span class="leg-h">Strip:</span>${Object.keys(
    UI.COMP_COL,
  )
    .map(k => sw(UI.COMP_COL[k], UI.COMP_NAME[k]))
    .join(
      "",
    )}<span class="leg-h">Bars:</span>${sw("#56b04e", "organization")}${sw("#e09a2c", "strength")}<span><b class="gold-t">★</b> elite order or guard</span><span class="tiny muted">Banner = realm (3-letter code above the number). Number = divisions in the stack, or men for one division.</span>`;
};

UI.wrBars = function (d) {
  return UI.wrBarsBasic(d) + UI.compStrip(UI.wrComp([d]));
};

UI.bnGrid = function (bns, color) {
  const c = {};
  for (const b of bns) c[b] = (c[b] || 0) + 1;
  const cat = b => {
    const T = GD.TROOPS[b] || {};
    return T.mount
      ? "horse"
      : (T.missile || 0) > (T.melee || 0)
        ? "missile"
        : ["EL", "GI"].includes(b)
          ? "beast"
          : "foot";
  };
  return `<div class="bn-grid">${Object.entries(c)
    .map(
      ([b, n]) =>
        `<div class="bn-g" title="${UI.esc((GD.TROOPS[b] || {}).name || b)}"><div class="bn-tiles">${Array.from(
          {
            length: n,
          },
          () => UI.unitSym(cat(b), 0, color, 22),
        ).join("")}</div><div class="tiny">${n}× ${UI.esc((GD.TROOPS[b] || {}).name || b)}</div></div>`,
    )
    .join("")}</div>`;
};

UI.wrDivPanel = function (ids, R2) {
  let h = UI.wrDivPanelBasic(ids, R2);
  const ds = ids.map(A.divById).filter(Boolean);
  if (ds.length === 1) {
    const d = ds[0],
      t = A.tplOf(d),
      r = A.realm(d.r),
      intel = !A.hostile(UI.wrMyR(A.pc()), d.r) || UI.wrIntel(d);
    let add = "";
    if (d.elite && GD.ORDERS[d.elite]) {
      const O = GD.ORDERS[d.elite],
        Lp = r && r.orders ? A.P(r.orders[d.elite]) : null;
      add += `<div class="elite-ban"><b>★ ${UI.esc(A.cap(O.name))}</b><div class="tiny">${UI.esc(O.spec)}${Lp ? ` Led by ${UI.esc(A.fullName(Lp, false))} (${UI.esc(A.tierOf(A.fightWorth(Lp)).n)}).` : ""}</div></div>`;
    }
    if (intel && t)
      add += `<div class="group-h">Composition</div>${UI.compStrip(UI.wrComp([d]), true)}${UI.bnGrid(t.bns, r ? r.color : "#999")}`;
    const i = h.indexOf('<div class="tiny muted wr-comp">');
    h = i >= 0 ? h.slice(0, i) + add + h.slice(i) : h.replace(/<\/div>$/, add + "</div>");
  } else if (ds.length > 1) {
    const c = UI.wrComp(ds);
    h = h.replace(
      /(<div class="card wr-div"><div class="row"><b>[^<]*<\/b><span class="right tiny muted">[^<]*<\/span><\/div>)/,
      `$1${UI.compStrip(c, true)}<div class="tiny muted">${Object.entries(c)
        .filter(([, v]) => v > 0.005)
        .map(([k, v]) => `${UI.COMP_NAME[k]} ${Math.round(v * 100)}%`)
        .join(" · ")}</div>`,
    );
  }
  return h;
};

UI.duelModal = function (D) {
  let h = UI.duelModalTech(D);
  const pc = A.pc(),
    mine = `<div class="fname">${UI.esc(A.fullName(pc, false))}</div>`;
  h = h.replace(mine, mine + `<div>${UI.tierChip(pc)}</div>`);
  const theirs = `<div class="fname">${UI.esc(D.b.name)}</div>`;
  if (D.b.beast) {
    const tier = A.beastTier(D.b.beast),
      I = GD.TIER_INFO[tier];
    h = h.replace(
      theirs,
      theirs +
        `<div><span class="chip tier ${tier === "animal" ? "t2" : tier === "great" ? "t5" : "t6"}" title="${UI.esc(I.who)}">${UI.esc(I.name)}</span>${D.party ? ` <span class="chip gold">${D.party.n} hunters with you</span>` : ""}</div>`,
    );
  } else {
    const foe = D.b.pid ? A.P(D.b.pid) : null;
    if (foe) h = h.replace(theirs, theirs + `<div>${UI.tierChip(foe)}</div>`);
  }
  return h;
};

UI.helpModal = function () {
  const P = t => `<p>${t}</p>`,
    add =
      P(
        "<b>People you choose.</b> You do not know everyone you serve with. The People page (under Family) shows who is <i>around you</i> — above you, under you, beside you — by name and post. Getting to know someone costs an evening (1⧗) and is your choice; bonds you never tend fade back to acquaintances, and nobody keeps more close friends than they have evenings for. Every face has a full profile: who they are, what they do, what they can do, and whether they would beat you in a fight.",
      ) +
      P(
        "<b>Strength you can read.</b> Every fighter has a tier — Untrained, Brawler, Trained, Veteran, Elite, Master, Legend — from body, skill and steel. A tier up wins about three fights in four. An Elite can take 7–10 regular soldiers at once, a Master 20–30, a Legend 50–100 — if the body keeps up. Beasts come in scales: animals one person can fight, great beasts that need a hunting party, titans that need an expedition, and legends that are only stories. The Codex page <i>Power &amp; scale</i> explains it all.",
      ) +
      P(
        "<b>Your staff and your drill.</b> Lead men and you choose who stands under you — sergeants, a lieutenant, a sergeant-major, a chief of staff, the commander of every division — or delegate the choice to the officer above that post. Their skill is what the post does. The drill yard sets what your men practice and how hard; the edge you build shows in battle.",
      ) +
      P(
        "<b>The orders.</b> Eight realms keep an elite order: the Knights of the Iron Wolf, the Knights of the Sun, the Greyfeathers, the Shadow Guard, the Last Door, the Stormriders, the Tenth Wind and the Gold Masks. Each is only 200 to 300 strong, because no kingdom has more people good enough, and each fights best on its own ground. Their stories are in the Arms page and the Codex. Prove yourself and you may be asked to join. On the map they carry a gold star.",
      ) +
      P(
        "<b>Markets.</b> Every realm's capital has a market. Goods are cheap where they are made and dear where they are bought in; war, seasons, embargoes and trade pacts move prices. Buy a cart or a wagon, plan a run, hire guards. The armorer sells crude, common, fine and (where a master works) masterwork arms and armor.",
      ) +
      P(
        "<b>Your family.</b> No points pass between lives. An heir gets what a real heir gets: a share of the purse and land by custom, your arms and armor, titles where the law allows, the name you made, your friends and enemies — and whatever you took the time to teach them (the Dynasty page, under Family).",
      );
  return UI.helpModalBasic().replace(/<\/div><\/div>\s*$/, add + "</div></div>");
};

UI.errLog = [];

UI.noteError = function (err, where) {
  const e = {
    at: new Date().toISOString(),
    where: where || "",
    msg: String((err && err.message) || err).slice(0, 500),
    stack: String((err && err.stack) || "")
      .split(
        `
`,
      )
      .slice(0, 8).join(`
`),
    day: A.S ? `${A.S.year}/${A.S.warClock || 0}` : "",
    step: A.J ? A.J.e.length : 0,
  };
  UI.errLog.push(e);
  if (UI.errLog.length > 50) UI.errLog.shift();
};

UI.reportBundle = async function (note) {
  const pc = A.S && A.pc(),
    bundle = {
      kind: "ardan-report",
      v: 1,
      at: new Date().toISOString(),
      note: String(note || "").slice(0, 4e3),
      game: {
        saveVer: A.SAVE_VER,
        build: (typeof window < "u" && window.ARDAN_BUILD) || "dev",
        boot: (typeof window < "u" && window.ARDAN_BOOT) || null,
      },
      browser:
        typeof navigator < "u"
          ? {
              ua: navigator.userAgent,
              lang: navigator.language,
              w: window.innerWidth,
              h: window.innerHeight,
              dpr: window.devicePixelRatio,
            }
          : null,
      view: {
        screen: UI.screen,
        tab: UI.tab,
        ov: UI.ov ? UI.ov.type : null,
        queue: A.S ? A.S.queue.slice(0, 3).map(q => q.type + (q.ev ? ":" + q.ev : "")) : [],
      },
      settings: UI.set,
      errors: UI.errLog.slice(),
      pc: pc
        ? {
            name: A.fullName(pc),
            age: A.age(pc),
            alive: pc.alive,
          }
        : null,
      log: A.S ? A.S.log.slice(-40) : [],
      fingerprint: A.S ? A.fingerprint() : null,
      save: null,
      base: null,
    };
  if (A.S) {
    const { bytes } = await SAVES.encode(A.S, A.J);
    bundle.save = SAVES.b64.enc(bytes);
    if (A.J && !A.J.o && A.jBase) bundle.base = SAVES.b64.enc(await SAVES.gzip(A.jBase));
  }
  return SAVES.gzip(JSON.stringify(bundle));
};

UI.downloadReport = async function () {
  const el = UI.$("#reportNote");
  try {
    const bytes = await UI.reportBundle(el ? el.value : ""),
      d = new Date(),
      stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
    UI.download(bytes, `ardan_report_${stamp}.ardanreport`);
    UI.toast(`Report saved (${Math.round(bytes.length / 1024)} KB). Send the file along with what you saw.`, 5e3);
  } catch (e) {
    console.error(e);
    UI.toast("The report could not be made: " + e.message);
  }
};

UI.reportModal = function (close) {
  return `<div class="panel mbox">${close}<h2>Report a problem</h2>
    <p class="small">This makes one file with your save, a record of every choice you made this run, and any errors the game caught. With it, the exact run can be played again to find the problem. Nothing is sent anywhere: you download the file and send it yourself.</p>
    <label class="col small" for="reportNote">What happened? What did you expect?</label>
    <textarea id="reportNote" rows="5" maxlength="4000" style="width:100%"></textarea>
    <p class="tiny muted">${UI.errLog.length ? `${UI.errLog.length} error${UI.errLog.length === 1 ? "" : "s"} caught this session.` : "No errors caught this session."}${A.J ? ` The journal holds ${A.J.e.length} steps.` : ""}</p>
    <div class="row"><button class="primary" data-a="downloadReport">Download report</button><button data-a="closeOv">Cancel</button></div></div>`;
};

Object.assign(UI.A, {
  report() {
    UI.ov = {
      type: "report",
    };
    UI.renderModal();
  },
  downloadReport() {
    UI.downloadReport();
  },
});

if (typeof window < "u") {
  window.addEventListener("error", e => UI.noteError(e.error || e.message, "window"));
  window.addEventListener("unhandledrejection", e => UI.noteError(e.reason, "promise"));
}
