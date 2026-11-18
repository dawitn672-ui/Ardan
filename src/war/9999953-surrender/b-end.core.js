// W1-5 "surrender or defeat" (war.md §11.3; D-091 to D-096): how a war reaches its end, and only so.
//
//   A.WAR.month(w)   each side's decider re-reads his pans (every four weeks of the war clock, and after a great battle):
//                    first defeat, a fact; then whether either side asks for terms (the one leaning more toward it asks
//                    first); then whether the stronger, tired himself, offers his terms. The player's own side is never
//                    decided for him.
//   A.WAR.day()      envoys ride, and take as long as the road (capital to capital at a rider's pace): the fighting goes
//                    on until they arrive, and a battle may be fought after the war was lost in a tent.
//   The legs: an ask reaches the victor, who names his terms (his cause's, everything he holds, or nothing yet); they ride
//   back and the asker accepts or refuses; asked everything, he counters with the cause's terms, which ride to the victor
//   again. An offer from the stronger reaches the weaker, who accepts or refuses. A side that is defeated is asked nothing.
//   A.WAR.settle(w, e)  the terms carried out (land through A.transferProv, coin, tribute, a crown through A.makeRuler, a
//                    realm through A.realmFalls), then A.endWar. Its record is w.end = { y, d, kind: 'surrender' |
//                    'defeat', by (the side that yielded), who, asked (the day it was asked), path (1 to 8), terms:
//                    [{ k, label }], why: [reason], told, signed: [the two rulers] }, also kept in A.S.warEnds (the last
//                    40, bounded). An ending made elsewhere (an event, a realm's fall, a test) gets the same record, read
//                    from what it was (A.WAR.endOf, called by the release's endWarNow).
//   A.settleWar(w, res, how)  the release's call (events, factions, tests): res 'att' or 'def' is that side's victory, its
//                    terms named by its decider; 'white' is a peace the crowns made with nothing changing hands, asked by
//                    how.by (a realm) or the player's side.
// News by rank (A.WAR.tell): the ruler and his council hear why their crown asks and what is asked of it; a commander or a
// General hears that envoys have ridden; everyone in the war hears the peace and its terms; the world hears the peace.
(function () {
  const WAR = A.WAR, W = A.WHY;
  if (!WAR || !WAR.facts) return;
  const E = WAR.E, other = WAR.other, cap = WAR.cap;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const short = id => (A.realm(id) ? A.realmShort(id) : String(id || 'the enemy'));
  const alive = id => { const r = A.realm(id); return !!(r && r.alive); };
  const day = () => (A.absDay ? A.absDay() : A.S.year * 365);
  Object.assign(WAR.T, Object.assign({ rideKm: 45, rideMin: 2, rideMax: 40, quietDays: 120, offerDays: 180, offerMonths: 6, offerLean: -1, endsCap: 40, stirDays: 14 }, WAR.T));
  WAR.stats = WAR.stats || { asks: 0, offers: 0, refused: 0, countered: 0, defeats: 0, surrenders: 0, byPath: {} };

  // the days a rider takes between two courts
  WAR.ride = function (a, b) {
    const km = A.capDist ? A.capDist(a, b) * .9 : 400;
    return clamp(Math.round(km / WAR.T.rideKm), WAR.T.rideMin, WAR.T.rideMax);
  };
  // the side the player decides for: he rules its leading realm
  WAR.playerSide = function (w) {
    const pc = A.pc && A.pc();
    if (!pc || !pc.alive || !pc.ruler) return null;
    return pc.ruler === w.leadA ? 'att' : pc.ruler === w.leadD ? 'def' : null;
  };
  const shortWhy = rec => (rec && Array.isArray(rec.why) ? rec.why.slice(0, 3).map(x => [String(x[0]).slice(0, 120), x[1], x[2], null, x[4] ? 1 : 0]) : []);
  // the rulers' log (20-ai-personality): the record's reasons, and whether the decision was in his character
  const logWhy = rec => (rec ? (rec.why || []).map(x => [x[0], x[1], 0]).concat((rec.not || []).map(x => [x[0], x[1], 0])).concat(rec.form ? [['In his character', .3 * rec.form, 1]] : []) : []);
  const aiLog = (k, rid, oid, text, rec) => { try { if (A.aiLogAdd) A.aiLogAdd(k, rid, oid, text, logWhy(rec)); } catch (e) { console.error('[surrender] log', e); } };

  // ---------------------------------------------------------------- news by rank
  WAR.rankIn = function (w, rid) {
    const pc = A.pc && A.pc();
    if (!pc || !pc.alive || !rid || pc.realm !== rid) return null;
    if (W.knows(rid)) return 'council';
    if (pc.mil && !pc.mil.merc && (pc.mil.rank || 0) >= 6) return 'officer';
    if (pc.noble && (pc.noble.rung || 0) >= 2) return 'officer';
    return 'subject';
  };
  WAR.tell = function (w, s, stage, rec, a) {
    const pc = A.pc && A.pc();
    if (!pc || !pc.alive) return;
    const ms = A.warSide(w, pc.realm);
    if (!ms) return;
    const rank = WAR.rankIn(w, pc.realm);
    const asker = WAR.lead(w, s), victor = WAR.lead(w, other(s)), ru = A.realm(asker) && A.P(A.realm(asker).ruler);
    const who = ru ? A.rulerStyle(ru, A.realm(asker)) : `The crown of ${short(asker)}`;
    const why = rec && rank === 'council' ? W.tellFor(rec, pc.realm) : rec ? W.tell(rec, true) : '';
    if (stage === 'ask') {
      if (ms === s && rank === 'council') A.log(`${who} sends envoys to ${short(victor)} to ask for terms.${why ? ' ' + why : ''}`, 'peace');
      else if (ms === s && rank === 'officer') A.log(`Word comes down the line: envoys have ridden to ${short(victor)} under a white branch.`, 'peace');
      else if (ms !== s && rank === 'council') A.log(`Envoys of ${short(asker)} are on the road to ask for terms.`, 'peace');
    } else if (stage === 'offer') {
      if (rank === 'council') A.log(`${ms === s ? 'Envoys come from' : 'The crown sends envoys to'} ${short(ms === s ? victor : asker)} with terms for ${w.name}.`, 'peace');
    } else if (stage === 'terms' && rank === 'council') {
      A.log(`${cap(short(victor))} names the terms for ${w.name}: ${WAR.termsWords(a && a.terms)}.`, 'peace');
    } else if (stage === 'refused' && rank === 'council') {
      A.log(`No peace yet in ${w.name}: ${a && a.line ? a.line : 'the envoys come back with nothing'}.${why ? ' ' + why : ''}`, 'war');
    } else if (stage === 'end' && (rank === 'council' || rank === 'officer') && why) {
      A.log(`Why ${w.name} ended so: ${why.replace(/^Because: /, '')}`, 'peace');
    }
  };

  // ---------------------------------------------------------------- the monthly reading
  WAR.month = function (w) {
    if (!WAR.live(w)) return;
    WAR.fixLeads(w);
    WAR.init(w);
    w.readD = day();
    for (const s of ['att', 'def']) if (!alive(WAR.lead(w, s))) { WAR.defeat(w, s, { path: 8, label: 'nothing is left of its side' }); return; }
    if (w.ask) return;   // envoys on the road: the war goes on, and nobody asks twice
    const fa = WAR.facts(w, 'att'), fd = WAR.facts(w, 'def');
    for (const [s, f] of [['att', fa], ['def', fd]]) { const d = E.defeated(f); if (d) { WAR.defeat(w, s, d, f); return; } }
    if (w.quiet && day() < w.quiet) return;
    const order = E.lean(fa) >= E.lean(fd) ? ['att', 'def'] : ['def', 'att'], ps = WAR.playerSide(w);
    for (const s of order) {
      if (s === ps) continue;
      const f = s === 'att' ? fa : fd, rec = WAR.yieldQ(w, s, f);
      if (rec && rec.chose === 'ask') { WAR.ask(w, s, rec, f); return; }
    }
    // the stronger, tired himself, offers his terms rather than press on (pathway 7), at most twice a year
    const vs = order[1], fv = vs === 'att' ? fa : fd;
    if (vs !== ps && WAR.months(w) >= WAR.T.offerMonths && !(w.offerD && day() < w.offerD) && E.lean(fv) > WAR.T.offerLean) {
      w.offerD = day() + WAR.T.offerDays;
      const rec = WAR.offerQ(w, vs, fv);
      if (rec && rec.chose === 'offer') WAR.offer(w, vs, rec);
    }
  };
  WAR.stir = w => { if (w) w.stir = 1; };
  WAR.day = function () {
    const S = A.S;
    if (!S || !Array.isArray(S.wars) || !S.wars.length) return;
    const now = day();
    for (const w of S.wars.slice()) {
      if (!WAR.live(w)) continue;
      const a = w.ask;
      // stamps made at the turn of the year lie a year ahead (see WAR.init): bring them back
      if (a && a.d0 > now) { a.d0 -= 365; if (a.due != null) a.due -= 365; }
      if (w.quiet && w.quiet - now > WAR.T.quietDays + 1) w.quiet -= 365;
      if (w.offerD && w.offerD - now > WAR.T.offerDays + 1) w.offerD -= 365;
      if (a && a.leg === 'player') WAR.playerWait(w);
      else if (a && a.due != null && now >= a.due) WAR.arrive(w);
      // a great battle is weighed at once, but a war is not re-read more than once a fortnight
      if (w.stir && WAR.live(w) && !(w.readD && now - w.readD < WAR.T.stirDays)) { w.stir = 0; if (!w.ask) WAR.month(w); }
    }
  };

  // ---------------------------------------------------------------- asking, offering, the envoys' legs
  WAR.ask = function (w, s, rec, f, o) {
    o = o || {};
    const vs = other(s), asker = WAR.lead(w, s), victor = WAR.lead(w, vs);
    w.ask = { k: 'ask', s, d0: day(), due: day() + WAR.ride(asker, victor), leg: 1, path: o.path || E.pathOf(f || {}, rec), why: o.why || shortWhy(rec), told: rec ? W.tell(rec, true).slice(0, 240) : '' };
    WAR.stats.asks++;
    // (an ask made for the crown by others, a peace league granted: its reasons are o.why)
    aiLog('yield', asker, victor, `asks ${short(victor)} for terms: ${w.name}.`, rec || (o.why ? { why: o.why } : null));
    WAR.tell(w, s, 'ask', rec);
  };
  WAR.offer = function (w, vs, rec) {
    const s = other(vs), victor = WAR.lead(w, vs), loser = WAR.lead(w, s);
    const terms = WAR.terms(w, vs, 'casus');
    w.ask = { k: 'offer', s, d0: day(), due: day() + WAR.ride(victor, loser), leg: 1, path: 7, terms, why: shortWhy(rec), told: rec ? W.tell(rec, true).slice(0, 240) : '' };
    WAR.stats.offers++;
    aiLog('offer', victor, loser, `offers ${short(loser)} terms: ${w.name}.`, rec);
    WAR.tell(w, s, 'offer', rec);
  };
  // the asker's envoys came back with nothing, or the offer was refused: he waits before asking again
  WAR.refused = function (w, s, rec, line) {
    const a = w.ask;
    w.ask = null;
    w.quiet = day() + WAR.T.quietDays;
    WAR.stats.refused++;
    if (rec) aiLog('decline', WAR.lead(w, rec.chose === 'press' ? other(s) : s), WAR.lead(w, rec.chose === 'press' ? s : other(s)), rec.chose === 'press' ? `sends the envoys of ${short(WAR.lead(w, s))} back: no terms yet.` : `refuses the terms of ${short(WAR.lead(w, other(s)))}.`, rec);
    WAR.tell(w, s, 'refused', rec, { line });
    return a;
  };
  WAR.arrive = function (w) {
    const a = w.ask;
    if (!a || !WAR.live(w)) return;
    const s = a.s, vs = other(s), ps = WAR.playerSide(w), ride = () => day() + WAR.ride(WAR.lead(w, s), WAR.lead(w, vs));
    if (a.k === 'ask') {
      if (a.leg === 1) {
        if (vs === ps) { WAR.card(w, 'asked'); return; }
        const rec = WAR.want(w, vs, { asked: true });
        if (!rec || rec.chose === 'press') { WAR.refused(w, s, rec, `${short(WAR.lead(w, vs))} will hear of no terms yet`); return; }
        a.want = rec.chose; a.terms = WAR.terms(w, vs, a.want); a.wantWhy = shortWhy(rec); a.leg = 2; a.due = ride();
        WAR.tell(w, s, 'terms', rec, a);
        return;
      }
      if (a.leg === 2) {
        if (s === ps) { WAR.card(w, 'terms'); return; }
        const rec = WAR.answer(w, s, a.terms, { light: a.want === 'casus' });
        if (rec && rec.chose === 'accept') { WAR.settle(w, { kind: 'surrender', by: s, asked: a.d0, path: a.path, terms: a.terms, why: a.why, told: a.told, rec }); return; }
        if (a.want === 'all') { a.terms = WAR.terms(w, vs, 'casus'); a.leg = 3; a.due = ride(); a.counter = 1; WAR.stats.countered++; return; }
        WAR.refused(w, s, rec, `${short(WAR.lead(w, s))} will not take the terms`);
        return;
      }
      if (a.leg === 3) {
        if (vs === ps) { WAR.card(w, 'counter'); return; }
        const rec = WAR.takeCounter(w, vs);
        if (rec && rec.chose === 'take') { WAR.settle(w, { kind: 'surrender', by: s, asked: a.d0, path: a.path, terms: a.terms, why: a.why, told: a.told, rec }); return; }
        WAR.refused(w, s, rec, `${short(WAR.lead(w, vs))} will have all of it or nothing`);
        return;
      }
    }
    if (a.k === 'offer') {
      if (s === ps) { WAR.card(w, 'offered'); return; }
      const rec = WAR.answer(w, s, a.terms, { light: true });
      if (rec && rec.chose === 'accept') { WAR.settle(w, { kind: 'surrender', by: s, asked: a.d0, path: 7, terms: a.terms, why: shortWhy(rec), told: W.tell(rec, true), rec }); return; }
      w.offerD = day() + WAR.T.offerDays;
      WAR.refused(w, s, rec, `${short(WAR.lead(w, s))} refuses the terms`);
      return;
    }
    if (a.k === 'player' && WAR.playerArrive) WAR.playerArrive(w);
  };

  // ---------------------------------------------------------------- defeat: a side that can fight no more is asked nothing
  WAR.defeat = function (w, s, d, f) {
    const vs = other(s);
    WAR.stats.defeats++;
    if (!alive(WAR.lead(w, s)) && !WAR.realmsOf(w, s).some(alive)) {
      w._end = { kind: 'defeat', by: s, asked: day(), path: 8, terms: [], why: [[cap(d.label), 2, 'fact', null, 1]], told: '' };
      A.endWar(w, vs, `${w.name} ends: ${d.label}.`);
      return;
    }
    if (vs === WAR.playerSide(w)) { w.ask = { k: 'defeat', s, d0: day(), leg: 1, path: d.path, label: d.label }; WAR.card(w, 'defeated'); return; }
    const rec = WAR.want(w, vs, { defeated: true, loserFacts: f });
    const want = rec ? rec.chose : 'casus';
    WAR.settle(w, { kind: 'defeat', by: s, asked: day(), path: want === 'annex' ? 8 : d.path, terms: WAR.terms(w, vs, want === 'press' ? 'all' : want), why: [[cap(d.label), 2, 'fact', null, 1]].concat(shortWhy(rec).slice(0, 2)), told: `${cap(short(WAR.lead(w, s)))} can fight no more: ${d.label}.`, defeat: d.label, rec });
  };

  // ---------------------------------------------------------------- the terms carried out, and the record
  const realGain = t => t && t.k !== 'peace';
  WAR.apply = function (w, e) {
    const s = e.by, vs = other(s), loser = WAR.lead(w, s), victor = WAR.lead(w, vs), L = A.realm(loser), V = A.realm(victor);
    const done = [];
    let annex = false;
    for (const t of e.terms || []) {
      switch (t.k) {
        case 'land': {
          const got = [];
          // a province passes from the side that gives it (the yielder, unless the term says otherwise) to the soldiers
          // of the other side who hold it, else to the realm the term names
          const fs = t.fromSide || s, from = WAR.realmsOf(w, fs), to = WAR.realmsOf(w, other(fs));
          for (const id of t.provs || []) {
            const p = A.prov(id);
            if (!p || !from.includes(p.owner)) continue;
            A.transferProv(p, p.occ && to.includes(p.occ) ? p.occ : (t.to || WAR.lead(w, other(fs))), true);
            got.push(p.name);
          }
          if (got.length) done.push({ k: 'land', label: got.join(', ') });
          break;
        }
        case 'coin': {
          const from = A.realm(t.from), to = A.realm(t.to);
          if (!from || !to) break;
          from.treasury -= t.amt; to.treasury += t.amt;
          if (from.treasury < 0) { from.debt = (from.debt || 0) - from.treasury; from.treasury = 0; }
          done.push({ k: 'coin', label: t.label });
          break;
        }
        case 'trib':
          if (L && L.alive && !L.isRebel && !L.overlord && V && V.overlord !== loser) { L.overlord = victor; if (A.unally) A.unally(loser, victor); done.push(t); A.news(`${L.name} becomes a tributary of ${A.realmName(victor)}.`, 'crown'); }
          break;
        case 'unally':
          if (L) for (const x of (L.allies || []).slice()) if (x !== victor) A.unally(loser, x);
          done.push(t);
          break;
        case 'humble':
          if (V) V.legit = Math.min(100, (V.legit || 50) + 8);
          if (L) L.legit = Math.max(0, (L.legit || 50) - 8);
          done.push(t);
          break;
        case 'renounce': {
          const R = A.realm(w.leadA);
          if (s === 'att' && R && R.isRebel && (w.cb === 'throne' || w.cb === 'liberty' || w.cb === 'independence')) {
            for (const p of A.realmProvs(R.id)) { p.owner = w.leadD; if (A.scaleLand) A.scaleLand(); }
            A.realmGone(R);
          } else if (L && L.claims && V) for (const p of A.realmProvs(victor)) delete L.claims[p.id];
          done.push(t);
          break;
        }
        case 'crown': {
          const cl = A.P(t.pid), target = A.realm(w.leadD), R = A.realm(w.leadA);
          if (!cl || !cl.alive || !target) break;
          if (R && R.isRebel) { for (const p of A.realmProvs(R.id)) { p.owner = target.id; if (A.scaleLand) A.scaleLand(); } A.realmGone(R); }
          A.makeRuler(cl, target.id);
          target.legit = 45;
          target.stability = Math.max(25, (target.stability || 50) - 10);
          done.push(t);
          break;
        }
        case 'free': {
          const R = A.realm(w.leadA);
          if (R && R.isRebel) R.isNew = true;
          done.push(t);
          break;
        }
        case 'annex': annex = true; done.push(t); break;
        default: done.push(t);
      }
    }
    return { done, annex };
  };
  WAR.settle = function (w, e) {
    if (!WAR.live(w)) return null;
    const s = e.by, vs = other(s), loser = WAR.lead(w, s), victor = WAR.lead(w, vs);
    w.ask = null;
    const before = { loser, victor, L: A.realm(loser), V: A.realm(victor) };
    const { done, annex } = WAR.apply(w, e);
    const res = e.white && !done.some(realGain) ? 'white' : vs;
    e.terms = done;
    const text = WAR.endText(w, e, res);
    w._end = e;
    A.endWar(w, res, text);
    if (annex) {
      const L = A.realm(loser);
      if (L && L.alive) { for (const p of A.realmProvs(loser)) A.transferProv(p, victor, true); A.realmFalls(L, victor); }
    }
    A.updateRealmPops();
    if (res !== 'white') {
      const L = before.L, V = before.V;
      if (L && L.alive) L.stability = Math.max(5, (L.stability || 50) - 10);
      if (V && V.alive) V.stability = Math.min(100, (V.stability || 50) + 6);
    }
    if (e.kind !== 'defeat') WAR.stats.surrenders++;
    WAR.stats.byPath[e.path] = (WAR.stats.byPath[e.path] || 0) + 1;
    if (e.rec) aiLog(e.kind === 'defeat' ? 'peace' : 'yield', e.kind === 'defeat' ? victor : loser, e.kind === 'defeat' ? loser : victor,
      e.kind === 'defeat' ? `dictates the peace to a beaten ${short(loser)}: ${w.name} ends.` : `yields to ${short(victor)}: ${w.name} ends.`, e.rec);
    WAR.tell(w, s, 'end', e.rec);
    return res;
  };
  WAR.endText = function (w, e, res) {
    const s = e.by, vs = other(s), loser = short(WAR.lead(w, s)), victor = short(WAR.lead(w, vs)), terms = (e.terms || []).filter(realGain);
    const tw = terms.length ? WAR.termsWords(terms) : '';
    if (res === 'white') return `${w.name} ends in a peace the crowns made: nothing changes hands but the graves.`;
    if (e.kind === 'defeat') return `${w.name} ends: ${loser} can fight no more (${e.defeat || 'beaten'}). ${cap(victor)} dictates the peace${tw ? ': ' + tw : ''}.`;
    return `${w.name} ends: ${loser} asks ${victor} for terms. The peace: ${tw || 'ten years of sworn peace'}.`;
  };

  // the record of an ending, made by A.WAR.settle or read from what it was (endWarNow calls this for every ending)
  WAR.endOf = function (w, result, text) {
    const S = A.S, e = w._end;
    delete w._end;
    let rec;
    if (e) rec = e;
    else {
      const aLive = w.att.some(alive), dLive = w.def.some(alive);
      if (!aLive || !dLive) rec = { kind: 'defeat', by: !aLive ? 'att' : 'def', asked: day(), path: 8, terms: [], why: [[String(text || 'Nothing is left of its side').slice(0, 140), 2, 'fact', null, 1]] };
      else {
        let by = result === 'att' ? 'def' : result === 'def' ? 'att' : null;
        if (!by) { const pc = A.pc && A.pc(); by = (pc && A.warSide(w, pc.realm)) || (E.lean(WAR.facts(w, 'att', { dry: true, noTerms: true })) >= E.lean(WAR.facts(w, 'def', { dry: true, noTerms: true })) ? 'att' : 'def'); }
        rec = { kind: 'surrender', by, asked: day(), path: 7, terms: result === 'white' ? [{ k: 'peace', label: 'ten years of sworn peace' }] : [], why: [[String(text || 'Terms made between the crowns').slice(0, 140), 1, 'event', null, 1]] };
      }
    }
    const ra = A.realm(w.leadA), rd = A.realm(w.leadD);
    const out = { y: S.year, d: day(), kind: rec.kind, by: rec.by, who: WAR.lead(w, rec.by), asked: rec.asked != null ? rec.asked : day(), path: rec.path || 7,
      terms: (rec.terms || []).map(t => ({ k: t.k, label: String(t.label || '').slice(0, 160) })),
      why: (rec.why || []).slice(0, 3).map(x => [String(x[0]).slice(0, 140), x[1], x[2], null, x[4] ? 1 : 0]),
      told: String(rec.told || '').slice(0, 240), signed: [ra ? ra.ruler : null, rd ? rd.ruler : null] };
    const L = S.warEnds = Array.isArray(S.warEnds) ? S.warEnds : [];
    L.unshift(Object.assign({ id: w.id, name: w.name, cb: w.cb || null, start: w.start, res: result || null }, out));
    if (L.length > WAR.T.endsCap) L.length = WAR.T.endsCap;
    return out;
  };

  // the release's settleWar: a war ended by an event, a faction's demand, the council or a test
  WAR.settleAs = function (w, res, how) {
    if (!WAR.live(w)) return null;
    how = how || {};
    WAR.fixLeads(w); WAR.init(w);
    if (res === 'white') {
      let by = how.by != null ? (how.by === 'att' || how.by === 'def' ? how.by : A.warSide(w, how.by)) : null;
      if (!by) { const pc = A.pc && A.pc(); by = (pc && A.warSide(w, pc.realm)) || (E.lean(WAR.facts(w, 'att', { noTerms: true, dry: true })) >= E.lean(WAR.facts(w, 'def', { noTerms: true, dry: true })) ? 'att' : 'def'); }
      return WAR.settle(w, { kind: 'surrender', by, asked: how.asked != null ? how.asked : day(), path: how.path || 7, white: true, terms: [{ k: 'peace', label: 'ten years of sworn peace' }],
        why: how.why || [['Terms made between the crowns', 1, 'event', null, 1]], told: how.told || '' });
    }
    if (res !== 'att' && res !== 'def') return null;
    const vs = res, s = other(res), fl = WAR.facts(w, s, { noTerms: true, dry: true }), d = E.defeated(fl);
    let want = how.want, rec = null;
    if (!want) { rec = WAR.want(w, vs, { defeated: !!d, loserFacts: fl }); want = rec ? rec.chose : 'casus'; }
    if (want === 'press') want = 'all';
    return WAR.settle(w, { kind: how.kind || (d ? 'defeat' : 'surrender'), by: s, asked: how.asked != null ? how.asked : day(), path: how.path || (want === 'annex' ? 8 : d ? d.path : E.pathOf(fl, null)),
      terms: how.terms || WAR.terms(w, vs, want), why: how.why || (d ? [[cap(d.label), 2, 'fact', null, 1]] : shortWhy(rec)), told: how.told || '', defeat: d ? d.label : null, rec });
  };

  // ---------------------------------------------------------------- old saves
  // the war score is gone (W0 hid it; here it goes from the state): a war in progress goes on, read from its facts
  WAR.convert = function () {
    const S = A.S;
    if (!S || !Array.isArray(S.wars)) return 0;
    let n = 0;
    for (const w of S.wars) { if ('score' in w) { delete w.score; n++; } if ('bscore' in w) delete w.bscore; delete w.manualPeace; }
    return n;
  };
  const des = A.deserialize;
  if (typeof des === 'function') A.deserialize = function () {
    const out = des.apply(this, arguments);
    try { WAR.convert(); } catch (e) { console.error('[surrender] convert', e); }
    return out;
  };
})();
