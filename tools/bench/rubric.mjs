// What "good" means, per aspect, for numbers a bot or test can measure.
// score(v) returns 0..1. cap is the share of a 10 that measurement alone can prove: feel, clarity and art need people,
// so those aspects are capped until playtests exist. Targets come from docs/plan (the Road to Ten) and docs/benchmarks.
const clamp = x => Math.max(0, Math.min(1, x));
const atLeast = t => v => clamp(v / t);
const atMost = (t, zero) => v => clamp((zero - v) / (zero - t));
const near = (t, tol) => v => clamp(1 - Math.abs(v - t) / tol);

export const RUBRIC = [
  { aspect: 'Events and story', cap: .8, metrics: [
    { name: 'Events that read an earlier memory (all events)', path: 'events.memorySharePct', target: '≥ 40%', weight: 3, score: atLeast(40) },
    { name: 'Fired events that read a memory (bot lives)', path: 'league.memoryShareOfFiredEvents', target: '≥ 40%', weight: 3, score: atLeast(40) },
    { name: 'Flags set but never read', path: 'events.orphanFlags', target: '0', weight: 2, score: atMost(0, 369) },
    { name: 'Strict recipe events (2–3 choices, a roll, stat nudges only)', path: 'events.strictRecipePct', target: '≤ 10%', weight: 1, score: atMost(10, 30) },
    { name: 'Events with an obviously best choice (of those comparable by numbers)', path: 'events.obviouslyBestPct', target: '0%', weight: 1, score: atMost(0, 15) },
    { name: 'Old-age events', path: 'events.oldAgeEvents', target: '≥ 150', weight: 1, score: atLeast(150) },
  ] },
  { aspect: 'Power scaling', cap: .9, metrics: [
    { name: 'Largest gap between shown and real duel odds', path: 'duels.maxShownVsActualErrorPct', target: '≤ 5 points', weight: 3, score: atMost(5, 20) },
    { name: 'Player-seat edge in even duels', path: 'duels.playerSeatEdgeSameTierPct', target: '±5 points', weight: 1, score: v => clamp(1 - (Math.abs(v) - 5) / 15) },
  ] },
  { aspect: 'Character and life sim', cap: .7, metrics: [
    { name: 'Check success rate in bot lives', path: 'league.checkWinRate', target: '45–65%', weight: 2, score: near(55, 25) },
    { name: 'Initiative actions per year (engaged bot)', path: 'league.initiativeActionsPerYear_engaged', target: '≥ 6', weight: 1, score: atLeast(6) },
  ] },
  { aspect: 'Relationships and people', cap: .7, metrics: [
    { name: 'NPC-started moves toward the player per decade', path: 'league.npcMovesPerDecade', target: '≥ 3', weight: 3, score: atLeast(3) },
  ] },
  { aspect: 'War', cap: .7, metrics: [
    { name: 'Battles the player fought that end with an after-action report', path: 'league.afterActionShare', target: '100%', weight: 2, score: atLeast(100) },
    { name: 'War-map tick, 95th percentile, in a year of six wars', path: 'perf.warTick.p95', target: '≤ 50 ms', weight: 1, score: atMost(50, 200) },
  ] },
  { aspect: 'Diplomacy and politics', cap: .8, metrics: [
    { name: 'War declarations: aggressive vs peaceful rulers (per ruler-year)', path: 'ai.aggressiveToPeacefulRatio', target: '≥ 2×', weight: 3, score: v => clamp((v - 1) / 1) },
  ] },
  { aspect: 'Economy', cap: .7, metrics: [
    { name: 'Best buy-then-sell-back loop (10 round trips)', path: 'economy.bestBuySellBackLoop10x', target: '≤ 0 suns', weight: 3, score: v => v <= 0 ? 1 : clamp(1 - v / 300) },
    { name: 'Median price spread across markets (max/min)', path: 'economy.medianPriceRatioMaxMin', target: '1.5–3×', weight: 1, score: v => v >= 1.5 && v <= 3 ? 1 : .5 },
  ] },
  { aspect: 'Balance and difficulty', cap: .7, metrics: [
    // canon (canon/peoples/races.csv): humans who reach 20 usually live to 55-65. Full marks inside the band, half marks
    // 7 years outside it, none at 14. (This replaced 'humans and orcs from birth, 55-70', which pooled two peoples with
    // different lifespans and counted the child deaths canon expects.)
    { name: 'Median death age, humans who reach 20 (bot lives)', path: 'league.humanAdultMedianDeathAge', target: '55–65', weight: 1, score: v => clamp(1 - Math.max(0, 55 - v, v - 65) / 14) },
    { name: 'Risk costs: careful bots outlive reckless ones by (years)', path: 'league.carefulMinusRecklessDeathAge', target: '≥ 5', weight: 2, score: atLeast(5) },
  ] },
  { aspect: 'UI and UX', cap: .6, metrics: [
    { name: 'WCAG 2.2 AA violations (axe, 24 screens)', path: 'a11y.wcagViolations', target: '0', weight: 3, score: atMost(0, 40) },
    { name: 'Serious or critical a11y findings', path: 'a11y.seriousOrCritical', target: '0', weight: 2, score: atMost(0, 40) },
  ] },
  { aspect: 'Technical', cap: .95, metrics: [
    { name: 'Corrupted saves in save/load cycles', path: 'saves.corrupted', target: '0', weight: 3, score: v => v === 0 ? 1 : 0 },
    { name: 'Milliseconds per game day', path: 'perf.msPerDay', target: '≤ 5 ms', weight: 1, score: atMost(5, 20) },
    { name: 'Page errors during the bench', path: 'pageErrorCount', target: '0', weight: 2, score: v => v === 0 ? 1 : 0 },
  ] },
  { aspect: 'Replayability', cap: .8, metrics: [
    { name: 'Distinct life arcs in bot lives', path: 'league.arcTypes', target: '≥ 8', weight: 2, score: atLeast(8) },
    { name: 'Share of the most common arc', path: 'league.topArcShare', target: '≤ 25%', weight: 2, score: atMost(25, 60) },
  ] },
  { aspect: 'Pacing and core loop', cap: .6, metrics: [
    { name: 'Longest usual wait between prompts (p90, seconds at default speed)', path: 'league.p90SecondsBetweenPromptsAtDefaultSpeed', target: '≤ 45 s', weight: 2, score: atMost(45, 120) },
    { name: 'Prompts per in-game year', path: 'league.promptsPerYear', target: '≥ 6', weight: 1, score: atLeast(6) },
  ] },
  { aspect: 'Uniqueness', cap: .6, metrics: [
    { name: 'Signature systems present (chronicle, belief vs truth, both scales)', path: 'signature.present', target: '3 of 3', weight: 1, score: v => v / 3 },
  ] },
];
