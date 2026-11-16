// Named men who get better (Road to Ten, War 6: "small-unit missions with your named men, who get better and who
// die"). The release already had the missions (patrols, raids, scouting, escorts) and a squad of named comrades who
// can die in them; each adds a little to the odds, and one you send can add his own skill. What it did not have was
// the men getting better. Now every comrade keeps a record of the missions he came back from: he learns the skills
// the mission used, he earns a name among the men (seasoned at 3, a veteran at 6, an old hand at 10), and veterans
// carry the mission (each standing adds to the odds). When one dies, the story log says what was lost.
//
// Engine side: A.missionClose and A.comradeDies are wrapped; A.missionOdds reads the record. Rendering reads it.
(function () {
  const SQ = A.SQUAD = { RANKS: [[10, 'an old hand'], [6, 'a veteran'], [3, 'seasoned']] };
  SQ.record = p => (p && p.sq && typeof p.sq === 'object' ? p.sq : { n: 0 });
  SQ.standing = p => { const n = SQ.record(p).n || 0; for (const [k, name] of SQ.RANKS) if (n >= k) return name; return null; };
  SQ.level = p => { const n = SQ.record(p).n || 0; return n >= 10 ? 3 : n >= 6 ? 2 : n >= 3 ? 1 : 0; };

  // what a mission asked of its men: the skills behind each choice taken
  const choose = A.missionChoose;
  A.missionChoose = function (i) {
    const q = A.S.queue[0], m = q && q.type === 'mission' ? q.m : null;
    try { const c = m && m.cur && m.cur.choices[i]; if (c) m.sqUsed = [...new Set((m.sqUsed || []).concat((c.check || []).filter(k => GD.SKILLS[k])))];
      if (m) m.sqMen = [...new Set((m.sqMen || []).concat(m.mates || []))]; } catch (e) {}
    return choose.apply(this, arguments);
  };
  // the men who came back learn from it
  const close = A.missionClose;
  A.missionClose = function () {
    const q = A.S.queue[0], m = q && q.type === 'mission' ? q.m : null, pc = A.pc();
    const r = close.apply(this, arguments);
    try {
      if (m && pc && pc.mil) {
        const good = m.result === 'triumph' || m.result === 'success';
        const skills = new Set((m.sqUsed || []).slice(0, 2));   // the two the mission leaned on first
        if (!skills.size) skills.add(GD.TROOP_SKILL && pc.mil.troop ? GD.TROOP_SKILL[pc.mil.troop] || 'melee' : 'melee');
        for (const id of m.sqMen || m.mates || []) {   // everyone who went out on it
          const p = A.P(id); if (!p || !p.alive) continue;
          const rec = p.sq = Object.assign({ n: 0, y: A.S.year }, SQ.record(p));
          const before = SQ.standing(p);
          rec.n++; rec.last = A.S.year; if (good) rec.won = (rec.won || 0) + 1;
          for (const k of skills) p.skills[k] = Math.min(90, (p.skills[k] || 20) + (good ? 1.5 : 0.8));
          const now = SQ.standing(p);
          if (now && now !== before) A.log(`${p.given} has come back from ${rec.n} missions with you now: ${now}. The new men watch what ${A.he(p)} does.`, 'good');
        }
      }
    } catch (e) { console.error('squad', e); }
    return r;
  };
  // veterans carry a mission: each standing level of the squad adds to the odds, the one you send adds more
  const odds = A.missionOdds;
  A.missionOdds = function (pc, m, ch) {
    let o = odds.apply(this, arguments);
    try {
      const sq = A.squad(pc), lv = sq.reduce((a, p) => a + SQ.level(p), 0);
      o += Math.min(8, lv * 1.2);
      if (ch && ch.mate != null) { const mt = A.P((m.mates || [])[ch.mate]); if (mt) o += SQ.level(mt) * 2; }
    } catch (e) {}
    return Math.max(5, Math.min(95, Math.round(o)));
  };
  // what is lost when one of them dies
  const dies = A.comradeDies;
  A.comradeDies = function (pc, c) {
    const rec = c && SQ.record(c), st = c && SQ.standing(c);
    const r = dies.apply(this, arguments);
    try { if (st && pc && pc.id === A.S.pc) A.log(`${rec.n} missions, and ${c.given} came back from every one of them but this.`, 'death'); } catch (e) {}
    return r;
  };
  // the person view shows it
  const card = UI.personModal;
  if (typeof card === 'function') UI.personModal = function (t) {
    const h = card.apply(this, arguments), rec = t && SQ.record(t);
    if (!rec || !rec.n) return h;
    const st = SQ.standing(t), line = `<div class="small muted">Missions with you: ${rec.n}${rec.won ? `, ${rec.won} won` : ''}${st ? ` · ${UI.esc(st)}` : ''}</div>`;
    const at = h.indexOf('</h2>');
    return at > 0 ? h.slice(0, at + 5) + line + h.slice(at + 5) : h;
  };
})();
