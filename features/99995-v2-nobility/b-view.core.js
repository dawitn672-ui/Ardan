// v2 nobility, part 2: what the player sees. The court view (and the Realm view for a ruler) lists the pyramid in
// words: the crown's own counties, each duke with the counts and marches under him, the marches that answer to the
// crown, then the lower tiers as numbers ("under the counts, 52 viscounts, 160 barons and 690 lords"), never a row
// each. Your own county names its count and viscounts; calling on one is the only thing that stores a lower noble.
// Rendering is pure: lower nobles are read with A.V2N.lower, which draws only from streams seeded by the slot.
(function () {
  const N = A.V2N; if (!N || !N.court) return;
  const esc = s => UI.esc(String(s == null ? '' : s));
  const and = xs => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
  const who = p => p ? `<span class="click" data-a="ov" data-v="person:${esc(p.id)}">${esc(A.fullName(p))}</span>` : '<i>vacant</i>';
  const many = (n, rank) => `${n} ${N.rankName(rank, n)}`;

  N.countLine = function (t) {
    const p = N.holderOf(t), q = A.S.prov[t.seat];
    const lost = q && q.owner !== t.k.split(':')[0] ? ` <span class="muted">(${esc(q.name)} is now held by ${esc((A.realm(q.owner) || {}).short || 'another realm')})</span>` : '';
    return `${esc(A.provName(t.seat))}${t.crown ? '' : ` (${who(p)})`}${lost}`;
  };

  UI.v2nCourtCard = function (r, pc) {
    const c = r && N.court(r.id);
    if (!c) return '';
    const T = c.titles, s = c.summary, ru = A.P(r.ruler);
    const kids = k => T.filter(t => t.parent === k);
    const rows = [];
    const tiers = [s.dukes && many(s.dukes, 'duke'), s.marquises && many(s.marquises, 'marquis'), many(s.counts, 'count')].filter(Boolean);
    rows.push(`<div class="small">${esc(N.total(c).toLocaleString('en'))} nobles hold land in ${esc(r.short || r.name)}: ${esc(and(tiers))} under ${ru ? who(ru) : 'the crown'}; under the counts, ${esc(many(s.viscounts, 'viscount'))}, ${esc(many(s.barons, 'baron'))} and ${esc(many(s.lords, 'lord'))}.</div>`);
    const king = T.find(t => t.rank === 'king');
    const demesne = kids(king.k).filter(t => t.rank === 'count');
    const cap = demesne.find(t => t.crown);
    const own = demesne.filter(t => !t.crown);
    rows.push(`<div><b>The crown</b><div class="small">Holds ${cap ? esc(A.provName(cap.seat)) : 'its capital'} itself${own.length ? `; the counts of ${and(own.map(N.countLine))} answer to it directly` : ''}.</div></div>`);
    const big = T.filter(t => t.rank === 'duke' || (t.rank === 'marquis' && t.parent === king.k));
    for (const d of big) {
      const p = N.holderOf(d), under = kids(d.k);
      const counts = (d.rank === 'duke' ? under : [d, ...under]).filter(t => t.rank === 'count' && !t.heldWith);
      const marches = under.filter(t => t.rank === 'marquis');
      const style = p ? `${N.title(d.rank, p.sex)} of ${A.provName(d.seat)}` : d.name;
      const bits = [];
      if (counts.length) bits.push(`the ${counts.length === 1 ? 'count' : 'counts'} of ${and(counts.map(N.countLine))}`);
      for (const m of marches) {
        const mp = N.holderOf(m), mc = kids(m.k).filter(t => t.rank === 'count' && !t.heldWith);
        bits.push(`the March of ${esc(A.provName(m.seat))} (${who(mp)}${mc.length ? `, over ${and(mc.map(N.countLine))}` : ''})`);
      }
      rows.push(`<div><b>${esc(style)}</b>: ${who(p)}<div class="small">${d.rank === 'marquis' ? 'Holds the march for the crown' : 'Holds the duchy'}${bits.length ? '; under ' + (p && p.sex === 'F' ? 'her' : 'him') + ', ' + bits.join('; ') : ''}.</div></div>`);
    }
    // your county, if it is in this realm
    const home = pc && N.countyOf(r.id, pc.home);
    if (home) {
      const hp = N.holderOf(home), over = home.heldWith && N.titleOf(home.heldWith);
      const hold = home.crown ? 'The crown holds it.' : over ? `${esc(N.title(over.rank, hp ? hp.sex : 'M'))} of ${esc(A.provName(over.seat))}, who holds it with the ${over.rank === 'duke' ? 'duchy' : 'march'}: ${who(hp)}.` : `The ${esc(N.title('count', hp ? hp.sex : 'M').toLowerCase())}: ${who(hp)}.`;
      const vs = [];
      for (let i = 0; i < home.viscounts; i++) {
        const g = N.lower(r.id, home.seat, 'viscount', i);
        const p = g.pid && A.P(g.pid);
        vs.push(p && p.alive ? who(p) + ` <span class="muted">${esc(g.title)}</span>` : `<span class="click" data-a="v2nMeet" data-v="${esc(g.key)}">${esc(g.given)} ${esc(g.house)}</span> <span class="muted">${esc(g.title)}</span>`);
      }
      rows.push(`<div><b>Your county: ${esc(home.name)}</b><div class="small">${hold} Under ${home.crown ? 'the crown' : hp ? (hp.sex === 'F' ? 'her' : 'him') : 'the county'}: ${vs.join(', ')}; ${esc(many(home.barons, 'baron'))} and ${esc(many(home.lords, 'lord'))} with a village each.</div></div>`);
    }
    // one small card a row (90-fold folds a tall card to its first row, and nothing here is hidden behind a click)
    return `<div class="group-h">The great lords of ${esc(r.short || r.name)}</div><div class="v2n-court">${rows.map(x => `<div class="card v2n-row">${x}</div>`).join('')}</div>`;
  };

  Object.assign(UI.A, {
    v2nMeet(v) {
      const [rid, county, rank, i] = String(v).split('|');
      if (!N.court(rid) || !N.LOWER.includes(rank)) return;
      const p = N.meet(rid, +county, rank, +i);
      if (p) { UI.ov = 'person:' + p.id; UI.render(); }
    },
  });

  const court = UI.courtTab;
  UI.courtTab = function (pc) {
    let h = court.apply(this, arguments);
    try {
      const r = A.realm(pc && (pc.noble ? pc.noble.realm : pc.realm)), add = r ? UI.v2nCourtCard(r, pc) : '';
      const i = h.indexOf('<div class="group-h">The ladder');
      h = i >= 0 ? h.slice(0, i) + add + h.slice(i) : h + add;
    } catch (e) { console.error('v2-nobility court view', e); }
    return h;
  };
  const realmTab = UI.TAB.realm;
  if (realmTab) UI.TAB.realm = function (pc) {
    let h = realmTab.apply(this, arguments);
    try { const r = pc && A.realm(pc.ruler); if (r) h += UI.v2nCourtCard(r, pc); } catch (e) { console.error('v2-nobility realm view', e); }
    return h;
  };
})();
