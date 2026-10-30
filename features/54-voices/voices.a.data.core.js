// Culture voices, part A: the north, the west and the elder peoples (54-voices). See voices.core.js.
// Road to Ten, Events 6 ("give each culture its own event voice: word choice, sayings") and World 7 ("2 or 3 of its
// own words that show up in titles and events"). Everything here is invented for Ardan: no real proverb, no real
// language. Each culture has:
//   lord, ruler, council   its own word for a lord, for its sovereign and for its great council: [word, gloss], or
//                          'w1'..'w3' for one of its realm-bible words (47-realm-bible, A.BIBLE_WORDS)
//   year                   how it names the year: {n} the ruler's year as an ordinal, {ru} the ruler, {y} the number
//   greet, oath, curse     what it says on meeting, when it swears, and when it wishes you ill
//   who                    who "says" its sayings
//   sayings                [proverb, topics]; shown as: "Proverb," the reeves say.
//   lines                  [a knowledge line in its words, topics]; {w1}..{w3} {lord} {ruler} {council} {realm}
//   swap                   [English, word]: a plain word its own events may use in its place (first use only)
// Topics: money law oath death war kin faith land sea feast guest work power travel.
(function () {
  const V = A.VOICE_DATA = A.VOICE_DATA || {};

  V['CUL-01'] = { // Solenfolk: the Sunlands, the Temple, the noon bell, written law
    lord: ['torvane', 'a lord who holds a tower and the fields it can see'],
    ruler: ['Corrimar', 'a crowned head, crowned by the Temple'],
    council: ['vessimo', 'a sitting of the great families, or of the Luminaries'],
    year: 'the year {y} by the Needle',
    greet: 'Light on your road.',
    oath: 'Under the noon bell, and may the Light read it.',
    curse: 'May your {w3} be opened in court.',
    who: ['the clerks', 'the old priests', 'the moneychangers', 'Solen grandmothers'],
    sayings: [
      ['Ink outlives the hand that signs it', 'law money oath'],
      ['What the Light lends, the Light counts', 'faith money death'],
      ['Lie at dusk if you must; never at noon', 'oath law'],
      ['A sealed book has two readers, you and the court', 'money law kin'],
      ['The Temple forgets everything but a debt', 'faith money power'],
    ],
    lines: [
      ['At the {w1} no one here may lie, and most say little until it has rung.', 'oath law faith'],
      ['Every Solen house keeps a {w3}, and every {w3} is opened when the house dies.', 'money kin death'],
      ['The Temple calls it {w2}: what is owed to the Light, and never quite paid.', 'faith money'],
      ['A {lord} here holds his land by a written charter, and can quote it.', 'power law land'],
      ['In the Sunlands a promise is a debt, and the clerks write both in one hand.', 'oath money'],
      ['A {lord} here keeps a clerk before he keeps a sword.', 'power law war'],
    ],
    swap: [['tithe', 'w2']],
  };

  V['CUL-02'] = { // Northfolk: plains, iron, the ring, free men's moots
    lord: ['haldern', 'a lord, to whom the halds pay'],
    ruler: ['Overhald', 'the king or emperor, over every hald'],
    council: 'w3',
    year: 'the {n} winter of {ru}',
    greet: 'Fire on your hearth.',
    oath: 'On the iron, and on the roof over me.',
    curse: 'May your {w1} pay twice and burn once.',
    who: ['the reeves', 'the old men at the folkmoot', 'northern grandmothers', 'the plough-folk'],
    sayings: [
      ['Iron keeps a promise better than a man does', 'oath law'],
      ['Pay the mark and keep the pig', 'money law power'],
      ['Plough first. The Halls can wait', 'land faith work'],
      ['A guest eats first and asks last', 'guest feast'],
      ['Bury them facing the door, so they can find it', 'death kin'],
    ],
    lines: [
      ['Here a word given over ale is talk; a word given on iron is {w2}.', 'oath'],
      ['Every {w1} pays its mark, and every {w1} knows who has not.', 'money power'],
      ['A quarrel too big for two halds goes to the {w3}, and comes back bigger.', 'law'],
      ['The {lord} counts roofs, not people: one {w1}, one tax.', 'power money kin'],
      ['A northern widow keeps the {w1} until her eldest can hold a plough.', 'death kin land'],
    ],
    swap: [['household', 'w1']],
  };

  V['CUL-03'] = { // Wind Riders: the Salt Steppe, nine tribes, the post, the spring count
    lord: ['kesrun', 'a chief of a Wind, who answers for its horses'],
    ruler: ['Saghdar', 'the khan, who takes the spring count'],
    council: ['tessuk', 'the gathering of the nine chiefs'],
    year: 'the {n} {w2} of {ru}',
    greet: 'Grass under you, sky over you.',
    oath: 'By the Blue that sees, and the horse under me.',
    curse: 'May your horse go lame a day from water.',
    who: ['the herders', 'the post riders', 'old women of the Winds', 'the tally-keepers'],
    sayings: [
      ['A horse counted is a horse owed', 'money power land'],
      ['The cord is longer than the khan', 'law power death'],
      ['Ride to the well, not to the rumor', 'travel land'],
      ['Share the fire and keep the saddle', 'guest feast'],
      ['Sky over all; a chief over some', 'faith power'],
    ],
    lines: [
      ['Every spring comes the {w2}: so many horses a tent, and the {lord} counts twice.', 'money power land'],
      ['A rider with an {w1} sleeps at any post station between here and the Salt Sea.', 'travel'],
      ['A child here may carry a {w3}, a grandparent\'s name, and the debts that came with it.', 'kin death'],
      ['What the chiefs cannot settle goes to the {council}, and the {council} sits a long time.', 'law power'],
    ],
    swap: [],
  };

  V['CUL-11'] = { // Eastfolk: Velgrad and the Lakeland, the Dawn Church, rye and sable
    lord: ['vodrek', 'a lord of the Bench, who holds land and the souls on it'],
    ruler: ['Zarnek', 'the king, who is no king until the Patriarch crowns him'],
    council: ['sedmar', 'the Lords\' Bench, where the great lords sit'],
    year: 'the {n} Dawn of {ru}',
    greet: 'Light come early to you.',
    oath: 'Before the Dawn, on my father\'s name.',
    curse: 'May your {w2} last till summer.',
    who: ['the fur traders', 'the village priests', 'the rye farmers', 'old women at the stove'],
    sayings: [
      ['Rye in the barn, quarrels in the spring', 'land money kin'],
      ['Every price has a sable in it somewhere', 'money'],
      ['Wait out the winter; the winter waits for no one', 'death land'],
      ['The guest\'s first cup is the host\'s good name', 'guest feast'],
    ],
    lines: [
      ['Every {w1} here is written on the hearth-roll, and the roll is what the {lord} taxes.', 'money power kin'],
      ['In the {w2} no one marries and no one feasts, and everyone remembers who did.', 'faith feast kin'],
      ['An Eastfolk bride brings nothing; the groom pays the {w3}, in sable or in silver.', 'kin money'],
      ['No king here is king until the Patriarch crowns him, and the Patriarch knows it.', 'power faith'],
      ['The {lord} of a village owns the mill, and the mill owns everyone.', 'power money land work'],
      ['Quarrels between lords go to the {council}, where the loudest bench wins.', 'law power'],
      ['A debt here outlives the debtor; the {lord} collects it from the {w1}.', 'money death kin law'],
    ],
    swap: [['household', 'w1'], ['bride price', 'w3'], ['bride-price', 'w3']],
  };

  V['CUL-15'] = { // Corsairs: Blackreef, the Table, share-books, dice
    lord: ['bookman', 'a captain who keeps a share-book and sits at the Table'],
    ruler: ['Topman', 'the Captain-General, who has the chair at the Table'],
    council: ['Spread', 'the Captains\' Table, in the cant'],
    year: 'the {n} toll-year of {ru}',
    greet: 'Fair water and a fat prize.',
    oath: 'On the share-book, and the dice that judge me.',
    curse: 'May your {w1} come up short.',
    who: ['the old hands', 'the quartermasters', 'the dicers in the Brine Cup'],
    sayings: [
      ['The book pays; the captain only smiles', 'money power'],
      ['The tide judges, and it takes no bribes', 'law death sea'],
      ['Throw before you board', 'war sea faith'],
      ['One in forty, and nobody hangs', 'money law sea'],
    ],
    lines: [
      ['Your {w1} is what the share-book says, not what you remember being promised.', 'money'],
      ['A ship that shows a {w2} at the Reef sails on; one that does not is boarded.', 'sea money travel'],
      ['Nobody here boards a prize until the {w3} has been thrown.', 'war sea faith'],
      ['The {council} can vote the {ruler} out, and the {ruler} counts the votes.', 'power law'],
    ],
    swap: [],
  };

  V['CUL-18'] = { // Marchfolk: the Free Marches, runaways, furrows and latches
    lord: ['latchlord', 'any lord who claims the Marches from somewhere else'],
    ruler: ['Far Crown', 'whichever king claims the Marches this year'],
    council: ['saint-moot', 'a meeting at a saint\'s grave, where no blade is drawn'],
    year: 'the year {y}, as the lords count it',
    greet: 'Latch is up.',
    oath: 'On this latch, and under this roof.',
    curse: 'May a lord find your furrow.',
    who: ['the settlers', 'the ferrymen', 'old runaways'],
    sayings: [
      ['Plough round it and it is yours, till someone ploughs round you', 'land law'],
      ['Ask a runaway his name once', 'guest kin'],
      ['A promise ends at the door', 'oath'],
      ['Lords are weather. Fences are work', 'power work'],
    ],
    lines: [
      ['In the Marches one furrow ploughed round a field is a {w1}, and a {w1} is a title.', 'land law'],
      ['A {w2} is taken in here with no questions, and asked none later.', 'guest kin law'],
      ['A promise sworn on a latch is a {w3}: good under that roof, and nowhere else.', 'oath'],
    ],
    swap: [['runaway', 'w2']],
  };

  V['CUL-19'] = { // Sylvari: the Evenwood, the First Oak, Keepers, slow time
    lord: ['thessaran', 'a Warden or an Elder, whose word holds for a stand of trees'],
    ruler: ['Iorvael', 'the Queen, of the line of the First Oak'],
    council: ['sennalith', 'the gathering of Elders under the First Oak'],
    year: 'the {n} Greening of {ru}',
    greet: 'Root and leaf to you.',
    oath: 'By the tree I was named under.',
    curse: 'May your {w2} be felled without {w3}.',
    who: ['the Keepers', 'the elders', 'the rangers', 'the old ones'],
    sayings: [
      ['A tree grows slower than a grudge, and lasts longer', 'law kin'],
      ['Ask, then cut. Never cut, then ask', 'land work law'],
      ['A human\'s century is a long afternoon', 'guest death'],
      ['The forest keeps the count', 'death land'],
    ],
    lines: [
      ['No tree falls here without a {w1} cut in its bark by a Keeper.', 'land law work'],
      ['Every Sylvari child has an {w2}, a sapling planted at its naming, and is asked after it.', 'kin'],
      ['Before an axe touches wood here, someone speaks the {w3}, and means it.', 'land faith work'],
      ['Elves here will wait a hundred years for an answer, and remind you of the question.', 'law power oath'],
      ['A {lord} here may forbid a felling for a hundred years, and often does.', 'power land law work'],
      ['Nothing here is settled until the {council} meets under the First Oak.', 'power law'],
      ['When an elf dies here, the {w2} is left standing, and nobody cuts it.', 'death kin land'],
    ],
    swap: [['council', 'council'], ['elders', 'council'], ['warden', 'lord'], ['forester', 'lord'], ['the queen', 'ruler']],
  };

  V['CUL-20'] = { // Grovers of the Coast: Eldergrove, longships, silence sold by the year
    lord: ['maelorn', 'the master of a ship-house, who answers for its crew'],
    ruler: ['Saelvar', 'the Queen, who sits behind the Grey Veil'],
    council: ['thaliveth', 'the Council of the Grey Veil, which decides in months'],
    year: 'the {n} tide-year of {ru}',
    greet: 'Calm water and a quiet tongue.',
    oath: 'By my ship-house, and the silence I keep.',
    curse: 'May your hull spring, and your house hear of it.',
    who: ['the shipwrights', 'the sea-archers', 'the fir cutters', 'old sailors on the quay'],
    sayings: [
      ['Silence is sold by the year', 'money oath'],
      ['A ship is a house that has to agree', 'kin sea'],
      ['One voyage in ten belongs to the Queen', 'sea power'],
      ['Tar the hull before the sea asks', 'work sea'],
    ],
    lines: [
      ['Kin here are counted by {w1}: the ones who crew one longship together.', 'kin sea'],
      ['One voyage in ten is the {w2}, made in the Queen\'s name and at the Queen\'s price.', 'sea power money'],
      ['A Grover who has sold {w3} will not say what he knows, or that he knows it.', 'oath money'],
      ['The {council} decides in months, which elves call haste.', 'power law'],
      ['The fir for a longship is marked by a Keeper; a {lord} only pays for it.', 'work sea money land'],
      ['A {lord} answers to the {council} for every hull lost.', 'sea power law'],
      ['The Grover dead go out on the tide, with the mark of their {w1}.', 'death sea kin'],
    ],
    swap: [],
  };

  V['CUL-21'] = { // Holdfolk: the three holds, the Deep Law cut in stone, masters and names
    lord: ['harrok', 'a thane, who holds a hall and its mines'],
    ruler: ['Durmakar', 'the king or queen of a hold, under the Law and not above it'],
    council: ['brakkar', 'the Council of Masters, where every master of a craft has a seat'],
    year: 'the {n} year of {ru}, as the stone has it',
    greet: 'Stone under you.',
    oath: 'On my carved name, and the Law under it.',
    curse: 'May your name be cut shallow.',
    who: ['the Law-Carvers', 'the miners', 'the old smiths', 'the gate wardens'],
    sayings: [
      ['Cut it once, and cut it deep', 'law oath work'],
      ['A debt in stone outlives the debtor', 'money law death'],
      ['The mountain is patient. Be quicker', 'work'],
      ['Two hands on one bar', 'work oath money'],
    ],
    lines: [
      ['Here a quarrel ends at a {w1}, a line of the Deep Law cut in stone.', 'law'],
      ['Nobody is a {w2} until the {council} has watched the work and sworn the hands.', 'work law'],
      ['A dwarf has no full name till thirty, when the {w3} is carved.', 'kin'],
      ['The Hold Bank lends to kings, and cuts the terms in stone.', 'money power'],
      ['A debt at the Hold Bank is a {w1} of its own, and no less binding.', 'money law'],
      ['A {w2} who breaks the oath sworn before the {council} loses the craft.', 'oath work law'],
      ['The dead go into the deep halls, and their {w3} goes over the door.', 'death kin'],
      ['A {lord} holds a hall and its mines, and answers to the {ruler} for both.', 'power work money'],
    ],
    swap: [],
  };

  V['CUL-22'] = { // Horde clans: the grass, the Line of Gorath, drums, deed-names, the Law of the Fire
    lord: ['urg', 'a chief, first behind the drum'],
    ruler: ['krug-urg', 'the war-chief of all the clans'],
    council: ['rukhar', 'the Drum Council of the senior shamans'],
    year: 'the {n} grass of {ru}',
    greet: 'Is there water at your fire?',
    oath: 'By the Storm over me and the Mare under me.',
    curse: 'May you die without a {w1}.',
    who: ['the riders', 'the shamans', 'the clan-mothers', 'the old drummers'],
    sayings: [
      ['Ten minutes of riding, or none at all', 'war'],
      ['Nobody owns a horse; the clan lends it', 'land kin money'],
      ['Earn the name, then wear it', 'kin war'],
      ['A guest is a guest for three days, then grass', 'guest law'],
      ['The chief takes first and answers first', 'power war money'],
    ],
    lines: [
      ['An orc here has no name worth saying until a deed earns a {w1}.', 'kin war'],
      ['The horses belong to the {w2}, the clan herd; a rider only borrows them.', 'land kin money'],
      ['From every raid the {ruler} takes the {w3}, and must give more back.', 'war power money'],
      ['Under the Law of the Fire a guest is fed and unharmed for three days.', 'guest law'],
    ],
    swap: [['deed-name', 'w1']],
  };

  V['CUL-23'] = { // Tusk clans: the eastern steppe, the clan-mothers, no holy chiefs
    lord: ['urg', 'a chief, who answers to the clan-mothers'],
    ruler: ['krug-ama', 'the War-Mother of the sworn clans'],
    council: 'w3',
    year: 'the {n} summer of {ru}',
    greet: 'Water and grass to your mother\'s hearth.',
    oath: 'By the Storm, and by no chief at all.',
    curse: 'May your mother\'s tent be struck.',
    who: ['the clan-mothers', 'the toll-keepers', 'the riders'],
    sayings: [
      ['No chief is holy, and every chief knows it', 'power faith'],
      ['The tent is the mother\'s; the man is a guest in it', 'kin'],
      ['The toll is silver, and the road is ours', 'money travel'],
      ['Horses for a bride, and a bride for the horses', 'kin money'],
    ],
    lines: [
      ['Here the tent and herd are the mother\'s, an {w1}, and a husband lives in it by leave.', 'kin money'],
      ['A Tusk marriage is made with {w2}: horses from the groom\'s clan to the bride\'s mother.', 'kin money'],
      ['On grazing and law the {w3} can overrule the {ruler}, and has.', 'power law land'],
      ['The clans here call no living chief holy, and say so to chiefs.', 'power faith'],
    ],
    swap: [['marriage horses', 'w2']],
  };

  V['CUL-24'] = { // Hall-giants: Frostholm and Hrimfell, the halls, the Mother under the ice
    lord: 'w1',
    ruler: ['Hraumar', 'the eldest who speaks for all the halls to humans'],
    council: ['haugrum', 'the gathering of the eldests on the ice'],
    year: 'the {n} long dark of {ru}',
    greet: 'Warm hall, slow ice.',
    oath: 'Before the Mother under the ice, and my hall\'s chant.',
    curse: 'May the Mother keep her whales from you.',
    who: ['the eldests', 'the tribute-folk', 'the hall-mothers', 'the harpooners'],
    sayings: [
      ['First fish to the Mother, second to the eldest', 'faith money power'],
      ['A giant\'s anger is slow, and very heavy', 'war'],
      ['What the sea sends home, the hall eats whole', 'feast death sea'],
      ['Count tin twice and humans three times', 'money'],
    ],
    lines: [
      ['A hall is ruled by its {w1}, its eldest, and the eldest is very old.', 'power kin'],
      ['The first of every catch is the {w2}, given back to the Mother before anyone eats.', 'faith feast sea'],
      ['On long nights a hall sings the {w3}, every name of its line, low, till dawn.', 'kin death feast'],
      ['The tribute-folk say giants decide slowly, and never twice.', 'power law'],
      ['The {w1} of a hall decides who hunts, who marries and who leaves.', 'power kin war sea'],
      ['A death in a hall is sung into the {w3} the same night.', 'death kin'],
      ['Tin is weighed before the {w1}, and humans are watched while it is.', 'money work'],
    ],
    swap: [],
  };
})();
