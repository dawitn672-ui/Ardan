// The far beasts remembered: scenes that read what the scenes of beasts.events.js and the duels left behind. Every flag
// those scenes set is read here (README.md has the table): a beast you let go comes back, a trophy is asked about, a
// child shown the tracks grows into a hunter, the named beasts you killed or saw are told of, and each notable
// creature's scene has its sequel.
(() => {
  const FB = () => A.FB;
  const yrs = (p, f) => (p.flags && typeof p.flags[f] === 'number' ? A.S.year - p.flags[f] : -1);
  // the latest creature behind a family of flags (fb_sp_<id>, fb_k_<id>), that is still near home if asked
  const latest = (p, pre, near) => {
    let best = null, y = -1;
    for (const k in p.flags || {}) if (k.slice(0, pre.length) === pre && p.flags[k] > y) { const id = k.slice(pre.length); if (FB() && FB().byId[id] && (!near || FB().here(p, id))) { best = id; y = p.flags[k]; } }
    return best;
  };
  const one = (p, ctx, id) => (FB() && id ? FB().fill(p, ctx, id) : (ctx.skip = 1, null));
  // the named beast pc killed most lately (A.S.fbNamed)
  const slain = p => { const S = A.S.fbNamed || {}; let k = null, y = -1; for (const key in S) if (S[key].by === p.id && S[key].year > y) { k = key; y = S[key].year; } return k; };

  A.defEvents([
    {
      id: 'fb_mem_spared',
      title: 'Back again',
      cond: (p, C) => C.adult(p) && C.fbFar(p) && C.flag(p, 'fb_spared') && A.S.year - p.flags.fb_spared >= 2,
      w: 3, cool: 5,
      setup: (p, ctx) => { one(p, ctx, latest(p, 'fb_sp_', true)); },
      text: 'You let {fbThe} go, the year the herders still argue about. It is back on the same ground: the same torn ear, or the same way of standing. It looks fatter. So do its tracks.',
      choices: [
        { t: 'This time, kill it', r: 'You go out to finish what you would not start.', fx: { beast: { place: 'the old ground', title: 'Back again' }, unflag: 'fb_spared' } },
        { t: 'Drive it off with fire', check: { s: 'survival', s2: 'wil', d: 46 },
          win: { r: 'It goes, and does not come back.', fx: { skill: { survival: 2 }, unflag: 'fb_spared' } },
          lose: { r: 'It goes, with a calf in its jaws.', fx: { coin: -5, happy: -2, unflag: 'fb_spared' } } },
        { t: 'Let it be, again', fbSpare: true, r: 'The herders call you its keeper now. It is not meant kindly.', fx: { piety: 1, rep: -1 } },
      ],
    },
    {
      id: 'fb_mem_trophy',
      title: 'The trophy',
      cond: (p, C) => C.adult(p) && C.flag(p, 'fb_trophy') && A.S.year - p.flags.fb_trophy >= 3,
      w: 2.5, cool: 8,
      setup: (p, ctx) => { one(p, ctx, latest(p, 'fb_k_')); },
      text: 'A boy of the village stands in your door looking at what you kept of {fbThe}, the year you killed it. He wants to know how it was. He has heard three versions already.',
      choices: [
        { t: 'Tell it as it was', r: 'It is shorter than he hoped, and he remembers all of it.', fx: { happy: 2, need: { purpose: 10 } } },
        { t: 'Tell it bigger', r: 'By the end it was twice the size and you were alone in the dark.', fx: { fame: 1, honor: -1 } },
        { t: 'Give him the trophy', r: 'He carries it home as if it might wake.', fx: { happy: 3, rep: 1, unflag: 'fb_trophy' } },
      ],
    },
    {
      id: 'fb_mem_grown_hunter',
      title: 'The old hunter',
      cond: (p, C) => C.adult(p) && C.age(p) <= 35 && C.fbFar(p) && (C.flag(p, 'fb_tracks') || C.flag(p, 'fb_child_saw')),
      w: 3, once: true,
      setup: (p, ctx) => { const id = FB() && FB().pick(p, 'sight'); one(p, ctx, id); ctx.fbHow = p.flags.fb_child_saw != null ? 'the child who followed the tracks alone and came back' : 'the child your mother showed the tracks to'; },
      text: 'The old hunter stops you on the path. He remembers you: {fbHow}. His knees are gone, he says, and his sons went to the town. He would teach someone the ground, and {fbThe}, before it is too late.',
      choices: [
        { t: 'Learn from him through the winter', r: 'A winter of cold feet and his voice in your ear.', fx: { skill: { survival: 3, tracking: 3 }, coin: -4, need: { purpose: 15 } } },
        { t: 'Learn what you can between work', check: { s: 'survival', s2: 'int', d: 44 },
          win: { r: 'Evenings, mostly. It is enough.', fx: { skill: { survival: 2, tracking: 1 } } },
          lose: { r: 'He gives up on you by spring, kindly.', fx: { happy: -1 } } },
        { t: 'Send him to a younger cousin', r: 'Your cousin learns it. You hear the stories second-hand.', fx: { coin: 2 } },
      ],
    },
    {
      id: 'fb_mem_slain',
      title: 'As it is told at the fire',
      cond: (p, C) => C.flag(p, 'fb_slew') && A.S.year - p.flags.fb_slew >= 4,
      w: 2.5, cool: 10,
      setup: (p, ctx) => { const k = slain(p); if (!k) { ctx.skip = 1; return; } ctx.fbDead = A.FB.nName(k); ctx.fbDeadYear = String(A.S.fbNamed[k].year); },
      text: 'At a stranger\'s fire you hear the tale of how {fbDead} died, in {fbDeadYear}. The teller has the year right and nothing else. In his telling you were seven feet tall and the beast spoke before it died.',
      choices: [
        { t: 'Say nothing, and enjoy it', r: 'You have another cup. The tale gets better.', fx: { happy: 3 } },
        { t: 'Tell them it was you', check: { s: 'persuasion', s2: 'wil', d: 48 },
          win: { r: 'They believe you. Everyone wants to buy you a drink.', fx: { fame: 2, need: { company: 10 } } },
          lose: { r: 'They laugh. Everyone says that.', fx: { happy: -2 } } },
        { t: 'Correct the teller', r: 'He does not thank you. Nobody else does either.', fx: { honor: 1, happy: -1 } },
      ],
    },
    {
      id: 'fb_mem_named_seen',
      title: 'The same one',
      cond: (p, C) => C.adult(p) && C.fbFar(p) && C.flag(p, 'fb_saw_named') && A.S.year - p.flags.fb_saw_named >= 5,
      w: 2, once: true,
      setup: (p, ctx) => { const id = FB() && FB().pick(p, 'named'); one(p, ctx, id); },
      text: 'Years ago, young and stupid, you went to see {fbInd}. Now your own children want to go. The talk is the same: {fbIndNote}.',
      choices: [
        { t: 'Take them yourself, carefully', check: { s: 'survival', s2: 'ins', d: 46 },
          win: { r: 'They see it from far enough. They talk of nothing else for a month.', fx: { happy: 3, family: 2 } },
          lose: { r: 'Nothing to see but rain. They sulk all the way home.', fx: { happy: -1 } } },
        { t: 'Forbid it', r: 'They go anyway, a year later, without you. They come back.', fx: { family: -1 } },
        { t: 'Tell them what you saw instead', r: 'You tell it well. It is not the same.', fx: { family: 1 } },
      ],
    },
    {
      id: 'fb_mem_dragon_count',
      title: 'The count book',
      cond: (p, C) => C.adult(p) && C.flag(p, 'fb_dragon_watch') && A.S.year - p.flags.fb_dragon_watch >= 3,
      w: 2, once: true,
      setup: (p, ctx) => { one(p, ctx, 'CRE-92'); ctx.fbCount = A.FB && A.FB.livingNamed('CRE-92') ? 'The Ash Mother has been seen twice more since.' : 'The Ash Mother is dead; the last line in the book is hers.'; },
      text: 'The monk of the Dragon Watch comes down from the ridge with the count book under his arm. Your name is in it, beside one sighting. {fbCount} The Watch is short of eyes this year.',
      choices: [
        { t: 'Keep the count for a season', r: 'A summer on the ridge with cold tea and the sky.', fx: { piety: 2, skill: { learning: 2 }, coin: -3 } },
        { t: 'Give the monks a goat for the work', r: 'He blesses the goat, and you.', fx: { coin: -4, piety: 1 } },
        { t: 'Send him away', r: 'He goes back up with the book.', fx: { piety: -1 } },
      ],
    },
    {
      id: 'fb_mem_calf',
      title: 'The white calf',
      cond: (p, C) => C.adult(p) && (C.flag(p, 'fb_told_temple') || C.flag(p, 'fb_sold_calf')) && A.S.year - (p.flags.fb_told_temple || p.flags.fb_sold_calf) >= 2,
      w: 2, once: true,
      setup: (p, ctx) => { ctx.fbCalf = p.flags.fb_told_temple != null ? 'The temple got the white calf back. A priest comes to thank you, and to ask who else knew.' : 'The Elephant Lords still have the white calf. One of their men stops you on the road and smiles, and asks if you are still keeping quiet.'; },
      text: '{fbCalf} He waits for your answer.',
      choices: [
        { t: 'Tell him what he wants to hear', r: 'He goes away pleased. That is worth something.', fx: { rep: 2, honor: -1 } },
        { t: 'Tell him the truth', check: { s: 'persuasion', s2: 'wil', d: 50 },
          win: { r: 'He believes you, and remembers that you did not lie.', fx: { honor: 2, rep: 1 } },
          lose: { r: 'He does not believe you. You are watched for a year.', fx: { happy: -3 } } },
        { t: 'Say nothing at all', r: 'He waits a long time, then goes.', fx: { wil: 0.3 } },
      ],
    },
    {
      id: 'fb_mem_masked_widow',
      title: 'The widow of the honey-gatherer',
      cond: (p, C) => C.adult(p) && C.flag(p, 'fb_masked_loss') && A.S.year - p.flags.fb_masked_loss >= 1,
      w: 2.5, once: true,
      setup: (p, ctx) => { ctx.fbHer = A.FB && A.FB.livingNamed('CRE-114') ? 'The Masked One still hunts the channels.' : 'The Masked One is dead now, and it has not brought him back.'; },
      text: 'The widow of the last man in line, the season the tiger took him, has three children and no honey. {fbHer} She does not ask for anything. She just stands at your fence.',
      choices: [
        { t: 'Give her a share of your harvest', r: 'She takes it without a word. Her eldest works for you in the spring.', fx: { coin: -8, honor: 3, happy: 1 } },
        { t: 'Take her eldest into the mangroves next season', r: 'He wears his father\'s mask, and comes out.', fx: { honor: 1, rep: 1, skill: { survival: 1 } } },
        { t: 'Look away', r: 'She stands there until dark.', fx: { honor: -3, happy: -2 } },
      ],
    },
    {
      id: 'fb_mem_toll',
      title: 'The steersman\'s son',
      cond: (p, C) => C.adult(p) && C.flag(p, 'fb_bapa_lau_took') && A.S.year - p.flags.fb_bapa_lau_took >= 2,
      w: 2.5, once: true,
      setup: (p, ctx) => { one(p, ctx, 'CRE-130'); const n = A.FB && A.FB.livingNamed('CRE-130'); if (n) ctx.fbNamed = n.key; ctx.fbStill = A.FB && A.FB.livingNamed('CRE-130') ? 'Bapa Lau still takes his toll.' : 'Bapa Lau is dead, and the boy is angry even at that.'; },
      text: 'The son of the steersman Bapa Lau took, the night you crossed at slack tide, is grown now. He wants to know why there was no goat. {fbStill}',
      choices: [
        { t: 'Pay the toll-goat every year from now', r: 'A goat a year. The boatmen nod to you on the landing.', fx: { coin: -6, piety: 2, honor: 1 } },
        { t: 'Go with him to the mud of the island', req: p => !!(A.FB && A.FB.livingNamed('CRE-130')), r: 'Two of you this time.', fx: { beast: { id: 'CRE-130', place: 'the mud of the toll-island', title: 'Bapa Lau' } } },
        { t: 'Tell him the sea takes whom it takes', r: 'He spits, and goes.', fx: { honor: -2 } },
      ],
    },
    {
      id: 'fb_mem_drum',
      title: 'The drum island\'s king',
      cond: (p, C) => C.adult(p) && (C.flag(p, 'fb_drum_king') || C.flag(p, 'fb_drum_cousin')) && A.S.year - (p.flags.fb_drum_king || p.flags.fb_drum_cousin) >= 2,
      w: 2, once: true,
      setup: (p, ctx) => { ctx.fbDrum = p.flags.fb_drum_cousin != null ? 'The cousin you rowed out with sits on the drum island now. He sends for you.' : 'The old king, whose drum you beat, is dying. His men send for you.'; },
      text: '{fbDrum} At the landing the fishermen look at you the way they look at Kalunge\'s Mother: carefully.',
      choices: [
        { t: 'Go, and take what is offered', r: 'A place at the king\'s fire, and enemies to go with it.', fx: { rulerOp: 5, rep: 3, happy: -1 } },
        { t: 'Go, and ask for nothing', r: 'They remember that too.', fx: { honor: 2, rulerOp: 2 } },
        { t: 'Do not go', r: 'The summons comes once.', fx: { rulerOp: -3 } },
      ],
    },
    {
      id: 'fb_mem_giant',
      title: 'The giant on the ridge',
      cond: (p, C) => C.adult(p) && C.flag(p, 'fb_giant_nod') && A.S.year - p.flags.fb_giant_nod >= 2,
      w: 2, once: true,
      setup: (p, ctx) => { one(p, ctx, 'CRE-165'); },
      text: 'The giant of Fjorund who waved you away from the mammoth calves is on the ridge again, and this time he waves you up. A young one is mired in a thaw-bog below. He cannot go down. You can.',
      choices: [
        { t: 'Go down with a rope', check: { s: 'sta', s2: 'wil', d: 50 },
          win: { r: 'Mud to the chest, a rope, the herd bellowing. It comes out.', fx: { fame: 2, flag: 'fb_giant_friend' } },
          lose: { r: 'It comes out. You nearly do not.', fx: { health: -10, fame: 1 } } },
        { t: 'Fetch more people', r: 'By the time they come the calf is dead. The giant says nothing.', fx: { happy: -2 } },
        { t: 'Keep walking', r: 'He watches you go.', fx: { honor: -2 } },
      ],
    },
    {
      id: 'fb_mem_giant_friend',
      title: 'A gift from Fjorund',
      cond: (p, C) => C.adult(p) && C.flag(p, 'fb_giant_friend') && A.S.year - p.flags.fb_giant_friend >= 1,
      w: 2, once: true,
      text: 'A giant\'s boy, taller than your door, leaves a length of mammoth ivory on your step, from a beast that died of age. He says nothing. The traders say it is worth a year\'s work.',
      choices: [
        { t: 'Sell it to the traders', r: 'A year\'s work, in coin.', fx: { coin: 30 } },
        { t: 'Keep it in the house', r: 'Your grandchildren will fight over it.', fx: { happy: 3, fame: 1 } },
      ],
    },
    {
      id: 'fb_mem_smoke_wing',
      title: 'Tegur\'s rider',
      cond: (p, C) => C.adult(p) && C.flag(p, 'fb_smoke_wing') && A.S.year - p.flags.fb_smoke_wing >= 1,
      w: 2, once: true,
      text: 'A rider of Tegur\'s camp comes with a horse on a lead rein: a gift for the one who brought Smoke-Wing back. The eagle came home, he says, and so the omen did not. His khan would like to see you at the next great camp.',
      choices: [
        { t: 'Take the horse and go to the camp', r: 'A long ride, a feast, and a khan who knows your face.', fx: { rulerOp: 4, fame: 1, coin: 10 } },
        { t: 'Take the horse, and stay home', r: 'A very good horse.', fx: { coin: 15 } },
        { t: 'Send the horse back with thanks', r: 'The rider looks at you as if you were mad, and goes.', fx: { honor: 2 } },
      ],
    },
    {
      id: 'fb_mem_salamander',
      title: 'The pool under the Gorge Chain',
      cond: (p, C) => C.flag(p, 'fb_sold_salamander') && A.S.year - p.flags.fb_sold_salamander >= 2,
      w: 2, once: true,
      text: 'The deep pool under the Gorge Chain has been empty since you carried the Old Man of Three Steps down to the temple. This spring the stream ran foul, and the old women say why. They do not say it to your face.',
      choices: [
        { t: 'Give the temple silver to the stream shrine', r: 'The priest takes it. The stream clears in summer, as it would have.', fx: { coin: -12, rep: 2, piety: 1 } },
        { t: 'Tell them streams run foul in spring', check: { s: 'persuasion', s2: 'int', d: 52 },
          win: { r: 'Some of them listen.', fx: { rep: 1 } },
          lose: { r: 'None of them do.', fx: { rep: -2 } } },
        { t: 'Let them talk', r: 'They talk for years.', fx: { rep: -1, wil: 0.3 } },
      ],
    },
    {
      id: 'fb_mem_steersman',
      title: 'Called to the queen\'s gate',
      cond: (p, C) => C.adult(p) && C.flag(p, 'fb_steersman_saved') && A.S.year - p.flags.fb_steersman_saved >= 1,
      w: 2, once: true,
      text: 'The keepers of the Old Steersman send for you: the queen herself wants to see the one who made him eat. You are given a clean robe and told not to look at her feet, or her face, or the tortoise.',
      choices: [
        { t: 'Go, and keep your eyes down', r: 'She asks three questions about figs. You answer all three.', fx: { rulerOp: 4, rep: 3 } },
        { t: 'Go, and ask to tend him for good', check: { s: 'persuasion', s2: 'husbandry', d: 50 },
          win: { r: 'You are made one of his keepers, with a keeper\'s rice.', fx: { coin: 12, rep: 4, flag: 'fb_keeper' } },
          lose: { r: 'The keepers close ranks. You are thanked, and sent home.', fx: { rulerOp: 1 } } },
        { t: 'Plead sickness and stay home', r: 'The queen is told. She is not used to it.', fx: { rulerOp: -3 } },
      ],
    },
    {
      id: 'fb_mem_keeper',
      title: 'The keeper\'s year',
      cond: (p, C) => C.adult(p) && C.flag(p, 'fb_keeper') && A.S.year - p.flags.fb_keeper >= 3,
      w: 1.5, once: true,
      text: 'Three years a keeper of the Old Steersman. He knows your step now, or seems to. The other keepers want you to swear he is seven hundred years old for the pilgrims. You have read the old tallies.',
      choices: [
        { t: 'Swear it for the pilgrims', r: 'The offerings are good this year.', fx: { coin: 10, honor: -2 } },
        { t: 'Tell the pilgrims what the tallies say', r: 'A hundred and fifty years is still a long time, you tell them. They are disappointed.', fx: { honor: 2, coin: -2 } },
      ],
    },
  ]);
})();
