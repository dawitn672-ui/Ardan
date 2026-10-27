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
  {
    id: 'TOP-CLOCK-BUDGET',
    blob: 'ardan-core',
    why: 'UI: the running clock simulated days for up to 70 ms of every 100 ms tick. On the Great Continent a slow laptop ' +
      'spent nearly all its time in those ticks, so a click on Menu or Pause could wait seconds (CI run on b0654e3: 30 s). ' +
      'The budget is UI.CLK_BUDGET (35 ms): fewer days per tick, the same days in the same order, so the world is unchanged.',
    edits: [['steps<60&&Date.now()-t0<70', 'steps<60&&Date.now()-t0<(UI.CLK_BUDGET||70)']],
  },
  // three small guards found on the round-10 design pass (coordinator's leave; not the top bar's own)
  {
    id: 'TOP-PLAYTEST-GUARD',
    blob: 'ardan-core',
    why: 'UI: the playtest bar\'s Start and Skip (ptGo, ptSkip) threw "Cannot read properties of null" when pressed with no ' +
      'playtest under way (its markup can outlive UI.pt, as in the War Room). With nothing to start or skip they now do nothing.',
    edits: [
      ['ptGo(){const P=UI.pt,T=UI.TASKS[P.i];', 'ptGo(){const P=UI.pt;if(!P||!UI.TASKS[P.i])return;const T=UI.TASKS[P.i];'],
      ['ptSkip(){const P=UI.pt;P.results.push', 'ptSkip(){const P=UI.pt;if(!P||!UI.TASKS[P.i])return;P.results.push'],
    ],
  },
  {
    id: 'TOP-FAMFILTER-PRESSED',
    blob: 'ardan-core',
    why: 'UI: the creation screen\'s family filter showed the current choice only by colour. Each button now carries ' +
      'aria-pressed, so "All" reads as chosen when it is to a screen reader. (A class "on" as well made 71-phone\'s stylesheet ' +
      'restyle it on the desktop: phoneDesktopSame.)',
    edits: [
      ['<button class="small ${filt==="all"?"primary":""}" data-a="crFamFilter" data-v="all">All</button>',
        '<button class="small ${filt==="all"?"primary":""}" data-a="crFamFilter" data-v="all" aria-pressed="${filt==="all"}">All</button>'],
      ['<button class="small ${filt===k?"primary":""}" data-a="crFamFilter" data-v="${k}">',
        '<button class="small ${filt===k?"primary":""}" data-a="crFamFilter" data-v="${k}" aria-pressed="${filt===k}">'],
    ],
  },
];

