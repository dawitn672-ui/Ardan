// The playtest results file carries the session log (playtest-log.core.js) beside the ten task results.
export default [
  {
    id: 'PTLOG-SAVE',
    blob: 'ardan-core',
    why: 'Playtest readiness: the results file held only the ten timed tasks. It now also holds what the player did in the ' +
      'session (controls used, events answered and how long each was read, tabs, pauses, errors, where they stopped).',
    edits: [['results:P.results}', 'results:P.results,session:UI.ptLog&&UI.ptLog.report?UI.ptLog.report():null}']],
  },
];
