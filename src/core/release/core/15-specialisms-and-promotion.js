// The release's core, specialisms and promotion: Specialisms, mastery, arms, doctrines, growth and the promotion board.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.
// Defines: SP, GD.SPECS, GD.MASTERY, GD.ARMS, GD.DOCTRINES, A.specOf, A.masteryOf, A.masteryRank, A.specMul,
// A.specPay, A.specOfferWeight, A.armBonus, A.doctrineOf, A.specChoices, A.pickSpec, A.CHOICE_FN (+), A.specYear,
// A.recapSnap, A.recapMake, A.whatNow, A.teacherFor, A.SESSION_ACTS, A.sessionQ, A.sessionNote, A.trainingSession,
// A.growthYear, A.PROMO_REQ, A.promoBoard, promoBoardNow, A.promoCheck, promoCheckNow.

const SP = (k, n, d, sk, pay, tags) => ({
  k,
  n,
  d,
  sk,
  pay: pay || 1.1,
  tags: tags || null,
});

GD.SPECS = {
  farm: [
    SP(
      "grain",
      "The plough",
      "Wheat, barley, rye. Big fields, long days, full barns.",
      ["husbandry", "stewardship"],
      1.12,
      /harvest|grain|field|plough|mill/,
    ),
    SP(
      "stock",
      "Herds & dairy",
      "Cows, cheese, butter for the town market.",
      ["husbandry", "trade"],
      1.1,
      /cow|cattle|cheese|dairy|calf/,
    ),
    SP(
      "orchard",
      "Orchards & vines",
      "Slow to grow, sweet to sell: apples, cider, wine.",
      ["craft", "trade"],
      1.18,
      /orchard|vine|cider|wine|apple/,
    ),
  ],
  herd: [
    SP(
      "drover",
      "Drover",
      "Walk the herds to far markets and come back rich or robbed.",
      ["riding", "survival"],
      1.12,
      /drove|market|road/,
    ),
    SP(
      "breeder",
      "Breeder",
      "Better bulls, better rams, better prices.",
      ["husbandry", "learning"],
      1.15,
      /breed|bull|ram|stud/,
    ),
    SP(
      "warden",
      "Warden of the pastures",
      "Wolves and rustlers fear your dogs.",
      ["intimidation", "tracking"],
      1.08,
      /wolf|rustl|thief|raid/,
    ),
  ],
  fish: [
    SP("deep", "Deep-water man", "Far out, big catch, big storms.", ["sea", "athletics"], 1.18, /storm|deep|whale/),
    SP(
      "netmaster",
      "Net-master",
      "The best nets on the coast, mended your way.",
      ["craft", "trade"],
      1.08,
      /net|market/,
    ),
    SP(
      "harbor",
      "Harbor dealer",
      "Buy from the boats, sell to the town.",
      ["trade", "persuasion"],
      1.15,
      /harbor|dock|smuggl/,
    ),
  ],
  labor: [
    SP(
      "hauler",
      "Hauler",
      "Strong back, steady pay, and you know every road and warehouse.",
      ["athletics", "logistics"],
      1.05,
    ),
    SP(
      "builder",
      "Builder's hand",
      "Learn the mason's and carpenter's tricks on the job.",
      ["craft", "athletics"],
      1.08,
    ),
    SP("foreman", "Gang-boss", "You do not carry; you shout.", ["command", "intimidation"], 1.15),
  ],
  servant: [
    SP(
      "chamber",
      "Chamber servant",
      "Close to the lord, closer to the secrets.",
      ["etiquette", "intrigue"],
      1.08,
      /lady|lord|chamber|secret/,
    ),
    SP("kitchen", "Kitchen & cellar", "Food, wine and the gossip of the back stairs.", ["craft", "trade"], 1.06),
    SP("house", "Household steward", "Keys, ledgers and the other servants.", ["stewardship", "learning"], 1.15),
  ],
  smith: [
    SP(
      "armorer",
      "Armorer",
      "Mail, plate and helms. Knights are your clients.",
      ["craft", "melee"],
      1.15,
      /armor|armour|mail|plate|helm|knight/,
    ),
    SP(
      "weaponsmith",
      "Weaponsmith",
      "Blades, spearheads, axes. Your steel is your name.",
      ["craft", "sword"],
      1.15,
      /blade|sword|spear|axe|steel/,
    ),
    SP(
      "farrier",
      "Farrier & toolsmith",
      "Horseshoes, ploughs, nails. Never rich, never idle.",
      ["husbandry", "trade"],
      1.08,
      /horse|plough|tool|shoe|nail/,
    ),
  ],
  mason: [
    SP(
      "cathedral",
      "Temple builder",
      "Vaults and spires to the glory of the gods.",
      ["craft", "faith"],
      1.12,
      /cathedral|temple|vault|chapel|shrine/,
    ),
    SP(
      "fortress",
      "Fortress mason",
      "Walls, towers, gatehouses. Kings pay well for stone.",
      ["siegecraft", "craft"],
      1.15,
      /wall|tower|castle|fort|gate/,
    ),
    SP(
      "carver",
      "Carver",
      "Tombs, statues, saints in stone.",
      ["craft", "persuasion"],
      1.12,
      /tomb|statue|carv|monument/,
    ),
  ],
  weaver: [
    SP("dyer", "Dyer", "Colors nobody else can make. Purple is power.", ["craft", "trade"], 1.12, /dye|color|purple/),
    SP(
      "tapestry",
      "Tapestry maker",
      "Battles and saints in thread, for great halls.",
      ["craft", "learning"],
      1.15,
      /tapestry|banner|hanging/,
    ),
    SP(
      "clothier",
      "Clothier",
      "Buy wool, sell cloth, hire others to weave.",
      ["trade", "persuasion"],
      1.15,
      /cloth|wool|silk|order/,
    ),
  ],
  bowyer: [
    SP(
      "warbow",
      "War bows",
      "Bows by the thousand for the royal arsenal.",
      ["bow", "craft"],
      1.12,
      /army|war|contract|arsenal/,
    ),
    SP(
      "hunting",
      "Hunting bows",
      "Light, sweet bows for lords who hunt.",
      ["tracking", "craft"],
      1.12,
      /hunt|lord|deer/,
    ),
    SP(
      "fletcher",
      "Fletcher",
      "Arrows: never enough, always needed.",
      ["craft", "trade"],
      1.08,
      /arrow|fletch|feather/,
    ),
  ],
  carpenter: [
    SP(
      "shipwright",
      "Shipwright",
      "Keels and hulls. Your ships will outlive you.",
      ["sea", "craft"],
      1.15,
      /ship|keel|hull|boat/,
    ),
    SP(
      "joiner",
      "Joiner",
      "Chests, altars, fine furniture for fine houses.",
      ["craft", "persuasion"],
      1.1,
      /furniture|chest|altar|chair/,
    ),
    SP(
      "wright",
      "Wheel- & engine-wright",
      "Wagons in peace, siege engines in war.",
      ["siegecraft", "craft"],
      1.12,
      /engine|wagon|wheel|siege|trebuchet/,
    ),
  ],
  brewer: [
    SP(
      "alemaster",
      "Ale-master",
      "The best ale in the province, and everyone knows it.",
      ["craft", "trade"],
      1.12,
      /ale|beer|brew/,
    ),
    SP(
      "innkeeper",
      "Innkeeper",
      "Beds, food, stories and the whole road's gossip.",
      ["persuasion", "etiquette"],
      1.12,
      /inn|guest|tavern|travel/,
    ),
    SP(
      "distiller",
      "Distiller",
      "Spirits, cordials and medicines in copper stills.",
      ["learning", "craft"],
      1.15,
      /still|spirit|cordial/,
    ),
  ],
  merchant: [
    SP(
      "staples",
      "Staples",
      "Grain, salt, timber: boring and everywhere.",
      ["trade", "logistics"],
      1.12,
      /grain|salt|timber|wool/,
    ),
    SP(
      "luxury",
      "Luxuries",
      "Silk, spice and jewels for those who can pay.",
      ["trade", "etiquette"],
      1.2,
      /silk|spice|jewel|perfume|luxur/,
    ),
    SP(
      "banking",
      "Moneylending",
      "Lend to lords. Collect from lords. Survive lords.",
      ["trade", "learning"],
      1.22,
      /loan|bank|debt|lend|credit/,
    ),
  ],
  scribe: [
    SP(
      "chancery",
      "Chancery",
      "Charters, seals and royal letters.",
      ["learning", "etiquette"],
      1.12,
      /seal|charter|letter|chancery/,
    ),
    SP(
      "accounts",
      "Accounts",
      "Tax rolls and ledgers. Numbers tell the truth.",
      ["stewardship", "learning"],
      1.15,
      /tax|ledger|account|audit/,
    ),
    SP(
      "archive",
      "Archivist",
      "The old documents everybody forgot — and some want forgotten.",
      ["learning", "intrigue"],
      1.08,
      /archive|secret|old|forg/,
    ),
  ],
  healer: [
    SP(
      "surgeon",
      "Surgeon",
      "Saws, needles and nerve. Armies need you.",
      ["medicine", "athletics"],
      1.12,
      /wound|surg|saw|battle|arrow/,
    ),
    SP(
      "herbalist",
      "Herbalist",
      "Fevers, flux and the green cures of the hedgerow.",
      ["medicine", "survival"],
      1.08,
      /herb|fever|plague|flux|sick/,
    ),
    SP(
      "physician",
      "Physician to the great",
      "Lords, ladies and their very private complaints.",
      ["medicine", "etiquette"],
      1.22,
      /lord|court|noble|lady|king|queen/,
    ),
  ],
  clergy: [
    SP("preacher", "Preacher", "Crowds, sermons, souls.", ["faith", "persuasion"], 1.05, /sermon|preach|crowd|heresy/),
    SP(
      "scholarpriest",
      "Scholar-priest",
      "Scripture, law and old tongues.",
      ["faith", "learning"],
      1.08,
      /scripture|book|law|archive/,
    ),
    SP(
      "almoner",
      "Almoner",
      "Feed the poor, keep the hospital, count the alms.",
      ["faith", "stewardship"],
      1.06,
      /poor|alms|famine|hospital/,
    ),
  ],
  sailor: [
    SP(
      "navigator",
      "Navigator",
      "Stars, currents and charts.",
      ["sea", "learning"],
      1.15,
      /storm|chart|star|reef|course/,
    ),
    SP(
      "boatswain",
      "Boatswain",
      "The crew answers to you, not the captain.",
      ["sea", "command"],
      1.1,
      /crew|mutin|deck/,
    ),
    SP("tradercap", "Trader-captain", "Every voyage a venture.", ["sea", "trade"], 1.2, /cargo|trade|port|venture/),
  ],
  pirate: [
    SP("boarder", "Boarder", "First over the rail with a cutlass.", ["melee", "sea"], 1.12, /board|fight|prize/),
    SP(
      "raider",
      "Raid captain",
      "Plan the strike, split the share.",
      ["command", "intimidation"],
      1.18,
      /raid|captain|share/,
    ),
    SP(
      "smuggler",
      "Smuggler",
      "No blood, just quiet coves and quiet coin.",
      ["deception", "trade"],
      1.15,
      /smuggl|cove|customs/,
    ),
  ],
  thief: [
    SP(
      "burglar",
      "Burglar",
      "Roofs, locks and sleeping houses.",
      ["stealth", "athletics"],
      1.15,
      /roof|lock|house|vault|burgl/,
    ),
    SP(
      "fence",
      "Fence & cutpurse",
      "Light fingers, fast hands, a buyer for everything.",
      ["deception", "trade"],
      1.12,
      /purse|fence|market|stolen/,
    ),
    SP(
      "gangboss",
      "Gang-boss",
      "Others steal for you. You keep them in line.",
      ["intimidation", "command"],
      1.2,
      /gang|turf|boss|enforcer/,
    ),
  ],
  hunter: [
    SP("tracker", "Tracker", "Read the ground like a book.", ["tracking", "survival"], 1.1, /track|trail|lost/),
    SP(
      "slayer",
      "Beast-slayer",
      "Boars, bears, wolves — and worse.",
      ["spear", "bow"],
      1.15,
      /beast|boar|bear|wolf|lion/,
    ),
    SP(
      "trapper",
      "Trapper & furrier",
      "Furs fetch silver in every city.",
      ["trade", "survival"],
      1.15,
      /fur|trap|pelt/,
    ),
  ],
  minstrel: [
    SP("balladeer", "Balladeer", "Songs that make taverns cry.", ["music", "persuasion"], 1.1, /song|ballad|tavern/),
    SP(
      "courtpoet",
      "Court poet",
      "Verses for princes; sharp tongues for their rivals.",
      ["music", "etiquette"],
      1.18,
      /court|prince|lord|verse/,
    ),
    SP(
      "player",
      "Player & mummer",
      "Masks, plays and a troupe of rogues.",
      ["music", "deception"],
      1.12,
      /play|troupe|mask|stage/,
    ),
  ],
  miner: [
    SP(
      "shaft",
      "Shaft-master",
      "Deep shafts, timbered well. Men live because of you.",
      ["craft", "command"],
      1.12,
      /shaft|collapse|deep/,
    ),
    SP(
      "prospector",
      "Prospector",
      "Find the seam. Get rich, maybe.",
      ["survival", "learning"],
      1.15,
      /seam|vein|gold|silver|prospect/,
    ),
    SP("smelter", "Smelter", "Ore in, ingots out.", ["craft", "trade"], 1.12, /smelt|ingot|ore/),
  ],
  courtier: [
    SP(
      "favorite",
      "Favorite",
      "The ruler laughs at your jokes. Everyone notices.",
      ["persuasion", "etiquette"],
      1.15,
      /favor|feast|king|queen|ruler/,
    ),
    SP(
      "schemer",
      "Schemer",
      "Whispers, letters and patient knives.",
      ["intrigue", "deception"],
      1.12,
      /plot|secret|letter|poison/,
    ),
    SP(
      "administrator",
      "Administrator",
      "You make the realm actually work.",
      ["stewardship", "diplomacy"],
      1.18,
      /tax|office|council|ledger/,
    ),
  ],
  lawyer: [
    SP(
      "criminal",
      "Criminal advocate",
      "Murderers, thieves and the innocent who look guilty.",
      ["persuasion", "intimidation"],
      1.12,
      /murder|thief|trial|crime|accus/,
    ),
    SP(
      "commercial",
      "Merchant law",
      "Contracts, debts and shipwrecked cargoes.",
      ["trade", "learning"],
      1.2,
      /contract|debt|cargo|merchant|guild/,
    ),
    SP(
      "royal",
      "Royal & canon law",
      "Inheritance, titles and the church courts.",
      ["learning", "faith"],
      1.15,
      /inherit|title|will|church|crown/,
    ),
  ],
  spy: [
    SP(
      "infiltrator",
      "Infiltrator",
      "Become someone else, anywhere.",
      ["stealth", "deception"],
      1.12,
      /disguise|infiltr|enemy|camp/,
    ),
    SP(
      "cipher",
      "Cipher-master",
      "Codes, seals and letters read twice.",
      ["learning", "intrigue"],
      1.15,
      /cipher|code|letter|seal/,
    ),
    SP("knife", "The knife", "Some problems are people.", ["dagger", "stealth"], 1.18, /kill|knife|poison|silence/),
  ],
  bounty: [
    SP(
      "tracker",
      "Manhunter",
      "No one hides from you for long.",
      ["tracking", "survival"],
      1.12,
      /track|hunt|trail|fled/,
    ),
    SP(
      "negotiator",
      "Negotiator",
      "Most outlaws surrender if you talk right.",
      ["persuasion", "intimidation"],
      1.1,
      /surrender|talk|hostage/,
    ),
    SP(
      "brute",
      "Brute",
      "Dead or alive, but mostly alive enough.",
      ["melee", "intimidation"],
      1.15,
      /fight|dead|brawl/,
    ),
  ],
  knight: [
    SP("lancer", "Lancer", "The lists are your home.", ["lance", "riding"], 1.15, /joust|lance|tourney|list/),
    SP("duelist", "Duelist", "Swords at dawn, on foot.", ["sword", "melee"], 1.12, /duel|sword|honor|challenge/),
    SP(
      "courtly",
      "Courtly knight",
      "Banners, ladies and a great lord's patronage.",
      ["etiquette", "persuasion"],
      1.18,
      /lady|patron|lord|court|feast/,
    ),
  ],
  explorer: [
    SP("pathfinder", "Pathfinder", "Roads where there are none.", ["survival", "tracking"], 1.1, /pass|road|wild|lost/),
    SP("cartographer", "Cartographer", "Maps that kings pay for.", ["learning", "craft"], 1.18, /map|chart|survey/),
    SP(
      "tradeexp",
      "Merchant-venturer",
      "New lands mean new markets.",
      ["trade", "diplomacy"],
      1.18,
      /trade|market|caravan|tribe/,
    ),
  ],
  artist: [
    SP(
      "portrait",
      "Portraitist",
      "The great want to be remembered handsome.",
      ["craft", "etiquette"],
      1.15,
      /portrait|lord|lady|face/,
    ),
    SP(
      "fresco",
      "Frescoes & icons",
      "Saints on walls, for temples and abbeys.",
      ["craft", "faith"],
      1.12,
      /fresco|icon|temple|altar|saint/,
    ),
    SP(
      "sculptor",
      "Sculptor",
      "Bronze and marble. Heavy work, lasting fame.",
      ["craft", "athletics"],
      1.15,
      /statue|bronze|marble|tomb/,
    ),
  ],
  cook: [
    SP(
      "pastry",
      "Pastry & sugar",
      "Subtleties: castles of sugar for great feasts.",
      ["craft", "trade"],
      1.12,
      /pastry|sugar|feast|sweet/,
    ),
    SP(
      "feast",
      "Master of feasts",
      "Two hundred guests, forty dishes, one kitchen.",
      ["command", "stewardship"],
      1.18,
      /feast|banquet|wedding|guests/,
    ),
    SP("taster", "Taster & guardian", "You know poison by smell.", ["medicine", "intrigue"], 1.15, /poison|taste|plot/),
  ],
  teacher: [
    SP(
      "tutor",
      "Tutor of the great",
      "Princes and heirs, spoiled and clever.",
      ["etiquette", "learning"],
      1.2,
      /heir|prince|lord|noble/,
    ),
    SP(
      "schoolmaster",
      "Schoolmaster",
      "A room of children and one switch.",
      ["learning", "persuasion"],
      1.08,
      /school|child|pupil/,
    ),
    SP(
      "scholar",
      "Scholar",
      "Your own research, your own disputes.",
      ["learning", "diplomacy"],
      1.12,
      /disput|research|book|college/,
    ),
  ],
  horsemaster: [
    SP(
      "destrier",
      "Destrier trainer",
      "War-horses that do not flinch at steel.",
      ["riding", "mounted"],
      1.15,
      /destrier|war|knight|charge/,
    ),
    SP(
      "breeder",
      "Breeder",
      "Bloodlines of horses, worth more than men's.",
      ["husbandry", "trade"],
      1.15,
      /breed|foal|mare|stud/,
    ),
    SP(
      "remount",
      "Remount master",
      "Horses for whole armies.",
      ["logistics", "riding"],
      1.12,
      /army|remount|cavalry|contract/,
    ),
  ],
  envoy: [
    SP(
      "negotiator",
      "Negotiator",
      "Treaties are won in the small hours.",
      ["diplomacy", "persuasion"],
      1.15,
      /treaty|peace|terms|negoti/,
    ),
    SP(
      "spyenvoy",
      "Spy-envoy",
      "Every embassy is a listening post.",
      ["intrigue", "deception"],
      1.12,
      /secret|spy|letter|cipher/,
    ),
    SP(
      "herald",
      "Herald-lore",
      "Arms, precedence and ancient rights.",
      ["etiquette", "learning"],
      1.1,
      /arms|herald|precedence|title/,
    ),
  ],
  engineer: [
    SP(
      "siege",
      "Siege engineer",
      "Trebuchets and mines. Walls fall.",
      ["siegecraft", "tactics"],
      1.15,
      /siege|trebuchet|mine|wall|engine/,
    ),
    SP(
      "works",
      "Bridges & mills",
      "Peace-works that make realms rich.",
      ["craft", "stewardship"],
      1.15,
      /bridge|mill|dam|road|canal/,
    ),
    SP(
      "sapper",
      "Sapper",
      "Tunnels under walls, with fire at the end.",
      ["siegecraft", "athletics"],
      1.12,
      /tunnel|sap|mine|undermin/,
    ),
  ],
  pitfighter: [
    SP("brawler", "Brawler", "Fists and grit.", ["unarmed", "athletics"], 1.12, /fist|brawl|wager/),
    SP(
      "blade",
      "Blade-dancer",
      "Steel in both hands, crowds on their feet.",
      ["melee", "dualwield"],
      1.15,
      /blade|sword|crowd/,
    ),
    SP(
      "showman",
      "Showman",
      "Win the crowd and the purse follows.",
      ["persuasion", "unarmed"],
      1.18,
      /crowd|show|wager|fame/,
    ),
  ],
  steward: [
    SP(
      "estate",
      "Estate steward",
      "Fields, mills and tenants.",
      ["stewardship", "husbandry"],
      1.12,
      /harvest|tenant|mill|field/,
    ),
    SP(
      "treasury",
      "Treasury man",
      "Rents, debts and the lord's silver.",
      ["stewardship", "trade"],
      1.18,
      /debt|rent|silver|tax|ledger/,
    ),
    SP(
      "castellan",
      "Castellan",
      "Walls, garrisons and siege stores.",
      ["logistics", "command"],
      1.15,
      /castle|garrison|siege|wall/,
    ),
  ],
};

// [X1 baked patch core/02-content-fixes TXT-MENTOR-LEGACY] The "The teacher" mastery still promised "+1 legacy", a
// system that was removed.
GD.MASTERY = [
  SP(
    "name",
    "A name in the trade",
    "Your name is the brand. +2 reputation a year, +1 offer a year, a little renown.",
    null,
    1.1,
  ),
  SP("purse", "The purse", "Every coin counts. +30% pay and +30% from your own house of trade.", null, 1.3),
  SP(
    "mentor",
    "The teacher",
    "Apprentices learn twice as fast and love you for it; your trade remembers you.",
    null,
    1.1,
  ),
];

GD.ARMS = {
  line: {
    n: "The line",
    d: "Shield wall and pike block. You hold when others run.",
    sk: ["shield", "spear"],
    troops: ["HI", "SP", "PK", "AX", "GA"],
    bonus: {
      battle: 6,
      mission: 0,
    },
  },
  skirm: {
    n: "Skirmishers & scouts",
    d: "Ahead of the army: scouting, raids, ambushes.",
    sk: ["stealth", "tracking"],
    troops: ["LI", "SL", "LC"],
    bonus: {
      battle: 2,
      mission: 8,
    },
  },
  horse: {
    n: "Horse",
    d: "Lance and saddle. Charges, pursuits, glory.",
    sk: ["riding", "mounted"],
    troops: ["HC", "MC", "LC", "HA", "CM"],
    bonus: {
      battle: 5,
      mission: 4,
    },
  },
  bow: {
    n: "Bowmen",
    d: "Arrows and bolts. Kill them before they reach you.",
    sk: ["bow", "xbow"],
    troops: ["LB", "AR", "XB", "EA", "SL"],
    bonus: {
      battle: 4,
      mission: 3,
    },
  },
  engineers: {
    n: "Engineers",
    d: "Siege lines, bridges, mines. Fortresses fall to you.",
    sk: ["siegecraft", "logistics"],
    troops: null,
    bonus: {
      battle: 1,
      mission: 3,
      siege: 0.35,
    },
  },
};

GD.DOCTRINES = {
  shock: {
    n: "Shock",
    d: "Attack, attack, attack. Your armies hit 10% harder in the field.",
    sk: ["tactics", "command"],
    pow: 1.1,
  },
  shield: {
    n: "Shield",
    d: "Pick the ground and let them come. Your armies defend 15% harder.",
    sk: ["tactics", "shield"],
    defPow: 1.15,
  },
  supply: {
    n: "Supply",
    d: "Armies march on bread. Your armies carry 30% more supply and lose less to winter.",
    sk: ["logistics", "stewardship"],
    supply: 1.3,
  },
  siege: {
    n: "Siegecraft",
    d: "Walls are a puzzle. Your sieges go 35% faster.",
    sk: ["siegecraft", "logistics"],
    siege: 0.35,
  },
};

A.specOf = pc =>
  pc && pc.job && pc.job.spec && GD.SPECS[pc.job.c] ? GD.SPECS[pc.job.c].find(s => s.k === pc.job.spec) : null;

A.masteryOf = pc => (pc && pc.job && pc.job.spec2 ? GD.MASTERY.find(s => s.k === pc.job.spec2) : null);

A.masteryRank = c => Math.min(3, GD.CAREERS[c].ranks.length - 1);

A.specMul = function (p, k) {
  if (!p || p.id !== (A.S && A.S.pc)) return 1;
  let m = 1;
  const s = A.specOf(p);
  if ((s && s.sk && s.sk.includes(k) && (m *= 1.35), p.mil)) {
    const a = GD.ARMS[p.mil.arm];
    if (a && a.sk.includes(k)) m *= 1.35;
    const d = GD.DOCTRINES[p.mil.doctrine];
    if (d && d.sk.includes(k)) m *= 1.25;
  }
  return m;
};

A.specPay = function (pc) {
  let m = 1;
  const s = A.specOf(pc);
  if (s) m *= s.pay;
  const t = A.masteryOf(pc);
  if (t) m *= t.pay;
  return m;
};

A.specOfferWeight = function (pc, e) {
  const s = A.specOf(pc);
  return s && s.tags && s.tags.test(e.id + " " + (typeof e.title == "string" ? e.title : "")) ? 3 : 1;
};

A.armBonus = (pc, k) => {
  const a = pc && pc.mil && GD.ARMS[pc.mil.arm];
  return (a && a.bonus[k]) || 0;
};

A.doctrineOf = p => (p && p.mil && GD.DOCTRINES[p.mil.doctrine]) || null;

A.specChoices = function (pc) {
  const out = [];
  if (pc.job && GD.SPECS[pc.job.c]) {
    if (pc.job.r >= 1 && !pc.job.spec)
      out.push({
        tier: "spec",
        title: `${GD.CAREERS[pc.job.c].name}: choose your path`,
        opts: GD.SPECS[pc.job.c],
      });
    else {
      if (pc.job.r >= A.masteryRank(pc.job.c) && pc.job.spec && !pc.job.spec2)
        out.push({
          tier: "mastery",
          title: "Mastery: what will your name stand for?",
          opts: GD.MASTERY,
        });
    }
  }
  if (pc.mil) {
    if (pc.mil.rank >= 2 && !pc.mil.arm)
      out.push({
        tier: "arm",
        title: "Choose your arm of service",
        opts: Object.entries(GD.ARMS).map(([k, a]) => ({
          k,
          n: a.n,
          d: a.d,
          sk: a.sk,
        })),
      });
    else {
      if (pc.mil.rank >= 5 && pc.mil.arm && !pc.mil.doctrine)
        out.push({
          tier: "doctrine",
          title: "Choose your doctrine of war",
          opts: Object.entries(GD.DOCTRINES).map(([k, a]) => ({
            k,
            n: a.n,
            d: a.d,
            sk: a.sk,
          })),
        });
    }
  }
  return out;
};

A.pickSpec = function (tier, k) {
  const pc = A.pc();
  if (!pc)
    return {
      ok: false,
    };
  if (tier === "spec" && pc.job) {
    const s = (GD.SPECS[pc.job.c] || []).find(x => x.k === k);
    if (!s)
      return {
        ok: false,
      };
    pc.job.spec = k;
    pc.specs = pc.specs || {};
    pc.specs[pc.job.c] = k;
    A.log(`You choose your path: ${s.n}. ${s.d}`, "big");
    for (const sk of s.sk) A.trainSkill(pc, sk, 3);
    return {
      ok: true,
    };
  }
  if (tier === "mastery" && pc.job) {
    const s = GD.MASTERY.find(x => x.k === k);
    return s
      ? ((pc.job.spec2 = k),
        A.log(`Mastery: ${s.n}. ${s.d}`, "big"),
        {
          ok: true,
        })
      : {
          ok: false,
        };
  }
  if (tier === "arm" && pc.mil) {
    const a = GD.ARMS[k];
    if (!a)
      return {
        ok: false,
      };
    if (((pc.mil.arm = k), a.troops)) {
      const av = A.wsTroopsFor ? A.wsTroopsFor(pc.mil.realm) : Object.keys(GD.TROOPS),
        t = a.troops.find(x => av.includes(x)) || a.troops[0];
      if (GD.TROOPS[t]) pc.mil.troop = t;
    }
    for (const sk of a.sk) A.trainSkill(pc, sk, 3);
    A.log(`You take service with ${a.n.toLowerCase()}. ${a.d}`, "big");
    return {
      ok: true,
    };
  }
  if (tier === "doctrine" && pc.mil) {
    const d = GD.DOCTRINES[k];
    if (!d)
      return {
        ok: false,
      };
    pc.mil.doctrine = k;
    for (const sk of d.sk) A.trainSkill(pc, sk, 3);
    A.log(`Your doctrine of war: ${d.n}. ${d.d}`, "big");
    return {
      ok: true,
    };
  }
  return {
    ok: false,
  };
};

Object.assign(A.CHOICE_FN, {
  pickSpec(o) {
    A.pickSpec(o.tier, o.k);
  },
});

A.specYear = function (pc) {
  if (!pc || !pc.alive) return;
  if (pc.job) {
    if (!pc.job.spec && pc.specs && pc.specs[pc.job.c]) pc.job.spec = pc.specs[pc.job.c];
    const s = A.specOf(pc);
    if (s) {
      A.trainSkill(pc, s.sk[0], 2);
      A.trainSkill(pc, s.sk[1], 1);
    }
    const t = A.masteryOf(pc);
    if ((t && t.k === "name" && (A.addRep(pc, 2), A.chance(0.4) && A.fame(pc, 1)), t && t.k === "mentor"))
      for (const id of pc.job.apprentices || []) {
        const a = A.P(id);
        if (a && a.alive) {
          A.trainSkill(a, GD.CAREERS[pc.job.c].skill || "craft", 6);
          A.addOp(a, pc, 3);
        }
      }
  }
  if (pc.mil) {
    const a = GD.ARMS[pc.mil.arm];
    if (a) A.trainSkill(pc, a.sk[0], 1.5);
    const d = A.doctrineOf(pc);
    if (d) A.trainSkill(pc, d.sk[0], 1.5);
  }
  const ch = A.specChoices(pc)[0];
  // [X1 baked patch war/99997-v2-war V2W-RANK-WORDS] Rank words that contradict (playtest 2, new 16). The chain of
  // command said "Commander · leads 3,200" (GD.MIL's number) under "2nd Aldmark Line 7,530 · Commander … you": the
  // release makes a Commander his division's commander (d.cmd), so he leads all of it; A.V2W.leads gives the
  // division's men then, else the rank's number. The arm-of-service card said "You are a sergeant now" to anyone who
  // reached rank 2 without an arm, a noble who enlisted as a Squad Captain included; it now names the rank he holds.
  // In the source: read the division's men for its commander, and the rank title in the card.
  if (ch && !A.S.queue.some(q => q.type === "choice" && q.spec) && A.isAdult(pc))
    A.queue({
      type: "choice",
      spec: true,
      title: ch.title,
      text:
        ch.tier === "arm"
          ? "You are " +
            (t => (/^[AEIOU]/.test(t) ? "an " : "a ") + t.toLowerCase())(GD.MIL[pc.mil.rank].title) +
            " now, and the captains want to know where you belong. Your choice decides what you train, how you fight and where you stand in the order of battle."
          : ch.tier === "doctrine"
            ? "You will lead thousands. How do you mean to win?"
            : ch.tier === "mastery"
              ? "You are a master now. Masters are remembered for one thing."
              : "You have risen in your trade. Every master you know took one road. Which is yours?",
      options: ch.opts.map(o => ({
        t: `${o.n} — ${o.d}${o.sk ? " (" + o.sk.map(x => GD.SKILLS[x] || GD.STAT_NAMES[x] || x).join(", ") + ")" : ""}`,
        fn: "pickSpec",
        arg: {
          tier: ch.tier,
          k: o.k,
        },
      })),
    });
};

A.recapSnap = function (pc) {
  const r = A.realm(pc.ruler || pc.realm);
  return {
    year: A.S.year,
    coin: pc.coin + A.assetValue(pc),
    fame: pc.fame,
    health: pc.health,
    happy: pc.happy,
    skills: Object.assign({}, pc.skills),
    st: Object.fromEntries(GD.STATS.map(k => [k, A.stat(pc, k)])),
    job: pc.job
      ? {
          c: pc.job.c,
          r: pc.job.r,
          rep: pc.job.rep || 0,
        }
      : null,
    mil: pc.mil
      ? {
          rank: pc.mil.rank,
          merit: pc.mil.merit,
        }
      : null,
    noble: pc.noble ? pc.noble.rung : null,
    rel: Object.keys(pc.rel).length,
    kids: pc.children.length,
    spouse: pc.spouse,
    realm: r
      ? {
          id: r.id,
          stab: r.stability,
          treas: r.treasury,
          provs: A.realmProvs(r.id).length,
          wars: A.atWar(r.id).map(w => w.id),
          allies: r.allies.length,
        }
      : null,
    owner: (A.prov(pc.home) || {}).owner,
  };
};

A.recapMake = function (pc, b) {
  const L = [],
    add = (t, cls) => L.push([t, cls || ""]),
    dc = Math.round(pc.coin + A.assetValue(pc) - b.coin);
  if (Math.abs(dc) >= 5) add(`${dc > 0 ? "+" : "−"}${A.coin(Math.abs(dc))} net worth`, dc > 0 ? "good" : "bad");
  if (pc.fame - b.fame >= 1) add(`Renown +${Math.round(pc.fame - b.fame)}`, "good");
  const ups = Object.keys(pc.skills)
    .map(k => [k, (pc.skills[k] || 0) - (b.skills[k] || 0)])
    .filter(x => x[1] >= 2)
    .sort((a, c) => c[1] - a[1])
    .slice(0, 3);
  if (ups.length)
    add(
      ups.map(([k, d]) => `${GD.SKILLS[k]} ${Math.round(b.skills[k] || 0)}→${Math.round(pc.skills[k])}`).join(", "),
      "good",
    );
  const su = GD.STATS.map(k => [k, A.stat(pc, k) - (b.st[k] != null ? b.st[k] : A.stat(pc, k))]).filter(
    x => Math.abs(x[1]) >= 1,
  );
  if (su.length)
    add(
      su.map(([k, d]) => `${GD.STAT_SHORT ? GD.STAT_SHORT[k] : k} ${d > 0 ? "+" : ""}${Math.round(d)}`).join(" · "),
      su.some(x => x[1] < 0) ? "" : "good",
    );
  if (pc.job && b.job && pc.job.c === b.job.c && pc.job.r > b.job.r)
    add(`Promoted: ${GD.CAREERS[pc.job.c].ranks[pc.job.r][0]}`, "big");
  if (pc.job && !b.job) add(`New trade: ${GD.CAREERS[pc.job.c].ranks[pc.job.r][0]}`, "good");
  if (pc.job && b.job && pc.job.c === b.job.c && Math.abs((pc.job.rep || 0) - b.job.rep) >= 3)
    add(
      `Reputation ${Math.round(b.job.rep)}→${Math.round(pc.job.rep || 0)}`,
      (pc.job.rep || 0) > b.job.rep ? "good" : "bad",
    );
  if (pc.mil && b.mil && pc.mil.rank > b.mil.rank) add(`Promoted: ${GD.MIL[pc.mil.rank].title}`, "big");
  // [X1 baked patch people/99999-v2-renown RN-WORDS] Merit was shown as a counter ("Merit 112 / 30") in the year's
  // summary and explained as a bar to meet; it no longer decides promotion. In the source: say where you stand for
  // the next rank in words, and say how the board decides.
  if (pc.mil && b.mil && pc.mil.rank === b.mil.rank && GD.MIL[pc.mil.rank + 1])
    add(
      A.RN && A.RN.on
        ? `For ${GD.MIL[pc.mil.rank + 1].title}: ${A.RN.standWords(pc, "mil", pc.mil.rank)}`
        : `Merit ${Math.round(pc.mil.merit)}/${GD.MIL[pc.mil.rank + 1].merit}`,
      "",
    );
  if (pc.noble && b.noble != null && pc.noble.rung > b.noble) add(`Raised to ${A.nobleTitle(pc)}`, "big");
  if (pc.spouse && pc.spouse !== b.spouse) add("Married", "good");
  if (pc.children.length > b.kids)
    add(`${pc.children.length - b.kids} child${pc.children.length - b.kids > 1 ? "ren" : ""} born`, "good");
  if (pc.health < b.health - 15) add(`Health ${Math.round(b.health)}→${Math.round(pc.health)}`, "bad");
  const r = A.realm(pc.ruler || pc.realm);
  if (b.realm && r && r.id === b.realm.id) {
    const nw = A.atWar(r.id).filter(w => !b.realm.wars.includes(w.id));
    for (const w of nw) add(`War: ${w.name}`, "bad");
    const ended = b.realm.wars.filter(id => !A.S.wars.some(w => w.id === id));
    if (ended.length) add(`${ended.length} war${ended.length > 1 ? "s" : ""} ended`, "good");
    const dp = A.realmProvs(r.id).length - b.realm.provs;
    if (
      (dp &&
        add(`${r.short}: ${dp > 0 ? "+" : ""}${dp} province${Math.abs(dp) > 1 ? "s" : ""}`, dp > 0 ? "good" : "bad"),
      pc.ruler)
    ) {
      const ds = Math.round(r.stability - b.realm.stab),
        dt = Math.round(r.treasury - b.realm.treas);
      if (Math.abs(ds) >= 3) add(`Stability ${ds > 0 ? "+" : ""}${ds}`, ds > 0 ? "good" : "bad");
      add(`Treasury ${dt >= 0 ? "+" : "−"}${A.fmt(Math.abs(dt))}`, dt >= 0 ? "good" : "bad");
      if (r.allies.length !== b.realm.allies)
        add(`Allies ${b.realm.allies}→${r.allies.length}`, r.allies.length > b.realm.allies ? "good" : "bad");
    }
  }
  const ho = (A.prov(pc.home) || {}).owner;
  if (b.owner && ho && ho !== b.owner) add(`Your home now belongs to ${A.realmShort(ho)}`, "bad");
  return {
    year: A.S.year,
    lines: L.slice(0, 12),
  };
};

if (typeof module < "u") module.exports = A;

A.whatNow = function (pc) {
  if (!pc || !pc.alive) return [];
  const S = A.S,
    out = [],
    add = (score, t, why, go, act, cls) =>
      out.push({
        score,
        t,
        why,
        go,
        act: act || null,
        cls: cls || "",
      }),
    adult = A.isAdult(pc),
    age = A.age(pc),
    can = k => GD.ACTIVITIES[k] && A.canAct(k)[0];
  if (pc.health < 35) {
    if (can("heal"))
      add(
        100,
        "See a physician",
        `Your health is ${Math.round(pc.health)}. Left alone it can kill you.`,
        "life",
        ["act", "heal"],
        "bad",
      );
    else {
      if (can("rest"))
        add(95, "Rest and recover", `Your health is ${Math.round(pc.health)}.`, "life", ["act", "rest"], "bad");
    }
  }
  const r = A.myRealm && A.myRealm();
  if (r) {
    if (r.treasury < 0)
      add(
        90,
        "Fix the treasury",
        "The treasury is empty: armies and court go unpaid.",
        "realm",
        ["tab", "realm"],
        "bad",
      );
    if (r.gov === "hereditary" && !r.heir)
      add(85, "Secure an heir", "You have no heir: your death would end the line.", "realm", ["tab", "realm"], "bad");
    for (const f of A.factionsOf(r.id))
      if ((f.power || 0) >= 0.3 && (f.discontent || 0) >= 45) {
        add(
          84,
          `Calm the ${A.FACTIONS[f.kind].name}`,
          `They hold ${Math.round(f.power * 100)}% of the swords and they are angry.`,
          "realm",
          ["tab", "realm"],
          "bad",
        );
        break;
      }
    for (const w of A.atWar(r.id))
      if (w.leadA === r.id || w.leadD === r.id) {
        const sc = A.warSide(w, r.id) === "att" ? w.score : -w.score;
        if (sc >= 25) {
          add(80, "Dictate the peace", `You are winning ${w.name} (+${sc}).`, "war", ["tab", "war"], "good");
          break;
        }
        if (sc <= -40) {
          add(82, "Sue for peace", `You are losing ${w.name} (${sc}).`, "war", ["tab", "war"], "bad");
          break;
        }
      }
    if ((r.infamy || 0) >= 35)
      add(
        75,
        "Mind your infamy",
        `Infamy ${Math.round(r.infamy)}: your neighbors talk of a coalition against you.`,
        "realm",
        ["tab", "realm"],
        "bad",
      );
    const empty = Object.keys(A.COUNCIL).filter(k => !(r.council && A.P(r.council[k]) && A.P(r.council[k]).alive));
    if (empty.length)
      add(60, "Fill the council", `${empty.length} seat${empty.length > 1 ? "s are" : " is"} empty.`, "realm", [
        "tab",
        "realm",
      ]);
  }
  if (adult && A.specChoices && A.specChoices(pc).length)
    add(
      78,
      A.specChoices(pc)[0].title,
      "Your career asks you to choose a direction.",
      pc.mil && !pc.job ? "war" : "path",
      ["tab", pc.mil && !pc.job ? "war" : "path"],
      "warn",
    );
  if (pc.job && pc.job.offers && pc.job.offers.length)
    add(
      70,
      `Look at ${pc.job.offers.length === 1 ? "a work offer" : pc.job.offers.length + " work offers"}`,
      "Offers expire if you leave them.",
      "path",
      ["tab", "path"],
    );
  if (pc.styles && Object.values(pc.styles).some(s => s.gradingDue))
    add(68, "Fight your grading bout", "Win it to rise a rank in your style.", "path", ["tab", "path"], "warn");
  const b = A.superior && A.superior(pc);
  if (b && A.opinion(b, pc) <= -10)
    add(
      65,
      `Win back ${b.given}`,
      `Your superior thinks poorly of you (${Math.round(A.opinion(b, pc))}).`,
      pc.mil ? "war" : "path",
      ["tab", pc.mil ? "war" : "path"],
      "bad",
    );
  if (pc.mil && A.atWar(pc.mil.realm || pc.realm).length)
    add(62, "Open the War Room", "Your realm is at war. See the front and your orders.", "war", ["warRoomView", ""]);
  if (
    adult &&
    !pc.job &&
    !pc.mil &&
    !pc.ruler &&
    !pc.company &&
    !pc.prison &&
    age < 60 &&
    !(pc.school && pc.school.kind)
  )
    add(55, "Find work", "No trade, no wage. The Path tab shows every door open to you.", "path", ["tab", "path"]);
  const P = A.plan ? A.plan(pc) : null;
  if (age >= 4 && P && !P.train)
    add(58, "Choose what to train", "Your free hours go nowhere in particular. Pick a focus in your plan.", "life", [
      "tab",
      "life",
    ]);
  if (adult && S.time >= 1) {
    if (P && P.train && A.planSession && can("train_yard"))
      add(50, "Train in an extra session", `${Math.floor(S.time)} initiative to spend. Push your training.`, "life", [
        "planSession",
        "",
      ]);
    else
      add(48, "Spend your initiative", `${Math.floor(S.time)} initiative waiting. Choose something below.`, "life", [
        "tab",
        "life",
      ]);
  }
  const fav = Object.values(pc.favors || {}).reduce((a, c) => a + c, 0);
  if (fav)
    add(40, "Call in a favor", `${fav} favor${fav > 1 ? "s are" : " is"} owed to you.`, "goals", ["tab", "goals"]);
  if (adult && age >= 18 && age <= 45 && !pc.spouse && !pc.betrothed && can("court_love"))
    add(30, "Look for love", "You are unmarried. A spouse means children, and an heir.", "life", ["act", "court_love"]);
  if (!S.queue.length)
    add(10, "Let time run", "Nothing presses. Play, and stop when something needs you.", "life", ["clkPlay", ""]);
  return out.sort((x, y) => y.score - x.score).slice(0, 3);
};

A.teacherFor = function (pc, k) {
  if (!k || !GD.SKILLS[k]) return null;
  const mine = A.skill(pc, k);
  let best = null,
    bv = mine + 8;
  const types = [
    "mentor",
    "master",
    "comrade",
    "friend",
    "bestfriend",
    "mother",
    "father",
    "sibling",
    "spouse",
    "lord",
  ];
  for (const { p } of A.relsOf(pc, types)) {
    if (!p.alive || !p.skills) continue;
    const v = A.skill(p, k);
    if (v > bv) {
      bv = v;
      best = p;
    }
  }
  if (pc.school && pc.school.mpid) {
    const m = A.P(pc.school.mpid);
    if (m && m.alive && A.skill(m, k) > bv) {
      bv = A.skill(m, k);
      best = m;
    }
  }
  return best
    ? {
        p: best,
        v: bv,
        gap: bv - mine,
      }
    : null;
};

A.SESSION_ACTS = {
  practice: "skill",
  train_yard: "skill",
  run: "body",
  lift: "body",
  study: "mind",
  meditate: "mind",
};

A.sessionQ = function (pc, key, k) {
  const parts = [];
  let q = 1;
  const hp = pc.health / Math.max(1, A.maxHealth ? A.maxHealth(pc) : 100);
  if (hp < 0.6) {
    const m = 0.6 + hp * 0.6;
    q *= m;
    parts.push(["hurt", m]);
  }
  if (pc.happy < 30) {
    q *= 0.88;
    parts.push(["low spirits", 0.88]);
  } else {
    if (pc.happy > 75) {
      q *= 1.06;
      parts.push(["in good heart", 1.06]);
    }
  }
  if (pc.flags.weary) {
    q *= 0.85;
    parts.push(["weary", 0.85]);
  }
  const done = Object.keys(A.SESSION_ACTS).reduce((a, x) => a + (A.S.yearActs[x] || 0), 0);
  if (done >= 4) {
    const m = Math.max(0.55, 1 - (done - 3) * 0.08);
    q *= m;
    parts.push(["overtrained", m]);
  }
  if (k && A.SESSION_ACTS[key] === "skill") {
    const T = A.teacherFor(pc, k);
    if (T) {
      const m = 1 + Math.min(0.5, T.gap / 70);
      q *= m;
      parts.push([`taught by ${T.p.given}`, m]);
    } else if (A.skill(pc, k) >= 60) {
      q *= 0.8;
      parts.push(["no one left to learn from", 0.8]);
    }
    if (GD.SKILL_CAT_OF && GD.SKILL_CAT_OF[k] === "Martial") {
      const ws = A.weaponSkillOf ? A.weaponSkillOf(pc) : null,
        G = GD.GEAR[pc.gear.weapon];
      if (ws === k && G) {
        const m = G.price > 400 ? 1.12 : G.price > 80 ? 1.05 : 1;
        if (m > 1) {
          q *= m;
          parts.push(["fine weapon", m]);
        }
      } else if (!G || pc.gear.weapon === "fists") {
        q *= 0.9;
        parts.push(["no proper weapon", 0.9]);
      }
    }
    const h = (pc.habit && pc.habit[k]) || 0;
    if (h >= 2) {
      const m = 1 + Math.min(0.2, h * 0.04);
      q *= m;
      parts.push([`${h}-year habit`, m]);
    }
  }
  const r = A.rand();
  let luck = 0.7 + A.rand() * 0.6,
    tag = "";
  if (r < 0.06) {
    luck = 2.1;
    tag = "breakthrough";
  } else {
    if (r < 0.14) {
      luck = 0.35;
      tag = "bad day";
    }
  }
  q *= luck;
  return {
    q: A.clamp(q, 0.2, 3),
    parts,
    tag,
    luck,
  };
};

A.sessionNote = function (S) {
  const pct = m => (m >= 1 ? "+" : "−") + Math.round(Math.abs(m - 1) * 100) + "%",
    bits = S.parts.filter(([, m]) => Math.abs(m - 1) >= 0.03).map(([n, m]) => `${n} ${pct(m)}`);
  return ` — ${S.tag === "breakthrough" ? "Breakthrough! Everything clicks" : S.tag === "bad day" ? "A wasted day" : S.q >= 1.25 ? "A great session" : S.q >= 0.9 ? "A solid session" : S.q >= 0.6 ? "A middling session" : "A poor session"}${bits.length ? " (" + bits.join(", ") + ")" : ""}.`;
};

A.trainingSession = function (pc, key, arg, d, fn) {
  const k =
      A.SESSION_ACTS[key] === "skill"
        ? arg && GD.SKILLS[arg]
          ? arg
          : A.weaponSkillOf
            ? A.weaponSkillOf(pc)
            : null
        : null,
    S = A.sessionQ(pc, key, k);
  A._growMul = S.q;
  let res;
  try {
    res = fn(pc, arg, d);
  } finally {
    A._growMul = 1;
  }
  if (k) {
    pc.habitY = pc.habitY || {};
    pc.habitY[k] = A.S.year;
  }
  if (S.tag === "breakthrough" && k && A.willGrow) A.willGrow(pc, 0.5, "breakthrough");
  if (res && res.msg) res.msg = res.msg.replace(/\.?\s*$/, "") + A.sessionNote(S);
  if (S.parts.some(([n]) => n === "overtrained" || n === "hurt") && A.SESSION_ACTS[key] !== "mind" && A.chance(0.12)) {
    pc.health = Math.max(1, pc.health - A.ri(4, 10));
    if (res && res.msg) res.msg += " You strain something.";
  }
  return res;
};

A.growthYear = function (pc) {
  if (!pc || !pc.alive) return;
  const y = A.S.year;
  pc.habit = pc.habit || {};
  for (const k in pc.habitY || {}) pc.habit[k] = pc.habitY[k] === y ? (pc.habit[k] || 0) + 1 : 0;
  for (const k in pc.habit) if (!pc.habitY || pc.habitY[k] !== y) pc.habit[k] = 0;
  const used = pc.used || {},
    rusted = [];
  for (const k in pc.skills) {
    const v = pc.skills[k] || 0;
    if (v < 30 || (used[k] != null && y - used[k] < 2)) continue;
    const loss = (v - 30) * 0.03 * (A.age(pc) > (GD.RACES[pc.race] || {}).primeEnd ? 1.4 : 1);
    if (loss >= 0.25) {
      pc.skills[k] = v - loss;
      if (loss >= 0.8) rusted.push(GD.SKILLS[k] || k);
    }
  }
  if (rusted.length)
    A.log(
      `Out of practice: ${rusted.slice(0, 3).join(", ")} ${rusted.length > 1 ? "are" : "is"} getting rusty.`,
      "warn",
    );
};

A.PROMO_REQ = {
  1: {
    cmd: 0,
    battles: 0,
  },
  2: {
    cmd: 8,
    battles: 0,
  },
  3: {
    cmd: 15,
    battles: 1,
    alt: "missions",
    altN: 3,
  },
  4: {
    cmd: 25,
    battles: 1,
    alt: "missions",
    altN: 4,
    lit: true,
  },
  5: {
    cmd: 35,
    battles: 3,
    alt: "missions",
    altN: 8,
    lit: true,
  },
  6: {
    cmd: 45,
    battles: 5,
    lit: true,
    slots: "divs",
  },
  7: {
    cmd: 55,
    battles: 6,
    wins: "divWins",
    winsN: 1,
    lit: true,
    slots: "armies",
  },
  8: {
    cmd: 62,
    battles: 10,
    wins: "armyWins",
    winsN: 2,
    lit: true,
    slots: "groups",
  },
  9: {
    cmd: 70,
    battles: 12,
    wins: "armyWins",
    winsN: 3,
    lit: true,
    slots: "marshal",
  },
};

A.promoBoard = function (pc) {
  const b = promoBoardNow(pc);
  if (!b || !pc.mil) return b;
  const m = pc.mil;
  {
    if (m.rankSince == null) m.rankSince = A.absDay() - 9999;
    const need = 4 + m.rank * 3,
      have = Math.max(0, Math.floor((A.absDay() - m.rankSince) / 30));
    b.push({
      k: "time",
      label: "Months at your present rank",
      have: Math.min(have, 999),
      need,
      ok: have >= need,
    });
  }
  if (m.merc) return b;
  const nr = m.rank + 1;
  if (nr < 7) return b;
  const r = A.realm(m.realm);
  if (!r) return b;
  const mine = A.skill(pc, "command"),
    gens = (A.armiesOf ? A.armiesOf(r.id) : []).map(a => A.P(a.gen)).filter(g => g && g.alive && g.id !== pc.id);
  let ok = true,
    txt = "";
  if (nr === 7) {
    const weak = (A.armiesOf ? A.armiesOf(r.id) : []).filter(a => {
      const g = A.P(a.gen);
      return !g || !g.alive || (g.id !== pc.id && A.skill(g, "command") < mine - 4);
    });
    ok = weak.length > 0;
    txt = ok
      ? `${weak.length} army without a better general`
      : `every army has a general at least as good (best ${gens.length ? Math.max(...gens.map(g => A.skill(g, "command"))) : "-"})`;
  }
  if (nr === 8) {
    const better = gens.filter(g => A.skill(g, "command") >= mine).length;
    ok = better < 2 && gens.length >= 2;
    txt = ok ? "you are among the realm's best generals" : `${better} generals outrank you in skill`;
  }
  if (nr === 9) {
    const ms = r.council && r.council.marshal,
      holder = ms ? A.P(ms) : null;
    ok = !holder || !holder.alive || holder.id === pc.id || A.skill(holder, "command") < mine - 5;
    txt =
      holder && holder.alive && holder.id !== pc.id
        ? `Marshal ${A.fullName(holder, false)} holds the seat (command ${A.skill(holder, "command")})`
        : "the seat is open";
  }
  const i = b.findIndex(x => x.k === "slot"),
    row = {
      k: "slot",
      label: nr === 7 ? "An army to command" : nr === 8 ? "A place among the high generals" : "The marshal's seat",
      have: txt,
      need: "",
      ok,
    };
  if (i >= 0) b[i] = row;
  else b.push(row);
  if (nr >= 8 && !["noble", "royal", "gentry"].includes(pc.status) && !(pc.noble && pc.noble.rung >= 2))
    b.push({
      k: "birth",
      label: "Gentle birth or a title (the crown rarely raises a commoner this high)",
      have: "no",
      need: "yes",
      ok: false,
      soft: true,
    });
  return b;
};

const promoBoardNow = function (pc) {
  const m = pc.mil;
  if (!m) return null;
  const nr = m.rank + 1,
    next = GD.MIL[nr];
  if (!next) return null;
  const R2 = A.PROMO_REQ[nr] || {},
    out = [];
  if (
    (out.push({
      k: "merit",
      label: "Merit",
      have: Math.floor(m.merit),
      need: next.merit,
      ok: m.merit >= next.merit,
    }),
    R2.cmd &&
      out.push({
        k: "cmd",
        label: "Command skill",
        have: A.skill(pc, "command"),
        need: R2.cmd,
        ok: A.skill(pc, "command") >= R2.cmd,
      }),
    R2.battles)
  ) {
    const alt = (R2.alt && m[R2.alt]) || 0,
      ok = m.battles >= R2.battles || (R2.alt && alt >= R2.altN);
    out.push({
      k: "battles",
      label: R2.alt ? `Battles seen (or ${R2.altN} missions)` : "Battles seen",
      have: R2.alt && m.battles < R2.battles ? `${m.battles} / ${alt} missions` : m.battles,
      need: R2.battles,
      ok,
    });
  }
  if (
    (R2.wins &&
      out.push({
        k: "wins",
        label: R2.wins === "divWins" ? "Battles won leading a division" : "Battles won leading an army",
        have: m[R2.wins] || 0,
        need: R2.winsN,
        ok: (m[R2.wins] || 0) >= R2.winsN || (m.exercises || 0) >= R2.winsN * 2,
      }),
    R2.lit &&
      out.push({
        k: "lit",
        label: "Can read orders (literate)",
        have: pc.literate ? "yes" : "no",
        need: "yes",
        ok: !!pc.literate,
        soft: true,
      }),
    R2.slots && !m.merc)
  ) {
    const r = A.realm(m.realm),
      F = r ? A.F(r) : null,
      nd = F ? F.divs.length : 0;
    let open = true,
      txt = "";
    if (
      (R2.slots === "divs" && ((open = nd >= 2), (txt = `${nd} divisions in the host`)),
      R2.slots === "armies" && ((open = nd >= 6), (txt = `${nd} divisions (an army needs ~6+)`)),
      R2.slots === "groups" && ((open = nd >= 14), (txt = `${nd} divisions (an army group needs ~14+)`)),
      R2.slots === "marshal")
    ) {
      const ms = r && r.council && r.council.marshal,
        holder = ms ? A.P(ms) : null;
      open = !holder || !holder.alive || holder.id === pc.id || A.skill(holder, "command") < A.skill(pc, "command");
      txt =
        holder && holder.alive && holder.id !== pc.id
          ? `Marshal ${A.fullName(holder, false)} holds the seat (command ${A.skill(holder, "command")})`
          : "The seat is open";
    }
    out.push({
      k: "slot",
      label: "A command open",
      have: txt,
      need: "",
      ok: open,
      soft: true,
    });
  }
  return out;
};

A.promoCheck = function (pc) {
  if (pc && pc.mil && !pc.mil.merc && pc.mil.rank + 1 >= 7) {
    const b = A.promoBoard(pc) || [],
      slot = b.find(x => x.k === "slot");
    if ((slot && !slot.ok) || (b.find(x => x.k === "birth") && A.chance(0.6))) return;
  }
  if (A.S.clockMode && !A._promoBoard) return;
  const r0 = pc && pc.mil ? pc.mil.rank : null;
  promoCheckNow(pc);
  if (pc && pc.mil && pc.mil.rank !== r0) pc.mil.rankSince = A.absDay();
};

const promoCheckNow = function (pc) {
  const m = pc.mil;
  if (!m) return;
  const next = GD.MIL[m.rank + 1];
  if (!next) return;
  const board = A.promoBoard(pc) || [],
    hard = board.filter(b => !b.soft && !b.ok);
  if (board.find(b => b.k === "merit" && !b.ok)) return;
  let chance = 0.5;
  for (const b of board) if (!b.ok) chance *= b.soft ? (b.k === "slot" ? 0.3 : 0.5) : 0.18;
  {
    const fr = A.famMilBonus ? A.famMilBonus(pc) : 0;
    if (fr && !m.merc) chance *= m.rank + 1 <= fr ? 1.45 : 1.1;
  }
  if (
    (m.rank + 1 >= 7 &&
      (chance *= 0.45 + pc.fame / 100 + (pc.noble ? pc.noble.rung * 0.05 : 0) + (pc.status === "royal" ? 0.4 : 0)),
    m.rank + 1 >= 9 && !m.merc)
  ) {
    const r = A.realm(m.realm),
      ru = r ? A.P(r.ruler) : null;
    if (ru && ru.id !== pc.id) chance *= 0.3 + Math.max(0, A.opinion(ru, pc)) / 100;
  }
  // [X1 baked patch people/99999-v2-renown RN-MIL] The army's promotion board barred the way until the merit counter
  // reached the next rank's number, then rolled about an even chance each quarter: a counter that fills is linear
  // promotion (V2_SPEC complaint 15). V2 rolls promotionCheck(): a monthly hazard from the vacancy, the standout
  // deed of the last 18 months against what the rank asks, steady service and a patron, which can skip a rank. In
  // the source: drop the merit surplus factor and roll the v2 hazard (scaled by the board's other factors) where the
  // board rolls its chance. The merit row itself becomes a soft deed row in A.promoBoard (b-promo.core.js).
  if (
    (pc.race !== (A.realm(m.realm) || {}).race && !m.merc && m.rank + 1 >= 5 && (chance *= 0.6),
    (chance *= A.RN && A.RN.on ? 1 : 1 + Math.min(0.6, (m.merit - next.merit) / Math.max(30, next.merit))),
    A.bossMod && (chance += A.bossMod(pc)),
    pc.flags.bossPush === A.S.year && (chance += 0.2),
    A.RN && A.RN.on ? A.RN.milRoll(pc, chance, board) : A.chance(A.clamp(chance, 0.02, 0.92)))
  ) {
    m.rank++;
    A.fame(pc, 2 + m.rank);
    const t = GD.MIL[m.rank];
    if (
      (A.log(
        `PROMOTED: ${t.title}. You now lead ${A.fmt(t.leads)}${m.rank >= 4 ? " — men who will live or die by your orders" : ""}.`,
        "big",
      ),
      m.rank === 2 && A.ach("sergeant"),
      m.rank === 4 && A.ach("captain"),
      m.rank === 7 && A.ach("general"),
      m.rank === 9 && A.ach("marshal"),
      m.rank >= 3 && (m.squad = m.squad.slice(0, 6)),
      m.rank === 9 && !m.merc)
    ) {
      const r = A.realm(m.realm);
      if (r) {
        r.council = r.council || {};
        r.council.marshal = pc.id;
      }
    }
    if (A.wsAttachPC) A.wsAttachPC();
  } else if (hard.length && m.merit >= next.merit && A.chance(0.35))
    A.log(
      `The promotion board passes you over for ${next.title}: ${hard.map(b => `${b.label.toLowerCase()} ${b.have}/${b.need}`).join(", ")}.`,
      "warn",
    );
};
