// Playable sieges: the monthly choice outside the walls (sg_camp) and inside them (sg_walls), and the end of it
// (sg_taken, sg_sacked, sg_terms). Queued by sieges.core.js with ctx.loc; fx.siege moves the siege by a share of it.
(function () {
const SG = () => A.SIEGE;
const at = (p, ctx) => { const P = SG().fromCtx(ctx); if (!P) { ctx.skip = true; return null; } Object.assign(ctx, SG().state(P)); return P; };
const live = (p, ctx) => { const P = at(p, ctx); if (P && !P.sgBy) ctx.skip = true; };

A.defEvents([
  { id: 'sg_camp', title: 'The siege of {place}', trigger: true,
    cond: (p, C) => C.soldier(p) || !!p.mil, setup: live,
    text: 'Day {days} of the siege of {place}. The walls are {walls}. Inside, the deserters say, food is {food}. Sickness in the camp: {sick}.',
    choices: [
      { t: 'Volunteer for the mines under the wall', check: { s: 'siegecraft', s2: 'sta', d: 50 },
        win: { r: 'Three nights of digging by candle, and a gallery under the tower. When the props burn, a corner of the wall goes with them.', fx: { siege: 0.2, merit: 6, skill: { siegecraft: 2 } } },
        lose: { r: 'The gallery falls in on the second night. They dig you out by the feet.', fx: { siege: 0.03, health: -12 } } },
      { t: 'Go up the ladders with the first wave', check: { s: 'melee', s2: 'wil', d: 55 },
        win: { r: 'You are on the wall walk for a quarter of an hour before they throw you back, and the gate tower is ours.', fx: { siege: 0.3, merit: 12, fame: 2 } },
        lose: { r: 'A stone from above, a ladder going over, and the ditch.', fx: { siege: 0.04, health: -20, merit: 2 } } },
      { t: 'Hold the ring and let hunger work', r: 'Nobody gets in or out. It is slow, and the camp grows sicker while it works.', fx: { siege: 0.08, sgSick: 6, wil: 0.5 } },
      { t: 'Dig latrines and bury the dead', r: 'It is filthy work and nobody thanks you for it. Fewer men sicken that month.', fx: { sgSick: -25, merit: 2, happy: -2 } },
    ] },
  { id: 'sg_walls', title: 'Behind the walls of {place}', trigger: true,
    cond: (p, C) => C.teen(p) || C.adult(p), setup: live,
    text: 'Day {days} of the siege. From the walls you can see their fires and hear their carpenters. The bread is {food}; the walls are {walls}.',
    choices: [
      { t: 'Take your share of the rationing, and less', r: 'You eat half of what you are given and give the rest to the children on your street. The town holds a little longer.', fx: { siege: -0.1, happy: -4, health: -3, honor: 1 } },
      { t: 'Go out with the night sortie', check: { s: 'stealth', s2: 'melee', d: 55 },
        win: { r: 'You burn a siege tower and two wagons of their fodder, and are back inside before the alarm.', fx: { siege: -0.2, fame: 2 } },
        lose: { r: 'They are waiting. You come back over the wall on a rope, bleeding.', fx: { health: -18, siege: -0.03 } } },
      { t: 'Buy smuggled flour, whatever it costs', r: 'A sack of flour through a drain, for a price that would have bought a cow last spring.', fx: { coin: -25, health: 3, happy: 2 } },
      { t: 'Speak in the square for terms', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'The council listens. A man goes out under a white cloth. If the town falls now, it falls on terms, not by storm.', fx: { siege: 0.3, sgTerms: 1, honor: -1 } },
        lose: { r: 'They call you a coward to your face, and someone writes it on your door.', fx: { honor: -1, happy: -3 } } },
    ] },
  { id: 'sg_taken', title: '{place} is taken', trigger: true,
    cond: (p, C) => C.soldier(p) || !!p.mil, setup: at,
    text: 'The gates of {place} stand open. The captains have stopped giving orders, and the men are looking at one another to see what kind of soldiers they are.',
    choices: [
      { t: 'Take your share of the sack', r: 'Silver candlesticks, a good cloak, a purse from a dead man. You do not look at the faces.', fx: { coin: 40, honor: -3 } },
      { t: 'Stand guard at the temple door', r: 'The people inside are mostly women and old men. Nobody gets past you. Some of your own company will not speak to you for a week.', fx: { honor: 3, piety: 2 } },
      { t: 'Go back to the camp and tend the sick', r: 'The fever does not stop for a victory. You carry water until dark.', fx: { honor: 1, happy: 2, skill: { medicine: 1 } } },
    ] },
  { id: 'sg_sacked', title: 'They come over the walls', trigger: true,
    cond: (p, C) => C.teen(p) || C.adult(p), setup: at,
    text: 'They come over the walls of {place} at dawn, the way everyone said they would. By the time the bells stop, there are strangers in the street with torches and sacks.',
    choices: [
      { t: 'Hide what you can, and yourself', check: { s: 'stealth', s2: 'ins', d: 45 },
        win: { r: 'Under the floor, behind the chimney, in the well bucket. They take the furniture and leave.', fx: { coin: -10 } },
        lose: { r: 'They find the floorboard. They find you.', fx: { coin: -40, health: -6 } } },
      { t: 'Stand in your doorway and stare them down', check: { s: 'intimidation', s2: 'wil', d: 55 },
        win: { r: 'Three of them look at you, and at the axe, and go to the next house.', fx: { honor: 2, fame: 1 } },
        lose: { r: 'They are drunk, and there are five of them.', fx: { health: -15, coin: -30 } } },
      { t: 'Run for the river gate', r: 'You leave everything but your life, and keep that.', fx: { coin: -20, happy: -4 } },
    ] },
  { id: 'sg_terms', title: 'The gates open on terms', trigger: true,
    cond: (p, C) => C.teen(p) || C.adult(p), setup: at,
    text: 'The gates of {place} open on terms you helped to make. They march in by companies, under orders, and the worst that happens on your street is a broken window.',
    choices: [
      { t: 'Watch them come in from your doorway', r: 'Some of your neighbours spit when you pass now. Their houses are still standing.', fx: { wil: 1, happy: -1 } },
      { t: 'Hold their captain to the terms at the town hall', check: { s: 'persuasion', s2: 'wil', d: 50 },
        win: { r: 'He reads the paper twice and hangs one of his own men for theft. The town remembers that.', fx: { honor: 2, fame: 1 } },
        lose: { r: 'He tears the paper in half and asks your name. You give him a false one.', fx: { happy: -3 } } },
    ] },
]);
})();
