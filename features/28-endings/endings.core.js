// Endings and epilogues (Road to Ten, Replayability 2). Every life ends with a named ending (what you were, from 20)
// and a manner (how you died, from 9), then an epilogue: what became of your house, the people you leave and your
// realm, in the chronicler's voice. Endings found are collected in the Legacy tab, like achievements.
// The ending is decided once, in the engine, when you die; the epilogue is written from state at render time and
// varies by hashing ids, so rendering stays pure.
(function () {
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const pick = (arr, key) => arr[hash(key) % arr.length];
  const low = s => ['serf', 'slave', 'peasant'].includes(s);
  const kidsOf = p => (p.children || []).map(A.P).filter(Boolean);
  const grandkids = p => kidsOf(p).reduce((a, k) => a + kidsOf(k).length, 0);
  const count = (p, rx) => Object.keys(p.flags || {}).filter(k => rx.test(k)).length;
  const worth = p => (p.coin || 0) + (A.assetValue ? A.assetValue(p) : 0);

  // What you were. The first that fits is the ending. `t` is the epitaph.
  A.ENDINGS = [
    { id: 'dust_to_throne', name: 'From the Dust to the Throne', test: (p, S) => low(S.startStatus) && (p.ruler || p.wasRuler),
      t: 'Born to the plough and buried under a crown. The heralds will tidy the story. The village will tell it as it was.' },
    { id: 'crowned', name: 'The Crowned', test: p => !!(p.ruler || p.wasRuler),
      t: 'A ruler, for good or ill. The coins with that face on them will be in purses for a generation.' },
    { id: 'risen', name: 'The Risen', test: (p, S) => low(S.startStatus) && !!p.noble,
      t: 'Born with nothing and died with a name. The old families never quite forgave it.' },
    { id: 'chains', name: 'Died in Chains', test: p => !!p.prison,
      t: 'Whatever was done or not done, it ended behind a locked door, with the key on someone else\'s belt.' },
    { id: 'general', name: 'The Commander', test: p => p.mil && p.mil.rank >= 6,
      t: 'Led men who are still alive because of it, and men who are not.' },
    { id: 'veteran', name: 'The Old Soldier', test: p => ((p.mil || p.veteran || {}).battles || 0) >= 10,
      t: 'Stood in the line more times than anyone counted, and came home most of them.' },
    // a high churchman or a councillor is remembered for the seat, not the purse ("The Wealthy" bishop on the council)
    { id: 'shepherd', name: 'Shepherd of the Faith', test: p => !!(p.job && p.job.c === 'clergy' && p.job.r >= 3),
      t: 'Wore the ring and kept the flock, and the flock kept most of its faith. The lamps will be lit for it a while.' },
    { id: 'council', name: 'Of the Council', test: p => !!p.office,
      t: 'Sat at the table where the realm is decided, and decided some of it. The minutes will not say which part.' },
    { id: 'master', name: 'Master of the Craft', test: p => (p.job && p.job.r >= 4) || count(p, /masterwork/) > 0,
      t: 'Made things that will outlast the maker. Somewhere a door still hangs true because of it.' },
    { id: 'rich', name: 'The Wealthy', test: p => worth(p) >= 20000,
      t: 'Died rich, which is not the same as dying well, though it helps with the funeral.' },
    { id: 'saint', name: 'Of Good Repute Before the Gods', test: p => (p.piety || 0) >= 80,
      t: 'Prayed, gave and kept the fasts. The priests will say so, and for once they mean it.' },
    { id: 'learned', name: 'The Learned', test: p => p.literate && A.skill(p, 'learning') >= 60,
      t: 'Read more books than most people have seen. Some of them were even true.' },
    { id: 'keeper', name: 'Keeper of Secrets', test: p => count(p, /^rl_k_/) >= 4,
      t: 'Knew what the priests and the heralds would rather nobody knew, and said less than knew.' },
    { id: 'beast_lore', name: 'Who Knew the Wild', test: p => count(p, /^bt_k_/) >= 5,
      t: 'Knew the beasts as they are, not as the tales tell them, and was believed by almost nobody.' },
    { id: 'famous', name: 'Remembered', test: p => (p.fame || 0) >= 60,
      t: 'Known well beyond the parish, which means the stories about it are already wrong.' },
    { id: 'root', name: 'Root of a Great Tree', test: p => kidsOf(p).filter(k => k.alive).length >= 5 || grandkids(p) >= 6,
      t: 'Left a table that needs two benches now. Half of them will name a child after it.' },
    { id: 'wanderer', name: 'The Wanderer', test: p => count(p, /^(rd_|trv_|travel|av_)/) >= 6,
      t: 'Saw more roads than most see in ten lives, and slept under strange roofs without minding.' },
    { id: 'cut_short', name: 'Cut Short', test: p => A.age(p) < 25,
      t: 'Barely begun. What there was of it was real.' },
    { id: 'full_years', name: 'Full of Years', test: p => A.age(p) >= 70,
      t: 'Outlived most of the people who knew the young face. The rest remember it differently.' },
    { id: 'beloved', name: 'Well Loved', test: p => A.relsOf(p, ['friend', 'lover', 'spouse']).filter(x => x.p.alive && (x.r.op || 0) >= 50).length >= 3,
      t: 'Had friends who will drink to the name every year until they are too old to lift the cup.' },
    { id: 'unremembered', name: 'Unremembered', test: p => (p.fame || 0) < 5 && !kidsOf(p).length,
      t: 'Left no children and no name. The work was done, and someone else will be thanked for it.' },
    { id: 'plain', name: 'A Life Like Most', test: () => true,
      t: 'Worked, ate, loved a little, was afraid sometimes, and was buried by people who meant it.' },
  ];
  // How you died, from the cause the engine gave.
  A.MANNERS = [
    { id: 'battle', name: 'fell in the field', rx: /battle|front rank|siege|in the line|war\b|wounds taken|arrow|cavalry/i },
    { id: 'duel', name: 'by the blade', rx: /duel|a fight with|champion|stabb|knife|sword/i },
    { id: 'beast', name: 'taken by the wild', rx: /\bthe [A-Z]|beast|wolf|bear|boar|dragon|serpent|drake|wyrm|hound/ },
    { id: 'sickness', name: 'carried off by sickness', rx: /plague|fever|pox|sick|cough|flux|consumption|illness|disease|wound gone bad|festering|tooth|poisoned the blood|gangren/i },
    { id: 'violence', name: 'by another\'s hand', rx: /murder|poison|assassin|executed|hanged|beheaded|killed by/i },
    { id: 'accident', name: 'by mischance', rx: /fall|drown|accident|kick|fire|collapse|trampl/i },
    { id: 'birth', name: 'in childbed', rx: /childbirth|childbed|labou?r/i },
    { id: 'age', name: 'in the fullness of time', rx: /old age|age\b|years|heart|stroke/i },
    { id: 'other', name: 'as all things end', rx: /.*/ },
  ];
  A.endingOf = function (p) {
    const S = A.S, e = A.ENDINGS.find(x => { try { return x.test(p, S); } catch (err) { return false; } }) || A.ENDINGS[A.ENDINGS.length - 1];
    const cause = String(p.cause || p.deathCause || '');
    let m = A.MANNERS.find(x => x.rx.test(cause)) || A.MANNERS[A.MANNERS.length - 1];
    if (m.id === 'other' && A.age(p) >= 60) m = A.MANNERS.find(x => x.id === 'age');
    return { id: e.id, manner: m.id };
  };
  const E = id => A.ENDINGS.find(x => x.id === id);
  const M = id => A.MANNERS.find(x => x.id === id);

  // decided once, at death (engine)
  const pcDeath = A.pcDeath;
  A.pcDeath = function () {
    const pc = A.pc(), was = pc && pc.alive;
    const r = pcDeath.apply(this, arguments);
    try {
      if (pc && was && !pc.ending) {
        pc.ending = A.endingOf(pc);
        const S = A.S; S.endings = S.endings || {}; S.manners = S.manners || {};
        if (S.endings[pc.ending.id] == null) S.endings[pc.ending.id] = S.year;
        if (S.manners[pc.ending.manner] == null) S.manners[pc.ending.manner] = S.year;
        const d = S.deadList[S.deadList.length - 1]; if (d && !d.ending) { d.ending = pc.ending.id; d.manner = pc.ending.manner; }
        A.log(`Here the chronicler writes: ${E(pc.ending.id).name}, ${M(pc.ending.manner).name}.`, 'death');
      }
    } catch (e) { console.error('endings', e); }
    return r;
  };

  // The epilogue: what became of them. Plain strings; the caller escapes.
  A.epilogue = function (p) {
    const out = [], key = p.id + '|' + (p.died || A.S.year);
    const name = q => (A.fullName ? A.fullName(q, false) : q.given);
    // the house
    const heirs = A.heirsOf(p);
    if (heirs.length) {
      const h = heirs[0];
      out.push(pick([`${name(h)}, aged ${A.age(h)}, takes up what you leave, and learns quickly which of your friends were friends.`,
        `${name(h)} is the eldest living, at ${A.age(h)}, and has to be the one who decides things now.`,
        `The house goes on through ${name(h)}, who is ${A.age(h)} and not ready, which is how everyone starts.`], key + 'h'));
      if (heirs.length > 3) out.push(`There are ${heirs.length} of your children at the graveside, which is more than most can say.`);
    } else out.push(pick(['No child of yours survives you. What you held goes to cousins and creditors, who argue about it for a year.',
      'With no child to take it up, the name stops with you. Your things are sold at the door.'], key + 'n'));
    // the spouse
    const sp = p.spouse && A.P(p.spouse);
    if (sp && sp.alive) {
      const op = ((sp.rel || {})[p.id] || {}).op || 0;
      out.push(op >= 30 ? pick([`${name(sp)} wears grey for a year, and then for another.`, `${name(sp)} keeps your chair empty at table, and nobody is allowed to sit in it.`], key + 's')
        : pick([`${name(sp)} is married again within two summers, which is sensible.`, `${name(sp)} sells your horse before the month is out.`], key + 's'));
    }
    // friends and enemies
    const rels = A.relsOf(p, null).filter(x => x.p.alive && x.p.id !== (sp && sp.id));
    const friend = rels.filter(x => (x.r.op || 0) >= 40).sort((a, b) => (b.r.op || 0) - (a.r.op || 0))[0];
    if (friend) out.push(pick([`${name(friend.p)} carves your initials into the bench outside the alehouse, where you used to sit.`,
      `${name(friend.p)} drinks to you every year on the day, until there is no one left who remembers why.`,
      `${name(friend.p)} keeps something of yours and will not say what.`], key + 'f' + friend.p.id));
    const foe = rels.filter(x => x.r.type === 'rival' || x.r.type === 'enemy' || (x.r.op || 0) <= -40).sort((a, b) => (a.r.op || 0) - (b.r.op || 0))[0];
    if (foe) out.push(pick([`${name(foe.p)} hears the news in a tavern, and buys a round.`, `${name(foe.p)} comes to the burial and stands at the back, and leaves before the end.`,
      `${name(foe.p)} says something kind about you in public, which is worse.`], key + 'e' + foe.p.id));
    // secrets
    const secrets = LORE.secrets.filter(s => p.flags && p.flags['rl_k_' + s.id] != null);
    if (secrets.length) {
      const s = secrets[hash(key) % secrets.length];
      out.push(p.flags.bt_told_heir ? `Your eldest keeps what you told them about ${s.title.replace(/^The /, 'the ')}, and tells it, one day, to theirs.`
        : `What you knew of ${s.title.replace(/^The /, 'the ')} goes into the ground with you.`);
    }
    // the realm
    const R = A.realm(p.realm);
    if (R && R.alive) {
      const ru = A.P(R.ruler), wars = A.atWar ? A.atWar(R.id) : [];
      const rn = /^(the |[A-Z][a-z]+ of )/.test(R.name) && !/^the /i.test(R.name) ? 'the ' + R.name : R.name;
      out.push(`In ${rn}${ru && ru.id !== p.id ? ', ' + name(ru) + ' rules' : ''}${wars.length ? ', and the realm is at war' : ', and the realm is at peace, for now'}.`);
    } else if (R) out.push(`${/^[A-Z][a-z]+ of /.test(R.name) ? 'The ' + R.name : R.name} itself is gone, swallowed by its neighbours. Your grandchildren will call themselves something else.`);
    // the tale, if belief-truth is in the build
    if (A.BT && A.BT.tale && p.deeds && p.deeds.length && (p.fame || 0) >= 20) {
      const d = p.deeds[p.deeds.length - 1]; out.push('In the taverns it is told this way: ' + A.BT.tale(d.t, p.id + '|' + d.y));
    }
    return out;
  };

  // the death screen
  const modal = UI.deathModal;
  UI.deathModal = function () {
    const h = modal.apply(this, arguments), pc = A.pc();
    if (!pc || pc.alive) return h;
    const end = pc.ending || A.endingOf(pc), e = E(end.id), m = M(end.manner);
    const box = `<div class="epilogue"><div class="tag">The ending</div><h3 style="margin:2px 0">${UI.esc(e.name)}</h3>` +
      `<div class="small muted">${UI.esc(A.cap ? A.cap(m.name) : m.name)}</div><p class="mtext"><em>${UI.esc(e.t)}</em></p>` +
      `<div class="group-h">What became of them</div>${A.epilogue(pc).map(l => `<p class="small">${UI.esc(l)}</p>`).join('')}</div>`;
    const at = h.indexOf('<div class="score">');
    let out = at > 0 ? h.slice(0, at) + box + h.slice(at) : h + box;
    // the death screen as a moment (cycle 1 visual I5): a dusk print of the grave behind the page, the epitaph set
    // large, the heirs with their busts. Drawn from state, hashed by id; nothing random, nothing written.
    try {
      let sky = '';
      if (UI.SKIES && UI.SKIES.svg && UI.set.skies !== false) {
        const pr = A.S && A.S.prov ? A.S.prov[pc.home] : null, SK = UI.SKIES;
        let m = 0; try { m = A.monthOf(A.today()).m; } catch (e) {}
        const o = { hour: 'dusk', terr: SK.terrOf ? SK.terrOf(pr) : 'hills', coast: !!(pr && pr.coast), place: '' };
        if (SK.climOf) { const c = SK.climOf(pr); if (c) o.clim = c; }
        sky = SK.svg('death', 'death|' + pc.id, m, o);
      }
      if (sky) out = out.replace('<div class="panel mbox obit">', `<div class="panel mbox obit en-moment"><div class="en-sky" aria-hidden="true">${sky}</div>`);
      out = out.replace(/<button data-a="contAs" data-v="([^"]+)">/g, (all, id) => {
        const k = A.P(id);
        let b = '';
        try { b = k && UI.ANIME && UI.set.anime !== false ? UI.ANIME.svg(k, 48, { bust: true }) : k && UI.portrait ? UI.portrait(k, 48) : ''; } catch (e) { b = ''; }
        return `<button class="en-heir" data-a="contAs" data-v="${UI.esc(id)}">${b ? `<span class="en-heir-b" aria-hidden="true">${b}</span>` : ''}`;
      });
    } catch (e) {}
    return out;
  };
  // the life score counts up when the screen opens (the number only; under reduced motion it is simply there)
  if (typeof UI.renderModal === 'function') {
    const rm = UI.renderModal;
    UI.renderModal = function () {
      const r = rm.apply(this, arguments);
      try {
        const sc = document.querySelector('#modal .obit.en-moment > .score');
        const reduced = document.documentElement.dataset.motion === 'off' || document.documentElement.dataset.motion === 'reduced' || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion !== 'full');
        if (sc && !sc.dataset.counted && !reduced) {
          sc.dataset.counted = '1';
          const txt = sc.textContent, n = +txt.replace(/[^0-9]/g, '');
          if (n > 0) {
            const t0 = performance.now(), dur = 1100;
            const step = now => { if (!sc.isConnected) return; const f = Math.min(1, (now - t0) / dur), v = Math.round(n * (1 - Math.pow(1 - f, 3))); sc.textContent = f >= 1 ? txt : (A.fmt ? A.fmt(v) : String(v)); if (f < 1) requestAnimationFrame(step); };
            requestAnimationFrame(step);
          }
        }
      } catch (e) {}
      return r;
    };
  }
  // the release's gold "Your life is over…" bar (#agebar) reopens this screen; while the screen is open it said the
  // same thing twice, under the obituary. Hidden only while the death screen is up (pure CSS, nothing in the state).
  const deathCss = () => {
    if (typeof document === 'undefined' || document.getElementById('en-death-style')) return;
    const st = document.createElement('style'); st.id = 'en-death-style';
    st.textContent = 'body:has(#modal .obit) #agebar{display:none}' +
      // no first-run hint over a death, and the obituary as a full-screen dusk page rather than a dialog
      'body:has(#modal .obit) .hint{display:none!important}' +
      '#modal:has(> .obit.en-moment){padding:0;align-items:stretch;justify-content:stretch;background:#0b0d1a}' +
      '#modal > .obit.en-moment{position:relative;width:100%;max-width:none;min-height:100vh;margin:0;border:0;border-radius:0;box-shadow:none;overflow-x:hidden;overflow-y:auto;isolation:isolate;' +
        'background:linear-gradient(180deg,rgba(13,17,32,0) 0,rgba(13,17,32,.55) 30vh,#0d1120 52vh);color:#eee8da;padding:24vh max(16px,calc(50vw - 360px)) 40px;text-align:center}' +
      '#modal > .obit.en-moment > .en-sky{position:absolute;left:0;right:0;top:0;height:60vh;z-index:-1;pointer-events:none}' +
      '#modal > .obit.en-moment > .en-sky svg{width:100%;height:100%;display:block;filter:saturate(.75)}' +
      '#modal > .obit.en-moment > .en-sky::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,17,32,0) 40%,#0d1120 100%)}' +
      '#modal > .obit.en-moment h2{color:#f0c062;font-size:calc(32px * var(--tx,1))}' +
      '#modal > .obit.en-moment .mtext, #modal > .obit.en-moment .small, #modal > .obit.en-moment .years{color:#d9d2c2}' +
      '#modal > .obit.en-moment .muted{color:#b0aec4}' +
      '#modal > .obit.en-moment .epilogue .mtext em{font-family:var(--f-prose,serif);font-size:calc(22px * var(--tx,1));line-height:1.45;color:#f3ead6}' +
      '#modal > .obit.en-moment .epilogue h3{color:#eee8da;font-size:calc(20px * var(--tx,1))}' +
      '#modal > .obit.en-moment .score{font-size:calc(56px * var(--tx,1))}' +
      '#modal > .obit.en-moment .en-heir{display:inline-flex;align-items:center;gap:8px;padding:4px 12px 4px 4px}' +
      '#modal > .obit.en-moment .en-heir-b{display:block;width:40px;height:40px;flex:none}' +
      '#modal > .obit.en-moment .en-heir-b svg{width:100%;height:100%;display:block}' +
      '@media (max-width:760px){#modal > .obit.en-moment{padding-top:18vh}#modal > .obit.en-moment > .en-sky{height:42vh}}';
    document.head.appendChild(st);
  };
  if (typeof document !== 'undefined') { if (document.head) deathCss(); else document.addEventListener('DOMContentLoaded', deathCss); }
  // the collection, in the Legacy tab
  const legacy = UI.TAB.legacy;
  UI.TAB.legacy = function () {
    let h = legacy.apply(this, arguments);
    const S = A.S, got = S.endings || {}, gotM = S.manners || {};
    const n = A.ENDINGS.filter(e => got[e.id] != null).length;
    const sec = `<div class="group-h">Endings found (${n}/${A.ENDINGS.length}, and ${Object.keys(gotM).length}/${A.MANNERS.length} ways to go)</div>` +
      `<div class="achgrid">${A.ENDINGS.map(e => `<div class="card ach ${got[e.id] != null ? '' : 'lock'}"><b>${UI.esc(e.name)}</b>${got[e.id] != null ? UI.esc(e.t) + `<div class="tiny muted">${got[e.id]} AR</div>` : 'Not yet.'}</div>`).join('')}</div>`;
    const at = h.indexOf('<div class="group-h">Achievements');
    return at > 0 ? h.slice(0, at) + sec + h.slice(at) : h + sec;
  };
  // the chronicle's last line names the ending
  const book = A.chronicleBook;
  if (typeof book === 'function') A.chronicleBook = function () {
    const lives = book.apply(this, arguments);
    for (const life of lives) {
      const p = A.P(life.who);
      if (p && !p.alive && p.ending && life.end) life.end += ` The chronicler calls it ${E(p.ending.id).name.replace(/^The /, 'the ')}.`;
    }
    return lives;
  };
})();
