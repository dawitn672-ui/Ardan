// War in the Far Lands (round 10, lane 4): armies, fighting styles, orders, Legends and Masters, generals, conflicts
// and sieges of the Great Continent, from the war lore (a-data.core.js, made by gen.mjs).
//
// Everything here is put in place while a game of the Great Continent is open (A.FAR.install) and taken out again for
// any other game (A.FAR.uninstall), the way 99-far-lands adds its lands. A game of the Known World never sees any of
// it: every wrapper below passes straight through while FW.on is false.
//
//   armies    each far realm's divisions are built from its lore troop codes (A.compShares), its doctrine slots
//             (GD.DOCTRINE) from the same codes, its division names and its battle tactics from its lore template;
//             scouts (SC) and engineers (EN), which the release has no troop type for, are two troop types of their own
//   styles    the 303 far styles are LORE.styles like the Known World's: national and chain styles keep schools in
//             their seats (A.schoolList reads them), household styles belong to a far house, maneuvers are battle
//             tactics for commanders who know them
//   orders    the field orders (elite companies, sworn orders, guards) are GD.ORDERS, raised, led and joinable as the
//             release's eight are; the rest (spy services, councils, schools) are organisations with a seat and a head
//   people    the 40 Legends and 160 Masters are people at 1105, seeded once before the orders are raised (so the
//             32-ladder caps see them), with their realms, styles, ages, homes and weaknesses
//   generals  a far general with no temper of his own takes his template's (38-orders)
//   conflicts the lore's ten conflicts start as wars or as wants with a plan behind them (68-casus-belli)
//   sieges    a far city's walls and size lengthen a siege; engineers shorten it (36-sieges' counter)
// State: S.fw (the seeded people and conflicts) and p.fw (a Legend's or Master's lore) exist only in far games.
(function () {
  const D = A.FW_DATA, FAR = A.FAR;
  if (!D || !FAR) return;
  const FW = A.FW = { D, on: false, stats: { seeded: 0 } };
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const hashStr = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const farRealm = id => FAR.D.realms[id] || null;
  const short = id => (farRealm(id) ? farRealm(id).short : A.realm(id) ? A.realmShort(id) : String(id || ''));

  // ---- what is put in place, and taken out again
  const reg = [];
  const set = (obj, k, v) => { if (!obj) return; reg.push([obj, k, own(obj, k), obj[k]]); obj[k] = v; };
  const restore = () => { for (let i = reg.length - 1; i >= 0; i--) { const [o, k, had, old] = reg[i]; if (had) o[k] = old; else delete o[k]; } reg.length = 0; };

  // ---- troop codes the release has no type for: scouts and engineers
  FW.NEW_TROOPS = {
    SC: { base: 'LC', troop: { name: 'Scouts', melee: 2.4, def: 2.4, missile: 1.2, charge: 2, antiCav: 0.4, morale: 44, speed: 3.3, cost: 420, mount: true, skirm: true, pursuit: 1.5, recon: true },
      bn: { men: 400, soft: 4.5, hard: 0.5, def: 8, brk: 5, org: 55, hp: 15, sup: 0.08, spd: 3, eq: { horses: 60, arms: 40 }, cat: 'horse', role: "Scouts: the army's eyes, gone before the fight starts." },
      skill: 'tracking', gear: ['spear', 'leather', null, null, 'selfbow'] },
    EN: { base: 'GA', troop: { name: 'Engineers', melee: 2, def: 3, missile: 0.8, charge: 0, antiCav: 1, morale: 40, speed: 0.8, cost: 400, siege: true },
      bn: { men: 600, soft: 3, hard: 2, def: 16, brk: 1, org: 50, hp: 20, sup: 0.08, spd: 0.8, eq: { arms: 60, harness: 20 }, cat: 'foot', role: 'Engineers: engines, saps and bridges. They make a siege shorter.' },
      skill: 'siegecraft', gear: ['axe', 'padded', 'shield', 'helm'] },
  };
  const installTroops = () => {
    for (const k in FW.NEW_TROOPS) {
      if (GD.TROOPS[k]) continue;
      const N = FW.NEW_TROOPS[k];
      set(GD.TROOPS, k, Object.assign({}, GD.TROOPS[N.base], N.troop));
      set(GD.BN, k, Object.assign({}, GD.BN[N.base], N.bn));
      if (GD.TROOP_SKILL) set(GD.TROOP_SKILL, k, N.skill);
      if (GD.TROOP_GEAR) set(GD.TROOP_GEAR, k, N.gear.map(g => (g && GD.GEAR[g] ? g : null)));
    }
  };

  // ---- templates: the doctrine a general of that school is taught, his lean when no trait gives him a temper, what
  // the divisions are called, and the walls its cities keep (a share added to a siege's length)
  FW.TPL = {
    'MT-01': { doc: 'shock', lean: 'cunning', line: 'Foot Thousand', horse: 'Thousand of Horse', walls: -1 },
    'MT-02': { doc: 'shield', lean: 'cautious', line: 'Registered Division', horse: 'Horse of the Rolls', walls: 0.4 },
    'MT-03': { doc: 'shock', lean: 'bold', line: 'Subject Foot', horse: 'Banner', walls: 0.2 },
    'MT-04': { doc: 'shock', lean: 'bold', line: 'Spear Host', horse: 'Bought Horse', beast: 'Elephant Line', walls: 0.2 },
    'MT-05': { doc: 'shock', lean: 'bold', line: 'Foot of the Grants', horse: 'Bought Riders', walls: 0.2 },
    'MT-06': { doc: 'supply', lean: 'cunning', line: 'Marine Squadron', horse: 'Shore Horse', walls: 0.2 },
    'MT-07': { doc: 'shield', lean: 'cautious', line: 'Highland Foot', horse: 'Pony Riders', walls: 0.1 },
    'MT-08': { doc: 'shield', lean: 'cunning', line: 'Forest Band', horse: 'Riders', walls: 0 },
    'MT-09': { doc: 'shock', lean: 'bold', line: 'Sworn Company', horse: 'Sworn Horse', walls: 0.2 },
    'MT-10': { doc: 'shield', lean: 'cautious', line: 'Oasis Militia', horse: 'Caravan Guard', walls: 0.3 },
    'MT-11': { doc: 'shield', lean: 'cautious', line: 'Wardens', horse: 'Road Riders', walls: 0.2 },
    'MT-12': { doc: 'supply', lean: 'cunning', line: 'Winter Band', horse: 'Sledge Riders', walls: 0 },
    'MT-13': { doc: 'supply', lean: 'bold', line: 'Raiding Crews', horse: 'Riders', walls: -1 },
    'MT-14': { doc: 'shock', lean: 'bold', line: 'Sworn Foot', horse: 'Household Riders', walls: 0.2 },
    'MT-15': { doc: 'shock', lean: 'bold', line: 'Age-Set Regiment', horse: 'Riders', walls: 0 },
    'MT-16': { doc: 'shock', lean: 'bold', line: 'Clan Foot', horse: 'Relay Band', walls: -1 },
    'MT-17': { doc: 'shield', lean: 'cautious', line: 'Hold Guard', horse: 'Riders', walls: 0.5 },
    'MT-18': { doc: 'supply', lean: 'cautious', line: 'Hunters', horse: 'Riders', walls: -1 },
    'MT-19': { doc: 'supply', lean: 'bold', line: 'Canoe Crews', horse: 'Riders', walls: 0 },
    'MT-20': { doc: 'supply', lean: 'cunning', line: 'Desert Foot', horse: 'Camel Corps', walls: 0.1 },
    'MT-21': { doc: 'shield', lean: 'cautious', line: 'City Companies', horse: 'Hired Horse', walls: 0.4 },
    'MT-22': { doc: 'shield', lean: 'steady', line: 'Hunters', horse: 'Riders', beast: 'Giant Pairs', walls: -1 },
    'MT-23': { doc: 'shock', lean: 'bold', line: 'Canal Foot', horse: 'Canal Knights', walls: 0.3 },
  };
  FW.armyOf = function (rid) {
    let a = D.armies[rid];
    if (a) return a;
    const r = A.S && A.S.realms && A.S.realms[rid];
    return r && r.parent ? D.armies[r.parent] || null : null;
  };
  FW.tplOf = rid => { const a = FW.armyOf(rid); return a ? FW.TPL[a.t] || null : null; };

  // ---- armies: shares of men by troop code, and the seven doctrine slots, from the lore's composition
  const CAT = { heavyHorse: ['HC', 'MC', 'CM'], lightHorse: ['HA', 'LC', 'OR', 'SC'], elephants: ['EL'], heavyFoot: ['HI', 'AX', 'PK'], spear: ['SP', 'PK', 'LI'], missile: ['XB', 'AR', 'LB', 'SL', 'EA'], other: ['GA', 'MR', 'LI', 'GI', 'EN', 'SC', 'LV'] };
  const SLOTS = ['heavyHorse', 'lightHorse', 'elephants', 'heavyFoot', 'spear', 'missile', 'other'];
  FW.shares = function (a) {
    if (a._sh) return a._sh;
    const w = {}; let tot = 0;
    for (const k in a.c) {
      if (!GD.BN[k]) continue;
      const v = a.c[k] * (k === 'EL' ? 2.5 : k === 'GI' ? 40 : 1);   // a war elephant and a giant are worth more than their share of the rolls
      w[k] = v; tot += v;
    }
    const out = Object.keys(w).map(k => [k, w[k] / (tot || 1)]).filter(x => x[1] >= 0.005).sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1));
    return (a._sh = out.length ? out : [['SP', 1]]);
  };
  FW.slots = function (a) {
    const used = new Set();
    return SLOTS.map(cat => {
      const opts = CAT[cat].filter(k => a.c[k] > 0 && GD.TROOPS[k] && !(cat !== 'other' && used.has(k)));
      if (!opts.length) return null;
      const k = opts.sort((x, y) => a.c[y] - a.c[x])[0];
      used.add(k);
      return k;
    });
  };
  const cs = A.compShares;
  A.compShares = function (realm, kind) {
    if (FW.on && kind !== 'merc' && kind !== 'unclaimed' && realm !== 'unclaimed') {
      const a = FW.armyOf(realm);
      if (a) return FW.shares(a).map(x => x.slice());
    }
    return cs.apply(this, arguments);
  };
  const td = A.tplDefaults;
  A.tplDefaults = function (r) {
    const out = td.apply(this, arguments);
    try {
      const T = FW.on && r && FW.tplOf(r.id);
      if (T && Array.isArray(out)) for (const t of out) {
        const nm = t.kind === 'horse' ? T.horse : t.kind === 'beast' ? (T.beast || (/Giant/.test(t.name) ? 'Giant Pairs' : 'Elephant Line')) : T.line;
        if (nm) t.name = /Brigade/.test(t.name) ? `${nm} Brigade` : nm;
      }
    } catch (e) { console.error('far war tpl', e); }
    return out;
  };

  // ---- battle tactics from the templates. Those the release has for every realm stay as they are; those it keeps
  // for some Known World realms (the bull's horns, the drum storm) are copied for the far realms of that template;
  // those it lacks are new, from the lore's tactics list.
  const TAC = {
    'TAC-011': { troops: ['HI', 'SP', 'GA', 'PK'], fx: { def: 1.35, noAdvance: true }, desc: 'A few heavy men fill the gate or the breach, and only two or three foes can reach them at once.' },
    'TAC-012': { troops: ['SP', 'LI', 'AR', 'SL', 'GA'], fx: { def: 1.4, missile: 1.1, noAdvance: true }, needs: 'hills|mountains', desc: 'A barricade at the narrowest point, shot falling from both slopes.' },
    'TAC-013': { troops: ['XB', 'AR', 'SP', 'GA'], fx: { missile: 1.3, def: 1.15, noAdvance: true }, deploy: true, desc: 'Shoot into the column while it wades waist-deep.' },
    'TAC-016': { troops: ['HI', 'PK', 'XB', 'SP'], fx: { def: 1.6, noAdvance: true }, needs: 'mountains|hills', desc: 'Three shields block a gallery two metres wide; picks work over them.' },
    'TAC-020': { troops: ['SP', 'LI', 'GA'], fx: { cavStop: 0.3, noAdvance: true }, deploy: true, once: true, desc: 'Staked pits under turf, dug in a night, in front of the line.' },
    'TAC-031': { troops: ['EL'], fx: { horseFear: 15, def: 1.2 }, desc: 'Elephants stand before the foot. Horses will not close with them.' },
    'TAC-035': { troops: ['LC', 'HA', 'OR'], fx: { screen: 0.6, charge: 1.15 }, once: true, desc: 'Loose herds driven ahead hide the riders in their dust.' },
    'TAC-037': { troops: ['HA', 'LC', 'SC'], fx: { envelop: true, att: 1.15 }, needs: 'plains|steppe', desc: 'The ring of the great hunt, closed on men instead of game.' },
    'TAC-038': { troops: ['LI', 'SP', 'AR'], fx: { att: 1.1, fear: 8 }, needs: 'forest|hills', desc: 'Drums and gongs drive the enemy toward the waiting line.' },
    'TAC-040': { troops: ['HA'], fx: { missile: 1.2, evade: 0.6 }, desc: 'Shoot back over the horse at the gallop, so the pursuit rides into the arrows.' },
    'TAC-041': { troops: ['EL'], fx: { missile: 1.3 }, desc: 'Archers in the howdah shoot down over the shields at the officers.' },
    'TAC-045': { troops: ['XB', 'MR'], fx: { missile: 1.3, def: 1.1, noAdvance: true }, desc: 'Loaders span and pass, and every loophole keeps shooting.' },
    'TAC-046': { troops: ['XB'], fx: { missile: 1.35, cavStop: 0.4, noAdvance: true }, deploy: true, desc: 'Crossbows behind a stream: the charge slows to a wade at sixty metres.' },
    'TAC-048': { troops: ['SL'], fx: { missile: 1.35 }, desc: 'Lead and baked clay at a hundred paces, through padding and bone.' },
    'TAC-051': { troops: ['AR', 'LI'], fx: { missile: 1.25, fear: 6 }, needs: 'forest', desc: 'No horn, no shout. Men fall and nobody sees from where.' },
    'TAC-054': { troops: ['LC', 'HA', 'CM', 'SC'], fx: { att: 1.1, evade: 0.6 }, desc: 'Strike the tail of the column, burn, and be gone before it turns.' },
    'TAC-056': { troops: ['CM'], fx: { att: 1.15, pursuit: 1.3 }, needs: 'desert|steppe', desc: 'Across the waterless ground no horse can cross.' },
    'TAC-058': { troops: ['LI', 'MR', 'SC'], fx: { att: 1.25, fear: 10, def: 0.9 }, once: true, desc: 'A picked band by night: sentries, stores and tents.' },
    'TAC-063': { troops: ['LI', 'AR', 'SP'], fx: { ambushCav: 2, att: 1.3 }, needs: 'forest', once: true, desc: 'The column on the forest track is struck from both sides at once.' },
    'TAC-065': { troops: ['LI', 'SL', 'AR', 'SP'], fx: { att: 1.35, fear: 10 }, needs: 'hills|mountains', once: true, desc: 'Head and tail of the column are struck from the heights.' },
    'TAC-067': { troops: ['GI', 'LI'], fx: { att: 1.3 }, needs: 'tundra', once: true, desc: 'Wait at the ice edge where the boats must land.' },
    'TAC-068': { troops: ['AR', 'LI'], fx: { missile: 1.4, missileDef: 1.3 }, needs: 'forest', desc: 'Platforms in the trees over the road; shoot down over the shields.' },
    'TAC-069': { troops: ['LI', 'SL', 'GA'], fx: { fear: 14, att: 1.2 }, needs: 'mountains|hills', once: true, desc: 'Pull the pin and the gorge road is closed under stone.' },
    'TAC-070': { troops: ['LI', 'AR'], fx: { att: 1.15, evade: 0.6 }, needs: 'tundra|forest', desc: 'Skis carry the raid where horses founder.' },
    'TAC-071': { troops: ['LI', 'LC'], fx: { att: 1.15, pursuit: 1.3 }, needs: 'tundra|forest|marsh', desc: 'Sledges on the frozen rivers, fifty kilometres a day.' },
    'TAC-074': { troops: '*', fx: { att: 1.1 }, needs: 'desert', deploy: true, desc: 'March by night, lie up by day, arrive with water left.' },
    'TAC-075': { troops: '*', fx: { att: 1.08, def: 1.08 }, needs: 'tundra|forest', desc: 'Fight in the season nobody fights, on the rivers turned to roads.' },
    'TAC-082': { troops: ['HA', 'LC', 'OR', 'SC'], fx: { pursuit: 1.5 }, desc: 'Fresh horses on a lead rein: nobody outruns them.' },
    'TAC-089': { troops: '*', fx: { def: 1.15 }, needs: 'desert|steppe', deploy: true, desc: 'Hold or foul the wells, and the enemy fights thirsty.' },
    'TAC-090': { troops: '*', fx: { cavStop: 0.5, def: 1.1 }, needs: 'plains|marsh', deploy: true, once: true, desc: 'Cut the dyke and let the flood take the road.' },
    'TAC-091': { troops: ['HA', 'LC', 'CM'], fx: { screen: 0.6, def: 1.1 }, desc: 'A moving ring of riders a kilometre out from the caravan.' },
    'TAC-092': { troops: ['HC', 'MC', 'HI'], fx: { def: 1.2 }, desc: 'Mailed riders before and behind the pilgrims, and nobody breaks through.' },
    'TAC-099': { troops: ['SP', 'GA', 'HI', 'EN'], fx: { def: 1.3, noAdvance: true }, deploy: true, desc: 'Ditch and palisade, one facing the town and one facing out.' },
    'TAC-105': { troops: ['EN', 'XB'], fx: { missile: 1.3, fear: 8 }, desc: 'The counterweight engine throws a hundredweight of stone.' },
    'TAC-111': { troops: ['HI', 'LI', 'GA'], fx: { att: 1.2, fear: 8 }, once: true, desc: 'Out by night to burn the engines, back before the alarm.' },
    'TAC-115': { troops: ['MR', 'GA'], fx: { def: 1.3, noAdvance: true }, deploy: true, desc: 'The chain goes up across the harbour mouth.' },
    'TAC-118': { troops: ['MR', 'XB'], fx: { def: 1.2, missile: 1.1 }, desc: 'Chained boats across the river; nothing passes but bolts.' },
    'TAC-119': { troops: ['MR'], fx: { att: 1.2, charge: 1.2 }, desc: 'The rowers sprint the last two hundred metres and the beak goes in.' },
    'TAC-120': { troops: ['MR'], fx: { att: 1.3, def: 0.9 }, desc: 'Grapnels, a volley across the gap, then over the bow.' },
    'TAC-121': { troops: ['MR'], fx: { fear: 15 }, once: true, desc: 'A hull of pitch and straw drifts down on the anchored fleet.' },
    'TAC-123': { troops: ['MR', 'XB', 'EN'], fx: { missile: 1.3, fear: 8 }, desc: 'Clay pots of fire-oil that burn on water.' },
    'TAC-124': { troops: ['MR', 'LI'], fx: { att: 1.15 }, desc: 'Bows onto the beach, marines into the surf, and form on the sand.' },
    'TAC-125': { troops: ['MR', 'AR'], fx: { missile: 1.2, att: 1.1 }, once: true, desc: 'In under the morning mist, steering by the surf.' },
    'TAC-126': { troops: ['MR', 'LI'], fx: { att: 1.25, def: 0.9 }, once: true, desc: 'Oars muffled in rags, in on the night tide.' },
  };
  FW.tactics = function () {
    if (FW._tac) return FW._tac;
    const byTac = {};
    for (const k in GD.BATTLE_TACTICS) { const T = GD.BATTLE_TACTICS[k]; if (T.tac && !T.style && !/^fw_/.test(k)) byTac[T.tac] = k; }
    const out = {};
    for (const tid in D.templates) {
      const tp = D.templates[tid], users = tp.users;
      for (const tac of tp.tactics) {
        const have = byTac[tac], T0 = have && GD.BATTLE_TACTICS[have];
        if (T0 && !T0.realms) continue;                     // every realm has it already
        const key = 'fw_' + (have || tac);
        const lore = (LORE.tactics || []).find(x => x.id === tac);
        if (!out[key]) {
          if (T0) out[key] = Object.assign({}, T0, { realms: [] });
          else if (TAC[tac]) out[key] = Object.assign({ name: lore ? lore.name : tac, tac }, JSON.parse(JSON.stringify(TAC[tac])), { realms: [] });
          else continue;
        }
        for (const u of users) if (!out[key].realms.includes(u)) out[key].realms.push(u);
      }
    }
    return (FW._tac = out);
  };

  // ---- styles: the release's LORE.styles shape, with the game's own line for where each comes from
  FW.styles = function () {
    if (FW._st) return FW._st;
    const used = {}, out = {};
    const houseFor = st => {
      const R = farRealm(st.realm); if (!R) return null;
      const hs = Object.values(FAR.D.houses).filter(h => h.realm === st.realm).sort((a, b) => (a.kind === 'royal' ? 0 : 1) - (b.kind === 'royal' ? 0 : 1) || (a.id < b.id ? -1 : 1));
      const free = hs.find(h => !used[h.id]) || null;
      if (free) used[free.id] = st.id;
      return free;
    };
    for (const s of D.styles) {
      const st = JSON.parse(JSON.stringify(s)), R = farRealm(s.realm), sh = R ? R.short : 'the Far Lands';
      if (st.kind === 'household') {
        const h = houseFor(s);
        st.house = h ? h.id : null;
        st.origin = h ? `Kept in ${h.name} of ${sh} and taught only to its own blood.` : `Kept in one family of ${sh}.`;
      } else if (st.school) {
        st.origin = st.kind === 'national' ? `The way ${sh} drills its soldiers, taught at ${st.school.name}.` : `A chain of teachers in ${sh}, each the pupil of the last; its yard is ${st.school.name}.`;
      } else st.origin = `A way of fighting of ${sh}.`;
      if (st.maneuver && (!st.maneuver.troops.length || st.maneuver.troops.includes('*'))) st.maneuver.troops = [];
      st.far = true;
      out[st.id] = st;
    }
    return (FW._st = out);
  };

  // ---- orders: the field orders are GD.ORDERS; the rest are organisations
  const NONFIELD = /academy|spy|secret|council|school|mystery|judges|navigators|catcher/;
  const KIND = k => /guard|giant pairs/.test(k) ? 'guard' : /order/.test(k) && !/naval/.test(k) ? 'order' : 'corps';
  const GEAR_OF = (troop, race, st) => race === 'dwarf' ? 'dwarf' : st && /stealth|dagger/.test(st.prof) ? 'shadow'
    : ['HC', 'MC'].includes(troop) ? 'knight' : troop === 'HA' ? 'horsearcher' : ['LC', 'OR', 'CM', 'SC'].includes(troop) ? 'rider'
      : ['AR', 'XB', 'SL', 'LB'].includes(troop) ? 'archer' : 'zanara';
  const TERR_OF = { 'MT-01': ['steppe', 'plains'], 'MT-16': ['steppe', 'plains'], 'MT-03': ['plains', 'steppe'], 'MT-14': ['plains', 'hills'], 'MT-05': ['plains'],
    'MT-04': ['plains', 'forest'], 'MT-07': ['hills', 'mountains'], 'MT-11': ['mountains', 'hills'], 'MT-17': ['mountains'], 'MT-08': ['forest', 'marsh'],
    'MT-12': ['forest', 'tundra'], 'MT-18': ['tundra'], 'MT-22': ['tundra'], 'MT-20': ['desert'], 'MT-10': ['desert'], 'MT-06': ['coast', 'marsh'],
    'MT-13': ['coast'], 'MT-19': ['marsh', 'coast'], 'MT-15': ['plains', 'hills'], 'MT-02': ['plains', 'marsh'], 'MT-21': ['plains'], 'MT-23': ['marsh', 'plains'], 'MT-09': ['hills'] };
  // the reputation group an order or a master is counted in: what people call the best of that kind
  FW.groupOf = function (o) {
    const R = farRealm(o.realm), land = R ? R.land : '', race = R ? R.race : 'human', k = o.kind || '';
    if (race !== 'human' || /dwarven|giant/.test(k)) return 'The Old Bloods';
    if (/monastic|temple|religious|tomb|mystery/.test(k)) return 'The Still Ones';
    if (/pirate|naval|canoe|navigators/.test(k) || land === 'A') return "The Kings of the Isles' Seas";
    if (/outlaw|catcher|sword school/.test(k)) return 'The Nine Who Walk Alone';
    return { F: "The Khagan's Hands", B: 'The Bought Blades', M: 'The Bought Blades', R: 'The Three Walls', H: 'The Still Ones', I: 'The Nine Who Walk Alone', D: 'The Southern Spears', T: 'The Pine Hunters', N: 'The Pine Hunters' }[land] || 'The Bought Blades';
  };
  const TITLE_RX = /^((?:(?:Grand|High|Banner|Warden|Engineer|Old|First|Spear|Sword|Horse|Bow|Lance|Ship|Fleet|Sea|River|Gate|Drum|Lamp)[- ])?(?:Commander|Captain|General|Lord|Lady|Sir|Dame|Keeper|Warden|Master|Mistress|Abbot|Abbess|Prince|Princess|Admiral|Marshal|Elder|Mother|Father|Brother|Sister|Chief|Khan|Noyan|Prior|Sheikh|Emir|Bey|Ras|Sergeant|Champion|Teacher|Abbot|Monk|Nun|Hetman|Ataman|Jarl|Thane|Earl|Duke|Count|Baron|King|Queen)(?:-(?:General|Captain|Commander|Marshal))?) (.+)$/;
  FW.splitTitle = name => { const m = String(name || '').match(TITLE_RX); return m ? { title: m[1], name: m[2] } : { title: '', name: String(name || '') }; };
  FW.orders = function () {
    if (FW._ord) return FW._ord;
    const field = {}, orgs = {}, sty = FW.styles();
    for (const o of D.orders) {
      const R = farRealm(o.realm); if (!R) continue;
      const st = o.style ? sty[o.style] : null, a = D.armies[o.realm], grp = FW.groupOf(o), lead = FW.splitTitle(o.head).title || 'Captain';
      const base = o.troop && o.troop !== '*' && GD.BN[o.troop] ? o.troop : o.troop && FW.NEW_TROOPS[o.troop] ? o.troop : null;
      const rec = { id: o.id, name: o.name.replace(/^The /, 'the '), realm: o.realm, kind: o.kind, seat: o.seat || R.capital, head: o.head, men: o.men, style: o.style, group: grp, troop: o.troop, far: true };
      if (!base || NONFIELD.test(o.kind)) { orgs[o.id] = Object.assign(rec, { ranks: st ? st.ranks.slice(0, 4) : null, field: false }); continue; }
      const kind = KIND(o.kind), B = GD.BN[base] || FW.NEW_TROOPS[base].bn, k = clamp(Math.round(o.men / B.men), 1, 6);
      const sk = (GD.TROOP_SKILL || {})[base] || (FW.NEW_TROOPS[base] || {}).skill || 'spear';
      const cat = B.cat, req = { worth: kind === 'corps' ? (/scout|guide|ski/.test(o.kind) ? 50 : 63) : 77, skill: [sk, kind === 'corps' ? 45 : 55] };
      if (kind !== 'corps') req.fame = 20;
      if (cat === 'horse') { req.stat = ['sta', 48]; if (sk !== 'riding') req.skill2 = ['riding', 40]; }
      if (/royal|banner|sworn order/.test(o.kind)) req.birth = true;
      if (/royal guard|sworn guard/.test(o.kind)) req.invite = true;
      if (/monastic|temple|religious|tomb/.test(o.kind)) req.faith = true;
      if (R.race !== 'human') req.race = R.race === 'orc' ? ['orc', 'halforc'] : [R.race];
      const fx = cat === 'horse' ? { brk: 0.2 } : cat === 'missile' ? { soft: 0.2 } : cat === 'beast' ? { brk: 0.3 } : { def: 0.2 };
      if (/scout|guide|ski|signal/.test(o.kind)) fx.recon = true;
      const why = [`Kept at ${rec.seat}`, `${A.fmt ? A.fmt(o.men) : o.men} on the rolls in 1105`].join('; ') + '.';
      field[o.id] = Object.assign(rec, {
        kind, lkind: o.kind, size: o.men, comps: [[base, k]], exp: kind === 'corps' ? 70 : 80, gear: GEAR_OF(base, R.race, st), lead,
        ranks: st ? st.ranks.slice(0, 4).map(x => x.replace(/\|/g, '/')) : undefined, spec: o.deed, tac: (FW.TPL[a && a.t] || {}).doc || 'shock',
        terr: TERR_OF[a && a.t] || [], fx, req, field: true,
        lore: {
          name: `${A.cap ? A.cap(o.kind) : o.kind} of ${R.short}, kept at ${rec.seat}.`, founded: o.founded ? `In ${o.founded}.` : 'Before the oldest roll anyone keeps.',
          oath: o.oath || 'They swear to the captain in front of the company. Nothing is written down.', marks: o.sign || `${(GD.TROOPS[base] || FW.NEW_TROOPS[base].troop).name} of ${R.short}.`,
          war: st ? `${st.name}: ${st.philosophy}` : 'As the realm fights, only better.', deeds: [o.deed], join: why,
          rumor: `People count them among ${grp}.`, truth: st && st.weakness ? `What beats them: ${st.weakness.replace(/^./, c => c.toLowerCase())}` : 'Nobody has said it to their face.',
        },
      });
    }
    return (FW._ord = { field, orgs });
  };
  FW.org = id => { const O = FW.orders(); return O.field[id] || O.orgs[id] || null; };

  // ---- the ten conflicts of 1105: who presses whom, and how it starts (a war, or a want with a plan behind it)
  FW.CONFLICTS = [
    { k: 'khagan', name: "The khagan's last winter", mode: 'want', a: 'POL-59', b: 'POL-58', s: 'to claim the felt when the old khagan dies' },
    { k: 'sau', name: 'Spring on the Sau', mode: 'want', a: 'POL-37', b: 'POL-36', s: 'to cross the Sau in spring and take the southern court' },
    { k: 'lamp', name: 'The Black Lamp', mode: 'war', a: 'POL-36', b: 'POL-55', cb: 'holy', s: 'to burn out the Black Lamp before it burns another census roll' },
    { k: 'strait', name: 'The Strait', mode: 'want', a: 'POL-111', b: 'POL-110', s: 'to take the Strait and its tolls from Suraeng' },
    { k: 'gulf', name: 'Horses for the Gulf', mode: 'war', a: 'POL-91', b: 'POL-92', cb: 'rivalry', s: "to hold the Upper Plain and the horse road down the Gorge Gate" },
    { k: 'pravith', name: 'The circle of Pravith', mode: 'want', a: 'POL-100', b: 'POL-98', s: "to seat its king on Pravith's throne by his mother's right" },
    { k: 'sunrise', name: 'The Sunrise election', mode: 'want', a: 'POL-139', b: 'POL-136', s: "to keep the Spear-Marshal's staff from becoming one house's heirloom" },
    { k: 'boys', name: "The Basins' boys", mode: 'tension', a: 'POL-58', b: 'POL-78' },
    { k: 'drums', name: 'The lake drums', mode: 'war', a: 'POL-143', b: 'POL-144', cb: 'reconquest', s: 'to take the lake islands from Nkara' },
    { k: 'silk', name: 'The silk that leaks', mode: 'want', a: 'POL-36', b: 'POL-70', s: 'to punish Ozand for the broken Silk Law' },
  ];

  // ---- install and uninstall, with the lands
  FW.install = function () {
    if (FW.on) return;
    try { if (A.registerManeuvers) A.registerManeuvers(); } catch (e) {}   // the Known World's maneuvers first, so the flag is set
    installTroops();
    for (const rid in D.armies) if (farRealm(rid) && GD.DOCTRINE) set(GD.DOCTRINE, rid, FW.slots(D.armies[rid]));
    for (const [k, T] of Object.entries(FW.tactics())) if (!own(GD.BATTLE_TACTICS, k)) set(GD.BATTLE_TACTICS, k, T);
    const sty = FW.styles();
    for (const id in sty) {
      if (own(LORE.styles, id)) continue;
      set(LORE.styles, id, sty[id]);
      const st = sty[id];
      if (st.maneuver) set(GD.BATTLE_TACTICS, 'mv_' + st.id, { name: st.maneuver.name, tac: null, troops: st.maneuver.troops.length ? st.maneuver.troops : '*', fx: Object.assign({}, st.maneuver.fx), desc: `${st.maneuver.desc} (${st.name})`, style: st.id });
    }
    const O = FW.orders(), bn0 = new Set(Object.keys(GD.BN)), tr0 = new Set(Object.keys(GD.TROOPS));
    for (const id in O.field) set(GD.ORDERS, id, O.field[id]);
    // the release's company builder, over the far orders alone (the Known World's are built already)
    const all = GD.ORDERS, only = {};
    for (const id in O.field) only[id] = O.field[id];
    GD.ORDERS = only;
    try { A.orderBuildCompanies(); } finally { GD.ORDERS = all; }
    for (const k of Object.keys(GD.BN)) if (!bn0.has(k)) reg.push([GD.BN, k, false, undefined]);
    for (const k of Object.keys(GD.TROOPS)) if (!tr0.has(k)) reg.push([GD.TROOPS, k, false, undefined]);
    set(GD, 'LEGEND_CAP', (GD.LEGEND_CAP || 5) + D.legends.length);
    const CS = A.CASUS;
    if (CS && CS.WANT) {
      const W = {};
      for (const c of FW.CONFLICTS) if (c.s) { if (W[c.a]) W[c.a].t.push(c.b); else W[c.a] = { t: [c.b], s: c.s }; }
      for (const a in W) if (!own(CS.WANT, a)) set(CS.WANT, a, W[a]);
    }
    FW.on = true;
  };
  FW.uninstall = function () { if (!FW.on) return; restore(); FW.on = false; };
  const inst = FAR.install, unin = FAR.uninstall;
  FAR.install = function () {
    const was = FAR.active, r = inst.apply(this, arguments);
    try { if (!was && FAR.active) FW.install(); } catch (e) { console.error('far war install', e); }
    return r;
  };
  FAR.uninstall = function () {
    try { if (FW.on) FW.uninstall(); } catch (e) { console.error('far war uninstall', e); }
    return unin.apply(this, arguments);
  };

  // ---- the Legends and Masters of 1105, and what else is seeded once in a new far game
  const PROF_GEAR = {
    lance: { weapon: 'lance', armor: 'lamellar', shield: 'kite', helm: 'spangen', mount: 'destrier' },
    mounted: { weapon: 'saber', armor: 'lamellar', helm: 'spangen', mount: 'courser' },
    riding: { weapon: 'saber', armor: 'lamellar', helm: 'spangen', mount: 'courser', ranged: 'horsebow' },
    bow: { weapon: 'saber', armor: 'lamellar', helm: 'spangen', ranged: 'compbow' },
    xbow: { weapon: 'arming', armor: 'brigandine', helm: 'kettle', ranged: 'arbalest' },
    spear: { weapon: 'spear', armor: 'scale', shield: 'shield', helm: 'helm' },
    sword: { weapon: 'longsword', armor: 'lamellar', helm: 'spangen' },
    dagger: { weapon: 'dagger', armor: 'leather', shield: 'parrydagger' },
    stealth: { weapon: 'dagger', armor: 'leather', ranged: 'selfbow' },
    axe: { weapon: 'axe', armor: 'mail', shield: 'shield', helm: 'helm' },
    unarmed: { weapon: 'staff', armor: 'robes' },
    shield: { weapon: 'spear', armor: 'scale', shield: 'tower', helm: 'helm' },
    throwing: { weapon: 'spear', armor: 'hide', shield: 'shield', ranged: 'javelins' },
    sea: { weapon: 'shortsword', armor: 'leather', shield: 'buckler' },
    athletics: { weapon: 'spear', armor: 'hide', shield: 'shield', ranged: 'javelins' },
    tracking: { weapon: 'spear', armor: 'hide', ranged: 'selfbow' },
    melee: { weapon: 'sword', armor: 'mail', shield: 'shield', helm: 'helm' },
    command: { weapon: 'longsword', armor: 'lamellar', helm: 'spangen', mount: 'courser' },
    siegecraft: { weapon: 'axe', armor: 'mail', helm: 'helm', ranged: 'xbow' },
    dualwield: { weapon: 'sword', armor: 'leather', shield: 'offsword' },
    tactics: { weapon: 'longsword', armor: 'lamellar', helm: 'spangen' },
  };
  const WEAPON_SKILLS = ['melee', 'sword', 'axe', 'spear', 'dagger', 'dualwield', 'shield', 'unarmed', 'lance', 'mounted', 'bow', 'xbow', 'throwing'];
  // the weakness the lore gives, as the body or the mind it costs
  FW.weakFx = function (w) {
    const t = String(w || '').toLowerCase(), fx = {};
    if (/eye|sight|blind|see/.test(t)) fx.ins = -5;
    if (/knee|leg|hip|gout|foot|feet|thigh|ankle|limp|back/.test(t)) fx.spd = -5;
    if (/shoulder|arm|hand|wrist|finger|elbow/.test(t)) fx.str = -4;
    if (/\bold\b|age|seventy|eighty|ninety|years|cane/.test(t)) fx.sta = -6;
    if (/drink|wine|beer|spirit|opium/.test(t)) fx.wil = -5;
    if (/deaf|ear/.test(t)) fx.ins = (fx.ins || 0) - 3;
    if (/proud|pride/.test(t)) fx.trait = 'proud';
    else if (/reckless|temper|rage|anger/.test(t)) fx.trait = 'reckless';
    return fx;
  };
  // the province a Legend or Master is found in on 1 January 1105: one named in the lore's whereabouts, else their capital
  let provIdx = null;
  const provByName = () => {
    if (provIdx) return provIdx;
    provIdx = new Map();
    for (const P of A.S.prov) if (P && P.name && !provIdx.has(P.name)) provIdx.set(P.name, P.id);
    return provIdx;
  };
  FW.provNamed = name => provByName().get(name);
  FW.PROF_GEAR = PROF_GEAR; FW.WEAPON_SKILLS = WEAPON_SKILLS;
  FW.homeFor = function (x) {
    const M = provByName(), txt = (x.where || '') + ' ' + (x.school || '');
    let best = null;
    for (const w of txt.match(/[A-Z][\w'-]+(?: [A-Z][\w'-]+)*/g) || []) if (M.has(w) && (!best || w.length > best.length)) best = w;
    if (best) return M.get(best);
    const r = A.S.realms[x.realm];
    return r && r.capitalProv != null ? r.capitalProv : null;
  };
  FW.makePerson = function (x, kind, target) {
    const race = A.CAST_RACE[x.race] || 'human', realm = A.S.realms[x.realm] ? x.realm : 'unclaimed';
    const sp = FW.splitTitle(x.name), nm = A.parseCastName(sp.name), st = A.style(x.style);
    const p = A.newPerson({ given: nm.given, sur: nm.sur, epithet: x.epithet || nm.epithet, surMode: nm.mode, sex: x.sex === 'F' ? 'F' : 'M', race, realm,
      cult: A.cultureFor(race, realm), faith: A.faithFor(race, realm), born: x.born || 1070, status: 'gentry', potBonus: 18 });
    const home = FW.homeFor(x); if (home != null) p.home = home;
    p.occ = sp.title ? `${sp.title}${x.school ? ', master of ' + x.school : ''}` : kind === 'legend' ? `a Legend of ${x.group}` : `master of ${x.school || st && st.name || 'a fighting style'}`;
    p.fw = { id: x.id, kind, group: x.group, weak: x.weak, where: x.where };
    if (x.school) p.fw.school = x.school;
    if (x.fight) p.fw.fight = x.fight;
    if (x.price) p.fw.price = x.price;
    p.fame = kind === 'legend' ? 60 + hashStr(x.id) % 30 : 35 + hashStr(x.id) % 30;
    // the style they are known for, at its top ranks
    const rank = kind === 'legend' ? 5 : kind === 'master' ? 4 + hashStr(x.id + 'r') % 2 : 3;
    p.styles = {}; if (st) { p.styles[st.id] = { rank, xp: GD.STYLE_XP[rank - 1] || 0 }; p.styleMain = st.id; }
    // arms for the style
    const wpn = st ? [st.prof].concat(st.weapons).find(k => WEAPON_SKILLS.includes(k) && k !== 'melee' && k !== 'mounted') || st.prof : 'sword';
    const G = PROF_GEAR[wpn] || PROF_GEAR[st ? st.prof : 'sword'] || PROF_GEAR.sword;
    p.gear = Object.assign({}, p.gear || {}, { weapon: null, armor: null, shield: null, helm: null, mount: null, ranged: null });
    for (const s of ['weapon', 'armor', 'shield', 'helm', 'mount', 'ranged']) p.gear[s] = G[s] && GD.GEAR[G[s]] ? G[s] : null;
    if (!p.gear.weapon) p.gear.weapon = 'spear';
    p.gearQ = { weapon: kind === 'legend' ? 'master' : 'fine', armor: 'fine', ranged: 'fine' };
    // skills of the style, then body and skill brought to the worth of their tier (no dice: a step at a time)
    const wk = new Set(['melee']);
    if (st) { if (GD.SKILLS[st.prof]) wk.add(st.prof); for (const w of st.weapons) if (GD.SKILLS[w]) wk.add(w); }
    // the skill of the weapon in hand and of the bow on the back count most
    try { const k0 = A.weaponSkillOf(p); if (GD.SKILLS[k0]) wk.add(k0); } catch (e) {}
    const rg = p.gear.ranged && GD.GEAR[p.gear.ranged]; if (rg && GD.WEAPON_SKILL && GD.SKILLS[GD.WEAPON_SKILL[rg.kind]]) wk.add(GD.WEAPON_SKILL[rg.kind]);
    if (p.gear.mount) { wk.add('riding'); wk.add('mounted'); }
    if (p.gear.shield) wk.add('shield');
    const ws = [...wk].filter(k => GD.SKILLS[k]);
    for (const k of ws) p.skills[k] = Math.max(p.skills[k] || 0, kind === 'legend' ? 86 : 74);
    p.skills.command = Math.max(p.skills.command || 0, 40 + hashStr(x.id + 'c') % 40);
    p.skills.tactics = Math.max(p.skills.tactics || 0, 30 + hashStr(x.id + 't') % 40);
    const base = kind === 'legend' ? 64 : kind === 'master' ? 54 : 50;
    for (const s of ['spd', 'ins', 'wil', 'str', 'sta']) p.st[s] = Math.max(p.st[s] || 0, base + hashStr(x.id + s) % 12);
    // the weakness the lore names comes first and stays: the body it costs is not trained back, the rest makes up
    // the worth of the tier (so a Legend with a bad eye is a Legend with a slow left side, not a lesser fighter)
    const wf = FW.weakFx(x.weak), frozen = new Set();
    for (const s of ['spd', 'ins', 'str', 'sta', 'wil']) if (wf[s]) { p.st[s] = Math.max(20, p.st[s] + wf[s]); frozen.add(s); }
    const tune = (lo, top) => {
      for (let i = 0; i < 200; i++) {
        const w = A.fightWorth(p);
        if (w > target + 1) {
          if (p.st.spd > lo + 2 || p.st.ins > lo + 2) { for (const s of ['spd', 'ins']) if (!frozen.has(s)) p.st[s] = Math.max(lo, p.st[s] - 1); if (frozen.has('spd') && frozen.has('ins')) break; }
          else if (ws.some(k => p.skills[k] > 50)) for (const k of ws) p.skills[k] = Math.max(50, p.skills[k] - 1);
          else break;
        } else if (w < target - 1) {
          let moved = false;
          for (const k of ws) if (p.skills[k] < top) { p.skills[k] += 1; moved = true; }
          if (!moved || i % 3 === 0) for (const s of ['spd', 'ins', 'str', 'sta', 'wil']) if (!frozen.has(s) && p.st[s] < top - 2) { p.st[s] += 1; moved = true; }
          if (!moved) break;
        } else break;
      }
    };
    tune(40, 98);
    // a fighter the weapon of the style cannot carry to the tier (a staff, an old man's spear) goes to the stops
    const floor = kind === 'legend' ? 118 : kind === 'master' ? 91 : 77;
    if (A.fightWorth(p) < floor + 1) { p.gearQ.weapon = 'master'; p.gearQ.armor = 'master'; tune(40, 100); }
    if (A.fightWorth(p) < floor + 1 && p.gear.weapon !== 'spear') { p.gear.weapon = 'spear'; ws.push('spear'); p.skills.spear = Math.max(p.skills.spear || 0, 80); tune(40, 100); }
    if (wf.trait && GD.TRAITS[wf.trait] && !p.traits.includes(wf.trait)) p.traits.push(wf.trait);
    return p;
  };
  FW.TARGET = { legend: [123, 12], master: [96, 10], elite: [84, 5] };
  FW.seed = function () {
    const S = A.S;
    if (!S || S.fw) return;
    const fw = S.fw = { v: 1, p: {}, cf: [] };
    provIdx = null;
    const C = A.ladderCensus ? A.ladderCensus() : { legends: [], masters: {} };
    let legends = C.legends.length;
    const masters = {};
    for (const rid in C.masters) masters[rid] = C.masters[rid].length;
    const cap = GD.MASTER_CAP || 5;
    const tgt = (kind, id) => { const [a, b] = FW.TARGET[kind]; return a + hashStr(id) % b; };
    for (const L of D.legends) {
      const kind = legends < (GD.LEGEND_CAP || 5) ? 'legend' : 'master';
      const p = FW.makePerson(L, kind, tgt(kind, L.id));
      fw.p[L.id] = p.id;
      if (A.fightWorth(p) >= 118) legends++;
    }
    for (const M of D.masters) {
      const full = (masters[M.realm] || 0) >= cap;
      const kind = full ? 'elite' : 'master';
      const p = FW.makePerson(M, kind, tgt(kind, M.id));
      p.fw.kind = 'master'; if (full) p.fw.past = 1;   // a master by name, an Elite by the ladder: the realm has five already
      fw.p[M.id] = p.id;
      if (A.tierOf(A.fightWorth(p)).k === 't5') masters[M.realm] = (masters[M.realm] || 0) + 1;
    }
    // order heads the lore names lead their orders (the release raises a leader only for an order that has none)
    const byName = {};
    for (const x of D.legends.concat(D.masters)) byName[x.name] = fw.p[x.id];
    const O = FW.orders();
    fw.heads = {};
    for (const id in O.field) {
      const o = O.field[id], r = S.realms[o.realm], pid = byName[o.head];
      if (!r || !pid) continue;
      r.orders = r.orders || {}; r.orders[id] = pid; fw.heads[id] = pid;
      const L = A.P(pid); if (L) L.occ = A.orderLeadTitle(o);
    }
    for (const id in O.orgs) { const pid = byName[O.orgs[id].head]; if (pid) fw.heads[id] = pid; }
    // a capital's walls follow its template: a walled river city, an oasis or a hold keeps strong walls; a camp of
    // tents, a beach of boats or an ice camp keeps none
    for (const rid in D.armies) {
      const r = S.realms[rid], T = FW.TPL[D.armies[rid].t];
      if (!r || !T || r.capitalProv == null) continue;
      const P = S.prov[r.capitalProv];
      if (!P) continue;
      if (T.walls >= 0.3) P.fort = Math.max(P.fort || 0, 3);
      else if (T.walls >= 0.2) P.fort = Math.max(P.fort || 0, 2);
      else if (T.walls < 0) P.fort = Math.min(P.fort || 0, 1);
    }
    try { if (FW.seedCast) FW.seedCast(); } catch (e) { console.error('far war cast', e); }   // c-life.core.js
    FW.stats.seeded++;
  };
  // the conflicts begin once the world stands (after the orders are raised)
  FW.conflicts = function () {
    const S = A.S, fw = S && S.fw;
    if (!fw || fw.cfDone) return;
    fw.cfDone = 1;
    if (S.year > 1105) return;   // a far game saved before this feature: its world has moved on from 1105
    for (const c of FW.CONFLICTS) {
      const ra = S.realms[c.a], rb = S.realms[c.b];
      if (!ra || !rb || !ra.alive || !rb.alive) continue;
      const rec = { k: c.k, a: c.a, b: c.b, mode: c.mode };
      // the grudge both ways, in the relations every AI decision reads
      for (const [x, y] of [[ra, c.b], [rb, c.a]]) {
        if (x.rel && typeof x.rel[y] === 'number') x.rel[y] = clamp(x.rel[y] - (c.mode === 'tension' ? 20 : 35), -100, 100);
        else if (x.rel) x.rel[y] = c.mode === 'tension' ? -20 : -35;
        if (Array.isArray(x.rivals) && !x.rivals.includes(y)) x.rivals.push(y);
      }
      if (c.mode === 'war') {
        try {
          const already = A.atWar(c.a).some(w => w && ((w.leadA === c.a && w.leadD === c.b) || (w.leadA === c.b && w.leadD === c.a)));
          if (!already) { const w = A.startWar(c.a, c.b, null, c.cb); rec.w = w && w.id != null ? w.id : true; }
        } catch (e) { console.error('far war conflict', c.k, e); }
      } else if (c.mode === 'want') {
        // the plan is on the record from the first year (68-casus-belli keeps it while the ruler's temper holds it)
        ra.csPlan = { t: c.b, k: 'want', s: 0.6, y: S.year, by: ra.ruler || null, n: 1 };
      }
      fw.cf.push(rec);
    }
  };
  // While the far orders are raised at once, 32-ladder's census (every living person's worth, once per order) is
  // kept up to date by hand instead of read 111 times: each new leader is added to it as he is made.
  let CEN = null;
  const census = A.ladderCensus;
  if (typeof census === 'function') A.ladderCensus = function () { return CEN || census.apply(this, arguments); };
  const raise = A.orderRaise;
  A.orderRaise = function (r, id) {
    const before = CEN && r && r.orders ? r.orders[id] : null, d = raise.apply(this, arguments);
    try {
      const L = CEN && d && A.P(d.cmd);
      if (L && L.id !== before && L.alive && L.st) {
        const k = A.tierOf(A.fightWorth(L)).k;
        if (k === 't6') CEN.legends.push(L.id); else if (k === 't5') (CEN.masters[L.realm] = CEN.masters[L.realm] || []).push(L.id); else if (k === 't4') CEN.elites++;
      }
    } catch (e) {}
    return d;
  };
  // the trim 32-ladder gives an order leader in a full realm: weapon skills and body down a step at a time, no dice
  FW.trim = function (p, to) {
    const ws = Object.keys(p.skills).filter(k => WEAPON_SKILLS.includes(k) || k === 'riding');
    for (let i = 0; i < 120 && A.fightWorth(p) >= to; i++) {
      for (const k of ws) p.skills[k] = Math.max(45, p.skills[k] - 2);
      for (const s of ['spd', 'ins', 'str', 'sta', 'wil']) p.st[s] = Math.max(35, p.st[s] - 1);
    }
  };
  // no realm holds more Masters than GD.MASTER_CAP: the order leaders the release made are trimmed first, then the
  // lore's Masters with the least worth (still masters of their style by name, Elites by the ladder)
  FW.capMasters = function () {
    const C = census.apply(A, []), cap = GD.MASTER_CAP || 5, lore = new Set(Object.values(A.S.fw.p));
    for (const rid in C.masters) {
      const L = C.masters[rid];
      if (L.length <= cap) continue;
      const order = L.map(A.P).sort((a, b) => (lore.has(a.id) ? 1 : 0) - (lore.has(b.id) ? 1 : 0) || A.fightWorth(a) - A.fightWorth(b) || a.id - b.id);
      for (const p of order.slice(0, L.length - cap)) { FW.trim(p, 88); if (p.fw) p.fw.past = 1; }
    }
  };
  const oe = A.ordersEnsure;
  A.ordersEnsure = function () {
    const first = FW.on && A.S && !A.S.fw;
    try { if (first) FW.seed(); } catch (e) { console.error('far war seed', e); }
    let r;
    try { if (first && census) CEN = census.apply(A, []); r = oe.apply(this, arguments); } finally { CEN = null; }
    try { if (first && A.S.fw) FW.capMasters(); } catch (e) { console.error('far war cap', e); }
    try { if (FW.on && A.S && A.S.fw && !A.S.fw.cfDone) FW.conflicts(); } catch (e) { console.error('far war conflicts', e); }
    return r;
  };

  // ---- generals: a far general with no temper of his own takes his template's (38-orders)
  const G = A.GENERALS;
  if (G && typeof G.temper === 'function') {
    const tp = G.temper;
    G.temper = function (p) {
      const t = tp.apply(this, arguments);
      if (!FW.on || t !== 'steady' || !p) return t;
      const T = FW.tplOf(p.realm);
      return T && T.lean && G.DIALS[T.lean] ? T.lean : t;
    };
  }

  // ---- doctrine: a far general who has chosen none fights by his template's (shock for the horse peoples and the
  // elephant kings, shield for the river empires and the holds, supply for the fleets and the taiga). The player's
  // own doctrine stays a choice.
  if (typeof A.doctrineOf === 'function') {
    const dof = A.doctrineOf;
    A.doctrineOf = function (p) {
      const d = dof.apply(this, arguments);
      if (d || !FW.on || !p || (A.S && p.id === A.S.pc)) return d;
      const T = FW.tplOf(p.realm);
      return T && GD.DOCTRINES[T.doc] || d;
    };
  }

  // ---- sieges: a far city's walls and size make the siege longer, engineers make it shorter. The release adds one
  // day a day to the counter (P.sgd) and the town falls at its need; here a far siege's day counts for 1/k of a day.
  FW.siegeK = function (P) {
    if (!P || P.id < FAR.D.base) return 1;
    let k = 1;
    const own0 = P.owner && farRealm(P.owner) ? P.owner : null, T = own0 ? FW.tplOf(own0) : null, r = own0 && A.S.realms[own0];
    if (T && r && r.capitalProv === P.id && T.walls > 0) k += T.walls;
    if ((P.pop || 0) > 450000) k += 0.3 * Math.log2(P.pop / 450000);
    return k;
  };
  FW.engineers = function (L) {
    let n = 0;
    for (const d of L) { const r = A.realm(d.r), t = r && r.forces && r.forces.tpl[d.tpl]; if (t && t.bns) n += t.bns.filter(c => c === 'EN').length; }
    return Math.min(0.5, n * 0.12);
  };
  const sd = A.wsSiegeDay;
  if (typeof sd === 'function') A.wsSiegeDay = function (live) {
    if (FW.on) try {
      const S = A.S, by = {};
      for (const d of live) if (!d.path.length && d.atk == null) (by[d.loc] = by[d.loc] || []).push(d);
      for (const loc in by) {
        const P = S.prov[loc];
        if (!P || P.id < FAR.D.base || !P.sgBy || !by[loc].some(d => d.r === P.sgBy)) continue;
        const k = FW.siegeK(P) / (1 + FW.engineers(by[loc].filter(d => d.r === P.sgBy)));
        if (k !== 1 && (P.sgd || 0) > 0) P.sgd = Math.max(0, P.sgd - (1 - 1 / k));
      }
    } catch (e) { console.error('far war siege', e); }
    return sd.apply(this, arguments);
  };

  // ---- learning from a Legend or a Master
  FW.lore = p => (p && p.fw && p.fw.id ? p.fw : null);
  FW.trainReqs = function (pc, t) {
    const out = [], R2 = (label, ok) => out.push({ label, ok: !!ok });
    const st = t.styleMain && A.style(t.styleMain);
    R2('In the same place as them', pc.home != null && pc.home === t.home);
    R2('Grown', A.isAdult(pc));
    R2('Free to come and go', !(pc.flags && pc.flags.unfree) && !pc.prison);
    const fee = FW.fee(t);
    R2(`${fee} coin for a season of lessons`, pc.coin >= fee);
    if (st) R2(`Some ${GD.SKILLS[st.prof] || st.prof} already (20+)`, A.skill(pc, st.prof) >= 20 || (pc.styles && pc.styles[st.id]));
    return out;
  };
  FW.fee = t => (t.fw && t.fw.kind === 'legend' ? 160 : 70);
  FW.train = function (tid) {
    const pc = A.pc(), t = A.P(tid);
    if (!pc || !t || !t.alive || !FW.lore(t)) return { ok: false, msg: 'They are not here.' };
    const miss = FW.trainReqs(pc, t).filter(x => !x.ok);
    if (miss.length) return { ok: false, msg: 'Not yet: ' + miss.map(x => x.label).join('; ') + '.' };
    const st = t.styleMain && A.style(t.styleMain);
    pc.coin -= FW.fee(t);
    // a Master takes most who pay and can stand; a Legend takes whom it pleases (renown, wits and the skill itself)
    const legend = t.fw.kind === 'legend', bar = legend ? 0.35 : 0.75, odds = clamp(bar + (pc.fame || 0) / 300 + (st ? A.skill(pc, st.prof) / 250 : 0) + (pc.rel[t.id] ? pc.rel[t.id].op / 400 : 0), 0.05, 0.95);
    if (!A.chance(odds)) {
      A.log(`${A.fullName(t, false)} watches you work for an hour, gives your coin back, and says to come again in a year.`, 'bad');
      pc.coin += FW.fee(t);
      return { ok: false, msg: 'Turned away.' };
    }
    if (!pc.rel[t.id] || pc.rel[t.id].type !== 'mentor') A.link(pc, t, 'mentor', 25, 'student');
    pc.flags.fwMentor = t.id;
    if (st) {
      const have = pc.styles && pc.styles[st.id] ? pc.styles[st.id].rank : 0, top = (t.styles[st.id] || {}).rank || 1;
      if (!have) A.learnStyle(pc, st.id, 1);
      else A.styleXp(pc, st.id, 30);
      if (have && have >= top) A.log(`You know as much of ${st.name} as ${t.given} will teach. What is left is fights.`);
    }
    A.trainSkill(pc, st ? st.prof : 'melee', 4);
    A.log(`You become a student of ${A.fullName(t, false)}${st ? ', in ' + st.name : ''}.`, 'big');
    return { ok: true, msg: 'Taken on.' };
  };
  // a year as a Master's student counts like a year in a school of that style
  const sy = A.styleYear;
  if (typeof sy === 'function') A.styleYear = function (pc) {
    const r = sy.apply(this, arguments);
    try {
      const m = pc && pc.flags && pc.flags.fwMentor != null ? A.P(pc.flags.fwMentor) : null;
      if (m && m.alive && m.styleMain && pc.styles && pc.styles[m.styleMain] && m.home === pc.home) A.styleXp(pc, m.styleMain, 18 + A.stat(pc, 'ins') / 8);
    } catch (e) {}
    return r;
  };

  // ---- the view: a Legend's or Master's lore in the person card, with the three things the player can do
  Object.assign(UI.A, {
    fwSeek(v) { const t = A.P(+v); if (!t || t.home == null) return; const r = A.travelTo(t.home); r && r.msg && UI.toast(r.msg); r && r.ok && A.simpleClose && A.simpleClose(); UI.refresh(); },
    fwTrain(v) { const r = FW.train(+v); r.msg && UI.toast(r.msg); UI.refresh(); },
  });
  FW.personBlock = function (pc, t) {
    const L = FW.lore(t); if (!L) return '';
    const st = t.styleMain && A.style(t.styleMain), here = pc.home != null && pc.home === t.home;
    const kind = L.kind === 'legend' ? 'A Legend of the Far Lands' : L.past ? 'A Master by name, past the height of it' : 'A Master of the Far Lands';
    let h = `<div class="sep"></div><div class="group-h">${UI.esc(kind)}</div><div class="small">`;
    h += `<div>Counted among <b>${UI.esc(L.group || '')}</b>.${st ? ` Fights in ${UI.esc(st.name)}.` : ''}</div>`;
    if (L.fight) h += `<div class="muted">${UI.esc(L.fight)}</div>`;
    if (L.weak) h += `<div>Weakness: ${UI.esc(L.weak)}</div>`;
    if (L.price) h += `<div class="muted">${UI.esc(L.price)}</div>`;
    h += `<div class="muted">Found at ${UI.esc(t.home != null && A.prov(t.home) ? A.provName(t.home) : 'no fixed place')}.</div></div>`;
    if (t.alive && pc.alive && t.id !== pc.id) {
      const reqs = FW.trainReqs(pc, t);
      h += `<div class="row" style="margin-top:6px">${here ? '' : `<button class="small" data-a="fwSeek" data-v="${t.id}">Seek ${UI.esc(A.him ? A.him(t) : 'them')} out</button>`}<button class="small" data-a="fwTrain" data-v="${t.id}" ${reqs.every(x => x.ok) ? '' : 'disabled'}>Ask to train under ${UI.esc(A.him ? A.him(t) : 'them')}</button><button class="small danger" data-a="int" data-v="${t.id}|duel">Challenge to a duel</button></div>`;
      h += `<div class="reqs">${reqs.map(x => `<span class="req ${x.ok ? 'ok' : 'no'}">${x.ok ? '✓' : '✗'} ${UI.esc(x.label)}</span>`).join('')}</div>`;
    }
    return h;
  };
  const pm = UI.personModal;
  if (typeof pm === 'function') UI.personModal = function (t) {
    const h = pm.apply(this, arguments);
    try {
      const pc = A.pc(); if (!FW.on || !pc || !t || !FW.lore(t)) return h;
      const block = FW.personBlock(pc, t), end = h.lastIndexOf('</div>');
      return end > 0 ? h.slice(0, end) + block + h.slice(end) : h + block;
    } catch (e) { return h; }
  };
  // the orders card: in a far game there are far more than eight
  const oc = UI.ordersCard;
  if (typeof oc === 'function') UI.ordersCard = function () {
    const h = oc.apply(this, arguments);
    if (!FW.on || !h) return h;
    const n = Object.keys(GD.ORDERS).length;
    return h.replace(/Eight in all of Ardan, strongest first\.[^<]*/, `${n} in all of Ardan, strongest first. The Known World's are a few hundred strong; the far empires keep companies of thousands.`);
  };
  // the Codex's power page: the Legends and Masters of the Far Lands, by reputation group
  const pp = UI.powerPage;
  if (typeof pp === 'function') UI.powerPage = function (pc) {
    const h = pp.apply(this, arguments);
    try {
      const S = A.S; if (!FW.on || !S || !S.fw) return h;
      const groups = {};
      for (const L of D.legends) { const p = A.P(S.fw.p[L.id]); if (p && p.alive) (groups[L.group] = groups[L.group] || []).push(p); }
      let n = 0;
      for (const M of D.masters) { const p = A.P(S.fw.p[M.id]); if (p && p.alive) n++; }
      const heard = p => (p.fame || 0) >= 40 || p.realm === pc.realm || (pc.rel && pc.rel[p.id]);
      let x = `<div class="group-h">The names of the Far Lands</div><p class="small ink2">${D.groups.length} names the far roads give their best. ${n} masters of the far styles teach and fight there.</p>`;
      for (const g of D.groups) {
        const L = (groups[g.name] || []).filter(heard);
        if (!L.length) continue;
        x += `<div class="small"><b>${UI.esc(g.name)}:</b> ${L.map(p => `<span class="click u" data-a="ov" data-v="person:${p.id}">${UI.esc(A.fullName(p, false))}</span>`).join(', ')}</div>`;
      }
      const at = h.indexOf('<div class="group-h">Beasts by scale</div>');
      return at > 0 ? h.slice(0, at) + x + h.slice(at) : h + x;
    } catch (e) { return h; }
  };
})();
