// From src/ui/59-descriptions/descriptions.more-war.core.js: the war score's click-open note (G.warScore), retired by W0
// (D-052) for G.warFacts.
  G.warScore = function (wid) {
    const w = A.S.wars.find(x => String(x.id) === String(wid)); if (!w) return '';
    const me = myR(), side = A.warSide(w, me) || 'att', sc = side === 'att' ? w.score : -w.score, mine = side === 'att' ? w.att : w.def, theirs = side === 'att' ? w.def : w.att;
    const held = A.S.prov.filter(p => theirs.includes(p.owner) && mine.includes(p.occ)), lost = A.S.prov.filter(p => mine.includes(p.owner) && theirs.includes(p.occ));
    const cap = ps => ps.filter(p => (A.realm(p.owner) || {}).capitalProv === p.id).length;
    const won = w.battles.filter(b => b.win === side).length, lostB = w.battles.length - won;
    return H('War score', sg(sc), esc(w.name)) + D('It moves each month with the land each side holds of the other (a capital counts double), and with each battle won or lost: 6 to 13 points a battle.') +
      R('Their provinces you hold', `${held.length}${cap(held) ? ` (${cap(held)} a capital)` : ''}`) + R('Yours they hold', `${lost.length}${cap(lost) ? ` (${cap(lost)} a capital)` : ''}`) +
      R('Great battles won', won, 'tt-sub') + R('Lost', lostB, 'tt-sub') + R('At +25', 'you can demand what you hold', 'tt-sum') + F('From −100 to +100.');
  };
