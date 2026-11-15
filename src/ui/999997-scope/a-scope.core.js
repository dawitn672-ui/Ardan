// 999997-scope, part 1 (B5 part 2, D-055): UI.scope(pc), the one place that says what this person may see and do.
//
// The owner's complaint (CRITIQUE U4): "screens ignore age, class and rank". A peasant of 9 had an Arms page with
// "Ask to join"; a newborn was offered "See a physician" and told how he looks; a father's card offered "Pick a fight"; a
// Chancellor was told "Find work"; a child of twelve was offered "Burgle a house". Each gate was written where its bug
// was found (A.canAct's ACT_GATE by class, 49-body-mind's stages, 99992-v2-time's Arms at 14, 99997-v2-war's war rules by
// post), so a new page forgot them. This is the one reader every page asks.
//
// UI.scope(pc) is a pure function of state: a small object, kept while what it reads is unchanged.
//   s.stage    'infant' | 'child' | 'teen' | 'adult' | 'old' (an infant is under three, scaled to the people)
//   s.minor    not yet of age for his people;  s.dependent  a minor, or a youth still under his parents' roof
//   s.settled  has a place in the world (a post, a trade, a commission, land, a title or a gentle birth)
//   s.post     { held: [keys], kinds: ['SEAT', ...], seat, ruler, any, name }   from A.POSTS (999990-posts)
//   s.war      { in, rank, deployed, room, arms }   read from A.V2W (99997-v2-war), not repeated here
//   s.home     { married, kids, parents }
// and four questions, all answering for this one person:
//   s.sees(thing)      a surface or a line: 'looks', 'skills', 'court', 'gear', 'warroom', 'campaign', 'findWork', ...
//   s.page(key)        is this page in his places (Life, You, Family, World, War)?
//   s.act(key)         { show, why }: false when no life like his is ever offered that activity (it is not listed,
//                      and A.canAct refuses it with the reason); what is only refused today (a purse too thin, once a
//                      year) is not decided here
//   s.social(t, opts)  the actions on another person's card, cut to what his age and place allow toward them
// Nothing here writes state or draws from A.rand.
(function () {
  if (typeof UI === 'undefined') return;
  const SC = UI.SCOPE = UI.SCOPE || {};
  const R = pc => (GD.RACES && (GD.RACES[pc.race] || GD.RACES.human)) || { adult: 16, old: 60 };

  // ---- what each surface needs ------------------------------------------------------------------------------------------
  // (s: the scope). A line or block a life never needs is not drawn, so it cannot be read as a refusal.
  SC.SEES = {
    looks: s => s.stage !== 'infant',                       // an infant is not told how he looks
    skills: s => s.stage !== 'infant',                      // the lists of proficiencies and the training plan
    plan: s => s.stage !== 'infant',                        // "Your days": training focus and free hours
    know: s => s.stage !== 'infant',                        // "Get to know" a stranger
    schools: s => s.a16 >= 10 && !s.post.ruler,             // 10, as the activity (a ruler commands masters)
    court: s => s.adult || s.post.any,                      // the court, its factions and "Your rung"
    factions: s => s.adult,
    gear: s => s.a16 >= 12 || s.settled,                    // what he carries, his purse and market
    mark: s => s.adult,                                     // arms of his own, a seal
    findWork: s => !s.settled && s.adult && !s.post.any && s.age < 60,
    warroom: s => !!s.war.room,                             // read from 99997-v2-war's canRoom
    campaign: s => !!(s.war.in && s.war.deployed),          // Next day and Next week only on campaign
    arms: s => !!s.war.arms,                                // the Arms page: read from 99992-v2-time
    decisions: s => s.adult || s.post.any,
    statecraft: s => !!s.post.ruler || !!s.post.seat,
  };
  // pages, by the key UI.tab holds. Not listed: always in his places.
  SC.PAGES = {
    goals: s => s.sees('decisions'),
    path: s => s.stage !== 'infant' && (s.a16 >= 10 || s.settled),
    holdings: s => s.sees('gear'),
    realm: s => s.sees('court'),
    war: s => s.war.in || s.sees('arms'),
  };

  // ---- the activities no life like his is offered ---------------------------------------------------------------------
  // [keys, when, reason]. The reasons are words the Life page already hides (23-ui-e's list) so a hidden activity is never
  // shown as a refusal. A thing refused for today only (a thin purse, "once a year") is A.canAct's.
  const MINOR_NO = ['crime_pick', 'crime_burgle', 'crime_rob', 'crime_smuggle', 'gamble', 'moneylend', 'trade_venture', 'plot_throne', 'seize_land', 'found_company', 'merc', 'duel', 'tournament'];
  SC.ACT_RULES = [
    [null, s => s.stage === 'infant', 'Too young'],                                    // an infant does nothing: he is cared for
    [MINOR_NO, s => s.minor, 'Too young'],
    [['gamble'], s => s.post.seat || s.post.ruler, 'Beneath your station'],            // a councillor does not throw dice in the yard
    [['plot_throne'], s => !!(s.mil && s.mil.rank < 4 && !s.mil.merc), 'Not in your position'],   // not a file-leader's business
    [['trade_venture'], s => !!(s.mil && !s.mil.merc && s.war.in), 'Not in your position'],         // not while the host is in the field
    [['school'], s => !!((s.mil && !s.mil.merc) || s.post.seat), 'Not in your position'],           // a sworn man or a councillor does not enrol
    [['crime_pick', 'crime_burgle', 'crime_rob', 'crime_smuggle'], s => s.youth && s.cls >= 4, 'Beneath your station'],   // a squire is not a footpad
  ];
  // the reasons that mean "never for a life like his": the Life page and the Path page hide what is refused for these (the
  // list was the Life page's own; it lives here so every page reads one)
  SC.HIDDEN = /Too young|Too old|You are free|Already serving|You already rule|You need a company|You already lead|station|Not in your position|Not with a crown|Kings have|The crown|You command masters|Your duties keep|cannot spare|A sovereign|Others do the chores|Hauling stones/;

  // ---- the person -----------------------------------------------------------------------------------------------------
  const KIN_UP = new Set(['mother', 'father', 'grandparent', 'stepparent', 'guardian']);
  const KIN_SCHEME = ['sc_win', 'sc_harm', 'sc_dig', 'bd_dig', 'bd_lever'];
  const SOCIAL_HARD = ['argue', 'insult', 'duel', 'murder', 'recruit'];
  const SOCIAL_ADULT = ['flirt', 'date', 'propose', 'breakup', 'child', 'nochild', 'divorce', 'gift', 'help', 'nb_tell'];

  let memo = null;
  const sig = pc => {
    const m = pc.mil, W = A.V2W;
    return [pc.id, pc.alive ? 1 : 0, A.age(pc), pc.status, m ? m.rank + (m.merc ? 'm' : '') + (m.div || '') : '-', pc.ruler || '', pc.office || '', pc.job ? pc.job.c + pc.job.r : '-',
      pc.company ? 1 : 0, pc.prison ? 1 : 0, (pc.flags && pc.flags.unfree) || '', pc.noble ? pc.noble.rung : '-', pc.title || '', pc.spouse || '', (pc.children || []).length, pc.coin > 0 ? 1 : 0,
      A.POSTS ? A.POSTS.held(pc.id).join(',') : '', W ? (W.inWar(pc) ? 1 : 0) + '' + (W.canRoom(pc) ? 1 : 0) + (W.deployed(pc) ? 1 : 0) : '', A.S.year, A.S.pc].join('|');
  };

  SC.make = function (pc) {
    const Rc = R(pc), age = A.age(pc), scale = Rc.adult / 16;
    let stage = A.stage(pc);
    if (age < 3 * scale) stage = 'infant';
    const adult = age >= Rc.adult, W = A.V2W, T = A.V2T;
    const held = A.POSTS && A.POSTS.held ? A.POSTS.held(pc.id) : [];
    const kinds = held.map(k => { try { return A.POSTS.cls(k); } catch (e) { return ''; } });
    const seat = !!pc.office || held.some(k => k.startsWith('seat:'));
    const post = { held, kinds, seat, ruler: !!pc.ruler, any: !!pc.ruler || seat || kinds.some(k => k === 'OFFICE' || k === 'FIELD' || k === 'STAFF') || !!pc.mil || !!pc.company };
    const role = A.role ? A.role(pc) : { k: 'idle', name: '' };
    post.name = role.name;
    const youth = stage === 'teen' || (adult && age < Rc.adult + Math.max(2, Math.round(Rc.adult * 0.3)));
    const war = { in: false, rank: null, deployed: false, room: false, arms: false };
    try {
      if (W) { war.in = !!W.inWar(pc); war.rank = W.rank(pc); war.deployed = !!W.deployed(pc); war.room = !!W.canRoom(pc); }
      war.arms = T && T.armsShown ? !!T.armsShown(pc) : age >= 14 * scale;
    } catch (e) {}
    const s = {
      id: pc.id, age, a16: age / scale, stage, adult, minor: !adult, youth, dependent: !adult || youth,
      status: pc.status, cls: A.classOf ? A.classOf(pc) : 2, role: role.k, roleName: role.name, free: !(pc.flags && pc.flags.unfree), prison: !!pc.prison,
      mil: pc.mil || null, post, war,
      home: { married: !!pc.spouse, kids: (pc.children || []).length, parents: (pc.parents || []).filter(id => { const p = A.P(id); return p && p.alive; }) },
    };
    s.settled = post.any || !!pc.job || !!pc.company || !!pc.title || (pc.noble && pc.noble.rung >= 1) || ['gentry', 'noble', 'royal'].includes(pc.status) || !!pc.flags.unfree || !!pc.prison;
    s.sees = k => { const f = SC.SEES[k]; return f ? !!f(s) : true; };
    s.page = k => { const f = SC.PAGES[k]; return f ? !!f(s) : true; };
    s.act = key => {
      for (const [keys, when, why] of SC.ACT_RULES) if ((!keys || keys.includes(key)) && when(s)) return { show: false, why };
      return { show: true, why: '' };
    };
    s.social = (t, opts) => SC.social(s, pc, t, opts);
    return s;
  };

  // the actions on another person's card
  SC.social = function (s, pc, t, opts) {
    if (!Array.isArray(opts) || !t) return opts;
    if (s.stage === 'infant') return opts.filter(o => o === 'time');
    const rel = (pc.rel && pc.rel[t.id]) || {}, kinUp = KIN_UP.has(rel.type) || (pc.parents || []).includes(t.id);
    const tAdult = A.isAdult(t);
    let cut = [];
    if (s.dependent && kinUp) cut = cut.concat(SOCIAL_HARD, KIN_SCHEME);                          // a son does not pick a fight with his father
    if (s.minor) cut = cut.concat(SOCIAL_ADULT, KIN_SCHEME, 'duel', 'murder', 'recruit', 'spar', 'train', tAdult || kinUp ? ['argue', 'insult'] : []);
    if (!tAdult) cut = cut.concat(['duel', 'murder', 'flirt', 'date', 'propose', 'recruit', 'spar', 'train'], s.minor ? [] : ['argue']);   // nor a duel with a child
    if (!cut.length) return opts;
    const drop = new Set(cut);
    return opts.filter(o => !drop.has(o));
  };

  // ---- the function itself -------------------------------------------------------------------------------------------------
  UI.scope = function (pc) {
    pc = pc || (A.S && A.pc && A.pc());
    if (!pc) return SC.NONE;
    let k;
    try { k = sig(pc); } catch (e) { k = null; }
    if (k && memo && memo.k === k && memo.S === A.S && memo.pc === pc) return memo.s;
    const s = SC.make(pc);
    memo = { k, S: A.S, pc, s };
    return s;
  };
  // no life (the title screen): everything is shown, nothing is hidden
  SC.NONE = { stage: 'adult', adult: true, minor: false, dependent: false, settled: true, post: { held: [], kinds: [], any: false }, war: {}, home: { parents: [] }, sees: () => true, page: () => true, act: () => ({ show: true, why: '' }), social: (t, o) => o };
  UI.scope.of = id => { const p = A.P && A.P(id); return p ? SC.make(p) : SC.NONE; };
})();
