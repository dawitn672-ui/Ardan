// 01-stages: the manifest (X2, D-056). The staged functions and the order of their stages, innermost first: the first
// name runs closest to the release's own definition, the last is outermost (it runs first and finishes last).
//
// A stage is registered by its feature with A.addStage(key, name, spec) (stages.core.js); its name is the feature's folder
// name without the number, then ".part" when the feature has more than one stage on the same function. The order here
// is the order the folder names gave when the wrappers were converted (X2), and it now decides: a feature that loads
// earlier than its place still runs at its place. A new stage is added here, where it should run; tools/lint-stages.mjs
// fails on a stage that is not listed, and the page reports one with console.error.
A.FN_STAGE_ORDER = {
  'A.applyFx': [
    'skills', 'moods', 'sieges', 'orders', 'schemes', 'friend-circles', 'life-arcs', 'realm-customs', 'body-mind.body',
    'body-mind.mind', 'arcs-kin', 'arcs-rivals', 'arcs-world', 'arcs-things', 'bonds', 'court-and-treasury',
    'npc-beliefs', 'every-number-counts', 'one-battle-two-scales', 'old-age', 'first-life-fixes', 'journeys',
    'identity.name', 'identity.ripe', 'identity.thought',
    'polity.po', 'polity.fate', 'commands', 'men', 'companies', 'advisors', 'v2-stats'
  ],
  'A.eventView': [
    'character-voices', 'world-chronicle', 'choice-memories', 'fight-odds', 'first-life-fixes', 'choice-stakes',
    'advisors', 'v2-stats', 'v2-family', 'v2-content.lines', 'v2-content.cards', 'households', 'x3-honest-cards', 'journal'
  ],
  'A.eventChoose': [
    'variety-guard', 'belief-versus-truth', 'skills', 'moods', 'body-mind', 'bonds', 'npc-beliefs',
    'choice-memories', 'every-number-counts', 'echo-scenes', 'first-life-fixes.origin', 'first-life-fixes', 'wilds',
    'confidants', 'identity', 'choice-stakes', 'advisors', 'v2-stats', 'v2-content', 'households', 'journal'
  ],
  'A.newGame': [
    'starting-stories', 'varied-worlds', 'event-cut', 'mods', 'markets', 'fresh-realms-and-tensions',
    'top-bar', 'visual-style', 'big-moments', 'first-life-fixes.hints', 'first-life-fixes.acts',
    'first-life-fixes.shield', 'hall-of-lives', 'identity.mark', 'companies', 'v2-stats', 'v2-family',
    'v2-nobility', 'households', 'households.guard', 'names-and-cultures', 'v2-saves', 'skills', 'one-redraw.fresh', 'journal'
  ],
  'UI.render': [
    'npc-initiative', 'accessibility', 'descriptions.relink', 'illuminated-chronicle', 'phone',
    'collapsible-sections', 'visual-style', 'scene-card', 'icons', 'big-moments.moments', 'big-moments.motion',
    'first-life-fixes.reasons', 'choice-stakes.draw', 'v2-time.draw', 'v2-stats.words', 'v2-stats.numbers',
    'click-open', 'next-year', 'bodies', 'one-redraw'
  ],
  'UI.refresh': [
    'npc-initiative', 'descriptions.relink', 'collapsible-sections', 'visual-style', 'icons', 'big-moments.moments',
    'big-moments.motion', 'first-life-fixes.reasons', 'choice-stakes.draw', 'v2-time.watch', 'v2-time.draw',
    'click-open', 'next-year', 'one-redraw'
  ],
  'UI.renderModal': [
    'npc-initiative', 'endings', 'descriptions', 'phone', 'playtest-log', 'title-screen-in-view',
    'collapsible-sections', 'visual-style', 'scene-card', 'big-moments.moments', 'big-moments.motion',
    'first-life-fixes.reasons', 'action-feedback', 'choice-stakes.draw', 'v2-time', 'click-open', 'next-year',
    'one-redraw.counted'
  ],
};
