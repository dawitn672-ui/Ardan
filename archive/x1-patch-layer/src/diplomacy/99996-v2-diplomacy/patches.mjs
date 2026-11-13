// Step 7 of docs/V2_SPEC.md: the release's treaty dice give way to A.V2.diplomacy.monthTick (diplomacy.core.js).
// Two small edits; everything else is wrappers in the core file.
export default [
  {
    id: 'V2DIP-NO-DRIFT',
    blob: 'ardan-core',
    why: 'A.diplomacyYear: every realm\'s opinion of every other moved by a random -2..+2 each year, a reason nobody could name. With v2 diplomacy on, opinion moves only for named reasons (the slow fade toward 0 stays).',
    edits: [
      ['v+=A.ri(-2,2),r.rel[o.id]', 'v+=A.V2DIP&&A.V2DIP.ON?0:A.ri(-2,2),r.rel[o.id]'],
    ],
  },
  {
    id: 'V2DIP-NO-PCT',
    blob: 'ardan-core',
    why: 'The Realm > Diplomacy header showed trade income as "+N% income". The owner asked for no percentages: say whether trade adds income, in words.',
    edits: [
      ['Trade ${Object.keys(r.pacts.trade).length} (+${Math.round((A.tradeMul(r)-1)*100)}% income)',
        'Trade ${Object.keys(r.pacts.trade).length}${A.tradeMul(r)>1.005?" (adds to your income)":""}'],
    ],
  },
  {
    id: 'V2DIP-SEEN-REALMS',
    blob: 'ardan-core',
    why: 'Playtest 1 #22: a peasant saw every realm\'s people, army and stability as exact figures. What you know depends on who you are (A.V2DIP.seen, knowledge.core.js): the World > Realms table, the realm card and the diplomacy card say it as an estimate or as hearsay unless you rule that realm.',
    edits: [
      ['<td>${A.fmt(r.pop)}</td><td>${A.fmt(r.army)}</td><td>${Math.round(r.stability)}</td>',
        '<td>${UI.esc(A.V2DIP?A.V2DIP.popText(r):A.fmt(r.pop))}</td><td>${UI.esc(A.V2DIP?A.V2DIP.armyText(r):A.fmt(r.army))}</td><td>${UI.esc(A.V2DIP?A.V2DIP.stabText(r):Math.round(r.stability))}</td>'],
      [' · ${A.fmt(r.pop)} people · army ${A.fmt(r.army)} · stability ${Math.round(r.stability)}</div>',
        ' · ${UI.esc(A.V2DIP?A.V2DIP.popText(r):A.fmt(r.pop)+" people")} · army ${UI.esc(A.V2DIP?A.V2DIP.armyText(r):A.fmt(r.army))} · ${UI.esc(A.V2DIP?A.V2DIP.stabText(r):"stability "+Math.round(r.stability))}</div>'],
      ['${A.fmt(o.pop)} people · army ${A.fmt(o.army)} · ',
        '${UI.esc(A.V2DIP?A.V2DIP.popText(o):A.fmt(o.pop)+" people")} · army ${UI.esc(A.V2DIP?A.V2DIP.armyText(o):A.fmt(o.army))} · '],
    ],
  },
  {
    id: 'V2DIP-BLOCS',
    blob: 'ardan-core',
    why: 'Playtest 1 #22: World > Diplomacy chained alliances into one "bloc" of all 33 realms (A allied to B, B to C...). A bloc is now realms each allied to every other member, and its strength is said as you would know it.',
    edits: [
      ['for(const a of A.realm(x).allies)!seen.has(a)&&A.realm(a)&&A.realm(a).alive&&(seen.add(a),q.push(a))',
        'for(const a of A.realm(x).allies)!seen.has(a)&&A.realm(a)&&A.realm(a).alive&&bl.every(y=>y.allies.includes(a))&&q.every(z=>A.realm(z).allies.includes(a))&&(seen.add(a),q.push(a))'],
      ['Combined army ${A.fmt(bl.reduce((a,x)=>a+x.army,0))}',
        'Combined army ${UI.esc(A.V2DIP?A.V2DIP.blocArmy(bl):A.fmt(bl.reduce((a,x)=>a+x.army,0)))}'],
    ],
  },
  {
    id: 'V2DIP-COALITION',
    blob: 'ardan-core',
    why: 'Playtest 1 #22: a coalition took every realm whose opinion of the conqueror was under 20 (22 of 33, most of them cordial). A member must now stand cold or worse with it by the one derived status (A.V2DIP.status), which counts fear of its conquests as a reason.',
    edits: [
      ['&&A.relBetween(m.id,t.id)<20&&', '&&(A.V2DIP&&A.V2DIP.ON?A.V2DIP.COLD.includes(A.V2DIP.status(m.id,t.id)):A.relBetween(m.id,t.id)<20)&&'],
    ],
  },
];
