// A different world each run: games started from the menu ask for a varied world (worlds.core.js), and the creation
// screen lets the player keep the world as written.
export default [
  {
    id: 'WORLD-DEFAULT',
    blob: 'ardan-core',
    why: 'A game started from the menu now asks for a varied world by default (A.WORLDS); the creation state carries the choice.',
    edits: [
      ['startAge:0,diff:"hard",seed:""}', 'startAge:0,diff:"hard",seed:"",world:"varied"}'],
      ['diff:c.diff,app:Object.assign({},c.app)', 'diff:c.diff,world:c.world||"varied",app:Object.assign({},c.app)'],
    ],
  },
  {
    id: 'WORLD-CHOICE',
    blob: 'ardan-core',
    why: 'The creation screen offers the choice next to the world seed: a varied world, or the world as written.',
    edits: [[
      ',h+=`<div class="field"><label>World seed (optional)</label>',
      ',h+=`<div class="field"><label>World</label><div class="opt-grid">${[["varied","Varied","Fortunes, borders, feuds and alliances differ each run."],["canon","As written","The world as the old maps show it."]].map(d=>UI.opt((c.world||"varied")===d[0],"crSet","world:"+d[0],d[1],d[2])).join("")}</div></div>`,h+=`<div class="field"><label>World seed (optional)</label>',
    ]],
  },
];
