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
