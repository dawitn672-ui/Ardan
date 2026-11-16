// C6 households, part 4: births take nine months (docs/design/households.md, D-057; CRITIQUE F7).
//
// The release's A.familyYear decided at New Year whether a child came this year and gave birth on the spot, so every
// child was born on the first or second of January, two days after a wedding on the last of December. Now the same draw
// (unchanged: the game's stream moves as before) makes a conception on a day of the year, and the birth comes on its day,
// 262 to 280 days later, in whatever month that is. The day is drawn on the family's own stream. A woman with child does not
// conceive again; a mother who dies first takes the child with her.
//
// State: A.S.pregs = [{ m, f, c, due, kind, via, told }] (m, f the parents' ids; c the conception's day and due the birth's,
// as A.absDay counts; kind 'own' (the player's child), 'sib' (the player's mother's) or 'grand' (a child's, via its id)).
// An old save has none: births start again from its next year.
(function () {
  const F = A.V2F; if (!F || !F.rng) return;
  const B = A.PREG = A.PREG || {};
  B.list = () => { const S = A.S; if (!Array.isArray(S.pregs)) S.pregs = []; return S.pregs; };
  B.of = m => (m ? B.list().find(x => x.m === m.id) || null : null);
  const day = () => (A.absDay ? A.absDay() : A.S.year * 365);

  // the release's familyYear calls this where it gave birth
  A.conceive = function (mother, father, kind, via) {
    if (!mother || !father || !mother.alive || B.of(mother)) return null;
    const S = A.S, r = F.rng('conceive|' + mother.id + '|' + S.year + '|' + (kind || ''));
    const c = S.year * 365 + Math.max(day() - S.year * 365, r.int(0, 364));
    const x = { m: mother.id, f: father.id, c, due: c + r.int(262, 280), kind: kind || 'own', via: via || null };
    B.list().push(x);
    return x;
  };

  // lf_childbed ("The birth", pack 15) is the birth itself, so it comes only in a pregnancy's last weeks; once it is shown
  // (attend) its choices bring the child or lose it, and the day passes without a second birth
  B.wife = p => { const s = p && p.spouse ? A.P(p.spouse) : null; return p && p.sex === 'F' ? p : s && s.sex === 'F' ? s : null; };
  B.near = function (p) {
    const x = B.of(B.wife(p));
    return !!(x && x.kind === 'own' && !x.att && day() >= x.due - 45);
  };
  B.attend = function (m) { const x = B.of(m); if (x) x.att = 1; };

  // the player's household hears of it on the day, and the child comes on its day
  B.month = function () {
    const S = A.S, L = B.list(); if (!L.length) return;
    const now = day(), pc = A.pc();
    for (let i = 0; i < L.length; i++) {
      const x = L[i], m = A.P(x.m), f = A.P(x.f);
      if (!m || !m.alive || !f) { L.splice(i--, 1); continue; }
      if (!x.told && now >= x.c) {
        x.told = 1;
        if (pc && pc.alive && A.log) {
          if (x.kind === 'own') A.log(pc.id === m.id ? 'You are with child. The child should come in the ninth month.' : `${m.given} is with child.`, 'good');
          else if (x.kind === 'sib' && pc.rel && pc.rel[m.id]) A.log('Your mother is with child.', 'muted');
        }
      }
      if (now < x.due) continue;
      L.splice(i--, 1);
      if (x.att) continue;   // the birth was its own scene
      if (x.kind === 'grand') {
        const c = x.via != null ? A.P(x.via) : null;
        const g = A.birth(m, f, false, true);
        if (g && pc && pc.alive && c) {
          A.link(pc, g, 'grandchild', 40, 'grandparent');
          A.log(`A grandchild is born: ${g.given}, to ${c.given}.`, 'good');
          pc.happy = A.clamp(pc.happy + 6, 0, 100);
        }
      } else A.birth(m, f, x.kind === 'sib');
    }
  };
  A.onMonth = A.onMonth || [];
  A.onMonth.push(() => { try { B.month(); } catch (e) { console.error('households: births', e); } });
})();
