// Retired at the skills rebuild's switch (docs/design/skills-v2.md §10 step 5, §6.1; the owner's orders 78 and 83):
// S1's seven words, Roman steps and level names, as they stood at d99799c2 (the last commit that had them in the build).
// Never built and never tested. A level is printed by A.SK2.label now ("Basic Swordsmanship · C · Lv 3").

// ---- src/people/36-skills/a-model.core.js: the words, the Roman steps, SK.levelName, SK.wordName, SK.levelOfWord, SK.minValue
  // ---- levels, read without the engine (the hot path: every check) --------------------------------------------------
  const EDGE = [1, 15, 35, 55, 72, 88, 96, 101], STEPS = 5, MAX_LV = 35;
  const WORDS = SK.WORDS = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master', 'Grandmaster', 'Legend'];
  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  const wordOf = SK.wordOf = lv => (lv <= 0 ? -1 : Math.floor((lv - 1) / STEPS));
  const stepOf = SK.stepOf = lv => (lv <= 0 ? 0 : ((lv - 1) % STEPS) + 1);
  const VALUES = SK.VALUES = [0];
  for (let lv = 1; lv <= MAX_LV; lv++) { const w = wordOf(lv); VALUES.push(EDGE[w] + (stepOf(lv) - 1) * (EDGE[w + 1] - EDGE[w]) / STEPS); }
  SK.MAX_LV = MAX_LV; SK.STEPS = STEPS; SK.EDGE = EDGE;
  SK.value = lv => VALUES[Math.max(0, Math.min(MAX_LV, lv | 0))];
  const lvOfValue = SK.lvOfValue = v => {
    if (!(v >= 1 - 1e-9)) return 0;
    let lo = 1, hi = MAX_LV;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (VALUES[mid] <= v + 1e-9) lo = mid; else hi = mid - 1; }
    return lo;
  };
  SK.levelName = lv => (lv <= 0 ? 'untried' : `${WORDS[wordOf(lv)]} ${ROMAN[stepOf(lv) - 1]}`);
  SK.wordName = lv => (lv <= 0 ? 'untried' : WORDS[wordOf(lv)]);
  // a word as a check may name it: 'expert' -> the first level of Expert
  const WORD_LV = {}; WORDS.forEach((w, i) => { WORD_LV[w.toLowerCase()] = i * STEPS + 1; });
  SK.levelOfWord = w => WORD_LV[String(w).toLowerCase()] || 0;
  SK.minValue = min => (typeof min === 'string' ? VALUES[SK.levelOfWord(min)] : min);


// ---- src/people/engine/skills.js: the engine's words and level names
// ---- 1. levels: seven words of five steps (35 levels); Myth is for the dead ------------------------------------------
export const WORDS = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master', 'Grandmaster', 'Legend'];
export const EDGE = [1, 15, 35, 55, 72, 88, 96, 101];
export const STEPS = 5, MAX_LV = WORDS.length * STEPS;
export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
export const wordOf = lv => (lv <= 0 ? -1 : Math.floor((lv - 1) / STEPS));
export const stepOf = lv => (lv <= 0 ? 0 : ((lv - 1) % STEPS) + 1);
export const levelName = lv => (lv <= 0 ? 'untried' : `${WORDS[wordOf(lv)]} ${ROMAN[stepOf(lv) - 1]}`);

// ---- src/people/36-skills/e-life.core.js: C.lvl's word form ("expert")
    // a skill at least at a value (a number, as a check reads it) or a word ("expert")
    // k 'any': the best skill the person holds
    lvl: (p, k, min) => (k === 'any' ? SK.bestValue(p) : A.skill(p, k)) >= (min == null ? 40 : typeof min === 'string' ? SK.VALUES[SK.levelOfWord(min)] : min),
    // a talent at least this letter (B: gifted, by default)
