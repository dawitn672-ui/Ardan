// v2 family (docs/v2/V2_SPEC.md integration step 5): the smallest edits that hand the release's family, picker and
// succession code to this folder's core files. Each find is checked against the build (count 1).
export default [
  {
    id: 'V2F-PICKER-COMMON',
    blob: 'ardan-core',
    why: 'UI.crStepBirth offered "Place in the family" (heir, younger child, cousin\'s branch) for a commoner family. The ' +
      'owner removed the choice (complaint 14): the field is no longer drawn, and a short note says the family decides.',
    edits: [['c.house&&c.status!=="noble"&&c.status!=="royal"&&(h+=`', 'c.house&&c.status!=="noble"&&c.status!=="royal"&&(h+=UI.crPlaceNote?UI.crPlaceNote(c):""),!1&&(h+=`']],
  },
  {
    id: 'V2F-PICKER-NOBLE',
    blob: 'ardan-core',
    why: 'UI.crStepBirth offered heir, younger child, cadet branch or bastard for a noble or royal birth. The field is no ' +
      'longer drawn (complaint 14); the same note takes its place.',
    edits: [
      ['{h+=`<div class="field"><label>Place in the family</label>', '{h+=UI.crPlaceNote?UI.crPlaceNote(c):"";!1&&(h+=`<div class="field"><label>Place in the family</label>'],
      ['.join("")}</div></div>`;const bl=c.house?A.houseBloodline(c.house):null;if(bl){', '.join("")}</div></div>`);const bl=c.house?A.houseBloodline(c.house):null;if(bl){'],
    ],
  },
  {
    id: 'V2F-RANDOMIZE',
    blob: 'ardan-core',
    why: 'UI.crRandomize drew a birth position with the rest of a random character. There is none to draw now.',
    edits: [['c.order=A.pick(["heir","younger","younger","cadet","bastard"]),', 'c.order=null,']],
  },
  {
    id: 'V2F-ELDER',
    blob: 'ardan-core',
    why: 'A.newGame set the number of elder siblings from the chosen birth position (none for the heir, 1-3 for a younger ' +
      'child). It now comes from the family\'s own seed (b-family.core.js F.elderCount: v2 createPlayerFamily\'s weights).',
    edits: [['const olderN=o.order==="heir"||o.status==="royal"&&startAge>=R2.adult&&o.order==="heir"?0:o.order==="younger"?A.ri(1,3):A.ri(0,2)',
      'const olderN=A.V2F&&A.V2F.elderCount?A.V2F.elderCount(o):o.order==="heir"||o.status==="royal"&&startAge>=R2.adult&&o.order==="heir"?0:o.order==="younger"?A.ri(1,3):A.ri(0,2)']],
  },
  {
    id: 'V2F-INHERITFROM',
    blob: 'ardan-core',
    why: 'A.inheritFrom moved a dead parent\'s rung and house headship to the player when the player was the eldest son. ' +
      'Titles now move only in A.V2F.inherit, at the death itself, by the house law; the coin share stays here.',
    edits: [
      ['dead.noble&&dead.noble.rung>=2&&!pc.flags.bastard){const kids=', '!A.V2F&&dead.noble&&dead.noble.rung>=2&&!pc.flags.bastard){const kids='],
      ['if(dead.house&&A.S.houses[dead.house]&&A.S.houses[dead.house].headPid===dead.id&&pc.house===dead.house&&!pc.flags.bastard){',
        'if(!A.V2F&&dead.house&&A.S.houses[dead.house]&&A.S.houses[dead.house].headPid===dead.id&&pc.house===dead.house&&!pc.flags.bastard){'],
    ],
  },
  {
    id: 'V2F-CONTINUE',
    blob: 'ardan-core',
    why: 'A.continueAs copied the old life\'s rung to whichever child the player went on as. The rung now passes by the ' +
      'house law (A.V2F.inherit(old, heir)): to that child only if the law names them.',
    edits: [['old&&old.noble&&old.noble.rung>=2&&!p.noble&&(p.noble=Object.assign({},old.noble))',
      'old&&old.noble&&old.noble.rung>=2&&(A.V2F&&A.V2F.inherit?A.V2F.inherit(old,p):!p.noble&&(p.noble=Object.assign({},old.noble)))']],
  },
  {
    id: 'V2F-GRANT',
    blob: 'ardan-core',
    why: 'A ruler\'s "grant" (A.rulerAction) gave every grantee the realm\'s first province, so two lords could hold one ' +
      'land (and the crown\'s own capital). It now takes a province no one else holds (A.V2F.freeHolding).',
    edits: [['holding:(A.realmProvs(r.id)[0]||A.prov(p.home)).id}', 'holding:A.V2F&&A.V2F.freeHolding?A.V2F.freeHolding(r.id,p.home,p):(A.realmProvs(r.id)[0]||A.prov(p.home)).id}']],
  },
  {
    id: 'V2F-PETITION',
    blob: 'ardan-core',
    why: 'A granted petition for a rung of 4 or more (A.nobleAction) drew any province of the realm, held or not. The draw ' +
      'stays (the stream does not move) and the province is then checked against every other holder.',
    edits: [['holding:nr>=4?pc.noble&&pc.noble.holding!=null?pc.noble.holding:rp.length?A.pick(rp).id:pc.home:pc.noble?pc.noble.holding:null}',
      'holding:nr>=4?pc.noble&&pc.noble.holding!=null?pc.noble.holding:rp.length?A.V2F&&A.V2F.freeHolding?A.V2F.freeHolding(r.id,A.pick(rp).id,pc):A.pick(rp).id:pc.home:pc.noble?pc.noble.holding:null}']],
  },
  {
    id: 'V2F-PEOPLE-GROUP',
    blob: 'ardan-core',
    why: 'UI.peopleList grouped people by rel.type, so a wife whose bond had turned to "rival" was listed under Rivals. ' +
      'Kin and spouses now group under Family by the family graph (A.V2F.groupType), whatever the bond.',
    edits: [['list=rels.filter(x=>UI.relGroups[g].includes(x.r.type))', 'list=rels.filter(x=>UI.relGroups[g].includes(A.V2F&&A.V2F.groupType?A.V2F.groupType(pc,x.p,x.r):x.r.type))']],
  },
  {
    id: 'V2F-ROSTER-GROUP',
    blob: 'ardan-core',
    why: 'A.roster put a plain soldier\'s messmates ("in your mess") in the group "Under you", so the People tab\'s Around ' +
      'you card and the person view listed a private\'s fellow privates as under him (playtest 2, old #15). The group shown ' +
      'is now A.V2F.rosterGroup(x): messmates stand "Beside you" until you lead them (a sergeant\'s men stay "Under you"). ' +
      'Only the heading changes: the roster entry keeps its group, which A.getToKnow and 30-get-to-know read for the bond.',
    edits: [
      ['for(const x of ro)(groups[x.grp]=groups[x.grp]||[]).push(x)', 'for(const x of ro){const gk=A.V2F&&A.V2F.rosterGroup?A.V2F.rosterGroup(x):x.grp;(groups[gk]=groups[gk]||[]).push(x)}'],
      ['ro&&does.push(A.cap(ro.role)+(ro.grp?" ("+ro.grp.toLowerCase()+")":""))', 'ro&&does.push(A.cap(ro.role)+(ro.grp?" ("+(A.V2F&&A.V2F.rosterGroup?A.V2F.rosterGroup(ro):ro.grp).toLowerCase()+")":""))'],
    ],
  },
];
