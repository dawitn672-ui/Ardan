// The ladder census (Road to Ten, Power 7). The lore says "perhaps five [of the top tier] alive in all of Ardan" and
// "one or two [of the next] in a realm; most realms have none". The top tier was capped already (GD.PEERLESS_CAP, 5); the
// next per realm now is too (GD.FORMIDABLE_CAP, 5, the plan's upper bound): an order raised in a full realm gets an
// Elite to lead it. A.ladderCensus counts the living, and the Codex's "Power & scale" page shows the living ladder: the
// Peerless fighters whose names have reached you, and your realm's Formidable fighters.
// O98 (D-203): the tiers t5 and t6 were "Master" and "Legend"; order 98 keeps "Legend" for the level 800-1000 legends
// and order 83 says Master and Legend are no measures, so they read Formidable and Peerless (the folder was
// 32-legend-and-master-caps; GD.LEGEND_CAP and GD.MASTER_CAP are renamed with them).
(function () {
  GD.FORMIDABLE_CAP = GD.FORMIDABLE_CAP || 5;
  const tierK = p => A.tierOf(A.fightWorth(p)).k;
  // every living named fighter at Formidable or Peerless, by realm; pure. With a realm id, only that realm's people are
  // weighed (step X7: A.ladderRoom asks about one realm, and weighing the whole world for each order raised was a
  // tenth of making a world)
  A.ladderCensus = function (rid) {
    const S = A.S, out = { peerless: [], formidable: {}, elites: 0 };
    if (!S) return out;
    for (const id in S.people) {
      const p = S.people[id];
      if (!p || !p.alive || !p.st || id === S.pc || (rid != null && p.realm !== rid)) continue;
      const k = tierK(p);
      if (k === 't6') out.peerless.push(id);
      else if (k === 't5') (out.formidable[p.realm] = out.formidable[p.realm] || []).push(id);
      else if (k === 't4') out.elites++;
    }
    return out;
  };
  A.ladderRoom = rid => ((A.ladderCensus(rid).formidable[rid] || []).length < GD.FORMIDABLE_CAP);
  // A.orderRaise makes every new order leader Formidable (worth 96-106). In a full realm, the new leader is brought down
  // to Elite by trimming weapon skills and quickness a step at a time (no dice), as a lesser captain would be.
  const raise = A.orderRaise;
  A.orderRaise = function (r, id) {
    const before = r && r.orders && r.orders[id], room = r ? A.ladderRoom(r.id) : true;
    const d = raise.apply(this, arguments);
    try {
      const L = d && A.P(d.cmd);
      if (L && !room && L.id !== before && A.fightWorth(L) >= 91) {
        const ws = Object.keys(L.skills).filter(k => ['melee', 'sword', 'axe', 'spear', 'lance', 'mounted', 'shield', 'bow', 'xbow', 'dagger', 'dualwield'].includes(k));
        for (let i = 0; i < 80 && A.fightWorth(L) >= 88; i++) {
          for (const k of ws) A.SK.put(L, k, Math.max(50, L.skills[k] - 2), 'the ladder has no room');
          for (const s of ['spd', 'ins', 'str', 'sta', 'wil']) L.st[s] = Math.max(40, L.st[s] - 1);
        }
      }
    } catch (e) { console.error('ladder', e); }
    return d;
  };

  // ---- entry by merit, where the order's own lore allows it ------------------------------------------------------
  // Read from each order's lore.join (data, not a list kept here):
  // - "a knighthood" (the Iron Wolf: "Gentle birth or a knighthood"): the birth line is met by a knighthood, which a
  //   commoner of renown can now earn from the crown (994-careers); the line says so.
  // - "deeds ... worthy" with an invitation (the Gold Masks: "the Rememberers' word that your deeds are worthy"): the
  //   invitation is met by deeds too, renown 60 and three deeds in the life's record.
  // A commoner with fighting worth 108 failed the Iron Wolf for birth alone and no life joined an order (cycle 1, I1).
  GD.ORDER_MERIT_FAME = 60;
  A.orderMerit = function (id) {
    const o = GD.ORDERS && GD.ORDERS[id], j = String(o && o.lore && o.lore.join || '');
    return { knight: /knighthood|knighted/i.test(j), deeds: !!(o && o.req && o.req.invite) && /\bdeeds\b[^.]*\bworthy\b/i.test(j) };
  };
  const reqs = A.orderReqs;
  if (typeof reqs === 'function') A.orderReqs = function (pc, id) {
    const out = reqs.apply(this, arguments);
    try {
      const m = A.orderMerit(id);
      for (const x of out) {
        if (m.knight && /^Gentle birth/.test(x.label)) x.label = 'Gentle birth, a title, or a knighthood (the crown knights commoners of renown)';
        if (m.deeds && /^Invited by the crown/.test(x.label)) {
          const ok = (pc.fame || 0) >= GD.ORDER_MERIT_FAME && (pc.deeds || []).length >= 3;
          x.label = `Invited by the crown (its opinion of you 50+), or deeds worthy of the order (renown ${GD.ORDER_MERIT_FAME}, three deeds)`;
          if (ok) { x.ok = true; x.have = 'deeds'; }
        }
      }
    } catch (e) { console.error('order merit', e); }
    return out;
  };

  const page = UI.powerPage;
  UI.powerPage = function (pc) {
    const h = page.apply(this, arguments), C = A.ladderCensus();
    const name = id => { const p = A.P(id), R = p && A.realm(p.realm); return p ? `${A.fullName(p, false)}${R ? ' of ' + R.short : ''}${p.occ ? ', ' + p.occ : ''}` : '?'; };
    // you know of a Peerless if their fame carries, or they are of your realm, or you know them
    const heard = id => { const p = A.P(id); return p && ((p.fame || 0) >= 40 || p.realm === pc.realm || (pc.rel && pc.rel[id])); };
    const known = C.peerless.filter(heard), mine = C.formidable[pc.realm] || [];
    let x = `<div class="group-h">The living ladder</div><p class="small ink2">Peerless fighters alive in Ardan: ${C.peerless.length} of a possible ${GD.PEERLESS_CAP || 5}. ` +
      `Formidable fighters in ${UI.esc(A.realmShort(pc.realm))}: ${mine.length} (no realm raises more than ${GD.FORMIDABLE_CAP}).</p>`;
    if (known.length) x += `<div class="small"><b>Peerless fighters whose names have reached you:</b> ${known.map(id => UI.esc(name(id))).join('; ')}.</div>`;
    if (C.peerless.length > known.length) x += `<div class="tiny muted">${C.peerless.length - known.length} more, whose names have not reached you.</div>`;
    if (mine.length) x += `<div class="small"><b>Formidable fighters of your realm:</b> ${mine.map(id => UI.esc(name(id))).join('; ')}.</div>`;
    const at = h.indexOf('<div class="group-h">Beasts by scale</div>');
    return at > 0 ? h.slice(0, at) + x + h.slice(at) : h + x;
  };
})();
