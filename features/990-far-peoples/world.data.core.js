// One world (990-far-peoples): what each half believes of the other. The lore's "chain of hands": every bolt of silk
// and every story crosses the middle of the continent through hands paid to keep both ends ignorant, so most of what
// the west believes of the east, and the east of the west, is wrong. In a Great Continent game only:
//   A.FARP_WEST[culture]  lines the Known World's 24 cultures add to their voice banks, about the lands past the edge
//   A.FARP_EAST[land]     lines every far culture of a land adds, about the west
//   A.FARP_SECRETS        stories told at one end about the other, with the truth (26-belief-truth's LORE.secrets)
// Lines are 54's [text, topics]. Everything here is invented.
(function () {
  A.FARP_WEST = {
    'CUL-01': [['Silk comes from beyond the east edge, the moneychangers say, and the price comes with it.', 'money travel'], ['The Needle-Keepers say the sun rises out of nothing past the edge of the maps.', 'faith travel']],
    'CUL-02': [['Past the Tusk Clans the grass goes on, they say, until it falls off the world.', 'travel land'], ['A Kraoth trader swore the eastern horses are all the colour of smoke.', 'money travel']],
    'CUL-03': [['The post riders say the steppe runs six thousand kilometres east, and nobody has ridden it all.', 'travel land'], ['East of the Salt Sea, the herders say, a khagan counts his riders by the ten thousand.', 'war power']],
    'CUL-04': [['The garden merchants pay for silk what the far end would laugh at.', 'money'], ['Paper from the east is thinner than Qadiri paper, and nobody here has seen it made.', 'work money']],
    'CUL-05': [['The well-guides say there is a sand sea in the east that swallows whole caravans.', 'travel death'], ['Somewhere east, the Sandfolk say, nine families own nine wells and the road between.', 'money power']],
    'CUL-06': [['The flood-priests say there is another great river in the east that is a dyke-bound king.', 'land faith'], ['East-bound papyrus comes back as silk, and nobody on the river knows who trades it.', 'money travel']],
    'CUL-07': [['Pearl-buyers say the eastern divers stay down longer than any Sabran.', 'sea work'], ['Spice comes from isles no Sabran captain has seen, the harbour men say.', 'sea money']],
    'CUL-08': [['South of the edge, the griots say, there are lake kings who keep drums for crowns.', 'power faith'], ['Gold comes down from the south by roads no Zanari has walked to the end.', 'money travel']],
    'CUL-09': [['The Rememberers keep a story of a brother kingdom in the south that reads from a stone.', 'faith kin'], ['A cliff of letters stands somewhere south, the old priests say, and it names us.', 'faith']],
    'CUL-10': [['The pepper captains say the monsoon blows on east to islands of cloves.', 'sea money'], ['Kesh sent Well-Keepers down a coast nobody here has mapped, and some stayed.', 'faith travel']],
    'CUL-11': [['Velgrad\'s silk merchants say silk comes from beyond the east edge, and say nothing more.', 'money travel'], ['Furs from past the Lakeland are darker than ours, the fur men say, and dearer.', 'money']],
    'CUL-12': [['The monks say the Open Sky has a mother abbey east of the Roof, silent two hundred years.', 'faith travel'], ['Past the Roof, the porters say, the mountains are higher still.', 'land travel']],
    'CUL-13': [['The temple-keepers say Moon-Pearl\'s line came over the Rainwall long ago, from a temple far east.', 'faith'], ['East of the Rainwall, the Ranpuri say, a whole plain is ranked by its debts.', 'money faith']],
    'CUL-14': [['The amber captains say the Isles go on east until the sea is all islands.', 'sea travel'], ['Cloves cost more here than gold, and nobody here knows where they grow.', 'money sea']],
    'CUL-15': [['Old corsairs tell of junks in the east with four masts and sails like screens.', 'sea'], ['A Blackreef chart shows an eastern strait with a chain across it and a lord taking tolls.', 'sea money']],
    'CUL-16': [['The Leaf People say the Deep Green goes on south under the edge, greener.', 'land'], ['A song of theirs names a river so wide the far bank is a rumour.', 'land travel']],
    'CUL-17': [['The Cloudfolk say the mist on their ridges comes from a sea of islands in the east.', 'land sea'], ['A Cloudfolk canoe once came back from the east, they say, with a woven star-chart.', 'sea travel']],
    'CUL-18': [['The march traders say the eastern steppe is all one khagan\'s now.', 'power war'], ['East of the Tusk Clans, they say, there are orcs older than the Horde.', 'kin war']],
    'CUL-19': [['The Chroniclers say the trees of the east keep a count of years that disagrees with the Needle.', 'faith'], ['An elf who walked east in the old days is said to be walking still.', 'travel']],
    'CUL-20': [['The Grovers say pines without end lie past the Lakeland, and nobody sings to them.', 'land'], ['A fur trader swore the eastern trappers count furs in forties.', 'money']],
    'CUL-21': [['The Law-Carvers will not speak of the Cold Gate, which means they know the name.', 'faith law'], ['The old runes say the first forge was not here, and the carvers cut that line shallow.', 'work faith']],
    'CUL-22': [['The drummers say sixty clans walked west, and some say others stayed behind.', 'kin war'], ['The Horde\'s winter-counts start with a walk from the east.', 'kin']],
    'CUL-23': [['At Kraoth the silk comes in from the east on camels and goes on west on carts.', 'money travel'], ['The Tusk clan-mothers say there are mothers in the east who think us young.', 'kin power']],
    'CUL-24': [['The Mothers\' Chant of Jotunhall names a hall in the east whose chant parted from ours.', 'kin faith'], ['A giant partner swore there is ice in the east that never melts at all.', 'land']],
  };
  A.FARP_EAST = {
    R: [['The clerks say the west is barbarians who count by kings, not by the Ledger.', 'power law'], ['Silk that goes west comes back as silver, and the brokers keep the difference.', 'money travel']],
    F: [['West of Kraoth, the herders say, the Tusk Clans sit on the road like a toll-gate.', 'travel money'], ['The Old Mare say the clans who walked west forgot the count, and their signs prove it.', 'kin faith']],
    B: [['A broker never tells the truth about distance, and the west is very far away.', 'travel money'], ['The far end of the road, the brokers say, pays in silver and asks no questions.', 'money']],
    H: [['The Mother Stair has a daughter abbey somewhere west, the monks say, and it stopped writing in 916.', 'faith travel'], ['West over the Roof, the porters say, the mountains get lower and the people stranger.', 'land travel']],
    M: [['West over the Rainwall lies a kingdom that took a calf of the Sleeper\'s temples and forgot it.', 'faith'], ['The pearl captains say a western coast buys pearls at any price.', 'sea money']],
    A: [['Ships from the west come round the Southland with amber and want cloves.', 'sea money'], ['The pilots say the western captains cannot read the stars.', 'sea travel']],
    T: [['West through the pines, the trappers say, there are lake towns that pay dear for furs.', 'money travel'], ['The Peryvor fur men have heard of a western prince who wears a whole forest of furs.', 'power money']],
    N: [['The giants say a cousin hall stands far to the west, and counts its Mothers wrong.', 'kin faith'], ['Ivory goes south and west, and nobody here has seen where it ends.', 'money travel']],
    I: [['The Watch says the sun is born in the east; what lies west is only the mainland.', 'faith travel'], ['West across the sea, the households say, the mainland emperors fight over a book.', 'power']],
    D: [['North of the lakes, the drum-keepers say, there was a gold kingdom that once took tribute here.', 'power money'], ['The Stone Book names a brother kingdom to the north, and the priests still look for it.', 'faith kin']],
  };
  // stories told at one end of the chain about the other, and what is true
  A.FARP_SECRETS = [
    { id: 'SEC-F01', title: 'Where silk comes from', pub: 'Silk grows on trees beyond the east edge of the world, and the trees are guarded.',
      truth: 'Silk is spun by worms bred in the Long River Delta of the Twin Rivers. The Silk Law drowns anyone who carries the eggs out, and the brokers of the Nine Wells keep both ends of the road from learning of each other.',
      who: 'The Nine Masters of the Wells; the Silk Office at Venshai.', proof: 'A silkworm egg, warmed in a woman\'s sleeve, outside the Twin Rivers.', ifr: 'The western price of silk would fall by half, and the Nine Wells with it.' },
    { id: 'SEC-F02', title: 'The road\'s length', pub: 'The silk road is short past the sand, a few weeks, if the brokers would allow it.',
      truth: 'The road runs four thousand kilometres from Velgrad\'s markets to the Basins, through a dozen hands, each paid to lie about the distance.',
      who: 'Every League factor.', proof: 'A Cross-Desert Track map, which the League would kill for.', ifr: 'A direct traveller could cross the whole road and come back to tell it.' },
    { id: 'SEC-F03', title: 'The east\'s barbarians', pub: 'West of the Sand Basins live barbarians without letters, who count years by their kings and bury their dead facing the wrong way.',
      truth: 'The west keeps a written count of its own, the Needle\'s, older than many eastern kingdoms, and it disagrees with the Long Count by six years for a reason both temples bury.',
      who: 'The Board of Rites at Venshai; the Needle-Keepers at Solenne.', proof: 'Hauden\'s Long Count and the Needle\'s archive, side by side.', ifr: 'Two temples would learn that each corrected its calendar to fit a crown.' },
    { id: 'SEC-F04', title: 'The white elephant of Ranpur', pub: 'Ranpur\'s white elephant is Ranpur\'s own, born of the Thousand Names.',
      truth: 'Moon-Pearl is of the line of Dvaarnath\'s white elephants, carried over the Rainwall about 300 BR with the faith that became the Thousand Names.',
      who: 'The Keeper of the Dream at Dvaarnath.', proof: 'The temple rolls at Dvaarnath, which list the calf sent west.', ifr: 'Ranpur\'s faith would turn out to be a daughter of the Sleeper\'s temples.' },
    { id: 'SEC-F05', title: 'The first forge', pub: 'The Smith-Father\'s first forge was lit at Stonehold, and every hold since was lit from it.',
      truth: 'The Cold Gate\'s wall says the first forge was in the Ice Shoulders, and that the western holds were founded by exiles sent away about 2400 BR for a crime the west has forgotten.',
      who: 'The Eldest Carver of the Cold Gate.', proof: 'The oldest runes of the Long Count wall.', ifr: 'The Deep Law of the west would have a crime at its root.' },
    { id: 'SEC-F06', title: 'The sails without oars', pub: 'There is nothing east of the Sunrise Isles but sea and the sun\'s birthplace.',
      truth: 'In 1031 the Fog Coast saw white sails without oars far out in the east, and the Watch\'s log records a drift log of unknown wood the same year.',
      who: 'The Keeper of the Log on the Outer Isle; the Fog Coast\'s salmon chiefs.', proof: 'The drift log, kept in the Watch\'s hall.', ifr: 'The sun\'s land would be someone else\'s coast.' },
  ];
})();
