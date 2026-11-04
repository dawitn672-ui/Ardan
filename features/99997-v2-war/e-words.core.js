// 99997-v2-war, part 5: what each rank is told, and what an outsider hears (playtest round 1).
//   - the call to battle (A.wsPCFightStart) and 34-both-scales' reckoning give the numbers as your rank would know
//     them: estimates for a soldier or a sergeant ("about 60,000"), "some 16,500" for a captain; a commander knows his
//     own side exactly and the enemy's only as an estimate;
//   - 64-npc-beliefs' tavern tale of a battle ("You know how it went") comes only for a battle of a war you fought in;
//   - 57-world-chronicle's folk memories of a battle are told as hearsay, not as the count.
(function () {
  const W = A.V2W;
  if (!W) return;
  const num = s => +String(s).replace(/[^\d]/g, '');
  // a number as this rank knows it; mine: whether it is his own side's
  W.told = function (n, rank, mine) {
    rank = rank || W.rank() || 'soldier';
    if (rank === 'commander') return mine ? A.fmt(Math.round(n)) : W.estimate(n, 'soldier');
    return W.estimate(n, rank);
  };
  W.retell = function (text, rank) {
    if (typeof text !== 'string') return text;
    return text
      .replace(/([\d,]+) of yours against ([\d,]+) of theirs/g, (m, a, b) => `${W.told(num(a), rank, true)} of yours against ${W.told(num(b), rank, false)} of theirs`)
      .replace(/Dead: ([\d,]+) of yours, ([\d,]+) of theirs/g, (m, a, b) => `Dead: ${W.told(num(a), rank, true)} of yours, ${W.told(num(b), rank, false)} of theirs`)
      .replace(/: ([\d,]+) men\. /g, (m, a) => `: ${W.told(num(a), rank === 'commander' ? 'captain' : rank, false)} men. `);
  };
  const fs = A.wsPCFightStart;
  if (typeof fs === 'function') A.wsPCFightStart = function () {
    const n = A.S ? A.S.queue.length : 0;
    const r = fs.apply(this, arguments);
    try { for (let i = n; i < A.S.queue.length; i++) { const q = A.S.queue[i]; if (q && q.type === 'choice' && q.text) q.text = W.retell(q.text); } } catch (e) { console.error('v2 war words', e); }
    return r;
  };
  if (A.BS && typeof A.BS.context === 'function') {
    const bc = A.BS.context;
    A.BS.context = function () {
      const c = bc.apply(this, arguments);
      try { if (c && c.front) c.front = W.retell(c.front); } catch (e) {}
      return c;
    };
  }
  // the tavern tale: only of a battle of a war you fought in
  // (event packs load after the core: the event is wrapped when it is defined)
  const gateTale = function () {
  const ev = A.EV && A.EV.nb_battle_tale;
  if (ev && typeof ev.setup === 'function' && !ev.v2w) {
    ev.v2w = 1;
    const su = ev.setup;
    ev.setup = function (p, ctx) {
      const r = su.apply(this, arguments);
      try {
        if (!ctx.skip && A.WC && A.NPCB) {
          // the battle the tale is about: the newest false belief the setup chose (its record carries the war)
          const c = ctx.cid != null && A.NPCB.claim ? A.NPCB.claim(ctx.cid) : null;
          const e = c && A.WC.ent ? A.WC.ent(c.o) : null;
          const war = e && Array.isArray(e.x) ? e.x[2] : null;
          if (e ? !W.fought(war) : !W.inWar()) ctx.skip = 1;
        }
      } catch (er) { ctx.skip = 1; }
      return r;
    };
  }
  };
  gateTale();
  const de = A.defEvents;
  A.defEvents = function () { const r = de.apply(this, arguments); try { gateTale(); } catch (e) {} return r; };
  // folk memory of a battle is hearsay
  const L = A.WC && A.WC.LINES && A.WC.LINES.battle;
  if (Array.isArray(L)) {
    for (const row of L) {
      const f = row[1], src = String(f);
      if (/x\.dead\} men died/.test(src)) row[1] = x => `They say ${x.dead} men died at ${x.P} in ${x.y}; others say half that. People here still argue over whose fault it was.`;
      else if (/when \$\{x\.A\} beat \$\{x\.B\}/.test(src)) row[1] = x => `A man with a stiff arm says he got it at ${x.P} in ${x.y}, when, as he tells it, ${x.A} beat ${x.B}.`;
    }
  }
})();
