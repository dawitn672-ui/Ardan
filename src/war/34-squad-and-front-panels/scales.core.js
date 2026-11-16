// Both scales at once (signature system 3; Road to Ten, Uniqueness 4): "a nobody in a 200-division war who feels the
// squad and the front together". When a war-map fight you were in ends, a reckoning shows it three ways, side by side:
// what you saw (your wounds, your merit, the comrades who did not come back), the front (the divisions, the days, the
// dead, the tactics, and the after-action causes from 23), and what the chronicle will say (your realm's chronicler,
// who counts the enemy dead generously and your own sparingly). The three are allowed to disagree; that is the point.
//
// Engine: the base asks you before the fight (A.wsPCFightStart); this snapshots you there, and queues the reckoning
// from A.fightEnd. The panels are drawn from the event's ctx, so rendering stays pure.
(function () {
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const pick = (arr, key) => arr[hash(key) % arr.length];
  const round2 = n => { const p = Math.pow(10, Math.max(0, String(Math.round(n)).length - 2)); return Math.round(n / p) * p; };
  const BS = A.BS = { GAP: 90 };   // days between reckonings at most

  const start = A.wsPCFightStart;
  if (typeof start === 'function') A.wsPCFightStart = function (F, att, def) {
    const r = start.apply(this, arguments);
    try {
      const pc = A.pc();
      if (pc && pc.alive && pc.mil && !F.bs && att.concat(def).some(d => d.id === pc.mil.div) && F.menA + F.menD >= 2500)
        F.bs = { hp0: pc.health, merit0: pc.mil.merit || 0, squad0: (pc.mil.squad || []).slice(), y0: A.S.year, div: pc.mil.div };
    } catch (e) { console.error('both scales start', e); }
    return r;
  };

  const end = A.fightEnd;
  A.fightEnd = function (pid, winner) {
    const S = A.S, F = S.fights && S.fights[pid], pc = A.pc();
    const r = end.apply(this, arguments);
    try {
      if (F && F.bs && pc && pc.alive && pc.mil && !(S.bsLast && A.absDay() - S.bsLast < BS.GAP)) {
        S.bsLast = A.absDay();
        const ctx = BS.context(F, winner, pc);
        if (ctx) A.queue({ type: 'event', ev: 'bs_reckoning', ctx });
      }
    } catch (e) { console.error('both scales end', e); }
    return r;
  };

  // everything the three panels need, as plain strings and numbers (they go into the save with the queue)
  BS.context = function (F, winner, pc) {
    const S = A.S, P = S.prov[F.loc] || { name: 'the field', terr: 'plains' }, b = F.bs;
    const inA = (F.aIds || []).includes(b.div), inD = (F.dIds || []).includes(b.div);
    const weAtt = inA ? true : inD ? false : A.friendly(F.a, pc.mil.realm);
    const won = (winner === 'att') === weAtt;
    const ours = weAtt ? F.a : F.b, theirs = weAtt ? F.b : F.a;
    const deadOurs = Math.round(weAtt ? F.deadA : F.deadD), deadTheirs = Math.round(weAtt ? F.deadD : F.deadA);
    const WT = k => (A.WTAC && A.WTAC[k] ? A.WTAC[k].n.toLowerCase() : 'no plan');
    // what you saw
    const lost = b.squad0.map(A.P).filter(p => p && !p.alive).map(p => p.given);
    const hurt = Math.max(0, Math.round(b.hp0 - pc.health)), merit = Math.round((pc.mil.merit || 0) - b.merit0);
    const key = F.key + '|' + S.year;
    let saw = [];
    saw.push(pick(won ? ['You remember the noise most, and then the quiet when they broke.', 'You remember mud, and shouting, and then men cheering whom you could not see.']
      : ['You remember the line bending, and the sergeant\'s voice going hoarse.', 'You remember the order to fall back, and how few heard it.'], key + 's'));
    if (lost.length) saw.push(`${lost.length === 1 ? lost[0] + ' did' : lost.slice(0, -1).join(', ') + ' and ' + lost[lost.length - 1] + ' did'} not come back.`);
    else saw.push('Everyone in your section came back, which nobody says out loud.');
    saw.push(hurt >= 5 ? `You took wounds you will carry a while (health −${hurt}).` : 'You came out of it with bruises.');
    if (merit > 0) saw.push(`Your name went up the list (merit +${merit}).`);
    // the front
    const aar = A.aarFight ? A.aarFight(F, weAtt) : null;
    const front = `${F.days} day${F.days > 1 ? 's' : ''} at ${P.name}, on ${P.terr}: ${A.fmt(F.menA + F.menD)} men. ${A.realmShort(ours)} ${won ? (weAtt ? 'broke through' : 'held') : (weAtt ? 'were thrown back' : 'gave way')}. ` +
      `Dead: ${A.fmt(deadOurs)} of yours, ${A.fmt(deadTheirs)} of theirs. Your side's plan on the last day: ${WT(weAtt ? F.tacA : F.tacD)}, against ${WT(weAtt ? F.tacD : F.tacA)}.` +
      (aar && aar.causes && aar.causes.length ? ' The captains reckon it: ' + aar.causes.map(c => `${c.label.toLowerCase()} ${c.pct > 0 ? '+' : '−'}${Math.abs(c.pct)}%`).join(', ') + '.' : '');
    // what the chronicle will say: your realm's chronicler, generous with their dead and sparing with yours
    const f = 1.6 + (hash(key) % 10) / 10;
    const theirsTold = round2(deadTheirs * f), oursTold = round2(Math.max(1, deadOurs / f));
    const R = A.realm(ours);
    const chron = won
      ? `"At ${P.name} the men of ${R ? R.short : 'the realm'} won a famous victory over ${A.realmShort(theirs)}. Some ${A.fmt(theirsTold)} of the enemy fell, against ${A.fmt(oursTold)} of ours, and the rest fled."`
      : `"At ${P.name} the men of ${R ? R.short : 'the realm'} sold their lives dearly against a far greater host. ${A.fmt(theirsTold)} of the enemy fell; of ours, ${A.fmt(oursTold)}, and each of them a hero."`;
    const mate = lost.length ? null : (A.squad(pc)[0] || null);
    return { place: P.name, won: won ? 1 : 0, saw: saw.join(' '), front, chron, mate: mate ? mate.id : '', lost: lost.length, theirsTold, oursTold, deadOurs, deadTheirs };
  };

  // the three panels, drawn from ctx (pure)
  const modal = UI.eventModal;
  UI.eventModal = function (q) {
    const h = modal.apply(this, arguments);
    if (!q || q.ev !== 'bs_reckoning' || !q.ctx || !q.ctx.front) return h;
    const c = q.ctx;
    const box = `<div class="scales row" role="group" aria-label="The battle at two scales" style="flex-wrap:wrap;align-items:stretch">` +
      `<div class="card small" style="flex:1 1 220px"><div class="tag">What you saw</div><p>${UI.esc(c.saw)}</p></div>` +
      `<div class="card small" style="flex:1 1 220px"><div class="tag">The front</div><p>${UI.esc(c.front)}</p></div>` +
      `<div class="card small" style="flex:1 1 220px"><div class="tag">What the chronicle will say</div><p><em>${UI.esc(c.chron)}</em></p></div></div>`;
    const at = h.indexOf('</div>', h.indexOf('class="mtext"'));
    return at > 0 ? h.slice(0, at + 6) + box + h.slice(at + 6) : h + box;
  };

  A.SIGNATURE = Object.assign(A.SIGNATURE || {}, { bothScales: true });
})();
