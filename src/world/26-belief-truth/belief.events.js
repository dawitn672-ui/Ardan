// Belief versus truth: scenes in which the accepted story cracks. Most reveal the truth behind one of the 71 lore
// secrets (A.BT.learnSecret, the base game's rl_k_ flag); a few turn on what you have seen of beasts. Setups pick
// with the engine's dice and drop the event (ctx.skip) when nothing is left to learn.
(function () {
const sec = (p, ctx) => { const si = A.BT.pickSecret(p); if (si < 0) { ctx.skip = true; return; } ctx.si = si; ctx.secTitle = LORE.secrets[si].title; };
const known = (p, ctx) => { const si = (p.flags.rl_secret || 0) - 1, s = LORE.secrets[si]; if (!s || !A.BT.secretKnown(p, s.id)) { ctx.skip = true; return; }
  ctx.si = si; ctx.secTitle = s.title; ctx.proof = String(s.proof || 'a document no one has seen').replace(/^\d\)\s*/, '').split(/[;.]/)[0]; };
// learn the secret in ctx, then any plain effects
const learn = extra => (p, ctx) => { A.BT.learnSecret(p, ctx.si); if (extra) A.applyFx(p, extra, ctx); return ' (Codex: Secrets you know)'; };
const seenBeast = p => Object.keys(p.flags || {}).some(k => /^bt_[sk]_/.test(k));
const beast = min => (p, ctx) => {
  const c = A.BT.pickCreature(p, l => l >= min); if (!c) { ctx.skip = true; return; }
  ctx.cid = c.id; ctx.beast = c.name.replace(/^The /, ''); ctx.lvl = A.BT.level(p, c.id);
};

A.defEvents([
  {
    id: 'bt_margin_note', title: 'A note in the margin',
    cond: (p, C) => A.BT.sinceSecret(p) >= 8 && C.adult(p) && C.literate(p) && C.town(p), w: 0.4, cool: 20, setup: sec,
    text: 'The record clerk lets you sit with the old rolls while he goes for his dinner. In the margin of a book older than the hall, a careful hand has written three lines about {secTitle}. They do not agree with what every child is taught.',
    choices: [
      { t: 'Copy the lines out before he comes back', check: { s: 'spd', s2: 'int', d: 40 },
        win: { r: 'You fold the copy into your shirt. At home you read it twice, then once more by the candle.', fx: learn({ flag: 'bt_copied' }) },
        lose: { r: 'He comes back with bread in his beard and sees the ink on your fingers. He takes the page, and your name.', fx: { happy: -3 } } },
      { t: 'Read it until you have it by heart', r: 'You close the book on it. The words stay.', fx: learn() },
      { t: 'Show the clerk what you found', r: 'He reads it, goes grey, and tears out the page. "Some idle monk," he says, and puts it in the stove.', fx: {} },
    ],
  },
  {
    id: 'bt_dying_priest', title: 'The priest in the cell',
    cond: (p, C) => A.BT.sinceSecret(p) >= 8 && C.adult(p) && !C.child(p), w: 0.4, cool: 20, setup: sec,
    text: 'A boy comes for you at dusk. A priest you met once is dying in a cell that smells of tallow and old wool. He says he has carried something about {secTitle} for forty years, and will not take it into the ground with him.',
    choices: [
      { t: 'Sit by him and listen', r: 'He talks until the candle is a stub. Then he sleeps, and does not wake.', fx: learn({ piety: 1 }) },
      { t: 'Ask him why he chose you', r: '"Because you will never matter enough to be believed," he says. He means it kindly, and tells you all of it.', fx: learn({ wil: 1 }) },
      { t: 'Fetch his superior instead', r: 'The superior thanks you at the door and closes it. You hear his voice through the wood, low and steady, for a long time.', fx: { piety: 2 } },
    ],
  },
  {
    id: 'bt_drunk_archivist', title: 'Three cups past wisdom',
    cond: (p, C) => A.BT.sinceSecret(p) >= 8 && C.adult(p) && C.town(p), w: 0.4, cool: 20, setup: sec,
    text: 'In the tavern a temple archivist, three cups past wisdom, tells the room that {secTitle} did not happen the way the priests say. Nobody is listening. Then he sees that you are.',
    choices: [
      { t: 'Walk him home and ask him plainly', r: 'He talks the whole way, and at his door he weeps for having said it. You remember every word.', fx: learn() },
      { t: 'Buy him another cup and let him run on', r: 'He runs on. Most of it is wind. Some of it is not, and you keep that part.', fx: learn({ coin: -10 }) },
      { t: 'Tell him to hold his tongue before someone hears', r: 'He blinks at you, then nods, and puts his face in his cup.', fx: { honor: 1 } },
    ],
  },
  {
    id: 'bt_bound_letter', title: 'Sewn into the binding',
    cond: (p, C) => A.BT.sinceSecret(p) >= 8 && C.adult(p) && C.literate(p), w: 0.4, cool: 20, setup: sec,
    text: 'You buy a battered psalter at a stall for the silver of its clasps. Sewn inside the back board is a letter, brittle as a dry leaf. It concerns {secTitle}, and it is signed by someone who should have known.',
    choices: [
      { t: 'Read it', r: 'You read it at the table with the shutters closed.', fx: learn() },
      { t: 'Sell it back to the stall-keeper', r: 'He gives you more for it than you paid for the whole book, and does not ask what it says.', fx: { coin: 30 } },
      { t: 'Burn it unread', r: 'It goes up quickly. Some things should stay buried, and you do not want to know which.', fx: { wil: 1 } },
    ],
  },
  {
    id: 'bt_house_elder', title: 'The oldest woman of the house',
    cond: (p, C) => A.BT.sinceSecret(p) >= 8 && C.adult(p) && (C.noble(p) || C.famHead(p)), w: 0.4, cool: 20, setup: sec,
    text: 'At the feast the oldest woman of your house, who has outlived three husbands and a war, beckons you close. "They teach you that {secTitle} went one way," she says. "My grandmother was in the room."',
    choices: [
      { t: 'Hear her out', r: 'She tells it flatly, the way old women tell things they have stopped being angry about.', fx: learn({ family: 1 }) },
      { t: 'Laugh it off as an old tale', r: 'She shrugs and asks for more wine. Nobody will ask her again.', fx: {} },
    ],
  },
  {
    id: 'bt_minstrel_verse', title: 'A verse nobody sings',
    cond: (p, C) => A.BT.sinceSecret(p) >= 8 && C.adult(p), w: 0.4, cool: 20, setup: sec,
    text: 'A minstrel at the fair sings the old song of {secTitle}, but with a verse you have never heard. The crowd mutters. A man in a good coat speaks to him sharply, and he goes back to the usual words.',
    choices: [
      { t: 'Find him afterwards and ask where the verse came from', check: { s: 'persuasion', s2: 'ins', d: 45 },
        win: { r: 'He makes you buy his supper first. Then he tells you who taught it to him, and what it means.', fx: learn() },
        lose: { r: 'He says he made it up, and will not look at you while he says it.', fx: {} } },
      { t: 'Find the man in the good coat instead', check: { s: 'ins', s2: 'wil', d: 50 },
        win: { r: 'You follow him to a house with a temple seal on the door. That tells you nearly as much as the verse did.', fx: learn({ flag: 'bt_followed_coat' }) },
        lose: { r: 'He turns in the crowd and looks straight at you. You buy apples, and go home.', fx: { happy: -2 } } },
      { t: 'Let it go', r: 'The song ends the way it always ends.', fx: { happy: 1 } },
    ],
  },
  {
    id: 'bt_report_desk', title: 'A report that should not exist',
    cond: (p, C) => A.BT.sinceSecret(p) >= 8 && C.adult(p) && (C.job(p, 'spy') || C.job(p, 'scribe') || C.job(p, 'courtier') || C.office(p)), w: 0.4, cool: 20, setup: sec,
    text: 'Among the dispatches is a report filed under the wrong year. It is about {secTitle}. Someone took care to write it plainly, and someone else took care to bury it.',
    choices: [
      { t: 'Read it, then file it where it belongs', r: 'You put it back where it was buried. You know where it is now.', fx: learn({ skill: { intrigue: 1 } }) },
      { t: 'Take a copy home', r: 'It sits under a loose board in your floor. You find yourself checking it.', fx: learn({ flag: 'bt_kept_copy' }) },
      { t: 'Hand it to your superior unread', r: 'Your superior reads the first line and puts it in the fire. You are thanked for your discretion.', fx: { merit: 5 } },
    ],
  },
  {
    id: 'bt_tell_heir', title: 'The question at table',
    cond: (p, C) => C.old(p) && C.hasKids(p) && C.flag(p, 'rl_secret'), w: 1.2, cool: 20, once: true, setup: known,
    text: 'Your eldest asks why you go quiet whenever the priests tell the story of {secTitle}. The others at the table stop eating to hear what you say.',
    choices: [
      { t: 'Tell them the truth, all of it', r: 'Nobody speaks for a while. Then your eldest asks the right question, and you answer that too.', fx: { family: 2, flag: 'bt_told_heir' } },
      { t: 'Tell them the story everyone tells', r: 'They go back to eating. You carry it alone a while longer.', fx: { wil: 1 } },
    ],
  },
  {
    id: 'bt_proof_hunt', title: 'Proof is another matter',
    cond: (p, C) => C.adult(p) && C.flag(p, 'rl_secret') && !C.flag(p, 'bt_sought_proof'), w: 0.8, cool: 10, setup: known,
    text: 'You know the truth of {secTitle}. Knowing is not proving. The proof, if it still exists, is {proof}.',
    choices: [
      { t: 'Go and see it with your own eyes', check: { s: 'int', s2: 'wil', d: 55 },
        win: { r: 'It is there, and it says what you were told. You leave it where it lies, which is the hardest part.', fx: { wil: 1, fame: 1, flag: 'bt_sought_proof' } },
        lose: { r: 'A door that was open last year is locked, and a man you have never seen asks your business. You give him a false name.', fx: { happy: -3, flag: 'bt_sought_proof' } } },
      { t: 'Leave it buried', r: 'Some truths are only safe while nobody can prove them.', fx: { flag: 'bt_sought_proof' } },
    ],
  },
  {
    id: 'bt_tale_wrong', title: 'Not how it goes',
    cond: (p, C) => C.adult(p) && seenBeast(p), w: 1, cool: 8, setup: beast(2),
    text: 'At the fire a carter tells how he once saw a {beast}, and how it did a thing you know it does not do. The others lean in. You have seen one. That is not how it goes.',
    choices: [
      { t: 'Tell them what you saw', check: { s: 'persuasion', s2: 'wil', d: 45 },
        win: { r: 'By the end they are asking you, not him. He takes it well enough, for a carter.', fx: { fame: 1 } },
        lose: { r: 'They laugh. A man who saw one would be dead, the carter says, and the fire agrees with him.', fx: { happy: -2 } } },
      { t: 'Let the carter have his tale', r: 'It is a good tale. It is only not true.', fx: { happy: 1 } },
      { t: 'Add something worse to it', r: 'They believe that part at once. By spring it will be in the song.', fx: { fame: 1, honor: -1 } },
    ],
  },
  {
    id: 'bt_tooth_seller', title: 'A tooth on a cord',
    cond: (p, C) => C.adult(p), w: 0.8, cool: 10, setup: beast(1),
    text: 'A pedlar has a {beast} tooth on a cord. Proof against fever, he says, and against the evil eye, and he has only the one.',
    choices: [
      { t: 'Buy it', r: 'You wear it a while. You do not catch a fever that winter, which proves nothing.', fx: { coin: -20, happy: 2 } },
      { t: 'Look at it closely before you pay', check: { s: 'ins', s2: 'int', d: 45 },
        win: { r: 'It is a cow tooth, filed to a point and stained with tea. He sees you see it, and packs up.', fx: { ins: 1 } },
        lose: { r: 'It looks like a tooth. You pay him and wonder about it for weeks.', fx: { coin: -20 } } },
      { t: 'Walk on', r: 'He is already calling to the next passer-by.' },
    ],
  },
]);
})();
