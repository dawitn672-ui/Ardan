// Adventure and trade memories: callbacks for 33 flags the release sets on the road, at sea, in the wild and in the
// workshop, and never reads again. Every callback reads its setter's flag in cond (C.flag + years since), recalls the
// original moment concretely (the place, the person's role, the act) and poses a new decision with a real tradeoff.
// Some choices set a mat_ flag that a second event reads years later (2-step arcs). See README.md for the tables.
(function () {
  const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
    "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  const num = n => (n >= 0 && n <= 20 ? NUM[n] : String(n));
  const since = (p, f) => Math.max(0, A.S.year - (+p.flags[f] || A.S.year));
  const alive = id => { const k = id && A.P(id); return k && k.alive ? k : null; };
  const adj = k => A.age(k) * 16 / GD.RACES[k.race].adult;
  // someone the engine linked to you in the year the memory was made
  const linkedIn = (p, types, year, test) => {
    const hit = A.relsOf(p, types).find(x => x.p.alive && x.r.since === year && (!test || test(x.p)));
    return hit ? hit.p : null;
  };
  const kidsAged = (p, lo, hi) => (p.children || []).map(id => A.P(id)).filter(k => k && k.alive && adj(k) >= lo && adj(k) < hi);
  // which setter event made the memory: the one the player last saw in the year the flag was set
  const pathOf = (p, flag, ids) => { const y = +p.flags[flag], ev = p.flags.ev || {}; return ids.find(id => ev[id] === y) || null; };
  const work = (p, re) => (p.works || []).find(w => re.test(w.t)) || null;
  const who = (p, key) => alive(p.flags[key]);
  // a new person who fits the scene; o: { sex, ageAdj, race, realm, status, occ }
  const mk = (p, o) => {
    o = o || {};
    const race = o.race && GD.RACES[o.race] ? o.race : p.race, R = GD.RACES[race], realm = o.realm || p.realm;
    const sex = o.sex || (A.chance(0.5) ? "M" : "F"), status = o.status || "peasant";
    const cult = race === p.race && realm === p.realm ? p.cult : A.cultureFor(race, realm);
    const age = Math.max(1, Math.round((o.ageAdj != null ? o.ageAdj : A.C.ageAdj(p)) * R.adult / 16));
    const k = A.newPerson({ given: A.givenName(cult, sex), sex, race, realm, cult, faith: A.faithFor(race, realm), born: A.S.year - age, status, home: p.home });
    const fn = A.familyName({ cult, realm, status, home: p.home, sex });
    k.sur = fn.sur; k.surMode = fn.mode;
    k.occ = o.occ || (A.isAdult(k) ? A.pick(A.OCC[status] || A.OCC.peasant) : "a child of " + A.provName(p.home));
    return k;
  };
  const fx = (p, ctx, o) => A.applyFx(p, o, ctx) || "";
  const keep = (key, o) => (p, ctx) => { p.flags[key] = ctx.pid; return fx(p, ctx, o); };
  const TEMPLE = { "REL-01": "temple", "REL-02": "church", "REL-03": "hall", "REL-04": "grove-house", "REL-05": "Carving Hall", "REL-06": "monastery",
    "REL-07": "house of prayer", "REL-08": "flood temple", "REL-09": "ancestor house", "REL-10": "temple", "REL-11": "shrine", "REL-12": "hall", "REL-14": "shrine" };
  const temple = p => TEMPLE[p.faith] || "temple";
  const CRAFTS = ["smith", "mason", "weaver", "bowyer", "carpenter", "artist", "cook", "engineer"];
  const beastNear = p => { const n = A.beastsNear(p).filter(id => A.BEASTS[id] && A.BEASTS[id].hp <= 260); return n.length ? A.pick(n) : "CRE-21"; };
  const beastName = id => { const c = LORE.creatures.find(x => x.id === id), n = c ? c.name.replace(/^The /, "") : "wolf"; return (/^[AEIOU]/.test(n) ? "an " : "a ") + n; };

  A.defEvents([
    // ================================================================ av_secret (av_inn_stranger: "Take it, then open it")
    {
      id: "mat_reeve_list", title: "The reeve on the list", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_secret") && A.S.year - p.flags.av_secret >= 5 && C.adult(p) && !p.flags.unfree && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { ageAdj: 48, status: "gentry", occ: "steward of the crown lands" }).id; },
      text: "A stranger once paid you to carry a sealed packet, and you opened it on the road. Inside was a list of names and sums: bribes paid to a royal reeve. You resealed it and kept a copy. The reeve was {them}. Today {theyHe} rides into {home} as steward of all the crown lands in the shire. Your copy is still sewn into an old pack.",
      choices: [
        { t: "Send {themHim} one page of it, unsigned", check: { s: "intrigue", s2: "int", d: 48 },
          win: { r: "A purse comes back by the same carrier, with no letter in it. It will come every year now, and so will the steward's wish to know your name.",
            fx: keep("mat_reeve_who", { coin: 60, secret: 1, flag: "mat_reeve_bled" }) },
          lose: { r: "The carrier is followed home. Two men call at dusk, take the copy from your pack and leave you a cracked rib to remember them by.",
            fx: { health: -12, cause: "a beating", wound: "broken_ribs", them: { type: "enemy", op: -40, back: "enemy" } } } },
        { t: "Carry the copy to the crown's justices", check: { s: "persuasion", s2: "wil", d: 50 },
          win: { r: "The justices read it twice and send for the old account rolls. {them} is stripped of the steward's chain by midsummer. Your name is in the judgment, which is not always a comfort.",
            fx: { fame: 2, honor: 4, favor: 4, deed: "Brought down a crooked crown steward", them: { type: "enemy", op: -60, back: "enemy" } } },
          lose: { r: "The justices dine with the steward. Your copy is called a forgery, and you pay twenty suns for slander.",
            fx: { coin: -20, honor: 2, happy: -6, them: { type: "enemy", op: -50, back: "enemy" } } } },
        { t: "Burn the copy. Old paper, old trouble", r: "It burns slowly, being good paper. You watch until the last name curls. If {them} ever comes asking, there is nothing left to find.",
          fx: { wil: 0.5, trait: "cautious" } },
      ],
    },
    {
      id: "mat_reeve_men", title: "The steward's men", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_reeve_bled") && A.S.year - p.flags.mat_reeve_bled >= 3 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { const k = who(p, "mat_reeve_who"); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; ctx.yrs = num(since(p, "mat_reeve_bled")); },
      text: "For {yrs} years a purse has come from {them}, steward of the crown lands, by a carrier who asks no questions. This year the carrier brings no purse. Instead two of the steward's men wait at your door at dusk, very polite, and ask you to walk with them to {theirHis} house. They do not say what about.",
      choices: [
        { t: "Go with them, and leave the copy hidden", check: { s: "deception", s2: "wil", d: 50 },
          win: { r: "{them} pours wine and talks about rents. Then {theyHe} offers terms: no more purses, and the rent on your house forgiven while {theyHe} holds office. Neither of you mentions paper.",
            fx: { coin: 30, unflag: "mat_reeve_bled", them: { type: "rival", op: 5, back: "rival" } } },
          lose: { r: "{them} has already found the carrier. The questions are asked in a cellar, and the copy is in the fire before morning. You walk home on your own feet, just.",
            fx: { health: -15, cause: "a beating", wound: "broken_nose", unflag: "mat_reeve_bled", them: { type: "enemy", op: -40, back: "enemy" } } } },
        { t: "Slip out the back and ride for the justices", check: { s: "riding", s2: "int", d: 48 },
          win: { r: "Two nights in the saddle with the copy against your skin. The justices take it this time: a steward who sends men after a blackmailer has something to hide. {them} loses the chain.",
            fx: { fame: 2, honor: 2, deed: "Brought down a crooked crown steward", unflag: "mat_reeve_bled", them: { type: "enemy", op: -60, back: "enemy" } } },
          lose: { r: "The steward's men know the roads better than you. They take the copy at the first ford, and your horse with it.",
            fx: { coin: -30, health: -6, cause: "a fall at a ford", unflag: "mat_reeve_bled", them: { type: "enemy", op: -40, back: "enemy" } } } },
        { t: "Leave the copy with a friend, then go", r: "You tell the steward plainly where the copy is and what happens if you do not come home. {theyHe} does the sums, as reeves do. You come home. The purses stop.",
          fx: { unflag: "mat_reeve_bled", wil: 1, trait: "paranoid", them: { type: "enemy", op: -20, back: "enemy" } } },
      ],
    },

    // ================================================================ av_neckbribe (av_grey_ferry: "Listen to the gossip on deck")
    {
      id: "mat_neck_bales", title: "Forty bales for the Neck", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_neckbribe") && A.S.year - p.flags.av_neckbribe >= 2 && C.adult(p) && !p.flags.unfree && !p.prison && C.realm(p, "POL-14", "POL-15", "POL-31", "POL-25"),
      setup: (p, ctx) => { ctx.pid = mk(p, { ageAdj: 45, status: "merchant", occ: "a wool factor" }).id; },
      text: "{them}, a wool factor, has forty bales to send over the Neck road, and three toll-stations will each take a tenth. You know which one takes bribes. A Velgrad toll-clerk told the whole deck, once, on the Grey Channel ferry, while the ferry holders argued over the take. {them} offers you a fifth of whatever you save {themHim}.",
      choices: [
        { t: "Take the bales through the leaky station yourself", check: { s: "intrigue", s2: "trade", d: 45 },
          win: { r: "The sergeant counts the bales, counts your coins, and counts the bales again, lower. {them} saves a hundred and fifty suns and pays you thirty, and asks if you are free next month.",
            fx: { coin: 30, skill: { intrigue: 2 }, flag: "mat_neck_runner", them: { type: "friend", op: 20, back: "friend" } } },
          lose: { r: "The station has a new sergeant, a dry one. He takes four bales as a fine and writes your name in his book.",
            fx: { honor: -2, happy: -4, them: { type: "acquaint", op: -20, back: "acquaint" } } } },
        { t: "Sell {themHim} the secret, and stay home", r: "Twenty suns for one sentence. {them} writes it on the back of a bill. Now it is {theirHis} secret too, and {theyHe} is a man who talks over dinner.",
          fx: { coin: 20, unflag: "av_neckbribe", them: { type: "acquaint", op: 10, back: "acquaint" } } },
        { t: "Tell the Velgrad toll-master which station leaks", check: { s: "persuasion", s2: "etiquette", d: 50 },
          win: { r: "The toll-master thanks you in writing and turns the sergeant out of his post. Every carter on the Neck road knows who talked.",
            fx: { honor: 3, fame: 1, coin: 15, deed: "Exposed a crooked toll-station on the Neck road", newRel: { type: "enemy", op: -40 } } },
          lose: { r: "The toll-master is the sergeant's uncle. He thanks you warmly, and the sergeant hears of it by evening.",
            fx: { happy: -4, newRel: { type: "enemy", op: -40 } } } },
      ],
    },
    {
      id: "mat_neck_box", title: "The other way", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_neck_runner") && A.S.year - p.flags.mat_neck_runner >= 2 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { sex: "M", ageAdj: 40, occ: "sergeant of a Neck road toll-station" }).id; },
      text: "For two years you have run bales through the Neck road station whose sergeant takes coin. Tonight the sergeant, {them}, sits down across from you and does not take coin. {theyHe} wants a small iron-bound box carried the other way, into Velgrad, sealed, no questions. Forty suns. {theyHe} says it is the least you can do.",
      choices: [
        { t: "Carry the box, and ask nothing", check: { s: "stealth", s2: "ins", d: 48 },
          win: { r: "You hand it to a chandler in Velgrad who weighs it in his palm and smiles. Forty suns, and the sergeant's station is yours to use for as long as he lasts.",
            fx: { coin: 40, secret: 1, them: { type: "friend", op: 25, back: "friend" } } },
          lose: { r: "Velgrad riders stop you at the border stone and open it: clipped silver, a coiner's work. You spend a year explaining.",
            fx: { prison: 1, why: "carrying clipped coin", them: { type: "rival", op: -10, back: "rival" } } } },
        { t: "Refuse, and find another road for your bales", r: "{them} shrugs. The next week a bale of yours is found to be short, and the fine is heavy. You take the long road through the hills after that.",
          fx: { coin: -15, unflag: "mat_neck_runner", them: { type: "enemy", op: -30, back: "enemy" } } },
        { t: "Carry the box straight to the Velgrad toll-master", check: { s: "persuasion", s2: "wil", d: 52 },
          win: { r: "The toll-master opens it on his table: clipped silver. The sergeant hangs at his own toll-bar. Carters who used his station stop greeting you.",
            fx: { honor: 3, fame: 2, deed: "Gave up a coiner on the Neck road", unflag: "mat_neck_runner", them: { type: "enemy", op: -80, back: "enemy" } } },
          lose: { r: "The toll-master asks how a wool runner knew where to bring it. You pay a heavy fine, and your bales are searched for a year.",
            fx: { coin: -30, unflag: "mat_neck_runner", them: { type: "enemy", op: -50, back: "enemy" } } } },
      ],
    },

    // ================================================================ av_forger (av_lost_pass or av_crime_exchange)
    {
      id: "mat_forger_paper", title: "A freedman's paper", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_forger") && A.S.year - p.flags.av_forger >= 4 && C.adult(p) && C.literate(p) && !p.prison,
      setup: (p, ctx) => {
        const path = pathOf(p, "av_forger", ["av_lost_pass", "av_crime_exchange"]);
        ctx.how = path === "av_crime_exchange" ? "You once passed a forged bill at a small counting-house, and the clerk checked the seal, the hand and the date, and paid out sixty suns."
          : path === "av_lost_pass" ? "You once made your own letter of passage, with a seal pressed from a pewter button, and the sergeant at the bridge-gate let you through."
            : "You once forged a paper well enough to pass a careful eye.";
        ctx.pid = mk(p, { sex: "F", ageAdj: 40, occ: "a carter's widow" }).id;
      },
      text: "{how} {them}, a carter's widow, has heard about your hand. Her son was sold for his father's debts and has run home. She wants a freedman's paper for him, with a magistrate's seal, before the buyer's men come.",
      choices: [
        { t: "Make the paper, and take nothing for it", check: { s: "deception", s2: "craft", d: 50 },
          win: { r: "Three evenings practising on scraps, then the real thing. The seal is a clever lie in good wax. Her son walks the road in daylight with it in his shirt.",
            fx: keep("mat_forged_who", { honor: 2, skill: { deception: 2 }, flag: "mat_forged_freedom", them: { type: "friend", op: 35, back: "friend" } }) },
          lose: { r: "The wax cracks under the seal. You burn it, and the next, and tell her your hand is not good enough. The buyer's men take her son at dawn.",
            fx: { happy: -8, wil: 1, them: { type: "acquaint", op: -10, back: "acquaint" } } } },
        { t: "Make it, for thirty suns", check: { s: "deception", s2: "craft", d: 50 },
          win: { r: "She pays with her mother's ring, eyes on the floor. The paper is good. You both know what it cost.",
            fx: keep("mat_forged_who", { coin: 30, honor: -3, flag: "mat_forged_freedom", them: { type: "acquaint", op: -5, back: "acquaint" } }) },
          lose: { r: "The seal smears. You keep the ring anyway, for your trouble. The buyer's men take her son at dawn.",
            fx: { coin: 30, honor: -6, trait: "greedy", them: { type: "enemy", op: -40, back: "enemy" } } } },
        { t: "Refuse. Forgery is a hanging matter", r: "She goes without a word. Her son is taken back at dawn, and she does not greet you at the well again.",
          fx: { happy: -4, them: { type: "enemy", op: -25, back: "enemy" } } },
      ],
    },
    {
      id: "mat_forged_court", title: "Your own hand", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_forged_freedom") && A.S.year - p.flags.mat_forged_freedom >= 3 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { const k = who(p, "mat_forged_who"); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "The freedman's paper you forged for {them}'s son has come before a magistrate. The buyer's heir found the boy, a grown man now with a trade, and claims him. The magistrate wants the clerk who wrote the paper to come and swear to it. {them} stands at your door with her shawl over her head and says nothing.",
      choices: [
        { t: "Go, and swear to your own hand", check: { s: "deception", s2: "wil", d: 52 },
          win: { r: "You swear on the book that you wrote what the magistrate's office told you to write. The magistrate cannot remember whether it did. The son walks out free.",
            fx: { piety: -3, deed: "Swore a forged paper true, and kept a man free by it", them: { type: "bestfriend", op: 40, back: "bestfriend" } } },
          lose: { r: "The magistrate's own clerk lays your hand beside the paper. You are taken from the stand to the cells.",
            fx: { prison: 2, why: "forgery", honor: -4, them: { type: "friend", op: 20, back: "friend" } } } },
        { t: "Stay away. The paper must stand alone", r: "Without a witness the paper is only paper. The son is handed to the heir. {them} does not come to your door again.",
          fx: { happy: -6, them: { type: "enemy", op: -40, back: "enemy" } } },
        { t: "Buy the heir off before the hearing", req: p => p.coin >= 80, r: "Eighty suns, paid in a lawyer's back room, and the heir withdraws the claim with a cough. You are poorer, and nobody had to swear.",
          fx: { coin: -80, honor: 2, them: { type: "bestfriend", op: 30, back: "bestfriend" } } },
      ],
    },

    // ================================================================ av_courier (av_courier: "Ride on, letter unread")
    {
      id: "mat_courier_bid", title: "A sealed bid", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_courier") && A.S.year - p.flags.av_courier >= 3 && C.adult(p) && !p.flags.unfree && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { ageAdj: 50, status: "merchant", occ: "a cloth merchant" }).id; },
      text: "{them} is the merchant whose letter you once rode through in four days, not seven, past a pleasant man in a common room who offered forty suns to read it. {theyHe} has not forgotten. Now a sealed bid must reach the wool sale at {capital}: three hundred bales, and every rival house would pay to see the figure. Twenty suns to carry it.",
      choices: [
        { t: "Carry it, and sleep with it under your head", check: { s: "riding", s2: "sta", d: 48 },
          win: { r: "You hand it to the sale clerk with the seal whole. {them} wins the clip by a sun a bale, and starts calling you {theirHis} rider.",
            fx: keep("mat_courier_who", { coin: 20, skill: { riding: 2 }, flag: "mat_courier_trusted", them: { type: "friend", op: 30, back: "friend" } }) },
          lose: { r: "A lamed horse and a day lost. The bids are opened before you arrive. {them} pays you anyway, which is somehow worse.",
            fx: { coin: 10, happy: -4, them: { type: "acquaint", op: -10, back: "acquaint" } } } },
        { t: "Show the figure to a rival house first", r: "A rival factor pays a hundred suns for a look and a fresh seal. {them} loses the clip by a sun a bale and never learns why.",
          fx: { coin: 100, honor: -6, trait: "deceitful", them: { type: "acquaint", op: 5, back: "acquaint" } } },
        { t: "Turn it down. You are no one's rider now", r: "{them} sends a boy instead. The boy is a day late, and {them} does not ask you again.",
          fx: { wil: 0.5, them: { type: "acquaint", op: -15, back: "acquaint" } } },
      ],
    },
    {
      id: "mat_courier_relay", title: "Fresh horses every twenty miles", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_courier_trusted") && A.S.year - p.flags.mat_courier_trusted >= 4 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { const k = who(p, "mat_courier_who"); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "{them} has grown fat on the wool trade and wants a chain of riders: fresh horses every twenty miles from {home} to {capital}, letters in two days, and a share for whoever runs it. {theyHe} puts up the horses. You would put up a hundred suns and your name. Other houses will try to buy your riders, as they once tried to buy you.",
      choices: [
        { t: "Put in a hundred suns, and run it", req: p => p.coin >= 100, check: { s: "logistics", s2: "riding", d: 50 },
          win: { r: "Six stages, twelve horses and riders who know your temper. By the second winter the relay has paid your hundred back and more. Merchants start calling you the Post-Master.",
            fx: { coin: 60, epithet: "the Post-Master", them: { type: "bestfriend", op: 25, back: "bestfriend" } } },
          lose: { r: "A rider sells a letter at the third stage, and two houses sue {them} for it. The relay is wound up, and your hundred goes with it.",
            fx: { coin: -100, them: { type: "rival", op: -20, back: "rival" } } } },
        { t: "Ride the first stage, for wages only", r: "Steady wages, a good horse, the same road every week. After a year you stop seeing it.",
          fx: { coin: 25, skill: { riding: 3 }, sta: 0.5, them: { op: 10 } } },
        { t: "Warn {themHim} off: riders can be bought", r: "{theyHe} hears you out and builds it anyway, with a cousin. Within a year the cousin's riders are selling copies in {capital}.",
          fx: { int: 0.3, them: { type: "acquaint", op: -10, back: "acquaint" } } },
      ],
    },

    // ================================================================ av_traveled (av_wanderjahr or av_teen_runaway_sea)
    {
      id: "mat_road_child", title: "The look you had", w: 2, once: true,
      cond: (p, C) => C.flag(p, "av_traveled") && A.S.year - p.flags.av_traveled >= 8 && C.adult(p) && !p.prison,
      setup: (p, ctx) => {
        const sea = pathOf(p, "av_traveled", ["av_teen_runaway_sea", "av_wanderjahr"]) === "av_teen_runaway_sea";
        ctx.went = sea ? "you ran down to the harbor and shipped as a ship's boy for a hammock and a sun a month"
          : "a tinker at the well talked about the sea and the deserts, and you took to the road";
        const kid = kidsAged(p, 14, 18)[0];
        if (kid) { ctx.pid = kid.id; ctx.whose = kid.sex === "F" ? "your own daughter" : "your own son"; }
        else { ctx.pid = mk(p, { ageAdj: 15, occ: "a youth of " + A.provName(p.home) }).id; ctx.whose = "a neighbour's child"; }
      },
      text: "{them}, {whose}, has the look you had at that age, the year {went}. Now {theyHe} sits on your step and asks about the road. A wool train leaves {home} in three days for the coast, and the carters want someone young to mind the mules.",
      choices: [
        { t: "Give {themHim} your old knife and a list of barns", r: "{theyHe} leaves at dawn with your knife in {theirHis} belt and does not look back, which is right. You find you have been holding your breath.",
          fx: keep("mat_road_who", { flag: "mat_sent_road", happy: -2, them: { op: 25 } }) },
        { t: "Tell {themHim} about the hunger and the cold", r: "You tell it all: barns with rats, masters who did not pay, a night on a hillside in sleet. {them} stays, and never asks again. You are not sure you did right.",
          fx: { wil: 0.5, them: { op: -10 } } },
        { t: "Find {themHim} a place in a workshop here", check: { s: "persuasion", s2: "trade", d: 45 },
          win: { r: "A cooper takes {themHim} on, for a fee you pay. {them} is safe, and bored, and blames you for both.", fx: { coin: -15, them: { op: 5 } } },
          lose: { r: "The cooper says no. Two nights later {them} goes with the wool train anyway, without your knife.",
            fx: keep("mat_road_who", { flag: "mat_sent_road", happy: -4, them: { op: -15 } }) } },
      ],
    },
    {
      id: "mat_road_return", title: "Brown as a nut", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_sent_road") && A.S.year - p.flags.mat_sent_road >= 3 && C.adult(p),
      setup: (p, ctx) => { const k = who(p, "mat_road_who"); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; ctx.yrs = num(since(p, "mat_sent_road")); },
      text: "{them} comes back up the {home} road after {yrs} years, brown as a nut, with a foreign word for everything and a scar {theyHe} will not explain. {theyHe} has brought you a knife from the coast, better than any made here. {theyHe} also owes a ship's master forty suns, and the master is in port.",
      choices: [
        { t: "Pay the forty suns", req: p => p.coin >= 40, r: "You pay the master on the quay. {them} watches the money go and is quiet the whole way home. In spring {theyHe} asks you to teach {themHim} your trade.",
          fx: { coin: -40, them: { op: 30 } } },
        { t: "Let {themHim} work it off at sea", r: "{theyHe} signs on for another voyage to clear the debt. At the gate {theyHe} hugs you hard, the way people do who expect to be gone a long time.",
          fx: { happy: -4, wil: 0.5, them: { op: 10 } } },
        { t: "Go down to the quay and bargain", check: { s: "persuasion", s2: "sea", d: 48 },
          win: { r: "The master knows a hard bargain when he hears one and halves the debt. {them} tells everyone in {home} about it, twice.",
            fx: { coin: -20, skill: { persuasion: 2 }, them: { op: 20 } } },
          lose: { r: "He will not bargain with a landsman. {them} sails on the tide to work it off.", fx: { happy: -5, them: { op: -5 } } } },
      ],
    },
    {
      id: "mat_note_home", title: "The note", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_traveled") && A.S.year - p.flags.av_traveled >= 6 && C.adult(p) && !p.prison && (p.flags.ev || {}).av_teen_runaway_sea === p.flags.av_traveled,
      setup: (p, ctx) => { const mo = alive(p.parents && p.parents[1]); if (!mo) { ctx.skip = 1; return; } ctx.pid = mo.id; },
      text: "You left for the sea on the night tide as a ship's boy, with a note for your mother that you could not really write. Word comes from her house now: {them} is failing, and asks whether you will come before the winter. She never answered the note. Perhaps she never could read it either.",
      choices: [
        { t: "Go to her, whatever it costs", r: "She has kept the note in her prayer-book all these years. It says GON TO SE and a word neither of you can read now. She laughs until she coughs.",
          fx: { coin: -15, perf: -5, happy: 4, them: { op: 40 } } },
        { t: "Send money, and a letter in a scribe's hand", r: "A scribe on the quay writes it for two pence: you are well, you are sorry, you send ten suns. You will never know who read it to her.",
          fx: { coin: -10, happy: -2, them: { op: 10 } } },
        { t: "Stay with the ship. She knows where you went", r: "You sail on the tide again. Somewhere off the cape you remember the shape of her door, and then there is a sail to reef.",
          fx: { wil: 1, happy: -4, trait: "stoic", them: { op: -15 } } },
      ],
    },

    // ================================================================ av_opened_delve (av_wild_delve: "Find the hidden latch")
    {
      id: "mat_delve_steel", title: "The clan mark", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_opened_delve") && A.S.year - p.flags.av_opened_delve >= 3 && C.adult(p) && !C.race(p, "dwarf") && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { race: "dwarf", ageAdj: 50, status: "artisan", occ: "a Law-Carver of the holds" }).id; },
      text: "A dwarf in a grey travelling hood is asking in {home} after whoever sold three ingots of dwarf steel, years back. They carry the mark of a clan whose delve was sealed by its own people. You found that door behind a fall of ivy, pressed the stone under the moss, and walked out of the cold halls with them. {them} is polite, and carries a carved staff.",
      choices: [
        { t: "Take {themHim} to the door", r: "At the ivy {them} reads the oath on the lintel aloud. The clan died of plague, and asked that no hand open what grief had closed. You help {themHim} reseal it, and {theyHe} writes your name in a small book.",
          fx: { piety: 2, honor: 2, oweThem: 1, them: { type: "friend", op: 20, back: "friend" } } },
        { t: "Say you bought them from a pedlar", check: { s: "deception", s2: "ins", d: 48 },
          win: { r: "{them} thanks you, writes 'a pedlar' in a small book, and walks on up the road. {theyHe} looks back once.",
            fx: { skill: { deception: 2 }, them: { type: "acquaint", op: -5, back: "acquaint" } } },
          lose: { r: "{them} has already spoken to the smith who bought them from you. {theyHe} writes your name in the small book, in red, and leaves without another word.",
            fx: { honor: -4, deed: "Named a grave-robber by the Law-Carvers", them: { type: "enemy", op: -40, back: "enemy" } } } },
        { t: "Pay the dead clan for its steel", req: p => p.coin >= 90, r: "Ninety suns on the table: what the steel fetched you. {them} takes it as a grave-gift and cuts one line on {theirHis} staff. Among dwarves that is the whole of the matter.",
          fx: { coin: -90, honor: 4, deed: "Paid a dead dwarf clan for its steel", them: { type: "friend", op: 40, back: "friend" } } },
      ],
    },

    // ================================================================ av_bounty_beast (av_wild_village_bounty: "Take the bounty and hunt it")
    // The release stores the bounty in this flag, not the year, so timing reads the year the player saw the setter.
    {
      id: "mat_bounty_goats", title: "Asked for by name", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_bounty_beast") && !!(p.flags.ev || {}).av_wild_village_bounty && A.S.year - p.flags.ev.av_wild_village_bounty >= 3 && C.adult(p) && !p.flags.unfree && !p.ruler && !p.prison,
      setup: (p, ctx) => {
        const b = +p.flags.av_bounty_beast;
        ctx.paid = b > 0 && b < 200 ? b + " suns" : "good money";
        ctx.beast = beastNear(p); ctx.bn = beastName(ctx.beast); ctx.offer = String(A.ri(25, 45));
      },
      text: "A boy on a pony asks for you by name in {home}. His village is losing goats, and the headman has heard of you from the village that once paid {paid} for a hide. That time you went out at dusk to the sheepfold where the last sheep died. This headman offers {offer} suns. He says it is {bn}.",
      choices: [
        { t: "Go tonight, and wait by the goat pen", r: "You take half the money in advance and go out at dusk, as before.",
          fx: (p, ctx) => fx(p, ctx, { coin: Math.round(+ctx.offer / 2), deed: "Hunted a goat-killer for a village bounty", beast: { place: "a goat pen at dusk", title: "The second bounty" } }) },
        { t: "Track it for three days first", check: { s: "tracking", s2: "survival", d: 50 },
          win: { r: "The tracks are an old wolf's, with a broken tooth, whatever the headman says. You end it at its den, and the village pays in full.",
            fx: (p, ctx) => fx(p, ctx, { coin: +ctx.offer, fame: 1, skill: { tracking: 3 }, deed: "Hunted a goat-killer for a village bounty" }) },
          lose: { r: "The trail goes into the rocks and stays there. The goats keep dying, and the headman stops asking for you.",
            fx: { happy: -3, skill: { tracking: 1 } } } },
        { t: "Send the boy home with bread", r: "You give him bread for the road and nothing else. His village will find someone younger, or no one.", fx: { wil: 0.5, happy: -2 } },
      ],
    },

    // ================================================================ av_poacher (av_wild_poachers: "Help them carry it out for a share")
    {
      id: "mat_poacher_court", title: "The forest court", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_poacher") && A.S.year - p.flags.av_poacher >= 3 && C.adult(p) && !p.prison && !C.noble(p),
      setup: (p, ctx) => {
        const k = linkedIn(p, ["friend", "bestfriend"], +p.flags.av_poacher) || mk(p, { sex: "M", ageAdj: 35, occ: "a woodcutter" });
        ctx.pid = k.id;
      },
      text: "{them} is one of the three men you found gutting a stag in the lord's chase at first light. You carried a haunch out with them and ate venison all winter. Now the verderer's men have taken {themHim} with a snare in {theirHis} coat, and the forest court sits on Thursday. {theyHe} has not named you. Yet.",
      choices: [
        { t: "Swear {theyHe} was mending your fence that morning", check: { s: "deception", s2: "wil", d: 50 },
          win: { r: "The verderer does not believe you, and cannot prove otherwise. {them} keeps both hands, and owes you one of them.",
            fx: { piety: -2, owed: 1, them: { type: "bestfriend", op: 30, back: "bestfriend" } } },
          lose: { r: "The verderer has a boy who saw you both on the chase road. You pay a fine you cannot afford, and {them} loses the hand anyway.",
            fx: { coin: -20, honor: -3, happy: -6, them: { op: 15 } } } },
        { t: "Pay {theirHis} fine before the court sits", req: p => p.coin >= 30, r: "Thirty suns to the verderer's clerk, who writes it down as a forest amercement. {them} walks home whole, and does not quite meet your eye.",
          fx: { coin: -30, owed: 1, them: { type: "friend", op: 20, back: "friend" } } },
        { t: "Keep away from the court", r: "{them} loses the right hand on Thursday. {theyHe} does not name you, then or after. When you meet on the road, {theyHe} lifts the stump in greeting.",
          fx: { happy: -6, honor: -2, them: { type: "rival", op: -25, back: "rival" } } },
      ],
    },
    {
      id: "mat_verderer_coat", title: "A green coat", w: 2, once: true,
      cond: (p, C) => C.flag(p, "av_poacher") && A.S.year - p.flags.av_poacher >= 5 && C.adult(p) && !p.flags.unfree && !p.prison && !C.noble(p) && !p.mil,
      text: "The lord's verderer has died of a fever, and the steward wants a new one: a green coat, a horn, eight suns a quarter and a cottage at the chase gate. Someone has told him you know every deer path in that wood. You do. You learned them carrying a haunch out at first light with three men who owe you their hands.",
      choices: [
        { t: "Take the green coat, and keep the chase strictly", r: "You take the horn and the cottage. The first week you walk the paths you once crept along. The poachers of {home} know exactly what you know.",
          fx: { coin: 8, honor: 2, skill: { tracking: 2 }, flag: "mat_verderer" } },
        { t: "Take it, and look away for old friends", r: "You take the horn, and the three men get a quiet word about which paths you walk on which days. The venison keeps coming, and so do the questions.",
          fx: { coin: 8, honor: -2, skill: { tracking: 2 }, flag: "mat_verderer_soft" } },
        { t: "Turn it down. You know that wood too well", r: "The steward gives the coat to a cousin from {capital} who cannot tell a hart's track from a hind's. The deer of the chase have a good year.",
          fx: { happy: 2, wil: 0.5 } },
      ],
    },
    {
      id: "mat_verderer_boy", title: "A hind in a wire", w: 3, once: true,
      cond: (p, C) => ((C.flag(p, "mat_verderer") && A.S.year - p.flags.mat_verderer >= 2) || (C.flag(p, "mat_verderer_soft") && A.S.year - p.flags.mat_verderer_soft >= 2)) && C.adult(p),
      setup: (p, ctx) => {
        ctx.how = p.flags.mat_verderer_soft ? "You have looked away for old friends since you took the coat, and the snares have grown bolder."
          : "You have kept the chase strictly since you took the green coat, and the old poachers curse you by name.";
        ctx.pid = mk(p, { sex: "M", ageAdj: 13, occ: "a poacher's son" }).id;
      },
      text: "At first light you find a boy with a hind in a wire snare, in the chase where you once carried out a haunch. {how} The boy is {them}, son of one of the three men from that morning. The law says a hand. The steward says an example.",
      choices: [
        { t: "Take {themHim} to the steward", r: "The forest court is merciful to his age: a flogging and a brand on the thumb. His father stops greeting you on the road.",
          fx: { coin: 5, honor: 1, them: { type: "enemy", op: -50, back: "enemy" } } },
        { t: "Cut the wire and send {themHim} home", check: { s: "stealth", s2: "ins", d: 45 },
          win: { r: "The boy runs. The hind runs too, three-legged. Only the crows saw.", fx: { owed: 1, them: { type: "friend", op: 30, back: "friend" } } },
          lose: { r: "The steward's under-keeper is on the ridge. You lose the green coat and the cottage by Michaelmas.",
            fx: { happy: -5, coin: -8, them: { type: "friend", op: 30, back: "friend" } } } },
        { t: "Make {themHim} your under-keeper instead", r: "A poacher's boy knows a chase better than any steward's cousin. {them} takes the horn with a face like thunder, and by spring has caught two of {theirHis} own uncles.",
          fx: { skill: { command: 1 }, them: { type: "student", op: 20, back: "mentor" } } },
      ],
    },

    // ================================================================ av_aurochs_trail (av_wild_aurochs: "Remember the place for a pit trap")
    {
      id: "mat_aurochs_pit", title: "A bull for the beast-park", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_aurochs_trail") && A.S.year - p.flags.av_aurochs_trail >= 2 && C.adult(p) && !p.flags.unfree && !p.ruler && !p.prison && C.terr(p, "forest", "plains"),
      setup: (p, ctx) => { ctx.pid = mk(p, { sex: "M", ageAdj: 40, occ: "a lord's huntsman" }).id; ctx.yrs = num(since(p, "av_aurochs_trail")); },
      text: "You marked the trail {yrs} summers ago: black bulls in an oak glade, a head taller than any ox, the path they take to water. {them}, a lord's huntsman, has heard of it. His lord wants a live bull for the beast-park at {capital}, to show envoys, and will pay a hundred and twenty suns. A dead bull's horns and hide fetch forty.",
      choices: [
        { t: "Dig the pit and take a bull alive", check: { s: "tracking", s2: "str", d: 55 },
          win: { r: "A pit, a net of rope, two days of bellowing. The bull goes to {capital} in a cage on a wagon, and you go home with a hundred and twenty suns.",
            fx: { coin: 120, fame: 2, deed: "Took a black aurochs bull alive for a beast-park", them: { type: "friend", op: 20, back: "friend" } } },
          lose: { r: "The pit holds a cow, not the bull. The bull comes for her, and for you.",
            fx: { them: { op: -10 }, beast: { id: "CRE-20", place: "the edge of your pit", title: "The aurochs" } } } },
        { t: "Dig the pit and kill whatever falls in", r: "A young bull, dead by noon. Forty suns for hide and horns, and the village eats beef for a week. The old women say the black cattle are the last of something.",
          fx: { coin: 40, piety: -1, skill: { tracking: 2 }, deed: "Killed a black aurochs in a pit" } },
        { t: "Sell {them} the trail, and stay home", r: "{them} pays fifteen suns for a map scratched on bark. In the autumn you hear {theyHe} broke a leg in the glade.",
          fx: { coin: 15, them: { type: "acquaint", op: 5, back: "acquaint" } } },
        { t: "Leave the herd in peace", r: "You go back once, alone, and watch them from an oak all afternoon. They are still there.", fx: { happy: 3, wil: 0.5 } },
      ],
    },

    // ================================================================ av_outlaw_known (av_wild_charcoal: "Find out who the outlaw is")
    {
      id: "mat_outlaw_notice", title: "A notice on the church door", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_outlaw_known") && A.S.year - p.flags.av_outlaw_known >= 3 && C.adult(p) && !p.prison && !p.ruler,
      setup: (p, ctx) => { ctx.pid = mk(p, { sex: "M", ageAdj: 38, occ: "a charcoal burner" }).id; },
      text: "A notice is nailed to the church door in {home}: forty suns for a deserter who killed his sergeant. The priest reads the description aloud. You know the man. He was one of the charcoal burners in the forest clearing, black from hair to heel, and you picked him out by his soldier's calluses. He calls himself {them} now.",
      choices: [
        { t: "Lead the bailiff's men to the clearing", check: { s: "tracking", s2: "ins", d: 45 },
          win: { r: "They take him at the mounds at dawn, still black with soot. You are paid in the churchyard. The burners will not sell charcoal in {home} again.",
            fx: (p, ctx) => { const k = A.P(ctx.pid); if (k) A.kill(k, "hanged as a deserter", true); return fx(p, ctx, { coin: 40, honor: -2, deed: "Gave up a deserter for forty suns" }); } },
          lose: { r: "The clearing is empty, the mounds cold. Someone warned them. The bailiff's men want paying for their day.",
            fx: { coin: -5, happy: -3, them: { type: "enemy", op: -50, back: "enemy" } } } },
        { t: "Ride out and warn him", r: "He hears you out with a charcoal rake in his hands. Then he puts it down. 'I won't forget,' he says. By night the clearing is empty.",
          fx: keep("mat_outlaw_who", { flag: "mat_outlaw_warned", owed: 1, them: { type: "friend", op: 30, back: "friend" } }) },
        { t: "Leave the notice where it hangs", r: "It hangs there until the rain takes the ink. The forty suns go unclaimed. You think of it whenever you smell charcoal.", fx: { wil: 0.5 } },
      ],
    },
    {
      id: "mat_outlaw_repays", title: "Six men on the road", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_outlaw_warned") && A.S.year - p.flags.mat_outlaw_warned >= 3 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { const k = who(p, "mat_outlaw_who"); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "On the forest road five men step out of the trees with bows. The sixth is {them}, the deserter you rode out to warn about the notice on the church door. He leads them now. He tells them to lower their bows and asks you to sit at his fire. He needs salt, flints and arrowheads, and his men cannot go into town.",
      choices: [
        { t: "Buy what they need in {home}", check: { s: "stealth", s2: "trade", d: 45 },
          win: { r: "Salt, flints, two dozen arrowheads, bought in three shops on three days. {them} pays in venison and silver of uncertain origin.",
            fx: { coin: 15, owed: 1, them: { type: "bestfriend", op: 20, back: "bestfriend" } } },
          lose: { r: "The ironmonger wonders aloud why you need arrowheads, and the bailiff wonders with him.",
            fx: { prison: 1, why: "trading with outlaws", them: { op: 10 } } } },
        { t: "Ask him to leave the road instead", check: { s: "persuasion", s2: "diplomacy", d: 52 },
          win: { r: "He takes a long time to answer. In the spring the band breaks up, and {them} goes north to burn charcoal where no one knows his face.",
            fx: { honor: 2, deed: "Talked an outlaw band off the forest road", them: { type: "friend", op: 10, back: "friend" } } },
          lose: { r: "'The road is the only thing that's mine,' he says. You ride home with your purse, at least.", fx: { them: { op: -5 } } } },
        { t: "Refuse, and ride on", r: "He lets you go. The debt stands, he says, both ways now. You do not ride that road after dark again.",
          fx: { wil: 0.5, them: { op: -15 } } },
      ],
    },

    // ================================================================ av_wetwatch (av_crime_watchman: a gift, or a month's watching)
    {
      id: "mat_watch_staff", title: "A sergeant's price", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_wetwatch") && A.S.year - p.flags.av_wetwatch >= 4 && C.adult(p) && !p.prison && C.town(p),
      setup: (p, ctx) => {
        let k = linkedIn(p, ["friend", "bestfriend"], +p.flags.av_wetwatch);
        ctx.gift = k ? 1 : 0;
        if (!k) k = mk(p, { sex: "M", ageAdj: 35, occ: "a sergeant of the watch" }); else k.occ = "a sergeant of the watch";
        ctx.pid = k.id;
      },
      text: (p, ctx) => (ctx.gift
        ? "When {them} first walked your street, you paid {themHim} five suns a month and {theyHe} forgot your face. Wet as the harbor."
        : "When {them} first walked your street, you watched {themHim} for a month: {theyHe} drank at the Crooked Lamp and owed the dice-master. Wet, once you knew where to pour.")
        + " Now {theyHe} carries a sergeant's staff and has a sergeant's price: twenty suns a month, or a name each quarter for the hangman.",
      choices: [
        { t: "Pay the twenty, and keep working", req: p => p.coin >= 20, r: "{them} pockets it without looking. The price will rise again; prices do. For now your street stays dark when you need it dark.",
          fx: { coin: -20, perf: 4, them: { type: "friend", op: 10, back: "friend" } } },
        { t: "Give {themHim} a name: a rival fence's", r: "{them} takes a fence called the Owl at dawn, with all his stock. Your own trade doubles. So does what you know about yourself.",
          fx: { coin: 15, honor: -6, them: { type: "friend", op: 20, back: "friend" }, newRel: { type: "enemy", op: -40 } } },
        { t: "Go over {theirHis} head to the watch captain", check: { s: "persuasion", s2: "intrigue", d: 52 },
          win: { r: "The captain has been looking for a reason. {them} loses the staff and the street, and knows exactly whom to thank.",
            fx: { perf: 3, skill: { intrigue: 2 }, them: { type: "enemy", op: -50, back: "enemy" } } },
          lose: { r: "The captain takes {them}'s share too. You are arrested on the way home, for your trouble.",
            fx: { punish: "theft", them: { type: "enemy", op: -40, back: "enemy" } } } },
        { t: "Move your work to another quarter", r: "Fewer marks, a strange watch, a long walk home. {them} sends word that the price was negotiable.", fx: { perf: -4, happy: -2 } },
      ],
    },

    // ================================================================ av_castaway (av_sea_castaway: the signal fire, or a broken raft)
    {
      id: "mat_castaway_boots", title: "A double welt", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_castaway") && A.S.year - p.flags.av_castaway >= 2 && C.adult(p) && !p.prison && (C.coast(p) || C.town(p)),
      setup: (p, ctx) => { ctx.pid = mk(p, { sex: "F", ageAdj: 40, occ: "a sailor's wife" }).id; },
      text: "A woman at the fish stalls stops dead and stares at your feet. You still wear the boots from the island, where you had a knife, your shirt and a dead man's boots, and nothing else. She is {them}. She says she sewed those boots herself, with a double welt, for her husband the year his ship sailed. She is still waiting for it.",
      choices: [
        { t: "Tell her where you found them", r: "You tell her about the beach and the hill and the man who had no more use for his boots. She listens without a sound and thanks you. Within the month she is in black.",
          fx: keep("mat_widow_who", { honor: 2, happy: -3, flag: "mat_widow_told", them: { type: "friend", op: 20, back: "friend" } }) },
        { t: "Give her the boots, and say no more", r: "You walk home barefoot. She will wait a while longer, with the boots by her door. That is a kind of mercy, or the other thing.",
          fx: { honor: 1, happy: -1, them: { type: "acquaint", op: 25, back: "acquaint" } } },
        { t: "Say you bought them from a slop-seller", check: { s: "deception", s2: "ins", d: 40 },
          win: { r: "She looks at the welts again, then at you, and lets it go. You buy new boots that week.", fx: { coin: -3, honor: -2, skill: { deception: 1 } } },
          lose: { r: "'Liar,' she says, quite quietly. Every fishwife on the quay knows the story by dark.",
            fx: { fame: -1, honor: -3, them: { type: "enemy", op: -30, back: "enemy" } } } },
      ],
    },
    {
      id: "mat_widow_son", title: "His father's bones", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_widow_told") && A.S.year - p.flags.mat_widow_told >= 4 && C.adult(p) && !p.prison,
      setup: (p, ctx) => {
        const mom = A.P(p.flags.mat_widow_who); if (!mom) { ctx.skip = 1; return; }
        ctx.mom = mom.given;
        const k = mk(p, { sex: "M", ageAdj: 16, occ: "a ship's boy" }); k.sur = mom.sur; k.surMode = mom.surMode;
        ctx.pid = k.id;
      },
      text: "{them} is the son of {mom}, whose husband's boots you wore off the island. He has signed on a ship that will pass within a day's sail of it, and means to find his father's bones and bury them. He asks you to come and show him the hill where you kept your fire. The master will take you as a hand, for no wage.",
      choices: [
        { t: "Ship with him and find the hill", check: { s: "sea", s2: "survival", d: 50 },
          win: { r: "The same beach, the same spring, the black ring of your old fire on the hill. You find the bones in the scrub below it. {them} carries them home in a sea-chest.",
            fx: { wil: 1, honor: 3, fame: 1, deed: "Brought a drowned man's bones home from a desert island", them: { type: "friend", op: 40, back: "friend" } } },
          lose: { r: "Weather off the island for nine days, and the master will not risk the reef. You come home with nothing but a cough.",
            fx: { health: -8, cause: "a fever at sea", them: { op: 10 } } } },
        { t: "Draw him a chart of the beach and hill", r: "You draw it from memory on good paper: the beach, the hill, the spring. He takes it as if it were a relic.",
          fx: { int: 0.3, them: { type: "acquaint", op: 20, back: "acquaint" } } },
        { t: "Talk him out of it", check: { s: "persuasion", s2: "wil", d: 45 },
          win: { r: "He stays ashore and takes a place on the fishing boats. His mother sends you a pie every feast-day.", fx: { owed: 1, them: { op: 10 } } },
          lose: { r: "He goes anyway, angry, without your help.", fx: { happy: -3, them: { op: -10 } } } },
      ],
    },
    {
      id: "mat_castaway_smoke", title: "Smoke on a rock", w: 2, once: true,
      cond: (p, C) => C.flag(p, "av_castaway") && A.S.year - p.flags.av_castaway >= 5 && C.adult(p) && !p.prison && (C.coast(p) || C.job(p, "sailor") || C.job(p, "fish")),
      text: "You are aboard a coaster running along the shore when you see a thread of smoke on a rock where no one lives. You know that smoke. You kept one going on a hill, with a knife, your shirt and a dead man's boots, and watched sails pass. The master will not turn. The tide is with him, the cargo is late, and he does not like reefs.",
      choices: [
        { t: "Argue the master round", check: { s: "persuasion", s2: "sea", d: 50 },
          win: { r: "The master turns, cursing. On the rock is a man so burned and thin he cannot stand. He holds your hand all the way to port.",
            fx: (p, ctx) => { const k = mk(p, { sex: "M", ageAdj: 30, occ: "a castaway you took off a rock" }); ctx.pid = k.id; return fx(p, ctx, { fame: 2, honor: 3, deed: "Took a castaway off a rock", owed: 1, them: { type: "friend", op: 40, back: "friend" } }); } },
          lose: { r: "The master knocks you down on his own deck for arguing. The smoke falls astern.", fx: { health: -5, cause: "a blow", happy: -6 } } },
        { t: "Take the ship's boat at the change of watch", check: { s: "sea", s2: "str", d: 55 },
          win: { r: "You row alone through the surf and back with a man in the bottom of the boat. The master puts you both ashore at the next port, without pay.",
            fx: (p, ctx) => { const k = mk(p, { sex: "M", ageAdj: 30, occ: "a castaway you took off a rock" }); ctx.pid = k.id; return fx(p, ctx, { honor: 5, fame: 2, coin: -10, deed: "Took a castaway off a rock", owed: 1, them: { type: "bestfriend", op: 50, back: "bestfriend" } }); } },
          lose: { r: "The reef takes the bottom out of the boat. You swim back to the ship, bleeding, and the master stops the boat from your pay.",
            fx: { health: -12, cause: "the reef", wound: "deep_cut", coin: -15 } } },
        { t: "Let it go", r: "The smoke falls astern. You tell yourself a fishing boat will see it. Someone told himself that about you, once.", fx: { happy: -6, honor: -2 } },
      ],
    },

    // ================================================================ av_mutineer (av_sea_mutiny: "Join the mutiny")
    {
      id: "mat_mutiny_captain", title: "The captain in the boat", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_mutineer") && A.S.year - p.flags.av_mutineer >= 4 && C.adult(p) && !p.prison && (C.coast(p) || C.job(p, "sailor") || C.job(p, "pirate")),
      setup: (p, ctx) => {
        const mate = linkedIn(p, ["friend", "bestfriend"], +p.flags.av_mutineer);
        ctx.mate = mate ? mate.given : "";
        ctx.pid = mk(p, { sex: "M", ageAdj: 55, status: "merchant", occ: "a ship's captain" }).id;
      },
      text: (p, ctx) => "The captain you put over the side in the boat, with a cask of water, after he flogged a boy to death for a biscuit, did not die. {them} is in port, sober, with an admiralty clerk at his elbow and a list of the crew who rose that night. At the top is the mate they elected."
        + (ctx.mate ? " Below it is {mate}, who showed you the knife." : ""),
      choices: [
        { t: "Stand trial, and tell them about the boy", check: { s: "persuasion", s2: "wil", d: 52 },
          win: { r: "The court hears about the biscuit and the cup of water, and acquits the crew. {them} loses his ticket. Sailors buy you drinks in every port for a year.",
            fx: { fame: 3, honor: 3, deed: "Acquitted of mutiny before the admiralty court", them: { type: "enemy", op: -50, back: "enemy" } } },
          lose: { r: "The court hears that a captain is a captain. You get two years in the hulks.",
            fx: { prison: 2, why: "mutiny", them: { type: "enemy", op: -40, back: "enemy" } } } },
        { t: "Buy his silence", req: p => p.coin >= 80, r: "Eighty suns, and {them} remembers the boat differently. He signs a paper saying he left the ship of his own will. You keep a copy.",
          fx: { coin: -80, secret: 1, them: { type: "rival", op: -10, back: "rival" } } },
        { t: "Ship out tonight under another name", r: "You become someone else on the next tide, with a new name in the ship's book and the old one left on the clerk's list.",
          fx: { flag: "mat_false_name", wil: 1, happy: -3 } },
      ],
    },
    {
      id: "mat_old_name", title: "Your old name across the water", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_false_name") && A.S.year - p.flags.mat_false_name >= 3 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { sex: "M", ageAdj: 45, occ: "an old shipmate" }).id; },
      text: "You have sailed under another name since the admiralty clerk read out your old one. Tonight, on the quay, a voice calls the old name across the water. {them}, who stood watch with you on the ship where the crew rose, comes up grinning. He is loud, he is drunk, and he is glad to see you.",
      choices: [
        { t: "Embrace him, and take him somewhere quiet", r: "A back room, a jug, your new name told three times. He swears he will forget the old one. Drunk men swear well.",
          fx: { coin: -2, them: { type: "friend", op: 30, back: "friend" } } },
        { t: "Pretend you do not know him", check: { s: "deception", s2: "wil", d: 45 },
          win: { r: "'Sorry, friend.' He blinks, begs your pardon and staggers off. You do not see him again, and you still feel it.",
            fx: { happy: -3, them: { type: "acquaint", op: -20, back: "acquaint" } } },
          lose: { r: "He laughs and calls you a liar, using the old name twice more. Three men on the quay turn their heads.",
            fx: { fame: 1, unflag: "mat_false_name", trait: "paranoid", them: { type: "rival", op: -20, back: "rival" } } } },
        { t: "Take back your own name, here and now", r: "You tell him, and the quay, who you are. If the clerk's list is still read, let it be read. You sleep better than you have in years.",
          fx: { unflag: "mat_false_name", wil: 1.5, honor: 2, them: { type: "friend", op: 20, back: "friend" } } },
      ],
    },

    // ================================================================ av_corsair (av_sea_articles: "Make your mark" / "Ask about the cripple's share")
    {
      id: "mat_cripple_share", title: "Six hundred for a right arm", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_corsair") && A.S.year - p.flags.av_corsair >= 3 && C.adult(p) && !p.prison && (C.job(p, "pirate") || C.realm(p, "POL-33")),
      setup: (p, ctx) => { ctx.pid = mk(p, { ageAdj: 32, occ: "a corsair of Blackreef" }).id; },
      text: "{them} lost {theirHis} right arm taking the last prize. The Articles you put your mark to say six hundred for a right arm, five for a left, a hundred for an eye. The quartermaster says the chest is light this year and offers a hundred. The crew votes on the beach at dawn, and {them} has asked you to speak.",
      choices: [
        { t: "Speak for the full six hundred", check: { s: "persuasion", s2: "wil", d: 50 },
          win: { r: "'The Articles are the Articles,' you say, and keep saying it. The vote goes your way by four. {them} gets six hundred, and the quartermaster gets a grudge.",
            fx: { fame: 2, honor: 3, newRel: { type: "rival", op: -30 }, them: { type: "bestfriend", op: 40, back: "bestfriend" } } },
          lose: { r: "The crew votes with its own purses. {them} takes the hundred and a berth ashore.", fx: { happy: -3, them: { type: "friend", op: 20, back: "friend" } } } },
        { t: "Vote with the quartermaster: the chest is light", r: "Your own share is fatter by twenty suns. {them} does not speak to you again, and the one-armed sit together at the far fire.",
          fx: { coin: 20, honor: -4, them: { type: "enemy", op: -40, back: "enemy" } } },
        { t: "Make up the difference from your own share", r: "You put your share on the head of a barrel. The beach goes quiet. Then the quartermaster, shamed, finds the rest in the chest after all.",
          fx: { coinPct: -0.4, honor: 5, trait: "generous", them: { type: "bestfriend", op: 50, back: "bestfriend" } } },
      ],
    },
    {
      id: "mat_corsair_dice", title: "The dice before the raid", w: 2, once: true,
      cond: (p, C) => C.flag(p, "av_corsair") && A.S.year - p.flags.av_corsair >= 5 && C.adult(p) && C.job(p, "pirate") && !p.prison,
      text: "The Articles say the dice are thrown before every raid, and you have watched them thrown many times since you made your mark and poured wine to the Drowned Queen. Tonight they come up for a pilgrim ship bound for Solenne: slow, fat and full of the old and the sick. The captain says the Articles are the Articles.",
      choices: [
        { t: "Say the dice were crooked, and demand a new throw", check: { s: "gambling", s2: "persuasion", d: 52 },
          win: { r: "You find a shaved edge on the third die, or say you do. The crew votes to throw again, and the dice choose a salt-trader instead.",
            fx: { honor: 2, secret: 1, skill: { gambling: 2 } } },
          lose: { r: "The dice are fair, and the crew knows you said they were not. You sail with the raid, and no one sits with you at the fire.",
            fx: { fame: -1, happy: -4, newRel: { type: "rival", op: -25 } } } },
        { t: "Sail with the raid, and take your share", r: "The pilgrim ship strikes without a fight. Your share is sixty suns and a reliquary with a saint's finger in it. You sell the finger in Blackreef.",
          fx: { coin: 60, honor: -6, piety: -5, deed: "Took a pilgrim ship under the Articles" } },
        { t: "Warn the pilgrims, and leave the Brotherhood", r: "A fishing boat, a hard night's rowing, a word to the pilgrim master. The ship turns back. In Blackreef they cut your earring out and your name from the Articles.",
          fx: (p, ctx) => { if (p.job && p.job.c === "pirate") p.job = null; return fx(p, ctx, { honor: 5, piety: 3, wound: "ear", unflag: "av_corsair" }); } },
      ],
    },

    // ================================================================ av_redsail (av_sea_shareday: "Vote for Ima Redsail and the old ways")
    {
      id: "mat_redsail_cove", title: "Three ships in a cove", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_redsail") && A.S.year - p.flags.av_redsail >= 2 && C.adult(p) && !p.prison && (C.job(p, "pirate") || C.realm(p, "POL-33")),
      text: "On Share Day on the beach at Ratrock you voted for Ima Redsail and the old ways. She has lost every vote since, and has stopped counting them. She is fitting out three ships in a cove with no harbor-master, to take a Lucernan galley in the strait and break Nell Brine's toll for good. She remembers who stood up for her on the beach.",
      choices: [
        { t: "Sail with Ima", check: { s: "sea", s2: "melee", d: 52 },
          win: { r: "The galley strikes after one broadside. The strait talks of nothing else, and the Lucernan families talk of a price. Your share would buy a house.",
            fx: { coin: 120, fame: 3, honor: -2, flag: "mat_redsail_sailed" } },
          lose: { r: "The galley carries marines. You come back with Ima, half the crew and a cut that will not close cleanly.",
            fx: { coin: 20, health: -15, cause: "a boarding fight", wound: "deep_cut", flag: "mat_redsail_sailed" } } },
        { t: "Tell Nell Brine where the cove is", r: "Nell's ships close the cove at dawn. Ima gets a boat, a cask and a compass, by the Articles. Nell pays you well and trusts you exactly that far.",
          fx: { coin: 50, honor: -5, favor: 4, newRel: { type: "enemy", op: -50 } } },
        { t: "Wish her luck, and stay ashore", r: "She claps your shoulder and says nothing about it. When the news comes, you hear it at the share fire with everyone else.", fx: { happy: -2 } },
      ],
    },
    {
      id: "mat_redsail_price", title: "A price in Lucernan silver", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_redsail_sailed") && A.S.year - p.flags.mat_redsail_sailed >= 2 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { ageAdj: 45, status: "merchant", realm: "POL-04", occ: "a Lucernan factor" }).id; },
      text: "The Lucernan families have put a price on every corsair who sailed with Ima Redsail against their galley: two hundred suns a head, paid at any Lucernan counting-house. {them}, a Lucernan factor with soft hands, finds you in Blackreef. For a fifth of everything you have, {theyHe} will strike your name from the list.",
      choices: [
        { t: "Pay the factor", r: "{them} weighs the coin, draws a line through your name with a silver pen and blots it. You will have to trust a Lucernan's list.",
          fx: { coinPct: -0.2, unflag: "mat_redsail_sailed", them: { type: "acquaint", op: 10, back: "acquaint" } } },
        { t: "Refuse, and keep out of Lucernan ports", r: "There are other ports. Fewer every year, but enough. In Blackreef the drink is cheaper for a man with a price on his head.",
          fx: { fame: 2, wil: 1, deed: "Carried a Lucernan price on your head", them: { type: "enemy", op: -20, back: "enemy" } } },
        { t: "Take the factor and ransom {themHim}", check: { s: "intimidation", s2: "str", d: 55 },
          win: { r: "The families pay a hundred and fifty suns for their factor, and add his price to yours.",
            fx: { coin: 150, honor: -4, fame: 2, them: { type: "enemy", op: -60, back: "enemy" } } },
          lose: { r: "The factor's soft hands keep hard guards. You get away over a wall, cut.",
            fx: { health: -12, cause: "a factor's guards", wound: "scar_arm", them: { type: "enemy", op: -40, back: "enemy" } } } },
      ],
    },

    // ================================================================ av_turncoat (av_merc_switch: "Turn your coat", or av_merc_postern: "Open the gate")
    {
      id: "mat_turncoat_captain", title: "Before witnesses", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_turncoat") && A.S.year - p.flags.av_turncoat >= 4 && C.adult(p) && !p.prison && (p.flags.ev || {}).av_merc_switch === p.flags.av_turncoat,
      setup: (p, ctx) => {
        let k = linkedIn(p, ["enemy"], +p.flags.av_turncoat);
        if (!k) k = mk(p, { sex: "M", ageAdj: 50, status: "gentry", occ: "a captain of foot, retired" }); else k.occ = "a captain of foot, retired";
        ctx.pid = k.id;
      },
      text: "{them}, the captain whose men you led across the lines at night for double pay, has found you in {home}. {theyHe} is older, with a pension and a stiff leg, and two of the men you left behind stand at {theirHis} shoulders. {theyHe} has come to say one thing to your face, before witnesses, and then see what you do.",
      choices: [
        { t: "Hear {themHim} out, and answer nothing", r: "{theyHe} calls you what you are, slowly, so the street can hear. Then {theyHe} spits and goes. The street remembers it longer than {theyHe} does.",
          fx: { fame: -2, honor: -2, wil: 1.5, them: { op: 10 } } },
        { t: "Draw, and settle it in the street", r: "Steel comes out. The witnesses step back.",
          fx: { them: { op: -20 }, duel: { foe: "them", opts: { kind: "duel", place: "the street outside your door", lethal: false, toYield: true, title: "The turncoat's answer" } } } },
        { t: "Offer {themHim} the double pay, every sun of it", req: p => p.coin >= 80, r: "{theyHe} counts the eighty suns, gives half to each of the two men, and walks away without a word. It is not forgiveness. It is a receipt.",
          fx: { coin: -80, honor: 3, them: { type: "rival", op: 30, back: "rival" } } },
      ],
    },
    {
      id: "mat_postern_pies", title: "A burn from wrist to elbow", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_turncoat") && A.S.year - p.flags.av_turncoat >= 5 && C.adult(p) && !p.prison && (p.flags.ev || {}).av_merc_postern === p.flags.av_turncoat,
      setup: (p, ctx) => { ctx.pid = mk(p, { sex: "F", ageAdj: 35, occ: "a pie-seller" }).id; },
      text: "{them} sells pies from a tray in {home}. A burn scar runs from {theirHis} wrist to {theirHis} elbow. While you eat, {theyHe} tells how it happened: a besieged town, a postern opened at the second hour from inside, the streets burning by dawn. You held the night watch at that postern. You took two hundred suns from under the third stone of the well.",
      choices: [
        { t: "Leave a purse where {theyHe} will find it", r: "Fifty suns, wrapped in a cloth on the tray while {theyHe} serves a carter. {theyHe} never learns who left it.",
          fx: { coin: -50, honor: 2, happy: -2, them: { op: 20 } } },
        { t: "Tell {themHim} the truth", check: { s: "wil", s2: "persuasion", d: 55 },
          win: { r: "{theyHe} listens to the end. Then {theyHe} takes half of everything you have and tells you to live with the rest. {theyHe} keeps your secret, and you keep the rest.",
            fx: { coinPct: -0.5, honor: 4, wil: 2, deed: "Confessed the postern gate to one who burned for it", them: { type: "rival", op: -10, back: "rival" } } },
          lose: { r: "{theyHe} screams it across the street before you finish. You leave {home} that night, and you do not come back.",
            fx: { fame: 2, honor: -6, happy: -10, trait: "paranoid", them: { type: "enemy", op: -80, back: "enemy" } } } },
        { t: "Pay for the pie and walk away", r: "You finish the pie. It is a good pie. You walk home the long way, past the well.", fx: { happy: -6, secret: 1 } },
      ],
    },

    // ================================================================ av_hold_book (av_road_dwarfgate: "Wait politely, as long as it takes")
    {
      id: "mat_hold_surety", title: "A name in the factor's book", w: 3, once: true,
      cond: (p, C) => C.flag(p, "av_hold_book") && A.S.year - p.flags.av_hold_book >= 3 && C.adult(p) && !C.race(p, "dwarf") && C.realm(p, "POL-10", "POL-28", "POL-29") && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { race: "human", ageAdj: 35, status: "merchant", occ: "a wool trader" }).id; },
      text: "The dwarf factor who bought your wool at a fair price, after three days of waiting at the gate, wrote your name in a book. Now the gate-warden sends for you. {them}, a human trader, wants goods on credit from the hold and has named you as surety. A name in that book is worth a hundred and fifty suns of credit, if you lend it.",
      choices: [
        { t: "Stand surety for {them}", r: "The factor dips a steel pen and writes your name under {them}'s, with a small mark beside it. Dwarves do not shake hands on a debt. They write it down.",
          fx: keep("mat_surety_who", { flag: "mat_surety", owed: 1, them: { type: "friend", op: 25, back: "friend" } }) },
        { t: "Decline, as politely as Holdspeech allows", r: "The factor nods once. The warden nods once. {them} does not nod at all, and tells the guest hall you are a coward.",
          fx: { skill: { etiquette: 1 }, them: { type: "rival", op: -20, back: "rival" } } },
        { t: "Ask for the credit yourself instead", check: { s: "trade", s2: "etiquette", d: 50 },
          win: { r: "The factor considers your boots, your face and the book, and advances you goods against next season's wool. {them} watches you load the cart.",
            fx: { coin: 60, skill: { trade: 2 }, deed: "Given credit at a dwarven hold on your name alone", them: { type: "rival", op: -15, back: "rival" } } },
          lose: { r: "'Credit for one,' says the factor, 'is not credit for two.' The warden shows you both out.", fx: { happy: -3, them: { op: -10 } } } },
      ],
    },
    {
      id: "mat_surety_due", title: "A line through a name", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_surety") && A.S.year - p.flags.mat_surety >= 2 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { const k = A.P(p.flags.mat_surety_who); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; },
      text: "{them} went south with the hold's goods and has not come back. The dwarf factor sends a clerk with the book open at the page: your name, under {them}'s, with the small mark beside it. A hundred and fifty suns by midwinter, or your name is struck through, and the gate of every hold will know it.",
      choices: [
        { t: "Pay it", req: p => p.coin >= 150, r: "You count it onto the factor's table, and the clerk draws a neat line through the debt, not the name. Next season the warden opens the gate before you knock.",
          fx: { coin: -150, honor: 4, unflag: "mat_surety", deed: "Paid a defaulter's debt to a dwarven hold", them: { type: "enemy", op: -30, back: "enemy" } } },
        { t: "Go south and find {them}", check: { s: "tracking", s2: "intimidation", d: 52 },
          win: { r: "You find {themHim} in a port town, living on the hold's wool. {theyHe} pays, all of it, with a little help from your hands. The factor writes 'paid' in red.",
            fx: { coin: 10, fame: 1, unflag: "mat_surety", them: { type: "enemy", op: -50, back: "enemy" } } },
          lose: { r: "Three weeks on the road and no trace. Midwinter comes, and your name is struck through.",
            fx: { coin: -20, honor: -5, unflag: "mat_surety", deed: "Struck from the book of a dwarven hold" } } },
        { t: "Let them strike your name", r: "The clerk draws one line, very straight. You do not trade with dwarves again, and dwarves remember for three hundred years.",
          fx: { honor: -5, unflag: "mat_surety", deed: "Struck from the book of a dwarven hold", them: { type: "enemy", op: -40, back: "enemy" } } },
      ],
    },

    // ================================================================ tr_wandered (tr_road: every "Go" choice)
    {
      id: "mat_journeyman_door", title: "A journeyman at the door", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_wandered") && A.S.year - p.flags.tr_wandered >= 5 && C.adult(p) && C.jobRank(p, 2) && CRAFTS.includes(p.job.c) && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { ageAdj: 19, status: "artisan", occ: "a journeyman on the road" }).id; },
      text: "A journeyman knocks at your workshop at dusk with a bundle of tools, dust to the knees and a letter from a master in a town you have never heard of. You stood at a stranger's door like that once, weeks from home, looking for the hardest master who would have you. {them} wants a bed in the loft and a year of work.",
      choices: [
        { t: "Take {themHim} in, and never once say good", r: "{them} works like a mule and sulks like a cat. By the year's end {theyHe} does work you would have been proud of at that age. You do not say so.",
          fx: keep("mat_journeyman_who", { rep: 3, flag: "mat_took_journeyman", them: { type: "student", op: 25, back: "mentor" } }) },
        { t: "Take {themHim} in, and lock up your patterns", r: "Your patterns go in the iron chest at night. {them} notices, as you once noticed. It is the right lesson, and a cold one.",
          fx: keep("mat_journeyman_who", { coin: 10, flag: "mat_took_journeyman", them: { type: "student", op: 5, back: "mentor" } }) },
        { t: "Send {themHim} on to the next town", r: "{theyHe} goes on with the bundle and the letter. Your loft stays quiet, and your own journeymen grumble less.",
          fx: { coin: 5, them: { type: "acquaint", op: -15, back: "acquaint" } } },
      ],
    },
    {
      id: "mat_journeyman_master", title: "Your old journeyman's masterpiece", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_took_journeyman") && A.S.year - p.flags.mat_took_journeyman >= 5 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { const k = who(p, "mat_journeyman_who"); if (!k) { ctx.skip = 1; return; } ctx.pid = k.id; k.occ = "a master with a workshop across the river"; },
      text: "{them}, who once slept in your loft and took a year of your temper, is a master now, with {theirHis} own mark and a workshop across the river. The guild has asked {themHim} for the masterpiece it shows at the {home} spring fair. {theyHe} asks you, before the whole guild, to stand beside {themHim} at the bench. If it fails, both your names are on it.",
      choices: [
        { t: "Stand at the bench with {themHim}", check: { s: "craft", s2: "wil", d: 55 },
          win: { r: "Two pairs of hands and one temper between them, mostly yours. The guild hangs the piece in its hall with both your marks on it.",
            fx: { rep: 6, masterwork: "a guild masterpiece, made with the journeyman you took in", them: { type: "bestfriend", op: 30, back: "bestfriend" } } },
          lose: { r: "You argue over a joint and both turn out to be wrong. The piece is shown, and the guild is polite about it.",
            fx: { rep: -4, them: { op: 10 } } } },
        { t: "Decline: it should be {theirHis} work alone", r: "{theyHe} makes it alone, and it is good, and better for being only {theirHis}. The guild notes that you stood back. So does {them}.",
          fx: { rep: 1, honor: 2, them: { op: 15 } } },
        { t: "Ask for your name first on the piece", r: "{them} agrees, because {theyHe} owes you. The guild hears of it, because guilds hear everything. It is the last thing {theyHe} asks of you.",
          fx: { rep: 4, fame: 1, them: { type: "rival", op: -20, back: "rival" } } },
      ],
    },

    // ================================================================ tr_council (tr_town_council: either winning path)
    {
      id: "mat_council_bread", title: "The assize of bread", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_council") && A.S.year - p.flags.tr_council >= 2 && C.adult(p) && !p.prison,
      text: "A wet harvest. The price of bread in {home} has doubled since Lammas, and the town council meets on the assize. The merchants who sit beside you want the price left free; their grain is in their barns. The bakers want it fixed. You took this seat promising to argue for the craftsmen, and the craftsmen are hungry.",
      choices: [
        { t: "Fix the price, and open the merchants' barns", check: { s: "persuasion", s2: "intrigue", d: 52 },
          win: { r: "Bread at the old price, by the council's seal. The merchants sell to the bakers at a loss, and remember every sun of it.",
            fx: { fame: 2, honor: 3, rep: 4, flag: "mat_bread_fixed" } },
          lose: { r: "You lose by three voices. The barns stay shut until spring, and the price stays with them.", fx: { rep: -2, happy: -4 } } },
        { t: "Leave it free, and take a merchant's thanks", r: "A purse finds its way to your workshop, and a barrel of flour. Your own house eats well that winter. Others in your street do not.",
          fx: { coin: 50, honor: -5, rep: -3, trait: "greedy" } },
        { t: "Buy barley upriver with your own money", req: p => p.coin >= 100, r: "A hundred suns of barley, sold at cost from your own door. People who cannot afford bread can afford that. They will not forget it, and nor will the merchants.",
          fx: (p, ctx) => fx(p, ctx, { coin: -100, fame: 3, honor: 4, deed: A.T("Fed {home} in a dear year") }) },
      ],
    },
    {
      id: "mat_bread_merchants", title: "A toll for paving", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_bread_fixed") && A.S.year - p.flags.mat_bread_fixed >= 2 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { ageAdj: 50, status: "merchant", occ: "a grain merchant on the council" }).id; },
      text: "The merchants have had two years to count what the assize of bread cost them. Now {them}, the richest grain-dealer on the council, proposes a new toll on every workshop in {home}, to pave the market. Everyone knows what it is for. To stop it you will need the bakers, and the bakers have short memories.",
      choices: [
        { t: "Fight the toll in council", check: { s: "persuasion", s2: "diplomacy", d: 55 },
          win: { r: "The bakers come, flour to the elbows, and stand at the back of the chamber. The toll fails by one voice.",
            fx: { rep: 5, fame: 2, them: { type: "enemy", op: -40, back: "enemy" } } },
          lose: { r: "The bakers do not come. The toll passes, and every workshop knows whose quarrel it paid for.",
            fx: { rep: -5, coin: -20, them: { type: "rival", op: -20, back: "rival" } } } },
        { t: "Trade your vote for a lower toll on your guild", r: "{them} is reasonable, in private. Your guild pays half. The others pay double, and your name is mud in three streets.",
          fx: { coin: 20, honor: -4, rep: 2, them: { type: "friend", op: 20, back: "friend" } } },
        { t: "Give up your seat rather than watch it", r: "You lay the council's chain on the table and walk out. Your guild elects someone younger. You sleep through the night for the first time in a year.",
          fx: { unflag: "tr_council", happy: 3, honor: 2, rep: -3 } },
      ],
    },
    {
      id: "mat_council_rival", title: "Seconding the motion", w: 2, once: true,
      cond: (p, C) => C.flag(p, "tr_council") && A.S.year - p.flags.tr_council >= 4 && C.adult(p) && !p.prison,
      setup: (p, ctx) => {
        const k = linkedIn(p, ["rival", "enemy"], +p.flags.tr_council) || mk(p, { ageAdj: 55, status: "merchant", occ: "a master of the wool merchants" });
        ctx.pid = k.id;
      },
      text: "{them}, the wool master who stood against you for the guild seat and lost, has sat beside you on the council ever since, smiling. This morning {theyHe} asks you to second a motion: double the watch, paid by a toll on the dyers. The dyers' quarter is the poorest in {home}. In return {theyHe} offers you the bridge wardenship.",
      choices: [
        { t: "Second it, and take the bridge", r: "The watch doubles and the dyers pay. The bridge tolls pass through your hands now, and a little sticks to them.",
          fx: { coin: 40, honor: -3, rep: 2, them: { type: "friend", op: 30, back: "friend" } } },
        { t: "Oppose it, and say why", check: { s: "persuasion", s2: "wil", d: 50 },
          win: { r: "The motion fails. The dyers send you a bolt of blue cloth. {them} smiles at you across the chamber a little less.",
            fx: { rep: 4, honor: 2, them: { type: "enemy", op: -30, back: "enemy" } } },
          lose: { r: "It passes anyway, and {them} makes sure the dyers know you tried and failed.", fx: { rep: -2, them: { op: -10 } } } },
        { t: "Ask for more than the bridge", check: { s: "intrigue", s2: "trade", d: 52 },
          win: { r: "You get the bridge and the grain-measure both, and {them} gets the vote. Now you owe {themHim}, and must watch the measure, and {themHim}.",
            fx: { coin: 60, honor: -4, oweThem: 1 } },
          lose: { r: "{them} laughs and finds another seconder before noon.", fx: { them: { op: -10 } } } },
      ],
    },

    // ================================================================ tr_smith_heirsword (tr_smith_heir_sword: every path)
    {
      id: "mat_heirsword_war", title: "The sword comes back", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_smith_heirsword") && A.S.year - p.flags.tr_smith_heirsword >= 5 && C.adult(p) && C.job(p, "smith") && !p.prison,
      setup: (p, ctx) => {
        const r = A.realm(p.realm), k = r && (alive(r.heir) || alive(r.ruler));
        if (!k || k.id === p.id) { ctx.skip = 1; return; }
        ctx.pid = k.id;
        const w = work(p, /heir's sword/);
        ctx.how = !w ? "with every lord in the hall waiting to see your mark" : /brother smith/.test(w.t) ? "at one anvil with a brother smith" : "alone, over a winter";
      },
      text: "The sword you made for the heir's girding, {how}, comes back to your forge in a leather case, with a notched edge and a letter under the seal of {realmShort}. {them}, who carries it now, rides to the border in spring and wants it made ready: honed, re-hilted, plain. The court wants the gold left on.",
      choices: [
        { t: "Make it a fighting sword, gold and all off", check: { s: "craft", s2: "wil", d: 55 },
          win: { r: "You strip the gold and fit a plain hilt of iron and leather. The court is cool for a season. {them} writes from the border that the blade has held.",
            fx: { rep: 6, favor: -3, deed: "Remade a royal sword for war", them: { op: 25 } } },
          lose: { r: "The temper goes wrong on the new edge. You send it back sound, and no better than a good sergeant's sword.",
            fx: { rep: -4, them: { op: -10 } } } },
        { t: "Keep the gold, as the court wants", r: "Honed and polished, gold and all. The court is pleased. You hear later that it was drawn in the field, and that the gold snagged in a scabbard.",
          fx: { rep: 1, favor: 3, them: { op: -10 } } },
        { t: "Forge a plain twin to carry in the field", check: { s: "craft", s2: "int", d: 62 },
          win: { r: "A second blade from the same steel, plain as a nail. The gilded one stays at court, and the twin goes to war. Lords start asking for pairs.",
            fx: { coin: 150, rep: 8, masterwork: "the war twin of the heir's sword of {realmShort}", them: { op: 20 } } },
          lose: { r: "The twin comes out of the quench with a crack you can hear. You have spent a winter's charcoal on scrap.",
            fx: { coin: -40, rep: -3 } } },
      ],
    },
    {
      id: "mat_heirsword_mark", title: "Your mark on a cheap blade", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_smith_heirsword") && A.S.year - p.flags.tr_smith_heirsword >= 3 && C.adult(p) && C.job(p, "smith") && !p.prison,
      text: "Since every lord in the hall saw your mark on the heir's sword, your mark has been worth money. Now it is on swords you never made: cheap blades sold off a cart on {home} market days, the mark struck badly into the tang. And a great workshop in {capital} offers a hundred and fifty suns a year to strike your mark on its swords, honestly.",
      choices: [
        { t: "Find the cart and the forger", check: { s: "tracking", s2: "intimidation", d: 50 },
          win: { r: "A journeyman two towns over, with a punch cut from a wax of your mark. The guild breaks his punch and his hammer.",
            fx: { rep: 5, deed: "Broke a forger of your own mark", newRel: { type: "enemy", op: -40 } } },
          lose: { r: "The cart is gone by the time you get there. The swords keep turning up.", fx: { rep: -3, happy: -3 } } },
        { t: "Sell your mark to the great workshop", r: "A hundred and fifty suns, and your mark on two hundred blades you never touched. Good blades, mostly.",
          fx: { coin: 150, rep: -2, flag: "mat_mark_sold" } },
        { t: "Cut a new mark, and let the old one go", r: "You cut a new punch and register it with the guild. Your best work is still under the old mark, and so are the fakes.",
          fx: { rep: -1, wil: 1, skill: { craft: 1 } } },
      ],
    },
    {
      id: "mat_mark_broke", title: "Broken at the guard", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_mark_sold") && A.S.year - p.flags.mat_mark_sold >= 2 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { sex: "F", ageAdj: 40, status: "gentry", occ: "a knight's widow" }).id; },
      text: "A sword with your mark on it broke at the guard in a skirmish, and the knight who carried it died on the ground with the hilt in his hand. His widow, {them}, has come to your forge with the pieces in a sack. The great workshop in {capital} made it. Your mark is on it. She wants to know which of you will answer.",
      choices: [
        { t: "Answer for it. It bears your mark", req: p => p.coin >= 100, r: "You pay her the knight's blood-price from your own purse and carry the pieces to {capital}. The workshop pays you back half. Your name is still on the broken steel.",
          fx: { coin: -100, honor: 4, them: { type: "friend", op: 20, back: "friend" } } },
        { t: "Send her to the workshop in {capital}", r: "The workshop's lawyers are better than her grief. She gets nothing. Within a year, few will buy a sword with your mark on it.",
          fx: { rep: -8, honor: -3, them: { type: "enemy", op: -40, back: "enemy" } } },
        { t: "Break the contract, and say so in public", check: { s: "persuasion", s2: "wil", d: 52 },
          win: { r: "You stand in the guildhall and swear the blade was never yours. The workshop loses the right to your mark, and you lose the fee.",
            fx: { rep: 4, honor: 2, unflag: "mat_mark_sold", them: { op: 20 } } },
          lose: { r: "The guild sides with the workshop, which pays the guild more than you do.", fx: { rep: -5, unflag: "mat_mark_sold" } } },
      ],
    },

    // ================================================================ tr_mason_marked (tr_mason_mark: every path)
    {
      id: "mat_mark_culvert", title: "The keystone", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_mason_marked") && A.S.year - p.flags.tr_mason_marked >= 6 && C.adult(p) && !p.prison,
      text: "A culvert under the {home} road has fallen in after the spring rains, and a carter's horse broke both forelegs in the hole. The reeve has the stones laid out on the bank. Your mark is on the keystone: the mark the lodge has you cut on every stone you dress, so that the master can count the work and find the mistakes.",
      choices: [
        { t: "Own it, and rebuild it at your cost", r: "Three weeks with your own hands and lime, and a price paid to the carter for his horse. The reeve tells the lodge. The lodge tells everyone.",
          fx: { coin: -40, honor: 4, rep: 4, deed: "Rebuilt a fallen culvert at your own cost" } },
        { t: "Show the reeve it was the mortar", check: { s: "craft", s2: "persuasion", d: 48 },
          win: { r: "The keystone is sound. The mortar was mixed thin by a lime-burner who cheats. The reeve fines him, and the lime-burner hates you.",
            fx: { rep: 3, skill: { craft: 1 }, newRel: { type: "enemy", op: -30 } } },
          lose: { r: "The reeve cannot tell mortar from cheese. He fines you for the horse.", fx: { coin: -25, rep: -3 } } },
        { t: "Swear the mark is not yours", check: { s: "deception", s2: "wil", d: 55 },
          win: { r: "Marks are copied; everyone knows it. The reeve shrugs and fines the lodge. The lodge knows whose mark it is.",
            fx: { honor: -4, rep: -2, trait: "deceitful" } },
          lose: { r: "The master of the lodge is called with the mark-book. Your name is beside the mark in his own hand.",
            fx: { coin: -25, rep: -8, honor: -5 } } },
      ],
    },
    {
      id: "mat_mark_passed", title: "What becomes of the mark", w: 2, once: true,
      cond: (p, C) => C.flag(p, "tr_mason_marked") && A.S.year - p.flags.tr_mason_marked >= 15 && C.adult(p) && C.ageAdj(p) >= 45 && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { ageAdj: 20, status: "artisan", occ: "an apprentice mason" }).id; ctx.yrs = num(since(p, "tr_mason_marked")); },
      text: "For {yrs} years you have cut the same mark on every stone you dressed. It is on walls you will never see again. Your hands have begun to shake, as old masons' hands do, and {them}, the best apprentice in the lodge, has asked, very carefully, what will become of it.",
      choices: [
        { t: "Give the mark to {them}", r: "{them} cuts it on a practice stone, badly, then well. Strangers will think an old master cut {theirHis} stones. {theyHe} had better cut like one.",
          fx: { rep: 3, honor: 2, them: { type: "student", op: 40, back: "mentor" } } },
        { t: "Let it die with you", r: "You tell the lodge your mark is not to be cut again. The master enters it in the book with a line through it. What is on the walls will speak for you.",
          fx: { wil: 1, them: { type: "acquaint", op: -10, back: "acquaint" } } },
        { t: "Set {themHim} a true arch first, unaided", check: { s: "craft", s2: "command", d: 45 },
          win: { r: "{them} builds it, pulls it down and builds it again. In the spring it stands. You hand over the mark at the lodge supper.",
            fx: { rep: 2, skill: { craft: 1 }, them: { type: "student", op: 30, back: "mentor" } } },
          lose: { r: "{them} fails the arch twice and leaves the lodge for a carpenter's yard. The mark stays with you.",
            fx: { happy: -3, them: { type: "acquaint", op: -20, back: "acquaint" } } } },
      ],
    },

    // ================================================================ tr_mason_drawing (tr_mason_hidden_room: "Build it, and hide a drawing")
    {
      id: "mat_drawing_buyer", title: "A man with soft hands", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_mason_drawing") && A.S.year - p.flags.tr_mason_drawing >= 3 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { sex: "M", ageAdj: 40, status: "merchant", occ: "a quiet man with soft hands" }).id; },
      text: "A quiet man with soft hands, {them}, buys you a cup of wine and talks about cellars. He knows you built something for a great lord in a town house. He does not know what, or where. You do: a door hidden in the wall behind the wine, a stair inside the stone, and a drawing behind a loose stone only you know. He offers two hundred suns.",
      choices: [
        { t: "Sell him the drawing", r: "Two hundred suns in a cloth bag, and the drawing in his sleeve. He shakes your hand. You think of the last mason who built such a room, the one they found in the river.",
          fx: { coin: 200, honor: -6, flag: "mat_drawing_sold", them: { type: "acquaint", op: 10, back: "acquaint" } } },
        { t: "Refuse, and forget the cellar again", r: "He smiles and pays for the wine. You move the drawing that night to a new stone, and lie awake listening for boots.",
          fx: { wil: 0.5, them: { type: "rival", op: -15, back: "rival" } } },
        { t: "Tell the lord's steward someone is asking", check: { s: "persuasion", s2: "wil", d: 50 },
          win: { r: "The steward has the man followed and thanks you with twenty suns. He also asks, gently, how the man knew to come to you.",
            fx: { coin: 20, them: { type: "enemy", op: -40, back: "enemy" } } },
          lose: { r: "The steward's thanks are a night in the lord's cellar while they ask how the man found you. They search your yard. The drawing stays hidden; your ribs do not.",
            fx: { health: -12, cause: "a beating", wound: "broken_ribs", them: { type: "enemy", op: -20, back: "enemy" } } } },
      ],
    },
    {
      id: "mat_strongroom_empty", title: "The third name on the list", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_drawing_sold") && A.S.year - p.flags.mat_drawing_sold >= 2 && C.adult(p) && !p.prison,
      text: "The strongroom you built behind a lord's wine cellar was emptied in the spring, through a door no one should have known. The lord's steward is going through the names of every mason who worked on that house. Yours is the third. The quiet man with soft hands has not been seen since.",
      choices: [
        { t: "Run, tonight, with what you can carry", r: "You leave the yard, the stone and the drawing-board. On the road you hear they found the second mason on the list in the river.",
          fx: { flag: "outlaw", coinPct: -0.3, happy: -8, unflag: "mat_drawing_sold" } },
        { t: "Face the steward, and lie", check: { s: "deception", s2: "wil", d: 55 },
          win: { r: "You talk about lime and cellars until the steward is bored. He crosses your name off. You do not sleep well for a month.",
            fx: { wil: 1, skill: { deception: 2 }, unflag: "mat_drawing_sold" } },
          lose: { r: "The steward has the soft-handed man's ledger. Your name is in it, with the price.",
            fx: { prison: 3, why: "robbing a lord's strongroom", honor: -6, unflag: "mat_drawing_sold" } } },
        { t: "Give the steward the buyer, and nothing else", r: "You tell him everything about the man and nothing about the drawing. The steward listens, nods, and keeps a man watching your yard all the same.",
          fx: { honor: -2, trait: "paranoid", unflag: "mat_drawing_sold", newRel: { type: "enemy", op: -40 } } },
      ],
    },
    {
      id: "mat_drawing_attainder", title: "Fifty suns for a door", w: 2, once: true,
      cond: (p, C) => C.flag(p, "tr_mason_drawing") && A.S.year - p.flags.tr_mason_drawing >= 6 && !C.flag(p, "mat_drawing_sold") && C.adult(p) && !p.prison,
      text: "The lord whose strongroom you built is attainted for treason, and the crown's men have taken his town house apart looking for the plate. They have not found the door behind the wine. A crier in {home} offers fifty suns to anyone who can show the way. And the lord's widow has sent a servant to your door after dark, with a purse.",
      choices: [
        { t: "Show the crown's men the door", r: "You walk them to the cellar and press the stone. Fifty suns, and the crown's thanks. The widow's servant does not come again.",
          fx: { coin: 50, favor: 4, honor: -2, unflag: "tr_mason_drawing", newRel: { type: "enemy", op: -40 } } },
        { t: "Take the widow's purse, and say nothing", r: "Thirty suns, and a long night for her servants with sacks. When the crown finds the door, the room is bare stone.",
          fx: { coin: 30, honor: 2, secret: 1, newRel: { type: "friend", op: 30 } } },
        { t: "Burn the drawing at last", r: "It goes into the fire with your supper. Somewhere under the town a room full of silver waits for whoever finds it. It will not be you.",
          fx: { wil: 1, happy: -1, unflag: "tr_mason_drawing" } },
      ],
    },

    // ================================================================ tr_weaver_banner (tr_weaver_banner: every path)
    {
      id: "mat_banner_torn", title: "Cut nearly in half", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_weaver_banner") && A.S.year - p.flags.tr_weaver_banner >= 4 && C.adult(p) && !p.prison,
      text: "The great banner of {realmShort}, the one you wove when the old one was rags, comes back from the border on a cart. An axe has cut it nearly in half, and one corner is black with somebody's blood. The court wants it mended. The old soldiers say a banner should carry its wounds.",
      choices: [
        { t: "Mend it so no one can find the cut", check: { s: "craft", s2: "wil", d: 55 },
          win: { r: "A month with a needle finer than a hair. When it is raised again, even you have to search for the cut. The court pays fifty suns.",
            fx: { coin: 50, rep: 5, favor: 3, skill: { craft: 2 } } },
          lose: { r: "The new threads are too bright. Everyone can see exactly where the axe went.", fx: { coin: 20, rep: -3 } } },
        { t: "Close the cut with gold thread, and leave the blood", r: "A seam of gold through the realm's colors, and a brown stain no one may wash. The soldiers cheer it at the next muster. The chamberlain does not.",
          fx: { fame: 2, piety: 2, favor: -2, rep: 3, deed: "Mended the realm's banner with gold, and left the blood on it" } },
        { t: "Weave a new one, and keep the old", r: "Another year with your eyes an inch from the cloth, for three hundred suns. The cut banner hangs in your workshop. Visitors stop talking when they see it.",
          fx: (p, ctx) => fx(p, ctx, { coin: 300, rep: 4, deed: A.T("Kept the war-cut banner of {realmShort}") }) },
      ],
    },

    // ================================================================ tr_bow_xbow (tr_bow_crossbow: learned it openly or by night)
    {
      id: "mat_xbow_order", title: "A hundred crossbows", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_bow_xbow") && A.S.year - p.flags.tr_bow_xbow >= 3 && C.adult(p) && C.job(p, "bowyer") && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { ageAdj: 40, status: "gentry", occ: "a captain of crossbowmen" }).id; },
      text: "{them}, a captain of crossbowmen, wants a hundred crossbows by spring, at six suns each. Word has gone round that you learned the stock, the nut and the trigger from a journeyman down on his luck. The bowyers' guild still says a bowyer who makes crossbows is no bowyer at all, and the wardens have started counting what leaves your door.",
      choices: [
        { t: "Take the order openly, guild or no guild", r: "Six hundred suns of work, and the wardens at your door every week. By spring you are richer, and the guild fines you and strikes you from its feast.",
          fx: { coin: 300, rep: -10, newRel: { type: "enemy", op: -40 }, them: { type: "friend", op: 25, back: "friend" } } },
        { t: "Make them at night, a few at a time", check: { s: "stealth", s2: "craft", d: 52 },
          win: { r: "Shutters closed, the oil smell aired out by dawn. A hundred crossbows leave by the back door in twos and threes.",
            fx: { coin: 250, skill: { xbow: 1, craft: 2 }, them: { type: "friend", op: 20, back: "friend" } } },
          lose: { r: "A warden smells the oil and sees the light. The fine is a hundred suns, and your name is read out at the guild feast.",
            fx: { coin: -100, rep: -8 } } },
        { t: "Offer {themHim} longbows instead", check: { s: "persuasion", s2: "craft", d: 50 },
          win: { r: "You shoot at a mark two hundred paces off while {theyHe} watches. {theyHe} buys sixty bows and hires archers to draw them.",
            fx: { coin: 180, rep: 4, them: { type: "friend", op: 15, back: "friend" } } },
          lose: { r: "'Longbows take ten years to learn,' {theyHe} says. 'Crossbows take a week.' {theyHe} buys abroad.",
            fx: { happy: -2, them: { op: -10 } } } },
      ],
    },

    // ================================================================ tr_bow_royal (tr_bow_royal: every path)
    {
      id: "mat_royal_bow_order", title: "Two hundred bows for a foreign guard", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_bow_royal") && A.S.year - p.flags.tr_bow_royal >= 4 && C.adult(p) && !p.prison,
      setup: (p, ctx) => {
        const w = work(p, /gift bow|twin bows/);
        ctx.how = w && /twin/.test(w.t) ? "one of the twin bows split from a single stave" : "the gift bow from " + A.realmShort(p.realm);
        ctx.pid = mk(p, { sex: "M", ageAdj: 50, status: "artisan", occ: "a foreign king's master bowyer" }).id;
      },
      text: "{them}, master bowyer to the foreign king who received {how}, has come to your workshop with a letter and a purse. His king wants two hundred war bows like it for his guard, at three suns each, which is a good price. No one has asked {ruler}'s court. Relations between the two crowns are not what they were.",
      choices: [
        { t: "Take the order", r: "Two hundred staves, a year of work and six hundred suns in foreign coin. In {capital} someone asks, quietly, who is arming a foreign king's guard.",
          fx: { coin: 400, rep: 3, favor: -6, them: { type: "friend", op: 25, back: "friend" } } },
        { t: "Ask the court's leave first", r: "The chancellor takes three months to say yes, and a tenth for his trouble. The court is pleased to have been asked.",
          fx: { coin: 250, favor: 4, honor: 2, them: { op: 10 } } },
        { t: "Refuse: those bows could come back at us", r: "{them} bows, with real regret, and buys from a rival two realms away. Your bow still hangs on a foreign wall, unstrung.",
          fx: { honor: 2, favor: 2, them: { type: "acquaint", op: -10, back: "acquaint" } } },
      ],
    },

    // ================================================================ tr_brew_hopped (tr_brew_hops: openly or quietly)
    {
      id: "mat_gruit_court", title: "Back fees on every barrel", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_brew_hopped") && A.S.year - p.flags.tr_brew_hopped >= 3 && C.adult(p) && C.job(p, "brewer") && !p.prison,
      setup: (p, ctx) => { ctx.holder = "the " + temple(p); },
      text: "Your hopped ale keeps all summer and pays no gruit. {holder}, which holds the gruit right in {home} and takes a fee on every brew, has noticed what it is losing. A priest and a gruit-keeper come to your brewhouse with a writ for the lord's court: back fees on every hopped barrel since the day you first brewed one.",
      choices: [
        { t: "Fight it in the lord's court", check: { s: "persuasion", s2: "learning", d: 52 },
          win: { r: "Your lawyer finds that the gruit right covers gruit and nothing else. Hopped ale is free in {home} by judgment. Every brewer in town owes you a drink.",
            fx: (p, ctx) => fx(p, ctx, { rep: 8, fame: 2, flag: "mat_hops_free", deed: A.T("Broke the gruit right of {home} in the lord's court") }) },
          lose: { r: "The court finds for the gruit. Forty suns in back fees, and the priests preach about bitter ale.", fx: { coin: -40, rep: -4 } } },
        { t: "Pay the back fees, and keep brewing hops", req: p => p.coin >= 40, r: "Forty suns, and a fee on every barrel from now on. The ale still keeps. The priests are courteous to you again.",
          fx: { coin: -40, piety: 3 } },
        { t: "Brew gruit for the priests, hops for the town", check: { s: "deception", s2: "craft", d: 48 },
          win: { r: "Two vats, two ledgers. The gruit-keeper tastes the gruit ale and approves. The town drinks the other.", fx: { coin: 30, honor: -3, secret: 1 } },
          lose: { r: "The gruit-keeper tastes the wrong vat. The writ doubles.", fx: { coin: -60, rep: -6 } } },
      ],
    },
    {
      id: "mat_hop_garden", title: "Hops on poles", w: 3, once: true,
      cond: (p, C) => C.flag(p, "mat_hops_free") && A.S.year - p.flags.mat_hops_free >= 3 && C.adult(p) && !p.prison,
      text: "Since the judgment every brewer in {home} brews with hops, and every one of them buys from the same eastern carters at whatever the carters ask. You have a field going to waste by the river. Hops grow on poles, they say, and take three years to bear. Or you could get the guild to buy together and keep the price down for everyone.",
      choices: [
        { t: "Plant the field with hops", req: p => p.coin >= 60, r: "Poles, twine and three years of waiting. The fourth summer the garden bears, and the brewers of {home} buy from you, at what you ask.",
          fx: { coin: -60, rep: 4, asset: "farm" } },
        { t: "Get the guild to buy together", check: { s: "persuasion", s2: "trade", d: 50 },
          win: { r: "The guild buys a whole cart at a time, and the carters grumble at the price. The brewers make you keeper of the hop-store.",
            fx: { coin: 15, rep: 6, deed: "Kept the hop-store of the brewers' guild" } },
          lose: { r: "Brewers will not trust each other with a key. The carters keep their price.", fx: { rep: -1, happy: -2 } } },
        { t: "Buy the carters' whole load and resell it", r: "You buy every bale off the eastern carts and sell it on at a third more. The brewers pay, and call you the Hop-King behind your back.",
          fx: { coin: 80, rep: -4, epithet: "the Hop-King" } },
      ],
    },

    // ================================================================ tr_art_altar (tr_art_altarpiece: every path)
    {
      id: "mat_altar_donor", title: "A donor painted out", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_art_altar") && A.S.year - p.flags.tr_art_altar >= 5 && C.adult(p) && !p.prison,
      setup: (p, ctx) => {
        const w = work(p, /altarpiece|screen/);
        ctx.thing = (w && /screen/.test(w.t)) || p.faith === "REL-07" ? "screen" : "altarpiece";
        ctx.temple = temple(p);
        ctx.pid = mk(p, { sex: "F", ageAdj: 40, status: "noble", occ: "a traitor's widow" }).id;
      },
      text: "One of the great donors kneeling at the foot of your {thing} in the great {temple} at {capital} has been beheaded for treason. The priests want his face painted out and a saint's put over it, by your hand, before the feast. His widow, {them}, comes to your workshop in grey and asks you to leave him where he kneels.",
      choices: [
        { t: "Paint him out, as the priests ask", r: "A saint with a borrowed beard kneels where he knelt. The priests pay twenty suns. {them} crosses the street when you pass.",
          fx: { coin: 20, piety: 2, favor: 2, them: { type: "enemy", op: -30, back: "enemy" } } },
        { t: "Refuse to touch him", r: "The priests hire another painter, who does it badly. Everyone can see where the traitor was. {them} brings flowers to the patch every feast-day.",
          fx: { honor: 3, favor: -3, rep: -2, them: { type: "friend", op: 30, back: "friend" } } },
        { t: "Paint him as a penitent, head bowed", check: { s: "craft", s2: "persuasion", d: 55 },
          win: { r: "The same face, bowed lower, with a rope at his neck. The priests call it a sermon. {them} calls it mercy. Both are right.",
            fx: { rep: 5, piety: 2, deed: "Painted a traitor as a penitent above the altar", them: { type: "friend", op: 20, back: "friend" } } },
          lose: { r: "The priests call it an insult to the crown and pay someone else to paint over both.", fx: { rep: -4, favor: -3 } } },
      ],
    },

    // ================================================================ tr_cook_greatfeast (tr_cook_great_feast: every path)
    {
      id: "mat_feast_letter", title: "A letter in green wax", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_cook_greatfeast") && A.S.year - p.flags.tr_cook_greatfeast >= 3 && C.adult(p) && C.job(p, "cook") && !p.prison,
      setup: (p, ctx) => {
        const others = Object.keys(A.S.realms || {}).filter(id => id !== p.realm && A.realm(id) && A.realm(id).alive !== false && A.P(A.realm(id).ruler));
        if (!others.length) { ctx.skip = 1; return; }
        ctx.rid = A.pick(others);
        const w = work(p, /feast|peacock/);
        ctx.how = w && /peacock/.test(w.t) ? "the peacock sewn back into its feathers, breathing smoke"
          : w ? "forty dishes over three days, and not one of them late" : "what went wrong, and what you did about it";
      },
      text: "A letter comes from {other}, sealed in green wax. An envoy who sat at {ruler}'s great feast has told his master about it, and about {how}. {otherRuler} marries a daughter in the spring and wants you to cook the wedding: two months away from your own kitchen, for a fee your own court has never paid.",
      choices: [
        { t: "Go, and cook the wedding", check: { s: "craft", s2: "logistics", d: 55 },
          win: { r: "Two months, a strange kitchen and cooks who pretend not to understand you. The wedding is talked of in two realms. Your own court notices you were gone.",
            fx: (p, ctx) => fx(p, ctx, { coin: 250, fame: 3, favor: -3, deed: "Cooked a royal wedding in " + A.realmShort(ctx.rid) }) },
          lose: { r: "The strange kitchen beats you: wrong ovens, wrong flour. The bride is gracious. You come home with half the fee.",
            fx: { coin: 100, rep: -4, favor: -3 } } },
        { t: "Send your best cook in your place", r: "Your best cook goes and comes home with a gold chain and a foreign accent. The next court that writes, writes to the cook.",
          fx: { coin: 50, rep: 1, newRel: { type: "student", op: 30 } } },
        { t: "Refuse: your own court comes first", r: "You write back with the court's compliments. {ruler}'s steward hears of it, and your wages rise.",
          fx: { coin: 20, honor: 1, favor: 4 } },
      ],
    },

    // ================================================================ tr_eng_fireoil (tr_eng_fire_oil: "Buy a jar for the town's engines")
    {
      id: "mat_fireoil_sweats", title: "The jar behind the ropes", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_eng_fireoil") && A.S.year - p.flags.tr_eng_fireoil >= 3 && C.adult(p) && !p.prison,
      text: "The jar of fire-oil you bought for the town's engines is still in the engine store of {home}, behind the spare ropes, known to three men. One of the three has died, and his widow is selling his things. Another has started drinking. And the jar has begun to sweat through its wax, with a smell like a struck flint.",
      choices: [
        { t: "Move it alone, at night, somewhere safer", check: { s: "stealth", s2: "siegecraft", d: 50 },
          win: { r: "A barrow, a blanket, a cellar under the north tower that only you can open. Now one man knows.", fx: { wil: 1, secret: 1, skill: { siegecraft: 2 } } },
          lose: { r: "The wax gives on the tower stair, and a spoonful finds a lantern.",
            fx: { health: -18, cause: "fire-oil", wound: "burn", unflag: "tr_eng_fireoil" } } },
        { t: "Burn it off in a pit outside the walls", r: "You pour it into a clay pit at dawn and throw a torch from twenty paces. It burns for an hour on wet clay. {home} has lost a weapon, and you sleep.",
          fx: { happy: 3, honor: 1, unflag: "tr_eng_fireoil" } },
        { t: "Sell it back south, quietly", check: { s: "intrigue", s2: "trade", d: 52 },
          win: { r: "A merchant with a sealed cart pays a hundred and fifty suns and asks no questions. You ask none either.", fx: { coin: 150, honor: -3, unflag: "tr_eng_fireoil" } },
          lose: { r: "The buyer is a garrison informer. You are taken for smuggling.", fx: { punish: "smuggling", unflag: "tr_eng_fireoil" } } },
      ],
    },

    // ================================================================ tr_eng_greatwork (tr_eng_great_work: every path)
    {
      id: "mat_greatwork_test", title: "The test of the work", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_eng_greatwork") && A.S.year - p.flags.tr_eng_greatwork >= 5 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { const w = work(p, /harbor chain|great sluice/); ctx.sea = (w ? /chain/.test(w.t) : A.C.coast(p)) ? 1 : 0; },
      text: (p, ctx) => ctx.sea
        ? "Twelve enemy sails stand off the harbor mouth of {capital} at dusk. Your chain lies across it between the two towers, ready to be raised. But four of {realmShort}'s own merchantmen are still outside, running for home with the wind behind them. Raise the chain now and the city is shut, with them on the wrong side."
        : "The spring flood is the worst in living memory, and the water stands a hand's breadth from the top of your dam above {capital}. Open the sluices and the lower town is safe, but the river will drown the farms on the east bank: forty families. Or hold them shut, and trust the stone.",
      choices: [
        { t: (p, ctx) => (ctx.sea ? "Raise the chain now" : "Open the sluices"),
          r: (p, ctx) => (ctx.sea ? "The chain comes up with a groan you feel in your teeth. The enemy sheers off. Two of the four merchantmen are taken in sight of the walls."
            : "The water goes east. Forty families stand on a hill and watch their fields go under. The lower town is dry, and the east bank will remember who opened the gates."),
          fx: { favor: 4, honor: -2, newRel: { type: "enemy", op: -40 } } },
        { t: (p, ctx) => (ctx.sea ? "Wait for the merchantmen" : "Hold the sluices shut"), check: { s: "siegecraft", s2: "wil", d: 55 },
          win: { r: (p, ctx) => (ctx.sea ? "The last merchantman scrapes over the chain as it rises, and the first enemy galley hits it at full oars. The towers cheer until they are hoarse."
            : "The water reaches the lip of the dam and stops, as you drew it to. The east bank stays dry. Your name is still cut in the stone in the morning."),
            fx: { fame: 4, favor: 6, wil: 1, deed: "Held the great work when it was tested" } },
          lose: { r: (p, ctx) => (ctx.sea ? "You wait one ship too long. Two enemy galleys slip in behind it and burn the quays."
            : "A section of the face gives at the second hour. The lower town floods anyway, and the east bank with it."),
            fx: { favor: -8, fame: -2, happy: -8 } } },
        { t: "Ride for the hall, and make {ruler} decide", r: "You put it before {ruler}'s council, and they argue until the water, or the wind, decides it for them. No one blames you. No one thanks you either.",
          fx: { favor: 1, honor: -2 } },
      ],
    },
    {
      id: "mat_greatwork_audit", title: "The third year's ledger", w: 2, once: true,
      cond: (p, C) => C.flag(p, "tr_eng_greatwork") && A.S.year - p.flags.tr_eng_greatwork >= 4 && C.adult(p) && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { ageAdj: 30, status: "gentry", occ: "treasurer of the realm" }).id; },
      text: "{them}, the new treasurer of {realmShort}, young and thorough, is going through the accounts of the great work you built for {ruler}: every cart of stone, every wage, every sun. {theyHe} has found a section built thinner than the drawing and a gap in the ledgers for the third year, and wants both explained in writing by midsummer.",
      choices: [
        { t: "Open every ledger, and answer for each sun", check: { s: "stewardship", s2: "int", d: 55 },
          win: { r: "Three weeks with the treasurer's clerks. Every gap has a reason, and you have the receipts for most. {them} signs it off with a sniff.",
            fx: { honor: 3, favor: 3, them: { type: "acquaint", op: 20, back: "acquaint" } } },
          lose: { r: "The receipts for the third year were eaten by damp. You are fined two hundred suns.",
            fx: { coin: -200, favor: -5, them: { type: "rival", op: -20, back: "rival" } } } },
        { t: "Blame the dead clerk of works", r: "The clerk of works died in the fifth year, conveniently. {them} accepts it in writing, and not in {theirHis} face.",
          fx: { honor: -4, them: { type: "rival", op: -15, back: "rival" } } },
        { t: "Pay a clerk to lose the third year's ledger", req: p => p.coin >= 60, check: { s: "intrigue", s2: "stewardship", d: 52 },
          win: { r: "The ledger is lost in a small fire in the archive room. Nothing else burns.", fx: { coin: -60, secret: 1 } },
          lose: { r: "The clerk takes your sixty suns straight to the treasurer.", fx: { coin: -60, prison: 1, why: "bribing a crown clerk" } } },
      ],
    },

    // ================================================================ tr_serv_knows (tr_serv_letter: read the letter; tr_serv_great_guest: listened at table)
    {
      id: "mat_serv_letter", title: "Old talk", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_serv_knows") && A.S.year - p.flags.tr_serv_knows >= 3 && C.adult(p) && !p.prison && (p.flags.ev || {}).tr_serv_letter === p.flags.tr_serv_knows,
      setup: (p, ctx) => { ctx.pid = mk(p, { sex: "F", ageAdj: 30, status: "gentry", occ: "a lady of the house" }).id; },
      text: "Years ago {them} gave you a letter sealed with plain wax, not the house seal, and you read it on the road: a plan to leave the house forever on the night of the next feast. You resealed it with a warm knife. She never went. She married as the house wished. Now her husband has heard old talk, and asks you, as an old servant, what you know.",
      choices: [
        { t: "Tell him what the letter said", r: "He thanks you with a silver penny. That night there is shouting in the house again. {them} is sent to her mother's manor in the hills, and you become the husband's man.",
          fx: { coin: 5, perf: 6, honor: -3, them: { type: "enemy", op: -50, back: "enemy" } } },
        { t: "Swear you never knew a thing", check: { s: "deception", s2: "ins", d: 45 },
          win: { r: "He believes you, or decides to. {them} passes you in the hall that evening and touches your sleeve, once.",
            fx: { owed: 1, them: { type: "friend", op: 35, back: "friend" } } },
          lose: { r: "He has already asked the steward, who remembers you on the road that day. You are turned out without a character.",
            fx: (p, ctx) => { const lost = p.job && p.job.c === "servant" && !p.flags.unfree; if (lost) p.job = null; return fx(p, ctx, { happy: -8, them: { type: "friend", op: 20, back: "friend" } }) + (lost ? " (You lose your place.)" : ""); } } },
        { t: "Go to her first, and let her choose", r: "She hears you out in the window-seat, very still. Then she tells her husband herself, all of it, before supper. The house is cold for a year. She never forgets who came to her first.",
          fx: { perf: -4, them: { type: "bestfriend", op: 40, back: "bestfriend" } } },
      ],
    },
    {
      id: "mat_serv_guest", title: "What the guest feared", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_serv_knows") && A.S.year - p.flags.tr_serv_knows >= 2 && C.adult(p) && C.job(p, "servant") && !p.prison && (p.flags.ev || {}).tr_serv_great_guest === p.flags.tr_serv_knows,
      setup: (p, ctx) => { ctx.pid = mk(p, { ageAdj: 45, status: "artisan", occ: "steward to a great house" }).id; },
      text: "At the great dinner you ran the high table, and listened. By the sweet course you knew what the guest wanted from your master, and what the guest feared. Now your master and that guest are bargaining in earnest, and the guest's own steward, {them}, finds you in the yard. {theyHe} would pay well to know how far your master will go.",
      choices: [
        { t: "Sell {themHim} what you know", r: "Forty suns, counted out behind the stable. Your master signs a worse bargain than he hoped and never learns why. {them} nods to you in the street after that.",
          fx: { coin: 40, honor: -4, them: { type: "friend", op: 20, back: "friend" } } },
        { t: "Tell your master what the guest fears", r: "You tell him in the pantry, low. He uses it at the next meeting and gets everything he wanted. He raises your wage, and watches you more closely.",
          fx: { coin: 10, perf: 8, bossOp: 15, them: { type: "rival", op: -20, back: "rival" } } },
        { t: "Keep it, and keep your place", r: "{them} goes away with nothing. Your master's business goes as it goes. You know what you know.",
          fx: { wil: 0.5, them: { type: "acquaint", op: -10, back: "acquaint" } } },
      ],
    },

    // ================================================================ tr_serv_loyal (tr_serv_great_house: "Stay with your old master")
    {
      id: "mat_loyal_debts", title: "Anything put by", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_serv_loyal") && A.S.year - p.flags.tr_serv_loyal >= 3 && C.adult(p) && !p.prison,
      setup: (p, ctx) => {
        const b = p.job && p.job.c === "servant" && A.superior ? A.superior(p) : null;
        ctx.pid = (b || mk(p, { sex: "M", ageAdj: 70, status: "artisan", occ: "your old master" })).id;
      },
      text: "{them}, the old master who wept when you turned down the great house and wrote you into {theirHis} will, is older and poorer now. A moneylender came this morning with {theirHis} bond and left with the silver salt. Your wages are three quarters behind. Tonight {theyHe} asks, ashamed, whether you have anything put by.",
      choices: [
        { t: "Lend {themHim} your savings", req: p => p.coin >= 40, r: "You bring it down in a stocking. {theyHe} cannot speak. In the spring {theyHe} adds a line to the will in a shaking hand, and has the steward witness it.",
          fx: { coin: -40, honor: 3, owed: 1, them: { op: 30 } } },
        { t: "Go to the moneylender yourself", check: { s: "persuasion", s2: "trade", d: 50 },
          win: { r: "The moneylender knows a good bond when he sees one. He takes a new one at half the interest, with your name beside your master's.",
            fx: { skill: { trade: 2 }, them: { op: 25 } } },
          lose: { r: "The moneylender laughs and sends you home. Next week he takes the chairs.", fx: { happy: -4, them: { op: 10 } } } },
        { t: "Take the great house's place after all", r: "The steward of the great house remembers you, and has a place. Your old master writes you a character in {theirHis} own hand and does not ask you to stay.",
          fx: { coin: 10, perf: 3, happy: -4, unflag: "tr_serv_loyal", them: { op: -10 } } },
      ],
    },

    // ================================================================ tr_serv_saved (tr_serv_cup: "Stumble and spill it")
    {
      id: "mat_cup_again", title: "The same hand", w: 3, once: true,
      cond: (p, C) => C.flag(p, "tr_serv_saved") && A.S.year - p.flags.tr_serv_saved >= 3 && C.adult(p) && C.job(p, "servant") && !p.prison,
      setup: (p, ctx) => { ctx.pid = mk(p, { ageAdj: 45, status: "gentry", occ: "a guest at your master's table" }).id; },
      text: "{them} is at your master's table again tonight, laughing at the jokes. You know that hand. You saw it pass over your master's cup at the high table, years ago, and something small drop into the wine. You stumbled and spilled it, and were cursed and sent to the kitchens. Your master still does not know.",
      choices: [
        { t: "Tell your master tonight, in private", check: { s: "persuasion", s2: "wil", d: 50 },
          win: { r: "He listens with his knife still in his hand. Then he is very kind to his guest for the rest of the evening. You hear later that the guest's horse fell on the road home.",
            fx: { perf: 10, rep: 6, bossOp: 20, them: { type: "enemy", op: -50, back: "enemy" } } },
          lose: { r: "'Years ago? A spilled cup?' He sends you back to the kitchens, and {them} hears that a servant has been talking.",
            fx: { perf: -6, them: { type: "enemy", op: -40, back: "enemy" } } } },
        { t: "Pour {them}'s cup yourself, all night", r: "Every cup at that end of the table passes through your hands. {them} notices, and smiles at you over the rim. You both know.",
          fx: { wil: 1, them: { type: "rival", op: -20, back: "rival" } } },
        { t: "Let {themHim} know you saw", r: "A word as you take the plate: 'I was the one who stumbled.' Next morning there are ten suns in your box, and no note.",
          fx: { coin: 10, honor: -3, secret: 1, them: { type: "acquaint", op: 10, back: "acquaint" } } },
      ],
    },
  ]);
})();
