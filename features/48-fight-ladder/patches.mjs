export default [
  {
    id: 'FL-DUEL-VERBS',
    blob: 'ardan-core',
    why: 'The duel log put the foe\'s move in the third person by adding an s to your verb: "Kettil rushs", "Kettil close ins" (playtest 2, old 17). In the source: give the round line its own third-person verbs (strikes, feints, guards, rushes, closes in).',
    edits: [['nm[bAct]+"s"', '({strike:"strikes",feint:"feints",guard:"guards",press:"rushes",grapple:"closes in"}[bAct]||nm[bAct]+"s")']],
  },
];
