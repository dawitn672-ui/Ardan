// War in the Far Lands: the chronicle's grammar for far realms (e-words.core.js). Each edit asks A.realmRef /
// A.realmVerb / A.realmNamePlural when they exist; they return the release's own words outside a far game.
export default [
  {
    id: 'FW-WAR-WORDS',
    blob: 'ardan-core',
    why: 'The end of a war was written "<short> wins and takes ... from <short>" / "<short> pays tribute". Many far short names ' +
      'are plural nouns, so the news read "Frost Riders wins", "Sand Clans wins; Sabra pays tribute". The subject now takes ' +
      'its article and a verb that agrees ("the Frost Riders win"), in far realms only.',
    edits: [
      ['${A.realmShort(winL)} wins`', '${A.realmVerb?A.realmVerb(winL,"wins","win"):A.realmShort(winL)+" wins"}`'],
      ['from ${A.realmShort(loseL)}.`', 'from ${A.realmRef?A.realmRef(loseL):A.realmShort(loseL)}.`'],
      ['; ${A.realmShort(loseL)} pays tribute.`', '; ${A.realmVerb?A.realmVerb(loseL,"pays","pay"):A.realmShort(loseL)+" pays"} tribute.`'],
    ],
  },
  {
    id: 'FW-FALL-WORDS',
    blob: 'ardan-core',
    why: 'A fallen realm was "<name> is no more", so "The Ouro Hunters is no more". A plural far name now takes "are".',
    edits: [['A.news(r.name+" is no more"', 'A.news(r.name+(A.realmNamePlural&&A.realmNamePlural(r)?" are no more":" is no more")']],
  },
];
