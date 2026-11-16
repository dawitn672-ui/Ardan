// Starts in the far lands (990-far-peoples): a life born in a far realm opens with a scene of its land, its realm's
// kind and its rank (fp_start, queued at birth by zz-far-peoples.core.js), and the choice comes back years later
// (fp_start_echo). Ten lands, twelve kinds of realm and eight ranks make the scene; four sets of choices, one for the
// unfree, the common, the trades and the high-born, each set flags fp_start_<choice>.
(function () {
const LAND = {
  R: 'The Twin Rivers: dykes higher than houses, rice to the horizon, and a clerk for every hundred souls.',
  F: 'The Long Grass: felt tents, horse herds, and a sky that runs to the edge of the world.',
  B: 'The Sand Basins: oases strung along the silk roads, with sand on every side.',
  H: 'The High Steppes: thin air, barley, yak herds and the prayer flags on every pass.',
  M: 'The Southern Peninsulas: monsoon rice, temple towers and rivers as wide as lakes.',
  A: 'The Thousand Isles: boats, reefs, spice, and the sea between everything.',
  T: 'The Black Pines: forest without end, rivers frozen half the year, and furs for money.',
  N: 'The Rime Coast: ice, seal fat and a sun that hardly sets in summer or rises in winter.',
  I: 'The Sunrise Isles: smoking mountains, households facing east, and the sea beyond them empty.',
  D: 'The Deep Southland: cattle, drums, lake kingdoms and gold walls.',
};
const TYPE = {
  empire: '{realmShort} is an empire, and its officials count everything.',
  kingdom: '{realmShort} is a kingdom, and the king is far away.',
  'nomad confederation': '{realmShort} is a league of camps that move with the grass.',
  'mountain confederation': '{realmShort} is a league of valleys that trust nobody below them.',
  'city-state': '{realmShort} is one city and the fields it can see from its walls.',
  'city league': '{realmShort} is a league of towns that argue about tolls.',
  theocracy: 'In {realmShort} the temple rules, and its priests keep the books.',
  'merchant republic': 'In {realmShort} the brokers rule, and everything has a price.',
  'orc clans': '{realmShort} is clans of orcs under their mothers.',
  'dwarven hold': '{realmShort} is a hold under the ice, and its law is cut in stone.',
  'pirate haven': '{realmShort} lives off the sea and what sails on it.',
  'giant territory': '{realmShort} is a hall of giants and the people who live with them.',
};
const RANK = {
  slave: 'You were born owned. Your mother was sold once, before you; you have learned to watch the master\'s face.',
  serf: 'You were born bound to the land and its lord. The steward knows your name, and your debts.',
  peasant: 'You were born to a family that works its own ground, when the weather and the tax allow.',
  artisan: 'You were born over a workshop. Your hands learned the family trade before they could write.',
  merchant: 'You were born to a trading house that owes money in three towns and is owed in five.',
  gentry: 'You were born to a family with land and a name, and not quite enough of either.',
  noble: 'You were born to a great house. Its feuds are older than you and will outlast you.',
  royal: 'You were born of the ruling blood. People bow to you before they know you.',
};
const CLASS = { slave: 'bound', serf: 'bound', peasant: 'common', artisan: 'trade', merchant: 'trade', gentry: 'high', noble: 'high', royal: 'high' };
const cls = p => CLASS[p.status] || 'common';
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const land = p => { const L = A.FAR && A.FAR.D && A.FAR.D.realms[p.realm]; return L ? L.land : null; };
const kind = p => { const L = A.FAR && A.FAR.D && A.FAR.D.realms[p.realm]; return L ? L.type : null; };
const since = (p, f) => (p.flags && p.flags[f] != null ? A.S.year - p.flags[f] : -1);
const picked = (p, ...k) => k.find(x => p.flags && p.flags['fp_start_' + x] != null) || null;

A.defEvents([
  { id: 'fp_start', trigger: true, title: 'Far from the old maps',
    cond: (p, C) => C.flag(p, 'fp_start'),
    setup: (p, ctx) => { if (!LAND[land(p)]) ctx.skip = 1; },
    text: p => `${LAND[land(p)]} ${TYPE[kind(p)] || '{realmShort} is your country.'} ${RANK[p.status] || RANK.peasant} The {cw1}, the {cw2}, the {cw3}: these are the first words you learn.`,
    choices: [
      { t: p => ({ bound: 'Keep your head down and learn the work', common: 'Stay and work the family ground', trade: 'Learn the family trade properly', high: 'Learn the manners of the court' })[cls(p)],
        r: p => ({ bound: 'You learn the work and the master\'s moods. You are worth more to him, which is not freedom, but is something.', common: 'Seasons of mud and harvest. You know your ground like your own hand.', trade: 'Years at the bench and the counter. Your work is your father\'s, and then a little better.', high: 'You learn who bows to whom, and how low. It is a language.' })[cls(p)],
        fx: p => {
          const c = cls(p);
          A.applyFx(p, { flag: 'fp_start_work', skill: c === 'high' ? { etiquette: 3 } : c === 'trade' ? { craft: 2, trade: 1 } : { husbandry: 3 }, sta: 1, happy: -1 });
          return '';
        } },
      { t: p => ({ bound: 'Learn your master\'s accounts in secret', common: 'Walk to the market town and see', trade: 'Borrow and buy stock of your own', high: 'Learn arms with the household guard' })[cls(p)],
        check: { s: 'learning', s2: 'int', d: 45 },
        win: { r: p => ({ bound: 'You learn to read his figures upside down. One day that will be worth a great deal.', common: 'You come back knowing prices, roads and three men who owe you a favour.', trade: 'The stock sells. You pay the debt and keep the margin.', high: 'The guard captain says you are not hopeless, which from him is praise.' })[cls(p)],
          fx: { flag: 'fp_start_reach', int: 1, coin: 10 } },
        lose: { r: p => ({ bound: 'He catches you at it, once, and the beating is the kind you remember.', common: 'The town takes your coin and teaches you nothing you wanted to know.', trade: 'The stock rots in a wet store. You owe for it still.', high: 'You are hurt in the yard, badly enough that your mother forbids it.' })[cls(p)],
          fx: { flag: 'fp_start_reach', health: -6, coin: -5 } } },
      { t: p => ({ bound: 'Mark the road out of here', common: 'Go to the temple and ask to be taught', trade: 'Go with a caravan or a boat', high: 'Go out among the common people' })[cls(p)],
        r: p => ({ bound: 'You learn where the road goes, who watches it and when they sleep. You do not take it yet.', common: `${cap((A.FARP && A.FARP.priest(p)) || 'the priest')} teaches you letters in return for sweeping. It is slow, and it is yours.`, trade: 'A season on the road. You come back browner, poorer and full of other places.', high: 'You learn what the people say of your house when it is not listening.' })[cls(p)],
        fx: p => {
          const c = cls(p);
          A.applyFx(p, { flag: 'fp_start_road', skill: c === 'common' ? { learning: 3 } : c === 'high' ? { persuasion: 2 } : { survival: 2 }, wil: 1, coin: c === 'trade' ? -5 : 0 });
          if (c === 'common' && A.chance(0.5)) p.literate = true;
          return '';
        } },
    ] },

  { id: 'fp_start_echo', title: 'What you chose, long ago', w: 4, once: true,
    cond: (p, C) => C.adult(p) && C.flag(p, 'fp_start') && (C.flag(p, 'fp_start_work') || C.flag(p, 'fp_start_reach') || C.flag(p, 'fp_start_road')) && since(p, 'fp_start') >= 6,
    text: p => {
      const k = picked(p, 'work', 'reach', 'road');
      return ({
        work: 'Somebody you worked beside as a youth stops you in the street. They remember the years of plain work you did, and they have work of their own that needs a steady pair of hands. It pays, and it is dull.',
        reach: 'A man you knew when you were young comes looking for you. He remembers you reaching past your station, and he says he has a use for someone like that. He does not say what.',
        road: 'News comes from the road you marked out, or walked, years ago. Someone you met there has done well and remembers you, and writes asking you to come.',
      })[k] || 'Someone from your youth sends word.';
    },
    choices: [
      { t: 'Take what is offered', r: 'You take it. Old roads lead somewhere after all.', fx: { coin: 15, happy: 2, flag: 'fp_echo_took' } },
      { t: 'Say your life is elsewhere now', check: { s: 'persuasion', s2: 'wil', d: 45 },
        win: { r: 'You part on good terms. It is a door you can still open.', fx: { wil: 1, honor: 1 } },
        lose: { r: 'They take it badly, and the story they tell of you afterward is not kind.', fx: { happy: -3, honor: -1 } } },
    ] },
]);
})();
