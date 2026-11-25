// E5b (order 76, the Emilio save): an outlaw is hunted for a reason. "You are declared outlaw: anyone may kill you", and in
// two years nobody came. Each month an outlaw at large is weighed by the one with most cause to come for him: a person
// who survived his knife (t.wary, 05-marriage-jobs-and-law) and is still alive, else the crown of the land he is in.
// The choice goes through A.WHY.decide (rule 18): the unpaid blood-price (flags.outlawDebt), the grudge, how near he is,
// what hunters cost and how dangerous a name he has. A hunt brings one of the release's own hunter scenes ("A price on
// your head", "Hunted"), at most one every two years.
(function () {
  if (!A.WHY || !A.WHY.decide || !A.onMonth) return;
  const SCENES = ['av_bounty_on_you', 'wr_outlaw_hunted'];
  const live = id => { const p = id && A.P(id); return p && p.alive ? p : null; };
  const PF = A.PF = A.PF || {};

  // the one with most cause: the wronged who still lives, else the crown of the land he is in
  PF.hunter = function (pc) {
    for (const id in pc.rel || {}) {
      const t = live(id);
      if (t && t.wary && t.wary[pc.id] != null) return { p: t, who: t.id, grudge: true, realm: t.realm };
    }
    const r = A.realm(pc.realm);
    return r && r.ruler ? { p: live(r.ruler), who: r.id, grudge: false, realm: r.id } : null;
  };

  PF.huntOptions = function (pc, h) {
    const debt = +pc.flags.outlawDebt || 0, near = h.realm === pc.realm;
    const hunt = [
      { kind: 'cost', weight: -1.5, source: 'hunters', label: 'Hunters cost coin and men', pub: true },
      { kind: 'reckon', weight: near ? 0.8 : -1.2, source: 'distance', label: near ? 'He is within reach' : 'He is far away, past the border', pub: true },
    ];
    if (debt > 0) hunt.push({ kind: 'greed', weight: Math.min(2, debt / 150), source: 'outlawDebt', label: 'A blood-price never paid', pub: true });
    if (h.grudge) hunt.push({ kind: 'pride', weight: 1.2, source: 'wary', label: 'He tried to kill me', pub: true });
    if ((pc.fame || 0) > 0) hunt.push({ kind: 'fear', weight: -Math.min(1.5, (pc.fame || 0) / 60), source: 'fame', label: 'A dangerous name', pub: true });
    return [
      { id: 'hunt', reasons: hunt },
      { id: 'wait', reasons: [{ kind: 'reckon', weight: 0, source: 'none', label: 'Let it lie', pub: true }] },
    ];
  };

  PF.huntMonth = function (pc) {
    if (!pc || !pc.alive || !pc.flags || !pc.flags.outlaw || pc.prison || !A.isAdult(pc)) return null;
    if (pc.flags.pf_hunted != null && A.S.year - pc.flags.pf_hunted < 2) return null;
    if (A.S.queue.some(q => q && q.type === 'event' && SCENES.includes(q.ev))) return null;
    const h = PF.hunter(pc); if (!h) return null;
    const rec = A.WHY.decide(h.who, 'hunt', PF.huntOptions(pc, h), { band: 0.5, at: pc.id, r: h.realm, logIf: x => x.chose === 'hunt' });
    if (!rec || rec.chose !== 'hunt') return rec;
    const ev = SCENES.find(id => { const e = A.EV[id]; try { return e && (!e.cond || e.cond(pc, A.C)); } catch (err) { return false; } });
    if (ev) {
      pc.flags.pf_hunted = A.S.year;
      A.queue({ type: 'event', ev, ctx: { npcMove: true } });
    }
    return rec;
  };

  A.onMonth.push(pc => { try { PF.huntMonth(pc); } catch (e) { console.error('play-fixes: hunt', e); } });
})();
