// 9999905-five-ranks: the host as a reading of the war map (W1-1, D-064 points 1 to 3, D-066).
//
// Five ranks (soldier, sergeant, captain, commander, General) and four units: a section of about 12, a company of about
// 200, a wing of 600 to 3,000 (a battalion of the war map), a host of 3,000 to 12,000 (a division of the war map). One
// General to each host, so the realm's Generals follow the size of what it fields; a division under 3,000 men is a
// column under a Commander. An army is everything one side has on one campaign: one host or several. Of two hosts or
// more, its general (a.gen, the post army:<id>) is the commanding General, by the king's written word for that war
// (a commission, not a rank: it ends when the army is stood down); with one host, he is that host's General.
//
// A host's General is a person when one holds it (the division's commander, d.cmd: the player at a General's grade,
// the senior General of the crown's first host, a man the crown named), else the army's general when the army is that
// one host, else a name the host gives itself (A.oobLeader: a pure function of the realm and the division's id, as a
// company's seed captain is in 9997): the same man in every view and every replay, at no cost in the save. Pure:
// nothing here draws on the random stream or writes the state.
(function () {
  const H = A.HOSTS = A.HOSTS || {};
  H.MIN = 3e3;          // fewer men than this is a column, under a Commander
  H.MAX = 12e3;         // as many men as one man can lead from one hill
  const live = p => !!(p && p.alive);
  const armyOf = id => (id && A.army ? A.army(id) : null);
  const isHost = d => !!d && (d.men || 0) >= H.MIN;
  H.isHost = isHost;

  // the hosts of an army (pure)
  H.armyHosts = a => (A.armyDivs ? A.armyDivs(a) : []).filter(isHost);

  // who leads division d: { pid, name, rank, title, seed, by } — a person, else the army's general (an army of one
  // host), else the host's own seed name. rank 6 (General) for a host, 5 (Commander) for a column.
  H.leader = function (d) {
    if (!d) return null;
    const host = isHost(d), rank = host ? 6 : 5, title = host ? 'General' : 'Commander';
    const p = d.cmd ? A.P(d.cmd) : null;
    if (live(p)) return { pid: p.id, name: A.fullName(p, false), rank, title, by: d.elite ? 'order' : 'post' };
    const a = armyOf(d.army), g = a && a.gen ? A.P(a.gen) : null;
    if (a && live(g)) {
      const hs = H.armyHosts(a);
      // an army of one host is led by that host's General; an army of one column, by its Commander
      if ((host && hs.length === 1 && hs[0] === d) || (!host && !hs.length && a.divs.length === 1))
        return { pid: g.id, name: A.fullName(g, false), rank, title, by: 'army' };
    }
    const s = A.oobLeader ? A.oobLeader(d.r, 'H:' + d.id, rank) : { name: 'an officer' };
    return { pid: null, name: s.name, rank, title, by: 'seed' };
  };

  // the hosts and columns of realm rid: [{ div, name, men, army, host, first, order, general }]
  H.of = function (rid) {
    const r = A.realm ? A.realm(rid) : null;
    if (!r || r.alive === false || !r.forces || !Array.isArray(r.forces.divs)) return [];
    const first = A.POSTS && A.POSTS.firstHost ? A.POSTS.firstHost(r) : null;
    return r.forces.divs.filter(Boolean).map(d => ({
      div: d.id, name: d.name, realm: d.r, men: d.men || 0, army: d.army || null, host: isHost(d),
      first: !!first && first.id === d.id, order: !!d.elite, general: H.leader(d),
    }));
  };
  // every host and column of the living realms
  H.all = function () {
    const out = [];
    for (const id of Object.keys((A.S && A.S.realms) || {})) for (const x of H.of(id)) out.push(x);
    return out;
  };
  // an army's command: its hosts, and who commands it (the king in person, the commanding General by commission, or
  // with nobody named a council of war)
  H.army = function (a) {
    if (!a) return null;
    const hosts = H.armyHosts(a), g = a.gen ? A.P(a.gen) : null, r = A.realm ? A.realm(a.realm) : null;
    const king = live(g) && r && r.ruler === g.id;
    return {
      id: a.id, name: a.name, men: A.armyMen ? A.armyMen(a) : 0, hosts: hosts.length,
      commander: live(g) ? g.id : null,
      as: !live(g) ? (hosts.length >= 2 ? 'council of war' : 'none') : king ? 'king' : hosts.length >= 2 ? 'commission' : hosts.length ? 'general' : 'column',
    };
  };
  // the words for an army's commander, for a view
  H.commandWords = function (a) {
    const c = H.army(a);
    if (!c) return '';
    return c.as === 'king' ? 'the king in person' : c.as === 'commission' ? "its commanding General, by the king's written word for this war"
      : c.as === 'general' ? 'its General' : c.as === 'column' ? 'a Commander (a column under 3,000 men)' : c.as === 'council of war' ? 'a council of its Generals' : 'nobody';
  };
})();
