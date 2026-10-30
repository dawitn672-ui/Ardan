// Memory callbacks for the southern and steppe realms (chunk "regional-a").
//
// Each event reads a flag that an older event sets and nothing used to read: the yam token, the Arrow Field,
// the fire-oil road, the Horde rider's knife, the pilots of Miruma, the copper on the Sabun Pass, the horn cup,
// the temple roll of Tamar, the Granary Mice, the Ibis Archers, Faruq the Lamp, Zayd Blackveil, the Marad boy,
// the emperor's hand, the Night of Masks, the House of Runners, the Atani letter, the Night Swimmers, the
// auger holes at Monuro, the Wet Hands, the prince who hears storms, Desta the Pedlar and the Monundi horsemen.
//
// Rules kept here: every cond reads the flag with C.flag(p, "x") AND times it with A.S.year - p.flags.x >= N;
// every event keeps the setter's realm; every event has a branch that leaves a lasting mark; flags set here
// (all prefixed mra_) are read again by a second event years later (the two-step arcs listed in README.md).
(() => {
  const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
    "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  // years since a flag was set (0 when it is missing, so text never shows NaN)
  const yrs = (p, f) => { const y = p && p.flags ? p.flags[f] : null; return typeof y === "number" ? Math.max(0, A.S.year - y) : 0; };
  const count = (n, unit) => { n = Math.max(1, Math.round(n) || 1); return (NUM[n] || String(n)) + " " + unit + (n === 1 ? "" : "s"); };
  const ago = (p, f) => count(yrs(p, f), "year");

  // A named figure from the lore, brought into the world once (A.S.castMap keeps each one unique).
  const cast = (p, ctx, cid, needAlive = true) => {
    let q = null;
    try { q = A.personFromCast(cid); } catch (e) { q = null; }
    if (!q || q.id === p.id || (needAlive && !q.alive)) return null;
    ctx.pid = q.id;
    return q;
  };
  // Someone the engine already linked to the player (a relation of one of these types).
  const linked = (p, ctx, types, ok) => {
    const x = A.relsOf(p, types).find(r => r.p.alive && r.p.id !== p.id && (!ok || ok(r.p, r.r)));
    if (!x) return null;
    ctx.pid = x.p.id;
    return x;
  };
  // Someone new, made to fit the story. age is in human years and is scaled to the race.
  const make = (p, ctx, o = {}) => {
    const race = o.race || p.race, realm = p.realm, sex = o.sex || (A.chance(0.5) ? "M" : "F"), st = o.status || "peasant";
    const same = race === p.race, cult = same ? p.cult : A.cultureFor(race, realm), faith = same ? p.faith : A.faithFor(race, realm);
    const hAge = o.age != null ? o.age : A.age(p) * 16 / GD.RACES[p.race].adult;
    const age = Math.max(1, Math.round(hAge * GD.RACES[race].adult / 16));
    const q = A.newPerson({ given: A.givenName(cult, sex), sex, race, realm, cult, faith, born: A.S.year - age, status: st, home: p.home });
    const fn = A.familyName({ cult, realm, status: st, home: p.home, sex });
    if (fn) { q.sur = fn.sur; q.surMode = fn.mode; }
    q.occ = o.occ || (A.isAdult(q) ? A.pick(A.OCC[st] || A.OCC.peasant) : "");
    ctx.pid = q.id;
    return q;
  };
  // The player's uncle, if the engine knows one: a brother of either parent.
  const uncleOf = p => {
    for (const id of p.parents || []) {
      const par = A.P(id);
      if (!par) continue;
      for (const sid of Object.keys(par.rel || {})) {
        if (par.rel[sid].type !== "sibling") continue;
        const s = A.P(sid);
        if (s && s.alive && s.sex === "M" && s.id !== p.id) return s;
      }
    }
    return null;
  };
  const more = (p, ctx, fx) => A.applyFx(p, fx, ctx);
  // Story-cycle insurance for the arcs: the choice that opens an arc also books its reckoning a few years out,
  // in case the dice do not bring it sooner. When it falls due, A.stillValid re-checks the event's cond, and the
  // event's setup drops it if the player has already seen it (fresh), so it never fires twice or out of place.
  const later = (ev, years) => A.schedule({ type: "event", ev }, Math.round((years + A.rf(0, 2)) * 365));
  const fresh = (p, id) => !(p.flags.ev && p.flags.ev[id] != null);
  const say = (...parts) => parts.filter(Boolean).join(" ");
  // Tie the player to a lore figure (cast id) or to someone made for the story, and report it the engine's way.
  const bond = (p, who, type, op) => {
    let q = null;
    if (typeof who === "string") { try { q = A.personFromCast(who); } catch (e) { q = null; } }
    else q = make(p, {}, who);
    if (!q || !q.alive || q.id === p.id) return "";
    A.applyFx(p, { them: { type, op } }, { pid: q.id });
    return `(${A.fullName(q)} ${type === "enemy" ? "is your enemy now" : "becomes your " + type})`;
  };
  const addDebt = (p, n) => { p.debt = Math.max(0, Math.round((p.debt || 0) + n)); };

  A.defEvents([
    // ------------------------------------------------------------------ Nine Winds (POL-12)

    // ss_nw_yam: won the Yam Keepers' token on the 150-kilometer stage to Kharsa
    {
      id: "mra_nw_yam_relay",
      title: "A dead horse at the gate",
      cond: (p, C) => C.realm(p, "POL-12") && C.adult(p) && !C.old(p) && C.male(p) && C.flag(p, "ss_nw_yam") && A.S.year - p.flags.ss_nw_yam >= 3 && A.S.year - p.flags.ss_nw_yam <= 20,
      w: 3, once: true,
      text: p => `${cap(ago(p, "ss_nw_yam"))} ago you rode the 150-kilometer stage to Kharsa and took the Yam Keepers' token. Tonight a courier's horse drops dead at the gate of your station. The pouch is knotted with Red Wind cord and must reach Kharsa by dawn. Yam law says the word rides on. A rider in Serik's colors waits by the trough with silver. He wants the pouch one day late.`,
      choices: [
        { t: "Ride the night stage yourself", check: { s: "riding", s2: "sta", d: 48 },
          win: { r: "You change horses twice in the dark and hand the pouch over at Kharsa as the gate opens. The Head of the Yam Keepers writes your name in the tally.",
            fx: { fame: 2, honor: 3, skill: { riding: 3 }, deed: "Rode the Kharsa night stage with a Red Wind pouch" } },
          lose: { r: "Your second horse puts a foot in a marmot hole. You walk the last stage leading it, and the pouch reaches Kharsa at noon.",
            fx: { wound: "bad_knee", health: -6, honor: 1, cause: "a fall on the night stage" } } },
        { t: "Take the silver and hold the pouch a day",
          r: "The silver is good. The pouch goes on a day late, with a story about a dead horse that happens to be true.",
          fx: (p, ctx) => { later("mra_nw_yam_tally", 6); return more(p, ctx, { coin: 45, honor: -5, flag: "mra_nw_yamsold" }); } },
        { t: "Untie the cords and read them first", check: { s: "intrigue", s2: "int", d: 50 },
          win: { r: "Red Wind cords, knotted in the old count. You learn which tribes Yesun has bought for the Horse Feast, then tie every knot back as it was.",
            fx: { skill: { intrigue: 3 }, secret: 1, int: 0.3 } },
          lose: { r: "A knot slips and the pattern is gone. You tie it back as best you can and send it on. Someone at Kharsa counts knots for a living.",
            fx: (p, ctx) => { later("mra_nw_yam_tally", 6); return more(p, ctx, { flag: "mra_nw_yamknot", wil: 1 }); } } },
      ],
    },
    // arc: mra_nw_yamsold / mra_nw_yamknot -> the Yam Keepers find the red knot
    {
      id: "mra_nw_yam_tally",
      title: "The red knot",
      cond: (p, C) => C.realm(p, "POL-12") && C.adult(p) && (C.flag(p, "mra_nw_yamsold") || C.flag(p, "mra_nw_yamknot")) && A.S.year - (p.flags.mra_nw_yamsold || p.flags.mra_nw_yamknot) >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_nw_yam_tally")) { ctx.skip = 1; return; } make(p, ctx, { sex: "M", age: 58, occ: "Head of the Yam Keepers" }); },
      text: p => `{themFull}, Head of the Yam Keepers, rides in from Kharsa with his silver tablet on its blue cord. He lays a tally cord on your table. One knot is dyed red: the Red Wind pouch that left your station ${p.flags.mra_nw_yamsold ? "a day late" : "with its knots tied by a second hand"}. "The Word Arrives," he says. "That is our whole law. Tell me what happened to this word."`,
      choices: [
        { t: "Tell him the truth and give back the token",
          r: "{them} takes the token and thanks you for the truth, which is not the same as forgiving. Your name comes off the yam rolls.",
          fx: { unflag: "ss_nw_yam", honor: 4, happy: -6, them: { op: 10 } } },
        { t: "Blame the dark and the dead horse", check: { s: "deception", s2: "wil", d: 50 },
          win: { r: "He has seen a thousand dead horses. He decides to believe in one more. The red knot stays on his cord, and the token stays on you.",
            fx: { skill: { deception: 2 }, honor: -2, them: { op: -5 } } },
          lose: { r: p => p.flags.mra_nw_yamsold ? "\"A dead horse does not wait a day,\" he says, and cuts your token from its cord with his own knife." : "\"A dead horse does not untie knots,\" he says, and cuts your token from its cord with his own knife.",
            fx: { unflag: "ss_nw_yam", honor: -6, them: { type: "enemy", op: -30 } } } },
        { t: "Name Serik's rider and ask the Keepers for shelter", req: p => !!p.flags.mra_nw_yamsold,
          r: "He writes the name down without looking up. \"The Keepers are neutral,\" he says. \"You are not, now.\" Within the month Serik's people know what you said.",
          fx: { honor: 1, them: { op: 15 }, newRel: { type: "enemy", op: -30 } } },
        { t: "Tell him what the cords said, and offer to keep listening", req: p => !!p.flags.mra_nw_yamknot,
          r: "He hears every name. Then he keeps your token, your secret and your offer. The Yam Keepers have an ear in your station now, and you owe them.",
          fx: { them: { op: 20 }, oweThem: 1, secret: 1, honor: -2 } },
      ],
    },
    {
      id: "mra_nw_yam_old",
      title: "The last stage",
      cond: (p, C) => C.realm(p, "POL-12") && C.old(p) && C.male(p) && C.flag(p, "ss_nw_yam") && A.S.year - p.flags.ss_nw_yam >= 15,
      w: 2, once: true,
      setup: (p, ctx) => { make(p, ctx, { sex: "M", age: 15, occ: "a herder's son" }); },
      text: "The Yam Keepers' token you won on the Kharsa stage is worn smooth now. A boy of your camp, {them}, has entered the yam trials and cannot keep a horse fresh past the second station. His father asks you to train him. The trials are in a month: 150 kilometers before dark, the stage you rode. Your knees are not what they were.",
      choices: [
        { t: "Ride the stage at his stirrup, calling the pace", check: { s: "riding", s2: "sta", d: 50 },
          win: { r: "You ride the whole stage beside him. He reaches Kharsa before dark, and the Keepers give him a token and you a cup of mare's milk.",
            fx: { fame: 2, happy: 6, them: { type: "student", op: 35 } } },
          lose: { r: "You keep the pace for three stations. At the fourth they lift you out of the saddle. {them} finishes without you, just.",
            fx: { health: -10, wound: "back", cause: "the yam trials, at your age", them: { type: "student", op: 25 } } } },
        { t: "Teach him from the ground, and stay home",
          r: "A month of mornings on the grass: when to trot, when to walk, when to change horses. He fails by an hour and swears to try again.",
          fx: { skill: { husbandry: 1 }, wil: 0.5, them: { type: "student", op: 20 } } },
        { t: "Give him your own token to wear on the run",
          r: "He rides with your token at his throat and touches Kharsa at dusk. He does not give it back, and you do not ask for it.",
          fx: { unflag: "ss_nw_yam", honor: 3, happy: 4, them: { type: "student", op: 40 } } },
      ],
    },

    // ss_nw_arrowfield: Dorin Swiftarrow took you on at the Kharsa Arrow Field after your backward shot
    {
      id: "mra_nw_dorin_feast",
      title: "The Horse Feast",
      cond: (p, C) => C.realm(p, "POL-12") && C.adult(p) && !C.old(p) && C.flag(p, "ss_nw_arrowfield") && A.S.year - p.flags.ss_nw_arrowfield >= 3 && A.S.year - p.flags.ss_nw_arrowfield <= 20,
      w: 3, once: true,
      setup: (p, ctx) => { if (!cast(p, ctx, "CHR-0316")) ctx.skip = 1; },
      text: "Midsummer at Kharsa, and the mounted archery at the Horse Feast. {themFull} took you on at the Arrow Field the day you loosed your first backward shot. He has won here four years running. This year you have beaten him in practice, and every rider on the field knows it. Before the last pass he rides up beside you. \"Shoot your best,\" he says. His voice says something else.",
      choices: [
        { t: "Shoot your best and beat him", check: { s: "mounted", s2: "bow", d: 54 },
          win: { r: "Three arrows into the straw rider at the gallop, the last one backward. The crowd shouts your name. {them} congratulates you before the khan, then leaves the feast before the meat.",
            fx: (p, ctx) => { later("mra_nw_dorin_staff", 8); return more(p, ctx, { fame: 4, skill: { mounted: 2, bow: 2 }, flag: "mra_nw_beatdorin", them: { op: -15 } }); } },
          lose: { r: "Two clean passes, then your third arrow goes into the grass. {them} wins again. He does not mention it, which is worse.",
            fx: { fame: 1, happy: -3, them: { op: 5 } } } },
        { t: "Pull the last arrow wide and let him win",
          r: "Your arrow goes into the grass. {them} wins and knows exactly why. Afterwards he pours you kumis and talks only of horses, and his door is open to you.",
          fx: { them: { type: "mentor", op: 30 }, honor: -1, happy: -2 } },
      ],
    },
    // arc: mra_nw_beatdorin -> the Arrow Field needs a master
    {
      id: "mra_nw_dorin_staff",
      title: "Master of the Arrow Field",
      cond: (p, C) => C.realm(p, "POL-12") && C.adult(p) && C.flag(p, "mra_nw_beatdorin") && A.S.year - p.flags.mra_nw_beatdorin >= 4,
      w: 3, once: true,
      setup: (p, ctx) => { const q = fresh(p, "mra_nw_dorin_staff") && cast(p, ctx, "CHR-0316", false); if (!q) ctx.skip = 1; else ctx.dead = q.alive ? "" : "1"; },
      text: (p, ctx) => (ctx.dead
        ? "{themFull} is dead, and the Kharsa Arrow Field has no master."
        : "{themFull} has given up the Arrow Field. His eyes are going, he says, though he still shoots better than most.")
        + " Since the Horse Feast when you beat him, the riders have watched you. The Swift Arrows must choose a new master, and they are saying your name. The khan's men want a master who sends archers when asked and asks nothing back.",
      choices: [
        { t: "Take the Arrow Field, and the khan's leash with it",
          r: "You are Master of the Kharsa Arrow Field. Every spring the hundred-leaders come for archers, and you send them. Most come back.",
          fx: { job: "teacher", deed: "Became Master of the Kharsa Arrow Field", fame: 4, favor: 3 } },
        { t: "Name the quiet archer from the Grey Wind instead",
          r: "She trained beside you and hit all three the first day. Some riders grumble that no woman has held the field since Saran's day. She holds it anyway, and sends you her worst students to break.",
          fx: (p, ctx) => say(more(p, ctx, { honor: 4, happy: 2 }), bond(p, { sex: "F", age: 34, occ: "Master of the Kharsa Arrow Field" }, "friend", 30)) },
        { t: "Refuse it. Your arrows stay your own",
          r: "The field goes to a Red Wind man who does what the khan says. You keep your herd, your freedom and your bow.",
          fx: { trait: "stubborn", happy: 2 } },
      ],
    },

    // ss_nw_oilroad: rode the Bekar camels west with the sealed fire-oil jars, for sixty suns
    {
      id: "mra_nw_oil_hunt",
      title: "The camel master's list",
      cond: (p, C) => C.realm(p, "POL-12") && C.adult(p) && C.flag(p, "ss_nw_oilroad") && A.S.year - p.flags.ss_nw_oilroad >= 2 && A.S.year - p.flags.ss_nw_oilroad <= 15,
      w: 3, once: true,
      text: "Serik's riders are going camp to camp with a list. They want every man who rode the Bekar camels west to Morhaven with the sealed jars. You took sixty suns for forty days and kept your mouth shut. The camel master is already at the Silver Tablet camp, in chains. Tonight one of Serik's riders sits down at your fire and asks, pleasantly, where you were that summer.",
      choices: [
        { t: "Lie. You were with the herd all summer", check: { s: "deception", s2: "wil", d: 48 },
          win: { r: "He drinks your tea, writes nothing down and rides on. For a month you wake at every hoofbeat.",
            fx: { skill: { deception: 2 }, wil: 1, trait: "paranoid" } },
          lose: { r: "He has your name from the camel master already. You are taken to the Silver Tablet camp and flogged before the tents.",
            fx: { health: -14, wound: "back", honor: -4, cause: "a flogging at the Silver Tablet camp" } } },
        { t: "Confess, and name the Morhaven buyers",
          r: "You give him the border inn, the faces, the word they used at the door. Serik's man is pleased. The Morhaven buyers, you hear later, are not.",
          fx: { favor: 4, honor: 1, newRel: { type: "enemy", op: -25 } } },
        { t: "Ride out tonight for the far pastures", check: { s: "survival", s2: "riding", d: 44 },
          win: { r: "A season on the far grass with a few sheep and no fires. By autumn Serik's riders are working on other lists.",
            fx: { skill: { survival: 3 }, coin: -20, happy: -4 } },
          lose: { r: "They track your horse to the salt pan and bring you back roped. Running counts against you.",
            fx: { punish: "smuggling" } } },
      ],
    },
    {
      id: "mra_nw_oil_smoke",
      title: "What the jars were for",
      cond: (p, C) => C.realm(p, "POL-12") && C.adult(p) && C.flag(p, "ss_nw_oilroad") && A.S.year - p.flags.ss_nw_oilroad >= 5,
      w: 2, once: true,
      text: "A wool trader back from the west tells it at the horse market in Kharsa. A harbor burned in the Tessarian war, he says, and water only spread it. Fire-oil, in sealed jars packed in felt and straw. You remember the felt. You remember forty days of nervous camels on the Morhaven road, and sixty suns long spent.",
      choices: [
        { t: "Give sixty suns to the shamans for the dead", req: p => p.coin >= 60,
          r: "The shamans burn juniper for strangers in a city you never saw. It buys nothing back. You did not expect it to.",
          fx: { coin: -60, piety: 4, honor: 3 } },
        { t: "Tell the trader you carried those jars",
          r: "He goes quiet, then tells the whole market by evening. Some men stop drinking with you. Others ask what it paid.",
          fx: { fame: 2, honor: -2, trait: "honest" } },
        { t: "Say nothing. A rider carries what he is paid to",
          r: "You ride home and see to the horses. The story goes round the market and moves on without your name.",
          fx: { trait: "cynical", wil: 1 } },
      ],
    },

    // ss_nw_hordeknife: bound a wounded Horde rider; he left a bone knife carved with a running horse
    {
      id: "mra_nw_knife_raid",
      title: "The running horse",
      cond: (p, C) => C.realm(p, "POL-12") && C.adult(p) && C.race(p, "orc", "halforc", "human") && C.flag(p, "ss_nw_hordeknife") && A.S.year - p.flags.ss_nw_hordeknife >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        const x = linked(p, ctx, ["friend", "bestfriend"], q => q.race === "orc" && q.sex === "M");
        ctx.rider = x ? x.p.given : "the orc rider";
      },
      text: "Horde riders hit the camp before dawn, thirty of Vrag's men, firing the tents at the far end. You still keep the bone knife carved with a running horse. {rider} gave it to you the morning after you bound his wound at your fire. \"When Vrag's riders come,\" he said, \"show them this.\" The knife is in your hand. Your neighbors' tents are burning.",
      choices: [
        { t: "Hold up the knife and claim the whole camp as kin", check: { s: "intimidation", s2: "persuasion", d: 50 },
          win: { r: "The raiders' leader turns the knife in the firelight and laughs. He takes six horses and rides off. The camp calls it a wonder, then asks how you came by such a knife.",
            fx: (p, ctx) => { later("mra_nw_knife_accused", 6); return more(p, ctx, { deed: "Turned a Horde raid from the camp with a bone knife", fame: 3, honor: 2, flag: "mra_nw_knifeshown" }); } },
          lose: { r: "He takes the knife, snaps it across his knee, and fires your tent first.",
            fx: { health: -10, wound: "burn", coin: -30, unflag: "ss_nw_hordeknife", cause: "a Horde raid" } } },
        { t: "Show it at your own tent, and stay inside",
          r: "The raiders ride past your tent. By morning three of your neighbors' tents are ash, and the whole camp saw which one was spared.",
          fx: (p, ctx) => { later("mra_nw_knife_accused", 6); return more(p, ctx, { honor: -6, happy: -3, flag: "mra_nw_knifeshown" }); } },
        { t: "Throw the knife in the fire and take up a bow", check: { s: "bow", s2: "wil", d: 50 },
          win: { r: "You shoot two raiders from behind a cart, and the rest find easier tents. The bone knife is ash by morning. You find you do not miss it.",
            fx: { skill: { bow: 2 }, honor: 4, fame: 1, unflag: "ss_nw_hordeknife" } },
          lose: { r: "A Horde lance takes you across the ribs before your neighbors drag you clear.",
            fx: { wound: "broken_ribs", health: -16, honor: 3, unflag: "ss_nw_hordeknife", cause: "a Horde lance" } } },
      ],
    },
    // arc: mra_nw_knifeshown -> the hundred-leader asks about the spared tent
    {
      id: "mra_nw_knife_accused",
      title: "The spared tent",
      cond: (p, C) => C.realm(p, "POL-12") && C.adult(p) && C.flag(p, "mra_nw_knifeshown") && A.S.year - p.flags.mra_nw_knifeshown >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_nw_knife_accused")) ctx.skip = 1; },
      text: "The hundred-leader comes with ten riders and a clerk. Since the night of the Horde raid, the camp says you deal with Vrag's men: your tent was spared for a bone knife carved with a running horse. A khan's man who treats with the Horde can lose his herd. The clerk wants to know where the knife came from, and who gave it.",
      choices: [
        { t: "Tell the truth: you bound a wounded man at your fire", check: { s: "persuasion", s2: "wil", d: 46 },
          win: { r: "The hundred-leader's own grandmother, it turns out, said the same thing about guests. He fines you one sheep, for the clerk's sake.",
            fx: { honor: 3, coin: -5, skill: { persuasion: 2 } } },
          lose: { r: "He believes you, and does not care. Guest-right is for kin. A third of your herd goes to the khan.",
            fx: { coinPct: -0.3, honor: 1, happy: -6 } } },
        { t: "Hand the knife to the hundred-leader",
          r: "He holds it up for the camp to see, then slides it into his own belt. At the next raid it will be his tent that is spared.",
          fx: { unflag: "ss_nw_hordeknife", favor: 3, happy: -3 } },
        { t: "Pay the clerk to write it down differently", req: p => p.coin >= 40,
          r: "Forty silver changes the story: a raid beaten off by brave herders, you among them. The clerk will remember the price, if not the story.",
          fx: { coin: -40, honor: -2, secret: 1 } },
      ],
    },

    // ------------------------------------------------------------------ Qadir (POL-17)

    // ss_qd_pilot: Salim the Pilot took you on for seven years after you read the Miruma lights
    {
      id: "mra_qd_pilot_lamps",
      title: "Thirteen lights",
      cond: (p, C) => C.realm(p, "POL-17") && C.adult(p) && !C.old(p) && C.flag(p, "ss_qd_pilot") && A.S.year - p.flags.ss_qd_pilot >= 2 && A.S.year - p.flags.ss_qd_pilot <= 16,
      w: 3, once: true,
      setup: (p, ctx) => { if (!cast(p, ctx, "CHR-0473")) ctx.skip = 1; },
      text: "Fourteen lights on the Miruma coast. {themFull} made you name them the night he took you on. Tonight, on watch, you count thirteen. The lamp on the Mirahi tower is dark, and a boat with no lantern is creeping in over the shoal. The Mirahi are pilots too, and {them}'s rivals in the Brotherhood. A dark lamp breaks the pilot's oath.",
      choices: [
        { t: "Wake {them} and tell him which lamp is dark",
          r: "{them} goes white, then very calm. By noon the Brotherhood has the Mirahi before it, swearing it was a wick. {them} is grateful. The Mirahi know whose watch it was.",
          fx: (p, ctx) => { later("mra_qd_pilot_mirahi", 6); return more(p, ctx, { them: { op: 20 }, flag: "mra_qd_toldsalim" }); } },
        { t: "Row out and see what the boat carries", check: { s: "sea", s2: "stealth", d: 48 },
          win: { r: "Sabran oars and Yasiri boatmen, and no cargo but two men with wax tablets, counting the Sultan's galleys. You row back with a name and no proof.",
            fx: { skill: { sea: 2, stealth: 2 }, secret: 1, int: 0.3 } },
          lose: { r: "They see you. A sling stone takes you over the eye, and you drift until dawn.",
            fx: { wound: "concussion", health: -12, cause: "a sling stone off Miruma" } } },
        { t: "Keep quiet. The Mirahi pay for quiet watches",
          r: "At dawn a Mirahi boy brings a basket of figs with silver under the leaves. You eat the figs and bury the silver.",
          fx: { coin: 40, honor: -5, trait: "greedy" } },
      ],
    },
    // arc: mra_qd_toldsalim -> the Mirahi want a test at the vote
    {
      id: "mra_qd_pilot_mirahi",
      title: "Over the shoal by dark",
      cond: (p, C) => C.realm(p, "POL-17") && C.adult(p) && C.flag(p, "mra_qd_toldsalim") && A.S.year - p.flags.mra_qd_toldsalim >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_qd_pilot_mirahi") || !cast(p, ctx, "CHR-0473")) ctx.skip = 1; },
      text: "The Brotherhood of Pilots meets at Miruma to choose a master, and {them} stands for it. The Mirahi have not forgotten whose watch it was when their lamp went dark. Their eldest says your eyes are bad, and that {them} chose badly in you. He proposes a test: bring a laden galley in over the shoal tonight, no lamps lit. The vote waits on it.",
      choices: [
        { t: "Bring the galley in blind", check: { s: "sea", s2: "ins", d: 52 },
          win: { r: "You smell the shoal, as you did the night {them} first tested you, and bring her in with a hand's breadth to spare. {them} is chosen master. You are his first pilot.",
            fx: { fame: 3, them: { op: 20 }, deed: "Brought a laden galley over the Miruma shoal by dark" } },
          lose: { r: "The keel touches. The galley sits on the shoal till morning, and the Mirahi laugh at the oath. {them} loses the vote by three.",
            fx: { them: { op: -20 }, honor: -2, happy: -6 } } },
        { t: "Ask the Brotherhood to count the dark nights instead", check: { s: "persuasion", s2: "int", d: 46 },
          win: { r: "You make them read the harbor log aloud: eleven dark nights at the Mirahi tower. The Mirahi are put out of the Brotherhood, and {them} is master.",
            fx: { them: { op: 15 }, honor: 3, newRel: { type: "enemy", op: -30 } } },
          lose: { r: "The log has been mended. The Brotherhood thinks you a sore loser, and by evening so does {them}.",
            fx: { them: { op: -10 }, happy: -4 } } },
        { t: "Make your peace with the Mirahi eldest",
          r: "You sit with him and he pours. {them} loses the vote. You keep your place, and a share of something you would rather not look at.",
          fx: { coin: 50, honor: -6, them: { op: -30 } } },
      ],
    },
    {
      id: "mra_qd_pilot_oath",
      title: "The pilot's staff",
      cond: (p, C) => C.realm(p, "POL-17") && C.adult(p) && C.flag(p, "ss_qd_pilot") && A.S.year - p.flags.ss_qd_pilot >= 7,
      w: 2, once: true,
      setup: (p, ctx) => { if (!cast(p, ctx, "CHR-0473")) ctx.skip = 1; },
      text: "Seven years since {themFull} took you out in a small boat and made you name the lights. Your apprenticeship is done. The Brotherhood of Pilots offers you the oath and a pilot's staff: a share of every fee in Miruma, and the duty to take the Sultan's galleys out in war, through any strait, whatever is burning on the far side.",
      choices: [
        { t: "Swear the oath on {them}'s staff",
          r: "You swear before the Brotherhood with your hand on the old staff. The fees are good. The galleys will come when they come, and you will take them out.",
          fx: { deed: "Swore the pilot's oath at Miruma", coin: 30, them: { op: 15 }, skill: { sea: 1 } } },
        { t: "Take a Lucernan merchant's helm instead",
          r: "A Lucernan master pays three times the Brotherhood's fee and asks for no oath. {them} does not come down to the quay to see you off.",
          fx: { coin: 60, job: "sailor", them: { op: -25 }, skill: { trade: 2 } } },
        { t: "Stay {them}'s man, unsworn",
          r: "You keep the lamps with him and steer his boat. He is slower now. He teaches you the things he never wrote down, one a night.",
          fx: { skill: { sea: 3 }, int: 0.4, them: { type: "mentor", op: 25 } } },
      ],
    },

    // ss_qd_qasimi: wrote a dated report of Qasimi copper going down the Sabun Pass to Sabra
    {
      id: "mra_qd_report",
      title: "The sheet from the Sabun Pass",
      cond: (p, C) => C.realm(p, "POL-17") && C.adult(p) && C.flag(p, "ss_qd_qasimi") && A.S.year - p.flags.ss_qd_qasimi >= 2,
      w: 3, once: true,
      text: "You still have it: one sheet, dated, from the night on the Sabun Pass when you counted the mules going down to Sabra and copied the Basim stamp off the ingots. Today two men want it. A Qasimi factor offers a purse of silver. A small, neat man in a grey robe, from the Master of Doors, asks for it politely and offers nothing.",
      choices: [
        { t: "Give it to the man in the grey robe",
          r: "He reads it twice, folds it into his sleeve and thanks you by name. You had not told him your name.",
          fx: (p, ctx) => { later("mra_qd_copper_after", 6); return more(p, ctx, { favor: 4, flag: "mra_qd_gavereport" }); } },
        { t: "Sell it to the Qasimi factor",
          r: "A hundred and twenty silver qadr, counted onto a cloth. The factor burns the sheet in front of you, smiling like a man who has bought more than paper.",
          fx: (p, ctx) => { later("mra_qd_copper_after", 6); return more(p, ctx, { coin: 120, honor: -6, flag: "mra_qd_soldreport" }); } },
        { t: "Copy it, then sell the original", req: (p, C) => C.literate(p), check: { s: "intrigue", s2: "craft", d: 48 },
          win: { r: "The Qasimi burn one sheet. Its twin goes under a floor tile, where it is worth more than either.",
            fx: (p, ctx) => { later("mra_qd_copper_after", 6); return more(p, ctx, { coin: 120, honor: -4, secret: 2, flag: "mra_qd_soldreport" }); } },
          lose: { r: "The factor holds your sheet to the light and sees the fresh ink. He pays nothing, and takes your name to his master.",
            fx: (p, ctx) => { later("mra_qd_copper_after", 6); return more(p, ctx, { honor: -2, newRel: { type: "enemy", op: -30 }, flag: "mra_qd_soldreport" }); } } },
      ],
    },
    // arc: mra_qd_gavereport / mra_qd_soldreport -> the Emir answers to the Divan
    {
      id: "mra_qd_copper_after",
      title: "Before the Divan",
      cond: (p, C) => C.realm(p, "POL-17") && C.adult(p) && (C.flag(p, "mra_qd_gavereport") || C.flag(p, "mra_qd_soldreport")) && A.S.year - (p.flags.mra_qd_gavereport || p.flags.mra_qd_soldreport) >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_qd_copper_after")) ctx.skip = 1; },
      text: p => p.flags.mra_qd_gavereport
        ? "Idris Qasimi, Emir of Basim, has been called before the Divan to answer for his copper. Your sheet from the Sabun Pass sits in the Master of Doors' file. The Divan wants a living witness who saw the mules. The Qasimi want that witness to have bad eyes, and they have found out where you live."
        : "The Qasimi factor is back. The Emir of Basim paid well for your sheet from the Sabun Pass. Now he is called before the Divan, and he needs a little more: an honest man's oath that the mules you saw that night carried olives.",
      choices: [
        { t: "Swear before the Divan to what you saw", req: p => !!p.flags.mra_qd_gavereport, check: { s: "persuasion", s2: "wil", d: 48 },
          win: { r: "The date, the stamp, the count of mules. The Emir is fined a year of copper and loses the pass. You have a powerful enemy now, and a name at court.",
            fx: { fame: 3, favor: 5, honor: 4, newRel: { type: "enemy", op: -40 } } },
          lose: { r: "Qasimi lawyers make you count the mules three times and get three numbers. The Emir goes home. So do you, more slowly.",
            fx: { honor: -2, favor: -3, newRel: { type: "enemy", op: -30 } } } },
        { t: "Fall ill, and leave Qadira until it is over", req: p => !!p.flags.mra_qd_gavereport,
          r: "A month in a cousin's village with a cough you do not have. The Divan fines the Emir lightly. The Master of Doors writes something beside your name.",
          fx: { favor: -4, coin: -20, trait: "cautious" } },
        { t: "Swear to the olives", req: p => !p.flags.mra_qd_gavereport, check: { s: "deception", s2: "wil", d: 50 },
          win: { r: "You swear it with a straight face. The Emir sends a jar of real olives with silver at the bottom. The Master of Doors sends nothing, which worries you more.",
            fx: { coin: 80, honor: -8, secret: 1 } },
          lose: { r: "The Master of Doors has a second witness, and a copy of your sheet. False witness before the Divan is a prison matter.",
            fx: { honor: -8, prison: 2, why: "false witness before the Divan" } } },
        { t: "Refuse the factor and stay away from the Divan", req: p => !p.flags.mra_qd_gavereport,
          r: "The factor shrugs. The Emir, he says, remembers his friends, and the others too.",
          fx: { honor: 2, newRel: { type: "enemy", op: -20 } } },
      ],
    },
    {
      id: "mra_qd_sabun_again",
      title: "Copper going down",
      cond: (p, C) => C.realm(p, "POL-17") && C.adult(p) && !C.old(p) && C.flag(p, "ss_qd_qasimi") && A.S.year - p.flags.ss_qd_qasimi >= 5,
      w: 2, once: true,
      text: "Night on the Sabun Pass again. Years ago you counted the Qasimi mules here and wrote it all down, with the date and the stamp. Paper changed nothing. Tonight's train is twice as long, and the muleteers carry their crossbows openly. In the West March they say the copper becomes boiling pans in Sabra's fire-oil sheds.",
      choices: [
        { t: "Roll stones down on the lead mules", check: { s: "tactics", s2: "str", d: 50 },
          win: { r: "The lead mules go over the edge with their copper. The rest turn back up the pass. In Basim, someone will be counting losses all month.",
            fx: { honor: 2, merit: 3, deed: "Turned back a Qasimi copper train on the Sabun Pass", newRel: { type: "enemy", op: -30 } } },
          lose: { r: "A crossbow bolt finds you in the dark, and the train goes by while you lie behind a rock.",
            fx: { wound: "arrow_wound", health: -16, wil: 1, cause: "a Qasimi crossbow" } } },
        { t: "Follow the train down to Sabra", check: { s: "stealth", s2: "tracking", d: 50 },
          win: { r: "You follow the copper to a walled yard outside Sabra where pans are hammered day and night. Now you know where it goes, and you have smelled what fills the pans.",
            fx: { secret: 1, skill: { stealth: 2, tracking: 1 }, int: 0.3 } },
          lose: { r: "Sabran guards take you for a Qadiri spy, which is fair.",
            fx: { prison: 2, why: "spying in Sabra" } } },
        { t: "Let it pass. You wrote it down once",
          r: "You let them go by in the dark. Paper did nothing last time. Silence does no worse.",
          fx: { trait: "cynical", wil: 1 } },
      ],
    },

    // ss_qd_horn: told the palace physician the Sultan's "unicorn horn" cup is a fraud
    {
      id: "mra_qd_horn_summons",
      title: "The Sultan's cup",
      cond: (p, C) => C.realm(p, "POL-17") && C.adult(p) && C.flag(p, "ss_qd_horn") && A.S.year - p.flags.ss_qd_horn >= 2,
      w: 3, once: true,
      text: "The palace physician in the good robe finds you again. Since you told him no horn sweats poison and whale tusk is sold as unicorn, he has tested the Sultan's cup himself. It is northern ivory. The Sultan still drinks from it, because it came from the Emperor of Zanara. Someone must tell him. The physician would much rather it were you.",
      choices: [
        { t: "Show the tasters the proof yourself", check: { s: "learning", s2: "etiquette", d: 50 },
          win: { r: "You set a sliver of whale ivory beside the cup and pour arsenic on both. Neither sweats. The tasters go pale. The Sultan sends you a robe and orders you to stay within call.",
            fx: (p, ctx) => { later("mra_qd_horn_cup", 6); return more(p, ctx, { fame: 3, favor: 5, skill: { learning: 2 }, flag: "mra_qd_hornspoke" }); } },
          lose: { r: "You stumble over the words. The Sultan hears only that you call the Emperor's gift a fraud, and you go to a palace cell for it.",
            fx: { favor: -6, prison: 1, why: "insulting the Emperor's gift" } } },
        { t: "Write it out for the physician to deliver", req: (p, C) => C.literate(p),
          r: "He takes your paper with relief. If the Sultan's anger falls, it will fall on the hand that delivers it. A month later the palace has a new physician.",
          fx: { int: 0.3, honor: -3, secret: 1 } },
        { t: "Refuse. A Sultan's cup is a Sultan's business",
          r: "The physician goes away alone. You hear later that the Sultan still drinks from the ivory, and has added a second taster.",
          fx: { trait: "cautious", happy: -1 } },
      ],
    },
    // arc: mra_qd_hornspoke -> the palace wants a new cup chosen
    {
      id: "mra_qd_horn_cup",
      title: "Three cups",
      cond: (p, C) => C.realm(p, "POL-17") && C.adult(p) && C.flag(p, "mra_qd_hornspoke") && A.S.year - p.flags.mra_qd_hornspoke >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_qd_horn_cup")) ctx.skip = 1; },
      text: "Since you poured arsenic on whale ivory before the tasters, the palace calls on you when something must be tested. Now the Sultan wants a new cup. Three merchants offer one: rhinoceros horn from Kesh, a bezoar stone set in gold, and a plain silver bowl. Your word will choose. The Kesh merchant has already sent a gift to your door.",
      choices: [
        { t: "Choose the plain silver bowl",
          r: "Silver darkens at some poisons, and costs little. The Sultan is unimpressed. The tasters, whose lives ride on the cup, bring you dates. You are named to the palace physicians.",
          fx: { honor: 4, skill: { medicine: 2 }, job: "healer", favor: 2 } },
        { t: "Choose the Kesh horn and keep the gift",
          r: "The horn is beautiful and useless. The gift is a bag of pepper worth its weight in silver. If the Sultan is poisoned, it will not be your mistake alone.",
          fx: { coin: 90, honor: -6, trait: "greedy" } },
        { t: "Tell the Sultan that no cup can protect him", check: { s: "persuasion", s2: "learning", d: 52 },
          win: { r: "He laughs, then stops laughing, and doubles his tasters. You are given a seat among his physicians, and a cup of your own that you never use.",
            fx: { job: "healer", favor: 5, fame: 2 } },
          lose: { r: "\"Then what good are you?\" he asks. The palace stops calling on you.",
            fx: { favor: -5, happy: -4, unflag: "mra_qd_hornspoke" } } },
      ],
    },

    // ------------------------------------------------------------------ Tamar (POL-18)

    // unfree === "debt" (with ss_tm_debt): still on the temple roll as a debt-slave
    {
      id: "mra_tm_bond_mark",
      title: "One year off the roll",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && p.flags.unfree === "debt" && C.flag(p, "ss_tm_debt") && A.S.year - p.flags.ss_tm_debt >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { sex: "M", age: 16, occ: "a bondsman of the temple" }); },
      text: p => `${cap(count(yrs(p, "ss_tm_debt"), "flood"))} on the temple roll, by your count. The steward brings a new bondsman to your field: {them}, a boy from the next village, who thinks he will be free after one flood. You know about the broken hoes and the dead oxen. The steward says that if you teach the boy and keep him quiet, a year comes off your own roll.`,
      choices: [
        { t: "Teach him the work and take the year",
          r: "You teach him to cut barley and keep his head down. The steward strikes a year from your roll. The boy thanks you, which is worse.",
          fx: (p, ctx) => { p.flags.ss_tm_debt = (p.flags.ss_tm_debt || A.S.year) - 1; return more(p, ctx, { honor: -4, them: { op: 10 } }); } },
        { t: "Tell the boy about the hoes and the oxen",
          r: "He goes white, then angry, and counts every tool he touches after that. The steward finds a dead ox on your roll that you never saw.",
          fx: (p, ctx) => { p.flags.ss_tm_debt = (p.flags.ss_tm_debt || A.S.year) + 1; return more(p, ctx, { honor: 3, wil: 1, them: { type: "friend", op: 30 } }); } },
        { t: "Show him how to tally floods on a stick",
          r: "You show him the marks on the canal wall and how to cut a notch for each flood. What he does with the stick is his business.",
          fx: { int: 0.3, them: { op: 10 } } },
      ],
    },
    // ss_tm_debt (and free again): a neighbor faces the same lean year
    {
      id: "mra_tm_debt_neighbor",
      title: "Barley against a body",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && !p.flags.unfree && C.flag(p, "ss_tm_debt") && A.S.year - p.flags.ss_tm_debt >= 8,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { occ: "a farmer of the canal plots" }); },
      text: "Another lean flood. Your neighbor {them} comes to your door after dark with an empty granary jar, the way you once went to the temple steward. You put your mark on that roll and counted floods until you were free. Now {theyHe} asks what it was like, and whether you can lend enough barley to reach the Harvest of the Mother.",
      choices: [
        { t: "Lend the barley, at no interest", req: p => p.coin >= 30,
          r: "Thirty suns of barley out of your own jar, in a hungry spring. {them} pays back half at harvest and keeps the rest in mind.",
          fx: { coin: -30, honor: 3, them: { type: "friend", op: 30 }, owed: 1 } },
        { t: "Tell {themHim} the truth about the roll",
          r: "You tell {themHim} about the broken hoes, the dead ox, the seven floods that become nine. {them} digs reeds for bread instead. The family stays free, thin and angry.",
          fx: { them: { op: 10 }, honor: 1, wil: 0.5 } },
        { t: "Take {themHim} to the steward yourself, for a fee",
          r: "The steward pays a copper ring for every name on his roll. {them} eats. You walk home with the ring in your fist.",
          fx: { coin: 8, honor: -8, them: { type: "enemy", op: -30 }, trait: "greedy" } },
      ],
    },

    // runaway: ran for the Delta and a Lucernan cog while still on the temple roll
    {
      id: "mra_tm_runaway_roll",
      title: "The tally-stick",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && C.flag(p, "runaway") && A.S.year - p.flags.runaway >= 3,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { sex: "M", age: 45, occ: "a temple tally-man" }); },
      text: p => `${cap(ago(p, "runaway"))} since the reeds, the Marira boatman and the Lucernan cog out of the Delta. Now you are back, and in a Delta port a temple tally-man named {them} stops you on the quay. Your name is still on the temple roll, he says, marked as runaway. By flood law a runaway owes double. He can forget your face for forty suns, or he can call the harbor guard.`,
      choices: [
        { t: "Pay him the forty suns", req: p => p.coin >= 40,
          r: "{them} bites the silver, smiles and cuts a notch from his stick. You notice that he carries more than one stick.",
          fx: (p, ctx) => { later("mra_tm_runaway_again", 6); return more(p, ctx, { coin: -40, flag: "mra_tm_paidcatcher", them: { type: "acquaint", op: -10 } }); } },
        { t: "Go before the flood-priests and have your name struck", check: { s: "persuasion", s2: "wil", d: 50 },
          win: { r: "You stand before a flood-priest and argue the floods: seven counted, the oxen invented. He strikes the line himself. Your name is off the roll.",
            fx: { unflag: "runaway", honor: 3, happy: 6, wil: 1.5 } },
          lose: { r: "The priest reads the roll, not your face. You are fined double and branded on the hand as a runaway.",
            fx: { wound: "brand", coinPct: -0.5, honor: -4 } } },
        { t: "Push him off the quay and sail at dawn", check: { s: "melee", s2: "spd", d: 46 },
          win: { r: "He goes in with his stick. By the time the boatmen fish him out, your ship is past the Delta mouth. Home will have to wait.",
            fx: { skill: { sea: 2 }, job: "sailor", honor: -2, them: { type: "enemy", op: -40 } } },
          lose: { r: "The harbor guard has you before he is out of the water. Assault, and a runaway's name on the roll.",
            fx: { prison: 2, why: "assaulting a temple tally-man" } } },
      ],
    },
    // arc: mra_tm_paidcatcher -> the tally-man comes back
    {
      id: "mra_tm_runaway_again",
      title: "The second notch",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && C.flag(p, "mra_tm_paidcatcher") && A.S.year - p.flags.mra_tm_paidcatcher >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_tm_runaway_again")) { ctx.skip = 1; return; } if (!linked(p, ctx, null, q => q.occ === "a temple tally-man")) make(p, ctx, { sex: "M", age: 47, occ: "a temple tally-man" }); },
      text: "The tally-man {them} is back, on your own doorstep this time. Forty suns bought one notch, he says, and shows you the stick. It has two. He is cheerful about it. He knows where you live now, and who lives with you.",
      choices: [
        { t: "Pay again, and keep paying", req: p => p.coin >= 40,
          r: "Forty suns now, and the same again at every flood. You keep a jar for him, the way other people keep one for the temple.",
          fx: (p, ctx) => { addDebt(p, 60); return more(p, ctx, { coin: -40, them: { op: 5 } }); } },
        { t: "Go before the flood-priests yourself", check: { s: "persuasion", s2: "wil", d: 50 },
          win: { r: "You argue the floods before a priest: seven counted, the oxen invented. He strikes the line. {them}'s stick is worth nothing now, and he knows it.",
            fx: { unflag: "runaway", happy: 6, honor: 3, them: { op: -20 } } },
          lose: { r: "The priest reads the roll, not your face. You are fined double and branded on the hand.",
            fx: { wound: "brand", coinPct: -0.5, honor: -4 } } },
        { t: "Meet him on the dyke with three friends and cudgels", check: { s: "intimidation", s2: "str", d: 48 },
          win: { r: "Four of you and one of him, on the dyke at dusk. He agrees that his stick was always wrong, and takes the next boat south.",
            fx: { skill: { intimidation: 2 }, honor: -2, unflag: "mra_tm_paidcatcher", them: { type: "enemy", op: -50 } } },
          lose: { r: "He brings the harbor guard to the dyke instead.",
            fx: { prison: 1, why: "threatening a temple officer" } } },
      ],
    },

    // ss_tm_lowfloods: learned that the flood mark on the Stairs was falsified ("three low floods, no king")
    {
      id: "mra_tm_mason",
      title: "The mason's confession",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && C.flag(p, "ss_tm_lowfloods") && A.S.year - p.flags.ss_tm_lowfloods >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!cast(p, ctx, "CHR-0486")) ctx.skip = 1; },
      text: p => `Word has gone round that you ask questions about the flood marks. Now {them}, a frail old mason, sends for you. He is dying in a room by the Flood Stairs. In 1089, he says, he cut the flood mark higher by night, on a priest's order, so a low flood would read as fair and the grain tax would stand. He wants it ${p.literate ? "written down" : "witnessed and written down"} before he dies.`,
      choices: [
        { t: "Have it written and sealed with his mark",
          r: "It takes all afternoon. He signs with his mason's mark, the same one cut on the Stairs. You walk home with a folded sheet that could hang you.",
          fx: (p, ctx) => { later("mra_tm_confession_use", 6); return more(p, ctx, { flag: "mra_tm_confession", secret: 1, honor: 2, them: { op: 20 } }); } },
        { t: "Bring a priest to hear his confession",
          r: "The priest hears him in private and absolves him. The confession goes into the temple vault and stays there. A priest's clerk writes down your name.",
          fx: { piety: 4, favor: 2, them: { op: 10 } } },
        { t: "Refuse. Some lies hold up a kingdom",
          r: "You leave him with his lamp and his lie. At the Hungry Year Stone next New Year, you listen to the names differently.",
          fx: { trait: "cynical", wil: 1 } },
      ],
    },
    // arc: mra_tm_confession -> another low flood, and the sheet under the floor
    {
      id: "mra_tm_confession_use",
      title: "The sheet under the floor",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && C.flag(p, "mra_tm_confession") && A.S.year - p.flags.mra_tm_confession >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_tm_confession_use")) ctx.skip = 1; },
      text: "Another low flood, and the flood-priests read a fair mark on the Stairs and set the grain tax at a tenth. Under your floor is the old mason's confession: the mark cut higher by night in 1089, sealed with his mason's mark. The villages are already thin. One sheet could lower the tax. It could also start a riot, or put you in the river.",
      choices: [
        { t: "Paste it on the Flood Stairs at night", check: { s: "stealth", s2: "wil", d: 50 },
          win: { r: "By morning a crowd is reading it aloud. The priests scrape it off at noon, too late. The tax falls to a twentieth, and the temple wants a name.",
            fx: { fame: 4, honor: 4, realmStab: -3, deed: "Posted the mason's confession on the Flood Stairs", unflag: "mra_tm_confession" } },
          lose: { r: "A temple guard catches you with the paste pot. The sheet is burned. You are not, quite.",
            fx: { prison: 3, why: "sedition on the Flood Stairs", unflag: "mra_tm_confession" } } },
        { t: "Sell it back to the temple", check: { s: "intrigue", s2: "persuasion", d: 46 },
          win: { r: "A priest pays two hundred copper rings and burns it in a brazier. He thanks you warmly. You understand that you are on a list.",
            fx: { coin: 60, honor: -6, favor: 2, unflag: "mra_tm_confession" } },
          lose: { r: "The priest takes the sheet, burns it and pays nothing. \"Grateful,\" he says, \"is what you should be.\"",
            fx: { favor: -3, happy: -4, unflag: "mra_tm_confession" } } },
        { t: "Keep it hidden for a worse year",
          r: "You put it back under the floor. The tax is paid. In the next village, children eat bark bread. The paper waits.",
          fx: { wil: 1, honor: -2, happy: -3 } },
      ],
    },
    {
      id: "mra_tm_lowflood_year",
      title: "Grain at twice the price",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && C.flag(p, "ss_tm_lowfloods") && A.S.year - p.flags.ss_tm_lowfloods >= 4,
      w: 2, once: true,
      text: "Years ago you learned why the Hungry Year came: three low floods, and a mark on the Flood Stairs that said otherwise. Now you are counting again. This is the second low flood in a row, and the mark reads fair. Grain on the Boatmen's Quay has doubled. Whoever buys now will be rich by spring. Whoever cannot will be at the Hungry Year Stone.",
      choices: [
        { t: "Buy all the grain you can, and hold it", req: p => p.coin >= 40,
          r: "You fill every jar you own. By spring a jar of barley buys a goat. You are richer, and your neighbors know exactly how.",
          fx: { coin: 60, honor: -4, trait: "greedy" } },
        { t: "Buy grain and share it out in the village", req: p => p.coin >= 40,
          r: "Your jars go out by the bowl all spring. By summer you are poorer, and the village has buried no children.",
          fx: { coin: -40, honor: 6, fame: 2, trait: "generous", deed: "Fed the village through a low flood" } },
        { t: "Tell the village what the mark hides", check: { s: "persuasion", s2: "int", d: 46 },
          win: { r: "They listen. Families sell a goat and buy grain early, before the price climbs. The temple notices who started it.",
            fx: { honor: 3, favor: -4, fame: 1 } },
          lose: { r: "They laugh. The mark says fair. By spring the laughing has stopped.",
            fx: { happy: -4, wil: 1 } } },
      ],
    },

    // ss_tm_mice: carried stolen granary sacks for the Granary Mice
    {
      id: "mra_tm_mice_count",
      title: "The clerk is talking",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && C.flag(p, "ss_tm_mice") && A.S.year - p.flags.ss_tm_mice >= 2,
      w: 3, once: true,
      text: "Four nights, forty sacks, eight suns: you carried for the Granary Mice and kept a short memory. Now the Granary and Wall Watch has the tally-clerk who brought you in, and he is giving them names to keep his hands. A Mouse comes to your door before dawn. The Mice can put you on a boat to the Delta tonight, if you carry one last load aboard.",
      choices: [
        { t: "Take the boat, and the load", check: { s: "stealth", s2: "str", d: 46 },
          win: { r: "You sit on stolen grain all the way to the Delta. The Mice keep their word. When you come home a year later, the Watch has other names.",
            fx: { coin: 10, honor: -3, secret: 1, skill: { stealth: 2 } } },
          lose: { r: "The Watch is waiting at the boat. Being caught with the sacks is worse than being named.",
            fx: { punish: "theft", honor: -3 } } },
        { t: "Go to the Watch first and confess", check: { s: "persuasion", s2: "wil", d: 44 },
          win: { r: "A Watch captain hears the whole story and writes down the clerk's other names. You pay a fine and keep your hands. The Mice will learn who talked.",
            fx: { coin: -15, honor: 2, newRel: { type: "enemy", op: -30 } } },
          lose: { r: "They thank you for the confession and punish you anyway.",
            fx: { punish: "theft" } } },
        { t: "Stay home and hope he forgets you", check: { s: "intrigue", s2: "ins", d: 50 },
          win: { r: "He names eleven men. You are not one of them. Perhaps he forgot. Perhaps he is saving you.",
            fx: { wil: 1.5, trait: "paranoid" } },
          lose: { r: "The Watch comes at noon.",
            fx: { punish: "theft", honor: -4 } } },
      ],
    },

    // ss_tm_scribe: the farmer's child taken into the temple scribe-school
    {
      id: "mra_tm_scribe_roll",
      title: "A petition in a temple hand",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && C.flag(p, "ss_tm_scribe") && A.S.year - p.flags.ss_tm_scribe >= 8,
      w: 3, once: true,
      text: "You were the barefoot farmer's child who learned the first forty signs in a month, while the scribes' sons stopped laughing. Now your village needs a scribe. The steward has raised the rent on the canal plots twice in a year, and the headman wants a petition to the nome court. The steward has offered you a clerk's place in the temple, if your hand is busy elsewhere.",
      choices: [
        { t: "Write the petition for the village",
          r: "You write it in the temple hand, every rent and every date. The headman takes it to the nome court. The steward stops greeting you.",
          fx: (p, ctx) => { later("mra_tm_petition_answer", 6); return more(p, ctx, { honor: 4, flag: "mra_tm_petition", newRel: { type: "enemy", op: -25 } }); } },
        { t: "Take the clerk's place in the temple",
          r: "A reed pen, a clean kilt, a ration of bread and beer. You keep the steward's rolls now. The village finds another hand, and a worse one.",
          fx: { job: "scribe", coin: 15, honor: -3 } },
        { t: "Teach the headman's sons to write it themselves", check: { s: "learning", s2: "wil", d: 46 },
          win: { r: "It takes all winter. The petition goes in, in a boy's careful hand. Three children in your village can read now.",
            fx: { skill: { learning: 2 }, honor: 3, fame: 1, deed: "Taught three village children to write" } },
          lose: { r: "The boys learn twelve signs. The rent is due before the thirteenth.",
            fx: { happy: -3, skill: { learning: 1 } } } },
      ],
    },
    // arc: mra_tm_petition -> the nome court answers
    {
      id: "mra_tm_petition_answer",
      title: "The nome court",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && C.flag(p, "mra_tm_petition") && A.S.year - p.flags.mra_tm_petition >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_tm_petition_answer")) ctx.skip = 1; },
      text: "The nome court has read your petition about the canal rents. It finds for the village, in part: the steward must return one rent. But the judge notes that the petition is written in a temple hand, and asks who taught a farmer's child to write like that. The steward's men are asking the same question in the village.",
      choices: [
        { t: "Stand up and say you wrote it",
          r: "The court records your name beside the judgment. The village brings you bread and dates for a month. The steward has your name in writing now, too.",
          fx: { fame: 2, honor: 3, favor: -2, deed: "Won the canal-rent petition at the nome court" } },
        { t: "Let the headman take the credit",
          r: "The headman is a hero for a season. You are a farmer who happens to read. The steward's men watch his house instead of yours.",
          fx: { trait: "humble", wil: 1, happy: -2 } },
      ],
    },

    // ss_tm_ibis: Hapu the Reed gave you a horn bow and a place among the Ibis Archers
    {
      id: "mra_tm_ibis_oath",
      title: "Swear by the Mother",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && C.male(p) && !C.old(p) && C.flag(p, "ss_tm_ibis") && A.S.year - p.flags.ss_tm_ibis >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { sex: "M", occ: "a Tashiri archer of the Reed School" }); },
      text: "Hapu the Reed gave you a horn bow and a place at the Reed School of Marira. Now the temple Measurers have come before the Harvest of the Mother. Every Ibis Archer must swear by the Flood Mother, in front of them, today. Your boat-mate {them} is a Tashiri of the Path of the Well, and will not. Hapu says nothing and watches the reeds.",
      choices: [
        { t: "Swear, then stand beside {them}",
          r: "You swear. Then you step back into line beside {them}, who did not. The Measurers write down both names. {them} remembers where you stood.",
          fx: { them: { type: "friend", op: 30 }, honor: 2, favor: -2 } },
        { t: "Refuse to swear, alongside {themHim}",
          r: "Two archers stand silent. The Measurers write you down and leave. That spring Hapu strikes both your names from the levy roll, to keep you out of the temple's reach.",
          fx: { them: { type: "friend", op: 45 }, honor: 4, piety: -3, favor: -5, trait: "stubborn" } },
        { t: "Talk {themHim} into swearing", check: { s: "persuasion", s2: "ins", d: 48 },
          win: { r: "{them} says the words with two fingers bent in the Well sign. The Measurers are satisfied. In time, so is {them}.",
            fx: { them: { op: 10 }, skill: { persuasion: 2 } } },
          lose: { r: "{them} swears at you instead of by the Mother. The Measurers take {themHim} to the temple cells for a month.",
            fx: { them: { op: -30 }, happy: -4 } } },
      ],
    },
    {
      id: "mra_tm_ibis_boat",
      title: "A boat of ten",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && C.male(p) && !C.old(p) && C.flag(p, "ss_tm_ibis") && A.S.year - p.flags.ss_tm_ibis >= 4,
      w: 2, once: true,
      text: "General Rahotep wants the Ibis Archers out of the reeds and onto dry ground, for a campaign in the Neck. Hapu the Reed, who first made you shoot from a rocking boat, thinks it will waste them. He must send them anyway. He needs a man to lead a boat of ten, and he is weighing you and your horn bow.",
      choices: [
        { t: "Take the boat of ten", check: { s: "command", s2: "bow", d: 46 },
          win: { r: "Ten archers, one boat, one summer in the Neck. You bring nine home, and the tenth's bow to his mother. Hapu ties a reed-captain's cord on your wrist.",
            fx: { skill: { command: 3 }, fame: 2, deed: "Led a boat of Ibis Archers in the Neck" } },
          lose: { r: "An ambush at a ford. You bring six home, and a scar of your own.",
            fx: { wound: "arrow_wound", health: -14, wil: 2, skill: { command: 2 }, cause: "an ambush in the Neck" } } },
        { t: "Go as a plain archer",
          r: "Another man leads. You shoot when told, and come home in July sunburned and whole.",
          fx: { skill: { bow: 2 }, sta: 0.3 } },
        { t: "Give the horn bow back to Hapu",
          r: "He takes it without a word. The reed beds go on without you, and so does the Neck.",
          fx: { gear: { ranged: null }, unflag: "ss_tm_ibis", honor: -3, happy: 2 } },
      ],
    },

    // ss_tm_faruq: guarded Faruq the Lamp at the Flood Stairs
    {
      id: "mra_tm_faruq_again",
      title: "The Lamp is back",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && !C.old(p) && C.flag(p, "ss_tm_faruq") && A.S.year - p.flags.ss_tm_faruq >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!cast(p, ctx, "CHR-0502")) ctx.skip = 1; },
      text: "{themFull} is back at the Flood Stairs, with his little oil lamp and a crowd three times the size. You held the stick the day the temple's man went into the Monuti instead of him, and he has not forgotten. The temple has put twenty silver kites on his head. He wants you to captain his guard. He mentions the price himself, to show he trusts you.",
      choices: [
        { t: "Captain his guard",
          r: "Six men with sticks, a lamp and a crowd. The temple watches you from the top of the Stairs. {them} pays in silver, and the crowd pays in the way it says your name.",
          fx: (p, ctx) => { later("mra_tm_lamp_night", 6); return more(p, ctx, { coin: 15, favor: -5, fame: 2, them: { type: "friend", op: 30 }, flag: "mra_tm_lampguard" }); } },
        { t: "Sell him for the twenty kites",
          r: "You tell a temple clerk where {them} sleeps. He is gone by morning. You are paid. The crowd at the Stairs never learns your name, and you are glad of it.",
          fx: { coin: 120, honor: -10, them: { type: "enemy", op: -60 }, trait: "deceitful" } },
        { t: "Tell him to leave Tamar while he can", check: { s: "persuasion", s2: "ins", d: 46 },
          win: { r: "He argues all night, then goes south on a reed boat. A year later you hear of him preaching in the Delta, alive.",
            fx: { them: { op: 15 }, honor: 3 } },
          lose: { r: "\"A lamp does not hide,\" he says, and stays.",
            fx: { them: { op: 5 }, wil: 0.5 } } },
      ],
    },
    // arc: mra_tm_lampguard -> the temple comes for Faruq at night
    {
      id: "mra_tm_lamp_night",
      title: "Torches at the door",
      cond: (p, C) => C.realm(p, "POL-18") && C.adult(p) && C.flag(p, "mra_tm_lampguard") && A.S.year - p.flags.mra_tm_lampguard >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_tm_lamp_night") || !cast(p, ctx, "CHR-0502")) ctx.skip = 1; },
      text: p => `For ${count(yrs(p, "mra_tm_lampguard"), "year")} you have led {them}'s guard. Tonight the temple comes in force: twenty men with torches at the door of the house where he sleeps, and a priest with a written order. {them} lights his little lamp and sits down to wait. Your five men turn to you.`,
      choices: [
        { t: "Hold the door", check: { s: "melee", s2: "command", d: 54 },
          win: { r: "Sticks against spears in a doorway, and the doorway holds. The temple men fall back to wait for daylight. By daylight {them} is on the river, and the temple says your name aloud.",
            fx: { fame: 4, favor: -6, skill: { melee: 2 }, deed: "Held the door for Faruq the Lamp" } },
          lose: { r: "The door goes down. You wake in the temple cells with a broken head.",
            fx: { wound: "concussion", prison: 2, why: "brawling with temple guards" } } },
        { t: "Get him out the back, onto the river", check: { s: "stealth", s2: "sea", d: 48 },
          win: { r: "Through the goat pen, over the dyke, into a reed boat. {them} preaches next month in the Delta. The temple burns the house.",
            fx: { them: { op: 20 }, honor: 3, skill: { stealth: 2 } } },
          lose: { r: "The river is watched. {them} is taken in the reeds. You get away alone and soaked.",
            fx: { them: { op: -10 }, happy: -8 } } },
        { t: "Open the door to the priest",
          r: "{them} blows out the lamp and walks out to them. He does not turn his head toward you. The priest thanks you by name, loudly, so the whole lane can hear.",
          fx: { favor: 4, honor: -10, them: { type: "enemy", op: -80 }, trait: "craven" } },
      ],
    },

    // ------------------------------------------------------------------ Sand Clans (POL-19)

    // ss_sc_blackveil: rode with Zayd Blackveil and burned a well-camp on the Zanari gold road
    {
      id: "mra_sc_blackveil_marshal",
      title: "Zanari riders in the camps",
      cond: (p, C) => C.realm(p, "POL-19") && C.adult(p) && C.flag(p, "ss_sc_blackveil") && A.S.year - p.flags.ss_sc_blackveil >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { cast(p, ctx, "CHR-0518"); },
      text: "Zanara's marshal has sent riders into the camps, asking who burned the well-camps on the new gold road. You rode with Zayd Blackveil that night, for Harith Sayf's gold. The Zanari know Zayd winters in the hills near Qasan, but not which valley. You do. They offer gold for the valley, and a rope for anyone who rode with him.",
      choices: [
        { t: "Ride to Qasan and warn Zayd", check: { s: "riding", s2: "survival", d: 46 },
          win: { r: "You find his camp on the second night. Zayd hears you out in silence and moves his sixty riders before dawn. A month later a curved knife arrives, wrapped in black cloth.",
            fx: (p, ctx) => { later("mra_sc_zayd_reckoning", 6); return more(p, ctx, { honor: 2, flag: "mra_sc_warnedzayd", them: { type: "friend", op: 30 } }); } },
          lose: { r: "You lose the trail in a dust storm, and come home to find Zanari riders camped by your tent.",
            fx: { health: -6, happy: -3, favor: -2, cause: "a dust storm in the Qasan hills" } } },
        { t: "Sell them the valley",
          r: "A Zanari captain weighs the gold on a flat stone. Three nights later the Qasan hills are full of smoke. Zayd was not in them.",
          fx: (p, ctx) => { later("mra_sc_zayd_reckoning", 6); return more(p, ctx, { coin: 80, honor: -10, flag: "mra_sc_soldzayd" }); } },
        { t: "Say nothing, and keep your veil close", check: { s: "deception", s2: "wil", d: 44 },
          win: { r: "The Zanari ride on to the next camp. For a season you sleep with your knife under the saddle.",
            fx: { wil: 1, secret: 1 } },
          lose: { r: "A herder who saw you ride out that night trades your name for a goat. The Speaker's men take you to Zarak for questioning.",
            fx: { prison: 1, why: "riding with the outlaw Zayd Blackveil" } } },
      ],
    },
    // arc: mra_sc_warnedzayd / mra_sc_soldzayd -> Zayd comes to the fire
    {
      id: "mra_sc_zayd_reckoning",
      title: "A veiled rider at the fire",
      cond: (p, C) => C.realm(p, "POL-19") && C.adult(p) && (C.flag(p, "mra_sc_warnedzayd") || C.flag(p, "mra_sc_soldzayd")) && A.S.year - (p.flags.mra_sc_warnedzayd || p.flags.mra_sc_soldzayd) >= 2,
      w: 3, once: true,
      // Zayd himself if he lives; if the world has killed him, the band he led comes in his name
      setup: (p, ctx) => {
        if (!fresh(p, "mra_sc_zayd_reckoning")) { ctx.skip = 1; return; }
        // (A.T substitutes once, so ctx strings carry names, not tokens)
        const z = cast(p, ctx, "CHR-0518");
        if (z) { ctx.who = `It is ${A.fullName(z)} himself.`; return; }
        const dz = A.S.castMap && A.P(A.S.castMap["CHR-0518"]);
        const q = make(p, ctx, { sex: "M", age: 36, occ: "a rider of Zayd Blackveil's band" });
        ctx.who = `It is ${A.fullName(q)}, who rode at Zayd Blackveil's side. Zayd is dead of ${(dz && dz.cause) || "a fever"}, and the band follows ${q.given} now.`;
      },
      text: p => p.flags.mra_sc_warnedzayd
        ? "A veiled rider finds you at the fire, as one did years ago. {who} The band remembers who rode to Qasan to warn it. Now Harith Sayf wants a Zanari gold caravan stopped before the Salt Road, and {them} wants you along. This time there will be guards, and killing."
        : "A veiled rider finds you at the fire, as one did years ago. {who} The band knows who sold the Qasan valley to the Zanari. {them} has not come to kill you. {them} has come to collect: you ride once more, against the gold caravans, or every camp hears your name.",
      choices: [
        { t: "Ride with {them} against the caravan", req: p => !!p.flags.mra_sc_warnedzayd, check: { s: "melee", s2: "riding", d: 52 },
          win: { r: "A night fight among kneeling camels. The gold goes into the hills. Harith Sayf pays you himself, and you see in his face that he means to use you again.",
            fx: { coin: 70, honor: -4, fame: 2, them: { op: 15 }, deed: "Rode with Zayd Blackveil's band against a Zanari gold caravan" } },
          lose: { r: "The caravan guards are Zanari runners with bows. You come home with an arrow in you and no gold.",
            fx: { wound: "arrow_wound", health: -16, them: { op: 5 }, cause: "a caravan guard's arrow" } } },
        { t: "Refuse {themHim} to {theirHis} face", req: p => !!p.flags.mra_sc_warnedzayd,
          r: "{them} is silent behind the veil, then rides off. Whatever was owed between you and the band is paid now.",
          fx: { them: { op: -15 }, honor: 2 } },
        { t: "Ride in front, as {them} asks", req: p => !p.flags.mra_sc_warnedzayd, check: { s: "melee", s2: "riding", d: 52 },
          win: { r: "You ride in front, where the arrows are. At dawn {them} gives you a share of the gold and says the debt is paid.",
            fx: { coin: 40, honor: -2, them: { op: 20 }, unflag: "mra_sc_soldzayd" } },
          lose: { r: "You ride in front, and an arrow finds you. {them} leaves you at a well with water and a camel. The debt, the band says, is paid in blood.",
            fx: { wound: "arrow_wound", health: -18, unflag: "mra_sc_soldzayd", cause: "a caravan guard's arrow" } } },
        { t: "Tell the Speaker's men where the band will strike", req: p => !p.flags.mra_sc_warnedzayd, check: { s: "intrigue", s2: "riding", d: 50 },
          win: { r: "The Noon Lances are waiting at the caravan. {them} escapes. Half the band does not. {them} will come for you, but not soon.",
            fx: { favor: 5, honor: -4, them: { type: "enemy", op: -70 } } },
          lose: { r: "The Speaker's men are slow, and the band is not. {them} learns who talked.",
            fx: { them: { type: "enemy", op: -80 }, trait: "paranoid", happy: -6 } } },
      ],
    },

    // ss_sc_marad: brought a Marad child home from the Sabran pearl pens at Azara
    {
      id: "mra_sc_marad_boy",
      title: "Salt scars",
      cond: (p, C) => C.realm(p, "POL-19") && C.adult(p) && C.flag(p, "ss_sc_marad") && A.S.year - p.flags.ss_sc_marad >= 8,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { sex: "M", race: "human", age: yrs(p, "ss_sc_marad") + 9, occ: "a rider of Clan Marad" }); },
      text: "A young man rides into your camp on a good camel and gets down without asking leave. You know the salt scars on his wrists before you know his face. {them} is the Marad boy you cut out of the pens behind the Pearl Quay at Azara and carried home across your saddle. He is grown. He has come to swear himself to you, as a man swears to the head of a tent.",
      choices: [
        { t: "Take his oath on salt and water",
          r: "He swears at your fire. From now on {them} rides where you ride, and the Marad count your quarrels as their own.",
          fx: { them: { type: "friend", op: 60 }, sworn: 1, fame: 2 } },
        { t: "Send him home to his mother",
          r: "He argues. You do not. He rides home and tells the story in every Marad tent, and your name is good among the Marad for as long as they keep tents.",
          fx: { honor: 4, fame: 2, them: { op: 30 } } },
        { t: "Ride back to Azara with him, for the others", check: { s: "tracking", s2: "stealth", d: 54 },
          win: { r: "Two of you, at night, behind the Pearl Quay again. You bring out four children this time. House Zarani puts a price on two Sandfolk riders.",
            fx: { fame: 4, honor: 6, them: { type: "friend", op: 45 }, deed: "Brought four more children out of the Azara pearl pens" } },
          lose: { r: "The pens are guarded now, because of you. {them} is taken at the gate. You get away alone, cut and bleeding.",
            fx: { wound: "scar_face", health: -12, happy: -10, them: { op: -20 }, cause: "Sabran slave-riders" } } },
      ],
    },
    {
      id: "mra_sc_marad_feud",
      title: "One proof away",
      cond: (p, C) => C.realm(p, "POL-19") && C.adult(p) && C.flag(p, "ss_sc_marad") && A.S.year - p.flags.ss_sc_marad >= 2 && A.S.year - p.flags.ss_sc_marad <= 12,
      w: 2, once: true,
      text: "The clans are meeting at Zarak. Salma Bahar, the Well-Mother, once said a blood feud with Sabra was one proof away. You brought the proof home across your saddle: a Marad boy out of the pearl pens at Azara. The Marad want you to stand before the clans and tell it. Told well, it means war. Half the camps live by selling camels to Sabra.",
      choices: [
        { t: "Tell it all, and call for blood", check: { s: "persuasion", s2: "wil", d: 48 },
          win: { r: "The clans shout for war, and the Speaker cannot quiet them. Your name goes round every camp, with blessings and with curses.",
            fx: { fame: 5, honor: 3, realmStab: -2, deed: "Called the clans to blood feud with Sabra at Zarak" } },
          lose: { r: "The camel traders shout you down. The Marad leave Zarak angry, and some of their anger is for you.",
            fx: { fame: 1, honor: 1, happy: -4 } } },
        { t: "Tell it, and ask for a blood-price in pearls", check: { s: "diplomacy", s2: "persuasion", d: 46 },
          win: { r: "Sabra pays: pearls for every lost child, and the pens at Azara are closed, or moved. The Marad are not satisfied. The camel trade goes on.",
            fx: { honor: 2, favor: 4, skill: { diplomacy: 2 } } },
          lose: { r: "Sabra offers pearls for three children, not thirty. The council takes them, and the Marad blame the voice that asked.",
            fx: { favor: -2, newRel: { type: "enemy", op: -20 } } } },
        { t: "Stay away from Zarak",
          r: "The council meets without you, and others tell your story badly. The Marad do not forgive the empty place.",
          fx: { honor: -4, newRel: { type: "enemy", op: -25 } } },
      ],
    },

    // ------------------------------------------------------------------ Zanara (POL-20)

    // ss_zn_hand: saw that the emperor's left hand had gone numb
    {
      id: "mra_zn_hand_heir",
      title: "The left hand",
      cond: (p, C) => C.realm(p, "POL-20") && C.adult(p) && C.flag(p, "ss_zn_hand") && A.S.year - p.flags.ss_zn_hand >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        const r = A.realm("POL-20"), ru = r ? A.P(r.ruler) : null;
        ctx.gone = ru && ru.alive && /^Mosi III\b/.test(ru.given) ? "" : "1";
        make(p, ctx, { sex: "M", age: 40, occ: "a captain of the Marshal's army" });
      },
      text: (p, ctx) => "On the Ancestor Hill you watched Mosi III's left hand lie still in his lap, and knew it had gone numb. "
        + (ctx.gone ? "Mosi is gone now, as you knew he would be. " : "Now, they say, his speech slurs too. ")
        + "The Marshal's people and the heir's people are counting friends at court. {them}, a captain of the Marshal's, asks you over palm wine what you noticed about the emperor's health.",
      choices: [
        { t: "Tell the captain everything you saw",
          r: "{them} listens, thanks you and writes down a name. Yours. When the Marshal moves, you will be counted among his friends, whether you like it or not.",
          fx: { them: { type: "friend", op: 25 }, owed: 1, secret: 1, favor: -2 } },
        { t: "Take it to the heir's household instead", check: { s: "etiquette", s2: "intrigue", d: 46 },
          win: { r: "A Rememberer of the heir's household hears you out behind a screen. The heir's people do not thank you. They give you a seat at the next feast, which is better.",
            fx: { favor: 5, fame: 1, them: { type: "enemy", op: -20 } } },
          lose: { r: "The heir's people take your story and your name, and use neither. The Marshal's captain hears where you went.",
            fx: { them: { type: "enemy", op: -30 }, happy: -3 } } },
        { t: "Say the emperor looks well to you",
          r: "\"Well,\" {them} repeats, and smiles. You are on no one's list. That is safe, and lonely at court.",
          fx: { trait: "cautious", favor: -1 } },
      ],
    },

    // ss_zn_mask: joined the mask society through your limping uncle
    {
      id: "mra_zn_mask_night",
      title: "The horned ancestor",
      cond: (p, C) => C.realm(p, "POL-20") && C.adult(p) && C.flag(p, "ss_zn_mask") && A.S.year - p.flags.ss_zn_mask >= 2,
      w: 3, once: true,
      setup: (p, ctx) => {
        const x = linked(p, ctx, ["rival", "enemy"]);
        if (x) ctx.foe = x.r.type === "rival" ? "your rival" : "your enemy";
        else { make(p, ctx, { age: 50, status: "merchant", occ: "a moneylender of the Well Quarter" }); ctx.foe = "the moneylender who took your cousin's field for a debt"; }
      },
      text: "The Night of Masks. Since your limping uncle brought you into the society, you have carried a mask each year and told no one. Tonight you wear the horned ancestor. By mask law, what the ancestor does is done by no living man. In the torchlight you see {them}, {foe}, standing at the front of the crowd.",
      choices: [
        { t: "Let the ancestor's staff fall on {themHim}",
          r: "The horned ancestor stops before {them}, and the staff comes down once across {theirHis} shoulders. The drums falter, then roar. Tomorrow {them} will know who it was, and can say nothing.",
          fx: { them: { type: "enemy", op: -40 }, happy: 5, piety: -1 } },
        { t: "Let the ancestor bless {themHim} instead",
          r: "The horned ancestor lays a hand on {theirHis} head, and {them} shakes. A mask's blessing binds the one who gives it. You have forgiven something you did not mean to.",
          fx: { piety: 4, trait: "forgiving", them: { op: 20 } } },
        { t: "Dance past. The mask is not yours to use",
          r: "You dance the ancestor through the streets till dawn. The face at the front of the crowd is just a face.",
          fx: { piety: 2, happy: 2, skill: { music: 1 } } },
      ],
    },
    {
      id: "mra_zn_mask_uncle",
      title: "The uncle's mask",
      cond: (p, C) => C.realm(p, "POL-20") && C.adult(p) && C.flag(p, "ss_zn_mask") && A.S.year - p.flags.ss_zn_mask >= 6,
      w: 2, once: true,
      setup: (p, ctx) => {
        const u = uncleOf(p);
        if (u) ctx.pid = u.id;
        else make(p, ctx, { sex: "M", age: Math.min(80, A.age(p) * 16 / GD.RACES[p.race].adult + 25), occ: "a dancer of the mask society" });
      },
      text: "Your uncle {them} can no longer dance. The limp you knew under the horned mask, the night you asked to join his society, has become a crutch. The society's elders come to his house after dark, masked. They want you to take his mask and his seat among them. An elder of a mask society may never hold office at court, or speak against the ancestors' judgment.",
      choices: [
        { t: "Take your uncle's mask and his seat",
          r: "He puts the horned mask in your hands and grips your wrist once. From now on the ancestors speak with your voice on the Night of Masks.",
          fx: { piety: 5, fame: 1, deed: "Took an elder's seat in the mask society", them: { type: "uncle", op: 20 } } },
        { t: "Refuse. You want a place at court someday",
          r: "The elders carry the mask to another nephew. Your uncle turns his face to the wall, and the society's people stop greeting you in the street.",
          fx: { honor: -2, happy: -4, unflag: "ss_zn_mask", them: { type: "uncle", op: -25 } } },
      ],
    },

    // ss_zn_runner: ran the House of Runners trial before the noon drums
    {
      id: "mra_zn_runner_atani",
      title: "Two days to Atani",
      cond: (p, C) => C.realm(p, "POL-20") && C.adult(p) && !C.old(p) && C.flag(p, "ss_zn_runner") && A.S.year - p.flags.ss_zn_runner >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!cast(p, ctx, "CHR-0535")) ctx.skip = 1; },
      text: "{themFull}, who watched you touch the post as the noon drums sounded, has a message for the Marshal's camp at Atani. The relay posts are watched by the Old Voices, who read what passes through them. This one must pass through no one. It is three days to Atani for a horse. {them} wants it there in two, by one runner, and he names you.",
      choices: [
        { t: "Run it straight through, alone", check: { s: "sta", s2: "athletics", d: 54 },
          win: { r: "Two days and a night, the river road and the hill road. You hand it over at Atani on your knees. {them} hears of it before you are home.",
            fx: (p, ctx) => { later("mra_zn_runner_guard", 6); return more(p, ctx, { fame: 3, them: { op: 20 }, flag: "mra_zn_ranatani", deed: "Ran the road to Atani in two days" }); } },
          lose: { r: "Your knee goes on the second morning. You finish at a hobble, a day late, the seal unbroken. {them} says only that the seal was unbroken.",
            fx: { wound: "bad_knee", health: -8, them: { op: -5 }, cause: "the run to Atani" } } },
        { t: "Send it by the relay posts, fast and watched",
          r: "The relays run it in a day and a half. Somewhere on the road somebody reads it. You can tell from {them}'s face when the answer comes.",
          fx: { them: { op: -15 }, skill: { command: 1 } } },
        { t: "Read it first, then decide", req: (p, C) => C.literate(p), check: { s: "intrigue", s2: "ins", d: 46 },
          win: { r: "It is a list of runners the Old Voices have bought. Your name is not on it. You run it to Atani with a lighter heart and a heavier secret.",
            fx: (p, ctx) => { later("mra_zn_runner_guard", 6); return more(p, ctx, { secret: 1, skill: { intrigue: 2 }, fame: 1, flag: "mra_zn_ranatani" }); } },
          lose: { r: "The seal cracks. You run it anyway. {them} sees the seal at once and cuts the runner's cord from your wrist.",
            fx: { unflag: "ss_zn_runner", honor: -5, them: { op: -30 } } } },
      ],
    },
    // arc: mra_zn_ranatani -> the Runner Guard wants you
    {
      id: "mra_zn_runner_guard",
      title: "The white cloth",
      cond: (p, C) => C.realm(p, "POL-20") && C.adult(p) && !C.old(p) && C.flag(p, "mra_zn_ranatani") && A.S.year - p.flags.mra_zn_ranatani >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_zn_runner_guard")) ctx.skip = 1; },
      text: "Since your run to Atani, the Runner Guard has wanted you. A Guard captain comes to the House of Runners with a spear and a white cloth. The Runner Guard stands between the emperor and everything, and runs before his litter in war. It is the highest place a runner can hold. A runner who takes the white cloth does not give it back.",
      choices: [
        { t: "Take the spear and the white cloth",
          r: "You run before the emperor's litter on feast days and stand behind his stool on the Ancestor Hill. The pay is good. Your days belong to someone else now.",
          fx: { job: "courtier", favor: 5, fame: 2, deed: "Took the white cloth of the Runner Guard" } },
        { t: "Stay at the House of Runners and train boys",
          r: "You take the morning trials. You watch boys bleed at the feet the way you did, and learn to tell which ones will finish.",
          fx: { job: "teacher", skill: { athletics: 2 }, wil: 0.5 } },
        { t: "Run for the Well Quarter merchants, for gold dust",
          r: "A merchant house pays you to run what it will not trust to the relays. The Old Voices notice. The gold dust is very good.",
          fx: { coin: 60, favor: -3, trait: "greedy" } },
      ],
    },

    // ss_zn_letter: read the Well Quarter merchant's letter to Atani and resealed it
    {
      id: "mra_zn_letter_quarrel",
      title: "What the letter said",
      cond: (p, C) => C.realm(p, "POL-20") && C.adult(p) && C.flag(p, "ss_zn_letter") && A.S.year - p.flags.ss_zn_letter >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { make(p, ctx, { age: 50, status: "merchant", occ: "a merchant of the Well Quarter" }); },
      text: "You read the letter {them} of the Well Quarter gave you for Atani, and resealed it so well the wax showed nothing. It named the side the merchants would back if the Marshal and the heir ever quarrelled. Now a man of the Old Voices is asking at every door who took Well Quarter letters to Atani that year. He pays for names. He pays more for what was written.",
      choices: [
        { t: "Tell him what the letter said",
          r: "He listens without writing anything down, which frightens you more than ink. The Well Quarter's merchants are questioned that month. {them} leaves Zanara by night.",
          fx: { coin: 50, honor: -6, favor: 3, them: { type: "enemy", op: -40 } } },
        { t: "Warn {them} that the Old Voices are asking",
          r: "{them} goes grey, then gives you gold dust and a bed in {theirHis} house for a month. From now on you are the Well Quarter's friend, and the Old Voices' suspect.",
          fx: { coin: 25, favor: -3, them: { type: "friend", op: 35 }, owed: 1 } },
        { t: "Say you carried dates, not letters", check: { s: "deception", s2: "wil", d: 46 },
          win: { r: "He crosses something out and moves on. There are many doors.",
            fx: { wil: 1, skill: { deception: 1 } } },
          lose: { r: "He has the Atani factor's word that you brought a letter. He leaves you with a question you cannot answer, and your name in his book.",
            fx: { happy: -3, trait: "paranoid", newRel: { type: "enemy", op: -25 } } } },
      ],
    },

    // ------------------------------------------------------------------ Kesh (POL-21)

    // ss_ks_swimmer: passed the Night Swimmers' test in Kesh harbor
    {
      id: "mra_ks_swim_amber",
      title: "The flagship's cable",
      cond: (p, C) => C.realm(p, "POL-21") && C.adult(p) && !C.old(p) && C.flag(p, "ss_ks_swimmer") && A.S.year - p.flags.ss_ks_swimmer >= 2,
      w: 3, once: true,
      text: "An Amber squadron lies off Kesh for a week, and the League cannot decide whether it is a visit or a threat. The Night Swimmers, who took you on after you cut the marked rope with a knife in your teeth, have been told to be ready. Tonight the captain wants one swimmer to go out and cut the Amber flagship's anchor cable, so she drifts onto the bar.",
      choices: [
        { t: "Go yourself, knife in your teeth", check: { s: "sea", s2: "stealth", d: 54 },
          win: { r: "The cable is as thick as your thigh. It takes an hour. At dawn the Amber flagship sits on the bar, and her admiral sails home without a word. The Swimmers drink to you.",
            fx: (p, ctx) => { later("mra_ks_swim_price", 6); return more(p, ctx, { fame: 3, skill: { stealth: 2 }, flag: "mra_ks_cutcable", deed: "Cut an Amber flagship's cable by night" }); } },
          lose: { r: "A marine's boathook finds you in the black water. You get back with a gash across your back and nothing cut.",
            fx: { wound: "deep_cut", health: -14, cause: "an Amber boathook" } } },
        { t: "Say the League has not ordered it",
          r: "The captain agrees, coldly, and sends no one. The Amber ships leave on the eighth day. The Swimmers stop asking you to drink with them.",
          fx: { honor: 2, happy: -3, trait: "cautious" } },
        { t: "Sell the plan to an Amber purser", check: { s: "intrigue", s2: "deception", d: 50 },
          win: { r: "The purser pays sixty kesh. That night the Amber ships double their boat-watch, and two Swimmers come back with nothing. No one suspects you, yet.",
            fx: { coin: 60, honor: -10, trait: "deceitful" } },
          lose: { r: "The purser takes your plan to the League instead, for a better price. The Swimmers learn whose plan it was.",
            fx: { health: -10, honor: -6, newRel: { type: "enemy", op: -40 }, cause: "a beating on the quay" } } },
      ],
    },
    // arc: mra_ks_cutcable -> a price on the swimmer's name
    {
      id: "mra_ks_swim_price",
      title: "Forty kesh for a name",
      cond: (p, C) => C.realm(p, "POL-21") && C.adult(p) && C.flag(p, "mra_ks_cutcable") && A.S.year - p.flags.mra_ks_cutcable >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_ks_swim_price")) { ctx.skip = 1; return; } make(p, ctx, { occ: "a Night Swimmer" }); },
      text: "The Amber Isles have not forgotten their flagship on the bar. An Amber factor in Kesh is offering forty silver kesh for the name of the swimmer who cut her cable. Your name is no secret among the Night Swimmers. One of them, {them}, owes money on the Pepper Hall dice, and has started counting you like coin.",
      choices: [
        { t: "Pay {them}'s dice debt first", req: p => p.coin >= 40,
          r: "Forty kesh to the dice-man. {them} weeps with relief and swears to keep your name. You have bought {themHim}, and you both know it.",
          fx: { coin: -40, them: { type: "friend", op: 25 }, owed: 1 } },
        { t: "Leave Kesh for a season on a pepper boat",
          r: "A season down the coast, in heat and pepper dust. When you come back, the factor has sailed home and {them} has found another purse.",
          fx: { skill: { sea: 2 }, coin: -20, happy: -3 } },
        { t: "Sell the factor a false name first", check: { s: "deception", s2: "ins", d: 50 },
          win: { r: "You give him a name from the harbor graveyard. He pays ten kesh for it and sails home pleased. The flagship is your secret again.",
            fx: { coin: 10, honor: -2, skill: { deception: 2 }, unflag: "mra_ks_cutcable" } },
          lose: { r: "He knows your face from the quay that night. You leave his house fast. Amber Row is closed to you now.",
            fx: { honor: -2, newRel: { type: "enemy", op: -40 } } } },
      ],
    },

    // ss_ks_holes: plugged one auger hole in a League hull and missed the second
    {
      id: "mra_ks_holes_sunk",
      title: "Three planks along",
      cond: (p, C) => C.realm(p, "POL-21") && C.adult(p) && C.flag(p, "ss_ks_holes") && A.S.year - p.flags.ss_ks_holes >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!cast(p, ctx, "CHR-0556")) ctx.skip = 1; },
      text: "A League ship from {themFull}'s yards at Monuro has gone down off the Amber Isles with thirty men. A plank came open in a seaway, the survivors say. You caulked below that waterline. You plugged one auger hole and missed the second, three planks along. Now {them} is to be tried for green timber, and the yards are full of men who say nothing.",
      choices: [
        { t: "Tell the League council about the auger holes", check: { s: "persuasion", s2: "wil", d: 46 },
          win: { r: "You tell them about both holes. {them} is cleared of the green-wood charge. You are fined for keeping quiet, and the yards will remember you spoke.",
            fx: { them: { op: 30 }, honor: 4, coin: -30, fame: 2 } },
          lose: { r: "They believe in the holes. They also believe you bored them.",
            fx: { prison: 2, why: "sabotage at the Monuro yards", them: { op: 10 } } } },
        { t: "Keep quiet. {them} can bear it",
          r: "{them} pays a fine and loses the League's next order. She never learns you could have spared her.",
          fx: { honor: -4, happy: -6, wil: 1 } },
        { t: "Tell {them} alone, in private",
          r: "She hears it out in her yard with an adze in her hand. Then she checks every hull you ever touched. \"Next time,\" she says, \"you tell me first.\" She keeps you on, at half pay.",
          fx: { them: { type: "friend", op: 15 }, coin: -10, honor: 2 } },
      ],
    },

    // ss_ks_auger: followed the auger-man in a Monuri sash to a house on Amber Row
    {
      id: "mra_ks_auger_row",
      title: "The house on Amber Row",
      cond: (p, C) => C.realm(p, "POL-21") && C.adult(p) && C.flag(p, "ss_ks_auger") && A.S.year - p.flags.ss_ks_auger >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { cast(p, ctx, "CHR-0556"); },
      text: "The night you watched Rehema's yards, you followed the auger-man in his Monuri sash to a house on Amber Row. You have kept that house in mind. Now the League is electing a prince, and House Monuri wants the throne back with Amber ships behind it. A hull bored in the yards would look very bad for the Monuri, if anyone could say who bored it.",
      choices: [
        { t: "Take what you saw to House Keshari",
          r: "Faraji Keshari's man pays in silver and asks you to say it again before witnesses. You do. The Monuri lose votes, and gain an enemy.",
          fx: (p, ctx) => { later("mra_ks_auger_after", 6); return more(p, ctx, { coin: 40, favor: 3, flag: "mra_ks_augertold", newRel: { type: "enemy", op: -30 } }); } },
        { t: "Tell Rehema, whose hulls they were", req: (p, C, ctx) => !!(ctx && ctx.pid),
          r: "{them} hears you out and says nothing for a while. Then she offers you work in her yards whenever you want it, and tells no one where she got the name.",
          fx: (p, ctx) => { later("mra_ks_auger_after", 6); return more(p, ctx, { them: { type: "friend", op: 35 }, job: "carpenter", flag: "mra_ks_augertold" }); } },
        { t: "Sell your silence to the house on Amber Row", check: { s: "intrigue", s2: "deception", d: 52 },
          win: { r: "A purse of silver kesh, handed over by a servant who gives no name. You have been bought, and the house knows your face.",
            fx: { coin: 100, honor: -8, secret: 1 } },
          lose: { r: "The house on Amber Row pays you with a knife in the dark. You live, barely.",
            fx: { wound: "deep_cut", health: -18, cause: "a knife on Amber Row" } } },
      ],
    },
    // arc: mra_ks_augertold -> House Monuri makes an offer
    {
      id: "mra_ks_auger_after",
      title: "The Monuri offer",
      cond: (p, C) => C.realm(p, "POL-21") && C.adult(p) && C.flag(p, "mra_ks_augertold") && A.S.year - p.flags.mra_ks_augertold >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_ks_auger_after")) ctx.skip = 1; },
      text: "House Monuri has worked out who followed the auger-man to Amber Row. They do not send a knife. They send a steward with an offer: a share in a pepper ship and a house on the harbor. The price is that you tell the League you were wrong about the sash.",
      choices: [
        { t: "Take the share and say you were wrong",
          r: "You stand before the council and say the sash was red, not Monuri green. The share is real. So is the silence when you walk past the shipyards.",
          fx: { coin: 150, honor: -10, job: "merchant" } },
        { t: "Send the steward away",
          r: "He bows and leaves. After that every Monuri warehouse in Kesh is shut to you, and so are their friends' warehouses.",
          fx: { honor: 4, coinPct: -0.1, newRel: { type: "enemy", op: -40 } } },
        { t: "Get the offer in writing, for the Keshari", req: (p, C) => C.literate(p), check: { s: "intrigue", s2: "deception", d: 52 },
          win: { r: "The steward is foolish enough to write it down. The Keshari are delighted. The Monuri lose the election and look for you afterwards.",
            fx: { favor: 6, fame: 3, newRel: { type: "enemy", op: -50 } } },
          lose: { r: "The steward is not foolish. He laughs, and leaves you a polite warning.",
            fx: { happy: -3, trait: "paranoid" } } },
      ],
    },

    // ss_ks_wethands: swam out with Old Mwita's Wet Hands to the Amber clove cog
    {
      id: "mra_ks_wet_letter",
      title: "The letter in the cloves",
      cond: (p, C) => C.realm(p, "POL-21") && C.adult(p) && C.flag(p, "ss_ks_wethands") && A.S.year - p.flags.ss_ks_wethands >= 2,
      w: 3, once: true,
      text: "Old Mwita of Stilt Town never throws anything away. The sealed letter that came up among the cloves, the night you swam out with the Wet Hands to the Amber cog, is still in his chest. He has found out the seal is Monuri, and the letter is addressed to the Amber Grand Vizier. Mwita cannot read. He wants it sold, and he wants you to sell it.",
      choices: [
        { t: "Sell it to House Keshari", check: { s: "intrigue", s2: "trade", d: 46 },
          win: { r: "Faraji Keshari's man pays in good silver, and you split it fairly with Mwita. A month later two Monuri captains are dismissed from the League fleet.",
            fx: { coin: 50, favor: 2, skill: { intrigue: 2 } } },
          lose: { r: "Faraji's man takes the letter, pays half and remembers your face.",
            fx: { coin: 20, newRel: { type: "enemy", op: -20 } } } },
        { t: "Sell it back to the Monuri",
          r: "The Monuri pay twice as much and promise nothing. A month later two Wet Hands are taken in the water on a quiet night. Mwita does not ask you why.",
          fx: { coin: 90, honor: -6, happy: -3 } },
        { t: "Burn it in Mwita's brazier",
          r: "Mwita curses you for an hour, then laughs. \"The tide comes in for everyone,\" he says, and pours palm wine. What the letter said, you will never learn.",
          fx: { honor: 2, trait: "cautious" } },
      ],
    },
    {
      id: "mra_ks_wet_old",
      title: "Mwita's floats",
      cond: (p, C) => C.realm(p, "POL-21") && C.adult(p) && !C.old(p) && C.flag(p, "ss_ks_wethands") && A.S.year - p.flags.ss_ks_wethands >= 6,
      w: 2, once: true,
      text: "Old Mwita of Stilt Town is too old to swim. He sends for you, who swam out with his Wet Hands to the Amber cog, and offers you the Wet Hands: twenty thieves, three reed floats, a fence on the quay, and the harbor guards he pays. He offers it the way a father gives away a boat.",
      choices: [
        { t: "Take the Wet Hands",
          r: "The thieves swear on the tide. The floats, the fence and the guards' pay are yours now, and so is the rope, if it comes.",
          fx: { job: "thief", coin: 30, honor: -5, deed: "Took over the Wet Hands of Stilt Town" } },
        { t: "Refuse, and find honest work",
          r: "Mwita shrugs. \"The tide,\" he says, and gives the floats to a cousin. You take work on the ropewalk, where the pay is honest and thin.",
          fx: { job: "labor", honor: 2, happy: -2 } },
        { t: "Take it, then sell the Wet Hands to the harbor guards", check: { s: "intrigue", s2: "deception", d: 52 },
          win: { r: "Twenty thieves in the harbor cells, and a guard captain's purse in your shirt. Mwita dies that winter, still calling you son.",
            fx: { coin: 80, honor: -10, favor: 2, trait: "deceitful" } },
          lose: { r: "The guards keep the thieves and the money. Mwita's cousin keeps your name.",
            fx: { health: -10, newRel: { type: "enemy", op: -40 }, cause: "a beating in Stilt Town" } } },
      ],
    },

    // ss_ks_storm: watched the sky when infant Prince Nuru screamed, and beat the squall home
    {
      id: "mra_ks_storm_prince",
      title: "The prince's ears",
      cond: (p, C) => C.realm(p, "POL-21") && C.adult(p) && C.flag(p, "ss_ks_storm") && A.S.year - p.flags.ss_ks_storm >= 4,
      w: 3, once: true,
      setup: (p, ctx) => {
        const q = cast(p, ctx, "CHR-0559");
        if (!q || A.age(q) < 4) { ctx.skip = 1; return; }
        const n = A.age(q);
        ctx.boy = NUM[n] || String(n);
        ctx.kin = A.isAdult(q) ? "a man of" : "a boy of";
      },
      text: "Prince {them} is {kin} {boy} now, and still claws at his ears before storms. Since the night you watched the sky while he screamed, and got your boat in ahead of the squall, you have trusted his ears over the harbor-master's. The pepper fleet is loading for the long run south. The prince has been restless for two days. The harbor-master says the sky is clear.",
      choices: [
        { t: "Hold your cargo and warn the fleet", check: { s: "persuasion", s2: "sea", d: 48 },
          win: { r: "Half the fleet waits on your word. The storm comes on the third night. The ships that sailed are not seen again. The ones that waited know your name.",
            fx: { fame: 4, honor: 3, deed: "Held half the pepper fleet in port before a great storm" } },
          lose: { r: "They laugh at a sailor who reads a child. The storm comes anyway. Afterwards the laughing stops, and so does the talk.",
            fx: { fame: 1, happy: -4 } } },
        { t: "Hold your own cargo, and say nothing",
          r: "You unload, wait out the storm and sell pepper at storm prices after the fleet is lost. It is the best year your purse has had.",
          fx: { coin: 120, honor: -5, trait: "greedy" } },
        { t: "Sell the secret of his ears to the Amber Isles",
          r: "An Amber factor pays well to learn the boy has the Maruang storm-sense. What the Amber Isles will do with a prince who hears weather is not your affair, you tell yourself.",
          fx: { coin: 60, honor: -10, secret: 1 } },
      ],
    },

    // ------------------------------------------------------------------ Abara (POL-22)

    // ss_ab_desta: learned that Desta the Pedlar is paid by the Marshal of the North
    {
      id: "mra_ab_desta_back",
      title: "Needles and blue thread",
      cond: (p, C) => C.realm(p, "POL-22") && C.adult(p) && C.flag(p, "ss_ab_desta") && A.S.year - p.flags.ss_ab_desta >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!cast(p, ctx, "CHR-0588")) ctx.skip = 1; },
      text: "{themFull} is back in the valley with his needles and blue thread, as friendly as ever. You once asked him who paid him, and he dropped the pedlar's face and told you: the Marshal of the North. He knows you remember. Today he offers you a share of the pay, if you will listen in your valley for letters going south to Prince Tekle.",
      choices: [
        { t: "Take his silver and listen",
          r: "A salt bar a month, for names. Your neighbors begin to sound different to you, and you to them, though they cannot say why.",
          fx: (p, ctx) => { later("mra_ab_desta_hive", 6); return more(p, ctx, { coin: 20, honor: -4, skill: { intrigue: 2 }, them: { op: 20 }, flag: "mra_ab_destaman" }); } },
        { t: "Warn the southern lords' riders about him", check: { s: "intrigue", s2: "riding", d: 48 },
          win: { r: "The Mandari riders thank you, and take {them} on the Mandi road. He does not come back to the valley that year, or the next.",
            fx: { favor: -3, honor: 2, fame: 1, them: { type: "enemy", op: -60 } } },
          lose: { r: "{them} hears of it before they do. He sends you a needle wrapped in blue thread. You understand the message.",
            fx: { trait: "paranoid", them: { type: "enemy", op: -40 } } } },
        { t: "Buy another very expensive needle",
          r: "He sells you the needle, smiles and moves on. You have told him nothing. He will remember that too.",
          fx: { coin: -2, trait: "cautious", them: { op: -5 } } },
      ],
    },
    // arc: mra_ab_destaman -> Desta wants the letters in the hive
    {
      id: "mra_ab_desta_hive",
      title: "The hive in the Yandi orchards",
      cond: (p, C) => C.realm(p, "POL-22") && C.adult(p) && C.flag(p, "mra_ab_destaman") && A.S.year - p.flags.mra_ab_destaman >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_ab_desta_hive") || !cast(p, ctx, "CHR-0588")) ctx.skip = 1; },
      text: p => `For ${count(yrs(p, "mra_ab_destaman"), "year")} you have listened for {them}: a name here, a rider there. Now he wants something bigger. Copies of the Mandari letters to Prince Tekle are hidden in a hive in the Yandi orchards, he says. They name every lord who has promised to ride. The Marshal of the North will make a rich man of whoever brings them.`,
      choices: [
        { t: "Rob the hive", check: { s: "stealth", s2: "husbandry", d: 52 },
          win: { r: "Smoke, a sting on the eyelid, and a bundle of letters in waxed cloth. {them} pays in gold. Within the year three southern lords are in chains.",
            fx: { coin: 120, honor: -8, them: { op: 20 }, deed: "Stole the Mandari letters from the Yandi hives" } },
          lose: { r: "The bees are the least of it. The orchard keeper's dogs are worse. You run, stung and bitten, with nothing.",
            fx: { wound: "bite", health: -10, them: { op: -10 }, cause: "the Yandi orchard dogs" } } },
        { t: "Tell him you are done listening",
          r: "{them} is friendly about it, as he is about everything. The salt bars stop. A month later the king's tax-men take a new interest in you.",
          fx: { unflag: "mra_ab_destaman", coinPct: -0.1, them: { op: -20 } } },
        { t: "Warn the orchard keeper and ride south with the letters", check: { s: "riding", s2: "stealth", d: 52 },
          win: { r: "You ride to Mandi with the letters under your saddle. Mesfin Mandari takes them himself and calls you a friend of Tekle's.",
            fx: (p, ctx) => say(more(p, ctx, { honor: 4, fame: 2, unflag: "mra_ab_destaman", them: { type: "enemy", op: -60 } }), bond(p, "CHR-0575", "friend", 30)) },
          lose: { r: "{them}'s people are on the road. You lose the letters at a ford, and nearly your life.",
            fx: { wound: "deep_cut", health: -14, them: { type: "enemy", op: -60 }, cause: "an ambush on the Mandi road" } } },
      ],
    },

    // ss_ab_monundi: won a horse and a place among the Horsemen of the Monundi at Mandi
    {
      id: "mra_ab_monundi_muster",
      title: "The night muster",
      cond: (p, C) => C.realm(p, "POL-22") && C.adult(p) && !C.old(p) && C.flag(p, "ss_ab_monundi") && A.S.year - p.flags.ss_ab_monundi >= 2,
      w: 3, once: true,
      text: "A rider of House Mandari comes at night. The Horsemen of the Monundi are mustering at Mandi, quietly, without the king's word. You won your place at the ford trial, and Yohannes Mandari gave you a horse. Now the horse is called for, and you with it. The rider does not say the name Tekle. He does not need to.",
      choices: [
        { t: "Ride to Mandi on the Mandari horse",
          r: "Six thousand horsemen in the dark, and old songs about Kiros. It feels like the start of something. In the morning the lords send everyone home to wait.",
          fx: (p, ctx) => { later("mra_ab_monundi_list", 6); return more(p, ctx, { flag: "mra_ab_rodemonundi", favor: -4, honor: 2, skill: { riding: 1 } }); } },
        { t: "Send the horse back with the rider",
          r: "You lead the horse out yourself and hand him the reins. Your place among the Horsemen goes back to Mandi with it.",
          fx: (p, ctx) => { if (p.gear && p.gear.mount === "horse") p.gear.mount = null; return more(p, ctx, { unflag: "ss_ab_monundi", honor: -2, trait: "cautious" }); } },
        { t: "Ride to the king's marshal instead", check: { s: "riding", s2: "intrigue", d: 46 },
          win: { r: "The king's men count the names you give them and pay in salt bars. The Mandari will learn of it in time. Southern lords keep long accounts.",
            fx: (p, ctx) => say(more(p, ctx, { favor: 6, coin: 20, honor: -6 }), bond(p, "CHR-0575", "enemy", -40)) },
          lose: { r: "The marshal already knows about the muster. He writes your name on both lists, to be safe.",
            fx: { favor: 1, happy: -3, trait: "paranoid" } } },
      ],
    },
    // arc: mra_ab_rodemonundi -> the king's clerks have a list
    {
      id: "mra_ab_monundi_list",
      title: "The king's list",
      cond: (p, C) => C.realm(p, "POL-22") && C.adult(p) && C.flag(p, "mra_ab_rodemonundi") && A.S.year - p.flags.mra_ab_rodemonundi >= 2,
      w: 3, once: true,
      setup: (p, ctx) => { if (!fresh(p, "mra_ab_monundi_list")) ctx.skip = 1; },
      text: "The muster at Mandi came to nothing, that time. But the king's clerks have been to Mandi since, and they have a list of the Horsemen of the Monundi who rode that night. Your name is on it. A royal clerk is offering a sealed pardon to any rider who names three others.",
      choices: [
        { t: "Name three riders and take the pardon",
          r: "Three names, riders you rode beside in the dark at Mandi. The pardon is sealed in red wax. You keep it in your shirt and stay out of horse country.",
          fx: { favor: 5, honor: -10, unflag: "ss_ab_monundi", newRel: { type: "enemy", op: -30 } } },
        { t: "Refuse, and ride south to Mesfin Mandari",
          r: "Mesfin takes you into his household as a rider. You are safe in the south, as long as the south is safe.",
          fx: (p, ctx) => say(more(p, ctx, { favor: -6, honor: 4, job: "mercenary", deed: "Refused the king's pardon for the Mandi muster" }), bond(p, "CHR-0575", "friend", 25)) },
        { t: "Pay the clerk to smudge your name", req: p => p.coin >= 60,
          r: "Sixty salt bars, and your name is a blot. The clerk says it will need sixty more next year, because ink fades.",
          fx: (p, ctx) => { addDebt(p, 60); return more(p, ctx, { coin: -60, honor: -2 }); } },
      ],
    },
  ]);
})();
