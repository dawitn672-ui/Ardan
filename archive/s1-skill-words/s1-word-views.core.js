// Retired at the skills rebuild's switch: the views that printed a level as a word and step, and the proof's words,
// as they stood at d99799c2. Never built.

// ---- src/people/36-skills/d-view.core.js: the level label and what it acts as, in words
  // what the level reads to others: "Expert II", "Rusty · Advanced II"
  SK.levelLabel = function (p, k) {
    const lv = SK.lvOf(p, k), s = p.sk && p.sk[k];
    return (s && s.rust > 0 ? 'Rusty · ' : '') + SK.levelName(lv);
  };
  // what the level acts as, after rust, the body's hold and wounds (the sheet says both)
  SK.actsAs = function (p, k) {
    const v = A.skill(p, k), lv = SK.lvOf(p, k);
    const alv = SK.lvOfValue(v + 0.5);
    return alv < lv ? (alv > 0 ? SK.levelName(alv) : 'hardly anything') : null;
  };

// ---- the proof's words (now SK.deedWords: a deed of the rank)
  SK.proofWords = function (k) {
    const g = SK.BY[k] && SK.BY[k].group;
    return g === 'Arms' || g === 'The body' ? 'a fight won against one of that word' : g === 'Crafts' ? 'a work judged by masters' : g === 'War' ? 'a battle commanded and won'
      : g === 'Letters' || g === 'Faith' ? 'a case or a disputation carried' : 'a task of that word, done before those who know';
  };

// ---- the sheet's title ("Expert, the second step of five") and the next word's section with its proof
    const S = SK.BY[k], name = S.name, lv = SK.lvOf(p, k), s = p.sk && p.sk[k];
    const P = (h, t) => `<div class="sk-sec"><div class="sk-h">${esc(h)}</div>${t}</div>`;
    const line = t => `<div class="sk-l">${t}</div>`;
    let h = `<div class="sk-sheet"><div class="sk-title"><b>${esc(name)}</b><span class="sk-word"${UI.ttAttrs ? UI.ttAttrs("skillWord", SK.levelName(lv)) : ""}>${esc(lv > 0 ? `${SK.wordName(lv)}, the ${ROMAN_WORD[SK.stepOf(lv) - 1]} step of five` : 'untried')}</span></div>`;
    const desc = S.desc || (GD.SKILL_DESC && GD.SKILL_DESC[k]) || '';
    if (desc) h += `<div class="sk-desc">${esc(desc)}</div>`;
    if (!s) {   // someone else: the level, and what he is known for
      return h + (lv > 0 ? line(esc(`${SK.levelLabel(p, k)}.`)) : '') + '</div>';
    }
    // 2. the way to the next step
    const b = SK.bar(p, k), pace = SK.pace(p, k), acts = SK.actsAs(p, k);
    if (lv < SK.MAX_LV) h += P('The way to the next step', `<div class="skbar big" aria-hidden="true"><i style="transform:scaleX(${Math.round(b.f * 1000) / 1000})"></i></div>` +
      line(esc(`${b.word === 'full' ? 'The bar is full' : 'The bar: ' + b.word}${pace ? `; coming ${pace.word === 'held' ? 'no further' : pace.word}${pace.why ? ': ' + pace.why : ''}` : ''}.`)) +
      (s.st > 0 ? line(esc(`Work stored beyond the edge: ${SK.yearsWord(SK.E().storedSteps(s))} ${SK.E().storedSteps(s) === 1 ? "step's" : "steps'"} worth, which lands at once when the way opens.`)) : ''));
    if (acts) h += line(esc(`${s.rust > 0 ? 'Rusty: it' : 'It'} acts as ${acts} for now${s.rust > 0 ? '; work brings it back five times as fast as it went' : ': your body or a wound holds it there'}.`));
    // 3. the next word: its concepts, and the proof
    const w = SK.wordOf(lv) + 1;
    if (w >= 1 && w < SK.WORDS.length) {
      const v = SK.view(p), cs = SK.E().conceptsOf(k, w), years = s.stallAt != null ? SK.ageF(p) - s.stallAt : 0;
      const rows = cs.map(c => {
        const nd = SK.E().need(v, k, c), state = s.got[c.id] != null ? 'grasped' : SK.E().graspWord(s.ins[c.id] || 0, nd, years);
        return `<details class="sk-c"><summary><span>${esc(c.name.replace(/^./, x => x.toUpperCase()))}</span><b>${esc(state)}</b></summary><div class="sk-cd">${esc(c.desc || '')}${c.never && state !== 'grasped' ? `<div class="muted">Never grasped: ${esc(c.never)}</div>` : ''}</div></details>`;
      }).join('');
      h += P(`The next word: ${SK.WORDS[w]}`, rows + (w >= SK.E().PROOF_FROM ? line(esc(`And a proof: ${SK.proofWords(k)}${s.proved ? ' (given)' : ''}.`)) : ''));
    }
    // 4. this season

// ---- src/ui/59-descriptions/descriptions.glossary.core.js: the glossary's Levels entry
  G.skillWord = function (name) {
    return H('Levels', null, esc(name)) + D('A skill has seven words, each in five steps: Beginner, Intermediate, Advanced, Expert, Master, Grandmaster, Legend. Experience fills the bar to the next step; a new word also asks its concepts grasped, and from Expert a proof.');
  };
