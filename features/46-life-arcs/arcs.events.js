// A mid-game and a late game for each path (46-life-arcs). Each arc is a run of scenes years apart; every choice moves
// the arc on (fx.arc), and the marks it leaves (C.arcMark) change what the later scenes say and offer.
const M = (p, m) => !!(p && p.flags && p.flags['la_' + m]);

A.defEvents([
  // ---------------------------------------------------------------- the soldier: a command of your own
  { id: 'la_command_1', title: 'A command of your own', trigger: true, cool: 1,
    cond: (p, C) => C.soldier(p),
    text: 'The colonel gives you a company of your own: ninety men, two sergeants who were here before you, and a stretch of the river nobody else wants. "Hold it," he says. "Make something of them." The men watch you the way dogs watch a new master.',
    choices: [
      { t: 'Drill them hard, from the first morning', r: 'You drill them until they hate you. By midsummer they hate you in step.', fx: { merit: 6, skill: { command: 2 }, arc: { mark: 'cmd_hard' } } },
      { t: 'Learn their names before you give an order', r: 'It takes a week. They notice that you bothered.', fx: { merit: 2, rel: { who: 'comrade', op: 8, all: true }, arc: { mark: 'cmd_names' } } },
      { t: 'Let the sergeants run it, and watch', r: 'The sergeants run it as they always have. You learn how, and what it costs.', fx: { wil: 1, skill: { tactics: 1 }, arc: { mark: 'cmd_watch' } } },
    ] },
  { id: 'la_command_2', title: 'The ford', trigger: true, cool: 1,
    cond: (p, C) => C.soldier(p),
    text: p => `The enemy comes to your river in force. The order from above is to fall back to the hills tonight. You could hold the ford till morning and let the baggage train get clear, at a cost in men. ${M(p, 'cmd_hard') ? 'Your company would hold; you drilled them for this.' : M(p, 'cmd_names') ? 'Your men would stay if you asked. You know which of them would not come back.' : M(p, 'cmd_watch') ? 'The sergeants have run this company since before you came. This time they wait for you.' : 'The sergeants are waiting to see what you choose.'}`,
    choices: [
      { t: 'Hold the ford till dawn', check: { s: 'command', s2: 'wil', d: 50 },
        win: { r: 'You hold. The baggage gets away, and a third of your company does not.', fx: { merit: 12, fame: 4, health: -10, arc: { mark: 'cmd_held' } } },
        lose: { r: 'The ford breaks at midnight. You get half the company out.', fx: { merit: 2, health: -18, happy: -6, arc: { mark: 'cmd_broke' } } } },
      { t: 'Fall back as ordered', r: 'You fall back in good order. The baggage train is taken. Nobody blames you, quite.', fx: { merit: 3, arc: { mark: 'cmd_obeyed' } } },
      { t: 'Burn the ford-houses and fall back', r: 'The smoke slows them a day. It is not your village. It was someone\'s.', fx: { merit: 6, honor: -3, arc: { mark: 'cmd_burned' } } },
    ] },
  { id: 'la_command_3', title: 'What the army says of you', trigger: true, cool: 1,
    cond: (p, C) => C.soldier(p),
    text: p => (M(p, 'cmd_held') ? 'They call it your ford now, in the songs the drovers sing. A young lord asks to serve in your company, for the name.'
      : M(p, 'cmd_broke') ? 'The army remembers the ford that broke. So do you, most nights. The colonel offers you a quieter post.'
      : M(p, 'cmd_burned') ? 'The drovers sing of other fords. The people of the ford-houses have their own name for you. The colonel asks what you want next.'
      : M(p, 'cmd_obeyed') ? 'The baggage train was lost on your river, by the book. The army has not decided what that makes you. The colonel asks what you want next.'
      : 'Your years with the company are counted up. The colonel asks what you want next.'),
    choices: [
      { t: 'Ask for a bigger command', r: 'You get it, with a bigger river and fewer men than you asked for.', fx: { merit: 10, arc: { go: 'end', mark: 'cmd_more' } } },
      { t: 'Ask for the quiet post', r: 'A depot, a ledger, and nobody shooting at you. You sleep.', fx: { happy: 6, merit: -2, arc: { go: 'end', mark: 'cmd_quiet' } } },
      { t: 'Keep the company you have', r: 'You stay with your men. That is answer enough for them.', fx: { rel: { who: 'comrade', op: 10, all: true }, honor: 2, arc: { go: 'end', mark: 'cmd_stayed' } } },
    ] },
  // the old campaigner
  { id: 'la_oldsoldier_1', title: 'The boy who wants to learn', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `A boy of sixteen has followed you about the yard for a month. He wants to learn the trade the way you learned it, not the way the drill-masters teach it.${M(p, 'cmd_held') ? ' He knows about the ford. Everyone does.' : ''}`,
    choices: [
      { t: 'Teach him everything, the ugly parts too', r: 'You teach him how men really die and how not to. He listens like it matters.', fx: { newRel: { type: 'friend', op: 40 }, skill: { command: 1 }, arc: { mark: 'old_taught' } } },
      { t: 'Send him home to his mother', r: 'He goes, furious. He may live longer for it.', fx: { honor: 2, arc: { mark: 'old_sent' } } },
    ] },
  { id: 'la_oldsoldier_2', title: 'The last campaign', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `War again. The muster-roll has your name on it out of habit, and your knees have opinions about that.${M(p, 'old_taught') ? ' The boy you taught is a sergeant now, and he is going.' : M(p, 'old_sent') ? ' The boy you sent home is a man now, and has enlisted anyway.' : ''}${M(p, 'cmd_more') ? ' They want you for the big river again.' : M(p, 'cmd_quiet') ? ' The depot clerk wrote it there himself, to be rid of you.' : ''}`,
    choices: [
      { t: 'Go one last time', check: { s: 'command', s2: 'sta', d: 50 },
        win: { r: 'You go, and you come back, with one more story than you left with.', fx: { fame: 4, merit: 8, health: -8, arc: { go: 'end' } } },
        lose: { r: 'You go. The winter camp is harder than you remembered, and you come home coughing.', fx: { health: -20, fame: 2, arc: { go: 'end' } } } },
      { t: 'Stay home and write it all down', r: 'You write what you know of war, plainly. Young officers copy it out by hand.', fx: { fame: 3, skill: { learning: 2 }, arc: { go: 'end' } } },
      { t: 'Stay home, and let it go', r: 'You let it go. It is quieter than you expected, and so are you.', fx: { happy: 4, arc: { go: 'end' } } },
    ] },

  // ---------------------------------------------------------------- the trader: a house abroad
  { id: 'la_house_1', title: 'A branch abroad', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: 'Your trade has outgrown one market. A counting-house in a foreign port would let you buy at the source and sell without the middlemen, if you had someone there you could trust.',
    choices: [
      { t: 'Send a cousin, and the family\'s trust', req: p => p.coin >= 150, r: 'Your cousin sails with a letter of credit and many promises.', fx: { coin: -150, arc: { mark: 'house_cousin' } } },
      { t: 'Hire a factor who knows the port', req: p => p.coin >= 200, r: 'A sharp foreigner with good references takes your money and your seal.', fx: { coin: -200, skill: { trade: 1 }, arc: { mark: 'house_factor' } } },
      { t: 'Go yourself for a season', r: 'You go. The port is loud, the food is strange, and the prices are a revelation.', fx: { skill: { trade: 3 }, happy: -2, arc: { mark: 'house_self' } } },
    ] },
  { id: 'la_house_2', title: 'Word from the branch', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => (M(p, 'house_cousin') ? 'Your cousin writes that the branch prospers, and asks for more credit. The letters are cheerful and vague, and the accounts are late.'
      : M(p, 'house_factor') ? 'Your factor writes that a rival house is undercutting you, and asks leave to bribe the harbourmaster.'
      : M(p, 'house_self') ? 'The season abroad has taught you which goods carry and which rot. A rival house wants to buy what you learned.'
      : 'A rival house wants to buy your branch, and what it knows.'),
    choices: [
      { t: 'Go and see the books yourself', check: { s: 'trade', s2: 'ins', d: 50 },
        win: { r: 'The books are worse than the letters and better than you feared. You put them right.', fx: { coin: 120, skill: { trade: 2 }, arc: { mark: 'house_saved' } } },
        lose: { r: 'The books are a fiction. Half of what you sent is gone.', fx: { coin: -150, happy: -4, arc: { mark: 'house_lost' } } } },
      { t: 'Trust them, and send what they ask', req: p => p.coin >= 100, r: 'You send it. Trust is cheaper than travel, for a while.', fx: { coin: -100, arc: { mark: 'house_trusted' } } },
      { t: 'Close the branch and take what is left', r: 'You close it. What comes home is less than you sent and more than nothing.', fx: { coin: 60, arc: { go: 'end' } } },
    ] },
  { id: 'la_house_3', title: 'The charter', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `${M(p, 'house_lost') ? 'You are still paying for the branch that failed.' : M(p, 'house_saved') ? 'The books you put right have stayed right, and the branch has done well enough to be noticed.' : M(p, 'house_trusted') ? 'The branch still writes cheerful letters and asks for credit. It has been noticed, for one reason or another.' : 'The branch has done well enough to be noticed.'} The crown is selling a charter: the sole right to carry one good through the realm's ports for ten years.`,
    choices: [
      { t: 'Bid for the charter', req: p => p.coin >= 300, check: { s: 'persuasion', s2: 'trade', d: 55 },
        win: { r: 'The charter is yours. Your seal is on half the bales in the harbour.', fx: { coin: 200, fame: 4, rep: 4, arc: { go: 'end', mark: 'house_charter' } } },
        lose: { r: 'A better-connected house wins it. Your deposit is not returned.', fx: { coin: -300, arc: { go: 'end' } } } },
      { t: 'Partner with the house that wins it', r: 'You take a smaller share of a sure thing.', fx: { coin: 80, arc: { go: 'end', mark: 'house_partner' } } },
      { t: 'Stay out of the crown\'s business', r: 'You stay out. Charters change hands with governments, and governments change.', fx: { wil: 1, arc: { go: 'end' } } },
    ] },
  // handing on the house
  { id: 'la_heirhouse_1', title: 'Who takes the house', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: 'You are not as quick at the ledgers as you were. The house needs a hand that will hold it after you, and every clerk in it is watching to see whose hand that is.',
    choices: [
      { t: 'Your own child, whatever their gifts', r: 'Blood it is. The clerks bow, and some of them start looking for other houses.', fx: { family: 4, arc: { mark: 'heir_blood' } } },
      { t: 'The best clerk you have', r: 'You choose the best. Your family is polite about it at dinner.', fx: { coin: 50, family: -3, arc: { mark: 'heir_clerk' } } },
      { t: 'Sell it while it is worth something', r: 'A rival house pays well for your name and your books.', fx: { coin: 400, happy: -4, arc: { go: 'end' } } },
    ] },
  { id: 'la_heirhouse_2', title: 'The last ledger', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `The house goes on under ${M(p, 'heir_blood') ? 'your child' : 'your clerk'}.${M(p, 'heir_clerk') ? ' Your family is still polite about it at dinner.' : ''} In the bottom drawer is a ledger of debts owed to you by people who will never pay.`,
    choices: [
      { t: 'Forgive them all, and burn it', r: 'You burn it in the counting-house grate. Word gets round faster than the smoke.', fx: { honor: 5, fame: 3, arc: { go: 'end' } } },
      { t: 'Hand it to your heir to collect', r: 'Your heir takes it with a look you will think about later.', fx: { coin: 100, arc: { go: 'end' } } },
    ] },

  // ---------------------------------------------------------------- the priest: the parish and the heresy
  { id: 'la_parish_1', title: 'A parish of your own', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: 'You are given a parish: a cold church, a leaking roof, and a congregation that drove the last priest out with silence. The bishop calls it an opportunity.',
    choices: [
      { t: 'Mend the roof with your own hands', r: 'You climb up with tar and slates. By the second Sunday a carpenter climbs up with you.', fx: { piety: 4, health: -4, arc: { mark: 'par_roof' } } },
      { t: 'Visit every house before you preach', r: 'You eat a great deal of bad bread and learn who hates whom.', fx: { skill: { persuasion: 2 }, arc: { mark: 'par_visit' } } },
      { t: 'Preach fire until they come', r: 'Some come out of fear. Some stop coming at all.', fx: { piety: 6, fame: 1, arc: { mark: 'par_fire' } } },
    ] },
  { id: 'la_parish_2', title: 'The preacher in the field', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `A wandering preacher draws your people to a field outside the village, and what he says is not what the church teaches. The bishop wants his name and your account of him.${M(p, 'par_visit') ? ' You know half the families who go to hear him.' : M(p, 'par_roof') ? ' The carpenter who mended your roof goes to hear him.' : M(p, 'par_fire') ? ' Your fire emptied the back pews. He is filling a field.' : ''}`,
    choices: [
      { t: 'Give the bishop his name', r: 'The bishop\'s men take him at dawn. Your church is full again, and quieter.', fx: { piety: 4, honor: -3, arc: { mark: 'par_gave' } } },
      { t: 'Go and hear him yourself', check: { s: 'faith', s2: 'int', d: 50 },
        win: { r: 'He is wrong about some things and right about the poor. You say so to the bishop, carefully.', fx: { piety: 2, skill: { faith: 2 }, arc: { mark: 'par_heard' } } },
        lose: { r: 'Someone sees you in the field. By the next synod it is your name on a list.', fx: { piety: -4, fame: -2, arc: { mark: 'par_suspect' } } } },
      { t: 'Hide him from the bishop', r: 'He sleeps in your vestry and leaves before dawn. You have made a choice you cannot unmake.', fx: { honor: 4, piety: -2, arc: { mark: 'par_hid' } } },
    ] },
  { id: 'la_parish_3', title: 'The synod', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => (M(p, 'par_hid') || M(p, 'par_suspect') ? 'The synod has questions about the field preacher, and about you. The bishop will not meet your eye.'
      : M(p, 'par_gave') ? 'The synod meets. The field preacher is in the bishop\'s cells, and the record says who gave his name.'
      : M(p, 'par_heard') ? 'The synod meets. The bishop has read your careful letter about the poor, and has questions of his own.'
      : 'The synod meets, and your parish is spoken of: the roof, the full church, the preacher who is gone.'),
    choices: [
      { t: 'Speak plainly, whatever it costs', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'You speak plainly and the synod listens. You are given an abbey.', fx: { piety: 6, fame: 4, promote: 1, arc: { go: 'end' } } },
        lose: { r: 'You speak plainly. You are sent to a smaller parish, further north.', fx: { piety: 2, happy: -6, arc: { go: 'end' } } } },
      { t: 'Say what the synod wants to hear', r: 'You say it well. You keep your parish, and something else goes.', fx: { honor: -3, arc: { go: 'end' } } },
    ] },
  // a shrine
  { id: 'la_shrine_1', title: 'A place for the sick', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: 'You have buried more of your people than you can count, most of them of things a dry bed and broth would have mended. A widow has left a house and a field to the church, and the bishop asks what you would do with them.',
    choices: [
      { t: 'A hospital for the sick poor', r: 'Six beds, a well, and two nuns who argue about everything. It is a start.', fx: { piety: 6, honor: 3, arc: { mark: 'shr_hosp' } } },
      { t: 'A shrine to draw the pilgrims', r: 'Pilgrims bring coin, and coin mends roofs. The relic is a saint\'s finger, or someone\'s.', fx: { coin: 80, piety: 2, arc: { mark: 'shr_pilg' } } },
    ] },
  { id: 'la_shrine_2', title: 'What you leave behind', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `${M(p, 'shr_hosp') ? 'The hospital has twelve beds now and a name the poor say with their hats off.' : M(p, 'shr_pilg') ? 'The shrine draws pilgrims from three realms, and a fair at every feast.' : 'The house and the field are still the church\'s.'} The bishop asks who should keep it after you.`,
    choices: [
      { t: 'The nun who argues with everyone', r: 'She takes it with a lecture. It will be in good hands, and loud ones.', fx: { honor: 2, fame: 2, arc: { go: 'end', mark: 'shr_nun' } } },
      { t: 'The bishop\'s nephew, who will fund it', r: 'The nephew brings money and opinions. It will last, if not as you made it.', fx: { coin: 50, arc: { go: 'end', mark: 'shr_nephew' } } },
    ] },

  // ---------------------------------------------------------------- the scholar: the great work
  { id: 'la_book_1', title: 'The great work', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: 'You have a book in you. You have had it for years, in margins and on the backs of letters. It will take ten years and every candle you can buy.',
    choices: [
      { t: 'A chronicle of the realm, honestly told', r: 'You begin with the founding and the lies told about it.', fx: { skill: { learning: 2 }, arc: { mark: 'book_chron' } } },
      { t: 'A book of healing from what you have seen', r: 'You begin with the cases you could not save.', fx: { skill: { medicine: 2 }, arc: { mark: 'book_heal' } } },
      { t: 'A treatise to win a patron\'s favour', r: 'You begin with a dedication longer than the first chapter.', fx: { skill: { persuasion: 1 }, coin: 30, arc: { mark: 'book_flatter' } } },
    ] },
  { id: 'la_book_2', title: 'The patron reads a chapter', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `Your patron has read the chapters you sent and wants changes. ${M(p, 'book_chron') ? 'The chapter on the last war makes the patron\'s father look like what he was.' : M(p, 'book_heal') ? 'The chapter on the plague names the physicians who ran.' : M(p, 'book_flatter') ? 'The dedication pleased. The patron would like to appear in more of it.' : 'The patron would like to appear in more of it.'}`,
    choices: [
      { t: 'Make the changes, and keep the patron', r: 'You make them. The book is smoother, and smaller.', fx: { coin: 60, honor: -2, arc: { mark: 'book_bent' } } },
      { t: 'Refuse, and lose the patron', r: 'You refuse. The money stops. The book does not.', fx: { coin: -40, honor: 3, wil: 1, arc: { mark: 'book_true' } } },
      { t: 'Write two versions', check: { s: 'learning', s2: 'int', d: 55 },
        win: { r: 'One for the patron, one for the drawer. Nobody knows but you.', fx: { coin: 40, arc: { mark: 'book_two' } } },
        lose: { r: 'A copyist mixes the pages. The patron reads the wrong version.', fx: { coin: -40, fame: -2, arc: { mark: 'book_true' } } } },
    ] },
  { id: 'la_book_3', title: 'The book goes out', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `The book is finished. ${M(p, 'book_true') ? 'It says what you meant it to say, and some people will not like that.' : M(p, 'book_two') ? 'One copy is the book your patron wanted. The other is in your drawer.' : M(p, 'book_bent') ? 'It is the book your patron wanted. The pages you cut are in the grate.' : 'It is the book your patron wanted, mostly.'} Copyists are waiting for word.`,
    choices: [
      { t: 'Let it be copied freely', r: 'Copies spread faster than you can count. Your name goes with them.', fx: { fame: 6, arc: { go: 'end', mark: 'book_free' } } },
      { t: 'Sell the right to one copy-house', r: 'The copy-house pays well and prints slowly.', fx: { coin: 150, fame: 2, arc: { go: 'end', mark: 'book_sold' } } },
      { t: 'Give it to the college library', r: 'It sits on a chained shelf, read by students for a hundred years.', fx: { fame: 3, honor: 3, arc: { go: 'end', mark: 'book_college' } } },
    ] },
  // a school
  { id: 'la_school_1', title: 'Pupils', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `Three young people have come to your door asking to be taught, with nothing to pay but their hunger for it. A fourth, a merchant's son, has a purse and no particular hunger.${M(p, 'book_free') ? ' All four have read your book, in copies of copies.' : M(p, 'book_college') ? ' They found your book on the college\'s chained shelf.' : M(p, 'book_sold') ? ' Only the merchant\'s son could afford your book.' : ''}`,
    choices: [
      { t: 'Take the three, turn away the purse', r: 'You teach the three for nothing and eat less.', fx: { coin: -30, honor: 3, skill: { learning: 1 }, arc: { mark: 'sch_poor' } } },
      { t: 'Take all four; the purse feeds the three', r: 'The merchant\'s son pays for everyone and learns more than he meant to.', fx: { coin: 30, arc: { mark: 'sch_all' } } },
    ] },
  { id: 'la_school_2', title: 'The pupil who passes you', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `${M(p, 'sch_poor') ? 'One of the three you taught for nothing' : M(p, 'sch_all') ? 'The merchant\'s son, of all of them,' : 'One of your pupils'} has written a better book than any of yours, and has had the grace to dedicate it to you.`,
    choices: [
      { t: 'Say so, publicly and gladly', r: 'You say so at the college. It is the best lecture you ever gave.', fx: { fame: 4, happy: 6, arc: { go: 'end' } } },
      { t: 'Find the flaws, privately', r: 'You find three. You keep them to yourself, mostly.', fx: { skill: { learning: 2 }, happy: -2, arc: { go: 'end' } } },
    ] },

  // ---------------------------------------------------------------- the outlaw: the big job
  { id: 'la_job_1', title: 'The big job', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: 'A clerk who drinks too much says the tax money for the whole province sits one night in the counting-house before the escort comes. One night, one door, two guards. It would set you up for life, or end it.',
    choices: [
      { t: 'Put together a crew', r: 'A lock-man, a lookout, and a big man who asks no questions. Everyone wants a share.', fx: { skill: { intrigue: 2 }, arc: { mark: 'job_crew' } } },
      { t: 'Do it alone', r: 'No shares, and no one to talk afterwards. Also no one to help.', fx: { wil: 1, arc: { mark: 'job_alone' } } },
      { t: 'Sell the tip to someone else', r: 'You sell the tip for forty suns and an alibi.', fx: { coin: 40, arc: { go: 'end' } } },
    ] },
  { id: 'la_job_2', title: 'The night', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `The night comes. ${M(p, 'job_alone') ? 'You are alone in the lane behind the counting-house.' : 'Your crew is in place. The lookout is late.'} One guard is asleep; the other is not.`,
    choices: [
      { t: 'In and out, quiet', check: { s: 'stealth', s2: 'spd', d: 55 },
        win: { r: 'In and out before the bell. The strongbox is heavier than you dreamed.', fx: { coin: 400, infamy: 4, arc: { mark: 'job_rich' } } },
        lose: { r: 'The awake guard is awake. You run with what you can carry.', fx: { coin: 80, health: -10, arc: { mark: 'job_seen' } } } },
      { t: 'Deal with the guard first', check: { s: 'melee', s2: 'str', d: 50 },
        win: { r: 'The guard sleeps too, now. You take your time.', fx: { coin: 300, honor: -4, infamy: 6, arc: { mark: 'job_rich' } } },
        lose: { r: 'The guard shouts. Half the street wakes up.', fx: { health: -15, arc: { mark: 'job_seen' } } } },
      { t: 'Walk away: it smells wrong', r: 'You walk away. In the morning the counting-house is full of soldiers who were waiting.', fx: { wil: 2, arc: { go: 'end', mark: 'job_walked' } } },
    ] },
  { id: 'la_job_3', title: 'Afterwards', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `${M(p, 'job_seen') ? 'You were seen. A description is posted at every gate, and it is a good one.' : M(p, 'job_rich') ? 'The money is hidden. Now comes the hard part: spending it without being asked where it came from.' : 'Nobody has come for you yet.'}${M(p, 'job_crew') ? ' The lock-man wants his share early, and the big man has started asking questions.' : ''}`,
    choices: [
      { t: 'Lie low for a year', r: 'A year of being nobody, in a town where nobody knows you.', fx: { happy: -4, wil: 1, arc: { go: 'end' } } },
      { t: 'Buy a respectable business with it', req: p => p.coin >= 200, r: 'An inn, honestly run. The money comes out clean, slowly.', fx: { coin: -200, rep: 3, arc: { go: 'end', mark: 'job_inn' } } },
      { t: 'Spend it loud and enjoy it', r: 'You spend it loud. You enjoy it. People notice.', fx: { happy: 8, infamy: 4, arc: { go: 'end', mark: 'job_loud' } } },
    ] },
  // going straight
  { id: 'la_straight_1', title: 'A pardon for sale', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `A magistrate's clerk lets it be known that the old charges against you could be lost, for a price. You are tired, and your knees hurt on rooftops.${M(p, 'job_inn') ? ' The inn pays its way. The charges are all that stand between you and a respectable old age.' : M(p, 'job_loud') ? ' The clerk remembers the year you spent so loudly, and has set his price by it.' : M(p, 'job_walked') ? ' You walked away from the tax money once, and were right to. This smells better.' : ''}`,
    choices: [
      { t: 'Buy the pardon', req: p => p.coin >= 150, r: 'The papers are lost. You are, on paper, nobody in particular.', fx: { coin: -150, infamy: -6, arc: { mark: 'str_pardon' } } },
      { t: 'Keep the money and your old ways', r: 'You keep both. Old ways are what you know.', fx: { wil: 1, arc: { mark: 'str_kept' } } },
    ] },
  { id: 'la_straight_2', title: 'The young thief', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `A young thief, quick and stupid, asks you to teach him the trade.${M(p, 'str_pardon') ? ' You are respectable now, mostly.' : M(p, 'str_kept') ? ' The old charges still stand, and he knows it.' : ''} He reminds you of someone.`,
    choices: [
      { t: 'Teach him to stay alive', r: 'You teach him the trade, and when to stop. He listens to the first part.', fx: { newRel: { type: 'friend', op: 30 }, infamy: 2, arc: { go: 'end' } } },
      { t: 'Get him honest work', r: 'You find him a place with a carter. He hates it. He lives.', fx: { honor: 3, arc: { go: 'end' } } },
    ] },

  // ---------------------------------------------------------------- the lord: the estate
  { id: 'la_estate_1', title: 'The estate', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: 'Your steward brings three plans for the lands: drain the marsh for new fields, build a mill on the river, or clear the forest edge for a new village. You can afford one, if the harvest holds.',
    choices: [
      { t: 'Drain the marsh', req: p => p.coin >= 100, r: 'Ditches, pumps and fever. In three years, the best fields you own.', fx: { coin: -100, skill: { stewardship: 2 }, arc: { mark: 'est_marsh' } } },
      { t: 'Build the mill', req: p => p.coin >= 120, r: 'The mill turns by autumn. Every tenant must grind there, and pay.', fx: { coin: -120, arc: { mark: 'est_mill' } } },
      { t: 'Clear land for a new village', r: 'Settlers come for the free years. You will have more people, and more trouble.', fx: { skill: { stewardship: 1 }, arc: { mark: 'est_village' } } },
    ] },
  { id: 'la_estate_2', title: 'The tenants', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `${M(p, 'est_mill') ? 'The tenants refuse to pay the mill dues. They grind at home, by hand, out of spite.' : M(p, 'est_village') ? 'The new village wants its own church and a say in the manor court.' : M(p, 'est_marsh') ? 'The drained fields need hands, and the tenants want a share of what they grow.' : 'The tenants have a grievance.'} Your steward wants an answer.`,
    choices: [
      { t: 'Hear them out in the hall', check: { s: 'diplomacy', s2: 'wil', d: 45 },
        win: { r: 'You find terms they can live with. They go home grumbling, which is how you know it is fair.', fx: { honor: 3, arc: { mark: 'est_fair' } } },
        lose: { r: 'The hall gets loud. You give more than you meant.', fx: { coin: -40, arc: { mark: 'est_gave' } } } },
      { t: 'Send the steward with men', r: 'The dues are paid. Two barns burn that winter, nobody knows how.', fx: { coin: 60, honor: -3, arc: { mark: 'est_force' } } },
    ] },
  { id: 'la_estate_3', title: 'What the land became', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => (M(p, 'est_force') ? 'The estate pays well and is quiet in the way of a held breath.'
      : M(p, 'est_gave') ? 'The estate is richer than your father left it. The tenants know now that you can be talked round, and they talk.'
      : M(p, 'est_fair') ? 'The estate is richer than your father left it, and the tenants say your name without spitting.'
      : 'The estate is richer than your father left it.'),
    choices: [
      { t: 'Ride the bounds with your heir', r: 'You ride the bounds and name every field. Your heir will forget half of them.', fx: { family: 4, happy: 4, arc: { go: 'end', mark: 'est_heir' } } },
      { t: 'Spend the surplus at court', r: 'The surplus buys you a season at court and a better seat at table.', fx: { coin: -60, fame: 4, arc: { go: 'end', mark: 'est_court' } } },
    ] },
  // the inheritance
  { id: 'la_heirs_1', title: 'Dividing the lands', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `The law says the eldest takes the land. Your eldest is not the one who loves it. The other is, and is looking at you across the table.${M(p, 'est_heir') ? ' It was the younger who remembered the names of the fields when you rode the bounds.' : M(p, 'est_court') ? ' Your eldest liked the season at court better than any field.' : ''}`,
    choices: [
      { t: 'Follow the law: the eldest takes all', r: 'The law is followed. Your younger child goes to make a life elsewhere.', fx: { honor: 2, family: -2, arc: { mark: 'heirs_law' } } },
      { t: 'Split the land between them', r: 'Two smaller estates, and two people who will not speak at your funeral.', fx: { family: -4, arc: { mark: 'heirs_split' } } },
      { t: 'Petition the crown to name the younger', req: p => p.coin >= 100, check: { s: 'diplomacy', s2: 'int', d: 55 },
        win: { r: 'The crown agrees, for a price. Your eldest leaves for the army.', fx: { coin: -100, arc: { mark: 'heirs_younger' } } },
        lose: { r: 'The crown refuses, and now everyone knows you tried.', fx: { coin: -100, family: -3, arc: { mark: 'heirs_refused' } } } },
    ] },
  { id: 'la_heirs_2', title: 'The old feud', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `The neighbouring house has hated yours for three generations, over a mill-stream nobody now remembers the course of. Its head is as old as you are, and has sent a cask of wine.${M(p, 'heirs_law') ? ' Your eldest will inherit the feud with the land.' : M(p, 'heirs_split') ? ' Both your children will inherit a stretch of the stream, and the quarrel.' : M(p, 'heirs_younger') ? ' Your younger child holds the land now, and wants to know what you mean to do.' : M(p, 'heirs_refused') ? ' He has heard that the crown refused you. The wine is meant to be noticed.' : ''}`,
    choices: [
      { t: 'Drink with him, and end it', r: 'You drink, and talk, and end it. Your heirs will have one less enemy.', fx: { happy: 4, honor: 2, arc: { go: 'end' } } },
      { t: 'Send the wine back unopened', r: 'You send it back. Some things are owed to the dead.', fx: { wil: 1, arc: { go: 'end' } } },
    ] },

  // ---------------------------------------------------------------- the ruler: a monument
  { id: 'la_monument_1', title: 'A monument', trigger: true, cool: 1,
    cond: (p, C) => C.ruler(p),
    text: 'Every ruler is remembered for one thing. Your architects bring three: a cathedral that will outlast the realm, a stone road from the capital to the sea, or a code of laws in plain words.',
    choices: [
      { t: 'The cathedral', r: 'The first stone is laid on a feast day. It will take sixty years.', fx: { piety: 6, treasury: -20000, arc: { mark: 'mon_cath' } } },
      { t: 'The road to the sea', r: 'Surveyors go out with chains and stakes. Merchants start buying land along the line.', fx: { treasury: -25000, realmStab: 2, arc: { mark: 'mon_road' } } },
      { t: 'The code of laws', r: 'You gather lawyers in a cold hall and tell them to write so a farmer can read it.', fx: { legit: 3, arc: { mark: 'mon_law' } } },
    ] },
  { id: 'la_monument_2', title: 'The cost', trigger: true, cool: 1,
    cond: (p, C) => C.ruler(p),
    text: p => `${M(p, 'mon_law') ? 'The lawyers have written a code that offends every lord in the realm, which is how you know it is fair.' : M(p, 'mon_cath') ? 'The cathedral walls are up to the windows, and the treasury is half empty.' : M(p, 'mon_road') ? 'The road has reached the hills, and the treasury is half empty.' : 'The work is half done and the treasury is half empty.'} The council wants it slowed, or paid for.`,
    choices: [
      { t: 'Raise a tax to finish it', r: 'The tax is paid with curses. The work goes on.', fx: { treasury: 20000, realmStab: -4, arc: { mark: 'mon_taxed' } } },
      { t: 'Slow it, and let the next reign finish', r: 'It will be finished, by someone, eventually.', fx: { realmStab: 2, arc: { mark: 'mon_slowed' } } },
      { t: 'Push it through by your own will', check: { s: 'stewardship', s2: 'wil', d: 55 },
        win: { r: 'You find the money in the waste of your own court. It is done in your reign.', fx: { legit: 4, arc: { mark: 'mon_done' } } },
        lose: { r: 'You push, and the lords push back. It costs you more than coin.', fx: { realmStab: -6, legit: -3, arc: { mark: 'mon_cost' } } } },
    ] },
  { id: 'la_monument_3', title: 'What stands', trigger: true, cool: 1,
    cond: (p, C) => C.ruler(p),
    text: p => `${M(p, 'mon_done') ? 'It is finished, in your reign. People come to see it.' : M(p, 'mon_taxed') ? 'It is not finished, but it stands. The tax that paid for it is cursed in every market.' : M(p, 'mon_slowed') ? 'It will not be finished in your reign, but it stands, and people already call it by your name.' : M(p, 'mon_cost') ? 'It is not finished. The lords who fought you over it still sit in your council.' : 'It is not finished, but it stands, and people already call it by your name.'} The chroniclers ask how it should be written.`,
    choices: [
      { t: 'Let them write it as a gift to the people', r: 'They write it so. Some of the people believe it.', fx: { fame: 6, realmStab: 2, arc: { go: 'end' } } },
      { t: 'Have your name cut above the door', r: 'Your name goes above the door, in letters a foot high.', fx: { fame: 8, honor: -2, arc: { go: 'end' } } },
    ] },
  // the crown at the end
  { id: 'la_crown_1', title: 'The heir', trigger: true, cool: 1,
    cond: (p, C) => C.ruler(p),
    text: 'Your heir is grown, restless, and surrounded by young lords who are already deciding who will be what. Your council watches you for a sign.',
    choices: [
      { t: 'Give the heir a real share of rule', r: 'You give the heir a province and a council seat. It is good practice, and good watching.', fx: { legit: 3, arc: { mark: 'crown_share' } } },
      { t: 'Keep the heir close and idle', r: 'The heir sulks at court. The young lords find other company.', fx: { realmStab: 2, arc: { mark: 'crown_idle' } } },
    ] },
  { id: 'la_crown_2', title: 'To lay it down', trigger: true, cool: 1,
    cond: (p, C) => C.ruler(p),
    text: p => `You are old. ${M(p, 'crown_share') ? 'Your heir has ruled a province well.' : M(p, 'crown_idle') ? 'Your heir has sulked at court for years, and done nothing yet, for good or ill.' : 'Your heir has done nothing yet, for good or ill.'} Some rulers lay the crown down while they can still watch what follows.`,
    choices: [
      { t: 'Rule until the end', r: 'You will die a ruler. The council sighs and goes back to work.', fx: { wil: 2, arc: { go: 'end' } } },
      { t: 'Name the day you will step down', r: 'You name a day. The realm holds its breath and then, mostly, lets it out.', fx: { honor: 4, legit: 2, arc: { go: 'end' } } },
    ] },
  // ---------------------------------------------------------------- common folk: a holding of your own
  { id: 'la_holding_1', title: 'A piece of ground', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: 'The widow at the end of the lane is giving up her strip and her cottage to go and live with her daughter. Two acres, a pear tree, and a roof that wants mending before winter.',
    choices: [
      { t: 'Buy it outright with what you have saved', req: p => p.coin >= 80, r: 'You count it out on her table. She counts it again. The ground is yours.', fx: { coin: -80, happy: 4, arc: { mark: 'hold_bought' } } },
      { t: 'Take it on halves from the lord', r: 'The steward writes you down for it. Half of what it grows is his.', fx: { happy: 1, skill: { husbandry: 1 }, arc: { mark: 'hold_halves' } } },
      { t: 'Let it go, and keep your savings', r: 'A cousin of the reeve gets it. You keep your coin, and walk past it often.', fx: { wil: 1, happy: -2, arc: { mark: 'hold_passed' } } },
    ] },
  { id: 'la_holding_2', title: 'The boundary stone', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `${M(p, 'hold_passed') ? 'Your plot is small, but it is yours to plough, and' : M(p, 'hold_bought') ? 'You know the widow\'s ground by now, every furrow, and' : 'You know your ground by now, every furrow, and'} this morning the boundary stone is a pace further onto it than it was at harvest. Your neighbour is very busy with his hedge.${M(p, 'hold_halves') ? ' The steward says it is your concern, not the lord\'s.' : ''}`,
    choices: [
      { t: 'Take it to the manor court', check: { s: 'persuasion', s2: 'int', d: 45 },
        win: { r: 'The court walks the line with a rod. The stone goes back, and he pays the costs.', fx: { coin: 10, fame: 1, arc: { mark: 'hold_court' } } },
        lose: { r: 'The court believes him, or his brother-in-law on the jury. You pay the costs.', fx: { coin: -20, happy: -4, arc: { mark: 'hold_lost' } } } },
      { t: 'Move it back yourself, at night', r: 'It is heavier than it looks. In the morning he looks at it, and at you, and says nothing.', fx: { str: 1, honor: -1, arc: { mark: 'hold_stone' } } },
      { t: 'Let him have the pace', r: 'You let it go. He brings you a jug of cider at harvest, which is as near as he will come.', fx: { happy: -2, newRel: { type: 'friend', op: 20 }, arc: { mark: 'hold_peace' } } },
    ] },
  { id: 'la_holding_3', title: 'The good year', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `A good year at last: rain when it was wanted, sun when it was wanted, and more in the barn than you can eat.${M(p, 'hold_peace') ? ' Your neighbour helps you bring it in.' : M(p, 'hold_court') || M(p, 'hold_stone') ? ' Your neighbour brings in his alone.' : M(p, 'hold_lost') ? ' Your neighbour brings in his, from the pace that was yours.' : ''}`,
    choices: [
      { t: 'Sell the surplus at market', r: 'The price is low, because everyone had a good year. Still, it is coin.', fx: { coin: 40, skill: { trade: 1 }, arc: { go: 'end' } } },
      { t: 'Store it against a bad year', r: 'You fill every crock and sack. The rats are grateful. So, in the hungry spring, are you.', fx: { health: 4, wil: 1, arc: { go: 'end' } } },
      { t: 'Feed the whole lane at a harvest supper', r: 'The lane eats your bread and drinks your ale and sings badly until midnight. They will remember it.', fx: { fame: 2, happy: 5, coin: -10, arc: { go: 'end', mark: 'hold_feast' } } },
    ] },
  // the village elder
  { id: 'la_elder_1', title: 'They come to you first', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `Somewhere in the last few years the village started bringing its quarrels to your door before the priest's or the reeve's.${M(p, 'hold_feast') ? ' Perhaps it was the harvest supper.' : ''} Today it is two brothers and one cow.`,
    choices: [
      { t: 'Hear them out and judge it', check: { s: 'persuasion', s2: 'ins', d: 45 },
        win: { r: 'You give the cow to one and her next calf to the other. Both grumble. Neither appeals.', fx: { fame: 2, honor: 2, arc: { mark: 'elder_judge' } } },
        lose: { r: 'Your judgement pleases neither. They take it to the reeve, and tell him what you said.', fx: { happy: -3, arc: { mark: 'elder_failed' } } } },
      { t: 'Send them to the reeve', r: 'You send them on. The reeve fines them both and keeps the cow a week.', fx: { happy: 2, arc: { mark: 'elder_declined' } } },
    ] },
  { id: 'la_elder_2', title: 'The common', trigger: true, cool: 1,
    cond: (p, C) => C.adult(p),
    text: p => `The lord means to fence the common for his sheep. The village meets in the church porch, and they look at you to speak for them.${M(p, 'elder_judge') ? ' You have judged half their quarrels; they trust your word.' : M(p, 'elder_failed') ? ' The brothers with the cow still tell your judgement against you, but you are old, and the old are listened to.' : M(p, 'elder_declined') ? ' You sent your last quarrel on to the reeve. They have come to you anyway.' : ' You are old, and the old are listened to, a little.'}`,
    choices: [
      { t: 'Go up to the manor and speak for the common', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'He keeps half of it for his sheep and leaves the village the rest. It is called by your name after.', fx: { fame: 4, honor: 3, arc: { go: 'end' } } },
        lose: { r: 'He hears you out politely and fences it all the same. The village thanks you for trying.', fx: { happy: -4, honor: 2, arc: { go: 'end' } } } },
      { t: 'Tell them to take his wages for the fencing', r: 'They grumble, and take the wages, and the winter is less hungry than they feared.', fx: { coin: 15, honor: -1, arc: { go: 'end' } } },
      { t: 'Say you are too old for lords', r: 'You go home and sit in the sun. It is the young ones\' fight now.', fx: { happy: 3, fame: -1, arc: { go: 'end' } } },
    ] },
]);
