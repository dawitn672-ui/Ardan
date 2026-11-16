// 999999-one-redraw: the story log is painted in place (UI.paintLog, redraw.core.js) and holds a window of years.
export default [
  {
    id: 'RD-LOG-REFRESH',
    blob: 'ardan-core',
    why: 'UI.refresh rebuilt the whole story log (innerHTML) on every call and then forced a layout to scroll it. ' +
      'UI.paintLog keeps the log\'s nodes, appends new lines, and scrolls in the next frame only when something was added.',
    edits: [[
      'lw&&(lw.innerHTML=UI.renderLogWrap()),UI.refreshTab();const lg=UI.$("#log");lg&&(lg.scrollTop=lg.scrollHeight),UI.focusRestore(_f)',
      'lw&&UI.paintLog(lw),UI.refreshTab(),UI.focusRestore(_f)',
    ]],
  },
  {
    id: 'RD-LOG-CLOCK',
    blob: 'ardan-core',
    why: 'UI.clkLight (the running clock) rebuilt the story log whenever it grew: the same in-place paint as UI.refresh.',
    edits: [[
      'if(lw&&changed){lw.innerHTML=UI.renderLogWrap();const lg=UI.$("#log");lg&&(lg.scrollTop=lg.scrollHeight)}',
      'lw&&changed&&UI.paintLog(lw);',
    ]],
  },
  {
    id: 'RD-LOG-WINDOW',
    blob: 'ardan-core',
    why: 'The page held 40 years of story (1,600 nodes at year 50), the whole effect of age on a desktop page. It holds ' +
      'UI.LOG_YEARS (2) now; "Show earlier years" (UI.logAll) still shows everything.',
    edits: [
      ['entries=UI.logAll?S.log:S.log.slice(-40)', 'entries=UI.logAll?S.log:S.log.slice(-(UI.LOG_YEARS||40))'],
      ['!UI.logAll&&S.log.length>40&&', '!UI.logAll&&S.log.length>(UI.LOG_YEARS||40)&&'],
    ],
  },
];
