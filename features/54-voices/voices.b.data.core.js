// Culture voices, part B: the south, the gulf and the east (54-voices). Fields as in voices.a.data.core.js.
(function () {
  const V = A.VOICE_DATA = A.VOICE_DATA || {};

  V['CUL-04'] = { // Qadiri: the garden coast, channels and sluices, the Book of Wells, rag paper
    lord: ['dassir', 'a lord of channels, who holds the upper sluices'],
    ruler: ['Qassal', 'the Sultan, keeper of the first sluice'],
    council: ['ruwwah', 'the bench of Well-Keepers who read the Book of Wells'],
    year: 'the {n} water-year of {ru}',
    greet: 'Sweet water to your channel.',
    oath: 'By the Book of Wells, and the water I drink.',
    curse: 'May your channel silt and your neighbor\'s run.',
    who: ['the gardeners', 'the Well-Keepers', 'the old scribes', 'the sluice-men'],
    sayings: [
      ['Water remembers who blocked it', 'law land money'],
      ['Paper holds what the tongue drops', 'law oath money'],
      ['The sluice is fair; the sluice-keeper less so', 'power money'],
      ['Feed the stranger, then count the spoons', 'guest feast'],
    ],
    lines: [
      ['Here a man is worth his {w1}: one plot, one channel, one share of water.', 'land money kin'],
      ['The {w3} opens your channel at dawn and takes his tenth before you wake.', 'money land power'],
      ['When neighbors quarrel here, someone goes for a {w2} from the Book of Wells.', 'law'],
      ['A Qadiri promise is not made until it is written on rag paper.', 'oath'],
    ],
    swap: [['water-share', 'w1'], ['water share', 'w1']],
  };

  V['CUL-05'] = { // Sandfolk: the Red Waste, roads of wells, camel debts, guides
    lord: ['durrab', 'a clan chief, first to drink at the clan\'s well'],
    ruler: ['Samarri', 'the Speaker, whom any clan may walk away from'],
    council: ['tirhaz', 'the chiefs\' gathering at a well'],
    year: 'the {n} crossing of {ru}',
    greet: 'Water at the end of your road.',
    oath: 'By the Well of Samar, and the road between us.',
    curse: 'May you forget the {w1}.',
    who: ['the guides', 'the camel men', 'the old women at the wells'],
    sayings: [
      ['A road of wells is a road of names', 'travel kin'],
      ['Blood is paid in camels, or in blood', 'law death war'],
      ['The herd remembers what the herdsman forgets', 'land kin money'],
      ['Ask the guide, not the map', 'travel'],
      ['Salt for silver, never water for silver', 'money'],
    ],
    lines: [
      ['A Sandfolk child learns the {w1} before its letters: every well, and whose it is.', 'travel land kin'],
      ['Here a killing makes a {w2}, and a {w2} is paid in camels or in blood.', 'law death war'],
      ['The camels are yours to ride; the {w3} owns them in the end.', 'land money kin'],
      ['Any clan may walk away from a word it did not swear to, and the {ruler} knows it.', 'oath power'],
      ['A {lord} drinks first at the clan well, and answers first when it runs dry.', 'power land'],
    ],
    swap: [['blood-debt', 'w2'], ['blood debt', 'w2'], ['blood-price', 'w2']],
  };

  V['CUL-06'] = { // Tamari: the river kingdom, the flood mark, dykes, the god-king, the dead
    lord: ['sepmet', 'a nome lord, master of a reach of the river'],
    ruler: ['Tekkemu', 'the King, son of the Flood Mother; said with the eyes lowered'],
    council: ['sabbeku', 'the court of the Two Banks'],
    year: 'the year of the {n} flood of {ru}',
    greet: 'May the water find your field.',
    oath: 'By the mark on the stair, and the Mother under it.',
    curse: 'May your field sit above the water.',
    who: ['the river farmers', 'the scribes', 'the flood-priests', 'old men on the dykes'],
    sayings: [
      ['The river pays for what the river takes', 'land death money'],
      ['A dyke is as good as its laziest house', 'work land kin'],
      ['Read the mark, not the priest', 'faith law power'],
      ['The dead keep better than the living', 'death'],
    ],
    lines: [
      ['Every house owes the {w2}, a month on the dykes, whoever the {lord} is.', 'work land power'],
      ['The tax is set by the {w1} on the temple stair, and the stair is read by priests.', 'money faith power land'],
      ['A Tamari death is a long business: the {w3} take seventy days, and their fee.', 'death faith money'],
      ['In a low year, men here say the {ruler}\'s name more quietly.', 'power land faith'],
    ],
    swap: [['flood mark', 'w1'], ['dyke work', 'w2']],
  };

  V['CUL-07'] = { // Sabrans: the pearl emirate, diving crews, the oil nobody names
    lord: ['tawwar', 'a lord of a pearl bank or a caravan town'],
    ruler: ['Nefrad', 'the Emir, to whom the best pearl goes'],
    council: ['bahhud', 'the Emir\'s council, where some words are not said'],
    year: 'the {n} pearl season of {ru}',
    greet: 'A full basket and a short dive.',
    oath: 'On the best pearl, and on my breath.',
    curse: 'May you come up empty.',
    who: ['the divers', 'the boat-masters', 'the date merchants', 'the women of the oil shore'],
    sayings: [
      ['The sea gives one pearl and keeps ten divers', 'sea death work'],
      ['Say lamps, and count the jars', 'money power'],
      ['A boat is a family that can drown together', 'kin sea'],
      ['Breathe before you bargain', 'money'],
    ],
    lines: [
      ['The best pearl of every boat is the {w1}, and the {w1} goes to the {ruler}.', 'money power sea'],
      ['A {w2} dives together, eats together, and splits the basket by old shares.', 'work sea kin money'],
      ['No one says {w3} in council; they say lamps, and everyone knows.', 'power money'],
      ['A Sabran bargain is struck standing, so either side can walk away.', 'money'],
    ],
    swap: [],
  };

  V['CUL-08'] = { // Zanari: the Golden Plains, the ancestors, the Rememberers, gold by weight
    lord: ['kombari', 'a lord, who sits on a stool before the people'],
    ruler: ['Kemandu', 'the Emperor, whose feet never touch the bare earth'],
    council: ['sorongo', 'the elders\' meeting in the shade of the court tree'],
    year: 'the {n} rains of {ru}',
    greet: 'Are your dead well?',
    oath: 'Before my ancestors, by name, back to the first.',
    curse: 'May the Rememberers forget your name.',
    who: ['the Rememberers', 'the cattle men', 'the gold weighers', 'the grandmothers'],
    sayings: [
      ['A name not sung goes back into the grass', 'death kin'],
      ['Gold found is gold owed', 'money law power'],
      ['The weights do not argue', 'money law'],
      ['Feed the guest before you ask his line', 'guest feast kin'],
    ],
    lines: [
      ['Here a family lasts as long as its {w1}, the Rememberers\' song of its line.', 'kin death'],
      ['Any nugget found in this earth is a {w2}, and every {w2} is the {ruler}\'s.', 'money law power'],
      ['A child here is often a {w3}: a grandparent come back, and named for them.', 'kin death'],
      ['Nobody speaks to the {ruler} without dust on his head first.', 'power'],
      ['A lie about one\'s line is a crime here, and the {w1} is the record.', 'law kin oath'],
      ['A {lord} judges under the court tree, and the {council} sits with him.', 'law power'],
    ],
    swap: [],
  };

  V['CUL-09'] = { // Abari: the Highveld, twin kings who swap the crown, terraces, ancestor houses
    lord: ['meshen', 'a lord of a valley, who keeps the horse gentry'],
    ruler: 'w1',
    council: ['getteb', 'the court of the year, which changes hands with the crown'],
    year: 'the year of {ru}, the {w1}',
    greet: 'Peace on your terrace.',
    oath: 'By the ancestor house, and both crowns.',
    curse: 'May your terrace slide in the rains.',
    who: ['the terrace farmers', 'the cattle keepers', 'the old Rememberers', 'the coffee women'],
    sayings: [
      ['Two crowns, one cow: milk her gently', 'power land money'],
      ['Wait a year, and ask the other king', 'power law'],
      ['A terrace is built by the dead and kept by the living', 'land death kin work'],
      ['Serve the guest before you count the cattle', 'guest feast'],
    ],
    lines: [
      ['Each year here belongs to one king; this is the {w1}\'s year, and next year the other\'s.', 'power law'],
      ['A {w2} is held by one house, terrace above terrace, and fought over stone by stone.', 'land kin law'],
      ['Every line is kept in an {w3}, and its dead are counted there.', 'kin death faith'],
      ['A promise made to one king here is worth half a year.', 'oath power'],
      ['The {council} moves house with the crown every New Year, records and all.', 'power law'],
      ['A {lord} of the valleys keeps horses for both kings, to be safe.', 'power war land'],
    ],
    swap: [],
  };

  V['CUL-10'] = { // Keshi: the pepper coast, merchant houses and shares, the Hall scales
    lord: ['wesabi', 'the master of a merchant house, who sits in the Pepper Hall'],
    ruler: ['Zuwari', 'the Prince of Kesh, first among the houses'],
    council: ['tendaru', 'the council of houses that chooses the Prince'],
    year: 'the {n} pepper year of {ru}',
    greet: 'Fair weight to you.',
    oath: 'On the Hall scales, and on my house\'s shares.',
    curse: 'May your pepper weigh light.',
    who: ['the pepper factors', 'the captains', 'the old scale-keepers', 'the fishwives'],
    sayings: [
      ['The scale has no friends', 'money law'],
      ['A marriage is a contract that eats at your table', 'kin money'],
      ['Sell at night, count at dawn', 'money sea'],
      ['The river keeps its own accounts', 'land death sea'],
    ],
    lines: [
      ['Here a family is a {w1}, with shares, and the shares decide who speaks.', 'kin money power'],
      ['Everything sold in Kesh is weighed on the {w2}, and the {w2} is never wrong in public.', 'money law'],
      ['A Keshi wedding is a {w3}: two houses, a clerk, and a long list.', 'kin money oath'],
      ['The houses choose the {ruler}, and expect to be paid back.', 'power money'],
      ['A {lord} sits in the Pepper Hall and votes with his shares.', 'power money'],
    ],
    swap: [['merchant house', 'w1'], ['trading house', 'w1'], ['council', 'council']],
  };

  V['CUL-12'] = { // Skyfolk: the Roof, the White Stair, butter and wool, sky burial
    lord: ['sengar', 'a herd-lord, who owes the monastery its due'],
    ruler: ['Kyelmo', 'the Abbot, found again in a child'],
    council: ['shelna', 'the meeting of monks and herd-lords on the White Stair'],
    year: 'the {n} snow of {ru}',
    greet: 'Slow breath and sure feet.',
    oath: 'Before the White Stair, on my next life.',
    curse: 'May the birds refuse you.',
    who: ['the herders', 'the monks', 'the salt carriers', 'old women at the prayer wall'],
    sayings: [
      ['Count to three, and leave the fourth alone', 'death'],
      ['Butter for the lamps, wool for the monks, the rest for you', 'money faith work'],
      ['The air takes the proud first', 'travel'],
      ['A name given by a monk is a name to live up to', 'kin faith'],
    ],
    lines: [
      ['Every tent owes the {w1}, butter and wool, and the monastery keeps the tally.', 'money faith work'],
      ['A child here waits for its {w2}, the name a monk gives, and answers to "child" till then.', 'kin faith'],
      ['The dead go up to the {w3}, and the birds take them; it is thought a kindness.', 'death faith'],
      ['The Stair Guard swear never to kill, and carry heavy staves.', 'war law faith'],
    ],
    swap: [],
  };

  V['CUL-13'] = { // Ranpuri: the monsoon coast, rice, the temples that hold the courts and the gold
    lord: ['mallavar', 'a lord, who answers to the Raja for the rice'],
    ruler: ['Kolladar', 'the Raja, to whom the sixth goes'],
    council: ['mandrakal', 'the temple court, which sits on the temple steps'],
    year: 'the {n} monsoon of {ru}',
    greet: 'May the rains come on time.',
    oath: 'By the Thousand Names, and the one I was given.',
    curse: 'May the monsoon find your roof.',
    who: ['the rice farmers', 'the temple clerks', 'the elephant men', 'the market women'],
    sayings: [
      ['The temple lends with one hand and judges with the other', 'faith money law'],
      ['Rice first, then quarrels', 'land'],
      ['The tally-house remembers what the buyer forgets', 'money'],
      ['Never ride an elephant you cannot feed', 'power money war'],
    ],
    lines: [
      ['A sixth of every harvest is the {w1}, and the {lord}\'s men measure it in their own baskets.', 'money land power'],
      ['When an estate passes, the temple takes its {w2} first and the heirs argue over the rest.', 'death kin faith money'],
      ['Every sale in a Ranpuri town is cut on a stick at the {w3}.', 'money law'],
      ['The temples hold the courts here, so a quarrel goes to the temple steps.', 'law faith'],
      ['The {lord} rides an elephant to the harvest, so nobody forgets who he is.', 'power land war'],
      ['The {council} on the temple steps hears debts, thefts and marriages, in that order.', 'law money kin faith'],
    ],
    swap: [],
  };

  V['CUL-14'] = { // Amberfolk: the spice isles, the Storm Watch, the needle, the father's name
    lord: ['sarimbo', 'a harbor lord, who keeps the spice weights'],
    ruler: ['Ribalu', 'the Sultan, whose bones feel the storm before it comes'],
    council: ['tolangga', 'the council of harbor lords at Amberport'],
    year: 'the {n} clove harvest of {ru}',
    greet: 'Fair wind and a dry hold.',
    oath: 'By the needle that knows north, and my father\'s name.',
    curse: 'May your needle drift.',
    who: ['the sailors', 'the clove growers', 'the pilots', 'the harbor women'],
    sayings: [
      ['A night alone at sea makes a sailor or a widow', 'sea death kin'],
      ['The fifth to the Sultan, the rest to the storm', 'money power sea'],
      ['Ask the pilot nothing', 'sea travel'],
      ['Cloves keep; promises rot', 'oath money'],
    ],
    lines: [
      ['Every child of a sailing house keeps the {w1} once: a night alone at sea.', 'sea kin'],
      ['A fifth of every spice sack is the {w2}, and the {ruler}\'s weighers take it at the quay.', 'money power'],
      ['A child here carries its father\'s name after its own, the {w3}, so you know whose it is.', 'kin'],
      ['When the {ruler}\'s bones ache, the harbor makes its boats fast.', 'sea power'],
    ],
    swap: [['Storm Watch', 'w1']],
  };

  V['CUL-16'] = { // Leaf People: the Deep Green, true names and trade names, taking only one
    lord: ['tobu', 'the band\'s oldest hunter, who speaks for it'],
    ruler: ['Awembe', 'the forest itself, the only lord they admit'],
    council: ['kandu', 'the night talk at the band fire'],
    year: 'the year {y}, as outsiders count it',
    greet: 'I see you, and I take nothing.',
    oath: 'By the name I do not tell you.',
    curse: 'May you take two, and be seen doing it.',
    who: ['the forest hunters', 'the bands'],
    sayings: [
      ['The tree you lean on is leaning on another', 'kin'],
      ['A trade name is a coat; the true name is your skin', 'kin'],
      ['Leave the honey you cannot carry', 'money work'],
      ['Strangers are weather: wait, and they pass', 'guest travel'],
    ],
    lines: [
      ['Among the Leaf People a {w2} is for outsiders; the {w1} stays in the Deep Green.', 'kin guest'],
      ['A band that takes two of anything moves on before the forest notices.', 'land work'],
    ],
    swap: [],
  };

  V['CUL-17'] = { // Cloudfolk: the hill tribes of Great Amber, clan signs, the ridge mist
    lord: ['kedaru', 'a clan elder, whose sign is on the tallest post'],
    ruler: ['Kambuli', 'the Sultan on the coast, whom the hills seldom see'],
    council: ['pamang', 'the longhouse meeting of the clan signs'],
    year: 'the {n} mist season of {ru}',
    greet: 'Clear ridge to you.',
    oath: 'By the sign on my house post.',
    curse: 'May the mist keep you.',
    who: ['the hill folk', 'the clan elders'],
    sayings: [
      ['The mist borrows; it does not steal', 'death'],
      ['A post outlasts the house it holds up', 'kin'],
      ['Lowland salt is sweet until the bill comes', 'money'],
    ],
    lines: [
      ['Every Cloudfolk house has its {w1} carved on the door post, and nobody enters under the wrong one.', 'kin guest'],
      ['When the {w2} comes down the ridge nobody walks, because the dead are walking.', 'death land travel'],
    ],
    swap: [],
  };
})();
