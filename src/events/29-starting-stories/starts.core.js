// Starting stories (Road to Ten, Replayability 1). Twenty hand-made beginnings, chosen on the first step of a new life.
// Each sets the birth (people, realm, rank, age, sometimes sex), gives the life a situation (coin, letters, a trait,
// knowledge), opens with its own scene, and plants a flag (st_<id>) that a callback reads years later.
// The story travels in the newGame options (patch START-OPTION), so a journal replay starts the same way.
(function () {
  const ST = A.STARTS = [
    { id: 'serf', title: "The Bailiff's Ledger", blurb: 'A serf of Ashmere, seventeen, who struck the bailiff yesterday. The manor court sits at the new moon.',
      cr: { race: 'human', realm: 'POL-05', status: 'serf', startAge: 17 } },
    { id: 'second_son', title: 'No Land for a Second Son', blurb: 'A younger son of a Varennan house. Your father is dead, and his will leaves you a horse, a sword and his blessing.',
      cr: { race: 'human', realm: 'POL-03', status: 'noble', order: 'younger', sex: 'M', startAge: 19 }, setup: pc => { pc.coin += 60; } },
    { id: 'debt_stone', title: 'The Carved Debt', blurb: 'A dwarf of Stonehold. Your family\'s debt is cut into the hall\'s debt-stone, and your name is the next line down.',
      cr: { race: 'dwarf', realm: 'POL-28', status: 'artisan', startAge: 32 }, setup: pc => { pc.coin = Math.max(0, pc.coin - 40); } },
    { id: 'clanless', title: 'Clanless', blurb: 'An orc of the Tusk Clans, sixteen, cast out for sparing an enemy the War-Mother wanted dead.',
      cr: { race: 'orc', realm: 'POL-34', status: 'peasant', startAge: 16 } },
    { id: 'last_tree', title: 'The Last Tree of Your Line', blurb: 'An elf of Sylvaran. The tree your ancestors went into is dying, and the singers say no sapling has taken.',
      cr: { race: 'elf', realm: 'POL-06', status: 'gentry', startAge: 55 } },
    { id: 'articles', title: 'Born Under the Articles', blurb: 'A child of Blackreef, sixteen. Your mother died with a full share owed her, and the quartermaster says the Articles forgot.',
      cr: { race: 'human', realm: 'POL-33', status: 'peasant', startAge: 16 } },
    { id: 'foundling', title: "The Temple's Child", blurb: 'Raised by the priests of Solenne, who found you on the steps with a ring on a cord. You are fifteen and have never asked.',
      cr: { race: 'human', realm: 'POL-02', status: 'peasant', startAge: 15 }, setup: pc => { pc.literate = true; pc.piety = Math.min(100, (pc.piety || 0) + 20); } },
    { id: 'widow', title: "The Widow's Books", blurb: 'A merchant\'s widow of Lucerna, twenty-four. Your husband\'s partners call on you tomorrow, kindly, to take the business off your hands.',
      cr: { race: 'human', realm: 'POL-04', status: 'merchant', sex: 'F', startAge: 24 }, setup: pc => { pc.literate = true; pc.coin += 120; } },
    { id: 'smallest', title: 'The Smallest in the Hall', blurb: 'A giant of Frostholm, the smallest born in the hall in three generations. The eldest has decided what you are good for.',
      cr: { race: 'giant', realm: 'POL-09', status: 'peasant', startAge: 26 } },
    { id: 'horse', title: 'The Horse You Were Not Given', blurb: 'A rider of the Nine Winds, sixteen. At the spring gathering every youth of your age was given a horse. You were not.',
      cr: { race: 'human', realm: 'POL-12', status: 'peasant', startAge: 16 } },
    { id: 'letter_box', title: "The Letter in Your Mother's Box", blurb: 'A bastard of Greyhaven, nineteen. Your mother has died, and in her box is a letter in a great lord\'s hand.',
      cr: { race: 'human', realm: 'POL-14', status: 'noble', order: 'bastard', startAge: 19 } },
    { id: 'scribe', title: "The Scribe's Chain", blurb: 'A slave of Qadir, twenty, who can read. Your master cannot, and signs whatever you put in front of him.',
      cr: { race: 'human', realm: 'POL-17', status: 'slave', startAge: 20 }, setup: pc => { pc.literate = true; } },
    { id: 'fever', title: 'After the Fever', blurb: 'A child of Morhaven, fourteen. The fever went through your village in a month. You are the one it left.',
      cr: { race: 'human', realm: 'POL-15', status: 'peasant', startAge: 14 } },
    { id: 'river', title: 'Both Sides of the River', blurb: 'Gentry of Tessaria, twenty, in the forty-fourth year of the civil war. Your brother rides for the other claimant.',
      cr: { race: 'human', realm: 'POL-31', status: 'gentry', startAge: 20 } },
    { id: 'between', title: 'Neither Tree nor Stone', blurb: 'A half-elf of Eldergrove, eighteen. Your elven grandmother will not say your name, and the human quarter will not say it right.',
      cr: { race: 'halfelf', realm: 'POL-07', status: 'peasant', startAge: 18 } },
    { id: 'salt', title: 'Salt and Silence', blurb: 'A trader of the Spice Coast, twenty-two, who owes the smugglers of Kesh one voyage and no questions.',
      cr: { race: 'human', realm: 'POL-21', status: 'merchant', startAge: 22 }, setup: pc => { pc.coin += 80; } },
    { id: 'novice', title: 'The Novice Who Read Too Much', blurb: 'A novice of Skyhold, seventeen, who found the key to the closed shelf and has been using it.',
      cr: { race: 'human', realm: 'POL-27', status: 'peasant', startAge: 17 }, setup: pc => { pc.literate = true; } },
    { id: 'what_took', title: 'What Took Your Father', blurb: 'A hunter\'s child of Northreach, eighteen. Something took your father on the fells last winter. Nobody agrees what.',
      cr: { race: 'human', realm: 'POL-08', status: 'peasant', startAge: 18 },
      setup: pc => {
        const home = A.prov(pc.home), terr = home ? home.terr : 'hills';
        // what lives near home (76-beast-habitats keeps that to the world bible's ranges); the terrain alone only when
        // nothing does, as the release's rule had it
        const near = (A.beastsNear ? A.beastsNear(pc) : []).map(id => LORE.creatures.find(x => x.id === id)).filter(c => c && A.BEASTS[c.id] && A.beastTier(c.id) !== 'legend');
        const pool = near.length ? near : LORE.creatures.filter(c => A.BEASTS[c.id] && A.beastTier(c.id) !== 'legend' && (A.BEASTS[c.id].terr || []).includes(terr));
        const c = pool.length ? A.pick(pool) : LORE.creatures.find(x => A.BEASTS[x.id]);
        if (c) { A.S.story.beast = c.id; pc.flags['bt_h_' + c.id] = A.S.year; }
      } },
    { id: 'ward', title: "The Queen's Ward", blurb: 'A child of the royal line of Drevna, sixteen, raised at court as the queen\'s ward. Everyone is very kind to you. Too kind.',
      cr: { race: 'human', realm: 'POL-26', status: 'royal', order: 'younger', startAge: 16 } },
    { id: 'unpaid', title: 'The Company That Did Not Pay', blurb: 'A soldier of the Highland League, twenty-one. Your company broke up owing you a year\'s pay, and the captain kept the chest.',
      cr: { race: 'human', realm: 'POL-13', status: 'peasant', startAge: 21 }, setup: pc => { A.trainSkill(pc, 'spear', 12); A.trainSkill(pc, 'melee', 8); } },
  ];
  const byId = id => ST.find(s => s.id === id);

  // the story only holds if the birth still matches it
  A.storyFor = function (c) {
    const s = c && c.story && byId(c.story); if (!s) return null;
    for (const k of ['race', 'realm', 'status']) if (s.cr[k] && c[k] !== s.cr[k]) return null;
    return s.id;
  };
  // engine: after the world and the person exist
  const newGame = A.newGame;
  A.newGame = function (o) {
    const r = newGame.apply(this, arguments);
    const s = o && o.story && byId(o.story), pc = A.pc();
    if (s && pc) {
      A.S.story = { id: s.id, y: A.S.year };
      try { s.setup && s.setup(pc); } catch (e) { console.error('start story', s.id, e); }
      pc.flags['st_' + s.id] = A.S.year;
      A.queue({ type: 'event', ev: 'st_' + s.id + '_open', forced: true });
    }
    return r;
  };

  // the creation screen: pick a story on the first step
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  Object.assign(UI.A, {
    crStory(v) {
      const c = UI.cr; if (!c) return;
      const s = byId(v);
      if (!s) { c.story = null; UI.render(); return; }
      Object.assign(c, s.cr); c.story = s.id;
      if (!s.cr.sex && !c.sex) c.sex = 'M';
      UI.crFix();
      const cult = LORE.cultures[UI.crCult()];
      if (cult) { const names = c.sex === 'F' ? cult.f : cult.m; if (names && names.length) c.given = names[hash(s.id + c.sex) % names.length]; }
      UI.crFix(); UI.render();
    },
  });
  const birth = UI.crStepBirth;
  UI.crStepBirth = function () {
    const c = UI.cr || {}, cur = A.storyFor(c);
    const card = s => `<button class="opt ${cur === s.id ? 'on' : ''}" data-a="crStory" data-v="${UI.esc(s.id)}" aria-pressed="${cur === s.id}"><b>${UI.esc(s.title)}</b><span class="tiny muted">${UI.esc(s.blurb)}</span></button>`;
    const box = `<details class="field starts" ${cur ? 'open' : ''}><summary><b>Begin from a story</b> <span class="muted small">(${ST.length} hand-made starts; or build your own below)</span></summary>` +
      `<div class="opt-grid">${ST.map(card).join('')}</div>` +
      (cur ? '<div class="row" style="margin-top:6px"><button class="small" data-a="crStory" data-v="">Clear the story</button><span class="tiny muted">Changing people, realm or rank below clears it.</span></div>' : '') + '</details>';
    return box + birth.apply(this, arguments);
  };
  const summary = UI.crSummary;
  UI.crSummary = function () {
    const h = summary.apply(this, arguments), s = byId(A.storyFor(UI.cr || {}));
    return s ? `<div class="card small"><span class="tag">Story</span> <b>${UI.esc(s.title)}</b><div class="tiny muted">${UI.esc(s.blurb)}</div></div>` + h : h;
  };
})();

// ---- Cycle 1 (first-hour I3, B5; design #3): a one-screen quick start, and the full screens in a better order.
// Creation ran to 12,500 px on a phone, four steps with age and Lands on the last, after skin swatches and forty
// traits; the twenty stories hid behind a closed line; picking "The Known World only" on step 4 silently moved a life
// born in a far realm to Aldmark; and "Score multiplier ×0.85" was never explained. So:
// - "A new life" opens on one screen: Lands, then three ways in (Be born, Start at 16, Pick a story), with three story
//   cards open for a player's first three lives, then the difficulty. "Customise everything" and the four step buttons
//   lead to the full screens, as before.
// - On the full screens Lands and "Where your story starts" lead the first step, above the realm, so the realm list is
//   the list of the lands chosen; the last step keeps difficulty, world and seed.
// - Choosing the Known World only while a far realm is chosen says so beforehand, and afterwards which realm the life
//   now begins in.
// - The score multiplier says what it is.
// All of it is the creation screen's; the options it hands A.newGame are the ones the full screens would hand it.
(function () {
  const ST = A.STARTS, byId = id => ST.find(s => s.id === id);
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const FAR = () => A.FAR && A.FAR.D ? A.FAR : null;
  const isFar = id => { const F = FAR(); return !!(F && F.D.realms && F.D.realms[id]); };
  const realmName = id => (LORE.realms[id] && LORE.realms[id].name) || (FAR() && FAR().D.realms[id] && FAR().D.realms[id].name) || id;
  const shortName = id => { const r = LORE.realms[id] || (FAR() && FAR().D.realms[id]); return (r && (r.short || r.name)) || id; };
  const counts = () => {
    const F = FAR(); if (!F) return null;
    const nFar = Object.keys(F.D.realms).length, nKnown = Object.keys(LORE.realms).filter(id => !F.D.realms[id]).length;
    return { great: nKnown + nFar, known: nKnown };
  };
  const lands = c => (c && c.lands) || (FAR() ? FAR().MENU_LANDS : 'known');
  // the warning a far realm needs before the Known World only is chosen
  UI.crLandsWarn = function (c) {
    if (!c || lands(c) !== 'great' || !isFar(c.realm)) return '';
    return `<div class="small cr-lands-warn" role="note">${UI.icon ? UI.icon('triangle-alert', 's') : ''} ${UI.esc(realmName(c.realm))} lies beyond the Known World. Choosing <b>The Known World only</b> moves your birth to a realm of the west.</div>`;
  };
  UI.crLandsNote = null;
  // the three stories on show: by the day, so they change from one day to the next and not from one draw to the next
  UI.crStoryPicks = function () {
    const d = new Date(), h = hash(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`), n = ST.length, i = h % n;
    return [ST[i], ST[(i + 7) % n], ST[(i + 13) % n]];
  };
  const storyCard = (s, cur) => `<button class="opt crq-story ${cur === s.id ? 'on' : ''}" data-a="crStory" data-v="${UI.esc(s.id)}" aria-pressed="${cur === s.id}"><b>${UI.esc(s.title)}</b><span class="small muted">${UI.esc(s.blurb)}</span></button>`;
  const DIFF = { story: ['Story', 'Childhood is safe and every choice shows its odds.', 0.6], hard: ['Hard', 'The world is dangerous, but not cruel to children.', 1], realism: ['Realism', 'Historical mortality: two in five children die.', 1.35] };
  UI.crScoreWhy = 'At the end of a life its deeds are scored. This multiplies that score: easier settings and chosen gifts lower it, harder ones raise it.';

  UI.crQuickHtml = function () {
    const c = UI.cr; UI.crFix();
    const cur = A.storyFor(c), R = GD.RACES[c.race] || { adult: 16 }, n = counts(), L = lands(c), lives = +(UI.set && UI.set.lfLives) || 0;
    const showStories = lives < 3 || UI.crQuickStories || !!cur;
    const big = (v, title, line, on) => `<button class="opt crq-big${on ? ' on' : ''}" data-a="crQuick" data-v="${v}"${v === 'story' ? ` aria-expanded="${showStories}"` : ''}><b>${UI.esc(title)}</b><span class="small muted">${UI.esc(line)}</span></button>`;  // actions, not a selection
    let h = `<div id="create" class="crq"><div class="row"><h1 style="margin:0">A new life</h1><span class="right"></span><button data-a="toTitle">Back</button><button data-a="randomizeCr">Randomize all</button></div>`;
    h += '<div class="panel crq-panel"><p class="crq-lede">Choose where and how to begin. Everything else can wait, or be chosen below.</p>';
    if (n) {
      const opt = (k, t) => `<button class="small${L === k ? ' primary' : ''}" data-a="crSet" data-v="lands:${k}" aria-pressed="${L === k}">${t}</button>`;
      h += `<div class="field crq-lands"><label>Lands</label><div class="row wrap crq-seg" role="group" aria-label="Lands">${opt('great', 'The Great Continent')}${opt('known', 'The Known World only')}</div>` +
        `<div class="small muted">${L === 'great' ? `${n.great} realms on one continent, from the taiga to the equator.` : `${n.known} realms of the west: the smaller classic map.`}</div>${UI.crLandsWarn(c)}` +
        (UI.crLandsNote ? `<div class="small cr-lands-warn" role="status">${UI.esc(UI.crLandsNote)}</div>` : '') + '</div>';
    }
    h += `<div class="field"><label>How to begin</label><div class="opt-grid crq-ways">` +
      big('born', 'Be born', `A ${GD.RACES[c.race] ? GD.RACES[c.race].name.toLowerCase() : 'human'} child of ${shortName(c.realm)}. Live it all, from the first winter.`, false) +
      big('adult', `Start at ${R.adult}`, 'Come of age with your whole life in front of you.', false) +
      big('story', 'Pick a story', `${ST.length} hand-made beginnings, each with its own first scene.`, !!cur) + '</div></div>';
    if (showStories) {
      const picks = UI.crStoryPicks(), rest = ST.filter(s => !picks.includes(s));
      h += `<div class="field crq-stories"><label>Stories</label><div class="opt-grid">${picks.map(s => storyCard(s, cur)).join('')}</div>` +
        `<details class="crq-all"${cur && !picks.some(s => s.id === cur) ? ' open' : ''}><summary>Show all ${ST.length} stories</summary><div class="opt-grid">${rest.map(s => storyCard(s, cur)).join('')}</div></details>` +
        (cur ? `<div class="row crq-begin"><button class="primary" data-a="crQuick" data-v="go">Begin: ${UI.esc(byId(cur).title)} ▸</button><button class="small ghost" data-a="crStory" data-v="">Clear the story</button></div>` : '') + '</div>';
    }
    const d = DIFF[c.diff] || DIFF.hard;
    h += `<div class="field crq-diff"><label>Difficulty</label><div class="row wrap crq-seg" role="group" aria-label="Difficulty">${Object.entries(DIFF).map(([k, v]) => `<button class="small${c.diff === k ? ' primary' : ''}" data-a="crSet" data-v="diff:${k}" aria-pressed="${c.diff === k}">${v[0]}</button>`).join('')}</div>` +
      `<div class="small muted">${UI.esc(d[1])} <span title="${UI.esc(UI.crScoreWhy)}">Score ×${d[2].toFixed(2)}</span>: a life's final score is multiplied by this.</div>${UI.lfFirstLine ? UI.lfFirstLine(c) : ''}</div>`;
    h += `<div class="crq-more"><button data-a="crStep" data-v="0">Customise everything ▸</button><span class="small muted">People, realm, rank, face, gifts and traits:</span>` +
      `<span class="crq-steps">${['Blood & birth', 'Body & face', 'Gifts & nature', 'Begin'].map((s, i) => `<button class="small ghost" data-a="crStep" data-v="${i}">${i + 1}. ${UI.esc(s)}</button>`).join('')}</span></div>`;
    return h + '</div></div>';
  };

  const fresh = c => { const d = UI.crDefaults(); d.lands = c.lands; d.diff = c.diff; return d; };
  Object.assign(UI.A, {
    crQuick(v) {
      let c = UI.cr; if (!c) return;
      if (v === 'story') { UI.crQuickStories = !UI.crQuickStories || !!A.storyFor(c); UI.render(); const el = document.querySelector('.crq-stories'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); return; }
      if (v === 'go') { if (!A.storyFor(c)) return; UI.startLife(); return; }
      if (A.storyFor(c)) { c = UI.cr = fresh(c); UI.crFix(); }
      c.story = null; c.startAge = v === 'adult' ? (GD.RACES[c.race] || { adult: 16 }).adult : 0;
      UI.startLife();
    },
  });
  // "A new life" opens on the quick screen; any step button leaves it for the full screens
  const newLife = UI.A.newLife;
  UI.A.newLife = function () { UI.crQuick = true; UI.crQuickStories = false; UI.crLandsNote = null; return newLife.apply(this, arguments); };
  const crStep = UI.A.crStep;
  UI.A.crStep = function () { UI.crQuick = false; return crStep.apply(this, arguments); };
  const render = UI.renderCreate;
  UI.renderCreate = function () {
    wrapLands();
    if (UI.crQuick && UI.cr) { try { return UI.crQuickHtml(); } catch (e) { console.error('quick start', e); UI.crQuick = false; } }
    return render.apply(this, arguments);
  };
  // the lands change says what it did to a far birth (99-far-lands' crSet does the change; it is wrapped when first
  // needed, since 99 loads after this file)
  let wrapped = false;
  function wrapLands() {
    if (wrapped || !UI.A.crSet) return; wrapped = true;
    const set = UI.A.crSet;
    UI.A.crSet = function (v) {
      const c = UI.cr, was = c && c.realm, far = was && v === 'lands:known' && isFar(was), wasName = far ? realmName(was) : '';
      if (typeof v === 'string' && v.startsWith('lands:')) UI.crLandsNote = null;
      const r = set.apply(this, arguments);
      if (far && UI.cr && UI.cr.realm !== was) {
        UI.crLandsNote = `${wasName} lies beyond the Known World, so your birth moves to ${realmName(UI.cr.realm)}.`;
        if (UI.toast) UI.toast(UI.crLandsNote, 5000);
        UI.render();
      }
      return r;
    };
  }

  // the full screens: Lands and age lead the first step; the last step keeps the rest
  const pull = html => {
    const t = document.createElement('template'); t.innerHTML = html;
    const fields = [...t.content.children].filter(e => e.classList && e.classList.contains('field'));
    const age = fields[0] && /Where your story starts/.test(fields[0].textContent) ? fields[0] : null, landsF = fields.find(e => e.classList.contains('fl-lands')) || null;
    return { t, age, lands: landsF };
  };
  const begin = UI.crStepBegin;
  UI.crStepBegin = function () {
    const h = begin.apply(this, arguments);
    if (typeof document === 'undefined') return h;
    try { const p = pull(h); if (p.age) p.age.remove(); if (p.lands) p.lands.remove(); return p.t.innerHTML; } catch (e) { return h; }
  };
  const birth = UI.crStepBirth;
  UI.crStepBirth = function () {
    const h = birth.apply(this, arguments);
    if (typeof document === 'undefined') return h;
    try {
      const p = pull(begin.call(this)), c = UI.cr || {};
      const top = (p.lands ? p.lands.outerHTML + UI.crLandsWarn(c) + (UI.crLandsNote ? `<div class="small cr-lands-warn" role="status">${UI.esc(UI.crLandsNote)}</div>` : '') : '') + (p.age ? p.age.outerHTML : '');
      return top + h;
    } catch (e) { return h; }
  };
  // the score multiplier says what it is
  const summary = UI.crSummary;
  UI.crSummary = function () {
    const h = summary.apply(this, arguments);
    return h.replace(/Score multiplier: ×([0-9.]+)/, (m, x) => `<span title="${UI.esc(UI.crScoreWhy)}">Score ×${x}</span><span class="tiny"> · ${UI.esc(UI.crScoreWhy)}</span>`);
  };

  const css = [
    '.crq{max-width:760px;margin:0 auto;padding:16px}',
    '.crq .crq-panel{margin-top:10px}.crq .crq-lede{margin:0 0 12px;color:var(--ink-2)}',
    '.crq .crq-seg{gap:6px}',
    '.crq .crq-ways{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}',
    '.crq .crq-big{min-height:84px;text-align:left;display:flex;flex-direction:column;gap:4px;align-items:flex-start;justify-content:center}',
    '.crq .crq-big b{font-size:var(--t-h3,17px)}',
    '.crq .crq-story{text-align:left;display:flex;flex-direction:column;gap:4px;align-items:flex-start}',
    '.crq .crq-all{margin-top:8px}.crq .crq-all summary{cursor:pointer;min-height:32px;display:flex;align-items:center;font-weight:700}',
    '.crq .crq-begin{margin-top:10px;gap:8px;align-items:center;flex-wrap:wrap}',
    '.crq .crq-more{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}',
    '.crq .crq-steps{display:flex;flex-wrap:wrap;gap:4px}',
    '.cr-lands-warn{margin-top:6px;color:var(--warn,var(--accent-strong,#e8b04a))}',
    '@media (max-width:760px){.crq{padding:calc(12px + env(safe-area-inset-top,0px)) 12px 16px}.crq button,.crq summary{min-height:44px}.crq .small,.crq .tiny,.crq label{font-size:14px}' +
      '.crq .crq-ways,.crq .crq-stories .opt-grid{grid-template-columns:1fr}.crq .crq-big{min-height:64px}.crq .crq-story .small{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}}',
  ].join('');
  const put = () => { if (typeof document === 'undefined' || document.getElementById('crq-style')) return; const s = document.createElement('style'); s.id = 'crq-style'; s.textContent = css; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
