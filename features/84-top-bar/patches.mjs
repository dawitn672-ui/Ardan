// The purse's debt in fewer words, so it fits beside the coin (the tooltip and the spoken label keep the full sentence).
export default [
  {
    id: 'TOP-DEBT',
    blob: 'ardan-core',
    why: 'UI: "(debt 12,345 suns)" beside "1,234,567 suns" took more room than the top bar has at laptop widths and was cut ' +
      'mid-word. It now reads "owes 12,345"; 59-tooltips\' aria-label and tooltip still give the debt in full.',
    edits: [['${pc.debt?` <span class="bad">(debt ${A.coin(pc.debt)})</span>`:""}', '${pc.debt?` <span class="bad" title="Debt: ${A.coin(pc.debt)}">owes ${A.fmt(pc.debt)}</span>`:""}']],
  },
];
