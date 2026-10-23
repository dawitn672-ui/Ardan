// Scenes that pick a beast now take it from what lives near home (A.beastsNear, which 76-beast-habitats keeps to the
// world bible's ranges), and step aside when nothing does, instead of falling back to a cave bear or a terrain guess.
// The scenes written for one land (the av_wild_* adventures, the hunters' commissions) were placed by hand and keep
// their own conditions.
export default [
  {
    id: 'BEAST-LAIR',
    blob: 'ardan-content',
    why: 'explore_lair drew one beast for its text and another for its fight, so the signs could be a wyrm\'s and the fight ' +
      'a bear\'s; the text\'s draw also ran while the screen was drawn. The text now names the beast the setup chose. With no ' +
      'beast near (the setup fell back to a cave bear, CRE-25, wherever it was) the scene is skipped.',
    edits: [
      ['text:p=>{const n=A.beastsNear(p),id=n.length?A.pick(n):null,c=id?LORE.creatures.find(x=>x.id===id):null;return c?`Scat, scratch marks',
        'text:(p,ctx)=>{const id=ctx&&ctx.beast,c=id?LORE.creatures.find(x=>x.id===id):null;return c?`Scat, scratch marks'],
      ['setup:(p,ctx)=>{const n=A.beastsNear(p);ctx.beast=n.length?A.pick(n):"CRE-25"},choices:[{t:"Wait for it and fight"',
        'setup:(p,ctx)=>{const n=A.beastsNear(p);n.length?ctx.beast=A.pick(n):ctx.skip=1},choices:[{t:"Wait for it and fight"'],
    ],
  },
  {
    id: 'BEAST-NEAR-HELPER',
    blob: 'ardan-content',
    why: 'The hs_* scenes\' beastNear helper fell back to a cave bear (CRE-25) when no beast lives near home; cave bears ' +
      'live in two regions. The scene is now skipped there instead.',
    edits: [[
      'ctx.beast=b.length?A.pick(b):"CRE-25",A.BEASTS[ctx.beast]||(ctx.beast="CRE-25");',
      'b.length?ctx.beast=A.pick(b):(ctx.beast="CRE-25",ctx.skip=1),A.BEASTS[ctx.beast]||(ctx.beast="CRE-25");',
    ]],
  },
  {
    id: 'BEAST-SPEAR',
    blob: 'ardan-content',
    why: 'C_beast picked the spear-hunt\'s beast by terrain alone (a hell boar in any forest). Its pick stands where canon ' +
      'puts that beast; elsewhere it takes a beast that does live near home, and the hunt is skipped where none does.',
    edits: [
      ['C_beast=p=>{const t=(A.prov(p.home)||{}).terr;return t==="steppe"?"CRE-35":t==="mountains"?"CRE-25":t==="forest"||t==="tundra"?A.pick(["CRE-21","CRE-23"]):"CRE-23"}',
        'C_beast0=p=>{const t=(A.prov(p.home)||{}).terr;return t==="steppe"?"CRE-35":t==="mountains"?"CRE-25":t==="forest"||t==="tundra"?A.pick(["CRE-21","CRE-23"]):"CRE-23"},' +
        'C_beast=p=>{const id=C_beast0(p);if(!A.BH||A.BH.suits(id,A.prov(p.home)))return id;const n=(A.beastsNear(p)||[]).filter(x=>A.beastTier(x)!=="legend");return n.length?A.pick(n):null}'],
      ['setup:(p,ctx)=>{ctx.beast=C_beast(p)},title:"Set the spear"', 'setup:(p,ctx)=>{(ctx.beast=C_beast(p))||(ctx.skip=1)},title:"Set the spear"'],
    ],
  },
];
