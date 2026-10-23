// The top bar's right-hand side (place, purse, Save, Menu) as one group, and the purse's debt in fewer words.
export default [
  {
    id: 'TOP-GROUP',
    blob: 'ardan-core',
    why: 'UI: with the place, purse, Save and Menu as separate items of a bar that could not wrap, a narrow desktop crushed ' +
      'the place and purse to nothing; allowed to wrap, Menu dropped to a line of its own. As one group they wrap together.',
    edits: [
      ['\n    <div class="info top-info"><span class="top-home" title="Home">', '\n    <div class="top-right"><div class="info top-info"><span class="top-home" title="Home">'],
      ['<span class="bt">Menu</span></button>`:""}', '<span class="bt">Menu</span></button></div>`:""}'],
    ],
  },
  {
    id: 'TOP-DEBT',
    blob: 'ardan-core',
    why: 'UI: "(debt 12,345 suns)" beside "1,234,567 suns" took more room than the top bar has at laptop widths and was cut ' +
      'mid-word. It now reads "owes 12,345"; 59-tooltips\' aria-label and tooltip still give the debt in full.',
    edits: [['${pc.debt?` <span class="bad">(debt ${A.coin(pc.debt)})</span>`:""}', '${pc.debt?` <span class="bad" title="Debt: ${A.coin(pc.debt)}">owes ${A.fmt(pc.debt)}</span>`:""}']],
  },
];
