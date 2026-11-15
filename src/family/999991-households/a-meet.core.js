// C6 households, part 1: how you met (docs/design/households.md, D-057). Every new entry of the player's relationships
// carries met: { y, at, by }: the year, the province where the player was, and why. A.link (the release, 03-engine-base)
// asks A.metNote for it whenever it creates an entry of the player's; this file answers.
//
// Why, in order: a caller's A.MEET.as(why, fn) around its links; the event being played (its id, set by the eventView and
// eventChoose stages below); else the link's own type (a spouse is met by marriage, a child at its birth, a comrade at
// work). No random draws; nothing here reads the game's stream.
(function () {
  const M = A.MEET = A.MEET || {};
  M.why = null;      // a caller's reason, while A.MEET.as runs
  M.ev = null;       // the event being shown or chosen
  M.as = function (why, fn) {
    const was = M.why; M.why = why;
    try { return fn(); } finally { M.why = was; }
  };
  // the reason a link of this type gives when nobody says
  M.BY_TYPE = {
    father: 'birth', mother: 'birth', sibling: 'birth', child: 'birth', grandchild: 'birth',
    spouse: 'marriage', betrothed: 'betrothal', inlaw: 'marriage', ex: 'marriage',
    comrade: 'work', colleague: 'work', superior: 'work', subordinate: 'work', master: 'work', servant: 'work',
    councillor: 'court', lord: 'court', student: 'teaching', mentor: 'teaching', lover: 'courting',
  };
  A.metNote = function (other, type) {
    const S = A.S, pc = S && A.P(S.pc);
    const by = M.why || M.ev || M.BY_TYPE[type] || 'meeting';
    return { y: S ? S.year : 0, at: pc && pc.home != null ? pc.home : null, by: String(by) };
  };

  // words for a reason (the person view): an event's title, or a plain phrase
  M.WORDS = {
    birth: 'at your birth', household: 'of your household', 'kin-visit': 'when the family gathered', parish: 'in your parish',
    marriage: 'by marriage', betrothal: 'by a betrothal', work: 'through your work', court: 'at court', teaching: 'over lessons',
    courting: 'courting', meeting: 'by chance', before: 'before your story begins', gathering: 'when the family gathered',
  };
  M.words = function (met) {
    if (!met) return '';
    const by = met.by || '';
    let how = M.WORDS[by];
    if (!how && A.EV && A.EV[by]) {
      const t = A.EV[by].title;
      how = typeof t === 'string' && !/\{/.test(t) ? `"${t}"` : 'in passing';
    }
    how = how || 'by chance';
    const where = met.at != null && A.S && A.S.prov && A.S.prov[met.at] ? ' in ' + A.provName(met.at) : '';
    return `Met ${how}${where}, ${met.y}.`;
  };

  // the event being played: setups and choices that link people record it as the reason
  A.addStage('A.eventView', 'households', evView => function (q) {
    if (!q || q.view) return evView.apply(this, arguments);
    const was = M.ev; M.ev = q.ev || was;
    try { return evView.apply(this, arguments); } finally { M.ev = was; }
  });
  A.addStage('A.eventChoose', 'households', choose => function () {
    const q = A.S && A.S.queue && A.S.queue[0], was = M.ev;
    M.ev = (q && q.type === 'event' && q.ev) || was;
    try { return choose.apply(this, arguments); } finally { M.ev = was; }
  });
})();
