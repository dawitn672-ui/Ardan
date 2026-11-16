// Drill: the line battle a commander leads from the war map takes its drill from the divisions really in the fight,
// and the battle screen shows each wing's drill. Everything else is in drill.core.js (wrappers on A.newBattle,
// A.buildUnits, A.tacticsFor, A.tfx, A.wingClash, A.sideMake, A.tacDay and A.WTAC[k].ok).
export default [
  {
    id: 'DRILL-LEAD-DIVS',
    blob: 'ardan-core',
    why: 'A.wsLeadBattle builds a line battle from the divisions in a war-map fight but passes only their men. It now also passes the divisions (sideA.divs, sideB.divs), so the battle\'s units carry the drill those divisions have (A.DRILL.side). A.newBattle does not keep them.',
    edits: [
      ['sideA:{realm:myR,name:A.realmShort(myR),men:menA,', 'sideA:{realm:myR,name:A.realmShort(myR),men:menA,divs:friends,'],
      ['sideB:{realm:foes[0].r,name:A.realmShort(foes[0].r),men:menB,', 'sideB:{realm:foes[0].r,name:A.realmShort(foes[0].r),men:menB,divs:foes,'],
    ],
  },
  {
    id: 'DRILL-BATTLE-WING',
    blob: 'ardan-core',
    why: 'The wing tactic menu in UI.battleModalBasic names each tactic only. Each option now says how well the men have drilled it (A.drillTag, plain text, escaped here), and under the menu A.drillWingNote (escaped HTML) lists the formations this wing never drilled and so cannot use.',
    edits: [
      ['${UI.esc(GD.BATTLE_TACTICS[k].name)}</option>', '${UI.esc(GD.BATTLE_TACTICS[k].name+(A.drillTag?A.drillTag(B,side,w,k):""))}</option>'],
      ['<div class="tacdesc">${UI.esc(L?L.desc:T.desc||"")}</div></div>`', '<div class="tacdesc">${UI.esc(L?L.desc:T.desc||"")}</div>${A.drillWingNote?A.drillWingNote(B,side,w):""}</div>`'],
    ],
  },
];
